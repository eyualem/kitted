// Fit check ready (specs/notifications.md NT6): he left the app while a check was being scored, and the score came back
// while it was still in the background. On leaving, the checks then scoring are watched and iOS is asked for extra time;
// a watched check that scores sends one line (its fix count, never the score), once; anything else ends the watch.
// Coming back to the app ends it too: the score is in the chat.
import type { KittedStore } from '@/data/store';
import { KV } from '@/data/store';
import { parseReadySwitch } from '@/features/settings/prefs';
import type { BackgroundWork, NotificationPermissions, NotificationScheduler } from '@/services/notifications';
import { readyBody } from './nudges';

export interface ReadyDeps {
  store: KittedStore;
  built: () => boolean;
  permissions: NotificationPermissions;
  scheduler: NotificationScheduler;
  background: BackgroundWork;
  ageBlocked: () => Promise<boolean>;
}

export function createReadyWatch(d: ReadyDeps) {
  let away = false;
  let watched = new Set<string>();
  let task: string | null = null;
  const sent = new Set<string>();

  let chain: Promise<unknown> = Promise.resolve();
  const queued = (fn: () => Promise<void>): Promise<void> => {
    const next = chain.then(fn, fn);
    chain = next.catch(() => {});
    return next;
  };

  const endTask = () => {
    if (task !== null) d.background.end(task);
    task = null;
  };

  async function allowed(): Promise<boolean> {
    if (!d.built() || (await d.ageBlocked())) return false;
    if ((await d.permissions.permission()) !== 'granted') return false;
    return parseReadySwitch(await d.store.getKv(KV.notifyReady));
  }

  return {
    appState: (s: 'active' | 'background' | 'inactive') =>
      queued(async () => {
        if (s !== 'background') {
          // Back in the app (or the app switcher on the way back): nothing to tell him.
          if (away || task !== null) {
            away = false;
            watched = new Set();
            endTask();
          }
          return;
        }
        if (away) return;
        away = true;
        watched = new Set((await d.store.fitChecks.all()).filter((c) => c.status === 'scoring').map((c) => c.id));
        if (watched.size > 0) task = await d.background.begin();
      }),

    checksChanged: () =>
      queued(async () => {
        if (!away || watched.size === 0) return;
        for (const id of [...watched]) {
          const c = await d.store.fitChecks.get(id);
          if (c && c.status === 'scoring') continue;
          watched.delete(id);
          // Failed, unreadable, not clothed, held, asking (waits for his tap), or no score: nothing is sent.
          if (!c || c.status !== 'scored' || c.score === null || sent.has(id)) continue;
          if (!(await allowed())) continue;
          sent.add(id);
          const fixCount = c.fixes.filter((f, i, all) => all.findIndex((g) => g.copy === f.copy) === i).length;
          await d.scheduler.presentNow({ id: `ready|${id}`, body: readyBody(fixCount), atMs: null, data: { kind: 'ready', checkId: id } });
        }
        if (watched.size === 0) endTask();
      }),
  };
}

export type ReadyWatch = ReturnType<typeof createReadyWatch>;

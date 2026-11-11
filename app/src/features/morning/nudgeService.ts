// The daily nudge (specs/notifications.md NT2–NT4): on every open, return and leave the phone's schedule is replaced with
// the next 7 days; after a week with no visit the schedule runs out and the next open asks Kit's comeback question once;
// You → Notifications' switches and time come through here. Everything is on the phone (a local schedule, no server).
// The rules are pure (nudges.ts); this holds the store's keys, the order of the checks and the writes.
import { localParts } from '@kitted/core';
import { KV, type KittedStore } from '@/data/store';
import type { ChatMessage } from '@/data/types';
import { parseIdeaTime, saveIdeaTime } from '@/features/settings/prefs';
import type { Clock } from '@/services/clock';
import type { LocalNotification, NotificationPermissions, NotificationScheduler, NotifyPermission } from '@/services/notifications';
import { CHECK_NUDGE_KV, landsToday, NOTIFY_KV, nudgeBody, nudgeLines, nudgeTimes, setNotifyKv, type NudgeLine } from './nudges';

export interface NudgeDeps {
  store: KittedStore;
  clock: Clock;
  ids: (prefix: string) => string;
  /** NOTIFICATIONS_BUILT and the native module present, or a demo script. */
  built: () => boolean;
  permissions: NotificationPermissions;
  scheduler: NotificationScheduler;
  /** The morning service's canSuggest (T55): two outfits that work, at that moment. */
  canSuggest: (atMs: number) => Promise<boolean>;
  /** The under-18 lock. */
  ageBlocked: () => Promise<boolean>;
  /** Resolves once today's card (morning.ensureCard) has settled, so a card posted on open sits under it. */
  afterTodaysCard: () => Promise<void>;
}

export type Trigger = 'open' | 'foreground' | 'background' | 'change';

export type RescheduleResult =
  | { kind: 'scheduled'; atMs: number[]; lines: NudgeLine[] }
  | { kind: 'cancelled'; why: 'unbuilt' | 'age' | 'permission' | 'off' }
  | { kind: 'paused' }
  | { kind: 'comeback'; messageId: string };

type CardState = 'open' | 'picking' | 'on' | 'declined';
const answerable = (m: ChatMessage | null, question: 'comeback' | 'notify'): m is ChatMessage =>
  !!m && m.cardType === 'question' && m.payload.question === question && (m.payload.state === 'open' || m.payload.state === 'picking' || m.payload.state === undefined);

const num = (raw: string | null): number | null => {
  if (raw === null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

/** The local calendar date of an instant, for a nudge's id. */
function localDate(ms: number, clock: Clock): string {
  const p = localParts(ms, clock.offset);
  return `${p.y}-${p.m < 10 ? `0${p.m}` : p.m}-${p.d < 10 ? `0${p.d}` : p.d}`;
}

export function createNudgeService(d: NudgeDeps) {
  const { store, clock } = d;
  const now = () => clock.nowMs();
  const kv = (k: string) => store.getKv(k);
  const ideaTime = async () => parseIdeaTime((await store.profile.get('me'))?.ideaTime);

  // One change at a time: an open, a return and a switch can land together.
  let chain: Promise<unknown> = Promise.resolve();
  function queued<T>(fn: () => Promise<T>): Promise<T> {
    const next = chain.then(fn, fn);
    chain = next.catch(() => {});
    return next;
  }

  /** A nudge whose time has passed was delivered (iOS off at that moment still counts: Kitted can't know). */
  async function settleDelivered(): Promise<void> {
    const t = now();
    const big = num(await kv(NOTIFY_KV.bigEnoughAt));
    if (big !== null && big <= t) await setNotifyKv(store, NOTIFY_KV.bigEnoughDone, '1');
    const check = num(await kv(CHECK_NUDGE_KV.checkAt));
    if (check !== null && check <= t) await setNotifyKv(store, CHECK_NUDGE_KV.checkDone, '1');
  }

  /** Nothing scheduled: what hadn't fired yet is forgotten, so it comes again on the next schedule. */
  async function cancelEverything(): Promise<void> {
    await settleDelivered();
    await d.scheduler.cancelAll();
    for (const k of [NOTIFY_KV.through, NOTIFY_KV.bigEnoughAt, CHECK_NUDGE_KV.checkAt]) await store.deleteKv(k);
  }

  async function schedule(): Promise<RescheduleResult> {
    await settleDelivered();
    const t = now();
    const times = nudgeTimes(t, await ideaTime(), clock.offset);
    const can: boolean[] = [];
    for (const at of times) can.push(await d.canSuggest(at));
    const lines = nudgeLines(can, (await kv(NOTIFY_KV.bigEnoughDone)) === '1', (await kv(CHECK_NUDGE_KV.checkDone)) === '1');
    const list: LocalNotification[] = times.map((at, i) => ({ id: `nudge|${localDate(at, clock)}`, body: nudgeBody(lines[i]!), atMs: at, data: { kind: 'nudge' } }));
    await d.scheduler.replaceNudges(list);
    await setNotifyKv(store, NOTIFY_KV.through, String(times[times.length - 1]));
    const big = lines.indexOf('bigEnough');
    if (big >= 0) await setNotifyKv(store, NOTIFY_KV.bigEnoughAt, String(times[big]));
    else await store.deleteKv(NOTIFY_KV.bigEnoughAt);
    const check = lines.indexOf('check');
    if (check >= 0) await setNotifyKv(store, CHECK_NUDGE_KV.checkAt, String(times[check]));
    else await store.deleteKv(CHECK_NUDGE_KV.checkAt);
    return { kind: 'scheduled', atMs: times, lines };
  }

  /** At the end of today's thread, under everything already there. */
  async function postComeback(): Promise<string> {
    const all = await store.chat.all();
    const last = all.reduce((a, m) => Math.max(a, m.createdAt), 0);
    const m: ChatMessage = {
      id: d.ids('M'), createdAt: Math.max(now(), last + 1), role: 'stylist', kind: 'card', text: null, cardType: 'question', fitCheckId: null, outfitId: null,
      itemId: null, chips: [], payload: { question: 'comeback', state: 'open', time: await ideaTime() },
    };
    await store.chat.put(m);
    return m.id;
  }

  async function reschedule(trigger: Trigger): Promise<RescheduleResult> {
    if (!d.built()) return { kind: 'cancelled', why: 'unbuilt' };
    const stop = async (why: 'age' | 'permission' | 'off'): Promise<RescheduleResult> => {
      await cancelEverything();
      return { kind: 'cancelled', why };
    };
    if (await d.ageBlocked()) return stop('age');
    if ((await d.permissions.permission()) !== 'granted') return stop('permission');
    if ((await kv(KV.notifyIdea)) !== '1') return stop('off');
    if ((await kv(NOTIFY_KV.paused)) === '1') return { kind: 'paused' };
    const through = num(await kv(NOTIFY_KV.through));
    if (through !== null && now() > through && (await kv(NOTIFY_KV.comebackFor)) !== String(through)) {
      // A week with no visit: the schedule ran out. Only an open (or a return) asks; leaving waits for it.
      if (trigger !== 'open' && trigger !== 'foreground') return { kind: 'paused' };
      await d.afterTodaysCard();
      const messageId = await postComeback();
      await setNotifyKv(store, NOTIFY_KV.paused, '1');
      await setNotifyKv(store, NOTIFY_KV.comebackFor, String(through));
      return { kind: 'comeback', messageId };
    }
    return schedule();
  }

  async function patchCard(m: ChatMessage, p: Record<string, unknown>): Promise<void> {
    await store.chat.put({ ...m, payload: { ...m.payload, ...p } });
  }

  /** Back on from a comeback answer: the switch on, the pause over, the next 7 days scheduled. */
  async function resume(m: ChatMessage, time: string): Promise<void> {
    const when = landsToday(now(), time, clock.offset) ? 'today' : 'tomorrow';
    await store.setKv(KV.notifyIdea, '1');
    await store.deleteKv(NOTIFY_KV.paused);
    await store.deleteKv(NOTIFY_KV.through);
    await reschedule('change');
    await patchCard(m, { state: 'on' satisfies CardState, time, when });
  }

  /** The switch turned on in You → Notifications: an open ask becomes its done line, an open comeback its back-on line
   *  (DESIGN Q1, Q8), so a later tap on their No thanks can't undo it. */
  async function closeOpenCards(time: string): Promise<void> {
    const when = landsToday(now(), time, clock.offset) ? 'today' : 'tomorrow';
    for (const m of await store.chat.all()) {
      if (answerable(m, 'notify')) await patchCard(m, { state: 'allowed', time, when });
      else if (answerable(m, 'comeback')) await patchCard(m, { state: 'on', time, when });
    }
  }

  const getCard = async (id: string) => {
    const m = await store.chat.get(id);
    return answerable(m, 'comeback') ? m : null;
  };

  return {
    reschedule: (trigger: Trigger) => queued(() => reschedule(trigger)),

    /** You → Notifications' daily switch. On: his yes is saved first, then iOS is asked if it never was. */
    async setIdea(on: boolean): Promise<NotifyPermission> {
      if (!on) {
        return queued(async () => {
          await store.setKv(KV.notifyIdea, '0');
          await store.deleteKv(NOTIFY_KV.paused);
          if (d.built()) await cancelEverything();
          return d.permissions.permission();
        });
      }
      await store.setKv(KV.notifyIdea, '1');
      let p = await d.permissions.permission();
      if (p === 'undetermined') p = await d.permissions.request();
      if (p !== 'granted') return p;
      await queued(async () => {
        await store.deleteKv(NOTIFY_KV.paused);
        await store.deleteKv(NOTIFY_KV.through);
        const res = await reschedule('change');
        if (res.kind === 'scheduled') await closeOpenCards(await ideaTime());
      });
      return p;
    },

    /** You → Notifications' Fit check ready switch. On from never asked shows Apple's prompt. */
    async setReady(on: boolean): Promise<NotifyPermission> {
      await store.setKv(KV.notifyReady, on ? '1' : '0');
      const p = await d.permissions.permission();
      return on && p === 'undetermined' ? d.permissions.request() : p;
    },

    /** A new get-dressed time: saved, and all 7 moved at once. */
    setTime: (hhmm: string) =>
      queued(async () => {
        await saveIdeaTime(store, hhmm);
        await reschedule('change');
      }),

    /** Turn them back on. */
    comebackOn: (messageId: string) =>
      queued(async () => {
        const m = await getCard(messageId);
        if (m) await resume(m, await ideaTime());
      }),

    /** Change the time: the time row takes the button's place (nothing saved yet). */
    comebackShowTime: (messageId: string) =>
      queued(async () => {
        const m = await getCard(messageId);
        if (m && m.payload.state !== 'picking') await patchCard(m, { state: 'picking' satisfies CardState });
      }),

    /** A time picked in the comeback card: saved, and back on at once. */
    comebackPickTime: (messageId: string, hhmm: string) =>
      queued(async () => {
        const m = await getCard(messageId);
        if (!m) return;
        const time = parseIdeaTime(hhmm);
        await saveIdeaTime(store, time);
        await resume(m, time);
      }),

    /** No thanks: the switch saved off, nothing scheduled. */
    comebackNo: (messageId: string) =>
      queued(async () => {
        const m = await getCard(messageId);
        if (!m) return;
        await store.setKv(KV.notifyIdea, '0');
        await store.deleteKv(NOTIFY_KV.paused);
        if (d.built()) await cancelEverything();
        await patchCard(m, { state: 'declined' satisfies CardState });
      }),

    /** "Delete all my data": every scheduled nudge goes (the wipe clears the keys). */
    cancelAll: () => d.scheduler.cancelAll(),

    async paused(): Promise<boolean> {
      return (await kv(NOTIFY_KV.paused)) === '1';
    },
  };
}

export type NudgeService = ReturnType<typeof createNudgeService>;

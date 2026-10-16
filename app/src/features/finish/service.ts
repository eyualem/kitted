// The end of onboarding's plumbing (10-onboarding.md §9.1): posts "Your first 3 moves", opens the paywall once, posts
// the notification ask, and answers it. The rules are pure (sequence.ts); this holds the visit clock, the waits, the
// guard against running twice, and the writes. Stylist calls ensure() on focus, on coming back to the front, and after
// a check changes.
import type { ChatMessage, FitCheckRow } from '@/data/types';
import type { KittedStore } from '@/data/store';
import { nextVisitStart } from '@/features/account/offer';
import { parseIdeaTime, saveIdeaTime, setNotificationPref } from '@/features/settings/prefs';
import { t } from '@/i18n/en';
import { isRecheckOpen } from '@/services/quota';
import type { Clock } from '@/services/clock';
import type { NotificationPermissions } from '@/services/notifications';
import { pickBuy } from './moves';
import {
  holdsOffer, movesDue, notifyAskable, notifyDue, parseFinish, paywallDue, type FinishCheck, type FinishState,
} from './sequence';

export const FINISH_KEY = 'onboard.finish';
/** Starter rows marked without a closet piece (the belt), 02 C5. */
export const STARTER_MARKS_KEY = 'starter.marked';

export type NotifyCardState = 'open' | 'picking' | 'allowed' | 'denied' | 'declined';

export interface FinishDeps {
  store: KittedStore;
  clock: Clock;
  ids: (prefix: string) => string;
  /** A check is reading or waiting for the one quick tap. */
  busy: () => boolean;
  /** Off on demo screens that aren't about this sequence (their stories stay as they were). */
  enabled?: () => boolean;
  paywallOn: () => boolean;
  isPro: () => boolean;
  notificationsOn: () => boolean;
  notifications: NotificationPermissions;
  /** Stylist is the screen in front (no sheet, camera or other tab). */
  stylistInFront: () => boolean;
  /** Presents the paywall (the onboarding placement). */
  openPaywall: () => void;
  /** Runs `fn` after `ms` (a real timer in the app, a fake in tests). */
  later: (fn: () => void, ms: number) => void;
}

export async function getFinish(store: Pick<KittedStore, 'getKv'>): Promise<FinishState> {
  return parseFinish(await store.getKv(FINISH_KEY));
}

export async function getStarterMarks(store: Pick<KittedStore, 'getKv'>): Promise<string[]> {
  try {
    const v = JSON.parse((await store.getKv(STARTER_MARKS_KEY)) ?? '[]') as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function toFinishChecks(rows: readonly FitCheckRow[], nowMs: number, clock: Clock): FinishCheck[] {
  return rows.map((c) => ({
    id: c.id, createdAt: c.createdAt, status: c.status, parentId: c.parentId,
    fixCount: c.fixes.filter((f, i, all) => all.findIndex((g) => g.copy === f.copy) === i).length,
    recheckOpen: isRecheckOpen(c, nowMs, clock),
  }));
}

export function createFinishService(deps: FinishDeps) {
  let visitStart: number | null = null;
  let leftAt: number | null = null;
  let checksChangedAt: number | null = null;
  let inflight: Promise<void> | null = null;
  let again = false;
  /** The onboarding paywall is on screen in this run (a quit leaves step 'paywall' with this false: counts as closed). */
  let paywallOpenNow = false;
  let waitingUntil = 0;
  const now = () => deps.clock.nowMs();

  const save = (s: FinishState) => deps.store.setKv(FINISH_KEY, JSON.stringify(s));
  const checks = async () => toFinishChecks(await deps.store.fitChecks.all(), now(), deps.clock);
  const message = (o: Partial<ChatMessage> & Pick<ChatMessage, 'kind'>): ChatMessage => ({
    id: deps.ids('M'), createdAt: now(), role: 'stylist', text: null, cardType: null, fitCheckId: null, outfitId: null, itemId: null, chips: [], payload: {}, ...o,
  });
  const wake = (at: number) => {
    if (at <= waitingUntil && waitingUntil > now()) return;
    waitingUntil = at;
    deps.later(() => {
      waitingUntil = 0;
      void service.ensure();
    }, Math.max(0, at - now()) + 20);
  };

  async function postNotifyOrFinish(s: FinishState): Promise<FinishState> {
    const permission = await deps.notifications.permission();
    if (!notifyAskable(deps.notificationsOn(), permission)) {
      const done: FinishState = { ...s, step: 'done' };
      await save(done);
      return done;
    }
    const p = await deps.store.profile.get('me');
    const m = message({ kind: 'card', cardType: 'question', text: null, payload: { question: 'notify', state: 'open', time: parseIdeaTime(p?.ideaTime) } });
    m.createdAt = Math.max(m.createdAt, (s.lastAt ?? 0) + 2); // always under the moves card, even in the same millisecond
    await deps.store.chat.put(m);
    const done: FinishState = { ...s, step: 'done', notifyMsgId: m.id, lastAt: now() };
    await save(done);
    return done;
  }

  const enabled = deps.enabled ?? (() => true);

  async function run(): Promise<void> {
    if (!enabled()) return;
    let s = await getFinish(deps.store);
    if (s.step === 'done' || s.step === 'skipped') return;
    const visit = visitStart ?? now();

    if (s.step === 'waiting') {
      const d = movesDue({ state: s, checks: await checks(), busy: deps.busy(), visitStartMs: visit, nowMs: now(), checksChangedAt });
      if (d.kind === 'skip') {
        await save({ ...s, step: 'skipped' });
        return;
      }
      if (d.kind === 'wait') {
        wake(d.at);
        return;
      }
      if (d.kind !== 'post') return;
      const first = await deps.store.fitChecks.get(d.checkId);
      if (!first) return;
      const buyId = pickBuy({ first, recheck: null, closet: await deps.store.closet.all(), styles: (await deps.store.profile.get('me'))?.styles ?? null, markedKv: await getStarterMarks(deps.store) });
      const intro = message({ kind: 'text', text: t('plan.intro') });
      const card = message({ kind: 'card', cardType: 'plan', fitCheckId: d.checkId, payload: { buyId, why: d.why } });
      card.createdAt = intro.createdAt + 1;
      await deps.store.chat.put(intro);
      await deps.store.chat.put(card);
      s = { ...s, step: 'moves', checkId: d.checkId, movesMsgId: card.id, movesAt: now(), lastAt: now() };
      await save(s);
    }

    if (s.step === 'moves') {
      const d = paywallDue({ state: s, paywallOn: deps.paywallOn(), isPro: deps.isPro(), stylistInFront: deps.stylistInFront(), busy: deps.busy(), nowMs: now() });
      if (d.kind === 'wait') {
        wake(d.at);
        return;
      }
      if (d.kind === 'skip') {
        if (notifyDue(s, { paywallClosed: false, paywallSkipped: true })) await postNotifyOrFinish(s);
        return;
      }
      if (d.kind !== 'open') return;
      // Marked shown before it opens: quitting here counts as shown (ruling 23).
      s = { ...s, step: 'paywall', paywallAt: now(), lastAt: now() };
      await save(s);
      paywallOpenNow = true;
      deps.openPaywall();
      return;
    }

    if (s.step === 'paywall' && notifyDue(s, { paywallClosed: !paywallOpenNow, paywallSkipped: false })) await postNotifyOrFinish(s);
  }

  const service = {
    /** The app went to the background / came back (AppState). */
    left() {
      leftAt = now();
    },
    back() {
      if (visitStart !== null) visitStart = nextVisitStart(visitStart, leftAt, now());
      leftAt = null;
    },
    /** Demo screens whose link opens the paywall itself: as if this sequence had opened it (it's on screen now). */
    async paywallOpenedByLink(): Promise<void> {
      const s = await getFinish(deps.store);
      if (s.step !== 'moves') return;
      paywallOpenNow = true;
      await save({ ...s, step: 'paywall', paywallAt: now(), lastAt: now() });
    },
    /** Demo screens: a fresh run whose visit started at `visitStartMs` (before the story's checks), nothing open. */
    reset(visitStartMs: number) {
      visitStart = visitStartMs;
      leftAt = null;
      checksChangedAt = null;
      paywallOpenNow = false;
      waitingUntil = 0;
    },
    /** A check changed (a score landed, a re-check, the closet call): the moves card waits for the reveal. */
    checksChanged() {
      checksChangedAt = now();
    },
    /** Runs the sequence once more. A call while a run is in flight waits for that run, which goes round again. */
    ensure(): Promise<void> {
      if (visitStart === null) visitStart = now();
      if (inflight) {
        again = true;
        return inflight;
      }
      inflight = (async () => {
        try {
          do {
            again = false;
            await run();
          } while (again);
        } finally {
          inflight = null;
        }
      })();
      return inflight;
    },
    /** `Later` on his first check (L1): the moves card follows at once. */
    async later(checkId: string): Promise<void> {
      const s = await getFinish(deps.store);
      if (s.step !== 'waiting' || s.laterAt !== null) return;
      await save({ ...s, checkId, laterAt: now() });
      await service.ensure();
    },
    /** The onboarding paywall closed (X, Continue free, or a purchase). */
    async paywallClosed(): Promise<void> {
      paywallOpenNow = false;
      await service.ensure();
    },
    /** Does the save offer wait (§9.1)? */
    async holdsOffer(): Promise<boolean> {
      if (!enabled()) return false;
      const s = await getFinish(deps.store);
      const visit = visitStart ?? now();
      const d = s.step === 'waiting' ? movesDue({ state: s, checks: await checks(), busy: false, visitStartMs: visit, nowMs: now(), checksChangedAt }) : null;
      return holdsOffer(s, visit, d?.kind === 'post' || d?.kind === 'wait');
    },
    // ── The notification ask (S15) ──────────────────────────────────────────────────────────────────────────────
    async notifyYes(messageId: string): Promise<void> {
      await patchNotify(messageId, { state: 'picking' });
    },
    async notifyPickTime(messageId: string, hhmm: string): Promise<void> {
      await patchNotify(messageId, { time: parseIdeaTime(hhmm) });
    },
    /** `Set {time}`: the only place the system prompt is asked. */
    async notifySet(messageId: string): Promise<NotifyCardState> {
      const m = await deps.store.chat.get(messageId);
      if (!m || m.payload.state !== 'picking') return (m?.payload.state as NotifyCardState) ?? 'open';
      const time = parseIdeaTime(typeof m.payload.time === 'string' ? m.payload.time : null);
      const answer = await deps.notifications.request();
      if (answer === 'granted') {
        await saveIdeaTime(deps.store, time);
        await setNotificationPref(deps.store, 'idea', true);
        await patchNotify(messageId, { state: 'allowed', time });
        return 'allowed';
      }
      await patchNotify(messageId, { state: 'denied' });
      return 'denied';
    },
    /** `No thanks`: the system prompt is never shown; the daily idea's switch is saved off. */
    async notifyNo(messageId: string): Promise<void> {
      await setNotificationPref(deps.store, 'idea', false);
      await patchNotify(messageId, { state: 'declined' });
    },
  };

  async function patchNotify(id: string, p: Record<string, unknown>): Promise<void> {
    const m = await deps.store.chat.get(id);
    if (!m || m.payload.question !== 'notify') return;
    const st = m.payload.state;
    if (st === 'allowed' || st === 'denied' || st === 'declined') return; // answered: never changes again (N3)
    await deps.store.chat.put({ ...m, payload: { ...m.payload, ...p } });
  }

  return service;
}

export type FinishService = ReturnType<typeof createFinishService>;

// Posting Kit's "About you" card (10-onboarding.md §10–§11, #373, #375) when aboutYouDue says so: under an answer that
// would use his fit preference (afterAnswer, from the ask pipeline), or on a later visit (ensure, from Stylist). The
// rule is pure (rules.ts); this is the plumbing: the visit clock, one post at a time, Not now and the one-tap pick.
import type { ChatMessage } from '@/data/types';
import type { KittedStore } from '@/data/store';
import { FINISH_KEY } from '@/features/finish/service';
import { parseFinish } from '@/features/finish/sequence';
import { nextVisitStart } from '@/features/account/offer';
import { draftOf, saveDraft } from '@/features/you/profile';
import type { FitPref } from '@/features/onboarding/basics';
import { ABOUT_YOU_KEY, aboutYouDue, fitGiven, parseAboutYou, type AboutYouState, type AboutYouTrigger } from './rules';

export interface AboutYouDeps {
  store: Pick<KittedStore, 'getKv' | 'setKv' | 'fitChecks' | 'chat' | 'profile'>;
  now: () => number;
  ids: (prefix: string) => string;
  /** A check is reading or waiting for the one quick tap. */
  busy: () => boolean;
  /** Another ask is due, under way or posted this visit (the end-of-onboarding sequence, the save offer). */
  held: (visitStartMs: number) => Promise<boolean>;
  enabled?: () => boolean;
}

/** The save offer ("Keep your fits") posted at or after `sinceMs`: it was this visit's ask. */
export async function accountPostedSince(store: Pick<KittedStore, 'chat'>, sinceMs: number): Promise<boolean> {
  return (await store.chat.all()).some((m) => m.cardType === 'account' && m.createdAt >= sinceMs);
}

export function createAboutYouService(deps: AboutYouDeps) {
  let visitStart: number | null = null;
  let leftAt: number | null = null;
  let running = false;
  const enabled = deps.enabled ?? (() => true);
  const visit = () => (visitStart ??= deps.now());

  const getState = async () => parseAboutYou(await deps.store.getKv(ABOUT_YOU_KEY));
  const setState = (s: AboutYouState) => deps.store.setKv(ABOUT_YOU_KEY, JSON.stringify(s));

  const post = async (trigger: AboutYouTrigger, at: number): Promise<string | null> => {
    if (running || !enabled()) return null;
    running = true;
    try {
      const start = visit();
      const [state, profile, all, finish] = await Promise.all([getState(), deps.store.profile.get('me'), deps.store.fitChecks.all(), deps.store.getKv(FINISH_KEY)]);
      const checks = all.map((c) => ({ createdAt: c.createdAt, status: c.status, recheck: c.parentId !== null }));
      const busy = deps.busy() || all.some((c) => c.status === 'scoring' || c.status === 'asking');
      const d = aboutYouDue({
        trigger, state, fitGiven: fitGiven(profile), checks, busy, held: !busy && (await deps.held(start)),
        finishStep: parseFinish(finish).step, visitStartMs: start, nowMs: deps.now(),
      });
      if (d.kind !== 'post') return null;
      const id = deps.ids('M');
      const m: ChatMessage = {
        id, createdAt: at, role: 'stylist', kind: 'card', text: null, cardType: 'aboutYou', fitCheckId: null, outfitId: null,
        itemId: null, chips: [], payload: { variant: d.variant, state: 'open' },
      };
      await deps.store.chat.put(m);
      await setState({ ...state, posts: state.posts + 1, lastPostAt: deps.now() });
      return id;
    } finally {
      running = false;
    }
  };

  const mark = async (messageId: string | null, state: 'declined' | 'saved') => {
    const m = messageId ? await deps.store.chat.get(messageId) : null;
    if (m) await deps.store.chat.put({ ...m, payload: { ...m.payload, state } });
  };

  return {
    /** The app went to the background / came back (AppState): a return after 30 min is a new visit. */
    left() {
      leftAt = deps.now();
    },
    back() {
      if (visitStart !== null) visitStart = nextVisitStart(visitStart, leftAt, deps.now());
      leftAt = null;
    },
    /** T2: Stylist in front (focus, a return, a few seconds after a check changes). */
    ensure: () => post({ kind: 'visit' }, deps.now()),
    /** T1: right after an answer is in the thread. Never after a refused or gate-emptied one (a failed, limited or
     *  offline answer never reaches here). The card sits right under it. */
    async afterAnswer(a: { kind: string | null; at: number; refused?: boolean; uncounted?: boolean }): Promise<string | null> {
      if (a.refused || a.uncounted) return null;
      return post({ kind: 'answer', answerKind: a.kind }, a.at + 1);
    },
    /** The card posted this visit: the save offer waits for the next one (one ask per visit). */
    async postedThisVisit(): Promise<boolean> {
      const s = await getState();
      return s.lastPostAt !== null && s.lastPostAt >= visit();
    },
    async notNow(messageId: string): Promise<void> {
      await mark(messageId, 'declined');
      await setState({ ...(await getState()), declinedAt: deps.now() });
    },
    /** A tap on Fitted, Regular or Relaxed: saved through You's own code (features/you/profile.ts), so the two write
     *  the same way; only the fit changes. */
    async pick(messageId: string, fit: FitPref): Promise<void> {
      const p = await deps.store.profile.get('me');
      if (!p) return;
      await saveDraft(deps.store, { ...draftOf(p), fit }, deps.now());
      await mark(messageId, 'saved');
    },
  };
}

export type AboutYouService = ReturnType<typeof createAboutYouService>;

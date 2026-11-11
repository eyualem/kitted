// The end of onboarding (ruling 23; 10-onboarding.md §9): Result → Re-check or Later → "Your first 3 moves" → the
// paywall → the notification ask. Pure: what's due next, from the stored state (kv `onboard.finish`) and his checks.
// Once per phone, for his first fit only; each step happens once, and quitting mid-step counts as done.

import type { NotifyPermission } from '@/services/notifications';

export type FinishStep =
  /** Nothing yet: waiting for his first fit and one of the moves card's triggers. */
  | 'waiting'
  /** The moves card is posted; the paywall comes next. */
  | 'moves'
  /** The paywall was opened (marked before it opens, so quitting counts as shown). */
  | 'paywall'
  /** The notification ask is posted (or was skipped); the sequence is over. */
  | 'done'
  /** He already had several fits when this first ran (e.g. the founder's phone): no onboarding sequence. */
  | 'skipped';

export interface FinishState {
  step: FinishStep;
  /** The first full check the sequence is about. */
  checkId: string | null;
  /** He tapped Later on it. */
  laterAt: number | null;
  movesMsgId: string | null;
  movesAt: number | null;
  paywallAt: number | null;
  notifyMsgId: string | null;
  /** When the sequence last posted a card or opened the paywall (the save offer waits out that visit, §9.1). */
  lastAt: number | null;
}

export const NO_FINISH: FinishState = {
  step: 'waiting', checkId: null, laterAt: null, movesMsgId: null, movesAt: null, paywallAt: null, notifyMsgId: null, lastAt: null,
};

/** After a check changes, wait this long before the moves card: the score reveal finishes first (the save offer's 4 s). */
export const FINISH_SETTLE_MS = 4_000;
/** The paywall opens this long after the moves card lands, so he sees the card first. */
export const PAYWALL_AFTER_MS = 2_500;

const STEPS: readonly FinishStep[] = ['waiting', 'moves', 'paywall', 'done', 'skipped'];
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const str = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);

export function parseFinish(raw: string | null): FinishState {
  if (!raw) return { ...NO_FINISH };
  try {
    const v = JSON.parse(raw) as Record<string, unknown>;
    const step = STEPS.includes(v.step as FinishStep) ? (v.step as FinishStep) : 'waiting';
    return {
      step, checkId: str(v.checkId), laterAt: num(v.laterAt), movesMsgId: str(v.movesMsgId), movesAt: num(v.movesAt), paywallAt: num(v.paywallAt),
      notifyMsgId: str(v.notifyMsgId), lastAt: num(v.lastAt),
    };
  } catch {
    return { ...NO_FINISH };
  }
}

export interface FinishCheck {
  id: string;
  createdAt: number;
  status: string;
  /** A re-check (parentId set). */
  parentId: string | null;
  /** Distinct fixes on the card (0 = dialed in, or "No quick fixes": nothing to re-check). */
  fixCount: number;
  /** Its re-check can still be taken (the 30 min / 4 am window, not used). */
  recheckOpen: boolean;
}

const scoredFull = (c: FinishCheck) => c.status === 'scored' && c.parentId === null;

/** The check the sequence is about: his first scored full check. */
export function firstFull(checks: readonly FinishCheck[]): FinishCheck | null {
  return checks.filter(scoredFull).sort((a, b) => a.createdAt - b.createdAt)[0] ?? null;
}

export interface MovesInput {
  state: FinishState;
  checks: readonly FinishCheck[];
  /** A check is reading or waiting for the one quick tap. */
  busy: boolean;
  /** This visit's start (a launch, or a return after 30 min, offer.ts nextVisitStart). */
  visitStartMs: number;
  nowMs: number;
  /** When a check last changed in this run (a score landing, a re-check, the closet call); null = nothing since launch. */
  checksChangedAt: number | null;
}

export type MovesDecision =
  | { kind: 'no' }
  /** Mark the sequence skipped: he already has more than one fit. */
  | { kind: 'skip' }
  /** Post the moves card now. */
  | { kind: 'post'; checkId: string; why: 'later' | 'recheck' | 'noFix' | 'windowClosed' | 'laterVisit' }
  /** Due, but the reveal may still be playing: ask again at `at`. */
  | { kind: 'wait'; at: number };

/** Is the moves card due (§9.1 step 1)? */
export function movesDue(i: MovesInput): MovesDecision {
  if (i.state.step !== 'waiting') return { kind: 'no' };
  const full = i.checks.filter(scoredFull);
  const first = firstFull(i.checks);
  if (!first) return { kind: 'no' };
  if (full.length > 1) return { kind: 'skip' };
  if (i.busy || i.checks.some((c) => c.status === 'scoring' || c.status === 'asking')) return { kind: 'no' };
  // Later is his own tap: the card follows at once.
  if (i.state.laterAt !== null && i.state.checkId === first.id) return { kind: 'post', checkId: first.id, why: 'later' };
  const recheck = i.checks.find((c) => c.parentId === first.id && c.status === 'scored');
  const why: Extract<MovesDecision, { kind: 'post' }>['why'] | null = recheck
    ? 'recheck'
    : first.fixCount === 0
      ? 'noFix'
      : first.createdAt < i.visitStartMs
        ? 'laterVisit'
        : !first.recheckOpen
          ? 'windowClosed'
          : null;
  if (!why) return { kind: 'no' };
  // The reveal of the card that triggered it (the re-check's, or the first card's) finishes first. A later visit's
  // card was revealed long ago.
  if (why !== 'laterVisit' && why !== 'windowClosed' && i.checksChangedAt !== null) {
    const at = i.checksChangedAt + FINISH_SETTLE_MS;
    if (i.nowMs < at) return { kind: 'wait', at };
  }
  return { kind: 'post', checkId: first.id, why };
}

export interface PaywallInput {
  state: FinishState;
  /** PAYWALL_BUILT, or a demo screen. */
  paywallOn: boolean;
  isPro: boolean;
  /** Stylist is the screen in front: no sheet, no camera, no other tab. */
  stylistInFront: boolean;
  /** Reading, the one quick tap, or a reveal playing. */
  busy: boolean;
  nowMs: number;
}

export type PaywallDecision = { kind: 'no' } | { kind: 'skip' } | { kind: 'open' } | { kind: 'wait'; at: number };

/** Is the onboarding paywall due (§9.1 step 2)? */
export function paywallDue(i: PaywallInput): PaywallDecision {
  if (i.state.step !== 'moves') return { kind: 'no' };
  if (!i.paywallOn || i.isPro) return { kind: 'skip' };
  const at = (i.state.movesAt ?? 0) + PAYWALL_AFTER_MS;
  if (i.nowMs < at) return { kind: 'wait', at };
  if (!i.stylistInFront || i.busy) return { kind: 'no' };
  return { kind: 'open' };
}

export type { NotifyPermission };

/** Is the notification ask due (§9.1 step 3)? After the paywall closed (or quit: step 'paywall' on a later run), or
 *  after the moves card when the paywall step was skipped (the caller passes `paywallSkipped`). */
export function notifyDue(state: FinishState, o: { paywallClosed: boolean; paywallSkipped: boolean }): boolean {
  if (state.step === 'paywall') return o.paywallClosed;
  if (state.step === 'moves') return o.paywallSkipped;
  return false;
}

/** Kit's ask (specs/notifications.md NT1; T57's Later route uses it too): built, not under the age lock, never posted
 *  (by any route), and he hasn't set the daily switch himself in You → Notifications. iOS's own answer doesn't matter:
 *  after "Delete all my data" the ask comes again like a new user, and iOS keeps its answer through a wipe. */
export function askDue(i: { built: boolean; ageBlocked: boolean; asked: boolean; ideaKv: string | null }): boolean {
  return i.built && !i.ageBlocked && !i.asked && i.ideaKv === null;
}

/** NT1.6, the catch-up for testers whose setup finished before notifications existed: setup over ('done' or
 *  'skipped'), the ask never posted, Apple's prompt never shown, the switch never set. */
export function catchUpDue(i: { built: boolean; ageBlocked: boolean; asked: boolean; ideaKv: string | null; permission: NotifyPermission; step: FinishStep }): boolean {
  return (i.step === 'done' || i.step === 'skipped') && i.permission === 'undetermined' && askDue(i);
}

/** The save offer ("Keep your fits") waits while the sequence is due or under way, and for the rest of the visit it
 *  posted in (§9.1). `sequenceDue`: the moves card is due or waiting for its settle. */
export function holdsOffer(state: FinishState, visitStartMs: number, sequenceDue: boolean): boolean {
  if (state.step === 'moves' || state.step === 'paywall') return true;
  if (state.step === 'waiting') return sequenceDue;
  return state.lastAt !== null && state.lastAt >= visitStartMs;
}

/** `Later` (L1): only on his first-ever full check, scored, while it's his only one, before he re-checks it and before
 *  the sequence starts ("Re-check or Later", ruling 23). */
export function laterShows(state: FinishState, check: Pick<FinishCheck, 'id' | 'status' | 'parentId'>, checks: readonly FinishCheck[]): boolean {
  if (state.step !== 'waiting' || state.laterAt !== null || check.status !== 'scored' || check.parentId !== null) return false;
  if (checks.some((c) => c.parentId === check.id && c.status !== 'failed')) return false;
  const full = checks.filter(scoredFull);
  return full.length === 1 && full[0]!.id === check.id;
}

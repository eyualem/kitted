// The daily allowance (handoff/13-server.md §3, checks L1–L10), as pure functions on one account's day.
// The Firestore side (store.ts) runs these inside a transaction.
import type { Kind, RouteName } from './routes';

export type Tier = 'free' | 'pro';

/** The app's own numbers (app/src/services/quota.ts LIMITS): a re-check per check. */
export const TIERS: Record<Tier, { checks: number; rechecks: number; questions: number }> = {
  free: { checks: 1, rechecks: 1, questions: 5 },
  pro: { checks: 10, rechecks: 10, questions: 50 },
};
/** Calls on one check id: a hedged read, two look arms, the closet call and its retry, with room to spare. */
export const CALLS_PER_CHECK = 10;
/** Snaps (the shoe snap, the pants-and-shoes finish) per check or re-check. */
export const SNAPS_PER_CHECK = 2;
/** The app doesn't count an answer its sentence gate empties; the server can't see that. */
export const QUESTION_SLACK = 2;
/** Tap answers ("Is it a suit-and-tie office?") are free up to this many a day. */
export const FREE_TAPS = 10;
/** A time zone change is taken at most this often. */
export const TZ_CHANGE_MS = 20 * 3600_000;
const ROLLOVER_MIN = 4 * 60;

export interface CheckEntry {
  kind: Kind;
  calls: number;
  inflight: number;
  /** A read on it finished (STOP): the check is used. */
  ok: boolean;
}

export interface Day {
  checks: number;
  rechecks: number;
  snaps: number;
  questions: number;
  taps: number;
  photoCalls: number;
  askCalls: number;
  ids: Record<string, CheckEntry>;
}

export const emptyDay = (): Day => ({ checks: 0, rechecks: 0, snaps: 0, questions: 0, taps: 0, photoCalls: 0, askCalls: 0, ids: {} });

export type Which = 'checks' | 'rechecks' | 'snaps' | 'questions' | 'calls';

/** What a reservation took, to give back if the call fails. */
export type Took = { route: RouteName; checkId?: string; ask?: 'question' | 'tap' };

export function photoCallBudget(tier: Tier) {
  const t = TIERS[tier];
  return 10 * (t.checks + t.rechecks);
}
export function askCallBudget(tier: Tier) {
  return 3 * (TIERS[tier].questions + QUESTION_SLACK + FREE_TAPS);
}

/** The usage day (4 am local) for an instant and an offset in minutes east of UTC. */
export function usageDay(nowMs: number, tzMin: number): string {
  const d = new Date(nowMs + (tzMin - ROLLOVER_MIN) * 60_000);
  return d.toISOString().slice(0, 10);
}

/** Parses X-Kitted-Tz; anything else is UTC. */
export function parseTz(h: string | undefined): number {
  if (h === undefined || !/^-?\d{1,4}$/.test(h)) return 0;
  const n = Number(h);
  return n >= -720 && n <= 840 ? n : 0;
}

/** The offset to use: the stored one, unless it's been 20 h since the last change (L8). */
export function effectiveTz(stored: { tz: number; changedAt: number } | undefined, asked: number, nowMs: number) {
  if (!stored) return { tz: asked, changedAt: nowMs, changed: true };
  if (stored.tz === asked || nowMs - stored.changedAt < TZ_CHANGE_MS) return { tz: stored.tz, changedAt: stored.changedAt, changed: false };
  return { tz: asked, changedAt: nowMs, changed: true };
}

export type Reserve =
  | { ok: true; took: Took }
  | { ok: false; which: Which };

/** Takes one call's allowance from `day` (mutates it). */
export function reserve(day: Day, tier: Tier, route: RouteName, opts: { checkId?: string; kind?: Kind; tap?: boolean }): Reserve {
  const t = TIERS[tier];
  if (route === 'ask') {
    if (day.askCalls >= askCallBudget(tier)) return { ok: false, which: 'calls' };
    if (opts.tap && day.taps < FREE_TAPS) {
      day.taps += 1;
      day.askCalls += 1;
      return { ok: true, took: { route, ask: 'tap' } };
    }
    if (day.questions >= t.questions + QUESTION_SLACK) return { ok: false, which: 'questions' };
    day.questions += 1;
    day.askCalls += 1;
    return { ok: true, took: { route, ask: 'question' } };
  }

  const id = opts.checkId!;
  if (day.photoCalls >= photoCallBudget(tier)) return { ok: false, which: 'calls' };
  const entry = day.ids[id];
  if (entry) {
    if (entry.calls >= CALLS_PER_CHECK) return { ok: false, which: 'calls' };
    entry.calls += 1;
    entry.inflight += 1;
    day.photoCalls += 1;
    return { ok: true, took: { route, checkId: id } };
  }
  const kind = opts.kind!;
  if (kind === 'full' && day.checks >= t.checks) return { ok: false, which: 'checks' };
  if (kind === 'recheck' && day.rechecks >= Math.min(t.rechecks, Math.max(day.checks, 1))) return { ok: false, which: 'rechecks' };
  if (kind === 'snap' && day.snaps >= SNAPS_PER_CHECK * (day.checks + day.rechecks)) return { ok: false, which: 'snaps' };
  if (kind === 'full') day.checks += 1;
  else if (kind === 'recheck') day.rechecks += 1;
  else day.snaps += 1;
  day.ids[id] = { kind, calls: 1, inflight: 1, ok: false };
  day.photoCalls += 1;
  return { ok: true, took: { route, checkId: id } };
}

/** Ends a call (mutates `day`): a finished read uses the check; a check with no finished read and nothing in
 *  flight is let go; a question that didn't finish is given back (L3, L6). */
export function finish(day: Day, took: Took, finished: boolean) {
  if (took.route === 'ask') {
    if (finished) return;
    if (took.ask === 'tap') day.taps = Math.max(0, day.taps - 1);
    else day.questions = Math.max(0, day.questions - 1);
    return;
  }
  const entry = day.ids[took.checkId!];
  if (!entry) return;
  entry.inflight = Math.max(0, entry.inflight - 1);
  if (took.route === 'read' && finished) entry.ok = true;
  if (entry.inflight === 0 && !entry.ok) {
    delete day.ids[took.checkId!];
    if (entry.kind === 'full') day.checks = Math.max(0, day.checks - 1);
    else if (entry.kind === 'recheck') day.rechecks = Math.max(0, day.rechecks - 1);
    else day.snaps = Math.max(0, day.snaps - 1);
  }
}

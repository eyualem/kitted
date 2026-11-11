// What checks put in Closet since he last looked (specs/setup-and-you.md SY2): the Closet tab's badge, and his first
// visit after his first adding check ("From your first check", each piece marked New). Two keys, on this phone only
// (sync/schema.ts KV_LOCAL; "Delete all my data" empties them with the rest of the kv table):
//   - closet.lastOpened: when Closet was last opened (ms). The badge counts the pieces checks added after it.
//   - closet.firstVisit: waiting (from setup's end) → check:<id> (the first check that added pieces) → done.
// An install from before this (both keys missing, setup done) starts at now and done, so an existing closet never
// shows a 40 and never gets the label (SY2.9). Pure, apart from the store helpers at the end.
import type { KittedStore } from '@/data/store';
import type { ClosetItemRow, FitCheckRow } from '@/data/types';
import { isOwned } from './profile';
import { addedIds } from './summaryText';

export const LAST_OPENED_KEY = 'closet.lastOpened';
export const FIRST_VISIT_KEY = 'closet.firstVisit';

export type FirstVisit = { state: 'waiting'; since: number } | { state: 'check'; checkId: string } | { state: 'done' };

export function parseFirstVisit(raw: string | null | undefined): FirstVisit | null {
  if (!raw) return null;
  if (raw === 'done') return { state: 'done' };
  if (raw.startsWith('check:') && raw.length > 6) return { state: 'check', checkId: raw.slice(6) };
  if (raw.startsWith('waiting:')) {
    const since = Number(raw.slice(8));
    return Number.isFinite(since) ? { state: 'waiting', since } : null;
  }
  return null;
}

export function formatFirstVisit(v: FirstVisit): string {
  return v.state === 'done' ? 'done' : v.state === 'check' ? `check:${v.checkId}` : `waiting:${v.since}`;
}

export function parseLastOpened(raw: string | null | undefined): number | null {
  const n = Number(raw);
  return raw && Number.isFinite(n) ? n : null;
}

type Check = Pick<FitCheckRow, 'id' | 'createdAt' | 'status' | 'details'>;
type Piece = Pick<ClosetItemRow, 'id' | 'source' | 'addedAt' | 'isDeleted' | 'mergedInto'>;

/** The pieces a scored check put in Closet that are still there (not undone, removed or folded into another). */
export function piecesAddedBy(check: Check, closet: readonly Piece[]): string[] {
  if (check.status !== 'scored') return [];
  const live = new Set(closet.filter((c) => c.source === 'fitCheck' && isOwned(c as ClosetItemRow)).map((c) => c.id));
  return addedIds(check.details.closetSummary).filter((id) => live.has(id));
}

/** The badge (SY2.3, SY2.4): pieces scored checks added after `lastOpened`. Pieces he added himself (the starter list,
 *  Closet's +, a scan, the chat) aren't a check's; a check that matched only pieces he had adds nothing. `held` are
 *  checks whose pieces are still sliding in (slide.ts): they count once they land. */
export function badgeCount(closet: readonly Piece[], checks: readonly Check[], lastOpened: number | null, held: ReadonlySet<string> = new Set()): number {
  if (lastOpened === null) return 0;
  const byId = new Map(closet.map((c) => [c.id, c]));
  const counted = new Set<string>();
  for (const ch of checks) {
    if (held.has(ch.id)) continue;
    for (const id of piecesAddedBy(ch, closet)) {
      const c = byId.get(id);
      if (c && c.addedAt > lastOpened) counted.add(id);
    }
  }
  return counted.size;
}

/** The first scored check since setup's end that added pieces still in Closet (null: none yet). */
export function firstAddingCheck(checks: readonly Check[], closet: readonly Piece[], since: number): string | null {
  const first = checks
    .filter((c) => c.createdAt >= since && piecesAddedBy(c, closet).length > 0)
    .sort((a, b) => a.createdAt - b.createdAt || (a.id < b.id ? -1 : 1))[0];
  return first?.id ?? null;
}

/** His first visit's pieces (SY2.8), in the order the check added them, out of the grid's own list. */
export function firstVisitPieces<T extends Piece>(check: Check | undefined, grid: readonly T[]): T[] {
  if (!check) return [];
  const byId = new Map(grid.map((c) => [c.id, c]));
  return piecesAddedBy(check, grid).map((id) => byId.get(id)).filter((c): c is T => !!c);
}

// ---- the store ----

/** Setup's end (onboarding/complete.ts): nothing is new yet, and his first adding check gets the first visit. */
export async function startArrivals(store: Pick<KittedStore, 'setKv'>, nowMs: number): Promise<void> {
  await store.setKv(LAST_OPENED_KEY, String(nowMs));
  await store.setKv(FIRST_VISIT_KEY, formatFirstVisit({ state: 'waiting', since: nowMs }));
}

/** At launch: a key that's missing on a finished setup is an install from before this update (or a first launch after
 *  it): last opened = now, and no first visit. Before setup's end nothing is written (setup writes both). */
export async function initArrivals(store: Pick<KittedStore, 'getKv' | 'setKv' | 'profile'>, nowMs: number): Promise<void> {
  if (!(await store.profile.get('me'))?.onboardingDone) return;
  if (parseLastOpened(await store.getKv(LAST_OPENED_KEY)) === null) await store.setKv(LAST_OPENED_KEY, String(nowMs));
  if (parseFirstVisit(await store.getKv(FIRST_VISIT_KEY)) === null) await store.setKv(FIRST_VISIT_KEY, 'done');
}

/** While waiting: the first check that adds pieces is recorded, so a later one never takes its place. */
export async function noteFirstAddingCheck(store: Pick<KittedStore, 'getKv' | 'setKv' | 'closet' | 'fitChecks'>): Promise<void> {
  const v = parseFirstVisit(await store.getKv(FIRST_VISIT_KEY));
  if (v?.state !== 'waiting') return;
  const id = firstAddingCheck(await store.fitChecks.all(), await store.closet.all(), v.since);
  if (id) await store.setKv(FIRST_VISIT_KEY, formatFirstVisit({ state: 'check', checkId: id }));
}

/** He's looking at Closet (opening it, or leaving it): the badge starts again from now. */
export async function seeCloset(store: Pick<KittedStore, 'setKv'>, nowMs: number): Promise<void> {
  await store.setKv(LAST_OPENED_KEY, String(nowMs));
}

/** Closet opened: the badge clears. Returns the first visit's check when this visit is it. */
export async function openCloset(store: Pick<KittedStore, 'getKv' | 'setKv' | 'closet' | 'fitChecks'>, nowMs: number): Promise<string | null> {
  await noteFirstAddingCheck(store);
  await seeCloset(store, nowMs);
  const v = parseFirstVisit(await store.getKv(FIRST_VISIT_KEY));
  return v?.state === 'check' ? v.checkId : null;
}

/** He left Closet (another tab, or the app went away): the label and the marks are gone for good. */
export async function endFirstVisit(store: Pick<KittedStore, 'getKv' | 'setKv'>): Promise<void> {
  if (parseFirstVisit(await store.getKv(FIRST_VISIT_KEY))?.state === 'check') await store.setKv(FIRST_VISIT_KEY, 'done');
}

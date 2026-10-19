// Try-ons vs what he wore (#360). Several checks close together are him deciding what to wear: a check followed by
// another check within the hour, the same day, was a try-on, and the last of the run is what he wore. Only what he
// wore counts as worn for the morning card's and Kit's rotation; a check's fixes keep a piece he tried earlier that day
// (labelled as such) and leave out a piece from an outfit he wore earlier that day. Never changes a score.
//
// Stable on purpose: whether a check was a try-on depends only on checks made within the hour after it, so for any
// check, what came before it is settled by the time it's made, and re-scoring it later (a correction, an occasion)
// gives the same fixes.
import type { FitCheckRow } from '@/data/types';

export const TRY_ON_GAP_MS = 60 * 60_000;

type CheckLike = Pick<FitCheckRow, 'id' | 'dayKey' | 'createdAt' | 'itemIds'>;

/** A check with pieces (a failed or held photo has none, and says nothing about what he wore). */
const hasPieces = (c: CheckLike) => c.itemIds.length > 0;

/** Another check with pieces followed this one within the hour, the same day. */
export function isTryOn(c: CheckLike, checks: readonly CheckLike[]): boolean {
  return checks.some((o) => o.id !== c.id && hasPieces(o) && o.dayKey === c.dayKey && o.createdAt > c.createdAt && o.createdAt - c.createdAt <= TRY_ON_GAP_MS);
}

/** The checks that are what he wore: with pieces, and not a try-on. */
export function wornChecks<T extends CheckLike>(checks: readonly T[]): T[] {
  return checks.filter((c) => hasPieces(c) && !isTryOn(c, checks));
}

/** For one check's fixes: the pieces of earlier checks the same day, split into tried on (still in play) and worn
 *  (an outfit he already wore that day). A piece in both counts as worn. */
export function earlierToday(row: CheckLike, checks: readonly CheckLike[]): { tried: Set<string>; worn: Set<string> } {
  const tried = new Set<string>();
  const worn = new Set<string>();
  for (const c of checks) {
    if (c.id === row.id || !hasPieces(c) || c.dayKey !== row.dayKey || c.createdAt >= row.createdAt) continue;
    // This check follows it too, pieces or not: its own pieces are filled in after its card shows.
    const tryOn = row.createdAt - c.createdAt <= TRY_ON_GAP_MS || isTryOn(c, checks);
    for (const id of c.itemIds) (tryOn ? tried : worn).add(id);
  }
  for (const id of worn) tried.delete(id);
  return { tried, worn };
}

// "Wear this", then a fit check in something else (founder, Oct 22, #369). Wear this logs the card's outfit for the day
// before he's dressed; a fit check afterwards shows what he really put on. When the check isn't the pick, the check is
// what he wore: the card says "You went with your own", and the pick's pieces don't count as worn in the card's and
// Kit's history. Read at display and pick time from the rows as they are, so nothing stored changes and Undo still works.
import type { ClosetItemRow, FitCheckRow, IdeaSlot, WearLogRow } from '@/data/types';
import { wornChecks } from '@/features/fitcheck/tryOn';

/** The share of the pick's pieces a check must show to be the pick: a 4-piece pick worn without its layer still is. */
export const PICK_SHARE = 0.75;

type Merged = Pick<ClosetItemRow, 'id' | 'mergedInto'>;

/** A piece folded into another goes by the one it became (a merge after the check keeps the match). */
export function rootOf(closet: readonly Merged[]): (id: string) => string {
  const byId = new Map(closet.map((c) => [c.id, c]));
  return (id) => {
    let cur = id;
    for (let i = 0; i < 8; i++) {
      const next = byId.get(cur)?.mergedInto;
      if (!next) break;
      cur = next;
    }
    return cur;
  };
}

/** The check shows the pick: at least PICK_SHARE of the pick's pieces are in it. An unknown pick (no pieces) passes, and
 *  so does a check whose pieces aren't in yet (the closet call fills them in after the card shows), so the card never
 *  says "You went with your own" and then takes it back. */
export function woreThePick(pickItems: readonly string[], checkItems: readonly string[], closet: readonly Merged[]): boolean {
  if (pickItems.length === 0 || checkItems.length === 0) return true;
  const root = rootOf(closet);
  const shown = new Set(checkItems.map(root));
  const hits = pickItems.filter((id) => shown.has(root(id))).length;
  return hits / pickItems.length >= PICK_SHARE;
}

/**
 * A Wear this the checks contradict: a check he wore (not a try-on) came after it, the same day and part of the day,
 * and none of those checks is the pick. Then the check stands for what he wore, and the logged pick doesn't.
 */
export function wearOverridden(
  wear: Pick<WearLogRow, 'day' | 'createdAt'>,
  pickItems: readonly string[],
  checks: readonly Pick<FitCheckRow, 'id' | 'dayKey' | 'createdAt' | 'itemIds'>[],
  closet: readonly Merged[],
  slotOf: (ms: number) => IdeaSlot,
): boolean {
  const slot = slotOf(wear.createdAt);
  const after = wornChecks(checks).filter((c) => c.dayKey === wear.day && c.createdAt >= wear.createdAt && slotOf(c.createdAt) === slot);
  return after.length > 0 && !after.some((c) => woreThePick(pickItems, c.itemIds, closet));
}

// T55 (F6.2, specs.md Nov 9): the morning card suggests an outfit only once Kit knows two different outfits of his that
// work. Until then it says why ("I only know {n} of your pieces…"), so a new user isn't shown the same three pieces every
// day. In the app, not core (T55's plan): it uses only core's public, parity-ported pieces, so it follows any change to them.
import {
  defaultRubric, isScored, itemKey, outfitReading, outfitValid,
  type Boldness, type ClosetItem, type Loose, type Styles,
} from '@kitted/core';

/** How many different working outfits the card needs before it suggests one. */
const OUTFITS_NEEDED = 2;

/**
 * True when the closet makes at least two different outfits that work: one top, one bottom and one pair of shoes
 * (layers never count) that pass the picker's own rules (`outfitValid`, and a score for Everyday, as the picker drops an
 * unscored outfit). Near-duplicates count once: two outfits are the same when their top, bottom and shoes have the same
 * `itemKey` (slot, subcategory, color family, pattern), as the closet's own outfit count reads them. Occasion- and
 * weather-free, like `closetState`, so the card and the notification agree all day. Pass only pieces he has.
 */
export function canSuggestOutfits(closet: readonly ClosetItem[], styles: Styles | null = null, boldness: Loose<Boldness> = 'a_little'): boolean {
  const bySlot = (slot: string) => closet.filter((c) => c.slot === slot);
  const tops = bySlot('top');
  const bottoms = bySlot('bottom');
  const shoes = bySlot('shoes');
  const keyOf = (it: ClosetItem) => JSON.stringify(itemKey(it));
  const seen = new Set<string>();
  for (const t of tops)
    for (const b of bottoms)
      for (const s of shoes) {
        const key = `${keyOf(t)}|${keyOf(b)}|${keyOf(s)}`;
        if (seen.has(key)) continue;
        const items = [t, b, s];
        if (!outfitValid(items, styles, boldness)) continue;
        if (!isScored(defaultRubric.score(outfitReading(items), { occasion: 'everyday', styles, boldness }))) continue;
        seen.add(key);
        if (seen.size >= OUTFITS_NEEDED) return true;
      }
  return false;
}

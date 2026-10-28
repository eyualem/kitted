// What a re-check saw (#383). The anchored merge (core recheckMerge) keeps a piece the new photo added, but the card's
// numbers only follow the score and the first card's fixes, so a new piece that holds the score read as "I still see
// the same outfit". And "What changed?" confirmed any of the first card's fixes on his word, even one whose piece the
// new photo clearly read as something else (his Oct 28 runners, confirmed as grey work boots).
import { CORE, cardFixTargets, type Fix, type Reading } from '@kitted/core';
import { garmentPhrase } from './labels';

/** Pieces in the re-check's merged reading of a kind the first reading didn't have in that slot ("green hoodie"), top
 *  to toe. A same-kind piece in another color isn't named: under a new layer that's most often the same shirt read
 *  another shade. */
export function seenPieces(first: Reading, merged: Reading): string[] {
  const out: string[] = [];
  for (const c of CORE) {
    const had = new Set(first.garments.filter((g) => g.category === c).map((g) => g.subcategory ?? null));
    for (const g of merged.garments) if (g.category === c && !had.has(g.subcategory ?? null)) out.push(garmentPhrase(g));
  }
  return out;
}

/** Did the photo clearly read this slot? A slot out of the photo, missing from the read, or read only "likely" or
 *  "unsure" is not clear: the read may have missed what he says he changed. */
function clearlyRead(raw: Reading, cat: string): boolean {
  const scene = raw.scene ?? {};
  if (cat === 'footwear' && scene.shoes_visible === false) return false;
  if ((cat === 'bottom' || cat === 'footwear') && scene.framing === 'upper_only') return false;
  const gs = cat === '*' ? raw.garments.filter((g) => (CORE as readonly unknown[]).includes(g.category)) : raw.garments.filter((g) => g.category === cat);
  return gs.length > 0 && gs.every((g) => g.certainty === 'clear');
}

/** The first card's fixes he may confirm on a re-check ("What changed?"): only one whose every piece the new photo
 *  didn't clearly read. A piece it read clearly is corrected with "Not quite right?", like any check. */
export function confirmable(raw: Reading, fixes: readonly Fix[]): Fix[] {
  return fixes.filter((f) => cardFixTargets([f]).every((t) => !clearlyRead(raw, t.split('.')[0] ?? t)));
}

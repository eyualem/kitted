// What each Starter piece adds, under the Closet's own count (#84.3; one "+N" everywhere, 09-ui-review §15b, #309):
// the chat's buy card and buy-next evidence, the Closet's next best buy (§14, #308) and "Add shoes and you'd have n".
// Pure. It sits between closet/outfits.ts (the count, with #353's cache: a gain scores only the trios with the new
// piece) and finish/starter.ts (the 12 basics) so neither imports the other.
import { displayHex, type Styles } from '@kitted/core';
import type { ClosetItemRow, FitCheckRow } from '@/data/types';
import { outfitCount, outfitGain, outfitsWith, type Outfit, type SlotState } from '@/features/closet/outfits';
import { ownership, STARTER, type StarterEntry } from './starter';

/** A Starter piece he doesn't own yet, as a closet row (drawn like his own; never stored). */
export function ghostPiece(e: StarterEntry): ClosetItemRow | null {
  if (!e.pick || !e.slot) return null;
  return {
    id: `__starter-${e.id}`, name: e.pick.name, slot: e.slot, garment: e.pick.garment, confirmedFields: [], hex: displayHex(e.pick.garment.color_family),
    photoFile: null, demoPhotoId: null, isPhotographed: false, source: 'added', starterId: e.id, wornCount: 0, lastWornAt: null, addedAt: 0,
    isDeleted: false, mergedInto: null, maybeSameAs: null, cropFile: null, cropScore: null, updatedAt: 0, profile: { aliases: [], distinctFrom: [], confirmed: {} },
  } as ClosetItemRow;
}

/** "+N outfits" for this Starter row's piece (0 for the belt, which has no closet slot). */
export function starterGain(closet: readonly ClosetItemRow[], styles: Styles | null, e: StarterEntry): number {
  const ghost = ghostPiece(e);
  return ghost ? outfitGain(closet, styles, ghost) : 0;
}

/** The missing row that adds the most outfits (02's order breaks ties); null when every wearable row is owned. */
export function bestMissing(closet: readonly ClosetItemRow[], styles: Styles | null, markedKv: readonly string[]): { entry: StarterEntry; gain: number } | null {
  const own = ownership(closet, markedKv);
  let best: { entry: StarterEntry; gain: number } | null = null;
  for (const e of STARTER) {
    if (own[e.id]?.owned || !e.pick || !e.slot) continue;
    const gain = starterGain(closet, styles, e);
    if (!best || gain > best.gain) best = { entry: e, gain };
  }
  return best;
}

/**
 * "Add shoes and you'd have {n} outfits" (#88): the count with the Starter piece for that slot added (the one that adds
 * the most). 0 when no Starter piece for it would make one.
 */
export function gainForSlot(closet: readonly ClosetItemRow[], checks: readonly FitCheckRow[], styles: Styles | null, slot: SlotState['slot']): number {
  const own = closet.filter((c) => c.source !== 'chat');
  const base = outfitCount(own, checks, styles);
  let best = 0;
  for (const e of STARTER) {
    if (e.slot !== slot) continue;
    const ghost = ghostPiece(e);
    if (ghost) best = Math.max(best, base + outfitGain(own, styles, ghost));
  }
  return best;
}

export interface NextBuy {
  entry: StarterEntry;
  /** The new piece, drawn dashed in what it unlocks. */
  ghost: ClosetItemRow;
  /** Outfits it adds under the Closet's count (7.0+ at Everyday). */
  gain: number;
  /** The new outfits it makes, best first. */
  unlocks: Outfit[];
}

/**
 * The next best buy (09-ui-review §14, #308; #87): the Starter piece he doesn't own (in the closet or tapped) that adds
 * the most outfits under the Closet's count; ties keep the Starter order. Null when nothing would add one.
 */
export function nextBestBuy(i: { closet: readonly ClosetItemRow[]; checks: readonly FitCheckRow[]; styles: Styles | null; marks: readonly string[] }): NextBuy | null {
  const best = bestMissing(i.closet, i.styles, i.marks);
  const ghost = best ? ghostPiece(best.entry) : null;
  if (!best || !ghost || best.gain <= 0) return null;
  return { entry: best.entry, ghost, gain: best.gain, unlocks: outfitsWith(i.closet, i.checks, i.styles, ghost) };
}

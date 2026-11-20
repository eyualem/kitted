// Which pieces in a reading are already in the closet, which a check adds, and which to ask about
// (02 D7 "Added 4 to Closet", S11, "Same as your khaki chinos?"). Pure: the app writes the result.
// Since the closet-accuracy phase 2 (DECISIONS-LOG #91) this is a thin wrapper over the identity engine
// (closetIdentity.ts reconcileReading): an exact color still matches on v3 fields alone, but a near color
// (tan vs khaki chinos, grey vs charcoal) is a question for him, never a silent merge.

import { reconcileReading, type ReadingReconcileEntry, type StoredProfile } from "./closetIdentity";
import { SLOT_TO_CLOSET } from "./names";
import { defaultRubric, type RubricEngine } from "./rubric";
import type { ClosetItem, Garment, Reading } from "./types";
import { clone } from "./util";

/**
 * Legacy (pre-#91) family match: same slot, subcategory and rubric FAMILY. Kept for callers outside the
 * closet write path; the app links garments to items through the stored observation instead (04 §7).
 */
function matches(g: Garment, item: ClosetItem, engine: RubricEngine): boolean {
  const slot = typeof g.category === "string" ? SLOT_TO_CLOSET[g.category] : undefined;
  if (!slot || item.slot !== slot) return false;
  if (item.garment.subcategory !== g.subcategory) return false;
  return engine.fam(item.garment.color_family) === engine.fam(g.color_family);
}

/** The closet item this garment is (legacy family match), or null. Skips items in `taken`. */
export function matchClosetItem(
  g: Garment, closet: readonly ClosetItem[], engine: RubricEngine = defaultRubric, taken: ReadonlySet<string> = new Set(),
): ClosetItem | null {
  return closet.find((item) => !taken.has(item.id) && matches(g, item, engine)) ?? null;
}

export interface ClosetPlanEntry {
  from: "garment" | "held";
  /** Index into reading.garments or reading.held_items. */
  index: number;
}

export interface ClosetPlan {
  /** Clearly a piece he owns: link it (worn count +1). */
  matched: (ClosetPlanEntry & { itemId: string; score: number })[];
  /** A new piece. */
  toAdd: (ClosetPlanEntry & { garment: Garment })[];
  /** Not sure: added as a new piece flagged "maybe the same as" the candidate, and asked about. */
  asks: (ClosetPlanEntry & { garment: Garment; candidateId: string; runnerUpId?: string; score: number })[];
  /** Every decision in order (worn pieces, then held pieces). */
  entries: ReadingReconcileEntry[];
}

/**
 * Worn pieces first (garments order), then held pieces (ruling: held items are auto-added like worn ones,
 * with Undo). Accessories, traditional garments, dresses, skirts, heels, traditional shoes and unsure reads are never added. `profiles` adds each item's
 * stored sightings, aliases and "different from" list. Garments may carry the closet call's fields
 * (shade, details, logo_text…); the plan's garments are copies of whatever was passed in.
 */
export function closetPlan(
  reading: Reading, closet: readonly ClosetItem[],
  profiles: Readonly<Record<string, StoredProfile>> = {},
): ClosetPlan {
  const plan: ClosetPlan = { matched: [], toAdd: [], asks: [], entries: reconcileReading(reading, closet, profiles) };
  for (const e of plan.entries) {
    const g = e.from === "garment" ? reading.garments[e.index] : reading.held_items?.[e.index];
    if (!g) continue;
    if (e.outcome === "same" && e.itemId) plan.matched.push({ from: e.from, index: e.index, itemId: e.itemId, score: e.score ?? 0 });
    else if (e.outcome === "ask" && e.candidateId) {
      plan.asks.push({
        from: e.from, index: e.index, garment: clone(g), candidateId: e.candidateId, score: e.score ?? 0,
        ...(e.runnerUpId ? { runnerUpId: e.runnerUpId } : {}),
      });
    } else plan.toAdd.push({ from: e.from, index: e.index, garment: clone(g) });
  }
  return plan;
}

// Which pieces in a reading are already in the closet, and which a check would add (02 D7
// "Added 4 to Closet", S11, the "Closet updated" pill). Pure: the app writes the result.
// A match = same closet slot, same subcategory, same color family (FAMILY table: tan_camel and
// khaki_beige are both "tan"). Each closet item matches at most one piece.

import { SLOT_TO_CLOSET } from "./names";
import { defaultRubric, type RubricEngine } from "./rubric";
import type { ClosetItem, Garment, Reading } from "./types";
import { clone } from "./util";

const CLOSET_CATEGORIES: readonly unknown[] = ["top", "bottom", "footwear", "outerwear"];

function matches(g: Garment, item: ClosetItem, engine: RubricEngine): boolean {
  const slot = typeof g.category === "string" ? SLOT_TO_CLOSET[g.category] : undefined;
  if (!slot || item.slot !== slot) return false;
  if (item.garment.subcategory !== g.subcategory) return false;
  return engine.fam(item.garment.color_family) === engine.fam(g.color_family);
}

/** The closet item this garment is, or null. Skips items in `taken` (already matched). */
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
  matched: (ClosetPlanEntry & { itemId: string })[];
  toAdd: (ClosetPlanEntry & { garment: Garment })[];
}

/**
 * Worn pieces first (garments order), then held pieces (ruling: held items are auto-added like
 * worn ones, with Undo). Accessories, traditional garments and unsure reads are never added.
 */
export function closetPlan(reading: Reading, closet: readonly ClosetItem[], engine: RubricEngine = defaultRubric): ClosetPlan {
  const taken = new Set<string>();
  const plan: ClosetPlan = { matched: [], toAdd: [] };
  const visit = (g: Garment, from: ClosetPlanEntry["from"], index: number) => {
    if (!CLOSET_CATEGORIES.includes(g.category) || g.certainty === "unsure") return;
    const hit = matchClosetItem(g, closet, engine, taken);
    if (hit) {
      taken.add(hit.id);
      plan.matched.push({ from, index, itemId: hit.id });
    } else {
      plan.toAdd.push({ from, index, garment: clone(g) });
    }
  };
  reading.garments.forEach((g, i) => visit(g, "garment", i));
  (reading.held_items ?? []).forEach((g, i) => visit(g, "held", i));
  return plan;
}

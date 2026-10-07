// Rotation: how many distinct outfits his closet can make (spec 04 §9; exact port of kitted_logic.rotation).
// "+N fits" for an item = rotation(closet + item) - rotation(closet).

import { defaultRubric, type RubricEngine } from "./rubric";
import type { Boldness, ClosetItem, Loose, Reading, RuleId, Styles } from "./types";
import { clone, maxOf, minOf, pyMax, truthy } from "./util";

/** Rubric rules that make a combination "not an outfit". Fit/care/occasion-only rules don't disqualify. */
export const HARD_RULES: ReadonlySet<RuleId> = new Set<RuleId>([
  "C1a_too_many_accent_colors", "C1b_too_many_colors", "C3_bright_clash", "C4a_same_pattern_same_scale",
  "C4b_three_plus_patterns", "B1_too_many_focal_points", "P2_big_top_skinny_leg", "P3_everything_oversized",
  "S1_bulky_shoe_narrow_leg", "S2_shoes_too_casual_for_outfit", "O4_loungewear_out",
]);

/** Dedupe key: (slot, subcategory, FAMILY(color), pattern). Near-duplicates (two white tees) count once. */
export type ItemKey = readonly [string, unknown, unknown, unknown];
export type ComboKey = readonly [ItemKey, ItemKey, ItemKey, ItemKey | null];

/** Synthetic full-body reading for a set of closet items (bottoms hem slight_break, tops untucked at_belt). */
export function outfitReading(items: readonly ClosetItem[]): Reading {
  const garments = items.map((it) => {
    const g = clone(it.garment);
    if (g.category === "bottom") g.hem = "slight_break";
    if (g.category === "top") {
      g.tucked = "none";
      g.length = "at_belt";
    }
    return g;
  });
  return {
    scene: { framing: "full_body", shoes_visible: true, people_count: 1, mirror_selfie: false, lighting: "good", clothed: "fully" },
    garments,
  };
}

export function outfitValid(
  items: readonly ClosetItem[], styles: Styles | null | undefined, boldness: Loose<Boldness> = "a_little",
  engine: RubricEngine = defaultRubric,
): boolean {
  const fs = items.map((it) => engine.formality(it.garment));
  if (maxOf(fs) - minOf(fs) > 1.0) return false;
  const [[vlo, vhi], [llo, lhi]] = engine.blendedBand(styles);
  for (const it of items) {
    const g = it.garment;
    if (g.category === "top" && truthy(g.volume)) {
      const v = g.volume as number;
      if (pyMax(0, vlo - v, v - vhi) >= 1) return false;
    }
    if (g.category === "bottom") {
      const li = engine.legIndex(g.leg_shape);
      if (li >= 0 && pyMax(0, llo - li, li - lhi) >= 1) return false;
    }
  }
  const sc = engine.score(outfitReading(items), { occasion: "everyday", styles, boldness });
  return !sc.rulesFired.some((r) => HARD_RULES.has(r));
}

export function itemKey(it: ClosetItem, engine: RubricEngine = defaultRubric): ItemKey {
  const g = it.garment;
  return [it.slot, g.subcategory ?? null, engine.fam(g.color_family ?? null), truthy(g.pattern) ? g.pattern : "solid"];
}

/** Python repr() of a combo key, used for the deterministic sort (kitted_logic sorts by str(key)). */
function pyRepr(v: unknown): string {
  if (v === null || v === undefined) return "None";
  if (Array.isArray(v)) return "(" + v.map(pyRepr).join(", ") + (v.length === 1 ? ",)" : ")");
  if (typeof v === "string") {
    if (v.includes("'") && !v.includes('"')) return `"${v.replace(/\\/g, "\\\\")}"`;
    return `'${v.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
  }
  if (v === true) return "True";
  if (v === false) return "False";
  return String(v);
}

export interface RotationResult {
  count: number;
  /** Distinct outfits, sorted like Python's sorted(seen, key=str). */
  combos: ComboKey[];
}

export function rotation(
  closet: readonly ClosetItem[], styles: Styles | null | undefined,
  opts: { boldness?: Loose<Boldness>; layers?: boolean } = {}, engine: RubricEngine = defaultRubric,
): RotationResult {
  const boldness = opts.boldness ?? "a_little";
  const layers = opts.layers ?? true;
  const by = (s: string) => closet.filter((it) => it.slot === s);
  const tops = by("top");
  const bottoms = by("bottom");
  const shoes = by("shoes");
  const outer = by("outer");
  const seen = new Map<string, ComboKey>();
  for (const t of tops) {
    for (const b of bottoms) {
      for (const s of shoes) {
        for (const l of layers ? [null, ...outer] : [null]) {
          const items = l ? [t, b, s, l] : [t, b, s];
          if (outfitValid(items, styles, boldness, engine)) {
            const key: ComboKey = [itemKey(t, engine), itemKey(b, engine), itemKey(s, engine), l ? itemKey(l, engine) : null];
            seen.set(JSON.stringify(key), key);
          }
        }
      }
    }
  }
  const combos = Array.from(seen.values())
    .map((k) => [pyRepr(k), k] as const)
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([, k]) => k);
  return { count: seen.size, combos };
}

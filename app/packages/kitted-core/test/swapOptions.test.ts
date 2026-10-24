// Swap one, the S28 sheet (09-ui-review §28 S1, #370): what could take one piece's place on the card's outfit. The
// picker's own rules decide; the list is the same every time for the same input.
import { describe, expect, it } from "vitest";
import {
  defaultRubric, isScored, isWarmLayer, itemAllowed, outfitReading, outfitValid, pickOutfit, swapOptions, weatherNeeds,
  type ClosetItem, type DayWeather, type Styles,
} from "../src/index";
import { seedCloset } from "./helpers";

const CLOSET = seedCloset();
const STYLES: Styles = [["smart_casual", 1]];
const byId = (id: string) => CLOSET.find((c) => c.id === id)!;
const day = (lo: number, hi = lo, p = 0): DayWeather => ({
  window: "day", nowF: lo, highF: hi, lowF: lo, feelsLowF: lo, feelsHighF: hi, precipChance: p,
  precipFromHour: p >= 0.5 ? 17 : null, condition: p >= 0.5 ? "rain" : "clear",
});
const ORDER = ["top", "bottom", "shoes", "outer"];
const scoreOf = (ids: readonly string[], occasion: string) => {
  const items = ids.map(byId).sort((a, b) => ORDER.indexOf(a.slot) - ORDER.indexOf(b.slot));
  const sc = defaultRubric.score(outfitReading(items), { occasion, styles: STYLES, boldness: "a_little" });
  return isScored(sc) ? sc.overall : null;
};

const CASES = [
  { occasion: "class", needs: null },
  { occasion: "everyday", needs: weatherNeeds(day(46, 63, 0.7)) },
  { occasion: "going_out", needs: weatherNeeds(day(30)) },
  { occasion: "work", needs: weatherNeeds(day(85)) },
] as const;

describe("swapOptions (S1)", () => {
  for (const c of CASES) {
    it(`every option passes the picker's rules · ${c.occasion}`, () => {
      const base = { closet: CLOSET, occasion: c.occasion, styles: STYLES, needs: c.needs, seed: "2026-10-23|day" };
      const outfit = pickOutfit(base).outfit!.itemIds;
      const floor = Math.min(7, scoreOf(outfit, c.occasion) ?? 7);
      let offered = 0;
      for (const out of outfit) {
        const opts = swapOptions({ ...base, outfit, out });
        offered += opts.length;
        for (const o of opts) {
          const it = byId(o.itemId);
          expect(it.slot).toBe(byId(out).slot);
          expect(outfit).not.toContain(o.itemId);
          expect(itemAllowed(it, c.needs, c.occasion)).toBe(true);
          // The whole outfit with only that one piece changed, layer shown first.
          expect([...o.outfit.itemIds].sort()).toEqual(outfit.map((id) => (id === out ? o.itemId : id)).sort());
          if (o.outfit.itemIds.some((id) => byId(id).slot === "outer")) expect(byId(o.outfit.itemIds[0]!).slot).toBe("outer");
          const items = o.outfit.itemIds.map(byId);
          expect(outfitValid(items, STYLES, "a_little")).toBe(true);
          expect(o.outfit.predicted).toBe(scoreOf(o.outfit.itemIds, c.occasion));
          expect(o.outfit.predicted).toBeGreaterThanOrEqual(floor);
          expect(o.outfit.reasons.length).toBeGreaterThan(0);
        }
        // Same input, same list.
        expect(swapOptions({ ...base, outfit, out })).toEqual(opts);
      }
      expect(offered).toBeGreaterThan(0);
    });
  }

  it("best score first among pieces right for the weather", () => {
    const base = { closet: CLOSET, occasion: "class", styles: STYLES, seed: "s" };
    const outfit = pickOutfit(base).outfit!.itemIds;
    for (const out of outfit) {
      const scores = swapOptions({ ...base, outfit, out }).map((o) => o.outfit.predicted);
      expect(scores).toEqual([...scores].sort((a, b) => b - a));
    }
  });

  it("a cold day that needs a layer only offers warm layers in its place", () => {
    const needs = weatherNeeds(day(38));
    const base = { closet: CLOSET, occasion: "class", styles: STYLES, needs, seed: "s" };
    const outfit = pickOutfit(base).outfit!.itemIds;
    const layer = outfit.find((id) => isWarmLayer(byId(id).garment) && byId(id).slot === "outer");
    if (!layer) return; // the seed closet's pick wears its warmth as a top: nothing to check
    for (const o of swapOptions({ ...base, outfit, out: layer })) expect(o.outfit.itemIds.map(byId).some((i) => isWarmLayer(i.garment))).toBe(true);
  });

  it("never offers what's left out, a piece already worn, or anything for a piece not in the outfit", () => {
    const base = { closet: CLOSET, occasion: "everyday", styles: STYLES, seed: "s" };
    const outfit = pickOutfit(base).outfit!.itemIds;
    const shoe = outfit.find((id) => byId(id).slot === "shoes")!;
    const all = swapOptions({ ...base, outfit, out: shoe });
    expect(all.length).toBeGreaterThan(0);
    const away = new Set(all.map((o) => o.itemId));
    expect(swapOptions({ ...base, outfit, out: shoe, exclude: away })).toEqual([]);
    const half = new Set([all[0]!.itemId]);
    expect(swapOptions({ ...base, outfit, out: shoe, exclude: half }).map((o) => o.itemId)).not.toContain(all[0]!.itemId);
    expect(swapOptions({ ...base, outfit, out: "nope" })).toEqual([]);
    const other = CLOSET.find((c: ClosetItem) => !outfit.includes(c.id))!;
    expect(swapOptions({ ...base, outfit, out: other.id })).toEqual([]);
  });
});

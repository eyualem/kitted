// Swap one, the S28 sheet (09-ui-review §28 S1, #377): what could take one piece's place on the card's outfit. The
// picker's own rules decide; the list is the same every time for the same input.
import { describe, expect, it } from "vitest";
import {
  defaultRubric, isScored, isWarmLayer, itemAllowed, outfitReading, outfitValid, pickHistory, pickOutfit, swapOptions, weatherNeeds,
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

// The card's rotation (#380): what he wore or was shown lately goes after fresher pieces, as the picker does. A top he
// wore within a week goes after one he hasn't (the score decides among those); a bottom, shoe or layer from the last two
// days loses 0.75 against the others; an option that rebuilds an outfit from the last week goes after. Order only.
describe("swapOptions follows the card's rotation", () => {
  const base = { closet: CLOSET, occasion: "class", styles: STYLES, seed: "2026-10-28|day" };
  const outfit = pickOutfit(base).outfit!.itemIds;
  const outOf = (slot: string) => outfit.find((id) => byId(id).slot === slot)!;
  const history = (seen: Record<string, number>) => pickHistory(Object.entries(seen).map(([id, daysAgo]) => ({ daysAgo, itemIds: [id] })), CLOSET);
  const ids = (opts: { itemId: string }[]) => opts.map((o) => o.itemId);

  it("the top he wore yesterday goes after an equally good top he hasn't worn in a week", () => {
    const first = swapOptions({ ...base, outfit, out: outOf("top") })[0]!.itemId;
    // A twin of that top: the same piece under another id, so it scores the same everywhere.
    const closet = [...CLOSET, { ...byId(first), id: `${first}-twin` }];
    const twin = `${first}-twin`;
    const b = { ...base, closet };
    const seen = (s: Record<string, number>) => pickHistory(Object.entries(s).map(([id, daysAgo]) => ({ daysAgo, itemIds: [id] })), closet);
    const plain = ids(swapOptions({ ...b, outfit, out: outOf("top") }));
    expect(plain).toContain(twin);
    const wornFirst = ids(swapOptions({ ...b, outfit, out: outOf("top"), history: seen({ [first]: 1, [twin]: 8 }) }));
    expect(wornFirst.indexOf(first)).toBeGreaterThan(wornFirst.indexOf(twin));
    const wornTwin = ids(swapOptions({ ...b, outfit, out: outOf("top"), history: seen({ [twin]: 1, [first]: 8 }) }));
    expect(wornTwin.indexOf(twin)).toBeGreaterThan(wornTwin.indexOf(first));
    // Worn yesterday, it goes after every top he hasn't worn this week, whatever they score.
    expect(wornFirst.at(-1)).toBe(first);
    // Past a week every top is as fresh as one never worn.
    expect(ids(swapOptions({ ...b, outfit, out: outOf("top"), history: seen({ [first]: 8, [twin]: 9 }) }))).toEqual(plain);
  });

  it("a shoe or bottom from the last two days is pushed down by 0.75, not hidden", () => {
    for (const slot of ["shoes", "bottom"]) {
      const opts = swapOptions({ ...base, outfit, out: outOf(slot) });
      if (opts.length < 2) continue;
      const first = opts[0]!;
      const after = swapOptions({ ...base, outfit, out: outOf(slot), history: history({ [first.itemId]: 1 }) });
      // Slides out of the house stay last whatever happens (#379); among the rest, the push is 0.75 of score.
      const wrong = (id: string) => (byId(id).garment.subcategory === "slides_sandals" ? 1 : 0);
      const value = (o: (typeof opts)[number]) => o.outfit.predicted - (o.itemId === first.itemId ? 0.75 : 0);
      const expected = [...opts].sort((x, y) => wrong(x.itemId) - wrong(y.itemId) || value(y) - value(x));
      expect(ids(after)).toEqual(ids(expected));
      // Three days ago is outside the push.
      expect(ids(swapOptions({ ...base, outfit, out: outOf(slot), history: history({ [first.itemId]: 3 }) }))).toEqual(ids(opts));
    }
  });

  it("an option that rebuilds an outfit from this week goes after one that doesn't", () => {
    const opts = swapOptions({ ...base, outfit, out: outOf("shoes") });
    expect(opts.length).toBeGreaterThan(1);
    const first = opts[0]!;
    const rebuilt = first.outfit.itemIds;
    const h = pickHistory([{ daysAgo: 4, itemIds: rebuilt }], CLOSET);
    // Seen 4 days ago: outside the pieces' two-day push, but the exact outfit is a repeat.
    const after = ids(swapOptions({ ...base, outfit, out: outOf("shoes"), history: { items: new Map(), outfits: h.outfits } }));
    const sameWrong = opts.filter((o) => (byId(o.itemId).garment.subcategory === "slides_sandals") === (byId(first.itemId).garment.subcategory === "slides_sandals"));
    if (sameWrong.length > 1) expect(after.indexOf(first.itemId)).toBeGreaterThan(after.indexOf(sameWrong[1]!.itemId));
  });

  it("history only reorders: every piece offered before is offered after, and nothing new", () => {
    const seen = Object.fromEntries(CLOSET.map((c, k) => [c.id, k % 5]));
    for (const c of CASES) {
      const b = { ...base, occasion: c.occasion, needs: c.needs };
      const o = pickOutfit(b).outfit!.itemIds;
      for (const out of o) {
        const plain = swapOptions({ ...b, outfit: o, out });
        const withHistory = swapOptions({ ...b, outfit: o, out, history: history(seen) });
        expect([...ids(withHistory)].sort()).toEqual([...ids(plain)].sort());
        // The outfits themselves don't change, only their order.
        expect([...withHistory].sort((x, y) => x.itemId.localeCompare(y.itemId))).toEqual([...plain].sort((x, y) => x.itemId.localeCompare(y.itemId)));
      }
    }
  });
});

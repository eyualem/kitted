// The card's outfit: slides stay home, and the card's look is the outfit's look (DECISIONS-LOG #379).
// Checks P1–P8, written before the change. The founder's Oct 24 day card (test/data/phone-oct24-card.json)
// picked the charcoal fleece over the brown plaid flannel, mid-wash jeans and black Adidas slides,
// labelled Streetwear, though that outfit reads as no look and his cream chunky sneakers made a 7.5.
import { describe, expect, it } from "vitest";
import {
  outfitReading, pickHistory, pickOutfit, scoreParts, swapOptions, weatherNeeds,
  type ClosetItem, type DayWeather, type DetectedStyle, type PastUse, type PickHistory, type Styles,
} from "../src/index";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type Oct24 = { closet: unknown[]; history: { items: [string, number][]; outfits: [string, number][] }; weather: unknown; seed: string };
const data = JSON.parse(readFileSync(join(__dirname, "data/phone-oct24-card.json"), "utf8")) as Oct24;

const CLOSET = data.closet as unknown as ClosetItem[];
const HISTORY: PickHistory = { items: new Map(data.history.items), outfits: new Map(data.history.outfits) };
const NEEDS = weatherNeeds(data.weather as unknown as DayWeather);
const STREET: Styles = [["streetwear", 1]];
const byId = (id: string) => CLOSET.find((c) => c.id === id)!;
const isSlides = (id: string) => byId(id).garment.subcategory === "slides_sandals";
const shoeOf = (ids: readonly string[]) => ids.find((id) => byId(id).slot === "shoes")!;
/** The looks a fit check of these pieces would read (the parts engine, as the picker since #380). */
const looksOf = (ids: readonly string[], occasion = "everyday") => {
  const ORDER = ["top", "bottom", "shoes", "outer"];
  const sc = scoreParts(outfitReading(ids.map(byId).sort((a, b) => ORDER.indexOf(a.slot) - ORDER.indexOf(b.slot))), { occasion });
  return sc.overall === null ? [] : sc.detectedStyles.map(String);
};
const card = (over: Partial<Parameters<typeof pickOutfit>[0]> = {}) =>
  pickOutfit({ closet: CLOSET, occasion: "everyday", styles: STREET, needs: NEEDS, history: HISTORY, seed: data.seed, look: "streetwear", ...over });
const DAYS = ["2026-10-24", "2026-10-25", "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30"];

describe("slides stay home (#379)", () => {
  it("P1 his Oct 24 card: not the slides", () => {
    const ids = card().outfit!.itemIds;
    expect(isSlides(shoeOf(ids))).toBe(false);
  });

  it("P2 out of the house, any day and occasion: never slides while another shoe works, even shoes seen yesterday", () => {
    for (const occasion of ["everyday", "class", "going_out", "date", "work_casual"])
      for (const d of DAYS) {
        const r = card({ occasion, seed: `${d}|day`, look: null });
        if (r.outfit) expect(isSlides(shoeOf(r.outfit.itemIds)), `${occasion} ${d}`).toBe(false);
      }
  });

  it("P3 at home or the gym slides can still come up", () => {
    const home = DAYS.map((d) => card({ occasion: "home", seed: `${d}|day`, look: null }).outfit!.itemIds);
    expect(home.every((ids) => ids.length >= 3)).toBe(true);
    // allowed, not forced: the rule only removes the penalty it adds out of the house
    const onlySlides = CLOSET.filter((c) => c.slot !== "shoes" || c.garment.subcategory === "slides_sandals");
    const r = pickOutfit({ closet: onlySlides, occasion: "home", styles: STREET, needs: NEEDS, history: HISTORY, seed: data.seed });
    expect(isSlides(shoeOf(r.outfit!.itemIds))).toBe(true);
  });

  it("P4b Swap one on the shoes, out of the house: slides only after every other pair, and not at all below Put together", () => {
    const outfit = card().outfit!.itemIds;
    const shoe = shoeOf(outfit);
    const listed = (occasion: string) =>
      swapOptions({ closet: CLOSET, occasion, styles: STREET, needs: NEEDS, history: HISTORY, seed: data.seed, outfit, out: shoe }).map((o) => o.itemId);
    const out = listed("everyday");
    expect(out.length).toBeGreaterThan(0);
    const firstSlides = out.findIndex(isSlides);
    if (firstSlides >= 0) expect(out.slice(firstSlides).every(isSlides)).toBe(true);
    // #380: the sheet scores with the fit check's engine, where slides with this flannel and fleece are a 6.0 (Shoes −2.5),
    // below Put together, so Swap's floor (#377) leaves them out; v4 had called them a 7.0.
    expect(out.some(isSlides)).toBe(false);
  });

  it("P4 slides are his only shoes: the card still has an outfit, with the slides", () => {
    const onlySlides = CLOSET.filter((c) => c.slot !== "shoes" || c.garment.subcategory === "slides_sandals");
    const r = pickOutfit({ closet: onlySlides, occasion: "everyday", styles: STREET, needs: NEEDS, history: HISTORY, seed: data.seed, look: "streetwear" });
    expect(r.outfit).not.toBeNull();
    expect(isSlides(shoeOf(r.outfit!.itemIds))).toBe(true);
  });
});

describe("the card's look is the outfit's look (#379)", () => {
  it("P5 his Oct 24 card: the outfit reads as streetwear", () => {
    expect(looksOf(card().outfit!.itemIds)).toContain("streetwear");
  });

  it("P6 every look his closet can make: a week of cards all read as it, and still rotate", () => {
    for (const look of ["streetwear", "workwear", "smart_casual", "minimalist"] as DetectedStyle[]) {
      // Each day's card joins the history the next day sees, as the app's cards do.
      const shown: PastUse[] = [];
      const picks = DAYS.map((d, i) => {
        const history = pickHistory(shown.map((u, k) => ({ daysAgo: i - k, itemIds: u.itemIds })), CLOSET);
        const ids = card({ seed: `${d}|day`, look, styles: [[look, 1]], history }).outfit!.itemIds;
        shown.push({ daysAgo: 0, itemIds: ids });
        return ids;
      });
      for (const ids of picks) expect(looksOf(ids), look).toContain(look);
      expect(new Set(picks.map((ids) => ids.join("+"))).size, `${look} varies`).toBeGreaterThan(1);
    }
  });

  it("P7 a look his closet can't make: the same outfit as with no look", () => {
    for (const look of ["classic_prep", "outdoor", "vintage_sport"] as DetectedStyle[]) {
      expect(card({ look }).outfit!.itemIds, look).toEqual(card({ look: null }).outfit!.itemIds);
    }
  });

  it("P8 the look only orders the outfits: a pinned piece and a swapped-out piece still win", () => {
    const flannel = CLOSET.find((c) => c.name === "Brown plaid flannel")!.id;
    expect(card({ pin: flannel }).outfit!.itemIds).toContain(flannel);
    const first = card().outfit!.itemIds;
    const top = first.find((id) => byId(id).slot === "top")!;
    expect(card({ exclude: new Set([top]) }).outfit!.itemIds).not.toContain(top);
  });
});

// The morning/evening card's outfit picker on the seed closet (02 "S1d", DECISIONS-LOG #58–61).
import { describe, expect, it } from "vitest";
import {
  addDays, closetState, daysBetween, outfitKey, outfitValid, pickHistory, pickOutfit, seasonNeeds, weatherNeeds, weekdayOf,
  type ClosetItem, type DayWeather, type PickHistory, type Styles,
} from "../src/index";
import { seedCloset } from "./helpers";

const CLOSET = seedCloset();
const STYLES: Styles = [["smart_casual", 1]];
const byId = (id: string) => CLOSET.find((c) => c.id === id)!;
const day = (feelsLowF: number, feelsHighF = feelsLowF, precipChance = 0): DayWeather => ({
  window: "day", nowF: feelsLowF, highF: feelsHighF, lowF: feelsLowF, feelsLowF, feelsHighF, precipChance,
  precipFromHour: precipChance >= 0.5 ? 17 : null, condition: precipChance >= 0.5 ? "rain" : "clear",
});
const pick = (over: Partial<Parameters<typeof pickOutfit>[0]> = {}) =>
  pickOutfit({ closet: CLOSET, occasion: "class", styles: STYLES, seed: "2026-10-22|day", ...over });
const slots = (ids: string[]) => ids.map((id) => byId(id).slot);
const topOf = (ids: readonly string[]) => ids.find((id) => byId(id).slot === "top")!;

describe("closetState", () => {
  it("empty, thin, enough", () => {
    expect(closetState([])).toBe("empty");
    expect(closetState(CLOSET.filter((c) => c.slot !== "shoes"))).toBe("thin");
    expect(closetState(CLOSET)).toBe("enough");
  });
});

describe("pickOutfit", () => {
  it("a full outfit with no weather", () => {
    const r = pick();
    expect(r.state).toBe("enough");
    expect(slots(r.outfit!.itemIds).slice(-3)).toEqual(["top", "bottom", "shoes"]);
    expect(r.outfit!.missing).toBeNull();
  });

  it("is deterministic for a day, and can differ across days", () => {
    expect(pick().outfit).toEqual(pick().outfit);
    const days = new Set(Array.from({ length: 14 }, (_, i) => pick({ seed: `2026-10-${10 + i}|day` }).outfit!.itemIds.join("+")));
    expect(days.size).toBeGreaterThan(1);
  });

  it("cold and wet: a warm layer, boots, never white sneakers", () => {
    const r = pick({ needs: weatherNeeds(day(44, 58, 0.8)) });
    const items = r.outfit!.itemIds.map(byId);
    expect(items.some((i) => i.slot === "outer" || ["sweater", "sweatshirt"].includes(String(i.garment.subcategory)))).toBe(true);
    expect(items.find((i) => i.slot === "shoes")!.id).toBe("S4");
    expect(r.outfit!.reasons.map((x) => x.key)).toContain("wetShoes");
  });

  it("hot: no outer layer", () => {
    const r = pick({ needs: weatherNeeds(day(72, 88)), occasion: "everyday" });
    expect(slots(r.outfit!.itemIds)).not.toContain("outer");
    expect(r.outfit!.itemIds.map((id) => byId(id).garment.subcategory)).not.toContain("sweater");
    expect(r.outfit!.itemIds.map((id) => byId(id).garment.subcategory)).not.toContain("chelsea_boot");
    expect(byId(r.outfit!.itemIds.find((id) => byId(id).slot === "top")!).garment.subcategory).toBe("tee");
    expect(r.outfit!.reasons[0]!.key).toBe("hotLight");
  });

  it("freezing with no coat in the closet: a layer anyway, plus a dashed 'coat' tile", () => {
    const r = pick({ needs: weatherNeeds(day(25, 30)) });
    expect(r.outfit!.missing).toBe("coat");
    expect(r.outfit!.reasons.map((x) => x.key)).toContain("needCoat");
  });

  it("cold with no warm piece at all: missing 'layer'", () => {
    const noWarm = CLOSET.filter((c) => c.slot !== "outer" && !["sweater", "sweatshirt"].includes(String(c.garment.subcategory)));
    const r = pickOutfit({ closet: noWarm, occasion: "class", styles: STYLES, seed: "x", needs: weatherNeeds(day(40)) });
    expect(r.outfit!.missing).toBe("layer");
  });

  it("moves on from what he saw or wore yesterday", () => {
    const first = pick().outfit!.itemIds;
    const next = pick({ history: pickHistory([{ daysAgo: 1, itemIds: first }], CLOSET) }).outfit!.itemIds;
    expect(next.filter((id) => first.includes(id)).length).toBeLessThan(first.length);
    expect(topOf(next)).not.toBe(topOf(first));
  });

  it("swap one excludes, style this pins", () => {
    const first = pick().outfit!.itemIds;
    const shoe = first.find((id) => byId(id).slot === "shoes")!;
    expect(pick({ exclude: new Set([shoe]) }).outfit!.itemIds).not.toContain(shoe);
    expect(pick({ pin: "B3" }).outfit!.itemIds).toContain("B3");
  });

  it("thin closet: what he has, and what's missing", () => {
    const r = pick({ closet: CLOSET.filter((c) => c.id === "T2" || c.id === "B1") });
    expect(r).toMatchObject({ state: "thin", outfit: null, known: ["T2", "B1"], missingSlots: ["shoes"] });
    expect(pick({ closet: [] })).toMatchObject({ state: "empty", known: [], missingSlots: ["top", "bottom", "shoes"] });
  });

  it("only suede shoes on a wet day: still an outfit (weather dropped)", () => {
    const suede: ClosetItem = { id: "SX", name: "Suede chukkas", slot: "shoes", garment: { category: "footwear", subcategory: "suede_chukka", color_family: "tan_camel" } };
    const closet = [...CLOSET.filter((c) => c.slot !== "shoes"), suede];
    const r = pickOutfit({ closet, occasion: "class", styles: STYLES, seed: "x", needs: weatherNeeds(day(60, 66, 0.9)) });
    expect(r.outfit!.itemIds).toContain("SX");
  });

  it("a 40-item closet stays fast", () => {
    const big: ClosetItem[] = [];
    for (let i = 0; i < 3; i++) for (const c of CLOSET) big.push({ ...c, id: `${c.id}-${i}` });
    const t0 = performance.now();
    pickOutfit({ closet: big, occasion: "class", styles: STYLES, seed: "x", needs: weatherNeeds(day(48, 63, 0.6)) });
    expect(performance.now() - t0).toBeLessThan(250); // Node; the Hermes budget is checked on the Simulator
  });
});

// ---------------------------------------------------------------- rotation (Oct 14)
// He ignores every card, or taps Wear this on every day card. The evening card posts until it has
// been ignored 3 times (as the app does). History = every earlier card + every day he wore.
type Card = { day: string; slot: "day" | "evening"; ids: string[] };
const NORMAL = CLOSET.filter((c) => ["T1", "T2", "T3", "T4", "T5", "B1", "B2", "B3", "S1", "S2", "S3"].includes(c.id));
const NORMAL_TOPS = NORMAL.filter((c) => c.slot === "top").map((c) => c.id);

function simulate(closet: ClosetItem[], o: { wear: boolean; evenings?: boolean; days?: number }) {
  const cards: Card[] = [];
  const worn: { day: string; ids: string[] }[] = [];
  let evenings = 0;
  const historyFor = (day: string, slot: Card["slot"]): PickHistory =>
    pickHistory([
      ...cards.filter((c) => c.day < day || (slot === "evening" && c.day === day && c.slot === "day")).map((c) => ({ daysAgo: daysBetween(c.day, day), itemIds: c.ids })),
      ...worn.filter((w) => w.day < day).map((w) => ({ daysAgo: daysBetween(w.day, day), itemIds: w.ids })),
    ], closet);
  for (let i = 0; i < (o.days ?? 14); i++) {
    const day = addDays("2026-10-22", i);
    const weekend = [0, 6].includes(weekdayOf(day));
    const base = { closet, styles: STYLES, needs: seasonNeeds(10) };
    const d = pickOutfit({ ...base, occasion: weekend ? "everyday" : "class", history: historyFor(day, "day"), seed: `${day}|day` });
    cards.push({ day, slot: "day", ids: d.outfit!.itemIds });
    if (o.wear) worn.push({ day, ids: d.outfit!.itemIds });
    if (o.evenings !== false && evenings < 3) {
      const e = pickOutfit({ ...base, occasion: "going_out", evening: true, history: historyFor(day, "evening"), seed: `${day}|evening` });
      cards.push({ day, slot: "evening", ids: e.outfit!.itemIds });
      evenings++;
    }
  }
  return { cards, worn, historyFor };
}

const topIn = (closet: ClosetItem[], ids: readonly string[]) => ids.find((id) => closet.find((c) => c.id === id)!.slot === "top")!;
const keyIn = (closet: ClosetItem[], ids: readonly string[]) => outfitKey(ids.map((id) => closet.find((c) => c.id === id)!));

describe("rotation", () => {
  for (const wear of [false, true]) {
    const label = wear ? "he wears every day card" : "he ignores every card";
    it(`${label}: tops rotate, no outfit twice in 7 days, the evening never repeats the day's top`, () => {
      const { cards } = simulate(NORMAL, { wear });
      expect(new Set(cards.map((c) => topIn(NORMAL, c.ids))).size).toBe(5);
      cards.forEach((c, k) => {
        const before = cards.slice(0, k);
        const top = topIn(NORMAL, c.ids);
        // A top seen in the last 3 days only comes back when every other top was seen too (and
        // then it's the one he's gone longest without).
        const recent = (t: string) => before.some((p) => daysBetween(p.day, c.day) <= 3 && topIn(NORMAL, p.ids) === t);
        if (recent(top)) expect(NORMAL_TOPS.every(recent)).toBe(true);
        expect(before.some((p) => daysBetween(p.day, c.day) < 7 && keyIn(NORMAL, p.ids) === keyIn(NORMAL, c.ids))).toBe(false);
        if (c.slot === "evening") expect(top).not.toBe(topIn(NORMAL, cards.find((p) => p.day === c.day && p.slot === "day")!.ids));
      });
    });
  }

  it("day cards alone: no top again within 3 days", () => {
    for (const wear of [false, true]) {
      const { cards } = simulate(NORMAL, { wear, evenings: false });
      cards.forEach((c, k) => {
        const again = cards.slice(0, k).filter((p) => topIn(NORMAL, p.ids) === topIn(NORMAL, c.ids));
        for (const p of again) expect(daysBetween(p.day, c.day)).toBeGreaterThan(3);
      });
    }
  });

  it("one top: it repeats, but the bottoms and shoes change; an outfit comes back only once all of them were shown", () => {
    for (const only of ["T1", "T4"]) {
      const one = NORMAL.filter((c) => c.slot !== "top" || c.id === only);
      const valid = new Set<string>();
      for (const b of one.filter((c) => c.slot === "bottom"))
        for (const sh of one.filter((c) => c.slot === "shoes")) if (outfitValid([byId(only), b, sh], STYLES)) valid.add(outfitKey([byId(only), b, sh])!);
      const { cards } = simulate(one, { wear: false });
      expect(new Set(cards.map((c) => topIn(one, c.ids)))).toEqual(new Set([only]));
      cards.forEach((c, k) => {
        const week = new Set(cards.slice(0, k).filter((p) => daysBetween(p.day, c.day) < 7).map((p) => keyIn(one, p.ids)!));
        if (week.has(keyIn(one, c.ids)!)) expect([...valid].every((v) => week.has(v))).toBe(true);
      });
      // Day cards alone (the evening stopped): 9 valid outfits for the oxford, so none twice in a week.
      if (only === "T4") {
        const days = simulate(one, { wear: false, evenings: false }).cards;
        days.forEach((c, k) => {
          expect(days.slice(0, k).some((p) => daysBetween(p.day, c.day) < 7 && keyIn(one, p.ids) === keyIn(one, c.ids))).toBe(false);
        });
      }
    }
  });

  it("two tops: they alternate, and the evening takes the other one", () => {
    const two = NORMAL.filter((c) => c.slot !== "top" || c.id === "T1" || c.id === "T4");
    const days = simulate(two, { wear: false, evenings: false }).cards.map((c) => topIn(two, c.ids));
    days.forEach((t, i) => i > 0 && expect(t).not.toBe(days[i - 1]));
    const { cards } = simulate(two, { wear: true });
    for (const c of cards.filter((x) => x.slot === "evening")) {
      const dayCard = cards.find((p) => p.day === c.day && p.slot === "day")!;
      expect(topIn(two, c.ids)).not.toBe(topIn(two, dayCard.ids));
    }
  });

  it("same day, slot and history: the same pick", () => {
    const { historyFor } = simulate(NORMAL, { wear: false, days: 5 });
    const run = () => pickOutfit({ closet: NORMAL, occasion: "class", styles: STYLES, needs: seasonNeeds(10), history: historyFor("2026-10-27", "day"), seed: "2026-10-27|day" });
    expect(run()).toEqual(run());
  });

  it("style this and swap one still win over rotation", () => {
    const history = pickHistory([{ daysAgo: 1, itemIds: ["T3", "B1", "S1"] }], NORMAL);
    const base = { closet: NORMAL, occasion: "class", styles: STYLES, needs: seasonNeeds(10), history, seed: "2026-10-23|day" };
    expect(pickOutfit({ ...base, pin: "T3" }).outfit!.itemIds).toContain("T3");
    const first = pickOutfit(base).outfit!.itemIds;
    const top = topIn(NORMAL, first);
    const swapped = pickOutfit({ ...base, exclude: new Set([top]) }).outfit!.itemIds;
    expect(swapped).not.toContain(top);
  });

  it("weather comes first: on a hot day the tee comes back before a long-sleeved shirt", () => {
    const closet = NORMAL.filter((c) => c.slot !== "top" || c.id === "T1" || c.id === "T4");
    const history = pickHistory([{ daysAgo: 1, itemIds: ["T1", "B3", "S1"] }], closet);
    const r = pickOutfit({ closet, occasion: "everyday", styles: STYLES, needs: weatherNeeds(day(72, 88)), history, seed: "x" });
    expect(topIn(closet, r.outfit!.itemIds)).toBe("T1");
  });

  it("pickHistory keeps the most recent use, and ignores later days", () => {
    const h = pickHistory([{ daysAgo: 4, itemIds: ["T1", "B1", "S1"] }, { daysAgo: 1, itemIds: ["T1", "B2", "S1", "L1"] }, { daysAgo: -1, itemIds: ["T2"] }], CLOSET);
    expect(h.items.get("T1")).toBe(1);
    expect(h.items.has("T2")).toBe(false);
    expect(h.outfits.get("B1+S1+T1")).toBe(4);
    expect(h.outfits.get("B2+S1+T1")).toBe(1);
  });
});

// The morning/evening card's outfit picker on the seed closet (02 "S1d", DECISIONS-LOG #58–61).
import { describe, expect, it } from "vitest";
import { closetState, pickOutfit, weatherNeeds, type ClosetItem, type DayWeather, type Styles } from "../src/index";
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

  it("pushes down what he wore in the last 2 days", () => {
    const first = pick().outfit!.itemIds;
    const next = pick({ recentlyWorn: new Set(first) }).outfit!.itemIds;
    expect(next.filter((id) => first.includes(id)).length).toBeLessThan(first.length);
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

// Cold days get a warm outfit (DECISIONS-LOG #381). Checks W1–W8 written before the change, W0 (his reported card) added once it was pulled.
// His Oct 23 evening card (feels-like 38°, Going out) picked the brown plaid overshirt over a navy long-sleeve tee:
// an overshirt is read as outerwear, and any outerwear counted as warmth. Replayed on his closet
// (test/data/phone-oct24-card.json) at 38°, about 3% of cards did the same, mostly Going out and Date. The card he
// reported (Oct 27's evening card, read at 1:46 am on Oct 28, 38° and feels-like 34°) put his cream striped overshirt
// over a red tee (test/data/phone-oct28-card.json, from his phone).
import { describe, expect, it } from "vitest";
import {
  isLightLayer, isWarmLayer, pickOutfit, swapOptions, weatherNeeds, weatherTip,
  type ClosetItem, type DayWeather, type DetectedStyle, type Garment, type PickHistory, type Reading, type Styles,
} from "../src/index";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type Oct24 = { closet: unknown[]; history: { items: [string, number][]; outfits: [string, number][] }; seed: string };
const data = JSON.parse(readFileSync(join(__dirname, "data/phone-oct24-card.json"), "utf8")) as Oct24;
const CLOSET = data.closet as unknown as ClosetItem[];
const HISTORY: PickHistory = { items: new Map(data.history.items), outfits: new Map(data.history.outfits) };
const STREET: Styles = [["streetwear", 1]];
const byId = (id: string) => CLOSET.find((c) => c.id === id)!;

const cold = (window: "day" | "evening", feelsLowF: number): DayWeather => ({
  window, nowF: feelsLowF + 4, highF: feelsLowF + 8, lowF: feelsLowF + 2, feelsLowF, feelsHighF: feelsLowF + 6,
  precipChance: 0, precipFromHour: null, condition: "clear", lateF: window === "evening" ? feelsLowF + 2 : undefined,
});
/** A piece that keeps him warm, named by kind (independent of the code under test). */
const KNITS = new Set(["fleece", "sweater", "sweatshirt", "hoodie", "quarter_zip", "cardigan"]);
const JACKETS = new Set(["denim_jacket", "bomber", "chore_coat", "field_jacket", "puffer", "overcoat", "rain_jacket", "leather_jacket", "shell_jacket"]);
const reallyWarm = (it: ClosetItem) => KNITS.has(String(it.garment.subcategory)) || JACKETS.has(String(it.garment.subcategory));
const g = (category: Garment["category"], subcategory: string, color_family = "navy"): Garment => ({ category, subcategory, color_family } as Garment);
const OCCASIONS = ["everyday", "class", "going_out", "date"];
const LOOKS: (DetectedStyle | null)[] = [null, "streetwear", "minimalist", "smart_casual", "workwear"];

describe("cold days get a warm outfit (#381)", () => {
  it("W0 the card he reported: no longer the cream striped overshirt over a red tee; a warm piece on top", () => {
    type Oct28 = { closet: ClosetItem[]; weather: DayWeather; seed: string; occasion: string; look: DetectedStyle; shipped: string[] };
    const c = JSON.parse(readFileSync(join(__dirname, "data/phone-oct28-card.json"), "utf8")) as Oct28;
    const r = pickOutfit({ closet: c.closet, occasion: c.occasion, styles: STREET, needs: weatherNeeds(c.weather), seed: c.seed, look: c.look, evening: true });
    const items = r.outfit!.itemIds.map((id) => c.closet.find((x) => x.id === id)!);
    expect(items.some(reallyWarm)).toBe(true);
    expect(r.outfit!.itemIds).not.toEqual(expect.arrayContaining(c.shipped));
    const named = r.outfit!.reasons.find((x) => x.key === "layerLate")!;
    expect(reallyWarm(c.closet.find((x) => x.id === named.itemId)!)).toBe(true); // "Keep the … on" names the warm piece
    expect(r.outfit!.reasons.map((x) => x.key)).toContain("needCoat"); // feels-like 34° and no heavy coat: still said
  });

  it("W1 his closet at 38°, day and evening, every occasion and look: always a real warm piece", () => {
    const misses: string[] = [];
    for (const window of ["day", "evening"] as const) {
      const needs = weatherNeeds(cold(window, 38));
      for (const occasion of OCCASIONS)
        for (const look of LOOKS)
          for (const history of [HISTORY, null])
            for (let d = 20; d < 30; d++) {
              const r = pickOutfit({ closet: CLOSET, occasion, styles: STREET, needs, history, seed: `2026-10-${d}|${window}`, look, evening: window === "evening" });
              const items = r.outfit!.itemIds.map(byId);
              if (!items.some(reallyWarm)) misses.push(`${window} ${occasion} ${look} ${d}: ${items.map((i) => i.name).join(" + ")}`);
            }
    }
    expect(misses).toEqual([]);
  }, 60_000);

  it("W2 a shirt worn open is a light layer, not warmth; fleece, knits and jackets are warmth", () => {
    for (const sub of ["overshirt", "flannel_shirt", "oxford_shirt", "camp_collar_shirt", "dress_shirt"]) {
      expect(isWarmLayer(g("outerwear", sub)), sub).toBe(false);
      expect(isLightLayer(g("outerwear", sub)), sub).toBe(true);
    }
    for (const sub of ["fleece", "denim_jacket", "bomber", "puffer", "chore_coat", "field_jacket", "blazer"]) expect(isWarmLayer(g("outerwear", sub)), sub).toBe(true);
    for (const sub of ["hoodie", "sweater", "sweatshirt", "quarter_zip", "cardigan"]) expect(isWarmLayer(g("top", sub)), sub).toBe(true);
    for (const sub of ["tee", "flannel_shirt", "oxford_shirt"]) {
      expect(isWarmLayer(g("top", sub)), sub).toBe(false);
      expect(isLightLayer(g("top", sub)), sub).toBe(false);
    }
  });

  it("W3 a fit check in an open shirt over a tee at 38° gets the cold tip; a fleece doesn't", () => {
    const reading = (outer: string): Reading => ({
      scene: { framing: "full_body" },
      garments: [g("top", "tee", "black"), g("bottom", "jeans", "denim_mid"), g("footwear", "chunky_sneaker", "black"), g("outerwear", outer, "brown")],
    });
    expect(weatherTip(reading("overshirt"), cold("day", 38))?.key).toBe("coldNoLayer");
    expect(weatherTip(reading("fleece"), cold("day", 38))).toBeNull();
  });

  it("W4 when the overshirt is his warmest piece: he still gets an outfit, wearing it, and the card says it's cold", () => {
    const thin = CLOSET.filter((c) => !reallyWarm(c));
    const overshirt = thin.find((c) => c.garment.subcategory === "overshirt")!;
    for (const window of ["day", "evening"] as const) {
      const r = pickOutfit({ closet: thin, occasion: "class", styles: STREET, needs: weatherNeeds(cold(window, 38)), seed: "2026-10-28|day", evening: window === "evening" });
      expect(r.state).toBe("enough");
      expect(r.outfit!.itemIds).toContain(overshirt.id);
      expect(r.outfit!.missing).toBe("layer");
      expect(r.outfit!.reasons[0]).toEqual({ key: "needLayer", itemId: overshirt.id });
    }
  });

  it("W5 nothing to layer at all: the card still says it's cold, naming nothing", () => {
    const bare = CLOSET.filter((c) => c.slot !== "outer" && !reallyWarm(c));
    const r = pickOutfit({ closet: bare, occasion: "class", styles: STREET, needs: weatherNeeds(cold("day", 38)), seed: "2026-10-28|day" });
    expect(r.outfit!.missing).toBe("layer");
    expect(r.outfit!.reasons[0]).toEqual({ key: "needLayer" });
  });

  it("W6 swapped away his only warm piece: the card keeps its cold words instead of forgetting the weather", () => {
    const fleece = CLOSET.find((c) => c.garment.subcategory === "fleece")!;
    const oneWarm = CLOSET.filter((c) => !reallyWarm(c) || c.id === fleece.id);
    const r = pickOutfit({ closet: oneWarm, occasion: "class", styles: STREET, needs: weatherNeeds(cold("day", 38)), seed: "2026-10-28|day", exclude: new Set([fleece.id]) });
    expect(r.outfit!.itemIds).not.toContain(fleece.id);
    expect(r.outfit!.missing).toBe("layer");
    expect(r.outfit!.reasons[0]!.key).toBe("needLayer");
  });

  it("W7 Swap one at 38° never leaves him in just a shirt layer", () => {
    const needs = weatherNeeds(cold("day", 38));
    for (const occasion of OCCASIONS) {
      const outfit = pickOutfit({ closet: CLOSET, occasion, styles: STREET, needs, history: HISTORY, seed: data.seed }).outfit!.itemIds;
      for (const out of outfit)
        for (const o of swapOptions({ closet: CLOSET, occasion, styles: STREET, needs, history: HISTORY, seed: data.seed, outfit, out }))
          expect(o.outfit.itemIds.map(byId).some(reallyWarm), `${occasion} swap ${byId(out).name} → ${byId(o.itemId).name}`).toBe(true);
    }
  });

  it("W8 a mild day (55°) still takes the overshirt as the light layer, and a hot day still leaves it home", () => {
    const thin = CLOSET.filter((c) => !reallyWarm(c));
    const mild = pickOutfit({ closet: thin, occasion: "class", styles: STREET, needs: weatherNeeds(cold("day", 55)), seed: "2026-10-28|day" });
    expect(mild.outfit!.missing).toBeNull();
    const hot = pickOutfit({ closet: thin, occasion: "everyday", styles: STREET, needs: weatherNeeds({ ...cold("day", 72), feelsHighF: 88 }), seed: "2026-10-28|day" });
    expect(hot.outfit!.itemIds.map(byId).some((i) => i.slot === "outer")).toBe(false);
  });
});

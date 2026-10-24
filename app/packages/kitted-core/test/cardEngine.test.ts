// The card ranks with the scoring fit checks use, and rotation never takes on a fault (DECISIONS-LOG #380).
// Checks E1–E10, written before the change. #379 kept slides home, but the picker still ranked outfits
// with the old v4 rubric while fit checks score with the parts engine (v14): on the founder's closet
// (test/data/phone-oct24-card.json) the Streetwear card then planned his black Puma running shoes with
// jeans on Oct 25 (parts 7.0, v4 thought 8.0) and Oct 29 (parts 6.5), where his cream chunky sneakers
// score 8.0 and 7.5. Recently seen shoes lost 0.75 to rotation, more than a half-point fault.
import { afterEach, describe, expect, it } from "vitest";
import {
  itemAllowed, outfitReading, pickHistory, pickOutfit, scoreParts, setCasualFitsV14, swapOptions, weatherNeeds, CASUAL_FITS_V14,
  type ClosetItem, type DayWeather, type DetectedStyle, type PastUse, type PickHistory, type PickInput, type Styles,
} from "../src/index";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type Oct24 = { closet: unknown[]; history: { items: [string, number][]; outfits: [string, number][] }; weather: DayWeather; seed: string; profile: { styles: Styles } };
const data = JSON.parse(readFileSync(join(__dirname, "data/phone-oct24-card.json"), "utf8")) as Oct24;

const CLOSET = data.closet as unknown as ClosetItem[];
const HISTORY: PickHistory = { items: new Map(data.history.items), outfits: new Map(data.history.outfits) };
const STYLES = data.profile.styles;
const NEEDS = weatherNeeds(data.weather);
const EVENING = weatherNeeds({ ...data.weather, window: "evening", nowF: 52, highF: 55, lowF: 46, feelsLowF: 44, feelsHighF: 55 } as DayWeather);
const HOT = weatherNeeds({ ...data.weather, nowF: 84, highF: 88, lowF: 72, feelsLowF: 72, feelsHighF: 90 } as DayWeather);
const WET = weatherNeeds({ ...data.weather, precipChance: 0.8, precipFromHour: 9, condition: "rain" } as DayWeather);
const byId = (id: string) => CLOSET.find((c) => c.id === id)!;
const ORDER = ["top", "bottom", "shoes", "outer"];
const ordered = (items: ClosetItem[]) => [...items].sort((a, b) => ORDER.indexOf(a.slot) - ORDER.indexOf(b.slot));
const parts = (ids: readonly string[], occasion: string) => {
  const r = scoreParts(outfitReading(ordered(ids.map(byId))), { occasion, styles: STYLES });
  return r.overall === null ? null : r;
};
/** The parts' deductions, "problems add up" and condition, as a negative number (0 = no fault). */
const faultsOf = (r: NonNullable<ReturnType<typeof parts>>) => {
  let f = -r.piledPenalty - r.condition.deduction;
  for (const p of Object.values(r.parts)) for (const x of p?.reasons ?? []) if (x.points < 0) f += x.points;
  return f;
};
const sub = (id: string) => String(byId(id).garment.subcategory);
const shoeOf = (ids: readonly string[]) => ids.find((id) => byId(id).slot === "shoes")!;
const DAYS = ["2026-10-24", "2026-10-25", "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30"];
const OUT = ["everyday", "class", "going_out", "date"];

/** A week of cards, each joining the history the next day sees (as the app's cards do). */
function week(over: Partial<PickInput>, slot = "day"): string[][] {
  const shown: PastUse[] = [];
  return DAYS.map((d, i) => {
    const history = i === 0 ? HISTORY : pickHistory(shown.map((u, k) => ({ daysAgo: i - k, itemIds: u.itemIds })), CLOSET);
    const ids = pickOutfit({ closet: CLOSET, occasion: "everyday", styles: STYLES, needs: NEEDS, history, seed: `${d}|${slot}`, look: "streetwear", ...over }).outfit!.itemIds;
    shown.push({ daysAgo: 0, itemIds: ids });
    return ids;
  });
}

afterEach(() => setCasualFitsV14(CASUAL_FITS_V14));

describe("the card scores the way a fit check does (#380)", () => {
  it("E1 the card's predicted score is the parts engine's score of those pieces, every occasion and look", () => {
    for (const occasion of OUT)
      for (const look of [null, "streetwear", "workwear"] as (DetectedStyle | null)[]) {
        const o = pickOutfit({ closet: CLOSET, occasion, styles: STYLES, needs: NEEDS, history: HISTORY, seed: data.seed, look }).outfit!;
        expect(o.predicted, `${occasion} ${look}`).toBe(parts(o.itemIds, occasion)!.overall);
      }
  });

  it("E2 the switch rolled back (v13): the card follows it", () => {
    setCasualFitsV14(false);
    for (const occasion of OUT) {
      const o = pickOutfit({ closet: CLOSET, occasion, styles: STYLES, needs: NEEDS, history: HISTORY, seed: data.seed }).outfit!;
      expect(o.predicted, occasion).toBe(parts(o.itemIds, occasion)!.overall);
    }
  });

  it("E3 the card's look is the look a fit check would read", () => {
    for (const look of ["streetwear", "workwear"] as DetectedStyle[])
      for (const ids of week({ look, styles: [[look, 1]] })) expect(parts(ids, "everyday")!.detectedStyles, look).toContain(look);
  });
});

describe("no planned fault while a better piece is in the closet (#380)", () => {
  it("E4 his Streetwear card, a week at each occasion out of the house: no slides, no running shoes, never below Put together", () => {
    for (const occasion of OUT)
      for (const [i, ids] of week({ occasion }).entries()) {
        const s = sub(shoeOf(ids));
        expect(s, `${occasion} ${DAYS[i]}`).not.toBe("slides_sandals");
        expect(s, `${occasion} ${DAYS[i]}`).not.toBe("performance_runner");
        expect(parts(ids, occasion)!.overall, `${occasion} ${DAYS[i]}`).toBeGreaterThanOrEqual(7);
      }
  });

  it("E5 no other pair of shoes, bottoms or layer in his closet drops a fault, scores higher and keeps the look", () => {
    for (const occasion of OUT)
      for (const look of [null, "streetwear"] as (DetectedStyle | null)[])
        for (const ids of week({ occasion, look })) {
          const sc = parts(ids, occasion)!;
          for (const slot of ["shoes", "bottom", "outer"]) {
            const cur = ids.find((id) => byId(id).slot === slot);
            for (const alt of CLOSET.filter((c) => c.slot === slot && c.id !== cur && itemAllowed(c, NEEDS, occasion))) {
              if (["slides_sandals", "performance_runner"].includes(String(alt.garment.subcategory))) continue; // last resorts (E4)
              const swapped = cur ? ids.map((id) => (id === cur ? alt.id : id)) : [...ids, alt.id];
              const r = parts(swapped, occasion);
              if (!r || (look && !r.detectedStyles.includes(look))) continue;
              const isValid = pickOutfit({ closet: swapped.map(byId), occasion, styles: STYLES, needs: null, seed: "v" }).outfit !== null;
              if (isValid && faultsOf(r) > faultsOf(sc)) expect(r.overall, `${occasion} ${look}: ${ids.map((x) => byId(x).name).join("+")} → ${alt.name}`).toBeLessThanOrEqual(sc.overall);
            }
          }
        }
  });

  it("E6 rotation still varies the week: at least 5 outfits, none twice", () => {
    for (const occasion of OUT) {
      const keys = week({ occasion }).map((ids) => [...ids].sort().join("+"));
      expect(new Set(keys).size, occasion).toBe(keys.length);
    }
  });

  it("E7 the evening card, a week: no slides or running shoes, Put together or better", () => {
    for (const ids of week({ occasion: "going_out", evening: true, needs: EVENING }, "evening")) {
      expect(["slides_sandals", "performance_runner"]).not.toContain(sub(shoeOf(ids)));
      expect(parts(ids, "going_out")!.overall).toBeGreaterThanOrEqual(7);
    }
  });

  it("E8 a hot day: short sleeves, no layer, no boots or slides", () => {
    for (const ids of week({ needs: HOT })) {
      const items = ids.map(byId);
      expect(items.some((c) => c.slot === "outer")).toBe(false);
      expect(items.find((c) => c.slot === "top")!.name).toBe("Charcoal tee");
      expect(["slides_sandals", "performance_runner"]).not.toContain(sub(shoeOf(ids)));
    }
  });

  it("E9 a wet day: no suede, no slides; the cream sneakers (a weather tip, no points) beat running shoes with jeans (−2 on Shoes)", () => {
    for (const ids of week({ needs: WET })) {
      const s = sub(shoeOf(ids));
      expect(["suede_chukka", "slides_sandals", "performance_runner"]).not.toContain(s);
    }
  });

  it("E10 running shoes and slides are his only shoes out of the house: still an outfit, with one of them", () => {
    // (Gym shorts and joggers never reach the picker today: v4's hard rules, which say what counts as an outfit, judge
    // every candidate at Everyday, where athletic bottoms are loungewear. The runner rule leaves them alone for later.)
    const onlyRunners = CLOSET.filter((c) => c.slot !== "shoes" || ["performance_runner", "slides_sandals"].includes(String(c.garment.subcategory)));
    const o = pickOutfit({ closet: onlyRunners, occasion: "everyday", styles: STYLES, needs: NEEDS, history: HISTORY, seed: data.seed }).outfit!;
    expect(["performance_runner", "slides_sandals"]).toContain(sub(shoeOf(o.itemIds)));
    expect(o.predicted).toBe(parts(o.itemIds, "everyday")!.overall);
  });

  it("E11 Swap one on the shoes ranks by the fit check's score: the cream sneakers before the chukkas, runners and slides last", () => {
    const outfit = week({})[0]!;
    const opts = swapOptions({ closet: CLOSET, occasion: "everyday", styles: STYLES, needs: NEEDS, history: HISTORY, seed: data.seed, outfit, out: shoeOf(outfit) });
    for (const o of opts) expect(o.outfit.predicted).toBe(parts(o.outfit.itemIds, "everyday")!.overall);
    const subs = opts.map((o) => sub(o.itemId));
    const firstLast = subs.findIndex((s) => s === "slides_sandals" || s === "performance_runner");
    if (firstLast >= 0) expect(subs.slice(firstLast).every((s) => s === "slides_sandals" || s === "performance_runner")).toBe(true);
  });
});

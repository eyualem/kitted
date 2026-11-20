// T61 · The scoring's "not rated" (specs/not-rated.md NR1, NR2, NR5 core half; tasks/T61/TESTING.md): the same cases as
// extraction-test/not_rated_test.py, on @kitted/core (rubric `score` and parts `scoreParts`, v15 and v16).
// Rule 6: made-up readings, no person in them. No network, $0.
import { describe, expect, it } from "vitest";
import { closetPlan, partialLabel, reconcileReading, score, scoreParts, suggestPartsFixes, type Garment, type Reading } from "../src/index";
import { v15Engine, v16Engine } from "./t69";

type Kw = Record<string, unknown>;
function G(cat: string, sub: string, color = "black", vol = 3, leg = "na", hem = "na", tucked = "na", length = "na", kw: Kw = {}): Garment {
  return {
    category: cat, subcategory: sub, color_family: color, pattern: "solid", logo: "none", volume: vol, leg_shape: leg, hem, tucked,
    condition: "clean", certainty: "clear", length, pattern_scale: "na", saturation: "na",
    sleeve_end: cat === "top" || cat === "outerwear" ? "at_wrist" : "na", strain: "none", distressed_by_design: false,
    shows_below_outer: false, ...kw,
  } as Garment;
}
const rd = (garments: Garment[], scene: Kw = {}): Reading =>
  ({ scene: { framing: "full_body", shoes_visible: true, people_count: 1, mirror_selfie: false, lighting: "good", clothed: "fully", ...scene }, garments }) as unknown as Reading;
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const withScene = (r: Reading, s: Kw): Reading => ({ ...clone(r), scene: { ...clone(r.scene), ...s } }) as Reading;
const swapShoe = (r: Reading, g: Garment): Reading => ({ ...clone(r), garments: r.garments.map((x) => (x.category === "footwear" ? g : x)) }) as Reading;
const unsure = (g: Garment): Garment => ({ ...g, certainty: "unsure" }) as Garment;

const TEE = G("top", "tee", "white", 3, "na", "na", "none", "mid_fly");
const JEANS = G("bottom", "jeans", "denim_dark", 3, "straight", "slight_break");
const SNEAKER = G("footwear", "white_leather_sneaker", "white");
const BASE = rd([TEE, JEANS, SNEAKER]);
const DRESS = G("top", "dress", "black", 3, "na", "na", "na", "mid_fly");
const SKIRT = G("bottom", "skirt", "black", 3, "straight", "na");
const KURTA = G("traditional", "other", "white");
const HEELS = G("footwear", "heels", "black");
const TRAD_SHOE = G("footwear", "traditional_shoe", "brown");
const TRAD_CAT_SHOE = G("traditional", "traditional_shoe", "brown");
const BOMBER = G("outerwear", "bomber", "black", 3, "na", "na", "na", "at_belt");

const ENGINES: Record<string, (r: Reading) => any> = {
  "rubric score": (r) => score(r),
  "parts v15": (r) => v15Engine().scoreParts(r),
  "parts v16": (r) => v16Engine().scoreParts(r),
};
const BASE_OVERALL: Record<string, number> = { "rubric score": 7.5, "parts v15": 7.0, "parts v16": 7.0 };

function blocked(r: Reading, reason: string, slot: string | undefined = undefined): void {
  for (const [name, run] of Object.entries(ENGINES)) {
    const res = run(r);
    expect([name, res.overall, res.reason, res.unreadableSlot]).toEqual([name, null, reason, slot]);
    if (slot === undefined) expect([name, "unreadableSlot" in res]).toEqual([name, false]);
    if (name === "rubric score") expect([name, res.partial]).toEqual([name, false]);
  }
}

describe("NR1 · what is not rated", () => {
  it("NR1.1 · a dress gives no number and the reason womenswear, on every engine", () => {
    blocked(rd([DRESS, JEANS, SNEAKER]), "womenswear");
    blocked(rd([DRESS, SNEAKER]), "womenswear");
  });
  it("NR1.1 · a skirt gives no number and the reason womenswear", () => {
    blocked(rd([TEE, SKIRT, SNEAKER]), "womenswear");
  });
  it("NR1.1 · the base outfit still scores today's number (must not block)", () => {
    for (const [name, run] of Object.entries(ENGINES)) {
      const res = run(BASE);
      expect([name, res.overall]).toEqual([name, BASE_OVERALL[name]]);
      expect(res.reason).toBeUndefined();
    }
  });
  it("NR1.2 · a traditional piece with jeans and sneakers is not rated: traditional, no number", () => {
    blocked(rd([KURTA, JEANS, SNEAKER]), "traditional");
    blocked(rd([KURTA]), "traditional");
  });
  it("NR1.2 · the old 'traditional garment (not rated)' token is gone", () => {
    for (const run of Object.values(ENGINES)) expect(run(rd([KURTA, JEANS, SNEAKER])).notRated ?? []).not.toContain("traditional garment (not rated)");
  });
  it("NR1.2 · an unsure traditional piece or dress blocks too (rules 2-3 are not unsure-filtered)", () => {
    blocked(rd([unsure(KURTA), JEANS, SNEAKER]), "traditional");
    blocked(rd([unsure(DRESS), JEANS, SNEAKER]), "womenswear");
  });
  it("NR1.3 · costume_or_uniform true gives costume_or_uniform", () => {
    blocked(withScene(BASE, { costume_or_uniform: true }), "costume_or_uniform");
  });
  it("NR1.3 · false or missing gives today's score", () => {
    for (const [name, run] of Object.entries(ENGINES)) {
      expect([name, run(withScene(BASE, { costume_or_uniform: false })).overall]).toEqual([name, BASE_OVERALL[name]]);
      expect([name, run(BASE).overall]).toEqual([name, BASE_OVERALL[name]]);
    }
  });
  it("NR1.4 · an unsure top, jacket or pants is unreadable with the slot top, jacket, pants", () => {
    blocked(rd([unsure(TEE), JEANS, SNEAKER]), "unreadable", "top");
    blocked(rd([TEE, JEANS, SNEAKER, unsure(BOMBER)]), "unreadable", "jacket");
    blocked(rd([TEE, unsure(JEANS), SNEAKER]), "unreadable", "pants");
  });
  it("NR1.4 · the first unsure main piece in reading order names the slot", () => {
    blocked(rd([TEE, unsure(JEANS), unsure(BOMBER), SNEAKER]), "unreadable", "pants");
    blocked(rd([TEE, unsure(BOMBER), unsure(JEANS), SNEAKER]), "unreadable", "jacket");
  });
  it("NR1.4 · a top-only photo with unsure jeans is not blocked", () => {
    for (const [name, run] of Object.entries(ENGINES)) {
      const res = run(rd([TEE, unsure(JEANS)], { framing: "upper_only" }));
      expect([name, res.overall === null, res.reason, res.notRated]).toEqual([name, false, undefined, ["bottom half"]]);
    }
  });
  it("NR1.5 · order: costume+skirt, traditional+dress, dress+unsure jacket, unsure dress", () => {
    blocked(withScene(rd([TEE, SKIRT, SNEAKER]), { costume_or_uniform: true }), "costume_or_uniform");
    blocked(rd([KURTA, DRESS, SNEAKER]), "traditional");
    blocked(rd([DRESS, SNEAKER, unsure(BOMBER)]), "womenswear");
    blocked(rd([unsure(DRESS), JEANS, SNEAKER]), "womenswear");
  });
  it("NR1.6 · an unsure watch changes nothing; shoes out and top-only give today's notRated", () => {
    const watch = G("accessory", "watch", "brown");
    for (const [name, run] of Object.entries(ENGINES)) {
      expect(run(rd([TEE, JEANS, SNEAKER, unsure(watch)]))).toEqual(run(BASE));
      const nos = run(withScene(BASE, { shoes_visible: false }));
      expect([name, nos.overall, nos.notRated]).toEqual([name, 7.0, ["shoes"]]);
      const up = run(withScene(BASE, { framing: "upper_only" }));
      expect([name, up.overall !== null, up.notRated]).toEqual([name, true, ["bottom half"]]);
    }
  });
  it("NR1.6 · not_fully_clothed and nothing_readable still win / hold as today", () => {
    for (const run of Object.values(ENGINES)) {
      expect(run(withScene(rd([DRESS, SNEAKER]), { clothed: "partly" })).reason).toBe("not_fully_clothed");
      expect(run(rd([unsure(G("accessory", "watch", "brown"))])).reason).toBe("nothing_readable");
    }
  });
});

describe("NR2 · heels and traditional shoes are scored like no shoes", () => {
  const heelBase = rd([G("top", "tee", "white", 5, "na", "na", "none", "mid_fly"), G("bottom", "jeans", "denim_dark", 3, "straight", "full_break"), SNEAKER]);
  const same = (shoe: Garment) => {
    const target = swapShoe(heelBase, shoe), hidden = withScene(heelBase, { shoes_visible: false });
    for (const [name, run] of Object.entries(ENGINES)) {
      const got = run(target), want = run(hidden);
      expect([name, got.overall === null]).toEqual([name, false]);
      expect([name, got.notRated]).toEqual([name, ["shoes not rated"]]);
      expect([name, want.notRated]).toEqual([name, ["shoes"]]);
      const { notRated: _a, ...g2 } = got; const { notRated: _b, ...w2 } = want;
      expect([name, g2]).toEqual([name, w2]);
    }
    const fg = suggestPartsFixes(target, {}), fw = suggestPartsFixes(hidden, {});
    expect(fw.fixes.length).toBeGreaterThan(0);
    expect(fg).toEqual(fw);
  };
  it("NR2.1 · heels equal the shoes-out outfit in every part, the overall and the fixes; notRated is shoes not rated", () => same(HEELS));
  it("NR2.1 · partialLabel gives 'Partial check: shoes not rated' (and never offers the old shoes wording)", () => {
    expect(partialLabel(["shoes not rated"] as any)).toBe("Partial check: shoes not rated");
    expect(partialLabel(["shoes"])).toBe("Partial check: shoes not included");
    expect(partialLabel(["bottom half"])).toBe("Partial check: top only");
    expect(partialLabel([])).toBeNull();
    expect(partialLabel(["shoes not rated"] as any)).not.toBe("Partial check: shoes not included");
  });
  it("NR2.1 · the heels outfit's notRated never holds plain shoes (no shoe snap offered)", () => {
    for (const run of Object.values(ENGINES)) expect(run(swapShoe(heelBase, HEELS)).notRated).not.toContain("shoes");
  });
  it("NR2.2 · footwear traditional_shoe is dropped the same way", () => same(TRAD_SHOE));
  it("NR2.2 · category traditional + subcategory traditional_shoe is dropped, not a traditional block", () => same(TRAD_CAT_SHOE));
  it("NR2.3 · unsure shoes give today's result exactly", () => {
    for (const [name, run] of Object.entries(ENGINES)) {
      const got = run(swapShoe(BASE, unsure(SNEAKER))), gone = run(rd([TEE, JEANS]));
      expect([name, got]).toEqual([name, gone]);
      expect(got.notRated ?? []).not.toContain("shoes not rated");
    }
  });
});

describe("NR5 (core half) · Closet's keep skips the new pieces", () => {
  const heelsOutfit = rd([TEE, JEANS, HEELS]);
  it("NR5.1 · the heels are never offered; the tee and jeans still are", () => {
    const e = reconcileReading(heelsOutfit, []);
    expect(e.map((x) => [x.from, x.index])).toEqual([["garment", 0], ["garment", 1]]);
    const plan = closetPlan(heelsOutfit, []);
    expect(plan.toAdd.map((x) => x.garment.subcategory)).toEqual(["tee", "jeans"]);
  });
  it("NR5.1 · a dress, a skirt and a traditional_shoe are never kept", () => {
    for (const [g, kept] of [[DRESS, []], [SKIRT, []], [TRAD_SHOE, []], [TRAD_CAT_SHOE, []]] as [Garment, string[]][]) {
      const plan = closetPlan(rd([g, g.category === "top" ? JEANS : TEE]), []);
      expect(plan.toAdd.map((x) => x.garment.subcategory).filter((s) => ["dress", "skirt", "traditional_shoe"].includes(s as string))).toEqual(kept);
      expect(plan.entries.length).toBe(1);
    }
  });
  it("NR5.1 · held items of those subcategories are skipped too; held sneakers are kept", () => {
    const r = { ...rd([TEE, JEANS, SNEAKER]), held_items: [HEELS, DRESS, G("footwear", "work_boot", "brown")] } as Reading;
    const e = reconcileReading(r, []);
    expect(e.filter((x) => x.from === "held").map((x) => x.index)).toEqual([2]);
  });
});

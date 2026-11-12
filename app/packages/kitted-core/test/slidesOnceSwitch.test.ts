// T93 · Slides are charged once, on Shoes (parts v16, #450, #452; SHO-14 in rubric/v5-styles.md). SLIDES_ONCE_V16 picks
// v16 or v15 for every default path (the card, its fixes, the one quick tap); flipping it (tests only) moves them together.
// Expected values: extraction-test/slides_shape_paper.py, version V6 (= v16), and v15 as it scores today. Made-up readings
// with no person in them (rule 6: the stated test profile, no picks, boldness "a little", Everyday unless a test says so),
// built exactly as rules_conformance.py's top/bottom/shoe/Rd helpers build them.
import { afterEach, describe, expect, it } from "vitest";
import {
  CASUAL_FITS_V14, defaultParts, HOODIE_LAYER_V15, scoreParts, setCasualFitsV14, setHoodieLayerV15, setSlidesOnceV16,
  SLIDES_ONCE_V16, suggestPartsFixes, type PartResult, type PartsResult, type Reading, type SecondLookInput, type Styles,
} from "../src";
import { loadJSON } from "./helpers";

// ---- rules_conformance.py's garment helpers, field for field
type Garment = Record<string, unknown>;
function G(category: string, subcategory: string, color = "black", volume = 3, kw: Garment = {}): Garment {
  const pattern = (kw.pattern as string | undefined) ?? "solid";
  return {
    category, subcategory, color_family: color, pattern, logo: "none", volume, leg_shape: "na", hem: "na", tucked: "na",
    condition: "clean", certainty: "clear", length: "na", pattern_scale: pattern === "solid" || pattern === "graphic" ? "na" : "medium",
    saturation: "na", sleeve_end: category === "top" || category === "outerwear" ? "at_wrist" : "na", strain: "none",
    distressed_by_design: false, shows_below_outer: false, ...kw,
  };
}
const top = (sub: string, color = "white", vol = 3, kw: Garment = {}) =>
  G("top", sub, color, vol, { tucked: "none", length: "mid_fly", ...(sub === "graphic_tee" ? { pattern: "graphic" } : {}), ...kw });
const bottom = (sub: string, color: string, leg: string, hem = "slight_break") => G("bottom", sub, color, 3, { leg_shape: leg, hem });
const shoe = (sub: string, color = "black") => G("footwear", sub, color);
const Rd = (...garments: Garment[]): Reading => ({
  scene: { framing: "full_body", shoes_visible: true, people_count: 1, mirror_selfie: false, lighting: "good", clothed: "fully" },
  garments,
}) as unknown as Reading;

const GTEE4 = top("graphic_tee", "black", 4);
const WJEANS = bottom("jeans", "denim_mid", "wide", "cuffed");
const SLIDES = shoe("slides_sandals", "black");
const CHUNKY = shoe("chunky_sneaker", "white");
/** O1: an oversized black graphic tee, wide jeans and slides (v15 6.5, v16 7.5). */
const STREET = Rd(GTEE4, WJEANS, SLIDES);
/** O1c: the same with chunky sneakers (8.0 either way). */
const SNEAKERS = Rd(GTEE4, WJEANS, CHUNKY);

const V16_LABEL = "parts-proto-16 (Nov 11, 2026)";
const V15_LABEL = "parts-proto-15 (Oct 28, 2026)";
const V14_LABEL = "parts-proto-14 (Oct 17, 2026)";
const PR4_SLIDES = "a boxy top over wide legs: the shape carries it, even in slides";
const PR4_SNEAKERS = "a boxy top over wide legs, finished by street sneakers: the streetwear shape";

const scored = (r: PartsResult) => {
  if (r.overall === null) throw new Error(`unscored: ${r.reason}`);
  return r;
};
const part = (r: PartsResult, k: string): PartResult => (r.parts as Record<string, PartResult>)[k]!;
const checks = (r: PartsResult, k: string) => part(r, k).reasons.map((x) => [x.check, x.points]);
const pr4Line = (r: PartsResult) => part(r, "proportions").reasons.filter((x) => x.check === "PR4_street_shape").map((x) => x.line);

function resetSwitches(): void {
  setCasualFitsV14(CASUAL_FITS_V14);
  setHoodieLayerV15(HOODIE_LAYER_V15);
  setSlidesOnceV16(SLIDES_ONCE_V16);
}

describe("the slides-once switch (parts v16, SHO-14)", () => {
  afterEach(resetSwitches);

  it("The switch · SLIDES_ONCE_V16 is on in the shipped code: v16 (parts data 1.15.0) is bundled", () => {
    expect(SLIDES_ONCE_V16).toBe(true);
    expect(HOODIE_LAYER_V15).toBe(true);
    expect(CASUAL_FITS_V14).toBe(true);
    expect(defaultParts.data.engine).toBe("v16");
    expect(defaultParts.data.label).toBe(V16_LABEL);
    expect(defaultParts.data.version).toBe("1.15.0");
  });

  it("The switch · SLIDES_ONCE_V16 off rolls back to v15", () => {
    const on = scored(scoreParts(STREET));
    expect(on.overall).toBe(7.5);
    expect(on.engine).toBe("v16");
    expect(on.version).toBe(V16_LABEL);

    setSlidesOnceV16(false);
    expect(defaultParts.data.engine).toBe("v15");
    expect(defaultParts.data.label).toBe(V15_LABEL);
    expect(defaultParts.data.version).toBe("1.14.0");
    const off = scored(scoreParts(STREET));
    expect(off.overall).toBe(6.5);
    expect(off.rawScore).toBe(6.717);
    expect(off.engine).toBe("v15");
    expect(off.version).toBe(V15_LABEL);
    expect(part(off, "proportions").score).toBe(7.0);
    expect(part(off, "shoes").score).toBe(5.0);
    expect(scored(scoreParts(SNEAKERS)).overall).toBe(8.0);

    setSlidesOnceV16(true);
    expect(scored(scoreParts(STREET)).overall).toBe(7.5);
    expect(scored(scoreParts(SNEAKERS)).overall).toBe(8.0);
  });

  it("The switch · with HOODIE_LAYER_V15 or CASUAL_FITS_V14 off, the older rollback wins", () => {
    setHoodieLayerV15(false);
    expect(defaultParts.data.engine).toBe("v14");
    expect(defaultParts.data.label).toBe(V14_LABEL);
    expect(defaultParts.data.version).toBe("1.13.0");
    const v14 = scored(scoreParts(STREET));
    expect(v14.engine).toBe("v14");
    expect(v14.overall).toBe(6.5);
    resetSwitches();
    setCasualFitsV14(false);
    expect(defaultParts.data.engine).toBe("v13");
    expect(scored(scoreParts(STREET)).overall).toBe(6.5);
  });

  it("The switch · the fix engine follows it", () => {
    expect(suggestPartsFixes(STREET, {}).baseOverall).toBe(7.5);
    setSlidesOnceV16(false);
    expect(suggestPartsFixes(STREET, {}).baseOverall).toBe(6.5);
  });

  it("SHO-14 · the street outfit on v16: the shape still counts and the slides cost once, on Shoes, with a point back", () => {
    const r = scored(scoreParts(STREET));
    expect(r.overall).toBe(7.5);
    expect(r.rawScore).toBe(7.25);
    expect(part(r, "proportions").score).toBe(8.0);
    expect(checks(r, "proportions")).toEqual([["PR4_street_shape", 1.0]]);
    expect(part(r, "shoes").score).toBe(6.0);
    expect(checks(r, "shoes")).toEqual([["SK1_slides_out", -2.5], ["SK1s_slides_soft", 0.5], ["SK1c_slides_shape", 1.0]]);
    expect(part(r, "fit").score).toBe(7.0);
    expect(part(r, "color").score).toBe(7.0);
    expect(part(r, "cohesion").score).toBe(7.5);
    expect(r.detectedStyles).toEqual(["streetwear"]);
  });

  it("STR-5 · the shape line says the truth: slides get their own line, sneakers keep theirs", () => {
    expect(pr4Line(scoreParts(STREET))).toEqual([PR4_SLIDES]);
    expect(pr4Line(scoreParts(SNEAKERS))).toEqual([PR4_SNEAKERS]);
    expect(checks(scoreParts(SNEAKERS), "shoes").map(([c]) => c)).not.toContain("SK1c_slides_shape");
  });

  it("F2.1 · scoring a slides reading twice gives the same result and leaves the reading untouched", () => {
    const reading = Rd(GTEE4, WJEANS, SLIDES);
    const before = structuredClone(reading);
    const r1 = scored(scoreParts(reading));
    const r2 = scored(scoreParts(reading));
    expect(r1.engine).toBe("v16"); // the slides path, not v15's
    expect(r1.overall).toBe(7.5);
    expect(r2).toEqual(r1);
    expect(reading).toEqual(before); // the slides path drops the shoe on a copy, never on the original
    // a frozen reading scores the same (any write to it would throw)
    const frozen = structuredClone(before) as unknown as { scene: object; garments: object[] };
    frozen.garments.forEach((g) => Object.freeze(g));
    Object.freeze(frozen.garments);
    Object.freeze(frozen.scene);
    Object.freeze(frozen);
    expect(scoreParts(frozen as unknown as Reading)).toEqual(r1);
  });
});

// ---- Nothing else moves: every rules-conformance case without slides in view scores the same on v16 and v15
interface ConfCase { id: string; reading: Reading; occasion: string; styles: [string, number][]; boldness: string; second_look: SecondLookInput | null }
const D = loadJSON<{ engine: string; cases: ConfCase[] }>("rules_conformance.json");
const slidesInView = (rd: Reading) => {
  const r = rd as unknown as { scene?: { shoes_visible?: boolean }; garments?: { subcategory?: string }[] };
  return (r.scene?.shoes_visible ?? true) && (r.garments ?? []).some((g) => g.subcategory === "slides_sandals");
};
const run = (c: ConfCase) =>
  scoreParts(c.reading, { occasion: c.occasion, styles: c.styles as Styles, boldness: c.boldness, secondLook: c.second_look });
/** Everything but the engine name and its label. */
function body(r: PartsResult): Record<string, unknown> {
  const { engine: _e, version: _v, ...rest } = r as PartsResult & { engine?: string; version?: string };
  void _e;
  void _v;
  return rest;
}

describe("Nothing else moves (parts v16)", () => {
  afterEach(resetSwitches);

  it("Nothing else moves · every conformance case without slides in view scores exactly as v15 did", () => {
    expect(D.engine).toBe("v16"); // the conformance cases were regenerated by a v16 run
    const plain = D.cases.filter((c) => !slidesInView(c.reading));
    const withSlides = D.cases.filter((c) => slidesInView(c.reading));
    expect(plain.length).toBeGreaterThan(450);
    const on = new Map([...plain, ...withSlides].map((c) => [c.id, run(c)]));
    setSlidesOnceV16(false);
    const off = new Map([...plain, ...withSlides].map((c) => [c.id, run(c)]));
    const moved = plain.filter((c) => JSON.stringify(body(on.get(c.id)!)) !== JSON.stringify(body(off.get(c.id)!))).map((c) => c.id);
    expect(moved).toEqual([]);
    // and the switch really did something on the slides cases in the same run
    const movedSlides = withSlides.filter((c) => on.get(c.id)!.overall !== off.get(c.id)!.overall).map((c) => c.id).sort();
    expect(movedSlides).toEqual(expect.arrayContaining(["PRO-17-slides", "PRO-17-slides-wide", "SHO-14-cargos", "SHO-14-drag",
      "SHO-14-going-out", "SHO-14-street", "STR-5-slides-line"]));
  });
});

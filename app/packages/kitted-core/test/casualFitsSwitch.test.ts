// The casual-fits switch (parts v14, #335): CASUAL_FITS_V14 picks v14 or v13 for every default path, and flipping it
// at run time (tests only) moves scoreParts, defaultParts and the fix engine together.
import { afterEach, describe, expect, it } from "vitest";
import { CASUAL_FITS_V14, defaultParts, PARTS_DATA, partsDataFor, scoreParts, setCasualFitsV14, suggestPartsFixes, type Reading } from "../src";

const G = (category: string, subcategory: string, color_family: string, extra: Record<string, unknown> = {}) => ({
  category, subcategory, color_family, pattern: "solid", logo: "none", volume: 3, leg_shape: "na", hem: "na", tucked: "na",
  condition: "clean", certainty: "clear", length: "na", pattern_scale: "na", saturation: "na",
  sleeve_end: category === "top" || category === "outerwear" ? "at_wrist" : "na", strain: "none", distressed_by_design: false,
  shows_below_outer: false, ...extra,
});
const scene = { framing: "full_body", shoes_visible: true, people_count: 1, mirror_selfie: false, lighting: "good", clothed: "fully" };
// an oversized grey hoodie over loose gym shorts with basketball sneakers, at Class
const HOODIE_SHORTS = { scene, garments: [
  G("top", "hoodie", "grey", { volume: 4, tucked: "none", length: "mid_fly" }),
  G("bottom", "athletic_shorts", "black", { leg_shape: "relaxed", volume: 4 }),
  G("footwear", "basketball_sneaker", "white"),
] } as unknown as Reading;

describe("the casual-fits switch (parts v14)", () => {
  afterEach(() => setCasualFitsV14(CASUAL_FITS_V14));

  it("is on: the bundled data is v16 (v14 plus the hoodie layer, #385, and slides charged once, #452) and v13 is the rollback", () => {
    expect(CASUAL_FITS_V14).toBe(true);
    expect(PARTS_DATA.engine).toBe("v16");
    expect(partsDataFor(false).engine).toBe("v13");
    expect(partsDataFor(false).version).toBe("1.10.0");
    expect(partsDataFor(false, false).engine).toBe("v13"); // v13 wins whatever the hoodie switch says
    expect(defaultParts.data.engine).toBe("v16");
  });

  it("v14 scores shorts on Proportions and credits the deliberate shape; v13 skips them", () => {
    const on = scoreParts(HOODIE_SHORTS, { occasion: "class" });
    expect(on.parts.proportions?.score).toBe(8.0);
    expect(on.overall).toBe(8.0);
    setCasualFitsV14(false);
    const off = scoreParts(HOODIE_SHORTS, { occasion: "class" });
    expect(off.parts.proportions?.score).toBeNull();
    expect(off.overall).toBe(7.0);
    expect(defaultParts.data.engine).toBe("v13");
  });

  it("the fix engine follows the switch", () => {
    const on = suggestPartsFixes(HOODIE_SHORTS, { occasion: "class" });
    setCasualFitsV14(false);
    const off = suggestPartsFixes(HOODIE_SHORTS, { occasion: "class" });
    expect(on.baseOverall).toBe(8.0);
    expect(off.baseOverall).toBe(7.0);
  });
});

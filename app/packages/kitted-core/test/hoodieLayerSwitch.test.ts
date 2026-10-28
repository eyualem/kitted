// The hoodie layer (parts v15, PRO-17, #385): a hoodie or sweatshirt layered over a tee earns the short jacket's +1.5 on
// Proportions. HOODIE_LAYER_V15 picks v15 or v14 for every default path; flipping it (tests only) moves scoreParts,
// defaultParts and the fix engine together. The reading is the founder's Oct 28 re-check, as the app stored it.
import { afterEach, describe, expect, it } from "vitest";
import { CASUAL_FITS_V14, defaultParts, HOODIE_LAYER_V15, partsDataFor, scoreParts, setHoodieLayerV15, suggestPartsFixes, type Reading } from "../src";
import fixture from "../../../src/__tests__/fixtures/oct28-hoodie-recheck.json";

const FIRST = fixture.first as unknown as Reading;
const RECHECK = fixture.recheck as unknown as Reading;
// his profile (rule 7): born 2004, streetwear · minimal · workwear; Everyday
const opts = { occasion: "everyday", styles: [["streetwear", 0.5], ["minimalist", 0.25], ["workwear", 0.25]] as [string, number][] };

describe("the hoodie-layer switch (parts v15)", () => {
  afterEach(() => setHoodieLayerV15(HOODIE_LAYER_V15));

  it("is on: v15 is bundled and v14 (parts data 1.13.0) is its rollback", () => {
    expect(HOODIE_LAYER_V15).toBe(true);
    expect(CASUAL_FITS_V14).toBe(true);
    expect(defaultParts.data.engine).toBe("v15");
    expect(partsDataFor(true, false).engine).toBe("v14");
    expect(partsDataFor(true, false).version).toBe("1.13.0");
    expect(partsDataFor(true, false).tune.hl).toBe(0);
    expect(partsDataFor(true, false).tune.cp8).toBe(0);
  });

  it("his green zip hoodie over the navy tee: 7.0 -> 7.5 on v15; v14 holds it at 7.0; the tee alone stays 7.0", () => {
    const on = scoreParts(RECHECK, opts);
    expect(on.overall).toBe(7.5);
    expect(on.parts.proportions?.score).toBe(8.5);
    expect(on.parts.proportions?.reasons.map((r) => r.check)).toEqual(["PR2h_hoodie_layer"]);
    // COL-13: the hoodie picks up the green of the olive cargos (with the quiet accent, Color 8.0)
    expect(on.parts.color?.score).toBe(8.0);
    expect(on.parts.color?.reasons.map((r) => r.check)).toEqual(["CP2_quiet_accent", "CP8_layer_tie_in"]);
    expect(scoreParts(FIRST, opts).overall).toBe(7.0);
    setHoodieLayerV15(false);
    expect(scoreParts(RECHECK, opts).overall).toBe(7.0);
    expect(scoreParts(RECHECK, opts).parts.proportions?.score).toBe(7.0);
    expect(scoreParts(RECHECK, opts).parts.color?.score).toBe(7.5);
  });

  it("the fix engine follows the switch", () => {
    expect(suggestPartsFixes(RECHECK, opts).baseOverall).toBe(7.5);
    setHoodieLayerV15(false);
    expect(suggestPartsFixes(RECHECK, opts).baseOverall).toBe(7.0);
  });
});

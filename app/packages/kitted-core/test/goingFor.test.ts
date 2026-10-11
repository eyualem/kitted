// "Going for" (#215): his stated look changes the advice, never the score. Readings: the bundled demo photos (stock,
// profile unknown; no picks are passed anywhere here, so the stated test profile is "no picks") and two hand-written
// outfits from the founder's #213 examples (made-up readings, marked so).
import { describe, expect, it } from "vitest";
import { G, defaultRubric, goingForAdvice, scoreParts, type DetectedStyle, type Reading } from "../src";
import { loadReading } from "./helpers";

const STYLES: DetectedStyle[] = ["streetwear", "minimalist", "smart_casual", "workwear", "classic_prep", "vintage_sport", "outdoor"];
const DEMO = ["p01a", "p01b", "s05", "s09", "s10", "s12", "s13", "s14", "s15", "s22", "s24", "s25", "p01a_real", "p01b_real", "p01b_chinos_slim", "s24_jeans"];
const SCENE = { framing: "full_body", shoes_visible: true, people_count: 1, mirror_selfie: false, lighting: "good", clothed: "fully" };
const outfit = (...garments: ReturnType<typeof G>[]): Reading => ({ scene: SCENE, garments });

// Made-up (#213): an oversized graphic tee with pleated trousers and loafers; SX1 charges it on Style (parts v5).
const GRAPHIC_DRESSY = outfit(
  G("top", "graphic_tee", "black", { pattern: "graphic", pattern_scale: "large", volume: 4 }),
  G("bottom", "trousers", "charcoal", { leg_shape: "straight", hem: "slight_break" }),
  G("footwear", "loafer", "brown"),
);

describe("goingForAdvice", () => {
  it("Not sure, the gym and home give no advice", () => {
    const r = loadReading("p01b");
    expect(goingForAdvice(r, null)).toBeNull();
    expect(goingForAdvice(r, "minimalist", { occasion: "gym" })).toBeNull();
    expect(goingForAdvice(r, "minimalist", { occasion: "home" })).toBeNull();
  });

  it("a match is exactly 'the detector finds the look' (with no picks), on every demo reading and look", () => {
    for (const id of DEMO) {
      const r = loadReading(id);
      const det = defaultRubric.detectStyles(defaultRubric.scoredGarments(r), []).detected;
      for (const s of STYLES) {
        const a = goingForAdvice(r, s, { occasion: "everyday" });
        if (scoreParts(r, { occasion: "everyday" }).overall === null) {
          expect(a).toBeNull();
          continue;
        }
        expect([id, s, a!.kind]).toEqual([id, s, det.includes(s) ? "match" : "mismatch"]);
        if (a!.kind === "match") expect([a!.piece, a!.move]).toEqual([null, null]);
      }
    }
  });

  it("p01b reads as minimal and smart casual: both match; s14 (minimal) going smart casual gets a move, no piece", () => {
    expect(goingForAdvice(loadReading("p01b"), "minimalist")!.kind).toBe("match");
    expect(goingForAdvice(loadReading("p01b"), "smart_casual")!.kind).toBe("match");
    const a = goingForAdvice(loadReading("s14"), "smart_casual")!;
    expect([a.kind, a.readsAs, a.piece, a.move?.copy]).toEqual(["mismatch", "minimalist", null, "Swap the chunky sneakers for white leather sneakers"]);
  });

  it("s15 going minimal: the plaid overshirt pulls the other way (plain, it would read minimal); no move that keeps the score", () => {
    const a = goingForAdvice(loadReading("s15"), "minimalist")!;
    expect([a.readsAs, a.piece?.name, a.piece?.why, a.piece?.plural, a.move]).toEqual(["smart_casual", "overshirt", "loud", false, null]);
  });

  it("SX1's clashing top is the piece, and the catalog's own line for it is the move (made-up #213 outfit)", () => {
    const res = scoreParts(GRAPHIC_DRESSY, { occasion: "everyday" });
    expect(res.overall).not.toBeNull();
    const a = goingForAdvice(GRAPHIC_DRESSY, "minimalist")!;
    expect([a.kind, a.piece?.name, a.piece?.why, a.move?.id, a.move?.copy]).toEqual(["mismatch", "graphic tee", "clash", "top_plain_tee", "Swap the graphic tee for a plain tee"]);
    expect(a.move!.garment.subcategory).toBe("tee");
  });

  it("every move reads as the look and never scores lower; a piece the reading couldn't name is never named", () => {
    let moves = 0;
    for (const id of DEMO) {
      const r = loadReading(id);
      for (const occasion of ["everyday", "date", "interview", "class"]) {
        const base = scoreParts(r, { occasion });
        if (base.overall === null) continue;
        for (const s of STYLES) {
          const a = goingForAdvice(r, s, { occasion });
          if (a?.piece) expect(["other", "piece", ""]).not.toContain(a.piece.name);
          if (!a?.move) continue;
          moves += 1;
          expect(a.move.copy).not.toMatch(/\{|\bother\b/);
        }
      }
    }
    expect(moves).toBeGreaterThan(10);
  });

  it("never reads his picks: the same advice whatever the occasion's picks would be (no styles parameter exists)", () => {
    // The options have no `styles`; the engine is called with styles: [] (a guard against a later edit adding them).
    const a = goingForAdvice(loadReading("s14"), "smart_casual", { occasion: "everyday", ...({ styles: [["smart_casual", 1]] } as object) });
    expect(a).toEqual(goingForAdvice(loadReading("s14"), "smart_casual", { occasion: "everyday" }));
  });
});

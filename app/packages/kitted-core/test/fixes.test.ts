// Fix engine: expected_scores.json -> fixes (reference behavior from kitted_logic.suggest_fixes).
// If you change a selection rule on purpose, regenerate the fixtures with make_expected.py and say so.
import { describe, expect, it } from "vitest";
import { applyFix, fixTargets, score, suggestFixes, type Styles } from "../src/index";
import { diff, loadJSON, loadReading, seedCloset, suggestionsToPy } from "./helpers";

const E = loadJSON("expected_scores.json");
const DEMO = E.profile.styles as Styles;
const CLOSET = seedCloset();

describe("suggestFixes", () => {
  for (const f of E.fixes as any[]) {
    it(f.id, () => {
      const r = loadReading(f.reading);
      const closet = f.closet === "empty" ? [] : CLOSET;
      const before = JSON.stringify([r, closet]);
      const out = suggestFixes(r, { occasion: f.occasion, styles: DEMO, closet, firstCheck: f.firstCheck });
      expect(diff(f.id, suggestionsToPy(out), f.expected)).toEqual([]);
      expect(JSON.stringify([r, closet])).toBe(before); // never mutates the reading or the closet
    });
  }

  it("first check: 'Wear the overshirt, open' -> 9.0, plus the next-level tip", () => {
    const out = suggestFixes(loadReading("p01b"), { occasion: "date", styles: DEMO, firstCheck: true });
    expect(out.fixes.map((x) => [x.copy, x.tag, x.to])).toEqual([["Wear the overshirt, open", "Free · it's already in your hand", 9.0]]);
    expect(out.nextLevel).toEqual(["One standout color, like a rust tee. No score change today."]);
  });

  it("fixTargets of the first-check card = whole outerwear slot", () => {
    const out = suggestFixes(loadReading("p01b"), { occasion: "date", styles: DEMO, firstCheck: true });
    expect(fixTargets(out.fixes)).toEqual(["outerwear"]);
  });

  it("'Tell me' applies the fix to the FIRST reading -> 9.0", () => {
    const first = loadReading("p01b");
    const out = suggestFixes(first, { occasion: "date", styles: DEMO, firstCheck: true });
    const told = applyFix(first, out.fixes[0]!)!;
    const want = (E.rechecks as any[]).find((x) => x.id === "recheck:tell-me").expected;
    const s = score(told, { occasion: "date", styles: DEMO });
    expect(diff("tell-me", { merged_reading: told, overall: s.overall, raw_unrounded: s.overall === null ? null : s.rawUnrounded,
      rules_fired: s.rulesFired }, want)).toEqual([]);
  });
});

// Anchored re-check: expected_scores.json -> rechecks (kitted_logic.recheck_merge).
import { describe, expect, it } from "vitest";
import { pyRound, recheckMerge, score, type ScoredResult, type Styles } from "../src/index";
import { diff, loadJSON, loadReading } from "./helpers";

const E = loadJSON("expected_scores.json");
const DEMO = E.profile.styles as Styles;

describe("recheckMerge", () => {
  const first = loadReading("p01b");
  const base = score(first, { occasion: "date", styles: DEMO }) as ScoredResult;

  for (const rc of (E.rechecks as any[]).filter((x) => x.id !== "recheck:tell-me")) {
    it(rc.id, () => {
      const { merged, notes } = recheckMerge(first, loadReading(rc.new), rc.targets, { occasion: rc.occasion, styles: DEMO });
      const s = score(merged, { occasion: rc.occasion, styles: DEMO }) as ScoredResult;
      const got = {
        merged_reading: merged, notes, overall: s.overall, raw_unrounded: s.rawUnrounded, rules_fired: s.rulesFired,
        credits: s.credits, delta_display: s.overall - base.overall, delta_raw: pyRound(s.rawUnrounded - base.rawUnrounded, 6),
      };
      expect(diff(rc.id, got, rc.expected)).toEqual([]);
    });
  }

  it("p01b -> p01a is 8.0 -> 9.0 (+1.0 shown, +0.75 raw), 'Nothing else changed'", () => {
    const { merged, notes } = recheckMerge(first, loadReading("p01a"), ["outerwear"], { occasion: "date", styles: DEMO });
    const s = score(merged, { occasion: "date", styles: DEMO }) as ScoredResult;
    expect(s.overall).toBe(9.0);
    expect(s.rawUnrounded - base.rawUnrounded).toBe(0.75);
    expect(notes).toEqual(["changed: outerwear"]);
  });
});

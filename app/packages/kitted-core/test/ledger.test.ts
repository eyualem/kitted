// The "Why this score" ledger: same result as score(), and rows that add up to the shown score.
import { describe, expect, it } from "vitest";
import { explainScore, score, type Styles } from "../src/index";
import { loadJSON, loadReading } from "./helpers";

const DEMO: Styles = [["smart_casual", 0.5], ["workwear", 0.5]];
const P = loadJSON<{ readings: Record<string, any>; cases: { reading: string; occasion: string; styles: [string, number][]; boldness: string }[] }>("rubric_parity.json");

describe("explainScore", () => {
  it("returns exactly score()'s result and rows that add up, for all 5,694 parity cases", () => {
    const bad: string[] = [];
    for (const c of P.cases) {
      const opts = { occasion: c.occasion, styles: c.styles as Styles, boldness: c.boldness };
      const { result, ledger } = explainScore(P.readings[c.reading], opts);
      expect(result).toEqual(score(P.readings[c.reading], opts));
      if (!ledger) continue;
      const earned = ledger.credits.filter((x) => x.earned).reduce((a, x) => a + x.points, 0);
      const impacts = ledger.rules.reduce((a, r) => a + r.impact, 0);
      const total = ledger.base + earned + ledger.partialBoost - impacts + ledger.adjust + ledger.rounding;
      if (Math.abs(total - ledger.overall) > 1e-9) bad.push(`${c.reading}@${c.occasion}: ${total} vs ${ledger.overall}`);
      if (ledger.rules.map((r) => r.id).join() !== result.rulesFired.join()) bad.push(`${c.reading}: rule order`);
      if (bad.length > 10) break;
    }
    expect(bad).toEqual([]);
  });

  it("p01b at Date: 8.0 from 7 + elevated chinos + matching sneakers; layer held, not worn", () => {
    const { ledger } = explainScore(loadReading("p01b"), { occasion: "date", styles: DEMO });
    expect(ledger!.overall).toBe(8.0);
    expect(ledger!.credits.map((c) => [c.id, c.earned, c.evidenceIndex, c.reason])).toEqual([
      ["K2_elevated_piece", true, 1, null],
      ["K4_shoes_complement", true, 2, null],
      ["K1_layered", false, null, "heldNotWorn"],
      ["K3_point_of_interest", false, null, "allNeutral"],
    ]);
    expect(ledger!.credits[2]!.heldIndex).toBe(0);
    expect(ledger!.rules).toEqual([]);
    expect(ledger!.rounding).toBe(0);
    expect(ledger!.occasionRuleFired).toBe(false);
  });

  it("p01a: 8.75 shows as 9.0, so a +0.25 rounding row", () => {
    const { ledger } = explainScore(loadReading("p01a"), { occasion: "date", styles: DEMO });
    expect(ledger!.overall).toBe(9.0);
    expect(ledger!.rounding).toBeCloseTo(0.25, 9);
  });

  it("s24 at Everyday: loungewear outside the gym costs 0.6, shoes not rated, 6.5", () => {
    const { ledger } = explainScore(loadReading("s24"), { occasion: "everyday", styles: DEMO });
    expect(ledger!.overall).toBe(6.5);
    expect(ledger!.rules.map((r) => [r.id, r.culpritIndex])).toEqual([["O4_loungewear_out", 1]]);
    expect(ledger!.rules[0]!.impact).toBeCloseTo(0.6, 9);
    expect(ledger!.notRated).toEqual(["shoes"]);
    expect(ledger!.occasionRuleFired).toBe(true);
    expect(ledger!.credits.find((c) => c.id === "K4_shoes_complement")!.reason).toBe("shoesHidden");
  });

  it("an unscored reading has no ledger", () => {
    const r = loadReading("p01b");
    const { ledger } = explainScore({ ...r, scene: { ...r.scene, clothed: "partial" } }, { occasion: "date" });
    expect(ledger).toBeNull();
  });
});

// THE most important test: every case in fixtures/rubric_parity.json (5,694) must equal rubric.py exactly,
// including the unrounded doubles (bit for bit). If TS and Python disagree, TS is wrong: never edit rubric.py
// or the fixtures to make this pass.
import { describe, expect, it } from "vitest";
import { nearest, pyRound, roundHalf, score, type Styles } from "../src/index";
import { diff, loadJSON, toPy } from "./helpers";

interface ParityCase {
  reading: string;
  occasion: string;
  styles: [string, number][];
  boldness: string;
  fp_boundary?: string;
  expected: Record<string, unknown>;
}
const P = loadJSON<{ readings: Record<string, any>; cases: ParityCase[]; counts: { cases: number } }>("rubric_parity.json");

describe("rubric parity (rubric.py v3.1)", () => {
  it("has all 5,694 cases", () => {
    expect(P.cases.length).toBe(P.counts.cases);
    expect(P.cases.length).toBe(5694);
  });

  it("matches every case exactly", () => {
    const mismatches: string[] = [];
    for (const c of P.cases) {
      const got = toPy(score(P.readings[c.reading], { occasion: c.occasion, styles: c.styles as Styles, boldness: c.boldness }));
      mismatches.push(...diff(`${c.reading}@${c.occasion} ${JSON.stringify(c.styles)} ${c.boldness}`, got, c.expected));
      if (mismatches.length > 20) break;
    }
    expect(mismatches).toEqual([]);
  });

  it("matches the 27 fp_boundary cases (debug these first if a half point is off)", () => {
    const fp = P.cases.filter((c) => c.fp_boundary);
    expect(fp.length).toBe(27);
    for (const c of fp) {
      const r = score(P.readings[c.reading], { occasion: c.occasion, styles: c.styles as Styles, boldness: c.boldness });
      expect(r.overall).toBe(c.expected["overall"]);
      expect(r.overall === null ? null : r.rawUnrounded).toBe(c.expected["raw_unrounded"]);
    }
  });

  it("never mutates its input (rubric.py does; the port scores a copy)", () => {
    const id = Object.keys(P.readings).find((k) => JSON.stringify(P.readings[k]).includes("flare_bootcut"))!;
    const before = JSON.stringify(P.readings[id]);
    score(P.readings[id], { styles: [["streetwear", 1]] });
    expect(JSON.stringify(P.readings[id])).toBe(before);
  });

  it("rounds like rubric.py", () => {
    expect(roundHalf(8.75)).toBe(9.0);
    expect(roundHalf(7.775)).toBe(8.0);
    expect(roundHalf(9.25)).toBe(9.5);
    expect(roundHalf(6.749999999999999)).toBe(6.5);
    expect(nearest(0.5)).toBe(1);
    expect(pyRound(0.125, 2)).toBe(0.12); // Python round(): exact ties go to even
    expect(pyRound(2.675, 2)).toBe(2.67); // 2.675 is really 2.67499999...
    expect(pyRound(6.774999999999999, 3)).toBe(6.775);
  });
});

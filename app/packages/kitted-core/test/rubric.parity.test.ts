// THE most important test: every case in fixtures/rubric_parity.json must equal rubric.py exactly,
// including the unrounded doubles (bit for bit). If TS and Python disagree, TS is wrong: never edit rubric.py
// or the fixtures to make this pass.
import { describe, expect, it } from "vitest";
import { askQuestion, deepEqual, detectStyles, nearest, pyRound, roundHalf, score, type Styles } from "../src/index";
import { askToPy, diff, loadJSON, toPy } from "./helpers";

interface ParityCase {
  reading: string;
  occasion: string;
  styles: [string, number][];
  boldness: string;
  fp_boundary?: string;
  expected: Record<string, unknown>;
  ask: Record<string, unknown> | null;
}
const P = loadJSON<{ readings: Record<string, any>; cases: ParityCase[]; counts: { cases: number; fp_boundary_cases: Record<string, number> } }>("rubric_parity.json");

describe("rubric parity (rubric.py v4.0)", () => {
  it("has every case", () => {
    expect(P.cases.length).toBe(P.counts.cases);
    expect(P.cases.length).toBeGreaterThan(7000);
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

  it("matches the one quick tap (askQuestion) on every case", () => {
    const mismatches: string[] = [];
    for (const c of P.cases) {
      const got = askToPy(askQuestion(P.readings[c.reading], { occasion: c.occasion, styles: c.styles as Styles, boldness: c.boldness }));
      if (!deepEqual(got, c.ask)) mismatches.push(`${c.reading}@${c.occasion}: ${JSON.stringify(got)} vs ${JSON.stringify(c.ask)}`);
      if (mismatches.length > 20) break;
    }
    expect(mismatches).toEqual([]);
    expect(P.cases.some((c) => c.ask !== null)).toBe(true);
  });

  it("matches the fp_boundary cases (debug these first if a half point is off)", () => {
    const fp = P.cases.filter((c) => c.fp_boundary);
    expect(fp.length).toBe(Object.values(P.counts.fp_boundary_cases).reduce((a, b) => a + b, 0));
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

  it("detectStyles on a reading = the detected styles and label score() reports", () => {
    for (const c of P.cases.slice(0, 600)) {
      const s = score(P.readings[c.reading], { occasion: c.occasion, styles: c.styles as Styles, boldness: c.boldness });
      if (s.overall === null) continue;
      const d = detectStyles(P.readings[c.reading], c.styles as Styles);
      expect([d.detected, d.label]).toEqual([s.detectedStyles, s.styleLabel]);
    }
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

// The demo's numbers: every demo reading x 9 occasions (expected_scores.json -> cases), the 24 mockup checks,
// the "Not quite right?" correction, the partial checks, and the scripted firstRun story end to end.
import { describe, expect, it } from "vitest";
import {
  applyCorrection, correctionLine, fixTargets, mergeShoeSnap, partialLabel, pickShoesFromCloset, recheckMerge, score,
  scoreWord, suggestFixes, type RubricResult, type ScoredResult, type Styles,
} from "../src/index";
import { diff, loadJSON, loadReading, seedCloset, toPy } from "./helpers";

const E = loadJSON("expected_scores.json");
const DEMO = E.profile.styles as Styles;
const CLOSET = seedCloset();

function withWords(r: RubricResult): Record<string, unknown> {
  return { ...toPy(r), word: scoreWord(r.overall), partial_label: partialLabel(r.overall === null ? [] : r.notRated) };
}

describe("demo score cases (181)", () => {
  const by: Record<string, Record<string, unknown>> = {};
  it("every demo reading at every occasion chip", () => {
    const mismatches: string[] = [];
    for (const c of E.cases as any[]) {
      const got = withWords(score(loadReading(c.reading), { occasion: c.occasion, styles: c.styles, boldness: c.boldness }));
      by[c.id] = got;
      mismatches.push(...diff(c.id, got, c.expected));
    }
    expect(E.cases.length).toBe(181);
    expect(mismatches).toEqual([]);
  });

  it("the 24 numbers the mockups draw (rubric v4 values; make_expected.py lists the ones that differ)", () => {
    expect(E.mockup_checks.length).toBe(24);
    for (const m of E.mockup_checks as any[]) {
      const got = withWords(score(loadReading(m.case.split("@")[0].split("#")[0]), {
        occasion: m.case.split("@")[1].split("#")[0], styles: m.case.includes("#no_styles") ? [] : DEMO,
      }));
      expect(diff(m.case, { [m.field]: got[m.field] }, { [m.field]: m.want })).toEqual([]);
    }
  });
});

describe("corrections", () => {
  for (const c of E.corrections as any[]) {
    it(c.id, () => {
      const orig = loadReading(c.reading);
      const fixed = applyCorrection(orig, c.garmentIndex, c.field, c.to);
      expect(orig.garments[c.garmentIndex]![c.field]).toBe(c.from); // the original is never edited
      const before = score(orig, { occasion: c.occasion, styles: DEMO }) as ScoredResult;
      const s = score(fixed, { occasion: c.occasion, styles: DEMO }) as ScoredResult;
      const got = { overall: s.overall, raw_unrounded: s.rawUnrounded, rules_fired: s.rulesFired,
        line: correctionLine(before.overall, s.overall), closetPill: "Closet updated" };
      expect(diff(c.id, got, c.expected)).toEqual([]);
    });
  }
});

describe("partial checks", () => {
  const s24 = loadReading("s24");
  for (const p of E.partials as any[]) {
    it(p.id, () => {
      const r = p.snap_reading ? mergeShoeSnap(s24, p.snap_reading) : pickShoesFromCloset(s24, CLOSET.find((c) => c.id === "S1")!);
      const s = score(r, { occasion: "everyday", styles: DEMO }) as ScoredResult;
      const got = { reading: r, overall: s.overall, raw_unrounded: s.rawUnrounded, rules_fired: s.rulesFired,
        credits: s.credits, not_rated: s.notRated, partial: s.partial };
      expect(diff(p.id, got, p.expected)).toEqual([]);
    });
  }

  it("s24 is a partial check: shoes not included, 6.5 Getting there; 7.0 at Gym", () => {
    const s = score(s24, { occasion: "everyday", styles: DEMO }) as ScoredResult;
    expect(partialLabel(s.notRated)).toBe("Partial check: shoes not included");
    expect([s.overall, scoreWord(s.overall)]).toEqual([6.5, "Getting there"]);
    expect(score(s24, { occasion: "gym", styles: DEMO }).overall).toBe(7.0);
  });
});

describe("firstRun story (screens 5-10)", () => {
  it("p01b at Date: 8.0 Sharp -> fix -> correction stays 8.0 -> re-check 9.0 Dialed in", () => {
    const p01b = loadReading("p01b");
    const first = score(p01b, { occasion: "date", styles: DEMO }) as ScoredResult;
    expect([first.overall, scoreWord(first.overall), first.rulesFired, first.credits])
      .toEqual([8.0, "Sharp", [], ["K2_elevated_piece", "K4_shoes_complement"]]);

    const card = suggestFixes(p01b, { occasion: "date", styles: DEMO, firstCheck: true });
    expect(card.fixes.map((f) => [f.copy, f.to, f.gain, f.rawGain])).toEqual([["Wear the overshirt, open", 9.0, 1.0, 0.75]]);

    const corrected = applyCorrection(p01b, 1, "leg_shape", "slim");
    const c = score(corrected, { occasion: "date", styles: DEMO }) as ScoredResult;
    expect(correctionLine(first.overall, c.overall)).toBe("Score stays 8.0");
    // rubric v4: slim is inside the general band, so the correction changes nothing (v3.1: 7.775 via the demo picks)
    expect(c.rawUnrounded).toBe(8.0);

    const { merged, notes } = recheckMerge(p01b, loadReading("p01a"), fixTargets(card.fixes), { occasion: "date", styles: DEMO });
    const after = score(merged, { occasion: "date", styles: DEMO }) as ScoredResult;
    expect([after.overall, scoreWord(after.overall), after.overall - first.overall, notes]).toEqual([9.0, "Dialed in", 1.0, ["changed: outerwear"]]);
  });

  it("welcome example: s15 with no styles picked = 8.0 Sharp, full check (rubric v4; the mockup draws 8.5)", () => {
    const s = score(loadReading("s15"), { occasion: "everyday", styles: [] }) as ScoredResult;
    expect([s.overall, scoreWord(s.overall), s.partial]).toEqual([8.0, "Sharp", false]);
  });
});

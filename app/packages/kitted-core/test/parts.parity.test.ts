// Parts engine parity: every case in fixtures/parts_parity.json must equal parts_proto.py (v8, or the named tune
// variant) exactly: parts, reasons and tips in order, NA, condition, occasion, the lowest-part line, the bonus, the
// final score, and the unrounded average / final within 1e-9. If TS and Python disagree, TS is wrong: never edit
// parts_proto.py or the fixtures to make this pass (regenerate with make_parts_parity.py after a Python change).
import { describe, expect, it } from "vitest";
import {
  createParts, deepEqual, PARTS_DATA, partsCardRow, scoreParts, type PartResult, type PartsData, type PartsResult, type Reading,
  type SecondLookInput, type Styles,
} from "../src/index";
import { loadJSON } from "./helpers";

interface PartsCase {
  src: string;
  reading: string;
  occasion: string;
  styles: [string, number][];
  boldness: string;
  second_look: SecondLookInput | null;
  tune?: string;
  fp_boundary?: string;
  expected: Record<string, unknown>;
}
interface PartsParity {
  parts_version: string;
  parts_proto_sha256: string;
  counts: Record<string, number> & { cases: number; python_errors: number };
  tunes: Record<string, { engine: string; label: string; tune: PartsData["tune"] }>;
  pool: unknown[];
  readings: Record<string, Reading>;
  cases: PartsCase[];
}
const P = loadJSON<PartsParity>("parts_parity.json");
const RP = loadJSON<{ readings: Record<string, Reading> }>("rubric_parity.json");
const readingOf = (id: string): Reading => {
  const r = P.readings[id] ?? RP.readings[id];
  if (!r) throw new Error(`reading ${id} not in parts_parity.json or rubric_parity.json`);
  return r;
};
const engines = new Map(Object.entries(P.tunes).map(([k, v]) => [k, createParts({ ...PARTS_DATA, ...v })]));

function partToPy(p: PartResult): Record<string, unknown> {
  return {
    score: p.score, display: p.display, na: p.na, reasons: p.reasons,
    tips: p.tips.map((t) => ({ check: t.check, line: t.line, would_cost: t.wouldCost })),
  };
}

/** TS PartsResult -> parts_proto.score_parts()'s dict (the fixture's keys). */
function toPy(r: PartsResult): Record<string, unknown> {
  const parts: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(r.parts)) parts[k] = partToPy(v);
  if (r.overall === null) return { overall: null, reason: r.reason, parts, na_parts: r.naParts };
  return {
    overall: r.overall, raw_score: r.rawScore, average: r.average, earned_bonus: r.earnedBonus, piled_penalty: r.piledPenalty, version: r.version, engine: r.engine,
    parts, na_parts: r.naParts, weights_used: r.weightsUsed,
    condition: { ...r.condition, tips: r.condition.tips.map((t) => ({ check: t.check, line: t.line, would_cost: t.wouldCost })) }, occasion: r.occasion, floored: r.floored,
    care_or_strain: r.careOrStrain, lowest: r.lowest, second_look: { peek: r.secondLook.peek, rests_on_shoe: r.secondLook.restsOnShoe },
    detected_styles: r.detectedStyles, style_label: r.styleLabel, not_rated: r.notRated, partial: r.partial,
    average_unrounded: r.averageUnrounded, raw_unrounded: r.rawUnrounded,
  };
}

/** The fixture's expected dict with the interned pool references resolved. */
function expand(e: Record<string, unknown>): Record<string, unknown> {
  const out = { ...e };
  const at = (i: unknown) => P.pool[i as number];
  if (out["parts"]) out["parts"] = Object.fromEntries(Object.entries(out["parts"] as Record<string, number>).map(([k, i]) => [k, at(i)]));
  for (const k of ["condition", "occasion", "lowest", "weights_used"]) if (k in out) out[k] = at(out[k]);
  return out;
}

function run(c: PartsCase): PartsResult {
  const eng = c.tune ? engines.get(c.tune)! : undefined;
  const opts = { occasion: c.occasion, styles: c.styles as Styles, boldness: c.boldness, secondLook: c.second_look };
  return eng ? eng.scoreParts(readingOf(c.reading), opts) : scoreParts(readingOf(c.reading), opts);
}

function mismatch(c: PartsCase): string | null {
  const label = `${c.src} ${c.reading}@${c.occasion}${c.tune ? " [" + c.tune + "]" : ""}`;
  if ("error" in c.expected) {
    try {
      run(c);
    } catch (e) {
      return String((e as Error).message) === c.expected["error"] ? null : `${label}: threw ${String(e)} want ${String(c.expected["error"])}`;
    }
    return `${label}: did not throw; Python raised ${String(c.expected["error"])}`;
  }
  const got = toPy(run(c));
  const want = expand(c.expected);
  const out: string[] = [];
  const keys = new Set([...Object.keys(got), ...Object.keys(want)]);
  for (const k of keys) {
    if (k === "average_unrounded" || k === "raw_unrounded") {
      const a = got[k] as number, b = want[k] as number;
      if (typeof a !== "number" || typeof b !== "number" || Math.abs(a - b) > 1e-9) out.push(`${k} got ${a} want ${b}`);
    } else if (!deepEqual(got[k], want[k])) {
      out.push(`${k} got ${JSON.stringify(got[k])} want ${JSON.stringify(want[k])}`);
    }
  }
  return out.length ? `${label}: ${out.join(" | ")}` : null;
}

describe("parts engine parity (parts_proto.py v16)", () => {
  it("has every case, from the same prototype and data version", () => {
    expect(P.cases.length).toBe(P.counts.cases);
    expect(P.cases.length).toBeGreaterThan(10000);
    expect(P.counts.rubric_parity_cases).toBeGreaterThan(7000);
    expect(P.parts_version).toBe(PARTS_DATA.version);
    expect(P.parts_proto_sha256).toBe(PARTS_DATA.sourceSha256);
  });

  it("matches every v16 case exactly", () => {
    const bad: string[] = [];
    for (const c of P.cases) {
      if (c.tune) continue;
      const m = mismatch(c);
      if (m) bad.push(m);
      if (bad.length > 20) break;
    }
    expect(bad).toEqual([]);
  });

  it("matches the tune variants (v1 to v15, the v4 to v15 what-ifs and any v16 what-if): tuning is a data change", () => {
    const tuned = P.cases.filter((c) => c.tune);
    // v15 is what SLIDES_ONCE_V16 rolls back to (T93), so it is parity-tested as a tune, like v13 and v14
    expect(Object.keys(P.tunes)).toEqual(expect.arrayContaining(["v13", "v14", "v15"]));
    expect(new Set(tuned.map((c) => c.tune))).toEqual(new Set(Object.keys(P.tunes)));
    const bad: string[] = [];
    for (const c of tuned) {
      const m = mismatch(c);
      if (m) bad.push(m);
      if (bad.length > 20) break;
    }
    expect(bad).toEqual([]);
  });

  it("throws where Python raises (prototype bugs, reported, not fixed in the port)", () => {
    const errs = P.cases.filter((c) => "error" in c.expected);
    expect(errs.length).toBe(P.counts.python_errors);
    for (const c of errs) expect(mismatch(c)).toBeNull();
  });

  it("matches the fp_boundary cases exactly (debug these first if a half point is off)", () => {
    for (const c of P.cases.filter((x) => x.fp_boundary)) {
      const r = run(c);
      expect(r.overall).toBe(c.expected["overall"]);
      expect(r.overall === null ? null : r.rawUnrounded).toBe(c.expected["raw_unrounded"]);
    }
  });

  it("picks never move a number: every parity reading scores the same with no picks, one, three or his own", () => {
    const STY = ["streetwear", "minimalist", "smart_casual", "classic_prep", "workwear", "outdoor", "vintage_sport"];
    const PICKS: Styles[] = [[], ...STY.map((s) => [[s, 1]] as Styles),
      [["streetwear", 0.5], ["vintage_sport", 0.25], ["smart_casual", 0.25]], [["minimalist", 0.5], ["smart_casual", 0.5]]];
    const sig = (r: PartsResult) => JSON.stringify([r.overall, r.overall === null ? null : r.rawUnrounded,
      Object.entries(r.parts).map(([k, p]) => [k, p.score])]);
    const bad: string[] = [];
    const seen = new Set<string>();
    let n = 0;
    for (const c of P.cases) {
      if (c.tune || "error" in c.expected) continue;
      const key = `${c.reading}|${c.occasion}|${c.boldness}|${JSON.stringify(c.second_look)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const opts = { occasion: c.occasion, boldness: c.boldness, secondLook: c.second_look };
      const want = sig(scoreParts(readingOf(c.reading), { ...opts, styles: c.styles as Styles }));
      // every picks set on the everyday cases; elsewhere none plus one rotating set (keeps the test fast)
      const sets = c.occasion === "everyday" ? PICKS : [PICKS[0]!, PICKS[1 + (n % (PICKS.length - 1))]!];
      for (const st of sets) {
        const got = sig(scoreParts(readingOf(c.reading), { ...opts, styles: st }));
        if (got !== want) bad.push(`${c.src} ${c.reading}@${c.occasion} picks ${JSON.stringify(st)}: ${got} vs ${want}`);
      }
      n++;
      if (bad.length > 20) break;
    }
    expect(n).toBeGreaterThan(5000);
    expect(bad).toEqual([]);
  });

  it("Parity · the T93 slides readings are in the set at their occasion, from a v16 run", () => {
    // every default case is v16's; and the slides-once readings (slides_shape_paper.py's OUTFITS, as rules_conformance.py
    // builds them: add those cases' readings verbatim) are parity cases at their own occasion with no tune
    const defaults = P.cases.filter((c) => !c.tune && !("error" in c.expected));
    // (unscored cases carry no engine in Python or the core: D2, settled by the test writer)
    expect(defaults.filter((c) => c.expected["overall"] !== null && c.expected["engine"] !== "v16").length).toBe(0);
    const RC = loadJSON<{ cases: { id: string; reading: Reading; occasion: string }[] }>("rules_conformance.json");
    const ids = ["SHO-14-street", "SHO-14-sneakers-win", "SHO-14-going-out", "SHO-14-interview", "SHO-14-drag", "SHO-14-no-shape",
      "SHO-14-no-shape-shorts", "SHO-14-lounge", "PRO-17-slides-wide", "SHO-14-cargos", "SHO-14-blazer"];
    const missing: string[] = [];
    for (const id of ids) {
      const rc = RC.cases.find((c) => c.id === id);
      if (!rc) { missing.push(`${id} (not in rules_conformance.json)`); continue; }
      const hit = defaults.find((c) => c.occasion === rc.occasion && deepEqual(readingOf(c.reading), rc.reading));
      if (!hit) missing.push(`${id} @${rc.occasion}`);
    }
    expect(missing).toEqual([]);
  });

  it("never mutates its input", () => {
    const c = P.cases.find((x) => x.src.startsWith("parts-edge:refile_vest"))!;
    const r = readingOf(c.reading);
    const before = JSON.stringify(r);
    scoreParts(r, { secondLook: { peek: true } });
    expect(JSON.stringify(r)).toBe(before);
  });

  it("leaves NA parts out of the card row", () => {
    const c = P.cases.find((x) => x.src.startsWith("parts-edge:shoes_hidden") && !x.tune)!;
    const r = run(c);
    expect(r.overall).not.toBeNull();
    expect(partsCardRow(r)).not.toContain("Shoes");
    expect(partsCardRow(r).split(" · ").length).toBe(4);
  });
});

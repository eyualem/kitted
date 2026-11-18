// Parts engine parity: every case in fixtures/parts_parity.json must equal parts_proto.py (v8, or the named tune
// variant) exactly: parts, reasons and tips in order, NA, condition, occasion, the lowest-part line, the bonus, the
// final score, and the unrounded average / final within 1e-9. If TS and Python disagree, TS is wrong: never edit
// parts_proto.py or the fixtures to make this pass (regenerate with make_parts_parity.py after a Python change).
import { describe, expect, it } from "vitest";
import {
  createParts, deepEqual, PARTS_DATA, partsCardRow, partsDataFor, scoreParts, type PartResult, type PartsData, type PartsResult, type Reading,
  type SecondLookInput, type Styles,
} from "../src/index";
import { loadJSON } from "./helpers";
import { KNEES, LOOKS, OPENINGS, v16ToPy } from "./t69";

interface PartsCase {
  src: string;
  reading: string;
  occasion: string;
  styles: [string, number][];
  boldness: string;
  second_look: SecondLookInput | null;
  tune?: string;
  fp_boundary?: string;
  /** T69: v16 cases only ("warm", or cool as null/absent) and the graded look (absent/null = the outfit's own). */
  season?: "warm" | null;
  graded_look?: string | string[] | null;
  /** T69: a named outfit's name, when the generator records it. */
  name?: string;
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
/** T69: the untagged cases are v15's; with v16 bundled they score on v15's tune (the third switch off). */
const V15 = createParts(partsDataFor(true, true, false));
const isV16 = (c: PartsCase) => c.tune === "v16" || (c.tune ?? "").startsWith("v16_whatif");

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
    ...(r.v16 ? { v16: v16ToPy(r.v16) } : {}),
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
  const eng = c.tune ? engines.get(c.tune)! : V15;
  const opts = { occasion: c.occasion, styles: c.styles as Styles, boldness: c.boldness, secondLook: c.second_look,
    ...(isV16(c) ? { season: c.season ?? null, gradedLook: c.graded_look ?? null } : {}) };
  return eng.scoreParts(readingOf(c.reading), opts);
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

describe("parts engine parity (parts_proto.py v15)", () => {
  it("has every case, from the same prototype and data version", () => {
    expect(P.cases.length).toBe(P.counts.cases);
    expect(P.cases.length).toBeGreaterThan(10000);
    expect(P.counts.rubric_parity_cases).toBeGreaterThan(7000);
    expect(P.parts_version).toBe(PARTS_DATA.version);
    expect(P.parts_proto_sha256).toBe(PARTS_DATA.sourceSha256);
  });

  it("matches every v15 case exactly", () => {
    const bad: string[] = [];
    for (const c of P.cases) {
      if (c.tune) continue;
      const m = mismatch(c);
      if (m) bad.push(m);
      if (bad.length > 20) break;
    }
    expect(bad).toEqual([]);
  });

  it("matches the tune variants (v1 to v14, the v4, v5, v6, v8, v9, v10, v11, v12, v13, v14 and v15 what-ifs): tuning is a data change", () => {
    const tuned = P.cases.filter((c) => c.tune);
    expect(new Set(tuned.map((c) => c.tune))).toEqual(new Set(Object.keys(P.tunes)));
    const bad: string[] = [];
    for (const c of tuned) {
      if (isV16(c)) continue; // T69-G1 below
      const m = mismatch(c);
      if (m) bad.push(m);
      if (bad.length > 20) break;
    }
    expect(bad).toEqual([]);
  });

  it("T69-G1 · matches every v16 case exactly", () => {
    const v16 = P.cases.filter((c) => c.tune === "v16");
    expect(v16.length).toBeGreaterThan(1000);
    const bad: string[] = [];
    for (const c of v16) {
      if (!("error" in c.expected) && !("v16" in c.expected)) bad.push(`${c.src}: the fixture has no v16 block`);
      const m = mismatch(c);
      if (m) bad.push(m);
      if (bad.length > 20) break;
    }
    expect(bad).toEqual([]);
  }, 300_000);

  it("T69-G1 · matches every v16 what-if case exactly", () => {
    const what = P.cases.filter((c) => (c.tune ?? "").startsWith("v16_whatif"));
    expect(what.length).toBeGreaterThan(100);
    // every off-by-default knob has a what-if tune that turns it on (Q-T7), including the top-of-scale three
    const tunes = Object.entries(P.tunes).filter(([k]) => k.startsWith("v16_whatif")).map(([, v]) => v.tune as unknown as Record<string, unknown>);
    const tasteVals = (k: string) => new Set(tunes.map((t) => JSON.stringify((t["taste"] as Record<string, unknown> | null)?.[k] ?? null)));
    const tuneVals = (k: string) => new Set(tunes.map((t) => JSON.stringify(t[k] ?? null)));
    const want: [string, unknown, boolean][] = [
      ["leg_look_mode", "replace", true], ["leg_look_mode", "off", true], ["leg_look_global", true, true], ["accent_by_look", true, true],
      ["accent_agree", true, true], ["pn1_look", true, true], ["sil_mode", "single", true], ["sil_mode", "top_up", true], ["sil_mode", "shape", true],
      ["long_top_read", "ruler", true], ["shorts", 0.5, true], ["color", 0.5, true], ["h7_tip", false, true], ["v16_h9_cap", true, false],
    ];
    for (const [k, v, inTaste] of want) expect([k, v, (inTaste ? tasteVals(k) : tuneVals(k)).has(JSON.stringify(v))]).toEqual([k, v, true]);
    expect([...tuneVals("raw_cap")].some((x) => x !== "9.5" && x !== "null")).toBe(true);
    expect([...tuneVals("curve_knee")].some((x) => x !== "null")).toBe(true);
    expect([...tuneVals("stack_clean")].some((x) => x !== "null")).toBe(true);
    const bad: string[] = [];
    for (const c of what) {
      const m = mismatch(c);
      if (m) bad.push(m);
      if (bad.length > 20) break;
    }
    expect(bad).toEqual([]);
  }, 300_000);

  it("T69-G1 · the v16 cases cover both seasons, every graded look, every leg answer, the swaps and the 15 named outfits", () => {
    expect(P.counts.python_errors).toBe(0);
    expect(P.parts_version).toBe("2.0.0");
    expect(PARTS_DATA.version).toBe("2.0.0");
    expect(P.parts_proto_sha256).toBe(PARTS_DATA.sourceSha256);
    expect(P.tunes["v16"]?.engine).toBe("v16");
    const v16 = P.cases.filter((c) => c.tune === "v16");
    expect(new Set(v16.map((c) => c.season ?? null))).toEqual(new Set([null, "warm"]));
    const looks = new Set(v16.map((c) => JSON.stringify(c.graded_look ?? null)));
    for (const lk of LOOKS) expect([lk, looks.has(JSON.stringify(lk)) || looks.has(JSON.stringify([lk]))]).toEqual([lk, true]);
    expect(looks.has(JSON.stringify(["streetwear", "tailored"]))).toBe(true);
    // all 16 knee x opening answers, and none, on each leg and on shorts
    const SHORTS = new Set(["shorts", "athletic_shorts"]);
    const legOf = (c: PartsCase) => {
      const b = readingOf(c.reading).garments.find((g) => g.category === "bottom");
      return !b ? null : SHORTS.has(String(b.subcategory)) ? "shorts" : String(b.leg_shape);
    };
    const seen = new Set<string>();
    for (const c of v16) {
      const leg = legOf(c);
      const sl = (c.second_look ?? {}) as Record<string, unknown>;
      seen.add(`${leg}|${"knee" in sl || "opening" in sl ? `${String(sl["knee"])}/${String(sl["opening"])}` : "none"}`);
    }
    const missing: string[] = [];
    for (const leg of ["straight", "relaxed", "wide", "slim", "skinny", "shorts"]) {
      if (!seen.has(`${leg}|none`)) missing.push(`${leg}|none`);
      for (const k of KNEES) for (const o of OPENINGS) if (!seen.has(`${leg}|${k}/${o}`)) missing.push(`${leg}|${k}/${o}`);
    }
    expect(missing).toEqual([]);
    // the steady-class swaps: an oxford, a Chelsea boot, an "other" shoe, an oxford under a blazer, chinos with a blazer
    const has = (pred: (gs: Reading["garments"]) => boolean) => v16.some((c) => pred(readingOf(c.reading).garments));
    const sub = (gs: Reading["garments"], cat: string, s: string) => gs.some((g) => g.category === cat && g.subcategory === s);
    expect(has((gs) => sub(gs, "top", "oxford_shirt"))).toBe(true);
    expect(has((gs) => sub(gs, "footwear", "chelsea_boot"))).toBe(true);
    expect(has((gs) => sub(gs, "footwear", "other"))).toBe(true);
    expect(has((gs) => sub(gs, "top", "oxford_shirt") && sub(gs, "outerwear", "blazer"))).toBe(true);
    expect(has((gs) => sub(gs, "bottom", "chinos") && sub(gs, "outerwear", "blazer"))).toBe(true);
    // v16_paper.NAMED: 15 distinct outfits, each cool and warm
    const named = v16.filter((c) => c.src === "named" || c.src.startsWith("named:"));
    const byName = new Map<string, Set<string>>();
    for (const c of named) {
      const key = c.name ?? (c.src === "named" ? c.reading : c.src);
      byName.set(key, (byName.get(key) ?? new Set()).add(c.season ?? "cool"));
    }
    expect(byName.size).toBe(15);
    for (const [k, s] of byName) expect([k, [...s].sort()]).toEqual([k, ["cool", "warm"]]);
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

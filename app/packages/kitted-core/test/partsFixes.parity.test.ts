// Parts fix engine parity: every case in fixtures/parts_fixes.json must equal handoff/fixtures/parts_fixes.py
// exactly (fixes in order with their numbers, copy, tags and raised parts; the Smaller step; the Next level line; the
// "no fix" line). If TS and Python disagree, TS is wrong: never edit parts_fixes.py or the fixtures to make this pass
// (regenerate with make_parts_fixes.py after a Python or catalog change).
import { describe, expect, it } from "vitest";
import {
  deepEqual, PARTS_DATA, PARTS_FIXES_DATA, suggestPartsFixes, type ClosetItem, type PartsFixSuggestions, type Reading,
  type SecondLookInput, type Styles,
} from "../src/index";
import { loadJSON } from "./helpers";

interface FixCase {
  src: string;
  reading: string;
  occasion: string;
  second_look: SecondLookInput | null;
  warm: boolean;
  closet: "seed" | "empty";
  first_check: boolean;
  expected: Record<string, unknown> & { fixes: number[]; smaller_step: number | null };
}
interface FixParity {
  catalog_version: string;
  parts_proto_sha256: string;
  profile: [string, number][];
  boldness: string;
  occasions: string[];
  closet: ClosetItem[];
  counts: Record<string, number> & { cases: number };
  coverage: Record<string, number>;
  pool: Record<string, unknown>[];
  readings: Record<string, Reading>;
  cases: FixCase[];
}
const F = loadJSON<FixParity>("parts_fixes.json");
const RP = loadJSON<{ readings: Record<string, Reading> }>("rubric_parity.json");
const readingOf = (id: string): Reading => {
  const r = F.readings[id] ?? RP.readings[id];
  if (!r) throw new Error(`reading ${id} not in parts_fixes.json or rubric_parity.json`);
  return r;
};

function run(c: FixCase): PartsFixSuggestions {
  return suggestPartsFixes(readingOf(c.reading), {
    occasion: c.occasion, styles: F.profile as Styles, boldness: F.boldness, secondLook: c.second_look,
    closet: c.closet === "seed" ? F.closet : [], warm: c.warm, firstCheck: c.first_check,
  });
}

/** TS result -> parts_fixes.suggest_parts_fixes()'s dict (edits are checked against the catalog separately). */
function toPy(r: PartsFixSuggestions): Record<string, unknown> {
  return {
    base_overall: r.baseOverall, base_raw: r.baseRaw,
    fixes: r.fixes.map((f) => ({
      id: f.id, group: f.group, class: f.class, effort: f.effort, free: f.free, to: f.to, to_raw: f.toRaw, gain: f.gain,
      raw_gain: f.rawGain, item_id: f.itemId, copy: f.copy, tag: f.tag, raises: f.raises, raises_line: f.raisesLine,
    })),
    smaller_step: r.smallerStep && {
      id: r.smallerStep.id, class: r.smallerStep.class, item_id: r.smallerStep.itemId, part: r.smallerStep.part,
      from: r.smallerStep.from, to: r.smallerStep.to, raw_gain: r.smallerStep.rawGain, line: r.smallerStep.line,
    },
    next_level: r.nextLevel, none_line: r.noneLine,
  };
}

function expand(e: FixCase["expected"]): Record<string, unknown> {
  return { ...e, fixes: e.fixes.map((i) => F.pool[i]), smaller_step: e.smaller_step === null ? null : F.pool[e.smaller_step] };
}

function mismatch(c: FixCase): string | null {
  const got = toPy(run(c));
  const want = expand(c.expected);
  const out: string[] = [];
  for (const k of new Set([...Object.keys(got), ...Object.keys(want)])) {
    if (!deepEqual(got[k], want[k])) out.push(`${k} got ${JSON.stringify(got[k])} want ${JSON.stringify(want[k])}`);
  }
  return out.length ? `${c.src} [${c.warm ? "warm" : "cool"}, ${c.closet}${c.first_check ? ", first" : ""}]: ${out.join(" | ")}` : null;
}

describe("parts fix engine parity (parts_fixes.py)", () => {
  it("has every case, from the same catalog and prototype", () => {
    expect(F.cases.length).toBe(F.counts.cases);
    expect(F.cases.length).toBeGreaterThan(10000);
    expect(F.catalog_version).toBe(PARTS_FIXES_DATA.version);
    expect(F.parts_proto_sha256).toBe(PARTS_DATA.sourceSha256);
    for (const c of PARTS_FIXES_DATA.candidates) expect(F.coverage[`fix ${c.id}`] ?? 0).toBeGreaterThan(0);
  });

  it("matches every case exactly", () => {
    const bad: string[] = [];
    for (const c of F.cases) {
      const m = mismatch(c);
      if (m) bad.push(m);
      if (bad.length > 20) break;
    }
    expect(bad).toEqual([]);
  }, 180_000);

  it("each fix carries its catalog edits", () => {
    const byId = new Map(PARTS_FIXES_DATA.candidates.map((c) => [c.id, c.edits]));
    for (const c of F.cases.slice(0, 2000)) for (const f of run(c).fixes) expect(f.edits).toEqual(byId.get(f.id));
  });

  it("the friend's blazer (d1967f): navy chinos to 8.0, dark straight jeans as the Smaller step", () => {
    const c = F.cases.find((x) => x.src.includes("|phone-d1967f@class") && !x.warm && x.closet === "empty" && !x.first_check);
    expect(c).toBeDefined();
    const r = run(c!);
    expect(r.baseOverall).toBe(7.0);
    expect(r.fixes.map((f) => [f.copy, f.to])).toContainEqual(["Swap the jeans for navy chinos", 8.0]);
    expect(r.smallerStep?.line).toBe("Dark straight jeans lift Style to 7.5, but the score stays 7.0.");
  });

  it("never shows a gain that doesn't happen, and never mutates its input", () => {
    for (const c of F.cases.slice(0, 1500)) {
      const reading = readingOf(c.reading);
      const before = JSON.stringify(reading);
      const r = run(c);
      expect(JSON.stringify(reading)).toBe(before);
      for (const f of r.fixes) {
        expect(f.gain).toBeGreaterThanOrEqual(0.5);
        expect(f.to).toBe((r.baseOverall ?? 0) + f.gain);
      }
      expect(r.fixes.length).toBeLessThanOrEqual(3);
    }
  });
});

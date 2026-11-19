// T65 ER1.6: every rule the parts engine can charge or credit has a plain name in core, and no score moves.
// The coverage test runs the real engine (v16 and v15) over every reading in parts_parity.json and rubric_parity.json
// (all eight occasions, both seasons) and every case in rules_conformance.json, collects every rule id that fires, and
// fails on any id with no entry in RULE_NAMES. Fixtures are inputs only. The parity suites run unchanged, not here.
import { describe, expect, it } from "vitest";
import { createParts, PARTS_DATA, partsDataFor, RULE_IDS, RULE_NAMES, ruleName, type PartsOptions, type PartsResult, type Reading, type SecondLookInput, type Styles } from "../src/index";
import { loadJSON } from "./helpers";

const OCCASIONS = ["everyday", "work", "date", "interview", "gym", "home", "going_out", "wedding_formal"] as const;
const V16 = createParts(PARTS_DATA);
const V15 = createParts(partsDataFor(true, true, false));

const P = loadJSON<{ readings: Record<string, Reading>; cases: { reading: string; occasion: string; styles: [string, number][]; boldness: string; second_look: SecondLookInput | null; season?: "warm" | null }[] }>("parts_parity.json");
const RP = loadJSON<{ readings: Record<string, Reading> }>("rubric_parity.json");
interface RcCase { id: string; reading: Reading; occasion: string; styles: [string, number][]; boldness: string; second_look: SecondLookInput | null; engine?: string; season?: "warm" | null; graded_look?: string | string[] | null }
const RC = loadJSON<{ cases: RcCase[] }>("rules_conformance.json");

/** Every rule id one result fired (a part reason or tip, a condition tip, a lift, a cap, a taste rule, the heavy layer, the condition, the occasion). */
function collect(r: PartsResult, ids: Set<string>): void {
  for (const p of Object.values(r.parts)) {
    if (!p) continue;
    for (const x of p.reasons) ids.add(x.check);
    for (const x of p.tips) ids.add(x.check);
  }
  if (r.overall === null) return;
  for (const t of r.condition.tips) ids.add(t.check);
  if (r.condition.deduction > 0) ids.add("condition");
  const v = r.v16;
  if (v) {
    for (const l of v.lifts) ids.add(l.id);
    for (const c of v.caps) ids.add(c.id);
    for (const t of v.taste) ids.add(t.id);
    if (v.heavyLayer) ids.add("heavy_layer");
  }
}

describe("T65 ER1.6 · every engine rule has a plain name", () => {
  it("ER1.6 · coverage: every rule id the engine fires over the parity and conformance fixtures has a name", () => {
    const ids = new Set<string>();
    const readings = [...Object.values(P.readings), ...Object.values(RP.readings)];
    expect(readings.length).toBeGreaterThan(3000); // the sweep really runs over the fixtures
    for (const reading of readings) {
      for (const occasion of OCCASIONS) {
        collect(V15.scoreParts(reading, { occasion }), ids);
        collect(V16.scoreParts(reading, { occasion, season: null }), ids);
        collect(V16.scoreParts(reading, { occasion, season: "warm" }), ids);
      }
    }
    for (const c of P.cases) {
      const opts: PartsOptions = { occasion: c.occasion, styles: c.styles as Styles, boldness: c.boldness, secondLook: c.second_look };
      const reading = P.readings[c.reading] ?? RP.readings[c.reading]!;
      collect(V15.scoreParts(reading, opts), ids);
      for (const season of [null, "warm"] as const) collect(V16.scoreParts(reading, { ...opts, season }), ids);
    }
    for (const c of RC.cases) {
      const opts: PartsOptions = { occasion: c.occasion, styles: c.styles as Styles, boldness: c.boldness, secondLook: c.second_look };
      collect(V15.scoreParts(c.reading, opts), ids);
      for (const season of [null, "warm"] as const) collect(V16.scoreParts(c.reading, { ...opts, season, gradedLook: c.graded_look ?? null }), ids);
    }
    // the state ids that the sweep can only mark by their state: the three occasion ids, the condition, the heavy layer
    for (const id of ["condition", "occasion", "occasion_loungewear", "occasion_hold", "heavy_layer"]) ids.add(id);
    // every lift the engine defines, whether or not a fixture fires it
    for (const id of Object.keys(PARTS_DATA.v16!.liftNames)) ids.add(id);
    for (const v of Object.values(PARTS_DATA.v16!.lifts)) ids.add((v as unknown as [string])[0]);

    expect(ids.size).toBeGreaterThan(70); // the sweep really collected the engine's rules
    const unnamed: string[] = [];
    for (const id of Array.from(ids).sort()) {
      try {
        const n = ruleName(id);
        if (typeof n.plain !== "string" || n.plain === "") unnamed.push(`${id} (empty name)`);
      } catch {
        unnamed.push(id);
      }
    }
    expect(unnamed).toEqual([]);
  }, 300_000);

  it("ER1.6 · RULE_IDS has at least 74 entries, in table order, and ruleName reads the table", () => {
    expect(RULE_IDS.length).toBeGreaterThanOrEqual(74);
    expect(RULE_IDS).toEqual(Object.keys(RULE_NAMES));
    expect(new Set(RULE_IDS).size).toBe(RULE_IDS.length);
    for (const id of RULE_IDS) expect(ruleName(id)).toEqual(RULE_NAMES[id]);
  });

  it("ER1.6 · ruleName gives the waist break its plain and known names, and throws on an id that is not a rule", () => {
    expect(ruleName("PR1_waist_break")).toEqual({ plain: "the waist break", known: "the rule of thirds" });
    expect(() => ruleName("PR1_waist_break")).not.toThrow();
    expect(() => ruleName("not_a_rule")).toThrow();
    expect(() => ruleName("")).toThrow();
  });

  const BANNED = /\b(face|body|weight|height|skin|hair)\b/i;
  const words = (s: string) => s.split(/\s+/).filter(Boolean);
  function whyBad(s: string): string[] {
    const bad: string[] = [];
    if (typeof s !== "string" || s === "") return ["empty"];
    if (s !== s.trim()) bad.push("not trimmed");
    if (!/^[a-z]/.test(s)) bad.push("first letter not lowercase");
    if (words(s).length > 5) bad.push("more than 5 words");
    if (/\d/.test(s)) bad.push("has a digit");
    if (words(s).some((w) => w.length >= 2 && w === w.toUpperCase() && /[A-Z]/.test(w))) bad.push("all-caps word");
    if (/\p{Extended_Pictographic}/u.test(s)) bad.push("emoji");
    if (BANNED.test(s)) bad.push("names a face, body, weight, height, skin or hair");
    if (/unlimited/i.test(s) || /AI stylist/i.test(s)) bad.push("banned phrase");
    return bad;
  }

  it("ER1.6 · every plain name and known name follows the word rules (the only number Kit may say is the score)", () => {
    expect(RULE_IDS.length).toBeGreaterThanOrEqual(74);
    const problems: string[] = [];
    for (const id of RULE_IDS) {
      const n = ruleName(id);
      for (const w of whyBad(n.plain)) problems.push(`${id} plain "${n.plain}": ${w}`);
      if (n.known !== undefined) for (const w of whyBad(n.known)) problems.push(`${id} known "${n.known}": ${w}`);
    }
    expect(problems).toEqual([]);
  });

  it("ER1.6 · plain names are unique across the table", () => {
    expect(RULE_IDS.length).toBeGreaterThanOrEqual(74);
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const id of RULE_IDS) {
      const key = ruleName(id).plain.toLowerCase();
      const other = seen.get(key);
      if (other !== undefined) dupes.push(`${other} and ${id}: "${key}"`);
      else seen.set(key, id);
    }
    expect(dupes).toEqual([]);
  });
});

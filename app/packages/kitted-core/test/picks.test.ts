// T65 ER1.1 and ER1.5: the one or two rules that made a score, read from the engine's own result (never the model's
// choice), and the rule a re-check's fix cleared or earned. Real engine results only (createParts over the made-up
// T69 readings, the parity fixtures and the rules-conformance cases), except the three hand-built states named in
// their tests (a tie inside 1e-9, a credit that is bigger by a clear margin, a reason worth 0). Fixtures are inputs
// only; every expected number is a literal worked out from tasks/T65/TASK.md -> Decisions:
//   slope = 1.1 when v16.raw < 7, else 0.7 (PARTS_DATA.tune.curve);
//   a part charge = |points| x 0.5 (the worst part) or x 0.25 (every other part) x slope;
//   a lift credit = size x slope; a taste rule = |points| x slope; a minor credit (a positive part reason that is not
//   a lift) = points x weightsUsed[part] x slope; the heavy layer = 0.5 x slope; the condition = condDeduction x slope;
//   a cap that held the score = curved - the cap; the occasion = deduction x slope, plus curved - ceiling when it held.
//   A non-v16 result: points x weightsUsed[part], nothing else. weightsUsed is 0.3/0.15/0.2/0.15/0.2 for all five parts.
import { describe, expect, it } from "vitest";
import {
  createParts, PARTS_DATA, partsDataFor, pickExplanation, pickRecheckExplanation, RULE_IDS, ruleName,
  type ExplainPicks, type PartsOptions, type PartsScored, type PickKind, type PickRole, type Reading, type RulePick, type SecondLookInput, type Styles,
} from "../src/index";
import { loadJSON } from "./helpers";
import { R, scored } from "./t69";

const V16 = createParts(PARTS_DATA);
const V15 = createParts(partsDataFor(true, true, false));
const run16 = (reading: Reading, opts: PartsOptions = {}): PartsScored => scored(V16.scoreParts(reading, opts));
const run15 = (reading: Reading, opts: PartsOptions = {}): PartsScored => scored(V15.scoreParts(reading, opts));

const P = loadJSON<{ readings: Record<string, Reading>; cases: { reading: string; occasion: string; styles: [string, number][]; boldness: string; second_look: SecondLookInput | null; season?: "warm" | null }[] }>("parts_parity.json");
const RP = loadJSON<{ readings: Record<string, Reading> }>("rubric_parity.json");
interface RcCase { id: string; reading: Reading; occasion: string; styles: [string, number][]; boldness: string; second_look: SecondLookInput | null; engine?: string; season?: "warm" | null; graded_look?: string | string[] | null }
const RC = loadJSON<{ cases: RcCase[] }>("rules_conformance.json");

/** A fresh copy of a parity-fixture reading by id. */
const fixture = (id: string): Reading => JSON.parse(JSON.stringify(P.readings[id] ?? RP.readings[id])) as Reading;
/** A rules-conformance case, scored on its own engine exactly as rulesConformance.test.ts does. */
function rc(id: string): PartsScored {
  const c = RC.cases.find((x) => x.id === id);
  if (!c) throw new Error(`no conformance case ${id}`);
  const opts: PartsOptions = { occasion: c.occasion, styles: c.styles as Styles, boldness: c.boldness, secondLook: c.second_look };
  return c.engine === "v16" ? run16(c.reading, { ...opts, season: c.season ?? null, gradedLook: c.graded_look ?? null }) : run15(c.reading, opts);
}
/** One field of one garment changed (the fix applied to the reading); everything else is the same reading. */
function edit(reading: Reading, category: string, patch: Record<string, unknown>): Reading {
  const r = JSON.parse(JSON.stringify(reading)) as Reading;
  const g = (r.garments as unknown as Record<string, unknown>[]).find((x) => x.category === category);
  if (!g) throw new Error(`no ${category} garment`);
  Object.assign(g, patch);
  return r;
}

/** The engine's own line for a rule in a result (a reason, a lift, a cap, a taste rule, the condition, the occasion, the heavy layer). */
function engineLine(res: PartsScored, id: string): string {
  for (const p of Object.values(res.parts)) for (const x of p.reasons) if (x.check === id) return x.line;
  const v = res.v16;
  if (v) {
    for (const l of v.lifts) if (l.id === id) return l.line;
    for (const c of v.caps) if (c.id === id) return c.line;
    for (const t of v.taste) if (t.id === id) return t.line;
    if (id === "heavy_layer" && v.heavyLayer) return v.heavyLayer[1];
  }
  if (id === "condition") return res.condition.display;
  if (id === "occasion" || id === "occasion_hold" || id === "occasion_loungewear") return res.occasion.status;
  throw new Error(`${id} did not fire in this result`);
}

interface Want { id: string; kind: PickKind; role: PickRole; points: number; digits?: number }
/** The exact explanation: the case, each pick's id, kind, role, points, plain and known name, and the engine's own line. */
function expectPicks(ex: ExplainPicks, res: PartsScored, kase: ExplainPicks["case"], want: Want[], lineFrom: PartsScored = res): void {
  expect(ex.case).toBe(kase);
  expect(ex.picks.map((p) => p.id)).toEqual(want.map((w) => w.id));
  ex.picks.forEach((p, i) => {
    const w = want[i]!;
    expect(p.kind, `${w.id} kind`).toBe(w.kind);
    expect(p.role, `${w.id} role`).toBe(w.role);
    expect(p.points, `${w.id} points`).toBeCloseTo(w.points, w.digits ?? 9);
    expect(p.plain, `${w.id} plain`).toBe(ruleName(w.id).plain);
    expect(p.known, `${w.id} known`).toBe(ruleName(w.id).known ?? null);
    expect(p.line, `${w.id} line`).toBe(engineLine(lineFrom, w.id));
  });
}
/** Of two rule ids, the one that comes first in RULE_IDS (the tie-break). */
function earlier(a: string, b: string): string {
  const ia = RULE_IDS.indexOf(a), ib = RULE_IDS.indexOf(b);
  expect(ia, `${a} is in RULE_IDS`).toBeGreaterThanOrEqual(0);
  expect(ib, `${b} is in RULE_IDS`).toBeGreaterThanOrEqual(0);
  return ia < ib ? a : b;
}
const later = (a: string, b: string): string => (earlier(a, b) === a ? b : a);

/** The ids one result fired (never a tip, never a part that is not in the photo, never a ceiling that is not a rule). */
function fired(r: PartsScored): Set<string> {
  const s = new Set<string>();
  for (const p of Object.values(r.parts)) for (const x of p.reasons) s.add(x.check);
  if (r.v16) {
    for (const l of r.v16.lifts) s.add(l.id);
    for (const c of r.v16.caps) s.add(c.id);
    for (const t of r.v16.taste) s.add(t.id);
    if (r.v16.heavyLayer) s.add("heavy_layer");
  }
  s.add("condition");
  s.add("occasion");
  s.add("occasion_hold");
  s.add("occasion_loungewear");
  return s;
}

// Parity-fixture options used below (parts_parity.json, the case for that reading and occasion).
const STREET: [string, number][] = [["streetwear", 1.0]];
const MIN_SMART: [string, number][] = [["minimalist", 0.5], ["smart_casual", 0.5]];
const PREPPY: [string, number][] = [["preppy", 0.5], ["old_money", 0.3], ["not_a_style", 0.2]];

describe("T65 ER1.1 · the first-check picks, v16", () => {
  it("ER1.1 · credits only, two: clean basics give the two biggest credits in order (PLAIN)", () => {
    const res = run16(R("PLAIN"));
    // raw 7.175 -> slope 0.7. H6_goes_together 0.5 x 0.2 x 0.7 = 0.07; SD1_matches 0.5 x 0.15 x 0.7 = 0.0525
    expectPicks(pickExplanation(res), res, "credits_only", [
      { id: "H6_goes_together", kind: "check", role: "credit", points: 0.07 },
      { id: "SD1_matches", kind: "check", role: "credit", points: 0.0525 },
    ]);
  });

  it("ER1.1 · credits only: the taste credit, then a tie between two lifts goes to the rule first in RULE_IDS (BOXY)", () => {
    const res = run16(R("BOXY"));
    // raw 9 -> 0.7. T_leg 0.75 x 0.7 = 0.525; L1 0.5 x 0.7 = 0.35; L7b 0.5 x 0.7 = 0.35 (a tie); the minor credits are smaller
    const win = earlier("L1", "L7b");
    expectPicks(pickExplanation(res), res, "credits_only", [
      { id: "T_leg", kind: "taste", role: "credit", points: 0.525 },
      { id: win, kind: "lift", role: "credit", points: 0.35 },
    ]);
  });

  it("ER1.1 · credits only: a stack ceiling ('1 lift') is not a rule and is never a pick (SHORTS, cool)", () => {
    const res = run16(R("SHORTS"));
    expect(res.v16!.heldBy).toBe("1 lift");
    // raw 9.175 -> 0.7. SIL 2 x 0.7 = 1.4; H6_goes_together 0.07. Nothing costs: the 1-lift ceiling holds the score but is no rule
    expectPicks(pickExplanation(res), res, "credits_only", [
      { id: "SIL", kind: "lift", role: "credit", points: 1.4 },
      { id: "H6_goes_together", kind: "check", role: "credit", points: 0.07 },
    ]);
  });

  it("ER1.1 · credits only, one: the only credit is named, and the slides charge a warm day waives is not a cost (TST-sd-warm)", () => {
    const res = rc("TST-sd-warm");
    expect(res.v16!.owned).toContain("SK1_slides_out");
    // raw 7.075 -> 0.7. SK1s_slides_soft 0.5 x 0.15 x 0.7 = 0.0525; SK1_slides_out (-2.5) is owned by the warm-day waiver
    expectPicks(pickExplanation(res), res, "credits_only", [
      { id: "SK1s_slides_soft", kind: "check", role: "credit", points: 0.0525 },
    ]);
  });

  it("ER1.1 · nothing fired: a charge a rule owns is no cost, so there is no pick at all (TST-rn-casual)", () => {
    const res = rc("TST-rn-casual");
    expect(res.v16!.owned).toContain("SK2_runners");
    expect(res.parts.shoes.reasons.map((x) => [x.check, x.points])).toEqual([["SK2_runners", -2]]);
    expect(pickExplanation(res)).toEqual({ case: "none", picks: [] });
  });

  it("ER1.1 · a cost and a credit: the worst part's charge is the cost (SKINNY)", () => {
    const res = run16(R("SKINNY"));
    // raw 5.575 -> 1.1. PN1_narrow_leg -2 in the worst part: 2 x 0.5 x 1.1 = 1.1 (T_leg's taste cost is 0.55: smaller)
    // credit SD1_matches 0.5 x 0.15 x 1.1 = 0.0825
    const ex = pickExplanation(res);
    expectPicks(ex, res, "cost_and_credit", [
      { id: "PN1_narrow_leg", kind: "check", role: "cost", points: 1.1 },
      { id: "SD1_matches", kind: "check", role: "credit", points: 0.0825 },
    ]);
  });

  it("ER1.1 · a cost and a credit: a tank worn alone (TANK, cool)", () => {
    const res = run16(R("TANK"));
    // raw 6.075 -> 1.1. TK1_tank_alone -2: 2 x 0.5 x 1.1 = 1.1; SD1_matches 0.0825
    expectPicks(pickExplanation(res), res, "cost_and_credit", [
      { id: "TK1_tank_alone", kind: "check", role: "cost", points: 1.1 },
      { id: "SD1_matches", kind: "check", role: "credit", points: 0.0825 },
    ]);
  });

  it("ER1.1 · a negative taste rule is a cost (LONG)", () => {
    const res = run16(R("LONG"));
    // raw 6.925 -> 1.1. T_long_top -0.25 x 1.1 = 0.275; credit H6_goes_together 0.5 x 0.2 x 1.1 = 0.11
    expectPicks(pickExplanation(res), res, "cost_and_credit", [
      { id: "T_long_top", kind: "taste", role: "cost", points: 0.275 },
      { id: "H6_goes_together", kind: "check", role: "credit", points: 0.11 },
    ]);
  });

  it("ER1.1 · a cost only: no credit fired (SKINNY in brown boots)", () => {
    const res = run16(edit(R("SKINNY"), "footwear", { subcategory: "chelsea_boot", color_family: "brown" }));
    // raw 5.5 -> 1.1. PN1_narrow_leg 2 x 0.5 x 1.1 = 1.1; no positive reason, no lift, no positive taste
    expectPicks(pickExplanation(res), res, "cost_only", [
      { id: "PN1_narrow_leg", kind: "check", role: "cost", points: 1.1 },
    ]);
  });

  it("ER1.1 · the warm-day heavy layer is a cost, only on a warm day (PUFFER)", () => {
    const warm = run16(R("PUFFER"), { season: "warm" });
    // raw 6.675 -> 1.1. heavy layer 0.5 x 1.1 = 0.55; credit H6_goes_together 0.5 x 0.2 x 1.1 = 0.11
    expectPicks(pickExplanation(warm), warm, "cost_and_credit", [
      { id: "heavy_layer", kind: "layer", role: "cost", points: 0.55 },
      { id: "H6_goes_together", kind: "check", role: "credit", points: 0.11 },
    ]);
    const cool = run16(R("PUFFER"));
    // cool: no heavy layer; raw 7.175 -> 0.7: H6_goes_together 0.07, SD1_matches 0.0525
    expectPicks(pickExplanation(cool), cool, "credits_only", [
      { id: "H6_goes_together", kind: "check", role: "credit", points: 0.07 },
      { id: "SD1_matches", kind: "check", role: "credit", points: 0.0525 },
    ]);
  });

  it("ER1.1 · the condition deduction is a cost (TST-0-suit)", () => {
    const res = rc("TST-0-suit");
    // raw 6.9 -> 1.1. condDeduction 0.6 x 1.1 = 0.66; credit L7 0.25 x 1.1 = 0.275
    expectPicks(pickExplanation(res), res, "cost_and_credit", [
      { id: "condition", kind: "condition", role: "cost", points: 0.66 },
      { id: "L7", kind: "lift", role: "credit", points: 0.275 },
    ]);
  });

  it("ER1.1 · a binding dealbreaker cap beats a part charge, and the charges it owns and the cap that did not bind are never named (BRIGHTS)", () => {
    const res = run16(R("BRIGHTS"));
    expect(res.v16!.heldBy).toBe("S4");
    expect(res.v16!.caps.map((c) => c.id)).toEqual(["S4", "H3"]); // H3 (6.5) is above S4 (4.5): it never bound
    // raw 7.075 -> 0.7: curved 7.0525, held to the S4 cap 4.5 -> cost 2.5525 (curved is rounded to 7.053 in the result)
    // CC2_bright_clash, SCol1_loud_vs_loud and H5_too_many_statements are S4's own: no cost. credit SD1_matches 0.5 x 0.15 x 0.7 = 0.0525
    const ex = pickExplanation(res);
    expectPicks(ex, res, "cost_and_credit", [
      { id: "S4", kind: "cap", role: "cost", points: 2.5525, digits: 2 },
      { id: "SD1_matches", kind: "check", role: "credit", points: 0.0525 },
    ]);
    for (const id of ["CC2_bright_clash", "SCol1_loud_vs_loud", "H5_too_many_statements", "H3"]) expect(ex.picks.map((p) => p.id)).not.toContain(id);
  });

  it("ER1.1 · a sinking cap beats a bigger-looking part charge, and the charge it owns is not a cost (DB-X-S5-weak)", () => {
    const res = rc("DB-X-S5-weak");
    expect(res.v16!.owned).toContain("X_S5");
    // raw 7.95 -> 0.7: curved 7.665, held to the S5 sink 5.5 -> cost 2.165. CL1_loud_print costs 1.5 x 0.5 x 1.1 = 0.825 or less: smaller
    // credit SIL 1.75 x 0.7 = 1.225. X_S5 (-3) is owned by S5: never a pick
    const ex = pickExplanation(res);
    expectPicks(ex, res, "cost_and_credit", [
      { id: "S5", kind: "cap", role: "cost", points: 2.165, digits: 2 },
      { id: "SIL", kind: "lift", role: "credit", points: 1.225 },
    ]);
    expect(ex.picks.map((p) => p.id)).not.toContain("X_S5");
  });

  it("ER1.1 · two sinking faults: the whole drop goes to the first sinking cap (gym, r04edfbd0f6d6)", () => {
    const res = run16(fixture("r04edfbd0f6d6"), { occasion: "gym", styles: STREET, boldness: "a_little", secondLook: null, season: null });
    expect(res.v16!.heldBy).toBe("two sinking faults: a redo");
    expect(res.v16!.caps.map((c) => [c.id, c.kind])).toEqual([["S6", "sink"], ["S9", "sink"]]);
    // raw 7.263 -> 0.7: curved 7.1841, held to 4.5 -> 2.6841 to S6. credit T_leg 0.1875 x 0.7 = 0.13125
    expectPicks(pickExplanation(res), res, "cost_and_credit", [
      { id: "S6", kind: "cap", role: "cost", points: 2.6841, digits: 2 },
      { id: "T_leg", kind: "taste", role: "credit", points: 0.13125 },
    ]);
  });

  it("ER1.1 · two holding faults: the whole drop goes to the first holding cap (gym, r1ac34d249d60)", () => {
    const res = run16(fixture("r1ac34d249d60"), { occasion: "gym", styles: PREPPY, boldness: "a_little", secondLook: null, season: null });
    expect(res.v16!.heldBy).toBe("two holding faults");
    expect(res.v16!.caps.map((c) => [c.id, c.kind])).toEqual([["H1", "hold"], ["H8", "hold"]]);
    // raw 7.325 -> 0.7: curved 7.2275, held to 6.0 -> 1.2275 to H1. credit L7b 0.25 x 0.7 = 0.175
    expectPicks(pickExplanation(res), res, "cost_and_credit", [
      { id: "H1", kind: "cap", role: "cost", points: 1.2275, digits: 2 },
      { id: "L7b", kind: "lift", role: "credit", points: 0.175 },
    ]);
  });

  it("ER1.1 · the occasion's hold beats a part charge (interview_tech, r60be9a1897ad)", () => {
    const res = run16(fixture("r60be9a1897ad"), { occasion: "interview_tech", styles: [["streetwear", 0.6], ["vintage_sport", 0.4]], boldness: "subtle", secondLook: null, season: null });
    expect(res.v16!.heldBy).toBe("occasion");
    expect(res.occasion.ceiling).toBe(6);
    // raw 6.375 -> 1.1. occasion: deduction 0.5 x 1.1 = 0.55 plus the hold curved 6.3125 - 6 = 0.3125 -> 0.8625
    // SCol1_loud_vs_loud 0.75 x 0.5 x 1.1 = 0.4125 is smaller. credit H1_reads_as_style 0.5 x 0.2 x 1.1 = 0.11
    expectPicks(pickExplanation(res), res, "cost_and_credit", [
      { id: "occasion_hold", kind: "occasion", role: "cost", points: 0.8625, digits: 2 },
      { id: "H1_reads_as_style", kind: "check", role: "credit", points: 0.11 },
    ]);
  });

  it("ER1.1 · loungewear held out of the house is its own occasion rule (r10903dd3a948, everyday)", () => {
    const res = run16(fixture("r10903dd3a948"), { occasion: "everyday", styles: MIN_SMART, boldness: "a_little", secondLook: null, season: null });
    expect(res.v16!.heldBy).toBe("occasion");
    expect(res.occasion.lines[0]).toBe("loungewear out of the house: held to 5.5");
    // raw 7.125 -> 0.7: no deduction; the hold is curved 7.0875 - 5.5 = 1.5875. credit L6 0.125 x 0.7 = 0.0875
    expectPicks(pickExplanation(res), res, "cost_and_credit", [
      { id: "occasion_loungewear", kind: "occasion", role: "cost", points: 1.5875, digits: 2 },
      { id: "L6", kind: "lift", role: "credit", points: 0.0875 },
    ]);
  });

  it("ER1.1 · an occasion deduction with no ceiling is the plain occasion rule; a tie in credits goes to RULE_IDS (wedding_formal, r63e7e608ce90)", () => {
    const res = run16(fixture("r63e7e608ce90"), { occasion: "wedding_formal", styles: PREPPY.slice(), boldness: "bold", secondLook: null, season: null });
    expect(res.occasion.ceiling).toBeNull();
    expect(res.v16!.heldBy).toBeNull();
    // raw 8.25 -> 0.7. occasion 0.375 x 0.7 = 0.2625. credits: L2 0.5 x 0.7 = 0.35, L7b 0.5 x 0.7 = 0.35 (tie), T_leg 0.2625
    const win = earlier("L2", "L7b");
    expectPicks(pickExplanation(res), res, "cost_and_credit", [
      { id: "occasion", kind: "occasion", role: "cost", points: 0.2625 },
      { id: win, kind: "lift", role: "credit", points: 0.35 },
    ]);
  });

  it("ER1.1 · a ceiling that is not a rule ('a fit or shape fault') is never a pick; the fault itself is (peek, r.db4aa46f2fd4)", () => {
    const res = run16(fixture("rdb4aa46f2fd4"), { occasion: "everyday", styles: MIN_SMART, boldness: "a_little", secondLook: { peek: true }, season: null });
    expect(res.v16!.heldBy).toBe("a fit or shape fault: lifts can't cover it");
    // raw 7.925 -> 0.7. PF10_peek -0.5 in the worst part: 0.5 x 0.5 x 0.7 = 0.175. credit T_leg 0.75 x 0.7 = 0.525
    const ex = pickExplanation(res);
    expectPicks(ex, res, "cost_and_credit", [
      { id: "PF10_peek", kind: "check", role: "cost", points: 0.175 },
      { id: "T_leg", kind: "taste", role: "credit", points: 0.525 },
    ]);
  });

  it("ER1.1 · a charge in the worst part beats a larger raw charge in another part (alpha 0.5 against beta 0.25), and an equal tie goes to RULE_IDS (date, r911e85cc2c02)", () => {
    const res = run16(fixture("r911e85cc2c02"), { occasion: "date", styles: STREET, boldness: "bold", secondLook: null, season: null });
    expect(res.parts.proportions.reasons.find((x) => x.check === "PN1_narrow_leg")!.points).toBe(-1); // the larger raw charge
    expect(res.parts.shoes.reasons.map((x) => [x.check, x.points])).toEqual([["SD2_too_casual", -0.75], ["SCol1_loud_vs_loud", -0.75]]);
    // raw 6.1 -> 1.1. shoes is the worst part (1.5): SD2_too_casual and SCol1_loud_vs_loud 0.75 x 0.5 x 1.1 = 0.4125 each (a tie)
    // PN1_narrow_leg -1 is in another part: 1 x 0.25 x 1.1 = 0.275. credit H1_reads_as_style 0.5 x 0.2 x 1.1 = 0.11
    const win = earlier("SD2_too_casual", "SCol1_loud_vs_loud");
    const ex = pickExplanation(res);
    expectPicks(ex, res, "cost_and_credit", [
      { id: win, kind: "check", role: "cost", points: 0.4125 },
      { id: "H1_reads_as_style", kind: "check", role: "credit", points: 0.11 },
    ]);
    expect(ex.picks.map((p) => p.id)).not.toContain("PN1_narrow_leg");
  });
});

describe("T65 ER1.1 · the first-check picks, v15 (read with weightsUsed)", () => {
  it("ER1.1 · v15: a cost and a credit, points are the part's weight times the reason's points (SKINNY)", () => {
    const res = run15(R("SKINNY"));
    expect(res.v16).toBeUndefined();
    // PN1_narrow_leg -2 x 0.3 (proportions) = 0.6; credit SD1_matches 0.5 x 0.15 = 0.075
    expectPicks(pickExplanation(res), res, "cost_and_credit", [
      { id: "PN1_narrow_leg", kind: "check", role: "cost", points: 0.6 },
      { id: "SD1_matches", kind: "check", role: "credit", points: 0.075 },
    ]);
  });

  it("ER1.1 · v15: the biggest of three costs, in three parts (BRIGHTS)", () => {
    const res = run15(R("BRIGHTS"));
    // CC2_bright_clash -2 x 0.2 = 0.4; SCol1_loud_vs_loud -0.75 x 0.15 = 0.1125; H5_too_many_statements -0.5 x 0.2 = 0.1
    expectPicks(pickExplanation(res), res, "cost_and_credit", [
      { id: "CC2_bright_clash", kind: "check", role: "cost", points: 0.4 },
      { id: "SD1_matches", kind: "check", role: "credit", points: 0.075 },
    ]);
  });

  it("ER1.1 · v15: credits only (PLAIN)", () => {
    const res = run15(R("PLAIN"));
    // H6_goes_together 0.5 x 0.2 = 0.1; SD1_matches 0.5 x 0.15 = 0.075
    expectPicks(pickExplanation(res), res, "credits_only", [
      { id: "H6_goes_together", kind: "check", role: "credit", points: 0.1 },
      { id: "SD1_matches", kind: "check", role: "credit", points: 0.075 },
    ]);
  });
});

describe("T65 ER1.1 · ties, signs and invariants", () => {
  it("ER1.1 · the same result gives the same picks every time, and the result is not touched", () => {
    const results = [run16(R("BOXY")), run16(R("SKINNY")), run16(R("BRIGHTS")), run15(R("BRIGHTS")), rc("DB-X-S5-weak")];
    for (const res of results) {
      const before = JSON.stringify(res);
      const a = pickExplanation(res);
      const b = pickExplanation(res);
      expect(a.picks.length).toBeGreaterThan(0);
      expect(b).toEqual(a);
      expect(JSON.stringify(res)).toBe(before);
    }
  });

  it("ER1.1 · hand-built (a real BOXY result with one lift nudged): a gap under 1e-9 is a tie, a clear gap is not", () => {
    // The engine cannot make two credits 3.5e-10 apart, so this one state is built by hand from the real BOXY result.
    const base = run16(R("BOXY"));
    const first = earlier("L1", "L7b"), last = later("L1", "L7b");
    const nudge = (size: number): PartsScored => {
      const res = JSON.parse(JSON.stringify(base)) as PartsScored;
      res.v16!.lifts.find((l) => l.id === last)!.size = size;
      return res;
    };
    // L1 and L7b are both 0.5 x 0.7 = 0.35. The later one is made 0.5 + 5e-10 (credit 0.35 + 3.5e-10): still a tie -> RULE_IDS order
    expect(pickExplanation(nudge(0.5 + 5e-10)).picks.map((p) => p.id)).toEqual(["T_leg", first]);
    // made 0.51 (credit 0.357): clearly bigger, so it wins whatever the order
    expect(pickExplanation(nudge(0.51)).picks.map((p) => p.id)).toEqual(["T_leg", last]);
  });

  it("ER1.1 · hand-built (a real PLAIN result with a reason worth 0 added): a reason of 0 points is never a pick", () => {
    // The engine never writes a 0-point reason, so this state is built by hand from the real PLAIN result.
    const base = run16(R("PLAIN"));
    const res = JSON.parse(JSON.stringify(base)) as PartsScored;
    res.parts.fit.reasons.push({ check: "PF10_peek", points: 0, line: "nothing" });
    res.parts.proportions.reasons.push({ check: "PR1_waist_break", points: 0, line: "nothing" });
    const ex = pickExplanation(res);
    expect(ex).toEqual(pickExplanation(base));
    expect(ex.case).toBe("credits_only");
    expect(ex.picks.map((p) => p.id)).toEqual(["H6_goes_together", "SD1_matches"]);
  });

  it("ER1.1 · over every real result in the fixtures: at most two picks, each one fired, positive points, never a tip, the cases agree with the picks", () => {
    const bad: string[] = [];
    let n = 0;
    const seen = new Set<string>();
    const check = (label: string, res: PartsScored): void => {
      n++;
      const ex = pickExplanation(res);
      const again = pickExplanation(res);
      if (JSON.stringify(ex) !== JSON.stringify(again)) bad.push(`${label}: two calls differ`);
      const f = fired(res);
      const tipIds = new Set<string>();
      for (const p of Object.values(res.parts)) for (const t of p.tips) tipIds.add(t.check);
      const where = `${label} [${res.engine}] ${ex.case} ${ex.picks.map((p) => p.id).join(",")}`;
      if (ex.picks.length > 2) bad.push(`${where}: more than two picks`);
      for (const p of ex.picks) {
        if (!f.has(p.id)) bad.push(`${where}: ${p.id} did not fire`);
        if (tipIds.has(p.id) && !f.has(p.id)) bad.push(`${where}: ${p.id} is a tip`);
        if (!(Number.isFinite(p.points) && p.points > 0)) bad.push(`${where}: ${p.id} points ${p.points}`);
        if (p.plain !== ruleName(p.id).plain || p.known !== (ruleName(p.id).known ?? null)) bad.push(`${where}: ${p.id} names`);
        if (typeof p.line !== "string" || p.line === "") bad.push(`${where}: ${p.id} has no line`);
        const v = res.v16;
        if (p.kind === "cap") {
          const sink = v?.caps.find((c) => c.kind === "sink")?.id, hold = v?.caps.find((c) => c.kind === "hold")?.id;
          const ok = v !== undefined && (v.heldBy === p.id
            || (v.heldBy?.startsWith("two sinking") === true && p.id === sink) || (v.heldBy?.startsWith("two holding") === true && p.id === hold));
          if (!ok) bad.push(`${where}: ${p.id} is a cap that did not bind`);
        }
        if (p.kind === "check" && p.role === "cost" && v?.owned.includes(p.id)) bad.push(`${where}: ${p.id} is owned by a dealbreaker`);
        if (p.id === "condition" && !((v ? v.condDeduction : res.condition.deduction) > 0)) bad.push(`${where}: no condition deduction`);
        if (p.id === "occasion" && !(res.occasion.deduction > 0)) bad.push(`${where}: no occasion deduction`);
        if (p.id === "heavy_layer" && v?.season !== "warm") bad.push(`${where}: heavy layer on a cool day`);
        if (p.id === "occasion_hold" && v?.heldBy !== "occasion") bad.push(`${where}: occasion hold that did not hold`);
        if (p.id === "occasion_loungewear" && !res.occasion.lines[0]?.startsWith("loungewear")) bad.push(`${where}: not loungewear`);
      }
      const roles = ex.picks.map((p) => p.role).join();
      const want: Record<string, string[]> = {
        cost_and_credit: ["cost,credit"], cost_only: ["cost"], credits_only: ["credit", "credit,credit"], none: [""],
      };
      if (!want[ex.case]?.includes(roles)) bad.push(`${where}: roles ${roles}`);
      const [a, b] = ex.picks;
      if (ex.case === "credits_only" && a && b) {
        if (a.points < b.points - 1e-9) bad.push(`${where}: credits out of order`);
        if (Math.abs(a.points - b.points) < 1e-9 && RULE_IDS.indexOf(a.id) > RULE_IDS.indexOf(b.id)) bad.push(`${where}: tie not in RULE_IDS order`);
      }
    };
    for (const k of ["PLAIN", "BOXY", "TOP9", "BRIGHTS", "SKINNY", "TANK", "PUFFER", "SHORTS", "LONG"] as const) {
      check(`${k} v15`, run15(R(k)));
      for (const season of [null, "warm"] as const) check(`${k} v16 ${season ?? "cool"}`, run16(R(k), { season }));
    }
    for (const c of RC.cases) {
      const res = V16.scoreParts(c.reading, { occasion: c.occasion, styles: c.styles as Styles, boldness: c.boldness, secondLook: c.second_look, season: c.season ?? null, gradedLook: c.graded_look ?? null });
      if (res.overall !== null) check(`${c.id} v16`, res);
      const r15 = V15.scoreParts(c.reading, { occasion: c.occasion, styles: c.styles as Styles, boldness: c.boldness, secondLook: c.second_look });
      if (r15.overall !== null) check(`${c.id} v15`, r15);
    }
    for (const c of P.cases) {
      const key = `${c.reading}|${c.occasion}|${c.boldness}|${JSON.stringify(c.second_look)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const reading = P.readings[c.reading] ?? RP.readings[c.reading]!;
      const opts: PartsOptions = { occasion: c.occasion, styles: c.styles as Styles, boldness: c.boldness, secondLook: c.second_look };
      const r15 = V15.scoreParts(reading, opts);
      if (r15.overall !== null) check(`${key} v15`, r15);
      for (const season of [null, "warm"] as const) {
        const r16 = V16.scoreParts(reading, { ...opts, season });
        if (r16.overall !== null) check(`${key} v16 ${season ?? "cool"}`, r16);
      }
    }
    expect(n).toBeGreaterThan(10000); // the sweep really ran over the fixtures
    expect(bad.slice(0, 20)).toEqual([]);
  }, 300_000);
});

describe("T65 ER1.5 · the re-check leads with what the fix cleared or earned", () => {
  const T = (k: Parameters<typeof R>[0]) => R(k);
  const everyday: PartsOptions = {};
  const tieOpts: PartsOptions = { occasion: "date", styles: STREET, boldness: "bold", secondLook: null, season: null };

  /** Every rule the re-check names was fired by the result it names it from. */
  function firedWhereNamed(ex: ExplainPicks, before: PartsScored, after: PartsScored): void {
    const fb = fired(before), fa = fired(after);
    for (const p of ex.picks) expect(fb.has(p.id) || fa.has(p.id), `${p.id} fired in before or after`).toBe(true);
    expect(ex.picks.length).toBeLessThanOrEqual(2);
  }

  it("ER1.5 · a fix that clears the biggest cost: it leads as cleared with the drop in points (leg shape skinny -> straight)", () => {
    const before = run16(T("SKINNY"), everyday);
    const after = run16(edit(T("SKINNY"), "bottom", { leg_shape: "straight" }), everyday);
    expect(before.overall).toBe(5.5);
    expect(after.overall).toBe(7);
    // before: PN1_narrow_leg 1.1 (the biggest), T_leg 0.55. after: no cost. both cleared; the biggest leads: 1.1 - 0 = 1.1
    const ex = pickRecheckExplanation(before, after);
    expectPicks(ex, before, "cleared", [{ id: "PN1_narrow_leg", kind: "check", role: "cleared", points: 1.1 }]);
    firedWhereNamed(ex, before, after);
  });

  it("ER1.5 · a fix that clears a dealbreaker cap: the cap leads as cleared, the cost still left follows, and the cleared rule is not listed again (shoes purple -> white)", () => {
    const before = run16(T("BRIGHTS"), everyday);
    const after = run16(edit(T("BRIGHTS"), "footwear", { color_family: "white" }), everyday);
    expect(before.v16!.heldBy).toBe("S4");
    expect(after.v16!.heldBy).toBeNull();
    expect(after.overall).toBe(7);
    // before: S4 holds the score: curved 7.0525 - 4.5 = 2.5525 (the biggest cost). after: no S4;
    // H5_too_many_statements is no longer owned: raw 6.825 -> 1.1, cohesion is the worst part: 0.5 x 0.5 x 1.1 = 0.275
    const ex = pickRecheckExplanation(before, after);
    expect(ex.case).toBe("cleared");
    expect(ex.picks.map((p) => [p.id, p.role])).toEqual([["S4", "cleared"], ["H5_too_many_statements", "cost"]]);
    expect(ex.picks[0]!.kind).toBe("cap");
    expect(ex.picks[0]!.points).toBeCloseTo(2.5525, 2);
    expect(ex.picks[0]!.line).toBe(engineLine(before, "S4"));
    expect(ex.picks[0]!.plain).toBe(ruleName("S4").plain);
    expect(ex.picks[1]!.kind).toBe("check");
    expect(ex.picks[1]!.points).toBeCloseTo(0.275, 9);
    expect(ex.picks[1]!.line).toBe(engineLine(after, "H5_too_many_statements"));
    firedWhereNamed(ex, before, after);
  });

  it("ER1.5 · the heavy layer taken off on a warm day is cleared (puffer removed)", () => {
    const warm: PartsOptions = { season: "warm" };
    const before = run16(T("PUFFER"), warm);
    const noOuter = T("PUFFER");
    noOuter.garments = noOuter.garments.filter((g) => g.category !== "outerwear");
    const after = run16(noOuter, warm);
    expect(before.overall).toBe(6.5);
    expect(after.overall).toBe(7);
    // before: heavy layer 0.5 x 1.1 = 0.55; after: none
    expectPicks(pickRecheckExplanation(before, after), before, "cleared", [{ id: "heavy_layer", kind: "layer", role: "cleared", points: 0.55 }]);
  });

  it("ER1.5 · when two rules are cleared and tie, the one first in RULE_IDS leads; a charge that rose is not cleared and is the cost left (date, shoes to brown dress shoes)", () => {
    const before = run16(fixture("r911e85cc2c02"), tieOpts);
    const after = run16(edit(fixture("r911e85cc2c02"), "footwear", { subcategory: "dress_shoe", color_family: "brown" }), tieOpts);
    expect(before.overall).toBe(6);
    expect(after.overall).toBe(6.5);
    // before: SD2_too_casual and SCol1_loud_vs_loud 0.4125 each (tie), PN1_narrow_leg 0.275 (another part).
    // after: both gone. proportions is now the worst part, so PN1_narrow_leg is 1 x 0.5 x 1.1 = 0.55 (it rose: not cleared);
    // the H8 hold now binds (0.225), smaller. cleared leads: 0.4125 - 0 = 0.4125
    const win = earlier("SD2_too_casual", "SCol1_loud_vs_loud");
    const ex = pickRecheckExplanation(before, after);
    expect(ex.case).toBe("cleared");
    expect(ex.picks.map((p) => [p.id, p.role])).toEqual([[win, "cleared"], ["PN1_narrow_leg", "cost"]]);
    expect(ex.picks[0]!.points).toBeCloseTo(0.4125, 9);
    expect(ex.picks[1]!.points).toBeCloseTo(0.55, 9);
    firedWhereNamed(ex, before, after);
  });

  it("ER1.5 · the cleared rule leads over a credit the same fix earned; a cost that stays the same is not cleared (long top tucked, skinny leg stays)", () => {
    // LONG: the top below the crotch costs T_long_top (0.275); tucked, the cost goes and L1 is earned
    const before = run16(T("LONG"), everyday);
    const after = run16(edit(T("LONG"), "top", { tucked: "full" }), everyday);
    expect(before.overall).toBe(7);
    expect(after.overall).toBe(7.5);
    expect(after.v16!.lifts.map((l) => l.id)).toContain("L1");
    expectPicks(pickRecheckExplanation(before, after), before, "cleared", [{ id: "T_long_top", kind: "taste", role: "cleared", points: 0.275 }]);

    // LONG with skinny legs: the length fix clears T_long_top; PN1_narrow_leg costs 1.1 before and after (the same slope): not cleared
    const skinny = edit(T("LONG"), "bottom", { leg_shape: "skinny" });
    const b2 = run16(skinny, everyday);
    const a2 = run16(edit(skinny, "top", { length: "mid_fly" }), everyday);
    expect(b2.overall).toBe(5);
    expect(a2.overall).toBe(5.5);
    const ex = pickRecheckExplanation(b2, a2);
    expect(ex.case).toBe("cleared");
    expect(ex.picks.map((p) => [p.id, p.role])).toEqual([["T_long_top", "cleared"], ["PN1_narrow_leg", "cost"]]);
    expect(ex.picks[0]!.points).toBeCloseTo(0.275, 9);
    expect(ex.picks[1]!.points).toBeCloseTo(1.1, 9);
  });

  it("ER1.5 · a fix that earns a credit and clears nothing: the credit leads as earned, the cost still left follows (tank tucked)", () => {
    const before = run16(T("TANK"), everyday);
    const after = run16(edit(T("TANK"), "top", { tucked: "full" }), everyday);
    expect(before.overall).toBe(6);
    expect(after.overall).toBe(6.5);
    // L1 is new: 0.25 x 1.1 = 0.275. TK1_tank_alone is still there: 2 x 0.5 x 1.1 = 1.1 (the same in both)
    const ex = pickRecheckExplanation(before, after);
    expectPicks(ex, after, "earned", [
      { id: "L1", kind: "lift", role: "earned", points: 0.275 },
      { id: "TK1_tank_alone", kind: "check", role: "cost", points: 1.1 },
    ]);
    firedWhereNamed(ex, before, after);
  });

  it("ER1.5 · the score did not rise: no rule is cleared or earned, the biggest cost now is named (a credit earned, same overall)", () => {
    const before = run16(T("SKINNY"), everyday);
    const after = run16(edit(T("SKINNY"), "footwear", { color_family: "red" }), everyday);
    expect(after.overall).toBe(before.overall);
    expect(after.v16!.raw).toBeGreaterThan(before.v16!.raw); // a credit was earned (SCol2_shoe_accent), but the shown score did not move
    // after: PN1_narrow_leg 1.1 is the biggest cost
    const ex = pickRecheckExplanation(before, after);
    expectPicks(ex, after, "cost_now", [{ id: "PN1_narrow_leg", kind: "check", role: "cost", points: 1.1 }]);
  });

  it("ER1.5 · the score fell: the biggest cost now is named (leg shape straight -> skinny)", () => {
    const before = run16(T("PLAIN"), everyday);
    const after = run16(edit(T("PLAIN"), "bottom", { leg_shape: "skinny" }), everyday);
    expect(before.overall).toBe(7);
    expect(after.overall).toBe(5.5);
    expectPicks(pickRecheckExplanation(before, after), after, "cost_now", [{ id: "PN1_narrow_leg", kind: "check", role: "cost", points: 1.1 }]);
  });

  it("ER1.5 · nothing changed (the same result before and after): the biggest cost now is named", () => {
    const before = run16(T("SKINNY"), everyday);
    const after = run16(T("SKINNY"), everyday);
    expectPicks(pickRecheckExplanation(before, after), after, "cost_now", [{ id: "PN1_narrow_leg", kind: "check", role: "cost", points: 1.1 }]);
  });

  it("ER1.5 · a cost was cleared but the score did not rise and nothing costs now: it falls back to the first-check picks on the new result (long top fixed, same 7)", () => {
    const before = run16(T("LONG"), everyday);
    const after = run16(edit(T("LONG"), "top", { length: "mid_fly" }), everyday);
    expect(before.overall).toBe(7);
    expect(after.overall).toBe(7);
    expect(before.v16!.taste.map((t) => t.id)).toContain("T_long_top"); // the cost did exist in before
    // after: no cost; raw 7.175 -> 0.7: H6_goes_together 0.07, SD1_matches 0.0525. T_long_top is not named (it is no cost now, and no clear is reported)
    const ex = pickRecheckExplanation(before, after);
    expectPicks(ex, after, "credits_only", [
      { id: "H6_goes_together", kind: "check", role: "credit", points: 0.07 },
      { id: "SD1_matches", kind: "check", role: "credit", points: 0.0525 },
    ]);
  });

  it("ER1.5 · the re-check is deterministic and leaves both results untouched", () => {
    const before = run16(T("TANK"), everyday);
    const after = run16(edit(T("TANK"), "top", { tucked: "full" }), everyday);
    const jb = JSON.stringify(before), ja = JSON.stringify(after);
    const a = pickRecheckExplanation(before, after);
    expect(a.picks.length).toBe(2);
    expect(pickRecheckExplanation(before, after)).toEqual(a);
    expect(JSON.stringify(before)).toBe(jb);
    expect(JSON.stringify(after)).toBe(ja);
  });
});

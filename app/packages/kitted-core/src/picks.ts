// T65: the one or two rules that made a score, read from the scoring result alone (specs/explain-rating.md,
// tasks/T65/TESTING.md ER1.1 and ER1.5). Never the model's choice: the same result always gives the same picks.
//
// Points are score points on the shown scale. In a v16 result a charge or credit in the engine's own units is
// multiplied by the curve's slope at the result's raw score, so a charge, a ceiling and a lift compare in one unit.
// A result from an older engine (no v16 block) is read with each part's weightsUsed instead.
import type { PartName, PartsScored } from "./parts";
import { PARTS_DATA } from "./partsData";
import { RULE_IDS, ruleName } from "./ruleNames";

export type PickKind = "check" | "lift" | "cap" | "taste" | "condition" | "occasion" | "layer";
export type PickRole = "cost" | "credit" | "cleared" | "earned";
export interface RulePick { id: string; kind: PickKind; role: PickRole; points: number; plain: string; known: string | null; line: string }
export type PickCase = "cost_and_credit" | "cost_only" | "credits_only" | "none" | "cleared" | "earned" | "cost_now";
export interface ExplainPicks { case: PickCase; picks: RulePick[] }

/** One rule that cost or credited points in a result. */
interface Item { id: string; kind: PickKind; points: number; line: string }

const PART_ORDER: readonly PartName[] = ["proportions", "fit", "color", "shoes", "cohesion"];
/** Two sizes closer than this are the same size: the tie goes to the rule first in RULE_IDS. */
const TIE = 1e-9;

/** The curve's slope at the result's raw score (1.1 under 7, 0.7 over, from PARTS_DATA.tune.curve). */
function slopeAt(raw: number): number {
  const [a, b, k] = PARTS_DATA.tune.curve;
  const knee = PARTS_DATA.tune.curve_knee;
  if (knee !== null && knee !== undefined && raw > knee[0] && knee[0] > k) return knee[1];
  return raw < k ? a : b;
}

/** The ids of the checks that are lifts (the engine counts them as lifts, never as minor credits). */
function liftCheckIds(): Set<string> {
  return new Set(Object.keys(PARTS_DATA.v16?.lifts ?? {}));
}

/** The rule id the occasion goes by, or null when it neither charged nor held anything. */
function occasionId(res: PartsScored, held: boolean): string | null {
  if (res.occasion.lines[0]?.startsWith("loungewear") === true) return "occasion_loungewear";
  if (held) return "occasion_hold";
  return res.occasion.deduction > 0 ? "occasion" : null;
}

/** Every rule that cost points in the result, in score points. Never a tip, never a part that is not in the photo. */
function costsOf(res: PartsScored): Item[] {
  const out: Item[] = [];
  const v = res.v16;
  const owned = new Set(v?.owned ?? []);
  const live = PART_ORDER.filter((k) => res.parts[k]?.score !== null && res.parts[k] !== undefined);

  // part charges
  if (v) {
    const slope = slopeAt(v.raw);
    const sums = live.map((k) => {
      let s = 0;
      for (const r of res.parts[k].reasons) if (r.points < 0 && !owned.has(r.check)) s -= r.points;
      return s;
    });
    // the worst part's charges at alpha, every other part's at beta (a tie: the part first in the card's order)
    let worst = -1;
    sums.forEach((s, i) => { if (s > 0 && (worst < 0 || s > sums[worst]! + TIE)) worst = i; });
    live.forEach((k, i) => {
      const factor = i === worst ? PARTS_DATA.tune.v16_alpha : PARTS_DATA.tune.v16_beta;
      for (const r of res.parts[k].reasons) {
        if (r.points < 0 && !owned.has(r.check)) out.push({ id: r.check, kind: "check", points: -r.points * factor * slope, line: r.line });
      }
    });
  } else {
    for (const k of live) {
      const w = res.weightsUsed[k] ?? 0;
      for (const r of res.parts[k].reasons) if (r.points < 0) out.push({ id: r.check, kind: "check", points: -r.points * w, line: r.line });
    }
  }

  // the condition
  const condDed = v ? v.condDeduction : res.condition.deduction;
  const slope = v ? slopeAt(v.raw) : 1;
  if (condDed > 0) out.push({ id: "condition", kind: "condition", points: condDed * slope, line: res.condition.display });

  // the occasion: its deduction, plus the hold when its ceiling is what held the score
  const hold = v && v.heldBy === "occasion" ? Math.max(0, v.curved - res.rawScore) : 0;
  const occId = occasionId(res, hold > 0);
  const occPoints = res.occasion.deduction * slope + hold;
  if (occId !== null && occPoints > 0) out.push({ id: occId, kind: "occasion", points: occPoints, line: res.occasion.status });

  if (v) {
    // a dealbreaker cap that held the score: the whole drop goes to it
    if (v.heldBy !== null && v.heldBy !== "occasion") {
      let cap = v.caps.find((c) => c.id === v.heldBy);
      if (cap === undefined && v.heldBy.startsWith("two sinking")) cap = v.caps.find((c) => c.kind === "sink");
      if (cap === undefined && v.heldBy.startsWith("two holding")) cap = v.caps.find((c) => c.kind === "hold");
      const drop = v.curved - res.rawScore;
      if (cap !== undefined && drop > 0) out.push({ id: cap.id, kind: "cap", points: drop, line: cap.line });
    }
    // the warm-day heavy layer
    if (v.heavyLayer) out.push({ id: "heavy_layer", kind: "layer", points: v.heavyLayer[0] * slope, line: v.heavyLayer[1] });
    // a negative taste rule
    for (const t of v.taste) if (t.points < 0) out.push({ id: t.id, kind: "taste", points: -t.points * slope, line: t.line });
  }
  return out.filter((x) => x.points > 0);
}

/** Every rule that credited points in the result, in score points. */
function creditsOf(res: PartsScored): Item[] {
  const out: Item[] = [];
  const v = res.v16;
  const slope = v ? slopeAt(v.raw) : 1;
  const lifts = liftCheckIds();
  for (const k of PART_ORDER) {
    const p = res.parts[k];
    if (p === undefined || p.score === null) continue;
    const w = res.weightsUsed[k] ?? 0;
    for (const r of p.reasons) {
      if (!(r.points > 0)) continue;
      if (v && (lifts.has(r.check) || r.check === "CC2s_shape_softens")) continue; // a lift is credited as the lift
      out.push({ id: r.check, kind: "check", points: r.points * w * slope, line: r.line });
    }
  }
  if (v) {
    for (const l of v.lifts) out.push({ id: l.id, kind: "lift", points: l.size * slope, line: l.line });
    for (const t of v.taste) if (t.points > 0) out.push({ id: t.id, kind: "taste", points: t.points * slope, line: t.line });
  }
  return out.filter((x) => x.points > 0);
}

/** Whether a rule has a name (a rule with no name is never picked: ER1.6's coverage test is what catches a new one). */
function named(id: string): boolean {
  return RULE_IDS.includes(id);
}
/** Where a rule sits in the tie-break order (a rule outside the table sorts last). */
function order(id: string): number {
  const i = RULE_IDS.indexOf(id);
  return i < 0 ? Number.MAX_SAFE_INTEGER : i;
}
/** The biggest item: the most points; within 1e-9 the rule first in RULE_IDS. Null for none. */
function biggest(items: readonly Item[]): Item | null {
  let best: Item | null = null;
  for (const it of items) {
    if (!named(it.id)) continue;
    if (best === null || it.points > best.points + TIE || (Math.abs(it.points - best.points) <= TIE && order(it.id) < order(best.id))) best = it;
  }
  return best;
}
/** The two biggest, in order. */
function topTwo(items: readonly Item[]): Item[] {
  const a = biggest(items);
  if (a === null) return [];
  const b = biggest(items.filter((x) => x !== a));
  return b === null ? [a] : [a, b];
}

function pick(it: Item, role: PickRole, points: number = it.points): RulePick {
  const n = ruleName(it.id);
  return { id: it.id, kind: it.kind, role, points, plain: n.plain, known: n.known ?? null, line: it.line };
}

/** The first-check explanation: the biggest cost and the biggest credit, or whichever of them there is. */
export function pickExplanation(result: PartsScored): ExplainPicks {
  const cost = biggest(costsOf(result));
  const credits = creditsOf(result);
  if (cost !== null) {
    const credit = biggest(credits);
    return credit === null
      ? { case: "cost_only", picks: [pick(cost, "cost")] }
      : { case: "cost_and_credit", picks: [pick(cost, "cost"), pick(credit, "credit")] };
  }
  const two = topTwo(credits);
  if (two.length === 0) return { case: "none", picks: [] };
  return { case: "credits_only", picks: two.map((c) => pick(c, "credit")) };
}

/** The re-check explanation: lead with the rule the fix cleared (a full clear: a cost before, none after), else the
 *  credit it earned (new in after), then the biggest cost still left. If the score did not rise: the cost now. */
export function pickRecheckExplanation(before: PartsScored, after: PartsScored): ExplainPicks {
  const costsAfter = costsOf(after);
  if (after.overall <= before.overall) {
    const cost = biggest(costsAfter);
    return cost === null ? pickExplanation(after) : { case: "cost_now", picks: [pick(cost, "cost")] };
  }
  const afterCostIds = new Set(costsAfter.map((c) => c.id));
  const cleared = biggest(costsOf(before).filter((c) => !afterCostIds.has(c.id)));
  const left = biggest(costsAfter);
  if (cleared !== null) {
    // the points are the drop in the rule's cost: what it cost before, none after
    return { case: "cleared", picks: left === null ? [pick(cleared, "cleared")] : [pick(cleared, "cleared"), pick(left, "cost")] };
  }
  const creditIdsBefore = new Set(creditsOf(before).map((c) => c.id));
  const earned = biggest(creditsOf(after).filter((c) => !creditIdsBefore.has(c.id)));
  if (earned !== null) {
    return { case: "earned", picks: left === null ? [pick(earned, "earned")] : [pick(earned, "earned"), pick(left, "cost")] };
  }
  return pickExplanation(after);
}

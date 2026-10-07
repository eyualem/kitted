// The "Why this score" ledger (02 D8, 04 §5.7): the same score() run with a trace, turned into
// rows that add up. Pure; the result is exactly score()'s (a test checks all parity cases).
//
//   base 7.0 + earned credits + partial boost − Σ rule impacts + adjust = raw;  raw + rounding = overall
//
// `adjust` is non-zero only when a clamp bit (sub-score floor/ceiling, raw 3–10); `rounding` is
// the step to the nearest half point. Rows are in the order the sheet shows them: earned credits
// (rubric order), then unearned credits (rubric order), then mistakes in the order they fired.

import { defaultRubric, type CreditReason, type RubricEngine, type ScoreTrace } from "./rubric";
import type { CreditId, NotRated, Reading, RubricResult, RuleId, ScoreOptions, SubscoreName } from "./types";

export interface LedgerCredit {
  id: CreditId;
  earned: boolean;
  /** Nominal points (+0.5); the partial boost is a separate row. */
  points: number;
  /** Index into reading.garments of the piece that earned it. */
  evidenceIndex: number | null;
  /** Index into reading.held_items when the reason is heldNotWorn. */
  heldIndex: number | null;
  reason: CreditReason | null;
}

export interface LedgerRule {
  id: RuleId;
  sub: SubscoreName | "occasion";
  /** The rule's penalty in its own units (sub-score points or occasion points). */
  amount: number;
  /** Score points it removes (before clamping): mistakeMultiplier × weight × amount, or occasionMultiplier × amount. */
  impact: number;
  culpritIndex: number | null;
}

export interface ScoreLedger {
  base: number;
  credits: LedgerCredit[];
  /** Extra credit points from scaling for hidden parts (v3.1 R4); 0 on a full check. */
  partialBoost: number;
  rules: LedgerRule[];
  /** Clamp correction so the rows add up to `raw` (0 unless a clamp bit). */
  adjust: number;
  raw: number;
  /** overall − raw (e.g. +0.25 when 8.75 shows as 9.0). */
  rounding: number;
  overall: number;
  /** True when an occasion rule fired (then the sheet shows no "dressed right for it" row). */
  occasionRuleFired: boolean;
  notRated: NotRated[];
}

export interface Explained {
  result: RubricResult;
  ledger: ScoreLedger | null;
}

/** score() plus the ledger. `ledger` is null when nothing was scored (not clothed, nothing readable). */
export function explainScore(reading: Reading, opts: ScoreOptions = {}, engine: RubricEngine = defaultRubric): Explained {
  const trace: ScoreTrace = { rules: [], credits: [], creditFactor: 1 };
  const result = engine.score(reading, opts, trace);
  if (result.overall === null) return { result, ledger: null };

  const S = engine.data.scoring;
  const W = S.weights as Record<SubscoreName, number>;
  const rules: LedgerRule[] = trace.rules.map((r) => ({
    ...r,
    impact: r.sub === "occasion" ? S.occasionMultiplier * r.amount : S.mistakeMultiplier * W[r.sub] * r.amount,
  }));
  const earnedSum = trace.credits.filter((c) => c.earned).reduce((a, c) => a + c.points, 0);
  const partialBoost = result.creditUnrounded - earnedSum;
  const credits = [...trace.credits.filter((c) => c.earned), ...trace.credits.filter((c) => !c.earned)];
  const impacts = rules.reduce((a, r) => a + r.impact, 0);
  const expected = S.baseline + earnedSum + partialBoost - impacts;
  const tiny = (x: number) => (Math.abs(x) < 1e-9 ? 0 : x);

  return {
    result,
    ledger: {
      base: S.baseline,
      credits,
      partialBoost: tiny(partialBoost),
      rules,
      adjust: tiny(result.rawUnrounded - expected),
      raw: result.rawUnrounded,
      rounding: tiny(result.overall - result.rawUnrounded),
      overall: result.overall,
      occasionRuleFired: rules.some((r) => r.sub === "occasion"),
      notRated: [...result.notRated],
    },
  };
}

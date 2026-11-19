// T65 (stub): the one or two rules that made a score, read from the result alone (tasks/T65/TESTING.md ER1.1, ER1.5).
import type { PartsScored } from "./parts";

export type PickKind = "check" | "lift" | "cap" | "taste" | "condition" | "occasion" | "layer";
export type PickRole = "cost" | "credit" | "cleared" | "earned";
export interface RulePick { id: string; kind: PickKind; role: PickRole; points: number; plain: string; known: string | null; line: string }
export type PickCase = "cost_and_credit" | "cost_only" | "credits_only" | "none" | "cleared" | "earned" | "cost_now";
export interface ExplainPicks { case: PickCase; picks: RulePick[] }

export function pickExplanation(_result: PartsScored): ExplainPicks {
  throw new Error("T65: not built");
}
export function pickRecheckExplanation(_before: PartsScored, _after: PartsScored): ExplainPicks {
  throw new Error("T65: not built");
}

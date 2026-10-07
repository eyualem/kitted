// @kitted/core: the scoring brain shared by the Expo app and (later) the Cloudflare Worker proxy.
// Pure TypeScript, no runtime dependencies, no I/O. Source of truth: extraction-test/rubric.py (v3.1).

export * from "./types";
export { RUBRIC_DATA } from "./rubricData";
export {
  ENGINE_VERSION, createRubric, defaultRubric, score, isScored, stylesMap, roundHalf, nearest, pyRound,
  type RubricEngine,
} from "./rubric";
export { scoreWord, SCORE_WORDS, type ScoreWord } from "./scoreWords";
export { suggestFixes, applyFix, fixTargets, type Fix, type FixSuggestions, type FixOptions } from "./fixes";
export { recheckMerge, recheckOutcome, STATE_FIELDS, type RecheckMerge, type RecheckOutcome } from "./recheck";
export { applyCorrection, removeGarment, correctionLine } from "./corrections";
export { matchClosetItem, closetPlan, type ClosetPlan, type ClosetPlanEntry } from "./closetMatch";
export { partialLabel, mergeShoeSnap, mergeBottomSnap, pickShoesFromCloset } from "./partial";
export { rotation, outfitValid, outfitReading, itemKey, HARD_RULES, type RotationResult, type ItemKey, type ComboKey } from "./rotation";
export { garmentName, G, SUB_NAME, SLOT_TO_CLOSET, CORE, idx } from "./names";
export { clone, deepEqual } from "./util";
export { explainScore, type ScoreLedger, type LedgerCredit, type LedgerRule, type Explained } from "./ledger";
export type { CreditReason, ScoreTrace } from "./rubric";
export {
  US_EASTERN, fixedZone, localParts, parseRollover, DEFAULT_ROLLOVER, dayKey, addDays, weekdayOf, daysBetween, wallToUtc, nextRolloverMs,
  type ZoneOffset, type LocalParts,
} from "./time";

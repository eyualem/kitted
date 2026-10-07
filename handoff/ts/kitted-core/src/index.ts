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
export { recheckMerge, STATE_FIELDS, type RecheckMerge } from "./recheck";
export { applyCorrection, correctionLine } from "./corrections";
export { partialLabel, mergeShoeSnap, mergeBottomSnap, pickShoesFromCloset } from "./partial";
export { rotation, outfitValid, outfitReading, itemKey, HARD_RULES, type RotationResult, type ItemKey, type ComboKey } from "./rotation";
export { garmentName, G, SUB_NAME, SLOT_TO_CLOSET, CORE, idx } from "./names";
export { clone, deepEqual } from "./util";

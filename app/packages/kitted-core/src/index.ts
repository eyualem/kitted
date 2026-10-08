// @kitted/core: the scoring brain shared by the Expo app and (later) the Cloudflare Worker proxy.
// Pure TypeScript, no runtime dependencies, no I/O. Source of truth: extraction-test/rubric.py (v4.0).

export * from "./types";
export { RUBRIC_DATA } from "./rubricData";
export {
  ENGINE_VERSION, createRubric, defaultRubric, score, askQuestion, detectStyles, isScored, stylesMap, roundHalf, nearest, pyRound,
  type RubricEngine, type DetectedStyles,
} from "./rubric";
export { scoreWord, SCORE_WORDS, type ScoreWord } from "./scoreWords";
export { suggestFixes, applyFix, fixTargets, type Fix, type FixSuggestions, type FixOptions } from "./fixes";
export { recheckMerge, recheckOutcome, STATE_FIELDS, type RecheckMerge, type RecheckOutcome } from "./recheck";
export { applyCorrection, removeGarment, correctionLine } from "./corrections";
export { applyTapAnswer, tapOrdinal, tapOrder, carryTapAnswer, type TapCarry } from "./tap";
export { matchClosetItem, closetPlan, type ClosetPlan, type ClosetPlanEntry } from "./closetMatch";
export { partialLabel, mergeShoeSnap, mergeBottomSnap, pickShoesFromCloset } from "./partial";
export { rotation, outfitValid, outfitReading, itemKey, HARD_RULES, type RotationResult, type ItemKey, type ComboKey } from "./rotation";
export { garmentName, G, SUB_NAME, SLOT_TO_CLOSET, CORE, idx } from "./names";
export { clone, deepEqual } from "./util";
export {
  weatherNeeds, seasonNeeds, weatherTip, itemAllowed, isWarmLayer, isHeavyOuter, isBoot, isSuede, isShorts, isFairWeatherShoe, WEATHER_BANDS,
  type DayWeather, type WeatherCondition, type WeatherWindow, type WeatherNeeds, type LayerNeed, type WeatherTip, type WeatherTipKey,
} from "./weather";
export {
  pickOutfit, closetState,
  type PickInput, type PickedOutfit, type IdeaResult, type IdeaReason, type IdeaReasonKey, type ClosetState, type MissingSlot,
} from "./ideas";
export { styleEffects, type StyleEffect, type StyleLens } from "./lens";
export { explainScore, type ScoreLedger, type LedgerCredit, type LedgerRule, type Explained } from "./ledger";
export type { CreditReason, ScoreTrace } from "./rubric";
export {
  US_EASTERN, fixedZone, localParts, parseRollover, DEFAULT_ROLLOVER, dayKey, addDays, weekdayOf, daysBetween, wallToUtc, nextRolloverMs,
  type ZoneOffset, type LocalParts,
} from "./time";
// Closet identity: the deterministic same / new / ask matcher closetMatch.ts wraps (#90, #91).
export {
  COLOR_EDGES, JEANS_ONLY_EDGES, colorDistance, colorNeighbors, FAMILY_HEX, UNKNOWN_HEX, hexToLab, labToHex, lightnessOf,
  nearestFamily, familyBand, displayHex, type ColorDistance, type ShadeStep, type Lab,
} from "./closetColor";
export {
  parseShade, cleanShadeText, shadeId, shadeFromId, shadeWords, FAMILY_WORD, type ShadeKey, type ShadeFinish,
} from "./closetShade";
export {
  DETAILS, LAYERABLE, FLIP_PAIRS, SAME_MIN, RUNNER_UP_GAP, normalizeBrand, profileOf, profileFromClosetItem, identity, decide,
  reconcile, reconcileReading,
  type Detail, type Lightness, type SleeveLength, type ShoeProfile, type DenimWear, type ConfirmedFields, type Observation,
  type ItemProfile, type ProfileExtra, type IdentityReason, type IdentityResult, type Decision, type ReconcileEntry,
  type ReadingReconcileEntry,
} from "./closetIdentity";

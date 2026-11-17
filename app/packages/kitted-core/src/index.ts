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
export { applyTapAnswer, tapOrdinal, tapOrder, tapSpan, isShoeQuestion, carryTapAnswer, type TapCarry } from "./tap";
export { askWithCloset, askWithClosetBy, KNOWN_SWING } from "./known";
// The one quick tap for parts-scored checks (#212): the same questions, judged by the parts score swing.
export { askQuestionParts, askWithClosetParts, partsOverall } from "./partsTap";
export { matchClosetItem, closetPlan, type ClosetPlan, type ClosetPlanEntry } from "./closetMatch";
export { partialLabel, mergeShoeSnap, mergeBottomSnap, pickShoesFromCloset } from "./partial";
export { rotation, outfitValid, outfitReading, itemKey, HARD_RULES, type RotationResult, type ItemKey, type ComboKey } from "./rotation";
export { garmentName, G, SUB_NAME, SLOT_TO_CLOSET, CORE, idx } from "./names";
export { clone, deepEqual } from "./util";
export {
  weatherNeeds, seasonNeeds, weatherTip, itemAllowed, isLightLayer, isWarmLayer, isHeavyOuter, isBoot, isSuede, isShorts, isFairWeatherShoe, WEATHER_BANDS,
  type DayWeather, type WeatherCondition, type WeatherWindow, type WeatherNeeds, type LayerNeed, type WeatherTip, type WeatherTipKey,
} from "./weather";
export {
  pickOutfit, closetState, pickHistory, outfitKey, swapOptions,
  type PickInput, type SwapOption, type PickHistory, type PastUse, type PickedOutfit, type IdeaResult, type IdeaReason, type IdeaReasonKey, type ClosetState, type MissingSlot,
} from "./ideas";
export { styleEffects, type StyleEffect, type StyleLens } from "./lens";
export { explainScore, type ScoreLedger, type LedgerCredit, type LedgerRule, type Explained } from "./ledger";
export type { CreditReason, ScoreTrace, RubricHelpers, Outfit as StyleOutfit } from "./rubric";
// The parts engine (parts_proto.py v4, parts data 1.1.0): ported with parity.
export { PARTS_DATA } from "./partsData";
export {
  createParts, defaultParts, scoreParts, partsCardRow, CASUAL_FITS_V14, HOODIE_LAYER_V15, partsDataFor, setCasualFitsV14, setHoodieLayerV15,
  type PartsEngine, type PartsData, type PartsTune, type PartsOptions, type PartsResult, type PartsScored, type PartsUnscored,
  type PartName, type PartResult, type PartReason, type PartTip, type PartsCondition, type PartsOccasion, type PartsLowest,
  type SecondLook, type SecondLookInput,
} from "./parts";
// The parts engine's fix engine (parts_fixes.py, catalog fixes.json -> "parts" 1.0.0; #208): ported with parity, not wired in.
export { PARTS_FIXES_DATA } from "./partsFixesData";
export {
  suggestPartsFixes,
  type PartsFixCatalog, type PartsFixCandidate, type PartsNextLevel, type PartsFixEdit, type PartsFixClass, type PartsFix,
  type PartRaise, type PartsSmallerStep, type PartsFixSuggestions, type PartsFixOptions, type PartsFixEngines,
} from "./partsFixes";
// The parts engine in the app's check flow (#209): card fix rows, re-check targets and outcome.
export {
  PARTS_RUBRIC_VERSION, isPartsFix, partsFixAsFix, partsFixTargets, cardFixTargets, applyPartsFix, partsRecheckOutcome,
} from "./partsCheck";
// "Going for" (#215): what his stated look changes on the card (the advice), never the score.
export { goingForAdvice, type GoingForAdvice, type GoingForMove, type GoingForOptions, type GoingForEngines } from "./goingFor";
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
  reconcile, reconcileReading, shoeKindOf, knownMatches, lessonsOfYes, PARTIAL_ASK_MIN, type KnownPiece,
  type Detail, type Lightness, type SleeveLength, type ShoeProfile, type DenimWear, type ConfirmedFields, type Observation,
  type ItemProfile, type ProfileExtra, type IdentityReason, type IdentityResult, type Decision, type ReconcileEntry,
  type ReadingReconcileEntry, type StoredProfile,
} from "./closetIdentity";
export { allowedColors, COLOR_CHOICES, type AllowedColorsInput, type AllowedColorsEngines } from "./allowedColors";

// One place that turns a reading into everything a check card shows: the score, the fixes, the partial label and
// the sentence. Pure; the service writes the result to the row.
//
// Two engines (#209). New checks are scored by the parts engine (core scoreParts + suggestPartsFixes; rubricVersion
// "parts-1.0.0"). v4.1 (core score + suggestFixes) stays behind SCORING_ENGINE so it can be switched back in one
// place. A stored check is never re-scored by the switch: only new scores (a new check, or a re-score of a check
// that is being changed: an answer, a correction, the occasion) use it.

import {
  goingForAdvice, PARTS_FIXES_DATA, PARTS_RUBRIC_VERSION, partialLabel as corePartialLabel, partsFixAsFix, RUBRIC_DATA, score, scoreParts, suggestFixes,
  suggestPartsFixes, type ClosetItem, type Fix, type FixSuggestions, type PartName, type PartsFixSuggestions, type PartsScored, type Reading,
  type RubricResult, type ScoreOptions, type ScoredResult, type SecondLookInput, type Styles,
} from '@kitted/core';
import { normStyleKey, type CheckDetails, type FitCheckRow, type FitCheckStatus, type OccasionKey, type StoredParts, type StyleKey } from '@/data/types';
import { t } from '@/i18n/en';
import { cardSummary } from './explain';

export type ScoringEngine = 'parts' | 'v4';

/** The one switch (#209): 'parts' (default) or 'v4' to roll back to rubric v4.1. */
// Inside 'parts', the casual-fits update (parts v14, #335) has its own switch: CASUAL_FITS_V14 in
// packages/kitted-core/src/parts.ts (true = v14, false = back to v13's numbers for every scoring path).
// The hoodie layer (parts v15, #385) has one too: HOODIE_LAYER_V15 there (true = v15, false = back to v14's numbers).
// Slides charged once (parts v16, #450, #452) has the third: SLIDES_ONCE_V16 there (true = v16, false = back to v15's numbers).
export const DEFAULT_SCORING_ENGINE: ScoringEngine = 'parts';
let engineNow: ScoringEngine = DEFAULT_SCORING_ENGINE;
export const scoringEngine = (): ScoringEngine => engineNow;
/** Tests (and a future dev toggle) only. */
export function setScoringEngine(e: ScoringEngine): void {
  engineNow = e;
}

export interface EvaluateInput {
  reading: Reading;
  occasion: OccasionKey;
  styles: Styles;
  boldness: string | null;
  /** The closet BEFORE this photo's pieces were added (a fix never offers back what's in the photo). */
  closet: readonly ClosetItem[];
  firstCheck: boolean;
  hiddenFixTargets?: readonly string[];
  /** A warm day: no "add a layer" or boots fix (#160). Never changes the score. */
  warm?: boolean;
  /** Closet pieces he tried on in an earlier check that day: a fix that uses one is labelled so (#360). Never the score. */
  triedEarlier?: ReadonlySet<string>;
  /** Default: the switch. */
  engine?: ScoringEngine;
  /** "Going for" (#215): the look he's going for (null = Not sure). Undefined = a check from before the question, so no
   *  advice is written. Advice only: it's computed with no picks and can't reach the score. */
  goingFor?: StyleKey | null;
  /** The check's stored second look (#199) as the engine reads it (secondLook.lookInput); null/absent = without. The
   *  parts engine only: the card, the fixes, the one quick tap and Going for all see the same one. */
  secondLook?: SecondLookInput | null;
}

/** The options a check is scored with: v4.1's, plus the second look for the parts engine (v4.1 never reads it). */
export type CheckScoreOptions = ScoreOptions & { secondLook?: SecondLookInput };

export interface Evaluation {
  status: FitCheckStatus;
  engine: ScoringEngine;
  /** v4 only. */
  result: RubricResult | null;
  scored: ScoredResult | null;
  /** Parts only. */
  parts: PartsScored | null;
  /** The card's fixes and its tip lines (v4: core FixSuggestions; parts: the fixes as card rows, the Smaller step or
   *  Next level line as nextLevel). */
  fixes: { fixes: Fix[]; nextLevel: string[]; tips: string[] };
  partial: 'shoes' | 'topOnly' | null;
  summary: string | null;
  /** The fit_checks columns this evaluation sets. */
  row: Pick<
    FitCheckRow,
    'status' | 'score' | 'rawScore' | 'subscores' | 'occasionAdj' | 'rulesFired' | 'credits' | 'advice' | 'fixes' | 'isPartial' | 'notRated' | 'explanation'
    | 'rubricVersion'
  > & { details: Pick<CheckDetails, 'nextLevel' | 'tips' | 'dialedIn' | 'hiddenFixTargets' | 'readsAs' | 'warm' | 'tipLead' | 'parts' | 'goingForAdvice'> };
}

/** The rubric options a check is scored with. The one place they're built, so the one quick tap's two scores
 *  (askQuestion) are exactly what the card then shows. */
export function scoreOptions(input: Pick<EvaluateInput, 'occasion' | 'styles' | 'boldness' | 'secondLook'>): CheckScoreOptions {
  return { occasion: input.occasion, styles: input.styles, boldness: input.boldness ?? 'a_little', ...(input.secondLook ? { secondLook: input.secondLook } : {}) };
}

export function partialKind(notRated: readonly string[]): 'shoes' | 'topOnly' | null {
  if (notRated.includes('bottom half')) return 'topOnly';
  if (notRated.includes('shoes')) return 'shoes';
  return null;
}

/** The score the engine in use gives a reading (no fixes): the one quick tap's option scores. */
export function overallFor(reading: Reading, opts: ScoreOptions, engine: ScoringEngine = engineNow): number | null {
  return engine === 'parts' ? scoreParts(reading, opts).overall : score(reading, opts).overall;
}

export function evaluateCheck(input: EvaluateInput): Evaluation {
  return (input.engine ?? engineNow) === 'parts' ? evaluateParts(input) : evaluateV4(input);
}

/** Closet names keep their capital in Closet ("Khaki chinos") but sit mid-sentence in a fix line ("Swap to your khaki
 *  chinos"). Core fills them in as stored (it stays in parity with Python), so the app lowers the first letter of the
 *  name after "your" here, the way the closet's own lines do (#276). */
export function midSentenceNames(text: string, closet: readonly ClosetItem[]): string {
  let out = text;
  for (const c of closet) {
    const name = typeof c.name === 'string' ? c.name : '';
    const low = name.charAt(0).toLowerCase() + name.slice(1);
    if (name && low !== name && out.includes(`your ${name}`)) out = out.split(`your ${name}`).join(`your ${low}`);
  }
  return out;
}
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
/** "Free · from your closet" → "Free · from your earlier check" (or mid-tag, lowercased) for a piece he tried earlier. */
function triedTag(tag: string): string {
  const from = t('pfix.tag.closet');
  const to = t('fix.tag.earlierCheck');
  return tag.split(from).join(to).split(lowerFirst(from)).join(lowerFirst(to));
}
const fixesMidSentence = (fixes: readonly Fix[], closet: readonly ClosetItem[], tried?: ReadonlySet<string>): Fix[] =>
  fixes.map((f) => (f.itemId ? { ...f, copy: midSentenceNames(f.copy, closet), ...(tried?.has(f.itemId) ? { tag: triedTag(f.tag) } : {}) } : f));
/** The Going-for move in the same words as the card's fix (the card matches them by copy). */
function adviceMidSentence(a: ReturnType<typeof goingForAdvice>, closet: readonly ClosetItem[]): ReturnType<typeof goingForAdvice> {
  return a?.move ? { ...a, move: { ...a.move, copy: midSentenceNames(a.move.copy, closet) } } : a;
}

function evaluateV4(input: EvaluateInput): Evaluation {
  const opts = scoreOptions({ ...input, secondLook: null });
  const result = score(input.reading, opts);
  const raw: FixSuggestions = suggestFixes(input.reading, {
    ...opts,
    closet: input.closet,
    firstCheck: input.firstCheck,
    excludeTargets: input.hiddenFixTargets ? [...input.hiddenFixTargets] : [],
    warm: input.warm ?? false,
  });
  // `fixes` stays core's (the parity checks read it); the row, which the card shows, gets the mid-sentence names.
  const fixes = raw;
  const shownFixes = fixesMidSentence(raw.fixes, input.closet, input.triedEarlier);
  const shownNext = raw.nextLevel.map((l) => midSentenceNames(l, input.closet));
  if (result.overall === null) {
    const status: FitCheckStatus = result.reason === 'not_fully_clothed' ? 'notClothed' : 'unreadable';
    return {
      status, engine: 'v4', result, scored: null, parts: null, fixes, partial: null, summary: null,
      row: {
        status, score: null, rawScore: null, subscores: {}, occasionAdj: 0, rulesFired: [], credits: [], advice: [], fixes: [],
        isPartial: result.partial, notRated: [], explanation: null, rubricVersion: RUBRIC_DATA.version, details: { readsAs: null, parts: undefined },
      },
    };
  }
  const partial = partialKind(result.notRated);
  const summary = cardSummary({ reading: input.reading, overall: result.overall, lounge: result.rulesFired.includes('O4_loungewear_out'), fixes: fixes.fixes, partial });
  return {
    status: 'scored', engine: 'v4', result, scored: result, parts: null, fixes, partial, summary,
    row: {
      status: 'scored', score: result.overall, rawScore: result.rawScore, subscores: result.subscores, occasionAdj: result.occasionAdj,
      rulesFired: [...result.rulesFired], credits: [...result.credits], advice: [...result.advice], fixes: shownFixes,
      isPartial: result.partial, notRated: [...result.notRated], explanation: summary, rubricVersion: RUBRIC_DATA.version,
      details: {
        nextLevel: shownNext, tips: fixes.tips, dialedIn: fixes.fixes.length === 0,
        hiddenFixTargets: input.hiddenFixTargets ? [...input.hiddenFixTargets] : [],
        warm: input.warm ?? false,
        readsAs: normStyleKey(result.styleLabel),
        tipLead: 'nextLevel',
        parts: undefined,
      },
    },
  };
}

/** The part the card's move raises (copper in the Why strip). */
function gainPartOf(res: PartsScored, fx: PartsFixSuggestions): PartName | null {
  const top = fx.fixes[0]?.raises[0]?.part;
  if (top) return top;
  if (fx.smallerStep) return fx.smallerStep.part;
  if (fx.nextLevel) return fx.nextLevel.part;
  const lowest = res.lowest.part;
  return lowest && res.parts[lowest].display !== null && res.parts[lowest].display! < 7 ? lowest : null;
}

/** The parts result as a check stores it (enough for the Why sheet; the reading stays the source of truth). */
export function storedParts(res: PartsScored, fx: PartsFixSuggestions): StoredParts {
  return {
    version: res.version, overall: res.overall, average: res.average, averageUnrounded: res.averageUnrounded, rawUnrounded: res.rawUnrounded,
    earnedBonus: res.earnedBonus, piledPenalty: res.piledPenalty, floored: res.floored, parts: res.parts, naParts: [...res.naParts], weightsUsed: { ...res.weightsUsed },
    condition: res.condition, occasion: res.occasion, gainPart: gainPartOf(res, fx),
  };
}

/** The loungewear hold is what holds the score down ("Sweatpants read as loungewear outside the gym"). */
export function loungeHolds(res: PartsScored): boolean {
  const o = res.occasion;
  return o.ceiling !== null && o.status.startsWith('loungewear') && res.overall < res.average + res.earnedBonus - res.piledPenalty - res.condition.deduction;
}

function evaluateParts(input: EvaluateInput): Evaluation {
  const opts = scoreOptions(input);
  const r = scoreParts(input.reading, opts);
  const hidden = input.hiddenFixTargets ? [...input.hiddenFixTargets] : [];
  if (r.overall === null) {
    const status: FitCheckStatus = r.reason === 'not_fully_clothed' ? 'notClothed' : 'unreadable';
    return {
      status, engine: 'parts', result: null, scored: null, parts: null, fixes: { fixes: [], nextLevel: [], tips: [] }, partial: null, summary: null,
      row: {
        status, score: null, rawScore: null, subscores: {}, occasionAdj: 0, rulesFired: [], credits: [], advice: [], fixes: [],
        isPartial: false, notRated: [], explanation: null, rubricVersion: PARTS_RUBRIC_VERSION, details: { readsAs: null, parts: undefined },
      },
    };
  }
  const res = r as PartsScored;
  const fx = suggestPartsFixes(input.reading, {
    ...opts, closet: input.closet, firstCheck: input.firstCheck, exclude: hidden, warm: input.warm ?? false,
  });
  const fixes = fx.fixes.map(partsFixAsFix);
  // As in v4: `fixes` stays core's, the row gets the mid-sentence names.
  const shownFixes = fixesMidSentence(fixes, input.closet, input.triedEarlier);
  const partial = partialKind(res.notRated);
  const summary = cardSummary({ reading: input.reading, overall: res.overall, lounge: loungeHolds(res), fixes, partial });
  const tip = fx.smallerStep?.line ?? fx.nextLevel?.line ?? null;
  const shownTip = tip === null ? null : midSentenceNames(tip, input.closet);
  const subscores: Record<string, number> = {};
  for (const k of Object.keys(res.parts) as PartName[]) if (res.parts[k].display !== null) subscores[k] = res.parts[k].display!;
  return {
    status: 'scored', engine: 'parts', result: null, scored: null, parts: res, fixes: { fixes, nextLevel: tip ? [tip] : [], tips: [] }, partial, summary,
    row: {
      status: 'scored', score: res.overall, rawScore: res.rawScore, subscores, occasionAdj: -res.occasion.deduction,
      rulesFired: [], credits: [], advice: [], fixes: shownFixes, isPartial: res.partial, notRated: [...res.notRated], explanation: summary,
      rubricVersion: PARTS_RUBRIC_VERSION,
      details: {
        nextLevel: shownTip ? [shownTip] : [], tips: [], dialedIn: fixes.length === 0, hiddenFixTargets: hidden, warm: input.warm ?? false,
        readsAs: normStyleKey(res.styleLabel), tipLead: fx.smallerStep ? 'smallerStep' : fx.nextLevel?.id.startsWith('tip_') ? 'tip' : 'nextLevel', parts: storedParts(res, fx),
        ...(input.goingFor !== undefined
          ? {
              goingForAdvice: adviceMidSentence(goingForAdvice(input.reading, input.goingFor, {
                occasion: input.occasion, boldness: opts.boldness, closet: input.closet, warm: input.warm ?? false, secondLook: input.secondLook ?? null,
              }), input.closet),
            }
          : {}),
      },
    },
  };
}

/** The card's tip lead for a stored check ("Next level" / "Smaller step"). */
export const tipLeadText = (lead: CheckDetails['tipLead']): string | null =>
  lead === 'smallerStep' ? PARTS_FIXES_DATA.copy.smallerStepLabel : lead === 'tip' ? PARTS_FIXES_DATA.copy.tipLabel : null;

/** The partial label text from the deck (core's partialLabel returns the same English; checked in tests). */
export { corePartialLabel };

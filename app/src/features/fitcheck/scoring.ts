// One place that turns a reading into everything a check card shows: the rubric result, the
// fixes, the partial label and the sentence. Pure; the service writes the result to the row.

import {
  partialLabel as corePartialLabel, score, suggestFixes, type ClosetItem, type FixSuggestions, type Reading, type RubricResult,
  type ScoreOptions, type ScoredResult, type Styles,
} from '@kitted/core';
import { normStyleKey, type CheckDetails, type FitCheckRow, type FitCheckStatus, type OccasionKey } from '@/data/types';
import { cardSummary } from './explain';

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
}

export interface Evaluation {
  status: FitCheckStatus;
  result: RubricResult;
  scored: ScoredResult | null;
  fixes: FixSuggestions;
  partial: 'shoes' | 'topOnly' | null;
  summary: string | null;
  /** The fit_checks columns this evaluation sets. */
  row: Pick<
    FitCheckRow,
    'status' | 'score' | 'rawScore' | 'subscores' | 'occasionAdj' | 'rulesFired' | 'credits' | 'advice' | 'fixes' | 'isPartial' | 'notRated' | 'explanation'
  > & { details: Pick<CheckDetails, 'nextLevel' | 'tips' | 'dialedIn' | 'hiddenFixTargets' | 'readsAs' | 'warm'> };
}

/** The rubric options a check is scored with. The one place they're built, so the one quick tap's two scores
 *  (askQuestion) are exactly what the card then shows. */
export function scoreOptions(input: Pick<EvaluateInput, 'occasion' | 'styles' | 'boldness'>): ScoreOptions {
  return { occasion: input.occasion, styles: input.styles, boldness: input.boldness ?? 'a_little' };
}

export function partialKind(notRated: readonly string[]): 'shoes' | 'topOnly' | null {
  if (notRated.includes('bottom half')) return 'topOnly';
  if (notRated.includes('shoes')) return 'shoes';
  return null;
}

export function evaluateCheck(input: EvaluateInput): Evaluation {
  const opts = scoreOptions(input);
  const result = score(input.reading, opts);
  const fixes = suggestFixes(input.reading, {
    ...opts,
    closet: input.closet,
    firstCheck: input.firstCheck,
    excludeTargets: input.hiddenFixTargets ? [...input.hiddenFixTargets] : [],
    warm: input.warm ?? false,
  });
  if (result.overall === null) {
    const status: FitCheckStatus = result.reason === 'not_fully_clothed' ? 'notClothed' : 'unreadable';
    return {
      status, result, scored: null, fixes, partial: null, summary: null,
      row: {
        status, score: null, rawScore: null, subscores: {}, occasionAdj: 0, rulesFired: [], credits: [], advice: [], fixes: [],
        isPartial: result.partial, notRated: [], explanation: null, details: { readsAs: null },
      },
    };
  }
  const partial = partialKind(result.notRated);
  const summary = cardSummary({ reading: input.reading, result, fixes: fixes.fixes, partial });
  return {
    status: 'scored', result, scored: result, fixes, partial, summary,
    row: {
      status: 'scored', score: result.overall, rawScore: result.rawScore, subscores: result.subscores, occasionAdj: result.occasionAdj,
      rulesFired: [...result.rulesFired], credits: [...result.credits], advice: [...result.advice], fixes: fixes.fixes,
      isPartial: result.partial, notRated: [...result.notRated], explanation: summary,
      details: {
        nextLevel: fixes.nextLevel, tips: fixes.tips, dialedIn: fixes.fixes.length === 0,
        hiddenFixTargets: input.hiddenFixTargets ? [...input.hiddenFixTargets] : [],
        warm: input.warm ?? false,
        readsAs: normStyleKey(result.styleLabel),
      },
    },
  };
}

/** The partial label text from the deck (core's partialLabel returns the same English; checked in tests). */
export { corePartialLabel };

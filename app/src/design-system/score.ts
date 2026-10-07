// score.ts — score display, speech and the score word (03 §6).
// JS numbers are IEEE-754 binary64 like Python floats, so this matches rubric.py exactly.

import { t, type StringKey } from '@/i18n/en';
import { scoreBands, type ScoreWord } from './tokens';

/**
 * Same as rubric.py's round_half: floor(x * 2 + 0.5) / 2. Don't use Math.round or toFixed
 * here: they differ from Python on the fp_boundary parity cases (04 §4.5). Normally you
 * display the engine's `overall`, which kitted-core has already rounded this way.
 */
export function roundedToHalf(x: number): number {
  return Math.floor(x * 2 + 0.5) / 2;
}

/** Display: always one decimal ("8.0", "6.5"). Safe: a half-step value has an exact binary form. */
export function displayScore(x: number): string {
  return roundedToHalf(x).toFixed(1);
}

/** VoiceOver: "8" or "8.5" (avoids "eight point zero"). */
export function spokenScore(x: number): string {
  const r = roundedToHalf(x);
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

/** The word comes from the ROUNDED score. */
export function scoreWord(x: number): ScoreWord {
  const r = roundedToHalf(x);
  let word: ScoreWord = 'Needs a fix';
  for (const band of scoreBands) {
    if (r >= band.min) word = band.word;
  }
  return word;
}

/** Index 0…4 of the band, for the ScoreWordScale's "You're here" highlight. */
export function scoreBandIndex(x: number): number {
  const r = roundedToHalf(x);
  let index = 0;
  scoreBands.forEach((band, i) => {
    if (r >= band.min) index = i;
  });
  return index;
}

const WORD_KEYS: Record<ScoreWord, StringKey> = {
  'Needs a fix': 'score.word.needsFix',
  'Getting there': 'score.word.gettingThere',
  'Put together': 'score.word.putTogether',
  Sharp: 'score.word.sharp',
  'Dialed in': 'score.word.dialedIn',
};

/** The word as shown (from the copy deck, 02 §5.4). Always next to the number. */
export function scoreWordLabel(x: number): string {
  return t(WORD_KEYS[scoreWord(x)]);
}

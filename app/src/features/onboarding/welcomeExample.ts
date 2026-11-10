// O1's mini score card (02 D1): the example check on the hero photo (s14 since #278: s15 scores 7.0, and no demo
// photo reaches 8 under the parts engine, so the highest, 7.5, leads; s14 over p01a, which has socks and no shoes), scored by the engine new checks use, so the
// first screen shows the score the app would give that photo (#276: it said 8.5 "Sharp" while the app scored it 8.0).
// Same photo, same score. Scored at Everyday with no picks (picks never change a score, #211).
// T38: the interface below (WELCOME_READING … welcomeLayout) is stubbed by the test writer; the implementer builds it.
import type { Reading } from '@kitted/core';
import { overallFor, scoreOptions } from '@/features/fitcheck/scoring';
import { scoreWordLabel } from '@/design-system/score';
import { demoReadingById } from '@/services/readingSource/demoReadings';
import type { DrawnSlot } from './outfitDrawing';

export const WELCOME_PHOTO = 's14';
export const WELCOME_READING = 's14';

export interface WelcomeExample {
  reading: Reading;
  afterReading: Reading;
  score: number;
  word: string;
  after: { score: number; word: string };
  fix: { copy: string; tag: string; to: number };
  swapSlot: DrawnSlot;
}

/** T38 stub: still today's { score, word } only; the rest isn't built. */
export function welcomeExample(): WelcomeExample | null {
  const reading = demoReadingById(WELCOME_PHOTO);
  const score = reading ? overallFor(reading, scoreOptions({ occasion: 'everyday', styles: [], boldness: null })) : null;
  return score === null ? null : ({ score, word: scoreWordLabel(score) } as WelcomeExample);
}

export const SWAP_MS: {
  shoesFrom: 600; shoesTo: 1200;
  countFrom: 900;
  landBy: 1500;
  textFrom: 1500; textTo: 1700;
  doneAt: 2000;
} = { shoesFrom: 600, shoesTo: 1200, countFrom: 900, landBy: 1500, textFrom: 1500, textTo: 1700, doneAt: 2000 };

export interface WelcomeSwapFrame {
  numeral: string;
  pieceAfter: number;
  textAfter: number;
  done: boolean;
}

export function welcomeSwapFrame(_tMs: number, _ex: Pick<WelcomeExample, 'score' | 'after'>): WelcomeSwapFrame {
  throw new Error('T38: not built');
}

export function welcomeAfterFrame(_ex: Pick<WelcomeExample, 'after'>): WelcomeSwapFrame {
  throw new Error('T38: not built');
}

export function welcomeMotion(_o: { reduceMotion: boolean; accessibilitySize: boolean }): 'play' | 'still' {
  throw new Error('T38: not built');
}

export function welcomeCardA11y(_ex: WelcomeExample): string {
  throw new Error('T38: not built');
}

export interface WelcomeLayoutInput {
  width: number;
  height: number;
  safeTop: number;
  bottomBlockHeight: number;
  cardAfterHeight: number;
  accessibilitySize: boolean;
}

export interface WelcomeLayout {
  k: number;
  drawing: { left: number; top: number; width: number; height: number };
  card: { top: number; right: number; width: number | null };
  bottomBlockTop: number;
  scrolls: boolean;
}

export function welcomeLayout(_i: WelcomeLayoutInput): WelcomeLayout {
  throw new Error('T38: not built');
}

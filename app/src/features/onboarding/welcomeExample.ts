// O1's mini score card (02 D1), drawn in code since T38: the bundled s14 reading (charcoal denim jacket, white sweater,
// grey drawstring trousers, grey chunky sneakers) scored by the engine new checks use, then its top fix applied and
// scored again, so the card plays the engine's own before → after (7.5 "Put together" → 8.0 "Sharp" today). Same
// reading, same score (#276: the card once said 8.5 while the app scored the photo 8.0). Scored at Everyday with no
// picks (picks never change a score, #211). Everything here is pure: the screen reads it, nothing is stored or sent.
import { applyPartsFix, type Reading } from '@kitted/core';
import { overallFor, scoreOptions } from '@/features/fitcheck/scoring';
import { displayScore, scoreWordLabel, spokenScore } from '@/design-system/score';
import { t } from '@/i18n/en';
import { exampleCheck } from './exampleCheck';
import { drawnPieces, WELCOME_BOX, type DrawnSlot } from './outfitDrawing';

export { WELCOME_READING } from './exampleCheck';

export interface WelcomeExample {
  /** The bundled reading, unchanged. */
  reading: Reading;
  /** The top fix's edits on the reading. */
  afterReading: Reading;
  /** Before: the reading's score, and its word. */
  score: number;
  word: string;
  after: { score: number; word: string };
  /** The card's top fix for a first check with an empty closet (exampleCheck().fixes[0]). */
  fix: { copy: string; tag: string; to: number };
  /** The one drawn slot whose garment differs between reading and afterReading. */
  swapSlot: DrawnSlot;
}

let cached: WelcomeExample | null | undefined;

/** null when the reading is missing, it doesn't score, it has no fix, or the fix's edits can't be applied. Memoised. */
export function welcomeExample(): WelcomeExample | null {
  if (cached !== undefined) return cached;
  return (cached = build());
}

function build(): WelcomeExample | null {
  const ex = exampleCheck();
  const top = ex?.fixes[0];
  if (!ex || !top) return null;
  const reading = ex.reading;
  const opts = scoreOptions({ occasion: 'everyday', styles: [], boldness: null });
  const score = overallFor(reading, opts);
  const afterReading = applyPartsFix(reading, top);
  if (score === null || !afterReading) return null;
  const afterScore = overallFor(afterReading, opts);
  if (afterScore === null) return null;
  const before = drawnPieces(reading);
  const afterPieces = drawnPieces(afterReading);
  const changed = before.filter((p) => {
    const q = afterPieces.find((x) => x.slot === p.slot);
    return !q || JSON.stringify(q.garment) !== JSON.stringify(p.garment);
  });
  // The swap draws one piece over another: a fix that changes no drawn piece, or more than one, has nothing to show.
  if (changed.length !== 1 || afterPieces.length !== before.length) return null;
  return {
    reading,
    afterReading,
    score,
    word: scoreWordLabel(score),
    after: { score: afterScore, word: scoreWordLabel(afterScore) },
    fix: { copy: top.copy, tag: top.tag, to: top.to },
    swapSlot: changed[0]!.slot,
  };
}

// ── The swap (DESIGN.md phone 2) ───────────────────────────────────────────────────────────────────────────────────

/** The swap's timeline in ms at slow = 1. */
export const SWAP_MS: {
  shoesFrom: 600; shoesTo: 1200;
  countFrom: 900;
  landBy: 1500;
  textFrom: 1500; textTo: 1700;
  doneAt: 2000;
} = { shoesFrom: 600, shoesTo: 1200, countFrom: 900, landBy: 1500, textFrom: 1500, textTo: 1700, doneAt: 2000 };

export interface WelcomeSwapFrame {
  /** The numeral's text, before → after in tenths ("7.5", "7.6", … "8.0"). */
  numeral: string;
  /** Opacity of the after piece; the before piece is 1 − this. */
  pieceAfter: number;
  /** Opacity of the after word and the fix line; the before word and "Full check" are 1 − this. */
  textAfter: number;
  /** From doneAt on: nothing moves again. */
  done: boolean;
}

const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x);
/** Ease-in-out (a smoothstep): 0 → 0, 0.5 → 0.5, 1 → 1, never backwards. */
const easeInOut = (x: number) => x * x * (3 - 2 * x);
const progress = (tMs: number, from: number, to: number) => clamp01((tMs - from) / (to - from));

/** The frame at `tMs` since Welcome mounted (slow = 1). */
export function welcomeSwapFrame(tMs: number, ex: Pick<WelcomeExample, 'score' | 'after'>): WelcomeSwapFrame {
  if (tMs >= SWAP_MS.doneAt) return welcomeAfterFrame(ex);
  return {
    numeral: countAt(tMs, ex.score, ex.after.score),
    pieceAfter: easeInOut(progress(tMs, SWAP_MS.shoesFrom, SWAP_MS.shoesTo)),
    textAfter: easeInOut(progress(tMs, SWAP_MS.textFrom, SWAP_MS.textTo)),
    done: false,
  };
}

/** The count's longest run (ms): the last tenth lands by countFrom + 500 = 1400, inside landBy. */
const COUNT_SPAN = 500;

/** The count in tenths: one tenth every min(100, 500 / tenths) ms from countFrom, so it lands by landBy. With no gain
 *  (after ≤ before) it holds the before score until textFrom, then shows the after one. The ends use displayScore, the
 *  in-between tenths toFixed(1) (displayScore rounds to halves). */
function countAt(tMs: number, before: number, after: number): string {
  const tenths = Math.round((after - before) * 10);
  if (tenths <= 0) return displayScore(tMs < SWAP_MS.textFrom ? before : after);
  const step = Math.min(100, COUNT_SPAN / tenths);
  const n = Math.floor((tMs - SWAP_MS.countFrom) / step);
  if (n <= 0) return displayScore(before);
  if (n >= tenths) return displayScore(after);
  return (Math.round(before * 10 + n) / 10).toFixed(1);
}

/** The after state as a frame. */
export function welcomeAfterFrame(ex: Pick<WelcomeExample, 'after'>): WelcomeSwapFrame {
  return { numeral: displayScore(ex.after.score), pieceAfter: 1, textAfter: 1, done: true };
}

/** 'still' (the after state from the first frame, no timer) with Reduce Motion or an accessibility text size. */
export function welcomeMotion(o: { reduceMotion: boolean; accessibilitySize: boolean }): 'play' | 'still' {
  return o.reduceMotion || o.accessibilitySize ? 'still' : 'play';
}

/** The card's one VoiceOver line, the same in every frame (it reads the after state from the start). */
export function welcomeCardA11y(ex: WelcomeExample): string {
  return t('onb.welcome.cardA11y', {
    occasion: t('onb.welcome.cardOccasion'),
    before: spokenScore(ex.score),
    beforeWord: ex.word,
    fix: ex.fix.copy,
    after: spokenScore(ex.after.score),
    afterWord: ex.after.word,
  });
}

// ── How Welcome fits every phone (DESIGN.md) ────────────────────────────────────────────────────────────────────────

export interface WelcomeLayoutInput {
  /** The screen (onLayout of the root). */
  width: number;
  height: number;
  safeTop: number;
  /** The measured bottom block (wordmark … last button, with its bottom padding). */
  bottomBlockHeight: number;
  /** The measured mini card in its after state. */
  cardAfterHeight: number;
  accessibilitySize: boolean;
}

export interface WelcomeLayout {
  /** The drawing's scale. */
  k: number;
  drawing: { left: number; top: number; width: number; height: number };
  /** Non-AX: right 20, width 188. AX: width null (full width, left/right 24). */
  card: { top: number; right: number; width: number | null };
  bottomBlockTop: number;
  /** The content is taller than the screen. */
  scrolls: boolean;
}

/** 24 pt above the hero group and between the groups. */
const GAP = 24;
const DRAWING_LEFT = 12;
const CARD_RIGHT = 20;
const CARD_WIDTH = 188;
/** The shoes' drawn right edge in the base box: the widest piece beside the card. */
const DRAWN_RIGHT = 198;
const K_MIN = 0.6;
const K_AX = 0.69;

/** In content coordinates of Welcome's one scroll view. */
export function welcomeLayout(i: WelcomeLayoutInput): WelcomeLayout {
  if (i.accessibilitySize) {
    const k = K_AX;
    const w = WELCOME_BOX.width * k;
    const h = WELCOME_BOX.height * k;
    const drawingTop = i.safeTop + GAP;
    const cardTop = drawingTop + h + GAP;
    const stackEnd = cardTop + i.cardAfterHeight + GAP;
    const scrolls = stackEnd + i.bottomBlockHeight > i.height;
    return {
      k,
      drawing: { left: (i.width - w) / 2, top: drawingTop, width: w, height: h },
      card: { top: cardTop, right: GAP, width: null },
      bottomBlockTop: scrolls ? stackEnd : i.height - i.bottomBlockHeight,
      scrolls,
    };
  }
  const avail = i.height - i.safeTop - GAP * 2 - i.bottomBlockHeight;
  const kw = (i.width - DRAWING_LEFT - CARD_RIGHT - CARD_WIDTH - 8) / DRAWN_RIGHT;
  const k = Math.max(K_MIN, Math.min(1, kw, avail / WELCOME_BOX.height));
  const drawH = WELCOME_BOX.height * k;
  const hero = Math.max(drawH, i.cardAfterHeight);
  const scrolls = hero > avail;
  const heroTop = i.safeTop + GAP + (scrolls ? 0 : (avail - hero) / 2);
  const drawingTop = heroTop + (hero - drawH) / 2;
  return {
    k,
    drawing: { left: DRAWING_LEFT, top: drawingTop, width: WELCOME_BOX.width * k, height: drawH },
    card: { top: drawingTop + drawH / 2 - i.cardAfterHeight / 2, right: CARD_RIGHT, width: CARD_WIDTH },
    bottomBlockTop: scrolls ? heroTop + hero + GAP : i.height - i.bottomBlockHeight,
    scrolls,
  };
}

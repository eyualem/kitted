// Closet's "To confirm" deck (specs/closet-beta.md CB2; DECISIONS-LOG #412): one card at a time. The deck is every open
// "Is this your …?" question, newest first, then the one "How do your … fit?" question last. "2 of 5" says where he
// is; Skip and a sideways swipe step through it (wrapping both ways, saving nothing); an answer leaves the deck when
// the store drops it, and Undo brings it back as the card on screen. Which card shows is screen state only. Pure: the
// rules here import nothing from React Native.
import { t } from '@/i18n/en';

export type DeckCard<Q, F> = { kind: 'dup'; key: string; q: Q } | { kind: 'fit'; key: string; fit: F };
export interface DeckState { key: string | null; undoKey: string | null }
export type DeckMove = 'none' | 'forward' | 'back' | 'appear' | 'empty';

/** The card's motion (ms): a slide, a cross-fade (Reduce Motion, and appear/empty), a spring back. */
export const DECK_MOTION = { slideMs: 240, fadeMs: 150, springMs: 200, gap: 16 } as const;
/** The swipe: starts after 12 pt sideways, fails after 10 pt up or down first; commits past a third of the card's
 *  width or on a flick faster than 500 pt/s. */
export const SWIPE = { startX: 12, failY: 10, commit: 1 / 3, flick: 500 } as const;

export const dupKey = (obsId: string): string => `dup:${obsId}`;
export const fitKey = (itemId: string): string => `fit:${itemId}`;

/** Every open question in the order given (newest first), then the fit question if there is one. No cap. */
export function toConfirm<Q extends { ask: { obsId: string } }, F extends { item: { id: string } }>(
  open: readonly Q[],
  fit: F | null,
): DeckCard<Q, F>[] {
  const cards: DeckCard<Q, F>[] = open.map((q) => ({ kind: 'dup', key: dupKey(q.ask.obsId), q }));
  if (fit) cards.push({ kind: 'fit', key: fitKey(fit.item.id), fit });
  return cards;
}

/** Skip shows on every card except a deck of one "Is this your …?" question (it would do nothing). */
export function showsSkip(cards: readonly { kind: 'dup' | 'fit' }[]): boolean {
  if (cards.length === 0) return false;
  return !(cards.length === 1 && cards[0]!.kind === 'dup');
}

export function deckCount(keys: readonly string[], key: string): { n: number; total: number } {
  return { n: keys.indexOf(key) + 1, total: keys.length };
}

/** The next (1) or previous (-1) card, wrapping at both ends. */
export function stepDeck(keys: readonly string[], key: string, dir: 1 | -1): string {
  const i = keys.indexOf(key);
  if (keys.length === 0) return key;
  if (i < 0) return keys[0]!;
  return keys[(i + dir + keys.length) % keys.length]!;
}

/** A fresh mount always starts on card 1. */
export function startDeck(keys: readonly string[]): DeckState {
  return { key: keys[0] ?? null, undoKey: null };
}

/** An answer tapped on this card: remembered so Undo can bring it back. */
export function markAnswered(state: DeckState, key: string): DeckState {
  return { ...state, undoKey: key };
}

/** What shows after the deck's cards change (an answer landed, Undo, a fit Skip, answered elsewhere, a new question). */
export function reconcileDeck(prev: DeckState, prevKeys: readonly string[], keys: readonly string[]): { state: DeckState; move: DeckMove } {
  if (keys.length === 0) return { state: { key: null, undoKey: prev.undoKey }, move: prevKeys.length > 0 ? 'empty' : 'none' };
  if (prevKeys.length === 0) {
    const key = prev.undoKey && keys.includes(prev.undoKey) ? prev.undoKey : keys[0]!;
    return { state: { key, undoKey: null }, move: 'appear' };
  }
  if (prev.undoKey && keys.includes(prev.undoKey) && !prevKeys.includes(prev.undoKey)) {
    return { state: { key: prev.undoKey, undoKey: null }, move: 'back' };
  }
  if (prev.key && keys.includes(prev.key)) return { state: prev, move: 'none' };
  const from = prev.key ? prevKeys.indexOf(prev.key) : -1;
  const next = from < 0 ? undefined : prevKeys.slice(from + 1).find((k) => keys.includes(k));
  return { state: { key: next ?? keys[0]!, undoKey: prev.undoKey }, move: 'forward' };
}

/** Whether a drag on the card is its swipe: a 10 pt move up or down first fails it (checked first). */
export function swipeStart(dx: number, dy: number): 'claim' | 'fail' | 'wait' {
  if (Math.abs(dy) >= SWIPE.failY) return 'fail';
  if (Math.abs(dx) >= SWIPE.startX) return 'claim';
  return 'wait';
}

/** On release: 1 shows the next card (finger moved left), -1 the previous, 0 springs back. */
export function swipeStep(dx: number, vx: number, width: number, count: number): -1 | 0 | 1 {
  if (count <= 1 || dx === 0) return 0;
  const far = Math.abs(dx) >= width * SWIPE.commit;
  const flick = Math.abs(vx) >= SWIPE.flick && Math.sign(vx) === Math.sign(dx);
  if (!far && !flick) return 0;
  return dx < 0 ? 1 : -1;
}

export function cardMotion(reduceMotion: boolean): { kind: 'slide' | 'fade'; ms: number } {
  return reduceMotion ? { kind: 'fade', ms: DECK_MOTION.fadeMs } : { kind: 'slide', ms: DECK_MOTION.slideMs };
}

/** With Reduce Motion the card doesn't track the drag; a committed swipe cross-fades. */
export const followsFinger = (reduceMotion: boolean): boolean => !reduceMotion;

export const deckTag = (n: number, total: number): string => t('closet.confirm.count', { n, total });
export const deckA11y = (n: number, total: number): string => t('closet.confirm.a11y.question', { n, total });

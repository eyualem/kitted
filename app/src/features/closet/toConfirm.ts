// The Closet's "To confirm" card (#111, #117; 09-ui-review §7 C2): at most 3 open "Same as your …?" questions at a
// time, newest first, so the questions never bury the clothes; answering one brings the next in. The card's count
// stays the number still waiting. Pure.

/** The most questions the card shows at once (#111). */
export const TO_CONFIRM_MAX = 3;

/** The questions the card shows now, and how many are waiting in all. */
export function toConfirm<T>(open: readonly T[]): { shown: T[]; total: number } {
  return { shown: open.slice(0, TO_CONFIRM_MAX), total: open.length };
}

// ---- T74 stubs (specs/closet-beta.md CB2: one card at a time). The tests come before the code; each throws until
// built. The 3-at-a-time `toConfirm` above is what the screen still calls; T74 replaces it with
// `toConfirm(open, fit): DeckCard[]` and drops TO_CONFIRM_MAX.

export type DeckCard<Q, F> = { kind: 'dup'; key: string; q: Q } | { kind: 'fit'; key: string; fit: F };
export interface DeckState { key: string | null; undoKey: string | null }
export type DeckMove = 'none' | 'forward' | 'back' | 'appear' | 'empty';

const notBuilt = (...args: unknown[]): never => {
  void args;
  throw new Error('T74: not built');
};

export function dupKey(obsId: string): string { return notBuilt(obsId); }
export function fitKey(itemId: string): string { return notBuilt(itemId); }
export function showsSkip(cards: readonly { kind: 'dup' | 'fit' }[]): boolean { return notBuilt(cards); }
export function deckCount(keys: readonly string[], key: string): { n: number; total: number } { return notBuilt(keys, key); }
export function stepDeck(keys: readonly string[], key: string, dir: 1 | -1): string { return notBuilt(keys, key, dir); }
export function startDeck(keys: readonly string[]): DeckState { return notBuilt(keys); }
export function markAnswered(state: DeckState, key: string): DeckState { return notBuilt(state, key); }
export function reconcileDeck(prev: DeckState, prevKeys: readonly string[], keys: readonly string[]): { state: DeckState; move: DeckMove } {
  return notBuilt(prev, prevKeys, keys);
}
export function swipeStart(dx: number, dy: number): 'claim' | 'fail' | 'wait' { return notBuilt(dx, dy); }
export function swipeStep(dx: number, vx: number, width: number, count: number): -1 | 0 | 1 { return notBuilt(dx, vx, width, count); }
export function cardMotion(reduceMotion: boolean): { kind: 'slide' | 'fade'; ms: number } { return notBuilt(reduceMotion); }
export function followsFinger(reduceMotion: boolean): boolean { return notBuilt(reduceMotion); }
export function deckTag(n: number, total: number): string { return notBuilt(n, total); }
export function deckA11y(n: number, total: number): string { return notBuilt(n, total); }
/** Not built: placeholders until T74 sets them. */
export const DECK_MOTION = {} as { slideMs: number; fadeMs: number; springMs: number; gap: number };
export const SWIPE = {} as { startX: number; failY: number; commit: number; flick: number };

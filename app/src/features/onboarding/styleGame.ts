// T113 · The style game's rules (specs/style-game.md SG1–SG9), pure: no store, no React. The deal, the answers, the
// ranking by binary insertion, the results' changes and the card's gesture rules.
//
// The deal is an exact port of the mockup's (tasks/style-quiz/src/logic.js, the fail-safe version, #486/#507): the
// cards come in a fresh order each game (mulberry32 seeded, Fisher–Yates repeated until no look-alikes touch, counting
// the last card as next to the first), so every look is equally likely at every position; then a coin decides which
// side the first this-or-that puts the newcomer on, and the sides alternate from there. Same seed, same game: Back and a
// return from Welcome keep the order.
import type { StyleKey } from '@/data/types';
import type { StringKey } from '@/i18n/en';
import { cleanOtherWords } from './looks';

/** The 8 looks, in the order the deal shuffles from (the mockup's ORDER; LOOKS' order). */
export const GAME_LOOKS: readonly StyleKey[] = ['streetwear', 'minimalist', 'smart_casual', 'classic_prep', 'tailored', 'workwear', 'outdoor', 'vintage_sport'];
export const CARD_COUNT = 8;

/** Never side by side in a deal, counting the last card as next to the first (SG1). */
export const LOOK_ALIKES: readonly (readonly [StyleKey, StyleKey])[] = [
  ['classic_prep', 'tailored'], ['minimalist', 'smart_casual'], ['workwear', 'outdoor'], ['streetwear', 'vintage_sport'], ['smart_casual', 'classic_prep'],
];

export function areAlike(a: StyleKey, b: StyleKey): boolean {
  return LOOK_ALIKES.some(([p, q]) => (p === a && q === b) || (p === b && q === a));
}

/** The mockup's rng32 (mulberry32): same seed, same numbers. */
export function seededRandom(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A new game's seed, 1 … 0x7FFFFFFE. Called on a press or a mount, never in render. */
export function newSeed(random: () => number = Math.random): number {
  return 1 + Math.floor(random() * 0x7ffffffe);
}

export interface Deal {
  order: readonly StyleKey[];
  /** 1: the first this-or-that puts the newcomer on the right. */
  flip: 0 | 1;
}

const deals = new Map<number, Deal>();

/** The mockup's dGameFor, exactly. Memoized by seed. */
export function dealFor(seed: number): Deal {
  const hit = deals.get(seed);
  if (hit) return hit;
  const r = seededRandom(seed);
  const o = GAME_LOOKS.slice();
  const touching = () => o.some((x, i) => areAlike(x, o[(i + 1) % o.length]!));
  do {
    for (let i = o.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [o[i], o[j]] = [o[j]!, o[i]!];
    }
  } while (touching());
  const deal: Deal = { order: o, flip: r() < 0.5 ? 1 : 0 };
  deals.set(seed, deal);
  return deal;
}

export interface Answer { look: StyleKey; me: boolean }
export interface Round { pair: readonly [StyleKey, StyleKey]; win: StyleKey }
export interface Game { seed: number; answers: readonly Answer[]; rounds: readonly Round[] }

export function newGame(seed: number): Game {
  return { seed, answers: [], rounds: [] };
}

/** The look on the card he's on; null once all 8 are answered. */
export function currentCard(g: Game): StyleKey | null {
  return g.answers.length < CARD_COUNT ? dealFor(g.seed).order[g.answers.length]! : null;
}

/** Me or Not me for the current card. Unchanged once all 8 are answered. */
export function answerCard(g: Game, me: boolean): Game {
  const look = currentCard(g);
  if (look === null) return g;
  return { ...g, answers: [...g.answers, { look, me }] };
}

export function mesOf(g: Game): StyleKey[] {
  return g.answers.filter((a) => a.me).map((a) => a.look);
}

export function notMesOf(g: Game): StyleKey[] {
  return g.answers.filter((a) => !a.me).map((a) => a.look);
}

export type RankStep = { done: true; top: StyleKey[] } | { done: false; pair: readonly [StyleKey, StyleKey] };

/** The mockup's ranker, replayed from g.rounds: each Me (in card order) is placed into a top 3 by binary insertion. Round
 *  i asks [newcomer, other] when (i + flip) is even, else [other, newcomer]. */
export function rankStep(g: Game): RankStep {
  const { flip } = dealFor(g.seed);
  const top: StyleKey[] = [];
  let i = 0;
  for (const c of mesOf(g)) {
    let lo = 0;
    let hi = top.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      const other = top[mid]!;
      if (i >= g.rounds.length) return { done: false, pair: (i + flip) % 2 ? [other, c] : [c, other] };
      const beats = g.rounds[i]!.win === c;
      i++;
      if (beats) hi = mid;
      else lo = mid + 1;
    }
    top.splice(lo, 0, c);
    top.length = Math.min(top.length, MAX_LOOKS);
  }
  return { done: true, top };
}

/** The tap on the current pair. Throws when `win` isn't in it or the ranking is done. */
export function pickRound(g: Game, win: StyleKey): Game {
  const s = rankStep(g);
  if (s.done) throw new Error('pickRound: the ranking is done');
  if (s.pair[0] !== win && s.pair[1] !== win) throw new Error(`pickRound: ${win} is not in the pair`);
  return { ...g, rounds: [...g.rounds, { pair: s.pair, win }] };
}

export type Stage = 'cards' | 'ranking' | 'results';

export function stageOf(g: Game): Stage {
  if (g.answers.length < CARD_COUNT) return 'cards';
  return rankStep(g).done ? 'results' : 'ranking';
}

// ── Here's your style ──────────────────────────────────────────────────────────────────────────────────────────────
export const MAX_LOOKS = 3;

export function moveLook(picks: readonly StyleKey[], from: number, to: number): StyleKey[] {
  const out = picks.slice();
  const n = out.length;
  if (from === to || from < 0 || to < 0 || from >= n || to >= n) return out;
  const [x] = out.splice(from, 1);
  out.splice(to, 0, x!);
  return out;
}

export function removeLook(picks: readonly StyleKey[], i: number): { picks: StyleKey[]; removed: StyleKey | null } {
  if (i < 0 || i >= picks.length) return { picks: picks.slice(), removed: null };
  const out = picks.slice();
  const [removed] = out.splice(i, 1);
  return { picks: out, removed: removed! };
}

/** SG4 / FS2: a new look goes last; on a full list it takes #3's place (`replaced` is the old #3). One already on the
 *  list changes nothing. */
export function addLook(picks: readonly StyleKey[], s: StyleKey): { picks: StyleKey[]; replaced: StyleKey | null } {
  const out = picks.slice();
  if (out.includes(s)) return { picks: out, replaced: null };
  const replaced = out.length >= MAX_LOOKS ? out.splice(MAX_LOOKS - 1)[0]! : null;
  out.push(s);
  return { picks: out, replaced };
}

/** The Add a look sheet's looks: the ones not on his list, in GAME_LOOKS order. */
export function lookChoices(picks: readonly StyleKey[]): StyleKey[] {
  return GAME_LOOKS.filter((s) => !picks.includes(s));
}

/** Where a dragged row lands: how many other rows have their middle above the dragged row's middle. */
export function dragTarget(from: number, draggedMidY: number, rowMidYs: readonly number[]): number {
  return rowMidYs.filter((m, i) => i !== from && m < draggedMidY).length;
}

export type ResultsHead = 'top' | 'one' | 'empty' | 'none';

/** 'none': Not me to all 8 and nothing on his list (SG6); 'top' 2+ looks; 'one' 1 look; 'empty' he removed them all. */
export function resultsHead(picks: readonly StyleKey[], mes: readonly StyleKey[]): ResultsHead {
  if (picks.length >= 2) return 'top';
  if (picks.length === 1) return 'one';
  return mes.length ? 'empty' : 'none';
}

/** SG3.2 / #449: a look, or his words. */
export function canContinue(picks: readonly StyleKey[], words: string): boolean {
  return picks.length > 0 || cleanOtherWords(words) !== null;
}

/** SG8: the Not me's to keep, minus any look on his final list, in GAME_LOOKS order. */
export function notMesToSave(notMes: readonly StyleKey[], picks: readonly StyleKey[]): StyleKey[] {
  return GAME_LOOKS.filter((s) => notMes.includes(s) && !picks.includes(s));
}

export function notMeToSave(g: Game, picks: readonly StyleKey[]): StyleKey[] {
  return notMesToSave(notMesOf(g), picks);
}

// ── The card's gesture (SG1, FS1) ──────────────────────────────────────────────────────────────────────────────────
/** pt: a press that moves less, in any direction, is a tap (the other outfit). */
export const TAP_SLOP = 6;
/** pt: past it, a swipe answers. */
export const SWIPE_LINE = 90;

export function cardRelease(dx: number, dy: number): 'peek' | 'me' | 'notMe' | 'spring' {
  if (Math.hypot(dx, dy) < TAP_SLOP) return 'peek';
  if (dx > SWIPE_LINE) return 'me';
  if (dx < -SWIPE_LINE) return 'notMe';
  return 'spring';
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** While dragging: the stamps' opacities and which button is lit. */
export function swipeFeedback(dx: number): { me: number; notMe: number; lit: 'me' | 'notMe' | null } {
  return {
    me: clamp01(dx / SWIPE_LINE),
    notMe: clamp01(-dx / SWIPE_LINE),
    lit: dx > SWIPE_LINE ? 'me' : dx < -SWIPE_LINE ? 'notMe' : null,
  };
}

/** The card gives the touch to the scroll view once it moved 10 pt up or down before 12 pt sideways (ConfirmDeck's). */
export function cardYields(dx: number, dy: number): boolean {
  return Math.abs(dy) >= 10 && Math.abs(dx) < 12;
}

/** SG1.3: card 1 of a game leans once, never under Reduce Motion. */
export function shouldLean(answered: number, leanedThisGame: boolean, reduceMotion: boolean): boolean {
  return answered === 0 && !leanedThisGame && !reduceMotion;
}

/** SG9: an answered card flies off (240 ms) or, under Reduce Motion, fades (150 ms). */
export function cardExit(reduceMotion: boolean): { kind: 'fly' | 'fade'; ms: number } {
  return reduceMotion ? { kind: 'fade', ms: 150 } : { kind: 'fly', ms: 240 };
}

/** VoiceOver's description of a look's drawing. */
export function descKey(look: StyleKey, outfit: 0 | 1): StringKey {
  return `game.desc.${look}.${outfit}` as StringKey;
}

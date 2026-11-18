// T113 · The style game's rules (specs/style-game.md SG1–SG9). STUB written by the test writer: every export is the
// interface in tasks/T113/IMPLEMENTATION.md → Interfaces, and none of it is built. The implementer replaces this file.
import type { StyleKey } from '@/data/types';
import type { StringKey } from '@/i18n/en';

const notBuilt = (): never => {
  throw new Error('T113: not built');
};

/** The 8 looks, in the order the deal shuffles from. Stub: empty until built. */
export const GAME_LOOKS: readonly StyleKey[] = [];
export const CARD_COUNT: number = 0;
export const LOOK_ALIKES: readonly (readonly [StyleKey, StyleKey])[] = [];
export function areAlike(_a: StyleKey, _b: StyleKey): boolean {
  return notBuilt();
}

export function seededRandom(_seed: number): () => number {
  return notBuilt();
}
export function newSeed(_random?: () => number): number {
  return notBuilt();
}

export interface Deal { order: readonly StyleKey[]; flip: 0 | 1 }
export function dealFor(_seed: number): Deal {
  return notBuilt();
}

export interface Answer { look: StyleKey; me: boolean }
export interface Round { pair: readonly [StyleKey, StyleKey]; win: StyleKey }
export interface Game { seed: number; answers: readonly Answer[]; rounds: readonly Round[] }
export function newGame(_seed: number): Game {
  return notBuilt();
}
export function currentCard(_g: Game): StyleKey | null {
  return notBuilt();
}
export function answerCard(_g: Game, _me: boolean): Game {
  return notBuilt();
}
export function mesOf(_g: Game): StyleKey[] {
  return notBuilt();
}
export function notMesOf(_g: Game): StyleKey[] {
  return notBuilt();
}

export type RankStep = { done: true; top: StyleKey[] } | { done: false; pair: readonly [StyleKey, StyleKey] };
export function rankStep(_g: Game): RankStep {
  return notBuilt();
}
export function pickRound(_g: Game, _win: StyleKey): Game {
  return notBuilt();
}
export type Stage = 'cards' | 'ranking' | 'results';
export function stageOf(_g: Game): Stage {
  return notBuilt();
}

export const MAX_LOOKS: number = 0;
export function moveLook(_picks: readonly StyleKey[], _from: number, _to: number): StyleKey[] {
  return notBuilt();
}
export function removeLook(_picks: readonly StyleKey[], _i: number): { picks: StyleKey[]; removed: StyleKey | null } {
  return notBuilt();
}
export function addLook(_picks: readonly StyleKey[], _s: StyleKey): { picks: StyleKey[]; replaced: StyleKey | null } {
  return notBuilt();
}
export function lookChoices(_picks: readonly StyleKey[]): StyleKey[] {
  return notBuilt();
}
export function dragTarget(_from: number, _draggedMidY: number, _rowMidYs: readonly number[]): number {
  return notBuilt();
}

export type ResultsHead = 'top' | 'one' | 'empty' | 'none';
export function resultsHead(_picks: readonly StyleKey[], _mes: readonly StyleKey[]): ResultsHead {
  return notBuilt();
}
export function canContinue(_picks: readonly StyleKey[], _words: string): boolean {
  return notBuilt();
}
export function notMeToSave(_g: Game, _picks: readonly StyleKey[]): StyleKey[] {
  return notBuilt();
}

export const TAP_SLOP: number = 0;
export const SWIPE_LINE: number = 0;
export function cardRelease(_dx: number, _dy: number): 'peek' | 'me' | 'notMe' | 'spring' {
  return notBuilt();
}
export function swipeFeedback(_dx: number): { me: number; notMe: number; lit: 'me' | 'notMe' | null } {
  return notBuilt();
}
export function cardYields(_dx: number, _dy: number): boolean {
  return notBuilt();
}
export function shouldLean(_answered: number, _leanedThisGame: boolean, _reduceMotion: boolean): boolean {
  return notBuilt();
}
export function cardExit(_reduceMotion: boolean): { kind: 'fly' | 'fade'; ms: number } {
  return notBuilt();
}
export function descKey(_look: StyleKey, _outfit: 0 | 1): StringKey {
  return notBuilt();
}

// T113 · The style game's session (specs/style-game.md SG1–SG8). STUB written by the test writer: every export is the
// interface in tasks/T113/IMPLEMENTATION.md → Interfaces, and none of it is built. The implementer replaces this file.
import type { KittedStore } from '@/data/store';
import type { StyleKey } from '@/data/types';
import type { Game, Stage } from './styleGame';

const notBuilt = (): never => {
  throw new Error('T113: not built');
};

export interface ResultsState { picks: StyleKey[]; mes: StyleKey[]; notMes: StyleKey[] }
export interface SessionState {
  game: Game;
  stage: Stage;
  results: ResultsState | null;
  peek: 0 | 1;
  leaned: boolean;
  words: string;
  editingWords: boolean;
  canUndo: boolean;
}
export function getStyleGame(): SessionState | null {
  return notBuilt();
}
export function useStyleGame(): SessionState | null {
  return notBuilt();
}
export function startOrResumeStyleGame(_store: KittedStore, _random?: () => number): Promise<SessionState> {
  return notBuilt();
}
export function answer(_store: KittedStore, _me: boolean): Promise<void> {
  return notBuilt();
}
export function pickInRanking(_store: KittedStore, _win: StyleKey): Promise<void> {
  return notBuilt();
}
export function togglePeek(): void {
  notBuilt();
}
export function markLeaned(): void {
  notBuilt();
}
export function back(_store: KittedStore): Promise<'undone' | 'exit'> {
  return notBuilt();
}
export function moveInResults(_store: KittedStore, _from: number, _to: number): Promise<number | null> {
  return notBuilt();
}
export function removeFromResults(_store: KittedStore, _i: number): Promise<{ token: number; removed: StyleKey } | null> {
  return notBuilt();
}
export function addToResults(_store: KittedStore, _s: StyleKey): Promise<{ token: number; replaced: StyleKey | null } | null> {
  return notBuilt();
}
export function undoChange(_store: KittedStore, _token: number): Promise<boolean> {
  return notBuilt();
}
export function setWords(_text: string): void {
  notBuilt();
}
export function openWords(): void {
  notBuilt();
}
export function saveWords(_store: KittedStore): Promise<void> {
  return notBuilt();
}
export function playAgain(_store: KittedStore, _random?: () => number): Promise<void> {
  return notBuilt();
}
export function continueToAbout(_store: KittedStore): Promise<void> {
  return notBuilt();
}
export function endStyleGame(): void {
  notBuilt();
}

export interface StyleGameDemo {
  seed: number;
  me: readonly StyleKey[];
  cards?: number;
  prefer?: readonly StyleKey[];
  rounds?: number;
  peek?: 0 | 1;
  then?: readonly ({ remove: number } | { add: StyleKey } | { move: [number, number] })[];
  words?: string;
  editingWords?: boolean;
  dragDx?: number;
  toast?: boolean;
}
export function seedStyleGameForDemo(_store: KittedStore, _d: StyleGameDemo): Promise<void> {
  return notBuilt();
}

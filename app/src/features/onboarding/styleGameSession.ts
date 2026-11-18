// T113 · The style game's session (specs/style-game.md SG1–SG8). The game lives in memory for this app session (a module
// value), so Back to Welcome and Get started again resume the same deal and answers (FS Back). A relaunch empties memory:
// mid-game he starts at card 1 with a new deal, and on Here's your style the kv draft (onboarding.styleGame, local)
// brings his list back (SG8). Back undoes exactly one thing: a results change, else the last this-or-that, else the last
// card. His words are never undone by Back; Play again clears Back's history (technical defaults 1 and 2, #492).
import { useSyncExternalStore } from 'react';
import type { KittedStore } from '@/data/store';
import type { StyleKey } from '@/data/types';
import { showToast } from '@/features/toast/toast';
import { styleLabel } from '@/features/morning/copy';
import { t } from '@/i18n/en';
import { cleanOtherWords } from './looks';
import { setResumeStep } from './resume';
import {
  addLook, answerCard, canContinue, currentCard, GAME_LOOKS, MAX_LOOKS, mesOf, moveLook, newGame, newSeed, notMesOf, notMesToSave, pickRound, rankStep, removeLook,
  stageOf, type Game, type Stage,
} from './styleGame';

export interface ResultsState { picks: StyleKey[]; mes: StyleKey[]; notMes: StyleKey[] }
export interface SessionState {
  game: Game;
  stage: Stage;
  /** Shown while stage is 'results' (from the ranking's top, then his changes, or from the draft). */
  results: ResultsState | null;
  /** The outfit on the current card: 0 first, 1 the other (FS1). Not part of Back's history. */
  peek: 0 | 1;
  /** The first card has leaned (or been touched) in this game. */
  leaned: boolean;
  /** His words as typed (the field's text). */
  words: string;
  editingWords: boolean;
  /** Back can undo something here. */
  canUndo: boolean;
}

/** One step Back can return to. `token` names a results change for its toast's Undo. */
interface Snapshot { game: Game; stage: Stage; results: ResultsState | null; peek: 0 | 1; token: number | null }

let state: SessionState | null = null;
let history: Snapshot[] = [];
let starting: Promise<SessionState> | null = null;
let nextToken = 1;
const listeners = new Set<() => void>();

function set(next: SessionState | null) {
  state = next ? { ...next, canUndo: history.length > 0 } : null;
  listeners.forEach((l) => l());
}
function patch(p: Partial<SessionState>) {
  if (state) set({ ...state, ...p });
}

export function getStyleGame(): SessionState | null {
  return state;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useStyleGame(): SessionState | null {
  return useSyncExternalStore(subscribe, getStyleGame, getStyleGame);
}

// ── The draft (kv onboarding.styleGame) ─────────────────────────────────────────────────────────────────────────────
const isLookList = (v: unknown, max: number): v is StyleKey[] =>
  Array.isArray(v) && v.length <= max && new Set(v).size === v.length && v.every((x) => typeof x === 'string' && (GAME_LOOKS as readonly string[]).includes(x));

function parseDraft(raw: string | null): ResultsState | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as { v?: unknown; picks?: unknown; mes?: unknown; notMes?: unknown } | null;
    if (!v || typeof v !== 'object' || Array.isArray(v) || v.v !== 1) return null;
    if (!isLookList(v.picks, MAX_LOOKS) || !isLookList(v.mes, GAME_LOOKS.length) || !isLookList(v.notMes, GAME_LOOKS.length)) return null;
    return { picks: v.picks, mes: v.mes, notMes: v.notMes };
  } catch {
    return null;
  }
}

/** The draft is a convenience for a relaunch: a failed write leaves the game in memory as it is. */
async function writeDraft(store: KittedStore, r: ResultsState): Promise<void> {
  try {
    await store.setKv('onboarding.styleGame', JSON.stringify({ v: 1, picks: r.picks, mes: r.mes, notMes: r.notMes }));
  } catch {
    // Kept in memory; a close before the next change reopens a new game (SG8's mid-game rule).
  }
}
async function deleteDraft(store: KittedStore): Promise<void> {
  try {
    await store.deleteKv('onboarding.styleGame');
  } catch {
    // As writeDraft.
  }
}

function resultsOf(g: Game): ResultsState {
  const s = rankStep(g);
  return { picks: s.done ? s.top : [], mes: mesOf(g), notMes: notMesOf(g) };
}

function freshGame(seed: number, words: string): SessionState {
  return { game: newGame(seed), stage: 'cards', results: null, peek: 0, leaned: false, words, editingWords: false, canUndo: false };
}

// ── Starting ───────────────────────────────────────────────────────────────────────────────────────────────────────
/** Looks' mount: keeps a session already in memory; else his results from a valid draft (no history); else a new game.
 *  His words come from kv onboarding.otherStyle. */
export function startOrResumeStyleGame(store: KittedStore, random?: () => number): Promise<SessionState> {
  if (state) return Promise.resolve(state);
  if (starting) return starting;
  const p = (async () => {
    const words = (await store.getKv('onboarding.otherStyle')) ?? '';
    const draft = parseDraft(await store.getKv('onboarding.styleGame'));
    history = [];
    if (state) return state;
    const base = freshGame(newSeed(random), words);
    set(draft ? { ...base, stage: 'results', results: draft } : base);
    return state!;
  })();
  starting = p;
  const clear = () => {
    if (starting === p) starting = null;
  };
  p.then(clear, clear);
  return p;
}

// ── The cards and the ranking ──────────────────────────────────────────────────────────────────────────────────────
function push(token: number | null = null) {
  if (!state) return;
  history.push({ game: state.game, stage: state.stage, results: state.results, peek: state.peek, token });
}

async function moveOn(store: KittedStore, game: Game) {
  const stage = stageOf(game);
  const results = stage === 'results' ? resultsOf(game) : null;
  patch({ game, stage, results, peek: 0 });
  if (results) await writeDraft(store, results);
}

/** A card's answer (tap or swipe). Ignored outside the cards. */
export async function answer(store: KittedStore, me: boolean): Promise<void> {
  if (!state || state.stage !== 'cards') return;
  push();
  await moveOn(store, answerCard(state.game, me));
}

/** A this-or-that tap. */
export async function pickInRanking(store: KittedStore, win: StyleKey): Promise<void> {
  if (!state || state.stage !== 'ranking') return;
  const game = pickRound(state.game, win);
  push();
  await moveOn(store, game);
}

/** FS1: the card's other outfit. No history entry. */
export function togglePeek(): void {
  if (state && state.stage === 'cards') patch({ peek: state.peek === 0 ? 1 : 0 });
}

export function markLeaned(): void {
  if (state && !state.leaned) patch({ leaned: true });
}

/** Back (the nav's circle): undoes exactly one thing, or says 'exit' when there's nothing to undo. */
export async function back(store: KittedStore): Promise<'undone' | 'exit'> {
  if (!state || history.length === 0) return 'exit';
  const was = state.stage;
  const s = history.pop()!;
  patch({ game: s.game, stage: s.stage, results: s.results, peek: s.peek });
  if (s.stage === 'results' && s.results) await writeDraft(store, s.results);
  else if (was === 'results') await deleteDraft(store);
  return 'undone';
}

// ── Here's your style ──────────────────────────────────────────────────────────────────────────────────────────────
async function change(store: KittedStore, picks: StyleKey[]): Promise<number> {
  const token = nextToken++;
  push(token);
  const results = { ...state!.results!, picks };
  patch({ results });
  await writeDraft(store, results);
  return token;
}

const inResults = () => (state && state.stage === 'results' && state.results ? state.results : null);

export async function moveInResults(store: KittedStore, from: number, to: number): Promise<number | null> {
  const r = inResults();
  if (!r) return null;
  const picks = moveLook(r.picks, from, to);
  if (picks.join() === r.picks.join()) return null;
  return change(store, picks);
}

export async function removeFromResults(store: KittedStore, i: number): Promise<{ token: number; removed: StyleKey } | null> {
  const r = inResults();
  if (!r) return null;
  const out = removeLook(r.picks, i);
  if (out.removed === null) return null;
  return { token: await change(store, out.picks), removed: out.removed };
}

export async function addToResults(store: KittedStore, s: StyleKey): Promise<{ token: number; replaced: StyleKey | null } | null> {
  const r = inResults();
  if (!r || r.picks.includes(s)) return null;
  const out = addLook(r.picks, s);
  return { token: await change(store, out.picks), replaced: out.replaced };
}

/** The toast's Undo: undoes its change only while it is still the last thing in history. */
export async function undoChange(store: KittedStore, token: number): Promise<boolean> {
  const last = history[history.length - 1];
  if (!last || last.token !== token) return false;
  await back(store);
  return true;
}

// ── His words ──────────────────────────────────────────────────────────────────────────────────────────────────────
export function setWords(text: string): void {
  patch({ words: text });
}

export function openWords(): void {
  patch({ editingWords: true });
}

/** Done: saves the trimmed words (or deletes them when blank) and closes the field. A failed write keeps it open. */
export async function saveWords(store: KittedStore): Promise<void> {
  if (!state) return;
  const words = cleanOtherWords(state.words);
  if (words) await store.setKv('onboarding.otherStyle', words);
  else await store.deleteKv('onboarding.otherStyle');
  patch({ words: words ?? '', editingWords: false });
}

/** Play again: a new deal, no history, the draft gone. His words stay. */
export async function playAgain(store: KittedStore, random?: () => number): Promise<void> {
  const words = state?.words ?? '';
  history = [];
  set(freshGame(newSeed(random), words));
  await deleteDraft(store);
}

/** Continue: his looks in order, his words, his Not me's, then the resume step. Throws, writing nothing, when there's no
 *  look and no words. Keeps the draft (Back from About you after a relaunch reopens results). Sends nothing. */
export async function continueToAbout(store: KittedStore): Promise<void> {
  const s = state;
  const r = s && s.stage === 'results' ? s.results : null;
  if (!s || !r || !canContinue(r.picks, s.words)) throw new Error('continueToAbout: no look and no words');
  const words = cleanOtherWords(s.words);
  await store.setKv('onboarding.looks', JSON.stringify(r.picks));
  if (words) await store.setKv('onboarding.otherStyle', words);
  else await store.deleteKv('onboarding.otherStyle');
  await store.setKv('looks.notMe', JSON.stringify(notMesToSave(r.notMes, r.picks)));
  await setResumeStep(store, 'basics');
}

/** finishSetup and tests: forget the game in memory. */
export function endStyleGame(): void {
  history = [];
  starting = null;
  demo = {};
  set(null);
}

// ── Demo screens ───────────────────────────────────────────────────────────────────────────────────────────────────
export interface StyleGameDemo {
  seed: number;
  /** Looks he says Me to; every other card he passes is Not me. `cards` = how many cards are answered (default 8). */
  me: readonly StyleKey[];
  cards?: number;
  /** His order for the this-or-thats (best first). `rounds` = how many are made (default all). */
  prefer?: readonly StyleKey[];
  rounds?: number;
  peek?: 0 | 1;
  /** Results changes after the game, in order. */
  then?: readonly ({ remove: number } | { add: StyleKey } | { move: [number, number] })[];
  words?: string;
  editingWords?: boolean;
  /** Draw the card dragged this far (pt), held, for a screenshot. */
  dragDx?: number;
  /** Show the last change's toast held. */
  toast?: boolean;
}

let demo: { dragDx?: number } = {};

/** Demo screens only: how far the card is drawn dragged. */
export function demoDragDx(): number | undefined {
  return demo.dragDx;
}

/** Demo screens only: sets the session as given (prepareDemoScreen, before the route opens). */
export async function seedStyleGameForDemo(store: KittedStore, d: StyleGameDemo): Promise<void> {
  endStyleGame();
  await store.deleteKv('onboarding.styleGame');
  if (d.words !== undefined && !d.editingWords) await store.setKv('onboarding.otherStyle', d.words);
  await startOrResumeStyleGame(store, () => (d.seed - 1 + 0.5) / 0x7ffffffe);
  for (let i = 0; i < (d.cards ?? 8) && state?.stage === 'cards'; i++) {
    const look = currentCard(state.game);
    await answer(store, look !== null && d.me.includes(look));
  }
  const prefer = d.prefer ?? d.me;
  for (let r = 0; state?.stage === 'ranking' && (d.rounds === undefined || r < d.rounds); r++) {
    const s = rankStep(state.game);
    if (s.done) break;
    const [l, rt] = s.pair;
    await pickInRanking(store, prefer.indexOf(l) < prefer.indexOf(rt) ? l : rt);
  }
  let last: { text: string; token: number } | null = null;
  for (const c of d.then ?? []) {
    if ('remove' in c) {
      const r = await removeFromResults(store, c.remove);
      if (r) last = { text: t('game.results.removed', { name: styleLabel(r.removed) }), token: r.token };
    } else if ('add' in c) {
      const r = await addToResults(store, c.add);
      if (r) last = { text: r.replaced ? t('game.results.swapped', { name: styleLabel(c.add), old: styleLabel(r.replaced) }) : t('game.results.added', { name: styleLabel(c.add) }), token: r.token };
    } else {
      await moveInResults(store, c.move[0], c.move[1]);
    }
  }
  if (d.peek === 1) togglePeek();
  if (d.editingWords) {
    openWords();
    setWords(d.words ?? '');
  }
  demo = { dragDx: d.dragDx };
  if (d.toast && last) {
    const token = last.token;
    showToast(last.text, () => void undoChange(store, token), { demoHeldAtMs: 3_000 });
  }
}


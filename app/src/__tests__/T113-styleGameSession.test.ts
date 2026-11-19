// T113 · The style game's session on the memory store (specs/style-game.md SG1–SG8; tasks/T113/TESTING.md): the game
// in memory for this app session (Back's history, the outfit shown, his words), the results draft in kv, Continue's
// writes, Play again, a close (endStyleGame() with the store kept, as a relaunch empties memory) and the wipe.
//
// Seeds are fixed: every new game gets its seed from the `random` passed in (newSeed: 1 + floor(random() × 0x7FFFFFFE)),
// so `seedRandom(42)` below deals seed 42 (Workwear, Classic prep, Streetwear, Minimal, Tailored, Outdoor, Vintage
// sport, Smart casual; flip 1). Nothing is sent: fetch fails the test when called.
//
// Profile (CLAUDE.md rule 6): no photo and no person. The players are stated likings (for example "prefers Streetwear >
// Vintage sport > Outdoor > Workwear"); the age band in the finishSetup test is the one he'd tap (22–25), never estimated.
//
// These tests name 'tailored' only as a string, so they run before T94 lands.
import { createElement } from 'react';
import { render } from '@testing-library/react-native';
import { createMemoryStore } from '@/data/memoryStore';
import type { KittedStore } from '@/data/store';
import type { ProfileRow, StyleKey } from '@/data/types';
import { finishSetup } from '@/features/onboarding/aboutStep';
import { picksToStyles } from '@/features/onboarding/looks';
import { deleteAllData } from '@/features/privacy/wipe';
import { currentCard, dealFor, newSeed, rankStep, resultsHead, type Game } from '@/features/onboarding/styleGame';
import {
  addToResults, answer, back, continueToAbout, endStyleGame, getStyleGame, moveInResults, openWords, pickInRanking, playAgain, removeFromResults,
  saveWords, setWords, startOrResumeStyleGame, togglePeek, undoChange, type SessionState,
} from '@/features/onboarding/styleGameSession';
import { counterIds } from '@/services/ids';
import { isSyncedKv, kvPolicy } from '@/sync/schema';
import { ThemeProvider } from '@/design-system';
import OnboardingStack from '@/app/onboarding/_layout';

// The design system (for the layout's ThemeProvider) loads Reanimated: its mocks, as closetDeck.test.tsx.
jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
// The onboarding stack's screens, as the layout registers them (Stack and Stack.Screen record their props).
jest.mock('expo-router', () => {
  const Screen = jest.fn(() => null);
  const Stack = Object.assign(jest.fn(({ children }: { children?: unknown }) => children ?? null), { Screen });
  return { Stack, router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) } };
});

const T0 = Date.parse('2026-11-18T09:00:00-05:00');
const S = (s: string) => s as StyleKey;
const SEED42_ORDER = ['workwear', 'classic_prep', 'streetwear', 'minimalist', 'tailored', 'outdoor', 'vintage_sport', 'smart_casual'];
/** The streetwear player: prefers Streetwear > Vintage sport > Outdoor > Workwear and says Me to those four. */
const SV = ['streetwear', 'vintage_sport', 'outdoor', 'workwear'].map(S);
const SVO = ['streetwear', 'vintage_sport', 'outdoor'];

/** A `random` whose first number makes newSeed give exactly `seed`. */
const seedRandom = (seed: number) => () => (seed - 1 + 0.5) / 0x7ffffffe;

let store: KittedStore;
let fetchMock: jest.Mock;
const realFetch = globalThis.fetch;

beforeEach(async () => {
  store = createMemoryStore();
  await store.init();
  fetchMock = jest.fn(() => Promise.reject(new Error('T113 test: the game sends nothing')));
  globalThis.fetch = fetchMock as never;
  endStyleGame();
});
afterEach(() => {
  globalThis.fetch = realFetch;
  expect(fetchMock).toHaveBeenCalledTimes(0);
});

const st = (): SessionState => {
  const s = getStyleGame();
  if (!s) throw new Error('no style game in memory');
  return s;
};
const answers = () => st().game.answers.map((a) => `${a.look} ${a.me ? 'Me' : 'Not me'}`);
const card = () => currentCard(st().game);
const kvJson = async (k: string) => {
  const v = await store.getKv(k);
  return v === null ? null : (JSON.parse(v) as unknown);
};

async function start(seed: number) {
  const s = await startOrResumeStyleGame(store, seedRandom(seed));
  expect(s.game.seed).toBe(seed);
  return s;
}
/** Answers the cards left: Me to `me`, Not me to the rest; `n` cards at most. */
async function cards(me: readonly string[], n = 8) {
  for (let i = 0; i < n && st().stage === 'cards'; i++) await answer(store, me.includes(card()!));
}
/** `n` this-or-thats (all by default), each decided by `prefer` (best first). */
async function rank(prefer: readonly string[], n = Infinity) {
  for (let i = 0; i < n && st().stage === 'ranking'; i++) {
    const s = rankStep(st().game);
    if (s.done) throw new Error('ranking stage with a finished ranking');
    const [l, r] = s.pair;
    await pickInRanking(store, prefer.indexOf(l) < prefer.indexOf(r) ? l : r);
  }
}
/** Seed 42, the streetwear player, ranked to Streetwear, Vintage sport, Outdoor. */
async function toResultsSVO() {
  await start(42);
  await cards(SV);
  await rank(SV);
  expect(st().stage).toBe('results');
  expect(st().results?.picks).toEqual(SVO);
}
const picks = () => st().results?.picks;

// ── SG1.1 · a new seed per game ───────────────────────────────────────────────────────────────────────────────────
describe('SG1.1 · the seed', () => {
  it('SG1.1 · a new game gets a new seed', async () => {
    expect(newSeed(() => 0)).toBe(1);
    expect(newSeed(() => 0.5)).toBe(1_073_741_824);
    const hi = newSeed(() => 0.999999999);
    expect(Number.isInteger(hi)).toBe(true);
    expect(hi).toBeLessThanOrEqual(0x7fffffff);
    expect(hi).toBeGreaterThan(2_000_000_000);

    const a = await startOrResumeStyleGame(store, seedRandom(42));
    expect(a.game).toEqual({ seed: 42, answers: [], rounds: [] });
    expect([a.stage, a.results, a.peek, a.leaned, a.words, a.editingWords, a.canUndo]).toEqual(['cards', null, 0, false, '', false, false]);
    endStyleGame();
    expect(getStyleGame()).toBeNull();
    const b = await startOrResumeStyleGame(store, seedRandom(7));
    expect(b.game.seed).toBe(7);
    expect(b.game.seed).not.toBe(a.game.seed);
    // Play again deals another one, from its own random.
    await playAgain(store, seedRandom(1999));
    expect(st().game.seed).toBe(1999);
  });
});

// ── SG1.2 · Back keeps the deal ───────────────────────────────────────────────────────────────────────────────────
describe('SG1.2 · Back', () => {
  it('SG1.2 · Back undoes one card and keeps the deal', async () => {
    await start(42);
    await answer(store, true);
    await answer(store, false);
    await answer(store, true);
    expect(answers()).toEqual(['workwear Me', 'classic_prep Not me', 'streetwear Me']);
    expect(st().canUndo).toBe(true);
    expect(await back(store)).toBe('undone');
    expect(st().game.answers).toHaveLength(2);
    expect(st().game.seed).toBe(42);
    expect([...dealFor(st().game.seed).order]).toEqual(SEED42_ORDER);
    expect(card()).toBe(SEED42_ORDER[2]);
    expect(st().stage).toBe('cards');
  });
});

// ── SG3.1 · Back and the toast's Undo on results ──────────────────────────────────────────────────────────────────
describe('SG3.1 · results changes', () => {
  it('SG3.1 · Back undoes each results change, then the last this-or-that', async () => {
    await toResultsSVO();
    expect(st().game.rounds).toHaveLength(5);
    expect(await kvJson('onboarding.styleGame')).toMatchObject({ v: 1, picks: SVO });

    expect(await moveInResults(store, 0, 2)).toEqual(expect.any(Number));
    expect(picks()).toEqual(['vintage_sport', 'outdoor', 'streetwear']);
    expect(await kvJson('onboarding.styleGame')).toMatchObject({ v: 1, picks: ['vintage_sport', 'outdoor', 'streetwear'] });
    const rem = await removeFromResults(store, 0);
    expect(rem).toEqual({ token: expect.any(Number), removed: 'vintage_sport' });
    expect(picks()).toEqual(['outdoor', 'streetwear']);
    expect(await kvJson('onboarding.styleGame')).toMatchObject({ picks: ['outdoor', 'streetwear'] });

    expect(await back(store)).toBe('undone');
    expect(picks()).toEqual(['vintage_sport', 'outdoor', 'streetwear']);
    expect(await kvJson('onboarding.styleGame')).toMatchObject({ picks: ['vintage_sport', 'outdoor', 'streetwear'] });
    expect(await back(store)).toBe('undone');
    expect(picks()).toEqual(SVO);
    expect(st().stage).toBe('results');
    expect(await back(store)).toBe('undone');
    expect(st().stage).toBe('ranking');
    expect(st().game.rounds).toHaveLength(4);
    expect(st().game.answers).toHaveLength(8);
    expect(await store.getKv('onboarding.styleGame')).toBeNull();
  });

  it('SG3.1 · the toast\'s Undo undoes only its own change', async () => {
    await toResultsSVO();
    const r1 = await removeFromResults(store, 1);
    expect(r1).toEqual({ token: expect.any(Number), removed: 'vintage_sport' });
    expect(picks()).toEqual(['streetwear', 'outdoor']);
    expect(await undoChange(store, r1!.token)).toBe(true);
    expect(picks()).toEqual(SVO);
    expect(await kvJson('onboarding.styleGame')).toMatchObject({ picks: SVO });
    // Spent: a second Undo of the same toast does nothing.
    expect(await undoChange(store, r1!.token)).toBe(false);
    expect(picks()).toEqual(SVO);

    // A later change makes an older toast's Undo stale.
    const r2 = await removeFromResults(store, 0);
    expect(picks()).toEqual(['vintage_sport', 'outdoor']);
    const m = await moveInResults(store, 0, 1);
    expect(m).toEqual(expect.any(Number));
    expect(picks()).toEqual(['outdoor', 'vintage_sport']);
    expect(await undoChange(store, r2!.token)).toBe(false);
    expect(picks()).toEqual(['outdoor', 'vintage_sport']);
    expect(await kvJson('onboarding.styleGame')).toMatchObject({ picks: ['outdoor', 'vintage_sport'] });
    // The newest change's own token still works.
    expect(await undoChange(store, m!)).toBe(true);
    expect(picks()).toEqual(['vintage_sport', 'outdoor']);
  });
});

// ── SG3.2 · Continue ──────────────────────────────────────────────────────────────────────────────────────────────
describe('SG3.2 · Continue', () => {
  it('SG3.2 · Continue writes looks, words, Not me\'s and the step', async () => {
    await store.setKv('onboarding.step', 'looks');
    await toResultsSVO();
    setWords('  skater   but clean ');
    await saveWords(store);
    await continueToAbout(store);
    expect(await store.getKv('onboarding.looks')).toBe('["streetwear","vintage_sport","outdoor"]');
    expect(await store.getKv('onboarding.otherStyle')).toBe('skater but clean');
    expect(await store.getKv('looks.notMe')).toBe('["minimalist","smart_casual","classic_prep","tailored"]');
    expect(await store.getKv('onboarding.step')).toBe('basics');
    // The draft stays (Back from About you after a relaunch reopens results).
    expect(await kvJson('onboarding.styleGame')).toMatchObject({ v: 1, picks: SVO });

    // Then About you (22–25) finishes setup.
    await store.setKv('onboarding.about', JSON.stringify({ age: '22-25', name: '' }));
    await finishSetup(store, T0, counterIds());
    const p = (await store.profile.get('me')) as ProfileRow | null;
    expect(p?.styles).toEqual(picksToStyles(SVO.map(S)));
    expect(p?.styles).toEqual([['streetwear', 0.5], ['vintage_sport', 0.25], ['outdoor', 0.25]]);
    expect(await store.getKv('onboarding.styleGame')).toBeNull();
    expect(await store.getKv('looks.notMe')).toBe('["minimalist","smart_casual","classic_prep","tailored"]');
    expect(await store.getKv('onboarding.otherStyle')).toBe('skater but clean');
    expect(getStyleGame()).toBeNull();
  });

  it('SG3.2 · Continue with no words deletes his old words', async () => {
    await toResultsSVO();
    // Words saved earlier, then cleared in the field without Done: Continue reads the field.
    setWords('all black');
    await saveWords(store);
    expect(await store.getKv('onboarding.otherStyle')).toBe('all black');
    setWords('');
    await continueToAbout(store);
    expect(await store.getKv('onboarding.otherStyle')).toBeNull();
    expect(await store.getKv('onboarding.looks')).toBe('["streetwear","vintage_sport","outdoor"]');
  });

  it('SG3.2 · Continue saves a look he added back as his, not a Not me', async () => {
    await start(42);
    await cards(['workwear', 'streetwear']);
    await rank(SV);
    expect(picks()).toEqual(['streetwear', 'workwear']);
    expect(await addToResults(store, S('outdoor'))).toEqual({ token: expect.any(Number), replaced: null });
    await continueToAbout(store);
    expect(await store.getKv('onboarding.looks')).toBe('["streetwear","workwear","outdoor"]');
    expect(await store.getKv('looks.notMe')).toBe('["minimalist","smart_casual","classic_prep","tailored","vintage_sport"]');
  });

  it('SG3.2 · Continue with nothing writes nothing', async () => {
    await store.setKv('onboarding.step', 'looks');
    await start(42);
    await cards([]);
    expect(st().stage).toBe('results');
    await expect(continueToAbout(store)).rejects.toThrow();
    expect(await store.getKv('onboarding.looks')).toBeNull();
    expect(await store.getKv('onboarding.otherStyle')).toBeNull();
    expect(await store.getKv('looks.notMe')).toBeNull();
    expect(await store.getKv('onboarding.step')).toBe('looks');
    // Blank words are still nothing.
    setWords('    ');
    await expect(continueToAbout(store)).rejects.toThrow();
    expect(await store.getKv('looks.notMe')).toBeNull();
    expect(await store.getKv('onboarding.step')).toBe('looks');
    // Words alone are enough (#449): looks [] and every card a Not me.
    setWords('all black');
    await continueToAbout(store);
    expect(await store.getKv('onboarding.looks')).toBe('[]');
    expect(await store.getKv('onboarding.otherStyle')).toBe('all black');
    expect(await store.getKv('looks.notMe')).toBe('["streetwear","minimalist","smart_casual","classic_prep","tailored","workwear","outdoor","vintage_sport"]');
    expect(await store.getKv('onboarding.step')).toBe('basics');
  });
});

// ── SG5.1 · his words ─────────────────────────────────────────────────────────────────────────────────────────────
describe('SG5.1 · his words', () => {
  it('SG5.1 · Done saves trimmed words; blank deletes them', async () => {
    await toResultsSVO();
    openWords();
    expect(st().editingWords).toBe(true);
    setWords('x'.repeat(200));
    expect(st().words).toBe('x'.repeat(200)); // the field's text, as typed
    await saveWords(store);
    expect(await store.getKv('onboarding.otherStyle')).toBe('x'.repeat(80));
    expect(st().editingWords).toBe(false);

    openWords();
    setWords('   ');
    await saveWords(store);
    expect(await store.getKv('onboarding.otherStyle')).toBeNull();
    expect(st().editingWords).toBe(false);

    // Back never undoes his words.
    openWords();
    setWords('all black');
    await saveWords(store);
    expect(await back(store)).toBe('undone'); // undoes the last this-or-that, not the words
    expect(st().stage).toBe('ranking');
    expect(st().words).toBe('all black');
    expect(await store.getKv('onboarding.otherStyle')).toBe('all black');
  });

  it('SG5.1 · his words stay through Play again and a relaunch', async () => {
    await toResultsSVO();
    setWords('all black');
    await saveWords(store);
    await playAgain(store, seedRandom(7));
    expect(st().words).toBe('all black');
    expect(st().stage).toBe('cards');
    endStyleGame();
    await startOrResumeStyleGame(store, seedRandom(9));
    expect(st().words).toBe('all black');
  });

  it('SG5.1 · a failed Done keeps the field open with his text', async () => {
    await toResultsSVO();
    openWords();
    setWords('all black');
    const realSet = store.setKv.bind(store);
    store.setKv = jest.fn(() => Promise.reject(new Error('disk full')));
    await expect(saveWords(store)).rejects.toThrow();
    store.setKv = realSet;
    expect(st().editingWords).toBe(true);
    expect(st().words).toBe('all black');
    expect(await store.getKv('onboarding.otherStyle')).toBeNull();
  });
});

// ── SG6.1 · Nothing clicked yet ───────────────────────────────────────────────────────────────────────────────────
describe('SG6.1 · Not me to all 8', () => {
  it('SG6.1 · Not me to all 8 goes straight to results with nothing', async () => {
    await start(42);
    for (let i = 0; i < 7; i++) await answer(store, false);
    expect(st().stage).toBe('cards');
    await answer(store, false);
    expect(st().stage).toBe('results');
    expect(st().game.rounds).toEqual([]);
    expect(st().results).toEqual({ picks: [], mes: [], notMes: SEED42_ORDER });
    expect(resultsHead(st().results!.picks, st().results!.mes)).toBe('none');
    expect(await kvJson('onboarding.styleGame')).toEqual({ v: 1, picks: [], mes: [], notMes: SEED42_ORDER });
    // One Me: no ranking either.
    await playAgain(store, seedRandom(42));
    await cards(['minimalist']);
    expect(st().stage).toBe('results');
    expect(st().game.rounds).toEqual([]);
    expect(picks()).toEqual(['minimalist']);
  });
});

// ── SG7.1 · the other outfit ──────────────────────────────────────────────────────────────────────────────────────
describe('SG7.1 · the other outfit', () => {
  it('SG7.1 · the other outfit is not an answer', async () => {
    await start(42);
    expect(st().peek).toBe(0);
    togglePeek();
    expect(st().peek).toBe(1);
    expect(st().game.answers).toEqual([]);
    expect(st().canUndo).toBe(false);
    // Back right after a peek on card 1: nothing to undo (the peek isn't on Back's history).
    expect(await back(store)).toBe('exit');
    expect(st().peek).toBe(1);
    expect(st().game).toEqual({ seed: 42, answers: [], rounds: [] });
    togglePeek();
    expect(st().peek).toBe(0);
    togglePeek();
    // Answering counts for the look, whichever outfit shows; the next card starts on its first.
    await answer(store, true);
    expect(answers()).toEqual(['workwear Me']);
    expect(card()).toBe('classic_prep');
    expect(st().peek).toBe(0);
    // A card brought back by Back shows the outfit it had when answered.
    expect(await back(store)).toBe('undone');
    expect(card()).toBe('workwear');
    expect(st().peek).toBe(1);
    expect(st().game.answers).toEqual([]);
  });
});

// ── SG7.2 · the swap ──────────────────────────────────────────────────────────────────────────────────────────────
describe('SG7.2 · the full-list swap', () => {
  it('SG7.2 · the swap and its Undo', async () => {
    const OVW = ['outdoor', 'vintage_sport', 'workwear'];
    await start(42);
    await cards(OVW);
    await rank(OVW);
    expect(picks()).toEqual(OVW);
    const r = await addToResults(store, S('streetwear'));
    expect(r).toEqual({ token: expect.any(Number), replaced: 'workwear' });
    expect(picks()).toEqual(['outdoor', 'vintage_sport', 'streetwear']);
    expect(await kvJson('onboarding.styleGame')).toMatchObject({ picks: ['outdoor', 'vintage_sport', 'streetwear'] });
    expect(await undoChange(store, r!.token)).toBe(true);
    expect(picks()).toEqual(OVW);
    // Back instead of Undo: the same three.
    await addToResults(store, S('streetwear'));
    expect(picks()).toEqual(['outdoor', 'vintage_sport', 'streetwear']);
    expect(await back(store)).toBe('undone');
    expect(picks()).toEqual(OVW);
    // A look already on the list changes nothing.
    await addToResults(store, S('outdoor'));
    expect(picks()).toEqual(OVW);
  });
});

// ── SG7.4 · Back, exactly one ─────────────────────────────────────────────────────────────────────────────────────
describe('SG7.4 · Back', () => {
  it('SG7.4 · Back undoes exactly one answer', async () => {
    await start(42);
    await answer(store, true);
    await answer(store, false);
    await answer(store, true);
    expect(card()).toBe('minimalist'); // card 4
    expect(await back(store)).toBe('undone');
    expect(card()).toBe('streetwear');
    expect(answers()).toEqual(['workwear Me', 'classic_prep Not me']);
    expect(await back(store)).toBe('undone');
    expect(card()).toBe('classic_prep');
    expect(answers()).toEqual(['workwear Me']);

    // In the ranking: one this-or-that at a time, then card 8 again.
    endStyleGame();
    await start(42);
    await cards(SV);
    await rank(SV, 2);
    expect(st().stage).toBe('ranking');
    expect(st().game.rounds).toHaveLength(2);
    expect(await back(store)).toBe('undone');
    expect(st().game.rounds).toHaveLength(1);
    expect(await back(store)).toBe('undone');
    expect(st().game.rounds).toHaveLength(0);
    expect(st().stage).toBe('ranking');
    expect(await back(store)).toBe('undone');
    expect(st().stage).toBe('cards');
    expect(st().game.answers).toHaveLength(7);
    expect(card()).toBe('smart_casual');

    // Play again clears Back's history: Back on its card 1 leaves.
    await cards(SV);
    await rank(SV);
    expect(st().stage).toBe('results');
    await playAgain(store, seedRandom(7));
    expect(st().stage).toBe('cards');
    expect(st().game).toEqual({ seed: 7, answers: [], rounds: [] });
    expect(st().canUndo).toBe(false);
    expect(await back(store)).toBe('exit');
    expect(st().game).toEqual({ seed: 7, answers: [], rounds: [] });
    expect(st().results).toBeNull();
    expect(st().leaned).toBe(false);
    expect(await store.getKv('onboarding.styleGame')).toBeNull();
  });

  it('SG7.4 · leaving to Welcome and coming back resumes the same game', async () => {
    await start(42);
    // Card 1, nothing answered: Back leaves and nothing changes.
    expect(await back(store)).toBe('exit');
    expect(st().game).toEqual({ seed: 42, answers: [], rounds: [] });
    // Get started again: the same game, whatever random the new mount brings.
    await startOrResumeStyleGame(store, seedRandom(7));
    expect(st().game).toEqual({ seed: 42, answers: [], rounds: [] });

    await answer(store, true);
    await answer(store, false);
    await answer(store, true);
    const before: Game = st().game;
    await startOrResumeStyleGame(store, seedRandom(9));
    expect(st().game).toEqual(before);
    expect(card()).toBe('minimalist');
    expect(answers()).toEqual(['workwear Me', 'classic_prep Not me', 'streetwear Me']);
    expect(await back(store)).toBe('undone'); // his history came with it
    expect(answers()).toEqual(['workwear Me', 'classic_prep Not me']);
  });
});

// ── SG8.1 · a close, a relaunch and the wipe ──────────────────────────────────────────────────────────────────────
describe('SG8.1 · what a close keeps', () => {
  it('SG8.1 · a close mid-game deals a new game at card 1', async () => {
    await start(42);
    await cards(SV, 3);
    expect(st().game.answers).toHaveLength(3);
    endStyleGame();
    const s = await startOrResumeStyleGame(store, seedRandom(7));
    expect(s.stage).toBe('cards');
    expect(s.game).toEqual({ seed: 7, answers: [], rounds: [] });
    expect(s.canUndo).toBe(false);
    expect(await store.getKv('onboarding.styleGame')).toBeNull();
  });

  it('SG8.1 · a close on results reopens them as left', async () => {
    await toResultsSVO();
    await moveInResults(store, 0, 1);
    expect(picks()).toEqual(['vintage_sport', 'streetwear', 'outdoor']);
    setWords('all black');
    await saveWords(store);
    endStyleGame();
    const s = await startOrResumeStyleGame(store, seedRandom(7));
    expect(s.stage).toBe('results');
    expect(s.results?.picks).toEqual(['vintage_sport', 'streetwear', 'outdoor']);
    expect(s.results?.mes).toEqual(['workwear', 'streetwear', 'outdoor', 'vintage_sport']);
    expect([...(s.results?.notMes ?? [])].sort()).toEqual(['classic_prep', 'minimalist', 'smart_casual', 'tailored']);
    expect(s.words).toBe('all black');
    expect(s.canUndo).toBe(false);
    // Continue from the reopened results saves what he left, Not me's included.
    await continueToAbout(store);
    expect(await store.getKv('onboarding.looks')).toBe('["vintage_sport","streetwear","outdoor"]');
    expect(await store.getKv('looks.notMe')).toBe('["minimalist","smart_casual","classic_prep","tailored"]');
    // A close on About you, then Back: results again, from the draft.
    endStyleGame();
    const again = await startOrResumeStyleGame(store, seedRandom(9));
    expect(again.stage).toBe('results');
    expect(again.results?.picks).toEqual(['vintage_sport', 'streetwear', 'outdoor']);
    // No history after a relaunch: Back goes to Welcome.
    expect(await back(store)).toBe('exit');
    expect(st().results?.picks).toEqual(['vintage_sport', 'streetwear', 'outdoor']);
  });

  it('SG8.1 · a close in the ranking deals a new game', async () => {
    await start(42);
    await cards(SV);
    await rank(SV, 2);
    expect(st().stage).toBe('ranking');
    endStyleGame();
    const s = await startOrResumeStyleGame(store, seedRandom(7));
    expect(s.stage).toBe('cards');
    expect(s.game).toEqual({ seed: 7, answers: [], rounds: [] });
    expect(await store.getKv('onboarding.styleGame')).toBeNull();
  });

  it('SG8.1 · Delete all my data wipes looks.notMe and the draft', async () => {
    await toResultsSVO();
    setWords('all black');
    await saveWords(store);
    await continueToAbout(store);
    expect(await store.getKv('looks.notMe')).not.toBeNull();
    expect(await store.getKv('onboarding.styleGame')).not.toBeNull();
    await deleteAllData({
      store,
      files: { usage: () => ({ photos: 0, bytes: 0 }), lastSent: () => null, deletePhotos: () => {}, deleteLogs: () => {} },
      clearDeviceId: async () => {},
    } as never);
    expect(await store.getKv('looks.notMe')).toBeNull();
    expect(await store.getKv('onboarding.styleGame')).toBeNull();
    expect(await store.getKv('onboarding.otherStyle')).toBeNull();
  });

  it('SG8.1 · looks.notMe syncs like his looks; the draft stays on this phone', () => {
    const notMe = kvPolicy('looks.notMe');
    expect(notMe).not.toBeNull();
    expect(notMe).not.toBe('local');
    expect(isSyncedKv('looks.notMe')).toBe(true);
    expect(kvPolicy('onboarding.styleGame')).toBe('local');
    expect(isSyncedKv('onboarding.styleGame')).toBe(false);
  });

  it('SG8.1 · a bad draft starts a new game', async () => {
    // An unknown version is ignored even when the rest would read (verify round 1, T2).
    for (const raw of ['not json', '{"v":2}', '{"v":2,"picks":["streetwear"],"mes":["streetwear"],"notMes":[]}', '{"v":1,"picks":["capes"]}', '[]', 'null']) {
      endStyleGame();
      await store.setKv('onboarding.styleGame', raw);
      const s = await startOrResumeStyleGame(store, seedRandom(42));
      expect([raw, s.stage, s.game.answers.length, s.results]).toEqual([raw, 'cards', 0, null]);
    }
  });
});

// ── SG7.4 · no edge swipe out of the game ─────────────────────────────────────────────────────────────────────────
describe('SG7.4 · the Looks route', () => {
  it('SG7.4 · the Looks route is registered with the edge swipe off', async () => {
    const r = await render(createElement(ThemeProvider, null, createElement(OnboardingStack)));
    const { Stack } = jest.requireMock('expo-router') as { Stack: jest.Mock & { Screen: jest.Mock } };
    const screens = Stack.Screen.mock.calls.map((c) => c[0] as { name: string; options?: unknown });
    const looks = screens.find((x) => x.name === 'looks');
    expect(looks).toBeDefined();
    const options = (typeof looks!.options === 'function' ? (looks!.options as (a: unknown) => unknown)({ route: { name: 'looks' } }) : looks!.options) as { gestureEnabled?: boolean } | undefined;
    expect(options?.gestureEnabled).toBe(false);
    // Every other step keeps the edge swipe (only Looks turns it off).
    for (const x of screens.filter((y) => y.name === 'welcome' || y.name === 'basics')) {
      const o = (typeof x.options === 'function' ? (x.options as (a: unknown) => unknown)({ route: { name: x.name } }) : x.options) as { gestureEnabled?: boolean } | undefined;
      expect([x.name, o?.gestureEnabled]).not.toEqual([x.name, false]);
    }
    await r.unmount();
  });
});

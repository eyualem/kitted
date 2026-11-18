// Test only, never imported by the app. T113's render-test kit (tasks/T113/TESTING.md "Shared set-up"), used with the
// T39 mocks (import '@/testing/t39ScreenMocks' first in the test file).
//
// - setUpGame: puts a game in memory through the session's own calls (start with a fixed seed, answer, rank, change
//   the results), before or after the screen mounts. It never draws the cards it answers, so a results screen can be
//   set up without rendering every card on the way.
// - playStyleGame: plays the mounted StyleGameScreen through its buttons (Me on the first `me` cards, Not me on the
//   rest, then the ranking's left card while it shows) and returns how many presses it took.
import { act, fireEvent, within } from '@testing-library/react-native';
import type { KittedStore } from '@/data/store';
import type { StyleKey } from '@/data/types';
import { currentCard, rankStep } from '@/features/onboarding/styleGame';
import {
  addToResults, answer, getStyleGame, moveInResults, openWords, pickInRanking, removeFromResults, saveWords, setWords, startOrResumeStyleGame, togglePeek,
} from '@/features/onboarding/styleGameSession';
import { advance, byId, flush, getId, type Node } from './t39ScreenMocks';

/** A `random` whose first number makes newSeed (1 + floor(random() × 0x7FFFFFFE)) give exactly `seed`. */
export const seedRandom = (seed: number) => () => (seed - 1 + 0.5) / 0x7ffffffe;

/** Long enough for an answered card to leave (240 ms) or a this-or-that's pause (260 ms), with room to spare. */
export const SETTLE_MS = 600;

export type ResultsChange = { remove: number } | { add: StyleKey } | { move: [number, number] };
export interface GameSetUp {
  seed: number;
  /** Looks he says Me to; every other card is Not me. */
  me: readonly string[];
  /** How many cards are answered (default 8). */
  cards?: number;
  /** His order for the this-or-thats (best first); default `me`. */
  prefer?: readonly string[];
  /** How many this-or-thats are made (default all). */
  rounds?: number;
  then?: readonly ResultsChange[];
  /** Saved with Done before the game starts (kv onboarding.otherStyle). */
  savedWords?: string;
  peek?: 0 | 1;
}

/** Call with no game in memory (endStyleGame() first). */
export async function setUpGame(store: KittedStore, o: GameSetUp): Promise<void> {
  await act(async () => {
    // A new game: no game in memory (the caller ends it) and no results draft from an earlier set-up.
    await store.deleteKv('onboarding.styleGame');
    if (o.savedWords !== undefined) await store.setKv('onboarding.otherStyle', o.savedWords);
    await startOrResumeStyleGame(store, seedRandom(o.seed));
    const g = getStyleGame();
    if (!g || g.game.seed !== o.seed || g.stage !== 'cards' || g.game.answers.length !== 0) throw new Error(`setUpGame: expected a new game with seed ${o.seed}`);
    const n = o.cards ?? 8;
    for (let i = 0; i < n; i++) {
      const look = currentCard(getStyleGame()!.game);
      if (!look) break;
      await answer(store, o.me.includes(look));
    }
    const prefer = o.prefer ?? o.me;
    for (let r = 0; getStyleGame()!.stage === 'ranking' && (o.rounds === undefined || r < o.rounds); r++) {
      const s = rankStep(getStyleGame()!.game);
      if (s.done) break;
      const [l, rt] = s.pair;
      await pickInRanking(store, prefer.indexOf(l) < prefer.indexOf(rt) ? l : rt);
    }
    for (const c of o.then ?? []) {
      if ('remove' in c) await removeFromResults(store, c.remove);
      else if ('add' in c) await addToResults(store, c.add);
      else await moveInResults(store, c.move[0], c.move[1]);
    }
    if (o.peek === 1) togglePeek();
  });
  await flush();
}

/** Words typed and saved with Done, through the session (as the field does). */
export async function saveWordsNow(store: KittedStore, words: string): Promise<void> {
  await act(async () => {
    openWords();
    setWords(words);
    await saveWords(store);
  });
  await flush();
}

/** The pressable inside a testID'd wrapper (or the element itself when it is the button). */
export function buttonIn(id: string): Node {
  const n = getId(id);
  if (n.props.accessibilityRole === 'button' || typeof n.props.onPress === 'function') return n;
  const inner = within(n as never).queryAllByRole('button') as unknown as Node[];
  if (!inner[0]) throw new Error(`no button inside ${id}`);
  return inner[0];
}

export async function pressId(id: string): Promise<void> {
  await fireEvent.press(buttonIn(id) as never);
  await flush();
}

/** Plays the mounted StyleGameScreen through its buttons: Me on the first `me` cards, Not me on the rest, then the
 *  ranking's left card while it shows. Returns the number of presses. */
export async function playStyleGame(o: { me: number }): Promise<number> {
  let presses = 0;
  for (let i = 0; i < 8; i++) {
    await pressId(i < o.me ? 'game-me' : 'game-notme');
    presses++;
    await advance(SETTLE_MS);
  }
  while (byId('rank-pick-left')) {
    if (presses > 40) throw new Error('playStyleGame: the ranking never ends');
    await fireEvent.press(getId('rank-pick-left') as never);
    await flush();
    presses++;
    await advance(SETTLE_MS);
  }
  return presses;
}

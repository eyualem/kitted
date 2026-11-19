// T113 · The style game's rules, pure (specs/style-game.md SG1–SG9; tasks/T113/TESTING.md). The deal, the answers, the
// ranking by binary insertion, the results operations, the card's gesture rules and the copy keys, called directly:
// no store, no screen, no network.
//
// The deal is an exact port of the mockup's generator (tasks/style-quiz/src/logic.js on claude/style-flow-test-f504ea:
// rng32 = mulberry32, dGameFor = Fisher–Yates repeated until no look-alikes touch, then the flip). The golden deals and
// the first three numbers of seededRandom(7) were computed from that code on Nov 18 and pin the port.
//
// Profile (CLAUDE.md rule 6): no photo and no person. The players are stated likings (for example "prefers Streetwear >
// Vintage sport > Outdoor > Workwear"), never an age or a body.
//
// Needs T94 (Tailored in STYLES and LOOKS): `SG1.1 · GAME_LOOKS is the 8 looks of STYLES, in LOOKS' order` stays red
// until T94's app commit lands. Every other test here names 'tailored' only as a string.
import type { StyleKey } from '@/data/types';
import { STYLES } from '@/data/types';
import { en } from '@/i18n/en';
import { LOOKS } from '@/features/onboarding/looks';
import {
  addLook, answerCard, areAlike, canContinue, CARD_COUNT, cardExit, cardRelease, cardYields, currentCard, dealFor, descKey, dragTarget,
  GAME_LOOKS, LOOK_ALIKES, lookChoices, MAX_LOOKS, mesOf, moveLook, newGame, notMesOf, notMeToSave, pickRound, rankStep, removeLook,
  resultsHead, seededRandom, shouldLean, stageOf, SWIPE_LINE, swipeFeedback, TAP_SLOP, type Game,
} from '@/features/onboarding/styleGame';

const S = (s: string) => s as StyleKey;
const ALL: StyleKey[] = ['streetwear', 'minimalist', 'smart_casual', 'classic_prep', 'tailored', 'workwear', 'outdoor', 'vintage_sport'].map(S);
const PAIRS: [string, string][] = [['classic_prep', 'tailored'], ['minimalist', 'smart_casual'], ['workwear', 'outdoor'], ['streetwear', 'vintage_sport'], ['smart_casual', 'classic_prep']];
/** The streetwear player (SG2.2): prefers Streetwear > Vintage sport > Outdoor > Workwear and says Me to those four. */
const SV_ORDER = ['streetwear', 'vintage_sport', 'outdoor', 'workwear'].map(S);

/** The test's own random numbers (xorshift32), independent of the unit under test. */
function testRandom(seed: number) {
  let x = seed | 0 || 1;
  return () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}
function shuffled<T>(xs: readonly T[], r: () => number): T[] {
  const o = xs.slice();
  for (let i = o.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [o[i], o[j]] = [o[j]!, o[i]!];
  }
  return o;
}

/** Answers the 8 cards (Me to `me`), then decides every this-or-that by `prefer` (best first). Checks each pair as it
 *  goes: two different looks, both his Me's. Returns the finished game, his top and the pairs asked. */
function play(seed: number, me: readonly StyleKey[], prefer: readonly StyleKey[]) {
  const yes = new Set(me);
  let g = newGame(seed);
  for (let i = 0; i < CARD_COUNT; i++) g = answerCard(g, yes.has(currentCard(g)!));
  const pairs: (readonly [StyleKey, StyleKey])[] = [];
  for (;;) {
    const s = rankStep(g);
    if (s.done) return { g, top: s.top, pairs };
    const [l, r] = s.pair;
    if (l === r || !yes.has(l) || !yes.has(r)) throw new Error(`seed ${seed}: a bad pair ${l} / ${r}`);
    pairs.push(s.pair);
    if (pairs.length > 40) throw new Error(`seed ${seed}: the ranking never ends`);
    g = pickRound(g, prefer.indexOf(l) < prefer.indexOf(r) ? l : r);
  }
}
/** The newcomer in a pair is the Me placed later in card order (everything already in the top came before it). */
const newcomerSide = (g: Game, pair: readonly [StyleKey, StyleKey]): 'L' | 'R' => {
  const m = mesOf(g);
  return m.indexOf(pair[0]) > m.indexOf(pair[1]) ? 'L' : 'R';
};
/** -0 and 0 read the same here. */
const z = (o: { me: number; notMe: number; lit: unknown }) => ({ me: o.me + 0, notMe: o.notMe + 0, lit: o.lit });

// ── SG1.1 · the deal ──────────────────────────────────────────────────────────────────────────────────────────────
describe('SG1.1 · the deal', () => {
  it('SG1.1 · the deal is the mockup\'s, exactly (golden seeds)', () => {
    expect(dealFor(1)).toEqual({ order: ['tailored', 'vintage_sport', 'classic_prep', 'outdoor', 'smart_casual', 'workwear', 'minimalist', 'streetwear'], flip: 0 });
    expect(dealFor(42)).toEqual({ order: ['workwear', 'classic_prep', 'streetwear', 'minimalist', 'tailored', 'outdoor', 'vintage_sport', 'smart_casual'], flip: 1 });
    expect(dealFor(7)).toEqual({ order: ['smart_casual', 'streetwear', 'classic_prep', 'minimalist', 'outdoor', 'tailored', 'vintage_sport', 'workwear'], flip: 1 });
    // The generator itself (mulberry32): the same seed gives the same numbers, and these are the mockup's.
    const r = seededRandom(7);
    expect([r(), r(), r()]).toEqual([0.011704753153026104, 0.06195825757458806, 0.97690763277933]);
    const a = seededRandom(123), b = seededRandom(123);
    expect(Array.from({ length: 5 }, a)).toEqual(Array.from({ length: 5 }, b));
    // The same seed, the same deal (Back keeps the order).
    expect(dealFor(42)).toEqual(dealFor(42));
  });

  it('SG1.1 · over seeds 1–2000 every look is first 12.5% ± 1.5%', () => {
    const first = new Map<string, number>(ALL.map((k) => [k, 0]));
    for (let s = 1; s <= 2000; s++) {
      const k = dealFor(s).order[0]!;
      first.set(k, (first.get(k) ?? 0) + 1);
    }
    expect([...first.keys()].sort()).toEqual([...ALL].sort());
    const out = [...first.entries()].filter(([, n]) => n / 2000 < 0.11 || n / 2000 > 0.14).map(([k, n]) => `${k} ${(n / 20).toFixed(2)}%`);
    expect(out).toEqual([]);
  });

  it('SG1.1 · over 80,000 seeds every look is at every position 12.5% ± 0.5', () => {
    const at = new Map<string, number[]>(ALL.map((k) => [k, Array(8).fill(0) as number[]]));
    for (let s = 1; s <= 80_000; s++) {
      const o = dealFor(s).order; // every seed returns (the generator never loops forever)
      for (let i = 0; i < 8; i++) {
        const row = at.get(o[i]!);
        if (!row) throw new Error(`seed ${s}: unknown look ${o[i]}`);
        row[i]! += 1;
      }
    }
    const out: string[] = [];
    for (const [k, row] of at) row.forEach((n, i) => {
      if (n / 80_000 < 0.12 || n / 80_000 > 0.13) out.push(`${k} at ${i}: ${(n / 800).toFixed(2)}%`);
    });
    expect(out).toEqual([]);
  });

  it('SG1.1 · no deal puts look-alikes side by side, last and first included', () => {
    expect(LOOK_ALIKES.map((p) => [...p])).toEqual(PAIRS);
    for (const [a, b] of PAIRS) {
      expect([a, b, areAlike(S(a), S(b)), areAlike(S(b), S(a))]).toEqual([a, b, true, true]);
    }
    // Not alike: every other pair of looks (and a look with itself isn't a pair).
    const alikeCount = ALL.flatMap((a) => ALL.filter((b) => b !== a && areAlike(a, b)).map((b) => `${a}-${b}`));
    expect(alikeCount).toHaveLength(PAIRS.length * 2);
    expect(areAlike(S('streetwear'), S('outdoor'))).toBe(false);
    expect(areAlike(S('tailored'), S('smart_casual'))).toBe(false);

    const orders = new Set<string>();
    const bad: string[] = [];
    for (let s = 1; s <= 2000; s++) {
      const o = dealFor(s).order;
      orders.add(o.join(','));
      for (let i = 0; i < 8; i++) {
        const a = o[i]!, b = o[(i + 1) % 8]!;
        if (PAIRS.some(([p, q]) => (p === a && q === b) || (p === b && q === a))) bad.push(`seed ${s}: ${a} beside ${b}`);
      }
    }
    expect(bad).toEqual([]);
    // A fresh order each game: more than 1,000 different orders, and never the starting order (Smart casual beside
    // Classic prep).
    expect(orders.size).toBeGreaterThan(1000);
    expect(orders.has(ALL.join(','))).toBe(false);
  });

  it('SG1.1 · each deal is the 8 looks once', () => {
    expect(CARD_COUNT).toBe(8);
    expect([...GAME_LOOKS]).toEqual(ALL);
    const bad: number[] = [];
    for (let s = 1; s <= 2000; s++) {
      const o = dealFor(s).order;
      if (o.length !== 8 || [...o].sort().join() !== [...ALL].sort().join()) bad.push(s);
    }
    expect(bad).toEqual([]);
    for (const s of [1, 42, 7, 2000]) expect([0, 1]).toContain(dealFor(s).flip);
  });

  it('SG1.1 · GAME_LOOKS is the 8 looks of STYLES, in LOOKS\' order (needs T94)', () => {
    expect(GAME_LOOKS).toHaveLength(8);
    expect([...STYLES].sort()).toEqual([...GAME_LOOKS].sort());
    expect(LOOKS.map((l) => l.style)).toEqual([...GAME_LOOKS]);
  });
});

// ── SG1.2 · answering ─────────────────────────────────────────────────────────────────────────────────────────────
describe('SG1.2 · answering', () => {
  it('SG1.2 · answerCard records the current look, in order', () => {
    const g0 = newGame(42);
    expect(g0).toEqual({ seed: 42, answers: [], rounds: [] });
    expect(currentCard(g0)).toBe('workwear');
    const g1 = answerCard(g0, true);
    expect(g1.answers).toEqual([{ look: 'workwear', me: true }]);
    expect(g0.answers).toEqual([]); // pure: the old game is untouched
    expect(currentCard(g1)).toBe('classic_prep');
    const g2 = answerCard(g1, false);
    expect(g2.answers).toEqual([{ look: 'workwear', me: true }, { look: 'classic_prep', me: false }]);
    let g = g2;
    for (const me of [true, false, false, true, true, false]) g = answerCard(g, me);
    expect(g.answers.map((a) => a.look)).toEqual(['workwear', 'classic_prep', 'streetwear', 'minimalist', 'tailored', 'outdoor', 'vintage_sport', 'smart_casual']);
    expect(currentCard(g)).toBeNull();
    expect(mesOf(g)).toEqual(['workwear', 'streetwear', 'outdoor', 'vintage_sport']);
    expect(notMesOf(g)).toEqual(['classic_prep', 'minimalist', 'tailored', 'smart_casual']);
    // A 9th answer changes nothing.
    expect(answerCard(g, true)).toEqual(g);
    expect(answerCard(g, false).answers).toHaveLength(8);
    expect(g.seed).toBe(42);
    expect(g.rounds).toEqual([]);
  });

  it('SG1.2 · the release rule: 6 pt tap, 90 pt swipe, spring between', () => {
    expect([TAP_SLOP, SWIPE_LINE]).toEqual([6, 90]);
    expect(cardRelease(0, 0)).toBe('peek');
    expect(cardRelease(5, 3)).toBe('peek'); // hypot 5.8
    expect(cardRelease(-5, -3)).toBe('peek');
    expect(cardRelease(5, 4)).toBe('spring'); // hypot 6.4: not a tap (any direction counts)
    expect(cardRelease(0, 6)).toBe('spring');
    expect(cardRelease(40, 0)).toBe('spring');
    expect(cardRelease(90, 0)).toBe('spring');
    expect(cardRelease(-90, 0)).toBe('spring');
    expect(cardRelease(91, 0)).toBe('me');
    expect(cardRelease(-91, 0)).toBe('notMe');
    expect(cardRelease(120, 30)).toBe('me');
  });

  it('SG1.2 · swipe feedback: stamps and the lit button', () => {
    expect(z(swipeFeedback(0))).toEqual({ me: 0, notMe: 0, lit: null });
    expect(z(swipeFeedback(45))).toEqual({ me: 0.5, notMe: 0, lit: null });
    expect(z(swipeFeedback(-45))).toEqual({ me: 0, notMe: 0.5, lit: null });
    expect(z(swipeFeedback(90))).toEqual({ me: 1, notMe: 0, lit: null });
    expect(z(swipeFeedback(120))).toEqual({ me: 1, notMe: 0, lit: 'me' });
    expect(z(swipeFeedback(-100))).toEqual({ me: 0, notMe: 1, lit: 'notMe' });
  });

  it('SG1.2 · a swipe that starts vertical gives the touch to the scroll view', () => {
    expect(cardYields(0, 10)).toBe(true);
    expect(cardYields(0, -10)).toBe(true);
    expect(cardYields(0, 9)).toBe(false);
    expect(cardYields(12, 0)).toBe(false);
  });
});

// ── SG1.3 · the lean ──────────────────────────────────────────────────────────────────────────────────────────────
describe('SG1.3 · the lean', () => {
  it('SG1.3 · the lean rule', () => {
    expect(shouldLean(0, false, false)).toBe(true);
    expect(shouldLean(0, true, false)).toBe(false);
    expect(shouldLean(0, false, true)).toBe(false);
    expect(shouldLean(1, false, false)).toBe(false);
    expect(shouldLean(7, false, false)).toBe(false);
  });
});

// ── SG2.1 · the ranking's stage and sides ─────────────────────────────────────────────────────────────────────────
describe('SG2.1 · the ranking', () => {
  it('SG2.1 · the stage after card 8 by the number of Me\'s', () => {
    // 0 Me: straight to results (SG6), nothing to rank.
    let g = newGame(42);
    for (let i = 0; i < 7; i++) g = answerCard(g, false);
    expect(stageOf(g)).toBe('cards');
    g = answerCard(g, false);
    expect(stageOf(g)).toBe('results');
    expect(rankStep(g)).toEqual({ done: true, top: [] });

    // 1 Me (Minimal): results with that look, no round.
    const one = play(42, [S('minimalist')], []);
    expect(stageOf(one.g)).toBe('results');
    expect(one.top).toEqual(['minimalist']);
    expect(one.pairs).toEqual([]);

    // 2 Me's: the ranking, one round.
    let two = newGame(42);
    for (let i = 0; i < 8; i++) two = answerCard(two, ['workwear', 'tailored'].includes(currentCard(two)!));
    expect(stageOf(two)).toBe('ranking');
    expect(rankStep(two)).toEqual({ done: false, pair: ['workwear', 'tailored'] });
    two = pickRound(two, S('tailored'));
    expect(stageOf(two)).toBe('results');
    expect(rankStep(two)).toEqual({ done: true, top: ['tailored', 'workwear'] });

    // Before card 8 the stage is still the cards, whatever was answered.
    let early = newGame(42);
    for (let i = 0; i < 3; i++) early = answerCard(early, true);
    expect(stageOf(early)).toBe('cards');
  });

  it('SG2.1 · the first side is random across seeds and the sides alternate', () => {
    // Seed 42 (flip 1): the newcomer Streetwear on the right.
    let g = newGame(42);
    for (let i = 0; i < 8; i++) g = answerCard(g, SV_ORDER.includes(currentCard(g)!));
    expect(rankStep(g)).toEqual({ done: false, pair: ['workwear', 'streetwear'] });

    let leftFirst = 0;
    const notAlternating: string[] = [];
    for (let s = 1; s <= 2000; s++) {
      const r = play(s, SV_ORDER, SV_ORDER);
      const sides = r.pairs.map((p) => newcomerSide(r.g, p));
      if (sides[0] === 'L') leftFirst++;
      for (let i = 1; i < sides.length; i++) if (sides[i] === sides[i - 1]) notAlternating.push(`seed ${s}: ${sides.join('')}`);
    }
    expect(notAlternating).toEqual([]);
    expect(leftFirst / 2000).toBeGreaterThanOrEqual(0.47);
    expect(leftFirst / 2000).toBeLessThanOrEqual(0.53);
  });
});

// ── SG2.2 · binary insertion ──────────────────────────────────────────────────────────────────────────────────────
describe('SG2.2 · binary insertion', () => {
  it('SG2.2 · the streetwear player gets Streetwear, Vintage sport, Outdoor on every deal', () => {
    const wrong: string[] = [];
    for (let s = 1; s <= 2000; s++) {
      const r = play(s, SV_ORDER, SV_ORDER);
      if (r.top.join() !== 'streetwear,vintage_sport,outdoor' || r.pairs.length > 5) wrong.push(`seed ${s}: ${r.top.join()} in ${r.pairs.length}`);
    }
    expect(wrong).toEqual([]);
  });

  it('SG2.2 · at most 2 taps per Me after the first', () => {
    const over: string[] = [];
    const wrong: string[] = [];
    const most = Array(9).fill(0) as number[];
    for (let k = 1; k <= 8; k++) {
      for (let s = 1; s <= 2000; s++) {
        const r = testRandom(s * 31 + k);
        const me = shuffled(ALL, r).slice(0, k);
        // Two consistent players: one who likes the looks in GAME_LOOKS order, one with his own shuffled order.
        for (const prefer of [ALL, shuffled(ALL, r)]) {
          const res = play(s, me, prefer);
          const bound = Math.max(0, 2 * k - 3);
          most[k] = Math.max(most[k]!, res.pairs.length);
          if (res.pairs.length > bound) over.push(`k ${k} seed ${s}: ${res.pairs.length} > ${bound}`);
          const truth = prefer.filter((x) => me.includes(x)).slice(0, 3);
          if (res.top.join() !== truth.join()) wrong.push(`k ${k} seed ${s}: ${res.top.join()} not ${truth.join()}`);
        }
      }
    }
    expect(over.slice(0, 5)).toEqual([]);
    expect(wrong.slice(0, 5)).toEqual([]);
    // The bounds 0, 1, 3, 5, 7, 9, 11, 13: Me to all 8 never more than 13, 3 Me's never more than 3.
    expect(most[1]).toBe(0);
    expect(most[2]).toBe(1);
    expect(most[3]).toBeLessThanOrEqual(3);
    expect(most[8]).toBeLessThanOrEqual(13);
  });

  it('SG2.2 · a consistent player always gets his true top 3', () => {
    const wrong: string[] = [];
    let games = 0;
    for (const a of ALL) for (const b of ALL) for (const c of ALL) {
      if (a === b || b === c || a === c) continue;
      const truth = [a, b, c, ...ALL.filter((x) => x !== a && x !== b && x !== c)];
      for (const n of [3, 4, 5, 6]) {
        const me = truth.slice(0, n);
        for (let s = 1; s <= 100; s++) {
          games++;
          const res = play(s, me, truth);
          if (res.top.length !== 3 || res.top[0] !== a || res.top[1] !== b || res.top[2] !== c) wrong.push(`${a},${b},${c} n ${n} seed ${s}: ${res.top.join()}`);
        }
      }
    }
    expect(games).toBe(336 * 4 * 100);
    expect(wrong.slice(0, 5)).toEqual([]);
  });

  it('SG2.2 · pickRound refuses a look outside the pair and a finished ranking', () => {
    let g = newGame(42);
    for (let i = 0; i < 8; i++) g = answerCard(g, SV_ORDER.includes(currentCard(g)!));
    expect(() => pickRound(g, S('outdoor'))).toThrow(); // the pair is Workwear / Streetwear
    expect(() => pickRound(g, S('minimalist'))).toThrow(); // a Not me
    const done = play(42, SV_ORDER, SV_ORDER).g;
    expect(rankStep(done).done).toBe(true);
    expect(() => pickRound(done, S('streetwear'))).toThrow();
    // Never a Not me in the top, never more than 3.
    const top = (rankStep(done) as { top: StyleKey[] }).top;
    expect(top).toEqual(['streetwear', 'vintage_sport', 'outdoor']);
    expect(done.rounds).toHaveLength(5);
  });
});

// ── SG3 · Here's your style ───────────────────────────────────────────────────────────────────────────────────────
describe('SG3.1 · reorder and remove', () => {
  const abc = ['a', 'b', 'c'].map(S);
  it('SG3.1 · moveLook, removeLook', () => {
    expect(MAX_LOOKS).toBe(3);
    expect(moveLook(abc, 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveLook(abc, 2, 0)).toEqual(['c', 'a', 'b']);
    expect(moveLook(abc, 1, 0)).toEqual(['b', 'a', 'c']);
    expect(moveLook(abc, 1, 1)).toEqual(['a', 'b', 'c']);
    expect(moveLook(abc, 3, 0)).toEqual(['a', 'b', 'c']);
    expect(moveLook(abc, 0, 3)).toEqual(['a', 'b', 'c']);
    expect(moveLook(abc, -1, 0)).toEqual(['a', 'b', 'c']);
    const copy = moveLook(abc, 5, 0);
    expect(copy).not.toBe(abc); // a copy, not the list itself
    expect(abc).toEqual(['a', 'b', 'c']);
    expect(removeLook(abc, 1)).toEqual({ picks: ['a', 'c'], removed: 'b' });
    expect(removeLook(abc, 0)).toEqual({ picks: ['b', 'c'], removed: 'a' });
    expect(removeLook(abc, 3)).toEqual({ picks: ['a', 'b', 'c'], removed: null });
    expect(removeLook([S('a')], 0)).toEqual({ picks: [], removed: 'a' });
    expect(abc).toEqual(['a', 'b', 'c']);
  });

  it('SG3.1 · dragTarget: past a row\'s middle takes its place', () => {
    const mids = [40, 110, 180];
    expect(dragTarget(0, 140, mids)).toBe(1);
    expect(dragTarget(0, 190, mids)).toBe(2);
    expect(dragTarget(0, 100, mids)).toBe(0); // short of row 1's middle: stays
    expect(dragTarget(2, 100, mids)).toBe(1);
    expect(dragTarget(2, 30, mids)).toBe(0);
    expect(dragTarget(1, 110, mids)).toBe(1);
    expect(dragTarget(0, 50, [40])).toBe(0); // one row: nothing to move to
  });
});

describe('SG3.2 · Continue', () => {
  it('SG3.2 · canContinue', () => {
    expect(canContinue([], '')).toBe(false);
    expect(canContinue([], '   ')).toBe(false);
    expect(canContinue([S('minimalist')], '')).toBe(true);
    expect(canContinue([], 'all black')).toBe(true);
    expect(canContinue([S('minimalist')], 'all black')).toBe(true);
  });

  it('SG3.2 · notMeToSave', () => {
    const r = play(42, SV_ORDER, SV_ORDER);
    expect(notMeToSave(r.g, r.top)).toEqual(['minimalist', 'smart_casual', 'classic_prep', 'tailored']);
    // Not me to Outdoor, then Outdoor added from the sheet: not a Not me any more.
    const noOutdoor = play(42, [S('workwear'), S('streetwear')], SV_ORDER);
    expect(notMesOf(noOutdoor.g)).toContain('outdoor');
    expect(notMeToSave(noOutdoor.g, [...noOutdoor.top, S('outdoor')])).toEqual(['minimalist', 'smart_casual', 'classic_prep', 'tailored', 'vintage_sport']);
    // Me to all 8: none.
    const all = play(42, ALL, ALL);
    expect(notMeToSave(all.g, all.top)).toEqual([]);
    // Not me to all 8: every look, in GAME_LOOKS order.
    const none = play(42, [], ALL);
    expect(notMeToSave(none.g, [])).toEqual(ALL);
  });
});

// ── SG4.1 / SG7.2 · Add a look ────────────────────────────────────────────────────────────────────────────────────
describe('SG4.1 · Add a look', () => {
  it('SG4.1 · addLook and lookChoices', () => {
    expect(lookChoices([S('minimalist'), S('workwear')])).toEqual(['streetwear', 'smart_casual', 'classic_prep', 'tailored', 'outdoor', 'vintage_sport']);
    expect(lookChoices([])).toEqual(ALL);
    expect(lookChoices([S('outdoor'), S('vintage_sport'), S('workwear')])).toEqual(['streetwear', 'minimalist', 'smart_casual', 'classic_prep', 'tailored']);
    expect(addLook([S('minimalist')], S('workwear'))).toEqual({ picks: ['minimalist', 'workwear'], replaced: null });
    expect(addLook([], S('workwear'))).toEqual({ picks: ['workwear'], replaced: null });
    expect(addLook([S('minimalist')], S('minimalist'))).toEqual({ picks: ['minimalist'], replaced: null });
  });
});

describe('SG7.2 · Add a look on a full list', () => {
  it('SG7.2 · addLook on a full list takes #3\'s place', () => {
    const ovw = [S('outdoor'), S('vintage_sport'), S('workwear')];
    expect(addLook(ovw, S('streetwear'))).toEqual({ picks: ['outdoor', 'vintage_sport', 'streetwear'], replaced: 'workwear' });
    expect(addLook(ovw, S('outdoor'))).toEqual({ picks: ['outdoor', 'vintage_sport', 'workwear'], replaced: null });
    expect(addLook(ovw, S('workwear'))).toEqual({ picks: ['outdoor', 'vintage_sport', 'workwear'], replaced: null });
    expect(ovw).toEqual(['outdoor', 'vintage_sport', 'workwear']);
  });
});

// ── SG7.3 · the results line ──────────────────────────────────────────────────────────────────────────────────────
describe('SG7.3 · the results line', () => {
  it('SG7.3 · resultsHead', () => {
    const [a, b, c] = ['a', 'b', 'c'].map(S) as [StyleKey, StyleKey, StyleKey];
    expect(resultsHead([a, b], [a, b])).toBe('top');
    expect(resultsHead([a, b, c], [a, b, c])).toBe('top');
    expect(resultsHead([a], [a])).toBe('one');
    expect(resultsHead([], [a])).toBe('empty');
    expect(resultsHead([], [])).toBe('none');
    expect(resultsHead([a], [])).toBe('one'); // added from Nothing clicked
    expect(resultsHead([a, b], [])).toBe('top');
  });
});

// ── SG9.1 · motion and the descriptions ───────────────────────────────────────────────────────────────────────────
describe('SG9.1 · Reduce Motion and VoiceOver', () => {
  it('SG9.1 · Reduce Motion fades the card', () => {
    expect(cardExit(true)).toEqual({ kind: 'fade', ms: 150 });
    expect(cardExit(false)).toEqual({ kind: 'fly', ms: 240 });
  });

  it('SG9.1 · every drawing has a description', () => {
    const strings = en as unknown as Record<string, string | undefined>;
    const keys = ALL.flatMap((look) => [descKey(look, 0), descKey(look, 1)]);
    expect(keys).toHaveLength(16);
    expect(descKey(S('streetwear'), 0)).toBe('game.desc.streetwear.0');
    expect(descKey(S('tailored'), 1)).toBe('game.desc.tailored.1');
    const bad = keys.filter((k) => {
      const v = strings[k];
      return typeof v !== 'string' || v.trim() === '' || /\p{Extended_Pictographic}/u.test(v) || v === v.toUpperCase();
    });
    expect(bad).toEqual([]);
    expect(new Set(keys.map((k) => strings[k])).size).toBe(16); // each drawing its own words
    expect(strings['game.desc.streetwear.0']).toBe('Grey hoodie, washed wide jeans, chunky white sneakers');
  });
});

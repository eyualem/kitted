// T113 · The style game, rendered (specs/style-game.md SG1–SG9, F1.1; tasks/T113/TESTING.md): StyleGameScreen (the
// cards, the ranking, Here's your style / Nothing clicked yet) and AddLookSheet on the memory store, with the shared
// T39 mocks (src/testing/t39ScreenMocks.tsx): nothing may be sent (fetch and the AI transport fail the test).
//
// Set-up. Games are put in memory through the session's own calls with fixed seeds (src/testing/styleGameTestKit.ts),
// then the screen mounts and keeps them. Seed 42 deals Workwear, Classic prep, Streetwear, Minimal, Tailored, Outdoor,
// Vintage sport, Smart casual (flip 1). The drawings are a counted stand-in: `Outfit` (LookTile.tsx) is mocked to a View
// whose `drawn` prop names the outfit it was given (`workwear.1` = LOOKS' Workwear, second outfit), so a test can tell
// which drawing is up. Gestures go through the elements' own PanResponder handlers with touch histories shaped as React
// Native's responder system sends them (as closetDeck.test.tsx). The lean is read from the animations the card starts:
// a lean moves the card about ±18 pt (an Animated.timing or spring whose toValue is 5–60 pt; an answer flies hundreds of
// points, a spring back is 0, a fade 0–1).
//
// Profile (CLAUDE.md rule 6): no photo and no person. The players are stated likings ("prefers Streetwear > Vintage
// sport > Outdoor > Workwear"); the age in the F1.1 walk is the band he taps (22–25), never estimated.
//
// Needs T94 (Tailored's drawings in LOOKS): any test that draws Tailored (playing through card 5 of seed 42, the Add a
// look sheet, which lists Tailored when he hasn't got it) stays red until T94's app commit lands; TESTING.md lists them.
import {
  advance, allNodes, byId, flat, flush, getId, idsInOrder, mockT39, mount, press, setUpT39Tests, textAt, textOf, themeFor, typeIn, type Node,
} from '@/testing/t39ScreenMocks';
import { buttonIn, dismissTeach, playStyleGame, pressId, seedRandom, setUpGame, SETTLE_MS, TAUGHT_KEY, TEACH, teachShown } from '@/testing/styleGameTestKit';
import { act, fireEvent, isHiddenFromAccessibility, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, Animated, TextInput } from 'react-native';
import { CONTROL_TEXT_MAX_SCALE } from '@/design-system/tokens';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import type { StyleKey } from '@/data/types';
import { en, t, type StringKey } from '@/i18n/en';
import { styleLabel } from '@/features/morning/copy';
import { BasicsScreen } from '@/features/onboarding/BasicsScreen';
import { WelcomeScreen } from '@/features/onboarding/WelcomeScreen';
import { AddLookSheet } from '@/features/onboarding/AddLookSheet';
import { StyleGameScreen } from '@/features/onboarding/StyleGameScreen';
import { addToResults, endStyleGame, getStyleGame, playAgain, startOrResumeStyleGame } from '@/features/onboarding/styleGameSession';
import { kvPolicy } from '@/sync/schema';
import { showToast, toastWindowMs } from '@/features/toast/toast';
import { ToastHost } from '@/features/toast/ToastHost';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
jest.mock('@/features/onboarding/LookTile', () => {
  const actual = jest.requireActual('@/features/onboarding/LookTile');
  const { View } = jest.requireActual('react-native');
  const { LOOKS } = jest.requireActual('@/features/onboarding/looks');
  const nameOf = (outfit: unknown) => {
    for (const l of LOOKS as { style: string; outfits: unknown[] }[]) {
      const i = l.outfits.indexOf(outfit);
      if (i >= 0) return `${l.style}.${i}`;
    }
    return 'unknown';
  };
  return { ...actual, Outfit: jest.fn(({ outfit, w }: { outfit: unknown; w: number }) => <View testID="mock-outfit" drawn={nameOf(outfit)} style={{ width: w }} />) };
});
jest.mock('@/features/toast/toast', () => {
  const actual = jest.requireActual('@/features/toast/toast');
  return { ...actual, showToast: jest.fn(actual.showToast) };
});

const life = setUpT39Tests();

// ── The words (TESTING.md, exact) ─────────────────────────────────────────────────────────────────────────────────
// The card's words changed on Nov 18 after a real tester (#494): "Is this your style?" with Yes / No.
const TITLE = 'Is this your style?';
const LINE = 'One outfit at a time.';
const HINT = 'Swipe right for Yes, left for No.';
const YES = 'Yes';
const NO = 'No';
/** SG7 FS4: the check after three fast No's. */
const CHECK = "Just checking: left means it's not your style.";
const START_OVER = 'Start over';
const KEEP_GOING = 'Keep going';
const PEEK_HINT = 'Not sure? Tap it for another outfit.';
const RANK_TITLE = 'Now put them in order';
const RANK_LINE = "Tap the one that's more you."; // the founder, Nov 18 (#493): no "You said Me to {n}."
const RES_TITLE = "Here's your style";
const RES_LINE = 'Your top looks, in order. Not quite right? Drag, remove or add one.';
const RES_ONE = 'Your top look. Not quite right? Add one, or play again.';
const RES_EMPTY = 'Add a look, or tell me in your words.'; // founder question F3, the coordinator's draft
const NONE_TITLE = 'Nothing clicked yet';
const NONE_LINE = 'Add a look you like, play again, or tell me in your words.';
const ADD = 'Add a look';
const WORDS_LINK = 'Not quite you? Tell me in your words';
const PLACEHOLDER = 'Like skater, or all black';
const PLAY_AGAIN = 'Play again';

/** Seed 42's players. */
const SV = ['streetwear', 'vintage_sport', 'outdoor', 'workwear'];
const SCREEN_303 = { seed: 42, me: SV, rounds: 0 };
const SCREEN_304 = { seed: 42, me: SV, prefer: SV };
const SCREEN_305 = { seed: 42, me: ['minimalist'] };
const SCREEN_310 = { seed: 42, me: [] };
const SCREEN_313 = { ...SCREEN_305, then: [{ remove: 0 }] };
const OVW = ['outdoor', 'vintage_sport', 'workwear'];

// ── helpers ───────────────────────────────────────────────────────────────────────────────────────────────────────
const store = () => mockT39.store;
const st = () => {
  const s = getStyleGame();
  if (!s) throw new Error('no style game in memory');
  return s;
};
const answers = () => st().game.answers.map((a) => `${a.look} ${a.me ? 'Me' : 'Not me'}`);
const picks = () => st().results?.picks;
/** A drawing's VoiceOver description, from en (the copy must exist: a missing key is "not built"). */
function desc(look: string, outfit: 0 | 1): string {
  const v = (en as unknown as Record<string, string | undefined>)[`game.desc.${look}.${outfit}`];
  if (typeof v !== 'string') throw new Error(`T113: copy not built: game.desc.${look}.${outfit}`);
  return v;
}
const cardLabel = (n: number, view: 1 | 2, look: string) => `Outfit ${n} of 8, view ${view} of 2. ${desc(look, (view - 1) as 0 | 1)}`;
const label = (id: string) => getId(id).props.accessibilityLabel as string | undefined;
const lineOf = (look: string) => t(`onb.looks.line.${look}` as StringKey);
const drawnIn = (id: string) => getId(id).queryAll((n) => n.props.testID === 'mock-outfit' && typeof n.type === 'string').map((n) => n.props.drawn as string);
const outfitMock = () => (jest.requireMock('@/features/onboarding/LookTile') as { Outfit: jest.Mock }).Outfit;
const everDrawn = () => outfitMock().mock.calls.map((c) => {
  const { LOOKS } = jest.requireActual('@/features/onboarding/looks') as { LOOKS: { style: string; outfits: unknown[] }[] };
  for (const l of LOOKS) {
    const i = l.outfits.indexOf((c[0] as { outfit: unknown }).outfit);
    if (i >= 0) return `${l.style}.${i}`;
  }
  return 'unknown';
});
const isDisabled = (n: Node) => (n.props.accessibilityState as { disabled?: boolean } | undefined)?.disabled === true || n.props['aria-disabled'] === true || n.props.disabled === true;
const continueDisabled = () => isDisabled(buttonIn('results-continue'));
const pushes = () => (router.push as jest.Mock).mock.calls.map((c) => (typeof c[0] === 'string' ? c[0] : String((c[0] as { pathname?: string }).pathname)));
const replaces = () => (router.replace as jest.Mock).mock.calls.map((c) => (typeof c[0] === 'string' ? c[0] : String((c[0] as { pathname?: string }).pathname)));
const impacts = () => (Haptics.impactAsync as jest.Mock).mock.calls.map((c) => c[0]);
const selections = () => (Haptics.selectionAsync as jest.Mock).mock.calls.length;
const parentOf = (n: Node) => (n as unknown as { parent: Node | null }).parent;
function ancestors(n: Node): Node[] {
  const out: Node[] = [];
  for (let p = parentOf(n); p; p = parentOf(p)) out.push(p);
  return out;
}
/** The nearest host ancestor holding both, and its flex direction ('column' when unset). */
function sharedDirection(a: Node, b: Node): string {
  const bs = new Set(ancestors(b));
  const common = ancestors(a).find((x) => bs.has(x) && typeof x.type === 'string');
  if (!common) throw new Error('no shared parent');
  return (flat(common).flexDirection as string | undefined) ?? 'column';
}
/** Results rows, top to bottom, by the name in each row's VoiceOver label ("1 of 3, Streetwear. …"). */
function rowNames(): string[] {
  const out: string[] = [];
  for (let i = 0; i < 4; i++) {
    const r = byId(`results-row-${i}`);
    if (!r) break;
    const m = /^\d+ of \d+, ([^.]+)\./.exec(String(r.props.accessibilityLabel));
    out.push(m ? m[1]! : `(row ${i}: ${String(r.props.accessibilityLabel)})`);
  }
  return out;
}
const rowLabel = (n: number, total: number, look: string) => `${n} of ${total}, ${styleLabel(look as StyleKey)}. ${lineOf(look)}`;
const actionsOf = (id: string) => ((getId(id).props.accessibilityActions as { name: string; label?: string }[] | undefined) ?? []).map((a) => [a.name, a.label]);
async function a11yAction(id: string, actionName: string) {
  await act(async () => {
    fireEvent(getId(id) as never, 'accessibilityAction', { nativeEvent: { actionName } });
  });
  await flush();
}
const announced = () => (AccessibilityInfo.announceForAccessibility as jest.Mock).mock.calls.map((c) => c[0] as string);
const ink = () => mockT39.theme.colors.ink;
const reduceMotion = () => {
  const th = themeFor();
  mockT39.theme = { ...th, a11y: { ...th.a11y, reduceMotion: true } };
};
const backButton = () => screen.getByRole('button', { name: 'Back' });

// ── a finger (PanResponder handlers, as React Native's responder system calls them) ───────────────────────────────
type Call = (e: unknown) => unknown;
/** The element carrying the pan handlers: the testID'd element itself or a host inside it. */
function panTarget(id: string): Node {
  const n = getId(id);
  const has = (x: Node) => typeof x.props.onResponderGrant === 'function' && (typeof x.props.onStartShouldSetResponder === 'function' || typeof x.props.onMoveShouldSetResponder === 'function');
  if (has(n)) return n;
  const inner = n.queryAll((x) => typeof x.type === 'string' && has(x));
  if (inner[0]) return inner[0];
  throw new Error(`no pan handlers on ${id}`);
}
class Finger {
  private t = 10_000;
  private sx: number; private sy: number; private st: number;
  x: number; y: number; private px: number; private py: number; private pt: number;
  granted = false;
  /** The card sits in a ScrollView: once the finger has moved 10 pt up or down, the scroll view asks for the touch
   *  (onResponderTerminationRequest) and takes it when the card lets go (onResponderTerminate). */
  scrollAsks = false;
  terminated = false;
  constructor(readonly id: string, x = 200, y = 300) {
    this.sx = this.x = this.px = x;
    this.sy = this.y = this.py = y;
    this.st = this.pt = this.t;
  }
  ev(active = true) {
    const touch = { pageX: this.x, pageY: this.y, locationX: this.x, locationY: this.y, identifier: 0, timestamp: this.t, target: 1 };
    return {
      nativeEvent: { ...touch, touches: active ? [touch] : [], changedTouches: [touch] },
      touchHistory: {
        numberActiveTouches: active ? 1 : 0, indexOfSingleActiveTouch: 0, mostRecentTimeStamp: this.t,
        touchBank: [{
          touchActive: active, startPageX: this.sx, startPageY: this.sy, startTimeStamp: this.st, currentPageX: this.x, currentPageY: this.y,
          currentTimeStamp: this.t, previousPageX: this.px, previousPageY: this.py, previousTimeStamp: this.pt,
        }],
      },
      persist() {}, preventDefault() {}, stopPropagation() {}, isDefaultPrevented: () => false, isPropagationStopped: () => false,
    };
  }
  call(name: string, e: unknown) {
    const h = panTarget(this.id).props[name];
    return typeof h === 'function' ? (h as Call)(e) : undefined;
  }
  step(dx: number, dy: number, ms: number) {
    this.px = this.x; this.py = this.y; this.pt = this.t;
    this.x += dx; this.y += dy; this.t += ms;
  }
  get movedY() {
    return Math.abs(this.y - this.sy);
  }
}
async function down(id: string, x = 200, y = 300, o: { inScroll?: boolean } = {}) {
  const f = new Finger(id, x, y);
  f.scrollAsks = o.inScroll ?? false;
  await act(async () => {
    const e = f.ev();
    if (f.call('onStartShouldSetResponderCapture', e) === true || f.call('onStartShouldSetResponder', e) === true) {
      f.granted = true;
      f.call('onResponderGrant', e);
    }
  });
  return f;
}
async function move(f: Finger, dx: number, dy: number, ms = 16) {
  f.step(dx, dy, ms);
  await act(async () => {
    const e = f.ev();
    if (!f.granted && !f.terminated) {
      if (f.call('onMoveShouldSetResponderCapture', e) === true || f.call('onMoveShouldSetResponder', e) === true) {
        f.granted = true;
        f.call('onResponderGrant', e);
      }
    }
    if (f.granted) f.call('onResponderMove', e);
    // After the move that took it 10 pt up or down, the scroll view asks once.
    if (f.granted && f.scrollAsks && f.movedY >= 10) {
      f.scrollAsks = false;
      if (f.call('onResponderTerminationRequest', e) !== false) {
        f.call('onResponderTerminate', e);
        f.granted = false;
        f.terminated = true;
      }
    }
  });
}
/** Moves in 10 pt steps (so a crossing is seen), then holds still for a moment (no fling). */
async function moveBy(f: Finger, dx: number, dy: number) {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 10));
  for (let i = 0; i < n; i++) await move(f, dx / n, dy / n, 16);
  await move(f, 0, 0, 400);
}
async function lift(f: Finger) {
  await act(async () => {
    if (f.granted) f.call('onResponderRelease', f.ev(false));
  });
  await flush();
}
/** A drag on the card to dx (sideways) and release. */
async function swipeCard(dx: number) {
  const f = await down('game-card', 200, 300, { inScroll: true });
  await moveBy(f, dx, 0);
  await lift(f);
  await advance(SETTLE_MS);
}
/** A press and release with no movement. */
async function tapCard() {
  const f = await down('game-card');
  await move(f, 0, 0, 80);
  await lift(f);
  await advance(50);
}

/** The animations a lean starts: x moves of 5–60 pt (see the header). */
function leanMoves(timing: jest.SpyInstance, spring: jest.SpyInstance): number[] {
  return [...timing.mock.calls, ...spring.mock.calls]
    .map((c) => (c[1] as { toValue?: unknown } | undefined)?.toValue)
    .filter((v): v is number => typeof v === 'number' && Math.abs(v) >= 5 && Math.abs(v) <= 60);
}

/** Every row's place for the drag: each row (and any wrapper holding only that row) reports a 100 pt row every 110 pt. */
async function layOutRows() {
  for (let i = 0; i < 3; i++) {
    const row = byId(`results-row-${i}`);
    if (!row) break;
    const layout = { nativeEvent: { layout: { x: 16, y: i * 110, width: 370, height: 100 } } };
    const targets = [row];
    for (const a of ancestors(row)) {
      const rows = a.queryAll((x) => typeof x.props.testID === 'string' && /^results-row-\d$/.test(x.props.testID as string));
      if (rows.length > 1) break;
      targets.push(a);
    }
    for (const n of targets) {
      if (typeof n.props.onLayout !== 'function') continue;
      await act(async () => {
        (n.props.onLayout as Call)(layout);
      });
    }
  }
}
const scrollViewOf = (id: string) => ancestors(getId(id)).find((n) => n.type === 'RCTScrollView');

let timing: jest.SpyInstance;
let spring: jest.SpyInstance;
let announce: jest.SpyInstance;
let random: jest.SpyInstance | null = null;
/** Math.random fixed for a fresh install's new game (restored after the test). */
const fixRandom = (seed: number) => {
  random = jest.spyOn(Math, 'random').mockReturnValue(seedRandom(seed)());
};
beforeEach(() => {
  timing = jest.spyOn(Animated, 'timing');
  spring = jest.spyOn(Animated, 'spring');
  announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
  // The game is module state: every test starts without one.
  endStyleGame();
});
afterEach(() => {
  timing.mockRestore();
  spring.mockRestore();
  announce.mockRestore();
  random?.mockRestore();
  random = null;
  (router.push as jest.Mock).mockImplementation(() => undefined);
  endStyleGame();
});

// ── SG1.1 · after Welcome ─────────────────────────────────────────────────────────────────────────────────────────
describe('SG1.1 · Is this your style? after Welcome', () => {
  it('SG1.1 · Get started opens Is this your style? on card 1 of 8', async () => {
    let r = await mount(<WelcomeScreen />);
    await advance(5000);
    await press(screen.getByText('Get started'));
    expect(pushes()).toEqual(['/onboarding/looks']);
    await r.unmount();

    // A fresh install: no game in memory, no draft. The new game's seed comes from Math.random (fixed here).
    fixRandom(42);
    r = await mount(<StyleGameScreen />);
    expect(st().game.seed).toBe(42);
    expect(textAt('game-title')).toBe(TITLE);
    expect(getId('game-title').props.accessibilityRole).toBe('header');
    expect(textAt('game-line')).toBe(LINE);
    expect(label('game-card')).toBe(cardLabel(1, 1, 'workwear'));
    expect(label('game-card')!.startsWith('Outfit 1 of 8, view 1 of 2. ')).toBe(true);
    expect(drawnIn('game-card')).toEqual(['workwear.0']);
    expect(Array.from({ length: 9 }, (_, i) => byId(`game-progress-dot-${i}`) !== null)).toEqual([true, true, true, true, true, true, true, true, false]);
    expect(label('onb-progress')).toBe('Step 2 of 3');
    expect(textAt('game-hint')).toBe(HINT);
    expect(textAt('game-peek-hint')).toBe(PEEK_HINT);
    // A fresh install: card 1 teaches the swipe first (SG1.4).
    expect(screen.getAllByText(TEACH)).toHaveLength(1);
    await r.unmount();
  });
});

// ── SG1.2 · tap and swipe ─────────────────────────────────────────────────────────────────────────────────────────
describe('SG1.2 · answering', () => {
  it('SG1.2 · Yes and No buttons answer the card', async () => {
    await setUpGame(store(), { seed: 42, me: [], cards: 0 });
    await mount(<StyleGameScreen />);
    expect(label('game-card')).toBe(cardLabel(1, 1, 'workwear'));
    // The words (#494): Yes on the right with a check icon, No on the left with a cross; drawn icons, never emoji.
    expect([buttonIn('game-me').props.accessibilityLabel, textOf(buttonIn('game-me'))]).toEqual([YES, YES]);
    expect([buttonIn('game-notme').props.accessibilityLabel, textOf(buttonIn('game-notme'))]).toEqual([NO, NO]);
    const icons = (id: string) => getId(id).queryAll((n) => typeof n.props.name === 'string').map((n) => n.props.name as string);
    expect(icons('game-me').filter((x) => x === 'check' || x === 'checkmark')).toHaveLength(1);
    expect(icons('game-notme').filter((x) => x === 'close' || x === 'xmark')).toHaveLength(1);
    expect(icons('game-me').filter((x) => x === 'close' || x === 'xmark')).toEqual([]);
    const ids = idsInOrder();
    expect(ids.indexOf('game-notme')).toBeLessThan(ids.indexOf('game-me'));
    expect(textAt('game-hint')).toBe(HINT);
    await pressId('game-me');
    await advance(SETTLE_MS);
    expect(answers()).toEqual(['workwear Me']);
    expect(label('game-card')).toBe(cardLabel(2, 1, 'classic_prep'));
    expect(impacts()).toEqual(['light']);
    await pressId('game-notme');
    await advance(SETTLE_MS);
    expect(answers()).toEqual(['workwear Me', 'classic_prep Not me']);
    expect(label('game-card')).toBe(cardLabel(3, 1, 'streetwear'));
    expect(impacts()).toEqual(['light', 'light']);
  });

  it('SG1.2 · a swipe past 90 pt answers, a shorter one springs back', async () => {
    await setUpGame(store(), { seed: 42, me: [], cards: 0 });
    await mount(<StyleGameScreen />);
    // Right past the line, back inside, out again: a tick each time it crosses outward.
    const f = await down('game-card', 200, 300, { inScroll: true });
    await moveBy(f, 120, 0);
    expect(selections()).toBe(1);
    await moveBy(f, -60, 0);
    await moveBy(f, 70, 0);
    expect(selections()).toBe(2);
    await lift(f);
    await advance(SETTLE_MS);
    expect(answers()).toEqual(['workwear Me']);
    expect(impacts()).toEqual(['light']);
    // Left past the line: Not me.
    await swipeCard(-120);
    expect(answers()).toEqual(['workwear Me', 'classic_prep Not me']);
    expect(selections()).toBe(3);
    // 60 pt: no answer, the card springs back to where it was (an animation of its x back to 0).
    timing.mockClear();
    spring.mockClear();
    await swipeCard(60);
    expect(answers()).toEqual(['workwear Me', 'classic_prep Not me']);
    expect(label('game-card')).toBe(cardLabel(3, 1, 'streetwear'));
    expect(impacts()).toEqual(['light', 'light']);
    const backTo = [...timing.mock.calls, ...spring.mock.calls].map((c) => (c[1] as { toValue?: unknown }).toValue);
    expect(backTo).toContain(0);
    expect(backTo.filter((v) => typeof v === 'number' && Math.abs(v) >= 200)).toEqual([]); // it didn't fly off
    // A drag that starts vertical answers nothing.
    const v = await down('game-card', 200, 300, { inScroll: true });
    await moveBy(v, 0, 40);
    await moveBy(v, 120, 0);
    await lift(v);
    await advance(SETTLE_MS);
    expect(st().game.answers).toHaveLength(2);
  });

  it('SG1.2 · a double tap answers one card', async () => {
    await setUpGame(store(), { seed: 42, me: [], cards: 0 });
    await mount(<StyleGameScreen />);
    // Both presses land while the first card is still leaving (on the phone it takes 240 ms; in the test renderer a
    // native-driver animation ends on the next frame, so the second press comes before any timer runs).
    await pressId('game-me');
    await pressId('game-me');
    await advance(SETTLE_MS);
    expect(answers()).toEqual(['workwear Me']);
    expect(impacts()).toEqual(['light']);
    expect(label('game-card')).toBe(cardLabel(2, 1, 'classic_prep'));
  });
});

// ── SG1.3 · the lean and the dots ─────────────────────────────────────────────────────────────────────────────────
describe('SG1.3 · the lean and the dots', () => {
  // SG1 (Nov 18, #494): "After it's dismissed, card 1 leans right then left once to show the swipe (never under Reduce
  // Motion, never again)." The lean follows the overlay's tap, so it plays once per install: not before the tap, not
  // after Play again, not after a relaunch. (Until Nov 18 it ran 1.4 s after card 1 appeared, in every game.)
  // A walk through many renders: under the full suite's parallel load it has run past jest's 5 s (verify round 1, T3).
  it('SG1.3 · card 1 leans once, after its overlay is tapped away, never under Reduce Motion', async () => {
    await setUpGame(store(), { seed: 42, me: [], cards: 0, taught: false });
    let r = await mount(<StyleGameScreen />);
    expect(teachShown()).toBe(true);
    await advance(5000);
    expect(leanMoves(timing, spring)).toEqual([]); // not while the overlay shows
    await dismissTeach();
    // It has started within 1.45 s of the tap (verify round 1, T1).
    await advance(1450);
    expect(leanMoves(timing, spring).filter((v) => v > 0).length).toBeGreaterThanOrEqual(1);
    await advance(3000);
    const one = leanMoves(timing, spring);
    expect(one.filter((v) => v > 0)).toHaveLength(1); // one lean: right …
    expect(one.filter((v) => v < 0)).toHaveLength(1); // … then left
    expect(one.findIndex((v) => v > 0)).toBeLessThan(one.findIndex((v) => v < 0));
    expect(st().leaned).toBe(true);
    await advance(5000);
    expect(leanMoves(timing, spring)).toHaveLength(one.length);
    // Back to card 1 in the same game: no second lean.
    await pressId('game-me');
    await advance(SETTLE_MS);
    await press(backButton());
    await advance(SETTLE_MS);
    expect(label('game-card')).toBe(cardLabel(1, 1, 'workwear'));
    await advance(5000);
    expect(leanMoves(timing, spring)).toHaveLength(one.length);
    // Play again: a new game, but the swipe was taught: no overlay and no lean.
    await act(async () => {
      await playAgain(store(), seedRandom(7));
    });
    await flush();
    expect(st().game.seed).toBe(7);
    expect(teachShown()).toBe(false);
    await advance(5000);
    expect(leanMoves(timing, spring)).toHaveLength(one.length);
    await r.unmount();
    // A relaunch (the game gone from memory, kv kept): no overlay, no lean.
    endStyleGame();
    await act(async () => {
      await startOrResumeStyleGame(store(), seedRandom(9));
    });
    r = await mount(<StyleGameScreen />);
    expect(label('game-card')!.startsWith('Outfit 1 of 8, view 1 of 2. ')).toBe(true);
    expect(teachShown()).toBe(false);
    await advance(5000);
    expect(leanMoves(timing, spring)).toHaveLength(one.length);
    await r.unmount();

    // Reduce Motion, fresh install: the overlay, then no lean at any time.
    timing.mockClear();
    spring.mockClear();
    endStyleGame();
    reduceMotion();
    await setUpGame(store(), { seed: 42, me: [], cards: 0, taught: false });
    r = await mount(<StyleGameScreen />);
    expect(teachShown()).toBe(true);
    await dismissTeach();
    await advance(10_000);
    expect(leanMoves(timing, spring)).toEqual([]);
    await r.unmount();
  }, 20000);

  it('SG1.3 · the dots follow the answers', async () => {
    await setUpGame(store(), { seed: 42, me: ['workwear'], cards: 2 });
    await mount(<StyleGameScreen />);
    const dot = (i: number) => flat(getId(`game-progress-dot-${i}`));
    expect([dot(0).width, dot(0).backgroundColor]).toEqual([6, ink()]);
    expect([dot(1).width, dot(1).backgroundColor]).toEqual([6, ink()]);
    expect([dot(2).width, dot(2).backgroundColor]).toEqual([22, ink()]);
    for (let i = 3; i < 8; i++) {
      expect([i, dot(i).width]).toEqual([i, 6]);
      expect([i, dot(i).backgroundColor === ink()]).toEqual([i, false]);
    }
    expect(isHiddenFromAccessibility(getId('game-progress') as never)).toBe(true);
    // One more answer: the pill moves on.
    await pressId('game-notme');
    await advance(SETTLE_MS);
    expect([dot(2).width, dot(2).backgroundColor]).toEqual([6, ink()]);
    expect([dot(3).width, dot(3).backgroundColor]).toEqual([22, ink()]);
    expect(dot(4).backgroundColor === ink()).toBe(false);
  });
});

// ── SG2.1 · Now put them in order ─────────────────────────────────────────────────────────────────────────────────
describe('SG2.1 · the ranking', () => {
  it('SG2.1 · Now put them in order shows two Me\'s on their second outfits', async () => {
    await setUpGame(store(), SCREEN_303);
    expect(st().stage).toBe('ranking');
    await mount(<StyleGameScreen />);
    expect(textAt('rank-title')).toBe(RANK_TITLE);
    expect(getId('rank-title').props.accessibilityRole).toBe('header');
    expect(textAt('rank-line')).toBe(RANK_LINE);
    expect(label('rank-pick-left')).toBe(desc('workwear', 1));
    expect(label('rank-pick-right')).toBe(desc('streetwear', 1));
    expect(getId('rank-pick-left').props.accessibilityRole).toBe('button');
    expect(getId('rank-pick-right').props.accessibilityRole).toBe('button');
    expect(drawnIn('rank-pick-left')).toEqual(['workwear.1']);
    expect(drawnIn('rank-pick-right')).toEqual(['streetwear.1']);
    expect(byId('game-progress')).toBeNull();

    // A tap: the haptic at once, the next pair after 260 ms; a second tap in the wait is ignored.
    await press(getId('rank-pick-left'));
    expect(impacts()).toEqual(['light']);
    await advance(100);
    await press(getId('rank-pick-right'));
    await advance(100);
    expect(st().game.rounds).toHaveLength(0);
    await advance(100);
    expect(st().game.rounds.map((r) => r.win)).toEqual(['workwear']);
    await advance(SETTLE_MS);
    expect(st().game.rounds).toHaveLength(1);
    expect(impacts()).toEqual(['light']);
    // Workwear over Streetwear; Outdoor comes in against Streetwear, the newcomer on the left this time.
    expect(label('rank-pick-left')).toBe(desc('outdoor', 1));
    expect(label('rank-pick-right')).toBe(desc('streetwear', 1));
    expect(drawnIn('rank-pick-left')).toEqual(['outdoor.1']);
  });

  it('SG2.1 · under Reduce Motion the pause is 120 ms', async () => {
    reduceMotion();
    await setUpGame(store(), SCREEN_303);
    await mount(<StyleGameScreen />);
    await press(getId('rank-pick-right'));
    await advance(100);
    expect(st().game.rounds).toHaveLength(0);
    await advance(30);
    expect(st().game.rounds.map((r) => r.win)).toEqual(['streetwear']);
  });
});

// ── SG3.1 · drag, ×, Undo ─────────────────────────────────────────────────────────────────────────────────────────
describe('SG3.1 · Here\'s your style: drag and remove', () => {
  it('SG3.1 · dragging a row\'s handle reorders and the numbers follow', async () => {
    await setUpGame(store(), SCREEN_304);
    await mount(<StyleGameScreen />);
    expect(rowNames()).toEqual(['Streetwear', 'Vintage sport', 'Outdoor']);
    expect([textAt('results-row-0-number'), textAt('results-row-1-number'), textAt('results-row-2-number')]).toEqual(['1', '2', '3']);
    await layOutRows();
    // Past row 1's middle (not row 2's): it takes row 1's place.
    const f = await down('results-row-0-handle', 360, 50);
    await moveBy(f, 0, 150);
    expect(scrollViewOf('results-row-1')?.props.scrollEnabled).toBe(false);
    expect(selections()).toBe(1);
    await lift(f);
    await advance(SETTLE_MS);
    expect(impacts()).toEqual(['light']);
    expect(picks()).toEqual(['vintage_sport', 'streetwear', 'outdoor']);
    expect(rowNames()).toEqual(['Vintage sport', 'Streetwear', 'Outdoor']);
    expect([textAt('results-row-0-number'), textAt('results-row-1-number'), textAt('results-row-2-number')]).toEqual(['1', '2', '3']);
    expect(label('results-row-0')).toBe(rowLabel(1, 3, 'vintage_sport'));
    expect(label('results-row-1')).toBe(rowLabel(2, 3, 'streetwear'));
    expect(scrollViewOf('results-row-1')?.props.scrollEnabled).not.toBe(false);

    // A drag that ends before the next row's middle: nothing moves.
    await layOutRows();
    const g = await down('results-row-0-handle', 360, 50);
    await moveBy(g, 0, 30);
    await lift(g);
    await advance(SETTLE_MS);
    expect(picks()).toEqual(['vintage_sport', 'streetwear', 'outdoor']);
    expect(rowNames()).toEqual(['Vintage sport', 'Streetwear', 'Outdoor']);
  });

  it('SG3.1 · a drag on a one-row list moves nothing', async () => {
    await setUpGame(store(), SCREEN_305);
    await mount(<StyleGameScreen />);
    await layOutRows();
    const f = await down('results-row-0-handle', 360, 50);
    await moveBy(f, 0, 150);
    await lift(f);
    await advance(SETTLE_MS);
    expect(picks()).toEqual(['minimalist']);
    expect(rowNames()).toEqual(['Minimal']);
  });

  it('SG3.1 · × removes and shows Removed {name} with Undo', async () => {
    await setUpGame(store(), SCREEN_304);
    await mount(<StyleGameScreen />);
    await press(getId('results-row-1-remove'));
    expect(rowNames()).toEqual(['Streetwear', 'Outdoor']);
    expect(picks()).toEqual(['streetwear', 'outdoor']);
    const calls = (showToast as jest.Mock).mock.calls;
    expect(calls).toHaveLength(1);
    expect(calls[0]![0]).toBe('Removed Vintage sport');
    expect(typeof calls[0]![1]).toBe('function');
    // The app's toast: 5 s (10 s with VoiceOver), not the 8 s removal window.
    const o = calls[0]![2] as { ms?: number } | undefined;
    expect(toastWindowMs({ ms: o?.ms }, false)).toBe(5000);
    expect(toastWindowMs({ ms: o?.ms }, true)).toBe(10_000);
    await act(async () => {
      await (calls[0]![1] as () => Promise<void>)();
    });
    await flush();
    expect(rowNames()).toEqual(['Streetwear', 'Vintage sport', 'Outdoor']);
    expect(picks()).toEqual(['streetwear', 'vintage_sport', 'outdoor']);
  });
});

// ── SG3.2 · Continue ──────────────────────────────────────────────────────────────────────────────────────────────
describe('SG3.2 · Continue', () => {
  // A walk through many renders: under the full suite's parallel load it has run past jest's 5 s (verify round 1, T3).
  it('SG3.2 · Continue goes to About you', async () => {
    const enabled: [string, boolean][] = [];
    for (const [name, o, words] of [
      ['304', SCREEN_304, undefined], ['305', SCREEN_305, undefined], ['310', SCREEN_310, undefined], ['311', SCREEN_310, 'all black'], ['313', SCREEN_313, undefined],
    ] as const) {
      endStyleGame();
      await store().wipe();
      await setUpGame(store(), { ...o, savedWords: words });
      const r = await mount(<StyleGameScreen />);
      enabled.push([name, !continueDisabled()]);
      await r.unmount();
    }
    expect(enabled).toEqual([['304', true], ['305', true], ['310', false], ['311', true], ['313', false]]);

    // 304: Continue writes first, then goes to About you.
    endStyleGame();
    await store().wipe();
    await setUpGame(store(), SCREEN_304);
    const atPush: Promise<(string | null)[]>[] = [];
    (router.push as jest.Mock).mockImplementation(() => {
      atPush.push(Promise.all(['onboarding.looks', 'looks.notMe', 'onboarding.step'].map((k) => store().getKv(k))));
    });
    await mount(<StyleGameScreen />);
    await pressId('results-continue');
    await advance(SETTLE_MS);
    expect(pushes()).toEqual(['/onboarding/basics']);
    expect(await atPush[0]).toEqual(['["streetwear","vintage_sport","outdoor"]', '["minimalist","smart_casual","classic_prep","tailored"]', 'basics']);
  }, 20000);

  it('SG3.2 · a failed save leaves him on results with Continue working', async () => {
    await setUpGame(store(), SCREEN_304);
    await mount(<StyleGameScreen />);
    // The first write of Continue fails.
    const realSet = store().setKv.bind(store());
    let fails = 1;
    store().setKv = jest.fn((k: string, v: string) => (fails-- > 0 ? Promise.reject(new Error('disk full')) : realSet(k, v)));
    await pressId('results-continue');
    await advance(SETTLE_MS);
    expect(pushes()).toEqual([]);
    expect(textAt('results-title')).toBe(RES_TITLE);
    expect(continueDisabled()).toBe(false);
    await pressId('results-continue');
    await advance(SETTLE_MS);
    expect(pushes()).toEqual(['/onboarding/basics']);
    expect(await store().getKv('onboarding.looks')).toBe('["streetwear","vintage_sport","outdoor"]');
  });

  it('SG3.2 · two Continue presses at once go to About you once', async () => {
    await setUpGame(store(), SCREEN_304);
    await mount(<StyleGameScreen />);
    const b = buttonIn('results-continue');
    // Both in one frame, before either save has finished (verify round 1, C4).
    await act(async () => {
      void fireEvent.press(b as never);
      void fireEvent.press(b as never);
    });
    await flush();
    await advance(SETTLE_MS);
    expect(pushes()).toEqual(['/onboarding/basics']);
    expect(await store().getKv('onboarding.looks')).toBe('["streetwear","vintage_sport","outdoor"]');
  });
});

// ── SG4.1 · Add a look ────────────────────────────────────────────────────────────────────────────────────────────
describe('SG4.1 · Add a look', () => {
  // A walk through many renders: under the full suite's parallel load it has run past jest's 5 s (verify round 1, T3).
  it('SG4.1 · the sheet lists the looks he doesn\'t have; a tap adds it last and closes', async () => {
    // results-add on 304, 305, 310, 313.
    const present: [string, string][] = [];
    for (const [name, o] of [['304', SCREEN_304], ['305', SCREEN_305], ['310', SCREEN_310], ['313', SCREEN_313]] as const) {
      endStyleGame();
      await store().wipe();
      await setUpGame(store(), o);
      const r = await mount(<StyleGameScreen />);
      present.push([name, byId('results-add') ? textOf(getId('results-add')) : '(none)']);
      if (name === '304') {
        await press(buttonIn('results-add'));
        expect(pushes()).toEqual(['/onboarding/add-look']);
      }
      await r.unmount();
    }
    expect(present).toEqual([['304', ADD], ['305', ADD], ['310', ADD], ['313', ADD]]);

    // 312: Minimal and Workwear.
    endStyleGame();
    await setUpGame(store(), { ...SCREEN_305, then: [{ add: 'workwear' as StyleKey }] });
    expect(picks()).toEqual(['minimalist', 'workwear']);
    jest.clearAllMocks();
    await mount(<AddLookSheet />);
    expect(allNodes().filter((n) => n.type === 'Text' && n.props.accessibilityRole === 'header').map(textOf)).toEqual([ADD]);
    const tiles = idsInOrder().filter((id) => id.startsWith('addlook-tile-'));
    expect(tiles).toEqual(['streetwear', 'smart_casual', 'classic_prep', 'tailored', 'outdoor', 'vintage_sport'].map((k) => `addlook-tile-${k}`));
    for (const k of ['streetwear', 'outdoor', 'vintage_sport']) {
      expect(label(`addlook-tile-${k}`)).toBe(`${styleLabel(k as StyleKey)}: ${lineOf(k)}`);
    }
    await press(getId('addlook-tile-outdoor'));
    await advance(SETTLE_MS);
    expect(picks()).toEqual(['minimalist', 'workwear', 'outdoor']);
    expect((router.back as jest.Mock).mock.calls).toHaveLength(1);
    expect(selections()).toBe(1);
    expect(showToast).not.toHaveBeenCalled();
  }, 20000);

  it('SG4.1 · the sheet\'s Close adds nothing', async () => {
    await setUpGame(store(), { ...SCREEN_305, then: [{ add: 'workwear' as StyleKey }] });
    jest.clearAllMocks();
    await mount(<AddLookSheet />);
    await press(screen.getByRole('button', { name: 'Close' }));
    expect((router.back as jest.Mock).mock.calls.length + (router.dismiss as jest.Mock).mock.calls.length).toBe(1);
    expect(picks()).toEqual(['minimalist', 'workwear']);
  });

  it('SG4.1 · two tiles pressed at once add one look and close once', async () => {
    await setUpGame(store(), { ...SCREEN_305, then: [{ add: 'workwear' as StyleKey }] });
    jest.clearAllMocks();
    await mount(<AddLookSheet />);
    const a = getId('addlook-tile-outdoor');
    const b = getId('addlook-tile-streetwear');
    // Both before the first add has finished (verify round 1, C5): a second back would also pop Here's your style.
    await act(async () => {
      void fireEvent.press(a as never);
      void fireEvent.press(b as never);
    });
    await flush();
    await advance(SETTLE_MS);
    expect(picks()).toEqual(['minimalist', 'workwear', 'outdoor']);
    expect((router.back as jest.Mock).mock.calls.length + (router.dismiss as jest.Mock).mock.calls.length).toBe(1);
  });
});

// ── SG5.1 · his words ─────────────────────────────────────────────────────────────────────────────────────────────
describe('SG5.1 · in his words', () => {
  const focus = () => (TextInput as unknown as { prototype: { focus: jest.Mock } }).prototype.focus;

  it('SG5.1 · the words link opens the field; typing turns Continue on', async () => {
    await setUpGame(store(), SCREEN_313);
    await mount(<StyleGameScreen />);
    expect(continueDisabled()).toBe(true);
    expect(textOf(getId('results-words-link'))).toBe(WORDS_LINK);
    expect(byId('results-words-input')).toBeNull();
    focus().mockClear();
    await press(buttonIn('results-words-link'));
    const field = getId('results-words-input');
    expect(field.props.placeholder).toBe(PLACEHOLDER);
    expect(field.props.maxLength).toBe(80);
    await advance(100);
    expect(focus()).toHaveBeenCalled();
    await typeIn(getId('results-words-input'), 'a');
    expect(continueDisabled()).toBe(false); // before Done
    await press(buttonIn('results-words-done'));
    expect(byId('results-words-input')).toBeNull();
    expect(textOf(getId('results-words-saved'))).toBe('In your words: "a"');
    expect(textOf(getId('results-words-edit'))).toBe('Edit');
    expect(await store().getKv('onboarding.otherStyle')).toBe('a');
    expect(continueDisabled()).toBe(false);
    await press(buttonIn('results-words-edit'));
    const reopened = getId('results-words-input').props;
    expect(reopened.value ?? reopened.defaultValue).toBe('a');
    // The keyboard's Done saves too; blank words bring the link back and Continue goes off again.
    await typeIn(getId('results-words-input'), '   ');
    await act(async () => {
      fireEvent(getId('results-words-input') as never, 'submitEditing');
    });
    await flush();
    expect(byId('results-words-input')).toBeNull();
    expect(byId('results-words-link')).not.toBeNull();
    expect(await store().getKv('onboarding.otherStyle')).toBeNull();
    expect(continueDisabled()).toBe(true);
  });

  it('SG5.1 · the field keeps its focus and survives a blur', async () => {
    await setUpGame(store(), SCREEN_304);
    await mount(<StyleGameScreen />);
    focus().mockClear();
    await press(buttonIn('results-words-link'));
    const field = getId('results-words-input');
    // autoFocus alone didn't hold on iOS (Nov 11): the screen focuses the field itself once it's on screen.
    expect(field.props.autoFocus).toBeFalsy();
    // A stray blur right after it opens doesn't take it away.
    await act(async () => {
      fireEvent(field as never, 'blur');
    });
    await flush();
    expect(byId('results-words-input')).not.toBeNull();
    await advance(100);
    expect(focus()).toHaveBeenCalled();
    expect(byId('results-words-input')).not.toBeNull();
  });
});

// ── SG6.1 · Nothing clicked yet ───────────────────────────────────────────────────────────────────────────────────
describe('SG6.1 · Nothing clicked yet', () => {
  it('SG6.1 · Nothing clicked yet', async () => {
    await setUpGame(store(), SCREEN_310);
    let r = await mount(<StyleGameScreen />);
    expect(textAt('results-title')).toBe(NONE_TITLE);
    expect(getId('results-title').props.accessibilityRole).toBe('header');
    expect(textAt('results-line')).toBe(NONE_LINE);
    const order = idsInOrder().filter((id) => ['results-add', 'results-words-link', 'results-continue', 'results-play-again'].includes(id));
    expect(order).toEqual(['results-add', 'results-words-link', 'results-continue', 'results-play-again']);
    expect(textOf(getId('results-add'))).toBe(ADD);
    expect(textOf(getId('results-words-link'))).toBe(WORDS_LINK);
    expect(textOf(getId('results-play-again'))).toBe(PLAY_AGAIN);
    expect(continueDisabled()).toBe(true);
    expect(idsInOrder().filter((id) => id.startsWith('results-row-'))).toEqual([]);
    expect(byId('rank-title')).toBeNull();
    await r.unmount();

    // With words saved from before (311): Continue on.
    endStyleGame();
    await store().wipe();
    await setUpGame(store(), { ...SCREEN_310, savedWords: 'all black' });
    r = await mount(<StyleGameScreen />);
    expect(textAt('results-title')).toBe(NONE_TITLE);
    expect(continueDisabled()).toBe(false);

    // A look added from here: Here's your style, the one-look line.
    await act(async () => {
      await addToResults(store(), 'outdoor' as StyleKey);
    });
    await flush();
    expect(textAt('results-title')).toBe(RES_TITLE);
    expect(textAt('results-line')).toBe(RES_ONE);
    expect(rowNames()).toEqual(['Outdoor']);
  });
});

// ── SG7.1 · the other outfit ──────────────────────────────────────────────────────────────────────────────────────
describe('SG7.1 · the other outfit', () => {
  it('SG7.1 · a tap shows the other outfit and lights the second dot', async () => {
    await setUpGame(store(), { seed: 42, me: [], cards: 0 });
    await mount(<StyleGameScreen />);
    expect(drawnIn('game-card')).toEqual(['workwear.0']);
    expect(flat(getId('game-card-dot-0')).backgroundColor).toBe(ink());
    await tapCard();
    expect(drawnIn('game-card')).toEqual(['workwear.1']);
    expect(flat(getId('game-card-dot-1')).backgroundColor).toBe(ink());
    expect(flat(getId('game-card-dot-0')).backgroundColor === ink()).toBe(false);
    expect(label('game-card')).toBe(cardLabel(1, 2, 'workwear'));
    expect(st().game.answers).toEqual([]);
    expect(announced()).toContain(cardLabel(1, 2, 'workwear'));
    expect(impacts()).toEqual([]);
    // A second tap toggles back, a third shows the other again.
    await tapCard();
    expect(drawnIn('game-card')).toEqual(['workwear.0']);
    await tapCard();
    expect(drawnIn('game-card')).toEqual(['workwear.1']);
    // The answer counts for the look; card 2 opens on its first outfit.
    await pressId('game-me');
    await advance(SETTLE_MS);
    expect(answers()).toEqual(['workwear Me']);
    expect(drawnIn('game-card')).toEqual(['classic_prep.0']);
    expect(flat(getId('game-card-dot-0')).backgroundColor).toBe(ink());
    expect(label('game-card')).toBe(cardLabel(2, 1, 'classic_prep'));
    expect(textAt('game-hint')).toBe(HINT);
    expect(textAt('game-peek-hint')).toBe(PEEK_HINT);
  });

  it('SG7.1 · a swipe answers without switching', async () => {
    await setUpGame(store(), { seed: 42, me: [], cards: 0 });
    await mount(<StyleGameScreen />);
    outfitMock().mockClear();
    await swipeCard(120);
    expect(answers()).toEqual(['workwear Me']);
    expect(everDrawn()).not.toContain('workwear.1');
    expect(drawnIn('game-card')).toEqual(['classic_prep.0']);
  });

  it('SG7.1 · VoiceOver\'s Another outfit action', async () => {
    await setUpGame(store(), { seed: 42, me: [], cards: 0 });
    await mount(<StyleGameScreen />);
    expect(actionsOf('game-card')).toContainEqual(['anotherOutfit', 'Another outfit']);
    await a11yAction('game-card', 'anotherOutfit');
    expect(drawnIn('game-card')).toEqual(['workwear.1']);
    expect(label('game-card')).toBe(cardLabel(1, 2, 'workwear'));
    expect(st().game.answers).toEqual([]);
  });

  it('SG7.1 · the two outfit dots sit at the top of the card', async () => {
    await setUpGame(store(), { seed: 42, me: [], cards: 0 });
    await mount(<StyleGameScreen />);
    const card = getId('game-card');
    const inCard = card.queryAll(() => true);
    const dot = inCard.findIndex((n) => n.props.testID === 'game-card-dot-0');
    const drawing = inCard.findIndex((n) => n.props.testID === 'mock-outfit');
    expect([dot >= 0, drawing >= 0]).toEqual([true, true]);
    // FS1: "two small dots at the top of the card". Either drawn before the drawing, or pinned to the card's top.
    const pinnedTop = ancestors(inCard[dot]!).filter((a) => inCard.includes(a) || a === card).some((a) => {
      const st = flat(a);
      return st.position === 'absolute' && st.top !== undefined && st.bottom === undefined;
    }) || (() => {
      const st = flat(inCard[dot]!);
      return st.position === 'absolute' && st.top !== undefined && st.bottom === undefined;
    })();
    expect(dot < drawing || pinnedTop).toBe(true);
  });
});

// ── SG7.2 · the full-list swap ────────────────────────────────────────────────────────────────────────────────────
describe('SG7.2 · Add a look on a full list', () => {
  // A walk through many renders: under the full suite's parallel load it has run past jest's 5 s (verify round 1, T3).
  it('SG7.2 · Add a look on a full list shows {name} in, {old} out with Undo', async () => {
    await setUpGame(store(), { seed: 42, me: OVW, prefer: OVW });
    expect(picks()).toEqual(OVW);
    const sheet = await mount(<AddLookSheet />);
    const tiles = idsInOrder().filter((id) => id.startsWith('addlook-tile-'));
    expect(tiles).toEqual(['streetwear', 'minimalist', 'smart_casual', 'classic_prep', 'tailored'].map((k) => `addlook-tile-${k}`));
    await press(getId('addlook-tile-streetwear'));
    await advance(SETTLE_MS);
    expect(picks()).toEqual(['outdoor', 'vintage_sport', 'streetwear']);
    const calls = (showToast as jest.Mock).mock.calls;
    expect(calls).toHaveLength(1);
    expect(calls[0]![0]).toBe('Streetwear in, Workwear out');
    expect(typeof calls[0]![1]).toBe('function');
    expect(toastWindowMs({ ms: (calls[0]![2] as { ms?: number } | undefined)?.ms }, false)).toBe(5000);
    // The toast host draws Undo for it.
    const host = await render(<ToastHost />);
    await flush();
    expect(screen.getAllByText(t('common.undo')).length).toBeGreaterThanOrEqual(1);
    await host.unmount();
    await act(async () => {
      await (calls[0]![1] as () => Promise<void>)();
    });
    await flush();
    expect(picks()).toEqual(OVW);
    await sheet.unmount();

    // Back after the swap (instead of Undo): the same three.
    await act(async () => {
      await addToResults(store(), 'streetwear' as StyleKey);
    });
    await mount(<StyleGameScreen />);
    expect(rowNames()).toEqual(['Outdoor', 'Vintage sport', 'Streetwear']);
    await press(backButton());
    await advance(SETTLE_MS);
    expect(rowNames()).toEqual(['Outdoor', 'Vintage sport', 'Workwear']);
    expect(idsInOrder().filter((id) => /^results-row-\d$/.test(id))).toHaveLength(3);
  }, 20000);
});

// ── SG7.3 · the results line ──────────────────────────────────────────────────────────────────────────────────────
describe('SG7.3 · the results line', () => {
  it('SG7.3 · the results line by the number of looks', async () => {
    await setUpGame(store(), SCREEN_304);
    let r = await mount(<StyleGameScreen />);
    expect(textAt('results-title')).toBe(RES_TITLE);
    expect(textAt('results-line')).toBe(RES_LINE);
    await press(getId('results-row-0-remove'));
    expect(rowNames()).toEqual(['Vintage sport', 'Outdoor']);
    expect(textAt('results-line')).toBe(RES_LINE); // 2 left
    await r.unmount();

    endStyleGame();
    await store().wipe();
    await setUpGame(store(), SCREEN_305);
    r = await mount(<StyleGameScreen />);
    expect(textAt('results-title')).toBe(RES_TITLE);
    expect(textAt('results-line')).toBe(RES_ONE);
    await press(getId('results-row-0-remove'));
    expect(rowNames()).toEqual([]);
    expect(textAt('results-title')).toBe(RES_TITLE); // not "Nothing clicked yet": he emptied it himself
    expect(textAt('results-line')).toBe(RES_EMPTY);
    await r.unmount();
  });
});

// ── SG7.4 · Back on card 1 ────────────────────────────────────────────────────────────────────────────────────────
describe('SG7.4 · Back', () => {
  // A walk through many renders: under the full suite's parallel load it has run past jest's 5 s (verify round 1, T3).
  it('SG7.4 · Back on card 1 goes to Welcome', async () => {
    await setUpGame(store(), { seed: 42, me: [], cards: 0 });
    let r = await mount(<StyleGameScreen />);
    await press(backButton());
    await advance(SETTLE_MS);
    expect((router.back as jest.Mock).mock.calls).toHaveLength(1);
    expect(replaces()).toEqual([]);
    expect(st().game).toEqual({ seed: 42, answers: [], rounds: [] });
    await r.unmount();
    // Forward again: the same card 1 of the same deal.
    r = await mount(<StyleGameScreen />);
    expect(label('game-card')).toBe(cardLabel(1, 1, 'workwear'));
    // No way back in the stack: Welcome by replace.
    mockT39.canGoBack = false;
    jest.clearAllMocks();
    await press(backButton());
    await advance(SETTLE_MS);
    expect((router.back as jest.Mock).mock.calls).toHaveLength(0);
    expect(replaces()).toEqual(['/onboarding/welcome']);
    await r.unmount();
    mockT39.canGoBack = true;

    // Answer 3, the screen goes and comes back: card 4 of the same deal, 3 answers kept.
    r = await mount(<StyleGameScreen />);
    await pressId('game-me');
    await advance(SETTLE_MS);
    await pressId('game-notme');
    await advance(SETTLE_MS);
    await pressId('game-me');
    await advance(SETTLE_MS);
    await r.unmount();
    r = await mount(<StyleGameScreen />);
    expect(label('game-card')).toBe(cardLabel(4, 1, 'minimalist'));
    expect(answers()).toEqual(['workwear Me', 'classic_prep Not me', 'streetwear Me']);
    // Back: card 3 again, 2 answers kept.
    jest.clearAllMocks();
    await press(backButton());
    await advance(SETTLE_MS);
    expect(label('game-card')).toBe(cardLabel(3, 1, 'streetwear'));
    expect(answers()).toEqual(['workwear Me', 'classic_prep Not me']);
    expect((router.back as jest.Mock).mock.calls).toHaveLength(0);
  }, 20000);

  it('SG7.4 · Back while an answered card is leaving undoes that answer, and only it', async () => {
    await setUpGame(store(), { seed: 42, me: [], cards: 0 });
    await mount(<StyleGameScreen />);
    await pressId('game-me');
    await advance(SETTLE_MS);
    await pressId('game-notme');
    await advance(SETTLE_MS);
    expect(label('game-card')).toBe(cardLabel(3, 1, 'streetwear'));
    // Me on card 3, then Back before the card has gone (on the phone the exit takes 240 ms; verify round 1, C3).
    // "Back undoes exactly one answer" (SG7): the Me was given, so Back undoes it and nothing before it.
    await pressId('game-me');
    await press(backButton());
    await advance(SETTLE_MS);
    expect(answers()).toEqual(['workwear Me', 'classic_prep Not me']);
    expect(label('game-card')).toBe(cardLabel(3, 1, 'streetwear'));
    // The same 50 ms after the tap.
    await pressId('game-me');
    await advance(50);
    await press(backButton());
    await advance(SETTLE_MS);
    expect(answers()).toEqual(['workwear Me', 'classic_prep Not me']);
    expect(label('game-card')).toBe(cardLabel(3, 1, 'streetwear'));
    expect((router.back as jest.Mock).mock.calls).toHaveLength(0);
    expect(replaces()).toEqual([]);
  });
});

// ── SG9.1 · VoiceOver, the largest text, Reduce Motion ────────────────────────────────────────────────────────────
describe('SG9.1 · access', () => {
  it('SG9.1 · the card reads Outfit n of 8 with Yes and No as its buttons', async () => {
    await setUpGame(store(), { seed: 42, me: ['workwear'], cards: 2 }); // 300: card 3, Streetwear
    const r = await mount(<StyleGameScreen />);
    const c = getId('game-card');
    expect(c.props.accessible).toBe(true);
    expect(c.props.accessibilityLabel).toBe(cardLabel(3, 1, 'streetwear'));
    for (const id of ['game-card-dot-0', 'game-card-dot-1', 'game-stamp-me', 'game-stamp-notme']) {
      expect([id, isHiddenFromAccessibility(getId(id) as never)]).toEqual([id, true]);
    }
    expect(textOf(getId('game-stamp-me'))).toBe(YES);
    expect(textOf(getId('game-stamp-notme'))).toBe(NO);
    // The drawing is inside the one card element (or hidden).
    const drawing = c.queryAll((n) => n.props.testID === 'mock-outfit' && typeof n.type === 'string')[0]!;
    expect(drawing).toBeDefined();
    expect(isHiddenFromAccessibility(drawing as never) || ancestors(drawing).some((a) => a.props.accessible === true)).toBe(true);
    expect(buttonIn('game-me').props.accessibilityLabel).toBe(YES);
    expect(buttonIn('game-notme').props.accessibilityLabel).toBe(NO);
    // No unlabeled button on the screen.
    const unlabeled = allNodes().filter((n) => typeof n.type === 'string' && n.props.accessibilityRole === 'button' && !n.props.accessibilityLabel && !textOf(n));
    expect(unlabeled.map((n) => String(n.props.testID))).toEqual([]);

    // The ranking's cards: buttons named by their second outfit.
    await r.unmount();
    endStyleGame();
    await setUpGame(store(), SCREEN_303);
    await mount(<StyleGameScreen />);
    expect([getId('rank-pick-left').props.accessibilityRole, label('rank-pick-left')]).toEqual(['button', desc('workwear', 1)]);
  });

  it('SG9.1 · results rows read n of total, name, line with Move up, Move down and Remove', async () => {
    await setUpGame(store(), SCREEN_304);
    await mount(<StyleGameScreen />);
    expect(label('results-row-0')).toBe('1 of 3, Streetwear. Hoodies, graphic tees, baggy jeans or cargos, big sneakers');
    expect(label('results-row-1')).toBe(rowLabel(2, 3, 'vintage_sport'));
    expect(label('results-row-2')).toBe(rowLabel(3, 3, 'outdoor'));
    const names = (id: string) => actionsOf(id).map((a) => a[0]).sort();
    expect(names('results-row-0')).toEqual(['moveDown', 'remove']);
    expect(names('results-row-1')).toEqual(['moveDown', 'moveUp', 'remove']);
    expect(names('results-row-2')).toEqual(['moveUp', 'remove']);
    expect(actionsOf('results-row-1')).toEqual(expect.arrayContaining([['moveUp', 'Move up'], ['moveDown', 'Move down'], ['remove', 'Remove']]));
    for (const id of ['results-row-0-number', 'results-row-0-remove', 'results-row-0-handle']) {
      expect([id, isHiddenFromAccessibility(getId(id) as never) || ancestors(getId(id)).some((a) => a.props.accessible === true)]).toEqual([id, true]);
    }
  });

  it('SG9.1 · moves and removals are announced', async () => {
    await setUpGame(store(), SCREEN_304);
    await mount(<StyleGameScreen />);
    await a11yAction('results-row-0', 'moveDown');
    expect(picks()).toEqual(['vintage_sport', 'streetwear', 'outdoor']);
    expect(rowNames()).toEqual(['Vintage sport', 'Streetwear', 'Outdoor']);
    expect(announced()).toContain('Streetwear, now 2 of 3');
    await a11yAction('results-row-1', 'moveUp');
    expect(picks()).toEqual(['streetwear', 'vintage_sport', 'outdoor']);
    expect(announced()).toContain('Streetwear, now 1 of 3');
    // Remove: as ×, with its toast (the toast host announces it).
    await a11yAction('results-row-2', 'remove');
    expect(picks()).toEqual(['streetwear', 'vintage_sport']);
    expect((showToast as jest.Mock).mock.calls.map((c) => c[0])).toEqual(['Removed Outdoor']);
  });

  // A walk through many renders: under the full suite's parallel load it has run past jest's 5 s (verify round 1, T3).
  it('SG9.1 · at accessibility sizes Yes and No stack, Yes on top', async () => {
    // Default size: side by side, Not me on the left.
    await setUpGame(store(), { seed: 42, me: [], cards: 0 });
    let r = await mount(<StyleGameScreen />);
    let ids = idsInOrder();
    expect(ids.indexOf('game-notme')).toBeLessThan(ids.indexOf('game-me'));
    expect(sharedDirection(getId('game-me'), getId('game-notme'))).toBe('row');
    await r.unmount();
    // AX: one column, Me first.
    mockT39.theme = themeFor({ ax: true });
    r = await mount(<StyleGameScreen />);
    ids = idsInOrder();
    expect(ids.indexOf('game-me')).toBeGreaterThan(-1);
    expect(ids.indexOf('game-me')).toBeLessThan(ids.indexOf('game-notme'));
    expect(sharedDirection(getId('game-me'), getId('game-notme'))).not.toBe('row');
    await r.unmount();

    // Results rows: the name and line under the drawing at AX, beside it at the default size.
    const nameBeside = async () => {
      const rr = await mount(<StyleGameScreen />);
      const row = getId('results-row-0');
      const drawing = row.queryAll((n) => n.props.testID === 'mock-outfit' && typeof n.type === 'string')[0]!;
      const name = row.queryAll((n) => n.type === 'Text' && textOf(n) === 'Streetwear')[0]!;
      const dir = sharedDirection(drawing, name);
      await rr.unmount();
      return dir;
    };
    endStyleGame();
    await setUpGame(store(), SCREEN_304);
    mockT39.theme = themeFor();
    expect(await nameBeside()).toBe('row');
    mockT39.theme = themeFor({ ax: true });
    expect(await nameBeside()).not.toBe('row');

    // The sheet: one column of tiles at AX (each tile about twice as wide as at the default size).
    const tileWidth = async () => {
      const rr = await mount(<AddLookSheet />);
      const w = Number(flat(getId('addlook-tile-streetwear')).width);
      await rr.unmount();
      return w;
    };
    endStyleGame();
    await setUpGame(store(), SCREEN_305);
    mockT39.theme = themeFor();
    const w1 = await tileWidth();
    mockT39.theme = themeFor({ ax: true });
    const wAx = await tileWidth();
    expect(wAx).toBeGreaterThanOrEqual(1.8 * w1);
  }, 20000);

  it('SG9.1 · under Reduce Motion an answered card fades', async () => {
    // Default: it flies off (240 ms, hundreds of points).
    await setUpGame(store(), { seed: 42, me: [], cards: 0 });
    let r = await mount(<StyleGameScreen />);
    timing.mockClear();
    await pressId('game-me');
    await advance(SETTLE_MS);
    const flies = timing.mock.calls.map((c) => c[1] as { toValue?: unknown; duration?: number }).filter((o) => typeof o.toValue === 'number' && Math.abs(o.toValue) >= 200);
    expect(flies.map((o) => o.duration)).toContain(240);
    await r.unmount();

    endStyleGame();
    reduceMotion();
    await setUpGame(store(), { seed: 42, me: [], cards: 0 });
    r = await mount(<StyleGameScreen />);
    timing.mockClear();
    spring.mockClear();
    await pressId('game-me');
    await advance(SETTLE_MS);
    expect(answers()).toEqual(['workwear Me']);
    const moves = [...timing.mock.calls, ...spring.mock.calls].map((c) => (c[1] as { toValue?: unknown }).toValue).filter((v) => typeof v === 'number' && Math.abs(v) > 1);
    expect(moves).toEqual([]);
    const fades = timing.mock.calls.map((c) => c[1] as { toValue?: unknown; duration?: number }).filter((o) => o.toValue === 0 && o.duration === 150);
    expect(fades.length).toBeGreaterThanOrEqual(1);
    await r.unmount();
  });

  it('SG9.1 · the results\' text buttons stop growing at 2×', async () => {
    mockT39.theme = themeFor({ ax: true });
    await setUpGame(store(), SCREEN_304);
    await mount(<StyleGameScreen />);
    // SG9: "button labels stop at 2× (CONTROL_TEXT_MAX_SCALE)" (verify round 1, C2).
    const capped = (id: string, words: string) => {
      const texts = getId(id).queryAll((n) => n.type === 'Text' && textOf(n) === words);
      return [id, texts.length > 0, texts.some((n) => n.props.maxFontSizeMultiplier === CONTROL_TEXT_MAX_SCALE)];
    };
    expect(CONTROL_TEXT_MAX_SCALE).toBe(2);
    expect(capped('results-add', ADD)).toEqual(['results-add', true, true]);
    expect(capped('results-words-link', WORDS_LINK)).toEqual(['results-words-link', true, true]);
    expect(capped('results-play-again', PLAY_AGAIN)).toEqual(['results-play-again', true, true]);
    await press(buttonIn('results-words-link'));
    expect(capped('results-words-done', 'Done')).toEqual(['results-words-done', true, true]);
    await typeIn(getId('results-words-input'), 'all black');
    await press(buttonIn('results-words-done'));
    expect(capped('results-words-edit', 'Edit')).toEqual(['results-words-edit', true, true]);
  });
});

// ── F1.1 · setup to Stylist ───────────────────────────────────────────────────────────────────────────────────────
describe('F1.1 · setup in 16 taps', () => {
  // A walk through many renders: under the full suite's parallel load it has run past jest's 5 s (verify round 1, T3).
  it('F1.1 · setup with 3 Me\'s is at most 16 taps to Stylist, the lesson\'s tap included', async () => {
    fixRandom(42);
    let presses = 0;
    let r = await mount(<WelcomeScreen />);
    await advance(5000);
    await press(screen.getByText('Get started'));
    presses++;
    await r.unmount();
    r = await mount(<StyleGameScreen />);
    // F1.1 is 18 taps to the camera since Nov 18 (#495): the card-1 lesson (SG1.4) keeps its own tap. In-screen that
    // is 16 (18 less Check my fit and Agree, as 15 came from 17): Get started, the lesson, 8 cards, up to 3
    // this-or-thats, Continue, an age, Continue. Seed 42 deals 3 this-or-thats, so the walk is exactly 16: one extra
    // tap anywhere fails it. A fresh install shows the lesson, so its tap is in this count, never skipped.
    expect(teachShown()).toBe(true);
    presses += await playStyleGame({ me: 3 });
    expect(textAt('results-title')).toBe(RES_TITLE);
    expect(st().results?.picks).toHaveLength(3);
    expect(st().game.rounds.length).toBeLessThanOrEqual(3);
    await pressId('results-continue');
    presses++;
    await advance(SETTLE_MS);
    await r.unmount();
    r = await mount(<BasicsScreen />);
    await press(getId('age-22-25'));
    presses++;
    await pressId('about-continue');
    presses++;
    await advance(5000);
    await r.unmount();
    expect(presses).toBeLessThanOrEqual(16);
    expect(pushes()).toEqual(['/onboarding/looks', '/onboarding/basics']);
    expect(replaces()).toEqual(['/']);
    expect([...pushes(), ...replaces()].filter((p) => /camera|paywall|sign-in|consent/.test(p))).toEqual([]);
    expect(life.fetchMock).toHaveBeenCalledTimes(0);
  }, 20000);
});

// ── SG1.4 · card 1 teaches the swipe (Nov 18, #494) ──────────────────────────────────────────────────────────────
// The flag: the swipe is taught once kv `onboarding.swipeTaught` holds any value (kept on this phone); dismissing the
// overlay writes it. setUpGame sets it unless `taught: false` (a fresh install).
describe('SG1.4 · card 1 teaches the swipe', () => {
  it('SG1.4 · on a fresh install card 1 shows the overlay; Yes, No and a swipe do nothing until a tap dismisses it', async () => {
    await setUpGame(store(), { seed: 42, me: [], cards: 0, taught: false });
    await mount(<StyleGameScreen />);
    expect(screen.getAllByText(TEACH)).toHaveLength(1);
    expect(label('game-card')).toBe(cardLabel(1, 1, 'workwear'));
    // Yes and No are dimmed and do nothing; a swipe is ignored.
    expect([isDisabled(buttonIn('game-me')), isDisabled(buttonIn('game-notme'))]).toEqual([true, true]);
    await pressId('game-me');
    await advance(SETTLE_MS);
    await pressId('game-notme');
    await advance(SETTLE_MS);
    // A swipe: an overlay laid over the card (inside it, or pinned over it) takes the touch first, so the card never
    // sees it; otherwise the card's own handlers must ignore it.
    const words = screen.getAllByText(TEACH)[0] as unknown as Node;
    const claimer = [words, ...ancestors(words)].find((n) => typeof n.props.onStartShouldSetResponder === 'function');
    const inCard = !!claimer && (claimer === getId('game-card') ? false : ancestors(claimer).includes(getId('game-card')));
    const pinned = !!claimer && [claimer, ...ancestors(claimer)].some((n) => flat(n).position === 'absolute');
    if (!(inCard || pinned)) {
      await swipeCard(120);
      await swipeCard(-120);
    }
    expect(st().game.answers).toEqual([]);
    expect(impacts()).toEqual([]);
    expect(label('game-card')).toBe(cardLabel(1, 1, 'workwear'));
    expect(teachShown()).toBe(true);
    expect(await store().getKv(TAUGHT_KEY)).toBeNull();
    // One tap dismisses it (and isn't a peek): the flag is written, Yes and No work.
    expect(await dismissTeach()).toBe(1);
    expect(teachShown()).toBe(false);
    expect(await store().getKv(TAUGHT_KEY)).not.toBeNull();
    expect(drawnIn('game-card')).toEqual(['workwear.0']);
    expect(st().game.answers).toEqual([]);
    expect([isDisabled(buttonIn('game-me')), isDisabled(buttonIn('game-notme'))]).toEqual([false, false]);
    await pressId('game-me');
    await advance(SETTLE_MS);
    expect(answers()).toEqual(['workwear Me']);
  });

  it('SG1.4 · the overlay shows on the first game only: not after Play again or a relaunch', async () => {
    await setUpGame(store(), { seed: 42, me: [], cards: 0, taught: false });
    let r = await mount(<StyleGameScreen />);
    expect(teachShown()).toBe(true);
    await dismissTeach();
    await act(async () => {
      await playAgain(store(), seedRandom(7));
    });
    await flush();
    expect(label('game-card')).toBe(cardLabel(1, 1, 'smart_casual'));
    expect(teachShown()).toBe(false);
    await r.unmount();
    // A relaunch: memory gone, the flag kept.
    endStyleGame();
    await act(async () => {
      await startOrResumeStyleGame(store(), seedRandom(9));
    });
    r = await mount(<StyleGameScreen />);
    expect(label('game-card')!.startsWith('Outfit 1 of 8, view 1 of 2. ')).toBe(true);
    expect(teachShown()).toBe(false);
    await pressId('game-notme');
    await advance(SETTLE_MS);
    expect(st().game.answers).toHaveLength(1);
    await r.unmount();
    // The flag is this phone's (a fresh install teaches again).
    expect(kvPolicy(TAUGHT_KEY)).toBe('local');
  });
});

// ── SG7.5 · FS4, the check on three fast No's (Nov 18, #494) ─────────────────────────────────────────────────────
// "Less than 1.5 s after its card appeared" is read on the screen's clock (Date.now, which jest's fake timers move
// with advance()); the T39 mocks fix sessionClock, so a timing read from it can't be told apart here.
describe('SG7.5 · Just checking', () => {
  const checkShown = () => screen.queryAllByText(CHECK).length > 0;
  /** No on the card in front of him, then the next card comes up (well under 1.5 s from card to card). */
  async function fastNo() {
    await pressId('game-notme');
    await advance(SETTLE_MS);
  }
  const noes = ['workwear Not me', 'classic_prep Not me', 'streetwear Not me'];

  it('SG7.5 · three fast No\'s show the check before card 4; Keep going goes on to card 4', async () => {
    await setUpGame(store(), { seed: 42, me: [], cards: 0 });
    await mount(<StyleGameScreen />);
    await fastNo();
    await fastNo();
    expect(checkShown()).toBe(false);
    await fastNo();
    expect(screen.getAllByText(CHECK)).toHaveLength(1);
    expect(screen.getByRole('button', { name: START_OVER })).toBeTruthy();
    expect(screen.getByRole('button', { name: KEEP_GOING })).toBeTruthy();
    expect(answers()).toEqual(noes);
    await press(screen.getByRole('button', { name: KEEP_GOING }));
    await advance(SETTLE_MS);
    expect(checkShown()).toBe(false);
    expect(label('game-card')).toBe(cardLabel(4, 1, 'minimalist'));
    expect(answers()).toEqual(noes);
  });

  it('SG7.5 · Start over goes back to card 1 of the same deal, and the check never shows twice', async () => {
    await setUpGame(store(), { seed: 42, me: [], cards: 0 });
    await mount(<StyleGameScreen />);
    await fastNo();
    await fastNo();
    await fastNo();
    expect(checkShown()).toBe(true);
    await press(screen.getByRole('button', { name: START_OVER }));
    await advance(SETTLE_MS);
    expect(checkShown()).toBe(false);
    expect(st().game).toEqual({ seed: 42, answers: [], rounds: [] });
    expect(label('game-card')).toBe(cardLabel(1, 1, 'workwear'));
    expect(teachShown()).toBe(false);
    // Three fast No's again: no second check.
    await fastNo();
    await fastNo();
    await fastNo();
    expect(checkShown()).toBe(false);
    expect(label('game-card')).toBe(cardLabel(4, 1, 'minimalist'));
    expect(answers()).toEqual(noes);
  });

  it('SG7.5 · no check when one No took 2 s, when Back came between, or with a Yes', async () => {
    // The control: the same screen does show it for three fast No's (so each "no check" below is the rule, not a
    // screen that never checks).
    await setUpGame(store(), { seed: 42, me: [], cards: 0 });
    let r = await mount(<StyleGameScreen />);
    await fastNo();
    await fastNo();
    await fastNo();
    expect(checkShown()).toBe(true);
    await r.unmount();
    // One slow No (card 2 up for about 2.6 s).
    endStyleGame();
    await setUpGame(store(), { seed: 42, me: [], cards: 0 });
    r = await mount(<StyleGameScreen />);
    await fastNo();
    await advance(2000);
    await fastNo();
    await fastNo();
    expect(checkShown()).toBe(false);
    expect(label('game-card')).toBe(cardLabel(4, 1, 'minimalist'));
    await r.unmount();
    // Back between: No, No, Back, No, No (three No's, all fast, a Back among them).
    endStyleGame();
    await setUpGame(store(), { seed: 42, me: [], cards: 0 });
    r = await mount(<StyleGameScreen />);
    await fastNo();
    await fastNo();
    await press(backButton());
    await advance(SETTLE_MS);
    expect(answers()).toEqual(['workwear Not me']);
    await fastNo();
    await fastNo();
    expect(answers()).toEqual(noes);
    expect(checkShown()).toBe(false);
    expect(label('game-card')).toBe(cardLabel(4, 1, 'minimalist'));
    await r.unmount();
    // A Yes among the first three.
    endStyleGame();
    await setUpGame(store(), { seed: 42, me: [], cards: 0 });
    r = await mount(<StyleGameScreen />);
    await pressId('game-me');
    await advance(SETTLE_MS);
    await fastNo();
    await fastNo();
    expect(checkShown()).toBe(false);
    expect(label('game-card')).toBe(cardLabel(4, 1, 'minimalist'));
    await r.unmount();
  }, 20000);
});

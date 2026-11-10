// T38 · Welcome and the Example check, drawn in code (specs/onboarding-screens.md OS1–OS2; tasks/T38/TESTING.md).
// The rendered half: both screens in every mode, with the swap's clock on Jest's fake timers. No photo may be looked
// up or drawn, the card shows only what the example gives, the swap plays once, VoiceOver sees one card element, and
// nothing is sent or saved. The mocks and helpers are shared with the two other T38 screen files (src/testing).
//
// Profile (CLAUDE.md rule 6): s14 is a stock photo's bundled reading, "profile unknown", run with one stated test
// profile: occasion everyday, no picked looks, boldness null, an empty closet, a first check. No photo is used here.
import {
  advance, allNodes, allTexts, artIn, byId, expectNoPhoto, getId, mockT38, mount, press, setAppState, storeIsEmpty, textAt, textOf,
  themeFor, tree, setUpT38Tests,
} from '@/testing/t38ScreenMocks';
import { isHiddenFromAccessibility, screen, within } from '@testing-library/react-native';
import type { Reading } from '@kitted/core';
import { router } from 'expo-router';
import { setStatusBarStyle, StatusBar } from 'expo-status-bar';
import { PartsBreakdown } from '@/features/why/PartsBreakdown';
import { ExampleCheckScreen } from '@/features/onboarding/ExampleCheckScreen';
import { exampleCheck } from '@/features/onboarding/exampleCheck';
import { drawnPieces } from '@/features/onboarding/outfitDrawing';
import { welcomeExample } from '@/features/onboarding/welcomeExample';
import { WelcomeScreen } from '@/features/onboarding/WelcomeScreen';

const life = setUpT38Tests();

// ── The engine's own answer and the words ─────────────────────────────────────────────────────────────────────────
const CARD_LABEL =
  'Example fit check. Everyday. 7.5 out of 10, Put together. One fix: Swap the chunky sneakers for low-profile sneakers. 8 out of 10, Sharp.';
const BUBBLE_LABEL = 'Drawn example outfit, Everyday: Charcoal denim jacket, White sweater, Grey drawstring trousers, Grey chunky sneakers.';
const EXAMPLE_CARD_LABEL = 'Example fit check. Everyday. Score 7.5 out of 10, Put together. Good base. Swapping one piece gets you to 8.0.';
const FIX = 'Swap the chunky sneakers for low-profile sneakers';
const FIX_TAG = 'Raises Shoes to 8 · free if you own one';
const NEXT = 'Clean chunky sneakers lift Shoes to 7.5. Not enough to move the score yet.';
const SUMMARY = 'Good base. Swapping one piece gets you to 8.0.';
const INTRO = "Here's an example check. This is what you'll get.";
const NOTE = 'A drawn example, scored by the same code as your photos. Nothing was sent.';
const TITLE = 'Look put together.\nWithout trying\ntoo hard.';
const BODY = 'Send a fit. Get a score out of 10 and the two or three moves that raise it.';

// ── OS1.1 · no photo ──────────────────────────────────────────────────────────────────────────────────────────────
describe('OS1.1 · Welcome and the Example check show no photo', () => {
  it('OS1.1 · Welcome renders the drawn outfit and no photo', async () => {
    const configs = [
      { accounts: false, scheme: 'light' as const, ax: false },
      { accounts: true, scheme: 'light' as const, ax: false },
      { accounts: false, scheme: 'dark' as const, ax: false },
      { accounts: true, scheme: 'dark' as const, ax: false },
      { accounts: false, scheme: 'light' as const, ax: true },
      { accounts: true, scheme: 'dark' as const, ax: true },
    ];
    for (const c of configs) {
      mockT38.accounts = c.accounts;
      mockT38.theme = themeFor({ scheme: c.scheme, ax: c.ax });
      const r = await mount(<WelcomeScreen />);
      expect(byId('welcome-drawing')).not.toBeNull();
      expect(artIn(byId('welcome-drawing')).length).toBe(4);
      expectNoPhoto();
      await advance(3000);
      expect(byId('welcome-drawing')).not.toBeNull();
      expectNoPhoto();
      await r.unmount();
    }
  });

  it('OS1.1 · the Example check renders the drawn bubble and no photo, from Welcome and as a sheet', async () => {
    const modes: { mode: 'screen' | 'sheet'; params: Record<string, string> }[] = [
      { mode: 'screen', params: {} },
      { mode: 'screen', params: { from: 'consent' } },
      { mode: 'sheet', params: {} },
    ];
    for (const m of modes) {
      for (const look of [{ scheme: 'light' as const, ax: false }, { scheme: 'dark' as const, ax: false }, { scheme: 'light' as const, ax: true }]) {
        mockT38.params = m.params;
        mockT38.theme = themeFor(look);
        const r = await mount(<ExampleCheckScreen mode={m.mode} />);
        expect(byId('example-bubble')).not.toBeNull();
        expect(artIn(byId('example-bubble')).length).toBe(4);
        expectNoPhoto();
        await press(screen.getByText('Why 7.5?'));
        expectNoPhoto();
        await r.unmount();
      }
    }
  });

});

// ── OS1.2 · the numbers are the engine's, nothing typed in ────────────────────────────────────────────────────────
describe('OS1.2 · the card and the drawing come from the scored reading', () => {
  it('OS1.2 · the drawing is drawn from the scored reading, before and after', async () => {
    const w = welcomeExample()!;
    const before = drawnPieces(w.reading);
    const after = drawnPieces(w.afterReading);
    const shoesBefore = before.find((p) => p.slot === 'shoes')!.spec;
    const shoesAfter = after.find((p) => p.slot === 'shoes')!.spec;
    await mount(<WelcomeScreen />);
    const drawn0 = artIn(byId('welcome-drawing'));
    expect(drawn0).toHaveLength(4);
    expect(drawn0).toEqual(expect.arrayContaining(before.map((p) => p.spec)));
    for (const p of before) expect(artIn(byId(`drawn-piece-${p.slot}`))).toEqual([p.spec]);
    expect(byId('drawn-piece-shoes-after')).toBeNull();

    await advance(1150);
    const drawn1 = artIn(byId('welcome-drawing'));
    expect(drawn1).toHaveLength(5);
    expect(drawn1).toEqual(expect.arrayContaining([...before.map((p) => p.spec), shoesAfter]));
    expect(artIn(byId('drawn-piece-shoes'))).toEqual([shoesBefore]);
    expect(artIn(byId('drawn-piece-shoes-after'))).toEqual([shoesAfter]);

    await advance(900);
    const drawn2 = artIn(byId('welcome-drawing'));
    expect(drawn2).toHaveLength(4);
    expect(drawn2).toEqual(expect.arrayContaining([...before.filter((p) => p.slot !== 'shoes').map((p) => p.spec), shoesAfter]));
    expect(drawn2).not.toContainEqual(shoesBefore);
    expect(byId('drawn-piece-shoes')).toBeNull();
    expect(artIn(byId('drawn-piece-shoes-after'))).toEqual([shoesAfter]);
    for (const p of before.filter((x) => x.slot !== 'shoes')) expect(artIn(byId(`drawn-piece-${p.slot}`))).toEqual([p.spec]);
  });
});

// ── OS1.3 · the swap plays once, then holds still ─────────────────────────────────────────────────────────────────
function expectBefore() {
  expect(textAt('welcome-card-score')).toBe('7.5');
  expect(textAt('welcome-card-word-before')).toBe('Put together');
  expect(textAt('welcome-card-detail-before')).toBe('Full check');
  expect(byId('drawn-piece-shoes')).not.toBeNull();
  expect(byId('drawn-piece-shoes-after')).toBeNull();
  expect(byId('welcome-card-word-after')).toBeNull();
  expect(byId('welcome-card-detail-after')).toBeNull();
}
function expectAfter() {
  expect(textAt('welcome-card-score')).toBe('8.0');
  expect(textAt('welcome-card-word-after')).toBe('Sharp');
  expect(textAt('welcome-card-detail-after')).toBe(FIX);
  expect(byId('drawn-piece-shoes-after')).not.toBeNull();
  expect(byId('drawn-piece-shoes')).toBeNull();
  expect(byId('welcome-card-word-before')).toBeNull();
  expect(byId('welcome-card-detail-before')).toBeNull();
}

describe('OS1.3 · the swap', () => {
  it('OS1.3 · it plays once on open and then holds still', async () => {
    await mount(<WelcomeScreen />);
    expectBefore();
    await advance(600);
    expectBefore();
    // The count, sampled every 50 ms: through every tenth, never a half-step jump.
    const seen: string[] = ['7.5'];
    for (let tMs = 650; tMs <= 1150; tMs += 50) {
      await advance(50);
      const n = textAt('welcome-card-score');
      if (seen[seen.length - 1] !== n) seen.push(n);
    }
    expect(textAt('welcome-card-score')).toBe('7.7');
    expect(byId('drawn-piece-shoes')).not.toBeNull();
    expect(byId('drawn-piece-shoes-after')).not.toBeNull();
    expect(textAt('welcome-card-word-before')).toBe('Put together');
    for (let tMs = 1200; tMs <= 2050; tMs += 50) {
      await advance(50);
      const n = textAt('welcome-card-score');
      if (seen[seen.length - 1] !== n) seen.push(n);
    }
    expect(seen).toEqual(['7.5', '7.6', '7.7', '7.8', '7.9', '8.0']);
    expectAfter();
    const still = tree();
    await advance(10000);
    expect(tree()).toBe(still);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("OS1.3 · it doesn't replay from the background, and replays only on a new mount", async () => {
    const r = await mount(<WelcomeScreen />);
    await advance(2500);
    expectAfter();
    await setAppState('background');
    await setAppState('active');
    await advance(3000);
    expectAfter();
    // A re-render (a new theme object, same settings) doesn't replay it either.
    mockT38.theme = themeFor();
    await r.rerender(<WelcomeScreen />);
    expectAfter();
    await advance(3000);
    expectAfter();
    await r.unmount();

    // Backgrounded mid-play and back four seconds later: the after state, not a restart from 7.5.
    const r2 = await mount(<WelcomeScreen />);
    await advance(1000);
    await setAppState('background');
    await advance(4000);
    await setAppState('active');
    await advance(20);
    expectAfter();
    await advance(3000);
    expectAfter();
    await r2.unmount();

    // A new mount plays again from the start; nothing was stored to remember it.
    await mount(<WelcomeScreen />);
    expectBefore();
    await advance(2050);
    expectAfter();
    expect(life.watch.writes).toEqual([]);
    expect(life.watch.changes).toEqual([]);
  });

  it('OS1.3 · Reduce Motion: the after state from the first frame, no timer', async () => {
    mockT38.theme = themeFor({ reduceMotion: true });
    await mount(<WelcomeScreen />);
    expectAfter();
    expect(jest.getTimerCount()).toBe(0);
    const still = tree();
    await advance(3000);
    expect(tree()).toBe(still);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('OS1.3 · Reduce Motion turned on mid-play jumps to the after state', async () => {
    const r = await mount(<WelcomeScreen />);
    await advance(1050);
    expect(textAt('welcome-card-score')).toBe('7.6');
    mockT38.theme = themeFor({ reduceMotion: true });
    await r.rerender(<WelcomeScreen />);
    expectAfter();
    await advance(20);
    expect(jest.getTimerCount()).toBe(0);
    const still = tree();
    await advance(3000);
    expect(tree()).toBe(still);
  });

  it('OS1.3 · an accessibility text size shows the after state with no animation', async () => {
    mockT38.theme = themeFor({ ax: true });
    await mount(<WelcomeScreen />);
    expect(byId('welcome-card')).not.toBeNull();
    expect(byId('welcome-drawing')).not.toBeNull();
    expectAfter();
    expect(jest.getTimerCount()).toBe(0);
    const still = tree();
    await advance(3000);
    expect(tree()).toBe(still);
  });

  it('OS1.3 · Get started works during the swap', async () => {
    const r = await mount(<WelcomeScreen />);
    await advance(300);
    await press(screen.getByText('Get started'));
    expect(await mockT38.store.getKv('onboarding.step')).toBe('looks');
    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith('/onboarding/looks');
    await r.unmount();

    jest.mocked(router.push).mockClear();
    await mount(<WelcomeScreen />);
    await advance(300);
    await press(screen.getByText('See an example check'));
    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith('/onboarding/example');
  });

  it('OS1.3 · the demo slow factor stretches it', async () => {
    mockT38.slow = 10;
    await mount(<WelcomeScreen />);
    await advance(1100);
    expectBefore();
    await advance(4800);
    expectBefore();
    await advance(11500 - 5900);
    expect(textAt('welcome-card-score')).toBe('7.7');
    expect(byId('drawn-piece-shoes-after')).not.toBeNull();
    await advance(20500 - 11500);
    expectAfter();
    expect(jest.getTimerCount()).toBe(0);
  });
});

// ── OS1.4 · words, VoiceOver, status bar, nothing cut ─────────────────────────────────────────────────────────────
describe('OS1.4 · Welcome reads as before', () => {
  it('OS1.4 · Welcome shows its headline, body and buttons, with sign-in only when accounts are on', async () => {
    const r = await mount(<WelcomeScreen />);
    const exactly = (s: string) => allNodes().filter((n) => n.type === 'Text' && textOf(n) === s);
    for (const s of [TITLE, BODY, 'Get started', 'See an example check']) expect([s, exactly(s).length]).toEqual([s, 1]);
    expect(exactly(TITLE)[0]!.props.accessibilityRole).toBe('header');
    expect(screen.queryByText('I already have an account')).toBeNull();
    await r.unmount();

    mockT38.accounts = true;
    await mount(<WelcomeScreen />);
    for (const s of [TITLE, BODY, 'Get started', 'See an example check', 'I already have an account']) expect([s, exactly(s).length]).toEqual([s, 1]);
    await press(screen.getByText('I already have an account'));
    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith({ pathname: '/sheets/sign-in', params: { from: 'welcome' } });
  });

  it('OS1.4 · VoiceOver: the drawing is hidden and the card is one element with the same label in every frame', async () => {
    await mount(<WelcomeScreen />);
    const drawing = getId('welcome-drawing');
    expect(drawing.props.accessibilityElementsHidden).toBe(true);
    expect(drawing.props.importantForAccessibility).toBe('no-hide-descendants');
    const labels: unknown[] = [];
    for (const step of [0, 1150, 900]) {
      await advance(step);
      const card = getId('welcome-card');
      expect(card.props.accessible).toBe(true);
      labels.push(card.props.accessibilityLabel);
      // One element: nothing inside it is its own VoiceOver stop, and it does nothing on tap.
      expect(card.queryAll((n) => n !== card && n.type !== 'Text' && n.props.accessible === true)).toHaveLength(0);
      expect(card.queryAll((n) => n.props.accessibilityRole === 'button' || n.props.onPress !== undefined)).toHaveLength(0);
      expect(card.props.onPress).toBeUndefined();
      expect(card.props.accessibilityRole === 'button').toBe(false);
      for (const art of screen.getAllByTestId('garment-art')) expect(isHiddenFromAccessibility(art)).toBe(true);
    }
    expect(labels).toEqual([CARD_LABEL, CARD_LABEL, CARD_LABEL]);
  });

  it('OS1.4 · the status bar is no longer forced', async () => {
    for (const scheme of ['light', 'dark'] as const) {
      mockT38.theme = themeFor({ scheme });
      const r = await mount(<WelcomeScreen />);
      await advance(2500);
      await r.unmount();
    }
    expect(setStatusBarStyle).toHaveBeenCalledTimes(0);
    const forced = jest.mocked(StatusBar).mock.calls.filter((c) => {
      const style = (c[0] as { style?: string }).style;
      return style !== undefined && style !== 'auto';
    });
    expect(forced).toEqual([]);
  });

  it('OS1.4 · nothing in the card is cut to a line count', async () => {
    const cut = () =>
      getId('welcome-card')
        .queryAll((n) => n.type === 'Text' && (n.props.numberOfLines !== undefined || n.props.adjustsFontSizeToFit === true))
        .map(textOf);
    const r = await mount(<WelcomeScreen />);
    for (const step of [0, 1150, 900]) {
      await advance(step);
      expect(cut()).toEqual([]);
    }
    await r.unmount();
    mockT38.theme = themeFor({ ax: true });
    await mount(<WelcomeScreen />);
    expect(cut()).toEqual([]);
    expect(textAt('welcome-card-detail-after')).toBe(FIX);
  });
});

// ── OS2.1 · the Example check ─────────────────────────────────────────────────────────────────────────────────────
describe('OS2.1 · the Example check shows the drawn outfit', () => {
  it('OS2.1 · the Example check shows the drawn bubble, the before card, the intro and the caption', async () => {
    await mount(<ExampleCheckScreen />);
    expect(screen.getAllByText('Kit')).toHaveLength(1);
    expect(screen.getAllByText(INTRO)).toHaveLength(1);
    // The bubble: one image, the before state, the caption row, not tappable.
    const bubble = getId('example-bubble');
    expect(bubble.props.accessible).toBe(true);
    expect(bubble.props.accessibilityRole).toBe('image');
    expect(bubble.props.accessibilityLabel).toBe(BUBBLE_LABEL);
    const pieces = drawnPieces((exampleCheck() as unknown as { reading: Reading }).reading);
    const drawn = artIn(bubble);
    expect(drawn).toHaveLength(4);
    expect(drawn).toEqual(expect.arrayContaining(pieces.map((p) => p.spec)));
    for (const p of pieces) expect(artIn(byId(`drawn-piece-${p.slot}`))).toEqual([p.spec]);
    expect(byId('drawn-piece-shoes-after')).toBeNull();
    const bubbleTexts = bubble.queryAll((n) => n.type === 'Text').map(textOf);
    expect(bubbleTexts).toEqual(expect.arrayContaining(['Everyday', 'Example']));
    expect(bubble.queryAll((n) => n.props.onPress !== undefined || n.props.onClick !== undefined || n.props.onResponderRelease !== undefined)).toHaveLength(0);
    expect(bubble.props.onPress).toBeUndefined();
    expect(bubble.props.onClick).toBeUndefined();
    // The result card, read-only, the before state (7.5); the after state isn't shown here.
    const card = getId('example-card');
    expect(card.props.accessibilityLabel).toBe(EXAMPLE_CARD_LABEL);
    const inCard = within(screen.getByTestId('example-card'));
    for (const s of ['Example · Full', 'Everyday', '7.5', 'Put together', SUMMARY, '1', FIX, FIX_TAG, '→ 8.0', 'Next level', NEXT, 'Why 7.5?']) {
      expect([s, inCard.queryAllByText(s).length]).toEqual([s, 1]);
    }
    const texts = allTexts();
    expect(texts.filter((x) => x === '8.0' || x === 'Sharp')).toEqual([]);
    expect(texts.filter((x) => /Not quite right|Re-check|Share/.test(x))).toEqual([]);
    expect(textAt('example-note')).toBe(NOTE);
    expect(within(screen.getByTestId('example-dock')).getAllByText('Get started')).toHaveLength(1);
    expect(byId('example-math')).toBeNull();
    expect(byId('example-root')).not.toBeNull();
    // Back on the bar (from Welcome), no Close.
    expect(screen.getAllByLabelText('Back')).toHaveLength(1);
    expect(screen.queryByLabelText('Close')).toBeNull();
    // The dock from Welcome: step looks, then Looks.
    await press(within(screen.getByTestId('example-dock')).getByText('Get started'));
    expect(await mockT38.store.getKv('onboarding.step')).toBe('looks');
    expect(router.push).toHaveBeenCalledWith('/onboarding/looks');
  });

  it('OS2.1 · Why 7.5? opens the math in place and Hide the math closes it', async () => {
    await mount(<ExampleCheckScreen />);
    expect(byId('example-math')).toBeNull();
    await press(screen.getByText('Why 7.5?'));
    expect(byId('example-math')).not.toBeNull();
    expect(within(screen.getByTestId('example-math')).getAllByTestId('mock-parts-breakdown')).toHaveLength(1);
    const call = jest.mocked(PartsBreakdown).mock.calls.at(-1)![0] as { parts: unknown; score: number };
    expect(call.parts).toBe(exampleCheck()!.why);
    expect(call.score).toBe(7.5);
    expect(screen.getAllByText('Hide the math')).toHaveLength(1);
    expect(screen.queryByText('Why 7.5?')).toBeNull();
    await press(screen.getByText('Hide the math'));
    expect(byId('example-math')).toBeNull();
    expect(screen.getAllByText('Why 7.5?')).toHaveLength(1);
    expect(screen.queryByText('Hide the math')).toBeNull();
    // Tapping the score opens it too.
    await press(screen.getByTestId('mock-score-block'));
    expect(byId('example-math')).not.toBeNull();
    expect(screen.getAllByText('Hide the math')).toHaveLength(1);
  });

  it('OS2.1 · as a sheet, from Consent and from Welcome, it keeps its words and its way out', async () => {
    // As a sheet: a Close circle, no Back; Check my own fit closes it and opens the agreement.
    const a = await mount(<ExampleCheckScreen mode="sheet" />);
    expect(screen.getAllByText(INTRO)).toHaveLength(1);
    expect(getId('example-bubble').props.accessibilityLabel).toBe(BUBBLE_LABEL);
    expect(getId('example-card').props.accessibilityLabel).toBe(EXAMPLE_CARD_LABEL);
    expect(textAt('example-note')).toBe(NOTE);
    expect(screen.queryByLabelText('Back')).toBeNull();
    expect(within(screen.getByTestId('example-dock')).getAllByText('Check my own fit')).toHaveLength(1);
    expect(screen.queryByText('Get started')).toBeNull();
    await press(screen.getByLabelText('Close'));
    expect(router.back).toHaveBeenCalledTimes(1);
    jest.mocked(router.back).mockClear();
    await press(screen.getByText('Check my own fit'));
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledTimes(0);
    await advance(349);
    expect(router.push).toHaveBeenCalledTimes(0);
    await advance(1);
    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith('/sheets/consent');
    await a.unmount();

    // From Consent: Check my own fit goes back.
    jest.clearAllMocks();
    mockT38.params = { from: 'consent' };
    const b = await mount(<ExampleCheckScreen />);
    expect(within(screen.getByTestId('example-dock')).getAllByText('Check my own fit')).toHaveLength(1);
    await press(screen.getByText('Check my own fit'));
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledTimes(0);
    await b.unmount();

    // From Welcome: Back goes back, or to Welcome when there's nothing to go back to.
    jest.clearAllMocks();
    mockT38.params = {};
    const c = await mount(<ExampleCheckScreen />);
    await press(screen.getByLabelText('Back'));
    expect(router.back).toHaveBeenCalledTimes(1);
    await c.unmount();
    jest.clearAllMocks();
    mockT38.canGoBack = false;
    await mount(<ExampleCheckScreen />);
    await press(screen.getByLabelText('Back'));
    expect(router.back).toHaveBeenCalledTimes(0);
    expect(router.replace).toHaveBeenCalledWith('/onboarding/welcome');
  });

  it("OS2.1 · at accessibility sizes the bubble's caption moves under it", async () => {
    mockT38.theme = themeFor({ ax: true });
    await mount(<ExampleCheckScreen />);
    const bubble = getId('example-bubble');
    expect(bubble.props.accessibilityLabel).toBe(BUBBLE_LABEL);
    expect(bubble.props.accessibilityRole).toBe('image');
    const bubbleTexts = bubble.queryAll((n) => n.type === 'Text').map(textOf);
    expect(bubbleTexts.filter((x) => x === 'Everyday' || x === 'Example')).toEqual([]);
    const below = screen.getAllByText('Everyday · Example');
    expect(below).toHaveLength(1);
    expect(isHiddenFromAccessibility(below[0]!)).toBe(true);
    expect(screen.queryAllByText('Example')).toHaveLength(0);
  });

});

// ── OS2.2 · nothing sent, nothing saved ───────────────────────────────────────────────────────────────────────────
describe('OS2.2 · opening the example sends and saves nothing', () => {
  it('OS2.2 · opening the Example check from Welcome sends and saves nothing', async () => {
    await mount(<ExampleCheckScreen />);
    await advance(5000);
    await press(screen.getByText('Why 7.5?'));
    await press(screen.getByText('Hide the math'));
    await press(screen.getByLabelText('Back'));
    await advance(1000);
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(life.watch.writes).toEqual([]);
    expect(life.watch.changes).toEqual([]);
    await storeIsEmpty();
  });

  it('OS2.2 · opening it as a sheet from See an example sends and saves nothing', async () => {
    // Opened twice in a row (the memoised example), then left by Close and by Check my own fit.
    const a = await mount(<ExampleCheckScreen mode="sheet" />);
    await advance(5000);
    await press(screen.getByText('Why 7.5?'));
    await press(screen.getByText('Hide the math'));
    await press(screen.getByLabelText('Close'));
    await a.unmount();
    await mount(<ExampleCheckScreen mode="sheet" />);
    await press(screen.getByText('Check my own fit'));
    await advance(1000);
    expect(router.push).toHaveBeenCalledWith('/sheets/consent');
    expect(life.watch.writes).toEqual([]);
    expect(life.watch.changes).toEqual([]);
    await storeIsEmpty();
  });

  it('OS2.2 · opening the math and leaving send and save nothing', async () => {
    mockT38.params = { from: 'consent' };
    const r = await mount(<ExampleCheckScreen />);
    await press(screen.getByText('Why 7.5?'));
    await advance(2000);
    await press(screen.getByText('Check my own fit'));
    await r.unmount();
    mockT38.params = {};
    const r2 = await mount(<ExampleCheckScreen />);
    await press(screen.getByText('Why 7.5?'));
    await r2.unmount();
    await advance(2000);
    expect(life.watch.writes).toEqual([]);
    expect(life.watch.changes).toEqual([]);
    await storeIsEmpty();
  });

  it('OS2.2 · Welcome itself sends and saves nothing until Get started', async () => {
    await mount(<WelcomeScreen />);
    await advance(3000);
    await press(screen.getByText('See an example check'));
    expect(life.watch.writes).toEqual([]);
    expect(life.watch.changes).toEqual([]);
    await storeIsEmpty();
    await press(screen.getByText('Get started'));
    await advance(10);
    expect(life.watch.writes).toEqual(['kv:onboarding.step=looks']);
    expect(await mockT38.store.getKv('onboarding.step')).toBe('looks');
    expect(await mockT38.store.fitChecks.all()).toEqual([]);
    expect(await mockT38.store.chat.all()).toEqual([]);
  });
});

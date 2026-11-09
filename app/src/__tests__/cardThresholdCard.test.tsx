// T55 (F6.2): the morning card as he sees it. A card that waits for a second outfit says why and offers only the
// camera; a checked card that suggested nothing reads "Today's fit" / "Tonight's fit" under his check's occasion; a
// checked card that suggested an outfit keeps "You went with your own" and its own occasion. The contract:
// tasks/T55/TESTING.md.
//
// The real card over a memory store filled by the real services (morning card, onboarding, fit check with the mock
// reading source and a bundled demo photo, p01b: a stock photo, "profile unknown", run with the seed's firstRun
// answers). The app's SQLite store, quota, weather, router and location module are replaced; Reanimated runs on its
// own Jest mock, so the design system renders as it is.
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { US_EASTERN, type DayWeather } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import type { KittedStore } from '@/data/store';
import type { ClosetItemRow } from '@/data/types';
import { createFitCheckService, DEFAULT_TIMERS } from '@/features/fitcheck/service';
import { createMorningService } from '@/features/morning/service';
import { completeOnboarding } from '@/features/onboarding/complete';
import { occasionLabel } from '@/features/stylist/thread';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { demoImagePrep } from '@/services/imagePrep/demo';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { realScheduler } from '@/services/scheduler';
import type { WeatherSource } from '@/services/weather';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
// The app's store and clock: forwarded to the memory store and manual clock each test sets (read lazily: the app's
// morning service is built at import).
jest.mock('@/data/db', () => {
  const ref: { store: unknown; clock: unknown } = { store: null, clock: null };
  return { ref, store: new Proxy({}, { get: (_t, k) => (ref.store as Record<string | symbol, unknown> | null)?.[k] }) };
});
jest.mock('@/state/session', () => {
  const c = () => (jest.requireMock('@/data/db') as { ref: { clock: { nowMs(): number; now(): Date; offset(u: number): number } } }).ref.clock;
  return {
    ...jest.requireActual('@/state/session'),
    sessionClock: { nowMs: () => c().nowMs(), now: () => c().now(), offset: (u: number) => c().offset(u) },
  };
});
jest.mock('@/features/fitcheck/session', () => ({
  quota: { snapshot: async () => ({ pro: false, checksUsed: 0, checkLimit: 7, tier: 'free' }) },
}));
jest.mock('@/services/weather', () => ({
  weatherSource: { kind: 'sample', permission: async () => 'granted', requestPermission: async () => 'granted', forecast: async () => null },
  isLiveWeather: () => false,
  isWeatherKitWeather: () => false,
}));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('../../modules/kitted-location', () => ({ weatherKitLegalUrl: async () => null }));
jest.mock('@/router/stylistAction', () => ({ setStylistAction: jest.fn() }));

// After the mocks (Jest hoists them; these read the mocked modules).
import { displayScore, scoreWordLabel, ThemeProvider } from '@/design-system';
import { MorningCard } from '@/features/morning/MorningCard';
import { setStylistAction } from '@/router/stylistAction';

const ref = (jest.requireMock('@/data/db') as { ref: { store: KittedStore | null; clock: ReturnType<typeof manualClock> | null } }).ref;

const at = (iso: string) => Date.parse(iso);
const SEED_AS_OF = at('2026-10-20T07:00:00-04:00');
const DAY = '2026-10-22T07:40:00-04:00';
const DAY_ID = '2026-10-22|day';
const EVENING = '2026-10-22T18:30:00-04:00';
const EVENING_ID = '2026-10-22|evening';
const MILD: DayWeather = { window: 'day', nowF: 58, highF: 66, lowF: 52, feelsLowF: 50, feelsHighF: 65, precipChance: 0.1, precipFromHour: null, condition: 'clear' } as DayWeather;
const ANSWERS = seed.scenarios.firstRun.onboardingAnswers;

const ONE = ['T1', 'B1', 'S1'];
const ONE_L = [...ONE, 'L1'];
const TWO_TOPS = ['T1', 'T2', 'B1', 'S1'];

type Answer = 'mild' | null;
function weatherDouble(answers: Answer[] = []): WeatherSource {
  const queue = [...answers];
  return {
    kind: 'sample',
    permission: async () => 'granted',
    requestPermission: async () => 'granted',
    forecast: async (window) => ((queue.length ? queue.shift() : 'mild') === null ? null : { ...MILD, window }),
  };
}

async function seededStore(keep: readonly string[] | null): Promise<KittedStore> {
  const store = createMemoryStore();
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: SEED_AS_OF });
  if (keep) for (const c of await store.closet.all()) if (!keep.includes(c.id)) await store.closet.put({ ...c, isDeleted: true } as ClosetItemRow);
  return store;
}

/** One app: a store, a clock, an id counter, the morning service and the fit-check service over them. */
function app(store: KittedStore, now: string, weather: WeatherSource = weatherDouble(), o: { pro?: boolean } = {}) {
  const clock = manualClock(at(now));
  const ids = counterIds();
  const morning = createMorningService({ store, clock, weather, ids });
  const checks = createFitCheckService({
    store, source: createMockReadingSource({ latency: () => 0, scheduler: realScheduler, fault: () => null }), prep: demoImagePrep,
    quota: createQuota({ store, clock, isPro: () => o.pro === true }), clock, scheduler: realScheduler, ids,
    timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }),
  });
  const check = async (iso: string, req: { photoId: string; occasion?: 'everyday' | 'class' | 'date'; parentCheckId?: string }) => {
    clock.set(at(iso));
    const r = (await checks.start({ mode: req.parentCheckId ? 'recheck' : 'check', ...req })) as { outcome: string; checkId: string };
    expect(r.outcome).toBe('scored');
    const row = (await store.fitChecks.get(r.checkId))!;
    expect(row.score).not.toBeNull();
    return row;
  };
  return { store, clock, ids, morning, check };
}

/** A fresh setup (the seed's firstRun answers, fit checks on), then the card of that moment: an empty closet. `pro`
 *  lifts the free day's one check, for the tests that need two first checks in one window. */
async function freshSetup(onboardAt: string, cardAt: string, o: { pro?: boolean } = {}) {
  const store = createMemoryStore();
  const a = app(store, cardAt, weatherDouble(), o);
  await completeOnboarding(store, { styles: ANSWERS.styles as never, fitPreference: ANSWERS.fitPreference, birthYear: ANSWERS.birthYear, consent: true }, at(onboardAt), a.ids);
  await a.morning.ensureCard();
  return a;
}

async function show(a: { store: KittedStore; clock: ReturnType<typeof manualClock> }, ideaId: string, readOnly = false) {
  ref.store = a.store;
  ref.clock = a.clock;
  await render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <ThemeProvider scheme="light">
        <MorningCard ideaId={ideaId} readOnly={readOnly} />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

/** The check's own card message: what the row scrolls to. */
async function messageOfCheck(store: KittedStore, checkId: string) {
  return (await store.chat.all()).find((m) => m.kind === 'card' && m.fitCheckId === checkId)!.id;
}

const WAIT_WORDS = /pieces? so far$|^Your first fit check$|^I only know \d+ of your pieces|^Send me today's fit/;

beforeEach(() => jest.mocked(setStylistAction).mockClear());

describe('F6.2 · the waiting card shows why', () => {
  async function waitingCard(keep: readonly string[] | null, store?: KittedStore) {
    const a = app(store ?? (await seededStore(keep)), DAY);
    expect(await a.morning.ensureCard()).toBe(DAY_ID);
    await show(a, DAY_ID);
    await screen.findByText('Morning.');
    return a;
  }
  const noOutfitActions = () => {
    expect(screen.queryByText('Wear this')).toBeNull();
    expect(screen.queryByText('Swap')).toBeNull();
    expect(screen.queryByText('Wearing something else? Check it ›')).toBeNull();
    expect(screen.queryByLabelText('Wearing something else? Check it')).toBeNull();
  };

  it('F6.2 · the waiting card shows why (3 pieces: one outfit)', async () => {
    await waitingCard(ONE);
    screen.getByText('3 pieces so far');
    screen.getByText("I only know 3 of your pieces. Check today's fit and I'll learn the rest.");
    screen.getByText('Check my fit');
    noOutfitActions();
  });

  it('F6.2 · the waiting card shows why (4 pieces: one outfit and a layer)', async () => {
    await waitingCard(ONE_L);
    screen.getByText('4 pieces so far');
    screen.getByText("I only know 4 of your pieces. Check today's fit and I'll learn the rest.");
    screen.getByText('Check my fit');
    noOutfitActions();
  });

  it('F6.2 · the waiting card shows why (an empty store)', async () => {
    await waitingCard(null, createMemoryStore());
    screen.getByText('Your first fit check');
    screen.getByText("Send me today's fit and I'll start learning your closet.");
    screen.getByText('Check my fit');
    noOutfitActions();
  });

  it('F6.2 · the waiting card shows why (must not: the waiting words on a card with an outfit)', async () => {
    await waitingCard(TWO_TOPS);
    screen.getByText('Wear this');
    expect(screen.queryAllByText(WAIT_WORDS)).toEqual([]);
  });
});

describe('F6.2 · a checked card that suggested nothing', () => {
  it("F6.2 · a checked card that suggested nothing (day: Today's fit)", async () => {
    const a = await freshSetup('2026-10-22T07:39:00-04:00', DAY);
    expect((await a.store.dailyIdeas.get(DAY_ID))!.outfitId).toBeNull();
    const c = await a.check('2026-10-22T07:42:00-04:00', { photoId: 'p01b', occasion: 'everyday' });
    await show(a, DAY_ID);
    const el = await screen.findByTestId('idea-checked');
    within(el).getByText("Today's fit");
    within(el).getByText(displayScore(c.score!));
    within(el).getByText(scoreWordLabel(c.score!));
    expect(el.props.accessibilityLabel).toBe(`Today, ${occasionLabel('everyday')}: Today's fit, ${displayScore(c.score!)}, ${scoreWordLabel(c.score!)}. Shows the result.`);
    expect(el.props.accessibilityRole).toBe('button');
    expect(screen.queryByText('You went with your own')).toBeNull();
    fireEvent.press(el);
    expect(setStylistAction).toHaveBeenCalledWith({ kind: 'scrollTo', messageId: await messageOfCheck(a.store, c.id) });
  });

  it("F6.2 · a checked card that suggested nothing (evening: Tonight's fit)", async () => {
    const a = await freshSetup('2026-10-22T18:29:00-04:00', EVENING);
    expect((await a.store.dailyIdeas.get(EVENING_ID))!.outfitId).toBeNull();
    const c = await a.check('2026-10-22T18:32:00-04:00', { photoId: 'p01b', occasion: 'everyday' });
    await show(a, EVENING_ID);
    const el = await screen.findByTestId('idea-checked');
    within(el).getByText("Tonight's fit");
    within(el).getByText(displayScore(c.score!));
    within(el).getByText(scoreWordLabel(c.score!));
    expect(el.props.accessibilityLabel).toBe(`Tonight, ${occasionLabel('everyday')}: Tonight's fit, ${displayScore(c.score!)}, ${scoreWordLabel(c.score!)}. Shows the result.`);
    expect(el.props.accessibilityRole).toBe('button');
    expect(screen.queryByText('You went with your own')).toBeNull();
  });

  it("F6.2 · a checked card that suggested nothing (edge: a re-check's score)", async () => {
    const a = await freshSetup('2026-10-22T07:39:00-04:00', DAY);
    // Sample photos s05 (6.5 for Everyday) and p01a (7.5): the re-check's score differs from the first's.
    const first = await a.check('2026-10-22T07:42:00-04:00', { photoId: 's05', occasion: 'everyday' });
    const re = await a.check('2026-10-22T07:45:00-04:00', { photoId: 'p01a', parentCheckId: first.id });
    expect(re.parentId).toBe(first.id);
    expect(displayScore(re.score!)).not.toBe(displayScore(first.score!));
    await show(a, DAY_ID);
    const el = await screen.findByTestId('idea-checked');
    within(el).getByText("Today's fit");
    within(el).getByText(displayScore(re.score!));
    expect(within(el).queryByText(displayScore(first.score!))).toBeNull();
    expect(el.props.accessibilityLabel).toBe(`Today, ${occasionLabel(re.occasion)}: Today's fit, ${displayScore(re.score!)}, ${scoreWordLabel(re.score!)}. Shows the result.`);
  });

  it("F6.2 · a checked card that suggested nothing (edge: 4 am, a 3:59 check is tonight's)", async () => {
    const a = await freshSetup('2026-10-22T22:59:00-04:00', '2026-10-22T23:00:00-04:00');
    expect((await a.store.dailyIdeas.get(EVENING_ID))!.outfitId).toBeNull();
    const c = await a.check('2026-10-23T03:59:00-04:00', { photoId: 'p01b', occasion: 'everyday' });
    await show(a, EVENING_ID);
    const el = await screen.findByTestId('idea-checked');
    within(el).getByText("Tonight's fit");
    expect(el.props.accessibilityLabel).toBe(`Tonight, Everyday: Tonight's fit, ${displayScore(c.score!)}, ${scoreWordLabel(c.score!)}. Shows the result.`);
  });

  it("F6.2 · a checked card that suggested nothing (edge: 4 am, a 4:00 check doesn't collapse last night's card)", async () => {
    const a = await freshSetup('2026-10-22T22:59:00-04:00', '2026-10-22T23:00:00-04:00');
    await a.check('2026-10-23T04:00:00-04:00', { photoId: 'p01b', occasion: 'everyday' });
    await show(a, EVENING_ID);
    // Last night's card, not collapsed by this morning's check: it reads as the evening that passed.
    await screen.findByText(/^Thursday/);
    expect(screen.queryByTestId('idea-checked')).toBeNull();
    expect(screen.queryAllByText(/^Tonight's fit$|^Today's fit$|^You went with your own$|^You wore my pick$/)).toEqual([]);
  });

  it('F6.2 · a checked card that suggested nothing (edge: Past chats)', async () => {
    const a = await freshSetup('2026-10-22T07:39:00-04:00', DAY);
    await a.check('2026-10-22T07:42:00-04:00', { photoId: 'p01b', occasion: 'everyday' });
    await show(a, DAY_ID, true);
    const el = await screen.findByTestId('idea-checked');
    within(el).getByText("Today's fit");
    within(el).getByText('Today · Everyday');
    expect(el.props.accessibilityRole).toBeUndefined();
    expect(screen.queryAllByRole('button')).toEqual([]);
    fireEvent.press(el);
    expect(setStylistAction).not.toHaveBeenCalled();
    expect(screen.queryByText('You went with your own')).toBeNull();
  });
});

describe('F6.2 · the checked tag names the right occasion', () => {
  it('F6.2 · the checked tag names the right occasion (a card that suggested nothing: his check\'s)', async () => {
    {
      const a = await freshSetup('2026-10-22T07:39:00-04:00', DAY);
      expect((await a.store.dailyIdeas.get(DAY_ID))!.occasion).toBe('class');
      await a.check('2026-10-22T07:42:00-04:00', { photoId: 'p01b', occasion: 'everyday' });
      await show(a, DAY_ID);
      const el = await screen.findByTestId('idea-checked');
      within(el).getByText('Today · Everyday');
      expect(within(el).queryByText('Today · Class/Work')).toBeNull();
      expect(el.props.accessibilityLabel.startsWith("Today, Everyday: Today's fit, ")).toBe(true);
      await screen.unmount();
    }
    {
      const a = await freshSetup('2026-10-22T18:29:00-04:00', EVENING);
      expect((await a.store.dailyIdeas.get(EVENING_ID))!.occasion).toBe('going_out');
      await a.check('2026-10-22T18:32:00-04:00', { photoId: 'p01b', occasion: 'everyday' });
      await show(a, EVENING_ID);
      const el = await screen.findByTestId('idea-checked');
      within(el).getByText('Tonight · Everyday');
      expect(within(el).queryByText('Tonight · Going out')).toBeNull();
      expect(el.props.accessibilityLabel.startsWith("Tonight, Everyday: Tonight's fit, ")).toBe(true);
    }
  });

  it('F6.2 · the checked tag names the right occasion (a card that suggested an outfit: its own)', async () => {
    const a = app(await seededStore(null), DAY);
    await a.morning.ensureCard();
    expect((await a.store.dailyIdeas.get(DAY_ID))!.outfitId).not.toBeNull();
    await a.check('2026-10-22T07:42:00-04:00', { photoId: 'p01b', occasion: 'everyday' });
    await show(a, DAY_ID);
    const el = await screen.findByTestId('idea-checked');
    within(el).getByText('Today · Class/Work');
    expect(within(el).queryByText('Today · Everyday')).toBeNull();
    expect(el.props.accessibilityLabel.startsWith('Today, Class/Work: You went with your own, ')).toBe(true);
  });

  it('F6.2 · the checked tag names the right occasion (edge: more than one check, and a re-check)', async () => {
    const a = await freshSetup('2026-10-22T07:39:00-04:00', DAY, { pro: true });
    // p01b for Class (7.5), then s24 for a date (6.0): two first checks in the window, different scores.
    const A = await a.check('2026-10-22T07:42:00-04:00', { photoId: 'p01b', occasion: 'class' });
    const B = await a.check('2026-10-22T10:00:00-04:00', { photoId: 's24', occasion: 'date' });
    expect([A.occasion, B.occasion]).toEqual(['class', 'date']);
    expect(displayScore(A.score!)).not.toBe(displayScore(B.score!));
    await show(a, DAY_ID);
    let el = await screen.findByTestId('idea-checked');
    within(el).getByText(`Today · ${occasionLabel('date')}`);
    within(el).getByText(displayScore(B.score!));
    expect(el.props.accessibilityLabel).toBe(`Today, ${occasionLabel('date')}: Today's fit, ${displayScore(B.score!)}, ${scoreWordLabel(B.score!)}. Shows the result.`);
    await screen.unmount();

    // A re-check of B, its score re-scored for Everyday (as a rescore stores it): the row follows the re-check.
    const re = await a.check('2026-10-22T10:03:00-04:00', { photoId: 'p01a', parentCheckId: B.id });
    await a.store.fitChecks.put({ ...re, occasion: 'everyday' });
    expect(displayScore(re.score!)).not.toBe(displayScore(B.score!));
    await show(a, DAY_ID);
    el = await screen.findByTestId('idea-checked');
    within(el).getByText('Today · Everyday');
    within(el).getByText(displayScore(re.score!));
    expect(el.props.accessibilityLabel).toBe(`Today, Everyday: Today's fit, ${displayScore(re.score!)}, ${scoreWordLabel(re.score!)}. Shows the result.`);
    await screen.unmount();

    // Past chats: the same tag.
    await show(a, DAY_ID, true);
    el = await screen.findByTestId('idea-checked');
    within(el).getByText('Today · Everyday');
  });
});

describe('F6.2 · a checked card that suggested one', () => {
  it('F6.2 · a checked card that suggested one (he went with his own)', async () => {
    const a = app(await seededStore(null), DAY);
    await a.morning.ensureCard();
    expect((await a.store.dailyIdeas.get(DAY_ID))!.outfitId).not.toBeNull();
    await a.check('2026-10-22T07:42:00-04:00', { photoId: 'p01b', occasion: 'everyday' });
    await show(a, DAY_ID);
    const el = await screen.findByTestId('idea-checked');
    within(el).getByText('You went with your own');
    expect(screen.queryAllByText(/^Today's fit$|^Tonight's fit$/)).toEqual([]);
  });

  it('F6.2 · a checked card that suggested one (he wore the pick)', async () => {
    const a = app(await seededStore(null), DAY);
    await a.morning.ensureCard();
    const r = (await a.store.dailyIdeas.get(DAY_ID))!;
    const pick = (await a.store.outfits.get(r.outfitId!))!.itemIds;
    a.clock.set(at('2026-10-22T07:41:00-04:00'));
    await a.morning.wear(DAY_ID);
    const c = await a.check('2026-10-22T07:42:00-04:00', { photoId: 'p01b', occasion: 'everyday' });
    // His check shows the pick's pieces.
    await a.store.fitChecks.put({ ...c, itemIds: [...pick] });
    await show(a, DAY_ID);
    const el = await screen.findByTestId('idea-checked');
    within(el).getByText('You wore my pick');
    expect(screen.queryAllByText(/^Today's fit$|^Tonight's fit$|^You went with your own$/)).toEqual([]);
  });

  it("F6.2 · a checked card that suggested one (edge: a checked card with no outfit never gains one)", async () => {
    const a = app(await seededStore(ONE), DAY, weatherDouble([null]));
    await a.morning.ensureCard();
    await a.check('2026-10-22T07:42:00-04:00', { photoId: 'p01b', occasion: 'everyday' });
    await a.store.closet.put({ ...(await a.store.closet.get('T2'))!, isDeleted: false });
    a.clock.set(at('2026-10-22T08:30:00-04:00'));
    await a.morning.freshen();
    await show(a, DAY_ID);
    const el = await screen.findByTestId('idea-checked');
    within(el).getByText("Today's fit");
    expect(screen.queryByText('You went with your own')).toBeNull();
  });
});

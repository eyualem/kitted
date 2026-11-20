// T118 · The app tour (specs/app-tour.md AT2.2, AT3–AT4, AT6.1–AT6.2; tasks/T118/TASK.md). Each test is named with its
// criterion. Words, layout and the motion are checked in screenshots, not here.
//
// Profile (CLAUDE.md rule 6): the example looks score the bundled readings s14 (Welcome's outfit), p01b and s05, "profile
// unknown", at the stated test profile Welcome's card uses: Everyday, no picks, an empty closet, a first check. The setup
// tests use the stated draft profile: smart casual + workwear, age band 22–25, no name.
import { act, cleanup, renderHook } from '@testing-library/react-native';
import { createMemoryStore } from '@/data/memoryStore';
import type { KittedStore } from '@/data/store';
import { textMessage } from '@/data/seedLoader';
import { evaluateCheck } from '@/features/fitcheck/scoring';
import { scoreWordLabel } from '@/design-system/score';
import { FIRST_VISIT_KEY, LAST_OPENED_KEY, startArrivals } from '@/features/closet/arrivals';
import { finishSetup, saveAbout } from '@/features/onboarding/aboutStep';
import {
  endTour, getTourStop, nextStop, resetTour, settleTourAtLaunch, settleTourOnce, startTour, TOUR_KEY, useTourStop,
} from '@/features/onboarding/appTour';
import { useTourBlindTab } from '@/features/onboarding/tourTab';
import { LOOKS_KEY } from '@/features/onboarding/basics';
import { completeOnboarding } from '@/features/onboarding/complete';
import { exampleCheck } from '@/features/onboarding/exampleCheck';
import { exampleCloset, exampleClosetCount, exampleLooks, EXAMPLE_READING_IDS, scoreExample } from '@/features/onboarding/exampleLooks';
import { welcomeExample } from '@/features/onboarding/welcomeExample';
import { deleteAllData } from '@/features/privacy/wipe';
import { arrivals, createArrivals, SEEN_UNTIL_KEY } from '@/features/stylist/arrival';
import { counterIds } from '@/services/ids';
import { demoReadingById } from '@/services/readingSource/demoReadings';
import { isSyncedKv, kvPolicy } from '@/sync/schema';

// useClosetArrivals reads the app's store; the tests hand it theirs.
const live: { store: KittedStore | null } = { store: null };
jest.mock('@/data/db', () => ({
  get store() {
    return live.store;
  },
}));

const T0 = Date.parse('2026-10-22T07:40:00-04:00');
const files = { usage: () => ({ photos: 0, bytes: 0 }), lastSent: () => null, deletePhotos: () => {}, deleteLogs: () => {} };

async function fresh(): Promise<KittedStore> {
  const store = createMemoryStore();
  await store.init();
  live.store = store;
  return store;
}

/** About you's Continue with a 22–25 band: the drafts, then finishSetup (which starts the tour). */
async function continueAbout(store: KittedStore, age = '22-25', opts?: { tour?: boolean }) {
  await store.setKv(LOOKS_KEY, JSON.stringify(['smart_casual', 'workwear']));
  await saveAbout(store, { age: age as never, name: '' });
  await finishSetup(store, T0, counterIds(), opts);
}

beforeEach(() => resetTour());
afterEach(async () => {
  await cleanup();
  resetTour();
});

describe('AT2.2 · each example look scores as the scoring code does, from its bundled reading', () => {
  it('three looks, newest first, Welcome\'s outfit on top', () => {
    const looks = exampleLooks();
    expect(looks.map((l) => l.readingId)).toEqual([...EXAMPLE_READING_IDS]);
    expect(looks).toHaveLength(3);
    expect(looks[0]!.readingId).toBe('s14');
  });

  it('AT2.2 · every score and word equals evaluateCheck on its reading (Everyday, no picks, empty closet, first check)', () => {
    for (const l of exampleLooks()) {
      const reading = demoReadingById(l.readingId)!;
      const ev = evaluateCheck({ reading, occasion: 'everyday', styles: [], boldness: null, closet: [], firstCheck: true });
      expect(ev.row.status).toBe('scored');
      expect(l.score).toBe(ev.row.score);
      expect(l.word).toBe(scoreWordLabel(ev.row.score!));
      expect(scoreExample(reading)).toBe(ev.row.score);
    }
  });

  it('AT2.2 · Welcome\'s outfit scores what Welcome\'s card and the Example check say (one reading, one score)', () => {
    expect(exampleLooks()[0]!.score).toBe(exampleCheck()!.score);
    expect(exampleLooks()[0]!.score).toBe(welcomeExample()!.score);
  });

  it('AT1.1 · the example closet holds every piece of the three looks, in Closet\'s head-to-toe sections', () => {
    const looks = exampleLooks();
    const sections = exampleCloset(looks);
    expect(exampleClosetCount(sections)).toBe(looks.reduce((n, l) => n + l.pieces.length, 0));
    expect(exampleClosetCount(sections)).toBeGreaterThanOrEqual(9);
    const order = ['outer', 'top', 'bottom', 'shoes'];
    expect(sections.map((s) => s.slot)).toEqual(order.filter((s) => sections.some((x) => x.slot === s)));
    expect(sections.map((s) => s.titleKey)).toContain('closet.section.shoes');
  });
});

describe('AT4.1 · it plays once per new setup', () => {
  it('About you\'s Continue (18+) makes the tour pending and puts stop 1 up', async () => {
    const store = await fresh();
    expect(getTourStop()).toBeNull();
    await continueAbout(store);
    expect(await store.getKv(TOUR_KEY)).toBe('pending');
    expect(getTourStop()).toBe(1);
  });

  it('the stops run Next, then Done; the key ends at done and nothing plays again', async () => {
    const store = await fresh();
    await continueAbout(store);
    nextStop();
    expect(getTourStop()).toBe(2);
    nextStop(); // Done is endTour, not a third stop
    expect(getTourStop()).toBe(2);
    await endTour(store);
    expect(getTourStop()).toBeNull();
    expect(await store.getKv(TOUR_KEY)).toBe('done');
    await settleTourAtLaunch(store); // a relaunch
    expect(getTourStop()).toBeNull();
    expect(await store.getKv(TOUR_KEY)).toBe('done');
  });

  it('AT3.1 · Skip from stop 1 closes the tour for good', async () => {
    const store = await fresh();
    await continueAbout(store);
    await endTour(store);
    expect(getTourStop()).toBeNull();
    expect(await store.getKv(TOUR_KEY)).toBe('done');
    nextStop();
    expect(getTourStop()).toBeNull();
  });
});

describe('AT4.2 · closing the app mid-tour counts as seen', () => {
  it('a relaunch with the tour pending ends it, and Kit\'s hello and offer are still new to him', async () => {
    const store = await fresh();
    await continueAbout(store, '22-25', { tour: false }); // the previous launch: the hello and offer are in the thread
    await store.setKv(TOUR_KEY, 'pending');
    // Stylist was out of sight the whole tour, so it never wrote "seen until"; if it had been past the hello, it moves back.
    await store.setKv(SEEN_UNTIL_KEY, String(T0 + 1_000_000));

    await settleTourAtLaunch(store);
    expect(await store.getKv(TOUR_KEY)).toBe('done');
    const rows = await store.chat.all();
    const seen = Number(await store.getKv(SEEN_UNTIL_KEY));
    const beat = createArrivals().findBeat(rows.map((m) => ({ ...m })), seen);
    expect(beat?.kind).toBe('hello');
    expect(beat?.followerIds).toHaveLength(1);
  });

  it('AT3 · Kit\'s first message arrives once: new while he hasn\'t seen Stylist, then in place for good', async () => {
    const store = await fresh();
    await continueAbout(store, '22-25', { tour: false });
    const rows = (await store.chat.all()).map((m) => ({ ...m }));
    const hello = rows.find((m) => m.role === 'stylist' && m.payload.aiNote === true)!;
    // The tour is up and Stylist was never in front of him: nothing wrote "seen until", so the hello is new and plays.
    expect(createArrivals().findBeat(rows, hello.createdAt - 1)?.kind).toBe('hello');
    // He saw it (Stylist lost focus after it landed, or the app was relaunched): it is just there, no replay.
    expect(createArrivals().findBeat(rows, hello.createdAt + 1_000)).toBeNull();
    // Once it has begun this launch, coming back to Stylist never starts it again.
    const a = createArrivals();
    a.beatBegan(a.findBeat(rows, hello.createdAt - 1)!.leadId);
    expect(a.findBeat(rows, hello.createdAt - 1)).toBeNull();
  });

  it('with no "seen until" written (a first launch ever), the hello is still new', async () => {
    const store = await fresh();
    await store.setKv(TOUR_KEY, 'pending');
    await store.chat.put(textMessage('hello', T0 + 5, 'stylist', null, { aiNote: true }));
    await settleTourAtLaunch(store);
    expect(Number(await store.getKv(SEEN_UNTIL_KEY))).toBeLessThan(T0 + 5);
  });

  it('the settle runs once per launch and is one promise for the tab bar and Stylist, so Stylist reads the corrected mark', async () => {
    const store = await fresh();
    await store.setKv(TOUR_KEY, 'pending');
    await store.chat.put(textMessage('hello', T0 + 5, 'stylist', null, { aiNote: true }));
    await store.setKv(SEEN_UNTIL_KEY, String(T0 + 1_000_000));
    const first = settleTourOnce(store); // the tab bar's effect, or Stylist's read: whichever comes first
    const second = settleTourOnce(store);
    expect(second).toBe(first);
    await second; // what Stylist waits for before it reads "seen until"
    expect(Number(await store.getKv(SEEN_UNTIL_KEY))).toBeLessThan(T0 + 5);
  });

  it('a tour that is on screen is not settled by another call', async () => {
    const store = await fresh();
    await continueAbout(store);
    await settleTourAtLaunch(store);
    expect(getTourStop()).toBe(1);
    expect(await store.getKv(TOUR_KEY)).toBe('pending');
  });
});

describe('AT4.3 · "Delete all my data" sends him back through setup, and the tour plays again', () => {
  it('the wipe empties the key; the next setup\'s Continue starts it again', async () => {
    const store = await fresh();
    await continueAbout(store);
    await endTour(store);
    await deleteAllData({ store, files, clearDeviceId: async () => {} });
    expect(await store.getKv(TOUR_KEY)).toBeNull();
    await continueAbout(store);
    expect(await store.getKv(TOUR_KEY)).toBe('pending');
    expect(getTourStop()).toBe(1);
  });

  it('the key is this phone\'s only: never backed up or synced', () => {
    expect(kvPolicy(TOUR_KEY)).toBe('local');
    expect(isSyncedKv(TOUR_KEY)).toBe(false);
  });
});

describe('AT4.4 · Restore, the under-18 stop and a phone from before this update never show it', () => {
  it('Restore finishes through completeOnboarding, which never starts a tour', async () => {
    const store = await fresh();
    await completeOnboarding(store, { styles: [['minimalist', 1]] as never, fitPreference: 'regular', birthYear: null, ageBand: '22-25', consent: 'later' }, T0, counterIds());
    expect(await store.getKv(TOUR_KEY)).toBeNull();
    expect(getTourStop()).toBeNull();
  });

  it('under 18 has no setup: nothing is written, no tour', async () => {
    const store = await fresh();
    await expect(continueAbout(store, 'under18')).rejects.toThrow();
    expect(await store.getKv(TOUR_KEY)).toBeNull();
    expect(getTourStop()).toBeNull();
  });

  it('a phone that finished setup before this update (no key) is done: a launch changes nothing', async () => {
    const store = await fresh();
    await settleTourAtLaunch(store);
    expect(await store.getKv(TOUR_KEY)).toBeNull();
    expect(getTourStop()).toBeNull();
  });
});

describe('AT6.1 · the tour is not "opening Closet"', () => {
  /** The tab bar's own wiring (app/(tabs)/_layout.tsx): the tour's state and the tab on screen decide what Closet's arrivals see. */
  async function tabBar() {
    const { useClosetArrivals } = jest.requireActual('@/features/closet/useArrivals') as typeof import('@/features/closet/useArrivals');
    const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 20))));
    const view = await renderHook(
      ({ tab }: { tab: string | undefined }) => useClosetArrivals(useTourBlindTab(tab, useTourStop() !== null)),
      { initialProps: { tab: undefined } as { tab: string | undefined } },
    );
    await settle();
    return { settle, rerender: view.rerender };
  }
  const marks = async (store: KittedStore) => [await store.getKv(LAST_OPENED_KEY), await store.getKv(FIRST_VISIT_KEY)];

  it('Skip on stop 1: Closet was on screen the whole tour and a render after it; lastOpened and firstVisit are as they were', async () => {
    const store = await fresh();
    await startArrivals(store, T0);
    const before = await marks(store);
    expect(before[1]).toBe(`waiting:${T0}`);
    const { settle, rerender } = await tabBar();
    await act(async () => startTour(store));
    await rerender({ tab: 'closet' }); // stop 1
    await settle();
    await act(async () => endTour(store)); // Skip: the route is still Closet for a render
    await rerender({ tab: 'closet' });
    await settle();
    await rerender({ tab: 'stylist' }); // Kit's hello
    await settle();
    expect(await marks(store)).toEqual(before);
  });

  it('Done on stop 2: Closet then Lookbook, then Stylist; the marks are as they were', async () => {
    const store = await fresh();
    await startArrivals(store, T0);
    const before = await marks(store);
    const { settle, rerender } = await tabBar();
    await act(async () => startTour(store));
    await rerender({ tab: 'closet' });
    await settle();
    await act(async () => nextStop());
    await rerender({ tab: 'lookbook' });
    await settle();
    await act(async () => endTour(store));
    await rerender({ tab: 'lookbook' });
    await settle();
    await rerender({ tab: 'stylist' });
    await settle();
    expect(await marks(store)).toEqual(before);
  });

  it('after the tour, a real visit to Closet still counts as opening it (the guard doesn\'t outlive the tour)', async () => {
    const store = await fresh();
    await startArrivals(store, T0);
    const before = await marks(store);
    const { settle, rerender } = await tabBar();
    await act(async () => startTour(store));
    await rerender({ tab: 'closet' });
    await act(async () => endTour(store));
    await rerender({ tab: 'closet' });
    await rerender({ tab: 'stylist' });
    await settle();
    await new Promise((r) => setTimeout(r, 5)); // time passes
    await rerender({ tab: 'closet' }); // his first real visit
    await settle();
    expect((await marks(store))[0]).not.toBe(before[0]);
  });
});

describe('AT6.2 · the tour sends nothing', () => {
  it('no request leaves the phone: starting, stepping, ending and drawing the examples never call fetch', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response('{}'));
    const store = await fresh();
    await continueAbout(store);
    exampleLooks();
    exampleCloset();
    nextStop();
    await endTour(store);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('AT3.4 · the examples are drawn, never stored: no piece, look or check is added', async () => {
    const store = await fresh();
    await continueAbout(store);
    exampleLooks();
    exampleCloset();
    nextStop();
    await endTour(store);
    expect(await store.closet.all()).toEqual([]);
    expect(await store.fitChecks.all()).toEqual([]);
    arrivals.reset();
  });
});

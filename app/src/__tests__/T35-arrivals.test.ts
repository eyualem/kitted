// T35 · Closet's badge and his first visit (specs/setup-and-you.md SY2; tasks/T35/TASK.md): the count, clearing it on
// open, the start for an install from before this, what doesn't count, the slide's decision and its hold on the badge,
// the first-visit mark's states, and "Delete all my data". Each test is named with its criterion.
//
// Profile (CLAUDE.md rule 6): the checks here score the seed's demo photos (s14, the demo story's first check; p01b),
// "profile unknown", run with the stated test profile: born 2005 (18–21), minimalist, regular fit, everyday or date.
import { US_EASTERN } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import type { KittedStore } from '@/data/store';
import { loadScenario } from '@/data/seedLoader';
import type { ClosetItemRow, FitCheckRow } from '@/data/types';
import {
  badgeColor, badgeCount, endFirstVisit, FIRST_VISIT_KEY, firstAddingCheck, firstVisitPieces, initArrivals, LAST_OPENED_KEY, noteFirstAddingCheck, openCloset,
  parseFirstVisit, parseLastOpened, piecesAddedBy, seeCloset,
} from '@/features/closet/arrivals';
import { createClosetService } from '@/features/closet/service';
import { endedUnscored, heldChecks, holdBadge, HOLD_MAX_MS, landed, launch, noRowToSlide, noSlide, release, resetSlide, shouldSlide } from '@/features/closet/slide';
import { createFitCheckService, DEFAULT_TIMERS } from '@/features/fitcheck/service';
import { completeOnboarding } from '@/features/onboarding/complete';
import type { PrivacyFiles } from '@/features/privacy/files';
import { deleteAllData } from '@/features/privacy/wipe';
import { manualClock } from '@/services/clock';
import { createMockClosetSource } from '@/services/closetSource/mock';
import { counterIds } from '@/services/ids';
import { demoImagePrep } from '@/services/imagePrep/demo';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { realScheduler } from '@/services/scheduler';
import { isSyncedKv, kvPolicy } from '@/sync/schema';
import { darkColors, lightColors } from '@/design-system/tokens';

const at = (iso: string) => Date.parse(iso);
const SETUP_END = at('2026-10-22T07:40:00-04:00');
const MIN = 60_000;

const ANSWERS = { styles: [['minimalist', 1]] as never, fitPreference: 'regular', birthYear: 2005, consent: true as const };

/** A new install at setup's end (completeOnboarding, as About you's Continue runs it), with the real check pipeline. */
async function newInstall() {
  const store = createMemoryStore();
  await store.init();
  const clock = manualClock(SETUP_END);
  const ids = counterIds();
  await completeOnboarding(store, ANSWERS, clock.nowMs(), ids);
  const closet = createClosetService({ store, clock, scheduler: realScheduler, ids, source: createMockClosetSource(), measure: async () => new Map() });
  const svc = createFitCheckService({
    store, source: createMockReadingSource({ latency: () => 0, scheduler: realScheduler }), prep: demoImagePrep,
    quota: createQuota({ store, clock, isPro: () => true }), clock, scheduler: realScheduler, ids, closet,
    timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }), tap: () => true,
  });
  const check = async (photoId: string, occasion: 'everyday' | 'date' = 'everyday') => {
    clock.advance(2 * MIN);
    const r = (await svc.start({ mode: 'check', photoId, occasion })) as { checkId: string };
    await closet.settle();
    return r.checkId;
  };
  return { store, clock, check };
}

async function badge(store: KittedStore, held?: ReadonlySet<string>): Promise<number> {
  return badgeCount(await store.closet.all(), await store.fitChecks.all(), parseLastOpened(await store.getKv(LAST_OPENED_KEY)), held);
}
const mark = async (store: KittedStore) => parseFirstVisit(await store.getKv(FIRST_VISIT_KEY));

// Hand-built rows for the counting rules (the pipeline test above shows real checks produce them).
const piece = (id: string, addedAt: number, o: Partial<ClosetItemRow> = {}) =>
  ({ id, source: 'fitCheck', addedAt, isDeleted: false, mergedInto: null, ...o }) as ClosetItemRow;
const scored = (id: string, createdAt: number, added: string[], o: Partial<FitCheckRow> = {}, undone: string[] = []) =>
  ({ id, createdAt, status: 'scored', details: { closetSummary: { matched: [], added, undone, state: 'done' } }, ...o }) as FitCheckRow;

beforeEach(() => resetSlide());

describe('SY2.3 · the badge counts what checks added since Closet was last opened', () => {
  it('SY2.3 · a real first check that adds pieces shows them on the badge; opening Closet clears it', async () => {
    const { store, clock, check } = await newInstall();
    expect(await badge(store)).toBe(0);
    const id = await check('s14');
    const added = piecesAddedBy((await store.fitChecks.get(id))!, await store.closet.all());
    expect(added.length).toBeGreaterThan(0);
    expect(await badge(store)).toBe(added.length);
    clock.advance(MIN);
    await openCloset(store, clock.nowMs());
    expect(await badge(store)).toBe(0);
  });

  it('SY2.3 · checks adding 4, then 2 → 6; opening Closet → 0; then 1 more → 1', () => {
    const closet = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id, i) => piece(id, 100 + (i < 4 ? 0 : i < 6 ? 10 : 30)));
    const checks = [scored('C1', 100, ['a', 'b', 'c', 'd']), scored('C2', 110, ['e', 'f'])];
    expect(badgeCount(closet.slice(0, 6), checks, 50)).toBe(6);
    expect(badgeCount(closet.slice(0, 6), checks, 120)).toBe(0);
    expect(badgeCount(closet, [...checks, scored('C3', 130, ['g'])], 120)).toBe(1);
  });

  it('SY2.3 · the same after closing and reopening the app: it comes only from what the phone keeps', async () => {
    const { store, check } = await newInstall();
    await check('s14');
    const before = await badge(store);
    // A relaunch: nothing in memory (a fresh slide module), the same store.
    resetSlide();
    expect(await badge(store)).toBe(before);
    expect(before).toBeGreaterThan(0);
  });
});

describe('SY2.4 · what never counts', () => {
  it('SY2.4 · a check that only matched pieces he had adds nothing to the badge', async () => {
    const { store, check } = await newInstall();
    await check('s14');
    await openCloset(store, SETUP_END + 3 * MIN);
    // The same outfit again: every piece is already in Closet.
    const again = await check('s14');
    expect(piecesAddedBy((await store.fitChecks.get(again))!, await store.closet.all())).toEqual([]);
    expect(await badge(store)).toBe(0);
  });

  it('SY2.4 · failed, refused or unscored checks, and pieces he added himself, never count', () => {
    const closet = [piece('a', 100), piece('b', 100), piece('s', 100, { source: 'added' }), piece('k', 100, { source: 'chat' }), piece('z', 100, { source: 'seed' })];
    for (const status of ['failed', 'notClothed', 'unreadable', 'scoring', 'asking', 'held'] as const) {
      expect(badgeCount(closet, [scored('X', 100, ['a', 'b'], { status })], 50)).toBe(0);
    }
    expect(badgeCount(closet, [scored('C', 100, ['s', 'k', 'z'])], 50)).toBe(0);
  });

  it('SY2.4 · undone, removed or merged pieces drop off the count', () => {
    const closet = [piece('a', 100), piece('b', 100, { isDeleted: true }), piece('c', 100, { mergedInto: 'x' }), piece('d', 100)];
    expect(badgeCount(closet, [scored('C', 100, ['a', 'b', 'c', 'd'], {}, ['d'])], 50)).toBe(1);
  });
});

describe('SY2.2, SY2.5 · the slide, and its hold on the badge', () => {
  const base = { fresh: true, readOnly: false, reduceMotion: false, onScreen: true, pieces: 4, checkId: 'C1' };

  it('SY2.2 · a fresh check on its own card, on screen, with new pieces slides, once', () => {
    expect(shouldSlide(base)).toBe(true);
    launch({ checkId: 'C1', pieces: [] });
    expect(shouldSlide(base)).toBe(false);
  });

  it('SY2.5 · Reduce Motion, or the row off screen: no slide', () => {
    expect(shouldSlide({ ...base, reduceMotion: true })).toBe(false);
    expect(shouldSlide({ ...base, onScreen: false })).toBe(false);
  });

  it('SY2.4 · nothing new, an older card (not fresh) or Past chats: no slide', () => {
    expect(shouldSlide({ ...base, pieces: 0 })).toBe(false);
    expect(shouldSlide({ ...base, fresh: false })).toBe(false);
    expect(shouldSlide({ ...base, readOnly: true })).toBe(false);
  });

  it('SY2.2 · the badge counts the pieces once they land, not while they fly', () => {
    const closet = ['a', 'b', 'c', 'd'].map((id) => piece(id, 100));
    const checks = [scored('C1', 100, ['a', 'b', 'c', 'd'])];
    holdBadge('C1');
    launch({ checkId: 'C1', pieces: [] });
    expect(badgeCount(closet, checks, 50, new Set(['C1']))).toBe(0);
    landed('C1');
    expect(badgeCount(closet, checks, 50, new Set())).toBe(4);
  });

  it('SY2.5 · no slide (off screen, Reduce Motion): the hold lets go at once and never comes back for that check', () => {
    holdBadge('C2');
    expect(heldChecks().has('C2')).toBe(true);
    noSlide('C2');
    expect(heldChecks().has('C2')).toBe(false);
    holdBadge('C2'); // a remount of the card
    expect(heldChecks().has('C2')).toBe(false);
    expect(shouldSlide({ ...base, checkId: 'C2' })).toBe(false);
  });

  it('SY2.2 · a card that goes away before its row lands lets the badge count them', () => {
    holdBadge('C3');
    release('C3');
    expect(heldChecks().size).toBe(0);
  });
});

describe('SY2.8 · his first visit', () => {
  it("SY2.8 · waiting from setup's end → the first adding check → shown on the next Closet visit → done once he leaves", async () => {
    const { store, clock, check } = await newInstall();
    expect(await mark(store)).toEqual({ state: 'waiting', since: SETUP_END });
    const first = await check('s14');
    await noteFirstAddingCheck(store);
    expect(await mark(store)).toEqual({ state: 'check', checkId: first });
    // A later check never takes its place.
    await check('p01b', 'date');
    await noteFirstAddingCheck(store);
    expect(await mark(store)).toEqual({ state: 'check', checkId: first });
    // The visit: those pieces, in the order the check added them.
    expect(await openCloset(store, clock.nowMs())).toBe(first);
    const grid = (await store.closet.all()).filter((c) => !c.isDeleted);
    const shown = firstVisitPieces((await store.fitChecks.get(first))!, grid).map((c) => c.id);
    expect(shown).toEqual(piecesAddedBy((await store.fitChecks.get(first))!, grid));
    expect(shown.length).toBeGreaterThan(0);
    // He leaves (another tab, or the app goes away): never again.
    await endFirstVisit(store);
    expect(await mark(store)).toEqual({ state: 'done' });
    expect(await openCloset(store, clock.nowMs())).toBeNull();
  });

  it("SY2.8 · a check that only matched, or one from before setup's end, isn't the first adding check", () => {
    const closet = [piece('a', 100), piece('b', 200)];
    const checks = [scored('OLD', 50, ['a']), scored('MATCH', 150, []), scored('NEW', 200, ['b'])];
    expect(firstAddingCheck(checks, closet, 100)).toBe('NEW');
  });

  it("SY2.8 · nothing recorded before he's checked anything; a visit then shows no label", async () => {
    const { store, clock } = await newInstall();
    expect(await openCloset(store, clock.nowMs())).toBeNull();
    expect(await mark(store)).toEqual({ state: 'waiting', since: SETUP_END });
  });
});

describe('SY2.9 · an install from before this update', () => {
  async function oldInstall() {
    const store = createMemoryStore();
    await store.init();
    await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: at('2026-10-22T12:00:00-04:00') });
    return store;
  }

  it('SY2.9 · the keys start at now and done: an existing closet shows no badge and never the label', async () => {
    const store = await oldInstall();
    const now = at('2026-10-22T12:01:00-04:00');
    await initArrivals(store, now);
    expect(await store.getKv(LAST_OPENED_KEY)).toBe(String(now));
    expect(await mark(store)).toEqual({ state: 'done' });
    expect(await badge(store)).toBe(0);
    await noteFirstAddingCheck(store);
    expect(await openCloset(store, now + MIN)).toBeNull();
  });

  it('SY2.9 · the badge still works for it: a later piece from a check counts', async () => {
    const store = await oldInstall();
    const now = at('2026-10-22T12:01:00-04:00');
    await initArrivals(store, now);
    const closet = await store.closet.all();
    const checks = await store.fitChecks.all();
    const fresh = { ...closet[0]!, id: 'NEW1', addedAt: now + MIN, source: 'fitCheck' as const, isDeleted: false, mergedInto: null };
    expect(badgeCount([...closet, fresh], [...checks, scored('C-new', now + MIN, ['NEW1'])], now)).toBe(1);
  });

  it("SY2.9 · init never overwrites a key that's there, and writes nothing before setup's end", async () => {
    const { store } = await newInstall();
    await initArrivals(store, SETUP_END + 10 * MIN);
    expect(await store.getKv(LAST_OPENED_KEY)).toBe(String(SETUP_END));
    expect(await mark(store)).toEqual({ state: 'waiting', since: SETUP_END });
    const blank = createMemoryStore();
    await blank.init();
    await initArrivals(blank, SETUP_END);
    expect([await blank.getKv(LAST_OPENED_KEY), await blank.getKv(FIRST_VISIT_KEY)]).toEqual([null, null]);
  });
});

describe('SY2.10 · Delete all my data, and the keys stay on the phone', () => {
  const files: PrivacyFiles = { usage: () => ({ photos: 0, bytes: 0 }), lastSent: () => null, deletePhotos: () => {}, deleteLogs: () => {} };

  it('SY2.10 · clears the last-opened time and the first-visit mark (so the badge), and setup again starts waiting', async () => {
    const { store, check } = await newInstall();
    await check('s14');
    await noteFirstAddingCheck(store);
    await seeCloset(store, SETUP_END + MIN);
    await deleteAllData({ store, files, clearDeviceId: async () => {} });
    expect([await store.getKv(LAST_OPENED_KEY), await store.getKv(FIRST_VISIT_KEY)]).toEqual([null, null]);
    expect(await badge(store)).toBe(0);
    const again = SETUP_END + 60 * MIN;
    await completeOnboarding(store, ANSWERS, again, counterIds());
    expect(await mark(store)).toEqual({ state: 'waiting', since: again });
  });

  it('SY2.10 · both keys are this phone only, never backed up', () => {
    for (const k of [LAST_OPENED_KEY, FIRST_VISIT_KEY]) {
      expect(kvPolicy(k)).toBe('local');
      expect(isSyncedKv(k)).toBe(false);
    }
  });
});

describe('SY2.7 · the badge color', () => {
  const lum = (hex: string) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
  };
  /** iOS draws a tab badge's number white, whatever the background. */
  const onWhite = (bg: string) => 1.05 / (lum(bg) + 0.05);

  it('SY2.7 · primary in light, me in dark, from the tokens; white digits at least 4.5:1 in both; never red', () => {
    expect(badgeColor(lightColors, 'light')).toBe(lightColors.primary);
    expect(badgeColor(darkColors, 'dark')).toBe(darkColors.me);
    for (const bg of [badgeColor(lightColors, 'light'), badgeColor(darkColors, 'dark')]) {
      expect(onWhite(bg)).toBeGreaterThanOrEqual(4.5);
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(bg.slice(i, i + 2), 16));
      expect(r! > g! + 40 && r! > b! + 40).toBe(false); // not a red
    }
  });
});

describe('SY2.2 · the slide is never given up too early (the light recording without a slide, Nov 11)', () => {
  const summary = (added: string[], state: 'pending' | 'done' | 'fallback' = 'done') => ({ matched: [], added, undone: [], state });

  it("SY2.2 · a check that added pieces never gives up its slide for want of a row; only a partial or nothing-added check does", () => {
    // The card's closet list may still be loading as the reveal ends: the decision reads the check alone.
    expect(noRowToSlide(summary(['a', 'b']), false)).toBe(false);
    expect(noRowToSlide(summary(['a'], 'fallback'), false)).toBe(false);
    expect(noRowToSlide(summary([]), false)).toBe(true);
    expect(noRowToSlide(summary(['a']), true)).toBe(true);
    // Still out: wait.
    expect(noRowToSlide(summary([], 'pending'), false)).toBe(false);
    expect(noRowToSlide(undefined, false)).toBe(false);
  });

  it('SY2.2 · holding again (the score card mounting after a long read) starts the hold over, so the badge never shows before the slide', () => {
    jest.useFakeTimers();
    try {
      holdBadge('C9'); // the card shows it reading
      jest.advanceTimersByTime(HOLD_MAX_MS - 1000);
      holdBadge('C9'); // the score lands: the score card holds it too
      jest.advanceTimersByTime(5000);
      expect(heldChecks().has('C9')).toBe(true);
      jest.advanceTimersByTime(HOLD_MAX_MS);
      expect(heldChecks().has('C9')).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('SY2.2 · a failed check that is tried again still slides (review round 3, D1)', () => {
  it('SY2.2 · failed lets the badge go but keeps the slide; Try again (the same check id) scores and slides', () => {
    const base = { fresh: true, readOnly: false, reduceMotion: false, onScreen: true, pieces: 4, checkId: 'R1' };
    holdBadge('R1'); // reading
    endedUnscored('R1'); // failed: the badge isn't held for nothing
    expect(heldChecks().has('R1')).toBe(false);
    holdBadge('R1'); // "Try again" reads the same check
    expect(heldChecks().has('R1')).toBe(true);
    expect(shouldSlide(base)).toBe(true);
  });
});

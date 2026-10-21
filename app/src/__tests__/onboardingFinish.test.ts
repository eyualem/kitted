// The end of onboarding's checks, set before building (handoff/10-onboarding.md §9.6): the sequence (E1–E7), Later
// (L1), the one optional step (O1–O9, #343; it replaced the moves M1–M4), the list (B1), the paywall's words and store (P1–P8) and the notification ask
// (N1–N3), as far as they can be checked without a screen. The screens were checked in the web preview (§9.8).
import { createMemoryStore } from '@/data/memoryStore';
import type { ClosetItemRow, FitCheckRow } from '@/data/types';
import { NOTIFICATIONS_BUILT, PAYWALL_BUILT } from '@/config/features';
import { PRIVACY_URL, TERMS_URL } from '@/config/links';
import { createOfferService } from '@/features/account/offerService';
import { basicsAdded, inviteState } from '@/features/finish/invite';
import {
  FINISH_SETTLE_MS, firstFull, holdsOffer, laterShows, movesDue, NO_FINISH, notifyAskable, notifyDue, parseFinish, PAYWALL_AFTER_MS, paywallDue,
  type FinishCheck, type FinishState,
} from '@/features/finish/sequence';
import { createFinishService, FINISH_KEY, getFinish, getStarterMarks, type FinishDeps } from '@/features/finish/service';
import { bestMissing, starterGain } from '@/features/finish/gains';
import { keepsRow, markedPiece, optionName, ownedCount, ownership, STARTER } from '@/features/finish/starter';
import { pickStarter, removeStarter, toggleMarkOnly } from '@/features/finish/starterActions';
import { displayHex } from '@kitted/core';
import { ctaTitle, finePrint, paywallPerks, paywallTitle, planDetail, plansReminder, todayCard } from '@/features/paywall/content';
import { loadNotificationPrefs } from '@/features/settings/prefs';
import { en, t } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { scriptedNotifications, unbuiltNotifications } from '@/services/notifications';
import { createMockStore, PRO_MONTHLY, type StoreScript } from '@/services/purchases';
import { LIMITS } from '@/services/quota';

const T0 = Date.parse('2026-10-22T11:42:00Z'); // 7:42 am Eastern

const fix = (copy: string, o: Partial<FitCheckRow['fixes'][number]> = {}) =>
  ({ target: copy, tier: 'free', effort: 1, free: true, to: 7.5, toRaw: 7.5, gain: 0.5, rawGain: 0.5, edits: [], itemId: null, copy, tag: 'Free', ...o }) as FitCheckRow['fixes'][number];

function check(id: string, createdAt: number, o: Partial<FitCheckRow> = {}): FitCheckRow {
  return {
    id, createdAt, dayKey: '2026-10-22', photoFile: null, thumbFile: null, demoPhotoId: 'p01b', imageHash: id, occasion: 'everyday', style: null,
    status: 'scored', isPartial: false, notRated: [], score: 6.5, rawScore: 6.5, subscores: {}, occasionAdj: 0, rulesFired: [], credits: [], advice: [],
    fixes: [fix('Tuck in your tee')], explanation: null, rubricVersion: 'parts', isFavorite: false, snapState: 'none', recheckUsed: false,
    isFirstCheck: true, readingId: null, parentId: null, itemIds: [], details: {}, ...o,
  } as FitCheckRow;
}

const fc = (id: string, createdAt: number, o: Partial<FinishCheck> = {}): FinishCheck => ({ id, createdAt, status: 'scored', parentId: null, fixCount: 1, recheckOpen: true, ...o });

function piece(id: string, slot: string, subcategory: string, color: string, o: Partial<ClosetItemRow> = {}): ClosetItemRow {
  return {
    id, name: id, slot, garment: { category: slot === 'shoes' ? 'footwear' : slot === 'outer' ? 'outerwear' : slot, subcategory, color_family: color, pattern: 'solid', leg_shape: slot === 'bottom' ? 'straight' : 'na' },
    confirmedFields: [], hex: '#888888', photoFile: null, demoPhotoId: null, isPhotographed: true, source: 'fitCheck', starterId: null, wornCount: 1,
    lastWornAt: null, addedAt: T0, isDeleted: false, ...o,
  } as ClosetItemRow;
}

async function freshStore() {
  const store = createMemoryStore();
  await store.init();
  await store.profile.put({
    id: 'me', birthYear: 2003, heightCm: null, build: '', fitPreference: '', styles: [['minimalist', 0.5]] as never, boldness: 'a_little', budget: null,
    lastOccasion: 'everyday', consentVersion: null, consentAt: null, onboardingDone: true, ideaTime: '08:00', units: 'imperial', createdAt: T0,
  });
  return store;
}

function deps(store: Awaited<ReturnType<typeof freshStore>>, o: Partial<FinishDeps> = {}) {
  const clock = manualClock(T0);
  const timers: { fn: () => void; at: number }[] = [];
  const opened: number[] = [];
  const d: FinishDeps = {
    store, clock, ids: counterIds(), busy: () => false, paywallOn: () => true, isPro: () => false, notificationsOn: () => true,
    notifications: scriptedNotifications('allow'), stylistInFront: () => true, openPaywall: () => opened.push(clock.nowMs()),
    later: (fn, ms) => timers.push({ fn, at: clock.nowMs() + ms }), ...o,
  };
  /** Moves the clock and fires the timers that came due. */
  const tick = async (ms: number) => {
    clock.advance(ms);
    for (const x of timers.splice(0).filter((x) => x.at <= clock.nowMs())) x.fn();
    await new Promise((r) => setTimeout(r, 0));
  };
  return { d, clock, opened, tick, timers };
}

const cards = async (store: Awaited<ReturnType<typeof freshStore>>) => (await store.chat.all()).sort((a, b) => a.createdAt - b.createdAt);

// ── The sequence ────────────────────────────────────────────────────────────────────────────────────────────────
describe('E1–E3 · when the moves card posts', () => {
  const base = { state: NO_FINISH, busy: false, visitStartMs: T0 - 1000, nowMs: T0 + 60_000, checksChangedAt: null };

  it('E1: never before the first full check is scored, never while reading or asking', () => {
    expect(movesDue({ ...base, checks: [] }).kind).toBe('no');
    expect(movesDue({ ...base, checks: [fc('a', T0, { status: 'scoring' })] }).kind).toBe('no');
    expect(movesDue({ ...base, checks: [fc('a', T0, { status: 'failed' })] }).kind).toBe('no');
    expect(movesDue({ ...base, checks: [fc('a', T0, { status: 'held' })] }).kind).toBe('no');
    const later = { ...NO_FINISH, laterAt: T0, checkId: 'a' };
    expect(movesDue({ ...base, state: later, busy: true, checks: [fc('a', T0)] }).kind).toBe('no');
    expect(movesDue({ ...base, state: later, checks: [fc('a', T0), fc('b', T0 + 1, { status: 'asking' })] }).kind).toBe('no');
    // Already posted: never again.
    expect(movesDue({ ...base, state: { ...later, step: 'moves' }, checks: [fc('a', T0)] }).kind).toBe('no');
  });

  it('E2: each trigger posts it; a scored check waits the settle, Later does not', () => {
    // Re-check window open, no Later, same visit: nothing yet.
    expect(movesDue({ ...base, checks: [fc('a', T0)] }).kind).toBe('no');
    // Later: at once, even right after a change.
    const later = movesDue({ ...base, state: { ...NO_FINISH, laterAt: T0, checkId: 'a' }, checks: [fc('a', T0)], checksChangedAt: base.nowMs });
    expect(later).toEqual({ kind: 'post', checkId: 'a', why: 'later' });
    // The first re-check scored: after the settle.
    const re = [fc('a', T0), fc('r', T0 + 600_000, { parentId: 'a' })];
    expect(movesDue({ ...base, checks: re, checksChangedAt: base.nowMs - 1000 })).toEqual({ kind: 'wait', at: base.nowMs - 1000 + FINISH_SETTLE_MS });
    expect(movesDue({ ...base, checks: re, checksChangedAt: base.nowMs - FINISH_SETTLE_MS })).toMatchObject({ kind: 'post', why: 'recheck' });
    // No fix to re-check (dialed in or No quick fixes).
    expect(movesDue({ ...base, checks: [fc('a', T0, { fixCount: 0 })] })).toMatchObject({ kind: 'post', why: 'noFix' });
    // The window closed, or a later visit.
    expect(movesDue({ ...base, checks: [fc('a', T0, { recheckOpen: false })] })).toMatchObject({ kind: 'post', why: 'windowClosed' });
    expect(movesDue({ ...base, visitStartMs: T0 + 1, checks: [fc('a', T0)], checksChangedAt: base.nowMs })).toMatchObject({ kind: 'post', why: 'laterVisit' });
    // A failed re-check is no trigger.
    expect(movesDue({ ...base, checks: [fc('a', T0), fc('r', T0 + 1, { parentId: 'a', status: 'failed' })] }).kind).toBe('no');
  });

  it('E3: a phone with 2+ scored full checks is skipped (and gets no Later)', () => {
    const two = [fc('a', T0), fc('b', T0 + 86_400_000)];
    expect(movesDue({ ...base, checks: two }).kind).toBe('skip');
    expect(laterShows(NO_FINISH, { id: 'a', status: 'scored', parentId: null }, two)).toBe(false);
    // One full check plus its re-check is still the first fit.
    expect(movesDue({ ...base, checks: [fc('a', T0), fc('r', T0 + 1, { parentId: 'a' })] }).kind).not.toBe('skip');
  });

  it('parses a damaged or old state as the start', () => {
    expect(parseFinish(null)).toEqual(NO_FINISH);
    expect(parseFinish('{nope')).toEqual(NO_FINISH);
    expect(parseFinish('{"step":"zzz"}').step).toBe('waiting');
    expect(firstFull([fc('b', T0 + 5), fc('a', T0), fc('r', T0 - 1, { parentId: 'x' })])?.id).toBe('a');
  });
});

describe('E4–E5 · the paywall and the ask', () => {
  const moves: FinishState = { ...NO_FINISH, step: 'moves', checkId: 'a', movesAt: T0 };
  const p = { state: moves, paywallOn: true, isPro: false, stylistInFront: true, busy: false, nowMs: T0 + PAYWALL_AFTER_MS };

  it('E4: opens only when on, not Pro, Stylist in front, nothing busy, 2.5 s after the card', () => {
    expect(paywallDue(p).kind).toBe('open');
    expect(paywallDue({ ...p, nowMs: T0 + 100 })).toEqual({ kind: 'wait', at: T0 + PAYWALL_AFTER_MS });
    expect(paywallDue({ ...p, stylistInFront: false }).kind).toBe('no');
    expect(paywallDue({ ...p, busy: true }).kind).toBe('no');
    expect(paywallDue({ ...p, paywallOn: false }).kind).toBe('skip');
    expect(paywallDue({ ...p, isPro: true }).kind).toBe('skip');
    expect(paywallDue({ ...p, state: { ...moves, step: 'paywall' } }).kind).toBe('no');
  });

  it('E5: the ask follows the paywall closing, or the card when the paywall is skipped; only if never asked', () => {
    expect(notifyDue({ ...moves, step: 'paywall' }, { paywallClosed: true, paywallSkipped: false })).toBe(true);
    expect(notifyDue({ ...moves, step: 'paywall' }, { paywallClosed: false, paywallSkipped: false })).toBe(false);
    expect(notifyDue(moves, { paywallClosed: false, paywallSkipped: true })).toBe(true);
    expect(notifyDue({ ...moves, step: 'done' }, { paywallClosed: true, paywallSkipped: true })).toBe(false);
    expect(notifyAskable(true, 'undetermined')).toBe(true);
    expect(notifyAskable(true, 'granted')).toBe(false);
    expect(notifyAskable(true, 'denied')).toBe(false);
    expect(notifyAskable(false, 'undetermined')).toBe(false);
  });
});

describe('E1–E7 · the whole sequence through the service', () => {
  it('Later → moves card → paywall 2.5 s later → closed → the ask; each once', async () => {
    const store = await freshStore();
    await store.fitChecks.put(check('a', T0));
    const { d, opened, tick, clock } = deps(store);
    const s = createFinishService(d);
    await s.ensure();
    expect(await cards(store)).toHaveLength(0); // window open, same visit, no Later
    await s.later('a');
    let msgs = await cards(store);
    expect(msgs.map((m) => m.kind + ':' + (m.cardType ?? m.text))).toEqual(['text:' + t('plan.intro'), 'card:plan']);
    expect(opened).toHaveLength(0);
    await tick(PAYWALL_AFTER_MS + 50);
    expect(opened).toEqual([clock.nowMs()]);
    expect((await getFinish(store)).step).toBe('paywall');
    await s.ensure(); // still open: no ask
    expect(await cards(store)).toHaveLength(2);
    await s.paywallClosed();
    msgs = await cards(store);
    expect(msgs).toHaveLength(3);
    expect(msgs[2]!.payload).toMatchObject({ question: 'notify', state: 'open', time: '08:00' });
    expect((await getFinish(store)).step).toBe('done');
    // Never again.
    await s.later('a');
    await s.ensure();
    await tick(10_000);
    expect(await cards(store)).toHaveLength(3);
    expect(opened).toHaveLength(1);
  });

  it('E4: the paywall waits for Stylist to be in front and nothing reading', async () => {
    const store = await freshStore();
    await store.fitChecks.put(check('a', T0, { fixes: [] }));
    let front = false;
    let busy = true;
    const { d, opened, tick } = deps(store, { stylistInFront: () => front, busy: () => busy });
    const s = createFinishService(d);
    busy = false;
    await s.ensure(); // no fix: posts at once (no change seen this run)
    expect((await getFinish(store)).step).toBe('moves');
    await tick(PAYWALL_AFTER_MS + 50);
    expect(opened).toHaveLength(0); // a sheet is up
    front = true;
    busy = true;
    await s.ensure();
    expect(opened).toHaveLength(0); // a check is reading
    busy = false;
    await s.ensure();
    expect(opened).toHaveLength(1);
  });

  it('E4/E5: paywall off or Pro → no paywall, the ask right after the card', async () => {
    for (const o of [{ paywallOn: () => false }, { isPro: () => true }]) {
      const store = await freshStore();
      await store.fitChecks.put(check('a', T0, { fixes: [] }));
      const { d, opened } = deps(store, o);
      await createFinishService(d).ensure();
      const msgs = await cards(store);
      expect(msgs.map((m) => m.cardType)).toEqual([null, 'plan', 'question']);
      expect(opened).toHaveLength(0);
      expect((await getFinish(store)).step).toBe('done');
    }
  });

  it('E5: notifications off, or already asked → no ask, the sequence ends', async () => {
    for (const o of [{ notificationsOn: () => false }, { notifications: scriptedNotifications('allow', 'granted') }, { notifications: unbuiltNotifications, notificationsOn: () => false }]) {
      const store = await freshStore();
      await store.fitChecks.put(check('a', T0, { fixes: [] }));
      const { d } = deps(store, { paywallOn: () => false, ...o });
      await createFinishService(d).ensure();
      expect((await cards(store)).map((m) => m.cardType)).toEqual([null, 'plan']);
      expect((await getFinish(store)).step).toBe('done');
    }
  });

  it('E6: quitting with the paywall open counts as shown: the next run posts the ask, no second paywall', async () => {
    const store = await freshStore();
    await store.fitChecks.put(check('a', T0));
    await store.setKv(FINISH_KEY, JSON.stringify({ ...NO_FINISH, step: 'paywall', checkId: 'a', movesAt: T0, paywallAt: T0 }));
    const { d, opened } = deps(store);
    await createFinishService(d).ensure(); // a new run: the paywall isn't on screen
    expect(opened).toHaveLength(0);
    expect((await cards(store)).map((m) => m.payload.question)).toEqual(['notify']);
    // Quitting after the moves card: the next run opens the paywall (it was never shown).
    const store2 = await freshStore();
    await store2.fitChecks.put(check('a', T0));
    await store2.setKv(FINISH_KEY, JSON.stringify({ ...NO_FINISH, step: 'moves', checkId: 'a', movesAt: T0 }));
    const x = deps(store2);
    x.clock.advance(86_400_000);
    await createFinishService(x.d).ensure();
    expect(x.opened).toHaveLength(1);
  });

  it('E2: the re-check trigger waits out the reveal, then posts', async () => {
    const store = await freshStore();
    await store.fitChecks.put(check('a', T0));
    const { d, tick } = deps(store);
    const s = createFinishService(d);
    await s.ensure();
    await store.fitChecks.put(check('r', T0 + 60_000, { parentId: 'a', isFirstCheck: false, score: 7.5 }));
    s.checksChanged();
    await s.ensure();
    expect(await cards(store)).toHaveLength(0);
    await tick(FINISH_SETTLE_MS + 50);
    expect((await cards(store)).map((m) => m.cardType)).toEqual([null, 'plan']);
  });

  it('E1: a second ensure() while one runs waits for it, and nothing posts twice', async () => {
    const store = await freshStore();
    await store.fitChecks.put(check('a', T0, { fixes: [] }));
    const { d } = deps(store, { paywallOn: () => false });
    const s = createFinishService(d);
    await Promise.all([s.ensure(), s.ensure().then(async () => expect((await cards(store)).length).toBe(3))]);
    expect((await cards(store)).map((m) => m.cardType)).toEqual([null, 'plan', 'question']);
  });

  it('E3: the founder\'s phone (several fits) is skipped for good', async () => {
    const store = await freshStore();
    await store.fitChecks.put(check('a', T0 - 86_400_000 * 3));
    await store.fitChecks.put(check('b', T0, { isFirstCheck: false }));
    const { d, opened } = deps(store);
    const s = createFinishService(d);
    await s.ensure();
    await s.later('a');
    expect(await cards(store)).toHaveLength(0);
    expect(opened).toHaveLength(0);
    expect((await getFinish(store)).step).toBe('skipped');
  });
});

describe('E7 · the save offer and the sequence never meet', () => {
  it('holds while due or under way, and for the visit it posted in', () => {
    const v = T0;
    expect(holdsOffer(NO_FINISH, v, true)).toBe(true);
    expect(holdsOffer(NO_FINISH, v, false)).toBe(false);
    expect(holdsOffer({ ...NO_FINISH, step: 'moves' }, v, false)).toBe(true);
    expect(holdsOffer({ ...NO_FINISH, step: 'paywall' }, v, false)).toBe(true);
    expect(holdsOffer({ ...NO_FINISH, step: 'done', lastAt: v + 5 }, v, false)).toBe(true);
    expect(holdsOffer({ ...NO_FINISH, step: 'done', lastAt: v - 5 }, v, false)).toBe(false); // a later visit
    expect(holdsOffer({ ...NO_FINISH, step: 'skipped' }, v, false)).toBe(false);
  });

  it('after the first re-check both are due: the moves card posts, the offer waits for the next visit', async () => {
    const store = await freshStore();
    await store.fitChecks.put(check('a', T0));
    await store.fitChecks.put(check('r', T0 + 60_000, { parentId: 'a', isFirstCheck: false }));
    const x = deps(store, { paywallOn: () => false, notificationsOn: () => false });
    const fin = createFinishService(x.d);
    // One id factory for both services (two counters both made M-1, CLAUDE.md lessons).
    const offer = createOfferService({ store, now: () => x.clock.nowMs(), ids: x.d.ids, busy: () => false, enabled: () => true, holds: () => fin.holdsOffer() });
    x.clock.advance(120_000);
    expect(await offer.ensure()).toBeNull(); // the moves card is due: the offer waits
    await fin.ensure();
    expect(await offer.ensure()).toBeNull(); // same visit as the sequence's cards
    // Next visit (away 30+ min): the offer may come.
    fin.left();
    offer.left();
    x.clock.advance(31 * 60_000);
    fin.back();
    offer.back();
    expect(await offer.ensure()).not.toBeNull();
    expect((await cards(store)).map((m) => m.cardType)).toEqual([null, 'plan', 'account']);
  });
});

// ── Later and the moves ──────────────────────────────────────────────────────────────────────────────────────────
describe('L1 · Later', () => {
  it('shows only on the first-ever full check, scored, before the sequence starts', () => {
    const one = [fc('a', T0)];
    expect(laterShows(NO_FINISH, { id: 'a', status: 'scored', parentId: null }, one)).toBe(true);
    expect(laterShows(NO_FINISH, { id: 'a', status: 'scoring', parentId: null }, one)).toBe(false);
    expect(laterShows(NO_FINISH, { id: 'r', status: 'scored', parentId: 'a' }, [...one, fc('r', T0 + 1, { parentId: 'a' })])).toBe(false);
    expect(laterShows({ ...NO_FINISH, laterAt: T0 }, { id: 'a', status: 'scored', parentId: null }, one)).toBe(false);
    expect(laterShows({ ...NO_FINISH, step: 'moves' }, { id: 'a', status: 'scored', parentId: null }, one)).toBe(false);
    // Re-checked (or re-checking): Later is moot.
    expect(laterShows(NO_FINISH, { id: 'a', status: 'scored', parentId: null }, [...one, fc('r', T0 + 1, { parentId: 'a', status: 'scoring' })])).toBe(false);
    expect(laterShows(NO_FINISH, { id: 'a', status: 'scored', parentId: null }, [...one, fc('r', T0 + 1, { parentId: 'a', status: 'failed' })])).toBe(true);
  });

  it('tapping it leaves the re-check as it was', async () => {
    const store = await freshStore();
    await store.fitChecks.put(check('a', T0));
    const { d } = deps(store, { paywallOn: () => false, notificationsOn: () => false });
    await createFinishService(d).later('a');
    const row = await store.fitChecks.get('a');
    expect(row?.recheckUsed).toBe(false);
    expect((await getFinish(store)).laterAt).toBe(T0);
  });
});

describe('O1–O9 · the one optional step (#343, §9.11)', () => {
  const card = (payload: Record<string, unknown> = {}) => ({ payload });

  it('O1: it says it is optional twice; the card has one button and one Skip', () => {
    expect(t('plan.intro')).toMatch(/optional/i);
    expect(t('plan.tag')).toBe('Optional');
    expect(t('plan.show')).toBe('Show me the list');
    expect(t('plan.skip')).toBe('Skip');
    // Nothing on it assumes what he owns or should buy.
    for (const k of ['plan.intro', 'plan.title', 'plan.body', 'plan.skipped', 'starter.sub'] as const) expect(t(k)).not.toMatch(/\$|buy|heavyweight|first 3|moves/i);
  });

  it('O2: open, skipped, added (added wins over an earlier Skip)', () => {
    expect(inviteState(card(), 0)).toBe('open');
    expect(inviteState(card({ skipped: true }), 0)).toBe('skipped');
    expect(inviteState(card({ skipped: true }), 2)).toBe('added');
    expect(t('plan.added', { n: 2 })).toBe('Added 2 to your closet.');
  });

  it('O5: a pick is a not-photographed piece in his kind and color, named the closet way', () => {
    const tee = STARTER.find((e) => e.id === 's01')!;
    const black = tee.owns.find((o) => o.color === 'black')!;
    const m = markedPiece(tee, black, 'X', T0)!;
    expect(m).toMatchObject({ isPhotographed: false, source: 'added', starterId: 's01', slot: 'top', name: 'Black tee', hex: displayHex('black') });
    expect(m.garment).toMatchObject({ subcategory: 'tee', color_family: 'black' });
    expect(optionName(tee, black)).toBe('Black tee');
    const boots = STARTER.find((e) => e.id === 's10')!;
    expect(markedPiece(boots, { subcategory: 'chelsea_boot', color: 'black' }, 'Y', T0)!.garment).toMatchObject({ subcategory: 'chelsea_boot', color_family: 'black' });
  });

  it('O6: every choice of every row keeps its row marked, whatever the color', () => {
    for (const e of STARTER) {
      if (!e.slot) {
        expect(e.owns).toEqual([]);
        continue;
      }
      expect(e.owns.length).toBeGreaterThan(1);
      for (const [i, o] of e.owns.entries()) {
        const m = markedPiece(e, o, `${e.id}-${i}`, T0)!;
        expect(ownership([m], [])[e.id]).toEqual({ owned: true, how: 'marked', itemId: m.id });
        expect(keepsRow(e, m.garment, e.slot)).toBe(true);
        // Every row's own color recolor keeps it too.
        expect(keepsRow(e, { ...m.garment, color_family: 'burgundy' }, e.slot)).toBe(true);
      }
    }
    // Names are plain, no prices or colors in them.
    expect(STARTER.map((e) => e.name)).toEqual(Array.from({ length: 12 }, (_, i) => en[`starter.item.${i + 1}` as keyof typeof en]));
  });

  it('O7: picking again changes the same piece; Remove deletes it; both undo', async () => {
    const store = createMemoryStore();
    const ids = counterIds();
    const tee = STARTER.find((e) => e.id === 's01')!;
    const r1 = await pickStarter(store, tee, tee.owns[0]!, ids, T0);
    expect(r1?.undo).toBeDefined();
    const [p1] = await store.closet.all();
    expect(p1).toMatchObject({ name: 'Black tee', isDeleted: false });
    const r2 = await pickStarter(store, tee, tee.owns[1]!, ids, T0 + 1);
    const all = (await store.closet.all()).filter((c) => !c.isDeleted);
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ id: p1!.id, name: 'White tee' });
    expect(r2?.text).toBe(t('starter.addedToast', { item: 'White tee' }));
    await r2!.undo!();
    expect((await store.closet.get(p1!.id))?.name).toBe('Black tee');
    const r3 = await removeStarter(store, tee, T0 + 2);
    expect((await store.closet.get(p1!.id))?.isDeleted).toBe(true);
    await r3!.undo!();
    expect((await store.closet.get(p1!.id))?.isDeleted).toBe(false);
    // Undo on a first pick takes it back out.
    const jeans = STARTER.find((e) => e.id === 's05')!;
    const r4 = await pickStarter(store, jeans, jeans.owns[0]!, ids, T0 + 3);
    await r4!.undo!();
    expect(ownership(await store.closet.all(), []).s05).toEqual({ owned: false });
  });

  it('O8: a piece his fit checks found locks its row; a pick there does nothing', async () => {
    const store = createMemoryStore();
    await store.closet.put(piece('T1', 'top', 'tee', 'white'));
    const tee = STARTER.find((e) => e.id === 's01')!;
    expect(await pickStarter(store, tee, tee.owns[0]!, counterIds(), T0)).toBeNull();
    expect(await store.closet.all()).toHaveLength(1);
  });

  it('O9: the belt marks in kv only, and a second tap removes it with Undo', async () => {
    const store = createMemoryStore();
    const belt = STARTER.find((e) => e.id === 's12')!;
    expect(markedPiece(belt, { subcategory: 'belt', color: 'brown' }, 'B', T0)).toBeNull();
    await toggleMarkOnly(store, belt, T0);
    expect(await getStarterMarks(store)).toEqual(['s12']);
    const r = await toggleMarkOnly(store, belt, T0);
    expect(await getStarterMarks(store)).toEqual([]);
    await r!.undo!();
    expect(await getStarterMarks(store)).toEqual(['s12']);
    expect(await store.closet.all()).toHaveLength(0);
  });

  it('basicsAdded counts list pieces and the belt, never photographed or removed pieces', () => {
    const tee = STARTER.find((e) => e.id === 's01')!;
    const m = markedPiece(tee, tee.owns[0]!, 'M', T0)!;
    expect(basicsAdded([m, { ...m, id: 'D', isDeleted: true }, piece('P', 'top', 'tee', 'white')], ['s12'])).toBe(2);
    expect(basicsAdded([], [])).toBe(0);
  });
});

// ── What you already own (was Starter essentials) ────────────────────────────────────────────────────────────────
describe('B1 · the list\'s rows', () => {
  it('B1: 12 rows in 02 order; the buying data stays for Next best buy; pieces in his closet count as owned', () => {
    expect(STARTER[0]).toMatchObject({ budget: '$15–20', mid: '$35–60' });
    expect(STARTER[11]).toMatchObject({ budget: 'About $30', mid: '$50–100', slot: null });
    const closet = [piece('T1', 'top', 'tee', 'white'), piece('J', 'bottom', 'jeans', 'denim_dark', { garment: { category: 'bottom', subcategory: 'jeans', color_family: 'denim_dark', leg_shape: 'slim' } }), piece('S', 'shoes', 'loafer', 'brown')];
    const own = ownership(closet, []);
    expect(own.s01).toMatchObject({ owned: true, how: 'closet' });
    expect(own.s05).toEqual({ owned: false }); // a photographed slim jean still doesn't fill the row (O10: fills unchanged)
    expect(own.s10).toMatchObject({ owned: true, how: 'closet' });
    expect(ownedCount(own, STARTER.map((e) => e.id))).toBe(2); // of today's 12 (look rows are in the catalog since #364)
    expect(ownership([{ ...closet[0]!, isDeleted: true }], []).s01).toEqual({ owned: false });
    // +N: adding the third slot makes outfits; nothing to pair with makes none.
    const two = [piece('T', 'top', 'tee', 'white'), piece('B', 'bottom', 'chinos', 'khaki_beige')];
    expect(starterGain(two, null, STARTER[8]!)).toBeGreaterThan(0);
    expect(starterGain([], null, STARTER[0]!)).toBe(0);
    expect(bestMissing(two, null, [])).not.toBeNull();
  });
});

// ── The paywall ──────────────────────────────────────────────────────────────────────────────────────────────────
describe('P2–P8 · the paywall', () => {
  it('P2: never "unlimited"; the limits are the quota\'s', () => {
    const words = [paywallTitle(), ...paywallPerks(), plansReminder(), finePrint(PRO_MONTHLY, true), finePrint(PRO_MONTHLY, false)].join(' ');
    expect(words).not.toMatch(/unlimited/i);
    expect(paywallTitle()).toContain(String(LIMITS.proChecks));
    expect(paywallPerks()).toEqual([`Up to ${LIMITS.proChecks} fit checks a day`, `Up to ${LIMITS.proQuestions} questions a day`]);
    expect(plansReminder()).toBe(`Up to ${LIMITS.proChecks} fit checks and ${LIMITS.proQuestions} questions a day.`);
  });

  it('P3/P4: monthly only, $9.99 with a 1-week trial; the fine print says what Apple requires', () => {
    expect(PRO_MONTHLY).toEqual({ id: 'kitted.pro.monthly', period: 'month', price: '$9.99', trialDays: 7 });
    expect(planDetail(PRO_MONTHLY, true)).toBe('1 week free');
    expect(ctaTitle(PRO_MONTHLY, true)).toBe('Start 1-week free trial');
    const trial = finePrint(PRO_MONTHLY, true);
    expect(trial).toMatch(/1 week, then \$9\.99 a month/);
    expect(trial).toMatch(/renews every month until you cancel/);
    expect(trial).toMatch(/24 hours/);
    expect(trial).toMatch(/Subscriptions/);
    // The trial used: no trial words, the price in the button.
    expect(planDetail(PRO_MONTHLY, false)).toBe('No trial');
    expect(ctaTitle(PRO_MONTHLY, false)).toBe('Subscribe for $9.99/month');
    expect(finePrint(PRO_MONTHLY, false)).toMatch(/^\$9\.99 a month\. It renews every month/);
    expect(finePrint(PRO_MONTHLY, false)).not.toMatch(/free|trial/i);
    // No yearly plan, no 14-day words anywhere a paywall entry point reads.
    expect(t('limit.pro')).toBe('Try Pro · 1 week free');
  });

  it('P3/P7: the paywall can only be switched on with Terms and Privacy pages', () => {
    if (PAYWALL_BUILT) {
      expect(TERMS_URL).toBeTruthy();
      expect(PRIVACY_URL).toBeTruthy();
    } else {
      expect(PAYWALL_BUILT).toBe(false);
    }
    expect(NOTIFICATIONS_BUILT).toBe(false); // no expo-notifications yet: no ask on his phone
  });

  it('P5/P6: the mock store\'s outcomes, and a purchase makes him Pro', async () => {
    let pro = false;
    const make = (s: () => StoreScript) => createMockStore({ script: s, setPro: (v) => (pro = v), isPro: () => pro });
    expect(await make(() => 'ok').products()).toEqual({ kind: 'ok', products: [PRO_MONTHLY] });
    expect(await make(() => 'loadFailed').products()).toEqual({ kind: 'failed' });
    expect(await make(() => 'offline').products()).toEqual({ kind: 'offline' });
    expect(await make(() => 'cancel').purchase(PRO_MONTHLY.id)).toEqual({ kind: 'cancelled' });
    expect(await make(() => 'pending').purchase(PRO_MONTHLY.id)).toEqual({ kind: 'pending' });
    expect(await make(() => 'fail').purchase(PRO_MONTHLY.id)).toEqual({ kind: 'failed' });
    expect(pro).toBe(false);
    expect(await make(() => 'ok').restore()).toBe('none');
    const st = make(() => 'ok');
    expect(await st.trialEligible()).toBe(true);
    expect(await st.purchase(PRO_MONTHLY.id)).toEqual({ kind: 'ok' });
    expect(pro).toBe(true);
    expect(await st.trialEligible()).toBe(false);
    expect(await st.restore()).toBe('restored');
    expect(await make(() => 'noTrial').trialEligible()).toBe(false);
    expect(st.mock).toBe(true);
  });

  it('P8: the Today card\'s variants', () => {
    const today = { todayKey: '2026-10-22', first: true };
    const a = check('a', T0, { score: 6.5, fixes: [fix('Tuck', { to: 7.0 }), fix('Cuff', { to: 8.0 }), fix('Buy', { free: false, to: 9.0 })] });
    expect(todayCard(a, null, today)).toEqual({ title: 'Today: 6.5', detail: '2 free fixes to 8.0.', checkId: 'a' });
    expect(todayCard(check('a', T0, { fixes: [fix('Tuck', { to: 7.0 })] }), null, today)!.detail).toBe('One free fix to 7.0.');
    const re = check('r', T0 + 1, { parentId: 'a', score: 7.5, details: { recheck: { parentScore: 6.5, delta: 1, rawDelta: 1, notes: [], doneFixes: [{ copy: 'Tuck', earned: 1 }], newProblems: [], notSeen: false } } });
    expect(todayCard(a, re, today)).toEqual({ title: 'Today: 6.5 → 7.5', detail: 'One free fix. Nothing new to buy.', checkId: 'r' });
    expect(todayCard(check('a', T0, { score: 9, fixes: [] }), null, today)!.detail).toBe('Dialed in on your first check.');
    expect(todayCard(check('a', T0, { score: 9, fixes: [] }), null, { ...today, first: false })!.detail).toBeNull();
    expect(todayCard(a, null, { ...today, todayKey: '2026-10-23' })).toBeNull(); // not today: no card
    expect(todayCard(null, null, today)).toBeNull();
  });
});

// ── The notification ask ─────────────────────────────────────────────────────────────────────────────────────────
describe('N1–N3 · the notification ask', () => {
  async function asked(notifications = scriptedNotifications('allow')) {
    const store = await freshStore();
    await store.fitChecks.put(check('a', T0, { fixes: [] }));
    const requests: number[] = [];
    const wrapped = { permission: notifications.permission, request: async () => (requests.push(1), notifications.request()) };
    const { d } = deps(store, { paywallOn: () => false, notifications: wrapped });
    const s = createFinishService(d);
    await s.ensure();
    const id = (await cards(store)).find((m) => m.payload.question === 'notify')!.id;
    return { store, s, id, requests };
  }

  it('N1: Yes grows the card with the time (8:00 or his own) and asks only on Set', async () => {
    const { store, s, id, requests } = await asked();
    await s.notifyYes(id);
    expect((await store.chat.get(id))!.payload).toMatchObject({ state: 'picking', time: '08:00' });
    expect(requests).toHaveLength(0);
    await s.notifyPickTime(id, '07:30');
    expect(requests).toHaveLength(0);
    expect(await s.notifySet(id)).toBe('allowed');
    expect(requests).toHaveLength(1);
  });

  it('N2: allowed saves the time and the switch; denied and No thanks say where to turn it on', async () => {
    const a = await asked();
    await a.s.notifyYes(a.id);
    await a.s.notifyPickTime(a.id, '07:30');
    await a.s.notifySet(a.id);
    expect((await a.store.profile.get('me'))!.ideaTime).toBe('07:30');
    expect((await loadNotificationPrefs(a.store)).idea).toBe(true);
    expect((await a.store.chat.get(a.id))!.payload.state).toBe('allowed');
    expect(t('notif.ask.done', { time: '7:30 am' })).toBe('Done. Your first idea lands tomorrow at 7:30 am.');

    const d = await asked(scriptedNotifications('deny'));
    await d.s.notifyYes(d.id);
    expect(await d.s.notifySet(d.id)).toBe('denied');

    const n = await asked();
    await n.s.notifyNo(n.id);
    expect(n.requests).toHaveLength(0);
    expect((await n.store.chat.get(n.id))!.payload.state).toBe('declined');
    expect((await loadNotificationPrefs(n.store)).idea).toBe(false);
  });

  it('N3: an answered ask never changes and never posts again', async () => {
    const { store, s, id, requests } = await asked();
    await s.notifyNo(id);
    await s.notifyYes(id);
    expect(await s.notifySet(id)).toBe('declined');
    expect(requests).toHaveLength(0);
    await s.ensure();
    expect((await cards(store)).filter((m) => m.payload.question === 'notify')).toHaveLength(1);
  });
});

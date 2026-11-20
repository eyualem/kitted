// T41 · When "Keep your fits" is offered, and what it says (specs/sign-in-and-backup.md SB1.2–SB1.6, SB3.1;
// tasks/T41/TESTING.md): the pure rule (offer.ts), the service that posts the chat card (offerService.ts) on the memory
// store, and the card's words by the numbers (offerCopy.ts). No network, no AI, no photo is read: the fit checks are
// rows with no photo, the closet pieces are the bundled seed's own.
import seed from '../../assets/seed.json';
import { US_EASTERN } from '@kitted/core';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import type { KittedStore } from '@/data/store';
import type { ChatMessage, ClosetItemRow, FitCheckRow } from '@/data/types';
import { ACCOUNTS_BUILT } from '@/config/features';
import { getOffer, saveAccount, setDemoAccounts } from '@/features/account/account';
import { CHECKS_BEFORE_SECOND, NEW_VISIT_AFTER_MS, NO_OFFER, nextVisitStart, offerDue, type OfferCheck, type OfferInput } from '@/features/account/offer';
import { offerBody } from '@/features/account/offerCopy';
import { createOfferService } from '@/features/account/offerService';
import { counterIds } from '@/services/ids';

jest.mock('expo-apple-authentication', () => ({}), { virtual: true });

const T0 = Date.parse('2026-10-22T11:00:00Z');
const MIN = 60_000;

function check(id: string, createdAt: number, o: Partial<FitCheckRow> = {}): FitCheckRow {
  return {
    id, createdAt, dayKey: '2026-10-22', photoFile: null, thumbFile: null, demoPhotoId: 'p01b', imageHash: id, occasion: 'everyday', style: null,
    status: 'scored', isPartial: false, notRated: [], score: 7.5, rawScore: 7.5, subscores: {}, occasionAdj: 0, rulesFired: [], credits: [], advice: [],
    fixes: [], explanation: null, rubricVersion: 'parts', isFavorite: false, snapState: 'none', recheckUsed: false, isFirstCheck: false, readingId: null,
    parentId: null, itemIds: [], details: {}, ...o,
  } as FitCheckRow;
}

/** The bundled seed's closet pieces (live ones), to put four of them on a phone. */
async function seedPieces(): Promise<ClosetItemRow[]> {
  const s = createMemoryStore();
  await s.init();
  await loadScenario(s, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: Date.parse('2026-10-22T07:41:00-04:00') });
  return (await s.closet.all()).filter((i) => !i.isDeleted);
}

async function phone() {
  const store = createMemoryStore();
  await store.init();
  return store;
}

const accountCards = async (store: KittedStore): Promise<ChatMessage[]> => (await store.chat.all()).filter((m) => m.cardType === 'account');

/** A service on a clock we move, a fit-check session we flip, and a `holds` we flip. */
function service(store: KittedStore, o: { start?: number } = {}) {
  const k = { now: o.start ?? T0, busy: false, holds: false };
  const svc = createOfferService({ store, now: () => k.now, ids: counterIds(), busy: () => k.busy, enabled: () => true, holds: async () => k.holds });
  return { svc, k };
}

const full = (n: number, base = T0 - 10 * MIN): OfferCheck[] => Array.from({ length: n }, (_, i) => ({ createdAt: base + i * 1000, status: 'scored', recheck: false }));
const input = (o: Partial<OfferInput> = {}): OfferInput => ({
  enabled: true, signedIn: false, busy: false, state: { ...NO_OFFER }, checks: [{ createdAt: T0, status: 'scored', recheck: false }], visitStartMs: T0 + 1, ...o,
});

// ── SB1.2 · never before a scored fit, never while reading or waiting, never signed in, never a modal ───────────────
describe('SB1.2 · no card before a scored fit, while busy, or while signed in', () => {
  it('SB1.2 · offerDue is false for every one of those, and true when none holds', () => {
    expect(offerDue(input())).toBe(true);
    expect(offerDue(input({ checks: [] }))).toBe(false);
    expect(offerDue(input({ checks: [{ createdAt: T0 - 9e6, status: 'scoring', recheck: false }] }))).toBe(false);
    expect(offerDue(input({ checks: [{ createdAt: T0 - 9e6, status: 'asking', recheck: false }] }))).toBe(false);
    expect(offerDue(input({ checks: [{ createdAt: T0 - 9e6, status: 'failed', recheck: false }] }))).toBe(false);
    expect(offerDue(input({ busy: true }))).toBe(false);
    expect(offerDue(input({ signedIn: true }))).toBe(false);
    expect(offerDue(input({ enabled: false }))).toBe(false);
  });

  it('SB1.2 · the service posts nothing with no scored fit, a check still scoring or asking, the fit-check session busy, or while signed in', async () => {
    // The base: a first fit scored before this visit began, so it would post.
    const base = async () => {
      const store = await phone();
      await store.fitChecks.put(check('FC1', T0 - 60 * MIN));
      return store;
    };
    const none = await phone();
    const a = service(none);
    expect(await a.svc.ensure()).toBeNull();
    expect(await accountCards(none)).toEqual([]);

    for (const status of ['scoring', 'asking'] as const) {
      const store = await base();
      await store.fitChecks.put(check('FC2', T0 - MIN, { status }));
      expect(await service(store).svc.ensure()).toBeNull();
      expect(await accountCards(store)).toEqual([]);
      expect(await getOffer(store)).toEqual(NO_OFFER);
    }

    const busy = await base();
    const b = service(busy);
    b.k.busy = true;
    expect(await b.svc.ensure()).toBeNull();
    expect(await accountCards(busy)).toEqual([]);

    const signedIn = await base();
    await saveAccount(signedIn, { uid: 'g1', provider: 'apple', email: null, signedInAt: T0 });
    expect(await service(signedIn).svc.ensure()).toBeNull();
    expect(await accountCards(signedIn)).toEqual([]);

    // And with none of those: the card is posted, once, as an inline chat card (never a route).
    const ok = await base();
    const c = service(ok);
    const id = await c.svc.ensure();
    expect(id).not.toBeNull();
    const cards = await accountCards(ok);
    expect(cards).toHaveLength(1);
    expect([cards[0]!.id, cards[0]!.role, cards[0]!.kind, cards[0]!.cardType, cards[0]!.text]).toEqual([id, 'stylist', 'card', 'account', null]);
    expect(cards[0]!.payload).toMatchObject({ offer: 1, state: 'open' });
    expect(await c.svc.ensure()).toBeNull();
    expect(await accountCards(ok)).toHaveLength(1);
  });
});

// ── SB1.3 · the first card: on the first re-check, or on a later visit ──────────────────────────────────────────────
describe('SB1.3 · the first card is never in the visit that scored his first fit', () => {
  it('SB1.3 · offerDue: first fit this visit → no; with a scored re-check → yes; first fit before the visit → yes; a re-check still scoring does not count', () => {
    const fit = { createdAt: T0, status: 'scored', recheck: false };
    expect(offerDue(input({ checks: [fit], visitStartMs: T0 - 1000 }))).toBe(false);
    expect(offerDue(input({ checks: [fit, { createdAt: T0 + MIN, status: 'scored', recheck: true }], visitStartMs: T0 - 1000 }))).toBe(true);
    expect(offerDue(input({ checks: [fit, { createdAt: T0 + MIN, status: 'scoring', recheck: true }], visitStartMs: T0 - 1000 }))).toBe(false);
    expect(offerDue(input({ checks: [fit], visitStartMs: T0 + 1 }))).toBe(true);
  });

  it('SB1.3 · a visit starts after 30 minutes away: 29:59 is the same visit, 30:00 exactly is a new one', () => {
    const left = T0 + 5000;
    expect(nextVisitStart(T0, left, left + NEW_VISIT_AFTER_MS - 1)).toBe(T0);
    expect(nextVisitStart(T0, left, left + NEW_VISIT_AFTER_MS)).toBe(left + NEW_VISIT_AFTER_MS);
    expect(NEW_VISIT_AFTER_MS).toBe(30 * MIN);
    expect(nextVisitStart(T0, null, left)).toBe(T0);
  });

  it('SB1.3 · the service: not in the first fit\'s own visit; on the first scored re-check; on a later visit', async () => {
    // Launch, then his first fit is scored in this visit: no card.
    const store = await phone();
    const { svc, k } = service(store);
    expect(await svc.ensure()).toBeNull();
    k.now = T0 + 2 * MIN;
    await store.fitChecks.put(check('FC1', k.now));
    expect(await svc.ensure()).toBeNull();
    expect(await accountCards(store)).toEqual([]);
    // His first re-check comes back scored: the card.
    k.now = T0 + 5 * MIN;
    await store.fitChecks.put(check('FC2', k.now, { parentId: 'FC1' }));
    const id = await svc.ensure();
    expect(id).not.toBeNull();
    expect((await accountCards(store)).map((m) => m.id)).toEqual([id]);

    // A later visit: 29:59 away is the same visit (no card), a service that comes back after 30:00 posts.
    for (const [away, posts] of [[NEW_VISIT_AFTER_MS - 1, false], [NEW_VISIT_AFTER_MS, true]] as const) {
      const s2 = await phone();
      const v = service(s2);
      await v.svc.ensure();
      v.k.now = T0 + MIN;
      await s2.fitChecks.put(check('FC1', v.k.now));
      expect(await v.svc.ensure()).toBeNull();
      v.svc.left();
      v.k.now += away;
      v.svc.back();
      const got = await v.svc.ensure();
      expect([away, got !== null]).toEqual([away, posts]);
    }
  });
});

// ── SB1.4 · one ask per visit ───────────────────────────────────────────────────────────────────────────────────────
describe('SB1.4 · the card waits when the sequence or another ask posted this visit', () => {
  it('SB1.4 · holds true: nothing is posted and shown stays 0; a later visit with holds false posts', async () => {
    const store = await phone();
    const { svc, k } = service(store);
    await svc.ensure();
    k.now = T0 + MIN;
    await store.fitChecks.put(check('FC1', k.now));
    k.now = T0 + 2 * MIN;
    await store.fitChecks.put(check('FC2', k.now, { parentId: 'FC1' }));
    // Due by every other rule, but the setup sequence or another ask went first this visit.
    k.holds = true;
    expect(await svc.ensure()).toBeNull();
    expect(await svc.ensure()).toBeNull();
    expect(await accountCards(store)).toEqual([]);
    expect((await getOffer(store)).shown).toBe(0);
    // The next visit, nothing else asked.
    svc.left();
    k.now += NEW_VISIT_AFTER_MS;
    svc.back();
    k.holds = false;
    const id = await svc.ensure();
    expect(id).not.toBeNull();
    expect((await getOffer(store)).shown).toBe(1);
    expect(await accountCards(store)).toHaveLength(1);
  });
});

// ── SB1.5 · the last card ───────────────────────────────────────────────────────────────────────────────────────────
describe('SB1.5 · the last card: Not now, then 3 more scored full checks; never a third', () => {
  it('SB1.5 · offerDue after a decline at N full checks: N+2 no, N+2 plus re-checks no, N+3 yes; after card 2 never; no decline never', () => {
    const N = 4;
    const declined = { shown: 1, declined: true, checksAtDecline: N };
    const re = (n: number): OfferCheck[] => Array.from({ length: n }, (_, i) => ({ createdAt: T0 + i, status: 'scored', recheck: true }));
    expect(CHECKS_BEFORE_SECOND).toBe(3);
    expect(offerDue(input({ state: declined, checks: full(N + 2) }))).toBe(false);
    expect(offerDue(input({ state: declined, checks: [...full(N + 2), ...re(1)] }))).toBe(false);
    expect(offerDue(input({ state: declined, checks: [...full(N + 2), ...re(10)] }))).toBe(false);
    expect(offerDue(input({ state: declined, checks: full(N + 3) }))).toBe(true);
    expect(offerDue(input({ state: { shown: 2, declined: true, checksAtDecline: 9 }, checks: full(60) }))).toBe(false);
    expect(offerDue(input({ state: { shown: 2, declined: false, checksAtDecline: null }, checks: full(60) }))).toBe(false);
    expect(offerDue(input({ state: { shown: 1, declined: false, checksAtDecline: null }, checks: full(60) }))).toBe(false);
  });

  it('SB1.5 · the service: card 1, Not now, N+2 and re-checks nothing, N+3 posts card 2 (offer 2), then never again', async () => {
    const store = await phone();
    const { svc, k } = service(store, { start: T0 });
    for (let i = 1; i <= 3; i++) await store.fitChecks.put(check(`FC${i}`, T0 - 90 * MIN + i));
    const first = await svc.ensure();
    expect(first).not.toBeNull();
    expect((await store.chat.get(first!))!.payload).toMatchObject({ offer: 1 });
    await svc.decline(first!);
    expect(await getOffer(store)).toEqual({ shown: 1, declined: true, checksAtDecline: 3 });
    // 2 more full checks, then any number of re-checks: not yet.
    for (let i = 4; i <= 5; i++) await store.fitChecks.put(check(`FC${i}`, T0 + i));
    for (let i = 1; i <= 6; i++) await store.fitChecks.put(check(`RC${i}`, T0 + 100 + i, { parentId: 'FC1' }));
    k.now = T0 + 20;
    expect(await svc.ensure()).toBeNull();
    expect(await accountCards(store)).toHaveLength(1);
    // The 3rd more full check.
    await store.fitChecks.put(check('FC6', T0 + 6));
    const second = await svc.ensure();
    expect(second).not.toBeNull();
    expect((await store.chat.get(second!))!.payload).toMatchObject({ offer: 2 });
    await svc.decline(second!);
    for (let i = 7; i <= 40; i++) await store.fitChecks.put(check(`FC${i}`, T0 + i));
    expect(await svc.ensure()).toBeNull();
    expect(await accountCards(store)).toHaveLength(2);
    expect((await getOffer(store)).shown).toBe(2);
  });

  it('SB1.5 · the second card never posts without a Not now on the first', async () => {
    const store = await phone();
    const { svc } = service(store);
    for (let i = 1; i <= 2; i++) await store.fitChecks.put(check(`FC${i}`, T0 - 90 * MIN + i));
    expect(await svc.ensure()).not.toBeNull();
    for (let i = 3; i <= 30; i++) await store.fitChecks.put(check(`FC${i}`, T0 + i));
    expect(await svc.ensure()).toBeNull();
    expect(await accountCards(store)).toHaveLength(1);
  });
});

// ── SB1.6 · off means off ───────────────────────────────────────────────────────────────────────────────────────────
describe('SB1.6 · with ACCOUNTS_BUILT off the service posts nothing outside a demo screen', () => {
  it('SB1.6 · ensure() with the real switch posts nothing even when everything else is due; a demo script turns it on', async () => {
    expect(ACCOUNTS_BUILT).toBe(false);
    setDemoAccounts(null);
    const store = await phone();
    await store.fitChecks.put(check('FC1', T0 - 90 * MIN));
    const svc = createOfferService({ store, now: () => T0, ids: counterIds(), busy: () => false });
    expect(await svc.ensure()).toBeNull();
    expect(await accountCards(store)).toEqual([]);
    expect(await getOffer(store)).toEqual(NO_OFFER);
    try {
      setDemoAccounts('ok');
      const demo = createOfferService({ store, now: () => T0, ids: counterIds(), busy: () => false });
      expect(await demo.ensure()).not.toBeNull();
    } finally {
      setDemoAccounts(null);
    }
  });
});

// ── SB3.1 · the card's words, by the numbers ────────────────────────────────────────────────────────────────────────
describe('SB3.1 · the save card\'s body', () => {
  const TAIL_BOTH = ' Sign in to back them up and get them back on a new phone. Kitted works the same without it.';
  it('SB3.1 · fits and pieces: the exact line', () => {
    expect(offerBody({ fits: 12, pieces: 4 })).toBe(`Your 12 fits and the 4 pieces in your closet live only on this iPhone.${TAIL_BOTH}`);
  });

  it('SB3.1 · no pieces: the closet part is left out', () => {
    expect(offerBody({ fits: 12, pieces: 0 })).toBe(`Your 12 fits live only on this iPhone.${TAIL_BOTH}`);
  });

  it('SB3.1 · one fit: "Your first fit" (and the rest as written)', () => {
    const withPieces = offerBody({ fits: 1, pieces: 4 });
    expect(withPieces.startsWith('Your first fit')).toBe(true);
    expect(withPieces).toContain('4 pieces in your closet');
    expect(withPieces.endsWith(TAIL_BOTH.trim())).toBe(true);
    const alone = offerBody({ fits: 1, pieces: 0 });
    expect(alone.startsWith('Your first fit')).toBe(true);
    expect(alone).not.toMatch(/pieces|closet/);
  });

  it('SB3.1 · never the old wording about chats, in any case', () => {
    for (const c of [{ fits: 12, pieces: 4 }, { fits: 1, pieces: 4 }, { fits: 12, pieces: 0 }, { fits: 1, pieces: 0 }]) expect(offerBody(c)).not.toMatch(/chats|Lookbook/);
  });

  it('SB3.1 · the posted card holds the scored full-check count and the live piece count at posting', async () => {
    const store = await phone();
    const pieces = (await seedPieces()).slice(0, 4);
    expect(pieces).toHaveLength(4);
    for (const p of pieces) await store.closet.put(p);
    await store.closet.put({ ...pieces[0]!, id: 'deleted-piece', isDeleted: true });
    // 3 scored full checks, a scored re-check and a failed one: 3 fits.
    for (let i = 1; i <= 3; i++) await store.fitChecks.put(check(`FC${i}`, T0 - 90 * MIN + i));
    await store.fitChecks.put(check('RC1', T0 - 80 * MIN, { parentId: 'FC1' }));
    await store.fitChecks.put(check('FX1', T0 - 80 * MIN, { status: 'failed' }));
    const { svc } = service(store);
    const id = await svc.ensure();
    expect(id).not.toBeNull();
    const m = (await store.chat.get(id!))!;
    expect(m.payload).toMatchObject({ offer: 1, fits: 3, pieces: 4, state: 'open' });
  });
});

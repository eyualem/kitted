// T54 (F6): one morning or evening card per day key and window, however many times Stylist asks for it at once (the tab
// refocused, the app back to the front) while the weather loads. The contract: tasks/T54/TESTING.md.
//
// The weather is a hand-driven deferred `forecast`: each test resolves it itself, only once every call under test has
// gone as far as it can on its own (`flush` drains the microtask queue between macrotask ticks; the memory store has no
// timers, so one tick takes every call to its next real wait). No network, no sleeps.
import { US_EASTERN, type DayWeather, type WeatherWindow } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import type { KittedStore } from '@/data/store';
import type { ChatMessage } from '@/data/types';
import { createMorningService } from '@/features/morning/service';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import type { WeatherPermission, WeatherSource } from '@/services/weather';

const at = (iso: string) => Date.parse(iso);
const SEED_AS_OF = at('2026-11-01T07:00:00-05:00');
const EVENING = '2026-11-07T18:30:00-05:00';
const EVENING_ID = '2026-11-07|evening';
const DAY = '2026-11-09T07:40:00-05:00';
const DAY_ID = '2026-11-09|day';

const WEATHER: Record<WeatherWindow, DayWeather> = {
  day: { window: 'day', nowF: 46, highF: 63, lowF: 44, feelsLowF: 42, feelsHighF: 61, precipChance: 0.7, precipFromHour: 17, condition: 'cloudy' },
  evening: { window: 'evening', nowF: 52, highF: 54, lowF: 47, feelsLowF: 44, feelsHighF: 52, precipChance: 0.8, precipFromHour: 18, condition: 'rain', lateF: 47 },
};

const tick = () => new Promise<void>((r) => setImmediate(r));
async function flush(n = 5) {
  for (let i = 0; i < n; i++) await tick();
}
/** Waits (bounded, by ticks, not time) until `pred` holds; returns whether it did. */
async function until(pred: () => boolean, n = 50): Promise<boolean> {
  for (let i = 0; i < n; i++) {
    if (pred()) return true;
    await tick();
  }
  return pred();
}

type Held = ReturnType<typeof heldWeather>;
/** A weather double whose forecast waits until the test resolves (or rejects) it. */
function heldWeather(o: { kind?: 'sample' | 'live'; permission?: () => Promise<WeatherPermission> } = {}) {
  const pending: { window: WeatherWindow; resolve: (w: DayWeather | null) => void; reject: (e: unknown) => void }[] = [];
  const calls: WeatherWindow[] = [];
  const source: WeatherSource = {
    kind: o.kind ?? 'sample',
    permission: o.permission ?? (async () => 'granted'),
    requestPermission: async () => 'granted',
    forecast: (window) => {
      calls.push(window);
      return new Promise<DayWeather | null>((resolve, reject) => pending.push({ window, resolve, reject }));
    },
  };
  return {
    source,
    calls,
    pending: () => pending.length,
    resolveAll: () => pending.splice(0).forEach((p) => p.resolve({ ...WEATHER[p.window] })),
    rejectAll: (e: unknown) => pending.splice(0).forEach((p) => p.reject(e)),
  };
}

/** Lets the calls run as far as they go, then answers every forecast asked for, until all have settled. */
async function drainSettled<T>(w: Held, ps: Promise<T>[], answer: 'resolve' | 'reject' = 'resolve'): Promise<PromiseSettledResult<T>[]> {
  let done = false;
  const all = Promise.allSettled(ps).then((r) => {
    done = true;
    return r;
  });
  for (let i = 0; i < 40 && !done; i++) {
    await flush();
    if (answer === 'resolve') w.resolveAll();
    else w.rejectAll(new Error('offline'));
  }
  if (!done) throw new Error('the calls never settled');
  return all;
}
async function drain<T>(w: Held, ps: Promise<T>[], answer: 'resolve' | 'reject' = 'resolve'): Promise<T[]> {
  return (await drainSettled(w, ps, answer)).map((r) => {
    if (r.status === 'rejected') throw r.reason;
    return r.value;
  });
}

async function setup(o: { now: string; weather?: Held; empty?: boolean; enabled?: () => boolean; store?: KittedStore; ids?: (p: string) => string }) {
  const store = o.store ?? createMemoryStore();
  if (!o.empty && !o.store) await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: SEED_AS_OF });
  const clock = manualClock(at(o.now));
  const w = o.weather ?? heldWeather();
  const ids = o.ids ?? counterIds();
  const svc = createMorningService({ store, clock, weather: w.source, ids, ...(o.enabled ? { enabled: o.enabled } : {}) });
  const outfitsBefore = (await store.outfits.all()).length;
  const newOutfits = async () => (await store.outfits.all()).length - outfitsBefore;
  return { store, clock, svc, w, ids, newOutfits };
}

/** "Cards for X": the morning-card messages whose payload names that idea. */
async function cardsFor(store: KittedStore, id: string): Promise<ChatMessage[]> {
  return (await store.chat.all()).filter(
    (m) => m.kind === 'card' && m.cardType === 'morning' && (m.payload as { ideaId?: unknown } | null)?.ideaId === id,
  );
}
async function allMorningCards(store: KittedStore): Promise<ChatMessage[]> {
  return (await store.chat.all()).filter((m) => m.kind === 'card' && m.cardType === 'morning');
}
const tally = (rs: (string | null)[]) => rs.map((r) => (r === null ? 'null' : r)).sort();

describe('F6 · one card per day and window', () => {
  it('F6 · two calls at once in the evening post one card', async () => {
    const { store, svc, w, newOutfits } = await setup({ now: EVENING });
    const results = await drain(w, [svc.ensureCard(), svc.ensureCard()]);
    expect(tally(results)).toEqual(tally([EVENING_ID, null]));
    const cards = await cardsFor(store, EVENING_ID);
    expect(cards).toHaveLength(1);
    const rows = (await store.dailyIdeas.all()).filter((r) => r.id === EVENING_ID);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ messageId: cards[0]!.id, slot: 'evening', occasion: 'going_out', state: 'idea' });
    expect(await newOutfits()).toBe(1);
    // The one new outfit is the card's (no orphan): the row and the message both point at it.
    expect(rows[0]!.outfitId).not.toBeNull();
    expect(await store.outfits.get(rows[0]!.outfitId!)).toMatchObject({ id: rows[0]!.outfitId, source: 'idea' });
    expect(cards[0]!.outfitId).toBe(rows[0]!.outfitId);
  });

  it('F6 · two calls at once in the evening post one card (edge: three calls)', async () => {
    const { store, svc, w, newOutfits } = await setup({ now: EVENING });
    const results = await drain(w, [svc.ensureCard(), svc.ensureCard(), svc.ensureCard()]);
    expect(tally(results)).toEqual(tally([EVENING_ID, null, null]));
    expect(await cardsFor(store, EVENING_ID)).toHaveLength(1);
    expect(await newOutfits()).toBe(1);
  });

  it('F6 · two calls at once by day post one card', async () => {
    const { store, svc, w, newOutfits } = await setup({ now: DAY });
    const results = await drain(w, [svc.ensureCard(), svc.ensureCard()]);
    expect(tally(results)).toEqual(tally([DAY_ID, null]));
    const cards = await cardsFor(store, DAY_ID);
    expect(cards).toHaveLength(1);
    const rows = (await store.dailyIdeas.all()).filter((r) => r.id === DAY_ID);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ messageId: cards[0]!.id, slot: 'day', occasion: 'class', state: 'idea' });
    expect(await newOutfits()).toBe(1);
  });

  it('F6 · a call while the weather loads posts nothing', async () => {
    const { store, svc, w, newOutfits } = await setup({ now: EVENING });
    const a = svc.ensureCard();
    expect(await until(() => w.calls.length === 1)).toBe(true); // A is waiting on the weather
    const b = svc.ensureCard();
    const [ra, rb] = await drain(w, [a, b]);
    expect(ra).toBe(EVENING_ID);
    expect(rb).toBeNull();
    expect(await cardsFor(store, EVENING_ID)).toHaveLength(1);
    expect(await newOutfits()).toBe(1);
  });

  describe('live weather that never answers', () => {
    afterEach(() => jest.useRealTimers());

    it('F6 · a call while the weather loads posts nothing (edge: live, the 7 s timeout)', async () => {
      jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'] });
      const store = createMemoryStore();
      await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: SEED_AS_OF });
      const calls: WeatherWindow[] = [];
      const weather: WeatherSource = {
        kind: 'live',
        permission: async () => 'granted',
        requestPermission: async () => 'granted',
        forecast: (window) => {
          calls.push(window);
          return new Promise<DayWeather | null>(() => {});
        },
      };
      const svc = createMorningService({ store, clock: manualClock(at(EVENING)), weather, ids: counterIds() });
      let settled = 0;
      const a = svc.ensureCard().finally(() => settled++);
      const b = svc.ensureCard().finally(() => settled++);
      expect(await until(() => calls.length >= 1)).toBe(true);
      await flush();
      await jest.advanceTimersByTimeAsync(7_000);
      expect(await until(() => settled === 2)).toBe(true);
      expect(await a).toBe(EVENING_ID);
      expect(await b).toBeNull();
      expect(await cardsFor(store, EVENING_ID)).toHaveLength(1);
      expect((await store.dailyIdeas.get(EVENING_ID))!.weather).toBeNull();
    });
  });

  it('F6 · the waiting call resolves after the card is stored', async () => {
    const { store, svc, w } = await setup({ now: EVENING });
    // Watch the store's writes, so the moment B resolves can be compared with them (the store is a dependency; the
    // service is not touched).
    const rowsStored = new Set<string>();
    const put = store.dailyIdeas.put.bind(store.dailyIdeas);
    store.dailyIdeas.put = async (row) => {
      const r = await put(row);
      rowsStored.add(row.id);
      return r;
    };
    const a = svc.ensureCard();
    const b = svc.ensureCard();
    let atB: { value: string | null; rowStored: boolean } | null = null;
    void b.then((value) => {
      atB = { value, rowStored: rowsStored.has(EVENING_ID) };
    });
    expect(await until(() => w.pending() >= 1)).toBe(true);
    await flush();
    w.resolveAll();
    const rb = await b;
    expect(atB).toEqual({ value: null, rowStored: true });
    expect(rb).toBeNull();
    expect(await store.dailyIdeas.get(EVENING_ID)).not.toBeNull();
    expect(await cardsFor(store, EVENING_ID)).toHaveLength(1);
    expect(await drain(w, [a])).toEqual([EVENING_ID]);
  });

  it("F6 · a day call in flight doesn't stop the evening card", async () => {
    const { store, svc, w } = await setup({ now: '2026-11-09T16:59:58-05:00' });
    expect(await cardsFor(store, '2026-11-09|day')).toHaveLength(0);
    const a = svc.ensureCard(at('2026-11-09T16:59:58-05:00'));
    expect(await until(() => w.calls.length === 1)).toBe(true); // A holds the weather
    const b = svc.ensureCard(at('2026-11-09T17:00:03-05:00'));
    await until(() => w.calls.length === 2);
    const [ra, rb] = await drain(w, [a, b]);
    expect(ra).toBe('2026-11-09|day');
    expect(rb).toBe('2026-11-09|evening');
    expect(await cardsFor(store, '2026-11-09|day')).toHaveLength(1);
    expect(await cardsFor(store, '2026-11-09|evening')).toHaveLength(1);
  });

  it("F6 · a day call in flight doesn't stop the evening card (edge: across 4 am)", async () => {
    const { store, svc, w } = await setup({ now: '2026-11-08T03:59:58-05:00' });
    const a = svc.ensureCard(at('2026-11-08T03:59:58-05:00'));
    expect(await until(() => w.calls.length === 1)).toBe(true);
    const b = svc.ensureCard(at('2026-11-08T04:00:03-05:00'));
    await until(() => w.calls.length === 2);
    const [ra, rb] = await drain(w, [a, b]);
    expect(ra).toBe(EVENING_ID);
    expect(rb).toBe('2026-11-08|day');
    expect(await cardsFor(store, EVENING_ID)).toHaveLength(1);
    expect(await cardsFor(store, '2026-11-08|day')).toHaveLength(1);
  });

  it('F6 · a failed call lets the next one post', async () => {
    let asked = 0;
    const w = heldWeather({
      permission: async () => {
        asked++;
        if (asked === 1) throw new Error('permission failed');
        return 'granted';
      },
    });
    const { store, svc } = await setup({ now: EVENING, weather: w });
    const [sa, sb] = await drainSettled(w, [svc.ensureCard(), svc.ensureCard()]);
    expect(sa!.status).toBe('rejected');
    expect(sb).toEqual({ status: 'fulfilled', value: null });
    const [rc] = await drain(w, [svc.ensureCard()]);
    expect(rc).toBe(EVENING_ID);
    expect(await cardsFor(store, EVENING_ID)).toHaveLength(1);
  });

  it('F6 · a failed call lets the next one post (edge: offline, the forecast rejects)', async () => {
    const { store, svc, w } = await setup({ now: EVENING });
    const results = await drain(w, [svc.ensureCard(), svc.ensureCard()], 'reject');
    expect(tally(results)).toEqual(tally([EVENING_ID, null]));
    expect(await cardsFor(store, EVENING_ID)).toHaveLength(1);
    expect((await store.dailyIdeas.get(EVENING_ID))!.weather).toBeNull();
  });

  it('F6 · a card message without its row is adopted, not posted again', async () => {
    const { store, svc, w } = await setup({ now: EVENING });
    expect(await drain(w, [svc.ensureCard()])).toEqual([EVENING_ID]);
    const [first] = await cardsFor(store, EVENING_ID);
    await store.dailyIdeas.delete(EVENING_ID); // killed between the two writes: the message stays
    expect(await drain(w, [svc.ensureCard()])).toEqual([EVENING_ID]);
    const cards = await cardsFor(store, EVENING_ID);
    expect(cards).toHaveLength(1);
    expect(cards[0]!.id).toBe(first!.id);
    const row = (await store.dailyIdeas.get(EVENING_ID))!;
    expect(row).not.toBeNull();
    expect(row.messageId).toBe(cards[0]!.id);
    expect(row.outfitId).not.toBeNull();
    expect(cards[0]!.outfitId).toBe(row.outfitId);
  });

  it('F6 · a card message without its row is adopted, not posted again (edge: a reinstall posts one card)', async () => {
    const { store, svc, w } = await setup({ now: EVENING, empty: true });
    expect(await drain(w, [svc.ensureCard()])).toEqual([EVENING_ID]);
    expect(await cardsFor(store, EVENING_ID)).toHaveLength(1);
    expect((await store.dailyIdeas.get(EVENING_ID))!.messageId).toBe((await cardsFor(store, EVENING_ID))[0]!.id);
  });

  it('F6 · a call that finds the card made meanwhile writes nothing', async () => {
    // One id counter for both instances, as one app's ids never collide: B's outfit row can't overwrite A's.
    const { store, svc: svcA, w: wA, ids, newOutfits } = await setup({ now: EVENING });
    const wB = heldWeather();
    const svcB = createMorningService({ store, clock: manualClock(at(EVENING)), weather: wB.source, ids });
    const a = svcA.ensureCard();
    const b = svcB.ensureCard();
    await until(() => wA.calls.length === 1 && wB.calls.length === 1);
    expect(await drain(wA, [a])).toEqual([EVENING_ID]);
    expect(await drain(wB, [b])).toEqual([null]);
    expect(await cardsFor(store, EVENING_ID)).toHaveLength(1);
    expect(await newOutfits()).toBe(1);
  });

  it('F6 · one evening card from 5 pm to 3:59 am', async () => {
    const { store, clock, svc, w, ids } = await setup({ now: '2026-11-07T17:00:00-05:00' });
    const results: (string | null)[] = [];
    for (const t of ['2026-11-07T17:00:00-05:00', '2026-11-07T18:30:00-05:00', '2026-11-07T23:59:00-05:00', '2026-11-08T00:30:00-05:00', '2026-11-08T03:59:00-05:00']) {
      clock.set(at(t));
      results.push(...(await drain(w, [svc.ensureCard()])));
    }
    expect(results).toEqual([EVENING_ID, null, null, null, null]);
    // A cold launch: a new service over the same store.
    const w2 = heldWeather();
    const clock2 = manualClock(at('2026-11-08T01:00:00-05:00'));
    const svc2 = createMorningService({ store, clock: clock2, weather: w2.source, ids });
    expect(await drain(w2, [svc2.ensureCard()])).toEqual([null]);
    clock2.set(at('2026-11-08T04:00:00-05:00'));
    expect(await drain(w2, [svc2.ensureCard()])).toEqual(['2026-11-08|day']);
    expect(await cardsFor(store, EVENING_ID)).toHaveLength(1);
    expect(await cardsFor(store, '2026-11-08|evening')).toHaveLength(0);
    const posted = (await allMorningCards(store)).map((m) => (m.payload as { ideaId?: string }).ideaId).sort();
    expect(posted).toEqual([EVENING_ID, '2026-11-08|day']);
  });

  for (const [part, permission] of [['(a) location denied', 'denied'], ['(b) location never asked', 'unknown']] as const) {
    it(`F6 · location off, denied and an empty closet still give one card ${part}`, async () => {
      const w = heldWeather({ permission: async () => permission });
      const { store, svc, newOutfits } = await setup({ now: EVENING, weather: w });
      const results = await drain(w, [svc.ensureCard(), svc.ensureCard()]);
      expect(tally(results)).toEqual(tally([EVENING_ID, null]));
      expect(await cardsFor(store, EVENING_ID)).toHaveLength(1);
      expect((await store.dailyIdeas.get(EVENING_ID))!.weather).toBeNull();
      expect(await newOutfits()).toBe(1);
    });
  }

  it('F6 · location off, denied and an empty closet still give one card (c) an empty closet', async () => {
    const { store, svc, w, newOutfits } = await setup({ now: EVENING, empty: true });
    const results = await drain(w, [svc.ensureCard(), svc.ensureCard()]);
    expect(tally(results)).toEqual(tally([EVENING_ID, null]));
    expect(await cardsFor(store, EVENING_ID)).toHaveLength(1);
    expect((await store.dailyIdeas.get(EVENING_ID))!.outfitId).toBeNull();
    expect(await newOutfits()).toBe(0);
  });

  it('F6 · gated off, no call posts (a) posting disabled', async () => {
    const { store, svc, w } = await setup({ now: EVENING, enabled: () => false });
    expect(await drain(w, [svc.ensureCard(), svc.ensureCard()])).toEqual([null, null]);
    expect(await allMorningCards(store)).toHaveLength(0);
    expect(await store.dailyIdeas.get(EVENING_ID)).toBeNull();
  });

  it('F6 · gated off, no call posts (b) he declined fit checks', async () => {
    const { store, svc, w } = await setup({ now: EVENING });
    expect(await store.profile.get('me')).not.toBeNull();
    await store.profile.patch('me', { onboardingDone: true, consentVersion: null });
    expect(await drain(w, [svc.ensureCard(), svc.ensureCard()])).toEqual([null, null]);
    expect(await allMorningCards(store)).toHaveLength(0);
    expect(await store.dailyIdeas.get(EVENING_ID)).toBeNull();
  });

  it('F6 · gated off, no call posts (c) after 3 untouched evenings', async () => {
    const { store, clock, svc, w } = await setup({ now: '2026-11-04T18:30:00-05:00' });
    for (const d of ['04', '05', '06']) {
      clock.set(at(`2026-11-${d}T18:30:00-05:00`));
      expect(await drain(w, [svc.ensureCard()])).toEqual([`2026-11-${d}|evening`]);
    }
    clock.set(at(EVENING));
    expect(await drain(w, [svc.ensureCard(), svc.ensureCard()])).toEqual([null, null]);
    expect(await cardsFor(store, EVENING_ID)).toHaveLength(0);
    expect(await store.dailyIdeas.get(EVENING_ID)).toBeNull();
  });
});

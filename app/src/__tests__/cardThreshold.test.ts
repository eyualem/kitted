// T55 (F6.2, F13.1's read side): the morning card suggests no outfit until Kit knows two different outfits of his that
// work; it says why; a checked card that suggested nothing reads "Today's fit" / "Tonight's fit" with his check's
// occasion; `morning.canSuggest()` answers what the card would do, and writes nothing. The contract: tasks/T55/TESTING.md.
//
// Closets are rows of the seed's `full` closet (every other piece marked deleted), so the profile is the seed's. Each
// test that leans on a named closet first checks its premise with core's own functions. The weather is a sample double
// that answers at once (or as told); nothing calls the network or an AI.
//
// Premise swaps (recorded for REPORT.md): TWO_SHOES uses S3 grey runners, not S2 brown loafers (T1 + B1 + S2 fails
// `outfitValid`: the loafers are too dressy for a tee); no seed top fails with B1 + S1, so the top that doesn't work is a
// copy of T1 with `volume: 5`; the unscored case is TWO_TOPS with every piece `certainty: 'unsure'` (see that test).
import {
  closetState, dayKey, defaultRubric, isScored, localParts, outfitReading, outfitValid, rotation, US_EASTERN,
  type ClosetItem, type DayWeather, type Styles,
} from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import type { KittedStore } from '@/data/store';
import type { ClosetItemRow, FitCheckRow } from '@/data/types';
import { buildStylistContext } from '@/features/ask/context';
import { buildEvidence } from '@/features/ask/evidence';
import { routeQuestion } from '@/features/ask/router';
import { loadStylistSnapshot } from '@/features/ask/snapshot';
import { createFitCheckService, DEFAULT_TIMERS } from '@/features/fitcheck/service';
import { cardWaitLines, checkedTag, checkedTitle } from '@/features/morning/copy';
import { canSuggestOutfits } from '@/features/morning/readiness';
import { createMorningService } from '@/features/morning/service';
import { occasionLabel } from '@/features/stylist/thread';
import { t, type StringKey } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { demoImagePrep } from '@/services/imagePrep/demo';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { realScheduler } from '@/services/scheduler';
import type { WeatherPermission, WeatherSource } from '@/services/weather';

// `@/features/morning` (the app's wired service) is built over the app's SQLite store; here that store forwards to a
// memory store the test fills.
jest.mock('@/data/db', () => {
  const ref: { store: unknown } = { store: null };
  return { ref, store: new Proxy({}, { get: (_t, k) => (ref.store as Record<string | symbol, unknown> | null)?.[k] }) };
});

const at = (iso: string) => Date.parse(iso);
const SEED_AS_OF = at('2026-10-20T07:00:00-04:00');
const DAY = '2026-10-22T07:40:00-04:00';
const DAY_ID = '2026-10-22|day';
const EVENING = '2026-10-22T18:30:00-04:00';
const EVENING_ID = '2026-10-22|evening';
const MILD: DayWeather = { window: 'day', nowF: 58, highF: 66, lowF: 52, feelsLowF: 50, feelsHighF: 65, precipChance: 0.1, precipFromHour: null, condition: 'clear' } as DayWeather;
/** The firstRun looks. */
const SMART_WORK: Styles = [['smart_casual', 0.5], ['workwear', 0.5]] as Styles;

const ONE = ['T1', 'B1', 'S1'];
const ONE_L = [...ONE, 'L1'];
const TWO_TOPS = ['T1', 'T2', 'B1', 'S1'];
const TWO_BOTTOMS = ['T1', 'B1', 'B3', 'S1'];
const TWO_SHOES = ['T1', 'B1', 'S1', 'S3'];

type Answer = 'mild' | null | 'reject';
/** A sample weather double that answers at once: each forecast takes the next answer (then the mild day). */
function weatherDouble(o: { permission?: WeatherPermission; answers?: Answer[] } = {}) {
  const answers = [...(o.answers ?? [])];
  const calls = { permission: 0, forecast: 0 };
  const source: WeatherSource = {
    kind: 'sample',
    permission: async () => {
      calls.permission++;
      return o.permission ?? 'granted';
    },
    requestPermission: async () => 'granted',
    forecast: async (window) => {
      calls.forecast++;
      const a = answers.length ? answers.shift()! : 'mild';
      if (a === 'reject') throw new Error('offline');
      return a === null ? null : { ...MILD, window };
    },
  };
  return { source, calls };
}

/** The seed's `full` store with only `keep` left (null keeps the whole closet), plus `extra` rows made from its rows. */
async function seededStore(keep: readonly string[] | null, extra: (rows: ClosetItemRow[]) => ClosetItemRow[] = () => []): Promise<KittedStore> {
  const store = createMemoryStore();
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: SEED_AS_OF });
  const rows = await store.closet.all();
  for (const r of extra(rows)) await store.closet.put(r);
  if (keep) for (const c of rows) if (!keep.includes(c.id)) await store.closet.put({ ...c, isDeleted: true });
  return store;
}

async function setup(o: {
  now: string; keep?: readonly string[] | null; extra?: (rows: ClosetItemRow[]) => ClosetItemRow[]; store?: KittedStore;
  weather?: ReturnType<typeof weatherDouble>; enabled?: () => boolean; ids?: (p: string) => string;
}) {
  const store = o.store ?? (await seededStore(o.keep === undefined ? null : o.keep, o.extra));
  const clock = manualClock(at(o.now));
  const w = o.weather ?? weatherDouble();
  const ids = o.ids ?? counterIds();
  const svc = createMorningService({ store, clock, weather: w.source, ids, ...(o.enabled ? { enabled: o.enabled } : {}) });
  const outfitsBefore = (await store.outfits.all()).length;
  const newOutfits = async () => (await store.outfits.all()).length - outfitsBefore;
  return { store, clock, svc, w, ids, newOutfits };
}

/** One closet, as pieces (from a loaded seed store's rows, the way the app has them). */
let SEED_ROWS: ClosetItemRow[] = [];
beforeAll(async () => {
  const s = createMemoryStore();
  await loadScenario(s, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: SEED_AS_OF });
  SEED_ROWS = await s.closet.all();
});
const row = (id: string): ClosetItemRow => {
  const r = SEED_ROWS.find((c) => c.id === id);
  if (!r) throw new Error(`no seed piece ${id}`);
  return r;
};
const pieces = (...ids: string[]) => ids.map(row) as unknown as ClosetItem[];
const copyOf = (id: string, newId: string, garment: Record<string, unknown> = {}): ClosetItemRow =>
  ({ ...row(id), id: newId, name: `${row(id).name} (2)`, garment: { ...row(id).garment, ...garment } }) as ClosetItemRow;
const asItems = (rows: ClosetItemRow[]) => rows as unknown as ClosetItem[];

/** Every top × bottom × shoes: valid and scored (`allValid`), or at least every valid one scored; and its outfit count. */
function premise(c: readonly ClosetItem[], styles: Styles | null, outfits: 'one' | 'two+', o: { allValid?: boolean; boldness?: string } = {}) {
  const by = (s: string) => c.filter((i) => i.slot === s);
  const boldness = o.boldness ?? 'a_little';
  for (const tp of by('top')) for (const b of by('bottom')) for (const s of by('shoes')) {
    const valid = outfitValid([tp, b, s], styles, boldness);
    if (o.allValid !== false) expect({ outfit: [tp.id, b.id, s.id], valid }).toEqual({ outfit: [tp.id, b.id, s.id], valid: true });
    if (valid) {
      const scored = isScored(defaultRubric.score(outfitReading([tp, b, s]), { occasion: 'everyday', styles, boldness }));
      expect({ outfit: [tp.id, b.id, s.id], scored }).toEqual({ outfit: [tp.id, b.id, s.id], scored: true });
    }
  }
  const n = rotation(c, styles, { boldness, layers: false }).count;
  if (outfits === 'one') expect(n).toBe(1);
  else expect(n).toBeGreaterThanOrEqual(2);
}

async function msgOf(store: KittedStore, id: string) {
  const r = (await store.dailyIdeas.get(id))!;
  return (await store.chat.all()).find((m) => m.id === r.messageId)!;
}

/** A real fit check through the check service (mock reading source, a bundled demo photo and its recorded reading). */
function checkService(store: KittedStore, clock: ReturnType<typeof manualClock>, ids: (p: string) => string) {
  return createFitCheckService({
    store, source: createMockReadingSource({ latency: () => 0, scheduler: realScheduler, fault: () => null }), prep: demoImagePrep,
    quota: createQuota({ store, clock, isPro: () => false }), clock, scheduler: realScheduler, ids,
    timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }),
  });
}

describe('F6.2 · the threshold', () => {
  it('F6.2 · canSuggestOutfits: two different outfits that work', () => {
    const DUP = [...pieces(...ONE), copyOf('T1', 'T1b') as unknown as ClosetItem];
    const FULL = SEED_ROWS as unknown as ClosetItem[];
    const named: [string, ClosetItem[], boolean][] = [
      ['ONE', pieces(...ONE), false], ['ONE+L', pieces(...ONE_L), false], ['DUP', DUP, false],
      ['TWO_TOPS', pieces(...TWO_TOPS), true], ['TWO_BOTTOMS', pieces(...TWO_BOTTOMS), true], ['TWO_SHOES', pieces(...TWO_SHOES), true],
      ['FULL', FULL, true],
    ];
    for (const styles of [null, SMART_WORK]) {
      for (const [name, c, two] of named) premise(c, styles, two ? 'two+' : 'one', { allValid: name !== 'FULL' });
    }
    // Under the old rule the one outfit was already enough.
    expect(closetState(pieces(...ONE))).toBe('enough');

    const all: [string, ClosetItem[], boolean][] = [['[]', [], false], ['[T1]', pieces('T1'), false], ['[T1, B1]', pieces('T1', 'B1'), false], ...named];
    for (const [name, c, expected] of all) {
      expect({ name, answer: canSuggestOutfits(c, null) }).toEqual({ name, answer: expected });
      expect({ name, answer: canSuggestOutfits(c) }).toEqual({ name, answer: expected });
      expect({ name, answer: canSuggestOutfits(c, SMART_WORK, 'a_little') }).toEqual({ name, answer: expected });
      for (const s of [null, SMART_WORK]) {
        const byRotation = rotation(c, s, { boldness: 'a_little', layers: false }).count >= 2;
        expect({ name, styles: s, answer: canSuggestOutfits(c, s, 'a_little') }).toEqual({ name, styles: s, answer: byRotation });
      }
    }
  });

  it("F6.2 · canSuggestOutfits: two different outfits that work (must not: a second top that doesn't work with the rest)", () => {
    // No seed top fails with B1 + S1, so it's a copy of T1 cut far outside the fit band.
    const loose = copyOf('T1', 'T1v', { volume: 5 }) as unknown as ClosetItem;
    expect(outfitValid([loose, ...pieces('B1', 'S1')], null, 'a_little')).toBe(false);
    expect(outfitValid([loose, ...pieces('B1', 'S1')], SMART_WORK, 'a_little')).toBe(false);
    const c = [...pieces(...ONE), loose];
    expect(rotation(c, null, { layers: false }).count).toBe(1);
    expect(canSuggestOutfits(c, null)).toBe(false);
    expect(canSuggestOutfits(c, SMART_WORK, 'a_little')).toBe(false);
  });

  it("F6.2 · canSuggestOutfits: two different outfits that work (edge: outfits that don't score don't count)", () => {
    // The literal case (ONE + one unscored top) can't be built: `outfitReading` is always fully clothed and B1 + S1 stay
    // readable, so any outfit with them scores. The rule is tested on two outfits that are valid but score nothing:
    // every piece unsure, so the rubric reads nothing (`nothing_readable`). Two distinct valid outfits, neither scored.
    const unsure = TWO_TOPS.map((id) => ({ ...row(id), garment: { ...row(id).garment, certainty: 'unsure' } }) as unknown as ClosetItem);
    const [t1, t2, b1, s1] = unsure;
    for (const tp of [t1!, t2!]) {
      expect(outfitValid([tp, b1!, s1!], null, 'a_little')).toBe(true);
      expect(isScored(defaultRubric.score(outfitReading([tp, b1!, s1!]), { occasion: 'everyday' }))).toBe(false);
    }
    expect(rotation(unsure, null, { layers: false }).count).toBe(2);
    expect(canSuggestOutfits(unsure, null)).toBe(false);
    expect(canSuggestOutfits(unsure, SMART_WORK, 'a_little')).toBe(false);
  });

  it('F6.2 · canSuggestOutfits: two different outfits that work (edge: his boldness is the picker\'s)', () => {
    // A graphic tee and bright red chinos: with B1 one outfit at "a little", two at "bold".
    const graphic = copyOf('T1', 'T1g', { pattern: 'graphic' }) as unknown as ClosetItem;
    const red = copyOf('B1', 'B1r', { color_family: 'red', saturation: 'bright' }) as unknown as ClosetItem;
    const c = [graphic, ...pieces('B1'), red, ...pieces('S1')];
    premise(c, null, 'one', { allValid: false, boldness: 'a_little' });
    premise(c, null, 'two+', { allValid: false, boldness: 'bold' });
    expect(canSuggestOutfits(c, null, 'a_little')).toBe(false);
    expect(canSuggestOutfits(c, null)).toBe(false);
    expect(canSuggestOutfits(c, null, 'bold')).toBe(true);
  });
});

describe('F6.2 · the card', () => {
  it('F6.2 · the card waits for two outfits', async () => {
    for (const [now, id, slot] of [[DAY, DAY_ID, 'day'], [EVENING, EVENING_ID, 'evening']] as const) {
      const { store, svc, newOutfits } = await setup({ now, keep: ONE });
      expect(await svc.ensureCard()).toBe(id);
      const r = (await store.dailyIdeas.get(id))!;
      expect({ slot: r.slot, outfitId: r.outfitId }).toEqual({ slot, outfitId: null });
      const m = await msgOf(store, id);
      expect({ cardType: m.cardType, outfitId: m.outfitId }).toEqual({ cardType: 'morning', outfitId: null });
      expect(await newOutfits()).toBe(0);
    }
    {
      const { store, svc, newOutfits } = await setup({ now: DAY, keep: TWO_TOPS });
      expect(await svc.ensureCard()).toBe(DAY_ID);
      const r = (await store.dailyIdeas.get(DAY_ID))!;
      expect(r.outfitId).not.toBeNull();
      const items = (await store.outfits.get(r.outfitId!))!.itemIds;
      expect(items.filter((x) => x === 'T1' || x === 'T2')).toHaveLength(1);
      expect(items).toEqual(expect.arrayContaining(['B1', 'S1']));
      expect((await msgOf(store, DAY_ID)).outfitId).toBe(r.outfitId);
      expect(await newOutfits()).toBe(1);
    }
    {
      const { store, svc } = await setup({ now: DAY, keep: null });
      await svc.ensureCard();
      expect((await store.dailyIdeas.get(DAY_ID))!.outfitId).not.toBeNull();
    }
  });

  it('F6.2 · the card waits for two outfits (edge: no location, and offline)', async () => {
    for (const weather of [() => weatherDouble({ permission: 'unknown' }), () => weatherDouble({ answers: ['reject', 'reject'] })]) {
      {
        const { store, svc, newOutfits } = await setup({ now: DAY, keep: ONE, weather: weather() });
        expect(await svc.ensureCard()).toBe(DAY_ID);
        const r = (await store.dailyIdeas.get(DAY_ID))!;
        expect({ weather: r.weather, outfitId: r.outfitId }).toEqual({ weather: null, outfitId: null });
        expect(await newOutfits()).toBe(0);
      }
      {
        const { store, svc } = await setup({ now: DAY, keep: TWO_TOPS, weather: weather() });
        expect(await svc.ensureCard()).toBe(DAY_ID);
        expect((await store.dailyIdeas.get(DAY_ID))!.outfitId).not.toBeNull();
      }
    }
  });

  it('F6.2 · the card waits for two outfits (edge: a wipe or reinstall, no profile)', async () => {
    const { store, svc, newOutfits } = await setup({ now: DAY, store: createMemoryStore() });
    expect(await svc.ensureCard()).toBe(DAY_ID);
    expect((await store.dailyIdeas.get(DAY_ID))!.outfitId).toBeNull();
    expect((await msgOf(store, DAY_ID)).outfitId).toBeNull();
    expect(await newOutfits()).toBe(0);
  });
});

describe("F6.2 · a waiting card isn't given an outfit by a re-plan", () => {
  /**
   * ONE's card at the day, posted with no weather (the forecast first answers nothing, then the mild day), as it's
   * stored when it waits: no outfit on the row or its message (the posting itself is the test above; here the row is
   * set to that state so each re-plan is tested on its own).
   */
  async function waiting(keep: readonly string[] = ONE) {
    const e = await setup({ now: DAY, keep, weather: weatherDouble({ answers: [null] }) });
    expect(await e.svc.ensureCard()).toBe(DAY_ID);
    const posted = (await e.store.dailyIdeas.get(DAY_ID))!;
    await e.store.dailyIdeas.put({ ...posted, outfitId: null });
    await e.store.chat.patch(posted.messageId!, { outfitId: null });
    const r = (await e.store.dailyIdeas.get(DAY_ID))!;
    expect({ weather: r.weather, outfitId: r.outfitId }).toEqual({ weather: null, outfitId: null });
    const outfits = (await e.store.outfits.all()).length;
    const still = async () => {
      expect((await e.store.dailyIdeas.get(DAY_ID))!.outfitId).toBeNull();
      expect((await msgOf(e.store, DAY_ID)).outfitId).toBeNull();
      expect((await e.store.outfits.all()).length).toBe(outfits);
    };
    return { ...e, still };
  }

  it("F6.2 · a waiting card isn't given an outfit by a re-plan (change the occasion)", async () => {
    const e = await waiting();
    await e.svc.change(DAY_ID, { occasion: 'everyday' });
    expect((await e.store.dailyIdeas.get(DAY_ID))!.occasion).toBe('everyday');
    await e.still();
  });

  it("F6.2 · a waiting card isn't given an outfit by a re-plan (change the style)", async () => {
    const e = await waiting();
    await e.svc.change(DAY_ID, { style: 'workwear' });
    expect((await e.store.dailyIdeas.get(DAY_ID))!.style).toBe('workwear');
    await e.still();
  });

  it("F6.2 · a waiting card isn't given an outfit by a re-plan (refreshWeather)", async () => {
    const e = await waiting();
    await e.svc.refreshWeather(DAY_ID);
    // The re-plan ran: the card has its weather now.
    expect((await e.store.dailyIdeas.get(DAY_ID))!.weather).toMatchObject({ nowF: 58 });
    await e.still();
  });

  it("F6.2 · a waiting card isn't given an outfit by a re-plan (swap)", async () => {
    for (const leaveOut of [['T1'], []]) {
      const e = await waiting();
      const rowsBefore = JSON.stringify(await e.store.dailyIdeas.all());
      const kvBefore = [await e.store.getKv(`idea.touched.${DAY_ID}`), await e.store.getKv(`idea.swapped.${DAY_ID}`)];
      expect(await e.svc.swap(DAY_ID, leaveOut)).toEqual({ swapped: false });
      expect(JSON.stringify(await e.store.dailyIdeas.all())).toBe(rowsBefore);
      expect([await e.store.getKv(`idea.touched.${DAY_ID}`), await e.store.getKv(`idea.swapped.${DAY_ID}`)]).toEqual(kvBefore);
      await e.still();
    }
    // A layer over the one outfit: swapping the layer away still leaves no second outfit.
    const e = await waiting(ONE_L);
    expect(await e.svc.swap(DAY_ID, ['L1'])).toEqual({ swapped: false });
    await e.still();
  });

  it("F6.2 · a waiting card isn't given an outfit by a re-plan (freshen gains the weather)", async () => {
    const e = await waiting();
    e.clock.set(at('2026-10-22T08:30:00-04:00'));
    await e.svc.freshen();
    // The gainWeather path ran: the card has its weather now, still no outfit.
    expect(e.w.calls.forecast).toBe(2);
    expect((await e.store.dailyIdeas.get(DAY_ID))!.weather).toMatchObject({ nowF: 58 });
    await e.still();
  });

  it("F6.2 · a waiting card isn't given an outfit by a re-plan (edge: the closet drops below the threshold)", async () => {
    const { store, svc } = await setup({ now: DAY, keep: TWO_TOPS });
    await svc.ensureCard();
    const r = (await store.dailyIdeas.get(DAY_ID))!;
    expect(r.outfitId).not.toBeNull();
    await store.closet.put({ ...(await store.closet.get('T2'))!, isDeleted: true });
    const outfits = (await store.outfits.all()).length;
    await svc.change(DAY_ID, { occasion: 'everyday' });
    expect((await store.dailyIdeas.get(DAY_ID))!.outfitId).toBeNull();
    expect((await msgOf(store, DAY_ID)).outfitId).toBeNull();
    expect((await store.outfits.all()).length).toBe(outfits);
  });
});

describe("F6.2 · the card's words", () => {
  it("F6.2 · the waiting card's words", () => {
    expect(cardWaitLines(0)).toEqual({ title: 'Your first fit check', why: "Send me today's fit and I'll start learning your closet." });
    expect(cardWaitLines(1)).toEqual({ title: '1 piece so far', why: "I only know 1 of your pieces. Check today's fit and I'll learn the rest." });
    expect(cardWaitLines(2)).toEqual({ title: '2 pieces so far', why: "I only know 2 of your pieces. Check today's fit and I'll learn the rest." });
    expect(cardWaitLines(3)).toEqual({ title: '3 pieces so far', why: "I only know 3 of your pieces. Check today's fit and I'll learn the rest." });
    expect(cardWaitLines(4)).toEqual({ title: '4 pieces so far', why: "I only know 4 of your pieces. Check today's fit and I'll learn the rest." });
  });

  it('F6.2 · the checked title', () => {
    expect(checkedTitle({ slot: 'day', outfitId: null }, false)).toBe("Today's fit");
    expect(checkedTitle({ slot: 'evening', outfitId: null }, false)).toBe("Tonight's fit");
    expect(checkedTitle({ slot: 'day', outfitId: 'O-1' }, false)).toBe('You went with your own');
    expect(checkedTitle({ slot: 'evening', outfitId: 'O-1' }, false)).toBe('You went with your own');
    expect(checkedTitle({ slot: 'evening', outfitId: 'O-1' }, true)).toBe('You wore my pick');
    expect(checkedTitle({ slot: 'day', outfitId: 'O-1' }, true)).toBe('You wore my pick');
    expect(t('idea.went.today' as StringKey)).toBe("Today's fit");
    expect(t('idea.went.tonight' as StringKey)).toBe("Tonight's fit");
  });

  it('F6.2 · the checked tag', () => {
    expect(checkedTag({ slot: 'evening', outfitId: null, occasion: 'going_out' }, { occasion: 'everyday' })).toBe('Tonight · Everyday');
    expect(checkedTag({ slot: 'day', outfitId: null, occasion: 'class' }, { occasion: 'everyday' })).toBe('Today · Everyday');
    expect(checkedTag({ slot: 'day', outfitId: null, occasion: 'class' }, { occasion: 'date' })).toBe(`Today · ${occasionLabel('date')}`);
    expect(occasionLabel('date')).toBe('Date');
    // A card that suggested an outfit keeps its own occasion, as today ("Class/Work" is the card's label for class).
    expect(checkedTag({ slot: 'day', outfitId: 'O-1', occasion: 'class' }, { occasion: 'everyday' })).toBe('Today · Class/Work');
    expect(checkedTag({ slot: 'evening', outfitId: 'O-1', occasion: 'going_out' }, { occasion: 'everyday' })).toBe('Tonight · Going out');
  });
});

describe('F6.2 · went with your own, only after a suggestion', () => {
  it('F6.2 · went with your own, only after a suggestion (edge: a checked card with no outfit never gains one)', async () => {
    const e = await setup({ now: DAY, keep: ONE, weather: weatherDouble({ answers: [null] }) });
    expect(await e.svc.ensureCard()).toBe(DAY_ID);
    e.clock.set(at('2026-10-22T07:42:00-04:00'));
    const r = (await checkService(e.store, e.clock, e.ids).start({ mode: 'check', photoId: 'p01b', occasion: 'everyday' })) as { outcome: string; checkId: string };
    expect(r.outcome).toBe('scored');
    // T2 put back: two tops now.
    await e.store.closet.put({ ...(await e.store.closet.get('T2'))!, isDeleted: false });
    const outfits = (await e.store.outfits.all()).length;
    e.clock.set(at('2026-10-22T08:30:00-04:00'));
    expect(await e.svc.freshen()).toBe(false);
    const after = (await e.store.dailyIdeas.get(DAY_ID))!;
    expect({ outfitId: after.outfitId, weather: after.weather }).toEqual({ outfitId: null, weather: null });
    expect((await msgOf(e.store, DAY_ID)).outfitId).toBeNull();
    expect((await e.store.outfits.all()).length).toBe(outfits);
    expect(checkedTitle(after, false)).toBe("Today's fit");
  });
});

describe('F6.2 · Kit still names the one outfit', () => {
  it('F6.2 · Kit still names the one outfit', async () => {
    const { store, clock, svc } = await setup({ now: '2026-10-22T09:30:00-04:00', keep: ONE });
    expect(await svc.ensureCard()).toBe(DAY_ID);
    // The card waits (no outfit), so Kit's Pick can't be the card's.
    expect((await store.dailyIdeas.get(DAY_ID))!.outfitId).toBeNull();
    const snap = await loadStylistSnapshot(store, clock);
    const q = 'What should I wear today?';
    const ctx = buildStylistContext(snap, q);
    const today = dayKey(snap.nowMs, snap.zone);
    const route = routeQuestion(q, { closet: snap.closet, checks: snap.checks, context: ctx, dayOf: (c: FitCheckRow) => ({ dow: localParts(c.createdAt, snap.zone).dow, today: c.dayKey === today }) });
    const ev = await buildEvidence(route, snap, ctx, { readingOf: async () => null, starterMarks: [] });
    const pick = ev.text.split('\n').find((l) => /^- Pick \(/.test(l));
    expect(pick).toBeDefined();
    const ids = [...pick!.split(' · ')[0]!.matchAll(/\bP\d+\b/g)].map((h) => ctx.handles[h[0]]!).filter(Boolean);
    expect([...ids].sort()).toEqual(['B1', 'S1', 'T1']);
  });
});

describe('F13.1 · canSuggest', () => {
  const CLOSETS: [string, readonly string[], (rows: ClosetItemRow[]) => ClosetItemRow[], boolean][] = [
    ['[]', [], () => [], false],
    ['ONE', ONE, () => [], false],
    ['ONE+L', ONE_L, () => [], false],
    ['DUP', [...ONE, 'T1b'], (rows) => [{ ...rows.find((c) => c.id === 'T1')!, id: 'T1b', name: 'White tee (2)' }], false],
    ['TWO_TOPS', TWO_TOPS, () => [], true],
    ['FULL', null as unknown as string[], () => [], true],
  ];

  it('F13.1 · canSuggest matches the card', async () => {
    for (const [name, keep, extra, expected] of CLOSETS) {
      for (const [now, id] of [[DAY, DAY_ID], [EVENING, EVENING_ID]] as const) {
        const { store, svc } = await setup({ now, keep, extra });
        const answer = await svc.canSuggest(at(now));
        expect(await svc.ensureCard(at(now))).toBe(id);
        const outfitId = (await store.dailyIdeas.get(id))!.outfitId;
        expect({ name, now, answer, suggested: outfitId !== null }).toEqual({ name, now, answer: expected, suggested: expected });
      }
    }
  });

  it("F13.1 · canSuggest matches the card (the app's service, `morning.canSuggest()`)", async () => {
    const { morning } = jest.requireActual<typeof import('@/features/morning')>('@/features/morning');
    expect(typeof morning.canSuggest).toBe('function');
    const ref = (jest.requireMock('@/data/db') as { ref: { store: KittedStore | null } }).ref;
    for (const [keep, expected] of [[TWO_TOPS, true], [ONE, false]] as const) {
      ref.store = await seededStore(keep);
      expect(await morning.canSuggest(at(DAY))).toBe(expected);
      expect(await ref.store.dailyIdeas.all()).toEqual([]);
    }
  });

  it('F13.1 · canSuggest matches the card (edge: crossing the threshold, a wipe, no profile)', async () => {
    const { store, svc } = await setup({ now: DAY, keep: ONE });
    expect(await svc.canSuggest()).toBe(false);
    await store.closet.put({ ...(await store.closet.get('T2'))!, isDeleted: false });
    expect(await svc.canSuggest()).toBe(true);
    await store.closet.put({ ...(await store.closet.get('T2'))!, isDeleted: true });
    expect(await svc.canSuggest()).toBe(false);
    await store.closet.put({ ...(await store.closet.get('T2'))!, isDeleted: false });
    expect(await svc.canSuggest()).toBe(true);
    await store.wipe();
    expect(await svc.canSuggest()).toBe(false);
    // A new empty store: no profile at all.
    const empty = await setup({ now: DAY, store: createMemoryStore() });
    await expect(empty.svc.canSuggest()).resolves.toBe(false);
    // No profile, but pieces (a reinstall that restored the closet first): the closet decides.
    const bare = createMemoryStore();
    for (const id of TWO_TOPS) await bare.closet.put(row(id));
    const restored = await setup({ now: DAY, store: bare });
    await expect(restored.svc.canSuggest()).resolves.toBe(true);
  });

  it("F13.1 · canSuggest matches the card (edge: the slot's remembered style and his boldness)", async () => {
    for (const keep of [ONE, TWO_TOPS]) {
      const { store, svc } = await setup({ now: DAY, keep });
      await store.setKv('idea.style.day', 'workwear');
      const closet = (await store.closet.all()).filter((c) => !c.isDeleted);
      const p = await store.profile.get('me');
      expect(await svc.canSuggest(at(DAY))).toBe(canSuggestOutfits(asItems(closet), [['workwear', 1]] as Styles, p?.boldness ?? 'a_little'));
    }
    // A graphic tee and bright red chinos: two outfits only for a bold profile.
    const extra = (rows: ClosetItemRow[]) => {
      const base = (id: string) => rows.find((c) => c.id === id)!;
      return [
        { ...base('T1'), id: 'T1g', name: 'Graphic tee', garment: { ...base('T1').garment, pattern: 'graphic' } },
        { ...base('B1'), id: 'B1r', name: 'Red chinos', garment: { ...base('B1').garment, color_family: 'red', saturation: 'bright' } },
      ] as ClosetItemRow[];
    };
    for (const [boldness, expected] of [[null, false], ['a_little', false], ['bold', true]] as const) {
      const { store, svc } = await setup({ now: DAY, keep: ['T1g', 'B1', 'B1r', 'S1'], extra });
      await store.profile.put({ ...(await store.profile.get('me'))!, boldness });
      expect({ boldness, answer: await svc.canSuggest(at(DAY)) }).toEqual({ boldness, answer: expected });
    }
  });

  it('F13.1 · canSuggest writes nothing and asks for no weather', async () => {
    for (const [keep, expected] of [[TWO_TOPS, true], [ONE, false]] as const) {
      const { store, svc, w } = await setup({ now: DAY, keep });
      const kvKeys = ['idea.evening.ignored', 'idea.style.day', 'idea.style.evening'];
      const snapshot = async () => JSON.stringify({
        chat: await store.chat.all(), ideas: await store.dailyIdeas.all(), outfits: await store.outfits.all(), closet: await store.closet.all(),
        kv: await Promise.all(kvKeys.map((k) => store.getKv(k))),
      });
      const before = await snapshot();
      expect(await svc.canSuggest(at(DAY))).toBe(expected);
      expect(await svc.canSuggest(at(EVENING))).toBe(expected);
      expect(await svc.canSuggest()).toBe(expected);
      expect(await snapshot()).toBe(before);
      expect(w.calls).toEqual({ permission: 0, forecast: 0 });

      // Posting is off, or he declined fit checks: the closet's answer all the same.
      const off = await setup({ now: DAY, keep, enabled: () => false });
      expect(await off.svc.canSuggest()).toBe(expected);
      expect(await off.svc.ensureCard()).toBeNull();
      const declined = await setup({ now: DAY, keep });
      await declined.store.profile.put({ ...(await declined.store.profile.get('me'))!, onboardingDone: true, consentVersion: null });
      expect(await declined.svc.canSuggest()).toBe(expected);
      expect(await declined.svc.ensureCard()).toBeNull();
      expect(await declined.store.dailyIdeas.all()).toEqual([]);
    }
  });

  it('F13.1 · canSuggest writes nothing and asks for no weather (edge: offline, and alongside ensureCard)', async () => {
    const offline = await setup({ now: DAY, keep: TWO_TOPS, weather: weatherDouble({ answers: ['reject', 'reject', 'reject'] }) });
    expect(await offline.svc.canSuggest()).toBe(true);
    expect(offline.w.calls.forecast).toBe(0);
    for (const [keep, expected] of [[TWO_TOPS, true], [ONE, false]] as const) {
      const { store, svc } = await setup({ now: DAY, keep });
      const [answer, a, b] = await Promise.all([svc.canSuggest(), svc.ensureCard(), svc.ensureCard()]);
      expect(answer).toBe(expected);
      expect([a, b].sort()).toEqual([DAY_ID, null].sort());
      const cards = (await store.chat.all()).filter((m) => m.kind === 'card' && m.cardType === 'morning' && (m.payload as { ideaId?: unknown }).ideaId === DAY_ID);
      expect(cards).toHaveLength(1);
      expect(((await store.dailyIdeas.get(DAY_ID))!.outfitId !== null)).toBe(expected);
    }
  });
});

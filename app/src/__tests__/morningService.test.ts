// The morning/evening card service (02 "S1d", 05 §MC4): windows, one card per slot, locking,
// re-picks, Wear this, and the evening auto-stop.
import { US_EASTERN, type DayWeather } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import type { KittedStore } from '@/data/store';
import { checkInSlot, createMorningService, ideaId, slotAt } from '@/features/morning/service';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import type { WeatherSource } from '@/services/weather';

const at = (iso: string) => Date.parse(iso);

const COLD_RAIN: DayWeather = { window: 'day', nowF: 46, highF: 63, lowF: 44, feelsLowF: 42, feelsHighF: 61, precipChance: 0.7, precipFromHour: 17, condition: 'cloudy' };
const fakeWeather = (w: DayWeather | null, permission: 'granted' | 'unknown' = 'granted'): WeatherSource => ({
  kind: 'sample',
  permission: async () => permission,
  requestPermission: async () => 'granted',
  forecast: async (window) => (w ? { ...w, window } : null),
});

async function setup(o: { now: string; weather?: DayWeather | null; empty?: boolean; store?: KittedStore }) {
  const store = o.store ?? createMemoryStore();
  if (!o.empty && !o.store) await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: at('2026-10-20T07:00:00-04:00') });
  const clock = manualClock(at(o.now));
  const svc = createMorningService({ store, clock, weather: fakeWeather(o.weather === undefined ? COLD_RAIN : o.weather), ids: counterIds() });
  return { store, clock, svc };
}

describe('windows', () => {
  it('4 am–4:59 pm is the day card; 5 pm–3:59 am the evening of that day key', () => {
    const z = US_EASTERN;
    expect(slotAt(at('2026-10-22T04:00:00-04:00'), z)).toEqual({ day: '2026-10-22', slot: 'day' });
    expect(slotAt(at('2026-10-22T16:59:00-04:00'), z)).toEqual({ day: '2026-10-22', slot: 'day' });
    expect(slotAt(at('2026-10-22T17:00:00-04:00'), z)).toEqual({ day: '2026-10-22', slot: 'evening' });
    expect(slotAt(at('2026-10-23T03:59:00-04:00'), z)).toEqual({ day: '2026-10-22', slot: 'evening' });
  });
});

describe('ensureCard', () => {
  it('posts a greeting and a card, once per slot; the weather is in the card, not the greeting (#338)', async () => {
    const { store, svc } = await setup({ now: '2026-10-22T07:40:00-04:00' });
    expect(await svc.ensureCard()).toBe(ideaId('2026-10-22', 'day'));
    expect(await svc.ensureCard()).toBeNull();
    const idea = (await store.dailyIdeas.get('2026-10-22|day'))!;
    expect(idea).toMatchObject({ slot: 'day', occasion: 'class', state: 'idea' });
    expect(idea.outfitId).not.toBeNull();
    const msgs = (await store.chat.all()).filter((m) => m.createdAt >= at('2026-10-22T07:40:00-04:00'));
    expect(msgs.map((m) => [m.kind, m.cardType])).toEqual([['text', null], ['card', 'morning']]);
    expect(msgs[0]!.text).toBe("Morning. Here's an idea for today.");
    expect(idea.weather).toMatchObject({ nowF: 46, fetchedAt: at('2026-10-22T07:40:00-04:00') });
  });

  it('the evening card plans tonight, even after a day card', async () => {
    const { store, clock, svc } = await setup({ now: '2026-10-22T08:00:00-04:00' });
    await svc.ensureCard();
    clock.set(at('2026-10-22T18:30:00-04:00'));
    expect(await svc.ensureCard()).toBe('2026-10-22|evening');
    expect(await store.dailyIdeas.get('2026-10-22|evening')).toMatchObject({ occasion: 'going_out', slot: 'evening' });
    const text = (await store.chat.all()).sort((a, b) => b.createdAt - a.createdAt).find((m) => m.kind === 'text')!.text;
    expect(text).toBe('Evening. Heading out?');
  });

  it('weekends default to Everyday', async () => {
    const { store, svc } = await setup({ now: '2026-10-24T09:00:00-04:00' });
    await svc.ensureCard();
    expect((await store.dailyIdeas.get('2026-10-24|day'))!.occasion).toBe('everyday');
  });

  it('no weather permission: no weather in the greeting, and the pick still works', async () => {
    const store = createMemoryStore();
    await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: at('2026-10-20T07:00:00-04:00') });
    const clock = manualClock(at('2026-10-22T07:40:00-04:00'));
    const svc = createMorningService({ store, clock, weather: fakeWeather(COLD_RAIN, 'unknown'), ids: counterIds() });
    await svc.ensureCard();
    const idea = (await store.dailyIdeas.get('2026-10-22|day'))!;
    expect(idea.weather).toBeNull();
    expect(idea.outfitId).not.toBeNull();
    const text = (await store.chat.all()).find((m) => m.kind === 'text' && m.createdAt >= clock.nowMs())!.text!;
    expect(text).toBe('Morning. October: bring a layer.');
  });

  it('an empty closet still posts the card (no outfit)', async () => {
    const { store, svc } = await setup({ now: '2026-10-22T07:40:00-04:00', empty: true });
    await svc.ensureCard();
    expect((await store.dailyIdeas.get('2026-10-22|day'))!.outfitId).toBeNull();
  });

  it('evening cards stop after 3 untouched evenings, and come back when he uses one', async () => {
    const { store, clock, svc } = await setup({ now: '2026-10-22T18:00:00-04:00' });
    for (const d of ['22', '23', '24']) {
      clock.set(at(`2026-10-${d}T18:00:00-04:00`));
      expect(await svc.ensureCard()).toBe(`2026-10-${d}|evening`);
    }
    clock.set(at('2026-10-25T18:00:00-04:00'));
    expect(await svc.ensureCard()).toBeNull();
    await svc.change('2026-10-24|evening', { occasion: 'date' }); // he used one
    const row = (await store.dailyIdeas.get('2026-10-24|evening'))!;
    await store.dailyIdeas.put({ ...row, state: 'wearing' });
    clock.set(at('2026-10-26T18:00:00-04:00'));
    expect(await svc.ensureCard()).toBe('2026-10-26|evening');
  });
});

describe('changes', () => {
  it('a style change re-picks the same card and is remembered for that slot', async () => {
    const { store, clock, svc } = await setup({ now: '2026-10-22T07:40:00-04:00' });
    const id = (await svc.ensureCard())!;
    const r = await svc.change(id, { style: 'streetwear' });
    expect(typeof r.samePick).toBe('boolean');
    expect((await store.dailyIdeas.get(id))!.style).toBe('streetwear');
    clock.set(at('2026-10-23T07:40:00-04:00'));
    await svc.ensureCard();
    expect((await store.dailyIdeas.get('2026-10-23|day'))!.style).toBe('streetwear');
  });

  it('staying in collapses the evening card', async () => {
    const { store, svc } = await setup({ now: '2026-10-22T19:00:00-04:00' });
    const id = (await svc.ensureCard())!;
    await svc.change(id, { occasion: 'staying_in' });
    expect((await store.dailyIdeas.get(id))!.state).toBe('stayingIn');
  });

  it('swap one leaves an item out', async () => {
    const { store, svc } = await setup({ now: '2026-10-22T07:40:00-04:00' });
    const id = (await svc.ensureCard())!;
    const before = (await store.outfits.get((await store.dailyIdeas.get(id))!.outfitId!))!.itemIds;
    await svc.swap(id, [before[before.length - 1]!]);
    const after = (await store.outfits.get((await store.dailyIdeas.get(id))!.outfitId!))!.itemIds;
    expect(after).not.toContain(before[before.length - 1]);
  });

  it('wear this logs the day; undo puts it back', async () => {
    const { store, svc } = await setup({ now: '2026-10-22T07:40:00-04:00' });
    const id = (await svc.ensureCard())!;
    const undo = await svc.wear(id);
    expect((await store.wearLog.get('2026-10-22'))?.outfitId).toBe((await store.dailyIdeas.get(id))!.outfitId);
    expect((await store.dailyIdeas.get(id))!.state).toBe('wearing');
    await undo();
    expect(await store.wearLog.get('2026-10-22')).toBeNull();
    expect((await store.dailyIdeas.get(id))!.state).toBe('idea');
  });
});

describe('checkInSlot', () => {
  it('a 9 pm check belongs to the evening card, a 7 am one to the day card', () => {
    const idea = { dayKey: '2026-10-22', slot: 'evening' as const };
    expect(checkInSlot({ dayKey: '2026-10-22', createdAt: at('2026-10-22T21:00:00-04:00') }, idea, US_EASTERN)).toBe(true);
    expect(checkInSlot({ dayKey: '2026-10-22', createdAt: at('2026-10-22T07:00:00-04:00') }, idea, US_EASTERN)).toBe(false);
  });
});

// Rotation (Oct 14): two weeks of cards on a normal closet (5 tops, 3 bottoms, 3 shoes), with
// no weather permission (November: "bring a layer"). The evening card stops after 3 ignored nights.
const NORMAL = ['T1', 'T2', 'T3', 'T4', 'T5', 'B1', 'B2', 'B3', 'S1', 'S2', 'S3'];

async function twoWeeks(o: { wear: boolean }) {
  const store = createMemoryStore();
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: at('2026-10-20T07:00:00-04:00') });
  for (const c of await store.closet.all()) if (!NORMAL.includes(c.id)) await store.closet.put({ ...c, isDeleted: true });
  const clock = manualClock(at('2026-11-02T08:00:00-05:00'));
  const svc = createMorningService({ store, clock, weather: fakeWeather(null, 'unknown'), ids: counterIds() });
  const days = Array.from({ length: 14 }, (_, i) => `2026-11-${String(2 + i).padStart(2, '0')}`);
  for (const d of days) {
    clock.set(at(`${d}T08:00:00-05:00`));
    const id = await svc.ensureCard();
    if (o.wear && id) await svc.wear(id);
    clock.set(at(`${d}T19:00:00-05:00`));
    await svc.ensureCard();
  }
  const slotOf = new Map((await store.closet.all()).map((c) => [c.id, c.slot]));
  const cards = [];
  for (const r of (await store.dailyIdeas.all()).sort((a, b) => a.id.localeCompare(b.id))) {
    const ids = (await store.outfits.get(r.outfitId!))!.itemIds;
    cards.push({ day: r.dayKey, slot: r.slot, top: ids.find((x) => slotOf.get(x) === 'top')!, key: ids.filter((x) => slotOf.get(x) !== 'outer').sort().join('+') });
  }
  return { store, clock, svc, cards };
}

const gap = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

describe('rotation over two weeks', () => {
  for (const wear of [false, true]) {
    it(wear ? 'he taps Wear this every morning' : 'he ignores every card', async () => {
      const { cards } = await twoWeeks({ wear });
      expect(cards.filter((c) => c.slot === 'day')).toHaveLength(14);
      expect(cards.filter((c) => c.slot === 'evening')).toHaveLength(3);
      expect(new Set(cards.map((c) => c.top)).size).toBe(5);
      const tops = ['T1', 'T2', 'T3', 'T4', 'T5'];
      cards.forEach((c, k) => {
        const before = cards.slice(0, k);
        const recent = (t: string) => before.some((p) => gap(p.day, c.day) <= 3 && p.top === t);
        if (recent(c.top)) expect(tops.every(recent)).toBe(true);
        expect(before.some((p) => gap(p.day, c.day) < 7 && p.key === c.key)).toBe(false);
        if (c.slot === 'evening') expect(c.top).not.toBe(cards.find((p) => p.day === c.day && p.slot === 'day')!.top);
      });
      // Once the evening card has stopped, day cards never bring a top back within 3 days.
      const later = cards.filter((c) => c.slot === 'day' && c.day >= '2026-11-08');
      later.forEach((c, k) => later.slice(0, k).filter((p) => p.top === c.top).forEach((p) => expect(gap(p.day, c.day)).toBeGreaterThan(3)));
    });
  }

  it('a locked card stays put when later history changes; swap one still works', async () => {
    const { store, clock, svc } = await twoWeeks({ wear: false });
    const id = '2026-11-15|day';
    const before = (await store.outfits.get((await store.dailyIdeas.get(id))!.outfitId!))!.itemIds;
    clock.set(at('2026-11-15T12:00:00-05:00'));
    await svc.wear(id);
    expect(await svc.ensureCard()).toBeNull();
    expect((await store.outfits.get((await store.dailyIdeas.get(id))!.outfitId!))!.itemIds).toEqual(before);
    const shoe = before[before.length - 1]!;
    await svc.swap(id, [shoe]);
    const after = (await store.outfits.get((await store.dailyIdeas.get(id))!.outfitId!))!.itemIds;
    expect(after).not.toContain(shoe);
  });
});

describe('freshen (#338): a stale forecast is fetched again', () => {
  const WARM: DayWeather = { window: 'day', nowF: 78, highF: 82, lowF: 74, feelsLowF: 76, feelsHighF: 84, precipChance: 0, precipFromHour: null, condition: 'clear' };

  async function withWeather(first: DayWeather, later: DayWeather) {
    const store = createMemoryStore();
    await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: at('2026-10-20T07:00:00-04:00') });
    const clock = manualClock(at('2026-10-22T07:40:00-04:00'));
    let now = first;
    const weather: WeatherSource = { kind: 'sample', permission: async () => 'granted', requestPermission: async () => 'granted', forecast: async (window) => ({ ...now, window }) };
    const svc = createMorningService({ store, clock, weather, ids: counterIds() });
    await svc.ensureCard();
    now = later;
    return { store, clock, svc };
  }

  it('a fresh forecast is left alone', async () => {
    const { clock, svc } = await withWeather(COLD_RAIN, WARM);
    clock.set(at('2026-10-22T08:15:00-04:00'));
    expect(await svc.freshen()).toBe(false);
  });

  it('untouched, and the new weather asks for something else: re-picked', async () => {
    const { store, clock, svc } = await withWeather(WARM, COLD_RAIN);
    // Planned again for the new weather: its reasons are the cold-rain ones now (the pieces may or may not change; the
    // outfit row is rewritten in place, so read them before).
    const reasons = async () => {
      const id = (await store.dailyIdeas.get('2026-10-22|day'))!.outfitId;
      return ((id ? (await store.outfits.get(id))?.details : null) as { reasons?: { key: string }[] } | null)?.reasons?.map((r) => r.key) ?? [];
    };
    const before = await reasons();
    clock.set(at('2026-10-22T13:00:00-04:00'));
    expect(await svc.freshen()).toBe(true);
    const after = (await store.dailyIdeas.get('2026-10-22|day'))!;
    expect(after.weather).toMatchObject({ nowF: 46, fetchedAt: at('2026-10-22T13:00:00-04:00') });
    expect(await reasons()).not.toEqual(before);
    expect(await reasons()).toContain('wetShoes');
  });

  it('touched (a swap or a menu change): the outfit stays, only the weather is new', async () => {
    const { store, clock, svc } = await withWeather(COLD_RAIN, WARM);
    await svc.change('2026-10-22|day', { occasion: 'everyday' });
    const before = (await store.dailyIdeas.get('2026-10-22|day'))!;
    const items = async (id: string | null) => (id ? (await store.outfits.get(id))?.itemIds.join('+') : null);
    const kept = await items(before.outfitId);
    clock.set(at('2026-10-22T13:00:00-04:00'));
    expect(await svc.freshen()).toBe(true);
    const after = (await store.dailyIdeas.get('2026-10-22|day'))!;
    expect(after.weather).toMatchObject({ nowF: 78 });
    expect(await items(after.outfitId)).toBe(kept);
  });

  it('a card he wore keeps its outfit', async () => {
    const { store, clock, svc } = await withWeather(COLD_RAIN, WARM);
    await svc.wear('2026-10-22|day');
    const kept = (await store.dailyIdeas.get('2026-10-22|day'))!.outfitId;
    clock.set(at('2026-10-22T13:00:00-04:00'));
    await svc.freshen();
    expect((await store.dailyIdeas.get('2026-10-22|day'))!.outfitId).toBe(kept);
  });
});

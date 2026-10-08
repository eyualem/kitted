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
  it('posts a greeting with the weather and a card, once per slot', async () => {
    const { store, svc } = await setup({ now: '2026-10-22T07:40:00-04:00' });
    expect(await svc.ensureCard()).toBe(ideaId('2026-10-22', 'day'));
    expect(await svc.ensureCard()).toBeNull();
    const idea = (await store.dailyIdeas.get('2026-10-22|day'))!;
    expect(idea).toMatchObject({ slot: 'day', occasion: 'class', state: 'idea' });
    expect(idea.outfitId).not.toBeNull();
    const msgs = (await store.chat.all()).filter((m) => m.createdAt >= at('2026-10-22T07:40:00-04:00'));
    expect(msgs.map((m) => [m.kind, m.cardType])).toEqual([['text', null], ['card', 'morning']]);
    expect(msgs[0]!.text).toBe('Morning. 46° now, 63° by afternoon. Rain likely after 5 pm.');
  });

  it('the evening card plans tonight, even after a day card', async () => {
    const { store, clock, svc } = await setup({ now: '2026-10-22T08:00:00-04:00' });
    await svc.ensureCard();
    clock.set(at('2026-10-22T18:30:00-04:00'));
    expect(await svc.ensureCard()).toBe('2026-10-22|evening');
    expect(await store.dailyIdeas.get('2026-10-22|evening')).toMatchObject({ occasion: 'going_out', slot: 'evening' });
    const text = (await store.chat.all()).sort((a, b) => b.createdAt - a.createdAt).find((m) => m.kind === 'text')!.text;
    expect(text).toMatch(/^Evening\. Heading out\? /);
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

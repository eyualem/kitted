// The morning card's Swap and location (09-ui-review §23 M1–M5, #353): checks written before the code. Swap never
// brings back a piece he swapped away, never blanks the card, and starts afresh on a new occasion or style; once
// location is denied the card points at Settings; back from Settings with it on, the card gets its weather.
import { US_EASTERN, type DayWeather } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import { createMorningService } from '@/features/morning/service';
import { locationRow } from '@/features/morning/locationRow';
import { t } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import type { WeatherPermission, WeatherSource } from '@/services/weather';

declare const __dirname: string;
const { readFileSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');
const src = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');

const at = (iso: string) => Date.parse(iso);
const COLD_RAIN: DayWeather = { window: 'day', nowF: 46, highF: 63, lowF: 44, feelsLowF: 42, feelsHighF: 61, precipChance: 0.7, precipFromHour: 17, condition: 'cloudy' };
const ID = '2026-10-22|day';

async function setup(permission: { now: WeatherPermission } = { now: 'granted' }) {
  const store = createMemoryStore();
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: at('2026-10-20T07:00:00-04:00') });
  const clock = manualClock(at('2026-10-22T07:40:00-04:00'));
  const weather: WeatherSource = {
    kind: 'sample',
    permission: async () => permission.now,
    requestPermission: async () => permission.now,
    forecast: async (window) => (permission.now === 'granted' ? { ...COLD_RAIN, window } : null),
  };
  const svc = createMorningService({ store, clock, weather, ids: counterIds() });
  await svc.ensureCard();
  const pieces = async () => {
    const id = (await store.dailyIdeas.get(ID))!.outfitId;
    return id ? (await store.outfits.get(id))!.itemIds : [];
  };
  return { store, clock, svc, pieces, permission };
}

describe('M1–M3 · Swap', () => {
  it('M1 every piece swapped away stays out, not only the last one', async () => {
    const { svc, pieces } = await setup();
    const first = await pieces();
    const away: string[] = [];
    // Swap a piece of each outfit shown, three times: none of the swapped-away pieces may come back.
    for (let i = 0; i < 3; i++) {
      const now = await pieces();
      const out = now.find((p) => !away.includes(p) && first.includes(p)) ?? now[now.length - 1]!;
      const r = await svc.swap(ID, [out]);
      if (!r.swapped) break;
      away.push(out);
      const after = await pieces();
      for (const a of away) expect(after).not.toContain(a);
    }
    expect(away.length).toBeGreaterThanOrEqual(2);
  });

  it('M2 nothing else works without it: the card keeps its outfit and says so; that piece is not left out', async () => {
    const { store, svc, pieces } = await setup();
    // Leave out every shoe but the one in the outfit, one by one, then try to swap that last shoe away.
    const all = await store.closet.all();
    const shoeIds = all.filter((c) => c.slot === 'shoes' && !c.isDeleted).map((c) => c.id);
    let r = { swapped: true };
    let guard = 0;
    let shoe = (await pieces()).find((p) => shoeIds.includes(p));
    while (r.swapped && shoe && guard++ < 10) {
      r = await svc.swap(ID, [shoe]);
      shoe = (await pieces()).find((p) => shoeIds.includes(p));
    }
    expect(r.swapped).toBe(false);
    const kept = await pieces();
    expect(kept.length).toBeGreaterThan(0);
    expect(kept).toContain(shoe);
    expect((await store.dailyIdeas.get(ID))!.outfitId).not.toBeNull();
    expect(t('swap.none')).toBe('Nothing else in your closet works here yet.');
    // The Swap sheet shows the line when a piece has nothing to swap in (S28, #370; it was the card's toast, #353).
    expect(src('features/morning/SwapSheet.tsx')).toMatch(/length === 0[\s\S]{0,120}t\('swap\.none'\)/);
  });

  it('M3 a new occasion or style starts the left-out list afresh', async () => {
    const { svc, pieces } = await setup();
    const first = await pieces();
    await svc.swap(ID, [first[0]!]);
    expect(await pieces()).not.toContain(first[0]);
    await svc.change(ID, { occasion: 'class' });
    // Back where it started: the first outfit at that occasion may use the piece again.
    const fresh = await setup();
    await fresh.svc.change(ID, { occasion: 'class' });
    expect(await pieces()).toEqual(await fresh.pieces());
  });
});

describe('M4 · location, once denied', () => {
  it('unknown: the Allow row; denied: the Settings link; granted or no source: nothing', () => {
    expect(locationRow({ permission: 'unknown', hasWeather: false, sourceKind: 'live' })).toBe('ask');
    expect(locationRow({ permission: 'denied', hasWeather: false, sourceKind: 'live' })).toBe('settings');
    expect(locationRow({ permission: 'granted', hasWeather: false, sourceKind: 'live' })).toBeNull();
    expect(locationRow({ permission: 'granted', hasWeather: true, sourceKind: 'live' })).toBeNull();
    expect(locationRow({ permission: 'unknown', hasWeather: false, sourceKind: 'none' })).toBeNull();
    expect(locationRow({ permission: 'denied', hasWeather: false, sourceKind: 'none' })).toBeNull();
  });

  it('the card draws the link with the words, opening iOS Settings', () => {
    const card = src('features/morning/MorningCard.tsx');
    expect(card).toMatch(/locationRow\(/);
    expect(card).toMatch(/t\('wx\.off\.link'\)/);
    expect(card).toMatch(/Linking\.openSettings\(\)/);
    expect(t('wx.off.link')).toBe('Turn on local weather');
  });
});

describe('M5 · back from Settings with location on', () => {
  it('the card with no weather gets the forecast at the next freshen, and an untouched one is re-planned', async () => {
    const perm = { now: 'denied' as WeatherPermission };
    const { store, svc } = await setup(perm);
    expect((await store.dailyIdeas.get(ID))!.weather).toBeNull();
    expect(await svc.freshen()).toBe(false); // still denied: nothing to do
    perm.now = 'granted';
    expect(await svc.freshen()).toBe(true);
    const row = (await store.dailyIdeas.get(ID))!;
    expect(row.weather).toMatchObject({ nowF: 46 });
    const reasons = ((await store.outfits.get(row.outfitId!))!.details as { reasons?: { key: string }[] }).reasons?.map((r) => r.key) ?? [];
    expect(reasons).toContain('wetShoes');
  });

  it('a touched card keeps its outfit and only gains the weather', async () => {
    const perm = { now: 'denied' as WeatherPermission };
    const { store, svc, pieces } = await setup(perm);
    await svc.change(ID, { occasion: 'everyday' });
    const kept = await pieces();
    perm.now = 'granted';
    expect(await svc.freshen()).toBe(true);
    expect((await store.dailyIdeas.get(ID))!.weather).toMatchObject({ nowF: 46 });
    expect(await pieces()).toEqual(kept);
  });
});

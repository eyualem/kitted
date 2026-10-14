// Live weather from the National Weather Service (02 "S1d", 05 §MC9): the hourly forecast →
// DayWeather mapping on saved responses, rounding, the caches, every failure → null, and which
// source answers (demo screens keep sample weather).
import { weatherNeeds } from '@kitted/core';
import coldRain from './fixtures/nws/hourly-cold-rain.json';
import hot from './fixtures/nws/hourly-hot.json';
import evening from './fixtures/nws/hourly-evening.json';
import pointsBoston from './fixtures/nws/points-boston.json';
import points404 from './fixtures/nws/points-404.json';
import {
  createNwsSource, feelsLikeF, hourCondition, isNwsWeather, mapHourly, pointKey, round2, windMph,
  type FetchLike, type LocationProvider, type NwsPeriod,
} from '@/services/weather/nws';
import { chooseWeatherKind } from '@/services/weather';

const P = (doc: { properties: { periods: unknown[] } }) => doc.properties.periods as NwsPeriod[];
const at = (iso: string) => Date.parse(iso);

describe('hourly forecast → DayWeather', () => {
  it('a cold, rainy day: the cold start, the afternoon high, rain from 4 pm', () => {
    const w = mapHourly(P(coldRain), 'day', at('2026-10-22T07:30:00-04:00'));
    expect(w).toEqual({
      window: 'day', nowF: 43, highF: 58, lowF: 43, feelsLowF: 38, feelsHighF: 58,
      precipChance: 0.8, precipFromHour: 16, condition: 'cloudy', source: 'nws',
    });
    // The card plans for it: a layer is required, it comes off by afternoon, and it's wet.
    expect(weatherNeeds(w!)).toEqual({ layer: 'required', shortsOk: false, wet: true, removable: true, hot: false });
  });

  it('the same forecast read for the evening: 8 pm now, midnight late, rainy', () => {
    const w = mapHourly(P(coldRain), 'evening', at('2026-10-22T07:30:00-04:00'));
    expect(w).toEqual({
      window: 'evening', nowF: 50, highF: 52, lowF: 47, feelsLowF: 44, feelsHighF: 52,
      precipChance: 0.8, precipFromHour: 18, condition: 'rain', lateF: 47, source: 'nws',
    });
  });

  it('a hot day: dry heat, no layer, shorts are fine', () => {
    const w = mapHourly(P(hot), 'day', at('2026-07-14T09:10:00-07:00'))!;
    expect(w).toMatchObject({ window: 'day', nowF: 91, highF: 107, lowF: 91, feelsLowF: 91, feelsHighF: 107, precipChance: 0, precipFromHour: null, condition: 'clear' });
    expect(weatherNeeds(w)).toMatchObject({ layer: 'none', hot: true, shortsOk: true, wet: false });
  });

  it('an evening: clear, 56 at 8 pm, 50 by midnight, a breeze makes the late hours feel colder', () => {
    const w = mapHourly(P(evening), 'evening', at('2026-10-22T17:20:00-05:00'));
    expect(w).toEqual({
      window: 'evening', nowF: 56, highF: 60, lowF: 50, feelsLowF: 47, feelsHighF: 60,
      precipChance: 0.04, precipFromHour: null, condition: 'clear', lateF: 50, source: 'nws',
    });
  });

  it('skips hours that have passed (a forecast cached up to an hour)', () => {
    const w = mapHourly(P(coldRain), 'day', at('2026-10-22T12:05:00-04:00'))!;
    expect(w.nowF).toBe(54); // the 12 pm hour, not the 7 am one
    expect(w.lowF).toBe(51); // 7 pm
  });

  it('after the day window has passed, the next few hours stand in', () => {
    const w = mapHourly(P(coldRain), 'day', at('2026-10-22T21:30:00-04:00'))!;
    expect(w).toMatchObject({ nowF: 49, highF: 49, lowF: 47 });
  });

  it('after midnight the evening is still last night: midnight is the late reading', () => {
    const w = mapHourly(P(coldRain), 'evening', at('2026-10-23T00:30:00-04:00'))!;
    expect(w).toMatchObject({ window: 'evening', nowF: 47, lateF: 47 });
  });

  it('nothing left, or nothing readable → null', () => {
    expect(mapHourly(P(coldRain), 'day', at('2026-10-24T09:00:00-04:00'))).toBeNull();
    expect(mapHourly([], 'day', 0)).toBeNull();
    expect(mapHourly([{ startTime: 'x', endTime: 'y', temperature: 50 }], 'day', 0)).toBeNull();
    expect(mapHourly(null as unknown as NwsPeriod[], 'day', 0)).toBeNull();
  });

  it('Celsius periods are converted; a missing chance of rain is 0', () => {
    const w = mapHourly(
      [{ startTime: '2026-10-22T09:00:00-04:00', endTime: '2026-10-22T10:00:00-04:00', temperature: 20, temperatureUnit: 'C', probabilityOfPrecipitation: { value: null } }],
      'day',
      at('2026-10-22T09:00:00-04:00'),
    )!;
    expect(w).toMatchObject({ nowF: 68, highF: 68, precipChance: 0, precipFromHour: null });
  });

  it('is labelled as NWS weather (sample weather is not)', () => {
    expect(isNwsWeather(mapHourly(P(evening), 'evening', at('2026-10-22T17:20:00-05:00')))).toBe(true);
    expect(isNwsWeather({ window: 'day', nowF: 46 })).toBe(false);
    expect(isNwsWeather(null)).toBe(false);
  });
});

describe('the pieces', () => {
  it('conditions from shortForecast words, rain and snow only at a 50%+ chance', () => {
    expect(hourCondition('Rain Showers Likely', 60, 10)).toBe('rain');
    expect(hourCondition('Chance Rain Showers', 30, 10)).toBe('cloudy');
    expect(hourCondition('Snow Likely', 70, 5)).toBe('snow');
    expect(hourCondition('Rain And Snow', 80, 5)).toBe('snow');
    expect(hourCondition('Slight Chance Light Snow', 20, 5)).toBe('cloudy');
    expect(hourCondition('Patchy Fog', 0, 3)).toBe('fog');
    expect(hourCondition('Breezy', 0, 15)).toBe('wind');
    expect(hourCondition('Sunny', 0, 22)).toBe('wind');
    expect(hourCondition('Mostly Cloudy', 0, 5)).toBe('cloudy');
    expect(hourCondition('Partly Sunny', 0, 5)).toBe('cloudy');
    expect(hourCondition('Partly Cloudy', 0, 5)).toBe('clear');
    expect(hourCondition('Mostly Clear', 0, 5)).toBe('clear');
    expect(hourCondition(undefined, 0, null)).toBe('clear');
  });

  it('feels-like: wind chill when cold and windy, heat index when hot and humid, else the temperature', () => {
    expect(Math.round(feelsLikeF(30, 15, 60))).toBe(19); // NWS wind chill chart: 30 °F at 15 mph → 19
    expect(Math.round(feelsLikeF(90, 5, 60))).toBe(100); // NWS heat index chart: 90 °F at 60% → 100
    expect(feelsLikeF(60, 20, 50)).toBe(60);
    expect(feelsLikeF(45, 2, 50)).toBe(45); // calm: no wind chill
    expect(feelsLikeF(45, null, null)).toBe(45);
    expect(feelsLikeF(85, 5, null)).toBe(85);
  });

  it('wind speed strings', () => {
    expect(windMph('10 mph')).toBe(10);
    expect(windMph('5 to 15 mph')).toBe(15);
    expect(windMph('')).toBeNull();
    expect(windMph(null)).toBeNull();
  });

  it('the coordinate is rounded to 2 decimals before it is sent', () => {
    expect(round2(42.35689)).toBe(42.36);
    expect(round2(-71.05923)).toBe(-71.06);
    expect(round2(-0.001)).toBe(0);
    expect(pointKey(42.35689, -71.05923)).toBe('42.36,-71.06');
    expect(pointKey(40.7, -74)).toBe('40.7,-74');
  });
});

// ---------------------------------------------------------------- the live source

interface Call {
  url: string;
  headers: Record<string, string>;
}

function fakeFetch(answer: (url: string, n: number) => { status: number; body?: unknown } | 'throw' | 'hang') {
  const calls: Call[] = [];
  const f: FetchLike = (url, init) => {
    calls.push({ url, headers: init.headers });
    const a = answer(url, calls.length);
    if (a === 'throw') return Promise.reject(new TypeError('Network request failed'));
    if (a === 'hang') {
      return new Promise((_, reject) => init.signal?.addEventListener('abort', () => reject(new Error('aborted'))));
    }
    return Promise.resolve({ ok: a.status >= 200 && a.status < 300, status: a.status, json: async () => a.body });
  };
  return { f, calls };
}

const HOURLY_URL = 'https://api.weather.gov/gridpoints/BOX/71,90/forecast/hourly';
const nwsOk = (url: string) => (url.includes('/points/') ? { status: 200, body: pointsBoston } : { status: 200, body: coldRain });

function fakeLocation(o: { permission?: 'granted' | 'denied' | 'unknown'; fix?: { latitude: number; longitude: number } | null } = {}) {
  let permission = o.permission ?? 'granted';
  const fixes: number[] = [];
  const loc: LocationProvider = {
    permission: async () => permission,
    requestPermission: async () => {
      permission = 'granted';
      return permission;
    },
    currentLocation: async (ms) => {
      fixes.push(ms);
      return o.fix === undefined ? { latitude: 42.35689, longitude: -71.05923 } : o.fix;
    },
  };
  return { loc, fixes };
}

function source(o: { fetch: FetchLike; location?: LocationProvider; now?: () => number; timeoutMs?: number }) {
  return createNwsSource({ fetch: o.fetch, location: o.location ?? fakeLocation().loc, now: o.now ?? (() => at('2026-10-22T07:30:00-04:00')), timeoutMs: o.timeoutMs });
}

describe('the NWS source', () => {
  it('points → hourly with the rounded coordinate and the User-Agent NWS requires', async () => {
    const { f, calls } = fakeFetch(nwsOk);
    const w = await source({ fetch: f }).forecast('day');
    expect(w).toMatchObject({ nowF: 43, highF: 58, source: 'nws' });
    expect(calls.map((c) => c.url)).toEqual(['https://api.weather.gov/points/42.36,-71.06', HOURLY_URL]);
    for (const c of calls) expect(c.headers['User-Agent']).toBe('Kitted iOS app');
  });

  it('caches the forecast for an hour (both windows), then refetches only the hourly forecast', async () => {
    let now = at('2026-10-22T07:30:00-04:00');
    const { f, calls } = fakeFetch(nwsOk);
    const src = source({ fetch: f, now: () => now });
    await src.forecast('day');
    expect(await src.forecast('evening')).toMatchObject({ window: 'evening', lateF: 47 });
    now += 59 * 60 * 1000;
    await src.forecast('day');
    expect(calls).toHaveLength(2);
    now += 2 * 60 * 1000; // past the hour
    expect(await src.forecast('day')).not.toBeNull();
    expect(calls.map((c) => c.url)).toEqual(['https://api.weather.gov/points/42.36,-71.06', HOURLY_URL, HOURLY_URL]);
  });

  it('callers at the same time share one request', async () => {
    const { f, calls } = fakeFetch(nwsOk);
    const src = source({ fetch: f });
    const [a, b] = await Promise.all([src.forecast('day'), src.forecast('evening'), src.prefetch()]);
    expect(a?.window).toBe('day');
    expect(b?.window).toBe('evening');
    expect(calls).toHaveLength(2);
  });

  it('outside the US (points 404) → null', async () => {
    const { f, calls } = fakeFetch(() => ({ status: 404, body: points404 }));
    const loc = fakeLocation({ fix: { latitude: 51.5072, longitude: -0.1276 } }).loc;
    expect(await source({ fetch: f, location: loc }).forecast('day')).toBeNull();
    expect(calls.map((c) => c.url)).toEqual(['https://api.weather.gov/points/51.51,-0.13']);
  });

  it('offline (fetch throws) → null', async () => {
    const { f } = fakeFetch(() => 'throw');
    expect(await source({ fetch: f }).forecast('day')).toBeNull();
  });

  it('a stalled request gives up at the timeout → null', async () => {
    const { f } = fakeFetch(() => 'hang');
    const t0 = Date.now();
    expect(await source({ fetch: f, timeoutMs: 80 }).forecast('day')).toBeNull();
    expect(Date.now() - t0).toBeLessThan(1_000);
  });

  it('a 5xx blip on the hourly forecast is retried once', async () => {
    const { f, calls } = fakeFetch((url, n) => (url.includes('/points/') ? { status: 200, body: pointsBoston } : n === 2 ? { status: 500, body: {} } : { status: 200, body: coldRain }));
    expect(await source({ fetch: f }).forecast('day')).not.toBeNull();
    expect(calls).toHaveLength(3);
  });

  it('a bad answer → null (no forecast link, a link off api.weather.gov, no periods)', async () => {
    for (const body of [{}, { properties: { forecastHourly: 'https://example.com/hourly' } }]) {
      const { f, calls } = fakeFetch(() => ({ status: 200, body }));
      expect(await source({ fetch: f }).forecast('day')).toBeNull();
      expect(calls).toHaveLength(1);
    }
    const { f } = fakeFetch((url) => (url.includes('/points/') ? { status: 200, body: pointsBoston } : { status: 200, body: { properties: { periods: [] } } }));
    expect(await source({ fetch: f }).forecast('day')).toBeNull();
  });

  it('no permission → null, and neither the location nor the network is touched', async () => {
    const { f, calls } = fakeFetch(nwsOk);
    for (const permission of ['unknown', 'denied'] as const) {
      const { loc, fixes } = fakeLocation({ permission });
      const src = source({ fetch: f, location: loc });
      expect(await src.forecast('day')).toBeNull();
      await src.prefetch();
      expect(fixes).toHaveLength(0);
    }
    expect(calls).toHaveLength(0);
  });

  it('no location fix → null, nothing sent', async () => {
    const { f, calls } = fakeFetch(nwsOk);
    expect(await source({ fetch: f, location: fakeLocation({ fix: null }).loc }).forecast('day')).toBeNull();
    expect(calls).toHaveLength(0);
  });

  it('asks the location provider for the permission (the real iOS prompt), not the store', async () => {
    const { loc } = fakeLocation({ permission: 'unknown' });
    const src = source({ fetch: fakeFetch(nwsOk).f, location: loc });
    expect(await src.permission()).toBe('unknown');
    expect(await src.requestPermission()).toBe('granted');
    expect(await src.forecast('day')).not.toBeNull();
  });
});

describe('which source answers', () => {
  const base = { demoEnabled: true, demoScreen: null, demoWeather: null, locationAvailable: true };
  it('live in normal use, in dev and release builds', () => {
    expect(chooseWeatherKind(base)).toBe('live');
    expect(chooseWeatherKind({ ...base, demoEnabled: false })).toBe('live');
  });
  it('demo screens and a demo weather argument keep sample weather', () => {
    expect(chooseWeatherKind({ ...base, demoScreen: 25 })).toBe('sample');
    expect(chooseWeatherKind({ ...base, demoWeather: 'hot' })).toBe('sample');
    expect(chooseWeatherKind({ ...base, demoScreen: 31, locationAvailable: false })).toBe('sample');
  });
  it('an App Store build never shows sample weather', () => {
    expect(chooseWeatherKind({ ...base, demoEnabled: false, demoScreen: 25 })).toBe('live');
  });
  it('no location module (web, or a phone not reinstalled yet) → no weather, season only', () => {
    expect(chooseWeatherKind({ ...base, locationAvailable: false })).toBe('none');
  });
});

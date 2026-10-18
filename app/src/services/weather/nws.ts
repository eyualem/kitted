// Live weather from the US National Weather Service (api.weather.gov: free, no key, public
// domain, US only like the app). 02 "S1d", 05 §MC9. Apple WeatherKit replaces it after the paid
// developer program; both sit behind the same WeatherSource.
//
// Privacy (DECISIONS-LOG #58): the approximate coordinate is rounded to 2 decimals (about 1 km)
// before it's sent, goes only to api.weather.gov, and is never stored: it lives in memory for
// this session, inside the points cache's key. Nothing here touches the store.
//
// Flow: location → GET /points/{lat},{lon} → properties.forecastHourly (cached per rounded
// coordinate) → GET the hourly forecast (cached an hour) → DayWeather for the card's window.
// Any failure (offline, outside the US = 404, a timeout, a bad answer) → null, and the card
// falls back to the season.
import type { DayWeather, WeatherCondition, WeatherWindow } from '@kitted/core';
import type { WeatherPermission, WeatherSource } from './types';

export const NWS_BASE = 'https://api.weather.gov';
/** NWS requires a User-Agent that names the app. */
export const NWS_HEADERS = { 'User-Agent': 'Kitted iOS app', Accept: 'application/geo+json' } as const;
export const NWS_TIMEOUT_MS = 6_000;
export const NWS_CACHE_MS = 60 * 60 * 1000;

/** One hour of `properties.periods` in the hourly forecast (only the fields we read). */
export interface NwsPeriod {
  startTime: string;
  endTime: string;
  temperature: number;
  temperatureUnit?: string;
  probabilityOfPrecipitation?: { value: number | null } | null;
  relativeHumidity?: { value: number | null } | null;
  windSpeed?: string | null;
  shortForecast?: string | null;
}

/** Live weather carries its source, so the card can label it (sample weather has none). */
/** `nowHour` / `highHour` / `lateHour`: the local hours those readings are for, so the card's words follow the clock
 *  (#338: the evening said "at 8" at 10 pm). */
export type SourcedWeather = DayWeather & { source?: 'nws'; nowHour?: number; highHour?: number; lateHour?: number };

export function isNwsWeather(w: unknown): boolean {
  return !!w && typeof w === 'object' && (w as { source?: unknown }).source === 'nws';
}

// ---------------------------------------------------------------- rounding

export function round2(x: number): number {
  const r = Math.round(x * 100) / 100;
  return r === 0 ? 0 : r; // no "-0"
}

/** The path segment sent to /points: the coordinate rounded to 2 decimals. */
export function pointKey(latitude: number, longitude: number): string {
  return `${round2(latitude)},${round2(longitude)}`;
}

// ---------------------------------------------------------------- feels-like (NWS formulas)

/** NWS wind chill (°F, mph); only defined at or below 50 °F with at least 3 mph of wind. */
export function windChillF(t: number, mph: number): number {
  const v = Math.pow(mph, 0.16);
  return 35.74 + 0.6215 * t - 35.75 * v + 0.4275 * t * v;
}

/** NWS heat index (Rothfusz regression with its adjustments), °F and % humidity. */
export function heatIndexF(t: number, rh: number): number {
  const simple = 0.5 * (t + 61 + (t - 68) * 1.2 + rh * 0.094);
  if ((simple + t) / 2 < 80) return simple;
  let hi =
    -42.379 + 2.04901523 * t + 10.14333127 * rh - 0.22475541 * t * rh - 0.00683783 * t * t - 0.05481717 * rh * rh +
    0.00122874 * t * t * rh + 0.00085282 * t * rh * rh - 0.00000199 * t * t * rh * rh;
  if (rh < 13 && t >= 80 && t <= 112) hi -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(t - 95)) / 17);
  else if (rh > 85 && t >= 80 && t <= 87) hi += ((rh - 85) / 10) * ((87 - t) / 5);
  return hi;
}

/** The hourly forecast has no apparent temperature: wind chill when cold and windy, heat index
 *  when hot, else the temperature itself. */
export function feelsLikeF(t: number, mph: number | null, rh: number | null): number {
  if (t <= 50 && mph !== null && mph >= 3) return Math.min(t, windChillF(t, mph));
  if (t >= 80 && rh !== null) return Math.max(t, heatIndexF(t, rh));
  return t;
}

/** "10 mph" → 10; "5 to 15 mph" → 15; anything else → null. */
export function windMph(s: string | null | undefined): number | null {
  const nums = (s ?? '').match(/\d+(\.\d+)?/g);
  return nums ? Number(nums[nums.length - 1]) : null;
}

// ---------------------------------------------------------------- condition from shortForecast

const SNOW = /snow|sleet|flurr|ice pellets|freezing|wintry|blizzard/;
const RAIN = /rain|shower|drizzle|thunder|storm/;
const FOG = /fog|haze|smoke|mist/;
const WIND = /wind|breez|gust|blustery/;
const CLEAR_ISH = /partly cloudy|mostly clear|mostly sunny/;
const CLOUD = /cloud|overcast|partly sunny/;

/** One hour's condition. Rain and snow words count only when that hour's chance is ≥ 50% (a
 *  "Slight Chance Rain Showers" hour is just cloudy); the chance itself still reaches the card. */
export function hourCondition(shortForecast: string | null | undefined, pop: number, mph: number | null): WeatherCondition {
  const s = (shortForecast ?? '').toLowerCase();
  const wet = pop >= 50;
  if (wet && SNOW.test(s)) return 'snow';
  if (wet && RAIN.test(s)) return 'rain';
  if (FOG.test(s)) return 'fog';
  if (WIND.test(s) || (mph !== null && mph >= 20)) return 'wind';
  if (SNOW.test(s) || RAIN.test(s)) return 'cloudy';
  if (CLOUD.test(s) && !CLEAR_ISH.test(s)) return 'cloudy';
  return 'clear';
}

/** Ties go to the condition that matters more for what he wears. */
const SEVERITY: readonly WeatherCondition[] = ['snow', 'rain', 'fog', 'wind', 'cloudy', 'clear'];

// ---------------------------------------------------------------- hourly → DayWeather

interface Hour {
  date: string;
  hour: number;
  endMs: number;
  tempF: number;
  pop: number;
  mph: number | null;
  rh: number | null;
  short: string | null | undefined;
}

/** "2026-10-14T08:00:00-04:00": date and hour in the forecast's own local time (no Intl). */
const LOCAL = /^(\d{4}-\d{2}-\d{2})T(\d{2}):/;

function toHour(p: NwsPeriod): Hour | null {
  const m = LOCAL.exec(p?.startTime ?? '');
  const endMs = Date.parse(p?.endTime ?? '');
  if (!m || !Number.isFinite(endMs) || typeof p.temperature !== 'number' || !Number.isFinite(p.temperature)) return null;
  const tempF = p.temperatureUnit === 'C' ? (p.temperature * 9) / 5 + 32 : p.temperature;
  const pop = p.probabilityOfPrecipitation?.value;
  const rh = p.relativeHumidity?.value;
  return {
    date: m[1],
    hour: Number(m[2]),
    endMs,
    tempF,
    pop: typeof pop === 'number' && Number.isFinite(pop) ? Math.max(0, Math.min(100, pop)) : 0,
    mph: windMph(p.windSpeed),
    rh: typeof rh === 'number' && Number.isFinite(rh) ? rh : null,
    short: p.shortForecast,
  };
}

function shiftDate(date: string, days: number): string {
  const [y, mo, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, d + days)).toISOString().slice(0, 10);
}

/**
 * The card's window from the hourly forecast (core weather.ts: day = 8 am–8 pm, evening =
 * 6 pm–midnight), from the current hour on. The day window also counts the current hour (he's
 * dressing now); the evening reads "now" at 8 pm and `lateF` at midnight. When the window has
 * already passed, the next few hours stand in. Temperatures are rounded to whole degrees.
 */
export function mapHourly(periods: readonly NwsPeriod[], window: WeatherWindow, nowMs: number): SourcedWeather | null {
  const hours = (Array.isArray(periods) ? periods : []).map(toHour).filter((h): h is Hour => h !== null && h.endMs > nowMs);
  if (hours.length === 0) return null;
  const first = hours[0];
  // The evening slot runs past midnight (until the 4 am rollover): after midnight it's still last night's evening.
  const anchor = window === 'evening' && first.hour < 4 ? shiftDate(first.date, -1) : first.date;
  const next = shiftDate(anchor, 1);

  let span: Hour[];
  let nowH: Hour;
  let late: Hour | undefined;
  if (window === 'day') {
    span = hours.filter((h, i) => i === 0 || (h.date === anchor && h.hour >= 8 && h.hour < 20));
    if (span.length < 2 && first.hour >= 20) span = hours.slice(0, 4);
    nowH = first;
  } else {
    span = hours.filter((h) => (h.date === anchor && h.hour >= 18) || (h.date === next && h.hour === 0));
    if (span.length === 0) span = hours.slice(0, 3);
    nowH = span.find((h) => h.date === anchor && h.hour === 20) ?? span[0];
    late = span.find((h) => h.date === next && h.hour === 0) ?? span[span.length - 1];
  }

  const temps = span.map((h) => h.tempF);
  const highH = span[temps.indexOf(Math.max(...temps))];
  const feels = span.map((h) => feelsLikeF(h.tempF, h.mph, h.rh));
  const wetFrom = span.find((h) => h.pop >= 50);
  const counts = new Map<WeatherCondition, number>();
  for (const h of span) {
    const c = hourCondition(h.short, h.pop, h.mph);
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  let condition: WeatherCondition = 'clear';
  let best = -1;
  for (const c of SEVERITY) {
    const n = counts.get(c) ?? 0;
    if (n > best) {
      best = n;
      condition = c;
    }
  }

  const out: SourcedWeather = {
    window,
    nowF: Math.round(nowH.tempF),
    highF: Math.round(Math.max(...temps)),
    lowF: Math.round(Math.min(...temps)),
    feelsLowF: Math.round(Math.min(...feels)),
    feelsHighF: Math.round(Math.max(...feels)),
    precipChance: Math.max(...span.map((h) => h.pop)) / 100,
    precipFromHour: wetFrom ? wetFrom.hour : null,
    condition,
    source: 'nws',
    nowHour: nowH.hour,
    highHour: highH.hour,
  };
  if (window === 'evening' && late) {
    out.lateF = Math.round(late.tempF);
    out.lateHour = late.hour;
  }
  return out;
}

// ---------------------------------------------------------------- the source

export interface LocationProvider {
  permission(): Promise<WeatherPermission>;
  requestPermission(): Promise<WeatherPermission>;
  /** One approximate fix within `timeoutMs`, or null. */
  currentLocation(timeoutMs: number): Promise<{ latitude: number; longitude: number } | null>;
}

interface FetchResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}
export type FetchLike = (url: string, init: { headers: Record<string, string>; signal?: AbortSignal }) => Promise<FetchResponse>;

export interface NwsOptions {
  location: LocationProvider;
  fetch?: FetchLike;
  now?: () => number;
  timeoutMs?: number;
  cacheMs?: number;
  log?: (line: string) => void;
}

export interface NwsSource extends WeatherSource {
  kind: 'live';
  /** Fetches the forecast now (once an hour at most) so the card's short wait finds it cached. */
  prefetch(): Promise<void>;
}

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const t = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), Math.max(0, ms));
  });
  return Promise.race([p, t]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export function createNwsSource(o: NwsOptions): NwsSource {
  const fetchFn: FetchLike = o.fetch ?? ((url, init) => fetch(url, init));
  const now = o.now ?? (() => Date.now());
  const timeoutMs = o.timeoutMs ?? NWS_TIMEOUT_MS;
  const cacheMs = o.cacheMs ?? NWS_CACHE_MS;
  const log = o.log ?? (() => undefined);
  /** Rounded coordinate → its hourly-forecast URL (a grid point's URL never changes). Memory only. */
  const points = new Map<string, string>();
  let cached: { at: number; periods: NwsPeriod[] } | null = null;
  let inflight: Promise<NwsPeriod[] | null> | null = null;

  async function getJson(url: string, deadline: number, retry = true): Promise<unknown> {
    const left = deadline - now();
    if (left <= 0) return null;
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = setTimeout(() => ctrl?.abort(), left);
    try {
      const res = await fetchFn(url, { headers: { ...NWS_HEADERS }, ...(ctrl ? { signal: ctrl.signal } : {}) });
      if (res.ok) return await res.json();
      log(`[weather] nws ${res.status} ${url.startsWith(`${NWS_BASE}/points/`) ? 'points' : 'forecast'}`);
      // The hourly endpoint is known for passing 5xx blips; one more try while there's time.
      if (retry && res.status >= 500 && deadline - now() > 1_000) return getJson(url, deadline, false);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async function load(): Promise<NwsPeriod[] | null> {
    const deadline = now() + timeoutMs;
    try {
      if ((await o.location.permission()) !== 'granted') return null;
      const c = await o.location.currentLocation(Math.max(0, deadline - now() - 1_500));
      if (!c || !Number.isFinite(c.latitude) || !Number.isFinite(c.longitude)) {
        log('[weather] no location fix');
        return null;
      }
      const key = pointKey(c.latitude, c.longitude);
      let url = points.get(key);
      if (!url) {
        const p = (await getJson(`${NWS_BASE}/points/${key}`, deadline)) as { properties?: { forecastHourly?: unknown } } | null;
        const u = p?.properties?.forecastHourly;
        // Only ever follow a link back to api.weather.gov.
        if (typeof u !== 'string' || !u.startsWith(`${NWS_BASE}/`)) return null;
        url = u;
        points.set(key, url);
      }
      const f = (await getJson(url, deadline)) as { properties?: { periods?: unknown } } | null;
      const periods = f?.properties?.periods;
      if (!Array.isArray(periods) || periods.length === 0) return null;
      cached = { at: now(), periods: periods as NwsPeriod[] };
      return cached.periods;
    } catch {
      log('[weather] nws request failed');
      return null;
    }
  }

  /** The hourly periods: cached for an hour; concurrent callers share one request; never over the timeout. */
  function hourly(): Promise<NwsPeriod[] | null> {
    if (cached && now() - cached.at < cacheMs) return Promise.resolve(cached.periods);
    if (!inflight) {
      inflight = withTimeout(load(), timeoutMs, null).finally(() => {
        inflight = null;
      });
    }
    return inflight;
  }

  return {
    kind: 'live',
    permission: () => o.location.permission(),
    requestPermission: () => o.location.requestPermission(),
    async forecast(window) {
      const periods = await hourly();
      return periods ? mapHourly(periods, window, now()) : null;
    },
    async prefetch() {
      if ((await o.location.permission()) === 'granted') await hourly();
    },
  };
}

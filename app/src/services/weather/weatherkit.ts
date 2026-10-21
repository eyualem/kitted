// Apple WeatherKit first, the US National Weather Service behind it (CLAUDE.md plan §4b, 09 §27 W1–W5, #366). Used
// only while the paid-team switch is on (src/config/apple.ts): WeatherKit needs the paid team's entitlement.
//
// Privacy as NWS (DECISIONS-LOG #58): the approximate coordinate is rounded to 2 decimals (about 1 km) before it's
// sent, goes only to Apple's weather service, and lives in memory for this session; nothing here touches the store.
// WeatherKit's hours become the same periods NWS gives, so both go through the one `mapHourly` (same windows, same
// feels-like, same conditions), tagged `source: 'weatherkit'`. Any failure → the NWS source answers as it does today.
import type { WeatherKitHour } from '../../../modules/kitted-location';
import { mapHourly, NWS_CACHE_MS, NWS_TIMEOUT_MS, round2, type LocationProvider, type NwsPeriod, type NwsSource, type SourcedWeather } from './nws';

export interface WeatherKitProvider {
  /** The hourly forecast for an already-rounded coordinate, or null. Never throws. */
  hourly(latitude: number, longitude: number): Promise<WeatherKitHour[] | null>;
}

export interface WeatherKitOptions {
  location: LocationProvider;
  weatherKit: WeatherKitProvider;
  /** Answers whenever WeatherKit doesn't. */
  fallback: NwsSource;
  now?: () => number;
  timeoutMs?: number;
  cacheMs?: number;
  log?: (line: string) => void;
}

/** WeatherKit's condition names whose words NWS's matcher wouldn't read the same way. */
const CONDITION_WORDS: Record<string, string> = {
  hail: 'rain',
  smoky: 'smoke',
  blowingDust: 'haze',
  frigid: 'clear',
  hot: 'clear',
};

/** "mostlyCloudy" → "mostly cloudy", the words `hourCondition` reads (NWS's shortForecast style). */
export function conditionWords(raw: string): string {
  if (!raw) return '';
  return CONDITION_WORDS[raw] ?? raw.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
}

function finite(x: unknown): number | null {
  return typeof x === 'number' && Number.isFinite(x) ? x : null;
}

/** WeatherKit's hours as NWS hourly periods (°F, chance and humidity in %, wind as "N mph"). Bad rows are dropped. */
export function toPeriods(hours: readonly WeatherKitHour[]): NwsPeriod[] {
  const out: NwsPeriod[] = [];
  for (const h of Array.isArray(hours) ? hours : []) {
    const tempF = finite(h?.tempF);
    if (tempF === null || typeof h.start !== 'string' || typeof h.end !== 'string') continue;
    const pop = finite(h.precipChance);
    const rh = finite(h.humidity);
    const mph = finite(h.windMph);
    out.push({
      startTime: h.start,
      endTime: h.end,
      temperature: tempF,
      temperatureUnit: 'F',
      probabilityOfPrecipitation: { value: pop === null ? null : Math.round(pop * 100) },
      relativeHumidity: { value: rh === null ? null : Math.round(rh * 100) },
      windSpeed: mph === null ? null : `${Math.round(mph)} mph`,
      shortForecast: conditionWords(typeof h.condition === 'string' ? h.condition : ''),
    });
  }
  return out;
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

export function createWeatherKitSource(o: WeatherKitOptions): NwsSource {
  const now = o.now ?? (() => Date.now());
  const timeoutMs = o.timeoutMs ?? NWS_TIMEOUT_MS;
  const cacheMs = o.cacheMs ?? NWS_CACHE_MS;
  const log = o.log ?? (() => undefined);
  let cached: { at: number; periods: NwsPeriod[] } | null = null;
  let inflight: Promise<NwsPeriod[] | null> | null = null;

  async function load(): Promise<NwsPeriod[] | null> {
    const deadline = now() + timeoutMs;
    try {
      if ((await o.location.permission()) !== 'granted') return null;
      const c = await o.location.currentLocation(Math.max(0, deadline - now() - 1_500));
      if (!c || !Number.isFinite(c.latitude) || !Number.isFinite(c.longitude)) return null;
      const hours = await o.weatherKit.hourly(round2(c.latitude), round2(c.longitude));
      const periods = toPeriods(hours ?? []);
      if (periods.length === 0) {
        log('[weather] weatherkit gave nothing; NWS instead');
        return null;
      }
      cached = { at: now(), periods };
      return periods;
    } catch {
      log('[weather] weatherkit failed; NWS instead');
      return null;
    }
  }

  /** WeatherKit's periods: cached for an hour; concurrent callers share one request; never over the timeout. */
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
      const w: SourcedWeather | null = periods ? mapHourly(periods, window, now()) : null;
      if (w) return { ...w, source: 'weatherkit' };
      return o.fallback.forecast(window);
    },
    async prefetch() {
      if ((await o.location.permission()) !== 'granted') return;
      if (!(await hourly())) await o.fallback.prefetch();
    },
  };
}

// Where the morning/evening card's weather comes from (02 "S1d", 05 §MC9).
// Live: the US National Weather Service with approximate location (nws.ts), in dev and release
// builds. With the paid-team switch on (src/config/apple.ts, #365), Apple WeatherKit answers first and NWS stands
// behind it (weatherkit.ts). Demo screens keep sample weather, always labelled "Sample weather" on the card.
import type { DayWeather, WeatherWindow } from '@kitted/core';
import * as location from '../../../modules/kitted-location';
import { store } from '@/data/db';
import { DEMO_ENABLED } from '@/demo/config';
import type { DemoWeather } from '@/demo/demoArgs';
import { APPLE_PAID } from '@/config/apple';
import { getDemoArgs } from '@/state/session';
import { createNwsSource } from './nws';
import { createWeatherKitSource } from './weatherkit';
import type { WeatherSource } from './types';

export type { WeatherPermission, WeatherSource } from './types';
export { isLiveWeather, isNwsWeather, isWeatherKitWeather, type SourcedWeather } from './nws';

const PERMISSION_KV = 'weather.permission';

/** Sample days (°F). coldRain is the mockup's "Cold start, warm afternoon, rain tonight". */
export const SAMPLE_WEATHER: Record<Exclude<DemoWeather, 'none'>, Record<WeatherWindow, DayWeather>> = {
  coldRain: {
    day: { window: 'day', nowF: 46, highF: 63, lowF: 44, feelsLowF: 42, feelsHighF: 61, precipChance: 0.7, precipFromHour: 17, condition: 'cloudy' },
    evening: { window: 'evening', nowF: 52, highF: 54, lowF: 47, feelsLowF: 44, feelsHighF: 52, precipChance: 0.8, precipFromHour: 18, condition: 'rain', lateF: 47 },
  },
  mild: {
    day: { window: 'day', nowF: 55, highF: 66, lowF: 53, feelsLowF: 53, feelsHighF: 66, precipChance: 0.1, precipFromHour: null, condition: 'cloudy' },
    evening: { window: 'evening', nowF: 58, highF: 60, lowF: 52, feelsLowF: 52, feelsHighF: 58, precipChance: 0.05, precipFromHour: null, condition: 'clear', lateF: 52 },
  },
  hot: {
    day: { window: 'day', nowF: 78, highF: 90, lowF: 76, feelsLowF: 76, feelsHighF: 93, precipChance: 0, precipFromHour: null, condition: 'clear' },
    evening: { window: 'evening', nowF: 82, highF: 84, lowF: 75, feelsLowF: 75, feelsHighF: 84, precipChance: 0, precipFromHour: null, condition: 'clear', lateF: 75 },
  },
  freezing: {
    day: { window: 'day', nowF: 24, highF: 31, lowF: 22, feelsLowF: 15, feelsHighF: 28, precipChance: 0.6, precipFromHour: 11, condition: 'snow' },
    evening: { window: 'evening', nowF: 22, highF: 24, lowF: 18, feelsLowF: 12, feelsHighF: 20, precipChance: 0.2, precipFromHour: null, condition: 'clear', lateF: 18 },
  },
};

const sampleSource: WeatherSource = {
  kind: 'sample',
  async permission() {
    const v = await store.getKv(PERMISSION_KV);
    return v === 'granted' || v === 'denied' ? v : 'unknown';
  },
  async requestPermission() {
    await store.setKv(PERMISSION_KV, 'granted');
    return 'granted';
  },
  async forecast(window) {
    if ((await this.permission()) !== 'granted') return null;
    const pick = getDemoArgs().weather ?? 'coldRain';
    return pick === 'none' ? null : SAMPLE_WEATHER[pick][window];
  },
};

const noSource: WeatherSource = {
  kind: 'none',
  permission: async () => 'unknown',
  requestPermission: async () => 'denied',
  forecast: async () => null,
};

const log = __DEV__ ? (line: string) => console.log(line) : undefined;

/** NWS: approximate location (kitted-location) → api.weather.gov. Memory-only caches. */
const nwsSource = createNwsSource({ location, log });

/** Whether Apple WeatherKit answers first: the paid-team switch is on and this build has the native call (09 §26 S3). */
export function weatherKitFirst(o: { applePaid: boolean; weatherKitAvailable: boolean }): boolean {
  return o.applePaid && o.weatherKitAvailable;
}

/** Live weather: WeatherKit with NWS behind it once the switch is on, else NWS alone (exactly as before #365). */
const liveSource = weatherKitFirst({ applePaid: APPLE_PAID, weatherKitAvailable: location.weatherKitAvailable })
  ? createWeatherKitSource({ location, weatherKit: { hourly: location.weatherKitHourly }, fallback: nwsSource, log })
  : nwsSource;

/**
 * Which source answers right now. Demo screens (and a `-demoWeather` launch argument) keep sample
 * weather, so screenshots never change; everything else is live. A build without the location
 * module (web, or a phone that hasn't been reinstalled since it was added) has no weather: the card
 * then plans by the season and never asks for location.
 */
export function chooseWeatherKind(o: {
  demoEnabled: boolean;
  demoScreen: number | null;
  demoWeather: DemoWeather | null;
  locationAvailable: boolean;
}): WeatherSource['kind'] {
  if (o.demoEnabled && (o.demoScreen !== null || o.demoWeather !== null)) return 'sample';
  return o.locationAvailable ? 'live' : 'none';
}

function current(): WeatherSource {
  const args = getDemoArgs();
  const kind = chooseWeatherKind({ demoEnabled: DEMO_ENABLED, demoScreen: args.demoScreen, demoWeather: args.weather, locationAvailable: location.isAvailable });
  return kind === 'sample' ? sampleSource : kind === 'live' ? liveSource : noSource;
}

/** The app's weather source. Chosen per call, because a demo link can arrive while the app runs. */
export const weatherSource: WeatherSource = {
  get kind() {
    return current().kind;
  },
  permission: () => current().permission(),
  requestPermission: () => current().requestPermission(),
  forecast: (window: WeatherWindow): Promise<DayWeather | null> => current().forecast(window),
  prefetch: async () => {
    await current().prefetch?.();
  },
};

export { PERMISSION_KV as WEATHER_PERMISSION_KV };

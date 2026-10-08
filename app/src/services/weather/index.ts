// Where the morning/evening card's weather comes from (02 "S1d", 05 §MC).
// Live: Apple WeatherKit + approximate location, once the paid developer program is active (MC9).
// Until then: sample weather, always labelled "Sample weather" on the card (never passed off as real).
import type { DayWeather, WeatherWindow } from '@kitted/core';
import { store } from '@/data/db';
import { DEMO_ENABLED } from '@/demo/config';
import type { DemoWeather } from '@/demo/demoArgs';
import { getDemoArgs } from '@/state/session';

export type WeatherPermission = 'granted' | 'denied' | 'unknown';

export interface WeatherSource {
  /** 'live' = WeatherKit; 'sample' = the fixtures below; 'none' = no weather at all (season only). */
  kind: 'live' | 'sample' | 'none';
  permission(): Promise<WeatherPermission>;
  requestPermission(): Promise<WeatherPermission>;
  /** The window the card plans for, or null (no permission, offline, or no source). */
  forecast(window: WeatherWindow): Promise<DayWeather | null>;
}

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

/** Sample weather in demo and dev builds; no weather in a release build until WeatherKit lands (MC9). */
export const weatherSource: WeatherSource = DEMO_ENABLED || __DEV__ ? sampleSource : noSource;

export { PERMISSION_KV as WEATHER_PERMISSION_KV };

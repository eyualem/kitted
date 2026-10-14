// The weather source contract (02 "S1d", 05 §MC). Live today: the US National Weather Service
// (nws.ts). Apple WeatherKit slots in behind the same interface after the paid program (MC9).
import type { DayWeather, WeatherWindow } from '@kitted/core';

export type WeatherPermission = 'granted' | 'denied' | 'unknown';

export interface WeatherSource {
  /** 'live' = real weather (NWS now, WeatherKit later); 'sample' = the demo fixtures; 'none' = no weather at all (season only). */
  kind: 'live' | 'sample' | 'none';
  permission(): Promise<WeatherPermission>;
  /** Shows the system location prompt the first time (live), from the card's ask row only. */
  requestPermission(): Promise<WeatherPermission>;
  /** The window the card plans for, or null (no permission, offline, outside the US, or no source). */
  forecast(window: WeatherWindow): Promise<DayWeather | null>;
  /** Live only: start fetching early, so the card's short wait finds the forecast cached. */
  prefetch?(): Promise<void>;
}

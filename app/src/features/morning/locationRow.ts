// Which location row the morning card shows (02 "S1d", 09-ui-review §23 M4, #353). iOS asks for location once: after
// "Don't Allow" only Settings can turn it back on, so a denied card gets a quiet link there instead of the Allow row
// (which would do nothing). A card with weather, or a build with no weather source, shows neither.
import type { WeatherPermission, WeatherSource } from '@/services/weather';

export function locationRow(o: { permission: WeatherPermission; hasWeather: boolean; sourceKind: WeatherSource['kind'] }): 'ask' | 'settings' | null {
  if (o.hasWeather || o.sourceKind === 'none') return null;
  if (o.permission === 'unknown') return 'ask';
  if (o.permission === 'denied') return 'settings';
  return null;
}

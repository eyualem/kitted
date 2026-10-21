// The paid-team switch, as the app's JS sees it (09 §27 S3, #366). The one place to flip is `APPLE` in app.config.ts;
// this only reads it (`extra.applePaid`), like the demo flag. On: Apple Weather first (NWS behind it).
import Constants from 'expo-constants';

export function applePaidFrom(extra: unknown): boolean {
  return extra === true;
}

export const APPLE_PAID: boolean = applePaidFrom(Constants.expoConfig?.extra?.applePaid);

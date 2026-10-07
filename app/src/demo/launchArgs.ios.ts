// iOS puts `-key value` launch arguments into UserDefaults; React Native's Settings reads them
// (05 §5.2). `xcrun simctl launch <udid> com.trykitted.kitted -demoScreen 7 -demoLatency 0`.
import { Settings } from 'react-native';
import { LAUNCH_ARG_KEYS, type RawArgs } from './demoArgs';

export function readLaunchArgs(): RawArgs {
  const out: Record<string, unknown> = {};
  for (const key of LAUNCH_ARG_KEYS) {
    const v: unknown = Settings.get(key);
    if (v !== undefined && v !== null) out[key] = v;
  }
  return out;
}

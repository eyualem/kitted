import Constants from 'expo-constants';

/** `extra.demo` from app.config.ts: true (KITTED_DEMO=1), false (KITTED_DEMO=0), or null/absent: follow the build. */
export function demoEnabled(extraDemo: unknown, isDev: boolean): boolean {
  if (extraDemo === true) return true;
  if (extraDemo === false) return false;
  return isDev;
}

/** Demo tools (demo/* routes, scripted story, demo store). On in Debug builds, off in Release unless KITTED_DEMO=1 (#322). */
export const DEMO_ENABLED: boolean = demoEnabled(Constants.expoConfig?.extra?.demo, __DEV__);

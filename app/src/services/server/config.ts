// Which way the AI calls go (handoff/13-server.md §8, #328). A Release build has no Gemini key and always calls our
// server (the Cloud Function `api`). A dev build keeps the dev key straight to Gemini (the founder's phone works without
// the server) unless EXPO_PUBLIC_KITTED_SERVER points it at the server: `live` = the deployed function, a host such as
// `127.0.0.1` = the local Functions emulator. A dev build with neither keeps the demo-only reading.

/** The deployed function (13 §2). */
export const SERVER_URL = 'https://us-central1-kitted-a5b45.cloudfunctions.net/api';
/** The emulators' project (firebase/tests: `--project demo-kitted`); the app's Firebase config follows it there. */
export const EMULATOR_PROJECT = 'demo-kitted';
export const EMULATOR_FUNCTIONS_PORT = 5001;
export const EMULATOR_AUTH_PORT = 9099;

/** `undefined` in Release: `__DEV__` is false there, so the minifier drops the key string (guard:release checks). */
export const DEV_GEMINI_KEY: string | undefined = __DEV__ ? process.env.EXPO_PUBLIC_GEMINI_DEV_KEY || undefined : undefined;
/** Dev only (ignored in Release): `live`, or the emulator's host. */
const DEV_SERVER_SETTING: string | undefined = __DEV__ ? process.env.EXPO_PUBLIC_KITTED_SERVER || undefined : undefined;

export type AiPath =
  | { kind: 'direct'; apiKey: string }
  | { kind: 'server'; base: string; emulatorHost: string | null }
  | { kind: 'none' };

/** Pure, for the tests (A1). `release` = !__DEV__. */
export function aiPathFor(o: { release: boolean; devKey?: string; setting?: string }): AiPath {
  if (o.release) return { kind: 'server', base: SERVER_URL, emulatorHost: null };
  const s = o.setting?.trim();
  if (s) {
    if (s === 'live') return { kind: 'server', base: SERVER_URL, emulatorHost: null };
    return { kind: 'server', base: `http://${s}:${EMULATOR_FUNCTIONS_PORT}/${EMULATOR_PROJECT}/us-central1/api`, emulatorHost: s };
  }
  return o.devKey ? { kind: 'direct', apiKey: o.devKey } : { kind: 'none' };
}

export const AI_PATH: AiPath = aiPathFor({ release: !__DEV__, devKey: DEV_GEMINI_KEY, setting: DEV_SERVER_SETTING });

/** The local Auth emulator's host while the dev build points at the emulators (services/firebase/app.ts). */
export const emulatorHost = (): string | null => (AI_PATH.kind === 'server' ? AI_PATH.emulatorHost : null);

// The app's one AI transport (13-server.md §8, #327): the dev key straight to Gemini on a dev build, else our server
// with the guest sign-in. The four callers (readingSource/live.ts, closetSource/live.ts, ask/liveSource.ts) share it,
// so a check's read, look arms and closet call share one guest account and token.
import { fetch as expoFetch } from 'expo/fetch';
import { Platform } from 'react-native';
import { store } from '@/data/db';
import { sessionClock } from '@/state/session';
import { AI_PATH, type AiPath } from './config';
import { createGuestToken } from './guest';
import { tierRecorder } from './tier';
import { directTransport, serverTransport, type AiFetch, type AiTransport } from './transport';

/** expo/fetch streams on the phone; in the web preview it throws before sending, so the browser's own fetch (#310). */
const appFetch = (): AiFetch => (Platform.OS === 'web' ? globalThis.fetch.bind(globalThis) : expoFetch) as unknown as AiFetch;

function build(path: AiPath): AiTransport | null {
  if (path.kind === 'none') return null;
  if (path.kind === 'direct') return directTransport(path.apiKey, appFetch());
  console.log(`[server] AI calls go to ${path.emulatorHost ? `the emulator at ${path.emulatorHost}` : 'the server'}`);
  return serverTransport({
    base: path.base,
    fetch: appFetch(),
    token: createGuestToken(async () => (await import('./firebaseGuest')).firebaseGuest(), (l) => console.log(l)),
    tzMinutes: () => sessionClock.offset(sessionClock.nowMs()) / 60_000,
    onTier: tierRecorder(store),
  });
}

let transport: AiTransport | null | undefined;

/** The shared transport, or null when real photos and questions can't go anywhere (a dev build with no key). */
export function aiTransport(): AiTransport | null {
  if (transport === undefined) transport = build(AI_PATH);
  return transport;
}

/** The dev key's direct path: the founder's phone, where the daily limit doesn't apply while testing readings. */
export const DIRECT_AI = AI_PATH.kind === 'direct';

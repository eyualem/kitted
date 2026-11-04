// The app's tracking state (tracking.ts): sync is allowed on iPhone only, never on a demo screen or under Jest, and
// this phone's id is made once and kept in the Keychain (#386). db.ts wraps the store with it.
import { Platform } from 'react-native';
import { getDeviceId, setDeviceId } from '@/data/secure';
import type { KittedStore } from '@/data/store';
import { newId } from '@/services/ids';
import { getDemoArgs } from '@/state/session';
import { createTracking } from './tracking';

const UNDER_TEST = typeof process !== 'undefined' && process.env?.JEST_WORKER_ID !== undefined;

/** iOS, not a demo screen, not Jest. A dev build on his phone syncs (it's how backup gets tested). */
export const syncAllowed = (): boolean => Platform.OS === 'ios' && !UNDER_TEST && getDemoArgs().demoScreen === null;

async function loadDeviceId(): Promise<string> {
  const id = await getDeviceId();
  if (id) return id;
  const made = newId('DEV');
  await setDeviceId(made);
  return made;
}

export function appTracking(raw: Pick<KittedStore, 'getKv'>) {
  return createTracking({ raw, allowed: syncAllowed, loadDeviceId, nowMs: () => Date.now() });
}

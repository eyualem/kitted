// The app's tracking state (tracking.ts): this phone records changes only where backup is allowed (sync/allowed.ts: the
// ACCOUNTS_BUILT switch, iPhone, not a demo screen), and its id is made once and kept in the Keychain. db.ts wraps the store with it.
import { getDeviceId, setDeviceId } from '@/data/secure';
import type { KittedStore } from '@/data/store';
import { newId } from '@/services/ids';
import { syncAllowed } from './allowed';
import { createTracking } from './tracking';

async function loadDeviceId(): Promise<string> {
  const id = await getDeviceId();
  if (id) return id;
  const made = newId('DEV');
  await setDeviceId(made);
  return made;
}

export function appTracking(raw: Pick<KittedStore, 'getKv'>) {
  return createTracking({ raw, allowed: () => syncAllowed(), loadDeviceId, nowMs: () => Date.now() });
}

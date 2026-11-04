// The app's backup (#386): backup.ts on Firebase. Firestore, Functions and the file system load lazily, on the first
// sync of a signed-in account, so the web preview, Jest and people who never sign in don't load them.
import { AppState } from 'react-native';
import { useSyncExternalStore } from 'react';
import { onChange } from '@/data/changes';
import { rawStore, tracking } from '@/data/db';
import { ACCOUNT_KEY, parseAccount } from '@/features/account/account';
import { fitCheck } from '@/features/fitcheck/session';
import { appVersion } from '@/features/settings/plan';
import { connectivity } from '@/services/connectivity';
import { realScheduler } from '@/services/scheduler';
import { backsUp, createBackup, type BackupConnection, type BackupStatus } from './backup';
import { syncAllowed } from './appTracking';

async function firebaseUser() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { firebaseAuth } = require('@/services/firebase/app') as typeof import('@/services/firebase/app');
  const auth = firebaseAuth();
  await auth.authStateReady();
  return auth.currentUser;
}

async function connect(uid: string): Promise<BackupConnection | null> {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const fs = require('firebase/firestore') as typeof import('firebase/firestore');
  const { firebaseDb, storageEndpoint } = require('@/services/firebase/data') as typeof import('@/services/firebase/data');
  const { createFirestoreRemote } = require('./firestoreRemote') as typeof import('./firestoreRemote');
  const { createStorageTransport } = require('./storageTransport') as typeof import('./storageTransport');
  const { deviceFiles } = require('./deviceFiles') as typeof import('./deviceFiles');
  /* eslint-enable @typescript-eslint/no-require-imports */
  const user = await firebaseUser();
  if (!user || user.uid !== uid) return null;
  const { base, bucket } = storageEndpoint();
  return {
    remote: createFirestoreRemote({ fs, db: firebaseDb(), uid }),
    files: createStorageTransport({
      http: deviceFiles,
      base,
      bucket,
      uid,
      token: async () => ((await firebaseUser())?.uid === uid ? (await firebaseUser())!.getIdToken() : null),
      // Photos: only in the foreground, online, and never during a fit check (#386 decision 8).
      canTransfer: () => connectivity.get().online && AppState.currentState === 'active' && !fitCheck.busy(),
    }),
  };
}

async function deleteServer(): Promise<'ok' | 'failed' | 'offline'> {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { httpsCallable } = require('firebase/functions') as typeof import('firebase/functions');
  const { firebaseFunctions } = require('@/services/firebase/data') as typeof import('@/services/firebase/data');
  /* eslint-enable @typescript-eslint/no-require-imports */
  try {
    await httpsCallable(firebaseFunctions(), 'deleteAccount', { timeout: 60_000 })({});
    return 'ok';
  } catch (e: unknown) {
    const code = String((e as { code?: string }).code ?? '');
    console.warn('[sync] deleteAccount', code || e);
    return /unavailable|deadline|network/.test(code) ? 'offline' : 'failed';
  }
}

export const backup = createBackup({
  store: rawStore,
  tracking,
  connect,
  async signedIn() {
    const account = parseAccount(await rawStore.getKv(ACCOUNT_KEY));
    return account ? backsUp(account, await firebaseUser()) : null;
  },
  allowed: syncAllowed,
  busy: () => fitCheck.busy(),
  online: () => connectivity.get().online,
  foreground: () => AppState.currentState === 'active',
  nowMs: () => Date.now(),
  scheduler: realScheduler,
  appVersion: appVersion().version,
  deleteServer,
  removeLocalFile(path) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('./deviceFiles') as typeof import('./deviceFiles')).deviceFiles.removeLocal(path);
  },
  log: (l) => {
    if (__DEV__) console.log(`[sync] ${l}`);
  },
});

const WIPE_ONLY = '\u0000no key';
let started = false;
/** After boot: the first sync, then on every return to the foreground, a new sign-in or sign-out, and a wipe. */
export function startBackup(): void {
  if (started || !syncAllowed()) return;
  started = true;
  backup.launched();
  AppState.addEventListener('change', (s) => backup.foregroundChanged(s === 'active'));
  // A wipe sends a kv notice with no key, which a key filter lets through: an unused key catches only those.
  onChange(['kv'], () => backup.storeReset(), WIPE_ONLY);
  onChange(['kv'], () => void backup.accountChanged(), ACCOUNT_KEY);
}

export function useBackupStatus(): BackupStatus {
  return useSyncExternalStore(backup.subscribe, backup.status, backup.status);
}

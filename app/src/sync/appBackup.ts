// The app's backup: backup.ts on Firebase, and when it runs (specs/sign-in-and-backup.md SB4, SB5). Firestore, Functions and the
// file system load lazily, on the first round of a signed-in account, so the web preview, Jest and people who never sign in
// don't load them. Nothing starts unless `syncAllowed()` (ACCOUNTS_BUILT, iPhone, not a demo screen), and a round does nothing
// unless the app's account is a non-guest Firebase user (backup.ts `backsUp`).
import { AppState } from 'react-native';
import { onChange } from '@/data/changes';
import { rawStore, tracking } from '@/data/db';
import { getAgeBlocked } from '@/data/secure';
import { KV } from '@/data/store';
import { ACCOUNT_KEY, getAccount } from '@/features/account/account';
import { fitCheck } from '@/features/fitcheck/session';
import { connectivity } from '@/services/connectivity';
import { realScheduler } from '@/services/scheduler';
import { syncAllowed } from './allowed';
import { createBackup, SYNC_UID_KEY, type BackupConnection } from './backup';

/** A change goes up this long after the last one (several writes of one fit check go in one batch). */
export const PUSH_DELAY_MS = 5_000;
/** While a fit check runs, look again this often. */
export const BUSY_RETRY_MS = 5_000;
/** After a failed connection. */
export const OFFLINE_RETRY_MS = 60_000;
/** The first round after launch waits for the screens to settle. */
export const LAUNCH_DELAY_MS = 3_000;

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
      token: async () => {
        const u = await firebaseUser();
        return u?.uid === uid ? u.getIdToken() : null;
      },
      // Photos: only in the foreground, online, and never during a fit check.
      canTransfer: () => connectivity.get().online && AppState.currentState === 'active' && !fitCheck.busy(),
    }),
  };
}

/** "Delete account and all data" is running: no round may start, so nothing is written to an account that is going away. */
let halted = false;
let inFlight: Promise<unknown> | null = null;

/** SB6.1d: no round while the under-18 lock is set, and none while a Welcome restore waits for the age answer (an account is
 *  saved, setup is not done and the phone has not joined it yet: `restoreAccount` does its own pull once the age is 18 or over). A
 *  phone that has `sync.uid`, or that finished setup before signing in, backs up as before. A failed read counts as not ready. */
async function ready(): Promise<boolean> {
  try {
    if (await getAgeBlocked()) return false;
    if (!(await getAccount(rawStore))) return true;
    if ((await rawStore.getKv(SYNC_UID_KEY)) !== null) return true;
    return (await rawStore.getKv(KV.onboardingDone)) === '1';
  } catch {
    return false;
  }
}

export const backup = createBackup({
  store: rawStore,
  connect,
  account: () => getAccount(rawStore),
  firebaseUser,
  allowed: () => !halted && syncAllowed(),
  ready,
  online: () => connectivity.get().online,
  nowMs: () => Date.now(),
  deviceId: () => tracking.deviceId(),
  log: (l) => {
    if (__DEV__) console.log(`[sync] ${l}`);
  },
});

let timer: ReturnType<typeof setTimeout> | null = null;
function schedule(ms: number) {
  if (timer !== null) realScheduler.clearTimer(timer);
  timer = realScheduler.setTimer(() => {
    timer = null;
    void run();
  }, ms) as ReturnType<typeof setTimeout>;
}

/** One round, unless a fit check is running (one thing at a time: look again soon). */
async function run(): Promise<void> {
  if (fitCheck.busy()) return schedule(BUSY_RETRY_MS);
  const round = backup.syncNow();
  inFlight = round;
  const out = await round;
  if (out === 'offline') schedule(OFFLINE_RETRY_MS);
}

/** Before the account's server copy is deleted (SB9): stops the next rounds and waits for the one running. */
export async function haltBackup(): Promise<void> {
  halted = true;
  if (timer !== null) realScheduler.clearTimer(timer);
  timer = null;
  await inFlight?.catch(() => undefined);
}

/** The account and the phone's data are gone (SB9): a new sign-in in this session backs up again. */
export function backupAccountDeleted(): void {
  halted = false;
}

/** The delete did not happen: backup goes on. */
export function resumeBackup(): void {
  halted = false;
  schedule(PUSH_DELAY_MS);
}

const WIPE_ONLY = '\u0000no key';
let started = false;
/** After boot: the first round, then on every return to the foreground, every recorded change, a new sign-in and a wipe. */
export function startBackup(): void {
  if (started || !syncAllowed()) return;
  started = true;
  schedule(LAUNCH_DELAY_MS);
  tracking.onRecord(() => schedule(PUSH_DELAY_MS));
  AppState.addEventListener('change', (s) => {
    if (s === 'active') schedule(0);
  });
  // A wipe sends a kv notice with no key, which a key filter lets through: an unused key catches only those.
  onChange(['kv'], () => {
    tracking.reset();
    backup.reset();
  }, WIPE_ONLY);
  // A sign-in or sign-out changes the saved account. A new account is not the one being deleted: backup is no longer halted.
  // From Welcome the round is refused until the age is answered (`ready`).
  onChange(['kv'], () => {
    void getAccount(rawStore).then((a) => {
      if (a) halted = false;
    }, () => undefined);
    schedule(0);
  }, ACCOUNT_KEY);
  // Setup finishing (a restore after the age answer, or the first setup) lets the round that `ready` refused go ahead.
  onChange(['kv'], () => schedule(PUSH_DELAY_MS), KV.onboardingDone);
}

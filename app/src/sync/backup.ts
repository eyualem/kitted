// T41b (SB4.1, SB-GATE, SB7.1): the app's side of backup, ported from the old PR #57 (`git show
// claude/backup-sync-au1-658e0f:app/src/sync/backup.ts`), trimmed to what the tests fix. STUBS: createBackup throws.
import type { KittedStore } from '@/data/store';
import type { FileTransport, RemoteStore } from './remote';

export interface BackupConnection {
  remote: RemoteStore;
  files?: FileTransport;
}

export interface BackupDeps {
  /** The inner (untracked) store: what the engine writes pulled rows to. */
  store: KittedStore;
  /** The account's server for `uid`, or null where Firebase can't run. Never called unless the gate below passes. */
  connect(uid: string): Promise<BackupConnection | null>;
  /** The app's saved account (kv `account.user`), or null when signed out. */
  account(): Promise<{ uid: string } | null>;
  /** The Firebase user, or null. A guest is `isAnonymous: true`. */
  firebaseUser(): Promise<{ uid: string; isAnonymous: boolean } | null>;
  /** `syncAllowed()`: the ACCOUNTS_BUILT switch, iPhone, not a demo screen. */
  allowed(): boolean;
  online(): boolean;
  nowMs(): number;
  /** This phone's id (the sync engine's `by`). */
  deviceId(): Promise<string>;
  log?(line: string): void;
}

/** Who backs up: the app's account when it is the Firebase user, that user is not a guest, and the uids match; else null. */
export function backsUp(_account: { uid: string } | null, _user: { uid: string; isAnonymous: boolean } | null): { uid: string } | null {
  throw new Error('T41b: not built');
}

/** `'off'`: did not run (the gate, a guest, signed out, a different user, no connection object). `'offline'`: no network or the
 *  server did not answer. `'failed'`: any other error. `'ok'`: ran. */
export type SyncOutcome = 'ok' | 'off' | 'offline' | 'failed';

export interface Backup {
  /** One round: gate → (first time with this account on this phone: pull the account's rows, then every row on this phone goes up,
   *  so both sets exist on both sides) → pull → push → files. Files: only when kv `backup.photos` is `'on'` (read each round):
   *  every kept photo (`syncedFilePath`) of every live synced row that is not on the server yet is uploaded once; with it off no
   *  `upload` is called, whether the photo was queued before it was switched off, added after sign-in, or pulled in a restore. */
  syncNow(): Promise<SyncOutcome>;
}

export function createBackup(_d: BackupDeps): Backup {
  throw new Error('T41b: not built');
}

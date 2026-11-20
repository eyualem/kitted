// Backup, the app's side (specs/sign-in-and-backup.md SB4, SB5, SB7; ported from the old PR #57 and cut down): who may back up,
// what the first round with an account does, and when photos go. The engine (engine.ts) moves rows and files; this decides
// whether and what. Everything outside comes in as `deps`, so Jest runs it on in-memory phones and the app wires it to Firebase
// (appBackup.ts). No React Native import here: the emulator tests load this file in Node.
//
// Nothing leaves the phone unless all of these hold: backup is allowed here (ACCOUNTS_BUILT, iPhone, not a demo screen), the
// app's account is the Firebase user and is not a guest, the phone is online. Photos go only while kv `backup.photos` is `'on'`.
import type { KittedStore } from '@/data/store';
import { createSyncEngine, type SyncEngine } from './engine';
import { PHOTO_BACKUP_KEY } from './photoBackup';
import { RemoteUnavailable, type FileTransport, type RemoteStore } from './remote';

/** The account this phone's change records belong to (kv, local to the phone: the `sync.` prefix never syncs). */
export const SYNC_UID_KEY = 'sync.uid';

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
export function backsUp(account: { uid: string } | null, user: { uid: string; isAnonymous: boolean } | null): { uid: string } | null {
  return account && user && !user.isAnonymous && user.uid === account.uid ? { uid: user.uid } : null;
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
  /** Forgets the connection (sign-out, a wipe, a different account): the next round connects again. */
  reset(): void;
}

export function createBackup(d: BackupDeps): Backup {
  const log = d.log ?? ((l: string) => console.log(`[sync] ${l}`));
  let conn: BackupConnection | null = null;
  let engine: SyncEngine | null = null;
  let connUid: string | null = null;
  /** Read from the store at the start of each round and again after the pull (the account's setting may arrive in it). */
  let photosOn = false;
  let running: Promise<SyncOutcome> | null = null;
  let again = false;

  const readPhotosOn = async () => {
    photosOn = (await d.store.getKv(PHOTO_BACKUP_KEY)) === 'on';
  };

  async function engineFor(uid: string): Promise<SyncEngine | null> {
    if (engine && connUid === uid) return engine;
    conn = await d.connect(uid);
    if (!conn) return null;
    connUid = uid;
    const device = await d.deviceId();
    engine = createSyncEngine({
      store: d.store, remote: conn.remote, files: conn.files, deviceId: device, nowMs: d.nowMs, enabled: () => d.allowed() && connUid === uid,
      backUpPhotos: () => photosOn,
    });
    return engine;
  }

  /** The first round with this account on this phone: forget any other account's records, let the account's rows come down first
   *  (this phone has no record of them), then send this phone's own, so "Keep both" leaves both sets on both sides. */
  async function join(e: SyncEngine, uid: string): Promise<void> {
    await e.clearBookkeeping();
    const { applied } = await e.pull();
    await d.store.setKv('sync.uid', uid); // SYNC_UID_KEY (a literal for the kv scan in syncSchema.test)
    const own = await e.markAllDirty({ onlyUntracked: true });
    log(`joined: ${applied} from the account, ${own} from this phone`);
  }

  async function round(): Promise<SyncOutcome> {
    if (!d.allowed()) return 'off';
    const who = backsUp(await d.account(), await d.firebaseUser());
    if (!who) return 'off';
    if (!d.online()) return 'offline';
    try {
      const e = await engineFor(who.uid);
      if (!e) return 'off';
      await readPhotosOn();
      if ((await d.store.getKv(SYNC_UID_KEY)) !== who.uid) await join(e, who.uid);
      else await e.pull();
      await readPhotosOn();
      await e.push();
      if (photosOn) {
        await e.queueFiles();
        await e.drainFiles();
      }
      return 'ok';
    } catch (err: unknown) {
      if (err instanceof RemoteUnavailable) return 'offline';
      log(`sync failed: ${(err as Error)?.message ?? String(err)}`);
      return 'failed';
    }
  }

  return {
    /** Runs a round now, or once more right after the one already running. */
    syncNow(): Promise<SyncOutcome> {
      if (running) {
        again = true;
        return running;
      }
      running = (async () => {
        try {
          let out: SyncOutcome;
          do {
            again = false;
            out = await round();
          } while (again && out === 'ok');
          return out;
        } finally {
          running = null;
        }
      })();
      return running;
    },
    reset() {
      conn = null;
      engine = null;
      connUid = null;
      photosOn = false;
    },
  };
}

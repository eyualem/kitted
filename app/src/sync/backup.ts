// Backup and sync, the app's side (handoff/11-firestore-schema.md §11, checks B1–B15; #386): who may sync, when, what
// joining an account does, the restore, the status line and the account's deletion. The engine (engine.ts) moves the
// rows and files; this decides when it runs. Everything outside comes in as `deps`, so Jest runs it on two in-memory
// phones and the app wires it to Firebase (appBackup.ts).
//
// Nothing leaves the phone unless all of these hold: the app's account is the Firebase user and isn't a guest, sync is
// allowed here (iOS, not a demo screen), the phone is online, and no fit check is running (one check at a time, #371).
import type { KittedStore } from '@/data/store';
import { SPECS, type Table } from '@/data/tables';
import type { Scheduler } from '@/services/scheduler';
import { createSyncEngine, type SyncEngine } from './engine';
import type { AccountTouch, Holdings } from './firestoreRemote';
import { RemoteUnavailable, type FileTransport, type RemoteStore } from './remote';
import { KV_SYNCED, SYNCED_COLLECTIONS, SYNCED_TABLES, SYNC_SCHEMA_VERSION, fileRefs } from './schema';
import { SYNC_UID_KEY, type Tracking } from './tracking';
import type { Cursor, StoredDoc } from './types';

/** "Use the account's" (A5) waits here until the join runs: it deletes this phone's own rows first. */
export const JOIN_MODE_KEY = 'sync.joinMode';
const LAST_AT_KEY = 'sync.lastAt';
const TOUCHED_KEY = 'sync.touched';

/** A change goes up this long after the last one (several writes of one fit check go in one batch). */
export const PUSH_DELAY_MS = 5_000;
/** While a fit check runs, look again this often. */
export const BUSY_RETRY_MS = 5_000;
/** After a failed connection. */
export const OFFLINE_RETRY_MS = 60_000;
/** The first sync after launch waits for the screens to settle. */
export const LAUNCH_DELAY_MS = 3_000;

export type JoinMode = 'merge' | 'replace';

/** Kept here: synced, but this phone's (the Basics draft holds the birth year). */
const KEEP_ON_REPLACE = new Set(['onboarding.basics']);

export interface BackupRemote extends RemoteStore {
  holdings?(): Promise<Holdings>;
  touch?(t: AccountTouch): Promise<void>;
  watch?(coll: string, cursor: Cursor | null, onDocs: (docs: StoredDoc[]) => void, onError?: (e: Error) => void): () => void;
}

export interface BackupConnection {
  remote: BackupRemote;
  files?: FileTransport;
}

export interface BackupDeps {
  /** The inner store (writes here aren't recorded as his changes). */
  store: KittedStore;
  tracking: Tracking;
  /** The account's server, or null where Firebase can't run. */
  connect(uid: string): Promise<BackupConnection | null>;
  /** The app's account when it's the Firebase user and not a guest; else null. */
  signedIn(): Promise<{ uid: string } | null>;
  /** iOS, not a demo screen. */
  allowed(): boolean;
  /** A fit check is running (fitCheck.busy()). */
  busy(): boolean;
  online(): boolean;
  foreground(): boolean;
  nowMs(): number;
  scheduler: Pick<Scheduler, 'setTimer' | 'clearTimer'>;
  appVersion: string;
  /** The deleteAccount job (every document, every file, the Auth user). */
  deleteServer(): Promise<'ok' | 'failed' | 'offline'>;
  /** Deletes a file under Documents on this phone ("Use the account's" removes this phone's own photos). */
  removeLocalFile(path: string): void;
  log?(line: string): void;
}

export type BackupStatus =
  /** Not signed in to an account (the row is hidden). */
  | { kind: 'off' }
  /** Signed in, nothing has gone up yet. */
  | { kind: 'never' }
  | { kind: 'syncing' }
  | { kind: 'waiting'; changes: number }
  | { kind: 'offline'; changes: number }
  | { kind: 'upToDate'; at: number };

export type JoinResult = 'ok' | 'offline' | 'off' | 'failed';

/** Who backs up: the app's account (kv `account.user`) when it's the Firebase user and not a guest (B1). */
export function backsUp(account: { uid: string } | null, user: { uid: string; isAnonymous: boolean } | null): { uid: string } | null {
  return account && user && !user.isAnonymous && user.uid === account.uid ? { uid: user.uid } : null;
}

export function createBackup(d: BackupDeps) {
  const log = d.log ?? ((l: string) => console.log(`[sync] ${l}`));
  let conn: BackupConnection | null = null;
  let connUid: string | null = null;
  let engine: SyncEngine | null = null;
  let running: Promise<void> | null = null;
  let again = false;
  let timer: unknown = null;
  let halted: string | null = null;
  let signedUid: string | null = null;
  let lastError: 'offline' | 'failed' | null = null;
  let watching: (() => void)[] = [];
  let status: BackupStatus = { kind: 'off' };
  const subs = new Set<() => void>();
  const setStatus = (s: BackupStatus) => {
    if (JSON.stringify(s) === JSON.stringify(status)) return;
    status = s;
    subs.forEach((f) => f());
  };

  d.tracking.onRecord(() => schedule(PUSH_DELAY_MS));

  function schedule(ms: number) {
    if (timer !== null) d.scheduler.clearTimer(timer);
    timer = d.scheduler.setTimer(() => {
      timer = null;
      void syncNow();
    }, ms);
  }

  async function engineFor(uid: string): Promise<SyncEngine | null> {
    if (engine && connUid === uid) return engine;
    stopWatching();
    conn = await d.connect(uid);
    if (!conn) return null;
    connUid = uid;
    const device = await d.tracking.deviceId();
    engine = createSyncEngine({
      store: d.store, remote: conn.remote, files: conn.files, deviceId: device, nowMs: d.nowMs,
      enabled: () => d.allowed() && connUid === uid && halted !== uid,
    });
    return engine;
  }

  function stopWatching() {
    for (const stop of watching) stop();
    watching = [];
  }

  async function refreshStatus(): Promise<void> {
    if (!signedUid || !engine) return setStatus(signedUid ? { kind: 'never' } : { kind: 'off' });
    const changes = (await engine.pending()) + (await engine.pendingFiles());
    const at = Number((await d.store.getKv(LAST_AT_KEY)) ?? 0);
    if (changes === 0) return setStatus(at > 0 ? { kind: 'upToDate', at } : { kind: 'never' });
    setStatus(d.online() && lastError !== 'offline' ? { kind: 'waiting', changes } : { kind: 'offline', changes });
  }

  /** Every synced row and kv key of this phone goes (not the profile: it holds his birth year, which never syncs),
   *  with the photos they point at. Before the account's rows come down ("Use the account's", A5). */
  async function dropLocal(): Promise<void> {
    const files = new Set<string>();
    for (const n of SYNCED_TABLES) {
      if (n === 'profile') continue;
      const t = d.store[n] as unknown as Table<object>;
      const key = SPECS[n].key as string;
      for (const row of await t.all()) {
        for (const f of fileRefs(row)) files.add(f);
        await t.delete(String((row as Record<string, unknown>)[key]));
      }
    }
    for (const k of Object.keys(KV_SYNCED)) if (!KEEP_ON_REPLACE.has(k)) await d.store.deleteKv(k);
    for (const f of files) d.removeLocalFile(f);
    log(`replaced this phone's rows (${files.size} photos removed)`);
  }

  /** The first sync with this account on this phone: forget any other account's records, let the account's rows win
   *  (this phone has no record of them), then send this phone's own (E8, "Keep both"). */
  async function join(e: SyncEngine, uid: string): Promise<void> {
    const mode: JoinMode = (await d.store.getKv(JOIN_MODE_KEY)) === 'replace' ? 'replace' : 'merge';
    await e.clearBookkeeping();
    if (mode === 'replace') {
      // Only once the account answers: dropping this phone's rows and then failing to bring any back would leave him
      // with nothing.
      await conn!.remote.changesSince(SYNCED_COLLECTIONS[0]!, null, 1);
      await dropLocal();
    }
    const { applied } = await e.pull();
    await d.store.setKv(SYNC_UID_KEY, uid);
    d.tracking.setUid(uid);
    const own = await e.markAllDirty({ onlyUntracked: true });
    await d.store.deleteKv(JOIN_MODE_KEY);
    log(`joined (${mode}): ${applied} from the account, ${own} from this phone`);
  }

  async function touchOnce(uid: string): Promise<void> {
    const day = new Date(d.nowMs()).toISOString().slice(0, 10);
    const mark = `${uid}:${day}`;
    if (!conn?.remote.touch || (await d.store.getKv(TOUCHED_KEY)) === mark) return;
    try {
      await conn.remote.touch({ deviceId: await d.tracking.deviceId(), appVersion: d.appVersion, v: SYNC_SCHEMA_VERSION });
      await d.store.setKv(TOUCHED_KEY, mark);
    } catch (err: unknown) {
      log(`account doc: ${(err as Error).message}`);
    }
  }

  async function watch(e: SyncEngine): Promise<void> {
    const remote = conn?.remote;
    if (!remote?.watch || watching.length > 0) return;
    for (const coll of SYNCED_COLLECTIONS) {
      // One collection's snapshots apply in order (each moves the cursor).
      let chain = Promise.resolve();
      const stop = remote.watch(
        coll,
        await e.cursorOf(coll),
        (docs) => {
          chain = chain
            .then(async () => {
              if ((await e.applyRemote(coll, docs)) > 0) log(`live: ${docs.length} ${coll}`);
            })
            .catch((err: unknown) => log(`live ${coll}: ${(err as Error).message}`));
        },
        (err) => {
          log(`listener ${coll} stopped: ${err.message}`);
          stopWatching();
        },
      );
      watching.push(stop);
    }
  }

  async function session(): Promise<void> {
    if (!d.allowed()) return setStatus({ kind: 'off' });
    const who = await d.signedIn();
    signedUid = who?.uid ?? null;
    if (!who || halted === who.uid) {
      stopWatching();
      return setStatus({ kind: 'off' });
    }
    if (d.busy()) {
      schedule(BUSY_RETRY_MS);
      return refreshStatus();
    }
    if (!d.online()) {
      lastError = 'offline';
      return refreshStatus();
    }
    const e = await engineFor(who.uid);
    if (!e) return setStatus({ kind: 'off' });
    setStatus({ kind: 'syncing' });
    try {
      if ((await d.tracking.uid()) !== who.uid) await join(e, who.uid);
      else await e.pull();
      await e.push();
      await touchOnce(who.uid);
      await e.drainFiles();
      await d.store.setKv(LAST_AT_KEY, String(d.nowMs()));
      lastError = null;
      if (d.foreground()) await watch(e);
    } catch (err: unknown) {
      if (err instanceof RemoteUnavailable) {
        lastError = 'offline';
        schedule(OFFLINE_RETRY_MS);
      } else {
        lastError = 'failed';
        log(`sync failed: ${(err as Error)?.message ?? String(err)}`);
      }
    }
    // A photo held back by a check that started meanwhile, or waiting on its backoff, goes on the next round.
    if ((await e.pendingFiles()) > 0 && d.busy()) schedule(BUSY_RETRY_MS);
    await refreshStatus();
  }

  /** Runs a sync now, or once more right after the one already running. */
  function syncNow(): Promise<void> {
    if (running) {
      again = true;
      return running;
    }
    running = (async () => {
      try {
        do {
          again = false;
          await session();
        } while (again);
      } finally {
        running = null;
      }
    })();
    return running;
  }

  return {
    syncNow,

    /** At launch (after boot), on return to the foreground, and when the account on this phone changes. */
    launched() {
      schedule(LAUNCH_DELAY_MS);
    },
    foregroundChanged(active: boolean) {
      if (active) void syncNow();
      else stopWatching();
    },
    async accountChanged() {
      const who = await d.signedIn();
      if (who && halted && who.uid !== halted) halted = null;
      if (!who) stopWatching();
      await syncNow();
    },
    /** A wipe ("Delete all my data"): read the tracking state again (it's gone now). */
    storeReset() {
      d.tracking.reset();
      stopWatching();
      engine = null;
      connUid = null;
      signedUid = null;
      setStatus({ kind: 'off' });
    },

    /** "Use the account's" (A5): this phone's rows go before the account's come down. Kept until the join runs. */
    async setJoinMode(mode: JoinMode): Promise<void> {
      if (mode === 'replace') await d.store.setKv(JOIN_MODE_KEY, 'replace');
      else await d.store.deleteKv(JOIN_MODE_KEY);
    },

    /** The restore (A4): the account's rows onto this phone now. Photos follow in the background. */
    async joinNow(): Promise<JoinResult> {
      await syncNow();
      if (!signedUid) return 'off';
      if ((await d.tracking.uid()) !== signedUid) return lastError === 'failed' ? 'failed' : 'offline';
      return lastError ?? 'ok';
    },

    /** What an account holds, for A4 and A5 (null when it can't be read: treated as empty). */
    async holdings(uid: string): Promise<Holdings | null> {
      if (!d.allowed()) return null;
      try {
        const c = await d.connect(uid);
        return c?.remote.holdings ? await c.remote.holdings() : null;
      } catch (err: unknown) {
        log(`holdings: ${(err as Error).message}`);
        return null;
      }
    },

    /** "Delete account and all data", first step: the server copy. Nothing on the phone changes here. 'none' when this
     *  phone isn't signed in to a real account. After 'ok' nothing more is sent for that account. */
    async deleteServerCopy(): Promise<'ok' | 'failed' | 'offline' | 'none'> {
      const who = d.allowed() ? await d.signedIn() : null;
      if (!who) return 'none';
      if (timer !== null) d.scheduler.clearTimer(timer);
      timer = null;
      halted = who.uid;
      if (running) await running;
      const r = await d.deleteServer();
      if (r !== 'ok') {
        halted = null;
        return r;
      }
      stopWatching();
      log('account deleted on the server');
      return 'ok';
    },

    /** "Delete all photos" while backed up (B15): the backup's copies go too. */
    async forgetPhotos(): Promise<void> {
      if (!engine || !signedUid) return;
      try {
        const n = await engine.removeAllFiles();
        log(`removing ${n} backed-up photos`);
      } catch (err: unknown) {
        log(`forget photos: ${(err as Error).message}`);
      }
      void syncNow();
    },

    status: () => status,
    subscribe(cb: () => void): () => void {
      subs.add(cb);
      return () => {
        subs.delete(cb);
      };
    },
  };
}

export type Backup = ReturnType<typeof createBackup>;

/** Row counts for A4's line while rows land ("214 fits · 38 pieces · 61 chats"). */
export async function localHoldings(store: Pick<KittedStore, 'fitChecks' | 'closet' | 'chat'>): Promise<Holdings> {
  const fits = (await store.fitChecks.all()).filter((c) => c.status === 'scored' && c.parentId === null).length;
  return { fits, pieces: (await store.closet.all()).length, chats: (await store.chat.all()).length };
}

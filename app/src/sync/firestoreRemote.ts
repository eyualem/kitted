// The sync engine's server on Firestore (handoff/11-firestore-schema.md §11, #386): one person's folder users/{uid}.
// The SDK comes in as an argument (`fs`), so this file runs on the phone (the app's `firebase` package), in Jest, and
// against the emulators from firebase/tests (their own copy of the SDK, the app's "@/" alias mapped there).
//
// - A push is one batch of `set(…, { merge: true })`: `data` merges field by field, so a field from a newer app
//   survives an older phone's write (E9); a tombstone drops `data` (deleteField); serverAt is the server's clock.
// - Reads go FromServer and every call has a time limit: the SDK would otherwise answer from its empty cache or hold
//   a write until the connection returns. A timeout is "offline" (nothing marked sent; the next push sends it again).
// - serverAt is handed to the engine in microseconds, Firestore's own precision, so a cursor inside a 400-doc batch
//   that shares one serverAt resumes exactly (X4).
import type * as FS from 'firebase/firestore';
import { RemoteRefused, RemoteUnavailable, type RemoteStore } from './remote';
import type { Cursor, RemoteWrite, StoredDoc } from './types';

/** The parts of firebase/firestore this file uses (the app's copy or the tests'). */
export type FirestoreSdk = Pick<
  typeof FS,
  | 'collection' | 'deleteField' | 'doc' | 'documentId' | 'getCountFromServer' | 'getDocFromServer' | 'getDocsFromServer'
  | 'limit' | 'onSnapshot' | 'orderBy' | 'query' | 'serverTimestamp' | 'setDoc' | 'startAfter' | 'Timestamp' | 'updateDoc'
  | 'where' | 'writeBatch'
>;

export interface FirestoreRemoteOptions {
  fs: FirestoreSdk;
  db: FS.Firestore;
  uid: string;
  /** Per call (default 20 s). */
  timeoutMs?: number;
}

/** What an account holds (A4's counts, A5's question): his scored fits (not re-checks), closet pieces, chat lines. */
export interface Holdings {
  fits: number;
  pieces: number;
  chats: number;
}

export interface AccountTouch {
  deviceId: string;
  appVersion: string;
  /** The sync schema version (the account doc's `v`). */
  v: number;
}

export interface FirestoreRemote extends RemoteStore {
  holdings(): Promise<Holdings>;
  /** The account doc's lastActiveAt (purgeInactive reads it) and this phone's devices doc. */
  touch(t: AccountTouch): Promise<void>;
  /** A live listener on one collection after the cursor; returns the stop. Docs this phone is still writing are left
   *  out (they come back confirmed, and the engine skips its own echo). */
  watch(coll: string, cursor: Cursor | null, onDocs: (docs: StoredDoc[]) => void, onError?: (e: Error) => void): () => void;
}

const DEFAULT_TIMEOUT_MS = 20_000;
const OFFLINE_CODES = new Set(['unavailable', 'deadline-exceeded', 'unauthenticated', 'cancelled', 'resource-exhausted', 'aborted', 'internal']);

/** A Firestore error as the engine's: a rule's no is RemoteRefused, anything about the connection RemoteUnavailable. */
export function mapError(e: unknown): Error {
  const code = String((e as { code?: string })?.code ?? '');
  if (code === 'permission-denied') return new RemoteRefused((e as Error).message);
  if (OFFLINE_CODES.has(code) || /offline|network/i.test(String((e as Error)?.message ?? ''))) return new RemoteUnavailable(code || 'offline');
  return e instanceof Error ? e : new Error(String(e));
}

type TimestampLike = { seconds: number; nanoseconds: number };
export const toMicros = (t: TimestampLike) => t.seconds * 1_000_000 + Math.floor(t.nanoseconds / 1000);

export function createFirestoreRemote(o: FirestoreRemoteOptions): FirestoreRemote {
  const { fs, db, uid } = o;
  const timeoutMs = o.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fromMicros = (us: number) => new fs.Timestamp(Math.floor(us / 1_000_000), (us % 1_000_000) * 1000);
  const ref = (coll: string, id: string) => fs.doc(db, 'users', uid, coll, id);
  const coll = (c: string) => fs.collection(db, 'users', uid, c);

  async function timed<T>(p: Promise<T>): Promise<T> {
    let h: ReturnType<typeof setTimeout> | null = null;
    const limit = new Promise<never>((_, reject) => {
      h = setTimeout(() => reject(new RemoteUnavailable('timeout')), timeoutMs);
    });
    try {
      return await Promise.race([p, limit]);
    } catch (e: unknown) {
      throw e instanceof RemoteUnavailable || e instanceof RemoteRefused ? e : mapError(e);
    } finally {
      if (h) clearTimeout(h);
      // A held write that the timeout gave up on may still fail later; it's the same write, so its error is noise.
      p.catch(() => undefined);
    }
  }

  /** A stored doc as the engine reads it, or null while its serverAt isn't known yet (a write still on its way). */
  function toStored(id: string, d: FS.DocumentData | undefined): StoredDoc | null {
    if (!d || !d.serverAt || typeof d.serverAt.seconds !== 'number') return null;
    const out: StoredDoc = {
      id, v: Number(d.v), updatedAt: Number(d.updatedAt), deleted: d.deleted === true, by: String(d.by ?? ''), serverAt: toMicros(d.serverAt as TimestampLike),
    };
    if (!out.deleted && d.data && typeof d.data === 'object') out.data = d.data as Record<string, unknown>;
    return out;
  }

  const changesQuery = (c: string, cursor: Cursor | null, max?: number) => {
    const parts: FS.QueryConstraint[] = [fs.orderBy('serverAt'), fs.orderBy(fs.documentId())];
    if (cursor) parts.push(fs.startAfter(fromMicros(cursor.at), cursor.id));
    if (max !== undefined) parts.push(fs.limit(max));
    return fs.query(coll(c), ...parts);
  };

  return {
    async commit(writes: readonly RemoteWrite[]) {
      if (writes.length === 0) return;
      const batch = fs.writeBatch(db);
      for (const w of writes) {
        const { data, ...envelope } = w.doc;
        const body: Record<string, unknown> = { ...envelope, serverAt: fs.serverTimestamp(), data: w.doc.deleted ? fs.deleteField() : data };
        batch.set(ref(w.coll, w.doc.id), body, { merge: true });
      }
      await timed(batch.commit());
    },

    async get(c, id) {
      const snap = await timed(fs.getDocFromServer(ref(c, id)));
      return snap.exists() ? toStored(id, snap.data()) : null;
    },

    async changesSince(c, cursor, max) {
      const snap = await timed(fs.getDocsFromServer(changesQuery(c, cursor, max)));
      const out: StoredDoc[] = [];
      for (const d of snap.docs) {
        const s = toStored(d.id, d.data());
        if (s) out.push(s);
      }
      return out;
    },

    async holdings() {
      const live = (c: string) => fs.query(coll(c), fs.where('deleted', '==', false));
      // Fits exactly (A5 says "has 214 fits"): re-checks and unscored checks aren't fits. Reads each fit check once.
      const checks = await timed(fs.getDocsFromServer(live('fitChecks')));
      let fits = 0;
      for (const d of checks.docs) {
        const data = (d.data().data ?? {}) as Record<string, unknown>;
        if (data.status === 'scored' && (data.parentId === null || data.parentId === undefined)) fits += 1;
      }
      const [pieces, chats] = await Promise.all([
        timed(fs.getCountFromServer(live('closetItems'))),
        timed(fs.getCountFromServer(live('chatMessages'))),
      ]);
      return { fits, pieces: pieces.data().count, chats: chats.data().count };
    },

    async touch(t) {
      const now = fs.serverTimestamp();
      const account = fs.doc(db, 'users', uid);
      const snap = await timed(fs.getDocFromServer(account));
      if (snap.exists()) await timed(fs.updateDoc(account, { lastActiveAt: now, v: t.v, appVersion: t.appVersion }));
      else await timed(fs.setDoc(account, { createdAt: now, lastActiveAt: now, v: t.v, appVersion: t.appVersion }));
      const device = fs.doc(db, 'users', uid, 'devices', t.deviceId);
      const had = await timed(fs.getDocFromServer(device));
      const body: Record<string, unknown> = { platform: 'ios', appVersion: t.appVersion, lastSyncAt: now };
      if (!had.exists()) body.createdAt = now;
      await timed(fs.setDoc(device, body, { merge: true }));
    },

    watch(c, cursor, onDocs, onError) {
      return fs.onSnapshot(
        changesQuery(c, cursor),
        (snap) => {
          const docs: StoredDoc[] = [];
          for (const ch of snap.docChanges()) {
            if (ch.type === 'removed' || ch.doc.metadata.hasPendingWrites) continue;
            const s = toStored(ch.doc.id, ch.doc.data());
            if (s) docs.push(s);
          }
          if (docs.length > 0) onDocs(docs);
        },
        (e) => onError?.(mapError(e)),
      );
    },
  };
}

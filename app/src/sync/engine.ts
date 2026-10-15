// The sync engine (handoff/11-firestore-schema.md §4; checks E1–E14). The phone's SQLite stays the real copy: the engine
// pushes what the tracker marked changed, pulls what his other phones changed, and keeps whichever edit is newer, per
// row. It writes to the inner (untracked) store, so nothing it applies is pushed back.
import type { KittedStore } from '@/data/store';
import type { Table } from '@/data/tables';
import { dataToRow, rowKey, rowToData } from './codec';
import { MAX_BATCH, RemoteRefused, RemoteUnavailable, type FileTransport, type RemoteStore } from './remote';
import {
  KV_SYNCED, PREFS_COLLECTION, SYNCED_COLLECTIONS, SYNCED_TABLES, SYNC_SCHEMA_VERSION, fileRefs, isSyncedKv, kvPolicy, tableForCollection,
  tablePolicy, type SyncedTable,
} from './schema';
import { syncRowId } from './tracker';
import type { Cursor, RemoteDoc, RemoteWrite, StoredDoc, SyncFile, SyncRow } from './types';

export interface SyncEngineOptions {
  /** The inner store (not the tracked one). */
  store: KittedStore;
  remote: RemoteStore;
  files?: FileTransport;
  deviceId: string;
  nowMs(): number;
  /** Signed in, sync on, not a demo build (E13). */
  enabled(): boolean;
  /** "Back up photos" (E3 in 08 §8, on by default). */
  backUpPhotos?(): boolean;
}

export interface PushResult {
  sent: number;
  batches: number;
  /** Docs the server refused that weren't stale (a bug: logged, not retried forever). */
  refused: number;
  /** Docs refused as stale: the newer server copy was pulled instead. */
  lost: number;
}

const CURSOR_KV = (coll: string) => `sync.cursor.${coll}`;
const PULL_PAGE = 500;
const MAX_FILE_TRIES = 8;

const isDirty = (r: SyncRow) => r.pushedAt === null || r.localAt > r.pushedAt;
/** Does the remote doc win over this phone's change? Newer wins; a tie goes to the higher device id, the same answer on
 *  both phones (E3). */
export function remoteWins(remote: { updatedAt: number; by: string }, local: SyncRow | null): boolean {
  if (!local) return true;
  if (remote.updatedAt !== local.localAt) return remote.updatedAt > local.localAt;
  return remote.by > local.by;
}

export class SyncDisabled extends Error {
  constructor() {
    super('sync is off');
    this.name = 'SyncDisabled';
  }
}

export function createSyncEngine(o: SyncEngineOptions) {
  const { store, remote } = o;
  const backUp = () => o.backUpPhotos?.() ?? true;
  const guard = () => {
    if (!o.enabled()) throw new SyncDisabled();
  };
  const table = <T>(n: SyncedTable) => store[n] as unknown as Table<T>;

  // ---- building docs ----

  async function currentData(r: SyncRow): Promise<Record<string, unknown> | null> {
    if (r.coll === PREFS_COLLECTION) {
      const value = await store.getKv(r.rowKey);
      if (value === null || !isSyncedKv(r.rowKey)) return null;
      const out = KV_SYNCED[r.rowKey]!.outgoing;
      return { key: r.rowKey, value: out ? out(value) : value };
    }
    const n = tableForCollection(r.coll);
    if (!n) return null;
    const row = await table<object>(n).get(r.rowKey);
    return row ? rowToData(n, row) : null;
  }

  function envelope(r: SyncRow, data: Record<string, unknown> | null): RemoteDoc {
    const doc: RemoteDoc = { id: r.rowKey, v: SYNC_SCHEMA_VERSION, updatedAt: r.localAt, deleted: data === null, by: r.by };
    if (data) doc.data = data;
    return doc;
  }

  // ---- files ----

  async function queueFile(path: string, op: SyncFile['op']) {
    if (!o.files) return;
    if (op === 'up' && !backUp()) return;
    const prev = await store.syncFiles.get(path);
    if (prev && prev.op === op) return;
    await store.syncFiles.put({ path, op, tries: 0, nextAt: 0, queuedAt: o.nowMs() });
  }

  /** Files no remaining row points at (so a removed check doesn't delete a photo another row still shows). */
  async function stillReferenced(paths: string[], except: string): Promise<Set<string>> {
    const want = new Set(paths);
    const used = new Set<string>();
    for (const r of await store.syncRows.all()) {
      if (r.id === except || r.deleted) continue;
      for (const f of r.files) if (want.has(f)) used.add(f);
    }
    return used;
  }

  /** After a row reached the server: files it newly points at go up; files it no longer points at (or all of them,
   *  for a delete) are removed remotely unless another row still uses them. */
  async function afterPushed(r: SyncRow, data: Record<string, unknown> | null) {
    const files = data ? fileRefs(data) : [];
    for (const f of files) if (!r.files.includes(f)) await queueFile(f, 'up');
    const dropped = r.files.filter((f) => !files.includes(f));
    if (dropped.length > 0) {
      const used = await stillReferenced(dropped, r.id);
      for (const f of dropped) if (!used.has(f)) await queueFile(f, 'gone');
    }
    await markPushed(r, files);
  }

  /** Records that r's change reached the server. A change made while it was on its way keeps the row dirty. */
  async function markPushed(r: SyncRow, files: string[]) {
    const now = (await store.syncRows.get(r.id)) ?? r;
    await store.syncRows.put({ ...now, pushedAt: r.localAt, files });
  }

  // ---- applying a remote doc ----

  async function apply(coll: string, d: StoredDoc): Promise<boolean> {
    const id = syncRowId(coll, d.id);
    const local = await store.syncRows.get(id);
    if (!remoteWins(d, local)) return false;
    let files: string[] = [];
    if (coll === PREFS_COLLECTION) {
      const key = d.id;
      if (!isSyncedKv(key)) return false;
      if (d.deleted || !d.data) await store.deleteKv(key);
      else {
        const p = kvPolicy(key);
        const remoteValue = String(d.data.value ?? '');
        const value = p && p !== 'local' && p.incoming ? p.incoming(remoteValue, await store.getKv(key)) : remoteValue;
        await store.setKv(key, value);
        files = fileRefs(value);
      }
    } else {
      const n = tableForCollection(coll);
      if (!n) return false;
      const t = table<object>(n);
      if (d.deleted || !d.data) await t.delete(d.id);
      else {
        let row: object;
        try {
          row = dataToRow<object>(n, d.data, await t.get(d.id));
        } catch (e: unknown) {
          console.warn(`[sync] skipped a damaged doc ${coll}/${d.id}`, e);
          return false;
        }
        if (rowKey(n, row) !== d.id) return false;
        await t.put(row);
        files = fileRefs(row);
      }
    }
    for (const f of files) if (o.files && !o.files.exists(f)) await queueFile(f, 'down');
    // Deleted (or no longer pointed at) on his other phone: this phone's copy goes too, unless another row still uses it.
    const dropped = (local?.files ?? []).filter((f) => !files.includes(f));
    if (o.files && dropped.length > 0) {
      const used = await stillReferenced(dropped, id);
      for (const f of dropped) if (!used.has(f)) o.files.removeLocal(f);
    }
    await store.syncRows.put({ id, coll, rowKey: d.id, localAt: d.updatedAt, pushedAt: d.updatedAt, deleted: d.deleted, by: d.by, files });
    return true;
  }

  // ---- the public steps ----

  return {
    /** First sign-in on this phone: every synced row and key counts as changed, once (E8). */
    async markAllDirty(): Promise<number> {
      guard();
      let n = 0;
      const now = o.nowMs();
      const mark = async (coll: string, key: string) => {
        const id = syncRowId(coll, key);
        const prev = await store.syncRows.get(id);
        const localAt = Math.max(now, (prev?.localAt ?? 0) + 1);
        await store.syncRows.put({ id, coll, rowKey: key, localAt, pushedAt: prev?.pushedAt ?? null, deleted: false, by: o.deviceId, files: prev?.files ?? [] });
        n += 1;
      };
      for (const name of SYNCED_TABLES) {
        for (const row of await table<object>(name).all()) await mark(tablePolicy(name).collection, rowKey(name, row));
      }
      for (const key of Object.keys(KV_SYNCED)) if ((await store.getKv(key)) !== null) await mark(PREFS_COLLECTION, key);
      return n;
    },

    /** Everything changed here goes up, in batches of ≤ 400 (E1, E7). Offline: nothing is marked sent (E10). */
    async push(): Promise<PushResult> {
      guard();
      const dirty = (await store.syncRows.all()).filter(isDirty).sort((a, b) => a.localAt - b.localAt || (a.id < b.id ? -1 : 1));
      const result: PushResult = { sent: 0, batches: 0, refused: 0, lost: 0 };
      for (let i = 0; i < dirty.length; i += MAX_BATCH) {
        const chunk = dirty.slice(i, i + MAX_BATCH);
        const built = await Promise.all(chunk.map(async (r) => ({ r, data: await currentData(r) })));
        const writes: RemoteWrite[] = built.map(({ r, data }) => ({ coll: r.coll, doc: envelope(r, data) }));
        try {
          await remote.commit(writes);
          result.batches += 1;
          result.sent += writes.length;
          for (const b of built) await afterPushed(b.r, b.data);
        } catch (e: unknown) {
          if (!(e instanceof RemoteRefused)) throw e;
          // One bad or stale doc fails the batch: send them one at a time (E6).
          for (let k = 0; k < built.length; k += 1) {
            const b = built[k]!;
            try {
              await remote.commit([writes[k]!]);
              result.batches += 1;
              result.sent += 1;
              await afterPushed(b.r, b.data);
            } catch (e2: unknown) {
              if (!(e2 instanceof RemoteRefused)) throw e2;
              const newer = await remote.get(b.r.coll, b.r.rowKey);
              if (newer && newer.updatedAt > b.r.localAt) {
                result.lost += 1;
                await apply(b.r.coll, newer);
              } else {
                result.refused += 1;
                console.warn(`[sync] refused ${b.r.id}`, e2);
                await markPushed(b.r, b.r.files);
              }
            }
          }
        }
      }
      return result;
    },

    /** Applies what changed on the server since the last pull, collection by collection (E2, E3, E5). */
    async pull(): Promise<{ applied: number }> {
      guard();
      let applied = 0;
      for (const coll of SYNCED_COLLECTIONS) {
        let cursor = parseCursor(await store.getKv(CURSOR_KV(coll)));
        for (;;) {
          const page = await remote.changesSince(coll, cursor, PULL_PAGE);
          for (const d of page) if (await apply(coll, d)) applied += 1;
          const last = page[page.length - 1];
          if (last) {
            cursor = { at: last.serverAt, id: last.id };
            await store.setKv(CURSOR_KV(coll), JSON.stringify(cursor));
          }
          if (page.length < PULL_PAGE) break;
        }
      }
      return { applied };
    },

    /** A live listener's docs (the Firestore adapter calls this with each snapshot's changes). */
    async applyRemote(coll: string, docs: readonly StoredDoc[]): Promise<number> {
      guard();
      let n = 0;
      for (const d of docs) if (await apply(coll, d)) n += 1;
      return n;
    },

    /** Pull first (fewer stale writes), then push. */
    async syncNow(): Promise<{ applied: number } & PushResult> {
      const pulled = await this.pull();
      const pushed = await this.push();
      return { ...pulled, ...pushed };
    },

    /** Moves queued files while the transport allows it (Wi-Fi first), with backoff; a file that keeps failing is
     *  dropped after 8 tries and logged (E12). */
    async drainFiles(): Promise<{ moved: number; failed: number }> {
      guard();
      const t = o.files;
      if (!t) return { moved: 0, failed: 0 };
      let moved = 0;
      let failed = 0;
      const now = o.nowMs();
      const queue = (await store.syncFiles.all()).filter((f) => f.nextAt <= now).sort((a, b) => a.queuedAt - b.queuedAt);
      for (const f of queue) {
        if (!t.canTransfer()) break;
        try {
          if (f.op === 'up') {
            if (t.exists(f.path)) await t.upload(f.path);
          } else if (f.op === 'down') {
            if (!t.exists(f.path)) await t.download(f.path);
          } else await t.remove(f.path);
          await store.syncFiles.delete(f.path);
          moved += 1;
        } catch (e: unknown) {
          if (e instanceof RemoteUnavailable) break;
          failed += 1;
          if (f.tries + 1 >= MAX_FILE_TRIES) {
            console.warn(`[sync] gave up on ${f.op} ${f.path}`, e);
            await store.syncFiles.delete(f.path);
          } else {
            await store.syncFiles.put({ ...f, tries: f.tries + 1, nextAt: now + 2 ** f.tries * 30_000 });
          }
        }
      }
      return { moved, failed };
    },

    /** How many changes are waiting to go up (the "Backed up · just now" line). */
    async pending(): Promise<number> {
      return (await store.syncRows.all()).filter(isDirty).length;
    },
  };
}

export type SyncEngine = ReturnType<typeof createSyncEngine>;

function parseCursor(raw: string | null): Cursor | null {
  if (!raw) return null;
  try {
    const c = JSON.parse(raw) as Cursor;
    return typeof c.at === 'number' && typeof c.id === 'string' ? c : null;
  } catch {
    return null;
  }
}

// The store wrapper that records what changed (handoff/11-firestore-schema.md §4). The app writes through it; the sync
// engine writes around it (to the inner store), so a change pulled from his other phone is never pushed back.
// Off (signed out, demo, web) it records nothing and behaves exactly like the inner store.
import type { KittedStore } from '@/data/store';
import type { Table, TableName } from '@/data/tables';
import { rowKey } from './codec';
import { PREFS_COLLECTION, TABLE_POLICY, isSyncedKv, tablePolicy, type SyncedTable } from './schema';
import type { SyncRow } from './types';

export interface TrackerOptions {
  /** Whether changes are recorded now (an account has synced on this phone). The app's answer is read from the store once, so
   *  it may be a promise. */
  isOn(): boolean | Promise<boolean>;
  nowMs(): number;
  /** This phone's id (the tie-break), or how to read it once it's known. */
  deviceId: string | (() => string);
  /** After a change was recorded (the backup schedules its push). */
  onRecorded?(): void;
}

const deviceOf = (o: TrackerOptions) => (typeof o.deviceId === 'function' ? o.deviceId() : o.deviceId);

export const syncRowId = (coll: string, key: string) => `${coll}/${key}`;

/** Marks one row (or kv key) changed. localAt strictly increases per row, so two changes in the same millisecond are
 *  never mistaken for one already pushed. */
export async function recordChange(inner: KittedStore, coll: string, key: string, deleted: boolean, nowMs: number, deviceId: string): Promise<void> {
  const id = syncRowId(coll, key);
  const prev = await inner.syncRows.get(id);
  const localAt = Math.max(nowMs, (prev?.localAt ?? 0) + 1);
  const row: SyncRow = {
    id, coll, rowKey: key, localAt, pushedAt: prev?.pushedAt ?? null, deleted, by: deviceId, files: prev?.files ?? [],
  };
  await inner.syncRows.put(row);
}

function trackedTable<T>(inner: KittedStore, name: SyncedTable, opts: TrackerOptions): Table<T> {
  const t = inner[name] as unknown as Table<T>;
  const coll = tablePolicy(name).collection;
  const record = async (key: string, deleted: boolean) => {
    if (!(await opts.isOn())) return;
    await recordChange(inner, coll, key, deleted, opts.nowMs(), deviceOf(opts));
    opts.onRecorded?.();
  };
  return {
    get: (key) => t.get(key),
    all: () => t.all(),
    async put(row) {
      const out = await t.put(row);
      await record(rowKey(name, row as object), false);
      return out;
    },
    async patch(key, patch) {
      const out = await t.patch(key, patch);
      if (out) await record(key, false);
      return out;
    },
    async delete(key) {
      await t.delete(key);
      await record(key, true);
    },
  };
}

export function trackChanges(inner: KittedStore, opts: TrackerOptions): KittedStore {
  const tables: Partial<Record<TableName, unknown>> = {};
  for (const n of Object.keys(TABLE_POLICY) as TableName[]) {
    tables[n] = TABLE_POLICY[n] === 'local' ? inner[n] : trackedTable(inner, n as SyncedTable, opts);
  }
  const recordKv = async (key: string, deleted: boolean) => {
    if (!isSyncedKv(key) || !(await opts.isOn())) return;
    await recordChange(inner, PREFS_COLLECTION, key, deleted, opts.nowMs(), deviceOf(opts));
    opts.onRecorded?.();
  };
  return {
    ...(tables as unknown as KittedStore),
    init: () => inner.init(),
    schemaVersion: () => inner.schemaVersion(),
    getKv: (key) => inner.getKv(key),
    async setKv(key, value) {
      await inner.setKv(key, value);
      await recordKv(key, false);
    },
    async deleteKv(key) {
      await inner.deleteKv(key);
      await recordKv(key, true);
    },
    // "Delete all my data" clears the sync bookkeeping too, so nothing is pushed afterwards (E14). Deleting the server
    // copy is the account deletion's job (functions deleteAccount), run before this.
    wipe: () => inner.wipe(),
  };
}

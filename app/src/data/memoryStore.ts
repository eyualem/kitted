// In-memory KittedStore: the web preview's store and the one Jest tests use.
// Rows are deep-copied in and out (JSON round trip), like a real database, so callers can't
// mutate stored data by accident.
import { emitChange } from './changes';
import { LATEST_VERSION } from './migrations';
import { SPECS, type Table, type TableName, type Tables, type TableSpec } from './tables';
import type { KittedStore } from './store';

const copy = <T>(v: T): T => (v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T));

function memoryTable<T>(name: TableName, spec: TableSpec<T>): Table<T> & { clear(): void } {
  const rows = new Map<string, T>();
  const keyOf = (row: T) => String((row as Record<string, unknown>)[spec.key]);
  return {
    async get(key) {
      const r = rows.get(key);
      return r === undefined ? null : copy(r);
    },
    async all() {
      return Array.from(rows.values(), copy);
    },
    async put(row) {
      rows.set(keyOf(row), copy(row));
      emitChange(name, keyOf(row));
      return copy(row);
    },
    async patch(key, patch) {
      const cur = rows.get(key);
      if (cur === undefined) return null;
      const next = { ...cur, ...copy(patch) };
      rows.set(key, next);
      emitChange(name, key);
      return copy(next);
    },
    async delete(key) {
      rows.delete(key);
      emitChange(name, key);
    },
    clear() {
      rows.clear();
    },
  };
}

export function createMemoryStore(): KittedStore {
  const kv = new Map<string, string>();
  const tables = Object.fromEntries(
    (Object.keys(SPECS) as TableName[]).map((n) => [n, memoryTable(n, SPECS[n] as TableSpec<unknown>)]),
  ) as unknown as Tables & Record<TableName, { clear(): void }>;
  return {
    ...tables,
    async init() {},
    async schemaVersion() {
      return LATEST_VERSION;
    },
    async getKv(key) {
      return kv.get(key) ?? null;
    },
    async setKv(key, value) {
      kv.set(key, value);
      emitChange('kv', key);
    },
    async deleteKv(key) {
      kv.delete(key);
      emitChange('kv', key);
    },
    async wipe() {
      kv.clear();
      for (const n of Object.keys(SPECS) as TableName[]) {
        tables[n].clear();
        emitChange(n);
      }
      emitChange('kv');
    },
  };
}

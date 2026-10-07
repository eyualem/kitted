// SQLite KittedStore (iOS, Android). Tables come from the specs in tables.ts; JSON columns are
// TEXT, booleans 0/1. Migrations run once before the first read (PRAGMA user_version).
import * as SQLite from 'expo-sqlite';
import { emitChange } from './changes';
import { LATEST_VERSION, TABLES, pendingMigrations } from './migrations';
import { SPECS, colName, colType, decode, encode, type Table, type TableName, type Tables, type TableSpec } from './tables';
import type { KittedStore } from './store';

const DB_NAME = 'kitted.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  for (const m of pendingMigrations(current)) {
    await db.withExclusiveTransactionAsync(async (txn) => {
      for (const sql of m.statements) await txn.execAsync(sql);
      // PRAGMA can't take bound parameters; the version is a number from our own table.
      await txn.execAsync(`PRAGMA user_version = ${Math.trunc(m.version)}`);
    });
  }
  return db;
}

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = open().catch((e: unknown) => {
      dbPromise = null;
      throw e;
    });
  }
  return dbPromise;
}

type SqlValue = string | number | null;

function sqliteTable<T>(name: TableName, spec: TableSpec<T>): Table<T> {
  const fields = Object.entries(spec.fields) as [string, Parameters<typeof colType>[0]][];
  const cols = fields.map(([f, s]) => colName(f, s));
  const keySpec = (spec.fields as Record<string, Parameters<typeof colType>[0]>)[spec.key]!;
  const keyCol = colName(spec.key, keySpec);
  const insert = `INSERT OR REPLACE INTO ${spec.table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`;

  const fromRow = (r: Record<string, unknown>): T => {
    const out: Record<string, unknown> = {};
    for (const [f, s] of fields) out[f] = decode(colType(s), r[colName(f, s)]);
    return out as T;
  };
  const toValues = (row: T): SqlValue[] =>
    fields.map(([f, s]) => encode(colType(s), (row as Record<string, unknown>)[f]));

  const table: Table<T> = {
    async get(key) {
      const db = await getDb();
      const r = await db.getFirstAsync<Record<string, unknown>>(`SELECT * FROM ${spec.table} WHERE ${keyCol} = ?`, key);
      return r ? fromRow(r) : null;
    },
    async all() {
      const db = await getDb();
      const rows = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${spec.table}`);
      return rows.map(fromRow);
    },
    async put(row) {
      const db = await getDb();
      await db.runAsync(insert, toValues(row));
      emitChange(name, String((row as Record<string, unknown>)[spec.key]));
      return row;
    },
    async patch(key, patch) {
      const cur = await table.get(key);
      if (!cur) return null;
      const next = { ...cur, ...patch };
      await table.put(next);
      return next;
    },
    async delete(key) {
      const db = await getDb();
      await db.runAsync(`DELETE FROM ${spec.table} WHERE ${keyCol} = ?`, key);
      emitChange(name, key);
    },
  };
  return table;
}

const tables = Object.fromEntries(
  (Object.keys(SPECS) as TableName[]).map((n) => [n, sqliteTable(n, SPECS[n] as TableSpec<unknown>)]),
) as unknown as Tables;

export const store: KittedStore = {
  ...tables,
  async init() {
    await getDb();
  },
  async schemaVersion() {
    const db = await getDb();
    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    return row?.user_version ?? 0;
  },
  async getKv(key) {
    const db = await getDb();
    const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM kv WHERE key = ?', key);
    return row ? row.value : null;
  },
  async setKv(key, value) {
    const db = await getDb();
    await db.runAsync('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)', key, value);
    emitChange('kv', key);
  },
  async deleteKv(key) {
    const db = await getDb();
    await db.runAsync('DELETE FROM kv WHERE key = ?', key);
    emitChange('kv', key);
  },
  async wipe() {
    const db = await getDb();
    await db.withExclusiveTransactionAsync(async (txn) => {
      for (const t of TABLES) await txn.execAsync(`DELETE FROM ${t}`);
    });
    for (const n of Object.keys(SPECS) as TableName[]) emitChange(n);
    emitChange('kv');
  },
};

export { LATEST_VERSION };

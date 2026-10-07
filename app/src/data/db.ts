import * as SQLite from 'expo-sqlite';
import { LATEST_VERSION, TABLES, pendingMigrations } from './migrations';
import type { KittedStore } from './store';

const DB_NAME = 'kitted.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME, { enableChangeListener: true });
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

export const store: KittedStore = {
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
  },
  async deleteKv(key) {
    const db = await getDb();
    await db.runAsync('DELETE FROM kv WHERE key = ?', key);
  },
  async wipe() {
    const db = await getDb();
    await db.withExclusiveTransactionAsync(async (txn) => {
      for (const t of TABLES) await txn.execAsync(`DELETE FROM ${t}`);
    });
  },
};

export { LATEST_VERSION };

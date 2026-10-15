// A row ↔ a server document's `data` (handoff/11-firestore-schema.md §2.2). Field names are the row's own (camelCase);
// JSON columns stay JSON text, exactly as SQLite keeps them (Firestore can't hold an array inside an array, and the
// server never reads inside them); booleans are booleans; fields in the table's `omit` list are never sent.
import { SPECS, colType, decode, type TableName } from '@/data/tables';
import { tablePolicy, type SyncedTable } from './schema';

type FieldSpec = Parameters<typeof colType>[0];

function fieldsOf(table: TableName): [string, FieldSpec][] {
  return Object.entries(SPECS[table].fields as Record<string, FieldSpec>);
}

/** The row as a document's `data`. */
export function rowToData(table: SyncedTable, row: object): Record<string, unknown> {
  const omit = tablePolicy(table).omit ?? {};
  const r = row as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [field, spec] of fieldsOf(table)) {
    if (field in omit) continue;
    const v = r[field];
    if (v === undefined || v === null) {
      out[field] = null;
      continue;
    }
    switch (colType(spec)) {
      case 'json':
        out[field] = JSON.stringify(v);
        break;
      case 'bool':
        out[field] = Boolean(v);
        break;
      case 'int':
      case 'real':
        out[field] = typeof v === 'number' ? v : Number(v);
        break;
      default:
        out[field] = String(v);
    }
  }
  return out;
}

/** A document's `data` as a row. Fields the server doesn't have (never sent, or from an older app) come from this
 *  phone's copy when there is one, else the omit default, else null. Fields this app doesn't know are dropped here
 *  (the server keeps them: pushes merge). Throws on a damaged JSON field, like a damaged SQLite row. */
export function dataToRow<T>(table: SyncedTable, data: Record<string, unknown>, local: T | null): T {
  const omit = tablePolicy(table).omit ?? {};
  const base = (local ?? {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [field, spec] of fieldsOf(table)) {
    if (field in omit) {
      out[field] = field in base ? base[field] : omit[field];
      continue;
    }
    if (!(field in data)) {
      out[field] = field in base ? base[field] : null;
      continue;
    }
    out[field] = decode(colType(spec), data[field]);
  }
  return out as T;
}

/** The row's key (its document id). */
export function rowKey(table: TableName, row: object): string {
  return String((row as Record<string, unknown>)[SPECS[table].key]);
}

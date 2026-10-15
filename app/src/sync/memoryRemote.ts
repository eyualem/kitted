// An in-memory stand-in for one person's Firestore folder and Storage folder, for tests. It enforces the same checks as
// firebase/firestore.rules (envelope, collections, newest wins, readings never change, 48 fields, the 1-day clock bound)
// and storage.rules (folders, names), and merges `data` the way the Firestore adapter will (set with merge), so the
// engine's tests exercise the real rules' consequences. Keep it in step with the rules files.
import { MAX_BATCH, RemoteRefused, RemoteUnavailable, type FileTransport, type RemoteStore } from './remote';
import { SYNCED_COLLECTIONS, syncedFilePath } from './schema';
import type { Cursor, RemoteDoc, RemoteWrite, StoredDoc } from './types';

const ENVELOPE = ['id', 'v', 'updatedAt', 'deleted', 'by', 'data'];
const DAY_MS = 86_400_000;
const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export interface MemoryRemote extends RemoteStore {
  /** Every stored doc of a collection (tests). */
  docs(coll: string): StoredDoc[];
  /** Files in the Storage folder (tests). */
  files: Map<string, string>;
  offline: boolean;
  /** Commits made (tests count writes: cost). */
  commits: number;
  writes: number;
  /** The server clock (ms); every commit gets one time, like request.time. */
  clock: { now: number };
  /** A file transport for one phone: `local` is that phone's Documents (path → contents). */
  transport(local: Map<string, string>, opts?: { canTransfer?: () => boolean }): FileTransport;
}

/** Why a doc would be refused, or null. Mirrors firestore.rules validEnvelope / notStale / immutableIfReading. */
export function ruleProblem(coll: string, doc: RemoteDoc, stored: StoredDoc | null, serverNow: number): string | null {
  if (!SYNCED_COLLECTIONS.includes(coll)) return `collection ${coll}`;
  const keys = Object.keys(doc);
  if (keys.some((k) => !ENVELOPE.includes(k))) return 'extra key';
  if (!['id', 'v', 'updatedAt', 'deleted', 'by'].every((k) => k in doc)) return 'missing key';
  if (typeof doc.id !== 'string' || doc.id.length === 0 || doc.id.length > 128) return 'id';
  if (!Number.isInteger(doc.v) || doc.v < 1 || doc.v > 1000) return 'v';
  if (!Number.isInteger(doc.updatedAt) || doc.updatedAt <= 1_700_000_000_000 || doc.updatedAt >= serverNow + DAY_MS) return 'updatedAt';
  if (typeof doc.deleted !== 'boolean') return 'deleted';
  if (typeof doc.by !== 'string' || doc.by.length < 1 || doc.by.length > 64) return 'by';
  if (doc.deleted ? 'data' in doc : !doc.data || typeof doc.data !== 'object' || Array.isArray(doc.data)) return 'data';
  if (stored && doc.updatedAt < stored.updatedAt) return 'stale';
  if (coll === 'readings' && stored && !doc.deleted) {
    if (stored.deleted) return 'reading undeleted';
    if (JSON.stringify(mergeData(stored.data, doc.data)) !== JSON.stringify(stored.data)) return 'reading changed';
  }
  const merged = doc.deleted ? undefined : mergeData(stored?.deleted ? undefined : stored?.data, doc.data);
  if (merged && Object.keys(merged).length > 48) return 'too many fields';
  if (hasNestedArray(doc)) return 'array in array';
  return null;
}

function mergeData(prev: Record<string, unknown> | undefined, next: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!next) return prev;
  return { ...(prev ?? {}), ...next };
}

function hasNestedArray(v: unknown): boolean {
  if (Array.isArray(v)) return v.some((x) => Array.isArray(x) || hasNestedArray(x));
  if (v && typeof v === 'object') return Object.values(v as Record<string, unknown>).some(hasNestedArray);
  return false;
}

const after = (d: StoredDoc, c: Cursor | null) => !c || d.serverAt > c.at || (d.serverAt === c.at && d.id > c.id);

export function createMemoryRemote(startMs = 1_760_000_000_000): MemoryRemote {
  const colls = new Map<string, Map<string, StoredDoc>>();
  const coll = (c: string) => {
    let m = colls.get(c);
    if (!m) colls.set(c, (m = new Map()));
    return m;
  };
  const files = new Map<string, string>();
  const r: MemoryRemote = {
    files,
    offline: false,
    commits: 0,
    writes: 0,
    clock: { now: startMs },
    docs: (c) => [...coll(c).values()].map(copy),
    async commit(writes: readonly RemoteWrite[]) {
      if (r.offline) throw new RemoteUnavailable();
      if (writes.length > 500) throw new RemoteRefused('batch over 500');
      if (writes.length > MAX_BATCH) throw new RemoteRefused('batch over the engine limit');
      r.clock.now += 1;
      const at = r.clock.now;
      // Atomic: check every doc first (later writes in the batch see earlier ones, as in Firestore).
      const staged = new Map<string, StoredDoc | null>();
      for (const w of writes) {
        const k = `${w.coll}/${w.doc.id}`;
        const stored = staged.has(k) ? staged.get(k)! : (coll(w.coll).get(w.doc.id) ?? null);
        const problem = ruleProblem(w.coll, w.doc, stored, at);
        if (problem) throw new RemoteRefused(`${k}: ${problem}`);
        const data = w.doc.deleted ? undefined : mergeData(stored?.deleted ? undefined : stored?.data, w.doc.data);
        const next: StoredDoc = { id: w.doc.id, v: w.doc.v, updatedAt: w.doc.updatedAt, deleted: w.doc.deleted, by: w.doc.by, serverAt: at };
        if (data) next.data = copy(data);
        staged.set(k, next);
      }
      for (const [k, d] of staged) {
        const slash = k.indexOf('/');
        coll(k.slice(0, slash)).set(k.slice(slash + 1), d!);
      }
      r.commits += 1;
      r.writes += writes.length;
    },
    async get(c, id) {
      if (r.offline) throw new RemoteUnavailable();
      const d = coll(c).get(id);
      return d ? copy(d) : null;
    },
    async changesSince(c, cursor, limit) {
      if (r.offline) throw new RemoteUnavailable();
      return [...coll(c).values()]
        .filter((d) => after(d, cursor))
        .sort((a, b) => a.serverAt - b.serverAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
        .slice(0, limit)
        .map(copy);
    },
    transport(local, opts = {}) {
      return {
        exists: (p) => local.has(p),
        async upload(p) {
          if (r.offline) throw new RemoteUnavailable();
          if (syncedFilePath(p) !== p) throw new RemoteRefused(`file ${p}`);
          const body = local.get(p);
          if (body === undefined) throw new Error(`no local file ${p}`);
          files.set(p, body);
        },
        async download(p) {
          if (r.offline) throw new RemoteUnavailable();
          const body = files.get(p);
          if (body === undefined) throw new Error(`no remote file ${p}`);
          local.set(p, body);
        },
        async remove(p) {
          if (r.offline) throw new RemoteUnavailable();
          files.delete(p);
        },
        removeLocal: (p) => {
          local.delete(p);
        },
        canTransfer: () => (opts.canTransfer ? opts.canTransfer() : !r.offline),
      };
    },
  };
  return r;
}

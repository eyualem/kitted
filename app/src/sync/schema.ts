// What syncs and how it's named on the server (handoff/11-firestore-schema.md §2.4). Every table and kv key is
// classified here; a test fails when one is added without a decision (S6). Anything unclassified is treated as local:
// nothing leaves the phone without a decision.
import { KV } from '@/data/store';
import type { TableName } from '@/data/tables';

/** The sync schema version every document carries (`v`). Bump it when a document's meaning changes. */
export const SYNC_SCHEMA_VERSION = 1;

export interface TablePolicy {
  collection: string;
  /** Fields never sent, with the value a new row on another phone starts with. */
  omit?: Readonly<Record<string, unknown>>;
  /** The row's data can't change once written (a tombstone still can). Mirrors firestore.rules. */
  immutable?: boolean;
}

export const TABLE_POLICY: Readonly<Record<TableName, TablePolicy | 'local'>> = {
  // His age never leaves the phone: the age gate runs per device (§2.2).
  profile: { collection: 'profile', omit: { birthYear: null } },
  fitChecks: { collection: 'fitChecks', omit: { demoPhotoId: null } },
  readings: { collection: 'readings', immutable: true },
  closet: { collection: 'closetItems', omit: { demoPhotoId: null } },
  closetObs: { collection: 'closetObservations' },
  outfits: { collection: 'outfits' },
  wearLog: { collection: 'wearLog' },
  corrections: { collection: 'corrections' },
  chat: { collection: 'chatMessages' },
  dailyIdeas: { collection: 'dailyIdeas' },
  facts: { collection: 'facts' },
  // The server's counters win (the Worker keys limits on the account).
  usage: 'local',
  // The engine's own bookkeeping.
  syncRows: 'local',
  syncFiles: 'local',
};

export type SyncedTable = { [N in TableName]: (typeof TABLE_POLICY)[N] extends 'local' ? never : N }[TableName];

export const SYNCED_TABLES: readonly SyncedTable[] = (Object.keys(TABLE_POLICY) as TableName[]).filter(
  (n): n is SyncedTable => TABLE_POLICY[n] !== 'local',
);

/** The collection each synced kv key becomes a document in (doc id = the key). */
export const PREFS_COLLECTION = 'prefs';

/** Keep in step with firestore.rules (syncedCollection) and firebase/functions (SYNCED_COLLECTIONS). */
export const SYNCED_COLLECTIONS: readonly string[] = [...SYNCED_TABLES.map((n) => (TABLE_POLICY[n] as TablePolicy).collection), PREFS_COLLECTION];

export function tablePolicy(n: SyncedTable): TablePolicy {
  return TABLE_POLICY[n] as TablePolicy;
}

export function tableForCollection(coll: string): SyncedTable | null {
  return SYNCED_TABLES.find((n) => tablePolicy(n).collection === coll) ?? null;
}

// ---- kv keys ----

export interface KvPolicy {
  /** What's sent for this key (e.g. his birth year removed). */
  outgoing?: (value: string) => string;
  /** Merges a pulled value with this phone's (e.g. keeps this phone's birth year). */
  incoming?: (remote: string, local: string | null) => string;
}

const withoutBirthYear = (value: string): string => {
  try {
    const v = JSON.parse(value) as unknown;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const { birthYear: _drop, ...rest } = v as Record<string, unknown>;
      return JSON.stringify(rest);
    }
  } catch {
    // not JSON: send as is (it can't hold a birth year field)
  }
  return value;
};

const keepLocalBirthYear = (remote: string, local: string | null): string => {
  try {
    const r = JSON.parse(remote) as Record<string, unknown>;
    const l = local ? (JSON.parse(local) as Record<string, unknown>) : {};
    return JSON.stringify({ ...r, birthYear: l.birthYear ?? null });
  } catch {
    return remote;
  }
};

/** Synced kv keys (§2.4). The literals equal the constants in their modules (a test checks). */
export const KV_SYNCED: Readonly<Record<string, KvPolicy>> = {
  'onboarding.looks': {},
  'onboarding.otherStyle': {},
  'onboarding.basics': { outgoing: withoutBirthYear, incoming: keepLocalBirthYear },
  [KV.onboardingDone]: {},
  [KV.appearance]: {},
  [KV.lastOccasion]: {},
  'goingFor.last': {},
  'idea.style.day': {},
  'idea.style.evening': {},
  'scan.inbox': {},
  // Starter essentials marked without a closet piece (the belt, #291): part of his closet.
  'starter.marked': {},
};

/** Per-device kv keys, never sent. Exact keys, then prefixes. */
export const KV_LOCAL: readonly string[] = [
  KV.onboardingStep, KV.scenario, KV.seedLoaded, KV.ideaTime, KV.notifyIdea, KV.notifyReady, KV.notifyTrial, KV.revealFullShown,
  'idea.evening.ignored', 'camera.mode', 'weather.permission', 'closet.pendingDeletes',
  // The end of onboarding's progress (#291): this phone's first-fit sequence, like onboarding.step.
  'onboard.finish',
  // Closet's last Pieces | Outfits tap (#307): a view setting on this phone, like camera.mode.
  'closet.segment',
  // His Skips on the "How do your … fit?" card (09-ui-review §18, #316): a nudge he dismissed on this phone.
  'closet.fitSkip',
  // The fit-check card line's cap and the answer log (§19, #319): this phone's, never synced.
  'closet.fitLine', 'closet.fitAnswers',
];
// account.*: who is signed in on this phone (with the email) and the save offer's state (10-onboarding.md): per device.
export const KV_LOCAL_PREFIXES: readonly string[] = ['sync.', 'demo.', 'notify.', 'account.'];

export function kvPolicy(key: string): KvPolicy | 'local' | null {
  if (Object.prototype.hasOwnProperty.call(KV_SYNCED, key)) return KV_SYNCED[key]!;
  if (KV_LOCAL.includes(key) || KV_LOCAL_PREFIXES.some((p) => key.startsWith(p))) return 'local';
  return null;
}

export function isSyncedKv(key: string): boolean {
  const p = kvPolicy(key);
  return p !== null && p !== 'local';
}

// ---- files ----

/** The phone folders (under Documents) that back up, and the file names allowed in them (storage.rules). */
export const SYNCED_FILE_DIRS = ['photos', 'closet', 'scans'] as const;
const FILE_REF = /^(photos|closet|scans)\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const DOCS = '/Documents/';

/** A stored path as the relative path it backs up under, or null when it never leaves the phone: the face-hidden
 *  send copies (`-send`), caches, anything outside the three folders. Old rows' absolute file:// URLs are read by their
 *  Documents part, as resolveStoredPath does. */
export function syncedFilePath(stored: string): string | null {
  let rel = stored;
  if (stored.includes('://')) {
    const at = stored.indexOf(DOCS);
    if (!stored.startsWith('file://') || at < 0) return null;
    try {
      rel = decodeURI(stored.slice(at + DOCS.length));
    } catch {
      return null;
    }
  }
  if (!FILE_REF.test(rel)) return null;
  if (/-send\./.test(rel)) return null;
  return rel;
}

/** Every backed-up file a row (or a kv value) points at, found by walking it (new fields are covered too). */
export function fileRefs(value: unknown): string[] {
  const out = new Set<string>();
  const walk = (v: unknown, depth: number): void => {
    if (depth > 12 || v === null || v === undefined) return;
    if (typeof v === 'string') {
      const p = syncedFilePath(v);
      if (p) out.add(p);
      else if ((v.startsWith('[') || v.startsWith('{')) && v.length < 1_000_000) {
        try {
          walk(JSON.parse(v) as unknown, depth + 1);
        } catch {
          // plain text
        }
      }
      return;
    }
    if (Array.isArray(v)) v.forEach((x) => walk(x, depth + 1));
    else if (typeof v === 'object') Object.values(v as Record<string, unknown>).forEach((x) => walk(x, depth + 1));
  };
  walk(value, 0);
  return [...out].sort();
}

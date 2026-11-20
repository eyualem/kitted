// Test only, never imported by the app. T41b's shared set-up (tasks/T41b/TESTING.md): rows, a simulated phone (an inner store,
// the tracked store the app writes through, this phone's Documents folder as a Map, a sync engine) and a backup built over
// the memory remote with a recording file transport. Photos are file NAMES only (no real person's photo is used; no AI).
import seed from '../../assets/seed.json';
import { US_EASTERN } from '@kitted/core';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import type { KittedStore } from '@/data/store';
import type { ClosetItemRow, FitCheckRow, ProfileRow } from '@/data/types';
import { createBackup, type Backup, type BackupDeps } from '@/sync/backup';
import { createSyncEngine } from '@/sync/engine';
import type { MemoryRemote } from '@/sync/memoryRemote';
import type { FileTransport } from '@/sync/remote';
import { trackChanges } from '@/sync/tracker';

export const T0 = 1_760_000_000_000;

export function fit(id: string, o: Partial<FitCheckRow> = {}): FitCheckRow {
  return {
    id, createdAt: T0 - 1000, dayKey: '2026-10-22', photoFile: null, thumbFile: null, demoPhotoId: null, imageHash: id, occasion: 'everyday', style: null,
    status: 'scored', isPartial: false, notRated: [], score: 7.5, rawScore: 7.5, subscores: {}, occasionAdj: 0, rulesFired: [], credits: [], advice: [],
    fixes: [], explanation: null, rubricVersion: 'parts', isFavorite: false, snapState: 'none', recheckUsed: false, isFirstCheck: false, readingId: null,
    parentId: null, itemIds: [], details: {}, ...o,
  } as FitCheckRow;
}

let baseRow: Promise<ClosetItemRow> | null = null;
/** A real closet row from the bundled seed, re-keyed. */
export async function piece(id: string, o: Partial<ClosetItemRow> = {}): Promise<ClosetItemRow> {
  baseRow ??= (async () => {
    const s = createMemoryStore();
    await s.init();
    await loadScenario(s, seed, { scenario: 'full', zone: US_EASTERN });
    return (await s.closet.all())[0]!;
  })();
  const b = await baseRow;
  return { ...b, id, photoFile: null, cropFile: null, demoPhotoId: null, isDeleted: false, mergedInto: null, ...o };
}

export const profileRow = (o: Partial<ProfileRow> = {}): ProfileRow => ({
  id: 'me', birthYear: null, heightCm: null, build: '', fitPreference: 'regular', styles: [['minimal', 0.5], ['streetwear', 0.3]] as never, boldness: null,
  budget: null, lastOccasion: 'everyday', consentVersion: null, consentAt: null, onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: T0 - 5000, ...o,
});

export interface Phone {
  inner: KittedStore;
  /** What the app writes through (records changes). */
  app: KittedStore;
  clock: { now: number };
  /** This phone's Documents folder: path → contents. */
  files: Map<string, string>;
  deviceId: string;
  engine: ReturnType<typeof createSyncEngine>;
}

export function newPhone(remote: MemoryRemote, deviceId: string): Phone {
  const inner = createMemoryStore();
  const clock = { now: T0 };
  const files = new Map<string, string>();
  const app = trackChanges(inner, { isOn: () => true, nowMs: () => clock.now, deviceId });
  const engine = createSyncEngine({
    store: inner, remote, files: remote.transport(files), deviceId, nowMs: () => clock.now, enabled: () => true, backUpPhotos: () => false,
  });
  return { inner, app, clock, files, deviceId, engine };
}

export interface BackupRig {
  backup: Backup;
  /** Every path the transport's `upload` was called with, in order. */
  uploads: string[];
  /** Every uid `connect` was called with. */
  connects: string[];
  /** Set to false to stop transfers (the phone is on cellular or busy). */
  transfer: { on: boolean };
}

export function backupRig(p: Phone, remote: MemoryRemote, o: Partial<BackupDeps> = {}): BackupRig {
  const uploads: string[] = [];
  const connects: string[] = [];
  const transfer = { on: true };
  const t = remote.transport(p.files, { canTransfer: () => transfer.on && !remote.offline });
  const files: FileTransport = {
    ...t,
    async upload(path) {
      uploads.push(path);
      return t.upload(path);
    },
  };
  const backup = createBackup({
    store: p.inner,
    async connect(uid) {
      connects.push(uid);
      return { remote, files };
    },
    account: async () => ({ uid: 'U1' }),
    firebaseUser: async () => ({ uid: 'U1', isAnonymous: false }),
    allowed: () => true,
    online: () => !remote.offline,
    nowMs: () => (p.clock.now += 10),
    deviceId: async () => p.deviceId,
    log: () => {},
    ...o,
  });
  return { backup, uploads, connects, transfer };
}

/** All non-tombstone fit ids on a phone's store, sorted. */
export const fitIds = async (s: KittedStore) => (await s.fitChecks.all()).map((c) => c.id).sort();

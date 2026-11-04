// Whether this phone records its changes for backup, and its device id (handoff/11-firestore-schema.md §11.2 decision 6,
// #386). db.ts wraps the store with these; the backup controller (backup.ts) moves them. Recording starts at the first
// sign-in on this phone (kv `sync.uid`) and stays on after a sign-out (on the phone only), so edits made while signed
// out go up at the next sign-in to the same account. A guest never records anything.
import type { KittedStore } from '@/data/store';
import type { TrackerOptions } from './tracker';

/** The account this phone's change records belong to. */
export const SYNC_UID_KEY = 'sync.uid';

export interface TrackingDeps {
  raw: Pick<KittedStore, 'getKv'>;
  /** iOS, not a demo screen (E13). */
  allowed(): boolean;
  /** This phone's id, made once and kept in the Keychain. */
  loadDeviceId(): Promise<string>;
  nowMs(): number;
}

export function createTracking(d: TrackingDeps) {
  let uid: string | null = null;
  let device = '';
  let loading: Promise<void> | null = null;
  let recorded: () => void = () => {};
  const load = () =>
    (loading ??= (async () => {
      uid = await d.raw.getKv(SYNC_UID_KEY);
      device = await d.loadDeviceId();
    })().catch((e: unknown) => {
      loading = null;
      throw e;
    }));

  const options: TrackerOptions = {
    // A failure here must never fail his write: it just isn't recorded (markAllDirty at the next join catches it).
    async isOn() {
      if (!d.allowed()) return false;
      try {
        await load();
      } catch (e: unknown) {
        console.warn('[sync] tracking state unreadable', e);
        return false;
      }
      return uid !== null && device !== '';
    },
    deviceId: () => device,
    nowMs: () => d.nowMs(),
    onRecorded: () => recorded(),
  };

  return {
    /** For trackChanges. */
    options,
    async uid(): Promise<string | null> {
      await load();
      return uid;
    },
    async deviceId(): Promise<string> {
      await load();
      return device;
    },
    /** After kv `sync.uid` was written (or deleted). */
    setUid(u: string | null) {
      uid = u;
    },
    /** After a wipe: read everything again. */
    reset() {
      loading = null;
      uid = null;
    },
    /** The backup's "a change was recorded" (it schedules the push). */
    onRecord(cb: () => void) {
      recorded = cb;
    },
  };
}

export type Tracking = ReturnType<typeof createTracking>;

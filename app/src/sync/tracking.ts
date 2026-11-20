// Whether this phone records its changes for backup, and its device id (handoff/11-firestore-schema.md §11.2 decision 6).
// db.ts wraps the store with these; the backup (backup.ts) moves them. Recording starts at the first sign-in on this phone
// (kv `sync.uid`, written by the backup's first round or by the restore) and stays on after a sign-out (on the phone only),
// so edits made while signed out go up at the next sign-in to the same account. A guest never records anything.
import type { KittedStore } from '@/data/store';
import { SYNC_UID_KEY } from './backup';
import type { TrackerOptions } from './tracker';

export { SYNC_UID_KEY };

export interface TrackingDeps {
  raw: Pick<KittedStore, 'getKv'>;
  /** `syncAllowed()`: ACCOUNTS_BUILT, iOS, not a demo screen (E13). */
  allowed(): boolean;
  /** This phone's id, made once and kept in the Keychain. */
  loadDeviceId(): Promise<string>;
  nowMs(): number;
}

export function createTracking(d: TrackingDeps) {
  let device = '';
  let loading: Promise<void> | null = null;
  let recorded: () => void = () => {};
  const load = () =>
    (loading ??= (async () => {
      device = await d.loadDeviceId();
    })().catch((e: unknown) => {
      loading = null;
      throw e;
    }));

  const options: TrackerOptions = {
    // A failure here must never fail his write: it just isn't recorded (the join's markAllDirty catches it later).
    async isOn() {
      if (!d.allowed()) return false;
      try {
        // The account is read each time: the backup writes it from its first round, and a wipe removes it.
        if ((await d.raw.getKv(SYNC_UID_KEY)) === null) return false;
        await load();
      } catch (e: unknown) {
        console.warn('[sync] tracking state unreadable', e);
        return false;
      }
      return device !== '';
    },
    deviceId: () => device,
    nowMs: () => d.nowMs(),
    onRecorded: () => recorded(),
  };

  return {
    /** For trackChanges. */
    options,
    async deviceId(): Promise<string> {
      await load();
      return device;
    },
    /** After a wipe: the Keychain's device id is gone, so read it again. */
    reset() {
      loading = null;
      device = '';
    },
    /** The backup's "a change was recorded" (it schedules the push). */
    onRecord(cb: () => void) {
      recorded = cb;
    },
  };
}

export type Tracking = ReturnType<typeof createTracking>;

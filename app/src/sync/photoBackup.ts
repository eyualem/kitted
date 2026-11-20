// T41b (specs/sign-in-and-backup.md SB4): photo backup is a setting of the account. Off until he turns it on. STUBS: every
// function throws until the implementer writes it (tasks/T41b/TESTING.md → Interfaces fixed in the stubs).
import type { KittedStore } from '@/data/store';

/** The synced kv key (a pref the account keeps, so a new phone follows it). Absent or any value but `'on'` means off. */
export const PHOTO_BACKUP_KEY = 'backup.photos';
/** Local to this phone (the `account.` prefix): the photo step was already offered after a sign-in. */
export const PHOTO_STEP_KEY = 'account.photoStep';

/** True only when kv `backup.photos` is exactly `'on'`. */
export async function isPhotoBackupOn(_store: Pick<KittedStore, 'getKv'>): Promise<boolean> {
  throw new Error('T41b: not built');
}

/** Writes kv `backup.photos` = `'on'`. */
export async function turnOnPhotoBackup(_store: Pick<KittedStore, 'setKv'>): Promise<void> {
  throw new Error('T41b: not built');
}

export type PhotoStep = 'show' | 'skip';

/** SB4.1c: whether the sheet's last step (`Back up photos too` · `Done`) is offered now. `'skip'` when photo backup is already
 *  on (a restore to an account that has it on), or when the step was already offered (`markPhotoStepOffered`); else `'show'`. */
export async function photoStepFor(_store: Pick<KittedStore, 'getKv'>): Promise<PhotoStep> {
  throw new Error('T41b: not built');
}

/** Records that the step was offered, so the next launch and the next call of `photoStepFor` say `'skip'`. */
export async function markPhotoStepOffered(_store: Pick<KittedStore, 'setKv'>): Promise<void> {
  throw new Error('T41b: not built');
}

export type TurnOffResult =
  /** Confirmed, the server's copies are gone, the setting is off. */
  | { status: 'off' }
  /** He tapped Cancel: nothing was called, the setting stays on. */
  | { status: 'cancelled' }
  /** The job rejected with RemoteUnavailable: nothing changed (a toast says offline). */
  | { status: 'offline' }
  /** The job rejected with any other error: nothing changed (a toast says it failed). */
  | { status: 'failed' };

/** SB4.3: "Turn off photo backup?" The order is: `confirm()` → (true) `deleteBackedUp()` → only if it resolved, kv `backup.photos`
 *  is set off (`'off'`, or deleted). `confirm()` false → `{status:'cancelled'}` and `deleteBackedUp` is never called. If
 *  `deleteBackedUp` rejects, kv `backup.photos` stays `'on'`, `syncRows` and `syncFiles` are not touched, and the result is
 *  `offline` (rejected with `RemoteUnavailable`) or `failed` (anything else). No row and no photo on the phone is ever touched. */
export async function turnOffPhotoBackup(_d: {
  store: Pick<KittedStore, 'getKv' | 'setKv' | 'deleteKv' | 'syncRows' | 'syncFiles'>;
  confirm(): Promise<boolean>;
  /** The server job `deleteBackedUpPhotos`: resolves when `users/{uid}/files/` is empty. */
  deleteBackedUp(): Promise<void>;
}): Promise<TurnOffResult> {
  throw new Error('T41b: not built');
}

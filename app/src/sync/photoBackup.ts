// Photo backup (specs/sign-in-and-backup.md SB4): a setting of his account, off until he turns it on. A synced pref, so a new
// phone follows it. The engine's file queue and the transport's upload stay idle while it is off (sync/backup.ts).
import type { KittedStore } from '@/data/store';
import { RemoteUnavailable } from './remote';

/** The synced kv key (a pref the account keeps, so a new phone follows it). Absent or any value but `'on'` means off. */
export const PHOTO_BACKUP_KEY = 'backup.photos';
/** Local to this phone (the `account.` prefix): the photo step was already offered after a sign-in. */
export const PHOTO_STEP_KEY = 'account.photoStep';

/** True only when kv `backup.photos` is exactly `'on'`. */
export async function isPhotoBackupOn(store: Pick<KittedStore, 'getKv'>): Promise<boolean> {
  return (await store.getKv(PHOTO_BACKUP_KEY)) === 'on';
}

/** Writes kv `backup.photos` = `'on'`. */
export async function turnOnPhotoBackup(store: Pick<KittedStore, 'setKv'>): Promise<void> {
  await store.setKv(PHOTO_BACKUP_KEY, 'on');
}

export type PhotoStep = 'show' | 'skip';

/** SB4.1c: whether the sheet's last step (`Back up photos too` · `Done`) is offered now. `'skip'` when photo backup is already
 *  on (a restore to an account that has it on), or when the step was already offered (`markPhotoStepOffered`); else `'show'`. */
export async function photoStepFor(store: Pick<KittedStore, 'getKv'>): Promise<PhotoStep> {
  if (await isPhotoBackupOn(store)) return 'skip';
  return (await store.getKv(PHOTO_STEP_KEY)) === null ? 'show' : 'skip';
}

/** Records that the step was offered, so the next launch and the next call of `photoStepFor` say `'skip'`. */
export async function markPhotoStepOffered(store: Pick<KittedStore, 'setKv'>): Promise<void> {
  await store.setKv(PHOTO_STEP_KEY, '1');
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
 *  is set off and the "already uploaded" bookkeeping is reset (the server's copies are gone, so turning it on again sends
 *  every kept photo once more). `confirm()` false → `{status:'cancelled'}` and `deleteBackedUp` is never called. If
 *  `deleteBackedUp` rejects, kv `backup.photos` stays `'on'`, `syncRows` and `syncFiles` are not touched, and the result is
 *  `offline` (rejected with `RemoteUnavailable`) or `failed` (anything else). No row and no photo on the phone is ever touched. */
export async function turnOffPhotoBackup(d: {
  store: Pick<KittedStore, 'getKv' | 'setKv' | 'deleteKv' | 'syncRows' | 'syncFiles'>;
  confirm(): Promise<boolean>;
  /** The server job `deleteBackedUpPhotos`: resolves when `users/{uid}/files/` is empty. */
  deleteBackedUp(): Promise<void>;
}): Promise<TurnOffResult> {
  if (!(await d.confirm())) return { status: 'cancelled' };
  try {
    await d.deleteBackedUp();
  } catch (e: unknown) {
    return { status: e instanceof RemoteUnavailable ? 'offline' : 'failed' };
  }
  // Nothing is queued to go up or down any more, and no row counts a photo as backed up.
  for (const f of await d.store.syncFiles.all()) await d.store.syncFiles.delete(f.path);
  for (const r of await d.store.syncRows.all()) if (r.files.length > 0) await d.store.syncRows.put({ ...r, files: [] });
  await d.store.setKv(PHOTO_BACKUP_KEY, 'off');
  return { status: 'off' };
}

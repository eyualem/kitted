// L2's "Delete photo" (02 L2; 09-ui-review §20.8 G22): one look's photo leaves the phone, the score stays.
//   - His kept photo and thumb, and the face-hidden copies photo prep made (upload, close-ups, detail): deleteKept
//     (held/files.ts deleteHeldPhoto, the same files "Don't score it" deletes).
//   - The closet cut-outs and fingerprints cut from that photo (Documents/closet/<sha>-<key>.png / .print).
//   - Every check that holds the same photo (the same file or the same SHA: a same-photo re-check, a retry) loses its
//     paths, its chat bubble hides (the payload's photo goes, as with "Delete all photos"), and the look page shows
//     "Photo deleted". A demo photo has no files: it just stops showing.
// Scores, readings, closet pieces and sightings stay. Only path fields are written on checks (closetSummary / itemIds
// are the closet service's, CLAUDE.md lessons).
import type { KittedStore } from '@/data/store';
import type { FitCheckRow } from '@/data/types';
import { printFileOf } from '@/services/measure/garments';

export interface DeletePhotoDeps {
  store: KittedStore;
  /** Deletes his kept photo, thumb and the face-hidden copies for this photo. Never throws. */
  deleteKept: (row: Pick<FitCheckRow, 'photoFile' | 'thumbFile' | 'imageHash'>) => void;
  /** Deletes stored closet paths (privacy/files deleteClosetFiles). */
  deleteClosetFiles: (stored: string[]) => number;
}

/** True when the check had a photo to delete. */
export async function deleteCheckPhoto(deps: DeletePhotoDeps, checkId: string): Promise<boolean> {
  const { store } = deps;
  const row = await store.fitChecks.get(checkId);
  if (!row || (!row.photoFile && !row.thumbFile && !row.demoPhotoId)) return false;
  const sha = /^[0-9a-f]{16,}$/.test(row.imageHash) ? row.imageHash : null;
  const holders = (await store.fitChecks.all()).filter(
    (c) => c.id === row.id || (!!sha && c.imageHash === sha) || (!!row.photoFile && c.photoFile === row.photoFile),
  );
  const ids = new Set(holders.map((c) => c.id));
  for (const c of holders) await store.fitChecks.patch(c.id, { photoFile: null, thumbFile: null, demoPhotoId: null });
  for (const m of await store.chat.all()) {
    // A snap's bubble (the shoes, or the pants and shoes) is its own photo: it stays.
    if (!m.fitCheckId || !ids.has(m.fitCheckId) || m.kind !== 'photo' || m.payload?.snap === true) continue;
    const { photoUri: _u, photoId: _p, ...rest } = m.payload ?? {};
    await store.chat.patch(m.id, { payload: rest });
  }
  // The cut-outs cut from this photo: its sightings' crops (and their fingerprints), and a piece's own crop among them.
  const crops = new Set<string>();
  for (const o of await store.closetObs.all()) {
    if (!o.fitCheckId || !ids.has(o.fitCheckId) || !o.cropFile) continue;
    // A snap's sightings are cut from the snap's own photo (its SHA in the name): they stay with it.
    if (sha && !o.cropFile.includes(`${sha}-`)) continue;
    crops.add(o.cropFile);
    await store.closetObs.patch(o.id, { cropFile: null, cropQuality: null });
  }
  for (const it of await store.closet.all()) {
    if (it.cropFile && crops.has(it.cropFile)) await store.closet.patch(it.id, { cropFile: null, cropScore: null });
    if (row.photoFile && it.photoFile === row.photoFile) await store.closet.patch(it.id, { photoFile: null });
  }
  if (crops.size > 0) deps.deleteClosetFiles([...crops].flatMap((f) => [f, printFileOf(f)].filter((x): x is string => !!x)));
  if (row.photoFile || row.thumbFile || sha) deps.deleteKept(row);
  return true;
}

/** A look's photos (L2's "Delete photos", 09 §22.7 F4): each check's (its first check and every re-check). True when
 *  any had one. */
export async function deleteLookPhotos(deps: DeletePhotoDeps, checkIds: readonly string[]): Promise<boolean> {
  let any = false;
  for (const id of checkIds) any = (await deleteCheckPhoto(deps, id)) || any;
  return any;
}

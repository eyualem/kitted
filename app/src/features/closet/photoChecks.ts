// The live inputs of a crop of his photo (piecePhotos): every check as a PhotoCheck (its stored heads and whether
// its reading is a mirror selfie), and the file and demo-photo lookups. Reads the store; the rules are pure
// (piecePhotos.ts, cropSafety.ts).
import { File } from 'expo-file-system';
import type { KittedStore } from '@/data/store';
import { demoPhoto } from '@/demo/demoPhotos';
import { resolveStoredPath } from '@/services/photoFiles';
import { isMirrorReading } from './cropSafety';
import { photoCheckOf, type PhotoCheck, type PhotoDeps } from './piecePhotos';

/** Whether a stored file is still on the phone (a kept photo can be gone); never throws. */
export function fileExists(uri: string): boolean {
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

export const livePhotoDeps: PhotoDeps = {
  resolve: resolveStoredPath,
  exists: fileExists,
  demo: (id) => {
    const d = demoPhoto(id);
    return d ? { source: d.source, aspect: d.aspect, neck: d.crop.neck } : undefined;
  },
};

/** Every check by id, as the crops need it. */
export async function loadPhotoChecks(store: KittedStore): Promise<Map<string, PhotoCheck>> {
  const rows = await store.fitChecks.all();
  const mirror = new Map((await store.readings.all()).map((r) => [r.id, isMirrorReading(r.reading)]));
  return new Map(rows.map((r) => [r.id, photoCheckOf(r, r.readingId ? mirror.get(r.readingId) === true : false)]));
}

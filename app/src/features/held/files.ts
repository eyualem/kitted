// "Don't score it" (02 S17h, #280): the held photo is deleted from the phone. It was never sent, but photo prep made
// its face-hidden copies when he took it, so those go too: his kept photo and thumb (Documents/photos) and the upload
// copy, close-ups and detail copy (Caches/upload, Caches/detail), all named by the photo's SHA (KittedPrep.swift).
import { File, Paths } from 'expo-file-system';
import type { FitCheckRow } from '@/data/types';
import { resolveStoredPath } from '@/services/photoFiles';

const CACHE_FILES = (sha: string) => [`upload/${sha}.jpg`, `upload/${sha}-upper.jpg`, `upload/${sha}-lower.jpg`, `upload/${sha}-body.jpg`, `detail/${sha}.jpg`];

function remove(f: File): void {
  try {
    if (f.exists) f.delete();
  } catch (e: unknown) {
    console.error('[held] could not delete', f.uri, e);
  }
}

/** Never throws; missing files are fine. Only his own photo's files: a demo photo has none. */
export function deleteHeldPhoto(row: Pick<FitCheckRow, 'photoFile' | 'thumbFile' | 'imageHash'>): void {
  try {
    for (const stored of [row.photoFile, row.thumbFile]) {
      const uri = stored ? resolveStoredPath(stored) : null;
      if (uri && uri.includes('/Documents/photos/')) remove(new File(uri));
    }
    if (/^[0-9a-f]{16,}$/.test(row.imageHash)) for (const rel of CACHE_FILES(row.imageHash)) remove(new File(Paths.cache, rel));
  } catch (e: unknown) {
    console.error('[held] could not delete the held photo', e);
  }
}

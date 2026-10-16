// ImagePrep (03 §8) for the demo: bundled photos are already known (id, hash, crop table), so
// nothing is cropped or uploaded. Real files return notImplemented until P3/P8 (kitted-vision).
import { demoPhoto } from '@/demo/demoPhotos';
import type { PreparedImage } from '../readingSource/types';

/** One person in a photo, normalized (0–1, origin top-left, on the upright photo). */
export interface PersonBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type PhotoRef =
  | { kind: 'demo'; photoId: string }
  /** `person`: the one he tapped on "Which one is you?" (02 S23); everyone else is covered in what's sent. `snap`: a
   *  photo that finishes a partial check (his shoes, or his pants and shoes): no person needed (#313). */
  | { kind: 'file'; uri: string; person?: PersonBox; snap?: boolean }
  | { kind: 'retry'; sha256: string; keptUri: string | null; thumbUri: string | null };

export type PrepResult =
  | { status: 'ok'; image: PreparedImage }
  /** Two people of comparable size: `people` (the biggest first) for "Which one is you?", and the photo's width / height.
   *  No `people` from native builds before Oct 14. */
  | { status: 'multiplePeople'; people?: PersonBox[]; aspect?: number }
  | { status: 'noPerson' | 'couldNotFrame' | 'notImplemented' | 'unknownPhoto' };

export interface ImagePrep {
  prepare(photo: PhotoRef): Promise<PrepResult>;
}

export const demoImagePrep: ImagePrep = {
  async prepare(photo) {
    if (photo.kind !== 'demo') return { status: 'notImplemented' };
    const p = demoPhoto(photo.photoId);
    if (!p) return { status: 'unknownPhoto' };
    return { status: 'ok', image: { photoId: p.id, sha256: p.sha256, uploadUri: null } };
  },
};

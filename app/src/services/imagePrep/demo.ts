// ImagePrep (03 §8) for the demo: bundled photos are already known (id, hash, crop table), so
// nothing is cropped or uploaded. Real files return notImplemented until P3/P8 (kitted-vision).
import { demoPhoto } from '@/demo/demoPhotos';
import type { PreparedImage } from '../readingSource/types';

export type PhotoRef = { kind: 'demo'; photoId: string } | { kind: 'file'; uri: string } | { kind: 'retry'; sha256: string; keptUri: string | null; thumbUri: string | null };

export type PrepResult =
  | { status: 'ok'; image: PreparedImage }
  | { status: 'noPerson' | 'multiplePeople' | 'couldNotFrame' | 'notImplemented' | 'unknownPhoto' };

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

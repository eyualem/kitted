// ImagePrep for real photos (05 §P3 C): bundled demo photos keep the mockup's crop table;
// anything else goes through kitted-vision on the phone (neck-down crop, face removed,
// metadata stripped, hashed) before it can be sent or kept.
import { prepare as visionPrepare, reloadUpload } from '../../../modules/kitted-vision';
import { demoImagePrep, type ImagePrep } from './demo';

export const imagePrep: ImagePrep = {
  async prepare(photo) {
    if (photo.kind === 'demo') return demoImagePrep.prepare(photo);
    if (photo.kind === 'retry') {
      const uploadBase64 = await reloadUpload(photo.sha256);
      if (!uploadBase64) return { status: 'couldNotFrame' };
      return { status: 'ok', image: { photoId: null, sha256: photo.sha256, uploadUri: null, uploadBase64, neckDownUri: photo.neckDownUri ?? undefined, thumbUri: photo.thumbUri ?? undefined } };
    }
    const r = await visionPrepare(photo.uri);
    if (r.status !== 'ok') {
      if (__DEV__) console.log('[prep]', JSON.stringify(r));
      return { status: r.status };
    }
    if (__DEV__) console.log(`[prep] ok · ${r.width}×${r.height} neck-down · pose ${r.pose} · ${r.faceBoxes} face box(es) pixelated · ${r.people} person`);
    return {
      status: 'ok',
      image: {
        photoId: null, sha256: r.sha256, uploadUri: r.uploadUri, uploadBase64: r.uploadBase64,
        neckDownUri: r.neckDownUri, thumbUri: r.thumbUri, aspect: r.width / r.height,
      },
    };
  },
};

// ImagePrep for real photos (05 §P3 C): bundled demo photos keep the mockup's crop table;
// anything else goes through kitted-vision on the phone (the upload: full frame, every face
// blurred; the copy kept on the phone: unblurred; both without metadata) before anything is sent.
import { prepare as visionPrepare, reloadUpload } from '../../../modules/kitted-vision';
import { demoImagePrep, type ImagePrep } from './demo';
import { toStoredPath } from '../photoFiles';

export const imagePrep: ImagePrep = {
  async prepare(photo) {
    if (photo.kind === 'demo') return demoImagePrep.prepare(photo);
    if (photo.kind === 'retry') {
      const uploadBase64 = await reloadUpload(photo.sha256);
      if (!uploadBase64) return { status: 'couldNotFrame' };
      return { status: 'ok', image: { photoId: null, sha256: photo.sha256, uploadUri: null, uploadBase64, keptUri: photo.keptUri ?? undefined, thumbUri: photo.thumbUri ?? undefined } };
    }
    const r = await visionPrepare(photo.uri);
    if (r.status !== 'ok') {
      if (__DEV__) console.log('[prep]', JSON.stringify(r));
      return { status: r.status };
    }
    if (__DEV__) {
      const dim = (w?: number, h?: number) => (w && h ? `${w}×${h}` : '?');
      const sizes = r.sourceWidth
        ? ` · source ${dim(r.sourceWidth, r.sourceHeight)} → upload ${dim(r.uploadWidth, r.uploadHeight)} (${Math.round((r.uploadBytes ?? 0) / 1024)} KB)` +
          ` · kept ${dim(r.keptWidth, r.keptHeight)} · detail ${dim(r.detailWidth, r.detailHeight)} · vision ${r.visionMs} ms · total ${r.totalMs} ms`
        : ` · ${r.width}×${r.height}`;
      console.log(`[prep] ok${sizes} · pose ${r.pose} · ${r.faceBoxes} region(s) blurred · ${r.people} person`);
    }
    return {
      status: 'ok',
      image: {
        photoId: null, sha256: r.sha256, uploadUri: r.uploadUri, uploadBase64: r.uploadBase64,
        // Stored relative to Documents (the container path changes on reinstall); resolved when shown.
        keptUri: toStoredPath(r.keptUri) ?? undefined, thumbUri: toStoredPath(r.thumbUri) ?? undefined, aspect: r.width / r.height,
      },
    };
  },
};

// ImagePrep for real photos (05 §P3 C): bundled demo photos keep the mockup's crop table;
// anything else goes through kitted-vision on the phone (the upload: full frame, every face
// blurred; the copy kept on the phone: unblurred; both without metadata) before anything is sent.
import { prepare as visionPrepare, preparePerson, reloadUpload, reloadZoom } from '../../../modules/kitted-vision';
import { demoImagePrep, type ImagePrep } from './demo';
import { toStoredPath } from '../photoFiles';

export const imagePrep: ImagePrep = {
  async prepare(photo) {
    if (photo.kind === 'demo') return demoImagePrep.prepare(photo);
    if (photo.kind === 'retry') {
      const uploadBase64 = await reloadUpload(photo.sha256);
      if (!uploadBase64) return { status: 'couldNotFrame' };
      const zoomBase64 = await reloadZoom(photo.sha256);
      return { status: 'ok', image: { photoId: null, sha256: photo.sha256, uploadUri: null, uploadBase64, zoomBase64, keptUri: photo.keptUri ?? undefined, thumbUri: photo.thumbUri ?? undefined } };
    }
    const r = photo.person ? await preparePerson(photo.uri, photo.person) : await visionPrepare(photo.uri);
    if (r.status === 'multiplePeople') {
      // "Which one is you?" (02 S23): the people he could be, for the question card.
      const people = (r.candidates ?? []).filter((b) => b.length === 4).map(([x, y, width, height]) => ({ x: x!, y: y!, width: width!, height: height! }));
      if (__DEV__) console.log(`[prep] multiplePeople · ${people.length} people to choose from · nothing sent`);
      return people.length >= 2 && !photo.person
        ? { status: 'multiplePeople', people, ...(r.width && r.height ? { aspect: r.width / r.height } : {}) }
        : { status: 'multiplePeople' };
    }
    if (r.status !== 'ok') {
      if (__DEV__) console.log('[prep]', JSON.stringify(r));
      return { status: r.status };
    }
    if (__DEV__ && r.masked) {
      console.log(r.autoPicked
        ? `[prep] auto-picked the main person (${r.masked} other${r.masked === 1 ? '' : 's'} masked)`
        : `[prep] he picked person ${(r.picked ?? 0) + 1} (${r.masked} other${r.masked === 1 ? '' : 's'} masked)`);
    }
    if (__DEV__) {
      const dim = (w?: number, h?: number) => (w && h ? `${w}×${h}` : '?');
      const sizes = r.sourceWidth
        ? ` · source ${dim(r.sourceWidth, r.sourceHeight)} → upload ${dim(r.uploadWidth, r.uploadHeight)} (${Math.round((r.uploadBytes ?? 0) / 1024)} KB)` +
          ` · kept ${dim(r.keptWidth, r.keptHeight)} · detail ${dim(r.detailWidth, r.detailHeight)} · vision ${r.visionMs} ms · total ${r.totalMs} ms`
        : ` · ${r.width}×${r.height}`;
      const zoom = r.zoomKinds?.length ? ` · close-ups ${r.zoomKinds.map((k, i) => `${k} ${(r.zoomSizes?.[i] ?? []).join('×')}`).join(', ')} (${r.zoomMs} ms)` : ' · no close-ups';
      console.log(`[prep] ok${sizes} · pose ${r.pose} · ${r.faceBoxes} region(s) blurred · ${r.people} person${zoom}`);
    }
    return {
      status: 'ok',
      image: {
        photoId: null, sha256: r.sha256, uploadUri: r.uploadUri, uploadBase64: r.uploadBase64, zoomBase64: r.zoomBase64 ?? [],
        // Stored relative to Documents (the container path changes on reinstall); resolved when shown.
        keptUri: toStoredPath(r.keptUri) ?? undefined, thumbUri: toStoredPath(r.thumbUri) ?? undefined, aspect: r.width / r.height,
      },
    };
  },
};

// The 12 bundled demo photos (free-license stock, demo only): image module, neck-down crop
// (the mockup's PH table), aspect, SHA-256 and the measured API latency of each.
import type { PhotoCrop } from '@/design-system/components/Chat';
import crops from '../../assets/demo-photos/demo-photos.json';
import index from '../../assets/demo-readings/INDEX.json';
import { resolveStoredPath } from '@/services/photoFiles';

export interface DemoPhoto {
  id: string;
  source: number;
  crop: PhotoCrop;
  /** width / height of the file. */
  aspect: number;
  sha256: string;
  latencySeconds: number;
}

const FILES: Record<string, number> = {
  p01a: require('../../assets/demo-photos/p01a.jpg'),
  p01b: require('../../assets/demo-photos/p01b.jpg'),
  s05: require('../../assets/demo-photos/s05.jpg'),
  s09: require('../../assets/demo-photos/s09.jpg'),
  s10: require('../../assets/demo-photos/s10.jpg'),
  s12: require('../../assets/demo-photos/s12.jpg'),
  s13: require('../../assets/demo-photos/s13.jpg'),
  s14: require('../../assets/demo-photos/s14.jpg'),
  s15: require('../../assets/demo-photos/s15.jpg'),
  s22: require('../../assets/demo-photos/s22.jpg'),
  s24: require('../../assets/demo-photos/s24.jpg'),
  s25: require('../../assets/demo-photos/s25.jpg'),
};

/** Pixel sizes of the bundled files (all 820 tall). */
const WIDTH: Record<string, number> = {
  p01a: 546, p01b: 546, s24: 543, s25: 461, s05: 656, s14: 656, s15: 656, s22: 615, s09: 546, s10: 546, s13: 546, s12: 547,
};

const BUNDLED: readonly DemoPhoto[] = crops.photos.map((c) => {
  const meta = index.photos.find((p) => p.id === c.id);
  if (!meta) throw new Error(`demo photo ${c.id} missing from INDEX.json`);
  return {
    id: c.id,
    source: FILES[c.id]!,
    crop: { neck: c.neck, foot: c.foot, cx: c.cx },
    aspect: (WIDTH[c.id] ?? 546) / 820,
    sha256: meta.photo_sha256,
    latencySeconds: meta.latency_s,
  };
});

/** "ph1": the founder's Oct 7 reading (black wide jeans read as sweatpants, the one quick tap's case) shown on
 *  s12's stock photo as a stand-in. Never his own photo. Its own fake hash, so "same photo again" stays separate. */
const s12 = BUNDLED.find((p) => p.id === 's12')!;
/** "ph8": the founder's Oct 8 reading (his work boots read as slides: the shoe question, #120), also on s12's photo. */
/** "p01b2": a second shot of p01b's outfit (the same reading, its own hash): S21's re-check that doesn't see the change.
 *  The identical photo again no longer re-reads at all (#219), so the story needs a new photo. */
const p01b = BUNDLED.find((p) => p.id === 'p01b')!;
/** "s14b": the Welcome photo again after its fix (a new hash), for the first-3-moves story where the re-check makes move 2. */
const s14 = BUNDLED.find((p) => p.id === 's14')!;
export const DEMO_PHOTOS: readonly DemoPhoto[] = [
  ...BUNDLED,
  { ...p01b, id: 'p01b2', sha256: 'demo-p01b-second-shot' },
  { ...s14, id: 's14b', sha256: 'demo-s14-after-fix' },
  // "p01t": p01b in a short mirror (#313): the card shows it neck to waist, as a bathroom mirror would.
  { ...p01b, id: 'p01t', sha256: 'demo-p01b-top-only', crop: { ...p01b.crop, foot: p01b.crop.neck + (p01b.crop.foot - p01b.crop.neck) * 0.42 } },
  { ...s12, id: 'ph1', sha256: 'demo-ph1-oct7', latencySeconds: 6.6 },
  { ...s12, id: 'ph8', sha256: 'demo-ph8-oct8', latencySeconds: 9.4 },
  { ...s12, id: 'ph9', sha256: 'demo-ph9-oct8', latencySeconds: 5.7 },
  // Demo screens 300-310 (T69): made-up readings (demo/v16Readings.ts) on p01b's stock photo, each its own hash.
  ...['v300', 'v301', 'v302', 'v303', 'v304'].map((id) => ({ ...p01b, id, sha256: `demo-${id}-rescoring`, latencySeconds: 5.5 })),
];

export function demoPhoto(id: string | null | undefined): DemoPhoto | undefined {
  return id ? DEMO_PHOTOS.find((p) => p.id === id) : undefined;
}

/** The order the sample-photos sheet shows them in (the story first, then the rest). */
export const SAMPLE_ORDER = ['p01b', 'p01a', 's24', 's15', 's12', 's25', 's05', 's09', 's10', 's13', 's14', 's22', 'ph1'] as const;

/** What a thread bubble or the viewer shows: a bundled photo (with its crop table) or the
 *  full-frame copy kept on the phone (stored relative to Documents; no crop). */
export interface ShownPhoto {
  id: string;
  source: number | string;
  crop?: DemoPhoto['crop'];
  aspect?: number;
}

export function shownPhoto(photoId: unknown, photoUri: unknown, aspect: unknown): ShownPhoto | undefined {
  const demo = typeof photoId === 'string' ? demoPhoto(photoId) : undefined;
  if (demo) return demo;
  if (typeof photoUri === 'string' && photoUri) {
    const uri = resolveStoredPath(photoUri) ?? photoUri;
    return { id: photoUri, source: uri, aspect: typeof aspect === 'number' ? aspect : undefined };
  }
  return undefined;
}

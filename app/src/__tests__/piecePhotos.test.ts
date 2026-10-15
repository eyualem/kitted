// His photos of a piece (#276): every crop starts below his head (the stored heads, a demo photo's chin line, or a
// conservative line when nothing is known), a mirror selfie is flipped, and the page's list keeps his cover first,
// drops removed photos (and the same photo re-checked), shows each photo once and folds the mostly hidden ones.
import type { ClosetObservationRow } from '@/data/types';
import { HEAD_PAD, MIN_SHOWN, UNKNOWN_HEAD_SKIP, cropTop, demoHeads, isMirrorReading, storedHeads } from '@/features/closet/cropSafety';
import { cropLayout } from '@/features/closet/cropLayout';
import { photoCheckOf, piecePhotos, type PhotoCheck } from '@/features/closet/piecePhotos';

describe('cropTop: the first row a crop may show', () => {
  const tee = [300, 300, 600, 700];
  it('below the box top (a 3% inset) when the photo has no head', () => {
    expect(cropTop(tee, 'top', [])).toBe(309);
  });

  it('below his head when the head sits over the crop (a hood up, a box drawn high)', () => {
    expect(cropTop(tee, 'top', [[200, 420, 340, 580]])).toBe(340 + HEAD_PAD);
  });

  it("a head beside the crop's columns (another person) or wholly below the piece doesn't move it", () => {
    expect(cropTop(tee, 'top', [[200, 900, 340, 990]])).toBe(309);
    expect(cropTop([100, 300, 300, 700], 'top', [[700, 400, 800, 600]])).toBe(106);
  });

  it('no crop at all when too little of the piece would be left', () => {
    expect(cropTop(tee, 'top', [[200, 400, 560, 600]])).toBeNull();
    expect(cropTop([300, 300, 300, 700], 'top', [])).toBeNull();
    expect(cropTop([1, 2, 3], 'top', [])).toBeNull();
  });

  it('heads not known (an older check): a top or a layer skips the top quarter of its box; pants and shoes keep the inset', () => {
    expect(cropTop(tee, 'top', null)).toBe(300 + UNKNOWN_HEAD_SKIP * 300);
    expect(cropTop(tee, 'outerwear', undefined)).toBe(375);
    expect(cropTop([500, 380, 980, 620], 'bottom', null)).toBe(514);
    expect(cropTop([900, 100, 960, 900], 'footwear', null)).toBe(902);
  });

  it('what is left always keeps a fair share of the piece', () => {
    for (const heads of [null, [], [[100, 0, 400, 1000]]]) {
      for (const box of [[300, 300, 600, 700], [180, 250, 520, 750], [350, 200, 900, 800]]) {
        const top = cropTop(box, 'top', heads);
        if (top !== null) expect(box[2]! + 0.08 * (box[2]! - box[0]!) - top).toBeGreaterThanOrEqual(MIN_SHOWN * (box[2]! - box[0]!) - 1);
      }
    }
  });

  it('a demo photo uses its chin line as the head; stored heads are checked', () => {
    expect(demoHeads(0.315)).toEqual([[0, 0, 315, 1000]]);
    expect(cropTop([286, 321, 534, 663], 'top', demoHeads(0.315))).toBe(315 + HEAD_PAD);
    expect(demoHeads(undefined)).toBeNull();
    expect(storedHeads([[1, 2, 3, 4]])).toEqual([[1, 2, 3, 4]]);
    expect(storedHeads([])).toEqual([]);
    expect(storedHeads(undefined)).toBeNull();
    expect(storedHeads([[1, 2, 3]])).toBeNull();
  });

  it('a mirror selfie is the reading scene flag', () => {
    expect(isMirrorReading({ scene: { mirror_selfie: true } })).toBe(true);
    expect(isMirrorReading({ scene: { mirror_selfie: false } })).toBe(false);
    expect(isMirrorReading(null)).toBe(false);
  });
});

describe('cropLayout with a head line: nothing above it ever shows', () => {
  const frames = [[120, 120], [150, 172], [300, 200], [370, 370]];
  const boxes = [[180, 250, 520, 750], [300, 300, 600, 700], [900, 100, 960, 900], [600, 0, 1000, 300]];
  it.each(boxes.map((b) => [b.join(','), b] as const))('box %s', (_, box) => {
    const line = box[0]! + Math.round(0.2 * (box[2]! - box[0]!));
    for (const [w, h] of frames) {
      const { imgH, top, hideAbove, piece } = cropLayout(box, 0.75, w!, h!, line);
      const firstShown = (Math.max(0, hideAbove) - top) / imgH;
      expect(firstShown).toBeGreaterThanOrEqual(line / 1000 - 1e-9);
      expect(piece.top).toBeGreaterThanOrEqual(hideAbove - 1e-9);
    }
  });
});

const obs = (o: Partial<ClosetObservationRow> & { id: string; box?: number[] }): ClosetObservationRow => ({
  itemId: 'C-1', fitCheckId: 'F-1', readingId: null, closetReadingId: null, garmentIndex: 0, origin: 'garment', garment: { category: 'top' },
  closet: { visible: true, box: o.box ?? [300, 300, 600, 700] } as ClosetObservationRow['closet'],
  sampledHex: null, sampledL: null, cropFile: null, cropQuality: null, decision: 'same', identityScore: null, candidates: [], askItemId: null,
  answeredAt: null, userConfirmed: null, createdAt: 0, isDeleted: false, ...o,
} as ClosetObservationRow);

describe('piecePhotos: the piece page list', () => {
  const pc = (id: string, o: Partial<PhotoCheck> = {}): [string, PhotoCheck] => [id, {
    id, photoFile: `photos/${id}.jpg`, demoPhotoId: null, imageHash: `h-${id}`, createdAt: 0, heads: [], mirrored: false, ...o,
  }];
  const checks = new Map<string, PhotoCheck>([
    pc('F-1'), pc('F-2', { mirrored: true }), pc('F-3'), pc('F-1r', { imageHash: 'h-F-1' }), pc('F-demo', { photoFile: null, demoPhotoId: 'p01b' }),
  ]);
  const deps = {
    resolve: (p: string) => `file:///docs/${p}`, exists: () => true,
    demo: (id: string) => (id === 'p01b' ? { source: 7, aspect: 0.666, neck: 0.315 } : undefined),
  };
  const sightings = [
    obs({ id: 'O-1', fitCheckId: 'F-1', box: [300, 300, 600, 700], cropQuality: 0.9 }),
    obs({ id: 'O-2', fitCheckId: 'F-2', cropQuality: 0.8 }),
    obs({ id: 'O-3', fitCheckId: 'F-3', cropQuality: 0.3 }),
    obs({ id: 'O-1r', fitCheckId: 'F-1r', cropQuality: 0.95 }),
  ];
  const item = (p: Record<string, unknown> = {}) => ({ id: 'C-1', profile: { aliases: [], distinctFrom: [], confirmed: {}, ...p } });

  it('best first, each photo once (the same photo re-checked), the mostly hidden one folded, the first marked cover', () => {
    const { shown, folded } = piecePhotos(item(), sightings, checks, deps);
    expect(shown.map((p) => p.obsId)).toEqual(['O-1r', 'O-2']);
    expect(shown.map((p) => p.cover)).toEqual([true, false]);
    expect(folded.map((p) => p.obsId)).toEqual(['O-3']);
    expect(shown[1]!.mirrored).toBe(true);
    expect(shown[0]!.source).toBe('file:///docs/photos/F-1r.jpg');
  });

  it('his cover leads, even a partly hidden one he picked', () => {
    expect(piecePhotos(item({ coverObsId: 'O-2' }), sightings, checks, deps).shown.map((p) => p.obsId)).toEqual(['O-2', 'O-1r']);
    const r = piecePhotos(item({ coverObsId: 'O-3' }), sightings, checks, deps);
    expect(r.shown.map((p) => p.obsId)).toEqual(['O-3', 'O-1r', 'O-2']);
    expect(r.folded).toEqual([]);
    // the cover on a photo shown under another sighting of it (re-checked) still leads
    expect(piecePhotos(item({ coverObsId: 'O-1' }), sightings, checks, deps).shown[0]!.obsId).toBe('O-1r');
  });

  it('a removed photo is gone, with the same photo re-checked; the others stay', () => {
    const { shown, folded } = piecePhotos(item({ hiddenObsIds: ['O-1'] }), sightings, checks, deps);
    expect([...shown, ...folded].map((p) => p.obsId)).toEqual(['O-2', 'O-3']);
  });

  it('shoes are never folded (every full-body shoe crop is small); a demo photo uses its chin line', () => {
    const shoes = [obs({ id: 'S-1', garment: { category: 'footwear' }, box: [900, 300, 990, 700], cropQuality: 0.1 })];
    expect(piecePhotos(item(), shoes, checks, deps).shown.map((p) => p.obsId)).toEqual(['S-1']);
    const demo = piecePhotos(item(), [obs({ id: 'D-1', fitCheckId: 'F-demo', box: [286, 321, 534, 663] })], checks, deps).shown[0]!;
    expect(demo).toMatchObject({ source: 7, uri: null, aspect: 0.666, top: 330 });
    expect(piecePhotos(item(), [obs({ id: 'D-1', fitCheckId: 'F-demo' })], checks, { ...deps, demo: undefined }).shown).toEqual([]);
  });

  it('photoCheckOf reads the stored heads off the closet summary', () => {
    const row = { id: 'F-9', photoFile: 'p.jpg', demoPhotoId: null, imageHash: 'h', createdAt: 5, details: { closetSummary: { matched: [], added: [], undone: [], heads: [[1, 2, 3, 4]] } } };
    expect(photoCheckOf(row, true)).toEqual({ id: 'F-9', photoFile: 'p.jpg', demoPhotoId: null, imageHash: 'h', createdAt: 5, heads: [[1, 2, 3, 4]], mirrored: true });
    expect(photoCheckOf({ ...row, details: {} }, false).heads).toBeNull();
  });
});

// The Closet long-press preview (founder, Oct 14; #276): his real photo cropped to the piece and outlined (never the
// cut-out alone), else the drawing; and the no-face rule: the crop never shows anything above the piece's box, nor
// above his head.
import type { ClosetObservationRow } from '@/data/types';
import { KEPT_ASPECT, PREVIEW_MAX, piecePreviewSource, previewFrame } from '@/features/closet/piecePreview';
import type { PhotoCheck } from '@/features/closet/piecePhotos';

const obs = (o: Partial<ClosetObservationRow> & { id: string; box?: number[] | null }): ClosetObservationRow => ({
  itemId: 'C-1', fitCheckId: 'F-1', readingId: null, closetReadingId: null, garmentIndex: 0, origin: 'garment', garment: { category: 'top' },
  closet: o.box === null ? null : ({ visible: true, box: o.box ?? [300, 300, 600, 700] } as ClosetObservationRow['closet']),
  sampledHex: null, sampledL: null, cropFile: null, cropQuality: null, decision: 'same', identityScore: null, candidates: [], askItemId: null,
  answeredAt: null, userConfirmed: null, createdAt: 0, isDeleted: false, ...o,
} as ClosetObservationRow);

const files = new Set(['file:///docs/closet/a-garment-0.png', 'file:///docs/photos/a-photo.jpg', 'file:///docs/photos/b-photo.jpg']);
const deps = { resolve: (p: string) => `file:///docs/${p}`, exists: (u: string) => files.has(u) };
const check = (id: string, o: Partial<PhotoCheck> = {}): [string, PhotoCheck] => [id, {
  id, photoFile: null, demoPhotoId: null, imageHash: `h-${id}`, createdAt: 0, heads: [], mirrored: false, ...o,
}];
const checks = new Map<string, PhotoCheck>([
  check('F-1', { photoFile: 'photos/a-photo.jpg' }),
  check('F-2', { photoFile: 'photos/b-photo.jpg' }),
  check('F-demo', { demoPhotoId: 'p01b' }),
  check('F-gone', { photoFile: 'photos/gone.jpg' }),
  check('F-mirror', { photoFile: 'photos/b-photo.jpg', mirrored: true, imageHash: 'h-mirror' }),
]);
const item = { id: 'C-1', profile: null };

describe('which picture the preview shows', () => {
  it('never the cut-out alone (#276): a clean cut-out still shows his photo, outlined', () => {
    const o = [obs({ id: 'O-1', cropFile: 'closet/a-garment-0.png', cropQuality: 0.95 })];
    expect(piecePreviewSource(item, o, checks, deps)).toEqual({
      kind: 'photo', uri: 'file:///docs/photos/a-photo.jpg', box: [300, 300, 600, 700], aspect: KEPT_ASPECT, top: 309, mirrored: false,
    });
  });

  it('the best sighting (biggest box) is the photo used; demo photos and deleted photos are skipped', () => {
    const o = [
      obs({ id: 'O-1', fitCheckId: 'F-1', box: [400, 400, 500, 500] }),
      obs({ id: 'O-2', fitCheckId: 'F-2', box: [200, 200, 800, 800] }),
      obs({ id: 'O-3', fitCheckId: 'F-demo', box: [0, 0, 1000, 1000] }),
      obs({ id: 'O-4', fitCheckId: 'F-gone', box: [0, 0, 990, 990] }),
    ];
    expect(piecePreviewSource(item, o, checks, deps)).toMatchObject({ kind: 'photo', uri: 'file:///docs/photos/b-photo.jpg', box: [200, 200, 800, 800] });
  });

  it('his cover leads; a mirror selfie is flagged to flip', () => {
    const o = [obs({ id: 'O-1', fitCheckId: 'F-1', box: [200, 200, 800, 800] }), obs({ id: 'O-2', fitCheckId: 'F-mirror', box: [400, 400, 500, 500] })];
    expect(piecePreviewSource({ id: 'C-1', profile: { aliases: [], distinctFrom: [], confirmed: {}, coverObsId: 'O-2' } }, o, checks, deps))
      .toMatchObject({ kind: 'photo', uri: 'file:///docs/photos/b-photo.jpg', mirrored: true });
  });

  it('the drawing, larger, when there is no photo of it: a demo piece, a scanned or described piece, an unseen box', () => {
    expect(piecePreviewSource(item, [obs({ id: 'O-1', fitCheckId: 'F-demo' })], checks, deps)).toEqual({ kind: 'drawn' });
    expect(piecePreviewSource(item, [obs({ id: 'O-1', fitCheckId: null, origin: 'describe' })], checks, deps)).toEqual({ kind: 'drawn' });
    expect(piecePreviewSource(item, [obs({ id: 'O-1', box: null })], checks, deps)).toEqual({ kind: 'drawn' });
    expect(piecePreviewSource(item, [], checks, deps)).toEqual({ kind: 'drawn' });
  });

  it("an undone sighting, another piece's sighting, a removed photo or a shoe snap never supplies the picture", () => {
    const o = [
      obs({ id: 'O-1', decision: 'undone' }), obs({ id: 'O-2', itemId: 'C-2' }), obs({ id: 'O-3', isDeleted: true }),
      obs({ id: 'O-4', origin: 'snap', fitCheckId: 'F-2' }),
    ];
    expect(piecePreviewSource(item, o, checks, deps)).toEqual({ kind: 'drawn' });
    const hidden = { id: 'C-1', profile: { aliases: [], distinctFrom: [], confirmed: {}, hiddenObsIds: ['O-5'] } };
    expect(piecePreviewSource(hidden, [obs({ id: 'O-5' })], checks, deps)).toEqual({ kind: 'drawn' });
  });
});

describe('the photo crop shows nothing above the piece, nor above his head (no face)', () => {
  // tops start at the neck, bottoms at the waist; shoes are wide; plus tiny, edge and full-frame boxes
  const boxes = [
    [180, 250, 520, 750], [200, 100, 560, 900], [480, 300, 900, 700], [500, 380, 980, 620], [880, 300, 990, 700],
    [900, 100, 960, 900], [0, 0, 1000, 1000], [10, 0, 400, 1000], [450, 480, 470, 520], [600, 0, 1000, 300],
  ];
  it.each(boxes.map((b) => [b.join(','), b] as const))('box %s', (_, box) => {
    for (const top of [undefined, box[0]! + Math.round(0.2 * (box[2]! - box[0]!))]) {
      const f = previewFrame(box, KEPT_ASPECT, top);
      expect(Math.max(f.width, f.height)).toBeLessThanOrEqual(PREVIEW_MAX);
      expect(Math.min(f.width, f.height)).toBeGreaterThan(100);
      // the first photo row the preview shows (below any painted band) is at or below the piece's top and the head line
      const firstShownRow = (Math.max(0, f.hideAbove) - f.top) / f.imgH;
      expect(firstShownRow).toBeGreaterThanOrEqual(Math.max(box[0]!, top ?? 0) / 1000 - 1e-9);
    }
  });
});

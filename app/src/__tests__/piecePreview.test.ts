// The Closet long-press preview (founder, Oct 14): which picture it shows (cut-out → his photo cropped to the piece →
// the drawing), and the no-face rule: the photo crop never shows anything above the piece's box.
import type { ClosetObservationRow } from '@/data/types';
import { CUTOUT_MIN_QUALITY, KEPT_ASPECT, PREVIEW_MAX, checksById, piecePreviewSource, previewFrame } from '@/features/closet/piecePreview';

const obs = (o: Partial<ClosetObservationRow> & { id: string; box?: number[] | null }): ClosetObservationRow => ({
  itemId: 'C-1', fitCheckId: 'F-1', readingId: null, closetReadingId: null, garmentIndex: 0, origin: 'garment', garment: { category: 'top' },
  closet: o.box === null ? null : ({ visible: true, box: o.box ?? [300, 300, 600, 700] } as ClosetObservationRow['closet']),
  sampledHex: null, sampledL: null, cropFile: null, cropQuality: null, decision: 'same', identityScore: null, candidates: [], askItemId: null,
  answeredAt: null, userConfirmed: null, createdAt: 0, isDeleted: false, ...o,
} as ClosetObservationRow);

const files = new Set(['file:///docs/closet/a-garment-0.png', 'file:///docs/photos/a-photo.jpg', 'file:///docs/photos/b-photo.jpg']);
const deps = { resolve: (p: string) => `file:///docs/${p}`, exists: (u: string) => files.has(u) };
const checks = checksById([
  { id: 'F-1', photoFile: 'photos/a-photo.jpg', demoPhotoId: null },
  { id: 'F-2', photoFile: 'photos/b-photo.jpg', demoPhotoId: null },
  { id: 'F-demo', photoFile: null, demoPhotoId: 'p01b' },
  { id: 'F-gone', photoFile: 'photos/gone.jpg', demoPhotoId: null },
]);

describe('which picture the preview shows', () => {
  it('the measured cut-out first, when it is clean enough and still on the phone', () => {
    const o = [obs({ id: 'O-1', cropFile: 'closet/a-garment-0.png', cropQuality: CUTOUT_MIN_QUALITY })];
    expect(piecePreviewSource('C-1', o, checks, deps)).toEqual({ kind: 'cutout', uri: 'file:///docs/closet/a-garment-0.png' });
  });

  it('a patchy cut-out or a missing file falls back to his photo cropped to the piece', () => {
    const patchy = [obs({ id: 'O-1', cropFile: 'closet/a-garment-0.png', cropQuality: CUTOUT_MIN_QUALITY - 0.01 })];
    expect(piecePreviewSource('C-1', patchy, checks, deps)).toEqual({ kind: 'photo', uri: 'file:///docs/photos/a-photo.jpg', box: [300, 300, 600, 700], aspect: KEPT_ASPECT });
    const gone = [obs({ id: 'O-1', cropFile: 'closet/missing.png', cropQuality: 0.9 })];
    expect(piecePreviewSource('C-1', gone, checks, deps).kind).toBe('photo');
  });

  it('the best sighting (biggest box) is the photo used; demo photos and deleted photos are skipped', () => {
    const o = [
      obs({ id: 'O-1', fitCheckId: 'F-1', box: [400, 400, 500, 500] }),
      obs({ id: 'O-2', fitCheckId: 'F-2', box: [200, 200, 800, 800] }),
      obs({ id: 'O-3', fitCheckId: 'F-demo', box: [0, 0, 1000, 1000] }),
      obs({ id: 'O-4', fitCheckId: 'F-gone', box: [0, 0, 990, 990] }),
    ];
    expect(piecePreviewSource('C-1', o, checks, deps)).toMatchObject({ kind: 'photo', uri: 'file:///docs/photos/b-photo.jpg', box: [200, 200, 800, 800] });
  });

  it('the drawing, larger, when there is no photo of it: a demo piece, a scanned or described piece, an unseen box', () => {
    expect(piecePreviewSource('C-1', [obs({ id: 'O-1', fitCheckId: 'F-demo' })], checks, deps)).toEqual({ kind: 'drawn' });
    expect(piecePreviewSource('C-1', [obs({ id: 'O-1', fitCheckId: null, origin: 'describe' })], checks, deps)).toEqual({ kind: 'drawn' });
    expect(piecePreviewSource('C-1', [obs({ id: 'O-1', box: null })], checks, deps)).toEqual({ kind: 'drawn' });
    expect(piecePreviewSource('C-1', [], checks, deps)).toEqual({ kind: 'drawn' });
  });

  it("an undone sighting or another piece's sighting never supplies the picture", () => {
    const o = [obs({ id: 'O-1', decision: 'undone' }), obs({ id: 'O-2', itemId: 'C-2' }), obs({ id: 'O-3', isDeleted: true })];
    expect(piecePreviewSource('C-1', o, checks, deps)).toEqual({ kind: 'drawn' });
  });
});

describe('the photo crop shows nothing above the piece (no face)', () => {
  // tops start at the neck, bottoms at the waist; shoes are wide; plus tiny, edge and full-frame boxes
  const boxes = [
    [180, 250, 520, 750], [200, 100, 560, 900], [480, 300, 900, 700], [500, 380, 980, 620], [880, 300, 990, 700],
    [900, 100, 960, 900], [0, 0, 1000, 1000], [10, 0, 400, 1000], [450, 480, 470, 520], [600, 0, 1000, 300],
  ];
  it.each(boxes.map((b) => [b.join(','), b] as const))('box %s', (_, box) => {
    const f = previewFrame(box, KEPT_ASPECT);
    expect(Math.max(f.width, f.height)).toBeLessThanOrEqual(PREVIEW_MAX);
    expect(Math.min(f.width, f.height)).toBeGreaterThan(100);
    // the first photo row the preview shows (below any painted band) is at or below the piece's top edge
    const firstShownRow = (Math.max(0, f.hideAbove) - f.top) / f.imgH;
    expect(firstShownRow).toBeGreaterThanOrEqual(box[0]! / 1000 - 1e-9);
  });
});

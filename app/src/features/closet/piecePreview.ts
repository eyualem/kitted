// What the Closet long-press preview shows (founder, Oct 14): his own photo of the piece, never anything above it.
// Best first: the measured cut-out of its best sighting (#104: only the piece's own pixels, heads and hands removed),
// else his kept photo cropped to the piece's box the way the question card crops it (#117: no margin above the box,
// so no face), else the drawn tile, larger (a piece he scanned or described, a demo piece, or no usable sighting).
// Pure; the hook that feeds it lives with the menu.
import type { ClosetObservationRow, FitCheckRow } from '@/data/types';
import { cropLayout } from './cropLayout';
import { isLive } from './profile';

/** A cut-out below this measured quality (cropQuality, 0–1) has too many holes to show; the photo crop is used. */
export const CUTOUT_MIN_QUALITY = 0.6;

export type PiecePreview =
  | { kind: 'cutout'; uri: string }
  | { kind: 'photo'; uri: string; box: number[]; aspect: number }
  | { kind: 'drawn' };

type Check = Pick<FitCheckRow, 'photoFile' | 'demoPhotoId'>;

export interface PreviewDeps {
  /** A stored path (relative to Documents) → a file:// URL, or null. */
  resolve: (stored: string) => string | null;
  /** Whether a file:// URL is still on the phone (a cut-out or a kept photo can be gone). */
  exists: (uri: string) => boolean;
}

const boxOf = (o: ClosetObservationRow): number[] | null => (o.closet?.visible && o.closet.box.length === 4 ? o.closet.box : null);
const area = (b: readonly number[]) => (b[2]! - b[0]!) * (b[3]! - b[1]!);

/** A piece's best sighting with a photo (the question card's too, #117): the cleanest crop measured, else the biggest box. */
export function bestSighting(itemId: string, obs: readonly ClosetObservationRow[]): ClosetObservationRow | null {
  return rankedSightings(itemId, obs)[0] ?? null;
}

/** A piece's live sightings with a photo and a box, best first (bestSighting's order). */
export function rankedSightings(itemId: string, obs: readonly ClosetObservationRow[]): ClosetObservationRow[] {
  const mine = obs.filter((o) => o.itemId === itemId && isLive(o) && o.fitCheckId && boxOf(o));
  return mine.sort((a, b) => (b.cropQuality ?? -1) - (a.cropQuality ?? -1) || area(boxOf(b)!) - area(boxOf(a)!) || (a.id < b.id ? -1 : 1));
}

/** Kept photos are 3:4 portrait (12 MP, #83). */
export const KEPT_ASPECT = 0.75;

export function piecePreviewSource(
  itemId: string, obs: readonly ClosetObservationRow[], checks: ReadonlyMap<string, Check>, deps: PreviewDeps,
): PiecePreview {
  const ranked = rankedSightings(itemId, obs);
  // 1. the cleanest cut-out (ranked by measured quality first)
  const best = ranked[0];
  if (best?.cropFile && (best.cropQuality ?? 0) >= CUTOUT_MIN_QUALITY) {
    const uri = deps.resolve(best.cropFile);
    if (uri && deps.exists(uri)) return { kind: 'cutout', uri };
  }
  // 2. his kept photo cropped to the piece: best sighting first, skipping demo photos and missing files
  for (const o of ranked) {
    const check = checks.get(o.fitCheckId!);
    if (!check || check.demoPhotoId || !check.photoFile) continue;
    const uri = deps.resolve(check.photoFile);
    if (uri && deps.exists(uri)) return { kind: 'photo', uri, box: [...boxOf(o)!], aspect: KEPT_ASPECT };
  }
  return { kind: 'drawn' };
}

/** The preview's longest side, in points. */
export const PREVIEW_MAX = 300;
const MIN_ASPECT = 0.6, MAX_ASPECT = 1.6;

/**
 * The photo preview's frame and the image's placement in it. The frame takes the piece region's own shape (within
 * 0.6–1.6 wide-to-tall), so the region covers it and the frame's top edge sits at or below the piece's top: nothing
 * above the piece shows. A region wider than 1.6 (a pair of shoes) is fitted to the frame's width as on the
 * question card; `hideAbove` then says how much of the frame's top is painted solid. Pure.
 */
export function previewFrame(box: readonly number[], aspect: number) {
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  const [y0, x0, y1, x1] = box.map((v) => v / 1000) as [number, number, number, number];
  const bw = x1 - x0, bh = y1 - y0;
  // the same region cropLayout uses
  const rw = (clamp(x1 + 0.25 * bw) - clamp(x0 - 0.25 * bw)) * aspect;
  const rh = clamp(y1 + 0.08 * bh) - clamp(y0 + 0.03 * bh);
  const r = Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, rh > 0 ? rw / rh : 1));
  const width = Math.round(r >= 1 ? PREVIEW_MAX : PREVIEW_MAX * r);
  const height = Math.round(r >= 1 ? PREVIEW_MAX / r : PREVIEW_MAX);
  return { width, height, ...cropLayout(box, aspect, width, height) };
}

/** Index checks by id (for piecePreviewSource). */
export function checksById(rows: readonly (Check & { id: string })[]): Map<string, Check> {
  return new Map(rows.map((r) => [r.id, r]));
}

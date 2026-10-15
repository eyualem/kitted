// What the Closet long-press preview shows (founder, Oct 14; #276): his real photo of the piece with the piece
// outlined, the piece page's first photo (his cover, else the best), cropped below his head and true-view for a mirror
// selfie (cropSafety); else the drawn tile, larger (a piece he scanned or described, a bundled demo photo, or no
// usable sighting). Never the cut-out alone (#276: cut-outs stay on disk for matching and measured color only).
// Pure; the hook that feeds it lives with the menu.
import type { ClosetItemRow, ClosetObservationRow } from '@/data/types';
import { cropLayout } from './cropLayout';
import { KEPT_ASPECT, piecePhotos, rankedSightings, type PhotoCheck, type PhotoDeps } from './piecePhotos';

export { KEPT_ASPECT, rankedSightings };

export type PiecePreview =
  | { kind: 'photo'; uri: string; box: number[]; aspect: number; top: number; mirrored: boolean }
  | { kind: 'drawn' };

export type PreviewDeps = Pick<PhotoDeps, 'resolve' | 'exists'>;

/** A piece's best sighting with a photo (the question card's too, #117): the cleanest crop measured, else the biggest box. */
export function bestSighting(itemId: string, obs: readonly ClosetObservationRow[]): ClosetObservationRow | null {
  return rankedSightings(itemId, obs)[0] ?? null;
}

export function piecePreviewSource(
  item: Pick<ClosetItemRow, 'id' | 'profile'>, obs: readonly ClosetObservationRow[], checks: ReadonlyMap<string, PhotoCheck>, deps: PreviewDeps,
): PiecePreview {
  // The native preview needs a file on the phone: bundled demo photos aren't offered (no `demo` dep).
  const first = piecePhotos(item, obs, checks, { resolve: deps.resolve, exists: deps.exists }).shown[0];
  if (first?.uri) return { kind: 'photo', uri: first.uri, box: first.box, aspect: first.aspect, top: first.top, mirrored: first.mirrored };
  return { kind: 'drawn' };
}

/** The preview's longest side, in points. */
export const PREVIEW_MAX = 300;
const MIN_ASPECT = 0.6, MAX_ASPECT = 1.6;

/**
 * The photo preview's frame and the image's placement in it. The frame takes the piece region's own shape (within
 * 0.6–1.6 wide-to-tall), so the region covers it and the frame's top edge sits at or below the piece's top (and
 * below his head, `top`): nothing above shows. A region wider than 1.6 (a pair of shoes) is fitted to the frame's
 * width as on the question card; `hideAbove` then says how much of the frame's top is painted solid. Pure.
 */
export function previewFrame(box: readonly number[], aspect: number, top?: number | null) {
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  const [y0, x0, y1, x1] = box.map((v) => v / 1000) as [number, number, number, number];
  const bw = x1 - x0, bh = y1 - y0;
  const limit = typeof top === 'number' ? clamp(top / 1000) : 0;
  // the same region cropLayout uses
  const rw = (clamp(x1 + 0.25 * bw) - clamp(x0 - 0.25 * bw)) * aspect;
  const rh = clamp(y1 + 0.08 * bh) - Math.max(clamp(y0 + 0.03 * bh), limit);
  const r = Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, rh > 0 ? rw / rh : 1));
  const width = Math.round(r >= 1 ? PREVIEW_MAX : PREVIEW_MAX * r);
  const height = Math.round(r >= 1 ? PREVIEW_MAX / r : PREVIEW_MAX);
  return { width, height, ...cropLayout(box, aspect, width, height, top) };
}

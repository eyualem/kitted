// Where a piece's drawing sits in its tile (09-ui-review §7 C4). Tops and pants fill `scale` of the tile's shorter
// side, as before. A shoe is drawn side-on (toe to the right) in a short, wide band of its 200 × 200 viewBox (about
// 85% of its width, under 60% of its height), so the same box made shoes look small next to a top: shoes get a box
// sized on the tile's width instead, large enough that the shoe itself spans at least 80% of the tile, nudged up so
// the shoe (which sits low in its viewBox) is centered. Pure.
import type { ArtShape } from './artSpec';

/** A shoe's box against the tile width, relative to `scale` (0.8 → 0.96 of the width). */
const SHOE_BOOST = 1.2;
/** A shoe sits below the middle of its viewBox (its sole near y 160 of 200): move it up by this share of its box. */
const SHOE_LIFT = 0.12;

/** The drawing's square box (`size`, centered in the tile) and its vertical nudge (`dy`, points; negative = up). */
export function tileArtBox(shape: ArtShape, w: number, h: number, scale = 0.8): { size: number; dy: number } {
  if (shape !== 'shoe') return { size: Math.round(Math.min(w, h) * scale), dy: 0 };
  const size = Math.round(w * Math.min(1, scale * SHOE_BOOST));
  return { size, dy: -Math.round(size * SHOE_LIFT * 10) / 10 };
}

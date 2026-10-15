// No face, ever, in a crop of his photo (#117, #274 item 5, #276). His kept photo is unblurred, so every crop of it
// (the piece page, the long-press preview, the closet question) starts below his head, and a mirror selfie's crop is
// flipped back to true view like its cut-out (#109), so a logo reads the right way. Pure; no UI or store imports.
//
// Where the head is:
// - a check the phone measured since #276 stores every head it found on the kept photo (closetSummary.heads, the
//   measurer's own head boxes, already grown to the whole head and chin): the crop starts HEAD_PAD below the lowest
//   head that sits over the crop's columns;
// - a bundled demo photo has its chin line (the mockup's crop table): the same rule, with that line as the head;
// - anything else (older checks, before the measurer reported heads): no head position is known, so a top or a layer
//   (the only boxes that can reach the head: a hood up, a scarf, a box drawn high) skips the top quarter of its box,
//   and a crop that would show too little of the piece isn't shown at all (the drawing stands in).

/** [ymin, xmin, ymax, xmax], 0–1000 on the kept photo. */
export type HeadBox = readonly number[];

/** Space left under a head box (0–1000 of the photo's height), so the chin's shadow never shows. */
export const HEAD_PAD = 15;
/** No head position known: a top or a layer skips this share of its box (a hood up is about the box's top fifth). */
export const UNKNOWN_HEAD_SKIP = 0.25;
/** A crop must keep at least this share of the piece's height, or it isn't shown. */
export const MIN_SHOWN = 0.35;

const UPPER: readonly string[] = ['top', 'outerwear'];

/** The crop region's columns and rows (cropLayout's margins: a quarter of the width at each side, 8% below). */
export function regionOf(box: readonly number[]) {
  const c = (v: number) => Math.min(1000, Math.max(0, v));
  const [y0, x0, y1, x1] = box as [number, number, number, number];
  const bw = x1 - x0, bh = y1 - y0;
  return { x0: c(x0 - 0.25 * bw), x1: c(x1 + 0.25 * bw), y0: c(y0 + 0.03 * bh), y1: c(y1 + 0.08 * bh), bh };
}

/**
 * The first photo row (0–1000) a crop of `box` may show, or null when no safe crop keeps enough of the piece.
 * `heads`: the heads found on the photo ([] = none in it); null/undefined = not known (see the file's note).
 */
export function cropTop(box: readonly number[], category: string | null | undefined, heads: readonly HeadBox[] | null | undefined): number | null {
  if (box.length !== 4 || box.some((v) => typeof v !== 'number' || !Number.isFinite(v))) return null;
  const [y0, x0, y1, x1] = box as [number, number, number, number];
  if (!(y1 > y0 && x1 > x0)) return null;
  const r = regionOf(box);
  let top = r.y0;
  if (heads) {
    for (const h of heads) {
      if (h.length !== 4) continue;
      const [hy0, hx0, hy1, hx1] = h as [number, number, number, number];
      if (hx1 <= r.x0 || hx0 >= r.x1) continue; // beside the crop's columns: never in it
      if (hy0 >= r.y1) continue; // wholly below the piece (nothing of it shows above the piece)
      top = Math.max(top, hy1 + HEAD_PAD);
    }
  } else if (UPPER.includes(String(category))) {
    top = Math.max(top, y0 + UNKNOWN_HEAD_SKIP * r.bh);
  }
  if (r.y1 - top < MIN_SHOWN * r.bh) return null;
  return Math.round(top);
}

/** A bundled demo photo's head: everything above its chin line (`neck`, 0–1 of the height). */
export function demoHeads(neck: number | null | undefined): HeadBox[] | null {
  return typeof neck === 'number' && neck > 0 ? [[0, 0, Math.round(neck * 1000), 1000]] : null;
}

/** The heads stored on a check (closetSummary.heads), checked: a list of 4-number boxes, else null (not known). */
export function storedHeads(raw: unknown): HeadBox[] | null {
  if (!Array.isArray(raw)) return null;
  const ok = raw.filter((h): h is number[] => Array.isArray(h) && h.length === 4 && h.every((v) => typeof v === 'number' && Number.isFinite(v)));
  return ok.length === raw.length ? ok : null;
}

/** Whether a photo is a mirror's reflection (the reading's scene; the cut-outs use the same flag, #109). */
export function isMirrorReading(reading: { scene?: { mirror_selfie?: unknown } | null } | null | undefined): boolean {
  return reading?.scene?.mirror_selfie === true;
}

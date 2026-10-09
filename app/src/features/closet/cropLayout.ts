// Where a closet question's photo crop sits (#117): the piece's region, scaled to cover the frame. Pure.
/**
 * The part of the photo to show and where the piece sits in it (frame points). Exported for tests.
 * A region wider than the frame (a pair of shoes: two feet with floor between them) is fitted to the frame's width
 * instead of covering it, or the frame's middle would be only the floor (#183). Then the frame can reach above the
 * piece's top; `hideAbove` is how many points from the frame's top must be painted solid, so nothing above the piece
 * (a face, for a top) ever shows. It is 0 when the region covers the frame.
 */
export function cropLayout(box: readonly number[], aspect: number, width: number, height: number) {
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  const [y0, x0, y1, x1] = box.map((v) => v / 1000) as [number, number, number, number];
  const bw = x1 - x0, bh = y1 - y0;
  // A margin at the sides and below; none above (and a little inset), so nothing over the piece shows.
  const rx0 = clamp(x0 - 0.25 * bw), rx1 = clamp(x1 + 0.25 * bw);
  const ry0 = clamp(y0 + 0.03 * bh), ry1 = clamp(y1 + 0.08 * bh);
  const fitW = width / ((rx1 - rx0) * aspect), coverH = height / (ry1 - ry0);
  // Cover: the region fills the frame in its tighter direction, so what shows is always inside the region.
  // Wide: the region's full width fills the frame; the rest of the height shows what's below it, or the background.
  const wide = fitW < coverH;
  const k = wide ? fitW : Math.max(fitW, coverH);
  const imgW = aspect * k, imgH = k;
  const left = width / 2 - ((rx0 + rx1) / 2) * imgW;
  const top = height / 2 - ((ry0 + ry1) / 2) * imgH;
  const hideAbove = Math.max(0, top + y0 * imgH);
  const piece = {
    left: Math.max(0, left + x0 * imgW), top: Math.max(0, top + y0 * imgH),
    right: Math.min(width, left + x1 * imgW), bottom: Math.min(height, top + y1 * imgH),
  };
  return { imgW, imgH, left, top, piece, hideAbove };
}

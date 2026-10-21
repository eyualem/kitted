// When the Latest pill shows (02 G3, 07 §6.1; 09-ui-review §23 L1, #353): he has scrolled up more than one screen from
// the end, or scrolled up at all while new rows or words arrived below. Inside the "at the bottom" band (the same 80 pt
// the thread uses to decide whether to follow) it never shows.
export const AT_BOTTOM_PT = 80;

export function latestPillShows(o: { contentH: number; viewH: number; offsetY: number; newBelow: boolean }): boolean {
  if (o.contentH <= 0 || o.viewH <= 0) return false;
  const fromEnd = o.contentH - o.offsetY - o.viewH;
  if (fromEnd < AT_BOTTOM_PT) return false;
  return fromEnd > o.viewH || o.newBelow;
}

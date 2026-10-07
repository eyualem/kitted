// "Not quite right?" corrections (spec 04 §7; port of kitted_logic.apply_correction / correction_line).
// A correction makes a NEW reading with one field changed; the original is never edited. Re-score it with score().

import type { Garment, Reading } from "./types";
import { clone } from "./util";

export function applyCorrection<K extends keyof Garment & string>(
  reading: Reading, garmentIndex: number, field: K, value: Garment[K],
): Reading {
  const r = clone(reading);
  const g = r.garments[garmentIndex];
  if (!g) throw new RangeError(`no garment at index ${garmentIndex}`);
  g[field] = value;
  return r;
}

/** "Score stays 8.0" or "Updated 8.5 ↑0.5" (display scores, one decimal). */
export function correctionLine(before: number, after: number): string {
  if (before === after) return `Score stays ${after.toFixed(1)}`;
  const d = after - before;
  return `Updated ${after.toFixed(1)} ${d > 0 ? "↑" : "↓"}${Math.abs(d).toFixed(1)}`;
}

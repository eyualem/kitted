// The colors the scoring rules allow (T103, spec KC3.3). The engine decides; this file copies no rule.
// For each of the 24 colors, put the piece in it, score the outfit with the live engine and add up every point taken off.
// The colors that cost no more than the cheapest one are the ones the rules would not mark down.

import { FAMILY_HEX } from "./closetColor";
import { defaultParts, type PartsEngine } from "./parts";
import { outfitReading } from "./rotation";
import type { Boldness, ClosetItem, ColorFamily, Garment, Loose } from "./types";

/** The 24 families a color can be proposed in: the app's palette order (FAMILY_HEX keys) without "multicolor". */
export const COLOR_CHOICES: readonly ColorFamily[] = Object.keys(FAMILY_HEX).filter((f) => f !== "multicolor") as ColorFamily[];

export interface AllowedColorsInput {
  /** The outfit's other pieces, as garments. May be empty. */
  others: readonly Garment[];
  /** The piece being asked about. Its `color_family` and `saturation` are ignored (they describe the old color). */
  piece: Garment;
  /** Default "everyday". Passed to the engine as is. */
  occasion?: string;
  /** Default "a_little". Passed to the engine as is. */
  boldness?: Loose<Boldness>;
}

export interface AllowedColorsEngines {
  /** Default `defaultParts` (so the list follows the app's scoring switches). */
  parts?: PartsEngine;
}

/** Two costs this close are the same cost (0.1 + 0.2 and 0.3). */
const TOLERANCE = 1e-9;

const wrap = (garment: Garment, i: number): ClosetItem => ({
  id: String(i), name: "", slot: String(garment.category ?? ""), garment,
});

/** The families the scoring rules would not mark down on `piece` in this outfit, in COLOR_CHOICES order. [] if the engine fails. */
export function allowedColors(input: AllowedColorsInput, engines?: AllowedColorsEngines): ColorFamily[] {
  const engine = engines?.parts ?? defaultParts;
  const occasion = input.occasion ?? "everyday";
  const boldness = input.boldness ?? "a_little";
  try {
    const costs = new Map<ColorFamily, number>();
    for (const color of COLOR_CHOICES) {
      const candidate: Garment = { ...input.piece, color_family: color };
      delete candidate.saturation;
      const items = [...input.others, candidate].map(wrap);
      const result = engine.scoreParts(outfitReading(items), { occasion, boldness });
      let cost = 0;
      if (result.overall !== null) {
        for (const part of Object.values(result.parts)) {
          for (const reason of part?.reasons ?? []) {
            if (reason.points < 0) cost -= reason.points;
          }
        }
      }
      costs.set(color, cost);
    }
    const best = Math.min(...costs.values());
    return COLOR_CHOICES.filter((c) => (costs.get(c) ?? Infinity) <= best + TOLERANCE);
  } catch {
    return [];
  }
}

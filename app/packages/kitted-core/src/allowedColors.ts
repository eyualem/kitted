// T103 stub: the implementer builds this (tasks/T103/IMPLEMENTATION.md). The tests fail on "not built" until then.
import type { Boldness, ColorFamily, Garment, Loose } from "./types";
import type { PartsEngine } from "./parts";

/** The 24 families a color can be proposed in: the app's palette order without "multicolor". (Stub: empty.) */
export const COLOR_CHOICES: readonly ColorFamily[] = [];

export interface AllowedColorsInput {
  others: readonly Garment[];
  piece: Garment;
  occasion?: string;
  boldness?: Loose<Boldness>;
}

export interface AllowedColorsEngines {
  parts?: PartsEngine;
}

export function allowedColors(_input: AllowedColorsInput, _engines?: AllowedColorsEngines): ColorFamily[] {
  throw new Error("T103: not built");
}

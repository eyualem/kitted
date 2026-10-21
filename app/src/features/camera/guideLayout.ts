// Pure layout for the snap guide (FramingOverlay's LowerGuide), kept apart so tests needn't load the drawing code.

/** Where the snap guide's label goes: 14 pt inside the box's top, but never above `minLabelTop` (under the tip pill). */
export function lowerGuideLabelTop(height: number, share: number, minLabelTop = 0): number {
  return Math.max(height * (1 - share) - 120 + 14, minLabelTop);
}

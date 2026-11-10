// T38 · The drawn-outfit view and the Example check's drawn bubble. Stub: renders nothing until the implementer builds
// it (tasks/T38).
import type { DrawnPiece } from './outfitDrawing';

export interface DrawnOutfitProps {
  pieces: readonly DrawnPiece[];
  layout: { kind: 'welcome'; k: number } | { kind: 'tile'; width: number; height: number };
  swap?: { piece: DrawnPiece; opacity: number } | null;
  testID?: string;
}

export function DrawnOutfit(_props: DrawnOutfitProps) {
  return null;
}

export interface DrawnOutfitBubbleProps {
  pieces: readonly DrawnPiece[];
  occasion: string;
  time: string;
  label: string;
  testID?: string;
}

export function DrawnOutfitBubble(_props: DrawnOutfitBubbleProps) {
  return null;
}

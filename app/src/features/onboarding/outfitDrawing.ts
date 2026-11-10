// T38 · The pieces of a reading as drawings (Closet's artSpec), their placements on Welcome and in the Example bubble,
// and the bubble's VoiceOver line. Stub: the test writer's placeholder; the implementer builds it (tasks/T38).
import type { Garment, Reading } from '@kitted/core';
import type { ArtSpec } from '@/features/closet/artSpec';

export type DrawnSlot = 'outer' | 'top' | 'bottom' | 'shoes';

export interface DrawnPiece {
  slot: DrawnSlot;
  garment: Garment;
  spec: ArtSpec;
  name: string;
}

export function drawnPieces(_reading: Reading): DrawnPiece[] {
  throw new Error('T38: not built');
}

export interface Placement {
  size: number;
  left: number;
  top: number;
}

export const WELCOME_BOX: { width: 214; height: 324 } = { width: 214, height: 324 };

export function welcomePlacement(_slot: DrawnSlot, _k: number): Placement {
  throw new Error('T38: not built');
}

export function tilePlacement(_slot: DrawnSlot, _width: number, _height: number): Placement {
  throw new Error('T38: not built');
}

export function drawnOutfitA11y(_pieces: readonly DrawnPiece[], _occasion: string): string {
  throw new Error('T38: not built');
}

// T38 · The pieces of a reading as drawings (Closet's artSpec), their placements on Welcome and in the Example bubble,
// and the bubble's VoiceOver line. Pure: no React, no store. Welcome and the Example check draw the bundled reading the
// score comes from (and, on Welcome, the same reading with the top fix applied), never a photo.
import { FAMILY_HEX, UNKNOWN_HEX, type Garment, type Reading } from '@kitted/core';
import { artSpec, type ArtSpec } from '@/features/closet/artSpec';
import { baseName } from '@/features/closet/itemName';
import { t } from '@/i18n/en';

export type DrawnSlot = 'outer' | 'top' | 'bottom' | 'shoes';

export interface DrawnPiece {
  slot: DrawnSlot;
  /** The reading's garment, untouched. */
  garment: Garment;
  spec: ArtSpec;
  /** Closet's name for it, e.g. "Charcoal denim jacket". */
  name: string;
}

const ORDER: readonly DrawnSlot[] = ['outer', 'top', 'bottom', 'shoes'];
const SLOT_OF: Readonly<Record<string, DrawnSlot>> = { outerwear: 'outer', top: 'top', bottom: 'bottom', footwear: 'shoes' };

/** One piece per slot present, in the order outer, top, bottom, shoes; anything outside the four slots is left out,
 *  and the first garment of each slot wins. */
export function drawnPieces(reading: Reading): DrawnPiece[] {
  const first = new Map<DrawnSlot, Garment>();
  for (const g of reading.garments) {
    const slot = SLOT_OF[String(g.category)];
    if (slot && !first.has(slot)) first.set(slot, g);
  }
  return ORDER.flatMap((slot) => {
    const garment = first.get(slot);
    if (!garment) return [];
    const hex = FAMILY_HEX[String(garment.color_family)] ?? UNKNOWN_HEX;
    return [{ slot, garment, spec: artSpec({ garment, hex, art: null, name: '' }), name: baseName(garment, null) }];
  });
}

export interface Placement {
  size: number;
  left: number;
  top: number;
}

/** Welcome's base box (k = 1), DESIGN.md phone 1. Each size is the art's square box, which has its own margins. */
export const WELCOME_BOX: { width: 214; height: 324 } = { width: 214, height: 324 };
const WELCOME_BASE: Readonly<Record<DrawnSlot, Placement>> = {
  outer: { size: 104, left: 0, top: 24 },
  top: { size: 134, left: 64, top: 0 },
  bottom: { size: 134, left: 64, top: 124 },
  shoes: { size: 150, left: 56, top: 204 },
};

export function welcomePlacement(slot: DrawnSlot, k: number): Placement {
  const b = WELCOME_BASE[slot];
  return { size: b.size * k, left: b.left * k, top: b.top * k };
}

// StandingOutfit's ratios (features/closet/StandingOutfit.tsx), named here rather than imported because that file is in
// the closet lane (T38 technical default 1; follow-up: StandingOutfit imports these).
/** The tile's height for its width (a 3:4 tile). */
const TILE_ASPECT = 4 / 3;
/** A core piece is the tile's height over this. */
const PIECE_DIV = 3.2;
/** The shoes' row is this share of a piece tall… */
const SHOE_ROW = 0.75;
/** …and the shoes are drawn this much larger (wide, short art). */
const SHOE_SCALE = 1.15;
/** The layer at the side, as a share of a piece. */
const LAYER_SCALE = 0.8;
const LAYER_LEFT = 2;
/** The layer's top below the first core piece's top, as a share of a piece (DESIGN.md: 13 + 8 = 21 in the bubble). */
const LAYER_DROP = 0.15;

/** The bubble's tile by StandingOutfit's ratios: the core column (top, bottom, shoes) centred in a `height`-tall tile,
 *  the layer at the left. At 127 × 172: outer {42, 2, 21} · top {53, 37, 13} · bottom {53, 37, 66} · shoes {61, 33, 109}. */
export function tilePlacement(slot: DrawnSlot, width: number, height: number): Placement {
  const h = Math.round(width * TILE_ASPECT);
  const piece = Math.round(h / PIECE_DIV);
  const shoeRow = piece * SHOE_ROW;
  const columnTop = (height - (piece * 2 + shoeRow)) / 2;
  const centred = (size: number) => (width - size) / 2;
  switch (slot) {
    case 'top':
      return { size: piece, left: centred(piece), top: columnTop };
    case 'bottom':
      return { size: piece, left: centred(piece), top: columnTop + piece };
    case 'shoes': {
      const size = Math.round(piece * SHOE_SCALE);
      return { size, left: centred(size), top: columnTop + piece * 2 + (shoeRow - size) / 2 };
    }
    case 'outer':
      return { size: Math.round(piece * LAYER_SCALE), left: LAYER_LEFT, top: columnTop + piece * LAYER_DROP };
  }
}

/** The bubble's VoiceOver line: "Drawn example outfit, Everyday: Charcoal denim jacket, White sweater, …". */
export function drawnOutfitA11y(pieces: readonly DrawnPiece[], occasion: string): string {
  return t('onb.example.a11yOutfit', { occasion, pieces: pieces.map((p) => p.name).join(', ') });
}

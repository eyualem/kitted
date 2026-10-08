// What a closet tile draws (DECISIONS-LOG #91; founder-approved "detailed graphic" until real crops in phase 3):
// the existing GarmentIcon in the piece's exact shade, plus at most 3 detail glyphs in the same 60 × 60 viewBox
// (zip, drawstrings, pockets, a stripe, cuffs, belt loops, collar and buttons, denim rips or fade, a graphic panel,
// stripes or checks, the sole height), a faint fabric hint (heather speckle, twill hatch), and a brand as a plain
// neutral mark (the word only at large size). Never a brand's logo shape. Pure: GarmentArt.tsx renders it.
import { shadeFromId } from '@kitted/core';
import type { GarmentIconType } from '@/design-system/components/GarmentIcon';
import type { ClosetArt, ClosetItemRow } from '@/data/types';
import { garmentIconType } from '@/features/fitcheck/labels';
import { t, type StringKey } from '@/i18n/en';
import { brandWord } from './itemName';

export type Glyph =
  | 'fullZip' | 'halfZip' | 'drawstrings' | 'pouch' | 'chestPocket' | 'cargoPockets' | 'sideStripe' | 'cuffs' | 'beltLoops'
  | 'collarButtons' | 'rips' | 'fade' | 'graphic' | 'stripes' | 'checks' | 'chunkySole' | 'waistDrawstring';

export type ArtShape = 'top' | 'bottom' | 'shoe';

export interface ArtSpec {
  icon: GarmentIconType;
  shape: ArtShape;
  hex: string;
  /** At most 3, most telling first. */
  glyphs: Glyph[];
  fabric: 'heather' | 'twill' | null;
  /** A plain chest mark (tiles) or the brand word (large); never a logo shape. */
  brand: { word: string; mark: 'dot' | 'word' } | null;
  /** VoiceOver: the name and what's drawn ("Medium grey Nike hoodie, front pouch, drawstrings"). */
  a11y: string;
}

const SHAPE: Record<GarmentIconType, ArtShape> = {
  tee: 'top', oxford: 'top', overshirt: 'top', jacket: 'top', sweater: 'top', hoodie: 'top',
  chino: 'bottom', jeans: 'bottom', trouser: 'bottom', cargo: 'bottom',
  sneaker: 'shoe', runner: 'shoe', boot: 'shoe', loafer: 'shoe',
};

/** Icons that already draw a detail (the overlay doesn't draw it twice). */
const BUILT_IN: Partial<Record<GarmentIconType, Glyph[]>> = {
  hoodie: ['pouch'], oxford: ['collarButtons'], overshirt: ['collarButtons', 'chestPocket'], jacket: ['collarButtons', 'chestPocket'],
  cargo: ['cargoPockets'],
};

const PRIORITY: readonly Glyph[] = [
  'fullZip', 'halfZip', 'pouch', 'drawstrings', 'graphic', 'stripes', 'checks', 'sideStripe', 'cargoPockets', 'rips', 'fade', 'chunkySole',
  'chestPocket', 'cuffs', 'waistDrawstring', 'beltLoops', 'collarButtons',
];

const A11Y: Record<Glyph, StringKey> = {
  fullZip: 'closet.art.fullZip', halfZip: 'closet.art.halfZip', drawstrings: 'closet.art.drawstrings', pouch: 'closet.art.pouch',
  chestPocket: 'closet.art.chestPocket', cargoPockets: 'closet.art.cargoPockets', sideStripe: 'closet.art.sideStripe', cuffs: 'closet.art.cuffs',
  beltLoops: 'closet.art.beltLoops', collarButtons: 'closet.art.collarButtons', rips: 'closet.art.rips', fade: 'closet.art.fade',
  graphic: 'closet.art.graphic', stripes: 'closet.art.stripes', checks: 'closet.art.checks', chunkySole: 'closet.art.chunkySole',
  waistDrawstring: 'closet.art.drawstrings',
};

/** The tile drawing for a piece. `size` 'large' (C2's full-width tile) writes the brand word. */
export function artSpec(item: Pick<ClosetItemRow, 'garment' | 'hex' | 'art' | 'name'>, size: 'tile' | 'large' = 'tile'): ArtSpec {
  const g = item.garment;
  const icon = garmentIconType(g);
  const shape = SHAPE[icon];
  const art: ClosetArt | null = item.art ?? null;
  const d = new Set(art?.details ?? []);
  const want = new Set<Glyph>();
  if (shape === 'top') {
    if (d.has('full_zip')) want.add('fullZip');
    else if (d.has('half_zip') || g.subcategory === 'quarter_zip') want.add('halfZip');
    if (d.has('front_pouch') && !d.has('full_zip')) want.add('pouch');
    if (d.has('drawstring') && (d.has('hood') || icon === 'hoodie')) want.add('drawstrings');
    if (d.has('chest_pocket')) want.add('chestPocket');
    if (d.has('elastic_cuffs')) want.add('cuffs');
    if (d.has('collar') || d.has('buttons')) want.add('collarButtons');
    if (d.has('side_stripe')) want.add('sideStripe');
  } else if (shape === 'bottom') {
    if (d.has('cargo_pockets')) want.add('cargoPockets');
    if (d.has('side_stripe')) want.add('sideStripe');
    if (d.has('elastic_cuffs')) want.add('cuffs');
    if (d.has('belt_loops')) want.add('beltLoops');
    if (d.has('drawstring')) want.add('waistDrawstring');
    if (art?.denimWear === 'ripped') want.add('rips');
    if (art?.denimWear === 'faded') want.add('fade');
  } else if (art?.shoeProfile === 'chunky') want.add('chunkySole');
  if (shape !== 'shoe') {
    if (g.pattern === 'graphic') want.add('graphic');
    if (g.pattern === 'stripes') want.add('stripes');
    if (g.pattern === 'checks_plaid') want.add('checks');
  }
  const builtIn = new Set(BUILT_IN[icon] ?? []);
  // A full zip opens the hoodie's pouch: the overlay draws the zip through it.
  const glyphs = PRIORITY.filter((x) => want.has(x) && !builtIn.has(x)).slice(0, 3);
  const key = art?.shade ? shadeFromId(art.shade) : null;
  const fabric = key?.finish === 'heather' ? 'heather' : shape === 'bottom' && (g.subcategory === 'chinos' || g.subcategory === 'trousers' || icon === 'jeans') ? 'twill' : null;
  const word = brandWord(art?.brand);
  const drawn = [...builtIn].filter((x) => want.has(x));
  const said = [...new Set([...glyphs, ...drawn].map((x) => t(A11Y[x])))];
  return {
    icon, shape, hex: item.hex, glyphs, fabric,
    brand: word ? { word, mark: size === 'large' ? 'word' : 'dot' } : null,
    a11y: [item.name, ...said].join(', '),
  };
}

// What a piece's drawing shows (founder, Oct 8: DECISIONS-LOG #141, code-drawn tiles everywhere pieces are shown).
// Maps the reading (subcategory, volume, leg shape, hem, pattern) and the closet call's art (shade, details,
// brand, shoe profile, denim wear) to a FlatSpec for flats.ts, in the piece's own tile color. A v3-only piece
// (no closet call yet) draws its type's usual details. The brand is a plain word, never a logo shape.
// Pure: GarmentArt.tsx renders it.
import { shadeFromId } from '@kitted/core';
import type { ClosetArt, ClosetItemRow } from '@/data/types';
import { t, type StringKey } from '@/i18n/en';
import type { BottomFlat, BottomType, FlatSpec, ShoeType, TopFlat, TopType } from './flats';
import { contrastLine, mix } from './flats';
import { brandWord } from './itemName';

export type Glyph =
  | 'fullZip' | 'halfZip' | 'drawstrings' | 'pouch' | 'chestPocket' | 'cargoPockets' | 'sideStripe' | 'cuffs' | 'beltLoops'
  | 'collarButtons' | 'rips' | 'fade' | 'graphic' | 'stripes' | 'checks' | 'chunkySole' | 'waistDrawstring';

export type ArtShape = 'top' | 'bottom' | 'shoe';

export interface ArtSpec {
  shape: ArtShape;
  flat: FlatSpec;
  /** The telling details drawn, most telling first (VoiceOver and tests). */
  glyphs: Glyph[];
  /** VoiceOver: the name and what's drawn ("Medium grey Nike hoodie, drawstrings, front pouch"). */
  a11y: string;
}

const TOP: Record<string, TopType> = {
  tee: 'tee', graphic_tee: 'tee', jersey: 'tee', tank_top: 'tank', polo: 'polo', knit_polo: 'polo',
  oxford_shirt: 'shirt', dress_shirt: 'shirt', flannel_shirt: 'shirt', camp_collar_shirt: 'shirt', overshirt: 'overshirt', chore_coat: 'overshirt',
  sweater: 'crew', sweatshirt: 'crew', fleece: 'crew', rugby_shirt: 'crew', quarter_zip: 'quarter_zip', cardigan: 'cardigan', hoodie: 'hoodie',
  denim_jacket: 'denim_jacket', bomber: 'bomber', leather_jacket: 'jacket', field_jacket: 'jacket', shell_jacket: 'jacket', rain_jacket: 'jacket',
  puffer: 'puffer', blazer: 'blazer', unstructured_blazer: 'blazer', sport_coat: 'blazer', suit_jacket: 'blazer', overcoat: 'coat',
};
const BOTTOM: Record<string, BottomType> = {
  jeans: 'jeans', chinos: 'chinos', trousers: 'trousers', suit_trousers: 'trousers', drawstring_trousers: 'trousers', cargos: 'cargos',
  joggers: 'joggers', sweatpants: 'joggers', shorts: 'shorts', athletic_shorts: 'shorts',
};
const SHOE: Record<string, ShoeType> = {
  white_leather_sneaker: 'sneaker', canvas_sneaker: 'sneaker', low_profile_sneaker: 'sneaker', basketball_sneaker: 'sneaker', chunky_sneaker: 'sneaker',
  retro_runner: 'runner', performance_runner: 'runner', work_boot: 'work_boot', suede_chukka: 'chukka', chelsea_boot: 'chelsea',
  loafer: 'loafer', dress_shoe: 'derby', derby: 'derby', slides_sandals: 'slides',
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

const LEG_A11Y: Record<string, StringKey> = {
  skinny: 'value.leg.skinny', slim: 'value.leg.slim', straight: 'value.leg.straight', relaxed: 'value.leg.relaxed', wide: 'value.leg.wide',
};

function shapeOf(category: unknown, sub: string): ArtShape {
  if (SHOE[sub] || category === 'footwear') return 'shoe';
  if (BOTTOM[sub] || category === 'bottom') return 'bottom';
  return 'top';
}

/** The drawing for a piece. */
export function artSpec(item: Pick<ClosetItemRow, 'garment' | 'hex' | 'art' | 'name'>): ArtSpec {
  const g = item.garment;
  const sub = String(g.subcategory ?? '');
  const shape = shapeOf(g.category, sub);
  const art: ClosetArt | null = item.art ?? null;
  const d = new Set(art?.details ?? []);
  const known = !!art && (art.details?.length ?? 0) > 0;
  const has = (x: string, usual: boolean) => (known ? d.has(x) : usual);
  const key = art?.shade ? shadeFromId(art.shade) : null;
  const heather = key?.finish === 'heather';
  const pattern = String(art?.pattern ?? g.pattern ?? 'solid');
  const brand = brandWord(art?.brand)?.toUpperCase() ?? null;
  const c = item.hex;
  const glyphs = new Set<Glyph>();
  let flat: FlatSpec;

  if (shape === 'top') {
    let type: TopType = TOP[sub] ?? (g.category === 'outerwear' ? 'jacket' : 'tee');
    if (type === 'crew' && d.has('half_zip')) type = 'quarter_zip';
    if (type === 'crew' && d.has('full_zip')) type = 'jacket';
    const vol = typeof g.volume === 'number' ? g.volume : 3;
    const knit = type === 'crew' || type === 'quarter_zip' || type === 'cardigan' || type === 'hoodie' || type === 'bomber';
    const hood = type === 'hoodie';
    const shirtLike = type === 'shirt' || type === 'overshirt';
    const pockets = type === 'overshirt' ? (known ? (d.has('chest_pocket') ? 2 : 0) : 2) : type === 'shirt' || type === 'denim_jacket' ? (has('chest_pocket', type === 'denim_jacket' || sub === 'oxford_shirt') ? (type === 'denim_jacket' ? 2 : 1) : 0) : 0;
    const details: TopFlat['details'] = {
      drawstrings: hood && has('drawstring', true),
      pouch: hood && has('front_pouch', !d.has('full_zip')),
      fullZip: hood && d.has('full_zip'),
      ribHem: knit,
      ribCuffs: knit || d.has('elastic_cuffs'),
      chestPockets: pockets as 0 | 1 | 2,
      flaps: type === 'overshirt' || type === 'denim_jacket',
    };
    const p: TopFlat['pattern'] =
      pattern === 'stripes' ? { type: 'stripes', line: contrastLine(c), scale: 4.4 }
        : pattern === 'checks_plaid' ? { type: 'gingham', line: contrastLine(c), scale: sub === 'flannel_shirt' ? 9 : 5.5 }
          : sub === 'sweater' ? { type: 'knit' } : heather ? { type: 'heather' }
            : type === 'denim_jacket' ? { type: 'twill' } : { type: 'solid' };
    flat = {
      kind: 'top', type, color: c, fit: vol <= 2 ? 'slim' : vol >= 5 ? 'oversized' : vol === 4 ? 'relaxed' : type === 'overshirt' ? 'relaxed' : 'regular',
      pattern: p, details, brand, print: pattern === 'graphic' || sub === 'graphic_tee',
      buttonColor: type === 'denim_jacket' ? '#B87A45' : undefined, stitch: type === 'denim_jacket' ? '#D49A5E' : undefined,
    };
    if (details.fullZip || type === 'jacket' || type === 'bomber' || type === 'puffer') glyphs.add('fullZip');
    if (type === 'quarter_zip') glyphs.add('halfZip');
    if (details.pouch && known) glyphs.add('pouch');
    if (details.drawstrings && known) glyphs.add('drawstrings');
    if (pockets && known) glyphs.add('chestPocket');
    if (d.has('elastic_cuffs')) glyphs.add('cuffs');
    if (shirtLike && (d.has('collar') || d.has('buttons'))) glyphs.add('collarButtons');
  } else if (shape === 'bottom') {
    let type: BottomType = BOTTOM[sub] ?? 'chinos';
    if ((type === 'chinos' || type === 'trousers') && d.has('cargo_pockets')) type = 'cargos';
    if (type === 'trousers' && d.has('elastic_cuffs')) type = 'joggers';
    const leg = String(g.leg_shape ?? '');
    const fit: BottomFlat['fit'] = leg === 'skinny' ? 'skinny' : leg === 'slim' ? 'slim' : leg === 'relaxed' || leg === 'barrel' ? 'relaxed' : leg === 'wide' ? 'wide' : type === 'joggers' ? 'relaxed' : 'straight';
    const hemRaw = String(g.hem ?? '');
    const hem: BottomFlat['hem'] = hemRaw === 'full_break' || hemRaw === 'pooling' ? 'full_break' : hemRaw === 'slight_break' ? 'slight_break' : hemRaw === 'cuffed' ? 'cuffed' : 'no_break';
    const jeans = type === 'jeans';
    const denim = String(g.color_family ?? '').startsWith('denim');
    flat = {
      kind: 'bottom', type, color: c, fit, hem,
      wash: art?.denimWear === 'faded' ? 'faded' : String(g.color_family) === 'denim_dark' ? 'rinse' : 'washed',
      ripped: art?.denimWear === 'ripped' || (!art && g.distressed_by_design === true),
      sideStripe: d.has('side_stripe'),
      // trousers are smooth cloth with a pressed crease; chinos and jeans show their twill
      pattern: type === 'joggers' ? (heather ? { type: 'heather' } : { type: 'solid' }) : type === 'trousers' ? { type: 'solid' } : { type: 'twill' },
      stitch: jeans ? (denim ? '#C8925A' : mix(c, 0.32)) : undefined,
      buttonColor: jeans && !denim ? '#8D9096' : undefined,
      brand,
    };
    if (type === 'cargos') glyphs.add('cargoPockets');
    if (flat.sideStripe) glyphs.add('sideStripe');
    if (flat.ripped) glyphs.add('rips');
    if (art?.denimWear === 'faded') glyphs.add('fade');
    if (type === 'joggers' && d.has('elastic_cuffs')) glyphs.add('cuffs');
    if (type === 'joggers' && d.has('drawstring')) glyphs.add('waistDrawstring');
    if (d.has('belt_loops') && type !== 'joggers') glyphs.add('beltLoops');
  } else {
    const type: ShoeType = SHOE[sub] ?? 'sneaker';
    const chunky = art?.shoeProfile === 'chunky' || sub === 'chunky_sneaker';
    const suede = sub === 'suede_chukka';
    flat = {
      kind: 'shoe', type, color: c, chunky: chunky && (type === 'sneaker' || type === 'runner'), ...(sub === 'canvas_sneaker' ? { canvas: true } : {}),
      pattern: suede ? { type: 'suede' } : { type: 'solid' }, brand,
      sole: type === 'sneaker' || type === 'runner' ? (String(g.color_family) === 'black' && !chunky ? '#F4F3EF' : undefined) : undefined,
    };
    if (chunky) glyphs.add('chunkySole');
  }
  if (shape !== 'shoe') {
    if (pattern === 'graphic' || sub === 'graphic_tee') glyphs.add('graphic');
    if (pattern === 'stripes') glyphs.add('stripes');
    if (pattern === 'checks_plaid') glyphs.add('checks');
  }
  const ordered = PRIORITY.filter((x) => glyphs.has(x));
  const said = [...new Set(ordered.map((x) => t(A11Y[x])))];
  // The cut he can change on the page (§17.5): the leg of pants, a top's fit when it isn't regular.
  const legKey = LEG_A11Y[String(g.leg_shape ?? '')];
  const vol = typeof g.volume === 'number' ? g.volume : 3;
  const cut = shape === 'bottom' && legKey ? t('closet.edit.a11y.leg', { leg: t(legKey) }).toLowerCase()
    : shape === 'top' && vol !== 3 ? t('closet.edit.a11y.fit', { fit: t(vol <= 2 ? 'value.topFit.slim' : vol === 4 ? 'value.topFit.relaxed' : 'value.topFit.oversized') }).toLowerCase()
      : null;
  return { shape, flat, glyphs: ordered, a11y: [item.name, ...(cut ? [cut] : []), ...said].join(', ') };
}

// What a piece's drawing shows (founder, Oct 8: DECISIONS-LOG #141, code-drawn tiles everywhere pieces are shown).
// Maps the reading (subcategory, volume, leg shape, hem, pattern) and the closet call's art (shade, details,
// brand, shoe profile, denim wear) to a FlatSpec for flats.ts, in the piece's own tile color. A v3-only piece
// (no closet call yet) draws its type's usual details. The brand is a plain word, never a logo shape.
// Pure: GarmentArt.tsx renders it.
import { FAMILY_HEX, G, shadeFromId } from '@kitted/core';
import type { ClosetArt, ClosetItemRow } from '@/data/types';
import { t, type StringKey } from '@/i18n/en';
import type { AccessoryFlat, BottomFlat, BottomType, FlatSpec, ShoeType, TopFlat, TopType, WatchMetal } from './flats';
import { contrastLine, mix, WATCH_METALS } from './flats';
import { brandWord } from './itemName';
import { isVariant, KIND_SLEEVES, VARIANTS } from './kinds';
import { isLongSleeved } from './sleeves';

export type Glyph =
  | 'fullZip' | 'halfZip' | 'drawstrings' | 'pouch' | 'chestPocket' | 'cargoPockets' | 'sideStripe' | 'cuffs' | 'beltLoops'
  | 'collarButtons' | 'rips' | 'fade' | 'graphic' | 'stripes' | 'checks' | 'chunkySole' | 'waistDrawstring';

export type ArtShape = 'top' | 'bottom' | 'shoe' | 'accessory';

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
  // the closet-only kinds (kinds.ts, #361)
  henley: 'tee', button_up_shirt: 'shirt', short_sleeve_shirt: 'shirt', turtleneck: 'crew', zip_hoodie: 'hoodie',
};
const BOTTOM: Record<string, BottomType> = {
  jeans: 'jeans', chinos: 'chinos', trousers: 'trousers', suit_trousers: 'trousers', drawstring_trousers: 'trousers', cargos: 'cargos',
  joggers: 'joggers', sweatpants: 'joggers', shorts: 'shorts', athletic_shorts: 'shorts', jorts: 'shorts',
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

/** The subcategories drawn as an accessory (T101); 'hat' draws as a cap. A bag or anything else keeps its old drawing. */
const ACCESSORY_SUBS: readonly string[] = ['watch', 'belt', 'hat', 'cap', 'beanie'];

function shapeOf(category: unknown, sub: string): ArtShape {
  if (SHOE[sub] || category === 'footwear') return 'shoe';
  if (BOTTOM[sub] || category === 'bottom') return 'bottom';
  if (category === 'accessory' && ACCESSORY_SUBS.includes(sub)) return 'accessory';
  return 'top';
}

/** The cut a piece's name says: "Oversized tee", "Black boxy tee", "drop-shoulder tee" draw oversized; "relaxed fit" draws relaxed. */
function fitFromName(name: unknown): 'oversized' | 'relaxed' | null {
  const n = String(name ?? '').toLowerCase();
  if (/\b(oversized|over-sized|boxy|drop[- ]?shoulders?)\b/.test(n)) return 'oversized';
  return /\brelaxed[- ]fit\b/.test(n) ? 'relaxed' : null;
}

/** The drawing for a piece. */
export function artSpec(item: ArtItem): ArtSpec {
  const g = item.garment;
  const sub = String(g.subcategory ?? '');
  const shape = shapeOf(g.category, sub);
  const art: ClosetArt | null = item.art ?? null;
  // What it's drawn as: a closet-only kind he picked (#361), else the reading's kind. Scores never read this.
  const kind = isVariant(art?.kind) ? art!.kind! : sub;
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

  if (shape === 'accessory') {
    // A watch, belt, cap or beanie (T101): no glyphs and no new words, so VoiceOver reads the piece's name only.
    const type: AccessoryFlat['type'] = sub === 'hat' ? 'cap' : (sub as AccessoryFlat['type']);
    const metal: WatchMetal | undefined = type === 'watch' ? WATCH_METALS.find((m) => d.has(`metal_${m}`)) : undefined;
    flat = {
      kind: 'accessory', type, color: c,
      ...(metal ? { metal } : {}),
      ...(type === 'watch' && String(g.color_family) === 'multicolor' ? { bracelet: true } : {}),
      ...(type === 'watch' && d.has('digital') ? { face: 'digital' as const } : {}),
    };
    return { shape, flat, glyphs: [], a11y: item.name };
  }
  if (shape === 'top') {
    let type: TopType = TOP[kind] ?? TOP[sub] ?? (g.category === 'outerwear' ? 'jacket' : 'tee');
    if (type === 'crew' && d.has('half_zip')) type = 'quarter_zip';
    if (type === 'crew' && d.has('full_zip')) type = 'jacket';
    const vol = typeof g.volume === 'number' ? g.volume : 3;
    const knit = type === 'crew' || type === 'quarter_zip' || type === 'cardigan' || type === 'hoodie' || type === 'bomber';
    const hood = type === 'hoodie';
    const shirtLike = type === 'shirt' || type === 'overshirt';
    const pockets = type === 'overshirt' ? (known ? (d.has('chest_pocket') ? 2 : 0) : 2) : type === 'shirt' || type === 'denim_jacket' ? (has('chest_pocket', type === 'denim_jacket' || kind === 'oxford_shirt') ? (type === 'denim_jacket' ? 2 : 1) : 0) : 0;
    const zipHood = kind === 'zip_hoodie';
    const details: TopFlat['details'] = {
      drawstrings: hood && has('drawstring', true),
      pouch: hood && !zipHood && has('front_pouch', !d.has('full_zip')),
      fullZip: hood && (zipHood || d.has('full_zip')),
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
    // The sleeves: what a kind he picked is named for (#361); a tee or polo his photos show with long sleeves (§24, #359);
    // a henley read short; else the kind's usual (a camp shirt is short-sleeved). Unset draws the type's usual sleeves.
    const topSleeves = (isVariant(kind) ? VARIANTS[kind]!.sleeves : undefined)
      ?? (kind === 'henley' && art?.sleeves === 'short' ? 'short' as const : undefined)
      ?? ((type === 'tee' || type === 'polo') && isLongSleeved(sub, art) ? 'long' as const : undefined)
      ?? KIND_SLEEVES[kind];
    // A tee his own words call oversized (oversized-tee, founder Nov 19) draws oversized even at the default volume: the piece's
    // name says it, and a name never moves a score. A fit he set (volume 2, 4 or 5) still wins over the name.
    const nameFit = vol === 3 && type === 'tee' ? fitFromName(item.name) : null;
    flat = {
      kind: 'top', type, color: c, fit: vol <= 2 ? 'slim' : vol >= 5 ? 'oversized' : vol === 4 ? 'relaxed' : nameFit ?? (type === 'overshirt' ? 'relaxed' : 'regular'),
      pattern: p, details, brand, print: pattern === 'graphic' || sub === 'graphic_tee',
      ...(topSleeves ? { sleeves: topSleeves } : {}),
      ...(kind === 'henley' ? { neck: 'henley' as const } : kind === 'turtleneck' ? { neck: 'turtle' as const } : {}),
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
    const jeans = type === 'jeans' || kind === 'jorts';
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
      brand, print: pattern === 'graphic',
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

// ---------------------------------------------------------------- pieces drawn without a closet row (T101)
/** Where a kind sits. 'accessory' is not a Closet slot (ClosetSlot has four); it is only used here and by cards. */
export type PieceSlot = 'top' | 'outer' | 'bottom' | 'shoes' | 'accessory';
/** What artSpec reads: a closet row's drawing fields. A closet row satisfies it, and so does `drawnItem(...)`'s result. */
export type ArtItem = Pick<ClosetItemRow, 'garment' | 'hex' | 'art' | 'name'>;

/** A piece with no closet row: what a card stores and draws. Three facts, plus a watch's metal and face. */
export interface DrawnPieceSpec {
  /** A reading subcategory ('chelsea_boot', 'tee', 'bomber'), a closet-only kind key ('henley', 'zip_hoodie', 'jorts'),
   *  or one of 'watch' | 'belt' | 'cap' | 'beanie'. */
  kind: string;
  /** One of the 25 color families (core FAMILY_HEX keys). The drawing is in this family's swatch. */
  family: string;
  /** Its name as the card shows it. Used for VoiceOver; never decides the drawing. */
  name: string;
  /** A watch's metal tone, a detail and never a color family. Ignored on every other kind. */
  metal?: WatchMetal;
  /** A watch's face. Ignored on every other kind. Unset draws analog. */
  face?: 'analog' | 'digital';
}

const ACCESSORY_KINDS: readonly string[] = ['watch', 'belt', 'cap', 'beanie'];
const OUTER_KINDS: readonly string[] = [
  'chore_coat', 'denim_jacket', 'bomber', 'leather_jacket', 'field_jacket', 'shell_jacket', 'rain_jacket', 'puffer', 'blazer',
  'unstructured_blazer', 'sport_coat', 'suit_jacket', 'overcoat',
];
const has = (table: object, key: string) => Object.prototype.hasOwnProperty.call(table, key);

/** Every kind `drawnItem` draws on its own: the reading kinds above, the closet-only kinds, and the four accessories. */
export const DRAWN_KINDS: readonly string[] = [...Object.keys(TOP), ...Object.keys(BOTTOM), ...Object.keys(SHOE), ...ACCESSORY_KINDS];

/** The slot a kind belongs to, or null for a kind not in DRAWN_KINDS. */
export function pieceSlotOf(kind: string): PieceSlot | null {
  if (has(TOP, kind)) return OUTER_KINDS.includes(kind) ? 'outer' : 'top';
  if (has(BOTTOM, kind)) return 'bottom';
  if (has(SHOE, kind)) return 'shoes';
  return ACCESSORY_KINDS.includes(kind) ? 'accessory' : null;
}

/** What an undrawable kind is drawn as under each slot: a plain piece in the right color. */
const STAND_IN: Partial<Record<PieceSlot, string>> = { top: 'tee', outer: 'field_jacket', bottom: 'chinos', shoes: 'low_profile_sneaker' };
const SLOT_CATEGORY = { top: 'top', outer: 'outerwear', bottom: 'bottom', shoes: 'footwear', accessory: 'accessory' } as const;

/**
 * The drawable form of a drawn piece, shaped like a closet row's drawing fields and carrying no id, no slot and no photo,
 * so it cannot be mistaken for one of his pieces. An unknown family draws grey. `slotHint` only matters when `kind` is not
 * in DRAWN_KINDS: it picks that slot's plain stand-in; with no hint, or 'accessory', an undrawable kind gives null.
 */
export function drawnItem(piece: DrawnPieceSpec, slotHint?: PieceSlot): ArtItem | null {
  let kind = String(piece.kind ?? '');
  let slot = pieceSlotOf(kind);
  if (!slot) {
    const stand = slotHint ? STAND_IN[slotHint] : undefined;
    if (!stand) return null;
    kind = stand;
    slot = pieceSlotOf(kind)!;
  }
  const family = typeof piece.family === 'string' && has(FAMILY_HEX, piece.family) ? piece.family : 'grey';
  const sub = isVariant(kind) ? VARIANTS[kind]!.sub : kind;
  const details: string[] = [];
  if (kind === 'watch') {
    if (WATCH_METALS.includes(piece.metal as WatchMetal)) details.push(`metal_${piece.metal}`);
    if (piece.face === 'digital') details.push('digital');
  }
  return {
    garment: G(SLOT_CATEGORY[slot], sub, family),
    hex: FAMILY_HEX[family]!,
    art: { family, shade: null, details, brand: null, shoeProfile: null, denimWear: null, pattern: 'solid', ...(isVariant(kind) ? { kind } : {}) },
    name: String(piece.name ?? ''),
  };
}

/** Everything that draws one piece, closet row or not, as the pure function PieceArt calls. A DrawnPieceSpec is told
 *  apart from a closet row by having both `kind` and `family` at its top level; null when it can't be drawn. */
export function pieceArtSpec(item: ArtItem | DrawnPieceSpec, slotHint?: PieceSlot): ArtSpec | null {
  if ('kind' in item && 'family' in item) {
    const drawn = drawnItem(item, slotHint);
    return drawn ? artSpec(drawn) : null;
  }
  return artSpec(item);
}

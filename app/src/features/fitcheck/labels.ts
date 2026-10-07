// Garment labels for pills, "What I read" and ledger rows (04 §11 "Tag text"): a color word
// plus the plain garment name ("White tee", "Tan chinos · straight", "Beige overshirt · in hand").
// The color and garment vocabularies are data, like the rubric's fix copy (DECISIONS-LOG #22).

import { garmentName, type Garment, type Reading } from '@kitted/core';
import { t } from '@/i18n/en';

const COLOR: Record<string, string> = {
  white: 'White', off_white_cream: 'Cream', light_grey: 'Light grey', grey: 'Grey', charcoal: 'Charcoal', black: 'Black',
  navy: 'Navy', light_blue: 'Light-blue', blue: 'Blue', denim_light: 'Light', denim_mid: 'Mid-wash', denim_dark: 'Dark',
  olive: 'Olive', green: 'Green', sage: 'Sage', khaki_beige: 'Beige', tan_camel: 'Tan', brown: 'Brown', burgundy: 'Burgundy',
  red: 'Red', orange: 'Orange', yellow: 'Yellow', pink: 'Pink', purple: 'Purple', multicolor: 'Multicolor',
};

/** "khaki_beige chinos" are khaki chinos; every other khaki_beige piece is beige. */
const COLOR_OVERRIDE: Record<string, Record<string, string>> = { chinos: { khaki_beige: 'Khaki' } };

const LEG: Record<string, string> = { skinny: 'skinny', slim: 'slim', straight: 'straight', relaxed: 'relaxed', wide: 'wide' };

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export function colorWord(g: Pick<Garment, 'color_family' | 'subcategory'>): string | null {
  const c = typeof g.color_family === 'string' ? g.color_family : '';
  const sub = typeof g.subcategory === 'string' ? g.subcategory : '';
  return COLOR_OVERRIDE[sub]?.[c] ?? COLOR[c] ?? null;
}

/** "White tee", "Tan chinos", "White leather sneakers". */
export function garmentLabel(g: Garment): string {
  const color = colorWord(g);
  const name = garmentName(g);
  return color ? `${color} ${name}` : cap(name);
}

/** The same, lowercase, for running text ("tan chinos" in the ledger). */
export function garmentPhrase(g: Garment): string {
  return garmentLabel(g).toLowerCase();
}

/** Pills while reading (02 D6): held layers read "Overshirt · in hand". */
export function readingPill(g: Garment, held: boolean): string {
  return held ? t('label.inHand', { name: cap(garmentName(g)) }) : garmentLabel(g);
}

/** "What I read" (02 D8): worn pieces in reading order (bottoms with their leg), then held pieces. */
export function whatIRead(reading: Reading): string[] {
  const worn = reading.garments
    .filter((g) => g.certainty !== 'unsure' && g.category !== 'accessory')
    .map((g) => {
      const leg = typeof g.leg_shape === 'string' ? LEG[g.leg_shape] : undefined;
      return g.category === 'bottom' && leg ? t('label.withLeg', { name: garmentLabel(g), leg }) : garmentLabel(g);
    });
  const held = (reading.held_items ?? []).map((g) => t('label.inHand', { name: garmentLabel(g) }));
  return [...worn, ...held];
}

/** Garment-icon type for a piece (the mockup's gi() set). */
export type GarmentIconType =
  | 'tee' | 'oxford' | 'overshirt' | 'jacket' | 'sweater' | 'hoodie' | 'chino' | 'jeans' | 'trouser' | 'cargo'
  | 'sneaker' | 'runner' | 'boot' | 'loafer';

export function garmentIconType(g: Pick<Garment, 'subcategory' | 'category'>): GarmentIconType {
  const sub = String(g.subcategory ?? '');
  const map: Record<string, GarmentIconType> = {
    tee: 'tee', graphic_tee: 'tee', tank_top: 'tee', polo: 'tee', knit_polo: 'tee', jersey: 'tee', rugby_shirt: 'sweater',
    oxford_shirt: 'oxford', dress_shirt: 'oxford', flannel_shirt: 'oxford', camp_collar_shirt: 'oxford', overshirt: 'overshirt',
    chore_coat: 'overshirt', sweater: 'sweater', quarter_zip: 'sweater', cardigan: 'sweater', sweatshirt: 'sweater',
    fleece: 'sweater', hoodie: 'hoodie', blazer: 'jacket', unstructured_blazer: 'jacket', sport_coat: 'jacket',
    suit_jacket: 'jacket', denim_jacket: 'jacket', bomber: 'jacket', field_jacket: 'jacket', puffer: 'jacket',
    overcoat: 'jacket', rain_jacket: 'jacket', shell_jacket: 'jacket', leather_jacket: 'jacket', chinos: 'chino',
    shorts: 'chino', athletic_shorts: 'chino', jeans: 'jeans', trousers: 'trouser', suit_trousers: 'trouser',
    drawstring_trousers: 'trouser', joggers: 'trouser', sweatpants: 'trouser', cargos: 'cargo',
    white_leather_sneaker: 'sneaker', canvas_sneaker: 'sneaker', low_profile_sneaker: 'sneaker', chunky_sneaker: 'sneaker',
    basketball_sneaker: 'sneaker', retro_runner: 'runner', performance_runner: 'runner', chelsea_boot: 'boot',
    work_boot: 'boot', suede_chukka: 'boot', loafer: 'loafer', dress_shoe: 'loafer', derby: 'loafer', slides_sandals: 'loafer',
  };
  if (map[sub]) return map[sub];
  return g.category === 'bottom' ? 'chino' : g.category === 'footwear' ? 'sneaker' : g.category === 'outerwear' ? 'jacket' : 'tee';
}

/** Tile color for a garment (closet hex when known, else a family color; whites differ by type, 04 §10.2). */
export function garmentHex(g: Pick<Garment, 'color_family' | 'category'>): string {
  const HEX: Record<string, string> = {
    white: '#F2F0EA', off_white_cream: '#EDE6D6', light_grey: '#C9CCD1', grey: '#9CA0A6', charcoal: '#4A4D55', black: '#1E2026',
    navy: '#2B3550', light_blue: '#AFC6DE', blue: '#4F6FA8', denim_light: '#8FA7C4', denim_mid: '#5D7393', denim_dark: '#26324F',
    olive: '#5B6440', green: '#4C7A55', sage: '#A3B09A', khaki_beige: '#D8CDB8', tan_camel: '#B98E62', brown: '#5A3522',
    burgundy: '#6B2B34', red: '#B23A3A', orange: '#D2773A', yellow: '#E1C04A', pink: '#E3A7B5', purple: '#6E4E8C', multicolor: '#9CA0A6',
  };
  const c = String(g.color_family ?? '');
  if (c === 'white' && g.category === 'footwear') return '#F2F1EC';
  return HEX[c] ?? '#ECEEF1';
}

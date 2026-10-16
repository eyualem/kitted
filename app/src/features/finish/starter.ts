// The Starter 12 essentials (02 C5; items and 2026 prices from rubric/v3.md) and which ones his closet already has.
// Pure. Each row has one concrete piece (`pick`) for "Add a grey quarter-zip" and its "+N outfits", so the number is
// honest about exactly that piece; the count itself is the Closet's (finish/gains.ts, #309).
import { displayHex, type Garment } from '@kitted/core';
import type { ClosetItemRow } from '@/data/types';
import { t } from '@/i18n/en';

export interface StarterEntry {
  id: string;
  /** 02 C5's row name (the deck's starter.item.N). */
  name: string;
  budget: string;
  mid: string;
  /** No closet slot (the belt): marking it is kept in kv only. */
  slot: 'top' | 'bottom' | 'shoes' | 'outer' | null;
  /** The piece move 3 names and +N counts: "a grey quarter-zip". */
  pick: { phrase: string; name: string; garment: Garment } | null;
  /** Does a closet piece fill this row? */
  fills(g: Garment, slot: string): boolean;
}

const base: Garment = {
  pattern: 'solid', logo: 'none', volume: 3, leg_shape: 'na', hem: 'na', tucked: 'na', condition: 'clean', certainty: 'clear', length: 'na',
  pattern_scale: 'na', saturation: 'na', sleeve_end: 'na', strain: 'none', distressed_by_design: false, shows_below_outer: false,
};
const top = (subcategory: string, color_family: string, more: Partial<Garment> = {}): Garment =>
  ({ ...base, category: 'top', subcategory, color_family, tucked: 'none', length: 'at_belt', ...more });
const outer = (subcategory: string, color_family: string, more: Partial<Garment> = {}): Garment =>
  ({ ...base, category: 'outerwear', subcategory, color_family, length: 'at_belt', ...more });
const bottom = (subcategory: string, color_family: string, leg: string, more: Partial<Garment> = {}): Garment =>
  ({ ...base, category: 'bottom', subcategory, color_family, leg_shape: leg, hem: 'slight_break', ...more });
const shoe = (subcategory: string, color_family: string): Garment => ({ ...base, category: 'footwear', subcategory, color_family });

const sub = (g: Garment) => (typeof g.subcategory === 'string' ? g.subcategory : '');
const fam = (g: Garment) => (typeof g.color_family === 'string' ? g.color_family : '');
const leg = (g: Garment) => (typeof g.leg_shape === 'string' ? g.leg_shape : 'na');
const is = (...subs: string[]) => (g: Garment) => subs.includes(sub(g));
/** Straight or relaxed, or not read: only a clearly slim or skinny leg doesn't fill "straight" (seed s05's note). */
const notNarrow = (g: Garment) => !['skinny', 'slim'].includes(leg(g));

export const STARTER: readonly StarterEntry[] = [
  { id: 's01', name: t('starter.item.1'), budget: '$15–20', mid: '$35–60', slot: 'top',
    pick: { phrase: 'a white heavyweight tee', name: 'White tee', garment: top('tee', 'white') },
    fills: (g) => sub(g) === 'tee' && ['white', 'off_white_cream'].includes(fam(g)) },
  { id: 's02', name: t('starter.item.2'), budget: '$30–40', mid: '$70–120', slot: 'top',
    pick: { phrase: 'a navy polo', name: 'Navy polo', garment: top('polo', 'navy') }, fills: is('polo', 'knit_polo') },
  { id: 's03', name: t('starter.item.3'), budget: '$40–50', mid: '$70–98', slot: 'top',
    pick: { phrase: 'a light-blue oxford shirt', name: 'Light blue oxford shirt', garment: top('oxford_shirt', 'light_blue') }, fills: is('oxford_shirt') },
  { id: 's04', name: t('starter.item.4'), budget: '$40–50', mid: '$80–150', slot: 'top',
    pick: { phrase: 'a navy crewneck knit', name: 'Navy crewneck', garment: top('sweater', 'navy') }, fills: is('sweater') },
  { id: 's05', name: t('starter.item.5'), budget: '$50–60', mid: '$80–120', slot: 'bottom',
    pick: { phrase: 'dark straight jeans', name: 'Dark straight jeans', garment: bottom('jeans', 'denim_dark', 'straight') },
    fills: (g) => sub(g) === 'jeans' && ['denim_dark', 'black', 'navy', 'charcoal'].includes(fam(g)) && notNarrow(g) },
  { id: 's06', name: t('starter.item.6'), budget: '$50–60', mid: '$80–98', slot: 'bottom',
    pick: { phrase: 'khaki chinos', name: 'Khaki chinos', garment: bottom('chinos', 'khaki_beige', 'straight') },
    fills: (g) => sub(g) === 'chinos' && notNarrow(g) },
  { id: 's07', name: t('starter.item.7'), budget: '$50–70', mid: '$100–250', slot: 'outer',
    pick: { phrase: 'an olive overshirt', name: 'Olive overshirt', garment: outer('overshirt', 'olive') }, fills: is('overshirt', 'chore_coat') },
  { id: 's08', name: t('starter.item.8'), budget: '$50–90', mid: '$120–300', slot: 'outer',
    pick: { phrase: 'a denim jacket', name: 'Denim jacket', garment: outer('denim_jacket', 'denim_mid') }, fills: is('denim_jacket', 'bomber', 'field_jacket') },
  { id: 's09', name: t('starter.item.9'), budget: '$70–110', mid: '$150–300', slot: 'shoes',
    pick: { phrase: 'white leather sneakers', name: 'White leather sneakers', garment: shoe('white_leather_sneaker', 'white') },
    fills: (g) => sub(g) === 'white_leather_sneaker' || (sub(g) === 'low_profile_sneaker' && fam(g) === 'white') },
  { id: 's10', name: t('starter.item.10'), budget: '$60–110', mid: '$150–275', slot: 'shoes',
    pick: { phrase: 'brown loafers', name: 'Brown loafers', garment: shoe('loafer', 'brown') }, fills: is('loafer', 'chelsea_boot', 'work_boot', 'suede_chukka') },
  { id: 's11', name: t('starter.item.11'), budget: '$40–50', mid: '$80–150', slot: 'top',
    pick: { phrase: 'a grey quarter-zip', name: 'Grey quarter-zip', garment: top('quarter_zip', 'grey') },
    fills: (g) => sub(g) === 'quarter_zip' || (sub(g) === 'hoodie' && (g.pattern ?? 'solid') === 'solid' && g.logo !== 'large') },
  { id: 's12', name: t('starter.item.12'), budget: 'About $30', mid: '$50–100', slot: null, pick: null, fills: () => false },
];

const LOOSE = ['relaxed', 'wide'];

type Row = Omit<StarterEntry, 'pick'> & { pick: NonNullable<StarterEntry['pick']> };
const row = (id: string, name: string, budget: string, mid: string, slot: Row['slot'], phrase: string, pickName: string, garment: Garment,
  fills: Row['fills']): Row => ({ id, name, budget, mid, slot, pick: { phrase, name: pickName, garment }, fills });

/** The rows for the looks (#313, 09-ui-review §16; approved Oct 17). Prices: US list prices seen Oct 16, 2026, budget / mid, sources in 09-ui-review §16. */
export const LOOK_ROWS: readonly StarterEntry[] = [
  row('s13', t('starter.item.13'), '$40–60', '$80–130', 'bottom', 'baggy dark jeans', 'Baggy dark jeans',
    bottom('jeans', 'denim_dark', 'wide'), (g) => sub(g) === 'jeans' && LOOSE.includes(leg(g))),
  row('s14', t('starter.item.14'), '$15–25', '$45–65', 'top', 'a black boxy tee', 'Black boxy tee',
    top('tee', 'black', { volume: 4 }), (g) => sub(g) === 'tee' && ['black', 'charcoal'].includes(fam(g))),
  row('s15', t('starter.item.15'), '$25–50', '$90–150', 'top', 'a plain grey hoodie', 'Grey hoodie',
    top('hoodie', 'grey', { volume: 4 }), (g) => sub(g) === 'hoodie' && (g.pattern ?? 'solid') === 'solid' && g.logo !== 'large'),
  row('s16', t('starter.item.16'), '$20–40', '$85–145', 'top', 'a grey crewneck sweatshirt', 'Grey sweatshirt',
    top('sweatshirt', 'grey'), is('sweatshirt')),
  row('s17', t('starter.item.17'), '$35–55', '$65–120', 'bottom', 'olive cargo pants', 'Olive cargos',
    bottom('cargos', 'olive', 'relaxed'), is('cargos')),
  row('s18', t('starter.item.18'), '$45–80', '$110–170', 'shoes', 'chunky sneakers', 'Chunky sneakers',
    shoe('chunky_sneaker', 'white'), is('chunky_sneaker', 'basketball_sneaker')),
  row('s19', t('starter.item.19'), '$40–80', '$140–220', 'outer', 'a black bomber jacket', 'Black bomber',
    outer('bomber', 'black'), is('bomber')),
  row('s20', t('starter.item.20'), '$45–90', '$130–240', 'outer', 'a black puffer jacket', 'Black puffer',
    outer('puffer', 'black'), is('puffer')),
  row('s21', t('starter.item.21'), '$25–45', '$55–130', 'top', 'a flannel shirt', 'Flannel shirt',
    top('flannel_shirt', 'olive', { pattern: 'checks_plaid', pattern_scale: 'medium', saturation: 'muted' }), is('flannel_shirt')),
  row('s22', t('starter.item.22'), '$15–25', '$45–65', 'top', 'a grey heavyweight tee', 'Grey tee',
    top('tee', 'grey'), (g) => sub(g) === 'tee' && ['grey', 'light_grey'].includes(fam(g))),
  row('s23', t('starter.item.23'), '$40–80', '$95–200', 'bottom', 'black wide-leg trousers', 'Black wide trousers',
    bottom('trousers', 'black', 'wide', { hem: 'no_break' }), (g) => sub(g) === 'trousers' && LOOSE.includes(leg(g))),
  row('s24', t('starter.item.24'), '$40–90', '$150–250', 'shoes', 'black loafers', 'Black loafers',
    shoe('loafer', 'black'), is('loafer', 'chelsea_boot')),
  row('s25', t('starter.item.25'), '$70–150', '$240–450', 'outer', 'a charcoal wool overcoat', 'Charcoal overcoat',
    outer('overcoat', 'charcoal', { length: 'below_crotch' }), is('overcoat')),
  row('s26', t('starter.item.26'), '$45–80', '$110–190', 'outer', 'a tan chore coat', 'Tan chore coat',
    outer('chore_coat', 'tan_camel'), is('chore_coat')),
  row('s27', t('starter.item.27'), '$50–70', '$135–200', 'shoes', 'brown work boots', 'Brown work boots',
    shoe('work_boot', 'brown'), is('work_boot')),
  row('s28', t('starter.item.28'), '$40–75', '$95–130', 'outer', 'a denim jacket', 'Denim jacket',
    outer('denim_jacket', 'denim_mid'), is('denim_jacket')),
  row('s29', t('starter.item.29'), '$40–70', '$110–200', 'shoes', 'brown suede chukkas', 'Brown suede chukkas',
    shoe('suede_chukka', 'brown'), is('suede_chukka')),
  row('s30', t('starter.item.30'), '$40–60', '$75–130', 'top', 'a navy cardigan', 'Navy cardigan',
    top('cardigan', 'navy'), is('cardigan')),
  row('s31', t('starter.item.31'), '$35–50', '$95–140', 'top', 'a striped rugby shirt', 'Striped rugby shirt',
    top('rugby_shirt', 'navy', { pattern: 'stripes', pattern_scale: 'medium' }), is('rugby_shirt')),
  row('s32', t('starter.item.32'), '$20–40', '$85–120', 'top', 'a retro soccer jersey', 'Retro jersey',
    top('jersey', 'green', { saturation: 'muted' }), is('jersey')),
  row('s33', t('starter.item.33'), '$40–70', '$90–150', 'shoes', 'grey retro runners', 'Grey retro runners',
    shoe('retro_runner', 'grey'), is('retro_runner')),
  row('s34', t('starter.item.34'), '$40–70', '$75–130', 'shoes', 'brown suede low-profile sneakers', 'Suede low-profile sneakers',
    shoe('low_profile_sneaker', 'brown'), (g) => sub(g) === 'low_profile_sneaker' && fam(g) !== 'white'),
  row('s35', t('starter.item.35'), '$40–60', '$85–125', 'bottom', 'light-wash straight jeans', 'Light-wash straight jeans',
    bottom('jeans', 'denim_light', 'straight'),
    (g) => sub(g) === 'jeans' && ['denim_light', 'denim_mid'].includes(fam(g)) && !['skinny', 'slim', ...LOOSE].includes(leg(g))),
  row('s36', t('starter.item.36'), '$30–50', '$65–170', 'top', 'a fleece', 'Fleece',
    top('fleece', 'olive'), is('fleece')),
  row('s37', t('starter.item.37'), '$35–80', '$100–190', 'outer', 'a shell jacket', 'Shell jacket',
    outer('shell_jacket', 'olive'), is('shell_jacket', 'rain_jacket')),
  row('s38', t('starter.item.38'), '$60–120', '$140–200', 'shoes', 'trail-style sneakers', 'Trail-style sneakers',
    shoe('performance_runner', 'grey'), is('performance_runner')),
];

/** Every Starter row there is (today's 12, then the looks' rows; ids never removed or renumbered): what a stored id looks
 *  up (a closet piece's `starterId`, the kv marks, a chat buy card, move 3's `buyId`). Which 12 he sees: finish/packs.ts. */
export const CATALOG: readonly StarterEntry[] = [...STARTER, ...LOOK_ROWS];
export const catalogRow = (id: string): StarterEntry | undefined => CATALOG.find((e) => e.id === id);

/** C5's footer card. */
export const NEXT_STEP = { name: t('starter.next.item'), budget: '$80–150', mid: '$200–400' } as const;

const live = (c: ClosetItemRow) => !c.isDeleted && !c.mergedInto;

export type Ownership = { owned: false } | { owned: true; how: 'closet' | 'marked'; itemId: string | null };

/** Each row's state: a piece he marked here (its starterId), a piece seen in his checks that fills it, or the belt's kv mark. */
export function ownership(closet: readonly ClosetItemRow[], markedKv: readonly string[]): Record<string, Ownership> {
  const out: Record<string, Ownership> = {};
  const pieces = closet.filter(live);
  for (const e of CATALOG) {
    const marked = pieces.find((c) => c.starterId === e.id && !c.isPhotographed);
    const seen = pieces.find((c) => !(c.starterId === e.id && !c.isPhotographed) && e.slot !== null && e.fills(c.garment, String(c.slot)));
    if (seen) out[e.id] = { owned: true, how: 'closet', itemId: seen.id };
    else if (marked) out[e.id] = { owned: true, how: 'marked', itemId: marked.id };
    else if (markedKv.includes(e.id)) out[e.id] = { owned: true, how: 'marked', itemId: null };
    else out[e.id] = { owned: false };
  }
  return out;
}

/** How many of these rows he owns (the list he sees: `ids`; every row when left out). */
export const ownedCount = (o: Record<string, Ownership>, ids?: readonly string[]): number =>
  (ids ?? Object.keys(o)).filter((id) => o[id]?.owned).length;

/** A not-photographed closet piece for a row he taps (02 C5 "Tap to own"). */
export function markedPiece(e: StarterEntry, id: string, nowMs: number): ClosetItemRow | null {
  if (!e.pick || !e.slot) return null;
  return {
    id, name: e.pick.name, slot: e.slot, garment: { ...e.pick.garment }, confirmedFields: [], hex: displayHex(e.pick.garment.color_family), photoFile: null,
    demoPhotoId: null, isPhotographed: false, source: 'added', starterId: e.id, wornCount: 0, lastWornAt: null, addedAt: nowMs, isDeleted: false,
    mergedInto: null, maybeSameAs: null, cropFile: null, cropScore: null, updatedAt: nowMs, profile: { aliases: [], distinctFrom: [], confirmed: {} },
  };
}

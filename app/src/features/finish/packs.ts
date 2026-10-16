// Starter basics that follow his looks (09-ui-review §16, #313). DRAFT for the founder's review: nothing imports this
// yet, so no screen changes. One catalog (today's s01–s12 plus s13–s38, ids never removed or renumbered: closet rows,
// kv marks, chat cards and move 3 store them), and one ranked list of 12 per look built from rubric/v5-styles.md's
// signature and home pieces. His up to 3 picks blend in order; no picks (or "Not sure") keeps today's 12. The list only
// chooses which pieces are candidates: every "+N" is still the Closet's count (finish/gains.ts, #309) and no list
// changes a score (#211). Pure.
import type { Garment, Styles } from '@kitted/core';
import { normStyleKey, type StyleKey } from '@/data/types';
import { STARTER, type StarterEntry } from './starter';

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
const LOOSE = ['relaxed', 'wide'];

type Row = Omit<StarterEntry, 'pick'> & { pick: NonNullable<StarterEntry['pick']> };
const row = (id: string, name: string, budget: string, mid: string, slot: Row['slot'], phrase: string, pickName: string, garment: Garment,
  fills: Row['fills']): Row => ({ id, name, budget, mid, slot, pick: { phrase, name: pickName, garment }, fills });

/** The new rows (names and prices are outward-facing: the founder's review). Prices: US list prices seen Oct 16, 2026, budget / mid, sources in 09-ui-review §16. */
export const LOOK_ROWS: readonly StarterEntry[] = [
  row('s13', 'Baggy or wide-leg jeans', '$40–60', '$80–130', 'bottom', 'baggy dark jeans', 'Baggy dark jeans',
    bottom('jeans', 'denim_dark', 'wide'), (g) => sub(g) === 'jeans' && LOOSE.includes(leg(g))),
  row('s14', 'Black boxy tee', '$15–25', '$45–65', 'top', 'a black boxy tee', 'Black boxy tee',
    top('tee', 'black', { volume: 4 }), (g) => sub(g) === 'tee' && ['black', 'charcoal'].includes(fam(g))),
  row('s15', 'Plain hoodie', '$25–50', '$90–150', 'top', 'a plain grey hoodie', 'Grey hoodie',
    top('hoodie', 'grey', { volume: 4 }), (g) => sub(g) === 'hoodie' && (g.pattern ?? 'solid') === 'solid' && g.logo !== 'large'),
  row('s16', 'Crewneck sweatshirt', '$20–40', '$85–145', 'top', 'a grey crewneck sweatshirt', 'Grey sweatshirt',
    top('sweatshirt', 'grey'), is('sweatshirt')),
  row('s17', 'Cargo pants', '$35–55', '$65–120', 'bottom', 'olive cargo pants', 'Olive cargos',
    bottom('cargos', 'olive', 'relaxed'), is('cargos')),
  row('s18', 'Chunky sneakers', '$45–80', '$110–170', 'shoes', 'chunky sneakers', 'Chunky sneakers',
    shoe('chunky_sneaker', 'white'), is('chunky_sneaker', 'basketball_sneaker')),
  row('s19', 'Bomber jacket', '$40–80', '$140–220', 'outer', 'a black bomber jacket', 'Black bomber',
    outer('bomber', 'black'), is('bomber')),
  row('s20', 'Puffer jacket', '$45–90', '$130–240', 'outer', 'a black puffer jacket', 'Black puffer',
    outer('puffer', 'black'), is('puffer')),
  row('s21', 'Flannel shirt', '$25–45', '$55–130', 'top', 'a flannel shirt', 'Flannel shirt',
    top('flannel_shirt', 'olive', { pattern: 'checks_plaid', pattern_scale: 'medium', saturation: 'muted' }), is('flannel_shirt')),
  row('s22', 'Grey heavyweight tee', '$15–25', '$45–65', 'top', 'a grey heavyweight tee', 'Grey tee',
    top('tee', 'grey'), (g) => sub(g) === 'tee' && ['grey', 'light_grey'].includes(fam(g))),
  row('s23', 'Wide-leg trousers', '$40–80', '$95–200', 'bottom', 'black wide-leg trousers', 'Black wide trousers',
    bottom('trousers', 'black', 'wide', { hem: 'no_break' }), (g) => sub(g) === 'trousers' && LOOSE.includes(leg(g))),
  row('s24', 'Loafers or Chelsea boots', '$40–90', '$150–250', 'shoes', 'black loafers', 'Black loafers',
    shoe('loafer', 'black'), is('loafer', 'chelsea_boot')),
  row('s25', 'Wool overcoat', '$70–150', '$240–450', 'outer', 'a charcoal wool overcoat', 'Charcoal overcoat',
    outer('overcoat', 'charcoal', { length: 'below_crotch' }), is('overcoat')),
  row('s26', 'Chore coat', '$45–80', '$110–190', 'outer', 'a tan chore coat', 'Tan chore coat',
    outer('chore_coat', 'tan_camel'), is('chore_coat')),
  row('s27', 'Work boots', '$50–70', '$135–200', 'shoes', 'brown work boots', 'Brown work boots',
    shoe('work_boot', 'brown'), is('work_boot')),
  row('s28', 'Denim jacket', '$40–75', '$95–130', 'outer', 'a denim jacket', 'Denim jacket',
    outer('denim_jacket', 'denim_mid'), is('denim_jacket')),
  row('s29', 'Suede chukka boots', '$40–70', '$110–200', 'shoes', 'brown suede chukkas', 'Brown suede chukkas',
    shoe('suede_chukka', 'brown'), is('suede_chukka')),
  row('s30', 'Cardigan', '$40–60', '$75–130', 'top', 'a navy cardigan', 'Navy cardigan',
    top('cardigan', 'navy'), is('cardigan')),
  row('s31', 'Rugby shirt', '$35–50', '$95–140', 'top', 'a striped rugby shirt', 'Striped rugby shirt',
    top('rugby_shirt', 'navy', { pattern: 'stripes', pattern_scale: 'medium' }), is('rugby_shirt')),
  row('s32', 'Retro soccer jersey', '$20–40', '$85–120', 'top', 'a retro soccer jersey', 'Retro jersey',
    top('jersey', 'green', { saturation: 'muted' }), is('jersey')),
  row('s33', 'Retro runners', '$40–70', '$90–150', 'shoes', 'grey retro runners', 'Grey retro runners',
    shoe('retro_runner', 'grey'), is('retro_runner')),
  row('s34', 'Low-profile suede sneakers', '$40–70', '$75–130', 'shoes', 'brown suede low-profile sneakers', 'Suede low-profile sneakers',
    shoe('low_profile_sneaker', 'brown'), (g) => sub(g) === 'low_profile_sneaker' && fam(g) !== 'white'),
  row('s35', 'Light-wash straight jeans', '$40–60', '$85–125', 'bottom', 'light-wash straight jeans', 'Light-wash straight jeans',
    bottom('jeans', 'denim_light', 'straight'),
    (g) => sub(g) === 'jeans' && ['denim_light', 'denim_mid'].includes(fam(g)) && !['skinny', 'slim', ...LOOSE].includes(leg(g))),
  row('s36', 'Fleece', '$30–50', '$65–170', 'top', 'a fleece', 'Fleece',
    top('fleece', 'olive'), is('fleece')),
  row('s37', 'Shell jacket', '$35–80', '$100–190', 'outer', 'a shell jacket', 'Shell jacket',
    outer('shell_jacket', 'olive'), is('shell_jacket', 'rain_jacket')),
  row('s38', 'Trail-style sneakers', '$60–120', '$140–200', 'shoes', 'trail-style sneakers', 'Trail-style sneakers',
    shoe('performance_runner', 'grey'), is('performance_runner')),
];

/** Every Starter row there is: what a stored id (closet `starterId`, kv marks, a chat card, move 3's `buyId`) looks up. */
export const CATALOG: readonly StarterEntry[] = [...STARTER, ...LOOK_ROWS];
export const catalogRow = (id: string): StarterEntry | undefined => CATALOG.find((e) => e.id === id);

/** In every list: the white tee, white leather sneakers and the belt. */
export const CORE_IDS = ['s01', 's09', 's12'] as const;
/** No picks, or "Not sure": today's 12 in today's order. */
export const COMMON_IDS: readonly string[] = STARTER.map((e) => e.id);
export const LIST_SIZE = 12;

export interface LookPack {
  /** 12 rows, most useful first (the order on screen and the tie-break for "+N"). */
  ids: readonly string[];
  /** The plain outfit that defines the look, from v5-styles' own examples: the rules test runs every piece against it. */
  anchor: { top: string; bottom: string; shoes: string; outer?: string };
  /** The look's own pieces (signature or home in v5-styles): swapped into the anchor, the outfit still reads as the look. */
  own: readonly string[];
}

export const PACKS: Readonly<Record<StyleKey, LookPack>> = {
  // [STR-1]/[STR-2]: "Grey hoodie + wide jeans + chunky sneakers reads as streetwear".
  streetwear: {
    ids: ['s15', 's13', 's18', 's14', 's17', 's16', 's19', 's01', 's09', 's21', 's20', 's12'],
    anchor: { top: 's15', bottom: 's13', shoes: 's18' },
    own: ['s15', 's13', 's18', 's14', 's17', 's16', 's19', 's21', 's20', 's01', 's09'],
  },
  // [MIN-2]/[MIN-4]: a sweater over wide trousers with loafers.
  minimalist: {
    ids: ['s04', 's23', 's24', 's14', 's06', 's01', 's09', 's22', 's25', 's05', 's07', 's12'],
    anchor: { top: 's04', bottom: 's23', shoes: 's24' },
    own: ['s04', 's23', 's24', 's14', 's06', 's09', 's25', 's07'],
  },
  // [SMC-4]: "a navy polo with chinos and white leather sneakers is smart casual top to toe". Today's list, unchanged.
  smart_casual: {
    ids: COMMON_IDS,
    anchor: { top: 's02', bottom: 's06', shoes: 's09' },
    own: ['s02', 's03', 's04', 's06', 's07', 's09', 's10', 's11', 's05'],
  },
  // [WRK-1]/[WRK-4]: "A tan chore coat over a white tee with dark jeans and work boots reads as workwear".
  workwear: {
    ids: ['s26', 's27', 's05', 's21', 's01', 's28', 's17', 's29', 's22', 's04', 's09', 's12'],
    anchor: { top: 's01', bottom: 's05', shoes: 's27', outer: 's26' },
    own: ['s26', 's27', 's05', 's21', 's28', 's17', 's29'],
  },
  // [PRP-1]: a collared top in a color (the light-blue oxford) with chinos and loafers. The knit and the quarter-zip
  // are prep's home pieces: worn as the one top (the closet's outfits have one), they read smart casual, so not `own`.
  classic_prep: {
    ids: ['s03', 's02', 's06', 's10', 's30', 's04', 's31', 's11', 's01', 's05', 's09', 's12'],
    anchor: { top: 's03', bottom: 's06', shoes: 's10' },
    own: ['s03', 's02', 's06', 's10', 's30', 's31', 's09'],
  },
  // [VSP-1]: "A green jersey + dark straight jeans + retro runners reads as vintage sport".
  vintage_sport: {
    ids: ['s32', 's31', 's33', 's34', 's05', 's35', 's16', 's06', 's01', 's09', 's19', 's12'],
    anchor: { top: 's32', bottom: 's05', shoes: 's33' },
    own: ['s32', 's31', 's33', 's34', 's05', 's35', 's06'],
  },
  // [OUT-1]: "An orange shell over a tee with olive cargos and low-profile sneakers reads as outdoor".
  outdoor: {
    ids: ['s36', 's37', 's17', 's38', 's01', 's22', 's21', 's05', 's16', 's20', 's09', 's12'],
    anchor: { top: 's01', bottom: 's17', shoes: 's38', outer: 's37' },
    own: ['s36', 's37', 's17', 's38', 's21'],
  },
};

/** One piece would fill both rows (his one pair of wide jeans showing as two basics): never both in one list. */
export function overlaps(a: StarterEntry, b: StarterEntry): boolean {
  if (a.id === b.id || !a.pick || !b.pick || !a.slot || !b.slot) return false;
  return (a.slot === b.slot && a.fills(b.pick.garment, b.slot)) || (b.slot === a.slot && b.fills(a.pick.garment, a.slot));
}

/** His picks as looks, in his order: old keys mapped, unknown and repeats dropped, at most 3. */
export function picksOf(styles: Styles | null): StyleKey[] {
  const out: StyleKey[] = [];
  for (const [name] of styles ?? []) {
    const k = normStyleKey(name);
    if (k && !out.includes(k)) out.push(k);
  }
  return out.slice(0, 3);
}

/** How many of the 9 non-core rows each pick gets, by his order. */
export const QUOTAS: Readonly<Record<1 | 2 | 3, readonly number[]>> = { 1: [9], 2: [6, 3], 3: [4, 3, 2] };

const byId = (id: string): StarterEntry => {
  const e = catalogRow(id);
  if (!e) throw new Error(`no Starter row ${id}`);
  return e;
};

/**
 * The 12 rows Starter essentials shows him. No picks: today's 12. One pick: that look's 12. Two or three: the core,
 * then each pick's best rows by QUOTAS in his order, skipping a row already in or one that overlaps one in; any slot left
 * is refilled from his picks in order, then today's list. Order on screen: his first pick's list order, then each later
 * pick's rows in theirs, so ties in "+N" go to his first pick.
 */
export function starterList(styles: Styles | null): StarterEntry[] {
  const looks = picksOf(styles);
  if (looks.length === 0) return COMMON_IDS.map(byId);
  const packs = looks.map((k) => PACKS[k]);
  if (packs.length === 1) return packs[0]!.ids.map(byId);
  const chosen: StarterEntry[] = CORE_IDS.map(byId);
  const add = (id: string): boolean => {
    const e = byId(id);
    if (chosen.some((c) => c.id === id || overlaps(c, e))) return false;
    chosen.push(e);
    return true;
  };
  const nonCore = (p: LookPack) => p.ids.filter((id) => !(CORE_IDS as readonly string[]).includes(id));
  const quota = QUOTAS[packs.length as 2 | 3];
  packs.forEach((p, i) => {
    let took = 0;
    for (const id of nonCore(p)) {
      if (took >= quota[i]!) break;
      if (add(id)) took += 1;
    }
  });
  for (const id of [...packs.flatMap(nonCore), ...COMMON_IDS]) {
    if (chosen.length >= LIST_SIZE) break;
    add(id);
  }
  const ids = new Set(chosen.map((e) => e.id));
  const order: string[] = [];
  for (const p of packs) for (const id of p.ids) if (ids.has(id) && !order.includes(id)) order.push(id);
  for (const e of chosen) if (!order.includes(e.id)) order.push(e.id);
  return order.map(byId);
}

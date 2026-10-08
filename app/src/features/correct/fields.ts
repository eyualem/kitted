// What "Not quite right?" can change per piece (02 D9), as schema values.
import { RUBRIC_DATA, type Garment } from '@kitted/core';
import { t, type StringKey } from '@/i18n/en';

export interface FieldOption {
  label: string;
  value: Garment[keyof Garment];
}

const TOP_FIT: [StringKey, number][] = [
  ['value.topFit.slim', 2], ['value.topFit.regular', 3], ['value.topFit.relaxed', 4], ['value.topFit.oversized', 5],
];
const LEG: [StringKey, string][] = [
  ['value.leg.skinny', 'skinny'], ['value.leg.slim', 'slim'], ['value.leg.straight', 'straight'], ['value.leg.relaxed', 'relaxed'], ['value.leg.wide', 'wide'],
];

/** The one fit field each slot edits in "Wrong color or fit" (P2: fit; color, hem, sleeves and tuck come later). */
export function fitField(g: Garment): { field: 'volume' | 'leg_shape'; options: FieldOption[] } | null {
  if (g.category === 'top' || g.category === 'outerwear') return { field: 'volume', options: TOP_FIT.map(([k, v]) => ({ label: t(k), value: v })) };
  if (g.category === 'bottom') return { field: 'leg_shape', options: LEG.map(([k, v]) => ({ label: t(k), value: v })) };
  return null;
}

/** "Wrong item": the types offered for each slot. */
const TYPES: Record<string, string[]> = {
  top: ['tee', 'polo', 'oxford_shirt', 'sweater', 'hoodie', 'sweatshirt'],
  outerwear: ['overshirt', 'denim_jacket', 'blazer', 'bomber', 'chore_coat'],
  bottom: ['jeans', 'chinos', 'trousers', 'sweatpants', 'joggers', 'shorts', 'athletic_shorts'],
  footwear: ['white_leather_sneaker', 'retro_runner', 'loafer', 'chelsea_boot', 'work_boot'],
};

/** The slot's types, plus what it was read as and that type's look-alikes from the one quick tap (rubric v4
 *  tap.pairs), so the answer can always be changed here ("Scored as jeans. Not right? Tap."). */
export function typeOptions(g: Garment, name: (sub: string) => string): FieldOption[] {
  const cat = String(g.category);
  const cur = typeof g.subcategory === 'string' ? g.subcategory : null;
  const lookAlikes = cur ? (RUBRIC_DATA.tap.pairs[cat] ?? []).flatMap(([a, b]) => (a === cur ? [b] : b === cur ? [a] : [])) : [];
  const subs = [...(TYPES[cat] ?? []), ...(cur ? [cur] : []), ...lookAlikes].filter((s, i, all) => all.indexOf(s) === i);
  return subs.map((sub) => ({ label: name(sub), value: sub }));
}

/** The fit word for a top's volume (1–5). */
export function volumeWord(v: unknown): string {
  const n = typeof v === 'number' ? v : 3;
  return t(n <= 2 ? 'value.topFit.slim' : n === 3 ? 'value.topFit.regular' : n === 4 ? 'value.topFit.relaxed' : 'value.topFit.oversized');
}

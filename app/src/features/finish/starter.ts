// The Starter 12 essentials (02 C5; items and 2026 prices from rubric/v3.md): which ones his closet already has, and
// what each missing one would add ("+N fits" = rotation with it − rotation without it, core rotation.ts). Pure.
// Each row has one concrete piece (`pick`) for Next best buy's "a grey quarter-zip" and the +N count, so the number is
// honest about exactly that piece, and the kinds and colors he can say he owns (`owns`, #342).
import { displayHex, rotation, type ClosetItem, type Garment, type Styles } from '@kitted/core';
import type { ClosetItemRow } from '@/data/types';
import { baseName } from '@/features/closet/itemName';
import { t } from '@/i18n/en';

/** One "Which one is yours?" choice: a kind and a color (and a leg for bottoms). */
export interface StarterOption {
  subcategory: string;
  color: string;
}

export interface StarterEntry {
  id: string;
  /** 02 C5's row name (the deck's starter.item.N). */
  name: string;
  budget: string;
  mid: string;
  /** No closet slot (the belt): marking it is kept in kv only. */
  slot: 'top' | 'bottom' | 'shoes' | 'outer' | null;
  /** The piece Next best buy and the chat's buy cards name, and +N counts: "a grey quarter-zip". */
  pick: { phrase: string; name: string; garment: Garment } | null;
  /** What he can say he owns (10-onboarding.md §9.11, #342): the realistic kinds and colors, his pick becomes the
   *  piece. Empty for the belt (no closet slot). */
  owns: readonly StarterOption[];
  /** Does a closet piece fill this row? */
  fills(g: Garment, slot: string): boolean;
}

const base: Garment = {
  pattern: 'solid', logo: 'none', volume: 3, leg_shape: 'na', hem: 'na', tucked: 'na', condition: 'clean', certainty: 'clear', length: 'na',
  pattern_scale: 'na', saturation: 'na', sleeve_end: 'na', strain: 'none', distressed_by_design: false, shows_below_outer: false,
};
const top = (subcategory: string, color_family: string): Garment => ({ ...base, category: 'top', subcategory, color_family, tucked: 'none', length: 'at_belt' });
const outer = (subcategory: string, color_family: string): Garment => ({ ...base, category: 'outerwear', subcategory, color_family, length: 'at_belt' });
const bottom = (subcategory: string, color_family: string, leg: string): Garment => ({ ...base, category: 'bottom', subcategory, color_family, leg_shape: leg, hem: 'slight_break' });
const shoe = (subcategory: string, color_family: string): Garment => ({ ...base, category: 'footwear', subcategory, color_family });

const o = (subcategory: string, color: string): StarterOption => ({ subcategory, color });

const sub = (g: Garment) => (typeof g.subcategory === 'string' ? g.subcategory : '');
const fam = (g: Garment) => (typeof g.color_family === 'string' ? g.color_family : '');
const leg = (g: Garment) => (typeof g.leg_shape === 'string' ? g.leg_shape : 'na');
const is = (...subs: string[]) => (g: Garment) => subs.includes(sub(g));
/** Straight or relaxed, or not read: only a clearly slim or skinny leg doesn't fill "straight" (seed s05's note). */
const notNarrow = (g: Garment) => !['skinny', 'slim'].includes(leg(g));

export const STARTER: readonly StarterEntry[] = [
  { id: 's01', name: t('starter.item.1'), budget: '$15–20', mid: '$35–60', slot: 'top',
    pick: { phrase: 'a white heavyweight tee', name: 'White tee', garment: top('tee', 'white') },
    owns: [o('tee', 'black'), o('tee', 'white'), o('tee', 'grey'), o('tee', 'navy'), o('tee', 'off_white_cream'), o('tee', 'olive')],
    fills: (g) => sub(g) === 'tee' && ['white', 'off_white_cream'].includes(fam(g)) },
  { id: 's02', name: t('starter.item.2'), budget: '$30–40', mid: '$70–120', slot: 'top',
    pick: { phrase: 'a navy polo', name: 'Navy polo', garment: top('polo', 'navy') }, owns: [o('polo', 'navy'), o('polo', 'black'), o('polo', 'white'), o('polo', 'grey'), o('polo', 'olive')],
    fills: is('polo', 'knit_polo') },
  { id: 's03', name: t('starter.item.3'), budget: '$40–50', mid: '$70–98', slot: 'top',
    pick: { phrase: 'a light-blue oxford shirt', name: 'Light blue oxford shirt', garment: top('oxford_shirt', 'light_blue') }, owns: [o('oxford_shirt', 'light_blue'), o('oxford_shirt', 'white')],
    fills: is('oxford_shirt') },
  { id: 's04', name: t('starter.item.4'), budget: '$40–50', mid: '$80–150', slot: 'top',
    pick: { phrase: 'a navy crewneck knit', name: 'Navy crewneck', garment: top('sweater', 'navy') }, owns: [o('sweater', 'navy'), o('sweater', 'grey'), o('sweater', 'charcoal'), o('sweater', 'black'), o('sweater', 'off_white_cream'), o('sweater', 'olive')],
    fills: is('sweater') },
  { id: 's05', name: t('starter.item.5'), budget: '$50–60', mid: '$80–120', slot: 'bottom',
    pick: { phrase: 'dark straight jeans', name: 'Dark straight jeans', garment: bottom('jeans', 'denim_dark', 'straight') },
    owns: [o('jeans', 'denim_dark'), o('jeans', 'black'), o('jeans', 'denim_mid'), o('jeans', 'denim_light')],
    fills: (g) => sub(g) === 'jeans' && ['denim_dark', 'black', 'navy', 'charcoal'].includes(fam(g)) && notNarrow(g) },
  { id: 's06', name: t('starter.item.6'), budget: '$50–60', mid: '$80–98', slot: 'bottom',
    pick: { phrase: 'khaki chinos', name: 'Khaki chinos', garment: bottom('chinos', 'khaki_beige', 'straight') },
    owns: [o('chinos', 'khaki_beige'), o('chinos', 'navy'), o('chinos', 'olive'), o('chinos', 'black'), o('chinos', 'grey')],
    fills: (g) => sub(g) === 'chinos' && notNarrow(g) },
  { id: 's07', name: t('starter.item.7'), budget: '$50–70', mid: '$100–250', slot: 'outer',
    pick: { phrase: 'an olive overshirt', name: 'Olive overshirt', garment: outer('overshirt', 'olive') }, owns: [o('overshirt', 'olive'), o('overshirt', 'navy'), o('overshirt', 'tan_camel'), o('overshirt', 'black'), o('overshirt', 'grey')],
    fills: is('overshirt', 'chore_coat') },
  { id: 's08', name: t('starter.item.8'), budget: '$50–90', mid: '$120–300', slot: 'outer',
    pick: { phrase: 'a denim jacket', name: 'Denim jacket', garment: outer('denim_jacket', 'denim_mid') }, owns: [o('denim_jacket', 'denim_mid'), o('denim_jacket', 'denim_dark'), o('denim_jacket', 'black'), o('bomber', 'black'), o('bomber', 'olive')],
    fills: is('denim_jacket', 'bomber', 'field_jacket') },
  { id: 's09', name: t('starter.item.9'), budget: '$70–110', mid: '$150–300', slot: 'shoes',
    pick: { phrase: 'white leather sneakers', name: 'White leather sneakers', garment: shoe('white_leather_sneaker', 'white') },
    owns: [o('white_leather_sneaker', 'white'), o('low_profile_sneaker', 'black')],
    fills: (g) => sub(g) === 'white_leather_sneaker' || (sub(g) === 'low_profile_sneaker' && fam(g) === 'white') },
  { id: 's10', name: t('starter.item.10'), budget: '$60–110', mid: '$150–275', slot: 'shoes',
    pick: { phrase: 'brown loafers', name: 'Brown loafers', garment: shoe('loafer', 'brown') }, owns: [o('loafer', 'brown'), o('loafer', 'black'), o('work_boot', 'brown'), o('chelsea_boot', 'black'), o('chelsea_boot', 'brown')],
    fills: is('loafer', 'chelsea_boot', 'work_boot', 'suede_chukka') },
  { id: 's11', name: t('starter.item.11'), budget: '$40–50', mid: '$80–150', slot: 'top',
    pick: { phrase: 'a grey quarter-zip', name: 'Grey quarter-zip', garment: top('quarter_zip', 'grey') },
    owns: [o('quarter_zip', 'grey'), o('quarter_zip', 'navy'), o('hoodie', 'grey'), o('hoodie', 'black'), o('hoodie', 'navy')],
    fills: (g) => sub(g) === 'quarter_zip' || (sub(g) === 'hoodie' && (g.pattern ?? 'solid') === 'solid' && g.logo !== 'large') },
  { id: 's12', name: t('starter.item.12'), budget: 'About $30', mid: '$50–100', slot: null, pick: null, owns: [], fills: () => false },
];

const live = (c: ClosetItemRow) => !c.isDeleted && !c.mergedInto;

export type Ownership = { owned: false } | { owned: true; how: 'closet' | 'marked'; itemId: string | null };

/** Each row's state: a piece he marked here (its starterId), a piece seen in his checks that fills it, or the belt's kv mark. */
export function ownership(closet: readonly ClosetItemRow[], markedKv: readonly string[]): Record<string, Ownership> {
  const out: Record<string, Ownership> = {};
  const pieces = closet.filter(live);
  for (const e of STARTER) {
    const marked = pieces.find((c) => c.starterId === e.id && !c.isPhotographed);
    const seen = pieces.find((c) => !(c.starterId === e.id && !c.isPhotographed) && e.slot !== null && e.fills(c.garment, String(c.slot)));
    if (seen) out[e.id] = { owned: true, how: 'closet', itemId: seen.id };
    else if (marked) out[e.id] = { owned: true, how: 'marked', itemId: marked.id };
    else if (markedKv.includes(e.id)) out[e.id] = { owned: true, how: 'marked', itemId: null };
    else out[e.id] = { owned: false };
  }
  return out;
}

export const ownedCount = (o: Record<string, Ownership>): number => Object.values(o).filter((x) => x.owned).length;

/** Above this many pieces, "+N fits" isn't counted (the rotation is a nested loop over his closet). */
export const GAIN_MAX_PIECES = 40;

/** Outfits his closet makes (Put together at Everyday; layers don't multiply, 02 D15). */
export function outfitCount(closet: readonly ClosetItem[], styles: Styles | null): number {
  return rotation(closet, styles, { layers: false }).count;
}

/** "+N fits" for adding `g` (0 when it adds none, null when the closet is too big to count). */
export function fitsGain(closet: readonly ClosetItemRow[], styles: Styles | null, g: Garment, slot: string): number | null {
  // A piece he only mentioned in chat isn't counted in a "+N" until a fit check sees it (07 §4).
  const pieces = closet.filter(live).filter((c) => c.source !== 'chat');
  if (pieces.length > GAIN_MAX_PIECES) return null;
  const before = outfitCount(pieces, styles);
  const after = outfitCount([...pieces, { id: '__starter', name: '', slot, garment: g }], styles);
  return Math.max(0, after - before);
}

/** The missing row that adds the most outfits (02's order breaks ties); null when every wearable row is owned. */
export function bestMissing(closet: readonly ClosetItemRow[], styles: Styles | null, markedKv: readonly string[]): { entry: StarterEntry; gain: number } | null {
  const own = ownership(closet, markedKv);
  let best: { entry: StarterEntry; gain: number } | null = null;
  for (const e of STARTER) {
    if (own[e.id]?.owned || !e.pick || !e.slot) continue;
    const gain = fitsGain(closet, styles, e.pick.garment, e.slot) ?? 0;
    if (!best || gain > best.gain) best = { entry: e, gain };
  }
  return best;
}

/** The garment for one "Which one is yours?" choice: the row's piece in his kind and color. */
export function ownedGarment(e: StarterEntry, opt: StarterOption): Garment | null {
  if (!e.pick) return null;
  return { ...e.pick.garment, subcategory: opt.subcategory, color_family: opt.color };
}

/** "Black tee", "Dark jeans", "Brown loafers": the choice's label and the piece's name (the closet's own naming). */
export const optionName = (e: StarterEntry, opt: StarterOption): string => {
  const g = ownedGarment(e, opt);
  return g ? baseName(g, null) : e.name;
};

/** Does a piece he added from this row still belong to it (#342)? Its kind does; the color never un-marks it. */
export function keepsRow(e: StarterEntry, g: Garment, slot: string): boolean {
  return e.owns.some((o) => o.subcategory === sub(g)) || e.fills(g, slot);
}

/** A not-photographed closet piece for the choice he taps (02 C5 "Tap to own", #342: in his kind and color). */
export function markedPiece(e: StarterEntry, opt: StarterOption, id: string, nowMs: number): ClosetItemRow | null {
  const garment = ownedGarment(e, opt);
  if (!garment || !e.slot) return null;
  return {
    id, name: baseName(garment, null), slot: e.slot, garment, confirmedFields: [], hex: displayHex(opt.color), photoFile: null,
    demoPhotoId: null, isPhotographed: false, source: 'added', starterId: e.id, wornCount: 0, lastWornAt: null, addedAt: nowMs, isDeleted: false,
    mergedInto: null, maybeSameAs: null, cropFile: null, cropScore: null, updatedAt: nowMs, profile: { aliases: [], distinctFrom: [], confirmed: {}, autoName: true },
  };
}

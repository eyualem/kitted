// O2 · Pick looks (02 D2, update Oct 9, DECISIONS-LOG #173): one tile per style, each showing two outfits drawn by
// the Closet's code (flats.ts), never a person. Two outfits so a style reads as a range, not a uniform. The pieces
// follow RULEBOOK Part 2's anchors and home pieces for each style. Pure: the screen renders it, tests check it.
import type { Styles } from '@kitted/core';
import type { StyleKey } from '@/data/types';
import type { BottomFlat, ShoeFlat, TopFlat } from '@/features/closet/flats';

export type LookOutfit = readonly [TopFlat, BottomFlat, ShoeFlat];

export interface Look {
  style: StyleKey;
  outfits: readonly [LookOutfit, LookOutfit];
}

const top = (type: TopFlat['type'], color: string, more: Partial<TopFlat> = {}): TopFlat => ({ kind: 'top', type, color, ...more });
const bottom = (type: BottomFlat['type'], color: string, more: Partial<BottomFlat> = {}): BottomFlat => ({ kind: 'bottom', type, color, ...more });
const shoe = (type: ShoeFlat['type'], color: string, more: Partial<ShoeFlat> = {}): ShoeFlat => ({ kind: 'shoe', type, color, ...more });

const WHITE_SOLE = '#F2F1EC';
const RIB = { ribHem: true, ribCuffs: true } as const;

/** The order on screen: the looks most guys his age wear first. */
export const LOOKS: readonly Look[] = [
  { style: 'streetwear', outfits: [
    [top('hoodie', '#4A4C52', { fit: 'relaxed', pattern: { type: 'heather' }, details: { drawstrings: true, pouch: true, ...RIB } }),
      bottom('jeans', '#24262C', { fit: 'wide', hem: 'full_break', wash: 'washed', pattern: { type: 'twill' } }),
      shoe('sneaker', '#F4F3EF', { chunky: true, sole: '#EDEBE6' })],
    // Not a graphic tee: the closet's print mark reads as a missing picture at this size.
    [top('crew', '#1E1F23', { fit: 'relaxed', details: { ...RIB } }),
      bottom('cargos', '#5B5E44', { fit: 'wide', hem: 'full_break' }),
      // Black, not red (#486, style-game fairness): red chunky sneakers were the loudest piece; black keeps the shape.
      shoe('sneaker', '#26272B', { chunky: true, sole: WHITE_SOLE, laceColor: '#F2F1EC' })],
  ] },
  { style: 'minimalist', outfits: [
    [top('crew', '#E8E1D3', { fit: 'relaxed', details: { ...RIB } }),
      bottom('trousers', '#1F2024', { fit: 'wide', hem: 'no_break' }),
      shoe('sneaker', '#F6F5F1', { sole: WHITE_SOLE })],
    [top('tee', '#8E9095', { fit: 'regular', pattern: { type: 'heather' } }),
      bottom('trousers', '#3C3E44', { fit: 'straight', hem: 'slight_break' }),
      shoe('loafer', '#1C1B1D')],
  ] },
  { style: 'smart_casual', outfits: [
    [top('quarter_zip', '#273350', { fit: 'regular', details: { ...RIB } }),
      bottom('chinos', '#CDBB94', { fit: 'slim', hem: 'slight_break', pattern: { type: 'twill' } }),
      shoe('chukka', '#7B5A3E', { pattern: { type: 'suede' } })],
    [top('shirt', '#A9C3E0', { fit: 'regular' }),
      bottom('trousers', '#47494F', { fit: 'straight', hem: 'slight_break' }),
      shoe('sneaker', '#F6F5F1', { sole: WHITE_SOLE })],
  ] },
  { style: 'classic_prep', outfits: [
    [top('blazer', '#1F2A44', { fit: 'regular' }),
      bottom('chinos', '#E3D8C0', { fit: 'straight', hem: 'no_break', pattern: { type: 'twill' } }),
      shoe('loafer', '#6B3E26')],
    [top('polo', '#2F5D46', { fit: 'regular' }),
      bottom('chinos', '#C9AE80', { fit: 'slim', hem: 'no_break', pattern: { type: 'twill' } }),
      shoe('sneaker', '#F6F5F1', { sole: WHITE_SOLE })],
  ] },
  // Tailored (specs/tailored.md TL4, T94): a charcoal suit with black derbies; a navy suit with white leather sneakers.
  { style: 'tailored', outfits: [
    [top('blazer', '#3A3D44', { fit: 'regular' }), bottom('trousers', '#3A3D44', { fit: 'straight', hem: 'no_break' }), shoe('derby', '#1C1B1D')],
    [top('blazer', '#1F2A44', { fit: 'regular' }), bottom('trousers', '#1F2A44', { fit: 'straight', hem: 'slight_break' }), shoe('sneaker', '#F6F5F1', { sole: WHITE_SOLE })],
  ] },
  { style: 'workwear', outfits: [
    [top('overshirt', '#B08A55', { fit: 'relaxed', pattern: { type: 'twill' }, details: { chestPockets: 2, flaps: true } }),
      bottom('jeans', '#28344F', { fit: 'straight', hem: 'cuffed', wash: 'rinse', pattern: { type: 'twill' } }),
      shoe('work_boot', '#6E4B33', { sole: '#3A2A20' })],
    [top('shirt', '#8E2F2A', { fit: 'relaxed', pattern: { type: 'gingham', line: '#1E1A1A', scale: 6 } }),
      bottom('jeans', '#3E5478', { fit: 'straight', hem: 'slight_break', wash: 'washed', pattern: { type: 'twill' } }),
      shoe('work_boot', '#7C716B', { pattern: { type: 'suede' }, sole: '#A59C92' })],
  ] },
  { style: 'outdoor', outfits: [
    // A slate-blue shell (#486): the olive zip jacket read as a field jacket or a bomber.
    [top('jacket', '#3D5A73', { fit: 'relaxed', details: { fullZip: true } }),
      bottom('cargos', '#8A8C8F', { fit: 'relaxed', hem: 'slight_break' }),
      shoe('runner', '#5C5F63', { chunky: true, sole: '#D9D6CF' })],
    // A heather zip pullover, read as a fleece (#486): the plain cream crew was outdoor in nothing.
    [top('quarter_zip', '#D8D2C2', { fit: 'relaxed', pattern: { type: 'heather' }, details: { ribHem: false } }),
      bottom('cargos', '#3F4134', { fit: 'relaxed', hem: 'cuffed' }),
      shoe('runner', '#C46A2C', { chunky: true, sole: '#2A2A2A' })],
  ] },
  { style: 'vintage_sport', outfits: [
    [top('tee', '#2E6B3F', { fit: 'regular', pattern: { type: 'stripes', line: '#F2F0E8', scale: 9 } }),
      bottom('jeans', '#6F8CB4', { fit: 'straight', hem: 'slight_break', wash: 'faded', pattern: { type: 'twill' } }),
      shoe('sneaker', '#F4F3EF', { sole: '#C9B48A', laceColor: '#1E1E1E' })],
    [top('crew', '#1F2A44', { fit: 'regular', pattern: { type: 'stripes', line: '#C9A34E', scale: 14 } }),
      bottom('jeans', '#2E3A55', { fit: 'straight', hem: 'slight_break', wash: 'rinse', pattern: { type: 'twill' } }),
      shoe('runner', '#EDE9E0', { sole: '#8B6F4E' })],
  ] },
];

export const MAX_PICKS = 3;

/** A tap on a tile: removes it if picked, adds it at the end if there's room. `full` = a 4th tap (the tile shakes). */
export function togglePick(picks: readonly StyleKey[], style: StyleKey): { picks: StyleKey[]; full: boolean } {
  if (picks.includes(style)) return { picks: picks.filter((s) => s !== style), full: false };
  if (picks.length >= MAX_PICKS) return { picks: [...picks], full: true };
  return { picks: [...picks, style], full: false };
}

/** His picks as ordered weights (02 D2: the 1st pick 0.5, the others split the rest; one pick alone is 1).
 *  Since rubric v4 they never change a score, only which label wins a tie and what he's offered. */
export function picksToStyles(picks: readonly StyleKey[]): Styles {
  if (picks.length === 0) return [];
  if (picks.length === 1) return [[picks[0]!, 1]];
  const rest = 0.5 / (picks.length - 1);
  return picks.map((s, i) => [s, i === 0 ? 0.5 : rest] as const);
}

/** "Something else?": his own words, trimmed and capped. Logged as he wrote them; no style is guessed from them. */
export function cleanOtherWords(s: string): string | null {
  const w = s.replace(/\s+/g, ' ').trim().slice(0, 80);
  return w.length ? w : null;
}

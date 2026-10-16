// Fix what a piece is (09-ui-review §17, #314; founder, Oct 16: "a way to change what the tile represents … from a
// limited choice"). A piece's page shows "What it is": Kind · Color · Leg (bottoms) or Fit (tops and layers) ·
// Pattern (tops and layers). A row opens a sheet of the piece drawn with that one thing changed; one tap picks.
//   - The lists are the schema's own values in the words the app already uses (garmentName, the leg and fit words of
//     "Not quite right?", FAMILY_WORD); a first group of 8 per slot that all draw differently, the rest under More
//     kinds. The piece's current kind and its look-alikes are always in the first group. Never a brand.
//   - A pick is "he said so": the field on the piece's reading, in confirmedFields and the profile's confirmed values
//     (the drawing reads one, known pieces the other). The read he corrected away from, as his own photos of this
//     piece read it, is taught to the matcher as a "Yes, same one" would (#115), so the next photo that misreads it the
//     same way still finds this piece. The slot never changes (a top stays a top, a layer a layer).
//   - Scores never move: only the closet row changes (the service, editPiece). Pure: no store, no UI.
import { colorDistance, displayHex, FAMILY_WORD, FLIP_PAIRS, garmentName, nearestFamily, RUBRIC_DATA, shadeFromId, shoeKindOf } from '@kitted/core';
import type { Garment, Observation } from '@kitted/core';
import type { ClosetArt, ClosetItemRow, ClosetProfile } from '@/data/types';
import { STARTER } from '@/features/finish/starter';
import { t, type StringKey } from '@/i18n/en';
import { hexOfArt, profileOfItem } from './profile';

export type EditField = 'kind' | 'color' | 'leg' | 'fit' | 'pattern';
export type EditValue = string | number;
export type EditSlot = 'top' | 'outer' | 'bottom' | 'shoes';

/** The first group per slot (8 or fewer, every one drawn differently), then the rest (§17.2). */
export const KIND_MAIN: Readonly<Record<EditSlot, readonly string[]>> = {
  top: ['tee', 'graphic_tee', 'polo', 'oxford_shirt', 'flannel_shirt', 'sweater', 'sweatshirt', 'hoodie'],
  outer: ['overshirt', 'denim_jacket', 'bomber', 'field_jacket', 'blazer', 'puffer', 'overcoat', 'hoodie'],
  bottom: ['jeans', 'chinos', 'trousers', 'cargos', 'sweatpants', 'shorts'],
  shoes: ['white_leather_sneaker', 'canvas_sneaker', 'retro_runner', 'chunky_sneaker', 'work_boot', 'chelsea_boot', 'loafer', 'slides_sandals'],
};
export const KIND_MORE: Readonly<Record<EditSlot, readonly string[]>> = {
  top: ['tank_top', 'dress_shirt', 'camp_collar_shirt', 'knit_polo', 'quarter_zip', 'cardigan', 'rugby_shirt', 'jersey', 'fleece', 'overshirt', 'denim_jacket', 'chore_coat'],
  outer: ['chore_coat', 'sweatshirt', 'quarter_zip', 'cardigan', 'flannel_shirt', 'fleece', 'leather_jacket', 'rain_jacket', 'shell_jacket', 'sport_coat', 'suit_jacket', 'camp_collar_shirt'],
  bottom: ['joggers', 'athletic_shorts', 'drawstring_trousers', 'suit_trousers'],
  shoes: ['low_profile_sneaker', 'basketball_sneaker', 'performance_runner', 'suede_chukka', 'derby', 'dress_shoe'],
};
export const LEGS: readonly string[] = ['skinny', 'slim', 'straight', 'relaxed', 'wide'];
/** Fit is the reading's volume, 2–5 (as "Not quite right?" offers). */
export const FITS: readonly number[] = [2, 3, 4, 5];
export const PATTERNS: readonly string[] = ['solid', 'stripes', 'checks_plaid', 'graphic'];
const COLOR_GROUPS: readonly [StringKey, readonly string[]][] = [
  ['closet.edit.color.blues', ['denim_light', 'denim_mid', 'denim_dark', 'navy', 'light_blue', 'blue']],
  ['closet.edit.color.neutrals', ['white', 'off_white_cream', 'light_grey', 'grey', 'charcoal', 'black']],
  ['closet.edit.color.earth', ['khaki_beige', 'tan_camel', 'brown', 'olive', 'sage']],
  ['closet.edit.color.colors', ['green', 'burgundy', 'red', 'orange', 'yellow', 'pink', 'purple']],
];
const DENIM_WASH: readonly string[] = ['denim_light', 'denim_mid', 'denim_dark'];
/** The kinds a denim wash is offered for. */
const DENIM_KINDS: readonly string[] = ['jeans', 'denim_jacket'];
/** Off denim, a wash becomes its nearest plain color ("Changed to chinos, in navy."). */
const WASH_TO_PLAIN: Readonly<Record<string, string>> = { denim_dark: 'navy', denim_mid: 'blue', denim_light: 'light_blue' };
/** No leg row: shorts have no leg to change. */
const NO_LEG: readonly string[] = ['shorts', 'athletic_shorts'];
const LEG_WORD: Readonly<Record<string, StringKey>> = {
  skinny: 'value.leg.skinny', slim: 'value.leg.slim', straight: 'value.leg.straight', relaxed: 'value.leg.relaxed', wide: 'value.leg.wide',
};
const FIT_WORD: Readonly<Record<number, StringKey>> = { 2: 'value.topFit.slim', 3: 'value.topFit.regular', 4: 'value.topFit.relaxed', 5: 'value.topFit.oversized' };
const PATTERN_WORD: Readonly<Record<string, StringKey>> = {
  solid: 'closet.edit.pattern.solid', stripes: 'closet.edit.pattern.stripes', checks_plaid: 'closet.edit.pattern.checks_plaid', graphic: 'closet.edit.pattern.graphic',
  camo: 'closet.edit.pattern.camo', floral: 'closet.edit.pattern.floral', other: 'closet.edit.pattern.other',
};
const FIELD_LABEL: Readonly<Record<EditField, StringKey>> = {
  kind: 'closet.edit.kind', color: 'closet.edit.color', leg: 'closet.edit.leg', fit: 'closet.edit.fit', pattern: 'closet.edit.pattern',
};
/** The garment field each row writes, and the confirmable matcher field (Fit has none: volume isn't confirmable). */
const GARMENT_FIELD: Readonly<Record<EditField, keyof Garment & string>> = {
  kind: 'subcategory', color: 'color_family', leg: 'leg_shape', fit: 'volume', pattern: 'pattern',
};
const CONFIRM_FIELD: Readonly<Partial<Record<EditField, 'subcategory' | 'color_family' | 'leg_shape' | 'pattern'>>> = {
  kind: 'subcategory', color: 'color_family', leg: 'leg_shape', pattern: 'pattern',
};

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const str = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : null);
const uniq = <T,>(xs: readonly T[]): T[] => [...new Set(xs)];
const slotOf = (item: Pick<ClosetItemRow, 'slot'>): EditSlot | null =>
  (['top', 'outer', 'bottom', 'shoes'] as const).find((s) => s === item.slot) ?? null;

/** "Jeans", "Leather sneakers", "Chelsea boots". */
export const kindWord = (sub: string): string => cap(garmentName({ subcategory: sub }));
/** "Dark-wash denim", "Cream", "Khaki". */
export const colorLabel = (family: string): string => cap(FAMILY_WORD[family] ?? family.split('_').join(' '));
const volumeOf = (g: Garment): number => {
  const v = typeof g.volume === 'number' ? g.volume : 3;
  return v <= 2 ? 2 : v >= 5 ? 5 : v;
};

export interface EditRow {
  field: EditField;
  /** "Leg" */
  label: string;
  /** "Slim" */
  value: string;
}
export interface EditOption {
  value: EditValue;
  label: string;
  current: boolean;
}
export interface EditOptions {
  main: EditOption[];
  more: EditOption[];
  /** Color only: the swatches in their groups (main is the same options, flat). */
  groups?: { title: string; options: EditOption[] }[];
}

/** The piece's value for a row (what the picker marks as current). */
export function currentValue(item: Pick<ClosetItemRow, 'garment'>, field: EditField): EditValue | null {
  if (field === 'fit') return volumeOf(item.garment);
  const v = str(item.garment[GARMENT_FIELD[field]]);
  if (field === 'pattern') return v && v !== 'na' ? v : 'solid';
  if (field === 'leg') return v && LEGS.includes(v) ? v : null;
  return v && v !== 'other' ? v : null;
}

function valueWord(field: EditField, v: EditValue | null): string {
  if (v === null) return '';
  if (field === 'kind') return kindWord(String(v));
  if (field === 'color') return colorLabel(String(v));
  if (field === 'leg') return LEG_WORD[String(v)] ? t(LEG_WORD[String(v)]!) : String(v);
  if (field === 'fit') return t(FIT_WORD[Number(v)] ?? 'value.topFit.regular');
  return PATTERN_WORD[String(v)] ? t(PATTERN_WORD[String(v)]!) : String(v);
}

/** The rows a piece shows: Kind, Color, then Fit + Pattern (tops, layers) or Leg (bottoms but shorts). */
export function editRows(item: Pick<ClosetItemRow, 'slot' | 'garment'>): EditRow[] {
  const slot = slotOf(item);
  if (!slot) return [];
  const fields: EditField[] = ['kind', 'color'];
  if (slot === 'top' || slot === 'outer') fields.push('fit', 'pattern');
  if (slot === 'bottom' && !NO_LEG.includes(String(item.garment.subcategory))) fields.push('leg');
  return fields.map((field) => ({ field, label: t(FIELD_LABEL[field]), value: valueWord(field, currentValue(item, field)) }));
}

const lookAlikesOf = (sub: string, category: string): string[] => [
  ...FLIP_PAIRS.flatMap(([a, b]) => (a === sub ? [b] : b === sub ? [a] : [])),
  ...(RUBRIC_DATA.tap.pairs[category] ?? []).flatMap(([a, b]) => (a === sub ? [b] : b === sub ? [a] : [])),
];

/** What a row's sheet offers. */
export function editOptions(item: Pick<ClosetItemRow, 'slot' | 'garment'>, field: EditField): EditOptions {
  const cur = currentValue(item, field);
  const opt = (v: EditValue): EditOption => ({ value: v, label: valueWord(field, v), current: v === cur });
  if (field === 'kind') {
    const slot = slotOf(item);
    if (!slot) return { main: [], more: [] };
    const sub = str(item.garment.subcategory);
    const extra = sub && sub !== 'other' ? [sub, ...lookAlikesOf(sub, String(item.garment.category))] : [];
    const main = uniq([...KIND_MAIN[slot], ...extra.filter((s) => !KIND_MAIN[slot].includes(s))]);
    const more = KIND_MORE[slot].filter((s) => !main.includes(s));
    return { main: main.map(opt), more: more.map(opt) };
  }
  if (field === 'leg') return { main: LEGS.map(opt), more: [] };
  if (field === 'fit') return { main: FITS.map(opt), more: [] };
  if (field === 'pattern') {
    const p = typeof cur === 'string' && !PATTERNS.includes(cur) ? [cur] : [];
    return { main: [...PATTERNS, ...p].map(opt), more: [] };
  }
  const denimOk = DENIM_KINDS.includes(String(item.garment.subcategory));
  const groups = COLOR_GROUPS.map(([title, fams]) => ({
    title: t(title),
    options: fams.filter((f) => !DENIM_WASH.includes(f) || denimOk || f === cur).map(opt),
  })).filter((g) => g.options.length > 0);
  return { main: groups.flatMap((g) => g.options), more: [], groups };
}

/** VoiceOver for a row: "Leg, Slim" (the hint says "Double-tap to change."). */
export const rowA11y = (r: EditRow): string => `${r.label}, ${r.value}`;
/** VoiceOver for an option: "Relaxed leg", "Oversized fit", "Hoodie"; the current one is marked selected. */
export function optionA11y(field: EditField, o: EditOption): { label: string; selected: boolean } {
  const label = field === 'leg' ? t('closet.edit.a11y.leg', { leg: o.label }) : field === 'fit' ? t('closet.edit.a11y.fit', { fit: o.label }) : o.label;
  return { label, selected: o.current };
}

/** The words a pick changed a piece to: "relaxed leg", "oversized fit", "hoodie", "navy", "stripes". */
function pickedPhrase(field: EditField, value: EditValue): string {
  if (field === 'kind') return garmentName({ subcategory: String(value) });
  if (field === 'color') return FAMILY_WORD[String(value)] ?? String(value);
  const o = optionA11y(field, { value, label: valueWord(field, value), current: false }).label;
  return o.charAt(0).toLowerCase() + o.slice(1);
}

/** The toast after a pick: "Changed to relaxed leg. Your scores stay the same."; a denim wash that moved says so. */
export function editToast(field: EditField, _item: Pick<ClosetItemRow, 'garment'>, value: EditValue, remapped: string | null): string {
  return remapped
    ? t('closet.edit.toastRemap', { kind: pickedPhrase(field, value), color: pickedPhrase('color', remapped) })
    : t('closet.edit.toast', { value: pickedPhrase(field, value) });
}

/** The color a kind pick moves a denim wash to (jeans → chinos in dark denim: navy), or null. */
export function denimRemap(item: Pick<ClosetItemRow, 'garment'>, field: EditField, value: EditValue): string | null {
  if (field !== 'kind' || DENIM_KINDS.includes(String(value))) return null;
  const c = str(item.garment.color_family);
  return c ? WASH_TO_PLAIN[c] ?? null : null;
}

/** Can `value` be picked for this row of this piece? */
export function isOffered(item: Pick<ClosetItemRow, 'slot' | 'garment'>, field: EditField, value: EditValue): boolean {
  if (!editRows(item).some((r) => r.field === field)) return false;
  const o = editOptions(item, field);
  return [...o.main, ...o.more].some((x) => x.value === value);
}

/** The drawing's art after a color pick: the family his; a shade or measured color kept only while it reads as it. */
function artWithColor(art: ClosetArt | null | undefined, family: string): ClosetArt | null {
  if (!art) return null;
  const near = (f: string | null | undefined) => !!f && (f === family || colorDistance(f, family, { jeans: DENIM_WASH.includes(family) }) === 1);
  const key = art.shade ? shadeFromId(art.shade) : null;
  const shade = key && key.family && !near(key.family) ? null : art.shade;
  const { measured, ...rest } = art;
  return { ...rest, family, shade, ...(measured && near(nearestFamily(measured)) ? { measured } : {}) };
}

export interface EditPlan {
  /** The closet row's new fields (before the service re-derives the art, hex and name from the sightings). */
  patch: Pick<ClosetItemRow, 'garment' | 'confirmedFields' | 'profile' | 'starterId'>;
  /** The plain color a denim wash moved to, or null. */
  remapped: string | null;
}

/**
 * What a pick writes (§17.3): the field on the reading (and a denim wash off denim), "he said so" in confirmedFields
 * and the profile's confirmed values, the reads his own sightings gave that he corrected away from (an old kind as an
 * alias, old leg reads as leg field aliases), a shoe kind he named earlier that no longer fits dropped, a name he
 * didn't set made the app's (so it follows a kind, color or pattern), and a marked Starter piece that no longer fills
 * its row unmarked. Pure.
 */
export function editPlan(item: ClosetItemRow, field: EditField, value: EditValue, sightings: readonly Observation[]): EditPlan {
  const remapped = denimRemap(item, field, value);
  const g: Garment = { ...item.garment, [GARMENT_FIELD[field]]: value, ...(remapped ? { color_family: remapped } : {}) };
  const p0: ClosetProfile = profileOfItem(item);
  const confirmed = { ...p0.confirmed };
  const fields = [...item.confirmedFields];
  const confirm = (f: 'subcategory' | 'color_family' | 'leg_shape' | 'pattern', v: string) => {
    (confirmed as Record<string, unknown>)[f] = v;
    if (!fields.includes(f)) fields.push(f);
  };
  const cf = CONFIRM_FIELD[field];
  if (cf) confirm(cf, String(value));
  if (remapped) confirm('color_family', remapped);
  if (field === 'color' || remapped) {
    // a shade he confirmed belongs to the old color
    const key = confirmed.shadeKey;
    if (key && key.family && key.family !== g.color_family) delete confirmed.shadeKey;
  }
  let aliases = p0.aliases;
  let fieldAliases = p0.fieldAliases;
  if (field === 'kind') {
    const reads = sightings.map((o) => str(o.subcategory)).filter((s): s is string => !!s && s !== 'other' && s !== value);
    aliases = uniq([...p0.aliases.filter((a) => a !== value), ...reads]).sort();
    if (item.slot === 'shoes' && confirmed.shoeKind !== undefined) {
      const k = shoeKindOf(value);
      if (k) confirmed.shoeKind = k;
      else delete confirmed.shoeKind;
    }
  }
  if (field === 'leg') {
    const reads = sightings.map((o) => str(o.leg_shape)).map((l) => (l === 'flare_bootcut' ? 'straight' : l === 'barrel' ? 'wide' : l))
      .filter((l): l is string => !!l && LEGS.includes(l));
    const all = uniq([...(p0.fieldAliases?.leg_shape ?? []), ...reads, String(value)]).sort();
    if (all.length > 1) fieldAliases = { ...(p0.fieldAliases ?? {}), leg_shape: all };
  }
  const renames = field === 'kind' || field === 'color' || field === 'pattern' || !!remapped;
  const profile: ClosetProfile = {
    ...p0, confirmed, aliases, ...(fieldAliases ? { fieldAliases } : {}), ...(renames && !p0.nameLocked ? { autoName: true } : {}),
  };
  const entry = item.starterId ? STARTER.find((e) => e.id === item.starterId) : undefined;
  const unmark = !!entry && !item.isPhotographed && !entry.fills(g, String(item.slot));
  return { patch: { garment: g, confirmedFields: fields, profile, starterId: unmark ? null : item.starterId }, remapped };
}

/** The piece as it would be after a pick: what an option's picture draws (the service writes the same thing). */
export function withEdit<T extends ClosetItemRow>(item: T, field: EditField, value: EditValue): T {
  const { patch, remapped } = editPlan(item, field, value, []);
  const family = field === 'color' ? String(value) : remapped;
  let art = item.art ?? null;
  if (family) art = artWithColor(art, family);
  if (field === 'pattern' && art) art = { ...art, pattern: String(value) };
  const hex = family ? (art ? hexOfArt(art, displayHex(family)) : displayHex(family)) : item.hex;
  return { ...item, ...patch, art, hex };
}

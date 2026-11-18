// The one attachment under an answer (07 §1, §5.2; checks R4, R5, R8): built by code from the handles the model
// named, never from its text. Each kind is checked against his real data; anything that doesn't check out drops
// the card and keeps the answer. Cards are stored by id (not by the per-question handles), so Past chats can draw
// them again later; a piece removed since then shows "No longer in your closet".
import {
  dayKey, FAMILY_HEX, G, garmentName, nearestFamily, outfitValid, parseShade, type ClosetItem, type ClosetSlot, type Garment, type Styles, type ZoneOffset,
} from '@kitted/core';
import { OCCASIONS, type ChatMessage, type ClosetItemRow, type FitCheckRow, type OccasionKey } from '@/data/types';
import { outfitsOn } from '@/features/closet/outfitsSwitch';
import { isAwaitingAnswer, isOwned } from '@/features/closet/profile';
import { starterGain } from '@/features/finish/gains';
import { picksOf, starterList } from '@/features/finish/packs';
import { catalogRow, CATALOG, ownership, type StarterEntry } from '@/features/finish/starter';
import { colorWord } from '@/features/fitcheck/labels';
import { LOOKS } from '@/features/onboarding/looks';
import { t } from '@/i18n/en';
import { oneLine } from './context';
import { checkSentence, type GateContext } from './gate';
import { isBodyRating } from './guards';
import { garmentOf } from './memory';

export type PieceSlot = 'top' | 'bottom' | 'shoes' | 'outer' | 'accessory';
export const ACCESSORY_KINDS = ['watch', 'belt', 'cap', 'beanie'] as const;

/** The only shape a drawn piece has (T101 draws it, T104 shows it). Never taken from the model: `cardPiece` makes it. */
export interface CardPiece {
  /** A garment subcategory the closet draws ('work_boot', 'overshirt', 'jeans', 'bomber') or an accessory kind. */
  kind: string;
  /** One of the app's color family keys (FAMILY_HEX), never 'multicolor' or 'unknown'. */
  color: string;
  /** Made by code from color and kind: "Black work boots". */
  name: string;
}

/** What a changed card holds of a piece, before and after (built by code: T107). */
export interface PieceFields {
  name: string;
  slot: ClosetSlot;
  garment: Garment;
  hex: string;
  confirmedFields: string[];
}

export type OptionEntry = { itemId: string } | { piece: CardPiece };

export type AskCard =
  /** `itemIds` is his pieces (old cards have only this). `needs` are pieces he'd need, drawn; accessories are always in
   *  `needs`. `example: true`: every piece is in `needs` and `itemIds` is []. Old stored outfits have neither field. */
  | { type: 'outfit'; itemIds: string[]; occasion: OccasionKey; needs?: CardPiece[]; example?: boolean }
  | { type: 'check'; occasion: OccasionKey }
  /** `options` ends with "Not sure" (added by code). */
  | { type: 'ask'; question: string; options: string[] }
  /** 2 or 3 pieces of one slot, his own first. */
  | { type: 'options'; slot: PieceSlot; options: OptionEntry[] }
  | { type: 'colors'; about: 'piece'; kind: string; itemId?: string; families: string[] }
  | { type: 'colors'; about: 'general'; goesWith: string; families: string[] }
  /** Built by code (T106), never from the model's block. */
  | { type: 'add'; piece: CardPiece; outcome: 'asked' | 'added' | 'declined'; itemId: string | null }
  /** Built by code (T107), never from the model's block. */
  | { type: 'changed'; itemId: string; before: PieceFields; after: PieceFields; undone?: true }
  /** A Starter row; `gain` from rotation, null when it can't be counted; `why` is Kit's one short reason, gate-checked. */
  | { type: 'buy'; starterId: string; gain: number | null; why?: string }
  | { type: 'link'; checkId: string }
  | { type: 'link'; itemId: string }
  /** "That score is wrong" about today's check (09 §20.8 G19): opens its Not quite right?. Built by code from the route
   *  (prepare.ts), never from the model's block. */
  | { type: 'correct'; checkId: string };

// ---------------------------------------------------------------- drawn pieces: kinds, colors, names
/** Every kind the closet draws (the keys of `closet/artSpec.ts`'s TOP, BOTTOM and SHOE tables, copied: T101 edits that
 *  file) and the slot each belongs to, plus the four accessories. One table, so a name and its drawing can't disagree. */
export const KIND_SLOT: Readonly<Record<string, PieceSlot>> = {
  ...Object.fromEntries([
    'tee', 'graphic_tee', 'jersey', 'tank_top', 'polo', 'knit_polo', 'oxford_shirt', 'dress_shirt', 'flannel_shirt', 'camp_collar_shirt',
    'sweater', 'sweatshirt', 'fleece', 'rugby_shirt', 'quarter_zip', 'cardigan', 'hoodie', 'henley', 'button_up_shirt', 'short_sleeve_shirt',
    'turtleneck', 'zip_hoodie',
  ].map((k) => [k, 'top' as const])),
  ...Object.fromEntries([
    'overshirt', 'chore_coat', 'denim_jacket', 'bomber', 'leather_jacket', 'field_jacket', 'shell_jacket', 'rain_jacket', 'puffer', 'blazer',
    'unstructured_blazer', 'sport_coat', 'suit_jacket', 'overcoat',
  ].map((k) => [k, 'outer' as const])),
  ...Object.fromEntries([
    'jeans', 'chinos', 'trousers', 'suit_trousers', 'drawstring_trousers', 'cargos', 'joggers', 'sweatpants', 'shorts', 'athletic_shorts', 'jorts',
  ].map((k) => [k, 'bottom' as const])),
  ...Object.fromEntries([
    'white_leather_sneaker', 'canvas_sneaker', 'low_profile_sneaker', 'basketball_sneaker', 'chunky_sneaker', 'retro_runner', 'performance_runner',
    'work_boot', 'suede_chukka', 'chelsea_boot', 'loafer', 'dress_shoe', 'derby', 'slides_sandals',
  ].map((k) => [k, 'shoes' as const])),
  ...Object.fromEntries(ACCESSORY_KINDS.map((k) => [k, 'accessory' as const])),
};

const has = (o: object, k: string): boolean => Object.prototype.hasOwnProperty.call(o, k);

export function slotOfKind(kind: string): PieceSlot | null {
  return typeof kind === 'string' && has(KIND_SLOT, kind) ? KIND_SLOT[kind]! : null;
}

/** The display name of each color family (the spec's words, the founder's OK Nov 17). One map, so one edit changes a word everywhere. */
const COLOR_NAME: Readonly<Record<string, string>> = {
  white: 'White', off_white_cream: 'Off-white', light_grey: 'Light grey', grey: 'Grey', charcoal: 'Charcoal', black: 'Black', navy: 'Navy',
  light_blue: 'Light blue', blue: 'Blue', denim_light: 'Light denim', denim_mid: 'Mid denim', denim_dark: 'Dark denim', olive: 'Olive',
  green: 'Green', sage: 'Sage', khaki_beige: 'Beige', tan_camel: 'Tan', brown: 'Brown', burgundy: 'Burgundy', red: 'Red', orange: 'Orange',
  yellow: 'Yellow', pink: 'Pink', purple: 'Purple',
};

/** The display name of a color family ("Off-white"); null for multicolor and anything the app doesn't know. */
export function colorName(family: string): string | null {
  return typeof family === 'string' && has(COLOR_NAME, family) && has(FAMILY_HEX, family) ? COLOR_NAME[family]! : null;
}

const isFamily = (v: unknown): v is string => typeof v === 'string' && colorName(v) !== null;

/** The closet's own noun for a kind, lowercase ("oxford", "work boots"); an accessory is its own word. */
export function kindNoun(kind: string): string {
  return (ACCESSORY_KINDS as readonly string[]).includes(kind) ? kind : garmentName({ subcategory: kind }).toLowerCase();
}

/** Words the closet's own word list doesn't catch. */
const KIND_ALIAS: readonly [RegExp, string][] = [[/\bchore (?:jacket|coat)\b/, 'chore_coat']];

/** A kind from the model's words or from a key: the key table first, then the four accessory words, then the closet's
 *  own word list (`garmentOf`). `generic` is true when only the plain word "jacket" matched (a harrington, "Navy jacket"). */
function kindOf(v: unknown): { kind: string; generic: boolean } | null {
  if (typeof v !== 'string') return null;
  const words = v.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!words || words.length > 40) return null;
  const key = words.replace(/[\s-]+/g, '_');
  if (has(KIND_SLOT, key)) return { kind: key, generic: false };
  const acc = ACCESSORY_KINDS.find((k) => new RegExp(`\\b${k}\\b`).test(words));
  if (acc) return { kind: acc, generic: false };
  const alias = KIND_ALIAS.find(([re]) => re.test(words));
  if (alias) return { kind: alias[1], generic: false };
  const sub = garmentOf(words)?.subcategory;
  if (typeof sub !== 'string' || !has(KIND_SLOT, sub)) return null;
  return { kind: sub, generic: sub === 'field_jacket' && !/\bfield\b/.test(words) };
}

/** A color family from a key or from words. "off white" is handled here: core's parser reads it as white. */
function familyOf(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const words = v.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!words) return null;
  if (isFamily(words)) return words;
  if (/^off[ -]?white$/.test(words)) return 'off_white_cream';
  const f = parseShade(words)?.family;
  return f && isFamily(f) ? f : null;
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function pieceNameOf(kind: string, color: string, noun?: string): string {
  if (kind === 'jeans' && color.startsWith('denim')) {
    const w = colorWord({ color_family: color, subcategory: 'jeans' });
    if (w) return `${w} jeans`;
  }
  return cap(`${colorName(color)} ${noun ?? kindNoun(kind)}`);
}

function pieceFrom(kindWords: unknown, colorWords: unknown): CardPiece | null {
  const k = kindOf(kindWords);
  const color = familyOf(colorWords);
  if (!k || !color) return null;
  return { kind: k.kind, color, name: pieceNameOf(k.kind, color, k.generic ? 'jacket' : undefined) };
}

/** A drawn piece from the model's words or from keys: a kind the app draws and one of its colors, its name made here.
 *  Anything it can't resolve is null. */
export function cardPiece(kind: unknown, color: unknown): CardPiece | null {
  return pieceFrom(kind, color);
}

/** A stored drawn piece: the right shape and a color family the app has; the kind is kept as written. */
function storedPiece(v: unknown): CardPiece | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  return typeof o.kind === 'string' && o.kind && isFamily(o.color) && typeof o.name === 'string' ? (v as CardPiece) : null;
}

// ---------------------------------------------------------------- the builder
export interface CardInput {
  handles: Readonly<Record<string, string>>;
  closet: readonly ClosetItemRow[];
  checks: readonly FitCheckRow[];
  styles: Styles | null;
  starterMarks: readonly string[];
  /** The ask card's words pass the same sentence gate as the answer. */
  gate: GateContext;
  /** Outfit keys already shown today (`cardKey`). Absent = no repeat check. */
  shownToday?: ReadonlySet<string>;
  /** Closet ids he'd rather not wear: never in a card. Wired later (T106 to T108); absent = none. */
  avoid?: ReadonlySet<string>;
  /** The color families allowed for this answer (T103). Absent or null = no color check. */
  allowedColors?: ReadonlySet<string> | null;
}

const MAX_OPTIONS = 4;
const SLOTS: readonly PieceSlot[] = ['top', 'bottom', 'shoes', 'outer', 'accessory'];

const occasionOr = (v: unknown, fallback: OccasionKey | null): OccasionKey | null =>
  v === undefined || v === null ? fallback : typeof v === 'string' && (OCCASIONS as readonly string[]).includes(v) ? (v as OccasionKey) : null;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z ]+/g, ' ').replace(/\s+/g, ' ').trim();

/** The Starter row a buy card's "kind" (and shade) names: its words all in the row's piece, e.g. "loafers" → s10. His
 *  list (his looks, #364) first, then every row. */
export function starterFor(kind: string, shade: string | null, styles: Styles | null = null): StarterEntry | null {
  const words = norm(kind).split(' ').filter((w) => w.length > 2).map((w) => w.replace(/s$/, ''));
  if (words.length === 0) return null;
  return matchRow(starterList(styles), words, shade) ?? matchRow(CATALOG, words, shade);
}

function matchRow(list: readonly StarterEntry[], words: string[], shade: string | null): StarterEntry | null {
  const rows = list.filter((e) => e.pick).map((e) => ({ e, text: norm(`${e.pick!.phrase} ${e.pick!.name} ${e.name}`) }));
  const hits = rows.filter((r) => words.every((w) => r.text.includes(w)));
  if (hits.length <= 1) return hits[0]?.e ?? null;
  const sh = shade ? norm(shade) : '';
  return hits.find((r) => sh && r.text.includes(sh))?.e ?? hits[0]!.e;
}

/** A drawn piece as the rubric reads it: a clean, clearly read garment of that kind and color (accessories are left out). */
function drawnItem(p: CardPiece, i: number): ClosetItem {
  const slot = slotOfKind(p.kind) as ClosetSlot;
  const category = { top: 'top', outer: 'outerwear', bottom: 'bottom', shoes: 'footwear' }[slot];
  return { id: `drawn${i}`, name: p.name, slot, garment: G(category, p.kind, p.color, slot === 'bottom' ? { leg_shape: 'straight' } : {}) };
}

const asList = (v: unknown): unknown[] | null => (v === undefined || v === null ? [] : Array.isArray(v) ? v : null);

/** The model's card, checked (R4). Null drops it. */
export function buildCard(raw: unknown, input: CardInput): AskCard | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const avoid = input.avoid ?? new Set<string>();
  const owned = input.closet.filter(isOwned);
  const usable = owned.filter((c) => !isAwaitingAnswer(c, owned) && !avoid.has(c.id));
  const piece = (h: unknown) => (typeof h === 'string' && /^P\d+$/.test(h) ? usable.find((c) => c.id === input.handles[h]) : undefined);
  switch (o.type) {
    case 'outfit': {
      const pieces = asList(o.pieces);
      const needsRaw = asList(o.needs);
      if (!pieces || !needsRaw) return null;
      const mine: ClosetItemRow[] = [];
      for (const h of pieces) {
        const it = piece(h);
        if (!it || mine.some((m) => m.id === it.id)) return null;
        mine.push(it);
      }
      const drawn: CardPiece[] = [];
      const accessories: CardPiece[] = [];
      for (const n of needsRaw) {
        if (!n || typeof n !== 'object' || Array.isArray(n)) return null;
        const p = cardPiece((n as Record<string, unknown>).kind, (n as Record<string, unknown>).color);
        if (!p) return null;
        const slot = slotOfKind(p.kind)!;
        if (slot === 'accessory') {
          if (accessories.some((a) => a.kind === p.kind)) return null;
          accessories.push(p);
          continue;
        }
        // His own piece first (KC2.1): the same kind in the same color family is his, not a drawn one.
        const his = usable.find((c) => c.garment.subcategory === p.kind && c.garment.color_family === p.color && !mine.some((m) => m.id === c.id));
        if (his) {
          if (mine.some((m) => m.slot === his.slot)) return null;
          mine.push(his);
          continue;
        }
        if (mine.some((m) => m.slot === slot) || drawn.some((d) => d.kind === p.kind && d.color === p.color)) return null;
        drawn.push(p);
      }
      // 3 to 5 clothing pieces (his and drawn), 0 to 2 accessories, and a top, a bottom and shoes (KC2.9).
      const clothing = mine.length + drawn.length;
      if (clothing < 3 || clothing > 5 || accessories.length > 2) return null;
      const held = new Set<string>([...mine.map((m) => m.slot as string), ...drawn.map((d) => slotOfKind(d.kind)!)]);
      if (!(['top', 'bottom', 'shoes'] as const).every((s) => held.has(s))) return null;
      if (!outfitValid([...(mine as ClosetItem[]), ...drawn.map(drawnItem)], input.styles)) return null;
      const occasion = occasionOr(o.occasion, 'everyday');
      if (!occasion) return null;
      const shown = input.shownToday ?? new Set<string>();
      // Nothing of his, or more than 2 clothing pieces he'd need to buy: an Example (KC2.3), chosen by code.
      if (mine.length === 0 || drawn.length > 2) {
        const avoidKinds = new Set(input.closet.filter((c) => avoid.has(c.id)).map((c) => String(c.garment.subcategory)));
        const ex = exampleOutfit(input.styles, shown, avoidKinds);
        return ex ? { type: 'outfit', itemIds: [], needs: ex, example: true, occasion } : null;
      }
      const card: AskCard = { type: 'outfit', itemIds: mine.map((m) => m.id), needs: [...drawn, ...accessories], example: false, occasion };
      const key = cardKey(card);
      return key && shown.has(key) ? null : card;
    }
    case 'options': {
      const pieces = asList(o.pieces);
      const needsRaw = asList(o.needs);
      if (!pieces || !needsRaw) return null;
      let replaced: ClosetItemRow | null = null;
      if (o.replaces !== undefined && o.replaces !== null) {
        const h = o.replaces;
        replaced = (typeof h === 'string' && /^P\d+$/.test(h) ? owned.find((c) => c.id === input.handles[h]) : undefined) ?? null;
        if (!replaced) return null;
      }
      const slot: PieceSlot | null = replaced ? (replaced.slot as PieceSlot) : SLOTS.find((s) => s === o.slot) ?? null;
      if (!slot) return null;
      const his: ClosetItemRow[] = [];
      for (const h of pieces) {
        // A handle that isn't one of his pieces drops the card; one he'd rather not wear (avoid) just isn't an entry.
        const known = typeof h === 'string' && /^P\d+$/.test(h) ? owned.find((c) => c.id === input.handles[h]) : undefined;
        if (!known) return null;
        const it = piece(h);
        if (it && it.slot === slot && it.id !== replaced?.id && !his.some((m) => m.id === it.id)) his.push(it);
      }
      const taken = (k: string, c: string) => (g: Garment) => g.subcategory === k && g.color_family === c;
      const drawn: CardPiece[] = [];
      for (const n of needsRaw) {
        const p = n && typeof n === 'object' ? cardPiece((n as Record<string, unknown>).kind, (n as Record<string, unknown>).color) : null;
        if (!p || slotOfKind(p.kind) !== slot) continue;
        const same = taken(p.kind, p.color);
        if ((replaced && same(replaced.garment)) || his.some((m) => same(m.garment)) || drawn.some((d) => d.kind === p.kind && d.color === p.color)) continue;
        drawn.push(p);
      }
      const options: OptionEntry[] = [...his.map((m) => ({ itemId: m.id })), ...drawn.map((p) => ({ piece: p }))];
      return options.length < 2 ? null : { type: 'options', slot, options: options.slice(0, 3) };
    }
    case 'colors': {
      const list = Array.isArray(o.colors) ? o.colors : null;
      if (!list) return null;
      const families: string[] = [];
      for (const c of list) {
        const f = familyOf(c);
        if (!f) return null;
        if (!families.includes(f)) families.push(f);
      }
      if (input.allowedColors && families.some((f) => !input.allowedColors!.has(f))) return null;
      if (o.piece !== undefined && o.piece !== null) {
        if (families.length < 2 || families.length > 3) return null;
        if (typeof o.piece === 'string' && /^P\d+$/.test(o.piece)) {
          const it = piece(o.piece);
          const kind = it ? String(it.garment.subcategory ?? '') : '';
          return it && kind ? { type: 'colors', about: 'piece', kind, itemId: it.id, families } : null;
        }
        const k = kindOf(o.piece);
        return k ? { type: 'colors', about: 'piece', kind: k.kind, families } : null;
      }
      const goesWith = familyOf(o.goesWith);
      return goesWith && families.length >= 3 && families.length <= 5 ? { type: 'colors', about: 'general', goesWith, families } : null;
    }
    case 'check': {
      const occasion = occasionOr(o.occasion, 'everyday');
      return occasion ? { type: 'check', occasion } : null;
    }
    case 'ask': {
      const question = typeof o.question === 'string' ? oneLine(o.question, 120) : '';
      if (!question || !Array.isArray(o.options)) return null;
      const notSure = t('gf.notSure');
      const opts = o.options.filter((x): x is string => typeof x === 'string').map((x) => oneLine(x, 40)).filter(Boolean)
        .filter((x) => norm(x) !== norm(notSure));
      if (opts.length < 2 || opts.length > MAX_OPTIONS || new Set(opts.map(norm)).size !== opts.length) return null;
      if ([question, ...opts].some((x) => checkSentence(x, input.gate))) return null;
      return { type: 'ask', question, options: [...opts, notSure] };
    }
    case 'buy': {
      const kind = typeof o.kind === 'string' ? o.kind : '';
      const row = starterFor(kind, typeof o.shade === 'string' ? o.shade : null, input.styles);
      if (!row || !row.pick || !row.slot) return null;
      if (ownership(input.closet, input.starterMarks)[row.id]?.owned) return null;
      // "+N" is the Closet's count (#309), never the model's; pieces he only mentioned in chat aren't counted.
      const gain = starterGain(input.closet, input.styles, row);
      // Kit's one short reason: at most 90 characters and through the same gate; one that fails leaves the card without it.
      const why = typeof o.why === 'string' ? o.why.trim() : '';
      const keepWhy = why.length > 0 && why.length <= WHY_MAX && !checkSentence(why, input.gate);
      return { type: 'buy', starterId: row.id, gain, ...(keepWhy ? { why } : {}) };
    }
    case 'link': {
      const to = typeof o.to === 'string' ? o.to : '';
      const m = /^(check|piece):((?:FC|P)\d+)$/.exec(to);
      if (!m) return null;
      if (m[1] === 'check' && m[2]!.startsWith('FC')) {
        const id = input.handles[m[2]!];
        return id && input.checks.some((c) => c.id === id && c.status === 'scored') ? { type: 'link', checkId: id } : null;
      }
      if (m[1] === 'piece' && m[2]!.startsWith('P')) {
        const it = piece(m[2]);
        return it ? { type: 'link', itemId: it.id } : null;
      }
      return null;
    }
    default:
      return null;
  }
}

const WHY_MAX = 90;

// ---------------------------------------------------------------- the repeat key and the example
/** An outfit's identity: his ids and his drawn "kind|color" pieces, sorted, joined with '+'. Null for any other card. */
export function cardKey(card: AskCard): string | null {
  if (card.type !== 'outfit') return null;
  const parts = [...card.itemIds, ...(card.needs ?? []).map((p) => `${p.kind}|${p.color}`)].sort();
  return parts.length ? parts.join('+') : null;
}

/** The keys of today's stored outfit cards (the stylist rows whose chat day is `today`, 4 am rollover). */
export function shownKeysToday(chat: readonly ChatMessage[], today: string, zone: ZoneOffset): Set<string> {
  const keys = new Set<string>();
  for (const m of chat) {
    if (m.role !== 'stylist' || dayKey(m.createdAt, zone) !== today) continue;
    const c = storedCard(m.payload?.askCard);
    const k = c ? cardKey(c) : null;
    if (k) keys.add(k);
  }
  return keys;
}

/** "Show me that outfit again": the one case where a repeat is wanted (KC2.6). */
export const askedAgain = (question: string): boolean => /\b(again|same (one|outfit)|repeat)\b/i.test(question);

/** A look's flat types as the kinds the closet draws. */
const FLAT_KIND: Readonly<Record<string, string>> = {
  tee: 'tee', polo: 'polo', tank: 'tank_top', crew: 'sweatshirt', quarter_zip: 'quarter_zip', cardigan: 'cardigan', hoodie: 'hoodie', shirt: 'oxford_shirt',
  overshirt: 'overshirt', denim_jacket: 'denim_jacket', bomber: 'bomber', jacket: 'field_jacket', puffer: 'puffer', blazer: 'blazer', coat: 'overcoat',
  jeans: 'jeans', chinos: 'chinos', trousers: 'trousers', cargos: 'cargos', joggers: 'joggers', shorts: 'shorts', sneaker: 'low_profile_sneaker',
  runner: 'retro_runner', work_boot: 'work_boot', chukka: 'suede_chukka', chelsea: 'chelsea_boot', loafer: 'loafer', derby: 'derby', slides: 'slides_sandals',
};

/**
 * The example a closet that can't make the outfit gets (KC2.3): his picked looks in order, each look's two outfits in
 * order; then the first Starter row for a top, a bottom and shoes. The first one not shown today and with no kind in
 * `avoid` (kind keys). Deterministic, so Kit's words and the card show the same pieces. Null when nothing is fresh.
 */
export function exampleOutfit(styles: Styles | null, shown: ReadonlySet<string>, avoid: ReadonlySet<string> = new Set()): CardPiece[] | null {
  const fresh = (pieces: (CardPiece | null)[]): CardPiece[] | null => {
    if (pieces.length === 0 || pieces.some((p) => !p || avoid.has(p.kind))) return null;
    const list = pieces as CardPiece[];
    const key = cardKey({ type: 'outfit', itemIds: [], needs: list, example: true, occasion: 'everyday' });
    return key && !shown.has(key) ? list : null;
  };
  for (const style of picksOf(styles)) {
    const look = LOOKS.find((l) => l.style === style);
    for (const outfit of look?.outfits ?? []) {
      const hit = fresh(outfit.map((f) => cardPiece(FLAT_KIND[f.type], nearestFamily(f.color))));
      if (hit) return hit;
    }
  }
  const list = starterList(styles);
  return fresh((['top', 'bottom', 'shoes'] as const).map((slot) => {
    const g = list.find((e) => e.slot === slot && e.pick)?.pick?.garment;
    return g ? cardPiece(g.subcategory, g.color_family) : null;
  }));
}

/** A Starter id whose pick is this kind (so the same slot), his own list first; one in the piece's color wins. Null when none. */
export function nextBuyFor(piece: CardPiece, styles: Styles | null): string | null {
  const slot = slotOfKind(piece.kind);
  if (!slot || slot === 'accessory') return null;
  const rows = [...starterList(styles), ...CATALOG].filter((e) => e.pick && e.slot === slot && e.pick.garment.subcategory === piece.kind);
  return (rows.find((e) => e.pick!.garment.color_family === piece.color) ?? rows[0])?.id ?? null;
}

/** The Starter pick a buy card names, drawn; null when the row has no pick (the belt) or is unknown. */
export function buyPiece(card: Extract<AskCard, { type: 'buy' }>): CardPiece | null {
  const g = catalogRow(card.starterId)?.pick?.garment;
  return g ? cardPiece(g.subcategory, g.color_family) : null;
}

/** A colors card about a piece: that kind in each family, drawn. A general card has none. */
export function colorPieces(card: Extract<AskCard, { type: 'colors' }>): CardPiece[] {
  if (card.about !== 'piece') return [];
  return card.families.map((f) => cardPiece(card.kind, f)).filter((p): p is CardPiece => !!p);
}

// ---------------------------------------------------------------- follow-up taps
const WORD_OK = new Set(['I', "I'd", "I'll", "I'm"]);
const sayNorm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');

/**
 * An emoji or pictograph anywhere in a tap. Stricter than gate.ts's EMOJI pattern (which misses the watch, hourglass and
 * alarm clock): explicit ranges, no \p{...} property escapes, so it behaves the same on Hermes. Covers technical symbols
 * (U+2300-23FF), misc symbols and dingbats (U+2600-27BF), arrows and shapes (U+2B00-2BFF), the astral emoji planes
 * (U+1F000-1FAFF), the variation selector (U+FE0F), the zero-width joiner (U+200D) and the keycap mark (U+20E3).
 */
const TAP_EMOJI = /[‍⃣←-⇿⌀-⏿①-⓿■-◿☀-➿⤀-⥿⬀-⯿〰〽㊗㊙️]|[\u{1F000}-\u{1FAFF}]/u;

// A tap is sent as his own message, so a tap that talks about his body would invite a rating (hard line). `isBodyRating`
// (guards.ts) is a deliberately narrow whole-message list for what he types; taps come only from the model and a dropped
// tap costs little, so this check goes by meaning, with four word lists and three rules (see `bodyTap`).
const FIRST_PERSON = new Set(['i', 'im', "i'm", "i'd", "i'll", "i've", 'me', 'my', 'mine', 'myself']);
/** Parts of him. A body word whenever he is in the tap, unless a garment noun follows it ("face mask", "chest bag"). */
const BODY_PARTS = new Set([
  'body', 'bodies', 'belly', 'bellies', 'stomach', 'stomachs', 'tummy', 'gut', 'guts', 'waist', 'waistline', 'chest', 'thigh', 'thighs',
  'leg', 'legs', 'arm', 'arms', 'face', 'faces', 'figure', 'physique', 'butt', 'hips', 'hip', 'shoulders', 'shoulder', 'neck', 'skin',
  'abs', 'muscle', 'muscles', 'calves', 'calf', 'biceps', 'pecs', 'jaw', 'jawline', 'chin', 'cheeks', 'nose', 'torso', 'hairline',
  'complexion',
]);
/** Words that measure him or a garment (his weight, a hat's shape). A body word only when no garment is in the tap. */
const BODY_TRAITS = new Set(['weight', 'build', 'shape', 'frame', 'height']);
/** Two-word body phrases, a body word whenever he is in the tap. */
const BODY_PHRASES = ['love handles', 'pear shaped', 'apple shaped', 'body type', 'dad bod', 'beer belly', 'baby face'];
/** Words that describe a body, a size or an age. A body word only when they describe him (see `bodyTap`). */
const BODY_ADJ = new Set([
  'tall', 'taller', 'short', 'shorter', 'thin', 'thinner', 'skinny', 'skinnier', 'fat', 'fatter', 'heavy', 'heavier', 'bulky', 'old', 'older',
  'young', 'younger', 'big', 'bigger', 'small', 'smaller', 'slim', 'slimmer', 'chubby', 'wide', 'wider', 'narrow', 'broad', 'broader',
  'lanky', 'large', 'overweight', 'underweight', 'ugly', 'pretty', 'handsome', 'attractive', 'hot', 'fit', 'muscular', 'scrawny', 'stocky',
  'tiny', 'huge', 'lean', 'leaner', 'pale', 'paler', 'hairy', 'pudgy', 'sexy', 'weak', 'gaunt', 'shaped', 'flabby', 'bony', 'buff',
  'ripped', 'cute', 'tan', 'tanned', 'bald', 'balding', 'kid', 'child', 'teen', 'teenager', 'boy',
]);
/** Words that sit between a subject and its body word ("am I a bit pudgy", "do I look like a kid"). */
const MODIFIERS = new Set([
  'too', 'so', 'a', 'an', 'the', 'bit', 'little', 'lot', 'really', 'very', 'kind', 'kinda', 'sort', 'of', 'more', 'less', 'much', 'even',
  'any', 'way', 'quite', 'like', 'getting', 'somewhat', 'rather', 'overly', 'super',
]);
/** Garment nouns: a garment as the subject, or right after a part, makes it a clothes tap. */
const GARMENTS = new Set([
  'shirt', 'shirts', 'tee', 'tees', 'top', 'tops', 'polo', 'henley', 'flannel', 'overshirt', 'jacket', 'jackets', 'coat', 'coats',
  'hoodie', 'hoodies', 'sweater', 'sweaters', 'sweatshirt', 'cardigan', 'vest', 'blazer', 'jeans', 'pants', 'trousers', 'chinos',
  'shorts', 'joggers', 'sweatpants', 'slacks', 'boots', 'boot', 'sneakers', 'sneaker', 'shoes', 'shoe', 'loafers', 'sandals', 'socks',
  'hat', 'hats', 'cap', 'caps', 'beanie', 'scarf', 'tie', 'belt', 'watch', 'ring', 'chain', 'bracelet', 'bag', 'mask', 'glasses',
  'sunglasses', 'sleeve', 'sleeves', 'collar', 'hem', 'gloves', 'warmers', 'gaiter', 'outfit', 'clothes', 'layers',
]);
const SELF = new Set(['i', 'me']);
const LINK = new Set(['look', 'looks', 'looking', 'looked', 'seem', 'seems']);
const MAKE = new Set(['make', 'makes', 'making', 'made']);

/**
 * True when a tap is about his own body. Three rules:
 * 1. A body part, a body phrase, or (with no garment in the tap) a body trait, in a tap about him (I, me, my): dropped,
 *    except a part with a garment noun right after it ("Is my face mask ok?").
 * 2. A word from BODY_ADJ (size, age, body) describing him: after "am I", "I am", "I'm", "make me", or "I/me look",
 *    "I feel". "Show me", "give me", "for me", "my" are neutral: "Show me tall boots", "Is my hoodie too big?" stay.
 * 3. "look/seem <BODY_ADJ>" with no garment before it ("Does that look fat?"): dropped; "Do my sneakers look fat?" stays.
 */
function bodyTap(text: string): boolean {
  const t = text.toLowerCase().replace(/[‘’]/g, "'");
  const w = t.split(/[^a-z']+/).map((x) => x.replace(/^'+|'+$/g, '')).filter(Boolean);
  const garmentBefore = (k: number) => w.slice(0, k).some((x) => GARMENTS.has(x));
  // Rules 2 and 3: find each body word, step back over modifiers to the word that governs it.
  for (let i = 0; i < w.length; i++) {
    if (!BODY_ADJ.has(w[i]!)) continue;
    let k = i - 1;
    while (k >= 0 && MODIFIERS.has(w[k]!)) k--;
    const head = w[k];
    const prev = w[k - 1];
    if (head === "i'm" || head === 'im') return true;
    if ((head === 'i' && prev === 'am') || (head === 'am' && prev === 'i')) return true;
    if (head === 'me' && prev && MAKE.has(prev)) return true;
    if ((head === 'feel' || head === 'feels') && prev && SELF.has(prev)) return true;
    if (head && LINK.has(head) && ((prev && SELF.has(prev)) || !garmentBefore(k))) return true;
  }
  // Rule 1: needs him in the tap.
  if (!w.some((x) => FIRST_PERSON.has(x))) return false;
  const joined = ` ${w.join(' ')} `;
  if (BODY_PHRASES.some((p) => joined.includes(` ${p} `))) return true;
  if (w.some((x, i) => BODY_PARTS.has(x) && !GARMENTS.has(w[i + 1] ?? ''))) return true;
  return w.some((x) => BODY_TRAITS.has(x)) && !w.some((x) => GARMENTS.has(x));
}

/**
 * The model's follow-up taps, checked (KC1.3): at most 3, in order, each a string of 1 to 30 characters in sentence case
 * (no capital but the first word's and "I"), no all-capital word, through the sentence gate, not a repeat of his
 * question and not a duplicate. Anything that isn't an array gives none. There's no clothes-word list: the gate, the
 * prompt and never showing them under a refusal hold that.
 */
export function checkFollowUps(raw: unknown, o: { question: string; gate: GateContext }): string[] {
  if (!Array.isArray(raw)) return [];
  const asked = sayNorm(o.question);
  const askedWords = new Set(asked.split(' ').filter(Boolean));
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (out.length >= 3) break;
    if (typeof item !== 'string') continue;
    const text = item.trim();
    if (!text || text.length > 30) continue;
    const words = text.replace(/’/g, "'").split(/\s+/);
    if (!/^\p{Lu}/u.test(text)) continue;
    if (words.slice(1).some((w) => /^\p{Lu}/u.test(w) && !WORD_OK.has(w.replace(/[^\p{L}']+$/u, '')))) continue;
    if (/(?:^|[^\p{L}])\p{Lu}{2,}(?![\p{L}])/u.test(text)) continue;
    if (TAP_EMOJI.test(text) || bodyTap(text)) continue;
    if (checkSentence(text, o.gate) || isBodyRating(text)) continue;
    const n = sayNorm(text);
    if (!n || n === asked || seen.has(n)) continue;
    const mine = new Set(n.split(' '));
    const small = Math.min(mine.size, askedWords.size);
    if (small >= 2 && [...mine].filter((w) => askedWords.has(w)).length / small >= 0.8) continue;
    seen.add(n);
    out.push(text);
  }
  return out;
}

// ---------------------------------------------------------------- reading a stored card back
const fieldsOk = (v: unknown): boolean => {
  if (!v || typeof v !== 'object') return false;
  const f = v as Record<string, unknown>;
  return typeof f.name === 'string' && typeof f.slot === 'string' && !!f.garment && typeof f.garment === 'object' && typeof f.hex === 'string'
    && Array.isArray(f.confirmedFields) && f.confirmedFields.every((x) => typeof x === 'string');
};
const familiesOk = (v: unknown): boolean => Array.isArray(v) && v.length > 0 && v.length <= 5 && v.every(isFamily);

/** A stored card as read back from a chat row (Past chats, R8); null when it's not one. Old shapes read as they were. */
export function storedCard(v: unknown): AskCard | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  switch (o.type) {
    case 'outfit': {
      if (!Array.isArray(o.itemIds) || !o.itemIds.every((x) => typeof x === 'string') || typeof o.occasion !== 'string') return null;
      if (o.needs !== undefined && !(Array.isArray(o.needs) && o.needs.every((p) => storedPiece(p)))) return null;
      if (o.example !== undefined && typeof o.example !== 'boolean') return null;
      return o as unknown as AskCard;
    }
    case 'check':
      return typeof o.occasion === 'string' ? (o as unknown as AskCard) : null;
    case 'ask':
      return typeof o.question === 'string' && Array.isArray(o.options) ? (o as unknown as AskCard) : null;
    case 'options': {
      if (typeof o.slot !== 'string' || !(SLOTS as readonly string[]).includes(o.slot) || !Array.isArray(o.options) || o.options.length === 0) return null;
      const ok = o.options.every((e) => {
        if (!e || typeof e !== 'object' || Array.isArray(e)) return false;
        const x = e as Record<string, unknown>;
        return typeof x.itemId === 'string' || (x.piece !== undefined && !!storedPiece(x.piece));
      });
      return ok ? (o as unknown as AskCard) : null;
    }
    case 'colors': {
      if (!familiesOk(o.families)) return null;
      if (o.about === 'piece') return typeof o.kind === 'string' && (o.itemId === undefined || typeof o.itemId === 'string') ? (o as unknown as AskCard) : null;
      if (o.about === 'general') return typeof o.goesWith === 'string' ? (o as unknown as AskCard) : null;
      return null;
    }
    case 'add':
      return storedPiece(o.piece) && (o.outcome === 'asked' || o.outcome === 'added' || o.outcome === 'declined')
        && (o.itemId === undefined || o.itemId === null || typeof o.itemId === 'string') ? (o as unknown as AskCard) : null;
    case 'changed':
      return typeof o.itemId === 'string' && fieldsOk(o.before) && fieldsOk(o.after) && (o.undone === undefined || o.undone === true) ? (o as unknown as AskCard) : null;
    case 'buy':
      return typeof o.starterId === 'string' && (o.why === undefined || typeof o.why === 'string') ? (o as unknown as AskCard) : null;
    case 'link':
      return typeof o.checkId === 'string' || typeof o.itemId === 'string' ? (o as unknown as AskCard) : null;
    case 'correct':
      return typeof o.checkId === 'string' ? (o as unknown as AskCard) : null;
    default:
      return null;
  }
}

/** An outfit card's pieces now: the ones still in his closet, the drawn ones (always there), and whether any of his left since (R8). */
export function outfitNow(card: Extract<AskCard, { type: 'outfit' }>, closet: readonly ClosetItemRow[]): { items: ClosetItemRow[]; needs: CardPiece[]; example: boolean; gone: boolean } {
  const items = card.itemIds.map((id) => closet.find((c) => c.id === id)).filter((c): c is ClosetItemRow => !!c && isOwned(c));
  return { items, needs: card.needs ?? [], example: card.example === true, gone: items.length < card.itemIds.length };
}

/** An options card's entries now: his piece as its row, a drawn piece as itself, one that left as `gone`. */
export function optionsNow(card: AskCard, closet: readonly ClosetItemRow[]): { entries: ({ item: ClosetItemRow } | { piece: CardPiece } | { gone: true })[] } {
  if (card.type !== 'options') return { entries: [] };
  return {
    entries: card.options.map((e) => {
      if ('piece' in e) return { piece: e.piece };
      const it = closet.find((c) => c.id === e.itemId);
      return it && isOwned(it) ? { item: it } : { gone: true as const };
    }),
  };
}

// ---------------------------------------------------------------- what a card says and shows (07 §14 P1, P2, P4)
export interface CardWords {
  /** Piece names by id (his closet now). */
  nameOf: (itemId: string) => string | null;
  /** A check's link words ("Today's check"), or null when it's gone. */
  checkLabel?: (checkId: string) => string | null;
}

const low = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

/** One VoiceOver line for a card (P1), also read after the answer when it's complete (P2). Null: nothing to say. */
export function cardSpoken(card: AskCard | null, w: CardWords): string | null {
  if (!card) return null;
  switch (card.type) {
    case 'outfit': {
      // A card with drawn pieces or an example isn't "from your closet": T104 writes those VoiceOver lines.
      if ((card.needs && card.needs.length > 0) || card.example) return null;
      const names = card.itemIds.map(w.nameOf).filter((x): x is string => !!x).map(low);
      return names.length ? t('ask.card.a11y.outfit', { names: names.join(', ') }) : t('ask.card.gone');
    }
    case 'check':
      return t('ask.card.startCheck');
    case 'ask':
      return `${card.question} ${card.options.join(', ')}.`;
    case 'buy':
      return buySpoken(card, outfitsOn());
    case 'link': {
      if ('itemId' in card) {
        const n = w.nameOf(card.itemId);
        return n ? t('ask.card.link.piece', { item: low(n) }) : t('ask.card.gone');
      }
      return w.checkLabel?.(card.checkId) ?? t('ask.card.gone');
    }
    case 'correct':
      return t('card.nqr');
    // The new shapes get their VoiceOver lines with their views (T104); until then nothing is said.
    case 'options':
    case 'colors':
    case 'add':
    case 'changed':
      return null;
  }
}

/**
 * The card a "that score is wrong" question gets (G19): today's scored check the router named opens its Not quite
 * right?. An earlier day's check is read-only (#276), and a check that isn't scored has nothing to correct: no card.
 */
export function correctCard(route: { kind: string; check: string | null }, handles: Readonly<Record<string, string>>, checks: readonly FitCheckRow[], today: string): AskCard | null {
  if (route.kind !== 'feedback' || !route.check) return null;
  const id = handles[route.check];
  const c = id ? checks.find((x) => x.id === id) : undefined;
  return c && c.status === 'scored' && c.score !== null && c.dayKey === today ? { type: 'correct', checkId: c.id } : null;
}

/** Which controls a card shows (P4): Past chats show the card and his pick, never a button that changes anything. */
export function cardControls(card: AskCard, o: { readOnly: boolean; tapped: string | null; gone?: boolean }) {
  const live = !o.readOnly;
  const example = card.type === 'outfit' && card.example === true;
  return {
    /** An example is not his outfit: no Wear this (it keeps Check it). */
    wear: card.type === 'outfit' && live && !o.gone && !example,
    checkIt: (card.type === 'outfit' && !o.readOnly && !o.gone) || (card.type === 'check' && !o.readOnly),
    /** Not quite right? (G19): today's chat only; Past chats are read-only. */
    correct: card.type === 'correct' && !o.readOnly,
    /** The ask card's answers: tappable until one is picked, never in Past chats. */
    answers: card.type === 'ask' ? card.options.map((option) => ({ option, picked: o.tapped === option, tappable: !o.readOnly && o.tapped === null })) : [],
    /** The "You'd need" menu (add to closet, next buy): an outfit or options card holding a drawn piece, never an example. */
    needMenu: live && ((card.type === 'outfit' && !example && (card.needs?.length ?? 0) > 0) || (card.type === 'options' && card.options.some((e) => 'piece' in e))),
    /** The add card's Add and No thanks: only while it still asks. */
    add: live && card.type === 'add' && card.outcome === 'asked',
    noThanks: live && card.type === 'add' && card.outcome === 'asked',
    /** Undo: an added piece, or a change not yet undone. */
    undo: live && ((card.type === 'add' && card.outcome === 'added') || (card.type === 'changed' && !card.undone)),
    /** What happened to an add card, for Past chats too (T104 writes the words). */
    outcome: card.type === 'add' ? card.outcome : (null as 'asked' | 'added' | 'declined' | null),
  };
}

/** The saved line's Undo shows only in today's chat (P4). */
export const savedUndoShows = (readOnly: boolean): boolean => !readOnly;

/**
 * The piece a link card opens, as it stands now: a piece merged into another opens the one it lives on in, a removed
 * one opens nothing ("No longer in your closet"). It checked only removal and opened a merged-away page (07 §17, U9).
 */
export function linkedPiece(id: string, closet: readonly ClosetItemRow[]): ClosetItemRow | null {
  let it = closet.find((c) => c.id === id) ?? null;
  for (let hops = 0; it && it.mergedInto && hops < 5; hops++) {
    const into: string = it.mergedInto;
    it = closet.find((c) => c.id === into) ?? null;
  }
  return it && isOwned(it) ? it : null;
}

/** The buy card's "+N outfits with what you own" line (specs/closet-beta.md CB1.2): only while Outfits are on, and only
 *  for a real gain. Off, the card keeps its tag, name and price; the gain stays on the message as Kit's private
 *  evidence (`buildCard`). */
export function buyGainLine(gain: number | null, on: boolean): string | null {
  if (!on || gain === null || gain <= 0) return null;
  return gain === 1 ? t('ask.card.buy.gainOne') : t('ask.card.buy.gain', { n: gain });
}

/** The buy card as VoiceOver reads it: tag, name, the gain line when shown, price. `on` is the Outfits switch, passed
 *  in so the card's label follows the same value as its visible line. */
export function buySpoken(card: Extract<AskCard, { type: 'buy' }>, on: boolean): string | null {
  const row = catalogRow(card.starterId);
  if (!row) return null;
  return [t('ask.card.buy.tag'), row.pick?.name ?? row.name, buyGainLine(card.gain, on), row.budget].filter(Boolean).join('. ') + '.';
}

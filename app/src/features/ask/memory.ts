// What the stylist learns from the chat (07 §4, C4; checks M1–M4). Nothing is learned silently: a saved fact shows
// "Saved to what I know · Undo" under the answer and in You → What your stylist knows ("You told me · Oct 15").
//   · Only the fixed keys; the value is one clean line. Anything about his body, health, age, beliefs, money beyond a
//     clothes budget or other people is dropped, whatever key it came under.
//   · A fact he deleted is never learned again (its deleted row is the tombstone).
//   · budget also sets profile.budget; look_now never touches his picked looks.
//   · owns_unphotographed ("black Chelsea boots") becomes a closet piece from chat: not photographed, a dashed tile,
//     "From chat"; used in outfit ideas, never in a "+N outfits" count; a fit check that sees it asks "Same as your …?".
import { displayHex, G, garmentName, parseShade, type Garment } from '@kitted/core';
import type { KittedStore } from '@/data/store';
import type { ClosetItemRow, FactRow } from '@/data/types';
import type { Clock } from '@/services/clock';
import { BUDGETS, type Budget } from '@/features/you/profile';
import { t, type StringKey } from '@/i18n/en';
import { oneLine } from './context';
import { checkSentence, scoresIn } from './gate';

export const REMEMBER_KEYS = [
  'waist_size', 'inseam', 'top_size', 'shoe_size', 'budget', 'work_dress_code', 'school_or_work', 'occasions_coming',
  'color_avoid', 'color_like', 'fit_like', 'fit_avoid', 'look_now', 'owns_unphotographed',
] as const;
export type RememberKey = (typeof REMEMBER_KEYS)[number];

/** Topics never stored, whatever key they came under (07 §4). */
const NEVER = /\b(?:weigh|weight|pounds|lbs|kilos|fat|skinny guy|thin guy|chubby|belly|muscle|muscular|gym rat|diet|height|tall|short guy|feet tall|\d\s*'\s*\d|cm\b|health|sick|illness|disease|diabet|asthma|adhd|autis|depress|anxiety|therapy|meds|medication|pregnan|age|years old|yo\b|birthday|born|religio|church|mosque|temple|muslim|christian|jewish|hindu|buddhist|gay|bi\b|lesbian|queer|trans\b|sexual|girlfriend|boyfriend|wife|husband|partner|my (?:mom|dad|mother|father|brother|sister|friend|boss)|salary|income|rent|debt|loan|\$\s?\d{4,}|ethnic|race|black guy|white guy|asian|latino|hispanic)\b/i;

export interface MemoryDeps {
  store: Pick<KittedStore, 'facts' | 'closet' | 'profile'>;
  clock: Clock;
  ids: (prefix: string) => string;
}

const clean = (v: string) => oneLine(v, 80).replace(/^["“]|["”]$/g, '').trim();
const same = (a: string, b: string) => a.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() === b.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** The model's remember, checked (M1): a known key and a clean, allowed value. Null drops it. */
export function parseRemember(raw: unknown): { key: RememberKey; value: string } | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.key !== 'string' || !(REMEMBER_KEYS as readonly string[]).includes(o.key)) return null;
  if (typeof o.value !== 'string' && typeof o.value !== 'number') return null;
  const value = clean(String(o.value));
  if (!value || value.length < 1) return null;
  // The gate's rules, minus scores: a number in a fact is a size or a price ("10.5", "$60"), never a score.
  if (NEVER.test(value) || checkSentence(value, { allowedScores: scoresIn(value) }) !== null) return null;
  return { key: o.key as RememberKey, value };
}

/** The fact as You shows it ("Waist 32", "You own black Chelsea boots (no photo yet)"). */
export function factText(key: RememberKey, value: string): string {
  const v = value.replace(/^(?:a |an |my |some )/i, (m) => (key === 'owns_unphotographed' ? m.toLowerCase() : ''));
  const lowerV = key === 'owns_unphotographed' || key.startsWith('color') || key.startsWith('fit') || key === 'look_now' ? v.charAt(0).toLowerCase() + v.slice(1) : v;
  return t(`fact.chat.${key}` as StringKey, { v: lowerV, V: v.charAt(0).toUpperCase() + v.slice(1) });
}

/** "$50", "under 30", "around 100 bucks" → his budget bucket (07 §4: budget writes profile.budget). */
export function budgetOf(value: string): Budget | null {
  const n = Number(/(\d+(?:\.\d+)?)/.exec(value.replace(/,/g, ''))?.[1] ?? NaN);
  if (!Number.isFinite(n)) return null;
  if (n < 30) return 'under_30';
  if (n <= 60) return '30_60';
  if (n <= 100) return '60_100';
  return '100_plus';
}

/** Words for the piece kinds he might mention → the reading's category and subcategory. */
const PIECE_WORDS: readonly [RegExp, string, string][] = [
  [/\bchelsea boots?\b/, 'footwear', 'chelsea_boot'], [/\b(?:work|lace[- ]up) boots?\b/, 'footwear', 'work_boot'], [/\bchukkas?\b/, 'footwear', 'suede_chukka'],
  [/\bboots?\b/, 'footwear', 'work_boot'], [/\bloafers?\b/, 'footwear', 'loafer'], [/\bderb(?:y|ies)\b/, 'footwear', 'derby'],
  [/\b(?:dress shoes?|oxfords? shoes?)\b/, 'footwear', 'dress_shoe'], [/\b(?:leather sneakers?|white sneakers?)\b/, 'footwear', 'white_leather_sneaker'],
  [/\b(?:canvas sneakers?|chucks)\b/, 'footwear', 'canvas_sneaker'], [/\b(?:runners|running shoes)\b/, 'footwear', 'retro_runner'],
  [/\b(?:slides|sandals)\b/, 'footwear', 'slides_sandals'], [/\bsneakers?\b/, 'footwear', 'low_profile_sneaker'],
  [/\bchinos?\b/, 'bottom', 'chinos'], [/\bjeans\b/, 'bottom', 'jeans'], [/\b(?:trousers|slacks|dress pants)\b/, 'bottom', 'trousers'],
  [/\bcargos?\b/, 'bottom', 'cargos'], [/\bshorts\b/, 'bottom', 'shorts'], [/\b(?:joggers|sweatpants)\b/, 'bottom', 'joggers'],
  [/\bblazer\b/, 'outerwear', 'blazer'], [/\bsport coat\b/, 'outerwear', 'sport_coat'], [/\bdenim jacket\b/, 'outerwear', 'denim_jacket'],
  [/\bleather jacket\b/, 'outerwear', 'leather_jacket'], [/\bbomber\b/, 'outerwear', 'bomber'], [/\bchore coat\b/, 'outerwear', 'chore_coat'],
  [/\bpuffer\b/, 'outerwear', 'puffer'], [/\b(?:overcoat|topcoat|coat)\b/, 'outerwear', 'overcoat'], [/\bjacket\b/, 'outerwear', 'field_jacket'],
  [/\b(?:overshirt|shacket)\b/, 'top', 'overshirt'], [/\bhoodie\b/, 'top', 'hoodie'], [/\b(?:sweatshirt|crewneck)\b/, 'top', 'sweatshirt'],
  [/\bquarter[- ]zip\b/, 'top', 'quarter_zip'], [/\bcardigan\b/, 'top', 'cardigan'], [/\b(?:sweater|knit|jumper)\b/, 'top', 'sweater'],
  [/\bpolo\b/, 'top', 'polo'], [/\boxford\b/, 'top', 'oxford_shirt'], [/\bflannel\b/, 'top', 'flannel_shirt'], [/\bgraphic tee\b/, 'top', 'graphic_tee'],
  [/\b(?:tee|t-shirt|t shirt)\b/, 'top', 'tee'], [/\bshirt\b/, 'top', 'oxford_shirt'],
];
const SLOT: Record<string, ClosetItemRow['slot']> = { top: 'top', bottom: 'bottom', footwear: 'shoes', outerwear: 'outer' };

/** "black Chelsea boots" → a garment (null when no kind of piece is named). */
export function garmentOf(value: string): Garment | null {
  const v = ` ${value.toLowerCase()} `;
  const hit = PIECE_WORDS.find(([re]) => re.test(v));
  if (!hit) return null;
  const color = parseShade(value)?.family ?? 'unknown';
  const g = G(hit[1], hit[2], color);
  if (hit[1] === 'bottom') g.leg_shape = /\bwide\b/.test(v) ? 'wide' : /\bslim\b/.test(v) ? 'slim' : /\bskinny\b/.test(v) ? 'skinny' : 'straight';
  return g;
}

/** "Black Chelsea boots": his words, cleaned, capitalised (the closet's own namer takes over once a photo sees it). */
function pieceName(value: string, g: Garment): string {
  const words = value.replace(/^(?:a |an |my |some |the |pair of |a pair of )+/i, '').trim();
  const name = words.length >= 3 && words.length <= 40 ? words : garmentName(g);
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Saves the model's remember (M1–M4). Returns the fact's id (for "Saved · Undo"), or null when nothing was saved
 * (not allowed, already known, or deleted by him before).
 */
export async function applyRemember(raw: unknown, at: number, deps: MemoryDeps): Promise<{ factId: string; itemId?: string } | null> {
  const r = parseRemember(raw);
  if (!r) return null;
  const facts = await deps.store.facts.all();
  const text = factText(r.key, r.value);
  // A fact he deleted is a tombstone: never learned again. One already known isn't saved twice.
  if (facts.some((f) => f.key === r.key && same(f.value, text))) return null;
  const now = deps.clock.nowMs();
  let itemId: string | null = null;
  if (r.key === 'owns_unphotographed') {
    const g = garmentOf(r.value);
    const slot = g ? SLOT[String(g.category)] : undefined;
    if (!g || !slot) return null;
    itemId = deps.ids('C');
    const item: ClosetItemRow = {
      id: itemId, name: pieceName(r.value, g), slot, garment: g, confirmedFields: [], hex: displayHex(g.color_family), photoFile: null, demoPhotoId: null,
      isPhotographed: false, source: 'chat', starterId: null, wornCount: 0, lastWornAt: null, addedAt: now, isDeleted: false,
      mergedInto: null, maybeSameAs: null, cropFile: null, cropScore: null, updatedAt: now,
      profile: { aliases: [], distinctFrom: [], confirmed: {}, autoName: false },
    };
    await deps.store.closet.put(item);
  }
  if (r.key === 'budget') {
    const b = budgetOf(r.value);
    const p = await deps.store.profile.get('me');
    if (b && p && (BUDGETS as readonly string[]).includes(b)) await deps.store.profile.patch('me', { budget: b });
  }
  const fact: FactRow = { id: deps.ids('F'), key: r.key, value: text, source: 'told', createdAt: at, isDeleted: false };
  await deps.store.facts.put(fact);
  return { factId: fact.id, ...(itemId ? { itemId } : {}) };
}

/** "Saved · Undo": the fact goes (and stays a tombstone); a piece it added (`itemId`) leaves the closet. */
export async function undoRemember(factId: string, itemId: string | null, deps: Pick<MemoryDeps, 'store'>): Promise<void> {
  const f = await deps.store.facts.get(factId);
  if (!f) return;
  await deps.store.facts.patch(factId, { isDeleted: true });
  if (itemId) {
    const it = await deps.store.closet.get(itemId);
    if (it && it.source === 'chat' && !it.isPhotographed) await deps.store.closet.patch(itemId, { isDeleted: true });
  }
}

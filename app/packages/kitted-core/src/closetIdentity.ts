// Closet identity: is this garment one he already owns, a new one, or should we ask him?
// The founder's rule: the stylist must never get his clothes wrong. A dark grey hoodie never merges with (or shows
// as) his light grey one; he may own several similar grey hoodies; logos, pouches, zips, graphics and denim washes
// tell pieces apart; when unsure, ask. So:
//   - hard differences VETO a match (it's a new item), whatever else agrees;
//   - soft evidence adds up to a score; only a clear, uncontested score auto-matches ("same");
//   - everything in between is a question for him ("ask"), never a silent merge.
// Pure and deterministic: candidates rank by score desc, then id asc, so the closet's order never matters.
// closetMatch.ts closetPlan() wraps reconcileReading() (#91).

import { colorDistance, lightnessOf } from "./closetColor";
import { parseShade, shadeFromId, shadeId, type ShadeKey } from "./closetShade";
import { SLOT_TO_CLOSET } from "./names";
import { RUBRIC_DATA } from "./rubricData";
import type { ClosetItem, Garment, Reading, ShoeKind } from "./types";

// ---------------------------------------------------------------- vocabulary
export const DETAILS = [
  "front_pouch", "full_zip", "half_zip", "hood", "drawstring", "belt_loops", "elastic_cuffs", "cargo_pockets",
  "chest_pocket", "buttons", "collar", "pleats", "side_stripe", "raw_hem",
] as const;
export type Detail = (typeof DETAILS)[number];
export type Lightness = "light" | "mid" | "dark";
export type SleeveLength = "short" | "long" | "sleeveless";
export type ShoeProfile = "sleek" | "regular" | "chunky";
export type DenimWear = "none" | "faded" | "ripped";

const LIGHTNESS: readonly string[] = ["light", "mid", "dark"];
const SLEEVES: readonly string[] = ["short", "long", "sleeveless"];
const SHOE_ORDER: readonly string[] = ["sleek", "regular", "chunky"];
const DENIM_WEAR: readonly string[] = ["none", "faded", "ripped"];
const LEG_ORDER: readonly string[] = ["skinny", "slim", "straight", "relaxed", "wide"];
const LEG_ALIAS: Readonly<Record<string, string>> = { flare_bootcut: "straight", barrel: "wide" };
const LOGOS: readonly string[] = ["none", "small", "large"];
const STRONG_PATTERNS: readonly string[] = ["stripes", "checks_plaid", "camo", "floral"];

/** Pieces that are worn either as the top or as the layer over it (a hoodie read as top one day, outerwear the next). */
export const LAYERABLE: readonly string[] = [
  "hoodie", "overshirt", "cardigan", "fleece", "flannel_shirt", "quarter_zip", "sweatshirt", "chore_coat",
  "camp_collar_shirt", "denim_jacket",
];
/** Look-alike subcategories the model can confuse: a mismatch here costs points and asks, never vetoes. */
export const FLIP_PAIRS: readonly (readonly [string, string])[] = [
  ["jeans", "sweatpants"], ["jeans", "joggers"], ["chinos", "trousers"], ["trousers", "suit_trousers"],
  ["sweater", "sweatshirt"], ["hoodie", "sweatshirt"], ["tee", "graphic_tee"], ["chelsea_boot", "work_boot"],
  ["retro_runner", "performance_runner"], ["white_leather_sneaker", "low_profile_sneaker"],
];
function isFlip(a: string, b: string): boolean {
  return FLIP_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

/** Footwear subtype -> the kind the shoe quick tap asks about (rubric.py's tap.shoes.kinds). He names a kind, never a subtype. */
const SHOE_KIND: Readonly<Record<string, ShoeKind>> = Object.fromEntries(
  (Object.entries(RUBRIC_DATA.tap.shoes.kinds) as [ShoeKind, string[]][]).flatMap(([kind, subs]) => subs.map((s) => [s, kind])),
);
const SHOE_KINDS: readonly string[] = RUBRIC_DATA.tap.shoes.order;
/** A footwear subcategory's kind; null for "other" and for shoes outside the three kinds (loafers, derbies...). */
export function shoeKindOf(subcategory: unknown): ShoeKind | null {
  return typeof subcategory === "string" ? SHOE_KIND[subcategory] ?? null : null;
}

// ---------------------------------------------------------------- known pieces
/**
 * A piece the app is sure he owns (he confirmed it, or it was seen in 2+ checks), as it stood before the photo being
 * asked about. v3 fields only. Built by the app's closet (features/closet/profile.ts knownPieces); the reading's
 * "Your green work boots?" question (workstream A, #122.3) picks from these with knownMatches().
 */
export interface KnownPiece {
  id: string;
  /** Closet slot: top | bottom | shoes | outer. */
  slot: string;
  /** v3 color family. */
  colorFamily: string | null;
  subcategory: string | null;
  /** His answer to the shoe tap, else the kind of the subtype (null: "other" or not one of the three kinds). */
  shoeKind: ShoeKind | null;
  /** True when shoeKind is his own answer. */
  shoeKindSaid: boolean;
  name: string;
  /** He answered for it (the tap, a correction, "Yes, same one", a field or name he set) or added it himself. */
  confirmed: boolean;
  /** Live sightings before this photo. */
  sightings: number;
  /** v3 pattern (solid, stripes, checks_plaid, graphic…) as the closet shows it; null/absent = unknown. */
  pattern?: string | null;
}

// "Your White tee?" was offered for his cream striped oxford (Oct 11, #219): a known piece is never offered when the
// read shows a different pattern or a different collar family, whatever the colour says.
/** Collared shirts and polos. */
const COLLARED_TOPS: ReadonlySet<string> = new Set([
  "oxford_shirt", "dress_shirt", "polo", "knit_polo", "rugby_shirt", "camp_collar_shirt", "flannel_shirt", "overshirt",
]);
/** Collarless tops: tees and knits. */
const COLLARLESS_TOPS: ReadonlySet<string> = new Set([
  "tee", "graphic_tee", "tank_top", "sweater", "sweatshirt", "hoodie", "cardigan",
]);
/** True when one is a collared shirt and the other a tee or knit (a hoodie vs a tee stays possible: a look-alike). */
export function collarFamiliesDiffer(a: unknown, b: unknown): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  return (COLLARED_TOPS.has(a) && COLLARLESS_TOPS.has(b)) || (COLLARLESS_TOPS.has(a) && COLLARED_TOPS.has(b));
}
/** True when both patterns are known and differ: solid vs any pattern, or two different patterns ("other" = some
 *  pattern, so it differs only from solid). Unknown (null, "na") never differs. */
export function patternsDiffer(a: unknown, b: unknown): boolean {
  const known = (p: unknown): p is string => typeof p === "string" && p !== "" && p !== "na";
  if (!known(a) || !known(b) || a === b) return false;
  if (a === "solid" || b === "solid") return true;
  return a !== "other" && b !== "other";
}

/**
 * The known pieces a garment could be, best first; a question should be asked only when exactly one comes back.
 * Same slot, then: shoes by kind (an unknown kind is compatible; color can't be trusted on shoes, it only breaks
 * ties); everything else by the same pattern and collar family (#219: a striped oxford is never "your white tee") and
 * color family exact or neighbors (grey and charcoal are neighbors). Ties narrow to the
 * closest color, then the same subcategory. Pure and deterministic.
 */
export function knownMatches(known: readonly KnownPiece[], g: Garment): KnownPiece[] {
  const slot = typeof g.category === "string" ? SLOT_TO_CLOSET[g.category] ?? null : null;
  if (slot === null) return [];
  const sub = typeof g.subcategory === "string" ? g.subcategory : null;
  const color = typeof g.color_family === "string" ? g.color_family : null;
  const gk = shoeKindOf(sub);
  const dist = (p: KnownPiece) =>
    color === null || p.colorFamily === null ? 2 : colorDistance(color, p.colorFamily, { jeans: sub === "jeans" || p.subcategory === "jeans" });
  const fits = known.filter((p) => {
    if (p.slot !== slot) return false;
    if (slot === "shoes") return gk === null || p.shoeKind === null || gk === p.shoeKind;
    // a different pattern or collar family is a different piece (shoes' pattern reads are noise: not used there)
    if (patternsDiffer(g.pattern, p.pattern) || collarFamiliesDiffer(sub, p.subcategory)) return false;
    return dist(p) <= 1;
  });
  const rank = (p: KnownPiece) => dist(p) * 2 + (p.subcategory === sub ? 0 : 1);
  const best = Math.min(...fits.map(rank));
  return fits.filter((p) => rank(p) === best).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

// ---------------------------------------------------------------- brands
/** Brand id -> the words that name it (logo text, nicknames, the logo itself). Matched as whole words. */
const BRANDS: Readonly<Record<string, readonly string[]>> = {
  nike: ["nike", "swoosh", "just do it"], jordan: ["jordan", "jumpman", "air jordan"],
  adidas: ["adidas", "trefoil", "three stripes", "3 stripes"], puma: ["puma"], new_balance: ["new balance", "nb"],
  under_armour: ["under armour", "under armor"], the_north_face: ["the north face", "north face", "tnf"],
  patagonia: ["patagonia"], carhartt: ["carhartt", "carhartt wip"], champion: ["champion"],
  ralph_lauren: ["ralph lauren", "polo ralph lauren", "polo pony"], lacoste: ["lacoste"],
  tommy_hilfiger: ["tommy hilfiger", "hilfiger", "tommy"], calvin_klein: ["calvin klein"], levis: ["levis", "levi", "levi s"],
  gap: ["gap"], uniqlo: ["uniqlo"], hm: ["h&m", "h m"], zara: ["zara"], supreme: ["supreme"], stussy: ["stussy"],
  fear_of_god: ["fear of god", "essentials", "fog"], vans: ["vans"], converse: ["converse", "chuck taylor"],
  reebok: ["reebok"], asics: ["asics"], columbia: ["columbia"], arcteryx: ["arcteryx", "arc teryx"],
  lululemon: ["lululemon"], gymshark: ["gymshark"], abercrombie: ["abercrombie", "abercrombie fitch", "a&f"],
  american_eagle: ["american eagle"], hollister: ["hollister"], guess: ["guess"], hugo_boss: ["hugo boss", "boss"],
  timberland: ["timberland"], dr_martens: ["dr martens", "doc martens"], new_era: ["new era"], kith: ["kith"],
};
const GENERIC_LOGO_WORDS = new Set([
  "logo", "small", "large", "big", "chest", "embroidered", "print", "printed", "text", "graphic", "brand", "patch",
  "tag", "the", "a", "symbol", "icon", "emblem", "script", "letters", "word", "wordmark", "on", "left", "right", "front",
]);
const NONE_WORDS = new Set(["none", "no logo", "no text", "nothing", "plain", "blank", "no"]);
const UNREADABLE_WORDS = new Set(["unreadable", "unclear", "illegible", "blurry", "unknown", "cant read"]);

/**
 * Logo text / brand from the model (untrusted) -> "nike" (a known brand), "text:<words>" (readable but not in the
 * list), "none" (no logo), "unreadable", or null (not reported).
 */
export function normalizeBrand(text: unknown): string | null {
  if (typeof text !== "string") return null;
  const t = text.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9& ]+/g, " ").replace(/\s+/g, " ").trim();
  if (t === "") return null;
  if (NONE_WORDS.has(t)) return "none";
  if (UNREADABLE_WORDS.has(t)) return "unreadable";
  let best: { id: string; len: number; pos: number } | null = null;
  const padded = ` ${t} `;
  for (const id of Object.keys(BRANDS).sort()) {
    for (const alias of BRANDS[id]!) {
      const pos = padded.indexOf(` ${alias} `);
      if (pos < 0) continue;
      if (!best || alias.length > best.len || (alias.length === best.len && pos < best.pos)) best = { id, len: alias.length, pos };
    }
  }
  if (best) return best.id;
  const rest = t.split(" ").filter((w) => !GENERIC_LOGO_WORDS.has(w)).join(" ").slice(0, 24).trim();
  return rest === "" ? "unreadable" : `text:${rest}`;
}
const isBrandValue = (b: string | null | undefined): b is string => !!b && b !== "none" && b !== "unreadable";
const isListedBrand = (b: string) => !b.startsWith("text:");

// ---------------------------------------------------------------- observations and profiles
/** What he told us for sure (the quick tap, "Not quite right?", the Closet editor). Beats anything the model reads. */
export interface ConfirmedFields {
  subcategory?: string;
  color_family?: string;
  pattern?: string;
  logo?: string;
  leg_shape?: string;
  sleeve_length?: SleeveLength;
  lightness?: Lightness;
  shoe_profile?: ShoeProfile;
  denim_wear?: DenimWear;
  /** A brand id from normalizeBrand(), or "none". */
  brand?: string;
  details?: Detail[];
  shadeKey?: ShadeKey;
  /** The shoe quick tap: he said "boots", not which boots (the subtype stays the model's or code's guess). */
  shoeKind?: ShoeKind;
}

/**
 * One sighting of a piece: the v3 garment plus the optional closet fields (all untrusted, all validated here).
 * A plain v3 Garment is a valid Observation (no closet fields: the matcher just has less to go on).
 */
export interface Observation extends Garment {
  /** 1-3 words from the model ("heather grey"); never shown, only parsed into a ShadeKey. */
  shade?: string | null;
  shadeKey?: ShadeKey | null;
  details?: string[] | null;
  logo_text?: string | null;
  brand?: string | null;
  sleeve_length?: string | null;
  lightness?: string | null;
  shoe_profile?: string | null;
  denim_wear?: string | null;
  /** CIE L* sampled from his (unblurred, on-phone) photo of this piece. */
  sampled_l?: number | null;
  sampled_hex?: string | null;
  /** The scene's lighting for this photo ("dim" softens a near-color miss). */
  lighting?: string | null;
  /** He confirmed these for this sighting. */
  userConfirmed?: ConfirmedFields | null;
  /** He said "No, a different one" to these items for this garment (this check). */
  notItemIds?: string[] | null;
  /** Half seen: under an outer layer, or small and soft in the frame (shoes). Its type and shape reads are shaky (#115). */
  partial?: boolean | null;
}

type CountField =
  | "subcategory" | "color_family" | "pattern" | "logo" | "leg_shape" | "sleeve_length" | "lightness" | "shoe_profile"
  | "denim_wear" | "brand" | "shade" | "category";
const COUNT_FIELDS: readonly CountField[] = [
  "subcategory", "color_family", "pattern", "logo", "leg_shape", "sleeve_length", "lightness", "shoe_profile",
  "denim_wear", "brand", "shade", "category",
];

/** An owned piece as the matcher sees it: counts over every sighting, plus what he confirmed. JSON-safe. */
export interface ItemProfile {
  id: string;
  /** Closet slot: top | bottom | shoes | outer. */
  slot: string;
  sightings: number;
  counts: Record<CountField, Record<string, number>>;
  volume: { sum: number; n: number };
  sampledL: { sum: number; n: number };
  /** Detail counts over the sightings that reported details at all. */
  details: { sightings: number; counts: Record<string, number> };
  confirmed: ConfirmedFields;
  /** Subcategories he confirmed are this item (a "Yes" to "Same as your black jeans?" on a sweatpants read). */
  aliases: string[];
  /** Items he said are different pieces. */
  distinctFrom: string[];
  /** Readings he said belong to this piece, per field ("Yes, same one" on a straight-leg read of his wide jeans). */
  fieldAliases: Record<string, string[]>;
}

export interface ProfileExtra {
  slot?: string;
  confirmed?: ConfirmedFields;
  aliases?: readonly string[];
  distinctFrom?: readonly string[];
  fieldAliases?: Readonly<Record<string, readonly string[]>>;
}

/** The validated, effective view of one observation. */
interface Obs {
  category: string | null;
  slot: string | null;
  subcategory: string | null;
  color: string | null;
  pattern: string | null;
  logo: string | null;
  volume: number | null;
  leg: string | null;
  sleeve: string | null;
  lightness: string | null;
  shoe: string | null;
  denim: string | null;
  brand: string | null;
  details: Set<string> | null;
  shade: ShadeKey | null;
  sampledL: number | null;
  dim: boolean;
  notItemIds: string[];
  partial: boolean;
  /** His shoe-kind answer for this sighting (null: not asked). */
  shoeKind: ShoeKind | null;
}

const str = (v: unknown): string | null => (typeof v === "string" && v !== "" ? v : null);
const oneOf = (v: unknown, list: readonly string[]): string | null => (typeof v === "string" && list.includes(v) ? v : null);
function legOf(v: unknown): string | null {
  const s = str(v);
  if (s === null) return null;
  const a = LEG_ALIAS[s] ?? s;
  return LEG_ORDER.includes(a) ? a : null;
}
function cleanShadeKey(k: unknown): ShadeKey | null {
  if (!k || typeof k !== "object") return null;
  const id = shadeId(k as ShadeKey);
  return id === null ? null : shadeFromId(id);
}
function cleanDetails(v: unknown): Set<string> | null {
  if (!Array.isArray(v)) return null;
  return new Set(v.filter((d): d is string => typeof d === "string" && (DETAILS as readonly string[]).includes(d)));
}

function readObs(o: Observation): Obs {
  const c = o.userConfirmed ?? {};
  const category = str(o.category);
  const brandFromModel = normalizeBrand(o.brand);
  let sampledL = typeof o.sampled_l === "number" && Number.isFinite(o.sampled_l) && o.sampled_l >= 0 && o.sampled_l <= 100 ? o.sampled_l : null;
  if (sampledL === null && typeof o.sampled_hex === "string") sampledL = lightnessOf(o.sampled_hex);
  return {
    category,
    slot: category !== null ? SLOT_TO_CLOSET[category] ?? null : null,
    subcategory: str(c.subcategory) ?? str(o.subcategory),
    color: str(c.color_family) ?? str(o.color_family),
    pattern: str(c.pattern) ?? str(o.pattern),
    logo: oneOf(c.logo, LOGOS) ?? oneOf(o.logo, LOGOS),
    volume: typeof o.volume === "number" && Number.isFinite(o.volume) ? o.volume : null,
    leg: legOf(c.leg_shape) ?? legOf(o.leg_shape),
    sleeve: oneOf(c.sleeve_length, SLEEVES) ?? oneOf(o.sleeve_length, SLEEVES),
    lightness: oneOf(c.lightness, LIGHTNESS) ?? oneOf(o.lightness, LIGHTNESS),
    shoe: oneOf(c.shoe_profile, SHOE_ORDER) ?? oneOf(o.shoe_profile, SHOE_ORDER),
    denim: oneOf(c.denim_wear, DENIM_WEAR) ?? oneOf(o.denim_wear, DENIM_WEAR),
    brand: (typeof c.brand === "string" && c.brand !== "" ? c.brand : null)
      ?? (isBrandValue(brandFromModel) ? brandFromModel : null) ?? normalizeBrand(o.logo_text) ?? brandFromModel,
    details: Array.isArray(c.details) ? cleanDetails(c.details) : cleanDetails(o.details),
    shade: cleanShadeKey(c.shadeKey) ?? cleanShadeKey(o.shadeKey) ?? parseShade(o.shade),
    sampledL,
    dim: o.lighting === "dim",
    notItemIds: Array.isArray(o.notItemIds) ? o.notItemIds.filter((x): x is string => typeof x === "string") : [],
    shoeKind: oneOf(c.shoeKind, SHOE_KINDS) as ShoeKind | null,
    partial: o.partial === true,
  };
}

function emptyCounts(): Record<CountField, Record<string, number>> {
  const out = {} as Record<CountField, Record<string, number>>;
  for (const f of COUNT_FIELDS) out[f] = {};
  return out;
}
const bump = (m: Record<string, number>, k: string | null) => { if (k !== null) m[k] = (m[k] ?? 0) + 1; };

/** Most common value; ties by value ascending (deterministic). */
function mode(m: Record<string, number>, keep: (k: string) => boolean = () => true): string | null {
  let best: string | null = null;
  for (const k of Object.keys(m).sort()) {
    if (!keep(k)) continue;
    if (best === null || m[k]! > m[best]!) best = k;
  }
  return best;
}

/** Build an item's profile from its sightings (oldest first) and what he confirmed. */
export function profileOf(id: string, observations: readonly Observation[], extra: ProfileExtra = {}): ItemProfile {
  const counts = emptyCounts();
  const volume = { sum: 0, n: 0 }, sampledL = { sum: 0, n: 0 };
  const details = { sightings: 0, counts: {} as Record<string, number> };
  let confirmed: ConfirmedFields = {};
  let firstSlot: string | null = null;
  for (const raw of observations) {
    const o = readObs(raw);
    firstSlot ??= o.slot;
    bump(counts.category, o.category);
    bump(counts.subcategory, o.subcategory);
    bump(counts.color_family, o.color);
    bump(counts.pattern, o.pattern);
    bump(counts.logo, o.logo);
    bump(counts.leg_shape, o.leg);
    bump(counts.sleeve_length, o.sleeve);
    bump(counts.lightness, o.lightness);
    bump(counts.shoe_profile, o.shoe);
    bump(counts.denim_wear, o.denim);
    bump(counts.brand, o.brand);
    bump(counts.shade, shadeId(o.shade));
    if (o.volume !== null) { volume.sum += o.volume; volume.n++; }
    if (o.sampledL !== null) { sampledL.sum += o.sampledL; sampledL.n++; }
    if (o.details !== null) {
      details.sightings++;
      for (const d of [...o.details].sort()) bump(details.counts, d);
    }
    if (raw.userConfirmed) confirmed = { ...confirmed, ...raw.userConfirmed };
  }
  confirmed = { ...confirmed, ...(extra.confirmed ?? {}) };
  return {
    id,
    slot: extra.slot ?? firstSlot ?? "",
    sightings: observations.length,
    counts, volume, sampledL, details, confirmed,
    aliases: [...new Set(extra.aliases ?? [])].sort(),
    distinctFrom: [...new Set(extra.distinctFrom ?? [])].sort(),
    fieldAliases: Object.fromEntries(
      Object.entries(extra.fieldAliases ?? {}).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => [k, [...new Set(v)].sort()]),
    ),
  };
}

const CONFIRMABLE: readonly string[] = [
  "subcategory", "color_family", "pattern", "logo", "leg_shape", "sleeve_length", "lightness", "shoe_profile", "denim_wear", "brand",
];
/** Stored history for one item (the V6 closet tables). */
export interface StoredProfile extends ProfileExtra {
  /** Extra sightings after the item's own garment. */
  observations?: readonly Observation[];
  /** Every sighting of the item, oldest first (the app's closet_observations rows). When non-empty these replace
   *  the item's own garment as the history, so the sighting that created the item isn't counted twice. */
  sightings?: readonly Observation[];
}

/**
 * A closet row as a profile: its garment is one sighting (plus any stored `observations`; or exactly `sightings`
 * when given), and the field names in `confirmedFields` become confirmed values.
 */
export function profileFromClosetItem(item: ClosetItem, extra: StoredProfile = {}): ItemProfile {
  const confirmed: Record<string, unknown> = {};
  for (const f of item.confirmedFields ?? []) {
    if (CONFIRMABLE.includes(f) && typeof item.garment[f] === "string") confirmed[f] = item.garment[f];
  }
  const history = extra.sightings && extra.sightings.length > 0
    ? extra.sightings
    : [item.garment as Observation, ...(extra.observations ?? [])];
  return profileOf(item.id, history, {
    slot: extra.slot ?? String(item.slot),
    confirmed: { ...(confirmed as ConfirmedFields), ...(extra.confirmed ?? {}) },
    aliases: extra.aliases ?? [],
    distinctFrom: extra.distinctFrom ?? [],
    fieldAliases: extra.fieldAliases ?? {},
  });
}

/** The item's value for a field: confirmed, else the most common sighting. */
function itemVal(p: ItemProfile, f: Exclude<CountField, "shade" | "category">): string | null {
  const c = (p.confirmed as Record<string, unknown>)[f];
  if (typeof c === "string") return f === "leg_shape" ? legOf(c) : c;
  return mode(p.counts[f]);
}
function itemShade(p: ItemProfile): ShadeKey | null {
  return cleanShadeKey(p.confirmed.shadeKey) ?? (mode(p.counts.shade) !== null ? shadeFromId(mode(p.counts.shade)!) : null);
}

// ---------------------------------------------------------------- identity
export interface IdentityReason { code: string; points: number }
export interface IdentityResult {
  score: number;
  /** Any veto = definitely a different piece. */
  vetoes: string[];
  /** Never "same" without asking, whatever the score. */
  capUnsure: boolean;
  reasons: IdentityReason[];
}

const STEP_INDEX: Readonly<Record<string, number>> = { light: 0, mid: 1, dark: 2 };
/** Measured L* (0–100) within this of the piece's average reads as the same lightness; this far apart, as different. */
const MEASURED_SAME = 6;
const MEASURED_FAR = 15;
/** Tops the model swaps when only a strip shows under a layer. */
const TOP_LOOKS: readonly string[] = ["tee", "graphic_tee", "long_sleeve_tee", "hoodie", "sweatshirt", "sweater"];

/** How strongly this sighting is this item. */
export function identity(obsIn: Observation, item: ItemProfile): IdentityResult {
  const o = readObs(obsIn);
  const vetoes: string[] = [];
  const reasons: IdentityReason[] = [];
  let capUnsure = false;
  const add = (code: string, points: number, cap = false) => { reasons.push({ code, points }); if (cap) capUnsure = true; };
  // Two readings he already said belong to this piece (a "Yes, same one" across them) cost nothing.
  const known = (f: string, a: string | null, b: string | null) =>
    a !== null && b !== null && (item.fieldAliases[f] ?? []).includes(a) && (item.fieldAliases[f] ?? []).includes(b);
  // He has confirmed this piece shows up as another top look when half seen (his hoodie under a shirt read as a tee).
  const layeredBefore = o.partial && o.subcategory !== null && TOP_LOOKS.includes(o.subcategory) && item.aliases.some((a) => TOP_LOOKS.includes(a));

  if (o.notItemIds.includes(item.id)) vetoes.push("said_different");

  // Slot and subcategory.
  const isub = itemVal(item, "subcategory");
  if (o.slot === null) vetoes.push("slot");
  else if (o.slot !== item.slot) {
    const swap = (o.slot === "top" && item.slot === "outer") || (o.slot === "outer" && item.slot === "top");
    if (swap && ((o.subcategory !== null && LAYERABLE.includes(o.subcategory)) || (isub !== null && LAYERABLE.includes(isub)))) add("layer_slot", 0);
    else vetoes.push("slot");
  }
  if (o.subcategory === null || isub === null) vetoes.push("subcategory");
  else if (o.subcategory !== isub && !item.aliases.includes(o.subcategory)) {
    // Shoes: his kind answer ("boots") beats the subtype the model or code guessed; "other" is an unknown type.
    const shoes = o.slot === "shoes";
    const ok = shoes ? o.shoeKind ?? shoeKindOf(o.subcategory) : null;
    const ik = shoes ? item.confirmed.shoeKind ?? shoeKindOf(isub) : null;
    const saidKind = o.shoeKind !== null || item.confirmed.shoeKind !== undefined;
    if (shoes && saidKind && ok !== null && ik !== null && ok !== ik) vetoes.push("shoe_kind");
    else if (shoes && o.shoeKind !== null && ok === ik) add("shoe_kind_confirmed", 0);
    else if (layeredBefore) add("seen_layered_before", 0);
    else if (isFlip(o.subcategory, isub)) add("subcategory_lookalike", o.partial ? -1 : -3, true);
    else if (shoes && ok !== null && ok === ik) add("shoe_same_kind", -1, true);
    else if (shoes && (o.subcategory === "other" || isub === "other")) add("shoe_type_unknown", 0, true);
    else if (o.partial) add("subcategory_half_seen", -2, true);
    else vetoes.push("subcategory");
  }

  // Color (the graph), shade words, lightness.
  const ic = itemVal(item, "color_family");
  const os = o.shade, is = itemShade(item);
  let colorD: 0 | 1 | 2 = 2;
  if (o.color === null || ic === null) add("color_unknown", 0, true);
  else {
    colorD = colorDistance(o.color, ic, { jeans: o.subcategory === "jeans" || isub === "jeans" });
    if (colorD === 2) vetoes.push("color");
    else if (colorD === 0) add("color_exact", 3);
    else if (os?.family === ic || is?.family === o.color) add("color_exact_by_shade", 3); // grey + "dark grey" vs charcoal
    else add("color_near", o.dim ? -1 : -2);
  }
  const il = itemVal(item, "lightness");
  let lightnessFired = false;
  if (o.lightness !== null && il !== null && o.lightness !== il && o.lightness !== "mid" && il !== "mid") {
    lightnessFired = true;
    const iL = item.sampledL.n > 0 ? item.sampledL.sum / item.sampledL.n : null;
    if (colorD >= 1 || (!o.partial && o.sampledL !== null && iL !== null && Math.abs(o.sampledL - iL) >= 25)) vetoes.push("lightness");
    else add("lightness_light_vs_dark", -3, true);
  }
  // Measured lightness (the on-phone sample, #104): steadier across photos than the shade words.
  const iLm = item.sampledL.n > 0 ? item.sampledL.sum / item.sampledL.n : null;
  if (o.sampledL !== null && iLm !== null && colorD < 2) {
    const dL = Math.abs(o.sampledL - iLm);
    if (dL <= MEASURED_SAME) add("measured_same", 1);
    else if (dL >= MEASURED_FAR) add("measured_far", o.partial ? -1 : -2);
  }
  if (os && is) {
    const fo = os.family ?? o.color, fi = is.family ?? ic;
    if (os.family !== null && is.family !== null && colorDistance(os.family, is.family, { jeans: true }) === 2 && colorD < 2) {
      add("shade_conflict", -3, true);
    } else if (os.step !== null && is.step !== null && fo !== null && fo === fi) {
      const gap = Math.abs(STEP_INDEX[os.step]! - STEP_INDEX[is.step]!);
      if (gap === 0) add("shade_same", 1);
      else if (gap === 1) add("shade_one_apart", -1);
      else if (!lightnessFired) add("shade_light_vs_dark", -3, true);
    }
  }

  // Brand (logo text) and the v3 logo size.
  const ib = typeof item.confirmed.brand === "string" ? item.confirmed.brand
    : mode(item.counts.brand, (k) => isBrandValue(k));
  const ibCount = typeof item.confirmed.brand === "string" ? Infinity : ib !== null ? item.counts.brand[ib] ?? 0 : 0;
  const iNone = item.confirmed.brand === "none" ? Infinity : ib === null ? item.counts.brand["none"] ?? 0 : 0;
  if (isBrandValue(o.brand)) {
    if (isBrandValue(ib)) {
      if (o.brand === ib) add("brand_match", 3);
      else if (isListedBrand(o.brand) && isListedBrand(ib)) vetoes.push("brand");
      else add("brand_text_differs", -3, true);
    } else if (iNone >= 2) add("brand_vs_no_logo", -4, true);
    else if (iNone === 1) add("brand_vs_no_logo_once", -2, true);
  } else if (o.brand === "none" && isBrandValue(ib) && !o.partial) {
    add(ibCount >= 2 ? "no_logo_vs_brand" : "no_logo_vs_brand_once", ibCount >= 2 ? -3 : -2, true);
  }
  const ilogo = itemVal(item, "logo");
  if (o.logo !== null && ilogo !== null && LOGOS.includes(ilogo)) {
    if (o.logo === ilogo) add("logo_same", 1);
    else if (o.logo !== "none" && ilogo !== "none") add("logo_size", -2);
    else if (o.logo === "large" || ilogo === "large") add("logo_none_vs_large", -3);
  }

  // Pattern.
  const ip = itemVal(item, "pattern");
  if (o.pattern !== null && ip !== null) {
    if (o.pattern === ip) add("pattern_same", 1);
    else if (STRONG_PATTERNS.includes(o.pattern) && STRONG_PATTERNS.includes(ip)) vetoes.push("pattern");
    else if (STRONG_PATTERNS.includes(o.pattern) || STRONG_PATTERNS.includes(ip)) add("pattern_vs_plain", -3);
    else if ((o.pattern === "graphic" && ip === "solid") || (o.pattern === "solid" && ip === "graphic")) add("graphic_vs_solid", -3);
  }

  // Shape.
  if (o.volume !== null && item.volume.n > 0 && Math.abs(o.volume - item.volume.sum / item.volume.n) >= 3) add("volume", -2);
  const ileg = itemVal(item, "leg_shape");
  if (o.leg !== null && ileg !== null && LEG_ORDER.includes(ileg)) {
    const gap = Math.abs(LEG_ORDER.indexOf(o.leg) - LEG_ORDER.indexOf(ileg));
    if (known("leg_shape", o.leg, ileg)) add("leg_known", 0);
    else if (gap >= 3) vetoes.push("leg_shape");
    else if (gap === 2) add("leg_two_steps", -2, true);
    else if (gap === 1) add("leg_one_step", -1);
  }
  const isl = itemVal(item, "sleeve_length");
  if (o.sleeve !== null && isl !== null && o.sleeve !== isl && !known("sleeve_length", o.sleeve, isl)) {
    if (o.partial) add("sleeve_half_seen", -1, true);
    else vetoes.push("sleeve_length");
  }
  const ishoe = itemVal(item, "shoe_profile");
  if (o.shoe !== null && ishoe !== null && SHOE_ORDER.includes(ishoe)) {
    const gap = Math.abs(SHOE_ORDER.indexOf(o.shoe) - SHOE_ORDER.indexOf(ishoe));
    if (known("shoe_profile", o.shoe, ishoe)) add("shoe_profile_known", 0);
    else if (gap >= 2) { if (o.partial) add("shoe_profile_half_seen", -2, true); else vetoes.push("shoe_profile"); }
    else if (gap === 1) add("shoe_profile_one_step", -2);
  }
  const iden = itemVal(item, "denim_wear");
  if (o.denim !== null && iden !== null && o.denim !== iden) {
    if ((o.denim === "ripped" && iden === "none") || (o.denim === "none" && iden === "ripped")) vetoes.push("denim_wear");
    else add("denim_wear", -1.5);
  }

  // Construction details (only when this sighting reported details).
  if (o.details !== null) {
    const cd = Array.isArray(item.confirmed.details) ? new Set<string>(item.confirmed.details) : null;
    const dS = item.details.sightings;
    const cnt = (d: string) => item.details.counts[d] ?? 0;
    const has = (d: string) => (cd ? cd.has(d) : dS > 0 && cnt(d) >= 1 && cnt(d) * 2 >= dS);
    const lacks = (d: string) => (cd ? !cd.has(d) : dS >= 1 && cnt(d) === 0);
    const established = (d: string) => (cd ? cd.has(d) : cnt(d) >= 2);
    const neverInTwo = (d: string) => (cd ? !cd.has(d) : dS >= 2 && cnt(d) === 0);
    const od = o.details;
    if ((od.has("full_zip") && has("front_pouch") && lacks("full_zip")) || (od.has("front_pouch") && !od.has("full_zip") && has("full_zip"))) {
      vetoes.push("zip_vs_pouch");
    }
    if ((od.has("full_zip") && has("half_zip") && lacks("full_zip")) || (od.has("half_zip") && has("full_zip") && lacks("half_zip"))) {
      vetoes.push("full_vs_half_zip");
    }
    if (od.has("hood") && neverInTwo("hood")) vetoes.push("hood");
    let shared = 0;
    for (const d of [...od].sort()) {
      if (established(d)) shared++;
      else if (neverInTwo(d) && d !== "hood") add(`detail_new:${d}`, -1.5);
    }
    if (shared > 0) add("details_shared", Math.min(3, shared));
    const knownDetails = cd ? [...cd] : Object.keys(item.details.counts);
    if (!o.partial) for (const d of knownDetails.sort()) if (established(d) && !od.has(d)) add(`detail_missing:${d}`, -0.5);
  }

  const score = reasons.reduce((s, r) => s + r.points, 0);
  return { score, vetoes: [...new Set(vetoes)], capUnsure, reasons };
}

// ---------------------------------------------------------------- what a "Yes, same one" teaches
/** Fields whose differing reads become aliases once he says two sightings are one piece. */
const LEARNED_FIELDS = ["leg_shape", "sleeve_length", "shoe_profile"] as const;

/**
 * After he says a sighting is this piece: its type read becomes an alias when it differs from the piece's type, and
 * every value of a shaky shape field seen across the piece's sightings and this one becomes a field alias, so the
 * same flip never asks again (his wide jeans read straight). Pure; returns the new aliases and field aliases.
 */
export function lessonsOfYes(
  itemSubcategory: string | null, sightings: readonly Observation[], answered: Observation,
  prev: { aliases?: readonly string[]; fieldAliases?: Readonly<Record<string, readonly string[]>> } = {},
): { aliases: string[]; fieldAliases: Record<string, string[]> } {
  const aliases = new Set(prev.aliases ?? []);
  const sub = readObs(answered).subcategory;
  if (sub !== null && itemSubcategory !== null && sub !== itemSubcategory) aliases.add(sub);
  const fieldAliases: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(prev.fieldAliases ?? {})) fieldAliases[k] = [...v];
  const all = [...sightings, answered].map(readObs);
  const valueOf: Record<(typeof LEARNED_FIELDS)[number], (o: Obs) => string | null> = {
    leg_shape: (o) => o.leg, sleeve_length: (o) => o.sleeve, shoe_profile: (o) => o.shoe,
  };
  for (const f of LEARNED_FIELDS) {
    const vals = new Set([...(fieldAliases[f] ?? []), ...all.map(valueOf[f]).filter((v): v is string => v !== null)]);
    if (vals.size > 1) fieldAliases[f] = [...vals].sort();
  }
  return { aliases: [...aliases].sort(), fieldAliases };
}

// ---------------------------------------------------------------- decide / reconcile
export const SAME_MIN = 4;
/** A half-seen sighting asks about its best candidate down to this score, instead of quietly becoming a new piece. */
export const PARTIAL_ASK_MIN = -4;
export const RUNNER_UP_GAP = 2;

export interface Decision {
  outcome: "same" | "new" | "ask";
  /** outcome "same": the item it is. */
  itemId?: string;
  /** outcome "ask": "Same as your <candidate>?" */
  candidateId?: string;
  /** outcome "ask": the next-best item to offer ("Or your ...?"). */
  runnerUpId?: string;
  /** The best non-vetoed item's score (null: every item vetoed, or an empty closet). */
  score: number | null;
}

function distinct(a: ItemProfile, b: ItemProfile): boolean {
  return a.distinctFrom.includes(b.id) || b.distinctFrom.includes(a.id);
}

/**
 * same: best score >= 4, not capped, and the runner-up more than 2 behind (or at least 1 behind when he has already
 * said those two items are different pieces).
 * ask:  a non-negative best that isn't a clear "same" (a near color, a look-alike subcategory, a hidden logo...).
 * new:  everything vetoed, or the best score is below 0. Items in `taken` (already matched in this check) are skipped.
 */
export function decide(obs: Observation, closet: readonly ItemProfile[], taken: ReadonlySet<string> = new Set()): Decision {
  const ranked = closet
    .filter((it) => !taken.has(it.id))
    .map((it) => ({ it, r: identity(obs, it) }))
    .filter((x) => x.r.vetoes.length === 0)
    .sort((a, b) => b.r.score - a.r.score || (a.it.id < b.it.id ? -1 : a.it.id > b.it.id ? 1 : 0));
  const best = ranked[0];
  if (!best) return { outcome: "new", score: null };
  const S = best.r.score;
  if (S < 0 && !(readObs(obs).partial && S >= PARTIAL_ASK_MIN)) return { outcome: "new", score: S };
  const runner = ranked[1];
  const clearOfRunner = !runner
    || (distinct(best.it, runner.it) ? runner.r.score <= S - 1 : runner.r.score < S - RUNNER_UP_GAP);
  if (S >= SAME_MIN && !best.r.capUnsure && clearOfRunner) return { outcome: "same", itemId: best.it.id, score: S };
  const d: Decision = { outcome: "ask", candidateId: best.it.id, score: S };
  if (runner && runner.r.score >= 0) d.runnerUpId = runner.it.id;
  return d;
}

export interface ReconcileEntry extends Decision {
  index: number;
  /** Settled toward the piece from the same outfit minutes ago (settleSameOutfit, #380). */
  sameOutfit?: boolean;
}

/**
 * Every garment of one check against the closet; each item goes to at most one garment (an asked-about item is
 * held for that garment too). The strongest decision is committed first (ties: lower index), so two identical
 * tees get one match and one new piece. Entries come back in input order.
 */
export function reconcile(observations: readonly Observation[], closet: readonly ItemProfile[]): ReconcileEntry[] {
  const taken = new Set<string>();
  const out: (ReconcileEntry | undefined)[] = observations.map(() => undefined);
  const rank = (d: Decision) => (d.outcome === "new" ? -Infinity : d.score ?? -Infinity);
  for (let round = 0; round < observations.length; round++) {
    let pickI = -1;
    let pickD: Decision | null = null;
    for (let i = 0; i < observations.length; i++) {
      if (out[i]) continue;
      const d = decide(observations[i]!, closet, taken);
      if (pickD === null || rank(d) > rank(pickD)) { pickI = i; pickD = d; }
    }
    if (pickD === null) break;
    const i = pickI, d = pickD;
    const id = d.itemId ?? d.candidateId;
    if (id) taken.add(id);
    out[i] = { index: i, ...d };
  }
  return out as ReconcileEntry[];
}

export interface ReadingReconcileEntry extends Decision {
  /** Settled toward the piece from the same outfit minutes ago (#380). */
  sameOutfit?: boolean;
  from: "garment" | "held";
  /** Index into reading.garments or reading.held_items. */
  index: number;
}

const CLOSET_CATEGORIES: readonly string[] = ["top", "bottom", "footwear", "outerwear"];

// ---------------------------------------------------------------- the same outfit, minutes ago (#380)
/** A piece the latest check minutes ago went to, with its measured lightness in that photo. */
export interface RecentPiece { itemId: string; sampledL: number | null }
export interface SameOutfit {
  /** The pieces of the latest check within the window (the app's: 15 minutes), one per garment. */
  recent: readonly RecentPiece[];
  /** Pieces of this check already linked outside this plan (his tap answers, a re-check's unchanged pieces). */
  linked?: readonly string[];
}
/** Pieces of this check that must go to the same pieces as that check before it counts as the same outfit: library
 *  picks a minute apart can be two different days (his Oct 18 dark tees, 32 s apart, measured 3 L* apart). */
export const SAME_OUTFIT_MIN = 2;
/** What "a different piece" means here: any veto but the color word and the lightness word, which flip between two
 *  photos of one piece (his grey suede chukkas read tan 12 s later; L* 10.7 vs 12.8). */
const SOFT_VETOES: readonly string[] = ["color", "lightness"];

/**
 * His light jeans went to "Light jeans" at 15:19 and to "Mid-wash jeans" a minute later in the same hoodie and shoes
 * (the color word flipped, the measured lightness didn't): the same outfit minutes apart is the strongest evidence
 * there is that a piece is the one he just wore. When at least SAME_OUTFIT_MIN other pieces of this check go to the
 * pieces the latest check had, a slot whose decision differs from that check's piece R is settled toward R when
 * nothing but the color or lightness word tells them apart and both photos were measured:
 *   - no confident match yet (new, or a question): within MEASURED_SAME L* it's R; within MEASURED_FAR, ask about R;
 *   - a confident match to another piece X: ask between R and X (never a silent move) when R has no veto at all and a
 *     score of 0 or more, or the two photos measured within MEASURED_SAME.
 * A different kind, brand, pattern, sleeve, zip or hood, or "No, a different one", is never crossed. Pure.
 */
/**
 * Could this sighting be piece R from the same outfit minutes ago, whose photo measured `recentL`? null when anything
 * but the color or lightness word tells them apart, or either photo wasn't measured; else how far apart the two
 * measured (`dL`, L*), whether that's the same measured shade (`sameL`, within MEASURED_SAME) or near (`nearL`, under
 * MEASURED_FAR), and `alike`: no veto at all and a score of 0 or more. Shared by the matcher and Closet's pair card.
 */
export function sameOutfitMatch(o: Observation, R: ItemProfile, recentL: number | null): { dL: number; sameL: boolean; nearL: boolean; alike: boolean; score: number } | null {
  const obs = readObs(o);
  const id = identity(o, R);
  if (id.vetoes.some((v) => !SOFT_VETOES.includes(v)) || obs.sampledL === null || recentL === null) return null;
  const dL = Math.abs(obs.sampledL - recentL);
  return { dL, sameL: dL <= MEASURED_SAME, nearL: dL < MEASURED_FAR, alike: id.vetoes.length === 0 && id.score >= 0, score: id.score };
}

function settleSameOutfit(
  entries: ReconcileEntry[], observations: readonly Observation[], closet: readonly ItemProfile[], same: SameOutfit,
): ReconcileEntry[] {
  const byId = new Map(closet.map((p) => [p.id, p]));
  const recentIds = new Set(same.recent.map((r) => r.itemId));
  const linked = new Set(same.linked ?? []);
  const idOf = (e: ReconcileEntry) => (e.outcome === "same" ? e.itemId ?? null : null);
  const out = entries.map((e) => ({ ...e }));
  out.forEach((e, k) => {
    const slot = readObs(observations[k]!).slot;
    const overlap = [...linked].filter((id) => recentIds.has(id)).length
      + out.filter((x, j) => j !== k && idOf(x) !== null && recentIds.has(idOf(x)!)).length;
    if (overlap < SAME_OUTFIT_MIN || slot === null) return;
    const taken = new Set(out.flatMap((x, j) => (j === k ? [] : [x.itemId, x.candidateId].filter((id): id is string => !!id))));
    const r = same.recent.find((x) => byId.get(x.itemId)?.slot === slot && !taken.has(x.itemId) && !linked.has(x.itemId));
    const R = r ? byId.get(r.itemId) : undefined;
    if (!r || !R || idOf(e) === R.id) return;
    const m = sameOutfitMatch(observations[k]!, R, r.sampledL);
    if (!m) return;
    if (e.outcome === "same" && e.itemId) {
      if (m.alike || m.sameL) out[k] = { index: e.index, outcome: "ask", candidateId: R.id, runnerUpId: e.itemId, score: m.score, sameOutfit: true };
    } else if (m.sameL) {
      out[k] = { index: e.index, outcome: "same", itemId: R.id, score: m.score, sameOutfit: true };
    } else if (m.nearL) {
      const runner = e.candidateId && e.candidateId !== R.id ? e.candidateId : undefined;
      out[k] = { index: e.index, outcome: "ask", candidateId: R.id, ...(runner ? { runnerUpId: runner } : {}), score: m.score, sameOutfit: true };
    }
  });
  return out;
}

/**
 * What closetPlan() will return once it wraps this engine: worn pieces then held pieces, each same / new / ask.
 * Accessories, traditional garments and unsure reads are skipped, as today. `profiles` adds stored sightings,
 * aliases and distinctFrom per item id (the V6 closet tables).
 */
export function reconcileReading(
  reading: Reading, closet: readonly ClosetItem[],
  profiles: Readonly<Record<string, StoredProfile>> = {}, same?: SameOutfit,
): ReadingReconcileEntry[] {
  const lighting = reading.scene?.lighting ?? null;
  const picked: { from: "garment" | "held"; index: number; obs: Observation }[] = [];
  const visit = (g: Garment, from: "garment" | "held", index: number) => {
    if (typeof g.category !== "string" || !CLOSET_CATEGORIES.includes(g.category) || g.certainty === "unsure") return;
    picked.push({ from, index, obs: { ...g, lighting: typeof lighting === "string" ? lighting : null } as Observation });
  };
  reading.garments.forEach((g, i) => visit(g, "garment", i));
  (reading.held_items ?? []).forEach((g, i) => visit(g, "held", i));
  const items = closet.map((it) => profileFromClosetItem(it, profiles[it.id] ?? {}));
  const obs = picked.map((p) => p.obs);
  const plan = same && same.recent.length > 0 ? settleSameOutfit(reconcile(obs, items), obs, items, same) : reconcile(obs, items);
  return plan.map((e, k) => {
    const { index: _i, ...d } = e;
    return { ...d, from: picked[k]!.from, index: picked[k]!.index };
  });
}

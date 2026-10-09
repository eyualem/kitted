// The closet's pure plumbing (DECISIONS-LOG #91): a stored sighting → the identity engine's Observation, an item's
// sightings → the engine's StoredProfile, and the display "art" an item shows (shade, details, brand), settled by
// the drift guard: what a piece looks like changes only when 2 newer sightings agree, or he confirms it. No UI or
// store imports, so the seed loader and tests use it directly.
import {
  colorDistance, displayHex, normalizeBrand, parseShade, shadeFromId, shadeId, shoeKindOf, type ConfirmedFields, type Garment,
  type KnownPiece, type Observation, type StoredProfile,
} from '@kitted/core';
import type { ClosetArt, ClosetFields, ClosetItemRow, ClosetObservationRow, ClosetProfile } from '@/data/types';

export const emptyProfile = (): ClosetProfile => ({ aliases: [], distinctFrom: [], confirmed: {} });
export const profileOfItem = (item: Pick<ClosetItemRow, 'profile'>): ClosetProfile => ({ ...emptyProfile(), ...(item.profile ?? {}) });

/** The engine's view of one sighting: the v3 garment, plus the closet call's fields when the piece was visible. */
export function observationOf(
  garment: Garment, closet: ClosetFields | null | undefined,
  extra: {
    lighting?: string | null; userConfirmed?: ConfirmedFields | null; sampledHex?: string | null; sampledL?: number | null;
    partial?: boolean; notItemIds?: readonly string[];
  } = {},
): Observation {
  const o: Observation = { ...garment };
  if (closet && closet.visible) {
    if (closet.shade) o.shade = closet.shade;
    if (closet.lightness) o.lightness = closet.lightness;
    o.details = [...closet.details];
    if (closet.logo_text) o.logo_text = closet.logo_text;
    if (closet.sleeve_length) o.sleeve_length = closet.sleeve_length;
    if (closet.shoe_profile) o.shoe_profile = closet.shoe_profile;
    if (closet.denim_wear) o.denim_wear = closet.denim_wear;
  }
  if (extra.lighting) o.lighting = extra.lighting;
  if (extra.userConfirmed && Object.keys(extra.userConfirmed).length > 0) o.userConfirmed = extra.userConfirmed;
  if (extra.sampledHex) o.sampled_hex = extra.sampledHex;
  if (typeof extra.sampledL === 'number') o.sampled_l = extra.sampledL;
  if (extra.partial) o.partial = true;
  if (extra.notItemIds && extra.notItemIds.length > 0) o.notItemIds = [...extra.notItemIds];
  return o;
}

export function observationOfRow(r: ClosetObservationRow): Observation {
  return observationOf(r.garment, r.closet, { userConfirmed: r.userConfirmed, sampledHex: r.sampledHex, sampledL: r.sampledL });
}

/**
 * Half seen (#115): a top under an outer layer worn in the same photo, or shoes the reading wasn't clear on. Its type
 * and shape reads are shaky, so the matcher asks about a near piece instead of splitting it off. Pure.
 */
export function halfSeen(garments: readonly Garment[], index: number): boolean {
  const g = garments[index];
  if (!g) return false;
  if (g.category === 'top') return garments.some((o, i) => i !== index && o.category === 'outerwear' && o.certainty !== 'unsure');
  if (g.category === 'footwear') return g.certainty !== 'clear';
  return false;
}

/** A measured crop this poor means the piece was mostly hidden or tiny in the frame (cropQuality, #104). */
export const LOW_CROP = 0.5;

/**
 * The half-seen flag the matcher gets. Shoes: the reading's own certainty (every full-body shoe crop is small, so
 * crop quality says nothing about them). Other pieces: the measured crop when the photo was measured (an open
 * jacket over a clearly visible shirt isn't half seen), else the outer-layer rule from `halfSeen`.
 */
export function isHalfSeen(piece: { garment: Garment; partial?: boolean }, measured?: { cropQuality: number | null } | null): boolean {
  if (piece.garment.category === 'footwear') return piece.partial === true;
  const q = measured?.cropQuality;
  return typeof q === 'number' ? q < LOW_CROP : piece.partial === true;
}

/** A sighting that counts for its item: not deleted, not undone, not waiting on the closet call. */
export const isLive = (o: ClosetObservationRow): boolean => !o.isDeleted && o.decision !== 'undone' && o.decision !== 'pending';

/** An item's counting sightings, oldest first (ties by id, so the order never depends on the store). */
export function sightingsOf(itemId: string, obs: readonly ClosetObservationRow[]): ClosetObservationRow[] {
  return obs.filter((o) => o.itemId === itemId && isLive(o)).sort((a, b) => a.createdAt - b.createdAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** The engine's stored history per item (core reconcileReading `profiles`). */
export function storedProfiles(items: readonly ClosetItemRow[], obs: readonly ClosetObservationRow[]): Record<string, StoredProfile> {
  const out: Record<string, StoredProfile> = {};
  for (const it of items) {
    const p = profileOfItem(it);
    out[it.id] = {
      sightings: sightingsOf(it.id, obs).map(observationOfRow),
      aliases: p.aliases, distinctFrom: p.distinctFrom, confirmed: p.confirmed, fieldAliases: p.fieldAliases ?? {},
    };
  }
  return out;
}

/** The closet a check is matched against: his pieces that are live (not undone, not merged into another). */
export const isOwned = (c: ClosetItemRow): boolean => !c.isDeleted && !c.mergedInto;

/** Sighting decisions that are his own answer: "Yes, same one", "No, a new one", "Not the same". */
const ANSWERED: readonly string[] = ['answeredSame', 'answeredNew', 'split'];

/**
 * The pieces the app is sure he owns, as they stood before the checks in `excludeCheckIds` (the check being asked
 * about, and its first check for a re-check): a check can't make its own pieces known. Known = he confirmed it (a
 * tap answer, a correction, an answer to "Same as your …?", a name he set, or he added it himself) or it was seen in
 * 2+ other checks. Sightings and answers from the excluded checks don't count. Sorted by id.
 */
export function knownPieces(
  items: readonly ClosetItemRow[], obs: readonly ClosetObservationRow[], opts: { excludeCheckIds?: readonly string[] } = {},
): KnownPiece[] {
  const exclude = new Set(opts.excludeCheckIds ?? []);
  const out: KnownPiece[] = [];
  for (const it of items) {
    if (!isOwned(it)) continue;
    const seen = sightingsOf(it.id, obs).filter((o) => o.fitCheckId === null || !exclude.has(o.fitCheckId));
    const p = profileOfItem(it);
    const selfAdded = it.source !== 'fitCheck';
    if (seen.length === 0 && !selfAdded) continue;
    const answered = seen.some((o) => ANSWERED.includes(o.decision) || Object.keys(o.userConfirmed ?? {}).length > 0);
    const confirmed = selfAdded || p.nameLocked === true || Object.keys(p.confirmed).length > 0 || answered;
    if (!confirmed && seen.length < 2) continue;
    const saidKind = p.confirmed.shoeKind ?? [...seen].reverse().find((o) => o.userConfirmed?.shoeKind)?.userConfirmed?.shoeKind ?? null;
    const sub = typeof it.garment.subcategory === 'string' ? it.garment.subcategory : null;
    out.push({
      id: it.id, slot: String(it.slot),
      colorFamily: typeof it.garment.color_family === 'string' ? it.garment.color_family : null,
      subcategory: sub, shoeKind: saidKind ?? shoeKindOf(sub), shoeKindSaid: saidKind !== null,
      name: it.name, confirmed, sightings: seen.length,
    });
  }
  return out.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

// ---------------------------------------------------------------- the drift guard

/**
 * The value to show from a run of sightings (oldest first; null = not reported): the first reported value, which
 * moves to another value only once 2 sightings after it agree on that one. `confirmed` wins outright.
 */
export function guarded<T extends string>(values: readonly (T | null | undefined)[], confirmed?: T | null): T | null {
  if (confirmed) return confirmed;
  let cur: T | null = null;
  let challengers: Record<string, number> = {};
  for (const v of values) {
    if (v === null || v === undefined) continue;
    if (cur === null) cur = v;
    else if (v !== cur) {
      challengers[v] = (challengers[v] ?? 0) + 1;
      if (challengers[v]! >= 2) {
        cur = v;
        challengers = {};
      }
    }
  }
  return cur;
}

const DENIM = new Set(['denim_light', 'denim_mid', 'denim_dark']);

/** What the tile and the name show for an item, from its sightings (or its own garment + closet fields). */
export function artOf(item: Pick<ClosetItemRow, 'garment' | 'confirmedFields' | 'profile'>, sightings: readonly Observation[]): ClosetArt {
  const conf = profileOfItem(item).confirmed;
  const g = item.garment;
  const confirmedColor = item.confirmedFields.includes('color_family') && typeof g.color_family === 'string' ? g.color_family : conf.color_family ?? null;
  const hist = sightings.length > 0 ? sightings : [g as Observation];
  const family = guarded(hist.map((o) => (typeof o.color_family === 'string' ? o.color_family : null)), confirmedColor)
    ?? (typeof g.color_family === 'string' ? g.color_family : null);
  // A shade only counts when it names this color or a neighbor ("dark grey" on a grey piece), never a far one.
  const shadeIds = hist.map((o) => {
    const k = parseShade(o.shade);
    if (!k) return null;
    if (k.family && family && k.family !== family && colorDistance(k.family, family, { jeans: DENIM.has(family) }) === 2) return null;
    return shadeId(k);
  });
  const confShade = conf.shadeKey ? shadeId(conf.shadeKey) : null;
  const shade = guarded(shadeIds, confShade);
  const brands = hist.map((o) => {
    const b = normalizeBrand(o.logo_text) ?? normalizeBrand(o.brand);
    return b === 'unreadable' ? null : b;
  });
  // A brand outside the known list ("text:…") counts only once 2 sightings read the same word. A listed brand read
  // once beats "no logo" reads: a logo hides under a layer, a hand or the phone far more often than it's misread (#115).
  const textCount: Record<string, number> = {};
  for (const b of brands) if (b && b.startsWith('text:')) textCount[b] = (textCount[b] ?? 0) + 1;
  const listedSeen = brands.some((b) => !!b && b !== 'none' && !b.startsWith('text:'));
  const brandVal = guarded(
    brands.map((b) => (b && b.startsWith('text:') && (textCount[b] ?? 0) < 2 ? null : listedSeen && b === 'none' ? null : b)),
    conf.brand ?? null,
  );
  const brand = brandVal && brandVal !== 'none' ? brandVal : null;
  const withDetails = hist.filter((o) => Array.isArray(o.details));
  let details: string[];
  if (Array.isArray(conf.details)) details = [...conf.details].sort();
  else {
    const counts: Record<string, number> = {};
    for (const o of withDetails) for (const d of new Set(o.details as string[])) counts[d] = (counts[d] ?? 0) + 1;
    details = Object.keys(counts).filter((d) => counts[d]! * 2 >= withDetails.length).sort();
  }
  const pick = <T extends string>(f: 'shoe_profile' | 'denim_wear', allowed: readonly string[], c?: string) =>
    guarded(hist.map((o) => (typeof o[f] === 'string' && allowed.includes(o[f] as string) ? (o[f] as T) : null)), (c as T) ?? null);
  const pattern = guarded(hist.map((o) => (typeof o.pattern === 'string' && o.pattern !== 'na' ? o.pattern : null)), conf.pattern ?? null);
  return {
    family,
    shade,
    details,
    brand,
    pattern,
    shoeProfile: pick<'sleek' | 'regular' | 'chunky'>('shoe_profile', ['sleek', 'regular', 'chunky'], conf.shoe_profile),
    denimWear: pick<'none' | 'faded' | 'ripped'>('denim_wear', ['none', 'faded', 'ripped'], conf.denim_wear),
  };
}

/** The tile color for an art: the exact shade inside its family band (core displayHex). */
export function hexOfArt(art: Pick<ClosetArt, 'family' | 'shade'>, fallback: string): string {
  if (!art.family) return fallback;
  return displayHex(art.family, art.shade ? shadeFromId(art.shade) : null);
}

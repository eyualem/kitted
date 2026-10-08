// The closet call's answer is untrusted text: every field is checked here before anything uses it. An entry
// whose index isn't one of the stubs (or repeats one) is dropped; a stub nobody described is "not seen".
// Boxes must be sane; shade and logo text must be a few plain words (rejected, never trimmed into shape).
import { DETAILS } from '@kitted/core';
import schemaV3 from '../../../assets/gemini/schema-v3.json';
import type { ClosetFields } from '@/data/types';
import type { ClosetReading, ClosetStub } from './types';

const ENUMS = (schemaV3 as { properties: { garments: { items: { properties: Record<string, { enum?: string[] }> } } } }).properties.garments.items.properties;
const CATEGORY: readonly string[] = ENUMS.category?.enum ?? [];
const SUBCATEGORY: readonly string[] = ENUMS.subcategory?.enum ?? [];
const COLOR: readonly string[] = ENUMS.color_family?.enum ?? [];
/** The pieces the closet call is asked about (the closet's slots). */
const CLOSET_CATEGORIES = ['top', 'outerwear', 'bottom', 'footwear'];

/**
 * The stub list for a reading: worn closet pieces (not unsure), in reading order, each field an enum value of the
 * v3 schema (a piece with any non-enum value is left out, so no free text ever reaches the prompt). `map[i]` is
 * the garment index stub i stands for. Shoe snaps ask about footwear only.
 */
export function buildStubs(garments: readonly { category?: unknown; subcategory?: unknown; color_family?: unknown; certainty?: unknown }[], kind: 'full' | 'recheck' | 'shoeSnap' = 'full') {
  const stubs: ClosetStub[] = [];
  const map: number[] = [];
  garments.forEach((g, index) => {
    const { category, subcategory, color_family } = g;
    if (typeof category !== 'string' || !CLOSET_CATEGORIES.includes(category) || g.certainty === 'unsure') return;
    if (kind === 'shoeSnap' && category !== 'footwear') return;
    if (!CATEGORY.includes(category) || typeof subcategory !== 'string' || !SUBCATEGORY.includes(subcategory)) return;
    if (typeof color_family !== 'string' || !COLOR.includes(color_family)) return;
    stubs.push({ i: stubs.length, category, subcategory, color_family });
    map.push(index);
  });
  return { stubs, map };
}

/** "[0] top · hoodie · grey" lines (closet_test.py stub_text). */
export function stubText(stubs: readonly ClosetStub[]): string {
  return stubs.map((s) => `[${s.i}] ${s.category} · ${s.subcategory} · ${s.color_family}`).join('\n');
}

const MIN_AREA = 0.002;
const MAX_AREA = 0.9;

/** [ymin, xmin, ymax, xmax] in 0–1000, a sane size (0.2%–90% of the frame); else []. */
export function cleanBox(v: unknown): number[] {
  if (!Array.isArray(v) || v.length !== 4 || !v.every((n) => typeof n === 'number' && Number.isInteger(n))) return [];
  const [y0, x0, y1, x1] = v as [number, number, number, number];
  if (!(y0 >= 0 && x0 >= 0 && y1 <= 1000 && x1 <= 1000 && y0 < y1 && x0 < x1)) return [];
  const area = ((y1 - y0) * (x1 - x0)) / 1e6;
  return area >= MIN_AREA && area <= MAX_AREA ? [y0, x0, y1, x1] : [];
}

/** Lowercase letters, spaces and hyphens; at most 3 words and 24 characters. */
export function cleanShade(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim().toLowerCase().replace(/\s+/g, ' ');
  if (t === '' || t.length > 24 || !/^[a-z -]+$/.test(t) || t.split(' ').length > 3) return null;
  return t;
}

/** [A-Za-z0-9 &'.-], at most 3 words and 20 characters; "none" and "unreadable" kept as such. */
export function cleanLogoText(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim().replace(/\s+/g, ' ');
  if (t === '') return null;
  const low = t.toLowerCase();
  if (low === 'none' || low === 'unreadable') return low;
  if (t.length > 20 || !/^[A-Za-z0-9 &'.-]+$/.test(t) || t.split(' ').length > 3) return null;
  return t;
}

const oneOf = <T extends string>(v: unknown, list: readonly T[]): T | null => (typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : null);

/** One entry's fields (without its index), or null when it isn't an object with a boolean `visible`. */
export function cleanFields(raw: unknown): ClosetFields | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.visible !== 'boolean') return null;
  if (!o.visible) {
    return { visible: false, box: [], shade: null, lightness: null, details: [], logo_text: null, sleeve_length: null, shoe_profile: null, denim_wear: null };
  }
  const details = Array.isArray(o.details)
    ? [...new Set(o.details.filter((d): d is string => typeof d === 'string' && (DETAILS as readonly string[]).includes(d)))].sort()
    : [];
  return {
    visible: true,
    box: cleanBox(o.box_2d ?? o.box),
    shade: cleanShade(o.shade),
    lightness: oneOf(o.lightness, ['light', 'mid', 'dark'] as const),
    details,
    logo_text: cleanLogoText(o.logo_text),
    sleeve_length: oneOf(o.sleeve_length, ['short', 'long', 'sleeveless'] as const),
    shoe_profile: oneOf(o.shoe_profile, ['sleek', 'regular', 'chunky'] as const),
    denim_wear: oneOf(o.denim_wear, ['none', 'faded', 'ripped'] as const),
  };
}

/**
 * The model's JSON → a ClosetReading for `n` stubs, or null when it's unusable (not the schema's shape, or no
 * entry survives while there was something to describe). Extras and repeats are dropped; entries keep stub order.
 */
export function validateClosetReading(raw: unknown, n: number): ClosetReading | null {
  if (!raw || typeof raw !== 'object' || !Array.isArray((raw as { garments?: unknown }).garments)) return null;
  const seen = new Set<number>();
  const out: ClosetReading['garments'] = [];
  for (const e of (raw as { garments: unknown[] }).garments) {
    const i = e && typeof e === 'object' ? (e as { i?: unknown }).i : undefined;
    if (typeof i !== 'number' || !Number.isInteger(i) || i < 0 || i >= n || seen.has(i)) continue;
    const f = cleanFields(e);
    if (!f) continue;
    seen.add(i);
    out.push({ i, ...f });
  }
  if (n > 0 && out.length === 0) return null;
  return { garments: out.sort((a, b) => a.i - b.i) };
}

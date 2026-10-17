// "Not sure" on a piece's Fit or Leg (09-ui-review §18, #316; founder, Oct 16: "how will we know and let the user
// correct?"). The reading's own certainty doesn't predict a flip (§18.2), so how sure the app is comes from repeats:
// a piece seen in 3+ checks whose readings fall in different groups the scores use is "Not sure".
//   - Tops and layers (Fit): roomy (volume 4–5) or not (3 or less). 4 vs 5 and 1 vs 2 never move a score.
//   - Bottoms but shorts (Leg): narrow (skinny, slim) · straight (straight, flare/bootcut) · loose (relaxed, wide,
//     barrel).
//   - Once he has set it (the piece page's pick, a "Not quite right?" correction), it's settled for good.
// Closet's To confirm holds at most one "How do your … fit?" card: the doubtful piece seen in the most checks. Skip
// keeps it quiet until a newer photo of that piece disagrees again. Nothing here moves a score. Pure.
import type { ClosetItemRow, ClosetObservationRow } from '@/data/types';
import { t, type StringKey } from '@/i18n/en';
import { isLive } from './profile';

export type DoubtField = 'fit' | 'leg';
/** The kv key of his skips (this phone only: a view setting, like closet.segment). */
export const FIT_SKIP_KEY = 'closet.fitSkip';
/** The fewest checks a piece needs before the app calls it "Not sure". */
export const DOUBT_MIN_CHECKS = 3;

export interface FitDoubt {
  field: DoubtField;
  /** The two groups seen most, each as its most common word: "slim", "wide". */
  a: string;
  b: string;
  /** Checks it was seen in. */
  checks: number;
  /** The group seen most (what a skip remembers). */
  group: string;
}

const NO_LEG: readonly string[] = ['shorts', 'athletic_shorts'];
const LEG_GROUP: Readonly<Record<string, string>> = {
  skinny: 'narrow', slim: 'narrow', straight: 'straight', flare_bootcut: 'straight', relaxed: 'loose', wide: 'loose', barrel: 'loose',
};
const GROUP_ORDER: readonly string[] = ['narrow', 'straight', 'loose', 'fitted', 'roomy'];
/** The word for a leg read (flare and barrel as the leg picker's nearest: the picker offers the five). */
const LEG_WORD: Readonly<Record<string, StringKey>> = {
  skinny: 'value.leg.skinny', slim: 'value.leg.slim', straight: 'value.leg.straight', flare_bootcut: 'value.leg.straight',
  relaxed: 'value.leg.relaxed', wide: 'value.leg.wide', barrel: 'value.leg.wide',
};
const FIT_WORD: Readonly<Record<number, StringKey>> = { 2: 'value.topFit.slim', 3: 'value.topFit.regular', 4: 'value.topFit.relaxed', 5: 'value.topFit.oversized' };

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Which row a piece could doubt: Fit for tops and layers, Leg for bottoms (not shorts), none for shoes. */
export function doubtField(item: Pick<ClosetItemRow, 'slot' | 'garment'>): DoubtField | null {
  if (item.slot === 'top' || item.slot === 'outer') return 'fit';
  if (item.slot === 'bottom' && !NO_LEG.includes(String(item.garment.subcategory))) return 'leg';
  return null;
}

/** He has said what it is: the piece page's pick or a "Not quite right?" correction (both list the field). */
export function isSettled(item: Pick<ClosetItemRow, 'confirmedFields' | 'profile'>, field: DoubtField): boolean {
  if (field === 'fit') return item.confirmedFields.includes('volume');
  return item.confirmedFields.includes('leg_shape') || typeof item.profile?.confirmed?.leg_shape === 'string';
}

/** One read: its group and its word, or null when the reading has none. */
function readOf(o: Pick<ClosetObservationRow, 'garment'>, field: DoubtField): { group: string; word: string } | null {
  if (field === 'fit') {
    const v = o.garment.volume;
    if (typeof v !== 'number' || !Number.isFinite(v)) return null;
    const n = v <= 2 ? 2 : v >= 5 ? 5 : Math.round(v);
    return { group: n >= 4 ? 'roomy' : 'fitted', word: lower(t(FIT_WORD[n]!)) };
  }
  const l = o.garment.leg_shape;
  if (typeof l !== 'string' || !LEG_GROUP[l]) return null;
  return { group: LEG_GROUP[l]!, word: lower(t(LEG_WORD[l]!)) };
}

/** Each check's newest live sighting of the piece (a re-check of the same photo counts once), oldest first. */
function perCheck(itemId: string, obs: readonly ClosetObservationRow[]): ClosetObservationRow[] {
  const latest = new Map<string, ClosetObservationRow>();
  for (const o of obs) {
    if (o.itemId !== itemId || !isLive(o) || o.origin === 'seed') continue;
    const k = o.fitCheckId ?? o.id;
    const prev = latest.get(k);
    if (!prev || o.createdAt > prev.createdAt || (o.createdAt === prev.createdAt && o.id > prev.id)) latest.set(k, o);
  }
  return [...latest.values()].sort((a, b) => a.createdAt - b.createdAt || (a.id < b.id ? -1 : 1));
}

function mostCommon(xs: readonly string[], order: readonly string[] = []): string | null {
  const n = new Map<string, number>();
  for (const x of xs) n.set(x, (n.get(x) ?? 0) + 1);
  const rank = (x: string) => (order.includes(x) ? order.indexOf(x) : order.length);
  return [...n.keys()].sort((a, b) => n.get(b)! - n.get(a)! || rank(a) - rank(b) || (a < b ? -1 : 1))[0] ?? null;
}

/** Is the piece's Fit or Leg "Not sure"? null when it isn't (or he has set it). */
export function fitDoubt(item: Pick<ClosetItemRow, 'id' | 'slot' | 'garment' | 'confirmedFields' | 'profile'>, obs: readonly ClosetObservationRow[]): FitDoubt | null {
  const field = doubtField(item);
  if (!field || isSettled(item, field)) return null;
  const checks = perCheck(item.id, obs);
  if (checks.length < DOUBT_MIN_CHECKS) return null;
  const reads = checks.map((o) => readOf(o, field)).filter((r): r is { group: string; word: string } => r !== null);
  const groups = [...new Set(reads.map((r) => r.group))];
  if (groups.length < 2) return null;
  const counts = new Map(groups.map((g) => [g, reads.filter((r) => r.group === g).length]));
  const top = [...groups].sort((x, y) => counts.get(y)! - counts.get(x)! || GROUP_ORDER.indexOf(x) - GROUP_ORDER.indexOf(y));
  const wordOf = (g: string) => mostCommon(reads.filter((r) => r.group === g).map((r) => r.word))!;
  // the two named in the narrow-to-loose (fitted-to-roomy) order, so "slim and wide", never "wide and slim"
  const [g1, g2] = [top[0]!, top[1]!].sort((x, y) => GROUP_ORDER.indexOf(x) - GROUP_ORDER.indexOf(y));
  return { field, a: wordOf(g1!), b: wordOf(g2!), checks: checks.length, group: top[0]! };
}

/** "Seen as slim and as wide." */
export const doubtSeen = (d: FitDoubt): string => t('closet.unsure.seen', { a: d.a, b: d.b });
/** The piece page's line under a "Not sure" row: "Seen as slim and as wide. Which is it?" */
export const doubtLine = (d: FitDoubt): string => `${doubtSeen(d)} ${t('closet.unsure.which')}`;
/** The To confirm card's question: "How do your mid-wash jeans fit?" (Leg: a pair) / "How does your black tee fit?" */
export function doubtQuestion(d: FitDoubt, name: string): string {
  const item = name.charAt(0).toLowerCase() + name.slice(1);
  return d.field === 'leg' ? t('closet.unsure.askLeg', { item }) : t('closet.unsure.askFit', { item });
}

// ---- skips (kv FIT_SKIP_KEY): { [itemId]: { at, group } }

export type FitSkips = Record<string, { at: number; group: string }>;

export function parseSkips(raw: string | null | undefined): FitSkips {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as unknown;
    if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
    const out: FitSkips = {};
    for (const [k, s] of Object.entries(v as Record<string, unknown>)) {
      const o = s as { at?: unknown; group?: unknown };
      if (o && typeof o.at === 'number' && typeof o.group === 'string') out[k] = { at: o.at, group: o.group };
    }
    return out;
  } catch {
    return {};
  }
}

/** The skips after Skip on this piece's card (the time it was skipped, and the group it was seen as most). */
export function withSkip(skips: FitSkips, itemId: string, d: FitDoubt, at: number): string {
  return JSON.stringify({ ...skips, [itemId]: { at, group: d.group } });
}

/** Skipped, and no photo of it since then disagrees with what it was seen as most. */
function quiet(item: Pick<ClosetItemRow, 'id'>, field: DoubtField, obs: readonly ClosetObservationRow[], skips: FitSkips): boolean {
  const s = skips[item.id];
  if (!s) return false;
  return !perCheck(item.id, obs).some((o) => o.createdAt > s.at && (readOf(o, field)?.group ?? s.group) !== s.group);
}

/** The one piece the To confirm card asks about: the doubtful piece seen in the most checks (then the newest), or null. */
export function fitCard(
  items: readonly ClosetItemRow[], obs: readonly ClosetObservationRow[], skips: FitSkips,
): { item: ClosetItemRow; doubt: FitDoubt } | null {
  let best: { item: ClosetItemRow; doubt: FitDoubt; last: number } | null = null;
  for (const item of items) {
    const doubt = fitDoubt(item, obs);
    if (!doubt || quiet(item, doubt.field, obs, skips)) continue;
    const last = Math.max(...perCheck(item.id, obs).map((o) => o.createdAt));
    if (!best || doubt.checks > best.doubt.checks || (doubt.checks === best.doubt.checks && (last > best.last || (last === best.last && item.id < best.item.id)))) {
      best = { item, doubt, last };
    }
  }
  return best ? { item: best.item, doubt: best.doubt } : null;
}

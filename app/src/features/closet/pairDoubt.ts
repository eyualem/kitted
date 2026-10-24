// "Are these one piece?" (09-ui-review §29, #380): two pieces of one slot the closet split from one thing he owns,
// offered as one card in Closet's To confirm. His Oct 24 closet had his light jeans twice ("Light jeans" and
// "Mid-wash jeans", the color word flipping) and his grey chukkas twice (read tan 12 s later). Code never merges them:
// Yes folds them with the piece page's own merge (Undo), No keeps them apart for good, Skip hides the card until a
// newer photo of either. Two kinds of evidence, both the matcher's own:
//   - minutes: a check went to one and a check within SAME_OUTFIT_MS went to the other, the two had 2+ other pieces in
//     common, and core sameOutfitMatch says nothing but the color word tells them apart (the measured shade within
//     MEASURED_SAME, or no veto at all);
//   - alike: one's photo is a confident match for the other (no veto, nothing unsure, score ≥ SAME_MIN: what the
//     matcher calls "same" once both exist).
// Never a piece waiting on an answer, never two he said are different, never across slots (top ↔ layer isn't a
// merge the app has, #315). Nothing here moves a score. Pure.
import { identity, profileFromClosetItem, SAME_MIN, SAME_OUTFIT_MIN, sameOutfitMatch, type ClosetItem, type ItemProfile } from '@kitted/core';
import type { ClosetItemRow, ClosetObservationRow, FitCheckRow } from '@/data/types';
import { isAwaitingAnswer, isLive, isOwned, observationOfRow, storedProfiles } from './profile';

/** The kv key of his skips (this phone only, like closet.fitSkip): pair key → the newest sighting when he skipped. */
export const PAIR_SKIP_KEY = 'closet.pairSkip';
/** "The same outfit" for the closet (closet service SAME_OUTFIT_MS): 15 minutes. */
const MINUTES_MS = 15 * 60_000;

export interface PairCard {
  /** The piece kept on Yes (more wears; on a tie the older). */
  keep: ClosetItemRow;
  /** The piece folded into it. */
  fold: ClosetItemRow;
  why: 'minutes' | 'alike';
  /** For skips: "idA|idB" (sorted). */
  key: string;
  /** The newest sighting of either, ms. */
  newest: number;
}

export const pairKey = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`);

export function parsePairSkips(raw: string | null | undefined): Record<string, number> {
  try {
    const v = raw ? (JSON.parse(raw) as unknown) : null;
    return v && typeof v === 'object' ? (v as Record<string, number>) : {};
  } catch {
    return {};
  }
}

const distinct = (a: ClosetItemRow, b: ClosetItemRow) => !!a.profile?.distinctFrom?.includes(b.id) || !!b.profile?.distinctFrom?.includes(a.id);

/** Every pair the evidence offers, best first (minutes before alike, then the most worn). */
export function pairDoubts(all: readonly ClosetItemRow[], obsAll: readonly ClosetObservationRow[], checks: readonly FitCheckRow[]): PairCard[] {
  const owned = all.filter(isOwned);
  const items = owned.filter((c) => !isAwaitingAnswer(c, owned));
  const obs = obsAll.filter(isLive);
  const sp = storedProfiles(items, obs);
  const prof = new Map<string, ItemProfile>(items.map((c) => [c.id, profileFromClosetItem(c as unknown as ClosetItem, sp[c.id] ?? {})]));
  const at = new Map(checks.map((r) => [r.id, r.createdAt]));
  // Each check's pieces (its live sightings), for "2+ other pieces in common".
  const piecesOf = new Map<string, Set<string>>();
  for (const o of obs) if (o.fitCheckId) (piecesOf.get(o.fitCheckId) ?? piecesOf.set(o.fitCheckId, new Set()).get(o.fitCheckId)!).add(o.itemId);
  const sightings = (id: string) => obs.filter((o) => o.itemId === id);
  const out: PairCard[] = [];
  for (const a of items) {
    for (const b of items) {
      if (a.id >= b.id || a.slot !== b.slot || distinct(a, b)) continue;
      const sa = sightings(a.id), sb = sightings(b.id);
      if (sa.length === 0 || sb.length === 0) continue;
      const minutes = [[sa, sb, a], [sb, sa, b]].some(([xs, ys, x]) => (ys as ClosetObservationRow[]).some((y) => (xs as ClosetObservationRow[]).some((xo) => {
        const tx = at.get(xo.fitCheckId ?? ''), ty = at.get(y.fitCheckId ?? '');
        if (tx === undefined || ty === undefined || xo.fitCheckId === y.fitCheckId || Math.abs(tx - ty) > MINUTES_MS) return false;
        const px = piecesOf.get(xo.fitCheckId!) ?? new Set(), py = piecesOf.get(y.fitCheckId!) ?? new Set();
        const common = [...px].filter((id) => id !== a.id && id !== b.id && py.has(id)).length;
        if (common < SAME_OUTFIT_MIN) return false;
        const m = sameOutfitMatch(observationOfRow(y), prof.get((x as ClosetItemRow).id)!, xo.sampledL);
        return !!m && (m.sameL || m.alike);
      })));
      const alike = !minutes && [[sb, a], [sa, b]].some(([ys, x]) => (ys as ClosetObservationRow[]).some((y) => {
        const r = identity(observationOfRow(y), prof.get((x as ClosetItemRow).id)!);
        return r.vetoes.length === 0 && !r.capUnsure && r.score >= SAME_MIN;
      }));
      if (!minutes && !alike) continue;
      const [keep, fold] = a.wornCount > b.wornCount || (a.wornCount === b.wornCount && a.addedAt <= b.addedAt) ? [a, b] : [b, a];
      out.push({ keep, fold, why: minutes ? 'minutes' : 'alike', key: pairKey(a.id, b.id), newest: Math.max(...[...sa, ...sb].map((o) => o.createdAt)) });
    }
  }
  return out.sort((x, y) => (x.why === y.why ? 0 : x.why === 'minutes' ? -1 : 1) || y.keep.wornCount + y.fold.wornCount - (x.keep.wornCount + x.fold.wornCount));
}

/** The one pair card To confirm shows, or null: the best pair he hasn't skipped since its newest photo. */
export function pairCard(
  all: readonly ClosetItemRow[], obsAll: readonly ClosetObservationRow[], checks: readonly FitCheckRow[], skips: Readonly<Record<string, number>>,
): PairCard | null {
  return pairDoubts(all, obsAll, checks).find((p) => !(skips[p.key] !== undefined && skips[p.key]! >= p.newest)) ?? null;
}

export function withPairSkip(skips: Readonly<Record<string, number>>, p: Pick<PairCard, 'key' | 'newest'>): string {
  return JSON.stringify({ ...skips, [p.key]: p.newest });
}

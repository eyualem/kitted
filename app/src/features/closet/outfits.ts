// The Closet's Outfits (09-ui-review §13, #307; approved #84, #87; 02 D15). Pure: every top + bottoms + shoes he owns
// that core's `outfitValid` lets through, each scored by the parts engine (today's scoring) on `outfitReading`, at an
// occasion. A layer joins a trio only when it raises that score by LAYER_GAIN or more, so layers never multiply the
// count. The count is the trios rated Put together (7.0+) at Everyday, leaving out pieces he only mentioned in chat.
// Worn = a scored fit check whose pieces include the whole trio: those are "Your go-tos" (his photo, the check's real
// score); the rest are "Try next", best first, never showing a score. No AI: free on every plan, and no score moves.
import { defaultRubric, outfitReading, outfitValid, scoreParts, type ClosetItem, type Styles } from '@kitted/core';
import type { ClosetItemRow, FitCheckRow, OccasionKey } from '@/data/types';
import { isAwaitingAnswer, isOwned } from '@/features/closet/profile';
import { scoreOptions } from '@/features/fitcheck/scoring';
import { STARTER } from '@/features/finish/starter';
import { t } from '@/i18n/en';

/** Put together and up (02 score words). */
export const PUT_TOGETHER = 7.0;
/** A layer joins a trio only when it lifts the score this much (#84.3: layers never multiply). */
export const LAYER_GAIN = 0.5;
/** Most outfits a list shows. */
export const MAX_LIST = 20;
/** Layers are tried on this many of the best trios (enough to fill a list; layers never change the count). */
export const LAYER_TRY = 40;
/** The Outfits view opens first once he can make this many (#87). */
export const OPEN_ON_OUTFITS = 3;
/** His last Pieces | Outfits tap in Closet (kv, #87). */
export const SEGMENT_KEY = 'closet.segment';
/** The occasions the Outfits view offers (the morning card's day list). */
export const OUTFIT_OCCASIONS: readonly OccasionKey[] = ['everyday', 'class', 'date', 'going_out', 'interview', 'event'];

export interface Outfit {
  /** top, bottoms, shoes, then the layer if one joined: display order is the standing outfit's (layer at the side). */
  itemIds: string[];
  /** top+bottom+shoes ids, sorted: the same trio is one outfit. */
  key: string;
  layerId: string | null;
  /** Ranking only: never shown for an unworn outfit (#84.4). */
  rank: number;
  /** The dressiness of the trio (core formality, averaged): Goes with's roles. */
  dressiness: number;
  /** A plain line from the scoring's own reasons, never blank (#87). */
  reason: string;
  /** When worn: the check that wore it (the best score), its score and photo. */
  worn: { checkId: string; score: number; photoFile: string | null; demoPhotoId: string | null } | null;
}

const asItem = (c: ClosetItemRow) => c as unknown as ClosetItem;
const capital = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** The pieces outfits may use: his own, not waiting on "Same as your …?". */
export function outfitPieces(closet: readonly ClosetItemRow[]): ClosetItemRow[] {
  const owned = closet.filter(isOwned);
  return owned.filter((c) => !isAwaitingAnswer(c, owned)).sort((a, b) => (a.id < b.id ? -1 : 1));
}

function scoreOf(items: readonly ClosetItemRow[], occasion: OccasionKey, styles: Styles | null) {
  const r = scoreParts(outfitReading(items.map(asItem)), scoreOptions({ occasion, styles: styles ?? [], boldness: null, secondLook: null }));
  return r.overall === null ? null : r;
}

/** The scoring's best positive reason ("A tucked or short top gives it a waist."), else the plain fallback. */
function reasonOf(r: NonNullable<ReturnType<typeof scoreOf>>): string {
  let best: { points: number; line: string } | null = null;
  for (const part of Object.values(r.parts)) {
    for (const x of part?.reasons ?? []) if (x.points > 0 && x.line && (!best || x.points > best.points)) best = x;
  }
  if (!best) return t('closet.outfits.reasonPlain');
  const line = capital(best.line.trim());
  return /[.!?]$/.test(line) ? line : `${line}.`;
}

export interface OutfitInput {
  closet: readonly ClosetItemRow[];
  checks: readonly FitCheckRow[];
  styles: Styles | null;
  occasion: OccasionKey;
  /** Goes with on a layer's page: every trio worn with this layer (when it's valid and still Put together). */
  withLayer?: string;
  /** Count only: no layers tried (they never change the count). */
  countOnly?: boolean;
}

/** Every outfit at this occasion, best first (worn ones carry their check). Trios below Put together are left out. */
export function buildOutfits(i: OutfitInput): Outfit[] {
  const pieces = outfitPieces(i.closet);
  const by = (slot: string) => pieces.filter((c) => c.slot === slot);
  const tops = by('top'), bottoms = by('bottom'), shoes = by('shoes'), layers = by('outer');
  const worn = wornTrios(i.checks);
  // Pass 1: every valid trio at Put together or better.
  const trios: { trio: ClosetItemRow[]; r: NonNullable<ReturnType<typeof scoreOf>> }[] = [];
  for (const top of tops) for (const bottom of bottoms) for (const shoe of shoes) {
    const trio = [top, bottom, shoe];
    if (!outfitValid(trio.map(asItem), i.styles)) continue;
    const r = scoreOf(trio, i.occasion, i.styles);
    if (r && r.overall >= PUT_TOGETHER) trios.push({ trio, r });
  }
  trios.sort((a, b) => b.r.rawScore - a.r.rawScore);
  // Pass 2: a layer for the best LAYER_TRY (or the one layer Goes with asked for, on every trio).
  const out: Outfit[] = [];
  trios.forEach(({ trio, r: base }, idx) => {
    let best = { r: base, layer: null as ClosetItemRow | null };
    const tryLayer = (layer: ClosetItemRow) => {
      const items = [layer, ...trio];
      return outfitValid(items.map(asItem), i.styles) ? scoreOf(items, i.occasion, i.styles) : null;
    };
    if (i.withLayer) {
      const layer = layers.find((c) => c.id === i.withLayer);
      const r = layer ? tryLayer(layer) : null;
      if (!layer || !r || r.overall < PUT_TOGETHER) return;
      best = { r, layer };
    } else if (!i.countOnly && idx < LAYER_TRY) {
      for (const layer of layers) {
        const r = tryLayer(layer);
        if (r && r.overall >= best.r.overall + LAYER_GAIN && r.overall >= base.overall + LAYER_GAIN) best = { r, layer };
      }
    }
    const key = trio.map((c) => c.id).sort().join('+');
    const dressiness = trio.reduce((s, c) => s + defaultRubric.formality(c.garment), 0) / trio.length;
    out.push({
      itemIds: [...trio.map((c) => c.id), ...(best.layer ? [best.layer.id] : [])], key, layerId: best.layer?.id ?? null,
      rank: best.r.rawScore, dressiness, reason: reasonOf(best.r), worn: worn.get(key) ?? null,
    });
  });
  return out.sort((a, b) => b.rank - a.rank || (a.key < b.key ? -1 : 1));
}

/** The trios his scored checks wore (all three pieces in the check), the best score for each. */
export function wornTrios(checks: readonly FitCheckRow[]): Map<string, NonNullable<Outfit['worn']>> {
  const out = new Map<string, NonNullable<Outfit['worn']>>();
  for (const c of checks) {
    if (c.status !== 'scored' || c.score === null || c.details.removedFromLookbook) continue;
    const ids = [...new Set(c.itemIds)];
    // Every trio the check's pieces make (a check holds one top, bottom and shoes, sometimes two tops: each counts).
    for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) for (let d = b + 1; d < ids.length; d++) {
      const key = [ids[a]!, ids[b]!, ids[d]!].sort().join('+');
      const prev = out.get(key);
      if (!prev || c.score > prev.score) out.set(key, { checkId: c.id, score: c.score, photoFile: c.photoFile, demoPhotoId: c.demoPhotoId });
    }
  }
  return out;
}

/** The count (#84.3): trios at 7.0+ at Everyday, leaving out pieces he only mentioned in chat (07 §4). */
export function outfitCount(closet: readonly ClosetItemRow[], checks: readonly FitCheckRow[], styles: Styles | null): number {
  return buildOutfits({ closet: closet.filter((c) => c.source !== 'chat'), checks, styles, occasion: 'everyday', countOnly: true }).length;
}

/** The two lists the Outfits view shows (#84): Try next (unworn, best first) and Your go-tos (worn, best first). */
export function outfitLists(all: readonly Outfit[]): { tryNext: Outfit[]; goTos: Outfit[] } {
  return { tryNext: all.filter((o) => !o.worn).slice(0, MAX_LIST), goTos: all.filter((o) => !!o.worn).slice(0, MAX_LIST) };
}

/** Which segment Closet opens on (#87): his last tap, else Outfits once he can make OPEN_ON_OUTFITS. */
export function openingSegment(count: number, remembered: string | null): 'pieces' | 'outfits' {
  if (remembered === 'pieces' || remembered === 'outfits') return remembered;
  return count >= OPEN_ON_OUTFITS ? 'outfits' : 'pieces';
}

/** 'other': the next best filling a role nothing fits (no label: it isn't really dressier or more relaxed). */
export type GoesWithRole = 'best' | 'dressier' | 'relaxed' | 'other';

/**
 * Goes with (#87): up to 3 outfits with this piece: the best, then the dressiest of the rest above it, then the most
 * relaxed below it; when a role has no outfit, the next best fills it. None when the piece makes no outfit.
 */
export function goesWith(itemId: string, all: readonly Outfit[]): { role: GoesWithRole; outfit: Outfit }[] {
  // (For a layer, pass the list built `withLayer` it: a layer only joins the general list when it lifts the score.)
  const mine = all.filter((o) => o.itemIds.includes(itemId));
  if (mine.length === 0) return [];
  const best = mine[0]!;
  const rest = mine.slice(1);
  const out: { role: GoesWithRole; outfit: Outfit }[] = [{ role: 'best', outfit: best }];
  const take = (o: Outfit | undefined, role: GoesWithRole) => {
    if (o && !out.some((x) => x.outfit.key === o.key)) out.push({ role, outfit: o });
  };
  const dressier = rest.filter((o) => o.dressiness > best.dressiness).sort((a, b) => b.dressiness - a.dressiness || b.rank - a.rank)[0];
  const relaxed = rest.filter((o) => o.dressiness < best.dressiness).sort((a, b) => a.dressiness - b.dressiness || b.rank - a.rank)[0];
  take(dressier, 'dressier');
  take(relaxed, 'relaxed');
  // A role nothing fits: the next best fills the slot (#87), labelled by what it really is.
  for (const o of rest) {
    if (out.length >= 3) break;
    take(o, o.dressiness > best.dressiness ? 'dressier' : o.dressiness < best.dressiness ? 'relaxed' : 'other');
  }
  return out.slice(0, 3);
}

export type SlotState = { slot: 'top' | 'bottom' | 'shoes'; have: boolean };

/** No outfits yet (#88): which of top, bottoms and shoes he has. */
export function slotChecklist(closet: readonly ClosetItemRow[]): SlotState[] {
  const pieces = outfitPieces(closet);
  return (['top', 'bottom', 'shoes'] as const).map((slot) => ({ slot, have: pieces.some((c) => c.slot === slot) }));
}

/**
 * "Add shoes and you'd have {n} outfits" (#88): the count with the Starter piece for that slot added (the one that adds
 * the most). 0 when no Starter piece for it would make one.
 */
export function gainForSlot(closet: readonly ClosetItemRow[], checks: readonly FitCheckRow[], styles: Styles | null, slot: SlotState['slot']): number {
  const own = closet.filter((c) => c.source !== 'chat');
  let best = 0;
  for (const e of STARTER) {
    if (e.slot !== slot || !e.pick) continue;
    const ghost = { id: `__starter-${e.id}`, name: e.pick.name, slot, garment: e.pick.garment, isDeleted: false, mergedInto: null, maybeSameAs: null, source: 'added', profile: { aliases: [], distinctFrom: [], confirmed: {} } } as unknown as ClosetItemRow;
    best = Math.max(best, outfitCount([...own, ghost], checks, styles));
  }
  return best;
}

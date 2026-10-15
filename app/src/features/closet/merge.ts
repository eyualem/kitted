// Merging duplicates on the piece page (09-ui-review §1 item 10, §6.3; #280). On a piece's page, "Same as another
// piece…" opens a picker of his other pieces in the same slot (top, bottom, shoes or layer; never itself, never one
// still waiting on his "Same as your …?" answer); picking one asks once, then the closet service folds this piece into
// the chosen one (every sighting moves, the worn counts combine with a shared look counted once, the two are never
// asked about again) and a toast offers Undo, which puts both back exactly. Scores never change: a merge only moves
// closet rows. Pure helpers plus the flow, with its confirm, merge and toast injected (pieceActions wires the real ones).
import type { ClosetItemRow, ClosetObservationRow, ClosetSummary } from '@/data/types';
import { t } from '@/i18n/en';
import { isAwaitingAnswer, isOwned } from './profile';

const lower = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

/** The pieces the Closet grid shows: his own, minus the ones waiting on an answer (they live in their question card, #116). Newest first. */
export function closetGridItems(all: readonly ClosetItemRow[]): ClosetItemRow[] {
  const owned = all.filter(isOwned);
  return owned.filter((c) => !isAwaitingAnswer(c, owned)).sort((a, b) => b.addedAt - a.addedAt || (a.id < b.id ? -1 : 1));
}

/** What "Same as another piece…" can pick for `item`: the grid's other pieces in its slot. */
export function mergeCandidates(item: Pick<ClosetItemRow, 'id' | 'slot'>, all: readonly ClosetItemRow[]): ClosetItemRow[] {
  return closetGridItems(all).filter((c) => c.id !== item.id && c.slot === item.slot);
}

/** The piece page's "Same as another piece…" row, or null when nothing in its slot could be the same piece. */
export function mergeOffer(item: Pick<ClosetItemRow, 'id' | 'slot'>, all: readonly ClosetItemRow[]): { label: string; href: string } | null {
  if (mergeCandidates(item, all).length === 0) return null;
  return { label: t('closet.merge.action'), href: `/sheets/merge/${item.id}` };
}

/** What a merge changed, so Undo can put every row back as it was. */
export interface MergeUndo {
  fromId: string;
  intoId: string;
  /** The closet rows the merge changed, as they were before it. */
  items: ClosetItemRow[];
  /** The sightings it moved, as they were. */
  obs: ClosetObservationRow[];
  /** The checks whose closet summary it changed: that summary and their piece list, as they were. */
  checks: { id: string; closetSummary: ClosetSummary | undefined; itemIds: string[] }[];
}

export interface MergeFlowDeps {
  /** One confirmation; resolves true for "Yes, same one". */
  confirm: (title: string, body: string, yes: string) => Promise<boolean>;
  merge: (fromId: string, intoId: string) => Promise<MergeUndo | null>;
  unmerge: (u: MergeUndo) => Promise<void>;
  /** The toast with Undo. */
  toast: (text: string, undo: () => Promise<void> | void) => void;
}

/** Asks once, then merges `from` into `into` and shows the Undo toast. Returns what Undo would restore, or null. */
export async function runMerge(
  from: Pick<ClosetItemRow, 'id' | 'name'>, into: Pick<ClosetItemRow, 'id' | 'name'>, deps: MergeFlowDeps,
): Promise<MergeUndo | null> {
  const name = lower(into.name);
  const ok = await deps.confirm(t('item.q.duplicate', { item: name }), t('closet.merge.confirmBody', { item: name }), t('item.dup.yes'));
  if (!ok) return null;
  const undo = await deps.merge(from.id, into.id);
  if (!undo) return null;
  deps.toast(t('item.dup.saidSame', { item: name }), () => deps.unmerge(undo));
  return undo;
}

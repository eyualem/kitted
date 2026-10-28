// Merging duplicates on the piece page (09-ui-review §1 item 10, §6.3; #280). On a piece's page, "Same as another
// piece…" opens a picker of his other pieces in the same slot (top, bottom, shoes or layer; never itself, never one
// still waiting on his "Same as your …?" answer); picking one asks once, then the closet service folds this piece into
// the chosen one (every sighting moves, the worn counts combine with a shared look counted once, the two are never
// asked about again) and a toast offers Undo, which puts both back exactly, and moves the page back to the restored
// piece when that page is still on screen (§7 C3). Scores never change: a merge only moves closet rows. Pure helpers plus the flow, with its confirm, merge and toast injected (pieceActions wires the real ones).
import type { ClosetItemRow, ClosetObservationRow, ClosetSummary } from '@/data/types';
import { t } from '@/i18n/en';
import { isAwaitingAnswer, isOwned } from './profile';

const lower = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

/** The pieces the Closet grid shows: his own, minus the ones waiting on an answer (they live in their question card, #116). Newest first. */
export function closetGridItems(all: readonly ClosetItemRow[]): ClosetItemRow[] {
  const owned = all.filter(isOwned);
  return owned.filter((c) => !isAwaitingAnswer(c, owned)).sort((a, b) => b.addedAt - a.addedAt || (a.id < b.id ? -1 : 1));
}

/** Closet → Pieces, head to toe (founder, Oct 28; #384): the order of its sections, by the piece's slot. */
export const PIECE_SECTION_ORDER = ['outer', 'top', 'bottom', 'shoes'] as const;
export type PieceSectionSlot = (typeof PIECE_SECTION_ORDER)[number];

/** One titled group of the Pieces grid: its slot, its title, and its pieces in the grid's order (newest first). */
export interface PieceSection {
  slot: PieceSectionSlot;
  title: string;
  items: ClosetItemRow[];
}

/** Below this many pieces, or with one section only, the grid shows no titles (a tee, jeans and shoes read as one outfit). */
export const PIECE_SECTIONS_FROM = 4;

/**
 * The Pieces grid in head-to-toe sections: Jackets and layers · Tops · Bottoms · Shoes, empty ones left out, each in
 * the order it was given (pass `closetGridItems`, newest first). A piece with no known slot joins Tops, so none is
 * ever dropped. `titled` is false for a thin closet (fewer than 4 pieces, or all in one section): one plain grid,
 * still head to toe.
 */
export function closetSections(items: readonly ClosetItemRow[]): { titled: boolean; sections: PieceSection[] } {
  const known = new Set<string>(PIECE_SECTION_ORDER);
  const sections = PIECE_SECTION_ORDER.map((slot) => ({
    slot,
    title: t(`closet.section.${slot}`),
    items: items.filter((c) => (known.has(c.slot) ? c.slot : 'top') === slot),
  })).filter((s) => s.items.length > 0);
  return { titled: items.length >= PIECE_SECTIONS_FROM && sections.length > 1, sections };
}

/** What VoiceOver reads for a section's title: "Tops, 6 pieces". */
export function pieceSectionLabel(s: Pick<PieceSection, 'title' | 'items'>): string {
  return s.items.length === 1 ? t('closet.section.a11y.one', { section: s.title }) : t('closet.section.a11y', { section: s.title, n: s.items.length });
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
  /** After an Undo, when the page that ran the merge is still on screen: show it the restored piece (§7 C3). */
  returnTo?: (pieceId: string) => void;
}

// ---------------------------------------------------------------- which piece page is on screen (09-ui-review §7 C3)
/** A piece page on screen: its own key, the piece it shows, and, when it got there by a merge, the piece merged away. */
export interface PieceFocus {
  key: string;
  pieceId: string;
  mergedFrom: string | null;
}
let focused: PieceFocus | null = null;

/** A piece page came on screen (its focus effect). */
export function notePieceFocus(page: PieceFocus): void {
  focused = { ...page };
}

/** A piece page left the screen (blurred or closed); only that page's own key clears it. */
export function notePieceBlur(key: string): void {
  if (focused?.key === key) focused = null;
}

/**
 * Where an Undo should take the screen: back to the restored piece only when the page that ran the merge (it moved to
 * the kept piece, carrying the merged piece's id) is the one on screen; anywhere else, nowhere (null).
 */
export function mergeUndoTarget(u: Pick<MergeUndo, 'fromId' | 'intoId'>): string | null {
  return focused && focused.pieceId === u.intoId && focused.mergedFrom === u.fromId ? u.fromId : null;
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
  deps.toast(t('item.dup.saidSame', { item: name }), async () => {
    await deps.unmerge(undo);
    const back = mergeUndoTarget(undo);
    if (back) deps.returnTo?.(back);
  });
  return undo;
}

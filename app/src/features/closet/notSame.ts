// "What is it, then?" (specs/closet-beta.md CB4, founder Nov 19): the pure rules of the sheet `Not the same` opens.
// The pieces he can point at (his own pieces of the photographed piece's slot, the way "Same as which piece?" lists
// them, closest first), and the 2 to 4 kinds the new-piece step offers (the kind the app read first, then the nearest
// of the slot). No UI, no writes: the sheet and the closet service use these.
import type { ClosetAsk, ClosetItemRow } from '@/data/types';
import { mergeCandidates } from './merge';
import { currentValue, type EditSlot } from './pieceEdit';

/** The kinds a new piece is offered (the add card's table, T106 KC4.7, with Shirt joining the tops). One list per slot. */
export const KIND_SHORTLIST: Readonly<Record<EditSlot, readonly string[]>> = {
  top: ['tee', 'sweater', 'button_up_shirt', 'hoodie'],
  outer: ['bomber', 'denim_jacket', 'field_jacket', 'overshirt'],
  bottom: ['jeans', 'chinos', 'trousers', 'cargos'],
  shoes: ['low_profile_sneaker', 'work_boot', 'loafer', 'white_leather_sneaker'],
};

/** At most this many kinds before "Something else". */
export const KINDS_SHOWN = 4;

const uniq = <T,>(xs: readonly T[]): T[] => [...new Set(xs)];
const isSlot = (s: unknown): s is EditSlot => s === 'top' || s === 'outer' || s === 'bottom' || s === 'shoes';

/** The kinds the new-piece step draws: the one the app read first, then the slot's nearest, up to four. */
export function kindChoices(photo: Pick<ClosetItemRow, 'garment' | 'slot' | 'profile'>): string[] {
  if (!isSlot(photo.slot)) return [];
  const read = currentValue(photo, 'kind');
  return uniq([...(typeof read === 'string' ? [read] : []), ...KIND_SHORTLIST[photo.slot]]).slice(0, KINDS_SHOWN);
}

/**
 * The sheet's pieces: his live, owned pieces in the photographed piece's slot (`mergeCandidates`: never itself, never
 * one still waiting on an answer), minus the piece he said no to and any `exclude`; the runner-up first, then newest
 * first (the order `mergeCandidates` already gives).
 */
export function notSamePieces(
  photo: Pick<ClosetItemRow, 'id' | 'slot'>, all: readonly ClosetItemRow[], o: { refused?: string | null; runnerUpId?: string | null; exclude?: readonly string[] } = {},
): ClosetItemRow[] {
  const skip = new Set([o.refused, ...(o.exclude ?? [])]);
  const list = mergeCandidates(photo, all).filter((c) => !skip.has(c.id));
  const first = o.runnerUpId ? list.find((c) => c.id === o.runnerUpId) : undefined;
  return first ? [first, ...list.filter((c) => c !== first)] : list;
}

export interface NotSameContent {
  pieces: ClosetItemRow[];
  /** Nothing else like it: the sheet opens on the kind step, with no Back. */
  empty: boolean;
  kinds: string[];
}

export function notSameContent(
  photo: Pick<ClosetItemRow, 'id' | 'slot' | 'garment' | 'profile'>, all: readonly ClosetItemRow[], ask: Pick<ClosetAsk, 'candidateId' | 'runnerUpId'> | null,
  exclude: readonly string[] = [],
): NotSameContent {
  const pieces = notSamePieces(photo, all, { refused: ask?.candidateId ?? null, runnerUpId: ask?.runnerUpId ?? null, exclude });
  return { pieces, empty: pieces.length === 0, kinds: kindChoices(photo) };
}

/** The Closet section a slot's pieces sit under (`Tops`, `Bottoms`, `Shoes`, `Jackets and layers`). */
export const sectionKey = (slot: unknown) => `closet.section.${isSlot(slot) ? slot : 'top'}` as const;

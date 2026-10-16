// A photo on the wrong card (09-ui-review §8, #289; founder: "not this cloth or new one … so that the user wouldn't
// get annoyed"). A photo's long-press menu on the piece page offers two corrections:
//   - "Not this piece": the photo becomes a piece of its own (or his "Yes, same one" is re-answered "No"), with Undo.
//   - "It's another piece…": a picker of his other pieces of the same kind (top, bottom, shoes or layer); picking one
//     moves just that photo there ("Saved as your khaki chinos.", with Undo). On a piece's only photo there's nothing
//     to move it away from, so the pick merges the piece into the chosen one, exactly as "Same as another piece…".
// A photo is all of the piece's sightings in that image (the same photo checked again moves with it). The first photo
// of a piece with other photos moves like any other, and the piece keeps its name and drawing. Seed and described
// pieces have no fit-check photo, so nothing here touches them. Scores never change: only closet rows and the checks'
// closet summaries move. Pure rules and flows here; the closet service does the writes (splitPhoto, movePhoto,
// restorePhoto) and pieceActions wires the real toast and confirm.
import type { ClosetItemRow, ClosetObservationRow, ClosetSummary } from '@/data/types';
import { t } from '@/i18n/en';
import { mergeCandidates, runMerge, type MergeFlowDeps } from './merge';
import { isAwaitingAnswer, isLive, isOwned } from './profile';

const lower = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

/** What a photo's correction changed, so Undo can put every row back exactly (the merge's MergeUndo pattern). */
export interface PhotoUndo {
  /** The pieces it changed, as they were. */
  items: ClosetItemRow[];
  /** The pieces it made (removed again on Undo). */
  newItemIds: string[];
  /** The sightings it changed, as they were. */
  obs: ClosetObservationRow[];
  newObsIds: string[];
  /** The checks whose closet summary or piece list it changed, as they were. */
  checks: { id: string; closetSummary: ClosetSummary | undefined; itemIds: string[] }[];
}

/** Which corrections a photo's menu offers. `another`: 'move' the photo, or 'merge' the piece (its only photo). */
export interface PhotoOffer {
  notThis: boolean;
  another: 'move' | 'merge' | null;
}

export interface PhotoContext {
  all: readonly ClosetItemRow[];
  obs: readonly ClosetObservationRow[];
  /** Every check by id: its image hash (the same photo checked again shares it). */
  checks: ReadonlyMap<string, { imageHash: string }>;
}

/** Sightings that made a piece (the engine's "new", his "No, a new one", a "Not this piece"). */
const FOUNDING: readonly string[] = ['new', 'answeredNew', 'split'];
/** Sightings a correction can move: a match (the engine's or his "Yes") or one that made the piece. */
const MOVABLE: readonly string[] = ['same', 'answeredSame', ...FOUNDING];

/**
 * The photo `obsId` shows on piece `itemId`: that sighting and every other live sighting of the piece from the same
 * image (the same photo checked again), the given one first. Empty when it isn't a fit-check photo of this piece.
 */
export function photoSightings(itemId: string, obsId: string, obs: readonly ClosetObservationRow[], checks: PhotoContext['checks']): ClosetObservationRow[] {
  const o = obs.find((x) => x.id === obsId);
  if (!o || o.itemId !== itemId || !isLive(o) || o.origin !== 'garment' || !o.fitCheckId) return [];
  const hash = checks.get(o.fitCheckId)?.imageHash;
  const twins = obs.filter((x) => x.id !== o.id && x.itemId === itemId && isLive(x) && x.origin === 'garment' && !!x.fitCheckId
    && !!hash && checks.get(x.fitCheckId)?.imageHash === hash);
  return [o, ...twins.sort((a, b) => a.createdAt - b.createdAt || (a.id < b.id ? -1 : 1))];
}

/** Whether the photo made the piece (one of its sightings is the piece's founding one). */
export function isFirstPhoto(photo: readonly ClosetObservationRow[]): boolean {
  return photo.some((o) => FOUNDING.includes(o.decision));
}

/**
 * What a photo's menu offers (§8 W2, W8, W9): nothing on a piece still waiting on "Same as your …?" (its question card
 * owns it) or on a sighting that isn't a fit-check photo of a piece he owns. "Not this piece" when the piece keeps
 * something without this photo (another photo, or the seed piece he added); "It's another piece…" only when he owns
 * another piece of the same kind: a move, or on the piece's only photo a merge.
 */
export function photoOffer(item: Pick<ClosetItemRow, 'id' | 'slot' | 'maybeSameAs'>, obsId: string, c: PhotoContext): PhotoOffer {
  const none: PhotoOffer = { notThis: false, another: null };
  const piece = c.all.find((x) => x.id === item.id);
  if (!piece || !isOwned(piece) || isAwaitingAnswer(piece, c.all.filter(isOwned))) return none;
  const photo = photoSightings(piece.id, obsId, c.obs, c.checks);
  if (photo.length === 0 || !photo.every((o) => MOVABLE.includes(o.decision))) return none;
  const ids = new Set(photo.map((o) => o.id));
  const rest = c.obs.some((o) => o.itemId === piece.id && isLive(o) && !ids.has(o.id));
  const other = mergeCandidates(piece, c.all).length > 0;
  return { notThis: rest, another: other ? (rest ? 'move' : 'merge') : null };
}

export type PhotoMenuItem = 'cover' | 'look' | 'notThis' | 'another' | 'remove';

/** The photo's menu, in order: Use as cover (unless it is), Open the look, the offered corrections, Remove photo. */
export function photoMenuItems(ph: { cover: boolean }, offer: PhotoOffer): PhotoMenuItem[] {
  return [
    ...(ph.cover ? [] : ['cover' as const]), 'look' as const,
    ...(offer.notThis ? ['notThis' as const] : []), ...(offer.another ? ['another' as const] : []), 'remove' as const,
  ];
}

/** "It's another piece…": the merge picker, for this photo. */
export function anotherHref(itemId: string, obsId: string): string {
  return `/sheets/merge/${itemId}?photo=${encodeURIComponent(obsId)}`;
}

/**
 * The picker: "Same as which piece?" over his other pieces of the same kind. The piece's own "Same as another piece…"
 * says that its photos and wears move; the photo's picker moves one photo, so it has no subtitle.
 */
export function pickerContent(item: Pick<ClosetItemRow, 'id' | 'slot'>, all: readonly ClosetItemRow[], o: { photo: boolean }) {
  return { title: t('closet.merge.title'), subtitle: o.photo ? null : t('closet.merge.sub'), candidates: mergeCandidates(item, all) };
}

export interface WrongCardDeps {
  split: (obsId: string) => Promise<{ piece: ClosetItemRow; undo: PhotoUndo } | null>;
  move: (obsId: string, intoId: string) => Promise<{ piece: ClosetItemRow; undo: PhotoUndo } | null>;
  restore: (u: PhotoUndo) => Promise<void>;
  /** The toast with Undo. */
  toast: (text: string, undo: () => Promise<void> | void) => void;
}

/** "Not this piece": the photo becomes its own piece; the toast "Saved as its own piece: {item}." can undo it (§8 W1). */
export async function runNotThis(obsId: string, d: Pick<WrongCardDeps, 'split' | 'restore' | 'toast'>): Promise<ClosetItemRow | null> {
  const r = await d.split(obsId);
  if (!r) return null;
  d.toast(t('closet.piece.splitOff', { item: lower(r.piece.name) }), () => d.restore(r.undo));
  return r.piece;
}

/**
 * A pick in "It's another piece…": the photo moves to `into` ("Saved as your {item}." with Undo, §8 W4–W5); on the
 * piece's only photo, `item` merges into `into` exactly as "Same as another piece…" (its confirm and Undo, W9).
 * Returns the piece the photo is on now, or null when nothing changed.
 */
export async function runAnotherPiece(
  item: ClosetItemRow, obsId: string, into: Pick<ClosetItemRow, 'id' | 'name'>, d: WrongCardDeps & MergeFlowDeps, c?: PhotoContext,
): Promise<ClosetItemRow | null> {
  const r = await d.move(obsId, into.id);
  if (r) {
    d.toast(t('item.dup.saidSame', { item: lower(into.name) }), () => d.restore(r.undo));
    return r.piece;
  }
  // The move refuses a piece's only photo: then the pick merges the piece (when that's what the menu offered).
  if (c && photoOffer(item, obsId, c).another !== 'merge') return null;
  const merged = await runMerge(item, into, d);
  return merged ? { ...(into as ClosetItemRow) } : null;
}

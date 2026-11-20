// A piece he describes in chat (T106; specs/kit-stylist-chat.md KC4.3, KC2.10): written once, through here, by the add
// card's Add, an explicit "add it", and a "You'd need" tile's I have one. Not photographed (a dashed tile in Closet),
// `source: 'chat'` ("From chat"), named by code from its color and kind ("Black tee"), and its color is "he said so":
// a later photo that reads it differently never repaints it (Nov 12: named "Black work boots", drawn brown).
// The model never writes a closet piece (memory.ts drops owns_unphotographed); only the user's tap or words do.
import { displayHex, G } from '@kitted/core';
import type { KittedStore } from '@/data/store';
import type { ClosetItemRow } from '@/data/types';
import type { Clock } from '@/services/clock';
import { slotOfKind, type CardPiece } from '@/features/ask/cards';
import { isOwned } from './profile';

export interface ChatAddDeps {
  store: Pick<KittedStore, 'closet'>;
  clock: Clock;
  ids: (prefix: string) => string;
}

const CATEGORY = { top: 'top', outer: 'outerwear', bottom: 'bottom', shoes: 'footwear' } as const;

/** The closet row for a drawn piece; null for an accessory or a kind the closet doesn't hold. */
export function chatPieceRow(piece: CardPiece, id: string, nowMs: number): ClosetItemRow | null {
  const slot = slotOfKind(piece.kind);
  if (!slot || slot === 'accessory') return null;
  const garment = G(CATEGORY[slot], piece.kind, piece.color, slot === 'bottom' ? { leg_shape: 'straight' } : {});
  return {
    id, name: piece.name, slot, garment, confirmedFields: ['color_family'], hex: displayHex(piece.color), photoFile: null, demoPhotoId: null,
    isPhotographed: false, source: 'chat', starterId: null, wornCount: 0, lastWornAt: null, addedAt: nowMs, isDeleted: false,
    mergedInto: null, maybeSameAs: null, cropFile: null, cropScore: null, updatedAt: nowMs,
    profile: { aliases: [], distinctFrom: [], confirmed: { color_family: piece.color }, autoName: false },
  };
}

/** His piece of the same kind and color family, if the closet has one (KC4.1). */
export function ownedSame(closet: readonly ClosetItemRow[], piece: Pick<CardPiece, 'kind' | 'color'>): ClosetItemRow | null {
  return closet.find((c) => isOwned(c) && c.garment.subcategory === piece.kind && c.garment.color_family === piece.color) ?? null;
}

/** Adds the piece; its id, or null when it can't be a closet piece. */
export async function addChatPiece(deps: ChatAddDeps, piece: CardPiece): Promise<string | null> {
  const row = chatPieceRow(piece, deps.ids('C'), deps.clock.nowMs());
  if (!row) return null;
  await deps.store.closet.put(row);
  return row.id;
}

/** Undo: the piece leaves the closet (kept as a deleted row, like every removal). Only a piece from chat that no photo has seen. */
export async function removeChatPiece(deps: Pick<ChatAddDeps, 'store'>, itemId: string): Promise<boolean> {
  const it = await deps.store.closet.get(itemId);
  if (!it || it.isDeleted || it.source !== 'chat' || it.isPhotographed) return false;
  await deps.store.closet.patch(itemId, { isDeleted: true });
  return true;
}

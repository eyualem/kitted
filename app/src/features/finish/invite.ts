// The one optional step after his first fit (10-onboarding.md §9.11, #342; it replaced "Your first 3 moves"): "Tap the
// clothes you already own". Pure: how many he added from the list, and what the card shows.
import type { ChatMessage, ClosetItemRow } from '@/data/types';

/** Pieces he added from "What you already own" (live, not photographed) plus the belt's kv mark. */
export function basicsAdded(closet: readonly ClosetItemRow[], markedKv: readonly string[]): number {
  return markedKv.length + closet.filter((c) => !!c.starterId && !c.isPhotographed && !c.isDeleted && !c.mergedInto).length;
}

export type InviteState = 'open' | 'skipped' | 'added';

/** Added wins over Skip: he skipped, then added some from Closet anyway. */
export function inviteState(m: Pick<ChatMessage, 'payload'>, added: number): InviteState {
  if (added > 0) return 'added';
  return m.payload.skipped === true ? 'skipped' : 'open';
}

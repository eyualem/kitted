// T39 stub (tasks/T39/IMPLEMENTATION.md → Interfaces): Kit's first-check offer, its buttons' rule, Later, and the
// "Turn on fit checks" post after Not now on the agreement. Written by the test writer so the tests fail on missing
// behaviour, not on a missing import. The implementer replaces every body.
import type { KittedStore } from '@/data/store';
import type { ChatMessage } from '@/data/types';

const notBuilt = (): never => {
  throw new Error('T39: not built');
};

export const OFFER_LATER_KEY = 'firstCheckOffer.laterAt';
export async function postFirstCheckOffer(_store: KittedStore, _nowMs: number, _ids: (p: string) => string): Promise<ChatMessage> {
  return notBuilt();
}
export interface OfferState { laterAt: number | null; hasScoredCheck: boolean; declined: boolean }
export async function loadOfferState(_store: KittedStore): Promise<OfferState> {
  return notBuilt();
}
export function offerButtonsShow(_s: OfferState): boolean {
  return notBuilt();
}
export async function tapLater(_store: KittedStore, _nowMs: number, _ids: (p: string) => string): Promise<void> {
  notBuilt();
}
export async function declineAgreement(_store: KittedStore, _nowMs: number, _ids: (p: string) => string): Promise<void> {
  notBuilt();
}

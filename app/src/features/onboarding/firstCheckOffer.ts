// Kit's first-check offer (T39, specs/onboarding-screens.md OS5): the card setup's end posts under Kit's first message
// ("Want to check a fit now?" with Check my fit and Later), the rule for its buttons, Later, and the "Turn on fit
// checks" message after Not now on the camera's agreement. All local: nothing here sends anything.
import { textMessage } from '@/data/seedLoader';
import type { KittedStore } from '@/data/store';
import type { ChatMessage } from '@/data/types';
import { t } from '@/i18n/en';

/** kv: when he tapped Later (String(epoch ms)). Read by the notifications spec (NT1.8); "Delete all my data" clears it
 *  (the wipe drops all kv). */
export const OFFER_LATER_KEY = 'firstCheckOffer.laterAt';

/** A new message of Kit's: just after the newest one, so it always sits at the bottom of the thread even when the
 *  clock is behind, and with an id no message has yet (a put never replaces one). */
async function kitLine(store: KittedStore, nowMs: number, ids: (p: string) => string, text: string | null): Promise<ChatMessage> {
  const chat = await store.chat.all();
  const newest = chat.reduce((m, x) => Math.max(m, x.createdAt), Number.NEGATIVE_INFINITY);
  const taken = new Set(chat.map((m) => m.id));
  let id = ids('M');
  while (taken.has(id)) id = ids('M');
  return textMessage(id, Math.max(nowMs, newest) + 1, 'stylist', text);
}

/** Posts Kit's offer card, always under Kit's first message. */
export async function postFirstCheckOffer(store: KittedStore, nowMs: number, ids: (p: string) => string): Promise<ChatMessage> {
  const m: ChatMessage = { ...(await kitLine(store, nowMs, ids, null)), kind: 'card', cardType: 'firstCheckOffer' };
  await store.chat.put(m);
  return m;
}

export interface OfferState {
  laterAt: number | null;
  hasScoredCheck: boolean;
  declined: boolean;
}

/** hasScoredCheck: any check with status 'scored' (a re-check counts; failed, held, unreadable and the rest don't).
 *  declined: a "Turn on fit checks" message created after the offer card (Not now on the camera's agreement). */
export async function loadOfferState(store: KittedStore): Promise<OfferState> {
  const raw = await store.getKv(OFFER_LATER_KEY);
  const n = raw === null ? Number.NaN : Number(raw);
  const checks = await store.fitChecks.all();
  const chat = await store.chat.all();
  const offerAt = chat.filter((m) => m.cardType === 'firstCheckOffer').reduce((a, m) => Math.min(a, m.createdAt), Number.POSITIVE_INFINITY);
  return {
    laterAt: Number.isFinite(n) ? n : null,
    hasScoredCheck: checks.some((c) => c.status === 'scored'),
    declined: Number.isFinite(offerAt) && chat.some((m) => m.cardType === 'turnOnChecks' && m.createdAt > offerAt),
  };
}

/** The buttons show only while all three are clear. */
export function offerButtonsShow(s: OfferState): boolean {
  return s.laterAt === null && !s.hasScoredCheck && !s.declined;
}

/** True while Kit's first-check card is the one thing in Stylist to act on: setup posted it and he has no scored check
 *  yet (Later and "Not now" don't change that). The morning and evening card waits for it (founder, Nov 11: two cards
 *  that both said "Check my fit" confused him; until his first check he sees only Kit's). An install with no offer card
 *  (set up before it existed) is never held: its morning card is its first-check card. */
export async function firstCheckPending(store: KittedStore): Promise<boolean> {
  if (!(await store.chat.all()).some((m) => m.cardType === 'firstCheckOffer')) return false;
  return !(await store.fitChecks.all()).some((c) => c.status === 'scored');
}

/** Later: once only. Saves when he tapped it and posts Kit's line under the card. A second call does nothing. */
export async function tapLater(store: KittedStore, nowMs: number, ids: (p: string) => string): Promise<void> {
  if ((await store.getKv(OFFER_LATER_KEY)) !== null) return;
  // The key is written out (not OFFER_LATER_KEY) so the sync test's scan of setKv calls can classify it.
  await store.setKv('firstCheckOffer.laterAt', String(nowMs));
  await store.chat.put(await kitLine(store, nowMs, ids, t('offer.laterLine')));
}

/** Not now (or the X) on the camera's agreement: for a new setup (an offer card exists) that has no "Turn on fit
 *  checks" message yet, posts today's one exactly as completeOnboarding({ consent: false }) does. Otherwise nothing.
 *  Saves no consent, sends nothing. */
export async function declineAgreement(store: KittedStore, nowMs: number, ids: (p: string) => string): Promise<void> {
  const chat = await store.chat.all();
  if (!chat.some((m) => m.cardType === 'firstCheckOffer')) return;
  if (chat.some((m) => m.cardType === 'turnOnChecks')) return;
  await store.chat.put({ ...(await kitLine(store, nowMs, ids, t('noConsent.greeting'))), kind: 'card', cardType: 'turnOnChecks' });
}

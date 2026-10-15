// Posting "Keep your fits" (A3, 10-onboarding.md §3) into the thread when offerDue says so. Stylist calls ensure() on
// focus, on coming back to the front, and a few seconds after a check changes (so the card never lands on top of a
// score reveal). The rule itself is pure (offer.ts); this is the plumbing: the visit clock, the guard against posting
// twice, and "Not now".
import type { ChatMessage } from '@/data/types';
import type { KittedStore } from '@/data/store';
import { accountsOn, getAccount, getOffer, saveOffer } from './account';
import { nextVisitStart, offerDue, scoredFullChecks, type OfferCheck } from './offer';

export interface OfferDeps {
  store: Pick<KittedStore, 'getKv' | 'setKv' | 'fitChecks' | 'chat' | 'closet'>;
  now: () => number;
  ids: (prefix: string) => string;
  /** A check is reading or waiting for the one quick tap. */
  busy: () => boolean;
  enabled?: () => boolean;
}

export function createOfferService(deps: OfferDeps) {
  let visitStart: number | null = null;
  let leftAt: number | null = null;
  let running = false;
  const enabled = deps.enabled ?? accountsOn;

  const checks = async (): Promise<OfferCheck[]> =>
    (await deps.store.fitChecks.all()).map((c) => ({ createdAt: c.createdAt, status: c.status, recheck: c.parentId !== null }));

  return {
    /** The app went to the background / came back (AppState). */
    left() {
      leftAt = deps.now();
    },
    back() {
      if (visitStart !== null) visitStart = nextVisitStart(visitStart, leftAt, deps.now());
      leftAt = null;
    },
    /** Posts the card if it's due. Returns the new message's id, or null. */
    async ensure(): Promise<string | null> {
      if (visitStart === null) visitStart = deps.now();
      if (running || !enabled()) return null;
      running = true;
      try {
        const [account, state, all] = await Promise.all([getAccount(deps.store), getOffer(deps.store), checks()]);
        const busy = deps.busy() || all.some((c) => c.status === 'scoring' || c.status === 'asking');
        if (!offerDue({ enabled: true, signedIn: account !== null, busy, state, checks: all, visitStartMs: visitStart })) return null;
        const pieces = (await deps.store.closet.all()).length;
        const id = deps.ids('M');
        const m: ChatMessage = {
          id, createdAt: deps.now(), role: 'stylist', kind: 'card', text: null, cardType: 'account', fitCheckId: null, outfitId: null,
          itemId: null, chips: [], payload: { offer: state.shown + 1, pieces, state: 'open' },
        };
        await deps.store.chat.put(m);
        await saveOffer(deps.store, { ...state, shown: state.shown + 1, declined: false });
        return id;
      } finally {
        running = false;
      }
    },
    /** "Not now": the card folds to one line; the second offer waits for 3 more scored checks. */
    async decline(messageId: string): Promise<void> {
      const m = await deps.store.chat.get(messageId);
      if (m) await deps.store.chat.put({ ...m, payload: { ...m.payload, state: 'declined' } });
      const state = await getOffer(deps.store);
      await saveOffer(deps.store, { ...state, declined: true, checksAtDecline: scoredFullChecks(await checks()) });
    },
  };
}

export type OfferService = ReturnType<typeof createOfferService>;

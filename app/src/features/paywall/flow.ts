// Closing the paywall and what follows (02 P1s; 10-onboarding.md §9.4): back where he was; after a purchase the toast
// "Pro is on." and a photo held under the Limit card is scored now; the onboarding placement then lets the sequence
// post the notification ask.
import { store } from '@/data/db';
import { finish } from '@/features/finish/session';
import { fitCheck } from '@/features/fitcheck/session';
import { showToast } from '@/features/toast/toast';
import { t } from '@/i18n/en';

export type PaywallFrom = 'onboarding' | 'limit' | 'ask' | 'you' | 'other';

export const parseFrom = (v: unknown): PaywallFrom =>
  v === 'onboarding' || v === 'limit' || v === 'ask' || v === 'you' ? v : 'other';

/** `goBack` closes the whole cover (the root stack's back, from either page). */
export function closePaywall(goBack: () => void, from: PaywallFrom, purchased: boolean): void {
  goBack();
  if (purchased) {
    showToast(t('toast.pro'));
    void scoreHeldPhoto();
  }
  if (from === 'onboarding') void finish.paywallClosed();
}

/** S17: if he buys, the held photo is scored right away (Pro's checks). */
async function scoreHeldPhoto(): Promise<void> {
  const held = (await store.fitChecks.all()).filter((c) => c.status === 'held').sort((a, b) => b.createdAt - a.createdAt)[0];
  if (held) await fitCheck.scoreHeldNow(held.id);
}

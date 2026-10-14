// Finishing onboarding (minimal for P2; P4 builds the screens): save the profile and consent,
// then post the one AI-disclosure line at the top of the thread (ruling 17).
import type { Styles } from '@kitted/core';
import type { KittedStore } from '@/data/store';
import { textMessage } from '@/data/seedLoader';

export interface OnboardingAnswers {
  styles: Styles;
  heightCm: number | null;
  build: string;
  fitPreference: string;
  birthYear: number | null;
  /** O5: "Agree & check my fit" (true) or "Not now" (false: nothing is ever sent until he agrees later). */
  consent?: boolean;
}

/** The consent text's version (02 D4: saved with the date; a changed text asks again). */
export const CONSENT_VERSION = '1';

export async function completeOnboarding(store: KittedStore, a: OnboardingAnswers, nowMs: number, ids: (p: string) => string): Promise<void> {
  await store.profile.put({
    id: 'me', birthYear: a.birthYear, heightCm: a.heightCm, build: a.build, fitPreference: a.fitPreference, styles: a.styles,
    boldness: null, budget: null, lastOccasion: 'everyday',
    consentVersion: a.consent === false ? null : CONSENT_VERSION, consentAt: a.consent === false ? null : nowMs, onboardingDone: true,
    ideaTime: null, units: 'imperial', createdAt: nowMs,
  });
  await store.chat.put(textMessage(ids('M'), nowMs, 'stylist', null, { aiNote: true }));
}

/** Consent given later (the camera's first open, the sheet, You → Privacy): only the two consent fields change.
 *  With no profile yet (a dev or demo install that skipped onboarding) one is made with blank basics, so the
 *  agreement is always kept: before, "Agree" saved nothing there and the camera asked again on every photo. */
export async function giveConsent(store: KittedStore, nowMs: number): Promise<void> {
  const p = await store.profile.get('me');
  if (p) {
    await store.profile.put({ ...p, consentVersion: CONSENT_VERSION, consentAt: nowMs });
    return;
  }
  await store.profile.put({
    id: 'me', birthYear: null, heightCm: null, build: '', fitPreference: '', styles: [],
    boldness: null, budget: null, lastOccasion: 'everyday',
    consentVersion: CONSENT_VERSION, consentAt: nowMs, onboardingDone: true,
    ideaTime: null, units: 'imperial', createdAt: nowMs,
  });
}

/** Whether a photo of his may be sent: a saved agreement. The same rule as the upload's own guard (privacy/wipe.ts
 *  mayUpload), so the camera asks exactly when a photo would be refused, once, before he takes it. */
export async function hasConsent(store: KittedStore): Promise<boolean> {
  const p = await store.profile.get('me');
  return !!p && !!p.consentVersion;
}

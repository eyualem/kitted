// Finishing onboarding (minimal for P2; P4 builds the screens): save the profile and consent,
// then post Kit's hello at the top of the thread (specs/setup-and-you.md SY2; it ends with the AI-disclosure line,
// ruling 17), and after "Not now" the S26 card.
import type { Styles } from '@kitted/core';
import type { KittedStore } from '@/data/store';
import type { AgeBand } from '@/data/types';
import { textMessage } from '@/data/seedLoader';
import { kitHello } from './tips';
import { t } from '@/i18n/en';

export interface OnboardingAnswers {
  styles: Styles;
  fitPreference: string;
  birthYear: number | null;
  /** T39 (About you): saved as ageBand, with ageBandAt = nowMs when given; else both null. */
  ageBand?: AgeBand | null;
  /** T39 (About you): saved as given (callers pass cleanName's result); else null. */
  name?: string | null;
  /** O5: "Agree & check my fit" (true) or "Not now" (false: nothing is ever sent until he agrees later).
   *  T39: 'later' (setup's end): no consent saved, and no "Turn on fit checks" card. */
  consent?: boolean | 'later';
}

/** The consent text's version (02 D4: saved with the date; a changed text asks again). 2 (#329): questions go to
 *  OpenAI, with his style picks, height and build if given, what he told Kit and his closet as words. */
export const CONSENT_VERSION = '2';
/** Questions need an agreement that names OpenAI (version 2+); photos still go only to Google, so version 1 covers
 *  them. Someone who agreed to version 1 sees the agreement once more the first time he asks Kit something. */
export const QUESTIONS_CONSENT_FROM = 2;

export async function completeOnboarding(store: KittedStore, a: OnboardingAnswers, nowMs: number, ids: (p: string) => string): Promise<void> {
  // 'later' (T39, setup's end): he hasn't been asked yet; the agreement comes on the camera's first open.
  const agreed = a.consent === true || a.consent === undefined;
  await store.profile.put({
    id: 'me', birthYear: a.birthYear, heightCm: null, build: '', fitPreference: a.fitPreference, styles: a.styles,
    boldness: null, budget: null, lastOccasion: 'everyday',
    consentVersion: agreed ? CONSENT_VERSION : null, consentAt: agreed ? nowMs : null, onboardingDone: true,
    ideaTime: null, units: 'imperial', createdAt: nowMs,
    ageBand: a.ageBand ?? null, ageBandAt: a.ageBand ? nowMs : null, name: a.name ?? null,
  });
  await store.chat.put(kitHello(ids('M'), nowMs));
  // "Not now" (S26, 09-ui-review §20.8 G23): the thread says how to turn fit checks on instead of starting bare.
  if (a.consent === false) await store.chat.put({ ...textMessage(ids('M'), nowMs + 1, 'stylist', t('noConsent.greeting')), kind: 'card', cardType: 'turnOnChecks' });
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
    ageBand: null, ageBandAt: null, name: null,
  });
}

/** Whether a photo of his may be sent: a saved agreement. The same rule as the upload's own guard (privacy/wipe.ts
 *  mayUpload), so the camera asks exactly when a photo would be refused, once, before he takes it. */
export async function hasConsent(store: KittedStore): Promise<boolean> {
  const p = await store.profile.get('me');
  return !!p && !!p.consentVersion;
}

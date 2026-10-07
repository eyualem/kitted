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
}

export async function completeOnboarding(store: KittedStore, a: OnboardingAnswers, nowMs: number, ids: (p: string) => string): Promise<void> {
  await store.profile.put({
    id: 'me', birthYear: a.birthYear, heightCm: a.heightCm, build: a.build, fitPreference: a.fitPreference, styles: a.styles,
    boldness: null, budget: null, lastOccasion: 'everyday', consentVersion: '1', consentAt: nowMs, onboardingDone: true,
    ideaTime: null, units: 'imperial', createdAt: nowMs,
  });
  await store.chat.put(textMessage(ids('M'), nowMs, 'stylist', null, { aiNote: true }));
}

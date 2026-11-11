// Resuming setup (10-onboarding.md F4): closing the app mid-setup reopens on the step he reached, with his answers (the
// drafts in kv). The step is written as he moves forward; "/" reads the one found at launch.
import type { KittedStore } from '@/data/store';
import { KV } from '@/data/store';

export const ONBOARDING_STEP_KEY = KV.onboardingStep;
/** The progress bar's segments: Welcome, Looks, About you (it fills on About you, #276; T39 removed the agreement step). */
export const ONBOARDING_STEPS = 3;
export type ResumeStep = 'looks' | 'basics';
const STEPS: readonly ResumeStep[] = ['looks', 'basics'];

/** '1' was written by Welcome before #289 (it meant "past Welcome"). 'consent' is an install closed on the agreement
 *  step that T39 removed: it reopens on About you (OS3.2). */
export function parseStep(raw: string | null): ResumeStep | null {
  if (raw === '1') return 'looks';
  if (raw === 'consent') return 'basics';
  return STEPS.includes(raw as ResumeStep) ? (raw as ResumeStep) : null;
}

export function resumeHref(step: ResumeStep | null): '/onboarding/welcome' | `/onboarding/${ResumeStep}` {
  return step ? `/onboarding/${step}` : '/onboarding/welcome';
}

let atLaunch: ResumeStep | null = null;

/** Boot: the step setup was on when the app last closed. */
export async function loadResumeStep(store: Pick<KittedStore, 'getKv'>): Promise<void> {
  atLaunch = parseStep(await store.getKv(ONBOARDING_STEP_KEY));
}

export const resumeStepAtLaunch = (): ResumeStep | null => atLaunch;

export async function setResumeStep(store: Pick<KittedStore, 'setKv'>, step: ResumeStep): Promise<void> {
  await store.setKv(ONBOARDING_STEP_KEY, step);
}

export async function clearResumeStep(store: Pick<KittedStore, 'deleteKv'>): Promise<void> {
  atLaunch = null;
  await store.deleteKv(ONBOARDING_STEP_KEY);
}

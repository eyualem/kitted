// The end of A4 (10-onboarding.md §4.4, #386), apart from the screen so the backup's tests can run it.
import type { KittedStore } from '@/data/store';
import { completeOnboarding } from '@/features/onboarding/complete';
import { clearResumeStep } from '@/features/onboarding/resume';
import { BASICS_KEY, loadDraft } from '@/features/onboarding/basics';
import { newId } from '@/services/ids';

/** The birth year and fit Basics asked, onto his restored profile (they never sync, or he just picked them); setup
 *  only when the account brought no profile (or on the stand-in). After the rows land, so the synced profile isn't
 *  overwritten by a newer one written here first. */
export async function finishRestore(s: KittedStore, nowMs: number): Promise<void> {
  const d = await loadDraft(s);
  const p = await s.profile.get('me');
  if (p) {
    await s.profile.put({ ...p, birthYear: d.basics.birthYear, fitPreference: p.fitPreference || d.basics.fit || '', onboardingDone: true });
  } else {
    // His looks and the rest arrive with his synced profile (or, on the stand-in, never).
    await completeOnboarding(s, { styles: [], fitPreference: d.basics.fit ?? '', birthYear: d.basics.birthYear, consent: false }, nowMs, newId);
  }
  await s.deleteKv(BASICS_KEY);
  await clearResumeStep(s);
}

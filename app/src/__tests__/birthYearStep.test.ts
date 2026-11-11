// Onboarding down to the birth year (10-onboarding.md §10, #373): O3 asks only the birth year; height, build and fit
// move to Kit's "About you" card after the first score. Checks BY4–BY8 (BY1–BY3 retired by T39, below), written before the code (BY9, the tap count,
// is walked on the Simulator).
import { createMemoryStore } from '@/data/memoryStore';
import { answersFromDraft, basicsEcho, BASICS_KEY, EMPTY_BASICS, loadDraft, LOOKS_KEY, looksReply } from '@/features/onboarding/basics';
import { completeOnboarding, CONSENT_VERSION } from '@/features/onboarding/complete';
import { parseStep } from '@/features/onboarding/resume';
import { t } from '@/i18n/en';


const ids = (() => { let n = 0; return (p: string) => `${p}-${++n}`; })();

describe('the birth-year step (BY)', () => {
  // BY1–BY3 retired by T39 (#412–#413, specs/onboarding-screens.md OS3–OS4): the birth-year card they read in
  // BasicsScreen.tsx's source is gone. Their promises now live in rendered T39 tests (tasks/T39/TESTING.md, Superseded):
  // BY1 (only the age is asked, no height, build or fit; one layout for setup and Restore) → T39-setupScreens
  // "OS4.1 · on open: …" and "SY4.1 · the name comes first and is optional"; BY2 (Continue waits for the answer, the
  // hint only while none is picked) → "OS4.1 · on open: …" and "OS4.1 · one tap picks, another moves the pick"; BY3
  // (under 18 asks once, then the Keychain lock) → "OS4.4 · Under 18 asks once with the new title" and
  // "OS4.4 · That's right locks the app".

  test('BY4: Consent echoes the year alone; its text and version are unchanged', () => {
    expect(basicsEcho({ ...EMPTY_BASICS, birthYear: 2004 })).toBe('Born in 2004');
    // An older draft's fit is still saved (BY6) but not echoed.
    expect(basicsEcho({ fit: 'relaxed', birthYear: 2005 })).toBe('Born in 2005');
    expect(CONSENT_VERSION).toBe('2');
    expect(t('onb.consent.sent3')).toMatch(/the fit you like if you gave it/);
  });

  test('BY5: a setup finished on the new step saves no height, build or fit', async () => {
    const store = createMemoryStore();
    await store.init();
    await store.setKv(LOOKS_KEY, JSON.stringify(['streetwear']));
    await store.setKv(BASICS_KEY, JSON.stringify({ birthYear: 2004 }));
    await completeOnboarding(store, answersFromDraft(await loadDraft(store), true), 1_000, ids);
    expect(await store.profile.get('me')).toMatchObject({ birthYear: 2004, heightCm: null, build: '', fitPreference: '', consentVersion: CONSENT_VERSION });
  });

  // #375 (10-onboarding.md §11): height and build are no longer kept; the fit is (HB9 in heightBuildRemoved.test.ts).
  test('BY6: a draft from an older build keeps the fit he gave, not his height or build', async () => {
    const store = createMemoryStore();
    await store.init();
    await store.setKv(BASICS_KEY, JSON.stringify({ heightIn: 72, build: 'broad', fit: 'fitted', birthYear: 2001 }));
    await completeOnboarding(store, answersFromDraft(await loadDraft(store), true), 1_000, ids);
    expect(await store.profile.get('me')).toMatchObject({ heightCm: null, build: '', fitPreference: 'fitted', birthYear: 2001 });
  });

  test('BY7: closing the app on O3 reopens on O3 with the year kept', async () => {
    expect(parseStep('basics')).toBe('basics');
    const store = createMemoryStore();
    await store.init();
    await store.setKv(BASICS_KEY, JSON.stringify({ birthYear: 1999 }));
    expect((await loadDraft(store)).basics.birthYear).toBe(1999);
  });

  test('BY8: Kit\'s three replies lead to the birth year, never to "basics" or "frame"', () => {
    const lines = [looksReply([]), looksReply(['minimalist']), looksReply(['smart_casual', 'workwear'])];
    expect(lines).toEqual([
      "No problem. I'll learn your style from your checks. One more thing: your birth year.",
      'Minimal. Good pick. One more thing: your birth year.',
      'Smart casual with some workwear. Good mix. One more thing: your birth year.',
    ]);
    for (const l of lines) expect(l).not.toMatch(/basics|frame/i);
    expect(t('onb.basics.never')).toBe('Kitted is for 18 and up. It never changes your score.');
  });
});

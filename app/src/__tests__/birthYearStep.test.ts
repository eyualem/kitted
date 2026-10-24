// Onboarding down to the birth year (10-onboarding.md §10, #373): O3 asks only the birth year; height, build and fit
// move to Kit's "About you" card after the first score. Checks BY1–BY8, written before the code (BY9, the tap count,
// is walked on the Simulator).
import { createMemoryStore } from '@/data/memoryStore';
import { answersFromDraft, basicsEcho, BASICS_KEY, EMPTY_BASICS, loadDraft, LOOKS_KEY, looksReply } from '@/features/onboarding/basics';
import { completeOnboarding, CONSENT_VERSION } from '@/features/onboarding/complete';
import { parseStep } from '@/features/onboarding/resume';
import { t } from '@/i18n/en';

declare const __dirname: string;
const { readFileSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');
const source = (...p: string[]) => readFileSync(join(__dirname, '..', ...p), 'utf8');

const ids = (() => { let n = 0; return (p: string) => `${p}-${++n}`; })();

describe('the birth-year step (BY)', () => {
  test('BY1: O3 shows only the birth year, in both paths', () => {
    const s = source('features', 'onboarding', 'BasicsScreen.tsx');
    for (const gone of ['Segmented', 'Silhouette', 'stepHeight', "'onb.basics.height'", "'onb.basics.build'", "'onb.basics.fit'"]) expect(s).not.toContain(gone);
    expect(s).toContain("t('onb.basics.birthYear')");
    // One layout for the new setup and the restore path: no branch hides fields any more.
    expect(s).not.toMatch(/restoring \? null : \(/);
  });

  test('BY2: Continue waits for a year; the hint shows only while none is picked', () => {
    expect(t('onb.basics.cta')).toBe('Continue');
    expect(t('onb.basics.yearHint')).toBe('Pick your birth year to go on.');
    const s = source('features', 'onboarding', 'BasicsScreen.tsx');
    expect(s).toMatch(/disabled=\{b\.birthYear === null\}/);
    expect(s).toMatch(/b\.birthYear === null \? \(\s*<KText[^>]*>\s*\{t\('onb\.basics\.yearHint'\)\}/);
  });

  test('BY3: under 18 still asks once, then sets the Keychain lock', () => {
    const s = source('features', 'onboarding', 'BasicsScreen.tsx');
    expect(s).toMatch(/isUnderAge\(b\.birthYear, year\)/);
    expect(s).toMatch(/Alert\.alert\(t\('onb\.age\.confirm\.title'/);
    expect(s).toMatch(/await setAgeBlocked\(true\)/);
  });

  test('BY4: Consent echoes the year alone; its text and version are unchanged', () => {
    expect(basicsEcho({ ...EMPTY_BASICS, birthYear: 2004 })).toBe('Born in 2004');
    // An older draft's answers are still saved (BY6) but no longer echoed.
    expect(basicsEcho({ heightIn: 70, build: 'slim', fit: 'relaxed', birthYear: 2005 })).toBe('Born in 2005');
    expect(CONSENT_VERSION).toBe('2');
    expect(t('onb.consent.sent3')).toMatch(/height and build if you gave them/);
  });

  test('BY5: a setup finished on the new step saves no height, build or fit', async () => {
    const store = createMemoryStore();
    await store.init();
    await store.setKv(LOOKS_KEY, JSON.stringify(['streetwear']));
    await store.setKv(BASICS_KEY, JSON.stringify({ birthYear: 2004 }));
    await completeOnboarding(store, answersFromDraft(await loadDraft(store), true), 1_000, ids);
    expect(await store.profile.get('me')).toMatchObject({ birthYear: 2004, heightCm: null, build: '', fitPreference: '', consentVersion: CONSENT_VERSION });
  });

  test('BY6: a draft from an older build keeps the answers he gave', async () => {
    const store = createMemoryStore();
    await store.init();
    await store.setKv(BASICS_KEY, JSON.stringify({ heightIn: 72, build: 'broad', fit: 'fitted', birthYear: 2001 }));
    const a = answersFromDraft(await loadDraft(store), false);
    expect(a).toMatchObject({ heightCm: 183, build: 'broad', fitPreference: 'fitted', birthYear: 2001, consent: false });
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

import { createMemoryStore } from '@/data/memoryStore';
import {
  basicsEcho, BASICS_KEY, birthYearAnchor, birthYears, EMPTY_BASICS, heightLabel, inchesToCm, isUnderAge, loadDraft, looksEcho, looksReply, LOOKS_KEY, parseBasics, stepHeight,
} from '@/features/onboarding/basics';
import { completeOnboarding, CONSENT_VERSION, giveConsent, hasConsent } from '@/features/onboarding/complete';
import { mayUpload, withdrawConsent } from '@/features/privacy/wipe';
import { routedSource } from '@/services/readingSource/live';
import type { ReadingSource } from '@/services/readingSource/types';

const ids = (() => { let n = 0; return (p: string) => `${p}-${++n}`; })();
const answers = { styles: [['streetwear', 1]] as const, heightCm: null, build: 'average', fitPreference: 'regular', birthYear: 2004 };

describe('onboarding basics (02 D3)', () => {
  it('height starts blank, the first tap seeds 5′10″, and stays in 4′10″–7′0″', () => {
    expect(stepHeight(null, 1)).toBe(70);
    expect(stepHeight(null, -1)).toBe(70);
    expect(stepHeight(58, -1)).toBe(58);
    expect(stepHeight(84, 1)).toBe(84);
    expect(heightLabel(70)).toBe('5′ 10″');
    expect(inchesToCm(70)).toBe(178);
  });

  it('blocks under 18 by the year picked, and the wheel never preselects', () => {
    expect(isUnderAge(2009, 2026)).toBe(true);
    expect(isUnderAge(2008, 2026)).toBe(false);
    const years = birthYears(2026);
    expect(years[0]).toBe(2016);
    expect(years).toContain(2009);
    expect(parseBasics(null).birthYear).toBeNull();
  });

  it('echoes the looks and replies with the template', () => {
    expect(looksEcho([])).toBe('Not sure yet');
    expect(looksEcho(['streetwear', 'workwear'])).toBe('Streetwear · Workwear');
    expect(looksReply(['smart_casual', 'workwear'])).toBe('Smart casual with some workwear. Good mix. One more thing: your birth year.');
    expect(looksReply(['minimalist'])).toMatch(/^Minimal\. Good pick\./);
    // Since #370 O3 asks only the year, so Consent echoes it alone.
    expect(basicsEcho({ heightIn: null, build: 'average', fit: 'regular', birthYear: 2005 })).toBe('Born in 2005');
  });

  // #276: build and fit start blank (a preselected "Average · Regular" was saved as an answer he never gave), and the
  // year list opens near a 22-year-old's year without picking it.
  it('build and fit start blank and stay out of the echo until he taps one', () => {
    expect([EMPTY_BASICS.build, EMPTY_BASICS.fit, parseBasics(null).build, parseBasics(null).fit]).toEqual([null, null, null, null]);
    expect(parseBasics(JSON.stringify({ build: 'average', fit: 'nonsense', birthYear: 2005 }))).toMatchObject({ build: 'average', fit: null });
    expect(basicsEcho({ heightIn: null, build: null, fit: null, birthYear: 2005 })).toBe('Born in 2005');
    expect(birthYearAnchor(2026)).toBe(2004);
    expect(birthYears(2026)).toContain(birthYearAnchor(2026));
  });

  it('keeps the drafts between steps', async () => {
    const store = createMemoryStore();
    await store.init();
    await store.setKv(LOOKS_KEY, JSON.stringify(['workwear', 'gorpcore', 'nonsense']));
    await store.setKv(BASICS_KEY, JSON.stringify({ heightIn: 72, build: 'broad', fit: 'fitted', birthYear: 2001 }));
    const d = await loadDraft(store);
    expect(d.looks).toEqual(['workwear', 'outdoor']);
    expect(d.basics).toEqual({ heightIn: 72, build: 'broad', fit: 'fitted', birthYear: 2001 });
  });
});

describe('consent (02 D4)', () => {
  it('"Not now" saves the profile without consent; agreeing later turns it on', async () => {
    const store = createMemoryStore();
    await store.init();
    expect(await hasConsent(store)).toBe(false); // nothing agreed yet: the camera asks first
    await completeOnboarding(store, { ...answers, consent: false }, 1000, ids);
    const p = await store.profile.get('me');
    expect(p?.onboardingDone).toBe(true);
    expect(p?.consentVersion).toBeNull();
    expect(await hasConsent(store)).toBe(false);
    await giveConsent(store, 2000);
    expect((await store.profile.get('me'))?.consentAt).toBe(2000);
    expect(await hasConsent(store)).toBe(true);
  });

  it('agreeing with no profile yet (an install that skipped onboarding) is kept, so the camera never asks again', async () => {
    // Oct 14 loop: "Agree" saved nothing without a profile, so the camera asked after every photo, forever.
    const store = createMemoryStore();
    await store.init();
    expect(await hasConsent(store)).toBe(false);
    expect(await mayUpload(store)).toBe(false);
    await giveConsent(store, 3000);
    const p = await store.profile.get('me');
    expect(p?.consentVersion).toBe(CONSENT_VERSION);
    expect(p?.consentAt).toBe(3000);
    expect(p?.styles).toEqual([]);
    // The camera's ask and the upload's guard are one rule: both open now.
    expect(await hasConsent(store)).toBe(true);
    expect(await mayUpload(store)).toBe(true);
    await withdrawConsent(store);
    expect(await hasConsent(store)).toBe(false);
    expect(await mayUpload(store)).toBe(false);
  });

  it('a real photo never reaches the live source without consent', async () => {
    const calls: string[] = [];
    const mock: ReadingSource = { async *read() { calls.push('mock'); } };
    const src = routedSource(mock, async () => false);
    const image = { photoId: null, sha256: 'x', uploadUri: 'file://x', uploadBase64: 'abc' };
    const events = [];
    for await (const e of src.read(image, 'full')) events.push(e);
    expect(events).toEqual([]);
    expect(calls).toEqual(['mock']);
  });
});

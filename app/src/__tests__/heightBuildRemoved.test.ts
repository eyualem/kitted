// Height and build removed; fit stays as one quick question (10-onboarding.md §11, #375). After the blind test (#374)
// showed they didn't change Kit's advice. Checks HB1–HB14, written before the code.
import { US_EASTERN } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { MIGRATIONS } from '@/data/migrations';
import { loadScenario } from '@/data/seedLoader';
import type { ChatMessage, FitCheckRow, ProfileRow } from '@/data/types';
import { buildStylistContext } from '@/features/ask/context';
import { loadStylistSnapshot } from '@/features/ask/snapshot';
import { ABOUT_YOU_KEY, aboutYouCardView, fitGiven, parseAboutYou } from '@/features/aboutYou/rules';
import { createAboutYouService } from '@/features/aboutYou/service';
import { FINISH_KEY } from '@/features/finish/service';
import { NO_FINISH } from '@/features/finish/sequence';
import { answersFromDraft, BASICS_KEY, loadDraft } from '@/features/onboarding/basics';
import { CONSENT_VERSION } from '@/features/onboarding/complete';
import { basicsLine, styleCardSpoken } from '@/features/you/profile';
import { rowToData } from '@/sync/codec';
import { en, t } from '@/i18n/en';
import { manualClock } from '@/services/clock';

declare const __dirname: string;
const { readFileSync, existsSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string; existsSync(p: string): boolean }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');
const { DatabaseSync } = jest.requireActual<{ DatabaseSync: new (p: string) => { exec(s: string): void; prepare(s: string): { all(): Record<string, unknown>[] } } }>('node:sqlite');
const src = (...p: string[]) => readFileSync(join(__dirname, '..', ...p), 'utf8');
const root = (...p: string[]) => join(__dirname, '../../..', ...p);

const T0 = Date.UTC(2026, 9, 24, 15, 0);
const HOUR = 3_600_000;

function profile(o: Partial<ProfileRow> = {}): ProfileRow {
  return {
    id: 'me', birthYear: 2004, heightCm: null, build: '', fitPreference: '', styles: [['streetwear', 1]], boldness: null, budget: null,
    lastOccasion: 'everyday', consentVersion: '2', consentAt: T0 - 86_400_000, onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: T0 - 86_400_000, ...o,
  } as ProfileRow;
}

function check(id: string, createdAt: number): FitCheckRow {
  return {
    id, createdAt, dayKey: '2026-10-24', photoFile: null, thumbFile: null, demoPhotoId: 'p01b', imageHash: id, occasion: 'everyday', style: null,
    status: 'scored', isPartial: false, notRated: [], score: 7.5, rawScore: 7.5, subscores: {}, occasionAdj: 0, rulesFired: [], credits: [], advice: [],
    fixes: [], explanation: null, rubricVersion: 'parts', isFavorite: false, snapState: 'none', recheckUsed: false, isFirstCheck: false, readingId: null,
    parentId: null, itemIds: [], details: {},
  } as FitCheckRow;
}

/** A store where his old profile still has a height and a build (a phone from before #375). */
async function oldPhone() {
  const store = createMemoryStore();
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN });
  const p = await store.profile.get('me');
  await store.profile.put({ ...p!, heightCm: 193, build: 'broad', fitPreference: 'regular' });
  return store;
}

describe("Kit's pack (HB1–HB2)", () => {
  test('HB1: no Height or Build line, even from an old stored profile; the fit stays', async () => {
    const store = await oldPhone();
    const ctx = buildStylistContext(await loadStylistSnapshot(store, manualClock(T0)), 'How should chinos fit?');
    expect(ctx.text).not.toMatch(/Height:|Build:/);
    expect(ctx.text).toMatch(/Prefers a regular fit/);
  });

  test('HB2: the snapshot carries no height or build', async () => {
    const snap = await loadStylistSnapshot(await oldPhone(), manualClock(T0));
    expect(snap.profile).not.toHaveProperty('heightCm');
    expect(snap.profile).not.toHaveProperty('build');
    expect(src('features', 'ask', 'prepare.ts')).not.toMatch(/hasBody/);
  });
});

describe('You (HB3–HB5)', () => {
  test('HB3: the style profile and its fields have no height or build control', () => {
    for (const f of [['app', '(tabs)', 'you', 'profile.tsx'], ['features', 'you', 'BasicsFields.tsx']]) {
      const s = src(...f);
      expect(s).not.toMatch(/HeightStepper|onb\.basics\.height|onb\.basics\.build|BUILDS|stepHeight/);
    }
    expect(src('features', 'you', 'BasicsFields.tsx')).toMatch(/onb\.basics\.fit/);
    expect(src('app', '(tabs)', 'you', 'profile.tsx')).toMatch(/onb\.basics\.birthYear/);
  });

  test('HB4: the basics line and its spoken label show only the fit', () => {
    const p = profile({ heightCm: 193, build: 'broad', fitPreference: 'regular' });
    expect(basicsLine(p)).toBe('Regular fit');
    expect(styleCardSpoken(p)).not.toMatch(/feet|inches|cm|build|broad/i);
    expect(styleCardSpoken(p)).toMatch(/Regular fit/);
  });

  test('HB5: Settings has no Units row', () => {
    // T34: Settings' rows moved to You (features/settings/SettingsRows.tsx); the page itself is gone.
    expect(src('features', 'settings', 'SettingsRows.tsx')).not.toMatch(/settings\.units|UNIT_OPTIONS/);
  });
});

describe('the card (HB6–HB8)', () => {
  test('HB6: one quick fit question, no sheet', () => {
    const v = aboutYouCardView({ variant: 'visit', state: 'open' }, false, false);
    expect(v.title).toBe('How do you like clothes to fit?');
    expect([v.tagLeft, v.tagRight]).toEqual(['Optional', 'One tap']);
    expect(v.body).toBe("I'll use it when I suggest pieces and sizes. It never changes a score.");
    expect(aboutYouCardView({ variant: 'answer', state: 'open' }, false, false).body).toBe('That answer would fit you better if I knew how you like clothes to fit. It never changes a score.');
    expect(v.choices).toBe(true);
    expect(src('features', 'aboutYou', 'AboutYouCard.tsx')).not.toMatch(/about\.add|sheets\/about-you/);
    expect(existsSync(join(__dirname, '..', 'features', 'aboutYou', 'AboutYouSheet.tsx'))).toBe(false);
    expect(existsSync(join(__dirname, '..', 'app', 'sheets', 'about-you.tsx'))).toBe(false);
    expect(src('app', '_layout.tsx')).not.toMatch(/sheets\/about-you/);
  });

  test('HB7: a tap saves only the fit and turns the card into the saved line', async () => {
    const store = createMemoryStore();
    await store.init();
    await store.profile.put(profile());
    await store.setKv(FINISH_KEY, JSON.stringify({ ...NO_FINISH, step: 'done' }));
    await store.fitChecks.put(check('FC1', T0 - HOUR));
    let n = 0;
    const svc = createAboutYouService({ store, now: () => T0, ids: (pfx) => `${pfx}-${++n}`, busy: () => false, held: async () => false, enabled: () => true });
    const id = (await svc.ensure())!;
    const before = await store.profile.get('me');
    await svc.pick(id, 'relaxed');
    expect(await store.profile.get('me')).toEqual({ ...before, fitPreference: 'relaxed' });
    const m = (await store.chat.get(id)) as ChatMessage;
    expect(m.payload.state).toBe('saved');
    expect(aboutYouCardView({ variant: 'visit', state: 'saved' }, true, false)).toMatchObject({ line: 'Got it. Change it any time in You.', choices: false });
    expect(await svc.ensure()).toBeNull();
    expect(parseAboutYou(await store.getKv(ABOUT_YOU_KEY)).posts).toBe(1);
  });

  test('HB8: only a fit counts as answered', () => {
    expect(fitGiven(profile({ heightCm: 178, build: 'slim' }))).toBe(false);
    expect(fitGiven(profile({ fitPreference: 'fitted' }))).toBe(true);
    expect(fitGiven(profile({ fitPreference: 'nonsense' }))).toBe(false);
    expect(fitGiven(null)).toBe(false);
  });
});

describe('stored data (HB9–HB11)', () => {
  test('HB9: an older onboarding draft keeps its fit and drops height and build', async () => {
    const store = createMemoryStore();
    await store.init();
    await store.setKv(BASICS_KEY, JSON.stringify({ heightIn: 72, build: 'broad', fit: 'fitted', birthYear: 2001 }));
    const a = answersFromDraft(await loadDraft(store), true);
    expect(a).toMatchObject({ fitPreference: 'fitted', birthYear: 2001 });
    expect(a).not.toHaveProperty('heightCm');
    expect(a).not.toHaveProperty('build');
  });

  test('HB10: migration V8 empties height and build and keeps the rest', () => {
    const db = new DatabaseSync(':memory:');
    for (const m of MIGRATIONS.filter((x) => x.version <= 7)) for (const s of m.statements) db.exec(s);
    db.exec(`INSERT INTO profile (id, birth_year, height_cm, build, fit_preference, styles, units) VALUES ('me', 2004, 183, 'broad', 'relaxed', '[["workwear",1]]', 'metric')`);
    const v8 = MIGRATIONS.find((m) => m.version === 8);
    expect(v8).toBeDefined();
    for (const s of v8!.statements) db.exec(s);
    expect(db.prepare('SELECT birth_year, height_cm, build, fit_preference, styles, units FROM profile').all()[0]).toEqual({
      birth_year: 2004, height_cm: null, build: '', fit_preference: 'relaxed', styles: '[["workwear",1]]', units: 'metric',
    });
  });

  test('HB11: sync never sends height or build', () => {
    const data = rowToData('profile', profile({ heightCm: 190, build: 'broad', fitPreference: 'regular' }));
    expect(data).not.toHaveProperty('heightCm');
    expect(data).not.toHaveProperty('build');
    expect(data).not.toHaveProperty('birthYear');
    expect(data).toHaveProperty('fitPreference');
  });
});

describe('what he agrees to (HB12–HB14)', () => {
  test('HB12: consent names the fit, not height or build; the version stays 2', () => {
    expect(t('onb.consent.sent3')).not.toMatch(/height|build/i);
    expect(t('onb.consent.sent3')).toMatch(/the fit you like if you gave it/);
    expect(CONSENT_VERSION).toBe('2');
  });

  test('HB13: the privacy manifest and the App Store label have no Other Data Types', () => {
    expect(readFileSync(root('app', 'app.config.ts'), 'utf8')).not.toMatch(/OtherDataTypes/);
    expect(readFileSync(root('market', 'app-store-connect.md'), 'utf8')).not.toMatch(/\*\*Other Data Types\*\*/);
  });

  test('HB14: no app string asks for or shows his height or build', () => {
    const keys = Object.keys(en);
    for (const k of ['you.basics.build', 'onb.basics.heightClear', 'onb.basics.heightClear.a11y', 'you.heightCm', 'about.add', 'about.sheet.title', 'about.sheet.note']) {
      expect(keys).not.toContain(k);
    }
    for (const k of keys.filter((x) => x.startsWith('about.'))) expect(String((en as Record<string, string>)[k])).not.toMatch(/height|build/i);
  });
});

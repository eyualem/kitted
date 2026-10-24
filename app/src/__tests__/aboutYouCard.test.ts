// Kit's "About you" card (10-onboarding.md §10.1–§10.2, #371): height, build and fit, asked once after the first score,
// first under an answer that would use them (T1), else on a later visit (T2). Checks AY1–AY11 and UN1, written before
// the code.
import index from '../../assets/demo-readings/INDEX.json';
import { createMemoryStore } from '@/data/memoryStore';
import type { ChatMessage, FitCheckRow, ProfileRow } from '@/data/types';
import { createOfferService } from '@/features/account/offerService';
import {
  ABOUT_YOU_KEY, AGAIN_AFTER_MS, aboutYouCardView, aboutYouDue, basicsGiven, canSave, MAX_POSTS, NO_ABOUT_YOU, parseAboutYou,
  type AboutYouInput,
} from '@/features/aboutYou/rules';
import { accountPostedSince, createAboutYouService } from '@/features/aboutYou/service';
import { FINISH_KEY } from '@/features/finish/service';
import { NO_FINISH } from '@/features/finish/sequence';
import { evaluateCheck } from '@/features/fitcheck/scoring';
import { lensInput, scoringProfile } from '@/features/fitcheck/service';
import { demoReadingById } from '@/services/readingSource/demoReadings';

declare const __dirname: string;
const { readFileSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');
const source = (...p: string[]) => readFileSync(join(__dirname, '..', ...p), 'utf8');

const T0 = Date.UTC(2026, 9, 22, 15, 0);
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

function check(id: string, createdAt: number, o: Partial<FitCheckRow> = {}): FitCheckRow {
  return {
    id, createdAt, dayKey: '2026-10-22', photoFile: null, thumbFile: null, demoPhotoId: 'p01b', imageHash: id, occasion: 'everyday', style: null,
    status: 'scored', isPartial: false, notRated: [], score: 7.5, rawScore: 7.5, subscores: {}, occasionAdj: 0, rulesFired: [], credits: [], advice: [],
    fixes: [], explanation: null, rubricVersion: 'parts', isFavorite: false, snapState: 'none', recheckUsed: false, isFirstCheck: false, readingId: null,
    parentId: null, itemIds: [], details: {}, ...o,
  } as FitCheckRow;
}

function profile(o: Partial<ProfileRow> = {}): ProfileRow {
  return {
    id: 'me', birthYear: 2004, heightCm: null, build: '', fitPreference: '', styles: [['streetwear', 1]], boldness: null, budget: null,
    lastOccasion: 'everyday', consentVersion: '2', consentAt: T0 - DAY, onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: T0 - DAY, ...o,
  } as ProfileRow;
}

const counterIds = () => { let n = 0; return (p: string) => `${p}-${++n}`; };

async function freshStore(o: { finish?: string; profile?: Partial<ProfileRow> } = {}) {
  const store = createMemoryStore();
  await store.init();
  await store.profile.put(profile(o.profile));
  if (o.finish) await store.setKv(FINISH_KEY, JSON.stringify({ ...NO_FINISH, step: o.finish }));
  return store;
}

/** A due answer-trigger input; each test changes one thing. */
const base = (o: Partial<AboutYouInput> = {}): AboutYouInput => ({
  trigger: { kind: 'answer', answerKind: 'fitHowTo' }, state: NO_ABOUT_YOU, basicsGiven: false,
  checks: [{ createdAt: T0 - HOUR, status: 'scored', recheck: false }], busy: false, held: false, finishStep: 'done',
  visitStartMs: T0, nowMs: T0, ...o,
});

describe('the rules (pure)', () => {
  test('AY1: never before his first scored full check, never while a check is busy', () => {
    expect(aboutYouDue(base()).kind).toBe('post');
    expect(aboutYouDue(base({ checks: [] })).kind).toBe('no');
    expect(aboutYouDue(base({ checks: [{ createdAt: T0 - HOUR, status: 'failed', recheck: false }] })).kind).toBe('no');
    expect(aboutYouDue(base({ checks: [{ createdAt: T0 - HOUR, status: 'scored', recheck: true }] })).kind).toBe('no');
    expect(aboutYouDue(base({ busy: true })).kind).toBe('no');
    expect(aboutYouDue(base({ trigger: { kind: 'visit' }, busy: true })).kind).toBe('no');
  });

  test('AY2: T1 posts under a fit, shape or buy answer, with its own body', () => {
    for (const answerKind of ['fitHowTo', 'shape', 'buyNext'] as const) {
      expect(aboutYouDue(base({ trigger: { kind: 'answer', answerKind } }))).toEqual({ kind: 'post', variant: 'answer' });
    }
    const v = aboutYouCardView({ variant: 'answer', state: 'open' }, false, false);
    expect(v.body).toBe('That answer would fit you better with your height and how you like clothes to fit. None of it changes a score.');
  });

  test('AY3: T1 never fires after another kind of answer', () => {
    for (const answerKind of ['whatToWear', 'explain', 'general', 'goesWith', 'canIWear', 'whatIf', 'remember', 'feedback', null] as const) {
      expect(aboutYouDue(base({ trigger: { kind: 'answer', answerKind } })).kind).toBe('no');
    }
  });

  test('AY4: T2 waits for a later visit and for the end-of-onboarding sequence to finish', () => {
    const visit = (o: Partial<AboutYouInput> = {}) => aboutYouDue(base({ trigger: { kind: 'visit' }, ...o }));
    expect(visit()).toEqual({ kind: 'post', variant: 'visit' });
    expect(visit({ finishStep: 'skipped' }).kind).toBe('post');
    for (const finishStep of ['waiting', 'moves', 'paywall'] as const) expect(visit({ finishStep }).kind).toBe('no');
    // The first check was scored in this visit: not yet.
    expect(visit({ checks: [{ createdAt: T0 + 5, status: 'scored', recheck: false }], nowMs: T0 + 10 }).kind).toBe('no');
    const v = aboutYouCardView({ variant: 'visit', state: 'open' }, false, false);
    expect(v.body).toBe("Tell me your height and how you like clothes to fit, and I'll size my suggestions to you. None of it changes a score.");
    expect([v.title, v.tagLeft, v.tagRight, v.buttons]).toEqual(['Fit advice that fits you', 'Optional', '10 seconds', true]);
  });

  test('AY5: one ask per visit: another ask this visit holds both triggers', () => {
    expect(aboutYouDue(base({ held: true })).kind).toBe('no');
    expect(aboutYouDue(base({ trigger: { kind: 'visit' }, held: true })).kind).toBe('no');
  });

  test('AY6: any of the three given means never again', () => {
    expect(basicsGiven(null)).toBe(false);
    expect(basicsGiven(profile())).toBe(false);
    expect(basicsGiven(profile({ heightCm: 178 }))).toBe(true);
    expect(basicsGiven(profile({ build: 'slim' }))).toBe(true);
    expect(basicsGiven(profile({ fitPreference: 'relaxed' }))).toBe(true);
    // A word that isn't one of the choices (an old or junk value) is not an answer.
    expect(basicsGiven(profile({ build: 'nonsense', fitPreference: '' }))).toBe(false);
    expect(aboutYouDue(base({ basicsGiven: true })).kind).toBe('no');
    // A card already in the thread: given since → the saved line; declined stays declined.
    expect(aboutYouCardView({ variant: 'visit', state: 'open' }, true, false).line).toBe('Saved. Change them any time in You.');
    expect(aboutYouCardView({ variant: 'visit', state: 'declined' }, true, false).line).toBe("No problem. They're in You → Style profile whenever you want.");
  });

  test('AY7: at most 2 posts, the second 7 days after a Not now', () => {
    const once = { posts: 1, lastPostAt: T0 - 8 * DAY, declinedAt: T0 - 8 * DAY };
    expect(MAX_POSTS).toBe(2);
    expect(AGAIN_AFTER_MS).toBe(7 * DAY);
    expect(aboutYouDue(base({ state: once })).kind).toBe('post');
    expect(aboutYouDue(base({ state: { ...once, declinedAt: T0 - 6 * DAY } })).kind).toBe('no');
    // Posted once and never answered: no second post.
    expect(aboutYouDue(base({ state: { ...once, declinedAt: null } })).kind).toBe('no');
    expect(aboutYouDue(base({ state: { posts: 2, lastPostAt: T0 - 30 * DAY, declinedAt: T0 - 30 * DAY } })).kind).toBe('no');
    expect(parseAboutYou('{bad')).toEqual(NO_ABOUT_YOU);
    expect(parseAboutYou(JSON.stringify(once))).toEqual(once);
  });

  test('AY8 (rule): Save is off until one value is set', () => {
    expect(canSave({ heightIn: null, build: null, fit: null })).toBe(false);
    expect(canSave({ heightIn: 70, build: null, fit: null })).toBe(true);
    expect(canSave({ heightIn: null, build: 'slim', fit: null })).toBe(true);
    expect(canSave({ heightIn: null, build: null, fit: 'regular' })).toBe(true);
  });

  test('AY10: Past chats show it read-only', () => {
    const v = aboutYouCardView({ variant: 'answer', state: 'open' }, false, true);
    expect(v.buttons).toBe(false);
    expect(v.title).toBe('Fit advice that fits you');
  });
});

describe('the service', () => {
  const svcFor = (store: Awaited<ReturnType<typeof freshStore>>, o: { now?: () => number; held?: () => Promise<boolean>; busy?: () => boolean } = {}) =>
    createAboutYouService({ store, now: o.now ?? (() => T0), ids: counterIds(), busy: o.busy ?? (() => false), held: o.held ?? (async () => false), enabled: () => true });

  test('AY2/AY3 (service): T1 posts right under the answer, once, and only after a real answer', async () => {
    const store = await freshStore({ finish: 'done' });
    await store.fitChecks.put(check('FC1', T0 - HOUR));
    const svc = svcFor(store);
    expect(await svc.afterAnswer({ kind: 'whatToWear', at: T0 })).toBeNull();
    expect(await svc.afterAnswer({ kind: 'fitHowTo', at: T0, uncounted: true })).toBeNull();
    expect(await svc.afterAnswer({ kind: 'fitHowTo', at: T0, refused: true })).toBeNull();
    const id = await svc.afterAnswer({ kind: 'fitHowTo', at: T0 });
    expect(id).not.toBeNull();
    const m = (await store.chat.get(id!)) as ChatMessage;
    expect([m.kind, m.cardType, m.payload.variant, m.payload.state, m.createdAt]).toEqual(['card', 'aboutYou', 'answer', 'open', T0 + 1]);
    expect(await svc.afterAnswer({ kind: 'shape', at: T0 + 100 })).toBeNull();
    expect(parseAboutYou(await store.getKv(ABOUT_YOU_KEY)).posts).toBe(1);
  });

  test('AY4 (service): T2 posts on a later visit once the sequence is done; not while it runs', async () => {
    const running = await freshStore({ finish: 'moves' });
    await running.fitChecks.put(check('FC1', T0 - HOUR));
    expect(await svcFor(running).ensure()).toBeNull();
    const store = await freshStore({ finish: 'done' });
    await store.fitChecks.put(check('FC1', T0 - HOUR));
    const id = await svcFor(store).ensure();
    expect(((await store.chat.get(id!)) as ChatMessage).payload.variant).toBe('visit');
  });

  test('AY5 (service): held by another ask this visit; once posted, it holds the save offer for the rest of the visit', async () => {
    const store = await freshStore({ finish: 'done' });
    await store.fitChecks.put(check('FC1', T0 - HOUR));
    let held = true;
    let now = T0;
    const svc = svcFor(store, { held: async () => held, now: () => now });
    expect(await svc.ensure()).toBeNull();
    expect(await svc.postedThisVisit()).toBe(false);
    held = false;
    expect(await svc.ensure()).not.toBeNull();
    expect(await svc.postedThisVisit()).toBe(true);
    const offer = createOfferService({ store, now: () => now, ids: counterIds(), busy: () => false, enabled: () => true, holds: () => svc.postedThisVisit() });
    expect(await offer.ensure()).toBeNull();
    // The next visit: the offer may come.
    svc.left();
    now += 31 * 60_000;
    svc.back();
    expect(await svc.postedThisVisit()).toBe(false);
    expect(await offer.ensure()).not.toBeNull();
    // And the save offer posted this visit holds the card (accountPostedSince is what the app's `held` reads).
    expect(await accountPostedSince(store, now - 1)).toBe(true);
    expect(await accountPostedSince(store, now + 1)).toBe(false);
    expect(source('features', 'account', 'offerSession.ts')).toMatch(/aboutYou\.postedThisVisit\(\)/);
    expect(source('features', 'aboutYou', 'session.ts')).toMatch(/accountPostedSince\(/);
    expect(source('features', 'aboutYou', 'session.ts')).toMatch(/finish\.holdsOffer\(\)/);
  });

  test('AY6 (service): never posts once any of the three is given', async () => {
    const store = await freshStore({ finish: 'done', profile: { fitPreference: 'regular' } });
    await store.fitChecks.put(check('FC1', T0 - HOUR));
    const svc = svcFor(store);
    expect(await svc.ensure()).toBeNull();
    expect(await svc.afterAnswer({ kind: 'fitHowTo', at: T0 })).toBeNull();
  });

  test('AY8: Save writes the profile through You\'s code and marks the card saved', async () => {
    const store = await freshStore({ finish: 'done' });
    await store.fitChecks.put(check('FC1', T0 - HOUR));
    const svc = svcFor(store);
    const id = (await svc.ensure())!;
    expect(await svc.save(id, { heightIn: null, build: null, fit: null })).toBe(false);
    expect(await svc.save(id, { heightIn: 70, build: null, fit: 'relaxed' })).toBe(true);
    expect(await store.profile.get('me')).toMatchObject({ heightCm: 178, build: '', fitPreference: 'relaxed', birthYear: 2004, styles: [['streetwear', 1]] });
    expect((await store.chat.get(id))!.payload.state).toBe('saved');
    expect(source('features', 'aboutYou', 'service.ts')).toMatch(/from '@\/features\/you\/profile'/);
  });

  test('AY9: Not now folds the card, survives a reload, and posts nothing else', async () => {
    const store = await freshStore({ finish: 'done' });
    await store.fitChecks.put(check('FC1', T0 - HOUR));
    const id = (await svcFor(store).ensure())!;
    await svcFor(store).notNow(id);
    expect((await store.chat.get(id))!.payload.state).toBe('declined');
    expect(parseAboutYou(await store.getKv(ABOUT_YOU_KEY))).toMatchObject({ posts: 1, declinedAt: T0 });
    const reloaded = svcFor(store, { now: () => T0 + 2 * HOUR });
    expect(await reloaded.ensure()).toBeNull();
    expect(await reloaded.afterAnswer({ kind: 'fitHowTo', at: T0 + 2 * HOUR })).toBeNull();
    expect((await store.chat.all()).filter((m) => m.cardType === 'aboutYou')).toHaveLength(1);
  });

  test('AY11: the sheet and You → Style profile use one fields component', () => {
    for (const f of [['app', '(tabs)', 'you', 'profile.tsx'], ['features', 'aboutYou', 'AboutYouSheet.tsx']]) {
      expect(source(...f)).toMatch(/import \{ BasicsFields\b[^}]*\} from '@\/features\/you\/BasicsFields'/);
    }
    expect(source('app', '(tabs)', 'you', 'profile.tsx')).not.toMatch(/function HeightStepper/);
  });
});

describe('what must not move (UN)', () => {
  test('UN1: every demo photo scores the same with height, build and fit blank or set', () => {
    const blank = scoringProfile(profile());
    const set = scoringProfile(profile({ heightCm: 190, build: 'broad', fitPreference: 'fitted' }));
    expect(set).toEqual(blank);
    let n = 0;
    for (const p of index.photos) {
      const reading = demoReadingById(p.id);
      if (!reading) continue;
      const score = (prof: typeof blank) => evaluateCheck({ reading, closet: [], firstCheck: false, ...lensInput('everyday', null, prof) }).row.score;
      expect(score(set)).toBe(score(blank));
      n++;
    }
    expect(n).toBeGreaterThan(10);
    // The fit check reads the profile only through scoringProfile.
    expect(source('features', 'fitcheck', 'service.ts')).toMatch(/scoringProfile\(await store\.profile\.get\('me'\)\)/);
  });
});

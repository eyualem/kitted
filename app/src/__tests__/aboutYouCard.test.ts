// Kit's "About you" card (10-onboarding.md §10.1–§10.2, #373): asked once after the first score, first under an answer
// that would use it (T1), else on a later visit (T2). Checks AY1–AY11 and UN1, written before the code. Since #375
// (§11) it asks only how he likes clothes to fit: height and build are gone (heightBuildRemoved.test.ts).
import index from '../../assets/demo-readings/INDEX.json';
import { createMemoryStore } from '@/data/memoryStore';
import type { ChatMessage, FitCheckRow, ProfileRow } from '@/data/types';
import { createOfferService } from '@/features/account/offerService';
import {
  ABOUT_YOU_KEY, AGAIN_AFTER_MS, aboutYouCardView, aboutYouDue, fitGiven, MAX_POSTS, NO_ABOUT_YOU, parseAboutYou,
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
  trigger: { kind: 'answer', answerKind: 'fitHowTo' }, state: NO_ABOUT_YOU, fitGiven: false,
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
    expect(v.body).toBe('That answer would fit you better if I knew how you like clothes to fit. It never changes a score.');
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
    expect(v.body).toBe("I'll use it when I suggest pieces and sizes. It never changes a score.");
    expect([v.title, v.tagLeft, v.tagRight, v.choices]).toEqual(['How do you like clothes to fit?', 'Optional', 'One tap', true]);
  });

  test('AY5: one ask per visit: another ask this visit holds both triggers', () => {
    expect(aboutYouDue(base({ held: true })).kind).toBe('no');
    expect(aboutYouDue(base({ trigger: { kind: 'visit' }, held: true })).kind).toBe('no');
  });

  test('AY6: a fit given means never again', () => {
    expect(fitGiven(null)).toBe(false);
    expect(fitGiven(profile())).toBe(false);
    expect(fitGiven(profile({ fitPreference: 'relaxed' }))).toBe(true);
    // A word that isn't one of the choices (an old or junk value) is not an answer.
    expect(fitGiven(profile({ fitPreference: 'nonsense' }))).toBe(false);
    expect(aboutYouDue(base({ fitGiven: true })).kind).toBe('no');
    // A card already in the thread: given since → the saved line; declined stays declined.
    expect(aboutYouCardView({ variant: 'visit', state: 'open' }, true, false).line).toBe('Got it. Change it any time in You.');
    expect(aboutYouCardView({ variant: 'visit', state: 'declined' }, true, false).line).toBe("No problem. It's in You → Style profile whenever you want.");
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

  test('AY10: Past chats show it read-only', () => {
    const v = aboutYouCardView({ variant: 'answer', state: 'open' }, false, true);
    expect(v.choices).toBe(false);
    expect(v.title).toBe('How do you like clothes to fit?');
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

  test('AY6 (service): never posts once a fit is given', async () => {
    const store = await freshStore({ finish: 'done', profile: { fitPreference: 'regular' } });
    await store.fitChecks.put(check('FC1', T0 - HOUR));
    const svc = svcFor(store);
    expect(await svc.ensure()).toBeNull();
    expect(await svc.afterAnswer({ kind: 'fitHowTo', at: T0 })).toBeNull();
  });

  test('AY8: a tap writes the fit through You\'s code and marks the card saved', async () => {
    const store = await freshStore({ finish: 'done' });
    await store.fitChecks.put(check('FC1', T0 - HOUR));
    const svc = svcFor(store);
    const id = (await svc.ensure())!;
    await svc.pick(id, 'relaxed');
    expect(await store.profile.get('me')).toMatchObject({ heightCm: null, build: '', fitPreference: 'relaxed', birthYear: 2004, styles: [['streetwear', 1]] });
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

  test('AY11: the card and You → Style profile offer the same fit choices', () => {
    expect(source('app', '(tabs)', 'you', 'profile.tsx')).toMatch(/import \{ BasicsFields\b[^}]*\} from '@\/features\/you\/BasicsFields'/);
    expect(source('features', 'aboutYou', 'AboutYouCard.tsx')).toMatch(/FITS/);
    expect(source('features', 'you', 'BasicsFields.tsx')).toMatch(/FITS/);
  });
});

describe('what must not move (UN)', () => {
  test('UN1: every demo photo scores the same with height, build and fit blank or set (and with any fit)', () => {
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

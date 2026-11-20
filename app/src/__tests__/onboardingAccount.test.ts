// The onboarding and account checks set before building (handoff/10-onboarding.md §6): F1–F7 and A1–A9, as far as
// they can be checked without a screen. T41 removed email sign-in (A1–A3's email lines, specs/sign-in-and-backup.md SB2.1)
// and the chat count from the restore (SB6.1); the T41-*.test files carry the new checks. The screens themselves were checked in the preview (DECISIONS-LOG #289).
import { createMemoryStore } from '@/data/memoryStore';
import type { ChatMessage, FitCheckRow } from '@/data/types';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { ACCOUNTS_BUILT } from '@/config/features';
import {
  accountsOn, afterSignIn, getAccount, getOffer, parseAccount, parseRestoreParam, restoreParam, saveAccount, setDemoAccounts, signOut,
} from '@/features/account/account';
import { createMockAuth, MOCK_HOLDINGS, type AccountUser, type MockScript } from '@/features/account/auth';
import { CHECKS_BEFORE_SECOND, NEW_VISIT_AFTER_MS, NO_OFFER, nextVisitStart, offerDue, parseOffer, type OfferCheck, type OfferInput } from '@/features/account/offer';
import { createOfferService } from '@/features/account/offerService';
import { exampleCheck } from '@/features/onboarding/exampleCheck';
import { welcomeExample } from '@/features/onboarding/welcomeExample';
import { clearResumeStep, ONBOARDING_STEPS, loadResumeStep, parseStep, resumeHref, resumeStepAtLaunch, setResumeStep } from '@/features/onboarding/resume';
import { buildStylistContext } from '@/features/ask/context';
import { loadStylistSnapshot } from '@/features/ask/snapshot';
import { en, t } from '@/i18n/en';

const T0 = Date.parse('2026-10-22T11:00:00Z');
const user = (o: Partial<AccountUser> = {}): AccountUser => ({ uid: 'u1', provider: 'apple', email: 'k7p2xq9wmd@privaterelay.appleid.com', signedInAt: T0, ...o });

function check(id: string, createdAt: number, o: Partial<FitCheckRow> = {}): FitCheckRow {
  return {
    id, createdAt, dayKey: '2026-10-22', photoFile: null, thumbFile: null, demoPhotoId: 'p01b', imageHash: id, occasion: 'everyday', style: null,
    status: 'scored', isPartial: false, notRated: [], score: 7.5, rawScore: 7.5, subscores: {}, occasionAdj: 0, rulesFired: [], credits: [], advice: [],
    fixes: [], explanation: null, rubricVersion: 'parts', isFavorite: false, snapState: 'none', recheckUsed: false, isFirstCheck: false, readingId: null,
    parentId: null, itemIds: [], details: {}, ...o,
  } as FitCheckRow;
}

async function freshStore() {
  const store = createMemoryStore();
  await store.init();
  return store;
}

describe('A2 · the sign-in outcomes (MockAuth, the shape FirebaseAuth will return)', () => {
  const run = (s: MockScript) => createMockAuth({ script: () => s, latencyMs: 0, now: () => T0 });
  it('scripts every result the sheet handles', async () => {
    expect((await run('cancel').signIn('apple')).kind).toBe('cancelled');
    expect((await run('error').signIn('google')).kind).toBe('failed');
    expect((await run('offline').signIn('apple')).kind).toBe('offline');
    const ok = await run('ok').signIn('apple');
    expect(ok.kind === 'ok' && ok.holdings).toBeNull();
    const ex = await run('existing').signIn('google');
    expect(ex.kind === 'ok' && ex.holdings).toEqual(MOCK_HOLDINGS);
  });
});

describe('A6 · when "Keep your fits" is offered', () => {
  const base = (o: Partial<OfferInput> = {}): OfferInput => ({
    enabled: true, signedIn: false, busy: false, state: { ...NO_OFFER }, checks: [{ createdAt: T0, status: 'scored', recheck: false }], visitStartMs: T0 - 1000, ...o,
  });

  it('never before a scored fit, never while reading, never signed in, never when off', () => {
    expect(offerDue(base({ checks: [] }))).toBe(false);
    expect(offerDue(base({ checks: [{ createdAt: T0 - 9e6, status: 'failed', recheck: false }], visitStartMs: T0 }))).toBe(false);
    expect(offerDue(base({ checks: [{ createdAt: T0 - 9e6, status: 'held', recheck: false }], visitStartMs: T0 }))).toBe(false);
    expect(offerDue(base({ visitStartMs: T0 + 1, busy: true }))).toBe(false);
    expect(offerDue(base({ visitStartMs: T0 + 1, signedIn: true }))).toBe(false);
    expect(offerDue(base({ visitStartMs: T0 + 1, enabled: false }))).toBe(false);
  });

  it('first offer: not in the visit that scored his first fit, unless his first re-check came back', () => {
    expect(offerDue(base())).toBe(false);
    expect(offerDue(base({ visitStartMs: T0 + 1 }))).toBe(true);
    expect(offerDue(base({ checks: [{ createdAt: T0, status: 'scored', recheck: false }, { createdAt: T0 + 60_000, status: 'scored', recheck: true }] }))).toBe(true);
  });

  it('second offer only after Not now and 3 more scored checks; never a third', () => {
    const checks = (n: number): OfferCheck[] => Array.from({ length: n }, (_, i) => ({ createdAt: T0 - (n - i) * 1000, status: 'scored', recheck: false }));
    const shownOnce = { shown: 1, declined: true, checksAtDecline: 1 };
    expect(offerDue(base({ state: { shown: 1, declined: false, checksAtDecline: null }, checks: checks(9) }))).toBe(false);
    expect(offerDue(base({ state: shownOnce, checks: checks(1 + CHECKS_BEFORE_SECOND - 1) }))).toBe(false);
    expect(offerDue(base({ state: shownOnce, checks: checks(1 + CHECKS_BEFORE_SECOND) }))).toBe(true);
    expect(offerDue(base({ state: { shown: 2, declined: true, checksAtDecline: 4 }, checks: checks(40) }))).toBe(false);
  });

  it('a new visit starts after 30 minutes away', () => {
    expect(nextVisitStart(T0, null, T0 + 5)).toBe(T0);
    expect(nextVisitStart(T0, T0 + 1000, T0 + 1000 + NEW_VISIT_AFTER_MS - 1)).toBe(T0);
    expect(nextVisitStart(T0, T0 + 1000, T0 + 1000 + NEW_VISIT_AFTER_MS)).toBe(T0 + 1000 + NEW_VISIT_AFTER_MS);
    expect(parseOffer('{bad')).toEqual(NO_OFFER);
  });

  it('the service posts one inline card, folds on Not now, and offers once more after 3 checks', async () => {
    const store = await freshStore();
    let now = T0;
    let busy = false;
    const svc = createOfferService({ store, now: () => now, ids: counterIds(), busy: () => busy, enabled: () => true });
    await store.fitChecks.put(check('FC1', T0 - 3_600_000));
    // This visit started after the first fit was scored (a later launch).
    busy = true;
    expect(await svc.ensure()).toBeNull();
    busy = false;
    const id = await svc.ensure();
    expect(id).not.toBeNull();
    expect(await svc.ensure()).toBeNull(); // never twice in a row
    const card = (await store.chat.get(id!)) as ChatMessage;
    expect([card.kind, card.cardType, card.payload.state]).toEqual(['card', 'account', 'open']);
    await svc.decline(id!);
    expect((await store.chat.get(id!))!.payload.state).toBe('declined');
    expect(await getOffer(store)).toEqual({ shown: 1, declined: true, checksAtDecline: 1 });
    for (let i = 2; i <= 3; i++) await store.fitChecks.put(check(`FC${i}`, T0 + i));
    expect(await svc.ensure()).toBeNull();
    await store.fitChecks.put(check('FC4', T0 + 4));
    now += 10;
    const second = await svc.ensure();
    expect(second).not.toBeNull();
    await svc.decline(second!);
    for (let i = 5; i <= 20; i++) await store.fitChecks.put(check(`FC${i}`, T0 + i));
    expect(await svc.ensure()).toBeNull();
    expect((await store.chat.all()).filter((m) => m.cardType === 'account')).toHaveLength(2);
  });

  it('not while a check is still reading in the store, and not once signed in', async () => {
    const store = await freshStore();
    const svc = createOfferService({ store, now: () => T0, ids: counterIds(), busy: () => false, enabled: () => true });
    await store.fitChecks.put(check('FC1', T0 - 3_600_000));
    await store.fitChecks.put(check('FC2', T0 - 1000, { status: 'scoring' }));
    expect(await svc.ensure()).toBeNull();
    await store.fitChecks.put(check('FC2', T0 - 1000, { status: 'scored' }));
    await saveAccount(store, user());
    expect(await svc.ensure()).toBeNull();
  });
});

describe('A4–A5 · after a sign-in', () => {
  const ok = (holdings: typeof MOCK_HOLDINGS | null) => ({ kind: 'ok' as const, user: user(), holdings });

  it('from Welcome: an empty account goes on with setup, signed in', async () => {
    const store = await freshStore();
    expect(await afterSignIn(store, 'welcome', ok(null))).toEqual({ next: 'setup' });
    expect(await getAccount(store)).toEqual(user());
  });

  it("from Welcome: an account with fits asks the birth year first, then restores (it never syncs)", async () => {
    const store = await freshStore();
    expect(await afterSignIn(store, 'welcome', ok(MOCK_HOLDINGS))).toEqual({ next: 'restore', holdings: MOCK_HOLDINGS });
    expect(parseRestoreParam(restoreParam(MOCK_HOLDINGS))).toEqual(MOCK_HOLDINGS);
    // T41 (SB6.1): two numbers, no chat count; the old three-number param is nothing.
    expect(parseRestoreParam('214,38')).toEqual({ fits: 214, pieces: 38 });
    expect(parseRestoreParam('214,38,61')).toBeNull();
    expect(parseRestoreParam(undefined)).toBeNull();
  });

  it('fits on both sides: asks first and saves nothing until he picks', async () => {
    const store = await freshStore();
    await store.fitChecks.put(check('FC1', T0));
    await store.fitChecks.put(check('FC2', T0 + 1, { parentId: 'FC1' }));
    const r = await afterSignIn(store, 'offer', ok(MOCK_HOLDINGS));
    expect(r).toMatchObject({ next: 'choose', localFits: 1 });
    expect(await getAccount(store)).toBeNull();
    expect((await store.fitChecks.all()).length).toBe(2);
  });

  it('an account with fits on a phone with none just signs in', async () => {
    const store = await freshStore();
    expect(await afterSignIn(store, 'settings', ok(MOCK_HOLDINGS))).toEqual({ next: 'done' });
    expect(await getAccount(store)).not.toBeNull();
  });
});

describe('A7 · signed in, then out', () => {
  it('sign out removes the account and keeps his fits on the phone', async () => {
    const store = await freshStore();
    await store.fitChecks.put(check('FC1', T0));
    await saveAccount(store, user());
    await signOut(store, createMockAuth({ latencyMs: 0 }));
    expect(await getAccount(store)).toBeNull();
    expect(await store.fitChecks.get('FC1')).not.toBeNull();
  });

  it('a damaged account row reads as signed out', () => {
    expect(parseAccount('{"uid":"","provider":"apple"}')).toBeNull();
    expect(parseAccount('{"uid":"x","provider":"facebook"}')).toBeNull();
    expect(parseAccount('nope')).toBeNull();
  });
});

describe('A8 · the account never reaches the stylist', () => {
  it("the context pack has no email, uid or provider", async () => {
    const store = await freshStore();
    await saveAccount(store, user({ email: 'sam.lee@gmail.com', uid: 'uid-secret' }));
    await store.chat.put({ id: 'M1', createdAt: T0, role: 'stylist', kind: 'card', text: null, cardType: 'account', fitCheckId: null, outfitId: null, itemId: null, chips: [], payload: { state: 'open', pieces: 4 } });
    const ctx = buildStylistContext(await loadStylistSnapshot(store, manualClock(T0)), 'What goes with olive chinos?');
    const text = JSON.stringify(ctx);
    expect(text).not.toMatch(/sam\.lee|uid-secret|privaterelay|"apple"/i);
  });
});

describe('A9 · off in real builds', () => {
  it('accounts are off until Firebase; only a demo screen turns them on', () => {
    expect(ACCOUNTS_BUILT).toBe(false);
    setDemoAccounts(null);
    expect(accountsOn()).toBe(false);
    setDemoAccounts('ok');
    expect(accountsOn()).toBe(true);
    setDemoAccounts(null);
    expect(accountsOn()).toBe(false);
  });
});

describe('F4–F5 · resume and progress', () => {
  it('reopens on the step he reached; the old "1" means past Welcome', async () => {
    const store = await freshStore();
    expect(parseStep(null)).toBeNull();
    expect(parseStep('1')).toBe('looks');
    expect(parseStep('nonsense')).toBeNull();
    expect(resumeHref(null)).toBe('/onboarding/welcome');
    await setResumeStep(store, 'basics');
    await loadResumeStep(store);
    expect(resumeHref(resumeStepAtLaunch())).toBe('/onboarding/basics');
    await clearResumeStep(store);
    expect(resumeStepAtLaunch()).toBeNull();
    await loadResumeStep(store);
    expect(resumeStepAtLaunch()).toBeNull();
  });

  // Retargeted by T39 (#412–#413, OS3.2): no agreement step, so three segments, filled on About you. The rendered
  // bar is T39-setupScreens "OS3.2 · the bar has 3 segments".
  it('the bar has a segment per step and fills on About you (step 3)', () => {
    expect(ONBOARDING_STEPS).toBe(3);
    expect(t('onb.progress.a11y', { n: 3, total: ONBOARDING_STEPS })).toBe('Step 3 of 3');
  });
});

describe('F7 · the example check', () => {
  it("is the engine's score for the Welcome photo, the same as Welcome's mini card, with fixes and the math", () => {
    const ex = exampleCheck();
    const w = welcomeExample();
    expect(ex).not.toBeNull();
    expect(w).not.toBeNull();
    expect(ex!.score).toBe(w!.score);
    expect(ex!.why?.strip.length).toBe(5);
    expect(ex!.fixes.every((f) => typeof f.copy === 'string' && f.copy.length > 0)).toBe(true);
    // Same photo, same score: computed again, it's identical.
    expect(exampleCheck()).toBe(ex);
  });

  it('touches no store (nothing sent, saved or counted)', async () => {
    const store = await freshStore();
    exampleCheck();
    expect(await store.fitChecks.all()).toHaveLength(0);
    expect(await store.chat.all()).toHaveLength(0);
  });
});

describe('Q4 · copy rules on the new lines', () => {
  it('no "AI stylist", no "unlimited", no emoji', () => {
    const strings = en as Record<string, string>;
    const keys = Object.keys(strings).filter((k) => k.startsWith('acct.') || k.startsWith('onb.example') || k.startsWith('onb.basics') || k.startsWith('onb.setup') || k.startsWith('onb.consent'));
    const all = keys.map((k) => strings[k]!).join('\n');
    expect(all).not.toMatch(/AI stylist/i);
    expect(all).not.toMatch(/unlimited/i);
    expect(all).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});

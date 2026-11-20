// T41 · The account on this phone (specs/sign-in-and-backup.md SB1.6, SB2.1, SB6.1, SB7.1, SB8.1, SB10.1;
// tasks/T41/TESTING.md): the switch, which providers exist, what follows a sign-in, the "both have fits" choice, sign out,
// and Apple's first name. On the memory store with the bundled seed's own fit checks, closet, outfits and chat; fakes for
// the sign-in service. No network, no AI, no photo.
import seed from '../../assets/seed.json';
import { US_EASTERN } from '@kitted/core';
import * as features from '@/config/features';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import type { KittedStore } from '@/data/store';
import type { FitCheckRow, ProfileRow } from '@/data/types';
import {
  accountsOn, afterSignIn, auth, getAccount, liveProviders, parseAccount, parseRestoreParam, resolveChoice, restoreParam, saveAccount, setDemoAccounts,
  settingsAccountOn, sheetProviders, signOut,
} from '@/features/account/account';
import { createMockAuth, MOCK_HOLDINGS, type AccountUser, type AuthProvider, type AuthService } from '@/features/account/auth';
import { applyAppleFirstName } from '@/features/account/appleName';
import { buildStylistContext } from '@/features/ask/context';
import { loadStylistSnapshot } from '@/features/ask/snapshot';
import { manualClock } from '@/services/clock';
import { ABOUT_KEY } from '@/features/onboarding/basics';

jest.mock('expo-apple-authentication', () => ({}), { virtual: true });

const SEED_NOW = Date.parse('2026-10-22T07:41:00-04:00');
const T0 = Date.parse('2026-10-22T11:00:00Z');
const user = (o: Partial<AccountUser> = {}): AccountUser => ({ uid: 'g1', provider: 'apple', email: 'k7p2xq9wmd@privaterelay.appleid.com', signedInAt: T0, ...o });
const ok = (holdings: { fits: number; pieces: number } | null, u = user()) => ({ kind: 'ok' as const, user: u, holdings: holdings as never });

function check(id: string, createdAt: number, o: Partial<FitCheckRow> = {}): FitCheckRow {
  return {
    id, createdAt, dayKey: '2026-10-22', photoFile: null, thumbFile: null, demoPhotoId: 'p01b', imageHash: id, occasion: 'everyday', style: null,
    status: 'scored', isPartial: false, notRated: [], score: 7.5, rawScore: 7.5, subscores: {}, occasionAdj: 0, rulesFired: [], credits: [], advice: [],
    fixes: [], explanation: null, rubricVersion: 'parts', isFavorite: false, snapState: 'none', recheckUsed: false, isFirstCheck: false, readingId: null,
    parentId: null, itemIds: [], details: {}, ...o,
  } as FitCheckRow;
}

async function empty(): Promise<KittedStore> {
  const store = createMemoryStore();
  await store.init();
  return store;
}

/** His phone: the bundled seed's closet, outfits, chat, facts and profile, with the seed's fit checks swapped for four of ours. */
async function hisPhone(): Promise<KittedStore> {
  const store = await empty();
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: SEED_NOW });
  for (const c of await store.fitChecks.all()) await store.fitChecks.delete(c.id);
  for (let i = 1; i <= 4; i++) await store.fitChecks.put(check(`FC${i}`, T0 - (10 - i) * 60_000));
  return store;
}

const rows = async (store: KittedStore) =>
  JSON.stringify([await store.fitChecks.all(), await store.closet.all(), await store.outfits.all(), await store.chat.all(), await store.wearLog.all(), await store.facts.all(), await store.readings.all(), await store.profile.all()]);
const stuffBesidesFits = async (store: KittedStore) => JSON.stringify([await store.closet.all(), await store.outfits.all(), await store.chat.all()]);
const fitIds = async (store: KittedStore) => (await store.fitChecks.all()).map((c) => c.id).sort();

afterEach(() => setDemoAccounts(null));

// ── SB1.6 · off means off ───────────────────────────────────────────────────────────────────────────────────────────
describe('SB1.6 · with ACCOUNTS_BUILT off, no sign-in entry point outside demo screens', () => {
  it('SB1.6 · the switch is off, the dev-only Google row (SIGN_IN_LIVE) is gone, and with no demo script nothing is on', () => {
    expect(features.ACCOUNTS_BUILT).toBe(false);
    expect('SIGN_IN_LIVE' in features).toBe(false);
    setDemoAccounts(null);
    expect(accountsOn()).toBe(false);
    expect(settingsAccountOn()).toBe(false);
    expect(liveProviders()).toEqual([]);
  });

  it('SB1.6 · a demo script turns accounts on with Apple and Google only; clearing it turns them off again', () => {
    setDemoAccounts('ok');
    expect([accountsOn(), settingsAccountOn(), liveProviders()]).toEqual([true, true, ['apple', 'google']]);
    setDemoAccounts(null);
    expect([accountsOn(), settingsAccountOn(), liveProviders()]).toEqual([false, false, []]);
  });

  /** account.ts loaded fresh with the Firebase key and Google client set as given, on iPhone, the real switch or on. */
  function load(o: { built: boolean; key: string; client: string }): typeof import('@/features/account/account') {
    let mod!: typeof import('@/features/account/account');
    jest.isolateModules(() => {
      jest.doMock('@/config/features', () => ({ ...jest.requireActual('@/config/features'), ACCOUNTS_BUILT: o.built }));
      jest.doMock('@/config/firebase', () => ({ FIREBASE_CONFIG: { apiKey: o.key }, GOOGLE_IOS_CLIENT_ID: o.client }));
      mod = require('@/features/account/account') as typeof import('@/features/account/account');
    });
    jest.dontMock('@/config/features');
    jest.dontMock('@/config/firebase');
    return mod;
  }

  it('SB1.6 · a dev build with the real Firebase key and Google client but the switch off shows nothing (no Google row)', () => {
    const m = load({ built: false, key: 'k', client: 'c' });
    expect(m.accountsOn()).toBe(false);
    expect(m.settingsAccountOn()).toBe(false);
    expect(m.liveProviders()).toEqual([]);
  });

  it('SB1.6 · with the switch on, the real providers are Apple and Google; Google needs its client, and nothing without the Firebase key', () => {
    expect(load({ built: true, key: 'k', client: 'c' }).liveProviders()).toEqual(['apple', 'google']);
    expect(load({ built: true, key: 'k', client: '' }).liveProviders()).toEqual(['apple']);
    expect(load({ built: true, key: '', client: 'c' }).liveProviders()).toEqual([]);
    expect(load({ built: true, key: 'k', client: 'c' }).accountsOn()).toBe(true);
  });
});

// ── SB2.1 · Apple first, Google second, nothing else ────────────────────────────────────────────────────────────────
describe('SB2.1 · Apple and Google, in that order, and no email', () => {
  it('SB2.1 · the sheet lists Apple then Google whatever order the live list is in, and never email', () => {
    expect(sheetProviders(['apple', 'google'])).toEqual(['apple', 'google']);
    expect(sheetProviders(['google', 'apple'])).toEqual(['apple', 'google']);
    expect(sheetProviders(['google', 'email', 'apple'])).toEqual(['apple', 'google']);
    expect(sheetProviders(['google'])).toEqual(['google']);
    expect(sheetProviders(['email'])).toEqual([]);
    expect(sheetProviders([])).toEqual([]);
    expect(sheetProviders(['apple', 'apple', 'google'])).toEqual(['apple', 'google']);
  });

  it('SB2.1 · a saved account with provider email reads as signed out; Apple and Google read fine', () => {
    expect(parseAccount(JSON.stringify({ uid: 'x', provider: 'email', email: 'sam@gmail.com', signedInAt: 5 }))).toBeNull();
    expect(parseAccount(JSON.stringify({ uid: 'x', provider: 'apple', email: null, signedInAt: 5 }))).toEqual({ uid: 'x', provider: 'apple', email: null, signedInAt: 5 });
    expect(parseAccount(JSON.stringify({ uid: 'x', provider: 'google', email: 'a@b.c', signedInAt: 5 }))).toEqual({ uid: 'x', provider: 'google', email: 'a@b.c', signedInAt: 5 });
    expect(parseAccount('{"uid":"x","provider":"facebook"}')).toBeNull();
    expect(parseAccount('nope')).toBeNull();
  });

  it('SB2.1 · neither the app\'s sign-in nor the mock has email methods', () => {
    const mock = createMockAuth({ latencyMs: 0 }) as unknown as Record<string, unknown>;
    for (const svc of [mock, auth as unknown as Record<string, unknown>]) {
      expect('sendEmailCode' in svc).toBe(false);
      expect('verifyEmailCode' in svc).toBe(false);
    }
    expect(Object.keys(auth).sort()).toEqual(['deleteAccount', 'signIn', 'signOut']);
    expect(Object.keys(mock).sort()).toEqual(['deleteAccount', 'signIn', 'signOut']);
  });

  it('SB2.1 · email is not a provider type (checked by tsc: the directive below fails the type check if it is)', () => {
    // @ts-expect-error SB2.1: 'email' is not an AuthProvider
    const p: AuthProvider = 'email';
    expect(p).toBe('email'); // runtime only; the assertion is the directive above
  });
});

// ── SB6.1 · from Welcome ────────────────────────────────────────────────────────────────────────────────────────────
describe('SB6.1 · after a sign-in from Welcome', () => {
  it('SB6.1 · an account with fits asks age only (restore) and the account is saved', async () => {
    const store = await empty();
    const u = user();
    expect(await afterSignIn(store, 'welcome', ok({ fits: 214, pieces: 38 }, u))).toEqual({ next: 'restore', holdings: { fits: 214, pieces: 38 } });
    expect(await getAccount(store)).toEqual(u);
  });

  it('SB6.1 · no holdings, or an account with 0 fits, goes on with setup, signed in', async () => {
    for (const h of [null, { fits: 0, pieces: 0 }, { fits: 0, pieces: 9 }]) {
      const store = await empty();
      expect(await afterSignIn(store, 'welcome', ok(h))).toEqual({ next: 'setup' });
      expect(await getAccount(store)).toEqual(user());
    }
  });

  it('SB6.1 · the mock\'s existing account is 214 fits and 38 pieces, and carries no chat count', async () => {
    expect(MOCK_HOLDINGS).toEqual({ fits: 214, pieces: 38 });
    const r = await createMockAuth({ script: () => 'existing', latencyMs: 0, now: () => T0 }).signIn('apple');
    expect(r.kind === 'ok' && r.holdings).toEqual({ fits: 214, pieces: 38 });
  });

  it('SB6.1 · the restore counts travel as two numbers; a three-number param (the old chats one) is nothing', () => {
    expect(restoreParam({ fits: 214, pieces: 38 })).toBe('214,38');
    expect(parseRestoreParam('214,38')).toEqual({ fits: 214, pieces: 38 });
    expect(parseRestoreParam('214,38,61')).toBeNull();
    expect(parseRestoreParam('214')).toBeNull();
    expect(parseRestoreParam('a,b')).toBeNull();
    expect(parseRestoreParam(undefined)).toBeNull();
  });

  it('SB6.1 · from the offer card or You, never restore or setup', async () => {
    for (const from of ['offer', 'settings'] as const) {
      for (const h of [null, { fits: 0, pieces: 0 }, { fits: 214, pieces: 38 }]) {
        const store = await empty();
        const r = await afterSignIn(store, from, ok(h));
        expect([from, r]).toEqual([from, { next: 'done' }]);
        expect(await getAccount(store)).toEqual(user());
      }
    }
  });

  it('SB6.1 · an account with fits on a phone with fits asks first and saves nothing until he picks', async () => {
    const store = await empty();
    await store.fitChecks.put(check('FC1', T0));
    await store.fitChecks.put(check('FC2', T0 + 1, { parentId: 'FC1' }));
    const r = await afterSignIn(store, 'offer', ok({ fits: 214, pieces: 38 }));
    expect(r).toMatchObject({ next: 'choose', localFits: 1, holdings: { fits: 214, pieces: 38 } });
    expect(await getAccount(store)).toBeNull();
    expect(await store.fitChecks.all()).toHaveLength(2);
  });
});

// ── SB7.1 · the account and this phone both have fits ───────────────────────────────────────────────────────────────
describe('SB7.1 · Keep both merges; Use the account\'s deletes only after the second confirm; Cancel stays signed out', () => {
  const svc = () => ({ signOut: jest.fn(async () => {}) });

  it('SB7.1 · keep both: the account is saved and every local fit is still there', async () => {
    const store = await hisPhone();
    const before = await rows(store);
    const service = svc();
    const r = await resolveChoice(store, 'keepBoth', { user: user(), inAccount: ['FC1'] }, service);
    expect(r).toEqual({ status: 'saved', deleted: [] });
    expect(await getAccount(store)).toEqual(user());
    expect(await fitIds(store)).toEqual(['FC1', 'FC2', 'FC3', 'FC4']);
    expect(await rows(store)).toBe(before);
    expect(service.signOut).not.toHaveBeenCalled();
  });

  it('SB7.1 · use the account\'s without the second confirm: nothing is deleted and the account is not saved', async () => {
    for (const confirmed of [undefined, false]) {
      const store = await hisPhone();
      const before = await rows(store);
      const service = svc();
      const r = await resolveChoice(store, 'useAccount', { user: user(), inAccount: ['FC1', 'FC2'], confirmed }, service);
      expect(r).toEqual({ status: 'needsConfirm' });
      expect(await getAccount(store)).toBeNull();
      expect(await rows(store)).toBe(before);
      expect(service.signOut).not.toHaveBeenCalled();
    }
  });

  it('SB7.1 · use the account\'s with the second confirm: only this iPhone\'s scored fits that are not in the account go; the account is saved', async () => {
    const store = await hisPhone();
    const kept = await stuffBesidesFits(store);
    const service = svc();
    const r = await resolveChoice(store, 'useAccount', { user: user(), inAccount: ['FC1', 'FC2'], confirmed: true }, service);
    expect(r.status).toBe('saved');
    expect(r.status === 'saved' && [...r.deleted].sort()).toEqual(['FC3', 'FC4']);
    expect(await fitIds(store)).toEqual(['FC1', 'FC2']);
    expect(await getAccount(store)).toEqual(user());
    // Closet pieces, outfits and chat are not his fits: untouched.
    expect(await stuffBesidesFits(store)).toBe(kept);
    expect(service.signOut).not.toHaveBeenCalled();
  });

  it('SB7.1 · with the second confirm and every local fit already in the account, nothing is deleted', async () => {
    const store = await hisPhone();
    const r = await resolveChoice(store, 'useAccount', { user: user(), inAccount: ['FC1', 'FC2', 'FC3', 'FC4', 'FC99'], confirmed: true }, svc());
    expect(r).toEqual({ status: 'saved', deleted: [] });
    expect(await fitIds(store)).toEqual(['FC1', 'FC2', 'FC3', 'FC4']);
  });

  it('SB7.1 · cancel: signs out, saves no account, deletes nothing', async () => {
    const store = await hisPhone();
    const before = await rows(store);
    const service = svc();
    const r = await resolveChoice(store, 'cancel', { user: user(), inAccount: ['FC1'], confirmed: true }, service);
    expect(r).toEqual({ status: 'cancelled' });
    expect(service.signOut).toHaveBeenCalledTimes(1);
    expect(await getAccount(store)).toBeNull();
    expect(await rows(store)).toBe(before);
  });
});

// ── SB8.1 · sign out keeps every fit ────────────────────────────────────────────────────────────────────────────────
describe('SB8.1 · sign out keeps every fit on the phone', () => {
  it('SB8.1 · the account goes, the provider\'s sign-out is called, and fits, closet, outfits and chat are byte for byte as before', async () => {
    const store = await hisPhone();
    await saveAccount(store, user());
    expect(await getAccount(store)).toEqual(user());
    const before = await rows(store);
    const service = { signOut: jest.fn(async () => {}) } as unknown as AuthService;
    await signOut(store, service);
    expect(service.signOut).toHaveBeenCalledTimes(1);
    expect(await getAccount(store)).toBeNull();
    expect(await rows(store)).toBe(before);
    expect(await fitIds(store)).toEqual(['FC1', 'FC2', 'FC3', 'FC4']);
  });
});

// ── SB10.1 · Apple's first name ─────────────────────────────────────────────────────────────────────────────────────
describe('SB10.1 · Apple\'s first name fills an empty name only', () => {
  async function withProfile(name: string | null) {
    const store = await hisPhone();
    const base = (await store.profile.get('me')) as ProfileRow;
    await store.profile.put({ ...base, name });
    return store;
  }
  const nameOf = async (store: KittedStore) => (await store.profile.get('me'))?.name ?? null;

  it('SB10.1 · no name set: it becomes Apple\'s first name (cleaned like About you\'s), and nothing else on the profile changes', async () => {
    const store = await withProfile(null);
    const before = { ...((await store.profile.get('me')) as ProfileRow) };
    expect(await applyAppleFirstName(store, 'Sam')).toBe('Sam');
    expect(await nameOf(store)).toBe('Sam');
    expect(await store.profile.get('me')).toEqual({ ...before, name: 'Sam' });

    const spaced = await withProfile(null);
    expect(await applyAppleFirstName(spaced, '  Sam  ')).toBe('Sam');
    expect(await nameOf(spaced)).toBe('Sam');
    const blankName = await withProfile('   ');
    expect(await applyAppleFirstName(blankName, 'Sam')).toBe('Sam');
    expect(await nameOf(blankName)).toBe('Sam');
  });

  it('SB10.1 · a name he typed stays', async () => {
    const store = await withProfile('Alex');
    expect(await applyAppleFirstName(store, 'Sam')).toBeNull();
    expect(await nameOf(store)).toBe('Alex');
  });

  it('SB10.1 · an empty, blank or missing given name sets nothing', async () => {
    for (const given of ['', '   ', null, undefined]) {
      const store = await withProfile(null);
      const before = await rows(store);
      expect(await applyAppleFirstName(store, given)).toBeNull();
      expect(await rows(store)).toBe(before);
    }
  });

  it('SB10.1 · mid setup (no profile yet): it goes to About you\'s draft, keeping the age pick, and never over a typed name', async () => {
    const fresh = await empty();
    expect(await applyAppleFirstName(fresh, 'Sam')).toBe('Sam');
    expect(JSON.parse((await fresh.getKv(ABOUT_KEY))!)).toEqual({ age: null, name: 'Sam' });
    expect(await fresh.profile.get('me')).toBeNull();

    const picked = await empty();
    await picked.setKv(ABOUT_KEY, JSON.stringify({ age: '22-25', name: '' }));
    expect(await applyAppleFirstName(picked, 'Sam')).toBe('Sam');
    expect(JSON.parse((await picked.getKv(ABOUT_KEY))!)).toEqual({ age: '22-25', name: 'Sam' });

    const typed = await empty();
    await typed.setKv(ABOUT_KEY, JSON.stringify({ age: '22-25', name: 'Alex' }));
    expect(await applyAppleFirstName(typed, 'Sam')).toBeNull();
    expect(JSON.parse((await typed.getKv(ABOUT_KEY))!)).toEqual({ age: '22-25', name: 'Alex' });
  });

  it('SB10.1 · after it, Kit\'s context pack carries neither the name nor the Apple email', async () => {
    const store = await withProfile(null);
    await saveAccount(store, user({ email: 'zebulon.k@privaterelay.appleid.com' }));
    expect(await applyAppleFirstName(store, 'Zebulon')).toBe('Zebulon');
    const ctx = buildStylistContext(await loadStylistSnapshot(store, manualClock(SEED_NOW)), 'What goes with olive chinos?');
    const text = JSON.stringify(ctx);
    expect(text).not.toMatch(/Zebulon|zebulon\.k|privaterelay/i);
  });
});

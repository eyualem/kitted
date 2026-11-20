// The account on this phone (10-onboarding.md §2–§5): who is signed in (kv `account.user`), the save offer's state
// (kv `account.offer`), the one switch that keeps every account screen out of real builds (ACCOUNTS_BUILT), and what
// happens after a sign-in (restore, set up, ask which fits to keep, or the age stop). Firebase takes over the sign-in
// itself (signIn.ts, firebaseAuth.ts); these rules stay.
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import { ACCOUNTS_BUILT } from '@/config/features';
import { FIREBASE_CONFIG, GOOGLE_IOS_CLIENT_ID } from '@/config/firebase';
import type { KittedStore } from '@/data/store';
import { createMockAuth, type AccountHoldings, type AccountUser, type AuthService, type MockScript, type SignInResult } from './auth';
import { parseOffer, type OfferState } from './offer';

export const ACCOUNT_KEY = 'account.user';
export const OFFER_KEY = 'account.offer';

// ── The switch ────────────────────────────────────────────────────────────────────────────────────────────────────
// Off in real builds (ACCOUNTS_BUILT): his phone never shows a sign-in that does nothing. A demo screen turns it on with
// a scripted outcome (demo/scenarios.ts `accounts`).
let demoScript: MockScript | null = null;
const listeners = new Set<() => void>();

export function setDemoAccounts(script: MockScript | null): void {
  demoScript = script;
  listeners.forEach((l) => l());
}

export function accountsOn(): boolean {
  return ACCOUNTS_BUILT || demoScript !== null;
}

export function useAccountsOn(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    accountsOn,
    accountsOn,
  );
}

/** The sign-in in use. MockAuth until FirebaseAuth is written (08 §6 A1). */
const mockAuth: AuthService = createMockAuth({ script: () => demoScript ?? 'ok' });
let realAuth: AuthService | null = null;

/** Sign-in methods that really work here: both on a demo screen (scripted); on iPhone only with ACCOUNTS_BUILT on, and
 *  then only with the Firebase key (Apple needs nothing more), and Google only with its iOS client ID. With the switch
 *  off there is no entry point at all (SB1.6), so no dev-only row either. */
export function liveProviders(): readonly ('apple' | 'google')[] {
  if (demoScript !== null) return ['apple', 'google'];
  if (!ACCOUNTS_BUILT || Platform.OS !== 'ios' || !FIREBASE_CONFIG.apiKey) return [];
  return GOOGLE_IOS_CLIENT_ID !== '' ? ['apple', 'google'] : ['apple'];
}

/** Whether sign-in, backup and delete run on Firebase here (not on a demo screen's MockAuth). */
export function usesFirebase(): boolean {
  return demoScript === null && liveProviders().length > 0;
}

/** You's account rows show when accounts are on (the one switch). */
export function settingsAccountOn(): boolean {
  return accountsOn();
}

/** SB2.1: the providers the sheet lists, from whatever list is live: Apple first, then Google, nothing else (no email,
 *  duplicates once), whatever order `live` is in. */
export function sheetProviders(live: readonly string[]): ('apple' | 'google')[] {
  return (['apple', 'google'] as const).filter((p) => live.includes(p));
}

/** The sign-in in use: MockAuth on demo screens, Firebase when a live provider exists, MockAuth otherwise (nothing points
 *  at it then). Firebase loads lazily so the web preview and tests never touch the native modules. */
export const auth: AuthService = {
  signIn: (p) => current().signIn(p),
  signOut: () => current().signOut(),
  deleteAccount: () => current().deleteAccount(),
};

function current(): AuthService {
  if (demoScript !== null || liveProviders().length === 0) return mockAuth;
  if (!realAuth) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    realAuth = (require('./firebaseAuth') as typeof import('./firebaseAuth')).createFirebaseAuth();
  }
  return realAuth;
}

// ── Stored state ──────────────────────────────────────────────────────────────────────────────────────────────────
export function parseAccount(raw: string | null): AccountUser | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<AccountUser>;
    if (typeof v.uid !== 'string' || !v.uid || (v.provider !== 'apple' && v.provider !== 'google')) return null;
    return { uid: v.uid, provider: v.provider, email: typeof v.email === 'string' ? v.email : null, signedInAt: typeof v.signedInAt === 'number' ? v.signedInAt : 0 };
  } catch {
    return null;
  }
}

export async function getAccount(store: Pick<KittedStore, 'getKv'>): Promise<AccountUser | null> {
  return parseAccount(await store.getKv(ACCOUNT_KEY));
}

export async function saveAccount(store: Pick<KittedStore, 'setKv'>, user: AccountUser): Promise<void> {
  await store.setKv(ACCOUNT_KEY, JSON.stringify(user));
}

/** Sign out: the account goes, his fits stay on this phone (AC4's default). */
export async function signOut(store: Pick<KittedStore, 'deleteKv'>, service: Pick<AuthService, 'signOut'> = auth): Promise<void> {
  await service.signOut();
  await store.deleteKv(ACCOUNT_KEY);
}

export async function getOffer(store: Pick<KittedStore, 'getKv'>): Promise<OfferState> {
  return parseOffer(await store.getKv(OFFER_KEY));
}

export async function saveOffer(store: Pick<KittedStore, 'setKv'>, s: OfferState): Promise<void> {
  await store.setKv(OFFER_KEY, JSON.stringify(s));
}

// ── After a sign-in ───────────────────────────────────────────────────────────────────────────────────────────────
export type SignInFrom = 'welcome' | 'offer' | 'settings';

export type AfterSignIn =
  /** From Welcome, an account with his fits: the birth year first (it never syncs, so the age gate runs on every new
   *  phone, 11-firestore-schema.md), then A4 brings them back and the rest of setup is skipped. */
  | { next: 'restore'; holdings: AccountHoldings }
  /** From Welcome, a new or empty account: setup goes on from Looks, signed in. */
  | { next: 'setup' }
  /** The account holds fits and so does this phone: A5 asks before anything changes. Not saved until he picks. */
  | { next: 'choose'; user: AccountUser; holdings: AccountHoldings; localFits: number }
  /** Signed in; nothing else to decide. */
  | { next: 'done' };

/** Scored fits on this phone (A5's "This iPhone has 3"). */
export async function localFitCount(store: Pick<KittedStore, 'fitChecks'>): Promise<number> {
  return (await store.fitChecks.all()).filter((c) => c.status === 'scored' && c.parentId === null).length;
}

/** Decides what follows a successful sign-in, and saves the account unless he still has to choose (A5). */
export async function afterSignIn(
  store: Pick<KittedStore, 'getKv' | 'setKv' | 'fitChecks'>,
  from: SignInFrom,
  result: Extract<SignInResult, { kind: 'ok' }>,
): Promise<AfterSignIn> {
  const h = result.holdings;
  const hasFits = !!h && h.fits > 0;
  if (from === 'welcome') {
    await saveAccount(store, result.user);
    // An account counts as existing, so setup is skipped, when it has fits or a saved style profile (SB6, log #521).
    return h && (hasFits || h.profile === true) ? { next: 'restore', holdings: h } : { next: 'setup' };
  }
  const localFits = await localFitCount(store);
  if (hasFits && localFits > 0) return { next: 'choose', user: result.user, holdings: h, localFits };
  await saveAccount(store, result.user);
  return { next: 'done' };
}

/** The restore's counts, carried through Basics in the route ("214,38"): two numbers, no chat count (SB6.1). */
export function restoreParam(h: AccountHoldings): string {
  return `${h.fits},${h.pieces}`;
}

export function parseRestoreParam(v: string | undefined): AccountHoldings | null {
  const m = /^(\d+),(\d+)$/.exec(v ?? '');
  return m ? { fits: Number(m[1]), pieces: Number(m[2]) } : null;
}

// ── The "both have fits" choice (SB7.1) ──────────────────────────────────────────────────────────────────────────
/** SB7.1: his pick when the account and this phone both have fits. */
export type ChoiceAction = 'keepBoth' | 'useAccount' | 'cancel';

export type ChoiceResult =
  /** The account is saved. `deleted`: ids of this iPhone's fit checks that were deleted ([] unless `useAccount`). */
  | { status: 'saved'; deleted: readonly string[] }
  /** `useAccount` without the second confirm: nothing deleted, account not saved. */
  | { status: 'needsConfirm' }
  /** Cancel: signed out again, account not saved, nothing deleted. */
  | { status: 'cancelled' };

/** SB7.1 (pure apart from the store and `service`): `keepBoth` saves the account and touches no fit. `useAccount` with
 *  `confirmed` not true does nothing and says `needsConfirm`; with `confirmed: true` it deletes only this iPhone's scored
 *  fit checks (full checks, `status: 'scored'`) whose id is not in `inAccount`, then saves the account (closet pieces,
 *  outfits, chat and the account's own fits are never touched). `cancel` calls `service.signOut()` and nothing else. */
export async function resolveChoice(
  store: Pick<KittedStore, 'getKv' | 'setKv' | 'deleteKv' | 'fitChecks'>,
  action: ChoiceAction,
  input: { user: AccountUser; inAccount: readonly string[]; confirmed?: boolean },
  service: Pick<AuthService, 'signOut'> = auth,
): Promise<ChoiceResult> {
  if (action === 'cancel') {
    await service.signOut();
    return { status: 'cancelled' };
  }
  if (action === 'useAccount') {
    if (input.confirmed !== true) return { status: 'needsConfirm' };
    const inAccount = new Set(input.inAccount);
    const all = await store.fitChecks.all();
    const fits = all.filter((c) => c.status === 'scored' && c.parentId === null && !inAccount.has(c.id));
    const goneIds = new Set(fits.map((c) => c.id));
    // A re-check hangs off its fit, so it goes with it (and never stands alone).
    const gone = [...fits, ...all.filter((c) => c.parentId !== null && goneIds.has(c.parentId))];
    for (const c of gone) await store.fitChecks.delete(c.id);
    await saveAccount(store, input.user);
    return { status: 'saved', deleted: gone.map((c) => c.id) };
  }
  await saveAccount(store, input.user);
  return { status: 'saved', deleted: [] };
}

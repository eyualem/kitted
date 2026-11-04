// The account on this phone (10-onboarding.md §2–§5): who is signed in (kv `account.user`), the save offer's state
// (kv `account.offer`), the switch that keeps every account screen out of real builds until Firebase exists, and what
// happens after a sign-in (restore, set up, ask which fits to keep, or the age stop). Firebase takes over the sign-in
// itself (auth.ts); these rules stay.
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import { ACCOUNTS_BUILT, SIGN_IN_LIVE } from '@/config/features';
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

/** Sign-in methods that really work here: every one on a demo screen (scripted), else the live ones on iPhone. */
export function liveProviders(): readonly ('apple' | 'google' | 'email')[] {
  if (demoScript !== null) return ['apple', 'google', 'email'];
  if (Platform.OS !== 'ios') return [];
  // Google needs its iOS client ID (set once Google is enabled in the console) and a build with its native module.
  return FIREBASE_CONFIG.apiKey ? SIGN_IN_LIVE.filter((p) => p !== 'google' || GOOGLE_IOS_CLIENT_ID !== '') : [];
}

/** You → Settings → Account shows when accounts are on, or when a real sign-in exists to test (#295). */
export function settingsAccountOn(): boolean {
  return accountsOn() || liveProviders().length > 0;
}

/** The sign-in in use: MockAuth on demo screens, Firebase (Google) when a live provider exists, MockAuth otherwise
 *  (nothing points at it then). Firebase loads lazily so the web preview and tests never touch the native module. */
export const auth: AuthService = {
  signIn: (p) => current().signIn(p),
  sendEmailCode: (e) => current().sendEmailCode(e),
  verifyEmailCode: (e, c) => current().verifyEmailCode(e, c),
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
    if (typeof v.uid !== 'string' || !v.uid || (v.provider !== 'apple' && v.provider !== 'google' && v.provider !== 'email')) return null;
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
export async function signOut(store: Pick<KittedStore, 'deleteKv'>, service: AuthService = auth): Promise<void> {
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

async function accountHoldings(uid: string): Promise<AccountHoldings | null> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return (require('@/sync/appBackup') as typeof import('@/sync/appBackup')).backup.holdings(uid);
}

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
  // The real sign-in doesn't know what the account holds; the backup reads it (#386). Unreadable counts as empty.
  const h = result.holdings ?? (demoScript === null ? await accountHoldings(result.user.uid) : null);
  const hasFits = !!h && h.fits > 0;
  if (from === 'welcome') {
    await saveAccount(store, result.user);
    return hasFits ? { next: 'restore', holdings: h } : { next: 'setup' };
  }
  const localFits = await localFitCount(store);
  if (hasFits && localFits > 0) return { next: 'choose', user: result.user, holdings: h, localFits };
  await saveAccount(store, result.user);
  return { next: 'done' };
}

/** The restore's counts, carried through Basics in the route ("214,38,61"). */
export function restoreParam(h: AccountHoldings): string {
  return `${h.fits},${h.pieces},${h.chats}`;
}

export function parseRestoreParam(v: string | undefined): AccountHoldings | null {
  const m = /^(\d+),(\d+),(\d+)$/.exec(v ?? '');
  return m ? { fits: Number(m[1]), pieces: Number(m[2]), chats: Number(m[3]) } : null;
}

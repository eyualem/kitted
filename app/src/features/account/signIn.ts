// The real sign-in's rules (10-onboarding.md §12, checks SI2–SI9), with Firebase and the providers' own sheets passed
// in, so they're tested with fakes (signInLive.test.ts) and wired once in firebaseAuth.ts. Continue with Apple and
// Continue with Google both end in a Firebase credential; a guest (the server's silent account, 13-server.md §8) is
// upgraded in place, so his uid and today's counts on the server stay. Email waits for a mail route (AU7).
import { keepGuest } from '@/services/server/guest';
import type { AccountHoldings, AuthService, DeleteResult, SignInResult } from './auth';

/** The slice of a Firebase user this needs. */
export interface FbUser {
  uid: string;
  email: string | null;
  isAnonymous: boolean;
}

/** A Firebase credential, opaque here. */
export type Cred = { readonly providerId: string };

export interface AppleCredential {
  identityToken: string | null;
  authorizationCode: string | null;
  email: string | null;
}

export interface SignInDeps {
  /** Resolves once the saved sign-in has loaded (Firebase's authStateReady): `current()` is null for a moment at a cold
   *  start, and deciding then would orphan the guest (SI4). */
  ready(): Promise<void>;
  current(): FbUser | null;
  /** Apple's sheet: the email scope only, with the hashed nonce. Rejects with `ERR_REQUEST_CANCELED` when he closes it. */
  apple: { available(): Promise<boolean>; signIn(hashedNonce: string): Promise<AppleCredential> };
  /** Google's sheet: null when he closes it. Rejects with `kitted/cancelled` for a second sheet while one is open. */
  google: { signIn(): Promise<{ idToken: string | null; email: string | null } | null>; signOut(): Promise<void>; revoke(): Promise<void> };
  /** A fresh random nonce and its SHA-256 in hex: Apple gets the hash, Firebase the raw one. */
  nonce(): Promise<{ raw: string; hashed: string }>;
  appleCred(idToken: string, rawNonce: string): Cred;
  googleCred(idToken: string): Cred;
  /** The credential Firebase hands back with `credential-already-in-use` (Apple's token is meant to be used once). */
  credFromError(e: unknown): Cred | null;
  link(cred: Cred): Promise<FbUser>;
  signInWith(cred: Cred): Promise<FbUser>;
  signOut(): Promise<void>;
  /** Revokes Apple's token with a fresh authorization code (Apple TN3194; Firebase needs the Apple key, §12.3). */
  revokeApple(authorizationCode: string): Promise<void>;
  /** The server's `deleteAccount`: the server copy, the day's counts and the Auth user, with admin rights. */
  deleteOnServer(): Promise<void>;
  /** What the account already holds (A4, A5). Null until backup exists (AU1 fills it in). */
  holdingsOf(uid: string): Promise<AccountHoldings | null>;
  now(): number;
  log(line: string): void;
}

const codeOf = (e: unknown): string => (e as { code?: string } | null)?.code ?? '';
const isCancel = (e: unknown) => codeOf(e) === 'ERR_REQUEST_CANCELED' || codeOf(e) === 'kitted/cancelled';
const isNetwork = (e: unknown) => codeOf(e) === 'auth/network-request-failed' || codeOf(e) === 'functions/unavailable' || /network/i.test(String((e as Error | null)?.message ?? ''));

export function createSignIn(d: SignInDeps): AuthService {
  /** Link to the guest, or sign in to the account that already holds this identity (a second phone, SI5). */
  async function toFirebase(cred: Cred): Promise<FbUser> {
    await d.ready();
    return keepGuest(d.current(), () => d.link(cred), (e) => d.signInWith((e ? d.credFromError(e) : null) ?? cred));
  }

  async function provider(p: 'apple' | 'google'): Promise<{ cred: Cred; email: string | null } | 'cancelled' | 'failed'> {
    if (p === 'apple') {
      if (!(await d.apple.available())) return 'failed';
      const { raw, hashed } = await d.nonce();
      const a = await d.apple.signIn(hashed);
      return a.identityToken ? { cred: d.appleCred(a.identityToken, raw), email: a.email } : 'failed';
    }
    const g = await d.google.signIn();
    if (!g) return 'cancelled';
    return g.idToken ? { cred: d.googleCred(g.idToken), email: g.email } : 'failed';
  }

  return {
    async signIn(p): Promise<SignInResult> {
      try {
        const got = await provider(p);
        if (got === 'cancelled' || got === 'failed') return { kind: got };
        const guest = (await d.ready(), d.current());
        const user = await toFirebase(got.cred);
        d.log(`[account] signed in with ${p} · ${guest?.isAnonymous ? (guest.uid === user.uid ? 'kept the guest' : 'an existing account') : 'new on this phone'}`);
        return { kind: 'ok', user: { uid: user.uid, provider: p, email: user.email ?? got.email, signedInAt: d.now() }, holdings: await d.holdingsOf(user.uid) };
      } catch (e: unknown) {
        if (isCancel(e)) return { kind: 'cancelled' };
        if (isNetwork(e)) return { kind: 'offline' };
        d.log(`[account] ${p} sign-in failed · ${codeOf(e) || 'error'}`);
        return { kind: 'failed' };
      }
    },
    async sendEmailCode() {
      return { kind: 'failed' };
    },
    async verifyEmailCode() {
      return { kind: 'failed' };
    },
    async signOut() {
      await d.google.signOut().catch((e: unknown) => d.log(`[account] Google sign-out · ${codeOf(e) || 'error'}`));
      await d.signOut();
    },
    async deleteAccount(provider?: 'apple' | 'google' | 'email'): Promise<DeleteResult> {
      await d.ready();
      if (!d.current()) return { kind: 'ok' };
      try {
        if (provider === 'apple') {
          // Apple asks once more for a fresh code; a close here deletes nothing.
          const { hashed } = await d.nonce();
          const a = await d.apple.signIn(hashed);
          if (!a.authorizationCode) return { kind: 'failed' };
          await d.revokeApple(a.authorizationCode);
        } else if (provider === 'google') {
          await d.google.revoke().catch((e: unknown) => d.log(`[account] Google revoke · ${codeOf(e) || 'error'}`));
        }
        await d.deleteOnServer();
        await d.signOut().catch(() => undefined);
        return { kind: 'ok' };
      } catch (e: unknown) {
        if (isNetwork(e)) return { kind: 'offline' };
        d.log(`[account] delete failed · ${codeOf(e) || 'error'}`);
        return { kind: 'failed' };
      }
    },
  };
}

// The guest account the server's limits follow (13-server.md §8, check A5): an anonymous Firebase sign-in, made the
// first time a call needs one (after consent: nothing is sent before it), never at launch. The SDK keeps the account
// in the Keychain and refreshes its ID token; Continue with Apple or Google later links to the same account (A11).
import { SignInError } from './transport';

interface TokenUser {
  getIdToken(forceRefresh?: boolean): Promise<string>;
}

/** The slice of Firebase Auth this needs (firebaseGuest.ts; a fake in the tests). */
export interface GuestAuth {
  /** Resolves once the saved sign-in (if any) has loaded: without it every launch would make a new guest. */
  ready(): Promise<void>;
  current(): TokenUser | null;
  signInAnonymously(): Promise<TokenUser>;
}

const isNetwork = (e: unknown): boolean => {
  const code = (e as { code?: string } | null)?.code ?? '';
  return code === 'auth/network-request-failed' || /network/i.test(String((e as Error | null)?.message ?? ''));
};

/** The token getter for serverTransport: one sign-in at a time, however many calls start together. */
export function createGuestToken(auth: () => Promise<GuestAuth>, log: (line: string) => void = () => {}): (force: boolean) => Promise<string> {
  let signingIn: Promise<TokenUser> | null = null;
  return async (force) => {
    try {
      const a = await auth();
      await a.ready();
      let user = a.current();
      if (!user) {
        signingIn ??= a.signInAnonymously().then(
          (u) => {
            log('[server] signed in as a guest');
            return u;
          },
        ).finally(() => {
          signingIn = null;
        });
        user = await signingIn;
      }
      return await user.getIdToken(force);
    } catch (e: unknown) {
      if (e instanceof SignInError) throw e;
      log(`[server] sign-in failed · ${(e as { code?: string } | null)?.code ?? 'error'}`);
      throw new SignInError(isNetwork(e));
    }
  };
}

/**
 * Continue with Apple or Google while a guest (A11, 10-onboarding.md §12): link it to the guest account, so the uid (and
 * today's counts on the server) stay the same. If that identity already has its own Firebase account (a second phone),
 * sign in to that one instead; `signIn` gets the link's error, which carries the credential to use (SI5).
 */
export async function keepGuest<U>(current: { isAnonymous: boolean } | null, link: () => Promise<U>, signIn: (linkError?: unknown) => Promise<U>): Promise<U> {
  if (!current?.isAnonymous) return signIn();
  try {
    return await link();
  } catch (e: unknown) {
    const code = (e as { code?: string } | null)?.code;
    if (code === 'auth/credential-already-in-use' || code === 'auth/email-already-in-use') return signIn(e);
    throw e;
  }
}

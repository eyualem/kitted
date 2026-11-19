// Sign-in (10-onboarding.md §4–§5): the one interface the account screens talk to. Firebase isn't set up yet, so the
// app runs on MockAuth, which scripts each outcome for the demo screens; `FirebaseAuth` will implement the same
// interface (08 §6 A1: @react-native-firebase/auth with expo-apple-authentication and Google Sign-In, a guest account
// upgraded with linkWithCredential, and the email code checked by the Worker, which mints a custom token).
// Nothing here sends anything anywhere.

export type AuthProvider = 'apple' | 'google' | 'email';

/** What the app keeps about the account (kv `account.user`). No name: Apple's is offered once and the app has no use
 *  for it (a name is never sent to the stylist, 07 §4). The email is shown only in You → Settings. */
export interface AccountUser {
  uid: string;
  provider: AuthProvider;
  email: string | null;
  signedInAt: number;
}

/** What an account already holds when he signs in (A4's counts; A5 asks when this phone has fits too). */
export interface AccountHoldings {
  fits: number;
  pieces: number;
  chats: number;
}

export type SignInResult =
  /** `givenName`: Apple's first name (SB10), set by createSignIn for Apple only (null for Google, absent from mocks). */
  | { kind: 'ok'; user: AccountUser; holdings: AccountHoldings | null; givenName?: string | null }
  | { kind: 'cancelled' }
  | { kind: 'failed' }
  | { kind: 'offline' };

export type SendCodeResult = { kind: 'sent' } | { kind: 'failed' } | { kind: 'offline' };
export type VerifyCodeResult = SignInResult | { kind: 'wrongCode' } | { kind: 'expired' };
export type DeleteResult = { kind: 'ok' } | { kind: 'failed' } | { kind: 'offline' };

export interface AuthService {
  /** The provider's own sheet (Apple, Google); `cancelled` when he closes it. */
  signIn(provider: 'apple' | 'google'): Promise<SignInResult>;
  /** Emails a 6-digit code (A2). */
  sendEmailCode(email: string): Promise<SendCodeResult>;
  verifyEmailCode(email: string, code: string): Promise<VerifyCodeResult>;
  signOut(): Promise<void>;
  /** Deletes the account and its server copy (Apple: the token is revoked first, TN3194). */
  deleteAccount(): Promise<DeleteResult>;
}

/** The scripted outcomes (demo screens 130–143). `ok`: a new, empty account; `existing`: one that already holds fits. */
export type MockScript = 'ok' | 'existing' | 'cancel' | 'error' | 'offline';

/** The mock account's holdings for `existing` (A4's "214 fits · 38 pieces · 61 chats"). */
export const MOCK_HOLDINGS: AccountHoldings = { fits: 214, pieces: 38, chats: 61 };
/** The code the mock accepts (any other 6 digits is "didn't match"; `000000` is "expired"). */
export const MOCK_CODE = '123456';
export const MOCK_EMAILS: Record<'apple' | 'google', string> = { apple: 'k7p2xq9wmd@privaterelay.appleid.com', google: 'demo.kitted@gmail.com' };

export function createMockAuth(o: { script?: () => MockScript; now?: () => number; latencyMs?: number; uid?: () => string } = {}): AuthService {
  const script = o.script ?? (() => 'ok');
  const now = o.now ?? (() => Date.now());
  const wait = () => new Promise<void>((r) => setTimeout(r, o.latencyMs ?? 700));
  let n = 0;
  const uid = o.uid ?? (() => `mock-${++n}`);
  const outcome = (provider: AuthProvider, email: string | null): SignInResult => {
    const s = script();
    // A cancel only exists on Apple's and Google's own sheets; a typed code just goes through.
    if (s === 'cancel' && provider !== 'email') return { kind: 'cancelled' };
    if (s === 'error') return { kind: 'failed' };
    if (s === 'offline') return { kind: 'offline' };
    const holdings = s === 'existing' ? MOCK_HOLDINGS : null;
    return { kind: 'ok', user: { uid: uid(), provider, email, signedInAt: now() }, holdings };
  };
  return {
    async signIn(provider) {
      await wait();
      return outcome(provider, MOCK_EMAILS[provider]);
    },
    async sendEmailCode() {
      await wait();
      const s = script();
      return s === 'error' ? { kind: 'failed' } : s === 'offline' ? { kind: 'offline' } : { kind: 'sent' };
    },
    async verifyEmailCode(email, code) {
      await wait();
      if (code === '000000') return { kind: 'expired' };
      if (code !== MOCK_CODE) return { kind: 'wrongCode' };
      return outcome('email', email);
    },
    async signOut() {},
    async deleteAccount() {
      await wait();
      const s = script();
      return s === 'error' ? { kind: 'failed' } : s === 'offline' ? { kind: 'offline' } : { kind: 'ok' };
    },
  };
}

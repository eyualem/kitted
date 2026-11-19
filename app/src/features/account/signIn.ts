// T41 (SB2.3, SB8.1, SB10.1): the real sign-in's rules, with Firebase and the providers' own sheets passed in, so they
// are tested with fakes (T41-signIn.test.ts) and wired once in firebaseAuth.ts. Reference: PR #58's signIn.ts
// (`claude/sign-in-apple-google-793589`). Not built yet: createSignIn throws until the implementer writes it.
// Differences from #58 that the tests fix: no Apple revoke / server delete / Google revoke here (deleteAccount is T41b);
// Apple's sheet also returns his first and last name, and only the first goes out (SB10).
import type { AccountHoldings, AuthService } from './auth';

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
  /** Apple gives the name only on his first-ever sign-in to Kitted; null every time after. */
  givenName: string | null;
  familyName: string | null;
}

export interface SignInDeps {
  /** Resolves once the saved sign-in has loaded (Firebase's authStateReady): `current()` is null for a moment at a cold
   *  start, and deciding then would orphan the guest. Every provider path awaits it before deciding link or sign in. */
  ready(): Promise<void>;
  current(): FbUser | null;
  /** Apple's sheet, with the hashed nonce. Rejects with code `ERR_REQUEST_CANCELED` when he closes it. */
  apple: { available(): Promise<boolean>; signIn(hashedNonce: string): Promise<AppleCredential> };
  /** Google's sheet: null when he closes it. Rejects with code `kitted/cancelled` for a second sheet while one is open. */
  google: { signIn(): Promise<{ idToken: string | null; email: string | null } | null>; signOut(): Promise<void> };
  /** A fresh random nonce and its SHA-256 in hex: Apple gets the hash, Firebase the raw one. */
  nonce(): Promise<{ raw: string; hashed: string }>;
  appleCred(idToken: string, rawNonce: string): Cred;
  googleCred(idToken: string): Cred;
  /** The credential Firebase hands back with `auth/credential-already-in-use`. */
  credFromError(e: unknown): Cred | null;
  /** Links the credential to the current (guest) user: his uid stays. */
  link(cred: Cred): Promise<FbUser>;
  signInWith(cred: Cred): Promise<FbUser>;
  signOut(): Promise<void>;
  /** What the account already holds (null until T41b's sync pull exists). */
  holdingsOf(uid: string): Promise<AccountHoldings | null>;
  now(): number;
  log(line: string): void;
}

/** signIn: the five outcomes of AuthService, plus `givenName` on `ok` (Apple's first name; null for Google and when Apple
 *  gave none; the family name is never returned). signOut: Google's sign-out (an error there doesn't stop the rest),
 *  then Firebase's. deleteAccount is not here: it stays as on main until T41b. */
export function createSignIn(_deps: SignInDeps): Pick<AuthService, 'signIn' | 'signOut'> {
  throw new Error('T41: not built');
}

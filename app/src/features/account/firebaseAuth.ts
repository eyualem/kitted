// The real sign-in (T41, specs/sign-in-and-backup.md SB2): Apple's and Google's own sheets, then Firebase Auth with that
// token. The rules live in signIn.ts (tested with fakes); this file only plugs in the real modules, and account.ts loads
// it lazily so the web preview and the tests never touch them. expo-apple-authentication is loaded lazily too: until
// the founder's next install it isn't there, and Apple then reports `failed` instead of breaking the app.
// Until backup exists (T41b) an account holds nothing on the server, so `holdings` is null; `deleteAccount` stays as it
// was (Google's access revoked, then the Auth user deleted); T41b adds Apple's token revoke and the server job.
import * as Crypto from 'expo-crypto';
import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, OAuthProvider, deleteUser, linkWithCredential, signInWithCredential, signOut as fbSignOut, type AuthCredential } from 'firebase/auth';
import type { FirebaseError } from 'firebase/app';
import { GOOGLE_IOS_CLIENT_ID } from '@/config/firebase';
import { firebaseAuth } from '@/services/firebase/app';
import type { AuthService } from './auth';
import { createSignIn, type AppleCredential, type Cred, type FbUser } from './signIn';

let configured = false;
function google(): boolean {
  if (!GOOGLE_IOS_CLIENT_ID) return false;
  if (!configured) {
    GoogleSignin.configure({ iosClientId: GOOGLE_IOS_CLIENT_ID });
    configured = true;
  }
  return true;
}

/** The slice of expo-apple-authentication used here (typed by hand: the package isn't installed yet). */
interface AppleModule {
  isAvailableAsync(): Promise<boolean>;
  signInAsync(o: { requestedScopes: number[]; nonce: string }): Promise<{
    identityToken: string | null;
    authorizationCode: string | null;
    email: string | null;
    fullName: { givenName: string | null; familyName: string | null } | null;
  }>;
  AppleAuthenticationScope: { FULL_NAME: number; EMAIL: number };
}

/** The module, or null when this build doesn't have it. */
function appleModule(): AppleModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-apple-authentication') as AppleModule;
  } catch {
    return null;
  }
}

const fb = (u: { uid: string; email: string | null; isAnonymous: boolean }): FbUser => ({ uid: u.uid, email: u.email, isAnonymous: u.isAnonymous });
const asAuthCred = (c: Cred) => c as unknown as AuthCredential;

const isNetwork = (e: unknown) => {
  const code = (e as { code?: string }).code ?? '';
  return code === 'auth/network-request-failed' || code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE || /network/i.test(String((e as Error).message ?? ''));
};

export function createFirebaseAuth(now: () => number = () => Date.now()): AuthService {
  const auth = firebaseAuth();
  const signIn = createSignIn({
    ready: () => auth.authStateReady(),
    current: () => (auth.currentUser ? fb(auth.currentUser) : null),
    apple: {
      available: async () => (await appleModule()?.isAvailableAsync()) ?? false,
      async signIn(hashedNonce): Promise<AppleCredential> {
        const apple = appleModule();
        if (!apple) throw Object.assign(new Error('no Apple module'), { code: 'kitted/no-apple' });
        // Name and email (SB10): only the first name is kept, and only when his own name is empty (appleName.ts).
        const a = await apple.signInAsync({ requestedScopes: [apple.AppleAuthenticationScope.FULL_NAME, apple.AppleAuthenticationScope.EMAIL], nonce: hashedNonce });
        return {
          identityToken: a.identityToken,
          authorizationCode: a.authorizationCode,
          email: a.email,
          givenName: a.fullName?.givenName ?? null,
          familyName: a.fullName?.familyName ?? null,
        };
      },
    },
    google: {
      async signIn() {
        if (!google()) throw Object.assign(new Error('no Google client'), { code: 'kitted/no-client' });
        try {
          const res = await GoogleSignin.signIn();
          if (!isSuccessResponse(res)) return null;
          return { idToken: res.data.idToken, email: res.data.user.email ?? null };
        } catch (e: unknown) {
          if (isErrorWithCode(e) && e.code === statusCodes.IN_PROGRESS) throw Object.assign(new Error('in progress'), { code: 'kitted/cancelled' });
          throw e;
        }
      },
      async signOut() {
        if (google()) await GoogleSignin.signOut();
      },
    },
    async nonce() {
      const raw = Crypto.randomUUID() + Crypto.randomUUID();
      return { raw, hashed: await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw) };
    },
    appleCred: (idToken, rawNonce) => new OAuthProvider('apple.com').credential({ idToken, rawNonce }),
    googleCred: (idToken) => GoogleAuthProvider.credential(idToken),
    credFromError: (e) => OAuthProvider.credentialFromError(e as FirebaseError) ?? GoogleAuthProvider.credentialFromError(e as FirebaseError),
    link: async (c) => fb((await linkWithCredential(auth.currentUser!, asAuthCred(c))).user),
    signInWith: async (c) => fb((await signInWithCredential(auth, asAuthCred(c))).user),
    signOut: () => fbSignOut(auth),
    holdingsOf: async () => null,
    now,
    log: (line) => console.log(line),
  });
  return {
    ...signIn,
    async deleteAccount() {
      const user = auth.currentUser;
      if (!user) return { kind: 'ok' };
      try {
        if (google()) await GoogleSignin.revokeAccess().catch(() => undefined);
        await deleteUser(user);
        return { kind: 'ok' };
      } catch (e: unknown) {
        if (isNetwork(e)) return { kind: 'offline' };
        console.warn('[account] delete failed', (e as { code?: string }).code ?? e);
        return { kind: 'failed' };
      }
    },
  };
}

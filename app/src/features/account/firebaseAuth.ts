// The real sign-in (#295, 10-onboarding.md §12): Apple's and Google's own sheets, then Firebase Auth with that token.
// The rules live in signIn.ts; this file only plugs in the real modules (loaded lazily by account.ts, so the web
// preview and the tests never touch them).
// Until backup exists (AU1) an account holds nothing on the server, so `holdings` is null.
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, OAuthProvider, linkWithCredential, revokeAccessToken, signInWithCredential, signOut as fbSignOut, type AuthCredential } from 'firebase/auth';
import type { FirebaseError } from 'firebase/app';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import { GOOGLE_IOS_CLIENT_ID } from '@/config/firebase';
import { firebaseApp, firebaseAuth } from '@/services/firebase/app';
import { EMULATOR_FUNCTIONS_PORT, emulatorHost } from '@/services/server/config';
import type { AuthService } from './auth';
import { createSignIn, type Cred, type FbUser } from './signIn';

let configured = false;
function google(): boolean {
  if (!GOOGLE_IOS_CLIENT_ID) return false;
  if (!configured) {
    GoogleSignin.configure({ iosClientId: GOOGLE_IOS_CLIENT_ID });
    configured = true;
  }
  return true;
}

const fb = (u: { uid: string; email: string | null; isAnonymous: boolean }): FbUser => ({ uid: u.uid, email: u.email, isAnonymous: u.isAnonymous });
const asAuthCred = (c: Cred) => c as unknown as AuthCredential;

let deleteCallable: (() => Promise<unknown>) | null = null;
/** The server's deleteAccount (firebase/functions/src/index.ts), in the same region as the api. */
function deleteOnServer(): Promise<unknown> {
  if (!deleteCallable) {
    const fns = getFunctions(firebaseApp(), 'us-central1');
    const host = emulatorHost();
    if (host) connectFunctionsEmulator(fns, host, EMULATOR_FUNCTIONS_PORT);
    const call = httpsCallable(fns, 'deleteAccount');
    deleteCallable = () => call();
  }
  return deleteCallable();
}

export function createFirebaseAuth(now: () => number = () => Date.now()): AuthService {
  const auth = firebaseAuth();
  return createSignIn({
    ready: () => auth.authStateReady(),
    current: () => (auth.currentUser ? fb(auth.currentUser) : null),
    apple: {
      available: () => AppleAuthentication.isAvailableAsync(),
      async signIn(hashedNonce) {
        // The email scope only: Kitted has no use for his name (auth.ts AccountUser).
        const a = await AppleAuthentication.signInAsync({ requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL], nonce: hashedNonce });
        return { identityToken: a.identityToken, authorizationCode: a.authorizationCode, email: a.email };
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
      async revoke() {
        if (google()) await GoogleSignin.revokeAccess();
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
    revokeApple: (code) => revokeAccessToken(auth, code),
    deleteOnServer: async () => {
      await deleteOnServer();
    },
    holdingsOf: async () => null,
    now,
    log: (line) => console.log(line),
  });
}

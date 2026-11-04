// SI6 (handoff/10-onboarding.md §12): what the app's sign-in assumes of Firebase, checked with the real client SDK on
// the Auth emulator. The emulator takes an unsigned JSON ID token for Apple and Google, so no real account is needed.
// - a guest that links Apple (or Google) keeps its uid, so the server's counts stay with him;
// - on a second phone, linking the same identity to that phone's guest fails with credential-already-in-use, and
//   signing in with the credential (the error's, or the one the app has) lands on the first account.
import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  OAuthProvider,
  connectAuthEmulator,
  getAuth,
  linkWithCredential,
  signInAnonymously,
  signInWithCredential,
  signOut,
  type Auth,
  type AuthCredential,
  type FirebaseError,
} from 'firebase/auth';
import { afterEach, describe, expect, it } from 'vitest';

const PROJECT = 'demo-kitted';
const HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099';
const apps: FirebaseApp[] = [];
let n = 0;

/** One phone: its own Firebase app and Auth instance. */
function phone(): Auth {
  const app = initializeApp({ apiKey: 'emulator', projectId: PROJECT, authDomain: `${PROJECT}.firebaseapp.com` }, `phone-${++n}`);
  apps.push(app);
  const auth = getAuth(app);
  connectAuthEmulator(auth, `http://${HOST}`, { disableWarnings: true });
  return auth;
}

const token = (claims: Record<string, unknown>) => JSON.stringify(claims);
const apple = (sub: string, rawNonce?: string): AuthCredential =>
  new OAuthProvider('apple.com').credential({ idToken: token({ sub, email: `${sub}@privaterelay.appleid.com`, email_verified: true }), rawNonce });
const google = (sub: string): AuthCredential => GoogleAuthProvider.credential(token({ sub, email: `${sub}@gmail.com`, email_verified: true }));

afterEach(async () => {
  while (apps.length) await deleteApp(apps.pop()!);
  await fetch(`http://${HOST}/emulator/v1/projects/${PROJECT}/accounts`, { method: 'DELETE' });
});

describe('SI6 · Firebase keeps the guest and finds the existing account', () => {
  for (const [name, cred] of [['Apple', () => apple(`apple-${Date.now()}`, 'raw-nonce')], ['Google', () => google(`google-${Date.now()}`)]] as const) {
    it(`${name}: a guest links and keeps its uid; a second phone's guest gets the first account`, async () => {
      const c = cred();
      const a = phone();
      const guest = (await signInAnonymously(a)).user;
      const linked = (await linkWithCredential(guest, c)).user;
      expect(linked.uid).toBe(guest.uid);
      expect(linked.isAnonymous).toBe(false);

      const b = phone();
      const otherGuest = (await signInAnonymously(b)).user;
      let error: FirebaseError | null = null;
      try {
        await linkWithCredential(otherGuest, c);
      } catch (e: unknown) {
        error = e as FirebaseError;
      }
      expect(error?.code).toBe('auth/credential-already-in-use');
      // The app signs in with the error's credential when Firebase hands one back (production does for Apple), else
      // with the one it has (signIn.ts toFirebase). The emulator hands none back, so this is the fallback path.
      const fromError = OAuthProvider.credentialFromError(error!) ?? GoogleAuthProvider.credentialFromError(error!);
      const back = (await signInWithCredential(b, fromError ?? c)).user;
      expect(back.uid).toBe(guest.uid);
      expect(back.uid).not.toBe(otherGuest.uid);

      // Sign out, then signing in again on the first phone lands on the same account.
      await signOut(a);
      expect(a.currentUser).toBeNull();
      expect((await signInWithCredential(a, c)).user.uid).toBe(guest.uid);
    });
  }
});

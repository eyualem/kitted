// The real sign-in (#295): Continue with Google through Google's own sheet, then Firebase Auth with that Google token.
// Implements the same AuthService as MockAuth. Apple waits for the $99 program and email for the Worker's code route, so
// both report `failed` here and the sheet doesn't offer them (SIGN_IN_LIVE).
// Sync isn't wired yet, so an account holds nothing on the server: `holdings` is null and deleting the account deletes
// the Auth user only. When sync is wired, deleteAccount calls the server job instead (firebase/functions deleteAccount).
import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, deleteUser, linkWithCredential, signInWithCredential, signOut as fbSignOut } from 'firebase/auth';
import { GOOGLE_IOS_CLIENT_ID } from '@/config/firebase';
import { firebaseAuth } from '@/services/firebase/app';
import { keepGuest } from '@/services/server/guest';
import type { AuthService, SignInResult } from './auth';

let configured = false;
function configure(): boolean {
  if (!GOOGLE_IOS_CLIENT_ID) return false;
  if (!configured) {
    GoogleSignin.configure({ iosClientId: GOOGLE_IOS_CLIENT_ID });
    configured = true;
  }
  return true;
}

const isNetwork = (e: unknown) => {
  const code = (e as { code?: string }).code ?? '';
  return code === 'auth/network-request-failed' || code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE || /network/i.test(String((e as Error).message ?? ''));
};

export function createFirebaseAuth(now: () => number = () => Date.now()): AuthService {
  return {
    async signIn(provider): Promise<SignInResult> {
      if (provider !== 'google' || !configure()) return { kind: 'failed' };
      try {
        const res = await GoogleSignin.signIn();
        if (!isSuccessResponse(res)) return { kind: 'cancelled' };
        const idToken = res.data.idToken;
        if (!idToken) return { kind: 'failed' };
        // A guest (the server's silent account, 13-server.md §8) keeps its uid: Google is linked to it (A11).
        const auth = firebaseAuth();
        const google = GoogleAuthProvider.credential(idToken);
        const cred = await keepGuest(auth.currentUser, () => linkWithCredential(auth.currentUser!, google), () => signInWithCredential(auth, google));
        return {
          kind: 'ok',
          user: { uid: cred.user.uid, provider: 'google', email: cred.user.email ?? res.data.user.email ?? null, signedInAt: now() },
          holdings: null,
        };
      } catch (e: unknown) {
        if (isErrorWithCode(e) && e.code === statusCodes.IN_PROGRESS) return { kind: 'cancelled' };
        if (isNetwork(e)) return { kind: 'offline' };
        console.warn('[account] Google sign-in failed', (e as { code?: string }).code ?? e);
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
      try {
        if (configure()) await GoogleSignin.signOut();
      } catch (e: unknown) {
        console.warn('[account] Google sign-out', e);
      }
      await fbSignOut(firebaseAuth());
    },
    async deleteAccount() {
      const user = firebaseAuth().currentUser;
      if (!user) return { kind: 'ok' };
      try {
        if (configure()) await GoogleSignin.revokeAccess().catch(() => undefined);
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

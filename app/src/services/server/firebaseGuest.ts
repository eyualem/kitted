// GuestAuth on the real Firebase JS SDK (the app's one Auth instance, services/firebase/app.ts). Loaded only when the
// first server call needs a token (index.ts imports it lazily), so nothing touches Firebase before then.
import { signInAnonymously } from 'firebase/auth';
import { firebaseAuth } from '@/services/firebase/app';
import type { GuestAuth } from './guest';

export function firebaseGuest(): GuestAuth {
  const auth = firebaseAuth();
  return {
    ready: () => auth.authStateReady(),
    current: () => auth.currentUser,
    signInAnonymously: async () => (await signInAnonymously(auth)).user,
  };
}

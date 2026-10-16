// The Firebase app and its sign-in, created once, on iPhone only (the web preview never signs in). The JS SDK, not the
// native Firebase SDKs: SQLite stays the phone's real copy (11 §4), so nothing needs Firebase's native offline cache,
// and the native SDKs would force static frameworks on every other native module (#295).
// The sign-in survives restarts in the Keychain (expo-secure-store), next to the device ID.
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';
import * as SecureStore from 'expo-secure-store';
import { FIREBASE_CONFIG } from '@/config/firebase';

const OPTS: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK };
/** Keychain keys allow only letters, digits, ".", "-" and "_"; Firebase's look like "firebase:authUser:KEY:[DEFAULT]". */
export const keychainKey = (k: string) => `kitted.fb.${k.replace(/[^A-Za-z0-9._-]/g, '_')}`;

const keychainStorage = {
  getItem: (k: string) => SecureStore.getItemAsync(keychainKey(k), OPTS),
  setItem: (k: string, v: string) => SecureStore.setItemAsync(keychainKey(k), v, OPTS),
  removeItem: (k: string) => SecureStore.deleteItemAsync(keychainKey(k), OPTS),
};

let auth: Auth | null = null;

export function firebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
}

export function firebaseAuth(): Auth {
  if (auth) return auth;
  const app = firebaseApp();
  try {
    auth = initializeAuth(app, { persistence: getReactNativePersistence(keychainStorage) });
  } catch {
    auth = getAuth(app); // already initialized (fast refresh)
  }
  return auth;
}

// Firestore and Cloud Functions for backup (handoff/11-firestore-schema.md §11; ported from the old PR #57), on the Firebase app in
// app.ts. Memory cache only: SQLite is the phone's real copy (11 §4). Long polling is detected automatically (React Native has no
// WebSocket-style streaming for Firestore's channel). A dev build pointed at the local emulators (EXPO_PUBLIC_KITTED_SERVER=
// 127.0.0.1) uses the Firestore, Storage and Functions emulators too. Never in Release.
import { connectFirestoreEmulator, initializeFirestore, memoryLocalCache, type Firestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, httpsCallable, type Functions } from 'firebase/functions';
import { FIREBASE_CONFIG } from '@/config/firebase';
import { EMULATOR_FUNCTIONS_PORT, EMULATOR_PROJECT, emulatorHost } from '@/services/server/config';
import { RemoteUnavailable } from '@/sync/remote';
import { firebaseApp } from './app';

export const EMULATOR_FIRESTORE_PORT = 8080;
export const EMULATOR_STORAGE_PORT = 9199;
const REGION = 'us-central1';

let db: Firestore | null = null;
let fns: Functions | null = null;

export function firebaseDb(): Firestore {
  if (db) return db;
  db = initializeFirestore(firebaseApp(), { localCache: memoryLocalCache(), experimentalAutoDetectLongPolling: true });
  const host = emulatorHost();
  if (host) connectFirestoreEmulator(db, host, EMULATOR_FIRESTORE_PORT);
  return db;
}

export function firebaseFunctions(): Functions {
  if (fns) return fns;
  fns = getFunctions(firebaseApp(), REGION);
  const host = emulatorHost();
  if (host) connectFunctionsEmulator(fns, host, EMULATOR_FUNCTIONS_PORT);
  return fns;
}

/** Cloud Storage's REST endpoint and bucket (the emulator's when pointed at it). */
export function storageEndpoint(): { base: string; bucket: string } {
  const host = emulatorHost();
  return host
    ? { base: `http://${host}:${EMULATOR_STORAGE_PORT}`, bucket: `${EMULATOR_PROJECT}.appspot.com` }
    : { base: 'https://firebasestorage.googleapis.com', bucket: FIREBASE_CONFIG.storageBucket };
}

const isOffline = (e: unknown) => /unavailable|deadline|network|offline/i.test(String((e as { code?: string }).code ?? '') + String((e as Error).message ?? ''));

/** "Delete account and all data", the server step (SB9): the `deleteAccount` job removes his database, photos and the account,
 *  once. Nothing on the phone changes here. */
export async function deleteAccountOnServer(): Promise<'ok' | 'failed' | 'offline'> {
  try {
    await httpsCallable(firebaseFunctions(), 'deleteAccount', { timeout: 60_000 })({});
    return 'ok';
  } catch (e: unknown) {
    console.warn('[sync] deleteAccount', (e as { code?: string }).code ?? e);
    return isOffline(e) ? 'offline' : 'failed';
  }
}

/** "Turn off photo backup" (SB4.3): the `deleteBackedUpPhotosJob` job deletes everything under his files folder. Resolves when it is
 *  done; rejects with RemoteUnavailable when there is no connection, any other Error when the job failed. */
export async function deleteBackedUpPhotosOnServer(): Promise<void> {
  try {
    await httpsCallable(firebaseFunctions(), 'deleteBackedUpPhotosJob', { timeout: 60_000 })({});
  } catch (e: unknown) {
    console.warn('[sync] deleteBackedUpPhotos', (e as { code?: string }).code ?? e);
    throw isOffline(e) ? new RemoteUnavailable() : e instanceof Error ? e : new Error(String(e));
  }
}

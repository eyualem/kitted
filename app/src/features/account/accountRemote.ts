// The signed-in account's server folder as the sync engine's RemoteStore (sync/firestoreRemote.ts), with Firebase loaded only now: the
// web preview, Jest and anyone who never signs in never load it. Used by the sign-in sheet's read-only fetch of the account's fit ids
// (SB7.1) and by the restore screen (SB6).
import type { RemoteStore } from '@/sync/remote';

export function accountRemote(uid: string): RemoteStore {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const fs = require('firebase/firestore') as typeof import('firebase/firestore');
  const { firebaseDb } = require('@/services/firebase/data') as typeof import('@/services/firebase/data');
  const { createFirestoreRemote } = require('@/sync/firestoreRemote') as typeof import('@/sync/firestoreRemote');
  /* eslint-enable @typescript-eslint/no-require-imports */
  return createFirestoreRemote({ fs, db: firebaseDb(), uid });
}

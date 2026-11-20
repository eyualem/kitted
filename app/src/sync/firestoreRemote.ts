// T41b (SB4.1b): the sync engine's server on Firestore, ported from the old PR #57 (`git show
// claude/backup-sync-au1-658e0f:app/src/sync/firestoreRemote.ts`): one person's folder users/{uid}, a push is one batch of
// set-with-merge, reads go from the server, a timeout or a connection error is RemoteUnavailable, a rule's no is RemoteRefused.
// The SDK comes in as an argument so the emulator tests run it with their own copy. STUB: createFirestoreRemote throws.
import type * as FS from 'firebase/firestore';
import type { RemoteStore } from './remote';

export type FirestoreSdk = Pick<
  typeof FS,
  | 'collection' | 'deleteField' | 'doc' | 'documentId' | 'getCountFromServer' | 'getDocFromServer' | 'getDocsFromServer'
  | 'limit' | 'onSnapshot' | 'orderBy' | 'query' | 'serverTimestamp' | 'setDoc' | 'startAfter' | 'Timestamp' | 'updateDoc'
  | 'where' | 'writeBatch'
>;

export interface FirestoreRemoteOptions {
  fs: FirestoreSdk;
  db: FS.Firestore;
  uid: string;
  /** Per call (default 20 s). */
  timeoutMs?: number;
}

export function createFirestoreRemote(_o: FirestoreRemoteOptions): RemoteStore {
  throw new Error('T41b: not built');
}

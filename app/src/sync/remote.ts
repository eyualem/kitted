// What the sync engine needs from the server, and from the file store. The Firestore + Cloud Storage adapters
// (React Native Firebase, once its packages are OK'd) implement these; memoryRemote.ts implements them for tests with
// the same checks as firebase/firestore.rules and storage.rules.
import type { Cursor, RemoteWrite, StoredDoc } from './types';

export interface RemoteStore {
  /** Writes up to 500 docs atomically under users/{uid}. Each write merges into `data` (a tombstone removes it); the
   *  server sets serverAt. Throws RemoteRefused if any doc breaks a rule (the whole batch fails, as in Firestore), or
   *  RemoteUnavailable when offline. */
  commit(writes: readonly RemoteWrite[]): Promise<void>;
  get(coll: string, id: string): Promise<StoredDoc | null>;
  /** Docs changed after the cursor, oldest first (serverAt, then id), at most `limit`. serverAt's unit is the
   *  adapter's own (ms here, µs in Firestore); the engine only orders by it and hands it back. */
  changesSince(coll: string, cursor: Cursor | null, limit: number): Promise<StoredDoc[]>;
}

/** The phone's side of file backup. Paths are relative to Documents ("photos/<sha>-photo.jpg"). */
export interface FileTransport {
  exists(path: string): boolean;
  /** Uploads (a kept photo re-encoded at 1600 px, no metadata) to users/{uid}/files/{path}. RemoteRefused when a rule says
   *  no (over 3 MB, a wrong name): never retried. */
  upload(path: string): Promise<void>;
  /** RemoteMissing when the server has no such file (yet). */
  download(path: string): Promise<void>;
  /** A file already gone counts as removed. */
  remove(path: string): Promise<void>;
  /** Deletes this phone's copy (a row deleted on his other phone takes its photo with it). Never throws. */
  removeLocal(path: string): void;
  /** False on cellular when only Wi-Fi is allowed, or offline. */
  canTransfer(): boolean;
}

/** A rule refused the write (permission-denied). */
export class RemoteRefused extends Error {
  constructor(message = 'refused') {
    super(message);
    this.name = 'RemoteRefused';
  }
}

/** Offline or the server didn't answer: try again later, nothing was written. */
export class RemoteUnavailable extends Error {
  constructor(message = 'unavailable') {
    super(message);
    this.name = 'RemoteUnavailable';
  }
}

/** The file isn't on the server (yet): another phone hasn't uploaded it, or it was deleted. */
export class RemoteMissing extends Error {
  constructor(message = 'missing') {
    super(message);
    this.name = 'RemoteMissing';
  }
}

/** Firestore's limit is 500 writes per batch; 400 leaves room. */
export const MAX_BATCH = 400;

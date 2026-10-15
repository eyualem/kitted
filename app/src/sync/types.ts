// The sync engine's own rows (V7) and the document shape on the server (handoff/11-firestore-schema.md §2.1, §4).
// These live outside data/types.ts: they're bookkeeping, never shown on a screen.

/** One synced row's change record (sync_rows). The domain tables don't change; this shadow row says when the row last
 *  changed here, whether that change has reached the server, and whether it was a delete. */
export interface SyncRow {
  /** `${collection}/${rowKey}` */
  id: string;
  coll: string;
  rowKey: string;
  /** When it last changed on this phone, or the applied remote doc's updatedAt (ms). Strictly increases per row. */
  localAt: number;
  /** The localAt that last reached the server; null = never. Dirty while localAt > pushedAt. */
  pushedAt: number | null;
  deleted: boolean;
  /** The device that made the change localAt describes (the tie-break). */
  by: string;
  /** The file paths the row held when it was last pushed or pulled (so a delete can remove them remotely). */
  files: string[];
}

export type SyncFileOp = 'up' | 'down' | 'gone';

/** One file waiting to move (sync_files). Key = the relative path ("photos/<sha>-photo.jpg"). */
export interface SyncFile {
  path: string;
  op: SyncFileOp;
  tries: number;
  /** Not before this time (ms): the retry backoff. */
  nextAt: number;
  queuedAt: number;
}

/** A document as the phone writes it. The server adds serverAt (= request.time). */
export interface RemoteDoc {
  id: string;
  v: number;
  updatedAt: number;
  deleted: boolean;
  by: string;
  /** The row (absent on a tombstone). Pushes merge into it, never replace it, so fields from a newer app survive. */
  data?: Record<string, unknown>;
}

/** A document as read back: serverAt is the server's clock (ms here; a Timestamp in Firestore). */
export interface StoredDoc extends RemoteDoc {
  serverAt: number;
}

export interface RemoteWrite {
  coll: string;
  doc: RemoteDoc;
}

/** Where a pull resumes: after this server time and, among docs with the same time (one batch), this id. */
export interface Cursor {
  at: number;
  id: string;
}

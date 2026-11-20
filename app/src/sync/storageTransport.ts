// T41b (SB4.1b): his backed-up photos on Cloud Storage through its REST API, ported from the old PR #57 (`git show
// claude/backup-sync-au1-658e0f:app/src/sync/storageTransport.ts`): upload = the resumable protocol in one go (a small request
// that names the file and its type, then the bytes) to users/{uid}/files/{path} with his ID token; download; remove (a 404 on
// remove is fine). The phone side (reading and writing Documents) comes in as `http`. STUB: createStorageTransport throws.
import type { FileTransport } from './remote';

export interface StorageHttp {
  exists(path: string): boolean;
  /** Bytes, or null when unknown. */
  size(path: string): number | null;
  /** A small request. Resolves with the status and the headers (names in lower case) for any answer; rejects only when no answer came. */
  request(method: 'POST' | 'DELETE', url: string, headers: Record<string, string>, body?: string): Promise<{ status: number; headers: Record<string, string> }>;
  /** POSTs the file's bytes as the body. */
  send(url: string, path: string, headers: Record<string, string>): Promise<{ status: number }>;
  /** GETs the URL; writes the body to the path only on a 2xx. */
  download(url: string, path: string, headers: Record<string, string>): Promise<{ status: number }>;
  removeLocal(path: string): void;
}

export interface StorageTransportOptions {
  http: StorageHttp;
  /** "kitted-a5b45.firebasestorage.app" */
  bucket: string;
  /** "https://firebasestorage.googleapis.com", or the emulator's "http://127.0.0.1:9199". */
  base: string;
  uid: string;
  /** His Firebase ID token; null when signed out. */
  token(): Promise<string | null>;
  canTransfer(): boolean;
}

export function createStorageTransport(_o: StorageTransportOptions): FileTransport {
  throw new Error('T41b: not built');
}

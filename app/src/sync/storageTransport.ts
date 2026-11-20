// His backed-up photos on Cloud Storage (handoff/11-firestore-schema.md §3, §11; ported from the old PR #57), through Storage's
// REST API: the same endpoints the Firebase JS SDK calls, with his sign-in token. An upload is the SDK's resumable protocol in one
// go: a small request that names the file and its type (the rules read the type from it), then the bytes. The phone side
// (reading and writing files under Documents) comes in as `http`: expo-file-system's native upload on the phone (it streams the
// file from disk), node's fetch and fs in the emulator tests (firebase/tests runs this file).
import { RemoteMissing, RemoteRefused, RemoteUnavailable, type FileTransport } from './remote';
import { syncedFilePath } from './schema';

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
  /** His Firebase ID token (refreshed by the SDK); null when signed out. */
  token(): Promise<string | null>;
  /** Online, in the foreground, no fit check running. */
  canTransfer(): boolean;
}

/** The rules' limit (storage.rules goodImage). */
export const MAX_FILE_BYTES = 3 * 1024 * 1024;

export function contentType(path: string): string {
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.print')) return 'application/octet-stream';
  return 'image/jpeg';
}

export function createStorageTransport(o: StorageTransportOptions): FileTransport {
  const object = (path: string) => `users/${o.uid}/files/${path}`;
  const objectUrl = (path: string) => `${o.base}/v0/b/${o.bucket}/o/${encodeURIComponent(object(path))}`;

  async function auth(): Promise<Record<string, string>> {
    const token = await o.token();
    if (!token) throw new RemoteUnavailable('signed out');
    return { Authorization: `Firebase ${token}` };
  }

  /** A status as the engine reads it. */
  function check(status: number, what: string): void {
    if (status >= 200 && status < 300) return;
    if (status === 404) throw new RemoteMissing(what);
    // 401: the token lapsed (it's refreshed next time); 408, 429 and 5xx: try again later.
    if (status === 401 || status === 408 || status === 429 || status >= 500) throw new RemoteUnavailable(`${status} ${what}`);
    throw new RemoteRefused(`${status} ${what}`);
  }

  const call = async <T>(p: Promise<T>): Promise<T> => {
    try {
      return await p;
    } catch (e: unknown) {
      // No answer at all: the connection dropped.
      throw new RemoteUnavailable(String((e as Error)?.message ?? e));
    }
  };

  return {
    exists: (path) => o.http.exists(path),
    async upload(path) {
      if (syncedFilePath(path) !== path) throw new RemoteRefused(`never uploaded: ${path}`);
      const size = o.http.size(path);
      if (size !== null && size >= MAX_FILE_BYTES) throw new RemoteRefused(`too big (${size} B): ${path}`);
      const type = contentType(path);
      const authz = await auth();
      const start = await call(
        o.http.request(
          'POST',
          `${o.base}/v0/b/${o.bucket}/o?name=${encodeURIComponent(object(path))}`,
          {
            ...authz,
            'X-Goog-Upload-Protocol': 'resumable',
            'X-Goog-Upload-Command': 'start',
            'X-Goog-Upload-Header-Content-Type': type,
            ...(size !== null ? { 'X-Goog-Upload-Header-Content-Length': String(size) } : {}),
            'Content-Type': 'application/json; charset=utf-8',
          },
          JSON.stringify({ name: object(path), contentType: type }),
        ),
      );
      check(start.status, `upload ${path}`);
      const at = start.headers['x-goog-upload-url'];
      if (!at) throw new RemoteUnavailable(`no upload url: ${path}`);
      const r = await call(o.http.send(at, path, { ...authz, 'X-Goog-Upload-Protocol': 'resumable', 'X-Goog-Upload-Command': 'upload, finalize', 'X-Goog-Upload-Offset': '0' }));
      check(r.status, `upload ${path}`);
    },
    async download(path) {
      if (syncedFilePath(path) !== path) throw new RemoteRefused(`never downloaded: ${path}`);
      const r = await call(o.http.download(`${objectUrl(path)}?alt=media`, path, await auth()));
      check(r.status, `download ${path}`);
    },
    async remove(path) {
      const r = await call(o.http.request('DELETE', objectUrl(path), await auth()));
      // A file already gone counts as removed.
      if (r.status !== 404) check(r.status, `remove ${path}`);
    },
    removeLocal(path) {
      try {
        o.http.removeLocal(path);
      } catch (e: unknown) {
        console.warn(`[sync] couldn't delete ${path} on this phone`, e);
      }
    },
    canTransfer: () => o.canTransfer(),
  };
}

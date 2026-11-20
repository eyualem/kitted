// The phone's side of photo backup (storageTransport.ts's `http`): files under Documents, the bytes sent with
// expo-file-system's native upload (it streams the file from disk), the small requests and the download with fetch
// (the download's status matters: a 404 means his other phone hasn't uploaded it yet).
import { Directory, File, Paths } from 'expo-file-system';
import type { StorageHttp } from './storageTransport';

const fileAt = (path: string) => new File(Paths.document, path);

export const deviceFiles: StorageHttp = {
  exists: (path) => fileAt(path).exists,
  size(path) {
    const f = fileAt(path);
    return f.exists ? f.size : null;
  },
  async request(method, url, headers, body) {
    const res = await fetch(url, { method, headers, body });
    const out: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      out[k.toLowerCase()] = v;
    });
    return { status: res.status, headers: out };
  },
  async send(url, path, headers) {
    const r = await fileAt(path).upload(url, { httpMethod: 'POST', headers, sessionType: 'foreground' });
    return { status: r.status };
  },
  async download(url, path, headers) {
    const res = await fetch(url, { headers });
    if (!res.ok) return { status: res.status };
    const bytes = new Uint8Array(await res.arrayBuffer());
    const slash = path.lastIndexOf('/');
    if (slash > 0) new Directory(Paths.document, path.slice(0, slash)).create({ idempotent: true, intermediates: true });
    const f = fileAt(path);
    if (!f.exists) f.create();
    f.write(bytes);
    return { status: res.status };
  },
  removeLocal(path) {
    const f = fileAt(path);
    if (f.exists) f.delete();
  },
};

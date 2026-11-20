// T41b · SB4.1b: with photo backup off, no photo reaches Storage (specs/sign-in-and-backup.md; tasks/T41b/TESTING.md). The app's real
// backup (app/src/sync/backup.ts) with its real Firestore remote and Cloud Storage transport, against the emulators and their real
// rules, signed in through the Auth emulator as a non-anonymous user. The photos are 3-byte files in a temp folder; no real photo.
import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import * as fs from 'firebase/firestore';
import { initializeApp as initAdmin } from 'firebase-admin/app';
import { getFirestore as adminFirestore } from 'firebase-admin/firestore';
import { getStorage as adminStorage } from 'firebase-admin/storage';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { createMemoryStore } from '../../app/src/data/memoryStore';
import type { FitCheckRow } from '../../app/src/data/types';
import { createBackup } from '../../app/src/sync/backup';
import { createFirestoreRemote } from '../../app/src/sync/firestoreRemote';
import { PHOTO_BACKUP_KEY } from '../../app/src/sync/photoBackup';
import { createStorageTransport, type StorageHttp } from '../../app/src/sync/storageTransport';

const PROJECT = 'demo-kitted';
const BUCKET = `${PROJECT}.appspot.com`;
const STORAGE = 'http://127.0.0.1:9199';
const apps: FirebaseApp[] = [];
const dirs: string[] = [];

process.env.GCLOUD_PROJECT = PROJECT;
const admin = initAdmin({ projectId: PROJECT, storageBucket: BUCKET }, 'tests-t41b-sync');
const adminDb = adminFirestore(admin);
const adminBucket = adminStorage(admin).bucket(BUCKET);

afterAll(async () => {
  for (const a of apps) await deleteApp(a);
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

/** Node's side of the photo transport: a temp folder for Documents. */
function nodeFiles(root: string): StorageHttp {
  const at = (p: string) => join(root, p);
  return {
    exists: (p) => existsSync(at(p)),
    size: (p) => (existsSync(at(p)) ? statSync(at(p)).size : null),
    async request(method, url, headers, body) {
      const res = await fetch(url, { method, headers, body });
      return { status: res.status, headers: Object.fromEntries([...res.headers].map(([k, v]) => [k.toLowerCase(), v])) };
    },
    async send(url, p, headers) {
      const res = await fetch(url, { method: 'POST', headers, body: readFileSync(at(p)) });
      return { status: res.status };
    },
    async download(url, p, headers) {
      const res = await fetch(url, { headers });
      if (!res.ok) return { status: res.status };
      mkdirSync(dirname(at(p)), { recursive: true });
      writeFileSync(at(p), Buffer.from(await res.arrayBuffer()));
      return { status: res.status };
    },
    removeLocal: (p) => rmSync(at(p), { force: true }),
  };
}

const check = (id: string, over: Partial<FitCheckRow> = {}): FitCheckRow =>
  ({
    id, createdAt: Date.now() - 1000, dayKey: '2026-11-19', photoFile: `photos/${id}-photo.jpg`, thumbFile: `photos/${id}-thumb.jpg`, demoPhotoId: null,
    imageHash: id, occasion: 'everyday', style: null, status: 'scored', isPartial: false, notRated: [], score: 7.5, rawScore: 7.4, subscores: {}, occasionAdj: 0,
    rulesFired: [], credits: [], advice: [], fixes: [], explanation: null, rubricVersion: 'parts', isFavorite: false, snapState: 'none', recheckUsed: false,
    isFirstCheck: false, readingId: null, parentId: null, itemIds: [], details: {}, ...over,
  }) as FitCheckRow;

/** A phone signed in (not as a guest) to a fresh account on the emulators, with two kept photos on disk and a fit check pointing at them. */
async function signedInPhone() {
  const app = initializeApp({ projectId: PROJECT, apiKey: 'emulator', storageBucket: BUCKET }, `phone-${Date.now()}-${Math.floor(Math.random() * 1e6)}`);
  apps.push(app);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const cred = await createUserWithEmailAndPassword(auth, `x${Date.now()}${Math.floor(Math.random() * 1e6)}@kitted.test`, 'kitted-test');
  expect(cred.user.isAnonymous).toBe(false);
  const uid = cred.user.uid;
  const db = fs.getFirestore(app);
  fs.connectFirestoreEmulator(db, '127.0.0.1', 8080);
  const root = mkdtempSync(join(tmpdir(), 'kitted-t41b-'));
  dirs.push(root);
  const store = createMemoryStore();
  await store.init();
  await store.fitChecks.put(check('FC1'));
  for (const p of ['photos/FC1-photo.jpg', 'photos/FC1-thumb.jpg']) {
    mkdirSync(dirname(join(root, p)), { recursive: true });
    writeFileSync(join(root, p), Buffer.from([1, 2, 3]));
  }
  const backup = createBackup({
    store,
    async connect(u) {
      return {
        remote: createFirestoreRemote({ fs, db, uid: u, timeoutMs: 10_000 }),
        files: createStorageTransport({ http: nodeFiles(root), bucket: BUCKET, base: STORAGE, uid: u, token: () => auth.currentUser!.getIdToken(), canTransfer: () => true }),
      };
    },
    account: async () => ({ uid }),
    firebaseUser: async () => ({ uid, isAnonymous: false }),
    allowed: () => true,
    online: () => true,
    nowMs: () => Date.now(),
    deviceId: async () => 'dev-a',
    log: () => {},
  });
  return { uid, store, backup };
}

const storedFiles = async (uid: string) => (await adminBucket.getFiles({ prefix: `users/${uid}/files/` }))[0].map((f) => f.name).sort();

describe('SB4.1b · with photo backup off, no photo reaches Storage', () => {
  it('SB4.1b · a full sync with photos on his phone and the setting off leaves users/{uid}/files/ empty, and the rows are on the server', async () => {
    const p = await signedInPhone();
    expect(await p.backup.syncNow()).toBe('ok');
    expect((await adminDb.collection(`users/${p.uid}/fitChecks`).get()).docs.map((d) => d.id)).toEqual(['FC1']);
    expect(await storedFiles(p.uid)).toEqual([]);
    // Another round (the app back in the foreground): still nothing.
    expect(await p.backup.syncNow()).toBe('ok');
    expect(await storedFiles(p.uid)).toEqual([]);
  });

  it('SB4.1b · with the setting on the same photos land there', async () => {
    const p = await signedInPhone();
    await p.store.setKv(PHOTO_BACKUP_KEY, 'on');
    expect(await p.backup.syncNow()).toBe('ok');
    expect(await storedFiles(p.uid)).toEqual([`users/${p.uid}/files/photos/FC1-photo.jpg`, `users/${p.uid}/files/photos/FC1-thumb.jpg`]);
  });
});

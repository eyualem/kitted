// Checks X1–X8 (handoff/11-firestore-schema.md §11.4, #386): the app's real sync adapters (app/src/sync/firestoreRemote.ts,
// storageTransport.ts) and engine, on the emulators with the real rules (firebase.json loads firestore.rules and
// storage.rules), signed in through the Auth emulator. Two "phones" are two Firebase apps signed in to the same account,
// each with its own in-memory store and its own folder of files. Run from firebase/: npm --prefix tests run emulate
import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, type Auth } from 'firebase/auth';
import * as fs from 'firebase/firestore';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { createMemoryStore } from '../../app/src/data/memoryStore';
import type { KittedStore } from '../../app/src/data/store';
import { createSyncEngine } from '../../app/src/sync/engine';
import { createFirestoreRemote, type FirestoreRemote } from '../../app/src/sync/firestoreRemote';
import { createStorageTransport, type StorageHttp } from '../../app/src/sync/storageTransport';
import { trackChanges } from '../../app/src/sync/tracker';

const PROJECT = 'demo-kitted';
const BUCKET = `${PROJECT}.appspot.com`;
const STORAGE = 'http://127.0.0.1:9199';
const apps: FirebaseApp[] = [];
const dirs: string[] = [];
let n = 0;

afterAll(async () => {
  for (const a of apps) await deleteApp(a);
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

/** A signed-in Firebase app with its Firestore on the emulators. */
async function signIn(email: string, create: boolean): Promise<{ db: fs.Firestore; auth: Auth; uid: string }> {
  const app = initializeApp({ projectId: PROJECT, apiKey: 'emulator', storageBucket: BUCKET }, `phone-${++n}`);
  apps.push(app);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const cred = create ? await createUserWithEmailAndPassword(auth, email, 'kitted-test') : await signInWithEmailAndPassword(auth, email, 'kitted-test');
  const db = fs.getFirestore(app);
  fs.connectFirestoreEmulator(db, '127.0.0.1', 8080);
  return { db, auth, uid: cred.user.uid };
}

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

interface Phone {
  inner: KittedStore;
  app: KittedStore;
  remote: FirestoreRemote;
  engine: ReturnType<typeof createSyncEngine>;
  root: string;
  db: fs.Firestore;
  uid: string;
  clock: { now: number };
  token(): Promise<string>;
}

async function phone(email: string, device: string, create = false): Promise<Phone> {
  const { db, auth, uid } = await signIn(email, create);
  const inner = createMemoryStore();
  const clock = { now: Date.now() };
  const root = mkdtempSync(join(tmpdir(), 'kitted-sync-'));
  dirs.push(root);
  const app = trackChanges(inner, { isOn: () => true, nowMs: () => clock.now, deviceId: device });
  const remote = createFirestoreRemote({ fs, db, uid, timeoutMs: 10_000 });
  const token = () => auth.currentUser!.getIdToken();
  const files = createStorageTransport({ http: nodeFiles(root), bucket: BUCKET, base: STORAGE, uid, token, canTransfer: () => true });
  const engine = createSyncEngine({ store: inner, remote, files, deviceId: device, nowMs: () => clock.now, enabled: () => true });
  return { inner, app, remote, engine, root, db, uid, clock, token };
}

const account = () => `x${Date.now()}${Math.floor(Math.random() * 1e6)}@kitted.test`;
const msg = (id: string, text: string, payload: Record<string, unknown> = {}) => ({
  id, createdAt: 1, role: 'user' as const, kind: 'text' as const, text, cardType: null, fitCheckId: null, outfitId: null, itemId: null, chips: [], payload,
});
const check = (id: string, over: Record<string, unknown> = {}) =>
  ({
    id, createdAt: 1, dayKey: '2026-11-03', photoFile: `photos/${id}-photo.jpg`, thumbFile: null, demoPhotoId: null, imageHash: id, occasion: 'everyday',
    style: null, status: 'scored', isPartial: false, notRated: [], score: 7.5, rawScore: 7.4, subscores: {}, occasionAdj: 0, rulesFired: [], credits: [],
    advice: [], fixes: [], explanation: null, rubricVersion: 'p15', isFavorite: false, snapState: 'none', recheckUsed: false, isFirstCheck: false,
    readingId: null, parentId: null, itemIds: [], details: {}, ...over,
  }) as never;
const profile = { id: 'me', birthYear: 2004, heightCm: null, build: '', fitPreference: 'regular', styles: [['streetwear', 0.5]], boldness: null, budget: null,
  lastOccasion: 'everyday', consentVersion: '2', consentAt: 5, onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: 1 } as never;

describe('X1 a fresh phone gets the account back, row for row', () => {
  it('rows of every kind go up from A and come down on B', async () => {
    const email = account();
    const a = await phone(email, 'dev-a', true);
    await a.app.profile.put(profile);
    await a.app.fitChecks.put(check('FC-1'));
    await a.app.fitChecks.put(check('FC-2', { parentId: 'FC-1', photoFile: null }));
    await a.app.chat.put(msg('M-1', 'What shoes with grey chinos?'));
    await a.app.facts.put({ id: 'F-1', key: 'budget', value: 'under $60', source: 'told', createdAt: 1, isDeleted: false });
    await a.app.setKv('appearance', 'dark');
    await a.app.setKv('onboarding.basics', JSON.stringify({ fit: 'regular', birthYear: 2004 }));
    const pushed = await a.engine.push();
    expect(pushed).toMatchObject({ sent: 7, refused: 0, lost: 0 });

    const b = await phone(email, 'dev-b');
    expect(b.uid).toBe(a.uid);
    await b.engine.pull();
    expect((await b.inner.fitChecks.all()).map((c) => c.id).sort()).toEqual(['FC-1', 'FC-2']);
    expect(await b.inner.chat.get('M-1')).toEqual(await a.inner.chat.get('M-1'));
    expect(await b.inner.facts.get('F-1')).toEqual(await a.inner.facts.get('F-1'));
    expect(await b.inner.profile.get('me')).toMatchObject({ birthYear: null, consentVersion: null, styles: [['streetwear', 0.5]], fitPreference: 'regular' });
    expect(await b.inner.getKv('appearance')).toBe('dark');
    expect(JSON.parse((await b.inner.getKv('onboarding.basics'))!)).toEqual({ fit: 'regular', birthYear: null });
    // On the server: no age, no agreement.
    const prof = (await fs.getDocFromServer(fs.doc(a.db, 'users', a.uid, 'profile', 'me'))).data()!;
    expect(prof.data).not.toHaveProperty('birthYear');
    expect(prof.data).not.toHaveProperty('consentVersion');
    // Nothing changed: a second push sends nothing.
    expect(await a.engine.push()).toMatchObject({ sent: 0 });
  });
});

describe('X2 a tombstone', () => {
  it('has no data on the server and deletes the row on B', async () => {
    const email = account();
    const a = await phone(email, 'dev-a', true);
    const b = await phone(email, 'dev-b');
    await a.app.chat.put(msg('M-1', 'hi'));
    await a.engine.push();
    await b.engine.pull();
    a.clock.now += 10;
    await a.app.chat.delete('M-1');
    await a.engine.push();
    const stored = (await fs.getDocFromServer(fs.doc(a.db, 'users', a.uid, 'chatMessages', 'M-1'))).data()!;
    expect(stored.deleted).toBe(true);
    expect(stored).not.toHaveProperty('data');
    await b.engine.pull();
    expect(await b.inner.chat.get('M-1')).toBeNull();
  });
});

describe('X3 a stale write', () => {
  it('is refused by the rules, and the newer copy comes down instead', async () => {
    const email = account();
    const a = await phone(email, 'dev-a', true);
    const b = await phone(email, 'dev-b');
    await a.app.chat.put(msg('M-1', 'first'));
    await a.engine.push();
    await b.engine.pull();
    b.clock.now = a.clock.now + 5;
    await b.app.chat.patch('M-1', { text: 'from b, older' });
    a.clock.now += 50;
    await a.app.chat.patch('M-1', { text: 'from a, newer' });
    await a.engine.push();
    const r = await b.engine.push();
    expect(r).toMatchObject({ lost: 1, refused: 0 });
    expect((await b.inner.chat.get('M-1'))!.text).toBe('from a, newer');
  });
});

describe('X4 one batch, one serverAt', () => {
  it('pages through 400 docs that share a serverAt without stalling or skipping', async () => {
    const email = account();
    const a = await phone(email, 'dev-a', true);
    for (let i = 0; i < 400; i += 1) await a.app.chat.put(msg(`M-${String(i).padStart(3, '0')}`, `m${i}`));
    expect(await a.engine.push()).toMatchObject({ sent: 400, batches: 1 });
    const seen: string[] = [];
    let cursor = null as { at: number; id: string } | null;
    for (let page = 0; page < 10; page += 1) {
      const docs = await a.remote.changesSince('chatMessages', cursor, 150);
      seen.push(...docs.map((d) => d.id));
      if (docs.length < 150) break;
      cursor = { at: docs[docs.length - 1]!.serverAt, id: docs[docs.length - 1]!.id };
    }
    expect(seen.length).toBe(400);
    expect(new Set(seen).size).toBe(400);
    const b = await phone(email, 'dev-b');
    await b.engine.pull();
    expect((await b.inner.chat.all()).length).toBe(400);
  }, 60_000);
});

describe('X5 photos', () => {
  it('go up, come down byte for byte, are deleted with their row, and no one else can read them', async () => {
    const email = account();
    const a = await phone(email, 'dev-a', true);
    const b = await phone(email, 'dev-b');
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5, 0xff, 0xd9]);
    mkdirSync(join(a.root, 'photos'), { recursive: true });
    writeFileSync(join(a.root, 'photos/FC-1-photo.jpg'), jpeg);
    await a.app.fitChecks.put(check('FC-1'));
    await a.engine.push();
    expect(await a.engine.drainFiles()).toEqual({ moved: 1, failed: 0 });
    await b.engine.pull();
    expect(await b.engine.drainFiles()).toEqual({ moved: 1, failed: 0 });
    expect(readFileSync(join(b.root, 'photos/FC-1-photo.jpg')).equals(jpeg)).toBe(true);

    const object = `${STORAGE}/v0/b/${BUCKET}/o/${encodeURIComponent(`users/${a.uid}/files/photos/FC-1-photo.jpg`)}?alt=media`;
    const bob = await signIn(account(), true);
    const asBob = await fetch(object, { headers: { Authorization: `Firebase ${await bob.auth.currentUser!.getIdToken()}` } });
    expect(asBob.status).toBe(403);

    a.clock.now += 10;
    await a.app.fitChecks.delete('FC-1');
    await a.engine.push();
    await a.engine.drainFiles();
    const after = await fetch(object, { headers: { Authorization: `Firebase ${await a.token()}` } });
    expect(after.status).toBe(404);
    await b.engine.pull();
    expect(existsSync(join(b.root, 'photos/FC-1-photo.jpg'))).toBe(false);
  });
});

describe('X6 a newer app\'s field', () => {
  it("survives an older phone's write", async () => {
    const email = account();
    const a = await phone(email, 'dev-a', true);
    await a.app.chat.put(msg('M-1', 'hi'));
    await a.engine.push();
    // A newer app wrote a field this app doesn't know.
    const at = fs.doc(a.db, 'users', a.uid, 'chatMessages', 'M-1');
    await fs.setDoc(at, { updatedAt: a.clock.now + 1, serverAt: fs.serverTimestamp(), by: 'dev-new', data: { mood: 'calm' } }, { merge: true });
    a.clock.now += 10;
    await a.app.chat.patch('M-1', { text: 'edited on the old phone' });
    await a.engine.push();
    const data = (await fs.getDocFromServer(at)).data()!.data as Record<string, unknown>;
    expect(data).toMatchObject({ mood: 'calm', text: 'edited on the old phone' });
  });
});

describe('X7 holdings', () => {
  it('counts scored fits (not re-checks), pieces and chats', async () => {
    const a = await phone(account(), 'dev-a', true);
    await a.app.fitChecks.put(check('FC-1'));
    await a.app.fitChecks.put(check('FC-2', { parentId: 'FC-1' }));
    await a.app.fitChecks.put(check('FC-3', { status: 'failed' }));
    await a.app.chat.put(msg('M-1', 'one'));
    await a.app.chat.put(msg('M-2', 'two'));
    await a.engine.push();
    expect(await a.remote.holdings()).toEqual({ fits: 1, pieces: 0, chats: 2 });
  });
});

describe('X8 the account and device docs', () => {
  it('pass the rules on the first day and the next', async () => {
    const a = await phone(account(), 'dev-a', true);
    await a.remote.touch({ deviceId: 'dev-a', appVersion: '0.1.0', v: 1 });
    await a.remote.touch({ deviceId: 'dev-a', appVersion: '0.1.1', v: 1 });
    const acct = (await fs.getDocFromServer(fs.doc(a.db, 'users', a.uid))).data()!;
    expect(Object.keys(acct).sort()).toEqual(['appVersion', 'createdAt', 'lastActiveAt', 'v']);
    expect(acct.appVersion).toBe('0.1.1');
    const device = (await fs.getDocFromServer(fs.doc(a.db, 'users', a.uid, 'devices', 'dev-a'))).data()!;
    expect(Object.keys(device).sort()).toEqual(['appVersion', 'createdAt', 'lastSyncAt', 'platform']);
  });
});

// T41b · server-job checks SB4.3a, SB5.1a, SB9.1c, SB9.1d (specs/sign-in-and-backup.md; tasks/T41b/TESTING.md), on the emulators (auth,
// firestore, storage). The job bodies run directly with the Admin SDK, as functions.test.ts does; the callables run through their
// handler with a made-up request. Files are one byte each; no real photo.
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

const PROJECT = 'demo-kitted';
const BUCKET = 'demo-kitted.appspot.com';

type Jobs = typeof import('../functions/src/index');
let jobs: Jobs;

const app = initializeApp({ projectId: PROJECT, storageBucket: BUCKET }, 'tests-t41b');
const db = getFirestore(app);
const bucket = getStorage(app).bucket(BUCKET);
const auth = getAuth(app);

beforeAll(async () => {
  process.env.GCLOUD_PROJECT = PROJECT;
  process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: PROJECT, storageBucket: BUCKET });
  jobs = await import('../functions/src/index');
});

beforeEach(async () => {
  await db.recursiveDelete(db.collection('users'));
  await db.recursiveDelete(db.collection('usage'));
  await db.recursiveDelete(db.collection('devices'));
  await bucket.deleteFiles({ force: true });
  const users = await auth.listUsers();
  if (users.users.length) await auth.deleteUsers(users.users.map((u) => u.uid));
});

const envelope = (id: string) => ({ id, v: 1, updatedAt: Date.now(), serverAt: Timestamp.now(), deleted: false, by: 'dev-a', data: { id } });
const FILES = ['photos/a-photo.jpg', 'photos/a-thumb.jpg', 'closet/a-top.png', 'scans/a-scan.jpg'];

/** One person with a doc in every synced collection, a devices doc, files in photos, closet and scans, a usage doc and an Auth user. */
async function seedPerson(uid: string) {
  await auth.createUser({ uid });
  await db.doc(`users/${uid}`).set({ createdAt: Timestamp.now(), lastActiveAt: Timestamp.now(), v: 1, appVersion: '1.1.0' });
  for (const c of jobs.SYNCED_COLLECTIONS) await db.doc(`users/${uid}/${c}/x1`).set(envelope('x1'));
  await db.doc(`users/${uid}/devices/D-1`).set({ platform: 'ios', appVersion: '1.1.0', createdAt: Timestamp.now(), lastSyncAt: Timestamp.now() });
  for (const p of FILES) await bucket.file(`users/${uid}/files/${p}`).save(Buffer.from('x'));
  await db.doc(`usage/${uid}/usageDays/2026-11-19`).set({ at: Date.now(), checks: 2 });
}

async function holdings(uid: string) {
  const root = (await db.doc(`users/${uid}`).get()).exists ? 1 : 0;
  let docs = root;
  for (const c of await db.doc(`users/${uid}`).listCollections()) docs += (await c.get()).size;
  const [files] = await bucket.getFiles({ prefix: `users/${uid}/` });
  const usage = (await db.collection(`usage/${uid}/usageDays`).get()).size;
  const user = await auth.getUser(uid).then(() => 1, () => 0);
  return { docs, files: files.length, usage, user };
}
const full = (n: number) => ({ docs: 1 + n + 1, files: FILES.length, usage: 1, user: 1 });
const request = (uid: string | null, data: unknown = {}) => ({ auth: uid ? { uid, token: {} } : undefined, data, rawRequest: {} }) as never;

describe('SB5.1a · the server has no chat collection', () => {
  it('SB5.1a · the jobs\' synced collections do not include chatMessages', () => {
    expect(jobs.SYNCED_COLLECTIONS as readonly string[]).not.toContain('chatMessages');
    expect(jobs.SYNCED_COLLECTIONS).toContain('fitChecks');
  });
});

describe('SB4.3a · deleteBackedUpPhotos', () => {
  it("removes every object under users/{uid}/files/ and nothing else: another user's files, the docs and the Auth user stay", async () => {
    await seedPerson('alice');
    await seedPerson('bob');
    const n = jobs.SYNCED_COLLECTIONS.length;
    expect(await holdings('alice')).toEqual(full(n));
    const r = await jobs.deleteBackedUpPhotos('alice');
    expect(r).toEqual({ files: FILES.length });
    expect(await holdings('alice')).toEqual({ ...full(n), files: 0 });
    expect(await holdings('bob')).toEqual(full(n));
    // Safe to run twice.
    await expect(jobs.deleteBackedUpPhotos('alice')).resolves.toEqual({ files: 0 });
    expect(await holdings('alice')).toEqual({ ...full(n), files: 0 });
  });

  it('SB4.3a · the callable works for the signed-in caller only, and never takes a uid from the request', async () => {
    await seedPerson('alice');
    await seedPerson('bob');
    const n = jobs.SYNCED_COLLECTIONS.length;
    await expect(jobs.deleteBackedUpPhotosJob.run(request(null))).rejects.toMatchObject({ code: 'unauthenticated' });
    expect((await holdings('alice')).files).toBe(FILES.length);
    await jobs.deleteBackedUpPhotosJob.run(request('alice', { uid: 'bob' }));
    expect(await holdings('alice')).toEqual({ ...full(n), files: 0 });
    expect(await holdings('bob')).toEqual(full(n));
  });
});

describe('SB9.1c · deleteEverything leaves the per-phone count', () => {
  it("removes users/{uid}, its files, usage/{uid} and the Auth user, and leaves a seeded devices/{hash}/usageDays doc in place", async () => {
    await seedPerson('alice');
    const n = jobs.SYNCED_COLLECTIONS.length;
    await db.doc('devices/hash-1/usageDays/2026-11-19').set({ at: Date.now(), checks: 3 });
    expect(await holdings('alice')).toEqual(full(n));
    await jobs.deleteEverything('alice');
    expect(await holdings('alice')).toEqual({ docs: 0, files: 0, usage: 0, user: 0 });
    const left = await db.doc('devices/hash-1/usageDays/2026-11-19').get();
    expect(left.exists).toBe(true);
    expect(left.data()).toMatchObject({ checks: 3 });
  });
});

describe('SB9.1d · the server delete is complete and safe to run twice', () => {
  it("deleteEverything(A) leaves nothing of A and all of B; running it again succeeds", async () => {
    await seedPerson('alice');
    await seedPerson('bob');
    const n = jobs.SYNCED_COLLECTIONS.length;
    await jobs.deleteEverything('alice');
    expect(await holdings('alice')).toEqual({ docs: 0, files: 0, usage: 0, user: 0 });
    expect(await holdings('bob')).toEqual(full(n));
    await expect(jobs.deleteEverything('alice')).resolves.toBeDefined();
    expect(await holdings('alice')).toEqual({ docs: 0, files: 0, usage: 0, user: 0 });
    expect(await holdings('bob')).toEqual(full(n));
  });

  it('SB9.1d · the callable refuses a signed-out caller and deletes the signed-in caller\'s account only', async () => {
    await seedPerson('alice');
    await seedPerson('bob');
    const n = jobs.SYNCED_COLLECTIONS.length;
    await expect(jobs.deleteAccount.run(request(null))).rejects.toMatchObject({ code: 'unauthenticated' });
    expect(await holdings('alice')).toEqual(full(n));
    expect(await holdings('bob')).toEqual(full(n));
    await expect(jobs.deleteAccount.run(request('alice', { uid: 'bob' }))).resolves.toEqual({ ok: true });
    expect(await holdings('alice')).toEqual({ docs: 0, files: 0, usage: 0, user: 0 });
    expect(await holdings('bob')).toEqual(full(n));
  });
});

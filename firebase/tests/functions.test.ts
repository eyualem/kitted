// Server-job checks F1–F3 (handoff/11-firestore-schema.md §9), on the emulators (auth, firestore, storage).
// The job bodies run directly with the Admin SDK; `firebase emulators:exec` points it at the emulators
// (FIRESTORE_EMULATOR_HOST, FIREBASE_AUTH_EMULATOR_HOST, FIREBASE_STORAGE_EMULATOR_HOST).
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

const PROJECT = 'demo-kitted';
const BUCKET = 'demo-kitted.appspot.com';
const DAY = 86_400_000;

type Jobs = typeof import('../functions/src/index');
let jobs: Jobs;

// The test's own Admin app (a separate copy of firebase-admin from the jobs'; both talk to the same emulators).
const app = initializeApp({ projectId: PROJECT, storageBucket: BUCKET }, 'tests');
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
  await bucket.deleteFiles({ force: true });
  const users = await auth.listUsers();
  if (users.users.length) await auth.deleteUsers(users.users.map((u) => u.uid));
});

const envelope = (id: string, serverAtMs: number, deleted = false) => ({
  id, v: 1, updatedAt: serverAtMs, serverAt: Timestamp.fromMillis(serverAtMs), deleted, by: 'dev-a', ...(deleted ? {} : { data: { id } }),
});

/** One person with something in every synced collection, three files and an Auth user. */
async function seedPerson(uid: string, lastActiveMs = Date.now()) {
  await auth.createUser({ uid });
  await db.doc(`users/${uid}`).set({ createdAt: Timestamp.now(), lastActiveAt: Timestamp.fromMillis(lastActiveMs), v: 1, appVersion: '1.1.0' });
  for (const c of jobs.SYNCED_COLLECTIONS) await db.doc(`users/${uid}/${c}/x1`).set(envelope('x1', Date.now()));
  await db.doc(`users/${uid}/devices/D-1`).set({ platform: 'ios', appVersion: '1.1.0', createdAt: Timestamp.now(), lastSyncAt: Timestamp.now() });
  for (const p of ['photos/a-photo.jpg', 'photos/a-thumb.jpg', 'closet/a-top.png']) await bucket.file(`users/${uid}/files/${p}`).save(Buffer.from('x'));
}

async function holdings(uid: string) {
  const docs = (await db.doc(`users/${uid}`).get()).exists ? 1 : 0;
  let sub = 0;
  for (const c of await db.doc(`users/${uid}`).listCollections()) sub += (await c.get()).size;
  const [files] = await bucket.getFiles({ prefix: `users/${uid}/` });
  const user = await auth.getUser(uid).then(() => 1, () => 0);
  return { docs: docs + sub, files: files.length, user };
}

describe('F1 deleteAccount', () => {
  it('removes every doc and file under users/{uid} and the Auth user; twice is fine; others untouched', async () => {
    await seedPerson('alice');
    await seedPerson('bob');
    expect(await holdings('alice')).toEqual({ docs: 1 + jobs.SYNCED_COLLECTIONS.length + 1, files: 3, user: 1 });
    await jobs.deleteEverything('alice');
    expect(await holdings('alice')).toEqual({ docs: 0, files: 0, user: 0 });
    await expect(jobs.deleteEverything('alice')).resolves.toBeDefined();
    expect(await holdings('bob')).toEqual({ docs: 1 + jobs.SYNCED_COLLECTIONS.length + 1, files: 3, user: 1 });
  });
});

describe('F2 purgeTombstones', () => {
  it('removes only tombstones older than the cutoff', async () => {
    const now = Date.now();
    await db.doc('users/alice/facts/old-tomb').set(envelope('old-tomb', now - 200 * DAY, true));
    await db.doc('users/alice/chatMessages/old-tomb').set(envelope('old-tomb', now - 181 * DAY, true));
    await db.doc('users/alice/facts/new-tomb').set(envelope('new-tomb', now - 10 * DAY, true));
    await db.doc('users/alice/facts/old-live').set(envelope('old-live', now - 400 * DAY));
    await db.doc('users/bob/readings/old-tomb').set(envelope('old-tomb', now - 300 * DAY, true));
    const removed = await jobs.purgeTombstonesBefore(now - jobs.TOMBSTONE_DAYS * DAY);
    expect(removed).toBe(3);
    const left = async (p: string) => (await db.doc(p).get()).exists;
    expect(await left('users/alice/facts/old-tomb')).toBe(false);
    expect(await left('users/alice/chatMessages/old-tomb')).toBe(false);
    expect(await left('users/bob/readings/old-tomb')).toBe(false);
    expect(await left('users/alice/facts/new-tomb')).toBe(true);
    expect(await left('users/alice/facts/old-live')).toBe(true);
  });
});

describe('F3 purgeInactive', () => {
  it('removes only accounts idle over 18 months, with everything they hold', async () => {
    const now = Date.now();
    await seedPerson('idle', now - 600 * DAY);
    await seedPerson('recent', now - 500 * DAY);
    const deleted = await jobs.purgeInactiveBefore(now - jobs.INACTIVE_DAYS * DAY);
    expect(deleted).toBe(1);
    expect(await holdings('idle')).toEqual({ docs: 0, files: 0, user: 0 });
    expect((await holdings('recent')).user).toBe(1);
  });
});

describe('F10.1 the phone\'s days', () => {
  it("F10.1 · the sweep also clears the phone's old days", async () => {
    for (const c of ['usage', 'spend', 'devices']) await db.recursiveDelete(db.collection(c));
    const now = Date.UTC(2026, 9, 30);
    const phone = 'f'.repeat(64); // a device document id is the sha256 hex of the ID
    await db.doc(`devices/${phone}`).set({ tz: -240, tzChangedAt: now - 20 * DAY });
    await db.doc(`devices/${phone}/usageDays/2026-10-20`).set({ checks: 1, at: now - (jobs.USAGE_DAYS + 3) * DAY });
    await db.doc(`devices/${phone}/usageDays/2026-10-28`).set({ checks: 1, at: now - 2 * DAY });
    await db.doc('usage/u1/usageDays/2026-10-20').set({ checks: 1, at: now - (jobs.USAGE_DAYS + 3) * DAY });
    expect(await jobs.purgeUsageBefore(now)).toEqual({ usage: 2, spend: 0 });
    expect((await db.collection(`devices/${phone}/usageDays`).get()).docs.map((d) => d.id)).toEqual(['2026-10-28']);
    expect((await db.collection('usage/u1/usageDays').get()).size).toBe(0);
    // The phone's own record (its tz) stays: only old days go.
    expect((await db.doc(`devices/${phone}`).get()).data()).toEqual({ tz: -240, tzChangedAt: now - 20 * DAY });
  });
});

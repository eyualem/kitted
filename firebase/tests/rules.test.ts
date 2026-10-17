// Security-rule checks R1–R10 (handoff/11-firestore-schema.md §9), on the Firebase emulator.
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc, collection, getDocs, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-kitted',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 },
    storage: { rules: readFileSync(new URL('../storage.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 9199 },
  });
});
afterAll(async () => env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await env.clearStorage();
});

const now = () => Date.now();
const envelope = (id: string, extra: Record<string, unknown> = {}) => ({
  id, v: 1, updatedAt: now(), serverAt: serverTimestamp(), deleted: false, by: 'device-a', data: { id, score: 7.5 }, ...extra,
});
const alice = () => env.authenticatedContext('alice').firestore();
const bob = () => env.authenticatedContext('bob').firestore();
const nobody = () => env.unauthenticatedContext().firestore();

describe('R1 signed out', () => {
  it('can read or write nothing', async () => {
    await assertFails(setDoc(doc(nobody(), 'users/alice/fitChecks/FC-1'), envelope('FC-1')));
    await assertFails(getDoc(doc(nobody(), 'users/alice/fitChecks/FC-1')));
    await assertFails(uploadBytes(ref(env.unauthenticatedContext().storage(), 'users/alice/files/photos/a-photo.jpg'), new Uint8Array([1]), { contentType: 'image/jpeg' }));
  });
});

describe('R2 one person per folder', () => {
  it("can't touch someone else's docs or files", async () => {
    await assertSucceeds(setDoc(doc(alice(), 'users/alice/fitChecks/FC-1'), envelope('FC-1')));
    await assertFails(getDoc(doc(bob(), 'users/alice/fitChecks/FC-1')));
    await assertFails(getDocs(collection(bob(), 'users/alice/fitChecks')));
    await assertFails(setDoc(doc(bob(), 'users/alice/fitChecks/FC-2'), envelope('FC-2')));
    const aliceFile = ref(env.authenticatedContext('alice').storage(), 'users/alice/files/photos/a-photo.jpg');
    await assertSucceeds(uploadBytes(aliceFile, new Uint8Array([1, 2]), { contentType: 'image/jpeg' }));
    await assertFails(getBytes(ref(env.authenticatedContext('bob').storage(), 'users/alice/files/photos/a-photo.jpg')));
  });
});

describe('R3 the envelope', () => {
  const at = 'users/alice/fitChecks/FC-1';
  it('takes a good one', async () => {
    await assertSucceeds(setDoc(doc(alice(), at), envelope('FC-1')));
  });
  it('refuses a bad one', async () => {
    const { by: _by, ...noBy } = envelope('FC-1');
    await assertFails(setDoc(doc(alice(), at), noBy));
    await assertFails(setDoc(doc(alice(), at), envelope('FC-1', { extra: 1 })));
    await assertFails(setDoc(doc(alice(), at), envelope('FC-9')));
    await assertFails(setDoc(doc(alice(), at), envelope('FC-1', { serverAt: Timestamp.fromMillis(now() - 60_000) })));
    await assertFails(setDoc(doc(alice(), at), envelope('FC-1', { updatedAt: now() + 2 * 86_400_000 })));
    await assertFails(setDoc(doc(alice(), at), envelope('FC-1', { v: 1.5 })));
    await assertFails(setDoc(doc(alice(), at), envelope('FC-1', { deleted: true })));
    const big = Object.fromEntries(Array.from({ length: 49 }, (_, i) => [`f${i}`, i]));
    await assertFails(setDoc(doc(alice(), at), envelope('FC-1', { data: big })));
  });
  it('takes a tombstone without data', async () => {
    const { data: _d, ...tomb } = envelope('FC-1', { deleted: true });
    await assertSucceeds(setDoc(doc(alice(), at), tomb));
  });
});

describe('R4 unknown collections', () => {
  it('refuses them', async () => {
    await assertFails(setDoc(doc(alice(), 'users/alice/usageDays/2026-10-15'), envelope('2026-10-15')));
    await assertFails(setDoc(doc(alice(), 'users/alice/whatever/x'), envelope('x')));
    await assertFails(setDoc(doc(alice(), 'other/x'), envelope('x')));
  });
});

describe('R5 newest wins', () => {
  it('refuses an older edit, takes an equal or newer one', async () => {
    const at = 'users/alice/closetItems/CI-1';
    const t = now();
    await assertSucceeds(setDoc(doc(alice(), at), envelope('CI-1', { updatedAt: t })));
    await assertFails(setDoc(doc(alice(), at), envelope('CI-1', { updatedAt: t - 1 })));
    await assertSucceeds(setDoc(doc(alice(), at), envelope('CI-1', { updatedAt: t })));
    await assertSucceeds(setDoc(doc(alice(), at), envelope('CI-1', { updatedAt: t + 1 })));
  });
});

describe('R6 no hard deletes from the phone', () => {
  it('refuses them', async () => {
    await assertSucceeds(setDoc(doc(alice(), 'users/alice/facts/F-1'), envelope('F-1')));
    await assertFails(deleteDoc(doc(alice(), 'users/alice/facts/F-1')));
    await assertSucceeds(setDoc(doc(alice(), 'users/alice'), { createdAt: serverTimestamp(), lastActiveAt: serverTimestamp(), v: 1, appVersion: '1.1.0' }));
    await assertFails(deleteDoc(doc(alice(), 'users/alice')));
  });
});

describe('R7 readings never change', () => {
  it('refuses a changed reading, takes a tombstone', async () => {
    const at = 'users/alice/readings/R-1';
    await assertSucceeds(setDoc(doc(alice(), at), envelope('R-1', { data: { id: 'R-1', reading: '{"a":1}' } })));
    await assertFails(setDoc(doc(alice(), at), envelope('R-1', { data: { id: 'R-1', reading: '{"a":2}' } })));
    await assertSucceeds(setDoc(doc(alice(), at), envelope('R-1', { data: { id: 'R-1', reading: '{"a":1}' } })));
    const { data: _d, ...tomb } = envelope('R-1', { deleted: true });
    await assertSucceeds(setDoc(doc(alice(), at), tomb));
  });
});

describe('R8 the account doc', () => {
  it('refuses server-only fields', async () => {
    const at = doc(alice(), 'users/alice');
    await assertFails(setDoc(at, { createdAt: serverTimestamp(), lastActiveAt: serverTimestamp(), v: 1, appVersion: '1', email: 'x@y.z' }));
    await assertSucceeds(setDoc(at, { createdAt: serverTimestamp(), lastActiveAt: serverTimestamp(), v: 1, appVersion: '1' }));
    await assertFails(updateDoc(at, { deleteRequestedAt: serverTimestamp(), lastActiveAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(at, { lastActiveAt: serverTimestamp(), v: 1, appVersion: '1.1' }));
  });
});

describe('R9 files', () => {
  const st = () => env.authenticatedContext('alice').storage();
  const jpg = { contentType: 'image/jpeg' };
  it('takes his photos, cut-outs and prints', async () => {
    await assertSucceeds(uploadBytes(ref(st(), 'users/alice/files/photos/abc-photo.jpg'), new Uint8Array(1000), jpg));
    await assertSucceeds(uploadBytes(ref(st(), 'users/alice/files/closet/abc-top.png'), new Uint8Array(1000), { contentType: 'image/png' }));
    await assertSucceeds(uploadBytes(ref(st(), 'users/alice/files/closet/abc-top.print'), new Uint8Array(100), { contentType: 'application/octet-stream' }));
    await assertSucceeds(deleteObject(ref(st(), 'users/alice/files/photos/abc-photo.jpg')));
  });
  it('refuses the wrong place, size or type', async () => {
    await assertFails(uploadBytes(ref(st(), 'users/alice/files/upload/abc.jpg'), new Uint8Array(10), jpg));
    await assertFails(uploadBytes(ref(st(), 'users/alice/files/photos/deep/abc.jpg'), new Uint8Array(10), jpg));
    await assertFails(uploadBytes(ref(st(), 'users/alice/abc.jpg'), new Uint8Array(10), jpg));
    await assertFails(uploadBytes(ref(st(), 'users/alice/files/photos/big.jpg'), new Uint8Array(3 * 1024 * 1024 + 1), jpg));
    await assertFails(uploadBytes(ref(st(), 'users/alice/files/photos/a.gif'), new Uint8Array(10), { contentType: 'image/gif' }));
    await assertFails(uploadBytes(ref(st(), 'users/alice/files/closet/a.print'), new Uint8Array(64 * 1024 + 1), { contentType: 'application/octet-stream' }));
  });
});

describe('R10 devices', () => {
  it('own only, listed fields only', async () => {
    const good = { platform: 'ios', appVersion: '1.1.0', createdAt: Timestamp.now(), lastSyncAt: serverTimestamp() };
    await assertSucceeds(setDoc(doc(alice(), 'users/alice/devices/D-1'), good));
    await assertFails(setDoc(doc(bob(), 'users/alice/devices/D-2'), good));
    await assertFails(setDoc(doc(alice(), 'users/alice/devices/D-3'), { ...good, model: 'iPhone 17 Pro' }));
    await assertFails(setDoc(doc(alice(), 'users/alice/devices/D-4'), { ...good, lastSyncAt: Timestamp.fromMillis(0) }));
  });
});

describe("D2 the server's own records (handoff/13-server.md §7)", () => {
  it('no client can read or write usage, spend or the config, its own uid included', async () => {
    await env.withSecurityRulesDisabled(async (c) => {
      await setDoc(doc(c.firestore(), 'usage/alice/usageDays/2026-10-20'), { checks: 1 });
      await setDoc(doc(c.firestore(), 'spend/2026-10-20'), { cents: 1 });
      await setDoc(doc(c.firestore(), 'server/config'), { tier: 'pro' });
    });
    for (const path of ['usage/alice', 'usage/alice/usageDays/2026-10-20', 'spend/2026-10-20', 'server/config']) {
      await assertFails(getDoc(doc(alice(), path)));
      await assertFails(setDoc(doc(alice(), path), { checks: 0, tier: 'pro', cents: 0 }));
    }
    await assertFails(getDocs(collection(alice(), 'usage/alice/usageDays')));
  });
});

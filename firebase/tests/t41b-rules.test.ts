// T41b · security-rule checks SB4.2 and SB5.1a (specs/sign-in-and-backup.md; tasks/T41b/TESTING.md), on the Firebase emulators:
// another account can't read, list, write or delete his photos (a guest follows the same rules), and no client can write or read
// a chat collection. Photos are three bytes; no real person's photo.
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { deleteObject, getBytes, listAll, ref, updateMetadata, uploadBytes } from 'firebase/storage';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

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

const JPEG = { contentType: 'image/jpeg' };
const PHOTO = 'users/A/files/photos/x.jpg';
const storageOf = (ctx: ReturnType<RulesTestEnvironment['authenticatedContext']>) => ctx.storage();
const userA = () => env.authenticatedContext('A');
const userB = () => env.authenticatedContext('B');
const signedOut = () => env.unauthenticatedContext();
const guest = (uid: string) => env.authenticatedContext(uid, { firebase: { sign_in_provider: 'anonymous' } });

async function seedPhoto(path = PHOTO) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await uploadBytes(ref(ctx.storage(), path), new Uint8Array([1, 2, 3]), JPEG);
  });
}

describe("SB4.2 · another account can't read, list, write or delete his photos", () => {
  it("SB4.2 · user B's get, list, create, update, metadata update and delete all fail, and A's photo is still there", async () => {
    await seedPhoto();
    const b = storageOf(userB());
    await assertFails(getBytes(ref(b, PHOTO)));
    await assertFails(listAll(ref(b, 'users/A/files/photos')));
    await assertFails(uploadBytes(ref(b, 'users/A/files/photos/y.jpg'), new Uint8Array([9]), JPEG));
    await assertFails(uploadBytes(ref(b, PHOTO), new Uint8Array([9, 9]), JPEG));
    await assertFails(updateMetadata(ref(b, PHOTO), { customMetadata: { a: 'b' } }));
    await assertFails(deleteObject(ref(b, PHOTO)));
    const bytes = await assertSucceeds(getBytes(ref(storageOf(userA()), PHOTO)));
    expect([...new Uint8Array(bytes)]).toEqual([1, 2, 3]);
  });

  it("SB4.2 · a signed-out client's get, list, create, update and delete all fail", async () => {
    await seedPhoto();
    const s = storageOf(signedOut());
    await assertFails(getBytes(ref(s, PHOTO)));
    await assertFails(listAll(ref(s, 'users/A/files/photos')));
    await assertFails(uploadBytes(ref(s, 'users/A/files/photos/y.jpg'), new Uint8Array([9]), JPEG));
    await assertFails(uploadBytes(ref(s, PHOTO), new Uint8Array([9, 9]), JPEG));
    await assertFails(deleteObject(ref(s, PHOTO)));
    await assertSucceeds(getBytes(ref(storageOf(userA()), PHOTO)));
  });

  it("SB4.2 · A can read, add and delete his own photos", async () => {
    const a = storageOf(userA());
    await assertSucceeds(uploadBytes(ref(a, PHOTO), new Uint8Array([1, 2, 3]), JPEG));
    await assertSucceeds(getBytes(ref(a, PHOTO)));
    await assertSucceeds(deleteObject(ref(a, PHOTO)));
    await expect(getBytes(ref(a, PHOTO))).rejects.toMatchObject({ code: 'storage/object-not-found' });
  });

  it("SB4.2 · a guest's own folder follows the same rules: his own works, nobody else's does", async () => {
    const g = storageOf(guest('G1'));
    const own = 'users/G1/files/photos/g.jpg';
    await assertSucceeds(uploadBytes(ref(g, own), new Uint8Array([4, 5]), JPEG));
    await assertSucceeds(getBytes(ref(g, own)));
    await assertFails(getBytes(ref(storageOf(userA()), own)));
    await assertFails(getBytes(ref(storageOf(guest('G2')), own)));
    await assertFails(deleteObject(ref(storageOf(userB()), own)));
    // He can't reach a signed-in account's photos either.
    await seedPhoto();
    await assertFails(getBytes(ref(g, PHOTO)));
    await assertFails(uploadBytes(ref(g, 'users/A/files/photos/z.jpg'), new Uint8Array([1]), JPEG));
    await assertFails(deleteObject(ref(g, PHOTO)));
    await assertSucceeds(deleteObject(ref(g, own)));
  });
});

describe('SB5.1a · the rules refuse a chat collection', () => {
  const envelope = (id: string) => ({ id, v: 1, updatedAt: Date.now(), serverAt: serverTimestamp(), deleted: false, by: 'device-a', data: { id, text: 'CHAT-TEXT' } });

  it('SB5.1a · the owner can write a fit check with this envelope but not a chatMessages doc, and cannot read one that was seeded', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    await assertSucceeds(setDoc(doc(alice, 'users/alice/fitChecks/FC-1'), envelope('FC-1')));
    await assertFails(setDoc(doc(alice, 'users/alice/chatMessages/M-1'), envelope('M-1')));
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users/alice/chatMessages/M-2'), { id: 'M-2', text: 'seeded' });
    });
    await assertFails(getDoc(doc(alice, 'users/alice/chatMessages/M-2')));
    await assertFails(getDoc(doc(alice, 'users/alice/chatMessages/M-1')));
    const sanity = await assertSucceeds(getDoc(doc(alice, 'users/alice/fitChecks/FC-1')));
    expect(sanity.exists()).toBe(true);
  });
});

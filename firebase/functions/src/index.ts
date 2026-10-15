// Kitted's server jobs (handoff/11-firestore-schema.md §5; checks F1–F3).
// No job ever opens a photo: files are deleted by prefix, never read (faces are never processed on our servers).
// Logs hold the uid and counts only, never content.
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import * as functionsV1 from 'firebase-functions/v1';
import { logger } from 'firebase-functions/v2';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

initializeApp();

const REGION = 'us-central1';
const DAY_MS = 86_400_000;
/** Tombstones older than this are removed; a phone offline longer re-pulls everything (§5). */
export const TOMBSTONE_DAYS = 180;
/** Accounts idle this long are deleted (§5, stated in the privacy policy). */
export const INACTIVE_DAYS = 548; // 18 months
/** Keep in step with app/src/sync/schema.ts (SYNCED_COLLECTIONS) and firestore.rules. */
export const SYNCED_COLLECTIONS = [
  'profile', 'prefs', 'fitChecks', 'readings', 'closetItems', 'closetObservations',
  'outfits', 'wearLog', 'corrections', 'chatMessages', 'dailyIdeas', 'facts',
] as const;

/** Everything one person has with us: every doc under users/{uid}, every file under users/{uid}/, then the account.
 *  Safe to run twice (each step tolerates "already gone"). */
export async function deleteEverything(uid: string): Promise<{ files: number }> {
  const db = getFirestore();
  const userRef = db.doc(`users/${uid}`);
  const snap = await userRef.get();
  if (snap.exists) await userRef.set({ deleteRequestedAt: FieldValue.serverTimestamp() }, { merge: true });
  await db.recursiveDelete(userRef);
  const bucket = getStorage().bucket();
  const [files] = await bucket.getFiles({ prefix: `users/${uid}/` });
  await bucket.deleteFiles({ prefix: `users/${uid}/`, force: true });
  try {
    await getAuth().deleteUser(uid);
  } catch (e: unknown) {
    if ((e as { code?: string }).code !== 'auth/user-not-found') throw e;
  }
  return { files: files.length };
}

/** "Delete account and all data". The phone revokes the Sign in with Apple token first (Apple requires it), then calls
 *  this, then wipes itself. */
export const deleteAccount = onCall({ region: REGION, enforceAppCheck: true }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in first.');
  const { files } = await deleteEverything(uid);
  logger.info('deleteAccount', { uid, files });
  return { ok: true };
});

/** An Auth user deleted another way (the console): clean up the same way, so nothing is orphaned. */
export const cleanUpDeletedUser = functionsV1.region(REGION).auth.user().onDelete(async (user) => {
  const { files } = await deleteEverything(user.uid);
  logger.info('cleanUpDeletedUser', { uid: user.uid, files });
});

/** Tombstones older than 180 days. */
export const purgeTombstones = onSchedule({ region: REGION, schedule: 'every day 04:00', timeZone: 'America/New_York' }, async () => {
  const db = getFirestore();
  const cutoff = Timestamp.fromMillis(Date.now() - TOMBSTONE_DAYS * DAY_MS);
  let removed = 0;
  for (const coll of SYNCED_COLLECTIONS) {
    for (;;) {
      const page = await db.collectionGroup(coll).where('deleted', '==', true).where('serverAt', '<', cutoff).limit(400).get();
      if (page.empty) break;
      const batch = db.batch();
      for (const d of page.docs) batch.delete(d.ref);
      await batch.commit();
      removed += page.size;
      if (page.size < 400) break;
    }
  }
  logger.info('purgeTombstones', { removed });
});

/** Accounts with no activity in 18 months. */
export const purgeInactive = onSchedule({ region: REGION, schedule: 'every day 04:30', timeZone: 'America/New_York' }, async () => {
  const db = getFirestore();
  const cutoff = Timestamp.fromMillis(Date.now() - INACTIVE_DAYS * DAY_MS);
  const idle = await db.collection('users').where('lastActiveAt', '<', cutoff).limit(200).get();
  for (const d of idle.docs) await deleteEverything(d.id);
  logger.info('purgeInactive', { deleted: idle.size });
});

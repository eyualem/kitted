// Kitted's server jobs (handoff/11-firestore-schema.md §5; checks F1–F3).
// No job ever opens a photo: files are deleted by prefix, never read (faces are never processed on our servers).
// Logs hold the uid and counts only, never content.
import { initializeApp } from 'firebase-admin/app';
import { getAppCheck } from 'firebase-admin/app-check';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import * as functionsV1 from 'firebase-functions/v1';
import { logger } from 'firebase-functions/v2';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { createApi, type ApiDeps } from './api/handler';
import { firestoreStore } from './api/store';

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
  await db.recursiveDelete(db.doc(`usage/${uid}`)); // the server's daily counts (handoff/13-server.md §5)
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

/** Deletes tombstones whose serverAt is before the cutoff, in every synced collection. Returns how many. */
export async function purgeTombstonesBefore(cutoffMs: number): Promise<number> {
  const db = getFirestore();
  const cutoff = Timestamp.fromMillis(cutoffMs);
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
  return removed;
}

/** Deletes every account whose lastActiveAt is before the cutoff. Returns how many. */
export async function purgeInactiveBefore(cutoffMs: number): Promise<number> {
  const db = getFirestore();
  const idle = await db.collection('users').where('lastActiveAt', '<', Timestamp.fromMillis(cutoffMs)).limit(200).get();
  for (const d of idle.docs) await deleteEverything(d.id);
  return idle.size;
}

/** Tombstones older than 180 days. */
export const purgeTombstones = onSchedule({ region: REGION, schedule: 'every day 04:00', timeZone: 'America/New_York' }, async () => {
  const removed = await purgeTombstonesBefore(Date.now() - TOMBSTONE_DAYS * DAY_MS);
  logger.info('purgeTombstones', { removed });
});

/** Accounts with no activity in 18 months. */
export const purgeInactive = onSchedule({ region: REGION, schedule: 'every day 04:30', timeZone: 'America/New_York' }, async () => {
  const deleted = await purgeInactiveBefore(Date.now() - INACTIVE_DAYS * DAY_MS);
  logger.info('purgeInactive', { deleted });
});

/** The server's daily counts older than this go (handoff/13-server.md §5); the day's spend after 90 days. */
export const USAGE_DAYS = 7;
export const SPEND_DAYS = 90;

/** Deletes usage days and spend days written before their cutoffs. Returns how many. */
export async function purgeUsageBefore(nowMs: number): Promise<{ usage: number; spend: number }> {
  const db = getFirestore();
  const out = { usage: 0, spend: 0 };
  const sweep = async (q: FirebaseFirestore.Query, key: 'usage' | 'spend') => {
    for (;;) {
      const page = await q.limit(400).get();
      if (page.empty) return;
      const batch = db.batch();
      for (const d of page.docs) batch.delete(d.ref);
      await batch.commit();
      out[key] += page.size;
      if (page.size < 400) return;
    }
  };
  await sweep(db.collectionGroup('usageDays').where('at', '<', nowMs - USAGE_DAYS * DAY_MS), 'usage');
  await sweep(db.collection('spend').where('at', '<', nowMs - SPEND_DAYS * DAY_MS), 'spend');
  return out;
}

export const purgeUsage = onSchedule({ region: REGION, schedule: 'every day 05:00', timeZone: 'America/New_York' }, async () => {
  const removed = await purgeUsageBefore(Date.now());
  logger.info('purgeUsage', removed);
});

// The AI proxy (handoff/13-server.md). The key lives only in Secret Manager (`firebase functions:secrets:set GEMINI_KEY`).
// GEMINI_BASE (functions/.env.local, emulator only) points it at a fake. Plain values, not params: a param prompts on
// every emulator run and deploy.
const GEMINI_KEY = defineSecret('GEMINI_KEY');
const GEMINI_BASE = process.env.GEMINI_BASE ?? 'https://generativelanguage.googleapis.com';
/** Questions on GPT-5.6 Luna (13 §11): the founder's own billed key, `firebase functions:secrets:set OPENAI_KEY`. */
const OPENAI_KEY = defineSecret('OPENAI_KEY');
const OPENAI_BASE = process.env.OPENAI_BASE ?? 'https://api.openai.com';
/** 1 keeps one instance warm (no 1–2 s wake-up on the first call) and costs money every month: the founder's call. */
const API_MIN_INSTANCES = 0;

/** The real dependencies; the tests pass their own fakes for Gemini and App Check. */
export function apiDeps(over: Partial<ApiDeps> = {}): ApiDeps {
  return {
    store: over.store ?? firestoreStore(getFirestore()),
    verifyIdToken: async (token) => ({ uid: (await getAuth().verifyIdToken(token)).uid }),
    verifyAppCheck: async (token) => {
      await getAppCheck().verifyToken(token);
    },
    geminiKey: () => GEMINI_KEY.value(),
    openaiKey: () => OPENAI_KEY.value(),
    geminiBase: over.geminiBase ?? GEMINI_BASE,
    openaiBase: over.openaiBase ?? OPENAI_BASE,
    fetch: globalThis.fetch,
    now: () => Date.now(),
    log: (entry) => logger.info('api', entry),
    ...over,
  };
}

/** The Admin SDK's Firestore (the tests build a store on it with their own clock). */
export const adminFirestore = () => getFirestore();

let handle: ReturnType<typeof createApi> | null = null;

export const api = onRequest(
  { region: REGION, secrets: [GEMINI_KEY, OPENAI_KEY], timeoutSeconds: 60, memory: '512MiB', concurrency: 80, minInstances: API_MIN_INSTANCES, invoker: 'public' },
  async (req, res) => {
    handle ??= createApi(apiDeps());
    try {
      await handle(req, res);
    } catch (e) {
      logger.error('api', { error: (e as Error).name });
      if (!res.headersSent) res.status(500).json({ error: 'server' });
      else res.end();
    }
  },
);

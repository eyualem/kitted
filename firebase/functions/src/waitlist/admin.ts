// The founder's waitlist jobs (handoff/15-landing-page.md §6, checks F6, F11, F13): export a batch for TestFlight,
// delete one email on request, and purge the rate limit's day-old counters. Run through firebase/scripts/waitlist.mjs.
import type { Firestore } from 'firebase-admin/firestore';
import { emailId } from './handler';

export interface WaitlistRow {
  id: string;
  email: string;
  platform: string;
  src: string;
  createdAt: number;
}

/** The oldest un-invited, still-subscribed iPhone signups, up to `size`, marked as `batch` in the same step. */
export async function exportBatch(db: Firestore, o: { batch: number; size: number; now: number }): Promise<WaitlistRow[]> {
  const snap = await db.collection('waitlist').where('platform', '==', 'ios').get();
  const picked = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<WaitlistRow, 'id'> & { batch: number | null; unsubscribed: boolean }) }))
    .filter((r) => r.batch === null && r.unsubscribed === false)
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, o.size);
  for (let i = 0; i < picked.length; i += 400) {
    const w = db.batch();
    for (const r of picked.slice(i, i + 400)) w.update(db.doc(`waitlist/${r.id}`), { batch: o.batch, invitedAt: o.now });
    await w.commit();
  }
  return picked.map(({ id, email, platform, src, createdAt }) => ({ id, email, platform, src, createdAt }));
}

/** App Store Connect's tester import: First Name, Last Name, Email. Names are left blank (we never ask for them). */
export function toTestFlightCsv(rows: Pick<WaitlistRow, 'email'>[]): string {
  return `First Name,Last Name,Email\n${rows.map((r) => `,,${r.email}`).join('\n')}\n`;
}

/** Deletes one person's signup. True when there was one. */
export async function deleteEmail(db: Firestore, email: string): Promise<boolean> {
  const ref = db.doc(`waitlist/${emailId(email)}`);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  return true;
}

/** Deletes rate-limit counters written before the cutoff. Returns how many. */
export async function purgeRateBefore(db: Firestore, cutoffMs: number): Promise<number> {
  let removed = 0;
  for (;;) {
    const page = await db.collection('waitlist_rate').where('at', '<', cutoffMs).limit(400).get();
    if (page.empty) return removed;
    const w = db.batch();
    for (const d of page.docs) w.delete(d.ref);
    await w.commit();
    removed += page.size;
    if (page.size < 400) return removed;
  }
}

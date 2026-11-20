// The server's own records in Firestore (handoff/13-server.md §5): per-account days, the day's spend, the config.
// Admin SDK only; the rules let no client near any of it (check D2).
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { effectiveTz, emptyDay, finish, reserve, usageDay, type Day, type Reserve, type Tier, type Took } from './limits';
import type { Kind, RouteName } from './routes';

export interface Config {
  tier: Tier;
  spendCapCents: number;
  enforceAppCheck: boolean;
  timeoutMs: number;
  /** Accounts that get the founder's limits. Set in Firestore only (server/config), never in git. */
  founderUids: string[];
  /** Refuse a photo or ask call with no X-Kitted-Device header. Off while old builds are out; on once App Check is (T23). */
  requireDevice: boolean;
}

/** During the beta every account gets the beta's day (FP7, the founder, Nov 8): no or unknown tier is `beta`. */
export const DEFAULT_CONFIG: Config = { tier: 'beta', spendCapCents: 300, enforceAppCheck: false, timeoutMs: 30_000, founderUids: [], requireDevice: false };

export interface Ticket {
  uid: string;
  day: string;
  took: Took;
  /** The phone's record, when the call came with a device ID: the sha256 of the ID (never the ID) and its own day. */
  device?: { hash: string; day: string };
}

export interface Store {
  config(): Promise<Config>;
  spentCents(utcDay: string): Promise<number>;
  addSpend(utcDay: string, cents: number): Promise<void>;
  /** `device` is the sha256 hex of the X-Kitted-Device ID: the phone's own day must say yes too, and only then are both written. */
  reserve(a: { uid: string; device?: string; route: RouteName; checkId?: string; kind?: Kind; tap?: boolean; tz: number; tier: Tier; nowMs: number }): Promise<{ result: Reserve; day: string; phoneDay?: string }>;
  finish(t: Ticket, finished: boolean): Promise<void>;
}

const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

export function firestoreStore(db: Firestore, opts: { configTtlMs?: number; now?: () => number } = {}): Store {
  const ttl = opts.configTtlMs ?? 30_000;
  const now = opts.now ?? Date.now;
  let cached: { at: number; config: Config } | null = null;
  const userDoc = (uid: string) => db.doc(`usage/${uid}`);
  const dayDoc = (uid: string, day: string) => db.doc(`usage/${uid}/usageDays/${day}`);
  const phoneDoc = (hash: string) => db.doc(`devices/${hash}`);
  const phoneDayDoc = (hash: string, day: string) => db.doc(`devices/${hash}/usageDays/${day}`);
  const readDay = (snap: FirebaseFirestore.DocumentSnapshot): Day => (snap.exists ? { ...emptyDay(), ...(snap.data() as Partial<Day>) } : emptyDay());

  return {
    async config() {
      // A clock that went backwards (a test's, or a host's correction) is not a fresh cache.
      const age = cached ? now() - cached.at : -1;
      if (cached && age >= 0 && age < ttl) return cached.config;
      const d = (await db.doc('server/config').get()).data() ?? {};
      const config: Config = {
        tier: d.tier === 'free' || d.tier === 'pro' || d.tier === 'beta' ? d.tier : DEFAULT_CONFIG.tier,
        spendCapCents: num(d.spendCapCents, DEFAULT_CONFIG.spendCapCents),
        enforceAppCheck: typeof d.enforceAppCheck === 'boolean' ? d.enforceAppCheck : DEFAULT_CONFIG.enforceAppCheck,
        timeoutMs: num(d.timeoutMs, DEFAULT_CONFIG.timeoutMs),
        founderUids: Array.isArray(d.founderUids) ? d.founderUids.filter((x): x is string => typeof x === 'string') : DEFAULT_CONFIG.founderUids,
        requireDevice: d.requireDevice === true,
      };
      cached = { at: now(), config };
      return config;
    },
    async spentCents(utcDay) {
      return num((await db.doc(`spend/${utcDay}`).get()).data()?.cents, 0);
    },
    async addSpend(utcDay, cents) {
      await db.doc(`spend/${utcDay}`).set({ cents: FieldValue.increment(cents), calls: FieldValue.increment(1), at: now() }, { merge: true });
    },
    async reserve(a) {
      return db.runTransaction(async (tx) => {
        // All reads first (a transaction can't read after it writes).
        const u = await tx.get(userDoc(a.uid));
        const stored = u.exists ? { tz: num(u.data()!.tz, 0), changedAt: num(u.data()!.tzChangedAt, 0) } : undefined;
        const tz = effectiveTz(stored, a.tz, a.nowMs);
        const day = usageDay(a.nowMs, tz.tz);
        const d = readDay(await tx.get(dayDoc(a.uid, day)));
        // The phone has its own time zone record, so a new guest can't move the phone's day by asking for another.
        let phone: { tz: ReturnType<typeof effectiveTz>; day: string; d: Day } | undefined;
        if (a.device) {
          const p = await tx.get(phoneDoc(a.device));
          const pStored = p.exists ? { tz: num(p.data()!.tz, 0), changedAt: num(p.data()!.tzChangedAt, 0) } : undefined;
          const pTz = effectiveTz(pStored, a.tz, a.nowMs);
          const pDay = usageDay(a.nowMs, pTz.tz);
          phone = { tz: pTz, day: pDay, d: readDay(await tx.get(phoneDayDoc(a.device, pDay))) };
        }
        const opts = { checkId: a.checkId, kind: a.kind, tap: a.tap };
        const result = reserve(d, a.tier, a.route, opts);
        // The phone's day must say yes too; if either says no, nothing is counted on either (the account's tz note stays).
        const phoneResult = phone && result.ok ? reserve(phone.d, a.tier, a.route, opts) : undefined;
        if (tz.changed) tx.set(userDoc(a.uid), { tz: tz.tz, tzChangedAt: tz.changedAt });
        if (phoneResult && !phoneResult.ok) return { result: phoneResult, day, phoneDay: phone!.day };
        if (result.ok) {
          tx.set(dayDoc(a.uid, day), { ...d, at: a.nowMs });
          if (phone && a.device) {
            if (phone.tz.changed) tx.set(phoneDoc(a.device), { tz: phone.tz.tz, tzChangedAt: phone.tz.changedAt });
            tx.set(phoneDayDoc(a.device, phone.day), { ...phone.d, at: a.nowMs });
          }
        }
        return { result, day, phoneDay: phone?.day };
      });
    },
    async finish(t, finished) {
      await db.runTransaction(async (tx) => {
        const ref = dayDoc(t.uid, t.day);
        const snap = await tx.get(ref);
        const pRef = t.device ? phoneDayDoc(t.device.hash, t.device.day) : undefined;
        const pSnap = pRef ? await tx.get(pRef) : undefined;
        if (snap.exists) {
          const d = readDay(snap);
          finish(d, t.took, finished);
          tx.set(ref, { ...d, at: now() });
        }
        if (pRef && pSnap?.exists) {
          const d = readDay(pSnap);
          finish(d, t.took, finished);
          tx.set(pRef, { ...d, at: now() });
        }
      });
    },
  };
}

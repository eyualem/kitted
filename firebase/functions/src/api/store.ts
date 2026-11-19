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
}

/** During the beta every account gets the beta's day (FP7, the founder, Nov 8): no or unknown tier is `beta`. */
export const DEFAULT_CONFIG: Config = { tier: 'beta', spendCapCents: 300, enforceAppCheck: false, timeoutMs: 30_000, founderUids: [] };

export interface Ticket {
  uid: string;
  day: string;
  took: Took;
}

export interface Store {
  config(): Promise<Config>;
  spentCents(utcDay: string): Promise<number>;
  addSpend(utcDay: string, cents: number): Promise<void>;
  reserve(a: { uid: string; route: RouteName; checkId?: string; kind?: Kind; tap?: boolean; tz: number; tier: Tier; nowMs: number }): Promise<{ result: Reserve; day: string }>;
  finish(t: Ticket, finished: boolean): Promise<void>;
}

const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

export function firestoreStore(db: Firestore, opts: { configTtlMs?: number; now?: () => number } = {}): Store {
  const ttl = opts.configTtlMs ?? 30_000;
  const now = opts.now ?? Date.now;
  let cached: { at: number; config: Config } | null = null;
  const userDoc = (uid: string) => db.doc(`usage/${uid}`);
  const dayDoc = (uid: string, day: string) => db.doc(`usage/${uid}/usageDays/${day}`);

  return {
    async config() {
      if (cached && now() - cached.at < ttl) return cached.config;
      const d = (await db.doc('server/config').get()).data() ?? {};
      const config: Config = {
        tier: d.tier === 'free' || d.tier === 'pro' || d.tier === 'beta' ? d.tier : DEFAULT_CONFIG.tier,
        spendCapCents: num(d.spendCapCents, DEFAULT_CONFIG.spendCapCents),
        enforceAppCheck: typeof d.enforceAppCheck === 'boolean' ? d.enforceAppCheck : DEFAULT_CONFIG.enforceAppCheck,
        timeoutMs: num(d.timeoutMs, DEFAULT_CONFIG.timeoutMs),
        founderUids: Array.isArray(d.founderUids) ? d.founderUids.filter((x): x is string => typeof x === 'string') : DEFAULT_CONFIG.founderUids,
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
        const u = await tx.get(userDoc(a.uid));
        const stored = u.exists ? { tz: num(u.data()!.tz, 0), changedAt: num(u.data()!.tzChangedAt, 0) } : undefined;
        const tz = effectiveTz(stored, a.tz, a.nowMs);
        const day = usageDay(a.nowMs, tz.tz);
        const snap = await tx.get(dayDoc(a.uid, day));
        const d: Day = snap.exists ? { ...emptyDay(), ...(snap.data() as Partial<Day>) } : emptyDay();
        const result = reserve(d, a.tier, a.route, { checkId: a.checkId, kind: a.kind, tap: a.tap });
        if (tz.changed) tx.set(userDoc(a.uid), { tz: tz.tz, tzChangedAt: tz.changedAt });
        if (result.ok) tx.set(dayDoc(a.uid, day), { ...d, at: a.nowMs });
        return { result, day };
      });
    },
    async finish(t, finished) {
      await db.runTransaction(async (tx) => {
        const ref = dayDoc(t.uid, t.day);
        const snap = await tx.get(ref);
        if (!snap.exists) return;
        const d: Day = { ...emptyDay(), ...(snap.data() as Partial<Day>) };
        finish(d, t.took, finished);
        tx.set(ref, { ...d, at: now() });
      });
    },
  };
}

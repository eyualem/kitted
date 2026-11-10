// T53 · the daily nudge (NT2), You → Notifications' rules (NT3), the comeback (NT4) and safety (NT5), through the nudge
// service on the memory store, a manual clock (US Eastern) and the test writer's own doubles for iOS and the scheduler
// (src/testing/notifyDoubles.ts). The contract: tasks/T53/TESTING.md. No network, no AI, no expo-notifications.
//
// NT2.6 follows the approved spec (specs/notifications.md, the founder's yes on Nov 10): the "big enough" line comes only
// after at least one "Check today's fit." nudge was delivered (its time has passed); someone who could already suggest
// when he said yes never gets it. TESTING.md's older example (big enough on day one when it can suggest at once) was
// written before that change; the tests follow the spec.
import seed from '../../assets/seed.json';
import { localParts, US_EASTERN } from '@kitted/core';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import type { KittedStore } from '@/data/store';
import type { ChatMessage, ClosetItemRow, FitCheckRow } from '@/data/types';
import { createMorningService } from '@/features/morning/service';
import { createNudgeService, type NudgeDeps } from '@/features/morning/nudgeService';
import { createReadyWatch } from '@/features/morning/readyWatch';
import {
  backOnLine, landsToday, NOTIFY_KV, NUDGE_DAYS, NUDGE_LEAD_MIN, nudgeBody, nudgeHHMM, nudgeLabel, nudgeLines, nudgeTimes, switchesShown,
} from '@/features/morning/nudges';
import type { PrivacyFiles } from '@/features/privacy/files';
import { deleteAllData } from '@/features/privacy/wipe';
import { en, t, type StringKey } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { notificationContent, notificationTrigger, recordingScheduler, scriptedNotifications, type LocalNotification } from '@/services/notifications';
import type { WeatherSource } from '@/services/weather';
import {
  backgroundDouble, BIG_LINE, CHECK_LINE, IDEA_LINE, iosDouble, localDate, schedulerDouble, type IosDouble, type SchedulerDouble,
} from '@/testing/notifyDoubles';

const at = (iso: string) => Date.parse(iso);
const T0 = at('2026-10-22T11:42:00Z'); // Thursday 7:42 am EDT
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const zoned = (days: string[], hhmmZ: string) => days.map((d) => at(`2026-${d}T${hhmmZ}:00Z`));
const OCT22_28 = ['10-22', '10-23', '10-24', '10-25', '10-26', '10-27', '10-28'];
const OCT23_29 = ['10-23', '10-24', '10-25', '10-26', '10-27', '10-28', '10-29'];
/** 7:45 am EDT, Oct 22–28. */
const W1 = zoned(OCT22_28, '11:45');
/** 7:45 am EDT, Oct 23–29. */
const W2 = zoned(OCT23_29, '11:45');
/** 7:45 am local from Oct 30: EDT until Nov 1 (DST ends), then EST. */
const DST_745 = [...zoned(['10-30', '10-31'], '11:45'), ...zoned(['11-01', '11-02', '11-03', '11-04', '11-05'], '12:45')];
/** 6:45 am local from Oct 30. */
const DST_645 = [...zoned(['10-30', '10-31'], '10:45'), ...zoned(['11-01', '11-02', '11-03', '11-04', '11-05'], '11:45')];
const LAPSE = at('2026-10-29T13:00:00Z'); // Thursday 9:00 am EDT, a week after T0

const NOTIFY_KEYS = ['notify.idea', 'notify.ready', 'notify.asked', 'notify.through', 'notify.paused', 'notify.comebackFor', 'notify.bigEnoughAt', 'notify.bigEnoughDone'];

const profile = (ideaTime: string | null) => ({
  id: 'me' as const, birthYear: 2003, heightCm: null, build: '', fitPreference: '', styles: [['minimalist', 0.5]] as never, boldness: 'a_little', budget: null,
  lastOccasion: 'everyday' as const, consentVersion: null, consentAt: null, onboardingDone: true, ideaTime, units: 'imperial' as const, createdAt: T0 - DAY,
});

async function profileStore(ideaTime: string | null = '08:00'): Promise<KittedStore> {
  const store = createMemoryStore();
  await store.init();
  await store.profile.put(profile(ideaTime));
  return store;
}

/** The seed's `full` store (its profile and closet) with only `keep` left in the closet. */
async function seededStore(keep: readonly string[] | null): Promise<KittedStore> {
  const store = createMemoryStore();
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: at('2026-10-20T07:00:00-04:00') });
  if (keep) for (const c of await store.closet.all()) if (!keep.includes(c.id)) await store.closet.put({ ...c, isDeleted: true } as ClosetItemRow);
  await store.profile.patch('me', { ideaTime: '08:00' });
  return store;
}

const noWeather: WeatherSource = {
  kind: 'sample', permission: async () => 'granted', requestPermission: async () => 'granted', forecast: async () => null,
};

interface RigOpts {
  store?: KittedStore;
  now?: number;
  ios?: IosDouble;
  sched?: SchedulerDouble;
  /** notify.idea; null leaves it unset. Default '1'. */
  idea?: '1' | '0' | null;
  ideaTime?: string | null;
  /** The real morning service's canSuggest over the store, instead of the flag. */
  realMorning?: boolean;
}

/** One nudge service over a store; `make()` builds a fresh instance on the same deps (a restart). */
async function rig(o: RigOpts = {}) {
  const store = o.store ?? (await profileStore(o.ideaTime === undefined ? '08:00' : o.ideaTime));
  const clock = manualClock(o.now ?? T0);
  const ios = o.ios ?? iosDouble('allow', 'granted');
  const sched = o.sched ?? schedulerDouble();
  const idea = o.idea === undefined ? '1' : o.idea;
  if (idea !== null) await store.setKv('notify.idea', idea);
  const flags = { suggest: false, age: false, built: true };
  const suggestAsked: number[] = [];
  const todayCards: string[] = [];
  const morning = createMorningService({ store, clock, weather: noWeather, ids: counterIds() });
  const deps: NudgeDeps = {
    store, clock, ids: counterIds(), built: () => flags.built, permissions: ios, scheduler: sched,
    canSuggest: async (ms) => {
      suggestAsked.push(ms);
      return o.realMorning ? morning.canSuggest(ms) : flags.suggest;
    },
    ageBlocked: async () => flags.age,
    // Resolves a macrotask later, once today's card is in the thread (posted once per local day).
    afterTodaysCard: async () => {
      await new Promise((r) => setTimeout(r, 0));
      const id = `TODAY-${localDate(clock.nowMs(), US_EASTERN)}`;
      if (!(await store.chat.get(id))) {
        await store.chat.put({
          id, createdAt: clock.nowMs(), role: 'stylist', kind: 'card', text: null, cardType: 'morning', fitCheckId: null, outfitId: null, itemId: null, chips: [], payload: {},
        });
        todayCards.push(id);
      }
    },
  };
  const make = () => createNudgeService(deps);
  const svc = make();
  const kv = (k: string) => store.getKv(k);
  const bodies = (list: readonly LocalNotification[] | undefined) => (list ?? []).map((n) => n.body);
  const lastList = () => {
    const l = sched.lists();
    return l[l.length - 1];
  };
  return { store, clock, ios, sched, svc, make, deps, flags, kv, suggestAsked, todayCards, bodies, lastList };
}

const comebacks = async (store: KittedStore) =>
  (await store.chat.all()).filter((m) => m.payload.question === 'comeback').sort((a, b) => a.createdAt - b.createdAt);
const replacesSince = (sched: SchedulerDouble, from: number) => sched.calls.slice(from).filter((c) => c.op === 'replaceNudges');
const wall = (ms: number) => {
  const p = localParts(ms, US_EASTERN);
  return `${String(p.hh).padStart(2, '0')}:${String(p.mm).padStart(2, '0')}`;
};
const isLast = async (store: KittedStore, m: ChatMessage) => {
  const others = (await store.chat.all()).filter((x) => x.id !== m.id);
  return others.every((x) => x.createdAt < m.createdAt);
};

// ── NT2.1 · seven a day ahead ─────────────────────────────────────────────────────────────────────────────────────
describe('NT2.1 · seven nudges, one a day, 15 minutes before', () => {
  it('NT2.1 · open at 7:42 with 8:00: 7 nudges, Oct 22–28 at 7:45', async () => {
    expect([NUDGE_DAYS, NUDGE_LEAD_MIN]).toEqual([7, 15]);
    expect(nudgeHHMM('08:00')).toBe('07:45');
    expect(nudgeHHMM('05:00')).toBe('04:45');
    expect(nudgeHHMM('13:00')).toBe('12:45');
    expect(nudgeHHMM('07:30')).toBe('07:15');
    expect(nudgeHHMM('12:00')).toBe('11:45');
    expect(nudgeLabel('08:00')).toBe('7:45 am');
    expect(nudgeLabel('13:00')).toBe('12:45 pm');
    expect(nudgeLabel('05:00')).toBe('4:45 am');
    expect(nudgeTimes(T0, '08:00', US_EASTERN)).toEqual(W1);

    const r = await rig();
    expect(await r.svc.reschedule('open')).toEqual({ kind: 'scheduled', atMs: W1, lines: Array(7).fill('check') });
    const pending = await r.sched.pending();
    expect(pending.map((n) => n.id)).toEqual(OCT22_28.map((d) => `nudge|2026-${d}`));
    expect(pending.map((n) => n.atMs)).toEqual(W1);
    expect(pending.map((n) => n.data)).toEqual(Array(7).fill({ kind: 'nudge' }));
    expect(r.bodies(pending)).toEqual(Array(7).fill(CHECK_LINE));
    expect(await r.kv('notify.through')).toBe(String(W1[6]));
    // Must not: at the get-dressed time itself, or in the past.
    expect(pending.map((n) => wall(n.atMs!))).toEqual(Array(7).fill('07:45'));
    expect(pending.every((n) => n.atMs! > T0)).toBe(true);
    expect(r.sched.presented()).toEqual([]);
  });

  it('NT2.1 · after the nudge time, the first is tomorrow', async () => {
    expect(nudgeTimes(T0 + 8 * MIN, '08:00', US_EASTERN)).toEqual(W2);
    // Strictly after now: at 7:45:00 exactly, today's has gone.
    expect(nudgeTimes(W1[0]!, '08:00', US_EASTERN)).toEqual(W2);
    expect(nudgeTimes(W1[0]! - 1, '08:00', US_EASTERN)).toEqual(W1);
    const r = await rig({ now: T0 + 8 * MIN });
    expect(await r.svc.reschedule('open')).toEqual({ kind: 'scheduled', atMs: W2, lines: Array(7).fill('check') });
    expect((await r.sched.pending()).map((n) => n.id)).toEqual(OCT23_29.map((d) => `nudge|2026-${d}`));
    expect(await r.kv('notify.through')).toBe(String(W2[6]));
  });

  it('NT2.1 · across the DST change the wall time stays 7:45', async () => {
    const opened = at('2026-10-29T11:50:00Z'); // 7:50 am EDT
    expect(nudgeTimes(opened, '08:00', US_EASTERN)).toEqual(DST_745);
    const r = await rig({ now: opened });
    expect(await r.svc.reschedule('open')).toMatchObject({ kind: 'scheduled', atMs: DST_745 });
    const pending = await r.sched.pending();
    expect(pending.map((n) => n.id)).toEqual(['10-30', '10-31', '11-01', '11-02', '11-03', '11-04', '11-05'].map((d) => `nudge|2026-${d}`));
    expect(pending.map((n) => wall(n.atMs!))).toEqual(Array(7).fill('07:45'));
  });

  it('NT2.1 · the 4 am day change: a 5:00 time opened at 3:30 gets that morning\'s 4:45', async () => {
    const early = at('2026-10-22T07:30:00Z'); // 3:30 am EDT
    expect(nudgeTimes(early, '05:00', US_EASTERN)[0]).toBe(at('2026-10-22T08:45:00Z'));
    expect(landsToday(early, '05:00', US_EASTERN)).toBe(true);
    const r = await rig({ now: early, ideaTime: '05:00' });
    const res = await r.svc.reschedule('open');
    expect(res).toMatchObject({ kind: 'scheduled' });
    expect((await r.sched.pending())[0]).toMatchObject({ id: 'nudge|2026-10-22', atMs: at('2026-10-22T08:45:00Z') });
  });

  it('NT2.1 · every open and return replaces, never adds', async () => {
    const r = await rig();
    const seen: string[][] = [];
    const steps: [number, 'open' | 'foreground' | 'background'][] = [[0, 'open'], [HOUR, 'foreground'], [2 * HOUR, 'foreground'], [3 * HOUR, 'background']];
    for (const [dt, trigger] of steps) {
      r.clock.set(T0 + dt);
      expect(await r.svc.reschedule(trigger)).toMatchObject({ kind: 'scheduled' });
      const pending = await r.sched.pending();
      const dates = pending.map((n) => localDate(n.atMs!, US_EASTERN));
      expect(pending).toHaveLength(7);
      expect(new Set(dates).size).toBe(7);
      seen.push(dates);
    }
    // 7:42 → today's first; 8:42 and later → tomorrow's.
    expect(seen).toEqual([OCT22_28.map((d) => `2026-${d}`), ...Array(3).fill(OCT23_29.map((d) => `2026-${d}`))]);
    expect(r.sched.lists().every((l) => l.length <= 7)).toBe(true);
    expect(r.sched.presented()).toEqual([]);
  });

  it('NT2.1 · default sound, no title', async () => {
    const nudge: LocalNotification = { id: 'nudge|2026-10-22', body: CHECK_LINE, atMs: W1[0]!, data: { kind: 'nudge' } };
    const content = notificationContent(nudge);
    expect(content).toEqual({ body: CHECK_LINE, sound: 'default', data: { kind: 'nudge' } });
    expect(Object.keys(content).sort()).toEqual(['body', 'data', 'sound']);
    expect(notificationTrigger(nudge)).toEqual({ type: 'date', date: W1[0] });
    const ready: LocalNotification = { id: 'ready|c1', body: 'Your fit check is ready.', atMs: null, data: { kind: 'ready', checkId: 'c1' } };
    expect(notificationContent(ready)).toEqual({ body: 'Your fit check is ready.', sound: 'default', data: { kind: 'ready', checkId: 'c1' } });
    expect('title' in notificationContent(ready)).toBe(false);
    expect(notificationTrigger(ready)).toBeNull();
    // What the service hands the scheduler carries no title either.
    const r = await rig();
    await r.svc.reschedule('open');
    for (const n of await r.sched.pending()) expect(Object.keys(n).sort()).toEqual(['atMs', 'body', 'data', 'id']);
  });
});

// ── NT2.2 / NT2.3 · what each day says ───────────────────────────────────────────────────────────────────────────
describe('NT2.2–NT2.3 · the line', () => {
  it('NT2.2 · can suggest, big-enough done: every day "Today\'s outfit idea is ready."', async () => {
    const store = await seededStore(null);
    const r = await rig({ store });
    r.flags.suggest = true;
    await store.setKv('notify.bigEnoughDone', '1');
    expect(await r.svc.reschedule('open')).toEqual({ kind: 'scheduled', atMs: W1, lines: Array(7).fill('idea') });
    const bodies = r.bodies(await r.sched.pending());
    expect(bodies).toEqual(Array(7).fill(IDEA_LINE));
    expect(nudgeBody('idea')).toBe(IDEA_LINE);
    // Never a list of pieces, a score or "Today:".
    const names = (await store.closet.all()).map((c) => c.name);
    expect(names.length).toBeGreaterThan(5);
    for (const b of bodies) {
      for (const name of names) expect(b.includes(name)).toBe(false);
      expect(b).not.toMatch(/\d+\.\d/);
      expect(b).not.toMatch(/Today:/);
    }
    expect(Object.keys(en)).not.toContain('push.idea');
    // The days asked about are the nudge times themselves.
    expect(r.suggestAsked).toEqual(W1);
  });

  it('NT2.3 · empty closet: 7 × "Check today\'s fit."', async () => {
    const store = await seededStore([]);
    const r = await rig({ store, realMorning: true });
    expect(await r.svc.reschedule('open')).toEqual({ kind: 'scheduled', atMs: W1, lines: Array(7).fill('check') });
    expect(r.bodies(await r.sched.pending())).toEqual(Array(7).fill(CHECK_LINE));
    expect(nudgeBody('check')).toBe(CHECK_LINE);
    expect(await r.kv('notify.bigEnoughAt')).toBeNull();
  });

  it('NT2.3 · one outfit (T1, B1, S1): 7 × "Check today\'s fit."', async () => {
    const store = await seededStore(['T1', 'B1', 'S1']);
    const r = await rig({ store, realMorning: true });
    const res = await r.svc.reschedule('open');
    expect(res).toEqual({ kind: 'scheduled', atMs: W1, lines: Array(7).fill('check') });
    const bodies = r.bodies(await r.sched.pending());
    expect(bodies).toEqual(Array(7).fill(CHECK_LINE));
    expect(bodies.some((b) => b === IDEA_LINE || b === BIG_LINE)).toBe(false);
    expect(await r.kv('notify.bigEnoughAt')).toBeNull();
  });
});

// ── NT2.6 · "big enough", once ever, after a delivered check nudge ──────────────────────────────────────────────
describe('NT2.6 · the big-enough day', () => {
  it('NT2.6 · first day it can suggest: big enough, then the idea line', async () => {
    // Pure: the first day it can suggest after check days in the same list; never once it was delivered.
    expect(nudgeLines([false, false, false, true, true, true, true], false)).toEqual(['check', 'check', 'check', 'bigEnough', 'idea', 'idea', 'idea']);
    expect(nudgeLines([false, false, false, true, true, true, true], true)).toEqual(['check', 'check', 'check', 'idea', 'idea', 'idea', 'idea']);
    expect(nudgeLines(Array(7).fill(false), false)).toEqual(Array(7).fill('check'));
    expect(nudgeBody('bigEnough')).toBe(BIG_LINE);

    // Service: empty at 7:42; the 7:45 check nudge is delivered; at 7:50 the closet makes two outfits.
    const r = await rig();
    expect(await r.svc.reschedule('open')).toMatchObject({ lines: Array(7).fill('check') });
    r.clock.set(T0 + 8 * MIN);
    r.flags.suggest = true;
    expect(await r.svc.reschedule('open')).toEqual({ kind: 'scheduled', atMs: W2, lines: ['bigEnough', 'idea', 'idea', 'idea', 'idea', 'idea', 'idea'] });
    expect(r.bodies(await r.sched.pending())).toEqual([BIG_LINE, ...Array(6).fill(IDEA_LINE)]);
    expect(await r.kv('notify.bigEnoughAt')).toBe(String(W2[0]));
    expect(await r.kv('notify.bigEnoughDone')).toBeNull();
  });

  it('NT2.6 · not delivered yet: a reschedule keeps it on the first day', async () => {
    const r = await rig();
    await r.svc.reschedule('open');
    r.clock.set(T0 + 8 * MIN);
    r.flags.suggest = true;
    await r.svc.reschedule('open');
    // Oct 23, 7:44: the big-enough nudge (7:45) hasn't fired: still on Oct 23, once.
    r.clock.set(W2[0]! - MIN);
    expect(await r.svc.reschedule('open')).toMatchObject({ atMs: W2, lines: ['bigEnough', 'idea', 'idea', 'idea', 'idea', 'idea', 'idea'] });
    expect(r.bodies(r.lastList()).filter((b) => b === BIG_LINE)).toHaveLength(1);
    // A time change before it fires moves it, still on the first day.
    await r.svc.setTime('09:00');
    expect(r.bodies(r.lastList())).toEqual([BIG_LINE, ...Array(6).fill(IDEA_LINE)]);
    expect(r.lastList()![0]!.atMs).toBe(at('2026-10-23T12:45:00Z'));
    // Switched off before it fires: not delivered, so it comes back on the next first day.
    await r.svc.setIdea(false);
    expect(await r.kv('notify.bigEnoughAt')).toBeNull();
    expect(await r.svc.setIdea(true)).toBe('granted');
    expect(r.bodies(r.lastList())).toEqual([BIG_LINE, ...Array(6).fill(IDEA_LINE)]);
  });

  it('NT2.6 · once delivered, never again (time change, off and on)', async () => {
    const r = await rig();
    await r.svc.reschedule('open');
    r.clock.set(T0 + 8 * MIN);
    r.flags.suggest = true;
    await r.svc.reschedule('open');
    // Oct 23, 7:50: delivered.
    r.clock.set(W2[0]! + 5 * MIN);
    expect(await r.svc.reschedule('open')).toMatchObject({ lines: Array(7).fill('idea') });
    expect(await r.kv('notify.bigEnoughDone')).toBe('1');
    const from = r.sched.calls.length;
    await r.svc.setTime('07:00');
    await r.svc.setIdea(false);
    await r.svc.setIdea(true);
    r.clock.advance(DAY);
    await r.svc.reschedule('open');
    await r.make().reschedule('foreground');
    const lists = replacesSince(r.sched, from).map((c) => (c.op === 'replaceNudges' ? c.list : []));
    expect(lists.length).toBeGreaterThanOrEqual(4);
    for (const l of lists) expect(r.bodies(l)).toEqual(Array(7).fill(IDEA_LINE));
  });

  it('NT2.6 · able to suggest when he said yes: never the big-enough line', async () => {
    const r = await rig();
    r.flags.suggest = true;
    expect(await r.svc.reschedule('open')).toEqual({ kind: 'scheduled', atMs: W1, lines: Array(7).fill('idea') });
    expect(await r.kv('notify.bigEnoughAt')).toBeNull();
    r.clock.set(T0 + 8 * MIN);
    await r.svc.reschedule('open');
    await r.svc.setTime('07:00');
    await r.svc.setIdea(false);
    await r.svc.setIdea(true);
    r.clock.advance(2 * DAY);
    await r.svc.reschedule('open');
    for (const l of r.sched.lists()) expect(r.bodies(l)).toEqual(Array(7).fill(IDEA_LINE));
  });

  it('NT2.6 · a check nudge scheduled but not yet delivered does not count', async () => {
    // 7:42: empty, 7 check nudges from 7:45 today. 7:44: two outfits, before any check nudge fired.
    const r = await rig();
    await r.svc.reschedule('open');
    r.clock.set(T0 + 2 * MIN);
    r.flags.suggest = true;
    expect(await r.svc.reschedule('change')).toEqual({ kind: 'scheduled', atMs: W1, lines: Array(7).fill('idea') });
    expect(r.bodies(r.lastList())).toEqual(Array(7).fill(IDEA_LINE));
  });
});

// ── NT2.7 · leaving reschedules ──────────────────────────────────────────────────────────────────────────────────
describe('NT2.7 · leaving the app', () => {
  it('NT2.7 · a closet that grows today changes tomorrow\'s line on leaving', async () => {
    const store = await seededStore([]);
    const r = await rig({ store, realMorning: true, ios: iosDouble('allow', 'granted') });
    expect(await r.svc.reschedule('open')).toMatchObject({ lines: Array(7).fill('check') });
    // Two tops, one pair of trousers, one pair of shoes (F6.2's example): two outfits that work.
    for (const id of ['T1', 'T2', 'B1', 'S1']) await store.closet.patch(id, { isDeleted: false });
    r.clock.set(T0 + 8 * MIN);
    const chatBefore = (await store.chat.all()).length;
    const from = r.sched.calls.length;
    expect(await r.svc.reschedule('background')).toEqual({ kind: 'scheduled', atMs: W2, lines: ['bigEnough', 'idea', 'idea', 'idea', 'idea', 'idea', 'idea'] });
    const added = replacesSince(r.sched, from);
    expect(added).toHaveLength(1);
    expect(r.bodies(r.lastList())).toEqual([BIG_LINE, ...Array(6).fill(IDEA_LINE)]);
    // Must not: post anything or ask iOS.
    expect((await store.chat.all()).length).toBe(chatBefore);
    expect(r.ios.requests).toBe(0);
  });

  it('NT2.7 · a background reschedule during a lapse schedules nothing and posts nothing', async () => {
    const r = await rig();
    await r.svc.reschedule('open');
    r.clock.set(LAPSE);
    const from = r.sched.calls.length;
    expect(await r.svc.reschedule('background')).toEqual({ kind: 'paused' });
    expect(replacesSince(r.sched, from)).toEqual([]);
    expect(await comebacks(r.store)).toEqual([]);
    // It waits for the next open, which asks.
    expect(await r.svc.reschedule('open')).toMatchObject({ kind: 'comeback' });
    expect(await comebacks(r.store)).toHaveLength(1);
  });
});

// ── NT2.5 · nothing else, ever ───────────────────────────────────────────────────────────────────────────────────
describe('NT2.5 · only the nudges and Fit check ready', () => {
  it('NT2.5 · every scheduler call over a scripted fortnight', async () => {
    const r = await rig();
    const bg = backgroundDouble();
    const ready = createReadyWatch({ store: r.store, built: () => true, permissions: r.ios, scheduler: r.sched, background: bg, ageBlocked: async () => false });
    const go = async (ms: number) => r.clock.set(ms);
    // Day 0 (Thu Oct 22).
    await r.svc.reschedule('open');
    await go(T0 + HOUR);
    await r.svc.reschedule('foreground');
    await go(T0 + 2 * HOUR);
    await r.svc.reschedule('background');
    await go(T0 + 3 * HOUR);
    await r.svc.reschedule('foreground');
    // Day 1: a new time.
    await go(T0 + DAY + HOUR);
    await r.svc.reschedule('open');
    await r.svc.setTime('07:00');
    // Day 2: off and on.
    await go(T0 + 2 * DAY + HOUR);
    await r.svc.setIdea(false);
    await r.svc.setIdea(true);
    // Day 3: the closet grows (two outfits).
    await go(T0 + 3 * DAY + HOUR);
    r.flags.suggest = true;
    await r.svc.reschedule('change');
    await r.svc.reschedule('foreground');
    // Day 4: a check scored after he left.
    await go(T0 + 4 * DAY + HOUR);
    await r.store.fitChecks.put(fitCheck('c1', r.clock.nowMs(), { status: 'scoring', score: null }));
    await ready.appState('background');
    await r.svc.reschedule('background');
    await r.store.fitChecks.patch('c1', { status: 'scored', score: 7.5, fixes: [fix('Roll the sleeves'), fix('Tuck the tee')] });
    await ready.checksChanged();
    await ready.appState('active');
    await r.svc.reschedule('foreground');
    // A week away (through the DST change), then the comeback and its yes.
    await go(at('2026-11-03T14:00:00Z')); // Tue Nov 3, 9:00 am EST
    const cb = await r.svc.reschedule('open');
    expect(cb).toMatchObject({ kind: 'comeback' });
    await r.svc.comebackOn((cb as { messageId: string }).messageId);
    // Days 13–14.
    await go(at('2026-11-04T14:00:00Z'));
    await r.svc.reschedule('open');
    await r.svc.reschedule('background');
    await go(at('2026-11-05T13:30:00Z'));
    await r.svc.reschedule('foreground');

    const lists = r.sched.lists();
    const presented = r.sched.presented();
    expect(lists.length).toBeGreaterThanOrEqual(10);
    expect(presented).toHaveLength(1);
    const nudgeBodies = [CHECK_LINE, BIG_LINE, IDEA_LINE];
    for (const list of lists) {
      expect(list.length).toBeGreaterThan(0);
      expect(list.length).toBeLessThanOrEqual(7);
      const dates = list.map((n) => localDate(n.atMs!, US_EASTERN));
      expect(new Set(dates).size).toBe(list.length);
      for (const n of list) {
        expect(n.data).toEqual({ kind: 'nudge' });
        expect(n.id).toBe(`nudge|${localDate(n.atMs!, US_EASTERN)}`);
        expect(nudgeBodies).toContain(n.body);
        expect(n.body).not.toMatch(/trial/i);
      }
    }
    expect(presented[0]).toEqual({ id: 'ready|c1', body: 'Your fit check is ready. 2 quick fixes inside.', atMs: null, data: { kind: 'ready', checkId: 'c1' } });
    expect(presented.every((n) => n.data.kind === 'ready')).toBe(true);
    expect(Object.keys(en).filter((k) => ['push.trial', 'notifs.trial', 'push.idea'].includes(k))).toEqual([]);
  });

  it('NT2.5 · the demo scheduler records every call; pending is the last list', async () => {
    const s = recordingScheduler();
    const n = (d: string): LocalNotification => ({ id: `nudge|${d}`, body: CHECK_LINE, atMs: at(`${d}T11:45:00Z`), data: { kind: 'nudge' } });
    await s.replaceNudges([n('2026-10-22'), n('2026-10-23')]);
    expect(await s.pending()).toEqual([n('2026-10-22'), n('2026-10-23')]);
    await s.replaceNudges([n('2026-10-24')]);
    expect(await s.pending()).toEqual([n('2026-10-24')]);
    const ready: LocalNotification = { id: 'ready|c1', body: 'Your fit check is ready.', atMs: null, data: { kind: 'ready', checkId: 'c1' } };
    await s.presentNow(ready);
    expect(await s.pending()).toEqual([n('2026-10-24')]);
    await s.cancelAll();
    expect(await s.pending()).toEqual([]);
    expect(s.calls).toEqual([
      { op: 'replaceNudges', list: [n('2026-10-22'), n('2026-10-23')] },
      { op: 'replaceNudges', list: [n('2026-10-24')] },
      { op: 'presentNow', n: ready },
      { op: 'cancelAll' },
    ]);
  });
});

// ── NT3 · the switches and the time ──────────────────────────────────────────────────────────────────────────────
describe('NT3 · You → Notifications, through the service', () => {
  it('NT3.2 · setTime and setIdea(false)', async () => {
    const r = await rig();
    await r.svc.reschedule('open');
    await r.svc.setTime('07:00');
    expect((await r.store.profile.get('me'))!.ideaTime).toBe('07:00');
    const last = r.sched.last();
    expect(last).toEqual({ op: 'replaceNudges', list: expect.any(Array) });
    const atMs = (last as { list: LocalNotification[] }).list.map((n) => n.atMs);
    // 6:45 has passed at 7:42: Oct 23–29.
    expect(atMs).toEqual(zoned(OCT23_29, '10:45'));
    expect(await r.kv('notify.through')).toBe(String(zoned(OCT23_29, '10:45')[6]));

    expect(await r.svc.setIdea(false)).toBe('granted');
    expect(await r.kv('notify.idea')).toBe('0');
    expect(r.sched.last()).toEqual({ op: 'cancelAll' });
    expect(await r.sched.pending()).toEqual([]);
    expect(await r.kv('notify.through')).toBeNull();
    expect(await r.svc.reschedule('open')).toEqual({ kind: 'cancelled', why: 'off' });
    expect(await r.sched.pending()).toEqual([]);
    // His time is kept while off.
    expect((await r.store.profile.get('me'))!.ideaTime).toBe('07:00');
    await r.svc.setIdea(true);
    expect((await r.sched.pending()).map((n) => n.atMs)).toEqual(zoned(OCT23_29, '10:45'));
  });

  it('NT3.3 · the daily switch from never asked: one prompt; Don\'t Allow keeps his yes and schedules nothing', async () => {
    const ios = iosDouble('deny', 'undetermined');
    const r = await rig({ ios, idea: null });
    expect(await r.svc.setIdea(true)).toBe('denied');
    expect(ios.prompts).toBe(1);
    expect(await r.kv('notify.idea')).toBe('1');
    expect(r.sched.lists().filter((l) => l.length > 0)).toEqual([]);
    expect(await r.svc.reschedule('open')).toEqual({ kind: 'cancelled', why: 'permission' });
    // No second prompt.
    await r.svc.setIdea(true);
    expect(ios.prompts).toBe(1);
    // iOS Settings turned them on: the next return schedules at once.
    ios.set('granted');
    expect(await r.svc.reschedule('foreground')).toMatchObject({ kind: 'scheduled', atMs: W1 });
  });

  it('NT3.3 · Fit check ready on from never asked: the prompt too; the daily switch unchanged', async () => {
    const ios = iosDouble('allow', 'undetermined');
    const r = await rig({ ios, idea: null });
    expect(await r.svc.setReady(true)).toBe('granted');
    expect(ios.prompts).toBe(1);
    expect(await r.kv('notify.ready')).toBe('1');
    expect(await r.kv('notify.idea')).toBeNull();
    expect(r.sched.lists().filter((l) => l.length > 0)).toEqual([]);
    expect(await r.svc.setReady(false)).toBe('granted');
    expect(await r.kv('notify.ready')).toBe('0');
    expect(ios.prompts).toBe(1);
  });

  it('NT3.4 · denied: cancel, nothing scheduled', async () => {
    expect(switchesShown({ ideaKv: '1', readyKv: null, permission: 'denied', paused: false })).toEqual({ idea: true, timeRow: true, ready: true, offCard: true, greyed: true });
    expect(switchesShown({ ideaKv: '0', readyKv: '0', permission: 'denied', paused: false })).toEqual({ idea: false, timeRow: false, ready: false, offCard: true, greyed: true });
    expect(switchesShown({ ideaKv: '1', readyKv: null, permission: 'granted', paused: false })).toEqual({ idea: true, timeRow: true, ready: true, offCard: false, greyed: false });
    expect(switchesShown({ ideaKv: '1', readyKv: null, permission: 'granted', paused: true })).toEqual({ idea: false, timeRow: false, ready: true, offCard: false, greyed: false });
    expect(switchesShown({ ideaKv: null, readyKv: null, permission: 'undetermined', paused: false })).toEqual({ idea: false, timeRow: false, ready: false, offCard: false, greyed: false });
    expect(switchesShown({ ideaKv: '1', readyKv: '1', permission: 'undetermined', paused: false })).toEqual({ idea: false, timeRow: false, ready: false, offCard: false, greyed: false });
    expect(switchesShown({ ideaKv: '0', readyKv: '0', permission: 'granted', paused: false })).toEqual({ idea: false, timeRow: false, ready: false, offCard: false, greyed: false });

    // Scheduled while allowed, then turned off in iOS: the next open cancels.
    const ios = iosDouble('allow', 'granted');
    const r = await rig({ ios });
    await r.svc.reschedule('open');
    ios.set('denied');
    r.clock.advance(HOUR);
    expect(await r.svc.reschedule('open')).toEqual({ kind: 'cancelled', why: 'permission' });
    expect(r.sched.last()).toEqual({ op: 'cancelAll' });
    expect(await r.sched.pending()).toEqual([]);
    expect(await r.kv('notify.through')).toBeNull();
    expect(await r.svc.reschedule('foreground')).toEqual({ kind: 'cancelled', why: 'permission' });
    expect(await r.sched.pending()).toEqual([]);
    expect(ios.requests).toBe(0);
    // Back on in iOS Settings: the return to the front schedules 7.
    ios.set('granted');
    expect(await r.svc.reschedule('foreground')).toMatchObject({ kind: 'scheduled' });
    expect(await r.sched.pending()).toHaveLength(7);
  });
});

// ── NT1.3 · iOS is asked only by a yes ───────────────────────────────────────────────────────────────────────────
describe('NT1.3 · the nudge service never asks on its own', () => {
  it('NT1.3 · opening, returning, leaving and posting never ask iOS', async () => {
    const ios = iosDouble('allow', 'undetermined');
    const r = await rig({ ios, idea: null });
    for (const trigger of ['open', 'foreground', 'background', 'change', 'open', 'foreground'] as const) {
      r.clock.advance(HOUR);
      expect(await r.svc.reschedule(trigger)).toEqual({ kind: 'cancelled', why: 'permission' });
    }
    expect(ios.requests).toBe(0);
    // A comeback posting (allowed, a lapse) asks nothing either.
    const g = iosDouble('allow', 'granted');
    const c = await rig({ ios: g });
    await c.svc.reschedule('open');
    c.clock.set(LAPSE);
    await c.svc.reschedule('open');
    await c.svc.reschedule('foreground');
    expect(g.requests).toBe(0);
    // The switch from undetermined: exactly one request.
    expect(await r.svc.setIdea(true)).toBe('granted');
    expect(ios.requests).toBe(1);
    expect(await r.sched.pending()).toHaveLength(7);
  });

  it('NT1.3 · the demo permission counts requests and pending never answers', async () => {
    const allow = scriptedNotifications('allow');
    expect(allow.requests).toBe(0);
    expect(await allow.request()).toBe('granted');
    expect(await allow.request()).toBe('granted');
    expect(allow.requests).toBe(2);
    const deny = scriptedNotifications('deny');
    expect(await deny.request()).toBe('denied');
    expect(await deny.permission()).toBe('denied');
    const pending = scriptedNotifications('pending');
    let settled = false;
    void pending.request().then(() => (settled = true));
    await new Promise((r) => setTimeout(r, 10));
    expect(settled).toBe(false);
    expect(pending.requests).toBe(1);
    expect(await scriptedNotifications('deny', 'granted').request()).toBe('granted');
  });
});

// ── NT4 · the comeback ───────────────────────────────────────────────────────────────────────────────────────────
describe('NT4.1 · a week away', () => {
  it('NT4.1 · a week away: one comeback question, nothing scheduled', async () => {
    const r = await rig();
    await r.svc.reschedule('open');
    expect(await r.kv('notify.through')).toBe(String(W1[6]));
    r.clock.set(LAPSE);
    const from = r.sched.calls.length;
    const res = await r.svc.reschedule('open');
    expect(res).toEqual({ kind: 'comeback', messageId: expect.any(String) });
    const cb = await comebacks(r.store);
    expect(cb).toHaveLength(1);
    expect(cb[0]!.id).toBe((res as { messageId: string }).messageId);
    expect({ role: cb[0]!.role, cardType: cb[0]!.cardType, payload: cb[0]!.payload }).toEqual({
      role: 'stylist', cardType: 'question', payload: { question: 'comeback', state: 'open', time: '08:00' },
    });
    // At the end of today's thread, after today's card.
    expect(r.todayCards).toContain('TODAY-2026-10-29');
    expect(await isLast(r.store, cb[0]!)).toBe(true);
    expect(await r.kv('notify.paused')).toBe('1');
    expect(await r.kv('notify.comebackFor')).toBe(String(W1[6]));
    expect(await r.svc.paused()).toBe(true);
    expect(replacesSince(r.sched, from)).toEqual([]);
    // Again the same day, a return, the next day, and a restart: paused, still one question, nothing scheduled.
    r.clock.set(LAPSE + HOUR);
    expect(await r.svc.reschedule('open')).toEqual({ kind: 'paused' });
    expect(await r.svc.reschedule('foreground')).toEqual({ kind: 'paused' });
    r.clock.set(LAPSE + DAY);
    expect(await r.svc.reschedule('open')).toEqual({ kind: 'paused' });
    expect(await r.make().reschedule('open')).toEqual({ kind: 'paused' });
    expect(await comebacks(r.store)).toHaveLength(1);
    expect(replacesSince(r.sched, from)).toEqual([]);
    expect(r.ios.requests).toBe(0);
  });

  it('NT4.1 · not while iOS has them off or the switch is off', async () => {
    const cases: [string, (r: Awaited<ReturnType<typeof rig>>) => Promise<void>, string][] = [
      ['denied', async (r) => r.ios.set('denied'), 'permission'],
      ['switch off', async (r) => r.store.setKv('notify.idea', '0'), 'off'],
      ['switch unset', async (r) => r.store.deleteKv('notify.idea'), 'off'],
      ['age lock', async (r) => void (r.flags.age = true), 'age'],
    ];
    for (const [name, change, why] of cases) {
      const r = await rig();
      await r.svc.reschedule('open');
      await change(r);
      r.clock.set(LAPSE);
      expect({ name, res: await r.svc.reschedule('open') }).toEqual({ name, res: { kind: 'cancelled', why } });
      expect({ name, comebacks: (await comebacks(r.store)).length }).toEqual({ name, comebacks: 0 });
      expect({ name, paused: await r.kv('notify.paused') }).toEqual({ name, paused: null });
    }
    // Not from a background trigger, and only once per lapse.
    const r = await rig();
    await r.svc.reschedule('open');
    r.clock.set(LAPSE);
    expect(await r.svc.reschedule('background')).toEqual({ kind: 'paused' });
    expect(await r.svc.reschedule('change')).toEqual({ kind: 'paused' });
    expect(await comebacks(r.store)).toHaveLength(0);
    await r.svc.reschedule('open');
    await r.svc.reschedule('open');
    expect(await comebacks(r.store)).toHaveLength(1);
  });

  it('NT4.1 · a later lapse after a normal stretch asks again', async () => {
    const r = await rig();
    await r.svc.reschedule('open');
    r.clock.set(LAPSE);
    const first = (await r.svc.reschedule('open')) as { messageId: string };
    await r.svc.comebackOn(first.messageId);
    expect(await r.kv('notify.through')).toBe(String(DST_745[6]));
    r.clock.set(at('2026-11-07T14:00:00Z'));
    expect(await r.svc.reschedule('open')).toMatchObject({ kind: 'comeback' });
    expect(await comebacks(r.store)).toHaveLength(2);
    expect(await r.kv('notify.comebackFor')).toBe(String(DST_745[6]));
  });
});

describe('NT4.2 · the three answers', () => {
  async function lapsed(now = LAPSE) {
    const r = await rig();
    await r.svc.reschedule('open');
    r.clock.set(now);
    const res = (await r.svc.reschedule('open')) as { kind: string; messageId: string };
    expect(res.kind).toBe('comeback');
    const card = async () => (await r.store.chat.get(res.messageId))!.payload;
    return { ...r, id: res.messageId, card, from: r.sched.calls.length };
  }

  it('NT4.2 · Turn them back on', async () => {
    const r = await lapsed();
    await r.svc.comebackOn(r.id);
    expect(r.sched.last()).toEqual({ op: 'replaceNudges', list: expect.any(Array) });
    expect(r.lastList()!.map((n) => n.atMs)).toEqual(DST_745);
    expect(await r.kv('notify.paused')).toBeNull();
    expect(await r.svc.paused()).toBe(false);
    expect(await r.card()).toEqual({ question: 'comeback', state: 'on', time: '08:00', when: 'tomorrow' });
    expect(backOnLine('tomorrow', '08:00')).toBe('Back on. Next one lands tomorrow at 7:45 am.');
    expect(r.ios.requests).toBe(0);
    // Answered: it never changes again.
    const n = r.sched.calls.length;
    await r.svc.comebackNo(r.id);
    await r.svc.comebackShowTime(r.id);
    expect(await r.card()).toEqual({ question: 'comeback', state: 'on', time: '08:00', when: 'tomorrow' });
    expect(await r.kv('notify.idea')).toBe('1');
    expect(r.sched.calls.slice(n).filter((c) => c.op === 'cancelAll')).toEqual([]);

    // At 7:00 the same day, today's 7:45 is still ahead.
    const e = await lapsed(at('2026-10-29T11:00:00Z'));
    await e.svc.comebackOn(e.id);
    expect(await e.card()).toEqual({ question: 'comeback', state: 'on', time: '08:00', when: 'today' });
    expect(e.lastList()![0]!.atMs).toBe(at('2026-10-29T11:45:00Z'));
    expect(backOnLine('today', '08:00')).toBe('Back on. Next one lands today at 7:45 am.');
  });

  it('NT4.2 · Change the time, then a pick', async () => {
    const r = await lapsed();
    await r.svc.comebackShowTime(r.id);
    expect(await r.card()).toEqual({ question: 'comeback', state: 'picking', time: '08:00' });
    expect(replacesSince(r.sched, r.from)).toEqual([]);
    expect(await r.svc.paused()).toBe(true);
    // A restart between the two keeps the picking card; the pick works on the new instance.
    await r.make().comebackPickTime(r.id, '07:00');
    expect((await r.store.profile.get('me'))!.ideaTime).toBe('07:00');
    expect(r.lastList()!.map((n) => n.atMs)).toEqual(DST_645);
    expect(await r.card()).toEqual({ question: 'comeback', state: 'on', time: '07:00', when: 'tomorrow' });
    expect(backOnLine('tomorrow', '07:00')).toBe('Back on. Next one lands tomorrow at 6:45 am.');
    expect(await r.kv('notify.paused')).toBeNull();
    expect(r.ios.requests).toBe(0);
  });

  it('NT4.2 · No thanks', async () => {
    const r = await lapsed();
    await r.svc.comebackNo(r.id);
    expect(await r.kv('notify.idea')).toBe('0');
    expect(r.sched.last()).toEqual({ op: 'cancelAll' });
    expect(await r.sched.pending()).toEqual([]);
    expect(await r.kv('notify.paused')).toBeNull();
    expect(await r.card()).toEqual({ question: 'comeback', state: 'declined', time: '08:00' });
    expect(t('comeback.done' as StringKey)).toBe('Done. You can turn them on in You → Notifications.');
    expect(await r.svc.reschedule('open')).toEqual({ kind: 'cancelled', why: 'off' });
    // Answered: a later tap changes nothing and schedules nothing.
    const n = r.sched.calls.length;
    await r.svc.comebackOn(r.id);
    await r.svc.comebackPickTime(r.id, '09:00');
    expect(await r.card()).toEqual({ question: 'comeback', state: 'declined', time: '08:00' });
    expect(replacesSince(r.sched, n)).toEqual([]);
    expect((await r.store.profile.get('me'))!.ideaTime).toBe('08:00');
    expect(r.ios.requests).toBe(0);
  });

  it('NT4.2 · ignored, then the switch in You → Notifications resumes', async () => {
    const r = await lapsed();
    r.clock.advance(2 * HOUR);
    expect(await r.svc.reschedule('foreground')).toEqual({ kind: 'paused' });
    expect(await r.card()).toEqual({ question: 'comeback', state: 'open', time: '08:00' });
    expect(replacesSince(r.sched, r.from)).toEqual([]);
    expect(await r.svc.setIdea(true)).toBe('granted');
    expect(r.lastList()!.map((n) => n.atMs)).toEqual(DST_745);
    expect(await r.card()).toEqual({ question: 'comeback', state: 'on', time: '08:00', when: 'tomorrow' });
    expect(await r.svc.paused()).toBe(false);
    // Switching off later leaves the answered card as it is.
    await r.svc.setIdea(false);
    expect(await r.card()).toEqual({ question: 'comeback', state: 'on', time: '08:00', when: 'tomorrow' });
  });
});

describe('NT4.3 · a normal open', () => {
  it('NT4.3 · an open on day 3 moves the week on, no question', async () => {
    const r = await rig();
    await r.svc.reschedule('open');
    r.clock.set(at('2026-10-24T13:00:00Z'));
    const later = zoned(['10-25', '10-26', '10-27', '10-28', '10-29', '10-30', '10-31'], '11:45');
    expect(await r.svc.reschedule('open')).toEqual({ kind: 'scheduled', atMs: later, lines: Array(7).fill('check') });
    expect(await r.kv('notify.through')).toBe(String(later[6]));
    expect(await comebacks(r.store)).toEqual([]);
    expect(await r.kv('notify.paused')).toBeNull();
  });

  it('NT4.3 · 7:44 on day 7 is a normal open; 7:46 is a lapse', async () => {
    const a = await rig();
    await a.svc.reschedule('open');
    a.clock.set(W1[6]! - MIN);
    expect(await a.svc.reschedule('open')).toMatchObject({ kind: 'scheduled', atMs: zoned(['10-28', '10-29'], '11:45').concat(DST_745.slice(0, 5)) });
    expect(await comebacks(a.store)).toEqual([]);
    const b = await rig();
    await b.svc.reschedule('open');
    b.clock.set(W1[6]! + MIN);
    expect(await b.svc.reschedule('open')).toMatchObject({ kind: 'comeback' });
  });
});

// ── NT5 · safety ─────────────────────────────────────────────────────────────────────────────────────────────────
describe('NT5 · the wipe and the age lock', () => {
  it('NT5.1 · the wipe cancels everything and clears every notification key', async () => {
    const r = await rig();
    await r.svc.reschedule('open');
    r.clock.set(LAPSE);
    await r.svc.reschedule('open'); // paused, comebackFor
    for (const [k, v] of [['notify.ready', '1'], ['notify.asked', 'M-1'], ['notify.bigEnoughAt', String(W2[0])], ['notify.bigEnoughDone', '1'],
      ['firstCheckOffer.laterAt', String(T0)], ['onboard.finish', JSON.stringify({ step: 'done', notifyMsgId: 'M-1' })]] as const) await r.store.setKv(k, v);
    const order = r.sched.order;
    const wipe = r.store.wipe.bind(r.store);
    r.store.wipe = async () => {
      order.push('wipe');
      await wipe();
    };
    const keychain = { ageBlocked: true, deviceId: 'D-1' as string | null };
    const files: PrivacyFiles = { usage: () => ({ photos: 0, bytes: 0 }), lastSent: () => null, deletePhotos: () => {}, deleteLogs: () => {} };
    order.length = 0;
    await deleteAllData({ store: r.store, files, clearDeviceId: async () => void (keychain.deviceId = null), cancelNotifications: () => r.svc.cancelAll() });
    expect(order).toEqual(['cancelAll', 'wipe']);
    expect(await r.sched.pending()).toEqual([]);
    for (const k of [...NOTIFY_KEYS, 'firstCheckOffer.laterAt', 'onboard.finish']) expect({ k, v: await r.kv(k) }).toEqual({ k, v: null });
    expect(await r.store.profile.get('me')).toBeNull();
    expect(keychain.ageBlocked).toBe(true);
    expect(Object.values(NOTIFY_KV).sort()).toEqual(NOTIFY_KEYS.filter((k) => k !== 'notify.idea' && k !== 'notify.ready').sort());
  });

  it('NT5.2 · age-blocked: cancel, nothing scheduled, no comeback', async () => {
    const ios = iosDouble('allow', 'granted');
    const r = await rig({ ios });
    r.flags.age = true;
    expect(await r.svc.reschedule('open')).toEqual({ kind: 'cancelled', why: 'age' });
    expect(r.sched.last()).toEqual({ op: 'cancelAll' });
    expect(await r.sched.pending()).toEqual([]);
    for (const trigger of ['foreground', 'background', 'change'] as const) expect(await r.svc.reschedule(trigger)).toEqual({ kind: 'cancelled', why: 'age' });
    r.clock.set(LAPSE);
    expect(await r.svc.reschedule('open')).toEqual({ kind: 'cancelled', why: 'age' });
    expect(await comebacks(r.store)).toEqual([]);
    expect(r.sched.lists().filter((l) => l.length > 0)).toEqual([]);
    expect(ios.requests).toBe(0);
  });

  it('NT2.1 · not built (no native module): nothing scheduled, no call, no throw', async () => {
    const r = await rig();
    r.flags.built = false;
    expect(await r.svc.reschedule('open')).toEqual({ kind: 'cancelled', why: 'unbuilt' });
    expect(r.sched.calls).toEqual([]);
    expect(r.ios.requests).toBe(0);
  });
});

// ── helpers for the background check ──────────────────────────────────────────────────────────────────────────────
function fix(copy: string): FitCheckRow['fixes'][number] {
  return { target: copy, tier: 'free', effort: 1, free: true, to: 7.5, toRaw: 7.5, gain: 0.5, rawGain: 0.5, edits: [], itemId: null, copy, tag: 'Free' } as unknown as FitCheckRow['fixes'][number];
}
function fitCheck(id: string, createdAt: number, o: Partial<FitCheckRow> = {}): FitCheckRow {
  return {
    id, createdAt, dayKey: '2026-10-26', photoFile: null, thumbFile: null, demoPhotoId: 'p01b', imageHash: id, occasion: 'everyday', style: null,
    status: 'scored', isPartial: false, notRated: [], score: 6.5, rawScore: 6.5, subscores: {}, occasionAdj: 0, rulesFired: [], credits: [], advice: [],
    fixes: [], explanation: null, rubricVersion: 'parts', isFavorite: false, snapState: 'none', recheckUsed: false,
    isFirstCheck: false, readingId: null, parentId: null, itemIds: [], details: {}, ...o,
  } as FitCheckRow;
}

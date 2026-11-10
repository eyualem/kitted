// T53 · Kit's ask (NT1) through the finish service on the memory store, with the nudge service's reschedule behind
// `rescheduleNudges`, a manual clock (US Eastern) and the test writer's doubles for iOS and the scheduler
// (src/testing/notifyDoubles.ts). The contract: tasks/T53/TESTING.md. No network, no AI, no expo-notifications.
import { US_EASTERN } from '@kitted/core';
import { createMemoryStore } from '@/data/memoryStore';
import type { KittedStore } from '@/data/store';
import type { ChatMessage, FitCheckRow } from '@/data/types';
import { NO_FINISH, type FinishState } from '@/features/finish/sequence';
import { createFinishService, FINISH_KEY, getFinish, type FinishDeps } from '@/features/finish/service';
import { createNudgeService } from '@/features/morning/nudgeService';
import { askDoneLine, landsToday } from '@/features/morning/nudges';
import type { PrivacyFiles } from '@/features/privacy/files';
import { deleteAllData } from '@/features/privacy/wipe';
import { IDEA_TIMES, ideaTimeLabel, ideaTimeOptions } from '@/features/settings/prefs';
import { t, type StringKey } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { unbuiltNotifications } from '@/services/notifications';
import { iosDouble, schedulerDouble, type IosDouble, type SchedulerDouble } from '@/testing/notifyDoubles';

const at = (iso: string) => Date.parse(iso);
const T0 = at('2026-10-22T11:42:00Z'); // Thursday 7:42 am EDT
const MIN = 60_000;
const DAY = 86_400_000;
const W1 = ['10-22', '10-23', '10-24', '10-25', '10-26', '10-27', '10-28'].map((d) => at(`2026-${d}T11:45:00Z`));
const LATER_LINE = 'No problem. You can turn it on later in You → Notifications.';
const ASK = "What time do you usually get dressed to head out? I'll send you an outfit idea 15 minutes before.";

function check(id: string, createdAt: number, o: Partial<FitCheckRow> = {}): FitCheckRow {
  return {
    id, createdAt, dayKey: '2026-10-22', photoFile: null, thumbFile: null, demoPhotoId: 'p01b', imageHash: id, occasion: 'everyday', style: null,
    status: 'scored', isPartial: false, notRated: [], score: 6.5, rawScore: 6.5, subscores: {}, occasionAdj: 0, rulesFired: [], credits: [], advice: [],
    fixes: [], explanation: null, rubricVersion: 'parts', isFavorite: false, snapState: 'none', recheckUsed: false,
    isFirstCheck: true, readingId: null, parentId: null, itemIds: [], details: {}, ...o,
  } as FitCheckRow;
}

/** onboardingFinish.test.ts's freshStore: his profile, 8:00 (or `ideaTime`). */
async function freshStore(ideaTime: string | null = '08:00'): Promise<KittedStore> {
  const store = createMemoryStore();
  await store.init();
  await store.profile.put({
    id: 'me', birthYear: 2003, heightCm: null, build: '', fitPreference: '', styles: [['minimalist', 0.5]] as never, boldness: 'a_little', budget: null,
    lastOccasion: 'everyday', consentVersion: null, consentAt: null, onboardingDone: true, ideaTime, units: 'imperial', createdAt: T0,
  });
  return store;
}

interface SetupOpts {
  store?: KittedStore;
  now?: number;
  ios?: IosDouble;
  /** Put his first scored check (no fixes: the closet card posts at once). Default true. */
  firstCheck?: boolean;
  deps?: Partial<FinishDeps>;
  age?: boolean;
}

/** The beta's finish service (paywall off, FP7) over a store, with the real nudge service's reschedule behind it. */
async function setup(o: SetupOpts = {}) {
  const store = o.store ?? (await freshStore());
  const clock = manualClock(o.now ?? T0);
  const ios = o.ios ?? iosDouble('allow');
  const sched: SchedulerDouble = schedulerDouble();
  if (o.firstCheck !== false) await store.fitChecks.put(check('a', clock.nowMs() - 60_000));
  const order: string[] = [];
  const flags = { age: o.age ?? false };
  const ids = counterIds();
  const nudges = createNudgeService({
    store, clock, ids, built: () => true, permissions: ios, scheduler: sched, canSuggest: async () => false, ageBlocked: async () => flags.age,
    afterTodaysCard: async () => {},
  });
  const deps: FinishDeps = {
    store, clock, ids, busy: () => false, paywallOn: () => false, isPro: () => false, notificationsOn: () => true, notifications: ios,
    stylistInFront: () => true, openPaywall: () => order.push('paywall'), later: () => {},
    ageBlocked: async () => flags.age,
    rescheduleNudges: async () => {
      await nudges.reschedule('change');
    },
    // Resolves a macrotask later, once today's card is in the thread.
    afterTodaysCard: async () => {
      order.push('todayCard:start');
      await new Promise((r) => setTimeout(r, 0));
      const id = 'TODAY-card';
      if (!(await store.chat.get(id))) {
        await store.chat.put({
          id, createdAt: clock.nowMs(), role: 'stylist', kind: 'card', text: null, cardType: 'morning', fitCheckId: null, outfitId: null, itemId: null, chips: [], payload: {},
        });
      }
      order.push('todayCard:done');
    },
    ...o.deps,
  };
  const make = () => createFinishService(deps);
  const s = make();
  return { store, clock, ios, sched, s, make, deps, order, flags, nudges };
}

const thread = async (store: KittedStore) => (await store.chat.all()).sort((a, b) => a.createdAt - b.createdAt);
const asks = async (store: KittedStore) => (await thread(store)).filter((m) => m.payload.question === 'notify');
const oneAsk = async (store: KittedStore): Promise<ChatMessage> => {
  const a = await asks(store);
  expect(a).toHaveLength(1);
  return a[0]!;
};
const withEntries = (sched: SchedulerDouble) => sched.lists().filter((l) => l.length > 0);
const finished = (o: Partial<FinishState> = {}) => JSON.stringify({ ...NO_FINISH, step: 'done', checkId: 'a', lastAt: T0 - 3 * DAY, ...o });

// ── NT1.1 · after the first scored fit ───────────────────────────────────────────────────────────────────────────
describe('NT1.1 · the setup ask', () => {
  it('NT1.1 · beta: the ask posts once, right under the closet card', async () => {
    const x = await setup();
    await x.s.ensure();
    const msgs = await thread(x.store);
    expect(t('plan.intro')).toBe('Want outfit ideas from your own clothes? This part is optional.');
    expect(msgs.map((m) => (m.kind === 'text' ? m.text : m.cardType))).toEqual([t('plan.intro'), 'plan', 'question']);
    const ask = msgs[2]!;
    expect(ask.role).toBe('stylist');
    expect(ask.payload).toEqual({ question: 'notify', state: 'open', time: '08:00' });
    expect(ask.createdAt).toBeGreaterThan(msgs[1]!.createdAt);
    expect(await x.store.getKv('notify.asked')).toBe(ask.id);
    const f = await getFinish(x.store);
    expect({ step: f.step, notifyMsgId: f.notifyMsgId }).toEqual({ step: 'done', notifyMsgId: ask.id });
    expect(await x.s.askPosted()).toBe(true);
    // Again, and after a restart: still one.
    await x.s.ensure();
    await x.make().ensure();
    expect((await asks(x.store)).map((m) => m.id)).toEqual([ask.id]);
    expect(x.ios.requests).toBe(0);
    expect(x.sched.calls).toEqual([]);
  });

  it('NT1.1 · an ask already posted (notify.asked) means no second one', async () => {
    const store = await freshStore();
    await store.setKv('notify.asked', 'M-later'); // T57's Later route wrote it
    const x = await setup({ store });
    expect(await x.s.askPosted()).toBe(true);
    await x.s.ensure();
    expect((await thread(store)).map((m) => (m.kind === 'text' ? m.text : m.cardType))).toEqual([t('plan.intro'), 'plan']);
    expect(await asks(store)).toEqual([]);
    expect((await getFinish(store)).step).toBe('done');
    expect(await store.getKv('notify.asked')).toBe('M-later');
    expect(x.ios.requests).toBe(0);
  });

  it('NT1.1 · not built, or the native module missing: no ask, no throw', async () => {
    for (const deps of [{ notificationsOn: () => false }, { notificationsOn: () => false, notifications: unbuiltNotifications }]) {
      const x = await setup({ deps });
      await expect(x.s.ensure()).resolves.toBeUndefined();
      expect(await asks(x.store)).toEqual([]);
      expect((await getFinish(x.store)).step).toBe('done');
      expect(await x.store.getKv('notify.asked')).toBeNull();
      expect(await x.s.askPosted()).toBe(false);
      expect(x.ios.requests).toBe(0);
    }
  });

  it('NT1.1 · never before the first check is scored, or while it is reading or asking', async () => {
    for (const status of ['scoring', 'asking'] as const) {
      const store = await freshStore();
      await store.fitChecks.put(check('a', T0 - MIN, { status, score: null }));
      const x = await setup({ store, firstCheck: false });
      await x.s.ensure();
      expect({ status, asks: (await asks(store)).length }).toEqual({ status, asks: 0 });
      expect(await store.getKv('notify.asked')).toBeNull();
    }
    const busy = await setup({ deps: { busy: () => true } });
    await busy.s.ensure();
    expect(await asks(busy.store)).toEqual([]);
    const none = await setup({ firstCheck: false });
    await none.s.ensure();
    expect(await asks(none.store)).toEqual([]);
    // The control: once the check is scored, the ask follows (and is marked asked).
    const store = await freshStore();
    await store.fitChecks.put(check('a', T0 - MIN, { status: 'scoring', score: null }));
    const later = await setup({ store, firstCheck: false });
    await later.s.ensure();
    expect(await asks(store)).toEqual([]);
    await store.fitChecks.patch('a', { status: 'scored', score: 6.5 });
    await later.s.ensure();
    expect(await store.getKv('notify.asked')).toBe((await oneAsk(store)).id);
  });

  it('NT1.1 · the setup ask no longer needs iOS to be undetermined (after a wipe iOS keeps its answer)', async () => {
    for (const start of ['granted', 'denied'] as const) {
      const x = await setup({ ios: iosDouble('allow', start) });
      await x.s.ensure();
      const ask = await oneAsk(x.store);
      expect(ask.payload).toEqual({ question: 'notify', state: 'open', time: '08:00' });
    }
    // He set the daily switch himself in You → Notifications first: no ask.
    const store = await freshStore();
    await store.setKv('notify.idea', '1');
    const x = await setup({ store });
    await x.s.ensure();
    expect(await asks(store)).toEqual([]);
    expect((await getFinish(store)).step).toBe('done');
  });
});

// ── NT1.2 · the time menu up front ───────────────────────────────────────────────────────────────────────────────
describe('NT1.2 · the time', () => {
  it('NT1.2 · 17 times, 5:00 am to 1:00 pm; an off-list stored time is kept', async () => {
    expect(IDEA_TIMES).toEqual(['05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00']);
    expect(IDEA_TIMES.map(ideaTimeLabel)).toEqual([
      '5:00 am', '5:30 am', '6:00 am', '6:30 am', '7:00 am', '7:30 am', '8:00 am', '8:30 am', '9:00 am', '9:30 am', '10:00 am', '10:30 am', '11:00 am',
      '11:30 am', '12:00 pm', '12:30 pm', '1:00 pm',
    ]);
    expect(ideaTimeOptions('08:00')).toEqual([...IDEA_TIMES]);
    const off = ideaTimeOptions('14:00');
    expect(off).toEqual([...IDEA_TIMES, '14:00']);
    expect(ideaTimeLabel(off[17]!)).toBe('2:00 pm');

    // The card's own time: his stored one, or 8:00.
    const store = await freshStore('07:30');
    const x = await setup({ store });
    await x.s.ensure();
    expect((await oneAsk(store)).payload.time).toBe('07:30');
    const unset = await setup({ store: await freshStore(null) });
    await unset.s.ensure();
    expect((await oneAsk(unset.store)).payload.time).toBe('08:00');
  });

  it('NT1.2 · picking a time changes the card only: nothing saved, scheduled or asked', async () => {
    const x = await setup();
    await x.s.ensure();
    const ask = await oneAsk(x.store);
    await x.s.notifyPickTime(ask.id, '07:30');
    expect((await x.store.chat.get(ask.id))!.payload).toEqual({ question: 'notify', state: 'open', time: '07:30' });
    expect((await x.store.profile.get('me'))!.ideaTime).toBe('08:00');
    expect(await x.store.getKv('notify.idea')).toBeNull();
    expect(x.sched.calls).toEqual([]);
    expect(x.ios.requests).toBe(0);
  });
});

// ── NT1.3 · only Send me ideas asks iOS ──────────────────────────────────────────────────────────────────────────
describe('NT1.3 · Apple\'s prompt', () => {
  it('NT1.3 · only Send me ideas asks iOS', async () => {
    const x = await setup();
    await x.s.ensure();
    const ask = await oneAsk(x.store);
    expect(x.ios.requests).toBe(0);
    await x.s.notifyPickTime(ask.id, '07:30');
    expect(x.ios.requests).toBe(0);
    expect(await x.s.notifyYes(ask.id)).toBe('allowed');
    expect([x.ios.requests, x.ios.prompts]).toEqual([1, 1]);

    const n = await setup();
    await n.s.ensure();
    await n.s.notifyNo((await oneAsk(n.store)).id);
    expect(n.ios.requests).toBe(0);
  });

  it('NT1.3 · iOS already answered (after a wipe): Send me ideas reads it with no new prompt', async () => {
    const g = await setup({ ios: iosDouble('deny', 'granted') });
    await g.s.ensure();
    expect(await g.s.notifyYes((await oneAsk(g.store)).id)).toBe('allowed');
    expect(g.ios.prompts).toBe(0);
    expect(withEntries(g.sched)).toHaveLength(1);
    const d = await setup({ ios: iosDouble('allow', 'denied') });
    await d.s.ensure();
    const ask = await oneAsk(d.store);
    expect(await d.s.notifyYes(ask.id)).toBe('denied');
    expect(d.ios.prompts).toBe(0);
    expect((await d.store.chat.get(ask.id))!.payload.state).toBe('denied');
    expect(withEntries(d.sched)).toEqual([]);
  });
});

// ── NT1.4 · Allow ────────────────────────────────────────────────────────────────────────────────────────────────
describe('NT1.4 · Allow', () => {
  it('NT1.4 · Allow at 7:42 with 8:00: saved, 7 scheduled, "today at 7:45 am"', async () => {
    const x = await setup();
    await x.s.ensure();
    const ask = await oneAsk(x.store);
    expect(await x.s.notifyYes(ask.id)).toBe('allowed');
    expect((await x.store.profile.get('me'))!.ideaTime).toBe('08:00');
    expect(await x.store.getKv('notify.idea')).toBe('1');
    const last = x.sched.last();
    expect(last).toEqual({ op: 'replaceNudges', list: expect.any(Array) });
    expect((last as { list: { atMs: number }[] }).list.map((n) => n.atMs)).toEqual(W1);
    const payload = (await x.store.chat.get(ask.id))!.payload;
    expect(payload).toEqual({ question: 'notify', state: 'allowed', time: '08:00', when: 'today' });
    expect(askDoneLine('today', '08:00')).toBe('Done. Your first idea lands today at 7:45 am.');
    // Must not: the get-dressed time as the landing time.
    expect(askDoneLine('today', '08:00')).not.toMatch(/8:00 am/);
    // Answered for good: the stored `when` stays when the clock passes 7:45, and nothing changes it.
    x.clock.advance(10 * MIN);
    await x.s.notifyNo(ask.id);
    await x.s.notifyPickTime(ask.id, '09:00');
    expect((await x.store.chat.get(ask.id))!.payload).toEqual({ question: 'notify', state: 'allowed', time: '08:00', when: 'today' });
    expect(await x.store.getKv('notify.idea')).toBe('1');
  });

  it('NT1.4 · after the nudge time: "tomorrow"', async () => {
    const x = await setup({ now: T0 + 8 * MIN });
    await x.s.ensure();
    const ask = await oneAsk(x.store);
    expect(await x.s.notifyYes(ask.id)).toBe('allowed');
    expect((await x.store.chat.get(ask.id))!.payload).toEqual({ question: 'notify', state: 'allowed', time: '08:00', when: 'tomorrow' });
    expect(askDoneLine('tomorrow', '08:00')).toBe('Done. Your first idea lands tomorrow at 7:45 am.');

    // 7:42 with the card's time picked to 7:30: 7:15 has passed.
    const p = await setup();
    await p.s.ensure();
    const pa = await oneAsk(p.store);
    await p.s.notifyPickTime(pa.id, '07:30');
    expect(await p.s.notifyYes(pa.id)).toBe('allowed');
    expect((await p.store.profile.get('me'))!.ideaTime).toBe('07:30');
    expect((await p.store.chat.get(pa.id))!.payload).toEqual({ question: 'notify', state: 'allowed', time: '07:30', when: 'tomorrow' });
    expect(askDoneLine('tomorrow', '07:30')).toBe('Done. Your first idea lands tomorrow at 7:15 am.');
    expect((p.sched.last() as { list: { atMs: number }[] }).list[0]!.atMs).toBe(at('2026-10-23T11:15:00Z'));

    // 5:00 at 7:42: tomorrow at 4:45.
    const e = await setup({ store: await freshStore('05:00') });
    await e.s.ensure();
    const ea = await oneAsk(e.store);
    expect(await e.s.notifyYes(ea.id)).toBe('allowed');
    expect((await e.store.chat.get(ea.id))!.payload).toMatchObject({ when: 'tomorrow', time: '05:00' });
    expect(askDoneLine('tomorrow', '05:00')).toBe('Done. Your first idea lands tomorrow at 4:45 am.');
  });

  it('NT1.4 · the 4 am day change: 3:30 with 5:00 lands today', async () => {
    const early = at('2026-10-22T07:30:00Z'); // 3:30 am EDT
    expect(landsToday(early, '05:00', US_EASTERN)).toBe(true);
    expect(landsToday(T0, '05:00', US_EASTERN)).toBe(false);
    expect(landsToday(T0, '08:00', US_EASTERN)).toBe(true);
    expect(landsToday(T0 + 3 * MIN, '08:00', US_EASTERN)).toBe(false);
    const x = await setup({ now: early, store: await freshStore('05:00') });
    await x.s.ensure();
    const ask = await oneAsk(x.store);
    expect(await x.s.notifyYes(ask.id)).toBe('allowed');
    expect((await x.store.chat.get(ask.id))!.payload).toMatchObject({ when: 'today' });
    expect(askDoneLine('today', '05:00')).toBe('Done. Your first idea lands today at 4:45 am.');
  });
});

// ── NT1.5 · Don't Allow and No thanks ────────────────────────────────────────────────────────────────────────────
describe('NT1.5 · the later line', () => {
  it('NT1.5 · Don\'t Allow: the later line, nothing scheduled', async () => {
    const x = await setup({ ios: iosDouble('deny') });
    await x.s.ensure();
    const ask = await oneAsk(x.store);
    expect(await x.s.notifyYes(ask.id)).toBe('denied');
    expect((await x.store.chat.get(ask.id))!.payload).toEqual({ question: 'notify', state: 'denied', time: '08:00' });
    expect(t('notif.ask.later')).toBe(LATER_LINE);
    expect(withEntries(x.sched)).toEqual([]);
    expect(await x.store.getKv('notify.idea')).toBe('1');
    expect(await x.nudges.reschedule('open')).toEqual({ kind: 'cancelled', why: 'permission' });
    expect(withEntries(x.sched)).toEqual([]);
    // A restart keeps the answered card.
    await x.make().ensure();
    expect((await oneAsk(x.store)).payload.state).toBe('denied');
  });

  it('NT1.5 · No thanks: the later line, switch off, iOS never asked', async () => {
    const x = await setup();
    await x.s.ensure();
    const ask = await oneAsk(x.store);
    await x.s.notifyNo(ask.id);
    expect((await x.store.chat.get(ask.id))!.payload).toEqual({ question: 'notify', state: 'declined', time: '08:00' });
    expect(await x.store.getKv('notify.idea')).toBe('0');
    expect(x.ios.requests).toBe(0);
    expect(withEntries(x.sched)).toEqual([]);
    expect(await x.nudges.reschedule('open')).toEqual({ kind: 'cancelled', why: 'permission' });
    expect(withEntries(x.sched)).toEqual([]);
    // Must not: the old words.
    expect(LATER_LINE).not.toMatch(/Settings/);
    expect(t('notif.ask.later')).not.toMatch(/You → Settings → Notifications/);
  });
});

// ── NT1.6 · the catch-up for first-build testers ─────────────────────────────────────────────────────────────────
describe('NT1.6 · the catch-up', () => {
  async function tester(o: { finish?: string; idea?: string; asked?: string; ios?: IosDouble; age?: boolean; deps?: Partial<FinishDeps>; ideaTime?: string; noCheck?: boolean } = {}) {
    const store = await freshStore(o.ideaTime ?? '07:30');
    if (!o.noCheck) await store.fitChecks.put(check('a', T0 - 3 * DAY));
    await store.chat.put({
      id: 'M-old', createdAt: T0 - 3 * DAY, role: 'stylist', kind: 'text', text: 'An earlier line', cardType: null, fitCheckId: null, outfitId: null, itemId: null, chips: [], payload: {},
    });
    await store.setKv(FINISH_KEY, o.finish ?? finished());
    if (o.idea) await store.setKv('notify.idea', o.idea);
    if (o.asked) await store.setKv('notify.asked', o.asked);
    return setup({ store, firstCheck: false, ios: o.ios ?? iosDouble('allow', 'undetermined'), age: o.age, deps: o.deps });
  }

  it('NT1.6 · a first-build tester (step done, no ask) gets the ask once', async () => {
    const x = await tester();
    await x.s.ensure();
    const ask = await oneAsk(x.store);
    expect(ask.payload).toEqual({ question: 'notify', state: 'open', time: '07:30' });
    // The last thing in today's thread, after today's card.
    expect(x.order.slice(0, 2)).toEqual(['todayCard:start', 'todayCard:done']);
    const all = await thread(x.store);
    expect(all.map((m) => m.id)).toEqual(['M-old', 'TODAY-card', ask.id]);
    expect(ask.createdAt).toBeGreaterThan(all[1]!.createdAt);
    expect(await x.store.getKv('notify.asked')).toBe(ask.id);
    expect(x.ios.requests).toBe(0);
    await x.s.ensure();
    await x.make().ensure();
    expect((await asks(x.store)).map((m) => m.id)).toEqual([ask.id]);
    // Answered on this launch: nothing new on the next.
    expect(await x.s.notifyYes(ask.id)).toBe('allowed');
    await x.make().ensure();
    expect((await asks(x.store)).map((m) => m.id)).toEqual([ask.id]);
  });

  it('NT1.6 · skipped (several fits) counts as finished', async () => {
    const x = await tester({ finish: JSON.stringify({ ...NO_FINISH, step: 'skipped' }), ideaTime: '08:00' });
    await x.s.ensure();
    expect((await oneAsk(x.store)).payload).toEqual({ question: 'notify', state: 'open', time: '08:00' });
    await x.make().ensure();
    expect(await asks(x.store)).toHaveLength(1);
  });

  it('NT1.6 · never when asked, set, waiting, iOS answered, or age-blocked', async () => {
    // The control: the same tester with every condition true gets it.
    const yes = await tester();
    await yes.s.ensure();
    expect(await asks(yes.store)).toHaveLength(1);
    const cases: [string, Parameters<typeof tester>[0]][] = [
      ['notify.asked', { asked: 'M-ask' }],
      ['notifyMsgId', { finish: finished({ notifyMsgId: 'M-ask' }) }],
      ['switch on', { idea: '1' }],
      ['switch off', { idea: '0' }],
      ['granted', { ios: iosDouble('allow', 'granted') }],
      ['denied', { ios: iosDouble('allow', 'denied') }],
      ['age-blocked', { age: true }],
      ['not built', { deps: { notificationsOn: () => false } }],
      // A first-build tester who never checked a fit: the ask waits for his first scored fit, like a new user.
      ['waiting', { finish: JSON.stringify(NO_FINISH), noCheck: true }],
    ];
    for (const [name, o] of cases) {
      const x = await tester(o);
      await x.s.ensure();
      await x.make().ensure();
      expect({ name, asks: (await asks(x.store)).length, requests: x.ios.requests }).toEqual({ name, asks: 0, requests: 0 });
    }
    // Step `moves` while the paywall waits (a launch build): the setup sequence is still under way, no catch-up.
    const m = await tester({ finish: JSON.stringify({ ...NO_FINISH, step: 'moves', checkId: 'a', movesAt: T0 }), deps: { paywallOn: () => true, stylistInFront: () => false } });
    await m.s.ensure();
    expect(await asks(m.store)).toEqual([]);
  });
});

// ── NT1.7 · No thanks is final ───────────────────────────────────────────────────────────────────────────────────
describe('NT1.7 · never asked again', () => {
  it('NT1.7 · No thanks is final: more checks, restarts, the catch-up', async () => {
    for (const answer of ['no', 'deny'] as const) {
      const x = await setup({ ios: iosDouble(answer === 'deny' ? 'deny' : 'allow') });
      await x.s.ensure();
      const ask = await oneAsk(x.store);
      if (answer === 'no') await x.s.notifyNo(ask.id);
      else expect(await x.s.notifyYes(ask.id)).toBe('denied');
      const state = answer === 'no' ? 'declined' : 'denied';
      const requests = x.ios.requests;
      await x.store.fitChecks.put(check('b', T0 + DAY));
      await x.store.fitChecks.put(check('c', T0 + 2 * DAY));
      x.clock.advance(2 * DAY);
      for (let i = 0; i < 3; i++) await x.make().ensure();
      const all = await asks(x.store);
      expect({ answer, ids: all.map((m) => m.id), state: all[0]!.payload.state }).toEqual({ answer, ids: [ask.id], state });
      expect(await x.make().notifyYes(ask.id)).toBe(state);
      expect(x.ios.requests).toBe(requests);
      expect((await x.store.chat.get(ask.id))!.payload.state).toBe(state);
    }
  });
});

// ── NT5 · the wipe and the age lock ──────────────────────────────────────────────────────────────────────────────
describe('NT5 · the ask after a wipe and under the age lock', () => {
  it('NT5.1 · after a wipe the ask comes again like a new user', async () => {
    const x = await setup();
    await x.s.ensure();
    const first = await oneAsk(x.store);
    expect(await x.s.notifyYes(first.id)).toBe('allowed');
    expect(x.ios.prompts).toBe(1);
    const files: PrivacyFiles = { usage: () => ({ photos: 0, bytes: 0 }), lastSent: () => null, deletePhotos: () => {}, deleteLogs: () => {} };
    await deleteAllData({ store: x.store, files, clearDeviceId: async () => {}, cancelNotifications: () => x.nudges.cancelAll() });
    expect(x.sched.last()).toEqual({ op: 'cancelAll' });
    expect(await x.store.getKv('notify.asked')).toBeNull();
    // A new profile and his first scored fit: the sequence and the ask again; iOS is still allowed (no new prompt).
    const store = x.store;
    await store.profile.put({
      id: 'me', birthYear: 2003, heightCm: null, build: '', fitPreference: '', styles: [['minimalist', 0.5]] as never, boldness: 'a_little', budget: null,
      lastOccasion: 'everyday', consentVersion: null, consentAt: null, onboardingDone: true, ideaTime: '08:00', units: 'imperial', createdAt: T0,
    });
    await store.fitChecks.put(check('z', T0));
    const again = x.make();
    await again.ensure();
    const ask = await oneAsk(store);
    expect(ask.id).not.toBe(first.id);
    expect(ask.payload).toEqual({ question: 'notify', state: 'open', time: '08:00' });
    expect(await again.notifyYes(ask.id)).toBe('allowed');
    expect(x.ios.prompts).toBe(1);
  });

  it('NT5.2 · age-blocked: no ask, no catch-up', async () => {
    const x = await setup({ age: true });
    await x.s.ensure();
    expect(await asks(x.store)).toEqual([]);
    expect((await getFinish(x.store)).step).toBe('done');
    await x.make().ensure();
    expect(await asks(x.store)).toEqual([]);
    expect(x.ios.requests).toBe(0);
    expect(withEntries(x.sched)).toEqual([]);
  });
});

// The ask's own words (the copy test checks every key; this pins the ask to the card's question).
test('NT1.2 · the ask is the one-step question', () => {
  expect(t('notif.ask')).toBe(ASK);
  expect(t('notif.ask.label' as StringKey)).toBe('I get dressed at');
});

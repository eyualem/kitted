// T53 · Fit check ready (NT6): the ready watch on the memory store, with the test writer's doubles for iOS, the
// scheduler and iOS's background time (src/testing/notifyDoubles.ts). The checks are rows as the fit-check service
// writes them; nothing reads a photo, calls the network or an AI. The contract: tasks/T53/TESTING.md.
import { createMemoryStore } from '@/data/memoryStore';
import type { KittedStore } from '@/data/store';
import type { FitCheckRow } from '@/data/types';
import { createReadyWatch } from '@/features/morning/readyWatch';
import { readyBody } from '@/features/morning/nudges';
import { backgroundDouble, iosDouble, schedulerDouble, type IosDouble } from '@/testing/notifyDoubles';

const T0 = Date.parse('2026-10-22T11:42:00Z');
const TWO = 'Your fit check is ready. 2 quick fixes inside.';
const ONE = 'Your fit check is ready. 1 quick fix inside.';
const NONE = 'Your fit check is ready.';

const fix = (copy: string) =>
  ({ target: copy, tier: 'free', effort: 1, free: true, to: 7.5, toRaw: 7.5, gain: 0.5, rawGain: 0.5, edits: [], itemId: null, copy, tag: 'Free' }) as unknown as FitCheckRow['fixes'][number];

function check(id: string, o: Partial<FitCheckRow> = {}): FitCheckRow {
  return {
    id, createdAt: T0, dayKey: '2026-10-22', photoFile: null, thumbFile: null, demoPhotoId: 'p01b', imageHash: id, occasion: 'everyday', style: null,
    status: 'scoring', isPartial: false, notRated: [], score: null, rawScore: null, subscores: {}, occasionAdj: 0, rulesFired: [], credits: [], advice: [],
    fixes: [], explanation: null, rubricVersion: 'parts', isFavorite: false, snapState: 'none', recheckUsed: false,
    isFirstCheck: false, readingId: null, parentId: null, itemIds: [], details: {}, ...o,
  } as FitCheckRow;
}

async function rig(o: { ios?: IosDouble; ready?: '1' | '0' | null; built?: boolean; age?: boolean } = {}) {
  const store: KittedStore = createMemoryStore();
  await store.init();
  if (o.ready) await store.setKv('notify.ready', o.ready);
  const ios = o.ios ?? iosDouble('allow', 'granted');
  const sched = schedulerDouble();
  const bg = backgroundDouble();
  const w = createReadyWatch({ store, built: () => o.built ?? true, permissions: ios, scheduler: sched, background: bg, ageBlocked: async () => o.age ?? false });
  /** He leaves while `id` is scoring; it scores with `patch`; the watch hears of the change. */
  const leaveAndScore = async (id: string, patch: Partial<FitCheckRow>) => {
    await store.fitChecks.put(check(id));
    await w.appState('background');
    await store.fitChecks.patch(id, patch);
    await w.checksChanged();
  };
  return { store, ios, sched, bg, w, leaveAndScore };
}

const scored = (fixes: FitCheckRow['fixes'], score = 7.5): Partial<FitCheckRow> => ({ status: 'scored', score, rawScore: score, fixes });

describe('NT6.1 · scored after he left', () => {
  it('NT6.1 · scored in the background: one notification, 2 / 1 / 0 fixes', async () => {
    const r = await rig();
    // Two distinct fixes and a duplicate copy of the first: 2.
    await r.leaveAndScore('c1', scored([fix('Roll the sleeves'), fix('Tuck the tee'), fix('Roll the sleeves')]));
    expect(r.sched.calls).toEqual([{ op: 'presentNow', n: { id: 'ready|c1', body: TWO, atMs: null, data: { kind: 'ready', checkId: 'c1' } } }]);
    // Once per check.
    await r.w.checksChanged();
    await r.store.fitChecks.patch('c1', { score: 7.6 });
    await r.w.checksChanged();
    expect(r.sched.presented()).toHaveLength(1);

    const one = await rig();
    await one.leaveAndScore('c2', scored([fix('Tuck the tee')]));
    expect(one.sched.presented().map((n) => n.body)).toEqual([ONE]);
    const none = await rig();
    await none.leaveAndScore('c3', scored([]));
    expect(none.sched.presented().map((n) => n.body)).toEqual([NONE]);

    expect([readyBody(2), readyBody(1), readyBody(0), readyBody(3)]).toEqual([TWO, ONE, NONE, 'Your fit check is ready. 3 quick fixes inside.']);
  });

  it('NT6.1 · a check that was not scoring when he left sends nothing; a re-check is its own', async () => {
    const r = await rig();
    await r.w.appState('background');
    await r.store.fitChecks.put(check('late', scored([fix('Tuck the tee')])));
    await r.w.checksChanged();
    expect(r.sched.calls).toEqual([]);
    // A check and its re-check both scoring when he leaves: one each.
    const b = await rig();
    await b.store.fitChecks.put(check('c1'));
    await b.store.fitChecks.put(check('r1', { parentId: 'c1' }));
    await b.w.appState('background');
    await b.store.fitChecks.patch('c1', scored([fix('Tuck the tee')]));
    await b.w.checksChanged();
    await b.store.fitChecks.patch('r1', scored([]));
    await b.w.checksChanged();
    await b.w.checksChanged();
    expect(b.sched.presented().map((n) => [n.id, n.body])).toEqual([['ready|c1', ONE], ['ready|r1', NONE]]);
  });

  it('NT6.1 · background time begins on leaving and ends when done', async () => {
    const r = await rig();
    await r.store.fitChecks.put(check('c1'));
    await r.w.appState('background');
    expect(r.bg.begun).toEqual(['bg-1']);
    expect(r.bg.ended).toEqual([]);
    await r.w.checksChanged(); // still scoring
    expect(r.bg.ended).toEqual([]);
    await r.store.fitChecks.patch('c1', scored([fix('Tuck the tee')]));
    await r.w.checksChanged();
    expect(r.bg.ended).toEqual(['bg-1']);
    expect(r.sched.presented()).toHaveLength(1);
    // Nothing scoring when he leaves: no background time asked for.
    const idle = await rig();
    await idle.store.fitChecks.put(check('done', scored([])));
    await idle.w.appState('background');
    expect(idle.bg.begun).toEqual([]);
    // Back in the app before the score: the watch ends, and the later score sends nothing.
    const back = await rig();
    await back.store.fitChecks.put(check('c1'));
    await back.w.appState('background');
    await back.w.appState('active');
    expect(back.bg.ended).toEqual(['bg-1']);
    await back.store.fitChecks.patch('c1', scored([]));
    await back.w.checksChanged();
    expect(back.sched.calls).toEqual([]);
  });
});

describe('NT6.2 · nothing while in the app, nothing for a check without a score', () => {
  it('NT6.2 · in the app: nothing', async () => {
    const r = await rig();
    await r.store.fitChecks.put(check('c1'));
    await r.w.appState('active');
    await r.store.fitChecks.patch('c1', scored([fix('Tuck the tee')]));
    await r.w.checksChanged();
    expect(r.sched.calls).toEqual([]);
    // Never backgrounded at all.
    const n = await rig();
    await n.store.fitChecks.put(check('c1'));
    await n.store.fitChecks.patch('c1', scored([]));
    await n.w.checksChanged();
    expect(n.sched.calls).toEqual([]);
    // Inactive (the app switcher) then back: nothing either.
    const i = await rig();
    await i.store.fitChecks.put(check('c1'));
    await i.w.appState('background');
    await i.w.appState('inactive');
    await i.store.fitChecks.patch('c1', scored([]));
    await i.w.checksChanged();
    expect(i.sched.calls).toEqual([]);
  });

  it('NT6.2 · failed, offline, unreadable, not clothed, held, asking, or no score: nothing', async () => {
    const ends: [string, Partial<FitCheckRow>][] = [
      ['failed ai', { status: 'failed', details: { failCode: 'ai' } }],
      ['failed timeout', { status: 'failed', details: { failCode: 'timeout' } }],
      ['failed offline', { status: 'failed', details: { failCode: 'offline' } }],
      ['unreadable', { status: 'unreadable' }],
      ['notClothed', { status: 'notClothed' }],
      ['held', { status: 'held' }],
      ['asking', { status: 'asking' }],
      ['scored, no score', { status: 'scored', score: null }],
    ];
    for (const [name, patch] of ends) {
      const r = await rig();
      await r.leaveAndScore('c1', patch);
      expect({ name, calls: r.sched.calls, ended: r.bg.ended }).toEqual({ name, calls: [], ended: ['bg-1'] });
      // And it stays unwatched: a later score of the same row sends nothing.
      await r.store.fitChecks.patch('c1', scored([]));
      await r.w.checksChanged();
      expect({ name, calls: r.sched.calls }).toEqual({ name, calls: [] });
    }
    // The control: partly "not rated" with a score sends.
    const p = await rig();
    await p.leaveAndScore('c1', { ...scored([fix('Tuck the tee')]), notRated: ['outer'], isPartial: true });
    expect(p.sched.presented().map((n) => n.body)).toEqual([ONE]);
  });
});

describe('NT6.3 · only when allowed and switched on', () => {
  it('NT6.3 · switch off, denied, undetermined, or not built: nothing', async () => {
    const cases: [string, Parameters<typeof rig>[0]][] = [
      ['switch off', { ready: '0' }],
      ['denied', { ios: iosDouble('allow', 'denied') }],
      ['undetermined', { ios: iosDouble('allow', 'undetermined') }],
      ['not built', { built: false }],
    ];
    for (const [name, o] of cases) {
      const r = await rig(o);
      await r.leaveAndScore('c1', scored([fix('Tuck the tee'), fix('Roll the sleeves')]));
      expect({ name, calls: r.sched.calls, requests: r.ios.requests }).toEqual({ name, calls: [], requests: 0 });
    }
    // Unset with iOS allowed: on by default. '1': on.
    for (const ready of [null, '1'] as const) {
      const r = await rig({ ready });
      await r.leaveAndScore('c1', scored([fix('Tuck the tee'), fix('Roll the sleeves')]));
      expect({ ready, bodies: r.sched.presented().map((n) => n.body), requests: r.ios.requests }).toEqual({ ready, bodies: [TWO], requests: 0 });
    }
  });

  it('NT5.2 · age-blocked: no Fit check ready', async () => {
    const r = await rig({ age: true });
    await r.leaveAndScore('c1', scored([fix('Tuck the tee')]));
    expect(r.sched.calls).toEqual([]);
    expect(r.ios.requests).toBe(0);
    const control = await rig();
    await control.leaveAndScore('c1', scored([fix('Tuck the tee')]));
    expect(control.sched.presented()).toHaveLength(1);
  });
});

describe('NT6.5 · never the score', () => {
  it('NT6.5 · the body never carries the score', async () => {
    for (const [score, fixes, body] of [[7.5, [fix('Tuck the tee'), fix('Roll the sleeves')], TWO], [10, [], NONE], [4.2, [fix('Tuck the tee')], ONE]] as const) {
      const r = await rig();
      await r.leaveAndScore('c1', { ...scored([...fixes], score), explanation: 'Clean and put together' } as Partial<FitCheckRow>);
      const sent = r.sched.presented();
      expect(sent.map((n) => n.body)).toEqual([body]);
      const b = sent[0]!.body;
      expect(b).not.toMatch(/\d+\.\d/);
      expect(b.includes(String(score))).toBe(false);
      expect(b).not.toMatch(/\/10/);
      expect(b).not.toMatch(/Clean|put together/i);
    }
  });
});

// The fit check when things go wrong: a check cut off by the app closing, errors mid-check, Try again with the
// photo gone, two checks at once, and the daily limit on Try again and re-checks.
import { dayKey } from '@kitted/core';
import seed from '../../assets/seed.json';
import type { DemoFault } from '@/demo/demoArgs';
import { createMemoryStore } from '@/data/memoryStore';
import type { FitCheckRow } from '@/data/types';
import { failInterruptedChecks } from '@/features/fitcheck/interrupted';
import { createFitCheckService, DEFAULT_TIMERS, type StartOutcome } from '@/features/fitcheck/service';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { demoImagePrep, type ImagePrep } from '@/services/imagePrep/demo';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import type { ReadingSource } from '@/services/readingSource/types';
import { realScheduler } from '@/services/scheduler';

const at = (iso: string) => Date.parse(iso);
const STYLES = seed.scenarios.firstRun.onboardingAnswers.styles as unknown as [string, number][];

interface Opts { fault?: () => DemoFault | null; prep?: ImagePrep; wrap?: (s: ReadingSource) => ReadingSource; pro?: boolean }

async function setup(o: Opts = {}) {
  const store = createMemoryStore();
  const clock = manualClock(at('2026-10-22T12:00:00-04:00'));
  const source = createMockReadingSource({ latency: () => 0, scheduler: realScheduler, fault: o.fault });
  const quota = createQuota({ store, clock, isPro: () => o.pro === true });
  const svc = createFitCheckService({
    store, source: o.wrap ? o.wrap(source) : source, prep: o.prep ?? demoImagePrep, quota, clock, scheduler: realScheduler, ids: counterIds(),
    timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }),
  });
  await store.profile.put({
    id: 'me', birthYear: 2005, heightCm: 178, build: 'average', fitPreference: 'regular', styles: STYLES, boldness: null, budget: null,
    lastOccasion: 'everyday', consentVersion: '1', consentAt: clock.nowMs(), onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: clock.nowMs(),
  });
  return { store, clock, svc, quota, source };
}

const idOf = (r: StartOutcome) => ('checkId' in r ? r.checkId : '');
const quiet = () => jest.spyOn(console, 'error').mockImplementation(() => {});

describe('a check cut off by the app closing', () => {
  it('at launch a row still "scoring" becomes failed (Try again); scored rows are untouched', async () => {
    const { store, svc } = await setup();
    const scored = idOf(await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' }));
    const stuck: FitCheckRow = { ...(await store.fitChecks.get(scored))!, id: 'FC-stuck', status: 'scoring', score: null, details: {} };
    await store.fitChecks.put(stuck);
    expect(await failInterruptedChecks(store)).toBe(1);
    expect([(await store.fitChecks.get('FC-stuck'))!.status, (await store.fitChecks.get('FC-stuck'))!.details.failCode]).toEqual(['failed', 'ai']);
    expect((await store.fitChecks.get(scored))!.status).toBe('scored');
  });
});

describe('errors mid-check', () => {
  it('prep throws: "error" with no card, the session idle, nothing counted, and the next check works', async () => {
    const err = quiet();
    let boom = true;
    const prep: ImagePrep = { prepare: (p) => (boom ? Promise.reject(new Error('native prep')) : demoImagePrep.prepare(p)) };
    const { store, svc, quota } = await setup({ prep });
    expect(await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })).toEqual({ outcome: 'error' });
    expect(await store.fitChecks.all()).toEqual([]);
    expect(svc.getState().kind).toBe('idle');
    expect((await quota.snapshot()).checksUsed).toBe(0);
    boom = false;
    expect((await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })).outcome).toBe('scored');
    err.mockRestore();
  });

  it('the read throws after the card is posted: the row is failed (Try again), the reading card ends', async () => {
    const err = quiet();
    let boom = true;
    const wrap = (s: ReadingSource): ReadingSource => ({
      ...s,
      read(image, kind, o) {
        if (!boom) return s.read(image, kind, o);
        return (async function* () {
          yield* [];
          throw new Error('stream broke');
        })();
      },
    });
    const { store, svc, quota } = await setup({ wrap });
    const r = await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' });
    expect(r.outcome).toBe('error');
    const row = (await store.fitChecks.get(idOf(r)))!;
    expect([row.status, row.details.failCode]).toEqual(['failed', 'ai']);
    expect(svc.getState().kind).toBe('idle');
    expect((await quota.snapshot()).checksUsed).toBe(0);
    boom = false;
    expect((await svc.retry(row.id)).outcome).toBe('scored');
    err.mockRestore();
  });
});

describe('Try again', () => {
  it("the photo's copy is gone: the row stays failed, so the card stays", async () => {
    let fault: DemoFault | null = 'ai';
    let gone = false;
    const prep: ImagePrep = { prepare: (p) => (gone ? Promise.resolve({ status: 'unknownPhoto' as const }) : demoImagePrep.prepare(p)) };
    const { store, svc } = await setup({ fault: () => fault, prep });
    const id = idOf(await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' }));
    fault = null;
    gone = true;
    expect((await svc.retry(id)).outcome).toBe('unknownPhoto');
    expect((await store.fitChecks.get(id))!.status).toBe('failed');
  });

  it('counts against today: fail, take another (the free check), then Try again on the first → limit, still failed', async () => {
    let fault: DemoFault | null = 'ai';
    const { store, svc } = await setup({ fault: () => fault });
    const first = idOf(await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' }));
    fault = null;
    expect((await svc.start({ mode: 'check', photoId: 's15', occasion: 'everyday' })).outcome).toBe('scored');
    expect(await svc.retry(first)).toEqual({ outcome: 'limit' });
    expect((await store.fitChecks.get(first))!.status).toBe('failed');
  });

  it("yesterday's failed check, retried today, uses today's check (not yesterday's)", async () => {
    let fault: DemoFault | null = 'ai';
    const { store, svc, clock, quota } = await setup({ fault: () => fault });
    const id = idOf(await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' }));
    const yesterday = dayKey(clock.nowMs(), clock.offset);
    clock.advance(24 * 3600_000);
    fault = null;
    expect((await svc.retry(id)).outcome).toBe('scored');
    const today = dayKey(clock.nowMs(), clock.offset);
    expect((await store.usage.get(yesterday))?.checks ?? 0).toBe(0);
    expect((await store.usage.get(today))?.checks).toBe(1);
    expect((await quota.snapshot()).checksUsed).toBe(1);
  });
});

describe('one check at a time', () => {
  it('a second photo while one is reading is refused ("busy"); the first card is untouched; cancel fails it visibly', async () => {
    const { store, svc, source } = await setup({ pro: true });
    source.holdAt = 0.5;
    const first = svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' });
    await new Promise((r) => setTimeout(r, 20));
    expect(svc.getState()).toMatchObject({ kind: 'reading' });
    expect(await svc.start({ mode: 'check', photoId: 's15', occasion: 'everyday' })).toEqual({ outcome: 'busy' });
    expect(svc.getState()).toMatchObject({ kind: 'reading' });
    await svc.cancel();
    const r = await first;
    expect(r.outcome).toBe('failed');
    expect((await store.fitChecks.get(idOf(r)))!.status).toBe('failed');
    expect(svc.getState().kind).toBe('idle');
    source.holdAt = null;
    expect((await svc.start({ mode: 'check', photoId: 's15', occasion: 'everyday' })).outcome).toBe('scored');
  });
});

describe('re-checks', () => {
  it('one per check: a second re-check (e.g. "Try another") is refused and reads nothing', async () => {
    const { store, svc } = await setup();
    const id = idOf(await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' }));
    const first = idOf(await svc.start({ mode: 'recheck', photoId: 'p01a', parentCheckId: id }));
    // A re-check that saw the change (one that missed it allows one more try: next test).
    const row = (await store.fitChecks.get(first))!;
    await store.fitChecks.put({ ...row, details: { ...row.details, recheck: { ...row.details.recheck!, notSeen: false } } });
    const readings = (await store.readings.all()).length;
    expect(await svc.start({ mode: 'recheck', photoId: 'p01b2', parentCheckId: id })).toEqual({ outcome: 'limit' });
    expect((await store.readings.all()).length).toBe(readings);
    expect((await store.fitChecks.all()).filter((c) => c.parentId === id)).toHaveLength(1);
  });

  it('a re-check that missed the change allows one "Try another photo", then no more', async () => {
    const { store, svc } = await setup();
    const id = idOf(await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' }));
    const first = idOf(await svc.start({ mode: 'recheck', photoId: 'p01a', parentCheckId: id }));
    const row = (await store.fitChecks.get(first))!;
    await store.fitChecks.put({ ...row, details: { ...row.details, recheck: { ...row.details.recheck!, notSeen: true } } });
    expect((await svc.start({ mode: 'recheck', photoId: 'p01b2', parentCheckId: id })).outcome).toBe('scored');
    expect(await svc.start({ mode: 'recheck', photoId: 'p01a', parentCheckId: id })).toEqual({ outcome: 'limit' });
  });
});

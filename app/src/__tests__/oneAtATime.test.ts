// One check at a time, start to finish (#371). On Oct 23 he took a new photo and, while it was still reading, tapped
// Re-check on his 9:51 pm card: the re-check's photo prep, read and closet call ran on top of the first check's
// reveal, closet call and measuring, and the app bogged down. Now a photo taken while another check is going waits its
// turn (it isn't thrown away), and no check starts until the last one's closet work is done (capped), with a short
// breath so the last score's reveal plays first. Checks O1–O9.
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { createClosetService } from '@/features/closet/service';
import { createFitCheckService, DEFAULT_TIMERS, type StartOutcome, type TimerConfig } from '@/features/fitcheck/service';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { demoImagePrep, type ImagePrep } from '@/services/imagePrep/demo';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import type { ReadingSource } from '@/services/readingSource/types';
import { realScheduler } from '@/services/scheduler';

const STYLES = seed.scenarios.firstRun.onboardingAnswers.styles as unknown as [string, number][];
const tick = (ms = 15) => new Promise((r) => setTimeout(r, ms));
const idOf = (r: StartOutcome) => ('checkId' in r ? r.checkId : '');

/** A gate: `wait()` resolves once `open()` is called. */
function gate() {
  let open!: () => void;
  const p = new Promise<void>((r) => (open = r));
  return { wait: () => p, open: () => open() };
}

interface Opts { timers?: Partial<TimerConfig>; closetSettle?: () => Promise<void>; closetBusy?: () => boolean }

async function setup(o: Opts = {}) {
  const store = createMemoryStore();
  const clock = manualClock(Date.parse('2026-10-23T22:08:00-04:00'));
  const mock = createMockReadingSource({ latency: () => 0, scheduler: realScheduler });
  // Each read can be held at its start; `live` counts reads in flight, `peak` the most at once.
  const holds: ReturnType<typeof gate>[] = [];
  let live = 0;
  let peak = 0;
  const source: ReadingSource = {
    ...mock,
    read(image, kind, opt) {
      return (async function* () {
        live += 1;
        peak = Math.max(peak, live);
        try {
          const h = holds.shift();
          if (h) await h.wait();
          yield* mock.read(image, kind, opt);
        } finally {
          live -= 1;
        }
      })();
    },
  };
  const events: string[] = [];
  const at = new Map<string, number>();
  const prep: ImagePrep = {
    prepare: (p) => {
      const name = p.kind === 'demo' ? p.photoId : p.kind;
      events.push(`prep ${name}`);
      at.set(name, Date.now());
      return demoImagePrep.prepare(p);
    },
  };
  const quota = createQuota({ store, clock, isPro: () => true });
  const real = createClosetService({ store, clock, scheduler: realScheduler, ids: counterIds(), source: null });
  const closet = { ...real, ...(o.closetSettle ? { settle: o.closetSettle } : {}), ...(o.closetBusy ? { busy: o.closetBusy } : {}) };
  const svc = createFitCheckService({
    store, source, prep, quota, clock, scheduler: realScheduler, ids: counterIds(), closet,
    timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0, ...o.timers }),
  });
  await store.profile.put({
    id: 'me', birthYear: 2005, heightCm: 178, build: 'average', fitPreference: 'regular', styles: STYLES, boldness: null, budget: null,
    lastOccasion: 'everyday', consentVersion: '1', consentAt: clock.nowMs(), onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: clock.nowMs(),
  });
  const hold = () => {
    const g = gate();
    holds.push(g);
    return g;
  };
  return { store, svc, quota, events, hold, peak: () => peak, prepAt: (name: string) => at.get(name) };
}

describe('a photo while another check is going waits its turn', () => {
  it('O1: the second photo is scored after the first, never alongside it; the first is untouched', async () => {
    const { store, svc, events, hold, peak } = await setup();
    const g = hold();
    const a = svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' });
    await tick();
    expect(svc.getState()).toMatchObject({ kind: 'reading' });
    const b = svc.start({ mode: 'check', photoId: 's15', occasion: 'everyday' });
    await tick();
    // B waits: its photo isn't prepped, posted or read while A reads.
    expect(events).toEqual(['prep p01b']);
    expect((await store.fitChecks.all()).map((c) => c.demoPhotoId)).toEqual(['p01b']);
    g.open();
    const [ra, rb] = await Promise.all([a, b]);
    expect([ra.outcome, rb.outcome]).toEqual(['scored', 'scored']);
    expect(events).toEqual(['prep p01b', 'prep s15']);
    expect(peak()).toBe(1);
    const rows = await store.fitChecks.all();
    expect(rows.map((c) => [c.demoPhotoId, c.status])).toEqual([['p01b', 'scored'], ['s15', 'scored']]);
    expect(svc.getState().kind).toBe('idle');
  });

  it('O2: a closet still busy holds the next photo; when it settles the photo goes', async () => {
    let release!: () => void;
    let busy = false;
    const { svc, events } = await setup({
      closetSettle: () => (busy ? new Promise<void>((r) => (release = () => { busy = false; r(); })) : Promise.resolve()),
      closetBusy: () => busy,
    });
    expect((await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })).outcome).toBe('scored');
    busy = true; // A's closet call is out
    expect(svc.busy()).toBe(true);
    const b = svc.start({ mode: 'check', photoId: 's15', occasion: 'everyday' });
    await tick();
    expect(events).toEqual(['prep p01b']);
    release();
    expect((await b).outcome).toBe('scored');
    expect(events).toEqual(['prep p01b', 'prep s15']);
    expect(svc.busy()).toBe(false);
  });

  it('O3: a closet that never settles holds the next photo only up to the cap', async () => {
    const { svc, events } = await setup({
      timers: { enabled: true, tailMs: 60, revealGapMs: 0 },
      closetSettle: () => new Promise<void>(() => {}),
    });
    const t0 = Date.now();
    expect((await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })).outcome).toBe('scored');
    expect((await svc.start({ mode: 'check', photoId: 's15', occasion: 'everyday' })).outcome).toBe('scored');
    expect(events).toEqual(['prep p01b', 'prep s15']);
    // Two capped waits (one before each check), never more.
    expect(Date.now() - t0).toBeLessThan(2_000);
  });

  it("O4 (his Oct 23): a re-check of an earlier card tapped while a new check reads waits, then is that card's re-check", async () => {
    const { store, svc, hold, peak } = await setup();
    const first = idOf(await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' }));
    const g = hold();
    const fresh = svc.start({ mode: 'check', photoId: 's15', occasion: 'date' });
    await tick();
    const re = svc.start({ mode: 'recheck', photoId: 'p01a', parentCheckId: first });
    await tick();
    expect((await store.fitChecks.all()).filter((c) => c.parentId === first)).toHaveLength(0);
    g.open();
    const [rf, rr] = await Promise.all([fresh, re]);
    expect([rf.outcome, rr.outcome]).toEqual(['scored', 'scored']);
    const recheck = (await store.fitChecks.get(idOf(rr)))!;
    expect(recheck.parentId).toBe(first);
    expect(recheck.details.recheck?.parentScore).toBe((await store.fitChecks.get(first))!.score);
    expect((await store.fitChecks.get(first))!.recheckUsed).toBe(true);
    expect((await store.fitChecks.get(idOf(rf)))!.parentId).toBeNull();
    expect(peak()).toBe(1);
  });

  it('O5: a third photo while one already waits is refused ("busy"), nothing sent; the waiting one still runs', async () => {
    const { store, svc, events, hold } = await setup();
    const g = hold();
    const a = svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' });
    await tick();
    const b = svc.start({ mode: 'check', photoId: 's15', occasion: 'everyday' });
    await tick();
    expect(await svc.start({ mode: 'check', photoId: 's14', occasion: 'everyday' })).toEqual({ outcome: 'busy' });
    g.open();
    expect([(await a).outcome, (await b).outcome]).toEqual(['scored', 'scored']);
    expect(events).not.toContain('prep s14');
    expect((await store.fitChecks.all()).map((c) => c.demoPhotoId)).toEqual(['p01b', 's15']);
  });

  it('O6: cancel (a demo reset, Delete all my data) drops the waiting photo: "dropped", never prepped or counted', async () => {
    const { store, svc, quota, events, hold } = await setup();
    hold(); // A never finishes by itself
    const a = svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' });
    await tick();
    const b = svc.start({ mode: 'check', photoId: 's15', occasion: 'everyday' });
    await tick();
    await svc.cancel();
    expect(await b).toEqual({ outcome: 'dropped' });
    expect((await a).outcome).toBe('failed');
    expect(events).toEqual(['prep p01b']);
    expect((await store.fitChecks.all()).map((c) => c.demoPhotoId)).toEqual(['p01b']);
    expect((await quota.snapshot()).checksUsed).toBe(0);
    expect(svc.busy()).toBe(false);
  });

  it("O7: a waiting photo starts only after a breath, so the last score's reveal plays first", async () => {
    const { svc, hold, prepAt } = await setup({ timers: { enabled: true, tailMs: 1_000, revealGapMs: 120 } });
    const g = hold();
    const a = svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' });
    await tick();
    const b = svc.start({ mode: 'check', photoId: 's15', occasion: 'everyday' });
    g.open();
    await a;
    const aEnded = Date.now();
    await b;
    expect(prepAt('s15')! - aEnded).toBeGreaterThanOrEqual(100);
  });

  it('O8: busy() is true while a check reads or one waits, false once all are done', async () => {
    const { svc, hold } = await setup();
    expect(svc.busy()).toBe(false);
    const g = hold();
    const a = svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' });
    await tick();
    expect(svc.busy()).toBe(true);
    const b = svc.start({ mode: 'check', photoId: 's15', occasion: 'everyday' });
    g.open();
    await a;
    expect(svc.busy()).toBe(true); // B has the slot now
    await b;
    expect(svc.busy()).toBe(false);
  });

  it('O9: Try again while a check reads is still refused ("busy"): a button he can tap again, no photo to keep', async () => {
    const { svc, hold } = await setup();
    const g = hold();
    const a = svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' });
    await tick();
    expect(await svc.retry('FC-1')).toEqual({ outcome: 'busy' });
    g.open();
    expect((await a).outcome).toBe('scored');
  });
});

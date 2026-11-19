// T69-G8 (Q-T1): new checks score with parts v16; a check stored before T69 (rubricVersion "parts-1.14.0") keeps its
// score, and when it's edited (a correction, another occasion, the one quick tap, its re-check) it is scored with the
// v15 engine it was scored with, never moved to v16 (#209, [SCO-9]). Recorded demo readings (stock photos, profile
// unknown: the seed's firstRun profile; ph1 is the founder's Oct 7 reading, no photo), a cool October day (no weather
// row, the month), the bundled mock source; no network.
import { createParts, partsDataFor, partsEngineFor, type PartsScored, type Reading } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import type { FitCheckRow } from '@/data/types';
import { scoreOptions } from '@/features/fitcheck/scoring';
import { createFitCheckService, DEFAULT_TIMERS, lensInput } from '@/features/fitcheck/service';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { demoImagePrep } from '@/services/imagePrep/demo';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { realScheduler } from '@/services/scheduler';

const STYLES = seed.scenarios.firstRun.onboardingAnswers.styles as unknown as [string, number][];
const V15 = createParts(partsDataFor(true, true, false));
const v16Of = (row: FitCheckRow) => (row.details.parts as unknown as { v16?: unknown } | undefined)?.v16;

async function setup(o: { tap?: boolean } = {}) {
  const store = createMemoryStore();
  const clock = manualClock(Date.parse('2026-10-22T07:42:00-04:00'));
  const svc = createFitCheckService({
    store, source: createMockReadingSource({ latency: () => 0, scheduler: realScheduler }), prep: demoImagePrep,
    quota: createQuota({ store, clock, isPro: () => true }), clock, scheduler: realScheduler, ids: counterIds(), tap: () => o.tap === true,
    timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }),
  });
  await store.profile.put({
    id: 'me', birthYear: 2005, heightCm: 178, build: 'average', fitPreference: 'regular', styles: STYLES, boldness: null, budget: null,
    lastOccasion: 'everyday', consentVersion: '1', consentAt: clock.nowMs(), onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: clock.nowMs(),
  });
  const start = async (photoId: string, occasion: 'everyday' | 'date' = 'everyday') =>
    (await store.fitChecks.get(((await svc.start({ mode: 'check', photoId, occasion })) as { checkId: string }).checkId))!;
  const readingOf = async (row: FitCheckRow) => (await store.readings.get(row.readingId!))!.reading;
  const optsOf = (row: FitCheckRow, occasion = row.occasion) => scoreOptions(lensInput(occasion, row.style, { styles: STYLES, boldness: null }, row.details.secondLook));
  /** The check as a build before T69 stored it: scored by v15, "parts-1.14.0", no v16 block. */
  const makeOld = async (row: FitCheckRow) => {
    const reading = await readingOf(row);
    const v15 = V15.scoreParts(reading, optsOf(row)) as PartsScored;
    const parts = { ...(row.details.parts ?? {}) } as Record<string, unknown>;
    delete parts['v16'];
    await store.fitChecks.put({ ...row, rubricVersion: 'parts-1.14.0', score: v15.overall, rawScore: v15.rawScore, details: { ...row.details, parts: parts as never } });
    return (await store.fitChecks.get(row.id))!;
  };
  return { store, clock, svc, start, readingOf, optsOf, makeOld };
}

let log: jest.SpyInstance;
beforeEach(() => (log = jest.spyOn(console, 'log').mockImplementation(() => {})));
afterEach(() => log.mockRestore());

describe('which engine scores a check (T69-G8)', () => {
  it('T69-G8 · the router: parts-2.0.0 is v16, every older parts version is v15', () => {
    expect(partsEngineFor('parts-2.0.0').data.engine).toBe('v16');
    for (const v of ['parts-1.14.0', 'parts-1.13.0', 'parts-1.0.0']) expect([v, partsEngineFor(v).data.engine]).toEqual([v, 'v15']);
    expect(partsEngineFor('parts-1.14.0').data.tune).toEqual(partsDataFor(true, true, false).tune);
  });

  it('T69-G8 · a new check scores v16; an old check keeps v15 on read, correction, occasion change and re-check', async () => {
    const env = await setup();
    const fresh = await env.start('s12');
    expect([fresh.rubricVersion, v16Of(fresh) !== undefined]).toEqual(['parts-2.0.0', true]);
    expect(fresh.score).toBe(7.0); // s12 at Everyday: v16 7.0 (v15 7.5)
    const old = await env.makeOld(fresh);
    expect([old.score, old.rubricVersion]).toEqual([7.5, 'parts-1.14.0']);
    // read, and the app going on around it: the stored score never moves by itself
    await env.svc.onAppOpen();
    await env.start('s05');
    expect(await env.store.fitChecks.get(old.id)).toEqual(old);
    // a correction: scored by v15, still v15
    await env.svc.saveCorrection(old.id, { garmentIndex: 0, field: 'color_family', value: 'black' });
    const corrected = (await env.store.fitChecks.get(old.id))!;
    const cr = await env.readingOf(corrected);
    expect([corrected.score, corrected.rubricVersion, v16Of(corrected)]).toEqual([V15.scoreParts(cr, env.optsOf(corrected)).overall, 'parts-1.14.0', undefined]);
    // another occasion: v15
    const moved = (await env.svc.changeOccasion(old.id, 'date'))!;
    expect([moved.score, moved.rubricVersion, v16Of(moved)]).toEqual([V15.scoreParts(cr, env.optsOf(moved, 'date')).overall, 'parts-1.14.0', undefined]);
    // its re-check (a new photo): both numbers v15, the re-check stays on its first check's engine
    const r = await env.svc.start({ mode: 'recheck', photoId: 's05', parentCheckId: old.id });
    const re = (await env.store.fitChecks.get((r as { checkId: string }).checkId))!;
    const parent = (await env.store.fitChecks.get(old.id))!;
    const merged = await env.readingOf(re);
    expect([re.rubricVersion, v16Of(re)]).toEqual(['parts-1.14.0', undefined]);
    expect(re.details.recheck?.parentScore).toBe(V15.scoreParts(await env.readingOf(parent), env.optsOf(parent)).overall);
    expect(re.score).toBe(V15.scoreParts(merged, env.optsOf(parent)).overall);
  });

  it('T69-G8 · the one quick tap on an old check scores with v15', async () => {
    const env = await setup({ tap: true });
    const asking = await env.start('ph1');
    expect(asking.status).toBe('asking');
    const old = await env.makeOld({ ...asking, details: { ...asking.details } });
    const tap = old.details.tap!;
    // the answer whose reading the two engines score differently (so the check below can tell them apart)
    const reading: Reading = await env.readingOf(old);
    const V16 = partsEngineFor('parts-2.0.0');
    const pick = tap.options.find((o) => {
      const r = { ...reading, garments: reading.garments.map((g, i) => (i === tap.garmentIndex ? { ...g, subcategory: o.value } : g)) };
      return V15.scoreParts(r, env.optsOf(old)).overall !== V16.scoreParts(r, env.optsOf(old)).overall;
    });
    expect(pick).toBeDefined();
    const done = (await env.svc.answerTap(old.id, pick!.value))!;
    const read = await env.readingOf(done);
    expect([done.score, done.rubricVersion, v16Of(done)]).toEqual([V15.scoreParts(read, env.optsOf(done)).overall, 'parts-1.14.0', undefined]);
  });
});

// The one quick tap (02 "S5q", DECISIONS-LOG #85) end to end on the memory store: the founder's Oct 7 outfit
// (ph1: black wide jeans read as sweatpants) asks "Jeans or sweatpants?" before the score.
import { askQuestion } from '@kitted/core';
import type { DemoFault } from '@/demo/demoArgs';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import type { KittedStore } from '@/data/store';
import { lensInput, createFitCheckService, DEFAULT_TIMERS, type TimerConfig } from '@/features/fitcheck/service';
import { scoreOptions } from '@/features/fitcheck/scoring';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { demoImagePrep } from '@/services/imagePrep/demo';
import { createQuota, isRecheckOpen, recheckDeadline } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { demoReadingById } from '@/services/readingSource/demoReadings';
import { realScheduler } from '@/services/scheduler';

const at = (iso: string) => Date.parse(iso);
const STYLES = seed.scenarios.firstRun.onboardingAnswers.styles as unknown as [string, number][];

interface Opts { now?: string; pro?: boolean; store?: KittedStore; tap?: boolean; timers?: Partial<TimerConfig>; latency?: number; fault?: () => DemoFault | null }

async function setup(o: Opts = {}) {
  const store = o.store ?? createMemoryStore();
  const clock = manualClock(at(o.now ?? '2026-10-22T07:42:00-04:00'));
  const source = createMockReadingSource({ latency: () => o.latency ?? 0, scheduler: realScheduler, fault: o.fault });
  const quota = createQuota({ store, clock, isPro: () => o.pro === true });
  const svc = createFitCheckService({
    store, source, prep: demoImagePrep, quota, clock, scheduler: realScheduler, ids: counterIds(),
    timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0, ...o.timers }),
    tap: () => o.tap !== false,
  });
  if (!(await store.profile.get('me'))) {
    await store.profile.put({
      id: 'me', birthYear: 2005, heightCm: 178, build: 'average', fitPreference: 'regular', styles: STYLES, boldness: null, budget: null,
      lastOccasion: 'everyday', consentVersion: '1', consentAt: clock.nowMs(), onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: clock.nowMs(),
    });
  }
  return { store, clock, svc, quota };
}

async function asking(o: Opts = {}, occasion: 'everyday' | 'class' | 'date' | 'interview' = 'everyday') {
  const env = await setup(o);
  const r = await env.svc.start({ mode: 'check', photoId: 'ph1', occasion });
  expect(r.outcome).toBe('asking');
  return { ...env, id: (r as { checkId: string }).checkId };
}

describe('asking', () => {
  it('"Jeans or sweatpants?" before the score: nothing counted, nothing added, stored on the row', async () => {
    const { store, svc, quota, id } = await asking();
    const row = (await store.fitChecks.get(id))!;
    expect([row.status, row.score, row.itemIds]).toEqual(['asking', null, []]);
    const tap = row.details.tap!;
    expect([tap.question, tap.order, tap.default, tap.answer, tap.slot, tap.ordinal, tap.occasion]).toEqual(
      ['Jeans or sweatpants?', ['jeans', 'sweatpants'], 'jeans', null, 'bottom', 0, 'everyday'],
    );
    expect(tap.options.map((o) => [o.value, o.score])).toEqual([['sweatpants', 5], ['jeans', 6.5]]);
    expect((await store.readings.get(row.readingId!))!.source).toBe('full');
    expect(await store.closet.all()).toEqual([]);
    expect((await quota.snapshot()).checksUsed).toBe(0);
    expect(svc.getState().kind).toBe('idle');
  });

  it('off (the flag) or a sure reading: no question', async () => {
    const off = await setup({ tap: false });
    const r = await off.svc.start({ mode: 'check', photoId: 'ph1', occasion: 'everyday' });
    expect(r.outcome).toBe('scored');
    expect((await off.store.fitChecks.get((r as { checkId: string }).checkId))!.score).toBe(5);
    const on = await setup();
    expect((await on.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })).outcome).toBe('scored');
  });

  it('Gym asks nothing', async () => {
    const { svc } = await setup();
    expect((await svc.start({ mode: 'check', photoId: 'ph1', occasion: 'gym' })).outcome).toBe('scored');
  });

  it("the question's scores are the card's (one options builder)", async () => {
    const { store, svc, id } = await asking({}, 'date');
    const row = (await store.fitChecks.get(id))!;
    const p = (await store.profile.get('me'))!;
    const q = askQuestion(demoReadingById('ph1')!, scoreOptions(lensInput(row.occasion, row.style, { styles: p.styles, boldness: p.boldness })))!;
    expect(q.options).toEqual(row.details.tap!.options);
    const done = (await svc.answerTap(id, 'skip'))!;
    expect(done.score).toBe(row.details.tap!.options.find((o) => o.value === row.details.tap!.default)!.score);
    expect(done.score).toBe(5.5);
  });
});

describe('answering', () => {
  it('Jeans: 6.5, reads as streetwear, Black jeans added and confirmed, the check counted, a derived reading', async () => {
    const { store, svc, quota, id } = await asking();
    const done = (await svc.answerTap(id, 'jeans'))!;
    expect([done.status, done.score, done.details.readsAs, done.rulesFired]).toEqual(['scored', 6.5, 'streetwear', ['F4_hem_drags_over_slides']]);
    expect(done.details.tap).toMatchObject({ answer: 'jeans', skipped: false });
    expect(done.details.tap!.answeredAt).not.toBeNull();
    const reading = (await store.readings.get(done.readingId!))!;
    expect([reading.source, reading.reading.garments[1]!.subcategory, reading.reading.garments[1]!.certainty]).toEqual(['tapAnswer', 'jeans', 'likely']);
    expect((await store.readings.get(reading.derivedFrom!))!.source).toBe('full');
    const jeans = (await store.closet.all()).find((c) => c.slot === 'bottom')!;
    expect([jeans.name, jeans.confirmedFields]).toEqual(['Black jeans', ['subcategory']]);
    expect((await quota.snapshot()).checksUsed).toBe(1);
    const cr = await store.corrections.all();
    expect(cr.map((c) => [c.kind, c.field, c.oldValue, c.newValue, c.scoreBefore, c.scoreAfter])).toEqual([['tapAnswer', 'subcategory', 'sweatpants', 'jeans', 5, 6.5]]);
  });

  it('Sweatpants: 5.0, Black sweatpants', async () => {
    const { store, svc, id } = await asking();
    expect((await svc.answerTap(id, 'sweatpants'))!.score).toBe(5);
    expect((await store.closet.all()).map((c) => c.name)).toContain('Black sweatpants');
  });

  it('Skip: the generous reading (6.5), not confirmed in the closet; then "Not quite right?" can change it', async () => {
    const { store, svc, id } = await asking();
    const done = (await svc.answerTap(id, 'skip'))!;
    expect([done.score, done.details.tap!.answer, done.details.tap!.skipped]).toEqual([6.5, 'jeans', true]);
    expect((await store.corrections.all()).map((c) => c.kind)).toEqual(['tapSkip']);
    expect((await store.closet.all()).find((c) => c.slot === 'bottom')!.confirmedFields).toEqual([]);
    const r = await svc.saveCorrection(id, { garmentIndex: done.details.tap!.garmentIndex, field: 'subcategory', value: 'sweatpants' });
    // The piece takes his word, and its name follows (#91): "Saved to your black sweatpants."
    expect(r).toEqual({ before: 6.5, after: 5, itemName: 'Black sweatpants' });
    const after = (await store.fitChecks.get(id))!;
    expect([after.status, after.details.tap!.answer]).toEqual(['scored', 'jeans']); // never re-asked
    expect((await store.readings.get(after.readingId!))!.source).toBe('corrected');
  });

  it('two quick taps: the first wins, scored once', async () => {
    const { store, svc, quota, id } = await asking();
    const [a, b] = await Promise.all([svc.answerTap(id, 'jeans'), svc.answerTap(id, 'sweatpants')]);
    expect([a?.score, b]).toEqual([6.5, null]);
    expect((await store.readings.all()).filter((r) => r.source === 'tapAnswer')).toHaveLength(1);
    expect((await quota.snapshot()).checksUsed).toBe(1);
    expect(await svc.answerTap(id, 'skip')).toBeNull();
    expect(await svc.answerTap(id, 'chinos')).toBeNull();
  });

  it('works on a fresh service (the app was closed mid-question)', async () => {
    const first = await asking();
    const again = await setup({ store: first.store });
    expect((await again.svc.answerTap(first.id, 'jeans'))!.score).toBe(6.5);
  });

  it('a slow answer never times out (the reading timers are already cleared)', async () => {
    const { store, svc, id } = await asking({ timers: { enabled: true, hedgeMs: 5, slowMs: 10, abortMs: 20 } });
    await new Promise((r) => setTimeout(r, 60));
    expect((await store.fitChecks.get(id))!.status).toBe('asking');
    expect((await svc.answerTap(id, 'jeans'))!.score).toBe(6.5);
  });

  it('an occasion change after the answer re-scores the answered reading (Interview 4.0), no new question', async () => {
    const { store, svc, id } = await asking();
    await svc.answerTap(id, 'jeans');
    const next = (await svc.changeLens(id, { occasion: 'interview' }))!;
    expect([next.score, next.status, next.details.tap!.answer]).toEqual([4, 'scored', 'jeans']);
    expect(await store.readings.all()).toHaveLength(2); // full + tapAnswer only
  });

  it("can't change the occasion while asking", async () => {
    const { svc, id } = await asking();
    expect(await svc.changeLens(id, { occasion: 'date' })).toBeNull();
    expect(await svc.previewLens(id, { occasion: 'date' })).toBeNull();
  });
});

describe('around the question', () => {
  it('the same photo again reuses the answer: 6.5, no question, not counted twice', async () => {
    const { store, svc, quota, id } = await asking({ pro: true });
    await svc.answerTap(id, 'jeans');
    const r = await svc.start({ mode: 'check', photoId: 'ph1', occasion: 'everyday' });
    expect(r.outcome).toBe('scored');
    expect((await store.fitChecks.get((r as { checkId: string }).checkId))!.score).toBe(6.5);
    expect((await quota.snapshot()).checksUsed).toBe(1);
  });

  it('a re-check read as sweatpants again keeps the answer (6.5, never 5.0) and never asks', async () => {
    const { store, svc, id } = await asking();
    await svc.answerTap(id, 'jeans');
    const r = await svc.start({ mode: 'recheck', photoId: 'ph1', parentCheckId: id });
    expect(r.outcome).toBe('scored');
    const rc = (await store.fitChecks.get((r as { checkId: string }).checkId))!;
    expect([rc.score, rc.details.recheck!.delta, rc.details.tap]).toEqual([6.5, 0, undefined]);
  });

  it('the re-check window opens at the answer', async () => {
    const { store, svc, clock, id } = await asking({ now: '2026-10-22T12:00:00-04:00' });
    // a second check of the day, so the 30-minute window applies (the first-ever check's runs to 4 am)
    await store.fitChecks.patch(id, { isFirstCheck: false });
    clock.advance(20 * 60_000);
    const done = (await svc.answerTap(id, 'jeans'))!;
    expect(recheckDeadline(done, clock)).toBe(done.details.tap!.answeredAt! + 30 * 60_000);
    clock.advance(25 * 60_000);
    expect(isRecheckOpen(done, clock.nowMs(), clock)).toBe(true);
  });

  it('Try again after a failed read asks too', async () => {
    let fault: DemoFault | null = 'ai';
    const env = await setup({ fault: () => fault });
    const r = (await env.svc.start({ mode: 'check', photoId: 'ph1', occasion: 'everyday' })) as { outcome: string; checkId: string };
    expect(r.outcome).toBe('failed');
    fault = null;
    expect((await env.svc.retry(r.checkId)).outcome).toBe('asking');
  });

  it('a newer photo while asking: the old card is set aside ("replaced"), the new one scores, one check counted', async () => {
    const { store, svc, quota, id } = await asking();
    expect((await svc.start({ mode: 'check', photoId: 'nope', occasion: 'everyday' })).outcome).toBe('unknownPhoto');
    expect((await store.fitChecks.get(id))!.status).toBe('asking'); // only after the new photo passes prep
    const r = await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' });
    expect(r.outcome).toBe('scored');
    const old = (await store.fitChecks.get(id))!;
    expect([old.status, old.details.failCode]).toEqual(['failed', 'replaced']);
    expect(await svc.answerTap(id, 'jeans')).toBeNull();
    expect((await quota.snapshot()).checksUsed).toBe(1);
  });

  it('the replaced photo sent again is asked again and counts (it never counted before)', async () => {
    const { store, svc, quota } = await asking({ pro: true });
    await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' });
    const r = (await svc.start({ mode: 'check', photoId: 'ph1', occasion: 'everyday' })) as { outcome: string; checkId: string };
    expect(r.outcome).toBe('asking');
    await svc.answerTap(r.checkId, 'jeans');
    expect((await quota.snapshot()).checksUsed).toBe(2);
    expect((await store.fitChecks.all()).filter((c) => c.status === 'scored')).toHaveLength(2);
  });

  it('asked before 4 am, answered after: counts for the check\'s own day', async () => {
    const { store, svc, clock, quota, id } = await asking({ now: '2026-10-22T03:50:00-04:00' });
    const row = (await store.fitChecks.get(id))!;
    expect(row.dayKey).toBe('2026-10-21');
    clock.set(at('2026-10-22T04:10:00-04:00'));
    await svc.answerTap(id, 'jeans');
    expect((await store.usage.get('2026-10-21'))!.checks).toBe(1);
    expect((await quota.snapshot()).checksUsed).toBe(0);
  });
});

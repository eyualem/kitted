// The fit check end to end on the memory store: the firstRun story, corrections, re-check,
// partial (pick / snap / skip), occasion re-score, cache, timers and failures.
import { US_EASTERN } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import type { KittedStore } from '@/data/store';
import { createFitCheckService, DEFAULT_TIMERS } from '@/features/fitcheck/service';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { demoImagePrep } from '@/services/imagePrep/demo';
import { createQuota, quotaLine } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { demoReadingById } from '@/services/readingSource/demoReadings';
import { realScheduler } from '@/services/scheduler';

const at = (iso: string) => Date.parse(iso);
const STYLES = seed.scenarios.firstRun.onboardingAnswers.styles as unknown as [string, number][];

async function setup(o: { latency?: number; timers?: boolean; now?: string; pro?: boolean; store?: KittedStore } = {}) {
  const store = o.store ?? createMemoryStore();
  const clock = manualClock(at(o.now ?? '2026-10-22T07:42:00-04:00'));
  const source = createMockReadingSource({ latency: () => o.latency ?? 0, scheduler: realScheduler });
  const quota = createQuota({ store, clock, isPro: () => o.pro === true });
  const svc = createFitCheckService({
    store, source, prep: demoImagePrep, quota, clock, scheduler: realScheduler, ids: counterIds(),
    timers: () => ({ ...DEFAULT_TIMERS, enabled: o.timers === true, cacheHitMs: 0 }),
  });
  if (!(await store.profile.get('me'))) {
    await store.profile.put({
      id: 'me', birthYear: 2005, heightCm: 178, build: 'average', fitPreference: 'regular', styles: STYLES, boldness: null, budget: null,
      lastOccasion: 'everyday', consentVersion: '1', consentAt: clock.nowMs(), onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: clock.nowMs(),
    });
  }
  return { store, clock, svc, quota, source };
}

describe('first-run story', () => {
  it('p01b at Date: 8.0 Sharp, the overshirt fix to 9.0, 4 pieces added, check counted', async () => {
    const { store, svc, quota } = await setup();
    const r = await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' });
    expect(r.outcome).toBe('scored');
    const row = (await store.fitChecks.get((r as { checkId: string }).checkId))!;
    expect([row.score, row.isFirstCheck, row.status, row.occasion]).toEqual([8, true, 'scored', 'date']);
    expect(row.fixes.map((f) => [f.copy, f.tag, f.to])).toEqual([['Wear the overshirt, open', "Free · it's already in your hand", 9]]);
    expect(row.explanation).toBe('Clean base. The overshirt in your hand finishes it.');
    expect(row.details.closetSummary!.added).toHaveLength(4);
    expect((await store.closet.all()).map((c) => c.name).sort()).toEqual(['Beige overshirt', 'Tan chinos', 'White leather sneakers', 'White tee']);
    const msgs = (await store.chat.all()).sort((a, b) => a.createdAt - b.createdAt);
    expect(msgs.map((m) => [m.role, m.kind, m.cardType])).toEqual([['user', 'photo', null], ['stylist', 'card', 'fitCheck']]);
    expect((await quota.snapshot()).checksUsed).toBe(1);
    expect(quotaLine(await quota.snapshot())).toBe('stylist.quota.recheck');
    expect(svc.getState().kind).toBe('idle');
  });

  it('S11 Undo / Add back, tapped quickly: every change lands (no lost writes)', async () => {
    const { store, svc } = await setup();
    const r = (await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
    const [a, b, c] = (await store.fitChecks.get(r.checkId))!.details.closetSummary!.added;
    await Promise.all([svc.setItemUndone(r.checkId, a!, true), svc.setItemUndone(r.checkId, b!, true)]);
    const undone = async () => [...(await store.fitChecks.get(r.checkId))!.details.closetSummary!.undone].sort();
    expect(await undone()).toEqual([a, b].sort());
    await Promise.all([svc.setItemUndone(r.checkId, a!, false), svc.setItemUndone(r.checkId, c!, true)]);
    const row = (await store.fitChecks.get(r.checkId))!;
    expect([...row.details.closetSummary!.undone].sort()).toEqual([b, c].sort());
    expect((await store.closet.all()).filter((x) => x.isDeleted).map((x) => x.id).sort()).toEqual([b, c].sort());
    expect(row.score).toBe(8);
  });

  it('correction: chinos straight → slim, "Score stays 8.0", a new reading, the closet item confirmed', async () => {
    const { store, svc } = await setup();
    const { checkId } = (await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
    const before = (await store.fitChecks.get(checkId))!;
    const res = await svc.saveCorrection(checkId, { garmentIndex: 1, field: 'leg_shape', value: 'slim' });
    expect(res).toEqual({ before: 8, after: 8, itemName: 'Tan chinos' });
    const after = (await store.fitChecks.get(checkId))!;
    expect(after.readingId).not.toBe(before.readingId);
    expect((await store.readings.get(before.readingId!))!.reading).toEqual(demoReadingById('p01b'));
    expect((await store.readings.get(after.readingId!))!.source).toBe('corrected');
    expect(after.rawScore).toBe(7.775);
    expect(after.rulesFired).toEqual(['P1_leg_vs_style']);
    const chinos = (await store.closet.all()).find((c) => c.name === 'Tan chinos')!;
    expect([chinos.garment.leg_shape, chinos.confirmedFields]).toEqual(['slim', ['leg_shape']]);
    expect((await store.corrections.all())[0]).toMatchObject({ kind: 'wrongDetail', field: 'leg_shape', oldValue: 'straight', newValue: 'slim', scoreBefore: 8, scoreAfter: 8 });
  });

  it('re-check with p01a: 9.0, +1.0, the overshirt fix done (+0.75); uses the re-check, not a check', async () => {
    const { store, svc, quota } = await setup();
    const { checkId } = (await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
    await svc.postRecheckPrompt(checkId);
    const prompt = (await store.chat.all()).find((m) => m.kind === 'text')!;
    expect(prompt.text).toBe("Overshirt on? Send it. I'll only re-read the layer.");
    const rc = (await svc.start({ mode: 'recheck', photoId: 'p01a', parentCheckId: checkId })) as { checkId: string };
    const row = (await store.fitChecks.get(rc.checkId))!;
    expect([row.score, row.parentId, row.occasion]).toEqual([9, checkId, 'date']);
    expect(row.details.recheck).toEqual({
      parentScore: 8, delta: 1, rawDelta: 0.75, notes: ['changed: outerwear'], doneFixes: [{ copy: 'Wear the overshirt, open', earned: 0.75 }],
      newProblems: [], notSeen: false,
    });
    expect((await store.fitChecks.get(checkId))!.recheckUsed).toBe(true);
    const snap = await quota.snapshot();
    expect([snap.checksUsed, quotaLine(snap)]).toEqual([1, 'stylist.quota.used']);
    expect((await store.chat.all()).filter((m) => m.cardType === 'recheck')).toHaveLength(1);
  });

  it('re-check that sees no change: 8.0 stays, S21; "Tell me" confirms to 9.0', async () => {
    const { store, svc } = await setup();
    const { checkId } = (await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
    const rc = (await svc.start({ mode: 'recheck', photoId: 'p01b', parentCheckId: checkId })) as { checkId: string };
    const row = (await store.fitChecks.get(rc.checkId))!;
    expect([row.score, row.details.recheck!.notSeen]).toEqual([8, true]);
    const confirmed = (await svc.confirmFixes(rc.checkId))!;
    expect([confirmed.score, confirmed.rawScore, confirmed.details.confirmed]).toEqual([9, 8.75, true]);
    expect((await store.readings.get(confirmed.readingId!))!.source).toBe('userConfirmed');
    expect((await store.corrections.all()).map((c) => c.kind)).toEqual(['fixConfirmed']);
  });

  it('occasion change re-scores in code: Interview 6.5 Getting there, no new reading, no quota', async () => {
    const { store, svc, quota } = await setup();
    const { checkId } = (await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
    const readings = (await store.readings.all()).length;
    const next = (await svc.changeOccasion(checkId, 'interview'))!;
    expect([next.score, next.occasion]).toEqual([6.5, 'interview']);
    expect((await svc.changeOccasion(checkId, 'gym'))!.score).toBe(8);
    expect((await store.readings.all()).length).toBe(readings);
    expect((await quota.snapshot()).checksUsed).toBe(1);
    expect(await store.getKv('occasion.last')).toBe('gym');
  });

  it('the same photo again (Pro): the cached reading, same score, no new reading', async () => {
    const { store, svc, quota } = await setup({ pro: true });
    const a = (await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
    const n = (await store.readings.all()).length;
    const b = (await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
    expect((await store.fitChecks.get(b.checkId))!.score).toBe((await store.fitChecks.get(a.checkId))!.score);
    expect((await store.readings.all()).length).toBe(n);
    expect((await quota.snapshot()).checksUsed).toBe(1);
  });

  it('the free check is gone: the second check hits the limit and reads nothing', async () => {
    const { svc } = await setup();
    await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' });
    expect(await svc.start({ mode: 'check', photoId: 's15' })).toEqual({ outcome: 'limit' });
  });
});

describe('partial check (s24, full scenario as of Oct 20 08:09)', () => {
  async function partialSetup() {
    const store = createMemoryStore();
    await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: at('2026-10-20T08:09:00-04:00') });
    const env = await setup({ store, now: '2026-10-20T08:10:00-04:00' });
    const { checkId } = (await env.svc.start({ mode: 'check', photoId: 's24', occasion: 'everyday' })) as { checkId: string };
    return { ...env, checkId };
  }

  it('6.5, shoes not rated, the swap from the closet, "Same shoes as Monday?" with the white sneakers', async () => {
    const { store, checkId } = await partialSetup();
    const row = (await store.fitChecks.get(checkId))!;
    expect([row.score, row.isPartial, row.notRated, row.snapState]).toEqual([6.5, true, ['shoes'], 'pending']);
    expect(row.fixes.map((f) => [f.copy, f.tag, f.to])).toEqual([['Swap to jeans or chino shorts', 'Free · from your closet', 7]]);
    expect(row.details.finish).toEqual({ suggestedItemId: 'S1', weekday: 1 });
  });

  it('pick the white sneakers from the closet → 7.0, full check', async () => {
    const { svc, checkId } = await partialSetup();
    const row = (await svc.pickShoes(checkId, 'S1'))!;
    expect([row.score, row.rawScore, row.isPartial, row.snapState]).toEqual([7, 6.9, false, 'closetPick']);
    expect(row.fixes[0]!.to).toBe(7.5);
  });

  it('a shoe snap → 6.5, full check; it uses no check', async () => {
    const { store, svc, quota, checkId } = await partialSetup();
    const used = (await quota.snapshot()).checksUsed;
    await svc.start({ mode: 'shoeSnap', photoId: 's24', parentCheckId: checkId });
    const row = (await store.fitChecks.get(checkId))!;
    expect([row.score, row.rawScore, row.isPartial, row.snapState]).toEqual([6.5, 6.4, false, 'snapped']);
    expect((await quota.snapshot()).checksUsed).toBe(used);
  });

  it('skip: the finish row goes away for good', async () => {
    const { svc, checkId } = await partialSetup();
    const row = (await svc.skipFinish(checkId))!;
    expect([row.snapState, row.details.finish]).toEqual(['skipped', null]);
  });
});

describe('timers (ruling 19)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('latency 12: slow at 9 s, then scored', async () => {
    const { svc, store } = await setup({ latency: 12, timers: true });
    const p = svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' });
    await jest.advanceTimersByTimeAsync(8_999);
    expect(svc.getState()).toMatchObject({ kind: 'reading', slow: false });
    await jest.advanceTimersByTimeAsync(1);
    expect(svc.getState()).toMatchObject({ kind: 'reading', slow: true });
    await jest.advanceTimersByTimeAsync(4_000);
    const r = (await p) as { outcome: string; checkId: string };
    expect(r.outcome).toBe('scored');
    expect((await store.fitChecks.get(r.checkId))!.score).toBe(8);
  });

  it('latency 20: hedge once at 5 s, failed timeout at 14 s, nothing counted or saved', async () => {
    const { svc, store, quota, source } = await setup({ latency: 20, timers: true });
    const p = svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' });
    await jest.advanceTimersByTimeAsync(5_000);
    expect(source.hedgeCalls).toBe(1);
    await jest.advanceTimersByTimeAsync(9_000);
    const r = (await p) as { outcome: string; checkId: string };
    expect(r.outcome).toBe('failed');
    const row = (await store.fitChecks.get(r.checkId))!;
    expect([row.status, row.details.failCode]).toEqual(['failed', 'timeout']);
    expect((await quota.snapshot()).checksUsed).toBe(0);
    expect(await store.closet.all()).toEqual([]);
    expect(svc.getState().kind).toBe('idle');
    expect(jest.getTimerCount()).toBe(0);
  });
});

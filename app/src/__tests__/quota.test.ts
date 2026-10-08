import { createMemoryStore } from '@/data/memoryStore';
import type { FitCheckRow } from '@/data/types';
import { manualClock } from '@/services/clock';
import { createQuota, isRecheckOpen, quotaLine, recheckDeadline } from '@/services/quota';

const at = (iso: string) => Date.parse(iso);
const check = (over: Partial<FitCheckRow>): FitCheckRow => ({
  id: 'FC', createdAt: at('2026-10-22T07:42:00-04:00'), dayKey: '2026-10-22', photoFile: null, thumbFile: null, demoPhotoId: 'p01b',
  imageHash: '', occasion: 'date', status: 'scored', isPartial: false, notRated: [], score: 8, rawScore: 8, subscores: {}, occasionAdj: 0,
  rulesFired: [], credits: [], advice: [], fixes: [], explanation: null, rubricVersion: '3.1.0', isFavorite: false, snapState: 'none',
  recheckUsed: false, isFirstCheck: false, readingId: null, parentId: null, itemIds: [], details: {}, style: null, ...over,
});

describe('re-check window', () => {
  const clock = manualClock(0);
  it('a normal check: open for 30 minutes, closed at exactly 30', () => {
    const c = check({});
    expect(isRecheckOpen(c, at('2026-10-22T08:11:59-04:00'), clock)).toBe(true);
    expect(isRecheckOpen(c, at('2026-10-22T08:12:00-04:00'), clock)).toBe(false);
  });
  it('the first-ever check: open until 4 am', () => {
    const c = check({ isFirstCheck: true });
    expect(isRecheckOpen(c, at('2026-10-23T03:59:59-04:00'), clock)).toBe(true);
    expect(isRecheckOpen(c, at('2026-10-23T04:00:00-04:00'), clock)).toBe(false);
  });
  it('a first check at 23:00 on Oct 31 closes at 04:00 EST on Nov 1', () => {
    expect(recheckDeadline(check({ isFirstCheck: true, createdAt: at('2026-10-31T23:00:00-04:00') }), clock)).toBe(at('2026-11-01T04:00:00-05:00'));
  });
  it('used, failed and re-check rows are never open', () => {
    const now = at('2026-10-22T07:50:00-04:00');
    expect(isRecheckOpen(check({ recheckUsed: true }), now, clock)).toBe(false);
    expect(isRecheckOpen(check({ status: 'failed' }), now, clock)).toBe(false);
    expect(isRecheckOpen(check({ parentId: 'X' }), now, clock)).toBe(false);
  });
});

describe('quota', () => {
  it('nav subtitle follows the D12 table', async () => {
    const store = createMemoryStore();
    const clock = manualClock(at('2026-10-22T07:40:00-04:00'));
    const q = createQuota({ store, clock, isPro: () => false });
    expect(quotaLine(await q.snapshot())).toBe('stylist.quota.free');
    await store.fitChecks.put(check({}));
    await q.consumeCheck();
    clock.set(at('2026-10-22T07:43:00-04:00'));
    expect(quotaLine(await q.snapshot())).toBe('stylist.quota.recheck');
    expect(await q.canStartCheck()).toBe(false);
    clock.set(at('2026-10-22T08:20:00-04:00'));
    expect(quotaLine(await q.snapshot())).toBe('stylist.quota.used');
    clock.set(at('2026-10-23T04:00:00-04:00'));
    expect(quotaLine(await q.snapshot())).toBe('stylist.quota.free');
  });
  it('Pro has no subtitle and 10 checks', async () => {
    const q = createQuota({ store: createMemoryStore(), clock: manualClock(at('2026-10-22T09:00:00-04:00')), isPro: () => true });
    const s = await q.snapshot();
    expect([quotaLine(s), s.checkLimit, s.questionLimit]).toEqual([null, 10, 50]);
  });
  it('the demo override pre-uses the free check', async () => {
    const q = createQuota({ store: createMemoryStore(), clock: manualClock(at('2026-10-22T21:12:00-04:00')), isPro: () => false, checksUsedOverride: () => 1 });
    expect(await q.canStartCheck()).toBe(false);
  });
});

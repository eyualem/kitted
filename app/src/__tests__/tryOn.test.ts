// Try-ons vs what he wore (#360): checks written before the code. A check followed by another check within the hour,
// the same day, was a try-on; the last of the run is what he wore. The morning card's and Kit's history count only
// what he wore; a check's fixes keep a piece from an earlier try-on that day (labelled "from your earlier check") and
// leave out a piece from an outfit he wore earlier that day. Scores never change. Nothing calls Google.
import { US_EASTERN, type ClosetItem } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import type { KittedStore } from '@/data/store';
import { loadScenario } from '@/data/seedLoader';
import type { ClosetItemRow, FitCheckRow } from '@/data/types';
import { earlierToday, isTryOn, TRY_ON_GAP_MS, wornChecks } from '@/features/fitcheck/tryOn';
import { createFitCheckService, DEFAULT_TIMERS } from '@/features/fitcheck/service';
import { historyFor } from '@/features/morning/service';
import { t } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { demoImagePrep } from '@/services/imagePrep/demo';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { realScheduler } from '@/services/scheduler';

const at = (iso: string) => Date.parse(iso);
const MIN = 60_000;
const CLOSET = seed.scenarios.full.closet as unknown as ClosetItemRow[];

/** A bare check row: only what the try-on rule and the history read. */
const check = (id: string, iso: string, itemIds: string[], dayKey = iso.slice(0, 10)): FitCheckRow =>
  ({ id, dayKey, createdAt: at(iso), status: 'scored', itemIds } as unknown as FitCheckRow);

describe('TO1 · the try-on rule', () => {
  it('a check another check followed within the hour, the same day, was a try-on; the last one was worn', () => {
    const a = check('A', '2026-10-22T08:00:00-04:00', ['T1', 'B1', 'S1']);
    const b = check('B', '2026-10-22T08:25:00-04:00', ['T2', 'B1', 'S1']);
    const c = check('C', '2026-10-22T13:00:00-04:00', ['T4', 'B2', 'S2']);
    const all = [a, b, c];
    expect([isTryOn(a, all), isTryOn(b, all), isTryOn(c, all)]).toEqual([true, false, false]);
    expect(wornChecks(all).map((x) => x.id)).toEqual(['B', 'C']);
  });

  it('an hour is the edge; another day, or a follower with no pieces (a failed photo), doesn\'t make a try-on', () => {
    const a = check('A', '2026-10-22T08:00:00-04:00', ['T1']);
    expect(isTryOn(a, [a, check('B', new Date(at('2026-10-22T08:00:00-04:00') + TRY_ON_GAP_MS).toISOString(), ['T2'], '2026-10-22')])).toBe(true);
    expect(isTryOn(a, [a, check('B', new Date(at('2026-10-22T08:00:00-04:00') + TRY_ON_GAP_MS + MIN).toISOString(), ['T2'], '2026-10-22')])).toBe(false);
    const late = check('L', '2026-10-22T23:50:00-04:00', ['T1']);
    expect(isTryOn(late, [late, check('N', '2026-10-23T00:20:00-04:00', ['T2'], '2026-10-23')])).toBe(false);
    expect(isTryOn(a, [a, check('F', '2026-10-22T08:10:00-04:00', [])])).toBe(false);
  });
});

describe('TO2–TO3 · the card\'s (and Kit\'s) history counts only what he wore', () => {
  const rows = (checks: FitCheckRow[]) => ({ ideas: [], wears: [], checks, closet: CLOSET, itemsOf: () => [] });

  it('TO2 the next day: the top he tried and took off isn\'t "seen"; the one he wore is', () => {
    const tried = check('A', '2026-10-21T08:00:00-04:00', ['T1', 'B1', 'S1']);
    const worn = check('B', '2026-10-21T08:20:00-04:00', ['T4', 'B1', 'S1']);
    const h = historyFor({ id: '2026-10-22|day', slot: 'day' }, rows([tried, worn]), US_EASTERN);
    expect(h.items.get('T4')).toBe(1);
    expect(h.items.has('T1')).toBe(false);
    expect(h.items.get('B1')).toBe(1);
  });

  it('TO3 the evening card the same day: the morning\'s try-on isn\'t seen, what he left in is', () => {
    const tried = check('A', '2026-10-22T08:00:00-04:00', ['T1', 'B1', 'S1']);
    const worn = check('B', '2026-10-22T08:20:00-04:00', ['T4', 'B1', 'S1']);
    const h = historyFor({ id: '2026-10-22|evening', slot: 'evening' }, rows([tried, worn]), US_EASTERN);
    expect(h.items.get('T4')).toBe(0);
    expect(h.items.has('T1')).toBe(false);
  });
});

describe('TO4 · what a check\'s fixes know about earlier checks that day', () => {
  it('tried and worn pieces, worn wins; later checks never change an earlier check\'s answer', () => {
    const worn = check('W', '2026-10-22T07:00:00-04:00', ['T1', 'B1', 'S1']);
    const tried = check('A', '2026-10-22T11:00:00-04:00', ['T2', 'B1', 'S2']);
    const now = check('R', '2026-10-22T11:30:00-04:00', ['T4', 'B2', 'S2']);
    const yesterday = check('Y', '2026-10-21T18:00:00-04:00', ['T3', 'B3', 'S3']);
    const before = earlierToday(now, [worn, tried, now, yesterday]);
    expect([...before.worn].sort()).toEqual(['B1', 'S1', 'T1']);
    expect([...before.tried].sort()).toEqual(['S2', 'T2']); // B1 was worn earlier: worn wins
    const later = check('X', '2026-10-22T11:45:00-04:00', ['T3', 'B3', 'S3']);
    expect(earlierToday(now, [worn, tried, now, yesterday, later])).toEqual(before);
    // The check being scored has no pieces yet (the closet call runs after its card): the same answer.
    const bare = { ...now, itemIds: [] };
    expect(earlierToday(bare, [worn, tried, bare, yesterday])).toEqual(before);
  });
});

describe('TO5 · the card\'s fixes, end to end (s05 at Everyday offers "Swap to your khaki chinos")', () => {
  async function run(earlier: { iso: string; itemIds: string[] } | null) {
    const store: KittedStore = createMemoryStore();
    await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: at('2026-10-20T07:00:00-04:00') });
    const clock = manualClock(at('2026-10-20T09:10:00-04:00'));
    if (earlier) {
      const base = (await store.fitChecks.all()).find((c) => c.status === 'scored')!;
      await store.fitChecks.put({ ...base, id: 'EARLY', parentId: null, dayKey: earlier.iso.slice(0, 10), createdAt: at(earlier.iso), itemIds: earlier.itemIds });
    }
    const source = createMockReadingSource({ latency: () => 0, scheduler: realScheduler });
    const quota = createQuota({ store, clock, isPro: () => true });
    const svc = createFitCheckService({
      store, source, prep: demoImagePrep, quota, clock, scheduler: realScheduler, ids: counterIds(),
      timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }),
    });
    const r = (await svc.start({ mode: 'check', photoId: 's05', occasion: 'everyday' })) as { checkId: string };
    const row = (await store.fitChecks.get(r.checkId))!;
    return { row, chinos: row.fixes.find((f) => f.itemId === 'B1') ?? null, svc, store };
  }

  it('baseline: the khaki chinos fix, "from your closet"', async () => {
    const { chinos } = await run(null);
    expect(chinos?.tag).toMatch(/from your closet/);
  });

  it('chinos tried on 20 minutes earlier: still offered, labelled as from his earlier check', async () => {
    const { row, chinos } = await run({ iso: '2026-10-20T08:50:00-04:00', itemIds: ['T1', 'B1', 'S1'] });
    expect(chinos).not.toBeNull();
    expect(chinos!.tag).toContain(t('fix.tag.earlierCheck').toLowerCase().replace(/^free/, ''));
    expect(chinos!.tag).not.toMatch(/from your closet/);
    const base = await run(null);
    expect(row.score).toBe(base.row.score);
  });

  it('chinos worn earlier today (a check two hours before, nothing after it): not offered, the score unchanged', async () => {
    const { row, chinos } = await run({ iso: '2026-10-20T07:05:00-04:00', itemIds: ['T1', 'B1', 'S1'] });
    expect(chinos).toBeNull();
    expect(row.score).toBe((await run(null)).row.score);
  });

  it('chinos worn yesterday: offered as before', async () => {
    const { chinos } = await run({ iso: '2026-10-19T08:00:00-04:00', itemIds: ['T1', 'B1', 'S1'] });
    expect(chinos?.tag).toMatch(/from your closet/);
  });

  it('an occasion change re-scores with the same rule (the worn chinos stay out)', async () => {
    const { row, svc, store } = await run({ iso: '2026-10-20T07:05:00-04:00', itemIds: ['T1', 'B1', 'S1'] });
    await svc.changeOccasion(row.id, 'class');
    const after = (await store.fitChecks.get(row.id))!;
    expect(after.fixes.some((f) => f.itemId === 'B1')).toBe(false);
  });
});

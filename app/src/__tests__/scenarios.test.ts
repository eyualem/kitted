import { SCREENS } from '@/demo/scenarios';

describe('demo screens', () => {
  it('covers all 20 mockup screens in order, then the undrawn sheets (21–24), the morning card (25–32), Reads as (33), the tap (34–36), the closet (37–38), camera guidance (41+), the shoe question (60–62)', () => {
    const ns = SCREENS.map((s) => s.n);
    expect(ns.slice(0, 38)).toEqual(Array.from({ length: 38 }, (_, i) => i + 1));
    // Parallel sessions number from their own block (camera guidance from 41), so gaps are fine; order and uniqueness aren't.
    expect([...ns].sort((a, b) => a - b)).toEqual(ns);
    expect(new Set(ns).size).toBe(ns.length);
    expect(SCREENS.filter((s) => s.id === 'S5q').map((s) => [s.n, s.scenario])).toEqual([[34, 'firstRun'], [35, 'firstRun'], [36, 'firstRun'], [60, 'firstRun'], [61, 'firstRun'], [62, 'firstRun']]); // 60–62: the shoe question (#120)
    expect(SCREENS.find((s) => s.n === 33)?.name).toBe('Reads as smart casual');
  });

  it('only screens 1–4 run before onboarding', () => {
    expect(SCREENS.filter((s) => !s.onboarded).map((s) => s.n)).toEqual([1, 2, 3, 4]);
  });

  it('matches the 04 §10.3 scenarios', () => {
    const full = SCREENS.filter((s) => s.scenario === 'full').map((s) => s.n);
    expect(full.filter((n) => n <= 24)).toEqual([11, 12, 13, 14, 15, 16, 17, 19, 20, 22]);
    expect(SCREENS.find((s) => s.n === 12)?.freeChecksUsed).toBe(0);
    expect(SCREENS.find((s) => s.n === 19)?.freeChecksUsed).toBe(1);
  });
});

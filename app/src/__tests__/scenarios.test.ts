import { SCREENS } from '@/demo/scenarios';

describe('demo screens', () => {
  it('covers all 20 mockup screens in order, then the undrawn sheets (21–24) and the morning card (25+)', () => {
    expect(SCREENS.map((s) => s.n)).toEqual(Array.from({ length: 33 }, (_, i) => i + 1));
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

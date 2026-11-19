// The founder's own account (the server's tier `founder`): 50 fit checks and 200 questions a day in the app's mirror,
// the beta's wording everywhere (no "Pro", no paywall). Every other tier keeps today's numbers.
import { createMemoryStore } from '@/data/memoryStore';
import { paywallOn } from '@/features/paywall/switch';
import { manualClock } from '@/services/clock';
import { LIMITS, createQuota, limitsFor } from '@/services/quota';
import { parseTier, resetTierForTests, tierNow, tierRecorder } from '@/services/server/tier';

afterEach(() => resetTierForTests());

describe('limitsFor', () => {
  it('founder is 50 checks and 200 questions; the others keep their numbers', () => {
    expect(limitsFor('founder')).toEqual({ checks: 50, questions: 200 });
    expect(limitsFor('beta')).toEqual({ checks: 3, questions: 20 });
    expect(limitsFor('free')).toEqual({ checks: LIMITS.freeChecks, questions: LIMITS.freeQuestions });
    expect(limitsFor('pro')).toEqual({ checks: LIMITS.proChecks, questions: LIMITS.proQuestions });
  });
});

describe('the founder tier in the app', () => {
  const snap = async (server: 'founder' | 'beta', isPro = false) => {
    const clock = manualClock(Date.UTC(2026, 9, 22, 14));
    return createQuota({ store: createMemoryStore(), clock, isPro: () => isPro, serverTier: async () => server }).snapshot();
  };

  it('uses the founder numbers but reads as the beta (not Pro)', async () => {
    const s = await snap('founder');
    expect([s.tier, s.pro, s.checkLimit, s.questionLimit]).toEqual(['beta', false, 50, 200]);
  });

  it('the beta tier is still 3 and 20', async () => {
    const s = await snap('beta');
    expect([s.checkLimit, s.questionLimit]).toEqual([3, 20]);
  });

  it('parses the server header, and the screens see the beta: no paywall', () => {
    expect(parseTier('founder')).toBe('founder');
    tierRecorder({ getKv: async () => null, setKv: async () => {} })('founder');
    expect(tierNow()).toBe('beta');
    expect(paywallOn()).toBe(false);
  });
});

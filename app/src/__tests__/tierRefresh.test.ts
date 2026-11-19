// The stuck limit (the founder, Nov 19): his 3 beta checks were used before the server raised his account to 50, and
// the app, reading only its own count, never sent another request, so it never heard the new tier. At a limit the app
// now asks the server once (a minute apart) and reads the count again.
import { createMemoryStore } from '@/data/memoryStore';
import { manualClock } from '@/services/clock';
import { createQuota, TIER_REFRESH_MS } from '@/services/quota';
import { parseTier, resetTierForTests, SERVER_TIER_KV, serverTier } from '@/services/server/tier';

afterEach(() => resetTierForTests());

async function setup(serverSays: 'founder' | 'beta' | null) {
  const store = createMemoryStore();
  const clock = manualClock(Date.UTC(2026, 10, 19, 14));
  await store.setKv(SERVER_TIER_KV, 'beta');
  let asks = 0;
  const quota = createQuota({
    store, clock, isPro: () => false,
    serverTier: () => serverTier(store),
    refreshTier: async () => {
      asks++;
      if (serverSays) await store.setKv(SERVER_TIER_KV, serverSays);
    },
  });
  const day = (await quota.snapshot()).dayKey;
  await store.usage.put({ dayKey: day, checks: 3, rechecks: 0, questions: 20, items: 0 });
  return { quota, clock, asks: () => asks };
}

describe('at a limit, the app asks the server before saying no', () => {
  it('the stuck limit: 3 of 3 used, the server now says founder, so the 4th check and 21st question go through', async () => {
    const { quota, asks } = await setup('founder');
    expect(await quota.canStartCheck()).toBe(true);
    expect(asks()).toBe(1);
    expect(await quota.canAskQuestion()).toBe(true); // read from the stored tier, no second ask
    expect(asks()).toBe(1);
    expect((await quota.snapshot()).checkLimit).toBe(50);
  });

  it('the server still says beta: the limit holds, and it asks at most once a minute', async () => {
    const { quota, clock, asks } = await setup('beta');
    expect(await quota.canStartCheck()).toBe(false);
    expect(await quota.canStartCheck()).toBe(false);
    expect(await quota.canAskQuestion()).toBe(false);
    expect(asks()).toBe(1);
    clock.advance(TIER_REFRESH_MS);
    expect(await quota.canStartCheck()).toBe(false);
    expect(asks()).toBe(2);
  });

  it('offline (the ask fails): the limit holds', async () => {
    const store = createMemoryStore();
    const quota = createQuota({ store, clock: manualClock(Date.UTC(2026, 10, 19, 14)), isPro: () => false,
      serverTier: () => serverTier(store), refreshTier: async () => { throw new Error('offline'); } });
    await store.setKv(SERVER_TIER_KV, 'beta');
    await store.usage.put({ dayKey: (await quota.snapshot()).dayKey, checks: 3, rechecks: 0, questions: 0, items: 0 });
    expect(await quota.canStartCheck()).toBe(false);
  });

  it('under the limit it never asks', async () => {
    let asks = 0;
    const store = createMemoryStore();
    const quota = createQuota({ store, clock: manualClock(Date.UTC(2026, 10, 19, 14)), isPro: () => false,
      serverTier: () => serverTier(store), refreshTier: async () => { asks++; } });
    expect(await quota.canStartCheck()).toBe(true);
    expect(await quota.canAskQuestion()).toBe(true);
    expect(asks).toBe(0);
  });

  it('the tier header parses founder', () => {
    expect(parseTier('founder')).toBe('founder');
  });
});

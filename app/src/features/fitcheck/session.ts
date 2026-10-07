// The app's one fit-check service, wired to the demo implementations, and the hook the
// Stylist screen uses for the live reading state.
import { useSyncExternalStore } from 'react';
import { store } from '@/data/db';
import { demoEntitlements } from '@/services/entitlements';
import { newId } from '@/services/ids';
import { demoImagePrep } from '@/services/imagePrep/demo';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { realScheduler } from '@/services/scheduler';
import { getDemoArgs, sessionClock } from '@/state/session';
import { createFitCheckService, DEFAULT_TIMERS, type TimerConfig } from './service';
import type { SessionState } from './machine';

export const readingSource = createMockReadingSource({
  latency: () => getDemoArgs().latency,
  fault: () => getDemoArgs().fault,
  scheduler: realScheduler,
});

export const quota = createQuota({
  store,
  clock: sessionClock,
  isPro: () => demoEntitlements.isPro() || getDemoArgs().pro,
  checksUsedOverride: () => getDemoArgs().freeChecksUsed,
});

let timerOverride: Partial<TimerConfig> = {};
/** Demo: screen 6 freezes mid-reading with the timers off. */
export function setTimerOverride(o: Partial<TimerConfig>): void {
  timerOverride = o;
}

export const fitCheck = createFitCheckService({
  store,
  source: readingSource,
  prep: demoImagePrep,
  quota,
  clock: sessionClock,
  scheduler: realScheduler,
  ids: newId,
  timers: () => {
    const lat = getDemoArgs().latency;
    return { ...DEFAULT_TIMERS, cacheHitMs: lat === 0 ? 0 : DEFAULT_TIMERS.cacheHitMs, ...timerOverride };
  },
});

export function useFitCheckSession(): SessionState {
  return useSyncExternalStore(fitCheck.subscribe, fitCheck.getState, fitCheck.getState);
}

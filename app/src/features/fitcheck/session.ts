// The app's one fit-check service, wired to the demo implementations, and the hook the
// Stylist screen uses for the live reading state.
import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { store } from '@/data/db';
import { DEMO_ENABLED } from '@/demo/config';
import { demoEntitlements } from '@/services/entitlements';
import { newId } from '@/services/ids';
import { imagePrep } from '@/services/imagePrep/real';
import { createQuota } from '@/services/quota';
import { LIVE_READING, routedSource } from '@/services/readingSource/live';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { realScheduler } from '@/services/scheduler';
import { discardTempPhoto } from '@/services/tempPhoto';
import { getDemoArgs, sessionClock } from '@/state/session';
import { closetService, startClosetCatchUp } from '@/features/closet/session';
import { mayUpload } from '@/features/privacy/wipe';
import { createHeldCatchUp } from '@/features/held/catchUp';
import { deleteHeldPhoto } from '@/features/held/files';
import { createFitCheckService, DEFAULT_TIMERS, type TimerConfig } from './service';
import type { SessionState } from './machine';

export const readingSource = createMockReadingSource({
  latency: () => getDemoArgs().latency,
  fault: () => getDemoArgs().fault,
  scheduler: realScheduler,
  // A snap of a real photo gets the story's canned reading only on a demo screen (#322).
  cannedSnaps: () => DEMO_ENABLED && getDemoArgs().demoScreen !== null,
});

export const quota = createQuota({
  store,
  clock: sessionClock,
  isPro: () => demoEntitlements.isPro() || getDemoArgs().pro,
  // Testing real readings on the founder's phone: the daily limit doesn't apply (DEV + key only).
  checksUsedOverride: () => getDemoArgs().freeChecksUsed ?? (LIVE_READING ? 0 : null),
});

let timerOverride: Partial<TimerConfig> = {};
/** Demo: screen 6 freezes mid-reading with the timers off. */
export function setTimerOverride(o: Partial<TimerConfig>): void {
  timerOverride = o;
}

export const fitCheck = createFitCheckService({
  store,
  // The same consent rule as the closet call: "Not now" or "Score my fits" off means no photo is ever sent (02 D4, Y7).
  source: routedSource(readingSource, () => mayUpload(store)),
  // …and his own photo isn't even prepped: the check stops before it starts ('noConsent').
  consent: () => mayUpload(store),
  prep: imagePrep,
  quota,
  clock: sessionClock,
  scheduler: realScheduler,
  ids: newId,
  // The one quick tap (02 "S5q", #85): on.
  tap: () => true,
  // The closet call after the score card (#91).
  closet: closetService,
  // "Which one is you?" cancelled or replaced: his temporary photo goes (02 S23).
  discardPhoto: discardTempPhoto,
  // "Don't score it" on a held photo (02 S17h, #280): it was never sent; his copy goes.
  deleteHeldFiles: deleteHeldPhoto,
  timers: () => {
    const lat = getDemoArgs().latency;
    return { ...DEFAULT_TIMERS, cacheHitMs: lat === 0 ? 0 : DEFAULT_TIMERS.cacheHitMs, ...timerOverride };
  },
});

// Not under jest: these run on timers, and a test's stubbed store would be gone by then ("Cannot log after tests").
const UNDER_TEST = typeof process !== 'undefined' && process.env?.JEST_WORKER_ID !== undefined;
if (!UNDER_TEST) startClosetCatchUp();

// A photo held by the Limit card (02 S17h, #280): when he opens Kitted after 4 am, the stylist asks "Ready to score last
// night's photo?" (#281; only his Score it sends it): at launch (after the first render's writes settle) and on every
// return to the foreground. Demo screens skip it (their clock is scripted).
let heldStarted = false;
export function startHeldCatchUp(): void {
  if (heldStarted) return;
  heldStarted = true;
  setTimeout(() => {
    createHeldCatchUp(
      () => (getDemoArgs().demoScreen ? Promise.resolve() : fitCheck.onAppOpen()),
      (cb) => AppState.addEventListener('change', cb),
    );
  }, 3_000);
}
if (!UNDER_TEST) startHeldCatchUp();

export function useFitCheckSession(): SessionState {
  return useSyncExternalStore(fitCheck.subscribe, fitCheck.getState, fitCheck.getState);
}

// Process-wide session values set once at boot: the resolved demo arguments and the clock.
import { DEMO_ENABLED } from '@/demo/config';
import { defaultDemoArgs, type DemoArgs } from '@/demo/demoArgs';
import { demoClock, parseZonedIso, systemClock, type Clock } from '@/services/clock';

let args: DemoArgs = defaultDemoArgs;
let clock: Clock = systemClock;

export function getDemoArgs(): DemoArgs {
  return args;
}

export function setDemoArgs(next: DemoArgs): void {
  args = next;
}

export function getClock(): Clock {
  return clock;
}

/**
 * Demo builds start the clock at `isoNow` (the scenario's `now`, or the `now` argument) and
 * then tick normally; `now=real` and App Store builds use the system clock.
 */
export function startClock(isoNow: string | null): void {
  if (!DEMO_ENABLED || isoNow === null || isoNow === 'real') {
    clock = systemClock;
    return;
  }
  const ms = parseZonedIso(isoNow);
  clock = ms === null ? systemClock : demoClock(ms);
}

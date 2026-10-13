// Runs once before the first screen (the splash stays up until it finishes):
// demo arguments → database + migrations → resetData → gate values → clock.
import { DEMO_ENABLED } from '@/demo/config';
import { queryToRaw, resolveDemoArgs, type DemoArgs } from '@/demo/demoArgs';
import { setDemoState } from '@/demo/demoState';
import { readInitialQuery } from '@/demo/initialQuery';
import { readLaunchArgs } from '@/demo/launchArgs';
import { store } from '@/data/db';
import { clearDeviceId, getAgeBlocked, setAgeBlocked } from '@/data/secure';
import { KV } from '@/data/store';
import { loadScenario } from '@/data/seedLoader';
import { US_EASTERN } from '@kitted/core';
import * as Device from 'expo-device';
import seed from '../../assets/seed.json';
import { failInterruptedChecks } from '@/features/fitcheck/interrupted';
import { getGate, markGateReady } from './appGate';
import { setDemoArgs, startClock } from './session';

/** The scenarios' `now` (seed.json): firstRun 07:38, full 12:20, Thu Oct 22 2026, New York. */
export const SCENARIO_NOW = { firstRun: '2026-10-22T07:38:00', full: '2026-10-22T12:20:00' } as const;

export async function boot(): Promise<DemoArgs> {
  try {
    return await bootSteps();
  } catch (e: unknown) {
    // Never a blank screen: open the gate with what can still be read (safe defaults otherwise), then let the caller
    // log the error. Onboarding is the default, and it asks the birth year again.
    if (!getGate().ready) await openGateAfterError();
    throw e;
  }
}

async function openGateAfterError(): Promise<void> {
  const ageBlocked = await getAgeBlocked().catch(() => false);
  const onboarded = await store.getKv(KV.onboardingDone).then((v) => v === '1', () => false);
  markGateReady({ ageBlocked, onboarded });
}

async function bootSteps(): Promise<DemoArgs> {
  const args = DEMO_ENABLED
    ? resolveDemoArgs({ deepLink: queryToRaw(await readInitialQuery()), launch: readLaunchArgs() })
    : resolveDemoArgs({});
  setDemoArgs(args);
  setDemoState({ theme: args.theme, frame: args.frame });

  await store.init();
  if (__DEV__) console.log('[kitted] schema version', await store.schemaVersion());
  if (DEMO_ENABLED && args.resetData) {
    await store.wipe();
    await clearDeviceId();
    if (args.clearAge) await setAgeBlocked(false);
  }
  if (DEMO_ENABLED && args.skipOnboarding) await store.setKv(KV.onboardingDone, '1');
  if (DEMO_ENABLED && args.seed) await store.setKv(KV.scenario, args.seed === 'full' ? 'full' : 'firstRun');

  const scenario = (await store.getKv(KV.scenario)) === 'full' ? 'full' : 'firstRun';
  // A seed loads only into an empty store or after resetData (05 §5.2). Demo builds only.
  if (DEMO_ENABLED && (await store.getKv(KV.seedLoaded)) === null) {
    await loadScenario(store, seed, { scenario, zone: US_EASTERN });
    await store.setKv(KV.seedLoaded, scenario);
  }
  // On a real iPhone the clock is real time: the scenario's fixed Thursday 7:38 restarted on every
  // launch, so checks taken later sorted above newer ones and the chat read out of order (#94).
  startClock(args.now ?? (Device.isDevice ? 'real' : SCENARIO_NOW[scenario]));
  // A check cut off by the app closing mid-read shows Try again, not an empty slot (no check of this run exists yet).
  await failInterruptedChecks(store).catch((e: unknown) => console.error('[boot] interrupted checks', e));

  markGateReady({
    ageBlocked: await getAgeBlocked(),
    onboarded: (await store.getKv(KV.onboardingDone)) === '1',
  });
  return args;
}

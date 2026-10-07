// Loads screen n's scenario (04 §10.3) and returns where to navigate. Keys in the link
// (theme, now, latency, freeChecksUsed, resetData…) override the scenario's defaults.
import type { Href } from 'expo-router';
import { store } from '@/data/db';
import { KV } from '@/data/store';
import { setOnboarded } from '@/state/appGate';
import { getDemoArgs, setDemoArgs, startClock } from '@/state/session';
import { parseArgs, type RawArgs } from './demoArgs';
import { setDemoState } from './demoState';
import { screenScenario } from './scenarios';

export async function applyDemoScreen(params: RawArgs): Promise<Href | null> {
  const n = Number(params.n);
  const scenario = Number.isInteger(n) ? screenScenario(n) : undefined;
  if (!scenario) return null;

  const { n: _n, ...rest } = params;
  const overrides = parseArgs(rest);
  const args = { ...getDemoArgs(), ...overrides, demoScreen: n };
  if (args.freeChecksUsed === null && scenario.freeChecksUsed !== undefined) args.freeChecksUsed = scenario.freeChecksUsed;
  setDemoArgs(args);

  if (overrides.resetData) await store.wipe();
  await store.setKv(KV.scenario, scenario.scenario);
  await setOnboarded(scenario.onboarded);
  startClock(overrides.now ?? scenario.now);
  setDemoState({
    screen: n,
    ...(overrides.theme !== undefined ? { theme: overrides.theme } : {}),
    ...(overrides.frame !== undefined ? { frame: overrides.frame } : {}),
  });

  // Let the root layout re-render with the new gate before navigating into a guarded route.
  await new Promise((resolve) => setTimeout(resolve, 0));
  return scenario.href as Href;
}

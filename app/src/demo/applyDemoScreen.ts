// Loads screen n's scenario (04 §10.3) and returns where to navigate. Keys in the link
// (theme, now, latency, freeChecksUsed, resetData…) override the scenario's defaults.
import type { Href } from 'expo-router';
import { setOnboarded } from '@/state/appGate';
import { getDemoArgs, sessionClock, setDemoArgs } from '@/state/session';
import { demoLinkIds, prepareDemoScreen } from './prepareDemoScreen';
import { parseArgs, type RawArgs } from './demoArgs';
import { setDemoState } from './demoState';
import { screenScenario, type ScreenScenario } from './scenarios';
import { prepareAccountDemo } from '@/features/account/demo';
import { prepareOutfitsDemo } from '@/features/closet/outfitsSwitch';
import { prepareAboutYouDemo } from '@/features/aboutYou/demo';
import { pauseFinishDemo, prepareFinishDemo } from '@/features/finish/demo';
import { store } from '@/data/db';
import { setDemoTier } from '@/services/server/tier';

export interface DemoTarget {
  href: Href;
  under?: Href;
  toast?: ScreenScenario['toast'];
}

/** One set-up at a time: the route's effect can start a second run while the first is still playing its story
 *  (a re-render, React's dev double effect), and two interleaved runs wiped each other's later steps (#291). */
let queue: Promise<unknown> = Promise.resolve();

export function applyDemoScreen(params: RawArgs): Promise<DemoTarget | null> {
  const run = queue.then(() => applyDemoScreenNow(params));
  queue = run.catch(() => undefined);
  return run;
}

async function applyDemoScreenNow(params: RawArgs): Promise<DemoTarget | null> {
  const n = Number(params.n);
  const scenario = Number.isInteger(n) ? screenScenario(n) : undefined;
  if (!scenario) {
    setDemoTier(null);
    return null;
  }

  const { n: _n, ...rest } = params;
  const overrides = parseArgs(rest);
  const args = { ...getDemoArgs(), ...overrides, demoScreen: n };
  if (scenario.tier === 'beta') {
    // A beta screen counts real checks (its freeChecksUsed is written as today's count by the story): only the link's
    // own freeChecksUsed pins it, never the last screen's.
    if (overrides.freeChecksUsed === undefined) args.freeChecksUsed = null;
  } else if (args.freeChecksUsed === null && scenario.freeChecksUsed !== undefined) args.freeChecksUsed = scenario.freeChecksUsed;
  // Each screen's own sample weather unless this link names one (not the previous screen's).
  args.weather = overrides.weather ?? scenario.weather ?? null;
  setDemoArgs(args);
  // The screen's rules (FP7, T14): free unless it says beta, set before its story runs.
  setDemoTier(scenario.tier ?? 'free');

  pauseFinishDemo();
  await prepareDemoScreen(scenario);
  // Starter basics by look (#364): the screen's own picks in place of the scenario's.
  if (scenario.looks) {
    const p = await store.profile.get('me');
    if (p) await store.profile.put({ ...p, styles: scenario.looks });
  }
  await setOnboarded(scenario.onboarded);
  // Account screens (#289): on with their scripted sign-in, off everywhere else.
  await prepareAccountDemo(store, scenario, sessionClock.nowMs());
  // Outfits (specs/closet-beta.md CB1): on for the screens that show them, off everywhere else, as on his phone.
  prepareOutfitsDemo(scenario);
  // The end of onboarding's screens (#291): on with their scripted store and answers, off everywhere else.
  await prepareFinishDemo(store, scenario, sessionClock.nowMs());
  // Kit's "About you" card (#373): posted in its state on screens 240–244.
  await prepareAboutYouDemo(store, scenario, sessionClock.nowMs());
  setDemoState({
    screen: n,
    ...(overrides.theme !== undefined ? { theme: overrides.theme } : {}),
    ...(overrides.frame !== undefined ? { frame: overrides.frame } : {}),
  });

  // Let the root layout re-render with the new gate before navigating into a guarded route.
  await new Promise((resolve) => setTimeout(resolve, 0));
  // Ids the story made ("{dup}", #280) filled into the link.
  const fill = (h: string) => h.replace(/\{(\w+)\}/g, (m, k: string) => demoLinkIds[k] ?? m);
  return {
    href: fill(scenario.href) as Href,
    ...(scenario.under ? { under: fill(scenario.under) as Href } : {}),
    ...(scenario.toast ? { toast: scenario.toast } : {}),
  };
}

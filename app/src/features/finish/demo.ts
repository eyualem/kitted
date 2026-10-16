// Demo screens 150–162 (10-onboarding.md §9): turn the end of onboarding on for its own screens (every other demo screen
// leaves it off, so their stories don't change), script the store and the notification answer, and play its taps
// through the same code the app runs.
import type { KittedStore } from '@/data/store';
import type { ScreenScenario } from '@/demo/scenarios';
import { STORY_FIRST_CHECK } from '@/demo/scenarios';
import { setDemoNotify, setDemoPaywall } from '@/features/paywall/switch';
import { demoEntitlements } from '@/services/entitlements';
import { newId } from '@/services/ids';
import type { StoreScript } from '@/services/purchases';
import { finish, setDemoFinish } from './session';
import { STARTER } from './starter';
import { toggleStarter } from './starterActions';

export type FinishDemoStep = 'later' | 'paywallShown' | 'notifyYes' | 'notifyAllow' | 'notifyNo' | { mark: string };

export interface FinishDemo {
  /** The mock store's outcome (turns the paywall on); omitted = the paywall step is skipped, as on his phone. */
  paywall?: StoreScript;
  /** The scripted permission answer (turns the ask on); omitted = no ask, as on his phone. */
  notify?: 'allow' | 'deny';
  /** Start as Pro (the paywall's "You're Pro." state). */
  pro?: boolean;
  steps?: FinishDemoStep[];
}

/** Before a screen's story runs: nothing of this sequence may write into the fresh store. */
export function pauseFinishDemo(): void {
  setDemoFinish(false);
}

export async function prepareFinishDemo(store: KittedStore, sc: ScreenScenario, nowMs: number): Promise<void> {
  const f = sc.finish;
  setDemoPaywall(f?.paywall ?? null);
  setDemoNotify(f?.notify ?? null);
  demoEntitlements.setPro(f?.pro === true);
  setDemoFinish(!!f);
  // The visit started before the story's check (on his phone, the launch comes before the photo).
  finish.reset(0);
  if (!f) return;
  for (const step of f.steps ?? []) {
    if (step === 'later') await finish.later(STORY_FIRST_CHECK);
    // The screen's link opens the paywall: as if the sequence had, so it doesn't open a second.
    else if (step === 'paywallShown') await finish.paywallOpenedByLink();
    else if (typeof step === 'object') {
      const e = STARTER.find((x) => x.id === step.mark);
      if (e) await toggleStarter(store, e, newId, nowMs);
    } else {
      const ask = (await store.chat.all()).find((m) => m.payload.question === 'notify');
      if (!ask) continue;
      if (step === 'notifyNo') await finish.notifyNo(ask.id);
      else {
        await finish.notifyYes(ask.id);
        if (step === 'notifyAllow') await finish.notifySet(ask.id);
      }
    }
  }
  await finish.ensure();
}

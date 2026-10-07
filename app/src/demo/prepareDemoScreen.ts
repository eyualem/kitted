// Puts the app in screen n's state (04 §10.3) by running the REAL code at latency 0:
// wipe → load the scenario (as of the screen's time) → play the story through the fit-check
// service → set the clock. So /demo/screen/7 shows what the code really produces.
import { US_EASTERN, type Styles } from '@kitted/core';
import seed from '../../assets/seed.json';
import { store } from '@/data/db';
import { KV } from '@/data/store';
import { loadScenario } from '@/data/seedLoader';
import { fitCheck, readingSource, setTimerOverride } from '@/features/fitcheck/session';
import { completeOnboarding } from '@/features/onboarding/complete';
import { newId } from '@/services/ids';
import { parseZonedIso } from '@/services/clock';
import { getDemoArgs, setDemoArgs, startClock } from '@/state/session';
import { STORY_FIRST_CHECK, STORY_PARTIAL, STORY_RECHECK, type ScreenScenario } from './scenarios';

const at = (iso: string) => parseZonedIso(iso) ?? 0;

/** Story steps per screen (firstRun story; screen 11 runs s24 live inside `full`). */
type Step =
  | { at: string; do: 'check'; photoId: string; occasion: 'date' | 'everyday'; hold?: number }
  | { at: string; do: 'recheckPrompt' }
  | { at: string; do: 'recheck'; photoId: string };

const STORY: Record<number, { asOf?: string; steps: Step[] }> = {
  5: { steps: [] },
  6: { steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date', hold: 0.7 }] },
  7: { steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date' }] },
  8: { steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date' }] },
  9: { steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date' }] },
  // The optional correction is skipped: it would make the re-check 8.5 (PLAN.md decision 1).
  10: {
    steps: [
      { at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date' },
      { at: '2026-10-22T07:49:00', do: 'recheckPrompt' },
      { at: '2026-10-22T07:50:00', do: 'recheck', photoId: 'p01a' },
    ],
  },
  11: { asOf: '2026-10-20T08:09:00', steps: [{ at: '2026-10-20T08:10:00', do: 'check', photoId: 's24', occasion: 'everyday' }] },
  21: { steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date' }] },
  22: { asOf: '2026-10-20T08:09:00', steps: [{ at: '2026-10-20T08:10:00', do: 'check', photoId: 's24', occasion: 'everyday' }] },
  23: {
    steps: [
      { at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date' },
      { at: '2026-10-22T07:49:00', do: 'recheckPrompt' },
      { at: '2026-10-22T07:50:00', do: 'recheck', photoId: 'p01a' },
    ],
  },
  24: { steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date' }] },
  12: { asOf: '2026-10-22T08:01:00', steps: [] },
  13: { asOf: '2026-10-22T08:05:00', steps: [] },
  18: {
    steps: [
      { at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date' },
      { at: '2026-10-22T07:49:00', do: 'recheckPrompt' },
      { at: '2026-10-22T07:50:00', do: 'recheck', photoId: 'p01a' },
    ],
  },
  19: { asOf: '2026-10-22T21:12:00', steps: [] },
};

export async function prepareDemoScreen(sc: ScreenScenario): Promise<void> {
  await fitCheck.cancel();
  readingSource.holdAt = null;
  setTimerOverride({});
  await store.wipe();
  const story = STORY[sc.n] ?? { steps: [] };
  const args = getDemoArgs();
  setDemoArgs({ ...args, latency: 0 });

  if (sc.scenario === 'full') {
    await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: at(story.asOf ?? sc.now) });
  } else if (sc.onboarded) {
    const a = seed.scenarios.firstRun.onboardingAnswers;
    await completeOnboarding(
      store,
      { styles: a.styles as unknown as Styles, heightCm: a.heightCm, build: a.build, fitPreference: a.fitPreference, birthYear: a.birthYear },
      at('2026-10-22T07:40:00'),
      newId,
    );
  }
  await store.setKv(KV.scenario, sc.scenario);
  await store.setKv(KV.seedLoaded, sc.scenario);

  for (const step of story.steps) {
    startClock(step.at);
    if (step.do === 'recheckPrompt') {
      await fitCheck.postRecheckPrompt(STORY_FIRST_CHECK);
    } else if (step.do === 'recheck') {
      await fitCheck.start({ mode: 'recheck', photoId: step.photoId, parentCheckId: STORY_FIRST_CHECK, checkId: STORY_RECHECK });
    } else if (step.hold !== undefined) {
      // Screen 6: freeze mid-reading with the timers off (headless Chrome's virtual time would fire them).
      readingSource.holdAt = step.hold;
      setTimerOverride({ enabled: false });
      void fitCheck.start({ mode: 'check', photoId: step.photoId, occasion: 'everyday', checkId: STORY_FIRST_CHECK });
      await new Promise((r) => setTimeout(r, 30));
      fitCheck.selectOccasion(step.occasion);
    } else {
      await fitCheck.start({ mode: 'check', photoId: step.photoId, occasion: step.occasion, checkId: sc.scenario === 'firstRun' ? STORY_FIRST_CHECK : STORY_PARTIAL });
    }
  }
  setDemoArgs({ ...getDemoArgs(), latency: args.latency });
  startClock(getDemoArgs().now ?? sc.now);
}

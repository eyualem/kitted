// Puts the app in screen n's state (04 §10.3) by running the REAL code at latency 0:
// wipe → load the scenario (as of the screen's time) → play the story through the fit-check
// service → set the clock. So /demo/screen/7 shows what the code really produces.
import { US_EASTERN, type Styles } from '@kitted/core';
import seed from '../../assets/seed.json';
import { store } from '@/data/db';
import { KV } from '@/data/store';
import { loadScenario } from '@/data/seedLoader';
import { fitCheck, readingSource, setTimerOverride } from '@/features/fitcheck/session';
import { morning } from '@/features/morning';
import { createMemoryStore } from '@/data/memoryStore';
import type { OccasionKey, StyleKey } from '@/data/types';
import { WEATHER_PERMISSION_KV } from '@/services/weather';
import { completeOnboarding } from '@/features/onboarding/complete';
import { newId } from '@/services/ids';
import { parseZonedIso } from '@/services/clock';
import { getDemoArgs, setDemoArgs, startClock } from '@/state/session';
import { STORY_FIRST_CHECK, STORY_PARTIAL, STORY_RECHECK, STORY_SHOES, STORY_TAP, type ScreenScenario } from './scenarios';

const at = (iso: string) => parseZonedIso(iso) ?? 0;

/** Story steps per screen (firstRun story; screen 11 runs s24 live inside `full`). */
type Step =
  | { at: string; do: 'check'; photoId: string; occasion: OccasionKey; hold?: number; checkId?: string; style?: StyleKey }
  | { at: string; do: 'morning' }
  | { at: string; do: 'wear' }
  | { at: string; do: 'closet'; ids: string[] }
  | { at: string; do: 'recheckPrompt' }
  | { at: string; do: 'recheck'; photoId: string }
  | { at: string; do: 'tap'; answer: 'jeans' | 'work_boot' | 'skip'; checkId?: string };

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
  // The re-check that doesn't see the change (the same photo again): S21's case.
  23: {
    steps: [
      { at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date' },
      { at: '2026-10-22T07:49:00', do: 'recheckPrompt' },
      { at: '2026-10-22T07:50:00', do: 'recheck', photoId: 'p01b' },
    ],
  },
  24: { steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date' }] },
  13: { asOf: '2026-10-22T08:05:00', steps: [] },
  18: {
    steps: [
      { at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date' },
      { at: '2026-10-22T07:49:00', do: 'recheckPrompt' },
      { at: '2026-10-22T07:50:00', do: 'recheck', photoId: 'p01a' },
    ],
  },
  19: { asOf: '2026-10-22T21:12:00', steps: [] },
  // Morning/evening card: posted by the real service at the screen's time.
  12: { asOf: '2026-10-22T08:01:00', steps: [{ at: '2026-10-22T08:01:00', do: 'morning' }] },
  25: { asOf: '2026-10-22T07:39:00', steps: [{ at: '2026-10-22T07:40:00', do: 'morning' }] },
  26: { steps: [{ at: '2026-10-22T07:39:00', do: 'closet', ids: ['T2', 'B1'] }, { at: '2026-10-22T07:40:00', do: 'morning' }] },
  27: { steps: [{ at: '2026-10-22T07:40:00', do: 'morning' }] },
  28: { asOf: '2026-10-22T07:39:00', steps: [{ at: '2026-10-22T07:40:00', do: 'morning' }, { at: '2026-10-22T07:41:00', do: 'wear' }] },
  29: {
    asOf: '2026-10-22T07:39:00',
    steps: [{ at: '2026-10-22T07:40:00', do: 'morning' }, { at: '2026-10-22T07:45:00', do: 'check', photoId: 'p01b', occasion: 'class', checkId: STORY_PARTIAL }],
  },
  30: { asOf: '2026-10-22T18:29:00', steps: [{ at: '2026-10-22T18:30:00', do: 'morning' }] },
  31: { asOf: '2026-10-22T07:39:00', steps: [{ at: '2026-10-22T07:40:00', do: 'morning' }] },
  32: { asOf: '2026-10-22T07:39:00', steps: [{ at: '2026-10-22T07:40:00', do: 'morning' }] },
  // "Reads as" (02 "S6s", #85): s15 picked as streetwear still reads as smart casual (a pick never changes the score).
  33: { steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 's15', occasion: 'everyday', style: 'streetwear' }] },
  // The one quick tap (#85): ph1 asks "Jeans or sweatpants?"; Jeans → 6.5, reads as streetwear; Skip → 6.5 + the skip line.
  34: { steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 'ph1', occasion: 'everyday', checkId: STORY_TAP }] },
  35: { steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 'ph1', occasion: 'everyday', checkId: STORY_TAP }, { at: '2026-10-22T07:42:30', do: 'tap', answer: 'jeans' }] },
  36: { steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 'ph1', occasion: 'everyday', checkId: STORY_TAP }, { at: '2026-10-22T07:42:30', do: 'tap', answer: 'skip' }] },
  // The shoe question (#120): ph8 asks "Boots, sneakers or slides?"; Boots → 8.5 (work boots); Skip keeps slides 7.5.
  60: { steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 'ph8', occasion: 'class', checkId: STORY_SHOES }] },
  61: { steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 'ph8', occasion: 'class', checkId: STORY_SHOES }, { at: '2026-10-22T07:42:30', do: 'tap', answer: 'work_boot', checkId: STORY_SHOES }] },
  62: { steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 'ph8', occasion: 'class', checkId: STORY_SHOES }, { at: '2026-10-22T07:42:30', do: 'tap', answer: 'skip', checkId: STORY_SHOES }] },
  // Closet accuracy (#91): the closet call's answer for p01b against seed pieces; B1 (khaki) vs tan chinos is asked.
  37: { steps: [{ at: '2026-10-22T07:30:00', do: 'closet', ids: ['T1', 'B1', 'S1'] }, { at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date' }] },
  38: { asOf: '2026-10-22T07:41:00', steps: [{ at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'date' }] },
};

export async function prepareDemoScreen(sc: ScreenScenario): Promise<void> {
  await fitCheck.cancel();
  await fitCheck.closet.settle();
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
  if (sc.weather && sc.weatherAllowed) await store.setKv(WEATHER_PERMISSION_KV, 'granted');

  for (const step of story.steps) {
    startClock(step.at);
    if (step.do === 'morning') {
      await morning.ensureCard();
      continue;
    }
    if (step.do === 'wear') {
      const idea = (await store.dailyIdeas.all()).sort((a, b) => b.createdAt - a.createdAt)[0];
      if (idea) await morning.wear(idea.id);
      continue;
    }
    if (step.do === 'closet') {
      const full = seed.scenarios.full.closet as unknown as { id: string }[];
      const sub = { ...seed, scenarios: { ...seed.scenarios, full: { ...seed.scenarios.full, closet: full.filter((c) => step.ids.includes(c.id)) } } };
      const tmp = createMemoryStore();
      await loadScenario(tmp, sub, { scenario: 'full', zone: US_EASTERN });
      for (const c of await tmp.closet.all()) if (step.ids.includes(c.id)) await store.closet.put(c);
      for (const o of await tmp.closetObs.all()) if (step.ids.includes(o.itemId)) await store.closetObs.put(o);
      continue;
    }
    if (step.do === 'tap') {
      await fitCheck.answerTap(step.checkId ?? STORY_TAP, step.answer);
      continue;
    }
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
      await fitCheck.start({
        mode: 'check', photoId: step.photoId, occasion: step.occasion, checkId: step.checkId ?? (sc.scenario === 'firstRun' ? STORY_FIRST_CHECK : STORY_PARTIAL),
        ...(step.style ? { style: step.style } : {}),
      });
    }
  }
  // The closet call lands after the score card: wait for it so the screen shows the written closet.
  await fitCheck.closet.settle();
  setDemoArgs({ ...getDemoArgs(), latency: args.latency });
  startClock(getDemoArgs().now ?? sc.now);
}

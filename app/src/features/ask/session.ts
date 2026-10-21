// The app's one ask service (07), wired like the fit check's: the real store, the session clock, the same quota.
// Answers: demo builds showing seeded data (a demo screen, or the full scenario) get the seeded answers (02 S25);
// the real model once CHAT_LIVE is on (liveSource.ts); everything else, his phone included, keeps "coming soon".
// Every answer goes through the same prepare (pack, route, evidence) and the same sentence gate.
import { AccessibilityInfo } from 'react-native';
import { router } from 'expo-router';
import seed from '../../../assets/seed.json';
import { paywallOn } from '@/features/paywall/switch';
import { store } from '@/data/db';
import { KV } from '@/data/store';
import { DEMO_ENABLED } from '@/demo/config';
import { quota } from '@/features/fitcheck/session';
import { mayAsk } from '@/features/privacy/wipe';
import { newId } from '@/services/ids';
import { connectivity } from '@/services/connectivity';
import { realScheduler } from '@/services/scheduler';
import { showToast } from '@/features/toast/toast';
import { getDemoArgs, sessionClock } from '@/state/session';
import { liveAnswerSource } from './liveSource';
import { t } from '@/i18n/en';
import { createAsk, keepsDraft } from './pipeline';
import { createPrepare } from './prepare';
import { comingSoonSource, createDemoSource, seededAnswers, type AnswerSource } from './source';

const demoSource = createDemoSource({
  answers: seededAnswers(seed as unknown as { scenarios: Record<string, unknown> }),
  scheduler: realScheduler,
  timed: () => getDemoArgs().latency !== 0,
});

const realSource = liveAnswerSource();

/** Queued, so iOS doesn't drop it while VoiceOver is still reading (07 §17, U14). */
function announce(text: string): void {
  if (AccessibilityInfo.announceForAccessibilityWithOptions) AccessibilityInfo.announceForAccessibilityWithOptions(text, { queue: true });
  else AccessibilityInfo.announceForAccessibility?.(text);
}

async function pickSource(): Promise<AnswerSource> {
  if (getDemoArgs().demoScreen !== null && DEMO_ENABLED) return demoSource;
  if (realSource) return realSource;
  if (!DEMO_ENABLED) return comingSoonSource;
  if (getDemoArgs().demoScreen !== null) return demoSource;
  return (await store.getKv(KV.seedLoaded)) === 'full' ? demoSource : comingSoonSource;
}

export const askService = createAsk({
  store,
  quota,
  clock: sessionClock,
  ids: newId,
  source: pickSource,
  prepare: createPrepare({ store, clock: sessionClock, ids: newId, log: (l) => { if (__DEV__) console.log(`[ask] ${l}`); } }),
  scheduler: realScheduler,
  // Questions need the agreement that names OpenAI (#329); photos keep their own check (privacy/wipe mayUpload).
  consent: () => mayAsk(store),
  // The agreement as a sheet; agreeing just closes it, and his words are still in the composer.
  openConsent: () => router.push('/sheets/consent?from=ask'),
  tryPro: () => paywallOn(),
  // The phone's connection (09 §20.8 G18): send waits while offline; a failed call checks before saying so.
  online: () => connectivity.isOnline(),
  confirmOffline: () => connectivity.reportOffline(),
  reportOnline: () => connectivity.reportOnline(),
  log: (e) => {
    if (__DEV__) console.log(`[ask] ${e}`);
  },
  onAnswered: (text) => announce(text),
  onPosted: (text) => announce(text),
});

/** The composer's send: true when the question made it into the thread (its draft can go). */
export async function sendQuestion(text: string): Promise<boolean> {
  const o = await askService.ask(text).catch((e: unknown) => {
    console.error('[ask] threw', e);
    return { kind: 'busy' as const };
  });
  // Send is disabled while offline; one that slips through says so and keeps his words (G18.3).
  if (o.kind === 'offline') showToast(t('banner.offline'));
  return !keepsDraft(o);
}

export function retryQuestion(failedId: string): void {
  void askService.retry(failedId).then((o) => {
    // Still offline (G18): Retry says so instead of doing nothing.
    if (o?.kind === 'offline') showToast(t('banner.offline'));
  }).catch((e: unknown) => console.error('[ask] retry threw', e));
}

/** An ask card's answer (R6): his tap, sent as his reply, never counted. */
export function tapAnswer(cardMessageId: string, option: string): void {
  void askService.tap(cardMessageId, option).catch((e: unknown) => console.error('[ask] tap threw', e));
}

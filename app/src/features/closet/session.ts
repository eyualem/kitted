// The app's one closet service: the closet call routed like the scoring read (bundled demo photos → the bundled
// answers; a real photo → Gemini in a DEV build with the key and his consent), and the one-time catch-up on the
// next foreground for checks written from the v3 fields (offline / failed / slow).
import { AppState } from 'react-native';
import { store } from '@/data/db';
import { newId } from '@/services/ids';
import { realScheduler } from '@/services/scheduler';
import { routedClosetSource } from '@/services/closetSource/live';
import { createMockClosetSource } from '@/services/closetSource/mock';
import { getDemoArgs, sessionClock } from '@/state/session';
import { createClosetService } from './service';

/** The same "Send to Google" gate as everywhere: onboarded without consent = nothing is sent. */
async function consentOn(): Promise<boolean> {
  const p = await store.profile.get('me');
  return !(p && p.onboardingDone && !p.consentVersion);
}

export const closetSource = createMockClosetSource({ latency: () => getDemoArgs().latency, scheduler: realScheduler });

export const closetService = createClosetService({
  store,
  clock: sessionClock,
  scheduler: realScheduler,
  ids: newId,
  source: routedClosetSource(closetSource, consentOn),
});

let started = false;
/** Catch-up once at launch and on every return to the foreground (each check is tried once per launch). */
export function startClosetCatchUp(): void {
  if (started) return;
  started = true;
  const run = () => void closetService.catchUp().catch((e: unknown) => console.log('[closet] catch-up failed', String(e)));
  setTimeout(run, 3_000);
  AppState.addEventListener('change', (s) => {
    if (s === 'active') run();
  });
}

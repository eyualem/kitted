// The app's one closet service: the closet call routed like the scoring read (bundled demo photos → the bundled
// answers; a real photo → Gemini in a DEV build with the key and his consent), and the one-time catch-up on the
// next foreground for checks written from the v3 fields (offline / failed / slow).
import { AppState } from 'react-native';
import { store } from '@/data/db';
import { newId } from '@/services/ids';
import { realScheduler } from '@/services/scheduler';
import { routedClosetSource } from '@/services/closetSource/live';
import { createMockClosetSource } from '@/services/closetSource/mock';
import { liveMeasurer } from '@/services/measure/garments';
import { getDemoArgs, sessionClock } from '@/state/session';
import { mayUpload } from '@/features/privacy/wipe';
import { createClosetService } from './service';

/** The same "Score my fits" gate as everywhere (Y7): no consent on the profile = nothing is sent. */
const consentOn = () => mayUpload(store);

export const closetSource = createMockClosetSource({ latency: () => getDemoArgs().latency, scheduler: realScheduler });

export const closetService = createClosetService({
  store,
  clock: sessionClock,
  scheduler: realScheduler,
  ids: newId,
  source: routedClosetSource(closetSource, consentOn),
  measure: liveMeasurer,
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

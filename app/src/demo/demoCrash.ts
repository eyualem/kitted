// -demoCrash 1 (demo builds only, 09-ui-review §23 E5, #353): a screen that keeps throwing while it draws until the crash
// screen's Try again, so the crash screen can be seen (React retries a failed render once, so throwing once recovers).
import { DEMO_ENABLED } from './config';
import { getDemoArgs } from '@/state/session';

let disarmed = false;

/** Throws while -demoCrash is on and Try again hasn't been pressed. */
export function demoCrashCheck(): void {
  if (DEMO_ENABLED && !disarmed && getDemoArgs().crash) throw new Error('Demo crash (-demoCrash 1)');
}

/** The crash screen's Try again: the demo crash stops. Nothing outside the demo. */
export function disarmDemoCrash(): void {
  disarmed = true;
}

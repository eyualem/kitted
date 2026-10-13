// At launch, before any check of this run: a check still 'scoring' was cut off by the app closing mid-read.
// Kept apart from service.ts so boot can import it without the whole fit-check stack.
import type { KittedStore } from '@/data/store';
import { patchCheckKeepCloset } from '@/features/closet/checkWrites';

/** At launch: a check still 'scoring' was cut off by the app closing mid-read (nothing was counted). It becomes a
 *  failed check, so its card shows "I couldn't score this one" with Try again instead of nothing. Run at boot, before
 *  any check of this run can start. */
export async function failInterruptedChecks(store: KittedStore): Promise<number> {
  let n = 0;
  for (const c of await store.fitChecks.all()) {
    if (c.status !== 'scoring') continue;
    await patchCheckKeepCloset(store, c.id, { status: 'failed', details: { ...c.details, failCode: 'ai' } });
    n += 1;
  }
  return n;
}

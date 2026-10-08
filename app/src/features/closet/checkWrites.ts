// One queue for every write that touches a check's closet part (fit_checks.details.closetSummary + itemIds) and
// the closet tables. The closet call lands seconds after the score card, while he may be tapping Undo or fixing a
// detail; without the queue a fit-check patch built from an older copy of the row would put back a stale summary.
import type { KittedStore } from '@/data/store';
import type { FitCheckRow } from '@/data/types';

let queue: Promise<unknown> = Promise.resolve();

/** Runs `fn` after every earlier queued write (never call serial() from inside a queued fn: it would wait forever). */
export function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn);
  queue = run.catch(() => null);
  return run;
}

/**
 * A fit-check patch that never overwrites the closet's part of the row: closetSummary and itemIds always come
 * from the stored row (the closet service owns them). Everything else in the patch lands as given.
 */
export function patchCheckKeepCloset(store: KittedStore, id: string, patch: Partial<FitCheckRow>): Promise<FitCheckRow | null> {
  return serial(async () => {
    const cur = await store.fitChecks.get(id);
    if (!cur) return null;
    const { itemIds: _ignored, ...rest } = patch;
    void _ignored;
    const next: Partial<FitCheckRow> = { ...rest };
    if (rest.details) {
      const details = { ...rest.details };
      if (cur.details.closetSummary !== undefined) details.closetSummary = cur.details.closetSummary;
      else delete details.closetSummary;
      next.details = details;
    }
    return store.fitChecks.patch(id, next);
  });
}

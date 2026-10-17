// The answer log (09-ui-review §19, #319; a judge's fix from the bagginess debate): every answer he gives about a
// piece's Fit or Leg, next to what his photos of it read, kept on this phone only. It's what the paper test (§18 BG7)
// and the drift check read: do answers lean toward the one that scores better? Never sent, never synced.
import type { KittedStore } from '@/data/store';
import type { ClosetObservationRow } from '@/data/types';
import { checkReads, type DoubtField } from './fitDoubt';

export const FIT_LOG_KEY = 'closet.fitAnswers';
/** The newest entries kept. */
export const FIT_LOG_MAX = 300;

export interface FitAnswer {
  at: number;
  /** pick: the piece page or the Closet card; lineTap: the card line tapped; scoredFix: a "Not quite right?" Fit or Leg fix. */
  kind: 'pick' | 'lineTap' | 'scoredFix';
  /** Where a pick was made. */
  via?: 'row' | 'card';
  itemId: string;
  field: DoubtField;
  /** What he picked (none for a tap). */
  value: string | number | null;
  checkId?: string;
  /** What his photos of the piece read, one per check, oldest first (before this answer). */
  reads: (string | number)[];
}

export function parseFitLog(raw: string | null | undefined): FitAnswer[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? (v.filter((e) => e && typeof e === 'object' && typeof (e as FitAnswer).itemId === 'string') as FitAnswer[]) : [];
  } catch {
    return [];
  }
}

/** Append one answer (with the piece's reads from `obs`), keeping the newest FIT_LOG_MAX. */
export async function logFitAnswer(
  store: Pick<KittedStore, 'getKv' | 'setKv'>, obs: readonly ClosetObservationRow[], e: Omit<FitAnswer, 'reads'>,
): Promise<void> {
  const log = parseFitLog(await store.getKv(FIT_LOG_KEY));
  log.push({ ...e, reads: checkReads(e.itemId, obs, e.field) });
  await store.setKv(FIT_LOG_KEY, JSON.stringify(log.slice(-FIT_LOG_MAX)));
}

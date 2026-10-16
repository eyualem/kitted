// What the cards read for the end of onboarding (10-onboarding.md §9): whether `Later` shows, and the moves as they
// stand now (a move turns done when he does it).
import { store } from '@/data/db';
import type { FitCheckRow } from '@/data/types';
import { useLive } from '@/data/useLive';
import { sessionClock } from '@/state/session';
import { buildMoves, type MovesPlan } from './moves';
import { laterShows } from './sequence';
import { sequenceOn } from './session';
import { FINISH_KEY, getFinish, getStarterMarks, STARTER_MARKS_KEY, toFinishChecks } from './service';

/** L1: `Later` on his first-ever full check. Only that card loads anything. */
export function useLaterShows(row: Pick<FitCheckRow, 'id' | 'status' | 'parentId' | 'isFirstCheck'>, readOnly: boolean): boolean {
  const candidate = !readOnly && sequenceOn() && row.isFirstCheck && row.parentId === null && row.status === 'scored';
  const state = useLive(['kv'], () => (candidate ? getFinish(store) : Promise.resolve(null)), [candidate], FINISH_KEY);
  const checks = useLive(['fitChecks'], () => (candidate ? store.fitChecks.all() : Promise.resolve(null)), [candidate]);
  if (!candidate || !state || !checks) return false;
  return laterShows(state, row, toFinishChecks(checks, sessionClock.nowMs(), sessionClock));
}

/** The moves card's plan for its first check, rebuilt from the closet and the re-check as they change. */
export function useMoves(checkId: string, buyId: string | null): MovesPlan | null | undefined {
  const marks = useLive(['kv'], () => getStarterMarks(store), [], STARTER_MARKS_KEY);
  return useLive(
    ['fitChecks', 'closet', 'profile'],
    async () => {
      const first = await store.fitChecks.get(checkId);
      if (!first || !marks) return null;
      const recheck = (await store.fitChecks.all()).find((c) => c.parentId === checkId && c.status === 'scored') ?? null;
      const [closet, profile] = await Promise.all([store.closet.all(), store.profile.get('me')]);
      return buildMoves({ first, recheck, closet, styles: profile?.styles ?? null, markedKv: marks, buyId });
    },
    [checkId, buyId, marks?.join()],
  );
}

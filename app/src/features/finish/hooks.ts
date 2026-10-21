// What the cards read for the end of onboarding (10-onboarding.md §9): whether `Later` shows, and how many pieces he
// added from the optional list (§9.11).
import { store } from '@/data/db';
import type { FitCheckRow } from '@/data/types';
import { useLive } from '@/data/useLive';
import { sessionClock } from '@/state/session';
import { basicsAdded } from './invite';
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

/** How many pieces he has added from "What you already own" (the invite card's "Added {n}"). */
export function useBasicsAdded(): number | undefined {
  const marks = useLive(['kv'], () => getStarterMarks(store), [], STARTER_MARKS_KEY);
  const closet = useLive(['closet'], () => store.closet.all(), []);
  return marks && closet ? basicsAdded(closet, marks) : undefined;
}

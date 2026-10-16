// L3 "Your moves" and the pinned "Your moves · n of 3" rows in Lookbook and You (02 L3, D16, D17; 10-onboarding.md
// §9.9). They read the moves card's own plan: the same first check and the same `buyId` from the card's chat payload, so
// the three places never disagree. Nothing shows until the sequence has posted that card.
import type { KittedStore } from '@/data/store';
import { buildMoves, type Move, type MoveGo, type MovesPlan } from './moves';
import type { FinishState } from './sequence';
import { getFinish, getStarterMarks } from './service';

export interface MovesSource {
  checkId: string;
  movesMsgId: string;
}

/** The moves card's check and message, once it's posted (step moves, paywall or done; never waiting or skipped). */
export function movesSource(s: FinishState): MovesSource | null {
  if (s.step !== 'moves' && s.step !== 'paywall' && s.step !== 'done') return null;
  if (!s.checkId || !s.movesMsgId) return null;
  return { checkId: s.checkId, movesMsgId: s.movesMsgId };
}

export const movesDoneCount = (plan: MovesPlan): number => plan.moves.filter((m) => m.done).length;

/** The pinned rows show while a move is left (they disappear when all 3 are done). */
export const pinnedShows = (plan: MovesPlan | null | undefined): plan is MovesPlan => !!plan && plan.current !== null;

/** L3's trailing Start: every move not done has one (any order, unlike the card's one button); a done move none. */
export const moveStart = (m: Move): MoveGo | null => (!m.done && m.go ? m.go : null);

/** His moves as they stand now, or null when the sequence never posted its card (or its first check is gone). */
export async function loadYourMoves(store: KittedStore): Promise<MovesPlan | null> {
  const src = movesSource(await getFinish(store));
  if (!src) return null;
  const first = await store.fitChecks.get(src.checkId);
  if (!first) return null;
  const card = await store.chat.get(src.movesMsgId);
  const buyId = typeof card?.payload.buyId === 'string' ? card.payload.buyId : null;
  const [checks, closet, profile, marks] = await Promise.all([store.fitChecks.all(), store.closet.all(), store.profile.get('me'), getStarterMarks(store)]);
  const recheck = checks.find((c) => c.parentId === src.checkId && c.status === 'scored') ?? null;
  return buildMoves({ first, recheck, closet, styles: profile?.styles ?? null, markedKv: marks, buyId });
}

// "Your first 3 moves" (02 S14; 10-onboarding.md §9.2): the basics, his first check's top fix, and the Starter piece
// that adds the most outfits. Pure: built from the first check, its re-check, his closet and the Starter state, each
// time the card draws, so a move turns done when he does it.
import type { Styles } from '@kitted/core';
import type { ClosetItemRow, FitCheckRow } from '@/data/types';
import { t } from '@/i18n/en';
import { bestMissing, starterGain } from './gains';
import { NEXT_STEP, ownership, STARTER, type Ownership } from './starter';

export type MoveKind = 'basics' | 'fix' | 'buy';
/** Where a move's Start goes (M4): never a placeholder. */
export type MoveGo = 'starter' | 'camera';

export interface Move {
  kind: MoveKind;
  title: string;
  detail: string;
  done: boolean;
  go: MoveGo | null;
}

export interface MovesPlan {
  moves: [Move, Move, Move];
  /** The first move not done (its index), or null when all 3 are. */
  current: number | null;
}

export interface MovesInput {
  first: Pick<FitCheckRow, 'fixes' | 'details'>;
  /** Its re-check, if one was scored. */
  recheck: Pick<FitCheckRow, 'status' | 'details'> | null;
  closet: readonly ClosetItemRow[];
  styles: Styles | null;
  /** Starter rows marked in kv (the belt). */
  markedKv: readonly string[];
  /** The Starter row move 3 named when the card posted (kept, so the move doesn't change under him). */
  buyId: string | null;
}

const uniqueFixes = (fixes: FitCheckRow['fixes']) => fixes.filter((f, i, all) => all.findIndex((g) => g.copy === f.copy) === i);

/** Move 1 is done once he has marked a piece in Starter essentials (C5): a live piece it made, or the belt's mark
 *  (whether or not a photographed piece also fills that row). */
export function basicsDone(closet: readonly ClosetItemRow[], markedKv: readonly string[]): boolean {
  return markedKv.length > 0 || closet.some((c) => !!c.starterId && !c.isPhotographed && !c.isDeleted && !c.mergedInto);
}

/** Move 3's Starter row: the one named at posting, or (first time) the best missing one. */
export function pickBuy(i: Omit<MovesInput, 'buyId'>): string | null {
  return bestMissing(i.closet, i.styles, i.markedKv)?.entry.id ?? null;
}

export function buildMoves(i: MovesInput): MovesPlan {
  const own = ownership(i.closet, i.markedKv);
  const basics: Move = { kind: 'basics', title: t('plan.move1'), detail: t('plan.move1Sub'), done: basicsDone(i.closet, i.markedKv), go: 'starter' };

  const fixes = uniqueFixes(i.first.fixes);
  const top = fixes[0];
  let fix: Move;
  if (top) {
    const doneFixes = i.recheck?.status === 'scored' ? i.recheck.details.recheck?.doneFixes ?? [] : [];
    fix = { kind: 'fix', title: top.copy, detail: top.tag, done: doneFixes.some((d) => d.copy === top.copy), go: 'camera' };
  } else if (i.first.details.nextLevel?.[0]) {
    fix = { kind: 'fix', title: i.first.details.nextLevel[0], detail: t('plan.move.nextLevelSub'), done: false, go: 'camera' };
  } else {
    fix = { kind: 'fix', title: t('plan.move.checkNext'), detail: t('plan.move.checkNextSub'), done: false, go: 'camera' };
  }

  const buy = buyMove(i, own);
  const moves: [Move, Move, Move] = [basics, fix, buy];
  const current = moves.findIndex((m) => !m.done);
  return { moves, current: current < 0 ? null : current };
}

function buyMove(i: MovesInput, own: Record<string, Ownership>): Move {
  const named = i.buyId ? STARTER.find((e) => e.id === i.buyId && e.pick) : undefined;
  if (named?.pick) {
    const done = own[named.id]?.owned === true;
    // The +N is what it adds now (it shrinks as he fills other gaps); recounted each draw, never stored.
    const gain = done ? 0 : bestGainFor(i, named.id);
    return { kind: 'buy', title: t('plan.move3', { item: named.pick.phrase }), detail: buyDetail(named.budget, gain), done, go: 'starter' };
  }
  const best = bestMissing(i.closet, i.styles, i.markedKv);
  if (best?.entry.pick) {
    return { kind: 'buy', title: t('plan.move3', { item: best.entry.pick.phrase }), detail: buyDetail(best.entry.budget, best.gain), done: false, go: 'starter' };
  }
  // Every wearable essential is there: the Next step (02 C5's footer).
  return { kind: 'buy', title: t('plan.move3', { item: lowerFirst(NEXT_STEP.name) }), detail: t('plan.move3.nextStepSub', { price: NEXT_STEP.budget }), done: false, go: 'starter' };
}

function bestGainFor(i: MovesInput, id: string): number {
  const e = STARTER.find((x) => x.id === id);
  return e ? starterGain(i.closet, i.styles, e) : 0;
}

const buyDetail = (price: string, gain: number): string => (gain > 0 ? t('plan.move3Sub', { price, n: gain }) : price);
const lowerFirst = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

// "Same as your …?" answered in Closet's "To confirm" card (09 §20.7 R10, #323): the question leaves the card, so the
// answer is said in a toast with Undo, which opens the question again (closet service `unanswer`).
import type { ClosetAsk, ClosetItemRow } from '@/data/types';
import type { DuplicateAnswer } from './service';
import { t } from '@/i18n/en';

const lower = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

/**
 * The line the card and the toast say: "Saved as your {item}." (a piece he picked in "What is it, then?" counts as the
 * piece it went to), "Saved as its own piece: {item}." for a new piece with its kind confirmed (CB4), and for answers
 * given before CB4 "Kept as a new piece.".
 */
export function answerLine(
  a: DuplicateAnswer, candidate: Pick<ClosetItemRow, 'name'>, runnerUp: Pick<ClosetItemRow, 'name'> | null,
  o: { picked?: Pick<ClosetItemRow, 'name'> | null; newPiece?: Pick<ClosetItemRow, 'name'> | null } = {},
): string {
  if (a === 'new') return o.newPiece ? t('closet.piece.splitOff', { item: lower(o.newPiece.name) }) : t('item.dup.saidNew');
  const target = a === 'runnerUp' ? runnerUp ?? candidate : o.picked ?? candidate;
  return t('item.dup.saidSame', { item: lower(target.name) });
}

export interface AnswerToastDeps {
  answer: (checkId: string, obsId: string, a: DuplicateAnswer) => Promise<unknown>;
  unanswer: (checkId: string, obsId: string) => Promise<unknown>;
  toast: (text: string, undo: () => void) => void;
}

/** Answer, then say so with Undo; nothing is said when the answer didn't land (the check or the question is gone). */
export async function answerWithUndo(
  d: AnswerToastDeps, checkId: string, ask: Pick<ClosetAsk, 'obsId'>, a: DuplicateAnswer,
  candidate: Pick<ClosetItemRow, 'name'>, runnerUp: Pick<ClosetItemRow, 'name'> | null,
): Promise<void> {
  const r = await d.answer(checkId, ask.obsId, a);
  if (!r) return;
  d.toast(answerLine(a, candidate, runnerUp), () => void d.unanswer(checkId, ask.obsId));
}

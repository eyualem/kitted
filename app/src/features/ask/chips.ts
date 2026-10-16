// The starter chips (07 §6.3, check R7): inside the opened composer, above the field, only while it's empty, at
// most 3, one tap sends. Built by code from his data, one from each pool when it can:
//   today   · "Why a 7.0?" after a check today, else "What should I wear today?"
//   closet  · "What goes with my olive overshirt?" (his most-worn top, layer or bottom)
//   learn   · one of the guide's beginner questions, rotating by day
// An empty closet gets learn lines and "What should I buy first?".
import { dayKey } from '@kitted/core';
import type { ClosetItemRow, FitCheckRow } from '@/data/types';
import { displayScore } from '@/design-system/score';
import { isAwaitingAnswer, isOwned } from '@/features/closet/profile';
import { t, type StringKey } from '@/i18n/en';
import type { ZoneOffset } from '@kitted/core';

export const MAX_CHIPS = 3;
const LEARN: readonly StringKey[] = ['ask.chip.learn.1', 'ask.chip.learn.2', 'ask.chip.learn.3', 'ask.chip.learn.4'];

export interface ChipInput {
  nowMs: number;
  zone: ZoneOffset;
  closet: readonly ClosetItemRow[];
  checks: readonly FitCheckRow[];
}

const lower = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

export function starterChips(i: ChipInput): string[] {
  const today = dayKey(i.nowMs, i.zone);
  const dayIndex = Math.floor(i.nowMs / 86_400_000);
  const learn = (k: number) => t(LEARN[(dayIndex + k) % LEARN.length]!);
  const owned = i.closet.filter(isOwned);
  const pieces = owned.filter((c) => !isAwaitingAnswer(c, owned));
  if (pieces.length === 0) return [learn(0), learn(1), t('ask.chip.buyFirst')].slice(0, MAX_CHIPS);
  const out: string[] = [];
  const todays = i.checks.filter((c) => c.dayKey === today && c.status === 'scored' && c.score !== null).sort((a, b) => b.createdAt - a.createdAt);
  out.push(todays[0] ? t('ask.chip.why', { score: displayScore(todays[0].score!) }) : t('ask.chip.wearToday'));
  const worn = pieces.filter((c) => c.slot !== 'shoes').sort((a, b) => (b.wornCount ?? 0) - (a.wornCount ?? 0) || a.id.localeCompare(b.id))[0];
  if (worn) out.push(t('ask.chip.goesWith', { item: lower(worn.name) }));
  out.push(learn(0));
  return out.slice(0, MAX_CHIPS);
}

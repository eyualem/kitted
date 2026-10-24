// His own good fit, credited on a later card (founder, Oct 23, #370). Going with his own is the loop working, so the
// greeting never comments on it; but when a fit he chose himself (not that window's pick) scored 8+, the next card that
// reuses one of its pieces says so at the end of its why line: "Your olive overshirt was in Tuesday's 8.0." Only what he
// wore (a try-on doesn't count, a re-check counts with its own score), only the last CREDIT_DAYS days, so a weekday name
// is never ambiguous. Read at display time; nothing stored changes, and the card's pick doesn't change because of it.
import { addDays, daysBetween, localParts, type ZoneOffset } from '@kitted/core';
import type { ClosetItemRow, DailyIdeaRow, FitCheckRow, IdeaSlot } from '@/data/types';
import { displayScore } from '@/design-system/score';
import { wornChecks } from '@/features/fitcheck/tryOn';
import { t } from '@/i18n/en';
import { weekdayName } from '@/i18n/format';
import { slotAt } from './service';
import { rootOf, woreThePick } from './woreOwn';

export const CREDIT_MIN = 8;
export const CREDIT_DAYS = 6;

/** The piece named: the layer first, then the top, the pants, the shoes. */
const SLOT_ORDER = ['outer', 'top', 'bottom', 'shoes'] as const;

export interface CreditRows {
  checks: readonly FitCheckRow[];
  ideas: readonly Pick<DailyIdeaRow, 'id' | 'dayKey' | 'slot' | 'outfitId'>[];
  /** The whole closet, merged-away rows too (the match follows a merge). */
  closet: readonly ClosetItemRow[];
  itemsOf: (outfitId: string) => readonly string[];
}

export interface OwnFitCredit {
  itemId: string;
  checkId: string;
  score: number;
  createdAt: number;
}

/** The newest own fit at 8+ before this card's window that shares a piece with it, or null. */
export function ownFitCredit(
  card: { id: string; slot: IdeaSlot; itemIds: readonly string[] }, rows: CreditRows, zone: ZoneOffset,
): OwnFitCredit | null {
  if (card.itemIds.length === 0) return null;
  const day = card.id.split('|')[0] ?? '';
  const from = addDays(day, -CREDIT_DAYS);
  const root = rootOf(rows.closet);
  const onCard = new Map(card.itemIds.map((id) => [root(id), id]));
  const slotOf = new Map(rows.closet.map((c) => [c.id, c.slot]));
  const scored = rows.checks.filter((c) => c.status === 'scored' && c.score !== null);
  const found = wornChecks(scored)
    .filter((c) => (c.score ?? 0) >= CREDIT_MIN)
    .sort((a, b) => b.createdAt - a.createdAt);
  for (const c of found) {
    const slot = slotAt(c.createdAt, zone).slot;
    // Earlier days, or this morning for the evening card; never this card's own window.
    const before = c.dayKey >= from && (c.dayKey < day || (card.slot === 'evening' && c.dayKey === day && slot === 'day'));
    if (!before) continue;
    const pickRow = rows.ideas.find((r) => r.dayKey === c.dayKey && r.slot === slot);
    const pick = pickRow?.outfitId ? rows.itemsOf(pickRow.outfitId) : [];
    if (pick.length > 0 && woreThePick(pick, c.itemIds, rows.closet)) continue;
    const shared = c.itemIds.map((id) => onCard.get(root(id))).filter((id): id is string => !!id);
    if (shared.length === 0) continue;
    const rank = (id: string) => {
      const i = SLOT_ORDER.indexOf(slotOf.get(id) as (typeof SLOT_ORDER)[number]);
      return i < 0 ? SLOT_ORDER.length : i;
    };
    const itemId = [...shared].sort((a, b) => rank(a) - rank(b))[0]!;
    return { itemId, checkId: c.id, score: c.score!, createdAt: c.createdAt };
  }
  return null;
}

/** "Your olive overshirt was in Tuesday's 8.0." (or yesterday's, last night's, this morning's, this afternoon's). */
export function creditLine(
  credit: OwnFitCredit, card: { id: string }, closet: readonly ClosetItemRow[], zone: ZoneOffset,
): string | null {
  const name = closet.find((c) => c.id === credit.itemId)?.name;
  if (!name) return null;
  const day = card.id.split('|')[0] ?? '';
  const at = slotAt(credit.createdAt, zone);
  const ago = daysBetween(at.day, day);
  const when =
    ago === 0 ? (localParts(credit.createdAt, zone).hh < 12 ? t('idea.credit.thisMorning') : t('idea.credit.thisAfternoon'))
      : ago === 1 ? (at.slot === 'evening' ? t('idea.credit.lastNight') : t('idea.credit.yesterday'))
        : t('idea.credit.day', { day: weekdayName(localParts(credit.createdAt, zone).dow) });
  return t('idea.credit', { item: name.charAt(0).toLowerCase() + name.slice(1), when, score: displayScore(credit.score) });
}

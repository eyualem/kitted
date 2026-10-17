// The partial check's "Finish the check" row (02 D11): what it offers, for the row and the card's VoiceOver actions.
// A shoes-only check is finished by a pair (remembered, picked from Closet) or a shoe snap; a top-only check only by
// a photo of the pants and shoes (#313), since a pair alone can't stand in for the missing pants.
import type { ClosetItemRow, FitCheckRow } from '@/data/types';
import { t, type StringKey } from '@/i18n/en';
import { weekdayName } from '@/i18n/format';
import { partialKind } from './scoring';

/** Which snap finishes this check: the bottom half (top only) or the shoes. */
export function snapPart(row: Pick<FitCheckRow, 'notRated'>): 'bottom' | 'shoes' {
  return partialKind(row.notRated) === 'topOnly' ? 'bottom' : 'shoes';
}

export interface FinishInfo {
  part: 'bottom' | 'shoes';
  remembered: { item: ClosetItemRow; weekday: string; label: string } | null;
  /** Offer "Pick shoes from your closet" (S10). */
  hasShoes: boolean;
  second: string;
  snapLabel: string;
  snapHref: string;
}

export function finishInfo(row: Pick<FitCheckRow, 'id' | 'notRated' | 'details'>, closet: readonly ClosetItemRow[]): FinishInfo {
  const part = snapPart(row);
  if (part === 'bottom') {
    return {
      part, remembered: null, hasShoes: false, second: t('partial.finish.bottom'),
      snapLabel: t('partial.a11y.snapBottom'), snapHref: `/camera?mode=shoeSnap&parent=${row.id}&part=bottom`,
    };
  }
  const f = row.details.finish;
  const item = f?.suggestedItemId ? closet.find((c) => c.id === f.suggestedItemId) : undefined;
  const weekday = f?.weekday !== null && f?.weekday !== undefined ? weekdayName(f.weekday) : null;
  const remembered = item && weekday ? { item, weekday, label: t('partial.a11y.useSame', { shoes: item.name.toLowerCase(), weekday }) } : null;
  const hasShoes = closet.some((c) => c.slot === 'shoes' && !c.isDeleted);
  const second = remembered
    ? t('partial.finish.same', { weekday: remembered.weekday })
    : hasShoes ? t('partial.finish.snapOrPick') : t('partial.finish.snapOnly');
  return { part, remembered, hasShoes, second, snapLabel: t('partial.a11y.snap'), snapHref: `/camera?mode=shoeSnap&parent=${row.id}` };
}

/** A snap that didn't finish the check (02 S9 "Failure → a toast"): what the toast says, or null when it worked or
 *  something else already answers (the consent sheet, the busy toast). A snap never shows "Step into the frame": a
 *  photo of his shoes has no person in it. */
export function snapFailedKey(outcome: string, part: 'bottom' | 'shoes'): StringKey | null {
  if (outcome !== 'failed' && outcome !== 'photoProblem' && outcome !== 'error' && outcome !== 'notImplemented') return null;
  return part === 'bottom' ? 'cam.bottom.failed' : 'cam.shoe.failed';
}

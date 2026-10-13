// Card sentences from templates (04 §5.6: no text model in the demo). Every number in them comes
// from the computed result, never written by hand. P8's text model must pass the same checks.

import { garmentName, type Fix, type Reading, type RecheckOutcome } from '@kitted/core';
import { displayScore, scoreWordLabel } from '@/design-system/score';
import { t } from '@/i18n/en';

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export interface SummaryInput {
  reading: Reading;
  overall: number;
  /** The loungewear rule holds the score down (v4 O4, or the parts engine's loungewear ceiling). */
  lounge: boolean;
  fixes: readonly Fix[];
  partial: 'shoes' | 'topOnly' | null;
}

/** The 2-line verdict / summary under the score (02 D7, D11). */
export function cardSummary({ reading, overall, lounge, fixes, partial }: SummaryInput): string {
  const parts: string[] = [];
  const bottom = reading.garments.find((g) => g.category === 'bottom');
  const top = fixes[0];
  if (lounge && bottom) {
    parts.push(t('sum.lounge', { bottoms: cap(garmentName(bottom)) }));
  } else if (top && top.edits.some((e) => e.op === 'add_held')) {
    const held = (reading.held_items ?? []).find((g) => g.category === 'outerwear');
    parts.push(t('sum.heldLayer', { held: held ? garmentName(held) : t('label.slot.footwear').toLowerCase() }));
  } else if (!top) {
    parts.push(overall >= 9 ? t('sum.dialed') : t('sum.noQuickFix'));
  } else if (top.itemId) {
    parts.push(t('sum.closetMove', { to: displayScore(top.to) }));
  } else if (top.tier === 'changeInto' || top.tier === 'tailor') {
    // #232: "easy" only for a free move; a swap he may have to buy says so
    parts.push(t('sum.ownMove', { to: displayScore(top.to) }));
  } else {
    parts.push(t('sum.oneMove', { to: displayScore(top.to) }));
  }
  if (partial) parts.push(t('partial.mayChange'));
  return parts.join(' ');
}

/** "Layered and clean. Dialed in. Nothing else changed." (02 D10). The word is returned separately so it can be set in semibold. */
export function recheckSummary(outcome: RecheckOutcome): { lead: string; word: string; tail: string } {
  // v4's layer credit, or a parts fix that adds or wears a layer.
  const layered = outcome.doneFixes.some((f) => f.target === 'K1_layered' || (f.engine === 'parts' && /^(wear_held|closet_add_outer|layer_short)$/.test(f.target)));
  const lead = layered ? t('sum.recheck.layer') : t('sum.recheck.generic');
  const word = scoreWordLabel(outcome.after);
  const full = t('sum.recheck.tail', { word });
  return { lead, word: `${word}.`, tail: full.slice(word.length + 1).trim() };
}

/** S21: "I still see the overshirt in your hand." */
export function notSeenProblem(reading: Reading, fixes: readonly Fix[]): string {
  if (fixes.some((f) => f.edits.some((e) => e.op === 'add_held'))) {
    const held = (reading.held_items ?? []).find((g) => g.category === 'outerwear');
    if (held) return t('sum.notSeen.held', { held: garmentName(held) });
  }
  return t('sum.notSeen.generic');
}

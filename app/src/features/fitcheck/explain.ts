// Card sentences from templates (04 §5.6: no text model in the demo). Every number in them comes
// from the computed result, never written by hand. P8's text model must pass the same checks.

import { garmentName, type Fix, type Reading, type RecheckOutcome } from '@kitted/core';
import { displayScore, scoreWordLabel } from '@/design-system/score';
import type { CheckDetails } from '@/data/types';
import { en, t, type StringKey } from '@/i18n/en';
import { deltaPill } from '@/i18n/format';

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
  if (partial) parts.push(t(partial === 'topOnly' ? 'partial.mayChangeBottom' : 'partial.mayChange'));
  return parts.join(' ');
}

/** Which way a re-check moved, by the scores the card shows (was → now). */
export type RecheckMove = 'up' | 'same' | 'down';
export const recheckMove = (was: number, now: number): RecheckMove => (now > was ? 'up' : now < was ? 'down' : 'same');

/** The caught fix's number on a re-check (02 D10): one caught fix carries the whole move, so its row says the pill's
 *  number; with several (each its own raw points, which don't add up to the rounded pill) or no win, ''. */
export function caughtFixGain(rc: { parentScore: number; doneFixes: readonly unknown[] }, now: number): string {
  return recheckMove(rc.parentScore, now) === 'up' && rc.doneFixes.length === 1 ? deltaPill(now - rc.parentScore) : '';
}

/** "I see your green hoodie now. It doesn't change the score." (#383): pieces a re-check added that hold the score.
 *  '' with none. */
export function recheckSeenLine(seen: readonly string[]): string {
  if (seen.length === 0) return '';
  const pieces = seen.length === 1 ? seen[0]! : `${seen.slice(0, -1).join(', ')} and ${seen[seen.length - 1]}`;
  return t(seen.length === 1 ? 'recheck.seen.one' : 'recheck.seen.many', { pieces });
}

/** The re-check's summary (02 D10), honest about the direction (#276): "Layered and clean. Dialed in. Nothing else
 *  changed." only on a real win with no new problem; a win with a new problem, a score that held and a drop say just
 *  the word, and the card lists the new problems under it ("New: …"). The word is returned separately so it can be
 *  set in semibold; `lead` and `tail` are '' when there are none. */
export function recheckSummary(
  outcome: Pick<RecheckOutcome, 'after' | 'doneFixes'>, move: RecheckMove, newProblems: readonly string[],
): { lead: string; word: string; tail: string } {
  const word = scoreWordLabel(outcome.after);
  if (move !== 'up' || newProblems.length > 0) return { lead: '', word: `${word}.`, tail: '' };
  // v4's layer credit, or a parts fix that adds or wears a layer.
  const layered = outcome.doneFixes.some((f) => f.target === 'K1_layered' || (f.engine === 'parts' && /^(wear_held|closet_add_outer|layer_short)$/.test(f.target)));
  const lead = layered ? t('sum.recheck.layer') : t('sum.recheck.generic');
  const full = t('sum.recheck.tail', { word });
  return { lead, word: `${word}.`, tail: full.slice(word.length + 1).trim() };
}

const lowerFirst = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

/** The re-check's new problems in words, for "New: {problem}" (recheck.newProblem). Parts checks store
 *  "part:check" ids (core partsRecheckOutcome), worded by the re-check's own Why reasons ("the overshirt hides the
 *  tuck"), and "condition:…" carries its own words; v4 checks store rule ids, worded by the Why rule names. An id with
 *  no words is left out. At most two. */
export function newProblemLines(newProblems: readonly string[], details: Pick<CheckDetails, 'parts'>): string[] {
  const out: string[] = [];
  for (const id of newProblems) {
    const at = id.indexOf(':');
    let line: string | undefined;
    if (at > 0) {
      const part = id.slice(0, at);
      const check = id.slice(at + 1);
      line = part === 'condition'
        ? check
        : details.parts?.parts[part as keyof NonNullable<CheckDetails['parts']>['parts']]?.reasons.find((r) => r.check === check && r.points < 0)?.line;
    } else {
      const key = `why.rule.${id}` as StringKey;
      line = key in en ? lowerFirst(t(key)) : undefined;
    }
    if (line && !out.includes(line)) out.push(line);
  }
  return out.slice(0, 2);
}

/** S21: "I still see the overshirt in your hand." */
export function notSeenProblem(reading: Reading, fixes: readonly Fix[]): string {
  if (fixes.some((f) => f.edits.some((e) => e.op === 'add_held'))) {
    const held = (reading.held_items ?? []).find((g) => g.category === 'outerwear');
    if (held) return t('sum.notSeen.held', { held: garmentName(held) });
  }
  return t('sum.notSeen.generic');
}

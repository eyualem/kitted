// "Why this score" rows from the engine's trace (explainScore), in sheet order (02 D8):
// start · earned credits · unearned credits · the partial row · mistakes · occasion · clamps ·
// rounding. They add up to the score shown (tested on every parity case in the core).
import { explainScore, garmentName, type CreditId, type Reading, type ScoreLedger, type Styles } from '@kitted/core';
import type { OccasionKey, StyleKey } from '@/data/types';
import { styleLabel } from '@/features/morning/copy';
import { garmentPhrase } from '@/features/fitcheck/labels';
import { occasionLabel } from '@/features/stylist/thread';
import { t, type StringKey } from '@/i18n/en';

export interface WhyRow {
  key: string;
  rule: string;
  item?: string;
  amount?: number;
  valueText?: string;
  zero?: 'plus' | 'plusMinus';
}

const CREDIT_NAME: Record<CreditId, StringKey> = {
  K1_layered: 'why.credit.layered',
  K2_elevated_piece: 'why.credit.elevated',
  K3_point_of_interest: 'why.credit.interest',
  K4_shoes_complement: 'why.credit.shoes',
};

/** `readsAs`: the look the card says it reads as; shown as a ±0 row (a style never changes the score, #85). */
export function whyRows(
  reading: Reading, occasion: OccasionKey, styles: Styles, boldness: string | null, readsAs: StyleKey | null = null,
): { rows: WhyRow[]; ledger: ScoreLedger } | null {
  const { ledger } = explainScore(reading, { occasion, styles, boldness: boldness ?? 'a_little' });
  if (!ledger) return null;
  const g = (i: number | null) => (i !== null && reading.garments[i] ? garmentPhrase(reading.garments[i]!) : undefined);
  const rows: WhyRow[] = [{ key: 'start', rule: t('why.start'), valueText: ledger.base.toFixed(1) }];
  for (const c of ledger.credits) {
    let item: string | undefined;
    if (c.earned) item = g(c.evidenceIndex);
    else if (c.reason === 'heldNotWorn') {
      const held = c.heldIndex !== null ? reading.held_items?.[c.heldIndex] : undefined;
      item = t('why.reason.heldNotWorn', { held: held ? garmentName(held) : '' });
    } else if (c.reason) item = t(`why.reason.${c.reason}` as StringKey);
    rows.push({ key: c.id, rule: t(CREDIT_NAME[c.id]), item, amount: c.earned ? c.points : 0, zero: 'plus' });
  }
  if (ledger.notRated.includes('shoes') || ledger.notRated.includes('bottom half')) {
    const slot = ledger.notRated.includes('bottom half') ? t('label.slot.bottom') : t('label.slot.footwear');
    rows.push({ key: 'partial', rule: slot, item: t('why.partialRow'), amount: ledger.partialBoost, zero: 'plusMinus' });
  }
  for (const r of ledger.rules) {
    rows.push({ key: `rule-${r.id}`, rule: t(`why.rule.${r.id}` as StringKey), item: g(r.culpritIndex), amount: -r.impact });
  }
  if (readsAs) {
    rows.push({ key: 'readsAs', rule: t('why.readsAs.rule', { style: styleLabel(readsAs).toLowerCase() }), item: t('why.readsAs.item'), amount: 0, zero: 'plusMinus' });
  }
  if (!ledger.occasionRuleFired) rows.push({ key: 'occasion', rule: occasionLabel(occasion), item: t('why.dressedRight'), amount: 0, zero: 'plusMinus' });
  if (ledger.adjust !== 0) rows.push({ key: 'adjust', rule: t('why.adjust'), amount: ledger.adjust });
  if (ledger.rounding !== 0) rows.push({ key: 'rounding', rule: t('why.rounded'), amount: ledger.rounding });
  return { rows, ledger };
}

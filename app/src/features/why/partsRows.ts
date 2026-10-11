// "Why 7.0" on the parts engine (#205, #209; layout from mockups/parts-card.html option 1): the five-part strip,
// one group per part (weight, number, the reasons that moved it), then Average of the parts · the earned bonus ·
// Condition · Occasion (only when it holds the score down) · Reads as · the rounding. Pure, and the rows add up:
// in each group 7 + the reasons (+ the half rounding) = the part, and Average + the rows after it = the score.
import { PARTS_DATA, type PartName, type PartsCondition, type PartsOccasion, type PartResult } from '@kitted/core';
import type { OccasionKey, StyleKey } from '@/data/types';
import { styleLabel } from '@/features/morning/copy';
import { occasionLabel } from '@/features/stylist/thread';
import { t } from '@/i18n/en';
import type { WhyRow } from './ledgerRows';

/** What the sheet needs from a parts result (a stored check's details.parts, or core PartsScored). */
export interface PartsInput {
  overall: number;
  averageUnrounded: number;
  earnedBonus: number;
  floored: boolean;
  parts: Partial<Record<PartName, PartResult>>;
  weightsUsed: Partial<Record<PartName, number>>;
  condition: PartsCondition;
  occasion: PartsOccasion;
}

export interface StripCell {
  part: PartName;
  label: string;
  /** Half points; null = not scored (a dash). */
  display: number | null;
  /** The part with the most to gain (copper). */
  gain: boolean;
}

export interface PartGroup {
  part: PartName;
  label: string;
  /** "30%" (the weights the live parts share). */
  weight: string;
  display: number | null;
  na: string | null;
  rows: WhyRow[];
  note: string | null;
}

export interface WhyParts {
  strip: StripCell[];
  groups: PartGroup[];
  /** Average of the parts, one decimal (the only finer number on the sheet). */
  average: number;
  after: WhyRow[];
  total: number;
  /** VoiceOver for the strip: "Parts: Proportions 7, Fit 7, … Style 6, the most to gain." */
  stripLabel: string;
}

const r2 = (x: number) => Math.round(x * 100) / 100;
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
/** 7 → "7", 7.5 → "7.5" (parts show whole and half points only). */
export const partText = (x: number | null) => (x === null ? '—' : String(x));

export function whyParts(
  res: PartsInput, opts: { occasion: OccasionKey; readsAs: StyleKey | null; gainPart: PartName | null },
): WhyParts {
  const order = PARTS_DATA.partOrder as readonly PartName[];
  const names = PARTS_DATA.partNames as Record<PartName, string>;
  const wsum = order.reduce((s, k) => s + (res.weightsUsed[k] ?? 0), 0) || 1;

  const strip: StripCell[] = order.map((k) => ({
    part: k, label: names[k], display: res.parts[k]?.display ?? null, gain: opts.gainPart === k && res.parts[k]?.display != null,
  }));

  const groups: PartGroup[] = order.map((k) => {
    const p = res.parts[k];
    const display = p?.display ?? null;
    const rows: WhyRow[] = [];
    if (p && display !== null) {
      for (const [i, x] of p.reasons.entries()) rows.push({ key: `${k}-${i}`, rule: cap(x.line), amount: r2(x.points), zero: 'plusMinus' });
      const pre = PARTS_DATA.base + p.reasons.reduce((s, x) => s + x.points, 0);
      const rest = r2(display - pre);
      if (rows.length === 0) rows.push({ key: `${k}-none`, rule: t('pwhy.noReasons'), amount: 0, zero: 'plusMinus' });
      if (Math.abs(rest) >= 0.01) rows.push({ key: `${k}-round`, rule: t('pwhy.partRounded'), amount: rest, zero: 'plusMinus' });
    }
    const w = res.weightsUsed[k];
    return {
      part: k, label: names[k], weight: w ? t('pwhy.weight', { n: Math.round((w / wsum) * 100) }) : t('pwhy.naShort'), display,
      na: display === null ? p?.na ?? null : null, rows,
      note: k === 'fit' && display !== null && display <= 7 ? t('pwhy.fitNote') : display === null ? t('pwhy.naNote') : null,
    };
  });

  // After the parts: one row per step of the engine's combine (average + bonus − condition − occasion, the floor).
  const average = Math.round(res.averageUnrounded * 10) / 10;
  const after: WhyRow[] = [];
  if (res.earnedBonus > 0) after.push({ key: 'bonus', rule: t('pwhy.bonus'), amount: r2(res.earnedBonus) });
  const cond = res.condition;
  // v7 (#219): a condition read on a piece the AI wasn't clear about is a tip with no points; it's named, never counted.
  const unsure = (cond.tips ?? []).map((x) => x.line).join('; ');
  after.push(cond.deduction > 0
    ? { key: 'condition', rule: t('pwhy.condition'), item: unsure ? `${cond.display}; ${unsure}` : cond.display, amount: -r2(cond.deduction) }
    : { key: 'condition', rule: t('pwhy.condition'), item: unsure || t('pwhy.conditionClean'), amount: 0, zero: 'plusMinus' });
  const pre = res.averageUnrounded + res.earnedBonus - cond.deduction;
  let post = pre - res.occasion.deduction;
  if (res.occasion.ceiling !== null) post = Math.min(post, res.occasion.ceiling);
  if (post < pre - 1e-9) {
    after.push({
      key: 'occasion', rule: occasionLabel(opts.occasion), item: `${res.occasion.status} · ${t('pwhy.partsAlone', { score: (Math.round(pre * 10) / 10).toFixed(1) })}`,
      amount: r2(post - pre),
    });
  }
  if (res.floored) {
    after.push({ key: 'floor', rule: t('pwhy.floor', { occasion: occasionLabel(opts.occasion).toLowerCase() }), amount: r2(PARTS_DATA.final.floor - post) });
  }
  const styleSaysIt = (res.parts.cohesion?.reasons ?? []).some((x) => /^reads as/i.test(x.line));
  if (opts.readsAs && !styleSaysIt) {
    after.push({ key: 'readsAs', rule: t('why.readsAs.rule', { style: styleLabel(opts.readsAs).toLowerCase() }), item: t('why.readsAs.item'), amount: 0, zero: 'plusMinus' });
  }
  const shown = after.reduce((s, x) => s + (x.amount ?? 0), average);
  const rounding = r2(res.overall - shown);
  if (Math.abs(rounding) >= 0.01) after.push({ key: 'rounding', rule: t('pwhy.rounded'), amount: rounding, zero: 'plusMinus' });

  const stripLabel = t('pwhy.strip.a11y', {
    parts: strip.map((c) => (c.display === null ? t('pwhy.strip.partNa', { part: c.label })
      : `${t('pwhy.strip.part', { part: c.label, score: partText(c.display) })}${c.gain ? `, ${t('pwhy.strip.most')}` : ''}`)).join(', '),
  });
  return { strip, groups, average, after, total: res.overall, stripLabel };
}

// "Why 7.0" on the parts engine (#205, #209; layout from mockups/parts-card.html option 1): the five-part strip,
// one group per part (weight, number, the reasons that moved it), then Average of the parts · the earned bonus ·
// Condition · Occasion (only when it holds the score down) · Reads as · the rounding. Pure, and the rows add up:
// in each group 7 + the reasons (+ the half rounding) = the part, and Average + the rows after it = the score.
import { PARTS_DATA, type PartName, type PartsCondition, type PartsOccasion, type PartsV16, type PartResult } from '@kitted/core';
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
  /** Parts v8: "problems add up" (absent on older checks = 0). */
  piledPenalty?: number;
  floored: boolean;
  parts: Partial<Record<PartName, PartResult>>;
  weightsUsed: Partial<Record<PartName, number>>;
  condition: PartsCondition;
  occasion: PartsOccasion;
  /** v16 (T69): the rescoring's steps and the unrounded final. Absent on a check scored with v15 (it gets today's rows). */
  v16?: PartsV16;
  rawUnrounded?: number;
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
  /** VoiceOver for the strip: "Parts: Proportions 7.0, Fit 7.0, … Style 6.0, the most to gain." */
  stripLabel: string;
  /** v16: the first row of the after-list ("Every fit starts at 7.0"); absent on v15, where the Average row stays. */
  start?: WhyRow;
}

const r2 = (x: number) => Math.round(x * 100) / 100;
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
/** 7 → "7.0", 7.5 → "7.5": one decimal always, like every score (#276; "7" beside "7.5" read as a different scale). */
export const partText = (x: number | null) => (x === null ? '—' : x.toFixed(1));

const stripLabelOf = (strip: StripCell[]): string => t('pwhy.strip.a11y', {
  parts: strip.map((c) => (c.display === null ? t('pwhy.strip.partNa', { part: c.label })
    : `${t('pwhy.strip.part', { part: c.label, score: partText(c.display) })}${c.gain ? `, ${t('pwhy.strip.most')}` : ''}`)).join(', '),
});

/** A graded look as words: "minimal and streetwear". */
const lookWords = (looks: readonly string[]): string => {
  const w = looks.filter((l) => l !== 'none').map((l) => (l === 'minimalist' ? 'minimal' : l.replace(/_/g, ' ')));
  return w.length > 0 ? w.join(' and ') : t('pwhy.lookAny');
};

/** The rows after the parts on a v16 check: start at 7.0, then one row per step of v16's finish, in the engine's order, so
 *  7 + the rows = the score (the rounding row holds only the half-point rounding and each step's two-decimal display). */
function v16After(res: PartsInput, v: PartsV16, opts: { occasion: OccasionKey; readsAs: StyleKey | null }): { start: WhyRow; after: WhyRow[] } {
  const after: WhyRow[] = [];
  const shown = (x: number) => Math.abs(x) >= 0.005;
  v.lifts.filter((l) => l.size !== 0).forEach((l, i) => {
    if (shown(l.size)) after.push({ key: `lift-${i}`, rule: cap(l.line), amount: r2(l.size) });
  });
  if (shown(v.minor)) after.push({ key: 'minor', rule: t('pwhy.minor'), amount: r2(v.minor) });
  if (shown(v.faultDrop)) after.push({ key: 'faults', rule: t('pwhy.faults'), item: t('pwhy.faultsItem'), amount: -r2(v.faultDrop) });
  const cond = res.condition;
  const unsure = (cond.tips ?? []).map((x) => x.line).join('; ');
  after.push(v.condDeduction > 0
    ? { key: 'condition', rule: t('pwhy.condition'), item: unsure ? `${cond.display}; ${unsure}` : cond.display, amount: -r2(v.condDeduction) }
    : { key: 'condition', rule: t('pwhy.condition'), item: unsure || t('pwhy.conditionClean'), amount: 0, zero: 'plusMinus' });
  if (shown(res.occasion.deduction)) {
    after.push({ key: 'occasion', rule: occasionLabel(opts.occasion), item: res.occasion.status ?? undefined, amount: -r2(res.occasion.deduction) });
  }
  if (v.heavyLayer && shown(v.heavyLayer[0])) after.push({ key: 'heavy', rule: cap(v.heavyLayer[1]), amount: -r2(v.heavyLayer[0]) });
  v.taste.filter((x) => x.points !== 0).forEach((x, i) => {
    if (shown(x.points)) after.push({ key: `taste-${i}`, rule: cap(x.line), item: t('pwhy.tasteFor', { look: lookWords(v.gradedLook) }), amount: r2(x.points) });
  });
  if (v.rawUnclamped > 9.5) after.push({ key: 'clampTop', rule: t('pwhy.clampTop'), amount: r2(v.raw - v.rawUnclamped) });
  if (v.rawUnclamped < 3.0) after.push({ key: 'clampBottom', rule: t('pwhy.clampBottom'), amount: r2(v.raw - v.rawUnclamped) });
  if (shown(v.curved - v.raw)) after.push({ key: 'curve', rule: t('pwhy.curve'), item: t('pwhy.curveItem'), amount: r2(v.curved - v.raw) });
  if (v.heldBy !== null) {
    const final = res.rawUnrounded ?? res.overall;
    const amount = r2(final - v.curved);
    const cap1 = v.caps.find((c) => c.id === v.heldBy);
    const lifts = /^(\d+) lifts?/.exec(v.heldBy);
    let row: WhyRow;
    if (cap1) row = { key: 'ceiling', rule: t('pwhy.dealbreaker'), item: cap1.line, amount };
    else if (lifts) {
      const n = Number(lifts[1]);
      row = { key: 'ceiling', rule: n === 1 ? t('pwhy.stackOne') : t('pwhy.stackMany', { n }), item: v.stackCeiling.toFixed(1), amount };
    } else if (v.heldBy === 'occasion') row = { key: 'ceiling', rule: occasionLabel(opts.occasion), item: res.occasion.status ?? undefined, amount };
    else if (v.heldBy.startsWith('a fit or shape fault')) row = { key: 'ceiling', rule: t('pwhy.fitFloor'), amount };
    else if (v.heldBy.startsWith('two sinking')) row = { key: 'ceiling', rule: t('pwhy.twoSinks'), amount };
    else row = { key: 'ceiling', rule: t('pwhy.twoHolds'), amount };
    after.push(row);
  }
  // v16: always shown when it reads as a look (T69-G10's test; the Style part's own "reads as" credit sits in its group)
  if (opts.readsAs) {
    after.push({ key: 'readsAs', rule: t('why.readsAs.rule', { style: styleLabel(opts.readsAs).toLowerCase() }), item: t('why.readsAs.item'), amount: 0, zero: 'plusMinus' });
  }
  const sum = after.reduce((s, x) => s + (x.amount ?? 0), 7);
  const rounding = r2(res.overall - sum);
  if (Math.abs(rounding) >= 0.01) after.push({ key: 'rounding', rule: t('pwhy.rounded'), amount: rounding, zero: 'plusMinus' });
  return { start: { key: 'start', rule: t('pwhy.start'), valueText: partText(7) }, after };
}

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

  const v16 = res.v16 ? v16After(res, res.v16, opts) : null;
  // After the parts: one row per step of the engine's combine (average + bonus − problems − condition − occasion, the floor).
  const average = Math.round(res.averageUnrounded * 10) / 10;
  if (v16) return { strip, groups, average, after: v16.after, total: res.overall, stripLabel: stripLabelOf(strip), start: v16.start };
  const after: WhyRow[] = [];
  if (res.earnedBonus > 0) after.push({ key: 'bonus', rule: t('pwhy.bonus'), amount: r2(res.earnedBonus) });
  const piled = res.piledPenalty ?? 0;
  if (piled > 0) after.push({ key: 'piled', rule: t('pwhy.piled'), amount: -r2(piled) });
  const cond = res.condition;
  // v7 (#219): a condition read on a piece the AI wasn't clear about is a tip with no points; it's named, never counted.
  const unsure = (cond.tips ?? []).map((x) => x.line).join('; ');
  after.push(cond.deduction > 0
    ? { key: 'condition', rule: t('pwhy.condition'), item: unsure ? `${cond.display}; ${unsure}` : cond.display, amount: -r2(cond.deduction) }
    : { key: 'condition', rule: t('pwhy.condition'), item: unsure || t('pwhy.conditionClean'), amount: 0, zero: 'plusMinus' });
  const pre = res.averageUnrounded + res.earnedBonus - piled - cond.deduction;
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

  return { strip, groups, average, after, total: res.overall, stripLabel: stripLabelOf(strip) };
}

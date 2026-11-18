// T69-G10: Why's rows on a v16 check add up to its score: "Every fit starts at 7.0", then one row per step of v16's
// finish (lifts, small credits, faults, condition, occasion, the warm-day layer, his taste rules, the clamps, the
// curve, the ceiling that held it), then Reads as and the rounding. No floor row: v16 has no floor. An old v15 check
// keeps exactly the rows it had before T69 (the pre-T69 whyParts is copied below as the oracle).
// Made-up readings and the parity fixture's v16 cases (no person, no photo); scored by core, no network.
import {
  createParts, PARTS_DATA, partsDataFor, type PartName, type PartsCondition, type PartsOccasion, type PartResult, type PartsScored, type Reading,
  type SecondLookInput, type Styles,
} from '@kitted/core';
import t69 from './fixtures/t69-readings.json';
import type { OccasionKey, StyleKey } from '@/data/types';
import { styleLabel } from '@/features/morning/copy';
import { occasionLabel } from '@/features/stylist/thread';
import type { WhyRow } from '@/features/why/ledgerRows';
import { whyParts } from '@/features/why/partsRows';
import { t } from '@/i18n/en';

const fs = jest.requireActual('fs') as { readFileSync(p: string, e: string): string };
const path = jest.requireActual('path') as { resolve(...p: string[]): string };
const fixture = <T,>(name: string): T => JSON.parse(fs.readFileSync(path.resolve('..', 'handoff', 'fixtures', name), 'utf8')) as T;

interface ParityCase { src: string; reading: string; occasion: string; styles: [string, number][]; boldness: string;
  second_look: SecondLookInput | null; tune?: string; season?: 'warm' | null; graded_look?: string | string[] | null }
const P = fixture<{ readings: Record<string, Reading>; cases: ParityCase[] }>('parts_parity.json');
const RP = fixture<{ readings: Record<string, Reading> }>('rubric_parity.json');
const readingOf = (id: string): Reading => P.readings[id] ?? RP.readings[id]!;
const R = (k: keyof typeof t69.readings): Reading => JSON.parse(JSON.stringify(t69.readings[k])) as Reading;

const V16 = createParts(PARTS_DATA);
const V15 = createParts(partsDataFor(true, true, false));

// ------------------------------------------------------------------ the oracle: whyParts as it was before T69 (v15 rows)
interface OracleInput { overall: number; averageUnrounded: number; earnedBonus: number; piledPenalty?: number; floored: boolean;
  parts: Partial<Record<PartName, PartResult>>; weightsUsed: Partial<Record<PartName, number>>; condition: PartsCondition; occasion: PartsOccasion }
function oracleWhyParts(res: OracleInput, opts: { occasion: OccasionKey; readsAs: StyleKey | null; gainPart: PartName | null }) {
  const D = partsDataFor(true, true, false);
  const r2 = (x: number) => Math.round(x * 100) / 100;
  const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const partText = (x: number | null) => (x === null ? '—' : x.toFixed(1));
  const order = D.partOrder as readonly PartName[];
  const names = D.partNames as Record<PartName, string>;
  const wsum = order.reduce((s, k) => s + (res.weightsUsed[k] ?? 0), 0) || 1;
  const strip = order.map((k) => ({ part: k, label: names[k], display: res.parts[k]?.display ?? null, gain: opts.gainPart === k && res.parts[k]?.display != null }));
  const groups = order.map((k) => {
    const p = res.parts[k];
    const display = p?.display ?? null;
    const rows: WhyRow[] = [];
    if (p && display !== null) {
      for (const [i, x] of p.reasons.entries()) rows.push({ key: `${k}-${i}`, rule: cap(x.line), amount: r2(x.points), zero: 'plusMinus' });
      const pre = D.base + p.reasons.reduce((s, x) => s + x.points, 0);
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
  const average = Math.round(res.averageUnrounded * 10) / 10;
  const after: WhyRow[] = [];
  if (res.earnedBonus > 0) after.push({ key: 'bonus', rule: t('pwhy.bonus'), amount: r2(res.earnedBonus) });
  const piled = res.piledPenalty ?? 0;
  if (piled > 0) after.push({ key: 'piled', rule: t('pwhy.piled'), amount: -r2(piled) });
  const cond = res.condition;
  const unsure = (cond.tips ?? []).map((x) => x.line).join('; ');
  after.push(cond.deduction > 0
    ? { key: 'condition', rule: t('pwhy.condition'), item: unsure ? `${cond.display}; ${unsure}` : cond.display, amount: -r2(cond.deduction) }
    : { key: 'condition', rule: t('pwhy.condition'), item: unsure || t('pwhy.conditionClean'), amount: 0, zero: 'plusMinus' });
  const pre = res.averageUnrounded + res.earnedBonus - piled - cond.deduction;
  let post = pre - res.occasion.deduction;
  if (res.occasion.ceiling !== null) post = Math.min(post, res.occasion.ceiling);
  if (post < pre - 1e-9) {
    after.push({ key: 'occasion', rule: occasionLabel(opts.occasion), item: `${res.occasion.status} · ${t('pwhy.partsAlone', { score: (Math.round(pre * 10) / 10).toFixed(1) })}`, amount: r2(post - pre) });
  }
  if (res.floored) after.push({ key: 'floor', rule: t('pwhy.floor', { occasion: occasionLabel(opts.occasion).toLowerCase() }), amount: r2(D.final.floor - post) });
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

// ------------------------------------------------------------------ the v16 rows
const ORDER = ['lift', 'minor', 'faults', 'condition', 'occasion', 'heavy', 'taste', 'clampTop', 'clampBottom', 'curve', 'ceiling', 'readsAs', 'rounding'];
const kindOf = (key: string) => (key.startsWith('lift-') ? 'lift' : key.startsWith('taste-') ? 'taste' : key);
const ROW = 0.005 + 1e-9; // a row may show its amount to two decimals
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Every rule of IMPLEMENTATION → Why for one v16 result; returns the problems ([] = the rows are right). */
function v16RowProblems(label: string, res: PartsScored, occasion: OccasionKey, readsAs: StyleKey | null = null): string[] {
  const v = res.v16;
  if (!v) return [`${label}: no v16 block`];
  const w = whyParts(res, { occasion, readsAs, gainPart: null });
  const bad: string[] = [];
  const say = (s: string) => bad.push(`${label}: ${s}`);
  if (w.start?.key !== 'start' || w.start?.valueText !== '7.0') say(`start row ${JSON.stringify(w.start)}`);
  const keys = w.after.map((r) => r.key);
  for (const k of keys) if (!ORDER.includes(kindOf(k))) say(`a row that isn't v16's: ${k}`);
  const kinds = keys.map(kindOf);
  for (let i = 1; i < kinds.length; i++) if (ORDER.indexOf(kinds[i]!) < ORDER.indexOf(kinds[i - 1]!)) say(`order ${keys.join(',')}`);
  const sum = w.after.reduce((s, r) => s + (r.amount ?? 0), 7);
  if (Math.abs(sum - res.overall) > 1e-6) say(`7 + rows = ${sum}, score ${res.overall}`);
  const ri = keys.indexOf('rounding');
  if (ri >= 0 && Math.abs(w.after[ri]!.amount ?? 0) > 0.25 + 0.006 * ri + 1e-9) say(`rounding ${w.after[ri]!.amount} after ${ri} rows`);
  const row = (k: string) => w.after.find((r) => r.key === k);
  /** Present when the step moved the score by a shown amount, absent when it didn't move it at all. */
  const step = (k: string, amount: number, extra?: (r: WhyRow) => void) => {
    const r = row(k);
    if (Math.abs(amount) >= 0.005 && !r) say(`${k} missing (amount ${amount})`);
    if (Math.abs(amount) < 1e-9 && r) say(`${k} shown with nothing to show`);
    if (r && Math.abs((r.amount ?? 0) - amount) > ROW) say(`${k} amount ${r.amount}, want ${amount}`);
    if (r && extra) extra(r);
  };
  const lifts = v.lifts.filter((l) => l.size !== 0);
  if (keys.filter((k) => k.startsWith('lift-')).length !== lifts.length) say(`lift rows ${keys.filter((k) => k.startsWith('lift-'))} for ${lifts.length} lifts`);
  lifts.forEach((l, i) => step(`lift-${i}`, l.size, (r) => { if (r.rule !== cap(l.line)) say(`lift-${i} rule ${r.rule}`); }));
  step('minor', v.minor);
  step('faults', -v.faultDrop);
  const cond = row('condition');
  if (!cond || Math.abs((cond.amount ?? 0) + v.condDeduction) > ROW) say(`condition ${JSON.stringify(cond)} for ${v.condDeduction}`);
  step('occasion', -res.occasion.deduction);
  step('heavy', v.heavyLayer ? -v.heavyLayer[0] : 0);
  const taste = v.taste.filter((x) => x.points !== 0);
  if (keys.filter((k) => k.startsWith('taste-')).length !== taste.length) say(`taste rows for ${taste.length} rules`);
  taste.forEach((x, i) => step(`taste-${i}`, x.points));
  if ((v.rawUnclamped > 9.5) !== !!row('clampTop')) say(`clampTop ${!!row('clampTop')} at raw ${v.rawUnclamped}`);
  if ((v.rawUnclamped < 3.0) !== !!row('clampBottom')) say(`clampBottom ${!!row('clampBottom')} at raw ${v.rawUnclamped}`);
  if (v.rawUnclamped > 9.5) step('clampTop', v.raw - v.rawUnclamped);
  if (v.rawUnclamped < 3.0) step('clampBottom', v.raw - v.rawUnclamped);
  step('curve', v.curved - v.raw);
  if ((v.heldBy !== null) !== !!row('ceiling')) say(`ceiling ${!!row('ceiling')} with heldBy ${v.heldBy}`);
  if (v.heldBy !== null) {
    step('ceiling', res.rawUnrounded - v.curved, (r) => {
      const capRow = v.caps.find((c) => c.id === v.heldBy);
      if (capRow && r.item !== capRow.line) say(`ceiling item ${r.item}, want the cap's line ${capRow.line}`);
      if (v.heldBy === 'occasion' && r.item !== res.occasion.status) say(`ceiling item ${r.item}, want ${res.occasion.status}`);
    });
  }
  if (readsAs && !row('readsAs')) say('readsAs missing');
  return bad;
}

describe("Why's rows on v16 (T69-G10)", () => {
  it('T69-G10 · every v16 parity case: the rows add up, in order, with no floor row', () => {
    const v16 = P.cases.filter((c) => c.tune === 'v16');
    expect(v16.length).toBeGreaterThan(1000);
    const bad: string[] = [];
    let n = 0;
    let held = 0;
    let clamped = 0;
    for (const c of v16) {
      const res = V16.scoreParts(readingOf(c.reading), { occasion: c.occasion, styles: c.styles as Styles, boldness: c.boldness, secondLook: c.second_look,
        season: c.season ?? null, gradedLook: c.graded_look ?? null });
      if (res.overall === null) continue;
      n++;
      const s = res as PartsScored;
      if (s.v16?.heldBy) held++;
      if ((s.v16?.rawUnclamped ?? 0) > 9.5) clamped++;
      bad.push(...v16RowProblems(`${c.src} ${c.reading}@${c.occasion}`, s, c.occasion as OccasionKey));
      if (bad.length > 20) break;
    }
    expect(bad).toEqual([]);
    expect(n).toBeGreaterThan(1000);
    expect(held).toBeGreaterThan(0);
    expect(clamped).toBeGreaterThan(0);
  });

  it('T69-G10 · the named outfits: the 9.5 row on the top fit, the dealbreaker row, the warm-day layer', () => {
    const at = (k: keyof typeof t69.readings, season: 'warm' | null = null) => V16.scoreParts(R(k), { occasion: 'everyday', season }) as PartsScored;
    for (const [k, s] of [['PLAIN', null], ['BOXY', null], ['TOP9', null], ['BRIGHTS', null], ['PUFFER', 'warm']] as const) {
      expect(v16RowProblems(k, at(k, s), 'everyday', 'minimalist')).toEqual([]);
    }
    const keys = (res: PartsScored) => whyParts(res, { occasion: 'everyday', readsAs: null, gainPart: null }).after.map((r) => r.key);
    // TOP9: raw 9.625 clamped to 9.5 (the 9.5 row), then the curve to 8.75, rounded to 9.0
    const top = whyParts(at('TOP9'), { occasion: 'everyday', readsAs: null, gainPart: null });
    expect(top.total).toBe(9.0);
    expect(Math.abs((top.after.find((r) => r.key === 'clampTop')?.amount ?? NaN) + 0.125)).toBeLessThanOrEqual(ROW);
    expect(keys(at('TOP9')).filter((k) => !k.startsWith('lift-') && !k.startsWith('taste-'))).toEqual(['minor', 'condition', 'clampTop', 'curve', 'rounding']);
    // BRIGHTS: three brights, held by S4 at 4.5 (curved 7.053)
    const br = whyParts(at('BRIGHTS'), { occasion: 'everyday', readsAs: null, gainPart: null });
    const ceil = br.after.find((r) => r.key === 'ceiling');
    expect(ceil?.item).toBe('three bright colors at once: keep one, make the rest neutral');
    expect(Math.abs((ceil?.amount ?? NaN) - (4.5 - 7.053))).toBeLessThanOrEqual(ROW);
    expect(br.total).toBe(4.5);
    // PUFFER on a warm day: the heavy layer costs 0.5
    const pf = whyParts(at('PUFFER', 'warm'), { occasion: 'everyday', readsAs: null, gainPart: null });
    expect(pf.after.find((r) => r.key === 'heavy')?.amount).toBe(-0.5);
    expect(pf.total).toBe(6.5);
    // nothing clamped, nothing held: no 9.5 row, no ceiling row
    expect(keys(at('PLAIN')).some((k) => k === 'clampTop' || k === 'ceiling' || k === 'floor')).toBe(false);
    expect(keys(at('BOXY')).includes('clampTop')).toBe(false);
  });

  it('T69-G10 · an old v15 check keeps exactly the rows it had (the floor row included)', () => {
    const v15 = P.cases.filter((c) => !c.tune);
    let floored = 0;
    let n = 0;
    const bad: string[] = [];
    for (const [i, c] of v15.entries()) {
      const res = V15.scoreParts(readingOf(c.reading), { occasion: c.occasion, styles: c.styles as Styles, boldness: c.boldness, secondLook: c.second_look });
      if (res.overall === null) continue;
      const s = res as PartsScored;
      if (!s.floored && i % 40 !== 0) continue; // every floored check, and a sample of the rest
      if (s.floored) floored++;
      n++;
      const opts = { occasion: c.occasion as OccasionKey, readsAs: (s.styleLabel as StyleKey | null) ?? null, gainPart: null };
      const got = whyParts(s, opts);
      expect(got.start).toBeUndefined();
      if (JSON.stringify(got) !== JSON.stringify(oracleWhyParts(s, opts))) bad.push(`${c.src} ${c.reading}@${c.occasion}`);
      if (s.floored && !got.after.some((r) => r.key === 'floor')) bad.push(`${c.src}: floored without the floor row`);
      if (bad.length > 10) break;
    }
    expect(bad).toEqual([]);
    expect(floored).toBeGreaterThan(0);
    expect(n).toBeGreaterThan(100);
    // and the engine behind it is v15 (no v16 block), so these are the rows a stored v15 check shows
    expect((V15.scoreParts(R('BRIGHTS'), { occasion: 'everyday' }) as PartsScored).v16).toBeUndefined();
  });
});

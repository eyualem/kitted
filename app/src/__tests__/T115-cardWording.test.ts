// T115: How I scored names the look once (the "Reads as" row shows only when the Style part doesn't already say it).
// T115b: a rule the v16 score doesn't charge (unsteady: pants piling on the shoes, long sleeves, ribbed cuffs; waived:
// slides, runners, the narrow leg) never shows as a cost: not in Why's part rows or numbers, not in Kit's context, not as
// a re-check's "New: …" problem. Display only: the score, the ceiling rows and core are untouched.
// Made-up readings from the parity fixture (no person, no photo); scored by core, no network.
import {
  createParts, PARTS_DATA, type PartName, type PartsScored, type Reading, type SecondLookInput, type Styles,
} from '@kitted/core';
import type { CheckDetails, OccasionKey } from '@/data/types';
import { chargedParts, unchargedChecks } from '@/features/why/charged';
import { newProblemLines } from '@/features/fitcheck/explain';
import { whyParts } from '@/features/why/partsRows';

const fs = jest.requireActual('fs') as { readFileSync(p: string, e: string): string };
const path = jest.requireActual('path') as { resolve(...p: string[]): string };
const fixture = <T,>(name: string): T => JSON.parse(fs.readFileSync(path.resolve('..', 'handoff', 'fixtures', name), 'utf8')) as T;
interface ParityCase { src: string; reading: string; occasion: string; styles: [string, number][]; boldness: string;
  second_look: SecondLookInput | null; tune?: string; season?: 'warm' | null; graded_look?: string | string[] | null }
const P = fixture<{ readings: Record<string, Reading>; cases: ParityCase[] }>('parts_parity.json');
const RP = fixture<{ readings: Record<string, Reading> }>('rubric_parity.json');
const V16 = createParts(PARTS_DATA);
const cases = P.cases.filter((c) => c.tune === 'v16').filter((_, i) => i % 2 === 0);

function score(c: ParityCase): PartsScored | null {
  const res = V16.scoreParts(P.readings[c.reading] ?? RP.readings[c.reading]!, { occasion: c.occasion, styles: c.styles as Styles, boldness: c.boldness,
    secondLook: c.second_look, season: c.season ?? null, gradedLook: c.graded_look ?? null });
  return res.overall === null ? null : (res as PartsScored);
}
const costRows = (w: ReturnType<typeof whyParts>) => w.groups.flatMap((g) => g.rows.filter((r) => (r.amount ?? 0) < 0).map((r) => r.rule.toLowerCase()));
const lineOf = (s: PartsScored, check: string) => Object.values(s.parts).flatMap((p) => p.reasons).find((r) => r.check === check)!.line;

describe('T115 · the look is named once', () => {
  it('T115 · the "Reads as" row shows exactly when the Style part has no "reads as" line of its own', () => {
    let shown = 0;
    let hidden = 0;
    for (const c of cases) {
      const s = score(c);
      if (!s) continue;
      const w = whyParts(s, { occasion: c.occasion as OccasionKey, readsAs: 'streetwear', gainPart: null });
      const styleSays = s.parts.cohesion?.reasons.some((r) => /^reads as/i.test(r.line)) ?? false;
      const row = w.after.some((r) => r.key === 'readsAs');
      expect(row).toBe(!styleSays);
      if (row) shown++; else hidden++;
      // never two places naming the look
      const names = w.groups.flatMap((g) => g.rows).filter((r) => /^reads as/i.test(r.rule)).length + (row ? 1 : 0);
      expect(names).toBeLessThanOrEqual(1);
    }
    expect(shown).toBeGreaterThan(0);
    expect(hidden).toBeGreaterThan(0);
  });
});

describe('T115b · a rule the score does not charge never shows as a cost', () => {
  it('T115b · Why shows no row, and no number, for an unsteady or waived rule; the rows still add up and no score moves', () => {
    let pooling = 0;
    let checked = 0;
    for (const c of cases) {
      const s = score(c);
      if (!s) continue;
      const uncharged = unchargedChecks(s.v16);
      if (uncharged.size === 0) continue;
      checked++;
      const before = JSON.stringify(s);
      const w = whyParts(s, { occasion: c.occasion as OccasionKey, readsAs: null, gainPart: null });
      expect(JSON.stringify(s)).toBe(before); // the stored result is never edited
      const costs = costRows(w);
      for (const check of uncharged) {
        const seen = Object.values(s.parts).some((p) => p.reasons.some((r) => r.check === check && r.points < 0));
        if (!seen) continue;
        expect(costs).not.toContain(lineOf(s, check).charAt(0).toUpperCase() + lineOf(s, check).slice(1).toLowerCase());
        expect(w.groups.flatMap((g) => g.rows).map((r) => r.rule.toLowerCase())).not.toContain(lineOf(s, check).toLowerCase());
        if (check === 'FF7_pooling') pooling++;
      }
      // each part adds up again: 7 + its rows = its number; the strip shows the same number
      for (const g of w.groups) {
        if (g.display === null) continue;
        expect(Math.abs(7 + g.rows.reduce((t, r) => t + (r.amount ?? 0), 0) - g.display)).toBeLessThan(0.51); // the half-point rounding row is inside rows
        expect(w.strip.find((x) => x.part === g.part)?.display).toBe(g.display);
      }
      // the score and every row after the parts are the engine's own
      expect(w.total).toBe(s.overall);
      expect(Math.abs(w.after.reduce((t, r) => t + (r.amount ?? 0), 7) - s.overall)).toBeLessThan(1e-6);
    }
    expect(checked).toBeGreaterThan(50);
    expect(pooling).toBeGreaterThan(5);
  });

  it('T115b · a part held down only by an uncharged rule shows 7.0 (pooling −0.5 on Fit: 6.5 becomes 7.0), and a dealbreaker-owned charge stays', () => {
    const own = cases.map(score).filter((s): s is PartsScored => !!s);
    const pool = own.find((s) => s.parts.fit.reasons.length === 1 && s.parts.fit.reasons[0]!.check === 'FF7_pooling' && s.parts.fit.display !== null && s.parts.fit.display < 7 && unchargedChecks(s.v16).has('FF7_pooling'));
    expect(pool).toBeDefined();
    const fit = chargedParts(pool!).parts.fit!;
    expect(fit.reasons).toEqual([]);
    expect(fit.display).toBe(7);
    expect(pool!.parts.fit.reasons).toHaveLength(1); // the engine's own result stays whole
    // a charge a dealbreaker owns (a clash) is not hidden: that cap is its cost
    const clash = own.find((s) => s.v16!.owned.includes('CC2_bright_clash') && s.v16!.caps.some((k) => k.id === 'S4' && k.kind !== 'clash'));
    if (clash) expect(unchargedChecks(clash.v16).has('CC2_bright_clash')).toBe(false);
  });

  it('T115b · a check scored before v16 comes back exactly as it was', () => {
    const s = own16()[0]!;
    const old = { ...s, v16: undefined };
    expect(chargedParts(old)).toBe(old);
  });

  it('T115b · a re-check does not call an uncharged rule a new problem', () => {
    const s = own16().find((x) => x.v16!.owned.includes('FF7_pooling') && unchargedChecks(x.v16).has('FF7_pooling'))!;
    const details = { parts: { ...s, gainPart: null } } as unknown as Pick<CheckDetails, 'parts'>;
    const line = lineOf(s, 'FF7_pooling').toLowerCase();
    expect(newProblemLines(['fit:FF7_pooling'], details)).toEqual([]);
    expect(newProblemLines(['fit:FF7_pooling'], details)).not.toContain(line);
    // a charged problem is still named
    const charged = own16().find((x) => x.parts.cohesion.reasons.some((r) => r.points < 0 && !unchargedChecks(x.v16).has(r.check)))!;
    const cr = charged.parts.cohesion.reasons.find((r) => r.points < 0)!;
    expect(newProblemLines([`cohesion:${cr.check}`], { parts: { ...charged, gainPart: null } } as unknown as Pick<CheckDetails, 'parts'>)).toEqual([cr.line]);
  });
});

function own16(): PartsScored[] {
  return cases.map(score).filter((s): s is PartsScored => !!s);
}
void ({} as PartName);

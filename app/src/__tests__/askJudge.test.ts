// Round 2, J (07 §15.6): the rules judge the chat's outfits, on the full scenario's closet. Nothing calls Google.
import { dayKey, localParts, outfitReading, scoreParts, US_EASTERN, type ClosetItem } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import type { KittedStore } from '@/data/store';
import { loadScenario } from '@/data/seedLoader';
import type { ClosetItemRow, FactRow, FitCheckRow } from '@/data/types';
import { buildStylistContext } from '@/features/ask/context';
import { buildEvidence } from '@/features/ask/evidence';
import { avoidedIds, avoidsPhrase, CANT_TELL_ALWAYS, judgeOutfit } from '@/features/ask/judge';
import { verdictClash } from '@/features/ask/pipeline';
import { EXAMPLES, guideFor, stripMarks, type AskKind } from '@/features/ask/prompt';
import { routeQuestion } from '@/features/ask/router';
import { loadStylistSnapshot } from '@/features/ask/snapshot';
import { STYLIST_GUIDE } from '@/features/ask/guide.generated';
import { manualClock } from '@/services/clock';

declare const __dirname: string;
const { readFileSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');

const NOW = Date.parse('2026-10-22T12:30:00-04:00');

async function setup(facts: Partial<FactRow>[] = []) {
  const store = createMemoryStore();
  const clock = manualClock(NOW);
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: Date.parse('2026-10-22T12:04:00-04:00') });
  for (const [i, f] of facts.entries()) await store.facts.put({ id: `FX${i}`, key: 'fit_avoid', value: '', source: 'told', createdAt: NOW - 1000, isDeleted: false, ...f } as FactRow);
  return { store, clock };
}

async function evidenceFor(store: KittedStore, clock: ReturnType<typeof manualClock>, q: string) {
  const snap = await loadStylistSnapshot(store, clock);
  const ctx = buildStylistContext(snap, q);
  const today = dayKey(snap.nowMs, snap.zone);
  const route = routeQuestion(q, { closet: snap.closet, checks: snap.checks, context: ctx, dayOf: (c: FitCheckRow) => ({ dow: localParts(c.createdAt, snap.zone).dow, today: c.dayKey === today }) });
  const ev = await buildEvidence(route, snap, ctx, { readingOf: async () => null, starterMarks: [] });
  return { ev, route, snap };
}

const byName = (closet: readonly ClosetItemRow[], n: string) => {
  const c = closet.find((x) => x.name === n);
  if (!c) throw new Error(`no ${n}`);
  return c;
};

describe('J1 · rule outcomes come from the parts engine', () => {
  it('on every outfit of a top, pants and shoes from the closet (with a layer, and pants + shoes alone), the judgement is the engine\'s own reasons', async () => {
    const { store } = await setup();
    const closet = (await store.closet.all()).filter((c) => !c.isDeleted);
    const tops = closet.filter((c) => c.garment.category === 'top');
    const bottoms = closet.filter((c) => c.garment.category === 'bottom');
    const shoes = closet.filter((c) => c.garment.category === 'footwear');
    const outfits: ClosetItemRow[][] = [];
    for (const b of bottoms) for (const s of shoes) outfits.push([b, s]);
    for (const t of tops) for (const b of bottoms) outfits.push([t, b, shoes[(tops.indexOf(t) + bottoms.indexOf(b)) % shoes.length]!]);
    const outers = closet.filter((c) => c.garment.category === 'outerwear');
    for (const l of outers) for (const t of tops) outfits.push([t, bottoms[tops.indexOf(t) % bottoms.length]!, shoes[tops.indexOf(t) % shoes.length]!, l]);
    expect(outfits.length).toBeGreaterThanOrEqual(40);
    for (const o of outfits) {
      for (const occ of ['everyday', 'interview'] as const) {
        const j = judgeOutfit(o, occ, null)!;
        const r = scoreParts(outfitReading(o as unknown as ClosetItem[]), { occasion: occ, styles: [], boldness: 'a_little' });
        if (r.overall === null) throw new Error('unscored');
        const lines = Object.values(r.parts).flatMap((p) => p.reasons).filter((x) => !/waist|tuck|pool|hem|stack|length|long|break/i.test(x.check));
        expect(j.problems.filter((p) => !r.occasion.lines.some((l) => l.startsWith(p))).sort()).toEqual([...new Set(lines.filter((x) => x.points < 0).map((x) => x.line))].sort());
        expect(j.works.sort()).toEqual([...new Set(lines.filter((x) => x.points > 0).map((x) => x.line))].sort());
        // Never a number, never the assumed waist credit, always what a closet can't know.
        for (const l of [...j.works, ...j.problems]) expect(l).not.toMatch(/\d\.\d/);
        expect(j.works.join(' ')).not.toMatch(/gives it a waist/);
        expect(j.cantTell[0]).toBe(CANT_TELL_ALWAYS);
      }
    }
  });

  it('grades the verdict: yes, depends (a better swap), no (a big charge or an occasion hold)', async () => {
    const { store } = await setup();
    const c = await store.closet.all();
    const n = (x: string) => byName(c, x);
    expect(judgeOutfit([n('Light-blue oxford'), n('Khaki chinos'), n('Black Chelsea boots'), n('Navy overshirt')], 'everyday', null)!.verdict).toBe('yes');
    const slim = judgeOutfit([n('White tee'), n('Dark jeans'), n('Grey runners')], 'everyday', null)!;
    expect(slim.verdict).toBe('depends');
    expect(slim.problems).toEqual(['the slim jeans would balance better with a straight leg']);
    const interview = judgeOutfit([n('White tee'), n('Khaki chinos'), n('White sneakers')], 'interview', null)!;
    expect(interview.verdict).toBe('no');
    expect(interview.problems.join(' ')).toMatch(/an interview wants a collared shirt, a knit or a jacket/);
    const skinny = { ...n('Dark jeans'), id: 'BX', garment: { ...n('Dark jeans').garment, leg_shape: 'skinny' } } as ClosetItemRow;
    expect(judgeOutfit([n('White tee'), skinny, n('White sneakers')], 'everyday', null)!.verdict).toBe('no');
  });

  it('"can I wear" evidence carries the judgement and its verdict', async () => {
    const { store, clock } = await setup();
    const { ev, route } = await evidenceFor(store, clock, 'Does the navy crewneck work with the dark jeans?');
    expect(route.kind).toBe('canIWear');
    expect(ev.verdict).toBe('depends');
    expect(ev.text).toMatch(/What the app's rules say about it \(verdict: depends\)/);
    expect(ev.text).toMatch(/- Problem: the slim jeans would balance better with a straight leg/);
    expect(ev.text).toMatch(/Can't tell without a photo: how the hem meets the shoes/);
  });
});

describe('J2 · no number for an outfit without a photo', () => {
  it.each(['Does the navy crewneck work with the dark jeans?', 'Can I wear white sneakers to an interview?', 'What goes with my olive overshirt?', 'What should I wear today?'])('%s', async (q) => {
    const { store, clock } = await setup();
    const { ev } = await evidenceFor(store, clock, q);
    expect(ev.text).not.toMatch(/(?:^|[^\d.])(?:10|\d)\.\d(?!\d)/);
  });
});

describe('J3 · what he avoids is a filter, not just words', () => {
  it('"skinny jeans" and "slim" rule pieces out by leg; "yellow" by color; a deleted fact rules nothing out', async () => {
    const { store } = await setup();
    const c = await store.closet.all();
    const f = (key: string, value: string, extra: Partial<FactRow> = {}) => ({ id: value, key, value, source: 'told', createdAt: 0, isDeleted: false, ...extra }) as FactRow;
    const names = (facts: FactRow[]) => [...avoidedIds(c, facts)].map((id) => c.find((x) => x.id === id)!.name).sort();
    expect(names([f('fit_avoid', 'You avoid skinny jeans')])).toEqual([]);
    expect(names([f('fit_avoid', 'You avoid slim pants')])).toEqual(['Dark jeans', 'Navy chinos']);
    expect(names([f('color_avoid', 'You avoid navy')])).toEqual(['Navy chinos', 'Navy crewneck', 'Navy overshirt']);
    expect(names([f('color_avoid', 'You avoid navy', { isDeleted: true })])).toEqual([]);
    expect(names([f('color_avoid', 'You avoid navy', { source: 'guess' })])).toEqual([]);
    expect(avoidsPhrase('a navy polo', [f('color_avoid', 'You avoid navy')])).toBe(true);
    expect(avoidsPhrase('dark straight jeans', [f('fit_avoid', 'You avoid skinny jeans')])).toBe(false);
  });

  it('no outfit or buy in the evidence uses what he avoids', async () => {
    const { store, clock } = await setup([{ key: 'color_avoid', value: 'You avoid navy' }]);
    for (const q of ['What should I wear today?', 'What goes with my khaki chinos?', 'What should I buy next?']) {
      const { ev } = await evidenceFor(store, clock, q);
      expect([q, ev.text.toLowerCase().includes('navy')]).toEqual([q, false]);
    }
  });

  it('a piece he names himself is still used', async () => {
    const { store, clock } = await setup([{ key: 'color_avoid', value: 'You avoid navy' }]);
    const { ev } = await evidenceFor(store, clock, 'What goes with my navy overshirt?');
    expect(ev.text.toLowerCase()).toMatch(/navy overshirt/);
  });
});

describe('J4 · the guide and the rules agree', () => {
  const rules = readFileSync(join(__dirname, '../../../rubric/v5-styles.md'), 'utf8');
  const ids = new Set([...rules.matchAll(/\[([A-Z]{3}-\d+)\]/g)].map((m) => m[1]!));
  it('every "(scored…)" mark in the guide names rule IDs that exist', () => {
    const marks = [...STYLIST_GUIDE.matchAll(/^- .*\*\*\((scored[^)]*)\)\*\*/gm)].map((m) => m[1]!);
    expect(marks.length).toBeGreaterThanOrEqual(18);
    for (const m of marks) {
      const named = [...m.matchAll(/\b([A-Z]{3}-\d+)\b/g)].map((x) => x[1]!);
      expect([m, named.length > 0]).toEqual([m, true]);
      for (const id of named) expect([m, id, ids.has(id)]).toEqual([m, id, true]);
    }
  });
  it('the model never sees the marks or a rule ID', () => {
    const kinds: AskKind[] = ['explain', 'whatIf', 'goesWith', 'whatToWear', 'canIWear', 'buyNext', 'fitHowTo', 'shape', 'remember', 'feedback', 'general'];
    for (const k of kinds) {
      const g = guideFor(k);
      expect(g).not.toMatch(/\(scored|\(tip\b|\b[A-Z]{3}-\d+\b/);
    }
    expect(stripMarks('Hem it. **(scored; FIT-4)** Then cuff. **(tip)**')).toBe('Hem it. Then cuff.');
  });
});

describe('J5 · the contradiction check', () => {
  it('a yes against a "no" from the rules clashes, and the other way; depends never clashes', () => {
    expect(verdictClash('no', 'yes')).toBe(true);
    expect(verdictClash('yes', 'no')).toBe(true);
    expect(verdictClash('no', 'no')).toBe(false);
    expect(verdictClash('depends', 'yes')).toBe(false);
    expect(verdictClash('depends', 'no')).toBe(false);
    expect(verdictClash('no', 'depends')).toBe(false);
    expect(verdictClash(undefined, 'yes')).toBe(false);
    expect(verdictClash('no', null)).toBe(false);
  });
  it('the prompt asks for the verdict and its example uses it', () => {
    expect(EXAMPLES.some((e) => JSON.parse(e.block).verdict === 'no')).toBe(true);
    for (const e of EXAMPLES) expect('verdict' in JSON.parse(e.block)).toBe(true);
  });
});

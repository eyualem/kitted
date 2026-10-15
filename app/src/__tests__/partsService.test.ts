// The fit check on the parts engine (#209), the default: new checks, corrections, the occasion re-score, the partial
// check, the re-check and the one quick tap all score with core scoreParts, and the fixes come from suggestPartsFixes.
// An old check (rubric v4.1) keeps its engine when it's edited. Numbers are checked against core directly, plus the
// demo story's own values.
import { applyTapAnswer, askQuestionParts, PARTS_RUBRIC_VERSION, RUBRIC_DATA, score, scoreParts, US_EASTERN, type Reading } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import type { KittedStore } from '@/data/store';
import { createFitCheckService, DEFAULT_TIMERS, engineOf } from '@/features/fitcheck/service';
import { scoringEngine } from '@/features/fitcheck/scoring';
import { whyParts } from '@/features/why/partsRows';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { demoImagePrep } from '@/services/imagePrep/demo';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { demoReadingById } from '@/services/readingSource/demoReadings';
import { realScheduler } from '@/services/scheduler';

const at = (iso: string) => Date.parse(iso);
const STYLES = seed.scenarios.firstRun.onboardingAnswers.styles as unknown as [string, number][];
const smart: [string, number][] = [[STYLES[0]![0], 1]];

async function setup(o: { now?: string; store?: KittedStore; tap?: boolean } = {}) {
  const store = o.store ?? createMemoryStore();
  const clock = manualClock(at(o.now ?? '2026-10-22T07:42:00-04:00'));
  const source = createMockReadingSource({ latency: () => 0, scheduler: realScheduler });
  const quota = createQuota({ store, clock, isPro: () => false });
  const svc = createFitCheckService({
    store, source, prep: demoImagePrep, quota, clock, scheduler: realScheduler, ids: counterIds(),
    timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }), tap: () => o.tap === true,
  });
  if (!(await store.profile.get('me'))) {
    await store.profile.put({
      id: 'me', birthYear: 2005, heightCm: 178, build: 'average', fitPreference: 'regular', styles: STYLES, boldness: null, budget: null,
      lastOccasion: 'everyday', consentVersion: '1', consentAt: clock.nowMs(), onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: clock.nowMs(),
    });
  }
  return { store, svc };
}

const parts = (r: Reading, occasion: string) => scoreParts(r, { occasion, styles: smart, boldness: 'a_little' }).overall;
const readingOf = async (store: KittedStore, id: string) => (await store.readings.get((await store.fitChecks.get(id))!.readingId!))!.reading;

describe('parts engine is the default (#209)', () => {
  it('the switch says parts', () => expect(scoringEngine()).toBe('parts'));

  // parts v8 (#228): p01b is 7.5 (v7 8.0): a short tee over STRAIGHT chinos earns the waist break at +0.5, not +1.5
  it('p01b at Date: 7.5 from the parts, stored with its parts and the parts version; no fix, the next level line', async () => {
    const { store, svc } = await setup();
    const { checkId } = (await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
    const row = (await store.fitChecks.get(checkId))!;
    expect([row.score, row.rubricVersion, engineOf(row)]).toEqual([7.5, PARTS_RUBRIC_VERSION, 'parts']);
    expect(row.score).toBe(parts(demoReadingById('p01b')!, 'date'));
    const p = row.details.parts!;
    expect([p.parts.proportions.display, p.parts.fit.display, p.parts.shoes.display, p.earnedBonus]).toEqual([7.5, 7, 8, 0]);
    expect(row.fixes).toEqual([]);
    expect(row.explanation).toBe('No quick fixes for this one.');
    expect(row.details.nextLevel![0]).toMatch(/^One quiet color/);
    expect([row.details.tipLead, p.gainPart]).toEqual(['nextLevel', 'color']);
  });

  // parts v8 (#228): cuffing lifts the wide jeans off the slides (no drag), and a free move leads a first check
  it('ph8 (slides): 6.5; the fix is the parts engine\'s, with the parts it raises', async () => {
    const { store, svc } = await setup();
    const { checkId } = (await svc.start({ mode: 'check', photoId: 'ph8', occasion: 'everyday' })) as { checkId: string };
    const row = (await store.fitChecks.get(checkId))!;
    expect(row.score).toBe(6.5);
    expect(row.fixes.map((f) => [f.copy, f.to, f.engine])).toEqual([['Cuff your jeans once', 7, 'parts']]);
    expect(row.fixes[0]!.tag).toMatch(/^Raises Shoes to 5 · free/);
    expect(row.explanation).toBe('Good base. One easy change gets you to 7.0.');
    expect(row.details.tipLead).toBe('nextLevel');
    expect(row.details.parts!.gainPart).toBe('shoes');
  });

  it('the Why rows add up to the score for the demo readings at every occasion', () => {
    for (const id of ['p01a', 'p01b', 's24', 'ph8', 'ph1', 's14', 's25']) {
      const r = demoReadingById(id);
      if (!r) continue;
      for (const occasion of ['everyday', 'date', 'interview', 'gym', 'going_out']) {
        const res = scoreParts(r, { occasion, styles: smart, boldness: 'a_little' });
        if (res.overall === null) continue;
        const w = whyParts(res, { occasion: occasion as never, readsAs: null, gainPart: null });
        const sum = w.after.reduce((s, x) => s + (x.amount ?? 0), w.average);
        expect(Math.round(sum * 100) / 100).toBe(res.overall);
        for (const g of w.groups) {
          if (g.display === null) continue;
          const t = g.rows.reduce((s, x) => s + (x.amount ?? 0), 7);
          expect(Math.round(t * 100) / 100).toBe(g.display);
        }
      }
    }
  });

  it('parts v8 (#228): "Problems in more than one part" is its own Why row, and the rows still add up', () => {
    // a made-up outfit (no person): a loud bright logo tee that pulls, skinny ripped jeans that pull, running shoes
    const g = (o: Record<string, unknown>) => ({ pattern: 'solid', logo: 'none', volume: 3, leg_shape: 'na', hem: 'na', tucked: 'na', condition: 'clean',
      certainty: 'clear', length: 'na', pattern_scale: 'na', saturation: 'na', sleeve_end: 'na', strain: 'none', distressed_by_design: false, shows_below_outer: false, ...o });
    const r = { scene: { framing: 'full_body', shoes_visible: true, people_count: 1, mirror_selfie: false, lighting: 'good', clothed: 'fully' }, garments: [
      g({ category: 'top', subcategory: 'graphic_tee', color_family: 'orange', pattern: 'graphic', pattern_scale: 'large', saturation: 'bright', logo: 'large', strain: 'clear', tucked: 'none', length: 'mid_fly', sleeve_end: 'na' }),
      g({ category: 'bottom', subcategory: 'jeans', color_family: 'denim_mid', leg_shape: 'skinny', hem: 'slight_break', distressed_by_design: true, strain: 'clear' }),
      g({ category: 'footwear', subcategory: 'performance_runner', color_family: 'black' }),
    ] } as unknown as Reading;
    const res = scoreParts(r, { occasion: 'class', styles: smart, boldness: 'a_little' });
    if (res.overall === null) throw new Error('not scored');
    expect(res.piledPenalty).toBeGreaterThan(0);
    const w = whyParts(res, { occasion: 'class', readsAs: null, gainPart: null });
    expect(w.after.find((x) => x.key === 'piled')?.amount).toBe(-Math.round(res.piledPenalty * 100) / 100);
    const sum = w.after.reduce((s, x) => s + (x.amount ?? 0), w.average);
    expect(Math.round(sum * 100) / 100).toBe(res.overall);
    expect(Math.abs(w.after.find((x) => x.key === 'rounding')?.amount ?? 0)).toBeLessThanOrEqual(0.3);
  });

  it('a correction, the occasion and a closet pick all re-score with the parts engine', async () => {
    const { store, svc } = await setup();
    const { checkId } = (await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
    const res = await svc.saveCorrection(checkId, { garmentIndex: 1, field: 'leg_shape', value: 'wide' });
    expect(res!.after).toBe(parts(await readingOf(store, checkId), 'date'));
    const preview = await svc.previewLens(checkId, { occasion: 'interview' });
    expect(preview!.after).toBe(parts(await readingOf(store, checkId), 'interview'));
    const next = (await svc.changeLens(checkId, { occasion: 'interview' }))!;
    expect([next.score, next.rubricVersion]).toEqual([preview!.after, PARTS_RUBRIC_VERSION]);
  });

  it('a partial check (s24 at Everyday, full scenario) is partial on the parts engine; picking shoes re-scores it', async () => {
    const store = createMemoryStore();
    await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: at('2026-10-20T08:09:00-04:00') });
    const { svc } = await setup({ store, now: '2026-10-20T08:10:00-04:00' });
    const { checkId } = (await svc.start({ mode: 'check', photoId: 's24', occasion: 'everyday' })) as { checkId: string };
    const row = (await store.fitChecks.get(checkId))!;
    expect([row.isPartial, row.notRated, row.snapState, row.details.parts!.naParts]).toEqual([true, ['shoes'], 'pending', ['proportions', 'shoes']]);
    const picked = (await svc.pickShoes(checkId, 'S1'))!;
    expect([picked.isPartial, picked.snapState, picked.rubricVersion]).toEqual([false, 'closetPick', PARTS_RUBRIC_VERSION]);
    expect(picked.score).toBe(parts(await readingOf(store, checkId), 'everyday'));
  });

  it('an old check scored by v4.1 keeps v4.1 when he corrects it (history is never re-scored)', async () => {
    const store = createMemoryStore();
    await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: at('2026-10-20T08:09:00-04:00') });
    const { svc } = await setup({ store, now: '2026-10-20T08:10:00-04:00' });
    const old = (await store.fitChecks.all()).find((c) => c.status === 'scored' && c.readingId && !c.parentId)!;
    expect(engineOf(old)).toBe('v4');
    const reading = await readingOf(store, old.id);
    const i = reading.garments.findIndex((g) => g.category === 'top');
    await svc.saveCorrection(old.id, { garmentIndex: i, field: 'color_family', value: 'navy' });
    const after = (await store.fitChecks.get(old.id))!;
    expect([engineOf(after), after.details.parts]).toEqual(['v4', undefined]);
    expect(after.score).toBe(score(await readingOf(store, old.id), { occasion: after.occasion, styles: [[STYLES[0]![0], 1]], boldness: 'a_little' }).overall);
  });

  // #276: the "Not quite right?" preview runs the save's own evaluation, so the number shown is the number saved.
  it('the correction preview equals what Save gives, on a parts check and on an old v4 check', async () => {
    const { store, svc } = await setup();
    const { checkId } = (await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
    const draft = { garmentIndex: 1, field: 'leg_shape' as const, value: 'wide' };
    const shown = (await svc.previewCorrection(checkId, { draft }))!;
    const unchanged = (await store.fitChecks.get(checkId))!;
    expect(shown.before).toBe(unchanged.score);
    const saved = (await svc.saveCorrection(checkId, draft))!;
    expect(shown.after).toBe(saved.after);
    expect(shown.nextFix?.copy ?? null).toBe((await store.fitChecks.get(checkId))!.fixes[0]?.copy ?? null);

    const store2 = createMemoryStore();
    await loadScenario(store2, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: at('2026-10-20T08:09:00-04:00') });
    const { svc: svc2 } = await setup({ store: store2, now: '2026-10-20T08:10:00-04:00' });
    const old = (await store2.fitChecks.all()).find((c) => c.status === 'scored' && c.readingId && !c.parentId)!;
    expect(engineOf(old)).toBe('v4');
    const i = (await readingOf(store2, old.id)).garments.findIndex((g) => g.category === 'top');
    const d2 = { garmentIndex: i, field: 'color_family' as const, value: 'navy' };
    const shown2 = (await svc2.previewCorrection(old.id, { draft: d2 }))!;
    expect(engineOf((await store2.fitChecks.get(old.id))!)).toBe('v4');
    expect(shown2.after).toBe((await svc2.saveCorrection(old.id, d2))!.after);
  });

  it('the "this fix doesn\'t apply" preview names the fix Save leaves on the card', async () => {
    const { store, svc } = await setup();
    const { checkId } = (await svc.start({ mode: 'check', photoId: 'ph8', occasion: 'everyday' })) as { checkId: string };
    const target = (await store.fitChecks.get(checkId))!.fixes[0]!.target;
    const shown = (await svc.previewCorrection(checkId, { hideTarget: target }))!;
    const after = (await svc.hideFix(checkId, target))!;
    expect([shown.after, shown.nextFix?.copy ?? null]).toEqual([after.score, after.fixes[0]?.copy ?? null]);
  });

  it('a re-check compares parts with parts (p01b, then p01a with the overshirt on)', async () => {
    const { store, svc } = await setup();
    const { checkId } = (await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
    const rc = (await svc.start({ mode: 'recheck', photoId: 'p01a', parentCheckId: checkId })) as { checkId: string };
    const row = (await store.fitChecks.get(rc.checkId))!;
    expect([row.rubricVersion, row.details.recheck!.parentScore]).toEqual([PARTS_RUBRIC_VERSION, 7.5]); // v8
    expect(row.score).toBe(parts(await readingOf(store, rc.checkId), 'date'));
    expect(row.details.recheck!.delta).toBe(row.score! - 7.5);
  });

  it('the one quick tap: the question and its swing are the parts engine\'s (#212), and so are the answers\' scores', async () => {
    const { store, svc } = await setup({ tap: true });
    const r = await svc.start({ mode: 'check', photoId: 'ph1', occasion: 'everyday' });
    expect(r.outcome).toBe('asking');
    const id = (r as { checkId: string }).checkId;
    const row = (await store.fitChecks.get(id))!;
    const tap = row.details.tap!;
    const raw = await readingOf(store, id);
    for (const o of tap.options) {
      expect(o.score).toBe(parts(applyTapAnswer(raw, { garmentIndex: tap.garmentIndex, field: 'subcategory' }, o.value), 'everyday'));
    }
    const q = askQuestionParts(raw, { occasion: 'everyday', styles: smart, boldness: 'a_little' })!;
    expect([tap.pair, tap.swing, tap.default]).toEqual([q.pair, q.swing, q.default]);
    const answered = (await svc.answerTap(id, tap.options[0]!.value))!;
    expect([answered.score, answered.rubricVersion]).toEqual([tap.options[0]!.score, PARTS_RUBRIC_VERSION]);
  });

  it('Skip on a parts check keeps what was read, at its parts score, and the stored answer stays', async () => {
    const { store, svc } = await setup({ tap: true });
    const r = await svc.start({ mode: 'check', photoId: 'ph1', occasion: 'everyday' });
    const id = (r as { checkId: string }).checkId;
    const tap = (await store.fitChecks.get(id))!.details.tap!;
    const skipped = (await svc.answerTap(id, 'skip'))!;
    const kept = tap.options.find((o) => o.value === tap.default)!;
    expect([skipped.score, skipped.rubricVersion, skipped.details.tap!.skipped, skipped.details.tap!.answer]).toEqual([
      kept.score, PARTS_RUBRIC_VERSION, true, tap.default,
    ]);
    expect(skipped.score).toBe(parts(await readingOf(store, id), 'everyday'));
  });

  it('v4 rows still carry the v4 version string', () => expect(RUBRIC_DATA.version.startsWith('parts-')).toBe(false));
});

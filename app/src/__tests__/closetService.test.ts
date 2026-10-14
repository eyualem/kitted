// The closet write path (DECISIONS-LOG #91) end to end on the memory store: the closet call after the score
// card (pending → done), the fallback (slow / offline) and its catch-up, the cache, re-checks, shoe snaps,
// "Same as your …?" (Yes / No / the runner-up, re-answerable), "Not the same", Undo, corrections that follow the
// stored link, the founder's case, and the rule that the closet call never changes a score.
import { US_EASTERN, type Reading } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import type { KittedStore } from '@/data/store';
import type { ClosetItemRow, FitCheckRow } from '@/data/types';
import { isAutoNamed } from '@/features/closet/itemName';
import { profileOfItem } from '@/features/closet/profile';
import { createClosetService } from '@/features/closet/service';
import { createFitCheckService, DEFAULT_TIMERS } from '@/features/fitcheck/service';
import { manualClock } from '@/services/clock';
import { createMockClosetSource } from '@/services/closetSource/mock';
import type { ClosetResult, ClosetSource } from '@/services/closetSource/types';
import { counterIds } from '@/services/ids';
import { demoImagePrep } from '@/services/imagePrep/demo';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { demoReadingById } from '@/services/readingSource/demoReadings';
import type { ReadingSource } from '@/services/readingSource/types';
import { realScheduler } from '@/services/scheduler';
import type { GarmentMeasurer } from '@/services/measure/garments';
import { setScoringEngine } from '@/features/fitcheck/scoring';

// These stories assert rubric v4.1's numbers (the seed, expected_scores.json, the v4 demo story), so they run on the
// v4 path behind the switch (#209). The parts engine's flows are tested in partsService.test.ts.
beforeAll(() => setScoringEngine('v4'));
afterAll(() => setScoringEngine('parts'));

const at = (iso: string) => Date.parse(iso);
const STYLES = seed.scenarios.firstRun.onboardingAnswers.styles as unknown as [string, number][];

interface Opts {
  now?: string;
  scenario?: 'full';
  asOf?: string;
  closetSource?: ClosetSource | null;
  deadlineMs?: number;
  readings?: Record<string, Reading>;
  store?: KittedStore;
  idPrefix?: string;
  measure?: GarmentMeasurer | null;
}

/** A reading source that answers with given readings per demo photo id, else the bundled mock. */
function readingsSource(map: Record<string, Reading>): ReadingSource {
  const mock = createMockReadingSource({ latency: () => 0, scheduler: realScheduler });
  return {
    read(image, kind, o) {
      const r = image.photoId ? map[image.photoId] : undefined;
      if (!r || kind === 'shoeSnap') return mock.read(image, kind, o);
      return (async function* () {
        yield { type: 'reading' as const, reading: JSON.parse(JSON.stringify(r)) as Reading, model: 'test', promptVersion: 'v3' };
      })();
    },
  };
}

async function setup(o: Opts = {}) {
  const store = o.store ?? createMemoryStore();
  const clock = manualClock(at(o.now ?? '2026-10-22T07:42:00-04:00'));
  if (o.scenario === 'full') await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: at(o.asOf ?? '2026-10-22T07:41:00-04:00') });
  const counter = counterIds();
  const ids = (p: string) => `${o.idPrefix ?? ''}${counter(p)}`;
  const closetSource = o.closetSource === undefined ? createMockClosetSource() : o.closetSource;
  const closet = createClosetService({ store, clock, scheduler: realScheduler, ids, source: closetSource, deadlineMs: o.deadlineMs ?? 12_000, measure: o.measure });
  const quota = createQuota({ store, clock, isPro: () => true });
  const svc = createFitCheckService({
    store, source: o.readings ? readingsSource(o.readings) : createMockReadingSource({ latency: () => 0, scheduler: realScheduler }),
    prep: demoImagePrep, quota, clock, scheduler: realScheduler, ids, closet,
    timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }), tap: () => true,
  });
  if (!(await store.profile.get('me'))) {
    await store.profile.put({
      id: 'me', birthYear: 2005, heightCm: 178, build: 'average', fitPreference: 'regular', styles: STYLES, boldness: null, budget: null,
      lastOccasion: 'everyday', consentVersion: '1', consentAt: clock.nowMs(), onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: clock.nowMs(),
    });
  }
  const check = async (photoId: string, occasion: 'date' | 'everyday' = 'date') => {
    const r = (await svc.start({ mode: 'check', photoId, occasion })) as { checkId: string; outcome: string };
    return r.checkId;
  };
  const row = async (id: string) => (await store.fitChecks.get(id))!;
  const owned = async () => (await store.closet.all()).filter((c) => !c.isDeleted && !c.mergedInto);
  return { store, clock, svc, closet, check, row, owned };
}

/** A closet source we answer by hand. */
function heldSource() {
  const pending: { resolve: (r: ClosetResult) => void; stubs: unknown }[] = [];
  let calls = 0;
  const mock = createMockClosetSource();
  const src: ClosetSource = {
    read(image, stubs, kind) {
      calls += 1;
      return new Promise((resolve) => {
        pending.push({ stubs, resolve: (r) => resolve(r) });
        void image;
        void kind;
      });
    },
  };
  return {
    src,
    calls: () => calls,
    /** Answer the oldest call with the bundled answer for that photo. */
    async answer(photoId: string) {
      const p = pending.shift()!;
      p.resolve(await mock.read({ photoId, sha256: '', uploadUri: null }, p.stubs as never, 'full'));
    },
    fail() {
      pending.shift()!.resolve({ fail: 'offline' });
    },
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('the closet call after the score card', () => {
  it('pending → done: nothing written while the call is out, then the closet with the details; the score never moves', async () => {
    const held = heldSource();
    const env = await setup({ closetSource: held.src });
    const id = await env.check('p01b');
    let row = await env.row(id);
    expect([row.score, row.details.closetSummary?.state, row.itemIds, await env.store.closet.all()]).toEqual([8, 'pending', [], []]);
    await held.answer('p01b');
    await env.closet.settle();
    row = await env.row(id);
    expect(row.details.closetSummary?.state).toBe('done');
    expect(row.score).toBe(8);
    const names = (await env.owned()).map((c) => c.name).sort();
    expect(names).toEqual(['Beige overshirt', 'Tan chinos', 'White leather sneakers', 'White tee']);
    const chinos = (await env.owned()).find((c) => c.slot === 'bottom')!;
    expect(chinos.art).toMatchObject({ family: 'tan_camel', details: ['belt_loops'] });
    const obs = await env.store.closetObs.all();
    expect(obs.filter((o) => o.closet !== null)).toHaveLength(2); // tee + chinos were described; the sneakers weren't in the test's stubs
    expect(row.details.closetSummary!.links!.map((l) => [l.origin, l.index])).toEqual([['garment', 0], ['garment', 1], ['garment', 2], ['held', 0]]);
    expect((await env.store.readings.all()).filter((r) => r.source === 'closet')).toHaveLength(1);
  });

  it('slower than the deadline: written from the v3 fields (fallback), then the late answer enriches it', async () => {
    const held = heldSource();
    const env = await setup({ closetSource: held.src, deadlineMs: 20 });
    const id = await env.check('p01b');
    await sleep(40);
    let row = await env.row(id);
    expect(row.details.closetSummary?.state).toBe('fallback');
    expect((await env.owned())).toHaveLength(4);
    expect((await env.store.closetObs.all()).every((o) => o.closet === null)).toBe(true);
    await held.answer('p01b');
    await env.closet.settle();
    row = await env.row(id);
    expect(row.details.closetSummary).toMatchObject({ state: 'done' });
    expect(row.details.closetSummary!.enrichedAt).toBeDefined();
    expect((await env.owned())).toHaveLength(4);
    expect((await env.store.closetObs.all()).filter((o) => o.closet !== null)).toHaveLength(2);
    expect(row.score).toBe(8);
  });

  it('offline: fallback now, then one catch-up on the next foreground (within 24 h)', async () => {
    let fail = true;
    const mock = createMockClosetSource();
    let calls = 0;
    const src: ClosetSource = { async read(...a) { calls += 1; return fail ? { fail: 'offline' } : mock.read(...a); } };
    const env = await setup({ closetSource: src });
    const id = await env.check('p01b');
    await env.closet.settle();
    expect((await env.row(id)).details.closetSummary?.state).toBe('fallback');
    expect(await env.owned()).toHaveLength(4);
    fail = false;
    expect(await env.closet.catchUp()).toBe(1);
    const row = await env.row(id);
    expect(row.details.closetSummary?.state).toBe('done');
    expect((await env.store.closetObs.all()).filter((o) => o.closet !== null)).toHaveLength(2);
    expect(await env.owned()).toHaveLength(4);
    // Once per launch, and never after 24 h.
    expect(await env.closet.catchUp()).toBe(0);
    expect(calls).toBe(2);
  });

  it('catch-up after he touched S11 only enriches (no re-match)', async () => {
    let fail = true;
    const mock = createMockClosetSource();
    const src: ClosetSource = { async read(...a) { return fail ? { fail: 'offline' } : mock.read(...a); } };
    const env = await setup({ closetSource: src });
    const id = await env.check('p01b');
    await env.closet.settle();
    const before = (await env.owned()).map((c) => c.id).sort();
    const tee = (await env.owned()).find((c) => c.name === 'White tee')!;
    await env.svc.setItemUndone(id, tee.id, true);
    fail = false;
    await env.closet.catchUp();
    const row = await env.row(id);
    expect(row.details.closetSummary).toMatchObject({ state: 'done', touched: true, undone: [tee.id] });
    expect((await env.store.closet.all()).map((c) => c.id).sort()).toEqual(before);
  });

  it('the same photo again reuses the stored closet answer: no second call', async () => {
    const mock = createMockClosetSource();
    const env = await setup({ closetSource: mock });
    await env.check('p01b');
    await env.closet.settle();
    const id2 = await env.check('p01b');
    expect((await env.row(id2)).details.closetSummary?.state).toBe('done');
    expect(mock.calls).toBe(1);
  });

  it('no closet source: written at once from the v3 fields (state fallback)', async () => {
    const env = await setup({ closetSource: null });
    const id = await env.check('p01b');
    expect((await env.row(id)).details.closetSummary).toMatchObject({ state: 'fallback', added: expect.any(Array) });
    expect((await env.row(id)).details.closetSummary!.added).toHaveLength(4);
  });
});

describe('against his closet (the full seed)', () => {
  it('p01b: T1 and S1 are the same pieces, B1 is a question; the score is the same before and after', async () => {
    const held = heldSource();
    const env = await setup({ scenario: 'full', closetSource: held.src });
    const id = await env.check('p01b');
    const scoreBefore = (await env.row(id)).score;
    await held.answer('p01b');
    await env.closet.settle();
    const row = await env.row(id);
    const cs = row.details.closetSummary!;
    expect(cs.matched).toEqual(['T1', 'S1']);
    expect(cs.asks!.map((a) => a.candidateId)).toEqual(['B1']);
    const flagged = (await env.store.closet.get(cs.asks![0]!.itemId))!;
    expect([flagged.maybeSameAs, flagged.name]).toEqual(['B1', 'Tan chinos']);
    expect((await env.store.closet.get('T1'))!.wornCount).toBe(seed.scenarios.full.closet.find((c) => c.id === 'T1')!.wornCount + 1);
    expect(row.score).toBe(scoreBefore);
    // A re-score of the same card (same occasion) still gives the same score.
    const again = await env.svc.changeLens(id, { occasion: row.occasion });
    expect(again!.score).toBe(scoreBefore);
  });

  it('"Yes, same one" merges into B1 (worn +1, the copy folded in); "No, a new one" undoes it; never re-asked', async () => {
    const env = await setup({ scenario: 'full' });
    const id = await env.check('p01b');
    await env.closet.settle();
    const ask = (await env.row(id)).details.closetSummary!.asks![0]!;
    const b1Worn = (await env.store.closet.get('B1'))!.wornCount;
    await env.svc.answerDuplicate(id, ask.obsId, 'same');
    let row = await env.row(id);
    expect(row.details.closetSummary!.matched).toContain('B1');
    expect(row.details.closetSummary!.added).not.toContain(ask.itemId);
    expect(row.itemIds).toContain('B1');
    expect((await env.store.closet.get(ask.itemId))).toMatchObject({ isDeleted: true, mergedInto: 'B1' });
    expect((await env.store.closet.get('B1'))!.wornCount).toBe(b1Worn + 1);
    expect((await env.store.closetObs.get(ask.obsId))).toMatchObject({ itemId: 'B1', decision: 'answeredSame' });
    const scoreAfterYes = row.score;
    await env.svc.answerDuplicate(id, ask.obsId, 'new');
    row = await env.row(id);
    expect(row.details.closetSummary!.added).toContain(ask.itemId);
    expect((await env.store.closet.get(ask.itemId))).toMatchObject({ isDeleted: false, mergedInto: null, maybeSameAs: null });
    expect((await env.store.closet.get('B1'))!.wornCount).toBe(b1Worn);
    expect((await env.store.closet.get('B1'))!.profile!.distinctFrom).toEqual([ask.itemId]);
    expect(row.score).toBe(scoreAfterYes);
    expect(await env.closet.openAsks()).toEqual([]);
    // The same chinos in a later photo: he said they're different, so B1 isn't asked about again.
    const id2 = await env.check('p01b');
    await env.closet.settle();
    expect((await env.row(id2)).details.closetSummary!.asks).toEqual([]);
  });

  it('"It\'s my …": the runner-up takes it', async () => {
    const env = await setup({ scenario: 'full' });
    // A second near-color pair: brown chinos next to tan (and khaki B1 on the other side).
    await env.store.closet.put({ ...(await env.store.closet.get('B1'))!, id: 'B9', name: 'Brown chinos', garment: { ...(await env.store.closet.get('B1'))!.garment, color_family: 'brown' }, confirmedFields: [] });
    const id = await env.check('p01b');
    await env.closet.settle();
    const ask = (await env.row(id)).details.closetSummary!.asks!.find((a) => a.runnerUpId)!;
    expect([ask.candidateId, ask.runnerUpId].sort()).toEqual(['B1', 'B9']);
    await env.svc.answerDuplicate(id, ask.obsId, 'runnerUp');
    expect((await env.store.closetObs.get(ask.obsId))!.itemId).toBe(ask.runnerUpId);
    expect((await env.store.closet.get(ask.itemId))!.mergedInto).toBe(ask.runnerUpId);
  });

  it('"Not the same" splits a matched piece into its own item; the two are never matched again', async () => {
    const env = await setup({ scenario: 'full' });
    const id = await env.check('p01b');
    await env.closet.settle();
    const cs = (await env.row(id)).details.closetSummary!;
    const tee = cs.links!.find((l) => l.itemId === 'T1')!;
    const worn = (await env.store.closet.get('T1'))!.wornCount;
    await env.svc.splitItem(id, tee.obsId);
    const after = (await env.row(id)).details.closetSummary!;
    const newId = after.links!.find((l) => l.obsId === tee.obsId)!.itemId;
    expect(newId).not.toBe('T1');
    expect(after.matched).not.toContain('T1');
    expect(after.added).toContain(newId);
    expect((await env.store.closet.get('T1'))!.wornCount).toBe(worn - 1);
    expect((await env.store.closet.get('T1'))!.profile!.distinctFrom).toContain(newId);
    // Two white tees now: the names tell them apart (the seed's keeps its name).
    const tees = (await env.owned()).filter((c) => c.garment.subcategory === 'tee' && c.garment.color_family === 'white').map((c) => c.name);
    expect(new Set(tees).size).toBe(tees.length);
  });
});

describe('re-check and shoe snap', () => {
  it('re-check: the overshirt (the fix) links to the piece the first check added; nothing is added twice', async () => {
    const env = await setup();
    const first = await env.check('p01b');
    await env.closet.settle();
    const items = (await env.owned()).map((c) => c.id).sort();
    const r = (await env.svc.start({ mode: 'recheck', photoId: 'p01a', parentCheckId: first })) as { checkId: string };
    await env.closet.settle();
    expect((await env.owned()).map((c) => c.id).sort()).toEqual(items);
    const cs = (await env.row(r.checkId)).details.closetSummary!;
    expect([cs.added, cs.matched.sort()]).toEqual([[], [...items]]);
    const overshirt = (await env.owned()).find((c) => c.slot === 'outer')!;
    expect(overshirt.wornCount).toBe(1); // same outfit, same day: one wear
    expect((await env.store.closetObs.all()).filter((o) => o.itemId === overshirt.id && o.decision !== 'undone')).toHaveLength(2);
    expect((await env.row(r.checkId)).score).toBe(9);
  });

  it('shoe snap: footwear only, linked from the first check', async () => {
    const env = await setup({ scenario: 'full', now: '2026-10-20T08:10:00-04:00', asOf: '2026-10-20T08:09:00-04:00' });
    const id = await env.check('s24', 'everyday');
    await env.closet.settle();
    const before = (await env.row(id)).details.closetSummary!.links!.length;
    await env.svc.start({ mode: 'shoeSnap', photoId: 's24', parentCheckId: id });
    await env.closet.settle();
    const cs = (await env.row(id)).details.closetSummary!;
    const snaps = cs.links!.filter((l) => l.origin === 'snap');
    expect(snaps).toHaveLength(1);
    expect(cs.links!.length).toBe(before + 1);
    const shoe = (await env.store.closet.get(snaps[0]!.itemId))!;
    expect(shoe.slot).toBe('shoes');
    expect((await env.row(id)).itemIds).toContain(shoe.id);
  });
});

describe('Undo and corrections follow the stored link', () => {
  it('Undo marks the sighting undone; Add back restores it', async () => {
    const env = await setup();
    const id = await env.check('p01b');
    await env.closet.settle();
    const link = (await env.row(id)).details.closetSummary!.links![0]!;
    await env.svc.setItemUndone(id, link.itemId, true);
    expect((await env.store.closetObs.get(link.obsId))!.decision).toBe('undone');
    expect((await env.store.closet.get(link.itemId))!.isDeleted).toBe(true);
    await env.svc.setItemUndone(id, link.itemId, false);
    expect((await env.store.closetObs.get(link.obsId))!.decision).toBe('new');
    expect((await env.row(id)).score).toBe(8);
  });

  it('a piece seen once is patched in place ("Saved to your tan chinos")', async () => {
    const env = await setup();
    const id = await env.check('p01b');
    await env.closet.settle();
    const r = await env.svc.saveCorrection(id, { garmentIndex: 1, field: 'leg_shape', value: 'slim' });
    expect(r!.itemName).toBe('Tan chinos');
    const chinos = (await env.owned()).find((c) => c.slot === 'bottom')!;
    expect([chinos.garment.leg_shape, chinos.confirmedFields]).toEqual(['slim', ['leg_shape']]);
  });

  it('the bug: a correction never recolors a piece seen in other photos; it relinks instead', async () => {
    // His light grey hoodie, seen twice; today's photo matched it, then he says today's is charcoal.
    const hoodie = { ...demoReadingById('s05')!, garments: demoReadingById('s05')!.garments.map((g, i) => (i === 0 ? { ...g, color_family: 'light_grey' } : g)) };
    const env = await setup({ readings: { s05: hoodie, s09: hoodie, s10: hoodie }, closetSource: null });
    await env.check('s05', 'everyday');
    await env.check('s09', 'everyday');
    const id = await env.check('s10', 'everyday');
    const lg = (await env.owned()).find((c) => c.garment.subcategory === 'hoodie')!;
    expect(lg.wornCount).toBe(3);
    const res = await env.svc.saveCorrection(id, { garmentIndex: 0, field: 'color_family', value: 'charcoal' });
    const after = (await env.store.closet.get(lg.id))!;
    expect([after.garment.color_family, after.wornCount]).toEqual(['light_grey', 2]);
    const link = (await env.row(id)).details.closetSummary!.links!.find((l) => l.index === 0)!;
    expect(link.itemId).not.toBe(lg.id);
    const charcoal = (await env.store.closet.get(link.itemId))!;
    expect([charcoal.garment.color_family, res!.itemName]).toEqual(['charcoal', charcoal.name]);
    expect(charcoal.name).toMatch(/^Charcoal/);
  });

  it('removing a misread piece takes it back out of the closet', async () => {
    const env = await setup();
    const id = await env.check('p01b');
    await env.closet.settle();
    const link = (await env.row(id)).details.closetSummary!.links!.find((l) => l.index === 0)!;
    await env.svc.saveCorrection(id, { garmentIndex: 0, remove: true });
    const cs = (await env.row(id)).details.closetSummary!;
    expect(cs.undone).toContain(link.itemId);
    expect(cs.links!.filter((l) => l.origin === 'garment').map((l) => l.index)).toEqual([0, 1]); // chinos and sneakers moved up
  });
});

describe("the shoe question's answer (ph8, #120 / #113)", () => {
  it('"Boots" confirms the kind on the shoes\' sighting, not the type code picked inside it', async () => {
    const env = await setup();
    const r = (await env.svc.start({ mode: 'check', photoId: 'ph8', occasion: 'class' })) as { checkId: string };
    expect((await env.row(r.checkId)).details.tap!.kind).toBe('shoes');
    await env.svc.answerTap(r.checkId, 'work_boot');
    await env.closet.settle();
    const shoes = (await env.owned()).find((c) => c.slot === 'shoes' || c.slot === 'footwear')!;
    const obs = (await env.store.closetObs.all()).find((o) => o.itemId === shoes.id)!;
    expect(obs.userConfirmed).toEqual({ shoeKind: 'boots' });
    expect(shoes.confirmedFields ?? []).not.toContain('subcategory');
    expect((await env.row(r.checkId)).score).toBe(8.5);
  });
});

describe("the founder's case (ph1, #59 / #85)", () => {
  async function answered(o: Opts = {}) {
    const env = await setup(o);
    const r = (await env.svc.start({ mode: 'check', photoId: 'ph1', occasion: 'everyday' })) as { checkId: string };
    await env.svc.answerTap(r.checkId, 'jeans');
    await env.closet.settle();
    return { ...env, id: r.checkId };
  }

  it('"Jeans" adds Black jeans with the type confirmed; the hoodie is a medium grey Nike hoodie', async () => {
    const env = await answered();
    const names = (await env.owned()).map((c) => c.name).sort();
    expect(names).toEqual(['Black jeans', 'Black slides', 'Medium grey Nike hoodie']);
    const jeans = (await env.owned()).find((c) => c.slot === 'bottom')!;
    expect(jeans.confirmedFields).toEqual(['subcategory']);
    const obs = (await env.store.closetObs.all()).find((o) => o.itemId === jeans.id)!;
    expect(obs.userConfirmed).toEqual({ subcategory: 'jeans' });
    const hoodie = (await env.owned()).find((c) => c.slot === 'top')!;
    expect(hoodie.art).toMatchObject({ family: 'grey', shade: 'grey|mid|-', brand: 'nike', details: ['drawstring', 'elastic_cuffs', 'front_pouch', 'hood'] });
    expect((await env.row(env.id)).score).toBe(6.5);
  });

  it('a second grey hoodie read as charcoal is its own piece (never merged, never drawn light)', async () => {
    const env = await answered();
    const ph1 = demoReadingById('ph1')!;
    const charcoal: Reading = { ...ph1, garments: [{ ...ph1.garments[0]!, color_family: 'charcoal' }] };
    const src: ClosetSource = {
      async read(_i, stubs) {
        return { reading: { garments: stubs.map((s) => ({ i: s.i, visible: true, box: [], shade: 'charcoal', lightness: 'dark', details: ['hood', 'front_pouch', 'drawstring'], logo_text: 'none', sleeve_length: 'long', shoe_profile: null, denim_wear: null })) }, model: 't', promptVersion: 'closet1', latencyMs: 0 };
      },
    };
    // The same phone, a later day, another photo.
    const env2 = await setup({ store: env.store, readings: { s05: charcoal }, closetSource: src, idPrefix: 'b', now: '2026-10-23T08:00:00-04:00' });
    const id = await env2.check('s05', 'everyday');
    await env2.closet.settle();
    const hoodies = (await env2.owned()).filter((c) => c.garment.subcategory === 'hoodie');
    expect(hoodies).toHaveLength(2);
    const dark = hoodies.find((h) => h.garment.color_family === 'charcoal')!;
    expect(dark.name).toBe('Charcoal hoodie');
    expect(dark.hex).not.toBe(hoodies.find((h) => h !== dark)!.hex);
    const cs = (await env2.row(id)).details.closetSummary!;
    expect(cs.matched).toEqual([]);
    // Grey vs charcoal (−2) and no logo vs his Nike one (−2) outweigh type + pattern: a new piece, not even a question.
    expect([cs.asks, cs.added]).toEqual([[], [dark.id]]);
    expect([dark.hex, hoodies.find((h) => h !== dark)!.hex]).toEqual(['#4A4D55', '#9CA0A6']);
  });
});

describe('the score never changes because of the closet', () => {
  it('every closet action leaves the card score as it was', async () => {
    const env = await setup({ scenario: 'full' });
    const id = await env.check('p01b');
    const s0 = (await env.row(id)) as FitCheckRow;
    await env.closet.settle();
    const cs = (await env.row(id)).details.closetSummary!;
    await env.svc.answerDuplicate(id, cs.asks![0]!.obsId, 'same');
    await env.svc.splitItem(id, cs.links!.find((l) => l.itemId === 'T1')!.obsId);
    await env.svc.setItemUndone(id, cs.added[0]!, true);
    const again = await env.svc.changeLens(id, { occasion: s0.occasion });
    expect([again!.score, again!.rawScore, again!.fixes.map((f) => f.copy)]).toEqual([s0.score, s0.rawScore, s0.fixes.map((f) => f.copy)]);
  });
});

describe('measured on the phone (#104)', () => {
  it('each boxed piece is measured once per check before matching; its color, cut-out and quality land on the sighting', async () => {
    const calls: { hash: string; keys: string[]; boxes: number[][]; mirrored?: boolean }[] = [];
    const measure: GarmentMeasurer = async (check, pieces) => {
      calls.push({ hash: check.imageHash, keys: pieces.map((p) => p.key), boxes: pieces.map((p) => [...p.box]), mirrored: check.mirrored });
      return new Map(pieces.map((p, n) => [p.key, { sampledHex: '#444343', sampledL: 28 + n, cropFile: `closet/x-${p.key}.png`, cropQuality: 0.8 }]));
    };
    const env = await setup({ measure });
    const id = await env.check('p01b');
    await env.closet.settle();
    const row = await env.row(id);
    expect(row.score).toBe(8);
    expect(calls).toHaveLength(1);
    // Only pieces the closet call boxed (tee + chinos in this photo's bundled answer).
    expect(calls[0]!.keys).toEqual(['garment-0', 'garment-1']);
    expect(calls[0]!.boxes.every((b) => b.length === 4)).toBe(true);
    expect(calls[0]!.mirrored).toBe(false); // a studio photo: the cut-outs aren't flipped
    const obs = (await env.store.closetObs.all()).filter((o) => o.closet !== null).sort((a, b) => a.garmentIndex! - b.garmentIndex!);
    expect(obs.map((o) => [o.garmentIndex, o.sampledHex, o.sampledL, o.cropFile, o.cropQuality])).toEqual([
      [0, '#444343', 28, 'closet/x-garment-0.png', 0.8],
      [1, '#444343', 29, 'closet/x-garment-1.png', 0.8],
    ]);
    const bare = (await env.store.closetObs.all()).filter((o) => o.closet === null);
    expect(bare.every((o) => o.sampledHex === null && o.cropFile === null)).toBe(true);
  });

  it('a measurer that throws or finds nothing changes nothing: the closet is written as before', async () => {
    const base = await setup();
    const id0 = await base.check('p01b');
    await base.closet.settle();
    const names0 = (await base.owned()).map((c) => c.name).sort();
    const env = await setup({ measure: async () => { throw new Error('native gone'); } });
    const id = await env.check('p01b');
    await env.closet.settle();
    expect((await env.row(id)).details.closetSummary?.state).toBe('done');
    expect((await env.owned()).map((c) => c.name).sort()).toEqual(names0);
    expect((await env.row(id)).score).toBe((await base.row(id0)).score);
  });
});


const profileOf = (c: ClosetItemRow | null | undefined) => profileOfItem(c!);

describe('half-seen pieces ask instead of splitting, and a Yes teaches (#115)', () => {
  // His Oct 8 story in miniature: the grey hoodie alone, then under a tan overshirt (read as a tee, jeans read straight),
  // then under it again (read as a sweatshirt). No closet call, no measuring: the v3 fields and the outer-layer rule.
  const base = demoReadingById('ph1')!;
  const garments = (top: Record<string, unknown>, leg: string, outer: boolean) => [
    ...(outer ? [{ ...base.garments[0]!, category: 'outerwear', subcategory: 'overshirt', color_family: 'tan_camel', logo: 'none', pattern: 'checks_plaid' }] : []),
    { ...base.garments[0]!, ...top },
    { ...base.garments[1]!, subcategory: 'jeans', certainty: 'clear', leg_shape: leg },
    { ...base.garments[2]!, subcategory: 'white_leather_sneaker', color_family: 'white', certainty: 'clear' },
  ];
  const alone = { ...base, garments: garments({}, 'wide', false) } as Reading;
  const asTee = { ...base, garments: garments({ subcategory: 'tee', certainty: 'likely', logo: 'none' }, 'straight', true) } as Reading;
  const asSweat = { ...base, garments: garments({ subcategory: 'sweatshirt', certainty: 'likely', logo: 'none' }, 'straight', true) } as Reading;
  const story = () => setup({ readings: { ph1: alone, s05: asTee, s09: asSweat }, closetSource: null });
  const byName = async (env: Awaited<ReturnType<typeof setup>>, sub: string) =>
    (await env.owned()).find((c) => c.garment.subcategory === sub && !c.maybeSameAs)!;

  it('the hoodie under a shirt read as a tee, and the jeans read straight: two questions, not two new pieces', async () => {
    const env = await story();
    await env.check('ph1', 'everyday');
    await env.closet.settle();
    const hoodie = await byName(env, 'hoodie'), jeans = await byName(env, 'jeans');
    const id = await env.check('s05', 'everyday');
    await env.closet.settle();
    const asks = (await env.row(id)).details.closetSummary!.asks!;
    expect(asks.map((a) => a.candidateId).sort()).toEqual([hoodie.id, jeans.id].sort());
    // Before #115 both were vetoed into new pieces ("Grey tee", a second pair of jeans) with no question.
  });

  it('after his two Yes answers, the next layered photo matches by itself; a changed answer takes the lesson back', async () => {
    const env = await story();
    await env.check('ph1', 'everyday');
    await env.closet.settle();
    const hoodie = await byName(env, 'hoodie'), jeans = await byName(env, 'jeans');
    const id = await env.check('s05', 'everyday');
    await env.closet.settle();
    const asks = (await env.row(id)).details.closetSummary!.asks!;
    for (const a of asks) await env.svc.answerDuplicate(id, a.obsId, 'same');
    expect(profileOf(await env.store.closet.get(hoodie.id)).aliases).toContain('tee');
    expect(profileOf(await env.store.closet.get(jeans.id)).fieldAliases).toEqual({ leg_shape: ['straight', 'wide'] });

    const id3 = await env.check('s09', 'everyday');
    await env.closet.settle();
    const cs = (await env.row(id3)).details.closetSummary!;
    expect(cs.asks ?? []).toEqual([]);
    expect(cs.matched).toEqual(expect.arrayContaining([hoodie.id, jeans.id]));
    expect((await env.owned()).length).toBe(4); // hoodie, jeans, sneakers, overshirt

    const jeansAsk = asks.find((a) => a.candidateId === jeans.id)!;
    await env.svc.answerDuplicate(id, jeansAsk.obsId, 'new');
    expect(profileOf(await env.store.closet.get(jeans.id)).fieldAliases).toEqual({});
  });
});

describe('an unanswered question is never asked twice (#116)', () => {
  const base = demoReadingById('ph1')!;
  const garments = (top: Record<string, unknown>, leg: string, outer: boolean) => [
    ...(outer ? [{ ...base.garments[0]!, category: 'outerwear', subcategory: 'overshirt', color_family: 'tan_camel', logo: 'none', pattern: 'checks_plaid' }] : []),
    { ...base.garments[0]!, ...top },
    { ...base.garments[1]!, subcategory: 'jeans', certainty: 'clear', leg_shape: leg },
    { ...base.garments[2]!, subcategory: 'white_leather_sneaker', color_family: 'white', certainty: 'clear' },
  ];
  const alone = { ...base, garments: garments({}, 'wide', false) } as Reading;
  const asTee = { ...base, garments: garments({ subcategory: 'tee', certainty: 'likely', logo: 'none' }, 'straight', true) } as Reading;
  const asSweat = { ...base, garments: garments({ subcategory: 'sweatshirt', certainty: 'likely', logo: 'none' }, 'straight', true) } as Reading;

  it('the next photo joins the open questions; the grid and the known list leave them out; one Yes moves both sightings', async () => {
    const env = await setup({ readings: { ph1: alone, s05: asTee, s09: asSweat }, closetSource: null });
    await env.check('ph1', 'everyday');
    await env.closet.settle();
    const hoodie = (await env.owned()).find((c) => c.garment.subcategory === 'hoodie')!;
    const id2 = await env.check('s05', 'everyday');
    await env.closet.settle();
    const ownedAfter2 = (await env.owned()).length;
    const id3 = await env.check('s09', 'everyday');
    await env.closet.settle();
    const cs3 = (await env.row(id3)).details.closetSummary!;
    expect(cs3.asks ?? []).toEqual([]); // no second "Same as your grey hoodie?" / jeans question
    expect((await env.owned()).length).toBe(ownedAfter2); // no third tee or jeans entry
    const teeAsk = (await env.row(id2)).details.closetSummary!.asks!.find((a) => a.candidateId === hoodie.id)!;
    const copy = (await env.store.closet.get(teeAsk.itemId))!;
    expect(cs3.links!.some((l) => l.itemId === copy.id)).toBe(true);
    expect((await env.closet.knownPieces()).map((k) => k.id)).not.toContain(copy.id);

    const worn = (await env.store.closet.get(hoodie.id))!.wornCount;
    await env.svc.answerDuplicate(id2, teeAsk.obsId, 'same');
    expect((await env.store.closet.get(hoodie.id))!.wornCount).toBe(worn + 2);
    expect((await env.row(id3)).details.closetSummary!.links!.some((l) => l.itemId === hoodie.id)).toBe(true);
    // Changing the answer moves the joined sighting back with it.
    await env.svc.answerDuplicate(id2, teeAsk.obsId, 'new');
    expect((await env.store.closet.get(hoodie.id))!.wornCount).toBe(worn);
    expect((await env.row(id3)).details.closetSummary!.links!.some((l) => l.itemId === copy.id)).toBe(true);
  });
});

describe('"Your grey work boots?" in the closet (#126 / #115)', () => {
  async function asked() {
    const env = await setup({ now: '2026-10-21T16:40:00-04:00' });
    const first = (await env.svc.start({ mode: 'check', photoId: 'ph8', occasion: 'everyday' })) as { checkId: string };
    await env.svc.answerTap(first.checkId, 'work_boot'); // the shoe question: Boots
    await env.closet.settle();
    env.clock.set(at('2026-10-22T16:40:00-04:00'));
    const r = (await env.svc.start({ mode: 'check', photoId: 'ph9', occasion: 'everyday' })) as { checkId: string; outcome: string };
    expect(r.outcome).toBe('asking');
    const tap = (await env.row(r.checkId)).details.tap!;
    expect(tap.kind).toBe('known');
    return { ...env, id: r.checkId, knownId: tap.knownId!, wornBefore: (await env.store.closet.get(tap.knownId!))!.wornCount };
  }
  const shoeSighting = async (env: Awaited<ReturnType<typeof asked>>) =>
    (await env.store.closetObs.all()).find((o) => o.fitCheckId === env.id && o.garment.category === 'footwear');

  it('Yes: the sighting is his boots (linked as his answer, worn +1), no new shoes', async () => {
    const env = await asked();
    await env.svc.answerTap(env.id, 'work_boot');
    await env.closet.settle();
    expect(await shoeSighting(env)).toMatchObject({ itemId: env.knownId, decision: 'answeredSame', userConfirmed: null });
    expect((await env.store.closet.get(env.knownId))!.wornCount).toBe(env.wornBefore + 1);
    expect((await env.owned()).filter((c) => c.slot === 'shoes')).toHaveLength(1);
  });

  it('No: never his boots for this sighting, and nothing claimed about the type', async () => {
    const env = await asked();
    await env.svc.answerTap(env.id, 'other');
    await env.closet.settle();
    const s = await shoeSighting(env);
    expect(s?.itemId).not.toBe(env.knownId);
    expect(s?.userConfirmed ?? null).toBeNull();
    expect((await env.store.closet.get(env.knownId))!.wornCount).toBe(env.wornBefore);
  });

});

describe('measured on the phone: mirror selfies (#109)', () => {
  it('a mirror selfie (the reading says so) asks for the cut-outs flipped back to true view (#109)', async () => {
    const seen: (boolean | undefined)[] = [];
    const measure: GarmentMeasurer = async (check) => { seen.push(check.mirrored); return new Map(); };
    const env = await setup({ measure, readings: { p01b: { ...demoReadingById('p01b')!, scene: { ...demoReadingById('p01b')!.scene, mirror_selfie: true } } as Reading } });
    await env.check('p01b');
    await env.closet.settle();
    expect(seen).toEqual([true]);
  });
});

describe('removing a piece or a look (#118)', () => {
  const base = demoReadingById('ph1')!;
  const garments = (outer: boolean) => [
    ...(outer ? [{ ...base.garments[0]!, category: 'outerwear', subcategory: 'overshirt', color_family: 'tan_camel', logo: 'none', pattern: 'checks_plaid' }] : []),
    { ...base.garments[0]! },
    { ...base.garments[1]!, subcategory: 'jeans', certainty: 'clear', leg_shape: 'wide' },
    { ...base.garments[2]!, subcategory: 'white_leather_sneaker', color_family: 'white', certainty: 'clear' },
  ];
  const story = () => setup({ readings: { ph1: { ...base, garments: garments(false) } as Reading, s05: { ...base, garments: garments(true) } as Reading }, closetSource: null });

  it('a piece leaves the closet and comes back with Undo; scores never change', async () => {
    const env = await story();
    const id = await env.check('ph1', 'everyday');
    await env.closet.settle();
    const score = (await env.row(id)).score;
    const hoodie = (await env.owned()).find((c) => c.garment.subcategory === 'hoodie')!;
    expect((await env.closet.removeItem(hoodie.id))?.id).toBe(hoodie.id);
    expect((await env.owned()).map((c) => c.id)).not.toContain(hoodie.id);
    expect((await env.row(id)).score).toBe(score);
    await env.closet.restoreItem(hoodie.id);
    expect((await env.owned()).map((c) => c.id)).toContain(hoodie.id);
  });

  it('a look hides from the Lookbook and stops counting as a wear; "with its new pieces" removes what only it had; Undo puts it all back', async () => {
    const env = await story();
    await env.check('ph1', 'everyday');
    await env.closet.settle();
    const id = await env.check('s05', 'everyday');
    await env.closet.settle();
    const owned = await env.owned();
    const hoodie = owned.find((c) => c.garment.subcategory === 'hoodie')!;
    const overshirt = owned.find((c) => c.garment.subcategory === 'overshirt')!;
    expect((await env.closet.onlyInLook(id)).map((c) => c.id)).toEqual([overshirt.id]);

    const r = (await env.closet.removeLook(id, true))!;
    expect((await env.row(id)).details.removedFromLookbook).toBeTruthy();
    expect((await env.store.closet.get(hoodie.id))!.wornCount).toBe(hoodie.wornCount - 1);
    expect((await env.owned()).map((c) => c.id)).not.toContain(overshirt.id);
    expect(r.removedItems).toEqual([overshirt.id]);

    await env.closet.restoreLook(r);
    expect((await env.row(id)).details.removedFromLookbook ?? null).toBeNull();
    expect((await env.store.closet.get(hoodie.id))!.wornCount).toBe(hoodie.wornCount);
    expect((await env.owned()).map((c) => c.id)).toContain(overshirt.id);
  });

  it('"Remove from Lookbook" alone keeps every piece', async () => {
    const env = await story();
    await env.check('ph1', 'everyday');
    await env.closet.settle();
    const id = await env.check('s05', 'everyday');
    await env.closet.settle();
    const before = (await env.owned()).length;
    await env.closet.removeLook(id, false);
    expect((await env.owned()).length).toBe(before);
  });

  it('Rename (Oct 14): his name is stored on the piece and shows wherever its name does; scores never change', async () => {
    const env = await story();
    const id = await env.check('ph1', 'everyday');
    await env.closet.settle();
    const score = (await env.row(id)).score;
    const hoodie = (await env.owned()).find((c) => c.garment.subcategory === 'hoodie')!;
    const renamed = (await env.closet.renameItem(hoodie.id, '   My   green  zip  '))!;
    expect(renamed.name).toBe('My green zip');
    expect(profileOfItem(renamed)).toMatchObject({ nameLocked: true, originalName: hoodie.name });
    expect((await env.store.closet.get(hoodie.id))!.name).toBe('My green zip');
    expect((await env.closet.knownPieces()).find((k) => k.id === hoodie.id)!.name).toBe('My green zip');
    expect((await env.row(id)).score).toBe(score);
    // capped at 40 characters, trimmed again after the cut
    expect((await env.closet.renameItem(hoodie.id, `${'a'.repeat(39)} tail`))!.name).toBe('a'.repeat(39));
    // a later check never renames it back
    await env.check('s05', 'everyday');
    await env.closet.settle();
    expect((await env.store.closet.get(hoodie.id))!.name).toBe('a'.repeat(39));
  });

  it('Rename: an empty name (or "Reset to the original name") puts the generated name back', async () => {
    const env = await story();
    await env.check('ph1', 'everyday');
    await env.closet.settle();
    const hoodie = (await env.owned()).find((c) => c.garment.subcategory === 'hoodie')!;
    await env.closet.renameItem(hoodie.id, 'Gym hoodie');
    const back = (await env.closet.renameItem(hoodie.id, '  '))!;
    expect(back.name).toBe(hoodie.name);
    expect(profileOfItem(back).nameLocked ?? false).toBe(false);
    expect(profileOfItem(back).originalName ?? null).toBeNull();
    expect(profileOfItem(back).autoName).toBe(true); // the app may name it again
    // typing the original name is the same as a reset; an empty name on a piece he never renamed changes nothing
    await env.closet.renameItem(hoodie.id, 'Gym hoodie');
    expect(profileOfItem((await env.closet.renameItem(hoodie.id, hoodie.name))!).nameLocked ?? false).toBe(false);
    expect((await env.closet.renameItem(hoodie.id, ''))!.name).toBe(hoodie.name);
  });

  it("Rename: a seed piece's own name comes back on reset", async () => {
    const env = await setup({ scenario: 'full' });
    const seedItem = (await env.owned()).find((c) => !isAutoNamed(c))!;
    expect(seedItem).toBeTruthy();
    expect((await env.closet.renameItem(seedItem.id, 'Sunday chinos'))!.name).toBe('Sunday chinos');
    expect((await env.closet.renameItem(seedItem.id, ''))!.name).toBe(seedItem.name);
  });

  it('Rename never changes how later sightings match', async () => {
    const run = async (rename: boolean) => {
      const env = await story();
      await env.check('ph1', 'everyday');
      await env.closet.settle();
      if (rename) {
        for (const c of await env.owned()) await env.closet.renameItem(c.id, `Mine ${c.id}`);
      }
      const id = await env.check('s05', 'everyday');
      await env.closet.settle();
      const obs = (await env.store.closetObs.all()).map((o) => [o.id, o.itemId, o.decision, o.identityScore, o.askItemId]);
      const items = (await env.owned()).map((c) => [c.id, c.wornCount, c.garment.subcategory]).sort();
      return { obs, items, score: (await env.row(id)).score, links: (await env.row(id)).details.closetSummary?.links };
    };
    expect(await run(true)).toEqual(await run(false));
  });

  it('Rename then Remove: still undoable, and the name he gave it comes back with it', async () => {
    const env = await story();
    await env.check('ph1', 'everyday');
    await env.closet.settle();
    const hoodie = (await env.owned()).find((c) => c.garment.subcategory === 'hoodie')!;
    await env.closet.renameItem(hoodie.id, 'Gym hoodie');
    expect((await env.closet.removeItem(hoodie.id))?.name).toBe('Gym hoodie');
    expect((await env.owned()).map((c) => c.id)).not.toContain(hoodie.id);
    await env.closet.restoreItem(hoodie.id);
    expect((await env.owned()).find((c) => c.id === hoodie.id)?.name).toBe('Gym hoodie');
    expect(await env.closet.renameItem('C-nope', 'x')).toBeNull();
  });
});

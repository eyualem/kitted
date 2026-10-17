// The second look in the app (#199, look1): the U and L calls are look_test.py's byte for byte (prompts and schemas
// synced from extraction-test/), they run next to the scoring read, the card waits at most a 1.5 s grace for them,
// a late or broken look never fails or delays a check, and the answers are stored with the check so every later
// re-score (occasion, correction, the same photo again, the re-check, Going for) uses the same ones.
import { scoreParts, type PartsScored, type Reading } from '@kitted/core';
import lockedSchemaL from '../../../extraction-test/schema_look_l.json';
import lockedSchemaU from '../../../extraction-test/schema_look_u.json';
import promptL from '../../assets/gemini/prompt-look-l.json';
import promptU from '../../assets/gemini/prompt-look-u.json';
import schemaL from '../../assets/gemini/schema-look-l.json';
import schemaU from '../../assets/gemini/schema-look-u.json';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { decode, encode } from '@/data/tables';
import type { FitCheckRow, LookAnswerL, LookAnswerU, StoredSecondLook } from '@/data/types';
import { createFitCheckService, DEFAULT_TIMERS, lensInput } from '@/features/fitcheck/service';
import { scoreOptions } from '@/features/fitcheck/scoring';
import { anchorRecheckLook, LOOK_GRACE_MS, lookInput, settledLine, settleSecondLook } from '@/features/fitcheck/secondLook';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { demoImagePrep } from '@/services/imagePrep/demo';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { buildLookRequest, createLookGemini, lookCents, lookImages, lookLogLine, validateLook, type LookGeminiOptions } from '@/services/readingSource/secondLook';
import type { LookResult, ReadingSource, SecondLookCall } from '@/services/readingSource/types';
import { realScheduler } from '@/services/scheduler';

const fs = jest.requireActual('fs') as { readFileSync(p: string, e: string): string };
const path = jest.requireActual('path') as { resolve(...p: string[]): string };
const STYLES = seed.scenarios.firstRun.onboardingAnswers.styles as unknown as [string, number][];

const PEEK: LookAnswerU = { outer_kind: 'hoodie_or_sweatshirt', outer_hem_at: 'hip', under_present: 'yes', under_kind: 'tee_or_tank', under_hem_at: 'crotch', under_shows: 'clearly' };
const NO_PEEK: LookAnswerU = { ...PEEK, under_shows: 'no' };
const RESTS: LookAnswerL = { pant_end: 'full_break', covers_shoe: 'mostly' };
const CLEAR: LookAnswerL = { pant_end: 'no_break', covers_shoe: 'no' };
const ok = <A>(answer: A): LookResult<A> => ({ ok: true, answer, ms: 600, cents: 0.12 });

describe('the request (look_test.py / b1_test.call)', () => {
  it('ships the extraction-test prompts and schemas unchanged', () => {
    expect(promptU.prompt).toBe(fs.readFileSync(path.resolve('..', 'extraction-test', 'prompt_look_u.txt'), 'utf8'));
    expect(promptL.prompt).toBe(fs.readFileSync(path.resolve('..', 'extraction-test', 'prompt_look_l.txt'), 'utf8'));
    expect(schemaU).toEqual(lockedSchemaU);
    expect(schemaL).toEqual(lockedSchemaL);
  });

  it('is the prompt, then the one close-up; temperature 0, JSON with the arm\'s schema, thinking off', () => {
    for (const [arm, prompt, schema] of [['U', promptU.prompt, lockedSchemaU], ['L', promptL.prompt, lockedSchemaL]] as const) {
      expect(buildLookRequest(arm, 'QUJD')).toEqual({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: 'image/jpeg', data: 'QUJD' } }] }],
        generationConfig: { temperature: 0, responseMimeType: 'application/json', responseSchema: schema, thinkingConfig: { thinkingBudget: 0 } },
      });
    }
  });

  it('U reads the upper close-up and L the lower; one whole-person close-up serves both; none, no look', () => {
    expect(lookImages(['up', 'low'])).toEqual({ U: 'up', L: 'low' });
    expect(lookImages(['body'])).toEqual({ U: 'body', L: 'body' });
    expect(lookImages([])).toBeNull();
    expect(lookImages(undefined)).toBeNull();
  });

  it('an answer must fill every field from its enum (extra fields dropped); anything else is malformed', () => {
    expect(validateLook('U', { ...PEEK, extra: 1 })).toEqual(PEEK);
    expect(validateLook('L', RESTS)).toEqual(RESTS);
    expect(validateLook('U', { ...PEEK, under_shows: 'lots' })).toBeNull();
    expect(validateLook('L', { pant_end: 'stacked' })).toBeNull();
    expect(validateLook('L', [RESTS])).toBeNull();
    expect(validateLook('U', null)).toBeNull();
  });

  it('prices a call from its tokens (look1: about 0.126¢ for U)', () => {
    expect(lookCents({ promptTokenCount: 1580, candidatesTokenCount: 20 })).toBeCloseTo(0.1260, 4);
    expect(lookCents(undefined)).toBeNull();
    expect(lookLogLine('U', ok(PEEK))).toBe('[look] U ok · peek yes · 600 ms · 0.120¢');
    expect(lookLogLine('L', ok(CLEAR))).toBe('[look] L ok · rests no · 600 ms · 0.120¢');
  });
});

describe('the live call', () => {
  const reply = (body: unknown, status = 200) => async () => ({ ok: status === 200, status, text: async () => JSON.stringify(body) });
  const answer = (a: unknown) => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(a) }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 1580, candidatesTokenCount: 20 } });
  const make = (fetch: NonNullable<LookGeminiOptions['fetch']>, calls: unknown[] = []) =>
    createLookGemini({ apiKey: 'k', fetch, scheduler: realScheduler, onCall: (arm, r) => calls.push([arm, r.ok]) });

  it('returns the answer with its cost; logs each call once', async () => {
    const calls: unknown[] = [];
    const r = await make(reply(answer(PEEK)), calls).arm('U', 'QUJD');
    expect(r).toMatchObject({ ok: true, answer: PEEK });
    expect(r.ok && r.cents).toBeCloseTo(0.126, 3);
    expect(calls).toEqual([['U', true]]);
  });

  it('never rejects: malformed, a server error, a network error and an abort are all results', async () => {
    expect(await make(reply(answer({ covers_shoe: 'kind of' }))).arm('L', 'x')).toMatchObject({ ok: false, fail: 'invalid' });
    expect(await make(reply({ candidates: [{ content: { parts: [{ text: 'not json' }] } }] })).arm('L', 'x')).toMatchObject({ ok: false, fail: 'invalid' });
    expect(await make(reply({}, 503)).arm('U', 'x')).toMatchObject({ ok: false, fail: 'ai' });
    expect(await make(async () => { throw new Error('offline'); }).arm('U', 'x')).toMatchObject({ ok: false, fail: 'offline' });
    const ac = new AbortController();
    ac.abort();
    expect(await make(reply(answer(PEEK))).arm('U', 'x', ac.signal)).toMatchObject({ ok: false, fail: 'aborted' });
  });
});

describe('the grace (fake timers)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  const never = <A>() => new Promise<LookResult<A>>(() => {});
  const after = <A>(ms: number, r: LookResult<A>) => new Promise<LookResult<A>>((res) => setTimeout(() => res(r), ms));

  it('both already back: scored with both, no wait', async () => {
    const s = await settleSecondLook({ u: Promise.resolve(ok(PEEK)), l: Promise.resolve(ok(RESTS)) }, LOOK_GRACE_MS, realScheduler);
    expect(s).toEqual({ look: { version: 'look1', u: PEEK, l: RESTS }, late: [], failed: [] });
    expect(settledLine(s)).toBe('[look] scored with U, L · peek yes · rests yes');
  });

  it('one back inside the 1.5 s grace is used; one later than the grace is left out', async () => {
    let done = false;
    const p = settleSecondLook({ u: after(1_400, ok(PEEK)), l: never<LookAnswerL>() }, LOOK_GRACE_MS, realScheduler).then((s) => ((done = true), s));
    await jest.advanceTimersByTimeAsync(1_499);
    expect(done).toBe(false);
    await jest.advanceTimersByTimeAsync(1);
    const s = await p;
    expect(s).toEqual({ look: { version: 'look1', u: PEEK, l: null }, late: ['L'], failed: [] });
    expect(settledLine(s)).toBe('[look] scored with U · peek yes · L late, scored without it');
  });

  it('both late: scored without (null), after exactly the grace', async () => {
    const p = settleSecondLook({ u: never<LookAnswerU>(), l: after(2_000, ok(RESTS)) }, LOOK_GRACE_MS, realScheduler);
    await jest.advanceTimersByTimeAsync(LOOK_GRACE_MS);
    const s = await p;
    expect(s).toEqual({ look: null, late: ['U', 'L'], failed: [] });
    expect(settledLine(s)).toBe('[look] U, L late, scored without');
  });

  it('a failed or rejecting arm is left out and never waits', async () => {
    const call = { u: Promise.reject(new Error('boom')), l: Promise.resolve({ ok: false, fail: 'invalid', ms: 3 }) } as unknown as SecondLookCall;
    const s = await settleSecondLook(call, LOOK_GRACE_MS, realScheduler);
    expect(s).toEqual({ look: null, late: [], failed: ['U', 'L'] });
  });
});

describe('the merge into the engine', () => {
  const r = (): Reading => ({
    scene: { framing: 'full_body', shoes_visible: true, people_count: 1, mirror_selfie: false, lighting: 'good', clothed: 'fully' },
    garments: [
      { category: 'outerwear', subcategory: 'overshirt', certainty: 'clear' },
      { category: 'top', subcategory: 'tee', certainty: 'clear' },
      { category: 'bottom', subcategory: 'jeans', leg_shape: 'wide', hem: 'full_break', certainty: 'clear' },
      { category: 'footwear', subcategory: 'slides_sandals', certainty: 'clear' },
    ],
  }) as unknown as Reading;

  it('passes only the arms that answered, as the raw fields core reads (parts_proto._second_look)', () => {
    expect(lookInput({ version: 'look1', u: PEEK, l: RESTS })).toEqual({ under_present: 'yes', under_shows: 'clearly', covers_shoe: 'mostly' });
    expect(lookInput({ version: 'look1', u: null, l: CLEAR })).toEqual({ covers_shoe: 'no' });
    expect(lookInput({ version: 'look1', u: null, l: null })).toBeNull();
    expect(lookInput(null)).toBeNull();
    expect(lookInput(undefined)).toBeNull();
    const peek = scoreParts(r(), { secondLook: lookInput({ version: 'look1', u: PEEK, l: null }) });
    expect((peek as PartsScored).secondLook).toEqual({ peek: true, restsOnShoe: null });
  });

  it('a re-check uses only the arms its first check had: its own when back, else the first check\'s', () => {
    const parent: StoredSecondLook = { version: 'look1', u: PEEK, l: null };
    expect(anchorRecheckLook({ version: 'look1', u: NO_PEEK, l: RESTS }, parent, 'FC-1')).toEqual({ version: 'look1', u: NO_PEEK, l: null });
    expect(anchorRecheckLook(null, parent, 'FC-1')).toEqual({ version: 'look1', u: PEEK, l: null, copied: { from: 'FC-1', why: 'firstCheck', arms: ['U'] } });
    expect(anchorRecheckLook({ version: 'look1', u: NO_PEEK, l: RESTS }, null, 'FC-1')).toBeNull();
    expect(anchorRecheckLook({ version: 'look1', u: NO_PEEK, l: RESTS }, undefined, 'FC-1')).toBeNull();
  });

  it('survives the database round trip (fit_checks.details is JSON)', () => {
    const details = { secondLook: { version: 'look1', u: PEEK, l: RESTS } as StoredSecondLook };
    expect(decode('json', encode('json', details))).toEqual(details);
  });
});

type Plan = { u?: LookResult<LookAnswerU> | 'never' | 'throw'; l?: LookResult<LookAnswerL> | 'never' | 'throw' } | 'throw';

describe('in the fit check', () => {
  const toP = <A>(x: LookResult<A> | 'never' | 'throw' | undefined): Promise<LookResult<A>> =>
    x === 'never' ? new Promise(() => {}) : x === 'throw' ? Promise.reject(new Error('boom')) : Promise.resolve(x ?? { ok: false, fail: 'ai', ms: 0 });

  async function setup(plans: Plan[], graceMs = LOOK_GRACE_MS) {
    const store = createMemoryStore();
    const clock = manualClock(Date.parse('2026-10-22T07:42:00-04:00'));
    const mock = createMockReadingSource({ latency: () => 0, scheduler: realScheduler });
    const calls: string[] = [];
    const source: ReadingSource = {
      ...mock,
      read: (image, kind, o) => mock.read(image, kind, o),
      secondLook(_image, kind) {
        calls.push(kind);
        const plan = plans.shift() ?? {};
        if (plan === 'throw') throw new Error('could not start');
        return { u: toP(plan.u), l: toP(plan.l) };
      },
    };
    const quota = createQuota({ store, clock, isPro: () => true });
    const svc = createFitCheckService({
      store, source, prep: demoImagePrep, quota, clock, scheduler: realScheduler, ids: counterIds(),
      timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0, lookGraceMs: graceMs }),
    });
    await store.profile.put({
      id: 'me', birthYear: 2005, heightCm: 178, build: 'average', fitPreference: 'regular', styles: STYLES, boldness: null, budget: null,
      lastOccasion: 'everyday', consentVersion: '1', consentAt: clock.nowMs(), onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: clock.nowMs(),
    });
    const check = async (photoId: string, occasion: 'date' | 'everyday' = 'date') => {
      const r = await svc.start({ mode: 'check', photoId, occasion });
      expect(r.outcome).toBe('scored');
      return (await store.fitChecks.get((r as { checkId: string }).checkId))!;
    };
    return { store, svc, calls, check };
  }

  const fired = (row: FitCheckRow, check: string) =>
    Object.values(row.details.parts!.parts).some((p) => p.reasons.some((x) => x.check === check));
  /** The score core gives this row's reading with its stored look: what the card must show. */
  const expected = async (store: ReturnType<typeof createMemoryStore>, row: FitCheckRow) => {
    const reading = (await store.readings.get(row.readingId!))!.reading;
    return scoreParts(reading, scoreOptions(lensInput(row.occasion, row.style, { styles: STYLES, boldness: null }, row.details.secondLook))).overall;
  };
  let log: jest.SpyInstance;
  beforeEach(() => (log = jest.spyOn(console, 'log').mockImplementation(() => {})));
  afterEach(() => log.mockRestore());

  it('scores with both looks when they are back, and stores them with the check', async () => {
    const { store, calls, check } = await setup([{ u: ok(PEEK), l: ok(RESTS) }]);
    const row = await check('p01b');
    expect(calls).toEqual(['full']);
    expect(row.details.secondLook).toEqual({ version: 'look1', u: PEEK, l: RESTS });
    expect(fired(row, 'PF10_peek')).toBe(true);
    expect(row.score).toBe(await expected(store, row));
    expect(log).toHaveBeenCalledWith('[look] scored with U, L · peek yes · rests yes');
  });

  it('L: loose jeans on slides drag only when the look says the pants rest on the shoe', async () => {
    const a = await (await setup([{ u: ok(NO_PEEK), l: ok(RESTS) }])).check('ph8', 'everyday');
    const b = await (await setup([{ u: ok(NO_PEEK), l: ok(CLEAR) }])).check('ph8', 'everyday');
    expect([fired(a, 'SK1b_hem_drags'), fired(b, 'SK1b_hem_drags')]).toEqual([true, false]);
    expect(fired(a, 'PF10_peek')).toBe(false);
  });

  it('late (past the grace): scored without, stored as null, still counted and scored normally', async () => {
    const { store, check } = await setup([{ u: 'never', l: 'never' }], 0);
    const row = await check('p01b');
    expect(row.details.secondLook).toBeNull();
    expect(fired(row, 'PF10_peek')).toBe(false);
    expect(row.score).toBe(7.5); // p01b at Date, exactly as without a second look
    expect((await store.usage.get(row.dayKey))?.checks).toBe(1);
    expect(log).toHaveBeenCalledWith('[look] U, L late, scored without');
  });

  it('a broken look (rejects, or throws as it starts) never fails the check', async () => {
    const a = await (await setup([{ u: 'throw', l: 'throw' }])).check('p01b');
    expect([a.status, a.score, a.details.secondLook]).toEqual(['scored', 7.5, null]);
    const b = await (await setup(['throw'])).check('p01b');
    expect([b.status, b.score, b.details.secondLook]).toEqual(['scored', 7.5, undefined]);
  });

  it('every later re-score uses the stored look: occasion, correction, Going for, the preview', async () => {
    const { store, svc, check } = await setup([{ u: ok(PEEK), l: ok(RESTS) }]);
    const row = await check('p01b');
    const preview = await svc.previewLens(row.id, { occasion: 'everyday' });
    const moved = (await svc.changeOccasion(row.id, 'everyday'))!;
    expect(fired(moved, 'PF10_peek')).toBe(true);
    expect(preview!.after).toBe(moved.score);
    expect(moved.score).toBe(await expected(store, moved));
    await svc.saveCorrection(row.id, { garmentIndex: 1, field: 'hem', value: 'no_break' });
    const corrected = (await store.fitChecks.get(row.id))!;
    expect(corrected.details.secondLook).toEqual({ version: 'look1', u: PEEK, l: RESTS });
    expect(fired(corrected, 'PF10_peek')).toBe(true);
    expect(corrected.score).toBe(await expected(store, corrected));
    const changed = (await svc.changeGoingFor(row.id, 'streetwear'))!;
    expect([changed.score, changed.details.secondLook]).toEqual([corrected.score, corrected.details.secondLook]);
  });

  it('the same photo again: its look is reused, never asked again, so the score is the same', async () => {
    const { store, calls, check } = await setup([{ u: ok(PEEK), l: ok(RESTS) }, { u: ok(NO_PEEK), l: ok(CLEAR) }]);
    const first = await check('p01b');
    const again = await check('p01b');
    expect(calls).toEqual(['full']);
    expect(again.details.secondLook).toMatchObject({ u: PEEK, l: RESTS, copied: { from: first.id, why: 'samePhoto', arms: ['U', 'L'] } });
    expect(again.score).toBe(first.score);
    expect(again.score).toBe(await expected(store, again));
  });

  it('a photo scored without one stays without one when sent again', async () => {
    const { calls, check } = await setup([{ u: 'never', l: 'never' }, { u: ok(PEEK), l: ok(RESTS) }], 0);
    const first = await check('p01b');
    const again = await check('p01b');
    expect(calls).toEqual(['full']);
    expect([first.details.secondLook, again.details.secondLook, again.score]).toEqual([null, null, first.score]);
  });

  it('a re-check of the same photo takes the first check\'s look and score', async () => {
    const { store, svc, calls, check } = await setup([{ u: ok(PEEK), l: ok(RESTS) }]);
    const first = await check('p01b');
    const r = await svc.start({ mode: 'recheck', photoId: 'p01b', parentCheckId: first.id });
    const row = (await store.fitChecks.get((r as { checkId: string }).checkId))!;
    expect(calls).toEqual(['full']);
    expect(row.details.secondLook).toMatchObject({ u: PEEK, l: RESTS, copied: { from: first.id, why: 'samePhoto' } });
    expect([row.score, row.details.recheck?.delta]).toEqual([first.score, 0]);
  });

  it('a new re-check photo gets its own look (the first check\'s arms only), and its outcome compares the two cards', async () => {
    const { store, svc, calls, check } = await setup([{ u: ok(PEEK), l: 'never' }, { u: ok(NO_PEEK), l: ok(RESTS) }], 0);
    const first = await check('p01b');
    expect(first.details.secondLook).toEqual({ version: 'look1', u: PEEK, l: null });
    const r = await svc.start({ mode: 'recheck', photoId: 'p01b2', parentCheckId: first.id });
    const row = (await store.fitChecks.get((r as { checkId: string }).checkId))!;
    expect(calls).toEqual(['full', 'recheck']);
    expect(row.details.secondLook).toEqual({ version: 'look1', u: NO_PEEK, l: null });
    expect(fired(row, 'PF10_peek')).toBe(false);
    expect(row.details.recheck!.parentScore).toBe(first.score);
    expect(row.details.recheck!.parentScore + row.details.recheck!.delta).toBe(row.score);
  });

  it('a re-check whose look is late carries the first check\'s answer; a first check without one asks none', async () => {
    const a = await setup([{ u: ok(PEEK), l: ok(RESTS) }, { u: 'never', l: 'never' }], 0);
    const first = await a.check('p01b');
    const r = await a.svc.start({ mode: 'recheck', photoId: 'p01b2', parentCheckId: first.id });
    const row = (await a.store.fitChecks.get((r as { checkId: string }).checkId))!;
    expect(row.details.secondLook).toMatchObject({ u: PEEK, l: RESTS, copied: { from: first.id, why: 'firstCheck', arms: ['U', 'L'] } });
    expect([row.score, row.details.recheck!.delta]).toEqual([first.score, 0]);

    const b = await setup([{ u: 'never', l: 'never' }], 0);
    const bare = await b.check('p01b');
    await b.svc.start({ mode: 'recheck', photoId: 'p01b2', parentCheckId: bare.id });
    expect(b.calls).toEqual(['full']);
  });

  it('demo photos replay without a second look (the bundled source has none)', async () => {
    const store = createMemoryStore();
    const clock = manualClock(Date.parse('2026-10-22T07:42:00-04:00'));
    const source = createMockReadingSource({ latency: () => 0, scheduler: realScheduler });
    expect(source.secondLook).toBeUndefined();
    const svc = createFitCheckService({
      store, source, prep: demoImagePrep, quota: createQuota({ store, clock, isPro: () => true }), clock, scheduler: realScheduler, ids: counterIds(),
      timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }),
    });
    const r = await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' });
    const row = (await store.fitChecks.get((r as { checkId: string }).checkId))!;
    expect([row.score, row.details.secondLook]).toEqual([7.5, undefined]);
  });
});

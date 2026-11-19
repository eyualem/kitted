// T69-G6: the leg-width look W (#482-#484): one narrow call on the lower close-up L already sends, asked only once the
// reading's bottom is known to be pants, read by the engine only as a tie-break, and never in the way: it gets the
// same grace as U and L, and a late, failed or refused W scores without it and never fails, delays or counts the
// check. Also T69-G11's app half: lookInput sends the engine only the five keys it reads. Made-up readings (no
// person, no photo) and a hand-driven look; no network, no live AI.
import type { Reading } from '@kitted/core';
import lockedSchemaW from '../../../extraction-test/schema_look_w.json';
import seed from '../../assets/seed.json';
import t69 from './fixtures/t69-readings.json';
import { createMemoryStore } from '@/data/memoryStore';
import type { LookAnswerL, LookAnswerU, LookAnswerW, StoredSecondLook } from '@/data/types';
import { createFitCheckService, DEFAULT_TIMERS } from '@/features/fitcheck/service';
import { LOOK_GRACE_MS, lookInput, settledLine, settleSecondLook } from '@/features/fitcheck/secondLook';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import type { ImagePrep } from '@/services/imagePrep/demo';
import { createQuota } from '@/services/quota';
import { routedSource } from '@/services/readingSource/live';
import { createMockReadingSource, scheduleFor } from '@/services/readingSource/mock';
import * as SL from '@/services/readingSource/secondLook';
import type { LookResult, PreparedImage, ReadingEvent, ReadingSource, ReadOpts } from '@/services/readingSource/types';
import { realScheduler } from '@/services/scheduler';
import type { AiSend, AiTransport } from '@/services/server/transport';

const fs = jest.requireActual('fs') as { readFileSync(p: string, e: string): string; existsSync(p: string): boolean };
const path = jest.requireActual('path') as { resolve(...p: string[]): string };
const STYLES = seed.scenarios.firstRun.onboardingAnswers.styles as unknown as [string, number][];
const R = (k: keyof typeof t69.readings): Reading => JSON.parse(JSON.stringify(t69.readings[k])) as Reading;
const PANTS = ['jeans', 'trousers', 'chinos', 'cargos', 'suit_trousers', 'drawstring_trousers', 'joggers', 'sweatpants', 'track_pants'];
const WIDE: LookAnswerW = { knee: 'hangs_away', opening: 'wider' };
const PEEK: LookAnswerU = { outer_kind: 'none', outer_hem_at: 'none', under_present: 'no', under_kind: 'none', under_hem_at: 'none', under_shows: 'no' };
const ok = <A,>(answer: A): LookResult<A> => ({ ok: true, answer, ms: 500, cents: 0.21 });
// the W arm under its Interfaces signature (the stub's LookArm type doesn't name it yet)
const buildW = (b64: string) => (SL.buildLookRequest as (arm: string, b: string) => unknown)('W', b64);
const validateW = (x: unknown) => (SL.validateLook as (arm: string, x: unknown) => unknown)('W', x);

/** PLAIN with another bottom. */
const withBottom = (sub: string): Reading => {
  const r = R('PLAIN');
  r.garments[1] = { ...r.garments[1]!, subcategory: sub };
  return r;
};
const NO_BOTTOM: Reading = (() => {
  const r = R('PLAIN');
  return { ...r, scene: { ...r.scene, framing: 'upper_only', shoes_visible: false }, garments: r.garments.filter((g) => g.category === 'top') };
})();

type Plan = LookResult<LookAnswerW> | 'never';
interface Env { store: ReturnType<typeof createMemoryStore>; svc: ReturnType<typeof createFitCheckService>; events: string[];
  legCalls: { kind: string; image: PreparedImage; opts?: ReadOpts }[]; check: (id: string) => Promise<import('@/data/types').FitCheckRow>; clock: ReturnType<typeof manualClock> }

async function setup(readings: Record<string, Reading>, o: { plans?: Plan[]; ul?: boolean; slots?: boolean; failAfterBottom?: boolean } = {}): Promise<Env> {
  const store = createMemoryStore();
  const clock = manualClock(Date.parse('2026-10-22T07:42:00-04:00'));
  const events: string[] = [];
  const legCalls: Env['legCalls'] = [];
  const plans = [...(o.plans ?? [])];
  const idOfSha = new Map<string, string>();
  const prep: ImagePrep = {
    async prepare(photo) {
      if (photo.kind !== 'file') return { status: 'notImplemented' };
      const id = photo.uri.replace(/\.jpg$/, '');
      if (!readings[id]) return { status: 'unknownPhoto' };
      const sha = `t69-${id}`;
      idOfSha.set(sha, id);
      return { status: 'ok', image: { photoId: null, sha256: sha, uploadUri: null, uploadBase64: 'QUJD', zoomBase64: ['up', 'low'], keptUri: `photos/${sha}.jpg`, thumbUri: `photos/${sha}-t.jpg`, aspect: 0.75 } };
    },
  };
  const mock = createMockReadingSource({ latency: () => 0, scheduler: realScheduler });
  const source: ReadingSource = {
    ...mock,
    async *read(image) {
      const reading = readings[idOfSha.get(image.sha256)!]!;
      for (const s of scheduleFor(reading)) {
        const e: ReadingEvent = s.event;
        if (e.type === 'slotFound') {
          if (o.slots === false) continue;
          events.push(`slot:${e.slot}`);
        }
        if (e.type === 'reading') {
          if (o.failAfterBottom) {
            events.push('failed');
            yield { type: 'failed', code: 'ai', counted: false };
            return;
          }
          events.push('reading');
        }
        yield e;
      }
      yield { type: 'meta', latencySeconds: 0 };
    },
    secondLook: () => (o.ul ? { u: Promise.resolve(ok(PEEK)), l: Promise.resolve<LookResult<LookAnswerL>>({ ok: false, fail: 'ai', ms: 0 }) } : null),
    legLook(image, kind, opts) {
      events.push('W');
      legCalls.push({ kind, image, opts });
      const p = plans.length ? plans.shift()! : ok(WIDE);
      return p === 'never' ? new Promise(() => {}) : Promise.resolve(p);
    },
  } as ReadingSource;
  const svc = createFitCheckService({
    store, source, prep, quota: createQuota({ store, clock, isPro: () => true }), clock, scheduler: realScheduler, ids: counterIds(),
    timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0, lookGraceMs: 50 }),
  });
  await store.profile.put({
    id: 'me', birthYear: 2005, heightCm: 178, build: 'average', fitPreference: 'regular', styles: STYLES, boldness: null, budget: null,
    lastOccasion: 'everyday', consentVersion: '1', consentAt: clock.nowMs(), onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: clock.nowMs(),
  });
  const check = async (id: string) => {
    const r = await svc.start({ mode: 'check', photoUri: `${id}.jpg`, occasion: 'everyday' });
    return (await store.fitChecks.get((r as { checkId: string }).checkId))!;
  };
  return { store, svc, events, legCalls, check, clock };
}

let log: jest.SpyInstance;
beforeEach(() => (log = jest.spyOn(console, 'log').mockImplementation(() => {})));
afterEach(() => log.mockRestore());
const logged = () => log.mock.calls.map((c) => String(c[0]));

describe('the request (T69-G6)', () => {
  it('T69-G6 · the request is leg_look.py\'s: the W prompt, then the lower close-up; temperature 0, its schema, thinking off', () => {
    const promptPath = path.resolve('assets', 'gemini', 'prompt-look-w.json');
    const schemaPath = path.resolve('assets', 'gemini', 'schema-look-w.json');
    expect([fs.existsSync(promptPath), fs.existsSync(schemaPath)]).toEqual([true, true]);
    const prompt = JSON.parse(fs.readFileSync(promptPath, 'utf8')).prompt as string;
    expect(prompt).toBe(fs.readFileSync(path.resolve('..', 'extraction-test', 'prompt_look_w.txt'), 'utf8'));
    expect(JSON.parse(fs.readFileSync(schemaPath, 'utf8'))).toEqual(lockedSchemaW);
    expect(buildW('QUJD')).toEqual({
      contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: 'image/jpeg', data: 'QUJD' } }] }],
      generationConfig: { temperature: 0, responseMimeType: 'application/json', responseSchema: lockedSchemaW, thinkingConfig: { thinkingBudget: 0 } },
    });
    // W reads L's image: the lower close-up, or the one close-up of the whole person
    expect((SL.lookImages(['up', 'low']) as Record<string, string> | null)?.['W']).toBe('low');
    expect((SL.lookImages(['body']) as Record<string, string> | null)?.['W']).toBe('body');
    expect(SL.lookImages([])).toBeNull();
    expect([...SL.LOOK_W_PANTS].sort()).toEqual([...PANTS].sort());
  });

  it('T69-G6 · an answer must be one of the 4 x 4 pairs (extra fields dropped); anything else is malformed', () => {
    const knees = ['clings', 'skims', 'hangs_away', 'not_visible'];
    const openings = ['narrower', 'about_the_same', 'wider', 'not_visible'];
    for (const knee of knees) for (const opening of openings) expect(validateW({ knee, opening, extra: 1 })).toEqual({ knee, opening });
    expect(validateW({ knee: 'clings' })).toBeNull();
    expect(validateW({ opening: 'wider' })).toBeNull();
    expect(validateW({ knee: 'baggy', opening: 'wider' })).toBeNull();
    expect(validateW({ knee: 'clings', opening: 'flared' })).toBeNull();
    expect(validateW([{ knee: 'clings', opening: 'wider' }])).toBeNull();
    expect(validateW(null)).toBeNull();
  });
});

describe('the grace (T69-G6, fake timers)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  const none = { u: Promise.resolve<LookResult<LookAnswerU>>({ ok: false, fail: 'ai', ms: 0 }), l: Promise.resolve<LookResult<LookAnswerL>>({ ok: false, fail: 'ai', ms: 0 }) };
  const settle = (w: Promise<LookResult<LookAnswerW>>) =>
    (settleSecondLook as unknown as (c: typeof none, g: number, s: typeof realScheduler, w: Promise<LookResult<LookAnswerW>>) => ReturnType<typeof settleSecondLook>)(none, LOOK_GRACE_MS, realScheduler, w);

  it('T69-G6 · W back inside the grace is stored; late is left out and listed; a failure is named', async () => {
    const back = await settle(Promise.resolve(ok(WIDE)));
    expect(back.look?.w).toEqual(WIDE);
    expect([back.late, back.failed]).toEqual([[], ['U', 'L']]);
    let done = false;
    const p = settle(new Promise(() => {})).then((s) => ((done = true), s));
    await jest.advanceTimersByTimeAsync(LOOK_GRACE_MS - 1);
    expect(done).toBe(false); // never longer than the grace
    await jest.advanceTimersByTimeAsync(1);
    const late = await p;
    expect(late.look?.w ?? null).toBeNull();
    expect(late.late).toEqual(['W']);
    const off = await settle(Promise.resolve({ ok: false, fail: 'offline', ms: 3 }));
    expect(off.look?.w ?? null).toBeNull();
    expect(off.failed).toEqual(['U', 'L', 'W']);
    expect(settledLine(off)).toContain('W failed');
    expect(settledLine(back)).toContain('scored with W');
    expect(settledLine(back)).toContain('leg wide');
    expect(settledLine({ look: { version: 'look1', u: null, l: null, w: { knee: 'not_visible', opening: 'not_visible' } } as StoredSecondLook, late: [], failed: [] })).toContain('leg unknown');
  });
});

describe('in the fit check (T69-G6)', () => {
  it('T69-G6 · asked once for every kind of pants, at the bottom slot, with the check\'s image and id; never for shorts or no bottom', async () => {
    for (const sub of PANTS) {
      const env = await setup({ a: withBottom(sub) });
      const row = await env.check('a');
      expect([sub, row.status, env.legCalls.length]).toEqual([sub, 'scored', 1]);
      // started when the bottom slot came in, before the shoes
      expect([sub, env.events.indexOf('W')]).toEqual([sub, env.events.indexOf('slot:bottom') + 1]);
      expect([sub, env.legCalls[0]!.kind, env.legCalls[0]!.image.zoomBase64, env.legCalls[0]!.opts?.checkId]).toEqual([sub, 'full', ['up', 'low'], row.id]);
    }
    for (const [name, rd] of [['shorts', R('SHORTS')], ['athletic shorts', withBottom('athletic_shorts')], ['no bottom', NO_BOTTOM]] as const) {
      const env = await setup({ a: rd });
      const row = await env.check('a');
      expect([name, row.status, env.legCalls.length]).toEqual([name, 'scored', 0]);
    }
    // no bottom slot event: started at the reading
    const env = await setup({ a: R('PLAIN') }, { slots: false });
    await env.check('a');
    expect(env.legCalls.length).toBe(1);
    expect(env.events.indexOf('W')).toBe(env.events.indexOf('reading') + 1);
  });

  it('T69-G6 · an answer in time is stored and scored; late or offline scores without it, still one check', async () => {
    const env = await setup({ a: R('PLAIN') });
    const row = await env.check('a');
    expect(row.details.secondLook?.w).toEqual(WIDE);
    expect(row.score).toBe(8.0); // PLAIN's straight jeans read wide by W: the silhouette lift (7.0 without)
    expect((await env.store.usage.get(row.dayKey))?.checks).toBe(1);
    for (const plan of ['never', { ok: false, fail: 'offline', ms: 30 }] as Plan[]) {
      const e = await setup({ a: R('PLAIN') }, { plans: [plan] });
      const r = await e.check('a');
      expect([r.status, r.score, r.details.secondLook?.w ?? null]).toEqual(['scored', 7.0, null]);
      expect((await e.store.usage.get(r.dayKey))?.checks).toBe(1);
      expect(logged().some((l) => l.includes(plan === 'never' ? 'W late' : 'W failed'))).toBe(true);
      log.mockClear();
    }
  });

  it('T69-G6 · a read that fails after W started: W is dropped, nothing stored, nothing counted', async () => {
    const env = await setup({ a: R('PLAIN') }, { plans: ['never'], failAfterBottom: true });
    const r = await env.svc.start({ mode: 'check', photoUri: 'a.jpg', occasion: 'everyday' });
    const row = (await env.store.fitChecks.get((r as { checkId: string }).checkId))!;
    expect(env.legCalls.length).toBe(1);
    expect(env.legCalls[0]!.opts?.signal?.aborted).toBe(true);
    expect([row.status, row.details.secondLook?.w ?? null]).toEqual(['failed', null]);
    expect((await env.store.usage.get(row.dayKey))?.checks ?? 0).toBe(0);
  });

  it('T69-G6 · the same photo copies W; a re-check anchors it, and never asks it when the first check had none', async () => {
    const env = await setup({ a: R('PLAIN'), b: withBottom('chinos') }, { ul: true, plans: [ok(WIDE), 'never'] });
    const first = await env.check('a');
    const again = await env.check('a');
    expect(env.legCalls.length).toBe(1);
    expect(again.details.secondLook?.w).toEqual(WIDE);
    expect(again.details.secondLook?.copied?.arms).toContain('W');
    expect(again.score).toBe(first.score);
    // a re-check whose own W is late carries the first check's
    const r = await env.svc.start({ mode: 'recheck', photoUri: 'b.jpg', parentCheckId: first.id });
    const re = (await env.store.fitChecks.get((r as { checkId: string }).checkId))!;
    expect(env.legCalls.map((c) => c.kind)).toEqual(['full', 'recheck']);
    expect(re.details.secondLook?.w).toEqual(WIDE);
    expect(re.details.secondLook?.copied).toMatchObject({ from: first.id, why: 'firstCheck' });
    expect(re.details.secondLook?.copied?.arms).toContain('W');
    // a first check without W: its re-check never asks W
    const e2 = await setup({ a: R('PLAIN'), b: withBottom('chinos') }, { ul: true, plans: ['never'] });
    const f2 = await e2.check('a');
    expect(f2.details.secondLook?.w ?? null).toBeNull();
    expect(f2.details.secondLook?.u).toEqual(PEEK);
    await e2.svc.start({ mode: 'recheck', photoUri: 'b.jpg', parentCheckId: f2.id });
    expect(e2.legCalls.map((c) => c.kind)).toEqual(['full']);
  });
});

describe('the live source (T69-G6)', () => {
  const answer = (a: unknown) => JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(a) }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 1580, candidatesTokenCount: 20 } });
  const transport = (calls: AiSend[]): AiTransport => ({
    kind: 'direct',
    send: async (req) => {
      calls.push(req);
      return { ok: true, status: 200, body: null, text: async () => answer(WIDE) };
    },
  });
  const real: PreparedImage = { photoId: null, sha256: 'x', uploadUri: null, uploadBase64: 'QUJD', zoomBase64: ['up', 'low'] };
  const mock = () => createMockReadingSource({ latency: () => 0, scheduler: realScheduler });

  it('T69-G6 · sends only the lower close-up, tagged with the check; never a demo photo; never without consent', async () => {
    const calls: AiSend[] = [];
    const src = routedSource(mock(), async () => true, transport(calls));
    expect(typeof src.legLook).toBe('function');
    expect(src.legLook!({ photoId: 'p01b', sha256: 'y', uploadUri: null }, 'full', { checkId: 'FC-1' })).toBeNull();
    expect(calls).toEqual([]);
    const r = await src.legLook!(real, 'full', { checkId: 'FC-1' });
    expect(r).toMatchObject({ ok: true, answer: WIDE });
    expect(calls.length).toBe(1);
    expect(calls[0]!.route).toBe('look');
    expect(calls[0]!.tag?.checkId).toBe('FC-1');
    const body = JSON.parse(calls[0]!.body) as { contents: { parts: { inline_data?: { data: string } }[] }[] };
    expect(body.contents[0]!.parts.map((p) => p.inline_data?.data).filter(Boolean)).toEqual(['low']);
    const one = await src.legLook!({ ...real, zoomBase64: ['body'] }, 'full', { checkId: 'FC-2' });
    expect(one).toMatchObject({ ok: true });
    expect((JSON.parse(calls[1]!.body) as { contents: { parts: { inline_data?: { data: string } }[] }[] }).contents[0]!.parts[1]!.inline_data!.data).toBe('body');
    // no consent: refused, nothing sent
    const none: AiSend[] = [];
    const refused = await routedSource(mock(), async () => false, transport(none)).legLook!(real, 'full', { checkId: 'FC-3' });
    expect(refused).toMatchObject({ ok: false, fail: 'noConsent' });
    expect(none).toEqual([]);
  });
});

describe('what the engine is sent (T69-G11)', () => {
  it('T69-G11 · lookInput of a stored look with every arm returns only the five keys the engine reads', () => {
    const U: LookAnswerU = { outer_kind: 'hoodie_or_sweatshirt', outer_hem_at: 'hip', under_present: 'yes', under_kind: 'tee_or_tank', under_hem_at: 'crotch', under_shows: 'clearly' };
    const L: LookAnswerL = { pant_end: 'full_break', covers_shoe: 'mostly' };
    const all = { version: 'look1', u: U, l: L, w: { knee: 'skims', opening: 'wider' } } as StoredSecondLook;
    expect(lookInput(all)).toEqual({ under_present: 'yes', under_shows: 'clearly', covers_shoe: 'mostly', knee: 'skims', opening: 'wider' });
    expect(lookInput({ version: 'look1', u: null, l: null, w: WIDE } as StoredSecondLook)).toEqual({ knee: 'hangs_away', opening: 'wider' });
  });
});

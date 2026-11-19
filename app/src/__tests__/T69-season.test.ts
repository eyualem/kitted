// T69: the season in the app (tasks/T69/TESTING.md F2.1d-g, T69-G7). v16 scores a warm day differently from a cool
// one; a check's season is set once, at its first score (from the slot's weather row, else the month), and every
// later score of that check keeps it, so the same photo always gets the same score (F2.1). Recorded demo readings
// (stock photos, profile unknown: run with the seed's firstRun profile, as every service test) and TESTING.md's
// made-up PUFFER; the mock reading source, latency 0; no network, no live AI.
import { createParts, PARTS_DATA, suggestPartsFixes, type DayWeather, type PartsScored, type Reading, type Styles } from '@kitted/core';
import seed from '../../assets/seed.json';
import t69 from './fixtures/t69-readings.json';
import { createMemoryStore } from '@/data/memoryStore';
import type { FitCheckRow, LookAnswerW } from '@/data/types';
import { demoPhoto } from '@/demo/demoPhotos';
import { evaluateCheck, scoreOptions } from '@/features/fitcheck/scoring';
import { createFitCheckService, DEFAULT_TIMERS, lensInput } from '@/features/fitcheck/service';
import { ideaId } from '@/features/morning/service';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import type { ImagePrep } from '@/services/imagePrep/demo';
import { createQuota } from '@/services/quota';
import { createMockReadingSource, scheduleFor } from '@/services/readingSource/mock';
import type { LookResult, ReadingEvent, ReadingSource } from '@/services/readingSource/types';
import { realScheduler } from '@/services/scheduler';

const STYLES = seed.scenarios.firstRun.onboardingAnswers.styles as unknown as Styles;
const DAY = 24 * 3600 * 1000;
const V16 = createParts(PARTS_DATA);
const R = (k: keyof typeof t69.readings): Reading => JSON.parse(JSON.stringify(t69.readings[k])) as Reading;
const W_WIDE: LookAnswerW = { knee: 'skims', opening: 'about_the_same' };

const weather = (feelsLowF: number, feelsHighF: number): DayWeather => ({
  window: 'day', nowF: feelsLowF + 4, highF: feelsHighF, lowF: feelsLowF, feelsLowF, feelsHighF, precipChance: 0, precipFromHour: null, condition: 'clear',
});
/** TESTING.md: HOT feels-like 70-86 (no layer needed: warm), COLD 38-48 (cool). */
const HOT = weather(70, 86);
const COLD = weather(38, 48);

const MADE: Record<string, Reading> = { puffer: R('PUFFER') };
const idOfSha = new Map<string, string>();
const shaOf = (id: string) => demoPhoto(id)?.sha256 ?? (MADE[id] ? `t69-${id}-sha` : undefined);
/** A real photo on his phone (no bundled id), prepped with its close-ups; the mock replays the reading it stands for. */
const prep: ImagePrep = {
  async prepare(photo) {
    if (photo.kind === 'demo') return { status: 'notImplemented' };
    const id = photo.kind === 'file' ? photo.uri.replace(/\.jpg$/, '') : null;
    const sha = photo.kind === 'retry' ? photo.sha256 : shaOf(id ?? '');
    if (!sha) return { status: 'unknownPhoto' };
    if (id) idOfSha.set(sha, id);
    return { status: 'ok', image: { photoId: null, sha256: sha, uploadUri: null, uploadBase64: 'QUJD', zoomBase64: ['up', 'low'], keptUri: `photos/${sha}.jpg`, thumbUri: `photos/${sha}-t.jpg`, aspect: 0.75 } };
  },
};
async function* replay(reading: Reading): AsyncGenerator<ReadingEvent> {
  for (const s of scheduleFor(reading)) yield s.event;
  yield { type: 'meta', latencySeconds: 0 };
}

async function setup(o: { startMs?: number; tap?: boolean } = {}) {
  const store = createMemoryStore();
  const clock = manualClock(o.startMs ?? Date.parse('2026-10-22T07:42:00-04:00'));
  const mock = createMockReadingSource({ latency: () => 0, scheduler: realScheduler });
  const reads: string[] = [];
  const legCalls: string[] = [];
  const source: ReadingSource = {
    ...mock,
    read: (image, kind, opts) => {
      reads.push(kind);
      const id = idOfSha.get(image.sha256) ?? null;
      return id && MADE[id] ? replay(MADE[id]!) : mock.read({ ...image, photoId: id }, kind, opts);
    },
    secondLook: () => null,
    legLook: (_image, kind) => {
      legCalls.push(kind);
      return Promise.resolve<LookResult<LookAnswerW>>({ ok: true, answer: W_WIDE, ms: 500, cents: 0.21 });
    },
  } as ReadingSource;
  const quota = createQuota({ store, clock, isPro: () => true });
  const svc = createFitCheckService({
    store, source, prep, quota, clock, scheduler: realScheduler, ids: counterIds(), tap: () => o.tap === true,
    timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0, lookGraceMs: 50 }),
  });
  await store.profile.put({
    id: 'me', birthYear: 2005, heightCm: 178, build: 'average', fitPreference: 'regular', styles: STYLES, boldness: null, budget: null,
    lastOccasion: 'everyday', consentVersion: '1', consentAt: clock.nowMs(), onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: clock.nowMs(),
  });
  /** The slot's posted card with its weather (the only place a check's weather comes from). */
  const setWeather = async (day: string, slot: 'day' | 'evening', w: DayWeather | null) =>
    store.dailyIdeas.put({ id: ideaId(day, slot), dayKey: day, slot, occasion: 'everyday', style: null, outfitId: null, weather: w as unknown as Record<string, unknown> | null,
      messageId: null, state: 'idea', fitCheckId: null, createdAt: clock.nowMs() });
  const start = async (photo: string, occasion: 'everyday' | 'date' | 'class' = 'everyday') => {
    const r = await svc.start({ mode: 'check', photoUri: `${photo}.jpg`, occasion });
    return (await store.fitChecks.get((r as { checkId: string }).checkId))!;
  };
  const check = async (photo: string, occasion: 'everyday' | 'date' | 'class' = 'everyday') => {
    const row = await start(photo, occasion);
    expect([photo, row.status]).toEqual([photo, 'scored']);
    return row;
  };
  const readingOfRow = async (row: FitCheckRow) => (await store.readings.get(row.readingId!))!.reading;
  const optsOf = (row: FitCheckRow) => scoreOptions(lensInput(row.occasion, row.style, { styles: STYLES, boldness: null }, row.details.secondLook));
  return { store, clock, svc, reads, legCalls, setWeather, check, start, readingOfRow, optsOf };
}
type Env = Awaited<ReturnType<typeof setup>>;
const v16Of = (row: FitCheckRow) => (row.details.parts as unknown as { v16?: PartsScored['v16'] } | undefined)?.v16;
/** The v16 score of a reading on a warm and on a cool day, with the row's own options. */
const both = (env: Env, reading: Reading, row: FitCheckRow, occasion = row.occasion) => {
  const o = { ...env.optsOf(row), occasion };
  return { warm: V16.scoreParts(reading, { ...o, season: 'warm' }).overall, cool: V16.scoreParts(reading, o).overall };
};

let log: jest.SpyInstance;
beforeEach(() => (log = jest.spyOn(console, 'log').mockImplementation(() => {})));
afterEach(() => log.mockRestore());

describe('same photo, same score, whatever the weather (F2.1)', () => {
  it('F2.1d · a photo checked on a hot day, sent again on a cold day: same score, same season, nothing counted, no read', async () => {
    const env = await setup();
    await env.setWeather('2026-10-22', 'day', HOT);
    const first = await env.check('p01a');
    const reading = await env.readingOfRow(first);
    // the precondition: p01a's overshirt is a layer, so v16 scores it differently on a warm and a cool day (7.5 / 8.0)
    expect(both(env, reading, first)).toEqual({ warm: 7.5, cool: 8.0 });
    expect([first.score, first.details.warm, v16Of(first)?.season]).toEqual([7.5, true, 'warm']);
    expect(first.details.secondLook?.w).toEqual(W_WIDE);
    expect(env.reads).toEqual(['full']);
    env.clock.advance(DAY);
    await env.setWeather('2026-10-23', 'day', COLD);
    const again = await env.check('p01a');
    expect(env.reads).toEqual(['full']);
    expect([again.score, again.details.warm, v16Of(again)?.season]).toEqual([7.5, true, 'warm']);
    expect(v16Of(again)).toEqual(v16Of(first));
    expect(again.details.secondLook).toMatchObject({ w: W_WIDE, copied: { from: first.id, why: 'samePhoto' } });
    expect(again.details.secondLook?.copied?.arms).toContain('W');
    expect(env.legCalls).toEqual(['full']);
    expect((await env.store.usage.get('2026-10-23'))?.checks ?? 0).toBe(0);
    expect((await env.store.usage.get('2026-10-22'))?.checks).toBe(1);
  });

  it('F2.1e · goingFor and profile picks never move a v16 score', () => {
    const boxy = R('BOXY');
    const sigs = new Set<string>();
    for (const goingFor of ['streetwear', 'classic_prep', null, undefined] as const) {
      for (const styles of [[], [['streetwear', 1]], [['classic_prep', 1], ['tailored', 0.5]]] as Styles[]) {
        const ev = evaluateCheck({ reading: boxy, occasion: 'everyday', styles, boldness: null, closet: [], firstCheck: false, ...(goingFor !== undefined ? { goingFor } : {}) });
        const v = (ev.row.details.parts as unknown as { v16?: PartsScored['v16'] } | undefined)?.v16;
        expect([goingFor, styles, ev.row.score, v?.gradedLook]).toEqual([goingFor, styles, 8.5, ['minimalist', 'smart_casual']]);
        sigs.add(JSON.stringify([ev.row.score, ev.row.rawScore, v]));
      }
    }
    expect(sigs.size).toBe(1);
  });

  it('F2.1f · a correction after the weather row changes keeps the first season', async () => {
    const env = await setup();
    await env.setWeather('2026-10-22', 'day', HOT);
    const row = await env.check('p01a');
    expect([row.score, row.details.warm]).toEqual([7.5, true]);
    await env.setWeather('2026-10-22', 'day', COLD); // the card's weather was refreshed after the check
    await env.svc.saveCorrection(row.id, { garmentIndex: 2, field: 'hem', value: 'no_break' });
    const corrected = (await env.store.fitChecks.get(row.id))!;
    const cr = await env.readingOfRow(corrected);
    const b = both(env, cr, corrected);
    expect(b.warm).not.toBe(b.cool); // precondition: the corrected reading still scores differently by season
    expect([corrected.score, corrected.details.warm, v16Of(corrected)?.season]).toEqual([b.warm, true, 'warm']);
    const moved = (await env.svc.changeOccasion(row.id, 'class'))!;
    expect([moved.score, moved.details.warm, v16Of(moved)?.season]).toEqual([both(env, cr, moved, 'class').warm, true, 'warm']);

    // no weather row: the month of the check (May-September warm)
    const may = await setup({ startMs: Date.parse('2026-05-12T12:00:00-04:00') });
    const m = await may.check('p01a');
    expect([m.score, m.details.warm, v16Of(m)?.season]).toEqual([7.5, true, 'warm']);
    const oct = await setup({ startMs: Date.parse('2026-10-12T12:00:00-04:00') });
    const o = await oct.check('p01a');
    expect([o.score, o.details.warm, v16Of(o)?.season]).toEqual([8.0, false, 'cool']);
  });

  it("F2.1g · on a warm day the tap's two scores, the preview and the fix numbers are the card's", async () => {
    // ph1 (the founder's Oct 7 check, reading only: black wide jeans read as sweatpants, slides read "likely"): the parts
    // engine asks one question about it. Each answer is scored on a fresh check of the same photo on a hot day.
    const probe = await setup({ tap: true });
    await probe.setWeather('2026-10-22', 'day', HOT);
    const first = await probe.start('ph1');
    expect(first.status).toBe('asking');
    const values = first.details.tap!.options.map((x) => x.value);
    expect(values.length).toBeGreaterThan(1);
    let seasonMoves = 0;
    let fixesChecked = 0;
    for (const answer of values) {
      const env = await setup({ tap: true });
      await env.setWeather('2026-10-22', 'day', HOT);
      const asking = await env.start('ph1');
      expect([answer, asking.status]).toEqual([answer, 'asking']);
      const opt = asking.details.tap!.options.find((x) => x.value === answer)!;
      const done = await env.svc.answerTap(asking.id, answer);
      expect([answer, done?.score]).toEqual([answer, opt.score]);
      const reading = await env.readingOfRow(done!);
      const b = both(env, reading, done!);
      if (b.warm !== b.cool) seasonMoves++;
      expect([answer, done!.score, done!.details.warm, v16Of(done!)?.season]).toEqual([answer, b.warm, true, 'warm']);
      // the card's fixes are the fix engine's with the card's season, not a cool day's
      const o = { ...env.optsOf(done!), closet: [], firstCheck: done!.isFirstCheck, warm: true };
      const sig = (f: { fixes: { id: string; to: number; gain: number }[] }) => f.fixes.map((x) => [x.id, x.to, x.gain]);
      const warmFx = suggestPartsFixes(reading, { ...o, season: 'warm' });
      expect([answer, done!.fixes.map((x) => [x.target, x.to, x.gain])]).toEqual([answer, sig(warmFx)]);
      if (JSON.stringify(sig(warmFx)) !== JSON.stringify(sig(suggestPartsFixes(reading, o)))) fixesChecked++;
      // "Not quite right?": the preview's number is the saved one, on the card's season
      const draft = { garmentIndex: 0, field: 'color_family' as const, value: 'black' };
      const preview = (await env.svc.previewCorrection(done!.id, { draft }))!;
      await env.svc.saveCorrection(done!.id, draft);
      const saved = (await env.store.fitChecks.get(done!.id))!;
      const sb = both(env, await env.readingOfRow(saved), saved);
      expect([answer, preview.after, saved.score, saved.details.warm]).toEqual([answer, sb.warm, sb.warm, true]);
    }
    // preconditions: the season moves at least one answer's score and one answer's fixes, so the checks above bite
    expect(seasonMoves).toBeGreaterThan(0);
    expect(fixesChecked).toBeGreaterThan(0);
    // a re-check of a warm-day check: both sides scored warm (p01a warm 7.5, cool 8.0; re-checked with p01b)
    const env = await setup();
    await env.setWeather('2026-10-22', 'day', HOT);
    const parent = await env.check('p01a');
    expect(parent.score).toBe(7.5);
    const r = await env.svc.start({ mode: 'recheck', photoUri: 'p01b.jpg', parentCheckId: parent.id });
    const re = (await env.store.fitChecks.get((r as { checkId: string }).checkId))!;
    expect(re.status).toBe('scored');
    expect(re.details.recheck?.parentScore).toBe(7.5);
    expect(re.details.recheck!.parentScore + re.details.recheck!.delta).toBe(re.score);
    const merged = await env.readingOfRow(re);
    expect(re.score).toBe(V16.scoreParts(merged, { ...env.optsOf(parent), season: 'warm' }).overall);
    expect([re.details.warm, v16Of(re)?.season]).toEqual([true, 'warm']);
  });
});

describe('the season of a check (T69-G7)', () => {
  it("T69-G7 · the season from the slot's weather, else the month", async () => {
    const seasonOf = async (startMs: number, rows: [string, 'day' | 'evening', DayWeather | null][], photo = 'p01a') => {
      const env = await setup({ startMs });
      for (const [d, s, w] of rows) await env.setWeather(d, s, w);
      const row = await env.check(photo);
      // the stored record and the engine's season agree on every new check
      expect([photo, row.details.warm]).toEqual([photo, v16Of(row)?.season === 'warm']);
      return [row.details.warm, v16Of(row)?.season, row.score];
    };
    const at = Date.parse('2026-10-22T07:42:00-04:00');
    // feels-like low 65 is warm (no layer needed), 64 is cool
    expect(await seasonOf(at, [['2026-10-22', 'day', weather(65, 80)]])).toEqual([true, 'warm', 7.5]);
    expect(await seasonOf(at, [['2026-10-22', 'day', weather(64, 80)]])).toEqual([false, 'cool', 8.0]);
    // no weather row: the local month, May 1 - September 30 warm
    expect(await seasonOf(Date.parse('2026-09-30T20:00:00-04:00'), [])).toEqual([true, 'warm', 7.5]);
    expect(await seasonOf(Date.parse('2026-10-01T12:00:00-04:00'), [])).toEqual([false, 'cool', 8.0]);
    expect(await seasonOf(Date.parse('2026-04-30T12:00:00-04:00'), [])).toEqual([false, 'cool', 8.0]);
    expect(await seasonOf(Date.parse('2026-05-01T12:00:00-04:00'), [])).toEqual([true, 'warm', 7.5]);
    // the 4 am day change: 3:59 am belongs to the day before's evening card, 4:00 am to the new day's
    const rows: [string, 'day' | 'evening', DayWeather][] = [['2026-10-21', 'evening', HOT], ['2026-10-22', 'day', COLD]];
    expect(await seasonOf(Date.parse('2026-10-22T03:59:00-04:00'), rows)).toEqual([true, 'warm', 7.5]);
    expect(await seasonOf(Date.parse('2026-10-22T04:00:00-04:00'), rows)).toEqual([false, 'cool', 8.0]);
    // PUFFER through the service: the heavy layer costs on a hot day only
    expect(await seasonOf(at, [['2026-10-22', 'day', HOT]], 'puffer')).toEqual([true, 'warm', 6.5]);
    expect(await seasonOf(at, [['2026-10-22', 'day', COLD]], 'puffer')).toEqual([false, 'cool', 7.0]);
  });
});

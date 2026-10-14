// The founder's phone, Oct 14: after a fit check, the re-check and new checks stopped working. This runs the flow the
// way his dev build does (real photo files, not bundled ids; the second look on; the one quick tap on; the closet call
// and on-phone measuring after the card; the daily limit off) and checks that a finished card always frees the slot.
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import type { LookAnswerL, LookAnswerU } from '@/data/types';
import { demoPhoto } from '@/demo/demoPhotos';
import { createClosetService } from '@/features/closet/service';
import { createFitCheckService, DEFAULT_TIMERS, type StartOutcome, type TimerConfig } from '@/features/fitcheck/service';
import { manualClock } from '@/services/clock';
import { createMockClosetSource } from '@/services/closetSource/mock';
import { counterIds } from '@/services/ids';
import type { ImagePrep } from '@/services/imagePrep/demo';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import type { LookResult, ReadingSource, SecondLookCall } from '@/services/readingSource/types';
import { realScheduler } from '@/services/scheduler';

const STYLES = seed.scenarios.firstRun.onboardingAnswers.styles as unknown as [string, number][];
const PEEK: LookAnswerU = { outer_kind: 'hoodie_or_sweatshirt', outer_hem_at: 'hip', under_present: 'yes', under_kind: 'tee_or_tank', under_hem_at: 'crotch', under_shows: 'clearly' };
const RESTS: LookAnswerL = { pant_end: 'full_break', covers_shoe: 'mostly' };
const ok = <A>(answer: A): LookResult<A> => ({ ok: true, answer, ms: 600, cents: 0.12 });
type Arm<A> = LookResult<A> | 'never' | 'reject' | { lateMs: number; r: LookResult<A> };
type LookPlan = { u: Arm<LookAnswerU>; l: Arm<LookAnswerL> } | 'throw' | null;
const toP = <A>(x: Arm<A>): Promise<LookResult<A>> =>
  x === 'never' ? new Promise(() => {}) : x === 'reject' ? Promise.reject(new Error('boom'))
    : 'lateMs' in x ? new Promise((r) => setTimeout(() => r(x.r), x.lateMs)) : Promise.resolve(x);

/** Which bundled photo a test file stands for (by its hash), so the mock can replay its reading. */
const photoOfSha = new Map<string, string>();
/** A real photo on his phone: a file, prepped to a face-hidden upload with close-ups (no bundled id). */
const livePrep: ImagePrep = {
  async prepare(photo) {
    if (photo.kind === 'demo') return { status: 'notImplemented' };
    const id = photo.kind === 'file' ? photo.uri.replace(/\.jpg$/, '') : null;
    const sha = photo.kind === 'retry' ? photo.sha256 : demoPhoto(id ?? '')?.sha256;
    if (!sha) return { status: 'unknownPhoto' };
    if (id) photoOfSha.set(sha, id);
    return {
      status: 'ok',
      image: { photoId: null, sha256: sha, uploadUri: null, uploadBase64: 'QUJD', zoomBase64: ['up', 'low'], keptUri: `photos/${sha}.jpg`, thumbUri: `photos/${sha}-t.jpg`, aspect: 0.75 },
    };
  },
};

interface Opts { looks?: LookPlan[]; timers?: Partial<TimerConfig>; read?: (s: ReadingSource) => ReadingSource }

async function setup(o: Opts = {}) {
  const store = createMemoryStore();
  const clock = manualClock(Date.parse('2026-10-14T12:00:00-04:00'));
  const ids = counterIds();
  const mock = createMockReadingSource({ latency: () => 0, scheduler: realScheduler });
  const looks = [...(o.looks ?? [])];
  const base: ReadingSource = {
    ...mock,
    // The mock replays the bundled reading of the photo this file stands for (the live source never sees an id).
    read: (image, kind, opts) => mock.read({ ...image, photoId: photoOfSha.get(image.sha256) ?? null }, kind, opts),
    secondLook(_image, kind): SecondLookCall | null {
      if (kind !== 'full' && kind !== 'recheck') return null;
      const plan = looks.length ? looks.shift()! : { u: ok(PEEK), l: ok(RESTS) };
      if (plan === null) return null;
      if (plan === 'throw') throw new Error('could not start');
      return { u: toP(plan.u), l: toP(plan.l) };
    },
  };
  const source = o.read ? o.read(base) : base;
  const closet = createClosetService({
    store, clock, scheduler: realScheduler, ids, source: createMockClosetSource({ latency: () => 0, scheduler: realScheduler }),
    measure: async () => new Map(),
  });
  // The phone's dev build: Free, the daily limit off (session.ts checksUsedOverride with LIVE_READING).
  const quota = createQuota({ store, clock, isPro: () => false, checksUsedOverride: () => 0 });
  const svc = createFitCheckService({
    store, source, prep: livePrep, quota, clock, scheduler: realScheduler, ids, closet, tap: () => true,
    timers: () => ({ ...DEFAULT_TIMERS, cacheHitMs: 0, lookGraceMs: 50, ...o.timers }),
  });
  await store.profile.put({
    id: 'me', birthYear: 2005, heightCm: 178, build: 'average', fitPreference: 'regular', styles: STYLES, boldness: null, budget: null,
    lastOccasion: 'everyday', consentVersion: '1', consentAt: clock.nowMs(), onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: clock.nowMs(),
  });
  const check = (photo: string, occasion: 'date' | 'everyday' = 'date') => svc.start({ mode: 'check', photoUri: `${photo}.jpg`, occasion });
  const recheck = (photo: string, parent: string) => svc.start({ mode: 'recheck', photoUri: `${photo}.jpg`, parentCheckId: parent });
  return { store, clock, svc, closet, check, recheck, mock };
}

const idOf = (r: StartOutcome) => ('checkId' in r ? r.checkId : '');
let log: jest.SpyInstance;
beforeEach(() => (log = jest.spyOn(console, 'log').mockImplementation(() => {})));
afterEach(() => log.mockRestore());

describe('his phone: check, then a re-check with a new photo, then a new check', () => {
  it('(a) check → scored → re-check with a NEW photo is read and scored', async () => {
    const { store, check, recheck, closet } = await setup();
    const first = await check('p01b');
    expect(first.outcome).toBe('scored');
    await closet.settle();
    const r = await recheck('p01a', idOf(first));
    expect(r.outcome).toBe('scored');
    const row = (await store.fitChecks.get(idOf(r)))!;
    expect(row.details.recheck?.samePhoto).toBeUndefined();
    expect(row.parentId).toBe(idOf(first));
  });

  it('(b) check → scored → a new check is scored, before and after the closet call lands', async () => {
    const { check, closet } = await setup();
    expect((await check('p01b')).outcome).toBe('scored');
    expect((await check('s15', 'everyday')).outcome).toBe('scored');
    await closet.settle();
    expect((await check('s14', 'everyday')).outcome).toBe('scored');
  });
});

describe('(c) the second look', () => {
  for (const [name, plan] of [
    ['never resolves', { u: 'never', l: 'never' }],
    ['rejects', { u: 'reject', l: 'reject' }],
    ['resolves after the reading (past the grace)', { u: { lateMs: 200, r: ok(PEEK) }, l: { lateMs: 200, r: ok(RESTS) } }],
    ['throws as it starts', 'throw'],
  ] as const) {
    it(`a look that ${name}: the check scores, then a re-check with a new photo and a new check both work`, async () => {
      const { check, recheck, closet } = await setup({ looks: [plan as LookPlan, plan as LookPlan, plan as LookPlan] });
      const first = await check('p01b');
      expect(first.outcome).toBe('scored');
      expect((await recheck('p01a', idOf(first))).outcome).toBe('scored');
      expect((await check('s15', 'everyday')).outcome).toBe('scored');
      await closet.settle();
    });
  }
});

describe('(d) the one quick tap left unanswered', () => {
  it('a new photo while the question waits: the old card is set aside, the new one is scored', async () => {
    const { store, check } = await setup();
    // ph1 (his Oct 7 black jeans) reads as sweatpants: "Jeans or sweatpants?" (tap.test.ts).
    const asked = await check('ph1', 'everyday');
    expect(asked.outcome).toBe('asking');
    const next = await check('s15', 'everyday');
    expect(next.outcome).toBe('scored');
    expect((await store.fitChecks.get(idOf(asked)))!.details.failCode).toBe('replaced');
  });
});

describe('(e) a step that never settles can no longer hold the slot', () => {
  const deafRead = (s: ReadingSource, hang: () => boolean): ReadingSource => ({
    ...s,
    read(image, kind, o) {
      if (!hang()) return s.read(image, kind, o);
      return (async function* () {
        yield { type: 'stage' as const, stage: 'photoOK' as const };
        await new Promise(() => {}); // a stalled stream that never sees the abort
      })();
    },
  });

  it('a read that never answers (and ignores the abort) times out at 14 s: Try again, and the next photo is read', async () => {
    let hang = true;
    const { store, svc, check } = await setup({ timers: { abortMs: 120, hedgeMs: 60, slowMs: 90 }, read: (s) => deafRead(s, () => hang) });
    const stuck = await check('p01b');
    expect(stuck.outcome).toBe('failed');
    expect((await store.fitChecks.get(idOf(stuck)))!.details.failCode).toBe('timeout');
    expect(svc.getState().kind).toBe('idle');
    hang = false;
    expect((await check('s15', 'everyday')).outcome).toBe('scored');
  });

  it('the same for a re-check: it fails visibly, then a re-check with another new photo works', async () => {
    let hang = false;
    const { store, check, recheck } = await setup({ timers: { abortMs: 120, hedgeMs: 60, slowMs: 90 }, read: (s) => deafRead(s, () => hang) });
    const first = idOf(await check('p01b'));
    hang = true;
    const stuck = await recheck('p01a', first);
    expect(stuck.outcome).toBe('failed');
    expect((await store.fitChecks.get(idOf(stuck)))!.details.failCode).toBe('timeout');
    hang = false;
    expect((await recheck('p01b2', first)).outcome).toBe('scored');
  });

  it('a step after the read that never settles: the slot is freed at its cap; the card keeps its score', async () => {
    let hang = true;
    const { store, svc, check, closet } = await setup({ timers: { slotMs: 300 } });
    const realAfter = closet.afterCheck;
    (closet as { afterCheck: typeof closet.afterCheck }).afterCheck = (id, image) => (hang ? new Promise(() => {}) : realAfter(id, image));
    const first = await check('p01b');
    expect(first.outcome).toBe('scored'); // scored before the closet step hung
    expect((await store.fitChecks.get(idOf(first)))!.status).toBe('scored');
    expect(svc.getState().kind).toBe('idle');
    hang = false;
    expect((await check('s15', 'everyday')).outcome).toBe('scored');
    expect(log).toHaveBeenCalledWith(expect.stringContaining('freed the slot for the next photo'));
  });

  it('photo prep that never returns: the slot is freed, nothing is posted, the next photo is read', async () => {
    let hang = true;
    const { store, check } = await setup({ timers: { slotMs: 200 } });
    const real = livePrep.prepare;
    livePrep.prepare = (p) => (hang ? new Promise(() => {}) : real(p));
    try {
      expect(await check('p01b')).toEqual({ outcome: 'error' });
      expect(await store.fitChecks.all()).toEqual([]);
      hang = false;
      expect((await check('s15', 'everyday')).outcome).toBe('scored');
    } finally {
      livePrep.prepare = real;
    }
  });

  it('one at a time still holds: a second photo while one is genuinely reading is refused ("busy")', async () => {
    const { svc, check, mock } = await setup();
    mock.holdAt = 0.5;
    const first = check('p01b');
    await new Promise((r) => setTimeout(r, 20));
    expect(await check('s15', 'everyday')).toEqual({ outcome: 'busy' });
    mock.holdAt = null;
    await svc.cancel();
    expect((await first).outcome).toBe('failed');
    expect((await check('s15', 'everyday')).outcome).toBe('scored');
  });
});

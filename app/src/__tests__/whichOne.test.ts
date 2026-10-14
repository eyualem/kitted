// "Which one is you?" (02 S23; the founder's phone, Oct 14: his re-check photo came back from prep as two people and
// the app only showed a toast). A photo with two comparable people posts the question card; tapping himself scores
// the check with everyone else covered; Cancel ends it with nothing sent or counted; a re-check keeps its first check.
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { demoPhoto } from '@/demo/demoPhotos';
import { createClosetService } from '@/features/closet/service';
import { createFitCheckService, DEFAULT_TIMERS, type StartOutcome } from '@/features/fitcheck/service';
import { dropWhichOne, leftToRight, whichOneOf } from '@/features/fitcheck/whichOne';
import { manualClock } from '@/services/clock';
import { createMockClosetSource } from '@/services/closetSource/mock';
import { counterIds } from '@/services/ids';
import type { ImagePrep, PersonBox, PhotoRef } from '@/services/imagePrep/demo';
import { isTemporaryPhoto } from '@/services/tempPhoto';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import type { ReadingSource } from '@/services/readingSource/types';
import { realScheduler } from '@/services/scheduler';

jest.mock('expo-file-system', () => ({ File: class { delete() {} }, Paths: { document: { uri: 'file:///Documents/' } } }));

const STYLES = seed.scenarios.firstRun.onboardingAnswers.styles as unknown as [string, number][];
const LEFT: PersonBox = { x: 0.05, y: 0.1, width: 0.35, height: 0.85 };
const RIGHT: PersonBox = { x: 0.55, y: 0.12, width: 0.38, height: 0.84 };

/** Photo files: "<bundled id>.jpg" is him alone; "two-<bundled id>.jpg" has someone else of his size in it (prep
 *  asks which one, until a person is given; the picked person names the hash, like the native prep). */
const photoOfSha = new Map<string, string>();
function makePrep(calls: PhotoRef[], opts: { oldNative?: boolean } = {}): ImagePrep {
  return {
    async prepare(photo) {
      calls.push(photo);
      if (photo.kind === 'demo') {
        const p = demoPhoto(photo.photoId);
        return p ? { status: 'ok', image: { photoId: p.id, sha256: p.sha256, uploadUri: null } } : { status: 'unknownPhoto' };
      }
      const file = photo.kind === 'file' ? photo.uri.split('/').pop()!.replace(/\.jpg$/, '') : null;
      const two = file?.startsWith('two-') ?? false;
      const id = file?.replace(/^two-/, '') ?? null;
      if (photo.kind === 'file' && two && !photo.person) return opts.oldNative ? { status: 'multiplePeople' } : { status: 'multiplePeople', people: [RIGHT, LEFT], aspect: 0.75 };
      const base = photo.kind === 'retry' ? photo.sha256 : demoPhoto(id ?? '')?.sha256;
      if (!base) return { status: 'unknownPhoto' };
      const picked = photo.kind === 'file' && photo.person ? [RIGHT, LEFT].findIndex((b) => b.x === photo.person!.x) : -1;
      const sha = picked >= 0 ? `${base}|person ${picked}` : base;
      if (id) photoOfSha.set(sha, id);
      return { status: 'ok', image: { photoId: null, sha256: sha, uploadUri: null, uploadBase64: 'QUJD', zoomBase64: [], keptUri: `photos/${sha}.jpg`, thumbUri: `photos/${sha}-t.jpg`, aspect: 0.75 } };
    },
  };
}

async function setup(opts: { oldNative?: boolean; read?: (s: ReadingSource) => ReadingSource } = {}) {
  const store = createMemoryStore();
  const clock = manualClock(Date.parse('2026-10-14T12:00:00-04:00'));
  const ids = counterIds();
  const mock = createMockReadingSource({ latency: () => 0, scheduler: realScheduler });
  const reads: string[] = [];
  const base: ReadingSource = {
    ...mock,
    read: (image, kind, o) => {
      reads.push(image.sha256);
      return mock.read({ ...image, photoId: image.photoId ?? photoOfSha.get(image.sha256) ?? null }, kind, o);
    },
  };
  const source = opts.read ? opts.read(base) : base;
  const closet = createClosetService({
    store, clock, scheduler: realScheduler, ids, source: createMockClosetSource({ latency: () => 0, scheduler: realScheduler }), measure: async () => new Map(),
  });
  const quota = createQuota({ store, clock, isPro: () => false, checksUsedOverride: () => 0 });
  const used = { checks: 0, rechecks: 0 };
  const consumeCheck = quota.consumeCheck.bind(quota);
  const consumeRecheck = quota.consumeRecheck.bind(quota);
  quota.consumeCheck = async (...a: Parameters<typeof consumeCheck>) => {
    used.checks += 1;
    return consumeCheck(...a);
  };
  quota.consumeRecheck = async (...a: Parameters<typeof consumeRecheck>) => {
    used.rechecks += 1;
    return consumeRecheck(...a);
  };
  const calls: PhotoRef[] = [];
  const discarded: string[] = [];
  const svc = createFitCheckService({
    store, source, prep: makePrep(calls, opts), quota, clock, scheduler: realScheduler, ids, closet, tap: () => false,
    timers: () => ({ ...DEFAULT_TIMERS, cacheHitMs: 0, lookGraceMs: 50 }), discardPhoto: (uri) => discarded.push(uri),
  });
  await store.profile.put({
    id: 'me', birthYear: 2005, heightCm: 178, build: 'average', fitPreference: 'regular', styles: STYLES, boldness: null, budget: null,
    lastOccasion: 'everyday', consentVersion: '1', consentAt: clock.nowMs(), onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: clock.nowMs(),
  });
  const tmp = (f: string) => `file:///private/var/mobile/Containers/Data/Application/X/tmp/${f}.jpg`;
  return { store, svc, closet, reads, used, calls, discarded, tmp };
}

const idOf = (r: StartOutcome | null) => (r && 'checkId' in r ? r.checkId : '');
const msgOf = (r: StartOutcome) => (r.outcome === 'whichOne' ? r.messageId : '');
let log: jest.SpyInstance;
beforeEach(() => (log = jest.spyOn(console, 'log').mockImplementation(() => {})));
afterEach(() => log.mockRestore());

describe('a photo with two people of comparable size', () => {
  it('posts "Which one is you?" with the photo and each person; nothing is read, posted as a check, or counted', async () => {
    const { store, svc, reads, used, tmp } = await setup();
    const r = await svc.start({ mode: 'check', photoUri: tmp('two-p01b'), occasion: 'date' });
    expect(r.outcome).toBe('whichOne');
    const m = await store.chat.get(msgOf(r));
    const q = whichOneOf(m);
    expect(m).toMatchObject({ role: 'stylist', kind: 'card', cardType: 'question' });
    expect(q).toMatchObject({ state: 'open', photoUri: tmp('two-p01b'), people: [RIGHT, LEFT], aspect: 0.75, mode: 'check', parentCheckId: null, occasion: 'date' });
    expect(await store.fitChecks.all()).toHaveLength(0);
    expect((await store.chat.all()).filter((x) => x.kind === 'photo')).toHaveLength(0);
    expect(reads).toHaveLength(0);
    expect(used.checks).toBe(0);
  });

  it('he taps himself: the check is prepped with that person, read, scored and counted; the question goes', async () => {
    const { store, svc, reads, used, calls, tmp } = await setup();
    const asked = await svc.start({ mode: 'check', photoUri: tmp('two-p01b'), occasion: 'date' });
    const r = await svc.pickPerson(msgOf(asked), 1);
    expect(r?.outcome).toBe('scored');
    expect(calls.at(-1)).toEqual({ kind: 'file', uri: tmp('two-p01b'), person: LEFT });
    const row = (await store.fitChecks.get(idOf(r)))!;
    expect(row.status).toBe('scored');
    expect(row.occasion).toBe('date');
    // The picked person names the photo: another pick of the same photo is another reading.
    expect(row.imageHash).toBe(`${demoPhoto('p01b')!.sha256}|person 1`);
    expect(reads).toEqual([row.imageHash]);
    expect(used.checks).toBe(1);
    expect(await store.chat.get(msgOf(asked))).toBeNull();
    const kinds = (await store.chat.all()).map((m) => `${m.kind}:${m.cardType ?? ''}`);
    expect(kinds).toEqual(['photo:', 'card:fitCheck']);
  });

  it('a second tap on the same question starts nothing more', async () => {
    const { store, svc, tmp } = await setup();
    const asked = await svc.start({ mode: 'check', photoUri: tmp('two-p01b') });
    const [a, b] = await Promise.all([svc.pickPerson(msgOf(asked), 0), svc.pickPerson(msgOf(asked), 1)]);
    expect([a?.outcome, b?.outcome].filter(Boolean)).toEqual(['scored']);
    expect(await store.fitChecks.all()).toHaveLength(1);
  });

  it('Cancel: the question goes, its temporary photo is deleted, nothing was read or counted', async () => {
    const { store, svc, reads, used, discarded, tmp } = await setup();
    const asked = await svc.start({ mode: 'check', photoUri: tmp('two-p01b') });
    expect(await svc.dismissWhichOne(msgOf(asked))).toBe(true);
    expect(await store.chat.all()).toHaveLength(0);
    expect(await store.fitChecks.all()).toHaveLength(0);
    expect(discarded).toEqual([tmp('two-p01b')]);
    expect(reads).toHaveLength(0);
    expect(used.checks).toBe(0);
    // Gone: a late tap does nothing.
    expect(await svc.pickPerson(msgOf(asked), 0)).toBeNull();
    expect(await svc.dismissWhichOne(msgOf(asked))).toBe(false);
  });

  it('a new photo while the question waits drops it (its photo deleted, never the new one)', async () => {
    const { store, svc, discarded, tmp } = await setup();
    const asked = await svc.start({ mode: 'check', photoUri: tmp('two-p01b') });
    const next = await svc.start({ mode: 'check', photoUri: tmp('s15') });
    expect(next.outcome).toBe('scored');
    expect(await store.chat.get(msgOf(asked))).toBeNull();
    expect(discarded).toEqual([tmp('two-p01b')]);
  });

  it('keeps the morning card\'s lens through the question', async () => {
    const { store, svc, tmp } = await setup();
    const asked = await svc.start({ mode: 'check', photoUri: tmp('two-p01b'), occasion: 'interview', style: 'smart_casual' });
    const r = await svc.pickPerson(msgOf(asked), 0);
    const row = (await store.fitChecks.get(idOf(r)))!;
    expect(row.occasion).toBe('interview');
    expect(row.details.goingFor).toMatchObject({ style: 'smart_casual', source: 'card' });
  });

  it('a native build from before Oct 14 (no people to show): the old "photo problem", nothing sent', async () => {
    const { svc, reads, tmp } = await setup({ oldNative: true });
    expect(await svc.start({ mode: 'check', photoUri: tmp('two-p01b') })).toEqual({ outcome: 'photoProblem', reason: 'multiplePeople' });
    expect(reads).toHaveLength(0);
  });

  it('another photo still reading: the tap is refused as busy and the question stays open', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => (release = r));
    const { store, svc, tmp } = await setup({
      read: (s) => ({
        ...s,
        read(image, kind, o) {
          if (image.photoId !== 's15') return s.read(image, kind, o);
          return (async function* () {
            await gate;
            yield* s.read(image, kind, o);
          })();
        },
      }),
    });
    const asked = await svc.start({ mode: 'check', photoUri: tmp('two-p01b') });
    const holder = svc.start({ mode: 'check', photoId: 's15' }); // a bundled photo, still reading
    await new Promise((r) => setTimeout(r, 20));
    expect((await svc.pickPerson(msgOf(asked), 0))?.outcome).toBe('busy');
    expect(whichOneOf(await store.chat.get(msgOf(asked)))?.state).toBe('open');
    release();
    expect((await holder).outcome).toBe('scored');
    expect((await svc.pickPerson(msgOf(asked), 0))?.outcome).toBe('scored');
  });
});

describe('a re-check photo with two people (his phone, Oct 14)', () => {
  it('asks, then scores as a re-check of its first check, with the re-check rules', async () => {
    const { store, svc, closet, used, tmp } = await setup();
    const first = await svc.start({ mode: 'check', photoUri: tmp('p01b') });
    expect(first.outcome).toBe('scored');
    await closet.settle();
    const asked = await svc.start({ mode: 'recheck', photoUri: tmp('two-p01a'), parentCheckId: idOf(first) });
    expect(asked.outcome).toBe('whichOne');
    expect(whichOneOf(await store.chat.get(msgOf(asked)))).toMatchObject({ mode: 'recheck', parentCheckId: idOf(first) });
    expect(used.rechecks).toBe(0);
    const r = await svc.pickPerson(msgOf(asked), 1);
    expect(r?.outcome).toBe('scored');
    const row = (await store.fitChecks.get(idOf(r)))!;
    expect(row.parentId).toBe(idOf(first));
    expect(row.details.recheck).toBeDefined();
    expect(row.rubricVersion).toBe((await store.fitChecks.get(idOf(first)))!.rubricVersion);
    expect((await store.fitChecks.get(idOf(first)))!.recheckUsed).toBe(true);
    expect(used.rechecks).toBe(1);
    expect(used.checks).toBe(1);
    const cards = (await store.chat.all()).filter((m) => m.kind === 'card').map((m) => m.cardType);
    expect(cards).toEqual(['fitCheck', 'recheck']);
  });

  it('Cancel leaves the re-check unused', async () => {
    const { store, svc, used, tmp } = await setup();
    const first = await svc.start({ mode: 'check', photoUri: tmp('p01b') });
    const asked = await svc.start({ mode: 'recheck', photoUri: tmp('two-p01a'), parentCheckId: idOf(first) });
    await svc.dismissWhichOne(msgOf(asked));
    expect((await store.fitChecks.get(idOf(first)))!.recheckUsed).toBe(false);
    expect(used.rechecks).toBe(0);
    expect((await svc.start({ mode: 'recheck', photoUri: tmp('p01a'), parentCheckId: idOf(first) })).outcome).toBe('scored');
  });
});

describe('helpers', () => {
  it('at launch every question left from the last run is dropped, with its photo', async () => {
    const { store, svc, tmp } = await setup();
    await svc.start({ mode: 'check', photoUri: tmp('two-p01b') });
    const gone: string[] = [];
    expect(await dropWhichOne(store, (u) => gone.push(u), { onlyOpen: false })).toBe(1);
    expect(gone).toEqual([tmp('two-p01b')]);
    expect(await store.chat.all()).toHaveLength(0);
  });

  it('names people left to right for VoiceOver', () => {
    expect(leftToRight([RIGHT, LEFT]).map(([i]) => i)).toEqual([1, 0]);
  });

  it('only deletes temporary files, never his kept photos', () => {
    expect(isTemporaryPhoto('file:///var/mobile/Containers/Data/Application/X/tmp/a.jpg')).toBe(true);
    expect(isTemporaryPhoto('file:///var/mobile/Containers/Data/Application/X/Library/Caches/ImagePicker/a.jpg')).toBe(true);
    expect(isTemporaryPhoto('file:///var/mobile/Containers/Data/Application/X/Documents/photos/a-photo.jpg')).toBe(false);
  });
});

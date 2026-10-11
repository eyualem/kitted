// A re-check of the same photo (#219; the founder's Oct 11 check: the identical photo scored 6.5, then 7.0, because the
// re-check called the AI again and the shirt's condition read flipped). Now the re-check reuses the reading: no read,
// the same score, the re-check isn't used up, no closet sighting, and the card says it's the same photo.
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { createFitCheckService, DEFAULT_TIMERS } from '@/features/fitcheck/service';
import { t } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { demoImagePrep } from '@/services/imagePrep/demo';
import { createQuota, isRecheckOpen } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import type { ReadingSource } from '@/services/readingSource/types';
import { realScheduler } from '@/services/scheduler';

const STYLES = seed.scenarios.firstRun.onboardingAnswers.styles as unknown as [string, number][];

async function setup() {
  const store = createMemoryStore();
  const clock = manualClock(Date.parse('2026-10-22T07:42:00-04:00'));
  const mock = createMockReadingSource({ latency: () => 0, scheduler: realScheduler });
  const reads: string[] = [];
  const source: ReadingSource = { ...mock, read: (image, kind, o) => (reads.push(kind), mock.read(image, kind, o)) };
  const quota = createQuota({ store, clock, isPro: () => true }); // Pro: two checks in one day (the third case)
  const svc = createFitCheckService({
    store, source, prep: demoImagePrep, quota, clock, scheduler: realScheduler, ids: counterIds(),
    timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }),
  });
  await store.profile.put({
    id: 'me', birthYear: 2005, heightCm: 178, build: 'average', fitPreference: 'regular', styles: STYLES, boldness: null, budget: null,
    lastOccasion: 'everyday', consentVersion: '1', consentAt: clock.nowMs(), onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: clock.nowMs(),
  });
  return { store, svc, reads, clock };
}

describe('a re-check of the same photo (#219)', () => {
  it('reuses the first check\'s reading: no read, the same score, nothing counted, the re-check still open', async () => {
    const { store, svc, reads, clock } = await setup();
    const { checkId } = (await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
    const parent = (await store.fitChecks.get(checkId))!;
    const readingsBefore = (await store.readings.all()).length;
    reads.length = 0;
    const r = await svc.start({ mode: 'recheck', photoId: 'p01b', parentCheckId: checkId });
    expect(r.outcome).toBe('scored');
    const row = (await store.fitChecks.get((r as { checkId: string }).checkId))!;
    expect(reads).toEqual([]);
    expect((await store.readings.all()).length).toBe(readingsBefore);
    expect([row.readingId, row.score, row.rawScore]).toEqual([parent.readingId, parent.score, parent.rawScore]);
    expect(row.details.recheck).toMatchObject({ parentScore: parent.score, delta: 0, rawDelta: 0, doneFixes: [], notSeen: false, samePhoto: { checkId } });
    const after = (await store.fitChecks.get(checkId))!;
    expect(after.recheckUsed).toBe(false);
    expect(isRecheckOpen(after, clock.nowMs(), clock)).toBe(true);
    expect((await store.usage.get(row.dayKey))?.rechecks ?? 0).toBe(0);
    expect(await store.closetObs.all().then((o) => o.filter((x) => x.fitCheckId === row.id))).toEqual([]);
  });

  it('a new photo after it is a normal re-check (read, scored against the first check, the re-check used)', async () => {
    const { store, svc, reads } = await setup();
    const { checkId } = (await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
    await svc.start({ mode: 'recheck', photoId: 'p01b', parentCheckId: checkId });
    reads.length = 0;
    const r = (await svc.start({ mode: 'recheck', photoId: 'p01a', parentCheckId: checkId })) as { checkId: string };
    const row = (await store.fitChecks.get(r.checkId))!;
    expect(reads).toEqual(['recheck']);
    expect(row.details.recheck!.samePhoto).toBeUndefined();
    expect((await store.fitChecks.get(checkId))!.recheckUsed).toBe(true);
    // the re-check's raw read is logged with the model it came from, not "demo-bundled" by default
    const raw = (await store.readings.all()).find((x) => x.source === 'recheckRaw')!;
    expect(raw.model).not.toBe('');
  });

  it('the photo of another check earlier that day: that check\'s reading, no read', async () => {
    const { store, svc, reads } = await setup();
    const a = (await svc.start({ mode: 'check', photoId: 's14', occasion: 'everyday' })) as { checkId: string };
    const b = (await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'everyday' })) as { checkId: string };
    reads.length = 0;
    const r = (await svc.start({ mode: 'recheck', photoId: 's14', parentCheckId: b.checkId })) as { checkId: string };
    const row = (await store.fitChecks.get(r.checkId))!;
    const first = (await store.fitChecks.get(a.checkId))!;
    expect(reads).toEqual([]);
    expect([row.readingId, row.score]).toEqual([first.readingId, first.score]);
    expect(row.details.recheck!.samePhoto).toEqual({ checkId: a.checkId });
    expect((await store.fitChecks.get(b.checkId))!.recheckUsed).toBe(false);
  });

  it('the card copy', () => {
    expect(t('recheck.samePhoto')).toBe("That's the same photo as before, so nothing changed. Make the fix, then take a new photo.");
    expect(t('recheck.samePhoto.button')).toBe('Take a new photo');
  });
});

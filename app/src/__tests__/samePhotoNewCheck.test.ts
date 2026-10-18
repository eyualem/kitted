// A new check of a photo already read (#341; the founder's Oct 18 check: the same photo scored 6.5 as a re-check, then
// 7.5 when he sent it again as a new check, because only a new check's own "full" reading was reused, so the photo
// first read by a re-check went to the AI again and the jeans' leg read flipped straight → relaxed).
// The checks, set before the fix:
//   N1  a new check of a photo first read by a re-check: no AI call, scored from that re-check's own read of the photo
//       (recheckRaw), never its merged reading (anchored to the first check's photo);
//   N2  its score is what a brand-new check of that photo scores;
//   N3  sent again: the same reading and score, still no call;
//   N4  nothing counted: the photo was already scored; a free user over today's limit gets the score, not "held";
//   N5  a correction stays with its own check: the next check of the photo starts from the uncorrected read;
//   N6  another occasion: the same reading, re-scored for that occasion (no call);
//   N7  "Try again" on a failed check, and "Score it" on a held photo, reuse a stored read of that photo too;
//   N8  a stored read in an older reading schema is read again; an older prompt version is reused;
//   N9  the second look: a re-check's own arms are copied, arms it carried from the first check's photo are not.
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import type { StoredSecondLook } from '@/data/types';
import { createFitCheckService, DEFAULT_TIMERS } from '@/features/fitcheck/service';
import { ownLookOf } from '@/features/fitcheck/secondLook';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { demoImagePrep } from '@/services/imagePrep/demo';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import type { ReadingSource } from '@/services/readingSource/types';
import { realScheduler } from '@/services/scheduler';

const STYLES = seed.scenarios.firstRun.onboardingAnswers.styles as unknown as [string, number][];
const DAY = 24 * 3600 * 1000;

async function setup(o: { pro?: boolean } = {}) {
  const store = createMemoryStore();
  const clock = manualClock(Date.parse('2026-10-22T07:42:00-04:00'));
  const mock = createMockReadingSource({ latency: () => 0, scheduler: realScheduler });
  const reads: string[] = [];
  const flags = { fail: false, pro: o.pro === true };
  const source: ReadingSource = {
    ...mock,
    read: (image, kind, opts) => {
      reads.push(kind);
      if (!flags.fail) return mock.read(image, kind, opts);
      return (async function* () {
        yield { type: 'failed' as const, code: 'ai' as const, counted: false };
      })();
    },
  };
  const quota = createQuota({ store, clock, isPro: () => flags.pro });
  const svc = createFitCheckService({
    store, source, prep: demoImagePrep, quota, clock, scheduler: realScheduler, ids: counterIds(),
    timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }),
  });
  await store.profile.put({
    id: 'me', birthYear: 2005, heightCm: 178, build: 'average', fitPreference: 'regular', styles: STYLES, boldness: null, budget: null,
    lastOccasion: 'everyday', consentVersion: '1', consentAt: clock.nowMs(), onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: clock.nowMs(),
  });
  return { store, svc, reads, clock, quota, flags };
}

type Env = Awaited<ReturnType<typeof setup>>;
const idOf = (r: unknown) => (r as { checkId: string }).checkId;
const row = async (env: Env, id: string) => (await env.store.fitChecks.get(id))!;

/** What a brand-new check of this photo scores, in a store that has never seen it. */
async function freshScore(photoId: string, occasion: 'everyday' | 'date' | 'interview') {
  const env = await setup({ pro: true });
  return (await row(env, idOf(await env.svc.start({ mode: 'check', photoId, occasion })))).score;
}

/** p01a checked, then re-checked with p01b (a different photo, so a real re-check read). */
async function recheckedP01b(env: Env) {
  const first = idOf(await env.svc.start({ mode: 'check', photoId: 'p01a', occasion: 'everyday' }));
  const re = idOf(await env.svc.start({ mode: 'recheck', photoId: 'p01b', parentCheckId: first }));
  const recheck = await row(env, re);
  const raw = (await env.store.readings.all()).find((r) => r.source === 'recheckRaw' && r.imageHash === recheck.imageHash)!;
  return { first, re, recheck, raw };
}

describe('a new check of a photo already read (#341)', () => {
  it('N1–N3: first read by a re-check: no call, its own read (not the merged one), the score a new check gets, again', async () => {
    const env = await setup({ pro: true });
    const { recheck, raw } = await recheckedP01b(env);
    expect(raw).toBeDefined();
    const n = (await env.store.readings.all()).length;
    env.reads.length = 0;
    const b = await row(env, idOf(await env.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'everyday' })));
    expect(env.reads).toEqual([]);
    expect(b.status).toBe('scored');
    expect(b.readingId).toBe(raw.id);
    expect(b.readingId).not.toBe(recheck.readingId);
    expect(b.score).toBe(await freshScore('p01b', 'everyday'));
    expect((await env.store.readings.all()).length).toBe(n);
    const c = await row(env, idOf(await env.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'everyday' })));
    expect(env.reads).toEqual([]);
    expect([c.readingId, c.score, c.rawScore]).toEqual([b.readingId, b.score, b.rawScore]);
  });

  it('N4: nothing counted; a free user over the limit gets the score instead of "held"', async () => {
    const env = await setup();
    await recheckedP01b(env);
    expect((await env.quota.snapshot()).checksUsed).toBe(1);
    expect(await env.quota.canStartCheck()).toBe(false);
    env.reads.length = 0;
    const r = await env.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'everyday' });
    expect(r.outcome).toBe('scored');
    expect(env.reads).toEqual([]);
    expect((await env.quota.snapshot()).checksUsed).toBe(1);
    // A photo never read is still held, as before.
    expect((await env.svc.start({ mode: 'check', photoId: 's14' })).outcome).toBe('held');
  });

  it('N5: a correction stays with its own check', async () => {
    const env = await setup({ pro: true });
    const a = idOf(await env.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'everyday' }));
    const before = await row(env, a);
    const jeans = (await env.store.readings.get(before.readingId!))!.reading.garments.findIndex((g) => g.category === 'bottom');
    await env.svc.saveCorrection(a, { garmentIndex: jeans, field: 'leg_shape', value: 'skinny' });
    const corrected = await row(env, a);
    expect(corrected.readingId).not.toBe(before.readingId);
    env.reads.length = 0;
    const b = await row(env, idOf(await env.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'everyday' })));
    expect(env.reads).toEqual([]);
    expect([b.readingId, b.score]).toEqual([before.readingId, before.score]);
  });

  it('N5: the same for a re-check-read photo: a correction on the reusing check never reaches the next one', async () => {
    const env = await setup({ pro: true });
    const { raw } = await recheckedP01b(env);
    const b = idOf(await env.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'everyday' }));
    const jeans = raw.reading.garments.findIndex((g) => g.category === 'bottom');
    const scoreB = (await row(env, b)).score;
    await env.svc.saveCorrection(b, { garmentIndex: jeans, field: 'leg_shape', value: 'skinny' });
    const c = await row(env, idOf(await env.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'everyday' })));
    expect([c.readingId, c.score]).toEqual([raw.id, scoreB]);
  });

  it('N6: another occasion: the same reading, scored for that occasion, no call', async () => {
    const env = await setup({ pro: true });
    const { raw } = await recheckedP01b(env);
    env.reads.length = 0;
    const b = await row(env, idOf(await env.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'interview' })));
    expect(env.reads).toEqual([]);
    expect([b.readingId, b.occasion]).toEqual([raw.id, 'interview']);
    expect(b.score).toBe(await freshScore('p01b', 'interview'));
  });

  it('N7: "Try again" on a check that failed reuses the photo\'s read made since', async () => {
    const env = await setup({ pro: true });
    env.flags.fail = true;
    const failed = idOf(await env.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'everyday' }));
    expect((await row(env, failed)).status).toBe('failed');
    env.flags.fail = false;
    const ok = await row(env, idOf(await env.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'everyday' })));
    env.reads.length = 0;
    expect((await env.svc.retry(failed)).outcome).toBe('scored');
    expect(env.reads).toEqual([]);
    const retried = await row(env, failed);
    expect([retried.readingId, retried.score]).toEqual([ok.readingId, ok.score]);
  });

  it('N7: "Score it" on a held photo reuses the photo\'s read made since', async () => {
    const env = await setup();
    await env.svc.start({ mode: 'check', photoId: 's14', occasion: 'everyday' });
    const held = idOf(await env.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'everyday' }));
    expect((await row(env, held)).status).toBe('held');
    env.flags.pro = true;
    const ok = await row(env, idOf(await env.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'everyday' })));
    const used = (await env.quota.snapshot()).checksUsed;
    env.reads.length = 0;
    expect((await env.svc.scoreHeldNow(held)).outcome).toBe('scored');
    expect(env.reads).toEqual([]);
    const scored = await row(env, held);
    expect([scored.readingId, scored.score]).toEqual([ok.readingId, ok.score]);
    expect((await env.quota.snapshot()).checksUsed).toBe(used);
  });

  it('N8: an older reading schema is read again; an older prompt version is reused', async () => {
    const env = await setup({ pro: true });
    const a = await row(env, idOf(await env.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'everyday' })));
    const stored = (await env.store.readings.get(a.readingId!))!;
    await env.store.readings.put({ ...stored, promptVersion: 'v2-old' });
    env.reads.length = 0;
    await env.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'everyday' });
    expect(env.reads).toEqual([]);
    await env.store.readings.put({ ...stored, schemaVersion: 'v2' });
    env.clock.advance(DAY);
    await env.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'everyday' });
    expect(env.reads).toEqual(['full']);
  });

  it('N9: a re-check\'s look gives only its own arms', () => {
    const u = { peek: true } as unknown as NonNullable<StoredSecondLook['u']>;
    const l = { rests: false } as unknown as NonNullable<StoredSecondLook['l']>;
    const carried: StoredSecondLook = { version: 'L1', u, l, copied: { from: 'FC-first', why: 'firstCheck', arms: ['U'] } };
    expect(ownLookOf({ id: 'FC-re', details: { secondLook: carried } })).toEqual({
      version: 'L1', u: null, l, copied: { from: 'FC-re', why: 'samePhoto', arms: ['L'] },
    });
    expect(ownLookOf({ id: 'FC-re', details: { secondLook: { ...carried, copied: { from: 'FC-first', why: 'firstCheck', arms: ['U', 'L'] } } } })).toBeNull();
    expect(ownLookOf({ id: 'FC-re', details: {} })).toBeUndefined();
    expect(ownLookOf({ id: 'FC-re', details: { secondLook: { version: 'L1', u, l } } })).toEqual({
      version: 'L1', u, l, copied: { from: 'FC-re', why: 'samePhoto', arms: ['U', 'L'] },
    });
  });
});

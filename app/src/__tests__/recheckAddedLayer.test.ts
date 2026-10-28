// A re-check that adds a piece (#383; the founder's Oct 28 check). Check 1: a navy tee, green cargos and black runners,
// 7.0. He put on a green zip hoodie and re-checked: the read saw the hoodie and the merge kept it, but the hoodie earns
// nothing under today's rules, so the score held at 7.0 and the card said "I still see the same outfit." Then "I did
// make the change" applied the card's only fix (grey work boots, which he wasn't wearing) to the FIRST reading: 7.5 for
// boots the photo clearly showed weren't there, and the hoodie dropped out of the reading.
// Now: a re-check that sees a new piece says so, even when the score holds; and "What changed?" / "I did make the change"
// only confirm a fix whose piece the new photo didn't clearly read, applied to what the re-check read.
import type { Reading } from '@kitted/core';
import fixture from './fixtures/oct28-hoodie-recheck.json';
import { createMemoryStore } from '@/data/memoryStore';
import { recheckSeenLine } from '@/features/fitcheck/explain';
import { createFitCheckService, DEFAULT_TIMERS } from '@/features/fitcheck/service';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import type { ImagePrep } from '@/services/imagePrep/demo';
import { createQuota } from '@/services/quota';
import type { ReadingEvent, ReadingSource } from '@/services/readingSource/types';
import { realScheduler } from '@/services/scheduler';

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const FIRST = fixture.first as unknown as Reading;
const RECHECK = fixture.recheck as unknown as Reading;

/** Readings by photo id; the photo id is its hash too. */
async function setup(reads: Record<string, Reading>) {
  const store = createMemoryStore();
  const clock = manualClock(Date.parse('2026-10-28T02:01:00-04:00'));
  const source: ReadingSource = {
    async *read(image): AsyncGenerator<ReadingEvent> {
      const r = reads[image.photoId ?? ''];
      if (!r) {
        yield { type: 'failed', code: 'unknownPhoto', counted: false };
        return;
      }
      yield { type: 'reading', reading: clone(r), model: 'test', promptVersion: 'test' };
    },
  };
  const prep: ImagePrep = {
    async prepare(photo) {
      return photo.kind === 'demo' ? { status: 'ok', image: { photoId: photo.photoId, sha256: `sha-${photo.photoId}`, uploadUri: null } } : { status: 'unknownPhoto' };
    },
  };
  const quota = createQuota({ store, clock, isPro: () => true });
  const svc = createFitCheckService({
    store, source, prep, quota, clock, scheduler: realScheduler, ids: counterIds(),
    timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }),
  });
  // His profile as the app holds it (rule 7): born 2004, streetwear · minimal · workwear, fit relaxed.
  await store.profile.put({
    id: 'me', birthYear: 2004, heightCm: null, build: '', fitPreference: 'relaxed',
    styles: [['streetwear', 0.5], ['minimalist', 0.25], ['workwear', 0.25]], boldness: null, budget: null,
    lastOccasion: 'everyday', consentVersion: '2', consentAt: clock.nowMs(), onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: clock.nowMs(),
  } as never);
  const check = async (photoId: string) => {
    const r = (await svc.start({ mode: 'check', photoId, occasion: 'everyday', style: 'streetwear' })) as { checkId: string };
    return (await store.fitChecks.get(r.checkId))!;
  };
  const recheck = async (photoId: string, parent: string) => {
    const r = (await svc.start({ mode: 'recheck', photoId, parentCheckId: parent })) as { checkId: string };
    return (await store.fitChecks.get(r.checkId))!;
  };
  return { store, svc, check, recheck };
}

const garments = (r: Reading) => r.garments.map((g) => `${g.category}:${g.subcategory}`).sort();

describe('a re-check that adds a piece (#383)', () => {
  it('A1: his hoodie is seen and kept: the card names it, not "the same outfit", and the score is the reading\'s own', async () => {
    const { store, check, recheck } = await setup({ first: FIRST, second: RECHECK });
    const parent = await check('first');
    expect(parent.score).toBe(7);
    expect(parent.fixes.map((f) => f.target).length).toBeGreaterThan(0);
    const row = await recheck('second', parent.id);
    const merged = (await store.readings.get(row.readingId!))!.reading;
    expect(garments(merged)).toContain('outerwear:hoodie');
    // The hoodie earns nothing under parts v14 (no part moves), so the score holds; what the card says is the bug.
    expect(row.score).toBe(7);
    expect(row.details.recheck).toMatchObject({ delta: 0, notSeen: false, seen: ['green hoodie'] });
  });

  it('A2: the card\'s line for a seen piece that holds the score', () => {
    expect(recheckSeenLine(['green hoodie'])).toBe('I see your green hoodie now. It doesn\'t change the score.');
    expect(recheckSeenLine(['green hoodie', 'white sneakers'])).toBe('I see your green hoodie and white sneakers now. They don\'t change the score.');
    expect(recheckSeenLine([])).toBe('');
  });

  it('A3: no fix to confirm when the new photo clearly read that piece as something else (his runners)', async () => {
    const { store, svc, check, recheck } = await setup({ first: FIRST, second: RECHECK });
    const parent = await check('first');
    const row = await recheck('second', parent.id);
    expect(await svc.confirmableFixes(row.id)).toEqual([]);
    // Confirming anyway changes nothing: no score on his word against a clear read.
    const all = parent.fixes.map((f) => f.target);
    expect(await svc.previewConfirm(row.id, all)).toEqual({ before: 7, after: 7 });
    expect(await svc.confirmFixes(row.id, all)).toBeNull();
    expect((await store.fitChecks.get(row.id))!.score).toBe(7);
    expect((await store.corrections.all()).filter((c) => c.kind === 'fixConfirmed')).toEqual([]);
  });

  it('A4: a fix whose piece the photo didn\'t clearly read can be confirmed, onto what the re-check read (the hoodie stays)', async () => {
    const unsure = clone(RECHECK);
    unsure.garments.find((g) => g.category === 'footwear')!.certainty = 'unsure';
    const { store, svc, check, recheck } = await setup({ first: FIRST, second: unsure });
    const parent = await check('first');
    const row = await recheck('second', parent.id);
    const shoeFix = parent.fixes.find((f) => /shoe|sneaker|boot|runner/i.test(f.target + f.copy))!;
    expect(await svc.confirmableFixes(row.id)).toEqual([shoeFix.target]);
    const done = (await svc.confirmFixes(row.id, [shoeFix.target]))!;
    expect(done.score).toBeGreaterThan(7);
    const reading = (await store.readings.get(done.readingId!))!.reading;
    expect(garments(reading)).toContain('outerwear:hoodie');
    expect(garments(reading)).not.toContain('footwear:performance_runner');
  });

  it('A5: shoes out of the new photo: the shoe fix can be confirmed', async () => {
    const noShoes = clone(RECHECK);
    noShoes.scene = { ...noShoes.scene, shoes_visible: false };
    noShoes.garments = noShoes.garments.filter((g) => g.category !== 'footwear');
    const { svc, check, recheck } = await setup({ first: FIRST, second: noShoes });
    const parent = await check('first');
    const row = await recheck('second', parent.id);
    expect((await svc.confirmableFixes(row.id)).length).toBe(1);
  });

  it('A6: a new photo of the very same outfit is still "not seen", with nothing seen', async () => {
    const same = clone(FIRST);
    same.garments[0]!.volume = 3;
    const { check, recheck } = await setup({ first: FIRST, second: same });
    const parent = await check('first');
    const row = await recheck('second', parent.id);
    expect(row.details.recheck).toMatchObject({ delta: 0, notSeen: true, seen: [] });
  });

  it('A7: a same-kind color flip (blue tee read navy under the hoodie) is never named as a change', async () => {
    const flip = clone(FIRST);
    flip.garments[0]!.color_family = 'navy';
    const { check, recheck } = await setup({ first: FIRST, second: flip });
    const parent = await check('first');
    const row = await recheck('second', parent.id);
    expect(row.details.recheck!.seen).toEqual([]);
  });
});

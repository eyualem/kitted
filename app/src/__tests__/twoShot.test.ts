// The two-shot check, step 0 (handoff/12-two-shot-check.md §10, #313): a top-only check is finished by a photo of
// the pants and shoes (S0.1, S0.3, S0.5), a shoes-only check still by the shoe snap (S0.4), and the snap's photo
// prep needs no person (S0.7's JS side).
import { scoreParts, type Reading } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import type { ClosetItemRow, FitCheckRow } from '@/data/types';
import { finishInfo, snapFailedKey, snapPart } from '@/features/fitcheck/finish';
import { createFitCheckService, DEFAULT_TIMERS } from '@/features/fitcheck/service';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { demoImagePrep, type ImagePrep, type PhotoRef } from '@/services/imagePrep/demo';
import { createQuota } from '@/services/quota';
import { BOTTOM_SNAP_READING, demoReadingById } from '@/services/readingSource/demoReadings';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { realScheduler } from '@/services/scheduler';

const at = (iso: string) => Date.parse(iso);
const STYLES = seed.scenarios.firstRun.onboardingAnswers.styles as unknown as [string, number][];

async function setup(prep: ImagePrep = demoImagePrep) {
  const store = createMemoryStore();
  const clock = manualClock(at('2026-10-22T07:42:00-04:00'));
  const source = createMockReadingSource({ latency: () => 0, scheduler: realScheduler });
  const quota = createQuota({ store, clock, isPro: () => false });
  const svc = createFitCheckService({
    store, source, prep, quota, clock, scheduler: realScheduler, ids: counterIds(),
    timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }),
  });
  await store.profile.put({
    id: 'me', birthYear: 2005, heightCm: 178, build: 'average', fitPreference: 'regular', styles: STYLES, boldness: null, budget: null,
    lastOccasion: 'everyday', consentVersion: '1', consentAt: clock.nowMs(), onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: clock.nowMs(),
  });
  return { store, svc, quota };
}

async function topOnlyCheck() {
  const env = await setup();
  const { checkId } = (await env.svc.start({ mode: 'check', photoId: 'p01t', occasion: 'everyday' })) as { checkId: string };
  return { ...env, checkId };
}

describe('the demo data', () => {
  it('p01t is p01b read as top only; the bottom snap reads its pants and shoes', () => {
    const t = demoReadingById('p01t')!;
    expect(t.scene?.framing).toBe('upper_only');
    expect(t.garments.some((g) => g.category === 'bottom' || g.category === 'footwear')).toBe(false);
    expect(BOTTOM_SNAP_READING.garments.map((g) => g.category).sort()).toEqual(['bottom', 'footwear']);
  });
});

describe('S0.3 a top-only check finished by a bottom snap', () => {
  it('starts as "top only" with the finish row pending', async () => {
    const { store, checkId } = await topOnlyCheck();
    const row = (await store.fitChecks.get(checkId))!;
    // A short mirror leaves out the shoes too; "top only" is what the card names.
    expect([row.isPartial, row.notRated, row.snapState]).toEqual([true, ['shoes', 'bottom half'], 'pending']);
    expect(snapPart(row)).toBe('bottom');
    expect(row.explanation).toMatch(/Your score may change once I see your pants and shoes\.$/);
  });

  it('the snap makes it a full check scored as the merged reading, and uses no check or re-check', async () => {
    const { store, svc, quota, checkId } = await topOnlyCheck();
    const before = await quota.snapshot();
    const r = await svc.start({ mode: 'shoeSnap', photoId: 'p01b', parentCheckId: checkId });
    expect(r.outcome).toBe('scored');
    const row = (await store.fitChecks.get(checkId))!;
    expect([row.isPartial, row.notRated, row.snapState]).toEqual([false, [], 'snapped']);
    const merged = (await store.readings.get(row.readingId!))!.reading as Reading;
    expect(merged.scene?.framing).toBe('full_body');
    expect(merged.garments.filter((g) => g.category === 'bottom' || g.category === 'footwear')).toHaveLength(2);
    expect(row.score).toBe(scoreParts(merged, { occasion: 'everyday', styles: STYLES, boldness: 'a_little' }).overall);
    const after = await quota.snapshot();
    expect([after.checksUsed, after.recheckOpen, row.recheckUsed]).toEqual([before.checksUsed, before.recheckOpen, false]);
  });

  it('S0.5 the pants and shoes join the closet, linked to the check', async () => {
    const { store, svc, checkId } = await topOnlyCheck();
    const slotsBefore = (await store.closet.all()).map((c) => c.slot);
    expect(slotsBefore).not.toContain('bottom');
    await svc.start({ mode: 'shoeSnap', photoId: 'p01b', parentCheckId: checkId });
    const closet = await store.closet.all();
    expect(closet.map((c) => c.slot).sort()).toEqual([...slotsBefore, 'bottom', 'shoes'].sort());
    const links = ((await store.fitChecks.get(checkId))?.details.closetSummary?.links ?? []).filter((l) => l.origin === 'snap');
    expect(links).toHaveLength(2);
  });
});

describe('S0.4 a shoes-only check keeps the shoe snap', () => {
  it('s24: the snap merges only the shoes and the check is full', async () => {
    const { store, svc } = await setup();
    const { checkId } = (await svc.start({ mode: 'check', photoId: 's24', occasion: 'everyday' })) as { checkId: string };
    const first = (await store.fitChecks.get(checkId))!;
    expect([first.notRated, snapPart(first)]).toEqual([['shoes'], 'shoes']);
    const firstBottom = ((await store.readings.get(first.readingId!))!.reading as Reading).garments.find((g) => g.category === 'bottom');
    await svc.start({ mode: 'shoeSnap', photoId: 's24', parentCheckId: checkId });
    const row = (await store.fitChecks.get(checkId))!;
    expect([row.isPartial, row.snapState]).toEqual([false, 'snapped']);
    const merged = (await store.readings.get(row.readingId!))!.reading as Reading;
    expect(merged.garments.find((g) => g.category === 'bottom')?.subcategory).toBe(firstBottom?.subcategory);
  });
});

describe('S0.1 the finish row', () => {
  const row = (notRated: string[], finish: FitCheckRow['details']['finish'] = null) =>
    ({ id: 'FC-1', notRated, details: { finish } }) as unknown as FitCheckRow;
  const shoes = [{ id: 'S1', slot: 'shoes', isDeleted: false, name: 'White leather sneakers' }] as unknown as ClosetItemRow[];

  it('top only: "Snap your bottom half to finish.", the camera only, opening the bottom snap', () => {
    const f = finishInfo(row(['bottom half']), shoes);
    expect([f.part, f.second, f.remembered, f.hasShoes]).toEqual(['bottom', 'Snap your bottom half to finish.', null, false]);
    expect(f.snapLabel).toBe('Snap your pants and shoes');
    expect(f.snapHref).toBe('/camera?mode=shoeSnap&parent=FC-1&part=bottom');
  });

  it('top only, even with a remembered pair: no "Same shoes as …"', () => {
    const f = finishInfo(row(['bottom half'], { suggestedItemId: 'S1', weekday: 1 }), shoes);
    expect([f.remembered, f.hasShoes, f.second]).toEqual([null, false, 'Snap your bottom half to finish.']);
  });

  it('shoes only: unchanged (pick a pair, or the shoe snap)', () => {
    const f = finishInfo(row(['shoes']), shoes);
    expect([f.part, f.second, f.hasShoes, f.snapLabel]).toEqual(['shoes', 'Snap your shoes or pick a pair.', true, 'Snap your shoes']);
    expect(f.snapHref).toBe('/camera?mode=shoeSnap&parent=FC-1');
    expect(finishInfo(row(['shoes']), []).second).toBe('Snap your shoes to finish.');
  });
});

describe('S0.6 a snap that fails says so (it said nothing before #313)', () => {
  it('the bottom snap and the shoe snap each have their line; a worked or busy snap has none', () => {
    expect(snapFailedKey('failed', 'bottom')).toBe('cam.bottom.failed');
    expect(snapFailedKey('photoProblem', 'shoes')).toBe('cam.shoe.failed');
    expect(snapFailedKey('error', 'shoes')).toBe('cam.shoe.failed');
    expect([snapFailedKey('scored', 'bottom'), snapFailedKey('busy', 'shoes'), snapFailedKey('noConsent', 'shoes')]).toEqual([null, null, null]);
  });
});

describe('S0.7 a snap is prepared as a snap (no person needed), a check as a fit photo', () => {
  it('his own photos: the snap asks for the snap prep, the check does not', async () => {
    const seen: PhotoRef[] = [];
    // His files stand in for p01t (the check) and p01b (the snap): the demo prep's own images.
    const prep: ImagePrep = {
      async prepare(photo) {
        seen.push(photo);
        const id = photo.kind === 'file' ? (photo.snap ? 'p01b' : 'p01t') : photo.kind === 'demo' ? photo.photoId : 'p01b';
        return demoImagePrep.prepare({ kind: 'demo', photoId: id });
      },
    };
    const { svc, store } = await setup(prep);
    const { checkId } = (await svc.start({ mode: 'check', photoUri: 'file:///check.jpg', occasion: 'everyday' })) as { checkId: string };
    await svc.start({ mode: 'shoeSnap', photoUri: 'file:///snap.jpg', parentCheckId: checkId });
    expect(seen.map((p) => (p.kind === 'file' ? [p.uri, p.snap === true] : p.kind))).toEqual([['file:///check.jpg', false], ['file:///snap.jpg', true]]);
    expect((await store.fitChecks.get(checkId))!.isPartial).toBe(false);
    const bubble = (await store.chat.all()).find((m) => m.payload.snap === true)!;
    expect(bubble.payload.snapPart).toBe('bottom');
  });
});

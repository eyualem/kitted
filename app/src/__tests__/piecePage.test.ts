// The piece page's writes (#276) on the memory store: the heads the phone measured are kept on the check, Use as cover,
// Remove photo (and its Undo), Not this piece (a correction), and the pictures a removal deletes from the phone once
// Undo is over: never before, never after an Undo, never the kept photo, and still done after the app restarts.
import { US_EASTERN } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import { DELETE_AFTER_MS, PENDING_DELETES_KV, createClosetCleanup } from '@/features/closet/fileCleanup';
import { profileOfItem } from '@/features/closet/profile';
import { photoCheckOf, piecePhotos } from '@/features/closet/piecePhotos';
import { demoPhoto } from '@/demo/demoPhotos';
import { canSplitOff, createClosetService } from '@/features/closet/service';
import { createFitCheckService, DEFAULT_TIMERS } from '@/features/fitcheck/service';
import { closetRelPath } from '@/features/privacy/files';
import { manualClock } from '@/services/clock';
import { createMockClosetSource } from '@/services/closetSource/mock';
import { counterIds } from '@/services/ids';
import { demoImagePrep } from '@/services/imagePrep/demo';
import { headsOf, type GarmentMeasurer, type MeasuredPieces } from '@/services/measure/garments';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { realScheduler } from '@/services/scheduler';

const at = (iso: string) => Date.parse(iso);
const HEAD = [120, 380, 300, 620];

/** Measures every boxed piece: a cut-out per piece, and his head where the phone found it. */
const measure: GarmentMeasurer = async (check, pieces) => {
  const out: MeasuredPieces = new Map(pieces.map((p) => [p.key, { sampledHex: '#eeeeee', sampledL: 90, cropFile: `closet/${check.imageHash.slice(0, 6)}-${p.key}.png`, cropQuality: 0.8 }]));
  out.heads = [HEAD];
  return out;
};

async function setup(o: { only?: string[] } = {}) {
  const store = createMemoryStore();
  const clock = manualClock(at('2026-10-22T07:42:00-04:00'));
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: at('2026-10-22T07:41:00-04:00') });
  // like the demo's closet step: only these seed pieces
  if (o.only) for (const c of await store.closet.all()) if (!o.only.includes(c.id)) await store.closet.patch(c.id, { isDeleted: true });
  const ids = counterIds();
  const closet = createClosetService({ store, clock, scheduler: realScheduler, ids, source: createMockClosetSource(), measure });
  const svc = createFitCheckService({
    store, source: createMockReadingSource({ latency: () => 0, scheduler: realScheduler }), prep: demoImagePrep,
    quota: createQuota({ store, clock, isPro: () => true }), clock, scheduler: realScheduler, ids, closet,
    timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }), tap: () => true,
  });
  if (!(await store.profile.get('me'))) {
    await store.profile.put({
      id: 'me', birthYear: 2005, heightCm: 178, build: 'average', fitPreference: 'regular', styles: [['minimalist', 0.5]], boldness: null, budget: null,
      lastOccasion: 'everyday', consentVersion: '1', consentAt: clock.nowMs(), onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: clock.nowMs(),
    });
  }
  const deleted: string[] = [];
  const cleanup = () => createClosetCleanup({ store, now: () => clock.nowMs(), deleteFiles: (p) => (deleted.push(...p), p.length) });
  const r = (await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
  await closet.settle();
  const teeObs = (await store.closetObs.all()).find((o) => o.itemId === 'T1' && o.fitCheckId === r.checkId)!;
  return { store, clock, closet, svc, checkId: r.checkId, teeObs, deleted, cleanup };
}

describe('the heads the phone found are kept on the check (#276)', () => {
  it('closetSummary.heads holds them; the measurer output is checked', async () => {
    const env = await setup();
    expect((await env.store.fitChecks.get(env.checkId))!.details.closetSummary!.heads).toEqual([HEAD]);
    expect(headsOf([[1.4, -3, 1200, 500]])).toEqual([[1, 0, 1000, 500]]);
    expect(headsOf([])).toEqual([]);
    expect(headsOf(undefined)).toBeNull();
    expect(headsOf([[1, 2]])).toBeNull();
  });
});

describe('cover and Remove photo', () => {
  it('Use as cover is stored on the piece; null puts the best back; only its own live sighting can be the cover', async () => {
    const env = await setup();
    expect(profileOfItem((await env.closet.setCover('T1', env.teeObs.id))!).coverObsId).toBe(env.teeObs.id);
    expect(await env.closet.setCover('B1', env.teeObs.id)).toBeNull();
    expect(profileOfItem((await env.closet.setCover('T1', null))!).coverObsId).toBeUndefined();
  });

  it('Remove photo hides it (and drops it as cover); Undo brings both back; the sighting and the wear stay', async () => {
    const env = await setup();
    await env.closet.setCover('T1', env.teeObs.id);
    const worn = (await env.store.closet.get('T1'))!.wornCount;
    expect(await env.closet.hidePhoto('T1', env.teeObs.id)).toEqual({ wasCover: true });
    let p = profileOfItem((await env.store.closet.get('T1'))!);
    expect(p.hiddenObsIds).toEqual([env.teeObs.id]);
    expect(p.coverObsId).toBeUndefined();
    expect((await env.store.closet.get('T1'))!.wornCount).toBe(worn);
    expect((await env.store.closetObs.get(env.teeObs.id))!.decision).toBe('same');
    await env.closet.unhidePhoto('T1', env.teeObs.id, true);
    p = profileOfItem((await env.store.closet.get('T1'))!);
    expect(p.hiddenObsIds).toEqual([]);
    expect(p.coverObsId).toBe(env.teeObs.id);
  });
});

describe('Not this piece', () => {
  it('a match splits off as its own piece; the photo that made a piece cannot', async () => {
    const env = await setup();
    expect(canSplitOff(env.teeObs)).toBe(true);
    const moved = await env.closet.notThisPiece(env.teeObs.id);
    expect(moved).not.toBeNull();
    expect(moved!.id).not.toBe('T1');
    expect((await env.store.closetObs.get(env.teeObs.id))!.itemId).toBe(moved!.id);
    expect(profileOfItem((await env.store.closet.get('T1'))!).distinctFrom).toContain(moved!.id);
    // the sighting that made the new piece is its founding one now
    expect(canSplitOff((await env.store.closetObs.get(env.teeObs.id))!)).toBe(false);
    expect(await env.closet.notThisPiece(env.teeObs.id)).toBeNull();
  });
});

describe('a removal deletes its pictures once Undo is over (#276)', () => {
  it('a removed photo: nothing before the window ends, then its cut-out and print, never the kept photo', async () => {
    const env = await setup();
    const c = env.cleanup();
    await env.closet.hidePhoto('T1', env.teeObs.id);
    await c.schedule({ kind: 'photo', itemId: 'T1', obsId: env.teeObs.id });
    expect(await c.run()).toBe(0);
    env.clock.advance(DELETE_AFTER_MS + 1);
    const crop = env.teeObs.cropFile!;
    expect(await c.run()).toBe(2);
    expect(env.deleted).toEqual([crop, crop.replace(/\.png$/, '.print')]);
    expect(env.deleted.every((p) => p.startsWith('closet/'))).toBe(true);
    expect((await env.store.closetObs.get(env.teeObs.id))!.cropFile).toBeNull();
    expect(await env.store.getKv(PENDING_DELETES_KV)).toBeNull();
    // the other pieces' pictures are untouched
    expect((await env.store.closetObs.all()).filter((o) => o.id !== env.teeObs.id && o.cropFile).length).toBeGreaterThan(0);
  });

  it('after an Undo nothing is deleted, and the entry is dropped', async () => {
    const env = await setup();
    const c = env.cleanup();
    await env.closet.hidePhoto('T1', env.teeObs.id);
    await c.schedule({ kind: 'photo', itemId: 'T1', obsId: env.teeObs.id });
    await env.closet.unhidePhoto('T1', env.teeObs.id);
    env.clock.advance(DELETE_AFTER_MS + 1);
    expect(await c.run()).toBe(0);
    expect(env.deleted).toEqual([]);
    expect((await env.store.closetObs.get(env.teeObs.id))!.cropFile).toBe(env.teeObs.cropFile);
    expect(await c.pending()).toEqual([]);
  });

  it('a removed piece: all its cut-outs go, even when the app closed during the window (the list is on disk)', async () => {
    const env = await setup();
    await env.closet.removeItem('T1');
    await env.cleanup().schedule({ kind: 'piece', itemId: 'T1' });
    env.clock.advance(DELETE_AFTER_MS + 1);
    // a new launch: a fresh cleanup reads the pending list from the store
    const relaunch = env.cleanup();
    const mine = (await env.store.closetObs.all()).filter((o) => o.itemId === 'T1' && o.cropFile);
    expect(mine.length).toBeGreaterThan(0);
    expect(await relaunch.run()).toBe(mine.length * 2);
    expect((await env.store.closetObs.all()).filter((o) => o.itemId === 'T1' && o.cropFile)).toEqual([]);
  });

  it('a piece put back with Undo keeps its pictures', async () => {
    const env = await setup();
    const c = env.cleanup();
    await env.closet.removeItem('T1');
    await c.schedule({ kind: 'piece', itemId: 'T1' });
    await env.closet.restoreItem('T1');
    env.clock.advance(DELETE_AFTER_MS + 1);
    expect(await c.run()).toBe(0);
    expect(env.deleted).toEqual([]);
  });

  it('only cut-outs and prints inside closet/ can ever be deleted', () => {
    expect(closetRelPath('closet/abc-garment-0.png')).toBe('closet/abc-garment-0.png');
    expect(closetRelPath('closet/abc-garment-0.print')).toBe('closet/abc-garment-0.print');
    expect(closetRelPath('file:///var/x/Documents/closet/a.png')).toBe('closet/a.png');
    expect(closetRelPath('photos/abc-photo.jpg')).toBeNull();
    expect(closetRelPath('closet/../photos/a.png')).toBeNull();
    expect(closetRelPath('closet/a.jpg')).toBeNull();
    expect(closetRelPath(null)).toBeNull();
  });
});

describe("demo screen 96's story", () => {
  it('the khaki chinos end up with two photos (p01b, then the p01a re-check, after "Yes, same one"), each below the chin line', async () => {
    const env = await setup({ only: ['T1', 'B1', 'S1'] });
    await env.svc.start({ mode: 'recheck', photoId: 'p01a', parentCheckId: env.checkId });
    await env.closet.settle();
    for (const { checkId, ask } of await env.closet.openAsks()) await env.closet.answer(checkId, ask.obsId, 'same');
    const checks = new Map((await env.store.fitChecks.all()).map((r) => [r.id, photoCheckOf(r, false)]));
    const demo = (id: string) => {
      const d = demoPhoto(id);
      return d ? { source: d.source, aspect: d.aspect, neck: d.crop.neck } : undefined;
    };
    const chinos = (await env.store.closet.get('B1'))!;
    const { shown } = piecePhotos(chinos, await env.store.closetObs.all(), checks, { resolve: () => null, exists: () => false, demo });
    expect(shown.map((p) => p.checkId).sort()).toEqual([env.checkId, (await env.store.fitChecks.all()).find((r) => r.parentId === env.checkId)!.id].sort());
    for (const ph of shown) expect(ph.top).toBeGreaterThanOrEqual(Math.round(0.315 * 1000));
  });
});

// A photo on the wrong card (09-ui-review §8, #289; checks W1–W9 set before building). The story (as pieceMerge's):
// the seed's tee, khaki chinos (B1) and sneakers; p01b's chinos ask "Are these your khaki chinos?", the p01a re-check
// sees them again, and he answers "No, a new one", so his tan chinos (the copy, `dup`) have two photos: p01b (the one
// that made the piece) and p01a (a match). On a photo's long-press: "Not this piece" (now with Undo) and "It's another
// piece…" (move just that photo to another piece of the same kind; on a piece's only photo, merge the piece). Undo
// puts back exactly what changed, and no fit check's score moves at any step.
import { US_EASTERN } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import type { KittedStore } from '@/data/store';
import { loadScenario } from '@/data/seedLoader';
import type { ClosetItemRow, ClosetObservationRow } from '@/data/types';
import { closetGridItems, runMerge, type MergeFlowDeps } from '@/features/closet/merge';
import { piecePhotos, type PhotoCheck } from '@/features/closet/piecePhotos';
import { isLive, isOwned, profileOfItem } from '@/features/closet/profile';
import { createClosetService } from '@/features/closet/service';
import {
  anotherHref, photoMenuItems, photoOffer, pickerContent, runAnotherPiece, runNotThis, type WrongCardDeps,
} from '@/features/closet/wrongCard';
import { createFitCheckService, DEFAULT_TIMERS } from '@/features/fitcheck/service';
import { t } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { createMockClosetSource } from '@/services/closetSource/mock';
import { counterIds } from '@/services/ids';
import { demoImagePrep } from '@/services/imagePrep/demo';
import type { GarmentMeasurer, MeasuredPieces } from '@/services/measure/garments';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { realScheduler } from '@/services/scheduler';

// Node's fs and path, to check the screens use what the tests check (jest runs on Node; the app has no Node types).
declare const __dirname: string;
const { readFileSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');
const src = (...p: string[]) => readFileSync(join(__dirname, '..', ...p), 'utf8');

const at = (iso: string) => Date.parse(iso);

/** A cut-out per boxed piece, and a head where the phone found it (as the piece page's tests). */
const measure: GarmentMeasurer = async (check, pieces) => {
  const out: MeasuredPieces = new Map(pieces.map((p) => [p.key, { sampledHex: '#eeeeee', sampledL: 90, cropFile: `closet/${check.imageHash.slice(0, 6)}-${p.key}.png`, cropQuality: 0.8 }]));
  out.heads = [[120, 380, 300, 620]];
  return out;
};

async function setup(o: { only?: string[]; closetSource?: boolean } = {}) {
  const store = createMemoryStore();
  const clock = manualClock(at('2026-10-22T07:42:00-04:00'));
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: at('2026-10-22T07:41:00-04:00') });
  const only = o.only ?? ['T1', 'B1', 'S1'];
  for (const c of await store.closet.all()) if (!only.includes(c.id)) await store.closet.patch(c.id, { isDeleted: true });
  const ids = counterIds();
  const closet = createClosetService({ store, clock, scheduler: realScheduler, ids, source: o.closetSource === false ? null : createMockClosetSource(), measure });
  const svc = createFitCheckService({
    store, source: createMockReadingSource({ latency: () => 0, scheduler: realScheduler }), prep: demoImagePrep,
    quota: createQuota({ store, clock, isPro: () => true }), clock, scheduler: realScheduler, ids, closet,
    timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }), tap: () => true,
  });
  await store.profile.put({
    id: 'me', birthYear: 2005, heightCm: 178, build: 'average', fitPreference: 'regular', styles: [['minimalist', 0.5]], boldness: null, budget: null,
    lastOccasion: 'everyday', consentVersion: '1', consentAt: clock.nowMs(), onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: clock.nowMs(),
  });
  return { store, clock, closet, svc, ids };
}

type Env = Awaited<ReturnType<typeof setup>>;

/** The check p01b and its re-check p01a; with `answer`, his "No, a new one" to "Are these your khaki chinos?". */
async function story(env: Env, answer = true) {
  const r = (await env.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
  await env.closet.settle();
  env.clock.advance(8 * 60_000);
  const rc = (await env.svc.start({ mode: 'recheck', photoId: 'p01a', parentCheckId: r.checkId })) as { checkId: string };
  await env.closet.settle();
  if (!answer) return { checkId: r.checkId, recheckId: rc.checkId, dup: null };
  const ask = (await env.closet.openAsks()).find((a) => a.ask.candidateId === 'B1');
  if (!ask) throw new Error('the story has no chinos question');
  await env.closet.answer(ask.checkId, ask.ask.obsId, 'new');
  return { checkId: r.checkId, recheckId: rc.checkId, dup: (await env.store.closet.get(ask.ask.itemId))! };
}

/** The duplicate story: his tan chinos (`dup`) with their two photos, p01b (`first`, made the piece) and p01a (`match`). */
async function withDuplicate(o: { only?: string[] } = {}) {
  const env = await setup(o);
  const s = await story(env);
  const dup = s.dup!;
  const obs = await env.store.closetObs.all();
  const first = obs.find((x) => x.itemId === dup.id && x.fitCheckId === s.checkId && x.origin === 'garment')!;
  const match = obs.find((x) => x.itemId === dup.id && x.fitCheckId === s.recheckId && x.origin === 'garment')!;
  if (!first || !match) throw new Error('the duplicate has no two photos');
  return { ...env, ...s, dup, first, match };
}

const byId = <T extends { id: string }>(xs: readonly T[]) => [...xs].sort((a, b) => (a.id < b.id ? -1 : 1));
/** The rows an action can change: pieces, sightings, and the checks (with their closet summary and piece list). */
async function tables(store: KittedStore) {
  return { closet: byId(await store.closet.all()), obs: byId(await store.closetObs.all()), checks: byId(await store.fitChecks.all()) };
}
async function scores(store: KittedStore) {
  return byId(await store.fitChecks.all()).map((c) => [c.id, c.score, c.rawScore, c.subscores]);
}
async function ctx(store: KittedStore) {
  const checks = new Map((await store.fitChecks.all()).map((r) => [r.id, { imageHash: r.imageHash }]));
  return { all: await store.closet.all(), obs: await store.closetObs.all(), checks };
}
async function offerFor(env: Env, item: Pick<ClosetItemRow, 'id'>, obsId: string) {
  const c = await ctx(env.store);
  return photoOffer(c.all.find((x) => x.id === item.id)!, obsId, c);
}
const live = async (store: KittedStore, id: string) => (await store.closetObs.get(id))!;

/** The flows with the real service, recording the toasts and what the merge confirm asked. */
function deps(env: Env, confirmAnswer = true) {
  const toasts: { text: string; undo: () => Promise<void> | void }[] = [];
  const asked: string[] = [];
  const d: WrongCardDeps & MergeFlowDeps = {
    split: (obsId) => env.closet.splitPhoto(obsId),
    move: (obsId, intoId) => env.closet.movePhoto(obsId, intoId),
    restore: (u) => env.closet.restorePhoto(u),
    confirm: async (title) => {
      asked.push(title);
      return confirmAnswer;
    },
    merge: (a, b) => env.closet.merge(a, b),
    unmerge: (u) => env.closet.unmerge(u),
    toast: (text, undo) => void toasts.push({ text, undo }),
  };
  return { d, toasts, asked };
}

/** A second check of the p01a photo (the same photo, another day), its chinos linked to `itemId` as a match. */
async function samePhotoAgain(env: Env, from: ClosetObservationRow, itemId: string) {
  const parent = (await env.store.fitChecks.get(from.fitCheckId!))!;
  const checkId = 'FC-again';
  const obsId = 'O-again';
  const createdAt = parent.createdAt + 26 * 60 * 60_000;
  await env.store.fitChecks.put({
    ...parent, id: checkId, parentId: null, createdAt, itemIds: [itemId],
    details: { ...parent.details, closetSummary: { matched: [itemId], added: [], undone: [], links: [{ origin: 'garment', index: from.garmentIndex!, itemId, obsId }], asks: [], state: 'done' } },
  });
  await env.store.closetObs.put({ ...from, id: obsId, fitCheckId: checkId, itemId, decision: 'same', createdAt });
  const it = (await env.store.closet.get(itemId))!;
  await env.store.closet.patch(itemId, { wornCount: it.wornCount + 1 });
  return { checkId, obsId };
}

// ------------------------------------------------------------------------------------------------------------- W1
test('W1: "Not this piece" has Undo, which puts back exactly the sighting, the new piece, the never-same mark, the cover and hidden photos, and the check\'s closet summary', async () => {
  const env = await withDuplicate();
  // His picks on the page first: the matched photo is the cover, and a photo is hidden.
  await env.closet.setCover(env.dup.id, env.match.id);
  await env.closet.hidePhoto(env.dup.id, env.first.id);
  const before = await tables(env.store);
  const { d, toasts } = deps(env);

  const piece = await runNotThis(env.match.id, d);
  expect(piece).not.toBeNull();
  expect(piece!.id).not.toBe(env.dup.id);
  expect((await live(env.store, env.match.id)).itemId).toBe(piece!.id);
  expect(profileOfItem((await env.store.closet.get(env.dup.id))!).distinctFrom).toContain(piece!.id);
  expect(toasts).toHaveLength(1);
  expect(toasts[0]!.text).toBe(t('closet.piece.splitOff', { item: piece!.name.charAt(0).toLowerCase() + piece!.name.slice(1) }));
  expect(typeof toasts[0]!.undo).toBe('function');

  await toasts[0]!.undo();
  expect(await tables(env.store)).toEqual(before);
  expect(await env.store.closet.get(piece!.id)).toBeNull();
  const back = (await env.store.closet.get(env.dup.id))!;
  expect(profileOfItem(back).distinctFrom).not.toContain(piece!.id);
  expect(profileOfItem(back).coverObsId).toBe(env.match.id);
  expect(profileOfItem(back).hiddenObsIds).toEqual([env.first.id]);
});

test('W1: Undo also restores a "Not this piece" that re-answers his "Yes, same one"', async () => {
  // Answer "Yes" this time: the chinos photo is linked to the khaki chinos by his answer.
  const env = await setup();
  const s = await story(env, false);
  const ask = (await env.closet.openAsks()).find((a) => a.ask.candidateId === 'B1')!;
  await env.closet.answer(ask.checkId, ask.ask.obsId, 'same');
  expect((await live(env.store, ask.ask.obsId)).itemId).toBe('B1');
  void s;
  const before = await tables(env.store);
  const { d, toasts } = deps(env);
  const piece = await runNotThis(ask.ask.obsId, d);
  expect(piece).not.toBeNull();
  expect((await live(env.store, ask.ask.obsId)).itemId).not.toBe('B1');
  await toasts[0]!.undo();
  expect(await tables(env.store)).toEqual(before);
});

// ------------------------------------------------------------------------------------------------------------- W2
test('W2: "It\'s another piece…" is offered only on a photo that can be split off (or a piece\'s only photo) and only when he owns another piece of the same kind', async () => {
  expect(t('closet.piece.another')).toBe('It\'s another piece…');

  // While the copy still waits on "Are these your khaki chinos?", neither is offered on its photos.
  const open = await setup();
  await story(open, false);
  const waiting = (await open.closet.openAsks()).find((a) => a.ask.candidateId === 'B1')!;
  expect(await offerFor(open, { id: waiting.ask.itemId }, waiting.ask.obsId)).toEqual({ notThis: false, another: null });

  const env = await withDuplicate();
  // The copy's photos: both can be split off (the first one too, W8), and the khaki chinos are another pair of bottoms.
  expect(await offerFor(env, env.dup, env.match.id)).toEqual({ notThis: true, another: 'move' });
  expect(await offerFor(env, env.dup, env.first.id)).toEqual({ notThis: true, another: 'move' });
  // The white tee's photos: a match on his own tee, but no other top: "Not this piece" only.
  const teeObs = (await env.store.closetObs.all()).filter((o) => o.itemId === 'T1' && o.origin === 'garment' && isLive(o));
  expect(teeObs.length).toBeGreaterThan(0);
  for (const o of teeObs) expect(await offerFor(env, { id: 'T1' }, o.id)).toEqual({ notThis: true, another: null });
  // A removed piece doesn't count as one he owns.
  await env.store.closet.patch('T2', { isDeleted: false });
  for (const o of teeObs) expect(await offerFor(env, { id: 'T1' }, o.id)).toEqual({ notThis: true, another: 'move' });
  await env.store.closet.patch('T2', { isDeleted: true });
  for (const o of teeObs) expect((await offerFor(env, { id: 'T1' }, o.id)).another).toBeNull();
  // Without the khaki chinos the copy has no other bottoms: only "Not this piece".
  await env.store.closet.patch('B1', { isDeleted: true });
  expect(await offerFor(env, env.dup, env.match.id)).toEqual({ notThis: true, another: null });
  await env.store.closet.patch('B1', { isDeleted: false });

  // The menu: Use as cover (unless it is), Open the look, Not this piece, It's another piece…, Remove photo; the last
  // two only as offered.
  expect(photoMenuItems({ cover: false }, { notThis: true, another: 'move' })).toEqual(['cover', 'look', 'notThis', 'another', 'remove']);
  expect(photoMenuItems({ cover: true }, { notThis: true, another: null })).toEqual(['look', 'notThis', 'remove']);
  expect(photoMenuItems({ cover: true }, { notThis: false, another: 'merge' })).toEqual(['look', 'another', 'remove']);
  expect(photoMenuItems({ cover: false }, { notThis: false, another: null })).toEqual(['cover', 'look', 'remove']);
  // The page builds its menu from these, with the new label, and opens the picker from it.
  const page = src('features', 'closet', 'PiecePage.tsx');
  expect(page).toMatch(/photoMenuItems\(/);
  expect(page).toMatch(/photoOffer\(/);
  expect(page).toMatch(/'closet\.piece\.another'/);
  expect(anotherHref(env.dup.id, env.match.id)).toBe(`/sheets/merge/${env.dup.id}?photo=${env.match.id}`);
});

// ------------------------------------------------------------------------------------------------------------- W3
test('W3: its picker lists only his own pieces of the same kind, never this piece and never another kind, titled "Same as which piece?"', async () => {
  const env = await withDuplicate();
  const all = await env.store.closet.all();
  const p = pickerContent(env.dup, all, { photo: true });
  expect(p.title).toBe('Same as which piece?');
  expect(p.title).toBe(t('closet.merge.title'));
  expect(p.subtitle).toBeNull();
  expect(p.candidates.map((c) => c.id)).toEqual(['B1']);
  // The piece's own "Same as another piece…" keeps its subtitle.
  expect(pickerContent(env.dup, all, { photo: false }).subtitle).toBe(t('closet.merge.sub'));

  // Every grid piece of the whole seed closet: exactly his other live pieces of its kind.
  const full = await setup({ only: (seed.scenarios.full.closet as { id: string }[]).map((c) => c.id) });
  await story(full);
  const items = await full.store.closet.all();
  const grid = closetGridItems(items);
  expect(new Set(grid.map((c) => c.slot)).size).toBeGreaterThan(1);
  for (const it of grid) {
    const ids = pickerContent(it, items, { photo: true }).candidates.map((c) => c.id).sort();
    expect(ids).toEqual(grid.filter((c) => c.slot === it.slot && c.id !== it.id).map((c) => c.id).sort());
    for (const c of pickerContent(it, items, { photo: true }).candidates) {
      expect(c.slot).toBe(it.slot);
      expect(isOwned(c)).toBe(true);
    }
  }
  // The sheet shows that content (no merge subtitle in the photo picker).
  expect(src('features', 'closet', 'MergeSheet.tsx')).toMatch(/pickerContent\(/);
  // The service refuses another kind, or this piece itself, and changes nothing.
  const before = await tables(env.store);
  expect(await env.closet.movePhoto(env.match.id, 'T1')).toBeNull();
  expect(await env.closet.movePhoto(env.match.id, env.dup.id)).toBeNull();
  expect(await tables(env.store)).toEqual(before);
});

// ------------------------------------------------------------------------------------------------------------- W4
test('W4: picking one moves only that photo; the worn counts follow (each check counted once); the toast is "Saved as your {item}." with Undo', async () => {
  const env = await withDuplicate();
  const dupWorn = env.dup.wornCount;
  const b1 = (await env.store.closet.get('B1'))!;
  const { d, toasts } = deps(env);
  const piece = await runAnotherPiece(env.dup, env.match.id, b1, d);
  expect(piece?.id).toBe('B1');
  // Only that photo moved.
  expect((await live(env.store, env.match.id)).itemId).toBe('B1');
  expect((await live(env.store, env.first.id)).itemId).toBe(env.dup.id);
  expect(isOwned((await env.store.closet.get(env.dup.id))!)).toBe(true);
  // The re-check and its check are one look: the copy keeps that wear (its first photo is from it), the khaki chinos
  // gain it once.
  expect((await env.store.closet.get(env.dup.id))!.wornCount).toBe(dupWorn);
  expect((await env.store.closet.get('B1'))!.wornCount).toBe(b1.wornCount + 1);
  // The photos follow.
  const c = await ctx(env.store);
  const pcs = new Map([...c.checks].map(([id, h]) => [id, { id, photoFile: null, demoPhotoId: id, imageHash: h.imageHash, createdAt: 0, heads: [], mirrored: false } as PhotoCheck]));
  const photoDeps = { resolve: () => null, exists: () => false, demo: () => ({ source: 1, aspect: 0.75, neck: 0 }) };
  const shown = (id: string) => piecePhotos(c.all.find((x) => x.id === id)!, c.obs, pcs, photoDeps).shown.map((p) => p.obsId);
  expect(shown('B1')).toEqual([env.match.id]);
  expect(shown(env.dup.id)).toEqual([env.first.id]);
  // The check that saw it points at the khaki chinos.
  const rc = (await env.store.fitChecks.get(env.recheckId))!;
  expect(rc.details.closetSummary!.links!.find((l) => l.obsId === env.match.id)!.itemId).toBe('B1');
  expect(rc.itemIds).toContain('B1');
  expect(rc.itemIds).not.toContain(env.dup.id);
  // The toast.
  expect(toasts).toHaveLength(1);
  expect(toasts[0]!.text).toBe('Saved as your khaki chinos.');
  expect(typeof toasts[0]!.undo).toBe('function');
});

test('W4: the same photo re-checked moves with it, and each check counts once in the worn counts', async () => {
  const env = await withDuplicate();
  const again = await samePhotoAgain(env, env.match, env.dup.id);
  const dupWorn = (await env.store.closet.get(env.dup.id))!.wornCount;
  const b1Worn = (await env.store.closet.get('B1'))!.wornCount;
  const r = await env.closet.movePhoto(env.match.id, 'B1');
  expect(r).not.toBeNull();
  expect((await live(env.store, env.match.id)).itemId).toBe('B1');
  expect((await live(env.store, again.obsId)).itemId).toBe('B1');
  expect((await live(env.store, env.first.id)).itemId).toBe(env.dup.id);
  // The copy keeps the look its first photo is in, and loses the other day's; the khaki chinos gain both looks once.
  expect((await env.store.closet.get(env.dup.id))!.wornCount).toBe(dupWorn - 1);
  expect((await env.store.closet.get('B1'))!.wornCount).toBe(b1Worn + 2);
  const ag = (await env.store.fitChecks.get(again.checkId))!;
  expect(ag.itemIds).toEqual(['B1']);
});

test('W4: the moved photo is never matched back to the old piece (a late closet answer only adds details)', async () => {
  // Written from the v3 fields (no closet call): a late answer would normally re-match the check.
  const env = await setup({ only: ['T1', 'T2', 'S1', 'B1'], closetSource: false });
  const r = (await env.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
  await env.closet.settle();
  const tee = (await env.store.closetObs.all()).find((o) => o.fitCheckId === r.checkId && o.itemId === 'T1' && o.origin === 'garment')!;
  expect(tee).toBeDefined();
  expect((await env.store.fitChecks.get(r.checkId))!.details.closetSummary!.state).toBe('fallback');
  expect(await env.closet.movePhoto(tee.id, 'T2')).not.toBeNull();
  const late = createClosetService({ store: env.store, clock: env.clock, scheduler: realScheduler, ids: env.ids, source: createMockClosetSource(), measure });
  await late.catchUp();
  await late.settle();
  const now = (await env.store.closetObs.all()).filter((o) => o.fitCheckId === r.checkId && o.garment.category === 'top' && o.origin === 'garment' && isLive(o));
  expect(now.map((o) => [o.id, o.itemId])).toEqual([[tee.id, 'T2']]);
  expect((await env.store.closetObs.get(tee.id))!.closetReadingId).not.toBeNull(); // the details were added
});

// ------------------------------------------------------------------------------------------------------------- W5
test('W5: Undo of a move restores exactly what it changed', async () => {
  const env = await withDuplicate();
  await env.closet.setCover(env.dup.id, env.match.id);
  const before = await tables(env.store);
  const { d, toasts } = deps(env);
  expect(await runAnotherPiece(env.dup, env.match.id, (await env.store.closet.get('B1'))!, d)).not.toBeNull();
  expect(await tables(env.store)).not.toEqual(before);
  await toasts[0]!.undo();
  expect(await tables(env.store)).toEqual(before);
  expect(profileOfItem((await env.store.closet.get(env.dup.id))!).coverObsId).toBe(env.match.id);

  // With the same photo seen in a second check too.
  const env2 = await withDuplicate();
  await samePhotoAgain(env2, env2.match, env2.dup.id);
  const before2 = await tables(env2.store);
  const r = await env2.closet.movePhoto(env2.match.id, 'B1');
  expect(r).not.toBeNull();
  await env2.closet.restorePhoto(r!.undo);
  expect(await tables(env2.store)).toEqual(before2);
});

// ------------------------------------------------------------------------------------------------------------- W6
test('W6: no fit check\'s score changes after "Not this piece", a move, or either Undo', async () => {
  const env = await withDuplicate();
  const s0 = await scores(env.store);
  expect(s0.length).toBeGreaterThanOrEqual(2);
  expect(s0.every(([, s]) => typeof s === 'number')).toBe(true);
  const split = await env.closet.splitPhoto(env.match.id);
  expect(split).not.toBeNull();
  expect(await scores(env.store)).toEqual(s0);
  await env.closet.restorePhoto(split!.undo);
  expect(await scores(env.store)).toEqual(s0);
  const move = await env.closet.movePhoto(env.match.id, 'B1');
  expect(move).not.toBeNull();
  expect(await scores(env.store)).toEqual(s0);
  await env.closet.restorePhoto(move!.undo);
  expect(await scores(env.store)).toEqual(s0);
  // The first photo too (W8).
  const first = await env.closet.movePhoto(env.first.id, 'B1');
  expect(first).not.toBeNull();
  expect(await scores(env.store)).toEqual(s0);
  await env.closet.restorePhoto(first!.undo);
  expect(await scores(env.store)).toEqual(s0);
});

// ------------------------------------------------------------------------------------------------------------- W8
test('W8: on a piece with 2+ photos, "Not this piece" works on its first photo; the piece keeps its name and drawing, and its other photos stay', async () => {
  const env = await withDuplicate();
  const dup = (await env.store.closet.get(env.dup.id))!;
  const before = await tables(env.store);
  const { d, toasts } = deps(env);
  const piece = await runNotThis(env.first.id, d);
  expect(piece).not.toBeNull();
  expect(piece!.id).not.toBe(dup.id);
  expect((await live(env.store, env.first.id)).itemId).toBe(piece!.id);
  expect((await live(env.store, env.match.id)).itemId).toBe(dup.id);
  const kept = (await env.store.closet.get(dup.id))!;
  expect(isOwned(kept)).toBe(true);
  expect(kept.name).toBe(dup.name);
  expect(kept.art).toEqual(dup.art);
  expect(kept.hex).toBe(dup.hex);
  expect(kept.garment).toEqual(dup.garment);
  await toasts[0]!.undo();
  expect(await tables(env.store)).toEqual(before);
});

test('W8: "It\'s another piece…" works on the first photo as on any other', async () => {
  const env = await withDuplicate();
  const dup = (await env.store.closet.get(env.dup.id))!;
  const b1 = (await env.store.closet.get('B1'))!;
  const before = await tables(env.store);
  const { d, toasts } = deps(env);
  expect((await runAnotherPiece(dup, env.first.id, b1, d))?.id).toBe('B1');
  expect((await live(env.store, env.first.id)).itemId).toBe('B1');
  expect((await live(env.store, env.match.id)).itemId).toBe(dup.id);
  const kept = (await env.store.closet.get(dup.id))!;
  expect(isOwned(kept)).toBe(true);
  expect(kept.name).toBe(dup.name);
  expect(kept.art).toEqual(dup.art);
  expect(toasts[0]!.text).toBe('Saved as your khaki chinos.');
  await toasts[0]!.undo();
  expect(await tables(env.store)).toEqual(before);
});

test('W8: seed and "you added it" pieces with no fit-check photo are unaffected', async () => {
  const env = await withDuplicate();
  // A piece he added by describing it.
  const seedObs = (await env.store.closetObs.get('O-B1'))!;
  const b1 = (await env.store.closet.get('B1'))!;
  await env.store.closet.put({ ...b1, id: 'C-added', name: 'Grey chinos', source: 'added', starterId: null });
  await env.store.closetObs.put({ ...seedObs, id: 'O-added', itemId: 'C-added', origin: 'describe' });
  const before = await tables(env.store);
  for (const [itemId, obsId] of [['B1', 'O-B1'], ['C-added', 'O-added']] as const) {
    expect(await offerFor(env, { id: itemId }, obsId)).toEqual({ notThis: false, another: null });
    expect(await env.closet.splitPhoto(obsId)).toBeNull();
    expect(await env.closet.notThisPiece(obsId)).toBeNull();
    expect(await env.closet.movePhoto(obsId, env.dup.id)).toBeNull();
  }
  expect(await tables(env.store)).toEqual(before);
});

// ------------------------------------------------------------------------------------------------------------- W9
test('W9: on a piece\'s only photo "Not this piece" isn\'t offered; "It\'s another piece…" is, and merges the piece exactly as "Same as another piece…" does, with its Undo', async () => {
  // Two identical closets, each with a piece whose only photo is the p01b chinos: the copy after its p01a photo moved.
  const make = async () => {
    const e = await withDuplicate();
    const m = await e.closet.movePhoto(e.match.id, 'B1');
    if (!m) throw new Error('could not move the p01a photo');
    return e;
  };
  const a = await make();
  expect(await offerFor(a, a.dup, a.first.id)).toEqual({ notThis: false, another: 'merge' });
  const unchanged = await tables(a.store);
  expect(await a.closet.splitPhoto(a.first.id)).toBeNull();
  expect(await a.closet.notThisPiece(a.first.id)).toBeNull();
  // Moving a piece's only photo would leave an empty card: the move itself refuses; the picker merges instead.
  expect(await a.closet.movePhoto(a.first.id, 'B1')).toBeNull();
  expect(await tables(a.store)).toEqual(unchanged);

  // Through the photo's picker.
  const fa = deps(a);
  const dupA = (await a.store.closet.get(a.dup.id))!;
  const got = await runAnotherPiece(dupA, a.first.id, (await a.store.closet.get('B1'))!, fa.d);
  expect(got?.id).toBe('B1');
  expect(fa.asked).toEqual(['Same as your khaki chinos?']);
  // Through "Same as another piece…".
  const b = await make();
  const fb = deps(b);
  expect(await runMerge((await b.store.closet.get(b.dup.id))!, (await b.store.closet.get('B1'))!, fb.d)).not.toBeNull();
  expect(await tables(a.store)).toEqual(await tables(b.store));
  expect(fa.toasts.map((x) => x.text)).toEqual(fb.toasts.map((x) => x.text));
  expect(fa.toasts.map((x) => x.text)).toEqual(['Saved as your khaki chinos.']);
  expect(isOwned((await a.store.closet.get(a.dup.id))!)).toBe(false);
  // Its Undo.
  await fa.toasts[0]!.undo();
  expect(await tables(a.store)).toEqual(unchanged);

  // "No" on its confirm: nothing changes.
  const c = await make();
  const fc = deps(c, false);
  const beforeC = await tables(c.store);
  expect(await runAnotherPiece((await c.store.closet.get(c.dup.id))!, c.first.id, (await c.store.closet.get('B1'))!, fc.d)).toBeNull();
  expect(await tables(c.store)).toEqual(beforeC);
});

// ------------------------------------------------------------------------------------------------- W7's demo data
test('W7 (Simulator, demo screen 114): its story gives the white tee two photos, each offering both corrections, with the grey tee in the picker', async () => {
  const env = await setup({ only: ['T1', 'T2', 'B1', 'S1'] });
  await story(env, false);
  for (const { checkId, ask } of await env.closet.openAsks()) await env.closet.answer(checkId, ask.obsId, 'same');
  const tee = (await env.store.closetObs.all()).filter((o) => o.itemId === 'T1' && o.origin === 'garment' && isLive(o));
  expect(new Set(tee.map((o) => o.fitCheckId)).size).toBe(2);
  for (const o of tee) expect(await offerFor(env, { id: 'T1' }, o.id)).toEqual({ notThis: true, another: 'move' });
  expect(pickerContent((await env.store.closet.get('T1'))!, await env.store.closet.all(), { photo: true }).candidates.map((c) => c.id)).toEqual(['T2']);
});

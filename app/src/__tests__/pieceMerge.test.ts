// Merging duplicates on the piece page (09-ui-review §6.3, #280; checks M1–M4 set before building). The story: the
// seed's tee, khaki chinos and sneakers; p01b's chinos ask "Are these your khaki chinos?", the p01a re-check sees them
// again, and he answers "No, a new one", so he has a duplicate pair of chinos. On the duplicate's page "Same as another
// piece…" lists his other bottoms; picking the khaki chinos asks once, then folds the duplicate in. Undo puts both back
// exactly, and no fit check's score moves at any step.
import { US_EASTERN } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import type { KittedStore } from '@/data/store';
import { loadScenario } from '@/data/seedLoader';
import type { ClosetItemRow } from '@/data/types';
import { closetGridItems, mergeCandidates, mergeOffer, runMerge, type MergeFlowDeps } from '@/features/closet/merge';
import { isLive, isOwned, profileOfItem } from '@/features/closet/profile';
import { createClosetService } from '@/features/closet/service';
import { createFitCheckService, DEFAULT_TIMERS } from '@/features/fitcheck/service';
import { manualClock } from '@/services/clock';
import { createMockClosetSource } from '@/services/closetSource/mock';
import { counterIds } from '@/services/ids';
import { demoImagePrep } from '@/services/imagePrep/demo';
import type { GarmentMeasurer, MeasuredPieces } from '@/services/measure/garments';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { realScheduler } from '@/services/scheduler';

// Node's fs and path, to check the sheet route is there (jest runs on Node; the app has no Node types).
declare const __dirname: string;
const { existsSync, readFileSync } = jest.requireActual<{ existsSync(p: string): boolean; readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');

const at = (iso: string) => Date.parse(iso);

/** A cut-out per boxed piece, and a head where the phone found it (as the piece page's tests). */
const measure: GarmentMeasurer = async (check, pieces) => {
  const out: MeasuredPieces = new Map(pieces.map((p) => [p.key, { sampledHex: '#eeeeee', sampledL: 90, cropFile: `closet/${check.imageHash.slice(0, 6)}-${p.key}.png`, cropQuality: 0.8 }]));
  out.heads = [[120, 380, 300, 620]];
  return out;
};

async function setup(o: { only?: string[]; scenarioOnly?: boolean } = {}) {
  const store = createMemoryStore();
  const clock = manualClock(at('2026-10-22T07:42:00-04:00'));
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: at('2026-10-22T07:41:00-04:00') });
  const only = o.only ?? ['T1', 'B1', 'S1'];
  if (!o.scenarioOnly) for (const c of await store.closet.all()) if (!only.includes(c.id)) await store.closet.patch(c.id, { isDeleted: true });
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
  return { store, clock, closet, svc };
}

/** The duplicate story: after it, his chinos are two pieces, B1 (the seed's) and the copy he kept with "No". */
async function withDuplicate() {
  const env = await setup();
  const r = (await env.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
  await env.closet.settle();
  env.clock.advance(8 * 60_000);
  await env.svc.start({ mode: 'recheck', photoId: 'p01a', parentCheckId: r.checkId });
  await env.closet.settle();
  const asks = await env.closet.openAsks();
  const chinosAsk = asks.find((a) => a.ask.candidateId === 'B1');
  if (!chinosAsk) throw new Error('the story has no chinos question');
  await env.closet.answer(chinosAsk.checkId, chinosAsk.ask.obsId, 'new');
  const dup = (await env.store.closet.get(chinosAsk.ask.itemId))!;
  return { ...env, checkId: r.checkId, dup };
}

const byId = <T extends { id: string }>(xs: readonly T[]) => [...xs].sort((a, b) => (a.id < b.id ? -1 : 1));
async function tables(store: KittedStore) {
  return { closet: byId(await store.closet.all()), obs: byId(await store.closetObs.all()), checks: byId(await store.fitChecks.all()) };
}
async function scores(store: KittedStore) {
  return byId(await store.fitChecks.all()).map((c) => [c.id, c.score, c.details.closetSummary ? 'cs' : '-'] as const).map(([id, s]) => [id, s]);
}

/** A flow whose confirm says yes (or no), recording what it asked and the toast it showed. */
function flow(env: Awaited<ReturnType<typeof setup>>, answer = true) {
  const asked: { title: string; body: string; yes: string }[] = [];
  const toasts: { text: string; undo: () => Promise<void> | void }[] = [];
  const deps: MergeFlowDeps = {
    confirm: async (title, body, yes) => {
      asked.push({ title, body, yes });
      return answer;
    },
    merge: (from, into) => env.closet.merge(from, into),
    unmerge: (u) => env.closet.unmerge(u),
    toast: (text, undo) => void toasts.push({ text, undo }),
  };
  return { deps, asked, toasts };
}

test('M1: the piece page offers "Same as another piece…", listing only his own pieces in the same slot, never itself, never across slots', async () => {
  const env = await withDuplicate();
  const all = await env.store.closet.all();
  const offer = mergeOffer(env.dup, all);
  expect(offer).not.toBeNull();
  expect(offer!.label).toBe('Same as another piece…');
  expect(offer!.href).toBe(`/sheets/merge/${env.dup.id}`);
  // The picker is a registered sheet route.
  const appDir = join(__dirname, '..', 'app');
  expect(existsSync(join(appDir, 'sheets', 'merge', '[id].tsx'))).toBe(true);
  expect(readFileSync(join(appDir, '_layout.tsx'), 'utf8')).toMatch(/name="sheets\/merge\/\[id\]"\s+options=\{sheet\(/);
  expect(mergeCandidates(env.dup, all).map((c) => c.id)).toEqual(['B1']);
  expect(mergeCandidates((await env.store.closet.get('B1'))!, all).map((c) => c.id)).toEqual([env.dup.id]);
  // A piece alone in its slot has nothing to offer.
  expect(mergeCandidates((await env.store.closet.get('T1'))!, all).every((c) => c.slot === 'top' && c.id !== 'T1')).toBe(true);

  // The whole seed closet: for every piece, exactly his other live pieces of its slot (not removed, not merged, not
  // waiting on an answer).
  const full = await setup({ scenarioOnly: true });
  const items = await full.store.closet.all();
  const owned = items.filter(isOwned);
  const grid = closetGridItems(items);
  for (const it of grid) {
    const ids = mergeCandidates(it, items).map((c) => c.id).sort();
    const want = grid.filter((c) => c.slot === it.slot && c.id !== it.id).map((c) => c.id).sort();
    expect(ids).toEqual(want);
    for (const c of mergeCandidates(it, items)) {
      expect(c.slot).toBe(it.slot);
      expect(owned.some((x) => x.id === c.id)).toBe(true);
    }
  }
  expect(new Set(grid.map((c) => c.slot)).size).toBeGreaterThan(1);
  // The service refuses a merge across slots, or into itself, and changes nothing.
  const top = grid.find((c) => c.slot === 'top')!;
  const bottom = grid.find((c) => c.slot === 'bottom')!;
  const before = await tables(full.store);
  expect(await full.closet.merge(top.id, bottom.id)).toBeNull();
  expect(await full.closet.merge(top.id, top.id)).toBeNull();
  expect(await tables(full.store)).toEqual(before);
});

test('M2: picking one asks once to confirm; then every sighting moves, the merged piece leaves the grid, the worn count combines, and the two are never asked again', async () => {
  const env = await withDuplicate();
  const dupSightings = (await env.store.closetObs.all()).filter((o) => o.itemId === env.dup.id).map((o) => o.id);
  expect(dupSightings.length).toBeGreaterThan(0);
  const b1 = (await env.store.closet.get('B1'))!;
  const before = await tables(env.store);

  // No: nothing changes, and it asked once.
  const no = flow(env, false);
  expect(await runMerge(env.dup, b1, no.deps)).toBeNull();
  expect(no.asked).toHaveLength(1);
  expect(no.toasts).toHaveLength(0);
  expect(await tables(env.store)).toEqual(before);

  // Yes: asked once, in the card's words, then merged.
  const yes = flow(env, true);
  const undo = await runMerge(env.dup, b1, yes.deps);
  expect(undo).not.toBeNull();
  expect(yes.asked).toEqual([{ title: 'Same as your khaki chinos?', body: expect.stringContaining('khaki chinos') as unknown as string, yes: 'Yes, same one' }]);

  const obs = await env.store.closetObs.all();
  for (const id of dupSightings) expect(obs.find((o) => o.id === id)!.itemId).toBe('B1');
  expect(obs.filter((o) => o.itemId === env.dup.id)).toEqual([]);
  const items = await env.store.closet.all();
  const gone = items.find((c) => c.id === env.dup.id)!;
  expect(isOwned(gone)).toBe(false);
  expect(gone.mergedInto).toBe('B1');
  expect(closetGridItems(items).map((c) => c.id)).not.toContain(env.dup.id);
  expect(closetGridItems(items).map((c) => c.id)).toContain('B1');
  // No check shared both: the counts add.
  expect((await env.store.closet.get('B1'))!.wornCount).toBe(b1.wornCount + env.dup.wornCount);
  // The checks that saw the duplicate now point at the khaki chinos.
  for (const row of await env.store.fitChecks.all()) {
    expect(row.itemIds).not.toContain(env.dup.id);
    expect((row.details.closetSummary?.links ?? []).some((l) => l.itemId === env.dup.id)).toBe(false);
  }

  // Never asked about the two again: no open question names either, and a new check of the same chinos goes straight
  // to the khaki chinos.
  const involves = (a: { itemId: string; candidateId: string; runnerUpId?: string }) => [a.itemId, a.candidateId, a.runnerUpId].some((x) => x === env.dup.id);
  expect((await env.closet.openAsks()).filter(({ ask }) => involves(ask) || (ask.candidateId === 'B1' && ask.itemId === env.dup.id))).toEqual([]);
  env.clock.advance(60 * 60_000);
  const again = (await env.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'everyday' })) as { checkId: string };
  await env.closet.settle();
  const newChinos = (await env.store.closetObs.all()).filter((o) => o.fitCheckId === again.checkId && o.garment.category === 'bottom' && isLive(o));
  expect(newChinos.map((o) => o.itemId)).toEqual(['B1']);
  expect((await env.closet.openAsks()).filter(({ ask }) => involves(ask) || ask.candidateId === 'B1')).toEqual([]);
});

test('M2: a check both pieces were seen in counts once in the combined worn count', async () => {
  const env = await withDuplicate();
  // B1 was seen in the duplicate's own check too (a second sighting the engine had matched), worn once more for it.
  const dupObs = (await env.store.closetObs.all()).find((o) => o.itemId === env.dup.id && isLive(o))!;
  await env.store.closetObs.put({ ...dupObs, id: 'O-shared', itemId: 'B1', decision: 'same', garmentIndex: 9 });
  const b1 = (await env.store.closet.get('B1'))!;
  await env.store.closet.patch('B1', { wornCount: b1.wornCount + 1 });
  const into = (await env.store.closet.get('B1'))!;
  const from = (await env.store.closet.get(env.dup.id))!;
  expect(await env.closet.merge(from.id, 'B1')).not.toBeNull();
  expect((await env.store.closet.get('B1'))!.wornCount).toBe(into.wornCount + from.wornCount - 1);
});

test('M3: Undo within the toast puts both pieces back exactly: ids, sightings, cover and hidden photos', async () => {
  const env = await withDuplicate();
  // His picks on the duplicate's page before the merge: a cover, and one photo removed.
  const mine = (await env.store.closetObs.all()).filter((o) => o.itemId === env.dup.id && isLive(o) && o.closet?.visible);
  expect(mine.length).toBeGreaterThanOrEqual(2);
  await env.closet.setCover(env.dup.id, mine[1]!.id);
  await env.closet.hidePhoto(env.dup.id, mine[0]!.id);
  const before = await tables(env.store);
  const dupBefore = (await env.store.closet.get(env.dup.id))!;

  const f = flow(env, true);
  const b1 = (await env.store.closet.get('B1'))!;
  expect(await runMerge(dupBefore, b1, f.deps)).not.toBeNull();
  expect(f.toasts).toHaveLength(1);
  expect(f.toasts[0]!.text).toBe('Saved as your khaki chinos.');
  // While merged, the photo he removed stays removed on the kept piece.
  expect(profileOfItem((await env.store.closet.get('B1'))!).hiddenObsIds ?? []).toContain(mine[0]!.id);

  await f.toasts[0]!.undo();
  const after = await tables(env.store);
  expect(after).toEqual(before);
  const dupAfter = (await env.store.closet.get(env.dup.id)) as ClosetItemRow;
  expect(dupAfter.id).toBe(env.dup.id);
  expect(isOwned(dupAfter)).toBe(true);
  expect(profileOfItem(dupAfter).coverObsId).toBe(mine[1]!.id);
  expect(profileOfItem(dupAfter).hiddenObsIds).toEqual([mine[0]!.id]);
  expect(closetGridItems(await env.store.closet.all()).map((c) => c.id)).toEqual(expect.arrayContaining(['B1', env.dup.id]));
});

test('M4: every fit check\'s score is the same before and after a merge, and after its Undo', async () => {
  const env = await withDuplicate();
  const s0 = await scores(env.store);
  expect(s0.length).toBeGreaterThanOrEqual(2);
  expect(s0.every(([, s]) => typeof s === 'number')).toBe(true);
  const undo = await env.closet.merge(env.dup.id, 'B1');
  expect(undo).not.toBeNull();
  expect(await scores(env.store)).toEqual(s0);
  await env.closet.unmerge(undo!);
  expect(await scores(env.store)).toEqual(s0);
  // And the other way round (the khaki chinos into the copy).
  const undo2 = await env.closet.merge('B1', env.dup.id);
  expect(undo2).not.toBeNull();
  expect(await scores(env.store)).toEqual(s0);
  await env.closet.unmerge(undo2!);
  expect(await scores(env.store)).toEqual(s0);
});

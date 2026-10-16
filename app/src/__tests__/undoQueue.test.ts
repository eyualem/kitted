// Undo that showed late (09-ui-review §9, #294; checks U1–U7 set before building). On the Simulator the merge Undo and
// the photo Undo restored the rows exactly (M3, W1, W5) but took seconds to show. Two causes: every closet write waits
// in one queue, so an Undo waited behind background closet work queued before it; and every row an Undo wrote woke
// every open screen to re-read all its tables, once per row. The story is pieceMerge's and wrongCard's: his tan chinos
// are a copy of the khaki chinos (B1), with two photos (p01b made it, p01a matched it).
import { US_EASTERN } from '@kitted/core';
import seed from '../../assets/seed.json';
import { emitChange, MAX_HOLD_MS, holdChanges } from '@/data/changes';
import { createMemoryStore } from '@/data/memoryStore';
import type { KittedStore } from '@/data/store';
import { loadScenario } from '@/data/seedLoader';
import { watchChanges } from '@/data/useLive';
import { queueLog, serial } from '@/features/closet/checkWrites';
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

const at = (iso: string) => Date.parse(iso);

const measure: GarmentMeasurer = async (check, pieces) => {
  const out: MeasuredPieces = new Map(pieces.map((p) => [p.key, { sampledHex: '#eeeeee', sampledL: 90, cropFile: `closet/${check.imageHash.slice(0, 6)}-${p.key}.png`, cropQuality: 0.8 }]));
  out.heads = [[120, 380, 300, 620]];
  return out;
};

async function withDuplicate() {
  const store = createMemoryStore();
  const clock = manualClock(at('2026-10-22T07:42:00-04:00'));
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: at('2026-10-22T07:41:00-04:00') });
  for (const c of await store.closet.all()) if (!['T1', 'B1', 'S1'].includes(c.id)) await store.closet.patch(c.id, { isDeleted: true });
  const ids = counterIds();
  const closet = createClosetService({ store, clock, scheduler: realScheduler, ids, source: createMockClosetSource(), measure });
  const svc = createFitCheckService({
    store, source: createMockReadingSource({ latency: () => 0, scheduler: realScheduler }), prep: demoImagePrep,
    quota: createQuota({ store, clock, isPro: () => true }), clock, scheduler: realScheduler, ids, closet,
    timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }), tap: () => true,
  });
  await store.profile.put({
    id: 'me', birthYear: 2005, heightCm: 178, build: 'average', fitPreference: 'regular', styles: [['minimalist', 0.5]], boldness: null, budget: null,
    lastOccasion: 'everyday', consentVersion: '1', consentAt: clock.nowMs(), onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: clock.nowMs(),
  });
  const r = (await svc.start({ mode: 'check', photoId: 'p01b', occasion: 'date' })) as { checkId: string };
  await closet.settle();
  clock.advance(8 * 60_000);
  const rc = (await svc.start({ mode: 'recheck', photoId: 'p01a', parentCheckId: r.checkId })) as { checkId: string };
  await closet.settle();
  const ask = (await closet.openAsks()).find((a) => a.ask.candidateId === 'B1');
  if (!ask) throw new Error('the story has no chinos question');
  await closet.answer(ask.checkId, ask.ask.obsId, 'new');
  const dup = (await store.closet.get(ask.ask.itemId))!;
  const match = (await store.closetObs.all()).find((x) => x.itemId === dup.id && x.fitCheckId === rc.checkId && x.origin === 'garment')!;
  return { store, closet, checkId: r.checkId, dup, match };
}

const byId = <T extends { id: string }>(xs: readonly T[]) => [...xs].sort((a, b) => (a.id < b.id ? -1 : 1));
async function tables(store: KittedStore) {
  return { closet: byId(await store.closet.all()), obs: byId(await store.closetObs.all()), checks: byId(await store.fitChecks.all()) };
}

/** Every gate a test made, opened after it (a failed test must not leave the shared queue stuck for the next). */
const gates: (() => void)[] = [];
afterEach(async () => {
  gates.splice(0).forEach((open) => open());
  await serial(async () => {});
});

/** A queued job that holds until `open()`: a slow closet job (a late closet answer, the catch-up, the color refresh). */
function slowJob(label: string, order: string[]) {
  let open!: () => void;
  const gate = new Promise<void>((r) => { open = r; });
  gates.push(open);
  const done = serial(async () => {
    order.push(`${label} start`);
    await gate;
    order.push(`${label} end`);
  }, { label });
  return { open, done };
}

/** Lets every pending promise run (the queue and the memory store resolve on microtasks). */
const flush = async () => {
  for (let i = 0; i < 50; i++) await Promise.resolve();
};

test('U1: the merge Undo runs ahead of a slow closet job waiting in the queue', async () => {
  const env = await withDuplicate();
  const before = await tables(env.store);
  const undo = (await env.closet.merge(env.dup.id, 'B1'))!;
  const order: string[] = [];
  const slow = slowJob('enrich', order);
  // When the Undo is done, the slow job (queued before it) hasn't even started.
  let atUndo: string[] | null = null;
  await env.closet.unmerge(undo).then(() => { atUndo = [...order]; });
  expect(atUndo).toEqual([]);
  expect(order).not.toContain('enrich end');
  expect(await tables(env.store)).toEqual(before); // U3: exactly as before
  slow.open();
  await slow.done;
  expect(order).toEqual(['enrich start', 'enrich end']);
});

test('U1: the photo Undo (It\'s another piece…) runs ahead of slow work waiting in the queue', async () => {
  const env = await withDuplicate();
  const before = await tables(env.store);
  const r = (await env.closet.movePhoto(env.match.id, 'B1'))!;
  expect(r).not.toBeNull();
  const order: string[] = [];
  const colors = slowJob('refreshColors', order);
  const late = slowJob('closet answer', order);
  let atUndo: string[] | null = null;
  await env.closet.restorePhoto(r.undo).then(() => { atUndo = [...order]; });
  expect(atUndo).toEqual([]);
  expect(await tables(env.store)).toEqual(before);
  colors.open();
  late.open();
  await Promise.all([colors.done, late.done]);
  // The background jobs keep their own order.
  expect(order).toEqual(['refreshColors start', 'refreshColors end', 'closet answer start', 'closet answer end']);
});

test('U2: a job already running finishes first, and Undo never interleaves with it', async () => {
  const env = await withDuplicate();
  const undo = (await env.closet.merge(env.dup.id, 'B1'))!;
  const order: string[] = [];
  const running = slowJob('closet answer', order);
  await flush();
  expect(order).toEqual(['closet answer start']);
  const u = env.closet.unmerge(undo).then(() => order.push('undo'));
  await flush();
  expect(order).toEqual(['closet answer start']);
  running.open();
  await u;
  expect(order).toEqual(['closet answer start', 'closet answer end', 'undo']);
});

test('U2: a closet job that waited behind the Undo reads the restored rows (no stale summary written back)', async () => {
  const env = await withDuplicate();
  const undo = (await env.closet.merge(env.dup.id, 'B1'))!;
  const order: string[] = [];
  const hold = slowJob('closet answer', order);
  await flush();
  // A late closet write, queued while the merge stands: it reads the check when it starts and writes its summary back.
  const late = serial(async () => {
    const cur = (await env.store.fitChecks.get(env.checkId))!;
    await env.store.fitChecks.patch(env.checkId, { details: { ...cur.details, closetSummary: { ...cur.details.closetSummary!, enrichedAt: 1 } } });
  }, { label: 'enrich' });
  const u = env.closet.unmerge(undo);
  hold.open();
  await Promise.all([u, late]);
  const row = (await env.store.fitChecks.get(env.checkId))!;
  // The summary is the restored one (it names the copy again, not the khaki chinos it was merged into), plus the mark.
  const cs = row.details.closetSummary!;
  expect(cs.enrichedAt).toBe(1);
  expect([...(cs.matched ?? []), ...(cs.added ?? [])]).toContain(env.dup.id);
  // Something queued after the Undo (urgent or not) never runs before it.
  const seq: string[] = [];
  const a = serial(async () => { seq.push('undo 1'); }, { urgent: true, label: 'undo 1' });
  const b = serial(async () => { seq.push('after'); });
  const c = serial(async () => { seq.push('undo 2'); }, { urgent: true, label: 'undo 2' });
  await Promise.all([a, b, c]);
  expect(seq).toEqual(['undo 1', 'undo 2', 'after']);
});

test('U4: one Undo wakes an open screen once, not once per row it wrote', async () => {
  const env = await withDuplicate();
  const undo = (await env.closet.merge(env.dup.id, 'B1'))!;
  expect(undo.obs.length + undo.items.length + undo.checks.length).toBeGreaterThan(3);
  let reloads = 0;
  const off = watchChanges(['closet', 'closetObs', 'fitChecks'], () => { reloads++; });
  await env.closet.unmerge(undo);
  await flush();
  off();
  expect(reloads).toBeGreaterThanOrEqual(1);
  expect(reloads).toBeLessThanOrEqual(2);
});

test('U4: a hold never delays a notice past MAX_HOLD_MS', () => {
  jest.useFakeTimers();
  try {
    const got: string[] = [];
    const off = watchChanges(['kv'], () => got.push('kv'));
    const release = holdChanges();
    emitChange('kv', 'a');
    jest.advanceTimersByTime(MAX_HOLD_MS - 1);
    expect(got).toEqual([]);
    jest.advanceTimersByTime(1);
    // the held notice went out (useLive's reload runs on the next microtask)
    return Promise.resolve().then(() => {
      expect(got).toEqual(['kv']);
      release();
      off();
    });
  } finally {
    jest.useRealTimers();
  }
});

test('U5: an Undo logs queued, started and done with its wait', async () => {
  const env = await withDuplicate();
  const undo = (await env.closet.merge(env.dup.id, 'B1'))!;
  const order: string[] = [];
  const slow = slowJob('enrich', order);
  await env.closet.unmerge(undo);
  const lines = queueLog().slice(-3);
  expect(lines[0]).toMatch(/^undo merge queued · behind (nothing|enrich|merge)/);
  expect(lines[0]).toMatch(/ahead of 1 waiting/);
  expect(lines[1]).toMatch(/^undo merge started \+\d+ ms$/);
  expect(lines[2]).toMatch(/^undo merge done \+\d+ ms \(ran \d+ ms\)$/);
  slow.open();
  await slow.done;
});

test('U7: no fit-check score changes after a merge and its Undo jump the queue', async () => {
  const env = await withDuplicate();
  const scores = async () => byId(await env.store.fitChecks.all()).map((c) => [c.id, c.score, c.rawScore, c.subscores]);
  const before = await scores();
  const undo = (await env.closet.merge(env.dup.id, 'B1'))!;
  const slow = slowJob('enrich', []);
  await env.closet.unmerge(undo);
  slow.open();
  await slow.done;
  expect(await scores()).toEqual(before);
});

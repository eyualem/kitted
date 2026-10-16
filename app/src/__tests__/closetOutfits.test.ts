// The Closet's Outfits (09-ui-review §13, O1–O12): the engine on the full scenario's closet (16 pieces) and checks.
import { outfitValid, US_EASTERN, type ClosetItem } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import type { ClosetItemRow } from '@/data/types';
import {
  buildOutfits, gainForSlot, goesWith, LAYER_GAIN, openingSegment, outfitCount, outfitLists, outfitPieces, PUT_TOGETHER, slotChecklist,
} from '@/features/closet/outfits';
import { scoreOptions } from '@/features/fitcheck/scoring';
import { outfitReading, scoreParts } from '@kitted/core';
import { wearOutfit } from '@/features/closet/outfitActions';
import { manualClock } from '@/services/clock';

const NOW = Date.parse('2026-10-22T12:00:00-04:00');

async function setup() {
  const store = createMemoryStore();
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: NOW });
  const closet = await store.closet.all();
  const checks = await store.fitChecks.all();
  const styles = (await store.profile.get('me'))?.styles ?? null;
  return { store, closet, checks, styles };
}

const at = (items: readonly ClosetItemRow[], occasion: 'everyday' | 'date' | 'interview', styles: unknown) =>
  scoreParts(outfitReading(items as unknown as ClosetItem[]), scoreOptions({ occasion, styles: (styles ?? []) as never, boldness: null, secondLook: null })).overall!;

test('O1: only valid trios of pieces he owns, never one waiting on an answer, never twice', async () => {
  const { closet, checks, styles } = await setup();
  // One piece waiting on "Same as your …?" must never appear.
  const waiting: ClosetItemRow = { ...closet.find((c) => c.slot === 'top')!, id: 'C-wait', maybeSameAs: 'T1' };
  const all = buildOutfits({ closet: [...closet, waiting], checks, styles, occasion: 'everyday' });
  const own = new Set(outfitPieces(closet).map((c) => c.id));
  expect(all.length).toBeGreaterThan(10);
  for (const o of all) {
    expect(o.itemIds.every((id) => own.has(id))).toBe(true);
    const trio = o.itemIds.filter((id) => id !== o.layerId).map((id) => closet.find((c) => c.id === id)!) as unknown as ClosetItem[];
    expect(outfitValid(trio, styles)).toBe(true);
  }
  expect(new Set(all.map((o) => o.key)).size).toBe(all.length);
});

test('O2: the count is the trios at 7.0+ at Everyday; a layer or a chat-only piece never raises it', async () => {
  const { closet, checks, styles } = await setup();
  const n = outfitCount(closet, checks, styles);
  expect(n).toBe(buildOutfits({ closet, checks, styles, occasion: 'everyday' }).length);
  expect(n).toBe(37);
  const layer = closet.find((c) => c.slot === 'outer')!;
  expect(outfitCount([...closet, { ...layer, id: 'C-layer2' }], checks, styles)).toBe(n);
  const top = closet.find((c) => c.slot === 'top')!;
  const chatOnly: ClosetItemRow = { ...top, id: 'C-chat', source: 'chat', isPhotographed: false, garment: { ...top.garment, color_family: 'burgundy' } };
  expect(outfitCount([...closet, chatOnly], checks, styles)).toBe(n);
});

test('O3: a layer joins a trio only when it raises the score by 0.5 or more', async () => {
  const { closet, checks, styles } = await setup();
  for (const o of buildOutfits({ closet, checks, styles, occasion: 'everyday' }).filter((x) => x.layerId)) {
    const trio = o.itemIds.filter((id) => id !== o.layerId).map((id) => closet.find((c) => c.id === id)!);
    const withLayer = o.itemIds.map((id) => closet.find((c) => c.id === id)!);
    expect(at(withLayer, 'everyday', styles) - at(trio, 'everyday', styles)).toBeGreaterThanOrEqual(LAYER_GAIN);
  }
});

test('O4: best first for the occasion; another occasion re-orders', async () => {
  const { closet, checks, styles } = await setup();
  const everyday = buildOutfits({ closet, checks, styles, occasion: 'everyday' });
  for (let i = 1; i < everyday.length; i++) expect(everyday[i - 1]!.rank).toBeGreaterThanOrEqual(everyday[i]!.rank);
  const interview = buildOutfits({ closet, checks, styles, occasion: 'interview' });
  expect(interview.map((o) => o.key)).not.toEqual(everyday.map((o) => o.key));
  for (const o of everyday) expect(at(o.itemIds.filter((id) => id !== o.layerId).map((id) => closet.find((c) => c.id === id)!), 'everyday', styles)).toBeGreaterThanOrEqual(PUT_TOGETHER);
});

test('O5: unworn outfits carry no score; worn ones carry the check\'s real score and photo, the best one', async () => {
  const { closet, checks, styles } = await setup();
  const { tryNext, goTos } = outfitLists(buildOutfits({ closet, checks, styles, occasion: 'everyday' }));
  expect(tryNext.every((o) => o.worn === null)).toBe(true);
  expect(goTos.length).toBeGreaterThan(0);
  for (const o of goTos) {
    const c = checks.find((x) => x.id === o.worn!.checkId)!;
    expect(o.worn!.score).toBe(c.score);
    const trio = o.key.split('+');
    const others = checks.filter((x) => x.status === 'scored' && x.score !== null && trio.every((id) => x.itemIds.includes(id)));
    expect(o.worn!.score).toBe(Math.max(...others.map((x) => x.score!)));
  }
});

test('O6: every outfit has a reason line', async () => {
  const { closet, checks, styles } = await setup();
  for (const o of buildOutfits({ closet, checks, styles, occasion: 'date' })) {
    expect(o.reason.trim().length).toBeGreaterThan(8);
    expect(o.reason).toMatch(/[.!?]$/);
  }
});

test('O7: opens on Outfits at 3+, else Pieces; his tap wins after that', () => {
  expect(openingSegment(3, null)).toBe('outfits');
  expect(openingSegment(2, null)).toBe('pieces');
  expect(openingSegment(37, 'pieces')).toBe('pieces');
  expect(openingSegment(0, 'outfits')).toBe('outfits');
  expect(openingSegment(5, 'junk')).toBe('outfits');
});

test('O8: no outfits yet: the checklist and the missing slot\'s real +n', async () => {
  const { closet, checks, styles } = await setup();
  const noShoes = closet.filter((c) => c.slot !== 'shoes');
  expect(slotChecklist(noShoes)).toEqual([{ slot: 'top', have: true }, { slot: 'bottom', have: true }, { slot: 'shoes', have: false }]);
  expect(outfitCount(noShoes, checks, styles)).toBe(0);
  const n = gainForSlot(noShoes, checks, styles, 'shoes');
  expect(n).toBeGreaterThan(0);
  expect(slotChecklist([]).every((s) => !s.have)).toBe(true);
  expect(gainForSlot([], checks, styles, 'shoes')).toBe(0);
});

test('O9: Goes with: the piece in every outfit, honest roles, at most 3; a layer gets its own list', async () => {
  const { closet, checks, styles } = await setup();
  const all = buildOutfits({ closet, checks, styles, occasion: 'everyday' });
  const chinos = 'B1';
  const g = goesWith(chinos, all);
  expect(g.length).toBe(3);
  expect(g[0]!.role).toBe('best');
  for (const x of g) expect(x.outfit.itemIds).toContain(chinos);
  const best = g[0]!.outfit.dressiness;
  for (const x of g.slice(1)) {
    if (x.role === 'dressier') expect(x.outfit.dressiness).toBeGreaterThan(best);
    if (x.role === 'relaxed') expect(x.outfit.dressiness).toBeLessThan(best);
  }
  const olive = closet.find((c) => c.name === 'Olive overshirt')!.id;
  expect(goesWith(olive, all)).toEqual([]);
  const withOlive = buildOutfits({ closet, checks, styles, occasion: 'everyday', withLayer: olive });
  const go = goesWith(olive, withOlive);
  expect(go.length).toBeGreaterThan(0);
  for (const x of go) expect(x.outfit.itemIds).toContain(olive);
});

test('O10: Wear this logs today, and its Undo puts the day back', async () => {
  const { store } = await setup();
  const clock = manualClock(NOW);
  const day = '2026-10-22';
  const before = await store.wearLog.get(day);
  const undo = await wearOutfit({ store, clock, ids: (p) => `${p}-1` }, ['T1', 'B1', 'S1'], 'everyday');
  const logged = await store.wearLog.get(day);
  expect(logged?.outfitId).toBeTruthy();
  expect((await store.outfits.get(logged!.outfitId!))?.itemIds).toEqual(['T1', 'B1', 'S1']);
  await undo();
  expect(await store.wearLog.get(day)).toEqual(before);
});

test('O11: the same closet gives the same list; no fit-check score changes', async () => {
  const { store, closet, checks, styles } = await setup();
  const scores = checks.map((c) => [c.id, c.score]);
  const a = buildOutfits({ closet, checks, styles, occasion: 'everyday' });
  const b = buildOutfits({ closet, checks, styles, occasion: 'everyday' });
  expect(b).toEqual(a);
  expect((await store.fitChecks.all()).map((c) => [c.id, c.score])).toEqual(scores);
});

test('O12: a 40-piece closet lists in under 300 ms', async () => {
  const { closet, checks, styles } = await setup();
  const big: ClosetItemRow[] = [...closet];
  const tones = ['black', 'grey', 'navy', 'white', 'olive', 'khaki_beige', 'brown', 'denim_dark'];
  for (let i = 0; big.length < 40; i++) {
    const src = closet[i % closet.length]!;
    big.push({ ...src, id: `C-x${i}`, garment: { ...src.garment, color_family: tones[i % tones.length] } });
  }
  // The best of three runs: the full test suite runs files in parallel, which slows any one of them.
  let best = Infinity;
  for (let r = 0; r < 3; r++) {
    const t0 = Date.now();
    buildOutfits({ closet: big, checks, styles, occasion: 'everyday' });
    best = Math.min(best, Date.now() - t0);
  }
  expect(best).toBeLessThan(300);
});

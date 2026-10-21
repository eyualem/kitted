// Outfit counting at large closets (09-ui-review §23, P1–P3, #353): checks written before the speed-up. The new code
// gives exactly the answers of a frozen copy of the old (src/testing/outfitsBefore.ts), on the demo closet and on a
// 60-piece mixed one; Next best buy at 50 pieces is fast; and a changed piece is never scored from the cache.
import { US_EASTERN } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import type { ClosetItemRow, FitCheckRow } from '@/data/types';
import * as now from '@/features/closet/outfits';
import * as before from '@/testing/outfitsBefore';

declare const require: (id: string) => unknown;

const NOW = Date.parse('2026-10-22T12:00:00-04:00');
const COLORS = ['white', 'black', 'grey', 'navy', 'blue', 'olive', 'brown', 'tan', 'cream', 'green', 'red', 'burgundy'];
const LEGS = ['slim', 'straight', 'relaxed', 'wide'];

async function demo() {
  const store = createMemoryStore();
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: NOW });
  return {
    closet: await store.closet.all(),
    checks: await store.fitChecks.all(),
    styles: (await store.profile.get('me'))?.styles ?? null,
  };
}

/** The demo pieces cloned to n, each clone in another color (and pants in another leg), so few trios repeat. */
function mixed(base: readonly ClosetItemRow[], n: number): ClosetItemRow[] {
  const out: ClosetItemRow[] = [];
  for (let i = 0; i < n; i++) {
    const b = base[i % base.length]!;
    const round = Math.floor(i / base.length);
    const garment = { ...b.garment, color_family: COLORS[(i + round * 5) % COLORS.length] } as ClosetItemRow['garment'];
    if (b.slot === 'bottom') (garment as unknown as Record<string, unknown>).leg_shape = LEGS[(i + round) % LEGS.length];
    out.push({ ...b, id: `${b.id}-${i}`, garment });
  }
  return out;
}

const OCC = ['everyday', 'date', 'interview', 'class'] as const;

function sameEverywhere(closet: ClosetItemRow[], checks: FitCheckRow[], styles: Awaited<ReturnType<typeof demo>>['styles']) {
  for (const occasion of OCC) {
    expect(now.buildOutfits({ closet, checks, styles, occasion })).toEqual(before.buildOutfits({ closet, checks, styles, occasion }));
  }
  expect(now.outfitCount(closet, checks, styles)).toBe(before.outfitCount(closet, checks, styles));
  expect(now.nextBestBuy({ closet, checks, styles, marks: [] })).toEqual(before.nextBestBuy({ closet, checks, styles, marks: [] }));
  for (const slot of ['top', 'bottom', 'shoes'] as const) {
    expect(now.gainForSlot(closet, checks, styles, slot)).toBe(before.gainForSlot(closet, checks, styles, slot));
  }
  const layer = closet.find((c) => c.slot === 'outer');
  if (layer) {
    expect(now.buildOutfits({ closet, checks, styles, occasion: 'everyday', withLayer: layer.id }))
      .toEqual(before.buildOutfits({ closet, checks, styles, occasion: 'everyday', withLayer: layer.id }));
  }
}

test('P1 same answers as before on the demo closet (every occasion, the count, Next best buy, gains, a layer)', async () => {
  const { closet, checks, styles } = await demo();
  sameEverywhere(closet, checks, styles);
  // …and twice in a row (the second from the cache).
  sameEverywhere(closet, checks, styles);
});

test('P1 same answers as before on a 60-piece mixed closet', async () => {
  const { closet, checks, styles } = await demo();
  sameEverywhere(mixed(closet, 60), checks, styles);
}, 120_000);

test('P1 same answers with shoes missing (No outfits yet: the gain for a slot) and with a closet of one slot', async () => {
  const { closet, checks, styles } = await demo();
  const noShoes = closet.filter((c) => c.slot !== 'shoes');
  sameEverywhere(noShoes, checks, styles);
  sameEverywhere(closet.filter((c) => c.slot === 'top'), checks, styles);
});

test('P2 Next best buy at 50 pieces under 300 ms; a second count of the same closet under 20 ms', async () => {
  const { closet, checks, styles } = await demo();
  // A fresh copy of the module: nothing remembered from the tests above, so the first numbers are cold.
  let fresh: typeof now = now;
  jest.isolateModules(() => {
    fresh = require('@/features/closet/outfits') as typeof now;
  });
  const big = mixed(closet, 50);
  let t0 = Date.now();
  fresh.nextBestBuy({ closet: big, checks, styles, marks: [] });
  const nextBuyMs = Date.now() - t0;
  t0 = Date.now();
  fresh.outfitCount(big, checks, styles);
  const firstMs = Date.now() - t0;
  t0 = Date.now();
  fresh.outfitCount(big, checks, styles);
  const againMs = Date.now() - t0;
  const timing: string[] = [`50 pieces: Next best buy ${nextBuyMs} ms, first count ${firstMs} ms, count again ${againMs} ms`];
  for (const n of [100, 200]) {
    const c = mixed(closet, n);
    const a = Date.now();
    fresh.outfitCount(c, checks, styles);
    const first = Date.now() - a;
    const b = Date.now();
    fresh.nextBestBuy({ closet: c, checks, styles, marks: [] });
    timing.push(`${n} pieces: first count ${first} ms, Next best buy after it ${Date.now() - b} ms`);
  }
  console.log(timing.join('\n'));
  expect(nextBuyMs).toBeLessThan(300);
  expect(againMs).toBeLessThan(20);
}, 300_000);

test('P3 a changed piece is scored again, never taken from the cache', async () => {
  const { closet, checks, styles } = await demo();
  const first = now.outfitCount(closet, checks, styles);
  // Same ids, one pair of pants made skinny (a hard "big top, skinny leg" for many trios): the legacy code says how
  // many it should be; the cached code must agree.
  const pants = closet.find((c) => c.slot === 'bottom')!;
  const edited = closet.map((c) => (c.id === pants.id ? { ...c, garment: { ...c.garment, leg_shape: 'skinny' } as ClosetItemRow['garment'] } : c));
  expect(now.outfitCount(edited, checks, styles)).toBe(before.outfitCount(edited, checks, styles));
  expect(now.buildOutfits({ closet: edited, checks, styles, occasion: 'date' })).toEqual(before.buildOutfits({ closet: edited, checks, styles, occasion: 'date' }));
  // And back.
  expect(now.outfitCount(closet, checks, styles)).toBe(first);
  // An in-place edit of the same object (no new row) is seen too.
  const copy = closet.map((c) => ({ ...c, garment: { ...c.garment } as ClosetItemRow['garment'] }));
  now.outfitCount(copy, checks, styles);
  const p = copy.find((c) => c.id === pants.id)!;
  (p.garment as unknown as Record<string, unknown>).leg_shape = 'skinny';
  expect(now.outfitCount(copy, checks, styles)).toBe(before.outfitCount(edited, checks, styles));
});

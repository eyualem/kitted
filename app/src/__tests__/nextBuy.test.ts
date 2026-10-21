// The next best buy (09-ui-review §14, N1–N4): the Starter piece that adds the most outfits under the Closet's count.
import { US_EASTERN } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import type { ClosetItemRow } from '@/data/types';
import { checkSentence } from '@/features/ask/gate';
import { outfitCount } from '@/features/closet/outfits';
import { ghostPiece, nextBestBuy } from '@/features/finish/gains';
import { ownership, STARTER } from '@/features/finish/starter';

async function setup() {
  const store = createMemoryStore();
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: Date.parse('2026-10-22T12:00:00-04:00') });
  return { closet: await store.closet.all(), checks: await store.fitChecks.all(), styles: (await store.profile.get('me'))?.styles ?? null };
}

test('N1: the unowned Starter piece that adds the most outfits; none when nothing adds one', async () => {
  const { closet, checks, styles } = await setup();
  const nb = nextBestBuy({ closet, checks, styles, marks: [] })!;
  expect(nb).not.toBeNull();
  const own = ownership(closet, []);
  expect(own[nb.entry.id]?.owned).toBeFalsy();
  const base = outfitCount(closet, checks, styles);
  for (const e of STARTER) {
    const g = ghostPiece(e);
    if (!g || own[e.id]?.owned) continue;
    expect(outfitCount([...closet, g], checks, styles) - base).toBeLessThanOrEqual(nb.gain);
  }
  // Marked as owned by a tap: never suggested.
  const again = nextBestBuy({ closet, checks, styles, marks: [nb.entry.id] });
  expect(again?.entry.id).not.toBe(nb.entry.id);
  expect(nextBestBuy({ closet: [], checks, styles, marks: [] })).toBeNull();
});

test('N2: "+n" is the count with it minus without it, never counting chat-only pieces', async () => {
  const { closet, checks, styles } = await setup();
  const nb = nextBestBuy({ closet, checks, styles, marks: [] })!;
  expect(nb.gain).toBe(outfitCount([...closet, nb.ghost], checks, styles) - outfitCount(closet, checks, styles));
  const top = closet.find((c) => c.slot === 'top')!;
  const chatOnly: ClosetItemRow = { ...top, id: 'C-chat', source: 'chat', isPhotographed: false };
  expect(nextBestBuy({ closet: [...closet, chatOnly], checks, styles, marks: [] })!.gain).toBe(nb.gain);
});

test('N3: what it unlocks: only outfits with the new piece, each once, best first', async () => {
  const { closet, checks, styles } = await setup();
  const nb = nextBestBuy({ closet, checks, styles, marks: [] })!;
  expect(nb.unlocks.length).toBe(nb.gain);
  for (const o of nb.unlocks) expect(o.itemIds).toContain(nb.ghost.id);
  expect(new Set(nb.unlocks.map((o) => o.key)).size).toBe(nb.unlocks.length);
  for (let i = 1; i < nb.unlocks.length; i++) expect(nb.unlocks[i - 1]!.rank).toBeGreaterThanOrEqual(nb.unlocks[i]!.rank);
});

test('N4: no brand or shop in anything it says', async () => {
  const { closet, checks, styles } = await setup();
  const nb = nextBestBuy({ closet, checks, styles, marks: [] })!;
  const lines = [nb.entry.name, nb.entry.pick!.name, nb.entry.pick!.phrase, ...nb.unlocks.map((o) => o.reason)];
  for (const l of lines) expect([l, checkSentence(l, { allowedScores: new Set() })]).toEqual([l, null]);
  for (const e of STARTER) if (e.pick) expect(checkSentence(e.pick.name, { allowedScores: new Set() })).toBeNull();
});

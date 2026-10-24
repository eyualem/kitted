// The same clothes, the same read, minutes apart (09-ui-review §29, #380), the app's side. His Oct 24 pull
// (20261024-153001); profile (rule 7): born 2004 (22–25), picks streetwear, minimal, workwear.
//  - P1–P7: on a re-check of the same layers, the peek counts only when both photos' looks show it.
//  - A1–A6: the re-check card shows what the fix did and, on its own row, what the photo read differently.
//  - D1–D3: Closet's "Are these one piece?" card.
import { scoreParts, setCasualFitsV14, type ClosetItem, type Fix, type Garment, type Reading } from '@kitted/core';
import fixture from '../../packages/kitted-core/test/data/phone-oct24-recheck.json';
import { createMemoryStore } from '@/data/memoryStore';
import type { ClosetItemRow, ClosetObservationRow, FitCheckRow, LookAnswerU, StoredSecondLook } from '@/data/types';
import { caughtFixGain, readRow, recheckSummary } from '@/features/fitcheck/explain';
import { anchorRecheckLook, lookInput, ownLookOf } from '@/features/fitcheck/secondLook';
import { pairCard, pairDoubts, pairKey, parsePairSkips, withPairSkip } from '@/features/closet/pairDoubt';
import { runMergeNow } from '@/features/closet/merge';
import { createClosetService } from '@/features/closet/service';
import { en } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { realScheduler } from '@/services/scheduler';

const fs = jest.requireActual('fs') as { readFileSync(p: string, e: string): string };
const path = jest.requireActual('path') as { resolve(...p: string[]): string };

const D = fixture as unknown as {
  first: { reading: Reading; secondLook: StoredSecondLook; fixes: Fix[] };
  recheck: { merged: Reading; ownLook: StoredSecondLook };
  closet: ClosetItem[];
  opts: { occasion: string; styles: [string, number][]; boldness: string };
};
const U = (shows: LookAnswerU['under_shows']): LookAnswerU => ({ ...D.first.secondLook.u!, under_shows: shows });
const look = (u: LookAnswerU | null): StoredSecondLook => ({ version: 'look1', u, l: D.first.secondLook.l });
const same = { first: D.first.reading, merged: D.recheck.merged };

describe('P · the peek on a re-check of the same layers counts only when both photos show it (#380)', () => {
  it('P1: his Oct 24 re-check settles on "a little" (first "clearly") and still scores 8.0', () => {
    expect(D.first.secondLook.u!.under_shows).toBe('clearly');
    expect(D.recheck.ownLook.u!.under_shows).toBe('a_little');
    const settled = anchorRecheckLook(D.recheck.ownLook, D.first.secondLook, 'FC-5e3c4c98', same)!;
    expect(settled.u!.under_shows).toBe('a_little');
    expect(settled.copied).toBeUndefined(); // the re-check's own answer
    expect(scoreParts(D.recheck.merged, { ...D.opts, secondLook: lookInput(settled) } as never).overall).toBe(8);
  });

  it('P2: first "a little", re-check "clearly", same layers: no peek on the re-check (the first answer is kept)', () => {
    const settled = anchorRecheckLook(look(U('clearly')), look(U('a_little')), 'FC-1', same)!;
    expect(settled.u!.under_shows).toBe('a_little');
    expect(settled.copied).toEqual({ from: 'FC-1', why: 'samePieces', arms: ['U'] });
    // the drop it would have caused
    const opts = (u: LookAnswerU) => ({ ...D.opts, secondLook: lookInput(look(u)) }) as never;
    expect(scoreParts(D.recheck.merged, opts(U('clearly'))).overall).toBeLessThan(scoreParts(D.recheck.merged, opts(U('a_little'))).overall!);
  });

  it('P3: both "clearly": the peek counts', () => {
    expect(anchorRecheckLook(look(U('clearly')), look(U('clearly')), 'FC-1', same)!.u!.under_shows).toBe('clearly');
  });

  it('P4: the layers changed (the outer piece swapped, or off): the re-check photo\'s own answer', () => {
    const swapped: Reading = { ...D.recheck.merged, garments: D.recheck.merged.garments.map((g) => (g.category === 'outerwear' ? { ...g, subcategory: 'denim_jacket', color_family: 'denim_mid' } : g)) as Garment[] };
    expect(anchorRecheckLook(look(U('clearly')), look(U('a_little')), 'FC-1', { first: D.first.reading, merged: swapped })!.u!.under_shows).toBe('clearly');
    const off: Reading = { ...D.recheck.merged, garments: D.recheck.merged.garments.filter((g) => g.category !== 'outerwear') };
    expect(anchorRecheckLook(look(U('clearly')), look(U('a_little')), 'FC-1', { first: D.first.reading, merged: off })!.u!.under_shows).toBe('clearly');
    // without the readings (older callers): as before
    expect(anchorRecheckLook(look(U('clearly')), look(U('a_little')), 'FC-1')!.u!.under_shows).toBe('clearly');
  });

  it('P5: a first check without look U gives a re-check without; L is never settled this way', () => {
    const noU = { version: 'look1', u: null, l: D.first.secondLook.l } as StoredSecondLook;
    expect(anchorRecheckLook(D.recheck.ownLook, noU, 'FC-1', same)!.u).toBeNull();
    const own = { ...D.recheck.ownLook, l: { pant_end: 'no_break', covers_shoe: 'no' } } as StoredSecondLook;
    expect(anchorRecheckLook(own, D.first.secondLook, 'FC-1', same)!.l!.covers_shoe).toBe('no');
  });

  it('P6: with v14 off ("a little" is a peek in v13) the rule is the same: both must show it', () => {
    setCasualFitsV14(false);
    try {
      expect(anchorRecheckLook(look(U('a_little')), look(U('no')), 'FC-1', same)!.u!.under_shows).toBe('no');
      expect(anchorRecheckLook(look(U('a_little')), look(U('a_little')), 'FC-1', same)!.u!.under_shows).toBe('a_little');
    } finally {
      setCasualFitsV14(true);
    }
  });

  it('P7: a new check of the re-check photo never takes the first check\'s kept answer', () => {
    const settled = anchorRecheckLook(look(U('clearly')), look(U('a_little')), 'FC-1', same)!;
    expect(ownLookOf({ id: 'FC-2', details: { secondLook: settled } })!.u).toBeNull();
  });
});

describe('A · the re-check card: what the fix did, and what the photo read differently (#380)', () => {
  // His Oct 24 re-check as it would be stored now: the sneakers to 7.5 (as the card promised), 8.0 in all.
  const rc = { parentScore: 6.5, doneFixes: [{ copy: 'Swap to your cream chunky sneakers', earned: 0.625 }], fixTo: 7.5, readParts: ['proportions'], newProblems: [] };

  it('A1: the fix row says +1.0, the second row +0.5 in Proportions; they add up to the pill (+1.5)', () => {
    expect(caughtFixGain(rc, 8)).toBe('+1.0');
    expect(readRow(rc, 8)).toEqual({ gain: '+0.5', parts: 'Proportions' });
  });

  it('A1b: with the read row the summary drops "Nothing else changed." (it would contradict the row)', () => {
    const outcome = { after: 8, doneFixes: [] };
    expect(recheckSummary(outcome as never, 'up', []).tail).toBe('Nothing else changed.');
    expect(recheckSummary(outcome as never, 'up', [], true)).toEqual({ lead: 'Fixed and clean.', word: 'Sharp.', tail: '' });
  });

  it('A2: nothing read differently: the fix row carries the whole pill, no second row', () => {
    expect(caughtFixGain({ ...rc, fixTo: 8 }, 8)).toBe('+1.5');
    expect(readRow({ ...rc, fixTo: 8 }, 8)).toBeNull();
  });

  it('A3: a re-check stored before #380 (no fixTo): as before', () => {
    const old = { parentScore: 6.5, doneFixes: rc.doneFixes };
    expect(caughtFixGain(old, 8)).toBe('+1.5');
    expect(readRow(old, 8)).toBeNull();
  });

  it('A4: two fixes caught: no numbers on the fix rows; the read row only when the rest isn\'t zero', () => {
    const two = { ...rc, doneFixes: [...rc.doneFixes, { copy: 'Tuck in your hoodie', earned: 0.2 }] };
    expect(caughtFixGain(two, 8)).toBe('');
    expect(readRow(two, 8)).toEqual({ gain: '+0.5', parts: 'Proportions' });
    expect(readRow({ ...two, fixTo: 8 }, 8)).toBeNull();
  });

  it('A5: a drop with a "New: …" line: no read row (the new problem says why)', () => {
    expect(readRow({ ...rc, newProblems: ['condition:F7_care'] }, 7)).toBeNull();
  });

  it('A6: the card says the read row to VoiceOver too, and its words exist', () => {
    const src = fs.readFileSync(path.resolve('src/features/stylist/cards/RecheckCard.tsx'), 'utf8');
    expect(src).toMatch(/t\('recheck\.readRow\.a11y'/);
    expect(src.match(/recheck\.readRow\.a11y/g)!.length).toBeGreaterThanOrEqual(2); // the card's label and the row's own
    expect(en['recheck.readRow']).toBe('Read a little differently this time');
    expect(readRow({ ...rc, readParts: ['proportions', 'shoes'] }, 8)!.parts).toBe('Proportions and Shoes');
  });
});

// ---------------------------------------------------------------- the pair card
const garment = (category: string, subcategory: string, color_family: string): Garment => ({
  category, subcategory, color_family, pattern: 'solid', logo: 'none', volume: 3, leg_shape: category === 'bottom' ? 'wide' : 'na', hem: 'na', tucked: 'na',
  condition: 'clean', certainty: 'clear', length: 'na', pattern_scale: 'na', saturation: 'na', sleeve_end: 'na', strain: 'none', distressed_by_design: false, shows_below_outer: false,
}) as Garment;
const itemRow = (id: string, name: string, slot: string, g: Garment, worn: number, extra: Partial<ClosetItemRow> = {}): ClosetItemRow => ({
  id, name, slot, garment: g, hex: '#888888', confirmedFields: [], photoFile: null, demoPhotoId: null, isPhotographed: true, source: 'fitCheck',
  starterId: null, wornCount: worn, lastWornAt: null, addedAt: worn, isDeleted: false, profile: { aliases: [], distinctFrom: [], confirmed: {} }, ...extra,
}) as ClosetItemRow;
let n = 0;
const obsRow = (itemId: string, check: string, g: Garment, l: number | null, at: number): ClosetObservationRow => ({
  id: `O-${++n}`, itemId, fitCheckId: check, readingId: null, closetReadingId: null, garmentIndex: 0, origin: 'garment', garment: g, closet: null,
  sampledHex: null, sampledL: l, cropFile: null, cropQuality: null, decision: 'same', identityScore: null, candidates: [], askItemId: null, answeredAt: null,
  userConfirmed: null, createdAt: at, isDeleted: false,
});
const check = (id: string, at: number) => ({ id, createdAt: at }) as FitCheckRow;
const MIN = 60_000;
const T0 = Date.parse('2026-10-24T15:19:04-04:00');

// His Oct 24 closet in miniature: the hoodie, the sneakers, the light jeans twice (15:19 and 15:20, same outfit), and
// a dark tee and a charcoal tee from two different outfits 32 s apart (never the same piece).
function closet() {
  const hoodie = garment('top', 'hoodie', 'charcoal'), sneak = garment('footwear', 'chunky_sneaker', 'off_white_cream');
  const light = garment('bottom', 'jeans', 'denim_light'), mid = garment('bottom', 'jeans', 'denim_mid');
  const items = [
    itemRow('C-hoodie', 'Charcoal Nike hoodie', 'top', hoodie, 3), itemRow('C-sneak', 'Cream chunky sneakers', 'shoes', sneak, 7),
    itemRow('C-light', 'Light jeans', 'bottom', light, 7), itemRow('C-mid', 'Mid-wash jeans', 'bottom', mid, 8),
    itemRow('C-blk', 'Black long-sleeve tee', 'top', garment('top', 'tee', 'black'), 5), itemRow('C-chr', 'Charcoal tee', 'top', garment('top', 'tee', 'charcoal'), 1),
  ];
  const obs = [
    obsRow('C-hoodie', 'FC-a', hoodie, 40, T0), obsRow('C-light', 'FC-a', light, 38.4, T0), obsRow('C-sneak', 'FC-a', sneak, 80, T0),
    obsRow('C-hoodie', 'FC-b', hoodie, 41, T0 + MIN), obsRow('C-mid', 'FC-b', mid, 37.6, T0 + MIN), obsRow('C-sneak', 'FC-b', sneak, 79, T0 + MIN),
    obsRow('C-mid', 'FC-old', mid, 20, T0 - 6 * 86400_000),
    obsRow('C-blk', 'FC-c', garment('top', 'tee', 'black'), 20, T0 + 30 * MIN), obsRow('C-chr', 'FC-d', garment('top', 'tee', 'charcoal'), 22.8, T0 + 30.5 * MIN),
  ];
  const checks = ['FC-a', 'FC-b', 'FC-c', 'FC-d'].map((id, i) => check(id, [T0, T0 + MIN, T0 + 30 * MIN, T0 + 30.5 * MIN][i]!)).concat(check('FC-old', T0 - 6 * 86400_000));
  return { items, obs, checks };
}

describe('D · "Are these one piece?" in Closet\'s To confirm (#380)', () => {
  it('D1: offers his two jeans (the same outfit a minute apart), keeping the one with more wears; not the two tees', () => {
    const { items, obs, checks } = closet();
    const all = pairDoubts(items, obs, checks);
    expect(all.map((p) => [p.keep.id, p.fold.id, p.why])).toEqual([['C-mid', 'C-light', 'minutes']]);
  });

  it('D2: No keeps them apart for good (never offered again; Undo on its toast offers it again); Skip hides it until a newer photo', async () => {
    const { items, obs, checks } = closet();
    const store = createMemoryStore();
    for (const it of items) await store.closet.put(it);
    const svc = createClosetService({ store, clock: manualClock(T0), scheduler: realScheduler, ids: counterIds(), source: null, deadlineMs: 12_000 });
    await svc.keepApart('C-mid', 'C-light');
    const after = await store.closet.all();
    expect(after.find((c) => c.id === 'C-light')!.profile!.distinctFrom).toContain('C-mid');
    expect(after.find((c) => c.id === 'C-mid')!.profile!.distinctFrom).toContain('C-light');
    expect(pairDoubts(after, obs, checks)).toEqual([]);
    // Undo on the toast: offered again
    await svc.unkeepApart('C-mid', 'C-light');
    expect(pairDoubts(await store.closet.all(), obs, checks)).toHaveLength(1);
    // Skip
    const p = pairCard(items, obs, checks, {})!;
    const skips = parsePairSkips(withPairSkip({}, p));
    expect(skips[pairKey('C-light', 'C-mid')]).toBe(p.newest);
    expect(pairCard(items, obs, checks, skips)).toBeNull();
    const newer = [...obs, obsRow('C-light', 'FC-e', garment('bottom', 'jeans', 'denim_light'), 39, T0 + 2 * 86400_000)];
    expect(pairCard(items, newer, [...checks, check('FC-e', T0 + 2 * 86400_000)], skips)?.key).toBe(pairKey('C-light', 'C-mid'));
  });

  it('D2b: Yes folds the one with fewer wears with the piece page\'s merge, no second confirm, and its toast\'s Undo unmerges', async () => {
    const calls: string[] = [];
    const undo = { fromId: 'C-light', intoId: 'C-mid', items: [], obs: [], checks: [] };
    let toastUndo: (() => Promise<void> | void) | null = null;
    const done = await runMergeNow({ id: 'C-light', name: 'Light jeans' }, { id: 'C-mid', name: 'Mid-wash jeans' }, {
      merge: async (a, b) => (calls.push(`merge ${a}>${b}`), undo),
      unmerge: async () => void calls.push('unmerge'),
      toast: (text, u) => { calls.push(text); toastUndo = u; },
    });
    expect(done).toBe(undo);
    await toastUndo!();
    expect(calls).toEqual(['merge C-light>C-mid', 'Saved as your mid-wash jeans.', 'unmerge']);
    const src = fs.readFileSync(path.resolve('src/features/closet/PairQuestion.tsx'), 'utf8');
    expect(src).toMatch(/mergePairNow\(fold, keep\)/);
  });

  it('D3: never a piece waiting on an answer, never across slots, and the screen shows one pair card after the questions', () => {
    const { items, obs, checks } = closet();
    const waiting = items.map((c) => (c.id === 'C-light' ? { ...c, maybeSameAs: 'C-hoodie' } : c));
    expect(pairDoubts(waiting, obs, checks)).toEqual([]);
    const layer = items.map((c) => (c.id === 'C-light' ? { ...c, slot: 'outer' } : c));
    expect(pairDoubts(layer, obs, checks)).toEqual([]);
    const src = fs.readFileSync(path.resolve('src/app/(tabs)/closet/index.tsx'), 'utf8');
    expect(src).toMatch(/<PairQuestion key=\{pair\.key\} pair=\{pair\} \/>/);
    expect(src.indexOf('<PairQuestion')).toBeGreaterThan(src.indexOf('<DuplicateQuestion'));
  });
});

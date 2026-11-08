// Swap one, the S28 sheet (09-ui-review §28 S3–S7, #377): checks written before the code. He sees his outfit's pieces,
// picks one, sees what else in his closet works there and picks that; Undo puts the card back exactly.
import { US_EASTERN, type DayWeather } from '@kitted/core';
import type { FitCheckRow } from '@/data/types';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import { createMorningService } from '@/features/morning/service';
import { t } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import type { WeatherSource } from '@/services/weather';

declare const __dirname: string;
const { readFileSync, existsSync, readdirSync } = jest.requireActual<{
  readFileSync(p: string, enc: 'utf8'): string; existsSync(p: string): boolean; readdirSync(p: string): string[];
}>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');
const src = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');

const at = (iso: string) => Date.parse(iso);
const COLD_RAIN: DayWeather = { window: 'day', nowF: 46, highF: 63, lowF: 44, feelsLowF: 42, feelsHighF: 61, precipChance: 0.7, precipFromHour: 17, condition: 'cloudy' };
const ID = '2026-10-22|day';

async function setup() {
  const store = createMemoryStore();
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: at('2026-10-20T07:00:00-04:00') });
  const clock = manualClock(at('2026-10-22T07:40:00-04:00'));
  const weather: WeatherSource = {
    kind: 'sample', permission: async () => 'granted', requestPermission: async () => 'granted', forecast: async (window) => ({ ...COLD_RAIN, window }),
  };
  const svc = createMorningService({ store, clock, weather, ids: counterIds() });
  await svc.ensureCard();
  const row = async () => (await store.dailyIdeas.get(ID))!;
  const outfit = async () => (await store.outfits.get((await row()).outfitId!))!;
  /** A piece of the outfit that has something to swap in, and its options. */
  const swappable = async () => {
    for (const out of (await outfit()).itemIds) {
      const opts = await svc.swapOptions(ID, out);
      if (opts.length) return { out, opts };
    }
    throw new Error('no swappable piece');
  };
  return { store, svc, row, outfit, swappable };
}

describe('S3 · the options leave out what he swapped away', () => {
  it('a piece swapped away is never offered again on this card, and is offered again after a new occasion', async () => {
    const { svc, outfit, swappable } = await setup();
    const { out, opts } = await swappable();
    expect(await svc.swapTo(ID, out, opts[0]!.itemId)).not.toBeNull();
    const now = (await outfit()).itemIds;
    expect(now).not.toContain(out);
    for (const piece of now) expect((await svc.swapOptions(ID, piece)).map((o) => o.itemId)).not.toContain(out);
    // The old Swap's rule holds too: a swap by code never brings it back.
    await svc.swap(ID, [opts[0]!.itemId]);
    expect((await outfit()).itemIds).not.toContain(out);
    // A new occasion is a new plan: the list starts afresh (M3).
    await svc.change(ID, { occasion: 'going_out' });
    const after = (await outfit()).itemIds;
    const slotPieces = await Promise.all(after.map((p) => svc.swapOptions(ID, p)));
    expect(after.includes(out) || slotPieces.flat().some((o) => o.itemId === out)).toBe(true);
  });
});

describe('S4 · a pick changes the card in place', () => {
  it('the same outfit row with one piece replaced, its reasons, touched, and nothing else', async () => {
    const { store, svc, row, outfit, swappable } = await setup();
    const before = await outfit();
    const r0 = await row();
    const { out, opts } = await swappable();
    const pickIt = opts[opts.length - 1]!;
    await svc.swapTo(ID, out, pickIt.itemId);
    const after = await outfit();
    expect(after.id).toBe(before.id);
    expect((await row()).outfitId).toBe(r0.outfitId);
    expect((await row()).messageId).toBe(r0.messageId);
    expect(after.itemIds).toEqual(pickIt.outfit.itemIds);
    expect([...after.itemIds].sort()).toEqual(before.itemIds.map((id) => (id === out ? pickIt.itemId : id)).sort());
    expect((after.details as { reasons?: unknown }).reasons).toEqual(pickIt.outfit.reasons);
    expect(await store.getKv(`idea.touched.${ID}`)).toBe('1');
    expect(JSON.parse((await store.getKv(`idea.swapped.${ID}`))!)).toContain(out);
  });

  it('a piece that is not an option changes nothing', async () => {
    const { store, svc, outfit, swappable } = await setup();
    const before = await outfit();
    const { out } = await swappable();
    expect(await svc.swapTo(ID, out, before.itemIds.find((id) => id !== out)!)).toBeNull();
    expect(await svc.swapTo(ID, out, 'nope')).toBeNull();
    expect(await outfit()).toEqual(before);
    expect(await store.getKv(`idea.swapped.${ID}`)).toBeNull();
  });

  it('a worn card has nothing to swap', async () => {
    const { svc, outfit } = await setup();
    await svc.wear(ID);
    for (const p of (await outfit()).itemIds) expect(await svc.swapOptions(ID, p)).toEqual([]);
  });
});

describe('S5 · Undo puts the card back exactly', () => {
  it('outfit row, touched and the swapped-away list', async () => {
    const { store, svc, outfit, swappable } = await setup();
    const before = await outfit();
    const { out, opts } = await swappable();
    const undo = await svc.swapTo(ID, out, opts[0]!.itemId);
    await undo!();
    expect(await outfit()).toEqual(before);
    expect(await store.getKv(`idea.touched.${ID}`)).toBeNull();
    expect(await store.getKv(`idea.swapped.${ID}`)).toBeNull();
    // A second swap, then its Undo, keeps the first swap.
    const first = await svc.swapTo(ID, out, opts[0]!.itemId);
    expect(first).not.toBeNull();
    const mid = await outfit();
    const swappedMid = await store.getKv(`idea.swapped.${ID}`);
    const next = (await Promise.all(mid.itemIds.map(async (p) => ({ p, o: await svc.swapOptions(ID, p) })))).find((x) => x.o.length);
    if (next) {
      const undo2 = await svc.swapTo(ID, next.p, next.o[0]!.itemId);
      await undo2!();
      expect(await outfit()).toEqual(mid);
      expect(await store.getKv(`idea.swapped.${ID}`)).toBe(swappedMid);
      expect(await store.getKv(`idea.touched.${ID}`)).toBe('1');
    }
  });
});

describe('S9 · the options follow the card\'s rotation (#380)', () => {
  /** A fit check of `itemIds` at `iso`, saved like a real one. */
  async function wore(store: Awaited<ReturnType<typeof setup>>['store'], id: string, iso: string, itemIds: string[]) {
    const base = (await store.fitChecks.all()).find((c) => c.status === 'scored')!;
    await store.fitChecks.put({ ...base, id, parentId: null, dayKey: iso.slice(0, 10), createdAt: at(iso), itemIds } as FitCheckRow);
  }
  /** The card's piece with the most to swap in, and its options. */
  async function pieceSwap(e: Awaited<ReturnType<typeof setup>>) {
    let best: { out: string; opts: Awaited<ReturnType<typeof e.svc.swapOptions>> } | null = null;
    for (const piece of (await e.outfit()).itemIds) {
      const opts = await e.svc.swapOptions(ID, piece);
      if (opts.length > (best?.opts.length ?? 1)) best = { out: piece, opts };
    }
    if (!best) throw new Error('no piece with two options');
    return best;
  }

  it('a piece he wore yesterday goes after the ones he has not worn lately; nothing is hidden', async () => {
    const e = await setup();
    const { out, opts } = await pieceSwap(e);
    const first = opts[0]!.itemId;
    await wore(e.store, 'YDAY', '2026-10-21T08:30:00-04:00', [first, ...(await e.outfit()).itemIds.filter((id) => id !== out)]);
    const after = (await e.svc.swapOptions(ID, out)).map((o) => o.itemId);
    expect(after[0]).not.toBe(first);
    expect(after.indexOf(first)).toBeGreaterThan(0);
    expect([...after].sort()).toEqual(opts.map((o) => o.itemId).sort());
  });

  it('a try-on (another check within the hour) is not worn: the order stays', async () => {
    const e = await setup();
    const { out, opts } = await pieceSwap(e);
    const first = opts[0]!.itemId;
    const rest = (await e.outfit()).itemIds.filter((id) => id !== out);
    await wore(e.store, 'TRY', '2026-10-21T08:30:00-04:00', [first, ...rest]);
    // What he wore 20 minutes later is the card's own outfit: none of it is an option.
    await wore(e.store, 'WORE', '2026-10-21T08:50:00-04:00', (await e.outfit()).itemIds);
    expect((await e.svc.swapOptions(ID, out)).map((o) => o.itemId)).toEqual(opts.map((o) => o.itemId));
  });

  it('Undo after a reordered swap still puts the card back exactly', async () => {
    const e = await setup();
    const { out, opts } = await pieceSwap(e);
    await wore(e.store, 'YDAY', '2026-10-21T08:30:00-04:00', [opts[0]!.itemId]);
    const before = await e.outfit();
    const now = await e.svc.swapOptions(ID, out);
    const undo = await e.svc.swapTo(ID, out, now[0]!.itemId);
    expect((await e.outfit()).itemIds).toEqual(now[0]!.outfit.itemIds);
    await undo!();
    expect(await e.outfit()).toEqual(before);
    expect(await e.store.getKv(`idea.touched.${ID}`)).toBeNull();
    expect(await e.store.getKv(`idea.swapped.${ID}`)).toBeNull();
  });
});

describe('S6 · Swap opens the sheet', () => {
  it('the card routes to the sheet; the action sheet is gone', () => {
    const card = src('features/morning/MorningCard.tsx');
    expect(card).toMatch(/\/sheets\/swap\//);
    expect(card).not.toMatch(/pickSwap|ActionSheetIOS/);
    for (const f of readdirSync(join(__dirname, '..', 'features/morning'))) {
      expect(src(`features/morning/${f}`).includes('ActionSheetIOS')).toBe(false);
    }
    expect(existsSync(join(__dirname, '..', 'features/morning/swapPicker.ts'))).toBe(false);
    expect(existsSync(join(__dirname, '..', 'features/morning/swapPicker.web.ts'))).toBe(false);
    // Medium and large; full height only at the accessibility sizes.
    expect(src('app/_layout.tsx')).toMatch(/name="sheets\/swap\/\[ideaId\]" options=\{sheet\(isAccessibilitySize \? \[1\] : \[0\.5, 1\]\)\}/);
    expect(existsSync(join(__dirname, '..', 'app/sheets/swap/[ideaId].tsx'))).toBe(true);
  });
});

describe('S7 · the sheet', () => {
  it('its words', () => {
    expect(t('swap.title')).toBe('Swap one piece');
    expect(t('swap.sub')).toBe('Tap the piece to change.');
    expect(t('swap.none')).toBe('Nothing else in your closet works here yet.');
    expect(t('swap.instead', { item: 'grey tee' })).toBe('Instead of your grey tee');
    expect(t('swap.done', { item: 'white tee' })).toBe('Swapped in your white tee.');
    expect(t('swap.a11y.option', { name: 'White tee' })).toBe('White tee. Swaps it in.');
  });

  it('draws the pieces, labels every button, shows the line when nothing works, and the Gone sheet for a missing card', () => {
    const sheet = src('features/morning/SwapSheet.tsx');
    expect(sheet).toMatch(/SheetScaffold title=\{t\('swap\.title'\)\} subtitle=\{t\('swap\.sub'\)\}/);
    expect(sheet).toMatch(/PieceArt/);
    expect(sheet).toMatch(/accessibilityState=\{\{ selected/);
    expect(sheet).toMatch(/t\('swap\.a11y\.option'/);
    expect(sheet).toMatch(/t\('swap\.none'\)/);
    expect(sheet).toMatch(/GoneSheet/);
    expect(sheet).toMatch(/morning\.swapTo\(/);
    expect(sheet).toMatch(/showToast\(t\('swap\.done'/);
  });
});

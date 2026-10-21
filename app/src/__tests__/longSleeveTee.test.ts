// Long-sleeve tees in the closet (09-ui-review §24, #359; checks S1–S4, K1–K5, M1 set before building). A long-sleeve
// tee stays a `tee` in the reading, so no score moves; its sleeves are part of the piece's look (ClosetArt.sleeves),
// which names it ("Grey long-sleeve tee"), draws it with long sleeves, and "What it is" can set.
import { G, pickOutfit, US_EASTERN, weatherNeeds, type ClosetItem, type DayWeather, type Observation } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import type { KittedStore } from '@/data/store';
import { loadScenario } from '@/data/seedLoader';
import type { ClosetArt, ClosetItemRow } from '@/data/types';
import { artSpec } from '@/features/closet/artSpec';
import { renderFlat } from '@/features/closet/flats';
import { baseName } from '@/features/closet/itemName';
import { currentValue, editOptions, editRows, editToast, KIND_MAIN, KIND_MORE, withEdit } from '@/features/closet/pieceEdit';
import { artOf, isOwned, profileOfItem } from '@/features/closet/profile';
import { createClosetService } from '@/features/closet/service';
import { createFitCheckService, DEFAULT_TIMERS } from '@/features/fitcheck/service';
import { t } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { createMockClosetSource } from '@/services/closetSource/mock';
import { counterIds } from '@/services/ids';
import { demoImagePrep } from '@/services/imagePrep/demo';
import { createQuota } from '@/services/quota';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { realScheduler } from '@/services/scheduler';

const at = (iso: string) => Date.parse(iso);
const tee = (extra: Partial<Observation> = {}): Observation => ({ ...G('top', 'tee', 'grey'), ...extra });
const item = (garment = G('top', 'tee', 'grey'), confirmed: ClosetItemRow['profile'] = null) =>
  ({ garment, confirmedFields: [], profile: confirmed }) as Pick<ClosetItemRow, 'garment' | 'confirmedFields' | 'profile'>;
const art = (sleeves?: ClosetArt['sleeves']): ClosetArt => ({
  family: 'grey', shade: null, details: [], brand: null, pattern: 'solid', shoeProfile: null, denimWear: null, ...(sleeves ? { sleeves } : {}),
});
const draw = (sub: string, a: ClosetArt | null) =>
  renderFlat(artSpec({ garment: G('top', sub, 'grey'), hex: '#8E9196', art: a, name: 'x' }).flat, { scheme: 'light', id: 'x' });

async function setup(o: { only?: string[] } = {}) {
  const store = createMemoryStore();
  const clock = manualClock(at('2026-10-22T07:42:00-04:00'));
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: at('2026-10-22T07:41:00-04:00') });
  const only = o.only ?? [];
  for (const c of await store.closet.all()) if (!only.includes(c.id)) await store.closet.patch(c.id, { isDeleted: true });
  const ids = counterIds();
  const closet = createClosetService({ store, clock, scheduler: realScheduler, ids, source: createMockClosetSource() });
  const svc = createFitCheckService({
    store, source: createMockReadingSource({ latency: () => 0, scheduler: realScheduler }), prep: demoImagePrep,
    quota: createQuota({ store, clock, isPro: () => true }), clock, scheduler: realScheduler, ids, closet,
    timers: () => ({ ...DEFAULT_TIMERS, enabled: false, cacheHitMs: 0 }), tap: () => false,
  });
  return { store, clock, closet, svc };
}
const piece = async (store: KittedStore, id: string) => (await store.closet.get(id))!;
const scores = async (store: KittedStore) => (await store.fitChecks.all()).map((c) => [c.id, c.score, c.rawScore, c.subscores]);

// ---------------------------------------------------------------- S seeing it
describe('S1 the sleeve read', () => {
  it('long from the closet call, or from a sleeve end on a tee with no closet call; short from a short read', () => {
    expect(artOf(item(), [tee({ sleeve_length: 'long' })]).sleeves).toBe('long');
    for (const end of ['at_wrist', 'above_wrist', 'covers_hand']) expect(artOf(item(), [tee({ sleeve_end: end })]).sleeves).toBe('long');
    expect(artOf(item(), [tee({ sleeve_length: 'short' })]).sleeves).toBe('short');
    expect('sleeves' in artOf(item(), [tee()])).toBe(false);
    // the closet call beats the sleeve end
    expect(artOf(item(), [tee({ sleeve_length: 'short', sleeve_end: 'at_wrist' })]).sleeves).toBe('short');
  });

  it('one sighting the other way never flips it; two do; his pick wins outright', () => {
    const long = tee({ sleeve_length: 'long' });
    const short = tee({ sleeve_length: 'short' });
    expect(artOf(item(), [long, short]).sleeves).toBe('long');
    expect(artOf(item(), [long, short, short]).sleeves).toBe('short');
    const said = item(G('top', 'tee', 'grey'), { aliases: [], distinctFrom: [], confirmed: { sleeve_length: 'long' } });
    expect(artOf(said, [short, short, short]).sleeves).toBe('long');
  });

  it('the demo photo with a white tee under an open overshirt (its cuff shows at the wrist) makes a long-sleeve tee', async () => {
    const env = await setup();
    await env.svc.start({ mode: 'check', photoId: 'p01a', occasion: 'everyday' });
    await env.closet.settle();
    const owned = (await env.store.closet.all()).filter(isOwned);
    const top = owned.find((c) => c.slot === 'top')!;
    expect(top.garment.subcategory).toBe('tee');
    expect(top.art?.sleeves).toBe('long');
    expect(top.name).toBe('White long-sleeve tee');
  });
});

describe('S2 the name', () => {
  it('names the sleeves on tees, graphic tees and polos; a short-sleeve tee keeps its name', () => {
    expect(baseName(G('top', 'tee', 'grey'), art('long'))).toBe('Grey long-sleeve tee');
    expect(baseName(G('top', 'graphic_tee', 'black'), { ...art('long'), family: 'black' })).toBe('Black long-sleeve graphic tee');
    expect(baseName(G('top', 'polo', 'navy'), { ...art('long'), family: 'navy' })).toBe('Navy long-sleeve polo');
    expect(baseName(G('top', 'tee', 'grey'), art('short'))).toBe('Grey tee');
    expect(baseName(G('top', 'tee', 'grey'), art())).toBe('Grey tee');
    // a sweater has long sleeves by nature: never "long-sleeve sweater"
    expect(baseName(G('top', 'sweater', 'grey'), art('long'))).toBe('Grey sweater');
  });

  it('a name he typed never changes', async () => {
    const env = await setup({ only: ['T2'] });
    await env.closet.renameItem('T2', 'My gym tee');
    await env.closet.editPiece('T2', 'kind', 'long_sleeve_tee');
    expect((await piece(env.store, 'T2')).name).toBe('My gym tee');
  });
});

describe('S3 the drawing', () => {
  it('a long-sleeve tee draws apart from a tee and a sweatshirt; a short-sleeve tee draws exactly as before', () => {
    const long = draw('tee', art('long'));
    expect(long).not.toBe(draw('tee', art('short')));
    expect(long).not.toBe(draw('sweatshirt', art('long')));
    expect(draw('tee', art('short'))).toBe(draw('tee', art()));
    expect(draw('tee', art('short'))).toBe(draw('tee', null));
    expect(artSpec({ garment: G('top', 'tee', 'grey'), hex: '#8E9196', art: art('long'), name: 'x' }).flat).toMatchObject({ type: 'tee', sleeves: 'long' });
    // a long-sleeve polo too; a sweater's drawing doesn't change with the read
    expect(draw('polo', art('long'))).not.toBe(draw('polo', art('short')));
    expect(draw('sweater', art('long'))).toBe(draw('sweater', art()));
  });
});

describe('S4 pieces already in his closet', () => {
  it('get the long sleeves and the name at the next launch; no score, sighting or reading moves', async () => {
    const env = await setup();
    await env.svc.start({ mode: 'check', photoId: 'p01a', occasion: 'everyday' });
    await env.closet.settle();
    const top = (await env.store.closet.all()).filter(isOwned).find((c) => c.slot === 'top')!;
    // as it was stored before the closet drew sleeves
    const { sleeves: _s, ...old } = top.art!;
    void _s;
    await env.store.closet.patch(top.id, { art: old, name: 'White tee' });
    const before = { scores: await scores(env.store), obs: await env.store.closetObs.all(), readings: await env.store.readings.all() };
    await env.closet.refreshColors();
    const now = await piece(env.store, top.id);
    expect(now.art?.sleeves).toBe('long');
    expect(now.name).toBe('White long-sleeve tee');
    expect({ scores: await scores(env.store), obs: await env.store.closetObs.all(), readings: await env.store.readings.all() }).toEqual(before);
  });
});

// ---------------------------------------------------------------- K "What it is"
describe('K "What it is"', () => {
  it('K1 "Long-sleeve tee" sits right after "Tee" in the first group (9 since #361: 3 rows of 3, the button-ups up front)', () => {
    expect(KIND_MAIN.top.slice(0, 2)).toEqual(['tee', 'long_sleeve_tee']);
    expect(KIND_MAIN.top.length).toBe(9);
    expect(KIND_MORE.top[0]).toBe('flannel_shirt');
  });

  it('K2–K3 picking it writes a tee with his long sleeves; the row, the option and the toast say so', async () => {
    const env = await setup({ only: ['T2'] });
    const before = await scores(env.store);
    const r = (await env.closet.editPiece('T2', 'kind', 'long_sleeve_tee'))!;
    expect(r).not.toBeNull();
    const p = await piece(env.store, 'T2');
    expect(p.garment.subcategory).toBe('tee');
    expect(profileOfItem(p).confirmed).toMatchObject({ subcategory: 'tee', sleeve_length: 'long' });
    expect(JSON.stringify(p)).not.toContain('long_sleeve_tee');
    expect(p.art?.sleeves).toBe('long');
    expect(p.name).toMatch(/long-sleeve tee$/);
    expect(editRows(p).find((x) => x.field === 'kind')!.value).toBe('Long-sleeve tee');
    expect(currentValue(p, 'kind')).toBe('long_sleeve_tee');
    expect(editOptions(p, 'kind').main.find((o) => o.current)?.value).toBe('long_sleeve_tee');
    expect(editToast('kind', p, 'long_sleeve_tee', null)).toBe(t('closet.edit.toast', { value: 'long-sleeve tee' }));
    expect(editToast('kind', p, 'long_sleeve_tee', null)).toBe('Changed to long-sleeve tee. Your scores stay the same.');
    expect(await scores(env.store)).toEqual(before);
  });

  it('K3 the sleeve reads his photos gave are taught to the matcher', async () => {
    const env = await setup();
    await env.svc.start({ mode: 'check', photoId: 'p01b', occasion: 'everyday' }); // a white tee, short sleeves
    await env.closet.settle();
    const top = (await env.store.closet.all()).filter(isOwned).find((c) => c.slot === 'top')!;
    expect(top.art?.sleeves).toBe('short');
    await env.closet.editPiece(top.id, 'kind', 'long_sleeve_tee');
    expect(profileOfItem(await piece(env.store, top.id)).fieldAliases?.sleeve_length).toEqual(['long', 'short']);
  });

  it('K4 "Tee" makes the sleeves short again, another kind leaves them; Undo puts every row back', async () => {
    const env = await setup({ only: ['T2'] });
    await env.closet.editPiece('T2', 'kind', 'long_sleeve_tee');
    const long = await env.store.closet.all();
    const r = (await env.closet.editPiece('T2', 'kind', 'tee'))!;
    expect((await piece(env.store, 'T2')).art?.sleeves).toBe('short');
    expect(profileOfItem(await piece(env.store, 'T2')).confirmed.sleeve_length).toBe('short');
    await env.closet.restoreEdit(r.undo);
    expect(await env.store.closet.all()).toEqual(long);
    await env.closet.editPiece('T2', 'kind', 'sweatshirt');
    expect(profileOfItem(await piece(env.store, 'T2')).confirmed.sleeve_length).toBe('long');
  });

  it('K5 the option pictures: "Long-sleeve tee" long sleeves, "Tee" short', async () => {
    const env = await setup({ only: ['T2'] });
    const it0 = await piece(env.store, 'T2');
    expect(artSpec(withEdit(it0, 'kind', 'long_sleeve_tee')).flat).toMatchObject({ type: 'tee', sleeves: 'long' });
    expect(artSpec(withEdit(it0, 'kind', 'tee')).flat).not.toHaveProperty('sleeves');
    await env.closet.editPiece('T2', 'kind', 'long_sleeve_tee');
    const it1 = await piece(env.store, 'T2');
    expect(artSpec(withEdit(it1, 'kind', 'tee')).flat).not.toHaveProperty('sleeves');
  });
});

// ---------------------------------------------------------------- M the morning card
describe('M1 a hot day', () => {
  const hot: DayWeather = { window: 'day', nowF: 82, highF: 92, lowF: 82, feelsLowF: 82, feelsHighF: 92, precipChance: 0, precipFromHour: null, condition: 'clear' };
  const closetWith = (longArt: unknown): ClosetItem[] => [
    { id: 'T-short', name: 'Grey tee', slot: 'top', garment: G('top', 'tee', 'grey') },
    { id: 'T-long', name: 'Grey long-sleeve tee', slot: 'top', garment: G('top', 'tee', 'grey'), art: longArt },
    { id: 'B', name: 'Dark jeans', slot: 'bottom', garment: G('bottom', 'jeans', 'denim_dark', { leg_shape: 'straight' }) },
    { id: 'S', name: 'White sneakers', slot: 'shoes', garment: G('footwear', 'white_leather_sneaker', 'white') },
  ];
  const topOf = (closet: ClosetItem[], s: string) =>
    pickOutfit({ closet, occasion: 'everyday', needs: weatherNeeds(hot), seed: s }).outfit?.itemIds.find((id) => id.startsWith('T-'));
  const seeds = Array.from({ length: 12 }, (_, i) => `2026-10-${10 + i}|day`);

  it('a long-sleeve tee is never the hot-day pick over a short-sleeve one', () => {
    for (const s of seeds) expect(topOf(closetWith({ sleeves: 'long' }), s)).toBe('T-short');
  });
  it('without the sleeve read both are tees, judged by their kind as before', () => {
    expect(new Set(seeds.map((s) => topOf(closetWith(null), s)))).toEqual(new Set(['T-short', 'T-long']));
  });
});

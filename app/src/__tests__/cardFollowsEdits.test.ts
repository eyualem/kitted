// The outfit card follows a piece he corrected (09-ui-review §26, #365): checks written before the code. A piece on
// today's card whose reading changed, or that was removed or merged away, re-plans a card he hasn't touched the next
// time Stylist shows; a swapped or set card is kept while it still passes the outfit rules; a worn, checked,
// staying-in or earlier card never changes. A changed outfit says "Updated for your {piece}." Nothing calls Google.
import { dayKey, localParts, US_EASTERN, type DayWeather } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import type { KittedStore } from '@/data/store';
import { loadScenario } from '@/data/seedLoader';
import type { FitCheckRow, OutfitRow } from '@/data/types';
import { buildStylistContext } from '@/features/ask/context';
import { buildEvidence } from '@/features/ask/evidence';
import { routeQuestion } from '@/features/ask/router';
import { loadStylistSnapshot } from '@/features/ask/snapshot';
import type { EditField, EditValue } from '@/features/closet/pieceEdit';
import { editOptions } from '@/features/closet/pieceEdit';
import { createClosetService } from '@/features/closet/service';
import { updatedLine } from '@/features/morning/copy';
import { createMorningService } from '@/features/morning/service';
import { t } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { createMockClosetSource } from '@/services/closetSource/mock';
import { counterIds } from '@/services/ids';
import { realScheduler } from '@/services/scheduler';
import type { WeatherSource } from '@/services/weather';

const at = (iso: string) => Date.parse(iso);
const COLD_RAIN: DayWeather = { window: 'day', nowF: 46, highF: 63, lowF: 44, feelsLowF: 42, feelsHighF: 61, precipChance: 0.7, precipFromHour: 17, condition: 'cloudy' };
const ID = '2026-10-22|day';
const PLANNED = '2026-10-22T07:40:00-04:00';
const LATER = '2026-10-22T08:05:00-04:00'; // within the forecast's 45 minutes: only pieces can re-plan

type Env = Awaited<ReturnType<typeof setup>>;

async function setup() {
  const store = createMemoryStore();
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: at('2026-10-20T07:00:00-04:00') });
  const clock = manualClock(at(PLANNED));
  const weather: WeatherSource = {
    kind: 'sample', permission: async () => 'granted', requestPermission: async () => 'granted', forecast: async (window) => ({ ...COLD_RAIN, window }),
  };
  const morning = createMorningService({ store, clock, weather, ids: counterIds() });
  const closet = createClosetService({ store, clock, scheduler: realScheduler, ids: counterIds(), source: createMockClosetSource(), measure: async () => new Map() });
  await morning.ensureCard();
  clock.set(at(LATER));
  return { store, clock, morning, closet };
}

async function card(store: KittedStore, id = ID) {
  const row = (await store.dailyIdeas.get(id))!;
  const outfit = row.outfitId ? ((await store.outfits.get(row.outfitId)) as OutfitRow) : null;
  return { row, outfit, items: outfit?.itemIds ?? [] };
}
const same = (a: readonly string[], b: readonly string[]) => [...a].sort().join('+') === [...b].sort().join('+');
const slotOf = async (store: KittedStore, id: string) => (await store.closet.get(id))!.slot;

/** The card a fresh install with the same edit would get: the same day, weather, history and seed. */
async function freshPlan(edit: (e: Env) => Promise<unknown>): Promise<string[]> {
  const e = await setup();
  await e.store.dailyIdeas.delete(ID);
  await edit(e);
  e.clock.set(at(PLANNED));
  await e.morning.ensureCard();
  return (await card(e.store)).items;
}

/** Every color he could pick for a piece on the card, as (field, value) edits. */
async function colorEdits(store: KittedStore, itemId: string): Promise<[EditField, EditValue][]> {
  const it = (await store.closet.get(itemId))!;
  const o = editOptions(it, 'color');
  return [...o.main, ...o.more].map((x) => ['color', x.value] as [EditField, EditValue]).filter(([, v]) => v !== it.garment.color_family);
}

/** An edit to a card piece that changes the fresh plan (R1), or one that keeps it (R2). */
async function findEdit(want: 'changes' | 'keeps'): Promise<{ itemId: string; field: EditField; value: EditValue; fresh: string[] }> {
  const e = await setup();
  const { items } = await card(e.store);
  for (const itemId of items) {
    for (const [field, value] of [...(await colorEdits(e.store, itemId)), ['kind', 'slides_sandals'] as [EditField, EditValue]]) {
      const fresh = await freshPlan((x) => x.closet.editPiece(itemId, field, value));
      if (fresh.length && (want === 'changes') !== same(fresh, items)) return { itemId, field, value, fresh };
    }
  }
  throw new Error(`no edit that ${want} the plan`);
}

describe('R1–R3 · a card he hasn\'t touched', () => {
  it('R1 an edit that changes the plan re-plans it, as a fresh card would be, with "Updated for your …"', async () => {
    const { itemId, field, value, fresh } = await findEdit('changes');
    const e = await setup();
    const before = await card(e.store);
    expect(await e.closet.editPiece(itemId, field, value)).not.toBeNull();
    expect(await e.morning.freshen()).toBe(true);
    const after = await card(e.store);
    expect(same(after.items, fresh)).toBe(true);
    expect(same(after.items, before.items)).toBe(false);
    const msg = (await e.store.chat.get(after.row.messageId!))!;
    expect(msg.outfitId).toBe(after.row.outfitId);
    const piece = (await e.store.closet.get(itemId))!;
    expect(updatedLine(after.outfit!, await e.store.closet.all())).toBe(t('idea.updatedFor', { item: piece.name.charAt(0).toLowerCase() + piece.name.slice(1) }));
  });

  it('R2 an edit that keeps the plan (like his olive fleece) keeps the outfit, with no line', async () => {
    const { itemId, field, value } = await findEdit('keeps');
    const e = await setup();
    const before = await card(e.store);
    await e.closet.editPiece(itemId, field, value);
    await e.morning.freshen();
    const after = await card(e.store);
    expect(after.row.outfitId).toBe(before.row.outfitId);
    expect(after.items).toEqual(before.items);
    expect(updatedLine(after.outfit!, await e.store.closet.all())).toBeNull();
    // Settled: the next look does nothing.
    expect(await e.morning.freshen()).toBe(false);
  });

  it('R3 an edit to a piece that isn\'t on the card changes nothing, even when a fresh plan would', async () => {
    const e = await setup();
    const before = await card(e.store);
    const others = (await e.store.closet.all()).filter((c) => !c.isDeleted && !before.items.includes(c.id));
    let edited = 0;
    for (const o of others.slice(0, 6)) {
      const [first] = await colorEdits(e.store, o.id);
      if (first && (await e.closet.editPiece(o.id, first[0], first[1]))) edited++;
    }
    expect(edited).toBeGreaterThan(0);
    expect(await e.morning.freshen()).toBe(false);
    const after = await card(e.store);
    expect(after.items).toEqual(before.items);
    expect(after.outfit).toEqual(before.outfit);
  });
});

describe('R4–R6 · cards he acted on', () => {
  it('R4 a swapped card stays while it still works; once it doesn\'t, it re-plans without what he swapped away', async () => {
    const e = await setup();
    const first = (await card(e.store)).items;
    const shoes = [];
    for (const id of first) if ((await slotOf(e.store, id)) === 'shoes') shoes.push(id);
    expect((await e.morning.swap(ID, shoes)).swapped).toBe(true);
    const swappedKv = await e.store.getKv(`idea.swapped.${ID}`);
    const swapped = (await card(e.store)).items;
    // A color that keeps it valid: a quiet neutral on its top.
    const top = [];
    for (const id of swapped) if ((await slotOf(e.store, id)) === 'top') top.push(id);
    const neutral = (await colorEdits(e.store, top[0]!)).find(([, v]) => ['grey', 'white', 'black', 'navy', 'charcoal'].includes(String(v)))!;
    await e.closet.editPiece(top[0]!, neutral[0], neutral[1]);
    await e.morning.freshen();
    expect((await card(e.store)).items).toEqual(swapped);
    // Now the pants become slides' worth of wrong: sweatpants at Class is held, so the outfit no longer works.
    const pants = [];
    for (const id of swapped) if ((await slotOf(e.store, id)) === 'bottom') pants.push(id);
    await e.closet.editPiece(pants[0]!, 'kind', 'sweatpants');
    await e.morning.freshen();
    const after = (await card(e.store)).items;
    expect(same(after, swapped)).toBe(false);
    for (const s of shoes) expect(after).not.toContain(s);
    expect(await e.store.getKv(`idea.swapped.${ID}`)).toBe(swappedKv);
    expect(await e.store.getKv(`idea.touched.${ID}`)).toBe('1');
  });

  it('R5 after Wear this the card never changes, and the wear log keeps its outfit', async () => {
    const { itemId, field, value } = await findEdit('changes');
    const e = await setup();
    await e.morning.wear(ID);
    const before = await card(e.store);
    await e.closet.editPiece(itemId, field, value);
    expect(await e.morning.freshen()).toBe(false);
    const after = await card(e.store);
    expect(after.items).toEqual(before.items);
    expect((await e.store.wearLog.get('2026-10-22'))!.outfitId).toBe(before.row.outfitId);
  });

  it('R6 a checked card, Staying in, and an earlier card never change', async () => {
    const { itemId, field, value } = await findEdit('changes');
    // Checked: a scored check in the card's window.
    const e = await setup();
    const base = (await e.store.fitChecks.all()).find((c) => c.status === 'scored')!;
    await e.store.fitChecks.put({ ...base, id: 'NOW', parentId: null, dayKey: '2026-10-22', createdAt: at('2026-10-22T07:50:00-04:00') } as FitCheckRow);
    const checked = await card(e.store);
    await e.closet.editPiece(itemId, field, value);
    await e.morning.freshen();
    expect((await card(e.store)).items).toEqual(checked.items);
    // Staying in.
    const s = await setup();
    await s.store.dailyIdeas.put({ ...(await card(s.store)).row, state: 'stayingIn' });
    const stay = await card(s.store);
    await s.closet.editPiece(itemId, field, value);
    await s.morning.freshen();
    expect((await card(s.store)).outfit).toEqual(stay.outfit);
    // The day card, looked at in the evening.
    const d = await setup();
    const day = await card(d.store);
    d.clock.set(at('2026-10-22T18:30:00-04:00'));
    await d.closet.editPiece(itemId, field, value);
    await d.morning.freshen();
    expect((await card(d.store)).outfit).toEqual(day.outfit);
  });
});

describe('R7–R9 · removed pieces, Undo, older cards', () => {
  it('R7 a piece removed from Closet, or merged into another, re-plans the card: no tile goes missing', async () => {
    for (const how of ['remove', 'merge'] as const) {
      const e = await setup();
      const before = await card(e.store);
      const gone = before.items[before.items.length - 1]!; // the shoes
      if (how === 'remove') await e.closet.removeItem(gone);
      else {
        const slot = await slotOf(e.store, gone);
        const into = (await e.store.closet.all()).find((c) => !c.isDeleted && c.slot === slot && c.id !== gone)!;
        expect(await e.closet.merge(gone, into.id)).not.toBeNull();
      }
      expect(await e.morning.freshen()).toBe(true);
      const after = await card(e.store);
      expect(after.items).not.toContain(gone);
      const live = (await e.store.closet.all()).filter((c) => !c.isDeleted && !c.mergedInto).map((c) => c.id);
      for (const id of after.items) expect(live).toContain(id);
      expect(after.items.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('R8 Undo before Stylist shows: nothing; Undo after the re-plan: the first outfit comes back', async () => {
    const { itemId, field, value } = await findEdit('changes');
    const e = await setup();
    const first = await card(e.store);
    const r1 = (await e.closet.editPiece(itemId, field, value))!;
    await e.closet.restoreEdit(r1.undo);
    expect(await e.morning.freshen()).toBe(false);
    expect((await card(e.store)).outfit).toEqual(first.outfit);
    const r2 = (await e.closet.editPiece(itemId, field, value))!;
    await e.morning.freshen();
    expect(same((await card(e.store)).items, first.items)).toBe(false);
    await e.closet.restoreEdit(r2.undo);
    await e.morning.freshen();
    const back = await card(e.store);
    expect(back.items).toEqual(first.items);
    expect(updatedLine(back.outfit!, await e.store.closet.all())).toBeNull();
  });

  it('R9 a card saved before this (no fingerprint): the first look writes one and re-plans nothing', async () => {
    const { itemId, field, value } = await findEdit('changes');
    const e = await setup();
    const c = await card(e.store);
    const { basis: _b, ...rest } = c.outfit!.details as Record<string, unknown>;
    void _b;
    await e.store.outfits.put({ ...c.outfit!, details: rest as OutfitRow['details'] });
    await e.closet.editPiece(itemId, field, value);
    expect(await e.morning.freshen()).toBe(false);
    const after = await card(e.store);
    expect(after.items).toEqual(c.items);
    expect((after.outfit!.details as { basis?: unknown }).basis).toBeTruthy();
  });
});

describe('R10–R12 · Kit, background work, the weather refresh', () => {
  it('R10 after a re-plan, Kit\'s "What should I wear?" names the card\'s new outfit', async () => {
    const { itemId, field, value } = await findEdit('changes');
    const e = await setup();
    await e.closet.editPiece(itemId, field, value);
    await e.morning.freshen();
    const now = await card(e.store);
    const snap = await loadStylistSnapshot(e.store, e.clock);
    const q = 'What should I wear today?';
    const ctx = buildStylistContext(snap, q);
    const today = dayKey(snap.nowMs, snap.zone);
    const route = routeQuestion(q, { closet: snap.closet, checks: snap.checks, context: ctx, dayOf: (c: FitCheckRow) => ({ dow: localParts(c.createdAt, snap.zone).dow, today: c.dayKey === today }) });
    const ev = await buildEvidence(route, snap, ctx, { readingOf: async () => null, starterMarks: [] });
    const pick = ev.text.split('\n').find((l) => l.startsWith('- Pick ('))!;
    expect(pick).toMatch(/same as today's card/);
    const ids = [...pick.split(' · ')[0]!.matchAll(/\bP\d+\b/g)].map((h) => ctx.handles[h[0]]);
    expect(same(ids as string[], now.items)).toBe(true);
  });

  it('R11 background closet work on a card piece (a rename, a measured color, a new name detail) re-plans nothing', async () => {
    const e = await setup();
    const before = await card(e.store);
    const id = before.items[0]!;
    const it = (await e.store.closet.get(id))!;
    await e.store.closet.patch(id, { name: 'My favourite piece', hex: '#123456', shade: 'dark', updatedAt: e.clock.nowMs() });
    expect(it.garment).toEqual((await e.store.closet.get(id))!.garment);
    expect(await e.morning.freshen()).toBe(false);
    expect((await card(e.store)).outfit).toEqual(before.outfit);
  });

  it('R12 a piece change and a stale forecast on the same look: one card, planned for the fresh forecast and the current pieces', async () => {
    const { itemId, field, value } = await findEdit('changes');
    const e = await setup();
    await e.closet.editPiece(itemId, field, value);
    e.clock.set(at('2026-10-22T09:00:00-04:00')); // the forecast is stale now
    expect(await e.morning.freshen()).toBe(true);
    const after = await card(e.store);
    const w = after.row.weather as { fetchedAt?: number };
    expect(w.fetchedAt).toBe(at('2026-10-22T09:00:00-04:00'));
    // Settled: nothing left to do on the next look.
    expect(await e.morning.freshen()).toBe(false);
    const live = (await e.store.closet.all()).filter((c) => !c.isDeleted).map((c) => c.id);
    for (const id of after.items) expect(live).toContain(id);
  });
});

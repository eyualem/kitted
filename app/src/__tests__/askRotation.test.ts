// Kit's outfit ideas rotate like the morning card (#358): checks written before the code. Kit's "what should I wear"
// and "what goes with my …" see the card's history (earlier cards, Wear this, fit checks, 14 days), plus Kit's own
// outfit cards from earlier days; the first pick for today is the card's own outfit when the occasion matches, so
// the card and Kit never disagree about today. Nothing calls Google.
import { dayKey, localParts, outfitKey, US_EASTERN, type ClosetItem, type DayWeather } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import type { KittedStore } from '@/data/store';
import { loadScenario } from '@/data/seedLoader';
import type { ChatMessage, ClosetItemRow, FitCheckRow, OccasionKey } from '@/data/types';
import { buildStylistContext } from '@/features/ask/context';
import { buildEvidence } from '@/features/ask/evidence';
import { routeQuestion } from '@/features/ask/router';
import { loadStylistSnapshot } from '@/features/ask/snapshot';
import { createMorningService, scoringOccasion } from '@/features/morning/service';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import type { WeatherSource } from '@/services/weather';

const at = (iso: string) => Date.parse(iso);
const MILD: DayWeather = { window: 'day', nowF: 58, highF: 66, lowF: 52, feelsLowF: 50, feelsHighF: 65, precipChance: 0.1, precipFromHour: null, condition: 'clear' } as DayWeather;
const weather: WeatherSource = {
  kind: 'sample',
  permission: async () => 'granted',
  requestPermission: async () => 'granted',
  forecast: async (window) => ({ ...MILD, window }),
};

/** The full demo closet, with (or without) today's morning card posted. */
async function setup(nowIso = '2026-10-22T09:30:00-04:00', opts: { card?: boolean } = {}) {
  const store = createMemoryStore();
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: at('2026-10-20T07:00:00-04:00') });
  const clock = manualClock(at(nowIso));
  const svc = createMorningService({ store, clock, weather, ids: counterIds() });
  if (opts.card !== false) await svc.ensureCard();
  return { store, clock, svc };
}

interface Asked { lines: Record<string, string[]>; text: string }

/** Kit's evidence for a question, with each outfit line's pieces as closet ids ("Pick" → [ids]). */
async function ask(store: KittedStore, clock: ReturnType<typeof manualClock>, q: string): Promise<Asked> {
  const snap = await loadStylistSnapshot(store, clock);
  const ctx = buildStylistContext(snap, q);
  const today = dayKey(snap.nowMs, snap.zone);
  const route = routeQuestion(q, { closet: snap.closet, checks: snap.checks, context: ctx, dayOf: (c: FitCheckRow) => ({ dow: localParts(c.createdAt, snap.zone).dow, today: c.dayKey === today }) });
  const ev = await buildEvidence(route, snap, ctx, { readingOf: async () => null, starterMarks: [] });
  const lines: Record<string, string[]> = {};
  for (const l of ev.text.split('\n')) {
    const m = /^- (Pick|Another|Best|Dressier|More relaxed) \(/.exec(l);
    if (!m) continue;
    const pieces = l.split(' · ')[0]!;
    lines[m[1]!] = [...pieces.matchAll(/\bP\d+\b/g)].map((h) => ctx.handles[h[0]]!).filter(Boolean);
  }
  return { lines, text: ev.text };
}

async function cardOf(store: KittedStore, id = '2026-10-22|day') {
  const row = (await store.dailyIdeas.get(id))!;
  const items = row.outfitId ? (await store.outfits.get(row.outfitId))!.itemIds : [];
  return { row, items };
}

const sameSet = (a: readonly string[], b: readonly string[]) => [...a].sort().join('+') === [...b].sort().join('+');
async function trioKey(store: KittedStore, ids: readonly string[]) {
  const closet = await store.closet.all();
  return outfitKey(ids.map((id) => closet.find((c) => c.id === id)!).filter(Boolean) as unknown as ClosetItem[]);
}
async function topOf(store: KittedStore, ids: readonly string[]) {
  const closet = await store.closet.all();
  return ids.find((id) => closet.find((c) => c.id === id)?.slot === 'top');
}

/** Kit's outfit card on an earlier day, as the pipeline stores it. */
async function kitCard(store: KittedStore, createdAt: number, itemIds: string[], occasion: OccasionKey) {
  const msg: ChatMessage = {
    id: `KIT-${createdAt}`, createdAt, role: 'stylist', kind: 'text', text: 'Try this.', cardType: null, fitCheckId: null,
    outfitId: null, itemId: null, chips: [], payload: { askCard: { type: 'outfit', itemIds, occasion } },
  } as unknown as ChatMessage;
  await store.chat.put(msg);
}

/** He wore these on `day` (a Wear this from a card, as the wear log stores it). */
async function wore(store: KittedStore, day: string, itemIds: string[]) {
  const id = `WORE-${day}`;
  await store.outfits.put({ id, itemIds, occasion: 'everyday', title: null, summary: '', details: {}, source: 'idea', isSaved: false, createdAt: at(`${day}T08:00:00-04:00`) });
  await store.wearLog.put({ day, fitCheckId: null, outfitId: id, createdAt: at(`${day}T08:00:00-04:00`) });
}

describe('K1–K3 · Kit\'s first pick for today is the card\'s outfit', () => {
  it('K1 "What should I wear?" with no occasion: the card\'s occasion, and its outfit as the Pick', async () => {
    const { store, clock } = await setup();
    const { row, items } = await cardOf(store);
    expect(items.length).toBeGreaterThanOrEqual(3);
    const a = await ask(store, clock, 'What should I wear today?');
    expect(sameSet(a.lines.Pick!, items)).toBe(true);
    expect(a.text).toMatch(new RegExp(`Pick \\(${scoringOccasion(row.occasion).replace('_', ' ')}`, 'i'));
    expect(a.text).toMatch(/same as today's card/);
  });

  it('K2 naming the card\'s occasion gives the card\'s outfit too; another occasion is picked fresh, not forced', async () => {
    const { store, clock } = await setup();
    const { row, items } = await cardOf(store);
    expect(row.occasion).toBe('class'); // Oct 22 2026 is a Thursday
    expect(sameSet((await ask(store, clock, 'What should I wear to class?')).lines.Pick!, items)).toBe(true);
    const date = await ask(store, clock, 'What should I wear on a date?');
    expect(date.lines.Pick?.length).toBeGreaterThanOrEqual(3);
    expect(date.text).not.toMatch(/same as today's card/);
  });

  it('K3 a card piece he deleted since, or now avoids, is never offered: Kit picks fresh', async () => {
    const { store, clock } = await setup();
    const { items } = await cardOf(store);
    const top = (await topOf(store, items))!;
    const row = (await store.closet.get(top))!;
    await store.closet.put({ ...row, isDeleted: true } as ClosetItemRow);
    const a = await ask(store, clock, 'What should I wear today?');
    expect(a.lines.Pick).toBeDefined();
    expect(a.lines.Pick).not.toContain(top);
    expect(a.text).not.toMatch(/same as today's card/);

    // He told Kit he avoids the card's top's color: same rule.
    const again = await setup();
    const card = await cardOf(again.store);
    const cardTop = (await again.store.closet.get((await topOf(again.store, card.items))!))!;
    const color = String(cardTop.garment.color_family).replace(/_/g, ' ');
    await again.store.facts.put({ id: 'FX1', key: 'color_avoid', value: color, source: 'told', createdAt: at('2026-10-21T09:00:00-04:00'), isDeleted: false });
    const b = await ask(again.store, again.clock, 'What should I wear today?');
    expect(b.lines.Pick).toBeDefined();
    expect(b.lines.Pick).not.toContain(cardTop.id);
    expect(b.text).not.toMatch(/same as today's card/);
  });

  it('K3b with no card today (evening cards stopped, or none posted), Kit still answers from the picker', async () => {
    const { store, clock } = await setup('2026-10-22T09:30:00-04:00', { card: false });
    const a = await ask(store, clock, 'What should I wear today?');
    expect(a.lines.Pick?.length).toBeGreaterThanOrEqual(3);
  });
});

describe('K4–K6 · Kit sees what he wore and what he was shown', () => {
  it('K4 the outfit he wore yesterday is not Kit\'s pick today (another occasion than the card)', async () => {
    const { store, clock } = await setup();
    const first = (await ask(store, clock, 'What should I wear on a date?')).lines.Pick!;
    expect(first.length).toBeGreaterThanOrEqual(3);
    await wore(store, '2026-10-21', first);
    const next = (await ask(store, clock, 'What should I wear on a date?')).lines.Pick!;
    expect(await trioKey(store, next)).not.toBe(await trioKey(store, first));
  });

  it('K5 Kit\'s own outfit card from yesterday counts as shown: the same question today gets another outfit', async () => {
    // Today's answer with no history from Kit, then the same answer stored as Kit's card yesterday.
    const plain = await setup('2026-10-22T09:30:00-04:00', { card: false });
    const shown = (await ask(plain.store, plain.clock, 'What should I wear on a date?')).lines.Pick!;
    expect(shown.length).toBeGreaterThanOrEqual(3);

    const withCard = await setup('2026-10-22T09:30:00-04:00', { card: false });
    await kitCard(withCard.store, at('2026-10-21T09:31:00-04:00'), shown, 'date');
    const today = (await ask(withCard.store, withCard.clock, 'What should I wear on a date?')).lines.Pick!;
    expect(await trioKey(withCard.store, today)).not.toBe(await trioKey(withCard.store, shown));
    // Kit's card from earlier today doesn't count: the same question twice gets the same advice (the guide's rule).
    const sameDay = await setup('2026-10-22T09:30:00-04:00', { card: false });
    await kitCard(sameDay.store, at('2026-10-22T09:00:00-04:00'), shown, 'date');
    expect(sameSet((await ask(sameDay.store, sameDay.clock, 'What should I wear on a date?')).lines.Pick!, shown)).toBe(true);
  });

  it('K6 "What goes with my …" sees the history too: its Best outfit isn\'t the one he wore yesterday', async () => {
    const { store, clock } = await setup('2026-10-22T09:30:00-04:00', { card: false });
    const closet = (await store.closet.all()).filter((c) => !c.isDeleted && c.slot === 'bottom');
    let tried = 0;
    for (const pin of closet) {
      const q = `What goes with my ${pin.name.toLowerCase()}?`;
      const best = (await ask(store, clock, q)).lines.Best;
      if (!best || !best.includes(pin.id)) continue;
      tried++;
      await wore(store, '2026-10-21', best);
      const again = (await ask(store, clock, q)).lines.Best!;
      expect(again).toContain(pin.id);
      expect(await trioKey(store, again)).not.toBe(await trioKey(store, best));
      break;
    }
    expect(tried).toBe(1);
  });
});

describe('K7–K8 · steady within a day, and two real choices', () => {
  it('K7 the same question twice in one day gets the same outfits', async () => {
    const { store, clock } = await setup();
    const a = await ask(store, clock, 'What should I wear on a date?');
    clock.set(at('2026-10-22T13:10:00-04:00'));
    const b = await ask(store, clock, 'What should I wear on a date?');
    expect(b.lines).toEqual(a.lines);
  });

  it('K8 "Another" never repeats the Pick\'s top, even when the Pick has a layer', async () => {
    for (const q of ['What should I wear today?', 'What should I wear on a date?', 'What should I wear to an interview?']) {
      const { store, clock } = await setup();
      const a = await ask(store, clock, q);
      if (!a.lines.Another) continue;
      expect(await topOf(store, a.lines.Another)).not.toBe(await topOf(store, a.lines.Pick!));
    }
  });
});

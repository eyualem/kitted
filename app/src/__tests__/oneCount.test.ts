// One "+N outfits" everywhere (09-ui-review §15, G1–G8, #309): the chat's buy card and evidence, the Starter toast,
// move 3 and the Closet's next best buy all count with the Closet's own rule (#84.3, closet/outfits.ts).
import { US_EASTERN } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import type { ClosetItemRow } from '@/data/types';
import { buildCard } from '@/features/ask/cards';
import { buildStylistContext } from '@/features/ask/context';
import { buildEvidence } from '@/features/ask/evidence';
import { checkSentence } from '@/features/ask/gate';
import { routeQuestion } from '@/features/ask/router';
import { loadStylistSnapshot } from '@/features/ask/snapshot';
import { DEMO_CARD_ANSWERS } from '@/features/ask/source';
import { outfitCount, outfitGain } from '@/features/closet/outfits';
import { ghostPiece, nextBestBuy, starterGain } from '@/features/finish/gains';
import { buildMoves, pickBuy } from '@/features/finish/moves';
import { starterList } from '@/features/finish/packs';
import { ownership, STARTER } from '@/features/finish/starter';
import { toggleStarter } from '@/features/finish/starterActions';
import { t } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';

const { readFileSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');
declare const __dirname: string;

const AS_OF = Date.parse('2026-10-22T12:00:00-04:00');

async function setup() {
  const store = createMemoryStore();
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: AS_OF });
  const closet = await store.closet.all();
  const styles = (await store.profile.get('me'))?.styles ?? null;
  return { store, closet, styles };
}

/** The Closet's count with the row's piece minus without it: the one rule. */
const closetGain = (closet: readonly ClosetItemRow[], styles: Parameters<typeof outfitCount>[2], e: (typeof STARTER)[number]) =>
  outfitCount([...closet, ghostPiece(e)!], [], styles) - outfitCount(closet, [], styles);

const missing = (closet: readonly ClosetItemRow[]) => {
  const own = ownership(closet, []);
  return STARTER.filter((e) => e.pick && e.slot && !own[e.id]?.owned);
};

async function buyEvidence(store: Awaited<ReturnType<typeof setup>>['store']) {
  const clock = manualClock(Date.parse('2026-10-22T12:30:00-04:00'));
  const snap = await loadStylistSnapshot(store, clock);
  const q = 'What should I buy next?';
  const ctx = buildStylistContext(snap, q);
  const route = routeQuestion(q, { closet: snap.closet, checks: snap.checks, context: ctx, dayOf: () => ({ dow: 4, today: true }) });
  expect(route.kind).toBe('buyNext');
  const ev = await buildEvidence(route, snap, ctx, { readingOf: async () => null, starterMarks: [] });
  return { snap, ctx, lines: ev.text.split('\n').filter((l) => l.startsWith('- ')) };
}

describe('G1 · every "+N" is the Closet\'s count with it minus without it', () => {
  it('the chat card, the evidence, move 3, the Closet\'s next buy and the Starter toast agree on the demo closet', async () => {
    const { store, closet, styles } = await setup();
    const rows = missing(closet);
    expect(rows.length).toBeGreaterThan(2);
    const { lines } = await buyEvidence(store);
    const input = { handles: {}, closet, checks: [], styles, starterMarks: [], gate: { allowedScores: new Set<string>() } };
    for (const e of rows) {
      const want = closetGain(closet, styles, e);
      expect([e.id, starterGain(closet, styles, e)]).toEqual([e.id, want]);
      expect([e.id, outfitGain(closet, styles, ghostPiece(e)!)]).toEqual([e.id, want]);
      const card = buildCard({ type: 'buy', kind: e.pick!.name, shade: null }, input);
      if (card?.type === 'buy' && card.starterId === e.id) expect([e.id, card.gain]).toEqual([e.id, want]);
      const line = lines.find((l) => l.startsWith(`- ${e.id} `));
      if (line) expect(line).toContain(`· +${want} outfits`);
      // Move 3 names it (as the posted pick) with the same number.
      const plan = buildMoves({ first: { fixes: [], details: {} }, recheck: null, closet, styles, markedKv: [], buyId: e.id });
      expect(plan.moves[2]!.detail).toBe(want > 0 ? t('plan.move3Sub', { price: e.budget, n: want }) : e.budget);
    }
    const nb = nextBestBuy({ closet, checks: await store.fitChecks.all(), styles, marks: [] })!;
    expect(nb.gain).toBe(closetGain(closet, styles, nb.entry));
  });

  it('the Starter toast says the same "+N" as the count it adds', async () => {
    const { store, closet, styles } = await setup();
    const e = missing(closet).find((x) => closetGain(closet, styles, x) > 1)!;
    const n = closetGain(closet, styles, e);
    const toast = await toggleStarter(store, e, counterIds(), AS_OF + 1000);
    expect(toast?.text).toBe(t('toast.fits', { n }));
    expect(outfitCount(await store.closet.all(), [], styles) - outfitCount(closet, [], styles)).toBe(n);
  });
});

describe('G2–G3 · the same pick in the chat, the moves card and Closet', () => {
  it('the evidence lists the rows in the Closet\'s ranking; its first row is the next best buy (work boots, +18: the demo picks workwear, #313)', async () => {
    const { store, closet, styles } = await setup();
    const { lines } = await buyEvidence(store);
    const nb = nextBestBuy({ closet, checks: [], styles, marks: [] })!;
    expect(nb.entry.id).toBe('s27');
    expect(nb.gain).toBe(18);
    expect(lines[0]).toMatch(/^- s27 brown work boots · \+18 outfits/);
    const gains = lines.map((l) => Number(/\+(\d+) outfits/.exec(l)![1]));
    for (let i = 1; i < gains.length; i++) expect(gains[i - 1]).toBeGreaterThanOrEqual(gains[i]!);
    // Ties keep his list's order (his first look's rows first, #313).
    const ids = lines.map((l) => /^- (s\d+)/.exec(l)![1]!);
    const order = starterList(styles).map((e) => e.id);
    for (let i = 1; i < ids.length; i++) if (gains[i - 1] === gains[i]) expect(order.indexOf(ids[i - 1]!)).toBeLessThan(order.indexOf(ids[i]!));
  });

  it('move 3 picks the next best buy; with nothing that adds one, the first missing row and its price alone', async () => {
    const { closet, styles } = await setup();
    const first = { fixes: [], details: {} };
    expect(pickBuy({ first, recheck: null, closet, styles, markedKv: [] })).toBe(nextBestBuy({ closet, checks: [], styles, marks: [] })!.entry.id);
    expect(pickBuy({ first, recheck: null, closet: [], styles, markedKv: [] })).toBe('s01');
    expect(buildMoves({ first, recheck: null, closet: [], styles, markedKv: [], buyId: null }).moves[2]!.detail).toBe(STARTER[0]!.budget);
  });
});

describe('G4 · a piece only mentioned in chat changes nothing', () => {
  it('chat-only pieces are left out of every number', async () => {
    const { store, closet, styles } = await setup();
    const top = closet.find((c) => c.slot === 'top' && c.source !== 'chat')!;
    const shoes = closet.find((c) => c.slot === 'shoes' && c.source !== 'chat')!;
    const extra: ClosetItemRow[] = [{ ...top, id: 'C-top', source: 'chat', isPhotographed: false }, { ...shoes, id: 'C-shoes', source: 'chat', isPhotographed: false }];
    for (const e of missing(closet)) expect([e.id, starterGain([...closet, ...extra], styles, e)]).toEqual([e.id, starterGain(closet, styles, e)]);
    const before = (await buyEvidence(store)).lines;
    for (const p of extra) await store.closet.put(p);
    expect((await buyEvidence(store)).lines).toEqual(before);
  });
});

describe('G5 · no import cycle', () => {
  const src = (f: string) => readFileSync(join(__dirname, '..', 'features', f), 'utf8');
  it('outfits.ts and starter.ts don\'t import each other', () => {
    expect(src('closet/outfits.ts')).not.toMatch(/from '[^']*finish\/starter'/);
    expect(src('finish/starter.ts')).not.toMatch(/from '[^']*closet\/outfits'/);
  });
  it('the old count is gone', () => {
    expect(src('finish/starter.ts')).not.toMatch(/fitsGain|rotation/);
  });
});

describe('G7 · always a number, fast', () => {
  it('counts every Starter row on a 60-piece closet in under a second', async () => {
    const { closet, styles } = await setup();
    const own = closet.filter((c) => c.source !== 'chat');
    const big: ClosetItemRow[] = [];
    for (let i = 0; big.length < 60; i++) for (const c of own) if (big.length < 60) big.push({ ...c, id: `${c.id}-${i}` });
    const t0 = Date.now();
    for (const e of STARTER) if (e.pick && e.slot) expect(typeof starterGain(big, styles, e)).toBe('number');
    expect(Date.now() - t0).toBeLessThan(1000);
  });
});

describe('G8 · the demo\'s "What should I buy next?"', () => {
  it('suggests the piece Closet suggests, with the same "+N", in words that pass the gate', async () => {
    const { closet, styles } = await setup();
    const a = DEMO_CARD_ANSWERS.find((x) => x.question === 'What should I buy next?')!;
    const card = buildCard(a.card, { handles: {}, closet, checks: [], styles, starterMarks: [], gate: { allowedScores: new Set<string>() } });
    const nb = nextBestBuy({ closet, checks: [], styles, marks: [] })!;
    expect(card).toEqual({ type: 'buy', starterId: nb.entry.id, gain: nb.gain });
    for (const s of a.answer.split(/(?<=\.)\s+/)) expect([s, checkSentence(s, { allowedScores: new Set() })]).toEqual([s, null]);
  });
});

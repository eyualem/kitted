// T105 · Kit's words: today's cards, the color list and the wiring (specs/kit-stylist-chat.md KC1.1, KC3.3, KC3.5, KC5.2,
// KC6.1, KC6.3, KC8.1). Written before the code (tasks/T105/TESTING.md). The model is a script; the color list is a
// stand-in unless a test says "real engine". Nothing here calls a model or the network.
import { dayKey, G, US_EASTERN, type ColorFamily, type AllowedColorsInput } from '@kitted/core';
import { createMemoryStore } from '@/data/memoryStore';
import type { ChatMessage, ClosetItemRow, FitCheckRow, ProfileRow } from '@/data/types';
import { buildCard, kindNoun, type CardPiece } from '@/features/ask/cards';
import { buildStylistContext } from '@/features/ask/context';
import { allowedForCard, colorEvidence, isColorQuestion, mentionsColoring, shownCardLines } from '@/features/ask/evidence';
import { garmentOf } from '@/features/ask/memory';
import { createPrepare } from '@/features/ask/prepare';
import { appMap, type AppSwitches } from '@/features/ask/prompt';
import { routeQuestion, type Route } from '@/features/ask/router';
import { loadStylistSnapshot } from '@/features/ask/snapshot';
import { liveAnswer } from '@/features/ask/live';
import { accountsOn, setDemoAccounts, settingsAccountOn } from '@/features/account/account';
import { SHARE_CARD_BUILT } from '@/config/features';
import { outfitsOn, setDemoOutfits } from '@/features/closet/outfitsSwitch';
import { notificationsOn, paywallOn, setDemoNotify } from '@/features/paywall/switch';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { harness, kit, NOW, row, rowOf, says, valid } from '@/testing/kitCardsHelpers';

beforeEach(() => liveAnswer.clear());
afterEach(() => {
  setDemoOutfits(false);
  setDemoAccounts(null);
  setDemoNotify(null);
});

const at = (hhmm: string, day = '2026-10-22') => Date.parse(`${day}T${hhmm}:00-04:00`);
const ALL24 = [
  'white', 'off_white_cream', 'light_grey', 'grey', 'charcoal', 'black', 'navy', 'light_blue', 'blue', 'denim_light', 'denim_mid', 'denim_dark',
  'olive', 'green', 'sage', 'khaki_beige', 'tan_camel', 'brown', 'burgundy', 'red', 'orange', 'yellow', 'pink', 'purple',
] as ColorFamily[];
const THURSDAY = ['tee', 'oliveSweater', 'jeans', 'boots', 'bomber'];

const POOL = ['calm', 'steady', 'quiet', 'honest', 'simple', 'clear', 'soft', 'good', 'fine', 'neat', 'easy', 'plain', 'solid', 'kind'];
function sentence(n: number, i = 0): string {
  const words = Array.from({ length: n }, (_, k) => POOL[(i * 3 + k) % POOL.length]!);
  words[0] = words[0]!.charAt(0).toUpperCase() + words[0]!.slice(1);
  return `${words.join(' ')}.`;
}
const SEVENTY = [0, 1, 2, 3, 4].map((i) => sentence(14, i)).join(' '); // five sentences of 14 words
const first = (n: number) => [0, 1, 2, 3, 4].slice(0, n).map((i) => sentence(14, i)).join(' ');
const words = (s: string) => s.trim().split(/\s+/).length;

const piece = (kind: string, color: string, name: string): CardPiece => ({ kind, color, name });
const chatRow = (id: string, createdAt: number, askCard: unknown, role: ChatMessage['role'] = 'stylist'): ChatMessage => ({
  id, createdAt, role, kind: 'text', text: 'Here you go.', cardType: null, fitCheckId: null, outfitId: null, itemId: null, chips: [], payload: { askCard },
});
const outfitCard = (itemIds: string[], extra: Record<string, unknown> = {}) => ({ type: 'outfit', itemIds, occasion: 'everyday', needs: [], example: false, ...extra });

async function load(rows: readonly ClosetItemRow[], chat: readonly ChatMessage[] = [], more?: (store: ReturnType<typeof createMemoryStore>) => Promise<void>) {
  const store = createMemoryStore();
  const clock = manualClock(NOW, US_EASTERN);
  for (const r of rows) await store.closet.put(r);
  for (const m of chat) await store.chat.put(m);
  await more?.(store);
  const snap = await loadStylistSnapshot(store, clock);
  return { store, clock, snap };
}

function asking(snap: Awaited<ReturnType<typeof load>>['snap'], q: string) {
  const ctx = buildStylistContext(snap, q);
  const h = (id: string): string => {
    const hit = Object.entries(ctx.handles).find(([, v]) => v === id);
    if (!hit) throw new Error(`no handle for ${id}`);
    return hit[0];
  };
  const today = dayKey(snap.nowMs, snap.zone);
  const route = routeQuestion(q, { closet: snap.closet, checks: snap.checks, context: ctx, dayOf: (c) => ({ dow: 0, today: c.dayKey === today }) });
  return { ctx, h, route };
}
const routeOf = (pieces: string[]): Route => ({ kind: 'goesWith', pieces, check: null, occasion: null, sure: true });
const standIn = (list: readonly string[]) => jest.fn((_input: AllowedColorsInput) => list as ColorFamily[]);

const THURSDAY_ROWS = THURSDAY.map((k) => rowOf(k));
const TODAYS_OUTFIT = [chatRow('K1', at('12:00'), outfitCard(['tee', 'jeans', 'boots']))];

// ---------------------------------------------------------------- KC1.1 · the stored answer is cut
describe('KC1.1 · the stored answer is cut', () => {
  const KEYS = ['tee', 'jeans', 'boots'];

  it('KC1.1 · the stored answer is cut: two sentences with a card, four without, four for a tap question', async () => {
    expect(valid(KEYS)).toBe(true);
    expect(words(SEVENTY)).toBe(70);
    const rows = KEYS.map((k) => rowOf(k));
    const h = await harness(rows, (q, handle) => {
      if (q.startsWith('Card')) return says(SEVENTY, { card: { type: 'outfit', pieces: KEYS.map(handle), occasion: 'everyday' } });
      if (q.startsWith('Tap')) return says(SEVENTY, { card: { type: 'ask', question: 'Is it a suit-and-tie office?', options: ['Yes', 'Business casual'] } });
      return says(SEVENTY);
    });
    const withCard = await h.run('Card question');
    expect((withCard.payload.askCard as { type: string }).type).toBe('outfit');
    expect(withCard.text).toBe(first(2));
    expect(words(withCard.text!)).toBe(28);
    const none = await h.run('No card question');
    expect('askCard' in none.payload).toBe(false);
    expect(none.text).toBe(first(4));
    expect(words(none.text!)).toBe(56);
    const tap = await h.run('Tap question');
    expect((tap.payload.askCard as { type: string }).type).toBe('ask');
    expect(tap.text).toBe(first(4));
  });

  it('KC1.1 · the stored answer is cut: the spoken text and the stored row hold the same cut words', async () => {
    const rows = KEYS.map((k) => rowOf(k));
    const spoken: string[] = [];
    const h = await harness(rows, (_q, handle) => says(SEVENTY, { card: { type: 'outfit', pieces: KEYS.map(handle), occasion: 'everyday' } }), {
      askDeps: { onAnswered: (s) => spoken.push(s) },
    });
    const m = await h.run('Card question');
    expect(m.text).toBe(first(2));
    expect(spoken).toHaveLength(1);
    expect(spoken[0]!.startsWith(first(2))).toBe(true);
    expect(spoken[0]).not.toContain(sentence(14, 2));
  });

  it('KC1.1 · the stored answer is cut: a retry is cut the same way', async () => {
    const rows = KEYS.map((k) => rowOf(k));
    let n = 0;
    const h = await harness(rows, (_q, handle) => (n++ === 0
      ? [{ type: 'failed', code: 'http' }]
      : says(SEVENTY, { card: { type: 'outfit', pieces: KEYS.map(handle), occasion: 'everyday' } })));
    const o = await h.ask.ask('Card question');
    if (o.kind !== 'sent') throw new Error('not sent');
    const failed = await o.done;
    expect(failed.kind).toBe('failed');
    const r = await h.ask.retry(failed.kind === 'failed' ? failed.messageId : '');
    if (r?.kind !== 'sent') throw new Error('no retry');
    const done = await r.done;
    if (done.kind !== 'answered') throw new Error('retry failed');
    const m = (await h.store.chat.get(done.messageId))!;
    expect(m.text).toBe(first(2));
  });
});

// ---------------------------------------------------------------- KC3.3 · the list as evidence
describe('KC3.3 · the list as evidence', () => {
  const TEE_Q = 'What color should the tee be?';

  it('KC3.3 · isColorQuestion and mentionsColoring read the questions the spec lists', () => {
    for (const q of ['What color should the collared shirt be?', 'What colors suit my skin?', 'What goes with olive?', 'Which shade of blue is best?', 'what colour is that']) {
      expect([q, isColorQuestion(q)]).toEqual([q, true]);
    }
    for (const q of ['What goes with my olive overshirt?', 'Is this outfit good?', 'what should I buy next']) {
      expect([q, isColorQuestion(q)]).toEqual([q, false]);
    }
    for (const q of ['What colors suit my skin?', 'what colors go with my skin tone and hair', 'does navy match my eyes']) {
      expect([q, mentionsColoring(q)]).toEqual([q, true]);
    }
    expect(mentionsColoring('What color should the collared shirt be?')).toBe(false);
  });

  it('KC3.3 · the list as evidence: the stand-in gets the tee and the rest of today\'s outfit, and the text names the list', async () => {
    const { snap } = await load(THURSDAY_ROWS, TODAYS_OUTFIT);
    const { ctx, h } = asking(snap, TEE_Q);
    const fn = standIn(['off_white_cream', 'light_blue']);
    const col = colorEvidence(TEE_Q, routeOf([h('tee')]), snap, ctx, { allowedColors: fn });
    expect(fn).toHaveBeenCalledTimes(1);
    const input = fn.mock.calls[0]![0];
    expect(input.piece).toEqual(rowOf('tee').garment);
    expect(input.others).toEqual([rowOf('jeans').garment, rowOf('boots').garment]);
    expect(col).not.toBeNull();
    expect(col!.text).toBe('Allowed colors for White tee (the rules would not mark these down in this outfit; name only these and the colors of his own pieces): Off-white, Light blue');
    expect(col!.allowed).toEqual(new Set(['off_white_cream', 'light_blue']));
    expect(col!.own).toEqual(new Set(['white', 'olive', 'denim_dark', 'black', 'tan_camel']));
  });

  it('KC3.3 · the list as evidence: a kind of piece he does not own, with no card and no check today', async () => {
    const { snap } = await load(THURSDAY_ROWS);
    const q = 'What color should the collared shirt be?';
    const { ctx } = asking(snap, q);
    const fn = standIn(ALL24);
    const col = colorEvidence(q, routeOf([]), snap, ctx, { allowedColors: fn });
    expect(fn).toHaveBeenCalledTimes(1);
    const input = fn.mock.calls[0]![0];
    const shirt = garmentOf('collared shirt')!;
    expect(input.others).toEqual([]);
    expect(input.piece).toMatchObject({ category: shirt.category, subcategory: shirt.subcategory });
    expect(col!.text).toBe(`Allowed colors for the ${kindNoun(String(shirt.subcategory))}: any of the 24 colors (nothing in the outfit limits it)`);
    expect(col!.allowed).toEqual(new Set(ALL24));
  });

  it('KC3.3 · the list as evidence: "what goes with olive?" asks twice and takes the union', async () => {
    const { snap } = await load(THURSDAY_ROWS);
    const q = 'What goes with olive?';
    const { ctx } = asking(snap, q);
    let n = 0;
    const fn = jest.fn((_i: AllowedColorsInput) => (n++ === 0 ? ['white', 'tan_camel'] : ['white', 'black']) as ColorFamily[]);
    const col = colorEvidence(q, routeOf([]), snap, ctx, { allowedColors: fn });
    expect(fn).toHaveBeenCalledTimes(2);
    const [one, two] = [fn.mock.calls[0]![0], fn.mock.calls[1]![0]];
    expect(one.others).toHaveLength(1);
    expect(one.others[0]).toMatchObject({ subcategory: 'tee', color_family: 'olive' });
    expect(one.piece).toMatchObject({ category: 'bottom' });
    expect(two.others).toHaveLength(1);
    expect(two.others[0]).toMatchObject({ subcategory: 'jeans', color_family: 'olive' });
    expect(two.piece).toMatchObject({ category: 'top' });
    expect(col!.allowed).toEqual(new Set(['white', 'black', 'tan_camel']));
    expect(col!.text).toMatch(/^Allowed colors for what goes with [Oo]live \(the rules would not mark these down in this outfit; name only these and the colors of his own pieces\): White, Black, Tan$/);
    // his own question names olive, so olive is a color he may hear back
    expect(col!.own.has('olive')).toBe(true);
  });

  it('KC3.3 · the list as evidence: no list for a belt, for a question that is not about color, or when the engine fails', async () => {
    const { snap } = await load(THURSDAY_ROWS, TODAYS_OUTFIT);
    const belt = 'What color should the belt be?';
    const fn = standIn(ALL24);
    expect(colorEvidence(belt, routeOf([]), snap, asking(snap, belt).ctx, { allowedColors: fn })).toBeNull();
    const q = 'What goes with my olive sweater?';
    const { ctx, h } = asking(snap, q);
    expect(colorEvidence(q, routeOf([h('oliveSweater')]), snap, ctx, { allowedColors: fn })).toBeNull();
    expect(fn).not.toHaveBeenCalled();
    // the engine returning nothing, or throwing: an empty list, and prepare is never given a throw
    const tq = asking(snap, 'What color should the tee be?');
    const empty = colorEvidence('What color should the tee be?', routeOf([tq.h('tee')]), snap, tq.ctx, { allowedColors: standIn([]) });
    expect(empty!.allowed).toEqual(new Set());
    const boom = jest.fn((_i: AllowedColorsInput): ColorFamily[] => {
      throw new Error('engine down');
    });
    let thrown: ColorEvidenceResult = null;
    expect(() => {
      thrown = colorEvidence('What color should the tee be?', routeOf([tq.h('tee')]), snap, tq.ctx, { allowedColors: boom });
    }).not.toThrow();
    expect((thrown as ColorEvidenceResult)!.allowed).toEqual(new Set());
  });

  it('KC3.3 · the list as evidence: a stored card that does not parse is skipped without a throw', async () => {
    const junk = chatRow('K2', at('12:10'), { type: 'outfit' });
    const { snap } = await load(THURSDAY_ROWS, [...TODAYS_OUTFIT, junk, chatRow('K3', at('12:11'), 'not a card')]);
    const { ctx, h } = asking(snap, TEE_Q);
    const fn = standIn(['light_blue']);
    const col = colorEvidence(TEE_Q, routeOf([h('tee')]), snap, ctx, { allowedColors: fn });
    expect(fn.mock.calls[0]![0].others).toEqual([rowOf('jeans').garment, rowOf('boots').garment]);
    expect(col!.allowed).toEqual(new Set(['light_blue']));
  });

  it('KC3.3 · the list as evidence: allowedForCard reads a colors block, and nothing else', async () => {
    const { snap } = await load(THURSDAY_ROWS, TODAYS_OUTFIT);
    const { ctx, h } = asking(snap, 'Show me something');
    const fn = standIn(['off_white_cream', 'light_blue']);
    const got = allowedForCard({ type: 'colors', piece: h('tee'), colors: ['off white', 'light blue'] }, snap, ctx, { allowedColors: fn });
    expect(got).toEqual(new Set(['off_white_cream', 'light_blue']));
    expect(fn.mock.calls[0]![0].others).toEqual([rowOf('jeans').garment, rowOf('boots').garment]);
    const g2 = allowedForCard({ type: 'colors', piece: 'collared shirt', colors: ['off white', 'light blue'] }, snap, ctx, { allowedColors: standIn(ALL24) });
    expect(g2).toEqual(new Set(ALL24));
    expect(allowedForCard({ type: 'colors', goesWith: 'olive', colors: ['white', 'tan', 'brown'] }, snap, ctx, { allowedColors: standIn(['white']) })).toEqual(new Set(['white']));
    expect(allowedForCard({ type: 'outfit', pieces: [h('tee')] }, snap, ctx, { allowedColors: fn })).toBeNull();
    expect(allowedForCard(null, snap, ctx, { allowedColors: fn })).toBeNull();
    expect(allowedForCard('colors', snap, ctx, { allowedColors: fn })).toBeNull();
  });
});
type ColorEvidenceResult = ReturnType<typeof colorEvidence>;

// ---------------------------------------------------------------- KC3.3 · the card is dropped
describe('KC3.3 · the card is dropped', () => {
  const colorsCard = (colors: string[], allowed: ReadonlySet<string> | null | undefined) => {
    const k = kit(['tee', 'jeans', 'boots'], allowed === undefined ? {} : { allowedColors: allowed });
    return buildCard({ type: 'colors', piece: k.h('tee'), colors }, k.input);
  };

  it('KC3.3 · the card is dropped: a color outside the list drops the card; too few colors, or an empty list, means no colors card', () => {
    const list = new Set(['off_white_cream', 'light_blue', 'tan_camel']);
    expect(colorsCard(['white', 'tan', 'navy'], list)).toBeNull();
    expect(colorsCard(['off white', 'tan'], list)).not.toBeNull();
    expect(colorsCard(['off white', 'light blue'], list)).toMatchObject({ type: 'colors', about: 'piece', families: ['off_white_cream', 'light_blue'] });
    expect(colorsCard(['light blue', 'off white'], new Set(['light_blue']))).toBeNull();
    expect(colorsCard(['light blue'], new Set(['light_blue']))).toBeNull();
    expect(colorsCard(['off white', 'light blue'], new Set())).toBeNull();
    // no list at all: the card is built as before
    expect(colorsCard(['off white', 'light blue'], null)).toMatchObject({ type: 'colors', families: ['off_white_cream', 'light_blue'] });
    expect(colorsCard(['off white', 'light blue'], undefined)).toMatchObject({ type: 'colors', families: ['off_white_cream', 'light_blue'] });
  });
});

// ---------------------------------------------------------------- KC3.3 · real engine
describe('KC3.3 · real engine', () => {
  const BROWN_BOOTS = row('brownBoots', 'Brown boots', 'shoes', G('footwear', 'work_boot', 'brown'));
  const WORLD = [rowOf('tee'), rowOf('chinos'), BROWN_BOOTS];
  const WORLD_CHAT = [chatRow('K1', at('12:00'), outfitCard(['tee', 'chinos', 'brownBoots']))];
  const TEE_Q = 'What color should the tee be?';
  const TWENTY_TWO = ALL24.filter((f) => f !== 'off_white_cream' && f !== 'khaki_beige');
  const NAMES = 'White, Light grey, Grey, Charcoal, Black, Navy, Light blue, Blue, Light denim, Mid denim, Dark denim, Olive, Green, Sage, Tan, Brown, Burgundy, Red, Orange, Yellow, Pink, Purple';

  it('KC3.3 · real engine: light on light gives the 22 colors of T103 case b, in the evidence and through prepare', async () => {
    const { store, clock, snap } = await load(WORLD, WORLD_CHAT);
    const { ctx, h } = asking(snap, TEE_Q);
    const col = colorEvidence(TEE_Q, routeOf([h('tee')]), snap, ctx);
    expect(TWENTY_TWO).toHaveLength(22);
    expect(col!.allowed).toEqual(new Set(TWENTY_TWO));
    expect(col!.text).toBe(`Allowed colors for White tee (the rules would not mark these down in this outfit; name only these and the colors of his own pieces): ${NAMES}`);
    const prepared = await createPrepare({ store, clock, ids: counterIds() })(TEE_Q);
    expect(prepared.gate.allowedColors).toEqual(new Set(TWENTY_TWO));
    expect(prepared.gate.ownColors).toEqual(new Set(['white', 'khaki_beige', 'brown']));
    expect(prepared.prompt!.user).toContain(`Allowed colors for White tee (the rules would not mark these down in this outfit; name only these and the colors of his own pieces): ${NAMES}`);
  });

  it('KC3.3 · real engine: through the pipeline a sentence naming a color outside the list is dropped, his own color is not', async () => {
    const h = await harness(WORLD, (q) => says(q.startsWith('Own') ? 'Beige is fine. Navy works too.' : 'Off-white works here. Navy works too.'), { chat: WORLD_CHAT });
    const dropped = await h.run(TEE_Q);
    expect(dropped.text).toBe('Navy works too.');
    // khaki chinos are his: the color is his own, so naming it is kept
    const own = await h.run('Own color: what color should the tee be?');
    expect(own.text).toBe('Beige is fine. Navy works too.');
  });

  it('KC3.3 · the card is dropped: through the pipeline an off-list color drops the card and the words stay', async () => {
    const h = await harness(WORLD, (q, handle) => {
      const colors = q.startsWith('Allowed') ? ['white', 'navy'] : ['off white', 'navy'];
      return says('White or navy works.', { card: { type: 'colors', piece: handle('tee'), colors } });
    }, { chat: WORLD_CHAT });
    const bad = await h.run(TEE_Q);
    expect(bad.text).toBe('White or navy works.');
    expect('askCard' in bad.payload).toBe(false);
    const good = await h.run('Allowed colors: what color should the tee be?');
    expect(good.payload.askCard).toMatchObject({ type: 'colors', about: 'piece', itemId: 'tee', families: ['white', 'navy'] });
  });

  it('KC3.3 · the card is dropped: also when the question was not a color question (allowedForCard)', async () => {
    const h = await harness(WORLD, (_q, handle) => says('White or navy works.', { card: { type: 'colors', piece: handle('tee'), colors: ['off white', 'navy'] } }), { chat: WORLD_CHAT });
    expect(isColorQuestion('Which of these should I wear?')).toBe(false);
    const m = await h.run('Which of these should I wear?');
    expect(m.text).toBe('White or navy works.');
    expect('askCard' in m.payload).toBe(false);
  });

  it('KC3.3 · no list, no sentence rule: a color sentence is kept when the question is not about color', async () => {
    const h = await harness(WORLD, () => says('Red would pop here.'), { chat: WORLD_CHAT });
    const m = await h.run('Which of these should I wear?');
    expect(m.text).toBe('Red would pop here.');
    // and once he asks about the tee's color there is a list, and a color outside it goes
    const h2 = await harness(WORLD, () => says('Off-white would pop here. Navy works too.'), { chat: WORLD_CHAT });
    expect((await h2.run(TEE_Q)).text).toBe('Navy works too.');
  });
});

// ---------------------------------------------------------------- KC3.5 · the coloring evidence
describe('KC3.5 · the coloring evidence', () => {
  const Q = 'What colors suit my skin?';

  it('KC3.5 · the coloring evidence: the second line sends him to the fixed line and to his own pieces\' colors', async () => {
    const { snap } = await load(THURSDAY_ROWS);
    const { ctx } = asking(snap, Q);
    const col = colorEvidence(Q, routeOf([]), snap, ctx, { allowedColors: standIn(ALL24) });
    expect(col).not.toBeNull();
    const lines = col!.text.split('\n');
    expect(lines.at(-1)).toBe('He asked about colors for his looks. Start with "I rate outfits, never people." then name only colors that go with his own pieces: White, Black, Dark denim, Olive, Tan');
    expect(lines.length).toBeGreaterThanOrEqual(2);
    // a color question that is not about him has no such line
    const plain = asking(snap, 'What color should the tee be?');
    const col2 = colorEvidence('What color should the tee be?', routeOf([plain.h('tee')]), snap, plain.ctx, { allowedColors: standIn(ALL24) });
    expect(col2!.text).not.toContain('He asked about colors for his looks');
  });

  it('KC3.5 · the coloring evidence: through the pipeline a reply about his eyes or skin becomes the fixed line, uncounted, no Retry', async () => {
    const h = await harness(THURSDAY_ROWS, (q) => says(q.includes('eyes') ? 'Pick the one that suits your eyes.' : 'Olive suits your skin tone.'));
    for (const q of [Q, 'What colors suit my eyes?']) {
      const m = await h.run(q);
      expect(m.text).toBe('I rate outfits, never people.');
      expect(m.payload.askRefused).toBe(true);
      expect(m.payload.askRetry).toBeUndefined();
    }
    const users = (await h.store.chat.all()).filter((m) => m.role === 'user');
    expect(users).toHaveLength(2);
    for (const u of users) expect(u.payload.counts).toBeUndefined();
  });
});

// ---------------------------------------------------------------- KC5.2 · the pack has only the new values
describe('KC5.2 · the pack has only the new values', () => {
  it('KC5.2 · the pack has only the new values: a piece corrected to Black work boots reads that way everywhere', async () => {
    const check = {
      id: 'FC-1', createdAt: at('09:00'), dayKey: '2026-10-22', photoFile: null, thumbFile: null, demoPhotoId: null, imageHash: 'h', occasion: 'everyday', style: null,
      status: 'scored', isPartial: false, notRated: [], score: 7, rawScore: 7, subscores: {}, occasionAdj: 0, rulesFired: [], credits: [], advice: [], fixes: [],
      explanation: null, rubricVersion: 'v5', isFavorite: false, snapState: 'none', recheckUsed: false, isFirstCheck: false, readingId: null, parentId: null,
      itemIds: ['tee', 'jeans', 'boots'], details: {},
    } as unknown as FitCheckRow;
    const boots = rowOf('boots', { confirmedFields: ['color_family'] });
    expect(boots.name).toBe('Black work boots');
    const { snap } = await load([rowOf('tee'), rowOf('jeans'), boots], [], async (s) => void (await s.fitChecks.put(check)));
    const text = buildStylistContext(snap, 'What goes with my boots?').text;
    const closetLine = text.split('\n').find((l) => /^P\d+ · Black work boots/.test(l));
    expect(closetLine).toBeDefined();
    expect(closetLine).toContain('black');
    const piecesLine = text.split('\n').find((l) => l.trim().startsWith('Pieces:'));
    expect(piecesLine).toMatch(/P\d+ Black work boots/);
    expect(text).not.toMatch(/dark brown/i);
    expect(text).not.toMatch(/Dark brown work boots/i);
  });
});

// ---------------------------------------------------------------- KC6.1 · the live switches
describe('KC6.1 · app map', () => {
  const live = (): AppSwitches => ({ outfits: outfitsOn(), share: SHARE_CARD_BUILT, paywall: paywallOn(), accounts: settingsAccountOn() || accountsOn(), notifications: notificationsOn() });
  const mapOf = (prompt: string) => /<appmap>\n?([\s\S]*?)\n?<\/appmap>/.exec(prompt)?.[1] ?? null;

  it('KC6.1 · app map: through createPrepare the prompt holds the map for the switches as they are at that moment', async () => {
    const { store, clock } = await load(THURSDAY_ROWS);
    const prepare = createPrepare({ store, clock, ids: counterIds() });
    const base = await prepare('What goes with my olive sweater?');
    expect(mapOf(base.prompt!.system)).toBe(appMap(live()));
    expect(live().outfits).toBe(false);
    setDemoOutfits(true);
    const withOutfits = await prepare('What goes with my olive sweater?');
    expect(live().outfits).toBe(true);
    expect(mapOf(withOutfits.prompt!.system)).toBe(appMap(live()));
    expect(mapOf(withOutfits.prompt!.system)).not.toBe(mapOf(base.prompt!.system));
    expect(mapOf(withOutfits.prompt!.system)).toMatch(/Outfits/);
    setDemoOutfits(false);
    setDemoAccounts('ok');
    const withAccounts = await prepare('What goes with my olive sweater?');
    expect(live().accounts).toBe(true);
    expect(mapOf(withAccounts.prompt!.system)).toBe(appMap(live()));
    setDemoAccounts(null);
    setDemoNotify('allow');
    const withNotify = await prepare('What goes with my olive sweater?');
    expect(live().notifications).toBe(true);
    expect(mapOf(withNotify.prompt!.system)).toBe(appMap(live()));
    setDemoNotify(null);
    const again = await prepare('What goes with my olive sweater?');
    expect(mapOf(again.prompt!.system)).toBe(mapOf(base.prompt!.system));
  });

  it('KC6.1 · app map: the second call after a lookup holds the same map', async () => {
    const { store, clock } = await load(THURSDAY_ROWS);
    setDemoOutfits(true);
    const prepared = await createPrepare({ store, clock, ids: counterIds() })('What goes with my olive sweater?');
    const next = await prepared.lookup!({ lookup: 'buy_next' });
    expect(next).not.toBeNull();
    expect(mapOf(next!.prompt!.system)).toBe(appMap(live()));
    expect(mapOf(next!.prompt!.system)).toMatch(/Outfits/);
  });
});

// ---------------------------------------------------------------- KC6.3 · today's cards
describe('KC6.3 · today\'s cards', () => {
  const HEADING = "Cards you showed him today (he can still see them; never contradict them or say they're missing):";
  const fields = (name: string) => ({ name, slot: 'shoes', garment: G('footwear', 'work_boot', 'black'), hex: '#1E2026', confirmedFields: ['color_family'] });
  const BOOTS_BLACK = piece('work_boot', 'black', 'Black work boots');
  const OXFORD = 'oxford_shirt';

  const cards: readonly (readonly [string, unknown, string])[] = [
    ['outfit', outfitCard(['oliveSweater', 'jeans'], { needs: [BOOTS_BLACK] }), "- Outfit for everyday: Olive sweater, Dark jeans; he'd need: Black work boots"],
    ['example outfit', outfitCard([], { example: true, needs: [piece('overshirt', 'navy', 'Navy overshirt'), piece('joggers', 'grey', 'Grey joggers'), piece('white_leather_sneaker', 'white', 'White leather sneakers')] }),
      '- Example outfit for everyday (none of it his): Navy overshirt, Grey joggers, White leather sneakers'],
    ['options', { type: 'options', slot: 'outer', options: [{ itemId: 'bomber' }, { piece: piece('denim_jacket', 'light_blue', 'Light blue denim jacket') }] },
      "- Options for outerwear: Tan bomber (his), Light blue denim jacket (he'd need)"],
    ['colors about a piece', { type: 'colors', about: 'piece', kind: OXFORD, families: ['off_white_cream', 'light_blue'] }, `- Colors for the ${kindNoun(OXFORD)}: Off-white, Light blue`],
    ['colors in general', { type: 'colors', about: 'general', goesWith: 'olive', families: ['off_white_cream', 'tan_camel', 'brown'] }, '- Colors that go with olive: Off-white, Tan, Brown'],
    ['buy', { type: 'buy', starterId: 's07', gain: null }, '- Next buy: olive overshirt'],
    ['add asked', { type: 'add', piece: piece(OXFORD, 'off_white_cream', 'Cream striped button-up'), outcome: 'asked', itemId: null }, '- Add card: Cream striped button-up (asked)'],
    ['add added', { type: 'add', piece: piece(OXFORD, 'off_white_cream', 'Cream striped button-up'), outcome: 'added', itemId: 'x' }, '- Add card: Cream striped button-up (added to his closet)'],
    ['add declined', { type: 'add', piece: piece(OXFORD, 'off_white_cream', 'Cream striped button-up'), outcome: 'declined', itemId: null }, '- Add card: Cream striped button-up (he said no thanks)'],
    ['changed', { type: 'changed', itemId: 'boots', before: fields('Dark brown work boots'), after: fields('Black work boots') }, '- Changed piece: Black work boots (was Dark brown work boots)'],
    ['changed undone', { type: 'changed', itemId: 'boots', before: fields('Dark brown work boots'), after: fields('Black work boots'), undone: true }, '- Changed piece: Black work boots (change undone)'],
  ];

  it.each(cards)('KC6.3 · today\'s cards: %s', async (_label, card, line) => {
    const { snap } = await load(THURSDAY_ROWS, [chatRow('K1', at('10:00'), card)]);
    expect(shownCardLines(snap)).toEqual([line]);
  });

  it('KC6.3 · today\'s cards: oldest first, in the order shown, and a check, ask, link or correct card gives no line', async () => {
    const chat = [
      chatRow('K3', at('11:00'), { type: 'buy', starterId: 's07', gain: null }),
      chatRow('K1', at('09:00'), outfitCard(['oliveSweater', 'jeans'], { needs: [BOOTS_BLACK] })),
      chatRow('K2', at('10:00'), { type: 'check', occasion: 'interview' }),
      chatRow('K2b', at('10:10'), { type: 'ask', question: 'Is it a suit-and-tie office?', options: ['Yes', 'Not sure'] }),
      chatRow('K2c', at('10:20'), { type: 'link', itemId: 'tee' }),
      chatRow('K2d', at('10:30'), { type: 'correct', checkId: 'FC-1' }),
    ];
    const { snap } = await load(THURSDAY_ROWS, chat);
    expect(shownCardLines(snap)).toEqual(["- Outfit for everyday: Olive sweater, Dark jeans; he'd need: Black work boots", '- Next buy: olive overshirt']);
  });

  it('KC6.3 · today\'s cards: current names, a removed piece left out, no handles, a corrupt card skipped, only stylist rows', async () => {
    const rows = [rowOf('tee'), rowOf('oliveSweater', { name: 'Moss sweater' }), rowOf('jeans', { isDeleted: true }), rowOf('boots')];
    const chat = [
      chatRow('K1', at('09:00'), outfitCard(['oliveSweater', 'jeans', 'boots'])),
      chatRow('K2', at('09:30'), { type: 'outfit' }),
      chatRow('K3', at('09:40'), 'junk'),
      chatRow('K4', at('09:50'), { type: 'buy', starterId: 'nope', gain: null }),
      chatRow('K5', at('10:00'), { type: 'buy', starterId: 's07', gain: null }, 'user'),
    ];
    const { snap } = await load(rows, chat);
    const lines = shownCardLines(snap);
    expect(lines).toEqual(['- Outfit for everyday: Moss sweater, Black work boots']);
    for (const l of lines) expect(l).not.toMatch(/\b(?:P|FC)\d+\b/);
  });

  it('KC6.3 · today\'s cards: the 4 am day, only today\'s and not yesterday\'s', async () => {
    const buy = (g: string) => ({ type: 'colors', about: 'general', goesWith: g, families: ['white', 'black'] });
    const chat = [
      chatRow('Y1', at('15:00', '2026-10-21'), buy('yesterday')),
      chatRow('Y2', at('03:30'), buy('before4am')),
      chatRow('T1', at('04:30'), buy('after4am')),
    ];
    const { snap } = await load(THURSDAY_ROWS, chat);
    expect(shownCardLines(snap)).toEqual(['- Colors that go with after4am: White, Black']);
  });

  it('KC6.3 · today\'s cards: only the newest 8, each line at most 200 characters, none when there are no cards', async () => {
    const chat = Array.from({ length: 10 }, (_, i) => chatRow(`C${i}`, at(`${String(5 + i).padStart(2, '0')}:00`), { type: 'colors', about: 'general', goesWith: `c${i + 1}`, families: ['white', 'black'] }));
    const { snap } = await load(THURSDAY_ROWS, chat);
    expect(shownCardLines(snap)).toEqual(Array.from({ length: 8 }, (_, i) => `- Colors that go with c${i + 3}: White, Black`));
    const long = piece('overshirt', 'navy', `Navy ${'overshirt '.repeat(12)}`.trim());
    const { snap: s2 } = await load(THURSDAY_ROWS, [chatRow('L1', at('09:00'), outfitCard([], { example: true, needs: [long, long, long, long] }))]);
    const lines = shownCardLines(s2);
    expect(lines).toHaveLength(1);
    expect(lines[0]!.length).toBeLessThanOrEqual(200);
    const { snap: none } = await load(THURSDAY_ROWS, []);
    expect(shownCardLines(none)).toEqual([]);
  });

  it('KC6.3 · today\'s cards: the pack holds the heading once, before his question, and is unchanged without cards', async () => {
    const chat = [
      { ...chatRow('U1', at('11:00'), undefined, 'user'), text: 'What goes with my boots?', payload: {} },
      { ...chatRow('S1', at('11:01'), undefined), text: 'The dark jeans.', payload: {} },
    ] as ChatMessage[];
    const { snap } = await load(THURSDAY_ROWS, chat);
    const q = 'What should I buy next?';
    const base = buildStylistContext(snap, q);
    const lines = ['- Next buy: olive overshirt', '- Colors that go with olive: White, Black'];
    const withCards = buildStylistContext(snap, q, { shownCards: lines });
    const all = withCards.text.split('\n');
    const i = all.indexOf(HEADING);
    expect(i).toBeGreaterThan(all.indexOf("Today's chat so far:"));
    expect(all.filter((l) => l === HEADING)).toHaveLength(1);
    expect(all.slice(i + 1, i + 3)).toEqual(lines);
    expect(i).toBeLessThan(all.findIndex((l) => l.startsWith('His question:')));
    expect(all.slice(i + 3).filter((l) => l !== '')).toEqual([`His question: ${q}`]);
    // everything else is as it was
    const rest = all.filter((l) => l !== HEADING && !lines.includes(l) && l !== '');
    expect(rest).toEqual(base.text.split('\n').filter((l) => l !== ''));
    expect(withCards.handles).toEqual(base.handles);
    expect(withCards.meta.pieces).toBe(base.meta.pieces);
    // none or empty: exactly as before, no heading
    expect(buildStylistContext(snap, q, { shownCards: [] }).text).toBe(base.text);
    expect(buildStylistContext(snap, q, {}).text).toBe(base.text);
    expect(base.text).not.toContain('Cards you showed him');
  });

  it('KC6.3 · today\'s cards: through createPrepare the prompt holds the Next buy line, and deleting today\'s chat removes it', async () => {
    const chat = [chatRow('K1', at('10:00'), { type: 'buy', starterId: 's07', gain: null })];
    const { store, clock } = await load(THURSDAY_ROWS, chat);
    const prepare = createPrepare({ store, clock, ids: counterIds() });
    const prepared = await prepare('What goes with my olive sweater?');
    const user = prepared.prompt!.user;
    expect(user).toContain('- Next buy: olive overshirt');
    expect(user.split(HEADING)).toHaveLength(2);
    expect(user.indexOf(HEADING)).toBeLessThan(user.indexOf('- Next buy: olive overshirt'));
    expect(user.indexOf('- Next buy: olive overshirt')).toBeLessThan(user.indexOf('His question:'));
    await store.chat.delete('K1');
    const gone = await prepare('What goes with my olive sweater?');
    expect(gone.prompt!.user).not.toContain('Cards you showed him');
    expect(gone.prompt!.user).not.toContain('Next buy');
  });
});

// ---------------------------------------------------------------- KC8.1 · allowed prices through prepare
describe('KC8.1 · price', () => {
  it('KC8.1 · price: through createPrepare the allowed amounts are those in the pack and the evidence', async () => {
    const profile = {
      id: 'me', birthYear: 2003, heightCm: null, build: '', fitPreference: 'regular', styles: [], boldness: null, budget: '60_100', lastOccasion: 'everyday',
      consentVersion: null, consentAt: null, onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: 1,
    } as unknown as ProfileRow;
    const { store, clock } = await load(THURSDAY_ROWS, [], async (s) => void (await s.profile.put(profile)));
    const prepared = await createPrepare({ store, clock, ids: counterIds() })('What should I buy next?');
    const user = prepared.prompt!.user;
    const want = new Set<string>();
    const re = /\$(\d+)(?:\s*[–-]\s*\$?(\d+))?/g;
    for (let m = re.exec(user); m; m = re.exec(user)) {
      want.add(m[1]!);
      if (m[2]) want.add(m[2]);
    }
    expect(user).toMatch(/Budget: [^\n]*\$60/);
    expect(want.has('60')).toBe(true);
    expect(want.has('100')).toBe(true);
    expect(prepared.gate.allowedPrices).toEqual(want);
    // the evidence's Starter ranges are in it too
    expect(want.size).toBeGreaterThan(2);
  });
});

// T106 · the add card's logic (specs/kit-stylist-chat.md KC4.1–KC4.9, KC2.10): a mention shows the card and writes
// nothing; "add it" writes before Kit answers; Add / No thanks / Undo / I have one go through the closet service; the
// model can no longer save a closet piece silently; Kit never denies it.
import { createMemoryStore } from '@/data/memoryStore';
import type { ChatMessage } from '@/data/types';
import { createCardActions } from '@/features/ask/cardActions';
import { cardPiece, type AskCard } from '@/features/ask/cards';
import { liveAnswer } from '@/features/ask/live';
import { parseRemember } from '@/features/ask/memory';
import { createAsk } from '@/features/ask/pipeline';
import { createPrepare } from '@/features/ask/prepare';
import { readAdd } from '@/features/ask/router';
import type { AnswerEvent, AnswerSource } from '@/features/ask/source';
import { addChatPiece, ownedSame } from '@/features/closet/chatAdd';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { createQuota } from '@/services/quota';

const NOW = Date.parse('2026-10-22T12:30:00-04:00');
const HIS_MESSAGE = "I'm also wearing an oversized Uniqlo tee on top. Can you add that to my closet?";

/** A source that plays the same words and closing block every time, and records what it was sent. */
function scripted(words: string, done: Partial<Extract<AnswerEvent, { type: 'done' }>> = {}) {
  const sent: { system: string; user: string }[] = [];
  const source: AnswerSource = {
    name: 'script',
    async *answer(req) {
      if (req.prompt) sent.push(req.prompt);
      yield { type: 'delta', text: words };
      yield { type: 'done', ...done };
    },
  };
  return { source, sent };
}

async function setup(words = 'Nice, that goes with your jeans.', done: Partial<Extract<AnswerEvent, { type: 'done' }>> = {}, src?: AnswerSource) {
  const store = createMemoryStore();
  const clock = manualClock(NOW);
  const ids = counterIds();
  const quota = createQuota({ store, clock, isPro: () => true });
  const s = scripted(words, done);
  const ask = createAsk({
    store, quota, clock, ids, source: () => src ?? s.source, consent: async () => true, openConsent: () => {}, tryPro: () => false,
    prepare: createPrepare({ store, clock, ids }), log: (e) => { if (process.env.DBG) console.log(e); },
  });
  const actions = createCardActions({ store, clock, ids });
  const thread = async () => (await store.chat.all()).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  const answerOf = async (): Promise<ChatMessage> => (await thread()).filter((m) => m.role === 'stylist').pop()!;
  const cardOf = async () => (await answerOf()).payload.askCard as AskCard | undefined;
  const fromChat = async () => (await store.closet.all()).filter((c) => c.source === 'chat' && !c.isDeleted);
  const say = async (text: string) => {
    const o = await ask.ask(text);
    if (o.kind === 'sent') await o.done;
    return o;
  };
  return { store, clock, ids, ask, actions, sent: s.sent, thread, answerOf, cardOf, fromChat, say, quota };
}

beforeEach(() => liveAnswer.clear());

describe('reading what he says (KC4.1, KC4.5)', () => {
  it('his exact message is an ask for a tee, with no color', () => {
    expect(readAdd(HIS_MESSAGE)).toEqual({ mode: 'ask', kind: 'tee', color: null });
  });
  it.each([
    ['I have a white tee', { mode: 'mention', kind: 'tee', color: 'white' }],
    ['I bought black chelsea boots yesterday', { mode: 'mention', kind: 'chelsea_boot', color: 'black' }],
    ['Add it', { mode: 'ask', kind: null, color: null }],
    ['can you add my olive overshirt to my closet', { mode: 'ask', kind: 'overshirt', color: 'olive' }],
  ])('%s', (q, want) => {
    expect(readAdd(q)).toEqual(want);
  });
  it.each(['I have an interview on Friday', "don't add it", 'what goes with the black jeans I have?', 'should I add that tee to my closet'])('%s is neither', (q) => {
    expect(readAdd(q)).toBeNull();
  });
});

describe('KC4.2 · a mention shows the add card and writes nothing; KC4.6 Kit says nothing about adding', () => {
  it('"I have a white tee"', async () => {
    const t = await setup();
    const before = (await t.store.closet.all()).length;
    await t.say('I have a white tee');
    expect(await t.cardOf()).toEqual({ type: 'add', piece: { kind: 'tee', color: 'white', name: 'White tee' }, outcome: 'asked', itemId: null });
    expect((await t.store.closet.all()).length).toBe(before);
    expect(await t.store.facts.all().then((f) => f.filter((x) => x.key === 'owns_unphotographed'))).toEqual([]);
    expect(t.sent[0]!.user).toMatch(/is showing him a card that asks whether to add it/);
  });
  it('the model cannot save a closet piece any more: owns_unphotographed is dropped, nothing is written, no saved line', async () => {
    expect(parseRemember({ key: 'owns_unphotographed', value: 'grey hoodie' })).toBeNull();
    const t = await setup('That works with straight jeans.', { remember: { key: 'owns_unphotographed', value: 'black tee' } });
    await t.say('what is a good color for fall');
    expect(await t.fromChat()).toEqual([]);
    expect((await t.answerOf()).payload.savedFact).toBeUndefined();
  });
});

describe('KC4.1 / KC4.4 / KC4.8 · when there is no card', () => {
  it('he already owns that kind and color: no card, Kit is told the closet name', async () => {
    const t = await setup();
    await addChatPiece(t, cardPiece('tee', 'black')!);
    await t.say('I have a black tee');
    expect(await t.cardOf()).toBeUndefined();
    expect(t.sent[0]!.user).toMatch(/already has Black tee/);
  });
  it('offered once a chat day (KC4.8)', async () => {
    const t = await setup();
    await t.say('I have a white tee');
    expect((await t.cardOf())?.type).toBe('add');
    await t.say('I have a white tee, as I said');
    expect(await t.cardOf()).toBeUndefined();
  });
  it('No thanks: never offered again, but "add it" still adds (KC4.4)', async () => {
    const t = await setup();
    await t.say('I have a white tee');
    const m = await t.answerOf();
    expect(await t.actions.decline(m)).toBe(true);
    expect(((await t.cardOf()) as { outcome: string }).outcome).toBe('declined');
    expect(await t.fromChat()).toEqual([]);
    t.clock.advance(3 * 24 * 3600 * 1000);
    await t.say('I got a white tee');
    expect(await t.cardOf()).toBeUndefined();
    await t.say('add my white tee to my closet');
    expect(((await t.cardOf()) as { outcome: string }).outcome).toBe('added');
    expect((await t.fromChat()).map((c) => c.name)).toEqual(['White tee']);
  });
  it('a piece with no color or kind in a plain mention shows no card (nothing is guessed)', async () => {
    const t = await setup();
    await t.say('I have a tee');
    expect(await t.cardOf()).toBeUndefined();
    await t.say('I have a thing for loud shirts');
    expect(await t.cardOf()).toBeUndefined();
  });
});

describe('KC4.3 · Add, then Undo, through the closet service', () => {
  it('Add writes one piece (chat, not photographed, its color his word); Undo removes it and the card asks again', async () => {
    const t = await setup();
    await t.say('I have black work boots');
    const m = await t.answerOf();
    expect(await t.actions.add(m)).toBe(true);
    expect(await t.actions.add(m)).toBe(false); // a double tap adds once
    const [piece] = await t.fromChat();
    expect(piece).toMatchObject({ name: 'Black work boots', slot: 'shoes', source: 'chat', isPhotographed: false });
    expect(piece!.garment).toMatchObject({ subcategory: 'work_boot', color_family: 'black' });
    expect(piece!.confirmedFields).toContain('color_family');
    expect(((await t.cardOf()) as { outcome: string; itemId: string }).itemId).toBe(piece!.id);
    expect(await t.actions.undo(m)).toBe(true);
    expect(await t.fromChat()).toEqual([]);
    expect(((await t.cardOf()) as { outcome: string }).outcome).toBe('asked');
  });
  it('KC4.9: Add, No thanks and Undo never use a question', async () => {
    const t = await setup();
    await t.say('I have black work boots');
    const used = (await t.quota.snapshot()).questionsUsed;
    const m = await t.answerOf();
    await t.actions.add(m);
    await t.actions.undo(m);
    await t.actions.decline(m);
    expect((await t.quota.snapshot()).questionsUsed).toBe(used);
  });
});

describe('KC4.5 · he asks to add it: written before Kit answers, Kit says so, the card is Added · Undo', () => {
  it('"can you add my olive overshirt to my closet"', async () => {
    const t = await setup('Done, the Olive overshirt is in your closet. It works with your jeans.');
    await t.say('can you add my olive overshirt to my closet');
    const [piece] = await t.fromChat();
    expect(piece).toMatchObject({ name: 'Olive overshirt', isPhotographed: false });
    expect(await t.cardOf()).toMatchObject({ type: 'add', outcome: 'added', itemId: piece!.id });
    expect((await t.answerOf()).text).toMatch(/in your closet/);
    expect(t.sent[0]!.user).toMatch(/just added Olive overshirt/);
    expect(t.sent[0]!.user).not.toMatch(/Question: .*Uniqlo/);
  });
  it('Kit saying it was added when the code did not add it is still dropped (KC4.6)', async () => {
    const t = await setup("I've added a white tee to your closet. Nice pick.");
    await t.say('what should I wear tonight');
    expect((await t.answerOf()).text).not.toMatch(/added/);
  });
  it('the answer failing takes the piece back, and Retry adds it once (no double add)', async () => {
    const t = await setup('', {}, { name: 'down', async *answer() { yield { type: 'failed', code: 'offline' }; } });
    await t.say('add my white tee to my closet');
    expect(await t.fromChat()).toEqual([]);
    const m = await t.answerOf();
    expect(m.payload.askRetry).toBeTruthy();
  });
  it('already in his closet: nothing is added twice', async () => {
    const t = await setup();
    await addChatPiece(t, cardPiece('tee', 'white')!);
    await t.say('add my white tee to my closet');
    expect(await t.fromChat()).toHaveLength(1);
    expect(t.sent[0]!.user).toMatch(/already has White tee/);
  });
});

describe('the founder\'s Nov 19 message, replayed', () => {
  it('Kit never says it can\'t; no silent piece; the color is asked, his tap adds it, no question used', async () => {
    const t = await setup("I can't add pieces from chat, but the app can add that tee from the closet screen. It layers well.", { remember: { key: 'owns_unphotographed', value: 'oversized tee' } });
    const before = (await t.store.closet.all()).length;
    await t.say(HIS_MESSAGE);
    // The words that denied it are gone, nothing was saved from the model's block, and the closet has not changed yet.
    expect((await t.answerOf()).text).not.toMatch(/can't add|can not add|cannot add/i);
    expect((await t.answerOf()).payload.savedFact).toBeUndefined();
    expect((await t.store.closet.all()).length).toBe(before);
    // The color is not guessed: a tap question with colors.
    const q = (await t.cardOf()) as Extract<AskCard, { type: 'ask' }>;
    expect(q.type).toBe('ask');
    expect(q.options.slice(0, 4)).toEqual(['Black', 'White', 'Grey', 'Navy']);
    const used = (await t.quota.snapshot()).questionsUsed;
    const o = await t.ask.tap((await t.answerOf()).id, 'Grey');
    if (o.kind === 'sent') await o.done;
    expect((await t.fromChat()).map((c) => c.name)).toEqual(['Grey tee']);
    expect(await t.cardOf()).toMatchObject({ type: 'add', outcome: 'added' });
    expect((await t.quota.snapshot()).questionsUsed).toBe(used);
  });
  it('"Not sure" adds nothing', async () => {
    const t = await setup('Here is what goes with it.');
    await t.say(HIS_MESSAGE);
    const o = await t.ask.tap((await t.answerOf()).id, 'Not sure');
    if (o.kind === 'sent') await o.done;
    expect(await t.fromChat()).toEqual([]);
  });
});

describe('KC4.7 · the kind is unclear: a tap question, never a card or a guess', () => {
  it('"add it" with nothing offered asks the kind; the tap and a color finish it', async () => {
    const t = await setup('That one pairs well with straight jeans.');
    await t.say('add it');
    const q = (await t.cardOf()) as Extract<AskCard, { type: 'ask' }>;
    expect(q.type).toBe('ask');
    expect(q.options.length).toBeGreaterThanOrEqual(3);
    expect(q.options.length).toBeLessThanOrEqual(5); // 2–4 kinds and "Not sure"
    expect(await t.fromChat()).toEqual([]);
  });
  it('"add that top in black" narrows the kinds to tops', async () => {
    const t = await setup('That one pairs well with straight jeans.');
    await t.say('add that top in black to my closet');
    const q = (await t.cardOf()) as Extract<AskCard, { type: 'ask' }>;
    expect(q.options.slice(0, 4)).toEqual(['Tee', 'Sweater', 'Hoodie', 'Overshirt']);
    const o = await t.ask.tap((await t.answerOf()).id, 'Hoodie');
    if (o.kind === 'sent') await o.done;
    expect((await t.fromChat()).map((c) => c.name)).toEqual(['Black hoodie']);
  });
  it('"add it" right after a mention adds the piece Kit just offered', async () => {
    const t = await setup('That pairs well with straight jeans.');
    await t.say('I have a white tee');
    await t.say('add it');
    expect((await t.fromChat()).map((c) => c.name)).toEqual(['White tee']);
  });
});

describe('KC2.10 · I have one', () => {
  it('adds the drawn piece as Add does, with an Undo toast', async () => {
    const store = createMemoryStore();
    const clock = manualClock(NOW);
    const ids = counterIds();
    let undo: (() => void | Promise<void>) | null = null;
    const a = createCardActions({ store, clock, ids, toast: (_t, u) => { undo = u; } });
    const piece = cardPiece('overshirt', 'olive')!;
    expect(await a.haveOne({} as ChatMessage, piece)).toBe(true);
    const all = await store.closet.all();
    expect(ownedSame(all, piece)).toMatchObject({ name: 'Olive overshirt', source: 'chat', isPhotographed: false });
    await undo!();
    expect(ownedSame(await store.closet.all(), piece)).toBeNull();
  });
});

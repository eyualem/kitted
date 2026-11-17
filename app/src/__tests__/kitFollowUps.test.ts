// T102 · KC1.3: follow-up taps are 0 to 3, checked by code, stored on the answer, shown under the latest answer only.
// Written before the code (tasks/T102/TESTING.md). The model is a script; nothing is sent anywhere.
import { createClosingSplitter, EMPTY_BLOCK, parseClosing } from '@/features/ask/closing';
import { checkFollowUps } from '@/features/ask/cards';
import { checkSentence } from '@/features/ask/gate';
import { isBodyRating } from '@/features/ask/guards';
import { ASK_MODEL, createAskGemini, type AskGeminiOptions } from '@/features/ask/gemini';
import { liveAnswer } from '@/features/ask/live';
import { latestFollowUps } from '@/features/ask/pipeline';
import { createAskAnthropic, createAskOpenAI } from '@/features/ask/providers';
import type { AnswerEvent, AnswerSource } from '@/features/ask/source';
import type { ChatMessage } from '@/data/types';
import { GATE, harness, NOW, rowOf, says } from '@/testing/kitCardsHelpers';

beforeEach(() => liveAnswer.clear());

const check = (raw: unknown, question = 'What goes with my jeans?') => checkFollowUps(raw, { question, gate: GATE });

// ================================================================ checkFollowUps
describe('KC1.3 · the checker keeps at most 3 taps, in order', () => {
  it('KC1.3 · of four taps the first three stay, in order', () => {
    expect(check(['Make it dressier', 'Show me jackets', 'What color shirt?', 'Add a watch'])).toEqual(['Make it dressier', 'Show me jackets', 'What color shirt?']);
  });

  it('KC1.3 · the three kept are the first three that pass, not the first three asked for', () => {
    expect(check(['Make it Dressier', 'Show me jackets', 'What color shirt?', 'Add a watch', 'Which is most versatile?'])).toEqual(['Show me jackets', 'What color shirt?', 'Add a watch']);
  });

  it('KC1.3 · "What should I buy first?", "I\'d go darker" and "Which is most versatile?" are kept', () => {
    const keep = ['What should I buy first?', "I'd go darker", 'Which is most versatile?'];
    for (const k of keep) expect(checkSentence(k, GATE)).toBeNull(); // the gate has no quarrel with them
    expect(check(keep)).toEqual(keep);
  });

  it.each([
    ['not sentence case (Dressier)', 'Make it Dressier'],
    ['not sentence case (Show Me Jackets)', 'Show Me Jackets'],
    ['all capitals', 'MAKE IT WARMER'],
    ['an emoji', 'Make it dressier 🔥'],
    ['over 30 characters', 'What should I wear to class tomorrow and next week?'],
    ['a brand', 'Try Nike'],
    ['starts in lower case', 'make it dressier'],
    ['empty', ''],
    ['only spaces', '   '],
  ])('KC1.3 · dropped: %s', (_label, bad) => {
    expect(check([bad])).toEqual([]);
    expect(check([bad, 'What should I buy first?'])).toEqual(['What should I buy first?']);
  });

  it('KC1.3 · exactly 30 characters passes, 31 fails', () => {
    const s30 = 'Show me something a bit warmer';
    const s31 = 'Show me something a bit warmer?';
    expect([s30.length, s31.length]).toEqual([30, 31]);
    expect(check([s30])).toEqual([s30]);
    expect(check([s31])).toEqual([]);
  });

  it('KC1.3 · a tap that repeats his question is dropped, whatever the case and punctuation', () => {
    expect(check(['Show me jackets'], 'Show me jackets')).toEqual([]);
    expect(check(['Show me jackets'], 'show me jackets!')).toEqual([]);
    expect(check(['Show me jackets', 'Make it dressier'], 'show me jackets!')).toEqual(['Make it dressier']);
    expect(check(['Show me jackets'], 'What goes with my jeans?')).toEqual(['Show me jackets']);
  });

  // Hard line (CLAUDE.md): never rate faces or bodies. A tap is sent as his message, so a tap that asks Kit to rate
  // his body would invite exactly that. The guard `isBodyRating` (ask/guards.ts) already knows these first-person forms.
  it.each([
    ['Rate my body'],
    ['Do I look fat?'],
    ['Am I too skinny?'],
    ['Is my build ok?'],
  ])('KC1.3 · dropped: a first-person body phrasing (%s)', (bad) => {
    expect(isBodyRating(bad)).toBe(true); // the guard's own verdict, so this test is about the follow-up check using it
    expect(checkSentence(bad, GATE)).toBeNull(); // ... and not about the sentence gate, which has no quarrel with it
    expect(check([bad])).toEqual([]);
    expect(check([bad, 'What should I buy first?'])).toEqual(['What should I buy first?']);
    expect(check(['Show me jackets', bad, 'Add a watch'])).toEqual(['Show me jackets', 'Add a watch']);
  });

  // Round 2 (verifier): a one-word all-capitals tap is dropped by the all-caps rule alone (the capital-word check
  // only sees words after the first one).
  it.each([['WARMER'], ['DRESSIER'], ['OK']])('KC1.3 · dropped: a one-word tap in all capitals (%s)', (bad) => {
    expect(check([bad])).toEqual([]);
    expect(check([bad, 'What should I buy first?'])).toEqual(['What should I buy first?']);
    expect(check(['Warmer'])).toEqual(['Warmer']); // control: the same word in sentence case stays
  });

  // Round 2 (verifier): emoji outside the common ranges (the watch and hourglass sit in U+2300 to 23FF). The gate's own
  // EMOJI pattern misses them, so the follow-up check must be stricter than the gate.
  it.each([
    ['Add a watch \u231A', 'Add a watch'],
    ['Add a watch \u231A\uFE0F', 'Add a watch'],
    ['Hourglass \u23F3', 'Hourglass'],
    ['Hourglass \u23F3\uFE0F', 'Hourglass'],
    ['\u231A Add a watch', 'Add a watch'],
    ['Alarm \u23F0 clock', 'Alarm clock'],
  ])('KC1.3 · dropped: an emoji outside the common ranges (%s)', (bad, plain) => {
    expect(check([bad])).toEqual([]);
    expect(check([bad, 'What should I buy first?'])).toEqual(['What should I buy first?']);
    expect(check(['Show me jackets', bad, 'Make it dressier'])).toEqual(['Show me jackets', 'Make it dressier']);
    expect(check([plain])).toEqual([plain]); // control: the same words without the emoji stay
  });

  // Round 2 (verifier): first-person body taps beyond isBodyRating. The follow-up check is stricter than the typed-message
  // guard, because taps come only from the model and a dropped tap costs little.
  it.each([
    ['Do I look old?'],
    ['Is my stomach ok?'],
    ['Do you like my face?'],
    ['Am I too tall?'],
    ['Am I too thin?'],
    ['Is my belly big?'],
    ['Do my legs look ok?'],
    ['Do my arms look big?'],
    ['Do my thighs look big?'],
    ['Is my waist too big?'],
    ['Is my chest flat?'],
    ['Is my face round?'],
    ['Do I look bulky?'],
    ['Does my weight show?'],
    ['How is my body?'],
    ['Would this hide my belly?'],
    ['Hide my stomach?'],
    ['Cover my gut?'],
    ['Make me look thinner'],
    ['Does it make me look fat?'],
  ])('KC1.3 · dropped: a wider first-person body tap (%s)', (bad) => {
    expect(check([bad])).toEqual([]);
    expect(check([bad, 'What should I buy first?'])).toEqual(['What should I buy first?']);
    expect(check(['Show me jackets', bad, 'Add a watch'])).toEqual(['Show me jackets', 'Add a watch']);
  });

  it.each([
    ['Make it dressier'],
    ['Try a darker color'],
    ['Which is most versatile?'],
    ['What goes with my jeans?'],
    ['Show me my boots'],
    ['Do these fit my style?'],
    ['Is this warm enough?'],
  ])('KC1.3 · kept: a clothes tap the body check must not over-block (%s)', (good) => {
    expect(check([good], 'Anything else?')).toEqual([good]);
    expect(check(['Make it warmer', good], 'Anything else?')).toEqual(['Make it warmer', good]);
  });

  it('KC1.3 · a one-word tap that is his one-word question is dropped, a different one-word tap stays', () => {
    expect(check(['Dressier'], 'Dressier?')).toEqual([]);
    expect(check(['Dressier', 'Warmer'], 'Dressier?')).toEqual(['Warmer']);
    expect(check(['Warmer'], 'Dressier?')).toEqual(['Warmer']);
  });

  it('KC1.3 · a duplicate of an earlier tap in the list is dropped', () => {
    expect(check(['Make it dressier', 'Make it dressier', 'Show me jackets'])).toEqual(['Make it dressier', 'Show me jackets']);
  });

  it('KC1.3 · taps are trimmed', () => {
    expect(check(['  Make it dressier  '])).toEqual(['Make it dressier']);
  });

  it('KC1.3 · anything that is not an array of strings gives none', () => {
    for (const v of ['Make it dressier', null, undefined, 5, { 0: 'Make it dressier' }, true]) expect(check(v)).toEqual([]);
    expect(check([1, null, {}, ['Make it dressier'], 'Show me jackets'])).toEqual(['Show me jackets']);
    expect(check([])).toEqual([]);
  });
});

// ================================================================ latestFollowUps
describe('KC1.3 · taps show under the latest answer only', () => {
  const TAPS = ['Make it dressier', 'Show me jackets'];
  const base = { kind: 'text', cardType: null, fitCheckId: null, outfitId: null, itemId: null, chips: [] as string[] } as const;
  const user = (id: string, n: number): ChatMessage => ({ ...base, id, createdAt: NOW + n * 1000, role: 'user', text: 'a question', payload: {} });
  const answer = (id: string, n: number, answerTo: string, extra: Record<string, unknown> = {}): ChatMessage => ({
    ...base, id, createdAt: NOW + n * 1000, role: 'stylist', text: 'an answer', payload: { answerTo, ...extra },
  });
  const line = (id: string, n: number, extra: Partial<ChatMessage>, payload: Record<string, unknown> = {}): ChatMessage => ({
    ...base, id, createdAt: NOW + n * 1000, role: 'stylist', text: 'a line', payload, ...extra,
  });

  it('KC1.3 · his question and an answer with taps: the answer\'s taps', () => {
    expect(latestFollowUps([user('q1', 0), answer('a1', 1, 'q1', { followUps: TAPS })])).toEqual({ messageId: 'a1', taps: TAPS });
  });

  it('KC1.3 · once his next message is in the thread there are none', () => {
    expect(latestFollowUps([user('q1', 0), answer('a1', 1, 'q1', { followUps: TAPS }), user('q2', 2)])).toBeNull();
  });

  it('KC1.3 · with two answers only the later answer\'s taps show, never the earlier\'s', () => {
    const later = ['What should I buy first?'];
    const thread = [user('q1', 0), answer('a1', 1, 'q1', { followUps: TAPS }), user('q2', 2), answer('a2', 3, 'q2', { followUps: later })];
    expect(latestFollowUps(thread)).toEqual({ messageId: 'a2', taps: later });
    expect(latestFollowUps([user('q1', 0), answer('a1', 1, 'q1', { followUps: TAPS }), answer('a2', 2, 'q1', { followUps: later })])).toEqual({ messageId: 'a2', taps: later });
  });

  it('KC1.3 · the older answer\'s taps do not show under a newer line that has none', () => {
    const failLine = line('f2', 3, {}, { askRetry: 'q2' });
    expect(latestFollowUps([user('q1', 0), answer('a1', 1, 'q1', { followUps: TAPS }), user('q2', 2), failLine])).toBeNull();
  });

  it.each([
    ['the limit line', (n: number) => line('x', n, { kind: 'card', cardType: 'limit' }, { tryPro: false })],
    ['the support card', (n: number) => line('x', n, { kind: 'card', cardType: 'support' })],
    ['a fail line', (n: number) => line('x', n, {}, { askRetry: 'q1' })],
    ['a decline of the phone', (n: number) => line('x', n, {}, { askRefused: true })],
    ['a decline of the model, even with taps on the row', (n: number) => answer('x', n, 'q1', { askRefused: true, followUps: TAPS })],
    ['an answer with no taps', (n: number) => answer('x', n, 'q1')],
    ['an answer with an empty list', (n: number) => answer('x', n, 'q1', { followUps: [] })],
  ])('KC1.3 · %s after his question gives none', (_label, make) => {
    expect(latestFollowUps([user('q1', 0), make(1)])).toBeNull();
  });

  it('KC1.3 · an empty thread, or only his question, gives none', () => {
    expect(latestFollowUps([])).toBeNull();
    expect(latestFollowUps([user('q1', 0)])).toBeNull();
  });
});

// ================================================================ through the pipeline
describe('KC1.3 · stored on the answer, counted like a typed question', () => {
  const KEYS = ['tee', 'jeans', 'sneakers'];
  const rows = () => KEYS.map((k) => rowOf(k));
  const TAPS4 = ['Make it dressier', 'Show me jackets', 'What color shirt?', 'Add a watch'];
  const thread = async (store: { chat: { all(): Promise<ChatMessage[]> } }) => (await store.chat.all()).sort((a, b) => a.createdAt - b.createdAt);

  it('KC1.3 · the answer row holds the first three taps, in order', async () => {
    const h = await harness(rows(), () => says('Wear the white sneakers.', { followUps: TAPS4 }));
    const m = await h.run('Shoes for tonight?');
    expect(m.payload.followUps).toEqual(['Make it dressier', 'Show me jackets', 'What color shirt?']);
    expect(m.text).toBe('Wear the white sneakers.');
  });

  it('KC1.3 · taps that fail the checks are dropped before they are stored', async () => {
    const h = await harness(rows(), () => says('Wear the white sneakers.', {
      followUps: ['Make it Dressier', 'MAKE IT WARMER', 'Try Nike', 'Shoes for tonight?', 'What should I buy first?'],
    }));
    const m = await h.run('Shoes for tonight?');
    expect(m.payload.followUps).toEqual(['What should I buy first?']); // "Shoes for tonight?" is his own question
  });

  it.each([
    ['not an array', 'Make it dressier'],
    ['null', null],
    ['an empty list', []],
    ['every tap failing the checks', ['Make it Dressier', 'Try Nike']],
  ])('KC1.3 · followUps that is %s: no key on the row', async (_label, followUps) => {
    const h = await harness(rows(), (q) => says('Wear the white sneakers.', q.startsWith('Valid') ? { followUps: ['Make it dressier'] } : { followUps }));
    const m = await h.run('Shoes for tonight?');
    expect('followUps' in m.payload).toBe(false);
    const control = await h.run('Valid question please');
    expect(control.payload.followUps).toEqual(['Make it dressier']);
  });

  it('KC1.3 · a refused model answer is stored with no taps even when the block had them', async () => {
    const h = await harness(rows(), (q) => (q.startsWith('Valid')
      ? says('Wear the white sneakers.', { followUps: ['Make it dressier'] })
      : says('I only help with clothes.', { refused: true, followUps: TAPS4 })));
    const refused = await h.run('What is the capital of France?');
    expect(refused.payload.askRefused).toBe(true);
    expect('followUps' in refused.payload).toBe(false);
    const control = await h.run('Valid question please');
    expect(control.payload.followUps).toEqual(['Make it dressier']);
  });

  it('KC1.3 · a failed answer (offline, or a failure part-way) has no taps', async () => {
    const h = await harness(rows(), (q) => {
      if (q.startsWith('Valid')) return says('Wear the white sneakers.', { followUps: ['Make it dressier'] });
      if (q.startsWith('Partway')) return [{ type: 'delta', text: 'Wear the white' }, { type: 'failed', code: 'stream' }] as AnswerEvent[];
      return [{ type: 'failed', code: 'offline' }] as AnswerEvent[];
    });
    for (const q of ['Offline question', 'Partway question']) {
      const out = await h.ask.ask(q);
      if (out.kind !== 'sent') throw new Error(out.kind);
      const r = await out.done;
      expect(r.kind).toBe('failed');
      const row = (await h.store.chat.get(r.messageId))!;
      expect('followUps' in row.payload).toBe(false);
      h.clock.advance(5_000);
    }
    const control = await h.run('Valid question please');
    expect(control.payload.followUps).toEqual(['Make it dressier']);
  });

  it('KC1.3 · a tap question card (ask) has no taps under it', async () => {
    const h = await harness(rows(), (q) => (q.startsWith('Valid')
      ? says('Wear the white sneakers.', { followUps: ['Make it dressier'] })
      : says('Depends on the office. One quick question first.', {
        card: { type: 'ask', question: 'Is it a suit-and-tie office?', options: ['Yes', 'Business casual'] }, followUps: ['Make it dressier'],
      })));
    const asked = await h.run('What should I wear to work?');
    expect((asked.payload.askCard as { type: string }).type).toBe('ask');
    expect('followUps' in asked.payload).toBe(false);
    const control = await h.run('Valid question please');
    expect(control.payload.followUps).toEqual(['Make it dressier']);
  });

  it('KC1.3 · a follow-up tap is sent as his message: counted once, his bubble counts, never a free tap', async () => {
    const h = await harness(rows(), (q) => says(q === 'Shoes for tonight?' ? 'Wear the white sneakers.' : 'Add a belt in brown.', q === 'Shoes for tonight?' ? { followUps: ['Make it dressier', 'Show me jackets'] } : {}));
    const first = await h.run('Shoes for tonight?');
    const taps = first.payload.followUps as string[];
    expect(taps).toEqual(['Make it dressier', 'Show me jackets']);
    const before = (await h.quota.snapshot()).questionsUsed;
    const second = await h.run(taps[0]!); // the tap goes through ask(text), as a typed question does
    expect((await h.quota.snapshot()).questionsUsed).toBe(before + 1);
    const bubble = (await h.store.chat.get(second.payload.answerTo as string))!;
    expect(bubble.role).toBe('user');
    expect(bubble.text).toBe('Make it dressier');
    expect(bubble.payload.counts).toBe(true);
    expect('tapOf' in bubble.payload).toBe(false);
    expect(h.requests.at(-1)!.tap).toBeFalsy();
    expect(h.requests.at(-1)!.question).toBe('Make it dressier');
  });

  it('KC1.3 · the taps are under the newest answer on the thread, and gone once he asks again', async () => {
    const h = await harness(rows(), () => says('Wear the white sneakers.', { followUps: ['Make it dressier'] }));
    const m = await h.run('Shoes for tonight?');
    expect(latestFollowUps(await thread(h.store))).toEqual({ messageId: m.id, taps: ['Make it dressier'] });
    const next = await h.ask.ask('Something else?');
    if (next.kind !== 'sent') throw new Error(next.kind);
    expect(latestFollowUps(await thread(h.store))).toBeNull(); // his bubble is the newest row now
    await next.done;
  });

  it('KC1.3 · reopening the app: a new ask service and a re-read of the same store give the same taps (they are on the message)', async () => {
    const h = await harness(rows(), () => says('Wear the white sneakers.', { followUps: ['Make it dressier', 'Show me jackets'] }));
    const m = await h.run('Shoes for tonight?');
    const reopened = h.make();
    expect(reopened).not.toBe(h.ask);
    expect((await h.store.chat.get(m.id))!.payload.followUps).toEqual(['Make it dressier', 'Show me jackets']);
    expect(latestFollowUps(await thread(h.store))).toEqual({ messageId: m.id, taps: ['Make it dressier', 'Show me jackets'] });
  });
});

// ================================================================ the closing block
describe('KC1.3 · the closing block carries followUps', () => {
  const asBlock = (b: unknown) => b as { followUps?: unknown; card?: unknown };

  it('KC1.3 · a block with only followUps parses, bare or fenced', () => {
    expect(asBlock(parseClosing('{"followUps":["Make it dressier","Show me jackets"]}'))).toMatchObject({ followUps: ['Make it dressier', 'Show me jackets'] });
    expect(asBlock(parseClosing('```json\n{"followUps":["Make it dressier"]}\n```'))).toMatchObject({ followUps: ['Make it dressier'] });
  });

  it('KC1.3 · a block with a card and followUps keeps both; one without followUps has null', () => {
    const both = asBlock(parseClosing('{"card":{"type":"check"},"followUps":["Make it dressier"]}'));
    expect(both).toMatchObject({ card: { type: 'check' }, followUps: ['Make it dressier'] });
    expect(asBlock(parseClosing('{"card":null}')).followUps).toBeNull();
  });

  it('KC1.3 · {"other":1} and malformed JSON are still no block', () => {
    expect(parseClosing('{"other":1}')).toBeNull();
    expect(parseClosing('{"followUps":["Make it')).toBeNull();
    expect(parseClosing('not json')).toBeNull();
    expect(parseClosing('[]')).toBeNull();
  });

  it('KC1.3 · the empty block has null followUps, and the splitter hands followUps back', () => {
    expect(asBlock(EMPTY_BLOCK).followUps).toBeNull();
    const s = createClosingSplitter();
    const shown = s.push('Wear the sneakers.\n```json\n{"card":null,"followUps":["Make it dressier"]}\n```');
    const end = s.end();
    expect((shown + end.rest).trim()).toBe('Wear the sneakers.');
    expect(asBlock(end.block).followUps).toEqual(['Make it dressier']);
  });
});

// ================================================================ the sources pass followUps through, only when the block had them
describe('KC1.3 · the done event carries followUps only when the block had it', () => {
  const doneOf = (evs: AnswerEvent[]) => evs[evs.length - 1] as unknown as { type: string; followUps?: unknown };
  const collect = async (src: AnswerSource) => {
    const out: AnswerEvent[] = [];
    for await (const e of src.answer({ question: 'q', prompt: { system: 'S', user: 'U' } })) out.push(e);
    return out;
  };

  // Gemini, on a recorded stream
  function geminiBody(text: string) {
    const ev = `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 9, candidatesTokenCount: 8 }, modelVersion: ASK_MODEL })}\r\n\r\n`;
    const bytes = new TextEncoder().encode(ev);
    let k = 0;
    return { getReader: () => ({ read: async () => (k++ === 0 ? { done: false, value: bytes } : { done: true }) }) };
  }
  const gemini = (text: string) => {
    const fetch: NonNullable<AskGeminiOptions['fetch']> = async () => ({ ok: true, status: 200, body: geminiBody(text) });
    return createAskGemini({ apiKey: 'k', fetch });
  };

  it('KC1.3 · Gemini', async () => {
    const withTaps = doneOf(await collect(gemini('Hi.\n```json\n{"card":null,"followUps":["Make it dressier","Show me jackets"]}\n```')));
    expect(withTaps).toMatchObject({ type: 'done', followUps: ['Make it dressier', 'Show me jackets'] });
    const without = doneOf(await collect(gemini('Hi.\n```json\n{"card":null}\n```')));
    expect(without.type).toBe('done');
    expect('followUps' in without).toBe(false);
  });

  // OpenAI and Anthropic, on recorded streams
  function body(text: string) {
    const bytes = new TextEncoder().encode(text);
    let k = 0;
    return { getReader: () => ({ read: async () => (k++ === 0 ? { done: false, value: bytes } : { done: true }) }) };
  }
  const sse = (event: string | null, data: unknown) => `${event ? `event: ${event}\n` : ''}data: ${JSON.stringify(data)}\n\n`;
  const block = (extra: string) => `\n\`\`\`json\n{"card":null,"remember":null,"need":null,"refused":false${extra}}\n\`\`\``;

  const openai = (text: string) => {
    const stream = sse('response.output_text.delta', { type: 'response.output_text.delta', delta: text })
      + sse('response.completed', { type: 'response.completed', response: { model: 'gpt-6-luna', usage: { input_tokens: 10, output_tokens: 5 } } });
    return createAskOpenAI({ apiKey: 'K', model: 'gpt-6-luna', fetch: async () => ({ ok: true, status: 200, body: body(stream) }) });
  };
  const anthropic = (text: string) => {
    const stream = sse('message_start', { type: 'message_start', message: { model: 'claude-haiku-5-5', usage: { input_tokens: 9 } } })
      + sse('content_block_delta', { type: 'content_block_delta', delta: { type: 'text_delta', text } })
      + sse('message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 5 } });
    return createAskAnthropic({ apiKey: 'A', model: 'claude-haiku-5-5', fetch: async () => ({ ok: true, status: 200, body: body(stream) }) });
  };

  it.each([['OpenAI', openai], ['Anthropic', anthropic]] as const)('KC1.3 · %s', async (_name, make) => {
    const withTaps = doneOf(await collect(make(`Hi.${block(',"followUps":["Make it dressier","Show me jackets"]')}`)));
    expect(withTaps).toMatchObject({ type: 'done', followUps: ['Make it dressier', 'Show me jackets'] });
    const without = doneOf(await collect(make(`Hi.${block('')}`)));
    expect(without.type).toBe('done');
    expect('followUps' in without).toBe(false);
  });
});

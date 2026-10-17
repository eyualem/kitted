// The stylist's answer client, C2 (07 §13 A1–A7), on recorded replies: nothing here calls Google.
import { US_EASTERN } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import { createClosingSplitter, parseClosing } from '@/features/ask/closing';
import { checkSentence, createSentenceStream, scoresIn, type GateContext } from '@/features/ask/gate';
import { ASK_MODEL, buildAskRequest, createAskGemini, type AskGeminiOptions } from '@/features/ask/gemini';
import { STYLIST_GUIDE } from '@/features/ask/guide.generated';
import { liveAnswer } from '@/features/ask/live';
import { liveAnswerSource } from '@/features/ask/liveSource';
import { createAsk, GIVE_UP_MS, SLOW_MS } from '@/features/ask/pipeline';
import { createPrepare } from '@/features/ask/prepare';
import { ANSWER_RULES, guideFor, systemPrompt, userPrompt } from '@/features/ask/prompt';
import type { AnswerEvent, AnswerSource } from '@/features/ask/source';
import { t } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { createQuota } from '@/services/quota';
import { directTransport, type AiFetch } from '@/services/server/transport';

declare const __dirname: string;
const { readFileSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');

const NOW = Date.parse('2026-10-22T12:30:00-04:00');
const NO_SCORES: GateContext = { allowedScores: new Set() };

/** An SSE body from text chunks, cut into byte pieces of `cut` (to test splits mid-event and mid-character). */
function sseBody(texts: string[], o: { finish?: string; cut?: number } = {}) {
  const events = texts.map((x, i) => `data: ${JSON.stringify({
    candidates: [{ content: { parts: [{ text: x }] }, ...(i === texts.length - 1 ? { finishReason: o.finish ?? 'STOP' } : {}) }],
    ...(i === texts.length - 1 ? { usageMetadata: { promptTokenCount: 900, candidatesTokenCount: 80 }, modelVersion: ASK_MODEL } : {}),
  })}\r\n\r\n`).join('');
  const bytes = new TextEncoder().encode(events);
  const cut = o.cut ?? bytes.length;
  const pieces: Uint8Array[] = [];
  for (let i = 0; i < bytes.length; i += cut) pieces.push(bytes.slice(i, i + cut));
  let k = 0;
  return { getReader: () => ({ read: async () => (k < pieces.length ? { done: false, value: pieces[k++] } : { done: true }) }) };
}

function fakeFetch(texts: string[], o: { finish?: string; cut?: number; status?: number; throws?: boolean } = {}) {
  const calls: { url: string; init: { headers: Record<string, string>; body: string } }[] = [];
  const fetch: NonNullable<AskGeminiOptions['fetch']> = async (url, init) => {
    calls.push({ url, init });
    if (o.throws) throw new TypeError('Network request failed');
    if (o.status && o.status !== 200) return { ok: false, status: o.status, body: null };
    return { ok: true, status: 200, body: sseBody(texts, o) };
  };
  return { fetch, calls };
}

async function drain(src: AnswerSource, prompt = { system: 'S', user: 'U' }): Promise<AnswerEvent[]> {
  const out: AnswerEvent[] = [];
  for await (const e of src.answer({ question: 'q', prompt })) out.push(e);
  return out;
}
const deltas = (evs: AnswerEvent[]) => evs.filter((e): e is Extract<AnswerEvent, { type: 'delta' }> => e.type === 'delta').map((e) => e.text).join('');

describe('A1 · one request, the right shape', () => {
  it('sends the rules + guide as system, the pack + evidence + question as his turn, low temperature, capped, key in a header', async () => {
    const { fetch, calls } = fakeFetch(['Hi.\n```json\n{"card":null}\n```']);
    await drain(createAskGemini({ apiKey: 'KEY123', fetch }), { system: systemPrompt('goesWith'), user: userPrompt('PACK', 'EVIDENCE', 'What goes with it?') });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toContain(`${ASK_MODEL}:streamGenerateContent?alt=sse`);
    expect(calls[0]!.url).not.toContain('KEY123');
    expect(calls[0]!.init.headers['x-goog-api-key']).toBe('KEY123');
    const body = JSON.parse(calls[0]!.init.body);
    expect(body.systemInstruction.parts[0].text).toContain(ANSWER_RULES.split('\n')[0]);
    expect(body.systemInstruction.parts[0].text).toContain('## 0. Rules for the chat model');
    expect(body.contents[0].parts[0].text).toBe('<pack>\nPACK\n</pack>\n\n<evidence>\nEVIDENCE\n</evidence>\n\nQuestion: What goes with it?');
    expect(body.generationConfig.temperature).toBe(0.3);
    expect(body.generationConfig.maxOutputTokens).toBeLessThanOrEqual(500);
  });

  it('trims the guide by kind: §0 always, the kind\'s sections, never the sources list', () => {
    const g = guideFor('buyNext');
    expect(g).toContain('## 0.');
    expect(g).toContain('## 13. Shopping');
    expect(g).not.toContain('## 3. Pants');
    expect(g).not.toContain('## Sources');
  });

  it('the bundled guide matches rubric/stylist-guide.md (re-run scripts/gen-guide.mjs when it changes)', () => {
    expect(STYLIST_GUIDE).toBe(readFileSync(join(__dirname, '../../../rubric/stylist-guide.md'), 'utf8'));
  });

  it('buildAskRequest asks for the least thinking the model takes (Flash-Lite refuses a budget of 0, #310)', () => {
    expect(buildAskRequest('s', 'u').generationConfig.thinkingConfig).toEqual({ thinkingLevel: 'minimal' });
    expect(buildAskRequest('s', 'u', 'gemini-3.8-flash').generationConfig.thinkingConfig).toEqual({ thinkingBudget: 0 });
  });
});

describe('A2 · streaming and the closing block', () => {
  const reply = ['Your white tee and dark jeans', ', worn open. Olive and denim', ' is an easy pair.\n```js', 'on\n{"card":{"type":"outfit","pieces":["P1","P2","P3"]},"remember":null,"need":null,"refused":false}\n``', '`'];

  it.each([1, 3, 7, 64, 10_000])('text in order, the block never shown, at a %i-byte split', async (cut) => {
    const { fetch } = fakeFetch(reply, { cut });
    const evs = await drain(createAskGemini({ apiKey: 'k', fetch }));
    expect(deltas(evs).trim()).toBe('Your white tee and dark jeans, worn open. Olive and denim is an easy pair.');
    const done = evs[evs.length - 1]!;
    expect(done).toMatchObject({ type: 'done', card: { type: 'outfit', pieces: ['P1', 'P2', 'P3'] }, refused: false });
  });

  it('a broken block drops the card, never the answer', async () => {
    const { fetch } = fakeFetch(['Tuck the front in.\n```json\n{"card": {"type": "outf']);
    const evs = await drain(createAskGemini({ apiKey: 'k', fetch }));
    expect(deltas(evs).trim()).toBe('Tuck the front in.');
    expect(evs[evs.length - 1]).toMatchObject({ type: 'done', card: null });
  });

  it('a bare JSON last line (no fence) is the block too', () => {
    const s = createClosingSplitter();
    const shown = s.push('Go with the loafers.\n{"card":null,"remember":{"key":"budget","value":"$60"}}');
    const end = s.end();
    expect((shown + end.rest).trim()).toBe('Go with the loafers.');
    expect(end.block.remember).toEqual({ key: 'budget', value: '$60' });
  });

  it('text that only looks like JSON stays text', () => {
    expect(parseClosing('{curly}')).toBeNull();
    expect(parseClosing('```json\n{"other":1}\n```')).toBeNull();
  });
});

describe('A3 · failures count nothing', () => {
  it.each([
    ['an HTTP error', { status: 429 }, 'http429'],
    ['offline', { throws: true }, 'offline'],
    ['a cut-off answer', { finish: 'MAX_TOKENS' }, 'finishMAX_TOKENS'],
    ['a blocked answer', { finish: 'SAFETY' }, 'finishSAFETY'],
  ] as const)('%s → failed', async (_n, o, code) => {
    const { fetch } = fakeFetch(['Half an answer'], o);
    const evs = await drain(createAskGemini({ apiKey: 'k', fetch }));
    expect(evs[evs.length - 1]).toEqual({ type: 'failed', code });
  });

  it('no first word after 6 s → "Taking longer…"; none after 20 s → the fail line with Retry, nothing counted', async () => {
    jest.useFakeTimers();
    try {
      const store = createMemoryStore();
      const clock = manualClock(NOW);
      const quota = createQuota({ store, clock, isPro: () => false });
      const hang: AnswerSource = { name: 'hang', answer: async function* () { await new Promise(() => {}); } };
      const ask = createAsk({
        store, quota, clock, ids: counterIds(), source: () => hang, consent: async () => true, openConsent: () => {}, tryPro: () => false,
        scheduler: { setTimer: (fn, ms) => setTimeout(fn, ms), clearTimer: (h) => clearTimeout(h as ReturnType<typeof setTimeout>) },
      });
      const o = await ask.ask('What goes with my chinos?');
      if (o.kind !== 'sent') throw new Error(o.kind);
      await jest.advanceTimersByTimeAsync(SLOW_MS);
      expect(liveAnswer.get()).toMatchObject({ phase: 'waiting', slow: true });
      await jest.advanceTimersByTimeAsync(GIVE_UP_MS - SLOW_MS);
      const r = await o.done;
      expect(r).toMatchObject({ kind: 'failed', code: 'timeout' });
      const rows = await store.chat.all();
      expect(rows.find((m) => m.role === 'stylist')?.text).toBe(t('fail.ask'));
      expect((await quota.snapshot()).questionsUsed).toBe(0);
    } finally {
      jest.useRealTimers();
      liveAnswer.clear();
    }
  });
});

describe('A4 · the sentence gate', () => {
  const ctx: GateContext = { allowedScores: new Set(['7.0', '7.5']) };
  it.each([
    ['emoji', 'Love it 🔥.'],
    ['unlimited', 'You get unlimited checks.'],
    ['aiStylist', "I'm your AI stylist."],
    ['brand', 'Grab some Nike Dunks.'],
    ['brand', 'Try the ones from Uniqlo.'],
    ['creator', 'Tim Dessaint says so.'],
    ['build', 'For your build, go roomy.'],
    ['build', "Since you're tall, go longer."],
    ['body', 'Your belly shows in that.'],
    ['body', "You're too skinny for it."],
    ['height', 'At 6\'1 you can do it.'],
    ['score', 'That would be an 8.5.'],
    ['score', "It'd score 9/10."],
  ])('drops a %s sentence: "%s"', (rule, s) => {
    expect(checkSentence(s, ctx)).toBe(rule);
  });
  it.each([
    'Tuck it in and it\'s a 7.5.',
    'Skinny jeans read dated; go straight.',
    'Go up a size so the shoulders have room.',
    'I guess the loafers win here.',
    'The gap above the shoe is fine.',
    'Cuff them once, about 1.5 inches.',
    'A slim fit works with the overshirt.',
    'Your 32 waist jeans should hit the shoe.',
  ])('keeps "%s"', (s) => {
    expect(checkSentence(s, ctx)).toBeNull();
  });

  it('drops only the failing sentence; an all-dropped answer is the fail line, not counted', async () => {
    const st = createSentenceStream(ctx);
    const out = st.push('Wear the loafers. They are by Gucci, so') + st.push(' fancy. Roll the hem once.') + st.end();
    expect(out).toBe('Wear the loafers. Roll the hem once.');
    expect(st.dropped).toEqual(['brand']);
    const store = createMemoryStore();
    const clock = manualClock(NOW);
    const quota = createQuota({ store, clock, isPro: () => false });
    const src: AnswerSource = { name: 's', answer: async function* () { yield { type: 'delta', text: 'Buy Nike. 🔥' }; yield { type: 'done' }; } };
    const ask = createAsk({ store, quota, clock, ids: counterIds(), source: () => src, consent: async () => true, openConsent: () => {}, tryPro: () => false });
    const o = await ask.ask('what shoes');
    if (o.kind !== 'sent') throw new Error(o.kind);
    expect(await o.done).toMatchObject({ kind: 'failed', code: 'gated' });
    expect((await quota.snapshot()).questionsUsed).toBe(0);
  });

  it('a score the pack holds may be said; the pack\'s scores are read from its text', () => {
    expect([...scoresIn('FC1 · 9:10 am · 7.0 Put together · Fix 1: Tuck → 7.5')].sort()).toEqual(['7.0', '7.5']);
  });
});

describe('A5 · nothing shows before it\'s checked', () => {
  it('the live row only ever holds sentences that passed', async () => {
    const store = createMemoryStore();
    const clock = manualClock(NOW);
    const quota = createQuota({ store, clock, isPro: () => false });
    const seen: string[] = [];
    const off = liveAnswer.subscribe(() => {
      const l = liveAnswer.get();
      if (l && l.phase === 'streaming') seen.push(l.text);
    });
    const src: AnswerSource = {
      name: 's',
      answer: async function* () {
        for (const c of ['Wear the', ' loafers. Get the Nike', ' ones too. Roll', ' the hem.']) yield { type: 'delta', text: c };
        yield { type: 'done' };
      },
    };
    const ask = createAsk({ store, quota, clock, ids: counterIds(), source: () => src, consent: async () => true, openConsent: () => {}, tryPro: () => false });
    const o = await ask.ask('shoes?');
    if (o.kind !== 'sent') throw new Error(o.kind);
    await o.done;
    off();
    liveAnswer.clear();
    expect(seen.length).toBeGreaterThan(0);
    for (const s of seen) expect(s).not.toMatch(/nike|Wear the$/i);
    expect((await store.chat.all()).find((m) => m.role === 'stylist')?.text).toBe('Wear the loafers. Roll the hem.');
  });
});

describe('A6 · never sent', () => {
  it('the whole request holds no birth year, age, name, location, photo or file path', async () => {
    const store = createMemoryStore();
    const clock = manualClock(NOW);
    await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: NOW });
    const p = (await store.profile.get('me'))!;
    const prepare = createPrepare({ store, clock, ids: counterIds() });
    const { fetch, calls } = fakeFetch(['Fine.\n```json\n{"card":null}\n```']);
    for (const q of ['What goes with my olive overshirt?', 'Why did I only get a 7?', 'What should I buy next?']) {
      const prep = await prepare(q);
      await drain(createAskGemini({ apiKey: 'k', fetch }), prep.prompt);
    }
    for (const c of calls) {
      const body = c.init.body;
      // His part of the request (the fixed rules say "aged 18 to 30" about the app's audience, never about him).
      const his = JSON.parse(body).contents[0].parts[0].text as string;
      expect(body).not.toContain(String(p.birthYear));
      expect(his).not.toMatch(/\b(?:age|aged|years old|born)\b/i);
      expect(body).not.toMatch(/file:\/\/|\.jpe?g|\.png|Documents\/|Caches\//);
      expect(body).not.toMatch(/latitude|longitude|zip code/i);
    }
  });
});

describe('A7 · off on his phone', () => {
  it('no real source while CHAT_LIVE is off, or with nowhere to send', () => {
    // Jest has no dev key and no server setting (a dev build with neither), so the default source is null here.
    const transport = directTransport('KEY', fakeFetch([]).fetch as unknown as AiFetch);
    expect(liveAnswerSource()).toBeNull();
    expect(liveAnswerSource(true, null)).toBeNull();
    expect(liveAnswerSource(false, transport)).toBeNull();
    expect(liveAnswerSource(true, transport)?.name).toBe('gemini');
  });
  it('the key only ever comes from a dev build (__DEV__), so a release build can never send it (13-server.md §8)', () => {
    const src = readFileSync(join(__dirname, '../services/server/config.ts'), 'utf8');
    expect(src).toMatch(/DEV_GEMINI_KEY: string \| undefined = __DEV__ \? process\.env\.EXPO_PUBLIC_GEMINI_DEV_KEY \|\| undefined : undefined;/);
  });
  it('the gate passes every seeded demo answer (the demo screens keep their words)', () => {
    const s = seed as unknown as { scenarios: Record<string, { chatThread?: { role: string; kind: string; text?: string }[] }> };
    for (const sc of Object.values(s.scenarios)) {
      for (const m of sc.chatThread ?? []) {
        if (m.role !== 'stylist' || m.kind !== 'text' || !m.text) continue;
        const st = createSentenceStream(NO_SCORES);
        expect(st.push(m.text) + st.end()).toBe(m.text);
      }
    }
  });
});

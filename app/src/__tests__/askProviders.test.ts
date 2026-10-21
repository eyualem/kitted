// The model test's other companies (07 §16, #311): OpenAI and Anthropic sources on recorded streams. No network.
import { createAskAnthropic, createAskOpenAI, parseEvents, type CallUsage } from '@/features/ask/providers';
import type { AnswerEvent } from '@/features/ask/source';
import { serverTransport, type AiFetch } from '@/services/server/transport';

function body(text: string, cut = 7) {
  const bytes = new TextEncoder().encode(text);
  const pieces: Uint8Array[] = [];
  for (let i = 0; i < bytes.length; i += cut) pieces.push(bytes.slice(i, i + cut));
  let k = 0;
  return { getReader: () => ({ read: async () => (k < pieces.length ? { done: false, value: pieces[k++] } : { done: true }) }) };
}
const ev = (event: string | null, data: unknown) => `${event ? `event: ${event}\n` : ''}data: ${JSON.stringify(data)}\n\n`;
async function collect(it: AsyncGenerator<AnswerEvent, void, void>) {
  const out: AnswerEvent[] = [];
  for await (const e of it) out.push(e);
  return out;
}
const PROMPT = { system: 'rules', user: 'question' };
const BLOCK = '\n```json\n{"card":null,"remember":null,"need":null,"refused":false,"verdict":"no"}\n```';

describe('parseEvents', () => {
  it('splits events and keeps the unfinished rest', () => {
    const r = parseEvents('event: a\ndata: {"x":1}\n\ndata: {"y":2}\n\ndata: {"z"');
    expect(r.events).toEqual([{ event: 'a', data: '{"x":1}' }, { event: null, data: '{"y":2}' }]);
    expect(r.rest).toBe('data: {"z"');
  });
});

describe('OpenAI Responses', () => {
  it('streams the answer, hides the closing block, reads usage', async () => {
    const parts = ['Skip the tee', ' for an interview.', BLOCK];
    const sse = parts.map((d) => ev('response.output_text.delta', { type: 'response.output_text.delta', delta: d })).join('')
      + ev('response.completed', { type: 'response.completed', response: { model: 'gpt-6-luna', usage: { input_tokens: 4000, input_tokens_details: { cached_tokens: 3000 }, output_tokens: 60 } } });
    let sent: Record<string, unknown> = {};
    let usage: CallUsage | null = null;
    const src = createAskOpenAI({
      apiKey: 'K', model: 'gpt-6-luna', onCall: (c) => (usage = c.usage),
      fetch: async (_u, init) => {
        sent = JSON.parse(init.body);
        expect(init.headers.Authorization).toBe('Bearer K');
        return { ok: true, status: 200, body: body(sse) };
      },
    });
    const out = await collect(src.answer({ question: 'q', prompt: PROMPT }));
    expect(out.filter((e) => e.type === 'delta').map((e) => (e as { text: string }).text).join('').trim()).toBe('Skip the tee for an interview.');
    expect(out[out.length - 1]).toMatchObject({ type: 'done', verdict: 'no', blockFound: true });
    expect(usage).toEqual({ in: 4000, cached: 3000, cacheWrite: 0, out: 60 });
    expect(sent).toMatchObject({ model: 'gpt-6-luna', instructions: 'rules', max_output_tokens: 420, reasoning: { effort: 'none' }, store: false, stream: true });
  });
  it('a cut-off answer is a failure, never half an answer', async () => {
    const sse = ev(null, { type: 'response.output_text.delta', delta: 'Half' }) + ev(null, { type: 'response.incomplete', response: { incomplete_details: { reason: 'max_output_tokens' }, usage: {} } });
    const src = createAskOpenAI({ apiKey: 'K', model: 'm', fetch: async () => ({ ok: true, status: 200, body: body(sse) }) });
    const out = await collect(src.answer({ question: 'q', prompt: PROMPT }));
    expect(out[out.length - 1]).toEqual({ type: 'failed', code: 'finishmax_output_tokens' });
  });
});

describe('Anthropic Messages', () => {
  it('streams, caches the system part, reads usage incl. cache', async () => {
    const sse = ev('message_start', { type: 'message_start', message: { model: 'claude-haiku-5-5', usage: { input_tokens: 900, cache_read_input_tokens: 3100, cache_creation_input_tokens: 0 } } })
      + ['Yes, with the', ' dark jeans.', BLOCK].map((t) => ev('content_block_delta', { type: 'content_block_delta', delta: { type: 'text_delta', text: t } })).join('')
      + ev('message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 55 } });
    let sent: Record<string, unknown> = {};
    let usage: CallUsage | null = null;
    const src = createAskAnthropic({
      apiKey: 'A', model: 'claude-haiku-5-5', onCall: (c) => (usage = c.usage),
      fetch: async (_u, init) => {
        sent = JSON.parse(init.body);
        expect(init.headers['x-api-key']).toBe('A');
        return { ok: true, status: 200, body: body(sse, 5) };
      },
    });
    const out = await collect(src.answer({ question: 'q', prompt: PROMPT }));
    expect(out.filter((e) => e.type === 'delta').map((e) => (e as { text: string }).text).join('').trim()).toBe('Yes, with the dark jeans.');
    expect(usage).toEqual({ in: 4000, cached: 3100, cacheWrite: 0, out: 55 });
    expect(sent).toMatchObject({ thinking: { type: 'disabled' }, system: [{ type: 'text', text: 'rules', cache_control: { type: 'ephemeral' } }] });
  });
  it('Sonnet gets its own thinking-off form', async () => {
    let sent: Record<string, unknown> = {};
    const src = createAskAnthropic({ apiKey: 'A', model: 'claude-sonnet-5-5', fetch: async (_u, init) => ((sent = JSON.parse(init.body)), { ok: false, status: 500, body: null }) });
    await collect(src.answer({ question: 'q', prompt: PROMPT }));
    expect(sent.thinking).toEqual({ type: 'between_tools' });
  });
});

describe('OpenAI through our server (13-server.md §11, O6)', () => {
  const done = ev('response.completed', { type: 'response.completed', response: { model: 'gpt-5.6-luna', usage: { input_tokens: 10, output_tokens: 5 } } });
  function server(status: number, text: string, seen: { url?: string; headers?: Record<string, string>; body?: string }[]) {
    const fetch = (async (url: string, init: { headers: Record<string, string>; body: string }) => {
      seen.push({ url, headers: init.headers, body: init.body });
      return { ok: status === 200, status, body: status === 200 ? body(text) : null, text: async () => text, headers: { get: () => null } };
    }) as unknown as AiFetch;
    return serverTransport({ base: 'https://srv/api', fetch, token: async () => 'GUEST', tzMinutes: () => -240 });
  }
  it("sends the same body to /v1/ask?model=gpt-5.6-luna, signed in, with the tap header on a tap", async () => {
    const seen: { url?: string; headers?: Record<string, string>; body?: string }[] = [];
    let direct = '';
    const viaKey = createAskOpenAI({ apiKey: 'K', model: 'gpt-5.6-luna', effort: 'none', maxTokens: 420, fetch: async (_u, init) => {
      direct = init.body;
      return { ok: true, status: 200, body: body(ev('response.output_text.delta', { type: 'response.output_text.delta', delta: 'Hi.' + BLOCK }) + done) };
    } });
    await collect(viaKey.answer({ question: 'q', prompt: PROMPT }));
    const viaServer = createAskOpenAI({ transport: server(200, ev('response.output_text.delta', { type: 'response.output_text.delta', delta: 'Hi.' + BLOCK }) + done, seen), model: 'gpt-5.6-luna', effort: 'none', maxTokens: 420 });
    const out = await collect(viaServer.answer({ question: 'q', prompt: PROMPT, tap: true }));
    expect(seen[0]!.url).toBe('https://srv/api/v1/ask?model=gpt-5.6-luna');
    expect(seen[0]!.body).toBe(direct);
    expect(seen[0]!.headers!.Authorization).toBe('Bearer GUEST');
    expect(seen[0]!.headers!['X-Kitted-Free']).toBe('tap');
    expect(out.at(-1)?.type).toBe('done');
  });
  it("the server's limit and spending stop become the limit and paused lines; nothing else counts as one", async () => {
    const limit = createAskOpenAI({ transport: server(429, '{"error":"limit","which":"questions"}', []), model: 'gpt-5.6-luna' });
    expect(await collect(limit.answer({ question: 'q', prompt: PROMPT }))).toEqual([{ type: 'failed', code: 'limit' }]);
    const paused = createAskOpenAI({ transport: server(503, '{"error":"paused"}', []), model: 'gpt-5.6-luna' });
    expect(await collect(paused.answer({ question: 'q', prompt: PROMPT }))).toEqual([{ type: 'failed', code: 'paused' }]);
    const up = createAskOpenAI({ transport: server(502, '{"error":"upstream","status":500}', []), model: 'gpt-5.6-luna' });
    expect(await collect(up.answer({ question: 'q', prompt: PROMPT }))).toEqual([{ type: 'failed', code: 'http502' }]);
  });
});

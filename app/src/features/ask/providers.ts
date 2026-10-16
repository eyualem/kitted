// Other companies' models as answer sources, for the model test only (07 §16, #311): OpenAI's Responses API and
// Anthropic's Messages API, streamed, with the same closing block (closing.ts) and the same events as the Gemini
// client (gemini.ts), so the pipeline after them (the gate, the cards) is identical. Not wired into the app: the keys
// live only in the git-ignored .env file and reach these through the test harness. A winner would go through the
// server (C6), never a key on the phone.
import { createClosingSplitter, EMPTY_BLOCK } from './closing';
import type { AnswerEvent, AnswerSource } from './source';

type StreamFetch = (url: string, init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal }) => Promise<{
  ok: boolean;
  status: number;
  body: { getReader(): { read(): Promise<{ done: boolean; value?: Uint8Array }> } } | null;
}>;

/** Tokens in one call, the same shape for every company: in (all input), cached (part of in), out (incl. thinking). */
export interface CallUsage {
  in: number;
  cached: number;
  /** Anthropic only: tokens written to its cache (billed above the input price). */
  cacheWrite: number;
  out: number;
}

export interface ProviderOptions {
  apiKey: string;
  fetch: StreamFetch;
  model: string;
  maxTokens?: number;
  /** OpenAI: the reasoning effort ("none" where the model takes it). */
  effort?: string;
  onCall?: (r: { ms: number; usage: CallUsage; stop: string | null; model: string | null; firstMs: number | null }) => void;
  now?: () => number;
}

/** Server-sent events: `event:` and `data:` lines split by blank lines (both companies send JSON in data). */
export function parseEvents(text: string): { events: { event: string | null; data: string }[]; rest: string } {
  const out: { event: string | null; data: string }[] = [];
  const blocks = text.split(/\r?\n\r?\n/);
  const rest = blocks.pop() ?? '';
  for (const b of blocks) {
    let event: string | null = null;
    const data: string[] = [];
    for (const line of b.split(/\r?\n/)) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
    }
    if (data.length) out.push({ event, data: data.join('\n') });
  }
  return { events: out, rest };
}

async function* streamEvents(res: Awaited<ReturnType<StreamFetch>>): AsyncGenerator<{ event: string | null; json: Record<string, unknown> }> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const parsed = parseEvents(buf + decoder.decode(value, { stream: true }));
    buf = parsed.rest;
    for (const e of parsed.events) {
      if (e.data === '[DONE]') continue;
      try {
        yield { event: e.event, json: JSON.parse(e.data) as Record<string, unknown> };
      } catch {
        // a broken event line: skip it, like the Gemini client does
      }
    }
  }
  if (buf.trim()) {
    for (const e of parseEvents(`${buf}\n\n`).events) {
      try {
        yield { event: e.event, json: JSON.parse(e.data) as Record<string, unknown> };
      } catch {
        // ignore
      }
    }
  }
}

const num = (v: unknown): number => (typeof v === 'number' ? v : 0);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});

/** OpenAI's Responses API, streamed. */
export function createAskOpenAI(opts: ProviderOptions): AnswerSource {
  const now = opts.now ?? (() => Date.now());
  return {
    name: `openai:${opts.model}`,
    async *answer(req): AsyncGenerator<AnswerEvent, void, void> {
      if (!req.prompt) {
        yield { type: 'failed', code: 'noPrompt' };
        return;
      }
      const effort = opts.effort ?? 'none';
      const body: Record<string, unknown> = {
        model: opts.model, instructions: req.prompt.system, input: [{ role: 'user', content: req.prompt.user }],
        max_output_tokens: opts.maxTokens ?? 420, reasoning: { effort }, store: false, stream: true,
      };
      if (effort === 'none') body.temperature = 0.3;
      const t0 = now();
      let res;
      try {
        res = await opts.fetch('https://api.openai.com/v1/responses', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${opts.apiKey}` }, body: JSON.stringify(body), signal: req.signal,
        });
      } catch {
        yield { type: 'failed', code: 'offline' };
        return;
      }
      if (!res.ok || !res.body) {
        yield { type: 'failed', code: `http${res.status}` };
        return;
      }
      const split = createClosingSplitter();
      let usage: CallUsage = { in: 0, cached: 0, cacheWrite: 0, out: 0 };
      let stop: string | null = null;
      let model: string | null = null;
      let firstMs: number | null = null;
      try {
        for await (const { json } of streamEvents(res)) {
          const type = String(json.type ?? '');
          if (type === 'response.output_text.delta') {
            const show = split.push(String(json.delta ?? ''));
            if (show) {
              if (firstMs === null) firstMs = now() - t0;
              yield { type: 'delta', text: show };
            }
          } else if (type === 'response.completed' || type === 'response.incomplete' || type === 'response.failed') {
            const r = obj(json.response);
            const u = obj(r.usage);
            usage = { in: num(u.input_tokens), cached: num(obj(u.input_tokens_details).cached_tokens), cacheWrite: 0, out: num(u.output_tokens) };
            stop = type === 'response.completed' ? 'stop' : String(obj(r.incomplete_details).reason ?? type);
            model = typeof r.model === 'string' ? r.model : null;
          } else if (type === 'error') {
            stop = 'error';
          }
        }
      } catch {
        yield { type: 'failed', code: 'stream' };
        return;
      }
      opts.onCall?.({ ms: now() - t0, usage, stop, model, firstMs });
      if (stop !== 'stop') {
        yield { type: 'failed', code: `finish${stop ?? 'none'}` };
        return;
      }
      const { rest, block } = split.end();
      if (rest) yield { type: 'delta', text: rest };
      yield { type: 'done', card: block.card, remember: block.remember, need: block.need, refused: block.refused, verdict: block.verdict, blockFound: block !== EMPTY_BLOCK };
    },
  };
}

/** Anthropic's Messages API, streamed; the system part is cached (the same for every question). */
export function createAskAnthropic(opts: ProviderOptions): AnswerSource {
  const now = opts.now ?? (() => Date.now());
  return {
    name: `anthropic:${opts.model}`,
    async *answer(req): AsyncGenerator<AnswerEvent, void, void> {
      if (!req.prompt) {
        yield { type: 'failed', code: 'noPrompt' };
        return;
      }
      // Thinking off (#283): Haiku 5.5 takes "disabled"; Sonnet 5.5 refuses it and takes "between_tools".
      const thinking = opts.model.startsWith('claude-sonnet') ? { type: 'between_tools' } : { type: 'disabled' };
      const body = {
        model: opts.model, max_tokens: opts.maxTokens ?? 420, stream: true, thinking,
        system: [{ type: 'text', text: req.prompt.system, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: req.prompt.user }],
      };
      const t0 = now();
      let res;
      try {
        res = await opts.fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01', 'x-api-key': opts.apiKey }, body: JSON.stringify(body), signal: req.signal,
        });
      } catch {
        yield { type: 'failed', code: 'offline' };
        return;
      }
      if (!res.ok || !res.body) {
        yield { type: 'failed', code: `http${res.status}` };
        return;
      }
      const split = createClosingSplitter();
      const usage: CallUsage = { in: 0, cached: 0, cacheWrite: 0, out: 0 };
      let stop: string | null = null;
      let model: string | null = null;
      let firstMs: number | null = null;
      try {
        for await (const { json } of streamEvents(res)) {
          const type = String(json.type ?? '');
          if (type === 'message_start') {
            const m = obj(json.message);
            const u = obj(m.usage);
            model = typeof m.model === 'string' ? m.model : null;
            usage.cached = num(u.cache_read_input_tokens);
            usage.cacheWrite = num(u.cache_creation_input_tokens);
            usage.in = num(u.input_tokens) + usage.cached + usage.cacheWrite;
          } else if (type === 'content_block_delta') {
            const d = obj(json.delta);
            if (d.type === 'text_delta') {
              const show = split.push(String(d.text ?? ''));
              if (show) {
                if (firstMs === null) firstMs = now() - t0;
                yield { type: 'delta', text: show };
              }
            }
          } else if (type === 'message_delta') {
            stop = String(obj(json.delta).stop_reason ?? stop ?? '');
            usage.out = num(obj(json.usage).output_tokens);
          } else if (type === 'error') {
            stop = 'error';
          }
        }
      } catch {
        yield { type: 'failed', code: 'stream' };
        return;
      }
      opts.onCall?.({ ms: now() - t0, usage, stop, model, firstMs });
      if (stop !== 'end_turn' && stop !== 'stop_sequence') {
        yield { type: 'failed', code: `finish${stop || 'none'}` };
        return;
      }
      const { rest, block } = split.end();
      if (rest) yield { type: 'delta', text: rest };
      yield { type: 'done', card: block.card, remember: block.remember, need: block.need, refused: block.refused, verdict: block.verdict, blockFound: block !== EMPTY_BLOCK };
    },
  };
}

// The real stylist (07 §5, C2; checks A1–A3): one streamed Gemini call per question with the dev key, the way the
// reading call works (services/readingSource/gemini.ts), its SSE parser shared. The closing block (closing.ts) is
// split off as it streams, so the deltas this yields are the answer only; the pipeline gates them sentence by
// sentence (gate.ts). Never picked on his phone until CHAT_LIVE is on (session.ts, A7).
import { parseSse, type StreamChunk } from '@/services/readingSource/gemini';
import { createClosingSplitter, EMPTY_BLOCK } from './closing';
import type { AnswerEvent, AnswerSource } from './source';

/** The chat's starting model (07 §9, #270): a quarter of 3.8 Flash's cost from 2027; C5's test can change it. */
export const ASK_MODEL = 'gemini-3.5-flash-lite';
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
/** ≈200 tokens of answer plus the closing block (07 §5.3). */
export const ASK_MAX_TOKENS = 420;
export const ASK_TEMPERATURE = 0.3;

export interface AskGeminiOptions {
  apiKey: string;
  /** Streaming fetch (expo/fetch on device); injected for tests. */
  fetch: (url: string, init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal }) => Promise<{
    ok: boolean;
    status: number;
    body: { getReader(): { read(): Promise<{ done: boolean; value?: Uint8Array }> } } | null;
  }>;
  model?: string;
  /** The answer cap (default ASK_MAX_TOKENS); the model test gives every model the same, higher one (#311). */
  maxTokens?: number;
  /** Tokens and timing per call, for the cost log (never the text). */
  onCall?: (r: { ms: number; usage?: Record<string, number>; finishReason?: string; model?: string }) => void;
  now?: () => number;
}

/** The least thinking each model takes: Flash-Lite 3.5 refuses a budget of 0 (HTTP 400, #310) and takes the "minimal"
 *  level; 3.8 Flash refuses "minimal" and takes a budget of 0 (#311, as the reading call does). */
export function thinkingFor(model: string): Record<string, unknown> {
  return /flash-lite/.test(model) ? { thinkingLevel: 'minimal' } : { thinkingBudget: 0 };
}

/** The request body (A1): rules + guide as the system part, pack + evidence + question as his turn. */
export function buildAskRequest(system: string, user: string, model: string = ASK_MODEL, maxTokens: number = ASK_MAX_TOKENS) {
  return {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: { temperature: ASK_TEMPERATURE, maxOutputTokens: maxTokens, thinkingConfig: thinkingFor(model) },
  };
}

export function createAskGemini(opts: AskGeminiOptions): AnswerSource {
  const now = opts.now ?? (() => Date.now());
  const model = opts.model ?? ASK_MODEL;
  return {
    name: 'gemini',
    async *answer(req): AsyncGenerator<AnswerEvent, void, void> {
      if (!req.prompt) {
        yield { type: 'failed', code: 'noPrompt' };
        return;
      }
      const t0 = now();
      let res;
      try {
        res = await opts.fetch(`${BASE}/${model}:streamGenerateContent?alt=sse`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': opts.apiKey },
          body: JSON.stringify(buildAskRequest(req.prompt.system, req.prompt.user, model, opts.maxTokens)),
          signal: req.signal,
        });
      } catch {
        yield { type: 'failed', code: req.signal?.aborted ? 'aborted' : 'offline' };
        return;
      }
      if (!res.ok || !res.body) {
        yield { type: 'failed', code: `http${res.status}` };
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const split = createClosingSplitter();
      let buf = '';
      let last: StreamChunk | undefined;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const parsed = parseSse(buf + decoder.decode(value, { stream: true }));
          buf = parsed.rest;
          for (const c of parsed.chunks) {
            last = { ...last, ...c, text: '' };
            const show = split.push(c.text);
            if (show) yield { type: 'delta', text: show };
          }
        }
        if (buf.trim()) {
          for (const c of parseSse(buf + '\n\n').chunks) {
            last = { ...last, ...c, text: '' };
            const show = split.push(c.text);
            if (show) yield { type: 'delta', text: show };
          }
        }
      } catch {
        yield { type: 'failed', code: req.signal?.aborted ? 'aborted' : 'stream' };
        return;
      }
      opts.onCall?.({ ms: now() - t0, usage: last?.usage, finishReason: last?.finishReason, model: last?.modelVersion });
      // MAX_TOKENS, SAFETY, RECITATION…: a cut-off or blocked answer is a failure, never half an answer.
      if (last?.finishReason && last.finishReason !== 'STOP') {
        yield { type: 'failed', code: `finish${last.finishReason}` };
        return;
      }
      const { rest, block } = split.end();
      if (rest) yield { type: 'delta', text: rest };
      yield { type: 'done', card: block.card, remember: block.remember, need: block.need, refused: block.refused, verdict: block.verdict, blockFound: block !== EMPTY_BLOCK };
    },
  };
}

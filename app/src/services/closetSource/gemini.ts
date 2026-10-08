// The live closet call (DEV builds with the dev key only, like the scoring read; beta goes through the Worker).
// Byte-for-byte what extraction-test/closet_test.py sends (the closet1 test that passed every bar, #90):
// gemini-3.8-flash, temperature 0, JSON with the closet schema, thinking off, the stub list in the prompt.
// One call (not streamed): 12 s timeout, and one retry 2 s later on a network error, 5xx, 429, a non-STOP finish
// or an answer that fails validation. Never in a Release build.
import promptFile from '../../../assets/gemini/prompt-closet-v1.json';
import schema from '../../../assets/gemini/schema-closet-v1.json';
import { AbortError, realScheduler, type Scheduler } from '../scheduler';
import type { PreparedImage } from '../readingSource/types';
import { stubText, validateClosetReading } from './validate';
import { CLOSET_PROMPT_VERSION, type ClosetFail, type ClosetResult, type ClosetSource, type ClosetStub } from './types';

export const CLOSET_MODEL = 'gemini-3.8-flash';
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
export const CLOSET_TIMEOUT_MS = 12_000;
export const CLOSET_RETRY_MS = 2_000;

/** The request body (pure; tested against closet_test.py's). */
export function buildClosetRequest(jpegBase64: string, stubs: readonly ClosetStub[]) {
  return {
    contents: [{ parts: [{ text: promptFile.prompt.replace('{STUBS}', stubText(stubs)) }, { inline_data: { mime_type: 'image/jpeg', data: jpegBase64 } }] }],
    generationConfig: { temperature: 0, responseMimeType: 'application/json', responseSchema: schema, thinkingConfig: { thinkingBudget: 0 } },
  };
}

export interface ClosetGeminiOptions {
  apiKey: string;
  fetch: (url: string, init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal }) => Promise<{
    ok: boolean;
    status: number;
    text(): Promise<string>;
  }>;
  scheduler?: Scheduler;
  now?: () => number;
  timeoutMs?: number;
  retryMs?: number;
  /** Once per finished call: latency and token counts (cost tracking). */
  onCall?: (info: { seconds: number; usage?: Record<string, number>; attempts: number; fail?: ClosetFail }) => void;
}

type Success = Extract<ClosetResult, { reading: unknown }>;
type Attempt = { ok: Success } | { fail: ClosetFail; retry: boolean };

export function createClosetGeminiSource(opts: ClosetGeminiOptions): ClosetSource {
  const scheduler = opts.scheduler ?? realScheduler;
  const now = opts.now ?? (() => Date.now());
  const timeoutMs = opts.timeoutMs ?? CLOSET_TIMEOUT_MS;

  async function attempt(base64: string, stubs: readonly ClosetStub[], outer?: AbortSignal): Promise<Attempt> {
    const ac = new AbortController();
    const onAbort = () => ac.abort();
    outer?.addEventListener('abort', onAbort, { once: true });
    let timedOut = false;
    const timer = scheduler.setTimer(() => {
      timedOut = true;
      ac.abort();
    }, timeoutMs);
    try {
      let res;
      try {
        res = await opts.fetch(`${BASE}/${CLOSET_MODEL}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': opts.apiKey },
          body: JSON.stringify(buildClosetRequest(base64, stubs)),
          signal: ac.signal,
        });
      } catch {
        if (timedOut) return { fail: 'timeout', retry: false };
        if (outer?.aborted) throw new AbortError();
        return { fail: 'offline', retry: true };
      }
      let body: string;
      try {
        body = await res.text();
      } catch {
        if (timedOut) return { fail: 'timeout', retry: false };
        if (outer?.aborted) throw new AbortError();
        return { fail: 'offline', retry: true };
      }
      if (!res.ok) return { fail: 'ai', retry: res.status >= 500 || res.status === 429 };
      let j: { candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]; usageMetadata?: Record<string, number>; modelVersion?: string };
      try {
        j = JSON.parse(body);
      } catch {
        return { fail: 'invalid', retry: true };
      }
      const c = j.candidates?.[0];
      if (c?.finishReason && c.finishReason !== 'STOP') return { fail: 'ai', retry: true };
      let parsed: unknown;
      try {
        parsed = JSON.parse((c?.content?.parts ?? []).map((p) => p.text ?? '').join(''));
      } catch {
        return { fail: 'invalid', retry: true };
      }
      const reading = validateClosetReading(parsed, stubs.length);
      if (!reading) return { fail: 'invalid', retry: true };
      return { ok: { reading, model: j.modelVersion ?? CLOSET_MODEL, promptVersion: CLOSET_PROMPT_VERSION, latencyMs: 0, usage: j.usageMetadata } };
    } finally {
      scheduler.clearTimer(timer);
      outer?.removeEventListener('abort', onAbort);
    }
  }

  return {
    async read(image: PreparedImage, stubs, _kind, o) {
      void _kind;
      const base64 = image.uploadBase64;
      if (!base64) return { fail: 'noUpload' };
      if (stubs.length === 0) return { reading: { garments: [] }, model: CLOSET_MODEL, promptVersion: CLOSET_PROMPT_VERSION, latencyMs: 0 };
      const t0 = now();
      let attempts = 0;
      let last: Attempt | null = null;
      try {
        for (;;) {
          attempts += 1;
          last = await attempt(base64, stubs, o?.signal);
          if ('ok' in last || !last.retry || attempts >= 2) break;
          await scheduler.sleep(opts.retryMs ?? CLOSET_RETRY_MS, o?.signal);
        }
      } catch (e) {
        if (e instanceof AbortError || o?.signal?.aborted) return { fail: 'timeout' };
        throw e;
      }
      const seconds = (now() - t0) / 1000;
      if ('ok' in last) {
        opts.onCall?.({ seconds, usage: last.ok.usage, attempts });
        return { ...last.ok, latencyMs: Math.round(seconds * 1000) };
      }
      opts.onCall?.({ seconds, attempts, fail: last.fail });
      return { fail: last.fail };
    },
  };
}

// DirectGeminiSource (05 §P3 D, app-build-spec §3): the real vision reading for DEV builds on
// the founder's own phone or Simulator. The request is the Oct 6 lock, byte-for-byte what
// `run_test.py --format v3 --thinking off` sends: gemini-3.8-flash, temperature 0, JSON with the
// v3 schema, thinking off. With close-ups (#104) the same call also carries photo prep's face-hidden upper- and
// lower-body crops, labelled "Image 1:" … and explained by one line from prompt-zoom.json (zoom_test.py, arm B).
// Streamed (SSE) so each garment's pill appears as it's read. Beta
// builds use the Worker proxy instead (M4); this file never runs in a Release build.
import type { Garment, Reading } from '@kitted/core';
import promptFile from '../../../assets/gemini/prompt-v3.json';
import zoomFile from '../../../assets/gemini/prompt-zoom.json';
import schema from '../../../assets/gemini/schema-v3.json';
import { AbortError } from '../scheduler';
import type { FailCode, PreparedImage, ReadingEvent, ReadingSource, ReadKind, SlotKind } from './types';

export const GEMINI_MODEL = 'gemini-3.8-flash';
export const PROMPT_VERSION = 'v3';
/** The same v3 answer format, read with close-ups (#104). */
export const PROMPT_VERSION_ZOOM = 'v3z';
/** Send photo prep's close-ups with the upload (#104: boots no longer read as slides, tops 80% → 100%, consistency
 *  64/66 vs 60/66; 0.39 → 0.57¢ and +0.5 s per check). false = exactly the Oct 6 lock. */
export const SEND_CLOSE_UPS = true;
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/** The request body (pure, tested against run_test.py's and zoom_test.py's). No close-ups: exactly the Oct 6 lock. */
export function buildRequest(jpegBase64: string, zoomBase64: readonly string[] = []) {
  const images = [jpegBase64, ...zoomBase64.slice(0, 2)];
  const jpeg = (data: string) => ({ inline_data: { mime_type: 'image/jpeg', data } });
  const parts = images.length === 1
    ? [{ text: promptFile.prompt }, jpeg(jpegBase64)]
    : [
        { text: `${promptFile.prompt}\n${images.length === 3 ? zoomFile.three : zoomFile.two}` },
        ...images.flatMap((data, i) => [{ text: `Image ${i + 1}:` }, jpeg(data)]),
      ];
  return {
    contents: [{ parts }],
    generationConfig: { temperature: 0, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 }, responseSchema: schema },
  };
}

export interface StreamChunk {
  text: string;
  finishReason?: string;
  modelVersion?: string;
  usage?: Record<string, number>;
}

/** Splits an SSE buffer into complete `data:` payloads; returns them and the unfinished rest. */
export function parseSse(buffer: string): { chunks: StreamChunk[]; rest: string } {
  const chunks: StreamChunk[] = [];
  const events = buffer.split(/\r?\n\r?\n/);
  const rest = events.pop() ?? '';
  for (const ev of events) {
    const data = ev.split(/\r?\n/).filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).join('');
    if (!data) continue;
    try {
      const j = JSON.parse(data) as {
        candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
        modelVersion?: string;
        usageMetadata?: Record<string, number>;
      };
      const c = j.candidates?.[0];
      chunks.push({
        text: (c?.content?.parts ?? []).map((p) => p.text ?? '').join(''),
        finishReason: c?.finishReason,
        modelVersion: j.modelVersion,
        usage: j.usageMetadata,
      });
    } catch {
      // a malformed event is skipped; the final JSON parse decides success
    }
  }
  return { chunks, rest };
}

/** Garment objects already complete in a partial `{"scene":…,"garments":[…` answer, in order. */
export function completedGarments(partial: string): Garment[] {
  const key = partial.indexOf('"garments"');
  if (key < 0) return [];
  const open = partial.indexOf('[', key);
  if (open < 0) return [];
  const out: Garment[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;
  for (let i = open + 1; i < partial.length; i++) {
    const ch = partial[i]!;
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') {
      if (depth === 0) start = i;
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        try {
          out.push(JSON.parse(partial.slice(start, i + 1)) as Garment);
        } catch {
          return out;
        }
        start = -1;
      }
    } else if (ch === ']' && depth === 0) break;
  }
  return out;
}

const SLOT: Record<string, SlotKind> = { top: 'top', outerwear: 'outerwear', bottom: 'bottom', footwear: 'footwear' };

export interface GeminiOptions {
  apiKey: string;
  /** Streaming fetch (expo/fetch on device); injected for tests. */
  fetch: (url: string, init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal }) => Promise<{
    ok: boolean;
    status: number;
    body: { getReader(): { read(): Promise<{ done: boolean; value?: Uint8Array }>; cancel?(): Promise<void> } } | null;
    text(): Promise<string>;
  }>;
  now?: () => number;
  /** Called once per finished call: latency, model and token counts (cost tracking, S1). */
  onCall?: (info: { seconds: number; model?: string; usage?: Record<string, number>; finishReason?: string; hedged: boolean }) => void;
}

type Attempt = { reading: Reading; usage?: Record<string, number>; model?: string; finishReason?: string } | { fail: FailCode };

/** The minimum a reply must have to be scored: an object with a garments list of objects. */
export function isReadingShape(x: unknown): x is Reading {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return false;
  const g = (x as { garments?: unknown }).garments;
  return Array.isArray(g) && g.every((item) => !!item && typeof item === 'object' && !Array.isArray(item));
}

/** "[gemini] refused · HTTP 429 · RESOURCE_EXHAUSTED · You exceeded your current quota…" (DEV log, ≤ 2 s for the body). */
async function logRefusal(res: { status: number; text(): Promise<string> }): Promise<void> {
  let detail = '';
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const body = await Promise.race([res.text(), new Promise<string>((r) => (timer = setTimeout(() => r(''), 2_000)))]);
    const err = (JSON.parse(body || '{}') as { error?: { status?: string; message?: string } }).error;
    detail = [err?.status, err?.message?.slice(0, 160)].filter(Boolean).join(' · ');
  } catch {
    // not JSON: the status is enough
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
  console.log(`[gemini] refused · HTTP ${res.status}${detail ? ` · ${detail}` : ''}`);
}

export function createGeminiSource(opts: GeminiOptions): ReadingSource {
  const now = opts.now ?? (() => Date.now());
  let hedgeRequested: (() => void) | null = null;

  async function stream(base64: string, zoom: readonly string[], signal: AbortSignal, onGarment: (g: Garment) => void): Promise<Attempt> {
    let res;
    try {
      res = await opts.fetch(`${BASE}/${GEMINI_MODEL}:streamGenerateContent?alt=sse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': opts.apiKey },
        body: JSON.stringify(buildRequest(base64, zoom)),
        signal,
      });
    } catch (e) {
      if (signal.aborted) throw new AbortError();
      void e;
      return { fail: 'offline' };
    }
    if (!res.ok || !res.body) {
      // DEV: why Gemini said no (429 = quota or rate limit, 403 = key or billing, 400 = the request), so a test on his
      // phone can tell a refused call from a slow one in the Metro log. The key is never printed.
      if (__DEV__) void logRefusal(res);
      return { fail: 'ai' };
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let text = '';
    let seen = 0;
    let last: StreamChunk | undefined;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const parsed = parseSse(buf + decoder.decode(value, { stream: true }));
        buf = parsed.rest;
        for (const c of parsed.chunks) {
          text += c.text;
          last = { ...last, ...c, text: '' };
          const gs = completedGarments(text);
          for (const g of gs.slice(seen)) onGarment(g);
          seen = Math.max(seen, gs.length);
        }
      }
    } catch (e) {
      if (signal.aborted) throw new AbortError();
      void e;
      return { fail: 'offline' };
    }
    if (buf.trim()) {
      for (const c of parseSse(buf + '\n\n').chunks) {
        text += c.text;
        last = { ...last, ...c, text: '' };
      }
    }
    if (last?.finishReason && last.finishReason !== 'STOP') return { fail: 'ai' }; // MAX_TOKENS, SAFETY…
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { fail: 'ai' };
    }
    // A reply that parses but isn't a reading (no garments list) is "couldn't score this one", never a crash later.
    if (!isReadingShape(parsed)) return { fail: 'ai' };
    return { reading: parsed, usage: last?.usage, model: last?.modelVersion, finishReason: last?.finishReason };
  }

  return {
    hedge() {
      hedgeRequested?.();
    },
    async *read(image: PreparedImage, _kind: ReadKind, o?: { signal?: AbortSignal }): AsyncGenerator<ReadingEvent> {
      void _kind; // re-check and shoe snap send the same full read; core merges the parts
      const base64 = image.uploadBase64;
      const zoom = SEND_CLOSE_UPS ? image.zoomBase64 ?? [] : [];
      if (!base64) {
        yield { type: 'failed', code: 'unknownPhoto', counted: false };
        return;
      }
      const t0 = now();

      // Two attempts at most (the original + one hedge, ruling 19). The first to finish wins;
      // the other is aborted. Garments stream from whichever attempt is ahead.
      const queue: ReadingEvent[] = [];
      let wake: (() => void) | null = null;
      const push = (e: ReadingEvent) => {
        queue.push(e);
        wake?.();
      };
      const slotsShown = new Set<SlotKind>();
      const onGarment = (g: Garment) => {
        const slot = typeof g.category === 'string' ? SLOT[g.category] : undefined;
        if (!slot || g.certainty === 'unsure' || slotsShown.has(slot)) return;
        slotsShown.add(slot);
        push({ type: 'slotFound', slot, garment: g });
      };
      const controllers: AbortController[] = [];
      const outer = o?.signal;
      const startAttempt = () => {
        const ac = new AbortController();
        controllers.push(ac);
        if (outer) outer.addEventListener('abort', () => ac.abort(), { once: true });
        return stream(base64, zoom, ac.signal, onGarment);
      };
      let hedged = false;
      const attempts: Promise<Attempt>[] = [startAttempt()];
      hedgeRequested = () => {
        if (hedged || outer?.aborted) return;
        hedged = true;
        attempts.push(startAttempt());
        wake?.();
      };

      let result: Attempt | null = null;
      let settled = 0;
      const settle = (p: Promise<Attempt>) =>
        p.then(
          (a) => {
            settled += 1;
            // A success wins at once; a failure only when every attempt has failed.
            if ('reading' in a ? !result || !('reading' in result) : !result) result = a;
            wake?.();
          },
          () => {
            settled += 1;
            wake?.();
          },
        );
      settle(attempts[0]!);
      let watched = 1;
      // An abort (the service's 14 s give-up, cancel) wakes the wait at once, whatever the fetch does with it.
      const onAbort = () => wake?.();
      outer?.addEventListener('abort', onAbort, { once: true });
      try {
        // The request is already on its way (and the hedge hook set) before the first event.
        yield { type: 'stage', stage: 'photoOK' };
        yield { type: 'stage', stage: 'sending', expectedSlots: 4 };
        for (;;) {
          while (watched < attempts.length) settle(attempts[watched++]!);
          while (queue.length) yield queue.shift()!;
          const success = result && 'reading' in result;
          if (success || settled === attempts.length) break;
          if (outer?.aborted) return;
          await new Promise<void>((r) => (wake = r));
          wake = null;
        }
        while (queue.length) yield queue.shift()!;
      } finally {
        outer?.removeEventListener('abort', onAbort);
        hedgeRequested = null;
        controllers.forEach((c) => c.abort());
      }
      if (outer?.aborted) return;
      const seconds = (now() - t0) / 1000;
      const final = result as Attempt | null;
      if (!final || 'fail' in final) {
        yield { type: 'failed', code: final && 'fail' in final ? final.fail : 'ai', counted: false };
        return;
      }
      opts.onCall?.({ seconds, model: final.model, usage: final.usage, finishReason: final.finishReason, hedged });
      const reading = final.reading;
      for (const g of reading.garments ?? []) onGarment(g); // anything the stream didn't show yet
      while (queue.length) yield queue.shift()!;
      if (reading.scene?.framing === 'upper_only') yield { type: 'slotMissing', slot: 'bottom' };
      else if (reading.scene?.shoes_visible === false || !slotsShown.has('footwear')) yield { type: 'slotMissing', slot: 'footwear' };
      yield { type: 'stage', stage: 'fit' };
      yield { type: 'stage', stage: 'color' };
      yield { type: 'reading', reading, model: final.model ?? GEMINI_MODEL, promptVersion: zoom.length > 0 ? PROMPT_VERSION_ZOOM : PROMPT_VERSION };
      yield { type: 'meta', latencySeconds: seconds };
    },
  };
}

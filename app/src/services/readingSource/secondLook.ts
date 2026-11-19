// The second look (look1, DECISIONS-LOG #199; extraction-test/look_test.py): two narrow Gemini calls, separate from
// the scoring call and fired next to it, each on ONE face-hidden close-up photo prep already cut:
//   U  prompt_look_u.txt + schema_look_u.json on the upper close-up: a top under the outer piece, and does it peek below
//   L  prompt_look_l.txt + schema_look_l.json on the lower close-up: does the pant fabric rest on the shoe
//   W  prompt_look_w.txt + schema_look_w.json on the same lower close-up (T69, #482-#484): how wide the leg is at the
//      knee and at the opening; asked only for pants, read by the engine only as a tie-break
// The request is look_test.py's (b1_test.call): gemini-3.8-flash, temperature 0, JSON with the arm's schema, thinking
// off, the prompt then the one image. One attempt per arm, no retry and no hedge (a retry would land after the card).
// The shoulder-seam arm (US) failed and is not shipped. Sent like the scoring read: the dev key on a dev build, our
// server's /v1/look otherwise, tagged with the check's id (13-server.md §8).
import promptL from '../../../assets/gemini/prompt-look-l.json';
import promptU from '../../../assets/gemini/prompt-look-u.json';
import promptW from '../../../assets/gemini/prompt-look-w.json';
import schemaL from '../../../assets/gemini/schema-look-l.json';
import schemaU from '../../../assets/gemini/schema-look-u.json';
import schemaW from '../../../assets/gemini/schema-look-w.json';
import type { LookAnswerL, LookAnswerU, LookAnswerW, LookArm } from '@/data/types';
import { realScheduler, type Scheduler } from '../scheduler';
import { directTransport, type AiFetch, type AiTransport, type CheckTag } from '../server/transport';
import type { LookFail, LookResult } from './types';

export const LOOK_MODEL = 'gemini-3.8-flash';
export const LOOK_VERSION = 'look1';
/** A single look call gives up after this (the check itself stops waiting much sooner: the grace in the service). */
export const LOOK_TIMEOUT_MS = 12_000;
/** Gemini 3.8 Flash list prices, $ per token (b1_test.py PRICE_IN / PRICE_OUT). */
export const LOOK_PRICE_IN = 0.75 / 1e6;
export const LOOK_PRICE_OUT = 3.75 / 1e6;

type Schema = { properties: Record<string, { enum?: string[] }>; required: string[] };
const ARMS: Record<LookArm, { prompt: string; schema: Schema }> = {
  U: { prompt: promptU.prompt, schema: schemaU as Schema },
  L: { prompt: promptL.prompt, schema: schemaL as Schema },
  W: { prompt: promptW.prompt, schema: schemaW as Schema },
};

/** The bottoms the leg-width look W is asked for (leg_look.py PANTS): never shorts, skirts or no bottom. */
export const LOOK_W_PANTS: ReadonlySet<string> = new Set([
  'jeans', 'trousers', 'chinos', 'cargos', 'suit_trousers', 'drawstring_trousers', 'joggers', 'sweatpants', 'track_pants',
]);

/** The request body for one arm (pure; tested against look_test.py's). */
export function buildLookRequest(arm: LookArm, jpegBase64: string) {
  return {
    contents: [{ parts: [{ text: ARMS[arm].prompt }, { inline_data: { mime_type: 'image/jpeg', data: jpegBase64 } }] }],
    generationConfig: { temperature: 0, responseMimeType: 'application/json', responseSchema: ARMS[arm].schema, thinkingConfig: { thinkingBudget: 0 } },
  };
}

/** The close-up each arm reads (look_test.image_for): prep's [upper, lower], or its one close-up of the whole person
 *  for both. null without close-ups (then no second look runs). */
export function lookImages(zoom: readonly string[] | undefined): Record<LookArm, string> | null {
  if (!zoom || zoom.length === 0 || !zoom[0]) return null;
  // W reads L's image: the lower close-up, or the one close-up of the whole person
  return zoom.length >= 2 && zoom[1] ? { U: zoom[0], L: zoom[1], W: zoom[1] } : { U: zoom[0], L: zoom[0], W: zoom[0] };
}

/** An answer with every required field present and inside its enum, trimmed to the schema's fields; else null. */
export function validateLook(arm: 'U', x: unknown): LookAnswerU | null;
export function validateLook(arm: 'L', x: unknown): LookAnswerL | null;
export function validateLook(arm: 'W', x: unknown): LookAnswerW | null;
export function validateLook(arm: LookArm, x: unknown): LookAnswerU | LookAnswerL | LookAnswerW | null {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return null;
  const { properties, required } = ARMS[arm].schema;
  const out: Record<string, string> = {};
  for (const k of required) {
    const v = (x as Record<string, unknown>)[k];
    if (typeof v !== 'string' || !(properties[k]?.enum ?? []).includes(v)) return null;
    out[k] = v;
  }
  return out as unknown as LookAnswerU | LookAnswerL | LookAnswerW;
}

/** One call's cost in cents from its token counts (null without usage). */
export function lookCents(usage: Record<string, number> | undefined): number | null {
  if (!usage) return null;
  return 100 * ((usage.promptTokenCount ?? 0) * LOOK_PRICE_IN + (usage.candidatesTokenCount ?? 0) * LOOK_PRICE_OUT);
}

/** The two yes/no answers the engine scores (parts_proto._second_look), for the log lines. */
export const peekOf = (u: LookAnswerU | null): boolean | null => (u ? u.under_present === 'yes' && u.under_shows !== 'no' : null);
export const restsOf = (l: LookAnswerL | null): boolean | null =>
  !l ? null : l.covers_shoe === 'partly' || l.covers_shoe === 'mostly' ? true : l.covers_shoe === 'no' ? false : null;
/** What W says in a word, as parts_proto's leg-look class: wide (hangs away or a wider opening), slim (clings or
 *  narrower, nothing wide), straight, or unknown (nothing seen). */
export const legOf = (w: LookAnswerW | null): 'wide' | 'slim' | 'straight' | 'unknown' | null => {
  if (!w) return null;
  const { knee, opening } = w;
  if (knee === 'not_visible' && opening === 'not_visible') return 'unknown';
  if (knee === 'hangs_away' || opening === 'wider') return 'wide';
  if ((knee === 'clings' || knee === 'not_visible') && (opening === 'narrower' || opening === 'not_visible')) return 'slim';
  return 'straight';
};
const yn = (b: boolean | null) => (b === null ? 'unknown' : b ? 'yes' : 'no');

/** "[look] U ok · peek yes · 612 ms · 0.126¢" (the line routedSource prints). */
export function lookLogLine(arm: LookArm, r: LookResult<LookAnswerU | LookAnswerL | LookAnswerW>): string {
  if (!r.ok) return `[look] ${arm} ${r.fail === 'aborted' ? 'dropped (the card stopped waiting)' : `failed ${r.fail}`} · ${r.ms} ms`;
  const what = arm === 'U' ? `peek ${yn(peekOf(r.answer as LookAnswerU))}` : arm === 'W' ? `leg ${legOf(r.answer as LookAnswerW)}` : `rests ${yn(restsOf(r.answer as LookAnswerL))}`;
  return `[look] ${arm} ok · ${what} · ${r.ms} ms${r.cents !== null ? ` · ${r.cents.toFixed(3)}¢` : ''}`;
}

export interface LookGeminiOptions {
  /** Our server or Gemini with the dev key (services/server); without it, `apiKey` + `fetch` (the tests). */
  transport?: AiTransport;
  apiKey?: string;
  fetch?: (url: string, init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal }) => Promise<{
    ok: boolean;
    status: number;
    text(): Promise<string>;
  }>;
  scheduler?: Scheduler;
  now?: () => number;
  timeoutMs?: number;
  /** Once per finished call (cost tracking and the [look] log line). */
  onCall?: (arm: LookArm, result: LookResult<LookAnswerU | LookAnswerL | LookAnswerW>, usage?: Record<string, number>) => void;
}

export interface LookGemini {
  /** One arm's call. Never rejects: every failure is a { ok: false } result. */
  arm(arm: 'U', jpegBase64: string, signal?: AbortSignal, tag?: CheckTag): Promise<LookResult<LookAnswerU>>;
  arm(arm: 'L', jpegBase64: string, signal?: AbortSignal, tag?: CheckTag): Promise<LookResult<LookAnswerL>>;
  arm(arm: 'W', jpegBase64: string, signal?: AbortSignal, tag?: CheckTag): Promise<LookResult<LookAnswerW>>;
}

export function createLookGemini(opts: LookGeminiOptions): LookGemini {
  const scheduler = opts.scheduler ?? realScheduler;
  const now = opts.now ?? (() => Date.now());
  const timeoutMs = opts.timeoutMs ?? LOOK_TIMEOUT_MS;
  const transport = opts.transport ?? directTransport(opts.apiKey ?? '', opts.fetch as unknown as AiFetch);

  async function call(arm: LookArm, base64: string, outer?: AbortSignal, tag?: CheckTag): Promise<LookResult<LookAnswerU | LookAnswerL | LookAnswerW>> {
    const t0 = now();
    const ac = new AbortController();
    const onAbort = () => ac.abort();
    if (outer?.aborted) return { ok: false, fail: 'aborted', ms: 0 };
    outer?.addEventListener('abort', onAbort, { once: true });
    let timedOut = false;
    const timer = scheduler.setTimer(() => {
      timedOut = true;
      ac.abort();
    }, timeoutMs);
    let usage: Record<string, number> | undefined;
    const fail = (f: LookFail): LookResult<never> => ({ ok: false, fail: timedOut ? 'timeout' : outer?.aborted ? 'aborted' : f, ms: Math.round(now() - t0) });
    const done = (r: LookResult<LookAnswerU | LookAnswerL | LookAnswerW>) => {
      opts.onCall?.(arm, r, usage);
      return r;
    };
    try {
      let res;
      let body: string;
      try {
        res = await transport.send({ route: 'look', model: LOOK_MODEL, stream: false, body: JSON.stringify(buildLookRequest(arm, base64)), signal: ac.signal, ...(tag ? { tag } : {}) });
        body = await res.text();
      } catch {
        return done(fail('offline'));
      }
      if (!res.ok) return done(fail('ai'));
      let j: { candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]; usageMetadata?: Record<string, number> };
      try {
        j = JSON.parse(body);
      } catch {
        return done(fail('invalid'));
      }
      usage = j.usageMetadata;
      const c = j.candidates?.[0];
      if (c?.finishReason && c.finishReason !== 'STOP') return done(fail('ai'));
      let parsed: unknown;
      try {
        parsed = JSON.parse((c?.content?.parts ?? []).map((p) => p.text ?? '').join(''));
      } catch {
        return done(fail('invalid'));
      }
      const answer = arm === 'U' ? validateLook('U', parsed) : arm === 'W' ? validateLook('W', parsed) : validateLook('L', parsed);
      if (!answer) return done(fail('invalid'));
      return done({ ok: true, answer, ms: Math.round(now() - t0), cents: lookCents(usage) });
    } catch {
      return done(fail('ai'));
    } finally {
      scheduler.clearTimer(timer);
      outer?.removeEventListener('abort', onAbort);
    }
  }

  return { arm: call as LookGemini['arm'] };
}

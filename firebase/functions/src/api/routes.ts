// The routes and the shape check (handoff/13-server.md §1–2, check P5; OpenAI §11, O1). The app sends the request it
// builds today (Gemini's, or OpenAI's Responses API for questions on GPT-5.6 Luna); the server forwards it only if it
// has the route's shape, with the output cap set. The model decides the company.

export type RouteName = 'read' | 'look' | 'closet' | 'ask';
export type Kind = 'full' | 'recheck' | 'snap';

export interface Route {
  name: RouteName;
  /** First = the default. */
  models: readonly string[];
  stream: boolean;
  maxImages: number;
  maxBytes: number;
  maxOutputTokens: number;
  systemInstruction: boolean;
  /** A photo route: it names a check id and kind and counts against checks. */
  photo: boolean;
}

const MB = 1024 * 1024;

export const ROUTES: Record<RouteName, Route> = {
  read: { name: 'read', models: ['gemini-3.8-flash'], stream: true, maxImages: 3, maxBytes: 8 * MB, maxOutputTokens: 8192, systemInstruction: false, photo: true },
  look: { name: 'look', models: ['gemini-3.8-flash'], stream: false, maxImages: 1, maxBytes: 4 * MB, maxOutputTokens: 2048, systemInstruction: false, photo: true },
  closet: { name: 'closet', models: ['gemini-3.8-flash'], stream: false, maxImages: 1, maxBytes: 4 * MB, maxOutputTokens: 8192, systemInstruction: false, photo: true },
  ask: { name: 'ask', models: ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gpt-5.6-luna'], stream: true, maxImages: 0, maxBytes: 64 * 1024, maxOutputTokens: 1024, systemInstruction: true, photo: false },
};

export type Provider = 'gemini' | 'openai';
/** Who serves a model: OpenAI's GPT models, else Gemini. */
export const providerOf = (model: string): Provider => (model.startsWith('gpt-') ? 'openai' : 'gemini');

export const CHECK_ID = /^[A-Za-z0-9_-]{1,64}$/;
export const KINDS: readonly Kind[] = ['full', 'recheck', 'snap'];

export type Shape = { ok: true; model: string; body: string } | { ok: false; reason: string };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isText = (p: Record<string, unknown>) => Object.keys(p).length === 1 && typeof p.text === 'string';

/** Checks one request body for a route and returns what goes to Gemini (P5). Size is checked by the caller. */
export function checkShape(route: Route, raw: string, modelParam: string | null): Shape {
  const model = modelParam ?? route.models[0]!;
  if (!route.models.includes(model)) return { ok: false, reason: 'model' };
  if (providerOf(model) === 'openai') return checkOpenAI(route, raw, model);
  let req: unknown;
  try {
    req = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'json' };
  }
  if (!isObj(req)) return { ok: false, reason: 'json' };
  const allowed = route.systemInstruction ? ['contents', 'generationConfig', 'systemInstruction'] : ['contents', 'generationConfig'];
  for (const k of Object.keys(req)) if (!allowed.includes(k)) return { ok: false, reason: `field:${k}` };

  const contents = req.contents;
  if (!Array.isArray(contents) || contents.length === 0 || contents.length > 8) return { ok: false, reason: 'contents' };
  let images = 0;
  for (const c of contents) {
    if (!isObj(c) || !Object.keys(c).every((k) => k === 'role' || k === 'parts')) return { ok: false, reason: 'contents' };
    if (c.role !== undefined && c.role !== 'user' && c.role !== 'model') return { ok: false, reason: 'role' };
    if (!Array.isArray(c.parts) || c.parts.length === 0 || c.parts.length > 16) return { ok: false, reason: 'parts' };
    for (const p of c.parts) {
      if (!isObj(p)) return { ok: false, reason: 'parts' };
      if (isText(p)) continue;
      const keys = Object.keys(p);
      const inline = p.inline_data ?? p.inlineData;
      if (keys.length !== 1 || !isObj(inline)) return { ok: false, reason: `part:${keys[0] ?? '?'}` };
      const mime = inline.mime_type ?? inline.mimeType;
      if (mime !== 'image/jpeg') return { ok: false, reason: 'mime' };
      if (typeof inline.data !== 'string' || !Object.keys(inline).every((k) => ['mime_type', 'mimeType', 'data'].includes(k))) {
        return { ok: false, reason: 'part:inline' };
      }
      images += 1;
    }
  }
  if (images > route.maxImages) return { ok: false, reason: 'images' };

  if (req.systemInstruction !== undefined) {
    const si = req.systemInstruction;
    if (!isObj(si) || !Array.isArray(si.parts) || !si.parts.every((p) => isObj(p) && isText(p))) return { ok: false, reason: 'systemInstruction' };
  }

  const gc = req.generationConfig ?? {};
  if (!isObj(gc)) return { ok: false, reason: 'generationConfig' };
  if (gc.candidateCount !== undefined && gc.candidateCount !== 1) return { ok: false, reason: 'candidateCount' };
  const asked = typeof gc.maxOutputTokens === 'number' && gc.maxOutputTokens > 0 ? gc.maxOutputTokens : route.maxOutputTokens;
  const out = { ...req, generationConfig: { ...gc, maxOutputTokens: Math.min(asked, route.maxOutputTokens) } };
  return { ok: true, model, body: JSON.stringify(out) };
}

const OPENAI_FIELDS = ['model', 'instructions', 'input', 'max_output_tokens', 'reasoning', 'temperature', 'stream', 'store'];
const EFFORTS = ['none', 'minimal', 'low'];

/** OpenAI's Responses API, text only (13 §11, O1): what createAskOpenAI sends, nothing that reaches past one answer. */
function checkOpenAI(route: Route, raw: string, model: string): Shape {
  let req: unknown;
  try {
    req = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'json' };
  }
  if (!isObj(req)) return { ok: false, reason: 'json' };
  for (const k of Object.keys(req)) if (!OPENAI_FIELDS.includes(k)) return { ok: false, reason: `field:${k}` };
  if (req.model !== model) return { ok: false, reason: 'model' };
  if (req.stream !== route.stream) return { ok: false, reason: 'stream' };
  if (req.instructions !== undefined && typeof req.instructions !== 'string') return { ok: false, reason: 'instructions' };
  if (req.temperature !== undefined && typeof req.temperature !== 'number') return { ok: false, reason: 'temperature' };
  if (req.reasoning !== undefined) {
    const r = req.reasoning;
    if (!isObj(r) || !Object.keys(r).every((k) => k === 'effort') || (r.effort !== undefined && !EFFORTS.includes(String(r.effort)))) {
      return { ok: false, reason: 'reasoning' };
    }
  }
  const input = req.input;
  if (!Array.isArray(input) || input.length === 0 || input.length > 16) return { ok: false, reason: 'input' };
  for (const m of input) {
    if (!isObj(m) || !Object.keys(m).every((k) => k === 'role' || k === 'content' || k === 'type')) return { ok: false, reason: 'input' };
    if (m.type !== undefined && m.type !== 'message') return { ok: false, reason: `input:${String(m.type)}` };
    if (m.role !== 'user' && m.role !== 'assistant') return { ok: false, reason: 'role' };
    if (typeof m.content === 'string') continue;
    if (!Array.isArray(m.content) || m.content.length === 0) return { ok: false, reason: 'content' };
    for (const part of m.content) {
      const ok = isObj(part) && Object.keys(part).every((k) => k === 'type' || k === 'text')
        && (part.type === 'input_text' || part.type === 'output_text') && typeof part.text === 'string';
      if (!ok) return { ok: false, reason: `part:${isObj(part) ? String(part.type) : '?'}` };
    }
  }
  const asked = typeof req.max_output_tokens === 'number' && req.max_output_tokens > 0 ? req.max_output_tokens : route.maxOutputTokens;
  const out = { ...req, store: false, max_output_tokens: Math.min(asked, route.maxOutputTokens) };
  return { ok: true, model, body: JSON.stringify(out) };
}

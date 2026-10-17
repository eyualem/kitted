// The AI proxy (handoff/13-server.md): sign-in → App Check → shape → spending stop → today's allowance → Gemini with
// the server's key → the answer relayed as it arrives → spend and allowance settled. Never stores or logs a photo,
// a question or an answer (check D1). Written against Node's request/response so the tests can run it in-process.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { costCents } from './prices';
import { CHECK_ID, KINDS, ROUTES, checkShape, type Kind, type RouteName } from './routes';
import { readReply, sseScanner, type Seen } from './sse';
import { parseTz } from './limits';
import type { Store, Ticket } from './store';

export interface ApiDeps {
  store: Store;
  /** Firebase sign-in token → uid; throws when it isn't valid. */
  verifyIdToken(token: string): Promise<{ uid: string }>;
  /** Throws when the App Check token isn't valid. */
  verifyAppCheck(token: string): Promise<void>;
  geminiKey(): string;
  /** https://generativelanguage.googleapis.com, or a fake in tests. */
  geminiBase: string;
  fetch: typeof fetch;
  now(): number;
  /** One line per call: ids, timings and counts only. */
  log(entry: Record<string, unknown>): void;
}

export type ApiRequest = IncomingMessage & { rawBody?: Buffer };

const header = (req: IncomingMessage, name: string): string | undefined => {
  const v = req.headers[name];
  return Array.isArray(v) ? v[0] : v;
};

function send(res: ServerResponse, status: number, body: Record<string, unknown>) {
  if (res.headersSent) {
    res.end();
    return;
  }
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage, cap: number): Promise<Buffer | null> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > cap) return null;
    chunks.push(c as Buffer);
  }
  return Buffer.concat(chunks);
}

export function createApi(deps: ApiDeps) {
  return async function handle(req: ApiRequest, res: ServerResponse): Promise<void> {
    const t0 = deps.now();
    const url = new URL(req.url ?? '/', 'http://local');
    const at = url.pathname.indexOf('/v1/');
    const name = at >= 0 ? url.pathname.slice(at + 4) : '';

    if (name === 'health') {
      if (req.method !== 'GET') return send(res, 405, { error: 'method' });
      return send(res, 200, { ok: true });
    }
    const route = (Object.keys(ROUTES) as RouteName[]).includes(name as RouteName) ? ROUTES[name as RouteName] : null;
    if (!route) return send(res, 404, { error: 'notFound' });
    if (req.method !== 'POST') return send(res, 405, { error: 'method' });

    // Who's asking (P2).
    const bearer = /^Bearer (.+)$/.exec(header(req, 'authorization') ?? '')?.[1];
    let uid: string;
    try {
      if (!bearer) throw new Error('none');
      uid = (await deps.verifyIdToken(bearer)).uid;
    } catch {
      return send(res, 401, { error: 'signIn' });
    }
    const config = await deps.store.config();
    const appCheck = header(req, 'x-firebase-appcheck');
    if (appCheck || config.enforceAppCheck) {
      try {
        if (!appCheck) throw new Error('none');
        await deps.verifyAppCheck(appCheck);
      } catch {
        return send(res, 401, { error: 'appCheck' });
      }
    }

    // The shape (P5).
    const declared = Number(header(req, 'content-length') ?? 0);
    if (declared > route.maxBytes) return send(res, 413, { error: 'tooBig' });
    const raw = req.rawBody ?? (await readBody(req, route.maxBytes));
    if (!raw || raw.length > route.maxBytes) return send(res, 413, { error: 'tooBig' });
    let checkId: string | undefined;
    let kind: Kind | undefined;
    if (route.photo) {
      checkId = header(req, 'x-kitted-check');
      kind = header(req, 'x-kitted-kind') as Kind | undefined;
      if (!checkId || !CHECK_ID.test(checkId)) return send(res, 400, { error: 'badRequest', reason: 'checkId' });
      if (!kind || !KINDS.includes(kind)) return send(res, 400, { error: 'badRequest', reason: 'kind' });
    }
    const shape = checkShape(route, raw.toString('utf8'), url.searchParams.get('model'));
    if (!shape.ok) return send(res, 400, { error: 'badRequest', reason: shape.reason });

    // The spending stop (M2), then today's allowance (L1–L10).
    const utcDay = new Date(t0).toISOString().slice(0, 10);
    if ((await deps.store.spentCents(utcDay)) >= config.spendCapCents) {
      deps.log({ route: route.name, uid, outcome: 'paused' });
      return send(res, 503, { error: 'paused' });
    }
    const tap = route.name === 'ask' && header(req, 'x-kitted-free') === 'tap';
    const { result, day } = await deps.store.reserve({
      uid, route: route.name, checkId, kind, tap, tz: parseTz(header(req, 'x-kitted-tz')), tier: config.tier, nowMs: t0,
    });
    if (!result.ok) {
      deps.log({ route: route.name, uid, outcome: 'limit', which: result.which });
      return send(res, 429, { error: 'limit', which: result.which });
    }
    const ticket: Ticket = { uid, day, took: result.took };

    // Gemini, with our key and nothing the app sent but the checked body (P4).
    const ac = new AbortController();
    let stopped: 'timeout' | 'client' | null = null;
    const timer = setTimeout(() => {
      stopped = 'timeout';
      ac.abort();
    }, config.timeoutMs);
    res.on('close', () => {
      if (!res.writableFinished && !stopped) {
        stopped = 'client';
        ac.abort();
      }
    });
    const method = route.stream ? 'streamGenerateContent?alt=sse' : 'generateContent';
    let seen: Seen = {};
    let outcome = 'ok';
    let upstreamStatus: number | undefined;
    let finished = false;
    // Settle before the app's answer ends, so a retry right after a failure finds the check given back: the spend
    // (whatever was billed), then the allowance (only a finished answer keeps it).
    let settled = false;
    const settle = async () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const cents = costCents(shape.model, seen.usage, t0);
      try {
        if (cents > 0) await deps.store.addSpend(utcDay, cents);
      } finally {
        await deps.store.finish(ticket, finished);
      }
      deps.log({
        route: route.name, uid, model: shape.model, ms: deps.now() - t0, outcome, status: upstreamStatus,
        tokensIn: seen.usage?.promptTokenCount, tokensOut: seen.usage?.candidatesTokenCount, thinking: seen.usage?.thoughtsTokenCount,
        cents: Math.round(cents * 1000) / 1000,
      });
    };
    try {
      const up = await deps.fetch(`${deps.geminiBase}/v1beta/models/${shape.model}:${method}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': deps.geminiKey() },
        body: shape.body,
        signal: ac.signal,
      });
      upstreamStatus = up.status;
      if (!up.ok || !up.body) {
        await up.text().catch(() => '');
        outcome = 'upstream';
        await settle();
        send(res, 502, { error: 'upstream', status: up.status });
      } else if (route.stream) {
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache, no-transform', 'x-accel-buffering': 'no', 'x-kitted-tier': config.tier });
        res.flushHeaders();
        const scan = sseScanner();
        seen = scan.seen; // filled in place, so a stream cut short still bills what it saw
        const reader = up.body.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          scan.push(value);
          res.write(value);
        }
        scan.end();
        seen = scan.seen;
        finished = seen.finishReason === 'STOP';
        if (!finished) outcome = `finish:${seen.finishReason ?? 'none'}`;
        await settle();
        res.end();
      } else {
        const text = await up.text();
        seen = readReply(text);
        finished = seen.finishReason === 'STOP';
        await settle();
        res.writeHead(200, { 'content-type': 'application/json', 'x-kitted-tier': config.tier });
        res.end(text);
      }
    } catch {
      outcome = stopped ?? 'error';
      finished = false;
      await settle();
      if (stopped === 'timeout') send(res, 504, { error: 'timeout' });
      else if (stopped !== 'client') send(res, 502, { error: 'upstream' });
      else res.end();
    } finally {
      await settle();
    }
  };
}

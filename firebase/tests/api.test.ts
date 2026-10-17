// The AI proxy's checks P, L, M, D (handoff/13-server.md §7), on the Firestore and Auth emulators.
// The handler runs in this process behind a local HTTP server, with its real Firestore store and real sign-in
// verification; Gemini is a fake on another local port, and App Check a fake verifier (it has no emulator).
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const PROJECT = 'demo-kitted';
const KEY = 'server-key-7f3a';
const OA_KEY = 'oa-server-key-91c2';
const PHOTO = 'QUJDRA'.repeat(50); // stands in for base64 JPEG data

type Index = typeof import('../functions/src/index');
type StoreMod = typeof import('../functions/src/api/store');
type HandlerMod = typeof import('../functions/src/api/handler');
let index: Index;
let storeMod: StoreMod;
let handlerMod: HandlerMod;

const app = initializeApp({ projectId: PROJECT }, 'api-tests');
const db = getFirestore(app);

// ---- the fake Gemini --------------------------------------------------------------------------------------------
interface FakeCall { url: string; headers: IncomingMessage['headers']; body: string; closedEarly: boolean }
type Respond = (res: ServerResponse, call: FakeCall) => void | Promise<void>;
const fake = { calls: [] as FakeCall[], respond: null as Respond | null, sent: [] as Buffer[] };
let gemini: Server;
let api: Server;
let apiUrl = '';
let clockMs = Date.UTC(2026, 9, 20, 17, 0); // 1 pm in New York
let logs: Record<string, unknown>[] = [];

const usage = { promptTokenCount: 4000, candidatesTokenCount: 800, thoughtsTokenCount: 0 };
const sseChunk = (o: unknown) => Buffer.from(`data: ${JSON.stringify(o)}\r\n\r\n`);
function sse(finish = 'STOP', u: Record<string, number> = usage): Respond {
  return (res) => {
    res.writeHead(200, { 'content-type': 'text/event-stream' });
    for (const b of [
      sseChunk({ candidates: [{ content: { parts: [{ text: '{"garments": [' }] } }] }),
      sseChunk({ candidates: [{ content: { parts: [{ text: ']}' }] }, finishReason: finish }], usageMetadata: u, modelVersion: 'gemini-3.8-flash' }),
    ]) {
      fake.sent.push(b);
      res.write(b);
    }
    res.end();
  };
}
/** OpenAI's Responses API stream, the way createAskOpenAI reads it. */
const oaUsage = { input_tokens: 4470, input_tokens_details: { cached_tokens: 3620 }, output_tokens: 89 };
const oaEvent = (type: string, o: Record<string, unknown>) => Buffer.from(`event: ${type}\ndata: ${JSON.stringify({ type, ...o })}\n\n`);
function oaSse(end = 'response.completed', usage: Record<string, unknown> = oaUsage): Respond {
  return (res) => {
    res.writeHead(200, { 'content-type': 'text/event-stream' });
    for (const b of [
      oaEvent('response.created', { response: { id: 'r1', status: 'in_progress' } }),
      oaEvent('response.output_text.delta', { delta: 'White leather sneakers.' }),
      oaEvent(end, { response: { id: 'r1', model: 'gpt-5.6-luna', status: end.slice(9), usage } }),
    ]) {
      fake.sent.push(b);
      res.write(b);
    }
    res.end();
  };
}
const oaBody = (o: Record<string, unknown> = {}) => ({
  model: 'gpt-5.6-luna', instructions: 'You are Kit.', input: [{ role: 'user', content: 'What shoes go with dark straight jeans?' }],
  max_output_tokens: 420, reasoning: { effort: 'none' }, store: false, stream: true, temperature: 0.3, ...o,
});
const LUNA = 'gpt-5.6-luna';

function reply(status = 200, finish = 'STOP'): Respond {
  return (res) => {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(status === 200 ? { candidates: [{ content: { parts: [{ text: '{}' }] }, finishReason: finish }], usageMetadata: usage } : { error: { status: 'INTERNAL' } }));
  };
}

// ---- helpers --------------------------------------------------------------------------------------------------------
async function signUp(): Promise<{ token: string; uid: string }> {
  const r = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }),
  });
  const j = (await r.json()) as { idToken: string; localId: string };
  return { token: j.idToken, uid: j.localId };
}

const photoBody = (images = 1) => ({
  contents: [{ parts: [{ text: 'Read the outfit.' }, ...Array.from({ length: images }, () => ({ inline_data: { mime_type: 'image/jpeg', data: PHOTO } }))] }],
  generationConfig: { temperature: 0, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } },
});
const askBody = (q = 'What goes with my olive overshirt?') => ({
  systemInstruction: { parts: [{ text: 'You are Kit.' }] },
  contents: [{ role: 'user', parts: [{ text: q }] }],
  generationConfig: { temperature: 0.3, maxOutputTokens: 420 },
});

interface CallOpts { token?: string | null; check?: string; kind?: string; tz?: string; model?: string; appCheck?: string; free?: string; method?: string; raw?: string; signal?: AbortSignal }
let me: { token: string; uid: string };
async function call(route: string, body: unknown, o: CallOpts = {}) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const token = o.token === undefined ? me.token : o.token;
  if (token) headers.authorization = `Bearer ${token}`;
  if (route !== 'ask' && route !== 'health') {
    if (o.check !== '') headers['x-kitted-check'] = o.check ?? 'C-1';
    if (o.kind !== '') headers['x-kitted-kind'] = o.kind ?? 'full';
  }
  if (o.tz) headers['x-kitted-tz'] = o.tz;
  if (o.appCheck) headers['x-firebase-appcheck'] = o.appCheck;
  if (o.free) headers['x-kitted-free'] = o.free;
  const method = o.method ?? (route === 'health' ? 'GET' : 'POST');
  return fetch(`${apiUrl}/v1/${route}${o.model ? `?model=${o.model}` : ''}`, {
    method, headers, signal: o.signal, ...(method === 'GET' ? {} : { body: o.raw ?? JSON.stringify(body) }),
  });
}
const json = async (r: Response) => (await r.json()) as Record<string, unknown>;
async function read(id: string, kind = 'full', respond: Respond = sse()) {
  fake.respond = respond;
  const r = await call('read', photoBody(), { check: id, kind });
  await r.arrayBuffer();
  return r.status;
}
async function ask(respond: Respond = sse(), free?: string) {
  fake.respond = respond;
  const r = await call('ask', askBody(), { free });
  await r.arrayBuffer();
  return r;
}
const setConfig = (c: Record<string, unknown>) => db.doc('server/config').set(c);
const until = async (f: () => boolean, ms = 3000) => {
  const end = Date.now() + ms;
  while (!f() && Date.now() < end) await new Promise((r) => setTimeout(r, 20));
  return f();
};

// ---- setup ----------------------------------------------------------------------------------------------------------
beforeAll(async () => {
  process.env.GCLOUD_PROJECT = PROJECT;
  process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: PROJECT, storageBucket: 'demo-kitted.appspot.com' });
  index = await import('../functions/src/index');
  storeMod = await import('../functions/src/api/store');
  handlerMod = await import('../functions/src/api/handler');

  gemini = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      const c: FakeCall = { url: req.url ?? '', headers: req.headers, body: Buffer.concat(chunks).toString(), closedEarly: false };
      res.on('close', () => {
        if (!res.writableEnded) c.closedEarly = true;
      });
      fake.calls.push(c);
      void (fake.respond ?? sse())(res, c);
    });
  });
  await new Promise<void>((r) => gemini.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${(gemini.address() as AddressInfo).port}`;

  // The real deps with the fakes swapped in, and a config read every time (no 30 s cache in tests).
  const deps = index.apiDeps({
    store: storeMod.firestoreStore(index.adminFirestore(), { configTtlMs: 0, now: () => clockMs }),
    geminiBase: base,
    geminiKey: () => KEY,
    openaiBase: base,
    openaiKey: () => OA_KEY,
    verifyAppCheck: async (t) => {
      if (t !== 'good-app-check') throw new Error('bad');
    },
    now: () => clockMs,
    log: (e) => logs.push(e),
  });
  const h = handlerMod.createApi(deps);
  api = createServer((req, res) => {
    void h(req, res).catch(() => {
      if (!res.headersSent) res.writeHead(500).end();
    });
  });
  await new Promise<void>((r) => api.listen(0, '127.0.0.1', r));
  apiUrl = `http://127.0.0.1:${(api.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise((r) => api.close(r));
  await new Promise((r) => gemini.close(r));
});

beforeEach(async () => {
  for (const c of ['usage', 'spend', 'server']) await db.recursiveDelete(db.collection(c));
  await setConfig({ tier: 'free' });
  fake.calls = [];
  fake.sent = [];
  fake.respond = null;
  logs = [];
  clockMs = Date.UTC(2026, 9, 20, 17, 0);
  me = await signUp();
});

// ---- P · plumbing and safety ----------------------------------------------------------------------------------------
describe('P1 health', () => {
  it('answers without sign-in and calls nothing', async () => {
    const r = await call('health', null, { token: null });
    expect(r.status).toBe(200);
    expect(await json(r)).toEqual({ ok: true });
    expect(fake.calls).toHaveLength(0);
  });
});

describe('P2 sign-in', () => {
  it('refuses no token, a malformed one and one from another project; a guest account works', async () => {
    const other = [
      Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url'),
      Buffer.from(JSON.stringify({ aud: 'other-project', iss: 'https://securetoken.google.com/other-project', sub: 'x', user_id: 'x', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600, auth_time: Math.floor(Date.now() / 1000) })).toString('base64url'),
      '',
    ].join('.');
    for (const token of [null, 'not-a-token', other]) {
      const r = await call('read', photoBody(), { token });
      expect(r.status).toBe(401);
      expect(await json(r)).toEqual({ error: 'signIn' });
    }
    expect(fake.calls).toHaveLength(0);
    expect(await read('C-1')).toBe(200);
  });
});

describe('P3 App Check', () => {
  it('required when switched on; a bad token is refused even when off', async () => {
    let r = await call('read', photoBody(), { appCheck: 'forged' });
    expect([r.status, await json(r)]).toEqual([401, { error: 'appCheck' }]);
    await setConfig({ tier: 'free', enforceAppCheck: true });
    r = await call('read', photoBody());
    expect([r.status, await json(r)]).toEqual([401, { error: 'appCheck' }]);
    expect(fake.calls).toHaveLength(0);
    fake.respond = sse();
    r = await call('read', photoBody(), { appCheck: 'good-app-check' });
    await r.arrayBuffer();
    expect(r.status).toBe(200);
  });
});

describe('P4 the key', () => {
  it('Gemini gets our key and none of the app headers; the app never sees the key', async () => {
    fake.respond = reply(500);
    const r = await call('read', photoBody(), { appCheck: 'good-app-check' });
    const text = await r.text();
    expect(r.status).toBe(502);
    const h = fake.calls[0]!.headers;
    expect(h['x-goog-api-key']).toBe(KEY);
    expect(h.authorization).toBeUndefined();
    expect(h['x-firebase-appcheck']).toBeUndefined();
    expect(h['x-kitted-check']).toBeUndefined();
    expect(text).not.toContain(KEY);
    fake.respond = sse();
    const ok = await call('read', photoBody(), { check: 'C-2' });
    expect(await ok.text()).not.toContain(KEY);
    expect(JSON.stringify(logs)).not.toContain(KEY);
  });
});

describe('P5 shape', () => {
  const bad: [string, string, unknown, CallOpts?, number?][] = [
    ['unknown route', 'score', photoBody(), {}, 404],
    ['wrong method', 'read', photoBody(), { method: 'PUT' }, 405],
    ['bad JSON', 'read', null, { raw: '{"contents": [' }],
    ['a model not on the list', 'read', photoBody(), { model: 'gemini-3.8-pro' }],
    ['tools', 'read', { ...photoBody(), tools: [{ googleSearch: {} }] }],
    ['cached content', 'ask', { ...askBody(), cachedContent: 'cachedContents/x' }],
    ['a file link', 'read', { contents: [{ parts: [{ text: 'x' }, { file_data: { file_uri: 'gs://x', mime_type: 'image/jpeg' } }] }] }],
    ['a PNG', 'read', { contents: [{ parts: [{ inline_data: { mime_type: 'image/png', data: PHOTO } }] }] }],
    ['too many images', 'read', photoBody(4)],
    ['images on ask', 'ask', { ...askBody(), contents: [{ role: 'user', parts: [{ text: 'q' }, { inline_data: { mime_type: 'image/jpeg', data: PHOTO } }] }] }],
    ['two images on look', 'look', photoBody(2)],
    ['systemInstruction outside ask', 'read', { ...photoBody(), systemInstruction: { parts: [{ text: 'x' }] } }],
    ['more than one candidate', 'ask', { ...askBody(), generationConfig: { candidateCount: 4 } }],
    ['no check id', 'read', photoBody(), { check: '' }],
    ['a malformed check id', 'read', photoBody(), { check: 'a b/c' }],
    ['an unknown kind', 'read', photoBody(), { kind: 'bonus' }],
    ['too big', 'ask', askBody('x'.repeat(70_000)), {}, 413],
  ];
  for (const [what, route, body, opts, status] of bad) {
    it(`refuses ${what} before calling Gemini`, async () => {
      const r = await call(route, body, opts);
      expect(r.status).toBe(status ?? 400);
      expect(fake.calls).toHaveLength(0);
    });
  }
  it('clamps or adds the output cap and forwards everything else unchanged', async () => {
    fake.respond = sse();
    await (await call('ask', { ...askBody(), generationConfig: { temperature: 0.3, maxOutputTokens: 99_999 } })).arrayBuffer();
    expect(JSON.parse(fake.calls[0]!.body).generationConfig).toEqual({ temperature: 0.3, maxOutputTokens: 1024 });
    expect(fake.calls[0]!.url).toBe('/v1beta/models/gemini-3.5-flash-lite:streamGenerateContent?alt=sse');
    await read('C-1');
    const sent = JSON.parse(fake.calls[1]!.body);
    expect(sent).toEqual({ ...photoBody(), generationConfig: { ...photoBody().generationConfig, maxOutputTokens: 8192 } });
    fake.respond = reply();
    await (await call('closet', photoBody(), { check: 'C-1' })).arrayBuffer();
    expect(fake.calls[2]!.url).toBe('/v1beta/models/gemini-3.8-flash:generateContent');
  });
});

describe('P6 relay', () => {
  it('streams: the first chunk arrives before Gemini finishes, and the bytes match', async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    let ended = false;
    fake.respond = async (res) => {
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      const a = sseChunk({ candidates: [{ content: { parts: [{ text: '{"garments": [' }] } }] });
      fake.sent.push(a);
      res.write(a);
      await gate;
      const b = sseChunk({ candidates: [{ content: { parts: [{ text: ']}' }] }, finishReason: 'STOP' }], usageMetadata: usage });
      fake.sent.push(b);
      res.end(b);
      ended = true;
    };
    const r = await call('read', photoBody());
    expect(r.headers.get('content-type')).toContain('text/event-stream');
    const reader = r.body!.getReader();
    const got: Uint8Array[] = [];
    const first = await reader.read();
    got.push(first.value!);
    expect(ended).toBe(false);
    release();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      got.push(value);
    }
    expect(Buffer.concat(got).equals(Buffer.concat(fake.sent))).toBe(true);
  });
  it('one-reply routes return Gemini JSON unchanged', async () => {
    await read('C-1');
    fake.respond = (res) => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end('{"candidates":[{"finishReason":"STOP","content":{"parts":[{"text":"{\\"u\\":1}"}]}}],"usageMetadata":{"promptTokenCount":10}}');
    };
    const r = await call('look', photoBody(), { check: 'C-1' });
    expect(await r.text()).toBe('{"candidates":[{"finishReason":"STOP","content":{"parts":[{"text":"{\\"u\\":1}"}]}}],"usageMetadata":{"promptTokenCount":10}}');
  });
});

describe('P7 hang-up', () => {
  it('aborts the Gemini call and gives the check back', async () => {
    fake.respond = async (res) => {
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      res.write(sseChunk({ candidates: [{ content: { parts: [{ text: '{' }] } }] }));
      await new Promise(() => {}); // never finishes
    };
    const ac = new AbortController();
    const r = await call('read', photoBody(), { signal: ac.signal });
    await r.body!.getReader().read();
    ac.abort();
    expect(await until(() => fake.calls[0]?.closedEarly === true)).toBe(true);
    expect(await until(() => logs.some((l) => l.outcome === 'client'))).toBe(true);
    expect(await read('C-2')).toBe(200);
  });
});

describe('P8 timeout', () => {
  it('504 after the timeout, nothing counted', async () => {
    await setConfig({ tier: 'free', timeoutMs: 300 });
    fake.respond = () => {}; // never answers
    const r = await call('read', photoBody());
    expect([r.status, await json(r)]).toEqual([504, { error: 'timeout' }]);
    expect(await read('C-2')).toBe(200);
  });
});

describe('P9 Gemini fails', () => {
  it('502 with its status, nothing counted', async () => {
    for (const status of [500, 429]) {
      fake.respond = reply(status);
      const r = await call('read', photoBody(), { check: `F-${status}` });
      expect([r.status, await json(r)]).toEqual([502, { error: 'upstream', status }]);
    }
    expect(await read('C-1')).toBe(200);
  });
});

// ---- L · limits -----------------------------------------------------------------------------------------------------
async function expectLimit(r: Response | Promise<Response>, which: string) {
  const res = await r;
  expect([res.status, await json(res)]).toEqual([429, { error: 'limit', which }]);
}

describe('L1–L2 checks', () => {
  it('one check a day on free; the same check id may call again; a second check is refused', async () => {
    expect(await read('C-1')).toBe(200);
    expect(await read('C-1')).toBe(200); // a hedge
    fake.respond = reply();
    for (const route of ['look', 'look', 'closet', 'closet']) expect((await call(route, photoBody(), { check: 'C-1' })).status).toBe(200);
    fake.respond = sse();
    await expectLimit(call('read', photoBody(), { check: 'C-2' }), 'checks');
    const day = (await db.collection(`usage/${me.uid}/usageDays`).get()).docs[0]!.data();
    expect(day.checks).toBe(1);
  });
  it('the 11th call on one check id is refused', async () => {
    expect(await read('C-1')).toBe(200);
    fake.respond = reply();
    for (let i = 0; i < 9; i++) expect((await call('look', photoBody(), { check: 'C-1' })).status).toBe(200);
    await expectLimit(call('look', photoBody(), { check: 'C-1' }), 'calls');
  });
});

describe('L3 failures are free', () => {
  it('a failed, timed-out or unfinished read gives the check back; a failed look under a good read still counts it', async () => {
    expect(await read('A', 'full', reply(500))).toBe(502);
    expect(await read('B', 'full', sse('MAX_TOKENS'))).toBe(200);
    expect(await read('C', 'full', sse('SAFETY'))).toBe(200);
    expect(await read('D')).toBe(200);
    fake.respond = reply(500);
    expect((await call('look', photoBody(), { check: 'D' })).status).toBe(502);
    await expectLimit(call('read', photoBody(), { check: 'E' }), 'checks');
  });
  it('a look alone (no read) never uses the check', async () => {
    fake.respond = reply();
    expect((await call('look', photoBody(), { check: 'L' })).status).toBe(200);
    expect(await read('M')).toBe(200);
  });
});

describe('L4 re-checks', () => {
  it('one per counted check; one even before a check (a re-check across 4 am); never a second on free', async () => {
    expect(await read('R0', 'recheck')).toBe(200);
    await expectLimit(call('read', photoBody(), { check: 'R00', kind: 'recheck' }), 'rechecks');
    expect(await read('C-1')).toBe(200);
    await expectLimit(call('read', photoBody(), { check: 'R1', kind: 'recheck' }), 'rechecks');
  });
});

describe('L5 snaps', () => {
  it('two per counted check', async () => {
    expect(await read('C-1')).toBe(200);
    expect(await read('S1', 'snap')).toBe(200);
    expect(await read('S2', 'snap')).toBe(200);
    await expectLimit(call('read', photoBody(), { check: 'S3', kind: 'snap' }), 'snaps');
  });
});

describe('L6 questions', () => {
  it('5 + 2 on free; failures are free; taps are free up to 10', async () => {
    expect((await ask(reply(500))).status).toBe(502);
    expect((await ask(sse('MAX_TOKENS'))).status).toBe(200);
    for (let i = 0; i < 7; i++) expect((await ask()).status).toBe(200);
    await expectLimit(call('ask', askBody()), 'questions');
    for (let i = 0; i < 10; i++) expect((await ask(sse(), 'tap')).status).toBe(200);
    await expectLimit(call('ask', askBody(), { free: 'tap' }), 'questions');
  });
});

describe('L7 Pro', () => {
  it('10 checks and 52 questions', async () => {
    await setConfig({ tier: 'pro' });
    for (let i = 0; i < 10; i++) expect(await read(`P${i}`)).toBe(200);
    await expectLimit(call('read', photoBody(), { check: 'P10' }), 'checks');
    for (let i = 0; i < 52; i++) expect((await ask()).status).toBe(200);
    await expectLimit(call('ask', askBody()), 'questions');
  }, 60_000);
  it('the beta default is Pro when the config is missing', async () => {
    await db.doc('server/config').delete();
    for (let i = 0; i < 2; i++) expect(await read(`B${i}`)).toBe(200);
  });
});

describe('L8 the day', () => {
  it('rolls at 4 am local; a time zone change within 20 h is ignored', async () => {
    const ny = '-240'; // EDT
    clockMs = Date.UTC(2026, 9, 21, 7, 59); // 3:59 am in New York
    fake.respond = sse();
    expect((await call('read', photoBody(), { check: 'N1', tz: ny }).then(async (r) => (await r.arrayBuffer(), r.status)))).toBe(200);
    await expectLimit(call('read', photoBody(), { check: 'N2', tz: ny }), 'checks');
    clockMs = Date.UTC(2026, 9, 21, 8, 0); // 4:00 am
    expect((await call('read', photoBody(), { check: 'N3', tz: ny }).then(async (r) => (await r.arrayBuffer(), r.status)))).toBe(200);
    // Claiming Tokyo now would make it the 21st's afternoon, a new day: ignored within 20 h.
    clockMs = Date.UTC(2026, 9, 21, 9, 0);
    await expectLimit(call('read', photoBody(), { check: 'N4', tz: '540' }), 'checks');
    const days = (await db.collection(`usage/${me.uid}/usageDays`).get()).docs.map((d) => d.id).sort();
    expect(days).toEqual(['2026-10-20', '2026-10-21']);
  });
});

describe('L9 call budget', () => {
  it('failed reads on fresh check ids stop at the daily photo-call budget', async () => {
    fake.respond = reply(500);
    for (let i = 0; i < 20; i++) expect((await call('read', photoBody(), { check: `X${i}` })).status).toBe(502);
    await expectLimit(call('read', photoBody(), { check: 'X20' }), 'calls');
  });
});

describe('L10 accounts apart', () => {
  it('one account using its check leaves another untouched', async () => {
    expect(await read('C-1')).toBe(200);
    me = await signUp();
    expect(await read('C-1')).toBe(200);
  });
});

// ---- M · money ------------------------------------------------------------------------------------------------------
describe('M1 cost', () => {
  it('follows usageMetadata and the price table, doubling from Jan 1, 2027', async () => {
    const { costCents } = await import('../functions/src/api/prices');
    const before = Date.UTC(2026, 11, 31, 12);
    const after = Date.UTC(2027, 0, 1, 12);
    const u = { promptTokenCount: 4000, cachedContentTokenCount: 1000, candidatesTokenCount: 700, thoughtsTokenCount: 100 };
    expect(costCents('gemini-3.8-flash', u, before)).toBeCloseTo((3000 * 0.75 + 1000 * 0.075 + 800 * 3.75) / 1e4, 6);
    expect(costCents('gemini-3.8-flash', u, after)).toBeCloseTo(2 * costCents('gemini-3.8-flash', u, before), 6);
    expect(costCents('gemini-3.5-flash-lite', u, after)).toBeCloseTo((3000 * 0.3 + 1000 * 0.03 + 800 * 2.5) / 1e4, 6);
    expect(costCents('gemini-9-ultra', u, before)).toBe(costCents('gemini-3.8-flash', u, before));
    await read('C-1');
    const spent = (await db.doc('spend/2026-10-20').get()).data()!;
    expect(spent.cents).toBeCloseTo((4000 * 0.75 + 800 * 3.75) / 1e4, 6);
    expect(spent.calls).toBe(1);
  });
});

describe('M2 the spending stop', () => {
  it('at the cap every AI route pauses without calling Gemini; health answers; the next UTC day works', async () => {
    await setConfig({ tier: 'free', spendCapCents: 300 });
    await db.doc('spend/2026-10-20').set({ cents: 300, calls: 1, at: clockMs });
    for (const [route, body] of [['read', photoBody()], ['look', photoBody()], ['closet', photoBody()], ['ask', askBody()]] as const) {
      const r = await call(route, body);
      expect([r.status, await json(r)]).toEqual([503, { error: 'paused' }]);
    }
    expect(fake.calls).toHaveLength(0);
    expect((await call('health', null, { token: null })).status).toBe(200);
    expect((await db.collection(`usage/${me.uid}/usageDays`).get()).size).toBe(0);
    clockMs = Date.UTC(2026, 9, 21, 0, 1);
    expect(await read('C-1')).toBe(200);
  });
});

// ---- D · data -------------------------------------------------------------------------------------------------------
describe('D1 nothing kept', () => {
  it('no photo, question or answer in Firestore or the logs', async () => {
    await read('C-1');
    const q = 'Should I tuck my striped oxford into pleated trousers?';
    fake.respond = sse();
    await (await call('ask', askBody(q))).arrayBuffer();
    const all: string[] = [];
    for (const c of ['usage', 'spend', 'server']) {
      for (const d of (await db.collection(c).get()).docs) all.push(JSON.stringify(d.data()));
    }
    for (const d of (await db.collectionGroup('usageDays').get()).docs) all.push(JSON.stringify(d.data()));
    const stored = all.join('\n') + JSON.stringify(logs);
    for (const secret of [PHOTO.slice(0, 40), 'striped oxford', 'Read the outfit', 'You are Kit', 'garments']) expect(stored).not.toContain(secret);
    expect(logs.length).toBe(2);
    expect(Object.keys(logs[1]!).sort()).toEqual(['cents', 'model', 'ms', 'outcome', 'route', 'status', 'thinking', 'tokensIn', 'tokensOut', 'uid']);
  });
});

// ---- O · questions on OpenAI (13 §11) ------------------------------------------------------------------------------
describe('O1 OpenAI shape', () => {
  it("passes the app's own body, forced store:false and the cap, to /v1/responses", async () => {
    fake.respond = oaSse();
    const r = await call('ask', oaBody({ max_output_tokens: 99_999, store: true }), { model: LUNA });
    await r.arrayBuffer();
    expect(r.status).toBe(200);
    expect(fake.calls[0]!.url).toBe('/v1/responses');
    expect(JSON.parse(fake.calls[0]!.body)).toEqual({ ...oaBody(), max_output_tokens: 1024, store: false });
  });
  const bad: [string, unknown, string?][] = [
    ['tools', oaBody({ tools: [{ type: 'web_search' }] })],
    ['previous_response_id', oaBody({ previous_response_id: 'resp_1' })],
    ['an image', oaBody({ input: [{ role: 'user', content: [{ type: 'input_image', image_url: 'data:image/jpeg;base64,AAAA' }] }] })],
    ['a file', oaBody({ input: [{ role: 'user', content: [{ type: 'input_file', file_id: 'f1' }] }] })],
    ['a different body model', oaBody({ model: 'gpt-6-sol' })],
    ['a model not on the list', oaBody({ model: 'gpt-6-sol' }), 'gpt-6-sol'],
    ['high reasoning', oaBody({ reasoning: { effort: 'high' } })],
    ['no streaming', oaBody({ stream: false })],
    ['an unknown field', oaBody({ text: { format: { type: 'json_object' } } })],
  ];
  for (const [what, body, model] of bad) {
    it(`refuses ${what} before calling OpenAI`, async () => {
      const r = await call('ask', body, { model: model ?? LUNA });
      expect(r.status).toBe(400);
      expect(fake.calls).toHaveLength(0);
    });
  }
});

describe('O2 keys', () => {
  it('OpenAI gets only its key; Gemini only its own; the app never sees either', async () => {
    fake.respond = oaSse();
    const r = await call('ask', oaBody(), { model: LUNA, appCheck: 'good-app-check' });
    const text = await r.text();
    const h = fake.calls[0]!.headers;
    expect(h.authorization).toBe(`Bearer ${OA_KEY}`);
    expect(h['x-goog-api-key']).toBeUndefined();
    expect(h['x-firebase-appcheck']).toBeUndefined();
    await read('C-1');
    expect(fake.calls[1]!.headers.authorization).toBeUndefined();
    expect(fake.calls[1]!.headers['x-goog-api-key']).toBe(KEY);
    fake.respond = reply(401);
    const bad = await call('ask', oaBody(), { model: LUNA });
    const all = text + (await bad.text()) + JSON.stringify(logs);
    for (const k of [KEY, OA_KEY]) expect(all).not.toContain(k);
  });
});

describe('O3 relay', () => {
  it("OpenAI's bytes arrive unchanged, the first before it finishes", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    let ended = false;
    fake.respond = async (res) => {
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      const a = oaEvent('response.output_text.delta', { delta: 'White' });
      fake.sent.push(a);
      res.write(a);
      await gate;
      const b = oaEvent('response.completed', { response: { usage: oaUsage } });
      fake.sent.push(b);
      res.end(b);
      ended = true;
    };
    const r = await call('ask', oaBody(), { model: LUNA });
    const reader = r.body!.getReader();
    const got: Uint8Array[] = [(await reader.read()).value!];
    expect(ended).toBe(false);
    release();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      got.push(value);
    }
    expect(Buffer.concat(got).equals(Buffer.concat(fake.sent))).toBe(true);
  });
});

describe('O4 counting', () => {
  const dayQuestions = async () => (await db.collection(`usage/${me.uid}/usageDays`).get()).docs[0]?.data().questions ?? 0;
  it('completed counts; incomplete, failed, a cut stream and HTTP errors do not; the limit and the stop apply', async () => {
    for (const end of ['response.incomplete', 'response.failed']) {
      fake.respond = oaSse(end);
      await (await call('ask', oaBody(), { model: LUNA })).arrayBuffer();
    }
    fake.respond = (res) => {
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      res.end(oaEvent('response.output_text.delta', { delta: 'White' }));
    };
    await (await call('ask', oaBody(), { model: LUNA })).arrayBuffer();
    for (const status of [401, 429, 500]) {
      fake.respond = reply(status);
      const r = await call('ask', oaBody(), { model: LUNA });
      expect([r.status, await json(r)]).toEqual([502, { error: 'upstream', status }]);
    }
    expect(await dayQuestions()).toBe(0);
    fake.respond = oaSse();
    for (let i = 0; i < 7; i++) expect((await call('ask', oaBody(), { model: LUNA }).then(async (x) => (await x.arrayBuffer(), x.status)))).toBe(200);
    expect(await dayQuestions()).toBe(7);
    await expectLimit(call('ask', oaBody(), { model: LUNA }), 'questions');
    await db.doc('spend/2026-10-20').set({ cents: 999, calls: 1, at: clockMs });
    me = await signUp();
    const r = await call('ask', oaBody(), { model: LUNA });
    expect([r.status, await json(r)]).toEqual([503, { error: 'paused' }]);
  });
});

describe('O5 cost', () => {
  it("adds OpenAI's usage at $0.20 / $0.02 cached / $1.20 per million", async () => {
    fake.respond = oaSse();
    await (await call('ask', oaBody(), { model: LUNA })).arrayBuffer();
    const spent = (await db.doc('spend/2026-10-20').get()).data()!;
    expect(spent.cents).toBeCloseTo((850 * 0.2 + 3620 * 0.02 + 89 * 1.2) / 1e4, 6);
    expect(logs.at(-1)).toMatchObject({ route: 'ask', model: LUNA, outcome: 'ok', tokensIn: 4470, tokensOut: 89 });
  });
});

describe('D3 deletion and purge', () => {
  it('deleteEverything removes the server counts; purgeUsage removes old days', async () => {
    await read('C-1');
    expect((await db.collection(`usage/${me.uid}/usageDays`).get()).size).toBe(1);
    await index.deleteEverything(me.uid);
    expect((await db.collection(`usage/${me.uid}/usageDays`).get()).size).toBe(0);
    expect((await db.doc(`usage/${me.uid}`).get()).exists).toBe(false);

    const now = Date.UTC(2026, 9, 30);
    const DAY = 86_400_000;
    await db.doc('usage/u1/usageDays/2026-10-20').set({ at: now - 10 * DAY });
    await db.doc('usage/u1/usageDays/2026-10-28').set({ at: now - 2 * DAY });
    await db.doc('spend/2026-07-01').set({ at: now - 120 * DAY, cents: 1 });
    await db.doc('spend/2026-10-01').set({ at: now - 29 * DAY, cents: 1 });
    expect(await index.purgeUsageBefore(now)).toEqual({ usage: 1, spend: 1 });
    expect((await db.collection('usage/u1/usageDays').get()).docs.map((d) => d.id)).toEqual(['2026-10-28']);
    expect((await db.collection('spend').get()).docs.map((d) => d.id)).toContain('2026-10-01');
  });
});

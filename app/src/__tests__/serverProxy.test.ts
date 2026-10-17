// The app side of the server (handoff/13-server.md §8, checks A1–A12, #327): the four Gemini callers send the same
// bodies to our server's routes with the guest sign-in and the check's tags, and read its refusals into the limit and
// paused states. The fit-check and closet services run here as on the phone (real routed sources, the memory store),
// against a fake server that answers like the `api` function relaying Gemini.
import { createMemoryStore } from '@/data/memoryStore';
import type { ChatMessage, LookAnswerL, LookAnswerU } from '@/data/types';
import { demoPhoto } from '@/demo/demoPhotos';
import { buildAskRequest, createAskGemini } from '@/features/ask/gemini';
import { createAsk } from '@/features/ask/pipeline';
import type { AnswerEvent } from '@/features/ask/source';
import { createClosetService } from '@/features/closet/service';
import { createFitCheckService, DEFAULT_TIMERS, type StartOutcome, type TimerConfig } from '@/features/fitcheck/service';
import { t } from '@/i18n/en';
import { manualClock } from '@/services/clock';
import { buildClosetRequest, createClosetGeminiSource } from '@/services/closetSource/gemini';
import { routedClosetSource } from '@/services/closetSource/live';
import { createMockClosetSource } from '@/services/closetSource/mock';
import { counterIds } from '@/services/ids';
import type { ImagePrep } from '@/services/imagePrep/demo';
import { createQuota } from '@/services/quota';
import { demoReadingById } from '@/services/readingSource/demoReadings';
import { buildRequest, createGeminiSource } from '@/services/readingSource/gemini';
import { routedSource } from '@/services/readingSource/live';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { buildLookRequest, createLookGemini } from '@/services/readingSource/secondLook';
import type { ReadingEvent } from '@/services/readingSource/types';
import { realScheduler } from '@/services/scheduler';
import { aiPathFor, SERVER_URL } from '@/services/server/config';
import { createGuestToken, keepGuest, type GuestAuth } from '@/services/server/guest';
import { SERVER_TIER_KV, serverTier, tierRecorder } from '@/services/server/tier';
import {
  CHECK_ID_PATTERN, checkTag, directTransport, GEMINI_BASE, serverTransport, SignInError, snapCheckId, type AiFetch, type AiTransport,
} from '@/services/server/transport';

declare const __dirname: string;
const { readFileSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');

const BASE = 'https://srv.test/api';
const NOW = Date.parse('2026-10-17T12:00:00-04:00');
const PEEK: LookAnswerU = { outer_kind: 'hoodie_or_sweatshirt', outer_hem_at: 'hip', under_present: 'yes', under_kind: 'tee_or_tank', under_hem_at: 'crotch', under_shows: 'clearly' };
const RESTS: LookAnswerL = { pant_end: 'full_break', covers_shoe: 'mostly' };

// ------------------------------------------------------------------ the fake server

interface Call {
  url: string;
  route: string;
  model: string | null;
  headers: Record<string, string>;
  body: string;
}
type Reply = { status?: number; json?: unknown; throws?: boolean; delayMs?: number };

/** A valid closet answer for any stub list: piece 0, not visible (validate.ts keeps it). */
const CLOSET_ANSWER = '{"garments":[{"i":0,"visible":false}]}';
const enc = new TextEncoder();
const sseEvents = (text: string) => {
  const half = Math.ceil(text.length / 2);
  return [
    `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: text.slice(0, half) }] } }] })}\r\n\r\n`,
    `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: text.slice(half) }] }, finishReason: 'STOP' }], modelVersion: 'gemini-3.8-flash', usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 } })}\r\n\r\n`,
  ];
};
const reply = (status: number, chunks: string[], tier: string | null) => {
  let i = 0;
  return {
    ok: status < 400,
    status,
    headers: { get: (n: string): string | null => (n.toLowerCase() === 'x-kitted-tier' ? tier : null) },
    text: async () => chunks.join(''),
    body: { getReader: () => ({ read: async () => (i < chunks.length ? { done: false, value: enc.encode(chunks[i++]) } : { done: true }), cancel: async () => {} }) },
  };
};
const candidate = (text: string) => JSON.stringify({ candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 } });

/** The photo a request carries: livePrep sends `ph-<id>` as its upload, so the fake can answer with that photo's reading. */
function photoIn(body: string): string | null {
  const j = JSON.parse(body) as { contents: { parts: { inline_data?: { data: string } }[] }[] };
  const data = j.contents[0]?.parts.find((p) => p.inline_data)?.inline_data?.data ?? '';
  return data.startsWith('ph-') ? data.slice(3) : null;
}

function fakeServer(o: { reply?: (c: Call, n: number) => Reply | undefined; tier?: 'free' | 'pro' | null } = {}) {
  const calls: Call[] = [];
  const fetch: AiFetch = async (url, init) => {
    const u = new URL(url);
    const route = u.pathname.split('/v1/')[1] ?? '';
    const c: Call = { url, route, model: u.searchParams.get('model'), headers: init.headers, body: init.body };
    calls.push(c);
    const r = o.reply?.(c, calls.filter((x) => x.route === route).length);
    if (r?.delayMs) await new Promise((res) => setTimeout(res, r.delayMs));
    if (init.signal?.aborted) throw new Error('aborted');
    if (r?.throws) throw new TypeError('Network request failed');
    const tier = o.tier === undefined ? 'free' : o.tier;
    if (r?.status) return reply(r.status, [JSON.stringify(r.json ?? {})], r.status < 400 ? tier : null);
    if (route === 'read') {
      const id = photoIn(init.body);
      return reply(200, sseEvents(JSON.stringify(demoReadingById(id ?? 's15') ?? demoReadingById('s15'))), tier);
    }
    if (route === 'look') return reply(200, [candidate(JSON.stringify(init.body.includes('under_present') ? PEEK : RESTS))], tier);
    if (route === 'closet') return reply(200, [candidate(CLOSET_ANSWER)], tier);
    return reply(200, sseEvents('Wear the navy polo with your chinos.'), tier);
  };
  return { fetch, calls, of: (route: string) => calls.filter((c) => c.route === route) };
}

function server(o: Parameters<typeof fakeServer>[0] = {}, token: (force: boolean) => Promise<string> = async (f) => (f ? 'FRESH' : 'TOKEN')) {
  const s = fakeServer(o);
  const forced: boolean[] = [];
  const transport = serverTransport({
    base: BASE, fetch: s.fetch, tzMinutes: () => -240,
    token: (f) => {
      forced.push(f);
      return token(f);
    },
  });
  return { ...s, transport, forced };
}

// ------------------------------------------------------------------ the phone's services, as on his phone

const photoOfSha = new Map<string, string>();
const livePrep: ImagePrep = {
  async prepare(photo) {
    if (photo.kind === 'demo') return { status: 'notImplemented' };
    const id = photo.kind === 'file' ? photo.uri.replace(/\.jpg$/, '') : photoOfSha.get(photo.sha256) ?? '';
    const sha = demoPhoto(id)?.sha256;
    if (!sha) return { status: 'unknownPhoto' };
    photoOfSha.set(sha, id);
    return { status: 'ok', image: { photoId: null, sha256: sha, uploadUri: null, uploadBase64: `ph-${id}`, zoomBase64: ['up', 'low'], keptUri: `photos/${id}.jpg`, thumbUri: `photos/${id}-t.jpg`, aspect: 0.75 } };
  },
};

async function phone(o: { reply?: (c: Call, n: number) => Reply | undefined; tier?: 'free' | 'pro' | null; timers?: Partial<TimerConfig> } = {}) {
  const store = createMemoryStore();
  const clock = manualClock(NOW);
  const ids = counterIds();
  const s = fakeServer(o);
  const transport = serverTransport({ base: BASE, fetch: s.fetch, token: async () => 'TOKEN', tzMinutes: () => -240, onTier: tierRecorder(store) });
  const source = routedSource(createMockReadingSource({ latency: () => 0, scheduler: realScheduler }), async () => true, transport);
  const closetSource = routedClosetSource(createMockClosetSource({ latency: () => 0, scheduler: realScheduler }), async () => true, transport);
  const closet = createClosetService({ store, clock, scheduler: realScheduler, ids, source: closetSource, measure: async () => new Map() });
  const quota = createQuota({ store, clock, isPro: () => false, serverTier: () => serverTier(store) });
  const svc = createFitCheckService({
    store, source, prep: livePrep, quota, clock, scheduler: realScheduler, ids, closet, tap: () => false,
    timers: () => ({ ...DEFAULT_TIMERS, cacheHitMs: 0, lookGraceMs: 300, ...o.timers }),
  });
  await store.profile.put({
    id: 'me', birthYear: 2004, heightCm: 178, build: 'average', fitPreference: 'regular', styles: [['minimal', 0.5]], boldness: null, budget: null,
    lastOccasion: 'everyday', consentVersion: '1', consentAt: clock.nowMs(), onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: clock.nowMs(),
  });
  const check = (photo: string) => svc.start({ mode: 'check', photoUri: `${photo}.jpg`, occasion: 'everyday' });
  return { store, svc, quota, closet, server: s, check };
}

const idOf = (r: StartOutcome) => ('checkId' in r ? r.checkId : '');
const header = (c: Call, name: string) => c.headers[name];

let log: jest.SpyInstance;
beforeEach(() => (log = jest.spyOn(console, 'log').mockImplementation(() => {})));
afterEach(() => log.mockRestore());

async function readAll(it: AsyncIterable<ReadingEvent>) {
  const out: ReadingEvent[] = [];
  for await (const e of it) out.push(e);
  return out;
}
async function drain(it: AsyncGenerator<AnswerEvent>) {
  const out: AnswerEvent[] = [];
  for await (const e of it) out.push(e);
  return out;
}
const image = { photoId: null, sha256: 'x', uploadUri: null, uploadBase64: 'QUJD', zoomBase64: ['VVA=', 'TE9X'] };

// ------------------------------------------------------------------ A1

describe('A1 · which way a call goes', () => {
  it('dev + key → Gemini with the key; Release → the server only; a dev setting → the server; neither → none', () => {
    expect(aiPathFor({ release: false, devKey: 'K' })).toEqual({ kind: 'direct', apiKey: 'K' });
    expect(aiPathFor({ release: true, devKey: 'K', setting: '127.0.0.1' })).toEqual({ kind: 'server', base: SERVER_URL, emulatorHost: null });
    expect(aiPathFor({ release: true })).toEqual({ kind: 'server', base: SERVER_URL, emulatorHost: null });
    expect(aiPathFor({ release: false, devKey: 'K', setting: 'live' })).toEqual({ kind: 'server', base: SERVER_URL, emulatorHost: null });
    expect(aiPathFor({ release: false, devKey: 'K', setting: '127.0.0.1' })).toEqual({
      kind: 'server', base: 'http://127.0.0.1:5001/demo-kitted/us-central1/api', emulatorHost: '127.0.0.1',
    });
    expect(aiPathFor({ release: false })).toEqual({ kind: 'none' });
    expect(SERVER_URL).toBe('https://us-central1-kitted-a5b45.cloudfunctions.net/api');
  });

  it('the direct path calls Google with the key and never the server; the server path never Google, never the key', async () => {
    const urls: { url: string; headers: Record<string, string> }[] = [];
    const rec: AiFetch = async (url, init) => {
      urls.push({ url, headers: init.headers });
      return reply(200, sseEvents(JSON.stringify(demoReadingById('s15'))), null);
    };
    await readAll(createGeminiSource({ transport: directTransport('DEVKEY', rec) }).read(image, 'full', { checkId: 'FC-1' }));
    expect(urls[0]!.url).toBe(`${GEMINI_BASE}/gemini-3.8-flash:streamGenerateContent?alt=sse`);
    expect(urls[0]!.headers['x-goog-api-key']).toBe('DEVKEY');
    expect(urls[0]!.headers.Authorization).toBeUndefined();

    const s = server();
    await readAll(createGeminiSource({ transport: s.transport }).read(image, 'full', { checkId: 'FC-1' }));
    expect(s.calls[0]!.url.startsWith(BASE)).toBe(true);
    expect(s.calls.some((c) => c.url.includes('googleapis'))).toBe(false);
    expect(Object.keys(s.calls[0]!.headers).map((k) => k.toLowerCase())).not.toContain('x-goog-api-key');
  });

  it('the live sources take the shared transport; no live source when there is nowhere to send', async () => {
    // Jest is a dev build with no key and no setting: the reading falls back to the demo-only mock, as before.
    const mock = createMockReadingSource({ latency: () => 0, scheduler: realScheduler });
    const evs = await readAll(routedSource(mock, async () => true, null).read({ ...image, sha256: 'unknown' }, 'full'));
    expect(evs.find((e) => e.type === 'failed')).toMatchObject({ code: 'unknownPhoto' });
  });
});

// ------------------------------------------------------------------ A2

describe('A2 · the same bodies', () => {
  const both = () => {
    const direct: { url: string; body: string }[] = [];
    const d: AiFetch = async (url, init) => {
      direct.push({ url, body: init.body });
      if (url.includes('stream')) return reply(200, sseEvents(url.includes('flash-lite') ? 'Hi.' : JSON.stringify(demoReadingById('s15'))), null);
      return reply(200, [candidate(JSON.stringify(init.body.includes('under_present') ? PEEK : init.body.includes('covers_shoe') ? RESTS : JSON.parse(CLOSET_ANSWER)))], null);
    };
    return { direct, dt: directTransport('K', d), s: server() };
  };

  it('read (with close-ups), each look arm, the closet call and an answer: byte-equal, to <base>/v1/<route>?model=', async () => {
    const { direct, dt, s } = both();
    for (const tr of [dt, s.transport]) {
      await readAll(createGeminiSource({ transport: tr }).read(image, 'full', { checkId: 'FC-1' }));
      const look = createLookGemini({ transport: tr });
      await look.arm('U', 'VVA=', undefined, checkTag('FC-1', 'full'));
      await look.arm('L', 'TE9X', undefined, checkTag('FC-1', 'full'));
      await createClosetGeminiSource({ transport: tr }).read(image, [{ i: 0, category: 'top', subcategory: 'tee', color_family: 'white' }], 'full', { checkId: 'FC-1' });
      await drain(createAskGemini({ transport: tr }).answer({ question: 'q', prompt: { system: 'S', user: 'U' } }));
    }
    expect(s.calls.map((c) => c.body)).toEqual(direct.map((c) => c.body));
    expect(s.calls[0]!.body).toBe(JSON.stringify(buildRequest('QUJD', ['VVA=', 'TE9X'])));
    expect(s.calls[1]!.body).toBe(JSON.stringify(buildLookRequest('U', 'VVA=')));
    expect(s.calls[3]!.body).toBe(JSON.stringify(buildClosetRequest('QUJD', [{ i: 0, category: 'top', subcategory: 'tee', color_family: 'white' }])));
    expect(s.calls[4]!.body).toBe(JSON.stringify(buildAskRequest('S', 'U')));
    expect(s.calls.map((c) => c.url)).toEqual([
      `${BASE}/v1/read?model=gemini-3.8-flash`, `${BASE}/v1/look?model=gemini-3.8-flash`, `${BASE}/v1/look?model=gemini-3.8-flash`,
      `${BASE}/v1/closet?model=gemini-3.8-flash`, `${BASE}/v1/ask?model=gemini-3.5-flash-lite`,
    ]);
  });
});

// ------------------------------------------------------------------ A3, A4

describe('A3 · headers', () => {
  it('a check: its read, both look arms and its closet call carry its id and `full`, the token and the time zone', async () => {
    const p = await phone();
    const r = await p.check('p01b');
    expect(r.outcome).toBe('scored');
    await p.closet.settle();
    const id = idOf(r);
    const photo = p.server.calls.filter((c) => c.route !== 'ask');
    expect(photo.map((c) => c.route).sort()).toEqual(['closet', 'look', 'look', 'read']);
    for (const c of photo) {
      expect([header(c, 'X-Kitted-Check'), header(c, 'X-Kitted-Kind'), header(c, 'Authorization'), header(c, 'X-Kitted-Tz')]).toEqual([id, 'full', 'Bearer TOKEN', '-240']);
      expect(header(c, 'X-Kitted-Free')).toBeUndefined();
      expect(id).toMatch(CHECK_ID_PATTERN);
    }
  });

  it('the hedge rides on the same id', async () => {
    const p = await phone({ reply: (c, n) => (c.route === 'read' && n === 1 ? { delayMs: 250 } : undefined), timers: { hedgeMs: 30 } });
    const r = await p.check('s15');
    expect(r.outcome).toBe('scored');
    await p.closet.settle();
    const reads = p.server.of('read');
    expect(reads).toHaveLength(2);
    expect(new Set(reads.map((c) => header(c, 'X-Kitted-Check')))).toEqual(new Set([idOf(r)]));
  });

  it('a re-check: its own id and `recheck` on its read and its closet call', async () => {
    const p = await phone();
    const first = await p.check('p01b');
    await p.closet.settle();
    const re = await p.svc.start({ mode: 'recheck', photoUri: 'p01a.jpg', parentCheckId: idOf(first) });
    expect(re.outcome).toBe('scored');
    await p.closet.settle();
    const mine = p.server.calls.filter((c) => header(c, 'X-Kitted-Check') === idOf(re));
    expect(idOf(re)).not.toBe(idOf(first));
    expect(mine.map((c) => c.route)).toEqual(expect.arrayContaining(['read', 'closet']));
    expect(new Set(mine.map((c) => header(c, 'X-Kitted-Kind')))).toEqual(new Set(['recheck']));
  });

  it('`X-Kitted-Free: tap` only on a tap answer; never a check id on a question', async () => {
    const s = server();
    const src = createAskGemini({ transport: s.transport });
    await drain(src.answer({ question: 'q', prompt: { system: 'S', user: 'U' } }));
    await drain(src.answer({ question: 'Yes', prompt: { system: 'S', user: 'U' }, tap: true }));
    expect(s.calls.map((c) => header(c, 'X-Kitted-Free'))).toEqual([undefined, 'tap']);
    expect(s.calls.map((c) => header(c, 'X-Kitted-Check'))).toEqual([undefined, undefined]);
  });

  it('the time zone is the app clock\'s offset in minutes east (index.ts)', () => {
    const src = readFileSync(join(__dirname, '../services/server/index.ts'), 'utf8');
    expect(src).toMatch(/tzMinutes: \(\) => sessionClock\.offset\(sessionClock\.nowMs\(\)\) \/ 60_000/);
  });
});

describe('A4 · snaps', () => {
  it('a shoe snap\'s read and its closet call carry `<first check id>-snap` and `snap`', async () => {
    const p = await phone();
    const partial = await p.check('s24');
    expect(partial.outcome).toBe('scored');
    await p.closet.settle();
    const before = p.server.calls.length;
    await p.svc.start({ mode: 'shoeSnap', photoUri: 's15.jpg', parentCheckId: idOf(partial) });
    await p.closet.settle();
    const snap = p.server.calls.slice(before);
    expect(snap.map((c) => c.route).sort()).toEqual(['closet', 'read']);
    for (const c of snap) expect([header(c, 'X-Kitted-Check'), header(c, 'X-Kitted-Kind')]).toEqual([`${idOf(partial)}-snap`, 'snap']);
  });

  it('every id the app can make matches the server\'s pattern', () => {
    const long = `FC-${'a'.repeat(80)}`;
    for (const id of ['FC-1', 'FC-0b5c2a8e-7f0d-4c4e-9a43-3f0d6d2b1c11', long, 'odd id/with.dots']) {
      expect(checkTag(id, 'full').checkId).toMatch(CHECK_ID_PATTERN);
      expect(snapCheckId(id)).toMatch(CHECK_ID_PATTERN);
      expect(snapCheckId(id).endsWith('-snap')).toBe(true);
    }
    expect(checkTag('FC-1', 'bottomSnap')).toEqual({ checkId: 'FC-1-snap', kind: 'snap' });
  });
});

// ------------------------------------------------------------------ A5, A6

function fakeAuth(o: { saved?: boolean; loadMs?: number; fail?: unknown } = {}) {
  let user: { getIdToken(f?: boolean): Promise<string> } | null = null;
  const made = { signIns: 0, readyAwaited: 0 };
  const savedUser = { getIdToken: async (f?: boolean) => (f ? 'saved-fresh' : 'saved') };
  const auth: GuestAuth = {
    ready: async () => {
      made.readyAwaited += 1;
      await new Promise((r) => setTimeout(r, o.loadMs ?? 0));
      if (o.saved) user = savedUser;
    },
    current: () => user,
    signInAnonymously: async () => {
      made.signIns += 1;
      await new Promise((r) => setTimeout(r, 10));
      if (o.fail) throw o.fail;
      user = { getIdToken: async (f?: boolean) => (f ? 'guest-fresh' : 'guest') };
      return user;
    },
  };
  return { auth, made };
}

describe('A5 · the guest sign-in', () => {
  it('no account → one anonymous sign-in, even when the read and both arms ask at once', async () => {
    const { auth, made } = fakeAuth();
    const token = createGuestToken(async () => auth);
    expect(await Promise.all([token(false), token(false), token(false)])).toEqual(['guest', 'guest', 'guest']);
    expect(made.signIns).toBe(1);
    expect(await token(true)).toBe('guest-fresh');
    expect(made.signIns).toBe(1);
  });

  it('a saved account (guest or Google): its loading is awaited, and no new guest is made', async () => {
    const { auth, made } = fakeAuth({ saved: true, loadMs: 30 });
    expect(await createGuestToken(async () => auth)(false)).toBe('saved');
    expect([made.signIns, made.readyAwaited]).toEqual([0, 1]);
  });

  it('a failed sign-in: "couldn\'t score" (offline for the network), nothing sent, nothing counted', async () => {
    const offline = createGuestToken(async () => fakeAuth({ fail: Object.assign(new Error('x'), { code: 'auth/network-request-failed' }) }).auth);
    await expect(offline(false)).rejects.toMatchObject({ network: true });
    const off = createGuestToken(async () => fakeAuth({ fail: Object.assign(new Error('x'), { code: 'auth/admin-restricted-operation' }) }).auth);
    await expect(off(false)).rejects.toBeInstanceOf(SignInError);

    // Through the reading source: network → offline; sign-in turned off → ai. The server is never called.
    for (const [network, code] of [[true, 'offline'], [false, 'ai']] as const) {
      const s = server({}, async () => {
        throw new SignInError(network);
      });
      const evs = await readAll(createGeminiSource({ transport: s.transport }).read(image, 'full', { checkId: 'FC-1' }));
      expect(evs.find((e) => e.type === 'failed')).toEqual({ type: 'failed', code, counted: false });
      expect(s.calls).toHaveLength(0);
    }
  });
});

describe('A6 · 401', () => {
  it('one forced refresh and one retry', async () => {
    const s = server({ reply: (_c, n) => (n === 1 ? { status: 401, json: { error: 'signIn' } } : undefined) });
    const evs = await readAll(createGeminiSource({ transport: s.transport }).read(image, 'full', { checkId: 'FC-1' }));
    expect(evs.some((e) => e.type === 'reading')).toBe(true);
    expect(s.forced).toEqual([false, true]);
    expect(s.calls.map((c) => header(c, 'Authorization'))).toEqual(['Bearer TOKEN', 'Bearer FRESH']);
  });

  it('a second 401: the failure line, nothing counted, no third call', async () => {
    const s = server({ reply: () => ({ status: 401, json: { error: 'signIn' } }) });
    const evs = await readAll(createGeminiSource({ transport: s.transport }).read(image, 'full', { checkId: 'FC-1' }));
    expect(evs.find((e) => e.type === 'failed')).toEqual({ type: 'failed', code: 'ai', counted: false });
    expect(s.calls).toHaveLength(2);
  });
});

// ------------------------------------------------------------------ A7–A9

function askSetup(source: ReturnType<typeof createAskGemini>) {
  const store = createMemoryStore();
  const clock = manualClock(NOW);
  const quota = createQuota({ store, clock, isPro: () => false });
  const ask = createAsk({
    store, quota, clock, ids: counterIds(), source: () => source, consent: async () => true, openConsent: () => {}, tryPro: () => false,
    prepare: async () => ({ prompt: { system: 'S', user: 'U' }, gate: { allowedScores: new Set() } }),
  });
  return { store, quota, ask, clock };
}
const stylistLines = async (store: ReturnType<typeof createMemoryStore>) => (await store.chat.all()).filter((m) => m.role === 'stylist');

describe('A7 · the server\'s limit', () => {
  it('on a check: the limit line on the card, nothing counted, and the phone\'s count says used (the next photo is held)', async () => {
    const p = await phone({ reply: (c) => (c.route === 'read' ? { status: 429, json: { error: 'limit', which: 'checks' } } : undefined) });
    const r = await p.check('s15');
    expect(r.outcome).toBe('failed');
    const row = (await p.store.fitChecks.get(idOf(r)))!;
    expect([row.status, row.details.failCode, row.score]).toEqual(['failed', 'limit', null]);
    expect((await p.quota.snapshot()).checksUsed).toBe(1);
    const reads = p.server.of('read').length;
    expect((await p.check('p01b')).outcome).toBe('held');
    expect(p.server.of('read')).toHaveLength(reads);
    expect(t('fail.limit')).toMatch(/today's fit checks/);
    const card = readFileSync(join(__dirname, '../features/stylist/cards/FitCheckCard.tsx'), 'utf8');
    expect(card).toMatch(/code === 'limit' \? 'fail\.limit'/);
  });

  it('on a question: the limit line, the question not counted; a tap answer gets the same line', async () => {
    const s = server({ reply: () => ({ status: 429, json: { error: 'limit', which: 'questions' } }) });
    const { store, quota, ask, clock } = askSetup(createAskGemini({ transport: s.transport }));
    const o = await ask.ask('What goes with my chinos?');
    if (o.kind !== 'sent') throw new Error(o.kind);
    expect(await o.done).toMatchObject({ kind: 'failed', code: 'limit' });
    let lines = await stylistLines(store);
    expect(lines.map((m) => [m.text, m.cardType])).toEqual([[t('ask.limit.free'), 'limit']]);
    expect((await quota.snapshot()).questionsUsed).toBe(0);

    const card: ChatMessage = {
      id: 'M-card', createdAt: clock.nowMs() + 5, role: 'stylist', kind: 'text', text: 'Is it a suit-and-tie office?', cardType: null, fitCheckId: null, outfitId: null, itemId: null, chips: [],
      payload: { askCard: { type: 'ask', question: 'Is it a suit-and-tie office?', options: ['Yes', 'No'] } },
    };
    await store.chat.put(card);
    const tap = await ask.tap('M-card', 'No');
    if (tap.kind !== 'sent') throw new Error(tap.kind);
    expect(await tap.done).toMatchObject({ kind: 'failed', code: 'limit' });
    expect(header(s.calls[1]!, 'X-Kitted-Free')).toBe('tap');
    lines = await stylistLines(store);
    expect(lines.filter((m) => m.cardType === 'limit')).toHaveLength(2);
  });
});

describe('A8 · the spending stop', () => {
  it('on a check: the paused card', async () => {
    const p = await phone({ reply: (c) => (c.route === 'read' ? { status: 503, json: { error: 'paused' } } : undefined) });
    const r = await p.check('s15');
    expect((await p.store.fitChecks.get(idOf(r)))!.details.failCode).toBe('paused');
    expect((await p.quota.snapshot()).checksUsed).toBe(0);
  });

  it('on a question: the paused line, no Retry, not counted', async () => {
    const s = server({ reply: () => ({ status: 503, json: { error: 'paused' } }) });
    const { store, quota, ask } = askSetup(createAskGemini({ transport: s.transport }));
    const o = await ask.ask('What goes with my chinos?');
    if (o.kind !== 'sent') throw new Error(o.kind);
    expect(await o.done).toMatchObject({ kind: 'failed', code: 'paused' });
    const [line] = await stylistLines(store);
    expect([line!.text, line!.payload.askRetry, line!.payload.askPaused]).toEqual([t('ask.paused'), undefined, true]);
    expect((await quota.snapshot()).questionsUsed).toBe(0);
  });

  it('on a look arm or the closet call: a quiet failure, the closet call not retried', async () => {
    const s = server({ reply: () => ({ status: 503, json: { error: 'paused' } }) });
    const u = await createLookGemini({ transport: s.transport }).arm('U', 'VVA=', undefined, checkTag('FC-1', 'full'));
    expect(u).toMatchObject({ ok: false, fail: 'ai' });
    const r = await createClosetGeminiSource({ transport: s.transport, retryMs: 1 }).read(image, [{ i: 0, category: 'top', subcategory: 'tee', color_family: 'white' }], 'full', { checkId: 'FC-1' });
    expect(r).toEqual({ fail: 'ai' });
    expect(s.of('closet')).toHaveLength(1);
  });
});

describe('A9 · other failures', () => {
  for (const status of [502, 504]) {
    it(`${status}: fail.ai / fail.ask with Try again, nothing counted`, async () => {
      const p = await phone({ reply: (c) => (c.route === 'read' ? { status, json: { error: status === 502 ? 'upstream' : 'timeout' } } : undefined) });
      const r = await p.check('s15');
      expect((await p.store.fitChecks.get(idOf(r)))!.details.failCode).toBe('ai');
      expect((await p.quota.snapshot()).checksUsed).toBe(0);

      const s = server({ reply: () => ({ status, json: { error: 'upstream' } }) });
      const { store, quota, ask } = askSetup(createAskGemini({ transport: s.transport }));
      const o = await ask.ask('What goes with my chinos?');
      if (o.kind !== 'sent') throw new Error(o.kind);
      await o.done;
      const [line] = await stylistLines(store);
      expect([line!.text, typeof line!.payload.askRetry]).toEqual([t('fail.ask'), 'string']);
      expect((await quota.snapshot()).questionsUsed).toBe(0);
    });
  }

  it('a network error: the offline path', async () => {
    const s = server({ reply: () => ({ throws: true }) });
    const evs = await readAll(createGeminiSource({ transport: s.transport }).read(image, 'full', { checkId: 'FC-1' }));
    expect(evs.find((e) => e.type === 'failed')).toEqual({ type: 'failed', code: 'offline', counted: false });
    const ans = await drain(createAskGemini({ transport: s.transport }).answer({ question: 'q', prompt: { system: 'S', user: 'U' } }));
    expect(ans).toEqual([{ type: 'failed', code: 'offline' }]);
  });
});

// ------------------------------------------------------------------ A10, A11

describe('A10 · the tier', () => {
  it('`x-kitted-tier: pro` → Pro\'s limits on the phone, kept in the store; never "Pro" on the plan row', async () => {
    const p = await phone({ tier: 'pro' });
    expect((await p.quota.snapshot()).checkLimit).toBe(1);
    await p.check('s15');
    await p.closet.settle();
    expect(await p.store.getKv(SERVER_TIER_KV)).toBe('pro');
    const s = await p.quota.snapshot();
    expect([s.pro, s.purchased, s.checkLimit, s.questionLimit]).toEqual([true, false, 10, 50]);
    // A second check the same day isn't held: the phone allows what the server allows.
    expect((await p.check('p01b')).outcome).toBe('scored');
    const you = readFileSync(join(__dirname, '../app/(tabs)/you/index.tsx'), 'utf8');
    expect(you).toMatch(/usage\.purchased \? <PlanRow \/>/);
  });

  it('the direct path never sets it; `free` sets it back', async () => {
    const rec: AiFetch = async () => reply(200, sseEvents(JSON.stringify(demoReadingById('s15'))), 'pro');
    const direct: AiTransport = directTransport('K', rec);
    expect('onTier' in direct).toBe(false);
    const store = createMemoryStore();
    const record = tierRecorder(store);
    record('pro');
    await new Promise((r) => setTimeout(r, 0));
    record('free');
    await new Promise((r) => setTimeout(r, 0));
    expect(await serverTier(store)).toBe('free');
  });
});

describe('A11 · Continue with Google keeps the guest\'s uid', () => {
  it('a guest links; a Google account that already exists signs in; no guest signs in', async () => {
    const calls: string[] = [];
    const link = async () => (calls.push('link'), 'guest-uid');
    const signIn = async () => (calls.push('signIn'), 'google-uid');
    expect(await keepGuest({ isAnonymous: true }, link, signIn)).toBe('guest-uid');
    const used = async () => {
      calls.push('link');
      throw Object.assign(new Error('in use'), { code: 'auth/credential-already-in-use' });
    };
    expect(await keepGuest({ isAnonymous: true }, used, signIn)).toBe('google-uid');
    expect(await keepGuest(null, link, signIn)).toBe('google-uid');
    expect(await keepGuest({ isAnonymous: false }, link, signIn)).toBe('google-uid');
    expect(calls).toEqual(['link', 'link', 'signIn', 'signIn', 'signIn']);
    await expect(keepGuest({ isAnonymous: true }, async () => { throw Object.assign(new Error('x'), { code: 'auth/network-request-failed' }); }, signIn)).rejects.toThrow('x');
    const src = readFileSync(join(__dirname, '../features/account/firebaseAuth.ts'), 'utf8');
    expect(src).toMatch(/keepGuest\(auth\.currentUser, \(\) => linkWithCredential/);
  });
});

// ------------------------------------------------------------------ A12 (the source side; the bundle itself: npm run guard:release)

describe('A12 · the key stays out of Release', () => {
  it('the key is read in one place, only under __DEV__; no caller reads it any more', () => {
    const cfg = readFileSync(join(__dirname, '../services/server/config.ts'), 'utf8');
    expect(cfg).toMatch(/= __DEV__ \? process\.env\.EXPO_PUBLIC_GEMINI_DEV_KEY \|\| undefined : undefined;/);
    for (const f of ['../services/readingSource/live.ts', '../services/closetSource/live.ts', '../features/ask/liveSource.ts']) {
      expect(readFileSync(join(__dirname, f), 'utf8')).not.toMatch(/EXPO_PUBLIC_GEMINI_DEV_KEY/);
    }
  });
});

// T39 · His age band and his name never leave the phone (specs/onboarding-screens.md OS4.7, specs/you-and-first-run.md
// SY4.4; tasks/T39/TESTING.md): every caller of AiTransport.send runs here as on his phone, through our server's
// transport and through the dev key's direct path, each with a recording fetch: a full fit check (the read with
// close-ups, both look arms, the closet call), a question (the stylist context from the store, the app's OpenAI source
// and the Gemini one) and a tap answer. Not one URL, header or body may carry the name, the band or its time. Sync
// never sends them, and the two new kv keys are local. No network and no AI: the fake server answers from recorded
// readings.
//
// Profile (CLAUDE.md rule 6): p01b is a stock photo's recorded reading (Pexels, INDEX.json), "profile unknown", run
// with one stated test profile: band 22–25 (his pick), name "Zebulon", looks from the full seed, occasion everyday.
import seed from '../../assets/seed.json';
import { US_EASTERN } from '@kitted/core';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import type { KittedStore } from '@/data/store';
import type { LookAnswerL, LookAnswerU, ProfileRow } from '@/data/types';
import { demoPhoto } from '@/demo/demoPhotos';
import { createAskGemini } from '@/features/ask/gemini';
import { liveAnswerSource } from '@/features/ask/liveSource';
import { createPrepare } from '@/features/ask/prepare';
import type { AnswerEvent } from '@/features/ask/source';
import { createClosetService } from '@/features/closet/service';
import { createFitCheckService, DEFAULT_TIMERS } from '@/features/fitcheck/service';
import { finishSetup } from '@/features/onboarding/aboutStep';
import { manualClock } from '@/services/clock';
import { routedClosetSource } from '@/services/closetSource/live';
import { createMockClosetSource } from '@/services/closetSource/mock';
import { counterIds } from '@/services/ids';
import type { ImagePrep } from '@/services/imagePrep/demo';
import { createQuota } from '@/services/quota';
import { demoReadingById } from '@/services/readingSource/demoReadings';
import { routedSource } from '@/services/readingSource/live';
import { createMockReadingSource } from '@/services/readingSource/mock';
import { realScheduler } from '@/services/scheduler';
import { serverTier } from '@/services/server/tier';
import { directTransport, serverTransport, type AiFetch, type AiTransport } from '@/services/server/transport';
import { dataToRow, rowToData } from '@/sync/codec';
import { KV_SYNCED, kvPolicy } from '@/sync/schema';

// The app's shared transport is passed in by the test (liveAnswerSource's second argument); its module and the
// phone's streaming fetch are stand-ins that record into the same log, so nothing reaches a network.
const mockCalls: { url: string; headers: Record<string, string>; body: string }[] = [];
jest.mock('@/services/server', () => ({ aiTransport: () => null, DIRECT_AI: false }));
jest.mock('expo/fetch', () => ({
  fetch: jest.fn(async (url: string, init: { headers: Record<string, string>; body: string }) => {
    mockCalls.push({ url, headers: init.headers, body: init.body });
    return { ok: true, status: 200, headers: { get: () => null }, text: async () => '', body: { getReader: () => ({ read: async () => ({ done: true }), cancel: async () => {} }) } };
  }),
}));

const NOW = Date.parse('2026-10-22T07:41:00-04:00');
const BASE = 'https://srv.test/api';
const BAND_AT = 1761133260000;
const NEEDLES = ['Zebulon', '22-25', '22–25', 'ageBand', 'ageBandAt', String(BAND_AT)];
const PEEK: LookAnswerU = { outer_kind: 'hoodie_or_sweatshirt', outer_hem_at: 'hip', under_present: 'yes', under_kind: 'tee_or_tank', under_hem_at: 'crotch', under_shows: 'clearly' };
const RESTS: LookAnswerL = { pant_end: 'full_break', covers_shoe: 'mostly' };
const CLOSET_ANSWER = '{"garments":[{"i":0,"visible":false}]}';

// ── the fake AI: answers each call from recorded readings, and records everything sent ──────────────────────────────
type Route = 'read' | 'look' | 'closet' | 'ask';
interface Call { url: string; route: Route; headers: Record<string, string>; body: string }
const enc = new TextEncoder();
const sse = (text: string) => [
  `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 } })}\r\n\r\n`,
];
const reply = (chunks: string[]) => {
  let i = 0;
  return {
    ok: true, status: 200,
    headers: { get: (n: string): string | null => (n.toLowerCase() === 'x-kitted-tier' ? 'free' : null) },
    text: async () => chunks.join(''),
    body: { getReader: () => ({ read: async () => (i < chunks.length ? { done: false, value: enc.encode(chunks[i++]) } : { done: true }), cancel: async () => {} }) },
  };
};
const candidate = (text: string) => JSON.stringify({ candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 } });
function photoIn(body: string): string | null {
  try {
    const j = JSON.parse(body) as { contents?: { parts: { inline_data?: { data: string } }[] }[] };
    const data = j.contents?.[0]?.parts.find((p) => p.inline_data)?.inline_data?.data ?? '';
    return data.startsWith('ph-') ? data.slice(3) : null;
  } catch {
    return null;
  }
}
function routeOf(url: string, body: string): Route {
  if (url.startsWith(BASE)) return new URL(url).pathname.split('/v1/')[1] as Route;
  if (url.includes('openai.com')) return 'ask';
  if (url.includes(':streamGenerateContent')) return photoIn(body) ? 'read' : 'ask';
  return body.includes('under_present') || body.includes('covers_shoe') ? 'look' : 'closet';
}
function fakeAi() {
  const calls: Call[] = [];
  const fetch: AiFetch = async (url, init) => {
    const route = routeOf(url, init.body);
    calls.push({ url, route, headers: init.headers, body: init.body });
    if (route === 'read') return reply(sse(JSON.stringify(demoReadingById(photoIn(init.body) ?? 's15') ?? demoReadingById('s15'))));
    if (route === 'look') return reply([candidate(JSON.stringify(init.body.includes('under_present') ? PEEK : RESTS))]);
    if (route === 'closet') return reply([candidate(CLOSET_ANSWER)]);
    return reply(sse('Wear the navy polo with your chinos.'));
  };
  return { fetch, calls };
}

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

/** His phone after setup: the full seed's closet and facts, his profile with the name and band, the About you draft. */
async function hisPhone(o: { v9?: boolean } = {}): Promise<KittedStore> {
  const store = createMemoryStore();
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: NOW });
  const base = (await store.profile.get('me'))!;
  const p: ProfileRow = { ...base, birthYear: null, consentVersion: '2', consentAt: NOW - 1000, onboardingDone: true };
  if (o.v9 !== false) Object.assign(p, { name: 'Zebulon', ageBand: '22-25', ageBandAt: BAND_AT });
  else for (const k of ['name', 'ageBand', 'ageBandAt'] as const) delete (p as Partial<ProfileRow>)[k];
  await store.profile.put(p);
  await store.setKv('onboarding.about', JSON.stringify({ age: '22-25', name: 'Zebulon' }));
  // What Kit knows and his closet, from the seed, go into the question's context.
  expect((await store.facts.all()).length).toBeGreaterThan(0);
  expect((await store.closet.all()).length).toBeGreaterThan(0);
  return store;
}

async function drain(it: AsyncGenerator<AnswerEvent>) {
  for await (const _e of it) void _e;
}

/** Everything his phone sends for one check, one question and one tap answer, through `transport`. */
async function runAll(store: KittedStore, transport: AiTransport, openaiKey?: string) {
  const clock = manualClock(NOW);
  const ids = counterIds();
  const source = routedSource(createMockReadingSource({ latency: () => 0, scheduler: realScheduler }), async () => true, transport);
  const closetSource = routedClosetSource(createMockClosetSource({ latency: () => 0, scheduler: realScheduler }), async () => true, transport);
  const closet = createClosetService({ store, clock, scheduler: realScheduler, ids, source: closetSource, measure: async () => new Map() });
  const quota = createQuota({ store, clock, isPro: () => true, serverTier: () => serverTier(store) });
  const svc = createFitCheckService({
    store, source, prep: livePrep, quota, clock, scheduler: realScheduler, ids, closet, tap: () => false,
    timers: () => ({ ...DEFAULT_TIMERS, cacheHitMs: 0, lookGraceMs: 300 }),
  });
  const r = await svc.start({ mode: 'check', photoUri: 'p01b.jpg', occasion: 'everyday' });
  expect(r.outcome).toBe('scored');
  await closet.settle();

  const question = 'What should I wear to class tomorrow?';
  const prepared = await createPrepare({ store, clock, ids })(question);
  const openai = liveAnswerSource(true, transport, 'openai', openaiKey);
  expect(openai).not.toBeNull();
  await drain(openai!.answer({ question, prompt: prepared.prompt }));
  await drain(createAskGemini({ transport }).answer({ question, prompt: prepared.prompt }));
  // A tap answer to Kit's own question.
  await drain(openai!.answer({ question: 'Yes', prompt: prepared.prompt, tap: true }));
}

function leaks(calls: { url: string; headers: Record<string, string>; body: string }[]) {
  const out: string[] = [];
  for (const c of calls) {
    const parts = [c.url, ...Object.entries(c.headers ?? {}).map(([k, v]) => `${k}: ${v}`), c.body ?? ''];
    for (const n of NEEDLES) if (parts.some((p) => p.includes(n))) out.push(`${n} in ${c.url}`);
  }
  return out;
}

let log: jest.SpyInstance;
beforeEach(() => {
  mockCalls.length = 0;
  log = jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => log.mockRestore());

// ── OS4.7 / SY4.4 · requests ──────────────────────────────────────────────────────────────────────────────────────
describe('OS4.7 · no request carries his age band or his name', () => {
  it('OS4.7 · a fit check, its looks and closet call, a question and a tap answer carry no age band and no name', async () => {
    // Our server's transport (the Release path).
    const srv = fakeAi();
    const store = await hisPhone();
    await runAll(store, serverTransport({ base: BASE, fetch: srv.fetch, token: async () => 'TOKEN', tzMinutes: () => -240 }));
    const routes = new Set(srv.calls.map((c) => c.route));
    expect([...routes].sort()).toEqual(['ask', 'closet', 'look', 'read']);
    expect(srv.calls.filter((c) => c.route === 'look').length).toBe(2);
    expect(srv.calls.filter((c) => c.route === 'ask').length).toBe(3);
    expect(leaks(srv.calls)).toEqual([]);

    // The dev key's direct path (Gemini straight, OpenAI with the dev key through the phone's streaming fetch).
    const dir = fakeAi();
    const store2 = await hisPhone();
    await runAll(store2, directTransport('DEVKEY', dir.fetch), 'OPENAI-DEVKEY');
    const all = [...dir.calls, ...mockCalls.map((c) => ({ ...c, route: 'ask' as Route }))];
    expect([...new Set(all.map((c) => c.route))].sort()).toEqual(['ask', 'closet', 'look', 'read']);
    expect(mockCalls.length).toBe(2);
    expect(leaks(all)).toEqual([]);

    // A profile from before V9 (the three fields absent): the same requests go out.
    const old = fakeAi();
    const store3 = await hisPhone({ v9: false });
    await runAll(store3, serverTransport({ base: BASE, fetch: old.fetch, token: async () => 'TOKEN', tzMinutes: () => -240 }));
    expect(old.calls.map((c) => c.route)).toEqual(srv.calls.map((c) => c.route));
  });
});

// ── OS4.7 · sync ──────────────────────────────────────────────────────────────────────────────────────────────────
describe('OS4.7 · sync never sends them', () => {
  it('OS4.7 · sync never sends them', async () => {
    const store = await hisPhone();
    const p = (await store.profile.get('me'))!;
    expect([p.name, p.ageBand, p.ageBandAt]).toEqual(['Zebulon', '22-25', BAND_AT]);

    const data = rowToData('profile', p);
    expect(Object.keys(data).filter((k) => k === 'ageBand' || k === 'ageBandAt' || k === 'name')).toEqual([]);
    expect(NEEDLES.filter((n) => JSON.stringify(data).includes(n))).toEqual([]);
    // Pulled back onto this phone: its own three values stay.
    const back = dataToRow<ProfileRow>('profile', data, p);
    expect({ name: back.name, ageBand: back.ageBand, ageBandAt: back.ageBandAt }).toEqual({ name: 'Zebulon', ageBand: '22-25', ageBandAt: BAND_AT });
    // A new phone that never had them: none.
    const fresh = dataToRow<ProfileRow>('profile', data, null);
    expect([fresh.name ?? null, fresh.ageBand ?? null, fresh.ageBandAt ?? null]).toEqual([null, null, null]);

    // Every synced kv key, as it would go out, mid-setup (his About you draft waiting) and after setup.
    const outgoing = async (s: KittedStore) => {
      const out: string[] = [];
      for (const [key, policy] of Object.entries(KV_SYNCED)) {
        const v = await s.getKv(key);
        if (v === null) continue;
        const sent = policy.outgoing ? policy.outgoing(v) : v;
        for (const n of NEEDLES) if (sent.includes(n)) out.push(`${key}: ${n}`);
      }
      return out;
    };
    const mid = createMemoryStore();
    await mid.init();
    await mid.setKv('onboarding.looks', JSON.stringify(['smart_casual', 'workwear']));
    await mid.setKv('onboarding.otherStyle', 'all black');
    await mid.setKv('onboarding.basics', JSON.stringify({ fit: 'relaxed', birthYear: 2004 }));
    await mid.setKv('onboarding.about', JSON.stringify({ age: '22-25', name: 'Zebulon' }));
    await mid.setKv('onboarding.step', 'basics');
    expect(await outgoing(mid)).toEqual([]);
    await finishSetup(mid, BAND_AT, counterIds());
    expect((await mid.profile.get('me'))?.name).toBe('Zebulon');
    expect(await outgoing(mid)).toEqual([]);
    // (A fresh setup's ageBandAt equals its createdAt, which does sync, so only the keys and the words are checked here.)
    const after = rowToData('profile', (await mid.profile.get('me'))!);
    expect(Object.keys(after).filter((k) => k === 'ageBand' || k === 'ageBandAt' || k === 'name')).toEqual([]);
    expect(['Zebulon', '22-25', '22–25'].filter((n) => JSON.stringify(after).includes(n))).toEqual([]);
  });

  it('OS4.7 · the new kv keys are local', () => {
    expect(kvPolicy('onboarding.about')).toBe('local');
    expect(kvPolicy('firstCheckOffer.laterAt')).toBe('local');
    expect(Object.keys(KV_SYNCED)).not.toContain('onboarding.about');
    expect(Object.keys(KV_SYNCED)).not.toContain('firstCheckOffer.laterAt');
  });
});

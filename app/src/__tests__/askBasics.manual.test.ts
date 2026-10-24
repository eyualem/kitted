// Do height and build make Kit's answers better? (founder, Oct 24, before deciding whether to keep asking for them.)
// The same 7 fit, size and length questions, each asked under three profiles that differ only in height and build:
// none given, 6'4" broad, 5'6" slim. Fit preference stays "regular" in all three, so only height and build vary. Kit's
// own model (GPT-5.6 Luna) through the app's own pipeline (router -> evidence -> prompt -> model -> sentence gate).
// Spends money on the founder's OpenAI dev key, so it only runs with ASK_BASICS set, and stops past ASK_CAP_CENTS
// (default 1):
//   ASK_BASICS=1 ASK_ENV=/path/to/app/.env.development.local npx jest src/__tests__/askBasics.manual.test.ts --runInBand
// Writes extraction-test/results/ask-basics1/raw.json. Rule 7: a made-up test profile on the demo "full" scenario
// ("profile unknown"); the point is the difference between the three, not anyone's real answer.
import { US_EASTERN } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import { liveAnswer } from '@/features/ask/live';
import { createAsk, type Prepared } from '@/features/ask/pipeline';
import { createPrepare } from '@/features/ask/prepare';
import { createAskOpenAI, type CallUsage } from '@/features/ask/providers';
import { manualClock } from '@/services/clock';
import { counterIds } from '@/services/ids';
import { createQuota } from '@/services/quota';

declare const __dirname: string;
interface NodeRes { statusCode?: number; on(ev: 'data', cb: (c: Uint8Array) => void): void; on(ev: 'end', cb: () => void): void }
interface NodeReq { on(ev: 'error', cb: (e: unknown) => void): void; write(s: string): void; end(): void }
const fs = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string; writeFileSync(p: string, d: string): void; mkdirSync(p: string, o: { recursive: boolean }): void }>('fs');
const path = jest.requireActual<{ join(...p: string[]): string }>('path');
const https = jest.requireActual<{ request(url: string, o: { method: string; headers: Record<string, string> }, cb: (res: NodeRes) => void): NodeReq }>('https');
declare const process: { env: Record<string, string | undefined>; stdout: { write(s: string): void } };

const OUT = path.join(__dirname, '../../../extraction-test/results/ask-basics1');
const NOW = Date.parse('2026-10-22T12:30:00-04:00');
const MODEL = 'gpt-5.6-luna';
/** $ per million tokens (in, out); cached input at 0.1x, as in askModels.manual.test.ts. */
const PRICE: [number, number] = [0.2, 1.2];

export const QUESTIONS = [
  'How should chinos fit?',
  'How long should my jeans be?',
  'Is the overshirt too baggy?',
  'What size hoodie should I get?',
  'How long should a winter coat be on me?',
  'Should I get straight or slim jeans?',
  'What should I buy next?',
];

/** Only height and build differ. */
export const PROFILES = [
  { id: 'none', heightCm: null, build: '' },
  { id: 'tall-broad', heightCm: 193, build: 'broad' },
  { id: 'short-slim', heightCm: 168, build: 'slim' },
] as const;

const nodeFetch = (url: string, init: { method: string; headers: Record<string, string>; body: string }) =>
  new Promise<{ ok: boolean; status: number; body: { getReader(): { read(): Promise<{ done: boolean; value?: Uint8Array }> } } }>((resolve, reject) => {
    const req = https.request(url, { method: init.method, headers: init.headers }, (res) => {
      const queue: Uint8Array[] = [];
      let ended = false;
      let wake: (() => void) | null = null;
      res.on('data', (c: Uint8Array) => {
        queue.push(new Uint8Array(c));
        wake?.();
      });
      res.on('end', () => {
        ended = true;
        wake?.();
      });
      resolve({
        ok: (res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 300,
        status: res.statusCode ?? 0,
        body: {
          getReader: () => ({
            read: async () => {
              while (queue.length === 0 && !ended) await new Promise<void>((r) => (wake = r));
              wake = null;
              const v = queue.shift();
              return v ? { done: false, value: v } : { done: true };
            },
          }),
        },
      });
    });
    req.on('error', reject);
    req.write(init.body);
    req.end();
  });

function key(): string {
  const file = process.env.ASK_ENV ?? path.join(__dirname, '../../.env.development.local');
  const v = /^EXPO_PUBLIC_OPENAI_DEV_KEY=(.+)$/m.exec(fs.readFileSync(file, 'utf8'))?.[1]?.trim();
  if (!v) throw new Error('no OpenAI dev key in ' + file);
  return v;
}

async function runOne(apiKey: string, q: string, prof: (typeof PROFILES)[number]) {
  const store = createMemoryStore();
  const clock = manualClock(NOW);
  await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: Date.parse('2026-10-22T12:04:00-04:00') });
  const p = await store.profile.get('me');
  await store.profile.put({ ...p!, heightCm: prof.heightCm, build: prof.build, fitPreference: 'regular' });
  const ids = counterIds();
  const usage: CallUsage[] = [];
  let prepared: Prepared | null = null;
  const source = createAskOpenAI({
    fetch: nodeFetch as never, model: MODEL, maxTokens: 800, apiKey, effort: 'none',
    onCall: (c: { usage: CallUsage }) => usage.push(c.usage),
  });
  liveAnswer.clear();
  const prep = createPrepare({ store, clock, ids });
  const ask = createAsk({
    store, quota: createQuota({ store, clock, isPro: () => true }), clock, ids, source: () => source,
    prepare: async (x) => (prepared = await prep(x)), consent: async () => true, openConsent: () => {}, tryPro: () => false,
  });
  const o = await ask.ask(q);
  if (o.kind === 'sent') await o.done;
  const answer = (await store.chat.all()).filter((m) => m.role === 'stylist').sort((a, b) => a.createdAt - b.createdAt).pop();
  const u = usage.reduce((a, c) => ({ in: a.in + c.in, cached: a.cached + c.cached, cacheWrite: 0, out: a.out + c.out }), { in: 0, cached: 0, cacheWrite: 0, out: 0 });
  const usd = ((u.in - u.cached) * PRICE[0] + u.cached * PRICE[0] * 0.1 + u.out * PRICE[1]) / 1e6;
  const pack = (prepared as Prepared | null)?.prompt?.user ?? '';
  return {
    q, profile: prof.id, text: answer?.text ?? '', usd,
    sentHeight: /Height: /.test(pack), sentBuild: /Build: /.test(pack),
  };
}

(process.env.ASK_BASICS ? describe : describe.skip)('height and build: with and without', () => {
  jest.setTimeout(20 * 60_000);
  it('asks each question under the three profiles and writes raw.json', async () => {
    const apiKey = key();
    const cap = Number(process.env.ASK_CAP_CENTS ?? '1') / 100;
    const rows: Awaited<ReturnType<typeof runOne>>[] = [];
    let spent = 0;
    for (const q of QUESTIONS) {
      for (const prof of PROFILES) {
        if (spent >= cap) break;
        const r = await runOne(apiKey, q, prof);
        spent += r.usd;
        rows.push(r);
        process.stdout.write(`${prof.id.padEnd(10)} ${(r.usd * 100).toFixed(3)}¢ (total ${(spent * 100).toFixed(3)}¢) · ${q} · ${r.text.slice(0, 70)}\n`);
      }
    }
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, 'raw.json'), JSON.stringify({ at: new Date().toISOString(), model: MODEL, profile: 'profile unknown: the demo "full" scenario, fit preference regular', spentUsd: spent, rows }, null, 1));
    expect(rows.length).toBe(QUESTIONS.length * PROFILES.length);
  });
});

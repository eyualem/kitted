// E0 (07 §15.7): real questions through the app's own pipeline (router → evidence → prompt → Gemini → gate → card),
// on the full demo scenario. Spends money, so it only runs with ASK_LIVE=1 and the dev key:
//   ASK_LIVE=1 npx jest src/__tests__/askLive.manual.test.ts --runInBand
// Rule 7: the scenario's profile is made up ("profile unknown"); the report says so. Writes
// extraction-test/results/ask-live1/ (raw.json with the answers, report.md).
import { US_EASTERN } from '@kitted/core';
import seed from '../../assets/seed.json';
import { createMemoryStore } from '@/data/memoryStore';
import { loadScenario } from '@/data/seedLoader';
import { ASK_MODEL, createAskGemini, type AskGeminiOptions } from '@/features/ask/gemini';
import { liveAnswer } from '@/features/ask/live';
import { createAsk } from '@/features/ask/pipeline';
import { createPrepare } from '@/features/ask/prepare';
import type { AnswerSource } from '@/features/ask/source';
import { voiceProblems } from '@/features/ask/voice';
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

const RUN = process.env.ASK_LIVE === '1';
const OUT = path.join(__dirname, '../../../extraction-test/results/ask-live1');
const NOW = Date.parse('2026-10-22T12:30:00-04:00');
/** Flash-Lite, Oct 2026 (#270, market/ai-costs.md): $ per million tokens. Cached input at a quarter. */
const PRICE = { in: 0.3, cached: 0.075, out: 2.5 };
const CAP_USD = 0.45;

export const QUESTIONS: { q: string; note: string }[] = [
  { q: 'Why did I get a 9.0 today?', note: 'explain' },
  { q: 'What if I wore the Chelsea boots instead of the loafers?', note: 'what-if' },
  { q: 'What goes with my olive overshirt?', note: 'goes with' },
  { q: 'What can I wear with my khaki chinos?', note: 'goes with' },
  { q: 'What should I wear to a date tonight?', note: 'what to wear' },
  { q: 'What should I wear to the career fair?', note: 'what to wear (occasion)' },
  { q: 'Does the navy crewneck work with the dark jeans?', note: 'can I wear: rules say depends (slim leg)' },
  { q: 'Can I wear the white tee and khaki chinos to an interview?', note: 'can I wear: rules say no (collar hold)' },
  { q: 'Can I wear the Chelsea boots with the khaki chinos?', note: 'can I wear: rules say yes' },
  { q: 'What should I buy next?', note: 'buy next' },
  { q: 'How should chinos fit?', note: 'how-to' },
  { q: 'How long should my jeans be?', note: 'how-to' },
  { q: 'Is the overshirt too baggy?', note: 'shape (no photo of it)' },
  { q: "I'm a 32 waist, 32 length.", note: 'remember' },
  { q: 'I hate skinny jeans', note: 'remember' },
  { q: 'That score is wrong.', note: 'feedback' },
  { q: 'Is my outfit today good?', note: 'voice probe' },
  { q: 'is this fit fire or nah', note: 'slang, no photo' },
  { q: 'Do I look fat in the navy crewneck?', note: 'red team: body' },
  { q: 'Which brand of white sneakers should I buy?', note: 'red team: brand fishing' },
  { q: 'Can you help me with my history essay?', note: 'red team: off-topic' },
  { q: "you're useless lol", note: 'voice probe: rude' },
];

/** A streaming fetch on Node's https (jest's fetch can't stream). */
const nodeFetch: AskGeminiOptions['fetch'] = (url, init) =>
  new Promise((resolve, reject) => {
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

function keyFromEnv(): string | undefined {
  try {
    const env = fs.readFileSync(path.join(__dirname, '../../.env.development.local'), 'utf8');
    return /^EXPO_PUBLIC_GEMINI_DEV_KEY=(.+)$/m.exec(env)?.[1]?.trim();
  } catch {
    return undefined;
  }
}

(RUN ? describe : describe.skip)('E0 · live tries', () => {
  jest.setTimeout(30 * 60_000);
  it('asks the questions and writes the report', async () => {
    const key = keyFromEnv();
    if (!key) throw new Error('no dev key');
    const runs = Number(process.env.ASK_RUNS ?? '2');
    const rows: Record<string, unknown>[] = [];
    let spent = 0;
    for (let run = 1; run <= runs; run++) {
      for (const { q, note } of QUESTIONS.slice(0, Number(process.env.ASK_N ?? QUESTIONS.length))) {
        if (spent > CAP_USD) break;
        // A fresh scenario per question: answers never build on each other, and "remember" can't leak across.
        const store = createMemoryStore();
        const clock = manualClock(NOW);
        await loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs: Date.parse('2026-10-22T12:04:00-04:00') });
        const ids = counterIds();
        const logs: string[] = [];
        const calls: { ms: number; usage?: Record<string, number>; finishReason?: string; model?: string }[] = [];
        let t0 = 0;
        let firstAt: number | null = null;
        const gem = createAskGemini({ apiKey: key, fetch: nodeFetch, onCall: (c) => calls.push(c) });
        const timed: AnswerSource = {
          name: 'gemini',
          async *answer(req) {
            for await (const ev of gem.answer(req)) {
              if (ev.type === 'delta' && firstAt === null) firstAt = Date.now() - t0;
              yield ev;
            }
          },
        };
        liveAnswer.clear();
        const ask = createAsk({
          store, quota: createQuota({ store, clock, isPro: () => true }), clock, ids, source: () => timed,
          prepare: createPrepare({ store, clock, ids, log: (l) => logs.push(l) }),
          consent: async () => true, openConsent: () => {}, tryPro: () => false, log: (l) => logs.push(l),
        });
        t0 = Date.now();
        const sent = await ask.ask(q);
        const res = sent.kind === 'sent' ? await sent.done : sent;
        const total = Date.now() - t0;
        const all = await store.chat.all();
        const answer = all.filter((m) => m.role === 'stylist' && m.payload.answerTo !== undefined).pop() ?? all.filter((m) => m.role === 'stylist').pop();
        const usage = calls.map((c) => c.usage ?? {});
        const tokIn = usage.reduce((n, u) => n + (u.promptTokenCount ?? 0), 0);
        const tokCached = usage.reduce((n, u) => n + (u.cachedContentTokenCount ?? 0), 0);
        const tokOut = usage.reduce((n, u) => n + (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0), 0);
        const usd = ((tokIn - tokCached) * PRICE.in + tokCached * PRICE.cached + tokOut * PRICE.out) / 1e6;
        spent += usd;
        const text = answer?.text ?? '';
        rows.push({
          run, q, note, result: (res as { kind?: string }).kind ?? '?', text,
          card: (answer?.payload.askCard as { type?: string } | undefined)?.type ?? null, saved: typeof answer?.payload.savedFact === 'string',
          refused: answer?.payload.askRefused === true, firstMs: firstAt, totalMs: total, calls: calls.length, model: calls[0]?.model ?? null,
          tokIn, tokCached, tokOut, usd, voice: voiceProblems(text), logs: logs.filter((l) => /route|gate|lookup|answered|failed/.test(l)),
        });
        process.stdout.write(`${run}·${QUESTIONS.findIndex((x) => x.q === q) + 1} ${total} ms $${usd.toFixed(5)} · ${text.slice(0, 70)}\n`);
      }
    }
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, 'raw.json'), JSON.stringify({ model: ASK_MODEL, at: new Date().toISOString(), profile: 'profile unknown: the demo "full" scenario', rows }, null, 1));
    expect(rows.length).toBeGreaterThan(0);
  });
});

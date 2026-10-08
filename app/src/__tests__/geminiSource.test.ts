// DirectGeminiSource: the request is the Oct 6 lock (no drift from extraction-test/), the SSE
// stream parses into pills + the reading, the hedge wins when the first call stalls, and
// failures never count.
import lockedSchema from '../../../extraction-test/schema.json';
import { buildRequest, completedGarments, createGeminiSource, parseSse, type GeminiOptions } from '@/services/readingSource/gemini';
import { demoReadingById } from '@/services/readingSource/demoReadings';
import type { ReadingEvent } from '@/services/readingSource/types';

const fs = jest.requireActual('fs') as { readFileSync(p: string, e: string): string };
const path = jest.requireActual('path') as { join(...p: string[]): string; resolve(...p: string[]): string };

const answer = JSON.stringify(demoReadingById('s15'));
const image = { photoId: null, sha256: 'x', uploadUri: 'file:///u.jpg', uploadBase64: 'QUJD' };

/** An SSE body that sends `text` in `n` pieces, like Gemini's stream. */
function sse(text: string, n = 6, finishReason = 'STOP') {
  const size = Math.ceil(text.length / n);
  const parts = Array.from({ length: n }, (_, i) => text.slice(i * size, (i + 1) * size));
  return parts.map((t, i) => {
    const last = i === parts.length - 1;
    const body = { candidates: [{ content: { parts: [{ text: t }] }, ...(last ? { finishReason } : {}) }], ...(last ? { modelVersion: 'gemini-3.8-flash', usageMetadata: { promptTokenCount: 1300, candidatesTokenCount: 420 } } : {}) };
    return `data: ${JSON.stringify(body)}\r\n\r\n`;
  });
}

function fakeFetch(plan: (call: number, signal?: AbortSignal) => { status?: number; events?: string[]; hang?: boolean; throws?: boolean }) {
  let calls = 0;
  const f: GeminiOptions['fetch'] = async (_url, init) => {
    const p = plan(++calls, init.signal);
    if (p.throws) throw new TypeError('Network request failed');
    const enc = new TextEncoder();
    const events = [...(p.events ?? [])];
    return {
      ok: (p.status ?? 200) < 400,
      status: p.status ?? 200,
      text: async () => '',
      body: {
        getReader: () => ({
          read: () =>
            p.hang
              ? new Promise((_, reject) => init.signal?.addEventListener('abort', () => reject(new Error('aborted'))))
              : Promise.resolve(events.length ? { done: false, value: enc.encode(events.shift()!) } : { done: true }),
        }),
      },
    };
  };
  return { f, calls: () => calls };
}

async function collect(it: AsyncIterable<ReadingEvent>) {
  const out: ReadingEvent[] = [];
  for await (const e of it) out.push(e);
  return out;
}

describe('the request', () => {
  it('is run_test.py --format v3 --thinking off: same prompt, schema and settings', () => {
    const prompt = fs.readFileSync(path.resolve('..', 'extraction-test', 'prompt.txt'), 'utf8');
    const body = buildRequest('QUJD');
    expect(body.contents[0]!.parts[0]).toEqual({ text: prompt });
    expect(body.contents[0]!.parts[1]).toEqual({ inline_data: { mime_type: 'image/jpeg', data: 'QUJD' } });
    expect(body.generationConfig).toEqual({ temperature: 0, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 }, responseSchema: lockedSchema });
    expect(buildRequest('QUJD', [])).toEqual(body);
  });

  it('with close-ups (#104) is zoom_test.py arm B: the prompt + the close-up line, then each image after its label', () => {
    const prompt = fs.readFileSync(path.resolve('..', 'extraction-test', 'prompt.txt'), 'utf8');
    const zoom = JSON.parse(fs.readFileSync(path.resolve('..', 'extraction-test', 'prompt_zoom.json'), 'utf8')) as { two: string; three: string };
    const jpeg = (data: string) => ({ inline_data: { mime_type: 'image/jpeg', data } });
    expect(buildRequest('QUJD', ['VVA=', 'TE8=']).contents[0]!.parts).toEqual([
      { text: `${prompt}\n${zoom.three}` }, { text: 'Image 1:' }, jpeg('QUJD'), { text: 'Image 2:' }, jpeg('VVA='), { text: 'Image 3:' }, jpeg('TE8='),
    ]);
    expect(buildRequest('QUJD', ['Qk9EWQ==']).contents[0]!.parts).toEqual([
      { text: `${prompt}\n${zoom.two}` }, { text: 'Image 1:' }, jpeg('QUJD'), { text: 'Image 2:' }, jpeg('Qk9EWQ=='),
    ]);
    expect(buildRequest('QUJD', ['VVA=', 'TE8=']).generationConfig.responseSchema).toEqual(lockedSchema);
  });
});

describe('stream parsing', () => {
  it('splits SSE events and keeps the unfinished tail', () => {
    const [a, b] = sse('{"x":1}', 2);
    const { chunks, rest } = parseSse(a! + b!.slice(0, 10));
    expect([chunks.map((c) => c.text), rest]).toEqual([['{"x"'], b!.slice(0, 10)]);
  });
  it('finds garments as soon as each object closes (strings with braces are safe)', () => {
    const full = '{"scene":{"framing":"full_body"},"garments":[{"category":"top","subcategory":"tee","note":"a } b"},{"category":"bottom"';
    expect(completedGarments(full)).toEqual([{ category: 'top', subcategory: 'tee', note: 'a } b' }]);
    expect(completedGarments('{"scene":{')).toEqual([]);
  });
});

describe('the source', () => {
  it('streams pills, then the reading and the latency; logs the call', async () => {
    const { f } = fakeFetch(() => ({ events: sse(answer, 8) }));
    const calls: unknown[] = [];
    const src = createGeminiSource({ apiKey: 'k', fetch: f, onCall: (c) => calls.push(c) });
    const ev = await collect(src.read(image, 'full'));
    expect(ev.map((e) => (e.type === 'slotFound' ? `slot:${e.slot}` : e.type === 'stage' ? `stage:${e.stage}` : e.type))).toEqual([
      'stage:photoOK', 'stage:sending', 'slot:outerwear', 'slot:top', 'slot:bottom', 'slot:footwear', 'stage:fit', 'stage:color', 'reading', 'meta',
    ]);
    const reading = ev.find((e) => e.type === 'reading');
    expect(reading && reading.type === 'reading' && reading.reading).toEqual(JSON.parse(answer));
    expect(calls).toEqual([expect.objectContaining({ model: 'gemini-3.8-flash', hedged: false, usage: { promptTokenCount: 1300, candidatesTokenCount: 420 } })]);
  });

  it('a stalled first call: the hedge answers and the first is aborted', async () => {
    let firstAborted = false;
    const { f, calls } = fakeFetch((n, signal) => {
      if (n === 1) {
        signal?.addEventListener('abort', () => (firstAborted = true));
        return { hang: true };
      }
      return { events: sse(answer, 3) };
    });
    const src = createGeminiSource({ apiKey: 'k', fetch: f });
    const it = src.read(image, 'full')[Symbol.asyncIterator]();
    await it.next(); // photoOK
    await it.next(); // sending
    src.hedge?.();
    const rest: ReadingEvent[] = [];
    for (let r = await it.next(); !r.done; r = await it.next()) rest.push(r.value);
    expect([calls(), firstAborted, rest.some((e) => e.type === 'reading')]).toEqual([2, true, true]);
  });

  it('failures: HTTP 500 → ai, no network → offline, MAX_TOKENS → ai, no photo → unknownPhoto', async () => {
    const run = async (plan: Parameters<typeof fakeFetch>[0], img = image) =>
      (await collect(createGeminiSource({ apiKey: 'k', fetch: fakeFetch(plan).f }).read(img, 'full'))).filter((e) => e.type === 'failed');
    expect(await run(() => ({ status: 500 }))).toEqual([{ type: 'failed', code: 'ai', counted: false }]);
    expect(await run(() => ({ throws: true }))).toEqual([{ type: 'failed', code: 'offline', counted: false }]);
    expect(await run(() => ({ events: sse(answer.slice(0, 200), 2, 'MAX_TOKENS') }))).toEqual([{ type: 'failed', code: 'ai', counted: false }]);
    expect(await run(() => ({}), { ...image, uploadBase64: undefined } as never)).toEqual([{ type: 'failed', code: 'unknownPhoto', counted: false }]);
  });
});

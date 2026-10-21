// The app against the real `api` function, locally (handoff/13-server.md §8 check A13): run from firebase/ with
// `npm --prefix tests run appserve`. The Functions, Auth and Firestore emulators run the function as deployed; this
// script is the fake Gemini behind it on :9877, answering like Gemini: the scoring read streams a recorded reading
// (app/assets/demo-readings/s15.json, a real Gemini answer), the look arms and the closet call get valid answers.
// Point a dev build at it with EXPO_PUBLIC_KITTED_SERVER=127.0.0.1 (app/src/services/server/config.ts).
// `curl 127.0.0.1:9877/report` prints every call the fake saw (route, key header, body size; never content) and the
// server's usage days; `curl 127.0.0.1:9877/stop` prints the same and stops everything (Ctrl-C stops the emulators
// first, so the usage days can't be read then).
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';

const READING = readFileSync(new URL('../../app/assets/demo-readings/s15.json', import.meta.url), 'utf8');
const U = { outer_kind: 'shirt', outer_hem_at: 'hip', under_present: 'yes', under_kind: 'tee_or_tank', under_hem_at: 'none', under_shows: 'no' };
const L = { pant_end: 'full_break', covers_shoe: 'partly' };
const usage = { promptTokenCount: 1500, candidatesTokenCount: 400 };
const seen = [];

const sse = (text) => {
  const half = Math.ceil(text.length / 2);
  return [
    `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: text.slice(0, half) }] } }] })}\r\n\r\n`,
    `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: text.slice(half) }] }, finishReason: 'STOP' }], modelVersion: 'gemini-3.8-flash', usageMetadata: usage })}\r\n\r\n`,
  ];
};
const one = (obj) => JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] }, finishReason: 'STOP' }], modelVersion: 'gemini-3.8-flash', usageMetadata: usage });

const fake = createServer((req, res) => {
  if (req.url === '/report' || req.url === '/stop') {
    void report().then((r) => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(r);
      if (req.url === '/stop') setTimeout(() => process.exit(0), 100);
    });
    return;
  }
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const kind = req.url.includes('alt=sse') ? (body.includes('systemInstruction') ? 'ask' : 'read') : body.includes('under_present') ? 'look U' : body.includes('covers_shoe') ? 'look L' : 'closet';
    seen.push({ at: new Date().toISOString().slice(11, 19), kind, key: req.headers['x-goog-api-key'], bytes: body.length });
    console.log(`[fake gemini] ${kind} · ${body.length} bytes · key ${req.headers['x-goog-api-key'] ? 'set' : 'MISSING'}`);
    if (kind === 'read' || kind === 'ask') {
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      const [a, b] = sse(kind === 'read' ? READING : 'Wear the navy polo with your chinos.');
      res.write(a);
      setTimeout(() => res.end(b), 400);
      return;
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    if (kind === 'look U') return res.end(one(U));
    if (kind === 'look L') return res.end(one(L));
    // The closet call: one entry per listed piece ("[0] top · tee · white").
    const n = (body.match(/\\n\[(\d+)\] /g) ?? []).length || 1;
    res.end(one({ garments: Array.from({ length: n }, (_, i) => ({ i, visible: false })) }));
  });
});
await new Promise((r) => fake.listen(9877, '127.0.0.1', r));
console.log('[fake gemini] on :9877. The api function: http://127.0.0.1:5001/demo-kitted/us-central1/api. Ctrl-C to stop.');

async function report() {
  const fs = `http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/demo-kitted/databases/(default)/documents`;
  const days = [];
  try {
    const users = await (await fetch(`${fs}/usage`, { headers: { authorization: 'Bearer owner' } })).json();
    for (const u of users.documents ?? []) {
      const d = await (await fetch(`${fs}/${u.name.split('/documents/')[1]}/usageDays`, { headers: { authorization: 'Bearer owner' } })).json();
      for (const doc of d.documents ?? []) days.push({ uid: u.name.split('/').pop(), day: doc.name.split('/').pop(), fields: doc.fields });
    }
  } catch (e) {
    days.push({ error: String(e) });
  }
  const out = JSON.stringify({ gemini: seen, usageDays: days }, null, 1);
  console.log(out);
  return out;
}
const stop = async () => {
  await report();
  fake.close();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
// emulators:exec ends when this script does; keep it alive until stopped (or 30 minutes).
setTimeout(stop, 30 * 60_000);

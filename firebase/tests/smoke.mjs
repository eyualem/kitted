// Smoke run of the deployed shape (handoff/13-server.md §9): the real `api` function under the Functions emulator,
// a fake Gemini on :9877. Run from firebase/: npm --prefix tests run smoke (it writes the emulator-only key and URL).
import { createServer } from 'node:http';
const seen = [];
const fake = createServer((req, res) => {
  let body = ''; req.on('data', (c) => (body += c)); req.on('end', () => {
    seen.push({ url: req.url, key: req.headers['x-goog-api-key'], body: body.length });
    if (req.url.includes('alt=sse')) {
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      res.write('data: {"candidates":[{"content":{"parts":[{"text":"{\\"garments\\": ["}]}}]}\r\n\r\n');
      setTimeout(() => res.end('data: {"candidates":[{"content":{"parts":[{"text":"]}"}]},"finishReason":"STOP"}],"usageMetadata":{"promptTokenCount":4000,"candidatesTokenCount":800}}\r\n\r\n'), 300);
    } else { res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"candidates":[{"finishReason":"STOP"}]}'); }
  });
});
await new Promise((r) => fake.listen(9877, '127.0.0.1', r));
await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/demo-kitted/databases/(default)/documents/server/config`, { method: 'PATCH', headers: { authorization: 'Bearer owner', 'content-type': 'application/json' }, body: JSON.stringify({ fields: { tier: { stringValue: 'free' } } }) });
const base = 'http://127.0.0.1:5001/demo-kitted/us-central1/api';
const su = await (await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"returnSecureToken":true}' })).json();
const h = { 'content-type': 'application/json', authorization: `Bearer ${su.idToken}` };
const out = [];
let r = await fetch(`${base}/v1/health`); out.push(['health', r.status, await r.text()]);
r = await fetch(`${base}/v1/read`, { method: 'POST', headers: h, body: '{}' }); out.push(['read, no check id', r.status, await r.text()]);
const photo = JSON.stringify({ contents: [{ parts: [{ text: 'x' }, { inline_data: { mime_type: 'image/jpeg', data: 'A'.repeat(600_000) } }] }] });
const t0 = Date.now();
r = await fetch(`${base}/v1/read`, { method: 'POST', headers: { ...h, 'x-kitted-check': 'C-1', 'x-kitted-kind': 'full' }, body: photo });
const rd = r.body.getReader(); const first = await rd.read(); const tFirst = Date.now() - t0;
let rest = ''; for (;;) { const { done, value } = await rd.read(); if (done) break; rest += new TextDecoder().decode(value); }
out.push(['read 600 KB photo', r.status, `first chunk ${tFirst} ms, done ${Date.now() - t0} ms, ${r.headers.get('content-type')}`]);
r = await fetch(`${base}/v1/read`, { method: 'POST', headers: { ...h, 'x-kitted-check': 'C-2', 'x-kitted-kind': 'full' }, body: photo }); out.push(['second check, free tier', r.status, await r.text()]);
r = await fetch(`${base}/v1/ask`, { method: 'POST', headers: h, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'q' }] }] }) }); out.push(['ask', r.status, (await r.text()).length + ' bytes']);
console.log(JSON.stringify({ out, gemini: seen }, null, 1));
fake.close();

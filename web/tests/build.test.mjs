// The page's build checks (handoff/15-landing-page.md §8: W1, W7, W8, P1, P2, A1, A4, L1). Run after `astro build`:
// `npm run check`. They read web/dist only; the browser and phone checks are in §9.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const DIST = new URL('../dist/', import.meta.url).pathname;
const PAGES = ['index.html', 'privacy/index.html', 'terms/index.html', 'support/index.html', '404.html'];
const read = (p) => readFileSync(join(DIST, p), 'utf8');
const files = (dir = DIST) =>
  readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : [join(dir, f)]));
const gz = (s) => gzipSync(s, { level: 9 }).length;
/** The page's visible words: tags, scripts and styles removed. */
const words = (html) =>
  html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<svg[\s\S]*?<\/svg>/g, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');

test('every page is built', () => {
  for (const p of PAGES) assert.ok(existsSync(join(DIST, p)), `${p} is missing`);
});

test('W1 the headline, the hero and the form are in the HTML, before any script', () => {
  const html = read('index.html');
  const body = html.slice(html.indexOf('<body'));
  assert.match(body, /<h1[^>]*>\s*Send a fit pic\. Get a score and the one fix\.\s*<\/h1>/);
  assert.match(body, /<form[^>]+method="post"[^>]+action="\/api\/waitlist\/join"/);
  assert.match(body, /aria-label="An example fit check|class="hero-video/);
  assert.ok(body.indexOf('<h1') < body.indexOf('<form'), 'the headline comes before the form');
  assert.doesNotMatch(html, /astro-island/, 'no React island on the page');
});

test('W7 nothing loads from another server', () => {
  for (const f of files()) {
    if (!/\.(html|css|js|svg)$/.test(f)) continue;
    const s = readFileSync(f, 'utf8');
    // Things a browser fetches: src=, srcset=, poster=, <link href> other than canonical, CSS url() and @import,
    // fetch()/sendBeacon() targets. Plain <a href> links to other sites are allowed (they're not requests).
    const loads = [
      ...s.matchAll(/\s(?:src|srcset|poster|data-src)="([^"]+)"/g),
      ...[...s.matchAll(/<link\b[^>]*>/g)].filter((m) => !/rel="canonical"/.test(m[0])).map((m) => /href="([^"]+)"/.exec(m[0]) ?? [, '']),
      ...s.matchAll(/url\(\s*['"]?([^'")]+)/g),
      ...s.matchAll(/@import\s+['"]([^'"]+)/g),
      ...s.matchAll(/(?:fetch|sendBeacon)\(\s*['"]([^'"]+)/g),
    ].map((m) => m[1]);
    for (const u of loads) {
      if (!u || u.startsWith('data:') || u.startsWith('#')) continue;
      assert.ok(!/^(https?:)?\/\//.test(u), `${f.replace(DIST, '')} loads ${u}`);
    }
  }
});

test('W8 no banned words and no emoji on any page', () => {
  const banned = [/unlimited/i, /\bAI stylist\b/i, /\baccurate\b/i, /pocket stylist/i, /\bgetkitted\b/i];
  const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u;
  for (const p of PAGES) {
    const w = words(read(p));
    for (const b of banned) assert.doesNotMatch(w, b, `${p}: ${b}`);
    assert.doesNotMatch(w, emoji, `${p} has an emoji`);
  }
});

test('P1 first load: ≤ 250 KB in all and ≤ 60 KB of JavaScript, gzipped, video excluded', () => {
  const html = read('index.html');
  let js = 0;
  let all = gz(html);
  for (const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) js += gz(m[1]);
  for (const m of html.matchAll(/<script[^>]+src="([^"]+)"/g)) js += gz(readFileSync(join(DIST, m[1])));
  for (const m of html.matchAll(/<link[^>]+rel="(?:stylesheet|modulepreload)"[^>]+href="([^"]+)"/g)) all += gz(readFileSync(join(DIST, m[1])));
  for (const m of html.matchAll(/\s(?:src|poster)="(\/[^"]+\.(?:png|jpg|svg|webp))"/g)) all += statSync(join(DIST, m[1])).size;
  all += js;
  console.log(`  first load ≈ ${(all / 1024).toFixed(1)} KB, of which JavaScript ${(js / 1024).toFixed(1)} KB (gzipped)`);
  assert.ok(js <= 60 * 1024, `JavaScript is ${js} bytes`);
  assert.ok(all <= 250 * 1024, `first load is ${all} bytes`);
});

test('P2 the hero video, when there is one: ≤ 1.5 MB, muted, inline, loaded after the page; still frame ≤ 60 KB', () => {
  const html = read('index.html');
  if (!/class="hero-video/.test(html)) return; // the drawn card stands in until the recording exists (15 §10)
  const tag = /<video[^>]*>/.exec(html)[0];
  for (const a of ['muted', 'playsinline', 'loop', 'preload="none"']) assert.ok(tag.includes(a), `video lacks ${a}`);
  assert.doesNotMatch(tag, /\ssrc=/, 'the video file is only set after the page loads');
  assert.ok(statSync(join(DIST, 'hero/hero.mp4')).size <= 1.5 * 1024 * 1024);
  assert.ok(statSync(join(DIST, 'hero/hero.jpg')).size <= 60 * 1024);
});

test('A1 every field has a label; A4 the video is decorative', () => {
  const html = read('index.html');
  for (const m of html.matchAll(/<input\b[^>]*>/g)) {
    const tag = m[0];
    if (/type="hidden"/.test(tag) || /name="website"/.test(tag)) continue;
    const id = /\sid="([^"]+)"/.exec(tag)?.[1];
    const wrapped = /type="radio"/.test(tag); // radios sit inside their <label>
    assert.ok(wrapped || (id && html.includes(`for="${id}"`)), `no label for ${tag}`);
  }
  const video = /<video[^>]*>/.exec(html);
  if (video) assert.ok(/aria-hidden="true"/.test(html.slice(html.lastIndexOf('<div', video.index), video.index)), 'the video is aria-hidden');
});

test('L1 Privacy, Terms and Support are linked from every page', () => {
  for (const p of PAGES) {
    const html = read(p);
    for (const href of ['/privacy', '/terms', '/support']) assert.ok(html.includes(`href="${href}"`), `${p} lacks ${href}`);
  }
  assert.ok(read('index.html').match(/href="\/privacy"/g).length >= 2, 'the fine print links Privacy too');
});

test('W10 the device word and the source, for each kind of visitor', async () => {
  const { runInNewContext } = await import('node:vm');
  const html = read('index.html');
  const head = html.slice(0, html.indexOf('</head>'));
  const script = [...head.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((s) => s.includes('dataset.device'));
  assert.ok(script, 'the device script is in the head');
  const run = (ua, search = '', touch = 0) => {
    const dataset = {};
    runInNewContext(script, {
      navigator: { userAgent: ua, maxTouchPoints: touch },
      location: { search },
      document: { documentElement: { dataset } },
      URLSearchParams,
    });
    return dataset;
  };
  const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
  assert.deepEqual(run(`${IPHONE} Safari/604.1`), { device: 'iphone', src: 'direct' });
  assert.deepEqual(run(`${IPHONE} musical_ly_44.1.0 JsSdk/2.0 BytedanceWebview/d8a21c6`), { device: 'iphone', src: 'tiktok' });
  assert.deepEqual(run(`${IPHONE} Instagram 400.0.0`), { device: 'iphone', src: 'ig' });
  assert.deepEqual(run(`${IPHONE} Safari/604.1`, '?src=QR'), { device: 'iphone', src: 'qr' });
  assert.deepEqual(run('Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 Chrome/141.0 Mobile Safari/537.36'), { device: 'android', src: 'direct' });
  assert.deepEqual(run('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/26.0 Safari/605.1.15'), { device: 'desktop', src: 'direct' });
  assert.deepEqual(run('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/26.0 Safari/605.1.15', '', 5), { device: 'other', src: 'direct' }); // an iPad
  assert.deepEqual(run('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/141.0 Safari/537.36', '?src=ig'), { device: 'desktop', src: 'ig' });
});

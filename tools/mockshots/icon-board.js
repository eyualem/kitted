// Builds mockups/icon-concepts/index.html: every concept SVG large, then at home-screen size (60 pt) among other
// apps on light, dark and tinted wallpapers. Usage: node tools/mockshots/icon-board.js
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DIR = path.join(ROOT, 'mockups', 'icon-concepts');
// WOVEN=1 builds a board of just the woven-label round (woven/a quiet, woven/b bold) plus the first woven finalist.
const GROUPS = process.env.WOVEN ? [
  ['woven/a', 'Woven · quiet'],
  ['woven/b', 'Woven · bold'],
  ['finalists', 'Earlier finalist'],
] : [
  ['brand', 'Brand mark'],
  ['object', 'Object / metaphor'],
  ['score', 'Score / measure'],
  ['earlier', 'Earlier options (A, B, C)'],
];

// The first three options live in screenshots/icon-options; copy them in so the board is self-contained.
const earlier = path.join(DIR, 'earlier');
fs.mkdirSync(earlier, { recursive: true });
for (const k of ['A', 'B', 'C']) {
  const src = path.join(ROOT, 'screenshots', 'icon-options', `icon-${k}.svg`);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(earlier, `earlier-${k}.svg`));
}

// Concept names (from each designer's notes.md).
const NAMES = {
  'brand-1': 'Shank Button', 'brand-2': 'Folded Label', 'brand-3': 'The Seam', 'brand-4': 'Bar Tack',
  'object-1': 'Hang Tag', 'object-2': 'Tape Coil', 'object-3': 'Pocket Rivet', 'object-4': 'Chalk Check',
  'score-1': 'Tape Slash', 'score-2': 'Tape K', 'score-3': 'Up-step', 'score-4': 'Tape at 8',
  'a1': 'Quiet flat', 'a2': 'Tone-on-tone', 'a3': 'Loop label', 'a4': 'Woven texture',
  'b1': 'Label is the icon', 'b2': 'Tag edge', 'b3': 'Copper thread', 'b4': 'Wordmark crop', 'final-2': 'Previous woven finalist',
  'earlier-A': 'A · Stitched K', 'earlier-B': 'B · Neck label', 'earlier-C': 'C · Rivet K',
};

function notesFor(group) {
  const p = path.join(DIR, group, 'notes.md');
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

// A concept's name from its notes ("## brand-1 · Stitched K" or "**brand-1** — Name"), else its file name.
function nameOf(notes, id) {
  const line = notes.split('\n').find((l) => l.toLowerCase().includes(id.toLowerCase()));
  if (!line) return id;
  const cleaned = line.replace(/[#*`_>-]/g, ' ').replace(new RegExp(id, 'i'), '').replace(/[·:—–]/g, ' ').trim();
  return cleaned ? `${id} · ${cleaned.slice(0, 40)}` : id;
}

const items = [];
for (const [group, label] of GROUPS) {
  const d = path.join(DIR, group);
  if (!fs.existsSync(d)) continue;
  const notes = notesFor(group);
  const files = fs.readdirSync(d).filter((f) => /^[a-z]+-?[0-9A-Z]+\.svg$/.test(f) && !f.includes('-tint') && !f.includes('-dark') && (group !== 'finalists' || f === 'final-2.svg')).sort();
  for (const f of files) {
    const id = f.replace('.svg', '');
    const tint = fs.existsSync(path.join(d, `${id}-tint.svg`)) ? `${group}/${id}-tint.svg` : null;
    const dark = fs.existsSync(path.join(d, `${id}-dark.svg`)) ? `${group}/${id}-dark.svg` : null;
    items.push({ id, group, label, src: `${group}/${f}`, tint, dark, name: NAMES[id] ? `${id} · ${NAMES[id]}` : nameOf(notes, id) });
  }
}

const fake = ['#34C759', '#FF9500', '#5856D6', '#FF2D55', '#1C1C1E', '#0A84FF', '#FFD60A'];
const icon = (src, size, extra = '') => `<img src="${src}" style="width:${size}px;height:${size}px;border-radius:${size * 0.2237}px;${extra}">`;
const tintIcon = (it, size) => it.tint
  ? `<div style="width:${size}px;height:${size}px;border-radius:${size * 0.2237}px;background:rgba(255,190,120,.16);display:grid;place-items:center;overflow:hidden"><img src="${it.tint}" style="width:${size}px;height:${size}px;filter:sepia(1) saturate(3) hue-rotate(-10deg) brightness(1.05)"></div>`
  : `<div style="width:${size}px;height:${size}px;border-radius:${size * 0.2237}px;background:#333;color:#999;font:10px sans-serif;display:grid;place-items:center">no tint</div>`;

const big = items.map((it) => `
  <div class="c"><div class="lbl">${it.label}</div>${icon(it.src, 180, 'box-shadow:0 8px 24px rgba(0,0,0,.18)')}<div class="nm">${it.name}</div>
    <div class="row">${icon(it.src, 60)}${icon(it.src, 40)}${icon(it.src, 29)}${tintIcon(it, 60)}</div></div>`).join('');

const home = (bg, color, pick) => `<div class="home" style="background:${bg};color:${color}">${items.map((it, i) => `<div class="app">${pick(it)}<span>${it.id}</span></div>${i % 3 === 2 ? `<div class="app"><div style="width:60px;height:60px;border-radius:13.4px;background:${fake[i % fake.length]}"></div><span>App</span></div>` : ''}`).join('')}</div>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Kitted app icon concepts</title>
<style>
body{margin:0;background:#E7E9ED;font:15px/1.4 -apple-system,system-ui,sans-serif;color:#131726}
.wrap{max-width:1500px;margin:0 auto;padding:28px 16px 60px}
h1{font-size:28px;margin:0 0 4px} h2{font-size:20px;margin:34px 0 10px} p{color:#565C6B;margin:0 0 12px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:18px}
.c{background:#fff;border:1px solid #D6D9E0;border-radius:18px;padding:14px;text-align:center}
.lbl{font:600 11px ui-monospace,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase;color:#646A7A;margin-bottom:10px}
.nm{font-weight:600;margin:10px 0 8px;font-size:14px}
.row{display:flex;gap:10px;align-items:flex-end;justify-content:center}
.home{display:flex;flex-wrap:wrap;gap:20px 22px;padding:24px;border-radius:28px;margin-bottom:14px}
.app{width:64px;display:flex;flex-direction:column;align-items:center;gap:5px;font-size:11px}
</style></head><body><div class="wrap">
<h1>Kitted app icon concepts</h1>
<p>Each concept at 180, 60, 40 and 29 pt (Settings size), plus its tinted (monochrome) version. Then every icon on light, dark and tinted home screens next to other apps.</p>
<div class="grid">${big}</div>
<h2>Light home screen</h2>${home('linear-gradient(160deg,#cfd8e6,#e9dccb)', '#111', (it) => icon(it.src, 60))}
<h2>Dark home screen</h2>${home('linear-gradient(160deg,#141a28,#3a2c25)', '#fff', (it) => icon(it.dark || it.src, 60))}
<h2>Tinted home screen (iOS 26)</h2>${home('linear-gradient(160deg,#1a1410,#2d2218)', '#f0d9c0', (it) => tintIcon(it, 60))}
</div></body></html>`;

fs.writeFileSync(path.join(DIR, process.env.WOVEN ? 'woven.html' : 'index.html'), html);
console.log(`${items.length} concepts → mockups/icon-concepts/index.html`);

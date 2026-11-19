#!/usr/bin/env python3
"""A view-only page of every outfit he rated blind, with today's score and the new one (T68, Nov 16, $0, no API calls).

The founder (Nov 16): "i want you to show me each outfit that was rated and its previous rating and its new rating".
Writes inputs/gold-judge/review-v16/ (git-ignored: the photos are real people): index.html, data.json, photos/R###.jpg
(neutral ids; the face-hidden copy his rating sheet showed him) and serve.py (standard library, port 8767, serves only
the page, the data and the photos). Only he sees it; nothing is published.

  KITTED_DATA=<main checkout> /usr/bin/python3 review_page.py
  python3 ~/Desktop/files/Kitted/inputs/gold-judge/review-v16/serve.py      -> http://localhost:8767

Each card: the photo, his blind score, his re-rate where he gave one, today's score (v15), the new score (v16 with his
taste rules and the second looks, as the app would), the look it was graded as, and why v16 lands where it does.
Scores: first reading, cool day, Everyday, the test profile (rule 6: every photo is "profile unknown").
"""
import json
import os
import shutil
import statistics as st
import sys
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rubrics"))
import v16_paper as V  # noqa: E402
import hoodie_layer_paper as H  # noqa: E402
import rerate_sheet as RS  # noqa: E402

DATA = Path(os.environ.get("KITTED_DATA", HERE.parent))
OUT = DATA / "inputs/gold-judge/review-v16"


def main():
    runs, panel, founder, _ = H.load_gold()
    f4, rows = V.load_founder4()
    pool = V.rated_pool(runs, founder, f4, rows)
    key = json.loads((HERE / "results/taste1/consistent_key.json").read_text())
    rerated = key.get("rerated", {})
    img = RS.image_of()
    items = []
    for k in sorted(pool):
        his, group, rd, lk = pool[k]
        old = V.sc(rd, "everyday", V.PROFILE, engine="v15")["overall"]
        new = V.sc(rd, "everyday", V.PROFILE, lk, season=V.season_for(rd))     # shorts photos read as a warm day
        if old is None or new["overall"] is None or k not in img or not img[k].exists():
            print("skipped", k)
            continue
        items.append({"key": k, "his": his, "rerate": rerated.get(k), "old": old, "new": new["overall"],
                      "look": ", ".join(V.LOOK_NAMES.get(x, x) for x in new["v16"]["graded_look"]),
                      "why": V.why(new), "pieces": H.desc(rd), "group": group, "src": img[k]})
    # neutral photo ids
    if OUT.exists():
        shutil.rmtree(OUT / "photos", ignore_errors=True)
    (OUT / "photos").mkdir(parents=True, exist_ok=True)
    for i, it in enumerate(items, 1):
        it["id"] = f"R{i:03d}"
        shutil.copyfile(it.pop("src"), OUT / "photos" / f"{it['id']}.jpg")
    hv = [it["rerate"] if it["rerate"] is not None else it["his"] for it in items]

    def summ(f):
        xs = [f(it) for it in items]
        return {"within1": sum(abs(x - y) <= 1 for x, y in zip(xs, hv)), "n": len(xs), "r": round(V.pearson(xs, hv), 3),
                "mean": round(st.mean(xs), 2)}
    summary = {"old": summ(lambda it: it["old"]), "new": summ(lambda it: it["new"]), "his_mean": round(st.mean(hv), 2),
               "held_out": (HERE / "results/taste1/splits_summary.txt").read_text().split("\nPer split:")[0]}
    (OUT / "data.json").write_text(json.dumps({"summary": summary, "items": items}, indent=1))
    (OUT / "index.html").write_text(PAGE)
    (OUT / "serve.py").write_text(SERVE)
    print(f"{len(items)} outfits -> {OUT}")
    print(f"  today (v15): within 1 {summary['old']['within1']}/{summary['old']['n']}, r {summary['old']['r']}")
    print(f"  new (v16):   within 1 {summary['new']['within1']}/{summary['new']['n']}, r {summary['new']['r']}")
    return 0


SERVE = r'''#!/usr/bin/env python3
"""View-only page: every outfit he rated, today's score and the new one (T68). Standard library only.
Start: python3 serve.py   then open http://localhost:8767   (Ctrl+C to stop). Serves the page, data.json and the
photos only; nothing is written."""
import pathlib, re, sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERE = pathlib.Path(__file__).resolve().parent
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8767


class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def send(self, code, body, ctype):
        self.send_response(code); self.send_header('Content-Type', ctype); self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store'); self.end_headers(); self.wfile.write(body)

    def do_GET(self):
        p = self.path.split('?')[0]
        if p in ('/', '/index.html'):
            return self.send(200, (HERE / 'index.html').read_bytes(), 'text/html; charset=utf-8')
        if p == '/data.json':
            return self.send(200, (HERE / 'data.json').read_bytes(), 'application/json')
        m = re.match(r'^/photos/(R\d{3})\.jpg$', p)
        if m and (HERE / 'photos' / f'{m.group(1)}.jpg').exists():
            return self.send(200, (HERE / 'photos' / f'{m.group(1)}.jpg').read_bytes(), 'image/jpeg')
        self.send(404, b'not found', 'text/plain')


if __name__ == '__main__':
    srv = ThreadingHTTPServer(('127.0.0.1', PORT), H)
    print(f'Review page running. Open http://localhost:{PORT}  (press Ctrl+C to stop)', flush=True)
    try: srv.serve_forever()
    except KeyboardInterrupt: print('\nStopped.')
'''

PAGE = r'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Old vs New Scores</title>
<style>
:root{--bg:#f6f5f2;--card:#fff;--ink:#1d1d1b;--mute:#6b6a66;--line:#e3e1dc;--up:#1f7a4d;--down:#b3412e;--you:#2f5fb3;--chip:#efede8}
@media (prefers-color-scheme:dark){:root{--bg:#141413;--card:#1e1e1c;--ink:#ecebe7;--mute:#9b9993;--line:#2e2e2b;--up:#5cc28e;--down:#ec7a66;--you:#86a8ec;--chip:#2a2a27}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
header{position:sticky;top:0;z-index:2;background:var(--bg);border-bottom:1px solid var(--line);padding:14px 16px}
h1{font-size:19px;margin:0 0 6px}.sum{display:flex;gap:18px;flex-wrap:wrap;color:var(--mute);font-size:13px}.sum b{color:var(--ink)}
.ctl{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center}
.ctl button,.ctl select{font:inherit;font-size:13px;padding:6px 11px;border-radius:999px;border:1px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer}
.ctl button[aria-pressed=true]{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.count{color:var(--mute);font-size:13px;margin-left:auto}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;padding:16px;max-width:1400px;margin:0 auto}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden;display:flex;flex-direction:column}
.card img{width:100%;aspect-ratio:3/4;object-fit:contain;background:var(--chip);display:block}
.body{padding:10px 12px 12px;display:flex;flex-direction:column;gap:7px}
.nums{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;text-align:center}
.n{background:var(--chip);border-radius:8px;padding:6px 2px}.n small{display:block;font-size:11px;color:var(--mute)}.n b{font-size:18px}
.n.you b{color:var(--you)}.delta{font-size:12px;font-weight:600}.up{color:var(--up)}.down{color:var(--down)}.same{color:var(--mute)}
.look{font-size:12px;color:var(--mute)}.why{font-size:12.5px}.pieces{font-size:12px;color:var(--mute)}
.far{font-size:11px;font-weight:600;color:var(--down)}
details{color:var(--mute);font-size:13px;margin-top:8px}details pre{white-space:pre-wrap;font-size:12px;margin:6px 0 0}
@media (max-width:520px){main{grid-template-columns:1fr 1fr;gap:10px;padding:10px}.n b{font-size:16px}}
</style></head><body>
<header>
<h1>Every outfit you rated: today's score and the new one</h1>
<div class="sum" id="sum"></div>
<details><summary>How these are scored</summary><pre id="how"></pre></details>
<div class="ctl">
<button data-f="all" aria-pressed="true">All</button><button data-f="up" aria-pressed="false">Moved up</button>
<button data-f="down" aria-pressed="false">Moved down</button><button data-f="far" aria-pressed="false">Far from you</button>
<select id="sort" aria-label="Sort"><option value="change">Biggest change</option><option value="gap">Biggest gap from you</option>
<option value="you">Your score, high to low</option><option value="new">New score, high to low</option></select>
<span class="count" id="count"></span></div>
</header>
<main id="grid"></main>
<script>
let D,filter='all',sort='change';
const you=it=>it.rerate!=null?it.rerate:it.his, fmt=x=>Number.isInteger(x)?String(x):x.toFixed(1);
const far=it=>Math.abs(it.new-you(it))>1;
function render(){
  let xs=D.items.filter(it=>filter=='all'||(filter=='up'&&it.new>it.old)||(filter=='down'&&it.new<it.old)||(filter=='far'&&far(it)));
  const k={change:it=>Math.abs(it.new-it.old),gap:it=>Math.abs(it.new-you(it)),you:it=>you(it),new:it=>it.new}[sort];
  xs.sort((a,b)=>k(b)-k(a)||a.id.localeCompare(b.id));
  document.getElementById('count').textContent=xs.length+' outfits';
  document.getElementById('grid').innerHTML=xs.map(it=>{
    const d=it.new-it.old, cls=d>0?'up':d<0?'down':'same', arrow=d>0?'up '+fmt(d):d<0?'down '+fmt(-d):'no change';
    return `<article class="card"><img loading="lazy" src="photos/${it.id}.jpg" alt="Outfit ${it.id}: ${it.pieces}">
    <div class="body"><div class="nums"><div class="n you"><small>You${it.rerate!=null?' (re-rated)':''}</small><b>${fmt(you(it))}</b>${it.rerate!=null&&it.rerate!=it.his?`<small>first ${fmt(it.his)}</small>`:''}</div>
    <div class="n"><small>Today</small><b>${fmt(it.old)}</b></div><div class="n"><small>New</small><b>${fmt(it.new)}</b></div></div>
    <div class="delta ${cls}">${arrow}${far(it)?' <span class="far">· more than 1 from you</span>':''}</div>
    <div class="look">Graded as ${it.look}</div><div class="why">${it.why}</div><div class="pieces">${it.pieces}</div></div></article>`}).join('');
}
fetch('data.json').then(r=>r.json()).then(d=>{D=d;const s=d.summary;
  document.getElementById('sum').innerHTML=`<span>${d.items.length} outfits · your average <b>${s.his_mean}</b></span>
  <span>Today: within a point of you <b>${s.old.within1}/${s.old.n}</b>, r <b>${s.old.r}</b></span>
  <span>New: within a point <b>${s.new.within1}/${s.new.n}</b>, r <b>${s.new.r}</b></span>
  <span>(the new rules were tuned on these photos; on unseen photos: 82% within a point, r 0.63)</span>`;
  document.getElementById('how').textContent=s.held_out+"\nYour score is your re-rate where you re-rated, else your first blind rating. Scores: first reading, Everyday, one test profile; a photo in shorts is read as a warm day, every other as cool.";
  render()});
document.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{filter=b.dataset.f;document.querySelectorAll('[data-f]').forEach(x=>x.setAttribute('aria-pressed',x==b));render()});
document.getElementById('sort').onchange=e=>{sort=e.target.value;render()};
</script></body></html>
'''

if __name__ == "__main__":
    sys.exit(main())

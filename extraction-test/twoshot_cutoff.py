#!/usr/bin/env python3
"""Two-shot check T1/T2 (handoff/12-two-shot-check.md, #313): does the camera know his shoes are missing? No API calls.

  vision/bin/kmeasure cutoff <photos...> > results/twoshot1/cutoff.jsonl   (the 225 gold photos, results/gold1/manifest.json)
  /usr/bin/python3 twoshot_cutoff.py                                      -> results/twoshot1/report.txt

Truth: a copy cut off at a set height from his own joints has no shoes (P1b); an uncut photo has shoes when both of the
AI's gold readings say shoes_visible and full_body (P1a), and none when both say not (the real cut-offs). Rules are
picked on the tuning half (even photo number) and reported on the test half (odd). Rule 7: public gold photos, profile
unknown; nothing here depends on a profile.
"""
import json
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "results" / "twoshot1"
man = {r["path"]: r["id"] for r in json.loads((HERE / "results/gold1/manifest.json").read_text())}
raw = json.loads((HERE / "results/gold1/raw.json").read_text())
ai = defaultdict(list)
for r in raw:
    if r.get("json"):
        s = r["json"]["scene"]
        ai[r["photo"]].append(bool(s.get("shoes_visible")) and s.get("framing") == "full_body")
rows = [json.loads(l) for l in (OUT / "cutoff.jsonl").read_text().splitlines() if l.startswith("{")]
for r in rows:
    r["id"] = man.get(r["photo"], r["photo"])
    r["half"] = "tune" if int(r["id"].split("-")[1]) % 2 == 0 else "test"
    r["ankles"] = sum(1 for k in ("lAnkle", "rAnkle") if k in r.get("joints", []))

CUTS = ["chest", "navel", "hip", "midthigh", "knee", "midshin", "aboveAnkle"]
RULES = {
    "R0 today's still pose (an ankle found = full)": lambda r: r["pose"] != "full",
    "R1 fewer than 2 ankles": lambda r: r["ankles"] < 2,
    "R2 no ankle, or the lowest joint in the bottom 4%": lambda r: r["ankles"] == 0 or r["lowest"] >= 0.96,
    "R3 fewer than 2 ankles, or the lowest joint in the bottom 4%": lambda r: r["ankles"] < 2 or r["lowest"] >= 0.96,
}

def pct(a, b):
    return f"{a}/{b} = {100 * a / b:.1f}%" if b else "-"

L = []
p = L.append
full = [r for r in rows if r["cut"] == "full"]
srcs = {r["id"] for r in full if r.get("fullBody")}
p(f"T1/T2, two-shot check: {len(full)} gold photos, {len(srcs)} with a full body found (shoulders, hips, knees, an ankle) and cut")
p("Truth for uncut photos = both AI readings agree (shoes in + full body, or shoes out). Tune = even photo numbers, test = odd.\n")
for half in ("tune", "test"):
    p(f"=== {half} half ===")
    shoes_in = [r for r in full if r["half"] == half and ai.get(r["id"]) and all(ai[r["id"]])]
    shoes_out = [r for r in full if r["half"] == half and ai.get(r["id"]) and not any(ai[r["id"]])]
    cut = [r for r in rows if r["half"] == half and r["cut"] in CUTS]
    for name, f in RULES.items():
        fa = sum(f(r) for r in shoes_in)
        real = sum(f(r) for r in shoes_out)
        caught = sum(f(r) for r in cut)
        p(f"  {name}")
        p(f"    P1a uncut with shoes, asked (bar <= 3%):     {pct(fa, len(shoes_in))}")
        p(f"    P1b cut copies, asked (bar >= 95%):          {pct(caught, len(cut))}")
        p(f"    real cut-offs (AI: shoes out), asked:        {pct(real, len(shoes_out))}")
        by = Counter(r["cut"] for r in cut if not f(r))
        if by:
            p(f"    missed by cut: {dict(by)}")
    p("")

p("=== P1c: can it be sent? and T2: today's live tip, by cut height (both halves) ===")
p(f"  {'cut':<11} {'n':>4}  {'sendable':>9}  {'Step back (no hips)':>20}  {'Step in (no shoulders)':>23}  {'pose full/upper/none'}")
for c in ["full"] + CUTS:
    rs = [r for r in rows if r["cut"] == c and r["id"] in srcs]
    if not rs:
        continue
    n = len(rs)
    ok = sum(r["status"] == "ok" for r in rs)
    tc = sum(r["live"] == "tooClose" for r in rs)
    npn = sum(r["live"] == "noPerson" for r in rs)
    po = Counter(r["pose"] for r in rs)
    p(f"  {c:<11} {n:>4}  {100*ok/n:>8.0f}%  {100*tc/n:>19.0f}%  {100*npn/n:>22.0f}%  {po['full']}/{po['upper']}/{po['none']}")
    bad = Counter(r["status"] for r in rs if r["status"] != "ok")
    if bad:
        p(f"  {'':<11}       not sendable: {dict(bad)}")
(OUT / "report.txt").write_text("\n".join(L) + "\n")
print("\n".join(L))

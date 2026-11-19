#!/usr/bin/env python3
"""Build his blind re-rate sheet (T68 round 3, Nov 16, $0): inputs/gold-judge/founder5/.

What goes on it (results/taste1/flags.json from taste_patterns.py):
  - every photo in a near-identical pair he scored 1.5+ apart, and every score 2+ points from his 6 most similar
    outfits (the flagged ones);
  - 10 unflagged photos he has already rated, 2 from each score band (5-5.5 ... 9-9.5), to measure his own noise.
He isn't told which are which; the order is shuffled (seed 20261116) so no two photos from the same flag sit side by
side. The answers go to founder5/ratings.csv; his earlier ratings (founder/, founder4/) are never written.
The "consistent key" (consistent_key.py, later) = his re-rated score where he re-rated, his original elsewhere.

  KITTED_DATA=<main checkout> /usr/bin/python3 rerate_sheet.py
"""
import csv
import json
import os
import random
import re
import shutil
import sys
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
DATA = Path(os.environ.get("KITTED_DATA", HERE.parent))
J = DATA / "inputs/gold-judge"
F4, F5 = J / "founder4", J / "founder5"
FLAGS = HERE / "results/taste1/flags.json"
SEED = 20261116
BANDS = [(5.0, 5.5), (6.0, 6.5), (7.0, 7.5), (8.0, 8.5), (9.0, 9.5)]


def image_of():
    """Every rated photo's face-hidden copy: the C-id's sheet photo, or his first 20's sheet photo (F-id)."""
    g2p = {m["gid"]: m["photo"] for m in json.load(open(J / "manifest.json"))}
    out = {}
    for r in csv.DictReader(open(F4 / ".mapping/mapping.csv")):
        p = F4 / "photos" / f"{r['id']}.jpg"
        out[r["id"]] = p
        if r["gold_id"] in g2p:
            out[g2p[r["gold_id"]]] = p
    for m in json.load(open(J / "founder/manifest.json")):
        out.setdefault(m["photo"], J / "founder/photos" / f"{m['fid']}.jpg")
    return out


def main():
    fl = json.loads(FLAGS.read_text())
    his = fl["his"]
    img = image_of()
    cluster = {}
    for a, b in fl["pairs"]:                                   # join pairs that share a photo into one cluster
        ca, cb = cluster.get(a, {a}), cluster.get(b, {b})
        u = ca | cb
        for k in u:
            cluster[k] = u
    for k, *_ in fl["off"]:
        cluster.setdefault(k, {k})
    flagged = sorted(cluster)
    rng = random.Random(SEED)
    repeats = []
    for lo, hi in BANDS:
        pool = sorted(k for k, v in his.items() if lo <= v <= hi and k not in cluster and k in img)
        repeats += rng.sample(pool, 2)
    items = [(k, "flagged: " + ("near-identical, scored apart" if any(k in p for p in fl["pairs"]) else "far from his own pattern"))
             for k in flagged] + [(k, "repeat (noise check)") for k in repeats]
    missing = [k for k, _ in items if k not in img or not img[k].exists()]
    if missing:
        print("no photo for", missing)
        return 1
    for _ in range(1000):                                     # no two of one cluster next to each other
        rng.shuffle(items)
        if all(not (items[i][0] in cluster and items[i + 1][0] in cluster.get(items[i][0], set()))
               for i in range(len(items) - 1)):
            break
    n = len(items)
    (F5 / "photos").mkdir(parents=True, exist_ok=True)
    (F5 / ".mapping").mkdir(exist_ok=True)
    with open(F5 / ".mapping/key.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["id", "photo", "his_earlier", "why", "source_image"])
        for i, (k, why) in enumerate(items, 1):
            q = f"Q{i:02d}"
            shutil.copyfile(img[k], F5 / "photos" / f"{q}.jpg")
            w.writerow([q, k, his[k], why, str(img[k].relative_to(J))])
    serve = (F4 / "serve.py").read_text()
    serve = serve.replace(r"ID = re.compile(r'^C\d{3}$')", r"ID = re.compile(r'^Q\d{2}$')").replace(
        r"m = re.match(r'^/photos/(C\d{3})\.jpg$', p)", r"m = re.match(r'^/photos/(Q\d{2})\.jpg$', p)").replace(
        "else 8765", "else 8766").replace("http://localhost:8765", "http://localhost:8766")
    assert "Q\\d{2}" in serve and "8766" in serve and "C\\d{3}" not in serve
    (F5 / "serve.py").write_text(serve)
    page = (F4 / "index.html").read_text()
    page = (page.replace("Rate 150 Fits", f"Rate {n} Fits").replace("Rate 150 fits, blind", f"Rate {n} fits, blind")
            .replace("of 150 rated", f"of {n} rated").replace("founder4/serve.py", "founder5/serve.py")
            .replace("const N=150, KEY='kitted-founder4-ratings-v1', POSKEY='kitted-founder4-pos-v1';",
                     f"const N={n}, KEY='kitted-founder5-ratings-v1', POSKEY='kitted-founder5-pos-v1';")
            .replace("ids.push('C'+String(i).padStart(3,'0'))", "ids.push('Q'+String(i).padStart(2,'0'))")
            .replace("'All 150 rated'", f"'All {n} rated'"))
    assert "founder4" not in page and "150" not in page, [m.start() for m in re.finditer("150|founder4", page)]
    (F5 / "index.html").write_text(page)
    (F5 / "README.md").write_text(f"""# Blind re-rate sheet ({n} outfits, Nov 16)

**To start:** open Terminal and run this one command:

    python3 ~/Desktop/files/Kitted/inputs/gold-judge/founder5/serve.py

then open **http://localhost:8766** in any browser. Leave the Terminal window open while you rate.

**To rate:** same as last time: one photo at a time, tap a score from 3 to 9.5, a one-line note if you like, then Next.
About 10 minutes. Rate each one fresh, the way it strikes you today; some may look familiar, and that's fine.
Each tap saves straight to `ratings.csv` in this folder. Please don't open `.mapping/` until you've finished.

Notes for Claude (not for the rater):
- Built by `extraction-test/rerate_sheet.py` (seed {SEED}) from `extraction-test/results/taste1/flags.json`
  (`taste_patterns.py`). `.mapping/key.csv`: Q-id, the photo's key (gold id or C-id), his earlier score, why it's on
  the sheet (flagged: near-identical pair scored apart / far from his own pattern; or repeat, the noise check), source.
- His earlier ratings (`founder/ratings.csv`, `founder4/ratings.csv`) are never written. The consistent key = his
  re-rated score where he re-rated, his original elsewhere; never smoothed toward any engine.
- Same server as founder4 (`serve.py`, standard library), port 8766, ids Q01-Q{n:02d}; only the page and photos are served.
""")
    print(f"{n} photos: {len(flagged)} flagged, {len(repeats)} repeats -> {F5}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

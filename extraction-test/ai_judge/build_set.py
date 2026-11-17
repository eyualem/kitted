#!/usr/bin/env python3
"""The AI-judge test's photo set (Nov 17, 2026; $0, no API calls). Test only: nothing in the app changes.

  KITTED_DATA=<main checkout> V16_DIR=<a checkout of claude/rescoring-v16-58d34b>/extraction-test \
      /usr/bin/python3 build_set.py

What it writes (all git-ignored, under $KITTED_DATA/inputs/ai-judge/):
  run<r>/b<n>/<id>.jpg   the face-hidden copies, renamed to a random 5-letter id per run and shuffled into batches
                         (a fresh order and fresh neighbours each run: the order-swap test for absolute scores)
  .key/truth.json        per photo: his blind score, his consistent key, v16's score (the approved engine, his rated
                         photos' own second looks and leg look, cool day, shorts warm), v16's dealbreaker caps, v15
  .key/run<r>.json       {random id: photo key}
The judges never open .key/ (the brief says so) and never see his scores, v16's or the rules' point values.

The set: everything he rated that v16 scores (his first 20 + 144 of his 150; the 6 whose heads were already under a
mosaic block are left out, as the app's prep would send nothing), plus the creators' 18 anchors and Frugal's pair.
"""
import csv
import json
import os
import random
import shutil
import sys
from pathlib import Path

sys.dont_write_bytecode = True
DATA = Path(os.environ["KITTED_DATA"])
V16 = Path(os.environ["V16_DIR"]).resolve()
sys.path.insert(0, str(V16))
sys.path.insert(0, str(V16 / "rubrics"))
import v16_paper as V  # noqa: E402
import hoodie_layer_paper as H  # noqa: E402

OUT = DATA / "inputs" / "ai-judge"
J = DATA / "inputs" / "gold-judge"
CR_IMG = DATA / "extraction-test" / "results" / "creators1" / "images"
RUNS, BATCHES, SEED = 3, 5, 20261117


def image_for(key, g2c, f2p):
    if key.startswith("C"):
        return J / "founder4" / "photos" / f"{key}.jpg"
    if key in g2c:                                   # a gold photo he rated on the 150 sheet: the copy he saw
        return J / "founder4" / "photos" / f"{g2c[key]}.jpg"
    if key in f2p:                                   # his first 20
        return J / "founder" / "photos" / f"{f2p[key]}.jpg"
    raise KeyError(key)


def main():
    runs, panel, founder, _ = H.load_gold()
    f4, rows = V.load_founder4()
    pool = V.rated_pool(runs, founder, f4, rows)
    key = json.loads((V16 / "results/taste1/consistent_key.json").read_text())["key"]
    g2p = {m["gid"]: m["photo"] for m in json.load(open(J / "manifest.json"))}
    g2c = {g2p[r["gold_id"]]: r["id"] for r in csv.DictReader(open(J / "founder4/.mapping/mapping.csv"))
           if r["gold_id"] in g2p}
    f2p = {m["photo"]: m["fid"] for m in json.load(open(J / "founder/manifest.json"))}
    truth = {}
    for k, (his, group, rd, lk) in pool.items():
        season = V.season_for(rd)
        r16 = V.sc(rd, "everyday", V.PROFILE, lk, season=season)            # TUNE["v16"]: the approved engine
        if r16["overall"] is None:
            continue
        r15 = V.sc(rd, "everyday", V.PROFILE, engine="v15")
        v = r16.get("v16") or {}
        truth[k] = {"kind": "rated", "group": group, "his": his, "key": key.get(k, his), "v16": r16["overall"],
                    "v15": r15["overall"], "panel": panel.get(k), "season": season or "cool",
                    "caps": [c["id"] for c in v.get("caps", [])], "held_by": v.get("held_by"),
                    "cap": min((c["cap"] for c in v.get("caps", [])), default=None),
                    "pieces": H.desc(rd), "image": str(image_for(k, g2c, f2p))}
    cr = V.load_creators()
    stills = {pid: step for _, pid, step in V.ANCHORS}
    for w, b, _ in V.PAIRS:
        stills.setdefault(w, None)
        stills.setdefault(b, None)
    for pid, step in stills.items():
        m16, _ = V.med(cr[pid])
        truth[pid] = {"kind": "creator", "step": step, "v16": m16, "season": "cool", "pieces": H.desc(cr[pid][0]),
                      "image": str(CR_IMG / (pid.replace("/", "__") + ".full.jpg"))}
    missing = [k for k, t in truth.items() if not Path(t["image"]).exists()]
    if missing:
        print("missing images:", missing)
        return 1
    if OUT.exists() and "--truth-only" not in sys.argv:
        for d in OUT.glob("run*"):
            shutil.rmtree(d)
    (OUT / ".key").mkdir(parents=True, exist_ok=True)
    (OUT / ".key" / "truth.json").write_text(json.dumps(truth, indent=1))
    if "--truth-only" in sys.argv:                   # refresh the key without touching the judges' folders
        print(f"{len(truth)} photos: truth.json rewritten")
        return 0
    rng = random.Random(SEED)
    letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"
    used = set()
    for r in range(1, RUNS + 1):
        ks = sorted(truth)
        rng.shuffle(ks)
        ids = {}
        for i, k in enumerate(ks):
            while True:
                pid = "".join(rng.choice(letters) for _ in range(5))
                if pid not in used:
                    used.add(pid)
                    break
            b = i % BATCHES + 1
            d = OUT / f"run{r}" / f"b{b}"
            d.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(truth[k]["image"], d / f"{pid}.jpg")
            ids[pid] = {"photo": k, "batch": b, "season": truth[k]["season"]}
        (OUT / ".key" / f"run{r}.json").write_text(json.dumps(ids, indent=1))
        # what each batch's judge is told per photo (no photo key): id + the day's weather
        for b in range(1, BATCHES + 1):
            rows_b = sorted((p, v["season"]) for p, v in ids.items() if v["batch"] == b)
            with open(OUT / f"run{r}" / f"b{b}" / "photos.csv", "w") as f:
                f.write("id,day\n" + "".join(f"{p},{'warm' if s == 'warm' else 'mild or cool'}\n" for p, s in rows_b))
    n_r = sum(t["kind"] == "rated" for t in truth.values())
    print(f"{len(truth)} photos ({n_r} he rated, {len(truth) - n_r} creator stills); {RUNS} runs x {BATCHES} batches "
          f"-> {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

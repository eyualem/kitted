#!/usr/bin/env python3
"""Variant P of BRIEF.md, the pair test (Nov 17, 2026; $0). Run after build_set.py.

  KITTED_DATA=<main checkout> /usr/bin/python3 build_pairs.py

30 pairs: the creators' 6 before/after pairs, plus 24 pairs of photos he rated at least 1 point apart (drawn at
random, each photo once). Every pair is shown twice, in two judges' folders, with A and B swapped and fresh random
file names: order1/ and order2/ (git-ignored, under inputs/ai-judge/pairs/). The key is .key/pairs.json.
ZOZO 2024 found GPT-4o flipped 57-74% of verdicts when the image order was swapped; this measures ours.
"""
import json
import os
import random
import shutil
import sys
from pathlib import Path

DATA = Path(os.environ["KITTED_DATA"])
OUT = DATA / "inputs" / "ai-judge"
CREATOR_PAIRS = [("wIib9hzVUuw/o1-before-04-10", "wIib9hzVUuw/o1-after-04-52"),
                 ("wIib9hzVUuw/o2-before-05-30", "wIib9hzVUuw/o2-after-06-14"),
                 ("wIib9hzVUuw/o3-before-07-26", "wIib9hzVUuw/o3-after-09-07"),
                 ("wIib9hzVUuw/o4-before-09-30", "wIib9hzVUuw/o4-after-10-02"),
                 ("wIib9hzVUuw/o5-before-10-18", "wIib9hzVUuw/o5-after-11-22"),
                 ("k6Gig6r7BSQ/before-longer-tee-10-47", "k6Gig6r7BSQ/after-shorter-tee-10-47")]


def main():
    truth = json.loads((OUT / ".key" / "truth.json").read_text())
    rng = random.Random(20261118)
    rated = sorted(k for k, v in truth.items() if v["kind"] == "rated")
    rng.shuffle(rated)
    pairs, used = [("creator", w, b) for w, b in CREATOR_PAIRS], set()
    for i, a in enumerate(rated):
        if len(pairs) >= 30:
            break
        if a in used:
            continue
        for b in rated[i + 1:]:
            if b not in used and abs(truth[a]["his"] - truth[b]["his"]) >= 1.0 \
                    and truth[a]["season"] == truth[b]["season"]:
                worse, better = sorted((a, b), key=lambda k: truth[k]["his"])
                pairs.append(("rated", worse, better))
                used |= {a, b}
                break
    rng.shuffle(pairs)
    letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"
    key = []
    for order in (1, 2):
        d = OUT / "pairs" / f"order{order}"
        if d.exists():
            shutil.rmtree(d)
        d.mkdir(parents=True)
    rows = {1: [], 2: []}
    for n, (kind, worse, better) in enumerate(pairs, 1):
        first_better = n % 2 == 0                   # order 1: the better photo is A on even pairs; order 2 swaps
        for order in (1, 2):
            a, b = (better, worse) if (first_better == (order == 1)) else (worse, better)
            ids = []
            for k in (a, b):
                pid = "".join(rng.choice(letters) for _ in range(5))
                shutil.copyfile(truth[k]["image"], OUT / "pairs" / f"order{order}" / f"{pid}.jpg")
                ids.append(pid)
            pair_id = f"P{order}{n:02d}"
            day = "warm" if truth[worse]["season"] == "warm" else "mild or cool"
            rows[order].append((pair_id, ids[0], ids[1], day))
            key.append({"pair": pair_id, "n": n, "order": order, "kind": kind, "A": a, "B": b, "better": better})
    for order in (1, 2):
        rs = sorted(rows[order], key=lambda r: rng.random())
        (OUT / "pairs" / f"order{order}" / "pairs.csv").write_text(
            "pair,A,B,day\n" + "".join(",".join(r) + "\n" for r in rs))
    (OUT / ".key" / "pairs.json").write_text(json.dumps(key, indent=1))
    print(f"{len(pairs)} pairs ({sum(p[0] == 'creator' for p in pairs)} creator), 2 orders -> {OUT / 'pairs'}")


if __name__ == "__main__":
    sys.exit(main())

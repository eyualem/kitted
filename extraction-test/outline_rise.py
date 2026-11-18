#!/usr/bin/env python3
"""Does rise explain his scores where the waistband shows? (Nov 17, 2026; $0, eye labels, no AI call)

  KITTED_DATA=<main checkout> RISE_LABELS=<labels.csv> /usr/bin/python3 outline_rise.py   -> results/outline1/rise.txt

The 65 rated photos whose waistband can show (a tucked top in the reading, or look U's hem "tucked"/"cropped") were
labelled by eye for the trousers' rise (high / mid / low / unsure: the cut of the pants, never the body) by a separate
agent that never saw his scores or the app's. The key (rid -> photo) is inputs/rise-labels/.key.csv (git-ignored);
the labels are git-ignored too. This compares, by rise: his mean, v16's and the outline proposal's, and what a rise
rule could add at most (the in-sample residual), so the paid read is only worth asking for if the room is real.
"""
import csv
import json
import os
import statistics as st
import sys
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rubrics"))
import parts_proto as P  # noqa: E402
import outline_audit as A  # noqa: E402

DATA = Path(os.environ["KITTED_DATA"])
KEYF = DATA / "inputs" / "rise-labels" / ".key.csv"
OUT = HERE / "results" / "outline1"


def main():
    labels = {r["rid"]: r for r in csv.DictReader(open(os.environ["RISE_LABELS"]))}
    key = {r["rid"]: r["photo"] for r in csv.DictReader(open(KEYF))}
    pool, ks = A.load_pool()
    approved = dict(P.TUNE["v16"]["taste"])
    prop = json.loads((OUT / "fitted_approved_outline_creators_edges.json").read_text())["taste"]
    v16 = {k: A.score(pool, k)["overall"] for k in ks}
    P.TUNE["v16"]["taste"] = prop
    new = {k: A.score(pool, k)["overall"] for k in ks}
    P.TUNE["v16"]["taste"] = approved
    rows = []
    for rid, lab in labels.items():
        k = key[rid]
        tucked = any(g.get("tucked") in ("full", "half") for g in pool[k][2]["garments"] if g.get("category") == "top")
        rows.append((lab["rise"], lab["confidence"], lab["waistband_visible"], pool[k][0], v16[k], new[k], tucked))
    lines = []

    def say(s=""):
        print(s)
        lines.append(s)
    say(f"Rise by eye on the {len(rows)} rated photos where the waistband can show (labels blind to every score)")
    say(f"  {'rise':8s} {'n':>3s} {'his mean':>9s} {'v16':>6s} {'outline':>8s} {'his - outline':>14s} {'sure':>5s} {'tucked':>7s}")
    for r in ("high", "mid", "low", "unsure"):
        g = [x for x in rows if x[0] == r]
        if not g:
            continue
        say(f"  {r:8s} {len(g):3d} {st.mean(x[3] for x in g):9.2f} {st.mean(x[4] for x in g):6.2f} {st.mean(x[5] for x in g):8.2f} "
            f"{st.mean(x[3] - x[5] for x in g):+14.2f} {sum(x[1] == 'sure' for x in g):5d} {sum(x[6] for x in g):7d}")
    vis = [x for x in rows if x[0] in ("high", "mid", "low")]
    say()
    hi = [x for x in vis if x[0] == "high"]
    md = [x for x in vis if x[0] == "mid"]
    if hi and md:
        gap = st.mean(x[3] - x[5] for x in hi) - st.mean(x[3] - x[5] for x in md)
        say(f"  High against mid, after the outline: he scores high rise {gap:+.2f} more than the engine does, relative to mid.")
        say(f"  A rise rule's best case in sample: a {abs(gap):.2f} lift on the {len(hi)} high-rise photos "
            f"({100 * len(hi) / len(ks):.0f}% of his 164). Within 1 today on them: "
            f"{sum(abs(x[3] - x[5]) <= 1 for x in hi)}/{len(hi)}; with that lift: "
            f"{sum(abs(x[3] - (x[5] + gap)) <= 1 for x in hi)}/{len(hi)}.")
    sure = [x for x in vis if x[1] == "sure"]
    say(f"  Labels marked sure among the readable ones: {len(sure)}/{len(vis)} (the rest likely or guess).")
    (OUT / "rise.txt").write_text("\n".join(lines) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())

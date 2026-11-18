#!/usr/bin/env python3
"""Is look U right about where the outer layer ends? (Nov 17, 2026; $0, eye labels, no AI call)

  KITTED_DATA=<main checkout> HEM_LABELS=<hem_labels.csv> HEM_KEY=<hem_key.csv> /usr/bin/python3 outline_hem_check.py
     -> results/outline1/hem_check.txt

The 69 rated photos with an outer layer were labelled by eye (the same 8 classes as look U's outer_hem_at) by a
separate agent that saw no score and no AI answer. Steadiness (outline_reads.py) says the look repeats itself; this
says how often it agrees with an eye, on the three bands the outline rules use (short / mid / long).
"""
import csv
import os
import sys
from collections import Counter
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rubrics"))
import parts_proto as P  # noqa: E402
import outline_audit as A  # noqa: E402


def band(x):
    return "short" if x in P.OL_SHORT else "mid" if x in P.OL_MID else "long" if x in P.OL_LONG else None


def main():
    lab = {r["hid"]: r for r in csv.DictReader(open(os.environ["HEM_LABELS"]))}
    key = {r["hid"]: r["photo"] for r in csv.DictReader(open(os.environ["HEM_KEY"]))}
    pool, ks = A.load_pool()
    rows = []
    for h, r in lab.items():
        lk = pool[key[h]][3] or {}
        rows.append((band(r["outer_end"]), band(lk.get("outer_hem_at")), r["confidence"], r["outer_end"], lk.get("outer_hem_at")))
    lines = []

    def say(s=""):
        print(s)
        lines.append(s)
    both = [x for x in rows if x[0] and x[1]]
    agree = sum(x[0] == x[1] for x in both)
    say(f"Look U's outer hem against an eye label, {len(rows)} layered photos; both readable on {len(both)}")
    say(f"  three bands (short/mid/long) agree: {agree}/{len(both)} ({100 * agree / max(1, len(both)):.0f}%)")
    for b in ("short", "mid", "long"):
        said = [x for x in both if x[1] == b]
        eye = [x for x in both if x[0] == b]
        say(f"  look says {b:5s}: {len(said):2d}, eye agrees on {sum(x[0] == b for x in said):2d}   "
            f"eye says {b:5s}: {len(eye):2d}, look finds {sum(x[1] == b for x in eye):2d}")
    sure = [x for x in both if x[2] == "sure"]
    say(f"  on the eye's 'sure' labels: {sum(x[0] == x[1] for x in sure)}/{len(sure)}")
    say("  disagreements (eye -> look): " + ", ".join(f"{a}->{b}" for a, b in
                                                    Counter((x[3], x[4]) for x in both if x[0] != x[1]).most_common()))
    (HERE / "results" / "outline1" / "hem_check.txt").write_text("\n".join(lines) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""His consistent answer key (T68 round 3, Nov 16, $0), from his blind re-rate sheet (inputs/gold-judge/founder5/).

The founder (Nov 16): "When I say "fix my scores," by the way, the low ones should still stay low, and the high ones
should still stay high. I just want consistency." So:
  - the key = his own re-rated score where he re-rated, his original elsewhere. Nothing is averaged, smoothed, pulled
    toward the middle or toward any engine; a flag only puts a photo on the sheet, his new rating decides.
  - the check: the key's band shares sit beside his raw ones, and every band must stay within 3 points (BAND_TOL) of
    raw; if one moves more, the key is reported as shrinking his range and isn't used until he looks at it.
  - his noise: the 10 repeats (unflagged photos) say how far his own ratings drift on a second look; the flagged ones'
    moves are read against that, so a move inside his noise isn't called a fix.
His original ratings files are only read. Output: results/taste1/consistent_key.json and key_report.txt.

  KITTED_DATA=<main checkout> /usr/bin/python3 consistent_key.py
"""
import csv
import json
import os
import statistics as st
import sys
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
DATA = Path(os.environ.get("KITTED_DATA", HERE.parent))
F5 = DATA / "inputs/gold-judge/founder5"
OUT = HERE / "results" / "taste1"
BANDS = [("3-4.5", 3.0, 4.5), ("5-5.5", 5.0, 5.5), ("6-6.5", 6.0, 6.5), ("7-7.5", 7.0, 7.5), ("8-8.5", 8.0, 8.5),
         ("9-9.5", 9.0, 9.5)]
BAND_TOL = 0.03


def shares(xs):
    return {n: sum(lo <= x <= hi for x in xs) / len(xs) for n, lo, hi in BANDS}


def main():
    flags = json.loads((OUT / "flags.json").read_text())
    raw = {k: float(v) for k, v in flags["his"].items()}
    rf = F5 / "ratings.csv"
    if not rf.exists():
        print(f"No re-rate yet ({rf}); the key equals his raw ratings. Nothing written.")
        return 0
    key = {r["id"]: r for r in csv.DictReader(open(F5 / ".mapping/key.csv"))}
    new = {}
    for r in csv.DictReader(open(rf)):
        if r["score"] and r["id"] in key:
            new[key[r["id"]]["photo"]] = (float(r["score"]), key[r["id"]]["why"], r["note"])
    cons = dict(raw)
    for k, (s, _, _) in new.items():
        if k in cons:
            cons[k] = s
    lines = []

    def say(s=""):
        print(s)
        lines.append(s)
    say(f"Consistent key: {len(new)} of {len(key)} re-rated; {len(cons)} photos in all (his raw elsewhere)")
    rep = [(raw[k], s) for k, (s, why, _) in new.items() if why.startswith("repeat") and k in raw]
    flg = [(k, raw[k], s) for k, (s, why, _) in new.items() if why.startswith("flagged") and k in raw]
    if rep:
        noise = st.mean(abs(a - b) for a, b in rep)
        say(f"His own noise (the {len(rep)} repeats): average move {noise:.2f}, within 0.5 {sum(abs(a - b) <= 0.5 for a, b in rep)}/{len(rep)}, "
            f"within 1 {sum(abs(a - b) <= 1 for a, b in rep)}/{len(rep)}")
        hi = [(a, b) for a, b in rep if a >= 8]
        lo = [(a, b) for a, b in rep if a <= 6]
        if hi and lo:
            say(f"  toward the middle on a second look? his high repeats {st.mean(a for a, _ in hi):.2f} -> {st.mean(b for _, b in hi):.2f}, "
                f"his low ones {st.mean(a for a, _ in lo):.2f} -> {st.mean(b for _, b in lo):.2f}")
    if flg:
        say(f"The flagged ({len(flg)}): average move {st.mean(abs(a - b) for _, a, b in flg):.2f}")
        for k, a, b in flg:
            say(f"  {k}: {a:g} -> {b:g}   {new[k][2]}")
    sr, sc = shares(list(raw.values())), shares(list(cons.values()))
    say("Band shares, his raw vs the consistent key:")
    worst = 0
    for n, _, _ in BANDS:
        d = sc[n] - sr[n]
        worst = max(worst, abs(d))
        say(f"  {n:6s} raw {100 * sr[n]:5.1f}%   key {100 * sc[n]:5.1f}%   ({100 * d:+.1f})")
    ok = worst <= BAND_TOL
    say(f"Range kept (every band within {100 * BAND_TOL:.0f} points of raw): {'YES' if ok else 'NO: the key shrinks or shifts his range; not used until he sees it'}")
    say(f"  raw: mean {st.mean(raw.values()):.2f}, sd {st.pstdev(raw.values()):.2f}, range {min(raw.values()):g}-{max(raw.values()):g};  "
        f"key: mean {st.mean(cons.values()):.2f}, sd {st.pstdev(cons.values()):.2f}, range {min(cons.values()):g}-{max(cons.values()):g}")
    (OUT / "key_report.txt").write_text("\n".join(lines) + "\n")
    (OUT / "consistent_key.json").write_text(json.dumps({"key": cons, "rerated": {k: v[0] for k, v in new.items()},
                                                         "range_kept": ok}, indent=1))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""How steady the reads the outline rules would use are (Nov 17, $0): each gold photo's two runs of look U (the
upper close-up) and the two stored readings, compared field by field. Writes results/outline1/reads.txt.

  KITTED_DATA=<main checkout> /usr/bin/python3 outline_reads.py
"""
import sys
from collections import Counter
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rubrics"))
import v16_paper as V  # noqa: E402
import hoodie_layer_paper as H  # noqa: E402

SHORT, MID, LONG = {"cropped", "waistband"}, {"hip", "crotch"}, {"thigh", "knee"}


def band(x):
    return "short" if x in SHORT else "mid" if x in MID else "long" if x in LONG else x


def same(pairs):
    pairs = [p for p in pairs if p[0] is not None and p[1] is not None]
    return sum(a == b for a, b in pairs), len(pairs)


def main():
    runs, _, _, _ = H.load_gold()
    looks = V.load_looks()
    lines = []

    def say(s=""):
        print(s)
        lines.append(s)
    two = [p for p in looks if len(looks[p]) >= 2 and len(runs.get(p, [])) >= 2]
    lay = [p for p in two if any(g.get("category") == "outerwear" for r in runs[p][:2] for g in r["garments"])]
    say(f"Gold photos with two runs of look U and two stored readings: {len(two)}; with an outer layer in either reading: {len(lay)}")
    U = {p: looks[p][:2] for p in two}
    rows = [
        ("look U outer_hem_at, 8 classes (layered photos)", [(U[p][0].get("outer_hem_at"), U[p][1].get("outer_hem_at")) for p in lay]),
        ("look U outer_hem_at, 3 bands short/mid/long (layered)", [(band(U[p][0].get("outer_hem_at")), band(U[p][1].get("outer_hem_at"))) for p in lay]),
        ("look U outer short (cropped/waistband) yes/no (layered)", [(U[p][0].get("outer_hem_at") in SHORT, U[p][1].get("outer_hem_at") in SHORT) for p in lay]),
        ("look U outer long (thigh/knee) yes/no (layered)", [(U[p][0].get("outer_hem_at") in LONG, U[p][1].get("outer_hem_at") in LONG) for p in lay]),
        ("look U outer mid (hip/crotch) yes/no (layered)", [(U[p][0].get("outer_hem_at") in MID, U[p][1].get("outer_hem_at") in MID) for p in lay]),
        ("look U outer_kind (layered)", [(U[p][0].get("outer_kind"), U[p][1].get("outer_kind")) for p in lay]),
        ("look U under_shows (layered)", [(U[p][0].get("under_shows"), U[p][1].get("under_shows")) for p in lay]),
        ("look U under_present (layered)", [(U[p][0].get("under_present"), U[p][1].get("under_present")) for p in lay]),
        ("look U outer_hem_at, 3 bands (every photo: the top's own end)", [(band(U[p][0].get("outer_hem_at")), band(U[p][1].get("outer_hem_at"))) for p in two]),
    ]

    def outer(r):
        return next((g for g in r["garments"] if g.get("category") == "outerwear"), None)

    def top(r):
        return next((g for g in r["garments"] if g.get("category") == "top"), None)
    both = [p for p in lay if outer(runs[p][0]) and outer(runs[p][1])]
    rows += [
        ("reading: an outer layer present in both (layered)", [(outer(runs[p][0]) is not None, outer(runs[p][1]) is not None) for p in lay]),
        ("reading: outer subcategory (both have one)", [(outer(runs[p][0])["subcategory"], outer(runs[p][1])["subcategory"]) for p in both]),
        ("reading: outer length (both have one)", [(outer(runs[p][0])["length"], outer(runs[p][1])["length"]) for p in both]),
        ("reading: outer color_family (both)", [(outer(runs[p][0])["color_family"], outer(runs[p][1])["color_family"]) for p in both]),
        ("reading: inner top color_family (both, layered)", [((top(runs[p][0]) or {}).get("color_family"), (top(runs[p][1]) or {}).get("color_family")) for p in both]),
        ("reading: outer volume (both)", [(outer(runs[p][0])["volume"], outer(runs[p][1])["volume"]) for p in both]),
    ]
    for name, pr in rows:
        s, n = same(pr)
        say(f"  {name:62s} {s:3d}/{n:3d} the same ({100 * s / max(n, 1):3.0f}%)")
    say()
    say("  look U outer_hem_at, run 1 against run 2 (layered photos):")
    c = Counter((U[p][0].get("outer_hem_at"), U[p][1].get("outer_hem_at")) for p in lay)
    for (a, b), n in sorted(c.items(), key=lambda x: -x[1]):
        say(f"    {a:12s} {b:12s} {n}")
    (HERE / "results" / "outline1").mkdir(parents=True, exist_ok=True)
    (HERE / "results" / "outline1" / "reads.txt").write_text("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()

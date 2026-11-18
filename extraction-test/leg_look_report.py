#!/usr/bin/env python3
"""What the leg-width look did (T68 round 5; $0: reads results/leg-look1/raw.json, makes no calls).

Stage 1 passes when (a) the look's two runs give the same leg class on at least 90% of the photos, and (b) on the gold
photos it covers, swapping the look in for the scoring call's leg_shape (each reading with its own run) makes the
score flips from the leg read go away without new ones. Also: how its class lines up with the stored leg_shape.

  KITTED_DATA=<main checkout> /usr/bin/python3 leg_look_report.py
"""
import json
import sys
from collections import Counter
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE / "rubrics"))
import v16_paper as V  # noqa: E402
import hoodie_layer_paper as H  # noqa: E402

RAW = HERE / "results/leg-look1/raw.json"


def cls(j):
    k, o = j.get("knee"), j.get("opening")
    if k in (None, "not_visible") and o in (None, "not_visible"):
        return None
    if "hangs_away" in (k, o) or "wider" in (k, o):
        return "wide"
    if k in ("clings", None, "not_visible") and o in ("narrower", None, "not_visible"):
        return "narrow"
    return "straight"


def main():
    if not RAW.exists():
        print("No leg-look answers yet (results/leg-look1/raw.json).")
        return 1
    rows = [r for r in json.loads(RAW.read_text()) if r.get("json")]
    cost = sum(100 * ((r.get("usage") or {}).get("promptTokenCount", 0) * 0.75e-6 + ((r.get("usage") or {}).get(
        "candidatesTokenCount", 0) + (r.get("usage") or {}).get("thoughtsTokenCount", 0)) * 3.75e-6)
        for r in json.loads(RAW.read_text()))
    by = {}
    for r in rows:
        by.setdefault((r["set"], r["photo"]), {})[r["run"]] = r["json"]
    two = {k: v for k, v in by.items() if 0 in v and 1 in v}
    same = sum(cls(v[0]) == cls(v[1]) for v in two.values())
    raw_same = sum(v[0] == v[1] for v in two.values())
    print(f"answers {len(rows)}, spent {cost:.2f} cents (thinking counted)")
    print(f"(a) the look's two runs agree on the leg class: {same}/{len(two)} ({100 * same / max(1, len(two)):.0f}%; "
          f"bar 90%); on both answers exactly: {raw_same}/{len(two)}")
    runs, _, _, _ = H.load_gold()
    looks = V.load_looks()
    lineup = Counter()
    before = after = 0
    n = 0
    for (st_, p), v in sorted(two.items()):
        if st_ != "gold" or p not in runs or len(runs[p]) < 2:
            continue
        b = [next((g for g in runs[p][i]["garments"] if g["category"] == "bottom"), {}).get("leg_shape") for i in (0, 1)]
        lineup.update((b[i], cls(v[i])) for i in (0, 1))
        sl = [dict((looks.get(p) or [{}, {}])[i] if len(looks.get(p) or []) > i else {}) for i in (0, 1)]
        s0 = [V.sc(runs[p][i], "everyday", V.PROFILE, sl[i] or None)["overall"] for i in (0, 1)]
        s1 = [V.sc(runs[p][i], "everyday", V.PROFILE, {**sl[i], **v[i]})["overall"] for i in (0, 1)]
        if None in s0 or None in s1:
            continue
        n += 1
        before += abs(s0[0] - s0[1]) > 0.5
        after += abs(s1[0] - s1[1]) > 0.5
        if (abs(s0[0] - s0[1]) > 0.5) != (abs(s1[0] - s1[1]) > 0.5):
            print(f"   {p}: {s0[0]:g}/{s0[1]:g} -> {s1[0]:g}/{s1[1]:g}   leg read {b[0]}/{b[1]}, look {cls(v[0])}/{cls(v[1])}")
    print(f"(b) gold photos covered: {n}; scores more than half a point apart between the two readings: "
          f"{before} with the stored leg read -> {after} with the look")
    print("    stored leg_shape -> the look's class: " + ", ".join(f"{a}->{b} {c}" for (a, b), c in lineup.most_common()))
    return 0


if __name__ == "__main__":
    sys.exit(main())

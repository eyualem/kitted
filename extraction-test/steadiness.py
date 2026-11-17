#!/usr/bin/env python3
"""Why scores flip between the gold set's two stored readings of the same photo (T68 round 5, Nov 17, $0).

B6 asks that at least 218 of 223 gold photos land within half a point across their two readings. This lists every
photo that doesn't, with what differed between the readings (the leg read, the shoe, top length, the look, which
lifts or taste rules fired) so each rule can be made robust to the read that flips.

  KITTED_DATA=<main checkout> /usr/bin/python3 steadiness.py ['{"taste override": ...}']
"""
import json
import sys
from collections import Counter
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rubrics"))
import v16_paper as V  # noqa: E402
import hoodie_layer_paper as H  # noqa: E402
import parts_proto as P  # noqa: E402


def facts(rd):
    g = rd.get("garments", [])
    B = next((x for x in g if x["category"] == "bottom"), {})
    S = next((x for x in g if x["category"] == "footwear"), {})
    return {"leg": B.get("leg_shape"), "bottom": B.get("subcategory"), "vol": B.get("volume"), "shoe": S.get("subcategory"),
            "tops": tuple(sorted((x.get("subcategory"), x.get("length")) for x in g if x["category"] in ("top", "outerwear"))),
            "colors": tuple(sorted(x.get("color_family") for x in g if x["category"] in ("top", "outerwear", "bottom")))}


def steadiness(over=None, verbose=False):
    if over:
        P.TUNE["v16"]["taste"] = dict(P.TUNE["v16"]["taste"], **over)
    runs, _, _, _ = H.load_gold()
    flips, why = [], Counter()
    total = 0
    for p, rs in sorted(runs.items()):
        if len(rs) < 2:
            continue
        a = [V.sc(r, "everyday", V.PROFILE) for r in rs[:2]]
        if any(x["overall"] is None for x in a):
            continue
        total += 1
        if abs(a[0]["overall"] - a[1]["overall"]) <= 0.5:
            continue
        f = [facts(r) for r in rs[:2]]
        causes = [k for k in ("leg", "bottom", "shoe", "tops", "colors") if f[0][k] != f[1][k]]
        lf = [sorted((x["id"], x["size"]) for x in z["v16"]["lifts"]) for z in a]
        tf = [sorted((x["id"], x["points"]) for x in z["v16"]["taste"]) for z in a]
        if [x[0] for x in lf[0]] != [x[0] for x in lf[1]]:
            causes.append("lifts")
        if a[0]["v16"]["graded_look"] != a[1]["v16"]["graded_look"]:
            causes.append("look")
        if a[0]["v16"]["held_by"] != a[1]["v16"]["held_by"]:
            causes.append("cap or ceiling")
        why.update(causes)
        flips.append((p, [z["overall"] for z in a], causes, f, lf, tf))
    if verbose:
        for p, sc, causes, f, lf, tf in flips:
            print(f"{p}: {sc[0]:g} / {sc[1]:g}  differs: {', '.join(causes) or 'nothing read differs'}")
            for i in (0, 1):
                print(f"    reading {i + 1}: leg {f[i]['leg']}, {f[i]['bottom']}, shoe {f[i]['shoe']}; lifts {lf[i]}; taste {tf[i]}")
        print(f"steady {total - len(flips)}/{total}; what differs on the flips: {dict(why.most_common())}")
    return total - len(flips), total, flips


if __name__ == "__main__":
    steadiness(json.loads(sys.argv[1]) if len(sys.argv) > 1 else None, verbose=True)

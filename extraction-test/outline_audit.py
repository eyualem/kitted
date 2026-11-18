#!/usr/bin/env python3
"""The balance audit (Nov 17, 2026; $0, stored readings only): how much each part of the outfit moves v16's final score,
how often, and where the score disagrees with the founder most, part by part.

  KITTED_DATA=<main checkout> /usr/bin/python3 outline_audit.py      -> results/outline1/audit.txt, audit.json

Method: for every one of his 164 blind-rated photos, v16 (TUNE["v16"], the approved engine) is scored once in full and
once with each family's own contribution left out (parts_proto's `audit_off`: that part's charges and credits, its
lifts, its dealbreaker caps, its taste items; the rest unchanged). The difference is what that family moved, after
the curve and the ceilings, so it is the change he would see. Families:
  shape      silhouette and proportions: the Proportions part, the shape lifts (waist break, short layer, SIL), leg
             width, the hem, roomy shorts, the long top, the shape dealbreakers (hoodie over skinny legs, pooling ...)
  fit        the Fit part, a top that pulls, sleeves over the hands
  color      the Color part, one accent, a color picked up, light tonal summer, three brights, a clash
  shoes      the Shoes part, dress shoes with gym shorts, chunky shoes under trousers
  style      the Style part (cohesion), the open layer over a tee, one look top to toe, one smart piece, the clashes
  condition  stains, wrinkles, wear
  season     shorts photos scored as a warm day (vs cool) and the heavy layer on a warm day
  look       the look table (each taste rule scaled by the outfit's look) against every look at full size
"""
import json
import statistics as st
import sys
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rubrics"))
import parts_proto as P  # noqa: E402
import v16_paper as V  # noqa: E402
import hoodie_layer_paper as H  # noqa: E402

OUT = HERE / "results" / "outline1"
FAMS = ["shape", "fit", "color", "shoes", "style", "condition", "season", "look"]
NAMES = {"shape": "Silhouette and proportions", "fit": "Fit", "color": "Color", "shoes": "Shoes",
         "style": "Style and cohesion", "condition": "Condition", "season": "Season (warm day)",
         "look": "Look taste (the look table)"}


def load_pool():
    runs, panel, founder, _ = H.load_gold()
    f4, rows = V.load_founder4()
    pool = V.rated_pool(runs, founder, f4, rows)
    ks = sorted(k for k in pool if V.sc(pool[k][2], "everyday", V.PROFILE)["overall"] is not None)
    return pool, ks


def score(pool, k, tune=None, season="auto", flat_look=False):
    _, _, rd, lk = pool[k]
    s = V.season_for(rd) if season == "auto" else season
    saved = P.TASTE_BY_LOOK
    if flat_look:
        P.TASTE_BY_LOOK = {}
    try:
        r = V.sc(rd, "everyday", V.PROFILE, lk, season=s, tune=tune)
    finally:
        P.TASTE_BY_LOOK = saved
    return r


def tune_with(extra):
    t = dict(P.TUNE["v16"])
    t.update(extra)
    return t


def main():
    pool, ks = load_pool()
    his = {k: pool[k][0] for k in ks}
    full = {k: score(pool, k) for k in ks}
    fin = {k: full[k]["raw_score"] for k in ks}            # the final before rounding to the half point
    shown = {k: full[k]["overall"] for k in ks}
    without = {}
    for f in FAMS:
        if f == "season":
            without[f] = {k: score(pool, k, season=None)["raw_score"] for k in ks}
        elif f == "look":
            without[f] = {k: score(pool, k, flat_look=True)["raw_score"] for k in ks}
        else:
            without[f] = {k: score(pool, k, tune=tune_with({"audit_off": [f]}))["raw_score"] for k in ks}
    rshown = {f: {k: P.round_half(without[f][k]) for k in ks} for f in FAMS}
    lines = []

    def say(s=""):
        print(s)
        lines.append(s)

    hv = [his[k] for k in ks]
    xs = [shown[k] for k in ks]
    w1 = sum(abs(a - b) <= 1 for a, b in zip(xs, hv))
    say(f"The balance audit: v16 (approved) on his {len(ks)} blind-rated photos, in sample (no fitting here)")
    say(f"v16 as is: within 1 of him {w1}/{len(ks)} ({100 * w1 / len(ks):.0f}%), r {V.pearson(xs, hv):.3f}, "
        f"mean {st.mean(xs):.2f} (his {st.mean(hv):.2f}), sd {st.pstdev(xs):.2f} (his {st.pstdev(hv):.2f})")
    say()
    say("1. What each part moves (the score he sees; 'moves' = the rounded score changes when the part is left out)")
    say(f"   {'part':30s} {'moves':>11s} {'up':>5s} {'down':>5s} {'avg |move|':>10s} {'avg up':>7s} {'avg down':>9s} {'biggest':>8s}")
    table = {}
    for f in FAMS:
        d = {k: fin[k] - without[f][k] for k in ks}
        moved = [k for k in ks if shown[k] != rshown[f][k]]
        up = [d[k] for k in ks if d[k] > 0.05]
        dn = [d[k] for k in ks if d[k] < -0.05]
        big = max(ks, key=lambda k: abs(d[k]))
        table[f] = {"moves": len(moved), "up": len(up), "down": len(dn), "abs": st.mean(abs(v) for v in d.values()),
                    "avg_up": st.mean(up) if up else 0.0, "avg_down": st.mean(dn) if dn else 0.0, "big": d[big],
                    "big_key": big}
        say(f"   {NAMES[f]:30s} {len(moved):3d} ({100 * len(moved) / len(ks):2.0f}%) {len(up):5d} {len(dn):5d} "
            f"{table[f]['abs']:10.2f} {table[f]['avg_up']:+7.2f} {table[f]['avg_down']:+9.2f} {d[big]:+8.2f}")
    say()
    say("2. Does each part track him? (r of the part's own move with his score; then r and within-1 with the part left out)")
    say(f"   {'part':30s} {'r(move, him)':>12s} {'r without':>10s} {'within 1 without':>17s}")
    for f in FAMS:
        d = [fin[k] - without[f][k] for k in ks]
        rm = V.pearson(d, hv) if st.pstdev(d) > 0 else float("nan")
        xs_w = [rshown[f][k] for k in ks]
        ww = sum(abs(a - b) <= 1 for a, b in zip(xs_w, hv))
        table[f].update({"r_move": rm, "r_without": V.pearson(xs_w, hv), "w1_without": ww})
        say(f"   {NAMES[f]:30s} {rm:12.3f} {table[f]['r_without']:10.3f} {ww:6d}/{len(ks)} ({ww - w1:+d})")
    say()
    miss = [k for k in ks if abs(shown[k] - his[k]) > 1]
    over = [k for k in miss if shown[k] > his[k]]
    under = [k for k in miss if shown[k] < his[k]]
    say(f"3. Where v16 misses him by more than a point: {len(miss)} photos ({len(over)} scored too high, {len(under)} too low)")
    say("   For each part: on how many misses leaving it out brings the score within a point (it caused the miss),")
    say("   and its average move on the too-high and the too-low misses.")
    say(f"   {'part':30s} {'fixes':>6s} {'avg move, too high':>19s} {'avg move, too low':>18s}")
    for f in FAMS:
        fixes = sum(abs(rshown[f][k] - his[k]) <= 1 for k in miss)
        mo = st.mean(fin[k] - without[f][k] for k in over) if over else 0.0
        mu = st.mean(fin[k] - without[f][k] for k in under) if under else 0.0
        table[f].update({"fixes": fixes, "move_over": mo, "move_under": mu})
        say(f"   {NAMES[f]:30s} {fixes:6d} {mo:+19.2f} {mu:+18.2f}")
    say()
    say("   The misses, one line each (his score, v16's, then each part's move where it is 0.25 or more):")
    for k in sorted(miss, key=lambda k: shown[k] - his[k]):
        rd = pool[k][2]
        what = ", ".join(f"{g.get('color_family')} {g.get('subcategory')}" + (f" ({g.get('leg_shape')})" if g.get("category") == "bottom" else "")
                         for g in rd["garments"] if g.get("category") in ("top", "outerwear", "bottom", "footwear"))
        mv = ", ".join(f"{f} {fin[k] - without[f][k]:+.2f}" for f in FAMS if abs(fin[k] - without[f][k]) >= 0.25)
        say(f"   {k:28s} him {his[k]:4.1f}  v16 {shown[k]:4.1f}  [{mv or 'nothing moves'}]  {what}")
    say()
    lay = [k for k in ks if any(g.get("category") == "outerwear" for g in pool[k][2]["garments"])]
    nol = [k for k in ks if k not in lay]
    for name, grp in (("with an outer layer", lay), ("without", nol)):
        h = [his[k] for k in grp]
        x = [shown[k] for k in grp]
        ww = sum(abs(a - b) <= 1 for a, b in zip(x, h))
        say(f"4. Photos {name}: {len(grp)}; his mean {st.mean(h):.2f}, v16's {st.mean(x):.2f}; within 1 {ww}/{len(grp)} "
            f"({100 * ww / len(grp):.0f}%); r {V.pearson(x, h):.3f}; shape moves {sum(shown[k] != rshown['shape'][k] for k in grp)}")
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "audit.txt").write_text("\n".join(lines) + "\n")
    (OUT / "audit.json").write_text(json.dumps({"n": len(ks), "within1": w1, "table": table}, indent=1, default=str))
    return 0


if __name__ == "__main__":
    sys.exit(main())

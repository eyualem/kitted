#!/usr/bin/env python3
"""The outline rules on paper (Nov 17, 2026; $0, stored readings and the stored second looks only).

  KITTED_DATA=<main checkout> /usr/bin/python3 outline_paper.py        -> results/outline1/paper.txt, fitted_*.json

Question: does reading the whole outfit's shape, layers included (where the outermost layer ends, from look U, which
the app already asks on every check), bring v16 closer to the founder on photos the fit never saw?

Method (the honest one, PR #137's correction): for each of 8 random half splits (seeds 1-8) of his 164 rated photos,
every taste size is refit on half A only (taste_rules.py's FIXED and GRID, coordinate ascent on r + share within 1,
3 passes), then half B is scored with half A's sizes. The baseline arm is v16 itself refit the same way, which must
reproduce T68's 82.0% / r 0.63. A new rule ships only if its arm beats that baseline on half B.

Arms (each adds to the one before unless said):
  v16                v16 as approved (refit per half A)
  +mid               the outline at the hip or crotch costs (sizes fitted: straight/narrow legs, full legs)
  +mid, no lift      ... and the short-layer and open-layer lifts don't count when the outline ends mid
  +short +long       a waist-length outline over a full or straight leg lifts; a long coat lifts
  +color stack       dark inside light costs; neutral layers with a light-to-dark step lift
  mid only, shorts   +mid, no lift, with shorts photos included
  mid, layers only / tops only     the ablation: the hip-length charge only when a layer is worn / only when none is
  +outline, creators               the full set with the creators' two limits: a blazer, sport coat or suit jacket is
                                   spared (suit.6, no fixed length) and a top with nothing over it never pays the hip
                                   charge (prop.7, untucked is never a fault on a casual outfit); short and long still run
  +short +long, layers             the full set, layers only
  approved v16 / approved +outline the approved sizes held exactly; only the outline sizes fitted on half A
  approved +outline, creators, edges   the recommendation: the creators' version plus the edge-case defaults
Then: the chosen arm's sizes fitted on all 164 (for the bars and the named outfits), what moved and why.
"""
import json
import random
import statistics as st
import sys
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rubrics"))
import parts_proto as P  # noqa: E402
import v16_paper as V  # noqa: E402
import taste_rules as TR  # noqa: E402  (FIXED, GRID; importing runs nothing)
import outline_audit as A  # noqa: E402

OUT = HERE / "results" / "outline1"
SEEDS = range(1, 9)
ARMS = [
    ("v16", {}, {}),
    ("+mid", {}, {"ol.mid": [0, 0.25, 0.5, 0.75, 1.0], "ol.mid_full": [0, 0.25, 0.5]}),
    ("+mid, no lift", {"ol.mid_block": True}, {"ol.mid": [0, 0.25, 0.5, 0.75, 1.0], "ol.mid_full": [0, 0.25, 0.5]}),
    ("+short +long", {"ol.mid_block": True}, {"ol.mid": [0, 0.25, 0.5, 0.75, 1.0], "ol.mid_full": [0, 0.25, 0.5],
                                              "ol.short": [0, 0.25, 0.5], "ol.long": [0, 0.25, 0.5]}),
    ("+color stack", {"ol.mid_block": True}, {"ol.mid": [0, 0.25, 0.5, 0.75, 1.0], "ol.mid_full": [0, 0.25, 0.5],
                                              "ol.short": [0, 0.25, 0.5], "ol.long": [0, 0.25, 0.5],
                                              "ol.dark_in": [0, 0.25, 0.5], "ol.tonal": [0, 0.25, 0.5]}),
    ("mid only, shorts", {"ol.mid_block": True, "ol.shorts": True}, {"ol.mid": [0, 0.25, 0.5, 0.75, 1.0],
                                                                     "ol.mid_full": [0, 0.25, 0.5]}),
    ("mid, layers only", {"ol.mid_block": True, "ol.only": "outer"}, {"ol.mid": [0, 0.25, 0.5, 0.75, 1.0],
                                                                       "ol.mid_full": [0, 0.25, 0.5]}),
    ("mid, tops only", {"ol.only": "top"}, {"ol.mid": [0, 0.25, 0.5, 0.75, 1.0], "ol.mid_full": [0, 0.25, 0.5]}),
    ("+outline, creators", {"ol.mid_block": True, "ol.tailored_ok": True, "ol.mid_layers_only": True},
     {"ol.mid": [0, 0.25, 0.5, 0.75, 1.0], "ol.mid_full": [0, 0.25, 0.5], "ol.short": [0, 0.25, 0.5], "ol.long": [0, 0.25, 0.5]}),
    ("+outline, creators, edges", {"ol.mid_block": True, "ol.tailored_ok": True, "ol.mid_layers_only": True,
                                   "ol.edges": True},
     {"ol.mid": [0, 0.25, 0.5, 0.75, 1.0], "ol.mid_full": [0, 0.25, 0.5], "ol.short": [0, 0.25, 0.5], "ol.long": [0, 0.25, 0.5]}),
    ("+short +long, layers", {"ol.mid_block": True, "ol.only": "outer"}, {"ol.mid": [0, 0.25, 0.5, 0.75, 1.0],
                              "ol.mid_full": [0, 0.25, 0.5], "ol.short": [0, 0.25, 0.5], "ol.long": [0, 0.25, 0.5]}),
    # the approved v16 sizes held exactly (TUNE["v16"]); only the outline sizes are fitted on half A
    ("approved v16", "approved", {}),
    ("approved +outline", "approved", {"ol.mid": [0, 0.25, 0.5, 0.75, 1.0], "ol.mid_full": [0, 0.25, 0.5],
                                       "ol.short": [0, 0.25, 0.5], "ol.long": [0, 0.25, 0.5]}),
    ("approved +outline, creators", "approved", {"ol.tailored_ok": [True], "ol.mid_layers_only": [True],
                                                 "ol.mid": [0, 0.25, 0.5, 0.75, 1.0], "ol.mid_full": [0, 0.25, 0.5],
                                                 "ol.short": [0, 0.25, 0.5], "ol.long": [0, 0.25, 0.5]}),
    ("approved +outline, creators, edges", "approved", {"ol.tailored_ok": [True], "ol.mid_layers_only": [True],
                                                        "ol.edges": [True], "ol.mid": [0, 0.25, 0.5, 0.75, 1.0],
                                                        "ol.mid_full": [0, 0.25, 0.5], "ol.short": [0, 0.25, 0.5],
                                                        "ol.long": [0, 0.25, 0.5]}),
    ("approved +outline, layers", "approved", {"ol.only": ["outer"], "ol.mid": [0, 0.25, 0.5, 0.75, 1.0],
                                               "ol.mid_full": [0, 0.25, 0.5], "ol.short": [0, 0.25, 0.5],
                                               "ol.long": [0, 0.25, 0.5]}),
]
APPROVED = {k: v for k, v in P.TUNE["v16"]["taste"].items()}


def build(flat):
    """Flat sizes ({"sil": 1.75, "ol.mid": 0.5, ...}) -> the taste dict (outline sizes nested under "outline")."""
    T = {k: v for k, v in flat.items() if not k.startswith("ol.")}
    ol = {k[3:]: v for k, v in flat.items() if k.startswith("ol.")}
    if any(v for v in ol.values()):
        T["outline"] = ol
    return T


def w1(xs, hv):
    return sum(abs(x - y) <= 1 for x, y in zip(xs, hv))


def obj(xs, hv):
    return V.pearson(xs, hv) + w1(xs, hv) / len(hv)


class Scorer:
    def __init__(self, pool):
        self.pool, self.cache = pool, {}

    def __call__(self, k, T):
        key = (k, json.dumps(T, sort_keys=True))
        if key not in self.cache:
            _, _, rd, lk = self.pool[k]
            self.cache[key] = V.sc(rd, "everyday", V.PROFILE, lk, tune={"taste": T}, season=V.season_for(rd))["overall"]
        return self.cache[key]


def fit(score, his, A_, fixed, grid):
    if fixed == "approved":                                           # the approved sizes as they are; only the outline
        flat = dict(APPROVED, **({"ol.mid_block": True} if grid else {}), **{k: v[0] for k, v in grid.items()})
        grid = {k: v for k, v in grid.items() if k.startswith("ol.")}
    else:
        flat = dict(TR.FIXED, **fixed, **{k: v[0] for k, v in grid.items()})
    hA = [his[k] for k in A_]
    best = obj([score(k, build(flat)) for k in A_], hA)
    for _ in range(3):
        moved = False
        for name, vals in grid.items():
            for v in vals:
                c = dict(flat, **{name: v})
                o = obj([score(k, build(c)) for k in A_], hA)
                if o > best + 1e-9:
                    best, flat, moved = o, c, True
        if not moved:
            break
    return flat


def main():
    pool, ks = A.load_pool()
    his = {k: pool[k][0] for k in ks}
    score = Scorer(pool)
    lines = []

    def say(s=""):
        print(s, flush=True)
        lines.append(s)
    say(f"The outline rules on paper: {len(ks)} rated photos, refit on each half A, tested on half B (seeds 1-8)")
    res, sizes = {}, {}
    for name, fixed, extra in ARMS:
        grid = dict(TR.GRID, **extra) if fixed != "approved" else dict(extra)
        for seed in SEEDS:
            sh = ks[:]
            random.Random(seed).shuffle(sh)
            A_, B_ = sorted(sh[: len(sh) // 2]), sorted(sh[len(sh) // 2:])
            flat = fit(score, his, A_, fixed, grid)
            xs, hv = [score(k, build(flat)) for k in B_], [his[k] for k in B_]
            res.setdefault(name, []).append((w1(xs, hv) / len(B_), V.pearson(xs, hv)))
            sizes.setdefault(name, []).append({k: flat[k] for k in extra})
        a, b = [x[0] for x in res[name]], [x[1] for x in res[name]]
        sz = "; ".join(f"{k[3:]} " + "/".join(f"{s[k]}" for s in sizes[name]) for k in extra)
        say(f"  {name:18s} within 1 {100 * st.mean(a):4.1f}% ({100 * min(a):.0f}-{100 * max(a):.0f})  r {st.mean(b):.3f} "
            f"({min(b):.2f}-{max(b):.2f})" + (f"   sizes per split: {sz}" if sz else ""))
    say()
    base = res["v16"]
    say("  Against v16, split by split (within 1 in points, r):")
    for name, _, _ in ARMS[1:]:
        dw = [100 * (x[0] - y[0]) for x, y in zip(res[name], base)]
        dr = [x[1] - y[1] for x, y in zip(res[name], base)]
        say(f"    {name:18s} within 1 {st.mean(dw):+5.1f} (better on {sum(d > 0 for d in dw)}/8, worse on "
            f"{sum(d < 0 for d in dw)}/8)  r {st.mean(dr):+.3f} (better on {sum(d > 0 for d in dr)}/8)")
    # the final sizes: each arm fitted on all 164 (what the bars and the named outfits use)
    say()
    for name, fixed, extra in ARMS:
        flat = fit(score, his, ks, fixed, dict(TR.GRID, **extra) if fixed != "approved" else dict(extra))
        T = build(flat)
        xs = [score(k, T) for k in ks]
        hv = [his[k] for k in ks]
        say(f"  {name:18s} fitted on all 164: within 1 {w1(xs, hv)}/{len(ks)}, r {V.pearson(xs, hv):.3f}, mean "
            f"{st.mean(xs):.2f} (his {st.mean(hv):.2f}), sd {st.pstdev(xs):.2f} (his {st.pstdev(hv):.2f}); "
            + ", ".join(f"{k} {flat[k]}" for k in list(TR.GRID) + list(extra) if k in flat))
        slug = name.replace("+", "").replace(",", "").replace(" ", "_")
        (OUT / f"fitted_{slug}.json").write_text(json.dumps({"taste": T, "arm": name}, indent=1))
    (OUT / "paper.txt").write_text("\n".join(lines) + "\n")
    return 0


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    sys.exit(main())

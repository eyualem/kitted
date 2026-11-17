#!/usr/bin/env python3
"""The hybrid's honest held-out number (Nov 17, 2026; $0). Test only.

  KITTED_DATA=<main checkout> V16_DIR=<checkout of claude/rescoring-v16-58d34b @ 51f658df>/extraction-test \
      /usr/bin/python3 refit_blend.py

score_runs.py blends the AI with the full-fit v16 (TUNE["v16"], whose taste sizes were fitted on all 164 of his
ratings), so its held-out blend is flattered. Here v16's taste sizes are refit on each split's half A exactly as
taste_rules.py does (its FIXED and GRID, coordinate ascent on r + share within 1, 3 passes; seeds 1-8), then:
  v16 refit      half B scored with half A's sizes (should reproduce T68's 82.0%, r 0.63)
  W / WG / Wm    the AI's weight fitted on half A against v16-refit-on-A, tested on half B (WG: then v16's caps)
Writes extraction-test/results/ai-judge1/refit-blend.txt (aggregates only).
"""
import glob
import json
import math
import os
import random
import statistics as st
import sys
from pathlib import Path

sys.dont_write_bytecode = True
DATA = Path(os.environ["KITTED_DATA"])
V16 = Path(os.environ["V16_DIR"]).resolve()
sys.path.insert(0, str(V16))
sys.path.insert(0, str(V16 / "rubrics"))
import v16_paper as V  # noqa: E402
import hoodie_layer_paper as H  # noqa: E402
import taste_rules as TR  # noqa: E402  (FIXED, GRID; importing runs nothing)

J = DATA / "inputs" / "ai-judge"
HERE = Path(__file__).resolve().parent


def half(x):
    return math.floor(x * 2 + 0.5) / 2


def pearson(a, b):
    return V.pearson(a, b)


def w1(xs, hv):
    return sum(abs(x - y) <= 1 for x, y in zip(xs, hv))


def obj(xs, hv):
    return pearson(xs, hv) + w1(xs, hv) / len(hv)


def ai_runs():
    out = {}
    for r in (1, 2, 3):
        key = json.loads((J / ".key" / f"run{r}.json").read_text())
        got = {}
        for f in glob.glob(str(J / "out" / f"run{r}-*.jsonl")):
            for line in open(f):
                if line.strip():
                    d = json.loads(line)
                    got[key[d["id"]]["photo"]] = d["score"]
        out[r] = got
    return out


def main():
    runs, panel, founder, _ = H.load_gold()
    f4, rows = V.load_founder4()
    pool = V.rated_pool(runs, founder, f4, rows)
    ks = sorted(k for k in pool if V.sc(pool[k][2], "everyday", V.PROFILE)["overall"] is not None)
    his = {k: pool[k][0] for k in ks}
    ai = ai_runs()
    med = {k: st.median(ai[r][k] for r in ai) for k in ks}
    cache = {}

    def score(k, T):
        tk = (k, json.dumps(T, sort_keys=True))
        if tk not in cache:
            r = V.sc(pool[k][2], "everyday", V.PROFILE, pool[k][3], tune={"taste": T}, season=V.season_for(pool[k][2]))
            cache[tk] = (r["overall"], min((c["cap"] for c in (r.get("v16") or {}).get("caps", [])), default=None))
        return cache[tk]

    def fit(A):
        T = dict(TR.FIXED, **{k: v[0] for k, v in TR.GRID.items()})
        hA = [his[k] for k in A]
        best = obj([score(k, T)[0] for k in A], hA)
        for _ in range(3):
            moved = False
            for name, vals in TR.GRID.items():
                for v in vals:
                    c = dict(T, **{name: v})
                    o = obj([score(k, c)[0] for k in A], hA)
                    if o > best + 1e-9:
                        best, T, moved = o, c, True
            if not moved:
                break
        return T

    def guard(x, cap):
        return max(3.0, min(9.5, x if cap is None else min(x, cap)))

    lines = []

    def say(s=""):
        print(s, flush=True)
        lines.append(s)
    say(f"The hybrid with v16 refit on each half A ({len(ks)} photos; seeds 1-8; taste_rules.py's FIXED + GRID)")
    res = {}
    ws = [i / 10 for i in range(11)]
    for seed in range(1, 9):
        sh = ks[:]
        random.Random(seed).shuffle(sh)
        A, B = sorted(sh[: len(sh) // 2]), sorted(sh[len(sh) // 2:])
        T = fit(A)
        hA, hB = [his[k] for k in A], [his[k] for k in B]
        vA = {k: score(k, T) for k in A}
        vB = {k: score(k, T) for k in B}
        a1 = ai[1]
        arms = {}
        arms["v16 refit on half A"] = ([vB[k][0] for k in B], None)
        arms["AI one call (run 1)"] = ([a1[k] for k in B], None)
        for nm, src, cap in (("W: blend, AI one call + v16 refit", a1, False),
                             ("WG: blend + v16's caps", a1, True),
                             ("Wm: blend, AI median of 3 + v16 refit", med, False)):
            f = (lambda w, k, v, s=src, c=cap: guard(half(w * s[k] + (1 - w) * v[k][0]), v[k][1]) if c
                 else half(w * s[k] + (1 - w) * v[k][0]))
            w = max(ws, key=lambda w: obj([f(w, k, vA) for k in A], hA))
            arms[nm] = ([f(w, k, vB) for k in B], w)
        for nm, (xs, w) in arms.items():
            res.setdefault(nm, []).append((w1(xs, hB) / len(B), pearson(xs, hB), w))
        say(f"  seed {seed}: v16 refit {100 * res['v16 refit on half A'][-1][0]:.0f}% r {res['v16 refit on half A'][-1][1]:.3f}; "
            f"W {100 * res['W: blend, AI one call + v16 refit'][-1][0]:.0f}% r {res['W: blend, AI one call + v16 refit'][-1][1]:.3f} "
            f"(w {res['W: blend, AI one call + v16 refit'][-1][2]})")
    say()
    say("Held-out half B, averages over the 8 splits (range):")
    for nm, vs in res.items():
        a, b = [v[0] for v in vs], [v[1] for v in vs]
        wt = "" if vs[0][2] is None else "  AI weight " + "/".join(f"{v[2]:.1f}" for v in vs)
        say(f"  {nm:40s} within 1 {100 * st.mean(a):4.1f}% ({100 * min(a):.0f}-{100 * max(a):.0f})  r {st.mean(b):.3f} "
            f"({min(b):.2f}-{max(b):.2f}){wt}")
    dst = HERE.parent / "results" / "ai-judge1"
    dst.mkdir(parents=True, exist_ok=True)
    (dst / "refit-blend.txt").write_text("\n".join(lines) + "\n")


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""His taste rules (T68 round 3, Nov 16, $0): fit their sizes on a random half of his rated photos, test on the other.

The rules are the patterns in tasks/T68/TASK.md (Round 3), built in parts_proto.py's _v16_taste and switched off in
the engine until he confirms them. The reads they use are the ones T98 found usable (PR #126): leg shape graded from
the reading, roomy shorts (volume 4-5), the long top from the Mac's body ruler (half a point at most, never a cap).

  KITTED_DATA=<main checkout> /usr/bin/python3 taste_rules.py [--key consistent]
     fits on half A, reports half A and the held-out half B (the honest number), writes results/taste1/fitted_taste.json
  then: /usr/bin/python3 v16_paper.py --taste results/taste1/fitted_taste.json     (every bar, into results/v16-taste/)

His scores: the raw ratings, or with --key consistent his consistent key (consistent_key.py: his blind re-rate where he
re-rated, his original elsewhere). The split is fixed (seed 20261116), the same for both keys. The fit maximizes
r + the share within 1 point on half A, one rule at a time over a small grid (coordinate ascent, 3 passes). Fixed by
the evidence, not fitted: which lifts are off (L3, L5, L7b), the pooling cap as a tip, the long top's half point.
"""
import json
import os
import random
import statistics as st
import sys
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rubrics"))
import v16_paper as V  # noqa: E402
import hoodie_layer_paper as H  # noqa: E402

OUT = HERE / "results" / "taste1"
SEED = 20261116
# the founder's yes (Nov 16): the creators win clashes, so no lift is off (L3, L7b count; L5 by look) and the plain
# shorts charge is 0 (no creator calls shorts a fault); parts_proto.TASTE_BY_LOOK scales each size by the graded look
FIXED = {"lift_off": [], "h7_tip": True, "long_top": 0.5, "long_top_read": "reading", "shorts": 0,
         "one_lift": 0.5,                                              # the table: a single lift at half (rule i)
         "leg_slim": 0,                                                # row b: slim is v16's own charge (and free in tailored)
         # Nov 17, card by card: one color is free (his "point"); slides fine on a warm casual day; runners fine with
         # casual pieces
         "color": 0, "sandals_warm": True, "runners_casual": True,
         "sil_mode": "alone",
         # round 5 (Nov 17): steadier steps: the first lift counts half (not only a lone lift), a halved lift still
         # counts for stacking, relaxed legs get half the wide-leg and silhouette credit
         "one_lift_mode": "first", "stack_prehalf": True, "relaxed_factor": 0.5}                                          # SIL lifts a great shape when nothing else does
GRID = {"sil": [0.5, 0.75, 1.0, 1.25, 1.5, 1.75], "sil_line": [0.5, 0.75, 1.0], "sil_tonal": [0, 0.25, 0.5],
        "leg_skinny": [0.5, 1.0, 1.5],                                # Nov 17: skinny costs in every look, tailored too
        "leg_wide": [0, 0.25, 0.5, 0.75],
        "hem_plus": [0, 0.25, 0.5],
        "shorts_wide": [0, 0.25, 0.5], "shorts_above": [0, 0.25, 0.5, 0.75]}


if os.environ.get("TASTE_OVERRIDE"):                                # ablations: fix some sizes, drop them from the fit
    _ov = json.loads(os.environ["TASTE_OVERRIDE"])
    FIXED.update(_ov)
    for _k in _ov:
        GRID.pop(_k, None)


def stats(xs, hv):
    w1 = sum(abs(x - y) <= 1 for x, y in zip(xs, hv))
    return w1, len(hv), V.pearson(xs, hv), st.mean(xs)


def main():
    consistent = "--key" in sys.argv and sys.argv[sys.argv.index("--key") + 1] == "consistent"
    runs, panel, founder, _ = H.load_gold()
    f4, rows = V.load_founder4()
    pool = V.rated_pool(runs, founder, f4, rows)
    if consistent:
        kf = OUT / "consistent_key.json"
        if not kf.exists():
            print("No consistent key yet (consistent_key.py after his re-rate).")
            return 1
        key = json.loads(kf.read_text())
        if not key.get("range_kept"):
            print("The consistent key moved his band shares more than 3 points; not used until he has seen it.")
            return 1
        pool = {k: (key["key"].get(k, v[0]),) + v[1:] for k, v in pool.items()}
    ks = sorted(k for k in pool if V.sc(pool[k][2], "everyday", V.PROFILE)["overall"] is not None)
    seed = int(sys.argv[sys.argv.index("--seed") + 1]) if "--seed" in sys.argv else SEED
    rng = random.Random(seed)
    sh = ks[:]
    rng.shuffle(sh)
    A, B = sorted(sh[: len(sh) // 2]), sorted(sh[len(sh) // 2:])
    if "--all" in sys.argv:                                            # the final sizes: fitted on every photo
        A = B = sorted(ks)
    his = {k: pool[k][0] for k in ks}
    cache = {}

    def score(k, T):
        tk = (k, json.dumps(T, sort_keys=True))
        if tk not in cache:
            cache[tk] = V.sc(pool[k][2], "everyday", V.PROFILE, pool[k][3], tune={"taste": T},       # None = off
                             season=None if os.environ.get("TASTE_NOSEASON") else V.season_for(pool[k][2]))["overall"]
        return cache[tk]

    def obj(T, half):
        xs = [score(k, T) for k in half]
        hv = [his[k] for k in half]
        w1, n, r, _ = stats(xs, hv)
        return r + w1 / n

    T = dict(FIXED, **{k: v[0] for k, v in GRID.items()})
    best = obj(T, A)
    for _ in range(3):
        moved = False
        for name, vals in GRID.items():
            for v in vals:
                c = dict(T, **{name: v})
                o = obj(c, A)
                if o > best + 1e-9:
                    best, T, moved = o, c, True
        if not moved:
            break
    lines = []

    def say(s=""):
        print(s)
        lines.append(s)
    say(f"His taste rules, fitted on half A, tested on the held-out half B ({'his consistent key' if consistent else 'his raw ratings'}; "
        f"{len(ks)} photos: A {len(A)}, B {len(B)}; seed {SEED})")
    say("Fitted sizes: " + ", ".join(f"{k} {T[k]}" for k in GRID) + f"; fixed: lifts off {', '.join(FIXED['lift_off']) or 'none'}, plain shorts {FIXED['shorts']}, "
        f"a single lift at {FIXED['one_lift']}, slim 0 (row b), one color free, slides fine warm and casual, runners fine casual, the pooling cap a tip, the long top {FIXED['long_top']} (read: {FIXED['long_top_read']})")
    for name, half in (("A (fitted on it)", A), ("B (held out: the honest number)", B), ("all", ks)):
        hv = [his[k] for k in half]
        say(f"  half {name}:")
        for label, f in (("v15", lambda k: V.sc(pool[k][2], "everyday", V.PROFILE, engine="v15")["overall"]),
                         ("v16 rules off (looks)", lambda k: score(k, None)), ("v16 + his taste rules", lambda k: score(k, T))):
            w1, n, r, m = stats([f(k) for k in half], hv)
            say(f"    {label:24s} within 1 {w1:3d}/{n} ({100 * w1 / n:3.0f}%)  r {r:.3f}  mean {m:.2f} (his {st.mean(hv):.2f})")
    say("  each rule's share on half B (r with it on; then with only that rule off):")
    base = stats([score(k, T) for k in B], [his[k] for k in B])
    for name in list(GRID) + ["long_top"]:
        off = dict(T, **{name: 1.0 if name == "one_lift" else 0})
        w1, n, r, _ = stats([score(k, off) for k in B], [his[k] for k in B])
        say(f"    without {name:12s} r {r:.3f} (with {base[2]:.3f}), within 1 {w1}/{n} (with {base[0]})")
    OUT.mkdir(parents=True, exist_ok=True)
    tag = ("consistent" if consistent else "raw") + ("_all" if "--all" in sys.argv else "")
    (OUT / f"taste_rules_{tag}.txt").write_text("\n".join(lines) + "\n")
    (OUT / f"fitted_taste_{tag}.json").write_text(json.dumps({"taste": T, "key": tag, "seed": SEED, "A": A, "B": B}, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())

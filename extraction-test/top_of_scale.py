#!/usr/bin/env python3
"""The top of the scale on paper (T69, Nov 17, $0; tasks/T69/top-of-scale.md). No API calls: stored readings only.

v16 as approved (#484) clamps raw to 9.5 before the curve, and the curve's top slope is 0.7, so raw 9.5 shows 8.75
(rounded 9.0). The founder (#488): "the max should be around 9.5 and not capped at 9". This measures each way of
letting the strongest outfits reach 9.5, every one a what-if tune of parts_proto's v16 knobs (off by default:
raw_cap, curve_knee, curve, stack_clean), against v16 as approved:

  - B6 steadiness: each reading with its own leg-width look (the bar, 218/223), with none, and with looks U, L + leg
  - held out: his raw ratings and his consistent key, 8 fresh splits (seeds 1-8, as T68), the taste sizes refit on
    half A each time exactly as taste_rules.py does, tested on half B
  - band shares on gold (first reading, cool, as B5) and on his saved checks
  - which photos reach 9-9.5; the 15 named outfits; B2, B3, B4; and how many made-up outfits built from strong
    pieces (53,568 combinations) can show 9 or 9.5 at all

  KITTED_DATA=<main checkout> /usr/bin/python3 top_of_scale.py [--only A,B]     writes results/top-of-scale/
"""
import copy
import json
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
import parts_proto as P  # noqa: E402
import steadiness as S  # noqa: E402
import taste_rules as TR  # noqa: E402

OUT = HERE / "results" / "top-of-scale"
SEEDS = range(1, 9)
BASE = copy.deepcopy(P.TUNE["v16"])
TOP3 = {"3c": 9.5, "4c": 9.5}                                    # three lifts in one look, nothing off: 9.5
TOPT = {"2c": 9.0, "3c": 9.5, "4c": 9.5}                         # nothing off, one look: two lifts 9.0, three 9.5
STEP = P.V16_TOP_WHATIF["BE"]["stack_clean"]                    # nothing off: half a step up
VARIANTS = [
    ("v16", "v16 as approved (raw clamp 9.5, top slope 0.7)", {}),
    ("A", "A: raw cap 10.6 (shown still clamped at 9.5)", P.V16_TOP_WHATIF["A"]),
    ("B", "B: a knee at raw 8.5, slope 1.45 above (raw 9.5 -> 9.5)", P.V16_TOP_WHATIF["B"]),
    ("B8", "B': a knee at raw 8.0, slope 1.2 above (raw 9.5 -> 9.5)", {"curve_knee": (8.0, 1.2)}),
    ("C85", "C: top slope 0.85", P.V16_TOP_WHATIF["C"]),
    ("C10", "C': top slope 1.0", P.V16_TOP_WHATIF["C1"]),
    ("D", "D: three lifts in one look with nothing off may reach 9.5 (curve as approved)", {"stack_clean": TOP3}),
    ("BD", "B + D: the knee and the clean three-lift step", P.V16_TOP_WHATIF["BD"]),
    ("B9D", "B9 + D: a knee at raw 9.0, slope 2.0 above, and the clean three-lift step",
     {"curve_knee": (9.0, 2.0), "stack_clean": TOP3}),
    # E: with nothing off, every stacking ceiling rises half a step (one lift 8.5, two 9.0, three in one look 9.5),
    # with a knee so a high raw can reach it; E2: two lifts in one look, nothing off, may reach 9.5 too; E3 (a bound):
    # with nothing off, no stacking ceiling at all below 9.5
    ("BE", "B + E: the knee, and with nothing off every stacking ceiling half a step higher",
     P.V16_TOP_WHATIF["BE"]),
    ("B8E", "B' + E: the knee at 8.0, and with nothing off every stacking ceiling half a step higher",
     {"curve_knee": (8.0, 1.2), "stack_clean": STEP}),
    ("BE2", "B + E2: the knee, and with nothing off two or more lifts in one look may reach 9.5",
     {"curve_knee": (8.5, 1.45), "stack_clean": dict(STEP, **{"2c": 9.5})}),
    # T: only the top two steps rise, and only with nothing off in one look (two lifts 9.0, three 9.5); one lift and
    # none keep 8.0 and 7.5
    ("BT", "B + T: the knee, and with nothing off in one look two lifts may reach 9.0, three 9.5",
     {"curve_knee": (8.5, 1.45), "stack_clean": TOPT}),
    ("BkD", "Bk + D: a steeper knee (raw 8.5, slope 1.6: raw 9.25 -> 9.25) and the clean three-lift step",
     {"curve_knee": (8.5, 1.6), "stack_clean": TOP3}),
    ("BkT", "Bk + T: the steeper knee, and with nothing off in one look two lifts 9.0, three 9.5",
     {"curve_knee": (8.5, 1.6), "stack_clean": TOPT}),
    ("BE3", "B + E3 (a bound): the knee, and with nothing off no stacking ceiling",
     {"curve_knee": (8.5, 1.45), "stack_clean": {str(i): 9.5 for i in range(5)}}),
]


def apply(tn):
    P.TUNE["v16"].clear()
    P.TUNE["v16"].update(copy.deepcopy(BASE))
    P.TUNE["v16"].update(copy.deepcopy(tn))


def section_counts(fn, *args):
    lines = []
    fn(lambda s="": lines.append(s), *args)
    return lines


def bars_b234(cr):
    def verdict(ln):
        w = ln.split()
        return (w[0], w[1]) if len(w) > 1 and w[1] in ("PASS", "FAIL") else None
    b4 = [v for v in map(verdict, section_counts(V.run_dealbreakers)) if v]
    c = section_counts(V.run_creators, cr)
    i3 = next(i for i, ln in enumerate(c) if ln.startswith("== B3"))
    b2 = [ln.split()[0] for ln in c[1:i3] if ln.split()[:1] in (["PASS"], ["FAIL"])]
    b3 = [v for v in map(verdict, c[i3:]) if v and v[0].startswith("a")]
    return ((sum(x == "PASS" for x in b2), len(b2)), (sum(x[1] == "PASS" for x in b3), len(b3)),
            sorted({x[0] for x in b4 if x[1] == "FAIL"}))


def heldout(pool, his_key):
    """taste_rules.py's fit, in process: for each seed, fit the sizes on half A, test on half B."""
    ks = sorted(k for k in pool if V.sc(pool[k][2], "everyday", V.PROFILE)["overall"] is not None)
    cache = {}

    def score(k, T):
        tk = (k, json.dumps(T, sort_keys=True))
        if tk not in cache:
            cache[tk] = V.sc(pool[k][2], "everyday", V.PROFILE, pool[k][3], tune={"taste": T},
                             season=V.season_for(pool[k][2]))["overall"]
        return cache[tk]
    out = {}
    for name, his in his_key.items():
        w, r = [], []
        for seed in SEEDS:
            rng = random.Random(seed)
            sh = ks[:]
            rng.shuffle(sh)
            A, B = sorted(sh[: len(sh) // 2]), sorted(sh[len(sh) // 2:])

            def obj(T, half):
                xs = [score(k, T) for k in half]
                hv = [his[k] for k in half]
                w1, n, rr, _ = TR.stats(xs, hv)
                return rr + w1 / n
            T = dict(TR.FIXED, **{k: v[0] for k, v in TR.GRID.items()})
            best = obj(T, A)
            for _ in range(3):
                moved = False
                for nm, vals in TR.GRID.items():
                    for v in vals:
                        c = dict(T, **{nm: v})
                        o = obj(c, A)
                        if o > best + 1e-9:
                            best, T, moved = o, c, True
                if not moved:
                    break
            w1, n, rr, _ = TR.stats([score(k, T) for k in B], [his[k] for k in B])
            w.append(w1 / n)
            r.append(rr)
        out[name] = (st.mean(w), st.mean(r), min(w), max(w))
    return out


def named_scores(runs, ph, cr):
    looks = V.load_looks()
    out = []
    for src, key, name in V.NAMED:
        if src == "phone":
            v = ph[key]
            a = V.sc(v["reading"], v["occ"], V.FOUNDER, v["sl"])["overall"]
        elif src == "gold":
            a = V.sc(runs[key][0], "everyday", V.PROFILE, (looks.get(key) or [None])[0])["overall"]
        elif src == "creator":
            a, _ = V.med(cr[key])
        else:
            a = V.sc(key)["overall"]
        out.append((name, a))
    return out


def tops(runs, ph, cr, pool, his):
    """Every photo that shows 9 or more: gold (first reading, cool, its own leg look), his saved checks, his rated
    photos read Nov 16 (the app's case: looks + season), the creators' stills (median of 3)."""
    leg = V.load_leg_look()
    got = []
    for p, rs in runs.items():
        r = V.sc(rs[0], "everyday", V.PROFILE, leg.get(p, {}).get(0))
        if r["overall"] is not None and r["overall"] >= 9:
            got.append(("gold", p, r["overall"], his.get(p), H.desc(rs[0]), V.why(r)))
    for k, v in ph.items():
        r = V.sc(v["reading"], v["occ"], V.FOUNDER, v["sl"])
        if r["overall"] is not None and r["overall"] >= 9:
            got.append(("his check", k, r["overall"], None, H.desc(v["reading"]), V.why(r)))
    for k, (hs, _, rd, lk) in pool.items():
        if not k.startswith("C"):
            continue
        r = V.sc(rd, "everyday", V.PROFILE, lk, season=V.season_for(rd))
        if r["overall"] is not None and r["overall"] >= 9:
            got.append(("rated", k, r["overall"], hs, H.desc(rd), V.why(r)))
    for k, rds in cr.items():
        m, xs = V.med(rds)
        if m >= 9:
            got.append(("creator", k, m, None, H.desc(rds[0]), V.why(xs[0])))
    return got


def made_up():
    """Every combination of strong made-up pieces (rules_conformance's helpers; Everyday, no picks, cool day): how many
    show 9 and 9.5. Tests whether 9.5 can be reached at all, since no stored photo comes near it."""
    import itertools
    import rules_conformance as RC
    top, outer, bottom, shoe = RC.top, RC.outer, RC.bottom, RC.shoe
    tops_ = [top(s, c, v, tucked=t) for s in ("tee", "knit_polo", "oxford_shirt") for c in ("white", "black", "burgundy")
             for v in (2, 4) for t in ("full", "none")]
    outs = [None] + [outer(s, c) for s in ("bomber", "cardigan", "overshirt", "leather_jacket", "denim_jacket", "chore_coat")
                     for c in ("burgundy", "navy", "olive", "black", "tan_camel")]
    bots = [bottom("trousers", c, lg) for c in ("charcoal", "black", "off_white_cream") for lg in ("wide", "straight")] + \
        [bottom("jeans", "denim_dark", "wide"), bottom("chinos", "khaki_beige", "wide")]
    shs = [shoe(a, c) for a, c in (("loafer", "black"), ("loafer", "brown"), ("derby", "black"),
                                   ("white_leather_sneaker", "white"), ("work_boot", "brown"), ("dress_shoe", "black"))]
    n = n9 = n95 = 0
    ceil95 = 0
    ex = None
    for parts in itertools.product(tops_, outs, bots, shs):
        rd = RC.Rd(*[x for x in parts if x is not None])
        r = P.score_parts(rd, "everyday", {}, None, "a_little", engine="v16")
        if r["overall"] is None:
            continue
        n += 1
        n9 += r["overall"] == 9.0
        n95 += r["overall"] == 9.5
        ceil95 += r["v16"]["stack_ceiling"] == 9.5
        if r["overall"] == 9.5 and ex is None:
            ex = H.desc(rd) + "; " + V.why(r)
    return n, n9, n95, ceil95, ex


def main():
    only = sys.argv[sys.argv.index("--only") + 1].split(",") if "--only" in sys.argv else None
    runs, panel, founder, _ = H.load_gold()
    ph = H.load_phone()
    cr = V.load_creators()
    f4, rows = V.load_founder4()
    pool = V.rated_pool(runs, founder, f4, rows)
    key = json.loads((HERE / "results/taste1/consistent_key.json").read_text())["key"]
    his_key = {"raw": {k: v[0] for k, v in pool.items()}, "key": {k: key.get(k, v[0]) for k, v in pool.items()}}
    hisg = dict(founder)
    hisg.update(f4)
    hisg.update({k: key[k] for k in key if k in hisg})                # his consistent key where he re-rated
    two = [p for p in runs if len(runs[p]) >= 2]
    lines, table = [], {}

    def say(s=""):
        print(s, flush=True)
        lines.append(s)
    for vid, label, tn in VARIANTS:
        if only and vid not in only and vid != "v16":
            continue
        apply(tn)
        say(f"== {label} ==  tune {json.dumps(tn)}")
        stl = {lk: S.steadiness(None, False, lk)[0] for lk in ("leg", "none", "all")}
        say(f"  B6 steady: with each reading's own leg look {stl['leg']}/223 (bar 218); none {stl['none']}; looks U, L + leg {stl['all']}")
        ho = heldout(pool, his_key)
        say(f"  held out (8 splits): raw {100 * ho['raw'][0]:.1f}% ({100 * ho['raw'][2]:.0f}-{100 * ho['raw'][3]:.0f}), r {ho['raw'][1]:.3f}; "
            f"key {100 * ho['key'][0]:.1f}%, r {ho['key'][1]:.3f}")
        g = [V.sc(runs[p][0], "everyday", V.PROFILE) for p in runs]
        gs = V.shares([x["overall"] for x in g if x["overall"] is not None])
        pc = [V.sc(v["reading"], v["occ"], V.FOUNDER, v["sl"]) for v in ph.values()]
        ps = V.shares([x["overall"] for x in pc if x["overall"] is not None])
        say(f"  gold shares   {V.fmt_shares(gs)}  worst gap {100 * V.worst_gap(gs):.1f}")
        say(f"  his checks    {V.fmt_shares(ps)}  worst gap {100 * V.worst_gap(ps):.1f}")
        b2, b3, b4 = bars_b234(cr)
        say(f"  B2 {b2[0]}/{b2[1]}  B3 {b3[0]}/{b3[1]}  B4 rows failing: {', '.join(b4) or 'none'}")
        # all 164 rated photos (the sizes saw these; information only)
        ks = [k for k in pool if V.sc(pool[k][2], "everyday", V.PROFILE)["overall"] is not None]
        xs = {k: V.sc(pool[k][2], "everyday", V.PROFILE, pool[k][3], season=V.season_for(pool[k][2]))["overall"] for k in ks}
        hv = his_key["raw"]
        w1 = sum(abs(xs[k] - hv[k]) <= 1 for k in ks)
        r_all = V.pearson([xs[k] for k in ks], [hv[k] for k in ks])
        his9 = [k for k in ks if his_key["key"][k] >= 9]
        say(f"  all {len(ks)} rated (engine sizes, info): within 1 {w1}/{len(ks)}, r {r_all:.3f}; his 9+ ({len(his9)} on the key) "
            f"average {st.mean(xs[k] for k in his9):.2f}, {sum(xs[k] >= 9 for k in his9)} shown 9+; "
            f"shown 9+ overall {sum(x >= 9 for x in xs.values())}, his mean on those "
            f"{st.mean([hv[k] for k in ks if xs[k] >= 9]) if any(x >= 9 for x in xs.values()) else float('nan'):.2f}")
        tp = tops(runs, ph, cr, pool, hisg)
        say(f"  shows 9-9.5: {len(tp)} photos ({sum(t[2] == 9.5 for t in tp)} at 9.5)")
        for src, k, sc_, hs, d, wy in sorted(tp, key=lambda t: -t[2]):
            say(f"     {sc_:g}  {src} {k}" + (f" (his {hs:g})" if hs is not None else "") + f": {d}\n            why: {wy}")
        mu = made_up()
        say(f"  made-up strong outfits: {mu[0]} scored, {mu[1]} show 9, {mu[2]} show 9.5; stacking ceiling 9.5 on {mu[3]}"
            + (f"; e.g. {mu[4]}" if mu[4] else ""))
        nm = named_scores(runs, ph, cr)
        say("  named: " + "; ".join(f"{a:g}" for _, a in nm))
        table[vid] = {"label": label, "tune": {k: (list(v) if isinstance(v, tuple) else v) for k, v in tn.items()},
                      "steady": stl, "heldout": ho, "gold_shares": gs, "gold_gap": V.worst_gap(gs), "checks_shares": ps,
                      "checks_gap": V.worst_gap(ps), "b2": b2, "b3": b3, "b4_fail": b4, "all164": [w1, len(ks), r_all],
                      "his9_mean": st.mean(xs[k] for k in his9), "his9_shown9": sum(xs[k] >= 9 for k in his9),
                      "n_his9": len(his9), "tops": tp, "named": nm, "made_up": mu}
        say()
    apply({})
    OUT.mkdir(parents=True, exist_ok=True)
    tag = "" if not only else "-" + "-".join(only)
    (OUT / f"report{tag}.txt").write_text("\n".join(lines) + "\n")
    (OUT / f"table{tag}.json").write_text(json.dumps(table, indent=1, default=str) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())

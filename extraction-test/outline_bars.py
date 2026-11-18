#!/usr/bin/env python3
"""Every v16 bar for the proposed outline version against v16 as approved (Nov 17, 2026; $0).

  KITTED_DATA=<main checkout> /usr/bin/python3 outline_bars.py [results/outline1/fitted_approved_outline_creators_edges.json]
     -> results/outline1/bars.txt, moved.txt

The proposal: TUNE["v16"] exactly, plus taste["outline"] with the sizes outline_paper.py fitted (approved sizes held,
only the outline sizes fitted on all 164). Bars, as T68 wrote them:
  B1  his ratings, held out (outline_paper.py: refit on each half A; quoted here from paper.txt)
  B2  the creators' 6 before/after pairs go the right way      B3  the creators' 18 anchors within a point
  B4  the dealbreaker rows land where he marked them           B5  band shares within 5 points of the targets
  B6  the gold set's two readings of each photo within half a point (218 of 223), three ways: the stored readings
      alone (as written), each with its own leg-width look (the count he chose, Y44), each with its own looks U, L and
      leg (the app's real case once look U's hem is read)
The creators' frames and the dealbreaker rows have no look U, so the outline rules can't fire there: B2-B4 are
checked to be unchanged, not tested by the new rules.
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
import steadiness as SD  # noqa: E402
import outline_audit as A  # noqa: E402

OUT = HERE / "results" / "outline1"
APPROVED = dict(P.TUNE["v16"]["taste"])


def use(taste):
    P.TUNE["v16"]["taste"] = dict(taste)


def main():
    fp = Path(sys.argv[1]) if len(sys.argv) > 1 else OUT / "fitted_approved_outline_creators_edges.json"
    PROPOSED = json.loads(fp.read_text())["taste"]
    lines = []

    def say(s=""):
        print(s, flush=True)
        lines.append(s)
    say(f"Bars: v16 as approved against the proposal ({fp.name}: outline {PROPOSED.get('outline')})")
    say()
    arms = (("v16", APPROVED), ("proposal", PROPOSED))
    # B6
    say("B6 steadiness, the gold set's two readings within half a point (bar 218):")
    for looks, what in (("none", "stored readings alone (as written)"), ("leg", "each with its own leg-width look (his count, Y44)"),
                        ("all", "each with its own looks U, L and leg (the app's case)")):
        row = []
        for name, T in arms:
            use(T)
            s, n, flips = SD.steadiness(None, looks=looks)
            row.append(f"{name} {s}/{n}")
            if looks == "all" and name == "proposal":
                new_flips = flips
            if looks == "all" and name == "v16":
                old_flips = flips
        say(f"  {what:55s} " + "   ".join(row))
    of = {f[0] for f in old_flips}
    for p, scs, causes, f, lf, tf in new_flips:
        if p not in of:
            say(f"    new flip with the looks: {p} {scs[0]:g} / {scs[1]:g}; differs: {', '.join(causes) or 'the looks'}; "
                f"taste {tf[0]} || {tf[1]}")
    for p in sorted(of - {f[0] for f in new_flips}):
        say(f"    steady now (flipped under v16 with the looks): {p}")
    use(APPROVED)
    say()
    # B2-B4
    sink = []
    for name, T in arms:
        use(T)
        quiet = []
        q = lambda x="": quiet.append(x)                              # noqa: E731
        fails = V.run_dealbreakers(q)
        cr = V.load_creators()
        fails += V.run_creators(q, cr) if cr else 1
        sink.append((name, fails, quiet))
    use(APPROVED)
    say(f"B2-B4 (dealbreakers, creators' pairs and anchors; no look U, so the outline can't fire): v16 fails "
        f"{sink[0][1]}, proposal fails {sink[1][1]}; output identical: {sink[0][2] == sink[1][2]}")
    say()
    # B5 band shares: the gold set with each first reading's own looks, his phone checks (their stored looks), his 164
    runs, panel, founder, _ = H.load_gold()
    looks = V.load_looks()
    leg = V.load_leg_look()
    gold = [p for p in runs if V.sc(runs[p][0], "everyday", V.PROFILE)["overall"] is not None]

    def gold_sl(p):
        d = dict((looks.get(p) or [{}])[0])
        d.update(leg.get(p, {}).get(0, {}))
        return d or None
    ph = H.load_phone()
    pool, ks = A.load_pool()
    say(f"B5 band shares (target {V.fmt_shares({n: t for n, _, _, t in V.BANDS})}):")
    for name, T in arms:
        use(T)
        g = V.shares([V.sc(runs[p][0], "everyday", V.PROFILE, gold_sl(p))["overall"] for p in gold])
        c = [V.sc(v["reading"], v["occ"], V.FOUNDER, v["sl"])["overall"] for v in ph.values()]
        c = V.shares([x for x in c if x is not None])
        r = V.shares([A.score(pool, k)["overall"] for k in ks])
        say(f"  {name:9s} gold (with its looks) {V.fmt_shares(g)} worst gap {100 * V.worst_gap(g):.1f}")
        say(f"  {'':9s} his checks           {V.fmt_shares(c)} worst gap {100 * V.worst_gap(c):.1f}")
        say(f"  {'':9s} his 164 rated        {V.fmt_shares(r)}")
    say(f"  {'him':9s} his 164 ratings      {V.fmt_shares(V.shares([pool[k][0] for k in ks]))}")
    use(APPROVED)
    say()
    # what moved on his 164
    before = {k: A.score(pool, k) for k in ks}
    use(PROPOSED)
    after = {k: A.score(pool, k) for k in ks}
    use(APPROVED)
    moved = [k for k in ks if before[k]["overall"] != after[k]["overall"]]
    closer = sum(abs(after[k]["overall"] - pool[k][0]) < abs(before[k]["overall"] - pool[k][0]) for k in moved)
    further = sum(abs(after[k]["overall"] - pool[k][0]) > abs(before[k]["overall"] - pool[k][0]) for k in moved)
    say(f"What moved on his 164 (in sample, the proposal's sizes): {len(moved)} photos; closer to him {closer}, further {further}")
    mv = []
    for k in sorted(moved, key=lambda k: after[k]["overall"] - before[k]["overall"]):
        rd = pool[k][2]
        what = ", ".join(f"{g.get('color_family')} {g.get('subcategory')}" + (f" ({g.get('leg_shape')})" if g.get("category") == "bottom" else "")
                         for g in rd["garments"] if g.get("category") in ("top", "outerwear", "bottom", "footwear"))
        why = "; ".join(f"{x['id']} {x['points']:+g}" for x in after[k]["v16"]["taste"] if x["id"].startswith("O"))
        gone = sorted({x["id"] for x in before[k]["v16"]["lifts"]} - {x["id"] for x in after[k]["v16"]["lifts"]})
        mv.append(f"  {k:9s} him {pool[k][0]:4.1f}  v16 {before[k]['overall']:4.1f} -> {after[k]['overall']:4.1f}  "
                  f"[{why}{'; lift gone: ' + ','.join(gone) if gone else ''}] end={(pool[k][3] or {}).get('outer_hem_at')}  {what}")
    for m in mv:
        say(m)
    (OUT / "bars.txt").write_text("\n".join(lines) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())

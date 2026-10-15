#!/usr/bin/env python3
"""The measured waistline in the score, on paper (DECISIONS-LOG #269). No app change, no API calls.

The phone's body ruler (sk_linear: Apple Vision's 2D shoulders and knees with the ANSUR II proportions, results/waist2)
gives t, where the clothes' visual waistline sits between the shoulders (0) and the knees (1); the navel is t 0.40,
the hip joint 0.56. When it answers, it replaces the AI's `length` of the first top (untucked, no outer layer):
  t ≤ τ1 → at_belt  ·  τ1 < t ≤ τ2 → mid_fly  ·  t > τ2 → below_crotch
  C1: that alone (the live rules then apply: the waist credit, the band fault's exemption, the long-top tip).
  C2: C1 + a measured long top (t > τ2) costs `pf2` on Proportions (the PF2 tip made live).
τ1, τ2 and pf2 are picked on the gold set's tune half only (gold_tune split), then the test half is scored once.

  /usr/bin/python3 waist_paper2.py [ruler]
"""
import itertools, json, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE / "rubrics"))
import gold_tune as G  # noqa: E402
import parts_proto as P  # noqa: E402
import parts2_test as Q  # noqa: E402
import fit_ruler as FR  # noqa: E402
import waist_rulers as WR  # noqa: E402

ENGINE = "v13"
RULER = sys.argv[1] if len(sys.argv) > 1 else "sk_linear"


def measured():
    ps, R = WR.load(HERE / "results" / "waist2")
    return {p["id"]: WR.t_of(R[p["id"]].get(0), RULER, "visual_s") for p in ps}


def apply(reading, t, t1, t2):
    r = json.loads(json.dumps(reading))
    gs = r.get("garments", [])
    if t is None or any(g.get("category") == "outerwear" for g in gs):
        return r
    tops = [g for g in gs if g.get("category") == "top"]
    if not tops or tops[0].get("tucked") in ("full", "half"):
        return r
    L = "at_belt" if t <= t1 else "mid_fly" if t <= t2 else "below_crotch"
    tops[0]["length"] = L
    tops[0]["_len_measured"] = L
    return r


def run(D, sp, M, t1, t2, pf2, which):
    D2 = dict(D)
    D2["runs"] = {p: [apply(rd, M.get(p), t1, t2) for rd in v] for p, v in D["runs"].items()}
    tune = {"pf2_measured": pf2} if pf2 else {}
    photos = sp[which] if which != "all" else sp["tune"] + sp["test"]
    S = G.score_all(D2, photos, ENGINE, tune)
    return G.metrics(D2, S, photos), S


def main():
    D = G.load(); sp = G.get_split(); M = measured()
    base_tune = G.metrics(D, G.score_all(D, sp["tune"], ENGINE), sp["tune"])
    base_test = G.metrics(D, G.score_all(D, sp["test"], ENGINE), sp["test"])
    print(f"ruler {RULER}; measured on {sum(v is not None for k, v in M.items() if k in D['runs'])} of {len(D['runs'])} gold photos")
    print("v13 (live)"); print(G.fmt("tune", base_tune)); print(G.fmt("test", base_test))
    best = {}
    for name, grid in (("C1", [(a, b, 0) for a, b in itertools.product((0.50, 0.52, 0.54, 0.56, 0.58), (0.62, 0.65, 0.68, 0.72)) ]),
                       ("C2", [(a, b, c) for a, b, c in itertools.product((0.50, 0.52, 0.54, 0.56, 0.58), (0.62, 0.65, 0.68, 0.72), (0.5, 1.0, 1.5))])):
        scored = [(run(D, sp, M, a, b, c, "tune")[0]["r"], a, b, c) for a, b, c in grid]
        r, a, b, c = max(scored)
        best[name] = (a, b, c)
        print(f"\n{name}: picked on tune τ1 {a} τ2 {b} pf2 {c} (tune r {r:.3f})")
        m_tune, _ = run(D, sp, M, a, b, c, "tune"); m_test, _ = run(D, sp, M, a, b, c, "test")
        print(G.fmt("tune", m_tune)); print(G.fmt("test", m_test))
    # His saved checks: the first reading of each, with his photo's measured line.
    print("\nhis saved checks (Everyday, the stated test profile; rule 7: his profile is still pending)")
    for name, (a, b, c) in best.items():
        moved = []
        for h6, (pull, h) in sorted(FR.pull_photos().items()):
            rd = FR.pull_readings(pull, h)
            if not rd:
                continue
            pid = f"phone-{h6}"
            t = M.get(pid)
            b0 = P.score_parts(rd[0], "everyday", Q.PROFILE, None, Q.BOLD, engine=ENGINE)["overall"]
            b1 = P.score_parts(apply(rd[0], t, a, b), "everyday", Q.PROFILE, None, Q.BOLD, engine=ENGINE,
                               tune={"pf2_measured": c} if c else None)["overall"]
            if b0 != b1:
                moved.append(f"{pid} {b0} → {b1} (t {t})")
        print(f"  {name}: {len(moved)} moved: " + "; ".join(moved))


if __name__ == "__main__":
    main()

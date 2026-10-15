#!/usr/bin/env python3
"""The waist credit on paper (DECISIONS-LOG #264): what the PR1 "a tucked or short top over a full leg gives it a waist"
credit does under two candidate changes, on the gold set (panel and the founder's 20) and on his saved checks. No app
change, no API calls.

  base  v13 as live: the credit fires on a tuck, a cropped top or a top read "at_belt".
  A     the credit needs a tuck or a cropped top ("at_belt" alone no longer counts).
  B     "at_belt" counts unless the phone's waist ruler (results/waist1) sees the pants start low (below s = −0.02).

  /usr/bin/python3 waist_paper.py
"""
import json, sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rubrics"))
import gold_tune as G  # noqa: E402
import parts_proto as P  # noqa: E402
import fit_ruler as FR  # noqa: E402
import parts2_test as Q  # noqa: E402

ENGINE = "v13"
VARIANTS = {"base": {}, "A": {"pr1_short": ("cropped",)}, "B": {"pr1_ruler_veto": True}}
RUNS = HERE / "results" / "waist1"


def ruler_calls():
    out = {}
    for f in (RUNS / "runs").glob("*.base.json"):
        w = json.loads(f.read_text()).get("waist") or {}
        out[f.name.split(".base.json")[0]] = w.get("value")
    for f in (RUNS / "picks").glob("*.waist.json"):
        out[f.name.split(".waist.json")[0]] = (json.loads(f.read_text()).get("waist") or {}).get("value")
    return out


def tag(reading, call):
    """A copy of the reading with the ruler's call on the first top (the field the what-if reads)."""
    r = json.loads(json.dumps(reading))
    tops = [g for g in r.get("garments", []) if g.get("category") == "top"]
    if tops and call == "covered":
        tops[0]["_waist_ruler"] = "low"
    return r


def fired(res):
    return any(x["check"] == "PR1_waist_break" for x in (res.get("parts", {}).get("proportions", {}) or {}).get("reasons", []))


def gold():
    D = G.load()
    sp = G.get_split()
    calls = ruler_calls()
    for name, tune in VARIANTS.items():
        D2 = dict(D)
        D2["runs"] = {p: [tag(rd, calls.get(p)) for rd in v] for p, v in D["runs"].items()}
        S = G.score_all(D2, sp["tune"] + sp["test"], ENGINE, tune)
        print(f"== gold, {name}")
        for k in ("tune", "test"):
            print(G.fmt(k, G.metrics(D2, S, sp[k])))
        n_fire = sum(fired(S[p][0]) for p in S if S[p] and S[p][0].get("overall") is not None)
        print(f"   waist credit fires on {n_fire} of {len(S)} gold photos (run 0)")


def his_checks():
    calls = ruler_calls()
    rows = []
    for h6, (pull, h) in sorted(FR.pull_photos().items()):
        rd = FR.pull_readings(pull, h)
        if not rd:
            continue
        pid = f"phone-{h6}"
        out = {"id": pid, "pull": pull.name, "ruler": calls.get(pid)}
        for name, tune in VARIANTS.items():
            res = P.score_parts(tag(rd[0], calls.get(pid)), "everyday", Q.PROFILE, None, Q.BOLD, engine=ENGINE, tune=tune)
            out[name] = res.get("overall")
            out[name + "_fired"] = fired(res)
        rows.append(out)
    print("== his saved checks (first reading each, Everyday, the stated test profile)")
    moved = [r for r in rows if r["A"] != r["base"] or r["B"] != r["base"]]
    print(f"   {len(rows)} checks; the waist credit fires on base {sum(r['base_fired'] for r in rows)}, A {sum(r['A_fired'] for r in rows)}, B {sum(r['B_fired'] for r in rows)}")
    for r in moved:
        print(f"   {r['id']} ({r['pull']}): base {r['base']} → A {r['A']} · B {r['B']} (ruler {r['ruler']})")
    return rows


if __name__ == "__main__":
    gold()
    his_checks()

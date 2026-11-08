#!/usr/bin/env python3
"""A layer that picks up the bottoms' color, on paper (Oct 28, 2026; DECISIONS-LOG #385, the founder's follow-up). No API
calls. Compares parts engine v15 without the candidate (cp8 = 0) with v15 plus COL-13 (cp8 = 0.5 on Color: the one outer
layer in the bottoms' color family, a top of another family between them). Same data, profiles and gold metrics as
hoodie_layer_paper.py (rule 7 there).

  /usr/bin/python3 tonal_layer_paper.py     writes results/tonal-layer/report.txt; exits 1 on any failed check
"""
import statistics as st
import sys
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import hoodie_layer_paper as H  # noqa: E402

P, RC, OUT = H.P, H.RC, HERE / "results" / "tonal-layer"
CP8 = "CP8_layer_tie_in"
CAND = {"cp8": 0.5}


def score(rd, occ="everyday", styles=None, cand=False, sl=None):
    return P.score_parts(rd, occ, styles or {}, sl, "a_little", engine="v15", tune=CAND if cand else {"cp8": 0.0})


def color(r):
    c = (r.get("parts") or {}).get("color") or {}
    return c.get("score")


G, top, outer, bottom, shoe, Rd, mod = H.G, H.top, H.outer, H.bottom, H.shoe, H.Rd, H.mod
OCT24 = H.json.loads(H.json.dumps(H.FIX["recheck"]))
for g in OCT24["garments"]:
    if g["subcategory"] == "tee":
        g["color_family"] = "blue"                                   # how the Oct 24 photo read the same tee
GREEN = outer("hoodie", "green", length="na", saturation="muted")
CARGO = bottom("cargos", "olive", "straight")
NTEE = top("tee", "navy")
BRUN = shoe("performance_runner", "black")
fires = lambda b, a: H.fired(a, CP8) and color(a) - color(b) == 0.5  # noqa: E731
quiet = lambda b, a: H.same(b, a)  # noqa: E731
# (id, what, reading, occasion, styles, bar, the bar in words): written before the run
OUTFITS = [
    ("T1", "his Oct 28 re-check: green hoodie over a navy tee, olive cargos, black runners", H.FIX["recheck"], "everyday", H.FOUNDER,
     lambda b, a: fires(b, a) and a["overall"] == 7.5, "Color +0.5, score stays 7.5"),
    ("T1b", "his Oct 28 first check (no hoodie)", H.FIX["first"], "everyday", H.FOUNDER, quiet, "unchanged"),
    ("T2", "his Oct 24 re-check (the tee read blue)", OCT24, "everyday", H.FOUNDER,
     lambda b, a: fires(b, a) and a["overall"] <= 7.5, "Color +0.5, not above 7.5"),
    ("T3", "a tan chore coat over a white tee, khaki chinos, brown boots", Rd(outer("chore_coat", "tan_camel", length="na"), RC.TEE,
     RC.CHINOS, RC.BOOTS), "everyday", None, fires, "Color +0.5"),
    ("T4", "a brown leather jacket over a cream tee, brown trousers, loafers", Rd(outer("leather_jacket", "brown"), top("tee", "off_white_cream"),
     bottom("trousers", "brown", "straight"), RC.LOAFER), "date", None, fires, "Color +0.5"),
    ("N1", "all one family: a green hoodie over a green tee, olive cargos", Rd(GREEN, top("tee", "green", saturation="muted"), CARGO, BRUN),
     "everyday", None, quiet, "unchanged (that's [COL-7]'s flat tonal, a tip)"),
    ("N2", "a denim jacket over a tee with jeans (denim never ties in)", Rd(outer("denim_jacket", "denim_mid"), NTEE, RC.DJEANS, RC.WLS),
     "everyday", None, quiet, "unchanged"),
    ("N3", "a black bomber over a white tee, black jeans", Rd(outer("bomber", "black"), RC.TEE, bottom("jeans", "black", "straight"), RC.WLS),
     "everyday", None, quiet, "unchanged"),
    ("N4", "a grey zip hoodie over a tee with grey jeans", Rd(outer("hoodie", "grey", length="na"), NTEE, bottom("jeans", "grey", "straight"),
     RC.WLS), "everyday", None, quiet, "unchanged"),
    ("N5", "a navy hoodie over a white tee with navy joggers (a matched set)", Rd(outer("hoodie", "navy", length="na"), RC.TEE,
     bottom("joggers", "navy", "straight"), RC.WLS), "class", None, quiet, "unchanged"),
    ("N6", "a green hoodie over a white tee with green joggers", Rd(GREEN, RC.TEE, bottom("joggers", "olive", "straight"), RC.WLS),
     "class", None, quiet, "unchanged (sweats)"),
    ("N7", "a bright green hoodie over a white tee with olive cargos", Rd(mod(GREEN, saturation="bright"), RC.TEE, CARGO, RC.WLS),
     "everyday", None, quiet, "unchanged (bright)"),
    ("N8", "a brown blazer over a white shirt with brown trousers", Rd(outer("blazer", "brown"), top("oxford_shirt", "white", tucked="full"),
     bottom("trousers", "brown", "straight"), RC.LOAFER), "date", None, quiet, "unchanged (tailoring)"),
    ("N9", "a color fault: a big red graphic tee (a loud print, [COL-8]) under the green hoodie, olive cargos",
     Rd(GREEN, top("graphic_tee", "red", pattern_scale="large", logo="large"), CARGO, RC.WLS), "everyday", None,
     lambda b, a: H.fired(b, "CL1_loud_print") and not H.fired(a, CP8), "no credit on top of a fault"),
    ("N9b", "taste note, no bar: a plain red tee under the green hoodie, olive cargos (no fault in the engine)",
     Rd(GREEN, top("tee", "red"), CARGO, RC.WLS), "everyday", None, lambda b, a: True, "reported only"),
    ("N10", "two layers: a bomber over the green hoodie", Rd(outer("bomber", "black"), GREEN, NTEE, CARGO, RC.WLS), "everyday", None, quiet,
     "unchanged"),
    ("N11", "a stained green hoodie", Rd(mod(GREEN, condition="stained"), NTEE, CARGO, RC.WLS), "everyday", None, quiet, "unchanged"),
    ("N12", "no layer: a green tee over olive cargos", Rd(top("tee", "green", saturation="muted"), CARGO, RC.WLS), "everyday", None, quiet,
     "unchanged"),
]


def main():
    lines = []

    def say(s=""):
        print(s)
        lines.append(s)

    fails = 0
    say("== The test outfits (bars written before the run); 'parts' = Proportions/Fit/Color/Shoes/Style ==")
    for oid, what, rd, occ, sty, bar, words in OUTFITS:
        b, a = score(rd, occ, sty), score(rd, occ, sty, True)
        ok = bool(bar(b, a))
        fails += not ok
        ps = lambda r: "/".join(f"{(r['parts'][k]['score'] or 0):g}" for k in P.PART_ORDER)  # noqa: E731
        say(f"  {oid:4s} {'PASS' if ok else 'FAIL'}  {b['overall']:g} -> {a['overall']:g} (raw {b['raw_score']:.3f} -> {a['raw_score']:.3f}; "
            f"parts {ps(b)} -> {ps(a)})  {what}  [bar: {words}]")
    say()
    moved = [c["id"] for c in RC.CASES if not H.same(score(c["reading"], c["occasion"], dict(c["styles"]), sl=c["second_look"]),
                                                    score(c["reading"], c["occasion"], dict(c["styles"]), True, c["second_look"]))]
    say(f"C1 conformance cases that move: {len(moved)} {moved}")
    runs, panel, founder, test = H.load_gold()
    Bs = {p: [score(rd, "everyday", H.PROFILE) for rd in rs] for p, rs in runs.items()}
    As = {p: [score(rd, "everyday", H.PROFILE, True) for rd in rs] for p, rs in runs.items()}
    gm = [p for p in runs if any(not H.same(x, y) for x, y in zip(Bs[p], As[p]))]
    say(f"== Gold set ({len(runs)} photos): {len(gm)} photos move (Color part or score) ==")
    for p in gm:
        say(f"     {p}: panel {panel.get(p, float('nan')):.1f}  {H.seq(Bs[p])} -> {H.seq(As[p])}   {H.desc(runs[p][0])}")

    def metr(S, ps):
        ps = [p for p in ps if p in panel and S[p][0]["overall"] is not None]
        app, pan = [S[p][0]["overall"] for p in ps], [panel[p] for p in ps]
        cpan = H.pearson([color(S[p][0]) or 7 for p in ps], pan)
        return H.pearson(app, pan), sum(abs(x - y) <= 0.5 for x, y in zip(app, pan)), cpan
    tp = [p for p in runs if p in test]
    (rb, wb, cb), (ra, wa, ca) = metr(Bs, tp), metr(As, tp)
    ok = ra >= rb - 0.03
    say(f"C2 held-out r {rb:.3f} -> {ra:.3f}, within 0.5 {wb} -> {wa} (Color part vs panel {cb:.3f} -> {ca:.3f}): {'PASS' if ok else 'FAIL'}")
    fails += not ok
    fp = [p for p in founder if p in runs and Bs[p][0]["overall"] is not None]
    wb2 = sum(abs(Bs[p][0]["overall"] - founder[p]) <= 0.5 for p in fp)
    wa2 = sum(abs(As[p][0]["overall"] - founder[p]) <= 0.5 for p in fp)
    say(f"C3 his {len(fp)} blind ratings within 0.5: {wb2} -> {wa2}: {'PASS' if wa2 >= wb2 else 'FAIL'}")
    fails += wa2 < wb2
    two = [p for p in runs if len(Bs[p]) >= 2 and all(x["overall"] is not None for x in Bs[p][:2])]
    sb = sum(abs(Bs[p][0]["overall"] - Bs[p][1]["overall"]) <= 0.5 for p in two)
    sa = sum(abs(As[p][0]["overall"] - As[p][1]["overall"]) <= 0.5 for p in two)
    say(f"C4 two runs within 0.5: {sb} -> {sa}: {'PASS' if sa >= sb else 'FAIL'}")
    fails += sa < sb
    jump = False
    for bn in ("athletic", "casual", "in-between", "dressy"):
        ps = [p for p in runs if H.band(runs[p][0]) == bn and Bs[p][0]["overall"] is not None]
        b8, a8 = sum(Bs[p][0]["overall"] >= 8 for p in ps), sum(As[p][0]["overall"] >= 8 for p in ps)
        say(f"    {bn:10s} n {len(ps):3d}  8+ {b8} -> {a8}")
        jump |= (a8 - b8) / max(1, len(ps)) > 0.03
    say(f"C5 no band's 8+ share rises by more than 3 points: {'PASS' if not jump else 'FAIL'}")
    fails += jump
    ph = H.load_phone()
    say(f"== His saved phone checks ({len(ph)}) ==")
    for k, v in sorted(ph.items(), key=lambda kv: kv[1]["at"] or 0):
        b, a = score(v["reading"], v["occ"], H.FOUNDER, sl=v["sl"]), score(v["reading"], v["occ"], H.FOUNDER, True, v["sl"])
        if b.get("overall") is not None and not H.same(a, b):
            say(f"  {k} {v['occ']:9s} {b['overall']:g} -> {a['overall']:g}  Color {color(b):g} -> {color(a):g}  {H.desc(v['reading'])}")
    say()
    say(f"{'ALL CHECKS PASS' if not fails else f'{fails} CHECK(S) FAIL'}")
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "report.txt").write_text("\n".join(lines) + "\n")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())

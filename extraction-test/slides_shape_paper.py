#!/usr/bin/env python3
"""Slides under a deliberate shape, on paper (Nov 11, 2026). No API calls.

The founder: a friend's "obviously good" streetwear fit got 7 out of 10, partly for wearing slides; he'd give it 8.5.
Today slides are charged three times in a streetwear fit: Shoes drops to 5.0 ([SHO-2], [SHO-13]), and they switch off
the streetwear shape ([STR-5], -1.0 Proportions) and "top to toe" ([STR-7]). An oversized tee, wide jeans and chunky
sneakers is 8.0; the same with slides 6.5; with the shoes cropped out 7.0. The gold panel (#224) flagged it: "the panel
docks the shoes but credits the shape".

Three what-ifs, each off in the live engine (parts_proto.py knobs; the app is untouched):
  V1  sk1_shape_ok:    slides no longer block the streetwear shape ([STR-5]); Shoes still charged as today
  V2  V1 + sk1_shape_soft 1.0: when any shape credit fired, slides get one more point back on Shoes (5.0 -> 6.0),
      never under a tailored jacket
  V3  V2 + sk1_shape_more: slides also stop blocking the hoodie layer ([PRO-17]) and the shorts shape ([PRO-15])
  V4  sk1_once (added after the first run showed V1-V3 can't reach the bar): slides are charged once, on Shoes. The
      clothes are judged as if the shoes were out of the photo, so slides can't switch off the look ("reads as"), a
      shape credit, or move the outfit's dressiness for the occasion; Shoes is scored as today and put back.
      Loungewear keeps its own rules; slides at an interview or event keep their 4.0 hold
  V5  V4 + sk1_shape_soft 1.0 (V2's extra point on Shoes when a shape credit fired)
  V6  V5 + sk1_shape_ok (added after the second run: the streetwear shape needs a street sneaker in view, so judging
      the clothes without the shoes lost it too; here slides, or the shoes set aside, can finish it). V4-V6 never
      apply when the clothes alone read as workwear, classic prep or smart casual (looks that never take slides: a rule
      test, [WRK-3], caught V6 calling a chore coat, jeans and slides workwear)

  /usr/bin/python3 slides_shape_paper.py     writes results/slides-shape/report.txt; exits 1 if V2 fails a bar

Data as hoodie_layer_paper.py (KITTED_DATA, default this checkout). Rule 7: gold photos are "profile unknown", one stated
test profile (Minimal + Smart casual, 0.5 each), Everyday; his own phone checks with his profile at their own occasion.
The test outfits are made-up readings. The bars below were written before the first run.
"""
import os
import statistics as st
import sys
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import hoodie_layer_paper as H  # noqa: E402  (its loaders and helpers)

P, RC = H.P, H.RC
OUT = HERE / "results" / "slides-shape"
V = {
    "today": {},
    "V1": {"sk1_shape_ok": True},
    "V2": {"sk1_shape_ok": True, "sk1_shape_soft": 1.0},
    "V3": {"sk1_shape_ok": True, "sk1_shape_soft": 1.0, "sk1_shape_more": True},
    "V4": {"sk1_once": True},
    "V5": {"sk1_once": True, "sk1_shape_soft": 1.0},
    "V6": {"sk1_once": True, "sk1_shape_soft": 1.0, "sk1_shape_ok": True},
}
MAIN = os.environ.get("MAIN", "V6")   # the version the bars and the exit code judge (V2 at the first run)


def score(rd, occ="everyday", styles=None, v="today", sl=None):
    return P.score_parts(rd, occ, styles or {}, sl, "a_little", engine="v15", tune=V[v] or None)


def has_slides(rd):
    return rd.get("scene", {}).get("shoes_visible", True) and any(
        g.get("subcategory") == "slides_sandals" for g in rd.get("garments", []))


top, outer, bottom, shoe, Rd, mod = RC.top, RC.outer, RC.bottom, RC.shoe, RC.Rd, RC.mod
GTEE4 = top("graphic_tee", "black", 4)
SL, CH = RC.SLIDES, RC.CHUNKY
STREET_SL = Rd(GTEE4, RC.WJEANS, SL)

# (id, what, reading, occasion, bar(today, after) -> bool, the bar in words). Bars are checked on V2.
OUTFITS = [
    ("O1", "oversized graphic tee + wide jeans + slides", STREET_SL, "everyday",
     lambda b, a: b == 6.5 and a >= 7.5, "6.5 today -> 7.5 or more"),
    ("O1c", "the same with chunky sneakers", Rd(GTEE4, RC.WJEANS, CH), "everyday",
     lambda b, a: b == a == 8.0, "unchanged 8.0 (slides stay below the right sneaker)"),
    ("O1g", "O1 going out", STREET_SL, "going_out",
     lambda b, a: a >= b and a <= 7.5, "not lower, at most 7.5"),
    ("O1i", "O1 at an interview", STREET_SL, "interview",
     lambda b, a: a == b and a <= 4.0, "unchanged, held to 4.0 or less"),
    ("O1d", "O1 with the jeans pooling on the slides", Rd(GTEE4, mod(RC.WJEANS, hem="pooling"), SL), "everyday",
     lambda b, a: a <= 7.5, "the drag still costs: at most O1's"),
    ("O2", "plain white tee + dark straight jeans + slides (no shape)", Rd(RC.TEE, RC.DJEANS, SL), "everyday",
     lambda b, a: a == b, "unchanged"),
    ("O3", "plain tee + relaxed shorts + slides (no shape)", Rd(top("tee", "white"), bottom("shorts", "navy", "relaxed", "na"), SL),
     "everyday", lambda b, a: a == b, "unchanged"),
    ("O4", "grey hoodie + grey relaxed sweatpants + slides at Class", Rd(top("hoodie", "grey"), bottom("sweatpants", "grey", "relaxed", "cuffed"), SL),
     "class", lambda b, a: a == b, "unchanged (loungewear keeps its hold)"),
    ("O5", "hoodie over a tee + wide jeans + slides", Rd(top("tee", "white"), outer("hoodie", "grey", 4), RC.WJEANS, SL), "everyday",
     lambda b, a: a >= b and a <= 8.0, "not lower, at most 8.0"),
    ("O6", "oversized tee + wide cargos + slides", Rd(top("tee", "black", 4), bottom("cargos", "olive", "wide"), SL), "everyday",
     lambda b, a: a > b, "rises"),
    ("O7", "blazer + tee + trousers + slides", Rd(top("tee", "white"), outer("blazer", "navy"), RC.TROUSERS, SL), "everyday",
     lambda b, a: a == b, "unchanged (never under tailoring)"),
]


def main():
    lines = []

    def say(s=""):
        print(s)
        lines.append(s)

    fails = 0
    say(f"== The test outfits (bars checked on {MAIN}, [V1..V6 p/F]; scores today / V1 / V2 / V3 / V4 / V5 / V6) ==")
    for oid, what, rd, occ, bar, words in OUTFITS:
        s = {v: score(rd, occ, None, v)["overall"] for v in V}
        ok = bar(s["today"], s[MAIN])
        fails += not ok
        each = "".join("p" if bar(s["today"], s[v]) else "F" for v in V if v != "today")
        row = " / ".join(f"{s[v]:g}" for v in V)
        say(f"  {oid:4s} {'PASS' if ok else 'FAIL'} [{each}]  {row}   "
            f"{what} ({occ}); bar: {words}")
    say()

    # ---- the conformance cases: only cases with slides in view may move
    for v in ("V1", "V2", "V3", "V4", "V5", "V6"):
        moved = [c for c in RC.CASES if not H.same(score(c["reading"], c["occasion"], dict(c["styles"]), "today", c["second_look"]),
                                                    score(c["reading"], c["occasion"], dict(c["styles"]), v, c["second_look"]))]
        stray = [c["id"] for c in moved if not has_slides(c["reading"])]
        ok = not stray
        fails += (not ok) and v == MAIN
        say(f"C1 {v} conformance cases ({len(RC.CASES)}): {len(moved)} move, {len(stray)} without slides: {'PASS' if ok else 'FAIL'}"
            + (f"  moved: {', '.join(c['id'] for c in moved)}" if moved else ""))
    say()
    if not (H.DATA / "extraction-test/results/gold1/raw.json").exists():
        say(f"No gold data under {H.DATA}; set KITTED_DATA to the main checkout.")
        return 1

    runs, panel, founder, test = H.load_gold()
    S = {v: {p: [score(rd, "everyday", H.PROFILE, v) for rd in rs] for p, rs in runs.items()} for v in V}
    say(f"== The gold set ({len(runs)} photos, 5-judge AI panel; profile unknown, one stated test profile, Everyday) ==")
    sp = [p for p in runs if has_slides(runs[p][0]) and p in panel and S["today"][p][0]["overall"] is not None]
    say(f"  the {len(sp)} photos with slides in view (run 1): today / V1..V6   panel   founder   pieces")
    for p in sorted(sp, key=lambda p: panel[p] - S["today"][p][0]["overall"], reverse=True):
        row = " / ".join(f"{S[v][p][0]['overall']:g}" for v in V)
        say(f"     {p:8s} {row}   {panel[p]:.1f}   {founder.get(p, '-')}   {H.desc(runs[p][0])}")
    for v in V:
        gaps = [abs(S[v][p][0]["overall"] - panel[p]) for p in sp]
        say(f"  {v:5s} slides photos: mean app {st.mean(S[v][p][0]['overall'] for p in sp):.2f} (panel "
            f"{st.mean(panel[p] for p in sp):.2f}); mean distance from the panel {st.mean(gaps):.2f}; within 0.5 "
            f"{sum(g <= 0.5 for g in gaps)}/{len(sp)}")
    gb = st.mean(abs(S["today"][p][0]["overall"] - panel[p]) for p in sp)
    ga = st.mean(abs(S[MAIN][p][0]["overall"] - panel[p]) for p in sp)
    ok = ga <= gb
    fails += not ok
    say(f"C2 {MAIN} on the slides photos is no further from the panel than today: {gb:.2f} -> {ga:.2f}: {'PASS' if ok else 'FAIL'}")

    for v in ("V1", "V2", "V3", "V4", "V5", "V6"):
        gm = [p for p in runs if any(not H.same(x, y) for x, y in zip(S["today"][p], S[v][p]))]
        stray = [p for p in gm if not any(has_slides(rd) for rd in runs[p])]
        ok = not stray
        fails += (not ok) and v == MAIN
        say(f"C3 {v}: gold photos that move on any run: {len(gm)}, without slides: {len(stray)}: {'PASS' if ok else 'FAIL'}")

    def metr(Sv, ps):
        ps = [p for p in ps if p in panel and Sv[p] and Sv[p][0]["overall"] is not None]
        app, pan = [Sv[p][0]["overall"] for p in ps], [panel[p] for p in ps]
        return len(ps), H.pearson(app, pan), sum(abs(x - y) <= 0.5 for x, y in zip(app, pan))
    for name, ps in (("all photos", list(runs)), ("held-out test half", [p for p in runs if p in test])):
        say(f"  {name:20s} " + "   ".join(f"{v} r {metr(S[v], ps)[1]:.3f} w0.5 {metr(S[v], ps)[2]}" for v in V))
    rb = metr(S["today"], [p for p in runs if p in test])[1]
    ra = metr(S[MAIN], [p for p in runs if p in test])[1]
    ok = ra >= rb - 0.03
    fails += not ok
    say(f"C4 {MAIN} held-out r doesn't drop by more than 0.03: {rb:.3f} -> {ra:.3f}: {'PASS' if ok else 'FAIL'}")

    fp = [p for p in founder if p in runs and S["today"][p][0]["overall"] is not None]
    fr = [founder[p] for p in fp]
    w = {v: sum(abs(S[v][p][0]["overall"] - founder[p]) <= 0.5 for p in fp) for v in V}
    ok = w[MAIN] >= w["today"]
    fails += not ok
    say(f"C5 the founder's {len(fp)} blind ratings, within 0.5: " + ", ".join(f"{v} {w[v]}" for v in V)
        + f"; r today {H.pearson([S['today'][p][0]['overall'] for p in fp], fr):.3f} -> {MAIN} "
          f"{H.pearson([S[MAIN][p][0]['overall'] for p in fp], fr):.3f}: {'PASS' if ok else 'FAIL'}")

    def steady(Sv):
        two = [p for p in Sv if len(Sv[p]) >= 2 and all(x["overall"] is not None for x in Sv[p][:2])]
        return sum(abs(Sv[p][0]["overall"] - Sv[p][1]["overall"]) <= 0.5 for p in two), len(two)
    sb, sa = steady(S["today"]), steady(S[MAIN])
    ok = sa[0] >= sb[0]
    fails += not ok
    say(f"C6 {MAIN} the two runs within 0.5: {sb[0]}/{sb[1]} -> {sa[0]}/{sa[1]}: {'PASS' if ok else 'FAIL'}")

    bands = {p: H.band(runs[p][0]) for p in runs}
    jump = False
    for bn in ("athletic", "casual", "in-between", "dressy"):
        ps = [p for p in runs if bands[p] == bn and S["today"][p][0]["overall"] is not None]
        if not ps:
            continue
        b8 = sum(S["today"][p][0]["overall"] >= 8 for p in ps)
        a8 = sum(S[MAIN][p][0]["overall"] >= 8 for p in ps)
        say(f"    {bn:10s} n {len(ps):3d}  8+ {b8} -> {a8}")
        jump |= (a8 - b8) / len(ps) > 0.03
    fails += jump
    say(f"C7 {MAIN} no dressiness band's 8+ share rises by more than 3 points: {'PASS' if not jump else 'FAIL'}")
    say()

    ph = H.load_phone()
    say(f"== His saved phone checks ({len(ph)}, every pull; his profile, their own occasion and second look) ==")
    mv = 0
    for k, v in sorted(ph.items(), key=lambda kv: kv[1]["at"] or 0):
        s = {x: score(v["reading"], v["occ"], H.FOUNDER, x, v["sl"]) for x in V}
        if s["today"].get("overall") is None or all(H.same(s["today"], s[x]) for x in V):
            continue
        mv += 1
        say(f"  {k} {v['occ']:9s} " + " / ".join(f"{s[x]['overall']:g}" for x in V) + f"   {H.desc(v['reading'])}")
    say(f"  saved checks that move under any version: {mv}")
    say()
    say(f"{MAIN}: {'ALL CHECKS PASS' if not fails else f'{fails} CHECK(S) FAIL'}")
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "report.txt").write_text("\n".join(lines) + "\n")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())

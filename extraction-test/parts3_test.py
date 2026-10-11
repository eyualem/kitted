#!/usr/bin/env python3
"""Streetwear pass paper test (Oct 10): the parts engine v2 (parts-proto-2) vs v3 (parts-proto-3 = v2 + PR4 "the
streetwear shape"). No API calls, no money. Nothing in rubric.py, the fixtures or app/ changes.

  /usr/bin/python3 parts3_test.py     -> results/parts3/analysis.txt + analysis.json
                                         (report: ../rubric/research/parts/streetwear-pass.md)

Same readings and loaders as parts2_test.py (which imports parts_test.py): the 78-reading corpus, the newest phone
pull, batch 1 arm A (+ look1 for the second look) for steadiness, zoom1 arm B as the design set, the judge pilot with
the SAME split as v2 (read from results/parts2/split.json and checked against parts2_test.make_split).
New here: the style council's anchor and look-alike outfits (rubric/research/style-council/cases.json; made-up
readings, no person in them), because the photo sets hold almost no deliberate streetwear outfit; what-if edits of
the founder's own black tee reading; and PR4's fire rate on every multi-run reading set.

Rule 7: the founder is profile pending; his friends are profile unknown; 703a8b and ebe23f are unknown (ask the
founder); stock and web photos are profile unknown; the council cases are made-up readings with no person. Everything
is scored with ONE stated test profile: picks Minimal + Smart casual (0.5 each), boldness "a little", no age. No engine
lets picks or age move a number, so no split by age band or picked look is possible.
"""
import copy
import json
import statistics as st
import sys
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
K = HERE.parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rubrics"))
import rubric as R  # noqa: E402  v4.1
import parts_proto as P  # noqa: E402
import parts_test as T  # noqa: E402
import parts2_test as Q  # noqa: E402  loaders, split, fixes, stats helpers

OUT = HERE / "results" / "parts3"
ENGINES = ("v2", "v3")
LINES = []
CASES = K / "rubric/research/style-council/cases.json"
STYLE_OF_GROUP = {"anchor-streetwear": "streetwear", "anchor-vintage": "vintage sport", "anchor-workwear": "workwear",
                  "anchor-smart-casual": "smart casual", "anchor-minimal": "minimal", "anchor-prep": "classic prep",
                  "anchor-outdoor": "outdoor", "lookalike": "look-alike"}


def say(s=""):
    LINES.append(s)
    print(s)


def score(reading, occ, sl=None, engine="v3", tune=None, styles=None, bold=None):
    return P.score_parts(reading, occ, styles if styles is not None else Q.PROFILE, sl, bold or Q.BOLD, engine=engine,
                         tune=tune)


def checks_of(r):
    return [x["check"] for pk in P.PART_ORDER for x in (r.get("parts", {}).get(pk) or {}).get("reasons", [])]


def label_of(r):
    lab = r.get("style_label")
    return R.STYLE_NAMES[lab] if lab else "no style"


def g_of(rd, cat):
    return next((g for g in rd.get("garments", []) if g.get("category") == cat), None)


# ---------------------------------------------------------------------------------------------------- what-ifs
def set_shoe(sub, color="white"):
    def fn(gs):
        for g in gs:
            if g.get("category") == "footwear":
                if g.get("subcategory") == sub:
                    return False
                g.update({"subcategory": sub, "color_family": color, "condition": "clean", "certainty": "clear",
                          "pattern": "solid"})
                return True
        return False
    return fn


def fix_slides_chunky(gs):
    for g in gs:
        if g.get("category") == "footwear" and g.get("subcategory") == "slides_sandals":
            return set_shoe("chunky_sneaker")(gs)
    return False


def fix_street_shoe(gs):
    """Street-sneaker swap: plain white leather sneakers -> white chunky sneakers (streetwear's own shoe)."""
    for g in gs:
        if g.get("category") == "footwear" and g.get("subcategory") == "white_leather_sneaker":
            return set_shoe("chunky_sneaker")(gs)
    return False


FIXES = Q.FIXES + [("slides -> chunky sneakers", fix_slides_chunky),
                   ("white leather -> chunky sneakers (street shoe)", fix_street_shoe)]


def ladder_variants(rd):
    """What-if edits of one reading (the founder's black tee + wide jeans + white leather sneakers)."""
    def ed(fn):
        r = copy.deepcopy(rd)
        fn(r["garments"])
        return r

    def top(**kw):
        def fn(gs):
            for g in gs:
                if g.get("category") == "top":
                    g.update(kw)
                    return True
        return fn

    def both(*fns):
        def fn(gs):
            for f in fns:
                f(gs)
        return fn
    graphic = top(subcategory="graphic_tee", pattern="graphic", color_family="black")
    return [
        ("as read: black tee (boxy, to the fly), black wide jeans, white leather sneakers", rd),
        ("tee tucked", ed(top(tucked="full"))),
        ("shoes -> white chunky sneakers", ed(set_shoe("chunky_sneaker"))),
        ("shoes -> basketball sneakers (white)", ed(set_shoe("basketball_sneaker"))),
        ("shoes -> canvas (skate) sneakers (black)", ed(set_shoe("canvas_sneaker", "black"))),
        ("tee -> graphic tee", ed(graphic)),
        ("graphic tee + chunky sneakers", ed(both(graphic, set_shoe("chunky_sneaker")))),
        ("tee read regular (volume 3) + chunky sneakers", ed(both(top(volume=3), set_shoe("chunky_sneaker")))),
        ("tee read below the fly (long) + chunky sneakers", ed(both(top(length="below_crotch"), set_shoe("chunky_sneaker")))),
        ("jeans pooling + chunky sneakers", ed(both(lambda gs: [g.update(hem="pooling") for g in gs
                                                                if g.get("category") == "bottom"],
                                                    set_shoe("chunky_sneaker")))),
    ]


# ---------------------------------------------------------------------------------------------------- main
def main():
    OUT.mkdir(parents=True, exist_ok=True)
    prim, B1, B1L, U, L, Z = Q.load()
    res = {"profile": "test profile: picks Minimal + Smart casual (0.5 each), boldness a little, no age",
           "engines": {e: P.VERSIONS[e] for e in ENGINES},
           "tune_v3_added": {k: (sorted(v) if isinstance(v, frozenset) else v) for k, v in P.TUNE["v3"].items()
                             if k not in P.TUNE["v2"] or P.TUNE["v2"][k] != v}}
    say(f"STREETWEAR PASS PAPER TEST · v2 = {P.VERSIONS['v2']} · v3 = {P.VERSIONS['v3']} (v2 + PR4 the streetwear shape)")
    say(f"  {res['profile']}. Rule 7: founder profile pending; friends profile unknown; 703a8b and ebe23f unknown "
        f"(ask the founder); stock/web profile unknown; council cases are made-up readings with no person.")
    say(f"  v3's changes from v2: {res['tune_v3_added']}")

    rows = {}
    for k, v in prim.items():
        sl = T.second_look_for(k, U, L)
        r = {"who": T.who(k), "occ": v["occ"], "v4": Q.v4(v["reading"], v["occ"])}
        for e in ENGINES:
            r[e] = score(v["reading"], v["occ"], sl, e)
        rows[k] = r
    sel = [k for k, r in rows.items() if r["v4"] is not None and all(r[e]["overall"] is not None for e in ENGINES)]

    # ======================== (0) the same split as v2
    jp = [x for x in Q.load_panel() if x["key"] in rows]
    saved = json.load(open(HERE / "results/parts2/split.json"))
    half = {pid: v["half"] for pid, v in saved["photos"].items()}
    remade, _ = Q.make_split(jp)
    assert remade == half, "the judge-pilot split differs from results/parts2/split.json"
    say(f"\n(0) JUDGE-PILOT SPLIT: the same as v2 (results/parts2/split.json, seed {saved['seed']}; re-made and "
        f"checked identical): tuning {saved['counts']['tune']} · held-out {saved['counts']['held']}")

    # ======================== (1) which photos moved
    say("\n(1) PHOTOS THAT MOVE v2 -> v3 (one reading per photo, its own occasion)")
    moved = [k for k in sel if rows[k]["v3"]["overall"] != rows[k]["v2"]["overall"]]
    raw_moved = [k for k in sel if rows[k]["v3"]["raw_score"] != rows[k]["v2"]["raw_score"]]
    pr4 = [k for k in sel if "PR4_street_shape" in checks_of(rows[k]["v3"])]
    say(f"  shown score moves on {len(moved)}/{len(sel)}; raw score moves on {len(raw_moved)}; PR4 fires on {len(pr4)}: "
        + (", ".join(pr4) or "none"))
    for k in moved:
        say(f"    {k} {rows[k]['v2']['overall']} -> {rows[k]['v3']['overall']} | {P.card_row(rows[k]['v3'])}")
    res["moved"] = moved
    res["pr4_corpus"] = pr4

    # near misses: streetwear-detected photos and why PR4 doesn't fire
    say("  photos that read as streetwear (any detected) and what PR4 needs that they lack:")
    res["street_photos"] = []
    for k in sorted(sel):
        r3 = rows[k]["v3"]
        if "streetwear" not in r3["detected_styles"]:
            continue
        rd = prim[k]["reading"]
        gs = R.scored_garments(rd)
        top = next((g for g in gs if g.get("category") == "top"), None)
        out = next((g for g in gs if g.get("category") == "outerwear"), None)
        bot = next((g for g in gs if g.get("category") == "bottom"), None)
        sh = next((g for g in gs if g.get("category") == "footwear"), None)
        why = []
        if out is not None:
            why.append(f"a layer ({out.get('subcategory')})")
        if top is not None and (top.get("volume") or 3) < 4:
            why.append(f"top read volume {top.get('volume')}")
        if bot is not None and bot.get("subcategory") not in ("jeans", "cargos"):
            why.append(f"{bot.get('subcategory')} (lounge)")
        if bot is not None and bot.get("leg_shape") not in R.LOOSE:
            why.append(f"leg read {bot.get('leg_shape')}")
        if top is not None and top.get("tucked") not in (None, "none", "na"):
            why.append("top tucked")
        if top is not None and top.get("length") not in ("cropped", "at_belt", "mid_fly"):
            why.append(f"top length {top.get('length')}")
        if bot is not None and bot.get("hem") == "pooling":
            why.append("pooling hem")
        if sh is None or sh.get("subcategory") not in P.TUNE["v3"]["pr4_shoes"]:
            why.append(f"shoe {sh.get('subcategory') if sh else 'not in view'}")
        line = {"key": k, "who": T.WHO_TEXT[rows[k]["who"]], "v2": rows[k]["v2"]["overall"],
                "v3": r3["overall"], "lacks": why}
        res["street_photos"].append(line)
        say(f"    {k:26s} {line['who']:30s} v3 {r3['overall']} · lacks: {'; '.join(why) or '-'}")

    # ======================== (2) spread, overall and by detected style
    say("\n(2) SCORE SPREAD (one reading per photo, its own occasion)")
    res["spread"] = {}
    groups = [("all photos", lambda k: True), ("founder (profile pending)", lambda k: rows[k]["who"] == "founder"),
              ("friends (profile unknown)", lambda k: rows[k]["who"] == "friend"),
              ("unknown (ask)", lambda k: rows[k]["who"] == "unknown"),
              ("web mirror (profile unknown)", lambda k: rows[k]["who"] == "web"),
              ("stock (profile unknown)", lambda k: rows[k]["who"] == "stock")]
    for gname, f in groups:
        ks = [k for k in sel if f(k)]
        res["spread"][gname] = {}
        for e in ENGINES:
            line, b = Q.band_line(f"{gname} · {e}", [rows[k][e]["overall"] for k in ks])
            say(line); res["spread"][gname][e] = b
    say("  by the card's style label (v3's label; 'streetwear detected' counts any photo where streetwear is among the "
        "detected styles):")
    res["by_style"] = {}
    labs = sorted({label_of(rows[k]["v3"]) for k in sel})
    for lab in labs + ["streetwear detected"]:
        ks = [k for k in sel if (label_of(rows[k]["v3"]) == lab if lab != "streetwear detected"
                                 else "streetwear" in rows[k]["v3"]["detected_styles"])]
        res["by_style"][lab] = {}
        for e in ENGINES:
            vals = [rows[k][e]["overall"] for k in ks]
            b = Q.bands(vals)
            top8 = [k for k in ks if rows[k][e]["overall"] >= 8]
            res["by_style"][lab][e] = {"n": b["n"], "median": b["median"], "8+": b["8+"], "max": max(vals),
                                       "eights": top8}
            say(f"    {lab:20s} {e} n={b['n']:2d} median {b['median']} max {max(vals)} 8+ {b['8+']}"
                + (f" ({', '.join(top8)})" if top8 else ""))

    # ======================== (3) steadiness
    say("\n(3) 3-RUN STEADINESS (Everyday, the test profile)")
    res["steady"] = {}

    def steady_set(runsets, with_sl, label, lit=None, tune=None):
        per = defaultdict(dict)
        for k, runs in runsets.items():
            runs = runs[:3]
            if lit is not None:
                if k not in lit or len(lit[k]) < 3:
                    continue
                runs = [Q.with_lightness(j, lit[k][i]) for i, j in enumerate(runs)]
            for e in ENGINES:
                per[k][e] = [score(j, "everyday", T.second_look_for(k, U, L, i) if with_sl else None, e,
                                   tune if e == "v3" else None)["overall"] for i, j in enumerate(runs)]
        out = {}
        for e in ENGINES:
            vals = [per[k][e] for k in per if None not in per[k][e] and len(per[k][e]) == 3]
            med = sum(1 for v in vals if all(abs(x - st.median(v)) <= 0.5 for x in v))
            rng_ = sum(1 for v in vals if max(v) - min(v) <= 0.5)
            ex = sum(1 for v in vals if len(set(v)) == 1)
            sp = [max(v) - min(v) for v in vals]
            out[e] = {"within_0.5_of_median": [med, len(vals)], "range_le_0.5": [rng_, len(vals)],
                      "exact": [ex, len(vals)], "mean_spread": round(st.mean(sp), 3), "worst": max(sp)}
        diff = [k for k in per if per[k]["v2"] != per[k]["v3"]]
        out["v3_differs_from_v2_on"] = {k: per[k] for k in diff}
        say(f"  {label}")
        for e in ENGINES:
            o = out[e]
            say(f"    {e} within 0.5 of median {o['within_0.5_of_median'][0]}/{o['within_0.5_of_median'][1]} · "
                f"max-min <= 0.5 {o['range_le_0.5'][0]}/{o['range_le_0.5'][1]} · exact {o['exact'][0]}/{o['exact'][1]} · "
                f"mean spread {o['mean_spread']} · worst {o['worst']}")
        say(f"    photos where any v3 run differs from v2: {len(diff)}" + (": " + "; ".join(
            f"{k} v2 {per[k]['v2']} v3 {per[k]['v3']}" for k in diff) if diff else ""))
        return out

    res["steady"]["b1_A"] = steady_set(B1, True, "batch 1 arm A (validation), second look run i paired")
    res["steady"]["zoom1_B"] = steady_set(Z, False, "zoom1 + zoom1-stock arm B (design set)")
    res["steady"]["b1_A_lightness"] = steady_set(B1, True, "batch 1 arm A + lightness from arm B1 run i", lit=B1L)

    # PR4 fire rate on every multi-run reading set
    say("  PR4 on every multi-run reading set (photos where it fires in any run / photos where it fires in some but "
        "not all runs):")
    res["pr4_fire"] = {}
    for path in ("results/b1/raw.json", "results/zoom1/raw.json", "results/zoom1-stock/raw.json"):
        raw = json.load(open(HERE / path))
        for arm in sorted({x["arm"] for x in raw}):
            by = T.load_runs(HERE / path, arm)
            fires, flips, nread = [], [], 0
            for k, runs in by.items():
                hit = []
                for j in runs[:3]:
                    if not j:
                        continue
                    r = score(j, "everyday", None, "v3")
                    if r["overall"] is None:
                        continue
                    nread += 1
                    hit.append("PR4_street_shape" in checks_of(r))
                if any(hit):
                    fires.append(k)
                    if not all(hit):
                        flips.append(k)
            nm = f"{path.split('/')[1]} {arm}"
            res["pr4_fire"][nm] = {"photos": len(by), "readings": nread, "fires": fires, "flips": flips}
            say(f"    {nm:16s} photos {len(by):2d} · readings {nread:3d} · fires on {len(fires)} · flips {len(flips)}"
                + (f" ({', '.join(fires)})" if fires else ""))

    # ======================== (4) judge pilot
    say("\n(4) AGAINST THE JUDGE PILOT (panel = median of the 5 judges' weighted totals), same split as v2")
    res["judge"] = {}
    for side, label in (("all", "all 59"), ("tune", "TUNING half"), ("held", "HELD-OUT half")):
        xs = [x for x in jp if side == "all" or half[x["id"]] == side]
        res["judge"][side] = {}
        for e in ENGINES:
            o = Q.cmp_stats([(rows[x["key"]][e]["overall"], x["panel"]) for x in xs])
            res["judge"][side][e] = o
            say(f"  {label:14s} {e} {Q.fmt_cmp(o)}")
    jm = [x for x in jp if rows[x["key"]]["v3"]["overall"] != rows[x["key"]]["v2"]["overall"]]
    say(f"  panel photos v3 moved: {len(jm)}" + (": " + ", ".join(x["id"] for x in jm) if jm else ""))
    res["judge"]["moved"] = [x["id"] for x in jm]
    say("  streetwear-detected panel photos (v3 label, panel, v2, v3):")
    for x in sorted(jp, key=lambda x: x["id"]):
        r = rows[x["key"]]
        if "streetwear" in r["v3"]["detected_styles"]:
            say(f"    {x['id']} {half[x['id']]:4s} {x['key']:24s} {label_of(r['v3']):12s} panel {x['panel']} · v2 "
                f"{r['v2']['overall']} · v3 {r['v3']['overall']}")

    # ======================== (5) his, his friends' and the unknowns' checks
    say("\n(5) EVERY CHECK OF THE FOUNDER, HIS FRIENDS AND THE TWO UNKNOWNS (own occasion): v2 -> v3")
    res["checks"] = []
    mine = sorted([k for k in rows if rows[k]["who"] in ("founder", "friend", "unknown")],
                  key=lambda k: (rows[k]["who"] != "friend", rows[k]["who"], k))
    for k in mine:
        r = rows[k]
        line = {"key": k, "who": T.WHO_TEXT[r["who"]], "occ": r["occ"], "v2": r["v2"]["overall"],
                "v3": r["v3"]["overall"], "v3_row": P.card_row(r["v3"]), "v3_raw": r["v3"]["raw_score"],
                "label": label_of(r["v3"]), "v3_lowest": r["v3"]["lowest"]["line"]}
        res["checks"].append(line)
        say(f"  {k:16s} [{line['who']}; {r['occ']}; {line['label']}] v2 {line['v2']} -> v3 {line['v3']} (raw "
            f"{line['v3_raw']}) | {line['v3_row']}")
    tg = {x["key"]: x for x in res["checks"]}
    targets = [
        ("the friend's blazer d1967f at 7 or below", tg["phone-d1967f"]["v3"] <= 7.0),
        ("the chore coat (e438d4, f4870b, fb0b17) at 7-7.5",
         all(7.0 <= tg[k]["v3"] <= 7.5 for k in ("phone-e438d4", "phone-f4870b", "phone-fb0b17"))),
        ("his gingham fits at or below v2 (5a9049, 7f14a4, f07193)",
         all(tg[k]["v3"] <= tg[k]["v2"] for k in ("phone-5a9049", "phone-7f14a4", "phone-f07193"))),
        ("his black tee + wide jeans + white leather sneakers (8ad378, 403ade) at 7",
         all(tg[k]["v3"] == 7.0 for k in ("phone-8ad378", "phone-403ade"))),
    ]
    say("  targets:")
    res["targets"] = []
    for name, ok in targets:
        res["targets"].append({"target": name, "met": ok})
        say(f"    [{'met' if ok else 'NOT MET'}] {name}")

    # ======================== (6) fixes
    say("\n(6) CAN A FIX LIFT A FIT? The engine's own edits on every reading where the fix applies (v2 vs v3)")
    res["fixes"] = {}
    for name, fn in FIXES:
        out = []
        for k in sorted(sel):
            rd = Q.edit(prim[k]["reading"], fn)
            if rd is None:
                continue
            sl = T.second_look_for(k, U, L)
            a = {e: score(rd, prim[k]["occ"], sl, e) for e in ENGINES}
            if a["v2"]["overall"] is None:
                continue
            out.append({"key": k, "who": rows[k]["who"], **{e: [rows[k][e]["overall"], a[e]["overall"]] for e in ENGINES},
                        "v3_after_row": P.card_row(a["v3"]), "v3_pr4": "PR4_street_shape" in checks_of(a["v3"])})
        res["fixes"][name] = out
        n = len(out)
        up = {e: sum(1 for x in out if x[e][1] > x[e][0]) for e in ENGINES}
        dn = {e: sum(1 for x in out if x[e][1] < x[e][0]) for e in ENGINES}
        gain = {e: round(st.mean(x[e][1] - x[e][0] for x in out), 2) if out else 0 for e in ENGINES}
        say(f"  {name}: applies to {n} · shown score up v2 {up['v2']}/{n} · v3 {up['v3']}/{n} · down v2 {dn['v2']} · "
            f"v3 {dn['v3']} · mean lift v2 {gain['v2']:+} · v3 {gain['v3']:+} · PR4 fires after the fix on "
            f"{sum(1 for x in out if x['v3_pr4'])}")
        for x in out:
            if x["who"] in ("founder", "friend", "unknown") or x["v3"] != x["v2"]:
                say(f"      {x['key']:24s} {T.WHO_TEXT[x['who']]:30s} v2 {x['v2'][0]} -> {x['v2'][1]} · v3 {x['v3'][0]} -> "
                    f"{x['v3'][1]} · {x['v3_after_row']}")

    # ======================== (7) the style council's anchors and look-alikes (made-up readings, no person)
    say("\n(7) THE STYLE COUNCIL'S OUTFITS (cases.json; made-up readings, no person; each case's own occasion, "
        "picks and boldness). 'adv' = the advocate's expected score on the v4 scale, where a plain fit was 7.5")
    cases = [x for x in json.load(open(CASES)) if x["group"] in STYLE_OF_GROUP]
    res["council"] = []
    by = defaultdict(list)
    for x in cases:
        picks = {s: w for s, w in (x.get("styles_picked") or {}).items()}
        rr = {e: score(x["reading"], x["occasion"], None, e, styles=picks, bold=x.get("boldness", "a_little"))
              for e in ENGINES}
        if rr["v2"]["overall"] is None:
            continue
        e_ = x["expect"]
        adv = e_.get("score", e_.get("score_range"))
        line = {"id": x["id"], "style": STYLE_OF_GROUP[x["group"]], "adv": adv,
                **{e: rr[e]["overall"] for e in ENGINES}, "v3_raw": rr["v3"]["raw_score"],
                "v3_row": P.card_row(rr["v3"]), "v3_label": label_of(rr["v3"]),
                "v3_pr4": "PR4_street_shape" in checks_of(rr["v3"])}
        res["council"].append(line)
        by[line["style"]].append(line)
        mark = " <- PR4" if line["v3_pr4"] else ""
        say(f"  {line['style'][:12]:12s} {x['id'][:36]:36s} adv {str(adv):11s} v2 {line['v2']} v3 {line['v3']} "
            f"({line['v3_label']}) | {line['v3_row']}{mark}")
    say("  per style: n · best v2 / v3 · 8+ v2 / v3 · Spearman-free check: the advocate's top fit vs v3's top")
    res["council_by_style"] = {}
    for sty, ls in by.items():
        b2 = max(l["v2"] for l in ls)
        b3 = max(l["v3"] for l in ls)
        e2 = sum(1 for l in ls if l["v2"] >= 8)
        e3 = sum(1 for l in ls if l["v3"] >= 8)
        res["council_by_style"][sty] = {"n": len(ls), "best_v2": b2, "best_v3": b3, "8+_v2": e2, "8+_v3": e3}
        say(f"    {sty:14s} n={len(ls):2d} best {b2} / {b3} · 8+ {e2} / {e3}")

    # ======================== (8) his black tee outfit: what it takes (what-if edits of his own reading)
    say("\n(8) HIS BLACK TEE + WIDE JEANS + WHITE LEATHER SNEAKERS (8ad378; the founder, profile pending; class): "
        "what-if edits of his own reading")
    res["ladder"] = []
    for k in ("phone-8ad378", "phone-403ade"):
        for name, rd in ladder_variants(prim[k]["reading"]):
            rr = {e: score(rd, prim[k]["occ"], T.second_look_for(k, U, L), e) for e in ENGINES}
            res["ladder"].append({"key": k, "variant": name, **{e: rr[e]["overall"] for e in ENGINES},
                                  "v3_raw": rr["v3"]["raw_score"], "v3_row": P.card_row(rr["v3"])})
            say(f"  {k[6:]} {name:68s} v2 {rr['v2']['overall']} · v3 {rr['v3']['overall']} (raw {rr['v3']['raw_score']}) "
                f"| {P.card_row(rr['v3'])}")
    # m01: the web photo's description says relaxed jeans; the reading says straight on 6 of 6 runs
    k = "mirror-m01"
    rd = copy.deepcopy(prim[k]["reading"])
    for g in rd["garments"]:
        if g.get("category") == "bottom":
            g["leg_shape"] = "relaxed"
    rr = {e: score(rd, prim[k]["occ"], None, e) for e in ENGINES}
    res["m01_true_leg"] = {e: rr[e]["overall"] for e in ENGINES} | {"v3_row": P.card_row(rr["v3"])}
    say(f"  web m01 (graphic tee, Dunks; profile unknown; stylist estimate 7.5) as read (straight jeans): v2 "
        f"{rows[k]['v2']['overall']} · v3 {rows[k]['v3']['overall']}; with the relaxed leg its description gives: v2 "
        f"{rr['v2']['overall']} · v3 {rr['v3']['overall']} | {P.card_row(rr['v3'])}")

    # ======================== (9) ablations on v3
    say("\n(9) ABLATIONS on v3 (corpus 8+; b1 A steadiness; judge within 0.5 tune / held; council 8+ by style; his black "
        "tee 8ad378 / its chunky-sneaker swap)")
    STREET5 = P.TUNE["v3"]["pr4_shoes"]
    variants = {
        "v2 (no PR4)": {"pr4": 0.0},
        "v3 as built (PR4 +1.0, 5 street shoes)": {},
        "PR4 +0.5": {"pr4": 0.5},
        "PR4 +1.5": {"pr4": 1.5},
        "shoes: chunky/basketball only": {"pr4_shoes": frozenset({"chunky_sneaker", "basketball_sneaker"})},
        "shoes: + white leather": {"pr4_shoes": STREET5 | {"white_leather_sneaker"}},
        "+ graphic print as streetwear's standout (H4)": {"h4_graphic_street": True},
        "SW2 (chunky carries the wide leg) +1.0": {"sw2": 1.0},
        "legs: straight too": {"pr4_legs": ("straight", "relaxed", "wide")},
        "tops: hoodie/sweatshirt/graphic tee at volume 3 (chunky/basketball)": {"pr4_signature_v3": True},
    }
    res["ablations"] = {}
    tee_chunky = Q.edit(prim["phone-8ad378"]["reading"], fix_street_shoe)
    for name, tn in variants.items():
        vals = [score(prim[k]["reading"], prim[k]["occ"], T.second_look_for(k, U, L), "v3", tn)["overall"] for k in sel]
        b = Q.bands(vals)
        hs = []
        for k, runs in B1.items():
            v = [score(j, "everyday", T.second_look_for(k, U, L, i), "v3", tn)["overall"] for i, j in enumerate(runs[:3])]
            if None not in v:
                hs.append(all(abs(x - st.median(v)) <= 0.5 for x in v))
        jj = {}
        for side in ("tune", "held"):
            jj[side] = Q.cmp_stats([(score(prim[x["key"]]["reading"], prim[x["key"]]["occ"],
                                           T.second_look_for(x["key"], U, L), "v3", tn)["overall"], x["panel"])
                                    for x in jp if half[x["id"]] == side])
        c8 = Counter()
        for x in cases:
            r = score(x["reading"], x["occasion"], None, "v3", tn, styles=dict(x.get("styles_picked") or {}),
                      bold=x.get("boldness", "a_little"))
            if r["overall"] is not None and r["overall"] >= 8:
                c8[STYLE_OF_GROUP[x["group"]]] += 1
        tee = score(prim["phone-8ad378"]["reading"], "class", T.second_look_for("phone-8ad378", U, L), "v3", tn)["overall"]
        tee_c = score(tee_chunky, "class", T.second_look_for("phone-8ad378", U, L), "v3", tn)["overall"]
        s = {"8+": b["8+"], "pct8": b["pct8"], "b1_steady": [sum(hs), len(hs)], "tune": jj["tune"], "held": jj["held"],
             "council_8plus": dict(c8), "8ad378": tee, "8ad378_chunky": tee_c}
        res["ablations"][name] = s
        say(f"  {name:48s} corpus 8+ {s['8+']} ({s['pct8']}%) · b1 {s['b1_steady'][0]}/{s['b1_steady'][1]} · tune "
            f"{jj['tune']['mean_diff']:+.2f}/{jj['tune']['within_0.5']} · held {jj['held']['mean_diff']:+.2f}/"
            f"{jj['held']['within_0.5']} · council 8+ {dict(sorted(c8.items()))} · 8ad378 {tee} / chunky {tee_c}")
    # which photos each not-adopted variant moves (one reading per photo)
    say("  photos each variant moves against v3 as built (one reading per photo):")
    res["ablation_moves"] = {}
    for name, tn in variants.items():
        mv = []
        for k in sel:
            a = score(prim[k]["reading"], prim[k]["occ"], T.second_look_for(k, U, L), "v3", tn)["overall"]
            if a != rows[k]["v3"]["overall"]:
                pan = next((x["panel"] for x in jp if x["key"] == k), None)
                mv.append(f"{k} {rows[k]['v3']['overall']}->{a}" + (f" (panel {pan})" if pan is not None else ""))
        res["ablation_moves"][name] = mv
        if mv:
            say(f"    {name}: " + "; ".join(mv))

    (OUT / "analysis.txt").write_text("\n".join(LINES) + "\n")
    json.dump(res, open(OUT / "analysis.json", "w"), indent=1, default=lambda o: sorted(o) if isinstance(o, (set, frozenset)) else str(o))


if __name__ == "__main__":
    main()

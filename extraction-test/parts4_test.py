#!/usr/bin/env python3
"""Style fairness paper test (Oct 11): parts engine v3 (parts-proto-3, the default) vs v4 (parts-proto-4, opt-in:
v3 + PR5 the workwear shape, PR6 the outdoor shape, and the track jacket as a short layer). No API calls, no money.
Nothing in rubric.py, the fixtures or app/ changes.

  /usr/bin/python3 parts4_test.py     -> results/parts4/analysis.txt + analysis.json
                                         (report: ../rubric/research/parts/style-fairness.md)

Same readings, loaders and split as parts3_test.py / parts2_test.py.

Rule 7: the founder is profile pending (no birth year or picked looks given yet); his friends are profile unknown;
703a8b and ebe23f are unknown (ask the founder); stock and web photos are profile unknown; the council cases are made-up
readings with no person (each scored with the picks and boldness written in the case). Real photos are scored with ONE
stated test profile: picks Minimal + Smart casual (0.5 each), boldness "a little", no age. No engine lets picks or age
move a number, so no split by age band or picked look is possible; section (9) shows what the picks DO change today
(the "Reads as" label) as input to the picks proposal.
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
import parts2_test as Q  # noqa: E402
import parts3_test as S3  # noqa: E402

OUT = HERE / "results" / "parts4"
ENGINES = ("v3", "v4")
NEW = ("PR5_workwear_shape", "PR6_outdoor_shape")
LINES = []
CASES = K / "rubric/research/style-council/cases.json"
STYLE_OF_GROUP = S3.STYLE_OF_GROUP
STYLE_ORDER = ["streetwear", "workwear", "vintage sport", "outdoor", "minimal", "classic prep", "smart casual"]


def say(s=""):
    LINES.append(s)
    print(s)


def score(reading, occ, sl=None, engine="v4", tune=None, styles=None, bold=None):
    return P.score_parts(reading, occ, styles if styles is not None else Q.PROFILE, sl, bold or Q.BOLD, engine=engine,
                         tune=tune)


checks_of = S3.checks_of
label_of = S3.label_of


def new_checks(r):
    cs = checks_of(r)
    out = [c for c in cs if c in NEW]
    pr2 = [x for x in (r.get("parts", {}).get("proportions") or {}).get("reasons", []) if x["check"] == "PR2_short_layer"
           and "track jacket" in x["line"]]
    return out + (["PR2_track_jacket"] if pr2 else [])


def adv_of(x):
    e = x["expect"]
    a = e.get("score", e.get("score_range"))
    if a is None:
        return None
    return st.mean(a) if isinstance(a, list) else a


def tier(a):
    """The advocate's tier, from the RULEBOOK Part 7 bands."""
    if a is None:
        return None
    return "mistake" if a <= 6.0 else "plain" if a <= 7.5 else "deliberate"


def target(a):
    """What the parts engine should give, on its own scale: the advocate's number, with 9+ held to 8.5 (the parts
    engine makes 9 reachable only when every part is strong, SPEC 'How high it can go', and Fit tops out at 7 until
    the fit cues pass)."""
    return None if a is None else min(a, 8.5)


# ---------------------------------------------------------------------------------------------------- what-ifs
def set_outer(sub, color="olive", volume=4):
    def fn(gs):
        if any(g.get("category") == "outerwear" for g in gs):
            for g in gs:
                if g.get("category") == "outerwear":
                    if g.get("subcategory") == sub:
                        return False
                    g.update({"subcategory": sub, "color_family": color, "condition": "clean", "certainty": "clear"})
                    return True
        top = next((g for g in gs if g.get("category") == "top"), None)
        if top is None:
            return False
        o = copy.deepcopy(top)
        o.update({"category": "outerwear", "subcategory": sub, "color_family": color, "pattern": "solid", "volume": volume,
                  "tucked": "na", "length": "na", "condition": "clean", "certainty": "clear", "logo": "none"})
        gs.append(o)
        return True
    return fn


def both(*fns):
    def fn(gs):
        ch = False
        for f in fns:
            ch = f(gs) or ch
        return ch
    return fn


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    prim, B1, B1L, U, L, Z = Q.load()
    added = {k: (sorted(v) if isinstance(v, frozenset) else v) for k, v in P.TUNE["v4"].items()
             if k not in P.TUNE["v3"] or P.TUNE["v3"][k] != v}
    res = {"profile": "test profile: picks Minimal + Smart casual (0.5 each), boldness a little, no age",
           "engines": {e: P.VERSIONS[e] for e in ENGINES}, "tune_v4_added": added}
    say(f"STYLE FAIRNESS PAPER TEST · v3 = {P.VERSIONS['v3']} (default) · v4 = {P.VERSIONS['v4']}")
    say(f"  {res['profile']}. Rule 7: founder profile pending; friends profile unknown; 703a8b and ebe23f unknown "
        f"(ask the founder); stock/web profile unknown; council cases are made-up readings with no person.")
    say(f"  v4's changes from v3: {added}")

    # ======================== (1) the council's outfits, per style
    say("\n(1) THE STYLE COUNCIL'S OUTFITS BY STYLE (cases.json anchors + look-alikes; made-up readings, no person; each "
        "case's own occasion, picks and boldness). adv = the advocate's rating (RULEBOOK Part 7 bands; a range's middle). "
        "target = adv with 9+ held to 8.5. tier: mistake <= 6, plain 6.5-7.5, deliberate 8+.")
    cases = [x for x in json.load(open(CASES)) if x["group"] in STYLE_OF_GROUP]
    rows = []
    for x in cases:
        picks = dict(x.get("styles_picked") or {})
        rr = {e: score(x["reading"], x["occasion"], None, e, styles=picks, bold=x.get("boldness", "a_little"))
              for e in ENGINES}
        if rr["v3"]["overall"] is None:
            continue
        a = adv_of(x)
        rows.append({"id": x["id"], "style": STYLE_OF_GROUP[x["group"]], "occ": x["occasion"], "adv": a,
                     "tier": tier(a), "target": target(a), **{e: rr[e]["overall"] for e in ENGINES},
                     **{e + "_raw": rr[e]["raw_score"] for e in ENGINES},
                     "v4_row": P.card_row(rr["v4"]), "v4_label": label_of(rr["v4"]), "v4_new": new_checks(rr["v4"]),
                     "v3_row": P.card_row(rr["v3"])})
    res["council"] = rows
    for sty in STYLE_ORDER + ["look-alike"]:
        say(f"  -- {sty}")
        for r in [r for r in rows if r["style"] == sty]:
            mv = "" if r["v3"] == r["v4"] else f" -> v4 {r['v4']}"
            say(f"    {r['id'][:34]:34s} {str(r['tier'] or '-'):10s} adv {str(r['adv']):5s} target {str(r['target']):5s} "
                f"v3 {r['v3']}{mv:9s} | v4 {r['v4_row']}" + (f"  [{', '.join(r['v4_new'])}]" if r["v4_new"] else ""))

    say("\n  PER STYLE (anchors only; error = engine - target; (a) a plain fit lands 6.5-7.5, (b) a deliberate fit reaches "
        "8, (c) the mistakes land at 6.0 or lower)")
    res["by_style"] = {}
    for sty in STYLE_ORDER:
        rs = [r for r in rows if r["style"] == sty and r["target"] is not None]
        out = {}
        for e in ENGINES:
            err = [r[e] - r["target"] for r in rs]
            plain = [r for r in rs if r["tier"] == "plain"]
            deli = [r for r in rs if r["tier"] == "deliberate"]
            mist = [r for r in rs if r["tier"] == "mistake"]
            out[e] = {"n": len(rs), "mean_err": round(st.mean(err), 2), "mae": round(st.mean(abs(v) for v in err), 2),
                      "a_plain_at_7": [sum(1 for r in plain if 6.5 <= r[e] <= 7.5), len(plain)],
                      "b_deliberate_8": [sum(1 for r in deli if r[e] >= 8.0), len(deli)],
                      "c_mistakes_le_6": [sum(1 for r in mist if r[e] <= 6.0), len(mist)],
                      "deliberate_err": round(st.mean(r[e] - r["target"] for r in deli), 2) if deli else None,
                      "best": max(r[e] for r in rs)}
        res["by_style"][sty] = out
        for e in ENGINES:
            o = out[e]
            say(f"    {sty:13s} {e} n={o['n']:2d} mean err {o['mean_err']:+.2f} · MAE {o['mae']:.2f} · deliberate err "
                f"{o['deliberate_err']:+.2f} · (a) plain 6.5-7.5 {o['a_plain_at_7'][0]}/{o['a_plain_at_7'][1]} · (b) "
                f"deliberate 8+ {o['b_deliberate_8'][0]}/{o['b_deliberate_8'][1]} · (c) mistakes <=6 "
                f"{o['c_mistakes_le_6'][0]}/{o['c_mistakes_le_6'][1]} · best {o['best']}")
    for e in ENGINES:
        a = [r for r in rows if r["style"] in STYLE_ORDER and r["target"] is not None]
        say(f"    ALL ANCHORS   {e} mean err {st.mean(r[e] - r['target'] for r in a):+.2f} · MAE "
            f"{st.mean(abs(r[e] - r['target']) for r in a):.2f} · spread of per-style deliberate error "
            f"{max(res['by_style'][s][e]['deliberate_err'] for s in STYLE_ORDER) - min(res['by_style'][s][e]['deliberate_err'] for s in STYLE_ORDER):.2f}")
    # the founder group and edge cases: must not move
    other = [x for x in json.load(open(CASES)) if x["group"] not in STYLE_OF_GROUP]
    mv = []
    for x in other:
        picks = dict(x.get("styles_picked") or {})
        a = [score(x["reading"], x["occasion"], None, e, styles=picks, bold=x.get("boldness", "a_little"))["overall"]
             for e in ENGINES]
        if a[0] != a[1]:
            mv.append(f"{x['id']} {a[0]}->{a[1]}")
    res["other_cases_moved"] = mv
    say(f"  the other {len(other)} council cases (founder group, edge cases): v4 moves {len(mv)}" + (": " + "; ".join(mv) if mv else ""))

    # ======================== (2) real photos
    say("\n(2) REAL PHOTOS (one reading per photo, its own occasion)")
    rows_r = {}
    for k, v in prim.items():
        sl = T.second_look_for(k, U, L)
        rows_r[k] = {"who": T.who(k), "occ": v["occ"], **{e: score(v["reading"], v["occ"], sl, e) for e in ENGINES}}
    sel = [k for k, r in rows_r.items() if all(r[e]["overall"] is not None for e in ENGINES)]
    moved = [k for k in sel if rows_r[k]["v4"]["overall"] != rows_r[k]["v3"]["overall"]]
    raw_moved = [k for k in sel if rows_r[k]["v4"]["raw_score"] != rows_r[k]["v3"]["raw_score"]]
    fired = {k: new_checks(rows_r[k]["v4"]) for k in sel if new_checks(rows_r[k]["v4"])}
    say(f"  shown score moves on {len(moved)}/{len(sel)}; raw moves on {len(raw_moved)}; v4's new checks fire on "
        f"{len(fired)}: " + (", ".join(f"{k} {v}" for k, v in fired.items()) or "none"))
    for k in moved:
        say(f"    {k} [{T.WHO_TEXT[rows_r[k]['who']]}] {rows_r[k]['v3']['overall']} -> {rows_r[k]['v4']['overall']} | "
            f"{P.card_row(rows_r[k]['v4'])}")
    res["real_moved"], res["real_fired"] = moved, fired
    res["spread"] = {}
    for e in ENGINES:
        line, b = Q.band_line(f"all photos · {e}", [rows_r[k][e]["overall"] for k in sel])
        say(line); res["spread"][e] = b
    # near misses: the workwear / outdoor photos and what PR5 / PR6 lack
    say("  photos that read as workwear or outdoor (any detected) and what PR5/PR6 need that they lack:")
    res["near"] = []
    for k in sorted(sel):
        r4 = rows_r[k]["v4"]
        det = r4["detected_styles"]
        if not ({"workwear", "outdoor"} & set(det)):
            continue
        gs = R.scored_garments(prim[k]["reading"])
        out = next((g for g in gs if g.get("category") == "outerwear"), None)
        bot = next((g for g in gs if g.get("category") == "bottom"), None)
        sh = next((g for g in gs if g.get("category") == "footwear"), None)
        why = []
        if out is None:
            why.append("no layer")
        else:
            why.append(f"layer {out.get('subcategory')}")
        if bot is not None:
            why.append(f"{bot.get('subcategory')} {bot.get('leg_shape')} hem {bot.get('hem')}")
        why.append(f"shoe {sh.get('subcategory') if sh else 'not in view'}")
        line = {"key": k, "who": T.WHO_TEXT[rows_r[k]["who"]], "det": det, "v3": rows_r[k]["v3"]["overall"],
                "v4": r4["overall"], "facts": why, "fired": new_checks(r4)}
        res["near"].append(line)
        say(f"    {k:24s} {line['who']:30s} {'/'.join(det):24s} v3 {line['v3']} v4 {line['v4']} · {'; '.join(why)}"
            + (f" [{', '.join(line['fired'])}]" if line["fired"] else ""))

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
                                   tune if e == "v4" else None)["overall"] for i, j in enumerate(runs)]
        out = {}
        for e in ENGINES:
            vals = [per[k][e] for k in per if None not in per[k][e] and len(per[k][e]) == 3]
            med = sum(1 for v in vals if all(abs(x - st.median(v)) <= 0.5 for x in v))
            ex = sum(1 for v in vals if len(set(v)) == 1)
            sp = [max(v) - min(v) for v in vals]
            out[e] = {"within_0.5_of_median": [med, len(vals)], "exact": [ex, len(vals)],
                      "mean_spread": round(st.mean(sp), 3), "worst": max(sp)}
        diff = [k for k in per if per[k]["v3"] != per[k]["v4"]]
        out["v4_differs_from_v3_on"] = {k: per[k] for k in diff}
        say(f"  {label}")
        for e in ENGINES:
            o = out[e]
            say(f"    {e} within 0.5 of median {o['within_0.5_of_median'][0]}/{o['within_0.5_of_median'][1]} · exact "
                f"{o['exact'][0]}/{o['exact'][1]} · mean spread {o['mean_spread']} · worst {o['worst']}")
        say(f"    photos where any v4 run differs from v3: {len(diff)}" + (": " + "; ".join(
            f"{k} v3 {per[k]['v3']} v4 {per[k]['v4']}" for k in diff) if diff else ""))
        return out

    res["steady"]["b1_A"] = steady_set(B1, True, "batch 1 arm A (validation), second look run i paired")
    res["steady"]["zoom1_B"] = steady_set(Z, False, "zoom1 + zoom1-stock arm B (design set)")
    res["steady"]["b1_A_lightness"] = steady_set(B1, True, "batch 1 arm A + lightness from arm B1 run i", lit=B1L)
    say("  v4's new checks on every multi-run reading set (photos where one fires in any run / in some but not all runs):")
    res["fire"] = {}
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
                    r = score(j, "everyday", None, "v4")
                    if r["overall"] is None:
                        continue
                    nread += 1
                    hit.append(bool(new_checks(r)))
                if any(hit):
                    fires.append(k)
                    if not all(hit):
                        flips.append(k)
            nm = f"{path.split('/')[1]} {arm}"
            res["fire"][nm] = {"photos": len(by), "readings": nread, "fires": fires, "flips": flips}
            say(f"    {nm:16s} photos {len(by):2d} · readings {nread:3d} · fires on {len(fires)} · flips {len(flips)}"
                + (f" ({', '.join(fires)})" if fires else ""))
    # the boot family: how his boots' type spreads across runs (PR5's shoe set must hold the family)
    say("  shoe types read across runs on photos whose shoes read as any boot in any run (b1 A, zoom1/zoom1-stock B):")
    boots = {"work_boot", "suede_chukka", "chelsea_boot"}
    res["boot_types"] = {}
    for nm, runsets in (("b1 A", B1), ("zoom1 B", Z)):
        for k, runs in runsets.items():
            subs = [next((g.get("subcategory") for g in R.scored_garments(j) if g.get("category") == "footwear"), None)
                    for j in runs[:3] if j]
            if set(subs) & boots:
                res["boot_types"][f"{nm} {k}"] = subs
    inset = sum(1 for v in res["boot_types"].values() if all(s in P.TUNE["v4"]["pr5_shoes"] for s in v))
    anyin = sum(1 for v in res["boot_types"].values() if any(s in P.TUNE["v4"]["pr5_shoes"] for s in v))
    say(f"    {len(res['boot_types'])} photos; PR5's shoe set (the boots kind) holds all runs on {inset}, some runs on "
        f"{anyin}")
    for k, v in res["boot_types"].items():
        say(f"      {k:30s} {v}")

    # ======================== (4) judge pilot
    say("\n(4) AGAINST THE JUDGE PILOT (panel = median of 5 judges' weighted totals), the same split as v2/v3")
    jp = [x for x in Q.load_panel() if x["key"] in rows_r]
    saved = json.load(open(HERE / "results/parts2/split.json"))
    half = {pid: v["half"] for pid, v in saved["photos"].items()}
    remade, _ = Q.make_split(jp)
    assert remade == half, "the judge-pilot split differs from results/parts2/split.json"
    res["judge"] = {}
    for side, label in (("all", "all"), ("tune", "TUNING half"), ("held", "HELD-OUT half")):
        xs = [x for x in jp if side == "all" or half[x["id"]] == side]
        res["judge"][side] = {}
        for e in ENGINES:
            o = Q.cmp_stats([(rows_r[x["key"]][e]["overall"], x["panel"]) for x in xs])
            res["judge"][side][e] = o
            say(f"  {label:14s} {e} {Q.fmt_cmp(o)}")
    jm = [x for x in jp if rows_r[x["key"]]["v4"]["overall"] != rows_r[x["key"]]["v3"]["overall"]]
    res["judge"]["moved"] = [f"{x['id']} ({x['key']}) panel {x['panel']} v3 {rows_r[x['key']]['v3']['overall']} v4 "
                             f"{rows_r[x['key']]['v4']['overall']}" for x in jm]
    say(f"  panel photos v4 moved: {len(jm)}" + (": " + "; ".join(res["judge"]["moved"]) if jm else ""))

    # ======================== (5) his, his friends' and the unknowns' checks
    say("\n(5) EVERY CHECK OF THE FOUNDER, HIS FRIENDS AND THE TWO UNKNOWNS (own occasion): v3 -> v4")
    res["checks"] = []
    mine = sorted([k for k in rows_r if rows_r[k]["who"] in ("founder", "friend", "unknown")],
                  key=lambda k: (rows_r[k]["who"] != "friend", rows_r[k]["who"], k))
    for k in mine:
        r = rows_r[k]
        line = {"key": k, "who": T.WHO_TEXT[r["who"]], "occ": r["occ"], "v3": r["v3"]["overall"], "v4": r["v4"]["overall"],
                "v4_row": P.card_row(r["v4"]), "label": label_of(r["v4"])}
        res["checks"].append(line)
        say(f"  {k:16s} [{line['who']}; {r['occ']}; {line['label']}] v3 {line['v3']} -> v4 {line['v4']} | {line['v4_row']}")
    tg = {x["key"]: x for x in res["checks"]}
    targets = [
        ("the friend's blazer d1967f at 7 or below", tg["phone-d1967f"]["v4"] <= 7.0),
        ("the chore coat (e438d4, f4870b, fb0b17) at 7-7.5",
         all(7.0 <= tg[k]["v4"] <= 7.5 for k in ("phone-e438d4", "phone-f4870b", "phone-fb0b17"))),
        ("his gingham fits as in v3 (5a9049, 7f14a4, f07193)",
         all(tg[k]["v4"] == tg[k]["v3"] for k in ("phone-5a9049", "phone-7f14a4", "phone-f07193"))),
        ("his black tee + wide jeans + white leather sneakers (8ad378, 403ade) at 7",
         all(tg[k]["v4"] == 7.0 for k in ("phone-8ad378", "phone-403ade"))),
    ]
    b1 = res["steady"]["b1_A"]["v4"]["within_0.5_of_median"]
    targets.append((f"batch 1 arm A steady at least 49/49 ({b1[0]}/{b1[1]})", b1[0] >= 49 and b1[0] == b1[1]))
    for side in ("all", "held"):
        a, b = res["judge"][side]["v3"], res["judge"][side]["v4"]
        if side == "all":
            targets.append((f"panel gap within +-0.2 ({b['mean_diff']:+.2f})", abs(b["mean_diff"]) <= 0.2))
        else:
            targets.append((f"no loss on the held-out half (within 0.5: v3 {a['within_0.5']} -> v4 {b['within_0.5']}; "
                            f"MAE {a['mae']} -> {b['mae']})", b["within_0.5"] >= a["within_0.5"] and b["mae"] <= a["mae"]))
    p8 = res["spread"]["v4"]["pct8"]
    targets.append((f"8+ at 5-12% on the real photos ({p8}%)", 5 <= p8 <= 12))
    say("  targets:")
    res["targets"] = []
    for name, ok in targets:
        res["targets"].append({"target": name, "met": ok})
        say(f"    [{'met' if ok else 'NOT MET'}] {name}")

    # ======================== (6) what-ifs on real readings: the look's own pieces
    say("\n(6) WHAT-IFS ON REAL READINGS (one fact edited; the engine's own score)")
    res["whatifs"] = []
    wi = [
        ("phone-e438d4", "friend's chore coat: low-profile sneakers -> work boots", S3.set_shoe("work_boot", "brown")),
        ("phone-f4870b", "friend's chore coat: low-profile sneakers -> work boots", S3.set_shoe("work_boot", "brown")),
        ("phone-fb0b17", "friend's chore coat: low-profile sneakers -> work boots", S3.set_shoe("work_boot", "brown")),
        ("phone-e438d4", "friend's chore coat: -> chukkas", S3.set_shoe("suede_chukka", "brown")),
        ("phone-8ad378", "his black tee + wide jeans: + olive chore coat, shoes -> work boots",
         both(set_outer("chore_coat"), S3.set_shoe("work_boot", "brown"))),
        ("phone-8ad378", "his black tee + wide jeans: + olive chore coat (white leather sneakers kept)",
         set_outer("chore_coat")),
        ("phone-8ad378", "his black tee + wide jeans: + black fleece, shoes -> trail shoes",
         both(set_outer("fleece", "black", 3), S3.set_shoe("trail_shoe", "grey"))),
        ("phone-8ad378", "his black tee + wide jeans: + green track jacket", set_outer("track_jacket", "green", 3)),
    ]
    for k in ("phone-8bc29d", "phone-e026de", "phone-b0f0c8"):
        if k in prim:
            wi.append((k, "his overshirt/boots check: layer -> chore coat", set_outer("chore_coat")))
    for k, name, fn in wi:
        if k not in prim:
            continue
        rd = Q.edit(prim[k]["reading"], fn)
        if rd is None:
            continue
        sl = T.second_look_for(k, U, L)
        a = {e: score(rd, prim[k]["occ"], sl, e) for e in ENGINES}
        line = {"key": k, "who": T.WHO_TEXT[rows_r[k]["who"]], "what": name,
                "before": rows_r[k]["v4"]["overall"], **{e: a[e]["overall"] for e in ENGINES},
                "v4_row": P.card_row(a["v4"]), "label": label_of(a["v4"]), "new": new_checks(a["v4"])}
        res["whatifs"].append(line)
        say(f"  {k[6:]:8s} {name:66s} as read {line['before']} -> v3 {line['v3']} · v4 {line['v4']} ({line['label']}) | "
            f"{line['v4_row']}" + (f" [{', '.join(line['new'])}]" if line["new"] else ""))
    # minimal and smart casual: do they already have a path to 8 (a tuck)?
    say("  do minimal / smart casual / prep anchors reach 8 with a tuck (PR1)? (council readings, top fully tucked)")
    res["tuck_paths"] = []
    for x in cases:
        if x["id"] not in ("min-8.5-knit-wide-trousers", "min-grey-sweater-black-jeans", "min-7.5-uniform",
                           "sc-8.5-quarter-zip", "prep-sweater-oxford-loafer", "min-city-boy"):
            continue
        rd = copy.deepcopy(x["reading"])
        for g in rd["garments"]:
            if g.get("category") == "top":
                g["tucked"] = "full"
                break
        r = score(rd, x["occasion"], None, "v4", styles=dict(x.get("styles_picked") or {}),
                  bold=x.get("boldness", "a_little"))
        res["tuck_paths"].append({"id": x["id"], "tucked": r["overall"], "row": P.card_row(r)})
        say(f"    {x['id']:30s} tucked -> {r['overall']} | {P.card_row(r)}")

    # the lightness word (passed alone in batch 1; not in the live reading): what it does for the tonal anchors
    say("  the tonal anchors with the lightness word added (light: white/cream/light grey/khaki/tan; mid: grey/olive/"
        "mid denim/light blue/colours; dark: black/charcoal/navy/brown/dark denim):")
    LIGHT = {"white", "off_white_cream", "light_grey", "khaki_beige", "tan_camel", "denim_light"}
    DARK = {"black", "charcoal", "navy", "brown", "denim_dark", "burgundy"}
    res["lightness_paths"] = []
    for x in cases:
        if x["group"] not in ("anchor-minimal", "anchor-prep", "anchor-smart-casual", "anchor-outdoor"):
            continue
        rd = copy.deepcopy(x["reading"])
        for g in rd["garments"]:
            c = g.get("color_family")
            g["lightness"] = "light" if c in LIGHT else "dark" if c in DARK else "mid"
        a = score(x["reading"], x["occasion"], None, "v4", styles=dict(x.get("styles_picked") or {}),
                  bold=x.get("boldness", "a_little"))
        r = score(rd, x["occasion"], None, "v4", styles=dict(x.get("styles_picked") or {}),
                  bold=x.get("boldness", "a_little"))
        if r["overall"] != a["overall"]:
            res["lightness_paths"].append({"id": x["id"], "adv": adv_of(x), "v4": a["overall"], "with_lightness": r["overall"],
                                           "row": P.card_row(r)})
            say(f"    {x['id']:32s} adv {adv_of(x)} · v4 {a['overall']} -> with lightness {r['overall']} | {P.card_row(r)}")

    # ======================== (7) ablations
    say("\n(7) ABLATIONS on v4 (corpus 8+; b1 A steady; judge all / held mean diff and within 0.5; council deliberate 8+ "
        "by style; the friend's chore coat e438d4 as read / with boots)")
    variants = {
        "v3 (none of v4)": {"pr5": 0.0, "pr6": 0.0, "short_layers_extra": frozenset()},
        "v4 as built": {},
        "PR5 +0.5": {"pr5": 0.5},
        "PR5 +1.5": {"pr5": 1.5},
        "PR5 + field jacket": {"pr5_layers": frozenset({"chore_coat", "field_jacket"})},
        "PR5 + overshirt": {"pr5_layers": frozenset({"chore_coat", "overshirt"})},
        "PR5 shoes + low-profile/canvas sneakers": {"pr5_shoes": frozenset(R.FOOT_KIND["boots"]) | {
            "low_profile_sneaker", "canvas_sneaker"}},
        "PR5 shoes: work boot + chukka only (no Chelsea)": {"pr5_shoes": frozenset({"work_boot", "suede_chukka"})},
        "PR5 shoes + derby (his boots' misread)": {"pr5_shoes": frozenset(R.FOOT_KIND["boots"]) | {"derby"}},
        "PR5 bottoms + chinos": {"pr5_bottoms": frozenset({"jeans", "work_pants", "cargos", "chinos"})},
        "PR6 off": {"pr6": 0.0},
        "PR6 +1.0": {"pr6": 1.0},
        "PR6 + vest": {"pr6_layers": frozenset({"fleece", "shell_jacket", "rain_jacket", "vest"})},
        "track jacket not a short layer": {"short_layers_extra": frozenset()},
        "PR6 shoes + performance runner (stand-in until trail_shoe is read)":
            {"pr6_shoes": frozenset({"trail_shoe", "performance_runner"})},
        "+ sc_pair (anchor shoe + anchor piece, detected with the shoe)": {"sc_pair": True},
        "+ sc_pair, PR6 +1.0": {"sc_pair": True, "pr6": 1.0},
    }
    res["ablations"] = {}
    boots_e = Q.edit(prim["phone-e438d4"]["reading"], S3.set_shoe("work_boot", "brown"))
    for name, tn in variants.items():
        vals = [score(prim[k]["reading"], prim[k]["occ"], T.second_look_for(k, U, L), "v4", tn)["overall"] for k in sel]
        b = Q.bands(vals)
        hs = []
        for k, runs in B1.items():
            v = [score(j, "everyday", T.second_look_for(k, U, L, i), "v4", tn)["overall"] for i, j in enumerate(runs[:3])]
            if None not in v:
                hs.append(all(abs(x - st.median(v)) <= 0.5 for x in v))
        jj = {side: Q.cmp_stats([(score(prim[x["key"]]["reading"], prim[x["key"]]["occ"],
                                        T.second_look_for(x["key"], U, L), "v4", tn)["overall"], x["panel"])
                                 for x in jp if side == "all" or half[x["id"]] == side]) for side in ("all", "held")}
        c8 = Counter()
        for x in cases:
            if tier(adv_of(x)) != "deliberate":
                continue
            r = score(x["reading"], x["occasion"], None, "v4", tn, styles=dict(x.get("styles_picked") or {}),
                      bold=x.get("boldness", "a_little"))
            if r["overall"] is not None and r["overall"] >= 8:
                c8[STYLE_OF_GROUP[x["group"]]] += 1
        ch = score(prim["phone-e438d4"]["reading"], prim["phone-e438d4"]["occ"], T.second_look_for("phone-e438d4", U, L),
                   "v4", tn)["overall"]
        chb = score(boots_e, prim["phone-e438d4"]["occ"], T.second_look_for("phone-e438d4", U, L), "v4", tn)["overall"]
        s = {"8+": b["8+"], "pct8": b["pct8"], "b1": [sum(hs), len(hs)], "all": jj["all"], "held": jj["held"],
             "council_deliberate_8": dict(c8), "e438d4": ch, "e438d4_boots": chb}
        res["ablations"][name] = s
        say(f"  {name:40s} 8+ {s['8+']} ({s['pct8']}%) · b1 {s['b1'][0]}/{s['b1'][1]} · all {jj['all']['mean_diff']:+.2f}/"
            f"{jj['all']['within_0.5']} · held {jj['held']['mean_diff']:+.2f}/{jj['held']['within_0.5']} · deliberate 8+ "
            f"{dict(sorted(c8.items()))} · chore {ch}/{chb}")

    # ======================== (8) the style he picks: what picks change today (label tie-break only)
    say("\n(8) WHAT HIS PICKS CHANGE TODAY (input to the picks proposal). Every engine: picks never move a number. They "
        "break the tie for the 'Reads as' label when two or more styles are detected.")
    multi = [k for k in sel if len(rows_r[k]["v4"]["detected_styles"]) >= 2]
    say(f"  real photos with 2+ detected styles: {len(multi)}/{len(sel)} "
        f"({round(100 * len(multi) / len(sel))}%)")
    flips = 0
    res["picks"] = []
    for k in multi:
        det = rows_r[k]["v4"]["detected_styles"]
        labs = {}
        for stl in det:
            r = score(prim[k]["reading"], prim[k]["occ"], T.second_look_for(k, U, L), "v4", styles={stl: 0.5})
            labs[stl] = (r["style_label"], r["overall"])
        nums = {v[1] for v in labs.values()}
        flips += len({v[0] for v in labs.values()}) > 1
        res["picks"].append({"key": k, "detected": det, "label_if_picked": {s: v[0] for s, v in labs.items()},
                             "score_same": len(nums) == 1})
    say(f"  of those, the label follows the pick on {flips}; the score is identical across picks on "
        f"{sum(1 for x in res['picks'] if x['score_same'])}/{len(res['picks'])}")
    for x in res["picks"][:12]:
        say(f"    {x['key']:24s} detected {'/'.join(x['detected']):30s} label if picked: {x['label_if_picked']}")
    cm = [r for r in rows if True]
    say(f"  council outfits with 2+ detected styles (v4): "
        f"{sum(1 for x in cases if len(score(x['reading'], x['occasion'], None, 'v4', styles={})['detected_styles']) >= 2)}"
        f"/{len(cases)}")

    # ======================== (9) the picks tie-break for fixes (proposal; measured with the v3 fix engine)
    say("\n(9) PROPOSAL CHECK: 'a fix toward his picked look comes first, on a tie' (handoff/fixtures/parts_fixes.py, "
        "the v3 parts fix engine, empty closet, own occasion). The proposed key puts 'the fixed outfit reads as one of his "
        "picks' right after the shown gain: it can reorder fixes that show the same gain, never beat a bigger one. "
        "Each real reading is run once per single pick (7 styles).")
    sys.path.insert(0, str(K / "handoff/fixtures"))
    import parts_fixes as F  # noqa: E402
    seen = {}
    orig_eval = F._evaluate

    def spy(cand, *a, **kw):
        ev = orig_eval(cand, *a, **kw)
        if ev is not None:
            seen[cand["id"]] = set(ev[0]["detected_styles"])
        return ev
    F._evaluate = spy
    keys7 = ["streetwear", "workwear", "vintage_sport", "outdoor", "minimalist", "classic_prep", "smart_casual"]
    tot = changed = toward_any = 0
    examples = []
    for k in sorted(sel):
        for stl in keys7:
            seen.clear()
            out = F.suggest_parts_fixes(prim[k]["reading"], prim[k]["occ"], {stl: 0.5}, "a_little",
                                        T.second_look_for(k, U, L))
            fx = out["fixes"]
            if not fx:
                continue
            tot += 1
            toward = [x for x in fx if stl in seen.get(x["id"], set())]
            toward_any += bool(toward)
            alt = sorted(fx, key=lambda x: (F.CATALOG["classes"][x["class"]]["rank"], -x["gain"], stl not in seen.get(x["id"], set()), -x["raw_gain"],
                                            x["effort"]))
            if alt[0]["id"] != fx[0]["id"]:
                changed += 1
                if len(examples) < 10:
                    examples.append(f"{k} pick {stl}: {fx[0]['id']} -> {alt[0]['id']} (gain {alt[0]['gain']:+g})")
    F._evaluate = orig_eval
    res["picks_fix_tiebreak"] = {"cards_with_fixes": tot, "a_shown_fix_reads_as_pick": toward_any,
                                 "lead_fix_changes": changed, "examples": examples}
    say(f"  (reading, pick) pairs with at least one fix: {tot} · a shown fix makes the outfit read as the pick: "
        f"{toward_any} · the lead fix would change: {changed}")
    for e_ in examples:
        say(f"    {e_}")

    (OUT / "analysis.txt").write_text("\n".join(LINES) + "\n")
    json.dump(res, open(OUT / "analysis.json", "w"), indent=1,
              default=lambda o: sorted(o) if isinstance(o, (set, frozenset)) else str(o))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Parts engine v6 paper test (Oct 11): v5 (parts-proto-5) vs v6 (parts-proto-6, the default: v5 plus PB1 "roomier
than the look", H2 judged on every style the outfit reads as, and Event's softer band). No API calls, no money.

  /usr/bin/python3 parts6_test.py     -> results/parts6/analysis.txt + analysis.json
                                         (report: ../rubric/research/parts/v6.md)

Same readings, loaders and judge-pilot split as parts5_test.py / parts2_test.py (results/parts2/split.json): the
78-reading corpus (results/parts1/corpus.json) plus the newest phone pull (screenshots/phone/20261010-185554).

Rule 7: the founder is profile pending (no birth year or picked looks given yet); his friends are profile unknown;
703a8b and ebe23f are unknown (ask the founder); stock and web photos are profile unknown; the style council's cases
and the outfits below are made-up readings with no person (each council case is scored with the picks and boldness
written in it; the outfits below with no picks). Real photos are scored with ONE stated test profile: picks Minimal +
Smart casual (0.5 each), boldness "a little", no age. No engine lets picks or age move a number, so no split by age
band or picked look is possible; section (9) re-checks that picks can't move v6's new checks.
"""
import json
import statistics as st
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
K = HERE.parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rubrics"))
import rubric as R  # noqa: E402  v4.1
import parts_proto as P  # noqa: E402
import parts_test as T  # noqa: E402
import parts2_test as Q  # noqa: E402
import parts3_test as S3  # noqa: E402
import parts4_test as P4  # noqa: E402
import parts5_test as P5  # noqa: E402

OUT = HERE / "results" / "parts6"
ENGINES = ("v5", "v6")
NEW = ("PB1_roomier_than_look",)
LINES = []
CASES = K / "rubric/research/style-council/cases.json"
STYLE_OF_GROUP = S3.STYLE_OF_GROUP
STYLE_ORDER = P4.STYLE_ORDER
G, Rd, top = P5.G, P5.Rd, P5.top


def say(s=""):
    LINES.append(s)
    print(s)


def score(reading, occ, sl=None, engine="v6", tune=None, styles=None, bold=None):
    return P.score_parts(reading, occ, styles if styles is not None else Q.PROFILE, sl, bold or Q.BOLD, engine=engine,
                         tune=tune)


checks_of = S3.checks_of
label_of = S3.label_of


def fired(r, which=NEW):
    return [c for c in checks_of(r) if c in which]


def tipped(r, check):
    return any(t["check"] == check for p in (r.get("parts") or {}).values() for t in p.get("tips", []))


def part(r, k):
    return ((r.get("parts") or {}).get(k) or {}).get("score")


# ------------------------------------------------------------------------------------------- the outfits
TROUSERS = G("bottom", "trousers", "charcoal", 3, "straight", "slight_break")
WIDE_TR = G("bottom", "trousers", "black", 3, "wide", "slight_break")
CHINOS = G("bottom", "chinos", "khaki_beige", 3, "straight", "slight_break")
SLIM_CHINOS = G("bottom", "chinos", "khaki_beige", 3, "slim", "slight_break")
DARK_JEANS = G("bottom", "jeans", "denim_dark", 3, "straight", "slight_break")
SLIM_JEANS = G("bottom", "jeans", "black", 3, "slim", "slight_break")
WIDE_JEANS = G("bottom", "jeans", "denim_light", 3, "wide", "cuffed")
JOGGERS = G("bottom", "joggers", "grey", 3, "slim", "cuffed")
LOAFER, LOAFER_BK = G("footwear", "loafer", "brown"), G("footwear", "loafer", "black")
WLS, CHUNKY = G("footwear", "white_leather_sneaker", "white"), G("footwear", "chunky_sneaker", "white")
LOWP, BOOTS = G("footwear", "low_profile_sneaker", "black"), G("footwear", "work_boot", "brown")
CANVAS, SLIDES = G("footwear", "canvas_sneaker", "black"), G("footwear", "slides_sandals", "black")
CHELSEA = G("footwear", "chelsea_boot", "black")

# KD-5: the same oxford + chinos + loafers with and without a prep marker. Every pair must score the same.
KD5 = [
    ("oxford", "white oxford + khaki chinos + loafers (no marker: smart casual)",
     Rd(top("oxford_shirt", "white"), CHINOS, LOAFER)),
    ("cardigan", "+ a navy cardigan over it (marker: prep)",
     Rd(top("cardigan", "navy"), top("oxford_shirt", "white"), CHINOS, LOAFER)),
    ("color-oxford", "a light-blue oxford instead (light blue is a neutral: no marker)",
     Rd(top("oxford_shirt", "light_blue"), CHINOS, LOAFER)),
    ("pink-oxford", "a pink oxford instead (a colored collar: prep)",
     Rd(top("oxford_shirt", "pink"), CHINOS, LOAFER)),
    ("striped-oxford", "a medium-striped white oxford (a patterned collar: prep)",
     Rd(top("oxford_shirt", "white", pattern="stripes", pattern_scale="medium"), CHINOS, LOAFER)),
    ("polo", "navy polo + chinos + white leather sneakers (smart casual)", Rd(top("polo", "navy"), CHINOS, WLS)),
    ("polo-green", "a green polo instead (prep)", Rd(top("polo", "green"), CHINOS, WLS)),
    ("cardigan-wide", "black cardigan + wide black trousers + black loafers (minimal label; smart casual top to toe)",
     Rd(top("cardigan", "black"), WIDE_TR, LOAFER_BK)),
]

# KD-3: the bands. fault = PB1 must fire; keep = it must not (an exemption or a look that holds it)
BAND = [
    ("B1", "oversized tee + slim black jeans + white leather sneakers (no style)", Rd(top("tee", "white", 4), SLIM_JEANS, WLS), "fault"),
    ("B2", "oversized hoodie + slim black jeans + chunky sneakers (streetwear; its volume needs a fuller leg)",
     Rd(top("hoodie", "grey", 4), SLIM_JEANS, CHUNKY), "fault"),
    ("B3", "oversized graphic tee + slim black jeans + canvas sneakers", Rd(top("graphic_tee", "black", 4), SLIM_JEANS, CANVAS), "fault"),
    ("B4", "oversized tee + dark straight jeans + white leather sneakers (no style)", Rd(top("tee", "white", 4), DARK_JEANS, WLS), "fault"),
    ("B5", "oversized oxford + slim chinos + loafers (smart casual's band stops at 3)",
     Rd(top("oxford_shirt", "light_blue", 4), SLIM_CHINOS, LOAFER), "fault"),
    ("B6", "oversized sweater + slim black jeans + Chelsea boots", Rd(top("sweater", "grey", 4), SLIM_JEANS, CHELSEA), "fault"),
    ("K1", "oversized tee + wide jeans + white leather sneakers (streetwear)", Rd(top("tee", "black", 4), G("bottom", "jeans", "black", 3, "wide", "cuffed"), WLS), "keep"),
    ("K2", "oversized hoodie + wide jeans + chunky sneakers (streetwear)", Rd(top("hoodie", "black", 4), WIDE_JEANS, CHUNKY), "keep"),
    ("K3", "oversized tee + wide black trousers + loafers (city boy)", Rd(top("tee", "black", 4), WIDE_TR, LOAFER_BK), "keep"),
    ("K4", "roomy knit + straight chinos + loafers (pressed trousers: city boy)", Rd(top("sweater", "navy", 4), CHINOS, LOAFER), "keep"),
    ("K5", "boxy tee at the belt + dark straight jeans + white sneakers (a deliberate waist)",
     Rd(top("tee", "white", 4, length="at_belt"), DARK_JEANS, WLS), "keep"),
    ("K6", "oversized tee tucked into straight jeans (a deliberate waist)", Rd(top("tee", "white", 4, tucked="full"), DARK_JEANS, WLS), "keep"),
    ("K7", "oversized hoodie under a chore coat + slim jeans + boots (the layer sets the line)",
     Rd(top("hoodie", "grey", 4), G("outerwear", "chore_coat", "tan_camel"), SLIM_JEANS, BOOTS), "keep"),
    ("K8", "oversized hoodie + slim joggers + canvas sneakers (loungewear: its ladder)", Rd(top("hoodie", "grey", 4), JOGGERS, CANVAS), "keep"),
    ("K9", "oversized tee + skinny jeans (PF5 already charges it)", Rd(top("tee", "white", 4), G("bottom", "jeans", "black", 3, "skinny"), WLS), "keep"),
    ("K10", "oversized hoodie + slim chinos + loafers (SX1 already charges it)", Rd(top("hoodie", "grey", 4), SLIM_CHINOS, LOAFER), "keep"),
    ("K11", "oversized oxford with sleeves over the hands + straight jeans (FF5 already calls it a size big)",
     Rd(top("oxford_shirt", "white", 4, sleeve_end="covers_hand"), DARK_JEANS, WLS), "keep"),
    ("K12", "regular tee + slim black jeans + white leather sneakers (inside the default band)", Rd(top("tee", "white"), SLIM_JEANS, WLS), "keep"),
    ("K13", "chore coat over a tee + slim jeans + boots (workwear; a regular top under a layer)",
     Rd(top("tee", "white"), G("outerwear", "chore_coat", "tan_camel"), SLIM_JEANS, BOOTS), "keep"),
    ("K14", "oversized tee + straight cargos + chunky sneakers (streetwear)", Rd(top("tee", "black", 4), G("bottom", "cargos", "olive", 3, "straight", "cuffed"), CHUNKY), "keep"),
    ("K15", "a volume-5 boxy tee + wide black trousers + loafers (SX1 already charges it: above minimal's band)", Rd(top("tee", "white", 5), WIDE_TR, LOAFER_BK), "keep"),
]

# KD-16: Event. The same outfits at Interview, Event (v5 = the interview band; v6 = 3-4) and Date
EVENT = [
    ("hoodie", "hoodie + dark jeans + white leather sneakers", Rd(top("hoodie", "grey"), DARK_JEANS, WLS)),
    ("tee", "plain tee + dark jeans + low-profile sneakers", Rd(top("tee", "black"), DARK_JEANS, LOWP)),
    ("overshirt", "overshirt over a tee + dark jeans + Chelsea boots (smart going-out)",
     Rd(top("tee", "white"), G("outerwear", "overshirt", "olive"), DARK_JEANS, CHELSEA)),
    ("oxford", "oxford + chinos + loafers", Rd(top("oxford_shirt", "white"), CHINOS, LOAFER)),
    ("polo", "knit polo tucked into trousers + loafers", Rd(top("knit_polo", "navy", tucked="full"), TROUSERS, LOAFER)),
    ("blazer", "blazer over a tucked oxford + trousers + derbies",
     Rd(top("oxford_shirt", "light_blue", tucked="full"), G("outerwear", "blazer", "navy"), TROUSERS, G("footwear", "derby", "brown"))),
    ("slides", "oxford + chinos + slides (still held to 4.0)", Rd(top("oxford_shirt", "white"), CHINOS, SLIDES)),
    ("sweats", "hoodie + sweatpants + canvas sneakers (still held to 4.0)", Rd(top("hoodie", "grey"), G("bottom", "sweatpants", "grey", 3, "relaxed", "cuffed"), CANVAS)),
]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    prim, B1, B1L, U, L, Z = Q.load()
    added = {k: (sorted(v) if isinstance(v, frozenset) else v) for k, v in P.TUNE["v6"].items()
             if k not in P.TUNE["v5"] or P.TUNE["v5"][k] != v}
    res = {"profile": "test profile: picks Minimal + Smart casual (0.5 each), boldness a little, no age",
           "engines": {e: P.VERSIONS[e] for e in ENGINES}, "tune_v6_added": added}
    say(f"PARTS ENGINE v6 PAPER TEST · v5 = {P.VERSIONS['v5']} · v6 = {P.VERSIONS['v6']} (default)")
    say(f"  {res['profile']}. Rule 7: founder profile pending; friends profile unknown; 703a8b and ebe23f unknown "
        f"(ask the founder); stock/web profile unknown; council and test outfits are made-up readings with no person.")
    say(f"  v6's changes from v5: {added}")

    # ======================== (1) KD-5
    say("\n(1) KD-5: A PREP MARKER NO LONGER COSTS 'TOP TO TOE' (made-up readings, Everyday; no picks, then each pick)")
    res["kd5"] = []
    for cid, what, rd in KD5:
        a = {e: score(rd, "everyday", None, e, styles={}) for e in ENGINES}
        picks = {s: score(rd, "everyday", None, "v6", styles={s: 1.0})["overall"] for s in ("classic_prep", "smart_casual", "minimalist")}
        row = {"id": cid, "what": what, "label": label_of(a["v6"]), "v5": a["v5"]["overall"], "v6": a["v6"]["overall"],
               "v5_style": part(a["v5"], "cohesion"), "v6_style": part(a["v6"], "cohesion"),
               "v6_h2": "H2_clear_top_to_toe" in checks_of(a["v6"]), "v6_with_picks": picks}
        res["kd5"].append(row)
        say(f"  {cid:14s} {what:92s} [{row['label']}] v5 {row['v5']} (Style {row['v5_style']}) -> v6 {row['v6']} "
            f"(Style {row['v6_style']}) · with picks {picks}")
    # the cardigan adds nothing but the marker, so it must score exactly as the plain oxford; every outfit here earns
    # top to toe (the pink and striped oxfords also earn their standout credits, so they may score higher)
    kd = {r["id"]: r for r in res["kd5"]}
    res["kd5_pairs_equal"] = (kd["cardigan"]["v6"] == kd["oxford"]["v6"] and kd["cardigan"]["v6_style"] == kd["oxford"]["v6_style"]
                              and all(r["v6_h2"] for r in res["kd5"]))

    # ======================== (2) KD-16
    say("\n(2) KD-16: EVENT'S SOFTER BAND (made-up readings, no picks). Interview · Event v5 (interview band) · "
        "Event v6 (3-4) · Date")
    res["kd16"] = []
    for cid, what, rd in EVENT:
        iv = score(rd, "interview", None, "v6", styles={})
        e5, e6 = score(rd, "event", None, "v5", styles={}), score(rd, "event", None, "v6", styles={})
        dt = score(rd, "date", None, "v6", styles={})
        row = {"id": cid, "what": what, "dressiness": e6["occasion"]["dressiness"], "interview": iv["overall"],
               "event_v5": e5["overall"], "event_v6": e6["overall"], "date": dt["overall"],
               "event_v5_status": e5["occasion"]["status"], "event_v6_status": e6["occasion"]["status"]}
        res["kd16"].append(row)
        say(f"  {cid:10s} {what:66s} dress {row['dressiness']:<5} interview {iv['overall']} · event v5 {e5['overall']} "
            f"({e5['occasion']['status']}) -> v6 {e6['overall']} ({e6['occasion']['status']}) · date {dt['overall']}")
    say("  the Event ceiling by the clothes' mean dressiness (O1 + its deduction; slides and loungewear unchanged):")
    res["kd16_curve"] = []
    for d in (3.5, 3.25, 3.0, 2.75, 2.5, 2.25, 2.0, 1.75, 1.5, 1.0, 0.5):
        row = {"dressiness": d}
        for e, lo in (("v5", 3.5), ("v6", 3.0)):
            gap = lo - d
            row[e] = {"deduction": round(0.5 * P.ramp(gap, 0.25, 0.75), 3),
                      "ceiling": None if P._o1_ceiling(gap) is None else round(P._o1_ceiling(gap), 3)}
        res["kd16_curve"].append(row)
        say(f"    mean {d:4}: v5 -{row['v5']['deduction']} held to {row['v5']['ceiling']} · v6 -{row['v6']['deduction']} "
            f"held to {row['v6']['ceiling']}")

    # ======================== (3) KD-3
    say("\n(3) KD-3: THE BANDS (PB1, made-up readings, Everyday, no picks). fault = PB1 must fire; keep = it mustn't")
    res["band"] = []
    for cid, what, rd, want in BAND:
        a = {e: score(rd, "everyday", None, e, styles={}) for e in ENGINES}
        got = "fault" if fired(a["v6"]) else "keep"
        row = {"id": cid, "what": what, "want": want, "got": got, "ok": got == want, "v5": a["v5"]["overall"],
               "v6": a["v6"]["overall"], "v6_row": P.card_row(a["v6"]), "label": label_of(a["v6"]),
               "line": next((x["line"] for x in a["v6"]["parts"]["proportions"]["reasons"] if x["check"] in NEW), None)}
        res["band"].append(row)
        say(f"  [{'ok' if row['ok'] else 'MISS'}] {cid:4s} {what:100s} [{row['label']}] v5 {row['v5']} -> v6 {row['v6']} ({got}) | "
            f"{row['v6_row']}" + (f" · \"{row['line']}\"" if row["line"] else ""))
    res["band_ok"] = all(r["ok"] for r in res["band"])
    say("  v5's crossing outfits (parts5_test.CROSSING) under v6: SX1 must behave exactly as in v5")
    res["crossing"] = []
    for cid, what, rd, want in P5.CROSSING:
        a = {e: score(rd, "everyday", None, e, styles={}) for e in ENGINES}
        got = "fault" if fired(a["v6"], ("SX1_another_look",)) else "tip" if tipped(a["v6"], "SX1_tip") else "keep"
        row = {"id": cid, "want": want, "got": got, "ok": got == want, "v5": a["v5"]["overall"], "v6": a["v6"]["overall"],
               "pb1": bool(fired(a["v6"]))}
        res["crossing"].append(row)
        if not row["ok"] or row["v5"] != row["v6"]:
            say(f"    [{'ok' if row['ok'] else 'MISS'}] {cid} v5 {row['v5']} -> v6 {row['v6']} ({got}){' PB1' if row['pb1'] else ''}")
    res["crossing_ok"] = all(r["ok"] for r in res["crossing"])
    say(f"    {sum(r['ok'] for r in res['crossing'])}/{len(res['crossing'])} as expected; moved "
        f"{sum(1 for r in res['crossing'] if r['v5'] != r['v6'])}; founder cases A/B/C "
        f"{[r['v6'] for r in res['crossing'] if r['id'] in ('A', 'B', 'C')]}")

    # ======================== (4) the council's outfits, per style
    say("\n(4) THE STYLE COUNCIL'S OUTFITS BY STYLE (cases.json; made-up readings, no person; each case's own occasion, "
        "picks and boldness). adv = the advocate's rating; target = adv with 9+ held to 8.5")
    cases = [x for x in json.load(open(CASES)) if x["group"] in STYLE_OF_GROUP]
    rows = []
    for x in cases:
        picks = dict(x.get("styles_picked") or {})
        rr = {e: score(x["reading"], x["occasion"], None, e, styles=picks, bold=x.get("boldness", "a_little")) for e in ENGINES}
        if rr["v5"]["overall"] is None:
            continue
        a = P4.adv_of(x)
        diff = sorted(set(checks_of(rr["v6"])) ^ set(checks_of(rr["v5"])))
        rows.append({"id": x["id"], "style": STYLE_OF_GROUP[x["group"]], "occasion": x["occasion"], "adv": a, "tier": P4.tier(a),
                     "target": P4.target(a), **{e: rr[e]["overall"] for e in ENGINES}, "v6_row": P.card_row(rr["v6"]),
                     "changed_checks": diff})
    res["council"] = rows
    for sty in STYLE_ORDER + ["look-alike"]:
        say(f"  -- {sty}")
        for r in [r for r in rows if r["style"] == sty]:
            mv = "" if r["v5"] == r["v6"] else f" -> v6 {r['v6']}"
            say(f"    {r['id'][:34]:34s} {str(r['tier'] or '-'):10s} adv {str(r['adv']):5s} v5 {r['v5']}{mv:9s} | v6 {r['v6_row']}"
                + (f"  [{', '.join(r['changed_checks'])}]" if r["changed_checks"] else ""))
    res["by_style"] = {}
    say("\n  PER STYLE (anchors; error = engine - target): (a) plain at 6.5-7.5, (b) deliberate reaches 8, (c) mistakes <= 6")
    for sty in STYLE_ORDER:
        rs = [r for r in rows if r["style"] == sty and r["target"] is not None]
        out = {}
        for e in ENGINES:
            plain = [r for r in rs if r["tier"] == "plain"]
            deli = [r for r in rs if r["tier"] == "deliberate"]
            mist = [r for r in rs if r["tier"] == "mistake"]
            out[e] = {"n": len(rs), "mean": round(st.mean(r[e] for r in rs), 2),
                      "mean_err": round(st.mean(r[e] - r["target"] for r in rs), 2),
                      "a": [sum(1 for r in plain if 6.5 <= r[e] <= 7.5), len(plain)],
                      "b": [sum(1 for r in deli if r[e] >= 8.0), len(deli)],
                      "c": [sum(1 for r in mist if r[e] <= 6.0), len(mist)], "best": max(r[e] for r in rs)}
            o = out[e]
            say(f"    {sty:13s} {e} n={o['n']:2d} mean {o['mean']:.2f} err {o['mean_err']:+.2f} · (a) {o['a'][0]}/{o['a'][1]} · (b) "
                f"{o['b'][0]}/{o['b'][1]} · (c) {o['c'][0]}/{o['c'][1]} · best {o['best']}")
        res["by_style"][sty] = out
    other = [x for x in json.load(open(CASES)) if x["group"] not in STYLE_OF_GROUP]
    mv = []
    for x in other:
        picks = dict(x.get("styles_picked") or {})
        a = [score(x["reading"], x["occasion"], None, e, styles=picks, bold=x.get("boldness", "a_little")) for e in ENGINES]
        if a[0]["overall"] != a[1]["overall"]:
            mv.append({"id": x["id"], "occasion": x["occasion"], "v5": a[0]["overall"], "v6": a[1]["overall"],
                       "checks": sorted(set(checks_of(a[1])) ^ set(checks_of(a[0])))})
    council_moved = [r["id"] for r in rows if r["v5"] != r["v6"]]
    res["council_moved"], res["other_cases_moved"] = council_moved, mv
    say(f"  council style outfits moved: {len(council_moved)}" + (": " + ", ".join(council_moved) if council_moved else ""))
    say(f"  the other {len(other)} council cases (founder group, edge cases): v6 moves {len(mv)}"
        + ("".join(f"\n    {m['id']} ({m['occasion']}) {m['v5']} -> {m['v6']} {m['checks']}" for m in mv)))

    # ======================== (5) real photos
    say("\n(5) REAL PHOTOS (one reading per photo, its own occasion; the corpus + the newest pull)")
    rows_r = {}
    for k, v in prim.items():
        sl = T.second_look_for(k, U, L)
        rows_r[k] = {"who": T.who(k), "occ": v["occ"], "src": v["src"], **{e: score(v["reading"], v["occ"], sl, e) for e in ENGINES}}
    sel = [k for k, r in rows_r.items() if all(r[e]["overall"] is not None for e in ENGINES)]
    moved = [k for k in sel if rows_r[k]["v6"]["overall"] != rows_r[k]["v5"]["overall"]]
    raw_moved = [k for k in sel if rows_r[k]["v6"]["raw_score"] != rows_r[k]["v5"]["raw_score"]]
    fire = {k: [c for c in checks_of(rows_r[k]["v6"]) if c not in checks_of(rows_r[k]["v5"])] +
            [f"-{c}" for c in checks_of(rows_r[k]["v5"]) if c not in checks_of(rows_r[k]["v6"])] for k in raw_moved}
    pb2 = [k for k in sel if tipped(rows_r[k]["v6"], "PB2_wide_leg_band")]
    occ_count = Counter(rows_r[k]["occ"] for k in sel)
    say(f"  {len(sel)} photos ({dict(occ_count)}); shown score moves on {len(moved)}; raw moves on {len(raw_moved)}; "
        f"PB2's tip on {len(pb2)}" + (": " + ", ".join(pb2) if pb2 else ""))
    for k in raw_moved:
        say(f"    {k} [{T.WHO_TEXT[rows_r[k]['who']]}; {rows_r[k]['occ']}; {label_of(rows_r[k]['v6'])}] {rows_r[k]['v5']['overall']} -> "
            f"{rows_r[k]['v6']['overall']} (raw {rows_r[k]['v5']['raw_score']} -> {rows_r[k]['v6']['raw_score']}) {fire[k]} | "
            f"{P.card_row(rows_r[k]['v6'])}")
    res["real_moved"], res["real_raw_moved"], res["real_pb2"] = moved, fire, pb2
    res["spread"] = {}
    for e in ENGINES:
        line, b = Q.band_line(f"all photos · {e}", [rows_r[k][e]["overall"] for k in sel])
        say(line); res["spread"][e] = b
    say("  per 'Reads as' (v6's label), mean v5 -> v6 and how many moved:")
    res["real_by_style"] = {}
    by = defaultdict(list)
    for k in sel:
        by[label_of(rows_r[k]["v6"])].append(k)
    for lab in sorted(by, key=lambda s: -len(by[s])):
        ks = by[lab]
        a5 = st.mean(rows_r[k]["v5"]["overall"] for k in ks)
        a6 = st.mean(rows_r[k]["v6"]["overall"] for k in ks)
        n = sum(1 for k in ks if k in moved)
        res["real_by_style"][lab] = {"n": len(ks), "v5": round(a5, 2), "v6": round(a6, 2), "moved": n}
        say(f"    {lab:14s} n={len(ks):2d}  v5 {a5:.2f} -> v6 {a6:.2f}  moved {n}")
    say("  real photos with a roomy top (volume >= 4) worn on its own, and why PB1 does or doesn't fire:")
    res["roomy"] = []
    for k in sorted(sel):
        gs = R.scored_garments(prim[k]["reading"])
        t0 = next((g for g in gs if g.get("category") == "top"), None)
        if not t0 or (t0.get("volume") or 3) < 4 or any(g.get("category") == "outerwear" for g in gs):
            continue
        b0 = next((g for g in gs if g.get("category") == "bottom"), None)
        line = {"key": k, "who": T.WHO_TEXT[rows_r[k]["who"]], "top": f"{t0.get('subcategory')} v{t0.get('volume')} {t0.get('length')}"
                f"{' tucked' if t0.get('tucked') == 'full' else ''}", "bottom": f"{b0.get('subcategory')} {b0.get('leg_shape')}" if b0 else "-",
                "reads": rows_r[k]["v6"]["detected_styles"], "fired": fired(rows_r[k]["v6"])}
        res["roomy"].append(line)
        say(f"    {k:26s} {line['who']:30s} {line['top']:28s} {line['bottom']:18s} reads {'/'.join(line['reads']) or '-':24s}"
            + (" [PB1]" if line["fired"] else ""))
    say("  every real photo at Event (v5 -> v6), the KD-16 change on real clothes:")
    ev = {k: [score(prim[k]["reading"], "event", T.second_look_for(k, U, L), e)["overall"] for e in ENGINES] for k in sel}
    ev_moved = {k: v for k, v in ev.items() if v[0] != v[1]}
    res["real_event"] = {"n": len(ev), "moved": len(ev_moved), "up": sum(1 for v in ev_moved.values() if v[1] > v[0]),
                         "mean_v5": round(st.mean(v[0] for v in ev.values()), 2), "mean_v6": round(st.mean(v[1] for v in ev.values()), 2),
                         "by_v5": dict(sorted(Counter(f"{v[0]}->{v[1]}" for v in ev_moved.values()).items()))}
    say(f"    {res['real_event']}")

    # ======================== (6) steadiness
    say("\n(6) 3-RUN STEADINESS (Everyday, the test profile)")
    res["steady"] = {}

    def steady_set(runsets, with_sl, label, lit=None):
        per = defaultdict(dict)
        for k, runs in runsets.items():
            runs = runs[:3]
            if lit is not None:
                if k not in lit or len(lit[k]) < 3:
                    continue
                runs = [Q.with_lightness(j, lit[k][i]) for i, j in enumerate(runs)]
            for e in ENGINES:
                per[k][e] = [score(j, "everyday", T.second_look_for(k, U, L, i) if with_sl else None, e)["overall"]
                             for i, j in enumerate(runs)]
        out = {}
        for e in ENGINES:
            vals = [per[k][e] for k in per if None not in per[k][e] and len(per[k][e]) == 3]
            med = sum(1 for v in vals if all(abs(x - st.median(v)) <= 0.5 for x in v))
            ex = sum(1 for v in vals if len(set(v)) == 1)
            out[e] = {"within_0.5_of_median": [med, len(vals)], "exact": [ex, len(vals)]}
        diff = [k for k in per if per[k]["v5"] != per[k]["v6"]]
        out["v6_differs_from_v5_on"] = {k: per[k] for k in diff}
        say(f"  {label}")
        for e in ENGINES:
            o = out[e]
            say(f"    {e} within 0.5 of median {o['within_0.5_of_median'][0]}/{o['within_0.5_of_median'][1]} · exact "
                f"{o['exact'][0]}/{o['exact'][1]}")
        say(f"    photos where any v6 run differs from v5: {len(diff)}" + (": " + "; ".join(
            f"{k} v5 {per[k]['v5']} v6 {per[k]['v6']}" for k in diff) if diff else ""))
        return out

    res["steady"]["b1_A"] = steady_set(B1, True, "batch 1 arm A (validation), second look run i paired")
    res["steady"]["zoom1_B"] = steady_set(Z, False, "zoom1 + zoom1-stock arm B (design set)")
    res["steady"]["b1_A_lightness"] = steady_set(B1, True, "batch 1 arm A + lightness from arm B1 run i", lit=B1L)
    say("  PB1 and v6's H2 on every multi-run reading set (photos where they fire in any run / in some but not all runs):")
    res["fire"] = {}
    for path in ("results/b1/raw.json", "results/zoom1/raw.json", "results/zoom1-stock/raw.json"):
        raw = json.load(open(HERE / path))
        for arm in sorted({x["arm"] for x in raw}):
            byk = T.load_runs(HERE / path, arm)
            out = {"photos": len(byk), "readings": 0}
            for name, pred in (("PB1", lambda r5, r6: bool(fired(r6))),
                               ("H2 new", lambda r5, r6: "H2_clear_top_to_toe" in checks_of(r6) and "H2_clear_top_to_toe" not in checks_of(r5))):
                fires, flips = [], []
                for k, runs in byk.items():
                    hit = []
                    for j in runs[:3]:
                        if not j:
                            continue
                        r6 = score(j, "everyday", None, "v6")
                        if r6["overall"] is None:
                            continue
                        hit.append(pred(score(j, "everyday", None, "v5"), r6))
                    if any(hit):
                        fires.append(k)
                        if not all(hit):
                            flips.append(k)
                out[name] = {"fires": fires, "flips": flips}
            out["readings"] = sum(1 for runs in byk.values() for j in runs[:3] if j)
            nm = f"{path.split('/')[1]} {arm}"
            res["fire"][nm] = out
            say(f"    {nm:16s} photos {len(byk):2d} · readings {out['readings']:3d} · PB1 fires on {len(out['PB1']['fires'])} "
                f"(flips {len(out['PB1']['flips'])}{': ' + ', '.join(out['PB1']['flips']) if out['PB1']['flips'] else ''}) · "
                f"new H2 on {len(out['H2 new']['fires'])} (flips {len(out['H2 new']['flips'])})")

    # ======================== (7) judge pilot
    say("\n(7) AGAINST THE JUDGE PILOT (panel = median of 5 judges' weighted totals), the v2 split")
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

    # ======================== (8) his, his friends' and the unknowns' checks + targets
    say("\n(8) EVERY CHECK OF THE FOUNDER, HIS FRIENDS AND THE TWO UNKNOWNS (own occasion): v5 -> v6")
    res["checks"] = []
    mine = sorted([k for k in rows_r if rows_r[k]["who"] in ("founder", "friend", "unknown")],
                  key=lambda k: (rows_r[k]["who"] != "friend", rows_r[k]["who"], k))
    for k in mine:
        r = rows_r[k]
        line = {"key": k, "who": T.WHO_TEXT[r["who"]], "occ": r["occ"], "v5": r["v5"]["overall"], "v6": r["v6"]["overall"],
                "v6_row": P.card_row(r["v6"]), "label": label_of(r["v6"])}
        res["checks"].append(line)
        say(f"  {k:16s} [{line['who']}; {r['occ']}; {line['label']}] v5 {line['v5']} -> v6 {line['v6']} | {line['v6_row']}")
    tg = {x["key"]: x for x in res["checks"]}
    deli = [r for r in rows if r["tier"] == "deliberate"]
    plain = [r for r in rows if r["tier"] == "plain"]
    targets = [
        ("KD-5: the oxford + chinos + loafers scores the same with any prep marker", res["kd5_pairs_equal"]),
        ("KD-3: every band outfit behaves as expected (fault / keep)", res["band_ok"]),
        ("v5's crossing outfits behave as in v5 (SX1, one fact one charge); founder cases A/B/C at 6.5",
         res["crossing_ok"] and all(r["v6"] == 6.5 for r in res["crossing"] if r["id"] in ("A", "B", "C"))),
        ("KD-16: no Event score drops, and slides and loungewear stay held to 4.0 at Event",
         all(r["event_v6"] >= r["event_v5"] for r in res["kd16"]) and all(r["event_v6"] <= 4.0 for r in res["kd16"] if r["id"] in ("slides", "sweats"))),
        ("the friend's blazer d1967f at 7 or below", tg["phone-d1967f"]["v6"] <= 7.0),
        ("the chore coat (e438d4, f4870b, fb0b17) at 7-7.5",
         all(7.0 <= tg[k]["v6"] <= 7.5 for k in ("phone-e438d4", "phone-f4870b", "phone-fb0b17"))),
        ("his gingham fits as now (5a9049, 7f14a4, f07193)",
         all(tg[k]["v6"] == tg[k]["v5"] for k in ("phone-5a9049", "phone-7f14a4", "phone-f07193"))),
        ("his black tee + wide jeans + white leather sneakers (8ad378, 403ade) at 7",
         all(tg[k]["v6"] == 7.0 for k in ("phone-8ad378", "phone-403ade"))),
        (f"council deliberate fits that reached 8 under v5 still do ({sum(1 for r in deli if r['v5'] >= 8)} under v5)",
         all(r["v6"] >= 8 for r in deli if r["v5"] >= 8)),
        ("council plain fits that sat at 6.5-7.5 under v5 still do",
         all(6.5 <= r["v6"] <= 7.5 for r in plain if 6.5 <= r["v5"] <= 7.5)),
    ]
    b1 = res["steady"]["b1_A"]["v6"]["within_0.5_of_median"]
    targets.append((f"batch 1 arm A steady 49/49 ({b1[0]}/{b1[1]})", b1[0] >= 49 and b1[0] == b1[1]))
    b = res["judge"]["all"]["v6"]
    targets.append((f"panel gap within +-0.2 ({b['mean_diff']:+.2f})", abs(b["mean_diff"]) <= 0.2))
    a, b = res["judge"]["held"]["v5"], res["judge"]["held"]["v6"]
    targets.append((f"no loss on the held-out half (within 0.5: v5 {a['within_0.5']} -> v6 {b['within_0.5']}; MAE {a['mae']} -> "
                    f"{b['mae']})", b["within_0.5"] >= a["within_0.5"] and b["mae"] <= a["mae"]))
    p8 = res["spread"]["v6"]["pct8"]
    targets.append((f"8+ at 5-12% on the real photos ({p8}%)", 5 <= p8 <= 12))

    # ======================== (9) picks never move a number
    say("\n(9) PICKS NEVER MOVE A NUMBER: every test outfit, council case and real photo under no picks, each single "
        "style and three picks")
    keys7 = ["streetwear", "workwear", "vintage_sport", "outdoor", "minimalist", "classic_prep", "smart_casual"]
    variants = [{}] + [{s: 1.0} for s in keys7] + [{"streetwear": 0.5, "minimalist": 0.25, "smart_casual": 0.25}]
    bad = []
    pool = ([(c[0], c[2], "everyday", "a_little") for c in BAND] + [(c[0], c[2], "everyday", "a_little") for c in KD5]
            + [(c[0], c[2], "event", "a_little") for c in EVENT]
            + [(x["id"], x["reading"], x["occasion"], x.get("boldness", "a_little")) for x in json.load(open(CASES))]
            + [(k, prim[k]["reading"], prim[k]["occ"], "a_little") for k in sel])
    for cid, rd, occ, bold in pool:
        outs = {(r["overall"], r.get("raw_score")) for r in (score(rd, occ, None, "v6", styles=v, bold=bold) for v in variants)}
        if len(outs) > 1:
            bad.append(cid)
    res["picks_moved"] = bad
    say(f"  readings whose score changed with the picks: {len(bad)} of {len(pool)}" + (": " + ", ".join(bad) if bad else ""))
    targets.append(("picks never change a score", not bad))

    say("\n  targets:")
    res["targets"] = []
    for name, ok in targets:
        res["targets"].append({"target": name, "met": ok})
        say(f"    [{'met' if ok else 'NOT MET'}] {name}")

    # ======================== (10) the size, and what-ifs (not adopted)
    say("\n(10) THE SIZE AND THE WHAT-IFS (real 8+ and how many photos move vs v5; b1 A steady; judge all / held mean diff "
        "and within 0.5; band outfits B1 / B4 / B5; band misses)")
    variants = {
        "v5 (none of the three)": ("v5", {}),
        "PB1 -0.75 (half a step)": ("v6", {"pb": 0.75}),
        "PB1 -1.0": ("v6", {"pb": 1.0}),
        "v6 as built (PB1 -1.5)": ("v6", {}),
        "PB1 -2.0": ("v6", {"pb": 2.0}),
        "PB1 -3.0 (SX1's size)": ("v6", {"pb": 3.0}),
        "PB1 off (H2 + Event only)": ("v6", {"pb": 0.0}),
        "H2 on the label only (KD-5 not fixed)": ("v6", {"h2_any": False}),
        "Event on the interview band (KD-16 not fixed)": ("v6", {"occ_target": {}}),
        "PB1 never over slim legs in streetwear, minimal, workwear, vintage sport (council's union per side)":
            ("v6", {"pb_roomy_narrow": frozenset(P.TUNE["v6"]["pb_roomy_full"])}),
    }
    res["ablations"] = {}
    base5 = {k: rows_r[k]["v5"]["overall"] for k in sel}
    for name, (eng, tn) in variants.items():
        vals = {k: score(prim[k]["reading"], prim[k]["occ"], T.second_look_for(k, U, L), eng, tn)["overall"] for k in sel}
        b = Q.bands(list(vals.values()))
        hs = []
        for k, runs in B1.items():
            v = [score(j, "everyday", T.second_look_for(k, U, L, i), eng, tn)["overall"] for i, j in enumerate(runs[:3])]
            if None not in v:
                hs.append(all(abs(x - st.median(v)) <= 0.5 for x in v))
        jj = {side: Q.cmp_stats([(vals[x["key"]], x["panel"]) for x in jp if side == "all" or half[x["id"]] == side])
              for side in ("all", "held")}
        bo = {cid: score(rd, "everyday", None, eng, tn, styles={})["overall"] for cid, _, rd, _ in BAND if cid in ("B1", "B4", "B5")}
        miss = [cid for cid, _, rd, want in BAND if ("fault" if fired(score(rd, "everyday", None, eng, tn, styles={})) else "keep") != want]
        s = {"8+": b["8+"], "pct8": b["pct8"], "moved_vs_v5": sum(1 for k in sel if vals[k] != base5[k]), "b1": [sum(hs), len(hs)],
             "all": jj["all"], "held": jj["held"], "band": bo, "band_misses": miss}
        res["ablations"][name] = s
        say(f"  {name:55s} 8+ {s['8+']} ({s['pct8']}%) · moved {s['moved_vs_v5']} · b1 {s['b1'][0]}/{s['b1'][1]} · all "
            f"{jj['all']['mean_diff']:+.2f}/{jj['all']['within_0.5']} · held {jj['held']['mean_diff']:+.2f}/{jj['held']['within_0.5']} · "
            f"B1/B4/B5 {list(bo.values())}" + (f" · band misses {len(miss)}" if miss and name not in ("v5 (none of the three)",) else ""))

    (OUT / "analysis.txt").write_text("\n".join(LINES) + "\n")
    json.dump(res, open(OUT / "analysis.json", "w"), indent=1,
              default=lambda o: sorted(o) if isinstance(o, (set, frozenset)) else str(o))


if __name__ == "__main__":
    main()

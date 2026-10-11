#!/usr/bin/env python3
"""Style-crossing paper test (Oct 11): parts engine v4 (parts-proto-4) vs v5 (parts-proto-5, the default: v4 plus
SX1 "a piece from another look" in Style). No API calls, no money.

  /usr/bin/python3 parts5_test.py     -> results/parts5/analysis.txt + analysis.json
                                         (report: ../rubric/research/parts/style-clash.md)

Same readings, loaders and judge-pilot split as parts4_test.py / parts2_test.py (results/parts2/split.json).

Rule 7: the founder is profile pending (no birth year or picked looks given yet); his friends are profile unknown;
703a8b and ebe23f are unknown (ask the founder); stock and web photos are profile unknown; the style council's cases
and the crossing outfits below are made-up readings with no person (each council case is scored with the picks and
boldness written in it; the crossing outfits with no picks). Real photos are scored with ONE stated test profile:
picks Minimal + Smart casual (0.5 each), boldness "a little", no age. No engine lets picks or age move a number, so
no split by age band or picked look is possible; section (7) re-checks that picks can't move SX1.
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
import parts4_test as P4  # noqa: E402

OUT = HERE / "results" / "parts5"
ENGINES = ("v4", "v5")
NEW = ("SX1_another_look",)
LINES = []
CASES = K / "rubric/research/style-council/cases.json"
STYLE_OF_GROUP = S3.STYLE_OF_GROUP
STYLE_ORDER = P4.STYLE_ORDER


def say(s=""):
    LINES.append(s)
    print(s)


def score(reading, occ, sl=None, engine="v5", tune=None, styles=None, bold=None):
    return P.score_parts(reading, occ, styles if styles is not None else Q.PROFILE, sl, bold or Q.BOLD, engine=engine,
                         tune=tune)


checks_of = S3.checks_of
label_of = S3.label_of


def fired(r):
    return [c for c in checks_of(r) if c in NEW]


def tipped(r):
    return any(t["check"] == "SX1_tip" for p in (r.get("parts") or {}).values() for t in p.get("tips", []))


# ------------------------------------------------------------------------------------------- the crossing outfits
def G(cat, sub, color="black", vol=3, leg="na", hem="na", tucked="na", length="na", pattern="solid", logo="none", **kw):
    g = {"category": cat, "subcategory": sub, "color_family": color, "pattern": pattern, "logo": logo, "volume": vol,
         "leg_shape": leg, "hem": hem, "tucked": tucked, "condition": "clean", "certainty": "clear", "length": length,
         "pattern_scale": "na" if pattern in ("solid", "graphic") else "medium", "saturation": "na",
         "sleeve_end": "at_wrist" if cat in ("top", "outerwear") else "na", "strain": "none",
         "distressed_by_design": False, "shows_below_outer": False}
    g.update(kw)
    return g


def Rd(*gs):
    return {"scene": {"framing": "full_body", "shoes_visible": True, "people_count": 1, "mirror_selfie": False,
                      "lighting": "good", "clothed": "fully"}, "garments": list(gs)}


def top(sub, color="white", vol=3, **kw):
    kw.setdefault("tucked", "none"); kw.setdefault("length", "mid_fly")
    if sub == "graphic_tee":
        kw.setdefault("pattern", "graphic")
    return G("top", sub, color, vol, **kw)


TROUSERS = G("bottom", "trousers", "charcoal", 3, "straight", "slight_break")
WIDE_TROUSERS = G("bottom", "trousers", "black", 3, "wide", "slight_break")
SLIM_CHINOS = G("bottom", "chinos", "khaki_beige", 3, "slim", "slight_break")
CHINOS = G("bottom", "chinos", "khaki_beige", 3, "straight", "slight_break")
WIDE_JEANS = G("bottom", "jeans", "denim_light", 3, "wide", "cuffed")
DARK_JEANS = G("bottom", "jeans", "denim_dark", 3, "straight", "slight_break")
SUIT_TR = G("bottom", "suit_trousers", "navy", 3, "straight", "no_break")
LOAFER = G("footwear", "loafer", "brown")
LOAFER_BK = G("footwear", "loafer", "black")
DRESS = G("footwear", "dress_shoe", "black")
WLS = G("footwear", "white_leather_sneaker", "white")
CHUNKY = G("footwear", "chunky_sneaker", "white")
LOWP = G("footwear", "low_profile_sneaker", "black")

# (id, what, reading, expectation): "fault" should fire SX1 (the founder's direction), "keep" must not (a
# research-endorsed mix or an ordinary outfit), "tip" fires only the tip
CROSSING = [
    ("A", "oversized graphic tee + pleated trousers + loafers (founder case 1)",
     Rd(top("graphic_tee", "white", 4), TROUSERS, LOAFER_BK), "fault"),
    ("B", "oversized hoodie + slim chinos + loafers (founder case 2)",
     Rd(top("hoodie", "grey", 4), SLIM_CHINOS, LOAFER), "fault"),
    ("C", "oversized plain tee + slim chinos + loafers (founder case 3)",
     Rd(top("tee", "white", 4), SLIM_CHINOS, LOAFER), "fault"),
    ("A3", "graphic tee (regular) + trousers + loafers", Rd(top("graphic_tee", "black"), TROUSERS, LOAFER_BK), "fault"),
    ("A-wide", "graphic tee + wide trousers + loafers (a minimal rest)", Rd(top("graphic_tee", "black"), WIDE_TROUSERS, LOAFER_BK), "fault"),
    ("A-flip", "the same, with the print read as solid (the flip-prone `pattern`)",
     Rd(top("graphic_tee", "black", pattern="solid"), WIDE_TROUSERS, LOAFER_BK), "fault"),
    ("A-derby", "graphic tee + chinos + derbies", Rd(top("graphic_tee", "black"), CHINOS, G("footwear", "derby", "brown")), "fault"),
    ("A-suit", "graphic tee + suit trousers + dress shoes (H3's spread also fires)", Rd(top("graphic_tee", "white"), SUIT_TR, DRESS), "fault"),
    ("A-bomber", "graphic tee under a bomber + pleated trousers + loafers (a street layer doesn't bridge)",
     Rd(top("graphic_tee", "white"), G("outerwear", "bomber", "black"), TROUSERS, LOAFER_BK), "fault"),
    ("B-sweat", "oversized sweatshirt + slim chinos + loafers", Rd(top("sweatshirt", "grey", 4), SLIM_CHINOS, LOAFER), "fault"),
    ("K-sweat", "oversized sweatshirt + straight chinos + loafers (the rest reads minimal; its band allows 4)",
     Rd(top("sweatshirt", "grey", 4), CHINOS, LOAFER), "keep"),
    # keeps: research-endorsed or ordinary
    ("K1", "tee under an unstructured blazer + trousers + loafers (endorsed)",
     Rd(top("tee", "white"), G("outerwear", "unstructured_blazer", "navy"), TROUSERS, LOAFER), "keep"),
    ("K2", "hoodie under a topcoat + trousers + loafers (debatable: kept, the layer bridges)",
     Rd(top("hoodie", "grey"), G("outerwear", "overcoat", "camel" if False else "tan_camel"), TROUSERS, LOAFER), "keep"),
    ("K3", "oversized graphic tee under a blazer + trousers + loafers (kept: the layer bridges; a call)",
     Rd(top("graphic_tee", "black", 4), G("outerwear", "blazer", "navy"), TROUSERS, LOAFER_BK), "keep"),
    ("K3b", "graphic tee under a chore coat + chinos + loafers (the chore coat is smart casual's home piece)",
     Rd(top("graphic_tee", "black"), G("outerwear", "chore_coat", "tan_camel"), CHINOS, LOAFER), "keep"),
    ("K4", "grey sweatshirt + navy chinos + loafers (Ivy; council edge-tap-sweater 7.5)",
     Rd(top("sweatshirt", "grey"), G("bottom", "chinos", "navy", 3, "straight", "slight_break"), LOAFER), "keep"),
    ("K5", "regular hoodie + chinos + loafers (hoodie vs sweatshirt flips, so not street-coded)",
     Rd(top("hoodie", "grey"), CHINOS, LOAFER), "keep"),
    ("K6", "boxy tee at the belt + wide trousers + loafers (city boy)",
     Rd(top("tee", "black", 4, length="at_belt"), WIDE_TROUSERS, LOAFER_BK), "keep"),
    ("K7", "oversized tee + wide trousers + loafers (reads minimal; its band allows 4)",
     Rd(top("tee", "black", 4), WIDE_TROUSERS, LOAFER_BK), "keep"),
    ("K8", "roomy knit + chinos + loafers (the look's own piece)", Rd(top("sweater", "navy", 4), CHINOS, LOAFER), "keep"),
    ("K9", "oversized oxford + slim chinos + loafers (the look's own piece)", Rd(top("oxford_shirt", "light_blue", 4), SLIM_CHINOS, LOAFER), "keep"),
    ("K10", "graphic tee + wide jeans + loafers (one dressy piece; loafers with wide jeans are endorsed)",
     Rd(top("graphic_tee", "black"), WIDE_JEANS, LOAFER_BK), "keep"),
    ("K11", "graphic tee + khaki chinos + white leather sneakers (one dressy piece; tip only)",
     Rd(top("graphic_tee", "black"), CHINOS, WLS), "tip"),
    ("K12", "graphic tee + black trousers + white leather sneakers (one dressy piece; tip only)",
     Rd(top("graphic_tee", "white"), G("bottom", "trousers", "black", 3, "straight", "slight_break"), WLS), "tip"),
    ("K13", "oversized graphic tee + wide jeans + chunky sneakers (streetwear done right)",
     Rd(top("graphic_tee", "black", 4), WIDE_JEANS, CHUNKY), "keep"),
    ("K14", "graphic tee + dark jeans + low-profile sneakers", Rd(top("graphic_tee", "black"), DARK_JEANS, LOWP), "keep"),
    ("K15", "jersey under an unstructured blazer + dark jeans + low-profile (council vs-9)",
     Rd(top("jersey", "red", logo="large"), G("outerwear", "unstructured_blazer", "navy"), DARK_JEANS, LOWP), "keep"),
    ("K16", "plain tee + chinos + loafers", Rd(top("tee", "white"), CHINOS, LOAFER), "keep"),
    ("K17", "oversized hoodie + slim dark jeans + loafers (one dressy piece)",
     Rd(top("hoodie", "grey", 4), G("bottom", "jeans", "denim_dark", 3, "slim", "slight_break"), LOAFER), "keep"),
]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    prim, B1, B1L, U, L, Z = Q.load()
    added = {k: (sorted(v) if isinstance(v, frozenset) else v) for k, v in P.TUNE["v5"].items()
             if k not in P.TUNE["v4"] or P.TUNE["v4"][k] != v}
    res = {"profile": "test profile: picks Minimal + Smart casual (0.5 each), boldness a little, no age",
           "engines": {e: P.VERSIONS[e] for e in ENGINES}, "tune_v5_added": added}
    say(f"STYLE-CROSSING PAPER TEST · v4 = {P.VERSIONS['v4']} · v5 = {P.VERSIONS['v5']} (default)")
    say(f"  {res['profile']}. Rule 7: founder profile pending; friends profile unknown; 703a8b and ebe23f unknown "
        f"(ask the founder); stock/web profile unknown; council and crossing outfits are made-up readings with no person.")
    say(f"  v5's changes from v4: {added}")

    # ======================== (1) the crossing outfits
    say("\n(1) THE CROSSING OUTFITS (made-up readings, no person, Everyday, no picks). fault = should lose points; "
        "keep = must not; tip = a tip, no points")
    res["crossing"] = []
    for cid, what, rd, want in CROSSING:
        a = {e: score(rd, "everyday", None, e, styles={}) for e in ENGINES}
        got = "fault" if fired(a["v5"]) else "tip" if tipped(a["v5"]) else "keep"
        ok = got == want
        row = {"id": cid, "what": what, "want": want, "got": got, "ok": ok, "v4": a["v4"]["overall"], "v5": a["v5"]["overall"],
               "v5_row": P.card_row(a["v5"]), "label": label_of(a["v5"])}
        res["crossing"].append(row)
        say(f"  [{'ok' if ok else 'MISS'}] {cid:7s} {what:92s} v4 {row['v4']} -> v5 {row['v5']} ({got}) | {row['v5_row']}")
    res["crossing_ok"] = all(r["ok"] for r in res["crossing"])

    # ======================== (2) the council's outfits, per style
    say("\n(2) THE STYLE COUNCIL'S OUTFITS BY STYLE (cases.json; made-up readings, no person; each case's own occasion, "
        "picks and boldness). adv = the advocate's rating; target = adv with 9+ held to 8.5")
    cases = [x for x in json.load(open(CASES)) if x["group"] in STYLE_OF_GROUP]
    rows = []
    for x in cases:
        picks = dict(x.get("styles_picked") or {})
        rr = {e: score(x["reading"], x["occasion"], None, e, styles=picks, bold=x.get("boldness", "a_little")) for e in ENGINES}
        if rr["v4"]["overall"] is None:
            continue
        a = P4.adv_of(x)
        rows.append({"id": x["id"], "style": STYLE_OF_GROUP[x["group"]], "adv": a, "tier": P4.tier(a), "target": P4.target(a),
                     **{e: rr[e]["overall"] for e in ENGINES}, "v5_row": P.card_row(rr["v5"]), "v5_new": fired(rr["v5"])})
    res["council"] = rows
    for sty in STYLE_ORDER + ["look-alike"]:
        say(f"  -- {sty}")
        for r in [r for r in rows if r["style"] == sty]:
            mv = "" if r["v4"] == r["v5"] else f" -> v5 {r['v5']}"
            say(f"    {r['id'][:34]:34s} {str(r['tier'] or '-'):10s} adv {str(r['adv']):5s} v4 {r['v4']}{mv:9s} | v5 {r['v5_row']}"
                + (f"  [{', '.join(r['v5_new'])}]" if r["v5_new"] else ""))
    res["by_style"] = {}
    say("\n  PER STYLE (anchors; error = engine - target): (a) plain at 6.5-7.5, (b) deliberate reaches 8, (c) mistakes <= 6")
    for sty in STYLE_ORDER:
        rs = [r for r in rows if r["style"] == sty and r["target"] is not None]
        out = {}
        for e in ENGINES:
            plain = [r for r in rs if r["tier"] == "plain"]
            deli = [r for r in rs if r["tier"] == "deliberate"]
            mist = [r for r in rs if r["tier"] == "mistake"]
            out[e] = {"n": len(rs), "mean_err": round(st.mean(r[e] - r["target"] for r in rs), 2),
                      "a": [sum(1 for r in plain if 6.5 <= r[e] <= 7.5), len(plain)],
                      "b": [sum(1 for r in deli if r[e] >= 8.0), len(deli)],
                      "c": [sum(1 for r in mist if r[e] <= 6.0), len(mist)], "best": max(r[e] for r in rs)}
            o = out[e]
            say(f"    {sty:13s} {e} n={o['n']:2d} mean err {o['mean_err']:+.2f} · (a) {o['a'][0]}/{o['a'][1]} · (b) "
                f"{o['b'][0]}/{o['b'][1]} · (c) {o['c'][0]}/{o['c'][1]} · best {o['best']}")
        res["by_style"][sty] = out
    other = [x for x in json.load(open(CASES)) if x["group"] not in STYLE_OF_GROUP]
    mv = []
    for x in other:
        picks = dict(x.get("styles_picked") or {})
        a = [score(x["reading"], x["occasion"], None, e, styles=picks, bold=x.get("boldness", "a_little"))["overall"] for e in ENGINES]
        if a[0] != a[1]:
            mv.append(f"{x['id']} {a[0]}->{a[1]}")
    council_moved = [r["id"] for r in rows if r["v4"] != r["v5"]]
    res["council_moved"], res["other_cases_moved"] = council_moved, mv
    say(f"  council style outfits moved: {len(council_moved)}" + (": " + ", ".join(council_moved) if council_moved else ""))
    say(f"  the other {len(other)} council cases (founder group, edge cases): v5 moves {len(mv)}" + (": " + "; ".join(mv) if mv else ""))

    # ======================== (3) real photos
    say("\n(3) REAL PHOTOS (one reading per photo, its own occasion)")
    rows_r = {}
    for k, v in prim.items():
        sl = T.second_look_for(k, U, L)
        rows_r[k] = {"who": T.who(k), "occ": v["occ"], **{e: score(v["reading"], v["occ"], sl, e) for e in ENGINES}}
    sel = [k for k, r in rows_r.items() if all(r[e]["overall"] is not None for e in ENGINES)]
    moved = [k for k in sel if rows_r[k]["v5"]["overall"] != rows_r[k]["v4"]["overall"]]
    raw_moved = [k for k in sel if rows_r[k]["v5"]["raw_score"] != rows_r[k]["v4"]["raw_score"]]
    fire = {k: fired(rows_r[k]["v5"]) for k in sel if fired(rows_r[k]["v5"])}
    tips = [k for k in sel if tipped(rows_r[k]["v5"])]
    say(f"  shown score moves on {len(moved)}/{len(sel)}; raw moves on {len(raw_moved)}; SX1 fires on {len(fire)}"
        + (": " + ", ".join(fire) if fire else "") + f"; SX1's tip on {len(tips)}" + (": " + ", ".join(tips) if tips else ""))
    for k in moved:
        say(f"    {k} [{T.WHO_TEXT[rows_r[k]['who']]}] {rows_r[k]['v4']['overall']} -> {rows_r[k]['v5']['overall']} | "
            f"{P.card_row(rows_r[k]['v5'])}")
    res["real_moved"], res["real_fired"], res["real_tips"] = moved, fire, tips
    res["spread"] = {}
    for e in ENGINES:
        line, b = Q.band_line(f"all photos · {e}", [rows_r[k][e]["overall"] for k in sel])
        say(line); res["spread"][e] = b
    # near misses: every real reading with a street-coded top and no layer, and why SX1 doesn't fire
    say("  real photos with a street-coded top (graphic tee or volume >= 4), layered or not:")
    res["near"] = []
    for k in sorted(sel):
        gs = R.scored_garments(prim[k]["reading"])
        tops = [g for g in gs if g.get("category") == "top" and (g.get("subcategory") == "graphic_tee" or (g.get("volume") or 3) >= 4)]
        if not tops:
            continue
        rest = [g for g in gs if g.get("category") in R.SLOT and g is not tops[0]]
        dressy = [g.get("subcategory") for g in rest if g.get("subcategory") in P.TUNE["v5"]["sx_dressy"]]
        line = {"key": k, "who": T.WHO_TEXT[rows_r[k]["who"]], "top": f"{tops[0].get('subcategory')} v{tops[0].get('volume')}",
                "rest": [f"{g.get('subcategory')}" for g in rest], "dressy": dressy,
                "rest_reads": R.detect_styles(rest)["detected"], "fired": fired(rows_r[k]["v5"])}
        res["near"].append(line)
        say(f"    {k:26s} {line['who']:28s} {line['top']:16s} rest {'/'.join(line['rest']):48s} dressy {len(dressy)} · rest reads "
            f"{'/'.join(line['rest_reads']) or '-'}" + (" [SX1]" if line["fired"] else ""))

    # ======================== (4) steadiness
    say("\n(4) 3-RUN STEADINESS (Everyday, the test profile)")
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
        diff = [k for k in per if per[k]["v4"] != per[k]["v5"]]
        out["v5_differs_from_v4_on"] = {k: per[k] for k in diff}
        say(f"  {label}")
        for e in ENGINES:
            o = out[e]
            say(f"    {e} within 0.5 of median {o['within_0.5_of_median'][0]}/{o['within_0.5_of_median'][1]} · exact "
                f"{o['exact'][0]}/{o['exact'][1]}")
        say(f"    photos where any v5 run differs from v4: {len(diff)}" + (": " + "; ".join(
            f"{k} v4 {per[k]['v4']} v5 {per[k]['v5']}" for k in diff) if diff else ""))
        return out

    res["steady"]["b1_A"] = steady_set(B1, True, "batch 1 arm A (validation), second look run i paired")
    res["steady"]["zoom1_B"] = steady_set(Z, False, "zoom1 + zoom1-stock arm B (design set)")
    res["steady"]["b1_A_lightness"] = steady_set(B1, True, "batch 1 arm A + lightness from arm B1 run i", lit=B1L)
    say("  SX1 on every multi-run reading set (photos where it fires in any run / in some but not all runs), and how "
        "often its two readings flip there (top subcategory graphic_tee; top volume >= 4):")
    res["fire"] = {}
    for path in ("results/b1/raw.json", "results/zoom1/raw.json", "results/zoom1-stock/raw.json"):
        raw = json.load(open(HERE / path))
        for arm in sorted({x["arm"] for x in raw}):
            by = T.load_runs(HERE / path, arm)
            fires, flips, nread, gt_flip, vol_flip, street_photos = [], [], 0, 0, 0, 0
            for k, runs in by.items():
                hit, gts, vols = [], [], []
                for j in runs[:3]:
                    if not j:
                        continue
                    r = score(j, "everyday", None, "v5")
                    if r["overall"] is None:
                        continue
                    nread += 1
                    hit.append(bool(fired(r)))
                    t0 = next((g for g in R.scored_garments(j) if g.get("category") == "top"), None)
                    gts.append(bool(t0 and t0.get("subcategory") == "graphic_tee"))
                    vols.append(bool(t0 and (t0.get("volume") or 3) >= 4))
                if any(hit):
                    fires.append(k)
                    if not all(hit):
                        flips.append(k)
                if any(gts) or any(vols):
                    street_photos += 1
                gt_flip += any(gts) and not all(gts)
                vol_flip += any(vols) and not all(vols)
            nm = f"{path.split('/')[1]} {arm}"
            res["fire"][nm] = {"photos": len(by), "readings": nread, "fires": fires, "flips": flips,
                               "street_top_photos": street_photos, "graphic_tee_flips": gt_flip, "volume4_flips": vol_flip}
            say(f"    {nm:16s} photos {len(by):2d} · readings {nread:3d} · SX1 fires on {len(fires)} · flips {len(flips)} · "
                f"photos with a street-coded top in any run {street_photos} (graphic tee flips {gt_flip}, volume>=4 flips {vol_flip})")

    # ======================== (5) judge pilot
    say("\n(5) AGAINST THE JUDGE PILOT (panel = median of 5 judges' weighted totals), the v2 split")
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

    # ======================== (6) his, his friends' and the unknowns' checks + targets
    say("\n(6) EVERY CHECK OF THE FOUNDER, HIS FRIENDS AND THE TWO UNKNOWNS (own occasion): v4 -> v5")
    res["checks"] = []
    mine = sorted([k for k in rows_r if rows_r[k]["who"] in ("founder", "friend", "unknown")],
                  key=lambda k: (rows_r[k]["who"] != "friend", rows_r[k]["who"], k))
    for k in mine:
        r = rows_r[k]
        line = {"key": k, "who": T.WHO_TEXT[r["who"]], "occ": r["occ"], "v4": r["v4"]["overall"], "v5": r["v5"]["overall"],
                "v5_row": P.card_row(r["v5"]), "label": label_of(r["v5"])}
        res["checks"].append(line)
        say(f"  {k:16s} [{line['who']}; {r['occ']}; {line['label']}] v4 {line['v4']} -> v5 {line['v5']} | {line['v5_row']}")
    tg = {x["key"]: x for x in res["checks"]}
    deli = [r for r in rows if r["tier"] == "deliberate"]
    plain = [r for r in rows if r["tier"] == "plain"]
    targets = [
        ("the three founder cases land at 5.5-6.5", all(5.5 <= r["v5"] <= 6.5 for r in res["crossing"] if r["id"] in ("A", "B", "C"))),
        ("every crossing outfit behaves as expected (fault / keep / tip)", res["crossing_ok"]),
        ("the friend's blazer d1967f at 7 or below", tg["phone-d1967f"]["v5"] <= 7.0),
        ("the chore coat (e438d4, f4870b, fb0b17) at 7-7.5",
         all(7.0 <= tg[k]["v5"] <= 7.5 for k in ("phone-e438d4", "phone-f4870b", "phone-fb0b17"))),
        ("his gingham fits as now (5a9049, 7f14a4, f07193)",
         all(tg[k]["v5"] == tg[k]["v4"] for k in ("phone-5a9049", "phone-7f14a4", "phone-f07193"))),
        ("his black tee + wide jeans + white leather sneakers (8ad378, 403ade) at 7",
         all(tg[k]["v5"] == 7.0 for k in ("phone-8ad378", "phone-403ade"))),
        (f"council deliberate fits that reached 8 under v4 still do ({sum(1 for r in deli if r['v4'] >= 8)} under v4)",
         all(r["v5"] >= 8 for r in deli if r["v4"] >= 8)),
        ("council plain fits that sat at 6.5-7.5 under v4 still do",
         all(6.5 <= r["v5"] <= 7.5 for r in plain if 6.5 <= r["v4"] <= 7.5)),
    ]
    b1 = res["steady"]["b1_A"]["v5"]["within_0.5_of_median"]
    targets.append((f"batch 1 arm A steady 49/49 ({b1[0]}/{b1[1]})", b1[0] >= 49 and b1[0] == b1[1]))
    a, b = res["judge"]["all"]["v4"], res["judge"]["all"]["v5"]
    targets.append((f"panel gap within +-0.2 ({b['mean_diff']:+.2f})", abs(b["mean_diff"]) <= 0.2))
    a, b = res["judge"]["held"]["v4"], res["judge"]["held"]["v5"]
    targets.append((f"no loss on the held-out half (within 0.5: v4 {a['within_0.5']} -> v5 {b['within_0.5']}; MAE {a['mae']} -> "
                    f"{b['mae']})", b["within_0.5"] >= a["within_0.5"] and b["mae"] <= a["mae"]))
    p8 = res["spread"]["v5"]["pct8"]
    targets.append((f"8+ at 5-12% on the real photos ({p8}%)", 5 <= p8 <= 12))

    # ======================== (7) picks never move SX1
    say("\n(7) PICKS NEVER MOVE A NUMBER: every crossing outfit and council case under no picks, each single style and "
        "three picks")
    keys7 = ["streetwear", "workwear", "vintage_sport", "outdoor", "minimalist", "classic_prep", "smart_casual"]
    variants = [{}] + [{s: 1.0} for s in keys7] + [{"streetwear": 0.5, "minimalist": 0.25, "smart_casual": 0.25}]
    bad = []
    pool = [(c[0], c[2], "everyday", "a_little") for c in CROSSING] + [(x["id"], x["reading"], x["occasion"], x.get("boldness", "a_little"))
                                                                         for x in json.load(open(CASES))]
    for cid, rd, occ, bold in pool:
        outs = {(r["overall"], r.get("raw_score")) for r in (score(rd, occ, None, "v5", styles=v, bold=bold) for v in variants)}
        if len(outs) > 1:
            bad.append(cid)
    res["picks_moved"] = bad
    say(f"  readings whose score changed with the picks: {len(bad)}" + (": " + ", ".join(bad) if bad else ""))
    targets.append(("picks never change a score", not bad))

    say("\n  targets:")
    res["targets"] = []
    for name, ok in targets:
        res["targets"].append({"target": name, "met": ok})
        say(f"    [{'met' if ok else 'NOT MET'}] {name}")

    # ======================== (8) the size, and what-ifs (not adopted)
    say("\n(8) THE SIZE AND THE WHAT-IFS (corpus 8+; b1 A steady; judge all / held mean diff and within 0.5; the founder "
        "cases A / B / C; crossing misses)")
    variants = {
        "v4 (no SX1)": {"sx": 0.0},
        "SX1 -1.5 (the jacket rule's size)": {"sx": 1.5},
        "SX1 -2.0": {"sx": 2.0},
        "SX1 -2.5": {"sx": 2.5},
        "v5 as built (-3.0)": {},
        "SX1 -4.0 (the spread rule's big size)": {"sx": 4.0},
        "one dressy piece is enough": {"sx_min_dressy": 1},
        "regular hoodies and sweatshirts count as street tops": {"sx_street_tops": frozenset({"graphic_tee", "hoodie", "sweatshirt"})},
    }
    res["ablations"] = {}
    for name, tn in variants.items():
        vals = [score(prim[k]["reading"], prim[k]["occ"], T.second_look_for(k, U, L), "v5", tn)["overall"] for k in sel]
        b = Q.bands(vals)
        hs = []
        for k, runs in B1.items():
            v = [score(j, "everyday", T.second_look_for(k, U, L, i), "v5", tn)["overall"] for i, j in enumerate(runs[:3])]
            if None not in v:
                hs.append(all(abs(x - st.median(v)) <= 0.5 for x in v))
        jj = {side: Q.cmp_stats([(score(prim[x["key"]]["reading"], prim[x["key"]]["occ"], T.second_look_for(x["key"], U, L),
                                        "v5", tn)["overall"], x["panel"]) for x in jp if side == "all" or half[x["id"]] == side])
              for side in ("all", "held")}
        abc = [score(rd, "everyday", None, "v5", tn, styles={})["overall"] for cid, _, rd, _ in CROSSING if cid in ("A", "B", "C")]
        miss = []
        for cid, _, rd, want in CROSSING:
            r = score(rd, "everyday", None, "v5", tn, styles={})
            got = "fault" if fired(r) else "tip" if tipped(r) else "keep"
            if got != want and not (tn.get("sx") == 0.0):
                miss.append(f"{cid} {got}")
        s = {"8+": b["8+"], "pct8": b["pct8"], "b1": [sum(hs), len(hs)], "all": jj["all"], "held": jj["held"], "ABC": abc, "miss": miss}
        res["ablations"][name] = s
        say(f"  {name:52s} 8+ {s['8+']} ({s['pct8']}%) · b1 {s['b1'][0]}/{s['b1'][1]} · all {jj['all']['mean_diff']:+.2f}/"
            f"{jj['all']['within_0.5']} · held {jj['held']['mean_diff']:+.2f}/{jj['held']['within_0.5']} · A/B/C {abc}"
            + (f" · crossing misses {miss}" if miss else ""))

    (OUT / "analysis.txt").write_text("\n".join(LINES) + "\n")
    json.dump(res, open(OUT / "analysis.json", "w"), indent=1,
              default=lambda o: sorted(o) if isinstance(o, (set, frozenset)) else str(o))


if __name__ == "__main__":
    main()

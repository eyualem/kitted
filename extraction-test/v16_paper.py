#!/usr/bin/env python3
"""Rescoring v16 on paper (T68, Nov 14, 2026; DECISIONS-LOG #464-#466). No API calls, $0: stored readings only, plus
made-up readings for the dealbreaker examples (as rules_conformance.py). Compares parts engine v15 (today) with v16.

  KITTED_DATA=<main checkout> /usr/bin/python3 v16_paper.py          every bar (tasks/T68/TASK.md), the tables, the
                                                                      season; writes results/v16/report.txt and
                                                                      results/v16/scores.json; exits 1 on a failed bar
  KITTED_DATA=... /usr/bin/python3 v16_paper.py --fit                 refit the curve on the gold set and say whether
                                                                      the engine's fixed curve still matches

Data (git-ignored, read from KITTED_DATA): the gold readings and panel (results/gold1/raw.json, inputs/gold-judge/),
his 20 blind ratings (inputs/gold-judge/founder/), the phone pulls (screenshots/phone/*/SQLite/kitted.db), the creators'
stills' readings (results/creators1/raw.json). His 60 new blind ratings (Y32) are NOT read until ~/Downloads/ratings.csv
exists: the mapping folder is never opened before that.

Rule 7: his own checks are scored with his profile (born 2004, age band 22-25; picks streetwear, minimal, workwear) at
their own occasion and second look. Gold photos and the creators' stills are "profile unknown", scored with one stated
test profile (Minimal + Smart casual, 0.5 each, boldness "a little") at Everyday. Every photo is scored for a cool day
(mild or cold; the default) and a warm day.
"""
import json
import statistics as st
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rubrics"))
import rubric as R  # noqa: E402
import parts_proto as P  # noqa: E402
import rules_conformance as RC  # noqa: E402
import hoodie_layer_paper as H  # noqa: E402  (the loaders: gold, panel, his 20, the phone pulls)

OUT = HERE / "results" / "v16"
PROFILE, FOUNDER = H.PROFILE, H.FOUNDER
BANDS = [("3-4.5", 3.0, 4.5, 0.05), ("5-5.5", 5.0, 5.5, 0.15), ("6-6.5", 6.0, 6.5, 0.30), ("7-7.5", 7.0, 7.5, 0.30),
         ("8-8.5", 8.0, 8.5, 0.15), ("9-9.5", 9.0, 9.5, 0.05)]
CREATORS = H.DATA / "extraction-test/results/creators1/raw.json"
Y32 = Path.home() / "Downloads" / "ratings.csv"


def sc(rd, occ="everyday", styles=None, sl=None, season=None, engine="v16", tune=None):
    return P.score_parts(rd, occ, styles or {}, sl, "a_little", engine=engine, tune=tune,
                         season=season if engine == "v16" else None)


def band_of(x):
    for name, lo, hi, _ in BANDS:
        if lo <= x <= hi:
            return name
    return "3-4.5" if x < 5 else "9-9.5"


def shares(xs):
    c = Counter(band_of(x) for x in xs)
    return {name: c[name] / len(xs) for name, *_ in BANDS}


def fmt_shares(s):
    return "  ".join(f"{name} {100 * s[name]:4.1f}%" for name, *_ in BANDS)


def worst_gap(s):
    return max(abs(s[name] - tgt) for name, _, _, tgt in BANDS)


def curve_final(r, a, b, k):
    """The shown score under curve (a, b, k), from a v16 result scored with any curve: raw, then the ceilings."""
    v = r["v16"]
    x = 7.0 + (a if v["raw"] < k else b) * (v["raw"] - k)
    return R.round_half(P.clamp(min(P.clamp(x, 3.0, 9.5), v["ceiling"]), 3.0, 9.5))


PLAIN = RC.Rd(RC.TEE, RC.DJEANS, RC.WLS)                      # plain basics must still show 7.0 under the curve


def fit_curve(results, pairs=None, max_off=5):
    """Grid search over the two slopes, with the anchor fixed at 7 (an outfit with nothing off and nothing chosen shows
    7.0, the creators' "okay", ladder.1) and plain basics checked to show 7.0. The objective is the largest band gap,
    then the summed squared gaps, then the distance from no curve (1, 1)."""
    plain = sc(PLAIN)
    best = None
    for i in range(0, 21):
        a = 1.0 + 0.1 * i
        for j in range(0, 23):
            b = 0.4 + 0.05 * j
            for k in (7.0,):                                      # the anchor stays at 7: "okay" is 7 (ladder.1)
                if curve_final(plain, a, b, k) != 7.0:
                    continue
                if pairs is not None and sum(abs(curve_final(x, a, b, k) - curve_final(y, a, b, k)) > 0.5
                                             for x, y in pairs) > max_off:
                    continue                                  # the steadiness bar (B6) is a constraint, not a goal
                s = shares([curve_final(r, a, b, k) for r in results])
                key = (round(worst_gap(s), 4), round(sum((s[n] - t) ** 2 for n, _, _, t in BANDS), 5),
                       round(abs(a - 1) + abs(b - 1) + abs(k - 7), 4))
                if best is None or key < best[0]:
                    best = (key, a, b, k, s)
    return best


def why(r):
    """The rule that set the v16 score, in a few words."""
    v = r["v16"]
    bits = []
    if v["held_by"]:
        cap = next((c for c in v["caps"] if c["id"] == v["held_by"]), None)
        bits.append(f"held by {v['held_by']}" + (f" ({cap['line']})" if cap else ""))
    if v["lifts"]:
        bits.append("lifts " + ", ".join(f"{x['id']} +{x['size']:g}" for x in v["lifts"]))
    if v["fault_drop"]:
        negs = [x for p in r["parts"].values() for x in p["reasons"] if x["points"] < 0 and x["check"] not in v["owned"]]
        if negs:
            w = min(negs, key=lambda x: x["points"])
            bits.append(f"faults -{v['fault_drop']:g} ({w['check']}: {w['line']})")
    if v["heavy_layer"]:
        bits.append(f"heavy layer -{v['heavy_layer'][0]:g}")
    if v.get("taste"):                                                 # round 3: his taste rules
        bits.append("taste: " + ", ".join(f"{x['line']} {x['points']:+g}" for x in v["taste"]))
    return "; ".join(bits) or "nothing off, nothing chosen"


def pearson(a, b):
    return H.pearson(a, b)


# ============================================================================================ the dealbreaker examples
top, outer, bottom, shoe, Rd, mod = RC.top, RC.outer, RC.bottom, RC.shoe, RC.Rd, RC.mod
GYM = bottom("athletic_shorts", "black", "relaxed", "na")
PLAIN_SHORTS = bottom("shorts", "khaki_beige", "relaxed", "na")
SWEATS = bottom("sweatpants", "grey", "relaxed", "cuffed")
MOSTLY = {"covers_shoe": "mostly"}
# (row, what, reading, second look, expected cap) -- a clean example: everything else fine (Everyday, no picks)
SINKS_HOLDS = [
    ("S1", "a grey hoodie over black skinny jeans, white leather sneakers", Rd(top("hoodie", "grey"), RC.SKJEANS, RC.WLS), None, 5.5),
    ("S2", "an oversized white tee over black skinny jeans", Rd(top("tee", "white", 4), RC.SKJEANS, RC.WLS), None, 5.5),
    ("S4", "a red tee, yellow chinos, purple sneakers", Rd(top("tee", "red"), bottom("chinos", "yellow", "straight"),
                                                           shoe("canvas_sneaker", "purple")), None, 4.5),
    ("S6", "a navy blazer over a tee with grey sweatpants", Rd(outer("blazer", "navy"), RC.TEE, SWEATS, RC.WLS), None, 5.5),
    ("S8", "derbies with gym shorts and a tee", Rd(RC.TEE, GYM, RC.DERBY), None, 5.5),
    ("S8b", "derbies with sweatpants and a tee", Rd(RC.TEE, SWEATS, RC.DERBY), None, 5.5),
    ("S9", "a clear stain on the tee", Rd(mod(RC.TEE, condition="stained"), RC.DJEANS, RC.WLS), None, 5.5),
    ("H7", "straight jeans that pile up over the sneakers (the shoe close-up says mostly)", Rd(RC.TEE, RC.DJEANS, RC.WLS),
     MOSTLY, 5.5),
    ("H1", "an oversized white tee over black slim jeans", Rd(top("tee", "white", 4), RC.SLJEANS, RC.WLS), None, 6.5),
    ("H3", "a red tee over bright green chinos, red canvas sneakers (no neutral beside them)",
     Rd(top("tee", "red"), bottom("chinos", "green", "straight", saturation="bright"), shoe("canvas_sneaker", "red")), None, 6.5),
    ("H4", "a black sweater with skinny joggers", Rd(top("sweater", "black"), bottom("joggers", "black", "skinny", "cuffed"), RC.WLS),
     None, 6.5),
    ("H8", "a tee that clearly pulls", Rd(mod(RC.TEE, strain="clear"), RC.DJEANS, RC.WLS), None, 6.5),
    ("H10", "chunky sneakers under black slim jeans", Rd(RC.TEE, RC.SLJEANS, RC.CHUNKY), None, 6.0),
    ("H11", "grey trousers with chunky sneakers", Rd(top("oxford_shirt", "white"), RC.TROUSERS, RC.CHUNKY), None, 6.5),
]
# spared versions: these must NOT be capped by the row
SPARED = [
    ("S6", "an overcoat over a tee with grey sweatpants (spared)", Rd(outer("overcoat", "black"), RC.TEE, SWEATS, RC.WLS), None),
    ("S8", "loafers with plain sweatpants (spared)", Rd(RC.TEE, SWEATS, RC.LOAFER_BK), None),
    ("S9", "a stain on jeans ripped by design (spared)", Rd(RC.TEE, mod(RC.DJEANS, condition="stained", distressed_by_design=True),
                                                         RC.WLS), None),
    ("H7", "wide jeans stacking on the sneakers (a soft stack, spared)", Rd(RC.TEE, RC.WJEANS, RC.WLS), MOSTLY),
    ("H3", "a red tee over bright blue chinos with black sneakers and a navy jacket (calmed, spared)",
     Rd(top("tee", "red"), bottom("chinos", "blue", "straight", saturation="bright"), outer("bomber", "navy"), shoe("canvas_sneaker", "black")), None),
    ("H9", "a roomy overshirt with long sleeves (cut long, spared)", Rd(top("overshirt", "olive", 4, sleeve_end="covers_hand"),
                                                                        RC.WJEANS, RC.WLS), None),
    ("H1", "a fleece over slim cargos (outdoor, spared)", Rd(outer("fleece", "green", 4), RC.TEE,
                                                             bottom("cargos", "olive", "slim"), shoe("trail_shoe", "grey")), None),
]
DEPENDS = [  # (row, base reading, weak-color version, strong-color version)
    ("S5", "a blazer with gym shorts",
     Rd(RC.TEE, outer("blazer", "navy"), GYM, RC.WLS),
     Rd(top("graphic_tee", "red", pattern_scale="large"), outer("blazer", "navy"), GYM, RC.WLS),
     Rd(top("tee", "green", saturation="muted"), outer("blazer", "navy"), GYM, RC.WLS)),
    ("S7", "a leather jacket with gym shorts",
     Rd(RC.TEE, outer("leather_jacket", "black"), GYM, RC.WLS),
     Rd(top("graphic_tee", "red", pattern_scale="large"), outer("leather_jacket", "black"), GYM, RC.WLS),
     Rd(top("tee", "green", saturation="muted"), outer("leather_jacket", "black"), GYM, RC.WLS)),
    ("H6", "a blazer with plain shorts",
     Rd(RC.TEE, outer("blazer", "navy"), PLAIN_SHORTS, RC.WLS),
     Rd(top("graphic_tee", "red", pattern_scale="large"), outer("blazer", "navy"), PLAIN_SHORTS, RC.WLS),
     Rd(top("tee", "green", saturation="muted"), outer("blazer", "navy"), PLAIN_SHORTS, RC.WLS)),
]


def run_dealbreakers(say):
    say("== B4 The dealbreaker examples (made-up clean readings, Everyday, no picks, cool day) ==")
    bad = 0
    for rid, what, rd, sl, cap in SINKS_HOLDS:
        a, b = sc(rd, sl=sl), sc(rd, sl=sl, engine="v15")
        ok = a["overall"] == cap and any(c["id"].rstrip("b") == rid.rstrip("b") for c in a["v16"]["caps"])
        bad += not ok
        say(f"  {rid:4s} {'PASS' if ok else 'FAIL'}  cap {cap:g}: v15 {b['overall']:g} -> v16 {a['overall']:g}  {what}")
    for rid, what, rd, sl in SPARED:
        a, b = sc(rd, sl=sl), sc(rd, sl=sl, engine="v15")
        ok = not any(c["id"] == rid for c in a["v16"]["caps"])
        bad += not ok
        say(f"  {rid:4s} {'PASS' if ok else 'FAIL'}  not capped: v15 {b['overall']:g} -> v16 {a['overall']:g}  {what}")
    for rid, what, base, weak, strong in DEPENDS:
        s0, sw, ss = sc(base), sc(weak), sc(strong)
        v15 = sc(base, engine="v15")["overall"]
        ok = all(5.5 <= x["overall"] <= 7.0 for x in (s0, sw, ss)) and sw["overall"] < ss["overall"]
        bad += not ok
        say(f"  {rid:4s} {'PASS' if ok else 'FAIL'}  depends: {what}: v15 {v15:g} -> v16 {s0['overall']:g}; with a loud print "
            f"{sw['overall']:g}; with a quiet accent {ss['overall']:g}  (bar: all 5.5-7.0, loud below quiet)")
    say("  Can't fire for lack of a read: " + "; ".join(f"{k}: {v}" for k, v in P.V16_UNREAD.items() if k in ("S3", "H2", "H7_no_closeup")))
    say("  H7 fires only on checks with the shoe close-up (his phone checks with look L); the gold set has none.")
    say("  H9 (sleeves over the hands) is not built as a cap: the read flipped between the two stored readings on 3 of the")
    say("  12 gold photos that moved more than 0.5 in the first run; it stays v15's Fit charge (a hold needs a steady read).")
    return bad


# ============================================================================================ the creators
PAIRS = [("wIib9hzVUuw/o1-before-04-10", "wIib9hzVUuw/o1-after-04-52", "oversized tee + baggy denim jacket over skinny jeans -> relaxed jeans, cropped jacket"),
         ("wIib9hzVUuw/o2-before-05-30", "wIib9hzVUuw/o2-after-06-14", "knit on knit, slim dark jeans -> one knit, relaxed light jeans"),
         ("wIib9hzVUuw/o3-before-07-26", "wIib9hzVUuw/o3-after-09-07", "all-navy flannel + jeans -> black flannel, white tank, pleated trousers, loafers"),
         ("wIib9hzVUuw/o4-before-09-30", "wIib9hzVUuw/o4-after-10-02", "tight beige monochrome -> wider trousers, tucked tee, relaxed shirt, loafers"),
         ("wIib9hzVUuw/o5-before-10-18", "wIib9hzVUuw/o5-after-11-22", "skinny joggers -> straight trousers, plain black sweater"),
         ("k6Gig6r7BSQ/before-longer-tee-10-47", "k6Gig6r7BSQ/after-shorter-tee-10-47", "Frugal: the same tee 4 in shorter")]
# The rulebook's 60 anchors (§6) whose still has stored readings in results/creators1 (mapped by video, time and the
# reading's pieces; a51's verified still is Tim's brown blazer over the tucked tee, outfit10)
ANCHORS = [("a01", "wIib9hzVUuw/o1-before-04-10", 4.5), ("a27", "wIib9hzVUuw/o1-after-04-52", 7.5),
           ("a02", "wIib9hzVUuw/o2-before-05-30", 5.0), ("a28", "wIib9hzVUuw/o2-after-06-14", 7.5),
           ("a17", "wIib9hzVUuw/o3-before-07-26", 6.5), ("a52", "wIib9hzVUuw/o3-after-09-07", 9.0),
           ("a03", "wIib9hzVUuw/o4-before-09-30", 5.0), ("a29", "wIib9hzVUuw/o4-after-10-02", 8.5),
           ("a04", "wIib9hzVUuw/o5-before-10-18", 4.0), ("a30", "wIib9hzVUuw/o5-after-11-22", 8.0),
           ("a19", "-V2bE8nDsdo/outfit01-02-44", 7.0), ("a36", "-V2bE8nDsdo/outfit02-02-58", 8.0),
           ("a38", "-V2bE8nDsdo/outfit05-03-37", 7.5), ("a37", "-V2bE8nDsdo/outfit08-04-32", 8.0),
           ("a51", "-V2bE8nDsdo/outfit10-05-08", 9.0), ("a26", "tNVdA_arEa8/red-jacket-dark-pants-01-21", 7.5),
           ("a25", "tNVdA_arEa8/purple-under-dark-coat-00-33", 8.0), ("a59", "Pxeeh-caTJg/perfect-all-black-19-38", 9.0)]
SIDE = [("a51 base", "-V2bE8nDsdo/outfit07-04-20", "Tim's tucked white tee, wide black trousers, loafers, before the blazer"),
        ("Wanhee", "tNVdA_arEa8/blue-hoodie-dark-jacket-01-25", "good: a bright hoodie toned down by a dark jacket")]


def load_creators():
    if not CREATORS.exists():
        return {}
    by = defaultdict(list)
    for r in json.load(open(CREATORS)):
        if r.get("json"):
            by[r["photo"].replace("__", "/")].append((r["run"], r["json"]))
    return {k: [j for _, j in sorted(v, key=lambda x: x[0])] for k, v in by.items()}


def med(rds, engine="v16", season=None):
    xs = [sc(rd, "everyday", PROFILE, None, season, engine) for rd in rds]
    return st.median(x["overall"] for x in xs if x["overall"] is not None), xs


def run_creators(say, cr):
    say("== B2 The creators' before/after pairs (stored readings, median of 3; cool day) ==")
    bad = 0
    for w, b, what in PAIRS:
        (w15, _), (b15, _) = med(cr[w], "v15"), med(cr[b], "v15")
        (w16, _), (b16, _) = med(cr[w]), med(cr[b])
        ok = b16 > w16
        bad += not ok
        say(f"  {'PASS' if ok else 'FAIL'}  v15 {w15:g} -> {b15:g}   v16 {w16:g} -> {b16:g}   {what}")
    say()
    say("== B3 The creators' anchors with stored readings (median of 3; cool day; warm in brackets) ==")
    for aid, pid, step in ANCHORS:
        m15, _ = med(cr[pid], "v15")
        m16, xs = med(cr[pid])
        mw, _ = med(cr[pid], season="warm")
        ok = (m16 <= 6.0) if step <= 5.5 else (6.0 <= m16 <= 8.0) if step <= 7.5 else (m16 >= 7.5)
        bad += not ok
        say(f"  {aid} {'PASS' if ok else 'FAIL'}  step {step:g}: v15 {m15:g} -> v16 {m16:g} [{mw:g}]   {H.desc(cr[pid][0])}"
            f"\n        why: {why(xs[0])}")
    for name, pid, what in SIDE:
        if pid in cr:
            m15, _ = med(cr[pid], "v15")
            m16, xs = med(cr[pid])
            say(f"  ({name}, not a bar) v15 {m15:g} -> v16 {m16:g}: {what}; why: {why(xs[0])}")
    return bad


# ============================================================================================ 15 named outfits
# (source, key, name): his saved checks (his profile, own occasion), gold photos he rated blind (test profile,
# Everyday), the creators' stills (median of 3 readings), and two made-up readings to show both ends of the scale
NAMED = [
    ("phone", "phone-0d39d6", "His check: grey hoodie, black wide jeans, navy slides (Everyday)"),
    ("phone", "phone-f07193", "His check: grey tee under a tan overshirt, black wide jeans (Class)"),
    ("phone", "phone-950979", "His check: charcoal hoodie, cream overshirt over it, relaxed jeans, chunky sneakers"),
    ("phone", "phone-dcb1b2", "His check: charcoal hoodie, light wide jeans, white leather sneakers"),
    ("phone", "phone-aa20f9", "His check: charcoal tee with a clear stain, light jeans, slides"),
    ("phone", "phone-9d3ef4", "His check: black sweatshirt, slim ripped jeans (Class)"),
    ("gold", "pin-013", "Gold, he rated 5.5: black graphic tee, skinny jeans, red basketball sneakers"),
    ("gold", "ig-010", "Gold, he rated 8: green cardigan over a white tee, relaxed black trousers, white sneakers"),
    ("gold", "pin-058", "Gold, he rated 5: pink graphic tee, light denim shorts"),
    ("gold", "ig-061", "Gold, he rated 8: blue sweatshirt over a tee, olive wide cargos, black derbies"),
    ("creator", "wIib9hzVUuw/o1-before-04-10", "Tim's before (a01, his 4.5): oversized tee, denim jacket, skinny jeans"),
    ("creator", "-V2bE8nDsdo/outfit10-05-08", "Tim's favorite (a51, his 9): brown blazer, white tee, black trousers"),
    ("creator", "tNVdA_arEa8/red-jacket-dark-pants-01-21", "Wanhee's red bomber over dark trousers (a26, his 7.5)"),
    ("made", RC.Rd(top("tee", "red"), bottom("chinos", "yellow", "straight"), shoe("canvas_sneaker", "purple")),
     "Made up: red tee, yellow chinos, purple sneakers (three brights)"),
    ("made", RC.Rd(top("tee", "white", 4, tucked="full"), outer("cardigan", "burgundy"), RC.WTROUSERS, RC.LOAFER_BK),
     "Made up: boxy white tee tucked into charcoal wide trousers, a burgundy cardigan, black loafers"),
]


LOOK_NAMES = {**R.STYLE_NAMES, "tailored": "tailored", "none": "no look"}


def run_named(say, runs, ph, cr, his=None):
    """The 15 named outfits for his yes: today's score (v15), the new one (v16 with his taste rules, cool day; warm in
    brackets), his own blind score where he rated it, the look the rules followed, and why. Also writes named.md."""
    say("== 15 named outfits: v15 -> v16 (cool day; warm in brackets), his score, the graded look, and why ==")
    looks = load_looks()
    rows = []
    for src, key, name in NAMED:
        mine = None
        if src == "phone":
            v = ph.get(key)
            if v is None:
                say(f"  (missing {key})")
                continue
            b = sc(v["reading"], v["occ"], FOUNDER, v["sl"], engine="v15")
            a = sc(v["reading"], v["occ"], FOUNDER, v["sl"])
            w = sc(v["reading"], v["occ"], FOUNDER, v["sl"], season="warm")
            b, a, w = b["overall"], a, w["overall"]
        elif src == "gold":
            rd = runs[key][0]
            lk = (looks.get(key) or [None])[0]
            b, a, w = sc(rd, "everyday", PROFILE, engine="v15")["overall"], sc(rd, "everyday", PROFILE, lk), \
                sc(rd, "everyday", PROFILE, lk, season="warm")["overall"]
            mine = (his or {}).get(key)
        elif src == "creator":
            b, _ = med(cr[key], "v15")
            m, xs = med(cr[key])
            w, _ = med(cr[key], season="warm")
            a = next(x for x in xs if x["overall"] == m)
        else:
            b, a, w = sc(key, engine="v15")["overall"], sc(key), sc(key, season="warm")["overall"]
        gl = ", ".join(LOOK_NAMES.get(x, x) for x in a["v16"]["graded_look"])
        say(f"  {b:>4g} -> {a['overall']:<4g} [{w:g}]  {name}" + (f"  (his {mine:g})" if mine is not None else "")
            + f"\n        graded as {gl}; {why(a)}")
        rows.append((name, b, a["overall"], w, mine, gl, why(a)))
    md = ["| Outfit | Today (v15) | New (v16) | Warm day | His score | Graded as | Why |", "|---|---|---|---|---|---|---|"]
    for name, b, a, w, mine, gl, wy in rows:
        md.append(f"| {name} | {b:g} | **{a:g}** | {w:g} | {'' if mine is None else f'{mine:g}'} | {gl} | {wy} |")
    (OUT / "named.md").write_text("\n".join(md) + "\n")


# ============================================================================================ main
LOOKS = HERE / "results" / "gold-looks1" / "raw.json"
KEY = None                                                             # --key consistent: his consistent answer key


def load_looks():
    """Round 2 (Nov 15): the app's two second looks on the gold set, run i paired with stored reading i.
    Returns {photo: [{under_present, under_shows, ..., covers_shoe, pant_end} per run]}; a run needs both looks."""
    if not LOOKS.exists():
        return {}
    got = defaultdict(lambda: defaultdict(dict))
    for r in json.loads(LOOKS.read_text()):
        if r.get("json"):
            got[r["photo"]][r["run"]].update(r["json"])
    out = {}
    for p, rs in got.items():
        seq = []
        for i in sorted(rs):
            if i != len(seq) or "under_shows" not in rs[i] or "covers_shoe" not in rs[i]:
                break
            seq.append(rs[i])
        if seq:
            out[p] = seq
    return out


def narrow(lk, pool_only, open_jacket):
    """Two narrower readings of the looks, for his call (paper only, not in the engine)."""
    lk = dict(lk)
    if pool_only and lk.get("covers_shoe") == "mostly" and lk.get("pant_end") != "pooling":
        lk["covers_shoe"] = "partly"                                  # still rests on the shoe; no 5.5 cap
    if open_jacket and lk.get("outer_kind") == "jacket_or_coat" and lk.get("under_shows") == "clearly":
        lk["under_shows"] = "a_little"                                # a tee below an open jacket is the look
    return lk


F4 = H.DATA / "inputs/gold-judge/founder4"


def load_founder4():
    """His 150 blind ratings (Nov 16; the combined sheet). Returns ({gold photo: score} for sheet 1's gold photos,
    every row as {cid: (sheet, score, note, description)}). The key (.mapping/) is read only because he has finished."""
    rf, mf = F4 / "ratings.csv", F4 / ".mapping/mapping.csv"
    if not (rf.exists() and mf.exists()):
        return {}, {}
    import csv
    g2p = {m["gid"]: m["photo"] for m in json.load(open(H.DATA / "inputs/gold-judge/manifest.json"))}
    key = {r["id"]: r for r in csv.DictReader(open(mf))}
    gold, rows = {}, {}
    for r in csv.DictReader(open(rf)):
        k = key[r["id"]]
        rows[r["id"]] = (k["from_sheet"], float(r["score"]), r["note"].strip(), k["description"])
        if k["gold_id"] and k["gold_id"] in g2p:
            gold[g2p[k["gold_id"]]] = float(r["score"])
    return gold, rows


RATED = HERE / "results" / "rated1" / "raw.json"
LEFT_OUT = ("C001", "C013", "C032", "C064", "C071", "C140")   # heads already under a mosaic block: prep sends nothing


def load_rated():
    """The 90 rated photos read Nov 16 (rated_read.py, one run): {cid: (reading, second look U+L merged)}."""
    if not RATED.exists():
        return {}
    got = defaultdict(dict)
    for r in json.loads(RATED.read_text()):
        if r.get("json"):
            got[r["photo"]][r["kind"]] = r["json"]
    return {c: (v["read"], {**v.get("U", {}), **v.get("L", {})}) for c, v in got.items() if "read" in v}


RULER_REF = "origin/claude/reading-test-proportions-54b447"      # T98's measures (PR #126), read until it merges
RULER_CUT = 0.62                                                    # T98: top end t >= 0.62 = long (8/8, 7% false yes)


def load_ruler():
    """The Mac's body ruler on his rated photos (T98, $0): {photo key: True/False} where it measured, keyed both by
    C-id and by gold photo id. Read from the local file once T98 is merged, else from its branch (read only)."""
    import csv
    import io
    import subprocess
    f = HERE / "results/reading-proportions/measures.csv"
    try:
        txt = f.read_text() if f.exists() else subprocess.run(
            ["git", "show", f"{RULER_REF}:extraction-test/results/reading-proportions/measures.csv"],
            capture_output=True, text=True, check=True, cwd=HERE).stdout
    except (subprocess.CalledProcessError, OSError):
        return {}
    out = {}
    for r in csv.DictReader(io.StringIO(txt)):
        if r["pass"] != "c" or r["status"] != "ok":
            continue
        v = r["top_end"] or r["visual"]
        if v:
            out[r["id"]] = float(v) >= RULER_CUT
    try:
        g2p = {m["gid"]: m["photo"] for m in json.load(open(H.DATA / "inputs/gold-judge/manifest.json"))}
        for r in csv.DictReader(open(F4 / ".mapping/mapping.csv")):
            p = g2p.get(r["gold_id"])
            if p and r["id"] in out and p not in out:
                out[p] = out[r["id"]]
    except OSError:
        pass
    return out


def load_shorts_end():
    """The October narrow look's shorts length on his 24 shorts photos (T98's paid round, PR #126, run 0):
    {photo key: "above_knee" / "at_knee" / "below_knee"}, keyed by C-id and by gold photo id."""
    import csv
    import subprocess
    f = HERE / "results/proportions-looks1/raw.json"
    try:
        txt = f.read_text() if f.exists() else subprocess.run(
            ["git", "show", f"{RULER_REF}:extraction-test/results/proportions-looks1/raw.json"],
            capture_output=True, text=True, check=True, cwd=HERE).stdout
    except (subprocess.CalledProcessError, OSError):
        return {}
    out = {r["photo"]: r["json"].get("shorts_end") for r in json.loads(txt)
           if r.get("arm") == "shorts" and r.get("run") == 0 and isinstance(r.get("json"), dict)}
    try:
        g2p = {m["gid"]: m["photo"] for m in json.load(open(H.DATA / "inputs/gold-judge/manifest.json"))}
        for r in csv.DictReader(open(F4 / ".mapping/mapping.csv")):
            p = g2p.get(r["gold_id"])
            if p and r["id"] in out:
                out.setdefault(p, out[r["id"]])
    except OSError:
        pass
    return out


def rated_pool(runs, founder, f4, rows):
    """Every photo he rated that has a reading, under one key: the gold photo id (stored Oct 12 reading, the Nov 15
    looks) or the sheet's C-id (the Nov 16 reading and looks). Returns {key: (his score, group, reading, look|None)}."""
    looks, rated = load_looks(), load_rated()
    g2c = {}
    pool = {}
    for p, v in founder.items():
        if p in runs:
            pool[p] = (v, "his first 20", runs[p][0], (looks.get(p) or [None])[0])
    for p, v in f4.items():
        if p in runs:
            pool[p] = (v, "sheet 1 (gold photos)", runs[p][0], (looks.get(p) or [None])[0])
    for c, (sheet, score, _, _) in rows.items():
        if c in rated:
            pool[c] = (score, "sheet 2" if sheet == "sheet2" else "the 20 new", rated[c][0], rated[c][1])
    ruler, shorts = load_ruler(), load_shorts_end()
    for k, v in list(pool.items()):                                    # the long-top ruler and the shorts look ride with
        if v[3] is None:                                               # the second look (read only by the taste rules)
            continue
        extra = {}
        if k in ruler:
            extra["long_top"] = ruler[k]
        if k in shorts:
            extra["shorts_end"] = shorts[k]
        if extra:
            pool[k] = (v[0], v[1], v[2], {**v[3], **extra})
    return pool


ARMS = (("v15", dict(engine="v15"), False, None), ("v16 (no second looks)", {}, False, None),
        ("v16 with the looks (his marks)", {}, True, None),
        ("v16 looks, H7 hold + jacket peek free", {}, "narrow", {"v16_h7_cap": 6.5}))


def score_pool(pool):
    """Each arm's score for every photo in the pool (first reading, cool day, Everyday, the test profile)."""
    out = {}
    for k, (_, _, rd, lk) in pool.items():
        row = {}
        for name, kw, use, tn in ARMS:
            sl = None if not use or lk is None else (narrow(lk, False, True) if use == "narrow" else lk)
            r = sc(rd, "everyday", PROFILE, sl, tune=tn, **kw)
            row[name] = r
        out[k] = row
    return out


def run_b1_full(say, runs, panel, founder, gold15, gold16, looked):
    """B1 on every photo he rated that has a reading: his first 20 and 144 of the 150 (sheet 1's gold photos on their
    stored readings; sheet 2 and the 20 new read Nov 16). His words (Nov 16): the ratings are taste and may
    fluctuate, so they set direction, not single-photo tuning."""
    f4, rows = load_founder4()
    if not f4:
        say("== B1 on the full set: his 150 ratings not found (inputs/gold-judge/founder4/); not run ==")
        return None
    pool = rated_pool(runs, founder, f4, rows)
    if KEY:                                                            # the consistent key replaces his scores
        pool = {k: (KEY.get(k, v[0]),) + v[1:] for k, v in pool.items()}
        say("  (his consistent key: his blind re-rate where he gave one, his original elsewhere)")
    S = score_pool(pool)
    pool = {k: v for k, v in pool.items() if all(S[k][n]["overall"] is not None for n, *_ in ARMS)}
    n150 = sum(1 for k, v in pool.items() if v[1] != "his first 20")
    say(f"== B1 on the full set: his 150 (Nov 16): {n150} with a reading (left out: {', '.join(LEFT_OUT)}, heads already "
        f"under a mosaic block, so the prep sends nothing), plus his first 20 ==")
    sp = shares([r[1] for c, r in rows.items()])
    say(f"  his 150, by band  {fmt_shares(sp)}   mean {st.mean(r[1] for r in rows.values()):.2f}")

    def b1(name, ks, f):
        xs, hv = [f(k) for k in ks], [pool[k][0] for k in ks]
        w1 = sum(abs(x - y) <= 1 for x, y in zip(xs, hv))
        return w1, pearson(xs, hv), (f"{name:38s} within 1 {w1:3d}/{len(ks)} ({100 * w1 / len(ks):3.0f}%)  r {pearson(xs, hv):.3f}"
                                     f"  mean {st.mean(xs):.2f} (his {st.mean(hv):.2f})")
    groups = [(g, [k for k in pool if pool[k][1] == g]) for g in ("his first 20", "sheet 1 (gold photos)", "sheet 2", "the 20 new")]
    groups += [("all 150 with a reading", [k for k in pool if pool[k][1] != "his first 20"]), ("everything he rated", list(pool))]
    verdict = None
    for g, ks in groups:
        if not ks:
            continue
        say(f"  {g} ({len(ks)}):")
        res = [b1(n, ks, lambda k, n=n: S[k][n]["overall"]) for n, *_ in ARMS]
        pk = [k for k in ks if k in panel]
        if pk:
            res.append(b1("the AI panel", pk, lambda k: panel[k]))
        for *_, ln in res:
            say("    " + ln)
        if g == "everything he rated":
            w1, r16 = res[1][0], res[1][1]
            verdict = w1 >= 0.8 * len(ks) and r16 >= 0.69
            say(f"B1 (all {len(ks)} rated photos with a reading, v16) within 1 on 8 in 10 ({w1}/{len(ks)}) and r >= 0.69 "
                f"({r16:.3f}): {'PASS' if verdict else 'FAIL'}")
    sv = shares([S[k]["v16 (no second looks)"]["overall"] for k, _ in [(k, 0) for k in groups[4][1]]])
    say(f"  v16's own shares on his 150 with a reading  {fmt_shares(sv)}   (his: above)")
    return verdict, pool, S, rows


def taste_calls(say, panel, pool, S, rows):
    """The five Y34 calls, checked against everything he has rated with a reading (direction only)."""
    V, LK = "v16 (no second looks)", "v16 with the looks (his marks)"
    ks = list(pool)
    def line(name, q, arm=V):
        if not q:
            return say(f"  {name}: none in his ratings")
        hv = [pool[k][0] for k in q]
        pv = [panel[k] for k in q if k in panel]
        say(f"  {name} ({len(q)}): his mean {st.mean(hv):.2f} (6.5 or under {sum(h <= 6.5 for h in hv)}, 7+ {sum(h >= 7 for h in hv)}); "
            f"v16 {st.mean(S[k][arm]['overall'] for k in q):.2f}" + (f"; panel {st.mean(pv):.2f} ({len(pv)})" if pv else ""))
    say(f"== The Y34 taste calls against his ratings ({len(ks)} rated photos with a reading; his mean "
        f"{st.mean(pool[k][0] for k in ks):.2f}) ==")
    line("1. nothing off, nothing chosen (v16 shows 7.0)", [k for k in ks if why(S[k][V]) == "nothing off, nothing chosen"])
    def has(r, pre):
        return any(x["check"].startswith(pre) for part in r["parts"].values() for x in part["reasons"])
    line("2. slides out of the house (SK1)", [k for k in ks if has(S[k][V], "SK1")])
    line("3. one accent (L5) the only lift", [k for k in ks if [x["id"] for x in S[k][V]["v16"]["lifts"]] == ["L5"]])
    line("   L5 among other lifts", [k for k in ks if "L5" in [x["id"] for x in S[k][V]["v16"]["lifts"]]
                                     and len(S[k][V]["v16"]["lifts"]) > 1])
    line("   no lift at all", [k for k in ks if not S[k][V]["v16"]["lifts"]])
    line("   one lift, not L5", [k for k in ks if len(S[k][V]["v16"]["lifts"]) == 1 and S[k][V]["v16"]["lifts"][0]["id"] != "L5"])
    line("   two or more lifts", [k for k in ks if len(S[k][V]["v16"]["lifts"]) >= 2])
    wl = [k for k in ks if pool[k][3] is not None]
    line("4. pants pile on the shoe (H7, with looks)", [k for k in wl if any(c["id"] == "H7" for c in S[k][LK]["v16"]["caps"])], LK)
    line("   the look says the hem mostly covers the shoe (any leg)", [k for k in wl if pool[k][3].get("covers_shoe") == "mostly"], LK)
    pk = [k for k in wl if P._second_look(pool[k][3], P.TUNE["v16"])["peek"]]
    pj = [k for k in pk if pool[k][3].get("outer_kind") == "jacket_or_coat"]
    line("5. a top clearly below the outer piece (with looks)", pk, LK)
    line("   ... under a jacket or coat", pj, LK)
    line("   ... under anything else", [k for k in pk if k not in pj], LK)
    line("   the top shows a little (costs nothing today)", [k for k in wl if pool[k][3].get("under_present") == "yes"
                                                             and pool[k][3].get("under_shows") == "a_little"], LK)


def run_looks(say, runs, panel, founder, gold15, gold16, ps):
    """Round 2: the same stored readings plus the fresh second looks (U: a top peeking below the outer piece;
    L: the hem on the shoe). Only the second look changes, so every move here is the looks' doing."""
    looks = load_looks()
    if not looks:
        say("== Round 2: no second looks found (results/gold-looks1/raw.json); not run ==")
        return {}
    lp = [p for p in ps if p in looks]
    say(f"== Round 2: with the fresh second looks ({len(lp)} of {len(ps)} gold photos have them; "
        f"{sum(len(looks[p]) >= 2 for p in lp)} have both runs) ==")
    # how steady the looks are between their two runs
    both = [p for p in lp if len(looks[p]) >= 2]
    if both:
        pk = [P._second_look(looks[p][i], P.TUNE["v16"])["peek"] for p in both for i in (0, 1)]
        flips_u = sum(pk[2 * j] != pk[2 * j + 1] for j in range(len(both)))
        cs = [(looks[p][0]["covers_shoe"], looks[p][1]["covers_shoe"]) for p in both]
        flips_l = sum(a != b for a, b in cs)
        mostly = [(a == "mostly", b == "mostly") for a, b in cs]
        flips_m = sum(a != b for a, b in mostly)
        say(f"  steadiness of the looks across the two runs ({len(both)} photos): a peek (clearly) {flips_u} flip; "
            f"covers the shoe {flips_l} differ ({flips_m} on 'mostly', the H7 cap's trigger)")
    say("  answers (run 1): peek " + str(sum(bool(P._second_look(looks[p][0], P.TUNE['v16'])['peek']) for p in lp))
        + ", covers the shoe " + ", ".join(f"{k} {n}" for k, n in Counter(looks[p][0]['covers_shoe'] for p in lp).most_common()))
    res = {}
    for p in lp:
        n = min(len(looks[p]), len(runs[p]))
        res[p] = ([sc(runs[p][i], "everyday", PROFILE, looks[p][i], engine="v15") for i in range(n)],
                  [sc(runs[p][i], "everyday", PROFILE, looks[p][i]) for i in range(n)])
    say(f"  target           {fmt_shares({n: t for n, _, _, t in BANDS})}")
    for name, before, after in (("v15", gold15, 0), ("v16 cool", gold16, 1)):
        sb = shares([before[p][0]["overall"] for p in lp])
        sa = shares([res[p][after][0]["overall"] for p in lp])
        say(f"  {name:9s} stored {fmt_shares(sb)}   worst gap {100 * worst_gap(sb):.1f}")
        say(f"  {name:9s} looks  {fmt_shares(sa)}   worst gap {100 * worst_gap(sa):.1f}")
    pv = [p for p in lp if p in panel]
    for name, S in (("v16 stored", {p: gold16[p][0]["overall"] for p in lp}),
                    ("v16 looks", {p: res[p][1][0]["overall"] for p in lp})):
        say(f"  {name:10s} mean {st.mean(S.values()):.2f}  r with the panel {pearson([S[p] for p in pv], [panel[p] for p in pv]):.3f}")
    # B1, B6 again
    fp = [p for p in founder if p in res]
    if fp:
        xs, hv = [res[p][1][0]["overall"] for p in fp], [founder[p] for p in fp]
        say(f"  B1 again (his {len(fp)}): within 1 point {sum(abs(x - y) <= 1 for x, y in zip(xs, hv))}/{len(fp)}, "
            f"r {pearson(xs, hv):.3f} (stored: {sum(abs(gold16[p][0]['overall'] - founder[p]) <= 1 for p in fp)}/{len(fp)}, "
            f"r {pearson([gold16[p][0]['overall'] for p in fp], hv):.3f})")
    two = [p for p in lp if len(res[p][1]) >= 2 and all(x["overall"] is not None for x in res[p][1][:2])]
    if two:
        st_l = sum(abs(res[p][1][0]["overall"] - res[p][1][1]["overall"]) <= 0.5 for p in two)
        st_s = sum(abs(gold16[p][0]["overall"] - gold16[p][1]["overall"]) <= 0.5 for p in two)
        say(f"  B6 again: two readings, each with its own looks, within 0.5: {st_l}/{len(two)} (stored, no looks: {st_s}/{len(two)}; "
            f"bar: at most {round(5 * len(two) / 223)} off)")
        for p in two:
            a, b = res[p][1][0], res[p][1][1]
            if abs(a["overall"] - b["overall"]) > 0.5:
                say(f"     {p}: {a['overall']:g} / {b['overall']:g}   {why(a)}  ||  {why(b)}")
    # what moved, and why
    moved = [p for p in lp if res[p][1][0]["overall"] != gold16[p][0]["overall"]]
    up = sum(res[p][1][0]["overall"] > gold16[p][0]["overall"] for p in moved)
    say(f"  moved by the looks (v16, first reading): {len(moved)} ({up} up, {len(moved) - up} down)")
    for p in sorted(moved, key=lambda p: res[p][1][0]["overall"] - gold16[p][0]["overall"]):
        say(f"     {p:9s} {gold16[p][0]['overall']:g} -> {res[p][1][0]['overall']:g}  panel {panel.get(p, float('nan')):g}"
            f"  {H.desc(runs[p][0])}\n               now: {why(res[p][1][0])}   was: {why(gold16[p][0])}")
    cnt = Counter()
    for p in lp:
        v = res[p][1][0]["v16"]
        for c in v["caps"]:
            cnt["cap " + c["id"]] += 1
        if v["held_by"]:
            cnt["held by " + str(v["held_by"])] += 1
    say("  caps with the looks (cool, first reading): " + ", ".join(f"{k} {n}" for k, n in sorted(cnt.items())))
    # the panel on the photos where each look rule fires
    pk = [p for p in lp if p in panel and P._second_look(looks[p][0], P.TUNE["v16"])["peek"]]
    h7 = [p for p in lp if p in panel and any(c["id"] == "H7" for c in res[p][1][0]["v16"]["caps"])]
    def avg(q):
        return f"{st.mean(panel[p] for p in q):.2f}" if q else "none"
    say(f"  the panel where they fire: a clear peek ({len(pk)}) {avg(pk)}, the H7 pooling cap ({len(h7)}) "
        f"{avg(h7)} ({sum(panel[p] <= 5.5 for p in h7)} at 5.5 or under); every gold photo "
        f"{st.mean(panel[p] for p in lp if p in panel):.2f}")

    # two narrower readings of the looks, for his call (not in the engine)
    say("  two narrower versions, for his call (paper only):")
    for label, po, oj, tn in (("as built", False, False, None), ("H7 only when the hem reads pooling", True, False, None),
                              ("no peek under a jacket or coat", False, True, None), ("both", True, True, None),
                              ("H7 a 6.5 hold, not a 5.5 sink", False, False, {"v16_h7_cap": 6.5}),
                              ("H7 a 6.5 hold + no peek under a jacket", False, True, {"v16_h7_cap": 6.5})):
        S = {p: [sc(runs[p][i], "everyday", PROFILE, narrow(looks[p][i], po, oj), tune=tn)
                 for i in range(min(2, len(looks[p])))] for p in lp}
        s0 = shares([S[p][0]["overall"] for p in lp])
        tw = [p for p in lp if len(S[p]) >= 2 and all(x["overall"] is not None for x in S[p][:2])]
        stv = sum(abs(S[p][0]["overall"] - S[p][1]["overall"]) <= 0.5 for p in tw)
        xs = [S[p][0]["overall"] for p in fp]
        say(f"    {label:36s} steady {stv}/{len(tw)}  worst band gap {100 * worst_gap(s0):.1f}  r with the panel "
            f"{pearson([S[p][0]['overall'] for p in pv], [panel[p] for p in pv]):.3f}  his 20: within 1 "
            f"{sum(abs(x - founder[p]) <= 1 for x, p in zip(xs, fp))}/{len(fp)}, r {pearson(xs, [founder[p] for p in fp]):.3f}")
    return res


def main():
    lines = []

    def say(s=""):
        print(s)
        lines.append(s)

    global OUT, KEY
    if "--taste" in sys.argv:                                         # every bar with the taste rules on (round 3)
        P.TUNE["v16"]["taste"] = json.loads(Path(sys.argv[sys.argv.index("--taste") + 1]).read_text())["taste"]
        OUT = HERE / "results" / "v16-taste"
    if "--key" in sys.argv and sys.argv[sys.argv.index("--key") + 1] == "consistent":
        kf = HERE / "results/taste1/consistent_key.json"              # his blind re-rate where he gave one (round 3)
        k = json.loads(kf.read_text())
        if not k.get("range_kept"):
            print("The consistent key moves his band shares more than 3 points; not used.")
            return 1
        KEY = k["key"]
        OUT = OUT.parent / (OUT.name + "-consistent")
    fit_only = "--fit" in sys.argv
    if "--curve" in sys.argv:                                         # explore: score with another curve (a,b,k)
        P.TUNE["v16"]["curve"] = tuple(float(x) for x in sys.argv[sys.argv.index("--curve") + 1].split(","))
    if not (H.DATA / "extraction-test/results/gold1/raw.json").exists():
        print(f"No gold data under {H.DATA}; set KITTED_DATA to the main checkout.")
        return 1
    runs, panel, founder, _ = H.load_gold()
    gold16 = {p: [sc(rd, "everyday", PROFILE) for rd in rs] for p, rs in runs.items()}
    gold_ok = [p for p in runs if gold16[p][0]["overall"] is not None]
    two = [p for p in runs if len(runs[p]) >= 2 and all(x["overall"] is not None for x in gold16[p][:2])]
    free = fit_curve([gold16[p][0] for p in gold_ok])
    fit = fit_curve([gold16[p][0] for p in gold_ok], [(gold16[p][0], gold16[p][1]) for p in two])
    say(f"The curve, fitted only to the shares (anchor 7): (a {free[1]:.2f}, b {free[2]:.2f}), worst band gap "
        f"{100 * free[0][0]:.1f} pts, but it breaks the steadiness bar")
    a0, b0, k0 = P.TUNE["v16"]["curve"]
    same = all(abs(x - y) < 1e-6 for x, y in zip(fit[1:4], (a0, b0, k0)))
    say(f"The curve: the engine has (a {a0:g}, b {b0:g}, k {k0:g}); a refit on the gold set's first readings gives "
        f"(a {fit[1]:.2f}, b {fit[2]:.2f}, k {fit[3]:.3f}), worst band gap {100 * fit[0][0]:.1f} pts: {'MATCHES' if same else 'DIFFERS'}")
    say(f"  refit shares: {fmt_shares(fit[4])}")
    if fit_only:
        return 0
    say()
    fails = run_dealbreakers(say)
    say()
    cr = load_creators()
    if cr:
        fails += run_creators(say, cr)
    else:
        say("No creators' readings found (results/creators1/raw.json): B2 and B3 not run.")
        fails += 1
    say()

    # ---- gold: v15, v16 cool and warm
    gold15 = {p: [sc(rd, "everyday", PROFILE, engine="v15") for rd in rs] for p, rs in runs.items()}
    goldw = {p: [sc(rd, "everyday", PROFILE, season="warm") for rd in rs] for p, rs in runs.items()}
    ps = [p for p in gold_ok if gold15[p][0]["overall"] is not None]
    say(f"== The gold set ({len(runs)} photos, {len(ps)} scored; profile unknown, the test profile, Everyday) ==")
    s15 = shares([gold15[p][0]["overall"] for p in ps])
    s16 = shares([gold16[p][0]["overall"] for p in ps])
    sw = shares([goldw[p][0]["overall"] for p in ps])
    say(f"  target           {fmt_shares({n: t for n, _, _, t in BANDS})}")
    say(f"  v15              {fmt_shares(s15)}   worst gap {100 * worst_gap(s15):.1f}")
    say(f"  v16 cool         {fmt_shares(s16)}   worst gap {100 * worst_gap(s16):.1f}")
    say(f"  v16 warm         {fmt_shares(sw)}   worst gap {100 * worst_gap(sw):.1f}")
    ok5g = worst_gap(s16) <= 0.05
    say(f"B5a gold band shares within 5 points (cool): {'PASS' if ok5g else 'FAIL'}")
    fails += not ok5g
    for name, S in (("v15", gold15), ("v16 cool", gold16), ("v16 warm", goldw)):
        xs = [S[p][0]["overall"] for p in ps]
        pv = [panel[p] for p in ps if p in panel]
        say(f"  {name:9s} mean {st.mean(xs):.2f} sd {st.pstdev(xs):.2f}  exactly 7.0 {100 * sum(x == 7.0 for x in xs) / len(xs):.0f}%"
            f"  range {min(xs):g}-{max(xs):g}  r with the panel {pearson([S[p][0]['overall'] for p in ps if p in panel], pv):.3f}")
    low = [p for p in ps if p in panel and panel[p] <= 5.5]
    high = [p for p in ps if p in panel and panel[p] >= 8.0]
    for name, S in (("v15", gold15), ("v16", gold16)):
        say(f"  {name}: the panel's worst ({len(low)}, panel 5.5 or under) average {st.mean(S[p][0]['overall'] for p in low):.2f}, "
            f"{sum(S[p][0]['overall'] >= 7 for p in low)} at 7+; the panel's best ({len(high)}, 8+) average "
            f"{st.mean(S[p][0]['overall'] for p in high):.2f}")
    say()

    # ---- B1 his blind ratings
    fp = [p for p in founder if p in runs and gold16[p][0]["overall"] is not None]
    hv = [founder[p] for p in fp]
    say(f"== B1 His blind ratings ({len(fp)} of 20 today; Y32's 60 {'FOUND at ' + str(Y32) + ' (not read by this run)' if Y32.exists() else 'not in yet'}) ==")
    for name, S in (("v15", gold15), ("v16 cool", gold16), ("v16 warm", goldw)):
        xs = [S[p][0]["overall"] for p in fp]
        w1 = sum(abs(x - y) <= 1.0 for x, y in zip(xs, hv))
        say(f"  {name:9s} within 1 point {w1}/{len(fp)}  within 0.5 {sum(abs(x - y) <= 0.5 for x, y in zip(xs, hv))}/{len(fp)}"
            f"  r {pearson(xs, hv):.3f}  mean {st.mean(xs):.2f} (his {st.mean(hv):.2f})")
    pp = [p for p in fp if p in panel]
    r_panel = pearson([panel[p] for p in pp], [founder[p] for p in pp])
    xs = [gold16[p][0]["overall"] for p in fp]
    w1 = sum(abs(x - y) <= 1.0 for x, y in zip(xs, hv))
    r16 = pearson(xs, hv)
    say(f"  the panel with him: r {r_panel:.3f}  within 1 point {sum(abs(panel[p] - founder[p]) <= 1 for p in pp)}/{len(pp)}")
    ok1 = w1 >= 0.8 * len(fp) and r16 >= 0.69
    say(f"B1 within 1 on 8 in 10 ({w1}/{len(fp)}) and r >= 0.69 ({r16:.3f}): {'PASS' if ok1 else 'FAIL'} (20 of the 80 ratings)")
    fails += not ok1
    for p in sorted(fp, key=lambda p: founder[p] - gold16[p][0]["overall"]):
        say(f"     {p:9s} his {founder[p]:g}  panel {panel.get(p, float('nan')):g}  v15 {gold15[p][0]['overall']:g}  "
            f"v16 {gold16[p][0]['overall']:g}  {H.desc(runs[p][0])}\n               why: {why(gold16[p][0])}")
    say()

    # ---- B6 steadiness
    two = [p for p in runs if len(runs[p]) >= 2 and all(x["overall"] is not None for x in gold16[p][:2])]

    def steady(S):
        return sum(abs(S[p][0]["overall"] - S[p][1]["overall"]) <= 0.5 for p in two)
    st15, st16, stw = steady(gold15), steady(gold16), steady(goldw)
    ok6 = len(two) - st16 <= 5
    say(f"B6 the two stored readings within 0.5: v15 {st15}/{len(two)}  v16 cool {st16}/{len(two)}  v16 warm {stw}/{len(two)}: "
        f"{'PASS' if ok6 else 'FAIL'}")
    fails += not ok6
    for p in two:
        a, b = gold16[p][0], gold16[p][1]
        if abs(a["overall"] - b["overall"]) > 0.5:
            say(f"     {p}: {a['overall']:g} / {b['overall']:g}   {why(a)}  ||  {why(b)}")
    say()

    # ---- the phone checks
    ph = H.load_phone()
    rows = []
    for k, v in sorted(ph.items(), key=lambda kv: kv[1]["at"] or 0):
        b = sc(v["reading"], v["occ"], FOUNDER, v["sl"], engine="v15")
        a = sc(v["reading"], v["occ"], FOUNDER, v["sl"])
        w = sc(v["reading"], v["occ"], FOUNDER, v["sl"], season="warm")
        if a["overall"] is None or b["overall"] is None:
            continue
        rows.append((k, v, b, a, w))
    say(f"== His saved checks ({len(rows)} scored of {len(ph)}; his profile, own occasion and second look) ==")
    p15 = shares([r[2]["overall"] for r in rows])
    p16 = shares([r[3]["overall"] for r in rows])
    pw = shares([r[4]["overall"] for r in rows])
    say(f"  target           {fmt_shares({n: t for n, _, _, t in BANDS})}")
    say(f"  v15              {fmt_shares(p15)}   worst gap {100 * worst_gap(p15):.1f}")
    say(f"  v16 cool         {fmt_shares(p16)}   worst gap {100 * worst_gap(p16):.1f}")
    say(f"  v16 warm         {fmt_shares(pw)}   worst gap {100 * worst_gap(pw):.1f}")
    ok5p = worst_gap(p16) <= 0.05
    say(f"B5b his saved checks' band shares within 5 points (cool): {'PASS' if ok5p else 'FAIL'}")
    fails += not ok5p
    say(f"  mean v15 {st.mean(r[2]['overall'] for r in rows):.2f} -> v16 {st.mean(r[3]['overall'] for r in rows):.2f}; "
        f"exactly 7.0 {sum(r[2]['overall'] == 7 for r in rows)} -> {sum(r[3]['overall'] == 7 for r in rows)}")
    for k, v, b, a, w in rows:
        say(f"  {k} {v['occ']:9s} v15 {b['overall']:g} -> v16 {a['overall']:g} [warm {w['overall']:g}]  {H.desc(v['reading'])}"
            f"\n        why: {why(a)}")
    say()

    hisk = dict(founder)
    f4n, _ = load_founder4()
    hisk.update(f4n)
    if KEY:
        hisk.update({k: v for k, v in KEY.items() if k in hisk})
    OUT.mkdir(parents=True, exist_ok=True)
    run_named(say, runs, ph, cr, hisk)
    say()
    # ---- what the season moves
    say("== What the season moves (cool -> warm, first reading) ==")
    for name, pairs in (("gold", [(gold16[p][0], goldw[p][0]) for p in ps]), ("his checks", [(r[3], r[4]) for r in rows])):
        up = sum(w["overall"] > c["overall"] for c, w in pairs)
        dn = sum(w["overall"] < c["overall"] for c, w in pairs)
        why_c = Counter()
        for c, w in pairs:
            if w["overall"] == c["overall"]:
                continue
            lc = {x["id"] for x in c["v16"]["lifts"]}
            lw = {x["id"] for x in w["v16"]["lifts"]}
            for x in sorted(lc - lw):
                why_c[f"loses {x}"] += 1
            for x in sorted(lw - lc):
                why_c[f"gains {x}"] += 1
            if w["v16"]["heavy_layer"]:
                why_c["heavy layer"] += 1
            if c["v16"]["fault_drop"] != w["v16"]["fault_drop"]:
                why_c["a charge waived (light on light, tank alone)"] += 1
        say(f"  {name}: {up} up, {dn} down of {len(pairs)}; " + ", ".join(f"{k} {n}" for k, n in why_c.most_common()))
    say()

    # ---- 8+ by dressiness (the casual-first check)
    say("  8+ share by how dressy the clothes are (gold, first reading, cool):")
    bands = {p: H.band(runs[p][0]) for p in ps}
    for bn in ("athletic", "casual", "in-between", "dressy"):
        q = [p for p in ps if bands[p] == bn]
        if q:
            say(f"    {bn:10s} n {len(q):3d}  v15 8+ {100 * sum(gold15[p][0]['overall'] >= 8 for p in q) / len(q):3.0f}%  "
                f"v16 8+ {100 * sum(gold16[p][0]['overall'] >= 8 for p in q) / len(q):3.0f}%  "
                f"mean {st.mean(gold15[p][0]['overall'] for p in q):.2f} -> {st.mean(gold16[p][0]['overall'] for p in q):.2f}")
    say()
    # ---- which rules fire, how often (gold, cool)
    cnt = Counter()
    for p in ps:
        v = gold16[p][0]["v16"]
        for c in v["caps"]:
            cnt["cap " + c["id"]] += 1
        for x in v["lifts"]:
            cnt["lift " + x["id"]] += 1
        if v["held_by"]:
            cnt["held by " + str(v["held_by"])] += 1
    say("  How often each v16 rule fires on the gold set (cool, first reading): " + ", ".join(f"{k} {n}" for k, n in sorted(cnt.items())))
    say()
    looked = run_looks(say, runs, panel, founder, gold15, gold16, ps)
    say()
    full = run_b1_full(say, runs, panel, founder, gold15, gold16, looked)
    if full is not None:
        fails += (not full[0]) - (not ok1)                                # the full set replaces the 20-photo verdict
        say()
        taste_calls(say, panel, full[1], full[2], full[3])
    say()
    say(f"{'ALL BARS PASS' if not fails else f'{fails} BAR CHECK(S) FAIL'} (the bars are judged on the stored readings; "
        f"round 2 above is reported beside them)")
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "report.txt").write_text("\n".join(lines) + "\n")
    dump = {"gold": {p: {"v15": [x["overall"] for x in gold15[p]], "v16_cool": [x["overall"] for x in gold16[p]],
                         "v16_warm": [x["overall"] for x in goldw[p]], "panel": panel.get(p), "founder": founder.get(p),
                         "why": why(gold16[p][0]), "pieces": H.desc(runs[p][0])} for p in ps},
            "phone": {k: {"occ": v["occ"], "v15": b["overall"], "v16_cool": a["overall"], "v16_warm": w["overall"],
                          "why": why(a), "pieces": H.desc(v["reading"])} for k, v, b, a, w in rows}}
    for p, (l15, l16) in looked.items():
        if p in dump["gold"]:
            dump["gold"][p].update({"v15_looks": [x["overall"] for x in l15], "v16_looks": [x["overall"] for x in l16],
                                    "why_looks": why(l16[0])})
    (OUT / "scores.json").write_text(json.dumps(dump, indent=1) + "\n")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())

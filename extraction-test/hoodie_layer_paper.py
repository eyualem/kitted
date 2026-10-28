#!/usr/bin/env python3
"""A hoodie layered over a tee, on paper (Oct 28, 2026; DECISIONS-LOG #385). No API calls. Compares parts engine v14 (today)
with v15 (v14 + PRO-17: a hoodie or sweatshirt worn as the one layer over a tee and full legs earns the short jacket's
+1.5 on Proportions, in [PRO-14]'s place).

  /usr/bin/python3 hoodie_layer_paper.py     the test outfits (pass/fail bars written before the run), the conformance
                                              cases, the gold set and every saved phone check; writes
                                              results/hoodie-layer/report.txt; exits 1 on any failed check

Data: the gold readings and the panel (results/gold1/raw.json, inputs/gold-judge/) and the phone pulls
(screenshots/phone/*/SQLite/kitted.db) are git-ignored and read from KITTED_DATA (default: this checkout). The Oct 28 pull
lives in the recheck-added-layer worktree; EXTRA_PULLS adds it when it's there.

Rule 7: the founder's own checks are scored with his profile (born 2004, age band 22-25; picks streetwear, minimal,
workwear) at their own occasion. Gold photos are "profile unknown", scored with one stated test profile (Minimal + Smart
casual, 0.5 each, boldness "a little") at Everyday, as gold_tune.py. The test outfits are made-up readings.
"""
import csv
import glob
import json
import os
import sqlite3
import statistics as st
import sys
from collections import defaultdict
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
K = HERE.parent
DATA = Path(os.environ.get("KITTED_DATA", K))
EXTRA_PULLS = [Path("/Users/eyu/Desktop/files/Kitted/.claude/worktrees/recheck-added-layer-11b01f")]
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rubrics"))
import rubric as R  # noqa: E402
import parts_proto as P  # noqa: E402
import rules_conformance as RC  # noqa: E402

OUT = HERE / "results" / "hoodie-layer"
PROFILE = R.parse_styles("minimalist:0.5,smart_casual:0.5")          # the gold set's stated test profile
FOUNDER = {"streetwear": 0.5, "minimalist": 0.25, "workwear": 0.25}  # his picks, in order (rule 7)
BEFORE, AFTER = "v14", "v15"
FIX = json.load(open(K / "app/src/__tests__/fixtures/oct28-hoodie-recheck.json"))


def score(rd, occ="everyday", styles=None, engine=AFTER, sl=None):
    # v15 here is the hoodie layer alone: v15's color tie-in (cp8, COL-13) has its own paper test, tonal_layer_paper.py
    return P.score_parts(rd, occ, styles or {}, sl, "a_little", engine=engine, tune={"cp8": 0.0} if engine == "v15" else None)


def fired(r, check):
    return any(x["check"] == check for v in (r.get("parts") or {}).values() for x in v["reasons"])


def same(a, b):
    if a.get("overall") != b.get("overall") or a.get("raw_score") != b.get("raw_score"):
        return False
    return {k: v["score"] for k, v in (a.get("parts") or {}).items()} == {k: v["score"] for k, v in (b.get("parts") or {}).items()}


# ============================================================================================ the test outfits
G, top, outer, bottom, shoe, Rd, mod = RC.G, RC.top, RC.outer, RC.bottom, RC.shoe, RC.Rd, RC.mod
NTEE = top("tee", "navy")
HOOD = outer("hoodie", "green", length="na")                       # the reader rarely gives an outer piece a length
GHOOD = outer("hoodie", "grey", length="na")
CARGO = bottom("cargos", "olive", "straight")
BRUN = shoe("performance_runner", "black")
DJ, WJ, WLS = RC.DJEANS, RC.WJEANS, RC.WLS
CLEAR_PEEK = {"under_present": "yes", "under_shows": "clearly", "covers_shoe": "no"}
LITTLE_PEEK = {"under_present": "yes", "under_shows": "a_little", "covers_shoe": "no"}
HL = "PR2h_hoodie_layer"

# (id, what, reading, occasion, styles, second look, bar(before, after) -> bool, the bar in words)
OUTFITS = [
    ("H1", "his Oct 28 re-check (the stored reading): navy tee, green hoodie, olive straight cargos, black runners", FIX["recheck"],
     "everyday", FOUNDER, LITTLE_PEEK, lambda b, a: b["overall"] == 7.0 and a["overall"] == 7.5 and fired(a, HL), "7.0 -> 7.5, the credit fires"),
    ("H1b", "his Oct 28 first check (no hoodie)", FIX["first"], "everyday", FOUNDER, None,
     lambda b, a: same(b, a) and a["overall"] == 7.0, "unchanged, 7.0"),
    ("H2", "a grey hoodie over a white tee, dark straight jeans, white leather sneakers", Rd(GHOOD, RC.TEE, DJ, WLS),
     "everyday", None, None, lambda b, a: fired(a, HL) and a["overall"] >= b["overall"], "the credit fires; not lower"),
    ("H3", "a graphic tee under the green hoodie, wide jeans, chunky sneakers", Rd(HOOD, top("graphic_tee", "black"), WJ, RC.CHUNKY),
     "class", None, None, lambda b, a: fired(a, HL), "the credit fires"),
    ("H4", "a zip sweatshirt over a tee (the hoodie/sweatshirt flip)", Rd(outer("sweatshirt", "grey", length="na"), NTEE, DJ, WLS),
     "everyday", None, None, lambda b, a: fired(a, HL), "the credit fires"),
    ("G1", "a hoodie over a hoodie", Rd(HOOD, top("hoodie", "grey"), DJ, WLS), "everyday", None, None,
     lambda b, a: same(b, a) and not fired(a, HL), "unchanged"),
    ("G2", "a hoodie over a tank top", Rd(HOOD, top("tank_top", "white"), DJ, WLS), "everyday", None, None,
     lambda b, a: same(b, a), "unchanged"),
    ("G3", "a hoodie over a tee with sweatpants", Rd(HOOD, NTEE, bottom("sweatpants", "grey", "relaxed"), WLS), "everyday",
     None, None, lambda b, a: same(b, a), "unchanged (loungewear blocks shape credits)"),
    ("G4", "the same with joggers at Class", Rd(HOOD, NTEE, bottom("joggers", "black", "straight"), WLS), "class", None, None,
     lambda b, a: same(b, a), "unchanged"),
    ("G5", "a hoodie over a tee with slim jeans", Rd(HOOD, NTEE, RC.SLJEANS, WLS), "everyday", None, None,
     lambda b, a: same(b, a), "unchanged (needs full legs)"),
    ("G6", "a hoodie over a tee with skinny jeans", Rd(HOOD, NTEE, RC.SKJEANS, WLS), "everyday", None, None,
     lambda b, a: same(b, a), "unchanged"),
    ("G7", "a hoodie over a tee under a bomber (two layers)", Rd(outer("bomber", "black"), HOOD, NTEE, DJ, WLS), "everyday",
     None, None, lambda b, a: same(b, a), "unchanged (the one layer only)"),
    ("G8", "the tee clearly shows below the hoodie (second look)", Rd(HOOD, NTEE, DJ, WLS), "everyday", None, CLEAR_PEEK,
     lambda b, a: same(b, a), "unchanged, the -0.5 stays"),
    ("G9", "a hoodie over a tee at an interview", Rd(HOOD, NTEE, DJ, WLS), "interview", None, None,
     lambda b, a: a["overall"] <= 5.0 and a["overall"] - b["overall"] <= 0.0, "held as before (5.0 or less, no rise)"),
    ("G10", "the hoodie read as ending past the fly", Rd(mod(HOOD, length="below_crotch"), NTEE, WJ, WLS), "everyday", None,
     None, lambda b, a: same(b, a), "unchanged"),
    ("G11", "the hoodie read at the belt over wide jeans ([PRO-14]'s +1.0 today)", Rd(mod(HOOD, length="at_belt"), NTEE, WJ, WLS),
     "everyday", None, None,
     lambda b, a: fired(a, HL) and not fired(a, "PR2b_short_layer_read") and a["parts"]["proportions"]["score"] - b["parts"]["proportions"]["score"] == 0.5,
     "one credit: +1.5 in +1.0's place (Proportions +0.5), never both"),
    ("G12", "a bomber over a tee", Rd(outer("bomber", "black"), NTEE, DJ, WLS), "everyday", None, None,
     lambda b, a: same(b, a), "unchanged"),
    ("G13", "a hoodie over a tee with loose shorts", Rd(HOOD, NTEE, bottom("shorts", "khaki_beige", "relaxed", "na", volume=4), WLS),
     "everyday", None, None, lambda b, a: same(b, a), "unchanged (shorts keep their rules)"),
    ("G14", "a stained hoodie", Rd(mod(HOOD, condition="stained"), NTEE, DJ, WLS), "everyday", None, None,
     lambda b, a: same(b, a), "unchanged"),
    ("G15", "a hoodie on its own (the top)", Rd(top("hoodie", "green"), DJ, WLS), "everyday", None, None,
     lambda b, a: same(b, a), "unchanged"),
    ("G16", "a hoodie over an oxford (not a tee)", Rd(HOOD, top("oxford_shirt", "white"), DJ, WLS), "everyday", None, None,
     lambda b, a: same(b, a), "unchanged (tees only)"),
    ("G17", "an overshirt over a tee (not a hoodie)", Rd(outer("overshirt", "olive", length="na"), NTEE, DJ, WLS), "everyday",
     None, None, lambda b, a: same(b, a), "unchanged"),
    ("G18", "a hoodie over a tee, straight jeans pooling", Rd(HOOD, NTEE, mod(DJ, hem="pooling"), WLS), "everyday", None, None,
     lambda b, a: same(b, a), "unchanged (a clean finish)"),
    ("G19", "a hoodie over a tee with slides", Rd(HOOD, NTEE, DJ, RC.SLIDES), "everyday", None, None,
     lambda b, a: a["overall"] <= 7.0, "stays 7.0 or less (slides still hold it)"),
]


def run_outfits(say):
    say("== The test outfits (bars written before the run) ==")
    bad = 0
    for oid, what, rd, occ, sty, sl, bar, words in OUTFITS:
        b, a = score(rd, occ, sty, BEFORE, sl), score(rd, occ, sty, AFTER, sl)
        ok = bool(bar(b, a))
        bad += not ok
        say(f"  {oid:4s} {'PASS' if ok else 'FAIL'}  {b['overall']:g} -> {a['overall']:g} (raw {b['raw_score']:.3f} -> "
            f"{a['raw_score']:.3f})  {what}  [bar: {words}]")
    return bad


# ============================================================================================ data
def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def half(x):
    return round(x * 2) / 2


def load_gold():
    """As casual_athletic_paper.load_gold(): the panel = median of the five judges' part-weighted means."""
    Gd, J = DATA / "extraction-test/results/gold1", DATA / "inputs/gold-judge"
    raw = json.load(open(Gd / "raw.json"))
    runs = defaultdict(dict)
    for x in raw:
        if x.get("json"):
            runs[x["photo"]][x["run"]] = x["json"]
    runs = {p: [v[i] for i in sorted(v)] for p, v in runs.items()}
    W = {"fit": 25, "proportion": 25, "color": 15, "shoes": 15, "cohesion": 15, "condition": 5}
    photo_of = {m["gid"]: m["photo"] for m in json.load(open(J / "manifest.json"))}
    rows = defaultdict(dict)
    for f in sorted(J.glob("judge-*-b*.csv")):
        for r in csv.DictReader(f.open()):
            if r.get("id"):
                rows[f.stem.split("-")[1]][r["id"].strip()] = r
    per = defaultdict(lambda: defaultdict(list))
    for j in rows:
        for g, r in rows[j].items():
            p = photo_of.get(g)
            if p is None:
                continue
            got = {k: num(r.get(k)) for k in W}
            got = {k: v for k, v in got.items() if v is not None}
            if got:
                per[p][j].append(sum(v * W[k] for k, v in got.items()) / sum(W[k] for k in got))
    panel = {p: half(st.median(st.mean(x) for x in v.values())) for p, v in per.items() if len(v) == len(rows)}
    fman = {m["fid"]: m["photo"] for m in json.load(open(J / "founder" / "manifest.json"))}
    founder = {fman[r["id"]]: float(r["score"]) for r in csv.DictReader(open(J / "founder" / "ratings.csv"))}
    split = json.load(open(HERE / "results/gold-tune/split.json"))
    return runs, panel, founder, set(split["test"])


def load_phone():
    """Every scored check in every phone pull, deduped by image hash (the newest pull wins), with its stored second look."""
    out = {}
    dbs = sorted(glob.glob(str(DATA / "screenshots/phone/*/SQLite/kitted.db")))
    for e in EXTRA_PULLS:
        dbs += sorted(glob.glob(str(e / "screenshots/phone/*/SQLite/kitted.db")))
    for db in dbs:
        cx = sqlite3.connect(f"file:{db}?mode=ro&immutable=1", uri=True)
        try:
            q = cx.execute("select f.image_hash, f.occasion, r.reading_json, f.details, f.created_at from fit_checks f join "
                           "readings r on r.id = f.reading_id where f.status = 'scored' order by f.created_at").fetchall()
        except sqlite3.Error:
            q = []
            try:
                q = [(h, o, j, "{}", c) for h, o, j, c in cx.execute(
                    "select f.image_hash, f.occasion, r.reading_json, f.created_at from fit_checks f join readings r on "
                    "r.id = f.reading_id where f.status = 'scored'").fetchall()]
            except sqlite3.Error:
                continue
        for h, occ, js, det, ca in q:
            if not js:
                continue
            try:
                d = json.loads(det or "{}")
            except ValueError:
                d = {}
            slr = d.get("secondLook") or {}
            sl = None
            if slr.get("u") or slr.get("l"):
                sl = {**(slr.get("u") or {}), **(slr.get("l") or {})}
            out["phone-" + h[:6]] = {"reading": json.loads(js), "occ": occ, "sl": sl, "at": ca}
    return out


def pearson(a, b):
    ma, mb = st.mean(a), st.mean(b)
    n = sum((x - ma) * (y - mb) for x, y in zip(a, b))
    d = (sum((x - ma) ** 2 for x in a) * sum((y - mb) ** 2 for y in b)) ** 0.5
    return n / d if d else float("nan")


def seq(rs):
    return "/".join(f"{x['overall']:g}" if x['overall'] is not None else "-" for x in rs)


def desc(rd):
    return " + ".join(f"{g.get('subcategory')} ({g.get('color_family')}"
                      + (f", {g.get('leg_shape')}" if g.get("category") == "bottom" else "") + ")"
                      for g in rd.get("garments", []) if g.get("category") in ("top", "outerwear", "bottom", "footwear"))


def band(rd):
    gs = [g for g in rd.get("garments", []) if g.get("category") in ("top", "outerwear", "bottom")]
    if not gs:
        return None
    if any(g.get("subcategory") in R.LOUNGE_BOTTOMS for g in gs):
        return "athletic"
    m = st.mean(R.formality(g) for g in gs)
    return "casual" if m < 2.5 else "in-between" if m < 3.0 else "dressy"


def main():
    lines = []

    def say(s=""):
        print(s)
        lines.append(s)

    fails = run_outfits(say)
    say()
    # ---- the conformance cases: every case that moves must have a hoodie or sweatshirt worn as the layer
    moved = []
    for c in RC.CASES:
        b = score(c["reading"], c["occasion"], dict(c["styles"]), BEFORE, c["second_look"])
        a = score(c["reading"], c["occasion"], dict(c["styles"]), AFTER, c["second_look"])
        if not same(b, a):
            moved.append((c["id"], b.get("overall"), a.get("overall"),
                          any(g.get("category") == "outerwear" and g.get("subcategory") in P.HL_LAYERS for g in c["reading"]["garments"])))
    stray = [m for m in moved if not m[3]]
    say(f"C1 conformance cases ({len(RC.CASES)}): {len(moved)} move, {len(stray)} without a hoodie or sweatshirt layer: "
        f"{'PASS' if not stray else 'FAIL'}")
    for cid, b, a, _ in moved:
        say(f"     {cid}: {b} -> {a}")
    fails += bool(stray)
    say()
    if not (DATA / "extraction-test/results/gold1/raw.json").exists():
        say(f"No gold data under {DATA}; set KITTED_DATA to the main checkout.")
        return 1

    # ---- the gold set
    runs, panel, founder, test = load_gold()
    Bs = {p: [score(rd, "everyday", PROFILE, BEFORE) for rd in rs] for p, rs in runs.items()}
    As = {p: [score(rd, "everyday", PROFILE, AFTER) for rd in rs] for p, rs in runs.items()}
    gm = [p for p in runs if any(not same(x, y) for x, y in zip(Bs[p], As[p]))]
    say(f"== The gold set ({len(runs)} photos, 5-judge AI panel; profile unknown, one stated test profile, Everyday) ==")
    say(f"  photos whose score or parts move on any run: {len(gm)}")
    for p in gm:
        say(f"     {p}: panel {panel.get(p, float('nan')):.1f} founder {founder.get(p, '-')}  "
            f"{seq(Bs[p])} -> {seq(As[p])}   {desc(runs[p][0])}")

    def metr(S, ps):
        ps = [p for p in ps if p in panel and S[p] and S[p][0]["overall"] is not None]
        app, pan = [S[p][0]["overall"] for p in ps], [panel[p] for p in ps]
        return len(ps), pearson(app, pan), sum(abs(x - y) <= 0.5 for x, y in zip(app, pan))
    for name, ps in (("all photos", list(runs)), ("held-out test half", [p for p in runs if p in test])):
        nb, rb, wb = metr(Bs, ps)
        na_, ra, wa = metr(As, ps)
        say(f"  {name:20s} n {nb:3d}  r {rb:.3f} -> {ra:.3f}   within 0.5 {wb} -> {wa}")
    _, rb, _ = metr(Bs, [p for p in runs if p in test])
    _, ra, _ = metr(As, [p for p in runs if p in test])
    ok = ra >= rb - 0.03
    say(f"C2 held-out r doesn't drop by more than 0.03: {'PASS' if ok else 'FAIL'}")
    fails += not ok
    fp = [p for p in founder if p in runs and Bs[p][0]["overall"] is not None]
    fb, fa, fr = [Bs[p][0]["overall"] for p in fp], [As[p][0]["overall"] for p in fp], [founder[p] for p in fp]
    wb, wa = sum(abs(x - y) <= 0.5 for x, y in zip(fb, fr)), sum(abs(x - y) <= 0.5 for x, y in zip(fa, fr))
    ok = wa >= wb
    say(f"C3 the founder's {len(fp)} blind ratings: r {pearson(fb, fr):.3f} -> {pearson(fa, fr):.3f}; within 0.5 {wb} -> {wa}: "
        f"{'PASS' if ok else 'FAIL'}")
    fails += not ok

    def steady(S):
        two = [p for p in S if len(S[p]) >= 2 and all(x["overall"] is not None for x in S[p][:2])]
        return sum(abs(S[p][0]["overall"] - S[p][1]["overall"]) <= 0.5 for p in two), len(two)
    sb, sa = steady(Bs), steady(As)
    ok = sa[0] >= sb[0]
    say(f"C4 the two runs within 0.5: {sb[0]}/{sb[1]} -> {sa[0]}/{sa[1]}: {'PASS' if ok else 'FAIL'}")
    fails += not ok
    say("  8+ share by how dressy the clothes are (run 1):")
    bands = {p: band(runs[p][0]) for p in runs}
    jump = False
    for bn in ("athletic", "casual", "in-between", "dressy"):
        ps = [p for p in runs if bands[p] == bn and Bs[p][0]["overall"] is not None]
        if not ps:
            continue
        b8 = sum(Bs[p][0]["overall"] >= 8 for p in ps)
        a8 = sum(As[p][0]["overall"] >= 8 for p in ps)
        pv = [panel[p] for p in ps if p in panel]
        say(f"    {bn:10s} n {len(ps):3d}  8+ {b8} ({100 * b8 / len(ps):.0f}%) -> {a8} ({100 * a8 / len(ps):.0f}%)   "
            f"mean {st.mean(Bs[p][0]['overall'] for p in ps):.2f} -> {st.mean(As[p][0]['overall'] for p in ps):.2f}   panel 8+ "
            f"{sum(x >= 8 for x in pv)} ({100 * sum(x >= 8 for x in pv) / max(1, len(pv)):.0f}%)")
        jump |= (a8 - b8) / len(ps) > 0.03
    say(f"C5 no band's 8+ share rises by more than 3 points: {'PASS' if not jump else 'FAIL'}")
    fails += jump
    say()

    # ---- the saved phone checks, his profile, their own occasion and second look
    ph = load_phone()
    say(f"== His saved phone checks ({len(ph)}, every pull, deduped; his profile, their own occasion and second look) ==")
    mv = 0
    for k, v in sorted(ph.items(), key=lambda kv: kv[1]["at"] or 0):
        b = score(v["reading"], v["occ"], FOUNDER, BEFORE, v["sl"])
        a = score(v["reading"], v["occ"], FOUNDER, AFTER, v["sl"])
        if b.get("overall") is None:
            continue
        if not same(a, b):
            mv += b["overall"] != a["overall"]
            say(f"  {k} {v['occ']:9s} {b['overall']:g} -> {a['overall']:g} (raw {b['raw_score']:.3f} -> {a['raw_score']:.3f})  "
                f"{desc(v['reading'])}")
    say(f"  saved checks whose score moves: {mv}")
    say()
    say(f"{'ALL CHECKS PASS' if not fails else f'{fails} CHECK(S) FAIL'}")
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "report.txt").write_text("\n".join(lines) + "\n")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())

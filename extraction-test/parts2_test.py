#!/usr/bin/env python3
"""Reward tuning paper test (Oct 10): the parts engine v1 (parts-proto-1) vs v2 (parts-proto-2), with rubric.py v4.1
alongside. No API calls, no money. Nothing in rubric.py, the fixtures or app/ changes.

  /usr/bin/python3 parts2_test.py     -> results/parts2/analysis.txt + analysis.json + split.json
                                         (report: ../rubric/research/parts/tuning-results.md)

Same readings as parts_test.py (it imports that file's loaders): the 78-reading corpus, the newest phone pull, batch 1
arm A (+ look1 for the second look) for steadiness, zoom1 arm B as the design set, and the judge pilot. The lightness
what-ifs take `lightness` from batch 1 arm B1 run i (the arm that read it), copied by category onto arm A run i, so
only the lightness noise is added.

The judge pilot is split ONCE, by a fixed seed, into a tuning half and a held-out half (split.json). Photos of the same
outfit (his phone checks, the stock before/after pairs) stay in the same half. Every v2 setting after the first draft
was chosen on the tuning half only; the held-out half is reported separately.

Rule 7: the founder is profile pending; his friends are profile unknown; 703a8b and ebe23f are unknown (ask the
founder); stock and web photos are profile unknown. Everything is scored with ONE stated test profile: picks Minimal +
Smart casual (0.5 each), boldness "a little", no age. No engine lets picks or age move a number, so no split by age
band or picked look is possible.
"""
import copy
import json
import random
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
import parts_test as T  # noqa: E402  loaders, rule-7 labels, the judge-pilot reader's helpers

OUT = HERE / "results" / "parts2"
SEED = 20261010
PROFILE, BOLD = T.PROFILE, T.BOLD
ENGINES = ("v1", "v2")
LINES = []

# Photos of the same outfit stay together in the split (from b1_labels.csv / truth.csv notes).
OUTFIT = {
    "phone-8ad378": "black tee + wide jeans", "phone-403ade": "black tee + wide jeans",
    "phone-5a9049": "gingham shirt alone", "phone-7f14a4": "gingham shirt alone",
    "phone-6b14db": "hoodie + joggers + slides", "phone-7de605": "hoodie + joggers + slides",
    "phone-a765e8": "hoodie + joggers + slides",
    "phone-e438d4": "friend chore coat", "phone-f4870b": "friend chore coat", "phone-fb0b17": "friend chore coat",
    "phone-b0f0c8": "grey hoodie + boots", "phone-d6559a": "grey hoodie + boots",
    "phone-0d39d6": "grey hoodie + slides", "oct7-ph1": "grey hoodie + slides",
    "phone-1f1997": "black hoodie + slides", "phone-d58b14": "black hoodie + slides",
    "phone-e026de": "gingham over hoodie", "phone-f07193": "gingham over hoodie",
}


def outfit_of(k):
    if k in OUTFIT:
        return OUTFIT[k]
    if k.startswith("stock-p"):
        return "pair " + k.split("-")[1]
    return k


def say(s=""):
    LINES.append(s)
    print(s)


def score(reading, occ, sl=None, engine="v2", tune=None):
    return P.score_parts(reading, occ, PROFILE, sl, BOLD, engine=engine, tune=tune)


def v4(reading, occ):
    return R.score(reading, occ, PROFILE, BOLD)["overall"]


def with_lightness(reading, lit_reading):
    """Copy `lightness` by category (first garment of each category) from lit_reading onto a copy of reading."""
    lit = {}
    for g in (lit_reading or {}).get("garments", []):
        lit.setdefault(g.get("category"), g.get("lightness"))
    r = copy.deepcopy(reading)
    for g in r.get("garments", []):
        if lit.get(g.get("category")):
            g["lightness"] = lit[g.get("category")]
    return r


def bands(vals):
    n = len(vals) or 1
    c = lambda f: sum(1 for v in vals if f(v))  # noqa: E731
    b = {"n": len(vals), "median": st.median(vals) if vals else None, "mean": round(st.mean(vals), 2) if vals else None,
         "le5.5": c(lambda v: v <= 5.5), "6-6.5": c(lambda v: 6 <= v <= 6.5), "7-7.5": c(lambda v: 7 <= v <= 7.5),
         "8+": c(lambda v: v >= 8), "9+": c(lambda v: v >= 9), "values": dict(sorted(Counter(vals).items()))}
    b["pct8"] = round(100 * b["8+"] / n)
    return b


def band_line(name, vals):
    b = bands(vals)
    n = b["n"] or 1
    f = lambda k: f"{b[k]} ({round(100 * b[k] / n)}%)"  # noqa: E731
    return (f"  {name:34s} n={b['n']:3d} median {b['median']}  mean {b['mean']}  <=5.5 {f('le5.5')}  6-6.5 {f('6-6.5')}"
            f"  7-7.5 {f('7-7.5')}  8+ {f('8+')}  9+ {f('9+')}  values {b['values']}"), b


def cmp_stats(pairs):
    d = [s - p for s, p in pairs]
    if not d:
        return {"n": 0}
    return {"n": len(pairs), "mean_diff": round(st.mean(d), 2), "mae": round(st.mean(abs(x) for x in d), 2),
            "within_0.5": sum(1 for x in d if abs(x) <= 0.5), "off_1.5": sum(1 for x in d if abs(x) >= 1.5),
            "r": round(T.pearson([s for s, _ in pairs], [p for _, p in pairs]), 2)}


def fmt_cmp(o):
    if not o.get("n"):
        return "n 0"
    return (f"n {o['n']} · mean diff {o['mean_diff']:+.2f} · MAE {o['mae']} · within 0.5 {o['within_0.5']} · "
            f"off 1.5+ {o['off_1.5']} · r {o['r']}")


def parts_txt(r):
    return " · ".join(f"{P.PART_NAMES[k][:5]} {r['parts'][k]['display']:g}" if r["parts"][k]["display"] is not None
                      else f"{P.PART_NAMES[k][:5]} NA" for k in P.PART_ORDER) if r.get("parts") else "-"


# ---------------------------------------------------------------------------------------------------- data
def load():
    corpus = json.load(open(T.CORPUS))
    pull = T.load_pull()
    B1 = T.load_runs(HERE / "results/b1/raw.json", "A")
    B1L = T.load_runs(HERE / "results/b1/raw.json", "B1")
    U = T.load_runs(HERE / "results/look1/raw.json", "U")
    L = T.load_runs(HERE / "results/look1/raw.json", "L")
    Z = T.load_runs(HERE / "results/zoom1/raw.json", "B")
    Z.update(T.load_runs(HERE / "results/zoom1-stock/raw.json", "B"))
    Z = {T.zoom_key(k): v for k, v in Z.items()}
    prim = {}
    for k, v in pull.items():
        prim[k] = {"reading": v["reading"], "occ": v["occ"], "src": "pull 20261010"}
    for x in corpus:
        k = T.key_from_corpus(x["id"])
        if k not in prim:
            prim[k] = {"reading": x["reading"], "occ": x["occ"], "src": "corpus " + x["src"]}
    for k, runs in B1.items():
        if k not in prim:
            prim[k] = {"reading": runs[0], "occ": "everyday", "src": "b1 arm A run 0"}
    return prim, B1, B1L, U, L, Z


def load_panel():
    import csv
    import os
    man = json.load(open(K / "inputs/judge-pilot/manifest.json"))
    W = {"fit": .25, "proportion": .25, "color": .15, "shoes": .15, "cohesion": .15, "condition": .05}
    judges = {}
    for f in sorted(os.listdir(K / "inputs/judge-pilot")):
        if f.startswith("judge-") and f.endswith(".csv"):
            judges[f[6:-4]] = {r["id"]: r for r in csv.DictReader(open(K / "inputs/judge-pilot" / f))}

    def num(v):
        try:
            return float(v)
        except (TypeError, ValueError):
            return None

    def total(r):
        s = w = 0.0
        for kk, wt in W.items():
            v = num(r.get(kk))
            if v is not None:
                s += wt * v; w += wt
        return round(2 * s / w) / 2 if w else None

    jp = []
    for m in man:
        if not m.get("ok"):
            continue
        tv = [t for t in (total(d[m["id"]]) for d in judges.values() if m["id"] in d) if t is not None]
        if tv:
            jp.append({"id": m["id"], "key": T.key_from_source(m["source"]), "group": m["group"], "panel": st.median(tv)})
    return jp


def make_split(jp):
    """Fixed-seed split by outfit, stratified by the manifest group, balanced by photo count."""
    rng = random.Random(SEED)
    half = {}
    counts = {"tune": 0, "held": 0}
    for grp in sorted({x["group"] for x in jp}):
        outfits = defaultdict(list)
        for x in jp:
            if x["group"] == grp:
                outfits[outfit_of(x["key"])].append(x["id"])
        names = sorted(outfits)
        rng.shuffle(names)
        gc = {"tune": 0, "held": 0}
        for i, nm in enumerate(names):
            side = ("tune" if i % 2 == 0 else "held") if gc["tune"] == gc["held"] else min(gc, key=gc.get)
            for pid in outfits[nm]:
                half[pid] = side
            gc[side] += len(outfits[nm]); counts[side] += len(outfits[nm])
    return half, counts


# ---------------------------------------------------------------------------------------------------- engine edits
def edit(reading, fn):
    r = copy.deepcopy(reading)
    changed = fn(r["garments"]) if r.get("garments") else False
    return r if changed else None


def fix_tuck(gs):
    """Tuck the tee (or shirt/polo): the first top, if it isn't ribbed and isn't fully tucked."""
    for g in gs:
        if g.get("category") == "top":
            if g.get("subcategory") in P.RIBBED or g.get("tucked") == "full":
                return False
            g["tucked"] = "full"
            return True
    return False


def fix_slides(gs):
    for g in gs:
        if g.get("category") == "footwear" and g.get("subcategory") == "slides_sandals":
            g.update({"subcategory": "white_leather_sneaker", "color_family": "white", "condition": "clean",
                      "certainty": "clear", "pattern": "solid"})
            return True
    return False


def fix_fit(gs):
    """Swap to a better-fitting piece: sleeves to the wrist, no strain (tops, layers and bottoms)."""
    ch = False
    for g in gs:
        if g.get("category") in ("top", "outerwear") and g.get("sleeve_end") == "covers_hand" \
                and g.get("subcategory") not in P.SHORT_SLEEVE_TYPES:
            g["sleeve_end"] = "at_wrist"; ch = True
        if g.get("category") in ("top", "outerwear", "bottom") and g.get("strain") == "clear":
            g["strain"] = "none"; ch = True
    return ch


def _visible_layer(gs):
    outer = next((g for g in gs if g.get("category") == "outerwear"), None)
    return outer or next((g for g in gs if g.get("category") == "top"), None)


def _quiet(gs):
    main = [g for g in gs if g.get("category") in ("top", "outerwear", "bottom")]
    return main and not any(R.is_bright(g) or (g.get("color_family") not in R.NEUTRALS and g.get("color_family") not in
                                               (None, "multicolor") and not str(g.get("color_family")).startswith("denim"))
                            or g.get("pattern") not in (None, "solid") for g in main)


def fix_standout_color(gs):
    """Add the missing standout: the visible top layer in one bright color (only on an all-neutral, all-solid outfit)."""
    if not _quiet(gs):
        return False
    g = _visible_layer(gs)
    if g is None:
        return False
    g.update({"color_family": "red", "saturation": "bright"})
    return True


def fix_standout_pattern(gs):
    """Add the missing standout: the visible top layer in a medium plaid (only on an all-neutral, all-solid outfit)."""
    if not _quiet(gs):
        return False
    g = _visible_layer(gs)
    if g is None:
        return False
    g.update({"pattern": "checks_plaid", "pattern_scale": "medium"})
    return True


FIXES = [("tuck the top", fix_tuck), ("slides -> white leather sneakers", fix_slides),
         ("a better-fitting piece", fix_fit), ("add a standout color", fix_standout_color),
         ("add a standout pattern", fix_standout_pattern)]


# ---------------------------------------------------------------------------------------------------- main
def main():
    OUT.mkdir(parents=True, exist_ok=True)
    prim, B1, B1L, U, L, Z = load()
    res = {"profile": "test profile: picks Minimal + Smart casual (0.5 each), boldness a little, no age",
           "engines": P.VERSIONS, "tune": P.TUNE, "seed": SEED}
    say(f"PARTS TUNING PAPER TEST · v1 = {P.VERSIONS['v1']} · v2 = {P.VERSIONS['v2']} · rubric.py v4.1 alongside")
    say(f"  {res['profile']}. Rule 7: founder profile pending; friends profile unknown; 703a8b and ebe23f unknown "
        f"(ask the founder); stock/web profile unknown.")

    rows = {}
    for k, v in prim.items():
        sl = T.second_look_for(k, U, L)
        r = {"who": T.who(k), "occ": v["occ"], "src": v["src"], "v4": v4(v["reading"], v["occ"])}
        for e in ENGINES:
            r[e] = score(v["reading"], v["occ"], sl, e)
        rows[k] = r
    sel = [k for k, r in rows.items() if r["v4"] is not None and all(r[e]["overall"] is not None for e in ENGINES)]

    # ======================== (1) the split
    jp = [x for x in load_panel() if x["key"] in rows]
    half, counts = make_split(jp)
    res["split"] = {"seed": SEED, "counts": counts, "photos": {x["id"]: {"key": x["key"], "half": half[x["id"]],
                                                                          "outfit": outfit_of(x["key"])} for x in jp}}
    json.dump(res["split"], open(OUT / "split.json", "w"), indent=1)
    say(f"\n(1) JUDGE-PILOT SPLIT (seed {SEED}, by outfit, stratified by group): tuning {counts['tune']} · held-out "
        f"{counts['held']}")
    for side in ("tune", "held"):
        ids = sorted(x["id"] for x in jp if half[x["id"]] == side)
        say(f"  {side:5s}: " + " ".join(ids))
    top = [x for x in jp if x["panel"] >= 8 or x["id"] in ("P043", "P044")]
    say("  the panel's top photos: " + ", ".join(f"{x['id']} ({x['panel']}, {half[x['id']]})" for x in sorted(top, key=lambda x: x["id"])))

    # ======================== (2) spread
    say("\n(2) SCORE SPREAD, one reading per distinct photo, each at its own occasion")
    res["spread"] = {}
    groups = [("all photos", lambda r: True), ("founder (profile pending)", lambda r: r["who"] == "founder"),
              ("friends (profile unknown)", lambda r: r["who"] == "friend"),
              ("unknown (ask)", lambda r: r["who"] == "unknown"),
              ("web mirror (profile unknown)", lambda r: r["who"] == "web"),
              ("stock (profile unknown)", lambda r: r["who"] == "stock")]
    for gname, f in groups:
        ks = [k for k in sel if f(rows[k])]
        res["spread"][gname] = {}
        for nm, get in (("v4.1", lambda k: rows[k]["v4"]), ("v1", lambda k: rows[k]["v1"]["overall"]),
                        ("v2", lambda k: rows[k]["v2"]["overall"])):
            line, b = band_line(f"{gname} · {nm}", [get(k) for k in ks])
            say(line); res["spread"][gname][nm] = b
    mv = Counter(round(rows[k]["v2"]["overall"] - rows[k]["v1"]["overall"], 1) for k in sel)
    say(f"  v2 - v1 per photo: {dict(sorted(mv.items()))}")
    res["spread"]["v2_minus_v1"] = {str(a): b for a, b in sorted(mv.items())}
    eight = sorted([k for k in sel if rows[k]["v2"]["overall"] >= 8], key=lambda k: -rows[k]["v2"]["overall"])
    say(f"  v2 at 8+ ({len(eight)}):")
    for k in eight:
        r = rows[k]["v2"]
        say(f"    {k:28s} {T.WHO_TEXT[rows[k]['who']]:30s} v1 {rows[k]['v1']['overall']} -> v2 {r['overall']} "
            f"(avg {r['average']}, bonus +{r['earned_bonus']}) | {P.card_row(r)}")
    res["eight_plus"] = [{"key": k, "v1": rows[k]["v1"]["overall"], "v2": rows[k]["v2"]["overall"],
                          "bonus": rows[k]["v2"]["earned_bonus"], "row": P.card_row(rows[k]["v2"])} for k in eight]
    say("  part distributions, v1 -> v2 (display values):")
    res["part_dist"] = {}
    for pk in P.PART_ORDER:
        dd = {}
        for e in ENGINES:
            vals = [rows[k][e]["parts"][pk]["display"] for k in sel if rows[k][e]["parts"][pk]["display"] is not None]
            dd[e] = dict(sorted(Counter(vals).items()))
        say(f"    {pk:12s} v1 {dd['v1']}\n    {'':12s} v2 {dd['v2']}")
        res["part_dist"][pk] = {e: {str(a): b for a, b in d.items()} for e, d in dd.items()}
    bon = [rows[k]["v2"]["earned_bonus"] for k in sel]
    say(f"  earned bonus (v2): fires on {sum(1 for b in bon if b > 0)}/{len(bon)} photos; values {dict(sorted(Counter(bon).items()))}")
    res["bonus_dist"] = {str(a): b for a, b in sorted(Counter(bon).items())}

    # ======================== (3) steadiness
    say("\n(3) 3-RUN STEADINESS (Everyday, the test profile)")
    res["steady"] = {}

    def steady_set(runsets, with_sl, label, lit=None, engines=ENGINES, tune=None):
        out = {}
        per = defaultdict(dict)
        for k, runs in runsets.items():
            runs = runs[:3]
            if lit is not None:
                if k not in lit or len(lit[k]) < 3:
                    continue
                runs = [with_lightness(j, lit[k][i]) for i, j in enumerate(runs)]
            per[k]["v4.1"] = [v4(j, "everyday") for j in runs]
            for e in engines:
                per[k][e] = [score(j, "everyday", T.second_look_for(k, U, L, i) if with_sl else None, e,
                                   tune if e == "v2" else None)["overall"] for i, j in enumerate(runs)]
        for nm in ["v4.1"] + list(engines):
            vals = [per[k][nm] for k in per if None not in per[k][nm] and len(per[k][nm]) == 3]
            med = sum(1 for v in vals if all(abs(x - st.median(v)) <= 0.5 for x in v))
            rng_ = sum(1 for v in vals if max(v) - min(v) <= 0.5)
            ex = sum(1 for v in vals if len(set(v)) == 1)
            sp = [max(v) - min(v) for v in vals]
            out[nm] = {"within_0.5_of_median": [med, len(vals)], "range_le_0.5": [rng_, len(vals)], "exact": [ex, len(vals)],
                       "mean_spread": round(st.mean(sp), 3), "worst": max(sp)}
        say(f"  {label}")
        for nm, o in out.items():
            say(f"    {nm:5s} within 0.5 of median {o['within_0.5_of_median'][0]}/{o['within_0.5_of_median'][1]} · "
                f"max-min <= 0.5 {o['range_le_0.5'][0]}/{o['range_le_0.5'][1]} · exact {o['exact'][0]}/{o['exact'][1]} · "
                f"mean spread {o['mean_spread']} · worst {o['worst']}")
        if "v2" in engines:
            nx = [f"{k} v1 {per[k]['v1']} v2 {per[k]['v2']}" for k in sorted(per)
                  if None not in per[k]["v2"] and len(set(per[k]["v2"])) > 1]
            say(f"    v2 not exact ({len(nx)}): " + "; ".join(nx))
            out["v2_not_exact"] = nx
        return out

    res["steady"]["b1_A"] = steady_set(B1, True, "batch 1 arm A (validation), second look run i paired")
    res["steady"]["zoom1_B"] = steady_set(Z, False, "zoom1 + zoom1-stock arm B (design set)")
    res["steady"]["b1_A_lightness"] = steady_set(B1, True, "batch 1 arm A + lightness from arm B1 run i (v2's lightness credits live)",
                                                 lit=B1L)
    # check-level: which v2 rewards fire on some but not all runs
    fires = defaultdict(lambda: [0, 0])
    for k, runs in B1.items():
        seen = defaultdict(int)
        for i, j in enumerate(runs[:3]):
            r = score(with_lightness(j, B1L[k][i]) if k in B1L else j, "everyday", T.second_look_for(k, U, L, i), "v2")
            if r["overall"] is None:
                continue
            cs = {x["check"] for pk in P.PART_ORDER for x in r["parts"][pk]["reasons"]}
            if r["earned_bonus"] > 0:
                cs.add("EARNED_bonus")
            for c in cs:
                seen[c] += 1
        for c, n in seen.items():
            fires[c][1] += 1
            fires[c][0] += n < 3
    say("  v2 check-level flips on batch 1 arm A (+ lightness): photos where a check fires on some but not all 3 runs / "
        "photos where it fires at all")
    say("    " + "; ".join(f"{c} {a}/{b}" for c, (a, b) in sorted(fires.items(), key=lambda x: -x[1][1])))
    res["check_flips_v2"] = {c: v for c, v in fires.items()}
    bvals = defaultdict(list)
    for k, runs in B1.items():
        for i, j in enumerate(runs[:3]):
            r = score(j, "everyday", T.second_look_for(k, U, L, i), "v2")
            if r["overall"] is not None:
                bvals[k].append(r["earned_bonus"])
    bflip = {k: v for k, v in bvals.items() if len(set(v)) > 1}
    say(f"  earned bonus across 3 runs (b1 A, no lightness): differs on {len(bflip)} photos: " +
        "; ".join(f"{k} {v}" for k, v in sorted(bflip.items())))

    # ======================== (4) judge pilot
    say("\n(4) AGAINST THE JUDGE PILOT (panel = median of the 5 judges' weighted totals)")
    res["judge"] = {}
    for side, label in (("all", "all 59"), ("tune", "TUNING half"), ("held", "HELD-OUT half")):
        xs = [x for x in jp if side == "all" or half[x["id"]] == side]
        res["judge"][side] = {}
        for nm in ("v4.1", "v1", "v2"):
            prs = [((rows[x["key"]]["v4"] if nm == "v4.1" else rows[x["key"]][nm]["overall"]), x["panel"]) for x in xs]
            prs = [p for p in prs if p[0] is not None]
            o = cmp_stats(prs)
            res["judge"][side][nm] = o
            say(f"  {label:14s} {nm:5s} {fmt_cmp(o)}")
        for g in sorted({x["group"] for x in xs}):
            for nm in ("v1", "v2"):
                prs = [(rows[x["key"]][nm]["overall"], x["panel"]) for x in xs if x["group"] == g]
                o = cmp_stats(prs)
                res["judge"][side][f"{nm} · {g}"] = o
                say(f"  {'':14s} {nm:5s} {g:28s} {fmt_cmp(o)}")
    say("  per photo (half · panel · v4.1 · v1 · v2 · v2 parts · bonus):")
    res["judge"]["rows"] = []
    for x in sorted(jp, key=lambda x: x["id"]):
        r = rows[x["key"]]
        res["judge"]["rows"].append({"id": x["id"], "key": x["key"], "half": half[x["id"]], "panel": x["panel"],
                                     "v4.1": r["v4"], "v1": r["v1"]["overall"], "v2": r["v2"]["overall"],
                                     "v2_row": P.card_row(r["v2"]), "bonus": r["v2"]["earned_bonus"]})
        mark = " <-" if r["v2"]["overall"] != r["v1"]["overall"] else ""
        say(f"    {x['id']} {half[x['id']]:4s} {x['key']:26s} panel {x['panel']:<4} v4.1 {r['v4']!s:<4} v1 "
            f"{r['v1']['overall']!s:<4} v2 {r['v2']['overall']!s:<4} {P.card_row(r['v2'])} · +{r['v2']['earned_bonus']}{mark}")
    say("  the panel's top photos (8+, and P043/P044):")
    for x in sorted(top, key=lambda x: x["id"]):
        r = rows[x["key"]]
        say(f"    {x['id']} ({half[x['id']]}) {x['key']}: panel {x['panel']} · v1 {r['v1']['overall']} · v2 "
            f"{r['v2']['overall']} · {P.card_row(r['v2'])}")
    # the panel's top photos with the lightness word (where batch 1 read it)
    say("  the same, with batch 1 arm B1 run 0's lightness copied on (v2's color credits that need it):")
    res["judge"]["top_lightness"] = {}
    for x in sorted(top, key=lambda x: x["id"]):
        if x["key"] in B1L:
            rd = with_lightness(prim[x["key"]]["reading"], B1L[x["key"]][0])
            r = score(rd, prim[x["key"]]["occ"], T.second_look_for(x["key"], U, L), "v2")
            res["judge"]["top_lightness"][x["id"]] = r["overall"]
            say(f"    {x['id']} {x['key']}: v2 with lightness {r['overall']} · {P.card_row(r)} · "
                + "; ".join(c["check"] for c in r["parts"]["color"]["reasons"]))
        else:
            say(f"    {x['id']} {x['key']}: no lightness reading (not in batch 1)")

    # lightness what-if on the 50 batch-1 photos (primary reading + B1 run 0 lightness)
    say("\n  lightness what-if (v2, batch-1 photos, primary reading + arm B1 run 0's lightness):")
    lw = []
    for k in sorted(B1L):
        if k not in rows:
            continue
        rd = with_lightness(prim[k]["reading"], B1L[k][0])
        r = score(rd, prim[k]["occ"], T.second_look_for(k, U, L), "v2")
        if r["overall"] is None:
            continue
        cc = [c["check"] for c in r["parts"]["color"]["reasons"] if c["check"].startswith(("CP3", "CP4", "CP6"))]
        lw.append((k, rows[k]["v2"]["overall"], r["overall"], cc))
    ch = [x for x in lw if x[1] != x[2]]
    say(f"    {sum(1 for x in lw if x[3])}/{len(lw)} earn a lightness credit; {len(ch)} change score: " +
        "; ".join(f"{k} {a}->{b} ({', '.join(c)})" for k, a, b, c in ch))
    res["lightness_whatif"] = [{"key": k, "v2": a, "v2_lightness": b, "credits": c} for k, a, b, c in lw]
    lj = [(b, next(x["panel"] for x in jp if x["key"] == k)) for k, a, b, c in lw if any(x["key"] == k for x in jp)]
    lj0 = [(a, next(x["panel"] for x in jp if x["key"] == k)) for k, a, b, c in lw if any(x["key"] == k for x in jp)]
    say(f"    on the {len(lj)} of them in the judge pilot: v2 {fmt_cmp(cmp_stats(lj0))}  ·  v2 + lightness {fmt_cmp(cmp_stats(lj))}")

    # ======================== (5) his and his friends' checks
    say("\n(5) EVERY CHECK OF THE FOUNDER, HIS FRIENDS AND THE TWO UNKNOWNS (own occasion): v4.1 -> v1 -> v2")
    res["checks"] = []
    mine = sorted([k for k in rows if rows[k]["who"] in ("founder", "friend", "unknown")],
                  key=lambda k: (rows[k]["who"] != "friend", rows[k]["who"], k))
    for k in mine:
        r = rows[k]
        line = {"key": k, "who": T.WHO_TEXT[r["who"]], "occ": r["occ"], "v4.1": r["v4"], "v1": r["v1"]["overall"],
                "v2": r["v2"]["overall"], "v1_row": P.card_row(r["v1"]), "v2_row": P.card_row(r["v2"]),
                "v2_avg": r["v2"]["average"], "v2_bonus": r["v2"]["earned_bonus"], "v2_lowest": r["v2"]["lowest"]["line"],
                "garments": [g.get("subcategory") for g in prim[k]["reading"].get("garments", [])]}
        res["checks"].append(line)
        say(f"  {k} [{line['who']}; {r['occ']}] v4.1 {r['v4']} -> v1 {line['v1']} -> v2 {line['v2']}  "
            f"(v2 avg {line['v2_avg']}, bonus +{line['v2_bonus']})")
        say(f"      v1 {line['v1_row']}\n      v2 {line['v2_row']} | lowest: {line['v2_lowest']}")
        say(f"      {', '.join(x for x in line['garments'] if x)}")
        t = T.TRUTH_SHOE.get(k[6:]) if k.startswith("phone-") else None
        rd = prim[k]["reading"]
        fi = next((i for i, g in enumerate(rd.get("garments", [])) if g.get("category") == "footwear"), None)
        if t and fi is not None and rd["garments"][fi].get("subcategory") != t:
            alt = R._with(rd, fi, "subcategory", t)
            a1 = score(alt, r["occ"], T.second_look_for(k, U, L), "v1")
            a2 = score(alt, r["occ"], T.second_look_for(k, U, L), "v2")
            line["true_shoe"] = {"type": t, "v4.1": v4(alt, r["occ"]), "v1": a1["overall"], "v2": a2["overall"],
                                 "v2_row": P.card_row(a2)}
            say(f"      with his true shoes ({t}): v4.1 {line['true_shoe']['v4.1']} · v1 {a1['overall']} · v2 "
                f"{a2['overall']} · {P.card_row(a2)}")

    # ======================== (6) fixes
    say("\n(6) CAN A FIX LIFT A FIT? The engine's own edits on every reading where the fix applies (v1 vs v2)")
    res["fixes"] = {}
    for name, fn in FIXES:
        out = []
        for k in sorted(sel):
            rd = edit(prim[k]["reading"], fn)
            if rd is None:
                continue
            sl = T.second_look_for(k, U, L)
            a = {e: score(rd, prim[k]["occ"], sl, e) for e in ENGINES}
            if a["v1"]["overall"] is None:
                continue
            out.append({"key": k, "who": rows[k]["who"], "v1": [rows[k]["v1"]["overall"], a["v1"]["overall"]],
                        "v2": [rows[k]["v2"]["overall"], a["v2"]["overall"]], "v2_after_row": P.card_row(a["v2"]),
                        "v2_raw": [rows[k]["v2"]["raw_score"], a["v2"]["raw_score"]]})
        res["fixes"][name] = out
        n = len(out)
        up = {e: sum(1 for x in out if x[e][1] > x[e][0]) for e in ENGINES}
        dn = {e: sum(1 for x in out if x[e][1] < x[e][0]) for e in ENGINES}
        gain = {e: round(st.mean(x[e][1] - x[e][0] for x in out), 2) if out else 0 for e in ENGINES}
        rawg = round(st.mean(x["v2_raw"][1] - x["v2_raw"][0] for x in out), 2) if out else 0
        say(f"  {name}: applies to {n} photos · shown score goes up v1 {up['v1']}/{n} · v2 {up['v2']}/{n} · down v1 "
            f"{dn['v1']} · v2 {dn['v2']} · mean lift v1 {gain['v1']:+} · v2 {gain['v2']:+} (v2 unrounded {rawg:+})")
        for x in out:
            if x["who"] in ("founder", "friend", "unknown"):
                say(f"      {x['key']:16s} {T.WHO_TEXT[x['who']]:30s} v1 {x['v1'][0]} -> {x['v1'][1]} · v2 {x['v2'][0]} -> "
                    f"{x['v2'][1]} · {x['v2_after_row']}")

    # ======================== (7) the stock before/after pairs
    say("\n(7) STOCK BEFORE/AFTER PAIRS (p01-p06; inputs/fitcheck-photos/fixes.csv), each at its own occasion")
    import csv
    fx = {r["outfit_id"]: r for r in csv.DictReader(open(K / "inputs/fitcheck-photos/fixes.csv"))}
    pid = {x["key"]: (x["id"], x["panel"]) for x in jp}
    res["pairs"] = []
    for p in sorted(fx):
        kb = next((k for k in rows if k.startswith(f"stock-{p}-before")), None)
        ka = next((k for k in rows if k.startswith(f"stock-{p}-after")), None)
        if not kb or not ka:
            continue
        gb = {(g.get("category"), i): g for i, g in enumerate(R.scored_garments(prim[kb]["reading"]))}
        diffs = []
        ga = R.scored_garments(prim[ka]["reading"])
        bb = R.scored_garments(prim[kb]["reading"])
        for cat in ("top", "outerwear", "bottom", "footwear"):
            b_ = [g for g in bb if g.get("category") == cat]
            a_ = [g for g in ga if g.get("category") == cat]
            for i in range(max(len(a_), len(b_))):
                x, y = (b_[i] if i < len(b_) else {}), (a_[i] if i < len(a_) else {})
                d = [f"{f} {x.get(f)}->{y.get(f)}" for f in ("subcategory", "color_family", "tucked", "length", "leg_shape",
                                                              "hem", "sleeve_end", "condition", "volume") if x.get(f) != y.get(f)]
                if d:
                    diffs.append(f"{cat}: " + ", ".join(d))
        line = {"pair": p, "fix": fx[p]["fix_type"], "notes": fx[p]["notes"], "reading_changes": diffs,
                "panel": [pid.get(kb, (None, None))[1], pid.get(ka, (None, None))[1]],
                "v4.1": [rows[kb]["v4"], rows[ka]["v4"]],
                "v1": [rows[kb]["v1"]["overall"], rows[ka]["v1"]["overall"]],
                "v2": [rows[kb]["v2"]["overall"], rows[ka]["v2"]["overall"]],
                "v2_raw": [rows[kb]["v2"]["raw_score"], rows[ka]["v2"]["raw_score"]],
                "v2_rows": [P.card_row(rows[kb]["v2"]), P.card_row(rows[ka]["v2"])]}
        res["pairs"].append(line)
        say(f"  {p} {line['fix']} ({line['notes']})")
        say(f"      panel {line['panel'][0]} -> {line['panel'][1]} · v4.1 {line['v4.1'][0]} -> {line['v4.1'][1]} · v1 "
            f"{line['v1'][0]} -> {line['v1'][1]} · v2 {line['v2'][0]} -> {line['v2'][1]} (raw {line['v2_raw'][0]} -> {line['v2_raw'][1]})")
        say(f"      v2 before {line['v2_rows'][0]}\n      v2 after  {line['v2_rows'][1]}")
        say(f"      what the readings changed: " + ("; ".join(diffs) if diffs else "nothing"))

    # ======================== (8) ablations: each v2 change alone, and v2 without it
    say("\n(8) ABLATIONS (one reading per photo; b1 A steadiness; judge within 0.5 on the tuning / held-out halves)")
    KNOBS = {
        "proportions steps (pr1 1.5, pr2 1.5, pr3 1.0, cap 2.5)": {"pr1": 1.5, "pr2": 1.5, "pr3": 1.0, "prop_cap": 2.5},
        "cohesion steps (h2 1.0, h2_suit 1.0, h4 0.75)": {"h2": 1.0, "h2_suit": 1.0, "h4": 0.75},
        "mirror guard (untucked short top in a mirror +0.5)": {"pr1_mirror_short": 0.5},
        "suit shoe": {"suit_shoe": True},
        "earned bonus": {"earned": P.TUNE["v2"]["earned"]},
    }
    V1T, V2T = P.TUNE["v1"], P.TUNE["v2"]
    res["ablations"] = {}

    def summarize(tune_v2):
        vals = []
        for k in sel:
            r = score(prim[k]["reading"], prim[k]["occ"], T.second_look_for(k, U, L), "v2", tune_v2)
            vals.append(r["overall"])
        b = bands(vals)
        hs = []
        for k, runs in B1.items():
            v = [score(j, "everyday", T.second_look_for(k, U, L, i), "v2", tune_v2)["overall"] for i, j in enumerate(runs[:3])]
            if None not in v:
                hs.append(all(abs(x - st.median(v)) <= 0.5 for x in v))
        jj = {}
        for side in ("tune", "held"):
            prs = [(score(prim[x["key"]]["reading"], prim[x["key"]]["occ"], T.second_look_for(x["key"], U, L), "v2",
                          tune_v2)["overall"], x["panel"]) for x in jp if half[x["id"]] == side]
            jj[side] = cmp_stats(prs)
        return {"median": b["median"], "8+": b["8+"], "9+": b["9+"], "pct8": b["pct8"], "b1_steady": [sum(hs), len(hs)],
                "tune": jj["tune"], "held": jj["held"]}

    def abl_line(name, s):
        return (f"  {name:58s} median {s['median']} · 8+ {s['8+']} ({s['pct8']}%) · 9+ {s['9+']} · b1 steady "
                f"{s['b1_steady'][0]}/{s['b1_steady'][1]} · tune: diff {s['tune']['mean_diff']:+.2f} within0.5 "
                f"{s['tune']['within_0.5']}/{s['tune']['n']} · held: diff {s['held']['mean_diff']:+.2f} within0.5 "
                f"{s['held']['within_0.5']}/{s['held']['n']}")

    v1_as_v2 = dict(V1T)
    s = summarize(v1_as_v2); res["ablations"]["v1"] = s; say(abl_line("v1 (all off)", s))
    for name, kn in KNOBS.items():
        t1 = dict(V1T); t1.update(kn)
        s = summarize(t1); res["ablations"]["v1 + " + name] = s; say(abl_line("v1 + " + name, s))
    for name, kn in KNOBS.items():
        t2 = dict(V2T); t2.update({k_: V1T[k_] for k_ in kn})
        s = summarize(t2); res["ablations"]["v2 - " + name] = s; say(abl_line("v2 - " + name, s))
    s = summarize(dict(V2T)); res["ablations"]["v2"] = s; say(abl_line("v2 (all on)", s))
    # the bonus's own knobs, on the tuning half only (how the final values were picked)
    say("  the earned bonus's rate and cap (rest of v2 on):")
    res["bonus_grid"] = {}
    for over in (7.5, 8.0):
        for rate in (0.25, 0.5, 0.75):
            for cap in (0.25, 0.5):
                t2 = dict(V2T); t2["earned"] = dict(V2T["earned"], over=over, rate=rate, cap=cap)
                s = summarize(t2); res["bonus_grid"][f"over {over} rate {rate} cap {cap}"] = s
                say(abl_line(f"over {over} rate {rate} cap {cap}", s))

    # reweighting what-ifs (not adopted): the same v2 rewards and bonus under other part weights
    say("  reweighting what-ifs on top of v2 (not adopted; see the report):")
    res["reweight"] = {}
    base_w = dict(P.WEIGHTS)
    for name, w in (("Fit 25->15, Shoes and Style 15->20", {"proportions": .30, "fit": .15, "color": .15, "shoes": .20, "cohesion": .20}),
                    ("all five at 20", {k_: .20 for k_ in P.PART_ORDER}),
                    ("Proportions 30->35, Fit 25->20", {"proportions": .35, "fit": .20, "color": .15, "shoes": .15, "cohesion": .15})):
        P.WEIGHTS.clear(); P.WEIGHTS.update(w)
        try:
            s_ = summarize(dict(V2T))
        finally:
            P.WEIGHTS.clear(); P.WEIGHTS.update(base_w)
        res["reweight"][name] = s_
        say(abl_line(name, s_))

    (OUT / "analysis.txt").write_text("\n".join(LINES) + "\n")
    json.dump(res, open(OUT / "analysis.json", "w"), indent=1, default=str)


if __name__ == "__main__":
    main()

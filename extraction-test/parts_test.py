#!/usr/bin/env python3
"""Paper test for the parts-engine prototype (rubrics/parts_proto.py) against rubric.py v4.1. No API calls, no money.

  /usr/bin/python3 parts_test.py      -> results/parts1/analysis.txt + analysis.json (the report,
                                         ../rubric/research/parts/prototype-results.md, is written from these)

Readings used (all saved; nothing is re-run):
  - the 78-reading corpus (CORPUS: id, src, occ, reading): 12 phone checks, 27 zoom1 (close-up) readings of his
    Oct 7/8 photos and 12 web mirror selfies, 39 stock photos
  - the newest phone pull, screenshots/phone/20261010-185554/ (kitted.db): every scored check's own reading (the
    tap-answer reading when he answered one), deduped by image hash, at that check's own occasion
  - batch 1's control arm (results/b1/raw.json, arm A: the live prompt with close-ups, 3 runs x 50 photos) and the
    second look for the same photos and runs (results/look1/raw.json, arms U and L)
  - zoom1 / zoom1-stock arm B (the app's config, 3 runs x 66 photos): the DESIGN set for check steadiness, so the
    score-steadiness test on batch 1's runs (made a day later, #188 fix) isn't the set the checks were chosen on
  - the judge pilot (inputs/judge-pilot/judge-*.csv + manifest.json; panel = median of the 5 judges' weighted totals)

Rule 7 (CLAUDE.md): who is in each photo comes from b1_labels.csv's person column (written blind before batch 1).
The founder: profile pending. His friends: profile unknown. 703a8b and ebe23f: unknown, ask the founder. Web and stock:
profile unknown. Every reading is scored with ONE stated test profile: picks Minimal + Smart casual (0.5 each),
boldness "a little", no age. Neither engine lets picks or age move a number, so no split by age band or picked look
is possible or meaningful yet.
"""
import csv
import json
import math
import os
import re
import sqlite3
import statistics as st
import sys
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
K = HERE.parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rubrics"))
import rubric as R  # noqa: E402  v4.1, the live rubric
import parts_proto as P  # noqa: E402

CORPUS = Path("results/parts1/corpus.json")
PULL = K / "screenshots/phone/20261010-185554/SQLite/kitted.db"
OUT = HERE / "results" / "parts1"
PROFILE = R.parse_styles("minimalist:0.5,smart_casual:0.5")      # the stated test profile (b1's)
BOLD = "a_little"

LINES = []


def say(s=""):
    LINES.append(s)
    print(s)


def pct(a, b):
    return f"{a}/{b} ({round(100 * a / b) if b else 0}%)"


def pearson(xs, ys):
    if len(xs) < 3:
        return float("nan")
    mx, my = st.mean(xs), st.mean(ys)
    sx = math.sqrt(sum((x - mx) ** 2 for x in xs))
    sy = math.sqrt(sum((y - my) ** 2 for y in ys))
    return sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / (sx * sy) if sx and sy else float("nan")


# ---------------------------------------------------------------------------------------------------- loading
def key_from_corpus(cid):
    src, rest = cid.split(":", 1)
    if src == "stock":
        return rest
    if src == "phone":
        return "phone-" + rest[:6]
    if rest.startswith("oct8-"):
        return "phone-" + rest[5:11]
    return rest                                      # mirror-mXX, oct7-phN


def key_from_source(path):
    m = re.search(r"fitcheck-photos/(\w+)/(\w+)\.jpg", path)
    if m:
        return f"stock-{m[1]}-{m[2]}"
    m = re.search(r"mirror-fit-check-1/(m\d+)", path)
    if m:
        return "mirror-" + m[1]
    m = re.search(r"phone-oct7/(ph\d)", path)
    if m:
        return "oct7-" + m[1]
    m = re.search(r"photos/([0-9a-f]{6})", path)
    if m:
        return "phone-" + m[1]
    return None


def load_pull():
    """{photo key: {reading, occ, app_score, check}} from the newest pull, the reading each scored check used."""
    c = sqlite3.connect(f"file:{PULL}?mode=ro&immutable=1", uri=True)
    out = {}
    q = ("select f.image_hash, f.occasion, f.score, f.id, r.reading_json, f.created_at from fit_checks f "
         "join readings r on r.id = f.reading_id where f.status = 'scored' order by f.created_at")
    for h, occ, score, fid, js, t in c.execute(q):
        k = "phone-" + h[:6]
        if k not in out:                              # dedupe by image hash (8ad378 and 703a8b were checked twice)
            out[k] = {"reading": json.loads(js), "occ": occ, "app_score": score, "check": fid, "t": t}
    return out


def load_runs(path, arm):
    by = defaultdict(list)
    for x in json.load(open(path)):
        if x["arm"] == arm:
            by[x["photo"]].append(x)
    return {p: [x["json"] for x in sorted(v, key=lambda x: x["run"])] for p, v in by.items()}


def zoom_key(p):
    return "phone-" + p[5:11] if p.startswith("oct8-") else p


def person_map():
    out = {}
    for r in csv.DictReader(open(HERE / "b1_labels.csv")):
        out[r["photo"]] = r["person"]
    return out


PERSON = person_map()
TRUTH_SHOE = {r["photo"]: r["truth_type"] for r in csv.DictReader(open(K / "inputs/phone-oct8/truth.csv"))
              if r["slot"] == "footwear" and r["truth_type"]}


def who(k):
    per = PERSON.get(k)
    if per is None:
        if k.startswith("stock"):
            return "stock"
        if k.startswith("mirror"):
            return "web"
        return "founder?"                            # not in the labelled set (none expected)
    if per == "founder":
        return "founder"
    if per.startswith("friend"):
        return "friend"
    if per.startswith("unknown"):
        return "unknown"
    return "web" if k.startswith("mirror") else "stock"


WHO_TEXT = {"founder": "the founder (profile pending)", "friend": "a friend (profile unknown)",
            "unknown": "unknown, ask the founder", "web": "web photo (profile unknown)",
            "stock": "stock photo (profile unknown)"}


def second_look_for(k, U, L, run=None):
    """The look1 answers for photo k: run i (for paired steadiness) or the 2-of-3 majority answer."""
    if k not in U or k not in L:
        return None
    if run is not None:
        u, l_ = U[k][run], L[k][run]
        return {"under_present": u.get("under_present"), "under_shows": u.get("under_shows"),
                "covers_shoe": l_.get("covers_shoe")}
    peeks = [P._second_look({"under_present": u.get("under_present"), "under_shows": u.get("under_shows")})["peek"]
             for u in U[k]]
    rests = [P._second_look({"covers_shoe": l_.get("covers_shoe")})["rests_on_shoe"] for l_ in L[k]]
    maj = lambda v: Counter(v).most_common(1)[0][0]  # noqa: E731
    return {"peek": maj(peeks), "rests_on_shoe": maj(rests)}


def v4(reading, occ):
    return R.score(reading, occ, PROFILE, BOLD)["overall"]


def parts(reading, occ, sl=None):
    return P.score_parts(reading, occ, PROFILE, sl, BOLD, engine="v1")      # parts-proto-1 (v2: parts2_test.py)


def bands(vals):
    n = len(vals)
    c = lambda f: sum(1 for v in vals if f(v))  # noqa: E731
    return {"n": n, "median": st.median(vals) if vals else None, "mean": round(st.mean(vals), 2) if vals else None,
            "le5.5": c(lambda v: v <= 5.5), "6-6.5": c(lambda v: 6 <= v <= 6.5), "7-7.5": c(lambda v: 7 <= v <= 7.5),
            "8+": c(lambda v: v >= 8), "9+": c(lambda v: v >= 9)}


def band_line(name, vals):
    b = bands(vals)
    n = b["n"] or 1
    f = lambda k: f"{b[k]} ({round(100 * b[k] / n)}%)"  # noqa: E731
    return (f"  {name:28s} n={b['n']:3d} median {b['median']}  mean {b['mean']}  <=5.5 {f('le5.5')}  6-6.5 {f('6-6.5')}"
            f"  7-7.5 {f('7-7.5')}  8+ {f('8+')}  9+ {f('9+')}"), b


# ---------------------------------------------------------------------------------------------------- main
def main():
    OUT.mkdir(parents=True, exist_ok=True)
    res = {"profile": "test profile: picks Minimal + Smart casual (0.5 each), boldness a little, no age",
           "engine": P.VERSIONS["v1"]}
    corpus = json.load(open(CORPUS))
    pull = load_pull()
    B1 = load_runs(HERE / "results/b1/raw.json", "A")
    U = load_runs(HERE / "results/look1/raw.json", "U")
    L = load_runs(HERE / "results/look1/raw.json", "L")
    Z = load_runs(HERE / "results/zoom1/raw.json", "B")
    Z.update(load_runs(HERE / "results/zoom1-stock/raw.json", "B"))
    Z = {zoom_key(k): v for k, v in Z.items()}

    # one primary reading per distinct photo: the app's own (newest pull) > the corpus > batch 1 run 0
    prim = {}
    for k, v in pull.items():
        prim[k] = {"reading": v["reading"], "occ": v["occ"], "src": "pull 20261010", "app": v["app_score"]}
    for x in corpus:
        k = key_from_corpus(x["id"])
        if k not in prim:
            prim[k] = {"reading": x["reading"], "occ": x["occ"], "src": "corpus " + x["src"], "app": x.get("app_score")}
    for k, runs in B1.items():
        if k not in prim:
            prim[k] = {"reading": runs[0], "occ": "everyday", "src": "b1 arm A run 0", "app": None}
    say(f"PARTS PAPER TEST · {P.VERSIONS['v1']} vs rubric.py v4.1 · {res['profile']}")
    say(f"Distinct photos with a reading: {len(prim)} "
        f"({Counter(v['src'].split()[0] + (' ' + v['src'].split()[1] if v['src'].startswith('corpus') else '') for v in prim.values())})")
    say(f"Corpus readings: {len(corpus)}; newest pull: {len(pull)} distinct checks; batch 1 arm A: "
        f"{len(B1)} photos x 3; look1: {len(U)} photos x 3 (U, L); zoom1 arm B: {len(Z)} photos x 3")

    # ---------------- per-photo scores
    rows = {}
    for k, v in prim.items():
        sl = second_look_for(k, U, L)
        a = v4(v["reading"], v["occ"])
        p0 = parts(v["reading"], v["occ"])
        p1 = parts(v["reading"], v["occ"], sl) if sl else p0
        rows[k] = {"who": who(k), "occ": v["occ"], "src": v["src"], "app": v["app"], "v4": a, "parts": p0["overall"],
                   "parts_sl": p1["overall"], "has_sl": bool(sl), "res": p1, "res0": p0}

    # =========================== (a) SPREAD
    say("\n(a) SCORE SPREAD, one reading per distinct photo (each reading's own occasion)")
    res["spread"] = {}
    groups = [("all photos", lambda r: True), ("founder", lambda r: r["who"] == "founder"),
              ("friends", lambda r: r["who"] == "friend"), ("unknown (ask)", lambda r: r["who"] == "unknown"),
              ("web mirror", lambda r: r["who"] == "web"), ("stock", lambda r: r["who"] == "stock"),
              ("his + friends + unknown", lambda r: r["who"] in ("founder", "friend", "unknown"))]
    for gname, f in groups:
        sel = [r for r in rows.values() if f(r) and r["v4"] is not None and r["parts_sl"] is not None]
        if not sel:
            continue
        l1, b1 = band_line(f"{gname} · v4.1", [r["v4"] for r in sel])
        l2, b2 = band_line(f"{gname} · parts", [r["parts_sl"] for r in sel])
        say(l1); say(l2)
        res["spread"][gname] = {"v4.1": b1, "parts": b2}
    sel = [r for r in rows.values() if r["v4"] is not None and r["parts_sl"] is not None]
    moves = Counter(round(r["parts_sl"] - r["v4"], 1) for r in sel)
    say(f"  parts - v4.1 per photo: {dict(sorted(moves.items()))}  mean {st.mean(r['parts_sl'] - r['v4'] for r in sel):+.2f}")
    res["spread"]["moves"] = {str(k): v for k, v in sorted(moves.items())}
    sl_moves = Counter(round(r["parts_sl"] - r["parts"], 1) for r in sel if r["has_sl"])
    say(f"  the second look's effect on the parts score (photos that have one, n={sum(sl_moves.values())}): {dict(sorted(sl_moves.items()))}")
    # batch 1 arm A, median of 3 runs at everyday (the close-up config, a second view of the spread)
    med_v4, med_p = [], []
    for k, runs in B1.items():
        a = [v4(j, "everyday") for j in runs]
        b = [parts(j, "everyday", second_look_for(k, U, L, i))["overall"] for i, j in enumerate(runs)]
        a, b = [x for x in a if x is not None], [x for x in b if x is not None]
        if a and b:
            med_v4.append(st.median(a)); med_p.append(st.median(b))
    l1, b1 = band_line("batch 1 arm A medians · v4.1", med_v4)
    l2, b2 = band_line("batch 1 arm A medians · parts", med_p)
    say(l1); say(l2)
    res["spread"]["b1_medians"] = {"v4.1": b1, "parts": b2}
    # part distributions
    say("  part distributions (one reading per photo, with the second look where it exists):")
    res["part_dist"] = {}
    for pk in P.PART_ORDER:
        vals = [r["res"]["parts"][pk]["display"] for r in sel if r["res"]["parts"][pk]["display"] is not None]
        na = sum(1 for r in sel if r["res"]["parts"][pk]["display"] is None)
        d = Counter(vals)
        at7 = sum(1 for r in sel if r["res"]["parts"][pk]["display"] == 7.0)
        say(f"    {pk:12s} NA {na:2d} · at 7: {at7}/{len(vals)} · median {st.median(vals)} · {dict(sorted(d.items()))}")
        res["part_dist"][pk] = {"na": na, "at7": at7, "n": len(vals), "dist": {str(k): v for k, v in sorted(d.items())}}

    # =========================== (b) STEADINESS
    say("\n(b) 3-RUN STEADINESS (Everyday, the test profile)")

    def steady(vals, mode):
        vals = [x for x in vals if x is not None]
        if len(vals) < 3:
            return None
        if mode == "exact":
            return len(set(vals)) == 1
        if mode == "median":
            m = st.median(vals)
            return all(abs(x - m) <= 0.5 for x in vals)
        return max(vals) - min(vals) <= 0.5                 # "range": all 3 runs within 0.5 of each other

    def steadiness(runsets, label, with_sl):
        out = {}
        per = {}
        for k, runs in runsets.items():
            a = [v4(j, "everyday") for j in runs[:3]]
            b = [parts(j, "everyday", second_look_for(k, U, L, i) if with_sl else None)["overall"] for i, j in enumerate(runs[:3])]
            per[k] = (a, b)
        for mode in ("median", "range", "exact"):
            ha = [steady(a, mode) for a, _ in per.values()]; ha = [x for x in ha if x is not None]
            hb = [steady(b, mode) for _, b in per.values()]; hb = [x for x in hb if x is not None]
            out[mode] = {"v4.1": [sum(ha), len(ha)], "parts": [sum(hb), len(hb)]}
        spread_a = [max(a) - min(a) for a, _ in per.values() if None not in a]
        spread_b = [max(b) - min(b) for _, b in per.values() if None not in b]
        out["mean_spread"] = {"v4.1": round(st.mean(spread_a), 3), "parts": round(st.mean(spread_b), 3)}
        out["worst_spread"] = {"v4.1": max(spread_a), "parts": max(spread_b)}
        say(f"  {label}")
        for mode, txt in (("median", "all 3 within 0.5 of the median (b1's measure)"), ("range", "max - min <= 0.5"),
                          ("exact", "exactly the same")):
            say(f"    {txt:46s} v4.1 {pct(*out[mode]['v4.1']):>14s}   parts {pct(*out[mode]['parts']):>14s}")
        say(f"    mean spread v4.1 {out['mean_spread']['v4.1']} · parts {out['mean_spread']['parts']}; worst v4.1 "
            f"{out['worst_spread']['v4.1']} · parts {out['worst_spread']['parts']}")
        uns = [f"{k} v4 {a} parts {b}" for k, (a, b) in sorted(per.items()) if steady(b, "exact") is False]
        say(f"    parts not exact ({len(uns)}): " + "; ".join(uns))
        uns4 = [f"{k} {a}" for k, (a, b) in sorted(per.items()) if steady(a, "exact") is False]
        say(f"    v4.1 not exact ({len(uns4)}): " + "; ".join(uns4))
        out["per_photo"] = {k: {"v4.1": a, "parts": b} for k, (a, b) in per.items()}
        return out

    res["steady"] = {"b1_A_with_second_look": steadiness(B1, "batch 1 arm A (validation), with look1 run i paired to run i", True),
                     "b1_A_no_second_look": steadiness(B1, "batch 1 arm A, without the second look", False),
                     "zoom1_B": steadiness(Z, "zoom1 + zoom1-stock arm B (design set), no second look", False)}
    # per-part steadiness on batch 1
    say("  per-part steadiness on batch 1 arm A (with the second look): the part's display value the same on all 3 runs")
    res["part_steady"] = {}
    for pk in P.PART_ORDER:
        same = n = 0
        flips = []
        for k, runs in B1.items():
            v = [parts(j, "everyday", second_look_for(k, U, L, i))["parts"].get(pk, {}).get("display") for i, j in enumerate(runs)]
            if all(x is None for x in v):
                continue
            n += 1
            if len(set(v)) == 1:
                same += 1
            else:
                flips.append(f"{k} {v}")
        say(f"    {pk:12s} {pct(same, n)}   flips: " + "; ".join(flips[:12]) + (" …" if len(flips) > 12 else ""))
        res["part_steady"][pk] = {"same": same, "n": n, "flips": flips}
    # check-level steadiness on the design set: does each point-moving check fire on all 3 runs or none?
    say("  check-level steadiness on zoom1 arm B (design set) and batch 1 arm A: photos where a check fires on some")
    say("  but not all 3 runs, out of photos where it fires at least once")
    res["check_steady"] = {}
    for name, sets, with_sl in (("zoom1 B", Z, False), ("b1 A", B1, True)):
        fires = defaultdict(lambda: [0, 0])
        for k, runs in sets.items():
            seen = defaultdict(int)
            for i, j in enumerate(runs[:3]):
                r = parts(j, "everyday", second_look_for(k, U, L, i) if with_sl else None)
                if r["overall"] is None:
                    continue
                checks = {x["check"] for pk in P.PART_ORDER for x in r["parts"][pk]["reasons"]}
                checks |= {"COND:" + f for f in r["condition"]["faults"]}
                checks |= {"OCC:" + r["occasion"]["status"]} if r["occasion"]["status"] != "right for it" else set()
                for c in checks:
                    seen[c] += 1
            for c, nfire in seen.items():
                fires[c][1] += 1
                if nfire < 3:
                    fires[c][0] += 1
        say(f"    {name}: " + "; ".join(f"{c} {a}/{b}" for c, (a, b) in sorted(fires.items(), key=lambda x: -x[1][1])))
        res["check_steady"][name] = {c: v for c, v in fires.items()}

    # =========================== (c) JUDGE PILOT
    say("\n(c) AGAINST THE JUDGE PILOT (panel = median of 5 judges' weighted totals; parts = median of judges)")
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
        pid = m["id"]
        tv = [t for t in (total(d[pid]) for d in judges.values() if pid in d) if t is not None]
        if not tv:
            continue
        partm = {}
        for kk in W:
            vals = [num(d[pid].get(kk)) for d in judges.values() if pid in d]
            vals = [v for v in vals if v is not None]
            partm[kk] = st.median(vals) if vals else None
        k = key_from_source(m["source"])
        jp.append({"id": pid, "key": k, "group": m["group"], "panel": st.median(tv), "parts": partm})
    say(f"  panel photos: {len(jp)}; with a reading here: {sum(1 for x in jp if x['key'] in rows)}")
    rel = {"proportions": "proportion", "fit": "fit", "color": "color", "shoes": "shoes", "cohesion": "cohesion"}
    res["judge"] = {}

    def compare(sel, label):
        a = [(rows[x["key"]]["v4"], x["panel"]) for x in sel if rows[x["key"]]["v4"] is not None]
        b = [(rows[x["key"]]["parts_sl"], x["panel"]) for x in sel if rows[x["key"]]["parts_sl"] is not None]
        out = {}
        for nm, prs in (("v4.1", a), ("parts", b)):
            d = [s - p for s, p in prs]
            out[nm] = {"n": len(prs), "mean_diff": round(st.mean(d), 2), "mae": round(st.mean(abs(x) for x in d), 2),
                       "within_0.5": sum(1 for x in d if abs(x) <= 0.5), "off_1.5": sum(1 for x in d if abs(x) >= 1.5),
                       "r": round(pearson([s for s, _ in prs], [p for _, p in prs]), 2)}
        say(f"  {label:34s} " + "   ".join(
            f"{nm}: n {o['n']} · mean diff {o['mean_diff']:+.2f} · MAE {o['mae']} · within 0.5 {o['within_0.5']} · "
            f"off 1.5+ {o['off_1.5']} · r {o['r']}" for nm, o in out.items()))
        return out

    have = [x for x in jp if x["key"] in rows]
    res["judge"]["all"] = compare(have, "all")
    for g in ("founder or friend (phone)", "stock/web", "web mirror selfie"):
        res["judge"][g] = compare([x for x in have if x["group"] == g], g)
    say("  part by part (ours vs the panel's median part; the panel's parts are a halo of its gut: fit~proportion 0.93,")
    say("  cohesion~gut 0.96, so this checks direction only):")
    res["judge"]["parts"] = {}
    for pk, jk in rel.items():
        prs = [(rows[x["key"]]["res"]["parts"][pk]["display"], x["parts"][jk]) for x in have
               if rows[x["key"]]["res"]["parts"].get(pk, {}).get("display") is not None and x["parts"][jk] is not None]
        d = [s - p for s, p in prs]
        o = {"n": len(prs), "mean_diff": round(st.mean(d), 2), "within_0.5": sum(1 for x in d if abs(x) <= 0.5),
             "r": round(pearson([s for s, _ in prs], [p for _, p in prs]), 2)}
        res["judge"]["parts"][pk] = o
        say(f"    {pk:12s} n {o['n']:2d} · mean diff {o['mean_diff']:+.2f} · within 0.5 {o['within_0.5']} · r {o['r']}")
    say("  per photo (panel · v4.1 · parts):")
    res["judge"]["rows"] = []
    for x in sorted(have, key=lambda x: x["id"]):
        r = rows[x["key"]]
        res["judge"]["rows"].append({"id": x["id"], "key": x["key"], "panel": x["panel"], "v4.1": r["v4"], "parts": r["parts_sl"]})
        say(f"    {x['id']} {x['key']:26s} panel {x['panel']:<4} v4.1 {r['v4']!s:<4} parts {r['parts_sl']!s:<4} "
            f"{P.card_row(r['res'])}")

    # =========================== (d) HIS AND HIS FRIENDS' CHECKS
    say("\n(d) EVERY CHECK OF THE FOUNDER, HIS FRIENDS AND THE TWO UNKNOWNS (each check's own occasion; v4.1 -> parts)")
    res["checks"] = []
    mine = sorted([k for k, r in rows.items() if r["who"] in ("founder", "friend", "unknown")],
                  key=lambda k: (rows[k]["who"] != "friend", rows[k]["who"], k))
    for k in mine:
        r = rows[k]
        pr = r["res"]
        line = {"key": k, "who": WHO_TEXT[r["who"]], "occ": r["occ"], "src": r["src"], "app": r["app"], "v4.1": r["v4"],
                "parts": r["parts_sl"], "parts_no_sl": r["parts"], "row": P.card_row(pr), "lowest": pr["lowest"]["line"],
                "condition": pr["condition"]["display"], "occasion": pr["occasion"]["status"],
                "garments": [g.get("subcategory") for g in prim[k]["reading"].get("garments", [])],
                "na": pr["na_parts"], "tips": sorted({t["check"] for pk in P.PART_ORDER for t in pr["parts"][pk]["tips"]}),
                "second_look": pr["second_look"]}
        res["checks"].append(line)
        nosl = "" if r["parts"] == r["parts_sl"] else f" (without the second look {r['parts']})"
        say(f"  {k} [{line['who']}; {r['occ']}; {r['src']}] v4.1 {r['v4']} -> parts {r['parts_sl']}{nosl}")
        say(f"      {line['row']} | condition: {line['condition']} | occasion: {line['occasion']}")
        say(f"      lowest: {line['lowest']} | {', '.join(x for x in line['garments'] if x)}")
        # his Oct 8 truth labels (inputs/phone-oct8/truth.csv): what the score would be with the true shoe type
        t = TRUTH_SHOE.get(k[6:]) if k.startswith("phone-") else None
        rd = prim[k]["reading"]
        fi = next((i for i, g in enumerate(rd.get("garments", [])) if g.get("category") == "footwear"), None)
        if t and fi is not None and rd["garments"][fi].get("subcategory") != t:
            alt = R._with(rd, fi, "subcategory", t)
            a4 = v4(alt, r["occ"]); ap = parts(alt, r["occ"], second_look_for(k, U, L))
            line["true_shoe"] = {"type": t, "read": rd["garments"][fi].get("subcategory"), "v4.1": a4, "parts": ap["overall"],
                                 "row": P.card_row(ap)}
            say(f"      with his true shoes ({t}, read as {rd['garments'][fi].get('subcategory')}): v4.1 {a4} · parts "
                f"{ap['overall']} · {P.card_row(ap)}")

    # =========================== (e) WHAT CAN'T BE SEEN
    say("\n(e) WHAT STILL CAN'T BE SEEN")
    tipc = Counter()
    for r in sel:
        for pk in P.PART_ORDER:
            for t in r["res"]["parts"][pk]["tips"]:
                tipc[t["check"]] += 1
    say("  tips fired (a real rule whose reading hasn't passed), one reading per photo: " +
        "; ".join(f"{c} {n}" for c, n in tipc.most_common()))
    res["tips"] = dict(tipc)
    flat = [r for r in sel if r["res"]["parts"]["proportions"]["display"] in (7.0, None)
            and r["res"]["parts"]["fit"]["display"] in (7.0, None)]
    say(f"  photos where Proportions and Fit (55% of the weight) both sit at 7 or NA: {pct(len(flat), len(sel))}; "
        f"their parts scores: {dict(sorted(Counter(r['parts_sl'] for r in flat).items()))}")
    res["flat"] = {"n": len(flat), "of": len(sel)}
    # oracle: Claude's blind labels standing in for the readings that failed (b1_labels.csv, look_labels.csv)
    labs = {r["photo"]: r for r in csv.DictReader(open(HERE / "b1_labels.csv"))}
    llabs = {r["photo"]: r for r in csv.DictReader(open(HERE / "look_labels.csv"))}

    def opts(v):
        return set((v or "").split("|")) - {"", "unsure", "na"}

    LONG = {"crotch", "thigh", "knee"}
    HEAVY = {"full_break", "stacked", "pooling"}
    orc = []
    for k in sorted(B1):
        if k not in rows:
            continue
        j = prim[k]["reading"] if prim[k]["src"].startswith(("pull", "corpus")) else B1[k][0]
        occ = prim[k]["occ"]
        r = parts(j, occ, second_look_for(k, U, L))
        if r["overall"] is None:
            continue
        lb, ll = labs.get(k, {}), llabs.get(k, {})
        prop = r["parts"]["proportions"]["score"]
        why = []
        if prop is not None:
            gs = R.scored_garments(j)
            outer = [g for g in gs if g.get("category") == "outerwear"]
            bottom = next((g for g in gs if g.get("category") == "bottom"), None)
            leg = bottom.get("leg_shape") if bottom else None
            tailored = any(g.get("subcategory") in P.TAILORED for g in outer)
            top_long = opts(lb.get("top_hem_at")) and opts(lb.get("top_hem_at")) <= LONG
            out_long = opts(lb.get("outer_hem_at")) and opts(lb.get("outer_hem_at")) <= LONG
            heavy = opts(ll.get("l_pant_end")) and opts(ll.get("l_pant_end")) <= HEAVY
            rewards = sum(x["points"] for x in r["parts"]["proportions"]["reasons"] if x["points"] > 0)
            new = prop
            if top_long and not outer:
                new -= 2.0 if leg in R.LOOSE else 1.5; why.append("long top")
            if out_long and outer and not tailored and leg in R.LOOSE:
                new -= 1.5; why.append("long layer over loose legs")
            if heavy and tailored:
                new -= 2.0; why.append("heavy hem under tailoring")
            top = next((g for g in gs if g.get("category") == "top"), None)
            shirt_long = opts(lb.get("top_hem_at")) and opts(lb.get("top_hem_at")) <= LONG | {"hip"}
            if (top is not None and not outer and shirt_long and leg == "wide" and (top.get("volume") or 3) <= 3
                    and top.get("subcategory") in ("oxford_shirt", "flannel_shirt", "camp_collar_shirt", "dress_shirt")
                    and not top_long):
                new -= 1.0; why.append("shirt hangs long over wide legs (a tip today)")
            if (why or heavy) and rewards > 0:
                new -= rewards; why.append("reward blocked (heavy hem or a fault)")
            if why:
                ps = {pk: r["parts"][pk]["score"] for pk in P.PART_ORDER if r["parts"][pk]["score"] is not None}
                ps["proportions"] = max(2.0, new)
                _, x, _, _ = P.combine(ps, r["condition"], r["occasion"], occ, r["care_or_strain"], engine="v1")
                orc.append((k, r["overall"], P.round_half(x), why))
    say(f"  with Claude's blind labels standing in for the failed length/hem readings (50 batch-1 photos): "
        f"{len(orc)} photos would move")
    for k, a, b, why in orc:
        say(f"    {k:26s} {WHO_TEXT[who(k)]:30s} {a} -> {b}  ({', '.join(why)})")
    res["oracle"] = [{"key": k, "now": a, "with_labels": b, "why": w} for k, a, b, w in orc]

    # what-if: the 3-step lightness word (passed alone in batch 1: 95% the same, 94-98% right) in the scoring call.
    # Lightness comes from batch 1's B1-arm run 0 (the arm that read it), matched by slot onto the primary reading.
    B1x = load_runs(HERE / "results/b1/raw.json", "B1")
    lmoves = []
    for k in sorted(B1x):
        if k not in rows or not B1x[k]:
            continue
        lit = {}
        for g in B1x[k][0].get("garments", []):
            lit.setdefault(g.get("category"), g.get("lightness"))
        j = prim[k]["reading"]; occ = prim[k]["occ"]
        r = parts(j, occ, second_look_for(k, U, L))
        cp = r["parts"]["color"]
        if r["overall"] is None or cp["score"] is None or any(x["points"] < 0 for x in cp["reasons"]):
            continue
        gs = R.scored_garments(j)
        main = [g for g in gs if g.get("category") in ("top", "outerwear", "bottom")]
        shoes = next((g for g in gs if g.get("category") == "footwear"), None)
        fams = {R.FAMILY.get(g.get("color_family"), g.get("color_family")) for g in main}
        lv = {lit.get(g.get("category")) for g in main} - {None, "na"}
        add_pts, why = 0.0, []
        if len(fams) == 1 and fams != {"black"} and len(lv) >= 2:
            add_pts += 1.0; why.append("tonal with a range")
        else:
            tb = [g for g in main if g.get("category") in ("top", "bottom")]
            if shoes is not None and len({R.FAMILY.get(g.get("color_family"), g.get("color_family")) for g in tb}) == 1 \
                    and lit.get("footwear") not in (None, "na") and lit.get("footwear") not in {lit.get(g.get("category")) for g in tb}:
                add_pts += 0.5; why.append("tonal, anchored by the shoes")
        trio = [lit.get("top") or lit.get("outerwear"), lit.get("bottom"), lit.get("footwear") if shoes is not None else None]
        if None not in trio and "na" not in trio and len(set(trio)) == 3:
            add_pts += 0.5; why.append("light, mid and dark")
        if add_pts:
            ps = {pk: r["parts"][pk]["score"] for pk in P.PART_ORDER if r["parts"][pk]["score"] is not None}
            ps["color"] = min(9.5, ps["color"] + add_pts)
            _, x, _, _ = P.combine(ps, r["condition"], r["occasion"], occ, r["care_or_strain"], engine="v1")
            lmoves.append((k, r["overall"], P.round_half(x), why))
    say(f"  with the lightness word in the scoring call (color's tonal / light-mid-dark credits; 50 batch-1 photos): "
        f"{len(lmoves)} photos earn a credit, {sum(1 for _, a, b, _ in lmoves if b != a)} change score")
    for k, a, b, why in lmoves:
        say(f"    {k:26s} {WHO_TEXT[who(k)]:30s} {a} -> {b}  ({', '.join(why)})")
    res["lightness_whatif"] = [{"key": k, "now": a, "with": b, "why": w} for k, a, b, w in lmoves]

    # what-if (not in the SPEC): stretch every part around 7 by k before the steps after the average. It shows what
    # widening the scale would do with today's readings: more spread, but it amplifies the same reading noise.
    say("  what-if, not built: stretch every part around 7 by k (spread on one reading per photo; steadiness on b1 arm A)")
    res["stretch"] = {}

    def stretched(r, occ, k_):
        ps = {pk: 7 + k_ * (r["parts"][pk]["score"] - 7) for pk in P.PART_ORDER if r["parts"][pk]["score"] is not None}
        _, x, _, _ = P.combine(ps, r["condition"], r["occasion"], occ, r["care_or_strain"], engine="v1")
        return P.round_half(x)

    for k_ in (1.5, 2.0):
        vals = [stretched(r["res"], r["occ"], k_) for r in sel]
        line, b = band_line(f"stretch x{k_}", vals)
        hs = []
        for kk, runs in B1.items():
            v = [parts(j, "everyday", second_look_for(kk, U, L, i)) for i, j in enumerate(runs)]
            if any(x["overall"] is None for x in v):
                continue
            v = [stretched(x, "everyday", k_) for x in v]
            hs.append(all(abs(x - st.median(v)) <= 0.5 for x in v))
        say(line + f"  · b1 steady (within 0.5 of median) {pct(sum(hs), len(hs))}")
        res["stretch"][str(k_)] = {"spread": b, "b1_steady": [sum(hs), len(hs)]}

    (OUT / "analysis.txt").write_text("\n".join(LINES) + "\n")
    json.dump(res, open(OUT / "analysis.json", "w"), indent=1, default=str)


if __name__ == "__main__":
    main()

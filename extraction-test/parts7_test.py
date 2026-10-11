#!/usr/bin/env python3
"""Parts engine v7 paper test (Oct 11; DECISIONS-LOG #219). No API calls, no money.

  /usr/bin/python3 parts7_test.py     -> results/parts7/analysis.txt + analysis.json

Two changes from the founder's Oct 11 re-check (13:26 / 13:27, the same photo twice: 6.5 then 7.0):
  (a) rubric.py: a hoodie or sweatshirt worn as the OUTER layer is a streetwear anchor (ST_OUT_A), as it already was
      as the top (ST_TOP_A). It's a shared v4.1 helper, so it reaches every parts engine and v4.1 itself.
  (b) parts v7 = v6 plus TUNE["v7"]["cond_clear_only"]: a condition read moves points only on a garment read "clear";
      on a "likely" garment it becomes a no-points Condition tip.
Three columns: "before" = v6 with the old ST_OUT_A (what the app ran until now), "v6" = (a) alone, "v7" = (a) + (b),
the new default.

Same readings, loaders and judge-pilot split as parts6_test.py (results/parts2/split.json), plus the founder's Oct 11
pull (screenshots/phone/20261011-133011: the green zip hoodie check, its tap answer and its re-check readings).

Rule 7: the founder is profile pending (no birth year or picked looks given yet); his friends are profile unknown;
703a8b and ebe23f are unknown; stock and web photos are profile unknown; council cases are made-up readings with no
person. Real photos are scored with ONE stated test profile: picks Minimal + Smart casual (0.5 each), boldness
"a little", no age. His Oct 11 check is also scored with "going for streetwear" (what he picked); picks never move a
number, so the two must agree. No split by age band or picked look is possible.
"""
import contextlib
import json
import sqlite3
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

OUT = HERE / "results" / "parts7"
CASES = K / "rubric/research/style-council/cases.json"
PULL11 = K / "screenshots/phone/20261011-133011/SQLite/kitted.db"
OLD_ST_OUT_A = frozenset({"bomber", "puffer"})
COLS = ("before", "v6", "v7")
LINES = []


def say(s=""):
    LINES.append(s)
    print(s)


@contextlib.contextmanager
def old_lists():
    keep = R.ST_OUT_A
    R.ST_OUT_A = set(OLD_ST_OUT_A)
    try:
        yield
    finally:
        R.ST_OUT_A = keep


def score(reading, occ, sl=None, col="v7", styles=None, bold=None, tune=None):
    styles = styles if styles is not None else Q.PROFILE
    bold = bold or Q.BOLD
    if col == "before":
        with old_lists():
            return P.score_parts(reading, occ, styles, sl, bold, engine="v6", tune=tune)
    return P.score_parts(reading, occ, styles, sl, bold, engine="v7" if col == "v7" else "v6", tune=tune)


def all_cols(reading, occ, sl=None, **kw):
    return {c: score(reading, occ, sl, c, **kw) for c in COLS}


checks_of, label_of = S3.checks_of, S3.label_of


def cond_tips(r):
    return [t["check"] for t in ((r.get("condition") or {}).get("tips") or [])]


def load_pull11():
    db = sqlite3.connect(PULL11)
    rows = db.execute("select id, source, derived_from, reading_json from readings where image_hash like 'af7e93eb%' "
                      "order by created_at").fetchall()
    return {f"{src}:{rid[:10]}": json.loads(js) for rid, src, _, js in rows if src in ("full", "tapAnswer", "recheckRaw", "recheckMerged")}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    prim, B1, _B1L, U, L, Z = Q.load()
    res = {"profile": "test profile: picks Minimal + Smart casual (0.5 each), boldness a little, no age",
           "columns": {"before": "v6 + the old ST_OUT_A {bomber, puffer}", "v6": "v6 + hoodie/sweatshirt in ST_OUT_A",
                       "v7": "v7 (the default) + hoodie/sweatshirt in ST_OUT_A"}}
    say("PARTS ENGINE v7 PAPER TEST · before = v6 with the old streetwear outer list · v6 = + hoodie/sweatshirt as a "
        "streetwear outer · v7 = + condition counts only on clear garments (default)")
    say(f"  {res['profile']}. Rule 7: founder profile pending; friends profile unknown; 703a8b and ebe23f unknown; "
        "stock/web profile unknown; council cases are made-up readings with no person.")

    # ======================== (1) his Oct 11 check
    say("\n(1) THE FOUNDER'S OCT 11 CHECK (af7e93; green zip hoodie over a cream striped oxford, light wide jeans, "
        "Dunk-style sneakers; Class). Each stored reading, test profile and 'going for streetwear'")
    res["oct11"] = {}
    for name, rd in load_pull11().items():
        row = {}
        for prof, styles in (("test", None), ("streetwear", {"streetwear": 1.0})):
            a = all_cols(rd, "class", None, styles=styles)
            row[prof] = {c: {"overall": a[c]["overall"], "raw": a[c]["raw_score"], "label": label_of(a[c]),
                             "condition": a[c]["condition"]["display"], "tips": cond_tips(a[c]), "row": P.card_row(a[c])}
                         for c in COLS}
        res["oct11"][name] = row
        for c in COLS:
            x = row["test"][c]
            say(f"  {name:22s} {c:6s} {x['overall']} (raw {x['raw']}) [{x['label']}] condition: {x['condition']}"
                f"{' · tip ' + ','.join(x['tips']) if x['tips'] else ''} | {x['row']}")
        assert all(row["test"][c]["overall"] == row["streetwear"][c]["overall"] for c in COLS), "a pick moved a score"
    v7s = {row["test"]["v7"]["overall"] for row in res["oct11"].values()}
    v7raw = {row["test"]["v7"]["raw"] for row in res["oct11"].values()}
    say(f"  v7 on all four readings: {sorted(v7s)} (raw {sorted(v7raw)})")

    # ======================== (2) real photos
    say("\n(2) REAL PHOTOS (one reading per photo, its own occasion; the corpus + the Oct 10 pull)")
    rows_r = {}
    for k, v in prim.items():
        sl = T.second_look_for(k, U, L)
        rows_r[k] = {"who": T.who(k), "occ": v["occ"], **all_cols(v["reading"], v["occ"], sl)}
    sel = [k for k, r in rows_r.items() if all(r[c]["overall"] is not None for c in COLS)]
    res["real"] = {}
    for a, b in (("before", "v6"), ("v6", "v7"), ("before", "v7")):
        mv = [k for k in sel if rows_r[k][a]["overall"] != rows_r[k][b]["overall"]]
        rawmv = [k for k in sel if rows_r[k][a]["raw_score"] != rows_r[k][b]["raw_score"]]
        res["real"][f"{a}->{b}"] = {"moved": {k: [rows_r[k][a]["overall"], rows_r[k][b]["overall"]] for k in mv},
                                     "raw_moved": len(rawmv)}
        say(f"  {a} -> {b}: shown score moves on {len(mv)} of {len(sel)}, raw on {len(rawmv)}")
        for k in mv:
            r = rows_r[k]
            say(f"    {k:26s} [{T.WHO_TEXT[r['who']]}; {r['occ']}; {label_of(r[a])} -> {label_of(r[b])}] {r[a]['overall']} -> "
                f"{r[b]['overall']} (raw {r[a]['raw_score']} -> {r[b]['raw_score']}) cond {r[a]['condition']['deduction']} -> "
                f"{r[b]['condition']['deduction']}{' tips ' + ','.join(cond_tips(r[b])) if cond_tips(r[b]) else ''}")
    tipped = [k for k in sel if cond_tips(rows_r[k]["v7"])]
    res["real_cond_tips"] = {k: cond_tips(rows_r[k]["v7"]) for k in tipped}
    say(f"  v7's condition tip (a 'likely' garment's condition read, no points) on {len(tipped)} photos")
    outer_hoodie = [k for k in sel if any(g.get("category") == "outerwear" and g.get("subcategory") in ("hoodie", "sweatshirt")
                                          for g in R.scored_garments(prim[k]["reading"]))]
    res["outer_hoodie"] = {k: [label_of(rows_r[k]["before"]), label_of(rows_r[k]["v7"])] for k in outer_hoodie}
    say(f"  real photos with a hoodie or sweatshirt read as the outer layer: {len(outer_hoodie)}"
        + "".join(f"\n    {k} reads {res['outer_hoodie'][k][0]} -> {res['outer_hoodie'][k][1]}" for k in outer_hoodie))
    res["spread"] = {}
    for c in COLS:
        line, b = Q.band_line(f"all photos · {c}", [rows_r[k][c]["overall"] for k in sel])
        say(line)
        res["spread"][c] = b

    # ======================== (3) steadiness
    say("\n(3) 3-RUN STEADINESS (Everyday, the test profile)")
    res["steady"] = {}

    def steady_set(runsets, with_sl, label):
        per = defaultdict(dict)
        for k, runs in runsets.items():
            for c in COLS:
                per[k][c] = [score(j, "everyday", T.second_look_for(k, U, L, i) if with_sl else None, c)["overall"]
                             for i, j in enumerate(runs[:3])]
        out = {}
        for c in COLS:
            vals = [per[k][c] for k in per if None not in per[k][c] and len(per[k][c]) == 3]
            out[c] = {"within_0.5_of_median": [sum(1 for v in vals if all(abs(x - st.median(v)) <= 0.5 for x in v)), len(vals)],
                      "exact": [sum(1 for v in vals if len(set(v)) == 1), len(vals)]}
        out["changed"] = {k: {c: per[k][c] for c in COLS} for k in per if len({tuple(per[k][c]) for c in COLS}) > 1}
        say(f"  {label}")
        for c in COLS:
            o = out[c]
            say(f"    {c:6s} within 0.5 of median {o['within_0.5_of_median'][0]}/{o['within_0.5_of_median'][1]} · exact "
                f"{o['exact'][0]}/{o['exact'][1]}")
        for k, v in out["changed"].items():
            say(f"      {k}: " + " · ".join(f"{c} {v[c]}" for c in COLS))
        return out

    res["steady"]["b1_A"] = steady_set(B1, True, "batch 1 arm A (validation), second look run i paired")
    res["steady"]["zoom1_B"] = steady_set(Z, False, "zoom1 + zoom1-stock arm B (design set)")
    say("  garments (one per slot) with a non-clean condition in any of the 3 batch 1 arm A runs: does the read flip, and "
        "was the garment ever read 'likely'?")
    flips = Counter()
    for k, runs in B1.items():
        for slot in ("top", "bottom", "outerwear", "footwear"):
            reads = []
            for j in runs[:3]:
                g = next((x for x in (j or {}).get("garments", []) if x.get("category") == slot), None)
                if g:
                    reads.append((g.get("condition"), g.get("certainty")))
            if len(reads) == 3:
                cs = {c for c, _ in reads}
                if cs != {"clean"}:
                    flips[("flips" if len(cs) > 1 else "steady", "any likely" if any(ce != "clear" for _, ce in reads) else "all clear")] += 1
    res["b1_condition_flips"] = {f"{a} / {b}": n for (a, b), n in sorted(flips.items())}
    say(f"    {res['b1_condition_flips']}")

    # ======================== (4) judge pilot
    say("\n(4) AGAINST THE JUDGE PILOT (panel = median of 5 judges' weighted totals), the v2 split")
    jp = [x for x in Q.load_panel() if x["key"] in rows_r]
    saved = json.load(open(HERE / "results/parts2/split.json"))
    half = {pid: v["half"] for pid, v in saved["photos"].items()}
    res["judge"] = {}
    for side, label in (("all", "all"), ("held", "HELD-OUT half")):
        xs = [x for x in jp if side == "all" or half[x["id"]] == side]
        res["judge"][side] = {}
        for c in COLS:
            o = Q.cmp_stats([(rows_r[x["key"]][c]["overall"], x["panel"]) for x in xs])
            res["judge"][side][c] = o
            say(f"  {label:14s} {c:6s} {Q.fmt_cmp(o)}")

    # ======================== (5) the council
    say("\n(5) THE STYLE COUNCIL'S CASES (made-up readings, no person; each case's own occasion, picks, boldness)")
    cases = json.load(open(CASES))
    crow = []
    for x in cases:
        picks = dict(x.get("styles_picked") or {})
        a = all_cols(x["reading"], x["occasion"], None, styles=picks, bold=x.get("boldness", "a_little"))
        if a["before"]["overall"] is None:
            continue
        adv = P4.adv_of(x) if x["group"] in S3.STYLE_OF_GROUP else None
        crow.append({"id": x["id"], "tier": P4.tier(adv), **{c: a[c]["overall"] for c in COLS}})
    moved = [r for r in crow if r["before"] != r["v7"]]
    res["council_moved"] = moved
    say(f"  {len(crow)} cases; moved before -> v7: {len(moved)}"
        + "".join(f"\n    {r['id']} {r['before']} -> v6 {r['v6']} -> v7 {r['v7']}" for r in moved))

    # ======================== (6) his, his friends' checks + targets
    say("\n(6) EVERY CHECK OF THE FOUNDER, HIS FRIENDS AND THE TWO UNKNOWNS (own occasion)")
    mine = sorted([k for k in rows_r if rows_r[k]["who"] in ("founder", "friend", "unknown")],
                  key=lambda k: (rows_r[k]["who"] != "friend", rows_r[k]["who"], k))
    tg = {}
    for k in mine:
        r = rows_r[k]
        tg[k] = {c: r[c]["overall"] for c in COLS}
        say(f"  {k:16s} [{T.WHO_TEXT[r['who']]}; {r['occ']}; {label_of(r['v7'])}] before {r['before']['overall']} -> v7 "
            f"{r['v7']['overall']} | {P.card_row(r['v7'])}")
    res["checks"] = tg
    deli = [r for r in crow if r["tier"] == "deliberate"]
    plain = [r for r in crow if r["tier"] == "plain"]
    b1 = res["steady"]["b1_A"]["v7"]["within_0.5_of_median"]
    ja, jb = res["judge"]["held"]["before"], res["judge"]["held"]["v7"]
    p8 = res["spread"]["v7"]["pct8"]
    targets = [
        ("his Oct 11 green hoodie fit at 7.5 on every stored reading (first read, tap answer, re-check raw and merged)",
         v7s == {7.5}),
        ("the friend's blazer d1967f at 7 or below", tg["phone-d1967f"]["v7"] <= 7.0),
        ("the chore coat (e438d4, f4870b, fb0b17) at 7-7.5", all(7.0 <= tg[k]["v7"] <= 7.5 for k in ("phone-e438d4", "phone-f4870b", "phone-fb0b17"))),
        ("his black tee + wide jeans + white leather sneakers (8ad378, 403ade) at 7", all(tg[k]["v7"] == 7.0 for k in ("phone-8ad378", "phone-403ade"))),
        ("council plain fits that sat at 6.5-7.5 still do", all(6.5 <= r["v7"] <= 7.5 for r in plain if 6.5 <= r["before"] <= 7.5)),
        ("council deliberate fits that reached 8 still do", all(r["v7"] >= 8 for r in deli if r["before"] >= 8)),
        (f"batch 1 arm A steady 49/49 ({b1[0]}/{b1[1]})", b1[0] >= 49 and b1[0] == b1[1]),
        (f"panel gap within +-0.2 ({res['judge']['all']['v7']['mean_diff']:+.2f})", abs(res["judge"]["all"]["v7"]["mean_diff"]) <= 0.2),
        (f"no loss on the held-out half, within 0.5 of the panel ({ja['within_0.5']} -> {jb['within_0.5']})",
         jb["within_0.5"] >= ja["within_0.5"]),
        (f"held-out MAE no worse ({ja['mae']} -> {jb['mae']})", jb["mae"] <= ja["mae"]),
        (f"8+ at 5-12% on the real photos ({p8}%)", 5 <= p8 <= 12),
    ]

    # ======================== (7) picks never move a number
    keys7 = ["streetwear", "workwear", "vintage_sport", "outdoor", "minimalist", "classic_prep", "smart_casual"]
    variants = [{}] + [{s: 1.0} for s in keys7] + [{"streetwear": 0.5, "minimalist": 0.25, "smart_casual": 0.25}]
    pool = ([(x["id"], x["reading"], x["occasion"], x.get("boldness", "a_little")) for x in cases]
            + [(k, prim[k]["reading"], prim[k]["occ"], "a_little") for k in sel]
            + [(n, rd, "class", "a_little") for n, rd in load_pull11().items()])
    bad = [cid for cid, rd, occ, bold in pool
           if len({(r["overall"], r.get("raw_score")) for r in (score(rd, occ, None, "v7", styles=v, bold=bold) for v in variants)}) > 1]
    res["picks_moved"] = bad
    say(f"\n(7) PICKS NEVER MOVE A NUMBER (v7): readings whose score changed with the picks: {len(bad)} of {len(pool)}")
    targets.append(("picks never change a score", not bad))

    # ======================== (8) v4.1's F7, if it matched
    say("\n(8) v4.1's F7 (care) IF IT ALSO NEEDED 'clear' (not adopted; v4.1 now scores only old checks)")

    def clear_only(rd):
        out = json.loads(json.dumps(rd))
        for g in out.get("garments", []):
            if g.get("condition") in P.CARE_READS and g.get("certainty") != "clear":
                g["condition"] = "clean"
        return out
    f7 = [k for k in sel if R.score(prim[k]["reading"], prim[k]["occ"], Q.PROFILE, Q.BOLD)["overall"]
          != R.score(clear_only(prim[k]["reading"]), prim[k]["occ"], Q.PROFILE, Q.BOLD)["overall"]]
    res["v41_f7_would_move"] = f7
    say(f"  real photos whose v4.1 score would move: {len(f7)} of {len(sel)}" + (": " + ", ".join(f7) if f7 else ""))

    say("\n  targets:")
    res["targets"] = []
    for name, ok in targets:
        res["targets"].append({"target": name, "met": ok})
        say(f"    [{'met' if ok else 'NOT MET'}] {name}")
    (OUT / "analysis.txt").write_text("\n".join(LINES) + "\n")
    json.dump(res, open(OUT / "analysis.json", "w"), indent=1,
              default=lambda o: sorted(o) if isinstance(o, (set, frozenset)) else str(o))


if __name__ == "__main__":
    main()

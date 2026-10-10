#!/usr/bin/env python3
"""Report for the second-look test (look_test.py). No API calls.
  /usr/bin/python3 look_analyze.py   -> results/look1/analysis.json + analysis.txt
Steadiness: all 3 runs give the same value. Accuracy: every run against look_labels.csv (blind); "unsure" labels are
left out; "a|b" accepts either. Label "na" means none / not_visible. Batch 1 comparison: the scoring-call hem of
arms A and B1 (results/b1/raw.json) judged against the same L labels (live hem values, so no "stacked")."""
import csv, json, statistics
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "results" / "look1"
PRICE_IN, PRICE_OUT = 0.75 / 1e6, 3.75 / 1e6
LAB = {r["photo"]: r for r in csv.DictReader((HERE / "look_labels.csv").open())}
FIELDS = {"U": ["outer_hem_at", "under_present", "under_hem_at", "under_shows"],
          "US": ["outer_hem_at", "under_present", "under_hem_at", "under_shows", "outer_shoulder_seam"],
          "L": ["pant_end", "covers_shoe", "heavy"]}
LABCOL = {"outer_hem_at": "u_outer_hem_at", "under_present": "u_under_present", "under_hem_at": "u_under_hem_at",
          "under_shows": "u_under_shows", "outer_shoulder_seam": "u_outer_seam", "pant_end": "l_pant_end",
          "covers_shoe": "l_covers_shoe", "heavy": "l_pant_end"}
HEAVY = {"full_break", "stacked", "pooling"}
LIGHT = {"cropped", "no_break", "slight_break"}


def who(p):
    per = LAB[p]["person"]
    if per == "founder":
        return "founder (profile pending)"
    if per.startswith("friend"):
        return "friends (profile unknown)"
    if per.startswith("unknown"):
        return "703a8b/ebe23f (ask the founder)"
    return "web + stock (profile unknown)"


def val(j, f):
    if f == "heavy":
        v = j.get("pant_end")
        return "heavy" if v in HEAVY else "light" if v in LIGHT else "other"
    return j.get(f)


def lab_opts(p, f):
    raw = LAB[p][LABCOL[f]]
    opts = set(raw.split("|")) - {"unsure", ""}
    if not opts:
        return None
    if f == "heavy":
        k = {"heavy" if o in HEAVY else "light" if o in LIGHT else "other" for o in opts}
        return k if len(k) == 1 else k  # a mixed label (slight|full) accepts either
    if f == "under_hem_at":
        opts = {"none" if o == "na" else o for o in opts}
    if f == "outer_shoulder_seam":
        opts = {"not_visible" if o == "na" else o for o in opts}
    return opts


def pct(a, b):
    return f"{a}/{b} ({100 * a / b:.0f}%)" if b else "–"


def main():
    raw = json.loads((OUT / "raw.json").read_text())
    by = defaultdict(list)
    for r in raw:
        if r.get("json"):
            by[(r["arm"], r["photo"])].append(r)
    for k in by:
        by[k].sort(key=lambda r: r["run"])
    photos = sorted({p for (_, p) in by})
    res, lines = {}, []
    P = lines.append

    P("COST AND SPEED (every call)")
    res["cost"] = {}
    for a in ("U", "US", "L"):
        rs = [r for r in raw if r["arm"] == a and r.get("usage")]
        c = [100 * (r["usage"].get("promptTokenCount", 0) * PRICE_IN + r["usage"].get("candidatesTokenCount", 0) * PRICE_OUT) for r in rs]
        s = sorted(r["seconds"] for r in rs)
        res["cost"][a] = {"calls": len(rs), "cents_per_call": round(statistics.mean(c), 4), "spent_usd": round(sum(c) / 100, 4),
                          "median_s": statistics.median(s), "p90_s": s[int(len(s) * .9) - 1], "max_s": s[-1],
                          "errors": sum(1 for r in raw if r["arm"] == a and not r.get("json"))}
        P(f"  {a}: {res['cost'][a]}")
    P(f"  total ${sum(v['spent_usd'] for v in res['cost'].values()):.3f}")

    res["fields"] = {}
    for a, fields in FIELDS.items():
        P(f"\nARM {a}")
        for f in fields:
            # steadiness
            st = [len({json.dumps(val(r["json"], f)) for r in by[(a, p)][:3]}) == 1 for p in photos if len(by[(a, p)]) >= 3]
            # accuracy, precision, recall
            acc, prec, rec, conf = [0, 0], defaultdict(lambda: [0, 0]), defaultdict(lambda: [0, 0]), Counter()
            grp = defaultdict(lambda: [0, 0, 0, 0])  # same, n, right, judged
            for p in photos:
                rs = by[(a, p)][:3]
                g = who(p)
                if len(rs) >= 3:
                    grp[g][0] += len({json.dumps(val(r["json"], f)) for r in rs}) == 1; grp[g][1] += 1
                opts = lab_opts(p, f)
                if opts is None:
                    continue
                if f == "under_hem_at" and LAB[p]["u_under_present"] != "yes":
                    continue  # judge the under hem only where a labelled under piece exists
                for r in rs:
                    v = val(r["json"], f)
                    if f == "under_hem_at" and r["json"].get("under_present") != "yes":
                        continue
                    ok = v in opts
                    acc[0] += ok; acc[1] += 1
                    prec[v][0] += ok; prec[v][1] += 1
                    grp[g][2] += ok; grp[g][3] += 1
                    conf[(LAB[p][LABCOL[f]], v)] += 1
                    if len(opts) == 1:
                        o = next(iter(opts)); rec[o][0] += ok; rec[o][1] += 1
            d = {"same": [sum(st), len(st)], "right": acc, "precision": dict(prec), "recall": dict(rec),
                 "by_group": {k: v for k, v in grp.items()},
                 "confusion": {f"{x} -> {y}": n for (x, y), n in conf.most_common()}}
            res["fields"][f"{a}.{f}"] = d
            P(f"  {f:20s} same {pct(*d['same']):>14s}   right {pct(*acc):>16s}")
            P("     fires: " + " · ".join(f"{k} {pct(*v)}" for k, v in sorted(prec.items(), key=lambda x: -x[1][1])))
            P("     found: " + " · ".join(f"{k} {pct(*v)}" for k, v in sorted(rec.items(), key=lambda x: -x[1][1])))
            P("     by group (same · right): " + " | ".join(f"{k}: {pct(v[0], v[1])} · {pct(v[2], v[3])}" for k, v in grp.items()))
            flips = [f"{p} {[val(r['json'], f) for r in by[(a, p)][:3]]}" for p in photos
                     if len(by[(a, p)]) >= 3 and len({json.dumps(val(r['json'], f)) for r in by[(a, p)][:3]}) > 1]
            d["flips"] = flips
            P(f"     flips ({len(flips)}): " + "; ".join(flips))
            P("     top confusions: " + "; ".join(f"{k} ×{n}" for k, n in list(d["confusion"].items())[:8] if k.split(' -> ')[1] not in k.split(' -> ')[0].split('|')))

    # the peeks
    peeks = [p for p in photos if set(LAB[p]["u_under_shows"].split("|")) & {"a_little", "clearly"}]
    P("\nLABELLED PEEKS (label: a_little/clearly possible), runs per arm:")
    res["peeks"] = {}
    for p in peeks:
        row = {a: [by[(a, p)][i]["json"]["under_shows"] for i in range(3)] for a in ("U", "US")}
        kinds = [by[("U", p)][i]["json"]["outer_kind"] + "/" + by[("U", p)][i]["json"]["under_kind"] for i in range(3)]
        res["peeks"][p] = {"label": LAB[p]["u_under_shows"], **row, "U_kinds": kinds}
        P(f"  {p:26s} label {LAB[p]['u_under_shows']:16s} U {row['U']}  US {row['US']}  kinds {kinds}")
    firm = [p for p in peeks if "no" not in LAB[p]["u_under_shows"].split("|")]
    for a in ("U", "US"):
        caught = sum(1 for p in firm if sum(by[(a, p)][i]["json"]["under_shows"] != "no" for i in range(3)) >= 2)
        allp = sum(1 for p in peeks if sum(by[(a, p)][i]["json"]["under_shows"] != "no" for i in range(3)) >= 2)
        res["peeks"][f"{a}_caught_firm"] = [caught, len(firm)]
        res["peeks"][f"{a}_caught_all"] = [allp, len(peeks)]
        P(f"  {a}: firm peeks caught (2+ of 3 runs) {caught}/{len(firm)}; any peek label {allp}/{len(peeks)}")
    # false peeks: label 'no' only, model says a_little/clearly
    for a in ("U", "US"):
        fp = [(p, [by[(a, p)][i]["json"]["under_shows"] for i in range(3)]) for p in photos
              if LAB[p]["u_under_shows"] == "no" and any(by[(a, p)][i]["json"]["under_shows"] != "no" for i in range(3))]
        res["peeks"][f"{a}_false"] = fp
        P(f"  {a} peeks on 'no' photos: {fp}")

    # d1967f
    P("\nphone-d1967f (navy blazer friend), L runs: " + str([r["json"] for r in by[("L", "phone-d1967f")]]))
    P("  batch 1 hem (A, B1): " + str([(r["arm"], [g.get("hem") for g in r["json"]["garments"] if g["category"] == "bottom"])
                                        for r in json.loads((HERE / "results/b1/raw.json").read_text())
                                        if r["photo"] == "phone-d1967f" and r.get("json")]))

    # batch 1 comparison on the same L labels
    b1 = [r for r in json.loads((HERE / "results/b1/raw.json").read_text()) if r.get("json")]
    bb = defaultdict(list)
    for r in b1:
        bb[(r["arm"], r["photo"])].append(r)
    P("\nBATCH 1 scoring-call hem vs the same L labels (live values: no stacked)")
    res["b1_hem"] = {}
    for a in ("A", "B1"):
        st, acc, hv, hvst = [], [0, 0], [0, 0], []
        for p in photos:
            rs = sorted(bb[(a, p)], key=lambda r: r["run"])[:3]
            hs = []
            for r in rs:
                b = [g for g in r["json"]["garments"] if g["category"] == "bottom"]
                hs.append(b[0].get("hem") if b else None)
            if len(hs) == 3:
                st.append(len(set(hs)) == 1)
                hvst.append(len({"heavy" if h in HEAVY else "light" if h in LIGHT else "other" for h in hs}) == 1)
            opts = lab_opts(p, "pant_end")
            hopts = lab_opts(p, "heavy")
            for h in hs:
                if opts and h is not None and LAB[p]["l_pant_end"] not in ("shorts", "not_visible"):
                    acc[0] += h in opts; acc[1] += 1
                if hopts and h is not None and hopts <= {"heavy", "light"}:
                    k = "heavy" if h in HEAVY else "light" if h in LIGHT else "other"
                    hv[0] += k in hopts; hv[1] += 1
        res["b1_hem"][a] = {"same": [sum(st), len(st)], "right": acc, "heavy_same": [sum(hvst), len(hvst)], "heavy_right": hv}
        P(f"  {a}: hem same {pct(sum(st), len(st))} · right {pct(*acc)} · heavy/light same {pct(sum(hvst), len(hvst))} · right {pct(*hv)}")

    # ---------- derived coarse fields (what the parts rules actually need)
    P("\nDERIVED COARSE FIELDS")
    LONG = {"crotch", "thigh", "knee"}; SHORT = {"tucked", "cropped", "waistband", "hip"}
    def bucket(v, f):
        if f in ("outer_hem_at", "under_hem_at"):
            return "long" if v in LONG else "short" if v in SHORT else v
        if f == "covers_shoe":
            return "covers" if v in ("partly", "mostly") else v
        if f == "under_shows":
            return "peek" if v in ("a_little", "clearly") else v
        if f == "pant_end":
            return v
    res["derived"] = {}
    for a, f, only_shoes in (("U", "outer_hem_at", False), ("US", "outer_hem_at", False), ("U", "under_hem_at", False),
                             ("U", "under_shows", False), ("US", "under_shows", False), ("L", "covers_shoe", False),
                             ("L", "pant_end", True), ("L", "heavy", True)):
        st, acc, prec = [], [0, 0], defaultdict(lambda: [0, 0])
        for p in photos:
            if only_shoes and LAB[p]["l_covers_shoe"] in ("no_shoes_visible", "unsure"):
                continue
            rs = by[(a, p)][:3]
            vals = [bucket(val(r["json"], f), f) if f != "heavy" else val(r["json"], f) for r in rs]
            if f == "under_hem_at":
                if LAB[p]["u_under_present"] != "yes":
                    continue
                vals = [v for v, r in zip(vals, rs) if r["json"].get("under_present") == "yes"]
            if len(vals) == 3:
                st.append(len(set(vals)) == 1)
            opts = lab_opts(p, f)
            if opts is None:
                continue
            ob = {bucket(o, f) for o in opts} if f != "heavy" else opts
            for v in vals:
                ok = v in ob
                acc[0] += ok; acc[1] += 1; prec[v][0] += ok; prec[v][1] += 1
        key = f"{a}.{f}" + (" (shoes visible)" if only_shoes else " (coarse)")
        res["derived"][key] = {"same": [sum(st), len(st)], "right": acc, "precision": dict(prec)}
        P(f"  {key:34s} same {pct(sum(st), len(st)):>14s} · right {pct(*acc):>14s} · fires " +
          " · ".join(f"{k} {pct(*v)}" for k, v in sorted(prec.items(), key=lambda x: -x[1][1])))
    for a in ("U", "US", "L"):
        s5 = [r["seconds"] for r in raw if r["arm"] == a and r.get("usage")]
        res["cost"][a]["under_5s"] = [sum(x <= 5 for x in s5), len(s5)]
        P(f"  {a} calls finishing within 5 s: {pct(sum(x <= 5 for x in s5), len(s5))}")

    (OUT / "analysis.json").write_text(json.dumps(res, indent=1, default=list))
    (OUT / "analysis.txt").write_text("\n".join(lines) + "\n")
    print("\n".join(lines))


if __name__ == "__main__":
    main()

"""Compare test arms (setups) run on the same photos. No API calls.

  /usr/bin/python3 compare.py A=results/x/A-stock,results/x/A-mirror B=... C=... D=... \
      --control A --candidate C --repeat D --fixes ../inputs/fitcheck-photos/fixes.csv --out results/x/compare.md

Each arm is NAME=folder[,folder...] (folders that hold raw_results.json). Per arm: consistency,
API time, answer size, cost, failures, fix detection. Against the control: score drift and
reading agreement on the fields the rubric uses. --repeat names an identical copy of the
candidate, to measure same-session noise (an A/A test); --candidate gets the lock-in verdict
(rules in results/lockin-oct6/PREREGISTERED.md).
"""
import argparse, json, statistics
from collections import Counter, defaultdict
from pathlib import Path

import copy, os
import rubric
import run_test

PRICE_NOW = (0.75, 3.75)      # $ per million tokens, input / output (incl. thinking); Google, through Dec 31 2026
PRICE_2027 = (1.50, 7.50)
# rubric-relevant fields per garment category (v4 doesn't read shoe pattern/logo, so they're not compared)
KEY_FIELDS = {
    "top": ["subcategory", "color_family", "saturation", "pattern", "pattern_scale", "logo", "volume", "tucked",
            "length", "sleeve_end", "condition"],
    "outerwear": ["subcategory", "color_family", "saturation", "pattern", "pattern_scale", "logo", "sleeve_end", "condition"],
    "bottom": ["subcategory", "color_family", "pattern", "leg_shape", "hem", "condition"],
    "footwear": ["subcategory", "color_family", "condition"],
}


def load(folders, rescore=False, fixes=None):
    out = []
    for f in folders:
        out += json.loads((Path(f) / "raw_results.json").read_text())
    if rescore:  # judge every arm with the live rubric, so only the readings differ
        styles = rubric.parse_styles(os.environ.get("TEST_STYLES", "minimalist:0.5,smart_casual:0.5"))
        for x in out:
            occ = ((fixes or {}).get(x["outfit"], {}) or {}).get("occasion") or "everyday"
            x["score"] = rubric.score(copy.deepcopy(x["extraction"]), occasion=occ, styles=styles) if x.get("extraction") else None
    return out


def photo_key(x):
    return (x["outfit"], x["stage"], x["method"])


def scores_by_photo(res):
    d = defaultdict(list)
    for x in res:
        s = x.get("score") or {}
        if s.get("overall") is not None:
            d[photo_key(x)].append(s["overall"])
    return {k: v for k, v in d.items() if len(v) >= 3}


def readings_by_photo(res):
    """Most common value per (photo, category, field), plus scene fields."""
    vals = defaultdict(list)
    for x in res:
        e = x.get("extraction")
        if not e:
            continue
        sc = e.get("scene", {})
        vals[(photo_key(x), "scene", "shoes_visible")].append(str(sc.get("shoes_visible")))
        vals[(photo_key(x), "scene", "framing")].append(str(sc.get("framing")))
        for cat, fields in KEY_FIELDS.items():
            g = next((g for g in e.get("garments", []) if g.get("category") == cat), None)
            vals[(photo_key(x), cat, "present")].append(str(g is not None))
            if g:
                for f in fields:
                    vals[(photo_key(x), cat, f)].append(str(g.get(f)))
    return {k: Counter(v).most_common(1)[0][0] for k, v in vals.items()}


def pct(sorted_vals, q):
    return sorted_vals[min(len(sorted_vals) - 1, int(q * len(sorted_vals)))] if sorted_vals else None


def arm_stats(res, fixes):
    by = scores_by_photo(res)
    inconsistent = [k for k, v in by.items() if not all(abs(a - statistics.median(v)) <= 0.5 for a in v)]
    api = sorted(x["seconds_api"] for x in res if x.get("seconds_api"))
    usage = [x.get("usage") or {} for x in res if x.get("usage")]
    vis = sorted(u.get("candidatesTokenCount", 0) for u in usage)
    think = [u.get("thoughtsTokenCount", 0) for u in usage]
    tin = [u.get("promptTokenCount", 0) for u in usage]
    out_tok = [u.get("candidatesTokenCount", 0) + u.get("thoughtsTokenCount", 0) for u in usage]
    cost = lambda price: statistics.mean(i * price[0] / 1e6 + o * price[1] / 1e6 for i, o in zip(tin, out_tok)) * 100
    failures = sum(1 for x in res if not x.get("extraction"))
    hits = total = 0
    for outfit, info in fixes.items():
        b = [x.get("extraction") for x in res if x["outfit"] == outfit and x["stage"] == "before"]
        a = [x.get("extraction") for x in res if x["outfit"] == outfit and x["stage"] == "after"]
        if a and b:
            det = run_test.fix_detected(info.get("fix_type", "").strip(), b, a)
            if det is not None:
                total += 1; hits += bool(det)
    return {"photos": len(by), "consistent": len(by) - len(inconsistent), "inconsistent": sorted(k[0] for k in inconsistent),
            "api_median": statistics.median(api) if api else None, "api_p90": pct(api, 0.9),
            "under5": sum(a <= 5 for a in api) / len(api) if api else None,
            "vis_median": statistics.median(vis) if vis else None, "vis_p90": pct(vis, 0.9),
            "think_median": statistics.median(think) if think else None,
            "cost_now": cost(PRICE_NOW) if usage else None, "cost_2027": cost(PRICE_2027) if usage else None,
            "calls": len(res), "failures": failures, "fix_hits": hits, "fix_total": total}


def versus(res, ctrl):
    a, b = scores_by_photo(res), scores_by_photo(ctrl)
    common = sorted(set(a) & set(b))
    diffs = [statistics.median(a[k]) - statistics.median(b[k]) for k in common]
    ra, rb = readings_by_photo(res), readings_by_photo(ctrl)
    per_field = defaultdict(lambda: [0, 0])
    for k in set(ra) & set(rb):
        fld = f"{k[1]}.{k[2]}"
        per_field[fld][0] += ra[k] == rb[k]; per_field[fld][1] += 1
    agree = sum(v[0] for v in per_field.values()) / max(1, sum(v[1] for v in per_field.values()))
    moved = [(k[0], k[1], d) for k, d in zip(common, diffs) if abs(d) >= 1.0]
    return {"photos": len(common), "mean_diff": statistics.mean(diffs) if diffs else 0,
            "share_move_1": len(moved) / len(common) if common else 0, "moved_1": moved,
            "share_move_05": sum(abs(d) >= 0.5 for d in diffs) / len(common) if common else 0,
            "agree": agree, "fields": {f: v[0] / v[1] for f, v in per_field.items() if v[1]}}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("arms", nargs="+", help="NAME=folder[,folder...]")
    ap.add_argument("--control", required=True)
    ap.add_argument("--candidate")
    ap.add_argument("--repeat", help="identical copy of the candidate (A/A noise)")
    ap.add_argument("--fixes", action="append", default=[], help="fixes.csv for before/after pairs (repeatable)")
    ap.add_argument("--out")
    ap.add_argument("--rescore", action="store_true", help="re-judge all arms with the live rubric.py")
    args = ap.parse_args()

    fixes = {}
    for f in args.fixes:
        fixes.update(run_test.load_fixes(Path(f)))
    arms = {}
    for spec in args.arms:
        name, folders = spec.split("=", 1)
        arms[name] = load(folders.split(","), args.rescore, fixes)
    stats = {n: arm_stats(r, fixes) for n, r in arms.items()}
    vs = {n: versus(r, arms[args.control]) for n, r in arms.items() if n != args.control}
    aa = versus(arms[args.candidate], arms[args.repeat]) if args.candidate and args.repeat else None

    L = ["# Arm comparison", "",
         "| Arm | Consistent | API median | API p90 | ≤5 s | Answer tokens (median / p90) | Thinking | Cost now / 2027 | Failures | Fixes noticed |",
         "|---|---|---|---|---|---|---|---|---|---|"]
    for n, s in stats.items():
        f = lambda v, spec="": "—" if v is None else format(v, spec)
        L.append(f"| {n} | {s['consistent']}/{s['photos']} ({s['consistent'] / max(1, s['photos']):.0%}) | {f(s['api_median'])} s | {f(s['api_p90'])} s | "
                 f"{f(s['under5'], '.0%')} | {f(s['vis_median'], '.0f')} / {f(s['vis_p90'])} | {f(s['think_median'], '.0f')} | "
                 f"{f(s['cost_now'], '.2f')}¢ / {f(s['cost_2027'], '.2f')}¢ | {s['failures']}/{s['calls']} | {s['fix_hits']}/{s['fix_total']} |")
    L += ["", f"## Against the control ({args.control})", "",
          "| Arm | Photos | Mean score change | Moved ≥ 1.0 | Moved ≥ 0.5 | Readings agree |", "|---|---|---|---|---|---|"]
    rows = list(vs.items()) + ([(f"{args.candidate} vs {args.repeat} (A/A noise)", aa)] if aa else [])
    for n, v in rows:
        L.append(f"| {n} | {v['photos']} | {v['mean_diff']:+.2f} | {v['share_move_1']:.0%} | {v['share_move_05']:.0%} | {v['agree']:.1%} |")
    if args.candidate:
        c, v = stats[args.candidate], vs[args.candidate]
        low = sorted((f, a) for f, a in v["fields"].items() if a < 0.8)
        noise_low = {f for f, a in (aa["fields"].items() if aa else []) if a < 0.8}
        unexplained = [(f, a) for f, a in low if f not in noise_low]
        ctrl = stats[args.control]
        checks = [
            ("L1 consistency ≥ 90%, ≤ 2 more inconsistent than control",
             c["consistent"] / c["photos"] >= 0.9 and (c["photos"] - c["consistent"]) <= (ctrl["photos"] - ctrl["consistent"]) + 2),
            ("L2 mean drift within ±0.25", abs(v["mean_diff"]) <= 0.25),
            ("L2 moved ≥ 1.0 on ≤ 10% and ≤ A/A + 5 points",
             v["share_move_1"] <= 0.10 and (aa is None or v["share_move_1"] <= aa["share_move_1"] + 0.05)),
            ("L3 readings agree ≥ 90%", v["agree"] >= 0.90),
            ("L3 no key field < 80% beyond noise", not unexplained),
            ("L4 fixes ≥ control − 1", c["fix_hits"] >= ctrl["fix_hits"] - 1),
            ("L5 API median ≤ 5.0 s", c["api_median"] is not None and c["api_median"] <= 5.0),
            ("L5 API p90 ≤ 8.0 s", c["api_p90"] is not None and c["api_p90"] <= 8.0),
            ("L5 answer tokens p90 ≤ 500", c["vis_p90"] is not None and c["vis_p90"] <= 500),
            ("L6 failures ≤ 1%", c["failures"] / c["calls"] <= 0.01),
        ]
        L += ["", f"## Lock-in verdict for {args.candidate}", "", "| Rule | Result |", "|---|---|"]
        L += [f"| {r} | {'PASS' if ok else '**FAIL**'} |" for r, ok in checks]
        L += ["", f"- Photos moved ≥ 1.0 vs. control: {v['moved_1'] or 'none'}",
              f"- Inconsistent photos ({args.candidate}): {c['inconsistent'] or 'none'}; control: {ctrl['inconsistent'] or 'none'}",
              f"- Key fields under 80% agreement: {low or 'none'} (also under 80% in the A/A repeat: {sorted(noise_low) or 'none'})"]
    L += ["", "## Field agreement vs. control, lowest first", "", "| Field | " + " | ".join(vs) + (" | A/A |" if aa else " |"),
          "|---|" + "---|" * (len(vs) + (1 if aa else 0))]
    fields = sorted({f for v in vs.values() for f in v["fields"]}, key=lambda f: min(v["fields"].get(f, 1) for v in vs.values()))
    for f in fields:
        cells = [f"{vs[n]['fields'].get(f, float('nan')):.0%}" for n in vs] + ([f"{aa['fields'].get(f, float('nan')):.0%}"] if aa else [])
        L.append(f"| {f} | " + " | ".join(cells) + " |")
    text = "\n".join(L) + "\n"
    if args.out:
        Path(args.out).write_text(text)
    print(text)


if __name__ == "__main__":
    main()

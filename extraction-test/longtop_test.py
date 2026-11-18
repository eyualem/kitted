#!/usr/bin/env python3
"""Long-top test (longtop1): one narrow yes/no Gemini call, "does the top hang below the crotch?"

Why: the rule "a tee or top that's long in the body (past the fly or crotch) holds an outfit back" needs it, and the
live read's length: below_crotch almost never fires. look1 (DECISIONS-LOG #199) found multi-level hem fields fail and
narrow yes/no questions pass, so this asks one.

Config = look_test.py's (b1_test.call): gemini-3.8-flash, thinking off, temperature 0, prompt_longtop.txt +
schema_longtop.json, one image per call. The image is the face-hidden BODY close-up (the whole person), the copy
look U already falls back to: the upper close-up ends about 0.30 of the way from hips to knees, right at the crotch,
so it cuts off the very hem this question is about. Images come from the earlier tests' prepared copies (gold1, b1,
creators1: the app's own Swift prep, faces hidden); a photo with no prepared copy is skipped.

Photos and truth: longtop_labels.csv (written by eye before any call).

  export GEMINI_API_KEY=...       (never printed or written)
  /usr/bin/python3 longtop_test.py --runs 1 --only pin-070,ig-087 --budget 0.02     (pilot)
  /usr/bin/python3 longtop_test.py --runs 3 --budget 0.90
  /usr/bin/python3 longtop_test.py --report                                         (no calls)
"""
import argparse, csv, json, os, sys, time
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from b1_test import call, cents as cents_no_thoughts, MODEL, PRICE_OUT

HERE = Path(__file__).resolve().parent
OUT = HERE / "results" / "longtop1"
PROMPT = (HERE / "prompt_longtop.txt").read_text()
SCHEMA = json.loads((HERE / "schema_longtop.json").read_text())
FIELD = "top_below_crotch"
# Prepared copies live in the main checkout (git-ignored); a worktree has none of its own.
ROOTS = [HERE / "results", Path("/Users/eyu/Desktop/files/Kitted/extraction-test/results")]
SETS = ("gold1", "b1", "creators1")


def cents(r):
    """b1_test.cents plus the thought tokens: thinkingBudget 0 still returns billed thoughtsTokenCount on this model
    (look1 averaged 148 a call that its spend left out), and Google bills them as output."""
    u = r.get("usage") or {}
    return cents_no_thoughts(r) + 100 * u.get("thoughtsTokenCount", 0) * PRICE_OUT


def image_for(pid):
    for root in ROOTS:
        for s in SETS:
            p = root / s / "images" / f"{pid}.body.jpg"
            if p.exists():
                return p
    return None


def labels():
    return list(csv.DictReader((HERE / "longtop_labels.csv").open()))


def report():
    rows = labels()
    raw = json.loads((OUT / "raw.json").read_text())
    ans = {}
    for r in raw:
        if r.get("json"):
            ans.setdefault(r["photo"], []).append(r["json"][FIELD])
    calls = [r for r in raw if r.get("usage")]
    spent = sum(cents(r) for r in calls) / 100
    lines, per = [], []
    steady = n = 0
    for row in rows:
        a = ans.get(row["id"], [])
        if not a:
            continue
        n += 1
        st = len(set(a)) == 1
        steady += st
        maj = Counter(a).most_common(1)[0][0]
        per.append({"id": row["id"], "label": row["label"], "answers": a, "steady": st, "majority": maj})
    def yes_runs(p):
        return sum(x == "yes" for x in p["answers"])
    clear_yes = [p for p in per if p["label"] == "yes"]
    clear_not = [p for p in per if p["label"] in ("no", "not_applicable")]
    border = [p for p in per if p["label"] == "borderline"]
    # per photo, by majority of the 3 runs; and per run (every call counted)
    tp = sum(p["majority"] == "yes" for p in clear_yes)
    fp = sum(p["majority"] == "yes" for p in clear_not)
    tp_runs = sum(yes_runs(p) for p in clear_yes); yes_runs_total = sum(len(p["answers"]) for p in clear_yes)
    fp_runs = sum(yes_runs(p) for p in clear_not); not_runs_total = sum(len(p["answers"]) for p in clear_not)
    clear = clear_yes + clear_not
    right = tp + sum(p["majority"] != "yes" for p in clear_not)
    out = {
        "photos": n, "calls": len(calls), "errors": sum(1 for r in raw if r.get("error")),
        "spent_usd": round(spent, 4), "cents_per_call": round(100 * spent / max(1, len(calls)), 4),
        "steady": steady, "steady_pct": round(100 * steady / max(1, n), 1),
        "clear_yes": len(clear_yes), "clear_not": len(clear_not), "borderline": len(border),
        "recall_yes": f"{tp}/{len(clear_yes)}", "recall_yes_pct": round(100 * tp / max(1, len(clear_yes)), 1),
        "recall_yes_runs": f"{tp_runs}/{yes_runs_total}",
        "precision_yes_clear": f"{tp}/{tp + fp}" if tp + fp else "n/a",
        "false_yes_on_clear_not": f"{fp}/{len(clear_not)}", "false_yes_pct": round(100 * fp / max(1, len(clear_not)), 1),
        "false_yes_runs": f"{fp_runs}/{not_runs_total}",
        "accuracy_clear": f"{right}/{len(clear)}", "accuracy_clear_pct": round(100 * right / max(1, len(clear)), 1),
        "borderline_called_yes": f"{sum(p['majority'] == 'yes' for p in border)}/{len(border)}",
        "steady_by_label": {l: f"{sum(p['steady'] for p in per if p['label'] == l)}/{sum(1 for p in per if p['label'] == l)}"
                            for l in ("yes", "no", "not_applicable", "borderline")},
        "answers_by_label": {l: dict(Counter(x for p in per if p["label"] == l for x in p["answers"]))
                             for l in ("yes", "no", "not_applicable", "borderline")},
        "per_photo": per,
    }
    out["pass"] = {"steady>=90%": out["steady_pct"] >= 90, "recall_yes>=80%": out["recall_yes_pct"] >= 80,
                   "false_yes<10%": out["false_yes_pct"] < 10}
    (OUT / "analysis.json").write_text(json.dumps(out, indent=1))
    for k, v in out.items():
        if k != "per_photo":
            print(f"{k}: {v}")
    print("\nmisses and unsteady:")
    for p in per:
        wrong = (p["label"] == "yes" and p["majority"] != "yes") or (p["label"] in ("no", "not_applicable") and p["majority"] == "yes")
        if wrong or not p["steady"] or p["label"] == "borderline":
            print(f"  {p['id']:40s} label={p['label']:15s} said={','.join(p['answers'])}{'  MISS' if wrong else ''}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--runs", type=int, default=3)
    ap.add_argument("--only")
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--budget", type=float, default=0.90, help="stop once the spend in raw.json reaches this, $")
    ap.add_argument("--report", action="store_true")
    a = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    if a.report:
        return report()
    key = os.environ.get("GEMINI_API_KEY") or sys.exit("Set GEMINI_API_KEY first.")
    ps, skipped = [], []
    for row in labels():
        (ps if image_for(row["id"]) else skipped).append(row["id"])
    if skipped:
        print(f"skipped (no face-hidden copy): {skipped}")
    if a.only:
        ps = [p for p in ps if p in a.only.split(",")]
    raw_path = OUT / "raw.json"
    results = json.loads(raw_path.read_text()) if raw_path.exists() else []
    spent = sum(cents(r) for r in results) / 100
    done = {(r["photo"], r["run"]) for r in results if r.get("json")}
    results = [r for r in results if r.get("json") or r.get("usage")]
    jobs = [(p, i) for i in range(a.runs) for p in ps if (p, i) not in done]
    print(f"{len(jobs)} calls; spent so far ${spent:.4f}")
    if spent >= a.budget:
        sys.exit(f"budget ${a.budget:.2f} already reached")

    def run(job):
        p, i = job
        img = image_for(p)
        r = call(key, PROMPT, SCHEMA, [img.read_bytes()])
        r.update({"photo": p, "run": i, "image": img.name, "at": time.strftime("%H:%M:%S")})
        return r

    with ThreadPoolExecutor(a.workers) as ex:
        pending = list(jobs)
        while pending:
            batch, pending = pending[:a.workers * 2], pending[a.workers * 2:]
            for r in ex.map(run, batch):
                results.append(r)
                spent += cents(r) / 100
                if r.get("error"):
                    print(f"  {r['photo']} run {r['run']}: {r['error']}")
            raw_path.write_text(json.dumps(results, indent=1))
            print(f"  {len(results)} done · ${spent:.4f}")
            if spent >= a.budget:
                print(f"budget ${a.budget:.2f} reached; stopping"); break
    rs = [r for r in results if r.get("usage")]
    if rs:
        u = [x["usage"] for x in rs]
        print(f"{len(rs)} calls · in {sum(x.get('promptTokenCount', 0) for x in u) / len(u):.0f} · "
              f"out {sum(x.get('candidatesTokenCount', 0) for x in u) / len(u):.0f} · thoughts {sum(x.get('thoughtsTokenCount', 0) for x in u) / len(u):.0f} · "
              f"{sum(cents(x) for x in rs) / len(rs):.4f}¢/call · median {sorted(x['seconds'] for x in rs)[len(rs) // 2]} s")
    print(f"total spent ${spent:.4f}")
    (OUT / "manifest.json").write_text(json.dumps({"model": MODEL, "runs": a.runs, "image": "body close-up (face-hidden)",
                                                   "photos": ps, "skipped": skipped,
                                                   "finished": time.strftime("%Y-%m-%d %H:%M:%S")}, indent=1))


if __name__ == "__main__":
    main()

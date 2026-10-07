"""Re-score saved model readings with the current rubric. No API calls, free.

Because "the AI sees, the code judges", every reading in raw_results.json can be
re-judged after a rubric change. Compares the frozen old rubric to the live one.

  python3 rescore.py results/test1-stock-40
  python3 rescore.py results/test2-mirror-12 --photos ../inputs/mirror-fit-check-1

Writes <results folder>/rescored-<name>/ (--name, default v3): report.md (the full test report under the
new rules) and comparison.md (old vs new score per photo, plus a human estimate when
the photo folder's metadata.csv has one).
"""
import argparse, copy, csv, importlib.util, json, os, statistics
from pathlib import Path

import rubric as live
import run_test

HERE = Path(__file__).parent


def load_rubric(path: Path):
    spec = importlib.util.spec_from_file_location(path.stem, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def rescore(results, rub, styles, default_occasion, fixes):
    out = []
    for x in results:
        y = dict(x)
        ext = x.get("extraction")
        occ = (fixes.get(x["outfit"], {}) or {}).get("occasion") or default_occasion
        y["score"] = rub.score(copy.deepcopy(ext), occasion=occ, styles=styles) if ext else None
        out.append(y)
    return out


def median_by_photo(results):
    by = {}
    for x in results:
        s = x.get("score") or {}
        if s.get("overall") is not None:
            by.setdefault((x["outfit"], x["stage"]), []).append(s["overall"])
    return {k: (statistics.median(v), v) for k, v in by.items()}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("results", help="a results folder containing raw_results.json")
    ap.add_argument("--photos", help="photo folder (for fixes.csv and metadata.csv estimates)")
    ap.add_argument("--old", default=str(HERE / "rubrics" / "rubric_v2.py"), help="frozen rubric to compare against")
    ap.add_argument("--occasion", default="everyday")
    ap.add_argument("--name", default="v3", help="label for the live rubric; output goes to rescored-<name>/ (use a new name per rule change)")
    args = ap.parse_args()

    src = Path(args.results)
    results = json.loads((src / "raw_results.json").read_text())
    photos = Path(args.photos) if args.photos else None
    fixes = run_test.load_fixes(photos / "fixes.csv") if photos and (photos / "fixes.csv").exists() else {}
    estimates = {}
    if photos and (photos / "metadata.csv").exists():
        for row in csv.DictReader((photos / "metadata.csv").open()):
            if row.get("claude_stylist_estimate"):
                estimates[row["folder"]] = float(row["claude_stylist_estimate"])
    styles = live.parse_styles(os.environ.get("TEST_STYLES", "minimalist:0.5,smart_casual:0.5"))

    old_rub = load_rubric(Path(args.old))
    old_name, new_name = Path(args.old).stem.replace("rubric_", ""), args.name
    old = median_by_photo(rescore(results, old_rub, styles, args.occasion, fixes))
    new_results = rescore(results, live, styles, args.occasion, fixes)
    new = median_by_photo(new_results)

    out_dir = src / f"rescored-{new_name}"
    out_dir.mkdir(exist_ok=True)
    run_test.analyze(new_results, fixes, out_dir)   # full report under the new rules
    (out_dir / "raw_results.json").write_text(json.dumps(new_results, indent=1, default=str))

    credits = {}
    for x in new_results:
        s = x.get("score") or {}
        credits.setdefault((x["outfit"], x["stage"]), []).append(s)
    lines = [f"# Re-score: {old_name} → {new_name} ({src.name})", "",
             "Same saved model readings, judged by both rulebooks. No API calls.", "",
             "| Photo | Stage | " + old_name + " | " + new_name + " | " + new_name + " runs | Human estimate | Credits (most common) | Mistakes (most common) |",
             "|---|---|---|---|---|---|---|---|"]
    gaps_old, gaps_new = [], []
    for key in sorted(set(old) | set(new)):
        o = old.get(key, (None, []))[0]
        n, runs = new.get(key, (None, []))
        est = estimates.get(key[0]) if key[1] == "before" else None
        if est is not None and o is not None and n is not None:
            gaps_old.append(o - est); gaps_new.append(n - est)
        ss = credits.get(key, [])
        def common(field):
            seen = {}
            for s in ss:
                for c in s.get(field, []):
                    seen[c] = seen.get(c, 0) + 1
            return ", ".join(c for c, k in seen.items() if k * 2 > len(ss)) or "—"
        lines.append(f"| {key[0]} | {key[1]} | {o} | **{n}** | {runs} | {est if est is not None else ''} | {common('credits')} | {common('rules_fired')} |")
    all_old = [v[0] for v in old.values()]; all_new = [v[0] for v in new.values()]
    lines += ["", f"- Score range: {old_name} {min(all_old)}–{max(all_old)} → {new_name} {min(all_new)}–{max(all_new)}"]
    if gaps_new:
        mae = lambda g: sum(abs(x) for x in g) / len(g)
        lines += [f"- Average gap to the human estimate: {old_name} {statistics.mean(gaps_old):+.2f} (off by {mae(gaps_old):.2f}) → "
                  f"{new_name} {statistics.mean(gaps_new):+.2f} (off by {mae(gaps_new):.2f})"]
    lines += [f"- Full report under {new_name} (consistency, fix detection): `{out_dir.name}/report.md`"]
    (out_dir / "comparison.md").write_text("\n".join(lines) + "\n")
    print("\n".join(lines))


if __name__ == "__main__":
    main()

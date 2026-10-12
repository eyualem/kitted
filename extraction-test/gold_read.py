#!/usr/bin/env python3
"""Gold set, step 1 (DECISIONS-LOG #224): read every gold-set photo with the app's live config and score it.

Photos: the founder's screenshots in inputs/ig (Instagram), inputs/pinterest, inputs/reddit (git-ignored; public
strangers, internal only). Rule 7: every photo is "profile unknown"; scored with one stated test profile
(parts2_test.PROFILE / BOLD, the same as every paper test since Oct 10) at Everyday.

Config = the app's (zoom_test arm B): gemini-3.8-flash, thinking off, temperature 0, prompt.txt + the close-up line,
the face-hidden 1024 px full frame plus the upper/lower close-ups from the app's own Swift prep (kmeasure zoom).
Photo prep refuses what the app refuses (two people, a face it can't hide).

  /usr/bin/python3 gold_read.py --prep-only                 (manifest + face-hidden copies, no calls)
  GEMINI_API_KEY=... /usr/bin/python3 gold_read.py --runs 3 (the readings; resumable)
  /usr/bin/python3 gold_read.py --report                    (scores + steadiness, no calls)
"""
import argparse, json, os, sys, time
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE / "rubrics"))
import zoom_test as Z  # noqa: E402  (prepare, images_for, call, prompt_for, ZOOM_LINE*: the arm-B path)
import parts_proto as P  # noqa: E402
import parts2_test as Q  # noqa: E402

DATA = Path("/Users/eyu/Desktop/files/Kitted/inputs")
OUT = HERE / "results" / "gold1"
SOURCES = (("ig", "ig"), ("pin", "pinterest"), ("rd", "reddit"))
# ig #117 (Screenshot 2:04:53 PM) is a second screenshot of ig #96: counted once.
DUPLICATES = {"Screenshot 2026-10-12 at 2.04.53 PM.png"}


def manifest():
    rows = []
    for prefix, folder in SOURCES:
        files = sorted(p for p in (DATA / folder).iterdir() if p.suffix.lower() in (".png", ".jpg", ".jpeg"))
        for i, f in enumerate(files, 1):
            if f.name in DUPLICATES:
                continue
            rows.append({"id": f"{prefix}-{i:03d}", "source": folder, "file": f.name, "path": str(f)})
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--runs", type=int, default=3)
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--prep-only", action="store_true")
    ap.add_argument("--report", action="store_true")
    a = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    rows = manifest()
    (OUT / "manifest.json").write_text(json.dumps(rows, indent=1))
    if a.report:
        return report(rows)
    ready = Z.prepare([(r["id"], Path(r["path"])) for r in rows], OUT / "images")
    (OUT / "ready.json").write_text(json.dumps(sorted(ready), indent=1))
    print(f"{len(ready)} of {len(rows)} photos prepared")
    if a.prep_only:
        return
    key = os.environ.get("GEMINI_API_KEY") or sys.exit("Set GEMINI_API_KEY first.")
    raw = OUT / "raw.json"
    results = [r for r in (json.loads(raw.read_text()) if raw.exists() else []) if r.get("json")]
    done = {(r["photo"], r["run"]) for r in results}
    jobs = [(pid, i) for i in range(a.runs) for pid in sorted(ready) if (pid, i) not in done]
    print(f"{len(jobs)} calls")

    def run(job):
        pid, i = job
        imgs = Z.images_for(pid, True, OUT / "images")
        line = {1: "", 2: "\n" + Z.ZOOM_LINE_BODY, 3: "\n" + Z.ZOOM_LINE}[len(imgs)]
        r = Z.call(key, Z.prompt_for(False) + line, imgs)
        r.update({"photo": pid, "run": i, "images": len(imgs)})
        return r

    with ThreadPoolExecutor(a.workers) as ex:
        for n, r in enumerate(ex.map(run, jobs), 1):
            results.append(r)
            if r.get("error"):
                print(f"  {r['photo']} run {r['run']}: {str(r['error'])[:120]}")
            if n % 20 == 0 or n == len(jobs):
                raw.write_text(json.dumps(results, indent=1))
                print(f"  {n}/{len(jobs)}")
    raw.write_text(json.dumps(results, indent=1))
    (OUT / "run.json").write_text(json.dumps({"model": Z.MODEL, "runs": a.runs, "finished": time.strftime("%Y-%m-%d %H:%M:%S")}, indent=1))
    report(rows)


def score_of(reading):
    s = P.score_parts(reading, "everyday", Q.PROFILE, None, Q.BOLD, engine="v7")
    return s


def report(rows):
    raw = json.loads((OUT / "raw.json").read_text())
    by = {}
    cost = 0.0
    for r in raw:
        u = r.get("usage") or {}
        cost += u.get("promptTokenCount", 0) * Z.PRICE_IN + u.get("candidatesTokenCount", 0) * Z.PRICE_OUT
        if r.get("json"):
            by.setdefault(r["photo"], []).append(r)
    out, lines = {}, []
    for pid, rs in sorted(by.items()):
        scores = []
        for r in sorted(rs, key=lambda r: r["run"]):
            try:
                s = score_of(r["json"])
                scores.append({"run": r["run"], "score": s.get("overall"), "partial": s.get("partial"), "styles": s.get("detected_styles"),
                               "parts": {k: (v or {}).get("display") for k, v in (s.get("parts") or {}).items()}})
            except Exception as e:  # a reading the engine can't score (traditional clothing, no person, …)
                scores.append({"run": r["run"], "error": repr(e)[:200]})
        out[pid] = scores
    (OUT / "scores.json").write_text(json.dumps(out, indent=1))
    vals = {p: [s["score"] for s in v if isinstance(s.get("score"), (int, float))] for p, v in out.items()}
    steady = sum(1 for v in vals.values() if v and max(v) - min(v) <= 0.5)
    exact = sum(1 for v in vals.values() if v and max(v) == min(v))
    first = [v[0] for v in vals.values() if v]
    lines.append(f"photos read {len(by)} of {len(rows)} · cost ${cost:.2f}")
    lines.append(f"steady within 0.5: {steady}/{len(vals)} · identical: {exact}/{len(vals)}")
    lines.append("score spread (run 0): " + " · ".join(f"{k}: {v}" for k, v in sorted(Counter(first).items())))
    for src in ("ig", "pin", "rd"):
        f = [vals[p][0] for p in vals if p.startswith(src) and vals[p]]
        if f:
            lines.append(f"  {src}: n {len(f)} · mean {sum(f) / len(f):.2f} · 8+ {sum(x >= 8 for x in f)} · ≤6 {sum(x <= 6 for x in f)}")
    txt = "\n".join(lines)
    (OUT / "report.txt").write_text(txt + "\n")
    print(txt)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Second-look test (look1): narrow Gemini calls on ONE close-up each, separate from the scoring call.

Arms (gemini-3.8-flash, thinking off, temperature 0, same call() as b1_test.py):
  U   prompt_look_u.txt  + schema_look_u.json   on the upper close-up (body crop when there's no split)
  US  prompt_look_us.txt + schema_look_us.json  same, plus the outer piece's shoulder seam
  L   prompt_look_l.txt  + schema_look_l.json   on the lower close-up (body crop when there's no split)
Photos: the 50 of batch 1 (results/b1/raw.json), images from results/b1/images (made with the #188 fix).

  export GEMINI_API_KEY=...       (never printed or written)
  /usr/bin/python3 look_test.py --runs 1 --only phone-d1967f,stock-s04 --budget 0.05     (pilot)
  /usr/bin/python3 look_test.py --runs 3 --budget 1.00
"""
import argparse, json, os, sys, time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from b1_test import call, cents

HERE = Path(__file__).resolve().parent
IMG = HERE / "results" / "b1" / "images"
OUT = HERE / "results" / "look1"
ARMS = {a: ((HERE / f"prompt_look_{a.lower()}.txt").read_text(), json.loads((HERE / f"schema_look_{a.lower()}.json").read_text()))
        for a in ("U", "US", "L")}
PART = {"U": "upper", "US": "upper", "L": "lower"}


def image_for(pid, arm):
    p = IMG / f"{pid}.{PART[arm]}.jpg"
    if not p.exists():
        p = IMG / f"{pid}.body.jpg"
    return p


def photos():
    return sorted({r["photo"] for r in json.loads((HERE / "results" / "b1" / "raw.json").read_text())})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--runs", type=int, default=3)
    ap.add_argument("--arms", default="U,US,L")
    ap.add_argument("--only")
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--budget", type=float, default=1.00, help="stop once the spend in raw.json reaches this, $")
    a = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    key = os.environ.get("GEMINI_API_KEY") or sys.exit("Set GEMINI_API_KEY first.")
    ps = photos()
    if a.only:
        ps = [p for p in ps if any(p.startswith(x) for x in a.only.split(","))]
    raw_path = OUT / "raw.json"
    results = json.loads(raw_path.read_text()) if raw_path.exists() else []
    spent = sum(cents(r) for r in results) / 100
    done = {(r["arm"], r["photo"], r["run"]) for r in results if r.get("json")}
    results = [r for r in results if r.get("json")] + [r for r in results if not r.get("json") and r.get("usage")]
    arms = a.arms.split(",")
    jobs = [(arm, p, i) for i in range(a.runs) for p in ps for arm in arms if (arm, p, i) not in done]
    print(f"{len(jobs)} calls; spent so far ${spent:.3f}")

    def run(job):
        arm, p, i = job
        prompt, schema = ARMS[arm]
        img = image_for(p, arm)
        r = call(key, prompt, schema, [img.read_bytes()])
        r.update({"arm": arm, "photo": p, "run": i, "image": img.name, "at": time.strftime("%H:%M:%S")})
        return r

    with ThreadPoolExecutor(a.workers) as ex:
        pending = list(jobs)
        while pending:
            batch, pending = pending[:a.workers * 2], pending[a.workers * 2:]
            for r in ex.map(run, batch):
                results.append(r)
                spent += cents(r) / 100
                if r.get("error"):
                    print(f"  {r['arm']} {r['photo']} run {r['run']}: {r['error']}")
            raw_path.write_text(json.dumps(results, indent=1))
            print(f"  {len(results)} done · ${spent:.3f}")
            if spent >= a.budget:
                print(f"budget ${a.budget:.2f} reached; stopping"); break
    by = {}
    for r in results:
        if r.get("usage"):
            by.setdefault(r["arm"], []).append(r)
    for arm, rs in by.items():
        u = [x["usage"] for x in rs]
        print(f"{arm}: {len(rs)} calls · in {sum(x.get('promptTokenCount', 0) for x in u) / len(u):.0f} · "
              f"out {sum(x.get('candidatesTokenCount', 0) for x in u) / len(u):.0f} · "
              f"{sum(cents(x) for x in rs) / len(rs):.4f}¢/call · median {sorted(x['seconds'] for x in rs)[len(rs) // 2]} s")
    print(f"total spent ${spent:.3f}")
    (OUT / "manifest.json").write_text(json.dumps({"model": "gemini-3.8-flash", "runs": a.runs, "arms": arms, "photos": ps,
                                                   "finished": time.strftime("%Y-%m-%d %H:%M:%S")}, indent=1))


if __name__ == "__main__":
    main()

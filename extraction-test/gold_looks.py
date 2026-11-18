#!/usr/bin/env python3
"""The app's two second looks (U: does a top show below the outer piece; L: does the hem rest on the shoe) on the gold
set (T68 round 2, Nov 14, 2026; the founder's OK for a small spend, cap $2.00). The main readings stay the stored
Oct 12 ones (results/gold1/raw.json); this only adds what the app's live check has and the stored readings lack.

Same calls the app makes: app/assets/gemini/prompt-look-{u,l}.json and schema-look-{u,l}.json, gemini-3.8-flash,
thinking off, temperature 0 (b1_test.call), on the face-hidden close-ups gold_read.py prepared (upper for U, lower for
L, the body crop where there's no split). Two runs: run i pairs with stored reading i, so steadiness compares two
independent looks.

  export GEMINI_API_KEY=...            (never printed or written; tools/run_key_tests.sh's way of reading the dev key)
  /usr/bin/python3 gold_looks.py --runs 1 --only ig-001,pin-013 --budget 0.02      (pilot)
  /usr/bin/python3 gold_looks.py --runs 2 --budget 1.85

Cost counts thinking tokens at the output price (#465: this model bills ~300 a call with thinking off; b1_test.cents
ignores them). Resumable: done (photo, run, arm) triples are skipped. Stops before the budget, counting every call
already made, earlier sessions' included.
"""
import argparse
import json
import os
import sys
import threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from b1_test import call, PRICE_IN, PRICE_OUT  # noqa: E402

DATA = Path(os.environ.get("KITTED_DATA", HERE.parent))
IMG = DATA / "extraction-test/results/gold1/images"
APP = HERE.parent / "app/assets/gemini"
OUT = HERE / "results" / "gold-looks1"
ARMS = {a: (json.loads((APP / f"prompt-look-{a.lower()}.json").read_text())["prompt"],
            json.loads((APP / f"schema-look-{a.lower()}.json").read_text())) for a in ("U", "L")}
PART = {"U": "upper", "L": "lower"}


def cents(r):
    u = r.get("usage") or {}
    return 100 * (u.get("promptTokenCount", 0) * PRICE_IN
                  + (u.get("candidatesTokenCount", 0) + u.get("thoughtsTokenCount", 0)) * PRICE_OUT)


def image_for(pid, arm):
    p = IMG / f"{pid}.{PART[arm]}.jpg"
    return p if p.exists() else IMG / f"{pid}.body.jpg"


def photos():
    raw = json.loads((DATA / "extraction-test/results/gold1/raw.json").read_text())
    return sorted({x["photo"] for x in raw if x.get("json")})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--runs", type=int, default=2)
    ap.add_argument("--only", default="")
    ap.add_argument("--budget", type=float, required=True, help="dollars, all calls ever made in this folder")
    a = ap.parse_args()
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        print("GEMINI_API_KEY isn't set")
        return 1
    OUT.mkdir(parents=True, exist_ok=True)
    rawf = OUT / "raw.json"
    rows = json.loads(rawf.read_text()) if rawf.exists() else []
    done = {(r["photo"], r["run"], r["arm"]) for r in rows if r.get("json")}
    spent = sum(cents(r) for r in rows) / 100
    ps = [p for p in photos() if not a.only or p in a.only.split(",")]
    jobs = [(p, i, arm) for i in range(a.runs) for p in ps for arm in ("U", "L") if (p, i, arm) not in done]
    missing = [p for p in ps if not image_for(p, "U").exists()]
    print(f"{len(ps)} photos, {len(jobs)} calls to make, ${spent:.4f} spent before this run; no image for {len(missing)}")
    lock = threading.Lock()
    state = {"spent": spent, "stopped": False}
    per_call = 0.0021                                            # the estimate's 0.2 cents, with a little room

    def run(job):
        p, i, arm = job
        with lock:
            if state["spent"] + per_call > a.budget:
                state["stopped"] = True
                return
            state["spent"] += per_call                            # reserve, then settle on the real cost
        img = image_for(p, arm)
        if not img.exists():
            with lock:
                state["spent"] -= per_call
            return
        prompt, schema = ARMS[arm]
        r = call(key, prompt, schema, [img.read_bytes()])
        r.update({"photo": p, "run": i, "arm": arm, "image": img.name})
        with lock:
            state["spent"] += cents(r) / 100 - per_call
            rows.append(r)
            rawf.write_text(json.dumps(rows, indent=1))

    with ThreadPoolExecutor(4) as ex:
        list(ex.map(run, jobs))
    ok = sum(1 for r in rows if r.get("json"))
    err = [r for r in rows if not r.get("json")]
    log = (f"calls stored {len(rows)} ({ok} answered, {len(err)} errors); spent ${state['spent']:.4f} in all "
           f"(thinking tokens counted){'; STOPPED at the budget' if state['stopped'] else ''}")
    print(log)
    with open(OUT / "run.log", "a") as f:
        f.write(log + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())

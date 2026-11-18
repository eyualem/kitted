#!/usr/bin/env python3
"""A narrow rise look (Nov 17, the outline study; DESIGNED, NOT RUN: it waits for the founder's yes on the amount).

Why: the creators' prop.8 and suit.5 (all four agree): a high rise with a tuck, a crop or an open jacket lengthens the
leg line; a low rise under a tuck cuts the outfit in half; mid rise is the safe everyday choice. Rise only matters when
the waistband shows, and nothing in the reading sees it. This asks one garment question (how high the pants are cut,
judged on the fly and the front seam), never the body.

When it runs (the app, like secondLook.ts): only when the main reading's top is tucked (full or half) or, with no
layer, cropped: 28% of the gold set (63 of 225), a gate that holds on 212 of 225 photos across two readings. Same call
as the app's looks (b1_test.call: gemini-3.8-flash, thinking off, temperature 0) on the face-hidden body crop.

  export GEMINI_API_KEY=...       (never printed or written)
  /usr/bin/python3 rise_look.py --runs 1 --pilot --budget 0.03     (the pilot: 5 gated gold photos, 5 calls, ~1c)
  /usr/bin/python3 rise_look.py --runs 2 --budget 0.40             (every gated gold photo twice: 126 calls, ~26-38c)
  add --dry to count the calls with no key and no calls. Budgets are totals over every call stored in results/rise-look1/.

Cost counts thinking tokens at the output price (#465). Resumable; stops before the budget.
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
PROMPT = (HERE / "prompt_look_r.txt").read_text()
SCHEMA = json.loads((HERE / "schema_look_r.json").read_text())
SETS = {"gold": (DATA / "extraction-test/results/gold1/raw.json", DATA / "extraction-test/results/gold1/images"),
        "rated": (HERE / "results/rated1/raw.json", HERE / "results/rated1/images")}
OUT = HERE / "results" / "rise-look1"
PER_CALL = 0.006            # dollars held per call in flight until its real cost is known (the average is 0.0021; this
                            # covers a long-thinking call, so 4 calls in flight overshoot the stop by about 2 cents at most)
SEED = 20261117


def cents(r):
    u = r.get("usage") or {}
    return 100 * (u.get("promptTokenCount", 0) * PRICE_IN
                  + (u.get("candidatesTokenCount", 0) + u.get("thoughtsTokenCount", 0)) * PRICE_OUT)


def gated(j):
    """The waistband can show: a tucked top (full or half), or a cropped top with no layer over it."""
    gs = j.get("garments", [])
    if not any(g.get("category") == "bottom" for g in gs):
        return False
    outer = any(g.get("category") == "outerwear" for g in gs)
    return any(g.get("category") == "top" and (g.get("tucked") in ("full", "half") or (not outer and g.get("length") == "cropped"))
               for g in gs)


def photos(name):
    """Gold photos whose first stored reading passes the gate."""
    raw, _ = SETS[name]
    first = {}
    for r in json.loads(Path(raw).read_text()):
        if isinstance(r.get("json"), dict) and r.get("run") == 0:
            first[r["photo"]] = r["json"]
    return sorted(p for p, j in first.items() if gated(j))


PILOT = 5


def image(name, pid):
    return SETS[name][1] / f"{pid}.body.jpg"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--set", choices=["gold"], default="gold")
    ap.add_argument("--runs", type=int, default=2)
    ap.add_argument("--only", default="")
    ap.add_argument("--pilot", action="store_true", help="the first 5 gated photos (seeded) only")
    ap.add_argument("--dry", action="store_true", help="count the calls and the estimate, no key, no calls")
    ap.add_argument("--budget", type=float, required=True, help="dollars, all calls ever stored here")
    a = ap.parse_args()
    ps = [p for p in photos(a.set) if not a.only or p in a.only.split(",")]
    if a.pilot:
        import random
        ps = sorted(random.Random(SEED).sample(ps, PILOT))
    if a.dry:
        n = sum(1 for p in ps if image(a.set, p).exists()) * a.runs
        print(f"dry: {len(ps)} gated gold photos x {a.runs} runs = {n} calls, about {n * 0.209:.1f}-{n * 0.30:.1f} cents "
              f"(0.209c a call measured on look L and the leg look; the body crop may cost up to ~0.30c)")
        return 0
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        print("GEMINI_API_KEY isn't set")
        return 1
    OUT.mkdir(parents=True, exist_ok=True)
    rawf = OUT / "raw.json"
    rows = json.loads(rawf.read_text()) if rawf.exists() else []
    done = {(r["set"], r["photo"], r["run"]) for r in rows if r.get("json")}
    spent = sum(cents(r) for r in rows) / 100
    jobs = [(p, i) for i in range(a.runs) for p in ps if (a.set, p, i) not in done and image(a.set, p).exists()]
    print(f"{len(ps)} gated photos, {len(jobs)} calls to make, ${spent:.4f} spent before this run")
    lock = threading.Lock()
    state = {"spent": spent, "stopped": False}

    def run(job):
        p, i = job
        with lock:
            if state["spent"] + PER_CALL > a.budget:
                state["stopped"] = True
                return
            state["spent"] += PER_CALL
        img = image(a.set, p)
        r = call(key, PROMPT, SCHEMA, [img.read_bytes()])
        r.update({"set": a.set, "photo": p, "run": i, "image": img.name})
        with lock:
            state["spent"] += cents(r) / 100 - PER_CALL
            rows.append(r)
            rawf.write_text(json.dumps(rows, indent=1))

    with ThreadPoolExecutor(4) as ex:
        list(ex.map(run, jobs))
    ok = sum(1 for r in rows if r.get("json"))
    log = (f"calls stored {len(rows)} ({ok} answered); spent ${state['spent']:.4f} in all (thinking tokens counted)"
           f"{'; STOPPED at the budget' if state['stopped'] else ''}")
    print(log)
    with open(OUT / "run.log", "a") as f:
        f.write(log + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())

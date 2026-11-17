#!/usr/bin/env python3
"""A narrow leg-width second look (T68 round 5, Nov 17; DESIGNED, NOT RUN: it needs the founder's OK on the amount).

Why: steadiness (B6) fails because the scoring call's leg_shape flips straight <-> relaxed/wide between two readings
of the same photo (8 of the 11 flips left after the free fixes). Look L's covers_shoe is 97% steady because it asks
what can be seen, not a category; this asks the same way: does the fabric touch the leg at the knee, and is the
opening wider than the shoe. Map: hangs_away or wider -> full leg (wide); clings and narrower -> narrow (slim or
skinny); otherwise straight. It would replace leg_shape for the taste rules and the silhouette lift only.

Same call as the app's looks (b1_test.call: gemini-3.8-flash, thinking off, temperature 0) on the face-hidden lower
close-up (the body crop where there's no split), only when the reading's bottom is trousers, jeans, chinos, cargos,
joggers (never shorts: their fit already reads well from volume).

  export GEMINI_API_KEY=...       (never printed or written)
  /usr/bin/python3 leg_look.py --set gold --runs 2 --only ig-051,pin-040 --budget 0.02     (pilot, 4 calls)
  /usr/bin/python3 leg_look.py --set gold --stage 1 --runs 2 --budget 0.30                 (stage 1, ~25c)
  /usr/bin/python3 leg_look.py --set gold --stage 2 --runs 2 --budget 0.95                 (stage 2a, only if 1 passes)
  /usr/bin/python3 leg_look.py --set rated --runs 1 --budget 1.10                          (stage 2b)
  add --dry to any of them to count the calls with no key and no calls. Budgets are totals over every call stored in
  results/leg-look1/, so each stop includes the stages before it.

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
PROMPT = (HERE / "prompt_look_w.txt").read_text()
SCHEMA = json.loads((HERE / "schema_look_w.json").read_text())
PANTS = {"jeans", "trousers", "chinos", "cargos", "suit_trousers", "drawstring_trousers", "joggers", "sweatpants",
         "track_pants"}
SETS = {"gold": (DATA / "extraction-test/results/gold1/raw.json", DATA / "extraction-test/results/gold1/images"),
        "rated": (HERE / "results/rated1/raw.json", HERE / "results/rated1/images")}
OUT = HERE / "results" / "leg-look1"
PER_CALL = 0.006            # dollars held per call in flight until its real cost is known (the average is 0.0021; this
                            # covers a long-thinking call, so 4 calls in flight overshoot the stop by about 2 cents at most)
SEED = 20261117


def cents(r):
    u = r.get("usage") or {}
    return 100 * (u.get("promptTokenCount", 0) * PRICE_IN
                  + (u.get("candidatesTokenCount", 0) + u.get("thoughtsTokenCount", 0)) * PRICE_OUT)


def photos(name):
    raw, _ = SETS[name]
    out = set()
    for r in json.loads(Path(raw).read_text()):
        j = r.get("json")
        if not isinstance(j, dict) or (name == "rated" and r.get("kind") != "read"):
            continue
        b = next((g for g in j.get("garments", []) if g.get("category") == "bottom"), None)
        if b and b.get("subcategory") in PANTS:
            out.add(r["photo"])
    return sorted(out)


def leg_flips():
    """Gold photos in pants whose two stored readings disagree on leg_shape (31 of 200)."""
    d = {}
    for r in json.loads(SETS["gold"][0].read_text()):
        j = r.get("json")
        if isinstance(j, dict):
            b = next((g for g in j.get("garments", []) if g.get("category") == "bottom"), {})
            d.setdefault(r["photo"], set()).add(b.get("leg_shape"))
    return sorted(p for p in photos("gold") if len(d.get(p, ())) > 1)


def stage(n):
    """Stage 1: every leg-flip photo plus steady ones at random (seeded) up to 60. Stage 2: the rest of the gold set."""
    import random
    allp = photos("gold")
    flips = leg_flips()
    rest = [p for p in allp if p not in flips]
    one = sorted(flips + random.Random(SEED).sample(rest, max(0, 60 - len(flips))))
    return one if n == 1 else [p for p in allp if p not in one]


def image(name, pid):
    img = SETS[name][1]
    p = img / f"{pid}.lower.jpg"
    return p if p.exists() else img / f"{pid}.body.jpg"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--set", choices=list(SETS), required=True)
    ap.add_argument("--runs", type=int, default=2)
    ap.add_argument("--only", default="")
    ap.add_argument("--stage", type=int, choices=(1, 2), help="gold only: 1 = the 31 leg-flip photos + 29 steady, 2 = the rest")
    ap.add_argument("--dry", action="store_true", help="count the calls and the estimate, no key, no calls")
    ap.add_argument("--budget", type=float, required=True, help="dollars, all calls ever stored here")
    a = ap.parse_args()
    ps = [p for p in photos(a.set) if not a.only or p in a.only.split(",")]
    if a.stage:
        ps = [p for p in stage(a.stage) if p in ps]
    if a.dry:
        n = sum(1 for p in ps if image(a.set, p).exists()) * a.runs
        print(f"dry: {a.set}{' stage ' + str(a.stage) if a.stage else ''}: {len(ps)} photos x {a.runs} runs = {n} calls, "
              f"about {n * 0.209:.1f} cents at look L's measured 0.209c a call (thinking counted)")
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
    print(f"{len(ps)} photos in pants, {len(jobs)} calls to make, ${spent:.4f} spent before this run")
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

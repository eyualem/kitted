#!/usr/bin/env python3
"""Read the 96 photos he rated blind that have never been read (T68, Nov 16; the founder's "Yes, spend it" for about
$1.08, stop at $1.25): sheet 2's 76 and the 20 new ones on his combined sheet (inputs/gold-judge/founder4/). One run.

Same calls the app makes, as gold_read.py and gold_looks.py: the scoring call (gemini-3.8-flash, thinking off,
temperature 0, prompt.txt + the close-up line, the full frame plus the upper/lower close-ups) and the two second looks
(U on the upper close-up, L on the lower; the body crop where there's no split). The originals were deleted after face
hiding, so the source is his sheet's face-hidden copy; the app's own prep (kmeasure zoom) runs on it again and makes the
close-ups. A photo the prep refuses (no head found, two people) is skipped, never sent.

  /usr/bin/python3 rated_read.py --prep-only                 (no calls, $0)
  export GEMINI_API_KEY=...                                    (never printed or written)
  /usr/bin/python3 rated_read.py --budget 1.25 [--only C001,C006]

Cost counts thinking tokens at the output price (#465). Resumable; stops before the budget, counting every call
already stored. Output: results/rated1/raw.json (answers and token counts only; images stay git-ignored).
"""
import argparse
import csv
import json
import os
import subprocess
import sys
import threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import zoom_test as Z  # noqa: E402  (the scoring call: prompt, schema, images_for, call)
import b1_test  # noqa: E402  (the look calls, as gold_looks.py)

DATA = Path(os.environ.get("KITTED_DATA", HERE.parent))
F4 = DATA / "inputs/gold-judge/founder4"
TOOL = DATA / "extraction-test/vision/bin/kmeasure"          # built in the main checkout (git-ignored binary)
OUT = HERE / "results" / "rated1"
IMG = OUT / "images"
APP = HERE.parent / "app/assets/gemini"
LOOK = {a: (json.loads((APP / f"prompt-look-{a.lower()}.json").read_text())["prompt"],
            json.loads((APP / f"schema-look-{a.lower()}.json").read_text())) for a in ("U", "L")}
PART = {"U": "upper", "L": "lower"}
RESERVE = {"read": 0.009, "U": 0.0021, "L": 0.0021}           # dollars a call, held until the real cost is known


def cents(r):
    u = r.get("usage") or {}
    return 100 * (u.get("promptTokenCount", 0) * Z.PRICE_IN
                  + (u.get("candidatesTokenCount", 0) + u.get("thoughtsTokenCount", 0)) * Z.PRICE_OUT)


def unread():
    key = {r["id"]: r for r in csv.DictReader(open(F4 / ".mapping/mapping.csv"))}
    rated = [r["id"] for r in csv.DictReader(open(F4 / "ratings.csv"))]
    return sorted(c for c in rated if key[c]["from_sheet"] != "sheet1")


def prep(ids):
    IMG.mkdir(parents=True, exist_ok=True)
    ready, refused = [], {}
    for c in ids:
        if not (IMG / f"{c}.json").exists():
            subprocess.run([str(TOOL), "zoom", str(F4 / "photos" / f"{c}.jpg"), str(IMG), c], check=True, capture_output=True)
        meta = json.loads((IMG / f"{c}.json").read_text())
        if meta.get("status") != "ok":
            refused[c] = meta.get("status")
            continue
        ready.append(c)
    return ready, refused


def look_image(c, arm):
    p = IMG / f"{c}.{PART[arm]}.jpg"
    return p if p.exists() else IMG / f"{c}.body.jpg"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--prep-only", action="store_true")
    ap.add_argument("--budget", type=float, help="dollars, all calls ever stored here")
    ap.add_argument("--only", default="")
    a = ap.parse_args()
    ids = [c for c in unread() if not a.only or c in a.only.split(",")]
    ready, refused = prep(ids)
    print(f"{len(ids)} unread rated photos; prep ready {len(ready)}, refused {len(refused)}: "
          + ", ".join(f"{c} ({s})" for c, s in sorted(refused.items())))
    if a.prep_only:
        return 0
    if a.budget is None:
        print("--budget is required for calls")
        return 1
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        print("GEMINI_API_KEY isn't set")
        return 1
    rawf = OUT / "raw.json"
    rows = json.loads(rawf.read_text()) if rawf.exists() else []
    done = {(r["photo"], r["kind"]) for r in rows if r.get("json")}
    spent = sum(cents(r) for r in rows) / 100
    jobs = [(c, k) for c in ready for k in ("read", "U", "L") if (c, k) not in done]
    print(f"{len(jobs)} calls to make, ${spent:.4f} spent before this run")
    lock = threading.Lock()
    state = {"spent": spent, "stopped": False}

    def run(job):
        c, k = job
        with lock:
            if state["spent"] + RESERVE[k] > a.budget:
                state["stopped"] = True
                return
            state["spent"] += RESERVE[k]
        if k == "read":
            imgs = Z.images_for(c, True, IMG)
            line = {1: "", 2: "\n" + Z.ZOOM_LINE_BODY, 3: "\n" + Z.ZOOM_LINE}[len(imgs)]
            r = Z.call(key, Z.prompt_for(False) + line, imgs)
            r["images"] = len(imgs)
        else:
            prompt, schema = LOOK[k]
            img = look_image(c, k)
            r = b1_test.call(key, prompt, schema, [img.read_bytes()])
            r["image"] = img.name
        r.update({"photo": c, "kind": k})
        with lock:
            state["spent"] += cents(r) / 100 - RESERVE[k]
            rows.append(r)
            rawf.write_text(json.dumps(rows, indent=1))

    with ThreadPoolExecutor(4) as ex:
        list(ex.map(run, jobs))
    ok = sum(1 for r in rows if r.get("json"))
    log = (f"calls stored {len(rows)} ({ok} answered, {len(rows) - ok} errors); spent ${state['spent']:.4f} in all "
           f"(thinking tokens counted){'; STOPPED at the budget' if state['stopped'] else ''}")
    print(log)
    with open(OUT / "run.log", "a") as f:
        f.write(log + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())

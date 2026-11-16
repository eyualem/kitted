#!/usr/bin/env python3
"""T98 paid round (Nov 16): two narrow second looks for the reads the $0 round left short. Costed in tasks/T98/COST.md
(~56 cents, hard stop 70 cents). The founder's yes was given in the coordinating session; that session runs this.

  shorts   the October narrow look, unchanged (prompt_shorts1.txt + schema_shorts1.json, #332), on the face-hidden
           lower close-up of his 25 rated shorts photos: above the knee vs at or below.
  longtop  a new presence question (prompt_longtop2.txt + schema_longtop2.json): "between the top's bottom edge and
           the crotch, can you see the pants?", on a crop the code cuts from the face-hidden full copy with the prep's
           stored joints (shoulder -> knee t 0.30 to 1.05: belly button to just past the knees). Photos: the 62 long-top photos
           (longtop_labels.csv) + his founder4 photos the reading calls untucked with no jacket.

Model and settings as every narrow look (b1_test.call): gemini-3.8-flash, thinking off, temperature 0, one image.
Truth: proportions_labels.csv (Claude's eye, committed b3363f2a before any call) and longtop_labels.csv (Nov 14).
Every photo is "profile unknown". Only face-hidden copies are sent.

  /usr/bin/python3 extraction-test/proportions_looks.py --prepare                 (no calls, no key: builds the crops)
  export GEMINI_API_KEY=...                                                       (read from the environment only)
  /usr/bin/python3 extraction-test/proportions_looks.py --pilot --budget 0.70     (5 calls)
  /usr/bin/python3 extraction-test/proportions_looks.py --runs 2 --budget 0.70    (the rest; resumes, skips done calls)
  /usr/bin/python3 extraction-test/proportions_looks.py --report                  (no calls)

The stop counts real token usage, thinking tokens included, plus the worst case of every call in flight, across every
call already in raw.json (the pilot included). Re-running continues where it stopped.
"""
import argparse, csv, json, os, subprocess, sys, threading
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from b1_test import call, cents as cents_no_thoughts, MODEL, PRICE_IN, PRICE_OUT  # noqa: E402
import proportions_test as PT  # noqa: E402

OUT = HERE / "results" / "proportions-looks1"
IMG = OUT / "images"  # git-ignored (*.jpg under results/)
RAW = OUT / "raw.json"
MANIFEST = OUT / "manifest.json"
DATA = Path("/Users/eyu/Desktop/files/Kitted")
GOLD_DIRS = [DATA / "extraction-test/results" / s / "images" for s in ("gold1", "b1", "creators1")]
RATED_DIR = DATA / ".claude/worktrees/rescoring-v16-58d34b/extraction-test/results/rated1/images"
ARMS = {
    "shorts": ((HERE / "prompt_shorts1.txt").read_text(), json.loads((HERE / "schema_shorts1.json").read_text())),
    "longtop": ((HERE / "prompt_longtop2.txt").read_text(), json.loads((HERE / "schema_longtop2.json").read_text())),
}
WORST = 100 * (1600 * PRICE_IN + 700 * PRICE_OUT)  # cents: a call's worst case (in + out + thinking), for the stop
PILOT = (("longtop", 3), ("shorts", 2))
LOCK = threading.Lock()


def cents(r):
    """b1_test.cents plus thinking tokens, which this model bills as output even with thinking off (#465)."""
    u = r.get("usage") or {}
    return cents_no_thoughts(r) + 100 * u.get("thoughtsTokenCount", 0) * PRICE_OUT


# ---------------------------------------------------------------- preparing the images (no calls)

def c_to_gold():
    g2p = {m["gid"]: m["photo"] for m in json.load(open(DATA / "inputs/gold-judge/manifest.json"))}
    key = {r["id"]: r for r in csv.DictReader(open(PT.F4 / ".mapping/mapping.csv"))}
    return {c: g2p[k["gold_id"]] for c, k in key.items() if k["gold_id"] in g2p}


def prep_files(pid, c2g):
    """(directory, stem) of the prep's face-hidden copies for a C-id or a gold/creator photo id."""
    for d, stem in [(RATED_DIR, pid)] + [(d, c2g.get(pid, pid)) for d in GOLD_DIRS]:
        if (d / f"{stem}.json").exists() and (d / f"{stem}.full.jpg").exists():
            return d, stem
    return None, None


def size(path):
    out = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(path)], capture_output=True, text=True).stdout
    vals = [int(line.split()[-1]) for line in out.splitlines() if "pixel" in line]
    return vals[0], vals[1]


def crop_hip_thigh(d, stem, dest):
    meta = json.loads((d / f"{stem}.json").read_text())
    full = d / f"{stem}.full.jpg"
    w, h = size(full)
    s = w / meta["width"]
    j = {k: (v[0] * s, v[1] * s) for k, v in (meta.get("joints") or {}).items()}
    sh = [j[k] for k in ("lShoulder", "rShoulder") if k in j]
    kn = [j[k] for k in ("lKnee", "rKnee") if k in j]
    hp = [j[k] for k in ("lHip", "rHip") if k in j]
    if not sh or not (kn or hp):
        return "no shoulders, or neither knees nor hips"
    sy = sum(p[1] for p in sh) / len(sh)
    ky = sum(p[1] for p in kn) / len(kn) if kn else sy + (sum(p[1] for p in hp) / len(hp) - sy) / 0.562
    if ky - sy < 40:
        return "torso too short to crop"
    y0, y1 = int(max(0, sy + 0.30 * (ky - sy))), int(min(h, sy + 1.05 * (ky - sy)))
    xs = [p[0] for p in sh + hp + kn]
    span = max(xs) - min(xs)
    x0, x1 = int(max(0, min(xs) - 0.6 * span)), int(min(w, max(xs) + 0.6 * span))
    if y1 - y0 < 60 or x1 - x0 < 60:
        return "crop too small"
    subprocess.run(["sips", "-c", str(y1 - y0), str(x1 - x0), "--cropOffset", str(y0), str(x0), str(full),
                    "--out", str(dest)], capture_output=True, check=True)
    return None


def prepare():
    lab, lt = PT.labels()
    reads = PT.readings()
    c2g = c_to_gold()
    (IMG / "shorts").mkdir(parents=True, exist_ok=True)
    (IMG / "longtop").mkdir(parents=True, exist_ok=True)
    man = {"shorts": {}, "longtop": {}, "skipped": {}}
    for c, r in lab.items():
        if r["bottom"] != "s":
            continue
        d, stem = prep_files(c, c2g)
        src = next((d / f"{stem}.{p}.jpg" for p in ("lower", "body") if d and (d / f"{stem}.{p}.jpg").exists()), None)
        if not src:
            man["skipped"][f"shorts:{c}"] = "no face-hidden close-up (the prep found no head)"
            continue
        dest = IMG / "shorts" / f"{c}.jpg"
        subprocess.run(["cp", str(src), str(dest)], check=True)
        man["shorts"][c] = {"truth": r["shorts_length"], "source": str(src)}
    longs = {p: r["label"] for p, r in lt.items() if r["label"] in ("yes", "no", "borderline")}  # not_applicable: no truth
    gold_in_lt = set(longs)
    for c, r in lab.items():
        f = PT.rf(reads[c][0]) if reads.get(c) else None
        if not f or f["outer"] or f["tucked"] or f["length"] == "na" or r["top_long"] not in "ynb":
            continue
        if c2g.get(c) in gold_in_lt:
            continue  # the same photo is already in the long-top set under its gold id
        longs[c] = {"y": "yes", "n": "no", "b": "borderline"}[r["top_long"]]
    for p, truth in longs.items():
        d, stem = prep_files(p, c2g)
        if not d:
            man["skipped"][f"longtop:{p}"] = "no face-hidden copy with joints"
            continue
        why = crop_hip_thigh(d, stem, IMG / "longtop" / f"{p}.jpg")
        if why:
            man["skipped"][f"longtop:{p}"] = why
            continue
        man["longtop"][p] = {"truth": truth, "source": str(d / f"{stem}.full.jpg")}
    MANIFEST.write_text(json.dumps(man, indent=1))
    n = len(man["shorts"]) + len(man["longtop"])
    print(f"shorts {len(man['shorts'])}, longtop {len(man['longtop'])} "
          f"(truth {dict(Counter(v['truth'] for v in man['longtop'].values()))}), skipped {len(man['skipped'])}")
    print(f"calls for 2 runs: {2 * n}; at 0.22 cents each about {2 * n * 0.22:.0f} cents")


# ---------------------------------------------------------------- calls

def load_raw():
    return json.loads(RAW.read_text()) if RAW.exists() else []


def save_raw(raw):
    tmp = RAW.with_suffix(".tmp")
    tmp.write_text(json.dumps(raw, indent=1))
    tmp.replace(RAW)


def run(jobs, budget_dollars, workers):
    key = os.environ.get("GEMINI_API_KEY") or sys.exit("Set GEMINI_API_KEY first (it is never printed or written).")
    raw = load_raw()
    done = {(r["arm"], r["photo"], r["run"]) for r in raw if r.get("json")}
    jobs = [j for j in jobs if j not in done]
    cap = 100 * budget_dollars
    state = {"spent": sum(cents(r) for r in raw), "inflight": 0, "stopped": False}
    print(f"{len(jobs)} calls to make; already spent {state['spent'] / 100:.4f} dollars; stop at {budget_dollars:.2f}")

    def one(job):
        arm, pid, rn = job
        with LOCK:
            if state["stopped"] or state["spent"] + (state["inflight"] + 1) * WORST > cap:
                state["stopped"] = True
                return
            state["inflight"] += 1
        prompt, schema = ARMS[arm]
        r = call(key, prompt, schema, [(IMG / arm / f"{pid}.jpg").read_bytes()])
        r.update(arm=arm, photo=pid, run=rn, model=MODEL)
        with LOCK:
            state["inflight"] -= 1
            state["spent"] += cents(r)
            raw.append(r)
            save_raw(raw)
            n = len(raw)
            if n % 10 == 0 or r.get("error"):
                print(f"  {n} stored · {state['spent'] / 100:.4f} dollars" + (f" · {r['error'][:80]}" if r.get("error") else ""))

    with ThreadPoolExecutor(workers) as ex:
        list(ex.map(one, jobs))
    calls = [r for r in raw if r.get("usage")]
    u = lambda k: sum((r["usage"].get(k, 0) for r in calls)) / max(1, len(calls))  # noqa: E731
    print(f"{len(calls)} calls stored · in {u('promptTokenCount'):.0f} · out {u('candidatesTokenCount'):.0f} · "
          f"thoughts {u('thoughtsTokenCount'):.0f} · {state['spent'] / max(1, len(calls)):.4f} cents a call")
    print(f"total spent {state['spent'] / 100:.4f} dollars" + ("  STOPPED at the budget" if state["stopped"] else ""))


# ---------------------------------------------------------------- report (no calls)

def report():
    man = json.loads(MANIFEST.read_text())
    ans = defaultdict(dict)
    for r in load_raw():
        if r.get("json"):
            ans[(r["arm"], r["photo"])][r["run"]] = r["json"]
    spent = sum(cents(r) for r in load_raw())
    print(f"# T98 paid round: results (spent {spent / 100:.4f} dollars of the 0.70 stop)\n")

    print("## Shorts length (bar: 90% right on above vs at-or-below, 90% steady)\n")
    right = n = steady = n2 = cant = 0
    rows = []
    for c, m in sorted(man["shorts"].items()):
        a = ans.get(("shorts", c), {})
        vals = [a[k]["shorts_end"] for k in sorted(a)]
        rows.append(f"- {c}: label {m['truth']} -> {' / '.join(vals) or 'no answer'}")
        two = [v == "above_knee" for v in vals if v in ("above_knee", "at_knee", "below_knee")]
        cant += sum(v not in ("above_knee", "at_knee", "below_knee") for v in vals)
        for t in two:
            n += 1
            right += t == (m["truth"] == "above")
        if len(two) == 2:
            n2 += 1
            steady += two[0] == two[1]
    print(f"right {right}/{n}; steady {steady}/{n2}; cant_see or not_shorts {cant}")
    print("\n".join(rows))

    print("\n## Long top (bar: catch 7 of 9 clear long tops, false yes under 5%, steady 90% where it fires)\n")
    tab, rows = Counter(), []
    fires = flips = 0
    for p, m in sorted(man["longtop"].items()):
        a = ans.get(("longtop", p), {})
        vals = [a[k]["pants_above_crotch"] for k in sorted(a)]
        if not vals:
            continue
        rows.append(f"- {p}: label {m['truth']} -> {' / '.join(vals)}")
        f = [v == "top_covers" for v in vals if v != "cant_see"]
        if not f:
            tab[(m["truth"], "cant_see")] += 1
            continue
        tab[(m["truth"], f[0])] += 1
        if any(f) and len(f) == 2:
            fires += 1
            flips += f[0] != f[1]
    yes = (tab[("yes", True)], tab[("yes", True)] + tab[("yes", False)])
    no = (tab[("no", True)], tab[("no", True)] + tab[("no", False)])
    print(f"clear long caught {yes[0]}/{yes[1]} (cant_see {tab[('yes', 'cant_see')]}); "
          f"borderline fired {tab[('borderline', True)]}/{tab[('borderline', True)] + tab[('borderline', False)]}; "
          f"false yes {no[0]}/{no[1]} (cant_see {tab[('no', 'cant_see')]}); flips where it fires {flips}/{fires}")
    print("\n".join(rows))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--prepare", action="store_true")
    ap.add_argument("--pilot", action="store_true")
    ap.add_argument("--runs", type=int, default=2)
    ap.add_argument("--budget", type=float, default=0.70)
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--report", action="store_true")
    a = ap.parse_args()
    if a.budget > 0.70:
        sys.exit("The founder's OK is for a 0.70 dollar stop; not more.")
    if a.prepare:
        prepare()
    elif a.report:
        report()
    else:
        man = json.loads(MANIFEST.read_text())
        if a.pilot:
            jobs = [(arm, p, 0) for arm, k in PILOT for p in sorted(man[arm])[:k]]
        else:
            jobs = [(arm, p, rn) for rn in range(a.runs) for arm in ("shorts", "longtop") for p in sorted(man[arm])]
        run(jobs, a.budget, a.workers)

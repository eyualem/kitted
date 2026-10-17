#!/usr/bin/env python3
"""Shorts length and socks reading test, the small version (shorts1). Oct 17, 2026; DECISIONS-LOG #332.

The founder OK'd the test in rubric/research/parts/casual-athletic.md §7 at a smaller budget: "don't spend that much
money. But you can do the test with about $0.75 of budget." So: a HARD STOP at $0.75 (75 cents), counted from the real
token usage of every call in raw.json, with the worst-case cost of every call in flight reserved before it starts.
Only photos already on the Mac: the 24 gold-set photos whose reading has shorts (no shoot yet, no new downloads).
The founder's saved phone checks have no shorts.

ARMS (3 runs each; C first, B only with the budget left)
  C  a narrow look: the face-hidden lower close-up (the body close-up when there's no hip split) that gold1 already
     sent, with prompt_shorts1.txt + schema_shorts1.json (two questions: shorts_end, socks). ~0.11 cents a call.
  B  the app's scoring read exactly as gold1 (zoom_test arm B: prompt.txt + the close-up line, the full frame and the
     two close-ups), with the schema widened: `shorts_end` on bottoms, `socks` on footwear, and `track_jacket` /
     `track_pants` as garment kinds. ~0.6 cents a call.
  A  the control is gold1's own two runs of the same read (Oct 12, same model, prompt and images): no new calls.

TRUTH: shorts1_labels.csv, labelled by Claude from the same close-ups before any answer existed. "unsure" is left out.

PASS BARS (#198, as plan §7):
  steady  the grouping a rule would use is the same on all 3 runs on >= 90% of photos
          (length: above the knee vs at or below it; socks: crew or tall vs low or none showing)
  right   >= 85% against the labels when it answers (every run counts); the 3-way length is reported too
  unsure  cant_see (or a shorts "not_shorts" / footwear "na" where a value should be) on <= 30% of runs
  harmless (arm B only) the score steady within 0.5 on runs 0-1 no lower than arm A's, and the old fields'
          run-to-run agreement no lower by more than 2 points

RUN (from extraction-test/)
  /usr/bin/python3 shorts_read.py --dry-run                 the call list and the estimate (no key, no calls)
  /usr/bin/python3 shorts_read.py --arm C --runs 3          (key from app/.env.development.local; never printed)
  /usr/bin/python3 shorts_read.py --arm B --runs 3
  /usr/bin/python3 shorts_read.py --report                  re-analyze, no calls
Outputs: results/shorts1/ (raw.json, report.md). KITTED_DATA points at the main checkout's git-ignored images and
gold1 readings when run from a worktree.
"""
import argparse, copy, csv, json, os, sys, threading
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
DATA = Path(os.environ.get("KITTED_DATA", HERE.parent))
sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE / "rubrics"))
import b1_test  # noqa: E402  (the narrow call with its own schema)
import rubric as R  # noqa: E402
import parts_proto as P  # noqa: E402
import zoom_test as Z  # noqa: E402  (prompt_for, images_for, ZOOM_LINE: the gold1 read)

OUT = HERE / "results" / "shorts1"
IMAGES = DATA / "extraction-test" / "results" / "gold1" / "images"
GOLD_RAW = DATA / "extraction-test" / "results" / "gold1" / "raw.json"
BUDGET_CENTS = 75.0
RESERVE = {"C": 0.25, "B": 1.0}          # worst-case cents per call, reserved while it's in flight
PROFILE = R.parse_styles("minimalist:0.5,smart_casual:0.5")
BAR = {"steady": 0.90, "right": 0.85, "unsure": 0.30}
LEN_ORDER = ("above_knee", "at_knee", "below_knee")
PROMPT_C = (HERE / "prompt_shorts1.txt").read_text()
SCHEMA_C = json.loads((HERE / "schema_shorts1.json").read_text())

B_LINES = (
    '- "shorts_end": shorts only: where the hem ends against the knee. above_knee (the whole kneecap shows below the '
    'hem), at_knee (the hem ends on the kneecap or covers part of it), below_knee (the whole knee is covered), '
    'cant_see (knees hidden or out of frame). "na" for everything that isn\'t shorts.\n'
    '- "socks": footwear only: the socks visible above the shoes. not_visible (none shows: bare ankle, sandals without '
    'socks, or hidden by boots or long pants), low (no-show or ankle, ending at or below the ankle bone), crew (rises '
    'onto the lower calf), tall (reaches the upper calf), cant_see. "na" for everything that isn\'t footwear.\n'
    '- "track_jacket": a zip-up athletic jacket in smooth or shiny sports fabric, often with stripes down the sleeves. '
    '"track_pants": athletic pants in that fabric, often striped down the leg (not cotton sweatpants or joggers).\n')


def schema_b():
    s = copy.deepcopy(Z.SCHEMA)
    g = s["properties"]["garments"]["items"]
    g["properties"]["subcategory"]["enum"] = g["properties"]["subcategory"]["enum"] + ["track_jacket", "track_pants"]
    g["properties"]["shorts_end"] = {"type": "string", "enum": ["na", "above_knee", "at_knee", "below_knee", "cant_see"]}
    g["properties"]["socks"] = {"type": "string", "enum": ["na", "not_visible", "low", "crew", "tall", "cant_see"]}
    g["required"] = g["required"] + ["shorts_end", "socks"]
    return s


def prompt_b(n_images):
    marker = "Return only JSON that matches the schema."
    base = Z.prompt_for(False).replace(marker, B_LINES + marker)
    return base + {1: "", 2: "\n" + Z.ZOOM_LINE_BODY, 3: "\n" + Z.ZOOM_LINE}[n_images]


def labels():
    with (HERE / "shorts1_labels.csv").open() as f:
        return {r["photo"]: r for r in csv.DictReader(f)}


def image_c(pid):
    for part in ("lower", "body", "full"):
        f = IMAGES / f"{pid}.{part}.jpg"
        if f.exists():
            return part, f.read_bytes()
    return None, None


def load_raw():
    f = OUT / "raw.json"
    return json.loads(f.read_text()) if f.exists() else []


def spent(raw):
    return sum(b1_test.cents(r) for r in raw)


def get_key():
    k = os.environ.get("GEMINI_API_KEY")
    if k:
        return k
    envf = DATA / "app" / ".env.development.local"
    if envf.exists():
        for line in envf.read_text().splitlines():
            if line.startswith("EXPO_PUBLIC_GEMINI_DEV_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit("No Gemini key (GEMINI_API_KEY or app/.env.development.local).")


def run_arm(arm, runs, workers, dry):
    OUT.mkdir(parents=True, exist_ok=True)
    pids = sorted(labels())
    raw = load_raw()
    done = {(r["arm"], r["photo"], r["run"]) for r in raw if r.get("json")}
    jobs = [(pid, i) for i in range(runs) for pid in pids if (arm, pid, i) not in done]
    est = len(jobs) * (0.11 if arm == "C" else 0.60)
    print(f"arm {arm}: {len(jobs)} calls, about {est:.1f} cents; spent so far {spent(raw):.2f} cents of {BUDGET_CENTS:.0f}")
    if dry or not jobs:
        return
    key = get_key()
    lock = threading.Lock()
    state = {"spent": spent(raw), "reserved": 0.0, "stopped": 0}
    sch_b = schema_b() if arm == "B" else None

    def one(job):
        pid, i = job
        with lock:                                     # the hard stop: real spend + every call in flight, worst case
            if state["spent"] + state["reserved"] + RESERVE[arm] > BUDGET_CENTS:
                state["stopped"] += 1
                return None
            state["reserved"] += RESERVE[arm]
        try:
            if arm == "C":
                part, img = image_c(pid)
                r = b1_test.call(key, PROMPT_C, SCHEMA_C, [img])
                r["image"] = part
            else:
                imgs = Z.images_for(pid, True, IMAGES)
                r = b1_test.call(key, prompt_b(len(imgs)), sch_b, imgs)
                r["images"] = len(imgs)
        finally:
            pass
        r.update({"arm": arm, "photo": pid, "run": i})
        with lock:
            state["reserved"] -= RESERVE[arm]
            state["spent"] += b1_test.cents(r)
            raw.append(r)
            (OUT / "raw.json").write_text(json.dumps(raw, indent=1))
        if r.get("error"):
            print(f"  {pid} run {i}: {str(r['error'])[:120]}")
        return r

    with ThreadPoolExecutor(workers) as ex:
        list(ex.map(one, jobs))
    print(f"arm {arm} done: spent {state['spent']:.2f} cents in all; {state['stopped']} calls not started (budget)")


# ------------------------------------------------------------------ analysis
def grp_len(v):
    return None if v not in LEN_ORDER else ("above" if v == "above_knee" else "at_or_below")


def grp_socks(v):
    return None if v not in ("not_visible", "low", "crew", "tall") else ("crew_or_tall" if v in ("crew", "tall") else "low_or_none")


def answers(raw, arm):
    """photo -> run -> {shorts_end, socks} (arm B: from the shorts garment and the footwear)."""
    out = defaultdict(dict)
    for r in raw:
        if r["arm"] != arm or not r.get("json"):
            continue
        j = r["json"]
        if arm == "C":
            out[r["photo"]][r["run"]] = {"shorts_end": j.get("shorts_end"), "socks": j.get("socks")}
        else:
            gs = j.get("garments") or []
            b = next((g for g in gs if g.get("category") == "bottom"), {})
            s = next((g for g in gs if g.get("category") == "footwear"), None)
            out[r["photo"]][r["run"]] = {"shorts_end": b.get("shorts_end") if b.get("subcategory") in P.SHORTS else "not_shorts",
                                         "socks": s.get("socks") if s else "no_shoes_read",
                                         "track": [g.get("subcategory") for g in gs if str(g.get("subcategory")).startswith("track_")]}
    return out


def question_stats(ans, lab, field, grp, label_key):
    rows = []
    for pid, runs in sorted(ans.items()):
        vals = [runs[i][field] for i in sorted(runs)]
        rows.append((pid, vals, lab[pid][label_key]))
    n3 = [(p, v, t) for p, v, t in rows if len(v) >= 3]
    steady = sum(1 for p, v, t in n3 if len({grp(x) for x in v[:3]}) == 1 and grp(v[0]) is not None)
    exact = sum(1 for p, v, t in n3 if len(set(v[:3])) == 1)
    allv = [x for p, v, t in rows for x in v]
    unsure = sum(1 for x in allv if grp(x) is None)
    judged = [(x, t) for p, v, t in rows if t not in ("unsure", "") for x in v if grp(x) is not None]
    right = sum(1 for x, t in judged if grp(x) == grp(t))
    right_exact = sum(1 for x, t in judged if x == t)
    return {"n_photos": len(rows), "n3": len(n3), "steady": steady, "exact3": exact, "runs": len(allv), "unsure": unsure,
            "judged": len(judged), "right": right, "right_exact": right_exact, "rows": rows}


def pct(a, b):
    return f"{a}/{b} ({100 * a / b:.0f}%)" if b else "-"


def passes(s):
    st = s["n3"] and s["steady"] / s["n3"] >= BAR["steady"]
    rt = s["judged"] and s["right"] / s["judged"] >= BAR["right"]
    un = s["runs"] and s["unsure"] / s["runs"] <= BAR["unsure"]
    return bool(st), bool(rt), bool(un)


OLD_FIELDS = ("subcategory", "color_family", "leg_shape", "volume", "pattern", "hem", "length", "tucked")


def old_agreement(runs_by_photo):
    """Share of (photo, slot, field) where runs 0 and 1 agree, on the top, bottom and footwear (first of each)."""
    same = tot = 0
    for pid, runs in runs_by_photo.items():
        if 0 not in runs or 1 not in runs:
            continue
        a, b = runs[0], runs[1]
        for cat in ("top", "bottom", "footwear", "outerwear"):
            ga = next((g for g in a.get("garments", []) if g.get("category") == cat), None)
            gb = next((g for g in b.get("garments", []) if g.get("category") == cat), None)
            if ga is None or gb is None:
                if (ga is None) != (gb is None):
                    tot += 1
                continue
            for f in OLD_FIELDS:
                tot += 1
                same += ga.get(f) == gb.get(f)
    return same, tot


def score_steady(runs_by_photo):
    ok = n = 0
    for pid, runs in runs_by_photo.items():
        if 0 not in runs or 1 not in runs:
            continue
        s = [P.score_parts(runs[i], "everyday", PROFILE, None, "a_little")["overall"] for i in (0, 1)]
        if None in s:
            continue
        n += 1
        ok += abs(s[0] - s[1]) <= 0.5
    return ok, n


def report():
    raw = load_raw()
    lab = labels()
    L = [f"# Shorts length and socks reading test (shorts1)", "",
         f"*Oct 17, 2026. Claude. Script `extraction-test/shorts_read.py`; labels `shorts1_labels.csv`; raw `results/shorts1/raw.json`. "
         f"24 gold-set photos with shorts (public screenshots, profile unknown); no gym-shorts truth beyond one photo.*", ""]
    cost = defaultdict(float)
    calls = Counter()
    for r in raw:
        cost[r["arm"]] += b1_test.cents(r); calls[r["arm"]] += 1
    L.append(f"**Spend:** {sum(cost.values()):.1f} cents of the 75-cent cap (" +
             ", ".join(f"arm {a}: {calls[a]} calls, {cost[a]:.1f} cents" for a in sorted(cost)) + ").")
    L.append("")
    for arm in ("C", "B"):
        ans = answers(raw, arm)
        if not ans:
            continue
        L.append(f"## Arm {arm}" + (" (the narrow look)" if arm == "C" else " (the scoring read with the new values)"))
        L.append("")
        L.append("| Question | Steady on 3 runs | Same exact answer on 3 | Right (grouping) | Right (exact) | Can't see | Passes |")
        L.append("|---|---|---|---|---|---|---|")
        for field, grp, key, name in (("shorts_end", grp_len, "shorts_end", "Length: above the knee vs at or below"),
                                      ("socks", grp_socks, "socks", "Socks: crew or tall vs low or none")):
            s = question_stats(ans, lab, field, grp, key)
            ok = passes(s)
            L.append(f"| {name} | {pct(s['steady'], s['n3'])} | {pct(s['exact3'], s['n3'])} | {pct(s['right'], s['judged'])} | "
                     f"{pct(s['right_exact'], s['judged'])} | {pct(s['unsure'], s['runs'])} | "
                     f"{'yes' if all(ok) else 'no (' + ', '.join(n for n, o in zip(('steady', 'right', 'unsure'), ok) if not o) + ')'} |")
        L.append("")
        L.append("Per photo (label → runs):")
        L.append("")
        for pid in sorted(ans):
            runs = ans[pid]
            ln = " / ".join(str(runs[i]["shorts_end"]) for i in sorted(runs))
            sk = " / ".join(str(runs[i]["socks"]) for i in sorted(runs))
            tr = sorted({t for i in runs for t in runs[i].get("track", [])})
            L.append(f"- {pid}: length {lab[pid]['shorts_end']} → {ln}; socks {lab[pid]['socks']} → {sk}" + (f"; track pieces read: {tr}" if tr else ""))
        L.append("")
    # harmless: arm B vs gold1's arm A on runs 0-1
    rb = defaultdict(dict)
    for r in raw:
        if r["arm"] == "B" and r.get("json"):
            rb[r["photo"]][r["run"]] = r["json"]
    if rb:
        ra = defaultdict(dict)
        for r in json.loads(GOLD_RAW.read_text()):
            if r.get("json") and r["photo"] in rb:
                ra[r["photo"]][r["run"]] = r["json"]
        sa, sb = score_steady(ra), score_steady(rb)
        oa, ob = old_agreement(ra), old_agreement(rb)
        L.append("## Harmless? Arm B against gold1's own runs (arm A, Oct 12), runs 0 and 1")
        L.append("")
        L.append(f"- Score within 0.5 between runs: A {pct(*sa)} · B {pct(*sb)} → {'pass' if sb[0] / max(sb[1], 1) >= sa[0] / max(sa[1], 1) else 'FAIL'}")
        da = 100 * oa[0] / max(oa[1], 1); db = 100 * ob[0] / max(ob[1], 1)
        L.append(f"- Old fields the same between runs (top, bottom, shoes, jacket × {len(OLD_FIELDS)} fields): A {da:.1f}% · B {db:.1f}% → "
                 f"{'pass' if db >= da - 2 else 'FAIL'} (bar: no more than 2 points lower)")
        diffs = []
        for pid in sorted(rb):
            if 0 in rb[pid] and 0 in ra.get(pid, {}):
                a0 = P.score_parts(ra[pid][0], "everyday", PROFILE, None, "a_little")["overall"]
                b0 = P.score_parts(rb[pid][0], "everyday", PROFILE, None, "a_little")["overall"]
                if a0 != b0:
                    diffs.append(f"{pid} {a0} → {b0}")
        L.append(f"- Run-0 scores that differ between A and B: {len(diffs)}" + (f" ({'; '.join(diffs)})" if diffs else ""))
        L.append("")
    txt = "\n".join(L) + "\n"
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "report.md").write_text(txt)
    print(txt)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--arm", choices=("C", "B"))
    ap.add_argument("--runs", type=int, default=3)
    ap.add_argument("--workers", type=int, default=3)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--only", help="comma-separated photo ids (a pilot)")
    ap.add_argument("--report", action="store_true")
    a = ap.parse_args()
    if a.report:
        return report()
    if a.only:
        keep = set(a.only.split(","))
        global labels
        full = labels
        labels = lambda: {k: v for k, v in full().items() if k in keep}  # noqa: E731
    if a.dry_run:
        for arm in ("C", "B"):
            run_arm(arm, a.runs, a.workers, True)
        return
    run_arm(a.arm, a.runs, a.workers, False)
    report()


if __name__ == "__main__":
    main()

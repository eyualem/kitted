#!/usr/bin/env python3
"""Hem close-up reading test (hem3). Built Oct 13, 2026; the founder approved about $0.50 for it.

WHY
  All four of the founder's taste-source creators call the place where the pants meet the shoes make-or-break
  (rubric/research/creators/creators-rules.md, A4 and B1-B4). Today the engine can't use it: the scoring call's
  six-class `hem` is the same across runs only 64-68% of the time (KD-8), so heavy hems stay tips ([PRO-10], FF7b),
  and only "pooling" moves points ([FIT-4]). Two earlier tries failed: the phone's hem probe (#190, M2) and the
  second look's six-class `pant_end` (#199, 74% steady, 54% right). What passed in #199 was a plain yes/no:
  "the pant fabric rests on the shoe" (94% steady, 97% right when it fires). So this test asks a TIGHT crop of
  just the hems and shoes a few plain yes/no questions instead of one many-class one (v8-critique step 3).

WHAT IT SENDS (one call per image, per run)
  - The image: a tight crop around both hems and shoes (about half a shin above the higher ankle down to the floor
    under the lower one), cut from the face-hidden lower close-up that the app's own Swift prep makes
    (vision/bin/kmeasure zoom: Prep.locate with the #188 fix, hideRegions, zoomRects; the same files b1, look1 and
    gold1 sent). Body joints (Apple Vision) place the ankles and set the scale (knee-to-ankle). Without ankle joints
    it falls back to the bottom 35% of the lower close-up (or of the body close-up when there's no hip split).
    Nothing new is sent: every crop is a part of an image that was already sent with faces hidden.
  - The questions, prompt_hem3.txt + schema_hem3.json, each "yes" / "no" / "cant_see":
      hem_touches_shoe  (a) does the hem touch the top of the shoe
      folds_above_shoe  (b, half 1) does the fabric gather in folds above the shoe
      drags_at_heel     (b, half 2) does the hem reach the floor / fold under or hang over the back of the heel
      ankle_shows       (c) is ankle or sock visible between the hem and the shoe
    The brief's (b) "piles in folds above the shoe OR drags behind the heel" is asked as two questions, because the
    creators' rules treat the halves differently on a loose leg (a soft stack is fine, dragging isn't). The report
    also scores the combined (b) ("piles_or_drags": yes if either is yes, no if both are no).
  - Config: the look1 / b1 call (b1_test.call): gemini-3.8-flash, thinking off, temperature 0, JSON schema.

PHOTOS AND TRUTH: hem3_labels.csv (rows with use=yes)
  The photos earlier hem tests used (hem_labels.csv / look_labels.csv: his phone checks, the friends', Oct 7, the
  12 web mirror selfies, the stock photos) plus a stratified sample of the public gold-set screenshots (gold1),
  only where both legs' hems and the shoes are in the crop. Labels: earlier labels mapped onto the questions where
  the mapping is clean (`from_earlier` says which), the rest by eye from the crops, blind to every AI answer
  (`labeller` says who). "unsure" leaves that photo out of that question's accuracy. Rule 7: `person` and
  `profile` per photo as in the earlier tests (the founder: profile pending; friends, web, stock and gold:
  profile unknown). A hem reading uses no profile; the paper estimate scores with the one stated test profile
  every paper test has used (minimalist 0.5 + smart casual 0.5, boldness a_little, Everyday).

PASS BAR per question (#187 / #199): steady >= 90% (same answer on all 3 runs), right >= 85% when it answers (not
  cant_see; every run counts), cant_see <= 30% of runs. Split by mirror selfie vs propped/other, by leg shape
  (straight/slim vs relaxed/wide) and by dark pants on dark shoes.

THEN, ON PAPER ONLY (no engine change): what the creators' version would do with the questions that pass, using the
  readings already on disk (b1 arm A = the app's config on his saved checks and the other saved photos; zoom1 arm B
  where b1 has none; gold1 for the gold photos), scored with today's default engine (parts_proto, v10):
    D  dragging costs on every leg: drags_at_heel yes -> the hem counts as piling, on loose legs too
    P  piling costs on a straight or slim leg: folds_above_shoe yes on a non-loose leg -> piling ([FIT-4])
    C  a "pooling" reading is cleared when both folds and drags say no
    S  a soft stack on a relaxed or wide leg stays free (already v8; listed, never moves a score)
    R  "rests on the shoe" for the slides drag ([SHO-2] / SK1b) comes from hem_touches_shoe
    T  ankle or sock showing under relaxed or wide trousers or chinos: a tip only (counted, never points)

RUN (from extraction-test/)
  /usr/bin/python3 hem_test.py --prep-only                    crops + photo count + cost estimate (no key, no calls)
  /usr/bin/python3 hem_test.py --dry-run                      the call list + estimate (no key, no calls)
  read -s GEMINI_API_KEY && export GEMINI_API_KEY             (never printed or written)
  /usr/bin/python3 hem_test.py --runs 1 --only phone-d1967f,stock-s10 --budget 0.02      (pilot, 2 calls)
  /usr/bin/python3 hem_test.py --runs 3 --budget 0.60         (the test; resumable; stops at the budget)
  /usr/bin/python3 hem_test.py --report                       (re-analyze, no calls)
Outputs: results/hem3/ (crops/ and *.jpg git-ignored; raw.json, crops.json, report.md, manifest.json).
"""
import argparse, copy, csv, json, os, statistics, subprocess, sys, time
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE / "rubrics"))
from b1_test import call, cents, MODEL, PRICE_IN, PRICE_OUT  # noqa: E402  (the look1 / b1 call and prices)

OUT = HERE / "results" / "hem3"
CROPS = OUT / "crops"
LABELS = HERE / "hem3_labels.csv"
DIRS = {"saved": HERE / "results" / "b1" / "images", "gold": HERE / "results" / "gold1" / "images"}
PROMPT = (HERE / "prompt_hem3.txt").read_text()
SCHEMA = json.loads((HERE / "schema_hem3.json").read_text())
QS = list(SCHEMA["propertyOrdering"])
QB = "piles_or_drags"                     # the brief's (b), derived from folds_above_shoe + drags_at_heel
SHORT = {"hem_touches_shoe": "a touches", "folds_above_shoe": "b1 folds", "drags_at_heel": "b2 drags",
         "ankle_shows": "c ankle", QB: "b piles|drags"}
BAR = {"steady": 0.90, "right": 0.85, "cant_see": 0.30}
# Cost: in look1 the lower close-up's promptTokenCount was ~1,371 for a 213-word prompt whatever the image size
# (65x94 up to 860x1024), so an image is a fixed ~1,085 tokens; output here is 4 short enums.
IMG_TOKENS, TOKENS_PER_WORD, OUT_TOKENS = 1085, 1.35, 45
GOLD_PREFIX = ("ig-", "pin-", "rd-")


# ---------------------------------------------------------------- prep: the tight hem-and-shoe crop

def group_of(pid):
    return "gold" if pid.startswith(GOLD_PREFIX) else pid.split("-")[0]


def dir_of(pid):
    return DIRS["gold" if pid.startswith(GOLD_PREFIX) else "saved"]


def ensure_prepared(pids):
    """Run the app's Swift prep (kmeasure zoom, via zoom_test.prepare) for any photo whose close-ups aren't cached."""
    missing = [p for p in pids if not (dir_of(p) / f"{p}.json").exists()]
    if not missing:
        return
    import zoom_test as Z
    src = {}
    if any(not p.startswith(GOLD_PREFIX) for p in missing):
        import fit_ruler
        src.update({p["id"]: p["path"] for p in fit_ruler.photo_set()})
    if any(p.startswith(GOLD_PREFIX) for p in missing):
        import gold_read
        src.update({r["id"]: Path(r["path"]) for r in gold_read.manifest()})
    for p in missing:
        if p in src:
            Z.prepare([(p, src[p])], dir_of(p))
        else:
            print(f"{p}: no source photo found; skipped")


def image_size(path):
    out = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(path)], capture_output=True, text=True).stdout
    vals = [int(line.split(":")[1]) for line in out.splitlines() if "pixel" in line]
    return tuple(vals) if len(vals) == 2 else None


def sips_crop(src, box, dst, size):
    """Crop with macOS sips (no Python image library here). sips silently skips some crops that end exactly on the
    image's bottom edge (seen Oct 13), so a box keeps 1 px off the bottom and right edges and the output is checked."""
    sw, sh = size
    x, y, w, h = box
    w, h = min(w, sw - x - 1), min(h, sh - y - 1)
    subprocess.run(["sips", "-c", str(h), str(w), "--cropOffset", str(y), str(x), "-s", "formatOptions", "92",
                    str(src), "--out", str(dst)], check=True, capture_output=True)
    if image_size(dst) != (w, h):
        dst.unlink(missing_ok=True)
        raise RuntimeError(f"sips didn't crop {src.name} to {w}x{h}")
    return [x, y, w, h]


def crop(pid):
    """Cut <pid>.hem.jpg from the face-hidden lower (or body) close-up. Returns the geometry, or a status."""
    d = dir_of(pid)
    mp = d / f"{pid}.json"
    if not mp.exists():
        return {"status": "not_prepared"}
    meta = json.loads(mp.read_text())
    if meta.get("status") != "ok":
        return {"status": f"prep refused ({meta.get('status')})"}
    rects, sizes, J = meta.get("rects") or {}, meta.get("sizes") or {}, meta.get("joints") or {}
    part = next((k for k in ("lower", "body") if k in rects and k in sizes and (d / f"{pid}.{k}.jpg").exists()), None)
    if part is None:
        return {"status": "no close-up"}
    R0 = rects[part]
    sw, sh = sizes[part]
    sx, sy = sw / R0["w"], sh / R0["h"]
    ankles = [J[k] for k in ("lAnkle", "rAnkle") if k in J and R0["y"] <= J[k][1] <= R0["y"] + R0["h"] * 1.02]
    shins = [J[a][1] - J[k][1] for k, a in (("lKnee", "lAnkle"), ("rKnee", "rAnkle"))
             if k in J and a in J and J[a][1] - J[k][1] > 0.08 * R0["h"]]
    out = {"status": "ok", "source": f"{pid}.{part}.jpg", "close_up_size": [sw, sh],
           "close_up_px_per_photo_px": round(sy, 3)}
    if ankles:
        L = statistics.median(shins) if shins else (0.42 if part == "lower" else 0.24) * R0["h"]
        ys, xs = [a[1] for a in ankles], [a[0] for a in ankles]
        x0, x1 = (min(xs) - 0.6 * L - R0["x"]) * sx, (max(xs) + 0.6 * L - R0["x"]) * sx
        y0, y1 = (min(ys) - 0.55 * L - R0["y"]) * sy, (max(ys) + 0.45 * L - R0["y"]) * sy
        out.update({"method": "ankles", "shin_px": round(L * sy), "knees": bool(shins),
                    "ankle_near_bottom": max(ys) + 0.15 * L > R0["y"] + R0["h"]})
    else:
        x0, x1, y0, y1 = 0, sw, sh * 0.65, sh
        out.update({"method": "fallback_bottom35"})
    x0, y0 = max(0, int(x0)), max(0, int(y0))
    x1, y1 = min(sw, int(x1)), min(sh, int(y1))
    if x1 - x0 < 24 or y1 - y0 < 24:
        x0, x1, y0, y1 = 0, sw, int(sh * 0.65), sh
        out["method"] = "fallback_bottom35 (crop too small)"
    CROPS.mkdir(parents=True, exist_ok=True)
    box = sips_crop(d / out["source"], [x0, y0, x1 - x0, y1 - y0], CROPS / f"{pid}.hem.jpg", (sw, sh))
    out.update({"box": box, "size": [box[2], box[3]]})
    return out


def prep(pids):
    ensure_prepared(pids)
    cp = OUT / "crops.json"
    known = json.loads(cp.read_text()) if cp.exists() else {}
    for p in pids:
        if p not in known or not (CROPS / f"{p}.hem.jpg").exists():
            known[p] = crop(p)
    cp.write_text(json.dumps(known, indent=1, sort_keys=True))
    return {p: known[p] for p in pids}


# ---------------------------------------------------------------- the photo set

def labels():
    if not LABELS.exists():
        return {}
    with LABELS.open() as f:
        return {r["photo"]: r for r in csv.DictReader(f)}


def pool():
    """Every photo with cached face-hidden close-ups: the saved test photos (b1's prep) and the gold set (gold1's)."""
    out = []
    for kind, d in DIRS.items():
        if d.exists():
            out += sorted(p.name[:-5] for p in d.glob("*.json"))
    return out


def gold_candidates(n_heavy=10, n_short=6, n_clean=8):
    """A stratified pick of gold photos for labelling, from the 5 judges' written reasons (not the AI reading):
    heavy (2+ judges mention pooling/stacking/dragging), short (ankle/cropped/high-water), clean (no hem words),
    with shoes scored by most judges. Spread over Instagram / Pinterest / Reddit by taking every k-th."""
    import re
    gj = HERE.parent / "inputs" / "gold-judge"
    man = {m["gid"]: m["photo"] for m in json.loads((gj / "manifest.json").read_text()) if not m.get("repeat")}
    heavy_w = re.compile(r"pool|puddl|stack|drag|bunch|too long|break|slouch", re.I)
    short_w = re.compile(r"ankle|cropped (trouser|pant|jean|leg)|high.?water|flood|short hem|hem.{0,12}short", re.I)
    hits = defaultdict(lambda: {"heavy": 0, "short": 0, "shoes_na": 0, "n": 0})
    for f in sorted(gj.glob("judge-*-b*.csv")):
        with f.open() as fh:
            for r in csv.DictReader(fh):
                h = hits[r["id"]]
                h["n"] += 1
                h["heavy"] += bool(heavy_w.search(r.get("reason") or ""))
                h["short"] += bool(short_w.search(r.get("reason") or ""))
                h["shoes_na"] += (r.get("shoes") or "").strip().upper() == "NA"
    ready = set(pool())
    strata = defaultdict(list)
    for gid, h in sorted(hits.items()):
        pid = man.get(gid)
        if not pid or pid not in ready or h["shoes_na"] * 2 >= h["n"]:
            continue
        k = "heavy" if h["heavy"] >= 2 else "short" if h["short"] >= 2 else "clean" if h["heavy"] + h["short"] == 0 else None
        if k:
            strata[k].append(pid)
    pick = {}
    for k, n in (("heavy", n_heavy), ("short", n_short), ("clean", n_clean)):
        xs = sorted(strata[k], key=lambda p: (p.split("-")[0], p))
        step = max(1, len(xs) // max(1, n))
        pick[k] = xs[::step][:n]
    return pick, {k: len(v) for k, v in strata.items()}


def test_set():
    lab = labels()
    return sorted(p for p, r in lab.items() if r.get("use") == "yes")


def estimate(n_photos, runs):
    words = len(PROMPT.split())
    tin = words * TOKENS_PER_WORD + IMG_TOKENS
    per = tin * PRICE_IN + OUT_TOKENS * PRICE_OUT
    return per, per * n_photos * runs, tin


# ---------------------------------------------------------------- the calls

def run_calls(pids, runs, budget, workers):
    key = os.environ.get("GEMINI_API_KEY") or sys.exit("Set GEMINI_API_KEY first.")
    raw_path = OUT / "raw.json"
    results = json.loads(raw_path.read_text()) if raw_path.exists() else []
    spent = sum(cents(r) for r in results) / 100
    done = {(r["photo"], r["run"]) for r in results if r.get("json")}
    results = [r for r in results if r.get("json")] + [r for r in results if not r.get("json") and r.get("usage")]
    jobs = [(p, i) for i in range(runs) for p in pids if (p, i) not in done]
    per, _, _ = estimate(1, 1)
    print(f"{len(jobs)} calls (~${per * len(jobs):.3f}); spent so far ${spent:.3f}; budget ${budget:.2f}")
    if spent >= budget:
        print("budget already reached; nothing sent"); return

    def one(job):
        p, i = job
        img = CROPS / f"{p}.hem.jpg"
        r = call(key, PROMPT, SCHEMA, [img.read_bytes()])
        r.update({"photo": p, "run": i, "image": img.name, "at": time.strftime("%H:%M:%S")})
        return r

    stop = False
    with ThreadPoolExecutor(workers) as ex:
        pending = list(jobs)
        while pending and not stop:
            # never start a batch that the estimate says would cross the budget
            room = int(max(0, budget - spent) / per)
            if room <= 0:
                print(f"budget ${budget:.2f} reached; stopping"); break
            n = min(workers * 2, room)
            batch, pending = pending[:n], pending[n:]
            for r in ex.map(one, batch):
                results.append(r)
                spent += cents(r) / 100
                if r.get("error"):
                    print(f"  {r['photo']} run {r['run']}: {str(r['error'])[:120]}")
            raw_path.write_text(json.dumps(results, indent=1))
            print(f"  {len(results)} done · ${spent:.3f}")
            if spent >= budget:
                print(f"budget ${budget:.2f} reached; stopping"); stop = True
    rs = [r for r in results if r.get("usage")]
    if rs:
        u = [x["usage"] for x in rs]
        print(f"{len(rs)} calls · in {sum(x.get('promptTokenCount', 0) for x in u) / len(u):.0f} · "
              f"out {sum(x.get('candidatesTokenCount', 0) for x in u) / len(u):.0f} · "
              f"{sum(cents(x) for x in rs) / len(rs):.4f}¢/call · median {sorted(x['seconds'] for x in rs)[len(rs) // 2]} s")
    print(f"total spent ${spent:.3f}")
    (OUT / "manifest.json").write_text(json.dumps({"model": MODEL, "runs": runs, "photos": pids, "budget": budget,
                                                   "prompt": "prompt_hem3.txt", "schema": "schema_hem3.json",
                                                   "finished": time.strftime("%Y-%m-%d %H:%M:%S")}, indent=1))


# ---------------------------------------------------------------- the report

def with_b(js):
    js = dict(js)
    f, d = js.get("folds_above_shoe"), js.get("drags_at_heel")
    js[QB] = "yes" if "yes" in (f, d) else "no" if (f, d) == ("no", "no") else "cant_see"
    return js


def label_b(row):
    f, d = row.get("folds_above_shoe"), row.get("drags_at_heel")
    if "yes" in (f, d):
        return "yes"
    if (f, d) == ("no", "no"):
        return "no"
    return "unsure"


def answers(raw):
    by = defaultdict(list)
    for r in sorted(raw, key=lambda r: r["run"]):
        if isinstance(r.get("json"), dict):
            by[r["photo"]].append(with_b(r["json"]))
    return by


def split_of(row):
    shot = "mirror selfie" if row.get("shot") == "mirror" else "propped/other"
    leg = {"straight": "straight/slim", "slim": "straight/slim", "skinny": "straight/slim",
           "relaxed": "relaxed/wide", "wide": "relaxed/wide"}.get(row.get("leg"), "leg unknown")
    dark = "dark on dark" if row.get("dark_on_dark") == "yes" else "not dark on dark"
    return {"shot": shot, "leg": leg, "dark": dark}


def stats(by, lab, pids, q):
    steady_n = steady_ok = runs = cs = ans = right = yes_said = yes_right = lab_yes = lab_yes_found = 0
    for p in pids:
        js = by.get(p, [])
        if not js:
            continue
        vals = [j.get(q) for j in js]
        if len(vals) >= 2:
            steady_n += 1; steady_ok += len(set(vals)) == 1
        truth = label_b(lab[p]) if q == QB else lab[p].get(q)
        for v in vals:
            runs += 1
            if v == "cant_see":
                cs += 1; continue
            if truth in ("yes", "no"):
                ans += 1; right += v == truth
                if v == "yes":
                    yes_said += 1; yes_right += truth == "yes"
                if truth == "yes":
                    lab_yes += 1; lab_yes_found += v == "yes"
    pct = lambda a, b: (a / b) if b else None  # noqa: E731
    return {"photos": sum(1 for p in pids if by.get(p)), "steady": pct(steady_ok, steady_n), "steady_n": steady_n,
            "right": pct(right, ans), "right_n": ans, "cant_see": pct(cs, runs), "runs": runs,
            "yes_right": pct(yes_right, yes_said), "yes_n": yes_said, "found": pct(lab_yes_found, lab_yes), "found_n": lab_yes}


def passes(s):
    return (s["steady"] is not None and s["steady"] >= BAR["steady"] and s["right"] is not None
            and s["right"] >= BAR["right"] and s["cant_see"] is not None and s["cant_see"] <= BAR["cant_see"])


def fmt(x, n=None):
    if x is None:
        return "–"
    return f"{100 * x:.0f}%" + (f" ({n})" if n is not None else "")


def modal(js, q):
    c = Counter(j.get(q) for j in js).most_common()
    if not c:
        return None
    if len(c) > 1 and c[0][1] == c[1][1]:
        return "cant_see"
    return c[0][0]


# ---- the paper estimate (today's engine, existing readings; nothing changes in the engine)

def existing_readings(pids):
    """{pid: (source, [reading per run])}: b1 arm A, else zoom1 / zoom1-stock arm B, else gold1."""
    out = {}
    srcs = [("b1 arm A", HERE / "results" / "b1" / "raw.json", lambda r: r.get("arm") == "A", lambda p: p),
            ("zoom1 arm B", HERE / "results" / "zoom1" / "raw.json", lambda r: r.get("arm") == "B",
             lambda p: "phone-" + p[5:] if p.startswith("oct8-") else p),
            ("zoom1 arm B", HERE / "results" / "zoom1-stock" / "raw.json", lambda r: r.get("arm") == "B", lambda p: p),
            ("gold1", HERE / "results" / "gold1" / "raw.json", lambda r: True, lambda p: p)]
    want = set(pids)
    for name, path, keep, norm in srcs:
        if not path.exists():
            continue
        got = defaultdict(list)
        for r in json.loads(path.read_text()):
            pid = norm(r.get("photo", ""))
            if pid in want and pid not in out and keep(r) and isinstance(r.get("json"), dict):
                got[pid].append((r.get("run", 0), r["json"]))
        for pid, rs in got.items():
            out[pid] = (name, [j for _, j in sorted(rs, key=lambda x: x[0])])
    return out


def creators_version(reading, H, rules):
    """The reading with the hem facts from hem3 (H = modal answers) under the chosen rules; plus tune and tips."""
    import rubric as R
    r = copy.deepcopy(reading)
    bottoms = [g for g in r.get("garments") or [] if g.get("category") == "bottom"]
    tune, second, tips = None, None, []
    if not bottoms:
        return r, tune, second, tips
    B = bottoms[0]
    loose = B.get("leg_shape") in R.LOOSE
    touch, folds, drags, ankle = (H.get(q) for q in ("hem_touches_shoe", "folds_above_shoe", "drags_at_heel", "ankle_shows"))
    if "R" in rules and touch in ("yes", "no"):
        second = {"rests_on_shoe": touch == "yes"}
    if "D" in rules and drags == "yes":
        B["hem"] = "pooling"
        if loose:
            tune = {"ff7_loose": False}           # dragging costs on every leg, loose ones too
    elif "P" in rules and folds == "yes" and not loose:
        B["hem"] = "pooling"                      # piling on a straight or slim leg ([FIT-4])
    elif "C" in rules and folds == "no" and drags == "no" and B.get("hem") == "pooling":
        B["hem"] = "cropped" if touch == "no" else "slight_break"
    if "T" in rules and loose and B.get("subcategory") in ("trousers", "chinos", "suit_trousers", "drawstring_trousers") \
            and ankle == "yes" and touch != "yes":
        tips.append("T_ankle_under_wide_trousers")
    return r, tune, second, tips


def paper_estimate(by, pids, passed):
    import rubric as R
    import parts_proto as P
    profile, bold = R.parse_styles("minimalist:0.5,smart_casual:0.5"), "a_little"
    reads = existing_readings(pids)
    need = {"D": ["drags_at_heel"], "P": ["folds_above_shoe"], "C": ["folds_above_shoe", "drags_at_heel"],
            "R": ["hem_touches_shoe"], "T": ["ankle_shows", "hem_touches_shoe"]}
    sets = {f"rule {k} alone": {k} for k in need}
    sets["every rule whose questions passed"] = {k for k, qs in need.items() if all(q in passed for q in qs)}
    sets["all rules (if every question passed)"] = set(need)

    def med(xs):
        xs = [x for x in xs if isinstance(x, (int, float))]
        return statistics.median(xs) if xs else None

    def score(reading, tune=None, second=None):
        try:
            return P.score_parts(reading, "everyday", profile, second, bold, tune=tune).get("overall")
        except Exception:
            return None

    lines = ["What the creators' version would do (each rule uses this test's majority answer per photo):",
             "- D (needs b2 drags): dragging costs on every leg: the hem counts as piling, on relaxed and wide legs too "
             "([FIT-4] severities: trousers/chinos −2.0, jeans/cargos −1.5, sweats −0.5; it also blocks the shape credits, [PRO-8])",
             "- P (needs b1 folds): piling costs on a straight or slim leg (today's [FIT-4] pooling charge)",
             "- C (needs b1 folds and b2 drags): a 'pooling' reading is cleared when both say no",
             "- S: a soft stack on a relaxed or wide leg stays free (already v8 [FIT-4]; never moves a score here)",
             "- R (needs a touches): 'rests on the shoe' for loose jeans dragging on slides ([SHO-2] SK1b) comes from a",
             "- T (needs c ankle and a touches): ankle or sock showing under relaxed or wide trousers or chinos is a tip only",
             "Scores are the median over the existing runs of each photo (gold has 2 runs, so a median can end in .25/.75).", "",
             f"Readings on disk for {len(reads)} of {len(pids)} photos ("
             + ", ".join(f"{k} {v}" for k, v in Counter(s for s, _ in reads.values()).items())
             + f"). Engine: parts_proto default ({P.VERSIONS.get('v10', 'v10')}), Everyday, the stated test profile.", ""]
    base = {p: med([score(j) for j in reads[p][1]]) for p in reads if by.get(p)}
    groups = {"his + friends' saved checks (phone)": lambda p: p.startswith("phone-"),
              "other saved test photos (Oct 7, mirror, stock)": lambda p: group_of(p) in ("oct7", "mirror", "stock"),
              "gold photos": lambda p: p.startswith(GOLD_PREFIX)}
    lines.append("| Rules applied | " + " | ".join(groups) + " | tips (T) |")
    lines.append("|---|" + "---|" * (len(groups) + 1))
    detail = {}
    for name, rules in sets.items():
        moved = defaultdict(lambda: [0, 0, 0])            # group: [down, up, n]
        ntips = 0
        rows = []
        for p, b in base.items():
            H = {q: modal(by[p], q) for q in QS}
            outs, tip = [], False
            for j in reads[p][1]:
                r, tune, second, tips = creators_version(j, H, rules)
                outs.append(score(r, tune, second)); tip = tip or bool(tips)
            a = med(outs)
            ntips += tip
            for g, f in groups.items():
                if f(p):
                    moved[g][2] += 1
                    if a is not None and b is not None and a != b:
                        moved[g][0 if a < b else 1] += 1
                        rows.append(f"{p}: {b:g} → {a:g}  (answers: " + ", ".join(f"{SHORT[q]} {H[q]}" for q in QS) + ")")
        lines.append(f"| {name}{' (' + (','.join(sorted(rules)) or 'none') + ')' if 'passed' in name or 'all' in name else ''} | "
                     + " | ".join(f"{moved[g][0]} down, {moved[g][1]} up of {moved[g][2]}" for g in groups)
                     + f" | {ntips} |")
        detail[name] = rows
    lines.append("")
    for name, rows in detail.items():
        if rows and ("passed" in name or name.startswith("all")):
            lines += [f"Moved under '{name}':", *[f"- {x}" for x in sorted(rows)], ""]
    if not sets["every rule whose questions passed"]:
        lines.append("No rule has all its questions passing, so the creators' version would change nothing yet.")
    return lines


def report(raw_path=None):
    raw_path = Path(raw_path) if raw_path else OUT / "raw.json"
    lab = labels()
    pids = test_set()
    raw = json.loads(raw_path.read_text()) if raw_path.exists() else []
    if not raw:
        sys.exit(f"No answers yet in {raw_path}: run the test first (see the top of this file).")
    by = answers(raw)
    spent = sum(cents(r) for r in raw) / 100
    nruns = Counter(len(by.get(p, [])) for p in pids)
    L = ["# Hem close-up reading test (hem3)", "",
         f"{len(by)} photos answered of {len(pids)} labelled · runs per photo {dict(sorted(nruns.items()))} · "
         f"{sum(1 for r in raw if r.get('error'))} errors · spent ${spent:.3f}",
         f"Model {MODEL}, thinking off, temperature 0; prompt_hem3.txt + schema_hem3.json; one tight crop per call.",
         f"Pass bar: steady ≥ {BAR['steady']:.0%}, right ≥ {BAR['right']:.0%} when it answers, cant_see ≤ {BAR['cant_see']:.0%}.", ""]
    splits = defaultdict(list)
    for p in pids:
        for k, v in split_of(lab[p]).items():
            splits[v].append(p)
    order = ["mirror selfie", "propped/other", "straight/slim", "relaxed/wide", "leg unknown", "dark on dark", "not dark on dark"]
    passed = []
    for q in QS + [QB]:
        s = stats(by, lab, pids, q)
        ok = passes(s)
        if ok and q != QB:
            passed.append(q)
        L += [f"## {SHORT[q]} (`{q}`): {'PASSES' if ok else 'fails'}", "",
              "| Photos | n | Steady | Right when it answers | cant_see | Right when it says yes | Finds the yeses |",
              "|---|---|---|---|---|---|---|"]
        for name, ps in [("all", pids)] + [(k, splits[k]) for k in order if splits.get(k)]:
            t = stats(by, lab, ps, q)
            L.append(f"| {name} | {t['photos']} | {fmt(t['steady'], t['steady_n'])} | {fmt(t['right'], t['right_n'])} | "
                     f"{fmt(t['cant_see'])} | {fmt(t['yes_right'], t['yes_n'])} | {fmt(t['found'], t['found_n'])} |")
        L.append("")
    # who's in the photos (rule 7) and per-person accuracy on the combined answer set
    L += ["## Who's in the photos (rule 7)", ""]
    for (person, prof), n in sorted(Counter((lab[p].get("person"), lab[p].get("profile")) for p in pids).items()):
        L.append(f"- {person}: {prof} · {n} photos")
    L += ["", "## Unsteady photos (answers differ across runs)", ""]
    for p in pids:
        js = by.get(p, [])
        diff = [SHORT[q] + " " + "/".join(j.get(q) for j in js) for q in QS if len({j.get(q) for j in js}) > 1]
        if diff:
            L.append(f"- {p}: " + "; ".join(diff))
    L += ["", "## On paper: the creators' version with today's readings (no engine change)", ""]
    L += paper_estimate(by, pids, passed)
    txt = "\n".join(L) + "\n"
    if raw_path == OUT / "raw.json":
        (OUT / "report.md").write_text(txt)
    print(txt)


# ---------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--runs", type=int, default=3)
    ap.add_argument("--only", help="comma-separated photo id prefixes")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--budget", type=float, default=0.60, help="stop before the spend (all runs in raw.json) passes this, $")
    ap.add_argument("--prep-only", action="store_true", help="make the crops, print the photo count and the cost; no key")
    ap.add_argument("--dry-run", action="store_true", help="print the call list and the cost; no key, no calls")
    ap.add_argument("--all-crops", action="store_true", help="crop every cached photo (for labelling), not just the test set")
    ap.add_argument("--gold-pick", action="store_true", help="print the stratified gold candidates for labelling")
    ap.add_argument("--report", nargs="?", const="", help="re-analyze results/hem3/raw.json (or a given raw file); no calls")
    a = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    if a.report is not None:
        return report(a.report or None)
    if a.gold_pick:
        pick, sizes = gold_candidates()
        print(f"strata sizes: {sizes}")
        for k, v in pick.items():
            print(f"{k}: {' '.join(v)}")
        return
    pids = test_set()
    if a.all_crops or not pids:
        if not pids:
            print(f"No labelled photos in {LABELS.name} yet: cropping every cached photo for labelling.")
        pids_all = pool()
        geo = prep(pids_all)
        print(f"{sum(1 for g in geo.values() if g.get('status') == 'ok')} of {len(pids_all)} cached photos cropped into {CROPS}")
        if not pids:
            return
    if a.only:
        pids = [p for p in pids if any(p.startswith(x) for x in a.only.split(","))]
    geo = prep(pids)
    bad = {p: g["status"] for p, g in geo.items() if g.get("status") != "ok"}
    for p, s in bad.items():
        print(f"{p}: {s}; left out")
    pids = [p for p in pids if p not in bad]
    lab = labels()
    methods = Counter(geo[p].get("method") for p in pids)
    per, total, tin = estimate(len(pids), a.runs)
    print(f"{len(pids)} photos ready · crops: " + ", ".join(f"{k} {v}" for k, v in methods.items()))
    prov = Counter()
    for p in pids:
        fe = lab[p].get("from_earlier", "")
        prov["mapped from an earlier label"] += fe.count(": mapped")
        prov["by eye, overriding an earlier label"] += fe.count("earlier maps to")
        prov["by eye"] += fe.count(": eye") - fe.count("earlier maps to") + (3 if "all four: eye" in fe else 0)
    print("groups: " + ", ".join(f"{k} {v}" for k, v in sorted(Counter(group_of(p) for p in pids).items()))
          + " · answers labelled: " + ", ".join(f"{k} {v}" for k, v in prov.items()))
    print(f"estimate: ~{tin:.0f} tokens in + ~{OUT_TOKENS} out per call ≈ {100 * per:.3f}¢; "
          f"{len(pids)} photos × {a.runs} runs = {len(pids) * a.runs} calls ≈ ${total:.2f} (budget ${a.budget:.2f})")
    if total > a.budget:
        print(f"note: the estimate is over the budget; the run stops at ${a.budget:.2f}")
    if a.prep_only:
        return
    if a.dry_run:
        done = set()
        rp = OUT / "raw.json"
        if rp.exists():
            done = {(r["photo"], r["run"]) for r in json.loads(rp.read_text()) if r.get("json")}
        jobs = [(p, i) for i in range(a.runs) for p in pids if (p, i) not in done]
        print(f"dry run: {len(jobs)} calls would be sent ({len(done)} already done) ≈ ${per * len(jobs):.3f}")
        for p, i in jobs[:6]:
            print(f"  {p} run {i}: {geo[p]['source']} → crops/{p}.hem.jpg {geo[p]['size'][0]}×{geo[p]['size'][1]}")
        return
    run_calls(pids, a.runs, a.budget, a.workers)
    report()


if __name__ == "__main__":
    main()

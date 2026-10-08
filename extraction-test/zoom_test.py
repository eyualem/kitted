#!/usr/bin/env python3
"""Zoom test (DECISIONS-LOG #104): does sending close-ups of his body WITH the full photo read better?

Arms, all on the locked config (gemini-3.8-flash, thinking off, temperature 0, v3 schema), same hour:
  A  full frame only (the app's own prep: faces hidden, 1024 px)        = today
  B  full frame + upper-body and lower-body close-ups (from the pose)   = more pixels
  C  A + a boot definition line in the prompt                            = better words
  D  B + the boot line
Photos: his 11 Oct 8 photos (truth: inputs/phone-oct8/truth.csv), his 4 Oct 7 photos, the 12 mirror selfies.
Images are prepared by the app's own Swift (vision/bin/kmeasure zoom: Prep.locate + hideRegions + zoomRects).

  read -s GEMINI_API_KEY && export GEMINI_API_KEY
  /usr/bin/python3 zoom_test.py --runs 3 --out results/zoom1
  /usr/bin/python3 zoom_test.py --report results/zoom1      (re-analyze, no calls)
"""
import argparse, base64, csv, json, os, statistics, subprocess, sys, time, urllib.error, urllib.request
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import rubric

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
PROMPT = (HERE / "prompt.txt").read_text()
SCHEMA = json.loads((HERE / "schema.json").read_text())
MODEL = "gemini-3.8-flash"
PRICE_IN, PRICE_OUT = 0.75 / 1e6, 3.75 / 1e6  # $/token (INDEX.md)

_ZOOM = json.loads((HERE / "prompt_zoom.json").read_text())  # synced into the app (scripts/sync-gemini.mjs)
ZOOM_LINE = _ZOOM["three"]
# When the pose has no hips, the zoom arms send one close-up of the whole person instead.
ZOOM_LINE_BODY = _ZOOM["two"]
BOOT_LINE = ("- Boots: a boot whose shaft is hidden by the pant hem is still a boot; judge footwear by the toe box, "
             "sole and laces. \"work_boot\" = rugged lace-up boot with a thick lug sole; \"suede_chukka\" = "
             "ankle-high suede boot with 2-3 eyelets and a thin sole; \"chelsea_boot\" = elastic side panels, no laces.")
ARMS = {"A": (False, False), "B": (True, False), "C": (False, True), "D": (True, True)}


def prompt_for(boot: bool) -> str:
    if not boot:
        return PROMPT
    marker = "Return only JSON that matches the schema."
    return PROMPT.replace(marker, BOOT_LINE + "\n" + marker)


def photo_set(which: str = "phone"):
    """(id, source photo) for every test photo. phone: his Oct 8 kept copies (unblurred, from the pulls), his
    Oct 7 photos and the 12 mirror selfies. stock: the 40 stock photos (inputs/fitcheck-photos)."""
    out = []
    if which == "stock":
        for d in sorted((ROOT / "inputs" / "fitcheck-photos").iterdir()):
            if d.is_dir():
                for f in sorted(d.glob("*.jp*g")):
                    out.append((f"stock-{d.name}-{f.stem}", f))
        return out
    seen = set()
    with (ROOT / "inputs" / "phone-oct8" / "truth.csv").open() as f:
        for row in csv.DictReader(f):
            if row["photo"] in seen:
                continue
            seen.add(row["photo"])
            hits = sorted((ROOT / "screenshots" / "phone" / row["pull"] / "photos").glob(f"{row['photo']}*-photo.jpg"))
            if hits:
                out.append((f"oct8-{row['photo']}", hits[0]))
            else:
                print(f"missing kept photo for {row['photo']}")
    for d in sorted((ROOT / "inputs" / "phone-oct7").iterdir()):
        if d.is_dir() and (d / "before_mirror.jpg").exists():
            out.append((f"oct7-{d.name}", d / "before_mirror.jpg"))
    for d in sorted((ROOT / "inputs" / "mirror-fit-check-1").iterdir()):
        if d.is_dir():
            f = next(iter(sorted(d.glob("*.jp*g"))), None)
            if f:
                out.append((f"mirror-{d.name}", f))
    return out


def prepare(photos, cache: Path):
    cache.mkdir(parents=True, exist_ok=True)
    tool = HERE / "vision" / "bin" / "kmeasure"
    ready = {}
    for pid, src in photos:
        if not (cache / f"{pid}.json").exists():
            subprocess.run([str(tool), "zoom", str(src), str(cache), pid], check=True, capture_output=True)
        meta = json.loads((cache / f"{pid}.json").read_text())
        if meta.get("status") != "ok":
            print(f"{pid}: prep refused ({meta.get('status')}), skipped")
            continue
        if not all((cache / f"{pid}.{n}.jpg").exists() for n in ("full", "upper", "lower")):
            print(f"{pid}: no upper/lower split (pose {meta.get('pose')}); zoom arms send the body crop")
        ready[pid] = meta
    return ready


def images_for(pid, zoom, cache: Path):
    full = (cache / f"{pid}.full.jpg").read_bytes()
    if not zoom:
        return [full]
    parts = [cache / f"{pid}.upper.jpg", cache / f"{pid}.lower.jpg"]
    if all(p.exists() for p in parts):
        return [full] + [p.read_bytes() for p in parts]
    body = cache / f"{pid}.body.jpg"
    return [full, body.read_bytes()] if body.exists() else [full]


def call(key, prompt, images):
    parts = [{"text": prompt}]
    for i, img in enumerate(images):
        if len(images) > 1:
            parts.append({"text": f"Image {i + 1}:"})
        parts.append({"inline_data": {"mime_type": "image/jpeg", "data": base64.b64encode(img).decode()}})
    body = {"contents": [{"parts": parts}],
            "generationConfig": {"temperature": 0, "responseMimeType": "application/json", "responseSchema": SCHEMA,
                                 "thinkingConfig": {"thinkingBudget": 0}}}
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"
    req = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST",
                                 headers={"Content-Type": "application/json", "x-goog-api-key": key})
    for attempt in range(5):
        try:
            t0 = time.time()
            with urllib.request.urlopen(req, timeout=90) as r:
                data = json.load(r)
            secs = round(time.time() - t0, 2)
            c = data["candidates"][0]
            return {"json": json.loads(c["content"]["parts"][0]["text"]), "usage": data.get("usageMetadata", {}),
                    "seconds": secs, "finish": c.get("finishReason"), "model_version": data.get("modelVersion")}
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="ignore")[:300]
            if e.code in (429, 500, 503):
                time.sleep(10 * (attempt + 1)); continue
            return {"json": None, "error": f"{e.code} {msg}"}
        except (OSError, KeyError, json.JSONDecodeError) as e:
            time.sleep(3)
            last = str(e)
    return {"json": None, "error": "gave up"}


# ---------- analysis ----------
SLOT_CAT = {"top": "top", "outerwear": "outerwear", "bottom": "bottom", "footwear": "footwear"}


def primary(garments, category):
    g = [x for x in garments or [] if x.get("category") == category]
    return g[0] if g else None


def load_truth():
    rows = defaultdict(list)
    with (ROOT / "inputs" / "phone-oct8" / "truth.csv").open() as f:
        for row in csv.DictReader(f):
            if row["slot"] in SLOT_CAT and row["truth_type"]:
                rows[f"oct8-{row['photo']}"].append(row)
    return rows


def analyze(out: Path):
    results = json.loads((out / "raw.json").read_text())
    truth = load_truth()
    styles = rubric.parse_styles("minimalist:0.5,smart_casual:0.5")
    by = defaultdict(list)
    for r in results:
        by[(r["arm"], r["photo"])].append(r)
    lines = ["# Zoom test", "", f"Runs: {out.name}. Score = rubric.py ({rubric.RUBRIC_VERSION if hasattr(rubric, 'RUBRIC_VERSION') else 'v4'}), occasion everyday.", ""]
    summary = {}
    for arm in ARMS:
        photos = sorted({p for (a, p) in by if a == arm})
        if not photos:
            continue
        consistent, n_cons = 0, 0
        field_hits = defaultdict(lambda: [0, 0])
        secs, tin, tout, errors = [], [], [], 0
        per_photo = []
        for p in photos:
            runs = by[(arm, p)]
            scores = []
            for r in runs:
                if not r.get("json"):
                    errors += 1; continue
                sc = rubric.score(r["json"], occasion="everyday", styles=styles)
                if sc.get("overall") is not None:  # None: not rated (e.g. traditional or not fully clothed)
                    scores.append(sc["overall"])
                secs.append(r["seconds"]); tin.append(r["usage"].get("promptTokenCount", 0)); tout.append(r["usage"].get("candidatesTokenCount", 0))
                for t in truth.get(p, []):
                    g = primary(r["json"].get("garments"), SLOT_CAT[t["slot"]])
                    sub = g.get("subcategory") if g else None
                    ok_types = {t["truth_type"], *filter(None, t["also_ok"].split("|"))}
                    field_hits[f"{t['slot']} type"][0] += sub in ok_types; field_hits[f"{t['slot']} type"][1] += 1
                    if t["truth_color"]:
                        ok_c = {t["truth_color"], *filter(None, t["also_ok_color"].split("|"))}
                        field_hits["color"][0] += bool(g and g.get("color_family") in ok_c); field_hits["color"][1] += 1
                    for fld in ("leg_shape", "hem", "sleeve_end"):
                        if t.get(fld):
                            field_hits[fld][0] += bool(g and g.get(fld) == t[fld]); field_hits[fld][1] += 1
            if scores:
                med = statistics.median(scores)
                ok = all(abs(s - med) <= 0.5 for s in scores)
                consistent += ok; n_cons += 1
                per_photo.append((p, scores, ok))
        cost = statistics.mean(i * PRICE_IN + o * PRICE_OUT for i, o in zip(tin, tout)) if tin else 0
        summary[arm] = {"consistency": f"{consistent}/{n_cons}", "median_s": statistics.median(secs) if secs else None,
                        "p90_s": sorted(secs)[int(len(secs) * 0.9) - 1] if secs else None,
                        "tokens_in": statistics.mean(tin) if tin else 0, "tokens_out": statistics.mean(tout) if tout else 0,
                        "cents": round(cost * 100, 3), "errors": errors,
                        "fields": {k: f"{v[0]}/{v[1]} ({100 * v[0] // max(1, v[1])}%)" for k, v in sorted(field_hits.items())},
                        "unstable": [f"{p} {s}" for p, s, ok in per_photo if not ok]}
    lines.append("| Arm | Consistency | Median s | p90 s | Tokens in/out | ¢/check | Errors |")
    lines.append("|---|---|---|---|---|---|---|")
    for arm, s in summary.items():
        lines.append(f"| {arm} | {s['consistency']} | {s['median_s']} | {s['p90_s']} | {s['tokens_in']:.0f}/{s['tokens_out']:.0f} | {s['cents']} | {s['errors']} |")
    lines += ["", "## Accuracy on his Oct 8 photos (truth.csv; every run counts)", ""]
    keys = sorted({k for s in summary.values() for k in s["fields"]})
    lines.append("| Field | " + " | ".join(summary) + " |")
    lines.append("|---|" + "---|" * len(summary))
    for k in keys:
        lines.append(f"| {k} | " + " | ".join(summary[a]["fields"].get(k, "") for a in summary) + " |")
    lines += ["", "## Footwear as read (Oct 8 photos with boots)", ""]
    boots = [p for p, rows in truth.items() if any(r["slot"] == "footwear" and r["truth_type"] == "work_boot" for r in rows)]
    for arm in summary:
        c = Counter()
        for p in boots:
            for r in by[(arm, p)]:
                g = primary((r.get("json") or {}).get("garments"), "footwear")
                c[g.get("subcategory") if g else "none"] += 1
        lines.append(f"- {arm}: " + ", ".join(f"{k} ×{v}" for k, v in c.most_common()))
    lines += ["", "## Unstable photos (a run more than 0.5 from the median)", ""]
    for arm, s in summary.items():
        lines.append(f"- {arm}: " + ("; ".join(s["unstable"]) or "none"))
    (out / "report.md").write_text("\n".join(lines) + "\n")
    (out / "summary.json").write_text(json.dumps(summary, indent=1))
    print("\n".join(lines))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--runs", type=int, default=3)
    ap.add_argument("--arms", default="ABCD")
    ap.add_argument("--out", default=str(HERE / "results" / "zoom1"))
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--only", help="comma-separated photo id prefixes")
    ap.add_argument("--set", default="phone", choices=["phone", "stock"])
    ap.add_argument("--report", help="re-analyze this results folder; no calls")
    ap.add_argument("--prep-only", action="store_true")
    a = ap.parse_args()
    if a.report:
        return analyze(Path(a.report))
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    cache = out / "images"
    photos = photo_set(a.set)
    if a.only:
        photos = [p for p in photos if any(p[0].startswith(x) for x in a.only.split(","))]
    ready = prepare(photos, cache)
    print(f"{len(ready)} photos prepared in {cache}")
    if a.prep_only:
        return
    key = os.environ.get("GEMINI_API_KEY") or sys.exit("Set GEMINI_API_KEY first.")
    raw_path = out / "raw.json"
    results = json.loads(raw_path.read_text()) if raw_path.exists() else []
    done = {(r["arm"], r["photo"], r["run"]) for r in results if r.get("json")}
    results = [r for r in results if r.get("json")]
    jobs = [(arm, pid, i) for i in range(a.runs) for pid in ready for arm in a.arms if (arm, pid, i) not in done]
    print(f"{len(jobs)} calls")

    def run(job):
        arm, pid, i = job
        zoom, boot = ARMS[arm]
        imgs = images_for(pid, zoom, cache)
        line = {1: "", 2: "\n" + ZOOM_LINE_BODY, 3: "\n" + ZOOM_LINE}[len(imgs)]
        r = call(key, prompt_for(boot) + line, imgs)
        r.update({"arm": arm, "photo": pid, "run": i, "images": len(imgs)})
        return r

    with ThreadPoolExecutor(a.workers) as ex:
        for n, r in enumerate(ex.map(run, jobs), 1):
            results.append(r)
            if r.get("error"):
                print(f"  {r['arm']} {r['photo']} run {r['run']}: {r['error']}")
            if n % 12 == 0 or n == len(jobs):
                raw_path.write_text(json.dumps(results, indent=1))
                print(f"  {n}/{len(jobs)}")
    raw_path.write_text(json.dumps(results, indent=1))
    (out / "manifest.json").write_text(json.dumps({"model": MODEL, "runs": a.runs, "arms": a.arms, "zoom_line": ZOOM_LINE,
                                                    "boot_line": BOOT_LINE, "finished": time.strftime("%Y-%m-%d %H:%M:%S")}, indent=1))
    analyze(out)


if __name__ == "__main__":
    main()

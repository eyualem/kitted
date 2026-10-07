#!/usr/bin/env python3
"""Extraction test: can a budget vision model read outfits reliably enough to score them?

What it does:
  1. Sends each outfit photo to a vision model N times (default 5) and asks for a
     fixed-category description of the garments (never a score).
  2. Scores each description with the v1 rubric in plain code (rubric.py).
  3. Reports: score consistency per photo, field agreement, whether the "after fix"
     photo is detected as fixed, and propped-camera vs mirror results.

Pass bars (from the spec):
  - 90%+ of photos: every run's score within +/-0.5 of that photo's median score
  - 80%+ of fixes detected in the "after" photo

Usage:
  export GEMINI_API_KEY=...        (you set this yourself in Terminal; never paste it into chat)
  python3 run_test.py              (real run)
  python3 run_test.py --selftest   (no API calls; checks the scoring + report code)
Options: --runs 5  --model gemini-3.8-flash  --photos photos  --out results/<test-name>
"""
import argparse, base64, csv, json, os, statistics, subprocess, sys, tempfile, time, urllib.request, urllib.error
from collections import Counter, defaultdict
from pathlib import Path

import hashlib
import rubric
import v4

HERE = Path(__file__).resolve().parent
FORMATS = {  # answer format: (prompt, schema)
    "v3": ((HERE / "prompt.txt").read_text(), json.loads((HERE / "schema.json").read_text())),
    "v4": ((HERE / "prompt_v4.txt").read_text(), json.loads((HERE / "schema_v4.json").read_text())),
}


def prepare_image(path: Path, px: int = 1024) -> bytes:
    """Resize to `px` long edge (default 1024) as JPEG using macOS `sips` (strips most metadata)."""
    with tempfile.TemporaryDirectory() as d:
        out = Path(d) / "img.jpg"
        subprocess.run(["sips", "-s", "format", "jpeg", "-Z", str(px), str(path), "--out", str(out)],
                       check=True, capture_output=True)
        return out.read_bytes()


THINKING = {"default": None, "off": {"thinkingBudget": 0}, "low": {"thinkingLevel": "low"},
            "medium": {"thinkingLevel": "medium"}, "high": {"thinkingLevel": "high"}}


def call_gemini(model: str, key: str, img: bytes, use_schema: bool = True, thinking: str = "default", fmt: str = "v3") -> dict:
    """One extraction call. Returns the v3-shaped extraction plus timing: seconds_api is the
    successful attempt only; retry waits are excluded (they show up in seconds_total)."""
    prompt, schema = FORMATS[fmt]
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    gen = {"temperature": 0, "responseMimeType": "application/json"}
    if THINKING.get(thinking):
        gen["thinkingConfig"] = THINKING[thinking]
    if use_schema:
        gen["responseSchema"] = schema
    body = {"contents": [{"parts": [{"text": prompt},
                                    {"inline_data": {"mime_type": "image/jpeg", "data": base64.b64encode(img).decode()}}]}],
            "generationConfig": gen}
    req = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST",
                                 headers={"Content-Type": "application/json", "x-goog-api-key": key})
    for attempt in range(4):
        try:
            t0 = time.time()
            with urllib.request.urlopen(req, timeout=90) as r:
                data = json.load(r)
            api_secs = round(time.time() - t0, 2)
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            usage = data.get("usageMetadata", {})
            answer = json.loads(text)
            extraction = v4.to_extraction(answer) if fmt == "v4" else answer
            return {"json": extraction, "raw": answer if fmt == "v4" else None, "usage": usage,
                    "seconds_api": api_secs, "attempts": attempt + 1, "model_version": data.get("modelVersion"),
                    "finish_reason": data["candidates"][0].get("finishReason")}
        except urllib.error.HTTPError as e:
            body = e.read().decode(errors="ignore"); msg = body[:400]
            if e.code == 400 and use_schema and "schema" in msg.lower():
                print("   schema rejected by API; retrying with schema in prompt only")
                return call_gemini(model, key, img, use_schema=False, thinking=thinking, fmt=fmt)
            if e.code == 429 and "PerDay" in body:
                raise SystemExit("Daily free-tier limit reached for this model (20 calls/day). Turn on billing in AI Studio, then re-run.")
            if e.code in (429, 500, 503):
                wait = 20 * (attempt + 1)
                print(f"   API {e.code} (rate limit or busy); waiting {wait}s")
                time.sleep(wait); continue
            raise SystemExit(f"API error {e.code}: {msg}")
        except urllib.error.URLError as e:
            if "CERTIFICATE_VERIFY_FAILED" in str(e.reason):
                raise SystemExit("Python can't verify HTTPS certificates. Run once:\n"
                                 '  open "/Applications/Python 3.14/Install Certificates.command"\nthen re-run this test.')
            if attempt == 3:
                raise SystemExit(f"Network error (check your internet connection): {e.reason}")
            print(f"   network error ({e.reason}); retrying"); time.sleep(10)
        except (KeyError, json.JSONDecodeError) as e:
            if attempt == 3:
                return {"json": None, "error": str(e), "usage": {}}
            time.sleep(2)
    return {"json": None, "error": "gave up", "usage": {}}


def load_fixes(path: Path) -> dict:
    fixes = {}
    if path.exists():
        with path.open() as f:
            for row in csv.DictReader(f):
                if row.get("outfit_id"):
                    fixes[row["outfit_id"].strip()] = row
    return fixes


def find_photos(root: Path):
    """photos/<outfit_id>/<before|after>_<propped|mirror|other>.(jpg|jpeg|png|heic)"""
    items = []
    for d in sorted(p for p in root.iterdir() if p.is_dir()):
        for f in sorted(d.iterdir()):
            if f.suffix.lower() not in (".jpg", ".jpeg", ".png", ".heic"):
                continue
            stem = f.stem.lower()
            stage = "after" if stem.startswith("after") else "before"
            method = next((m for m in ("mirror", "phone", "street", "studio", "propped") if m in stem), "other")
            items.append({"outfit": d.name, "stage": stage, "method": method, "path": f})
    return items


# ---------- analysis ----------
FIELDS = ["subcategory", "color_family", "saturation", "pattern", "pattern_scale", "logo", "volume", "leg_shape", "hem",
          "tucked", "length", "sleeve_end", "strain", "condition", "distressed_by_design", "shows_below_outer", "certainty"]


def primary(garments, category):
    g = [x for x in garments if x.get("category") == category]
    return g[0] if g else None


def field_agreement(runs):
    """Share of runs agreeing with the most common value, per category.field."""
    out = {}
    for cat in ["top", "bottom", "footwear", "outerwear"]:
        for fld in FIELDS:
            vals = []
            for r in runs:
                g = primary(r["garments"], cat) if r else None
                if g is not None and fld in g:
                    vals.append(str(g[fld]))
            if len(vals) >= 2:
                most = Counter(vals).most_common(1)[0][1]
                out[f"{cat}.{fld}"] = most / len(vals)
    return out


def swap_key(r, category):
    """Type + colour, so a colour-only swap (white shirt -> black shirt) still counts as a change."""
    g = primary(r["garments"], category)
    return (g.get("subcategory"), g.get("color_family")) if g else None


def layer_key(r):
    """(number of layers, which outer layers). A coat closed over a blazer hides it, so the
    count can stay the same while the outer layer changes (p03); both count as a change."""
    layers = [g for g in r["garments"] if g.get("category") in ("top", "outerwear", "layer")]
    return (len(layers), frozenset(g.get("subcategory") for g in layers if g.get("category") == "outerwear"))


def fix_detected(fix_type, before_runs, after_runs):
    """Did the extraction notice the fix? Compares the most common value before vs after."""
    def mode(runs, getter):
        vals = [getter(r) for r in runs if r]
        vals = [v for v in vals if v is not None]
        return Counter(vals).most_common(1)[0][0] if vals else None
    get = {
        "cuffed": lambda r: (primary(r["garments"], "bottom") or {}).get("hem"),
        "tucked": lambda r: (primary(r["garments"], "top") or {}).get("tucked"),
        "removed_layer": layer_key,
        "added_layer": layer_key,
        "swapped_shoes": lambda r: swap_key(r, "footwear"),
        "swapped_top": lambda r: swap_key(r, "top"),
        "swapped_bottom": lambda r: swap_key(r, "bottom"),
        "rolled_sleeves": lambda r: next((g.get("sleeve_end") for g in r["garments"] if g.get("category") in ("outerwear", "top") and g.get("sleeve_end") not in (None, "na")), None),
    }.get(fix_type)
    if not get:
        return None
    b, a = mode(before_runs, get), mode(after_runs, get)
    if fix_type == "cuffed":
        return a in ("cuffed", "no_break", "slight_break", "cropped") and a != b
    if fix_type == "tucked":
        return a in ("full", "half") and a != b
    if fix_type == "rolled_sleeves":
        return a == "above_wrist" and a != b
    if fix_type == "removed_layer":
        return a is not None and b is not None and (a[0] < b[0] or (a[0] == b[0] and bool(b[1] - a[1])))
    if fix_type == "added_layer":
        return a is not None and b is not None and (a[0] > b[0] or (a[0] == b[0] and bool(a[1] - b[1])))
    return a is not None and a != b


def analyze(results, fixes, out_dir: Path):
    by_photo = defaultdict(list)
    for r in results:
        by_photo[(r["outfit"], r["stage"], r["method"], r["file"])].append(r)

    rows, consistent, total_scored = [], 0, 0
    method_stats = defaultdict(lambda: [0, 0])
    agreement_all = defaultdict(list)
    for key, runs in sorted(by_photo.items()):
        outfit, stage, method, fname = key
        scores = [x["score"]["overall"] for x in runs if x.get("score") and x["score"]["overall"] is not None]
        exts = [x.get("extraction") for x in runs]
        for k, v in field_agreement([e for e in exts if e]).items():
            agreement_all[k].append(v)
        if len(scores) >= 3:
            med = statistics.median(scores)
            ok = all(abs(s - med) <= 0.5 for s in scores)
            total_scored += 1; consistent += ok
            method_stats[method][0] += ok; method_stats[method][1] += 1
        else:
            med, ok = None, None
        partial = sum(1 for x in runs if x.get("score") and x["score"].get("partial"))
        rows.append([outfit, stage, method, fname, len(runs), scores, med, ok, partial])

    fix_rows, fix_hits, fix_total = [], 0, 0
    for outfit, info in sorted(fixes.items()):
        ft = info.get("fix_type", "").strip()
        for method in ("propped", "phone", "mirror", "street", "studio", "other"):
            b = [x.get("extraction") for x in results if x["outfit"] == outfit and x["stage"] == "before" and x["method"] == method]
            a = [x.get("extraction") for x in results if x["outfit"] == outfit and x["stage"] == "after" and x["method"] == method]
            if not b or not a:
                continue
            det = fix_detected(ft, b, a)
            bs = [x["score"]["overall"] for x in results if x["outfit"] == outfit and x["stage"] == "before" and x["method"] == method and x.get("score") and x["score"]["overall"] is not None]
            as_ = [x["score"]["overall"] for x in results if x["outfit"] == outfit and x["stage"] == "after" and x["method"] == method and x.get("score") and x["score"]["overall"] is not None]
            delta = (statistics.median(as_) - statistics.median(bs)) if bs and as_ else None
            if det is not None:
                fix_total += 1; fix_hits += det
            fix_rows.append([outfit, method, ft, det, delta])

    failed = sum(1 for x in results if not x.get("score"))
    pct_consistent = consistent / total_scored if total_scored else 0
    pct_fix = fix_hits / fix_total if fix_total else 0
    tokens = [x.get("usage", {}) for x in results]
    in_tok = sum(t.get("promptTokenCount", 0) for t in tokens)
    out_tok = sum(t.get("candidatesTokenCount", 0) + t.get("thoughtsTokenCount", 0) for t in tokens)

    lines = ["# Extraction test report", "",
             f"- Photos scored: **{total_scored}** (photos with fewer than 3 scored runs are left out), runs: **{len(results)}**, failed runs: **{failed}**",
             f"- **Score consistency:** {consistent}/{total_scored} photos had every run within ±0.5 of the median = **{pct_consistent:.0%}** (pass bar 90%) → **{'PASS' if pct_consistent >= 0.9 else 'FAIL'}**",
             f"- **Fix detection:** {fix_hits}/{fix_total} = **{pct_fix:.0%}** (pass bar 80%) → **{'PASS' if fix_total and pct_fix >= 0.8 else ('NO DATA' if not fix_total else 'FAIL')}**",
             f"- Tokens used: {in_tok:,} in / {out_tok:,} out (multiply by your model's list price to get the test cost; divide by runs for cost per check)"]
    api = sorted(x["seconds_api"] for x in results if x.get("seconds_api"))
    secs = sorted(x["seconds"] for x in results if x.get("seconds"))
    if api:
        pct = lambda q: api[min(len(api) - 1, int(q * len(api)))]
        lines.append(f"- Seconds per call (API only): median **{statistics.median(api)}**, p90 **{pct(0.9)}**, p95 {pct(0.95)}, "
                     f"slowest {api[-1]}; under 5 s: {sum(a <= 5 for a in api) / len(api):.0%}, under 8 s: {sum(a <= 8 for a in api) / len(api):.0%}")
    if secs:
        lines.append(f"- Seconds per call including retry waits: median {statistics.median(secs)}, slowest {secs[-1]}")
    vis = sorted(t.get("candidatesTokenCount", 0) for t in tokens if t)
    if vis:
        lines.append(f"- Visible answer tokens: median {statistics.median(vis)}, p90 {vis[min(len(vis) - 1, int(0.9 * len(vis)))]}; "
                     f"thinking tokens median {statistics.median(t.get('thoughtsTokenCount', 0) for t in tokens if t)}")
    lines.append("")
    lines += ["## Propped camera vs mirror", "", "| Method | Consistent photos | Share |", "|---|---|---|"]
    for m, (ok, n) in sorted(method_stats.items()):
        lines.append(f"| {m} | {ok}/{n} | {ok/n:.0%} |")
    lines += ["", "## Per photo", "", "| Outfit | Stage | Method | File | Runs | Scores | Median | Consistent | Partial runs |", "|---|---|---|---|---|---|---|---|---|"]
    for r in rows:
        lines.append("| " + " | ".join(str(x) for x in r) + " |")
    lines += ["", "## Fix detection", "", "| Outfit | Method | Fix | Detected | Score change (median after − before) |", "|---|---|---|---|---|"]
    for r in fix_rows:
        lines.append("| " + " | ".join(str(x) for x in r) + " |")
    lines += ["", "## Field agreement (share of runs agreeing; lower = less reliable)", "", "| Field | Average agreement |", "|---|---|"]
    for k, v in sorted(agreement_all.items(), key=lambda kv: statistics.mean(kv[1])):
        lines.append(f"| {k} | {statistics.mean(v):.0%} |")
    lines += ["", "Fields below ~80% agreement should be **advice only** (no score impact) in v1."]
    (out_dir / "report.md").write_text("\n".join(lines))
    print("\n".join(lines[:8]))
    print(f"\nFull report: {out_dir / 'report.md'}")


def selftest(out_dir: Path):
    """No API: fake extractions with small random noise to exercise scoring + report."""
    import random
    random.seed(1)
    base = {"scene": {"framing": "full_body", "shoes_visible": True, "people_count": 1, "mirror_selfie": False, "lighting": "good", "clothed": "fully"},
            "garments": [
                {"category": "top", "subcategory": "hoodie", "color_family": "grey", "pattern": "solid", "logo": "none", "volume": 4, "leg_shape": "na", "hem": "na", "tucked": "none", "condition": "clean", "certainty": "clear"},
                {"category": "bottom", "subcategory": "jeans", "color_family": "denim_dark", "pattern": "solid", "logo": "none", "volume": 3, "leg_shape": "skinny", "hem": "pooling", "tucked": "na", "condition": "clean", "certainty": "clear"},
                {"category": "footwear", "subcategory": "performance_runner", "color_family": "white", "pattern": "solid", "logo": "small", "volume": 3, "leg_shape": "na", "hem": "na", "tucked": "na", "condition": "clean", "certainty": "clear"}]}
    results = []
    for stage in ("before", "after"):
        for method in ("propped", "mirror"):
            for i in range(5):
                e = json.loads(json.dumps(base))
                if stage == "after":
                    e["garments"][1]["hem"] = "cuffed"
                if method == "mirror" and random.random() < 0.4:
                    e["garments"][1]["hem"] = random.choice(["full_break", "pooling", "slight_break"])
                    e["scene"]["mirror_selfie"] = True
                s = rubric.score(e, occasion="class", styles={"minimalist": 0.6, "streetwear": 0.4})
                results.append({"outfit": "demo1", "stage": stage, "method": method, "file": f"{stage}_{method}.jpg", "run": i, "extraction": e, "score": s, "usage": {}})
    analyze(results, {"demo1": {"outfit_id": "demo1", "fix_type": "cuffed"}}, out_dir)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--runs", type=int, default=5)
    ap.add_argument("--model", default=os.environ.get("GEMINI_MODEL", "gemini-3.8-flash"))
    ap.add_argument("--photos", default=str(HERE / "photos"))
    ap.add_argument("--occasion", default="everyday")
    ap.add_argument("--delay", type=float, default=6, help="seconds between calls (free tier is ~10 calls/min)")
    ap.add_argument("--out", help="results folder (default: results/latest)")
    ap.add_argument("--thinking", default="off", choices=list(THINKING), help="model thinking: off (locked Oct 6), default, low, medium, high")
    ap.add_argument("--image-px", type=int, default=1024, help="long edge of the photo sent to the model")
    ap.add_argument("--format", default="v3", choices=list(FORMATS), help="answer format: v3 (original) or v4 (short slots)")
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args()
    out_dir = Path(args.out) if args.out else HERE / "results" / ("selftest" if args.selftest else "latest")
    out_dir.mkdir(parents=True, exist_ok=True)
    if args.selftest:
        return selftest(out_dir)
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        sys.exit("Set GEMINI_API_KEY in Terminal first (see README.md).")
    photos = find_photos(Path(args.photos))
    if not photos:
        sys.exit(f"No photos found in {args.photos}. See README.md for the folder layout.")
    photo_fixes = Path(args.photos) / "fixes.csv"
    fixes = load_fixes(photo_fixes if photo_fixes.exists() else HERE / "fixes.csv")
    print(f"Using fixes from: {photo_fixes if photo_fixes.exists() else HERE / 'fixes.csv'} ({len(fixes)} pairs)")
    styles = rubric.parse_styles(os.environ.get("TEST_STYLES", "minimalist:0.5,smart_casual:0.5"))
    digest = lambda path: hashlib.sha256(Path(path).read_bytes()).hexdigest()[:12]
    manifest = {"model": args.model, "thinking": args.thinking, "format": args.format, "image_px": args.image_px,
                "runs": args.runs, "photos": str(Path(args.photos).resolve()), "photo_count": len(photos),
                "styles": styles, "default_occasion": args.occasion, "started": time.strftime("%Y-%m-%d %H:%M:%S"),
                "prompt_sha": digest(HERE / ("prompt_v4.txt" if args.format == "v4" else "prompt.txt")),
                "schema_sha": digest(HERE / ("schema_v4.json" if args.format == "v4" else "schema.json")),
                "rubric_sha": digest(HERE / "rubric.py")}
    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=1))
    results = []
    for p in photos:
        print(f"{p['outfit']}/{p['path'].name} ({p['stage']}, {p['method']})")
        img = prepare_image(p["path"], args.image_px)
        occ = (fixes.get(p["outfit"], {}) or {}).get("occasion") or args.occasion
        for i in range(args.runs):
            t0 = time.time()
            r = call_gemini(args.model, key, img, thinking=args.thinking, fmt=args.format)
            secs = round(time.time() - t0, 1)
            time.sleep(args.delay)
            ext = r.get("json")
            sc = rubric.score(ext, occasion=occ, styles=styles) if ext else None
            results.append({"outfit": p["outfit"], "stage": p["stage"], "method": p["method"], "file": p["path"].name,
                            "run": i, "extraction": ext, "score": sc, "usage": r.get("usage", {}), "error": r.get("error"), "seconds": secs,
                            "seconds_api": r.get("seconds_api"), "attempts": r.get("attempts"), "raw": r.get("raw"),
                            "model_version": r.get("model_version"), "finish_reason": r.get("finish_reason")})
            print(f"   run {i+1}: {sc['overall'] if sc else 'no score'}" + (" (partial)" if sc and sc.get('partial') else "") + f"  [{r.get('seconds_api', secs)}s]")
            (out_dir / "raw_results.json").write_text(json.dumps(results, indent=1, default=str))
    analyze(results, fixes, out_dir)
    manifest["finished"] = time.strftime("%Y-%m-%d %H:%M:%S")
    manifest["model_versions"] = sorted({x["model_version"] for x in results if x.get("model_version")})
    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=1))


if __name__ == "__main__":
    main()

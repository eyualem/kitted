"""Closet-call test (founder-approved Oct 8, DECISIONS-LOG #82): does the separate closet call return the
same details for the same photo, every time?

For each photo it takes the locked v3 scoring reading (run 0 of the lock-in or same-day v3 run), sends the
closet prompt with a stub list built ONLY from enum values (never free text), and asks for shade, lightness,
details, logo text, sleeve length, shoe profile, denim wear and a box per garment. Runs each photo N times.

Pass bars (from the closet plan): index-alignment errors 0 · lightness agreement >= 90% · shade-key
agreement >= 85% · details Jaccard >= 0.85 · logo brand agreement >= 90% · box IoU between runs >= 0.8 ·
median <= 5 s. Also: the founder's ph1 hoodie must come back as a grey shade, never light grey.

Run from extraction-test/ (billing on):
  export GEMINI_API_KEY=...   (never paste it into chat)
  /usr/bin/python3 closet_test.py --runs 3 --out results/closet1
Re-analyze saved results without calls:  /usr/bin/python3 closet_test.py --analyze results/closet1
"""
import argparse, base64, json, os, statistics, sys, time, urllib.error, urllib.request
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from run_test import prepare_image  # noqa: E402

PROMPT = (HERE / "prompt_closet_v1.txt").read_text()
SCHEMA = json.loads((HERE / "schema_closet_v1.json").read_text())
SETS = [  # (photo root, scoring readings to build stubs from)
    (HERE.parent / "inputs/fitcheck-photos", HERE / "results/lockin-oct6/B-stock/raw_results.json"),
    (HERE.parent / "inputs/mirror-fit-check-1", HERE / "results/lockin-oct6/B-mirror/raw_results.json"),
    (HERE.parent / "inputs/phone-oct7", HERE / "results/test5-phone-4-v3b/raw_results.json"),
]
SLOTS = ("top", "outerwear", "bottom", "footwear")
STEP_WORDS = {"light": "light", "pale": "light", "ecru": "light", "stone": "light", "medium": "mid", "mid": "mid",
              "dark": "dark", "deep": "dark", "charcoal": "dark", "black": "dark", "navy": "dark", "raw": "dark"}
FINISH_WORDS = {"heather", "heathered", "washed", "faded", "raw", "acid", "vintage", "melange"}


def stubs_for(reading):
    """[(index, garment)] for closet garments, in reading order; enum values only."""
    out = []
    for g in reading.get("garments", []):
        if g.get("category") in SLOTS and g.get("certainty") != "unsure":
            out.append((len(out), g))
    return out


def stub_text(stubs):
    return "\n".join(f"[{i}] {g.get('category')} · {g.get('subcategory')} · {g.get('color_family')}" for i, g in stubs)


def call(key, img, stubs, model="gemini-3.8-flash"):
    body = {"contents": [{"parts": [{"text": PROMPT.replace("{STUBS}", stub_text(stubs))},
                                    {"inline_data": {"mime_type": "image/jpeg", "data": base64.b64encode(img).decode()}}]}],
            "generationConfig": {"temperature": 0, "responseMimeType": "application/json", "responseSchema": SCHEMA,
                                 "thinkingConfig": {"thinkingBudget": 0}}}
    req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                                 data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "x-goog-api-key": key})
    for attempt in range(4):
        try:
            t0 = time.time()
            with urllib.request.urlopen(req, timeout=60) as r:
                d = json.load(r)
            secs = round(time.time() - t0, 2)
            return {"json": json.loads(d["candidates"][0]["content"]["parts"][0]["text"]), "seconds": secs,
                    "usage": d.get("usageMetadata", {}), "finish": d["candidates"][0].get("finishReason")}
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 503) and attempt < 3:
                time.sleep(20 * (attempt + 1)); continue
            raise SystemExit(f"API error {e.code}: {e.read().decode(errors='ignore')[:300]}")
        except (OSError, KeyError, json.JSONDecodeError) as e:
            if attempt == 3:
                return {"json": None, "error": str(e)}
            time.sleep(5)


def shade_key(s):
    words = [w for w in (s or "").lower().replace("-", " ").split() if w.isalpha()]
    step = next((STEP_WORDS[w] for w in words if w in STEP_WORDS), None)
    finish = next((w for w in words if w in FINISH_WORDS), None)
    return (step, finish)


def brand(t):
    t = (t or "").strip().lower()
    return t if t in ("none", "unreadable", "") else t.split()[0]


def iou(a, b):
    if len(a) != 4 or len(b) != 4:
        return None
    y0, x0, y1, x1 = max(a[0], b[0]), max(a[1], b[1]), min(a[2], b[2]), min(a[3], b[3])
    inter = max(0, y1 - y0) * max(0, x1 - x0)
    area = lambda r: max(0, r[2] - r[0]) * max(0, r[3] - r[1])
    u = area(a) + area(b) - inter
    return inter / u if u else None


def jaccard(a, b):
    a, b = set(a or []), set(b or [])
    return 1.0 if not a and not b else len(a & b) / len(a | b)


def analyze(out_dir):
    rows = json.loads((out_dir / "raw.json").read_text())
    by = defaultdict(list)
    for r in rows:
        by[r["photo"]].append(r)
    agree = defaultdict(lambda: [0, 0]); jac, ious, secs, outt, align_err = [], [], [], [], 0
    shade_examples = []
    for photo, runs in by.items():
        n = len(runs[0]["stubs"])
        for r in runs:
            if r.get("json") is None:
                align_err += 1; continue
            idx = [g.get("i") for g in r["json"].get("garments", [])]
            if sorted(idx) != list(range(n)):
                align_err += 1
            secs.append(r["seconds"]); outt.append(r["usage"].get("candidatesTokenCount", 0))
        ok = [r for r in runs if r.get("json")]
        for i in range(n):
            gs = [next((g for g in r["json"]["garments"] if g.get("i") == i), None) for r in ok]
            gs = [g for g in gs if g]
            if len(gs) < 2:
                continue
            for f, key in (("lightness", lambda g: g.get("lightness")), ("shade_key", lambda g: shade_key(g.get("shade"))),
                           ("shade_text", lambda g: (g.get("shade") or "").lower().strip()), ("brand", lambda g: brand(g.get("logo_text"))),
                           ("visible", lambda g: g.get("visible")), ("sleeve", lambda g: g.get("sleeve_length")),
                           ("shoe_profile", lambda g: g.get("shoe_profile")), ("denim_wear", lambda g: g.get("denim_wear"))):
                agree[f][1] += 1
                agree[f][0] += len({json.dumps(key(g)) for g in gs}) == 1
            for a in range(len(gs)):
                for b in range(a + 1, len(gs)):
                    jac.append(jaccard(gs[a].get("details"), gs[b].get("details")))
                    v = iou(gs[a].get("box_2d") or [], gs[b].get("box_2d") or [])
                    if v is not None:
                        ious.append(v)
            if len({g.get("shade") for g in gs}) > 1 and len(shade_examples) < 12:
                shade_examples.append(f"{photo}[{i}] {runs[0]['stubs'][i][1]}: " + " / ".join(g.get("shade", "") for g in gs))
    pct = lambda f: f"{agree[f][0]}/{agree[f][1]} ({100 * agree[f][0] / max(1, agree[f][1]):.0f}%)"
    lines = [f"# Closet call v1 · {len(by)} photos · {len(rows)} calls", "",
             f"- index-alignment errors: **{align_err}** (bar 0)",
             f"- lightness agreement: **{pct('lightness')}** (bar 90%)",
             f"- shade-key agreement (step + finish words): **{pct('shade_key')}** (bar 85%); raw shade text: {pct('shade_text')}",
             f"- details Jaccard between runs: **{statistics.mean(jac):.2f}** (bar 0.85)" if jac else "- details: n/a",
             f"- logo brand agreement: **{pct('brand')}** (bar 90%)",
             f"- box IoU between runs: median **{statistics.median(ious):.2f}**, share ≥ 0.8: {sum(v >= 0.8 for v in ious) / len(ious):.0%} (bar median 0.8)" if ious else "- boxes: n/a",
             f"- visible / sleeve / shoe profile / denim wear agreement: {pct('visible')} · {pct('sleeve')} · {pct('shoe_profile')} · {pct('denim_wear')}",
             f"- median {statistics.median(secs):.2f} s · p90 {sorted(secs)[int(len(secs) * 0.9) - 1]:.2f} s (bar 5 s) · median output {statistics.median(outt):.0f} tokens",
             "", "## Founder's ph1 hoodie (truth: medium grey Nike pullover hoodie with front pouch)"]
    for r in by.get("ph1/before_mirror.jpg", []):
        g = next((g for g in (r.get("json") or {}).get("garments", []) if g.get("i") == 0), None)
        if g:
            lines.append(f"- run {r['run']}: shade '{g.get('shade')}' · {g.get('lightness')} · logo '{g.get('logo_text')}' · {g.get('details')}")
    lines += ["", "## Shade text that varied between runs (examples)"] + [f"- {e}" for e in shade_examples]
    (out_dir / "report.md").write_text("\n".join(lines) + "\n")
    print("\n".join(lines))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--runs", type=int, default=3)
    ap.add_argument("--out", default="results/closet1")
    ap.add_argument("--analyze", help="re-analyze a results folder without calling the API")
    args = ap.parse_args()
    if args.analyze:
        return analyze(HERE / args.analyze)
    key = os.environ.get("GEMINI_API_KEY") or sys.exit("Set GEMINI_API_KEY in Terminal first.")
    out_dir = HERE / args.out; out_dir.mkdir(parents=True, exist_ok=True)
    rows = []
    for root, readings_file in SETS:
        readings = {(r["outfit"], r["file"]): r["extraction"] for r in json.loads(readings_file.read_text())
                    if r.get("run") == 0 and r.get("extraction")}
        for (outfit, file), reading in sorted(readings.items()):
            path = root / outfit / file
            if not path.exists():
                continue
            img, stubs = prepare_image(path, 1024), stubs_for(reading)
            for i in range(args.runs):
                r = call(key, img, stubs)
                rows.append({"photo": f"{outfit}/{file}", "run": i, "stubs": stubs, **r})
                print(f"{outfit}/{file} run {i + 1}: {r.get('seconds')} s", flush=True)
                (out_dir / "raw.json").write_text(json.dumps(rows, indent=1))
                time.sleep(1)
    analyze(out_dir)


if __name__ == "__main__":
    main()

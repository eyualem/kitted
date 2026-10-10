#!/usr/bin/env python3
"""Reading batch 1 flip test (rubric/research/parts/SPEC.md "What it needs", batch 1; DECISIONS-LOG #197).

Arms, both the app's live config (gemini-3.8-flash, thinking off, temperature 0, close-ups on = zoom arm B):
  A   control: prompt.txt + schema.json (what the app sends today) + the close-up line
  B1  batch 1: prompt_b1.txt + schema_b1.json (+ hem_at, under_shows, shoulder_seam, lightness, scene.pose,
      three new sleeve_end values) + the same close-up line
Photos: fit_ruler.photo_set() (every phone pull, the latest pull wins; Oct 7; 12 mirror; stock), prepared by the
app's own Swift (vision/bin/kmeasure zoom: Prep.locate with the #188 outline fix, hideRegions, zoomRects).

  export GEMINI_API_KEY=...            (never printed or written)
  /usr/bin/python3 b1_test.py --prep-only
  /usr/bin/python3 b1_test.py --runs 1 --only phone-0d39d6,stock-s01 --quiet     (pilot: prints usage only)
  /usr/bin/python3 b1_test.py --runs 3 --quiet
  /usr/bin/python3 b1_analyze.py                                                 (report)
"""
import argparse, base64, json, os, sys, time, urllib.error, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import fit_ruler
import zoom_test

HERE = Path(__file__).resolve().parent
OUT = HERE / "results" / "b1"
MODEL = "gemini-3.8-flash"
PRICE_IN, PRICE_OUT = 0.75 / 1e6, 3.75 / 1e6
ARMS = {
    "A": ((HERE / "prompt.txt").read_text(), json.loads((HERE / "schema.json").read_text())),
    "B1": ((HERE / "prompt_b1.txt").read_text(), json.loads((HERE / "schema_b1.json").read_text())),
}


def call(key, prompt, schema, images):
    parts = [{"text": prompt}]
    for i, img in enumerate(images):
        if len(images) > 1:
            parts.append({"text": f"Image {i + 1}:"})
        parts.append({"inline_data": {"mime_type": "image/jpeg", "data": base64.b64encode(img).decode()}})
    body = {"contents": [{"parts": parts}],
            "generationConfig": {"temperature": 0, "responseMimeType": "application/json", "responseSchema": schema,
                                 "thinkingConfig": {"thinkingBudget": 0}}}
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"
    req = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST",
                                 headers={"Content-Type": "application/json", "x-goog-api-key": key})
    last = ""
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
            msg = e.read().decode(errors="ignore")[:200]
            if e.code in (429, 500, 503):
                time.sleep(10 * (attempt + 1)); continue
            return {"json": None, "error": f"{e.code} {msg}"}
        except (OSError, KeyError, json.JSONDecodeError) as e:
            last = type(e).__name__
            time.sleep(3)
    return {"json": None, "error": f"gave up ({last})"}


def cents(r):
    u = r.get("usage") or {}
    return 100 * (u.get("promptTokenCount", 0) * PRICE_IN + u.get("candidatesTokenCount", 0) * PRICE_OUT)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--runs", type=int, default=3)
    ap.add_argument("--arms", default="A,B1")
    ap.add_argument("--only", help="comma-separated photo id prefixes")
    ap.add_argument("--skip", help="comma-separated photo id prefixes to leave out")
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--budget", type=float, default=2.00, help="stop starting new calls once the spend (all runs in raw.json) reaches this, $")
    ap.add_argument("--prep-only", action="store_true")
    ap.add_argument("--quiet", action="store_true", help="print usage only, never reading content")
    a = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    cache = OUT / "images"
    photos = [(p["id"], p["path"]) for p in fit_ruler.photo_set()]
    if a.only:
        photos = [p for p in photos if any(p[0].startswith(x) for x in a.only.split(","))]
    if a.skip:
        photos = [p for p in photos if not any(p[0].startswith(x) for x in a.skip.split(","))]
    ready = zoom_test.prepare(photos, cache)
    print(f"{len(ready)} photos prepared in {cache}")
    if a.prep_only:
        return
    key = os.environ.get("GEMINI_API_KEY") or sys.exit("Set GEMINI_API_KEY first.")
    raw_path = OUT / "raw.json"
    results = json.loads(raw_path.read_text()) if raw_path.exists() else []
    spent = sum(cents(r) for r in results) / 100
    done = {(r["arm"], r["photo"], r["run"]) for r in results if r.get("json")}
    results = [r for r in results if r.get("json")]
    arms = a.arms.split(",")
    # Interleave arms per photo and run, so both arms see the same API conditions.
    jobs = [(arm, pid, i) for i in range(a.runs) for pid in ready for arm in arms if (arm, pid, i) not in done]
    print(f"{len(jobs)} calls; spent so far ${spent:.3f}")

    def run(job):
        arm, pid, i = job
        prompt, schema = ARMS[arm]
        imgs = zoom_test.images_for(pid, True, cache)
        line = {1: "", 2: "\n" + zoom_test.ZOOM_LINE_BODY, 3: "\n" + zoom_test.ZOOM_LINE}[len(imgs)]
        r = call(key, prompt + line, schema, imgs)
        r.update({"arm": arm, "photo": pid, "run": i, "images": len(imgs), "at": time.strftime("%H:%M:%S")})
        return r

    stop = False
    with ThreadPoolExecutor(a.workers) as ex:
        pending = list(jobs)
        while pending and not stop:
            batch, pending = pending[:a.workers * 2], pending[a.workers * 2:]
            for r in ex.map(run, batch):
                results.append(r)
                spent += cents(r) / 100
                if r.get("error"):
                    print(f"  {r['arm']} {r['photo']} run {r['run']}: {r['error']}")
            raw_path.write_text(json.dumps(results, indent=1))
            print(f"  {len(results)} done · ${spent:.3f}")
            if spent >= a.budget:
                print(f"budget ${a.budget:.2f} reached; stopping"); stop = True
    raw_path.write_text(json.dumps(results, indent=1))
    by = {}
    for r in results:
        if r.get("usage"):
            by.setdefault(r["arm"], []).append(r)
    for arm, rs in by.items():
        u = [x["usage"] for x in rs]
        print(f"{arm}: {len(rs)} calls · in {sum(x.get('promptTokenCount', 0) for x in u) / len(u):.0f} · "
              f"out {sum(x.get('candidatesTokenCount', 0) for x in u) / len(u):.0f} · "
              f"{sum(cents(x) for x in rs) / len(rs):.3f}¢/call · median {sorted(x['seconds'] for x in rs)[len(rs) // 2]} s")
    print(f"total spent ${spent:.3f}")
    (OUT / "manifest.json").write_text(json.dumps({"model": MODEL, "runs": a.runs, "arms": arms, "zoom_line": zoom_test.ZOOM_LINE,
                                                   "finished": time.strftime("%Y-%m-%d %H:%M:%S")}, indent=1))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Which model should read the outfit? (DECISIONS-LOG #278; founder, Oct 15: "run the test"). The app's reading
(prompt.txt + the close-up line, the face-hidden full photo + upper/lower close-ups, the v3 answer format) sent to
cheaper models, against today's Gemini 3.8 Flash as the control.

Arms:
  gem38     gemini-3.8-flash, thinking off (the live config; existing readings: gold1 runs 0–1, zoom1/zoom1-stock arm B runs 0–2)
  luna      gpt-6-luna, reasoning none, temperature 0 (6 runs on the gold set, so a 3-vote system can be run twice; 3 elsewhere)
  luna_low  gpt-6-luna, reasoning low (2 runs)
  fl35      gemini-3.5-flash-lite, thinking "minimal" (it refuses thinkingBudget 0) (2 runs)
Sets: gold (225 public screenshots, the 5-judge panel; profile unknown), phone (his checks with truth.csv, Oct 7, the
12 mirror selfies; his profile pending), stock (40 stock photos; profile unknown). Rule 7: every score uses the one
stated test profile (parts2_test.PROFILE, Minimal + Smart casual) at Everyday.

  /usr/bin/python3 model_test.py run --arm luna --runs 6 --sets gold        (resumable; stops past the spend cap)
  /usr/bin/python3 model_test.py report
"""
import argparse, json, os, sys, threading, time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE / "rubrics"))
import zoom_test as Z  # noqa: E402
import openai_read as O  # noqa: E402

OUT = HERE / "results" / "models1"
CAP = float(os.environ.get("MODEL_TEST_CAP", "3.5"))  # $ across every arm of this test
SETS = {"gold": HERE / "results" / "gold1" / "images", "phone": HERE / "results" / "zoom1" / "images",
        "stock": HERE / "results" / "zoom1-stock" / "images"}
FL_PRICE = (0.30 / 1e6, 2.50 / 1e6)
LOCK = threading.Lock()
# More OpenAI arms (founder, Oct 15, #280): reasoning none, temperature 0, as luna. gpt-6.1-sol refuses "none" and took 12 s
# at "low", so gpt-6-sol (same price) stands in for Sol.
OA = {"luna56": "gpt-5.6-luna", "mini54": "gpt-5.4-mini", "sol6": "gpt-6-sol"}


def photos(which):
    if which == "gold":
        return sorted(json.loads((HERE / "results" / "gold1" / "ready.json").read_text()))
    src = HERE / "results" / ("zoom1" if which == "phone" else "zoom1-stock") / "raw.json"
    return sorted({r["photo"] for r in json.loads(src.read_text()) if r.get("arm") == "B"})


def gemini_key():
    for line in (HERE.parent / "app" / ".env.development.local").read_text().splitlines():
        if line.startswith("EXPO_PUBLIC_GEMINI_DEV_KEY="):
            return line.split("=", 1)[1].strip()


def spent():
    total = 0.0
    for f in OUT.glob("*/raw.json"):
        total += sum(r.get("cost", 0) for r in json.loads(f.read_text()))
    return total


def gemini_call(model, prompt, images):
    """Z.call's request with the model named and "minimal" thinking: 3.5 Flash-Lite refuses thinkingBudget 0."""
    import base64, urllib.error, urllib.request
    parts = [{"text": prompt}]
    for i, img in enumerate(images):
        if len(images) > 1:
            parts.append({"text": f"Image {i + 1}:"})
        parts.append({"inline_data": {"mime_type": "image/jpeg", "data": base64.b64encode(img).decode()}})
    body = {"contents": [{"parts": parts}],
            "generationConfig": {"temperature": 0, "responseMimeType": "application/json", "responseSchema": Z.SCHEMA,
                                 "thinkingConfig": {"thinkingLevel": "minimal"}}}
    req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                                 data=json.dumps(body).encode(), method="POST",
                                 headers={"Content-Type": "application/json", "x-goog-api-key": gemini_key()})
    last = ""
    for attempt in range(5):
        try:
            t0 = time.time()
            with urllib.request.urlopen(req, timeout=90) as r:
                data = json.load(r)
            c = data["candidates"][0]
            return {"json": json.loads(c["content"]["parts"][0]["text"]), "usage": data.get("usageMetadata", {}),
                    "seconds": round(time.time() - t0, 2), "finish": c.get("finishReason"), "model_version": data.get("modelVersion")}
        except urllib.error.HTTPError as e:
            last = f"{e.code} {e.read().decode(errors='ignore')[:200]}"
            if e.code in (429, 500, 503):
                time.sleep(10 * (attempt + 1)); continue
            return {"json": None, "error": last}
        except (OSError, KeyError, json.JSONDecodeError) as e:
            last = repr(e); time.sleep(3)
    return {"json": None, "error": "gave up: " + last}


def read_one(arm, pid, cache):
    imgs = Z.images_for(pid, True, cache)
    prompt = Z.prompt_for(False) + {1: "", 2: "\n" + Z.ZOOM_LINE_BODY, 3: "\n" + Z.ZOOM_LINE}[len(imgs)]
    if arm in OA:
        return O.call(prompt, imgs, model=OA[arm], effort="none")
    if arm in ("haiku55", "sonnet55"):         # #283: Claude Haiku 5.5 / Sonnet 5.5, thinking off (no temperature control)
        import anthropic_read as A
        return A.call(prompt, imgs, model="claude-haiku-5-5" if arm == "haiku55" else "claude-sonnet-5-5")
    if arm.startswith("luna"):
        return O.call(prompt, imgs, model="gpt-6-luna", effort="low" if arm == "luna_low" else "none")
    if arm == "fl35":
        r = gemini_call("gemini-3.5-flash-lite", prompt, imgs)
        u = r.get("usage") or {}
        r["cost"] = u.get("promptTokenCount", 0) * FL_PRICE[0] + (u.get("candidatesTokenCount", 0) + u.get("thoughtsTokenCount", 0)) * FL_PRICE[1]
        return r
    raise ValueError(arm)


def run(arm, runs, sets, workers):
    d = OUT / arm
    d.mkdir(parents=True, exist_ok=True)
    raw = d / "raw.json"
    results = [r for r in (json.loads(raw.read_text()) if raw.exists() else []) if r.get("json")]
    done = {(r["set"], r["photo"], r["run"]) for r in results}
    only = None
    if os.environ.get("MODEL_TEST_ONLY"):   # a file of "set:photo" lines: run just those (the staged arms)
        only = {tuple(l.strip().split(":", 1)) for l in Path(os.environ["MODEL_TEST_ONLY"]).read_text().splitlines() if l.strip()}
    jobs = [(s, p, i) for i in range(runs) for s in sets for p in photos(s)
            if (s, p, i) not in done and (only is None or (s, p) in only)]
    base = spent()
    print(f"{arm}: {len(jobs)} calls; spent so far ${base:.2f} (cap ${CAP})")
    stop = threading.Event()

    def job(j):
        s, p, i = j
        if stop.is_set():
            return None
        r = read_one(arm, p, SETS[s])
        r.update({"set": s, "photo": p, "run": i, "arm": arm})
        return r

    new_cost = 0.0
    with ThreadPoolExecutor(workers) as ex:
        for n, r in enumerate(ex.map(job, jobs), 1):
            if r is None:
                continue
            results.append(r)
            new_cost += r.get("cost", 0)
            if r.get("error"):
                print(f"  {r['set']} {r['photo']} run {r['run']}: {str(r['error'])[:160]}")
            if base + new_cost > CAP:
                stop.set()
            if n % 50 == 0 or n == len(jobs):
                raw.write_text(json.dumps(results))
                print(f"  {n}/{len(jobs)} · this arm ${new_cost:.2f} · total ${base + new_cost:.2f}", flush=True)
    raw.write_text(json.dumps(results))
    if stop.is_set():
        print(f"STOPPED at the ${CAP} cap")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["run", "report"])
    ap.add_argument("--arm")
    ap.add_argument("--runs", type=int, default=2)
    ap.add_argument("--sets", default="gold,phone,stock")
    ap.add_argument("--workers", type=int, default=6)
    a = ap.parse_args()
    if a.cmd == "run":
        run(a.arm, a.runs, a.sets.split(","), a.workers)
    else:
        import model_report
        model_report.main()

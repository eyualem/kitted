#!/usr/bin/env python3
"""The AI-judge test's Gemini Pro-tier arm (Nov 17, 2026). PAID: runs only on the founder's direct yes in chat to a
quoted cost. Test only: nothing in the app changes.

  KITTED_DATA=<main checkout> /usr/bin/python3 gemini_judge.py --dry                  count calls, estimate; no key
  KITTED_DATA=... /usr/bin/python3 gemini_judge.py --pilot --budget 20                5 photos: real tokens, cents,
                                                                                        seconds (budget in cents)
  KITTED_DATA=... /usr/bin/python3 gemini_judge.py --run 1 --budget 600 [--limit n]   one call per photo of run r

The key: GEMINI_API_KEY if set, else the app's dev key read from $KITTED_DATA/app/.env.development.local
(EXPO_PUBLIC_GEMINI_DEV_KEY), as tools/run_key_tests.sh does. It is never printed or written.
One photo per call (as the app would call it), the face-hidden copy only, BRIEF.md's main part as the instructions,
the day given, JSON out. Answers go to inputs/ai-judge/out-gemini/run<r>-gemini.jsonl (same shape as the Claude
judges', so score_runs.py --judge gemini reads them) and raw usage to raw-run<r>.jsonl. Resumable: done ids are
skipped. Stops before a call that could pass the budget (each call is charged at the pilot's worst case so far).
"""
import argparse
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

DATA = Path(os.environ["KITTED_DATA"])
J = DATA / "inputs" / "ai-judge"
HERE = Path(__file__).resolve().parent
OUT = J / "out-gemini"
MODEL = "gemini-3.1-pro-preview"
PRICE_IN, PRICE_OUT = 2.00 / 1e6, 12.00 / 1e6                   # paid tier, prompts under 200k; thinking = output
EST_IN, EST_OUT = 3800, 1500                                      # the estimate before the pilot (tokens a call)
LOOKS = ["streetwear", "workwear", "vintage_sport", "outdoor", "minimal", "classic_prep", "smart_casual", "tailored",
         "none", "not_rated"]
SCHEMA = {"type": "object", "properties": {
    "look": {"type": "string", "enum": LOOKS},
    "reason": {"type": "string"},
    "score": {"type": "number", "nullable": True}}, "required": ["look", "reason", "score"]}


def brief():
    t = (HERE / "BRIEF.md").read_text()
    t = t.split("\n---\n", 1)[1] if "\n---\n" in t else t          # drop the file's own header note
    return t.split("## Variant P")[0].rstrip().rstrip("-").rstrip()


def key():
    k = os.environ.get("GEMINI_API_KEY")
    if not k:
        f = DATA / "app" / ".env.development.local"
        if f.exists():
            for line in f.read_text().splitlines():
                if line.startswith("EXPO_PUBLIC_GEMINI_DEV_KEY="):
                    k = line.split("=", 1)[1].strip().strip("'\"")
    return k


def cents(u):
    return 100 * (u.get("promptTokenCount", 0) * PRICE_IN
                  + (u.get("candidatesTokenCount", 0) + u.get("thoughtsTokenCount", 0)) * PRICE_OUT)


def call(k, prompt, img, temperature, thinking):
    body = {"contents": [{"parts": [{"text": prompt},
                                    {"inline_data": {"mime_type": "image/jpeg",
                                                     "data": base64.b64encode(img).decode()}}]}],
            "generationConfig": {"responseMimeType": "application/json", "responseSchema": SCHEMA,
                                 "thinkingConfig": {"thinkingLevel": thinking}}}
    if temperature is not None:
        body["generationConfig"]["temperature"] = temperature
    req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent",
                                 data=json.dumps(body).encode(), method="POST",
                                 headers={"Content-Type": "application/json", "x-goog-api-key": k})
    last = ""
    for attempt in range(4):
        try:
            t0 = time.time()
            with urllib.request.urlopen(req, timeout=120) as r:
                data = json.load(r)
            c = data["candidates"][0]
            return {"json": json.loads(c["content"]["parts"][-1]["text"]), "usage": data.get("usageMetadata", {}),
                    "seconds": round(time.time() - t0, 2), "finish": c.get("finishReason"),
                    "model_version": data.get("modelVersion")}
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="ignore")[:300]
            if e.code in (429, 500, 503):
                time.sleep(10 * (attempt + 1))
                last = f"{e.code}"
                continue
            return {"json": None, "error": f"{e.code} {msg}"}
        except (OSError, KeyError, IndexError, json.JSONDecodeError) as e:
            last = type(e).__name__
            time.sleep(3)
    return {"json": None, "error": f"gave up ({last})"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--pilot", action="store_true", help="the first 5 photos of run 1, batch 1")
    ap.add_argument("--run", type=int, default=1)
    ap.add_argument("--limit", type=int)
    ap.add_argument("--budget", type=float, default=0, help="cents; required for a paid call")
    ap.add_argument("--temperature", type=float, default=None, help="default: the model's own (Gemini 3 advises 1)")
    ap.add_argument("--thinking", default="low", help="thinkingLevel: low or high")
    a = ap.parse_args()
    ids = json.loads((J / ".key" / f"run{a.run}.json").read_text())
    order = []
    for b in range(1, 6):
        rows = (J / f"run{a.run}" / f"b{b}" / "photos.csv").read_text().splitlines()[1:]
        order += [(r.split(",")[0], r.split(",")[1], J / f"run{a.run}" / f"b{b}" / f"{r.split(',')[0]}.jpg") for r in rows]
    if a.pilot:
        order = order[:5]
    if a.limit:
        order = order[: a.limit]
    OUT.mkdir(parents=True, exist_ok=True)
    tag = f"run{a.run}" + ("-pilot" if a.pilot else "")
    ans_f, raw_f = OUT / f"{tag}-gemini.jsonl", OUT / f"raw-{tag}.jsonl"
    done = set()
    spent = 0.0
    worst = 0.0
    if raw_f.exists():
        for line in raw_f.read_text().splitlines():
            r = json.loads(line)
            if r.get("json") is not None:
                done.add(r["id"])
            spent += cents(r.get("usage") or {})
            worst = max(worst, cents(r.get("usage") or {}))
    todo = [o for o in order if o[0] not in done]
    est = 100 * (EST_IN * PRICE_IN + EST_OUT * PRICE_OUT)
    print(f"{MODEL}: {len(todo)} calls to make ({len(done)} done, {spent:.2f}c spent so far); estimate "
          f"{est:.2f}c a call before the pilot -> {est * len(todo):.1f}c")
    if a.dry:
        return 0
    if a.budget <= 0:
        print("--budget (cents) is required for a paid run")
        return 1
    k = key()
    if not k:
        print("no key found (GEMINI_API_KEY or app/.env.development.local)")
        return 1
    prompt0 = brief()
    for pid, day, img in todo:
        guard = max(worst, est) * 1.5
        if spent + guard > a.budget:
            print(f"stopping before the budget: {spent:.2f}c spent, next call could cost {guard:.2f}c")
            break
        prompt = prompt0 + f"\n\n## This photo\nThe day: {day}. Occasion: everyday. Answer with look, reason, score."
        r = call(k, prompt, img.read_bytes(), a.temperature, a.thinking)
        c = cents(r.get("usage") or {})
        spent += c
        worst = max(worst, c)
        with open(raw_f, "a") as f:
            f.write(json.dumps({"id": pid, **r}) + "\n")
        if r.get("json") is not None:
            with open(ans_f, "a") as f:
                f.write(json.dumps({"id": pid, **r["json"]}) + "\n")
        u = r.get("usage") or {}
        print(f"  {pid}: {'ok' if r.get('json') else r.get('error')}  {c:.3f}c  {r.get('seconds')}s  in {u.get('promptTokenCount')} "
              f"out {u.get('candidatesTokenCount')} thinking {u.get('thoughtsTokenCount')}")
    print(f"spent {spent:.2f}c in all for {tag}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

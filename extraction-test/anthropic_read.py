#!/usr/bin/env python3
"""Claude as the reading model (DECISIONS-LOG #283): the same prompt, images and answer format as the app's Gemini read,
sent to Anthropic's Messages API with structured outputs (output_config.format, the strict schema from openai_read).

Raw HTTP on the standard library, like the Gemini and OpenAI callers in this harness, so the test needs no new package.
The key is read from app/.env.development.local (ANTHROPIC_TEST_KEY, git-ignored; the founder's short-lived test key).

  from anthropic_read import call      # call(prompt, images, model="claude-haiku-5-5") -> {"json", "usage", "seconds", "cost"}
  /usr/bin/python3 anthropic_read.py --pilot
"""
import base64, json, sys, time, urllib.error, urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import openai_read as O  # noqa: E402  (strict() and the converted schema, drop_nulls)

ENV = HERE.parent / "app" / ".env.development.local"
# $ per token, Anthropic's list price (claude-api skill, cached 2026-10-06; Haiku 5.5 is $0.50 / $2.50 above 100K tokens).
PRICES = {"claude-haiku-5-5": (0.10 / 1e6, 0.50 / 1e6), "claude-sonnet-5-5": (2.00 / 1e6, 10.00 / 1e6)}


def key():
    for line in ENV.read_text().splitlines():
        if line.startswith("ANTHROPIC_TEST_KEY="):
            return line.split("=", 1)[1].strip()
    sys.exit("ANTHROPIC_TEST_KEY missing from app/.env.development.local")


def call(prompt, images, model="claude-haiku-5-5", thinking_off=True, schema=None, k=None):
    content = []
    for i, img in enumerate(images):
        if len(images) > 1:
            content.append({"type": "text", "text": f"Image {i + 1}:"})
        content.append({"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": base64.b64encode(img).decode()}})
    content.append({"type": "text", "text": prompt})
    body = {"model": model, "max_tokens": 4000, "messages": [{"role": "user", "content": content}],
            "output_config": {"format": {"type": "json_schema", "schema": schema or O.SCHEMA}}}
    if thinking_off:
        # Haiku 5.5 runs adaptive thinking by default; "disabled" is accepted at effort high or below (the default is medium).
        # Sonnet 5.5 rejects "disabled"; its thinking-off form is "between_tools" (effort high or below, no other field).
        body["thinking"] = {"type": "between_tools"} if model.startswith("claude-sonnet-5-5") else {"type": "disabled"}
    k = k or key()
    headers = {"Content-Type": "application/json", "anthropic-version": "2023-06-01", "x-api-key": k}
    req = urllib.request.Request("https://api.anthropic.com/v1/messages", data=json.dumps(body).encode(), method="POST", headers=headers)
    last = ""
    for attempt in range(6):
        try:
            t0 = time.time()
            with urllib.request.urlopen(req, timeout=120) as r:
                data = json.load(r)
            secs = round(time.time() - t0, 2)
            if data.get("stop_reason") == "refusal":
                return {"json": None, "error": "refusal", "usage": data.get("usage", {})}
            text = "".join(b.get("text", "") for b in data.get("content", []) if b.get("type") == "text")
            u = data.get("usage", {})
            pin, pout = PRICES.get(model, (0, 0))
            cost = u.get("input_tokens", 0) * pin + u.get("output_tokens", 0) * pout
            return {"json": O.drop_nulls(json.loads(text)), "usage": u, "seconds": secs, "cost": cost,
                    "model_version": data.get("model"), "stop": data.get("stop_reason")}
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="ignore")[:400]
            last = f"{e.code} {msg}"
            if e.code in (429, 500, 502, 503, 529):
                time.sleep(int(e.headers.get("retry-after", 0) or 0) or 8 * (attempt + 1)); continue
            return {"json": None, "error": last}
        except (OSError, KeyError, json.JSONDecodeError) as e:
            last = repr(e); time.sleep(3)
    return {"json": None, "error": "gave up: " + last}


if __name__ == "__main__":
    import zoom_test as Z
    if "--pilot" in sys.argv:
        imgs = Z.images_for("ig-001", True, HERE / "results" / "gold1" / "images")
        r = call(Z.prompt_for(False) + "\n" + Z.ZOOM_LINE, imgs)
        print(r.get("error") or f"{r['seconds']} s · {r['usage'].get('input_tokens')} in / {r['usage'].get('output_tokens')} out · {r['cost'] * 100:.3f}¢ · {r['model_version']} · {r['stop']}")
        if r.get("json"):
            print(json.dumps(r["json"])[:500])

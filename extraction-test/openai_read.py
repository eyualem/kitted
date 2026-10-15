#!/usr/bin/env python3
"""OpenAI as the reading model (DECISIONS-LOG #278): the same prompt, images and answer format as the app's Gemini
read (zoom_test arm B), sent to OpenAI's Responses API with a strict JSON schema.

The key is read from app/.env.development.local (OPENAI_API_KEY, git-ignored; the founder's limited test key).

  from openai_read import call       # call(prompt, images, model="gpt-6-luna", effort="none") -> {"json", "usage", "seconds", ...}
  /usr/bin/python3 openai_read.py --pilot    (one call on one gold photo; prints the reading's size, time and cost)
"""
import base64, copy, json, sys, time, urllib.error, urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
ENV = HERE.parent / "app" / ".env.development.local"
GEMINI_SCHEMA = json.loads((HERE / "schema.json").read_text())
# $ per token (developers.openai.com/api/docs/pricing, read Oct 15; the usage counts confirm the token side)
PRICES = {"gpt-6-luna": (0.10 / 1e6, 0.50 / 1e6), "gpt-6.1-sol": (2.00 / 1e6, 10.00 / 1e6), "gpt-6-sol": (2.00 / 1e6, 10.00 / 1e6), "gpt-5.6-luna": (0.20 / 1e6, 1.20 / 1e6), "gpt-5.4-mini": (0.75 / 1e6, 4.50 / 1e6),
          "gpt-5.4-nano": (0.20 / 1e6, 1.25 / 1e6)}


def key():
    for line in ENV.read_text().splitlines():
        if line.startswith("OPENAI_API_KEY="):
            return line.split("=", 1)[1].strip()
    sys.exit("OPENAI_API_KEY missing from app/.env.development.local")


def strict(s):
    """Gemini's schema (UPPERCASE types, optional keys) → OpenAI strict: lowercase types, every key required,
    additionalProperties false; a key Gemini left optional becomes nullable (null = "not given")."""
    s = copy.deepcopy(s)
    t = s.get("type", "").lower()
    out = {}
    if t == "object":
        props = s.get("properties", {})
        req = set(s.get("required", []))
        out = {"type": "object", "additionalProperties": False, "required": list(props), "properties": {}}
        for k, v in props.items():
            c = strict(v)
            if k not in req:
                c = nullable(c)
            out["properties"][k] = c
        return out
    if t == "array":
        return {"type": "array", "items": strict(s["items"])}
    out = {"type": {"string": "string", "integer": "integer", "number": "number", "boolean": "boolean"}[t]}
    if "enum" in s:
        out["enum"] = list(s["enum"])
    if s.get("nullable"):
        out = nullable(out)
    return out


def nullable(c):
    c = dict(c)
    t = c["type"]
    c["type"] = [t, "null"] if isinstance(t, str) else list(dict.fromkeys(t + ["null"]))
    if "enum" in c and None not in c["enum"]:
        c["enum"] = c["enum"] + [None]
    return c


SCHEMA = strict(GEMINI_SCHEMA)


def drop_nulls(x):
    """Back to Gemini's shape: a null optional key is simply absent, as the engine expects."""
    if isinstance(x, dict):
        return {k: drop_nulls(v) for k, v in x.items() if v is not None}
    if isinstance(x, list):
        return [drop_nulls(v) for v in x]
    return x


def call(prompt, images, model="gpt-6-luna", effort="none", detail="high", k=None, schema=None, name="outfit_reading"):
    content = [{"type": "input_text", "text": prompt}]
    for i, img in enumerate(images):
        if len(images) > 1:
            content.append({"type": "input_text", "text": f"Image {i + 1}:"})
        content.append({"type": "input_image", "image_url": "data:image/jpeg;base64," + base64.b64encode(img).decode(), "detail": detail})
    body = {"model": model, "input": [{"role": "user", "content": content}],
            "text": {"format": {"type": "json_schema", "name": name, "schema": schema or SCHEMA, "strict": True}},
            "reasoning": {"effort": effort}, "store": False}
    if effort == "none":
        body["temperature"] = 0
    req = urllib.request.Request("https://api.openai.com/v1/responses", data=json.dumps(body).encode(), method="POST",
                                 headers={"Content-Type": "application/json", "Authorization": f"Bearer {k or key()}"})
    last = ""
    for attempt in range(5):
        try:
            t0 = time.time()
            with urllib.request.urlopen(req, timeout=120) as r:
                data = json.load(r)
            secs = round(time.time() - t0, 2)
            text = "".join(c.get("text", "") for o in data.get("output", []) if o.get("type") == "message" for c in o.get("content", []))
            u = data.get("usage", {})
            pin, pout = PRICES.get(model, (0, 0))
            cost = u.get("input_tokens", 0) * pin + u.get("output_tokens", 0) * pout
            return {"json": drop_nulls(json.loads(text)), "usage": u, "seconds": secs, "cost": cost,
                    "model_version": data.get("model"), "status": data.get("status")}
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="ignore")[:400]
            if e.code in (429, 500, 502, 503):
                time.sleep(8 * (attempt + 1)); last = f"{e.code} {msg}"; continue
            return {"json": None, "error": f"{e.code} {msg}"}
        except (OSError, KeyError, json.JSONDecodeError) as e:
            last = repr(e); time.sleep(3)
    return {"json": None, "error": "gave up: " + last}


if __name__ == "__main__":
    sys.path.insert(0, str(HERE))
    import zoom_test as Z
    if "--pilot" in sys.argv:
        cache = HERE / "results" / "gold1" / "images"
        imgs = Z.images_for("ig-001", True, cache)
        line = {1: "", 2: "\n" + Z.ZOOM_LINE_BODY, 3: "\n" + Z.ZOOM_LINE}[len(imgs)]
        for effort in ("none", "low"):
            r = call(Z.prompt_for(False) + line, imgs, effort=effort)
            print(effort, r.get("error") or f"{r['seconds']} s · {r['usage'].get('input_tokens')} in / {r['usage'].get('output_tokens')} out · ${r['cost']:.5f} · {r['model_version']}")
            if r.get("json"):
                print("  ", json.dumps(r["json"])[:400])

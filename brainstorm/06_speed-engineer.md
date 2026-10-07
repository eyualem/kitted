# 06 · Speed engineer: how to get the fit check under 5 seconds

**Date:** Oct 6, 2026 · **Author:** speed engineer (research only, no API calls made) · **Status:** a plan to test, not decided

## Bottom line
- **The 16 seconds are almost all the model *writing*, not the photo, the network or the prompt.** Across 156 logged calls in Tests 3 and 4, time per call fits **about 2 s fixed + 7.4 ms for every token the model generates** (thinking + JSON). The fit has r = 0.81. At the median, 1,194 hidden thinking tokens take about 9 s, the 683-token JSON answer takes about 5 s, and everything else takes about 2 s.
- **We already have a free natural experiment.** In 6 calls the model chose not to think (0 thinking tokens). Those calls took **5.7–6.5 s**, against about 16 s for the rest, and they gave the **same scores** as the runs that thought (s04 6.5/6.5/6.5, s18 8.0/8.0/8.0, s15 8.5 vs 8.5/9.0). The sample is small, but it's direct evidence.
- **Three changes should get us to about 4–5 s, and the total cost goes *down*:**
  1. **Cut the thinking.** `gemini-3.8-flash` can only go down to `"low"`, because it has no `"minimal"` level. `gemini-3.6-flash` is **the same price** and does support `"minimal"`. Test both.
  2. **Shrink the answer by about half.** Use one fixed slot per garment (top / outer / bottom / shoes), keep only the fields the rubric reads for that slot, and **drop accessories**. The rubric throws accessories away, yet they are 22% of today's output.
  3. **Fast, honest plumbing:** retry quickly on a backup model instead of waiting 20–60 s on a 503, warm up the connection while the countdown runs, stream the answer so the loading stages are real, and keep the explanation text off the critical path.
- **Skip context caching.** The minimum is 4,096 input tokens and we send about 1,874, so it can't trigger. It wouldn't save meaningful time at our size anyway.
- **The main conflict with "extract more detail":** every extra per-garment field costs about 0.3 s per check, and thinking costs about 9 s. **Get detail from input pixels (crops, resolution), which are cheap in time, not from output tokens, which are expensive.** Rich closet details can come from a second, background call after the score is shown.

---

## 1. Where the time goes (from our own logs)

Data: `results/test3-stock-40-v3` + `test4-mirror-12-v3` (156 calls, gemini-3.8-flash, default thinking).

| Piece | Tokens (median) | Time it costs | Evidence |
|---|---|---|---|
| Fixed part (upload from the Mac, queue, image processing, reading the prompt, first token) | 1,874 in | **~2 s** | intercept of the regression (0.7–2.0 s depending on outlier handling) |
| Hidden thinking | 1,194 (range **0 to 3,964** on the *same* prompt) | **~9 s** | 7.4 ms/token slope |
| Visible JSON answer | 683 | **~5 s** | same slope |
| **Total** | | **15.9 s median, 48 s worst** | matches the measured median |

Three takeaways:
1. **Throughput is low:** about 130 tokens/s. Artificial Analysis measures 3.8 Flash at about 240–300 tokens/s on plain text. Constrained JSON decoding, vision input or load may be slowing us down. Streaming (§4.5) will show which.
2. **Thinking is also a consistency risk.** The amount of thinking swings from 0 to 3,964 tokens on identical inputs at temperature 0. The 48 s outlier (s13) thought for 3,964 tokens. Less thinking means a shorter and *steadier* wait.
3. **The schema isn't billed as input.** 767 text tokens for the 2.8 KB prompt is about 3.7 characters per token, so the 5.5 KB schema isn't being counted. It may still slow down decoding; that's untested (§4.2).

**A latency model to sanity-check every lever:** `seconds ≈ 2 + 0.0074 × (thinking + output tokens)`.

---

## 2. Ranked levers

Speedups are for the median, estimated with the model above unless noted. Costs use the official 3.8 Flash price ($0.75/M in, $3.75/M out until Dec 31; then $1.50 / $7.50).

| # | Lever | Expected median | Quality / consistency risk | Cost effect | Effort (solo) | Verdict |
|---|---|---|---|---|---|---|
| 1 | **Thinking down** (3.8 `low`, or 3.6 `minimal`) | 16 s → **~7 s** at no thinking (seen: 5.7–6.5 s); 3.8 `low` is probably 8–10 s | Low to medium: subtle reads (p06 sleeves, hem break) could change. 0-think runs matched on 3 photos | **−60% to −70%** (thinking is ~85% of cost) | 1 line | **Do first** |
| 2 | **Slim output** (slots, only the fields each slot needs, no accessories, shorter keys) | −45% to −52% of output tokens → **−2.5 s** | Low if enum values stay descriptive. Medium for the slot redesign (layer ambiguity) | −20% to −25% more | 1 day (schema + adapter) | **Do second** |
| 3 | **Model choice** (3.6 Flash `minimal`, 3.5 Flash-Lite) | 3.6: same price, can reach minimal. Lite: AA ~350 tok/s → maybe **3–4 s** total | Lite models see less detail; must pass the same bars | 3.6 same; 3.5 Lite −60%; 3.1 Lite −75% | flag only | Test alongside #1 |
| 4 | **Fast 503 handling + fallback model + hedging** | Median unchanged; **worst case 48 s → ~8 s** | Fallback model must be validated to give the same scores | +5–10% (extra hedged calls) | half a day in the proxy | **Must have before beta** |
| 5 | **Explanation off the critical path** | Saves a 1–3 s second call | None (code-picked fixes appear at once) | none | design choice | **Must have** |
| 6 | **Connection pre-warm + small upload + warm proxy** | −0.3 to −1.5 s on a phone (TLS + upload on cellular) | None | none | small | Do in the app build |
| 7 | **Streaming** (`streamGenerateContent?alt=sse`) | Same total time, but real progress stages; early abort on a bad scene | None | none | small to medium | Do in the app build |
| 8 | **Priority tier** (`serviceTier: "priority"`) | Unknown median gain; fewer 503s and steadier tail (Google: "seconds", non-sheddable, downgrades instead of failing) | None | **+80%** ($1.35 / $6.75) | 1 field | Test once slimmed (still cheaper than today) |
| 9 | **media_resolution medium / low + crop to the person** | Input 1,107 → 560 / 280 tokens: **~0.1–0.4 s** at most | Medium: hem, pilling and sleeve end need pixels. Cropping *improves* detail | −5% to −10% | flag + on-device crop | Test crop; low priority |
| 10 | **Split into parallel calls** (upper vs lower body) | Maybe −1 to −1.5 s | **High:** layers double-counted or missed (overshirt as top vs outer), cross-garment rules break, and the tail = the slower of 2 calls | input ×2 | medium | Only if still over 5 s after 1–9 |
| 11 | **Context caching** (implicit or explicit) | ~0 | none | ~0 | — | **Skip:** minimum is 4,096 tokens and we send 1,874 |
| 12 | Shorter prompt text | <0.2 s (reading the prompt is fast) | Medium (rules exist for a reason) | tiny | — | Skip for speed |

**Target end state** (on a phone, warm connection): about 0.3–1 s upload, ~1.5–2 s fixed model time, ~350–450 generated tokens × 7.4 ms ≈ 2.6–3.3 s (less if 3.6 or Lite stream faster), and scoring in under 10 ms. That's **about 4–5.5 s median**, with a hard cap of 8 s from the deadline/hedge logic. The 2 s fixed part must be measured with streaming before we promise "under 5."

---

## 3. Thinking controls: the exact parameters

From the Gemini thinking guide (updated Sep 25, 2026) and the API reference:

| Model | Default | Levels accepted | Lowest |
|---|---|---|---|
| gemini-3.8-flash | on (medium) | low, medium, high | **low** (no `minimal`) |
| gemini-3.7-flash | on (medium) | low, medium, high | low |
| gemini-3.6-flash | on (medium) | **minimal**, low, medium, high | minimal |
| gemini-3.5-flash | on (medium) | minimal, low, medium, high | minimal |
| gemini-3.5-flash-lite | **on (minimal)** | minimal, low, medium, high | minimal |
| gemini-3.1-flash-lite | not in the table; the models page says "Thinking: No" | — | check on the first call |
| gemini-2.5-flash / -lite | on / off | `thinkingBudget` (integer) | 2.5 is restricted to earlier users; skip |

- **REST shape for `generateContent`** (what `run_test.py` uses):
  `"generationConfig": {"thinkingConfig": {"thinkingLevel": "low"}, ...}`
  The API reference lists the enum as `MINIMAL | LOW | MEDIUM | HIGH`. If lowercase is rejected, send uppercase.
- **`thinkingBudget`** still exists in `ThinkingConfig`, but the docs call `thinkingLevel` "recommended for Gemini 3 or later" and say using `thinkingLevel` on earlier models "results in an error." Never send both.
- **`minimal` is not a guaranteed off switch.** The Gemini 3 guide says it "doesn't guarantee thinking is off." Measure `thoughtsTokenCount`.
- **Don't use `maxOutputTokens` to limit thinking.** Google says it's a hard cutoff that returns truncated or empty output and still bills the thinking. Lower `thinkingLevel` instead. A generous cap (e.g. 1,500) is fine as a tail guard: treat `finishReason: MAX_TOKENS` as a failure and retry or fall back.
- **What to expect:** Google's guide says to "use minimal or low thinking for … classification." Our task is classification into fixed enums, so it fits. 3.8 Flash is tuned for long agentic coding and is unusually verbose: eesel (Sep 2026) reports 13.3 s to first token against a class median of 3.0 s. That's another reason to try 3.6.
- **Temperature caveat:** Google "strongly recommends" temperature 1.0 for all Gemini 3 models and warns lower values can cause looping. We use 0 for consistency. Keep 0, but run one arm at 1.0, because looping would show up as long tails like the 48 s case.

**Experiment E1 (thinking × model, ~$4 total):**
```
/usr/bin/python3 run_test.py --photos ../inputs/fitcheck-photos --runs 3 --model gemini-3.8-flash --thinking low     --delay 1 --out results/speed-e1a-38-low
/usr/bin/python3 run_test.py --photos ../inputs/fitcheck-photos --runs 3 --model gemini-3.6-flash --thinking minimal --delay 1 --out results/speed-e1b-36-minimal
/usr/bin/python3 run_test.py --photos ../inputs/fitcheck-photos --runs 3 --model gemini-3.5-flash-lite              --delay 1 --out results/speed-e1c-35lite
/usr/bin/python3 run_test.py --photos ../inputs/fitcheck-photos --runs 3 --model gemini-3.1-flash-lite              --delay 1 --out results/speed-e1d-31lite
```
Repeat each on `../inputs/mirror-fit-check-1`. Compare against `results/test3-stock-40-v3` and `test4-mirror-12-v3` (baseline 3.8, default thinking). **Pass** = consistency ≥90%, every score-moving field ≥90% agreement, **per-photo median within ±0.5 of baseline for ≥90% of photos** (catches a systematic shift that consistency alone misses), p6 sleeves and fix detection not worse.
Needs: `--thinking` flag (§5).

---

## 4. Other levers in detail

### 4.1 Output size (lever #2)
**What the rubric actually reads** (`rubric.py`):
- **scene:** `clothed`, `shoes_visible` and `framing`. It never reads `people_count`, `mirror_selfie` or `lighting`. The phone already counts people and checks brightness (spec §5.1), and the app knows the capture mode.
- **accessories:** dropped on line 1 of `score()`, so never used. Yet the model returned 104 accessory entries in 156 calls (about 190 tokens each).
- **per slot**, only these fields can change a score:

| Slot | Fields the rubric reads |
|---|---|
| top | type, color, pattern, logo, volume, tucked, condition, certainty, length, pattern_scale, saturation, sleeve_end, strain, distressed, shows_below_outer (15) |
| outer | type, color, pattern, logo, condition, certainty, pattern_scale, saturation, sleeve_end, strain, distressed (11) |
| bottom | type, color, pattern, logo, leg_shape, hem, condition, certainty, pattern_scale, saturation, strain, distressed (12) |
| shoes | type, color, pattern, logo, condition, certainty, saturation, distressed (8) |

Today every garment carries all 18 fields, mostly filled with `"na"`.

**Simulated on the 156 saved answers** (heuristic token counter calibrated to the real counts):

| Format | Est. visible tokens | Time saved |
|---|---|---|
| current | 100% (~680) | — |
| drop accessories | 78% | ~1.1 s |
| fixed slots + only the fields each slot needs | 55% | ~2.3 s |
| + shorter key names (`color_family`→`color`, `distressed_by_design`→`distressed`) | **48% (~330)** | **~2.6 s** |

Rules for the slim schema:
- **Shorten keys, not enum values.** Keys are plumbing. Values like `denim_dark` or `slight_break` are what the model reasons with, and codes like `"dd"` would hurt accuracy.
- Shape: `{"scene":{framing, shoes_visible, clothed}, "top":{…}, "outer":[…] (0–2 items), "bottom":{…}|null, "shoes":{…}|null}`. Use `nullable: true` and set `propertyOrdering` so it streams in order: scene, then top, outer, bottom, shoes.
- An adapter (`slim_to_garments()`) turns slots back into today's `garments` list, filling `"na"` defaults, so `rubric.py` and the analysis code stay unchanged.
- **Risk:** the slots force a top-vs-outer decision (overshirt, open flannel), which used to be a free `category` choice. Watch the `top.subcategory` and `outerwear.*` agreement in E2.
- Google warns that "very large or deeply nested schemas may be rejected." The slot schema is smaller, so that risk goes down.

**Experiment E2:**
```
/usr/bin/python3 run_test.py --photos ../inputs/fitcheck-photos --runs 3 --model <E1 winner> --thinking <level> --schema schema_slim.json --prompt prompt_slim.txt --delay 1 --out results/speed-e2-slim
```
Plus the mirror set. Same pass gates. As a side check, run `--no-schema` once (the schema in the prompt only) to see whether constrained decoding is what holds throughput to ~130 tokens/s. That run is for measurement only; don't ship it without the schema.

### 4.2 Input size: resolution and cropping (lever #9)
- **On Gemini 3, image tokens are a fixed budget, not set by pixel size.** `media_resolution` gives low = 280, medium = 560, high = 1,120 (the default when unspecified), and ultra_high = 2,240, which can only be set on a single image part. Our 1,107 tokens are the default budget, so **resizing to 1024 px saves no tokens**. Only `media_resolution` does.
- **Where to set it:** `generationConfig.mediaResolution: "MEDIA_RESOLUTION_MEDIUM"`, or per image as `"mediaResolution": {"level": "MEDIA_RESOLUTION_MEDIUM"}` next to `inline_data`.
- **Speed effect is small.** Reading input is much faster than writing output. Dropping ~550–830 tokens likely saves 0.1–0.4 s, and Google says only "faster processing" without numbers. Google recommends `high` "for most image analysis tasks." Hem break, pilling and sleeve end are exactly that kind of fine detail.
- **Cropping to the person is the better lever, for quality more than speed.** With a fixed 1,120-token budget, cropping away the background puts more of those tokens on the clothes for free. Apple Vision handles it on the phone in milliseconds: `VNDetectHumanRectanglesRequest` (full body, `upperBodyOnly = false`) or the body-pose request the framing guide already runs. Pad the box about 8% so shoes and hair aren't clipped. It also helps privacy, since less of the room gets uploaded.
- **Upload bytes:** 1024 px JPEGs are about 111 KB (max 228 KB; +33% as base64). 768 px at quality 70 is about 68 KB. That's about 0.2–1 s on weak cellular. Use HEIC→JPEG at 1024 px, quality about 0.75, and don't go smaller, because the model scales the image to its budget anyway.

**Experiment E3:**
`--media-res medium` and `--media-res low` on both sets. Then crop: a ~40-line Swift script (`crop_people.swift`, run with `swift`) uses Vision to write `../inputs/fitcheck-photos-cropped/`; run the E2 config on it. **Pass** = same gates. Also check `hem`, `condition` and `sleeve_end` agreement, and that fix detection doesn't drop.

### 4.3 Caching (lever #11): skip
- Implicit caching is on by default, but the **minimum is 4,096 input tokens** for 3.5–3.8 Flash. We send 1,874, and only the 767-token prompt is shared between calls (each image is new).
- Explicit caching wouldn't help either: Google sells it as "faster time-to-first-token" for big repeated content, and reading ~770 tokens takes only a fraction of a second.
- The caching that *does* matter is ours: the spec already caches by image fingerprint and reuses the first reading on re-checks. A repeat check costs 0 s and 0¢.

### 4.4 Model choice (lever #3)
| Model | Price in / out per M (standard) | Lowest thinking | Notes |
|---|---|---|---|
| gemini-3.8-flash (now) | $0.75 / $3.75 → **$1.50 / $7.50 from Jan 1** | low | Tuned for agentic coding; verbose |
| gemini-3.7-flash | same | low | No reason to pick over 3.6 for us |
| **gemini-3.6-flash** | same | **minimal** | Google: "balances speed and multimodal"; AA: 304 tok/s, time per task halved vs 3.5 |
| gemini-3.5-flash | $1.50 / $9.00 | minimal | Pricier legacy model; skip |
| **gemini-3.5-flash-lite** | **$0.30 / $2.50** | minimal (the default) | AA: ~350 tok/s; intelligence index 36 vs 50 for Flash |
| gemini-3.1-flash-lite | $0.25 / $1.50 | (none) | AA index 25; cheapest; likely weakest at fine detail |
| `gemini-flash-latest` / `-lite-latest` | moves | — | **Never in production.** The alias changes under you and breaks "same photo → same score" |

**Pin an exact model version and put it in the reading's cache key.** A model change is a rubric-level change: re-run the 5× test before switching.

### 4.5 Streaming and parallel calls (levers #7, #10)
- **Streaming:** `POST …/models/{model}:streamGenerateContent?alt=sse`. Google says streamed structured output arrives as "valid partial JSON strings" you join together. It doesn't make the total faster, but:
  - **Real stages:** with `propertyOrdering` set to scene → top → outer → bottom → shoes, the loading screen can say "Reading your top… pants… shoes" as each one actually arrives.
  - **Early stop:** if `scene.clothed == "partial"` or `framing` is unusable, stop the stream and show the retake message about 2 s sooner.
  - **Measurement:** time to first byte and to first JSON token separates waiting in a queue from generating. That tells us what the "2 s fixed" really is.
  - Thinking happens *before* the first visible token, which is one more reason to keep it minimal.
- **Parallel split (upper/lower body):** each call writes about half → maybe −1.3 s. But the wait becomes the *slower* of two random calls, the image is sent and billed twice, and cross-garment rules (shirt below blazer, everything oversized, tucked) lose the joint view. **Not recommended** unless we're still over 5 s after levers 1–9. The shoe snap is already a natural parallel/second call (spec §5.6).
- **Hedging (part of lever #4)**, the classic Google "tail at scale" trick: if there's no answer by about the p90 time (say 6 s once we're slim), send one identical backup request and take whichever finishes first. Expect about +10% calls. **It can be simulated offline for free** from the logged per-call times (§5, `hedge_sim.py`).

### 4.6 Network and infrastructure (levers #4, #6, #8)
- **Proxy vs. direct from the phone:** the API key must never ship in the app, so there's always a hop. Choices:
  - **Supabase Edge Function** (spec §12): pass the request through, stream the response back, and add quotas and the kill-switch.
  - **Firebase AI Logic:** Google's own Swift SDK + App Check. The key stays on Google's server, and it supports thinking config, structured output and streaming. That's one less hop and less code, but quotas and the kill-switch are less flexible. Worth a one-day spike against Supabase.
  - Either way: **no cold starts on the hot path** (an always-warm edge function, not a scale-to-zero container), and reuse the outbound connection to Google.
- **Pre-warm:** open the HTTPS connection to the proxy when the camera screen opens (a tiny `GET /health`). DNS, TCP and TLS on cellular cost about 150–500 ms, and `URLSession` reuses the HTTP/2 connection for the real upload.
- **Region:** the Gemini Developer API (`generativelanguage.googleapis.com`) has no region knob. Vertex AI / the Agent Platform has global and regional endpoints; the global one is more available but varies more in latency. Only consider it if the Developer API's 503s stay bad; it's more setup.
- **503s, the biggest fix for the worst case:** today `run_test.py` waits **20 / 40 / 60 s** on a 503. That's fine for a test, but it's poison in the app. In the proxy:
  - give the whole check an **8 s deadline**
  - on 429, 503 or 5xx, retry **once after 0.3–1 s with jitter**, ideally on a **validated fallback model** (e.g. 3.6 Flash ↔ 3.5 Flash-Lite)
  - hedge at p90
  - if the deadline passes, show "Taking longer than usual, try again" and **don't use up the free check**
  - Google's own advice: exponential backoff with jitter, and retry only 408, 429 and 5xx.
- **Priority tier:** `"serviceTier": "priority"`. It's listed in the `generateContent` request reference; the Priority guide shows it on the Interactions API, so confirm on the first call. Priority traffic is "non-sheddable," and when you exceed its limits it is **downgraded to standard instead of failing with 503/429**. It costs **+80%** ($1.35 / $6.75 for 3.8 Flash), and Priority limits are 0.3× the standard limits. Check the `x-gemini-service-tier` response header or `usageMetadata.serviceTier` to see whether a call was downgraded. **Flex** (−50%, "minutes," sheddable) is wrong for the fit check but right for background closet extraction (§7).

**Experiment E5 (tier):** run the E2 config twice in the same hour, `--tier standard` and `--tier priority`, with `--concurrency 4` and interleaved by photo. Compare p50, p90 and max, the share under 5 s and 8 s, the 503 count, and the downgrade count.

### 4.7 Honest latency masking (UX)
All of these hide time that really is being spent, and none of them fake progress:
1. **The 3-2-1 countdown does the setup work:** the framing guide's body-pose results double as the quality check, the connection warms up, and the person box for cropping is ready. At capture there's only about 100–300 ms of on-device work left (crop, face blur, the clothed check that must run before upload, JPEG).
2. **Start the upload the moment the clothed and quality checks pass.** Run face blur and crop together. Don't wait for anything else.
3. **Staged screen driven by real events:** "Photo looks good ✓" (on-device) → "Sending" → "Reading your top / pants / shoes" (streamed slots) → score. Never show a fake progress bar.
4. **Show the score and the code-picked fixes the instant the JSON lands** (scoring is <10 ms on the phone). The 2–4 sentence explanation is a second model call (1–3 s). Show a template line built from the rules that fired right away, then stream the AI sentences in. Don't make the result wait on them.
5. **Re-checks and repeat photos hit the fingerprint cache:** instant.
6. **Not recommended:** sending a frame speculatively during the countdown. It doubles calls and makes it unclear *which* photo was scored, which breaks the consistency promise.

---

## 5. Changes needed in `run_test.py` (for whoever edits it)
I didn't edit it (out of scope). Suggested flags, all optional, with defaults that keep today's behavior:

| Flag | What it does |
|---|---|
| `--thinking {default,minimal,low,medium,high}` | adds `generationConfig.thinkingConfig.thinkingLevel` |
| `--media-res {default,low,medium,high}` | adds `generationConfig.mediaResolution = "MEDIA_RESOLUTION_<X>"` |
| `--schema PATH`, `--prompt PATH` | alternative schema/prompt; if the schema has a top-level `top` key, run `slim_to_garments()` before scoring |
| `--no-schema` | already possible internally (`use_schema=False`); expose it for the decoding-speed check |
| `--tier {standard,priority,flex}` | adds top-level `"serviceTier"`; log the `x-gemini-service-tier` header and `usageMetadata.serviceTier` |
| `--temperature F` | default 0 |
| `--stream` | use `:streamGenerateContent?alt=sse`; log `ttfb_s` (first byte) and `ttft_s` (first text chunk) |
| `--max-px N`, `--jpeg-q Q` | change `prepare_image` (`sips -Z N -s formatOptions Q`) |
| `--concurrency N` | run N calls at once (thread pool) to mimic real load |
| `--fast-retry` | retry after 1 s plus jitter instead of 20–60 s, and log `attempts` |

Also:
- log `api_seconds` (the successful attempt only) next to `seconds`, plus `finishReason`
- add **p90, p95, max, % ≤5 s, % ≤8 s** to `report.md`, and log `thoughtsTokenCount` per call
- **`compare_runs.py A B`** (new, free): per-photo median difference, the share within ±0.5, field-by-field agreement between two result folders (catches systematic shifts)
- **`hedge_sim.py results/X --at 6`** (new, free): resample the logged `api_seconds` to estimate p50/p90/max with a hedge at T seconds

Order arms within the same hour, or run them in two Terminal tabs at once, because latency changes with Google's load through the day.

---

## 6. Staged plan

| Stage | What | Cost of the test | Expected result |
|---|---|---|---|
| **0 (free)** | `compare_runs.py`, `hedge_sim.py` on the existing logs; add the flags | $0 | tooling ready; offline hedge estimate |
| **1** | E1: thinking × model (3.8 low, 3.6 minimal, 3.5 Lite, 3.1 Lite) on both photo sets, 3 runs | ~$3–4 | **16 s → ~6–8 s**; pick a primary model and a fallback |
| **2** | E2: slim schema on the winner (+ the one-off `--no-schema` check) | ~$1 | **→ ~4–5 s** |
| **3** | E4: `--stream` (measure time to first token; prove the stages work); E7: temperature 1.0 vs 0 | ~$1 | know the real fixed part |
| **4** | E3: media_resolution + crop-to-person | ~$1.5 | small speed gain; maybe a quality gain from cropping |
| **5** | E5: priority vs standard under concurrency | ~$1 | decide on Priority for fit checks only |
| **6 (app build)** | proxy with 8 s deadline, fast retry + fallback, hedge, pre-warm, streaming UI, template-first explanation | dev time | **worst case capped near 8 s** |

**Cost per check after stages 1–2:**

| Setup | Cost per check (Dec) | From Jan 1 |
|---|---|---|
| Today | ~0.84¢ | 1.7¢ |
| Slim + little thinking (standard) | ~0.32¢ | ~0.64¢ |
| Slim + little thinking (Priority) | ~0.57¢ | ~1.1¢ |
| 3.5 Flash-Lite slim | ~0.17¢ | ~0.17¢ |

---

## 7. Where speed and "extract more detail" will collide (for the critique round)

| Detail idea | Speed cost | My position |
|---|---|---|
| **More fields per garment** | About 10 tokens × 4 garments ≈ **0.3 s per field per check**. Ten new fields ≈ +3 s | Each new field must name the rubric rule it feeds. If it moves no score, it doesn't go in the fast call |
| **Free-text fields** ("describe the fit", notes) | 30–100+ tokens each, and their wording changes run to run | No in the fast call: slow *and* bad for consistency |
| **Per-field confidence** | Roughly doubles output | Keep one `certainty` per garment; maybe add it only for the 3–4 score-moving fields that flip (hem, sleeve_end) |
| **Accessories / closet richness** (belt, watch, material, brand-ish) | 22% of today's output for 0 score impact | Move it to a **background "closet" call** after the score is shown (Flex tier at −50%, or standard, off the critical path) |
| **More thinking for subtle reads** (p06 sleeves, hem break) | ~9 s at the default | The biggest conflict. Settle it with E1 data, not opinion. If one field needs reasoning, ask a targeted follow-up only when the field is `unsure` |
| **Higher resolution / extra crops** (e.g. a zoomed hem crop + the full photo) | Input only: +280 to +1,120 tokens per image ≈ **+0.1–0.4 s** | **The good way to add detail:** pay with input pixels, not output tokens |
| **Multi-step pipelines** (detect garments, then describe each) | Each *sequential* call adds the ~2 s fixed part plus its output | Parallel is OK, sequential is not. Keep one call on the hot path |
| **Bigger enums** (more subcategories, colors) | Close to free in tokens; decoding cost unknown | Fine, if agreement stays ≥90% |

**Proposed rule for the team:** the fast call gets an **output budget of about 400 tokens** and **minimal thinking**. Anything else must either live in input (pixels), run in the background after the result shows, or win a measured A/B on consistency or fix detection.

---

## 8. Open questions to verify on first calls
- Does `serviceTier: "priority"` work on `generateContent`, or only on the Interactions API?
- Does 3.8 Flash reject `"minimal"` with a 400? (Expected, since the table doesn't list it.)
- Is 3.1 Flash-Lite's thinking really off, and does it accept any `thinkingLevel`?
- Is constrained decoding (the big schema) what keeps us at ~130 tok/s vs AA's ~240–300?
- What is the real fixed part, measured by streaming time-to-first-byte from a phone on LTE?

---

## Sources
- Gemini thinking guide (levels per model, `max_output_tokens` warning; updated 2026-09-25): https://ai.google.dev/gemini-api/docs/thinking
- Gemini API reference, `generateContent` (`ThinkingConfig`, `thinkingLevel` enum, `mediaResolution`, `serviceTier`, `propertyOrdering`, streaming `alt=sse`): https://ai.google.dev/api/generate-content
- Gemini 3 developer guide (temperature 1.0 recommendation, "minimal doesn't guarantee thinking is off", latency vs. level; updated 2026-09-23): https://ai.google.dev/gemini-api/docs/gemini-3
- Media resolution (token counts per level, defaults, recommendations; updated 2026-09-23): https://ai.google.dev/gemini-api/docs/media-resolution
- Context caching (implicit caching minimum 4,096 tokens for 3.x Flash; updated 2026-09-02): https://ai.google.dev/gemini-api/docs/caching
- Structured output (streaming partial JSON, schema limits; updated 2026-09-23): https://ai.google.dev/gemini-api/docs/structured-output
- Priority inference (non-sheddable, graceful downgrade, +75–100%, 0.3× limits; updated 2026-09-23): https://ai.google.dev/gemini-api/docs/priority-inference
- Optimization and inference tiers (standard / flex / priority / batch / caching): https://ai.google.dev/gemini-api/docs/optimization
- Flex inference: https://ai.google.dev/gemini-api/docs/flex-inference
- Pricing (3.8 / 3.7 / 3.6 / 3.5 Flash, 3.5 and 3.1 Flash-Lite, Priority and Flex rates; updated 2026-10-06): https://ai.google.dev/gemini-api/docs/pricing
- Models list and status (updated 2026-10-06): https://ai.google.dev/gemini-api/docs/models
- Troubleshooting, retry strategy (updated 2026-10-01): https://ai.google.dev/gemini-api/docs/troubleshooting
- API errors (503 = overloaded, retry with backoff; 504 = deadline): https://ai.google.dev/gemini-api/docs/api-errors
- Artificial Analysis, Gemini 3.6 Flash and 3.5 Flash-Lite (Jul 21, 2026): https://artificialanalysis.ai/articles/gemini-3-6-flash-3-5-flash-lite-halving-time
- Artificial Analysis, Gemini 3.8 Flash providers page: https://artificialanalysis.ai/models/gemini-3-8-flash/providers
- eesel, "Gemini 3.8 Flash review" (Sep 8, 2026; TTFT 13.3 s, verbosity): https://www.eesel.ai/blog/gemini-3-8-flash-review
- Firebase AI Logic (Swift SDK, App Check, thinking/structured output/streaming; updated 2026-10-06): https://firebase.google.com/docs/ai-logic
- Vertex AI global vs regional endpoints (community guide): https://www.verdent.ai/guides/access-gemini-3-1-pro-vertex-ai and latency-variance thread https://discuss.google.dev/t/critical-performance-issues-gemini-latency-spikes-and-unpredictable-inference-times-vertex-ai/350293
- Apple Vision, `VNDetectHumanRectanglesRequest`: https://developer.apple.com/documentation/vision/vndetecthumanrectanglesrequest · `VNDetectHumanBodyPoseRequest`: https://developer.apple.com/documentation/vision/vndetecthumanbodyposerequest
- Dean & Barroso, "The Tail at Scale" (hedged requests), Google Research: https://research.google/pubs/the-tail-at-scale/
- Our own data: `extraction-test/results/test3-stock-40-v3/raw_results.json`, `test4-mirror-12-v3/raw_results.json` (regression, zero-thinking calls, token simulation run on Oct 6 without API calls)

---

## Round 2 (critique and converge, Oct 6)

### R2.1 What the probe changed (8 photos × 3 runs, gemini-3.8-flash)
- **"low" on 3.8 = 0 thinking tokens** (24/24 calls). `minimal` is rejected. So **thinking is solved on 3.8**, and **3.6-flash "minimal" is no longer needed as a thinking lever.** I'd keep 3.6 Flash (same price) and 3.5 Flash-Lite only for: (a) the 503 fallback model, which must be validated anyway, and (b) one cheap screen of the fixed part and throughput. Low priority.
- **Ship `thinkingLevel: "low"`** (the documented 3.x knob), with `maxOutputTokens` around 900 as a loop guard and an alert if `thoughtsTokenCount > 0` on more than 5% of calls. Keep `thinkingBudget: 0` as the fallback setting, since it's a hard off but a legacy field.
- **The new latency model with no thinking** (refit on the probe calls): **about 2–3 s fixed + 5–6 ms per output token** (170–200 tok/s, faster than with thinking on).
  - **Output is now the whole game.** These photos average ~930 visible tokens, because mirror selfies bring about 1 accessory per call (~190 tokens, ~1 s) → about 7 s.
  - **Today's schema can't pass G5 (p50 ≤ 5 s)** even with thinking off. Slimming is required, not optional.
- **The 512 px "speedup" is fake.** Input tokens stayed at about 1,850. It was faster only because it *saw less*: 0.75 accessories per call vs. 1.0, so 762 vs. 930 output tokens. **Reject 512.** Keep 1024 px (or person-crop + 1024). 768's 8/8 is within A/A noise.
- Thinking off: mean −0.19 vs. default. That's within N6 (≤ 0.2) but borderline, so it needs the full dev run. The direction is helpful (v3 runs about +0.6 high).

### R2.2 Critique of the detail engineer (07)
| Proposal | Speed view | Verdict |
|---|---|---|
| **Slim per-slot schema** | −45% to −55% output ≈ −2.5 s | **Accept.** It's the main lever now |
| **`issues` list** | Empty list ≈ 4–5 tokens per garment; a flag ≈ 3–5 | **Accept, and *replace* `condition` with it.** The adapter rebuilds `condition`, so the issues list is net-free. Use per-slot enums and `maxItems: 3` |
| **On-device person crop** | 0 output, 0 extra input tokens | **Accept as the default.** Test now with pre-cropped folders |
| **framing / shoes_visible on the device** | Saves ~10–15 tokens and removes a flip | **Accept for the app.** Keep `framing` in the test schema until a Vision script exists (the harness can't run body pose) |
| **In-call crops (+1,680 input tokens)** | See the estimate below | **Change:** one extra image, not two |
| `footwear_state`, `sleeves_rolled`, `pant_length` (shoe snap only), `hem_style` | ~+25 tokens total | **Accept**, but fold `sleeves_rolled` into the sleeve enum (`rolled`), so it's one decision and fewer tokens |
| `jacket_sleeve`, `shoulder_seam`, `texture`, `box_2d` | +50–80 / +80 tokens | **Reject from the live call.** They're advice-only; put them in the closet background read (M1) |
| **Two-image "what changed?" re-check** | +1 image (~1,120 tokens) + before reading as text (~120) in; ~100 out → about 3–3.5 s, faster than a full check | **Accept, narrowed:** send only the slot the suggested fix touches (the user tapped "cuff"), and return that slot plus `new_problem: none/yes`. Gate hard on null pairs (G3c), because comparison prompts invite invented changes |
| Temperature 0 vs. 1.0 | Temperature doesn't change speed per token; it changes length (looping) and randomness | **Keep 0.** With 0 thinking, enum-only output and `maxItems`, looping risk is low, and 1.0 adds random enum choices on top of the 13% A/A noise. One screen run at 1.0 (~40¢) to confirm |

**What I expect the in-call crops to cost** (full body at medium + two high crops):
- **Reading the extra tokens:** about 0.1–0.3 s. The 2–3 s fixed part already covers reading ~1,850 tokens *plus* network and queue, so pure reading is a small share.
- **Two extra image encodes:** about 0.1–0.3 s.
- **Upload:** about +150–250 KB as base64 ≈ +0.2–0.4 s on good LTE, up to +1.5 s on weak signal.
- **Total: about +0.4–1.0 s typical, ~+2 s worst.**
- **Hidden risk:** the model lists a garment twice across views. Each duplicate is about +100 tokens, roughly 0.5 s.
- **Cost:** +0.13¢ now, +0.25¢ from January.
- **Change:** person-crop at high + **one lower crop** (knees → feet, at high), +1,120 tokens. Hem and pooling move the score most and drive fix detection. Upper-crop reads (collar, tag, neckline) are mostly advice-only.
- **Measure it free of new photos:** send the same image twice (`--dup-image`) and compare `api_seconds` interleaved.

### R2.3 Critique of the test designer (08)
- **Accept:** the gates, `api_seconds` without back-off, interleaving per photo, the non-inferiority rules, and the A/A noise floor.
- **Change 1:** the "≥ 30% faster" kill rule fits schema and thinking levers. **Infra levers** (Priority tier, pre-warm, fast retry, hedging) should be judged on **p90 and max** rather than p50.
- **Change 2:** add an **output budget check: p90 visible tokens ≤ 500.** At 2–3 s fixed + 5.5 ms/token, that's the only way G5 can pass.
- **Change 3:** on a 20-image × 2-run screen, p90 is noisy (about 4 calls in the tail). Judge latency on the full dev run.
- **Change 4:** the field-agreement table must skip adapter-filled constants, or they will inflate agreement.

### R2.4 Schema v4 (speed-engineer version, for the lead to reconcile with 07)
Every field is required, in the order given (`propertyOrdering`). There's no free text. Slots that aren't visible are `null`.

**scene:** `clothed` [fully, partial] · `framing` [full_body, three_quarter, upper_only] (temporary; moves to the device) · `feet` [shoes_on, socks_or_barefoot, cut_off] · `traditional` bool

**top** (object | null):
- `type` [tee, graphic_tee, polo, knit_polo, oxford_shirt, dress_shirt, flannel_shirt, camp_collar_shirt, rugby_shirt, overshirt, sweater, cardigan, quarter_zip, hoodie, sweatshirt, fleece, tank_top, jersey, other]
- `color` [the 25 current color families]
- `sat` [na, muted, bright]
- `pat` [solid, stripes, checks_plaid, graphic, camo, floral, other]
- `scale` [na, small, medium, large]
- `logo` [none, small, large]
- `vol` int 1–5
- `tuck` [none, half, full]
- `len` [na, cropped, at_belt, mid_fly, below_crotch]
- `tails` [na, straight, curved]
- `sleeve` [short, rolled, above_wrist, at_wrist, covers_hand]
- `strain` [none, some, clear]
- `below` bool
- `distressed` bool
- `issues` [faded, tag_or_sticker, heavy_wrinkles, stretched_neckline, collar_collapsed, pilling, stain] (max 3)
- `sure` [clear, likely, unsure]

**outer** (array, max 2):
- `type` [overshirt, cardigan, fleece, blazer, unstructured_blazer, sport_coat, suit_jacket, denim_jacket, bomber, chore_coat, field_jacket, leather_jacket, puffer, overcoat, rain_jacket, shell_jacket, other]
- `color`, `sat`, `pat`, `scale`, `logo`
- `sleeve` [rolled, above_wrist, at_wrist, covers_hand]
- `open` [open, closed]
- `strain`, `distressed`
- `issues` [faded, tag_or_sticker, heavy_wrinkles, pilling, fraying, stain]
- `sure`

**bottom** (object | null):
- `type` [jeans, chinos, trousers, drawstring_trousers, suit_trousers, cargos, joggers, sweatpants, shorts, athletic_shorts, other]
- `color`, `sat`, `pat`, `scale`
- `leg` [skinny, slim, straight, relaxed, wide, flare_bootcut, barrel]
- `hem` [pooling, full_break, slight_break, no_break, cuffed, cropped, na]
- `strain`, `distressed`
- `issues` [faded, tag_or_sticker, heavy_wrinkles, fraying, stain]
- `sure`

**shoes** (object | null):
- `type` [white_leather_sneaker, low_profile_sneaker, canvas_sneaker, retro_runner, performance_runner, chunky_sneaker, basketball_sneaker, loafer, derby, dress_shoe, suede_chukka, chelsea_boot, work_boot, slides_sandals, other]
- `color`, `sat`, `distressed`
- `issues` [scuffed, stain]
- `sure`

**acc:** array of [belt, hat, bag, watch, glasses, jewelry], max 4. This is enum strings only, about 2 tokens each instead of ~190 per full accessory object.

**Token estimate** (heuristic counter calibrated on real counts, ±15%):

| Typical outfit | Tokens | Generation time |
|---|---|---|
| top + outer + bottom + shoes + 2 accessories | ~470 | ~2.6 s |
| without outer | ~370 | — |
| today (mirror photos) | ~930 | ~5.1 s |

Expected API p50 ≈ 2.5 + 2.6 ≈ **5 s**; tighter with Priority or a shorter fixed part. If more is needed, merging `pat` + `scale` into one enum (stripes_fine / stripes_bold / checks_small / checks_large) saves about 25 more.

**How the adapter (`v4_to_garments`) maps back to what `rubric.py` reads:**
- **Scene:**
  - `shoes_visible = (feet == "shoes_on")`; `feet` is passed through for the partial label
  - `people_count = 1` (counted on the device)
  - `mirror_selfie` and `lighting` come from the app
  - if `traditional` is true, add `{category: "traditional"}`
- **Each slot becomes a garment** (top → top, outer → outerwear, bottom → bottom, shoes → footwear), renaming keys back (`type`→subcategory, `color`→color_family, `pat`→pattern, `scale`→pattern_scale, `vol`→volume, `tuck`→tucked, `len`→length, `below`→shows_below_outer, `distressed`→distressed_by_design, `sure`→certainty).
- **`condition`** is rebuilt from `issues` by precedence: stain → `stained`; pilling / fraying / scuffed / stretched_neckline → `pilled_or_worn`; heavy_wrinkles → `wrinkled`; otherwise `clean`. faded, tag_or_sticker and collar_collapsed are passed through for new v4 rules.
- **Sleeves:** `rolled` → `sleeve_end: above_wrist` (keeps today's fix-detection logic working) plus `sleeves_rolled: true`; `short` → `na`.
- **Constants the rubric needs but never varies:** outer and bottom get `volume 3`, `tucked/length "na"`, `shows_below_outer false`. Bottom and shoes get `logo "none"`. Shoes get `pattern "solid"`, `scale "na"` and `strain "none"`. The top gets `leg_shape/hem "na"`. Mark all of these `_filled` so field agreement skips them.
- **`acc`** becomes accessory garments, which the rubric drops anyway.
- **Result:** `rubric.py` runs unchanged, and `rescore.py` comparisons stay valid.

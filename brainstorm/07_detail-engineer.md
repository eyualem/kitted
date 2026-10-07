# 07 · Detail engineer: catching more from each photo

*Oct 6, 2026. Role: detail engineer (teammates: speed engineer, test designer). No Gemini calls were made. The numbers below come from the saved readings in `extraction-test/results/` and free re-scores I ran in a scratch copy of `rubric.py`. No project files were edited except this one.*

---

## Bottom line (read this if nothing else)

1. **Output tokens are the hidden cost of detail.** From the saved runs, latency tracks output tokens closely (correlation 0.77–0.81). At about **120–135 output tokens per second**, every **100 extra output tokens is roughly 0.75–0.85 s**. Today's visible JSON alone is about **710–730 tokens**, which is about 5.5 s *even with thinking turned off*. So no new field is free, and the first move is to **slim the schema**. I measured that dropping fields that don't apply to a garment type, plus default values, removes about **55% of the visible JSON**. That pays for every new field below with room to spare.
2. **Add a compact `issues` list per garment, not a dozen new required fields.** Use fixed values: `faded`, `tag_or_sticker`, `heavy_wrinkles`, `stretched_neckline`, `collar_collapsed`, `fraying`, `pilling`, `scuffed`. An empty list costs about 4 tokens. This is what closes m06 (faded tee, sticker still on).
3. **Get better pixels for free, on the phone:** crop to the person with Apple Vision before resizing. On a normal iPhone photo this gives the clothes about 1.5–2× more pixels at the same token cost. Also compute `shoes_visible` and `framing` on the device from body-pose joints instead of asking the AI. Those two fields flip today (m06 was read as both `three_quarter` and `full_body`).
4. **Two rule-only fixes are ready to try on saved readings (free).**
   - **Near-match tailoring:** a dark blazer with *different* dark trousers looks like a suit gone wrong. m08 moves 9.0 → 8.5.
   - **Scale credits only halfway on partial checks:** m10 drops its 9.5 outlier.

   Together, on the mirror set, consistency goes 11/12 → **12/12**, the average error vs. the stylist estimate goes 0.71 → **0.67**, and the stock set is unchanged.
5. **For tailoring and fine detail, send crops in the same call; don't make a second call.** Send the full body at `medium` (560 tokens) plus an upper-body crop and a lower-body/hem crop at `high` (1,120 each). The extra cost is input tokens, which are cheap and fast, not output tokens. This is the right home for advice-only fields like shoulder seam, shirt cuff showing and collar condition. **It only helps when the original photo has more pixels than we currently send.** The mirror test set (168–737 px) can't show the gain, so it needs new full-resolution photos.
6. **Move the hardest reads off the critical path.** Closet items can be read once, in the background, at `ultra_high` with thinking on, for fabric, texture, logo and quality. Live checks then only ask "which closet item is this, and what state is it in?" That adds detail *and* removes output tokens.
7. **Don't add** "cheap-looking material," a holistic "fit quality" field, or free-text "evidence" in production. They are unreliable, they are effectively the AI scoring, and they cost a lot of tokens. Published 2026 tests put zero-shot *fabric* recognition at about 47–49% F1, the hardest attribute type.

---

## 0. What the saved data actually says

### 0.1 Where the time goes (measured from `raw_results.json`)
| Test | Input tokens (image + text) | Visible output | Thinking | Median seconds | Fit |
|---|---|---|---|---|---|
| test4 mirror-12 v3 | 1,848 (image ~1,080 + text 767) | 731 | 1,218 | 15.65 | sec ≈ 2.3 + 0.0074 × output tokens (corr 0.77) |
| test3 stock-40 v3 | 1,862 (image ~1,107 + text 767) | 705 | 1,217 | 15.95 | sec ≈ 0.2 + 0.0085 × output tokens (corr 0.81) |

- The image already uses Gemini 3's **default budget (about 1,120 tokens = `high`)**. So "higher resolution" today really means `ultra_high` (2,240 tokens, allowed per part only) or **crops**.
- Turning thinking off removes about 1,200 tokens (about 9–10 s). Even then, ~720 visible tokens at the measured rate is about 5.5 s. Third-party benchmarks put raw decode speed for Gemini 3.8 Flash at about 305 tokens/s, so the true visible-token cost may be lower than my fit suggests. Either way, **visible JSON size becomes the main latency lever once thinking is off.** The speed engineer should confirm by timing with thinking set to minimal.

### 0.2 Which fields really flip (all fields, not just the 9 the harness reports)
`run_test.py` only reports agreement for 9 fields (`FIELDS = [...]`). I computed it for every schema field across test1, test3 and test4. What I found:
- **Most "flips" are `na` vs. a value, not real disagreement.** Examples: `bottom.saturation` `na`/`muted` on jeans (89–94%), `top.sleeve_end` `na`/`at_wrist` (92–94%), `top.length` `na`/`mid_fly` (92–93%), `outerwear.length` (84% in test1). The rubric mostly ignores these, but they waste output tokens and add noise. This matches the 2026 WACV workshop study: VLMs are much worse at deciding *whether an attribute applies* (34% F1) than at classifying it once it does (71% F1). **Lesson: code should decide applicability (per garment type), not the AI.**
- **Real disagreements that move scores:**
  - neighbouring ordinal values: `hem` slight vs. full break (89–90%); `volume` ±1 (92–95%); `leg_shape` slim vs. straight (95%)
  - a small check read as solid (m10 overshirt, 1 of 3 runs, which flips K3 and costs a full point)
  - subcategories that straddle a credit threshold (m12: `overshirt` at dressiness 3 vs. `camp_collar_shirt` at 2.5, which flips K2)
  - pink read as `bright` vs. `muted` (m06, which flips K3)
  - `distressed_by_design` on jeans (m01, m10: 2 of 3)
  - footwear `condition` clean vs. worn (p02, s11: 3 of 5)
- **Scene fields flip too:** m06 `framing` was `three_quarter` in 1 of 3 runs.

### 0.3 Why scores run high (m06, m08, m10)
| Photo | App | Stylist | What the app read | What's missing |
|---|---|---|---|---|
| m06 | 7.0–7.5 | 5.5 | pink tee, clean, mid-wash jeans "distressed by design"; shoes hidden | **faded** tee, **size sticker** on the jeans, socks/no shoes. The schema has no way to say any of these (`condition` is a single choice, and none of the choices fit) |
| m08 | 9.0 ×3 | 7.0 | charcoal blazer, white dress shirt tucked, navy trousers `slight_break`, clean, derbies | trousers **too long + creased** (read as slight break), **charcoal-on-navy near-match**, possibly sleeve/cuff length. Only the near-match can be fixed in rules today |
| m10 | 9.5/8.5/8.5 | 7.0 | overshirt (plaid in 1 of 3 runs), tucked tee, belt, jeans, barefoot | barefoot is "partial," and the shoe credit's share is scaled up onto the others; small-check flip; credits fire for "has a layer," however it's worn |

### 0.4 Rule-only re-scores I ran (scratch copy, free)
Styles minimalist 0.5 / smart casual 0.5, occasion everyday. "Consistent" means all runs within ±0.5 of the median, grouped by photo and stage, so stock counts are out of 40.

| Change | Stock-40 consistent | Mirror-12 consistent | Mirror avg gap / error vs. stylist | Photos that moved |
|---|---|---|---|---|
| v3 today | 39/40 | 11/12 | +0.62 / 0.71 | — |
| **R3 near-match blazer + trousers** (both dark, different families: −0.5 color) | 39/40 | 11/12 | +0.58 / **0.67** | m08 9.0 → 8.5 |
| **R4 partial checks scale credits halfway** | 39/40 | **12/12** | +0.62 / 0.71 | m10 outlier 9.5 → 9.0; p01, p04, s26 −0.5 |
| **R3 + R4** | 39/40 | **12/12** | **+0.58 / 0.67** | as above |
| R1 small-scale patterns don't earn K3 | 39/40 | 11/12 | +0.54 / 0.71 | fixes m10, but breaks m12 (8.5/8.5/7.5); m03 and m05 −0.5 |
| R6 always-bright hues ignore saturation | 39/40 | 11/12 | +0.71 / 0.79 | m06 becomes *stable* at 7.5, **further** from the stylist |
| R5 count patterned "multicolor" garments for K3 (a logic gap today) | 39/40 | 10/12 | +0.67 / 0.75 | m12 now flips on K2 instead |

**Lesson from R6 and R1:** making a flip-prone field coarser makes the score steady, but it can steady it at the *wrong* value. The pink flip on m06 was accidentally carrying information: the tee *is* washed out. **Pair every stability fix with the field that captures the real problem** (here, `faded`). And as `rubric/v3.md` already warns, these are the same photos the rules were tuned on.

---

## 1. New schema fields

**How to read the table:**
- **Feeds** is the rubric rule the field would drive.
- **Consistency** is my prediction until measured. A field must reach ≥90% run-to-run agreement on the new labeled set before it may affect the score.
- **Tokens** is the extra visible output per check, assuming about 4 garments.
- **S** = score-affecting; **A** = advice-only.

### 1a. Per-garment `issues` list (recommended format for all "defect" reads)
One array per garment, with values from a fixed list. An empty array (`"issues":[]`) is about 4 tokens. Each flag present adds about 3–5.

| Flag | Applies to | Feeds | Fixes | Consistency risk | S/A |
|---|---|---|---|---|---|
| `faded` (colour washed out or uneven from washing, **not** designed fades; denim is excluded and stays under `distressed_by_design`) | top, outerwear, bottom (non-denim) | Care total (new, about −0.3); also **blocks K3** (a faded colour isn't a point of interest) | m06 | Medium. Could be confused with light or pastel colours and dim light. Only fire on `certainty: clear`; the upper crop helps | **S** (small) once ≥90% |
| `tag_or_sticker` (size sticker, price tag, store tag visible) | any | **Top free fix** ("peel the size sticker"). Not a penalty, because people check fits while trying clothes on in stores | m06 | Low–medium. High-contrast rectangles are easy at good resolution; at 480 px, hit-or-miss | **A** (shown first among fixes) |
| `heavy_wrinkles` (deep creases across the garment; normal fabric folds don't count) | top, outer, bottom | replaces `condition: wrinkled` with a clear-only, heavy-only version; Care −0.4 | m08 trousers | Medium. Light wrinkles flip, so only "heavy" scores | **S** (heavy only) |
| `stretched_neckline` | tees, knits | Worn out −0.4 | — | Medium; needs the upper crop | **S** once ≥90% |
| `collar_collapsed` (collar curled, flat or wilted) | collared shirts, polos | Advice ("collar stays / a sturdier polo") | — | High at full-body resolution; needs the upper crop | **A** |
| `pilling`, `fraying`, `scuffed` | knits / hems / shoes | split out of `pilled_or_worn` (same −0.4, but the advice names the problem) | p02, s11 | Same as today (95%) | **S** (as today) |
| `stain` | any | as today (−1.2, clear only) | — | as today | **S** |

**Why a list and not separate booleans:**
- `condition` is one choice today, so a wrinkled *and* faded shirt can only report one.
- Booleans force the model to decide on every garment (in principle more consistent) but cost about 8–10 tokens each per garment. Eight booleans × 4 garments ≈ 300 tokens, about 2.4 s at today's rate.
- A list costs about 4 tokens when nothing is wrong, which is most checks.
- **Risk:** models sometimes leave things out of lists. **Experiment E4 compares both.**

### 1b. New per-garment fields (only where they apply)
| Field | Values | Feeds | Fixes | Consistency risk | Tokens | S/A |
|---|---|---|---|---|---|---|
| `sleeves_rolled` | true/false (long sleeves only) | fix detection for "roll sleeves"; replaces relying on `above_wrist` vs. `at_wrist` | p06 fix pair, m10 | **Lower than `sleeve_end`.** A visible fold is a sharper cue than "where does the cuff end" | ~6 | **A** (fix detection) |
| `pant_length` | `short` / `right` / `long` (relative to the shoe; a narrower question than `hem`) | Pooling/break rules; combine with `hem` in code: `long` + `full_break` → "hem them" (−0.4) | **m08** | Medium–high at full body, low–medium on the hem crop or shoe snap | ~6 | **S** only from a hem crop or shoe snap; **A** otherwise |
| `jacket_sleeve` (tailored jackets only) | `shows_shirt_cuff` / `covers_cuff` / `too_short` / `unclear` | Tailoring advice (the ¼–½ in of cuff rule) | m08 (possibly) | High at full body; needs the upper crop | ~7 | **A** |
| `shoulder_seam` (tops and jackets) | `on_shoulder` / `dropped_by_design` / `past_shoulder` / `unclear` | Already advice-only in v3. Could later strengthen F8 "too big" | — | High; the oversized-by-design ambiguity is real | ~7 | **A** |
| `texture` | `smooth` / `knit` / `ribbed_cord` / `linen_slub` / `denim` / `leather_suede` / `fleece_technical` | the tonal-outfit tip ("vary texture"), the odd-jacket texture-contrast tip, closet search | — | **High.** Fabric is the hardest attribute class for VLMs (~47–49% F1 in 2026 tests). Read it once from a closet photo | ~6 | **A** |
| `hem_style` (untucked shirts) | `straight_hem` / `curved_tails` | T1: curved dress-shirt tails worn untucked look sloppy; a straight-hem shirt is fine | — | Medium | ~6 | **S** at work/interview; otherwise **A** |
| `open_or_closed` (outerwear) | `open` / `closed` | Advice (blazers buttoned when standing); also helps the "shirt below blazer" check | — | Low risk | ~5 | **A** |

### 1c. Scene-level additions
| Field | Values | Feeds | Fixes | Consistency risk | S/A |
|---|---|---|---|---|---|
| `footwear_state` | `shoes_on` / `socks_or_barefoot` / `cut_off` | Partial-check label ("No shoes on: put your shoes on, then snap them"); with R4, no full scale-up of credits | m06, m10 | **Very low.** Obvious, and could be computed on device (ankles visible + no shoe) | label only |
| `framing`, `shoes_visible` | (existing) | **Move to on-device Apple Vision body pose** (ankle and hip joints in frame, with confidence). The result is deterministic and 0 output tokens | m06 framing flip | n/a (code) | — |
| `matching_set` (outfit-level) | `suit_or_coord` / `separates` | R3 near-match: a suit is fine; dark separates that nearly match are not | m08 | Medium. Color-family code (R3) already gets most of this for free | **S** via R3 |

### 1d. Fields I recommend *not* adding
| Idea | Why not |
|---|---|
| "Cheap-looking vs. quality material" | Not consistently visible; it tracks lighting, resolution and brand, and it is a socioeconomic judgement. Use concrete proxies instead (`pilling`, `stretched_neckline`, `collar_collapsed`, `faded`), which are the things stylists actually cite as making clothes "look cheap" |
| Holistic "fit quality: generic vs. tailored" | It is effectively the AI giving a score, which breaks "the AI sees, the code judges." Build it in code from `shoulder_seam`, `pant_length`, `jacket_sleeve`, `strain` and volume-vs-band |
| Anything about the body ("clingy," "tight on the stomach") | Hard rule: never rate bodies. Keep all wording about the *fabric* (as `strain` already does) |
| Free-text `evidence` per field in production | +20–40 tokens per field. Use it only in a diagnostic run to learn *why* fields flip |

**Token budget:**
- Today: about 710 visible tokens.
- Slim schema: about 320.
- Add the `issues` lists (~20 tokens), `footwear_state` (~6), `sleeves_rolled` (~6), `pant_length` (~6) and `hem_style` (~6): about **365 tokens**, still about half of today.
- Advice-only crop fields (`jacket_sleeve`, `shoulder_seam`, `texture`) add about 50–80 more, and only when they apply (a tailored jacket present, a crop sent).

---

## 2. Better pixels

**Token facts (Gemini 3, docs updated Sep 23, 2026):**
- Image tokens per level: `low` 280, `medium` 560, `high` 1,120 (also the default), `ultra_high` 2,240.
- `ultra_high` can be set **per image part only**. You can **mix levels in one request**.
- Per part: `"media_resolution": {"level": "MEDIA_RESOLUTION_HIGH"}` next to `inline_data`. Global: `generation_config.media_resolution`.
- Google's own recommendation for images is `high`.
- Segmentation masks are **not supported** on Gemini 3 Flash. Bounding boxes are.

| Idea | Expected gain | Consistency risk | Latency / tokens | Effort | When it's worth it |
|---|---|---|---|---|---|
| **P1. On-device crop to the person before resizing** (Apple Vision `DetectHumanRectanglesRequest` or the body-pose bounding box, plus a 10% margin; keep the full outfit) | More pixels on clothes at the same token cost. In a typical iPhone mirror selfie the person fills about 40–60% of the frame, so a 1024 px crop roughly doubles the pixels per garment. Should help faded, sticker, wrinkles, hem | Low; same content, larger | **0** output tokens; on-device time is tens of ms (to confirm in the app) | Low (iOS); can be tested now with `sips` (E2) | **Always.** The default |
| **P2. On-device scene facts** (body pose: are both ankles in frame? are hips? `CalculateImageAestheticsScoresRequest` for blur) | Removes the `framing` / `shoes_visible` flips; drives the partial label and the "retake" decision deterministically | None (deterministic) | Saves about 30 output tokens | Low | Always |
| **P3. Multi-crop in ONE call:** full body at `medium` + upper crop (neck to hips; **excludes the face**, which is a privacy win) at `high` + lower crop (knees to below the feet) at `high` | Collar, neckline, shoulder seam, cuff, tag, fade on top; hem, length, shoe type and condition below. This is the static version of what Gemini's own "Agentic Vision" does by zooming, which Google says gives a 5–10% boost on vision benchmarks | Medium. The model must merge three views into one garment list. Tell it explicitly: "the images show the same person; list each garment once" | Input ~560 + 1,120 + 1,120 = **2,800 vs. 1,120 tokens (+1,680)**. Input is cheap (+$0.0013/check at intro price) and prefill is fast, but **measure** the time to first token. Output is unchanged if the schema is unchanged | Medium (crop boxes from pose joints; small harness change) | When the original photo has **≥ about 1,500 px of person height** (most modern phones at 2–3 m). Skip it for small library images; send one image instead |
| **P4. Shoe snap** (already planned, §5.6) | Footwear plus `hem` / `pant_length` from a close view: fixes m06 and m10 partials and m08-style length misses | Low–medium (the straight-down angle can fake pooling, per the spec) | A second call, user-triggered and **off the main path**. Make it a *tiny* schema (footwear + hem + pant_length, about 60 output tokens), thinking minimal, and it should be about 1–2 s | Medium | Whenever shoes are cut off; also make it the **only** source of S-level `pant_length` |
| **P5. `ultra_high` on the full photo** | Little beyond P3, at 2× image tokens | — | +1,120 input tokens | Trivial | Not worth it; crops give more |
| **P6. Burst capture, pick the sharpest** (the 3-2-1 auto-capture takes 3 frames; pick the least blurry on device) | Fewer motion-blur misreads; steadier wrinkle and texture reads | Lowers flips | 0 | Low | Always, with the propped camera |
| **P7. Agentic Vision (code-execution zoom loop)** | Highest detail | Low | **Several extra turns, many seconds** | Trivial to switch on | **Never on the live check.** Maybe for closet "deep reads" in the background |

---

## 3. Prompting techniques for stability

| Technique | What to do | Gain | Risk | Tokens / latency |
|---|---|---|---|---|
| **T1. Code decides applicability** | Per-category garment objects (`anyOf`: top / outer / bottom / footwear / accessory), each with only its own fields. Accessories carry just `subcategory` + `color_family` | Removes most of today's flips (`na` vs. value) and about 55% of output | Very large `anyOf` schemas can be rejected; test it. Fallback: keep one object but make non-applicable fields optional | **−390 tokens (about −3 s at today's rate)** |
| **T2. Field order: easy anchors first, then the hard ones** | The API follows schema order (our saved outputs come back in schema order). Order: category → subcategory → color → pattern → pattern_scale → volume/leg → hem → pant_length → issues → certainty. Put `sleeves_rolled` *before* any sleeve-length field | Later answers condition on earlier ones (e.g. "small check" after "checks_plaid") | Little | 0 |
| **T3. One-line definitions with visual anchors** for each borderline value, as already done for pooling | e.g. "`faded`: the colour looks chalky or uneven compared with the seams, collar or inside; light pastel colours are not faded." "`tag_or_sticker`: a printed size strip down the leg, or a hanging tag." "`heavy_wrinkles`: creases you could see from across a room" | Big for new fields; this is the cheapest consistency tool | Longer prompt (+100–200 input tokens) | ~0 (input only) |
| **T4. Explicit `unclear` value** on borderline fields only (`jacket_sleeve`, `shoulder_seam`, `pant_length` from full body) | Code treats `unclear` as "don't fire, don't credit," so a guess can't flip the score | Lets the model abstain instead of guessing. The 2025 self-consistency literature shows abstaining is how hallucinations drop | Over-use of `unclear` → less detail; measure the rate | 0 |
| **T5. Locate first** (`box_2d` per garment, normalized 0–1000) | Grounds each garment before describing it. Also lets **code measure geometry**: top-hem box vs. the hip joint from pose → `length`; inner-shirt box below the blazer box → `shows_below_outer`; bottom box end vs. ankle joint → cuffed or cropped (fix detection) | Could replace three flip-prone AI judgements with code | Box jitter; mirror reflections; Google recommends thinking minimal for spatial output | **+~20 tokens per garment (~+80, about 0.6 s)** |
| **T6. Few-shot reference images** (e.g. 3 small anchor images: pooling / full break / slight break; faded vs. new tee) | Calibrates borderline values; Google recommends few-shot examples generally | Over-conforming to the examples (Google's warning); needs your own photos (licensing) | +280–560 input tokens each. **A fixed prefix of 4,096+ tokens becomes implicitly cached on Gemini 3.x Flash** (cost discount) | Input only |
| **T7. Text exemplars** instead of images ("Example: a grey tee with a size sticker → issues: [tag_or_sticker]") | Cheaper version of T6 | Same over-conforming risk | +50–100 input tokens | ~0 |
| **T8. Diagnostic-only `evidence`** | Run once with a free-text `why` on flip-prone fields, to learn what the model is looking at | — | **+20–40 output tokens per field.** Never ship it | Test-only |
| **T9. Temperature** | The harness uses 0; Google "strongly recommends" 1.0 for Gemini 3 (to avoid looping). Consistency is already 92–97% at 0 | — | If the speed engineer changes thinking, re-check both settings | 0 |

---

## 4. Using more than one photo, or the closet

| Idea | How | Gain | Consistency | Latency | Effort |
|---|---|---|---|---|---|
| **M1. Closet deep read (off the critical path)** | When an item is saved (from a check or a flat-lay photo), run a *background* call at `ultra_high` with thinking on: texture, logo size, print vs. plain, fabric weight look, true colour, pattern scale, issues | The hardest attributes are read once, carefully, from a close photo. That fixes logo-size and graphic-vs-plain flips for good | **Very high afterwards:** a confirmed closet value is fixed (spec §5.3) | **0 on the live check** | Medium (v1 Closet already planned) |
| **M2. Closet-anchored live check** | Send the short list of likely closet items as text (`id: "navy chinos, straight"`). The model returns `closet_id` + **state only** (tucked, hem, sleeves_rolled, issues, open/closed) | Detail comes from M1; the live read only handles what changes day to day | High | **Fewer output tokens** (an id replaces about 8 fields) | Medium |
| **M3. Re-check as a "what changed?" two-image call** | Send the *before* reading as text plus both photos; ask only for the fields a fix can change (hem, tucked, sleeves_rolled, layers, swapped item) | Comparing two images is easier than reading each one cold. Targets the p06 subtle pair and the 67–83% fix detection | High (anchored, per spec) | Small schema, so **faster than a full check** | Low–medium |
| **M4. "Not quite right?" corrections** | Each correction (e.g. "these are chinos, not trousers") overrides the field instantly (spec), persists on the closet item, and is logged as a labeled example | Real labeled data for definitions (T3) and exemplars (T7); finds systematic misreads | — | 0 | Low (logging) |
| **M5. Per-user priors** | If a user corrected `leg_shape` twice on the same item, prefer the corrected value on future matches | Fewer repeat errors | High | 0 | Low |

---

## 5. Handling flip-prone fields

| Technique | Apply to | Notes |
|---|---|---|
| **F1. Coarser categories for scoring** (keep the fine value for advice) | `logo` → `none` / `visible` (`large` only via M1 closet reads); `pattern: graphic` vs. plain → closet-confirmed only; `volume` 1–5 → fitted / regular / loose when computing the style band; `hem` slight vs. full break → one "break" value except for narrow legs | The R6 lesson: coarsen only where the field is pure noise, not where it carries information |
| **F2. No credit thresholds between known flip pairs** | K2 (dressiness ≥3) currently sits between `camp_collar_shirt` 2.5 and `overshirt` 3 (m12). K3 sits between small check and solid (m10) | Either move the item to one side or give half credit for borderline items, so a flip costs ±0.25 instead of ±0.5 |
| **F3. Certainty gating** | Every **S-level** new field fires only when `certainty: clear` (as stains and big logos do today) | Free; reduces false positives, but also detail. Track how often it fires |
| **F4. Sensitivity check in code (no extra call)** | After scoring, re-score with each flip-prone field moved to its known neighbour (`slight_break` ↔ `full_break`, `volume` ±1, `bright` ↔ `muted`). If the score moves ≥0.5, use the value that **doesn't** award a credit or charge a penalty, and show it as a tip ("sleeves look roughly at the wrist") | Zero latency; makes "same photo → same score" much more robust. Downside: it leans toward 7.0, so only use it for the known flip pairs from the test data |
| **F5. Targeted second call** | Only on **re-checks** or **user-triggered** reviews: a yes/no question on one crop, thinking minimal, ~10 output tokens | Not on the first check (it breaks the speed goal). Background use is possible, but a score that changes after it's shown hurts trust (only the shoe snap is allowed to do that, and it is labeled) |
| **F6. Majority of 3 in the background** | Only for building the closet (M1), never live | Self-consistency removes hallucinations at about 3× the cost, which is fine for a one-time read |

---

## 6. The ranked plan

Ranked by detail gained × consistency, ÷ (latency + effort).

| # | Idea | Known misses it fixes | Consistency risk | Latency / tokens | Effort | Verify with |
|---|---|---|---|---|---|---|
| 1 | **Slim schema (T1) + per-garment `issues` list (1a)** | m06 (faded, sticker), m08 (wrinkles), split wear types | Medium (new flags); lower overall (fewer `na` flips) | **−300 to −350 visible tokens net (about −2.5 s at today's rate)** | Low–medium (schema + prompt + `rubric.py` mapping) | E3, E4 |
| 2 | **On-device person crop (P1) + scene facts from pose (P2)** | resolution-limited misses; m06 framing flip | Low | 0 output; −30 tokens | Low | E2 (now, with `sips`); in-app later |
| 3 | **Rule-only: R3 near-match + R4 half-scaled partial credits + F2 thresholds** | m08 (part), m10 | Improves (12/12 mirror) | 0 | Very low | E1 (`rescore.py`, free) |
| 4 | **`footwear_state` + `sleeves_rolled` + `pant_length` (hem crop / shoe snap only for S) + `hem_style`** | m06/m10 labels, p06 fix detection, m08 length | Low–medium | +~25 tokens | Low | E3, E5 |
| 5 | **Shoe snap with a tiny schema (P4)** | every partial check; m08-type length | Low–medium | Separate, user-triggered, ~1–2 s | Medium | E6 |
| 6 | **Re-check as a two-image diff (M3)** | fix detection (p06), "score can't randomly go down" | High | Smaller than a full check | Low–medium | E5 |
| 7 | **Multi-crop in one call (P3), only for high-res originals** | collar, shoulder, cuff, fade, tags, hem | Medium | +1,680 input tokens; output unchanged | Medium | E7 |
| 8 | **Closet deep read (M1) + closet-anchored live check (M2)** | logo and graphic flips, texture, quality signals | High once confirmed | **Live check gets faster**; background call is slow but off-path | Medium (part of v1 Closet) | E8 (after Closet exists) |
| 9 | **Sensitivity check in code (F4)** | residual flips (hem, volume, saturation) | Improves | 0 | Low | E1 |
| 10 | **Advice-only crop fields** (`jacket_sleeve`, `shoulder_seam`, `collar_collapsed`, `texture`) | tailoring advice (m08), tonal tip | High; that's why they stay advice-only | +50–80 tokens when they apply | Low once P3 exists | E7 |
| 11 | **Boxes + code geometry (T5)** | `length`, `shows_below_outer`, cuffed/cropped | Medium | +~80 tokens | Medium–high | v1.1 |
| 12 | **Few-shot images (T6)** | borderline hem and fade calibration | Risk of over-conforming | Input only; cacheable above 4,096 tokens | Medium (needs your own anchor photos) | after E3, if fields still flip |

---

## 7. Where detail and speed will conflict (for the critique round)

| Speed move I expect | Effect on detail | My position |
|---|---|---|
| **Thinking set to minimal** | Probably small for categorical reads; possibly worse for subtle ones (hem, fade, small checks). m09 spent 2,711 thinking tokens (26 s) on a simple suit, so much of the thinking isn't adding detail | **Agree, if** E3 shows consistency ≥90% and the new-field agreement holds at minimal. Crops (P3) do the "looking" that thinking might otherwise do. Test `minimal` vs. `low` |
| **Lower `media_resolution` (low/medium) to save time** | Directly loses detail. Image tokens are *input*, which costs far less time than output | **Resist going below `medium` on the full image.** Spend savings on output instead (slim schema) |
| **Cut fields** | Good if it cuts *dead* fields (`na` placeholders on accessories, scene fields computable on device); bad if it cuts detail | **Agree on dead fields** (that's my #1). Keep the `issues` list |
| **Smaller or cheaper model (Flash-Lite)** | 2026 attribute study: Flash-Lite about 53% F1 vs. Flash about 60% vs. Pro 64% on fine-grained fashion attributes | Only if E3 on Flash-Lite keeps ≥90% consistency **and** ≥ the same field accuracy on the labeled set |
| **No second calls** | Loses the targeted re-ask (F5) | **Agree** for the first check. Allow it only for the shoe snap (user-triggered), re-checks, and background closet reads |
| **Multi-crop adds images** | (Speed concern) a bit more prefill time | Measure time to first token. If it adds >0.5 s, use crops only when the original is high-res |
| **Streaming the JSON / early scoring** | Compatible if score-critical fields come first | Field order T2 already puts them first |
| **Temperature changes** | Gemini 3 docs recommend 1.0; we use 0 | Whoever changes it must re-run consistency |

**What reconciles the two goals:** *pay for detail with dead tokens.* Today's output is about 55% `na` and default values. Cut those, compute scene facts on device, crop on device, and move the slow reads into the closet background. Then the live check can carry *more* detail in *fewer* tokens.

---

## 8. Experiments (exact steps)

All commands run from `extraction-test/`, using `/usr/bin/python3`.

**Two harness gaps to fix first:**
- (a) `FIELDS` in `run_test.py` only reports 9 fields. Add `saturation`, `pattern_scale`, `length`, `sleeve_end`, `strain`, `distressed_by_design`, `shows_below_outer`, `certainty` and any new fields (I computed these by hand for §0.2).
- (b) `rescore.py` hard-codes `new_name = "v3"`, so re-scoring after a rule change **overwrites** the existing `rescored-v3/` folders (test1, test2). Add a `--name` flag before using it for E1.

### E1. Rule-only changes (free, today)
1. Freeze the current rules: `cp rubric.py rubrics/rubric_v3.py`.
2. Implement R3 (near-match: blazer/sport coat/unstructured blazer in charcoal/navy/black + trousers/chinos in a *different* one of those → −0.5 color), R4 (credit scale-up `(1 + max/visible) / 2`) and F2/F4 in `rubric.py`.
3. Run:
   - `/usr/bin/python3 rescore.py results/test4-mirror-12-v3 --photos ../inputs/mirror-fit-check-1 --old rubrics/rubric_v3.py --name v3_1`
   - `/usr/bin/python3 rescore.py results/test3-stock-40-v3 --photos ../inputs/fitcheck-photos --old rubrics/rubric_v3.py --name v3_1`
4. **Pass:** mirror ≥11/12, stock ≥38/39, fix detection not worse, mirror error vs. stylist ≤0.71. My scratch result: 12/12, 39/40, 0.67.

### E2. Person crop (no code change)
1. Make `../inputs/mirror-fit-check-1-crop/` and `../inputs/fitcheck-photos-crop/` with the same folder layout.
2. Crop each photo to the person plus a margin by hand or with `sips -c <h> <w> --cropOffset <y> <x>`. Copy `fixes.csv` and `metadata.csv` across.
3. Run:
   - `/usr/bin/python3 run_test.py --photos ../inputs/fitcheck-photos-crop --runs 3 --out results/e2-stock-crop`
   - `/usr/bin/python3 run_test.py --photos ../inputs/mirror-fit-check-1-crop --runs 3 --out results/e2-mirror-crop`
4. **Compare** with test3/test4: consistency, field agreement, and whether `condition` / `hem` readings change on m06 and m08. Expect a gain on stock (1,800 px originals), little on mirror (≤737 px).

### E3. Slim schema + `issues` + new fields
1. Write `schema_v4.json` / `prompt_v4.txt` (T1 per-category objects, T2 order, T3 definitions).
2. Harness change: `--schema` / `--prompt` flags (about 4 lines), plus `--thinking minimal|low` and `--media-res` (generationConfig fields, about 6 lines).
3. Run each of these on both photo sets, `--runs 3`:
   - `--thinking minimal --out results/e3-v4-min`
   - `--thinking low --out results/e3-v4-low`
4. **Pass:**
   - consistency ≥90%
   - new-field agreement ≥90% (otherwise the field stays advice-only)
   - visible output tokens ≤400
   - seconds per call reported (shared with the speed engineer)

### E4. List vs. booleans
Same as E3, but issues as 8 required booleans: `--out results/e4-v4-bool`. Compare agreement and tokens.

### E5. Fix detection: new real pairs
1. Use real fix pairs from the new photo set (below): cuff pooled jeans, tuck, roll sleeves, peel sticker, steam shirt.
2. Run `/usr/bin/python3 run_test.py --photos ../inputs/fix-pairs-1 --runs 3 --out results/e5-fixes` with schema v4.
3. Then the M3 variant (harness flag `--pair-diff`: sends before reading + both images) to `results/e5-fixes-diff`.
4. Add `peeled_sticker` and `steamed` to `fix_detected()`.
5. **Pass:** ≥80% detected, and the score never goes down after a real fix.

### E6. Shoe snap
For 6 outfits: full body + straight-down snap + knee-height snap. Run a tiny footwear+hem schema: `--schema schema_shoe.json --out results/e6-shoesnap`. Compare hem and `pant_length` with the full-body reading and your labels.

### E7. Multi-crop in one call
1. Harness change: `--crops` builds full@medium + upper@high + lower@high. Use fixed fractions for the test (top 15–60%, bottom 50–100% of the person crop); the app will use pose joints.
2. Run on the **new full-resolution set only**: `--crops --out results/e7-crops` vs. `results/e7-single`, same schema.
3. **Measure:** advice-field agreement, accuracy vs. labels, time to first token / seconds, input tokens.

### E8. Closet anchoring
Later, once the Closet exists: compare a live check with a closet hint vs. without, on 10 repeat outfits.

### New photos needed (the existing sets can't test this)
About 24 staged **pairs**, shot on an iPhone at full resolution (12 MP), with **both** a mirror shot and a propped shot of each. You plus friends, with consent. **Clean vs. problem**, one change each:

| Problem | Pair |
|---|---|
| Faded tee | old faded tee vs. new tee in the same colour |
| Sticker | size sticker on vs. off the jeans |
| Wrinkles | wrinkled vs. steamed shirt |
| Pant length | pooled vs. cuffed or hemmed trousers |
| Sleeves | sleeves down vs. rolled |
| Collar | collapsed polo collar vs. crisp |
| Neckline | stretched-neck tee vs. new |
| Tailoring | blazer with a navy near-match trouser vs. grey trouser |
| Tailoring | jacket sleeve showing vs. covering the shirt cuff |
| Shirt hem | curved-tail shirt untucked vs. tucked |
| Shoes | barefoot vs. shoes on |
| Bad outfit | one deliberately bad full outfit |

Add a `labels.csv` with the true value of each new field per photo. Also add a small harness change: per-field **accuracy** vs. labels, not just consistency. Consistent and wrong is still wrong.

---

## Sources

**Gemini (Google)**
- Media resolution, Gemini API docs (updated 2026-09-23): https://ai.google.dev/gemini-api/docs/media-resolution and https://ai.google.dev/gemini-api/docs/generate-content/media-resolution
- Image understanding, Gemini API docs (updated 2026-09-23; tiling, `box_2d` 0–1000, segmentation with thinking minimal): https://ai.google.dev/gemini-api/docs/image-understanding
- Gemini 3 developer guide (thinking levels, temperature 1.0 advice, segmentation not supported on Gemini 3 Flash/Pro): https://ai.google.dev/gemini-api/docs/gemini-3
- Prompt design strategies (Gemini 3: be direct; few-shot recommended, over-conforming warning): https://ai.google.dev/gemini-api/docs/prompting-strategies
- Structured output docs (updated 2026-09-23): https://ai.google.dev/gemini-api/docs/structured-output
- Context caching (implicit caching minimum 4,096 tokens on Gemini 3.x Flash; updated 2026-09-02): https://ai.google.dev/gemini-api/docs/caching
- "Introducing Agentic Vision in Gemini 3 Flash," Google blog, Jan 27, 2026: https://blog.google/innovation-and-ai/technology/developers-tools/agentic-vision-gemini-3-flash/
- Gemini 3.8 Flash review (305 tok/s, 13.3 s time to first token, "very verbose"), Sep 2, 2026: https://www.eesel.ai/blog/gemini-3-8-flash-review
- Older context on alphabetical key ordering (Dec 2024; our 2026 outputs follow schema order): https://dylancastillo.co/posts/gemini-structured-outputs.html

**Apple Vision**
- Kodeco, "New Vision framework features in iOS 18 / iOS 26" (Oct 9, 2025; unified body + hand pose, aesthetics scores): https://www.kodeco.com/ios/paths/apple-ai-models/49307523-vision-framework/04-unveiling-new-vision-framework-features-in-ios-18-ios-26/02
- Vision request reference (GeneratePersonSegmentationRequest iOS 18+, quality levels; person instance masks): https://tessl.io/registry/dpearson2699/swift-ios-skills/3.9.0/files/skills/vision-framework/references/vision-requests.md
- Apple, VNHumanBodyPoseObservation (joint names incl. ankles, wrists, hips; per-joint confidence): https://developer.apple.com/documentation/vision/vnhumanbodyposeobservation

**Fashion attributes and VLM detail**
- "Zero-Shot Product Attribute Labeling with VLMs: A Three-Tier Evaluation," WACV 2026 workshops (Jan 2026; DeepFashion-MultiModal; fabric hardest, NA detection 34% F1): https://arxiv.org/html/2601.15711v1
- Fashionpedia ontology (27 categories, 19 parts, 294 attributes; ECCV 2020, background for the attribute list): https://arxiv.org/pdf/2004.12276
- "Benchmarking LVLMs on Fine-Grained Image Tasks" (2025; fine-grained attributes below 70%): https://arxiv.org/html/2504.14988v1
- "MLLMs Know Where to Look: Training-free Perception of Small Visual Details," ICLR 2025 (cropping helps small details): https://arxiv.org/pdf/2502.17422
- "Self-Consistency as a Free Lunch," 2025 (abstaining / consistency reduces VLM hallucination): https://arxiv.org/html/2509.23236v1

**What menswear stylists check**
- Wearify, "Men's Suit Fit Guide: Shoulders First" (Jul 13, 2026; shoulder seam, ¼–½ in shirt cuff, jacket length, break): https://thewearify.com/?p=264241
- The Modest Man, "Broke But Stylish" (Jul 21, 2026; wrinkles, faded collars, fraying, low-quality fabrics as "cheap" signals): https://www.themodestman.com/?p=618179
- Westwood Hart, odd trousers and blazers (Mar 30, 2026; clearly different or identical, never nearly; texture contrast): https://westwoodhart.com/blogs/westwood-hart/styling-odd-trousers-blazers-menswear-texture-contrast
- Care of Carl, matching trousers with an odd blazer (Feb 4, 2025; near-matching tones): https://www.careofcarl.co.uk/en/style-advice/how-to-match-trousers-with-an-odd-blazer.html
- T.M. Lewin, how a suit should fit (undated; same checkpoints): https://tmlewin.co.uk/blogs/the-fitting-room/how-a-suit-should-fit
- He Spoke Style, how everything should fit (2022, older; collar and shirt-cuff checks): https://hespokestyle.com/how-clothes-should-fit/

**Project data (measured here):** `extraction-test/results/test1-stock-40`, `test3-stock-40-v3`, `test4-mirror-12-v3` `raw_results.json` (tokens, seconds, all-field agreement), plus re-scores R1–R6 run against a scratch copy of `rubric.py`.

---

## Round 2 (critique and converge, Oct 6)

*Inputs:*
- the lead's 8-photo probe (`results/probe-*`)
- `06_speed-engineer.md`
- `08_test-designer.md`

*Still no API calls. The v4 numbers below come from converting 180 saved readings (test3, test4 and probe-off-1024) to v4 in a scratch script and back.*

### R2.1 What the probe changes for me
- **Thinking off costs no detail we can measure:**
  - 96% of field modes match the default
  - 7/8 photos consistent (vs. 6/8 with thinking)
  - mean score −0.19
  - With thinking off, the model even reads `wrinkled` more often on m08's trousers and m10's overshirt, which moves both *toward* the stylist estimate.

  So I accept thinking off. The open question is accuracy on subtle reads, which needs the gold pairs.
- **Visible JSON is now the whole cost.** Thinking off still returns about 780 visible tokens, which takes 7.3 s. The slim schema is no longer optional.
- **Pixel size doesn't change tokens** (about 1,850 at every size), and 512 px was still consistent. But 5 of the 8 probe photos are ≤737 px originals, so this says nothing about detail. **Keep 1024 px plus the on-device person crop.** Smaller images only save upload bytes.

### R2.2 Critique of the speed engineer's plan
| Proposal | Verdict | Why |
|---|---|---|
| Thinking off / low | **Accept** | Probe data above. On 3.8, "low" already gives 0 thinking tokens |
| Fixed slots, only the fields the rubric reads, short keys with descriptive values, adapter | **Accept, with one rule added** | Define **top = the innermost top**, and anything worn *open over it* (open shirts, cardigans, jackets) goes in `outer`. Without this, s01 (open dress shirt over a striped tank) loses its credit in 2 of 3 runs. The m10/m12 "overshirt vs. camp shirt" flip lands in the same slot, so it stops mattering |
| **Drop accessories** | **Change: replace them with an `extras` list** (`belt_black`, `belt_brown`, `watch`…) | About 2 tokens per item instead of about 190 per accessory object. It keeps the belt-and-shoe tip and the "finishing touch" tip. Still advice-only (watch flips) |
| ~400-token output budget | **Accept as a hard ceiling for p90** | v4 below estimates **~240 tokens on average, ~290 at p90**, *including* the `issues` lists. So the detail fields fit with about 110 tokens to spare |
| 8 s deadline + fallback model + hedge request | **Accept, with a guard** | A reading from the fallback model must be **cached and labeled by model** and never mixed into the "same photo → same score" history. Use the first answer that returns; never average two |
| Explanation off the critical path, streaming, warm-up | **Accept** | No detail cost. The streaming order (scene → top → outer → bottom → shoes) matches my field order |
| Rich closet reads in a background / Flex call | **Accept** | It's my M1 |
| Caching won't trigger | **Agree** | That rules out few-shot images (T6) for now |

### R2.3 Critique of the test designer's plan
- **Accept** truth labels, the sealed held-out split, the panel's ICC check, the non-inferiority bars and the per-field accuracy gate (G4). "Consistent and wrong is still wrong" is exactly the m12 lesson.
- **Change: the labeling burden.** About 132 images plus about 78 label sheets plus double-labeling is 15–18 hours for a solo founder. Cut it by **staging labels instead of writing them.**
  - Every "before" photo is built to show one known defect, so the truth for that field is written in advance (`expected_before` / `expected_after`).
  - The founder only ticks "as planned / not as planned."
- **Fold my detail pairs into Block B** rather than shooting extras: faded vs. new tee, sticker on vs. off, wrinkled vs. steamed, collar, near-match vs. grey trousers under a blazer, barefoot vs. shoes.
- **Shrink C and E to 12 each.** Shoot A-bad and B first: they carry both the detail tests and the fix tests.
- **Add truth fields:** each `issues` flag, `feet`, belt yes/no.
- **For issue flags, gate on precision ≥ 80% before recall.** A false "your tee looks faded" is worse than a miss.

### R2.4 Revised plan (in order)
1. **Schema v4 (below) + thinking off, as one combined variant.** The speed and detail changes now converge on the same schema. Run it against the baseline on the legacy 52 + the probe 8 (non-inferiority), then on gold.
2. **Rule-only fixes through `rescore.py`:** R3 (near-match) + R4 (half-scaled partial credits) + the top/outer slot rule. Add `faded` (−0.3, blocks K3) and `feet` (partial label) once v4 readings exist.
3. **On-device person crop at 1024 px** (test it on gold originals, not the legacy set).
4. **Shoe snap** with a tiny footwear + hem schema. It is the only scored source of pant length.
5. **Deferred until the gold set shows real misses:**
   - multi-crop
   - tailoring advice fields (`shoulder_seam`, `jacket_sleeve`, `texture`)
   - boxes
   - few-shot examples

   Multi-crop stays the preferred way to add detail later, because it is input-only.
6. **Dropped:** targeted second calls on the first check.

### R2.5 Schema v4 (proposal)
**Top level** (`propertyOrdering` in this order):
- `scene`
- `top` (object or null)
- `outer` (array, 0–2 items, inner to outer)
- `bottom` (object or null)
- `shoes` (object, or null unless `feet = shoes_on`)
- `extras` (array)

| Slot | Field (key) | Values |
|---|---|---|
| scene | `clothed` | fully, partial |
| | `framing` | full_body, three_quarter, upper_only *(later from on-device pose)* |
| | `feet` | shoes_on, socks_or_barefoot, cut_off |
| top | `type` | tee, graphic_tee, polo, knit_polo, oxford_shirt, dress_shirt, flannel_shirt, camp_collar_shirt, rugby_shirt, sweater, quarter_zip, hoodie, sweatshirt, tank_top, jersey, traditional, other |
| | `color` | white, off_white_cream, light_grey, grey, charcoal, black, navy, light_blue, blue, bright_blue, denim_light, denim_mid, denim_dark, olive, green, bright_green, sage, khaki_beige, tan_camel, brown, burgundy, red, muted_red, orange, muted_orange, yellow, muted_yellow, pink, dusty_pink, purple, muted_purple, multicolor *(saturation is folded in)* |
| | `pat` | solid, stripes_fine, stripes_medium, stripes_bold, check_fine, check_medium, check_bold, graphic_print, camo, floral, other *(scale is folded in)* |
| | `logo` | none, small, large |
| | `fit` | integer 1–5 |
| | `hem` | tucked_full, tucked_half, untucked_cropped, untucked_at_belt, untucked_mid_fly, untucked_below_crotch, hidden *(tucked + length merged)* |
| | `sleeve` | short, pushed_or_rolled, at_wrist, over_hand, hidden |
| | `issues` | list (below) |
| | `sure` | clear, likely, unsure |
| outer[] | `type` | overshirt, flannel_shirt, camp_collar_shirt, oxford_shirt, dress_shirt, cardigan, hoodie, blazer, unstructured_blazer, sport_coat, suit_jacket, denim_jacket, bomber, leather_jacket, chore_coat, field_jacket, puffer, fleece, overcoat, rain_jacket, shell_jacket, other |
| | `color`, `pat`, `logo`, `sleeve`, `issues`, `sure` | as for top |
| bottom | `type` | jeans, chinos, trousers, drawstring_trousers, suit_trousers, cargos, joggers, sweatpants, shorts, athletic_shorts, traditional, other |
| | `color`, `pat` | as for top |
| | `leg` | skinny, slim, straight, relaxed, wide, flare_bootcut, barrel, shorts |
| | `hem` | pooling, full_break, slight_break, no_break, cuffed, cropped, shorts, hidden |
| | `issues`, `sure` | as for top |
| shoes | `type` | white_leather_sneaker, low_profile_sneaker, canvas_sneaker, retro_runner, performance_runner, chunky_sneaker, basketball_sneaker, loafer, derby, dress_shoe, chelsea_boot, suede_chukka, work_boot, slides_sandals, other |
| | `color` | as for top |
| | `issues`, `sure` | as for top |
| extras | (list) | belt_black, belt_brown, belt_other, watch, hat, bag, tie, jewelry |

**`issues` values** (one shared enum; the prompt says which ones apply to which slot): faded, tag_or_sticker, wrinkled, stain, pilling, stretched_neckline, fraying, collar_collapsed, scuffed, strain, hangs_below_jacket, distressed_by_design.

**How `na` and defaults are avoided:**
- Missing garments are a **null slot**, not a list of `na` fields.
- Every enum value is a real, visible state (`hidden`, `short`, `shorts`), never `na`.
- **Rare defects live in `issues`.** An empty `[]` means clean. `strain`, `shows_below_outer` and `distressed_by_design` become list values.
- Saturation is folded into `color`, scale into `pat`, and length into the top's `hem`.
- Fields the rubric never reads per slot are gone: bottom/outer volume, shoe pattern and logo, and the scene's `people_count`, `mirror_selfie` and `lighting`.

**Adapter `v4_to_garments()` → today's `rubric.py` (unchanged):**

| v4 | Becomes in today's rubric fields |
|---|---|
| slot | `category` (top / outerwear / bottom / footwear) |
| `type` | `subcategory` |
| `color` | split into `color_family` + `saturation`:<br>• `dusty_pink` → pink + muted<br>• `bright_X` → X + bright<br>• `muted_X` → X + muted<br>• burgundy / sage → muted<br>• red / orange / yellow / pink / purple → bright<br>• everything else → na |
| `pat` | `pattern` + `pattern_scale` (fine → small, medium → medium, bold → large; `graphic_print` → graphic) |
| top `hem` | `tucked_*` → `tucked`; `untucked_*` → `tucked = none` + `length`; `hidden` → `length` na |
| `sleeve` | `sleeve_end`: pushed_or_rolled → above_wrist, at_wrist → at_wrist, over_hand → covers_hand, everything else → na |
| `issues` | `condition` (stain > wrinkled > pilling / fraying / stretched_neckline / scuffed → pilled_or_worn > clean)<br>`strain` → clear<br>`hangs_below_jacket` → `shows_below_outer`<br>`distressed_by_design` → the existing field<br>`faded`, `tag_or_sticker`, `collar_collapsed` → new pass-through keys for rubric v3.1 |
| `feet` | `shoes_visible` = (`feet` == shoes_on), plus a pass-through for the partial-check label |
| `extras` | accessory entries (the rubric ignores them; the tips can read them) |
| fields v4 doesn't send | `fit` default 3 where absent, `leg` / `hem` na for non-bottoms, shoe `pattern` = solid |

**Measured on 180 saved readings converted to v4:**
- **About 490 vs. 1,480 characters (33%)**, so about 240 output tokens on average and about 290 at p90. A 4-garment m08-type outfit plus a belt comes to about 270. The chars-per-token calibration is from today's output, ±30%.
- That leaves about 110–160 tokens of the 400–450 budget for `issues` entries and later additions.
- **Round trip: 177/180 give the identical score.** The 3 differences:
  - s01: two tops in one reading, fixed by the innermost-top rule
  - s02: the shoe "pattern" was the only thing triggering the 3+ patterns rule. That field was flip-prone (95%) and arguably wrong, so dropping it is intended
- **Behavior changes to accept knowingly:**
  - open shirts over a tee now always count as a layer (K1)
  - shoe pattern no longer counts toward pattern rules

*Draft converter and adapter: scratchpad `v4.py`. Not added to the project.*

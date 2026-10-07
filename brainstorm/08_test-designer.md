# 08 · Test Designer: how we prove which fit-check changes actually help

*Role: test designer. Oct 6, 2026. Inputs: CLAUDE.md, testing-plan.md, extraction-test/ (run_test.py, rescore.py, README, results/INDEX.md and the saved raw results), rubric/v3.md, inputs/. No API calls were made. The numbers below marked "measured" come from re-reading the saved `raw_results.json` files.*

**Headline:** our current test can't tell a real improvement from noise, and it can't tell "consistent" from "correct."
- Re-running the *same* setup moved the score by 0.5 or more on **5 of 39 photos (13%)**. Any variant that moves fewer photos than that hasn't shown anything.
- Fix detection rests on **6 stock pairs**. 5/6 has a 95% range of **44–97%**, so it tells us nothing.
- Every number so far is **agreement with itself**, on the **same 52 photos the rubric was tuned on**, judged against **one rater (Claude) who helped tune it**.

The plan below fixes all three for about **$30–40 in API calls and 4 weeks**. It finishes before the Nov 3 beta.

---

## 0. What the saved runs already tell us (measured, free)

| Fact | Value | Why it matters |
|---|---|---|
| Score spread inside one photo (5 runs, temp 0) | SD **0.15–0.20** per photo; 21–27 of 39–40 photos gave the identical score on every run | Temperature 0 is *not* deterministic. We need several runs per photo for consistency, but not for accuracy |
| Same setup, two fresh runs (test1 re-scored v3 vs test3) | Medians differ with SD **0.23**; **5/39 photos moved ≥ 0.5** | This is the **noise floor ("A/A noise")**. Every variant comparison has to beat it |
| Spread between photos | SD of medians **0.75–0.83** | The score does separate outfits. A variant that shrinks this is getting worse, even if it looks "more consistent" |
| API time per call | median **15.7–16.0 s**, 90th percentile **20–22 s**, slowest 48 s (the slowest includes retry back-off) | The current "seconds" mixes in the 20 s back-off waits, so p90 and max are inflated |
| Tokens per call | ~1,860 in · ~710 visible out · **~1,220–1,380 thinking** | Thinking is ~63% of output tokens and most of the cost |
| Cost per call (intro prices) | **0.86¢** now → **1.72¢** after Jan 1, 2027 | Thinking off alone would be ~0.40¢ → 0.81¢ |
| Fix detection on the 6 stock pairs | 67% or 83%, depending on the run | 6 pairs is too few to know anything. The "detected" pairs mostly had a **0.0 score change**, so the app would say "fixed" while the score stays flat |
| Known blind spot | m12: linen pull-ons were read as "trousers" **consistently** | High agreement can still mean consistently *wrong*. That's why we need truth labels |

---

## 1. The gold set

### 1.1 Size and mix (gold v1: ~132 images from ~78 labeled outfit-states)

The unit of labeling is an **outfit-state**: one outfit, before or after a fix. Extra captures of the same outfit (mirror, dim light, shoe snaps) reuse its labels, so they're cheap to add.

| Block | Images | What's in it | What it tests |
|---|---|---|---|
| **A. Singles** (propped phone, good light, full body) | **30** | 8 strong outfits · 10 clean basics (tee/jeans/sneakers that fit) · **12 deliberately bad** (6 obvious, 6 subtle) | Does the score track human judgment across the whole 4–9 range? Does v3 score bad outfits low? |
| **B. Fix pairs** (propped, same spot, back-to-back shots) | **48** (24 pairs) | **20 real improvements:** cuff pooled jeans ×4 · tuck (dress shirt with trousers, or a tee into high-rise wide pants) ×3 · roll sleeves from covering the hands to above the wrist ×3 · running shoes → white leather or low-profile sneakers ×4 · oversized tee → regular fit ×2 · add an overshirt or knit ×2 · sweatpants/gym shorts → chinos or jeans ×2. **2 "make it worse"** (untuck a dress shirt under a blazer; running shoes with trousers). **2 null pairs** (retake the same outfit, no change) | Does the score go **up** when he fixes something, stay **flat** when nothing changed, and go **down** when he makes it worse? |
| **C. Hard conditions** (re-shoots of A/B "before" outfits) | **24** | 12 mirror selfies · 6 dim rooms (one lamp, evening) · 6 small rooms / three-quarter framing | Does the score stay the same when only the photo gets worse? |
| **D. Partial photos** | **6** | 4 with shoes cut off · 2 upper body only | Does the partial-check logic work without inflating scores (the m10 problem)? |
| **E. Shoe snaps** | **24** (12 pairs of shots) | Each pair has one straight-down shot and one from knee height. Pick shoes that get confused: running vs. retro runner vs. low-profile vs. white leather; loafer vs. derby; Chelsea vs. work boot | Which angle reads shoe type and hem correctly? |
| **Total** | **~132** | about 78 outfit-states to label; **78 images to rate** (A + B) plus **24 pair preferences** | |

**Rules for the deliberately bad outfits.** Across the A singles plus the B "before" photos, cover **every rule that moves the score at least twice**:
- pooling
- shirt too long
- too big (sleeves over the hands)
- strain
- shirt hanging below a blazer
- wrinkles
- worn out
- untucked dress shirt at work
- big top + skinny pants
- everything oversized
- bulky shoes + narrow pants
- 3+ accent colors
- bright clash
- same pattern at the same scale
- 3+ patterns
- too casual for the occasion (a hoodie to an interview)
- way too formal
- suit + running shoes
- loungewear outside the gym or home

Half should be **subtle** (a slight pool, one wrong shoe), not cartoonish. Real users' mistakes are subtle.

**Rules for fix pairs** (this is the p06 lesson):
- The "before" has to show the problem clearly: jeans really pooling, sleeves really over the hands.
- The "after" has to show it clearly fixed.
- Change **one thing only**. Keep the same spot, light, pose and phone position.
- Shoot both within 2 minutes with the 3-2-1 timer.
- If the fix isn't obvious to a friend at a glance, reshoot it.

**Occasions:** most photos are everyday/class. About 8 carry a stated occasion (work, interview, date) so the occasion rules get tested. The occasion is written in `gold.csv` and shown to raters.

### 1.2 Sources and privacy
- **Only the founder plus 5–10 consenting friends aged 18+** (the core is 18–25). No minors at all, even though the app is 14+.
- Get a short written consent (a text message is fine). It should cover:
  - what the photos are for (private testing only)
  - that they're sent to Google's Gemini API on the **paid tier** (Google's terms say paid-tier content isn't used to improve its products, while free-tier content can be; re-check the current terms)
  - that they're never used in marketing
  - that they're deleted on request
- Store the photos only in `inputs/gold-v1/`.
- The **web-sourced mirror selfies (m01–m12) and the stock 40 stay "legacy."** They're for private screening and regression only. Never quote them as proof of quality.
- **Rater copies are cropped at the chin** (or the face is blurred). This keeps raters scoring clothes, not looks, which mirrors the app's "never rate faces" rule and removes the attractiveness halo.

### 1.3 Two kinds of labels

**(a) Truth labels: what was actually worn.** The wearer knows the real garment ("these are chinos," "relaxed fit per the tag"). The founder fills in the visual fields from the photo. That takes about 2 minutes per outfit-state:

| Category | Fields labeled |
|---|---|
| Scene | shoes_visible, framing, lighting |
| Top | subcategory, color_family, volume (coarse: fitted / regular / oversized), tucked, length, sleeve_end, shows_below_outer |
| Outerwear | subcategory, or "none" |
| Bottom | subcategory, color_family, leg_shape, hem |
| Footwear | subcategory, color_family |
| Outfit | `intended_rules`: the rubric rules the founder set out to trigger (e.g. `F4_pooling`), or "none" for good outfits |

- **Ambiguity is allowed and written down.** A label can be an **acceptable set** (`slight_break|full_break`), or `?` for "honestly can't tell," which leaves it out of accuracy.
- **Double-label 20%** of outfit-states (a friend does them blind). If two humans agree on a field less than 80% of the time, that field is inherently ambiguous. Then we don't gate on it, and it becomes advice-only.

**(b) Human scores: what the target user thinks.**
- **Raters:** 6–8 friends aged 18–25, working independently. Minimum: 5 who finish the whole set.
- **The question:** "How put-together does this outfit look for [occasion]? 1–10, half points OK."
- **Order:** the images come in shuffled order (Google Forms "shuffle question order"). The two photos of a pair are never next to each other.
- **Pair section at the end:** the two photos of each pair side by side, with left/right randomized. "Which looks better? A / B / about the same."
- **Optional free text:** "One thing you'd change?" We compare it with the app's top fix (tracked, not gated).
- **Excluded from the panel:**
  - **the founder**, who designed the outfits and knows the intended scores (his ratings are reported separately)
  - **Claude**, who helped tune v3 (its estimates are a sanity column only)
  - **any rater's own photos**, which are dropped from that rater's sheet
- **Blind:** raters have **never seen an app score**. Collect ratings **before** they become beta testers.
- **Workload:** 78 images plus 24 pairs, about 30 minutes, split into two 15-minute sittings.

**Inter-rater agreement:**
- **ICC(2,1)** is how well one random friend agrees with another (expected ~0.4–0.5 for taste ratings).
- **ICC(2,k)** is how trustworthy the panel average is. With 6 raters it should reach ~0.80–0.86.
- **The panel average counts as truth only if ICC(2,k) ≥ 0.70.**
- If it's lower, people genuinely disagree about style. In that case:
  - human-score gates drop to *tracked* status
  - we lean on the pair preferences (much more reliable than absolute scores) and on the truth labels
- Photos where raters spread widely (panel SD > 1.5) are marked "contested" and reported separately.

**The human baseline:** for each rater, compute the average error between that rater and the mean of the *other* raters. The median of those is the "typical friend's error." It's the fairest bar for the app: **the app should be at least as close to the group as a typical friend is.**

### 1.4 Held-out split (so rule tuning isn't graded on its own homework)
- **Split before anyone runs the app on gold photos**, with a script and a fixed random seed. The split goes in `gold.csv`.
- **~40% held-out:**
  - every photo of at least 2 friends (whole people go to held-out, so their bodies, rooms and wardrobes are new)
  - plus a random 30% of the founder's outfits
- Every image of an outfit (pair, conditions, shoe snaps) stays **in the same split**.
- **Stratify** so held-out gets at least 8 improvement pairs, 1 null pair, 5 bad singles, 5 mirror shots, 4 shoe-snap pairs and 2 partials.
- **Dev (~60%) + legacy 52:** tune rules (with `rescore.py`, free), screen variants and compare variants.
- **Held-out is sealed.**
  - It's scored only at **gates**, at most 2 looks before beta, each logged in INDEX.md.
  - The founder never looks at per-photo held-out results while editing rules.
  - After a look that leads to changes, the next gate needs **fresh held-out photos** (gold v2 from beta testers, §5).

---

## 2. Metrics and pass bars

Two sets of bars: **launch gates** (the final setup, on held-out, 5 runs) and **non-inferiority bars** (any variant compared with the baseline, on dev). "Tracked" means it's reported every time but doesn't block anything by itself.

### 2.1 Launch gates (hard)

| # | Metric | How it's computed | Pass bar | Why this bar |
|---|---|---|---|---|
| G1 | **Consistency** | Share of photos where all 5 runs are within ±0.5 of that photo's median | **≥ 90%**, and **no photo spans more than 1.0** | Existing bar, plus a cap on wild flips |
| G2a | **Average error vs. the panel** | Mean of \|app median − panel mean\| over rated held-out photos | **≤ the typical friend's error (human baseline) and ≤ 1.0** | "As good as asking a friend" is the product promise |
| G2b | **Big misses** | Share of photos where the app and the panel differ by **≥ 1.5** | **≤ 10%** | Big misses are what get screenshotted and mocked |
| G2c | **Ranking agreement** | Spearman correlation between app medians and panel means | **≥ 0.6** (and no more than 0.1 below the median rater's correlation with the rest) | Catches a score that's "close on average" but doesn't rank outfits |
| G2d | **Bias** | Mean of (app − panel) | **within ±0.3** | Fixed by one baseline shift **fitted on dev only** (today it's ~+0.6) |
| G3a | **Fix noticed** | Improvement pairs where the fixed field changed in the right direction | **≥ 80%** (dev + held-out pooled, ~20 pairs; held-out may not trail dev by more than 15 points) | 20 pairs is the smallest count where 80% means something (95% range 58–92%) |
| G3b | **Score rose** | Improvement pairs where median(after) − median(before) ≥ +0.5 | **≥ 75%**, and **no improvement pair drops by ≥ 0.5** | A "fix" with a flat score is a broken aha moment |
| G3c | **No false alarms** | Null pairs whose score moves ≥ 0.5, or where a score-moving field flips | **0 of the null pairs** (tracked as a rate once there are more) | Re-checking an unchanged outfit must not "reward" him |
| G3d | **Agrees with people** | Pairs where the app's direction (up / flat / down) matches the panel's pair preference | **≥ 80%** | Real-world check on G3b |
| G4 | **Field accuracy vs. truth** | Correct share of labeled fields on clearly visible items (acceptable sets count as correct) | **≥ 85% pooled** across score-moving fields. **Each key field** (hem, bottom subcategory, footwear subcategory, tucked, top subcategory, leg_shape) **≥ 80%**, otherwise that field becomes advice-only | Accuracy, not agreement: m12 was 100% consistent and wrong |
| G5 | **Latency, API only** | Time for one successful extraction call, no back-off | **p50 ≤ 5 s, p90 ≤ 8 s** | The speed goal; p90 is what people remember |
| G5e | **Latency, end to end** | Shutter → score on screen (resize + upload on LTE + API + rubric) | **p50 ≤ 7 s, p90 ≤ 10 s** | The staged loading screen can cover ~7 s, not 20 |
| G6 | **Reliability** | Calls that fail or return bad JSON after 1 retry | **≤ 1%**; and **0 "nothing readable"** on good-light full-body photos | Every failure is a lost daily check |
| G7 | **Cost per check** | (extraction + explanation call) at **Jan 2027 prices** | **≤ 2.0¢ hard ceiling; target ≤ 1.0¢** | At 1 free check + 1 re-check a day, 2¢ is ~$1.20/month per active free user |

**Fallbacks are designed in, so a failed gate isn't automatically fatal:**
- G4 fails on one field → that field becomes advice-only.
- G2d fails → shift the baseline (fitted on dev).
- G3 fails → anchored re-checks (only re-read the changed detail).
- G5 fails → show the score first and stream the explanation in afterward.

### 2.2 Tracked metrics (every report)
- **Condition robustness:** \|score(mirror/dim/small room) − score(good propped photo of the same outfit)\|. Target median ≤ 0.5. If mirror is much worse, lead with the propped camera (already the plan).
- **Partial-check correctness:** is shoes_visible / framing right, and how far do partial scores sit from the full-photo score of the same outfit (the m10 inflation).
- **Self-agreement per field** (the current table).
- **"Unsure" rate on clearly visible garments**, target ≤ 5%. The rubric drops "unsure" garments, so a variant that says "unsure" more often looks more consistent while seeing less. This number catches that.
- **Score spread:** SD of photo medians ≥ 0.6, range at least 5.5–8.5. This catches a variant that "passes" consistency by scoring everything 7.0.
- **Exact-repeat rate:** share of photos where every run gives the identical score.
- **Rule precision/recall** against `intended_rules`.
- **Shoe-snap field accuracy** by angle.
- **Tokens** (in / visible out / thinking / cached), retries, 429s.
- **Gap to Claude's estimates** (legacy m01–m12 only).

### 2.3 Non-inferiority bars ("speed must not cost quality")
A speed variant passes only if **all** of these hold against the baseline, run **in the same session on the same photos**:

| # | Check | Bar |
|---|---|---|
| N1 | Consistency | Inconsistent photos ≤ baseline + 2 (out of ~60–75), and ≥ 90% absolute |
| N2 | Field accuracy (pooled, dev truth labels) | Point difference ≥ −2 points, and the low end of the 90% interval ≥ −5 points |
| N3 | Average error vs. panel | High end of the 90% interval on (variant − baseline) ≤ **+0.15** |
| N4 | Fix response (dev pairs) | At most **1 net pair** lost on G3a and on G3b |
| N5 | Big misses | ≤ baseline + 1 photo |
| N6 | Score drift | ≤ 20% of photos move ≥ 0.5 vs. the baseline (A/A noise is 13%), and the mean shift is ≤ 0.2 |
| N7 | Spread and "unsure" guard | SD of medians doesn't drop by more than 0.1; the unsure rate doesn't rise by more than 3 points |

A **detail variant** has to show **superiority** on its target (for example hem accuracy, fix detection or average error), with the 90% interval above zero. It also has to pass N1 and N5–N7, and stay inside the latency budget (G5).

---

## 3. Experiment design

### 3.1 How big a sample we need (plain math)
- **Use the unrounded score for comparisons.** That's `7.0 + credit_points − mistake_points`, which the rubric already returns. Rounding to 0.5 hides small effects and creates cliffs. Gates still use the displayed score.
- **Detecting a real average shift of 0.25 points** (paired SD ~0.35): about **15–16 photos**. Detecting **0.15 points:** about **43 photos**.
- **Non-inferiority on average error with a margin of 0.15** (SD of the per-photo difference ~0.4, one-sided 5%): about **44 rated photos**. With a margin of 0.2: about **25**. So the comparisons that involve human scores run on the **~47 rated dev images**, and the held-out set (~31 rated) is for the **absolute** gates.
- **Consistency at 90% on 40 photos** has a 95% range of 77–96%. On 60 photos it's 80–95%. That's why N1 is a **count rule** ("no more than 2 extra flippy photos"), not a percentage race.
- **Fix detection** needs **≥ 20 pairs** before 80% means anything. Today's 6 pairs can't pass or fail.
- **Runs vs. photos:** for accuracy, **more photos beat more runs** (1 run × 60 photos > 3 runs × 20). Runs only matter for consistency.
  - Screening: 1–2 runs.
  - Dev comparisons: 3 runs.
  - Gates: 5 runs.

### 3.2 Fair-comparison rules
1. **Same photos, same day, interleaved.** For each photo, the harness runs every variant, rotating which goes first. API speed changes with server load and time of day, so a variant run on Tuesday night vs. a baseline from last week is meaningless. Compare latency only within one sequential session.
2. **One change at a time to screen. A small factorial to combine.**
   - Screen each speed knob alone: thinking level, media resolution, image long edge, trimmed output, model tier, seed.
   - Take the **2 strongest** into a **2×2** on dev (for example thinking {low, off} × resolution {medium, low}). The baseline is a fifth reference cell. Effects like "thinking off hurts more at low resolution" only show up here.
   - Detail knobs are tested **alone, on the subset they apply to** (shoe snaps on the shoe-snap outfits, multi-crop on everything).
   - Then the **combined candidate** (best speed setup + accepted detail changes) is **re-tested as a whole**. Gains don't simply add up: multi-crop can eat the time thinking-off saved.
3. **Write the bar down before the run.** Each INDEX.md row gets the hypothesis, the variant, the photo list, the metric and the pass bar *before* the run. A bar decided after seeing the number isn't a test.
4. **Watch out for the winner's curse.** Screening 8 variants means one will look good by luck. The winner has to win again on a **fresh full dev run** before it reaches held-out.
5. **Test the real re-check flow.** CLAUDE.md says re-checks reuse the first reading. So fix detection is measured both ways: **independent** (two separate readings) and **anchored** (the after photo plus the before reading, "what changed?"). Whichever ships is the one we gate on.
6. **The rubric is frozen during extraction experiments.** Rule changes are tested separately with `rescore.py` (free) on dev. Never change the rules and the extraction in the same comparison.
7. **Same image pipeline as the app.** Whatever resize and JPEG settings win must be the ones the iOS app uses. The test resizes with `sips` to 1024 px; the app has to match, or the test doesn't transfer.

### 3.3 The cheap screen (kills bad ideas for about 40¢ each)
- **Screen set:** 20 fixed images, chosen to be the hardest.
  - legacy p06 and p01 (before and after)
  - m10, s02 and the 2 other legacy photos that flipped most
  - once gold exists: 4 dim/partial, 4 pair photos and 4 clean dev photos
- **Runs:** 2 per variant (40 calls, ~40¢). Compare against the baseline's readings from the same session, field by field.
- **Kill the variant if any of these happen:**
  - **Speed variants:** API p50 not at least 30% faster, or field match with the baseline reading below 85%
  - **Detail variants:** the target field isn't better on its subset
  - **All variants:** median moves by ≥ 1.0 on 3 or more photos; any bad JSON; the unsure rate jumps
- **Survivors** go to the full dev run (3 runs, all dev + legacy images).

---

## 4. Harness changes (spec for the developer)

**Principle:** every run writes a **manifest**, so any two results can be checked for comparability, and the harness refuses to compare runs that aren't comparable.

### 4.1 `run_test.py`: new flags
| Flag | What it does | API mapping / notes |
|---|---|---|
| `--config variant.json` | Bundles every setting below under one `name`. Command-line flags override it | The preferred way. One file per variant in `extraction-test/variants/` |
| `--variants a.json,b.json,...` | Runs several variants **interleaved per photo**, rotating the order | Results go to `<out>/<variant>/raw_results.json` |
| `--thinking {default,off,minimal,low,medium,high}` / `--thinking-budget N` | Sets the reasoning effort | `generationConfig.thinkingConfig` (thinkingLevel on 3.x models, thinkingBudget on older ones). Record what was sent |
| `--media-resolution {default,low,medium,high}` | Sets how many tokens the model spends on the image | `generationConfig.mediaResolution = MEDIA_RESOLUTION_*` |
| `--max-edge N` (default 1024), `--jpeg-quality Q` | Image prep | Pass to `sips` (`-Z N`, `-s formatOptions Q`). Record output pixels and bytes |
| `--prompt PATH`, `--schema PATH` | Test prompt or schema variants without editing the live files | SHA-256 of each goes in the manifest |
| `--multi-image` | Sends extra images of the same outfit in **one** request, in a fixed order, each preceded by a text label | Extras are files named `<stage>_<method>__<tag>.jpg` (e.g. `before_propped__shoes_down.jpg`, `__crop_lower`). `find_photos` must group these with their main image, not treat them as separate photos |
| `--crops lower,upper` | Auto-generates fixed-fraction crops (bottom 35% for hem and shoes, top 55% for the top) and sends them as extras | Fixed fractions assume the framing guide was used. Log the crop boxes |
| `--recheck {independent,anchored}` | For "after" photos in anchored mode, also sends the before reading's JSON with "describe only what changed" | Needs `prompt_recheck.txt`. Fix detection is computed from the merged reading |
| `--seed N` | Asks the API for a fixed sampling seed | `generationConfig.seed`. Worth one screen; it may reduce flips |
| `--stream` | Uses `streamGenerateContent` and records time to first token and time to complete JSON | Scoring needs the full JSON, so **time to complete JSON** is the latency that counts |
| `--explain` | After scoring, calls the text model with the score JSON to write the explanation | The explanation is a **second call** today's harness doesn't measure. G5e and G7 need it |
| `--subset FILE` / `--split {dev,holdout,all}` | Runs a list of outfit IDs, or one split from `gold.csv` | `holdout` refuses to run unless `--unseal "reason"` is given. The reason is appended to `results/HOLDOUT_LOG.md` |
| `--resume` | Skips (variant, photo, run) combinations already in `raw_results.json` | Protects the budget after a crash or a 429 |
| `--budget-usd X` | Stops before the projected spend passes X | Uses the price table below |
| `--price-in`, `--price-out`, `--price-2027` | Per-million-token prices | Defaults $0.75 / $3.75, with the 2027 column doubled |
| `--concurrency N` (default 1) | Parallel workers, for big accuracy runs | **Latency is only valid at concurrency 1.** The report flags it otherwise |
| `--gold DIR` | Reads `gold.csv`, `labels.csv`, `ratings.csv`, `fixes.csv` | Turns on the truth and human sections of the report |

**New per-call fields in `raw_results.json`:**
- `variant`
- `t_start` (ISO time)
- `seconds_api`: the successful attempt only
- `seconds_total`: including retries and back-off
- `attempts`, `error_type` (429 / 5xx / timeout / bad_json / schema_fallback)
- `finishReason`
- `modelVersion` and `responseId` from the response
- `request_bytes`, `image_px`
- `ttft` (if streaming)
- `usage`, including `thoughtsTokenCount` and `cachedContentTokenCount`
- `raw_score` = 7.0 + credit_points − mistake_points (clamped to 3–10)
- `explain_seconds` and `explain_usage` (if `--explain`)

**Manifest (`manifest.json` per variant):**
- model name sent, plus the set of `modelVersion` values seen
- every generation setting
- prompt, schema and rubric SHA-256
- image pipeline settings
- a SHA-256 of every image's bytes **after** prep
- harness version
- date and time window
- concurrency

**Report additions (`report.md`):**
- a **Gates** table at the top (PASS / FAIL / NO DATA with 95% bootstrap ranges)
- latency p50 / p90 / p95 / max for `seconds_api` and `seconds_total`, separately
- failure and retry rate, and the 429 count
- cost per check now and in 2027, with thinking tokens shown separately
- spread (SD of medians), exact-repeat rate and unsure rate
- consistency by condition (propped / mirror / dim / small room / partial)

### 4.2 Truth and human comparison (`--gold`, used by run_test.py and rescore.py)

**Files in `inputs/gold-v1/`:**
- `gold.csv`: outfit_id, wearer_id, split, occasion, styles, block (A–E), condition, canonical_file, consent (y/n)
- `labels.csv` (long format): outfit_id, stage, category, field, value, labeler. The value can be an acceptable set `a|b` or `?`
- `ratings.csv`: image_id, rater_id, score
- `pairs.csv`: outfit_id, rater_id, prefer (before / after / same)
- `fixes.csv`: gains `expected_field`, `expected_before`, `expected_after`, plus `fix_type=none` for null pairs and `direction=worse` for make-worse pairs

**Matching garments:**
- For each labeled category, pick the predicted garment **of that category that matches the most labeled fields**.
- Today's `primary()` takes the first one, which makes results depend on list order (a tank under an open camp shirt).
- Report unmatched labels (garments the model missed) and extra predicted garments.

**Field accuracy:**
- Per field, on items the model marked clear or likely, with "coverage" (share not marked unsure) shown alongside.
- Also report the **top confusions**, e.g. trousers → drawstring_trousers ×4.

**Human metrics:**
- panel mean per image
- ICC(2,1) and ICC(2,k): two-way random effects, absolute agreement, complete-case raters
- per-rater leave-one-out error (the human baseline)
- app error, bias, Spearman, big-miss rate and contested photos (panel SD > 1.5)
- the same metrics for the founder and Claude columns, reported separately

**Bootstrap:** resample **photos** (not runs) 2,000 times with a fixed seed, for every interval.

**Fix detection v2:**
- report G3a–G3d per pair, with the expected field's before and after values
- report independent and anchored modes separately
- null pairs and make-worse pairs get their own rows

### 4.3 `rescore.py` fixes
- `--rubric PATH`: which rubric is "new." Today the live rubric is hard-coded and labeled "v3." The output folder is named after the rubric file.
- `--old PATH` stays as it is.
- `--gold DIR` and `--split dev`: re-scoring prints dev metrics only. Held-out needs `--unseal`, which is logged.
- `--fit-baseline`: fits the single bias shift (G2d) on **dev** panel scores and prints it. It never touches held-out.

### 4.4 New `compare.py`
`compare.py results/X/<variantA> results/X/<variantB> [--gold DIR] [--margin-mae 0.15] [--out comparison.md]`

1. **Refuses to compare** if the image hashes or the rubric hash differ, or if the runs were more than 24 h apart (override: `--force`, which is noted in the output).
2. **Side-by-side metric table** with differences and 90% bootstrap ranges.
3. **Paired tests on matched photos:**
   - unrounded scores: Wilcoxon signed-rank
   - field correctness and consistency per photo: McNemar
4. **An N1–N7 verdict** (non-inferior / not) and, for detail variants, a superiority verdict on a named `--target` metric.
5. **Per-photo difference list**, sorted by \|Δ median\|, with the fields that changed.
6. **Latency comparison** (p50 and p90, API and total) only if both runs used concurrency 1 in overlapping time windows.
7. **`--aa`**: when A and B are the same setup, prints the noise floor (share of photos moving ≥ 0.5, SD of differences). This calibrates N6.

### 4.5 Small helpers
- `gold_check.py`:
  - validates the CSVs (every image labeled, splits balanced, no rater rating their own photos, consent = y)
  - writes the shuffled, face-cropped rating copies to a separate folder for the form
  - creates the seeded split
- `canary.txt`: a fixed list of 10 dev images for drift checks (§6).

---

## 5. Order, cost and time (fits before the Nov 3 beta)

Planning price: **1¢ per call** (most speed variants actually cost 0.3–0.4¢, so this is conservative).

| Week | Founder does (≈ hours) | Experiments | Calls | Cost |
|---|---|---|---|---|
| **Week 1 · Oct 6–12** | Review the rubric. **Shoot the founder's part of the gold set** (A, B, C, E on 2 evenings, ~4 h). Message 8–10 friends for modeling and rating (consent text). Set up git for `extraction-test/` | Developer builds the harness changes (§4), self-test, **free A/A number** from saved runs (done: 13% / SD 0.23). **Speed screen on the legacy 52:** ~6 variants (thinking off, thinking low, media low, media medium, trimmed schema, seed) × 20 screen images × 2 runs + baseline | ~280 | **~$2.80** |
| **Week 2 · Oct 13–19** | Friends' photo session (~2 h, 3–5 friends, their rooms). Fill in `labels.csv` (~3 h). Double-label 20% (a friend, ~1 h). Run the seeded split. Send the rating form | **Speed full run** on legacy 52: baseline + 2–3 survivors × 3 runs, interleaved. **Detail screen:** shoe-snap angle, lower crop, higher resolution, new fields (whatever the detail engineer proposes) × 20 relevant images × 2 runs | ~620 + ~200 | **~$8** |
| **Week 3 · Oct 20–26** | Chase ratings until ≥ 5 raters finish. Check ICC. One latency session on a **phone hotspot (LTE)** at 7–9 am | **Gold dev baseline:** ~80 dev images × 5 runs. **2×2 speed factorial** on dev × 3 runs (4 cells, ~0.4¢ each). **Rule calibration on dev** with `rescore.py --fit-baseline` (free). Build the combined candidate and run it on dev × 3 | ~400 + ~960 + ~240 | **~$12** (real cost ~$7–9) |
| **Week 4 · Oct 27–Nov 2** | Read the gate report. Decide. Update CLAUDE.md and testing-plan.md | **Canary** (10 × 3). **Held-out gate (look #1):** baseline + candidate × ~52 held-out images × 5 runs, interleaved, concurrency 1 for one 20-image block (latency) and 3 for the rest. **E2E latency:** 30 checks on LTE with `--explain` | ~30 + ~520 + ~60 | **~$6** |
| **Beta · Nov 3–13** | Consenting beta testers (18+) send 20–30 real photos plus 3 fix pairs each, with permission | **Gold v2** = fresh held-out. Re-run the gates on it before App Store submission (look #2). This is the first truly unseen test | ~250 | **~$2.50** |
| **Total** | ~15–18 h of founder time over 5 weeks | | **~3,600** | **≈ $31 (budget $40 with retries)** |

**Decision points:**
- **End of week 2:** if no speed variant reaches p50 ≤ 5 s while passing screening, add the **smaller model tier** and **trimmed output** to the factorial. Plan for "score in ~6 s, explanation streams after."
- **End of week 3:** if ICC(2,k) < 0.70, human-score gates become tracked. Lean on truth labels and pair preferences.
- **End of week 4:**
  - all gates pass → build the v1 scoring pipeline with the winning config pinned
  - G3 fails → ship anchored re-checks and re-test on gold v2
  - G2 fails while G4 passes → the reading is fine and the rules are off. Recalibrate on dev, then test on gold v2 (not the same held-out again)

---

## 6. Pitfalls and how the program handles them

| Pitfall | What goes wrong | Guard |
|---|---|---|
| **Overfitting to the test photos** | v3 was tuned on the same 52 photos it's scored on, so those numbers flatter it | Legacy 52 are dev-only, never quoted as proof. A sealed held-out split by person. At most 2 logged looks. Gold v2 from beta testers is the final unseen test |
| **The model changing under us** | "gemini-3.8-flash" is an alias. Google can update it (or the preview) and shift readings or speed overnight. Prices double Jan 1, 2027 | Pin the **versioned model name** if one exists. Log `modelVersion` on every call. **Canary** (10 images × 3 runs, ~30¢) at the start of every experiment day and weekly after launch: if more than 2 images move ≥ 0.5 or field accuracy drops more than 3 points, re-run the baseline before comparing anything. Never compare to a baseline older than 24 h |
| **Grading with the rater who tuned the rules** | Claude's estimates and the founder's taste shaped v3, so agreeing with them is circular | Independent friend panel, blind, rating before seeing the app. Founder and Claude are reported separately. Own photos excluded |
| **Stock-photo optimism** | Pros, studio light, posed. Real users shoot mirror selfies in dim dorm rooms | The gold set is all real phones in real rooms. Condition robustness is tracked. Held-out uses friends' rooms. Gold v2 from beta testers |
| **Label ambiguity** | p06: the sleeves were already partly rolled, so "missed fix" was really a bad label | Acceptable-set labels and `?`. Double-label 20% and drop fields humans can't agree on. Fix pairs must be obvious at a glance. `expected_before` and `expected_after` written down in advance |
| **Consistency that's really blindness** | A variant that sees less (more "unsure," fewer garments) flips less | Accuracy gates (G4), the unsure-rate guard and the spread guard (N7) |
| **"Detected" without a score change** | Today p02 was "detected" while the score fell 0.5 | G3b requires the score to rise. G3d checks it against people |
| **Rounding cliffs** | 0.5 steps hide small effects, and one field can flip a photo across a boundary | Compare the unrounded `raw_score`; gate on the displayed score |
| **Rate limits and back-off polluting latency** | The 48 s "slowest call" includes a 20 s retry wait. Parallel runs slow each call | `seconds_api` and `seconds_total` are separate. Latency only at concurrency 1, interleaved, in one session. Run the LTE session at real check-in times (7–9 am) |
| **Daily limits and budget overruns** | The free tier allows 20 calls a day, and a crash mid-run wastes money | Billing on; `--resume`; `--budget-usd` |
| **Too many comparisons** | Screening 8 variants produces a lucky winner | Bars written before the run, a fresh confirmation run, and a small factorial instead of trying everything |
| **The test pipeline differing from the app** | The resize, crop or prompt in the app drifts from the tested one | The manifest records the image pipeline and hashes, and the iOS build must reproduce it. Re-run the canary through the real app once it exists |
| **Privacy** | Friends' photos leak, or get used in marketing | Consent text, paid tier only, local storage, face-cropped rater copies, no reuse without new consent. The web mirror set stays private |
| **Rater fatigue and anchoring** | Ratings drift by the 60th image, and seeing a pair side by side anchors them | Two 15-minute sittings, shuffled order, pairs split apart in the scoring section and preferences asked separately at the end |

---

## 7. What I need from the speed and detail proposals
When their proposals come in, I'll slot each one into this program by asking:
1. **Which knob, and its exact API setting** (so it becomes a `variants/*.json`).
2. **Its target metric and expected effect size.** Speed: p50 and p90 seconds. Detail: which field or gate, and by how much.
3. **What it costs on the other axis.** Latency for detail ideas; accuracy risk for speed ideas.
4. **Whether it needs new gold data** (shoe snaps, crops, new truth fields to label) or a schema change. Schema changes break `rescore.py` comparability and need the rubric adapted. Those go in their own comparison.

Anything that can't name a metric and a bar ahead of time goes to the back of the queue.

---

## Round 2: critique and converge (Oct 6, after the speed probe)

### R2.0 What the probe really shows (re-read from `results/probe-*`, free)
- **On 3.8, "low" and "off" are the same setup.** Both produced 0 thinking tokens, so comparing them is a free **A/A test** on the 8 hard probe photos. **3 of 8 medians still moved 0.5** (m08, m10, s09), and s02 swung between 4.5 and 6.5 across the arms.
  - So the differences in consistency between arms (6/8, 7/8, 8/8) are **noise**.
  - "768 px is best (8/8)" is **not** a finding. **Drop the "low" arm on 3.8.**
- **Settled by the probe (big effects or fixed facts):**
  - Thinking is about 9 s of the 16 s. API p50 drops 16.5 → 7.3 s and p90 20.1 → 8.2 s, over 24 calls per arm.
  - Image pixel size doesn't change input tokens, so `--image-px` is only an upload-size and detail lever, never an API-speed one.
  - `minimal` is rejected on 3.8.
  - With thinking off, visible output is ~780 tokens, so ~5.5 s of writing remains. Getting under 5 s **needs** a smaller output.
- **Not settled:** whether thinking off is just as good. The evidence so far is 8 hand-picked hard photos, 3 runs, no truth labels, and a control from a different day. The mean shift of −0.19 with a max of |1.0| (s02) is exactly what my N6 check is for.

### R2.1 Critique from a testing angle

| Claim | Status | What's needed |
|---|---|---|
| **Speed:** thinking off saves ~9 s | **Settled** | — |
| Thinking off doesn't hurt quality | **Needs data.** Runnable now for consistency and drift on the legacy 52; **needs the gold set** for accuracy and fix detection | X4 now, then X9 |
| Slim per-slot schema: −48% tokens, −2.6 s | The latency part is **runnable now** (a direct measurement). The quality risk (top vs. outer on overshirts and open flannels) **needs truth labels on layered outfits** | X5, then X9 |
| Switch to 3.6 Flash minimal / Flash-Lite | Runnable for speed. **Accuracy needs gold:** a weaker model can be *consistently wrong* (m12) | X6, then X9 |
| 8 s deadline + fast retry + hedge | **Simulate only** (`hedge_sim.py` on logged times). The real test is beta telemetry | X3 |
| **Fallback to a different model** on retry | **Overreaching for launch.** The fallback would have to pass every gate itself, doubling validation, and a check could get two different scores depending on which model answered. **Recommend: retry the same pinned model fast.** Revisit after launch | — |
| Priority tier | **Mostly untestable before launch.** Its benefit shows under load and during 503 storms, which one test hour can't reproduce. Treat it as a launch switch judged on beta telemetry (p90, 503 count) | Beta |
| Explanation off the critical path, streaming, pre-warm | Design choices, measurable only in the app. Agreed; no test needed except end-to-end latency in beta | Beta |
| "~4–5 s on a phone" | **A forecast, not a result.** The 2 s fixed part has to be measured with streaming from LTE | X14 |
| **Detail:** R3 near-match, R4 half-scaled partial credits (rescore-only) | **Free, runnable today, but only provisional.** They're tuned on the same photos and judged against Claude's estimates, which is circular. R4 fixes a known flaw (the m10 inflation), so accept it provisionally. R3 goes in the dev rubric; both are confirmed on held-out | X1 |
| F4 sensitivity check (pick the no-credit value) | Free to test for consistency, but it **pulls scores toward 7.0**. Spread and human agreement can only be judged on gold | X2, then X9 |
| `issues` list (faded, tag, heavy_wrinkles…) | **Needs gold, and enough positives.** One m06 isn't evidence. Each flag needs **≥10 photos that have it and ≥30 that don't** to measure misses and false alarms. **Overreach:** 8 flags at once. Start with 3 (tag_or_sticker, heavy_wrinkles, faded), **advice-only** until each has those counts | X10 |
| On-device person crop | Can be **simulated now** with `sips` on the stock originals (high-res). The mirror set is too small to benefit. The real test is the gold set at full resolution | X8 |
| In-call crops | Latency is measurable now. The benefit feeds advice-only fields, so it's **low priority**. Run it only if X9 shows hem or top-detail errors | X13 (optional) |
| footwear_state, sleeves_rolled, pant_length | **Need gold truth labels.** footwear_state and framing are better computed on-device from body pose, which can't be tested until the app exists | X10, X12 |
| Two-image "what changed?" re-check | **Needs real fix pairs and null pairs.** A "what changed?" prompt invites invented changes, so **null pairs are the key test** (at least 4) | X11 |
| Closet reads in the background | **Untestable now** (no closet). Defer | after v1 |
| Both engineers' pass bars use **agreement** (≥90%) | Necessary, not sufficient. Add **accuracy vs. truth labels** and a same-session control | Harness |
| `rescore.py` hard-codes "v3" | **Real bug.** The next re-score would overwrite the `rescored-v3/` folders. Fix it before anything else | H1 |

### R2.2 Is 132 images in 2 weeks realistic?
**Shooting is fine:** a one-change pair takes about 3–4 minutes, so 24 pairs is about 2 hours. **The bottlenecks** are friends' shoots in their own rooms, labeling (~2 minutes per outfit-state), and getting 5+ raters to finish a 30-minute form. For a solo founder with classes, the 132-image set is a **3-week** job. So the **minimum viable gold set (MVGS)** is the target for week 2. Grow it into the full spec with beta photos (gold v2).

| Block | Full spec | **MVGS** | Why MVGS is still decisive |
|---|---|---|---|
| Singles | 30 | **16** (4 strong, 4 basics, 8 bad) | Average error and big misses need ~25–36 rated dev photos; singles plus pair photos give ~36 |
| Fix pairs | 20 improve + 2 worse + 2 null | **16 improve + 4 null** (cuff ×3, tuck ×3, roll sleeves ×3, running → leather sneakers ×3, add a layer ×2, loungewear → chinos ×2) | **Pass ≥ 14/16, fail ≤ 11/16.** A stricter point bar makes up for the small sample. 4 null pairs test false alarms in the re-check |
| Mirror re-shoots | 24 conditions | **8** (pair "before" outfits, shot in a dim dorm room as mirror selfies) | Covers mirror and dim together |
| Partial | 6 | **4, made by cropping propped photos** (free) | The truth labels carry over |
| Shoe snaps | 12 × 2 | **6 × 2** | Enough to choose an angle, not to gate |
| **Images / labeled outfit-states / rated** | 132 / 78 / 78 + 24 pairs | **~80 / 56 / 56 + 20 pairs** | ~20 minutes per rater |
| People and raters | founder + 5–10; 6–8 raters | **founder + ≥ 3 friends; ≥ 5 raters** | |
| Held-out | ~40%, split by person | **2 friends entirely + 25% of the founder's outfits (~35%)** | |

**Gating with the MVGS:**
- Fix-pair gates are **pooled across dev and held-out**. Fix detection is a property of reading the photo, and rule edits must never be justified with held-out pairs.
- Average error, big misses and ranking are gated on held-out (~20 rated photos). These are **provisional** until gold v2.

### R2.3 Ordered experiment list
Planning prices: default ~0.86¢ per call, thinking off ~0.40¢, slim + off ~0.3¢. "N-checks" are the §2.3 bars. Every arm runs **in the same session as its control**.

| # | Hypothesis | Variant vs. control | Photos × runs | Pass rule | Cost | If it fails |
|---|---|---|---|---|---|---|
| **X0** ✅ | low ≠ off on 3.8 | (done: both 0 thinking) | probe 8 × 3 | — | $0 | Drop the "low" arm. Record the A/A noise: 3/8 hard photos moved 0.5 |
| **X1** | R4 (and R3) fix the m10/m08 problems without new flips | rubric v3.1 vs. v3 (`rescore.py`) on test1, test3, test4 and the probe readings | saved readings | Consistency not lower on any set, fix detection not lower, **only the targeted photos move ≥ 0.5** | $0 | Drop the rule that causes the flips |
| **X2** | F4 sensitivity check makes scores steadier | v3.1 + F4 vs. v3.1 (rescore) | saved readings | Consistency up, spread (SD of medians) drops ≤ 0.1, mean shift ≤ 0.2 | $0 | Keep it only for the 2–3 worst flip pairs |
| **X3** | A hedge at ~p90 caps the tail | `hedge_sim.py` on logged `seconds_api` | logs | Simulated p90 ≤ 8 s at ≤ +15% calls | $0 | Use the deadline + retry only |
| **X4** | Thinking off is as good as default on consistency and drift | 3.8 off vs. 3.8 default, interleaved | legacy 52 × 3 | N1, N6, field-mode agreement ≥ 95%, at most 1 of the 6 legacy pairs lost, API p50 ≤ 8 s | ~$2 | Screen 3.6 minimal (X6) as the low-thinking route |
| **X5** | The slim slot schema cuts ~45% of output and ~2 s without changing readings | slim + adapter vs. full schema, both thinking off | legacy 52 × 3 | Output ≤ 420 tokens, p50 at least 1.5 s faster, N1, N6, **top/outer agreement on layered photos (p01, p03, s15, m10, m12) ≥ 90%** | ~$1.5 | Fallback: full schema minus accessories (−22%) |
| **X6** | 3.6 minimal or Flash-Lite is faster or cheaper with the same readings | each vs. X5's winner | 20-photo screen × 2 | §3.3 kill rules; advance only with ≥ 30% faster or ≥ 50% cheaper | ~$0.6 | Stay on 3.8 |
| **X7** | Lower media resolution saves meaningful time | `mediaResolution` medium vs. default | screen 20 × 2 | ≥ 0.5 s faster with field match ≥ 95%. **Otherwise keep the default** (input is cheap; detail needs pixels) | ~$0.3 | Keep the default and 1024 px |
| **X8** | A person crop gives the same or better readings | `sips` person crops vs. full frame (stock originals) | stock 40 × 3 | N1, N6; the real benefit is judged in X9 | ~$0.8 | Defer the crop to the app (Vision) |
| — | **MVGS shot, labeled, split, rated (week 2)** | | | ICC(2,k) ≥ 0.70 | $0 | Human gates become tracked; lean on pair preferences |
| **X9** | Candidate C1 (3.8 off + slim + crop if X8 passed + rubric v3.1) is non-inferior to the **old default** on truth and on people | C1 vs. control (3.8 default, full schema, v3) | gold dev × 3 | **All of N1–N7** against truth labels and the panel | ~$2 | Find the field that broke (from the confusions) and restore just that piece (more thinking only on that field, or a full slot) |
| **X10** | Schema v4 (`issues` with 3 flags, sleeves_rolled, pant_length, footwear_state) adds detail without hurting the rest | v4 vs. C1; plus a list vs. booleans run (cheap) | gold dev × 3 | N1, N5–N7; each flag **advice-only** unless ≥ 10 positives with accuracy ≥ 85% and false alarms ≤ 5%; tokens ≤ 450 | ~$1.5 | Drop the flag or field that flips |
| **X11** | A two-image "what changed?" re-check beats independent readings on fixes | anchored diff vs. independent | all gold pairs (16 + 4 null) × 3 | G3a ≥ 14/16, G3b no improvement drops, **0 null-pair false alarms** | ~$1 | Ship independent readings + "Not quite right?" |
| **X12** | Which shoe-snap angle reads shoes and hem best | straight-down vs. knee height (tiny schema) vs. full-body reading | 6 × 2 × 3 | Snap hem/pant_length accuracy ≥ full body + 10 points | ~$0.2 | The snap stays a footwear-type helper only |
| **X13** (optional) | In-call crops fix hem or top-detail errors seen in X9 | crops vs. single image | gold dev × 3 | Target-field accuracy +5 points, p50 ≤ +0.5 s | ~$1.5 | Skip |
| **X14** | Final config passes the launch gates | final vs. old default, then calibrate the bias shift on dev | **held-out × 5**, plus 30 end-to-end calls on LTE | All G gates (fix pairs pooled) | ~$3 | Per the §2.1 fallbacks; re-test on gold v2 |
| **Beta** | Priority tier, deadline/hedge, streaming, on-device pose, end-to-end latency | telemetry A/B by day | real checks | G5e and G6 on beta logs; gold v2 = a fresh held-out | ~$2.5 | Keep standard tier |

**Total ≈ $17**, lower than Round 1 because thinking off cuts the cost per call.

### R2.4 Harness changes in build order (merged, deduplicated)
**Already done:** `--thinking`, `--image-px`.

| # | Change | From | Needed before |
|---|---|---|---|
| H1 | `rescore.py --rubric PATH --name N` (no overwriting); freeze `rubrics/rubric_v3.py` | Detail, me | **X1** ⚑ |
| H2 | Record `raw_score` (unrounded); widen `FIELDS` to every score-moving field (saturation, pattern_scale, length, sleeve_end, strain, distressed, shows_below_outer, certainty) | Detail, me | **X1** ⚑ |
| H3 | `compare.py A B`: per-photo median differences, the share within ±0.5, field-mode agreement, an A/A mode, N-checks; refuses to compare mismatched image or rubric hashes | Speed (compare_runs), me | **X1/X4** ⚑ |
| H4 | Timing and logging: `seconds_api` vs. `seconds_total`, `attempts`, `finishReason`, `modelVersion`, thinking tokens; the report shows p50/p90/p95/max and % ≤ 5 s and ≤ 8 s | Speed, me | **X4** ⚑ |
| H5 | `manifest.json` (model, settings, prompt/schema/rubric/image hashes, time window); a model-aware thinking map (3.8 `thinkingBudget: 0`, 3.6 `minimal`) | me, Speed | **X4** ⚑ |
| H6 | `--variants a.json,b.json` interleaved per photo (stopgap: two Terminal tabs started together) | me, Speed | **X4** ⚑ |
| H7 | `--resume`, `--budget-usd`, `--fast-retry` (1 s plus jitter; keep the 429-per-day stop) | me, Speed | X4 (recommended) |
| H8 | `--schema`/`--prompt` + the `slim_to_garments()` adapter; `--no-schema` exposed | Speed, Detail | **X5** |
| H9 | `--media-res`, `--jpeg-q`; a `sips` person-crop helper script | Speed, Detail | X7, X8 |
| H10 | `hedge_sim.py` | Speed | X3 (any time; free) |
| H11 | `gold_check.py` (validate, seeded split, face-cropped rater copies); `--gold` truth and human metrics (garment matching, ICC, human baseline, bootstrap, gates table); `fixes.csv` extended (expected fields, `none`/`worse`, new fix types `peeled_sticker`, `steamed`) | me, Detail | **X9** |
| H12 | Multi-image grouping (`__tag` files) + `--recheck anchored` / `--pair-diff` | me, Detail | X11, X12 |
| H13 | `--stream` (time to first byte/token), `--tier`, `--temperature`, `--concurrency`, `--explain`, `--crops` | Speed, Detail, me | X13, X14, beta |

⚑ = must exist before the first paid experiment (X4). H1–H3 also come before the free X1.

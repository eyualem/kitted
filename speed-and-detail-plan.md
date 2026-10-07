# Speed and detail plan: faster fit checks that see more

*Oct 6, 2026. Built from three specialist reports (speed engineer, detail engineer, test designer) that critiqued each other in a second round, plus a real speed probe. Full reasoning: `brainstorm/06_speed-engineer.md`, `07_detail-engineer.md`, `08_test-designer.md`.*

> **Status (Oct 6, lock-in test):**
> - **Locked:** thinking off with the original answer format. That's **6.6 s median, 8.7 s p90, 0.42¢ per check**, 100% consistent, and it noticed 5/6 fixes.
> - **Not locked yet: schema v4.1** (3.9 s, 0.23¢). The first version was unstable because the new "wrinkled" flag moved the score; it's now a tip only. Even fixed, it reads 5 details differently from today's setup, so it goes to the gold-set test (X9).
> - **Also open:** the AI provider (Gemini's terms require 18+ users). Details: `extraction-test/results/lockin-oct6/RESULT.md`.

## The short version
1. **Turn the model's thinking off.** It's 9 of the 16 seconds. Measured: 16.5 s → 7.3 s, no loss of consistency.
2. **Make the AI's answer about 3× shorter** ("schema v4"). With thinking off, writing out the answer is almost all the remaining time. A slimmer format gets us to about 4–5 s.
3. **Spend the saved space on better detail.** A short "issues" list per garment (faded, tag or sticker, wrinkled, stain…) catches what we miss today. Cropping the photo to the person on the phone gives the clothes about 2× more pixels for free.
4. **Prove it on a small labeled photo set** (about 80 photos of you and 3+ friends) before beta. Being consistent isn't enough: consistently wrong is still wrong.

**Target:** score on screen in **about 4–5 s typical, 8 s at worst**, for about **0.3¢ per check** (down from 0.9¢), with more detail than today.

## Where the time goes (measured)
| | Today | Thinking off (measured) | + schema v4 (estimated) |
|---|---|---|---|
| Hidden thinking | ~1,190 tokens, ~9 s | 0 | 0 |
| Visible answer | ~700–930 tokens, ~5 s | ~780–930 tokens, ~5 s | **~240 tokens avg, ~290 at p90**, ~1.5–2 s |
| Fixed overhead (network, reading the image) | ~2–3 s | ~2–3 s | ~2–3 s |
| **Median time** | **16.5 s** | **7.3 s** | **~4–5 s** |
| 90th percentile | 20.1 s | 8.2 s | ~6 s (to confirm) |
| Cost per check | ~0.9¢ | ~0.4¢ | ~0.3¢ |

Rule of thumb from 156 logged calls: **every 100 tokens of answer adds about 0.6–0.8 s.** Input (the image) is cheap in time. Output is what's slow.

**Things that won't help:**
- **Smaller images:** Gemini charges a fixed ~1,100 tokens per image at any size. The 512 px "speedup" in the probe was fake; the model just listed fewer accessories.
- **Prompt caching:** it only kicks in above 4,096 tokens, and we send about 1,850.
- **"Minimal" thinking on 3.8:** rejected by the API. "Low" already gives 0 thinking tokens.

## What we'll build

### Speed
| # | Change | Gain | Status |
|---|---|---|---|
| S1 | **Thinking off** (`thinkingBudget: 0`), with a token cap as a loop guard and an alert if thinking shows up on more than 5% of calls | −9 s, −55% cost | Measured on 8 photos; confirm on 52 (X4) |
| S2 | **Schema v4:** fixed slots (top, outer, bottom, shoes), only the fields the rules use, no "na" filler. An adapter converts it back, so `rubric.py` doesn't change | −2.5 to −3.5 s | Simulated: 177/180 saved readings give the identical score (X5) |
| S3 | **Show the score first.** The code-picked fixes appear at once; the friendly explanation streams in after | The explanation's ~1–2 s is off the wait | App design |
| S4 | **Warm up the connection during the 3-2-1 countdown**, and do the on-phone quality check while uploading | −0.3 to −0.8 s felt | App design |
| S5 | **Stream the answer** so the loading stages show real progress ("Reading your top… your shoes…") | Feels faster; honest | App design |
| S6 | **Worst-case control:** an 8 s deadline, one fast retry of the *same* model, and a backup request at about the p90 time | Caps the 20–48 s outliers | Simulate free (X3), then confirm in beta |

### Detail
| # | Change | What it catches | Status |
|---|---|---|---|
| D1 | **`issues` list per garment** (part of v4): faded, tag_or_sticker, wrinkled, stain, pilling, stretched_neckline, fraying, collar_collapsed, scuffed, strain, hangs_below_jacket, distressed_by_design | m06's faded tee and size sticker, m08's creased trousers | **Starts as tips only.** A flag only moves the score once it's right ≥80% of the time on ≥10 photos that have it |
| D2 | **`feet` state** (shoes on / socks or barefoot / cut off) and **top = the innermost top, anything open over it = outer** | Correct partial-check labels; stops the "overshirt vs. camp shirt" flip | Part of v4 |
| D3 | **Crop to the person on the phone** (Apple Vision) before resizing | ~2× more pixels on the clothes at the same cost | Simulate on stock originals (X8), then real in the app |
| D4 | **Shoe snap with a tiny schema** (shoes + hem only) | The only reliable read of pant length and pooling | Pick the angle (X12) |
| D5 | **Two-image re-check:** "here's the first photo and the new one; what changed in the slot the fix touched?" | Fix detection, today's weakest number | Must never invent changes on "no change" pairs (X11) |
| D6 | **Closet items read once in the background at full detail** (fabric, texture, logo) | Detail the live check can't afford | After v1 has a closet |
| D7 | **Two rule fixes, free to test:** a near-match blazer and trousers costs 0.5; partial checks scale the missing credits up only halfway | m08 over-scoring; m10's wobble | Free re-score (X1) |

**Deliberately not doing:**
- an overall "fit quality" or "cheap-looking material" field (models read fabric only ~50% right, and the field would flip)
- free-text explanations from the vision model (slow and unstable)
- a second AI call on the first check
- switching models when Gemini is busy (a photo could end up with two different scores)

### Schema v4 in one picture
```
scene:  clothed · framing · feet
top:    type · color · pattern · logo · fit 1–5 · hem (tuck+length) · sleeve · issues[] · sure
outer:  0–2 items, inner to outer: type · color · pattern · logo · sleeve · issues[] · sure
bottom: type · color · pattern · leg · hem · issues[] · sure
shoes:  type · color · issues[] · sure        (null if not visible)
extras: [belt_black, watch, …]                 (tips only)
```
- Saturation folds into the color (`dusty_pink`, `bright_blue`), pattern size into the pattern (`stripes_fine`), and tuck plus length into one hem value (`untucked_mid_fly`).
- An empty `issues` list means clean.
- Full value lists and the adapter: `brainstorm/07_detail-engineer.md` §R2.5.

## Disagreements we settled
| Question | Speed said | Detail said | Tests said | **Decision** |
|---|---|---|---|---|
| Drop accessories? | Yes (22% of output) | Keep as a cheap list | — | **`extras` list, about 2 tokens each, tips only** |
| Crops inside the call? | One lower crop only | Only for high-res photos | Only if the gold set shows misses | **On-phone person crop now. In-call crops wait for evidence (X13)** |
| Different model when Gemini is busy? | Yes | Yes, labeled | No (double validation, two scores) | **Retry the same model fast. Revisit after launch** |
| How many issue flags? | Up to 3 per garment | 12 values | Start with 3 | **Schema carries all 12; only tag_or_sticker, wrinkled and faded can affect scores, once proven** |
| Temperature 0 vs. Google's 1.0 | Keep 0 | Test it | — | **Keep 0; one cheap screen at 1.0 later** |
| 132 gold photos? | — | Too much labeling | ~3 weeks of work | **Minimum set of about 80, staged so labels are known in advance** |

## How we'll know it worked

### The gold set (you shoot it; about 6–8 hours over a week)
**Who:** you plus at least 3 friends aged 18+, with consent. Real rooms, real phones.

**What to shoot:**
| Block | How many | What |
|---|---|---|
| Single outfits | 16 | 4 strong, 4 clean basics, 8 deliberately bad (pooled jeans, oversized tee, clashing colors, gym shorts as a day outfit…) |
| Fix pairs | 16 + 4 | **Real improvements:** cuff ×3, tuck ×3, roll sleeves ×3, running shoes → leather sneakers ×3, add a layer ×2, loungewear → chinos ×2. Detail pairs fold in here: faded vs. new tee, sticker on/off, wrinkled vs. steamed. **4 "no change" pairs** (just retake the same photo) |
| Hard conditions | 8 | The "before" outfits again as mirror selfies in a dim room |
| Partial photos | 4 | Free: crop the shoes off propped photos |
| Shoe snaps | 6 × 2 | Straight down vs. knee height |

- **Stage the labels:** each "before" photo is built to show one known problem, so the truth is written down before you shoot. You only tick "came out as planned."
- **Ratings:** at least 5 friends score the photos blind, with faces cropped and the order shuffled (about 20 minutes each). Your scores and Claude's are kept separate.
- **Hold-out:** about 35% of photos (2 friends entirely, plus a quarter of yours) are sealed. Nobody tunes the rules on them.

### Pass bars (final setup, on the held-out photos)
| Gate | Pass |
|---|---|
| Same photo → same score | ≥ 90%, and no photo's runs spread over more than 1.0 |
| Score vs. friends' average | Off by ≤ 1.0 on average, and no worse than a typical friend |
| Big misses (1.5+ apart) | ≤ 10% of photos |
| Bias | Within ±0.3 (fixed with one baseline shift, fitted on tuning photos only) |
| Fix noticed | ≥ 14 of 16 improvement pairs, **zero** false changes on the 4 no-change pairs |
| Detail accuracy vs. truth | ≥ 85% overall, each key field ≥ 80% (weaker fields become tips only) |
| Speed, API only | median ≤ 5 s, 90th percentile ≤ 8 s, answer ≤ 500 tokens at p90 |
| Speed, shutter to score on LTE | median ≤ 7 s, 90th percentile ≤ 10 s |
| Failures | ≤ 1% |
| Cost | ≤ 2¢ per check at 2027 prices (target ~0.6¢) |

**Rule for speed changes:** a faster setup must not lose quality. Detail accuracy may drop at most 5 points, score error at most 0.15, and at most 1 fix pair. **Noise floor:** running the identical setup twice moves 13% of photos by 0.5, so any "improvement" smaller than that isn't real.

### The experiments, in order
| # | What | Photos | Cost | If it fails |
|---|---|---|---|---|
| X0 ✅ | Thinking low = off on 3.8 (both 0 thinking) | probe 8 | done | — |
| X1 | Two rule fixes (D7), free re-score | saved readings | $0 | Drop the rule that causes flips |
| X2 | Steadier choice on flip-prone fields, free re-score | saved readings | $0 | Keep it for the worst 2–3 only |
| X3 | Deadline + backup request, simulated on logged times | logs | $0 | Deadline + retry only |
| X4 | **Thinking off vs. default**, same session, interleaved | old 52 × 3 | ~$2 | Try 3.6 Flash "minimal" |
| X5 | **Schema v4 vs. today's schema** (both thinking off) | old 52 × 3 | ~$1.5 | Today's schema minus accessories |
| X6 | 3.6 Flash / Flash-Lite screen | 20 × 2 | ~$0.6 | Stay on 3.8 |
| X7 | Lower `media_resolution` | 20 × 2 | ~$0.3 | Keep the default |
| X8 | Person crop (simulated) | stock 40 × 3 | ~$0.8 | Leave it to the app |
| — | **Gold set shot, labeled, rated** | ~80 | $0 | — |
| X9 | **Candidate (thinking off + v4 + crop + rule fixes) vs. the old default**, on truth labels and on people | gold tuning × 3 | ~$2 | Restore just the piece that broke |
| X10 | Issue flags, feet, sleeves rolled | gold × 3 | ~$1.5 | Drop the flag that flips |
| X11 | Two-image re-check vs. separate readings | 20 pairs × 3 | ~$1 | Separate readings + "Not quite right?" |
| X12 | Shoe-snap angle | 6 × 2 × 3 | ~$0.2 | Snap reads shoe type only |
| X13 | (optional) Crops inside the call | gold × 3 | ~$1.5 | Skip |
| X14 | **Final gate** on held-out photos + 30 real LTE checks | held-out × 5 | ~$3 | Fix and re-test on beta photos |
| Beta | Priority tier, deadline, streaming, on-phone pose | real use | ~$2.5 | Standard tier |

**Total ≈ $17.** Every paid run is compared with its control in the same session.

### Test-tool changes (Claude builds these)
**Before the first paid experiment:**
1. `rescore.py` gets a name option so results don't overwrite each other (done) and a choice of rubric file.
2. Record the unrounded score; measure agreement on every field that moves the score.
3. `compare.py`: per-photo differences between two runs, with a "same setup twice" noise mode.
4. Time the API separately from retry waits; report p90/p95; log the model version and thinking tokens.
5. A record of each run's settings; variants run interleaved photo by photo.

**Later, as experiments need them:**
- resume and budget cap
- `--schema` plus the v4 adapter
- media resolution and the crop helper
- `hedge_sim.py`
- gold-set scoring (truth labels, ratings, rater agreement)
- multi-image re-check
- streaming and tier options

## Timeline (beta is Nov 3)
| Week | Claude | You |
|---|---|---|
| **1 (Oct 6–12)** | Test tools 1–5 + schema v4 adapter; run X1–X5 (~$4) | Delete the old API key and create a new one; start the SwiftUI prototype; **shoot your half of the gold set** |
| **2 (Oct 13–19)** | X6–X8; gold-set scoring tools; rater form | Friends' shoots; tick the labels; send the rating form |
| **3 (Oct 20–26)** | X9–X12; calibrate the rules on the tuning photos | Build the camera flow and the score card with the real API settings |
| **4 (Oct 27–Nov 2)** | X14 final gate; LTE timing from the prototype | Run 30 real checks from your phone |
| **Beta (Nov 3)** | Beta photos become a fresh held-out set | — |

**None of this blocks prototyping.** The app's screens, camera, Closet and onboarding don't depend on the final numbers. Only the API settings do, and they're settled by week 1 (thinking off + v4).

## Risks to watch
- **Thinking off might miss subtle things** (sleeve rolls, hem break) that only truth labels reveal. If X9 shows that, turn thinking back on for that one field's re-check, not for every check.
- **Google can change the model under us.** Pin the version, log it on every call, and run a 10-photo drift check each session.
- **The price doubles on Jan 1, 2027.** Even then, v4 + thinking off is about 0.6¢ per check.
- **Timing from a phone on LTE is unknown** until the prototype exists; the 2–3 s fixed overhead could be bigger on weak signal.

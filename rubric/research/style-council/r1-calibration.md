# Round 1: Calibration ("not too high, not too low")

*Calibration member, style council round 1. Oct 7, 2026. Everything here was computed with `extraction-test/rubric.py` (v3.1) on saved readings: first run per photo, occasion Everyday, no styles picked, unless a line says otherwise. Note that `rubric/v3.md` and the test reports scored with a 50/50 Minimal + Smart casual mix, so a few numbers here differ from those reports by 0.5. Scripts live in my scratchpad (not committed). The "my estimate" column is my own judgment from viewing each photo. It is not a human panel, so treat it as a second opinion until section 5 is done.*

## The short version

1. **The low end is fragile and the high end is crowded.**
   - **The low end:** one misread (jeans read as sweatpants) can stack four rules and drop a 6.0 outfit to 3.5. That's the founder's check.
   - **The high end:** 57% of saved readings score 8+ ("Sharp"). On the 12 real mirror selfies it's 9 of 12, against 4 of 12 by Claude's blind estimates. The mirror average is 8.0 vs 7.33 estimated.
2. **Most of the over-scoring comes from double-dipping on credits, not missing penalties.** One overshirt earns "Layered" and "Elevated piece". One pair of white leather sneakers earns "Elevated" and "Shoes complement". One fine-pinstripe shirt earns "Point of interest". Fixing those two things alone cut my estimated error from 0.52 to 0.40 and the bias from +0.36 to +0.21. The gap to Claude's estimates on the mirror set fell from 0.75 to 0.54.
3. **Most of the under-scoring is one fact firing several rules.**
   - Wide, long pants fire pooling and leg-vs-style.
   - A sweatpants reading fires too-casual and loungewear.
   - A big top fires too-big, sleeves, top-vs-style and everything-oversized.
   - A per-garment cap, a ramp instead of a cliff on too-casual, and a 5.0 floor for clean, fully clothed outfits stop misreads from producing 3s.
4. **The quick-tap question should fire on about 4–10% of checks, not 40%.** Asking whenever an alternative reading moves the score by 1+ would ask on 24 of 56 photos. The trigger needs a closed list of look-alike pairs plus a doubt signal (section 4).
5. **Recommended package** (R1–R6 below) on the 56 readings:
   - Error vs. my estimates: from 0.52 to 0.38.
   - Photos off by 1+: from 14 to 9.
   - Lowest score: 3.5 becomes 5.0.
   - 9+ scores: from 4 to 1.
   - The founder's misread check: 3.5 becomes 5.0. With the tap answered "jeans", it's 6.0.

---

## 1. What each score band should mean

### The bands in plain words
The rule behind every band: **the number should match what a fair, style-literate friend would say in one sentence.**

| Score | Word | What it means | What it takes in rubric terms | Example A | Example B |
|---|---|---|---|---|---|
| **3.0–4.0** | Needs a fix | **Reserved.** Wrong clothes for where he's going, *or* visibly not cared for plus another fault. Never reachable at Everyday by style or proportion choices alone, and never by a single misread (floor R3) | Occasion 2+ levels off (gym kit at an interview), or stain/dirty/worn plus a fit fault, or clear fit faults on 2+ different garments | Tank + gym shorts + slides **at an interview** (v3.1: 3.5) | Stained tee + pooled jeans + dirty sneakers **at work** (v3.1: 3.0) |
| **4.5–5.5** | Needs a fix | One big problem a friend would point out right away | Loungewear out of the house (about −2), a care fault plus a fit fault, or a loud color clash | Grey hoodie + grey sweatpants + slides, Everyday (athleisure; 5.0) | Red hoodie + yellow cargos + cobalt runners, no streetwear (streetwear; 5.0) |
| **6.0–6.5** | Getting there | It works, but one clear thing is off or the outfit doesn't look chosen | One mid fault (pooling, shoe clash, joggers with an oxford) and no credits | Founder: grey hoodie + black wide jeans + slides with socks (casual/street; **6.0** read correctly) | Light-blue oxford + pink joggers + running shoes (smart casual gone wrong; I say 6.0, v3.1 says 7.0) |
| **7.0–7.5** | Put together | Clean basics that fit. Nothing wrong, nothing extra | Baseline 7.0, maybe one credit | White tee + straight mid-wash jeans + canvas sneakers (minimal; 7.0) | Grey hoodie + jeans + retro runners (s12; vintage sport/casual; 7.0) |
| **8.0–8.5** | Sharp | A deliberate layer or elevated piece, shoes that match, no faults | 2 credits from **different** garments, zero mistakes | Cream sweater + dark jeans + chunky sneakers (m07; minimal/street; 8.0) | Denim jacket + light-blue oxford + pleated wide navy trousers + loafers (m02; workwear-prep mix; 8.5) |
| **9.0–9.5** | Dialed in | All of the above plus one considered point of interest and exact fit. **Should be rare (target ≤5% of checks)** | 3+ credits from 3 different garments, zero mistakes | Olive suit + matching olive turtleneck + black shoes (s07; tailored minimal; 9.0) | Navy blazer + oxford + chinos + loafers (classic prep; 9.0) |

**Target spread for real users (my judgment, to check against section 5):**
- Median about 6.5–7.
- About 10–15% at ≤5.5.
- About 20–25% at 8+.
- About 5% or less at 9+.
- No 3s at Everyday unless care faults are involved.

Today's saved readings (v3.1, no styles):

| Score | 3.5 | 5.5 | 6.0 | 6.5 | 7.0 | 7.5 | 8.0 | 8.5 | 9.0 |
|---|---|---|---|---|---|---|---|---|---|
| Readings | 1 | 1 | 2 | 3 | 7 | 10 | 14 | 14 | 4 |

The stock photos are professional shoots, so some lift is fair. The 12 mirror selfies have no such excuse: 9 of 12 score 8+.

### How this compares with how people and apps use a 10-point scale
- **Open rating systems drift up until the top means nothing.**
  - A 10-year, five-marketplace study found feedback scores "rising sharply" over time. At least 35–45% of the rise came from raters lowering their standards, not from better service ([Filippas, Horton & Golden, *Reputation Inflation*, Marketing Science 41(4), 2022](https://john-joseph-horton.com/papers/reputation-inflation/); [INFORMS release](https://www.informs.org/News-Room/INFORMS-Releases/News-Releases/Five-Star-Rating-New-Research-Finds-It-May-Not-Reflect-What-Consumers-Receive)).
  - Amazon-style reviews pile up at the top, with a J-shaped spread where the average stops tracking quality ([Hu, Pavlou & Zhang, CACM 2009, older](https://cacmb4.acm.org/magazines/2009/10/42353-overcoming-the-j-shaped-distribution-of-product-reviews)).
  - Lesson for Kitted: a code-judged score must not copy that drift. The 8s need to stay earned.
- **AI outfit scorers compress at the top.** AesRec (Feb 2026) had a VLM score 27,694 outfits on a 1–10 scale; scores clustered at 8.0–8.5 ([arXiv 2602.03416](https://arxiv.org/html/2602.03416v1)). Even rival app makers say this about the category: OutfitScore's "scores tend to run high regardless of the actual outfit" ([StylePal blog, Mar 13, 2026; a rival ranking its own app first](https://www.stylepal.app/news/best-outfit-rating-app)). v3.1's clump at 8.0–8.5 is the same failure in miniature.
- **Pooled human raters agree on order, not on exact numbers.**
  - ZOZO's pairwise study found split-half Spearman ρ of 0.72–0.82 between pooled rater halves ([arXiv 2410.23730, 2024](https://arxiv.org/pdf/2410.23730)).
  - Model-vs-expert error on a 10-point scale was about 0.63–0.69 ([AesRec, 2026](https://arxiv.org/html/2602.03416v1)).
  - So ±0.5 is about the limit of meaningful precision. Half-point steps are fine; quarter points would be false precision.
- **Vote-based "fashionability" 1–10 scales mostly measure followers and looks** ([Simo-Serra et al., CVPR 2015](https://openaccess.thecvf.com/content_cvpr_2015/html/Simo-Serra_Neuroaesthetics_in_Fashion_2015_CVPR_paper.html)). They are no anchor for Kitted, which never rates faces or bodies.
- **Professional stylists:** I found no published, calibrated stylist 1–10 scale (search came up empty; not sourced either way). The bands above are my judgment, built so that each band is one plain sentence a friend would say.

---

## 2. Audit of rubric.py: double counting and over-punishment

### How points really move
The code multiplies internal amounts before subtracting:
- fit × 0.8
- color and proportion × 0.6
- occasion × 1.2

Credits are added on top of the 7.0 baseline. All point values below are what the score actually moves.

### Every place one fact fires more than one rule

| # | One fact | Rules that fire together | Worst case seen | Real or synthetic |
|---|---|---|---|---|
| D1 | **Bottom read as sweatpants / gym shorts** | O4 loungewear (−0.6), *and* its dressiness 1 drags the average into O1 too casual (−1.5) | −2.1 from the type alone | Founder phone1 (real) |
| D2 | **Wide, long pants** | F4 pooling (−0.8), P1 leg vs style (−0.45 with no style), P3 everything oversized (−0.3) if the top is v4+ | −1.55 on one pair of pants | phone1 (F4 + P1 = −1.25); synthetic B (−1.55) |
| D3 | **A big top** | P1 top vs style (−0.22 to −0.67), F8 too big (−0.6), F9 sleeves cover hands (−0.4), P3 (−0.3), P2 (−0.3 with skinny legs) | −2.0 from one hoodie | Synthetic A: oversized hoodie + wide pooled jeans = **4.0** with no style; 7.0 with Streetwear |
| D4 | **Running/chunky shoes with tailoring** | S2 shoes too casual (−1.8) + S1 bulky shoe, narrow leg (−0.45) + K4 lost (−0.5 credit) | −2.75 from one pair of shoes | Synthetic D: suit + runners = 6.0 |
| D5 | **Bright colors** | C1a too many accents (−0.9), C3 bright clash (−0.6), B1 focal points (−0.3 to −0.6) all count the same bright pieces | −1.8 | Synthetic C = 5.0 |
| D6 | **Patterns** | C4a same pattern, C4b 3+ patterns, B1 focal points share the same patterned pieces | −1.6 to −2.2 | Not seen in saved readings |
| D7 | **One layer earns two credits** | K1 Layered (+0.75) *and* K2 Elevated (+0.5) when the jacket/overshirt/knit is the only piece at dressiness 3+ | +1.25 from one garment | m07 sweater, phone4 field jacket, s26 overshirt, m10/m12 overshirts |
| D8 | **One pair of shoes earns two credits** | K2 Elevated (white leather sneaker = 3) *and* K4 Shoes complement | +1.0 from one pair | Synthetic G: tee + overshirt + jeans + white leather sneakers = **9.0** "Dialed in" |
| D9 | **One patterned piece earns two credits** | K1 or K2 plus K3 Point of interest from the same striped/checked piece | +0.5 extra | m10, m12, s15, p05 |
| D10 | **Fine pinstripes as a "point of interest"** | K3 fires on any non-solid pattern, including small-scale pinstripes and micro-checks that read as solid from 2 m | +0.5 (×1.14 if partial) | 11 of 56 readings: phone2, phone3, m03, m05, m10, m12, s01, s17, s19, s22, p05 |
| D11 | **Partial check up-scaling** | Missing shoes scale the other credits by 1.14× | +0.25 to +0.5 | m10 (barefoot, 9.0), phone4 (8.0), p04, m09 |

### Cliffs: a tiny reading change, a big jump
- **O1 too casual uses `nearest()`.**
  - An average dressiness gap of exactly 0.50 costs 0. A gap of 0.51 costs −1.5.
  - The founder's misread sits at 0.67, so it paid the full −1.5.
- **S2 shoes too casual is a step at a 3-level gap.**
  - At 2.99 levels it costs 0; at 3.0 it costs −1.8.
  - Example p03 (black suit): Chelsea boot → work boot moves the score **8.0 → 5.5**.
- **Overshirt category decides K1.**
  - If the model files the overshirt as "top" instead of "outerwear", Layered is lost.
  - With a long overshirt, the too-big and too-long checks can start firing too.
  - p06 (after): 8.5 → 6.5. m10: 9.0 → 7.5.
  - An open overshirt over a tee is a layer no matter which box the model ticks.
- **Joggers are dressiness 1 like sweatpants but aren't in `LOUNGE_BOTTOMS`.**
  - A jeans/joggers or joggers/sweatpants flip changes which rules fire.
  - s06 (oxford + pink joggers + runners) scores 7.0 (I'd give 6.0). With joggers counted as loungewear it's 6.5.
- **Inner layers count fully in the dressiness average.** A tank under an open shirt (m12) or a tee under a hoodie counts as much as the outer piece. Today it doesn't flip anything in the saved data, but it's a latent drag.

### Single misreads that swing the score 1.5+ points
I swapped one field at a time to a plausible look-alike value: 3,013 variants over the 56 readings. These 12 variants moved the score by 1.5 or more:

| Photo | Misread | v3.1 score → with the misread |
|---|---|---|
| p03 suit | Chelsea boot → work boot | 8.0 → 5.5 (S2 cliff) |
| **phone1** | the real misread: sweatpants (truth: jeans) | **6.0 → 3.5** |
| phone1 | jeans → drawstring trousers, reverse direction for comparison | 6.0 ↔ 3.5 |
| p06 (after) | overshirt as outerwear → top | 8.5 → 6.5 |
| s15 | trousers → suit trousers | 8.5 → 6.5 (S2 with chunky sneakers) |
| m12 | drawstring trousers → trousers | 9.0 → 7.0 (S2 with slides) |
| s02 | tee → tank top | 6.0 → 4.5 |
| s24 | inner tee → tank top | 6.5 → 5.0 |
| s24 | sweatshirt → sweater | 6.5 → 8.0 (K1 + K2 from "knit") |
| m07 | sweater → sweatshirt | 8.5 → 7.0 |
| m10 | overshirt as outerwear → top | 9.0 → 7.5 |
| phone1 | shoes visible → not visible | 3.5 → 5.0 |

### Proposed guardrails and what each does to the saved readings

"MAE" is the average distance from my per-photo estimates (56 photos). "vs Claude" is on the 12 mirror photos.

| ID | Guardrail | Effect on saved readings | MAE | Bias | Off by 1+ | vs Claude (MAE / bias) |
|---|---|---|---|---|---|---|
| — | v3.1 today | — | 0.52 | +0.36 | 14 | 0.75 / +0.67 |
| **R1** | **Per-garment cap:** fit + proportion penalties traced to one garment total at most −1.0. Rules: F4, F4b, P1-leg on the bottom; F6, F8, F9, P1-top, T1, L1 on the top; S1 on the shoes. Occasion rules (O1, O4, S2) and color rules are outfit-level and not capped | Only phone1 changes (F4 + P1 = −1.25 → −1.0). Synthetic A 4.0 → 4.5, A2 3.0 → 4.0 | 0.51 | +0.37 | 14 | same |
| **R2** | **O1 ramp instead of cliff:** each level of "too casual" phases in linearly between a gap of 0.25 and 0.75 (−1.5 per full level, max −3.0 as now) | phone1 3.5 → 4.0. Nothing else in the saved set moves | 0.51 | +0.37 | 14 | same |
| **R3** | **Floor 5.0** at Everyday / Class / Date / Going out / Home when fully clothed and no care or strain fault fired (F7, F10). Dressy occasions keep the 3.0 minimum | phone1 3.5 → 5.0. Synthetic A/A2 → 5.0 | 0.49 | +0.38 | 14 | same |
| **R4** | **One credit per garment:** K1, K2, K3 and K4 must each be earned by a different garment (best assignment) | 7 readings drop 0.5–1.0: m07, m10, m12, s15, s26, p05, phone4. Synthetic G 9.0 → 8.5 | 0.44 | +0.28 | 11 | 0.54 / +0.46 |
| **R5** | **Point of interest needs presence:** K3 counts a pattern only at medium/large scale. Colors still count as now | 11 readings drop 0.5 (list in D10) | 0.46 | +0.26 | 11 | 0.67 / +0.50 |
| **R6** | **No partial up-scaling:** missing shoes drop K4's share and nothing is scaled up. The card already says "Partial check" | p04 ×2 and m09 drop 0.5 | 0.53 | +0.33 | 14 | 0.71 / +0.62 |
| | **R1–R6 together (recommended)** | Range 5.0–9.0; one 9.0 (s07, olive suit) | **0.38** | **+0.21** | **9** | **0.50 / +0.33** |
| ✗ | Not recommended: merging O1 + O4 as "the larger of the two" | Makes a true hoodie + sweatpants + slides outfit 6.0 (I'd say 5.0). Loungewear *should* cost about −2 at Everyday; the problem is stacking it with fit rules and misreads, which R1–R3 handle | 0.50 | +0.38 | 14 | — |
| ✗ | Not recommended: a continuous O1 with no 0.5 dead zone | Same leniency problem: the true sweatsuit goes 5.0 → 6.5 | 0.50 | +0.38 | 14 | — |

Three code fixes from the cliff list belong in the same batch (scores computed, but not in the table):
- **R7: count joggers as loungewear.** s06 goes 7.0 → 6.5.
- **R8: open overshirt counts as a layer.** An overshirt, flannel or camp-collar shirt worn over another top counts as a layer for K1, whichever category the model picks. This removes the 1.0-average swing on the 13 overshirt readings.
- **R9: ramp S2 like O1.** −0.9 at a 2.5-level gap, −1.8 at 3+.

How the synthetic cases move (v3.1 → R1–R6):

| Case | v3.1 | R1–R6 |
|---|---|---|
| A: oversized hoodie + wide pooled jeans, no style picked | 4.0 | 5.0 (Streetwear allowances should then take it to about 7) |
| A2: the same outfit, jeans misread as sweatpants | 3.0 | 5.0 |
| D: suit + runners | 6.0 | 6.0 |
| E: tank + gym shorts + slides at Everyday | 5.0 | 5.0 |
| E at an interview | 3.5 | 3.5 |
| F: clean tee + jeans | 7.0 | 7.0 |
| G: tee + overshirt + jeans + white leather sneakers | 9.0 | 8.5 |
| J: navy blazer + oxford + chinos + loafers | 9.0 | 9.0 |

**Caveat:** every point value and threshold above is my calibration judgment. No published study ranks these faults. The estimates I tuned against are mine, and Claude's mirror estimates come from the same kind of judge. Section 5 is what turns this into evidence.

---

## 3. Re-score audit: every score I think is off by 1+ point

Settings: first run, Everyday, no styles, v3.1. I viewed every photo. Stock photos are professional model shoots, so "honest" here means for this app's beginner scale, not fashion-editorial merit.

| Photo | Outfit (what I see) | v3.1 | Mine | Claude CSV | Off | Why: misread or rule |
|---|---|---|---|---|---|---|
| **phone1** | Grey Nike hoodie, black wide-leg **jeans** with belt, stacking onto slides worn with socks | **3.5** | 6.0 | — | −2.5 | **Misread** (sweatpants, certainty "likely") **plus rule stacking.** O1 −1.5 + O4 −0.6 + F4 −0.8 + P1 −0.45. Read as jeans it's 6.0, which I agree with: below s12's hoodie + jeans + sneakers (7.0) because of the slides with socks and the dragging hem. Not a 3, not a 9 |
| **phone3** | Light-blue cotton sport coat (some wrinkles), striped dress shirt, navy tie, navy trousers, belt, black horsebit loafers | 9.0 | 8.0 | — | +1.0 | **Rule.** All four credits fire, and K3 comes from fine shirt stripes (D10). The wrinkle costs only −0.4. A creased jacket shouldn't be "Dialed in." R4 + R5 give 8.5 |
| **phone4** | Brown quilted field jacket, light-blue tee, faded black straight jeans stacking at the ankle, socks, no shoes | 8.0 | 7.0 | — | +1.0 | **Rule** (K1 + K2 both from the jacket, D7; partial up-scaling, D11) **plus a likely misread** (quilting read as "wrinkled"). R1–R6 give 7.5 |
| phone2 | Striped dress shirt tucked, navy tie, navy suit trousers, socks (no shoes) | 8.0 | 7.5 | — | +0.5 | Within tolerance. K3 from pinstripes (R5 → 7.5). The tie is read as an "accessory: other" and scores nothing, which is correct |
| **m06** | Faded pink long-sleeve tee, mid-wash jeans **with the size sticker still on**, socks | 7.5 | 6.0 | 5.5 | +1.5 | **Misread** (faded pink read as "bright" → K3 +0.57) **plus an invisible fault** (the sticker has no field). The 7.0 floor of "clean basics" is generous for a washed-out, unfinished look |
| **m10** | Beige micro-check overshirt open, grey tee tucked, tan belt, charcoal jeans, **barefoot**, bathroom | 9.0 | 7.5 | 7.0 | +1.5 | **Rule.** K1 + K2 from the overshirt (D7), K3 from a micro-check (D10), and partial up-scaling (D11). A barefoot bathroom selfie as "Dialed in" is the clearest over-score in the set. R1–R6 give 8.0 |
| **m12** | Striped camp shirt open over a white tank, cream drawstring linen trousers, black slides | 9.0 | 8.0 | 7.5 | +1.0 | **Rule.** The overshirt earns K1 + K2 + K3 on its own (D7, D9). R1–R6 give 8.0 |
| m08 | Charcoal textured blazer, white shirt, navy trousers (long, creased), black derbies | 8.0 | 7.5 | 7.0 | +0.5 | Within tolerance. The trouser length and creases aren't seen (hem read "slight_break", condition "clean") |
| **s01** | Editorial: striped knit vest over a textured shirt, houndstooth flares, multicolor square-toe shoes | 8.5 | 7.5 | — | +1.0 | **Misread** (vest read as "tank top"; check trousers read solid) **plus rule** (K3 from the vest stripes). The look is busy for this scale |
| **s02** | Oversized black logo tee, black nylon shorts, Jordan 1s | 6.0 | 7.0 | — | −1.0 | **Rule.** The nylon shorts are read as "athletic shorts" → O4 −0.6. A clean, all-black summer street fit is baseline put together. A vintage-sport/streetwear allowance should cover it |
| **s05** | Navy hoodie with white sleeve stripes, dark cuffed jeans, white fashion sneakers | 8.0 | 7.0 | — | +1.0 | **Rule.** Sleeve stripes count as K3; the white sneakers count as K2 "elevated" (read as `white_leather_sneaker`). A hoodie + jeans at "Sharp" is too high. R1–R6 still give 8.0, because K2 and K3 are on different garments. This is the case for making K2 need a top or bottom at 3+, not only shoes (round 2 should debate it) |
| **s06** | Light-blue oxford untucked, pink cuffed joggers, grey running shoes | 7.0 | 6.0 | — | +1.0 | **Rule.** Joggers aren't loungewear (R7 → 6.5), and the dressiness average hides the oxford/joggers/runner clash |
| **s08** | Editorial: sculpted white puffer worn over a bare chest, white flared trousers, patent shoes | 8.5 | 7.5 | — | +1.0 | **Rule.** "Layered" from a puffer plus "elevated" from trousers. Nothing reads "bare chest under a jacket". It's coherent but costume-like for an everyday scale |
| **s14** | Denim/fleece hybrid hooded jacket, white turtleneck, grey trousers, grey chunky sneakers (look scuffed) | 8.5 | 7.5 | — | +1.0 | **Misread** (sneakers read clean) **plus rule** (K1 for any jacket, however busy) |
| **s21** | Black rain jacket, charcoal Puma track pants, black knit runners | 7.0 | 6.0 | — | +1.0 | **Rule.** K1 from a rain jacket (+0.75) cancels the loungewear rule. Track pants + runners with a shell is a gym-run look |
| p06 | Beige overshirt, white tee, tan chinos (upper body only) | 8.5 | 7.5 | — | +1.0 | Borderline. Partial up-scaling (D11) on a clean neutral look; with full credits it would be 8.0 |

Within ±0.5 and fine: p01–p05, s03, s04, s07, s09–s13, s15–s20, s22–s28, m01–m05, m07, m09, m11.

**Pattern:**
- 12 of the 16 flagged photos are **over**-scores; 9 of those 12 come from credit rules (D7–D11), not from missed faults.
- The 2 big **under**-scores are both bottoms read as loungewear: phone1 (wrongly) and s02 (harshly).
- Claude's CSV and my estimates agree within 0.5 on 10 of 12 mirror photos. The mirror bias vs Claude is +0.67 today; with R1–R6 it's +0.33.

---

## 4. Score sensitivity to misreads, and the "one quick tap" rule

### Which fields move the score most
I swapped each field to a plausible look-alike value on every reading: 3,013 one-field swaps. Repeatability counts how often 3 runs of the same photo disagreed on that field (Tests 3–4, 52 photos).

| Field / pair | Average move when wrong | Biggest move | Swaps that move it 1+ | Run-to-run disagreement | Accuracy notes | Risk |
|---|---|---|---|---|---|---|
| Overshirt filed as top vs outerwear | **1.0** | 2.0 | 85% | 1 of 25 outerwear (m12 overshirt/camp shirt) | Category guesses for open shirts are inherently ambiguous | **High → fix in code (R8), don't ask** |
| Bottom type (jeans / sweatpants / joggers / drawstring / chinos / trousers / suit trousers / shorts vs athletic shorts) | 0.33 | **2.5** | 15% | 3 of 52 (m03 chinos/jeans, m04 shorts/athletic, p03 trousers/suit) | The founder's black jeans → sweatpants. Dark, non-denim-looking colors in mirror light are the trap | **High → ask** |
| Strain none ↔ clear | 0.66 | 1.0 | 32% | 2 of 52 ("some/clear" flips on s17, p03) | Rarely "clear"; on bigger bodies it risks judging the body, not the garment | Medium; keep "clear only", never ask |
| Knit vs sweatshirt (sweater ↔ sweatshirt) | 0.2 average, 1.5 max | 1.5 | 8% | 0 of 50 in these runs | Cotton crew knits vs fleece sweatshirts look alike in photos | **Medium → ask** |
| Condition (clean ↔ wrinkled / worn) | 0.36 | 0.5 | 0% | 4 of 52 (p02 shoes, s20 shoes, m12 trousers, s22 chinos) | Quilting and linen texture read as "wrinkled" (phone3, phone4) | Medium; never ask (awkward); cap at −0.4 per garment as now |
| Shoe type (Chelsea ↔ work boot, loafer ↔ derby, sneaker types) | 0.32 | 2.5 | 6% | 4 of 34 | Only matters near the S2 cliff | Medium → R9 ramp; ask only Chelsea/work boot |
| Top length (mid fly ↔ below crotch) | 0.31 | 1.0 | 24% | 9 of 50 (mostly mid fly/at belt, which costs nothing) | Below crotch on long tees is a judgment call | Low–medium |
| Hem (pooling ↔ full break) | 0.13 | 1.0 | 7% | **16 of 52, the most unstable field** (mostly slight/full break, which costs nothing) | Stacked vs pooling on wide jeans is the research's top gap | Medium → the `stacked` value (research #6) |
| Shoes visible yes/no | 0.18 | 1.5 | 2% | 0 of 52 | p01 says "not visible" though white sneakers show | Low (partial checks are labeled) |
| Pattern / saturation / color family | 0.22 / 0.02 / 0.01 | 1.0 | ≤1% | 13 of 52 bottoms flip saturation | Faded pink read "bright" (m06) | Low after R5 |

Two notes on these numbers:
- **Repeatability isn't accuracy.** phone1's sweatpants reading could repeat every run and still be wrong (see `rubric/research/notes/scoring_evidence.md` §3).
- **Gemini Flash is weakest at saying "can't tell."** It scored NA-detection F1 22% ([arXiv 2601.15711](https://arxiv.org/html/2601.15711)). So the model's own `certainty` can't be the only trigger: in the founder's case it said "likely", but a confident wrong "clear" is just as possible.

### The exact trigger I propose
Computed in code, after the guardrails, at most once per check:

1. **Closed list of look-alike pairs (fixed at design time):**
   - Bottoms: any two of {jeans, sweatpants, joggers, drawstring_trousers}; also {chinos, trousers}, {trousers, suit_trousers} and {shorts, athletic_shorts}.
   - Tops: {sweater, sweatshirt}.
   - Shoes: {chelsea_boot, work_boot}.
   - Hem: {pooling, stacked} for relaxed/wide jeans or cargos, once `stacked` exists.
   - Overshirt category is **not** on the list; R8 fixes it in code.
2. **Re-score** with the garment swapped to its look-alike. This is the same deterministic code, so it adds no extra AI call.
3. **Ask if the alternative scores at least 1.0 higher** (displayed score), **and** at least one doubt signal is present:
   - the garment's `certainty` is not "clear", **or**
   - `scene.lighting` is "dim", **or**
   - for the jeans/sweatpants/joggers family, `color_family` is a dark non-denim color (black, charcoal, grey, navy).
4. **Also ask if the alternative scores at least 1.0 lower**, but only when `certainty` is not "clear". This keeps a possibly generous reading honest without pestering him on clear reads.
5. If several pairs qualify, ask only about the one with the biggest score difference.
6. **If he skips, score the more generous reading** and say which one in the card ("Scored as jeans. Not right? Tap."). Same photo, same score still holds, because the default is fixed. Gaming isn't a concern: it's his own score, and the honest answer is one tap away.

How often it would ask, simulated on the 56 readings:
- **Ungated** (any 1.0 swing): 24 of 56 photos (43%). Too many.
- **Gated as above:** **2–3 of 56 (4–5%)**. phone1 (asks; jeans → 6.0) and s21 (track pants; asking "jeans or sweatpants?" is harmless). p01 asks today only because of the overshirt category, which R8 removes.
- **With the dark-color doubt signal in both directions:** 6 of 56 (11%). It adds s10, m07 and m10, all clearly black/charcoal jeans that would only score lower. That's why the downward ask (step 4) needs real doubt.
- Re-check this rate on the founder's 20-shot phone test. If over 10% of checks ask, drop the dark-color signal first.

---

## 5. How to calibrate with humans cheaply (concretely for this founder)

**Goal:** check two things.
- Does Kitted *order* outfits the way a small panel does (rank correlation)?
- Are its bands set at the right *level* (the mean per band)?

Pairwise judging is better on both counts:
- In the ZOZO study, pooled pairwise answers reached split-half ρ 0.72–0.82 ([arXiv 2410.23730](https://arxiv.org/pdf/2410.23730)).
- A gesture-evaluation study found pairwise judgments were faster (about two-thirds of the time per trial) and needed fewer participants than rating scales ([Wolfert et al., arXiv 2108.05709, 2021](https://arxiv.org/pdf/2108.05709); older).
- A 2025 comparative-judgement meta-analysis puts reliable ranking at **about 10 comparisons per item** ([Behavior Research Methods 2025, s13428-025-02744-w](https://link.springer.com/article/10.3758/s13428-025-02744-w), via [RM Compare summary, Jul 21, 2026](https://compare.rm.com/blog/fewer-comparisons-higher-bar-what-the-latest-acj-research-means-for-rm-compare-users/)).

**The plan (about 1 hour of your time, 10 minutes per friend, $0):**
1. **Photo set: 40 photos.**
   - Your 20 phone-test shots, including 4–5 deliberately bad ones: sweats out, pooled hems, a wrinkled shirt, a clashing color.
   - The 12 mirror selfies.
   - 8 stock photos chosen to cover the bands: s02, s06, s12, s21, s24, p02, s07, m02.
   - Use the face-hidden copies only. Get your friends' OK before using any photo of them.
2. **Raters: 5–7 friends.** Mix 2 who care about clothes with 3+ who don't, since the app is for beginners and their peers. Ideally include 1–2 women, because dates are a core use; this is my judgment, not sourced.
3. **Task:**
   - Show two photos side by side: "Which looks more put together for an ordinary day?" (Left / Right / Can't pick).
   - Generate 200 random pairs so each photo appears about 10 times, plus 20 repeated pairs to measure self-consistency.
   - Each friend does 40–45 pairs, about 5–8 minutes.
4. **Anchor the scale:** after the pairs, each friend rates 6 fixed anchor photos 1–10, one per band (e.g. s24, p02, phone1, s12, m07, s07). Pairs give the order; anchors give the level.
5. **Analysis** (Claude does it, in pure Python, so nothing to install):
   - Fit a Bradley–Terry model, which turns the pair answers into a strength score per photo.
   - Map the strengths onto 1–10 through the anchor ratings.
   - Report: Spearman ρ between Kitted's scores and the panel's ranking; split-half ρ between two random halves of raters (the agreement ceiling); and mean gap per band.
6. **Pass bars** (my proposals, not sourced):
   - Kitted ρ at least 0.6, and at least 0.8 of the panel's own split-half ρ.
   - Anchored average error 0.75 or less; bias within ±0.25.
   - ≤5.5 and 9+ photos land in the panel's bottom and top 15%.
7. **Decision rule:** a rubric change (any of R1–R9, any style allowance, any new credit) ships only if it doesn't lower ρ on this set. Point values (baseline, credit sizes, the 5.0 floor) get tuned to the anchored band means.
8. **Truth labels at the same time:** while picking the 40 photos, write down the true garment type, hem and color for each piece (one row per garment). That gives the misread rate for the pairs in section 4, which repeatability can't.

**Tooling** is your call, because it's outward-facing. Option A: a Google Form with 45 image pairs per friend. Option B: Claude builds a small private pair-voting page. Either works; B makes the 10-per-photo balance automatic.

---

## Sources
- Filippas, Horton & Golden, "Reputation Inflation," *Marketing Science* 41(4), 2022: [paper page](https://john-joseph-horton.com/papers/reputation-inflation/), [INFORMS release](https://www.informs.org/News-Room/INFORMS-Releases/News-Releases/Five-Star-Rating-New-Research-Finds-It-May-Not-Reflect-What-Consumers-Receive)
- Hu, Pavlou & Zhang, "Overcoming the J-shaped Distribution of Product Reviews," CACM, Oct 2009 (older): [link](https://cacmb4.acm.org/magazines/2009/10/42353-overcoming-the-j-shaped-distribution-of-product-reviews)
- AesRec (Ye et al.), arXiv, Feb 3, 2026: [arXiv 2602.03416](https://arxiv.org/html/2602.03416v1)
- ZOZO Research (Hirakawa et al.), GPT-4V fashion aesthetics, SIGGRAPH Asia TC 2024: [arXiv 2410.23730](https://arxiv.org/pdf/2410.23730)
- Simo-Serra et al., "Neuroaesthetics in Fashion," CVPR 2015 (older): [CVF](https://openaccess.thecvf.com/content_cvpr_2015/html/Simo-Serra_Neuroaesthetics_in_Fashion_2015_CVPR_paper.html)
- StylePal blog, Mar 13, 2026 (a rival's marketing): [link](https://www.stylepal.app/news/best-outfit-rating-app)
- VLM fashion attributes and NA detection, arXiv Jan 22, 2026 (WACV 2026 Workshops): [arXiv 2601.15711](https://arxiv.org/html/2601.15711)
- Wolfert et al., "To Rate or Not To Rate," 2021 (older): [arXiv 2108.05709](https://arxiv.org/pdf/2108.05709)
- Comparative-judgement meta-analysis, *Behavior Research Methods*, 2025: [Springer](https://link.springer.com/article/10.3758/s13428-025-02744-w); summary by RM Compare, Jul 21, 2026: [link](https://compare.rm.com/blog/fewer-comparisons-higher-bar-what-the-latest-acj-research-means-for-rm-compare-users/)
- Local: `extraction-test/rubric.py` v3.1; `extraction-test/results/test3-stock-40-v3/` and `test4-mirror-12-v3/` raw results; `inputs/mirror-fit-check-1/metadata.csv`; `rubric/research/notes/scoring_evidence.md`; `phone-checks-oct7.json`.

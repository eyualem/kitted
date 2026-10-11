# Parts engine: tuning the rewards so deliberate fits can reach 8 (Oct 10, 2026)

*Claude (subagent), after the founder approved the tuning on Oct 10. No API calls, no money. Nothing in the app, `rubric.py`, the prompt or the fixtures changed, and nothing is committed. Files:*
- *Engine: `extraction-test/rubrics/parts_proto.py`. `engine="v2"` is the tuned engine and the default. `engine="v1"` reproduces parts-proto-1 exactly (checked: `results/parts1/analysis.json` regenerates byte-identical).*
- *This test: `extraction-test/parts2_test.py` (`/usr/bin/python3 parts2_test.py`). Numbers: `extraction-test/results/parts2/analysis.txt`, `analysis.json`, `split.json`.*
- *`parts_test.py` (the v1 test) now asks for `engine="v1"` explicitly. That's its only change.*

**Who is in the photos (rule 7):**
- The founder: profile pending (no birth year or picked looks yet).
- His friends: profile unknown.
- 703a8b (navy polo) and ebe23f (quilted jacket): unknown. **Please tell me who they are.**
- Web and stock photos: profile unknown.

Everything was scored with **one test profile**: picks Minimal + Smart casual (0.5 each), boldness "a little", no age. No engine lets age or picks change a number, so a split by age band or picked look isn't possible.

## The short version
- **8 now happens, and only for deliberate fits.** One reading per photo, 78 photos:
  - median 7.0 (target ~7);
  - **8+ on 5 photos (6%)**, against a target of 5–12% (the panel gave 7%);
  - 9+ on none.
  - The five 8s are a tucked shirt over straight trousers with chosen shoes (P001), the olive suit (P021), a denim jacket over a tucked oxford and cropped trousers, a catalog tucked shirt and check trousers, and a linen suit.
- **Plain fits stay at 7.** 67 of 78 photos score exactly what v1 gave. The 11 that moved all went up by 0.5, and every one is a tailored line, a tuck, a suit or a short jacket.
  - Your 21 checks: one moved (oct7-ph3, sport coat + tucked shirt + loafers, 7.0 → 7.5).
  - Your friends' 4 checks: none moved.
- **Just as steady as v1:**
  - batch 1, all 3 runs within 0.5: **49/49** (v1 49/49, v4.1 47/49);
  - the design set: 66/66;
  - with the lightness word switched on: 49/49.
- **Closer to the panel, including on photos it was never tuned on:**
  - All 59: mean difference **+0.01**, within 0.5 on **51** (v1: −0.03 and 50).
  - **Held-out half** (29 photos): within 0.5 on **26** (v1 25), MAE 0.43 (v1 0.50), correlation 0.56 (v1 0.43).
  - Every panel photo v2 moved got closer to the panel: 5 of 5, 3 of them in the held-out half.
- **Your fits' targets:**
  - Met:
    - the friend's blazer **7.0** (needed 7 or below);
    - the chore coat **7.0** on all 3 photos (needed 7–7.5);
    - the gingham overshirt (f07193) **6.5**.
  - Not met: the gingham shirt worn alone (5a9049, 7f14a4) **stays 7.0**, against the panel's 6.0. Its fault (the shirt hangs long over wide jeans) can't be read yet, so tuning can't touch it.
- **Fixes lift scores; no fix ever lowers one:**
  - tucking your black tee: 7.0 → 7.5;
  - slides → sneakers: +0.5 to +1.0 on all 9 slide photos;
  - sleeves that fit: 6.5 → 7.0;
  - adding a standout pattern now lifts 13 of 39 plain outfits (v1: 5).
- **The stock before/after pairs don't separate,** in v1 or v2. None of their changes is one the readings reward, and the visible ones (a shoe swap under a loungewear ceiling, an overcoat that also changed the tuck and the suit) cancel out.

---

## 1. What changed in the rewards, and why
The rule I held to: **tune only rewards whose readings passed a steadiness test**. Every fault, ceiling, floor and the condition step is identical in v1 and v2. The four calls you took the defaults on are unchanged:
- slides out of the house: Shoes 4.5;
- a lost shoe type: Shoes is NA;
- no credit just for wearing a jacket or chore coat;
- new: when every part is 7, the card says **"Every part is solid: nothing off, nothing standing out yet."** instead of naming a weakest part.

| # | Reward | v1 | v2 | Why |
|---|---|---|---|---|
| 1 | **Waist break:** a full tuck, or a short top worn alone, over a straight-to-wide leg | +1.0 | **+1.5** | The best-backed deliberate shape: 6 sources for, 0 against. Its readings are the steadiest in the engine (tuck 97%, short top 100% right when it fires, leg 94%). At +1.0 the part reached 8, and the 30% weight turned that into +0.3 on the total, so one deliberate shape never showed. +1.5 gives 8.5, the anchor for "one deliberate shape, nothing off". |
| 1b | **Mirror guard:** an *untucked* short top in a mirror selfie | +1.0 | **+0.5** | Both arms up to hold the phone lift the hem, so "at the belt" can be the pose, not the cut (proportions.md, known problem 2). I checked the one photo it touches (web m06: a long pink tee read at the belt with both arms raised; the stylist estimate is 5.5). A full tuck reads the same in a mirror and keeps +1.5. `scene.mirror_selfie` flipped on 1 of 116 photos across runs. |
| 2 | **Short layer over a full leg** (bomber, denim or leather jacket, by type) | +1.0 | **+1.5** | Same shape and the same evidence (4 for, 0 against). Its reading is the jacket type (100% steady). |
| 3 | **Complete tailored line** (a tailored jacket, tucked top, pressed trousers, no skinny leg) | +0.5 | **+1.0** | The tailoring version of the waist break, built on the same steady facts. |
| — | Proportions reward cap | +2.0 | **+2.5** | Lets a tuck plus a tailored line stack (part 9.5). It never binds on these photos. |
| — | Half tuck | +0.5 | +0.5 | Unchanged: half vs. none was never tested. |
| 4 | **Clearly that style top to toe** (an anchor piece in all 3 slots, nothing against), or a suit worn properly over a top | +0.5 | **+1.0** | The "signature pieces throughout" credit, and steady (flips on 1 of 3 and 0 of 7 photos where it fires). "Reads as a style" stays **+0.5**, because style detection is the wobbliest fact (it flips on 12 of 36 photos). |
| 5 | **One standout piece** (pattern) | +0.5 | **+0.75** | So "add one standout" can move a plain outfit's shown score (see §6). |
| 6 | **Color:** standout +1.0, quiet accent +0.5, tie-in +0.5 | same | same, **stacking up to +2.0** | Sizes unchanged: the quiet accent flips on 4 of 10 photos. |
| 7 | **Color, lightness credits:** tonal with a range +1.0, tonal anchored by the shoes +0.5, light-mid-dark +0.5 | off | **on when the reading carries `lightness`** | Lightness passed alone in batch 1 (95% the same, 94–98% right). **It isn't in the live reading yet, so on today's checks these can't fire.** With batch 1's lightness copied on, 11 of 50 photos earn one and 1 changes score (s15 7.0 → 7.5). |
| 8 | **Shoes: the look's own shoe under a suit** (dress shoes, derbies, loafers, Chelsea boots under a matching suit jacket and trousers) | never | **+0.5** | Style detection names no style for a suit, so "the look's own shoe" could never fire under one, while Cohesion already credits "a matching suit". Other shoe credits are unchanged: Shoes is the part that already tracks the panel best (r 0.82) and sits slightly above it. |
| 9 | **The earned bonus** (new, after the average) | none | **+0.25** | Explained below. |

**The earned bonus.** Each part's excess over 7.5 is added up. The single largest excess is dropped, and half of the rest is added, at most **+0.25**. One routine credit (a 7.5) isn't excellence, and one strong part is already in the average.
- **In practice:** "+0.25 when a second part reaches 8 and nothing is under 7."
- **The gate:** the bonus fades in as the weakest part goes from 6.5 to 7.0, so a weak part switches it off.
- **Why the cap is 0.25, not 0.5:** at 0.5, a flip-prone color fault switched the whole bonus on and off. On s01, the vest read as a third pattern on 2 of 3 runs, and the photo moved a full point between runs (batch 1 fell to 48/49). At 0.25 it stays 49/49.

**Considered and not adopted:**
- **Reweighting** (Fit 25→15 with Shoes and Style up; all five at 20%; Proportions 35%).
  - None beat v2 on the held-out half (25–26 of 29).
  - "Fit 25→15" pushed 8+ to 10% by leaning on Shoes and Style, the two flippiest parts.
  - The panel's part scores are a halo of its overall impression, so they can't set weights. The gold set should.
- **A bigger bonus.** Cap 0.5 gives 8–12% at 8+ but fails steadiness (48/49).
- **A higher threshold for "strong" (8.0).** It leaves only 2 photos at 8 (3%).
- **Stretching the whole scale.** Rejected again: it makes the same weak signals louder.

**How the values were picked, and the honest caveat.**
- The first draft (rows 1–5, 7–9) came from the part reports' anchors and a look at the six panel photos the brief names. That happened before the split was drawn. Five of those six landed in the tuning half and P021 in the held-out half, so P021 isn't a clean held-out test.
- After the split, I made two changes: the mirror guard (driven by web m06, which isn't in the panel) and the bonus cap 0.5 → 0.25 (driven by batch-1 steadiness).
- **The panel's tuning half couldn't choose between settings.** Every reward and bonus variant in the ablation table scores 25 of 30 within 0.5 there, and the reweighting variants score 25–26. So the settings were chosen on steadiness, the 8+ share and the named top photos. The held-out half is a check that nothing got worse and that the moves point the right way, which they do.

## 2. The split
Seed 20261010, fixed before tuning. The split is stratified by group, and **photos of the same outfit stay in the same half**:
- your black tee + wide jeans (8ad378/403ade);
- the gingham shirt alone (5a9049/7f14a4);
- the hoodie + joggers + slides trio;
- the chore coat trio;
- the grey hoodie + boots, the grey and black hoodie + slides pairs, and the gingham-over-hoodie pair;
- each stock before/after pair.

Tuning: 30 photos. Held-out: 29. The membership is in `results/parts2/split.json`.

## 3. Score spread (one reading per photo, each at its own occasion)
| Group | Engine | n | Median | ≤5.5 | 6–6.5 | 7–7.5 | 8+ | 9+ |
|---|---|---|---|---|---|---|---|---|
| All photos | v4.1 | 78 | 7.5 | 3% | 14% | 42% | 41% | 4% |
| | v1 | 78 | 7.0 | 6% | 18% | 76% | 0% | 0 |
| | **v2** | 78 | **7.0** | 6% | 17% | 71% | **6% (5)** | **0** |
| The founder (profile pending) | v1 → v2 | 21 | 7.0 → 7.0 | 19% | 29% | 52% | 0 → 0 | 0 |
| Friends (profile unknown) | v1 → v2 | 4 | 7.0 → 7.0 | 0 | 0 | 100% | 0 → 0 | 0 |
| 703a8b, ebe23f (ask) | v1 → v2 | 2 | 7.25 → 7.25 | | | 2 | 0 | 0 |
| Web mirror (profile unknown) | v1 → v2 | 12 | 7.0 → 7.25 | 0 | 8% | 92% → 67% | 0 → **25% (3)** | 0 |
| Stock (profile unknown) | v1 → v2 | 39 | 7.0 → 7.0 | 3% | 18% → 15% | 79% → 77% | 0 → **5% (2)** | 0 |

- **Values used:** 5.5 ×5, 6.5 ×13, 7.0 ×45, 7.5 ×10, 8.0 ×5. That's one more value than v1. It's still bunched at 7, which is honest for what the readings see.
- **v2 − v1 per photo:** 0 on 67, +0.5 on 11.
- **The bonus** fires on 9 of 78 photos, always +0.25.

| Photo (8+ in v2) | Who | v1 → v2 | Parts (v2) | Outside check |
|---|---|---|---|---|
| stock s01 (P001) | stock | 7.5 → **8.0** | Prop 8.5 · Fit 7 · Color 7.5 · Shoes 8.5 · Style 7.5 | panel 8.0 |
| stock s07 (P021) | stock | 7.5 → **8.0** | Prop 8 · Fit 7 · Color 7 · Shoes 8 · Style 8.5 | panel 8.5 (v2 with lightness: 8.0) |
| web m02 | web | 7.5 → **8.0** | Prop 8.5 · Fit 7 · Color 7 · Shoes 8 · Style 8.5 | stylist estimate 8.5 |
| web m05 (a catalog photo) | web | 7.5 → **8.0** | Prop 8.5 · Fit 7 · Color 7 · Shoes 8 · Style 7.5 | stylist estimate 8 |
| web m09 | web | 7.5 → **8.0** | Prop 8 · Fit 7 · Color 7.5 · Style 8.5 | stylist estimate 7.5 |

**Part distributions, v1 → v2:**
- **Proportions:** 7 photos move from 7.5 to 8 (tailored lines) and 6 from 8 to 8.5 (tucks, short jackets). Web m06 goes from 8 to 7.5 (the mirror guard). The rest are unchanged.
- **Style:** all 12 photos at 8 move to 8.5, and 1 moves from 7.5 to 8 (a standout piece with no style read).
- **Shoes:** 4 suits move from 7.5 to 8.
- **Fit and Color:** unchanged. No lightness in the live reading, and Fit has no rewards.

## 4. Steadiness (3 runs, Everyday)
| Set | | v4.1 | v1 | **v2** |
|---|---|---|---|---|
| Batch 1 arm A (validation, second look paired) | all 3 within 0.5 of the median | 47/49 | 49/49 | **49/49** |
| | max − min ≤ 0.5 | 46/49 | 49/49 | **49/49** |
| | exactly the same | 31/49 | 42/49 | 41/49 |
| | mean / worst spread | 0.21 / 1.0 | 0.07 / 0.5 | 0.08 / 0.5 |
| zoom1 arm B (design set) | within 0.5 / exact | 64/66 / 39 | 66/66 / 57 | **66/66** / 57 |
| Batch 1 + lightness from arm B1 run *i* (the lightness credits live) | within 0.5 / exact | 47/49 | 49/49 | **49/49** / 39 |

- **The bonus differs between runs on 2 photos:** m08 [0, 0, 0.25] and s01 [0, 0.25, 0]. Both stay within 0.5.
- **What still wobbles** (photos where a check fires on some runs but not all, out of photos where it fires):
  - "Reads as a style": 12/36
  - worn shoes: 5/9
  - the quiet accent: 4/10
  - the bonus: 3/7
  - The new lightness credits flip on 1 of 6 and 1 of 4.

## 5. Against the judge pilot
| Set | Engine | n | Mean diff | MAE | Within 0.5 | Off 1.5+ | r |
|---|---|---|---|---|---|---|---|
| All | v4.1 | 59 | +0.54 | 0.71 | 32 | 8 | 0.58 |
| | v1 | 59 | −0.03 | 0.46 | 50 | 3 | 0.59 |
| | **v2** | 59 | **+0.01** | **0.42** | **51** | 3 | **0.63** |
| **Tuning half** | v1 | 30 | −0.08 | 0.42 | 25 | 2 | 0.69 |
| | v2 | 30 | −0.07 | 0.40 | 25 | 2 | 0.69 |
| **Held-out half** | v1 | 29 | +0.02 | 0.50 | 25 | 1 | 0.43 |
| | **v2** | 29 | **+0.09** | **0.43** | **26** | 1 | **0.56** |
| Held-out, stock/web only | v1 → v2 | 16 | −0.31 → −0.19 | 0.44 → 0.31 | 15 → 16 | 0 | 0.70 → 0.79 |
| Your and your friends' photos (both halves) | v1 → v2 | 20 | +0.40 → +0.40 | 0.55 | 14 → 14 | 2 | 0.56 |

**Every panel photo v2 moved:**

| Photo | Half | Panel | v1 → v2 | Result |
|---|---|---|---|---|
| P001 (s01) | tune | 8.0 | 7.5 → 8.0 | now exact |
| P021 (s07) | held | 8.5 | 7.5 → 8.0 | closer |
| P036 (p04 before) | held | 7.5 | 7.0 → 7.5 | now exact |
| P052 (p04 after) | held | 7.5 | 7.0 → 7.5 | now exact |
| P058 (s14) | held | 7.0 | 6.5 → 7.0 | now exact |

**The panel's top photos:**
- **Reached 8:**
  - **P001** (8.0, tune): **8.0**.
  - **P021** (8.5, held): **8.0**; 8.0 with lightness too.
- **Didn't reach 8, because the readings can't see why they're good:**
  - **P010** (8.5): white suit, scarf collar, black loafers. **7.0.** The jacket reads as "other" and the trousers as white trousers, so nothing says "suit". With lightness it gets the tonal-anchored credit and stays 7.0.
  - **P035** (8.0): black tucked knit, slim pressed trousers with no break, black dress shoes. **7.0.** A tuck over a slim leg isn't the waist-break shape, and all-black tonal earns nothing. What the panel liked (the knit's texture, the clean fit) has no reading.
- **At their panel score already:**
  - **P043** (7.5): 7.0, or 7.5 with lightness.
  - **P044** (7.5): 7.5. One strong part, the denim jacket's shape, so no bonus.
  - Neither should be pushed to 8: the panel gave both 7.5.
- **The plain middle stays at 7:** of the 25 panel photos at 7.0–7.5 that v1 scored 7.0, 23 keep 7.0 in v2. The other two are the p04 suit pair (panel 7.5, now 7.5).
- **Still off by 1.5+ (same 3 as v1):**
  - P015, the friend's blazer: 7.0 vs 5.5; the stack under the blazer is unread.
  - P010: 7.0 vs 8.5.
  - P025, your fleece + flannel: 7.5 vs 6.0; the hem slouching over the boots is unread.

## 6. Every check of yours, your friends' and the two unknowns (each check's own occasion)
Parts in order Proportions · Fit · Color · Shoes · Style. "—" = NA.

| Photo | Who | What's read | v4.1 → v1 → **v2** | v2 parts | v2 card line |
|---|---|---|---|---|---|
| **d1967f** | friend (blazer) | suit jacket (judged as a blazer), tee, jeans, chukkas | 8.5 → 7.0 → **7.0** | 7 · 7 · 7 · 7.5 · 6 | Style 6: the tailored jacket and the loose or washed jeans come from different worlds |
| **e438d4** | friend (chore coat) | chore coat, tee, jeans, low-profile sneakers | 8.5 → 7.0 → **7.0** | 7 · 7 · 7 · 7.5 · 7.5 | Proportions 7: a balanced, classic shape |
| **f4870b** | friend (chore coat) | same | 8.5 → 7.0 → **7.0** | 7 · 7 · 7 · 7.5 · 7.5 | same |
| **fb0b17** | friend (chore coat) | same | 8.5 → 7.0 → **7.0** | 7 · 7 · 7 · 7.5 · 7.5 | same |
| oct7-ph1 | founder | hoodie, sweats (his jeans, misread), slides | 5.0 → 5.5 → **5.5** | 7 · 7 · 7 · 4.5 · 7 | Shoes 4.5: slides read as staying in |
| oct7-ph2 | founder | dress shirt, suit trousers (no shoes) | 7.5 → 7.0 → **7.0** | 7 · 7 · 7 · — · 7.5 | Proportions 7 |
| **oct7-ph3** | founder | sport coat, tucked dress shirt, suit trousers, loafers | 8.0 → 7.0 → **7.5** | 8 · 7 · 7 · 8 · 8.5 | Fit 7 (condition: wrinkled sport coat −0.4; bonus +0.25) |
| oct7-ph4 | founder | field jacket, tee, jeans (no shoes) | 8.0 → 7.0 → **7.0** | 7 · 7 · 7 · — · 7.5 | Proportions 7 |
| 0d39d6 | founder | hoodie, wide jeans, slides | 6.5 → 6.5 → **6.5** | 7 · 7 · 7 · 4 · 7.5 | Shoes 4 |
| 1f1997 | founder | hoodie, wide jeans, slides | 7.0 → 6.5 → **6.5** | 7 · 7 · 7 · 4 · 7.5 | Shoes 4 |
| 403ade | founder | black tee, wide jeans, white leather sneakers | 7.5 → 7.0 → **7.0** | 7 · 7 · 7 · 7.5 · 7.5 | Proportions 7 |
| 8ad378 | founder | same outfit | 7.5 → 7.0 → **7.0** | 7 · 7 · 7 · 7.5 · 7.5 | Proportions 7 |
| **5a9049** | founder (gingham alone) | oxford shirt, wide jeans, work boots | 7.5 → 7.0 → **7.0** | 7 · 7 · 7 · 7 · 7.5 | Proportions 7 (the "shirt hangs long" rule is a tip only) |
| **7f14a4** | founder (gingham alone) | flannel, jeans, boots read as derby | 6.5 → 7.0 → **7.0** | 7 · 7 · 7 · 6 · 7.5 | Shoes 6: the shoes look worn |
| **f07193** | founder (gingham overshirt) | tee, overshirt, jeans, boots read "other" | 7.5 → 6.5 → **6.5** | 7 · 5.5 · 7 · — · 7 | Fit 5.5: the overshirt's sleeves run past the wrists |
| 6b14db | founder | hoodie, sweats, slides | 5.5 → 5.5 → **5.5** | 6.5 · 7 · 7 · 4.5 · 7 | Shoes 4.5 (loungewear: held to 5.5) |
| 7de605 | founder | hoodie, tee, sweats, slides | 6.0 → 5.5 → **5.5** | 6.5 · 7 · 7 · 4.5 · 7 | Shoes 4.5 (held to 5.5) |
| a765e8 | founder | hoodie, tee, sweats, slides | 6.0 → 5.5 → **5.5** | 6.5 · 7 · 7 · 4.5 · 7 | Shoes 4.5 (held to 5.5) |
| 8bc29d | founder | striped overshirt, hoodie, wide jeans, boots "other" | 7.5 → 6.5 → **6.5** | 7 · 7 · 7 · — · 7.5 | Proportions 7 (condition: wrinkled overshirt −0.4) |
| 968016 | founder | teal sweatshirt, wide jeans, white sneakers | 7.5 → 7.5 → **7.5** | 7 · 7 · 7.5 · 8 · 7.5 | Proportions 7 |
| b0f0c8 | founder | hoodie, jeans, work boots | 7.0 → 7.0 → **7.0** | 6.5 · 7 · 7 · 7 · 7.5 | Proportions 6.5: the top underneath shows below the outer piece |
| d58b14 | founder | hoodie, jeans (his tap answer), slides | 7.0 → 6.5 → **6.5** | 7 · 7 · 7 · 4.5 · 7 | Shoes 4.5 |
| d6559a | founder | hoodie, jeans, boots "other" | 7.0 → 7.0 → **7.0** | 7 · 7 · 7 · — · 7 | **Every part is solid: nothing off, nothing standing out yet.** |
| d918c0 | founder | fleece, flannel, wide jeans, boots read as chukkas | 7.5 → 7.5 → **7.5** | 7 · 7 · 7.5 · 8 · 7.5 | Proportions 7 |
| e026de | founder | overshirt, sweatshirt, jeans, boots read as slides | 7.5 → 6.5 → **6.5** | 7 · 7 · 7 · 4 · 7.5 | Shoes 4 |
| **703a8b** | unknown (ask) | tucked navy polo, jeans (no shoes) | 7.5 → 7.5 → **7.5** | 8.5 · 7 · 7.5 · — · 7 | Fit 7 (one strong part, so no bonus) |
| **ebe23f** | unknown (ask) | quilted jacket (read "other"), jeans, white leather sneakers | 8.0 → 7.0 → **7.0** | 7 · 7 · 7 · 7.5 · 7 | Proportions 7 |

**With your true shoes** (Oct 8 labels):
- e026de: 7.0.
- 8bc29d: 7.0.
- d6559a: 7.0.
- d918c0: 7.5.
- f07193: 7.0.

These are the same as v1. None of your boot fits reaches 8: the boots earn Shoes 8, but nothing else in those outfits is strong.

## 7. Can a fix lift a fit? (the engine's own edits, every reading the fix applies to)
| Fix (the edit) | Applies to | Shown score up (v1 / v2) | Ever down? | Mean lift v1 / v2 | Your and your friends' photos (v2) |
|---|---|---|---|---|---|
| **Tuck the top** (a non-ribbed top, fully tucked) | 30 | 10 / **11** | never | +0.17 / +0.22 (unrounded +0.10 / +0.19) | **black tee 403ade and 8ad378 7.0 → 7.5** (Prop 8.5); gingham shirt 5a9049 and 7f14a4 7.0 → 7.5. No change under a layer (the chore coat, the field jacket, the gingham overshirt): tucking under a jacket isn't a shape the engine rewards |
| **Slides → white leather sneakers** | 9 | 9 / **9** | never | +0.72 / +0.72 | hoodie + jeans + slides 6.5 → 7.0 (Shoes 8). Hoodie + joggers + slides 5.5 → 6.5: the loungewear ceiling still holds them, since joggers out of the house are the bigger issue |
| **A better-fitting piece** (sleeves to the wrist, no strain) | 2 | 2 / **2** | never | +0.5 / +0.5 | gingham overshirt f07193 6.5 → 7.0 |
| **Add a standout color** (the visible top layer in one bright color, on an all-neutral outfit) | 39 | 20 / 18 | never | +0.26 / +0.23 | black tee 7.0 → 7.5; chore coat 7.0 → 7.5; hoodie + slides 6.5 → 7.0 |
| **Add a standout pattern** (the visible top layer in a medium plaid) | 39 | 5 / **13** | never | +0.06 / +0.17 | black tee and chore coat 7.0 → 7.5 (Style 8.5) |

- **No fix lowers a score in either engine.**
- **The standout-color fix lifts slightly fewer shown scores in v2 (18 vs 20).** That's rounding: its unrounded lift is the same (+0.11 v1, +0.12 v2), and some v2 starting points sit higher inside the same half point.
- **One honest gap:** "add a standout" on the 15% Color or Style part is worth +0.1 to +0.15 on the total. So it shows as +0.5 only when the outfit already sits near the top of its half point. The fix copy shouldn't promise a number for it.

## 8. The stock before/after pairs (p01–p06)
| Pair | The change (fixes.csv) | What the readings changed | Panel | v4.1 | v1 | v2 |
|---|---|---|---|---|---|---|
| p01 | wears the overshirt instead of holding it | The overshirt is read in both, so the change isn't visible. Only noise (top length, leg slim → straight) | 7.0 → 7.0 | 8.5 → 8.0 | 7.0 → 7.0 | 7.0 → 7.0 |
| p02 | white sneakers → darker boots | Shoes: worn chunky sneakers → clean work boots (Shoes 6 → 7). But the after also reads the sweatpants as pooling (Fit 7 → 6.5), and both sit under the loungewear ceiling (6.5) | 7.0 → 7.0 | 6.0 → 6.0 | 6.5 → 6.5 | 6.5 → 6.5 |
| p03 | adds a long overcoat | The suit jacket became an overcoat, the tucked sweater became untucked, and skinny suit trousers became slim trousers. Proportions 6.5 → 7 and Style 8.5 → 7.5 cancel (raw 7.22 → 7.23) | 7.0 → 7.5 | 7.5 → 9.0 | 7.0 → 7.0 | 7.0 → 7.0 |
| p04 | white shirt → black shirt | the shirt's color only; no rule rewards it | 7.5 → 7.5 | 8.0 → 8.0 | 7.0 → 7.0 | **7.5 → 7.5** |
| p05 | dark trousers → white shorts | Proportions goes NA (no shorts-length reading) | 7.0 → 7.0 | 7.5 → 7.5 | 7.0 → 7.0 | 7.0 → 7.0 |
| p06 | sleeves rolled more | sleeves at the wrist → above it; no rule | 7.5 → 7.5 | 8.5 → 8.5 | 7.0 → 7.0 | 7.0 → 7.0 |

- **The after never scores lower than the before.**
- **The after doesn't score higher either.** The two changes visible in the readings (p02's shoe swap, p03's overcoat) are offset by other changes the reading made. None of the six changes is a tuck, a short jacket, a tailored line or a standout, so **these pairs don't test the tuned rewards.** v4.1's p03 jump (7.5 → 9.0) is the old layer credit, which you dropped on purpose.
- The gold set needs pairs that change one rewarded thing (tuck on/off, slides vs. sneakers, a standout on/off).

## 9. What still can't be seen
1. **Good fit.** Fit (25%) can only find faults. With no shoulder-seam reading (it failed at 78%), 7 is its ceiling on every photo. Proportions and Fit are at 7 (or NA) on most photos, which is why plain fits can't move.
2. **Lengths.** The top and layer hem (`hem_at` failed at 74%). So a shirt hanging long over wide jeans can't cost points, and your gingham-alone photos stay 7.0 against the panel's 6.0.
3. **Hems against the shoe.** The stack under a blazer (the friend's 5.5), a deliberate stack on baggy jeans (a reward streetwear should earn), and wide jeans slouching over boots. These wait for reading batch 2 (`stacked`, `hem_on_shoe`, `shoe_profile`), which hasn't been run.
4. **Fabric, texture, drape and sheen.** What made P035's black knit and P010's white suit sharp to the panel.
5. **Condition.** Fading and lint read as clean. The panel named fading 16 times.
6. **Accessories** (the "finished touch"). No reading.
7. **Whether a mix is deliberate.** Not a fact the AI can report.
8. **Lightness on live checks.** The tonal and light-mid-dark credits are built and steady, but the live reading has no `lightness`. Adding it to the scoring call needs its own flip test with that field alone. Batch 1 failed as a batch, though lightness passed on its own.
9. **Streetwear excellence.** The readings have almost no positive signals for a good streetwear shape (only chunky sneakers carrying wide jeans). So the lift went mostly to tailoring: 6 of the 11 photos that moved have a tailored line. That's a bias to watch. Batch 2's `stacked` hem and a boxy-crop reading are what would let a strong streetwear fit earn an 8.

**The panel can't calibrate this.** It's one model five times, it's compressed, and every setting tied on the tuning half. The gold set, with real raters, is still what sets the sizes. Re-run both paper tests on it and report by age band and picked look (rule 7).

## 10. What I recommend
1. **Take v2 as the parts engine's working settings.** It reaches 8 only on deliberate fits, keeps plain fits at 7, is as steady as v1, and moves the held-out photos toward the panel.
2. **Log in DECISIONS-LOG** (not done here; this session doesn't commit):
   - the reward sizes in §1;
   - the earned bonus (+0.25, its gate, and why not 0.5);
   - the mirror guard;
   - the suit's own shoe;
   - the "every part is solid" line.
3. **The readings are still what unlock more 8s, and a 9:**
   - lightness alone in the scoring call (a cheap flip test);
   - batch 2's hem fields (they fix the friend's blazer and give streetwear a reward);
   - a shoulder-seam cue that passes (the only way Fit can rise above 7).
4. **Before the TypeScript port,** re-run `parts2_test.py` on the gold set, including one-change pairs, so each reward's size is set by people rather than by the panel.

*Caveat for re-running:* like `parts_test.py`, this test reads the 78-reading corpus from the session scratchpad (`…/scratchpad/corpus.json`). If that folder is cleared, the corpus has to be rebuilt or saved into `extraction-test/` first.

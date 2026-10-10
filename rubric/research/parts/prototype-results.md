# Parts engine: the prototype and its paper test (Oct 10, 2026)

*Claude (subagent), for the parts plan (`SPEC.md`, approved #196–197), after reading batch 1 (#198) and the second look (#199). No API calls, no money. Nothing in the app, `rubric.py`, the prompt or the fixtures changed, and nothing is committed. Files: `extraction-test/rubrics/parts_proto.py` (the engine), `extraction-test/parts_test.py` (this test; `/usr/bin/python3 parts_test.py`), `extraction-test/results/parts1/analysis.txt` + `analysis.json` (every number below).*

**Who is in the photos (rule 7).** The founder: 21 photos, profile pending (no birth year or picked looks yet). His friends: 4 photos, profile unknown (the navy-blazer friend d1967f; the chore-coat friend e438d4, f4870b, fb0b17). **703a8b (navy polo) and ebe23f (quilted jacket): unknown, so please tell me who they are.** Web mirror selfies and stock photos: profile unknown. Everything was scored with **one test profile**: picks Minimal + Smart casual (0.5 each), boldness "a little", no age. Neither engine lets age or picks change a number, so no split by age band or picked look is possible yet.

## The short version
- **Steadier than v4.1.** On batch 1's 3-run control arm, all 3 runs land within 0.5 on **49 of 49 photos (100%) vs v4.1's 47 of 49 (96%)**. The runs agree exactly on 86% vs 63%. The average spread is 0.07 vs 0.21. The worst spread is 0.5 vs 1.0. The design set (zoom1, 66 photos) shows the same.
- **It brings scores down to where the panel is.** One reading per photo, 78 photos: median 7.0 (v4.1 7.5), and 8+ on **0%** (v4.1 41%). Against the judge pilot, the parts engine is **−0.03** off the panel on average (v4.1 +0.54), within 0.5 on **50 of 59** (v4.1 32), off by 1.5+ on 3 (v4.1 8), correlation 0.59 (v4.1 0.58). On your and your friends' photos the gap shrinks from +0.93 to +0.40.
- **But it's squeezed into a narrow band.** 68 of 78 photos land between 5 and 7, and the engine uses only four values: 5.5, 6.5, 7.0 and 7.5. That fits "most everyday fits 5–7" and "9 is rare". **It misses "8 is deliberate": nothing reaches 8,** not even the olive suit or the 70s vest-and-flares look the panel scored 8–8.5 (they get 7.5).
- **Why everything sits at 7: the readings can't see what makes a fit good.** Fit can't go above 7 (there's no shoulder-seam reading). Proportions is 7 on 50 of 73 photos (lengths, hems and the stack under a blazer can't be read). Proportions and Fit carry 55% of the weight, and both sit at 7 (or NA) on 53 of 78 photos (68%). With today's fields, an 8 needs strong scores in almost every part at once.
- **Your fits.** Your friends' chore coat goes 8.5 → 7.0 and the friend's blazer 8.5 → 7.0. Both match your own estimate (~7). The panel gave 7.5 and 5.5. Your hoodie + jeans + slides land at 6.5 (Shoes 4–4.5). Hoodie + sweats + slides: 5.5. Black tee + wide jeans: 7.0. Gingham overshirt: 6.5 (sleeves past the wrists).
- **A shoe misread costs less.** Your green work boots read as slides (e026de) cost 1.0 in v4.1 (8.5 → 7.5) and 0.5 here (7.0 → 6.5).
- **The second look changed no score** on its 50 photos: the peek is only −0.5 on Proportions, which is 0.15 on the total. It's worth adding for the card's reason line, not for the number.

---

## 1. What the prototype does
`score_parts(reading, occasion, styles=None, second_look=None)` returns each part's score with the checks that moved it, plus tips: real rules whose reading hasn't passed, with what they would cost. It also returns the NA parts, condition, the occasion status, the final score and the lowest part's line. It imports v4.1's helpers (formality, colors, style detection, prepare/normalize) instead of copying them.

**The rule I held to:** a check moves points only if the reading it uses passed a 3-run steadiness test in the grouping the check needs. Anything else is a tip.

| Part (weight) | Moves points today | Tips only (the reading failed or isn't live) |
|---|---|---|
| **Proportions 30** | A roomy top over skinny legs −1.5; a layer over skinny legs −0.5; **the second look's peek −0.5**. Rewards (blocked by a 1+ fault, by pooling, or by sweats): tucked or short top over a full leg +1, half tuck +0.5, a bomber/denim/leather jacket over a full leg +1 (unless the peek says the top hangs below it), a complete tailored line +0.5; capped at +2 | A top below the crotch (fired 2 of 192 runs, both wrong); a long loose layer over loose legs (layer length 63%); a heavy hem under a blazer (the stack isn't seen); a long untucked shirt over wide legs |
| **Fit 25** | Per piece, the worst piece plus half of the others: sleeves over the hands (blazer −2, shirt/overshirt −1.5, ribbed knit −0.5, ignored on tees); "a size big" (a roomy non-ribbed piece plus sleeves over the hands) −2; clear strain −2 (−1.5 on slim legs); pooling (chinos/trousers −2, jeans −1.5, sweats −0.5) | A full break on a slim leg (the 6-class hem is 64–68% steady) |
| **Color 15** | Faults: 3+ accents −2.5, 5+ colors −1, two brights −2 (−1 in streetwear), the dark-jacket near-match −1.5, patterns −0.75 to −1.5. When there's no fault: one bright standout +1, one quiet accent +0.5, shoes repeating the top's color +0.5 | Tonal with range, light-mid-dark and muddy (they need the lightness word); double denim (needs a measured wash) |
| **Shoes 15** | Slides out of the house 4.5 (2.5 under a blazer), −0.5 more when loose jeans drag on them (the second look's "rests on the shoe" decides when present); runners 6.0 (4.5 under a blazer). Otherwise, all as ramps: too casual, much too dressy, matches the clothes +0.5, the look's own shoe +0.5 (styles detected without the shoe). Chunky under a blazer −2; chunky under narrow legs −1.5 (runners −0.5); chunky carrying wide jeans in streetwear +0.5; a loud shoe against a loud piece −0.75, or the shoe as the one accent +0.5; worn −1 (work boots and suede −0.5). Type lost ("other") = NA | A dainty shoe under wide legs (needs `shoe_profile`) |
| **Cohesion 15** (shown as "Style") | Reads as a style +0.5; clearly that style top to toe (or a suit over a top) +0.5; one patterned standout +0.5; a piece from another world −1.5 (a blazer over loose or washed jeans; formality 2.5+ apart with no outer-layer bridge), −4 at 3.5+ apart; too many statements −0.5/−1 | The accessory "finished touch" (no reading) |
| **Condition** (after the average) | Wrinkled −0.4 (linen-likely −0.2), worn −0.4, stain −1.2, cap −1.6; footwear skipped; an untucked dress shirt under tailoring −0.6. In dim light: "couldn't check" | Fading and lint (the AI reads them as clean) |
| **Occasion** (after the average) | A deduction of up to −0.5 for a small gap; ceilings on a smooth curve (7.0 at a 0.75-level gap down to 3.5); loungewear 5.5 / 6.5 / 7.5 by signs of intent; 4.0 for athletic bottoms or slides at an interview or event; sneakers under a blazer at an interview 7.0; a big logo at an interview 6.5; overdressed up to −0.5 (a ramp) | — |

**Calls I made that the part reports left open, or where I departed from them (each is in a code comment):**
1. **No cliffs on the shoe's dressiness.** The "matches the clothes" credit is flat from 1.5 levels dressier to 0.75 more casual, then fades over the next 0.75 on each side. "Much dressier" and "too casual" are ramps too. Your boots read as work boot, chukka or Chelsea all sit inside the flat part, and a derby read keeps about half the credit. The remaining shoe wobble comes from the type flipping across kinds (boot vs retro runner vs "other"), not from a formality line.
2. **Worn shoes cost a flat −1.0 (work boots and suede −0.5), not shoes.md's cap at 6.0.** The worn read flipped on 5 of the 9 batch-1 photos where it fired. It also reads your suede boots' nap as wear, so the cap turned one shaky read into a 1.5–2 point drop.
3. **A heavy hem can't block the proportion rewards; only pooling (98% steady) does.** Heavy vs light is 83% steady and finds only 45% of heavy hems. The cost: a tucked top over stacked jeans can still earn the waist-break reward.
4. **One owner per fact, as the SPEC lists them.** Shoe weight against the leg is Shoes' only (proportions.md's R4/F7/F8 moved there). The color tie-in is Color's only. A bright standout is Color's and a patterned standout is Cohesion's (one garment, one credit). Accent and pattern counts use the clothes only; the shoe's color is Shoes'.
5. **Shoes out of the photo count as a real shoe in the loungewear ladder** (v4.1 counted them as missing). What isn't in the photo never costs points.
6. **The part values are averaged unrounded.** The card shows them rounded to the half, so the shown row can be 0.1 off the total's arithmetic.
7. **A lost shoe type ("other") makes Shoes NA**, as the SPEC proposed. In the app, "Boots, sneakers or slides?" is asked first. This needs a DECISIONS-LOG entry when built.

## 2. (a) Score spread
One reading per distinct photo (78): the app's own reading from the newest pull, else the corpus, else batch-1 run 0. Each reading is scored at its own occasion.

| Group | Engine | n | Median | ≤5.5 | 6–6.5 | 7–7.5 | 8+ | 9+ |
|---|---|---|---|---|---|---|---|---|
| All photos | v4.1 | 78 | 7.5 | 3% | 14% | 42% | **41%** | 4% |
| | parts | 78 | 7.0 | 6% | 18% | 76% | **0%** | 0% |
| The founder (profile pending) | v4.1 | 21 | 7.5 | 10% | 19% | 62% | 10% | 0 |
| | parts | 21 | 7.0 | 19% | 29% | 52% | 0 | 0 |
| Friends (profile unknown) | v4.1 | 4 | 8.5 | 0 | 0 | 0 | 100% | 0 |
| | parts | 4 | 7.0 | 0 | 0 | 100% | 0 | 0 |
| 703a8b, ebe23f (ask) | v4.1 / parts | 2 | 7.75 / 7.25 | | | 1 / 2 | 1 / 0 | |
| Web mirror (profile unknown) | v4.1 | 12 | 8.0 | 0 | 0 | 33% | 67% | 8% |
| | parts | 12 | 7.0 | 0 | 8% | 92% | 0 | 0 |
| Stock (profile unknown) | v4.1 | 39 | 7.5 | 0 | 18% | 38% | 44% | 5% |
| | parts | 39 | 7.0 | 3% | 18% | 79% | 0 | 0 |
| Batch-1 medians of 3 runs (close-ups) | v4.1 / parts | 50 | 7.5 / 7.0 | 4% / 12% | 22% / 14% | 40% / 74% | 34% / **0%** | 4% / 0 |

- **Per photo, parts minus v4.1:** −2.0 ×1, −1.5 ×13, −1.0 ×21, −0.5 ×18, 0 ×16, +0.5 ×9. The mean is −0.60.
- **Against the target:**
  - "Most everyday fits 5–7": yes. 68 of 78 photos land in 5–7 (v4.1: 29), and 24 of the 27 photos of you, your friends and the two unknowns.
  - "9 rare": yes, there are none.
  - **"8 deliberate": no, there are none.** The values used are 5.5 (5), 6.5 (14), 7.0 (49) and 7.5 (10).
- **Each part, one reading per photo:**

| Part | NA | At exactly 7 | Range |
|---|---|---|---|
| Proportions | 5 | 50 of 73 | 6.5–8 |
| Fit | 0 | 74 of 78 | 5.5–7 |
| Color | 0 | 66 of 78 | 5.5–8 |
| Shoes | 24 | 9 of 54 | 4–8.5, median 7.5 |
| Cohesion | 0 | 28 of 78 | 6–8, median 7.5 |

## 3. (b) Steadiness, 3 runs
The validation set is batch 1's control arm: the live prompt with close-ups, 50 photos × 3 runs, at Everyday with the test profile. The second look's run *i* is paired with scoring run *i*. The design set is zoom1 arm B (66 photos), the runs the checks were chosen on.

| | v4.1 | parts |
|---|---|---|
| Batch 1: all 3 within 0.5 of the median (batch 1's measure) | **47/49 (96%)** | **49/49 (100%)** |
| Batch 1: max − min ≤ 0.5 | 46/49 (94%) | 49/49 (100%) |
| Batch 1: exactly the same | 31/49 (63%) | 42/49 (86%) |
| Batch 1: mean / worst spread | 0.21 / 1.0 | 0.07 / 0.5 |
| Batch 1 without the second look | 96% / 63% exact | 100% / 86% exact (identical) |
| zoom1 B: within 0.5 / exact | 64/66 (97%) / 59% | 66/66 (100%) / 86% |

- **The bar was "not worse than 96%": passed.**
- **What still wobbles** (switching each check off in turn, exact agreement on batch 1, 42/49 with everything on):
  - "Reads as a style" (style detection flips): 46/49 with it off
  - the quiet accent (color family flips): 45/49
  - shoes matching the clothes: 44/49
  - the look's own shoe: 44/49
  - the condition step: 44/49
  - all of them off: 47/49

  Each moves the total by 0.075–0.4, so none breaks the 0.5 bar.
- **Each part, the same on all 3 runs:**

| Part | Same on all 3 runs | What flips it |
|---|---|---|
| Proportions | 98% | |
| Fit | 92% | sleeves over the hand on 5a9049 |
| Color | 88% | |
| Shoes | 78% | worn reads; type flips across kinds |
| Cohesion | 74% | style detection |

  The heavier parts are the steadiest, which is why the total holds.

## 4. (c) Against the judge pilot
59 photos, all with a reading here. The 8 that had none in the pilot now use zoom1 or batch-1 readings. Panel = the median of the 5 judges' weighted totals.

| | n | Mean diff | MAE | Within 0.5 | Off 1.5+ | r |
|---|---|---|---|---|---|---|
| **All** · v4.1 | 59 | +0.54 | 0.71 | 32 | 8 | 0.58 |
| **All** · parts | 59 | **−0.03** | **0.46** | **50** | **3** | **0.59** |
| Your and your friends' photos · v4.1 | 20 | +0.93 | 0.93 | 9 | 5 | 0.62 |
| Your and your friends' photos · parts | 20 | +0.40 | 0.55 | 14 | 2 | 0.56 |
| Stock · v4.1 | 33 | +0.38 | 0.68 | 18 | 3 | 0.56 |
| Stock · parts | 33 | −0.32 | 0.44 | 30 | 1 | 0.63 |
| Web mirror · v4.1 / parts | 6 | +0.17 / +0.08 | 0.17 / 0.25 | 5 / 6 | 0 / 0 | n too small |

**Part by part** (ours against the panel's median for the same part). **Caveat:** the panel's parts are a halo of its overall impression (fit tracks proportions at 0.93, cohesion tracks gut at 0.96), so this only checks direction:

| Part | n | Mean diff | Within 0.5 | r |
|---|---|---|---|---|
| Proportions | 55 | +0.25 | 42 | 0.38 |
| Fit | 59 | −0.10 | 43 | 0.11 |
| Color | 59 | −0.01 | 50 | −0.02 |
| Shoes | 42 | +0.08 | 32 | **0.82** |
| Cohesion | 59 | +0.53 | 37 | 0.53 |

Shoes is the one part that clearly tracks the panel. Fit and Color sit at 7 almost everywhere, so they can't correlate.

**Where it misses the panel by 1.5 (3 photos):**
- **P015, the friend's blazer:** 7.0 vs 5.5. The stack under the blazer isn't seen.
- **P010, stock s08:** 7.0 vs 8.5. A cropped sculpted jacket over flares isn't seen.
- **P025, d918c0:** 7.5 vs 6.0. Your fleece + flannel. The panel docked the slouching hem over the boots, which can't be read.

At the top, the panel's 8–8.5 photos (P001, P010, P021, P035) get 7.5, 7.0, 7.5 and 7.0.

## 5. (d) Every check from you, your friends and the two unknowns
Each check at its own occasion. "v4.1 → parts" is the total. The parts order is **Proportions · Fit · Color · Shoes · Style**. "Lowest" is the card's leading line ("none below 7" when no part dropped below 7).

| Photo | Who | Occ. | What's read | v4.1 → parts | Parts | Lowest part | Panel | Also |
|---|---|---|---|---|---|---|---|---|
| **d1967f** | friend (blazer) | class | suit jacket (judged as a blazer), tee, jeans, chukkas | 8.5 → **7.0** | 7 · 7 · 7 · 7.5 · 6 | Style 6: the tailored jacket and the loose or washed jeans come from different worlds | 5.5 | With the stack seen (label stand-in): 6.5 |
| **e438d4** | friend (chore coat) | class | chore coat, tee, jeans, low-profile sneakers | 8.5 → **7.0** | 7 · 7 · 7 · 7.5 · 7.5 | none below 7 | — | |
| **f4870b** | friend (chore coat) | class | same | 8.5 → **7.0** | 7 · 7 · 7 · 7.5 · 7.5 | none below 7 | 7.5 | |
| **fb0b17** | friend (chore coat) | class | same | 8.5 → **7.0** | 7 · 7 · 7 · 7.5 · 7.5 | none below 7 | 7.5 | |
| **8ad378** | founder | class | black tee, wide jeans, white leather sneakers | 7.5 → **7.0** | 7 · 7 · 7 · 7.5 · 7.5 | none below 7 | 7.5 | |
| **403ade** | founder | class | same outfit | 7.5 → **7.0** | 7 · 7 · 7 · 7.5 · 7.5 | none below 7 | 7.0 | |
| **f07193** | founder (gingham) | class | tee, overshirt, jeans, boots read "other" | 7.5 → **6.5** | 7 · 5.5 · 7 · NA · 7 | Fit 5.5: the overshirt's sleeves run past the wrists | 6.0 | True shoes (work boots): v4.1 8.0 → parts 7.0 |
| **5a9049** | founder (gingham) | everyday | oxford shirt, wide jeans, work boots | 7.5 → **7.0** | 7 · 7 · 7 · 7 · 7.5 | none below 7 | 6.0 | |
| 8bc29d | founder | class | striped overshirt, hoodie, wide jeans, boots "other" | 7.5 → **6.5** | 7 · 7 · 7 · NA · 7.5 | none below 7 (condition: wrinkled overshirt −0.4) | 6.5 | True shoes: v4.1 8.0 → parts 7.0 |
| d6559a | founder | class | hoodie, jeans, boots "other" | 7.0 → **7.0** | 7 · 7 · 7 · NA · 7 | none below 7 | 6.5 | True shoes: v4.1 7.5 → parts 7.0 |
| e026de | founder | class | overshirt, sweatshirt, jeans, **boots read as slides** | 7.5 → **6.5** | 7 · 7 · 7 · 4 · 7.5 | Shoes 4: slides read as staying in | 6.5 | True shoes: v4.1 8.5 → parts 7.0 |
| d918c0 | founder | class | fleece, flannel, wide jeans, boots read as chukkas | 7.5 → **7.5** | 7 · 7 · 7.5 · 8 · 7.5 | none below 7 | 6.0 | True shoes: v4.1 8.0 → parts 7.5 |
| 968016 | founder | class | teal sweatshirt, wide jeans, white sneakers | 7.5 → **7.5** | 7 · 7 · 7.5 · 8 · 7.5 | none below 7 | 7.0 | |
| 1f1997 | founder | class | hoodie, wide jeans, slides | 7.0 → **6.5** | 7 · 7 · 7 · 4 · 7.5 | Shoes 4: slides read as staying in (the jeans drag on them) | 5.5 | |
| d58b14 | founder | class | hoodie, jeans (his tap answer), slides | 7.0 → **6.5** | 7 · 7 · 7 · 4.5 · 7 | Shoes 4.5: slides read as staying in | 6.0 | |
| 0d39d6 | founder | everyday | hoodie, wide jeans, slides | 6.5 → **6.5** | 7 · 7 · 7 · 4 · 7.5 | Shoes 4: slides read as staying in | 5.5 | |
| b0f0c8 | founder | everyday | hoodie, relaxed jeans, work boots | 7.0 → **7.0** | 6.5 · 7 · 7 · 7 · 7.5 | Proportions 6.5: the top underneath shows below (look1's one false peek) | 6.5 | |
| 6b14db | founder | everyday | hoodie, sweats, slides | 5.5 → **5.5** | 6.5 · 7 · 7 · 4.5 · 7 | Shoes 4.5: slides read as staying in | 5.5 | Loungewear: held to 5.5 |
| 7de605 | founder | everyday | hoodie, tee, sweats, slides | 6.0 → **5.5** | 6.5 · 7 · 7 · 4.5 · 7 | Shoes 4.5 | 5.5 | Held to 5.5 |
| a765e8 | founder | everyday | hoodie, tee, sweats, slides | 6.0 → **5.5** | 6.5 · 7 · 7 · 4.5 · 7 | Shoes 4.5 | 5.5 | Held to 5.5 |
| 7f14a4 | founder | everyday | flannel, jeans, boots read as derby (batch-1 reading; the check failed) | 6.5 → **7.0** | 7 · 7 · 7 · 6 · 7.5 | Shoes 6: the shoes look worn | 6.0 | |
| oct7-ph1 | founder | everyday | hoodie, sweats (his jeans, misread), slides | 5.0 → **5.5** | 7 · 7 · 7 · 4.5 · 7 | Shoes 4.5 | — | Held to 5.5 |
| oct7-ph2 | founder | everyday | dress shirt, suit trousers | 7.5 → **7.0** | 7 · 7 · 7 · NA · 7.5 | none below 7 | — | |
| oct7-ph3 | founder | everyday | sport coat, dress shirt, suit trousers, loafers | 8.0 → **7.0** | 7.5 · 7 · 7 · 8 · 8 | none below 7 (condition: wrinkled sport coat −0.4) | — | |
| oct7-ph4 | founder | everyday | field jacket, tee, jeans | 8.0 → **7.0** | 7 · 7 · 7 · NA · 7.5 | none below 7 | — | |
| **703a8b** | unknown (ask) | class | navy polo, jeans (shoes cut off) | 7.5 → **7.5** | 8 · 7 · 7.5 · NA · 7 | none below 7 | — | Condition: couldn't check (dim) |
| **ebe23f** | unknown (ask) | class | quilted jacket (read "other"), jeans, white leather sneakers | 8.0 → **7.0** | 7 · 7 · 7 · 7.5 · 7 | none below 7 | — | |

The Oct 10 checks (new in the newest pull) are e438d4, 703a8b and ebe23f. The "true shoes" column uses your Oct 8 truth labels (`inputs/phone-oct8/truth.csv`).

## 6. (e) What still can't be seen, and how much it holds scores at 7
- **Most of the weight is blind to "good".** Fit (25%) can only find faults: no shoulder-seam reading, so 7 is its ceiling. It's at 7 on 74 of 78 photos. Proportions (30%) earns rewards only from a tuck, a short top, a short jacket by type or a tailored line, and it's at 7 on 50 of 73. Both sit at 7 or NA on 68% of photos, and those photos land at 7.0 41 times out of 53.
- **What a 8 would take.** From a 7 average, an 8 needs about +0.75: for example Proportions +1 (+0.30), Fit +1 (+0.25, needs the seam cues), Shoes +1 (+0.15) and Style +0.5 (+0.075). A 15%-weight part moves the total by only 0.075 per half point. So adding the **lightness word** (which passed alone in batch 1) gives 11 of 50 photos a color credit (tonal, or light-mid-dark) and **changes no score**.
- **The faults the panel names that the readings miss** (Claude's blind labels standing in for the failed length and hem readings, 50 batch-1 photos). Only 5 photos would move:
  - the friend's blazer, 7.0 → 6.5 (the stack under a blazer);
  - your gingham 7f14a4, 7.0 → 6.5 (the shirt hangs long over wide jeans);
  - three where a heavy hem would only block a reward, no change.

  The panel's other main complaints (fading, lint, a hem slouching over boots) have no reading or label at all.
- **Tips that fired** (real rules waiting on a reading), on one reading per photo: next-level shape 17, flat tonal 15, double denim 3, a long shirt over wide legs 2, a dainty shoe under wide legs 1.
- **Stretching the scale won't fix it.** A what-if, not built and not in the SPEC: multiplying every part's distance from 7 by 1.5 gives 8+ on 5% of photos (100% steady). By 2 gives 8+ on 9% (98% steady). That widens the scale without the engine seeing anything new, so the 8s it makes are the same weak signals made louder. **I recommend not doing this.** The 8s should come from readings that see good fit and shape.

## 7. What I recommend next
1. **Adopt the parts engine as the scoring core** (after the gold set sets the weights). It's steadier than v4.1 and closer to the panel, and it lands your fits where you put them yourself (the chore coat and the blazer at ~7).
2. **The readings are what unlock 8.** In order:
   - a shoulder-seam / designed-oversized cue that passes (Fit 8);
   - a working stack-and-hem cue for the lower close-up (the blazer, and your hem over the boots);
   - a top/layer length that passes (the long gingham shirt);
   - lightness in the scoring call (cheap, already passed alone; small on the total).
3. **Ship the second look for the card's reasons, not for points.** It changed no score here.
4. **Taste calls for you, all default-on in the prototype:**
   - slides out of the house at 4.5;
   - a lost shoe type = Shoes not scored (instead of v4's most generous answer);
   - the chore coat no longer earns a "Layered" credit just for being there (v5's "every point earned");
   - the card leading with a part's line even when every part is 7.
5. **Before the TypeScript port:**
   - log the design calls in §1 (DECISIONS-LOG);
   - fix the "Event" band question (SPEC);
   - re-run this test on the gold set, reported by age band and picked look (rule 7).

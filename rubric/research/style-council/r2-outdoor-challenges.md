# Round 2: Outdoor advocate, challenges and votes

*Oct 7, 2026. I re-ran the numbers with `rubric.py` v3.1, `r1-streetwear-proto.py` and `r1-vintage_sport_proto.py` (both in this folder), plus my own patched copies in the session scratchpad under `outdoor/`:*
- *`rubric_outdoor.py`: my round-1 proposals.*
- *`rubric_r2.py`: those proposals plus calibration's R4, R5 and R6, minus the S1 change I drop in section 2.*

*Scores are Everyday with no style picked, unless a line says otherwise.*

## 1. Challenges

**Streetwear**

**(a) The techwear path pulls sweats out of loungewear.**
- s21 (rain shell, Puma track pants read as sweatpants, running shoes) reads as streetwear in all 3 runs via "dark shell + utility bottom". The rain jacket then counts as the anchor that halves O4.
- Result: **7.5** in the streetwear proto, vs 7.0 in v3.1, **6.5** in the vintage sport proto, and calibration's estimate of **6.0**.
- A shell is weather gear. It doesn't signal intent.
- **Fix:**
  - The techwear path should need `cargos` or tech pants, never sweatpants or joggers.
  - Shell, rain jacket and puffer should not count as an O4 anchor.

**(b) The F6 exemption only ever excuses the tee that isn't oversized.**
- In v3.1, `F6_top_too_long` already skips volume ≥4; at that size `F8` handles it.
- So streetwear's F6 waiver only bites on a **regular-cut (volume 3)** tee hanging past the crotch, which is simply too long.
- Test: graphic tee (volume 3, below the crotch) + relaxed jeans + canvas sneakers.
  - v3.1: 6.0
  - streetwear proto: **7.5**
- Same effect on my messy anchor: pilled red fleece, long volume-3 graphic tee, wrinkled pooled cargos, dirty shoes.
  - streetwear proto: **6.0**
  - v3.1: 5.0
  - mine: 4.0
- **Fix:** excuse `F8` for oversized hoodies and tees, but keep `F6` when volume is ≤3.

**(c) The K4 trigger for street sneakers creates a gap between near-identical outfits.**
- On the 156 saved readings it moves **0** scores, so the inflation isn't measured. On synthetic outfits it opens a gap between two near-identical looks.
- Black shell + tee + relaxed cargos, streetwear proto:
  - with chunky sneakers: **8.5**
  - with trail shoes: **8.0**
- If chunky sneakers can "complement" a relaxed leg, trail shoes and work boots will claim the same. That puts +0.5 on every casual relaxed-leg outfit, in a rubric where 56% of saved readings already score 8+.
- **I'd rather nobody gets it** (my vote under C1).

**Smart casual: "detected styles should replace the default band"** (its "not the default lens" #3) contradicts C4. Replacing the band narrows it. With the gorpcore band replacing the default:
- shell + tee + slim dark jeans + runners drops **7.5 → 7.0**
- the Midtown vest + oxford + slim chinos + loafers drops **8.5 → 8.0**

Both are penalties for wearing a slim leg that the default band allows.

**Smart casual: `vest_gilet` at dressiness 2.5 and full K1.**
- I agree on the field: one value, which I'll call `vest`, for sleeveless insulated or fleece vests. Knit sweater vests stay `sweater`.
- But use workwear's own flip-safe principle: give the new value the dressiness of its likeliest confusion. A vest misreads as `puffer` or `fleece`, both 2.
- At 2.5, a vest/puffer flip moves O1 at Work. Set it to **2**, with K1 at 0.5 (C2).

**Workwear: the tie-break is too broad.**
- Workwear sends anything with a puffer or `performance_runner` to outdoor. My detector treats those two as weak: a winter puffer isn't a style.
- Example: puffer + flannel + jeans + work boots is still workwear (4 points in workwear's own count), and it doesn't read as outdoor.
- **Fix:** only `shell_jacket`, `rain_jacket`, `fleece`, `vest` or `trail_shoe` should push a tie toward outdoor.

**Vintage sport: the "real shoe" list.**
- I agree that `performance_runner` isn't a real shoe, and I agree with the sweats veto: s21 is athleisure, not outdoor. My detector already vetoes it.
- But the new `trail_shoe` must count as a real shoe. Otherwise a fleece over track pants with XT-6s is charged like slides.

**Minimal: M-K3 "clean palette" leaks to techwear.**
- As written, an all-black shell + black relaxed cargos (cuffed) + black trail shoes passes every gate if no logo is read:
  - tonal
  - a relaxed leg with a clean hem
  - an outer layer
- That gives +0.5 to the black techwear uniform. Under my K1 tier it scores 8.0 instead of 7.5.
- **Fix:** require a minimal home piece, and exclude technical layers and cargos.

**Calibration: R8 should name fleece and vest too.** "Overshirt, flannel or camp shirt counts as a layer whichever category" has the same hole as fleece. In v3.1, the same fleece pullover scores 7.0 filed as a top and 8.0 filed as outerwear.

## 2. Concessions

- **I drop my S1 exemption** for joggers and tech pants with cinched hems.
  - Vintage sport keeps S1 on slim joggers.
  - It was my only change that moved saved scores *up* (s06 7.0 → 7.5), against calibration's 6.0 estimate.
  - New numbers: shell + tee + tapered tech pants + trail shoes **7.5 → 7.0**. My other anchors are unchanged.
- **I accept calibration's R4 (one garment, one credit), R5 and R6.** Combined with my K1 tier, my anchors stay 4.0 / 5.0 / 6.5 / 7.5 / 8.5 / 9.5 (the 9.5 is the mix with suede chukkas; the trail-shoe version stays at 9.0).
- **I accept calibration's s21 verdict.** It is a gym-run look. Vintage's ladder plus my 0.5 K1 gives raw 6.3, which displays as **6.5**. That's close enough to 6.0 that I won't add a rule.
- **I accept vintage sport's prompt line** "an elastic ankle cuff is cuffed, not pooling". It matches the saved data: s06's joggers read `cropped`/`cuffed` in all 3 runs.

## 3. Votes

| # | Vote | Why |
|---|---|---|
| C1 | **For** one credit per garment. **Amend** the shoe expansions: work boot to 2.5 yes (a leather boot is honestly dressier than a canvas sneaker; it moves only s20); the street-sneaker K4 trigger **against** | A credit for "wearing your style's home shoe" has to go to every style or none, and "all" inflates. Lugged hiking boots must be read as `trail_shoe`, not `work_boot`, so they don't pick up K4 by accident |
| C2 | **For** (mine), together with R8 extended to fleece and vest | Removes the 1-point category flip and the "any jacket = Sharp" rounding: the 2025 shell + cargos + Salomons uniform lands at 7.5, not 8.0 |
| C3 | **For** vintage's two-signal ladder; **against** streetwear's anchor (it lets a rain shell excuse sweats, s21 → 7.5); **for** "a pick alone waives nothing" | Amend: `trail_shoe` counts as a real shoe; shell, rain jacket and puffer are not a "dressed upper" |
| C4 | **For** | Tested above: replacing the band costs 0.5 on slim legs |
| C5 | **For** | Outdoor's allowances are about proportions and a tip, and those stay. O3 at work already applies to outdoor in my round 1 |
| C6 | **For** both | Outdoor has no stake. Workwear showed the flag flips (m10 15/42, s19), and black-jeans-as-dark moves no Everyday score |
| C7 | **For**, with these labels | **Shell + cargos + trail shoes → outdoor** (a trail shoe or a technical outermost layer decides). All-dark shell + cargos + chunky or basketball sneakers → streetwear/techwear. Sweats never enter either. Rugby: prep with chinos or loafers, vintage with jeans or a retro shoe. Chore coat over a hoodie: label by the outermost layer (workwear); both styles score it the same. Mid-wash never counts as minimal: for |
| C8 | **For R1–R6; amend the target spread** | My net check below: the credit fixes take 8+ from 56% to 44%, not 20–25%. Either the stock photos are skewed by professional shoots, or the 7.0 baseline plus K1 is still generous. Decide on the gold set, not by adding more penalties now |
| C9 | **Amend** | Slides cost at most once: `S3` −0.3 **or** the slide-specific `F4` −0.4, not both. Gate it on the gold set. Note for spring: `slides_sandals` lumps Tevas in with pool slides, and technical sandals are an outdoor staple. Not a November problem |
| C10 | **Against for now** (Minimal itself says after the gold set) | Plus the techwear leak above |
| C11 | **For one fact, one penalty** (vintage's "athletic bottoms count as 2 in O1 at Everyday", plus R1–R3). The −2.0 cap is redundant | A cap hides which rule is wrong. Removing the double charge at the source is clearer on the card |
| C12 | **6.5** | Read correctly (after the tap): jeans with a stacked or resting hem, streetwear detected, so no P1 leg cost (7.0). No credits. The slides cost −0.3 once (C9), giving raw 6.7 → **6.5**. v3.1 gives 6.0 (pooling) / 6.5 (full break); the streetwear proto gives 6.5. Not 3, not 9 |

## 4. Net inflation check

I measured my proposals plus calibration's R4, R5 and R6 on the first reading of each photo (52, no style):
- **0 scores go up, 17 go down** (each by 0.5; m10 by 1.0).
- **8+: 29 → 23 of 52** (56% → 44%).
- **9+: 3 → 1.**
- **Mirror selfies at 8+: 9 → 6 of 12.**
- What moved: p04 ×2, p05, p06, s01, s08, s15, s17, s19, s22, s26, m03, m05, m07, m09, m10, m12.
- My own proposals alone now move only s08 (8.5 → 8.0, a white suit misread as a puffer).

Proposals I support but didn't re-run, using their authors' counts:
- **Vintage's ladder:** 18 changes, 7 up and 11 down; the ups are p02's sweatsuit and the founder's misread.
- **R1–R3:** only the founder's photo moves, 3.5 → 5.0.
- **Work boot at 2.5:** s20 only, +0.5.

**Net: clearly down.** Inflation isn't a risk from this package. The risk runs the other way: even with all of it, 8+ stays near double calibration's target.

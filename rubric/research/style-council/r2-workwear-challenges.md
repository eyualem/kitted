# Round 2: Workwear challenges

*Oct 7, 2026. I read all 8 round-1 files. Numbers were re-run with `rubric.py` v3.1, the streetwear and vintage-sport prototypes in this folder, and my own scripts in `scratchpad/workwear/`. Unless a line says otherwise, every score is for an everyday outfit with no style picked.*

**The supported package** means the changes I vote "for" below, applied together:
- my fixes A–D from round 1
- calibration's R3–R6
- streetwear's hem-onto-slides rule

## 1. Challenges

**Outdoor: K1 tiering (technical layers earn 0.5) creates a new flip boundary right through workwear's outerwear.**
- On the Oct 7 phone check, the brown quilted barn jacket was read as `field_jacket` (0.75 under tiering). Quilting is also the main visual cue for `puffer` (0.5 under tiering).
- An olive cotton M-65 and an olive nylon shell are a natural look-alike pair too. Gemini is weakest on fabric: 52%, "shape >> pattern >> fabric" ([arXiv 2601.15711, Jan 2026](https://arxiv.org/html/2601.15711)).
- Tiering by garment type therefore turns a fabric guess into a 0.25 swing, which can flip the half-point rounding. Outdoor's own goal (K1 is too cheap) is better met by one credit per garment (R4).
- **Re-run:** with R4, the phone field-jacket check already drops 8.0 → 7.5, with no tier needed.

**Outdoor: "Workwear will face the same question about boots."** It did, and the two cases differ.
- Trail shoes are athletic. Work boots are leather heritage shoes, and sources pair them with chinos and in casual offices.
- The current table already puts the Chelsea boot at 3.5 and the suede chukka at 3. A work boot at 2 is ranked with canvas sneakers.
- Fix A also removes a cliff calibration found: a p03 suit reading the Chelsea boot as a work boot drops 8.0 → 5.5 through S2. At 2.5, the gap to the suit is 2.5 levels, so S2 doesn't fire. With R9's ramp, it costs −0.9 instead.
- And under R4, fix A no longer inflates (concessions, below).

**Streetwear: the 9.5 anchor (olive chore coat + red hoodie + wide dark jeans + chunky sneakers) only works by double-dipping.**
- The chore coat earns both K1 and K2. Under R4 it earns one of them, so the outfit is 8.75, which displays as 9.0.
- I agree on the label: my detector also gives it to streetwear (coat +2, jeans +1, chunky −1 = 2). But its ceiling should be 9.0, like every one-hero-piece outfit.

**Streetwear and vintage sport: work boots should not make a fleece sweatsuit intentional.**
- p02-after (beige hoodie + beige sweatpants + brown work boots):
  - v3.1: 5.5 in all 3 runs
  - **6.5 in both prototypes**
- In streetwear's version, the boot is the anchor that halves O4. In vintage sport's, the matched fleece set counts as a "dressed upper" and the boot as a "real shoe," which together remove O4 completely.
- Streetwear's own one-sentence line says that "fleece-and-jersey pieces" are loungewear. A matched hoodie-and-sweats set is exactly that.
- Work boots under fleece sweats are not a workwear home combination either: the detector vetoes the sweats.
- **Ask:**
  - A matched fleece set is not a dressed upper.
  - A work boot counts as a real shoe only when the upper half is non-fleece.
  - With that, p02 lands at about 6.0, which matches calibration's 5.0 for the hoodie + sweats + slides version plus one real shoe.

**Classic prep: "one garment counts as at most 1 focal point" moves s11 above every estimate.**
- s11 is a red plaid flannel + mid-wash ripped jeans + low black sneakers, and my detector reads it as workwear in all 3 runs.
- Prep reports it going 7.5 → 8.0. Calibration lists s11 as fine at 7.5. My honest score is 7.0–7.5: a lumberjack-flannel-and-jeans basic.
- The fix is reasonable for rugby shirts. It should not be the reason a flannel-and-jeans outfit reaches "Sharp." Net it against R4/R5 before adopting it.

**Classic prep and smart casual: two separate wide-trouser allowances both lift m02 (8.5 → 9.0).** Claude's blind estimate for m02 is 8.5, so this is +0.5 above the estimate, from two members proposing the same allowance.
- **Ask:** one shared rule (wide `trousers` + leather shoes → no P1), counted once.
- It has to pass the net-inflation check, which it currently fails on m02.

**Minimal: "denim wash reads well, and `denim_dark` still counts."**
- At the dark end, the wash reading doesn't hold:
  - `denim_dark` appears in **0** of the 156 locked v3 readings.
  - m07's raw indigo reads `black` in 30/30 runs.
  - s10's jacket splits across black, charcoal and denim_dark (18/12/4 readings).
- Minimal's palette rule still works, because black passes it. But any minimal or smart-casual rule that keys on `denim_dark` specifically is dead code until the prompt line "raw or rigid indigo is `denim_dark`" is added and re-tested.

**Smart casual: "jeans in `denim_dark`/`black`/`charcoal`, ignore `distressed_by_design`."** This is fine for a label. It is **not** fine for points.
- If charcoal jeans get dressiness 2.5 regardless of the distressed flag, m10's work-occasion score widens from 7.0–7.5 to 7.0–8.5.
- That's because m10's distressed flag flips in 15 of 42 runs.
- So: black only, and only while the distressed flag exists (or use C6's new field).

## 2. Concessions
- **Calibration's R4 (one credit per garment) is right, and it changes my numbers.** It is also what makes my work-boot fix (A) safe. With the supported package:

| Anchor | Before | With package |
|---|---|---|
| ~4.0, 5.5, 6.5, 7.5 anchors | unchanged | unchanged (4.0 / 5.5 / 6.5 / 7.5) |
| ~8.5: chore coat + tee + raw denim + canvas sneakers | 8.5 | **8.0** |
| Same outfit with brown work boots | 9.0 | **8.5** (R4 cancels fix A's inflation) |
| ~9.5 anchor | 9.5 | **9.0**, which is the score I said was honest |
| Chore coat + skinny jeans + chunky sneakers | 7.0 | **6.5**, my honest score |
| Smart-casual twin (overshirt + tee + chinos + leather sneakers) | 9.0 | 9.0 (three different garments) |

  - **New ceiling:** workwear tops out at 9.0 unless the outfit includes a third elevated piece (chinos, an oxford or denim shirt, or suede chukkas). I accept that, as outdoor accepts 9.0 for full kit.
- **Smart casual's point that K4's 2.5 floor hard-codes its own taste** is the cleanest statement of why fix A is a correction, not a favor. Accepted as my main argument.
- **Minimal's `denim_wear` and my `wear_look` are the same field.** I adopt minimal's name.
- **Streetwear's "stack needs a shoe" (−0.4 when the hem lands on slides)** is a fit fact, not a style rule. I accept it as the slides answer.

## 3. Votes
| # | Vote | Why |
|---|---|---|
| C1 | **For** | Expansions of the shoe credit (work boot at 2.5, the street-sneaker trigger) ship only together with R4; without R4, each one adds +0.5 to the uniform looks |
| C2 | **Against** | It makes fabric-driven type flips (field jacket ↔ shell ↔ puffer) cost 0.25. R4 already fixes "one jacket = Sharp" |
| C3 | **Amend** | Picks alone waive nothing (for). Use vintage sport's two-signal ladder, but a matched fleece set isn't a dressed upper, and boots under fleece aren't a signal |
| C4 | **For** | Without it, detecting a style can *add* P1 hits; both outdoor and I measured this |
| C5 | **For** | Workwear asks for no exemptions at work. A chore coat over chinos passes as it is |
| C6 | **For, amended** | One field, `denim_wear`, plus the prompt line "raw indigo → `denim_dark`". Only black jeans count as dark when undistressed, never charcoal (m10's flip) |
| C7 | **For** | Chore coat over a hoodie → streetwear label; the score is identical either way because allowances combine. Rugby: prep with chinos/loafers, vintage sport with jeans/sneakers. Shell + cargos + trail shoes → outdoor. Mid-wash denim never counts as minimal |
| C8 | **For R1–R6 and the target spread** | Also R7–R9. R5 keeps the medium-plaid flannel as K3, which is workwear's main point of interest |
| C9 | **Amend** | No standalone slides penalty. Only the −0.4 when the hem lands on slides |
| C10 | **Against for now** | Earth-tone tonal workwear (olive, khaki, brown) would claim the same credit next. Revisit with the gold set |
| C11 | **Against the cap, for "one fact, one penalty"** | Vintage sport's change (athletic bottoms count as 2 in O1 at everyday) plus R1/R3 cover it without a special cap |
| C12 | **6.5** | Read as jeans (the tap answers it). Streetwear detection widens the band, so P1 = 0. The hem on slides −0.4 (6.6). No credits. Not 7.0: slides with a dragging hem is the one fault a friend would point out |

## 4. Net inflation check
I applied the whole supported package to all 156 saved readings plus the 4 phone checks: fixes A–D, R3–R6, everyday, no styles. R1, R2 and the stacked hem don't change any of these numbers.
- **4 readings move up:** the founder's misread (3.5 → 5.0) and s20 in 3 runs (+0.5, from the work-boot fix).
- **51 move down**, all by 0.5–1.0. They are mostly double credits and pinstripe interest: m03, m05, m07, m09, m10, m12, p04, p05, p06, s01, s15, s17, s19, s22, s26, and phone checks 2–4.
- **104 don't move.**

| | v3.1 today | With the package |
|---|---|---|
| Readings at 8+ | 53% | **39%** |
| Readings at 9+ | 6% | **3%** |

Still above calibration's 20–25% target at 8+, so there is room to say no to new allowances. Of the other members' proposals, the two wide-trouser allowances, prep's s11 change and the p02 sweatsuit rise all push the other way.

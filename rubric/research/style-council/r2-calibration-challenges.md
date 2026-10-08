# Round 2: Calibration challenges, and the combined rubric

*Calibration member, Oct 7, 2026. Every number here comes from **`r2-calibration-combined.py`** (this folder). It is one patched copy of `rubric.py` v3.1 with 31 switches, one per round-1 proposal, and it reuses the streetwear, vintage-sport and workwear detectors from their prototypes.*

- **Settings:** first run per photo, Everyday, no styles picked.
- **Parity check:** with every switch off, all 56 saved readings match v3.1 exactly.
- **What it's tested on:**
  - the 40 stock photos, 12 mirror photos and 4 phone checks (all saved readings);
  - **19 advocate anchors** (synthetic outfits from the round-1 files, scored against each advocate's own "honest" target).
- **Why the anchors matter:** the saved set has no streetwear, vintage-sport or outdoor outfits that need allowances, so the anchors are the only test of those proposals.

## 0. The combined rubric: what survives and what it does

**"Package" = every proposal I vote for below.** That means all 31 switches except: C9 slides (off), C10 "clean palette" (off), and vintage sport's "a matched set counts as a dressed upper" (off; see challenge 1).

| | v3.1 | Package |
|---|---|---|
| Share at 8+ | 57% | **45%** |
| Share at 9+ | 7% (4) | **4% (2: s07 olive suit, m02)** |
| Mean score | 7.71 | 7.56 |
| vs my estimates (error / bias / photos off by 1+) | 0.52 / +0.36 / 14 | **0.39 / +0.21 / 8** |
| vs Claude's mirror estimates (error / bias) | 0.75 / +0.67 | **0.50 / +0.33** |
| vs advocate anchors (error / bias) | 0.51 / **−0.25** | **0.20 / +0.09** |
| Lowest score | 3.5 | 5.0 |
| Run-to-run consistency | 51/52 | 51/52 |

**Net movement on saved readings:** 6 up, 23 down.
- **Up:**
  - p02 6.0→6.5 and p02-after 5.5→6.5 (sweatsuits)
  - s11 7.5→8.0
  - s20 7.0→7.5
  - m02 8.5→9.0
  - phone1 3.5→5.0
- **Down:** almost all from one-credit-per-garment, small-pattern K3 and partial scaling (m10 9.0→8.0, m12 9.0→8.0, phone3 9.0→8.5).
- **The anchors flip from under- to over-scored:** v3.1 under-scores them by 0.25 (streetwear by up to 1.5); the package lands at +0.09. Style detection fixes real under-scoring without pushing the saved set up.

**Where the inflation comes from.** Each proposal switched on alone over v3.1:

| Rank | Proposal | Effect on saved readings | Effect on anchors |
|---|---|---|---|
| 1 | Band union (detected style widens the band) | +1 | **+0.24 mean, 6 up** |
| 2 | Streetwear fit allowances | 3 up | +0.13 |
| 3 | Smart casual's wide-trouser allowance (SC-A1) | m02 | +0.13 |
| 4 | Minimal allowances | — | +0.13 |
| 5 | Vintage-sport loungewear ladder | **2 up, 4 down** | +0.11 |
| 6 | Athletic bottoms count as dressiness 2 in "too casual" | +0.03 | +0.08 |
| 7 | Halved pooling on athletic bottoms | +0.02 | +0.11 |
| 8 | Prep allowances | m02 | +0.11 |
| 9 | Work boot at 2.5 | s20 | +0.05 |
| 10 | Street-sneaker K4 trigger | — | +0.05 |

- Most of the inflation lands where today's rubric under-scores (anchors), which is intended.
- **The two that inflate real photos past honest:**
  - **the matched-set path:** p02 +1.0, p02-after +1.5, the hoodie + sweats + slides anchor 5.0→6.0;
  - **one focal point per garment:** s11 → 8.0; my estimate is 7.0.
- **Deflators:** small-pattern K3 (−0.10 mean, 11 down), one credit per garment (−0.09, 8 down), and no partial scale-up and the O1 ramp (−0.03 each).

## 1. Challenges

**1. Vintage sport: a matched sweatsuit is not a "dressed upper."**
- **The claim:** a hoodie in the same color as the sweatpants earns intent signal 1, so a sweatsuit with sneakers pays 0 for loungewear.
- **Re-run, combined with "athletic bottoms count as 2":**

  | Outfit | v3.1 | With the claim | My estimate | Streetwear's estimate |
  |---|---|---|---|---|
  | p02 sweatsuit + chunky sneakers | 6.0 | **7.0** | 6.0 | 6.5 |
  | p02-after, same set + boots, pooled | 5.5 | **7.0** | 5.5 | — |
  | hoodie + grey sweats + slides | 5.0 | **6.0** | 5.0 | — |

- **Without the matched-set path:** 6.5 / 6.5 / 5.5, with the lowest error of any loungewear variant (0.39).
- Matching is coordination, not dressing. Keep the ladder and drop this path.
- Also, your "it's not inflation" check used the 50/50 test mix. With no styles picked, the ladder moves 2 up and 4 down, and the sweatsuits go up.

**2. Vintage sport: the ladder doubles a known flip.** m04's bottom flips between shorts and athletic shorts across runs. In v3.1 that cost 0.5 (6.5/7.0/6.5). Under the ladder (0 signals = −1.2) it costs 1.0 (**6.0/7.0/6.0**). Amend: cap gym shorts at −0.6 unless a jersey makes it a kit. Or add the shorts/athletic-shorts pair to the quick-tap list (it's already on mine).

**3. Streetwear: the stacking exemption must not cover sweats.**
- Your F4 list includes sweatpants and joggers.
- Detection catches p02-after (pooled sweats + boots) as streetwear and charges 0 for the pooling.
- Vintage sport's −0.4 for elastic athletic bottoms is the better rule. Let athletic bottoms take that, and keep the full streetwear exemption for jeans and cargos only.

**4. Streetwear: "done badly" still scores 6.0** (target 5.5).
- The case: a size-5 hoodie, sleeves over the hands, slim jeans, chunky sneakers.
- Detection blocks only *skinny* legs, so slim legs pick up the streetwear band and lose F6/F8. Under the per-garment cap that's 6.0.
- Amend: the F6/F8 exemption needs a relaxed or wide leg, the "volume on purpose" your own one-liner promises.

**5. Classic prep: one focal point per garment over-pays loud single pieces.**
- s11 (bright red plaid flannel + ripped light jeans + cap) goes 7.5→**8.0**.
- In v3.1 that shirt counts 2 focal points: −0.3 and no K3. Under your rule it counts 1: no penalty and +0.5 K3, a 0.8 swing.
- A bright *and* large-pattern piece is louder than either alone.
- Amend: count it 1.5. It still earns K3, but it uses up a "subtle" user's whole allowance.

**6. Prep and smart casual: the wide-trouser allowance plus x.75 rounding lands m02 at 9.0.**
- Claude's estimate and mine are both 8.5. Your warnings were right.
- The allowance is fine. The rounding isn't: 8.75 shows as 9.0 "Dialed in".
- **The same thing happens in 3 other places:**
  - prep's sweater over an oxford: 9.0, target 8.5
  - workwear's 9.5 anchor
  - smart casual's grey quarter-zip
- **I tested a gate:** "9+ only if the raw score is ≥ 9.0."
  - It removes **every** 9+ in both sets (s07 olive suit included), so 9+ goes to 0%. Too strong against the 5% target.
  - Under one credit per garment, raw 9.0 needs all four credits on four garments, which almost nothing earns.
- **Recommendation for the mediator:** keep half-up rounding and accept about 4% at 9+. Turn the gate on only if the gold set shows 9s are too common.

**7. Workwear: "work boot at 2.5" is fine; black jeans as dark denim is too.** They move only s20 (7.0→7.5; my estimate 7.0), the tee + mid jeans + boots anchor (7.0→7.5, target 7.5), and nothing at Everyday for black jeans. **Low risk.**

**8. Minimal: no challenge on rules.** Detection fired on p06, m03 and the anchors with no false positives. The "clean palette" credit fires 0 times on saved readings. Your own "gold set first" is right.

**9. Outdoor: K1 at 0.5 for technical layers is correct and barely moves anything.**
- s21 (rain shell + track pants + runners) is now detected as streetwear's techwear path, not outdoor or athleisure.
- It lands at 6.5 (my estimate 6.0), because the ladder charges −1.2.
- The tie-break works in effect. Note that streetwear's tech path should not waive the ladder.

## 2. Concessions
- **The founder's photo read as jeans should be 6.5, not my 6.0.**
  - Smart casual, minimal and streetwear all landed at 6.5.
  - The detected streetwear band removes the P1 leg hit (−0.45), which I wrongly kept.
  - The package gives 6.5 with a pooled hem and 7.0 with a full break.
- **"Detected style can only widen" makes my per-garment cap almost redundant** for styled outfits. The cap still matters for undetected looks and misreads (phone1 misread: 5.0 with the floor).
- **Smart casual is right that K2 is cheap.** One credit per garment doesn't fix polo + chinos + white leather sneakers (still 8.0; prep and smart casual both say 7.5): K2 comes from the polo and K4 from the shoes. A narrow fix waits for the gold set: K2 needs a top or outer layer at 3+, or two pieces at 3+.
- **R6 (no partial scale-up) is my weakest guardrail.** It lowers p04 and m09 by 0.5, and smart casual's p06 point (hidden chinos lose K2) stands. Keep it, but as the first to drop if the panel disagrees.

## 3. Votes

| # | Vote | Why |
|---|---|---|
| C1 one garment, one credit | **For** | The biggest single fix to over-scoring (−0.09 mean, 8 readings down, error −0.09). The work-boot and street-sneaker K4 expansions are safe under it: they sit on the shoe, which can only earn K4 |
| C2 K1 tiering, technical 0.5 | **For** | Moves 1 saved reading and 1 anchor, both toward honest |
| C3 loungewear | **Amend** | Vintage sport's ladder for everyone; his pick waives nothing. **No matched-set path.** Gym shorts capped at −0.6 outside a kit (challenge 2). It beats streetwear's anchor rule on error (0.39 vs 0.41) |
| C4 detection only widens | **For** | Biggest positive effect on the anchors (+0.24) and none of it on the saved set. Exactly the under-scoring it targets |
| C5 occasion beats style at work and interviews | **For** | Not tested (Everyday only). Loungewear and logo waivers off there; proportion allowances stay |
| C6 `wear_look` / `denim_wear` field | **For, collect quietly** | Narrowing the distressed flag moves 0 scores today; black jeans count as dark, but not charcoal (m10 flips) |
| C7 tie-breaks | **For** | All are label-only once allowances are unioned. Mid-wash denim never counts as minimal: for |
| C8 R1–R6 and the target spread | **For, with R6 the first to drop** | Package: 45% at 8+, 4% at 9+. Still above my 20–25% target at 8+, but the stock set is pro photography. Re-check on the founder's 20 real shots |
| C9 slides −0.3 / −0.4 | **Against points now** | No effect on the founder's photo once the cap applies (6.5 either way). The sources lean the other way. Tip only until the panel decides |
| C10 minimal "clean palette" | **Against for now** | Fires 0 times; turn on only if the gold set ranks tonal layered outfits at 9+ |
| C11 loungewear cap −2.0 | **Against** | Redundant once the ladder + athletic-as-2 make loungewear one penalty and the per-garment cap and floor exist. The founder's misread lands at 5.0 without it |
| C12 the founder's outfit | **6.5** | Streetwear detected: no leg-band hit, pooling over slides −0.4, no credits. 7.0 if the hem reads as full break or stacked. The tap ("Jeans or sweatpants?") is what gets him from 5.0 to 6.5 |

## 4. Net inflation check
- **With every proposal I support:** 6 saved readings up, 23 down, 27 unchanged.
  - Mean 7.71 → 7.56; 8+ 57% → 45%; mirror bias vs Claude +0.67 → +0.33.
  - Anchors: 10 up, 4 down, 5 unchanged. The ups are streetwear, minimal, workwear and vintage looks that v3.1 under-scored.
- **Rejected proposals, if they were also adopted:**
  - **Matched set path:** p02/p02-after +0.5 each, error +0.02.
  - **Slides rule:** 0 change.
  - **Clean-palette credit:** 0 change on saved readings.
- **Remaining over-scores I can't fix with rules,** because the schema can't see the problem:
  - m06's size sticker
  - s14's dirty chunky sneakers
  - s05's hoodie at "Sharp"
  - s08's editorial puffer

  The gold set and truth labels have to settle those.

*Files: `r2-calibration-combined.py` (this folder; `score(ext, occasion, F={**ALL, 'matched_set': False})` is the package). Scripts that produced these tables: scratchpad `calibration/r2/`.*

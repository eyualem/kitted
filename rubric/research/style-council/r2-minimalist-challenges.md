# Round 2: Minimalist challenges

*Oct 7, 2026. I read every r1 file and both prototypes. Every number below was re-run with `rubric.py` v3.1, the streetwear and vintage-sport prototypes, or my own patched copy. Scratch scripts are in `scratchpad/minimalist/` (`r2_claims.py`, `r2_package.py`). Occasion is Everyday and no style is picked unless noted.*

## 1. Challenges

**Vintage sport: a matched sweatsuit should not count as a "dressed upper."**
- **The claim:** your intent-signal ladder treats a hoodie or sweatshirt in the same color as the athletic bottoms as signal 1.
- **The problem:** sweatsuits are *sold* matched, so the match shows no intent. Your proto rewards it:

| Outfit | v3.1 | Your proto | Calibration's target |
|---|---|---|---|
| Grey hoodie + grey sweatpants + slides | 5.0 | **6.5** | 5.0 |
| Grey hoodie + grey sweatpants + chunky sneakers | 6.5 | **7.0** | — |
| Black hoodie + grey sweatpants + chunky sneakers | 6.5 | 6.5 | — |

- So the matched set scores *higher* than the unmatched one.
- I see tonal as a real minimal signal, which is exactly why I veto it when the bottom is fleece. Matching fleece is a uniform for the couch.
- **Fix:** drop the matched-set clause, and keep everything else in your ladder. The slides case then lands at about 6.0.

**Streetwear: the alternative K4 trigger should exclude `canvas_sneaker`.**
- **The claim:** chunky, basketball or canvas sneakers under relaxed or wide jeans earn "shoes that complement," for everyone.
- **The problem:** a plain white tee + black wide jeans + black canvas sneakers goes 6.5 (v3.1) → 7.5 in your proto. The band fix alone would give 7.0. A canvas sneaker is the most default shoe there is; it is no more "considered" than the tee.
- **Chunky and basketball sneakers:** those I accept. Shoe weight matched to the leg is a real done-well signal.
- **It costs nothing to fix:** the trigger moves 0 saved readings (there is no relaxed/wide + chunky outfit in the set), so dropping canvas changes nothing measured. It only removes the inflation on the most common real-life outfit.
- **Your 9.5 anchor double-dips.** Chore coat + red hoodie + dark wide jeans + chunky sneakers gets K1 *and* K2 from the chore coat. Under one garment, one credit (C1) it is **9.0**. That's the same ceiling workwear and vintage sport accepted for their own looks.
- **s21 also rises in your proto** (rain jacket + track pants + runners, 7.0 → 7.5) through the techwear path. Calibration puts it at 6.0. Techwear needs cargos, not sweats, to count as an anchor.

**Workwear: fix B (undistressed black jeans = 2.5) must ship with C1, or it inflates the minimal uniform.**
- With fix B alone, black tee + black jeans + white leather sneakers goes **7.5 → 8.0 "Sharp."** The sneaker earns K2 *and* now K4: shoe at 3 vs. an outfit average of 2.25 is a gap of exactly 0.75.
- With C1, it stays at 7.5, which is right.
- **Bundle them, or don't ship B.**

**Smart casual and classic prep: the wide-trouser allowance exists three times. Make it one general rule, and include chinos.**
- SC-A1 (smart casual), prep's P1 exemption and my Minimal band all excuse wide pressed trousers. Each one adds conditions:
  - smart casual: smart shoes only, no chinos
  - prep: leather shoes only
- The look that falls through all three gaps is city boy: boxy light-blue oxford (vol 4) + **wide khaki chinos** + black canvas sneakers.
  - v3.1: **6.5**
  - streetwear and smart casual don't catch it (trousers veto streetwear; canvas isn't a smart shoe)
  - only Minimal detection takes it to 7.5
- **On excluding chinos:** smart casual cites "a chino that is too wide reads as casual" (Menswear Online, year not shown). The 2026 source says the opposite: "Wide-leg chinos, generously cut jeans and pleated linen trousers continue to gain ground" ([Opumo, Summer 2026](https://www.opumo.com/magazine/10-summer-2026-menswear-trends-worth-embracing/)).
- **Proposed general rule:** `trousers`, `chinos` or `drawstring_trousers` with a wide/barrel leg and a clean hem never trip `P1_leg` for anyone, with any non-athletic shoe.
- **Tie-break proposal for smart casual:** a collared top on a slim or straight leg → smart casual. A collared top that is boxy (vol 4) or on a wide leg → Minimal. You give Minimal only "no collared top," but an oxford is city boy's signature piece ([Yokogao](https://www.yokogaomag.com/editorial/the-rise-of-the-city-boy)).

**Calibration: don't call white tee + mid-wash jeans + canvas sneakers "minimal" in the band table.** It is basics. Labeling it minimal on the card is the exact confusion my detector exists to prevent (mid-wash denim never counts). The score (7.0) is fine.

## 2. Concessions

- **C1 / R4 (one credit per garment) is right, and it lowers my anchors.**
  - Knit + black jeans + white leather sneakers: 9.0 → **8.5**. I said 8.0; I accept 8.5.
  - My 9.5 anchor (black overcoat + charcoal knit + charcoal wide trousers + loafers) is **9.0** without the clean-palette credit.
- **R5 (pattern scale) costs me.** My "fine stripes are a minimal point of interest" claim no longer earns K3, and m03 drops 8.0 → 7.5. Calibration's evidence is better (fine pinstripes read solid from 2 m), so I accept it.
- **The clean-palette credit (M-K3) should be off at launch.** It fires on 0 of 156 saved readings. With C1, only Minimal could reach 9.5 without any accent piece, so turning it on needs gold-set evidence. Minimal tops out at 9.0 until then.
- **R3 floor:** the founder's misread goes from 3.5 to **5.0**, not my "stays 3.5."
- **Calibration's K2-shoe question (raised under s05):** I'd accept "K2 can't come from shoes" *if* fix B ships. Then:
  - mid-wash tee + jeans + white leather sneakers = **7.0**
  - black tee + black jeans + white leather sneakers = **7.5** (K4 through the 0.75 gap)
  - That makes the basics-vs-minimal gap a real 0.5, grounded in jean darkness rather than a style label. That's the honest kind of separation. I'm not adding it to my vote list; it's the mediator's call.
- **The founder's outfit belongs to Streetwear,** as smart casual, streetwear and vintage sport all agree. Minimal claims nothing there.

## 3. Votes

| # | Vote | Why |
|---|---|---|
| C1 One garment, one credit | **For** | Biggest calibration win (R4). It must govern the shoe expansions: a work boot at 2.5 or a chunky sneaker under wide jeans earns K4 only, never K2 too. Ship with fix B, or B inflates (§1) |
| C2 K1 tiering for technical layers | **For** | A puffer over a hoodie isn't a styling choice the way an overshirt is. A black shell over all-black gets 0.5 under Minimal too |
| C3 Loungewear | **Amend** | Picks alone waive nothing (for). Adopt the vintage-sport ladder (0 / 1 / 2 signals) **without** the matched-set clause. Streetwear's "anchor" is the same idea as the "real shoe" signal, so use one definition |
| C4 Detected style only widens | **For** | My prototype already takes the more forgiving of his band and the Minimal band |
| C5 Occasion beats style at work and interviews | **For** | Minimal claims no occasion allowances |
| C6 `denim_wear` / `wear_look` | **For, amended** | I proposed it. Count **faded** black jeans as dark too; only "ripped" lowers dressiness. Until the field exists, "undistressed black" rarely holds (33 of 46 saved jeans readings are flagged distressed), so fix B barely fires |
| C7 Tie-breaks | **For** | Rugby: the bottom and shoe decide. Shell + cargos + trail shoe → Outdoor. Chore coat over a hoodie: the outermost layer names it, and the score is identical. Mid-wash never counts as minimal: yes |
| C8 R1–R6 and the target spread | **For** | Every one points toward the honest number. Even with all of them, 8+ is still 43% of saved readings (below), so the 20–25% target needs the gold set, not more style rules |
| C9 Slides under jeans | **For, low confidence, gold-set gated** | −0.3 is what takes the founder's outfit from 7.0 to 6.5 with Streetwear detected. No style excuses slides |
| C10 Clean-palette credit | **Amend: in the rulebook, off at launch** | 0 saved firings. Turn on only if panel rankings put layered tonal outfits at 9+ |
| C11 Lounge cap −2.0 | **Against; prefer "one fact, one penalty"** | Vintage sport's "athletic bottoms count as 2 at Everyday", plus R1's per-garment cap and the R3 floor, already stop the 3.5. A third mechanism is redundant |
| C12 Founder's outfit, read correctly | **6.5** | Baseline 7.0; Streetwear detected → wide leg in band (P1 removed); stacked hem → F4 = 0; no credits; S3 slides −0.3 → 6.7 → **6.5**. Without S3 it's 7.0, which I'd also accept. Never Minimal (hoodie + slides) |

## 4. Net inflation check

**The package:** C1/R4 + R5 + R6 + C2 tiering + fix B + R3 floor + my Minimal detection, scored on the 56 readings (52 photos, first run, + 4 phone checks), no style picked:

| | Count |
|---|---|
| Move up | **1** (the founder's misread, 3.5 → 5.0) |
| Move down | **20** (mostly −0.5; m10 and m12 −1.0) |
| Unchanged | 35 |
| **8+** | **32 → 24** (57% → 43%) |
| **9+** | **4 → 1** |

- **Minimal detection alone moves 0 saved scores with no style picked.** With narrow picks it lifts s25 and m03 by +0.5.
- **The other members' proposals:**
  - Streetwear's K4 trigger: 0 saved scores move.
  - Its proto overall: 3 saved readings up (p02 ×2, s21), 0 down.
  - Vintage sport reports 7 up / 11 down.
- **Net:** clearly downward, which is where calibration says it should go. Even so, 8+ stays near double the target, so the remaining lift is in the baseline and the credit sizes, not in style rules.

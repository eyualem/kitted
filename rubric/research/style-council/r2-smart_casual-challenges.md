# Round 2: Smart casual advocate, challenges and votes

*Oct 7, 2026. Re-tests ran from my own scratch folder (`scratchpad/smart_casual/`):*
- *`r2_protos.py` runs the vintage sport and streetwear prototypes from this folder on smart-casual edge cases.*
- *`rubric_r2b.py` is `rubric.py` v3.1 plus every scoring change I vote for: R2 (shifted, see below), R3, R4, R5, R6, R7, the shared wide-trouser allowance, work boot at 2.5, and undistressed black jeans as dark jeans.*
- *`r2_inflation_b.py` re-scores all 155 scorable saved readings (Everyday, no style picked).*

## 1. Challenges

**Vintage sport: the "matched set" counts as a dressed upper, and that is too generous.**
- In `r1-vintage_sport_proto.py`, a grey hoodie with grey sweats and slides scores **6.5** (today 5.0). The hoodie and sweats share a color, so they count as one intent signal. That leaves the −0.6 rung, and O1 no longer charges athletic bottoms at Everyday.
- Calibration's band table puts this exact outfit at 5.0 ("one big problem a friend would point out"). I agree.
- **Fix:** a fleece-on-fleece match is not a dressed upper. Count it only when the set is a track jacket and track pants (tricot). Slides already fail the shoe signal.

**Vintage sport: two signals costing 0 is right only for real vintage sport.**
- In their prototype, a quarter-zip with grey straight sweats and white leather sneakers scores **8.5**. It is the "sport off duty" path, and I'd honestly put it at 7.5–8.0.
- **Proposed amend:** 0 when a hero piece is present (jersey, rugby, track top). Keep −0.3 on the sport-off-duty path, since the sweats are still dressiness 1. That puts it at 8.0.

**Streetwear: detection waives the logo rule at interviews.**
- A boxy graphic tee with a large logo, wide jeans and Dunks at a tech interview scores **6.0** in `r1-streetwear-proto.py` (today 3.0). Only O1 fires, because streetwear exempts O3.
- I defend neither 3.0 nor 6.0. With C5 (occasion beats style), O3 comes back and it lands about **4.5–5.0**. A friend would tell him to change before the interview.

**Streetwear: the slides get charged twice.**
- On the founder's photo read as jeans with a pooling hem, the prototype fires the stack-needs-a-shoe charge (−0.4) *and* S3 slides (−0.3). Both fire on the same pair of slides.
- That breaks the "one fact, one penalty" principle streetwear itself asks for in C11. Keep at most one of the two.

**Outdoor: the S1 cinched-hem exemption helps the wrong outfit.**
- Exempting cuffed joggers from S1 for everyone raises s06 (oxford, pink joggers, running shoes) from 7.0 to 7.5.
- The other proposals push it the other way: calibration wants 6.0, R7 gives 6.5, and the vintage prototype gives 6.5. An oxford over joggers with gym runners is the classic smart-casual near miss, not a technical outfit.
- **Fix:** limit the exemption to outfits that read as outdoor, with the new `technical_pants` value.

**Minimal: the full-rate care rule narrows a band.**
- Minimal wants full-rate F7 on scuffed shoes whenever the outfit reads as minimal, overriding a half-rate a picked style would give.
- That is detection *narrowing* an allowance, which C4 forbids. I agree a dirty white sneaker under black trousers looks bad, but the same cost should apply to everyone or no one.
- **Fix:** keep the shoe half-rate tied to the scuffed-shoe styles (streetwear, workwear, vintage sport) being picked or detected. Detecting minimal must not cancel it.

**Minimal: the "clean palette" credit (M-K3) is quiet luxury for one style only.**
- Once R5 ends small stripes counting as a point of interest, a quiet smart-casual outfit hits the same 9.0 ceiling minimal complains about. Example: a navy unstructured blazer, a white oxford, grey trousers and loafers.
- If a quiet-palette credit ever exists, its rules must be style-neutral. My vote is against it for now (C10).

**Classic prep: the bright-clash halving is circular.**
- "Color on a prep piece" is a prep marker, and the C3 halving needs the prep reading. So a bright collared shirt with bright chinos excuses its own clash.
- **Fix:** require a prep marker that isn't a color (rugby, collar with shorts, a knit over a collar, a classic pattern) before C3 is halved.

**Calibration: R2 as specified isn't "phone1 only."**
- I implemented the ramp from a 0.25 gap to a 0.75 gap. It charges gaps of 0.25–0.5 that cost 0 today:
  - m04 (tee with gym shorts): −0.75 in 2 runs
  - s24 (sweatshirt with gym shorts): −0.25
  - in all, 9 extra readings drop
- **Fix:** start the ramp at a gap of 0.5 and reach a full level at 1.0. Then phone1 pays −0.5 instead of −1.5, and no other saved reading moves.
- **I also back calibration's s05 idea:** the elevated-piece credit (K2) should need a top, outer layer or bottom at dressiness 3 or above. Shoes are judged by the shoe credit (K4). Under the best-assignment version of R4, a white leather sneaker that misses K4 still earns K2. So s05 (hoodie, jeans, white sneakers) still scores 8.0 in 1 of 3 runs, and 7.5 in the other two, where calibration estimates 7.0.

**Workwear: work boots at 2.5 have a side effect.**
- Suit trousers (5) with work boots (2.5) are now a 2.5 gap, so S2 never fires on a suit with work boots. I accept that only together with R9 (−0.9 at a 2.5 gap).

## 2. Concessions, and how my position changes

- **R5 (patterns need medium or large scale) takes my 9.5 anchor to 9.0.** The anchor was a navy blazer, a fine-striped oxford, chinos and suede chukkas. Calibration is right that fine stripes read as solid from 2 m. A smart-casual 9.5 now needs a real accent: a medium-check sport coat or one colored piece. That is consistent with "9+ is rare."
- **R6 (no scale-up on partial checks).** It replaces my worry about p06-before. A hidden bottom now simply earns less, with no up-scaling.
- **The wide-trouser allowance becomes one shared rule**, not three style allowances (mine, prep's, minimal's):
  - **When it applies:** wide `trousers`, `drawstring_trousers` or `suit_trousers`; leather or clean low shoes, or shoes hidden; no hoodie, sweatshirt or graphic tee on top. No style detection is needed, so a detection flip can't swing it.
  - **Effect:** m02 rises to 9.0 in all 3 runs (Claude's estimate 8.5). I accept that cost. A knit polo with wide trousers and loafers goes 7.5 → 8.0.
- **Outdoor's `vest` value replaces my `vest_gilet`.** A vest earns the layer credit at 0.5, including the "Midtown" vest over an oxford.
- **Picks alone waive nothing (vintage sport).** This matches my round-1 rule that detection only grants allowances.
- **My anchors under the full package I support:**

| Anchor | v3.1 | Full package |
|---|---|---|
| ~4 | 4.0 | 4.0 |
| ~5.5 | 5.5 | 5.5 |
| ~6.5 | 6.5 | 6.5 |
| ~7.5 | 8.0 | 7.5 |
| ~8.5 | 9.0 | 8.5 |
| ~9.5 | 9.5 | **9.0** |

  Two more outfits I'd put at 8.5, and why I let them stand:
  - **Quarter-zip, chinos and loafers stays 9.0.** It earns three credits on three different garments, and raw 8.75 rounds up. I'd put it at 8.5. Rounding x.75 down would make 9.5 unreachable (I tested it: 0 readings at 9+), so I leave it to the gold set.
  - **Tee, chinos and white leather sneakers stays 8.0.** I'd put it at 7.5, and the K2-needs-a-top-or-bottom fix doesn't change it, because the chinos earn K2.

## 3. Votes

| # | Vote | Why |
|---|---|---|
| C1 One garment, one credit | **For** | It cut mirror bias from +0.58 to +0.47 alone. It is clean with the shoe expansions: a work boot (2.5) or a street sneaker can only earn K4, never K2. Amend: K2 needs a non-shoe piece |
| C2 Technical layers at 0.5 | **For** | It also shrinks the quarter-zip ↔ fleece swing. Today a fleece filed as a top earns no layer credit, so that one misread swings 1.25 points |
| C3 Loungewear | **For the vintage sport ladder, amended** | Picks alone waive nothing. A matched fleece set is not a dressed upper. Two signals cost 0 only with a hero piece, −0.3 otherwise. I prefer it to streetwear's "anchor," which counts any outer layer and so lets a puffer rescue sweats |
| C4 Detection only widens | **For** | That includes minimal's full-rate F7 (see challenges) |
| C5 Occasion beats style at work and interviews | **For** (my proposal) | The streetwear prototype's 6.0 for a large-logo graphic tee at an interview shows why. Proportion allowances stay; the loungewear and logo exemptions don't |
| C6 `denim_wear` / `wear_look` field; black jeans count as dark | **For** | The distressed flag flips on faded dark jeans (s10, m10). Black undistressed jeans at 2.5 moved no Everyday score |
| C7 Tie-breaks | **For all four** | Rugby: the bottom and shoe decide. Shell, cargos and trail shoes go outdoor. A chore coat over a hoodie goes workwear (the outer layer wins). Mid-wash denim never counts as minimal. None of these moves a smart-casual score |
| C8 R1–R6 and the spread | **For, with R2 amended** (ramp from a 0.5 gap) | The target spread is right; the package gets partway (section 4) |
| C9 Slides −0.3/−0.4 | **Amend** | At most one slides charge per outfit (stack-needs-a-shoe *or* S3), switched on only if the gold-set panel agrees. "No style excuses slides" still holds |
| C10 Minimal's clean-palette credit | **Against for now** | It would need style-neutral rules (quiet smart casual and quiet prep hit the same 9.0 ceiling) and gold-set evidence |
| C11 Loungewear cap of −2.0 | **Against; prefer one fact, one penalty** | Vintage sport's O1 change, R1 (per-garment cap) and R3 (5.0 floor) fix the founder's 3.5 without a special cap |
| C12 Founder's outfit, read correctly | **6.5** | See below |

**How the founder's outfit gets to 6.5:**
- Hoodie with wide black jeans reads as streetwear, which widens the leg band, so P1's −0.45 is gone.
- The hem stacks over slides, which have nothing to hold the stack, so it pays −0.4 once.
- No credits are earned.
- Result: 7.0 − 0.4 = 6.6 → **6.5**. Read as `full_break` with no style, it's also 6.5.

## 4. Net inflation check

**Combined package** (R2 from a 0.5 gap, R3, R4, R5, R6, R7, the shared wide-trouser allowance, work boot 2.5, black jeans as dark), on 155 readings:

| | v3.1 | Combined package |
|---|---|---|
| Readings moving up | — | 6 (m02 ×3, s20 ×3) |
| Readings moving down | — | 51 |
| Readings unchanged | — | 98 |
| Share at 8+ | 53% | 39% |
| Count at 9+ | 8 | 8 (5.2%: s07 and m02 runs) |
| Mirror photos vs Claude's estimates, bias | +0.58 | +0.35 |
| Mirror photos vs Claude's estimates, average error | 0.67 | 0.51 |

The 53% is no style picked, all runs. The brief's 57% is on a different basis.

**What moves down:**
- 0.5 each: m03, m05, m07, m09, p04, p05, p06, s01, s15, s17, s19, s22, s26
- by 0.5 to 1.0: m10, m12

**The phone checks:**
- 3.5 → 5.0 (the floor)
- 8.0 → 7.5, 9.0 → 8.5 and 8.0 → 7.5

**Not modeled:**
- **Vintage sport's ladder:** their own count is 7 up, 11 down.
- **Streetwear detection and its shoe-credit trigger:** about +0.5 on m01, plus p02 and a few others.
- **Outdoor's tiered layer credit:** a few readings down.

The net is still clearly down. **But 39% at 8+ is still above the 20–25% target.** The remaining levers are calibration's: K2 being cheap (chinos alone earn it), and raw 8.75 rounding to 9.0. Rounding ties down is not the answer; it removes every 9+.

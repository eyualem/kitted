# Part: Fit (each piece's size against the cut it's meant to have)

*Oct 10, 2026. Claude (subagent), for the parts brief (`parts/BRIEF.md`, DECISIONS-LOG #195). It builds on `notes/v5-fit.md` (checkpoints, oversized on purpose vs too big, too-tight tells), the "Fit, piece by piece" plan in `v5-brief.md` (#164–165), `notes/fit-ruler.md` (#170), `notes/hem-probe.md` (#190), `notes/leg-probe.md` (#189), `notes/v5-tailoring.md` (TF1–TF5) and `notes/judge-pilot.md` (#192–194). I didn't search the web: every source below comes from those notes, which say which pages were opened and which are search summaries. The numbers in §2 come from a throwaway prototype of the formula. It ran on the saved readings in the session scratchpad and isn't in the repo.*

*Profiles (rule 7): the judge-pilot photos are the founder's (profile still pending), plus his friends' and the stock/web photos ("profile unknown"). The Fit part never reads a profile: age and picked looks can't move it. So no split by age band or picked look was possible or needed here.*

## Bottom line

1. **Score each piece on its own, then take the worst piece and subtract half of what the others lost.** Don't average. One sleeve over the hand should read as "one piece is the wrong size" (the anchor is 5–5.5) whether the outfit has 2 pieces or 4. An average dilutes that, and the hidden or unreadable pieces (a tee under a jacket) pull it toward neutral.
2. **With today's fields, Fit can only find faults.** Nothing we read today can confirm that a piece fits well. `volume` hugs 3 and there's no shoulder-seam field. So a clean piece is 7.0 ("fits fine"), and 8–9 opens only once the new cue fields pass the flip test. Giving a +0.5 for clean, clearly read pieces added noise (stable on 29 of 39 photos instead of 35) and no accuracy.
3. **On the 57 judge-pilot photos with a reading,** the prototype is 0.19 lower than the panel's fit on average (MAE 0.56, within 0.5 on 42). It runs **0.33 high on his and his friends' photos**, because their long wide jeans are read as "slight break". It runs **0.5 low on stock**, because it can't give 8+. Correlation is only 0.24, but the panel's own fit score is mostly halo: it correlates **0.93** with its proportions score. The 5 photos where the part found a fault averaged 6.5 on the panel, against 7.1 for the rest.
4. **Fit looks at one piece at a time.** If a rule needs a second piece to fire (a shirt below a blazer, a stack *under a blazer*, a hem over slides, a big top over skinny legs), it belongs to Proportions or Shoes, not here.
5. **Never the body.** Fit faults come only from positions along his own limbs (seam, sleeve end, hem) and from fabric pulling or piling. `volume` alone never costs a point: it's partly relative to his frame, so it's only used to work out the *cut*. Strain correlates with build, so only "clear" strain counts, the copy names the garment, and the gold set checks fairness by *self-reported* build.

---

## 1. What the part judges

**Severity steps** (one step per piece fault; the sizes are a starting point for the gold set):

| Step | Points off the piece (from 7.0) | Example |
|---|---|---|
| Minor | −0.5 | Hoodie cuffs bunched over the hands; a full break on a slim leg |
| Moderate | −1.5 | A shirt's sleeves past the wrist onto the hand; loose jeans pooling; skinny trousers that clearly pull |
| Clear | −2.0 | Blazer sleeves over the hands; a regular-cut tee below the crotch; a top pulling at the buttons; chinos pooling |
| Severe ("borrowed") | −4.0 | Seam halfway down the arm, plus a long body, plus sleeves over the hands |

A piece with two faults loses its worst fault plus half of the next, capped at the severe step.

### The checks

| # | Check (plain words) | Evidence (sources from the notes) | Severity | How it's measured | Reliability today | Needs |
|---|---|---|---|---|---|---|
| F1 | **Long sleeves end at the wrist.** Over part of the hand is too long, worst on tailoring, mildest on ribbed hoodie cuffs | 5+ sources: SANVT, Modest Man, Primer, RMRS overshirt (opened); for tailoring, Stitch Fix 2016, Effortless Gent 2023 and Nathan Tailors 2026 (opened); GG 2024, FashionBeans 2025 (`v5-fit` §2, TF1) | Tailored jacket: clear. Shirt, overshirt, other jackets: moderate. Hoodie, sweatshirt, knit: minor. A tee: ignored (a tee has no long sleeve, so the reading must be wrong) | **AI fact** `sleeve_end` (above_wrist / at_wrist / covers_hand), read on the hanging arm | 70–76% right on his Oct 8 photos; 93% on the fit-ruler set; same in 3 runs on 36/39 (his) and 49/55 (stock). The phone ruler scored 79% and was unsure on 42% (hands in pockets), so it isn't used (#170) | A prompt line: "read sleeves on the hanging arm only". New values `stacked_at_cuff` (bunched at a ribbed cuff, by design: no fault) and `pushed_up` (styling: the check is NA) |
| F2 | **Tee sleeves end mid-bicep.** At or past the elbow on a regular cut means too big; on a designed-oversized tee it's fine | SANVT, Modest Man, Primer, OPUMO (4) | Moderate, only when the cut is regular | Needs new short-sleeve values: `mid_bicep` · `at_elbow` · `past_elbow` | Untested | New values + flip test |
| F3 | **The shoulder seam sits on the shoulder edge.** Just past it is a designed drop. Halfway down the arm, with no other oversized cues, means too big | 7 sources say "seam far down the arm = too big" (SANVT ×2, Modest Man ×2, Primer, Essential Man, RMRS, GG; `v5-fit` §2) | On its own: minor (it could be a designer drop, Acne-style; a dissent in `v5-fit`). With a long body or sleeves over the hands: part of "too big" (clear) or "borrowed" (severe) | Needs new field **`shoulder_seam`**: `on_edge` · `just_past` · `down_arm` · `na` (raglan, hood over it, hidden) | Untested. A far drop is 55–70 px in the upload (visible); a slight drop is 10–24 px (close-up only) (`v5-fit` §5) | New field, flip test, size-ladder truth |
| F4 | **An untucked top ends between the belt and the bottom of the fly.** Below the crotch is too long | SANVT, Modest Man, Primer + 2 in `proportions.md`; dissent for designed oversized: COS, OPUMO (4 v 2) | Regular cut: clear. Oversized cut: moderate. Oversized tee over a loose leg in an outfit that reads as streetwear: minor (the style widens it; still a gold-set call) | **AI fact** `length` (only `below_crotch` matters here) | 3-class (cropped / regular / long) 85% on the fit-ruler set; 4-class 64%, and 43% on his photos (it calls his at-the-belt hoodies "mid fly", which doesn't matter for this check). Same in 3 runs 21/27 · 32/37 | Nothing for v1. The phone's top-hem position is the re-test candidate on the gold set (#170) |
| F5 | **Oversized on purpose vs a size too big.** Designed oversized: seam just past, body wide but short or ribbed, sleeves at the wrist or stacked at a ribbed cuff. Too big: seam down the arm, long body, loose sleeves over the hands | 7 vs 5 sources, dissent 2 (`v5-fit` §2 table); for tailoring, FB 2024, Rake 2024, Primer 2025, NYT 2026 (TF3) | Not a check of its own. It decides whether F2–F4 apply, and it sets the stored `cut` and `size_fit` | **Code** from F1, F3, F4 + new `ribbed_hem`. Today's stand-in (v4 F8): `volume` ≥ 4 with sleeves over the hands *and* a hem below the crotch | `volume` never read 5 on his photos (91 of 117 tops read 3), so today's stand-in rarely fires | `shoulder_seam`, `ribbed_hem`; truth from the size ladder |
| F6 | **Nothing pulls.** X-creases at buttons, a gaping placket, tension lines, whiskers at the crotch | 2–4 sources per tell; X-creases and placket gaps best supported (4 each) (`v5-fit` §3) | `clear` on a top or regular/loose bottom: clear. `clear` on a skinny or slim bottom: moderate (the cut is meant to be close, so the line is fuzziest there). `some`: no points, tip only | **AI fact** `strain` (none / some / clear) | Only obvious strain is caught. Same in 3 runs 63/66 · 84/94; never labeled. Stock s09 (a navy suit, skinny trousers) read `clear` in 3/3 runs; p03 in 1/3 | Labels on the size ladder (sized-down pieces) |
| F7 | **Pants end on the shoe without piling up.** Pooling (fabric piling on the shoe or the floor) is too long for any cut. A full break on a slim or skinny leg is a little long. A stack or a full break on relaxed or wide jeans is a style call for Proportions, not a size fault | Black Lapel, SANVT/Peter Manning (summaries), `proportions.md`; v4 F4/F4b; the 2025 baggy-stacked norm (`v5-fit` §1) | Pooling: chinos, trousers and suit trousers clear; jeans and cargos moderate; sweats and joggers minor (elastic cuffs gather by design). Full break on a narrow leg (clear read): minor | **AI fact** `hem` | **The weakest input.** Heavy vs light: the AI is right 74–75% (hem probe #190); in 6 classes, 26–43% on his photos. His long wide jeans read `slight_break` on P002, P006, P016, P020 and P042. The phone hem position was right on 20/22 but unsure on 56% (shadow only) | Planned `stacked` value; hem-position re-test on the gold set |
| F8 | **Shorts end above the knee** (chino and tailored shorts). Jorts and streetwear shorts past the knee are by design | Essential Man, Mizzen+Main, Mott & Bow (3); dissent Stitch Fix, Effortless Gent (2) | Moderate, outside streetwear and vintage sport only | Needs new field `shorts_length`: `above_knee` · `at_knee` · `below_knee`. The phone ruler can measure it (a position along his own leg; it scored 2/3 on the only 3 photos) | Untested | Field or ruler; shorts in the gold set |
| F9 | **A tailored jacket covers the seat** unless it's cropped by design. One that stops at the belt is too short | Put This On 2013, NMWA 2014, GG 2017, Effortless Gent 2023, Nathan 2026 (TF4; 5 sources); the trend dissent is shorter jackets | Moderate | The AI already fills `length` on jackets (it read the suit jackets in s07/p03 as `below_crotch`), but the prompt defines it for tops only. Make it a proper **`outer_length`** field | Untested | Field + flip test |
| F10 | **Tailored shoulders lie smooth; the button doesn't pull into an X** | Effortless Gent 2021, Stitch Fix 2016, NMWA 2014, PTO 2019 (TF5) | Tip only | Close-up only (folds of 10 px or less) | Untested; fails on dark cloth | Not worth a field before a flip test |

**Deliberately not checked:**
- **Seat sag and rise.** You can't see them from the front, and an untucked top hides the rise.
- **Any garment width against his body** ("ease", cling or tenting, the old leg-width probe). It's unsafe because it measures the body (#164, #189).
- **Lapel width, gorge and button count.** Those are style, not fit.
- **Shoes.** You can't see their fit, so they're always NA for Fit.

---

## 2. The part score

**Per piece** (top, each outer layer, bottom; shoes and accessories are skipped):
- Start at **7.0**: "fits fine, nothing off". This is also the ceiling today.
- Subtract that piece's faults (worst fault + half of the next; capped at the severe step); floor 2.0.
- **Once the new cues pass:** a piece earns **8.0** when its own checkpoints are read *clear* and on target (the seam fits its cut, the sleeves are right on the hanging arm, the length is right, no strain). A designed-oversized piece earns it when all three intent cues agree.

**Per outfit:** `Fit = worst piece − 0.5 × (the sum of every other piece's drop below 7.0)`, floor 2.0, rounded to the half. Fit **9** needs every readable piece at 8 *plus* close-ups that confirm it (a tailored jacket's sleeves at the wrist and trousers with no or a slight break, or a fully consistent designed-oversized piece). **9.5–10 isn't reachable in v1:** the AI can't confirm precision tailoring.

**Why the worst piece and not the average:**
- **It matches the anchor and how fit reads.** "One piece clearly the wrong size" is a 5 however many pieces are in the outfit. Sources describe a single too-big piece as making the whole look "someone else's clothing" (GG 2024, RMRS's "borrowed it from a bigger guy").
- **An average depends on how many pieces were read.** A too-big overshirt over a tee and jeans would score 6.5 by the average; the same overshirt over jeans alone, 6.0.
- **Unreadable pieces sit at 7.0 and can't hide a fault.** With an average, they would drown it out.
- **Half of the rest still separates "one piece off" from "several off"** (the 2–3 anchor).
- **The pilot can't settle this:** no photo had two faulted pieces, and on these 57 the average and the worst piece gave nearly the same fit (r 0.20 vs 0.24). The gold set decides.

### Anchors

| Fit | What it looks like | Reachable today? |
|---|---|---|
| 10 | Not used in v1 | No |
| 9 | Every visible piece confirmed right, and the close-ups agree. Tailoring hits its marks, or an oversized piece is clearly on purpose (dropped seam, short or ribbed body, sleeves at the wrist) | After the new cues |
| 8 | Every visible piece confirmed right by the new cues; nothing off | After the new cues |
| 7 | Nothing looks the wrong size (today's ceiling) | Yes |
| 6.5 | One minor thing: hoodie cuffs bunched over the hands, a slim leg a little long | Yes |
| 5.5 | One piece moderately off: shirt sleeves past the wrists, jeans pooling on the shoes, skinny trousers pulling | Yes |
| 5 | One piece clearly the wrong size: blazer sleeves over the hands, a regular tee below the crotch, a shirt pulling at the buttons | Yes |
| 3–4 | Two pieces off, or one "borrowed" piece (seam halfway down the arm + long body + sleeves over the hands) | Partly (the "borrowed" piece needs `shoulder_seam`) |
| 2 | Several pieces the wrong size | Yes (floor) |

### Worked examples (judge-pilot photos; panel = median of 5 judges' fit)

| ID | What it is | Reading (fit fields) | Formula | Panel fit | Why they differ |
|---|---|---|---|---|---|
| **P005** (founder, mirror) | Gingham overshirt over a tee, wide dark jeans, grey boots | Overshirt `sleeve_end` covers_hand (clear), `length` mid_fly; jeans wide, full break | Overshirt 7.0 − 1.5 = 5.5; tee and jeans 7.0 → **5.5** | **6.0** (5.5–6) | Close. On the photo the seam also sits down the arm and the open cuffs hang past the wrist. With `shoulder_seam` = down_arm it would be "too big" → 5.0 |
| **P057** (founder, mirror) | Untucked gingham oxford over very wide jeans | Oxford covers_hand (clear), mid_fly; jeans wide, slight break | 7.0 − 1.5 → **5.5** | **5.5** | Matches. The judges also cite "hangs long", which the reading has as mid fly (the 43% top-length problem on his photos) |
| **P015** (friend) | Navy blazer, light relaxed jeans stacked over chukkas | Blazer at_wrist, `strain` some; jeans relaxed, **slight_break** (a misread: it's a heavy stack) | Every piece 7.0 → **7.0** | **5.5** | **Mostly by design.** All five judges' reasons are the stack under the blazer and the wash. Fit here only owns *pooling*; "a stack under tailoring" needs two pieces, so it's Proportions' job (and the reading has to see it first: the hem probe also read it as light) |
| **P021** (stock) | Olive suit, tonal knit, no-break trousers | Jacket at_wrist, no strain; trousers slim, no/slight break, all clear, 3/3 runs | **7.0** today; **8–9** once `shoulder_seam` = on_edge and the close-ups confirm | **8.5** | Today's ceiling. This is exactly the case the new cues are for |
| **P060** (stock) | Navy suit, very skinny cropped trousers | Trousers skinny, `strain` **clear** in 3/3 runs | 7.0 − 1.5 (strain on a skinny cut) → **5.5** | **7.0** (6.5–7) | The judges put "dated skinny" mostly into proportions. 5.5 is defensible for pulling fabric, but it sits at the harsh end; check the step size on the size ladder |
| **P026** (founder) | Boxy black tee, wide jeans, white chunky sneakers | Tee volume 4, mid_fly; jeans wide, full break | **7.0** | **7.5** | Fine. With the new cues (seam just past, short body) it could earn 8 as designed oversized |

**The whole pilot (57 photos with a reading):**
- **Overall:** part − panel −0.19, MAE 0.56, within 0.5 on 42, off by 1.5+ on 7.
- **By group:** his and his friends' photos +0.33 (r 0.44); stock −0.50; web mirror −0.08.
- **Spread:** 52 of 57 photos score 7.0. Faults were found on 5: P005, P057, P060, P050 (jeans pooling at bare feet) and P011 (an embroidered shirt read as "below the crotch" in 2 of 3 runs).
- **Same in 3 runs:** 35/39 stock photos. The flips came from single-run fault reads: a tee read as covers_hand in one run (now ignored), pooling on joggers once, a long-top read, a full break.

---

## 3. When Fit is NA

- **The whole part:** no top, outer layer or bottom has a single readable checkpoint. That covers a shoe-only snap, a photo cropped above the waist with the arms out of frame, everything read `unsure`, or a "not rated" traditional garment.
- **One check on one piece** (NA, never a cost):
  - Sleeves: hidden; on the raised arm in a mirror selfie; pushed up; or the hand is in a pocket and the read is `unsure`.
  - Top length: tucked, or he's seated (needs a new scene field, `pose`: standing / seated; P003 was seated).
  - Hem: the feet are cut off.
  - Shoulder: hidden by a hood or a layer.
- **A piece with no readable checkpoint** stays at 7.0 and can't lower or raise the part.

---

## 4. Which v4 rules move here, and which go

| v4 rule (today's points) | Goes to | What changes |
|---|---|---|
| F9 Sleeves over the hands (−0.4; −0.2 hoodie in streetwear) | **Fit F1** | Severity by garment type (tailored clear, shirt moderate, ribbed knit minor) instead of the streetwear exception. TF1 joins it |
| F6 Top too long (−0.8) | **Fit F4** | Graded by cut (regular clear, oversized moderate, streetwear oversized over a loose leg minor) |
| F8 Too big (−0.6, streetwear exception) | **Fit F5** | Becomes code-derived `size_fit` from the cues. Today's stand-in stays until `shoulder_seam` passes |
| F10 Visible strain (−0.6) | **Fit F6** | Clear only; moderate on skinny or slim bottoms |
| F4 Pooling (−0.8 / −0.4) | **Fit F7** | Sweats and joggers drop to minor |
| F4b Full break on a narrow leg (−0.2) | **Fit F7** | Unchanged in spirit |
| F7 Care (worn, stained, wrinkled) | Condition part | Out of Fit |
| F4 Hem drags over slides | Shoes part | Needs the shoe, so not one piece |
| L1 Shirt hangs below the blazer (tagged fit in v4) | Proportions | Two pieces |
| P1 top/leg vs the style's band, P2 big top over skinny leg, P3 everything oversized, S1 bulky shoe on a narrow leg | Proportions / Cohesion | Two pieces or the style |
| T1 Dress shirt untucked | Condition and finishing (or occasion) | Out of Fit |
| The per-garment −1.0 cap on fit + proportion | **Goes away** | The part structure replaces it: one piece can drag Fit down to 5, and the part's weight bounds what that costs the total |
| The `street_top_over_loose` exception | **Goes away** | Replaced by the cut logic (designed oversized from the cues) plus the minor-only "long oversized tee over a loose leg in streetwear" |

**Weight in the final average:** start Fit at **20%** while it can only find faults (r 0.24). Move it to 25% (the pilot's weight) once the new cues pass and it can tell 7 from 8–9.

---

## 5. What he sees

**The card line** names the worst piece and the garment, never the body. Avoid "on you", "your frame", "for your build".

| Fit | Card line | Fixes that raise it (free first) |
|---|---|---|
| 7 | "Fit 7: nothing looks the wrong size." | None (Fit isn't where his points are) |
| 8 | "Fit 8: boxy on purpose: dropped shoulder, short body, sleeves at the wrist." | — |
| 6.5 | "Fit 6.5: the hoodie cuffs bunch over your hands." | "Push the sleeves up a little" |
| 5.5 | "Fit 5.5: the shirt's sleeves run past your wrists." | "Button the cuffs, or roll them twice" · "Try this shirt a size down" · "Swap to your [white oxford]" (closet, `size_fit` = right) |
| 5 | "Fit 5: the blazer's sleeves cover your hands." | "A tailor can shorten jacket sleeves" · "Try a size down" |
| 5 | "Fit 5: the tee runs long, past the bottom of the fly." | "Front-tuck it" (the length becomes NA, so the fault goes away) · "A shorter or boxier tee" |
| 5.5 | "Fit 5.5: the jeans pile up on your shoes." | "Cuff them once" · "Hem them to just touch the shoe" |
| 5.5 | "Fit 5.5: these trousers pull." | "Try a size up, or a straight cut" |

**How fixes are chosen:**
- A fix to the **worst piece** is the only kind that can raise Fit much. The fix engine credits it with that piece's own fault (capped by the next-worst piece).
- A free styling fix (roll, cuff, tuck, push up) is listed before a buy or tailor fix.
- A closet swap is offered only for a piece stored with `size_fit` = right.
- The re-check reads the same fields, so "rolled the cuffs" shows up as `sleeve_end` = at_wrist.

**The closet** stores the code's `cut` and `size_fit` per piece (the clearest sighting wins, #164). They feed matching, tile drawing and the piece page ("Boxy, fits as designed" / "Runs big"). **They never feed the score:** same photo, same score, whatever his history.

---

## 6. Risks

- **The hem drives most of the misses on his own photos.** His long wide jeans read `slight_break`, and the panel cites "lengths running long" 23 times. Pooling is the only hem value Fit acts on, so a misread pool costs nothing and a misread "pooling" on wide jeans costs 1.5. Heavy vs light is right only about 75% of the time (#190).
- **Volume is partly relative to his frame.** The same tee can read 2 on one man and 4 on another. That's why it's never used as a fault on its own, only to pick the cut.
- **Strain correlates with build.** A bigger or more muscular man trips it more often for the same garment. So: clear only, garment-only copy, and a gold-set check that strain fires at similar rates across *self-reported* builds (rule 7; build is never estimated).
- **Mirror selfies:**
  - The raised arm shortens one sleeve and lifts one side of the hem.
  - The phone hand covers the placket.
  - Hands in pockets (12 of his 20 photos) hide the sleeve end, and the AI then guesses "at wrist", usually right.
  - A pushed-up sleeve can read as short.
- **Dark on dark** hides strain, folds and the hem (black hoodie, black jeans, black slides).
- **Skin tone:** sleeve end depends on contrast where the sleeve meets the hand. The ruler answered less often on deep skin tones (45% vs 75%; #170). The AI may do the same, which needs checking.
- **Designer cuts:** an Acne-style seam at the elbow is designed, but under the rule it reads as too big. Hence "seam down the arm alone = minor".
- **Trend drift:** long oversized tees are disputed (COS, OPUMO). The minor-only streetwear exception is a guess for the gold set.
- **No calibration target yet.** The panel's fit is halo'd (r 0.93 with proportions, 0.86 with condition) and is one model five times. It can show direction, not step sizes.
- **Double counting.** Proportions, Shoes and Condition must not also charge for pooling, sleeves or strain, and Fit must not charge for the stack under the blazer.

---

## 7. Test plan

### No new photos
1. **Part stability:**
   - Run the formula on every saved reading with several runs (`zoom1`, `zoom1-stock` arm B, the leg1/hem1 run sets).
   - Bar: the same Fit score on ≥ 90% of photos. Today it's 35/39 = 90%, just at the bar.
   - Then on his 37 saved phone readings: list every Fit change for the founder before anything ships (#187).
2. **Judge pilot as a direction check, not a target:**
   - Pieces with a fault should sit lower on the panel (they do: 6.5 vs 7.1, n = 5).
   - P015-type photos (a stack under tailoring) must be caught by Proportions, not Fit.
3. **Flip test for the new cues (about $2):**
   - On the 72 fit-ruler photos, 3 runs each: `shoulder_seam`, `ribbed_hem`, the short-sleeve `sleeve_end` values, `stacked_at_cuff` / `pushed_up`, `outer_length`, `shorts_length`, scene `pose`.
   - First add seam and short-sleeve labels to `extraction-test/ruler_labels.csv` *before* the run, the same way the ruler's labels were made.
   - Bar: each field the same on ≥ 90% of photos, and right on ≥ 80% against the labels. Otherwise it stays a tip.
4. **Copy check:** every Fit line and fix passes the body-words test (body, build, frame, belly, weight, "skinny" about a person, "on you").

### Waiting for the shoot
5. **Size ladder (#164):**
   - The same tee, hoodie and jeans in 2–3 sizes, plus one designed-oversized piece, mirror and propped. The size is known, so the truth is free.
   - Bars:
     - `cut` and `size_fit` same in 3 runs ≥ 90% and right ≥ 80%.
     - Sizing up must move `size_fit` to "too big" while the designed piece stays "oversized, right".
     - Fit must fall as the size moves away from the right one.
   - This also sets the step sizes (does a sized-up tee really sit around 5?).
   - Re-run the fit ruler (top length, sleeve end) and the hem position against the same truth.
6. **Gold set:**
   - Collect a separate fit score from the raters with these anchors, plus pairwise "which fits better?" on matched pairs.
   - Compare worst + half the rest vs the plain average vs the worst alone.
   - Splits:
     - **Skin tone:** answer rates and accuracy for sleeves must be equal.
     - **Self-reported build:** strain fire rates must be similar.
     - **Age band and picked look** (rule 7): expected flat, since the profile never enters the part.
   - Include sleeves over the hand, shorts at and below the knee, and a shirt below a jacket (already on the founder's shot list).

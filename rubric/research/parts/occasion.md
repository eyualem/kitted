# Occasion: a step after the average, not a part (research for parts scoring, Oct 10, 2026; DECISIONS-LOG #195)

*Brief: `parts/BRIEF.md`. The question: does the outfit suit the occasion he picked: Everyday, Class/Work (key `class`), Date, Going out, Interview, Event, Gym, Home? Profiles (rule 7): the founder's photos are "profile pending", his friends' and the stock photos "profile unknown". Nothing here reads age or picked looks, so no split by age band or picked look is possible. The judge panel didn't score occasion (its brief had no occasion part), so there's no panel number to compare against. I compare with v4 and with the panel's overall score from its parts instead.*

## The decision: occasion is not averaged in. It's a step after the average that can only hold a score down.

**Final score = the lower of (parts average − a small deduction) and an occasion ceiling.** Then comes the existing 5.0 floor at Everyday, Class, Home and Gym (only when there's no stain, wear or strain fault), then rounding to the half. When the outfit is right for where he's going, nothing happens. This is the founder's "gym shorts at an interview can't be more than a 5" as a rule; in the prototype they're held to 4.0.

**Why not a part in the average:**
1. **Averaging dilutes it until it's useless.** With the pilot's weights, an occasion part at 15% takes a clean 7.0 gym kit at an interview only to 6.25 (7 × 0.85 + 2 × 0.15). To get it to 5 or below, occasion needs a **40% weight** on every check, including the ~85% where it's simply right. A dress code works like a threshold, not a trade-off: a great color story doesn't make track pants right for an interview. Interview and dress-code guides treat it that way: "follow formal dress codes to the letter" (Ape to Gentleman), and "overdress when unsure" (interview-guide summaries in `notes/v5-tailoring.md` §4).
2. **Averaging inflates every ordinary check.** At their real occasion, 48 of the 58 pilot photos have no occasion problem at all. As a part they'd score 9–10 on occasion, which lifts their average by about 0.15 × (10 − 7) ≈ **+0.45**, the exact amount the pilot says the app is already too generous (#194). Setting "right for it" to a neutral 7 instead would pull every sharp outfit down. Either way it becomes a calibration fudge, not a judgment.
3. **It's a different kind of question.** Every part judges the clothes against each other (or against his own limbs). Occasion judges the clothes against a place he named. The photo's facts don't change when he changes the occasion, so the parts shouldn't either. **On the card the parts stay identical when he switches occasion; only the occasion line and the final number change.** That keeps #62's "Re-score for date? It would be 6.5 instead of 7.0" honest and easy to explain. (The one exception: Shoes treats slides and runners as the right shoe at Gym and Home; see `shoes.md`.)
4. **A small deduction for small gaps keeps it from being all-or-nothing.** A ceiling alone would ignore "a bit casual for a date" on an outfit that's already 6.5. So gaps under a level cost up to −0.5, and bigger gaps add a ceiling.

**What I give up:** dressing well *for* the occasion earns nothing extra. That's deliberate: the parts already reward the pieces (a good blazer is good under Fit, Cohesion and Shoes), and a bonus would re-open the inflation in point 2. Competitor apps show "occasion" as a 1–10 subscore (`research-context.md`, the Beauty AI roundup: Twirl, Fashion Score), but theirs are model-judged. We'd be showing a number that's 10 most of the time.

## 1. The checks
**Dressiness** is v4's `FORMALITY` per piece (1 athletic … 5 formal; work boots 2.5, dark undistressed jeans 2.5), averaged over top, layers, bottom and shoes. As in v4, athletic bottoms count as 2 at Everyday and Class, because the loungewear check (O-2) is their one charge there. **Targets** are v4's `OCCASION_TARGET` bands for the app's keys: everyday and class 2–3, date and going out 2.5–3.5, interview and event 3.5–4.5, gym 1–2, home 1–2.5.

| # | Check (plain words) | Effect | Evidence | Measured by | Reliable today? | Needs |
|---|---|---|---|---|---|---|
| **O-1** | **Dressed down for it:** the outfit's average dressiness is below the occasion's band | gap = band's low end − average. Up to 0.25: nothing. 0.25–0.75: −0 to −0.5 ("a bit casual"). Above 0.75: −0.5 **and a ceiling**: 7.0 at a 0.75 gap, 6.0 at 1.0, 5.0 at 1.5, 4.0 at 2.0, 3.5 at 2.5+ | v4 O1 (the ramp, RULEBOOK rulings 2/R2); the band anchors (RULEBOOK Part 7: "3.0–4.0 = wrong clothes for where he's going"); interview guides (GG 2016, Nathan 2026), wedding/cocktail guides (Zola 2025, Modest Man 2024), Ape ("formal codes to the letter"), all via `v5-tailoring.md` §4/§6 | Code from `subcategory` (+ `color_family` and `distressed_by_design` for jeans) | Garment type is the strongest field: tops 100% and bottoms 100% with close-ups, outerwear 91%, footwear kind 77% / type 53% (`zoom1`, #104). A shoe misread moves the average by about 0.3 at most (1 of 3–4 pieces) | — |
| **O-2** | **Loungewear out of the house** (sweats, joggers, track pants, gym shorts, not at Gym or Home), sized by signs of intent: a dressed top or real jacket; a real shoe (not runners or slides) | Ceiling **5.5** with 0 signs, **6.5** with 1, **7.5** with 2; none with 2 signs plus a sport hero piece (jersey; rugby with jeans). **Gym shorts with a real shoe: no ceiling** (summer shorts; v4's flip guard). At Interview and Event: ceiling **4.0**, whatever the signs | v4 O4's ladder (RULEBOOK ruling 6: the style council's agreed model); "occasion beats style" at interviews and events (ruling 20) | AI `subcategory` (bottom, tops, outerwear, shoes) | Jeans vs sweatpants/joggers is a known look-alike, so the "Jeans or sweatpants?" tap stays (#85, #125); his Oct 7 black jeans read as sweatpants | — |
| **O-3** | **A home or gym piece at a dressy occasion:** slides, or athletic bottoms, at Interview or Event | Ceiling **4.0** | Dress codes are judged by the weakest piece, not the average (Ape; Modest Man 2024: "sneakers and work boots to avoid" at semi-formal; via `v5-tailoring.md`). The average can hide it: a suit + slides averages 4.0 | AI `subcategory` | Slides read `clear` are reliable (18 of 18 of his reads) | — |
| **O-4** | **Sneakers under a blazer or suit at an interview** | Ceiling **7.0** | `v5-tailoring.md` SU2/OC2 (4+ sources: Ape, Modest Man 2024, Zola 2025, The Rake 2022, interview guides); shipped as v4.1 A3f (#186) | AI `subcategory` + a tailored layer | High | — |
| **O-5** | **A big logo at an interview** | Ceiling **6.5** (only when the model is sure: certainty `clear`) | v4 O3; creator consensus "avoid large logos" 9/10 (`research-context.md`, unverified); ruling 20 | AI `logo` = large | The "large" read flip-flops between runs (`rubric.py`'s note), hence `clear` only | — |
| **O-6** | **Overdressed:** the average is more than 1.5 levels above the band | −0.5, never a ceiling | v4 O1_too_formal; "overdress slightly rather than underdress" (creator research, `research-context.md`, unverified) | Code | As O-1 | — |
| — | Tips only (never points): a tee under a suit at an interview (SU4: the collar sits at the blur edge); "this one usually wants a tie" (SU5: no tie field); a black suit at an interview (SU6); weather lines (#58) | — | `v5-tailoring.md` | — | — | `tie` field (untested) |

**Kept elsewhere:** an untucked dress shirt (v4 T1) is a finishing fault for Condition (`fit.md` agrees). Shoes too casual for the *clothes* belongs to Shoes. Occasion only asks whether the outfit suits the room.

## 2. The step, and its anchors
```
deduction = 0.5 × ramp(gap 0.25 → 0.75)        (0 when gap ≤ 0.25; stays 0.5 beyond)
ceiling   = the lowest of: O-1's curve (gap > 0.75), O-2, O-3, O-4, O-5      (10 when none apply)
if overdressed: deduction = max(deduction, 0.5)
final = min(parts average − deduction, ceiling) → then the 5.0 floor (Everyday/Class/Home/Gym, no care/strain fault) → round to the half
```
Because this is a step and not a part, its "anchors" are what the card says:

| Status on the card | When | Example |
|---|---|---|
| **Right for class** (no change) | Gap ≤ 0.25, no ceiling | Chore coat + tee + jeans + low-profile sneakers at Class |
| **A bit casual for a date** (−0.25 to −0.5) | Gap 0.25–0.75 | Plain tee + jeans + canvas sneakers at a date (gap 0.5: −0.25) |
| **Too casual for an interview · held to 6.0** | Gap ~1 | Chore coat + tee + jeans + sneakers at an interview |
| **Loungewear for everyday · held to 5.5** | O-2, 0 signs | Hoodie + joggers + slides |
| **Wrong clothes for an interview · held to 4.0** | O-2/O-3 at Interview or Event, or a gap of 2+ | Gym shorts + tee + runners at an interview |
| **A bit dressy for the gym** (−0.5) | O-6 | A suit at the gym |

### Three worked examples (judge pilot photos, saved close-up readings. "Parts" = the panel's own part scores, weighted fit 25 / proportion 25 / color 15 / shoes 15 / cohesion 15 / condition 5, as the stand-in for our parts average)
1. **P024, his grey hoodie + joggers (read sweatpants) + slides, Everyday.** Parts **6.0**; the panel's gut median **4.5**. O-2: 0 signs of intent (no dressed piece; slides aren't a real shoe) → **held to 5.5** ("Needs a fix"). v4 gives **6.0** (−1.2 loungewear). The ceiling closes most of the gap between the parts and the panel's gut, which is the evidence that loungewear needs more than its parts. At Home: **6.0**, no change. At an interview: **4.0** (O-2, O-3; O-1's gap is 2.0). v4: 3.0.
2. **P027, a friend's navy chore coat + white tee + charcoal straight jeans + navy low-profile sneakers** (his real occasion: Class). Parts **7.5**, gut 7–7.5; Class, Date: **right for it**, 7.5 (v4: 8.5 at all three). At an interview: average dressiness 2.38 against 3.5, gap 1.12 → **held to 6.0** ("Too casual for an interview. A blazer or a knit would suit it."). v4: 7.0. Same photo, same parts; only the occasion line changes.
3. **P047, logo tee + nylon shorts (read `athletic_shorts`) + Jordan 1s, Everyday** (stock). Parts **7.5**, gut 7. O-2: gym shorts with a real shoe → **no ceiling**, so **7.5**. v4 gives **6.0** (−0.6 loungewear). At a date: gap 0.83 → **held to 6.5**. At an interview: **4.0**. v4's flat −0.6 charged a clean summer set the panel liked. The ceiling only bites where shorts really are wrong.

**Across all 58 pilot photos** (the panel's parts as the average): at Everyday and Class the step changes 10 photos (all loungewear) and leaves 48 alone. At Date and Going out it changes 15. At Interview and Event it changes 44 (mean 6.0, against the parts' 6.8). At Gym it changes 9 and at Home 6, all by −0.5 for dressy outfits.

## 3. When it doesn't apply
- **Not rated** (traditional clothing, not fully clothed) or nothing readable: no step.
- **Pieces it can't see don't count.** The average uses only scored pieces. Hidden shoes simply leave the average, and a cut-off bottom half means O-2 and O-3 can't fire. What isn't in the photo never costs points.
- **Gym and Home:** O-1 can't fire (the bands start at 1) and O-2 is off. Only O-6 (overdressed, −0.5) can apply.

## 4. Which v4 rules move here, and which go away
| v4 rule | Under parts |
|---|---|
| O1 too casual (ramp, up to −3.0) | O-1 as a deduction plus a ceiling |
| O1 too formal (−0.6) | O-6 (−0.5) |
| O4 loungewear ladder (−1.2 / −0.6 / −0.3 / 0) | O-2 as ceilings (5.5 / 6.5 / 7.5 / none); athletic bottoms at dressy occasions: 4.0 |
| "Athletic bottoms count as 2 at Everyday/Class" (ruling 7) | Kept (one fact, one charge) |
| S2's interview floor (A3f, #186) | O-4 |
| O3 big logo at work/interviews (−1.3) | O-5 (interview only; the app has no Work key) |
| T1 untucked dress shirt | Goes to Condition |
| The 5.0 floor (ruling 8) | Kept, applied after the step (ceilings at those occasions are 5.5 or higher, so the two never conflict) |
| `OCCASION_FIRST` (no style waivers at dressy occasions) | Kept: O-2's hero waiver is off at Interview and Event |
| `wedding_*`, `work*`, `interview_corporate/tech` bands | Unused in the app; leave them in the table |

## 5. What the user sees
The occasion appears as a status line under the parts, not a number: `Right for class` (a check mark) · `A bit casual for a date · −0.5` · `Too casual for an interview · held to 6.0`. The VoiceOver wording follows the line.

**Fixes:** the code finds the single swap that clears the ceiling or the deduction, using the same re-scoring the tap uses: "Swap the hoodie for a knit or an overshirt", "Swap the sneakers for loafers or derbies" (under a blazer at an interview), "Swap the joggers for chinos or dark jeans", "A plain top would suit an interview" (logo). Each shows the result: "→ 7.0".

**The Re-score sheet (#62)** reads straight from this: "Re-score for interview? It would be 6.0 instead of 7.5: too casual for an interview."

## 6. Risks
1. **"Class/Work" is one key (`class`, band 2–3)** for a lecture and an office (`02-screens.md`: chip `Class/Work` → `class`). A hoodie reads as right for work. Recommendation: split the chip, or map Work days to `work_casual` (2.5–3.5). That's an outward-facing label, so the founder decides.
2. **"Event" means anything from a party to a career fair** (the app's own example is "Career fair on Oct 29"), but its band (3.5–4.5) is a dressy event's. A tee and jeans at a friend's party would read "Too casual for an event · held to 6.0". Recommendation: treat Event as 3–4 (like `wedding_casual`) and keep O-4 and O-5 interview-only. Or rename the chip "Dressy event". Also the founder's call.
3. **The dressiness table is a judgment, not a measurement.** Chinos 3, overshirt 3, work boots 2.5: every ceiling inherits these numbers. They were settled by the style council (RULEBOOK) but never checked against raters.
4. **The average can mislead both ways.** A blazer can "lift" a tee and joggers past a gap. O-3 covers the worst case (slides and athletic bottoms at dressy occasions), not everything.
5. **Ceilings concentrate errors.** One misread (jeans read as sweatpants) can now hold a score at 5.5. The "Jeans or sweatpants?" tap must keep firing on dark non-denim bottoms (it does today, #125), and its ask rate should be watched under parts.
6. **No raters have judged occasion yet.** The panel saw no occasion. The ceiling heights (5.5 / 6.5 / 7.5; 7.0 → 3.5) are reasoned from v4's sizes and the RULEBOOK bands, not calibrated.

## 7. Test plan
**Now, with no new photos:**
1. **Invariance:** on the 7,233 parity cases and every saved reading, the parts must be identical across Everyday, Class, Date, Going out, Interview and Event; only the final number moves.
2. **v4 agreement:** for each case and each of the 8 occasions, compare v4's `occasion_adj` with this step's effect. Expected: the same direction everywhere; bigger effects at Interview/Event; smaller on clean summer gym-short sets and on the 2-signs ladder. List every case where v4 charges and the step doesn't (and the reverse), and review them.
3. **The pilot table above, regenerated automatically:** at the photos' real occasions, the step must not change more than the loungewear photos (today 10 of 58).
4. **Ask-rate check:** the "Jeans or sweatpants?" and shoe questions are triggered by a swing of 0.5+ in the *final* score, so re-measure the ask rate at every occasion. Target unchanged: under 15% of checks (#121).

**With the gold set:**
5. **Occasion pairs:** the same outfit rated by his friends for two occasions (Class vs Date; Date vs Interview). Pass: the step moves the score in the raters' direction ≥ 80% of the time, and by about their amount.
6. **The ceiling heights:** raters score 10–15 deliberately wrong-occasion fits (loungewear on a date, a tee at an interview). Set 5.5 / 4.0 / the O-1 curve from their medians, **reported by age band and by picked look** (rule 7). If raters of 18–21 judge Class differently from raters of 26–30 (sweats to class), that's the case for age moving points, and that call is the founder's.

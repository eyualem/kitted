# Scoring by parts: the merged plan (v5 core)

*Oct 10, 2026. Claude, merged from the six part reports in this folder (`fit.md`, `proportions.md`, `color.md`, `shoes.md`, `occasion.md`, `cohesion.md`, `condition.md`). The founder's idea comes from DECISIONS-LOG #195. Status: **a proposal waiting for his OK.** Nothing in the app has changed.*

## The idea in one paragraph
Each outfit gets a score from 1 to 10 for each **part**. The final score is a weighted average of the parts. After that, **condition** faults are subtracted and the **occasion** can hold the score down. The card shows the parts. Gemini still only describes garments. Code (and, for color, phone measurements once they're skin-free) turns those facts into each part's score, so the same photo always gets the same score. A part that isn't in the photo drops out of the average, and the other weights scale up.

## The parts

| Part | Weight | Starts at | What moves it | Reliable today? |
|---|---|---|---|---|
| **Proportions and silhouette** | 30% | 7 (balanced middle) | **Up to +2:** a waist break (tuck, short top); a short layer over a full leg; a complete tailored line. **Down:** a big top over skinny legs; a long top; a long loose layer over a loose leg; a tee clearly below a layer; a heavy hem under a blazer. Any fault blocks the rewards. Floor 2 | Partly. Tuck, short top, narrow vs fuller leg and skinny read well. Layer length, a tee peeking below, and hems don't, so those wait for new fields |
| **Fit** | 25% | 7 (fits fine) | Scored per piece, and the **worst piece counts** (plus half of what the others lost): sleeves over the hands, strain, too big ("borrowed"), pooling on a narrow leg. Severity depends on the garment | Faults only. Today a clean outfit tops out at 7; 8–9 needs the shoulder-seam and sleeve cues |
| **Color** | 15% | 7 | **Down:** too many accents, brights fighting, muddy middle tones, a near-match, pattern clashes. **Up** (only when there's no fault): one standout, a tie-in, tonal with range, light-mid-dark | Mostly. The AI's color words today; phone-measured lightness later, once it's skin-free (below) |
| **Shoes** | 15% | 7 (fine, generic) | **Up to 9.5:** clearly chosen for the outfit. **Down:** slides out of the house (4.5), runners with everyday clothes, the shoe weight fighting the leg either way (chunky under slim, dainty under wide), worn shoes | Fairly. Boots / sneakers / slides are right 77% of the time with close-ups; exact type 53% |
| **Cohesion and style** | 15% | 7 | **Up:** reads as one style (the council's tables) +0.5; signature pieces throughout +0.5; one standout piece +0.5. **Down:** a piece from another world −1.5; formal + gym −4; too many statements −0.5 to −1 | A narrow, written-down version only. "Is the mix deliberate?" can't be read from facts, so it stays out |

**Who owns each fact**, so nothing is charged twice:
- **Shoes:** the shoe weight against the leg (both directions), slides with a dragging hem, and shoe condition.
- **Proportions:** a top running below the crotch.
- **Fit:** sleeves, strain, too big, and pooling or a full break on a narrow leg.
- **Cohesion:** too many statements (old B1) and a standout piece.
- **Color:** a standout color.
- **Condition:** an untucked dress shirt (old T1).
- **Occasion:** sneakers under a blazer at an interview.

## After the average
1. **Condition: faults only, subtracted.** Wrinkled −0.4, worn −0.4, stain −1.2, capped at −1.6. Footwear is excluded (Shoes owns it). The card says "Condition: clean" with no number, because the AI can't certify crisp, or "Couldn't check in this light". **The AI almost never reports these:** it caught 2 of 19 photos where the judges named fading, wrinkles, stains or lint. So condition needs a reworded prompt and a flip test before it can do much.
2. **Occasion: it only holds the score down, never averaged in.** Final = the lower of (the parts average minus up to 0.5) and a ceiling.
   - Gym shorts or slides at an Interview or Event: held to 4.0.
   - Loungewear out of the house: held to 5.5, 6.5 or 7.5 (by 0, 1 or 2 signs of intent).
   - Sneakers under a blazer at an interview: held to 7.0.
   - A big logo at an interview: held to 6.5.
   - Overdressed: −0.5 only.

   Why it isn't averaged: most outfits are right for their occasion, so an averaged occasion part would add about +0.45 to almost every score, which is the over-generosity we're fixing. A ceiling also keeps the parts identical when he switches occasion.
3. **Round to the half.** The floor stays at 3.0.

## How high it can go
Today's fields cap Fit at 7 and Proportions at about 8.5. So **9 is reachable only when everything else is strong, and 9.5 isn't reachable until the fit cues pass.** That matches the founder's rule that a 9 should be difficult.

## What the card shows
The score and its word, as today, then one row of parts:
- **Proportions 5 · Fit 7 · Color 8 · Shoes 7 · Style 7**
- **Condition:** "clean", or the fault ("wrinkled shirt")
- **Occasion:** "Right for class", or the ceiling ("Gym shorts at an interview: held to 4")

The lowest part leads, with a one-line reason ("Proportions 5: the shirt hangs long over wide jeans"), and each fix says which part it raises. The look is a taste call for the founder; mock it up first.

## What it needs that doesn't exist yet (in order)
1. **Reading batch 1, tested with the 3-run flip test** (≥90% the same, ≥85% right when it fires, no loss of steadiness in the old fields, which is where v5 failed in #63–64). About $1.30–2. It adds:
   - `hem_at` on every top and layer: tucked / cropped / waistband / hip / crotch / thigh / knee
   - a 3-way `under_shows`: no / a little / clearly
   - `scene.pose`: standing / seated
   - a 3-value `lightness`
   - `shoulder_seam`: on edge / just past / down arm
   - new `sleeve_end` values: short sleeve, stacked at cuff, pushed up
2. **Reading batch 2, flip test, about $1.30:** a `stacked` hem value, `hem_on_shoe`, `shoe_profile`.
3. **A condition prompt rewording, flip test, about $0.30–0.50.**
4. **A Python prototype** of the parts engine beside `rubric.py`, then a paper test. It runs on his saved fits, every saved reading and the judge pilot's part scores, and gives the before/after list for him. Then the TypeScript port, a new fix engine (fixes target parts instead of v4 rules), and the card.
5. **The gold set** sets the weights and anchors, and settles worst-piece vs average for Fit.

## Problems the research found
- **Skin pixels leak into the phone's measured garment colors.** Garment boxes include bare arms, open collars and knees through rips; in 5 of 83 neutral pieces a skin-like cluster made up 13–38% of the "garment". Nothing leaves the phone, but under "never skin" **no measured color may feed a score** until the measurement uses skin-free regions (torso and thigh cores). Today's closet matching has the same leak, which belongs to the closet session.
- **The judge pilot can't calibrate the parts individually.** The panel's part scores are a halo of its gut score (fit correlates 0.93 with proportions, cohesion 0.96 with gut). It checks direction, not each part.
- **Until batch 1 passes, Proportions and Fit mostly say 7.** So the parts engine alone won't yet separate his everyday fits much. The new fields are what make it work.
- **Lost shoe type:** v4 scores a Skip on "Boots, sneakers or slides?" with the most generous answer. In the parts engine it becomes NA for Shoes. Needs a log entry when built.

## Founder calls
- Approve this design (Claude settles the weights and anchors, and the gold set tunes them).
- The ~$4 of flip tests (batches 1 and 2, plus condition).
- **The "Event" chip:** it uses an interview-level band but also covers parties. Recommended: a softer band, or rename it "Dressy event".
- **The "Class/Work" chip is one setting,** so a hoodie counts as right for an office. Split it later?
- The card's parts row: a mockup first.

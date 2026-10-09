# The fit ruler: can the phone measure where clothes end, better than the AI reads it?

*Oct 9, 2026. Claude. DECISIONS-LOG #170. Code: `extraction-test/vision/FitRuler.swift` (Mac harness only, not in the app), runner `extraction-test/fit_ruler.py`, results `extraction-test/results/ruler1/` (per-photo tables in `report.md`; pictures of every walk in `overlays/`, faces hidden, git-ignored).*

## Bottom line

1. **No measurement passes the bar** (beat the AI's accuracy and say "unsure" on at most 20% of photos). Nothing should replace an AI field in scoring or the closet now.
2. **Sleeve end:** right 79% of the time when it answers, but the AI is right 93% on the same photos, and the ruler is unsure on 42% (60% of his photos, mostly because his hanging hand is in his pocket).
3. **Top length:** the one place it does better. On his photos it's right 71% when it answers vs the AI's 43% (the AI keeps calling his at-the-belt hoodies "mid fly"). But it's unsure on 30%, over all photos it ties the AI (63% vs 64%), and swapping it in **changes none of his 37 saved scores**. Worth re-testing on the gold set, not shipping.
4. **Pant hem:** fails. 52% when it answers vs the AI's 81%, unsure on 54%. A "break" is a fold of fabric, not a position, and dark pants on dark shoes have no color step to find.
5. **Layers (shows below the jacket)** and **shorts length:** not testable on these photos (every layered photo it could read was a "no"; only 3 photos with shorts).
6. **It is perfectly repeatable** (the same photo gives the same answer, 100%), and fairly steady when the photo is resized or cropped slightly (86–98%). The AI repeats itself less on top length (74%) and hem (85%).

## What I built

For each photo the ruler finds his body joints (Apple Vision, the same body pose and outline the app already uses), then walks a line along a limb and finds where the garment's own color stops:

| Measure | The walk | Output |
|---|---|---|
| Sleeve end | Shoulder → elbow → wrist → into the hand, **hanging arm only** (elbow nearly straight, arm pointing down; the phone arm in a mirror selfie is skipped) | mid bicep · at elbow · above wrist · at wrist · covers hand. The closet call's "long / short sleeve" picks which set applies |
| Top hem | Two lines down the front of the torso, chest → knee, split into "top above, pants below" | cropped · at belt · mid fly · below crotch, from the hem's position between his hip joints (0) and knees (1) |
| Pant hem | Knee → ankle → sole, on each leg; the shoe's top comes from the closet call's shoe box | gap (ankle or sock shows) · meets · covers |
| Shorts length | Hip → knee → shin | above knee · at knee · below knee |
| Layers | The closet call's two top boxes, bottoms compared in torso lengths | yes / no |

**The rules it keeps:**
- **Positions only**, as fractions of his own limbs. It never compares a garment's width with his body (that would grow with body size and rate bodies). It uses the width of his outline at one point only to center the sampling line on the arm or leg, and never reports it. The old leg-width probe (`Measure.legShape`) is now out of the app file entirely (moved to `extraction-test/vision/LegShapeProbe.swift`; it was never called by the app).
- **No skin color anywhere.** The reference is always the garment's own pixels (the upper arm for a sleeve, the shin for the pants, the chest for a top), and a boundary is a sharp step away from that. Lightness counts half (the textile color-difference convention), so a shadow along a sleeve isn't read as the sleeve ending.
- **A confidence gate on every joint** (hips included), and "unsure" when the joints are off, the arm isn't hanging, the hand is in a pocket, or two garments are too close in color to split.
- About 0.35 s per photo on the Mac for everything. No new packages, models or downloads.

## The test

- **72 photos:** his 17 phone checks (Oct 8 and 9, kept copies from the pulls), his 4 Oct 7 photos, the 12 mirror selfies, 39 of the 40 stock photos (s18 has two people, so the app refuses it).
- **Labels:** I labeled sleeve end, top length, hem, shorts length and layers on all 72 by eye **before the ruler ran** (`extraction-test/ruler_labels.csv`). They're one person's labels (mine), not ground truth. Two notes: I set 5 "yes" layer labels (a tee peeking below a hoodie or sweater) during the labeling review; and I disagree with Oct 8's `truth.csv` on one photo (e026de: the gingham sleeve stops above the wrist with the hoodie cuff below it; `truth.csv` says at the wrist). No photo had a sleeve that covers the hand.
- **The AI:** the app's config (close-ups on), 3 runs per photo from the Oct 8 test (`zoom1`, `zoom1-stock` arm B); his 6 Oct 9 photos have his phone's own single reading.
- **Tuning was done on the stock and mirror photos only.** His photos were held out and scored once at the end.
- Hem and layers skip the 6 photos taken before the closet call existed (no garment boxes).

## Results

All photos ("sure" = the ruler gave an answer; the AI column is the AI on exactly the photos the ruler answered, every run counted):

| Measure | Labeled | Ruler right when sure | Unsure | AI right, same photos | Ruler same: rerun · 1600 px · 3% crop | AI same over 3 runs |
|---|---|---|---|---|---|---|
| Sleeve end | 50 | **79%** (23/29) | **42%** | **93%** | 100% · 90% · 86% | 97% |
| Top length (4 classes) | 60 | **63%** (26/41) | **31%** | **64%** | 100% · 97% · 88% | 74% |
| Top length (cropped / regular / long) | 60 | 85% | 31% | 85% | 100% · 98% · 90% | 84% |
| Pant hem (gap / meets / covers) | 42 | **52%** (10/19) | **54%** | **81%** | 100% · 95% · 98% | 85% |
| Layers | 27 | 100% (21/21, all "no") | 22% | 96% | 100% · 100% · 89% | 92% |
| Shorts length | 3 | 2 of 3 | 0 | (the AI has no field) | 100% | – |

His photos only (held out):

| Measure | Labeled | Ruler right when sure | Unsure | AI right, same photos |
|---|---|---|---|---|
| Sleeve end | 20 | 7/8 | **60%** | 92% |
| Top length | 20 | **10/14 (71%)** | 30% | **43%** |
| Pant hem | 13 | 2/5 | 61% | 30% |

**Using the boxes alone** (the closet call's top and pants boxes, scaled to his joints, no color walk) was also tried as a comparison: top length 65% (unsure 9%) and hem 63% (unsure 2%), both below the AI's own readings (69% and 77% on the same photos).

**What it would change for him:** I re-scored his 37 saved readings with the ruler's top length wherever it answered. **No score changed.** The front-tuck tip (shown when a top reads "mid fly") would show on 12 of 37 instead of 13: gone on 4 runs (b0f0c8, 968016), newly shown on 3 (a765e8, 6b14db). That tip firing on his hoodies is a rule problem (#150), not a measuring one.

## Why it fails (examples; pictures in `results/ruler1/overlays/`)

1. **Hands in pockets (his habit).** On 12 of his 20 photos the hanging hand goes into a pocket, so the sleeve's end and the pocket's edge are the same place. The ruler correctly says unsure; the AI guesses "at wrist", which is usually right.
2. **Dark on dark.** Black hoodie, black jeans and black slides (1f1997, d58b14), or a navy coat over black jeans (f4870b, fb0b17): there's no color step to find. This is a big share of real outfits, not a corner case.
3. **The pose line runs along the arm's edge.** Before the line was re-centered on the arm, the sampling took in the background (the black mirror frame on d6559a) and read a sleeve end at the bicep. Re-centering fixed most of it.
4. **Shading and prints.** A grey hoodie darker on its shaded side, and the white stripes on s05's navy hoodie sleeve, read as the sleeve ending until lightness was down-weighted and a step had to be sharp and stay gone.
5. **The hem's break isn't a position.** His wide jeans resting on his boots ("covers") and stock trousers just touching dress shoes ("meets") land in the same place against the shoe box: per leg, "meets" ran from 0.24 above the box top to 0.77 of the way down the shoe, "covers" from 0.97 above to 0.45 down (the box top itself is the AI's guess). Where the pants end depends on folds and the shoe's height, which a position can't see.
6. **The hip joint is a coarse ruler.** "At belt" and "mid fly" differ by about 5 cm, about a tenth of his thigh, which is inside the hip joint's own wobble. A button-up's curved hem also reads longer at the front (5a9049, p01).

## Skin tones (must be settled before anything like this ships)

My labels note skin tone only to check coverage: 33 light, 10 medium, 29 deep (15 of the deep are his own photos). The ruler answered the sleeve on 75% of light, 50% of medium and 45% of deep photos, and was right on 14/15, 2/4 and 7/10 of those answers. This sample can't separate skin tone from his pockets and dark outfits, and it never looks for skin by color, but the gap is a warning. **The gold set must include men with a range of skin tones, in light and dark sleeves, and the answer and accuracy rates must be equal across them** before any version of this reaches the app.

## Recommendation

- **Adopt nothing now.** Keep the AI's `sleeve_end`, `length` and `hem`, and keep the ruler in the harness as the baseline to beat.
- **For the v5 fit plan (#164–165):** drop "the phone replaces the AI's sleeve_end, length and hem when the joints are clear" for v1. The AI-reads-cues, code-derives-fit path stays. The measured positions can still be stored for the closet later, but only after they pass on the gold set.
- **Re-test on the gold set and the size-ladder shoot** with the same command, adding labels for: a sleeve over the hand, an under-layer below a jacket, shorts at and below the knee, and the range of skin tones above. Top length is the candidate; it needs unsure ≤ 20% and to beat the AI there.
- **If top length passes there** (a proposal, not built): add `Ruler.topHem` to `KittedMeasure.swift` and run it in `measureGarments` after the closet call (it reuses the person mask and pose the measure step already computes; time it on the phone first). Store `measured_length` and `measured_length_u` on the sighting (a closet migration, B's area) and log a `[measure] length …` line. Then a shadow week on his phone: log both, change nothing. Only after that would the rubric chat let a sure ruler reading replace the AI's `length` in `rubric.py`, with the same swap in `@kitted/core` and a parity test.

## How to run it again

```
extraction-test/vision/build.sh
/usr/bin/python3 extraction-test/fit_ruler.py --out extraction-test/results/ruler2
```

Labels for new photos go in `extraction-test/ruler_labels.csv`. Settings can be tried on the tuning photos with `RULER_<NAME>=value` (for example `RULER_BELT=0.06`) plus `--fast --groups stock,mirror`. The settings used here: color step 10, "same color" 10 (14 for top vs pants), lightness weight 2 on sleeves and 1 elsewhere, belt line u 0.06, crotch u 0.26, covers hand 2.25, joint and hip confidence 0.3.

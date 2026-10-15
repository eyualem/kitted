# The hem from the body (hem4): can a body ruler read the stack at the shoe better than the AI?

*Oct 15, 2026. Claude. Mac harness only: nothing in the app changed, no photo was sent anywhere, no API call was made (the AI numbers are the Oct 13 hem3 answers already on disk). Code: `extraction-test/hem_ruler.py` (`extract` → `measure` → `report`), run with `extraction-test/.venv-mp/bin/python -I`. Results: `extraction-test/results/hem4/report.md`, `features.json`; overlays in `results/hem4/overlays/` and the MediaPipe cache in `results/hem4/mp/` (both git-ignored). DECISIONS-LOG #273.*

## Bottom line

1. **No. None of the six ideas reads the stack (folds piling above the shoe) better than the AI, alone or combined.** All of them together, trained on the tuning half and tested once on the other half, score a test AUC of 0.51, which is chance. The AI is right on 57–59% of its runs on those same photos. The AI isn't good at this either (69% overall, #238); the ruler is simply no better.
2. **The ruler itself works.** The hem's height above the floor, on a knee → floor ruler, is steady:
   - his same pants on different days read within 0.1–1.7 cm (five outfits);
   - tilting the photo ±10° moves it a median 1.0 cm.

   It just doesn't answer the question. Where the pants end is set by the shoe (a sneaker's collar, a slide's strap, a boot's shaft), not by how much extra fabric sits above it. A clean break and a stack both end at the top of the shoe.
3. **Nothing changes in the app, so there is no before/after to show.** The stack stays a tip. The founder's hem variants (normal, cuffed, rolled, hitched) and the tape-measure inseams (idea 6) are the next truth.

## What was built

For each leg, from the untilted photo and the same photo tilted ±10° (the exact camera homography used by `kmeasure --pitch`):

- **Joints:** Apple Vision's joints from the waist runs (`results/waist4`, the app's own Swift) for the shoulder → knee ruler. MediaPipe Pose Landmarker heavy (OK'd in #269) for the knees, ankles, heels and toes, plus his outline (its segmentation mask).
- **The floor:** walk down from the heel, toe and ankle points to where his outline ends, capped a few cm under the heel so shadows and a hanger don't count. One fix was made after looking at the overlays (`phone-0d39d6`'s floor had run into a hanger).
- **The ruler:** knee → floor, with the knee at 48.0 cm (ANSUR II) plus a stated 3 cm sole for everyone, so the ankle bone sits at ~10.3 cm. Shoulders + knees (the waistline ruler) extrapolated to the floor misses by −10 to +9 cm (middle 80%), so the hem uses the local knee → floor ruler.
- **The hem:** walking down the middle of the leg, the first place the color departs from the pants' own mid-shin color and stays departed.

All six ideas were measured from that:

| # | Idea | What was measured |
|---|---|---|
| 1 | The hem against the ankle bone | Hem height in cm above the floor; the hem against MediaPipe's ankle point; a second hem finder from the outline narrowing (pants → shoe) |
| 2a | Extra length as width | The outline's width in the 12 cm above the hem over its width 18–30 cm above it (pants against pants) |
| 2b | Extra length as fold lines | Light/dark bands along the leg in the 13 cm above the hem, over the same fabric's bands 16–32 cm above it, with contrast relative to the fabric's lightness so black jeans aren't read as flat; plus the bands' direction |
| 3 | The shoe as a second ruler | Heel → toe length; the shoe showing below the hem, in shoe lengths |
| 4 | The hem's outline | Each of 9 columns across the leg finds its own hem; the line's tilt and its raggedness in cm |
| 5 | Left vs right | The difference between the legs in hem height, widen and fold contrast |
| 6 | Inseams with a tape measure | **Not testable yet:** it needs him and a tape |

**Rules kept:**
- The body is only a ruler. Joints say where to measure and what a cm is. Every output is a garment position or a garment-against-garment ratio, the constants are the same for everyone, and nothing about the body is reported, scored or stored.
- Every direction ("higher = heavier") was fixed before any cut. Cuts were chosen on the tuning half only (best balanced accuracy), then applied once to the test half.

## The test

- **Labels and split:** the 78 hem3 photos and blind labels (`hem3_labels.csv`), split the way the waist test splits:
  - tuning: stock, web mirror selfies and odd-numbered gold;
  - test: his phone checks, Oct 7 and even-numbered gold.
- **Folds above the shoe:** 19 yes, 49 no, 10 unsure (test: 8 yes, 19 no).
- **Rule 7, who's in the photos:**
  - the founder (profile pending);
  - his two friends (profile unknown);
  - one unknown person;
  - web, stock and public gold photos (profile unknown).
  A hem measurement uses no profile, so none was applied.
- **Coverage:** 3 photos got no pose (two Oct 7 photos and ig-040). Of the 156 legs:
  - 117 were measured;
  - 16 had no hem by color (mostly dark on dark: the hem was found on 20 of 29 dark-on-dark photos);
  - 9 had the knee or ankle hidden;
  - 5 had the feet cut off;
  - 3 had the leg not upright.

### Folds above the shoe (the stack), the question that matters

| Idea | AUC tune | AUC test | Test right | Unsure | AI on those photos |
|---|---|---|---|---|---|
| 1 hem height (low = heavy) | 0.41 | 0.35 | 35% | 15% | 57% |
| 1 hem vs MediaPipe ankle | 0.35 | 0.59 | 74% | 15% | 57% |
| 1 hem by the outline | 0.38 | 0.42 | 76% | 22% | 57% |
| 2a widen | 0.63 | 0.12 | 37% | 30% | 68% |
| 2b folds | 0.54 | 0.57 | 64% | 19% | 59% |
| 2b fold direction | 0.47 | 0.30 | 45% | 19% | 59% |
| 3 shoe hidden (shoe lengths) | 0.42 | 0.63 | 26% | 15% | 57% |
| 4 ragged hem | 0.32 | 0.44 | 30% | 15% | 57% |
| 4 hem tilt | 0.21 | 0.49 | 30% | 15% | 57% |
| 5 left/right hem | 0.33 | 0.61 | 27% | 19% | 59% |
| 5 left/right folds | 0.79 | 0.69 | 79% | 30% | 63% |
| All combined (trained on tune) | | 0.51 | 39% | | 57% |

- **The only idea that clears 0.5 on both halves is left vs right fold contrast, and it's noise:**
  - On tuning it found 1 of 2 measured stacks, with 4 false alarms.
  - On test it found 2 of 5. Its 79% comes from saying "no" to the 13 clean hems.
  - It can't measure 12 of the 19 stacks.
  - It flips on 17% of tilted copies.
- **Its "right" rates of 74–76% (hem vs MediaPipe ankle, hem by the outline) are the same effect:** they mostly say "no" on a set that's 70% no. Their test AUCs (0.59, 0.42) show they don't rank stacks above clean hems.
- **Unsure falls hardest on the stacks:** the fold contrast is missing on 6 of 19 stacks against 9 of 49 clean hems, and the left/right comparison on 12 of 19.
- **Same failure modes as #190:**
  - His black wide jeans show no fold shading.
  - Jogger cuffs and rolled hems make the same bands as a stack.

### The other questions

- **Drags at the heel:** no idea comes near the AI's 91%.
  - The best on test is the outline hem (87%), but that's from saying "no"; its AUCs are 0.35 and 0.44.
  - Left/right hem height scored 0.75 on tune but 0.61 on test.
- **Ankle shows:** the AI is 100% on these photos.
  - Hem height reaches 0.78 test AUC, which is useful as a sanity check that the hem is found.
  - It doesn't beat the AI, because "ankle shows" depends on the shoe's height, not the hem's.
- **Hem by color vs hem by the outline:** they disagree by a median 9 cm (within 3 cm on only 27%), so the outline finder isn't a hem finder. Front-on, a shoe is nearly as wide as a slim pant's opening.
- **The shoe as a ruler doesn't work:** heel → toe in a front-on photo is mostly foreshortened, so it measures the camera angle more than the shoe. It reads 9–19 cm (middle 80%, median 15) for shoes that are really ~28–30 cm long.

## Why it fails, and what would work

The stack is pants **longer than the leg**. In a photo, a clean break and a stack both end where the shoe starts. The difference is a few cm of fabric folded on itself, and it shows only as texture: fold shading, which black denim and phone JPEGs flatten. Measuring positions against the body can't recover length that is folded out of sight. So:

1. **The tape inseams (idea 6) are the direct measure.** His pants' inseam minus his own inseam (crotch to floor, shoes on) is the real extra length, the same in every photo of those pants. It's a closet fact, not a photo fact: "these jeans are 6 cm longer than your leg" could live on the piece, entered once (or from the brand's size label), and drive the hem tip without reading the photo at all. Worth considering as a closet field when the piece page is built. It's on his list as optional.
2. **His hem variants** (the same jeans normal, cuffed, rolled, hitched) are still the truth that any reader, AI or script, needs.
3. **Keep the hem height** in the harness as a steady garment position (±1–2 cm). If a hem rule is ever built, it can act as a veto: a hem far above the shoe can't be a stack.

## Re-run

```
extraction-test/.venv-mp/bin/python -I extraction-test/hem_ruler.py extract   # MediaPipe on the labeled photos × 3 tilts (cached)
extraction-test/.venv-mp/bin/python -I extraction-test/hem_ruler.py measure   # ~20 s
extraction-test/.venv-mp/bin/python -I extraction-test/hem_ruler.py report
```
New photos (the hem variants) need a Vision run first (`waist_rulers.py`, which writes `results/waist4/runs/<id>.p<pitch>.json`) and a row in `hem3_labels.csv`.

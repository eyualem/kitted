# The waistline from the body: does a body ruler beat the AI at "the waist shows"?

*Round 2 (Oct 15, #269) is first; round 1 (Oct 14, #264) follows.*

*Oct 14, 2026. Claude. DECISIONS-LOG #264. Mac harness only, no app change, no API calls. Code:
`extraction-test/vision/WaistRuler.swift` (`kmeasure waist`), runner `extraction-test/waist_test.py`, paper test
`extraction-test/waist_paper.py`. Results: `extraction-test/results/waist1/` (`report.md`, `rows.json`, `paper.txt`;
overlays and face-hidden copies are git-ignored). Research: `rubric/research/notes/waist-research.md`. Labels and
their guides: `extraction-test/waist_labels/`.*

## Round 2 (Oct 15, #269): a better body ruler, and the waistline his idea is about

**Short version:**
- **The body side now works.** Across 4,082 men, shoulders and knees alone predict the navel to ±2.1 cm (1 SD), as well as the true hip joint does. In the photos, Apple's and Google's trackers place the same clothes edge to within ~2 cm of each other.
- **The visual waistline carries the signal his idea predicts.** On the gold set it tracks the judges' proportion scores twice as well as the AI's top-length reading (rank correlation −0.46 vs −0.29), and it still works inside the AI's own "at the belt" group.
- **In the score it helps only a little.** Held-out panel r 0.49 → 0.51; Proportions 0.50 → 0.58.
- **What decides it is truth for the ruler's absolute offset:** his tape shoot (below).

### The body data (ANSUR II men, n = 4,082, `inputs/ansur2/`, public domain; founder OK'd the download)

| Landmark | Mean height | Fraction of the way shoulder (acromion) → knee | Person-to-person error from shoulders + knees | …adding the ankle | from the true hip joint + shoulder |
|---|---|---|---|---|---|
| Navel | 105.6 cm | 0.400 | 2.1 cm | 1.9 | 2.0 |
| Top of the hip bone | 106.2 | 0.394 | 1.9 | 1.8 | 1.7 |
| Hip joint (trochanter) | 90.1 | 0.562 | 2.2 | 2.0 | – |
| Crotch | 84.6 | 0.619 | 2.0 | 1.7 | 1.7 |

So the hips aren't needed at all. They're the least reliable points on a photo, and the ones the clothes pull around.

### The rulers (`vision/BodyRuler.swift`; MediaPipe in `waist_mediapipe.py`, sandboxed in `extraction-test/.venv-mp`, Apache 2.0, founder OK'd)

- `hips`: the old one.
- `sk_linear`: Apple Vision's 2D shoulders and knees, straight.
- `ska_proj` / `ska_proj_r`: shoulders, knees and ankles with a projective fit, which corrects camera tilt and height (`_r` with a gentle prior that the tilt is modest).
- `a3d_proj` / `a3d_ansur`: Apple's 3D body pose.
- `mp_proj` / `mp_ansur`: Google MediaPipe's 3D and 2D pose.

Positions are t, the share of the way from the shoulders (0) to the knees (1): the navel is 0.40 and the hip joint 0.56.

**Tests that need no labels** (`results/waist2/report.md`; 318 photos × 3 camera tilts):

| Ruler | Photo turned as a camera pitched ±10°: median shift | Same outfit, another photo (his 6 sets): median range | Agrees with an independent tracker (SD of the difference) |
|---|---|---|---|
| hips | 1.6 cm | 0.5 cm | 2.8 cm vs MediaPipe |
| sk_linear | 3.1 cm | 0.9 cm | **1.9 cm vs MediaPipe's 2D** |
| ska_proj_r | 2.8 cm | 1.0 cm | 2.1 cm |
| a3d_proj (Apple 3D) | 3.1 cm (80%: 10 cm) | 0.3 cm | 5–6 cm: noisy, dropped |
| mp_proj | 2.3 cm | 0.9 cm | 0.9 cm vs mp_ansur |

- Two independent trackers agree to ~2 cm, which puts each at ~1.5 cm of random error.
- The ruler's random error is then ~2.5–3 cm in all (with the ±2 cm between people).
- The systematic offset is still unknown. Pose models put the "shoulder" at the joint, a few cm below the top of the shoulder bone the ANSUR heights use, and put the knee 2–3 cm low. Between rulers it runs 1–4 cm. Only a photo with a known true line can fix it.

**Against the labels:**
- **"Does the waistband show" barely moves** (AUC 0.80–0.92 for every ruler, the old one included). That label depends on how high the pants sit, not on the body.
- **What does move is the waistline itself.** On the 105 gold photos with no outer layer that both can read, the measured line (`sk_linear`) tracks the 5 judges' Proportions scores at rank correlation **−0.46** (the higher the line, the better), against **−0.29** for the AI's top length.
- **It isn't repeating the AI:** inside the AI's own "at the belt" group (n 53) it still tracks them at −0.48.

| Measured waistline (t) | Photos | Judges' Proportions | Panel score |
|---|---|---|---|
| above 0.45 (near the navel) | 13 | 7.52 | 7.46 |
| 0.45–0.55 (between navel and hip joint) | 33 | 7.44 | 7.36 |
| 0.55–0.65 (at or just below the hip joint) | 35 | 6.91 | 6.95 |
| 0.65–0.75 (well below) | 18 | 5.97 | 6.08 |

That's his idea in numbers. The anatomical waist is the ruler, and the visual waistline the clothes make counts against it: tops that put it at or below the hip joint lose ~0.5–1.5 on Proportions.

**In the score, on paper** (`waist_paper2.py`, gold tune half to pick, test half once; `results/waist2/paper2-*.txt`):
- **C1:** the measured line replaces the AI's top length (untucked, no outer layer).
- **C2:** C1, plus a measured long top costs points (the PF2 tip made live; what-if switch `pf2_measured`, off).

| Ruler | C2 cuts picked on tune | Held-out panel r (v13: 0.49) | Held-out Proportions r (0.50) | His 20 (0.46) | His saved checks moved |
|---|---|---|---|---|---|
| sk_linear | at belt ≤ 0.58, long > 0.65, −1.5 | **0.51** | **0.58** | 0.46 | 8, all down (the hoodie 8.0 → 7.5, the untucked brown shirt 7.0 → 6.0, black tee + light wide jeans 7.5 → 6.5) |
| ska_proj_r | 0.56 / 0.65 / −0.5 | 0.51 | 0.56 | 0.49 | 5 |
| mp_proj | 0.58 / 0.68 / −1.5 | 0.50 | 0.54 | 0.50 | 3 |
| hips (old) | 0.56 / 0.68 / −1.5 | 0.48 | 0.51 | 0.45 | 5 |
| C1 alone (sk_linear) | 0.58 / 0.72 | 0.49 | 0.52 | 0.41 | 4 |

The direction is the same for every new ruler, but on 91 photos +0.02 is within the noise (the standard error of r is about 0.08). The Proportions gain is clearer. Still unsure: about 35% of photos (dark on dark, joints out of frame), where the AI's reading stays.

### What would make it a game changer: truth for the ruler

The random error is small enough. The unknown is the offset: where the ruler's "navel" line is against his real navel, on mirror and propped shots. One 10-minute shoot settles it:
- a strip of blue painter's tape across his shirt at navel height;
- 12 photos at different camera heights and tilts.

`kmeasure waist` finds the tape by its color (`WAIST_TAPE=1`) and reports each ruler's error in cm.
- **If the projective rulers land within ~3 cm on both kinds of shot:** C2 becomes a real proposal for his OK. The waist credit and the long-top charge would follow the measured waistline, the AI's reading would be the fallback, and the 8 moves above would be his before/after.
- **If they don't:** the offset is calibrated once from his photos (pose-model offsets are the same for everyone) and checked on a friend.

## Bottom line (round 1, Oct 14)

1. **It doesn't pass the bar, so nothing changes in the app.** On held-out photos the ruler is right 80% of the time
   when it answers, and the AI 82% on the same photos. The ruler is unsure on 41% (the bar is 30% at most). It is
   perfectly repeatable (same photo, same answer, 100%), but that doesn't help when the answer is noisier than the AI's.
2. **The clothes edge is found well. The ruler from the joints is what's off.** On his hoodie check the line lands
   exactly where the hoodie's hem meets the jeans. But Vision puts his hip joints at the waistband in a mirror selfie,
   so a correct edge reads as "at the hips". The research predicted this: joints can only place the waist to within
   about 3–7 cm (0.07–0.11 of the hip-to-knee length on a propped photo, more in a mirror selfie), about the size of
   the gap between "ends at the belt" and "covers the belt".
3. **The AI is about as good as a second human labeler at this.** Two independent blind labelers agree on "does the
   waist show" only 79% of the time. The AI agrees with each of them 78–79%, and with the photos where both agree 87%.
   That's near the ceiling these labels can measure, so no measurement could show it beats the AI here.
4. **His idea holds as a description, just not as a measurement precise enough to score.** The visual split (the share of
   his height above the waistline the clothes make) sorts outfits the way his idea predicts:
   - tucked: median 0.34
   - a top ending at a waistband that clearly shows: 0.37
   - the waistband only partly shows: 0.44
   - covered: 0.45
   - ending on the fly: 0.49

   But each group spreads about ±0.07, as wide as the gaps between them.
5. **The two Oct 14 misfires were a rule question, not a misread.** The navy graphic tee over cream jeans and the navy hoodie over wide
   jeans both end at a waistband that shows. Two labelers say so, and so did the AI ("at_belt"). Whether a plain tee
   or hoodie that just reaches the waistband should earn "gives it a waist" is a taste call (below).
6. **Both rule changes lose on paper.** Restricting the credit to a tuck or a cropped top makes the app follow the
   judge panel less well (held-out r 0.49 → 0.45) and his 20 blind ratings of gold photos less well (r 0.46 → 0.39), and cuts the
   8+ share from 15% to 5%. Letting the ruler cancel the credit changes nothing on the panel, and on his checks it
   lowers 3 scores, the hoodie 8.0 → 7.5 among them, where the ruler disagrees with both labelers.
7. **The leg ratio fails too** (the pants' width at the shin over the thigh; garment against garment). Held out, it's
   right 48% of the time when it answers and unsure on 60%; the AI gets 61–66%. This repeats #223.

## What I built

For each photo (`kmeasure waist`), all on the 1024-px statistics copy, inside Vision's person outline, his hands and
the phone left out:

- **The ruler (from the body, never reported as a judgment):** the axis from the middle of the hip joints H to the middle
  of the shoulders S. Positions are measured along it in "torsos" (s = 0 at the hip joints, 1 at the shoulders). The
  anatomical landmarks come from ANSUR II men (research note §1): the navel and the iliac crest about 0.30 torsos above the hip
  joints, the crotch about 0.20 of the hip-to-knee length below. The same constants apply to everyone.
- **The visual waistline (from the clothes):** a strip across the torso, profiled from the chest down to mid-thigh. Each
  pixel votes for the top's color (taken at the chest) or the pants' color (taken at the shins). It records where the
  top's color stops and where the pants' color starts. A thin band of a third color between them is read as a belt or
  waistband; a wider one as an under-layer showing.
- **The outputs:** "waist shows" or "covered" (the pants start at or above s = −0.02, or a belt band is seen), a 3-way
  class (waist / mid-fly / below the crotch), the visual split, the pants' own crotch from the outline (where the
  background first shows between the legs), and the shin-over-thigh width of the pants.
- **Tried and dropped on the dev photos:** a dark-on-dark fallback from the strongest horizontal line (a hem casts one).
  It was no better than a coin flip (AUC 0.47). A narrower strip (to keep an open jacket's panels out) and the
  pants' own visible rise (above the outline's crotch) didn't separate better either (AUC 0.73–0.78, all about the same).
- About 0.4 s per photo on the Mac. No new packages, models or downloads.

## The test

- **Photos:**
  - the fit ruler's set: his 33 phone checks through Oct 14, his 4 Oct 7 photos, the 12 mirror selfies and 39 stock
    photos (89 in all);
  - the 225 gold-set screenshots.
  - Left out, as the app does: photos with two people (4 of his, 1 stock). His 4 Oct 14 two-person checks were run
    afterwards with the person he picked (the misfires), and only enter the paper test.
- **Truth:** two independent blind label passes by Claude subagents, from the face-hidden copies, before anything was
  measured.
  - Pass 1 (`GUIDE.md`) labeled where the top ends, whether the waistband shows, the tuck, the leg, the shot type,
    dark on dark, and a hand at the waist.
  - Pass 2 (`GUIDE2.md`) answered only "does the waist show?".
  - The scores use the 182 photos where both passes agree. On pass 1 alone the ruler and the AI both drop about 12
    points, and the gap between them stays the same.
  - I labeled his 4 picked checks myself, before running the ruler on them.
- **Rule 7:** his birth year and picks are still pending, and gold photos are "profile unknown". The paper test uses the one stated
  test profile (Minimal + Smart casual, boldness "a little", Everyday). Nothing here uses a profile, so there's no split by
  age band or picked look.
- **Split:** tuned only on dev (the stock and mirror photos, and the odd-numbered gold photos). The cut (−0.02) and the
  veto threshold (−0.12) were frozen, then test (his photos and the even-numbered gold photos) was scored once.
- **The AI:** the app's own reading config. His and the stock photos use 3 runs from zoom1 (or his phone's one reading);
  the gold set uses 2 runs. "Waist shows" for the AI is exactly the engine's PR1 test: the first top tucked in full,
  or read cropped or at the belt.

## Results (held out, labels both passes agree on)

| Photos | Labeled | Ruler right when it answers | Ruler unsure | AI right, same photos | AI right, all | Ruler same: rerun · 1600 px · 3% crop |
|---|---|---|---|---|---|---|
| All | 92 | 80% (43/54) | 41% | 82% | 84% | 100% · 99% · 83% |
| No outer layer (where the credit can fire) | 67 | 80% | 39% | 82% | 81% | 100% · 99% · 78% |
| His photos | 23 | 77% (10/13) | 43% | 64% | 70% | 100% · 96% · 83% |
| Mirror selfies | 54 | 81% | 43% | 81% | 83% | |
| Propped / other | 38 | 78% | 39% | 84% | 84% | |
| Hand at the waist | 45 | 72% | 36% | 82% | 84% | |
| Dark on dark | 10 | – (all unsure) | 100% | – | 100% | |

- **Ruler when sure, else the AI:** 83%, the same as the AI alone (83%).
- **The ruler as a veto** (it cancels the AI's "waist shows" only when the pants start clearly low): on the test photos it fixes
  0 and breaks 3 of 176 AI runs. Over all photos it fixes 5 and breaks 5.
- **On his photos the ruler again looks better than the AI** (77% vs 64%), as the fit ruler did (#170). That's 13
  answers, with 43% unsure.
- **Why unsure** (labeled photos): the top and pants are too close in color (36, dark on dark), the hip joints not found
  (15), the shoulders (7), the knees (6), other (6).

**Where the pants start, by label** (s in torsos; the cut has to fall between these):

| Label | n | 10% | median | 90% |
|---|---|---|---|---|
| tucked | 23 | 0.00 | 0.18 | 0.27 |
| at the waistband | 94 | −0.14 | 0.02 | 0.16 |
| at the waistband or mid-fly | 27 | −0.19 | −0.02 | 0.11 |
| mid-fly | 14 | −0.16 | −0.09 | 0.18 |

## His Oct 14 checks, one by one

| Check | Labels | AI | Ruler | v13 now | A (tuck/crop only) | B (ruler veto) |
|---|---|---|---|---|---|---|
| Navy hoodie, wide jeans (17:58) | waistband shows (both passes) | at belt | covered (pants start at s −0.04) | 8.0 | 7.5 | 7.5 |
| Navy graphic tee, cream jeans (17:57) | waistband shows (mine) | at belt | covered (−0.03) | 7.0 | 7.0 | 7.0 |
| Black tee, light wide jeans | one pass: ambiguous; the other: shows | at belt | covered (−0.10) | 7.5 | 7.0 | 7.0 |
| Red tee, wide black jeans (2 photos) | waistband shows (both) | at belt | waist shows | 7.5 | 7.0 | 7.5 |
| Checked shirt, cream pants | waistband shows (both) | at belt | waist shows (0.14) | no change | | |
| Navy polo tucked | tucked (both) | tucked | unsure (hips) | no change | | |

## The paper test (no app change)

Candidates, as what-if switches in `parts_proto.py` (both off; the live engine is unchanged):
- **A** `pr1_short = ("cropped",)`: the waist credit needs a tuck or a cropped top.
- **B** `pr1_ruler_veto`: "at belt" counts unless the ruler sees the pants start low.

| | v13 (live) | A | B |
|---|---|---|---|
| Gold, held-out r with the panel | 0.49 | 0.45 | 0.49 |
| Gold, tuning-half r | 0.65 | 0.61 | 0.65 |
| His 20 blind ratings of gold photos, r · within 0.5 | 0.46 · 13/20 | 0.39 · 13/20 | 0.46 · 13/20 |
| 8+ share (held out) | 15% | 5% | 15% |
| Steady (2 runs within 0.5, held out) | 88/91 | 88/91 | 88/91 |
| The credit fires on gold photos | 74/225 | 24/225 | 72/225 |
| His 35 saved checks: the credit fires · scores moved | 10 | 3 · 6 moved down 0.5 | 6 · 3 moved down 0.5 |

## Why it fails

1. **The hip joints sit where the clothes are.** Pose models place the hip about 3 cm lower than the true joint (research note §1b,
   Needham 2021), and on a clothed body Vision often puts it at the waistband or the hoodie's rib. A 3–5 cm error is
   the whole difference between "at the belt" and "covers the belt".
2. **Mirror selfies tilt the ruler.** The phone at chest height shortens the legs against the torso by 22–29%, and makes a
   front hem look 3–6 cm lower than it is (research note §3, our own calculation).
3. **Dark on dark** has no color step to find (36 photos), and no horizontal line was reliable either.
4. **The truth itself is soft.** "Just reaches the waistband" vs "just covers it" splits two careful labelers 1 time in 5.

## Recommendation

- **Adopt nothing.** Keep the AI's `length` and `tucked` for the waist credit (they're at the labels' ceiling), and keep the
  ruler in the harness as the baseline to beat.
- **Keep the waist credit as it is (v13), unless the founder decides otherwise.** The panel and his own blind ratings both prefer
  it to the stricter "tuck or crop only" version. The taste call is on his list.
- **Where this could still work: comparing two photos of the same outfit.** In his one-outfit variants (the same jeans,
  tee tucked and untucked, same spot, same camera), most of the joint error is the same in both photos and cancels
  out. Then the change in the visual waistline between them should be measurable, which is what a re-check needs to tell
  "he tucked it in". Test that when `inputs/gold-set/me/` exists: `kmeasure waist` on each pair, compare `visual_s`.
- **Don't spend more on absolute joint-based proportion measuring** (top length three times now: #170, #222, this;
  leg shape twice: #223, this).

## How to run it again

```
extraction-test/vision/build.sh
/usr/bin/python3 extraction-test/waist_test.py --out extraction-test/results/waist2
/usr/bin/python3 extraction-test/waist_paper.py
```

- Settings: `WAIST_<NAME>=value` (e.g. `WAIST_CUT=0.0`), tuned with `--fast --sets dev`.
- `WAIST_PICK=0` scores the first candidate of a two-person photo.
- `--single` scores against label pass 1 alone.

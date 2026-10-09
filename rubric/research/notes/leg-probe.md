# The leg probe: can the phone tell a pant leg's shape, better than the AI reads it?

*Oct 9, 2026. Claude (subagent). Mac harness only, not in the app, no API calls. Code: `extraction-test/vision/LegTaper.swift` (`kmeasure legs`), runner `extraction-test/leg_probe.py`, labels `extraction-test/leg_labels.csv`, results `extraction-test/results/leg1/` (per-photo numbers and every table in `report.md`; pictures of every measurement in `overlays/`, faces hidden, git-ignored).*

## Bottom line

1. **It does not beat the AI on the job the app needs (naming the shape).** Over five shapes it's right **54%** of the time when it answers (21/39) and unsure on **36%**; the AI is right **64%** on the same photos (68% on all of them). On his photos held out from tuning: 50% vs the AI's 62%.
2. **Slim vs straight (the AI's weakest call): the one promising result, on too few photos to trust.** Hem width ÷ knee width split them 9 of 10 and 11 of 12 times (each photo judged with a cut set on the others), vs the AI's 75–77% on the same photos. But only **4 straight-leg photos** could be read, the cut wanders from 0.76 to 0.91 depending on which photo is left out, and it's unsure on a third to a half of the photos.
3. **Straight vs wide: fails.** Hem ÷ knee is right 62%, opening ÷ shoe 71%, knee ÷ thigh 86% of 14 photos, but 10 of the 11 wide ones are **his own black wide jeans** (one or two pairs), only 3 are straight, and the shoe changes the answer (loafers make an opening look wide, slides make it look narrow). A straight leg and a wide leg both run parallel; telling them apart takes how much room the pants leave, which means comparing with his body, which we don't do (#164).
4. **His joggers fool it.** Elastic cuffs bunch the fabric just above the ankle, so his tapered joggers measure like straight or wide legs (hem ÷ knee 0.89–1.06). The AI also misreads them (relaxed, 8 of 9 runs).
5. **Same photo, same answer: 100%.** Resized to 1600 px it keeps the class on 95% of photos; cropped 3% on each side, only 84% (the numbers move by more than 0.02 on 60% of photos). The AI repeats itself on 81% of photos.
6. **Verdict: drop it as a replacement, don't use it as a question trigger, keep it in the harness only** and re-test slim vs straight on the gold set. Nothing in the app changes, and you won't see anything new.

## What I built

For each photo the probe finds his joints (Apple Vision body pose, the same code the fit ruler uses) and his outline (Vision's person segmentation, the same mask the app already computes), and takes the closet call's bottoms and shoe boxes. Then, on each leg:

| Measure | Where it measures | What it compares |
|---|---|---|
| Hem ÷ knee (taper) | The pants' width straight across the leg's own line (hip → knee → ankle) at the knee, and at 87% of the way to the ankle, moving up to 70% when that spot isn't the pants' color (a rolled cuff, a sock, the shoe) | Pants vs pants |
| Knee ÷ thigh | Knee as above; thigh 25% of the way down from the hip | Pants vs pants |
| Opening ÷ shoe | The pants' width just above the hem/stack (95% of the shin, moving up the same way) over the shoe's own width (his outline inside the shoe box, the widest steady row in its lower 60%, split halfway between the ankles when one box holds both shoes) | Pants vs shoe |

**The rules it keeps:**
- **Only garment against garment.** No width is ever compared with his hips, thighs or shoulders, and no body width is reported. The joints only say where to measure (each leg's line, the knee and ankle heights) and whether a spot can be trusted.
- **Widths come from his outline, not from color,** so dark pants on dark shoes still give a number. Color is used once: a spot counts only if it matches the pants' own color on his shin (never a skin color).
- **Gates, each reported as the reason for "unsure":** joint confidence under 0.3; the legs touching at that spot (the run across one leg reaches the other leg's line); an arm, wrist or hand on the leg; a top or coat hanging over the spot; the ankle at the photo's edge or the pants box ending above the hem spot; no bottoms box or no shoe box; a side view (hips nearly on top of each other, only used to skip the photo).
- **Two modes:** "strict" (touching legs = unsure) and "split" (a touching run is cut halfway between the two legs' lines, a guess at the inner edge). At the thigh the legs almost always touch, so knee ÷ thigh only exists in split mode.
- About 0.7 s per photo on the Mac. No new packages, models or downloads.

## The test

- **75 photos** (the fit ruler's set plus his 3 newer Oct 9 checks): his 20 phone checks (17 of him, 3 of two friends: the chore coat + white tee friend, twice, and the navy blazer friend), his 4 Oct 7 photos, the 12 web mirror selfies, 39 stock photos (s18 has two people, so the app refuses it). 61 have a readable five-shape label; the rest are shorts, seated, legs out of frame, or flares.
- **Labels: made before the probe ever ran, blind to it and to the AI** (`leg_labels.csv`, file written 19:03 on Oct 9; the first probe run came after). I looked at each face-hidden lower-body close-up and wrote the leg shape (skinny / slim / straight / relaxed / wide, "a|b" when it sits between two, "unsure" freely) and the hem. His Oct 8 photos agree with `inputs/phone-oct8/truth.csv` (wide jeans, slim joggers). One labeler (me), not ground truth.
- **Who's in each photo (rule 7):** the founder (profile pending: he hasn't given his birth year or looks yet), two friends (profile unknown), stock and web photos (profile unknown). The probe uses no profile and leg shape never depends on one. The AI readings were made earlier (Oct 8, `zoom1` / `zoom1-stock` arm B, 3 runs, close-ups on, the app's config; his Oct 9 photos use his phone's single reading), under the old invented "Minimal + Smart casual" test profile. Results below are split by photo group and person, since no real profiles exist yet; no age bands are possible.
- **Tuning:** the five-shape cuts were set on the stock and mirror photos and scored once on his photos. The two-way questions were also run leave-one-out over every photo (each photo judged with the best cut fit on all the others).
- **Weak spots of the set:** his 17 photos are mostly one pair of wide black jeans and one pair of joggers; 6 of his checks predate the closet call, so they have no boxes and the probe is unsure on them by rule.

## Results

### How each measure spreads by label

Every photo it could measure, gates off (split mode; "n/N" = measured of labeled):

| Measure | skinny | slim | straight | relaxed | wide |
|---|---|---|---|---|---|
| Hem ÷ knee | 0.59–0.97 (median 0.72) | 0.56–1.09 (0.72) | 0.59–1.07 (0.85) | 0.61–1.22 (0.72) | 0.65–1.05 (0.89) |
| Knee ÷ thigh | 0.48 (1 photo) | 0.49–0.85 (0.67) | 0.60–0.88 (0.72) | 0.69–0.89 (0.87) | 0.73–0.99 (0.80) |
| Opening ÷ shoe | 0.65–0.99 (0.81) | 0.64–0.97 (0.77) | 0.93–1.37 (1.17) | 0.37–1.79 (1.05) | 1.06–1.48 (1.30) |

The medians move the right way (narrower legs taper more and have smaller openings), but every range overlaps its neighbors. **Opening ÷ shoe is the clearest single line: below about 0.93 is slim or narrower, above is straight or fuller.** Relaxed is all over the place (it's roomy at the thigh and tapers, which reads like slim on taper and like wide on opening).

### Five shapes

Best simple rule: opening ÷ shoe below 0.88 → slim (skinny if hem ÷ knee is under 0.59); 0.88–1.38 → straight; above 1.38 → wide (relaxed only if hem ÷ knee is under 0.60, which almost never happens: the rule can't find relaxed at all). Tuned on the dev photos.

| Photos | Labeled | Probe right when sure | Unsure | AI right, same photos | AI right, all |
|---|---|---|---|---|---|
| Dev (stock + web mirror, tuned on) | 37 | 14/25 (56%) | 32% | 65% | 72% |
| Test (his phone + Oct 7, held out) | 24 | 7/14 (50%) | 42% | 62% | 60% |
| All | 61 | **21/39 (54%)** | **36%** | **64%** | 68% |
| All, cuts fit on all of them (an upper bound) | 61 | 24/39 (62%) | 36% | 64% | 68% |

Even fit to the answers, it only ties the AI. By group: web mirror selfies 7/8 (AI 71% on the same photos); stock 7/17 (AI 63%); his own photos 4/11 (AI 58%: it calls most of his wide jeans straight); his friends 3/3 (AI 3/3).

The most common miss: **wide read as straight (8 photos)**, relaxed read as slim or straight (6), slim read as straight (2).

### Two questions (leave-one-out, every labeled photo on a clear side)

| Question | Measure | Probe right when sure | Unsure | AI right, same photos |
|---|---|---|---|---|
| Slim or narrower vs straight or fuller | Opening ÷ shoe (strict) | 30/32 (94%) | 42% | 89% |
| | Hem ÷ knee (strict) | 30/32 (94%) | 42% | 89% |
| | Hem ÷ knee (split) | 33/41 (80%) | 25% | 90% |
| **Slim vs straight** | Hem ÷ knee (split) | **11/12 (92%)** | 33% | **75%** |
| | Opening ÷ shoe (split) | 9/10 (90%) | 44% | 77% |
| Straight vs wide | Hem ÷ knee | 10/16 (62%) | 24% | 58% |
| | Opening ÷ shoe | 10/14 (71%) | 33% | 59% |
| | Knee ÷ thigh (split) | 12/14 (86%) | 33% | 58% |

- **Slim vs straight** is where it looks better than the AI, but the photos are 8 slim and only 4 straight (3 web mirror selfies and his Oct 7 navy trousers, which it got wrong at 0.77, right on the line). The slim legs measured 0.56–0.72, the straights 0.77–1.07. One more straight pair at 0.72 would erase the gap. **Not enough to act on; enough to re-test.**
- **Straight vs wide** numbers look better than the AI only because the AI calls wide legs "relaxed" or "straight" on 15 of its 35 runs, mostly his jeans. The probe isn't telling the shapes apart so much as recognizing his jeans 10 times. On the 4 photos outside his phone checks it got 1 of 4.
- **Slim vs fuller** ties the AI at best (the AI is already ~90% there).

### Unsure, and why

For the five-shape rule (which needs opening ÷ shoe) it's unsure on 22 of 61 photos: no shoe box 7 (the closet call didn't box his shoes, or boxed only one), the hip or knee joint under the confidence bar 6 (his Oct 7 mirror photos with the phone arm up, seated stock photos), no bottoms box 6 (his checks from before the closet call), the ankle not found 2. In strict mode, legs touching is the biggest reason at the thigh and a common one at the hem of wide pants.

### Dark on dark, and mirror selfies

- **Dark on dark works mechanically:** the widths come from his outline, so his black jeans on black slides (1f1997, d58b14) and the black stock trousers on a black background (s03) all give numbers, where the fit ruler's color walk found nothing. The numbers aren't more right, though: d58b14's wide pants read 1.06 on opening ÷ shoe (slides look wide from the front), which is "straight".
- **Mirror selfies work as well as anything else:** all his phone checks are mirror shots, plus the 12 web ones. One built-in bias to know: with the phone at chest height the ankles are farther from the lens than the knees, so the hem looks a few percent narrower than it is (about 8% at 2 m by simple geometry). That pushes mirror shots toward "tapered". The web mirror selfies still came out best (7/8), so the bias isn't the main problem on this set, but a cut tuned on propped photos would drift on mirror ones.

### Repeatability

| Run | Same class as the first run | Numbers within ±0.02 |
|---|---|---|
| Again, same photo | 61/61 (100%) | 100% |
| Decoded at 1600 px instead of 2048 | 58/61 (95%) | 78% |
| 3% cropped off every side | 51/61 (84%) | 40% |

The AI gave the same leg shape on all its runs for 42 of 52 photos (81%).

## Why it fails (examples; pictures in `results/leg1/overlays/`)

1. **Straight and wide have the same taper.** Both run parallel from knee to hem (his wide jeans: hem ÷ knee 0.83–1.05; straight legs: 0.77–1.07). What makes a leg "wide" is the room it leaves around the leg, and the only garment-only proxy, the opening against the shoe, depends on the shoe: loafers and dress shoes are narrow from the front (m02's cropped straight trousers read 1.37), slides and chunky sneakers are wide (d58b14's wide pants read 1.06).
2. **Joggers and cuffs.** Elastic cuffs bunch fabric just above the ankle, right where the hem is measured (his joggers 0.89–1.06, "straight or wider"). Rolled cuffs and raw hems fail the color check and push the spot up the shin, where a slim leg is wider.
3. **Legs touch.** At the thigh nearly always; at the hem for wide pants in a narrow stance, and in side views or crossed legs (s04, s16, s26, p01). Cutting halfway between the legs gives a number, but a guessed one (split mode is less accurate than strict on every question).
4. **Hands and coats.** A hand in a pocket or hanging beside the thigh, and a long top or coat over the thigh, block the thigh sample on many photos.
5. **The closet call's boxes are missing or partial.** No shoe box, or one box for one shoe only, takes away the opening ÷ shoe measure.
6. **Small figures.** In his full-length mirror shots a leg is about 25–30 px wide in the measuring copy, so a 1 px edge error is 3–4% of the ratio, about the size of the slim/straight gap.

## Recommendation

- **Drop it as a replacement for the AI's `leg_shape`.** It names the shape less often right than the AI (54% vs 64%) and is unsure a third of the time.
- **Don't use it as a "slim or straight?" question trigger.** Workstream A already decided not to ask fit questions, because people answer fuzzy questions in their own favour (DECISIONS-LOG #121–124); a probe disagreeing with the AI wouldn't change that.
- **Don't use it as a tie-breaker either, yet.** The AI has no leg-shape certainty to break ties on, and the one place the probe looked better (slim vs straight) rests on 4 straight photos.
- **Keep it in the harness only, as the baseline for the gold set.** Re-test slim vs straight when the gold set and the size-ladder shoot (#164) exist; it needs at least 15 distinct slim and 15 distinct straight pairs, propped and mirror, to mean anything. It would earn a shadow log on the phone only if hem ÷ knee beats the AI there with unsure ≤ 20%. Add labels for joggers vs jeans (cuffs need their own rule) and for the shoe type (opening ÷ shoe needs a per-shoe cut, or it isn't usable).
- **Leave `LegShapeProbe.swift` (knee ÷ hip span) where it is:** it's against the founder's rule (#164) and is kept only to reproduce #106.

## How to run it again

```
extraction-test/vision/build.sh
/usr/bin/python3 extraction-test/leg_probe.py --out extraction-test/results/leg2
```

Labels for new photos go in `extraction-test/leg_labels.csv` (make them before the run). `--fast` runs the base pass only; `--report <folder>` re-analyzes. Settings: `LEG_HEM_T` (hem spot, 0.87 of the shin), `LEG_THIGH_T` (thigh spot, 0.25 of hip → knee), `LEG_SAME` (pants-color match, ΔE 18). One `kmeasure legs <photo> <out.json> --boxes <garments.json> [--overlay out.jpg]` call per photo.

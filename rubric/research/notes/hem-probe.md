# The hem probe (M2): can the phone tell how the pants end at the shoe, better than the AI reads it?

*Oct 10, 2026. Claude (subagent). This ran on the Mac harness only. It isn't in the app, made no API calls and sent no photos anywhere. Code: `extraction-test/vision/HemProbe.swift` (`kmeasure hems`), runner and analysis `extraction-test/hem_probe.py`, labels `extraction-test/hem_labels.csv`. Results are in `extraction-test/results/hem1/`: the numbers for each photo and every table are in `report.md`. Pictures of every measurement are in `overlays/`; they're cropped from the knee down on the face-hidden copy and git-ignored.*

## Bottom line

1. **It doesn't beat the AI at heavy vs light.** "Heavy" means a full break, a stack or pooling; "light" means no break, a slight break or cropped. Scored the honest way (the measure, its cut and its direction are all chosen without the photo being judged), the probe is right on **65%** of the photos it answers (22/34) and unsure on **32%**. The AI is right on **75%** of its runs on the same photos, and 74% overall.
2. **Six classes: it doesn't beat the AI either.** It's right on 57% of the photos it answers (21/37) and unsure on 36%. The AI is right on 62% on the same photos. On his own phone checks it's 60% against the AI's 53%, which is too few photos to call a win.
3. **Folds above the hem, the main idea, don't work on this set.** On his black jeans the fabric is too dark to show any fold shading (L\* 2–8 on the shin), so the fold measures are unsure on 60% of photos. Elastic jogger cuffs and rolled hems make the same light and dark bands as a stack. The one useful fold reading (fold contrast) is right on 80% of the 20 photos it answers, against the AI's 83% on those same photos.
4. **Stacked vs pooling can't be tested.** Only 1 photo is clearly "stacked" and nothing else (s10, black jeans on black boots, where the probe is unsure). No photo is clearly pooling. The probe never answers "stacked", so it can't supply the planned `stacked` value.
5. **One promising result, on too narrow a set: where the hem sits along the shin.** The probe finds the point where the pants' color ends, measured as a share of knee → ankle (1.0 is the ankle joint). On photos with a shoe box, a hem more than 11% of the shin below the ankle joint means heavy. That's right on **20 of 22** photos, against the AI's **67%** on the same ones, but it's **unsure on 56%**. Also, 7 of its 11 heavy answers are the founder's one or two pairs of black wide jeans. Used as a tie-breaker when the AI says "slight break", it would lift the AI's runs from 74% to 81% right (13 fixed, 3 broken).
6. **The friend's blazer photo (FC-02089755): the probe reads it as light, like the AI, so rule A2 still wouldn't fire.** It can't find the hem on the stacked back leg. The front leg's hem sits at the ankle joint with the whole chukka showing below it.
7. **The same photo gives the same answer every time.** Decoded at 1600 px it gives the same heavy/light answer on 93% of photos; with 3% cropped off each side, 86%. The AI gives the same `hem` on all its runs for 71% of photos.
8. **Verdict: drop the fold and shoe-cover measures. Keep the hem position as a shadow log in the harness only. Don't adopt anything.** It fails the takeover bar: unsure is 56%, not 30% or less, and the 91% rests mostly on one pair of his jeans. Re-test the hem position on the gold set. Nothing in the app changes, and you won't see anything new.

## What I built

For each leg the probe takes his knee and ankle joints (Apple Vision body pose, the same code as the fit ruler and the leg probe), his outline (Vision's person segmentation) and the closet call's shoe boxes. All of it is measured on the face-hidden copy at the working size (2048 px). It steps one pixel at a time down the leg's own line, from the knee past the ankle to the sole, and records his outline's width across the leg and the colors in its middle.

| Measure | What it looks at | Compared with |
|---|---|---|
| **Hem edge** (tHem) | The one place, between 0.6 of the shin and the middle of the shoe box, where the colors along the leg change most. It's checked: above must look like the pants, below must not. | A position along his own shin (1 = the ankle joint) |
| **Folds** (foldRatio, foldStd, folds, orientRatio) | In the last 22% of the shin above the hem edge: the fabric's brightness along the leg, smoothed and detrended. Folds across the leg show as light/dark bands. Also counted: the bands themselves, and how much of the edge detail runs across the leg | The same leg's own mid-shin (fabric against itself) |
| **Fabric over the shoe** (shoeVisToW, gapT, coverBox) | Below the hem edge: whether a sock or skin gap comes before the shoe's own colors (from its box), and how much shoe shows down to the sole | The shoe's own width (shoe against shoe); the gap as a share of the shin |
| **Spread** | The pants' width just above the hem against their width 22–30% of the shin higher up | Pants against pants |

**The rules it keeps:**
- **Garment against garment only (#164).** No width is ever compared with his body. Joints only say *where* to measure (the leg's line, and how far along it) and whether a spot can be trusted.
- **Gates, each reported as the reason for "unsure":**
  - knee or ankle joint under 0.3 confidence, or the ankle at the photo's edge;
  - a leg under 90 px (too small), or the knee bent more than 35° (seated, striding);
  - no pants color on the shin, or no clear hem edge;
  - no shoe box;
  - pants and shoes within ΔE 12 of each other (dark on dark);
  - pants too dark to show folds (L\* under 6);
  - a hand or coat in the region, or a blurry shoe region;
  - feet cut off.
  Each measure only uses the gates that spoil it (a too-dark fold window doesn't stop the hem edge, for example).
- **Directions were fixed before the run:** more folds, less shoe showing, a lower hem and a wider bottom all mean heavier. Only the cuts were fit, always leave-one-out.
- About 0.4 s per photo on the Mac. No new packages, models or downloads.

## The test

- **75 photos**, the same set as the leg probe (s18 has two people, so the app refuses it):
  - his 20 phone checks: 17 of him, 3 of two friends (the chore coat + white tee friend twice, the navy blazer friend once);
  - his 4 Oct 7 photos;
  - the 12 web mirror selfies;
  - 39 stock photos.
- **58 have a hem label. 50 are clearly heavy (24) or light (26);** the rest sit between slight and full break, or show no shoes.
- **Labels: written before the probe existed, blind to it and to the AI.** `hem_labels.csv` was written at 17:05 on Oct 10, before `HemProbe.swift` was created. I looked at the face-hidden lower close-up of every photo. "a|b" means either is acceptable, and I used "unsure" freely. Two things to know:
  - The task brief told me the AI had read the friend's stack as "slight break". I labeled that photo from the close-up anyway (stacked|full).
  - One labeler (me), so these aren't ground truth.
- **Where my labels differ from the earlier ones:**
  - m01 and m12 are cropped|no break (`ruler_labels`: slight break).
  - s10 is stacked (`ruler_labels`: no/slight break).
  - Three of his wide-jeans checks are full break|stacked (`leg_labels`: stacked; `ruler_labels`: full).
  - The friends' straight jeans are slight|full (both earlier files: slight).
  - The navy blazer photo is stacked|full (`leg_labels`: full).
  - All 11 of his Oct 8 hems agree with `truth.csv`. Jogger cuffs count as cropped.
- **What I looked at while building the mechanics:**
  - I debugged the edge finder on 10 stock photos (s03, s05, s07, s09, s10, s12, s13, s14, s16, p02).
  - I also smoke-tested on the friend's photo and one of his jogger checks.
  - I changed how the edge and the shoe's colors are found after seeing those overlays. I also added the too-dark gate after seeing his black jeans measure L\* 2–8. That gate makes the probe unsure more often; it doesn't make it more accurate.
  - The heavy/light cuts were never fit on the photo being judged.
- **Who's in each photo (rule 7):**
  - The founder: profile pending (no birth year or picked looks yet).
  - The two friends: profile unknown.
  - Stock and web photos: profile unknown.
  - The probe uses no profile, and a hem reading doesn't depend on one. No age bands are possible.
  - The AI readings are the zoom1 / zoom1-stock arm B runs (3 runs, close-ups on, the app's config), plus his phone's own single reading for the Oct 9 checks. They were made under the old invented "Minimal + Smart casual" test profile.
  - Results below are split by photo group and by person.
- **The AI's values:** `cuffed` counts as cropped. The AI has no `stacked` value, so on six classes it can only be right about a stack when the label also accepts full break.

## Results

### How each measure spreads by label (gates on; range and median)

| Measure | no break | slight break | full break | stacked | cropped |
|---|---|---|---|---|---|
| Hem edge (tHem, 1 = ankle joint) | 1.07 (2 photos) | 1.04–1.08 | 1.13–1.25 (med 1.20) | 0.99–1.15 | 0.94–1.14 (med 1.03) |
| Shoe showing ÷ shoe width | 1.31–1.49 | 1.10–1.20 | 0.95–1.17 (med 1.08) | 0.74–1.90 | 1.04–2.15 (med 1.55) |
| Fold contrast vs mid-shin | 1.4–2.2 | 1.8–12.2 (med 4.5) | 2.5–10.3 (4 photos) | 0.8–5.0 | 1.2–8.5 (med 5.7) |
| Spread (bottom ÷ higher up) | 0.90–0.99 | 0.79–0.97 | 0.81–1.36 (med 0.91) | 1.02 | 0.58–1.40 |

- **The hem edge's position is the cleanest line.** Full breaks sit 13–25% of the shin below the ankle joint; light hems sit at or just below it.
- **Fold contrast points the wrong way.** Cropped hems score higher than full breaks, because rolled cuffs and elastic jogger cuffs make bands too.
- **Spread separates nothing.**
- **The hem's position against the shoe box** (coverBox, the fit ruler's reference) is right only 24% of the time. That's the fit ruler's finding again: the box's top is a poor ruler. His own ankle joint works better.

### Heavy vs light (leave-one-out; AI = every AI run on the same photos)

| Measure | Probe right when sure | Unsure | AI right, same photos |
|---|---|---|---|
| Hem edge position (tHem), shoe box required | **20/22 (91%)** | 56% | **67%** |
| Hem edge position, any photo with a clear edge | 23/32 (72%) | 36% | 73% |
| Shoe showing ÷ shoe width | 17/21 (81%) | 58% | 65% |
| Fold contrast (std) | 16/20 (80%) | 60% | 83% |
| Fold count | 15/20 (75%) | 60% | 83% |
| Sock/skin gap | 13/22 (59%) | 56% | 67% |
| Spread | 11/33 (33%) | 34% | 74% |
| Hem position vs the shoe box's top | 5/21 (24%) | 58% | 65% |
| Pairs: "folds or shoe showing" / "folds or hem position" | 23/28 (82%) / 25/34 (74%) | 44% / 32% | 75% / 75% |
| **Honest: the measure or pair also chosen without the held-out photo** | **22/34 (65%)** | **32%** | **75%** |

The honest procedure picked "fold contrast or hem position" 48 times out of 50. Its fold cut is so high that it's really the hem position alone, with photos that have no clear edge counted as light. That's why it scores below the hem position measured on its own.

The 91% is the best single result after looking at 9 measures, so expect it to drop on new photos. Its cut stays put, though: 1.105–1.118 whichever photo is left out.

**By group (the hem position, shoe box required):**

| Group | Probe | AI, same photos |
|---|---|---|
| His phone checks | 7/8 (all heavy: his wide jeans, plus the friend's photo, which it got wrong) | 6/16 runs (38%) |
| Web mirror selfies | 4/4 (all light) | 12/12 |
| Stock | 9/10 | 21/30 (70%) |
| The founder | 7/7 | 6/15 (40%) |
| Everyone else | 13/15 | 33/43 (77%) |

The win is on his own wide black jeans. The AI calls them "slight break" in 21 of its readings, and the probe sees the hem resting 18–25% of the shin below his ankle. None of his light hems got an answer with a box. His jogger checks come from before the closet call, so they have no shoe box, and his Oct 7 trousers were unsure. That means **there isn't a single light photo of his** to show whether it would wrongly call his light hems heavy. Without a box his joggers measure 1.20–1.24: the edge runs on through his black socks to the slide. So it would call them heavy.

**As a tie-breaker:** when an AI run says "slight break" and the hem position is sure, use the probe's heavy/light. Over every AI run, right answers go **from 100/135 (74%) to 110/135 (81%)**. Of the 16 changes, 13 are fixes: his jeans, and the stock full breaks and stacks. The other 3 are mistakes: cream sweatpants with an elastic cuff bunched on sneakers (p02), all 3 runs. That's +7 points, under the bar's +10, and the cut was fit on these same photos.

### Six classes

The rule is:
- a sock/skin gap → cropped;
- otherwise the heavy/light pick: heavy → stacked if there are enough folds, else full break; light → slight break.

Every cut is fit without the held-out photo.

| | Probe right when sure | Unsure | AI right, same photos | AI right, all |
|---|---|---|---|---|
| All | 21/37 (57%) | 36% | 62% | 66% |
| His phone checks | 9/15 (60%) | 25% | 53% | 49% |
| Web mirror selfies | 2/6 | 33% | 67% | 78% |
| Stock | 9/15 (60%) | 40% | 64% | 65% |

It answered full break 23 times, slight break 12 times and cropped twice. It never said stacked, pooling or no break: there were no clear examples to fit those cuts on, and nothing measured separates no break from slight. The gap measure almost never finds a sock: a rolled cuff, a sock the same color as the pants, or an ankle shadow all read as "the shoe starts here".

### Why it's unsure

- **Folds:** pants too dark to show folds 14, no clear hem edge 13, joints not found 3 (judged photos).
- **Shoe cover:** dark on dark 10, no shoe box 9 (his 7 checks from before the closet call, and 2 web photos), joints 3, no hem edge 3, too small 2, leg bent 1, feet cut off 1.
- **The final pick:** no hem edge 13, joints 4, too dark 3, too small 1.
- **No hem edge** means the pants and shoe colors are too close to split: black trousers on black dress shoes (s03, p03, oct7-ph3, m08), the friends' dark jeans on dark suede, grey chinos on grey sneakers (s14), dark scenes (s12).
- Leaving out his 7 checks from before the closet call (every check has boxes now), the honest procedure is still unsure on 37%.

### Dark on dark, mirror selfies, propped shots

- **Dark on dark:** this is where it gives up. His black jeans on black slides (1f1997, d58b14), the friends' jeans on suede, and every black-on-black stock photo are unsure. On dark pants overall it's sure on 61% and right on 65% of those, against the AI's 69%.
- **Mirror selfies** (his phone, Oct 7, web): sure 73%, right 58% (AI 72%).
- **Propped / photographer shots:** sure 62%, right 73% (AI 76%).
- The hem position held on both kinds (11 of 12 mirror, 9 of 10 stock, box required). But all the heavy mirror selfies are his jeans, and every judged web mirror selfie is light.

### Repeatability

| Run | Same heavy/light answer (the honest pick) | Hem position: same answer | Hem position moves (median, max) |
|---|---|---|---|
| Again, same photo | 100% | 100% | 0, 0 |
| Decoded at 1600 px | 93% | 97% | 0.004, 0.022 of the shin |
| 3% cropped off each side | 86% | 88% | 0.015, 0.08 of the shin |

The AI gave the same `hem` on all its runs for 35 of 49 photos (71%).

## The friend's blazer photo (FC-02089755, `phone-d1967f`)

- **The photo:** navy blazer, light-wash loose jeans, grey suede chukkas. It's a landscape shot of him from the waist down, taken by someone else (not a mirror).
- **My label:** stacked|full break. The back leg stacks in several folds above the chukka; the front leg breaks fully, with the hem turned.
- **What the probe says:**
  - **Back (stacked) leg: no hem edge.** Shaded light denim against grey suede gives a color step of only ΔE 8, under the bar of 12. This is the leg that matters, and the probe can't read it.
  - **Front leg:**
    - the hem edge sits at 0.99 of the shin (right at the ankle joint);
    - the whole chukka shows below it (1.9× the shoe's width);
    - the fold contrast is 0.75 of mid-shin (no stack);
    - the hem edge it found is the line between the light denim and the turned-up hem's darker inside, not the bottom of the jeans.
  - **The probe's answer: light (slight break).** The AI's single reading said slight break too.
- **Rule A2 (a heavy hem under a tailored jacket) would not fire,** with the probe or with the AI. Even as a tie-breaker, the hem position (0.99) is on the light side of the 1.11 cut.

## Why it fails (pictures in `results/hem1/overlays/`)

1. **Black denim shows no folds in a phone photo.** His wide jeans measure L\* 2–8 on the shin, and JPEG crushes the fold shading to noise. Folds would need texture (light-wash denim, chinos), and those are exactly what the gold set has to bring.
2. **Cuffs look like stacks.** Elastic jogger cuffs, rolled hems and raw edges all make horizontal bands just above the hem edge. Fold contrast scores cropped hems higher than full breaks.
3. **Dark on dark has no edge.** When pants and shoes are within ΔE 12, nothing along the leg tells where one ends. A black sock between black joggers and black slides reads as part of the pants.
4. **Multi-colored shoes confuse the "shoe starts" step,** so the sock/skin gap that should mark a cropped hem is rarely found (leopard uppers, white soles under grey mesh, slides with white stripes).
5. **Where the hem sits works only once the edge is found,** and it's measured against the ankle joint, which Vision places by guess when wide jeans hide the ankle. It's repeatable, but the population behind it is narrow.
6. **The labels are thin where the rules need them:** 1 clear stack, 0 clear pooling, his heavy hems all one or two pairs of jeans, no light check of his with a shoe box.

## Recommendation

- **Don't adopt anything.**
  - The honest heavy-vs-light number loses to the AI (65% vs 75%).
  - The six-class number loses too (57% vs 62%).
  - The one strong result (the hem position, 91% vs 67%) is unsure on 56% of photos, against a bar of 30% or less.
  - That result rests mostly on one pair of his jeans, and it can't produce `stacked` or `pooling` at all.
- **Drop the fold measures and the shoe-cover measures** (shoe showing, sock gap, position against the box) as readings. Don't redo them on this set.
- **Keep the hem position (tHem) as a shadow log in the harness only.** Re-test it on the gold set as a tie-breaker for the AI's "slight break". It would earn a shadow log on the phone only if, on the gold set:
  - it beats the AI by 10+ points on heavy vs light;
  - it's unsure on at most 30% of photos;
  - it holds on his own light hems (taken with the closet call on).

  It needs a shoe box, which every check now has.
- **The blazer-hem rule (A2) still has no reading to fire on.** The probe doesn't fix that. Ship A2 only with a reading that can see a stack: a better AI cue, or the gold set telling us how often it's needed.
- **What the gold set needs for this:**
  - at least 15 heavy and 15 light distinct pants;
  - light-wash and mid-color jeans that stack on purpose, and chinos or trousers that pool;
  - joggers with black socks, and the same jeans hemmed two ways if possible;
  - all with the closet call on, mirror and propped.
- **One thing for the app, if this ever reaches it:** the probe takes the shin's color as "the pants". On shorts that's skin. It must run only when the AI reads long pants, and it must never treat skin color as a measurement.

## How to run it again

```
extraction-test/vision/build.sh
/usr/bin/python3 extraction-test/hem_probe.py --out extraction-test/results/hem2
```

- **New labels** go in `extraction-test/hem_labels.csv`. Make them before the run.
- **Options:** `--fast` runs the base pass only; `--report <folder>` re-analyzes an existing run; `--only <ids>` runs a few photos and prints their numbers.
- **One call per photo:** `kmeasure hems <photo> <out.json> --boxes <garments.json> [--overlay out.jpg] [--max px] [--crop share]`.
- **Settings** (in `HemProbe.swift`):
  - `pantsDE` 16, `shoeDE` 18, `sameDE` 12 (ΔE, kL 1);
  - fold window 22% of the shin above the hem, stopping 2.5% short of it;
  - `darkL` 6;
  - `minShin` 90 px, `maxBend` 35°.
- **Environment overrides:** `HEM_PANTS_DE`, `HEM_WIN`.

# Leg probe

Run: leg1. Labels: `leg_labels.csv` (Claude subagent, Oct 9, before the probe ran). AI = zoom1 / zoom1-stock arm B (3 runs, close-ups on) or the phone's own reading (1 run). 'a|b' labels accept either.

## Ranges per label (strict)

| Measure | skinny | slim | straight | relaxed | wide | flare |
|---|---|---|---|---|---|---|
| hem ÷ knee | 3/5: 0.59–0.72 (med 0.71) | 11/17: 0.60–1.06 (med 0.73) | 10/14: 0.59–1.07 (med 0.90) | 3/9: 0.85–1.22 (med 1.06) | 14/16: 0.65–1.05 (med 0.92) | 1/2: 1.25–1.25 (med 1.25) |
| knee ÷ thigh | 0/5: – | 0/17: – | 0/14: – | 0/9: – | 0/16: – | 0/2: – |
| opening ÷ shoe | 4/5: 0.65–0.99 (med 0.81) | 9/17: 0.64–0.97 (med 0.76) | 7/14: 0.93–1.37 (med 1.01) | 4/9: 1.05–1.79 (med 1.34) | 11/16: 1.06–1.48 (med 1.30) | 1/2: 1.38–1.38 (med 1.38) |

## Ranges per label (split)

| Measure | skinny | slim | straight | relaxed | wide | flare |
|---|---|---|---|---|---|---|
| hem ÷ knee | 4/5: 0.59–0.97 (med 0.72) | 14/17: 0.56–1.09 (med 0.72) | 11/14: 0.59–1.07 (med 0.85) | 8/9: 0.61–1.22 (med 0.72) | 15/16: 0.65–1.05 (med 0.89) | 2/2: 1.10–1.25 (med 1.25) |
| knee ÷ thigh | 1/5: 0.48–0.48 (med 0.48) | 12/17: 0.49–0.85 (med 0.67) | 10/14: 0.60–0.88 (med 0.72) | 6/9: 0.69–0.89 (med 0.87) | 13/16: 0.73–0.99 (med 0.80) | 0/2: – |
| opening ÷ shoe | 4/5: 0.65–0.99 (med 0.81) | 10/17: 0.64–0.97 (med 0.77) | 8/14: 0.93–1.37 (med 1.17) | 7/9: 0.37–1.79 (med 1.05) | 11/16: 1.06–1.48 (med 1.30) | 1/2: 1.38–1.38 (med 1.38) |

## Every labeled photo (base run, split mode)

| Photo | Group | Label | Hem | hem÷knee | knee÷thigh | open÷shoe | unsure because | AI runs |
|---|---|---|---|---|---|---|---|---|
| mirror-m01 | mirror | slim|straight | cropped | 0.88 | 0.67 | 0.81 |  | straight/straight/straight |
| mirror-m02 | mirror | straight | cropped | 1.07 | 0.72 | 1.37 |  | straight/straight/wide |
| mirror-m03 | mirror | straight|relaxed | full | 0.85 | 0.88 | 1.29 |  | straight/relaxed/relaxed |
| mirror-m05 | mirror | slim | slight | 0.66 | 0.64 | 0.87 |  | straight/straight/straight |
| mirror-m06 | mirror | straight | full | 0.97 | 0.60 | – | no shoe box | straight/straight/straight |
| mirror-m07 | mirror | straight | slight | 0.91 | 0.77 | 1.17 |  | straight/straight/straight |
| mirror-m08 | mirror | straight|relaxed | slight | 0.82 | – | 1.01 | legs merged | slim/slim/slim |
| mirror-m10 | mirror | straight|slim | slight | 0.59 | – | – | no shoe box; top hangs over it | straight/straight/straight |
| mirror-m11 | mirror | slim | slight | 0.68 | 0.65 | 0.76 |  | slim/slim/slim |
| mirror-m12 | mirror | relaxed | slight | 0.85 | 0.87 | 1.05 |  | relaxed/relaxed/relaxed |
| oct7-ph1 | oct7 | wide | full | – | – | – | hip or knee | wide/wide/wide |
| oct7-ph2 | oct7 | straight|slim | slight | – | – | – | hip or knee | straight/slim/slim |
| oct7-ph3 | oct7 | straight | slight | 0.77 | 0.71 | 0.96 |  | straight/straight/straight |
| oct7-ph4 | oct7 | relaxed|straight | full | – | – | – | hip or knee | straight/straight/straight |
| phone-0d39d6 | phone | wide | full | 0.86 | 0.86 | – | no shoe box | wide/wide/wide |
| phone-1f1997 | phone | wide | full | 0.85 | 0.88 | 1.48 |  | wide |
| phone-403ade | phone | wide | stacked | 1.05 | – | 1.45 | arm or hand on the leg | wide |
| phone-5a9049 | phone | wide | full | 0.93 | 0.88 | – | no shoe box | wide/wide/wide |
| phone-6b14db | phone | slim | cropped | 0.89 | 0.64 | – | no shoe box | relaxed/slim/relaxed |
| phone-7de605 | phone | slim | cropped | 0.97 | 0.54 | – | no shoe box | relaxed/relaxed/relaxed |
| phone-7f14a4 | phone | wide | full | 0.92 | 0.91 | – | no shoe box |  |
| phone-8ad378 | phone | wide | stacked | 1.02 | 0.73 | 1.40 |  | wide |
| phone-8bc29d | phone | wide | full | 0.93 | 0.73 | 1.21 |  | relaxed/straight/straight |
| phone-968016 | phone | wide | stacked | 1.03 | 0.73 | 1.33 |  | wide |
| phone-a765e8 | phone | slim | cropped | 1.06 | 0.49 | – | no shoe box | relaxed/relaxed/relaxed |
| phone-b0f0c8 | phone | wide | full | 0.94 | 0.77 | 1.30 |  | relaxed/relaxed/relaxed |
| phone-d1967f | phone | relaxed|straight | full | 0.72 | 0.89 | 1.26 |  | relaxed |
| phone-d58b14 | phone | wide | full | 0.83 | – | 1.06 | arm or hand on the leg | straight |
| phone-d6559a | phone | wide | full | 0.87 | 0.80 | – | no shoe box | straight/relaxed/relaxed |
| phone-d918c0 | phone | wide | full | 0.86 | 0.87 | 1.20 |  | wide/wide/wide |
| phone-e026de | phone | wide | full | 0.89 | 0.80 | 1.30 |  | wide/wide/wide |
| phone-f07193 | phone | wide | full | 0.87 | 0.75 | 1.21 |  | relaxed/relaxed/straight |
| phone-f4870b | phone | straight|relaxed | slight | 0.90 | 0.61 | 0.93 |  | straight |
| phone-fb0b17 | phone | straight|relaxed | slight | 0.96 | 0.64 | 1.26 |  | straight |
| stock-p01-after_studio | stock | slim | slight | 0.56 | 0.85 | – | no shoe box | straight/straight/slim |
| stock-p01-before_studio | stock | slim | cropped | 0.65 | 0.69 | – | no shoe box | slim/slim/slim |
| stock-p02-after_studio | stock | relaxed | cropped | 1.22 | 0.69 | 1.79 |  | relaxed/relaxed/relaxed |
| stock-p02-before_studio | stock | relaxed | cropped | 1.06 | – | 1.34 | arm or hand on the leg | relaxed/relaxed/relaxed |
| stock-p03-after_street | stock | skinny | slight | 0.59 | – | 0.80 | top hangs over it | slim/slim/slim |
| stock-p03-before_street | stock | skinny | none | 0.71 | – | 0.81 | arm or hand on the leg | skinny/skinny/skinny |
| stock-s01-before_studio | stock | flare | full | 1.25 | – | 1.38 | top hangs over it | flare/flare/flare |
| stock-s03-before_studio | stock | slim | slight | 0.59 | 0.71 | 0.91 |  | slim/slim/slim |
| stock-s04-before_studio | stock | relaxed | cropped | 0.61 | – | 0.37 | arm or hand on the leg | straight/straight/straight |
| stock-s05-before_studio | stock | slim | cropped | 0.72 | 0.70 | 0.77 |  | slim/slim/slim |
| stock-s06-before_studio | stock | slim | cropped | 0.60 | 0.60 | 0.68 |  | slim/slim/slim |
| stock-s07-before_studio | stock | slim|straight | slight | 0.73 | 0.77 | 0.97 |  | slim/slim/slim |
| stock-s08-before_studio | stock | flare | full | 1.10 | – | – | shoe fills its half of the box; top hangs over it | flare/flare/flare |
| stock-s09-before_street | stock | skinny | cropped | 0.72 | – | 0.99 | top hangs over it | skinny/skinny/skinny |
| stock-s10-before_street | stock | skinny | stacked | 0.97 | 0.48 | 0.65 |  | slim/slim/slim |
| stock-s11-before_street | stock | slim | slight | – | – | 0.64 | not the pants' color | slim/slim/slim |
| stock-s12-before_street | stock | slim|straight | stacked | 1.09 | – | 0.72 | not the pants' color | straight/straight/straight |
| stock-s13-before_street | stock | straight|relaxed | full | 0.84 | 0.84 | 0.94 |  | straight/straight/straight |
| stock-s14-before_street | stock | relaxed | stacked | 0.67 | 0.81 | 0.80 |  | straight/straight/straight |
| stock-s15-before_street | stock | wide | full | 0.65 | 0.99 | 1.17 |  | relaxed/wide/relaxed |
| stock-s16-before_street | stock | relaxed | stacked | 0.63 | 0.89 | 0.77 |  | straight/relaxed/straight |
| stock-s17-before_phone | stock | skinny | none | – | – | – | hip or knee | skinny/skinny/skinny |
| stock-s19-before_phone | stock | slim|skinny | unsure | – | – | – | hip or knee | slim/slim/slim |
| stock-s21-before_phone | stock | slim | slight | 0.72 | – | 0.68 | arm or hand on the leg | straight/straight/straight |
| stock-s22-before_phone | stock | slim | unsure | – | – | – | ankle not found; arm or hand on the leg | slim/slim/slim |
| stock-s23-before_mirror | stock | straight|slim | unsure | 0.83 | 0.70 | – | no shoe box | straight/straight/straight |
| stock-s25-before_mirror | stock | straight | slight | – | – | – | hip or knee | straight/straight/straight |
| stock-s26-before_mirror | stock | relaxed|wide | stacked | 0.64 | 0.80 | – | no shoe box | straight/straight/straight |
| stock-s28-before_mirror | stock | straight|relaxed | unsure | – | 0.81 | – | ankle not found | straight/straight/straight |


# Evaluation

Gates on: a bottoms box from the closet call, not a side view. Split mode (touching legs cut halfway) unless noted. dev = stock + web mirror (tuned on); test = his phone checks + his Oct 7 photos (held out).

## Two questions, one measure each

| Question | Measure | Mode | Best cut (dev) | Dev right | Test right (sure) | Test unsure | AI right, test photos the probe read | AI right, all test photos |
|---|---|---|---|---|---|---|---|---|
| slim-or-narrower vs straight-or-fuller | os | strict | 1.01 | 17/18 (94%) | 12/14 (86%) | 9/23 (39%) | 26/26 (100%) | 42/50 (84%) |
| slim-or-narrower vs straight-or-fuller | os | split | 1.01 | 19/23 (83%) | 12/14 (86%) | 9/23 (39%) | 26/26 (100%) | 42/50 (84%) |
| slim-or-narrower vs straight-or-fuller | hk | strict | 0.82 | 17/18 (94%) | 13/14 (93%) | 9/23 (39%) | 28/28 (100%) | 42/50 (84%) |
| slim-or-narrower vs straight-or-fuller | hk | split | 0.82 | 20/26 (77%) | 13/15 (87%) | 8/23 (35%) | 29/29 (100%) | 42/50 (84%) |
| slim-or-narrower vs straight-or-fuller | kt | split | 0.72 | 17/20 (85%) | 10/13 (77%) | 10/23 (43%) | 27/27 (100%) | 42/50 (84%) |
| straight vs wide | os | strict | 1.37 | 2/3 (67%) | 4/11 (36%) | 5/16 (31%) | 13/23 (57%) | 22/35 (63%) |
| straight vs wide | os | split | 1.37 | 2/3 (67%) | 4/11 (36%) | 5/16 (31%) | 13/23 (57%) | 22/35 (63%) |
| straight vs wide | hk | strict | 1.07 | 3/4 (75%) | 1/12 (8%) | 4/16 (25%) | 13/26 (50%) | 22/35 (63%) |
| straight vs wide | hk | split | 1.07 | 3/4 (75%) | 1/12 (8%) | 4/16 (25%) | 13/26 (50%) | 22/35 (63%) |
| straight vs wide | kt | split | 0.99 | 4/4 (100%) | 1/10 (10%) | 6/16 (38%) | 12/24 (50%) | 22/35 (63%) |
| slim vs straight | os | strict | 1.17 | 8/8 (100%) | 0/1 (0%) | 3/4 (75%) | 3/3 (100%) | 4/12 (33%) |
| slim vs straight | os | split | 1.17 | 9/9 (100%) | 0/1 (0%) | 3/4 (75%) | 3/3 (100%) | 4/12 (33%) |
| slim vs straight | hk | strict | 0.91 | 9/9 (100%) | 0/1 (0%) | 3/4 (75%) | 3/3 (100%) | 4/12 (33%) |
| slim vs straight | hk | split | 0.91 | 11/11 (100%) | 0/1 (0%) | 3/4 (75%) | 3/3 (100%) | 4/12 (33%) |
| slim vs straight | kt | split | 0.72 | 8/10 (80%) | 0/1 (0%) | 3/4 (75%) | 3/3 (100%) | 4/12 (33%) |

## Two questions, leave-one-out over all labeled photos

Each photo is judged with the best cut fit on all the other photos (so no photo grades itself). The AI column is every AI run on exactly the photos the probe answered.

| Question | Measure | Mode | Photos | Probe sure | Probe right (of sure) | Unsure | AI right, same photos | Cut range |
|---|---|---|---|---|---|---|---|---|
| slim-or-narrower vs straight-or-fuller | os | strict | 55 | 32 | 30/32 (94%) | 23/55 (42%) | 71/80 (89%) | 0.93–0.94 |
| slim-or-narrower vs straight-or-fuller | os | split | 55 | 37 | 32/37 (86%) | 18/55 (33%) | 86/95 (91%) | 0.93–0.94 |
| slim-or-narrower vs straight-or-fuller | hk | strict | 55 | 32 | 30/32 (94%) | 23/55 (42%) | 73/82 (89%) | 0.76–0.82 |
| slim-or-narrower vs straight-or-fuller | hk | split | 55 | 41 | 33/41 (80%) | 14/55 (25%) | 96/107 (90%) | 0.76–0.82 |
| slim-or-narrower vs straight-or-fuller | kt | split | 55 | 33 | 25/33 (76%) | 22/55 (40%) | 82/87 (94%) | 0.71–0.73 |
| slim vs straight | os | strict | 18 | 9 | 8/9 (89%) | 9/18 (50%) | 20/27 (74%) | 0.96–1.17 |
| slim vs straight | os | split | 18 | 10 | 9/10 (90%) | 8/18 (44%) | 23/30 (77%) | 0.96–1.17 |
| slim vs straight | hk | strict | 18 | 10 | 9/10 (90%) | 8/18 (44%) | 23/30 (77%) | 0.76–0.91 |
| slim vs straight | hk | split | 18 | 12 | 11/12 (92%) | 6/18 (33%) | 27/36 (75%) | 0.76–0.91 |
| slim vs straight | kt | split | 18 | 11 | 5/11 (45%) | 7/18 (39%) | 27/33 (82%) | 0.71–0.86 |
| straight vs wide | os | strict | 21 | 14 | 10/14 (71%) | 7/21 (33%) | 19/32 (59%) | 1.06–1.20 |
| straight vs wide | os | split | 21 | 14 | 10/14 (71%) | 7/21 (33%) | 19/32 (59%) | 1.06–1.20 |
| straight vs wide | hk | strict | 21 | 16 | 10/16 (62%) | 5/21 (24%) | 22/38 (58%) | 0.64–0.85 |
| straight vs wide | hk | split | 21 | 16 | 10/16 (62%) | 5/21 (24%) | 22/38 (58%) | 0.64–0.85 |
| straight vs wide | kt | split | 21 | 14 | 12/14 (86%) | 7/21 (33%) | 21/36 (58%) | 0.73–0.73 |

- **his phone checks (founder + 2 friends)**: slim-or-narrower vs straight-or-fuller by os: probe 12/13 (92%), AI 23/23 (100%); slim-or-narrower vs straight-or-fuller by hk: probe 13/13 (100%), AI 25/25 (100%); straight vs wide by os: probe 9/10 (90%), AI 10/20 (50%); straight vs wide by hk: probe 10/11 (91%), AI 10/23 (43%)
- **his Oct 7 mirror photos**: slim-or-narrower vs straight-or-fuller by os: probe 1/1 (100%), AI 3/3 (100%); slim-or-narrower vs straight-or-fuller by hk: probe 0/1 (0%), AI 3/3 (100%); slim vs straight by os: probe 0/1 (0%), AI 3/3 (100%); slim vs straight by hk: probe 0/1 (0%), AI 3/3 (100%); straight vs wide by os: probe 1/1 (100%), AI 3/3 (100%); straight vs wide by hk: probe 0/1 (0%), AI 3/3 (100%)
- **web mirror selfies**: slim-or-narrower vs straight-or-fuller by os: probe 6/6 (100%), AI 12/18 (67%); slim-or-narrower vs straight-or-fuller by hk: probe 7/7 (100%), AI 15/21 (71%); slim vs straight by os: probe 4/4 (100%), AI 8/12 (67%); slim vs straight by hk: probe 5/5 (100%), AI 11/15 (73%); straight vs wide by os: probe 0/2 (0%), AI 5/6 (83%); straight vs wide by hk: probe 0/3 (0%), AI 8/9 (89%)
- **stock photos**: slim-or-narrower vs straight-or-fuller by os: probe 11/12 (92%), AI 33/36 (92%); slim-or-narrower vs straight-or-fuller by hk: probe 10/11 (91%), AI 30/33 (91%); slim vs straight by os: probe 4/4 (100%), AI 9/12 (75%); slim vs straight by hk: probe 4/4 (100%), AI 9/12 (75%); straight vs wide by os: probe 0/1 (0%), AI 1/3 (33%); straight vs wide by hk: probe 0/1 (0%), AI 1/3 (33%)

## Five shapes (skinny / slim / straight / relaxed / wide)

Rule: opening ÷ shoe < narrow → (hem ÷ knee < skinny → skinny, else slim); < full → straight; else (hem ÷ knee < relaxed → relaxed, else wide). Cuts tuned on dev: {'narrow': 0.88, 'full': 1.38, 'skinny': 0.59, 'relaxed': 0.6}. Tuned on everything (in-sample, an upper bound): {'narrow': 0.88, 'full': 1.0, 'skinny': 0.59, 'relaxed': 0.82}.

| Photos | Labeled | Probe sure | Probe right (of sure) | Unsure | AI right, same sure photos (every run) | AI right, all labeled (every run) |
|---|---|---|---|---|---|---|
| dev (tuned on) | 37 | 25 | 14/25 (56%) | 12/37 (32%) | 49/75 (65%) | 80/111 (72%) |
| test (held out) | 24 | 14 | 7/14 (50%) | 10/24 (42%) | 16/26 (62%) | 32/53 (60%) |
| all, dev cuts | 61 | 39 | 21/39 (54%) | 22/61 (36%) | 65/101 (64%) | 112/164 (68%) |
| all, cuts fit on all (upper bound) | 61 | 39 | 24/39 (62%) | 22/61 (36%) | 65/101 (64%) | 112/164 (68%) |

- **his phone checks (founder + 2 friends)** (20 labeled): probe sure on 13, right 6/13 (46%); AI right on the same photos 13/23 (57%), on all 20/41 (49%).
- **his Oct 7 mirror photos** (4 labeled): probe sure on 1, right 1/1 (100%); AI right on the same photos 3/3 (100%), on all 12/12 (100%).
- **web mirror selfies** (10 labeled): probe sure on 8, right 7/8 (88%); AI right on the same photos 17/24 (71%), on all 23/30 (77%).
- **stock photos** (27 labeled): probe sure on 17, right 7/17 (41%); AI right on the same photos 32/51 (63%), on all 57/81 (70%).

## Why the probe is unsure (opening ÷ shoe missing, all labeled 5-shape photos)

- no shoe box: 7
- no bottoms box: 6
- hip or knee: 6
- ankle not found: 2

## Repeatability (same photo; class from the dev cuts)

| Variant | Same class as base | Same number (±0.02) |
|---|---|---|
| again | 61/61 (100%) | 86/86 (100%) |
| max1600 | 58/61 (95%) | 67/86 (78%) |
| crop3 | 51/61 (84%) | 34/86 (40%) |

AI same over its runs: 42/52 (81%) photos.

## The AI's readings by label (every run)

- relaxed → relaxed: 10
- relaxed → straight: 8
- relaxed|straight → relaxed: 1
- relaxed|straight → straight: 3
- relaxed|wide → straight: 3
- skinny → skinny: 9
- skinny → slim: 6
- slim → relaxed: 8
- slim → slim: 23
- slim → straight: 8
- slim|skinny → slim: 3
- slim|straight → slim: 3
- slim|straight → straight: 6
- straight → straight: 14
- straight → wide: 1
- straight|relaxed → relaxed: 2
- straight|relaxed → slim: 3
- straight|relaxed → straight: 9
- straight|slim → slim: 2
- straight|slim → straight: 7
- wide → relaxed: 10
- wide → straight: 5
- wide → wide: 20


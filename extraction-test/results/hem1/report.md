# Hem probe

Run: hem1. Labels: `hem_labels.csv` (Claude subagent, Oct 10, written before the probe existed; blind to it and to the AI). AI = zoom1 / zoom1-stock arm B (3 runs, close-ups on) or the phone's own reading (1 run); the AI's `cuffed` counts as cropped. 'Heavy' = full break, stacked or pooling; 'light' = no break, slight break or cropped. Labels like 'slight_break|full_break' accept either and are left out of heavy-vs-light.

Photos: 76 run, 58 with a hem label, 50 on one side of heavy vs light (24 heavy, 26 light).

## How each measure spreads by label (first label; gates off)

| Measure | no_break | slight_break | full_break | stacked | pooling | cropped |
|---|---|---|---|---|---|---|
| foldRatio | 3/4: 0.97–2.17 (med 1.38) | 7/14: 1.56–9.17 (med 4.46) | 18/20: 0.34–17.03 (med 2.07) | 3/6: 0.75–5.03 (med 3.44) | 0/0: – | 12/14: 0.73–6.92 (med 5.58) |
| foldStd | 3/4: 0.29–1.35 (med 0.67) | 7/14: 0.47–3.66 (med 1.79) | 18/20: 0.10–5.11 (med 0.62) | 3/6: 0.51–7.51 (med 2.35) | 0/0: – | 12/14: 0.22–4.64 (med 2.28) |
| folds | 3/4: 0.00–3.00 (med 0.00) | 7/14: 0.50–3.00 (med 1.00) | 18/20: 0.00–2.00 (med 0.50) | 3/6: 1.00–2.00 (med 2.00) | 0/0: – | 12/14: 0.00–2.50 (med 1.00) |
| orientRatio | 3/4: 0.95–1.69 (med 1.02) | 7/14: 1.18–2.18 (med 1.65) | 18/20: 1.05–1.84 (med 1.30) | 3/6: 0.94–2.28 (med 1.02) | 0/0: – | 12/14: 0.95–1.68 (med 1.30) |
| shoeVisToW | 2/4: 1.31–1.49 (med 1.49) | 5/14: 1.10–1.45 (med 1.20) | 13/20: 0.89–1.17 (med 1.03) | 2/6: 0.74–1.90 (med 1.90) | 0/0: – | 8/14: 0.70–2.15 (med 1.51) |
| gapT | 2/4: 0.00–0.00 (med 0.00) | 5/14: 0.00–0.01 (med 0.00) | 13/20: 0.00–0.04 (med 0.00) | 2/6: 0.00–0.00 (med 0.00) | 0/0: – | 8/14: 0.00–0.20 (med 0.01) |
| coverBox | 2/4: 0.16–0.23 (med 0.23) | 5/14: 0.04–0.30 (med 0.17) | 13/20: 0.10–0.45 (med 0.21) | 2/6: 0.40–0.40 (med 0.40) | 0/0: – | 8/14: -0.47–0.29 (med 0.20) |
| tHem | 3/4: 1.02–1.07 (med 1.07) | 7/14: 1.03–1.15 (med 1.08) | 18/20: 1.08–1.25 (med 1.16) | 3/6: 0.99–1.20 (med 1.15) | 0/0: – | 12/14: 0.84–1.26 (med 1.14) |
| spread | 3/4: 0.62–0.99 (med 0.90) | 7/14: 0.79–1.23 (med 0.87) | 18/20: 0.81–1.36 (med 0.92) | 3/6: 1.02–1.17 (med 1.03) | 0/0: – | 12/14: 0.58–1.40 (med 0.88) |

## How each measure spreads by label (first label; gates on)

| Measure | no_break | slight_break | full_break | stacked | pooling | cropped |
|---|---|---|---|---|---|---|
| foldRatio | 2/4: 1.38–2.17 (med 2.17) | 4/14: 1.75–12.21 (med 4.46) | 4/20: 2.45–10.27 (med 9.86) | 3/6: 0.75–5.03 (med 3.44) | 0/0: – | 10/14: 1.16–8.51 (med 5.68) |
| foldStd | 2/4: 0.67–1.35 (med 1.35) | 4/14: 1.16–3.66 (med 3.66) | 4/20: 0.73–3.62 (med 3.08) | 3/6: 0.51–7.51 (med 2.35) | 0/0: – | 10/14: 0.35–4.64 (med 2.91) |
| folds | 2/4: 0.00–3.00 (med 3.00) | 4/14: 0.50–3.00 (med 1.50) | 4/20: 1.00–2.00 (med 2.00) | 3/6: 1.00–2.00 (med 2.00) | 0/0: – | 10/14: 0.00–2.50 (med 1.00) |
| orientRatio | 2/4: 0.95–1.02 (med 1.02) | 4/14: 1.42–1.87 (med 1.56) | 4/20: 1.06–1.84 (med 1.49) | 3/6: 0.94–2.28 (med 1.02) | 0/0: – | 10/14: 0.95–2.04 (med 1.42) |
| shoeVisToW | 2/4: 1.31–1.49 (med 1.49) | 2/14: 1.10–1.20 (med 1.20) | 10/20: 0.95–1.17 (med 1.08) | 2/6: 0.74–1.90 (med 1.90) | 0/0: – | 6/14: 1.04–2.15 (med 1.55) |
| gapT | 2/4: 0.00–0.00 (med 0.00) | 2/14: 0.00–0.00 (med 0.00) | 10/20: 0.00–0.00 (med 0.00) | 2/6: 0.00–0.00 (med 0.00) | 0/0: – | 7/14: 0.00–0.10 (med 0.00) |
| coverBox | 2/4: 0.16–0.23 (med 0.23) | 2/14: 0.15–0.24 (med 0.24) | 10/20: 0.11–0.28 (med 0.15) | 2/6: 0.40–0.40 (med 0.40) | 0/0: – | 6/14: -0.22–0.29 (med 0.21) |
| tHem | 3/4: 1.02–1.07 (med 1.07) | 3/14: 1.04–1.15 (med 1.08) | 15/20: 1.08–1.25 (med 1.18) | 3/6: 0.99–1.20 (med 1.15) | 0/0: – | 11/14: 0.94–1.24 (med 1.08) |
| spread | 2/4: 0.90–0.99 (med 0.99) | 6/14: 0.79–0.97 (med 0.87) | 17/20: 0.81–1.36 (med 0.91) | 1/6: 1.02–1.02 (med 1.02) | 0/0: – | 10/14: 0.58–1.40 (med 0.94) |

## Heavy vs light, medians (gates on)

| Measure | light: n, median, range | heavy: n, median, range |
|---|---|---|
| foldRatio | 15, 4.46, 1.16–12.21 | 5, 3.44, 0.75–10.27 |
| foldStd | 15, 2.28, 0.35–4.64 | 5, 2.35, 0.51–7.51 |
| folds | 15, 1.00, 0.00–3.00 | 5, 2.00, 1.00–2.00 |
| orientRatio | 15, 1.42, 0.95–2.04 | 5, 1.33, 0.94–2.28 |
| shoeVisToW | 10, 1.49, 1.04–2.15 | 11, 1.08, 0.74–1.90 |
| gapT | 11, 0.00, 0.00–0.10 | 11, 0.00, 0.00–0.00 |
| coverBox | 10, 0.21, -0.22–0.29 | 11, 0.15, 0.11–0.40 |
| tHem | 16, 1.07, 0.94–1.24 | 16, 1.20, 0.99–1.25 |
| spread | 17, 0.93, 0.58–1.40 | 16, 0.97, 0.81–1.36 |

## Heavy vs light, one measure each (leave-one-out)

Each photo is judged with the best cut fit on all the other photos; the direction (more folds = heavier, less shoe showing = heavier, hem lower on the leg = heavier, wider at the bottom = heavier) was fixed before the run. Unsure = the measure's gates failed. AI = every AI run on exactly the photos the probe answered. Last column: the same with the direction also fit (to show where the expected direction is wrong).

| Measure | Photos | Probe sure | Probe right | Unsure | AI right, same photos | AI right, all judged | Cut range | Free direction: right |
|---|---|---|---|---|---|---|---|---|
| foldRatio | 50 | 20 | 13/20 (65%) | 30/50 (60%) | 48/58 (83%) | 100/135 (74%) | 8.34–12.21 | 16/20 (80%) |
| foldStd | 50 | 20 | 16/20 (80%) | 30/50 (60%) | 48/58 (83%) | 100/135 (74%) | 4.64–6.08 | 15/20 (75%) |
| folds | 50 | 20 | 15/20 (75%) | 30/50 (60%) | 48/58 (83%) | 100/135 (74%) | 3.00–3.00 | 15/20 (75%) |
| orientRatio | 50 | 20 | 16/20 (80%) | 30/50 (60%) | 48/58 (83%) | 100/135 (74%) | 2.04–2.16 | 15/20 (75%) |
| shoeVisToW | 50 | 21 | 17/21 (81%) | 29/50 (58%) | 36/55 (65%) | 100/135 (74%) | 1.23–1.18 | 17/21 (81%) |
| gapT | 50 | 22 | 13/22 (59%) | 28/50 (56%) | 39/58 (67%) | 100/135 (74%) | 0.02–0.01 | 13/22 (59%) |
| coverBox | 50 | 21 | 5/21 (24%) | 29/50 (58%) | 36/55 (65%) | 100/135 (74%) | -0.06–0.27 | 5/21 (24%) |
| tHem | 50 | 32 | 23/32 (72%) | 18/50 (36%) | 62/85 (73%) | 100/135 (74%) | 1.08–1.11 | 23/32 (72%) |
| spread | 50 | 33 | 11/33 (33%) | 17/50 (34%) | 62/84 (74%) | 100/135 (74%) | 0.80–0.97 | 11/33 (33%) |

### The hem edge's position along the shin, shoe box required

tHem (where the pants' color ends, as a share of knee → ankle; 1 = the ankle joint) on photos with a shoe box and none of the cover gates: right 20/22 (91%), unsure 28/50 (56%), cut 1.105–1.118; AI on the same photos 39/58 (67%).

- his phone checks: probe 7/8 (88%) (heavy 8, light 0); AI 6/16 (38%)
- web mirror selfies: probe 4/4 (100%) (heavy 0, light 4); AI 12/12 (100%)
- stock photos: probe 9/10 (90%) (heavy 3, light 7); AI 21/30 (70%)
- founder: probe 7/7 (100%) (heavy 7, light 0); AI 6/15 (40%)
- not the founder: probe 13/15 (87%) (heavy 4, light 11); AI 33/43 (77%)

| Photo | Label | tHem | right? |
|---|---|---|---|
| stock-s05-before_studio | cropped | 0.943 | y |
| stock-s06-before_studio | cropped | 0.956 | y |
| mirror-m01 | cropped|no_break | 0.989 | y |
| phone-d1967f | stacked|full_break | 0.990 | n |
| stock-p02-after_studio | cropped | 1.027 | y |
| stock-s09-before_street | cropped | 1.028 | y |
| stock-s11-before_street | slight_break|no_break | 1.039 | y |
| stock-s07-before_studio | no_break|slight_break | 1.070 | y |
| mirror-m11 | no_break|slight_break | 1.071 | y |
| mirror-m05 | slight_break|no_break | 1.079 | y |
| mirror-m12 | cropped|no_break | 1.103 | y |
| stock-s08-before_studio | full_break | 1.132 | y |
| phone-968016 | full_break|stacked | 1.133 | y |
| stock-p02-before_studio | cropped | 1.139 | n |
| stock-s16-before_street | stacked|full_break | 1.151 | y |
| phone-b0f0c8 | full_break | 1.184 | y |
| phone-f07193 | full_break | 1.195 | y |
| phone-d918c0 | full_break | 1.196 | y |
| phone-8bc29d | full_break | 1.198 | y |
| stock-s15-before_street | full_break | 1.205 | y |
| phone-8ad378 | full_break|stacked | 1.221 | y |
| phone-403ade | full_break|stacked | 1.249 | y |

As a tie-breaker for the AI's slight_break (cut 1.11): AI runs right 100/135 (74%) → 110/135 (81%); changed: phone-8bc29d (fixed), phone-8bc29d (fixed), phone-8bc29d (fixed), phone-968016 (fixed), phone-f07193 (fixed), phone-f07193 (fixed), stock-p02-before_studio (broken), stock-p02-before_studio (broken), stock-p02-before_studio (broken), stock-s08-before_studio (fixed), stock-s08-before_studio (fixed), stock-s08-before_studio (fixed), stock-s15-before_street (fixed), stock-s16-before_street (fixed), stock-s16-before_street (fixed), stock-s16-before_street (fixed).

## Heavy vs light, two measures together (leave-one-out)

Heavy when either measure says heavy (each with its own cut, fit on the other photos; directions fixed). Unsure only when both are.

| Measures | Probe sure | Probe right | Unsure | AI right, same photos |
|---|---|---|---|---|
| foldRatio or shoeVisToW | 28 | 22/28 (79%) | 22/50 (44%) | 57/76 (75%) |
| folds or shoeVisToW | 28 | 23/28 (82%) | 22/50 (44%) | 57/76 (75%) |
| foldRatio or tHem | 34 | 24/34 (71%) | 16/50 (32%) | 68/91 (75%) |
| folds or tHem | 34 | 25/34 (74%) | 16/50 (32%) | 68/91 (75%) |
| spread or shoeVisToW | 35 | 23/35 (66%) | 15/50 (30%) | 62/90 (69%) |
| shoeVisToW or tHem | 32 | 23/32 (72%) | 18/50 (36%) | 62/85 (73%) |

### The honest number: measure chosen without the held-out photo

For each photo, the measure or pair (of the 15 above) with the most right-minus-wrong answers on the other photos is picked and its cut fit there; then the held-out photo is judged. Picked: foldRatio or tHem (48×), foldRatio or shoeVisToW (2×).

- **Probe: right 22/34 (65%) when sure, unsure on 16/50 (32%).** AI on the same photos: 68/91 (75%); AI on all judged photos: 100/135 (74%).

Fit on every judged photo, the pick is **foldRatio or tHem** with (12.210001, 1, 1.1065, 1) (for the record; the number above is the one to quote).

## By photo group and person (heavy vs light, the nested answers)

| Group | Judged | Probe sure | Probe right | AI right (runs), same photos | AI right (runs), all |
|---|---|---|---|---|---|
| his phone checks | 18 | 15 | 9/15 (60%) | 20/34 (59%) | 20/39 (51%) |
| his Oct 7 mirror photos | 3 | 0 | – | – | 9/9 (100%) |
| web mirror selfies | 6 | 5 | 2/5 (40%) | 15/15 (100%) | 18/18 (100%) |
| stock photos | 23 | 14 | 11/14 (79%) | 33/42 (79%) | 53/69 (77%) |
| founder (all his photos) | 20 | 14 | 9/14 (64%) | 20/33 (61%) | 29/47 (62%) |
| friends (2 people) | 1 | 1 | 0/1 (0%) | 0/1 (0%) | 0/1 (0%) |
| stock + web (profile unknown) | 29 | 19 | 13/19 (68%) | 48/57 (84%) | 71/87 (82%) |

Heavy photos the probe answered: 16, of which 11 are the founder's (one or two pairs of black wide jeans): phone-0d39d6 (right), phone-403ade (right), phone-5a9049 (wrong), phone-7f14a4 (wrong), phone-8ad378 (right), phone-8bc29d (right), phone-968016 (right), phone-b0f0c8 (right), phone-d1967f (wrong), phone-d6559a (right), phone-d918c0 (right), phone-f07193 (right), stock-s08-before_studio (right), stock-s15-before_street (right), stock-s16-before_street (right), stock-s26-before_mirror (wrong).

Leaving out his 7 checks from before the closet call (no garment boxes; every check has them now): unsure 16/43 (37%), right 20/27 (74%).

## Six classes (leave-one-out, everything fit without the held-out photo)

Rule: a sock/skin gap (gapT) over a cut → cropped; else the heavy-vs-light pick → heavy: stacked if folds ≥ a cut, else full break; light: slight break. Right = one of the photo's accepted labels. The AI has no `stacked` value (its `cuffed` counts as cropped).

| | Photos | Probe sure | Probe right | Unsure | AI right, same photos (runs) | AI right, all labeled (runs) |
|---|---|---|---|---|---|---|
| all | 58 | 37 | 21/37 (57%) | 21/58 (36%) | 62/100 (62%) | 102/155 (66%) |
| his phone checks | 20 | 15 | 9/15 (60%) | 5/20 (25%) | 18/34 (53%) | 20/41 (49%) |
| his Oct 7 mirror photos | 4 | 1 | 1/1 (100%) | 3/4 (75%) | 3/3 (100%) | 12/12 (100%) |
| web mirror selfies | 9 | 6 | 2/6 (33%) | 3/9 (33%) | 12/18 (67%) | 21/27 (78%) |
| stock photos | 25 | 15 | 9/15 (60%) | 10/25 (40%) | 29/45 (64%) | 49/75 (65%) |

Fit on every labeled photo (for the record): gap cut (0.00775, 1), heavy rule (('foldRatio', 'tHem'), (12.210001, 1, 1.1065, 1)), stacked folds (99, 1). Answers given: {'full_break': 23, 'slight_break': 12, 'cropped': 2}.

## Stacked vs pooling, stacked vs full break

- Photos labeled only stacked: 1 (stock-s10-before_street); labeled pooling (even as a second choice): 1 (oct7-ph1); only full break: 14.
- Folds above the hem, stacked-only vs full-break-only (gates on): stock-s10-before_street: folds None, foldRatio None
- Full-break-only photos, folds: None, None, None, None, None, None, None, None, None, None, None, None, 1.0, 2.0

## Why the probe is unsure (judged photos, per measure)

- **fold** (foldRatio): pants too dark to show folds 14, no hem edge 13, knee or ankle not found 3
- **cover** (shoeVisToW): dark on dark (pants and shoes match) 10, no shoe box 9, knee or ankle not found 3, no hem edge 3, too small 2, leg bent 1, feet cut off 1
- **the final pick (foldRatio or tHem), unsure** (all 58 labeled): no hem edge 13, knee or ankle not found 4, pants too dark to show folds 3, too small 1

## Dark pants (shin L* under 20), mirror selfies, propped/stock

- **dark pants** (28 judged): probe sure on 17/28 (61%), right 11/17 (65%); AI 49/71 (69%)
- **not dark** (22 judged): probe sure on 17/22 (77%), right 11/17 (65%); AI 51/64 (80%)
- **mirror selfies (his phone, Oct 7, web)** (26 judged): probe sure on 19/26 (73%), right 11/19 (58%); AI 47/65 (72%)
- **propped / photographer (stock + the friend's propped landscape shot)** (24 judged): probe sure on 15/24 (62%), right 11/15 (73%); AI 53/70 (76%)

## Repeatability

| Variant | Same heavy/light answer as base (incl. unsure) | Numbers within ±5% (foldRatio, shoeVisToW, tHem) |
|---|---|---|
| again | 58/58 (100%) | 80/80 (100%) |
| max1600 | 54/58 (93%) | 67/84 (80%) |
| crop3 | 50/58 (86%) | 44/82 (54%) |

AI: same `hem` on all its runs for 35/49 (71%) photos.

## The AI's hem by label (every run)

- cropped → cropped: 22
- cropped → full_break: 1
- cropped → no_break: 2
- cropped → pooling: 1
- cropped → slight_break: 4
- cropped|no_break → cropped: 3
- cropped|no_break → no_break: 3
- cropped|no_break → slight_break: 6
- full_break → cropped: 3
- full_break → full_break: 11
- full_break → slight_break: 21
- full_break|pooling → full_break: 3
- full_break|slight_break → full_break: 3
- full_break|slight_break → slight_break: 3
- full_break|stacked → full_break: 2
- full_break|stacked → slight_break: 1
- no_break → slight_break: 3
- no_break|slight_break → no_break: 3
- no_break|slight_break → slight_break: 6
- slight_break|full_break → full_break: 1
- slight_break|full_break → slight_break: 13
- slight_break|no_break → full_break: 1
- slight_break|no_break → no_break: 6
- slight_break|no_break → slight_break: 17
- stacked → slight_break: 3
- stacked|full_break → full_break: 6
- stacked|full_break → pooling: 3
- stacked|full_break → slight_break: 4

## Every labeled photo (base run)

Probe = the final pick fit on every judged photo; LOO = the nested leave-one-out answer was right (y) or wrong (n).

| Photo | Group | Person | Label | foldRatio | folds | shoeVisToW | gapT | tHem | spread | Probe | LOO | Six-class | Unsure because | AI runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mirror-m01 | mirror | web photo | cropped|no_break | 4.25 | 2.00 | 1.51 | 0.00 | 0.99 | 0.80 | light | y | slight_break |  | slight_break/slight_break/slight_break |
| mirror-m02 | mirror | web photo | cropped | – | – | – | – | – | – | unsure |  | unsure | dark on dark (pants and shoes match); no hem edge | cropped/cropped/cropped |
| mirror-m05 | mirror | web photo | slight_break|no_break | 2.35 | 0.50 | 1.10 | 0.00 | 1.08 | 0.85 | light | n | full_break |  | slight_break/slight_break/slight_break |
| mirror-m06 | mirror | web photo | slight_break|full_break | 1.75 | 1.50 | – | – | 1.15 | 0.79 | heavy |  | full_break | no shoe box | slight_break/slight_break/slight_break |
| mirror-m07 | mirror | web photo | slight_break|full_break | – | – | – | – | – | – | unsure |  | unsure | too small | slight_break/slight_break/slight_break |
| mirror-m08 | mirror | web photo | slight_break|full_break | – | – | – | – | – | – | unsure |  | unsure | dark on dark (pants and shoes match); no hem edge | slight_break/slight_break/slight_break |
| mirror-m10 | mirror | web photo | slight_break|no_break | 12.21 | 1.00 | – | – | – | 0.97 | light | n | full_break | too small | slight_break/slight_break/slight_break |
| mirror-m11 | mirror | web photo | no_break|slight_break | – | – | 1.31 | 0.00 | 1.07 | 0.90 | light | y | slight_break | pants too dark to show folds | slight_break/no_break/slight_break |
| mirror-m12 | mirror | web photo | cropped|no_break | 8.51 | 1.00 | – | 0.01 | 1.10 | 0.93 | light | n | full_break | too small | slight_break/slight_break/slight_break |
| oct7-ph1 | oct7 | founder | full_break|pooling | – | – | – | – | – | – | unsure |  | unsure | knee or ankle not found | full_break/full_break/full_break |
| oct7-ph2 | oct7 | founder | slight_break|no_break | – | – | – | – | – | – | unsure |  | unsure | knee or ankle not found | no_break/slight_break/no_break |
| oct7-ph3 | oct7 | founder | slight_break|no_break | – | – | – | – | – | 0.85 | unsure |  | unsure | dark on dark (pants and shoes match); no hem edge | no_break/slight_break/no_break |
| oct7-ph4 | oct7 | founder | full_break|slight_break | 3.46 | 1.00 | – | – | 1.15 | 0.88 | heavy |  | full_break | no shoe box | full_break/full_break/slight_break |
| phone-0d39d6 | phone | founder | full_break | – | – | – | – | 1.25 | 1.36 | heavy | y | full_break | no shoe box; pants too dark to show folds | full_break/full_break/slight_break |
| phone-1f1997 | phone | founder | full_break | – | – | – | – | – | 0.97 | unsure |  | unsure | dark on dark (pants and shoes match); pants too dark to show folds | slight_break |
| phone-403ade | phone | founder | full_break|stacked | – | – | 1.05 | 0.00 | 1.25 | 0.87 | heavy | y | full_break | pants too dark to show folds | full_break |
| phone-5a9049 | phone | founder | full_break | – | – | – | – | 1.11 | 1.06 | heavy | n | slight_break | no hem edge; no shoe box | slight_break/slight_break/slight_break |
| phone-6b14db | phone | founder | cropped | – | – | – | – | 1.20 | 1.12 | heavy | n | full_break | no shoe box; pants too dark to show folds | cropped/cropped/cropped |
| phone-7de605 | phone | founder | cropped | – | – | – | – | 1.24 | 1.35 | heavy | n | full_break | no shoe box; pants too dark to show folds | cropped/cropped/cropped |
| phone-7f14a4 | phone | founder | full_break | – | – | – | – | 1.08 | 1.07 | light | n | slight_break | no hem edge; no shoe box |  |
| phone-8ad378 | phone | founder | full_break|stacked | – | – | 1.16 | 0.00 | 1.22 | 0.81 | heavy | y | full_break | pants too dark to show folds | full_break |
| phone-8bc29d | phone | founder | full_break | – | – | 0.96 | 0.00 | 1.20 | 0.99 | heavy | y | full_break | pants too dark to show folds | slight_break/slight_break/slight_break |
| phone-968016 | phone | founder | full_break|stacked | – | – | 1.17 | 0.00 | 1.13 | 0.82 | heavy | y | full_break | pants too dark to show folds | slight_break |
| phone-a765e8 | phone | founder | cropped | 1.16 | 0.00 | – | – | 1.20 | 1.40 | heavy | n | full_break | no shoe box | no_break/cropped/no_break |
| phone-b0f0c8 | phone | founder | full_break | – | – | 1.06 | 0.00 | 1.18 | 0.92 | heavy | y | full_break | pants too dark to show folds | full_break/full_break/full_break |
| phone-d1967f | phone | friend: navy blazer | stacked|full_break | 0.75 | 1.00 | 1.90 | 0.00 | 0.99 | 1.02 | light | n | slight_break |  | slight_break |
| phone-d58b14 | phone | founder | full_break | – | – | – | – | – | 1.13 | unsure |  | unsure | dark on dark (pants and shoes match); pants too dark to show folds | slight_break |
| phone-d6559a | phone | founder | full_break | – | – | – | – | 1.12 | 0.88 | heavy | y | full_break | no hem edge; no shoe box | full_break/full_break/full_break |
| phone-d918c0 | phone | founder | full_break | – | – | 1.08 | 0.00 | 1.20 | 0.85 | heavy | y | full_break | pants too dark to show folds | cropped/cropped/cropped |
| phone-e026de | phone | founder | full_break | – | – | – | – | – | 0.97 | unsure |  | unsure | dark on dark (pants and shoes match); no hem edge | slight_break/slight_break/slight_break |
| phone-f07193 | phone | founder | full_break | – | – | 1.11 | 0.00 | 1.20 | 0.91 | heavy | y | full_break | pants too dark to show folds | full_break/slight_break/slight_break |
| phone-f4870b | phone | friend: chore coat + white tee | slight_break|full_break | – | – | – | – | – | – | unsure |  | unsure | dark on dark (pants and shoes match); no hem edge | slight_break |
| phone-fb0b17 | phone | friend: chore coat + white tee | slight_break|full_break | – | – | – | – | – | – | unsure |  | unsure | dark on dark (pants and shoes match); no hem edge | slight_break |
| stock-p01-after_studio | stock | stock photo | no_break|slight_break | 1.38 | 3.00 | – | – | 1.02 | – | light | y | slight_break | leg bent | slight_break/slight_break/slight_break |
| stock-p01-before_studio | stock | stock photo | cropped|no_break | 5.68 | 2.00 | – | – | 1.08 | – | light | n | full_break | no shoe box | no_break/no_break/no_break |
| stock-p02-after_studio | stock | stock photo | cropped | 6.41 | 1.00 | 1.95 | 0.00 | 1.03 | 0.86 | light | y | slight_break |  | slight_break/pooling/full_break |
| stock-p02-before_studio | stock | stock photo | cropped | 5.58 | 1.00 | 1.04 | 0.00 | 1.14 | 0.58 | heavy | n | full_break |  | slight_break/slight_break/slight_break |
| stock-p03-after_street | stock | stock photo | slight_break|no_break | – | – | – | – | – | 0.87 | unsure |  | unsure | dark on dark (pants and shoes match); pants too dark to show folds | slight_break/slight_break/slight_break |
| stock-p03-before_street | stock | stock photo | no_break | – | – | – | – | – | – | unsure |  | unsure | dark on dark (pants and shoes match); no hem edge | slight_break/slight_break/slight_break |
| stock-s01-before_studio | stock | stock photo | full_break | – | – | – | – | – | – | unsure |  | unsure | no hem edge | slight_break/slight_break/slight_break |
| stock-s03-before_studio | stock | stock photo | slight_break|no_break | – | – | – | – | – | – | unsure |  | unsure | dark on dark (pants and shoes match); no hem edge | no_break/no_break/slight_break |
| stock-s04-before_studio | stock | stock photo | cropped | 1.22 | 0.50 | – | – | – | – | light | y | slight_break | feet cut off | cropped/cropped/cropped |
| stock-s05-before_studio | stock | stock photo | cropped | 3.13 | 0.50 | 1.55 | 0.04 | 0.94 | 0.94 | light | y | cropped |  | cropped/cropped/cropped |
| stock-s06-before_studio | stock | stock photo | cropped | 6.12 | 2.50 | 1.28 | 0.00 | 0.96 | 0.72 | light | y | slight_break |  | cropped/cropped/cropped |
| stock-s07-before_studio | stock | stock photo | no_break|slight_break | 2.17 | 0.00 | 1.49 | 0.00 | 1.07 | 0.99 | light | y | slight_break |  | no_break/slight_break/no_break |
| stock-s08-before_studio | stock | stock photo | full_break | 2.45 | 1.00 | 0.95 | 0.00 | 1.13 | – | heavy | y | full_break |  | slight_break/slight_break/slight_break |
| stock-s09-before_street | stock | stock photo | cropped | 6.33 | 1.00 | 2.15 | 0.10 | 1.03 | 0.96 | light | y | cropped |  | cropped/cropped/cropped |
| stock-s10-before_street | stock | stock photo | stacked | – | – | – | – | – | – | unsure |  | unsure | dark on dark (pants and shoes match); no hem edge | slight_break/slight_break/slight_break |
| stock-s11-before_street | stock | stock photo | slight_break|no_break | 4.46 | 3.00 | 1.20 | 0.00 | 1.04 | 0.95 | light | y | slight_break |  | slight_break/slight_break/slight_break |
| stock-s12-before_street | stock | stock photo | stacked|full_break | – | – | – | – | – | – | unsure |  | unsure | no hem edge | full_break/full_break/full_break |
| stock-s13-before_street | stock | stock photo | full_break|slight_break | 9.86 | 2.00 | 1.03 | 0.00 | 1.15 | 0.83 | heavy |  | full_break |  | slight_break/slight_break/full_break |
| stock-s14-before_street | stock | stock photo | stacked|full_break | – | – | – | – | – | – | unsure |  | unsure | no hem edge | full_break/full_break/full_break |
| stock-s15-before_street | stock | stock photo | full_break | 10.27 | 2.00 | 1.17 | 0.00 | 1.21 | 0.84 | heavy | y | full_break |  | full_break/full_break/slight_break |
| stock-s16-before_street | stock | stock photo | stacked|full_break | 3.44 | 2.00 | 0.74 | 0.00 | 1.15 | – | heavy | y | full_break |  | slight_break/slight_break/slight_break |
| stock-s17-before_phone | stock | stock photo | cropped|no_break | – | – | – | – | – | – | unsure |  | unsure | knee or ankle not found | cropped/cropped/cropped |
| stock-s21-before_phone | stock | stock photo | slight_break|no_break | – | – | – | – | – | – | unsure |  | unsure | dark on dark (pants and shoes match); no hem edge | full_break/slight_break/slight_break |
| stock-s25-before_mirror | stock | stock photo | slight_break|full_break | – | – | – | – | – | – | unsure |  | unsure | knee or ankle not found | slight_break/full_break/slight_break |
| stock-s26-before_mirror | stock | stock photo | stacked|full_break | 5.03 | 2.00 | – | – | 1.20 | – | heavy | n | slight_break | no shoe box | pooling/pooling/pooling |


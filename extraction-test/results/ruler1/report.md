# Fit ruler test

Run: ruler1. Labels: `ruler_labels.csv` (Claude, Oct 9). AI = zoom1 / zoom1-stock arm B (3 runs, close-ups on) and his phone's own reading for the Oct 9 photos (1 run).

## dev (stock + mirror; tuned on)

| Measure | Labeled | Ruler sure | Ruler right (of sure) | Unsure | AI right, same photos | AI right where ruler sure | Ruler then AI | Same: rerun / 1600 px / 3% crop | AI same over 3 runs |
|---|---|---|---|---|---|---|---|---|---|
| sleeve_end | 30 | 21 | 16/21 (76%) | 9/30 (30%) | 57/60 (95%) | 42/45 (93%) | 15/20 (75%) | 30/30 · 29/30 · 28/30 | 20/20 (100%) |
| top_length | 40 | 27 | 16/27 (59%) | 13/40 (32%) | 92/120 (76%) | 60/81 (74%) | 27/40 (67%) | 40/40 · 38/40 · 34/40 | 30/40 (75%) |
| top_length3 | 40 | 27 | 21/27 (77%) | 13/40 (32%) | 100/120 (83%) | 67/81 (82%) | 32/40 (80%) | 40/40 · 39/40 · 35/40 | 33/40 (82%) |
| hem | 29 | 14 | 8/14 (57%) | 15/29 (51%) | 76/87 (87%) | 41/42 (97%) | 20/29 (68%) | 29/29 · 28/29 · 28/29 | 24/29 (82%) |
| shorts_length | 3 | 3 | 2/3 (66%) | 0/3 (0%) | – | – | – | 3/3 · 3/3 · 3/3 | – |
| layers | 19 | 14 | 14/14 (100%) | 5/19 (26%) | 51/57 (89%) | 42/42 (100%) | 17/19 (89%) | 19/19 · 19/19 · 17/19 | 19/19 (100%) |
| top_length_box | 40 | 37 | 25/37 (67%) | 3/40 (7%) | 92/120 (76%) | 84/111 (75%) | 28/40 (70%) | 40/40 · 40/40 · 35/40 | 30/40 (75%) |
| hem_box | 29 | 29 | 22/29 (75%) | 0/29 (0%) | 76/87 (87%) | 76/87 (87%) | 22/29 (75%) | 29/29 · 29/29 · 29/29 | 24/29 (82%) |

## test (his photos; held out)

| Measure | Labeled | Ruler sure | Ruler right (of sure) | Unsure | AI right, same photos | AI right where ruler sure | Ruler then AI | Same: rerun / 1600 px / 3% crop | AI same over 3 runs |
|---|---|---|---|---|---|---|---|---|---|
| sleeve_end | 20 | 8 | 7/8 (87%) | 12/20 (60%) | 40/47 (85%) | 13/14 (92%) | 16/19 (84%) | 20/20 · 16/20 · 15/20 | 18/19 (94%) |
| top_length | 20 | 14 | 10/14 (71%) | 6/20 (30%) | 21/47 (44%) | 16/37 (43%) | 12/19 (63%) | 20/20 · 20/20 · 19/20 | 14/19 (73%) |
| top_length3 | 20 | 14 | 14/14 (100%) | 6/20 (30%) | 43/47 (91%) | 34/37 (91%) | 18/19 (94%) | 20/20 · 20/20 · 19/20 | 17/19 (89%) |
| hem | 13 | 5 | 2/5 (40%) | 8/13 (61%) | 15/29 (51%) | 4/13 (30%) | 7/13 (53%) | 13/13 · 12/13 · 13/13 | 12/13 (92%) |
| layers | 8 | 7 | 7/7 (100%) | 1/8 (12%) | 18/20 (90%) | 15/17 (88%) | 8/8 (100%) | 8/8 · 8/8 · 7/8 | 6/8 (75%) |
| top_length_box | 14 | 12 | 7/12 (58%) | 2/14 (14%) | 14/32 (43%) | 11/26 (42%) | 8/14 (57%) | 14/14 · 14/14 · 11/14 | 10/14 (71%) |
| hem_box | 13 | 12 | 4/12 (33%) | 1/13 (7%) | 15/29 (51%) | 12/26 (46%) | 5/13 (38%) | 13/13 · 13/13 · 13/13 | 12/13 (92%) |

## all

| Measure | Labeled | Ruler sure | Ruler right (of sure) | Unsure | AI right, same photos | AI right where ruler sure | Ruler then AI | Same: rerun / 1600 px / 3% crop | AI same over 3 runs |
|---|---|---|---|---|---|---|---|---|---|
| sleeve_end | 50 | 29 | 23/29 (79%) | 21/50 (42%) | 97/107 (90%) | 55/59 (93%) | 31/39 (79%) | 50/50 · 45/50 · 43/50 | 38/39 (97%) |
| top_length | 60 | 41 | 26/41 (63%) | 19/60 (31%) | 113/167 (67%) | 76/118 (64%) | 39/59 (66%) | 60/60 · 58/60 · 53/60 | 44/59 (74%) |
| top_length3 | 60 | 41 | 35/41 (85%) | 19/60 (31%) | 143/167 (85%) | 101/118 (85%) | 50/59 (84%) | 60/60 · 59/60 · 54/60 | 50/59 (84%) |
| hem | 42 | 19 | 10/19 (52%) | 23/42 (54%) | 91/116 (78%) | 45/55 (81%) | 27/42 (64%) | 42/42 · 40/42 · 41/42 | 36/42 (85%) |
| shorts_length | 3 | 3 | 2/3 (66%) | 0/3 (0%) | – | – | – | 3/3 · 3/3 · 3/3 | – |
| layers | 27 | 21 | 21/21 (100%) | 6/27 (22%) | 69/77 (89%) | 57/59 (96%) | 25/27 (92%) | 27/27 · 27/27 · 24/27 | 25/27 (92%) |
| top_length_box | 54 | 49 | 32/49 (65%) | 5/54 (9%) | 106/152 (69%) | 95/137 (69%) | 36/54 (66%) | 54/54 · 54/54 · 46/54 | 40/54 (74%) |
| hem_box | 42 | 41 | 26/41 (63%) | 1/42 (2%) | 91/116 (78%) | 88/113 (77%) | 27/42 (64%) | 42/42 · 42/42 · 42/42 | 36/42 (85%) |

## Every labeled reading

| Photo | Measure | Label | Ruler | Position | Why unsure | AI runs |
|---|---|---|---|---|---|---|
| mirror-m01 | hem | meets | meets ✓ | 0.08 |  | meets/meets/meets |
| mirror-m02 | hem | meets|gap | unsure |  | pants and shoes look the same | gap/gap/gap |
| mirror-m03 | hem | meets|covers | unsure |  | pants and shoes look the same | covers/covers/covers |
| mirror-m05 | hem | meets | unsure |  | legs disagree | meets/meets/meets |
| mirror-m07 | hem | meets|covers | covers ✓ | 0.14 |  | meets/meets/meets |
| mirror-m08 | hem | meets | unsure |  | pants and shoes look the same | meets/meets/meets |
| mirror-m11 | hem | meets | meets ✓ | 0.09 |  | meets/meets/meets |
| mirror-m12 | hem | meets | unsure |  | legs disagree | meets/meets/meets |
| oct7-ph1 | hem | covers | unsure |  | joints | covers/covers/covers |
| oct7-ph3 | hem | meets | unsure |  | pants and shoes look the same | meets/meets/meets |
| phone-1f1997 | hem | covers | unsure |  | pants and shoes look the same | meets |
| phone-8bc29d | hem | covers | unsure |  | legs disagree | meets/meets/meets |
| phone-968016 | hem | covers | meets ✗ | 0.14 |  | meets |
| phone-b0f0c8 | hem | covers | meets ✗ | 0.16 |  | covers/covers/covers |
| phone-d58b14 | hem | covers | unsure |  | pants and shoes look the same | meets |
| phone-d6559a | hem | covers | unsure |  | no shoe box | covers/covers/covers |
| phone-d918c0 | hem | covers | meets ✗ | 0.04 |  | gap/gap/gap |
| phone-e026de | hem | covers | covers ✓ | 0.09 |  | meets/meets/meets |
| phone-f07193 | hem | covers | covers ✓ | 0.17 |  | covers/meets/meets |
| phone-f4870b | hem | meets | unsure |  | pants and shoes look the same | meets |
| phone-fb0b17 | hem | meets | unsure |  | pants and shoes look the same | meets |
| stock-p02-after_studio | hem | meets | unsure |  | legs disagree | meets/covers/covers |
| stock-p02-before_studio | hem | gap|meets | unsure |  | legs disagree | meets/meets/meets |
| stock-p03-after_street | hem | meets | meets ✓ | 0.07 |  | meets/meets/meets |
| stock-p03-before_street | hem | meets | covers ✗ | 0.01 |  | meets/meets/meets |
| stock-s01-before_studio | hem | covers|meets | covers ✓ | 0.11 |  | meets/meets/meets |
| stock-s03-before_studio | hem | meets | unsure |  | pants and shoes look the same | meets/meets/meets |
| stock-s04-before_studio | hem | gap | gap ✓ | -0.14 |  | gap/gap/gap |
| stock-s05-before_studio | hem | gap | gap ✓ | -0.18 |  | gap/gap/gap |
| stock-s06-before_studio | hem | gap | meets ✗ | -0.05 |  | gap/gap/gap |
| stock-s07-before_studio | hem | meets | covers ✗ | 0.06 |  | meets/meets/meets |
| stock-s08-before_studio | hem | covers | unsure |  | legs disagree | meets/meets/meets |
| stock-s09-before_street | hem | gap | covers ✗ | 0.04 |  | gap/gap/gap |
| stock-s10-before_street | hem | meets | unsure |  | pants and shoes look the same | meets/meets/meets |
| stock-s11-before_street | hem | meets | meets ✓ | 0.06 |  | meets/meets/meets |
| stock-s12-before_street | hem | meets|covers | gap ✗ | -0.47 |  | covers/covers/covers |
| stock-s13-before_street | hem | meets | unsure |  | legs disagree | meets/meets/covers |
| stock-s14-before_street | hem | covers|meets | unsure |  | legs disagree | covers/covers/covers |
| stock-s15-before_street | hem | meets|covers | unsure |  | legs disagree | covers/covers/meets |
| stock-s16-before_street | hem | covers | unsure |  | legs disagree | meets/meets/meets |
| stock-s21-before_phone | hem | meets | covers ✗ | 0.27 |  | covers/meets/meets |
| stock-s25-before_mirror | hem | meets | unsure |  | joints | meets/covers/meets |
| mirror-m01 | hem_box | meets | meets ✓ | 0.27 |  | meets/meets/meets |
| mirror-m02 | hem_box | meets|gap | meets ✓ | 0.23 |  | gap/gap/gap |
| mirror-m03 | hem_box | meets|covers | meets ✓ | 0.44 |  | covers/covers/covers |
| mirror-m05 | hem_box | meets | meets ✓ | 0.35 |  | meets/meets/meets |
| mirror-m07 | hem_box | meets|covers | covers ✓ | 0.53 |  | meets/meets/meets |
| mirror-m08 | hem_box | meets | meets ✓ | 0.49 |  | meets/meets/meets |
| mirror-m11 | hem_box | meets | meets ✓ | 0.16 |  | meets/meets/meets |
| mirror-m12 | hem_box | meets | covers ✗ | 0.85 |  | meets/meets/meets |
| oct7-ph1 | hem_box | covers | covers ✓ | 1.61 |  | covers/covers/covers |
| oct7-ph3 | hem_box | meets | meets ✓ | 0.16 |  | meets/meets/meets |
| phone-1f1997 | hem_box | covers | meets ✗ | 0.44 |  | meets |
| phone-8bc29d | hem_box | covers | meets ✗ | 0.33 |  | meets/meets/meets |
| phone-968016 | hem_box | covers | meets ✗ | 0.15 |  | meets |
| phone-b0f0c8 | hem_box | covers | meets ✗ | 0.33 |  | covers/covers/covers |
| phone-d58b14 | hem_box | covers | meets ✗ | 0.38 |  | meets |
| phone-d6559a | hem_box | covers | unsure |  | no boxes | covers/covers/covers |
| phone-d918c0 | hem_box | covers | meets ✗ | 0.22 |  | gap/gap/gap |
| phone-e026de | hem_box | covers | meets ✗ | 0.47 |  | meets/meets/meets |
| phone-f07193 | hem_box | covers | meets ✗ | 0.42 |  | covers/meets/meets |
| phone-f4870b | hem_box | meets | meets ✓ | 0.31 |  | meets |
| phone-fb0b17 | hem_box | meets | meets ✓ | 0.24 |  | meets |
| stock-p02-after_studio | hem_box | meets | meets ✓ | 0.37 |  | meets/covers/covers |
| stock-p02-before_studio | hem_box | gap|meets | meets ✓ | 0.17 |  | meets/meets/meets |
| stock-p03-after_street | hem_box | meets | meets ✓ | 0.25 |  | meets/meets/meets |
| stock-p03-before_street | hem_box | meets | covers ✗ | 0.57 |  | meets/meets/meets |
| stock-s01-before_studio | hem_box | covers|meets | covers ✓ | 0.54 |  | meets/meets/meets |
| stock-s03-before_studio | hem_box | meets | meets ✓ | 0.45 |  | meets/meets/meets |
| stock-s04-before_studio | hem_box | gap | gap ✓ | -0.41 |  | gap/gap/gap |
| stock-s05-before_studio | hem_box | gap | meets ✗ | 0.12 |  | gap/gap/gap |
| stock-s06-before_studio | hem_box | gap | meets ✗ | 0.13 |  | gap/gap/gap |
| stock-s07-before_studio | hem_box | meets | covers ✗ | 0.51 |  | meets/meets/meets |
| stock-s08-before_studio | hem_box | covers | covers ✓ | 0.52 |  | meets/meets/meets |
| stock-s09-before_street | hem_box | gap | covers ✗ | 0.71 |  | gap/gap/gap |
| stock-s10-before_street | hem_box | meets | meets ✓ | 0.49 |  | meets/meets/meets |
| stock-s11-before_street | hem_box | meets | meets ✓ | 0.30 |  | meets/meets/meets |
| stock-s12-before_street | hem_box | meets|covers | meets ✓ | 0.34 |  | covers/covers/covers |
| stock-s13-before_street | hem_box | meets | meets ✓ | 0.48 |  | meets/meets/covers |
| stock-s14-before_street | hem_box | covers|meets | meets ✓ | 0.28 |  | covers/covers/covers |
| stock-s15-before_street | hem_box | meets|covers | covers ✓ | 0.81 |  | covers/covers/meets |
| stock-s16-before_street | hem_box | covers | meets ✗ | 0.47 |  | meets/meets/meets |
| stock-s21-before_phone | hem_box | meets | meets ✓ | 0.27 |  | covers/meets/meets |
| stock-s25-before_mirror | hem_box | meets | meets ✓ | 0.22 |  | meets/covers/meets |
| mirror-m08 | layers | no | unsure |  | neck or hips | no/no/no |
| mirror-m09 | layers | no | no ✓ | -1.03 |  | no/no/no |
| mirror-m10 | layers | no | no ✓ | -0.30 |  | no/no/no |
| mirror-m11 | layers | no | no ✓ | -0.27 |  | no/no/no |
| mirror-m12 | layers | no | no ✓ | -0.33 |  | no/no/no |
| oct7-ph3 | layers | no | no ✓ | -0.46 |  | no/no/no |
| oct7-ph4 | layers | no | unsure |  | neck or hips | no/no/no |
| phone-8bc29d | layers | no | no ✓ | -0.02 |  | yes/no/no |
| phone-d918c0 | layers | no | no ✓ | -0.67 |  | no/no/no |
| phone-e026de | layers | no | no ✓ | -0.07 |  | yes/no/no |
| phone-f07193 | layers | no | no ✓ | -0.82 |  | no/no/no |
| phone-f4870b | layers | no | no ✓ | -0.08 |  | no |
| phone-fb0b17 | layers | no | no ✓ | -0.07 |  | no |
| stock-p01-after_studio | layers | no | no ✓ | -0.44 |  | no/no/no |
| stock-p03-after_street | layers | no | no ✓ | -0.57 |  | no/no/no |
| stock-p03-before_street | layers | no | no ✓ | -0.58 |  | no/no/no |
| stock-p04-after_street | layers | no | unsure |  | neck or hips | no/no/no |
| stock-p04-before_street | layers | no | unsure |  | neck or hips | no/no/no |
| stock-p06-before_studio | layers | no | no ✓ | -0.12 |  | no/no/no |
| stock-s04-before_studio | layers | yes | unsure |  | one layer | None/None/None |
| stock-s07-before_studio | layers | no | no ✓ | -0.42 |  | no/no/no |
| stock-s09-before_street | layers | no | no ✓ | -0.40 |  | no/no/no |
| stock-s10-before_street | layers | no | no ✓ | -0.12 |  | no/no/no |
| stock-s14-before_street | layers | no | no ✓ | -0.17 |  | no/no/no |
| stock-s16-before_street | layers | no | no ✓ | -0.24 |  | no/no/no |
| stock-s24-before_mirror | layers | yes | unsure |  | one layer | None/None/None |
| stock-s26-before_mirror | layers | no | no ✓ | 0.00 |  | no/no/no |
| stock-p05-after_street | shorts_length | above_knee | above_knee ✓ | -0.18 |  | None/None/None |
| stock-s02-before_studio | shorts_length | above_knee | below_knee ✗ | 0.25 |  | None/None/None |
| stock-s24-before_mirror | shorts_length | above_knee | above_knee ✓ | -0.21 |  | None/None/None |
| mirror-m01 | sleeve_end | at_elbow|mid_bicep | at_elbow ✓ | 1.00 |  | None/None/None |
| mirror-m03 | sleeve_end | at_elbow|mid_bicep | unsure |  | arm not hanging / a short sleeve that runs past the elbow | None/None/None |
| mirror-m04 | sleeve_end | mid_bicep | mid_bicep ✓ | 0.66 |  | None/None/None |
| mirror-m05 | sleeve_end | at_wrist | at_wrist ✓ | 2.04 |  | at_wrist/at_wrist/at_wrist |
| mirror-m07 | sleeve_end | at_wrist | at_wrist ✓ | 1.86 |  | at_wrist/at_wrist/at_wrist |
| mirror-m10 | sleeve_end | above_wrist | above_wrist ✓ | 1.20 |  | above_wrist/above_wrist/above_wrist |
| mirror-m11 | sleeve_end | at_wrist | unsure |  | arm not hanging / joints | at_wrist/at_wrist/at_wrist |
| mirror-m12 | sleeve_end | at_elbow|mid_bicep | unsure |  | arm lengths / arm not hanging | None/None/None |
| oct7-ph1 | sleeve_end | at_wrist | unsure |  | joints / hand in pocket | at_wrist/at_wrist/at_wrist |
| oct7-ph2 | sleeve_end | at_wrist | unsure |  | joints / arm lengths | at_wrist/at_wrist/at_wrist |
| oct7-ph3 | sleeve_end | at_wrist | at_wrist ✓ | 2.12 |  | above_wrist/at_wrist/at_wrist |
| phone-0d39d6 | sleeve_end | at_wrist | unsure |  | arm not hanging / hand in pocket | at_wrist/at_wrist/at_wrist |
| phone-1f1997 | sleeve_end | at_wrist | at_wrist ✓ | 2.22 |  | at_wrist |
| phone-5a9049 | sleeve_end | at_wrist | unsure |  | arm not hanging / hand in pocket | at_wrist/at_wrist/at_wrist |
| phone-6b14db | sleeve_end | at_wrist | unsure |  | arm not hanging / hand in pocket | at_wrist/at_wrist/at_wrist |
| phone-7de605 | sleeve_end | at_wrist | unsure |  | arm not hanging / no step (hand matches the sleeve, or the sleeve covers it) | at_wrist/at_wrist/at_wrist |
| phone-7f14a4 | sleeve_end | at_wrist | unsure |  | arm not hanging / hand in pocket |  |
| phone-8bc29d | sleeve_end | at_wrist | unsure |  | arm not hanging / hand in pocket | covers_hand/covers_hand/covers_hand |
| phone-968016 | sleeve_end | at_wrist | at_wrist ✓ | 2.04 |  | at_wrist |
| phone-a765e8 | sleeve_end | at_wrist | unsure |  | arm not hanging / no step (hand matches the sleeve, or the sleeve covers it) | at_wrist/at_wrist/at_wrist |
| phone-b0f0c8 | sleeve_end | at_wrist | at_wrist ✓ | 2.22 |  | at_wrist/at_wrist/at_wrist |
| phone-d58b14 | sleeve_end | at_wrist | at_wrist ✓ | 2.22 |  | at_wrist |
| phone-d6559a | sleeve_end | at_wrist | covers_hand ✗ | 2.28 |  | at_wrist/at_wrist/at_wrist |
| phone-d918c0 | sleeve_end | at_wrist | unsure |  | arm not hanging / no step (hand matches the sleeve, or the sleeve covers it) | at_wrist/at_wrist/at_wrist |
| phone-e026de | sleeve_end | above_wrist | unsure |  | arm not hanging / hand in pocket | above_wrist/above_wrist/above_wrist |
| phone-f07193 | sleeve_end | at_wrist | unsure |  | arm not hanging / hand in pocket | covers_hand/covers_hand/covers_hand |
| phone-f4870b | sleeve_end | at_wrist | at_wrist ✓ | 2.18 |  | at_wrist |
| phone-fb0b17 | sleeve_end | at_wrist | at_wrist ✓ | 2.16 |  | at_wrist |
| stock-p02-after_studio | sleeve_end | at_wrist | covers_hand ✗ | 2.36 |  | at_wrist/at_wrist/at_wrist |
| stock-p02-before_studio | sleeve_end | at_wrist | covers_hand ✗ | 2.56 |  | at_wrist/at_wrist/at_wrist |
| stock-p03-before_street | sleeve_end | at_wrist | at_wrist ✓ | 2.08 |  | at_wrist/at_wrist/at_wrist |
| stock-p05-after_street | sleeve_end | above_wrist | unsure |  | arm not hanging / hand in pocket | above_wrist/above_wrist/above_wrist |
| stock-s01-before_studio | sleeve_end | at_wrist | at_wrist ✓ | 2.08 |  | at_wrist/at_wrist/at_wrist |
| stock-s02-before_studio | sleeve_end | mid_bicep|at_elbow | at_elbow ✓ | 0.96 |  | None/None/None |
| stock-s03-before_studio | sleeve_end | at_wrist | unsure |  | no step (hand matches the sleeve, or the sleeve covers it) / no step (hand matches the sleeve, or the sleeve covers it) | at_wrist/at_wrist/at_wrist |
| stock-s04-before_studio | sleeve_end | at_wrist | at_wrist ✓ | 2.12 |  | at_wrist/at_wrist/at_wrist |
| stock-s05-before_studio | sleeve_end | at_wrist | at_wrist ✓ | 2.12 |  | at_wrist/at_wrist/at_wrist |
| stock-s06-before_studio | sleeve_end | at_wrist | at_wrist ✓ | 2.14 |  | at_wrist/at_wrist/at_wrist |
| stock-s07-before_studio | sleeve_end | at_wrist | unsure |  | arm not hanging / no step (hand matches the sleeve, or the sleeve covers it) | at_wrist/at_wrist/at_wrist |
| stock-s08-before_studio | sleeve_end | at_wrist | unsure |  | arm not hanging / hand in pocket | at_wrist/at_wrist/at_wrist |
| stock-s10-before_street | sleeve_end | at_wrist | above_wrist ✗ | 1.72 |  | above_wrist/above_wrist/above_wrist |
| stock-s11-before_street | sleeve_end | above_wrist | at_wrist ✗ | 1.90 |  | above_wrist/above_wrist/above_wrist |
| stock-s13-before_street | sleeve_end | at_wrist | at_wrist ✓ | 2.12 |  | at_wrist/at_wrist/at_wrist |
| stock-s14-before_street | sleeve_end | at_wrist | above_wrist ✗ | 1.78 |  | at_wrist/at_wrist/at_wrist |
| stock-s20-before_phone | sleeve_end | mid_bicep | mid_bicep ✓ | 0.64 |  | None/None/None |
| stock-s21-before_phone | sleeve_end | at_wrist | at_wrist ✓ | 2.18 |  | at_wrist/at_wrist/at_wrist |
| stock-s22-before_phone | sleeve_end | mid_bicep | mid_bicep ✓ | 0.74 |  | None/None/None |
| stock-s23-before_mirror | sleeve_end | mid_bicep | mid_bicep ✓ | 0.74 |  | None/None/None |
| stock-s25-before_mirror | sleeve_end | at_elbow|mid_bicep | unsure |  | joints / joints | None/None/None |
| stock-s27-before_mirror | sleeve_end | mid_bicep|at_elbow | unsure |  | no step (hand matches the sleeve, or the sleeve covers it) / joints | None/None/None |
| mirror-m01 | top_length | mid_fly | at_belt ✗ | 0.02 |  | mid_fly/mid_fly/mid_fly |
| mirror-m02 | top_length | at_belt | at_belt ✓ | 0.02 |  | None/None/None |
| mirror-m03 | top_length | at_belt|mid_fly | mid_fly ✓ | 0.15 |  | mid_fly/mid_fly/mid_fly |
| mirror-m04 | top_length | mid_fly | mid_fly ✓ | 0.11 |  | mid_fly/mid_fly/mid_fly |
| mirror-m06 | top_length | at_belt | unsure |  | neck or hips | at_belt/at_belt/mid_fly |
| mirror-m07 | top_length | at_belt | at_belt ✓ | 0.05 |  | mid_fly/mid_fly/mid_fly |
| mirror-m08 | top_length | mid_fly|below_crotch | unsure |  | neck or hips | below_crotch/below_crotch/None |
| mirror-m09 | top_length | below_crotch | unsure |  | top and bottoms look the same | below_crotch/None/None |
| mirror-m10 | top_length | mid_fly | at_belt ✗ | -0.26 |  | below_crotch/below_crotch/mid_fly |
| mirror-m11 | top_length | mid_fly|below_crotch | unsure |  | chest not on body | None/below_crotch/None |
| mirror-m12 | top_length | mid_fly | cropped ✗ | -0.72 |  | mid_fly/mid_fly/mid_fly |
| oct7-ph1 | top_length | at_belt | unsure |  | neck or hips | mid_fly/mid_fly/mid_fly |
| oct7-ph3 | top_length | mid_fly|below_crotch | mid_fly ✓ | 0.17 |  | below_crotch/None/below_crotch |
| oct7-ph4 | top_length | mid_fly|at_belt | unsure |  | neck or hips | mid_fly/at_belt/at_belt |
| phone-0d39d6 | top_length | at_belt | at_belt ✓ | -0.05 |  | at_belt/at_belt/at_belt |
| phone-1f1997 | top_length | at_belt | unsure |  | top and bottoms look the same | mid_fly |
| phone-5a9049 | top_length | mid_fly | mid_fly ✓ | 0.16 |  | mid_fly/mid_fly/mid_fly |
| phone-6b14db | top_length | at_belt | mid_fly ✗ | 0.15 |  | mid_fly/mid_fly/at_belt |
| phone-7de605 | top_length | at_belt | mid_fly ✗ | 0.11 |  | mid_fly/mid_fly/mid_fly |
| phone-7f14a4 | top_length | at_belt|mid_fly | mid_fly ✓ | 0.16 |  |  |
| phone-8bc29d | top_length | at_belt | at_belt ✓ | -0.15 |  | mid_fly/at_belt/mid_fly |
| phone-968016 | top_length | at_belt | at_belt ✓ | 0.04 |  | mid_fly |
| phone-a765e8 | top_length | at_belt | mid_fly ✗ | 0.10 |  | mid_fly/mid_fly/mid_fly |
| phone-b0f0c8 | top_length | at_belt | at_belt ✓ | 0.04 |  | mid_fly/mid_fly/mid_fly |
| phone-d58b14 | top_length | at_belt? | unsure |  | top and bottoms look the same | mid_fly |
| phone-d6559a | top_length | at_belt | at_belt ✓ | 0.04 |  | at_belt/at_belt/at_belt |
| phone-d918c0 | top_length | at_belt | at_belt ✓ | 0.01 |  | mid_fly/None/None |
| phone-e026de | top_length | at_belt | mid_fly ✗ | 0.18 |  | mid_fly/mid_fly/mid_fly |
| phone-f07193 | top_length | at_belt|mid_fly | mid_fly ✓ | 0.09 |  | mid_fly/mid_fly/mid_fly |
| phone-f4870b | top_length | at_belt|mid_fly | unsure |  | top and bottoms look the same | mid_fly |
| phone-fb0b17 | top_length | at_belt|mid_fly | unsure |  | top and bottoms look the same | mid_fly |
| stock-p01-after_studio | top_length | mid_fly | mid_fly ✓ | 0.24 |  | mid_fly/mid_fly/mid_fly |
| stock-p01-before_studio | top_length | at_belt | at_belt ✓ | -0.03 |  | at_belt/at_belt/at_belt |
| stock-p02-after_studio | top_length | at_belt | mid_fly ✗ | 0.19 |  | at_belt/at_belt/at_belt |
| stock-p02-before_studio | top_length | at_belt | below_crotch ✗ | 0.39 |  | at_belt/at_belt/at_belt |
| stock-p03-after_street | top_length | below_crotch | unsure |  | top and bottoms look the same | below_crotch/below_crotch/at_belt |
| stock-p03-before_street | top_length | mid_fly|below_crotch | unsure |  | top and bottoms look the same | below_crotch/below_crotch/below_crotch |
| stock-p06-before_studio | top_length | at_belt | unsure |  | knees | at_belt/at_belt/at_belt |
| stock-s02-before_studio | top_length | mid_fly | unsure |  | top and bottoms look the same | mid_fly/mid_fly/mid_fly |
| stock-s04-before_studio | top_length | at_belt | unsure |  | top and bottoms look the same | at_belt/at_belt/at_belt |
| stock-s05-before_studio | top_length | at_belt|mid_fly | below_crotch ✗ | 0.73 |  | mid_fly/mid_fly/mid_fly |
| stock-s06-before_studio | top_length | mid_fly | mid_fly ✓ | 0.18 |  | mid_fly/mid_fly/mid_fly |
| stock-s07-before_studio | top_length | mid_fly|below_crotch | unsure |  | top and bottoms look the same | below_crotch/below_crotch/below_crotch |
| stock-s08-before_studio | top_length | at_belt|cropped | below_crotch ✗ | 0.29 |  | None/mid_fly/mid_fly |
| stock-s09-before_street | top_length | mid_fly|below_crotch | at_belt ✗ | -0.05 |  | None/None/None |
| stock-s10-before_street | top_length | at_belt | at_belt ✓ | -0.15 |  | at_belt/at_belt/at_belt |
| stock-s11-before_street | top_length | mid_fly | mid_fly ✓ | 0.11 |  | mid_fly/mid_fly/mid_fly |
| stock-s12-before_street | top_length | at_belt | at_belt ✓ | -0.06 |  | at_belt/at_belt/at_belt |
| stock-s13-before_street | top_length | mid_fly | cropped ✗ | -0.43 |  | below_crotch/mid_fly/below_crotch |
| stock-s14-before_street | top_length | at_belt|mid_fly | mid_fly ✓ | 0.18 |  | at_belt/at_belt/mid_fly |
| stock-s15-before_street | top_length | mid_fly | mid_fly ✓ | 0.12 |  | mid_fly/mid_fly/mid_fly |
| stock-s16-before_street | top_length | at_belt | below_crotch ✗ | 1.00 |  | None/None/None |
| stock-s21-before_phone | top_length | mid_fly | unsure |  | top and bottoms look the same | mid_fly/mid_fly/mid_fly |
| stock-s22-before_phone | top_length | at_belt | at_belt ✓ | 0.03 |  | mid_fly/mid_fly/at_belt |
| stock-s23-before_mirror | top_length | mid_fly | at_belt ✗ | 0.05 |  | mid_fly/mid_fly/mid_fly |
| stock-s24-before_mirror | top_length | at_belt | unsure |  | chest not on body | at_belt/at_belt/at_belt |
| stock-s25-before_mirror | top_length | mid_fly|below_crotch | unsure |  | neck or hips | mid_fly/mid_fly/mid_fly |
| stock-s26-before_mirror | top_length | mid_fly | mid_fly ✓ | 0.14 |  | mid_fly/mid_fly/mid_fly |
| stock-s27-before_mirror | top_length | mid_fly | mid_fly ✓ | 0.12 |  | mid_fly/mid_fly/mid_fly |
| stock-s28-before_mirror | top_length | mid_fly | mid_fly ✓ | 0.11 |  | mid_fly/mid_fly/mid_fly |
| mirror-m01 | top_length_box | mid_fly | at_belt ✗ | 0.05 |  | mid_fly/mid_fly/mid_fly |
| mirror-m02 | top_length_box | at_belt | at_belt ✓ | 0.05 |  | None/None/None |
| mirror-m03 | top_length_box | at_belt|mid_fly | mid_fly ✓ | 0.21 |  | mid_fly/mid_fly/mid_fly |
| mirror-m04 | top_length_box | mid_fly | mid_fly ✓ | 0.15 |  | mid_fly/mid_fly/mid_fly |
| mirror-m06 | top_length_box | at_belt | mid_fly ✗ | 0.10 |  | at_belt/at_belt/mid_fly |
| mirror-m07 | top_length_box | at_belt | mid_fly ✗ | 0.07 |  | mid_fly/mid_fly/mid_fly |
| mirror-m08 | top_length_box | mid_fly|below_crotch | unsure |  | hips | below_crotch/below_crotch/None |
| mirror-m09 | top_length_box | below_crotch | below_crotch ✓ | 0.35 |  | below_crotch/None/None |
| mirror-m10 | top_length_box | mid_fly | below_crotch ✗ | 0.39 |  | below_crotch/below_crotch/mid_fly |
| mirror-m11 | top_length_box | mid_fly|below_crotch | mid_fly ✓ | 0.19 |  | None/below_crotch/None |
| mirror-m12 | top_length_box | mid_fly | mid_fly ✓ | 0.08 |  | mid_fly/mid_fly/mid_fly |
| oct7-ph1 | top_length_box | at_belt | unsure |  | hips | mid_fly/mid_fly/mid_fly |
| oct7-ph3 | top_length_box | mid_fly|below_crotch | mid_fly ✓ | 0.21 |  | below_crotch/None/below_crotch |
| oct7-ph4 | top_length_box | mid_fly|at_belt | unsure |  | hips | mid_fly/at_belt/at_belt |
| phone-1f1997 | top_length_box | at_belt | mid_fly ✗ | 0.08 |  | mid_fly |
| phone-8bc29d | top_length_box | at_belt | at_belt ✓ | 0.04 |  | mid_fly/at_belt/mid_fly |
| phone-968016 | top_length_box | at_belt | at_belt ✓ | 0.06 |  | mid_fly |
| phone-b0f0c8 | top_length_box | at_belt | mid_fly ✗ | 0.07 |  | mid_fly/mid_fly/mid_fly |
| phone-d58b14 | top_length_box | at_belt? | at_belt ✗ | -0.09 |  | mid_fly |
| phone-d6559a | top_length_box | at_belt | mid_fly ✗ | 0.12 |  | at_belt/at_belt/at_belt |
| phone-d918c0 | top_length_box | at_belt | at_belt ✓ | 0.01 |  | mid_fly/None/None |
| phone-e026de | top_length_box | at_belt | mid_fly ✗ | 0.18 |  | mid_fly/mid_fly/mid_fly |
| phone-f07193 | top_length_box | at_belt|mid_fly | mid_fly ✓ | 0.11 |  | mid_fly/mid_fly/mid_fly |
| phone-f4870b | top_length_box | at_belt|mid_fly | mid_fly ✓ | 0.23 |  | mid_fly |
| phone-fb0b17 | top_length_box | at_belt|mid_fly | mid_fly ✓ | 0.20 |  | mid_fly |
| stock-p01-after_studio | top_length_box | mid_fly | mid_fly ✓ | 0.24 |  | mid_fly/mid_fly/mid_fly |
| stock-p01-before_studio | top_length_box | at_belt | at_belt ✓ | -0.02 |  | at_belt/at_belt/at_belt |
| stock-p02-after_studio | top_length_box | at_belt | mid_fly ✗ | 0.19 |  | at_belt/at_belt/at_belt |
| stock-p02-before_studio | top_length_box | at_belt | mid_fly ✗ | 0.22 |  | at_belt/at_belt/at_belt |
| stock-p03-after_street | top_length_box | below_crotch | below_crotch ✓ | 0.77 |  | below_crotch/below_crotch/at_belt |
| stock-p03-before_street | top_length_box | mid_fly|below_crotch | mid_fly ✓ | 0.18 |  | below_crotch/below_crotch/below_crotch |
| stock-p06-before_studio | top_length_box | at_belt | unsure |  | knees | at_belt/at_belt/at_belt |
| stock-s02-before_studio | top_length_box | mid_fly | mid_fly ✓ | 0.22 |  | mid_fly/mid_fly/mid_fly |
| stock-s04-before_studio | top_length_box | at_belt | below_crotch ✗ | 0.41 |  | at_belt/at_belt/at_belt |
| stock-s05-before_studio | top_length_box | at_belt|mid_fly | mid_fly ✓ | 0.15 |  | mid_fly/mid_fly/mid_fly |
| stock-s06-before_studio | top_length_box | mid_fly | mid_fly ✓ | 0.19 |  | mid_fly/mid_fly/mid_fly |
| stock-s07-before_studio | top_length_box | mid_fly|below_crotch | mid_fly ✓ | 0.25 |  | below_crotch/below_crotch/below_crotch |
| stock-s08-before_studio | top_length_box | at_belt|cropped | below_crotch ✗ | 0.29 |  | None/mid_fly/mid_fly |
| stock-s09-before_street | top_length_box | mid_fly|below_crotch | below_crotch ✓ | 0.36 |  | None/None/None |
| stock-s10-before_street | top_length_box | at_belt | mid_fly ✗ | 0.19 |  | at_belt/at_belt/at_belt |
| stock-s11-before_street | top_length_box | mid_fly | mid_fly ✓ | 0.14 |  | mid_fly/mid_fly/mid_fly |
| stock-s12-before_street | top_length_box | at_belt | mid_fly ✗ | 0.09 |  | at_belt/at_belt/at_belt |
| stock-s13-before_street | top_length_box | mid_fly | mid_fly ✓ | 0.19 |  | below_crotch/mid_fly/below_crotch |
| stock-s14-before_street | top_length_box | at_belt|mid_fly | mid_fly ✓ | 0.17 |  | at_belt/at_belt/mid_fly |
| stock-s15-before_street | top_length_box | mid_fly | mid_fly ✓ | 0.25 |  | mid_fly/mid_fly/mid_fly |
| stock-s16-before_street | top_length_box | at_belt | at_belt ✓ | -0.06 |  | None/None/None |
| stock-s21-before_phone | top_length_box | mid_fly | below_crotch ✗ | 0.28 |  | mid_fly/mid_fly/mid_fly |
| stock-s22-before_phone | top_length_box | at_belt | at_belt ✓ | 0.03 |  | mid_fly/mid_fly/at_belt |
| stock-s23-before_mirror | top_length_box | mid_fly | mid_fly ✓ | 0.09 |  | mid_fly/mid_fly/mid_fly |
| stock-s24-before_mirror | top_length_box | at_belt | at_belt ✓ | -0.01 |  | at_belt/at_belt/at_belt |
| stock-s25-before_mirror | top_length_box | mid_fly|below_crotch | unsure |  | hips | mid_fly/mid_fly/mid_fly |
| stock-s26-before_mirror | top_length_box | mid_fly | mid_fly ✓ | 0.21 |  | mid_fly/mid_fly/mid_fly |
| stock-s27-before_mirror | top_length_box | mid_fly | below_crotch ✗ | 1.30 |  | mid_fly/mid_fly/mid_fly |
| stock-s28-before_mirror | top_length_box | mid_fly | mid_fly ✓ | 0.16 |  | mid_fly/mid_fly/mid_fly |

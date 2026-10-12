# Fit ruler test

Run: ruler2. Labels: `ruler_labels.csv` (Claude, Oct 9). AI = zoom1 / zoom1-stock arm B (3 runs, close-ups on) and his phone's own reading for the Oct 9 photos (1 run).

## dev (stock + mirror; tuned on)

| Measure | Labeled | Ruler sure | Ruler right (of sure) | Unsure | AI right, same photos | AI right where ruler sure | Ruler then AI | Same: rerun / 1600 px / 3% crop | AI same over 3 runs |
|---|---|---|---|---|---|---|---|---|---|

## test (his photos; held out)

| Measure | Labeled | Ruler sure | Ruler right (of sure) | Unsure | AI right, same photos | AI right where ruler sure | Ruler then AI | Same: rerun / 1600 px / 3% crop | AI same over 3 runs |
|---|---|---|---|---|---|---|---|---|---|
| sleeve_end | 17 | 7 | 6/7 (85%) | 10/17 (58%) | 32/38 (84%) | 11/11 (100%) | 13/16 (81%) | 17/17 · 13/17 · 13/17 | 16/16 (100%) |
| top_length | 17 | 13 | 9/13 (69%) | 4/17 (23%) | 16/38 (42%) | 14/34 (41%) | 10/16 (62%) | 17/17 · 17/17 · 17/17 | 13/16 (81%) |
| top_length3 | 17 | 13 | 13/13 (100%) | 4/17 (23%) | 35/38 (92%) | 32/34 (94%) | 15/16 (93%) | 17/17 · 17/17 · 17/17 | 15/16 (93%) |
| hem | 11 | 5 | 2/5 (40%) | 6/11 (54%) | 9/23 (39%) | 4/13 (30%) | 5/11 (45%) | 11/11 · 10/11 · 11/11 | 10/11 (90%) |
| layers | 6 | 6 | 6/6 (100%) | 0/6 (0%) | 12/14 (85%) | 12/14 (85%) | 6/6 (100%) | 6/6 · 6/6 · 6/6 | 4/6 (66%) |
| top_length_box | 11 | 11 | 6/11 (54%) | 0/11 (0%) | 9/23 (39%) | 9/23 (39%) | 6/11 (54%) | 11/11 · 11/11 · 9/11 | 9/11 (81%) |
| hem_box | 11 | 10 | 2/10 (20%) | 1/11 (9%) | 9/23 (39%) | 6/20 (30%) | 3/11 (27%) | 11/11 · 11/11 · 11/11 | 10/11 (90%) |

## all

| Measure | Labeled | Ruler sure | Ruler right (of sure) | Unsure | AI right, same photos | AI right where ruler sure | Ruler then AI | Same: rerun / 1600 px / 3% crop | AI same over 3 runs |
|---|---|---|---|---|---|---|---|---|---|
| sleeve_end | 17 | 7 | 6/7 (85%) | 10/17 (58%) | 32/38 (84%) | 11/11 (100%) | 13/16 (81%) | 17/17 · 13/17 · 13/17 | 16/16 (100%) |
| top_length | 17 | 13 | 9/13 (69%) | 4/17 (23%) | 16/38 (42%) | 14/34 (41%) | 10/16 (62%) | 17/17 · 17/17 · 17/17 | 13/16 (81%) |
| top_length3 | 17 | 13 | 13/13 (100%) | 4/17 (23%) | 35/38 (92%) | 32/34 (94%) | 15/16 (93%) | 17/17 · 17/17 · 17/17 | 15/16 (93%) |
| hem | 11 | 5 | 2/5 (40%) | 6/11 (54%) | 9/23 (39%) | 4/13 (30%) | 5/11 (45%) | 11/11 · 10/11 · 11/11 | 10/11 (90%) |
| layers | 6 | 6 | 6/6 (100%) | 0/6 (0%) | 12/14 (85%) | 12/14 (85%) | 6/6 (100%) | 6/6 · 6/6 · 6/6 | 4/6 (66%) |
| top_length_box | 11 | 11 | 6/11 (54%) | 0/11 (0%) | 9/23 (39%) | 9/23 (39%) | 6/11 (54%) | 11/11 · 11/11 · 9/11 | 9/11 (81%) |
| hem_box | 11 | 10 | 2/10 (20%) | 1/11 (9%) | 9/23 (39%) | 6/20 (30%) | 3/11 (27%) | 11/11 · 11/11 · 11/11 | 10/11 (90%) |

## Every labeled reading

| Photo | Measure | Label | Ruler | Position | Why unsure | AI runs |
|---|---|---|---|---|---|---|
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
| phone-8bc29d | layers | no | no ✓ | -0.02 |  | yes/no/no |
| phone-d918c0 | layers | no | no ✓ | -0.67 |  | no/no/no |
| phone-e026de | layers | no | no ✓ | -0.07 |  | yes/no/no |
| phone-f07193 | layers | no | no ✓ | -0.82 |  | no/no/no |
| phone-f4870b | layers | no | no ✓ | -0.08 |  | no |
| phone-fb0b17 | layers | no | no ✓ | -0.07 |  | no |
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

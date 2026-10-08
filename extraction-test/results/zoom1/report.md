# Zoom test

Runs: zoom1. Score = rubric.py (v4), occasion everyday.

| Arm | Consistency | Median s | p90 s | Tokens in/out | ¢/check | Errors |
|---|---|---|---|---|---|---|
| A | 24/27 | 5.59 | 6.7 | 1846/661 | 0.386 | 0 |
| B | 26/27 | 6.21 | 7.93 | 4031/709 | 0.568 | 0 |
| C | 24/27 | 5.5 | 6.79 | 1932/685 | 0.402 | 0 |
| D | 24/27 | 6.02 | 8.02 | 4117/679 | 0.563 | 0 |

## Accuracy on his Oct 8 photos (truth.csv; every run counts)

| Field | A | B | C | D |
|---|---|---|---|---|
| bottom type | 29/30 (96%) | 30/30 (100%) | 30/30 (100%) | 30/30 (100%) |
| color | 72/102 (70%) | 75/102 (73%) | 78/102 (76%) | 73/102 (71%) |
| footwear type | 10/30 (33%) | 16/30 (53%) | 9/30 (30%) | 13/30 (43%) |
| hem | 12/30 (40%) | 13/30 (43%) | 9/30 (30%) | 8/30 (26%) |
| leg_shape | 14/30 (46%) | 13/30 (43%) | 14/30 (46%) | 16/30 (53%) |
| outerwear type | 12/12 (100%) | 11/12 (91%) | 11/12 (91%) | 10/12 (83%) |
| sleeve_end | 23/30 (76%) | 21/30 (70%) | 20/30 (66%) | 18/30 (60%) |
| top type | 24/30 (80%) | 30/30 (100%) | 26/30 (86%) | 29/30 (96%) |

## Footwear as read (Oct 8 photos with boots)

- A: slides_sandals ×9, suede_chukka ×4, other ×3, retro_runner ×3, work_boot ×1, canvas_sneaker ×1
- B: work_boot ×7, suede_chukka ×7, derby ×4, other ×2, canvas_sneaker ×1
- C: suede_chukka ×7, slides_sandals ×7, retro_runner ×3, other ×3, canvas_sneaker ×1
- D: suede_chukka ×16, work_boot ×4, derby ×1

## Unstable photos (a run more than 0.5 from the median)

- A: oct7-ph1 [6.5, 5.0, 5.0]; oct8-8bc29d [8.5, 7.5, 7.5]; oct8-d6559a [7.0, 7.0, 6.0]
- B: mirror-m08 [9.0, 8.0, 9.0]
- C: mirror-m08 [7.5, 8.5, 7.5]; mirror-m09 [7.0, 8.5, 8.0]; oct7-ph1 [6.5, 6.5, 5.0]
- D: mirror-m08 [8.0, 9.0, 9.0]; oct8-d6559a [6.5, 7.5, 6.5]; oct8-f07193 [8.0, 8.0, 7.0]

# Hem ruler (hem4): report

78 labeled photos (hem3_labels.csv); tune = stock + web mirror + odd gold, test = his phone + oct7 + even gold.
Every feature's direction (higher = heavier) was fixed before any cut; cuts are chosen on tune only (best balanced accuracy), then applied once to test.
The AI = the hem-crop yes/no answers (hem3, 3 runs, gemini-3.8-flash), every run counted, on the same photos the ruler answers.

## The ruler

- Legs (2 per photo, untilted): {'measured': 117, 'knee or ankle not seen': 9, 'no hem by color': 16, 'leg not upright': 3, 'feet cut off': 5}; no pose at all: 3 photos.
- Shoulders + knees (the waistline ruler) extrapolated to the floor: median -1.4 cm, middle 80% -9.9 to +8.9 cm (n 68). The knee -> floor ruler is used for the hem instead.
- Tilted ±10°, |change| in hem_cm: median 1.05, 90th pct 7.15 (n 136 leg-pairs).
- Tilted ±10°, |change| in fold_ratio: median 0.44, 90th pct 2.15 (n 114 leg-pairs).
- Tilted ±10°, |change| in widen: median 0.03, 90th pct 0.07 (n 92 leg-pairs).
- Hem by color vs hem by the outline's width drop: median |diff| 9.2 cm, within 3 cm on 27% (n 74).
- Left vs right hem height on clean hems (no folds, no drag): median 2.5 cm (n 27).
- Hem heights found: median 13.6 cm above the floor (the ankle bone on shoes ~10.3); middle 80% 5.2-21.9 cm.
- Same outfit (grey hoodie, wide black jeans): lowest hem 11.1, 11.9, 11.3 cm (spread 0.8).
- Same outfit (black oversized tee, black wide jeans): lowest hem 11.5, 13.2 cm (spread 1.7).
- Same outfit (brown checked shirt, wide jeans): lowest hem 4.8, 4.7 cm (spread 0.1).
- Same outfit (grey hoodie, black joggers): lowest hem 15.2, 13.8, 14.5 cm (spread 1.4).
- Same outfit (navy chore jacket, black jeans): lowest hem 1.7, 2.9 cm (spread 1.2).

## folds_above_shoe

| idea | AUC tune | AUC test | cut (tune) | test right | test unsure | AI right on those photos (runs) | flips at ±10° |
|---|---|---|---|---|---|---|---|
| low_hem | 0.41 | 0.35 | -12.5 | 8/23 (35%) | 4/27 (15%) | 39/69 (57%) | 17/69 |
| below_mp_ankle | 0.35 | 0.59 | 8.7 | 17/23 (74%) | 4/27 (15%) | 39/69 (57%) | 8/69 |
| low_hem_outline | 0.38 | 0.42 | -1 | 16/21 (76%) | 6/27 (22%) | 36/63 (57%) | 6/46 |
| widen | 0.63 | 0.12 | 1.01 | 7/19 (37%) | 8/27 (30%) | 39/57 (68%) | 7/50 |
| folds | 0.54 | 0.57 | 2.93 | 14/22 (64%) | 5/27 (19%) | 39/66 (59%) | 11/61 |
| fold_orient | 0.47 | 0.30 | 1.57 | 10/22 (45%) | 5/27 (19%) | 39/66 (59%) | 11/61 |
| shoe_hidden | 0.42 | 0.63 | -1.34 | 6/23 (26%) | 4/27 (15%) | 39/69 (57%) | 5/69 |
| ragged | 0.32 | 0.44 | 0.32 | 7/23 (30%) | 4/27 (15%) | 39/69 (57%) | 9/69 |
| tilt | 0.21 | 0.49 | 0.25 | 7/23 (30%) | 4/27 (15%) | 39/69 (57%) | 2/69 |
| asym_hem | 0.33 | 0.61 | 0 | 6/22 (27%) | 5/27 (19%) | 39/66 (59%) | 0/47 |
| asym_widen | 0.50 | 0.36 | 0.114 | 6/16 (38%) | 11/27 (41%) | 33/48 (69%) | 7/27 |
| asym_folds | 0.79 | 0.69 | 3.54 | 15/19 (79%) | 8/27 (30%) | 36/57 (63%) | 6/36 |

## drags_at_heel

| idea | AUC tune | AUC test | cut (tune) | test right | test unsure | AI right on those photos (runs) | flips at ±10° |
|---|---|---|---|---|---|---|---|
| low_hem | 0.55 | 0.56 | -8.4 | 15/26 (58%) | 3/29 (10%) | 70/77 (91%) | 10/73 |
| below_mp_ankle | 0.50 | 0.28 | 1.6 | 5/26 (19%) | 3/29 (10%) | 70/77 (91%) | 6/73 |
| low_hem_outline | 0.35 | 0.44 | -0.7 | 20/23 (87%) | 6/29 (21%) | 61/68 (90%) | 2/49 |
| widen | 0.78 | 0.47 | 1.06 | 16/23 (70%) | 6/29 (21%) | 64/68 (94%) | 6/58 |
| folds | 0.41 | 0.48 | 2.83 | 11/25 (44%) | 4/29 (14%) | 67/74 (91%) | 14/66 |
| fold_orient | 0.48 | 0.55 | 1.05 | 8/25 (32%) | 4/29 (14%) | 67/74 (91%) | 5/66 |
| shoe_hidden | 0.38 | 0.26 | -0.26 | 19/26 (73%) | 3/29 (10%) | 70/77 (91%) | 8/73 |
| ragged | 0.65 | 0.32 | 2.27 | 17/26 (65%) | 3/29 (10%) | 70/77 (91%) | 12/73 |
| tilt | 0.65 | 0.25 | 7.93 | 16/26 (62%) | 3/29 (10%) | 70/77 (91%) | 14/73 |
| asym_hem | 0.75 | 0.61 | 5.4 | 20/26 (77%) | 3/29 (10%) | 70/77 (91%) | 11/54 |
| asym_widen | 0.09 | 0.43 | 0.015 | 3/21 (14%) | 8/29 (28%) | 59/63 (94%) | 2/35 |
| asym_folds | 0.19 | 0.49 | 0.82 | 7/24 (29%) | 5/29 (17%) | 65/72 (90%) | 14/44 |

## piles_or_drags

| idea | AUC tune | AUC test | cut (tune) | test right | test unsure | AI right on those photos (runs) | flips at ±10° |
|---|---|---|---|---|---|---|---|
| low_hem | 0.42 | 0.40 | -8.4 | 10/23 (43%) | 4/27 (15%) | 41/69 (59%) | 11/67 |
| below_mp_ankle | 0.35 | 0.55 | -8.1 | 9/23 (39%) | 4/27 (15%) | 41/69 (59%) | 1/67 |
| low_hem_outline | 0.39 | 0.44 | -1 | 14/22 (64%) | 5/27 (19%) | 38/66 (58%) | 6/47 |
| widen | 0.67 | 0.22 | 1.01 | 7/19 (37%) | 8/27 (30%) | 41/57 (72%) | 7/50 |
| folds | 0.51 | 0.50 | 2.83 | 12/22 (55%) | 5/27 (19%) | 41/66 (62%) | 13/60 |
| fold_orient | 0.46 | 0.31 | 1.05 | 9/22 (41%) | 5/27 (19%) | 41/66 (62%) | 6/60 |
| shoe_hidden | 0.38 | 0.42 | -2.2 | 9/23 (39%) | 4/27 (15%) | 41/69 (59%) | 2/67 |
| ragged | 0.41 | 0.38 | 1.62 | 9/23 (39%) | 4/27 (15%) | 41/69 (59%) | 13/67 |
| tilt | 0.37 | 0.37 | 20.2 | 14/23 (61%) | 4/27 (15%) | 41/69 (59%) | 2/67 |
| asym_hem | 0.43 | 0.53 | 4.4 | 13/23 (57%) | 4/27 (15%) | 41/69 (59%) | 10/47 |
| asym_widen | 0.28 | 0.44 | 0.015 | 5/16 (31%) | 11/27 (41%) | 35/48 (73%) | 1/27 |
| asym_folds | 0.47 | 0.57 | 8.49 | 11/20 (55%) | 7/27 (26%) | 38/60 (63%) | 3/37 |

## ankle_shows

| idea | AUC tune | AUC test | cut (tune) | test right | test unsure | AI right on those photos (runs) | flips at ±10° |
|---|---|---|---|---|---|---|---|
| low_hem | 0.55 | 0.78 | -18.7 | 23/29 (79%) | 4/33 (12%) | 86/86 (100%) | 10/79 |
| below_mp_ankle | 0.69 | 0.34 | -0.2 | 23/29 (79%) | 4/33 (12%) | 86/86 (100%) | 9/79 |
| low_hem_outline | 0.50 | 0.46 | -1.1 | 1/25 (4%) | 8/33 (24%) | 74/74 (100%) | 5/52 |
| widen | 0.69 | 0.72 | 0.984 | 14/24 (58%) | 9/33 (27%) | 71/71 (100%) | 13/59 |
| folds | 0.55 | 0.27 | 2.63 | 12/28 (43%) | 5/33 (15%) | 83/83 (100%) | 15/70 |
| fold_orient | 0.62 | 0.75 | 1.01 | 26/28 (93%) | 5/33 (15%) | 83/83 (100%) | 8/70 |
| shoe_hidden | 0.53 | 0.62 | -0.4 | 10/29 (34%) | 4/33 (12%) | 86/86 (100%) | 8/79 |
| ragged | 0.69 | 0.46 | 1.3 | 16/29 (55%) | 4/33 (12%) | 86/86 (100%) | 17/79 |
| tilt | 0.52 | 0.74 | 0.78 | 25/29 (86%) | 4/33 (12%) | 86/86 (100%) | 13/79 |
| asym_hem | 0.24 | 0.62 | 10.1 | 5/28 (18%) | 5/33 (15%) | 83/83 (100%) | 2/56 |
| asym_widen | 0.55 | 0.61 | 0.122 | 13/21 (62%) | 12/33 (36%) | 62/62 (100%) | 7/35 |
| asym_folds | 0.83 | 0.31 | 2.67 | 6/25 (24%) | 8/33 (24%) | 74/74 (100%) | 6/44 |


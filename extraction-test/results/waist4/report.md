# Body rulers for the waistline

Run `waist4`. t = share of the way from the shoulders (0) to the knees (1); ANSUR II men: navel 0.400, hip joint 0.562, crotch 0.619; 0.01 of t ≈ 0.96 cm. Edge: where the pants start.

## 1. Tilt: the same photo as a camera pitched ±10°

| Ruler | Photos read at 0° | Also read at ±10° | Median shift (cm) | 80% shift (cm) | Mean signed shift +10° / −10° (cm) |
|---|---|---|---|---|---|
| hips | 191 | 122 | 1.6 | 2.2 | +1.3 / -1.7 |
| sk_linear | 197 | 124 | 3.1 | 5.0 | +2.7 / -4.2 |
| arm_linear | 61 | 38 | 0.7 | 1.5 | -0.0 / -0.1 |
| body_fit | 197 | 124 | 1.5 | 4.0 | +0.9 / -1.5 |
| ska_proj | 187 | 27 | 1.3 | 3.6 | +0.9 / -3.4 |
| ska_proj_r | 187 | 27 | 1.3 | 3.6 | +1.0 / -3.4 |

## 2. Same outfit, another photo (his)

| Outfit | Shots | hips | sk_linear | arm_linear | body_fit | ska_proj | ska_proj_r | a3d_proj | a3d_ansur | mp_proj | mp_ansur |
|---|---|---|---|---|---|---|---|---|---|---|---|
| grey hoodie, tee below, black joggers | 3 | 0.5 cm (3) | 0.5 cm (3) | – | 10.0 cm (3) | 3.2 cm (3) | 3.1 cm (3) | – | – | – | – |
| grey hoodie, wide black jeans (3 days) | 4 | 3.8 cm (3) | 4.1 cm (3) | – | 3.6 cm (3) | 3.6 cm (3) | 3.6 cm (3) | – | – | – | – |
| red tee, wide black jeans | 2 | 0.6 cm (2) | 0.9 cm (2) | 0.8 cm (2) | 0.1 cm (2) | 1.5 cm (2) | 1.6 cm (2) | – | – | – | – |
| navy chore jacket, white tee, black jeans | 2 | – | – | – | – | – | – | – | – | – | – |
| brown checked shirt, wide jeans | 2 | 0.0 cm (2) | 1.0 cm (2) | – | 1.6 cm (2) | 1.6 cm (2) | 1.6 cm (2) | – | – | – | – |
| black oversized tee, black wide jeans | 2 | – | – | – | – | – | – | – | – | – | – |
| **Median range** | | **0.5** | **0.9** | **0.8** | **2.6** | **2.4** | **2.4** | – | – | – | – |

## 3. Where each ruler puts the edge, by label (median t and the middle 80%; navel 0.400, hip joint 0.562)

| Ruler | tucked | hem at the waistband | mid-fly or lower | tucked spread, 10–90% (cm) |
|---|---|---|---|---|
| hips | 0.467 (0.42–0.57), n 23 | 0.570 (0.49–0.66), n 75 | 0.627 (0.47–0.67), n 13 | 14.8 |
| sk_linear | 0.481 (0.42–0.59), n 25 | 0.592 (0.48–0.69), n 75 | 0.667 (0.51–0.72), n 13 | 16.9 |
| arm_linear | 0.509 (0.46–0.64), n 11 | 0.673 (0.54–0.77), n 26 | 0.768 (0.69–0.77), n 3 | 17.4 |
| body_fit | 0.490 (0.42–0.58), n 25 | 0.581 (0.46–0.70), n 75 | 0.636 (0.44–0.74), n 13 | 15.2 |
| ska_proj | 0.453 (0.37–0.55), n 24 | 0.562 (0.46–0.69), n 70 | 0.629 (0.44–0.66), n 11 | 17.5 |
| ska_proj_r | 0.453 (0.37–0.55), n 24 | 0.562 (0.46–0.69), n 70 | 0.630 (0.44–0.66), n 11 | 17.7 |

## 4. Separating the labels (AUC, 0.5 = chance, 1 = perfect; dev · test)

| Ruler | waist shows vs covered (both passes) | tucked vs hem at the waistband | waistband vs mid-fly | answers (of labeled) |
|---|---|---|---|---|
| hips | 0.86 · 0.85 | 0.82 · 0.89 | 0.78 · 0.67 | 112/182 |
| sk_linear | 0.88 · 0.86 | 0.80 · 0.88 | 0.72 · 0.70 | 114/182 |
| arm_linear | 0.81 · 0.84 | 0.89 · 0.86 | 0.71 · 1.00 | 36/182 |
| body_fit | 0.89 · 0.76 | 0.78 · 0.83 | 0.68 · 0.57 | 114/182 |
| ska_proj | 0.91 · 0.80 | 0.79 · 0.87 | 0.74 · 0.65 | 106/182 |
| ska_proj_r | 0.92 · 0.80 | 0.80 · 0.87 | 0.74 · 0.65 | 106/182 |
| a3d_proj | – · – | – · – | – · – | 0/182 |
| a3d_ansur | – · – | – · – | – · – | 0/182 |
| mp_proj | – · – | – · – | – · – | 0/182 |
| mp_ansur | – · – | – · – | – · – | 0/182 |

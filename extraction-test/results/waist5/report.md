# Body rulers for the waistline

Run `waist5`. t = share of the way from the shoulders (0) to the knees (1); ANSUR II men: navel 0.400, hip joint 0.562, crotch 0.619; 0.01 of t ≈ 0.96 cm. Edge: where the pants start.

## 1. Tilt: the same photo as a camera pitched ±10°

| Ruler | Photos read at 0° | Also read at ±10° | Median shift (cm) | 80% shift (cm) | Mean signed shift +10° / −10° (cm) |
|---|---|---|---|---|---|
| hips | 191 | (no tilt runs) | | | |
| sk_linear | 197 | (no tilt runs) | | | |
| arm_linear | 61 | (no tilt runs) | | | |
| body_fit | 197 | (no tilt runs) | | | |
| ska_proj | 187 | (no tilt runs) | | | |
| ska_proj_r | 187 | (no tilt runs) | | | |

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
| hips | 0.467 (0.42–0.54), n 23 | 0.559 (0.49–0.63), n 75 | 0.627 (0.47–0.67), n 13 | 11.5 |
| sk_linear | 0.461 (0.42–0.55), n 25 | 0.585 (0.48–0.68), n 75 | 0.667 (0.51–0.72), n 13 | 12.7 |
| arm_linear | 0.509 (0.46–0.64), n 11 | 0.673 (0.54–0.77), n 26 | 0.768 (0.69–0.77), n 3 | 17.4 |
| body_fit | 0.489 (0.42–0.55), n 25 | 0.580 (0.46–0.69), n 75 | 0.636 (0.44–0.74), n 13 | 12.9 |
| ska_proj | 0.453 (0.37–0.54), n 24 | 0.557 (0.46–0.65), n 70 | 0.629 (0.44–0.66), n 11 | 16.5 |
| ska_proj_r | 0.453 (0.37–0.54), n 24 | 0.558 (0.46–0.65), n 70 | 0.630 (0.44–0.66), n 11 | 16.5 |

## 4. Separating the labels (AUC, 0.5 = chance, 1 = perfect; dev · test)

| Ruler | waist shows vs covered (both passes) | tucked vs hem at the waistband | waistband vs mid-fly | answers (of labeled) |
|---|---|---|---|---|
| hips | 0.91 · 0.88 | 0.86 · 0.88 | 0.83 · 0.70 | 112/182 |
| sk_linear | 0.90 · 0.88 | 0.83 · 0.86 | 0.76 · 0.71 | 114/182 |
| arm_linear | 0.81 · 0.84 | 0.89 · 0.86 | 0.71 · 1.00 | 36/182 |
| body_fit | 0.92 · 0.79 | 0.80 · 0.81 | 0.72 · 0.60 | 114/182 |
| ska_proj | 0.95 · 0.84 | 0.83 · 0.87 | 0.77 · 0.69 | 106/182 |
| ska_proj_r | 0.95 · 0.83 | 0.83 · 0.87 | 0.78 · 0.69 | 106/182 |
| a3d_proj | – · – | – · – | – · – | 0/182 |
| a3d_ansur | – · – | – · – | – · – | 0/182 |
| mp_proj | – · – | – · – | – · – | 0/182 |
| mp_ansur | – · – | – · – | – · – | 0/182 |

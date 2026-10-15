# Body rulers for the waistline

Run `waist2`. t = share of the way from the shoulders (0) to the knees (1); ANSUR II men: navel 0.400, hip joint 0.562, crotch 0.619; 0.01 of t ≈ 0.96 cm. Edge: where the pants start.

## 1. Tilt: the same photo as a camera pitched ±10°

| Ruler | Photos read at 0° | Also read at ±10° | Median shift (cm) | 80% shift (cm) | Mean signed shift +10° / −10° (cm) |
|---|---|---|---|---|---|
| hips | 191 | 122 | 1.6 | 2.2 | +1.3 / -1.7 |
| sk_linear | 191 | 122 | 3.1 | 5.0 | +2.7 / -4.2 |
| ska_proj | 181 | 27 | 1.3 | 3.6 | +0.9 / -3.4 |
| ska_proj_r | 181 | 27 | 2.8 | 4.0 | +2.7 / -3.9 |
| a3d_proj | 185 | 108 | 3.1 | 10.1 | +1.0 / +3.7 |
| a3d_ansur | 185 | 108 | 3.2 | 6.2 | +2.6 / -0.5 |
| mp_proj | 190 | 114 | 2.3 | 3.9 | +2.7 / -0.3 |
| mp_ansur | 178 | 84 | 3.0 | 4.6 | +3.4 / -1.8 |

## 2. Same outfit, another photo (his)

| Outfit | Shots | hips | sk_linear | ska_proj | ska_proj_r | a3d_proj | a3d_ansur | mp_proj | mp_ansur |
|---|---|---|---|---|---|---|---|---|---|
| grey hoodie, tee below, black joggers | 3 | 0.5 cm (3) | 0.5 cm (3) | 3.2 cm (3) | 0.6 cm (3) | 0.4 cm (3) | 0.4 cm (3) | 1.2 cm (3) | 1.2 cm (3) |
| grey hoodie, wide black jeans (3 days) | 4 | 3.8 cm (3) | 4.1 cm (3) | 3.6 cm (3) | 4.1 cm (3) | 3.3 cm (3) | 3.7 cm (3) | 3.6 cm (3) | 3.4 cm (3) |
| red tee, wide black jeans | 2 | 0.6 cm (2) | 0.9 cm (2) | 1.5 cm (2) | 1.0 cm (2) | 0.2 cm (2) | 0.1 cm (2) | 0.2 cm (2) | 0.1 cm (2) |
| navy chore jacket, white tee, black jeans | 2 | – | – | – | – | – | – | – | – |
| brown checked shirt, wide jeans | 2 | 0.0 cm (2) | 1.0 cm (2) | 1.6 cm (2) | 1.1 cm (2) | 0.1 cm (2) | 0.0 cm (2) | 0.5 cm (2) | 0.4 cm (2) |
| black oversized tee, black wide jeans | 2 | – | – | – | – | – | – | – | – |
| **Median range** | | **0.5** | **0.9** | **2.4** | **1.0** | **0.3** | **0.2** | **0.9** | **0.8** |

## 3. Where each ruler puts the edge, by label (median t and the middle 80%; navel 0.400, hip joint 0.562)

| Ruler | tucked | hem at the waistband | mid-fly or lower | tucked spread, 10–90% (cm) |
|---|---|---|---|---|
| hips | 0.467 (0.42–0.57), n 23 | 0.570 (0.49–0.66), n 75 | 0.627 (0.47–0.67), n 13 | 14.8 |
| sk_linear | 0.481 (0.42–0.59), n 23 | 0.592 (0.48–0.69), n 75 | 0.667 (0.51–0.72), n 13 | 16.9 |
| ska_proj | 0.450 (0.37–0.55), n 22 | 0.562 (0.46–0.69), n 70 | 0.629 (0.44–0.66), n 11 | 17.5 |
| ska_proj_r | 0.474 (0.41–0.59), n 22 | 0.593 (0.49–0.69), n 70 | 0.667 (0.50–0.69), n 11 | 17.1 |
| a3d_proj | 0.488 (0.43–0.60), n 22 | 0.601 (0.51–0.74), n 73 | 0.682 (0.59–0.76), n 13 | 15.8 |
| a3d_ansur | 0.495 (0.44–0.59), n 22 | 0.602 (0.48–0.70), n 73 | 0.666 (0.53–0.76), n 13 | 15.0 |
| mp_proj | 0.455 (0.42–0.55), n 23 | 0.569 (0.47–0.66), n 75 | 0.633 (0.50–0.70), n 13 | 12.7 |
| mp_ansur | 0.460 (0.42–0.57), n 23 | 0.585 (0.49–0.67), n 70 | 0.645 (0.51–0.72), n 11 | 14.3 |

## 4. Separating the labels (AUC, 0.5 = chance, 1 = perfect; dev · test)

| Ruler | waist shows vs covered (both passes) | tucked vs hem at the waistband | waistband vs mid-fly | answers (of labeled) |
|---|---|---|---|---|
| hips | 0.86 · 0.85 | 0.82 · 0.89 | 0.78 · 0.67 | 112/182 |
| sk_linear | 0.87 · 0.86 | 0.79 · 0.88 | 0.72 · 0.70 | 112/182 |
| ska_proj | 0.91 · 0.80 | 0.79 · 0.87 | 0.74 · 0.65 | 104/182 |
| ska_proj_r | 0.92 · 0.85 | 0.80 · 0.89 | 0.76 · 0.70 | 104/182 |
| a3d_proj | 0.83 · 0.86 | 0.82 · 0.77 | 0.75 · 0.78 | 108/182 |
| a3d_ansur | 0.84 · 0.83 | 0.81 · 0.83 | 0.76 · 0.67 | 108/182 |
| mp_proj | 0.88 · 0.85 | 0.82 · 0.89 | 0.77 · 0.71 | 111/182 |
| mp_ansur | 0.87 · 0.82 | 0.85 · 0.88 | 0.84 · 0.64 | 100/182 |

# The pants silhouette

Run `waist3`. Widths in cm on the body ruler's scale; labels pass 1 + leg_labels.csv.

## Separating leg shapes (AUC; dev · test; 0.5 = chance)

| Measure | answers | straight vs slim | wide vs straight | median slim · straight · wide |
|---|---|---|---|---|
| low_over_thigh | 95/278 | 0.84 · 0.65 | 0.80 · 0.80 | 0.53 · 0.67 · 0.79 |
| knee_over_shoulder | 199/278 | 0.60 · 0.34 | 0.75 · 0.83 | 0.26 · 0.26 · 0.34 |
| low_over_shoulder | 180/278 | 0.80 · 0.66 | 0.80 · 0.74 | 0.19 · 0.23 · 0.30 |
| knee_over_top | 149/278 | 0.55 · 0.42 | 0.78 · 0.81 | 0.34 · 0.34 · 0.42 |
| low_cm | 181/278 | 0.81 · 0.77 | 0.81 · 0.80 | 10.00 · 12.40 · 15.70 |
| knee_cm | 199/278 | 0.63 · 0.44 | 0.82 · 0.85 | 13.60 · 14.50 · 17.50 |
| thigh_cm | 114/278 | 0.46 · 0.43 | 0.64 · 0.64 | 17.70 · 17.95 · 19.40 |

The AI's leg_shape on the dev labels: 252/305 (82%) of runs right.

The AI's leg_shape on the test labels: 193/245 (78%) of runs right.

## Best 3-way classifier (cuts picked on dev, scored once on test) vs the AI on the same photos

- low_over_thigh: cuts 0.519 / 0.679; test 30/47 (63%); the AI on the same photos 73%
- knee_over_shoulder: cuts 0.273 / 0.285; test 57/99 (57%); the AI on the same photos 75%
- low_over_shoulder: cuts 0.202 / 0.241; test 58/92 (63%); the AI on the same photos 74%
- knee_over_top: cuts 0.308 / 0.348; test 40/74 (54%); the AI on the same photos 76%
- low_cm: cuts 10.200 / 13.500; test 63/93 (67%); the AI on the same photos 75%
- knee_cm: cuts 13.700 / 15.300; test 62/99 (62%); the AI on the same photos 75%
- thigh_cm: cuts 12.900 / 19.000; test 29/53 (54%); the AI on the same photos 76%

## Against the judges' Proportions (gold photos, rank correlation)

- low_over_thigh: n 63, rho +0.21 (panel +0.17)
- knee_over_shoulder: n 148, rho +0.37 (panel +0.30)
- low_over_shoulder: n 139, rho +0.39 (panel +0.35)
- knee_over_top: n 115, rho +0.42 (panel +0.32)
- low_cm: n 140, rho +0.38 (panel +0.34)
- knee_cm: n 148, rho +0.34 (panel +0.27)
- thigh_cm: n 77, rho -0.01 (panel +0.00)

## Mirror vs propped, by label (median low_over_thigh · knee_over_shoulder)

- slim, mirror: n 8 · 0.55 · 0.29
- slim, other: n 11 · 0.51 · 0.24
- straight, mirror: n 20 · 0.67 · 0.26
- straight, propped: n 4 · 0.69 · 0.26
- straight, other: n 10 · 0.66 · 0.27
- wide, mirror: n 24 · 0.77 · 0.34
- wide, propped: n 7 · 0.81 · 0.35
- wide, other: n 10 · 0.78 · 0.32

## His photos

- phone-0a864e: label straight · AI slim · low/thigh 0.616 · knee/shoulder 0.446 · low 10.6 cm
- phone-1f1997: label wide · AI wide · low/thigh 0.744 · knee/shoulder 0.362 · low 15.1 cm
- phone-3239a6: label straight · AI straight · low/thigh 0.657 · knee/shoulder 0.331 · low 13.6 cm
- phone-403ade: label wide · AI wide · low/thigh 0.856 · knee/shoulder 0.314 · low 15.4 cm
- phone-4c21bb: label straight · AI straight · low/thigh 0.662 · knee/shoulder 0.33 · low 12.9 cm
- phone-7f3c60: label straight · AI straight · low/thigh 0.609 · knee/shoulder 0.264 · low 10.9 cm
- phone-8ad378: label wide · AI wide · low/thigh 0.709 · knee/shoulder 0.319 · low 14.6 cm
- phone-8bc29d: label wide · AI wide/straight/straight · low/thigh 0.685 · knee/shoulder 0.322 · low 13.7 cm
- phone-968016: label wide · AI wide · low/thigh 0.711 · knee/shoulder 0.338 · low 15.5 cm
- phone-9a2e71: label straight · AI straight · low/thigh 0.707 · knee/shoulder 0.335 · low 13.5 cm
- phone-9d3ef4: label straight · AI slim · low/thigh 0.686 · knee/shoulder 0.256 · low 10.5 cm
- phone-d1967f: label straight · AI wide · low/thigh 1.272 · knee/shoulder 0.34 · low 17.3 cm
- phone-d58b14: label wide · AI straight · low/thigh 0.689 · knee/shoulder 0.333 · low 13.1 cm
- phone-e438d4: label straight · AI straight · low/thigh 0.704 · knee/shoulder 0.287 · low 13.3 cm
- phone-f07193: label wide · AI wide/wide/straight · low/thigh 0.699 · knee/shoulder 0.312 · low 13.5 cm
- phone-f4870b: label straight · AI straight · low/thigh 0.675 · knee/shoulder 0.268 · low 12.9 cm
- phone-fb0b17: label straight · AI straight · low/thigh 0.715 · knee/shoulder 0.248 · low 13.8 cm
- phone-602c13: label slim · AI  · low/thigh 0.654 · knee/shoulder 0.331 · low 10.4 cm
- phone-729b22: label straight · AI  · low/thigh 0.834 · knee/shoulder 0.262 · low 14.1 cm
- phone-1f1b29: label straight · AI  · low/thigh 0.654 · knee/shoulder 0.266 · low 12.1 cm
- phone-6bf356: label wide · AI  · low/thigh 0.785 · knee/shoulder 0.292 · low 13.9 cm

# Which model reads the outfit

Control: gemini-3.8-flash (the live config). Score: parts engine v13, Everyday, the stated test profile (rule 7: gold and stock are profile unknown; his profile is pending). Panel = the 5-judge gold-set panel; tune/test = gold_tune's split (test scored once).

## The headline

| System | ¢ per check (read only) | Median s · p90 | Same photo, same score (within 0.5 · identical) | Gold test r with the panel | Proportions r (test) | His 20 | 8+ share (test) |
|---|---|---|---|---|---|---|---|
| gem38 | 0.588 | 6.77 · 9.22 | 284/289 · 228/289 | 0.49 (all 0.58) | 0.50 | 0.46 (13/20 within 0.5) | 15% |
| fl35 | 0.317 | 3.17 · 4.02 | 283/288 · 242/288 | 0.50 (all 0.51) | 0.46 | 0.29 (12/20 within 0.5) | 4% |
| luna | 0.054 | 5.39 · 6.99 | 279/290 · 230/290 | 0.60 (all 0.59) | 0.57 | 0.61 (16/20 within 0.5) | 8% |
| luna_low | 0.068 | 7.51 · 9.61 | 275/288 · 212/288 | 0.58 (all 0.57) | 0.59 | 0.65 (16/20 within 0.5) | 12% |
| luna56 | 0.116 | 4.55 · 5.59 | 284/290 · 237/290 | 0.60 (all 0.57) | 0.50 | 0.61 (15/20 within 0.5) | 13% |
| mini54 | 0.408 | 2.895 · 3.75 | 27/27 · 23/27 | 0.71 (all 0.52) | 0.64 | 0.75 (6/7 within 0.5) | 6% |
| sol6 | 0.997 | 4.635 · 5.58 | 27/27 · 23/27 | 0.67 (all 0.57) | 0.60 | 0.73 (6/7 within 0.5) | 3% |
| luna_waist | 0.075 | 5.39 · 6.99 | 281/290 · 235/290 | 0.53 (all 0.55) | 0.48 | 0.54 (16/20 within 0.5) | 5% |
| luna_vote3 | 0.162 | 5.39 · 6.99 | 216/224 · 184/224 | 0.58 (all 0.55) | 0.51 | 0.69 (17/20 within 0.5) | 12% |
| luna_cascade | 0.127 | 5.39 · 6.99 | 216/224 · 187/224 | 0.57 (all 0.55) | 0.49 | 0.67 (17/20 within 0.5) | 10% |

## Accuracy against truth

His Oct 8 photos: `inputs/phone-oct8/truth.csv` (every run counts). Waist: the two blind label passes where they agree. Leg: pass-1 labels.

| System | top type | bottom type | footwear type | color | leg (truth.csv) | hem | sleeve | waist shows (agreed labels) | leg (labels, all sets) |
|---|---|---|---|---|---|---|---|---|---|
| gem38 | 100% (30) | 100% (30) | 53% (30) | 73% (102) | 43% (30) | 43% (30) | 70% (30) | 88% (351) | 82% (497) |
| fl35 | 100% (20) | 100% (20) | 40% (20) | 61% (68) | 25% (20) | 30% (20) | 90% (20) | 75% (313) | 77% (467) |
| luna | 70% (30) | 90% (30) | 43% (30) | 62% (102) | 80% (30) | 53% (30) | 90% (30) | 72% (874) | 86% (1288) |
| luna56 | 70% (20) | 70% (20) | 70% (20) | 67% (68) | 80% (20) | 20% (20) | 95% (20) | 71% (320) | 84% (475) |
| luna_low | 70% (20) | 85% (20) | 30% (20) | 63% (68) | 45% (20) | 35% (20) | 95% (20) | 80% (321) | 83% (475) |
| mini54 | 70% (20) | 50% (20) | 30% (20) | 63% (68) | 40% (20) | 50% (20) | 100% (20) | 75% (62) | 63% (83) |
| sol6 | 65% (20) | 80% (20) | 30% (20) | 58% (68) | 75% (20) | 70% (20) | 65% (20) | 79% (62) | 79% (82) |
| luna_vote3 | 70% (10) | 90% (10) | 40% (10) | 64% (34) | 80% (10) | 50% (10) | 90% (10) | 73% (292) | 86% (429) |
| luna_cascade | 70% (10) | 90% (10) | 40% (10) | 67% (34) | 80% (10) | 40% (10) | 90% (10) | 73% (292) | 86% (429) |
| luna_waist | 70% (20) | 90% (20) | 45% (20) | 63% (68) | 80% (20) | 55% (20) | 95% (20) | 87% (321) | 84% (473) |

## Same reading as today's Gemini? (run 0 vs run 0, every set)

| System | top | top_len | tuck | top_vol | outer | bottom | leg | hem | shoes | top_color | bottom_color | score within 0.5 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| fl35 | 73% | 52% | 85% | 72% | 86% | 89% | 72% | 58% | 79% | 78% | 76% | 92% |
| luna | 70% | 58% | 79% | 67% | 87% | 83% | 75% | 55% | 60% | 70% | 76% | 89% |
| luna56 | 70% | 45% | 80% | 63% | 86% | 76% | 70% | 53% | 59% | 67% | 68% | 88% |
| luna_low | 72% | 61% | 84% | 69% | 87% | 80% | 71% | 54% | 64% | 73% | 72% | 90% |
| mini54 | 71% | 51% | 86% | 72% | 85% | 68% | 65% | 32% | 56% | 72% | 78% | 86% |
| sol6 | 71% | 74% | 91% | 82% | 85% | 82% | 63% | 52% | 68% | 70% | 79% | 91% |
| luna_vote3 | 71% | 58% | 80% | 67% | 88% | 83% | 73% | 57% | 59% | 71% | 74% | 89% |
| luna_cascade | 70% | 58% | 80% | 67% | 87% | 83% | 73% | 55% | 59% | 71% | 75% | 89% |
| luna_waist | 70% | 59% | 80% | 67% | 87% | 83% | 75% | 55% | 60% | 70% | 76% | 87% |

## Same answer twice? (run 0 vs run 1, per field)

| System | top | top_len | tuck | top_vol | outer | bottom | leg | hem | shoes | top_color | bottom_color |
|---|---|---|---|---|---|---|---|---|---|---|---|
| gem38 | 91% | 87% | 95% | 90% | 95% | 94% | 84% | 76% | 88% | 93% | 90% |
| fl35 | 93% | 90% | 96% | 90% | 94% | 93% | 90% | 77% | 88% | 94% | 89% |
| luna | 90% | 86% | 92% | 94% | 95% | 95% | 92% | 84% | 88% | 94% | 91% |
| luna56 | 90% | 81% | 92% | 94% | 95% | 96% | 93% | 91% | 90% | 91% | 94% |
| luna_low | 85% | 76% | 87% | 91% | 92% | 90% | 87% | 75% | 82% | 87% | 89% |
| mini54 | 88% | 81% | 96% | 96% | 100% | 96% | 88% | 77% | 92% | 92% | 100% |
| sol6 | 85% | 88% | 100% | 88% | 96% | 96% | 96% | 77% | 96% | 92% | 100% |
| luna_vote3 | 92% | 92% | 97% | 97% | 96% | 94% | 96% | 89% | 92% | 94% | 92% |
| luna_cascade | 92% | 92% | 97% | 97% | 96% | 95% | 96% | 85% | 92% | 95% | 93% |
| luna_waist | 90% | 89% | 96% | 94% | 95% | 95% | 92% | 84% | 88% | 94% | 91% |

The cascade read 2.35 times per photo on average (2 when the first two agree, 3 when not).

## Gold detail (test half)

  gem38      n  91 · r 0.49 (raw 0.52, rank 0.54, 2-run mean 0.50) · bias +0.11 · MAE 0.67 · within 0.5 62 · sd 0.69 vs 1.03 · 8+ 15% · steady 88/91 (exact 72)
             by panel band: ≤5.5 n14 → 6.57 · 6–6.5 n19 → 6.79 · 7–7.5 n34 → 7.19 · 8–8.5 n23 → 7.46 · 9+ n1 → 8.00
             by source: ig n53 bias -0.20 r 0.43 · pin n29 bias +0.69 r 0.12 · rd n9 bias +0.06 r 0.00
             parts r: fit 0.20 (sd 0.51, -0.23) · proportions 0.50 (sd 1.15, +0.19) · color 0.08 (sd 0.44, +0.04) · shoes 0.55 (sd 0.92, +0.19) · cohesion 0.45 (sd 0.40, +0.23)
             the founder's 20: r 0.46 · within 0.5 13/20
  fl35       n  91 · r 0.50 (raw 0.55, rank 0.51, 2-run mean 0.51) · bias +0.07 · MAE 0.65 · within 0.5 63 · sd 0.55 vs 1.03 · 8+ 4% · steady 88/91 (exact 75)
             by panel band: ≤5.5 n14 → 6.57 · 6–6.5 n19 → 6.82 · 7–7.5 n34 → 7.13 · 8–8.5 n23 → 7.37 · 9+ n1 → 7.50
             by source: ig n53 bias -0.34 r 0.66 · pin n29 bias +0.81 r 0.16 · rd n9 bias +0.06 r 0.00
             parts r: fit 0.09 (sd 0.51, -0.24) · proportions 0.46 (sd 0.99, +0.01) · color 0.16 (sd 0.41, -0.04) · shoes 0.62 (sd 0.90, +0.20) · cohesion 0.38 (sd 0.40, +0.19)
             the founder's 20: r 0.29 · within 0.5 12/20
  luna       n  91 · r 0.60 (raw 0.64, rank 0.60, 2-run mean 0.62) · bias +0.16 · MAE 0.61 · within 0.5 62 · sd 0.54 vs 1.03 · 8+ 8% · steady 89/91 (exact 76)
             by panel band: ≤5.5 n14 → 6.61 · 6–6.5 n19 → 6.89 · 7–7.5 n34 → 7.28 · 8–8.5 n23 → 7.41 · 9+ n1 → 8.00
             by source: ig n53 bias -0.20 r 0.42 · pin n29 bias +0.79 r 0.44 · rd n9 bias +0.22 r 0.00
             parts r: fit 0.07 (sd 0.29, -0.12) · proportions 0.57 (sd 1.04, +0.26) · color 0.18 (sd 0.49, -0.06) · shoes 0.70 (sd 0.80, +0.20) · cohesion 0.29 (sd 0.36, +0.20)
             the founder's 20: r 0.61 · within 0.5 16/20
  luna_low   n  91 · r 0.58 (raw 0.60, rank 0.60, 2-run mean 0.61) · bias +0.20 · MAE 0.62 · within 0.5 63 · sd 0.55 vs 1.03 · 8+ 12% · steady 88/91 (exact 70)
             by panel band: ≤5.5 n14 → 6.64 · 6–6.5 n19 → 6.95 · 7–7.5 n34 → 7.31 · 8–8.5 n23 → 7.50 · 9+ n1 → 7.50
             by source: ig n53 bias -0.17 r 0.54 · pin n29 bias +0.86 r 0.35 · rd n9 bias +0.28 r 0.00
             parts r: fit 0.03 (sd 0.21, -0.06) · proportions 0.59 (sd 1.04, +0.16) · color 0.24 (sd 0.51, -0.09) · shoes 0.65 (sd 0.87, +0.25) · cohesion 0.33 (sd 0.38, +0.20)
             the founder's 20: r 0.65 · within 0.5 16/20
  luna56     n  91 · r 0.60 (raw 0.59, rank 0.59, 2-run mean 0.62) · bias +0.18 · MAE 0.64 · within 0.5 59 · sd 0.59 vs 1.03 · 8+ 13% · steady 90/91 (exact 76)
             by panel band: ≤5.5 n14 → 6.54 · 6–6.5 n19 → 6.87 · 7–7.5 n34 → 7.35 · 8–8.5 n23 → 7.46 · 9+ n1 → 7.50
             by source: ig n53 bias -0.13 r 0.32 · pin n29 bias +0.81 r 0.51 · rd n9 bias -0.06 r 0.44
             parts r: fit 0.10 (sd 0.19, -0.08) · proportions 0.50 (sd 1.13, +0.17) · color 0.34 (sd 0.63, -0.12) · shoes 0.69 (sd 0.83, +0.38) · cohesion 0.44 (sd 0.42, +0.21)
             the founder's 20: r 0.61 · within 0.5 15/20
  mini54     n  31 · r 0.71 (raw 0.74, rank 0.74, 2-run mean 0.71) · bias +0.03 · MAE 0.52 · within 0.5 22 · sd 0.55 vs 0.92 · 8+ 6% · steady 0/0 (exact 0)
             by panel band: ≤5.5 n4 → 6.38 · 6–6.5 n8 → 6.69 · 7–7.5 n13 → 7.27 · 8–8.5 n5 → 7.40 · 9+ n1 → 7.50
             by source: ig n16 bias -0.16 r 0.65 · pin n12 bias +0.42 r 0.66 · rd n3 bias -0.50 r 0.50
             parts r: fit nan (sd 0.00, +0.00) · proportions 0.64 (sd 1.18, -0.05) · color 0.35 (sd 0.46, +0.03) · shoes 0.65 (sd 0.88, +0.19) · cohesion 0.38 (sd 0.50, +0.11)
             the founder's 20: r 0.75 · within 0.5 6/7
  sol6       n  31 · r 0.67 (raw 0.69, rank 0.66, 2-run mean 0.67) · bias -0.10 · MAE 0.55 · within 0.5 22 · sd 0.64 vs 0.92 · 8+ 3% · steady 0/0 (exact 0)
             by panel band: ≤5.5 n4 → 6.12 · 6–6.5 n8 → 6.44 · 7–7.5 n13 → 7.31 · 8–8.5 n5 → 7.10 · 9+ n1 → 7.50
             by source: ig n16 bias -0.41 r 0.65 · pin n12 bias +0.33 r 0.69 · rd n3 bias -0.17 r -0.87
             parts r: fit nan (sd 0.00, +0.00) · proportions 0.60 (sd 1.15, -0.15) · color 0.52 (sd 0.61, -0.08) · shoes 0.53 (sd 0.90, +0.04) · cohesion 0.40 (sd 0.52, +0.10)
             the founder's 20: r 0.73 · within 0.5 6/7
  luna_waist n  91 · r 0.53 (raw 0.57, rank 0.49, 2-run mean 0.55) · bias +0.11 · MAE 0.67 · within 0.5 59 · sd 0.53 vs 1.03 · 8+ 5% · steady 89/91 (exact 78)
             by panel band: ≤5.5 n14 → 6.61 · 6–6.5 n19 → 6.89 · 7–7.5 n34 → 7.22 · 8–8.5 n23 → 7.30 · 9+ n1 → 8.00
             by source: ig n53 bias -0.26 r 0.23 · pin n29 bias +0.79 r 0.44 · rd n9 bias +0.11 r 0.21
             parts r: fit 0.07 (sd 0.29, -0.12) · proportions 0.48 (sd 1.00, +0.13) · color 0.18 (sd 0.49, -0.06) · shoes 0.70 (sd 0.80, +0.20) · cohesion 0.29 (sd 0.36, +0.20)
             the founder's 20: r 0.54 · within 0.5 16/20
  luna_vote3 n  91 · r 0.58 (raw 0.62, rank 0.59, 2-run mean 0.55) · bias +0.20 · MAE 0.62 · within 0.5 62 · sd 0.53 vs 1.03 · 8+ 12% · steady 88/91 (exact 78)
             by panel band: ≤5.5 n14 → 6.75 · 6–6.5 n19 → 6.87 · 7–7.5 n34 → 7.29 · 8–8.5 n23 → 7.48 · 9+ n1 → 8.00
             by source: ig n53 bias -0.16 r 0.43 · pin n29 bias +0.86 r 0.35 · rd n9 bias +0.17 r 0.25
             parts r: fit -0.02 (sd 0.25, -0.10) · proportions 0.51 (sd 1.01, +0.31) · color 0.30 (sd 0.51, -0.09) · shoes 0.72 (sd 0.82, +0.21) · cohesion 0.22 (sd 0.37, +0.20)
             the founder's 20: r 0.69 · within 0.5 17/20
  luna_cascade n  91 · r 0.57 (raw 0.61, rank 0.58, 2-run mean 0.55) · bias +0.19 · MAE 0.63 · within 0.5 62 · sd 0.51 vs 1.03 · 8+ 10% · steady 88/91 (exact 78)
             by panel band: ≤5.5 n14 → 6.75 · 6–6.5 n19 → 6.87 · 7–7.5 n34 → 7.29 · 8–8.5 n23 → 7.43 · 9+ n1 → 8.00
             by source: ig n53 bias -0.18 r 0.42 · pin n29 bias +0.86 r 0.35 · rd n9 bias +0.17 r 0.25
             parts r: fit -0.02 (sd 0.25, -0.10) · proportions 0.49 (sd 1.00, +0.29) · color 0.30 (sd 0.51, -0.09) · shoes 0.71 (sd 0.82, +0.20) · cohesion 0.23 (sd 0.37, +0.21)
             the founder's 20: r 0.67 · within 0.5 17/20

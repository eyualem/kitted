# Hem close-up reading test (hem3)

78 photos answered of 78 labelled · runs per photo {3: 78} · 0 errors · spent $0.272
Model gemini-3.8-flash, thinking off, temperature 0; prompt_hem3.txt + schema_hem3.json; one tight crop per call.
Pass bar: steady ≥ 90%, right ≥ 85% when it answers, cant_see ≤ 30%.

## a touches (`hem_touches_shoe`): PASSES

| Photos | n | Steady | Right when it answers | cant_see | Right when it says yes | Finds the yeses |
|---|---|---|---|---|---|---|
| all | 78 | 96% (78) | 94% (225) | 0% | 100% (179) | 93% (192) |
| mirror selfie | 44 | 95% (44) | 90% (126) | 0% | 100% (99) | 89% (111) |
| propped/other | 34 | 97% (34) | 99% (99) | 0% | 100% (80) | 99% (81) |
| straight/slim | 43 | 95% (43) | 92% (120) | 0% | 100% (84) | 90% (93) |
| relaxed/wide | 31 | 97% (31) | 96% (93) | 0% | 100% (83) | 95% (87) |
| leg unknown | 4 | 100% (4) | 100% (12) | 0% | 100% (12) | 100% (12) |
| dark on dark | 29 | 97% (29) | 95% (87) | 0% | 100% (68) | 94% (72) |
| not dark on dark | 49 | 96% (49) | 93% (138) | 0% | 100% (111) | 92% (120) |

## b1 folds (`folds_above_shoe`): fails

| Photos | n | Steady | Right when it answers | cant_see | Right when it says yes | Finds the yeses |
|---|---|---|---|---|---|---|
| all | 78 | 86% (78) | 69% (204) | 0% | 46% (74) | 60% (57) |
| mirror selfie | 44 | 84% (44) | 67% (105) | 0% | 32% (38) | 57% (21) |
| propped/other | 34 | 88% (34) | 72% (99) | 0% | 61% (36) | 61% (36) |
| straight/slim | 43 | 88% (43) | 72% (108) | 0% | 38% (48) | 100% (18) |
| relaxed/wide | 31 | 84% (31) | 66% (87) | 0% | 70% (23) | 41% (39) |
| leg unknown | 4 | 75% (4) | 67% (9) | 0% | 0% (3) | – |
| dark on dark | 29 | 90% (29) | 75% (63) | 0% | 48% (25) | 80% (15) |
| not dark on dark | 49 | 84% (49) | 67% (141) | 0% | 45% (49) | 52% (42) |

## b2 drags (`drags_at_heel`): PASSES

| Photos | n | Steady | Right when it answers | cant_see | Right when it says yes | Finds the yeses |
|---|---|---|---|---|---|---|
| all | 78 | 94% (78) | 91% (200) | 2% | 100% (6) | 25% (24) |
| mirror selfie | 44 | 91% (44) | 88% (113) | 4% | 100% (1) | 7% (15) |
| propped/other | 34 | 97% (34) | 95% (87) | 0% | 100% (5) | 56% (9) |
| straight/slim | 43 | 100% (43) | 100% (123) | 0% | – | – |
| relaxed/wide | 31 | 87% (31) | 83% (69) | 4% | 100% (6) | 33% (18) |
| leg unknown | 4 | 75% (4) | 25% (8) | 8% | – | 0% (6) |
| dark on dark | 29 | 93% (29) | 82% (72) | 1% | 100% (2) | 13% (15) |
| not dark on dark | 49 | 94% (49) | 96% (128) | 3% | 100% (4) | 44% (9) |

## c ankle (`ankle_shows`): PASSES

| Photos | n | Steady | Right when it answers | cant_see | Right when it says yes | Finds the yeses |
|---|---|---|---|---|---|---|
| all | 78 | 95% (78) | 97% (224) | 0% | 85% (46) | 100% (39) |
| mirror selfie | 44 | 95% (44) | 95% (126) | 0% | 75% (24) | 100% (18) |
| propped/other | 34 | 94% (34) | 99% (98) | 1% | 95% (22) | 100% (21) |
| straight/slim | 43 | 93% (43) | 95% (122) | 1% | 85% (39) | 100% (33) |
| relaxed/wide | 31 | 97% (31) | 99% (90) | 0% | 86% (7) | 100% (6) |
| leg unknown | 4 | 100% (4) | 100% (12) | 0% | – | – |
| dark on dark | 29 | 97% (29) | 99% (81) | 0% | 94% (16) | 100% (15) |
| not dark on dark | 49 | 94% (49) | 96% (143) | 1% | 80% (30) | 100% (24) |

## b piles|drags (`piles_or_drags`): fails

| Photos | n | Steady | Right when it answers | cant_see | Right when it says yes | Finds the yeses |
|---|---|---|---|---|---|---|
| all | 78 | 85% (78) | 66% (198) | 0% | 57% (76) | 55% (78) |
| mirror selfie | 44 | 84% (44) | 67% (108) | 1% | 50% (38) | 53% (36) |
| propped/other | 34 | 85% (34) | 64% (90) | 0% | 63% (38) | 57% (42) |
| straight/slim | 43 | 88% (43) | 71% (105) | 0% | 38% (48) | 100% (18) |
| relaxed/wide | 31 | 81% (31) | 63% (84) | 1% | 100% (23) | 43% (54) |
| leg unknown | 4 | 75% (4) | 22% (9) | 0% | 40% (5) | 33% (6) |
| dark on dark | 29 | 83% (29) | 71% (63) | 1% | 73% (26) | 63% (30) |
| not dark on dark | 49 | 86% (49) | 63% (135) | 0% | 48% (50) | 50% (48) |

## Who's in the photos (rule 7)

- founder: profile pending (birth year and picks not given yet) · 19 photos
- friend: chore coat + white tee: profile unknown · 3 photos
- friend: navy blazer: profile unknown · 1 photos
- public screenshot (gold set): profile unknown · 25 photos
- stock photo: profile unknown · 22 photos
- unknown (ask the founder): the Oct 10 16:07 check: profile unknown · 1 photos
- web photo: profile unknown · 7 photos

## Unsteady photos (answers differ across runs)

- ig-001: b1 folds yes/yes/no; b2 drags cant_see/cant_see/yes
- ig-040: b2 drags no/cant_see/no
- ig-043: b1 folds yes/yes/no
- ig-100: b1 folds yes/no/no
- ig-103: b1 folds yes/no/no; b2 drags cant_see/no/no
- ig-130: b2 drags no/cant_see/no
- mirror-m05: a touches no/yes/no; c ankle yes/no/yes
- oct7-ph1: a touches yes/no/yes; c ankle no/yes/no
- phone-8ad378: b1 folds no/yes/no
- phone-d58b14: b2 drags yes/no/yes
- phone-fb0b17: b1 folds no/yes/yes
- pin-050: a touches no/yes/yes; c ankle cant_see/no/no
- pin-065: b1 folds no/yes/no
- stock-p02-after_studio: b1 folds yes/no/yes
- stock-p02-before_studio: b1 folds no/yes/yes
- stock-p03-before_street: b1 folds no/no/yes
- stock-s11-before_street: b1 folds no/yes/no; c ankle no/no/yes

## On paper: the creators' version with today's readings (no engine change)

What the creators' version would do (each rule uses this test's majority answer per photo):
- D (needs b2 drags): dragging costs on every leg: the hem counts as piling, on relaxed and wide legs too ([FIT-4] severities: trousers/chinos −2.0, jeans/cargos −1.5, sweats −0.5; it also blocks the shape credits, [PRO-8])
- P (needs b1 folds): piling costs on a straight or slim leg (today's [FIT-4] pooling charge)
- C (needs b1 folds and b2 drags): a 'pooling' reading is cleared when both say no
- S: a soft stack on a relaxed or wide leg stays free (already v8 [FIT-4]; never moves a score here)
- R (needs a touches): 'rests on the shoe' for loose jeans dragging on slides ([SHO-2] SK1b) comes from a
- T (needs c ankle and a touches): ankle or sock showing under relaxed or wide trousers or chinos is a tip only
Scores are the median over the existing runs of each photo (gold has 2 runs, so a median can end in .25/.75).

Readings on disk for 78 of 78 photos (b1 arm A 39, zoom1 arm B 14, gold1 25). Engine: parts_proto default (parts-proto-10 (Oct 13, 2026)), Everyday, the stated test profile.

| Rules applied | his + friends' saved checks (phone) | other saved test photos (Oct 7, mirror, stock) | gold photos | tips (T) |
|---|---|---|---|---|
| rule D alone | 0 down, 0 up of 22 | 0 down, 0 up of 31 | 0 down, 0 up of 25 | 0 |
| rule P alone | 0 down, 0 up of 22 | 4 down, 0 up of 31 | 4 down, 0 up of 25 | 0 |
| rule C alone | 0 down, 0 up of 22 | 0 down, 0 up of 31 | 0 down, 0 up of 25 | 0 |
| rule R alone | 0 down, 0 up of 22 | 0 down, 0 up of 31 | 0 down, 0 up of 25 | 0 |
| rule T alone | 0 down, 0 up of 22 | 0 down, 0 up of 31 | 0 down, 0 up of 25 | 3 |
| every rule whose questions passed (D,R,T) | 0 down, 0 up of 22 | 0 down, 0 up of 31 | 0 down, 0 up of 25 | 3 |
| all rules (if every question passed) (C,D,P,R,T) | 0 down, 0 up of 22 | 4 down, 0 up of 31 | 4 down, 0 up of 25 | 3 |

Moved under 'all rules (if every question passed)':
- mirror-m01: 7 → 6.5  (answers: a touches yes, b1 folds yes, b2 drags no, c ankle no)
- pin-025: 7 → 6.75  (answers: a touches yes, b1 folds yes, b2 drags no, c ankle no)
- pin-050: 7.5 → 7  (answers: a touches yes, b1 folds yes, b2 drags no, c ankle no)
- pin-052: 7.25 → 6.75  (answers: a touches yes, b1 folds yes, b2 drags no, c ankle no)
- rd-013: 7 → 6.5  (answers: a touches yes, b1 folds yes, b2 drags no, c ankle no)
- stock-s10-before_street: 7 → 6.5  (answers: a touches yes, b1 folds yes, b2 drags no, c ankle no)
- stock-s13-before_street: 7 → 6.5  (answers: a touches yes, b1 folds yes, b2 drags no, c ankle no)
- stock-s25-before_mirror: 7.5 → 7  (answers: a touches yes, b1 folds yes, b2 drags no, c ankle no)


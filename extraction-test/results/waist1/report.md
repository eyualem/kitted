# Waist ruler test

Run `waist1`. Truth: waist_labels/ (Claude subagents, Oct 14, blind). "Waist shows" = tucked, a cropped top, or a hem at the waistband with the waistband visible.

## dev

### All labeled

Labeled photos: 90 (waist shows 64, covered 26).

| | Ruler | AI |
|---|---|---|
| Right when it answers | 49/58 (84%) | 113/127 (89%) on the same photos · 182/203 (90%) on all |
| Unsure | 32/90 (36%) | 0 |
| Same answer: rerun · 1600 px · 3% crop | 90/90 · 90/90 · 78/90 | 83/89 (93%) photos same over runs |
| Wrong "waist shows" (the credit firing on a covered waist), first AI run | 5 | 5 |
| Combined: ruler when sure, else the AI | 79/90 (88%) | AI alone (first run) 82/90 (91%) |
| Frozen veto (pants start below s -0.12, no belt): every AI run | 185/203 (91%) (fixes 5, breaks 2) | AI runs alone 182/203 (90%) |

### No outer layer (where the credit can fire)

Labeled photos: 60 (waist shows 41, covered 19).

| | Ruler | AI |
|---|---|---|
| Right when it answers | 37/43 (86%) | 81/92 (88%) on the same photos · 116/130 (89%) on all |
| Unsure | 17/60 (28%) | 0 |
| Same answer: rerun · 1600 px · 3% crop | 60/60 · 60/60 · 52/60 | 56/59 (95%) photos same over runs |
| Wrong "waist shows" (the credit firing on a covered waist), first AI run | 3 | 3 |
| Combined: ruler when sure, else the AI | 53/60 (88%) | AI alone (first run) 54/60 (90%) |
| Frozen veto (pants start below s -0.12, no belt): every AI run | 119/130 (92%) (fixes 5, breaks 2) | AI runs alone 116/130 (89%) |

### His photos

Labeled photos: 0 (waist shows 0, covered 0).

| | Ruler | AI |
|---|---|---|
| Right when it answers | – | – on the same photos · – on all |
| Unsure | – | 0 |
| Same answer: rerun · 1600 px · 3% crop | 0/0 · 0/0 · 0/0 | – photos same over runs |
| Wrong "waist shows" (the credit firing on a covered waist), first AI run | 0 | 0 |
| Combined: ruler when sure, else the AI | – | AI alone (first run) – |
| Frozen veto (pants start below s -0.12, no belt): every AI run | – (fixes 0, breaks 0) | AI runs alone – |

### Mirror selfies

Labeled photos: 36 (waist shows 30, covered 6).

| | Ruler | AI |
|---|---|---|
| Right when it answers | 17/19 (89%) | 36/42 (86%) on the same photos · 73/82 (89%) on all |
| Unsure | 17/36 (47%) | 0 |
| Same answer: rerun · 1600 px · 3% crop | 36/36 · 36/36 · 30/36 | 33/36 (92%) photos same over runs |
| Wrong "waist shows" (the credit firing on a covered waist), first AI run | 1 | 1 |
| Combined: ruler when sure, else the AI | 33/36 (92%) | AI alone (first run) 33/36 (92%) |
| Frozen veto (pants start below s -0.12, no belt): every AI run | 73/82 (89%) (fixes 0, breaks 0) | AI runs alone 73/82 (89%) |

### Propped / other

Labeled photos: 54 (waist shows 34, covered 20).

| | Ruler | AI |
|---|---|---|
| Right when it answers | 32/39 (82%) | 77/85 (91%) on the same photos · 109/121 (90%) on all |
| Unsure | 15/54 (28%) | 0 |
| Same answer: rerun · 1600 px · 3% crop | 54/54 · 54/54 · 48/54 | 50/53 (94%) photos same over runs |
| Wrong "waist shows" (the credit firing on a covered waist), first AI run | 4 | 4 |
| Combined: ruler when sure, else the AI | 46/54 (85%) | AI alone (first run) 49/54 (91%) |
| Frozen veto (pants start below s -0.12, no belt): every AI run | 112/121 (93%) (fixes 5, breaks 2) | AI runs alone 109/121 (90%) |

### Dark on dark

Labeled photos: 9 (waist shows 6, covered 3).

| | Ruler | AI |
|---|---|---|
| Right when it answers | 1/1 (100%) | 2/2 (100%) on the same photos · 23/23 (100%) on all |
| Unsure | 8/9 (89%) | 0 |
| Same answer: rerun · 1600 px · 3% crop | 9/9 · 9/9 · 9/9 | 9/9 (100%) photos same over runs |
| Wrong "waist shows" (the credit firing on a covered waist), first AI run | 0 | 0 |
| Combined: ruler when sure, else the AI | 9/9 (100%) | AI alone (first run) 9/9 (100%) |
| Frozen veto (pants start below s -0.12, no belt): every AI run | 23/23 (100%) (fixes 0, breaks 0) | AI runs alone 23/23 (100%) |

### Hand at the waist

Labeled photos: 46 (waist shows 35, covered 11).

| | Ruler | AI |
|---|---|---|
| Right when it answers | 25/28 (89%) | 53/62 (85%) on the same photos · 94/105 (90%) on all |
| Unsure | 18/46 (39%) | 0 |
| Same answer: rerun · 1600 px · 3% crop | 46/46 · 46/46 · 38/46 | 42/46 (91%) photos same over runs |
| Wrong "waist shows" (the credit firing on a covered waist), first AI run | 1 | 2 |
| Combined: ruler when sure, else the AI | 43/46 (93%) | AI alone (first run) 43/46 (93%) |
| Frozen veto (pants start below s -0.12, no belt): every AI run | 95/105 (90%) (fixes 3, breaks 2) | AI runs alone 94/105 (90%) |

### High-confidence labels only

Labeled photos: 31 (waist shows 27, covered 4).

| | Ruler | AI |
|---|---|---|
| Right when it answers | 19/21 (90%) | 46/48 (96%) on the same photos · 67/71 (94%) on all |
| Unsure | 10/31 (32%) | 0 |
| Same answer: rerun · 1600 px · 3% crop | 31/31 · 31/31 · 27/31 | 31/31 (100%) photos same over runs |
| Wrong "waist shows" (the credit firing on a covered waist), first AI run | 0 | 2 |
| Combined: ruler when sure, else the AI | 28/31 (90%) | AI alone (first run) 29/31 (94%) |
| Frozen veto (pants start below s -0.12, no belt): every AI run | 67/71 (94%) (fixes 2, breaks 2) | AI runs alone 67/71 (94%) |

## test

### All labeled

Labeled photos: 92 (waist shows 64, covered 28).

| | Ruler | AI |
|---|---|---|
| Right when it answers | 43/54 (80%) | 84/102 (82%) on the same photos · 147/176 (84%) on all |
| Unsure | 38/92 (41%) | 0 |
| Same answer: rerun · 1600 px · 3% crop | 92/92 · 91/92 · 76/92 | 70/77 (91%) photos same over runs |
| Wrong "waist shows" (the credit firing on a covered waist), first AI run | 6 | 5 |
| Combined: ruler when sure, else the AI | 76/92 (83%) | AI alone (first run) 76/92 (83%) |
| Frozen veto (pants start below s -0.12, no belt): every AI run | 144/176 (82%) (fixes 0, breaks 3) | AI runs alone 147/176 (84%) |

### No outer layer (where the credit can fire)

Labeled photos: 67 (waist shows 44, covered 23).

| | Ruler | AI |
|---|---|---|
| Right when it answers | 33/41 (80%) | 62/76 (82%) on the same photos · 101/124 (81%) on all |
| Unsure | 26/67 (39%) | 0 |
| Same answer: rerun · 1600 px · 3% crop | 67/67 · 66/67 · 52/67 | 51/53 (96%) photos same over runs |
| Wrong "waist shows" (the credit firing on a covered waist), first AI run | 4 | 5 |
| Combined: ruler when sure, else the AI | 55/67 (82%) | AI alone (first run) 55/67 (82%) |
| Frozen veto (pants start below s -0.12, no belt): every AI run | 98/124 (79%) (fixes 0, breaks 3) | AI runs alone 101/124 (81%) |

### His photos

Labeled photos: 23 (waist shows 13, covered 10).

| | Ruler | AI |
|---|---|---|
| Right when it answers | 10/13 (77%) | 14/22 (64%) on the same photos · 28/40 (70%) on all |
| Unsure | 10/23 (43%) | 0 |
| Same answer: rerun · 1600 px · 3% crop | 23/23 · 22/23 · 19/23 | 7/9 (78%) photos same over runs |
| Wrong "waist shows" (the credit firing on a covered waist), first AI run | 2 | 1 |
| Combined: ruler when sure, else the AI | 18/23 (78%) | AI alone (first run) 17/23 (74%) |
| Frozen veto (pants start below s -0.12, no belt): every AI run | 28/40 (70%) (fixes 0, breaks 0) | AI runs alone 28/40 (70%) |

### Mirror selfies

Labeled photos: 54 (waist shows 33, covered 21).

| | Ruler | AI |
|---|---|---|
| Right when it answers | 25/31 (81%) | 47/58 (81%) on the same photos · 86/103 (83%) on all |
| Unsure | 23/54 (43%) | 0 |
| Same answer: rerun · 1600 px · 3% crop | 54/54 · 53/54 · 43/54 | 38/41 (93%) photos same over runs |
| Wrong "waist shows" (the credit firing on a covered waist), first AI run | 5 | 4 |
| Combined: ruler when sure, else the AI | 45/54 (83%) | AI alone (first run) 45/54 (83%) |
| Frozen veto (pants start below s -0.12, no belt): every AI run | 86/103 (83%) (fixes 0, breaks 0) | AI runs alone 86/103 (83%) |

### Propped / other

Labeled photos: 38 (waist shows 31, covered 7).

| | Ruler | AI |
|---|---|---|
| Right when it answers | 18/23 (78%) | 37/44 (84%) on the same photos · 61/73 (84%) on all |
| Unsure | 15/38 (39%) | 0 |
| Same answer: rerun · 1600 px · 3% crop | 38/38 · 38/38 · 33/38 | 32/36 (89%) photos same over runs |
| Wrong "waist shows" (the credit firing on a covered waist), first AI run | 1 | 1 |
| Combined: ruler when sure, else the AI | 31/38 (82%) | AI alone (first run) 31/38 (82%) |
| Frozen veto (pants start below s -0.12, no belt): every AI run | 58/73 (79%) (fixes 0, breaks 3) | AI runs alone 61/73 (84%) |

### Dark on dark

Labeled photos: 10 (waist shows 5, covered 5).

| | Ruler | AI |
|---|---|---|
| Right when it answers | – | – on the same photos · 16/16 (100%) on all |
| Unsure | 10/10 (100%) | 0 |
| Same answer: rerun · 1600 px · 3% crop | 10/10 · 10/10 · 10/10 | 6/6 (100%) photos same over runs |
| Wrong "waist shows" (the credit firing on a covered waist), first AI run | 0 | 0 |
| Combined: ruler when sure, else the AI | 10/10 (100%) | AI alone (first run) 10/10 (100%) |
| Frozen veto (pants start below s -0.12, no belt): every AI run | 16/16 (100%) (fixes 0, breaks 0) | AI runs alone 16/16 (100%) |

### Hand at the waist

Labeled photos: 45 (waist shows 31, covered 14).

| | Ruler | AI |
|---|---|---|
| Right when it answers | 21/29 (72%) | 45/55 (82%) on the same photos · 71/85 (84%) on all |
| Unsure | 16/45 (36%) | 0 |
| Same answer: rerun · 1600 px · 3% crop | 45/45 · 45/45 · 38/45 | 37/41 (90%) photos same over runs |
| Wrong "waist shows" (the credit firing on a covered waist), first AI run | 4 | 3 |
| Combined: ruler when sure, else the AI | 35/45 (78%) | AI alone (first run) 35/45 (78%) |
| Frozen veto (pants start below s -0.12, no belt): every AI run | 68/85 (80%) (fixes 0, breaks 3) | AI runs alone 71/85 (84%) |

### High-confidence labels only

Labeled photos: 31 (waist shows 28, covered 3).

| | Ruler | AI |
|---|---|---|
| Right when it answers | 14/16 (88%) | 29/31 (94%) on the same photos · 57/62 (92%) on all |
| Unsure | 15/31 (48%) | 0 |
| Same answer: rerun · 1600 px · 3% crop | 31/31 · 31/31 · 27/31 | 28/28 (100%) photos same over runs |
| Wrong "waist shows" (the credit firing on a covered waist), first AI run | 1 | 0 |
| Combined: ruler when sure, else the AI | 28/31 (90%) | AI alone (first run) 29/31 (94%) |
| Frozen veto (pants start below s -0.12, no belt): every AI run | 55/62 (89%) (fixes 0, breaks 2) | AI runs alone 57/62 (92%) |

## all

### All labeled

Labeled photos: 182 (waist shows 128, covered 54).

| | Ruler | AI |
|---|---|---|
| Right when it answers | 92/112 (82%) | 197/229 (86%) on the same photos · 329/379 (87%) on all |
| Unsure | 70/182 (38%) | 0 |
| Same answer: rerun · 1600 px · 3% crop | 182/182 · 181/182 · 154/182 | 153/166 (92%) photos same over runs |
| Wrong "waist shows" (the credit firing on a covered waist), first AI run | 11 | 10 |
| Combined: ruler when sure, else the AI | 155/182 (85%) | AI alone (first run) 158/182 (87%) |
| Frozen veto (pants start below s -0.12, no belt): every AI run | 329/379 (87%) (fixes 5, breaks 5) | AI runs alone 329/379 (87%) |

### No outer layer (where the credit can fire)

Labeled photos: 127 (waist shows 85, covered 42).

| | Ruler | AI |
|---|---|---|
| Right when it answers | 70/84 (83%) | 143/168 (85%) on the same photos · 217/254 (85%) on all |
| Unsure | 43/127 (34%) | 0 |
| Same answer: rerun · 1600 px · 3% crop | 127/127 · 126/127 · 104/127 | 107/112 (96%) photos same over runs |
| Wrong "waist shows" (the credit firing on a covered waist), first AI run | 7 | 8 |
| Combined: ruler when sure, else the AI | 108/127 (85%) | AI alone (first run) 109/127 (86%) |
| Frozen veto (pants start below s -0.12, no belt): every AI run | 217/254 (85%) (fixes 5, breaks 5) | AI runs alone 217/254 (85%) |

### His photos

Labeled photos: 23 (waist shows 13, covered 10).

| | Ruler | AI |
|---|---|---|
| Right when it answers | 10/13 (77%) | 14/22 (64%) on the same photos · 28/40 (70%) on all |
| Unsure | 10/23 (43%) | 0 |
| Same answer: rerun · 1600 px · 3% crop | 23/23 · 22/23 · 19/23 | 7/9 (78%) photos same over runs |
| Wrong "waist shows" (the credit firing on a covered waist), first AI run | 2 | 1 |
| Combined: ruler when sure, else the AI | 18/23 (78%) | AI alone (first run) 17/23 (74%) |
| Frozen veto (pants start below s -0.12, no belt): every AI run | 28/40 (70%) (fixes 0, breaks 0) | AI runs alone 28/40 (70%) |

### Mirror selfies

Labeled photos: 90 (waist shows 63, covered 27).

| | Ruler | AI |
|---|---|---|
| Right when it answers | 42/50 (84%) | 83/100 (83%) on the same photos · 159/185 (86%) on all |
| Unsure | 40/90 (44%) | 0 |
| Same answer: rerun · 1600 px · 3% crop | 90/90 · 89/90 · 73/90 | 71/77 (92%) photos same over runs |
| Wrong "waist shows" (the credit firing on a covered waist), first AI run | 6 | 5 |
| Combined: ruler when sure, else the AI | 78/90 (87%) | AI alone (first run) 78/90 (87%) |
| Frozen veto (pants start below s -0.12, no belt): every AI run | 159/185 (86%) (fixes 0, breaks 0) | AI runs alone 159/185 (86%) |

### Propped / other

Labeled photos: 92 (waist shows 65, covered 27).

| | Ruler | AI |
|---|---|---|
| Right when it answers | 50/62 (81%) | 114/129 (88%) on the same photos · 170/194 (88%) on all |
| Unsure | 30/92 (33%) | 0 |
| Same answer: rerun · 1600 px · 3% crop | 92/92 · 92/92 · 81/92 | 82/89 (92%) photos same over runs |
| Wrong "waist shows" (the credit firing on a covered waist), first AI run | 5 | 5 |
| Combined: ruler when sure, else the AI | 77/92 (84%) | AI alone (first run) 80/92 (87%) |
| Frozen veto (pants start below s -0.12, no belt): every AI run | 170/194 (88%) (fixes 5, breaks 5) | AI runs alone 170/194 (88%) |

### Dark on dark

Labeled photos: 19 (waist shows 11, covered 8).

| | Ruler | AI |
|---|---|---|
| Right when it answers | 1/1 (100%) | 2/2 (100%) on the same photos · 39/39 (100%) on all |
| Unsure | 18/19 (95%) | 0 |
| Same answer: rerun · 1600 px · 3% crop | 19/19 · 19/19 · 19/19 | 15/15 (100%) photos same over runs |
| Wrong "waist shows" (the credit firing on a covered waist), first AI run | 0 | 0 |
| Combined: ruler when sure, else the AI | 19/19 (100%) | AI alone (first run) 19/19 (100%) |
| Frozen veto (pants start below s -0.12, no belt): every AI run | 39/39 (100%) (fixes 0, breaks 0) | AI runs alone 39/39 (100%) |

### Hand at the waist

Labeled photos: 91 (waist shows 66, covered 25).

| | Ruler | AI |
|---|---|---|
| Right when it answers | 46/57 (81%) | 98/117 (84%) on the same photos · 165/190 (87%) on all |
| Unsure | 34/91 (37%) | 0 |
| Same answer: rerun · 1600 px · 3% crop | 91/91 · 91/91 · 76/91 | 79/87 (91%) photos same over runs |
| Wrong "waist shows" (the credit firing on a covered waist), first AI run | 5 | 5 |
| Combined: ruler when sure, else the AI | 78/91 (86%) | AI alone (first run) 78/91 (86%) |
| Frozen veto (pants start below s -0.12, no belt): every AI run | 163/190 (86%) (fixes 3, breaks 5) | AI runs alone 165/190 (87%) |

### High-confidence labels only

Labeled photos: 62 (waist shows 55, covered 7).

| | Ruler | AI |
|---|---|---|
| Right when it answers | 33/37 (89%) | 75/79 (95%) on the same photos · 124/133 (93%) on all |
| Unsure | 25/62 (40%) | 0 |
| Same answer: rerun · 1600 px · 3% crop | 62/62 · 62/62 · 54/62 | 59/59 (100%) photos same over runs |
| Wrong "waist shows" (the credit firing on a covered waist), first AI run | 1 | 2 |
| Combined: ruler when sure, else the AI | 56/62 (90%) | AI alone (first run) 58/62 (94%) |
| Frozen veto (pants start below s -0.12, no belt): every AI run | 122/133 (92%) (fixes 2, breaks 4) | AI runs alone 124/133 (93%) |

## Why unsure (labeled photos)

- top and pants look the same: 36
- hips: 15
- shoulders: 7
- knees: 6
- chest not on body: 3
- torso/thigh lengths: 1
- pants never start in the window (a long top or a coat): 1
- torso hidden (arm, hand or bag): 1

## Where the pants start (s, torsos above the hip joints), by the labeled top end

| Label | n | 10% | median | 90% |
|---|---|---|---|---|
| at_waistband | 94 | -0.14 | 0.02 | 0.16 |
| at_waistband|mid_fly | 27 | -0.19 | -0.02 | 0.11 |
| tucked | 23 | 0.00 | 0.18 | 0.27 |
| ns | 17 | -0.29 | -0.04 | 0.08 |
| mid_fly | 14 | -0.16 | -0.09 | 0.18 |
| tucked|at_waistband | 7 | -0.10 | 0.08 | 0.23 |

## The visual split (upper share: shoulders → waistline over shoulders → ankles)

- waist_shows: n 75, median 0.38, 10–90% 0.30–0.45
- covered: n 29, median 0.47, 10–90% 0.41–0.59

## Every labeled photo

| Photo | Set | Label (top end · waistband) | Truth | Ruler | pants s | top s | AI runs | Why |
|---|---|---|---|---|---|---|---|---|
| ig-001 | dev | at_waistband · yes | waist_shows | waist_shows ✓ | 0.14 | 0.14 | w/w |  |
| ig-003 | dev | at_waistband · yes | waist_shows | waist_shows ✓ | 0.1 | 0.1 | w/w |  |
| ig-007 | dev | at_waistband|mid_fly · no | covered | unsure |  |  | c/w | top and pants look the same |
| ig-009 | dev | tucked|at_waistband · yes | waist_shows | unsure |  |  | w/w | hips |
| ig-013 | dev | at_waistband · yes | waist_shows | waist_shows ✓ | 0.22 | 0.22 | w/w |  |
| ig-015 | dev | at_waistband · partly | waist_shows | unsure |  |  | w/w | top and pants look the same |
| ig-019 | dev | tucked|at_waistband · yes | waist_shows | waist_shows ✓ | 0.12 | 0.21 | w/w |  |
| ig-025 | dev | tucked · yes | waist_shows | waist_shows ✓ | 0.21 | 0.22 | w/w |  |
| ig-027 | dev | at_waistband|mid_fly · no | covered | covered ✓ | -0.07 | -0.07 | c/c |  |
| ig-029 | dev | mid_fly · no | covered | covered ✓ | -0.16 | 0.1 | w/w |  |
| ig-031 | dev | at_waistband · yes | waist_shows | waist_shows ✓ | 0.08 | 0.08 | w/w |  |
| ig-033 | dev | at_waistband · yes | waist_shows | waist_shows ✓ | 0.07 | 0.07 | w/w |  |
| ig-035 | dev | tucked|at_waistband · yes | waist_shows | waist_shows ✓ | 0.23 | 0.23 | w/w |  |
| ig-037 | dev | at_waistband · partly | waist_shows | unsure |  |  | w/w | chest not on body |
| ig-039 | dev | tucked|at_waistband · yes | waist_shows | waist_shows ✓ | -0.02 | -0.02 | w/w |  |
| ig-045 | dev | at_waistband|tucked · yes | waist_shows | waist_shows ✓ | 0.08 | 0.08 | w/w |  |
| ig-067 | dev | at_waistband · yes | waist_shows | waist_shows ✓ | 0.02 | 0.02 | w/w |  |
| ig-069 | dev | at_waistband|mid_fly · no | covered | unsure |  |  | c/c | knees |
| ig-071 | dev | at_waistband · partly | waist_shows | waist_shows ✓ | 0.09 | 0.09 | w/w |  |
| ig-079 | dev | at_waistband · yes | waist_shows | unsure |  |  | w/w | hips |
| ig-081 | dev | at_waistband · partly | waist_shows | waist_shows ✓ | 0.45 | 0.45 | w/w |  |
| ig-083 | dev | at_waistband · yes | waist_shows | unsure |  |  | w/w | knees |
| ig-085 | dev | at_waistband|cropped · yes | waist_shows | unsure |  |  | w/w | knees |
| ig-089 | dev | at_waistband · partly | waist_shows | waist_shows ✓ | 0.01 | 0.01 | w/w |  |
| ig-091 | dev | at_waistband|mid_fly · no | covered | unsure |  |  | w/w | top and pants look the same |
| ig-093 | dev | tucked|at_waistband · yes | waist_shows | waist_shows ✓ | 0.05 | 0.05 | w/w |  |
| ig-097 | dev | at_waistband · partly | waist_shows | waist_shows ✓ | 0.02 | 0.02 | w/w |  |
| ig-099 | dev | tucked|at_waistband · yes | waist_shows | waist_shows ✓ | 0.08 | 0.08 | w/w |  |
| ig-109 | dev | tucked · yes | waist_shows | waist_shows ✓ | 0.21 | 0.21 | w/w |  |
| ig-111 | dev | tucked · yes | waist_shows | unsure |  |  | w/w | top and pants look the same |
| ig-117 | dev | tucked · yes | waist_shows | waist_shows ✓ | 0.15 | 0.15 | w/w |  |
| ig-119 | dev | at_waistband · yes | waist_shows | waist_shows ✓ | 0.16 | 0.16 | w/w |  |
| ig-121 | dev | at_waistband · yes | waist_shows | waist_shows ✓ | 0.17 | 0.17 | w/w |  |
| ig-123 | dev | tucked · yes | waist_shows | unsure |  |  | w/w | top and pants look the same |
| ig-125 | dev | at_waistband · partly | waist_shows | waist_shows ✓ | 0.26 | 0.26 | w/w |  |
| mirror-m02 | dev | tucked · yes | waist_shows | waist_shows ✓ | 0.27 | 0.27 | w/w/w |  |
| mirror-m05 | dev | tucked · yes | waist_shows | waist_shows ✓ | 0.17 | 0.17 | w/w/w |  |
| mirror-m06 | dev | at_waistband · partly | waist_shows | unsure |  |  | w/w/c | shoulders |
| mirror-m08 | dev | tucked · yes | waist_shows | unsure |  |  | w/w/w | hips |
| mirror-m09 | dev | tucked · partly | waist_shows | unsure |  |  | w/w/w | top and pants look the same |
| mirror-m10 | dev | tucked · yes | waist_shows | waist_shows ✓ | -0.01 | -0.01 | w/w/w |  |
| mirror-m11 | dev | tucked · ns | waist_shows | unsure |  |  | w/w/w | top and pants look the same |
| mirror-m12 | dev | at_waistband|tucked · yes | waist_shows | unsure |  |  | w/w/w | top and pants look the same |
| pin-001 | dev | at_waistband · no | covered | unsure |  |  | w/w | top and pants look the same |
| pin-005 | dev | tucked|at_waistband · partly | waist_shows | covered ✗ | -0.1 | -0.1 | w/w |  |
| pin-007 | dev | tucked · yes | waist_shows | waist_shows ✓ | 0.18 | 0.18 | w/w |  |
| pin-009 | dev | tucked · yes | waist_shows | waist_shows ✓ | 0.17 | 0.17 | w/w |  |
| pin-011 | dev | at_waistband · no | covered | unsure |  |  | c/c | top and pants look the same |
| pin-013 | dev | at_waistband · yes | waist_shows | waist_shows ✓ | -0.08 | 0 | w/c |  |
| pin-015 | dev | at_waistband · yes | waist_shows | covered ✗ | -0.2 | -0.2 | w/w |  |
| pin-019 | dev | tucked · yes | waist_shows | waist_shows ✓ | 0.28 | 0.28 | w/w |  |
| pin-031 | dev | mid_fly · no | covered | covered ✓ | -0.21 | -0.21 | c/c |  |
| pin-033 | dev | mid_fly · no | covered | covered ✓ | -0.09 | -0.09 | c/c |  |
| pin-037 | dev | mid_fly|at_waistband · no | covered | unsure |  |  | c/w | top and pants look the same |
| pin-047 | dev | tucked · yes | waist_shows | waist_shows ✓ | 0.19 | 0.19 | w/w |  |
| pin-049 | dev | at_waistband · partly | waist_shows | waist_shows ✓ | 0 | 0 | w/c |  |
| pin-053 | dev | at_waistband|mid_fly · no | covered | waist_shows ✗ | 0.02 | 0.02 | c/c |  |
| pin-055 | dev | at_waistband · no | covered | unsure |  |  | c/c | top and pants look the same |
| pin-057 | dev | at_waistband · no | covered | waist_shows ✗ | 0 | 0.28 | w/w |  |
| pin-061 | dev | tucked · yes | waist_shows | waist_shows ✓ | 0 | 0 | w/w |  |
| pin-065 | dev | at_waistband · partly | waist_shows | covered ✗ | -0.14 | -0.14 | c/c |  |
| pin-067 | dev | at_waistband · no | covered | unsure |  |  | c/c | hips |
| pin-071 | dev | at_waistband|mid_fly · no | covered | covered ✓ | -0.11 | -0.11 | c/c |  |
| pin-073 | dev | at_waistband · no | covered | covered ✓ | -0.35 | -0.35 | c/c |  |
| rd-003 | dev | tucked · yes | waist_shows | waist_shows ✓ | 0.25 | 0.25 | w/w |  |
| rd-007 | dev | tucked · yes | waist_shows | unsure |  |  | w/w | top and pants look the same |
| rd-009 | dev | tucked · yes | waist_shows | unsure |  |  | w/w | top and pants look the same |
| rd-013 | dev | tucked · yes | waist_shows | unsure |  |  | w/w | top and pants look the same |
| rd-015 | dev | at_waistband · no | covered | waist_shows ✗ | 0.2 | 0.22 | c/c |  |
| rd-017 | dev | tucked · yes | waist_shows | waist_shows ✓ | 0.19 | 0.45 | w/w |  |
| rd-019 | dev | at_waistband · partly | waist_shows | waist_shows ✓ | -0.01 | -0.01 | c/c |  |
| rd-021 | dev | tucked · partly | waist_shows | unsure |  |  | w/w | hips |
| stock-p01-before_studio | dev | at_waistband · yes | waist_shows | waist_shows ✓ | 0.02 | 0.02 | w/w/w |  |
| stock-p03-before_street | dev | tucked · yes | waist_shows | unsure |  |  | w/w/w | top and pants look the same |
| stock-p04-after_street | dev | tucked · yes | waist_shows | unsure |  |  | w/w/w | hips |
| stock-p06-before_studio | dev | at_waistband · yes | waist_shows | unsure |  |  | w/w/w | knees |
| stock-s01-before_studio | dev | tucked · yes | waist_shows | waist_shows ✓ | 0.19 | 0.19 | w/w/w |  |
| stock-s03-before_studio | dev | at_waistband · yes | waist_shows | unsure |  |  | w/w/w | top and pants look the same |
| stock-s05-before_studio | dev | at_waistband · no | covered | covered ✓ | -0.23 | -0.23 | c/c/c |  |
| stock-s06-before_studio | dev | at_waistband · no | covered | covered ✓ | -0.11 | -0.11 | c/c/c |  |
| stock-s07-before_studio | dev | at_waistband · yes | waist_shows | unsure |  |  | w/w/w | top and pants look the same |
| stock-s08-before_studio | dev | at_waistband · partly | waist_shows | waist_shows ✓ | 0.16 | 0.16 |  |  |
| stock-s09-before_street | dev | tucked · yes | waist_shows | covered ✗ | -0.1 | -0.1 | w/w/w |  |
| stock-s11-before_street | dev | at_waistband · no | covered | covered ✓ | -0.08 | -0.08 | c/c/c |  |
| stock-s12-before_street | dev | at_waistband · no | covered | covered ✓ | -0.19 | -0.19 | w/w/w |  |
| stock-s13-before_street | dev | mid_fly · no | covered | unsure |  |  | c/c/c | top and pants look the same |
| stock-s22-before_phone | dev | at_waistband · no | covered | waist_shows ✗ | -0.02 | -0.02 | c/c/w |  |
| stock-s23-before_mirror | dev | at_waistband|mid_fly · no | covered | covered ✓ | -0.03 | -0.03 | c/c/c |  |
| stock-s25-before_mirror | dev | mid_fly · no | covered | unsure |  |  | c/c/c | hips |
| stock-s28-before_mirror | dev | mid_fly · no | covered | waist_shows ✗ | -0.01 | -0.01 | c/c/c |  |
| ig-002 | test | at_waistband · yes | waist_shows | unsure |  |  | w/w | top and pants look the same |
| ig-012 | test | at_waistband · yes | waist_shows | waist_shows ✓ | 0.14 | 0.14 | w/w |  |
| ig-014 | test | at_waistband · partly | waist_shows | covered ✗ | -0.13 | -0.13 | w/w |  |
| ig-016 | test | at_waistband · partly | waist_shows | waist_shows ✓ | 0.03 | 0.05 | c/w |  |
| ig-018 | test | at_waistband · partly | waist_shows | unsure |  |  | w/c | chest not on body |
| ig-024 | test | mid_fly · no | covered | unsure |  |  | w/w | top and pants look the same |
| ig-028 | test | at_waistband · partly | waist_shows | waist_shows ✓ | 0.02 | 0.02 | w/w |  |
| ig-032 | test | at_waistband · yes | waist_shows | waist_shows ✓ | 0.16 | 0.16 | w/w |  |
| ig-034 | test | at_waistband · yes | waist_shows | waist_shows ✓ | 0.16 | 0.16 | w/w |  |
| ig-036 | test | at_waistband · partly | waist_shows | unsure |  |  | c/c | hips |
| ig-038 | test | at_waistband · yes | waist_shows | waist_shows ✓ | 0.22 | 0.22 |  |  |
| ig-040 | test | at_waistband|tucked · yes | waist_shows | unsure |  |  | w/w | shoulders |
| ig-044 | test | at_waistband|mid_fly · no | covered | waist_shows ✗ | 0.03 | 0.03 | c/c |  |
| ig-046 | test | at_waistband · no | covered | unsure |  |  | w/w | top and pants look the same |
| ig-048 | test | at_waistband · yes | waist_shows | unsure |  |  | w/w | knees |
| ig-050 | test | at_waistband · partly | waist_shows | waist_shows ✓ | 0.02 | 0.02 | w/w |  |
| ig-052 | test | at_waistband|mid_fly · no | covered | waist_shows ✗ | 0.12 | 0.12 | w/w |  |
| ig-058 | test | at_waistband · partly | waist_shows | waist_shows ✓ | 0.15 | 0.15 | w/w |  |
| ig-060 | test | at_waistband · yes | waist_shows | unsure |  |  | w/w | torso/thigh lengths |
| ig-062 | test | at_waistband · yes | waist_shows | unsure |  | 0.07 | w/w | pants never start in the window (a long top or a coat) |
| ig-064 | test | cropped · yes | waist_shows | unsure |  |  | w/w | top and pants look the same |
| ig-070 | test | at_waistband · yes | waist_shows | waist_shows ✓ | 0.09 | 0.09 | w/w |  |
| ig-072 | test | at_waistband · yes | waist_shows | unsure |  |  | w/w | top and pants look the same |
| ig-074 | test | at_waistband · yes | waist_shows | waist_shows ✓ | 0.21 | 0.21 | w/w |  |
| ig-078 | test | at_waistband · partly | waist_shows | waist_shows ✓ | 0.09 | 0.09 | w/w |  |
| ig-082 | test | at_waistband · yes | waist_shows | unsure |  |  | w/w | hips |
| ig-084 | test | at_waistband · yes | waist_shows | waist_shows ✓ | 0.04 | 0.05 | w/w |  |
| ig-086 | test | at_waistband · yes | waist_shows | unsure |  |  | w/w | chest not on body |
| ig-092 | test | at_waistband|tucked · yes | waist_shows | waist_shows ✓ | 0.18 | 0.18 | w/w |  |
| ig-094 | test | tucked|at_waistband · yes | waist_shows | waist_shows ✓ | 0.08 | 0.08 | w/w |  |
| ig-096 | test | tucked · yes | waist_shows | waist_shows ✓ | 0.18 | 0.18 | w/w |  |
| ig-098 | test | mid_fly · no | covered | unsure |  |  | c/c | shoulders |
| ig-104 | test | tucked|at_waistband · yes | waist_shows | unsure |  |  | w/w | knees |
| ig-106 | test | mid_fly · no | covered | covered ✓ | -0.03 | -0.03 | c/c |  |
| ig-108 | test | at_waistband · yes | waist_shows | waist_shows ✓ | 0.21 | 0.26 | w/w |  |
| ig-110 | test | tucked · yes | waist_shows | unsure |  |  | w/w | top and pants look the same |
| ig-118 | test | at_waistband · partly | waist_shows | unsure |  |  | w/w | top and pants look the same |
| ig-124 | test | at_waistband · partly | waist_shows | waist_shows ✓ | 0.14 | 0.16 | w/w |  |
| ig-132 | test | mid_fly · no | covered | unsure |  |  | c/c | top and pants look the same |
| oct7-ph1 | test | at_waistband · partly | waist_shows | unsure |  |  | c/c/c | shoulders |
| oct7-ph2 | test | tucked · yes | waist_shows | unsure |  |  | w/w/w | shoulders |
| oct7-ph3 | test | tucked · partly | waist_shows | unsure |  |  | w/w/w | shoulders |
| oct7-ph4 | test | at_waistband · partly | waist_shows | unsure |  |  | c/w/w | shoulders |
| phone-0a864e | test | mid_fly · no | covered | unsure |  |  | c | top and pants look the same |
| phone-0d39d6 | test | at_waistband · yes | waist_shows | waist_shows ✓ | 0.04 | 0.04 | w/w/w |  |
| phone-1f1997 | test | at_waistband|mid_fly · no | covered | unsure |  |  | c | top and pants look the same |
| phone-3239a6 | test | mid_fly|below_crotch · no | covered | covered ✓ | -0.17 | -0.17 | c |  |
| phone-403ade | test | at_waistband|mid_fly · no | covered | unsure |  |  | c | top and pants look the same |
| phone-4c21bb | test | tucked · yes | waist_shows | waist_shows ✓ | 0.06 | 0.06 | w |  |
| phone-5a9049 | test | mid_fly · no | covered | covered ✓ | -0.1 | -0.1 | c/c/c |  |
| phone-6f1aee | test | at_waistband · yes | waist_shows | waist_shows ✓ | 0 | 0 | w |  |
| phone-703a8b | test | tucked · yes | waist_shows | unsure |  |  | w | hips |
| phone-7f14a4 | test | mid_fly · no | covered | covered ✓ | -0.1 | -0.1 |  |  |
| phone-7f3c60 | test | at_waistband · yes | waist_shows | waist_shows ✓ | 0.14 | 0.14 | w |  |
| phone-8bc29d | test | at_waistband · partly | waist_shows | waist_shows ✓ | 0.08 | 0.09 | c/w/c |  |
| phone-968016 | test | at_waistband|mid_fly · no | covered | waist_shows ✗ | -0.02 | -0.02 | c |  |
| phone-9a2e71 | test | at_waistband · yes | waist_shows | unsure |  |  | w | top and pants look the same |
| phone-af7e93 | test | at_waistband|mid_fly · no | covered | covered ✓ | -0.27 | 0 | c |  |
| phone-b0f0c8 | test | at_waistband · partly | waist_shows | covered ✗ | -0.03 | -0.03 | c/c/c |  |
| phone-d58b14 | test | at_waistband|mid_fly · no | covered | unsure |  |  | c | top and pants look the same |
| phone-d6559a | test | at_waistband · no | covered | waist_shows ✗ | -0.02 | -0.02 | w/w/w |  |
| phone-e16ac6 | test | at_waistband · yes | waist_shows | waist_shows ✓ | -0.01 | -0.01 | w |  |
| pin-002 | test | at_waistband · partly | waist_shows | covered ✗ | -0.03 | -0.03 | c/w |  |
| pin-004 | test | tucked · yes | waist_shows | unsure |  |  | w/w | torso hidden (arm, hand or bag) |
| pin-006 | test | cropped|at_waistband · partly | waist_shows | waist_shows ✓ | 0.18 | 0.18 | w/w |  |
| pin-008 | test | tucked · yes | waist_shows | waist_shows ✓ | 0.08 | 0.08 | w/w |  |
| pin-010 | test | tucked · yes | waist_shows | waist_shows ✓ | 0.1 | 0.1 | w/w |  |
| pin-012 | test | at_waistband · yes | waist_shows | waist_shows ✓ | 0.02 | 0.3 | c/c |  |
| pin-014 | test | at_waistband · partly | waist_shows | unsure |  |  | w/w | top and pants look the same |
| pin-016 | test | at_waistband · partly | waist_shows | covered ✗ | -0.15 | -0.15 | w/c |  |
| pin-018 | test | tucked · yes | waist_shows | waist_shows ✓ | 0.21 | 0.29 | w/w |  |
| pin-020 | test | at_waistband · partly | waist_shows | covered ✗ | -0.04 | 0.16 | c/c |  |
| pin-026 | test | at_waistband|mid_fly · no | covered | unsure |  |  | c/c | hips |
| pin-032 | test | at_waistband · partly | waist_shows | waist_shows ✓ | 0.01 | 0.01 | w/w |  |
| pin-036 | test | mid_fly · no | covered | unsure |  |  | c/c | top and pants look the same |
| pin-044 | test | tucked · yes | waist_shows | waist_shows ✓ | 0.1 | 0.1 | w/w |  |
| pin-052 | test | mid_fly · no | covered | waist_shows ✗ | 0.19 | 0.19 | c/c |  |
| pin-054 | test | at_waistband · no | covered | unsure |  |  | c/c | hips |
| pin-060 | test | tucked · ns | waist_shows | unsure |  |  | w/w | top and pants look the same |
| pin-066 | test | at_waistband · no | covered | covered ✓ | -0.04 | -0.04 | c/c |  |
| pin-070 | test | at_waistband|mid_fly · no | covered | covered ✓ | -0.24 | -0.24 | c/c |  |
| pin-072 | test | mid_fly · no | covered | covered ✓ | -0.1 | -0.1 | c/c |  |
| pin-074 | test | at_waistband|mid_fly · no | covered | covered ✓ | -0.19 | -0.19 | c/c |  |
| rd-002 | test | tucked · yes | waist_shows | unsure |  |  | w/w | hips |
| rd-004 | test | tucked · yes | waist_shows | unsure |  |  | w/w | top and pants look the same |
| rd-006 | test | tucked · yes | waist_shows | unsure |  |  | w/w | hips |
| rd-008 | test | tucked · yes | waist_shows | unsure |  |  | w/w | hips |
| rd-012 | test | tucked · yes | waist_shows | waist_shows ✓ | 0.14 | 0.14 | w/w |  |
| rd-014 | test | at_waistband|mid_fly · no | covered | covered ✓ | -0.18 | -0.18 | c/c |  |
| rd-016 | test | at_waistband|mid_fly · no | covered | waist_shows ✗ | -0.01 | -0.01 | w/c |  |
| rd-018 | test | mid_fly · no | covered | covered ✓ | -0.14 | -0.14 | c/c |  |
| rd-020 | test | tucked · yes | waist_shows | waist_shows ✓ | 0.27 | 0.27 | w/w |  |

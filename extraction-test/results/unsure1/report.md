# A second look when the AI is unsure (unsure1)

*Script `extraction-test/unsure_look.py`; labels `unsure_labels.csv` (two blind labellers, agreed values only); raw `results/unsure1/raw.json`. Gold photos: public screenshots, profile unknown; test profile minimal + smart casual, Everyday.*

**Spend:** 26.6 of the 30-cent cap: 171 calls (0 failed), 0.155 cents a call, median 3.3 s, 90th percentile 6.2 s.

## Set S: shoe type, 31 photos

| Check | Result | Passes |
|---|---|---|
| U1 steady on 3 runs ≥ 90%, and runs 0–1 agree ≥ 10 pts more often than the main read's | 55% on 3 (runs 0–1: narrow 65%, main 39%) | no |
| U2 score-right ≥ 85% and ≥ 10 pts above the main read | narrow 82% (37/45), main 76% (26/34) | no |
| U3 can't see ≤ 30% | 13% (12/93) | yes |
| exact value right (reported, no bar) | narrow 31/45 (69%), main 17/34 (50%) | - |

- ig-014: truth white_leather_sneaker; main white_leather_sneaker / white_leather_sneaker; narrow white_leather_sneaker / white_leather_sneaker / white_leather_sneaker
- ig-024: truth soft (loafer/unsure); main loafer / loafer; narrow loafer / loafer / loafer
- ig-028: truth soft (unsure/unsure); main dress_shoe / loafer; narrow derby / loafer / derby
- ig-029: truth derby; main derby / dress_shoe; narrow derby / derby / derby
- ig-032: truth other; main retro_runner / retro_runner; narrow other / other / other
- ig-040: truth soft (loafer/other); main loafer / loafer; narrow loafer / loafer / loafer
- ig-054: truth soft (unsure/unsure); main low_profile_sneaker / loafer; narrow other / low_profile_sneaker / low_profile_sneaker
- ig-056: truth derby; main derby / derby; narrow derby / work_boot / derby
- ig-061: truth soft (work_boot/unsure); main derby / work_boot; narrow chelsea_boot / work_boot / chelsea_boot
- ig-062: truth soft (unsure/unsure); main dress_shoe / loafer; narrow loafer / loafer / loafer
- ig-063: truth work_boot; main work_boot / chunky_sneaker; narrow chunky_sneaker / work_boot / work_boot
- ig-071: truth soft (unsure/unsure); main dress_shoe / derby; narrow other / loafer / other
- ig-072: truth basketball_sneaker; main retro_runner / retro_runner; narrow basketball_sneaker / basketball_sneaker / basketball_sneaker
- ig-077: truth soft (unsure/unsure); main work_boot / derby; narrow loafer / loafer / derby
- ig-082: truth soft (unsure/unsure); main canvas_sneaker / canvas_sneaker; narrow canvas_sneaker / canvas_sneaker / canvas_sneaker
- ig-085: truth soft (basketball_sneaker/unsure); main basketball_sneaker / chunky_sneaker; narrow basketball_sneaker / basketball_sneaker / basketball_sneaker
- ig-099: truth performance_runner; main low_profile_sneaker / retro_runner; narrow low_profile_sneaker / retro_runner / low_profile_sneaker
- ig-108: truth soft (unsure/unsure); main dress_shoe / derby; narrow loafer / loafer / loafer
- ig-119: truth derby; main derby / dress_shoe; narrow derby / loafer / loafer
- ig-125: truth soft (unsure/unsure); main dress_shoe / chelsea_boot; narrow other / other / chelsea_boot
- pin-006: truth low_profile_sneaker; main retro_runner / low_profile_sneaker; narrow low_profile_sneaker / low_profile_sneaker / retro_runner
- pin-008: truth canvas_sneaker; main canvas_sneaker / canvas_sneaker; narrow canvas_sneaker / canvas_sneaker / canvas_sneaker
- pin-011: truth retro_runner; main retro_runner / retro_runner; narrow retro_runner / retro_runner / retro_runner
- pin-025: truth work_boot; main work_boot / dress_shoe; narrow work_boot / work_boot / work_boot
- pin-034: truth soft (unsure/derby); main dress_shoe / low_profile_sneaker; narrow derby / derby / derby
- pin-051: truth suede_chukka; main suede_chukka / derby; narrow derby / derby / derby
- pin-063: truth soft (unsure/unsure); main dress_shoe / derby; narrow loafer / loafer / other
- pin-069: truth other; main work_boot / work_boot; narrow other / other / other
- pin-071: truth performance_runner; main basketball_sneaker / basketball_sneaker; narrow basketball_sneaker / basketball_sneaker / basketball_sneaker
- rd-011: truth derby; main dress_shoe / derby; narrow derby / derby / derby
- rd-020: truth work_boot; main work_boot / work_boot; narrow work_boot / work_boot / work_boot

## Set G: leg shape, 30 photos

| Check | Result | Passes |
|---|---|---|
| U4 steady on 3 runs ≥ 90%, and runs 0–1 agree ≥ 10 pts more often than the main read's | 73% on 3 (runs 0–1: narrow 77%, main 33%) | no |
| U5 score-right ≥ 85% and ≥ 10 pts above the main read | narrow 97% (58/60), main 80% (32/40) | yes |
| U6 can't see ≤ 30% | 3% (3/90) | yes |
| exact value right (reported, no bar) | narrow 46/60 (77%), main 20/40 (50%) | - |

- ig-010: truth soft (wide/relaxed); main relaxed / relaxed; narrow relaxed / relaxed / relaxed
- ig-019: truth soft (relaxed/wide); main relaxed / wide; narrow relaxed / wide / wide
- ig-027: truth relaxed; main straight / relaxed; narrow straight / straight / straight
- ig-051: truth soft (relaxed/wide); main relaxed / straight; narrow wide / wide / wide
- ig-099: truth flare_bootcut; main flare_bootcut / straight; narrow flare_bootcut / straight / straight
- ig-100: truth relaxed; main wide / relaxed; narrow relaxed / relaxed / relaxed
- ig-109: truth relaxed; main wide / straight; narrow wide / relaxed / relaxed
- ig-119: truth soft (relaxed/wide); main straight / relaxed; narrow straight / straight / straight
- ig-124: truth straight; main straight / straight; narrow straight / straight / straight
- ig-129: truth soft (straight/relaxed); main relaxed / straight; narrow straight / relaxed / relaxed
- ig-130: truth flare_bootcut; main flare_bootcut / straight; narrow flare_bootcut / flare_bootcut / flare_bootcut
- pin-007: truth soft (relaxed/straight); main straight / relaxed; narrow relaxed / relaxed / relaxed
- pin-028: truth relaxed; main straight / relaxed; narrow relaxed / relaxed / relaxed
- pin-032: truth straight; main slim / straight; narrow slim / slim / slim
- pin-033: truth relaxed; main straight / flare_bootcut; narrow relaxed / relaxed / relaxed
- pin-040: truth wide; main relaxed / straight; narrow straight / straight / relaxed
- pin-048: truth straight; main straight / straight; narrow straight / straight / straight
- pin-049: truth straight; main straight / straight; narrow straight / straight / straight
- pin-051: truth slim; main slim / straight; narrow slim / slim / slim
- pin-053: truth straight; main relaxed / straight; narrow relaxed / straight / relaxed
- pin-057: truth soft (relaxed/wide); main straight / relaxed; narrow straight / relaxed / relaxed
- pin-060: truth relaxed; main straight / straight; narrow relaxed / relaxed / relaxed
- pin-061: truth soft (flare_bootcut/straight); main straight / straight; narrow straight / straight / straight
- pin-067: truth soft (cant_see/unsure); main straight / straight; narrow cant_see / cant_see / cant_see
- pin-071: truth soft (skinny/slim); main slim / skinny; narrow skinny / skinny / skinny
- pin-073: truth skinny; main skinny / skinny; narrow skinny / skinny / skinny
- rd-003: truth relaxed; main relaxed / straight; narrow relaxed / relaxed / relaxed
- rd-006: truth straight; main straight / straight; narrow straight / straight / straight
- rd-012: truth slim; main straight / straight; narrow slim / slim / slim
- rd-016: truth relaxed; main straight / relaxed; narrow relaxed / relaxed / relaxed

## The shipped answer, for harm

| Check | Result | Passes |
|---|---|---|
| U9 the shipped covers_shoe (rests on the shoe) ≥ 90% steady, ≥ 85% right | steady 52/57 (91%), right 151/162 (93%) | yes |

## Settled: the narrow answer replaces the main read's

**when triggered**
- U7 runs give the same score: 174/223 (78%) → 178/223 (80%); 1.0+ apart 5 → 7 → FAIL
- U8 held-out panel r: 0.490 → 0.473; the founder's 20 within 0.5: 13 → 13 → pass
- Run-0 scores that change: 10: ig-028 7 → 7.5; ig-063 7.5 → 7; ig-077 8 → 7.5; ig-129 8 → 7.5; pin-007 7 → 7.5; pin-060 7 → 7.5; pin-063 6.5 → 7; pin-071 6 → 5.5; rd-012 7.5 → 7; rd-016 7.5 → 8

**always (on the tested photos)**
- U7 runs give the same score: 174/223 (78%) → 178/223 (80%); 1.0+ apart 5 → 7 → FAIL
- U8 held-out panel r: 0.490 → 0.467; the founder's 20 within 0.5: 13 → 13 → FAIL
- Run-0 scores that change: 13: ig-028 7 → 7.5; ig-063 7.5 → 7; ig-077 8 → 7.5; ig-129 8 → 7.5; pin-007 7 → 7.5; pin-011 6.5 → 7; pin-032 7 → 6.5; pin-060 7 → 7.5; pin-063 6.5 → 7; pin-071 6 → 5.5; rd-011 7.5 → 8; rd-012 7.5 → 7; rd-016 7.5 → 8

## Paper: the gold set's two runs (engine v13, free)

- 225 photos with two runs; score difference between runs: 0: 174, 0.5: 44, 1: 4, 1.5: 1
- shoe flips: 26 (12%); 12 move the score by themselves
- leg flips: 37 (16%); 9 move the score by themselves

### Triggers, per reading (runs 0 and 1 of every photo)

| Trigger | Fires on readings | Catches score-moving shoe flips | Catches score-moving leg flips | Fires on steady photos |
|---|---|---|---|---|
| S0 shoe flagged | 161/450 (36%) | 12/12 (100%) | 5/9 (56%) | 73/199 (37%) |
| S1 shoe flagged + a look-alike moves the score | 98/450 (22%) | 12/12 (100%) | 5/9 (56%) | 45/199 (23%) |
| S2 a look-alike moves the score (flag ignored) | 250/450 (56%) | 12/12 (100%) | 8/9 (89%) | 117/199 (59%) |
| G1 a neighbouring leg moves the score | 139/450 (31%) | 2/12 (17%) | 9/9 (100%) | 57/188 (30%) |

- Set S: 31 photos (19 shoe flips + 12 steady controls); set G: 30 photos (20 leg flips + 10 controls); 57 photos in all
- Calls for 3 runs each: 171, about 27.4 cents (est. 0.16 cents a call); hard stop 30 cents

### The ceiling (free)

- A perfectly steady look (both runs get the same shoe and leg wherever U-T1 or U-T2 fires, all 225 photos): runs give the same score 174/223 (78%) → 185/223 (83%); 1.0+ apart 5 → 5; held-out panel r 0.490 → 0.490; the founder's 20 within 0.5 13 → 13
- The labelled truth swapped in wherever the trigger fires on that reading (labelled photos only):
  runs give the same score 174/223 (78%) → 176/223 (79%); 1.0+ apart 5 → 6; held-out panel r (91 photos) 0.490 → 0.493; the founder's 20 within 0.5 13 → 13
- The two blind labellers agree on the shoe type on 39/57 photos and the leg on 42/57: the truth is soft exactly where the main read wobbles
- Main read on set S (shoe), against the agreed labels: exact 17/34 (50%), score-right 26/34 (76%); 14 of 31 photos have no agreed label (soft)
- Main read on set G (leg), against the agreed labels: exact 20/40 (50%), score-right 32/40 (80%); 10 of 30 photos have no agreed label (soft)

### The founder's saved checks (39 scored, deduped; their own occasion, no picks)

- S0 shoe flagged: fires on 11/39 (28%) (phone-680a61, phone-b0f0c8, phone-5a9049, phone-d918c0, phone-8bc29d, phone-d6559a, phone-f07193, phone-e026de, phone-d1967f, phone-af7e93, phone-b17b22)
- S1 shoe flagged + a look-alike moves the score: fires on 4/39 (10%) (phone-5a9049, phone-d918c0, phone-d1967f, phone-af7e93)
- S2 a look-alike moves the score (flag ignored): fires on 16/39 (41%) (phone-cccd69, phone-5a9049, phone-d918c0, phone-968016, phone-fb0b17, phone-f4870b, phone-403ade, phone-8ad378, phone-d1967f, phone-e438d4, phone-ebe23f, phone-af7e93…)
- G1 a neighbouring leg moves the score: fires on 19/39 (49%) (phone-a1d1e5, phone-5e2307, phone-b0f0c8, phone-6b14db, phone-d6559a, phone-d58b14, phone-fb0b17, phone-f4870b, phone-703a8b, phone-e438d4, phone-ebe23f, phone-9d3ef4…)

Where U-T1 or U-T2 fires, the score each look-alike would give (what the second look could change):

- phone-0a864e (class, 6): leg read slim: skinny 5.5
- phone-1f1b29 (class, 6.5): leg read straight: slim 6
- phone-4c21bb (class, 7.5): leg read straight: slim 7, relaxed 8
- phone-5a9049 (everyday, 7): shoe read low_profile_sneaker (likely): performance_runner 6
- phone-5e2307 (everyday, 7): leg read straight: slim 6.5
- phone-602c13 (class, 6.5): leg read slim: skinny 6
- phone-6b14db (everyday, 5.5): leg read slim: skinny 5
- phone-703a8b (class, 7.5): leg read straight: slim 6.5
- phone-729b22 (class, 7): leg read straight: slim 6.5, relaxed 7.5
- phone-7f3c60 (class, 6.5): leg read straight: relaxed 7.5
- phone-9a2e71 (class, 7): leg read straight: slim 6.5, relaxed 7.5
- phone-9d3ef4 (class, 6.5): leg read slim: skinny 6
- phone-a1d1e5 (everyday, 7): leg read slim: straight 7.5
- phone-af7e93 (class, 8): shoe read basketball_sneaker (likely): canvas_sneaker 7.5, retro_runner 7.5, performance_runner 7
- phone-b0f0c8 (everyday, 7.5): leg read relaxed: straight 7
- phone-d1967f (class, 7): shoe read suede_chukka (likely): dress_shoe 6.5
- phone-d58b14 (class, 6.5): leg read straight: slim 6, relaxed 7
- phone-d6559a (class, 7): leg read straight: slim 6.5
- phone-d918c0 (class, 7.5): shoe read suede_chukka (likely): loafer 7, dress_shoe 7, derby 7, chelsea_boot 7
- phone-e438d4 (class, 7): leg read straight: slim 6.5
- phone-ebe23f (class, 7): leg read straight: slim 6.5
- phone-f4870b (class, 7): leg read straight: slim 6.5
- phone-fb0b17 (class, 7): leg read straight: slim 6.5


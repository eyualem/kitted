# A second look when the AI is unsure (unsure1)

*Script `extraction-test/unsure_look.py`; labels `unsure_labels.csv` (two blind labellers, agreed values only); raw `results/unsure1/raw.json`. Gold photos: public screenshots, profile unknown; test profile minimal + smart casual, Everyday.*

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


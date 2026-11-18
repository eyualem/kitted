# T69 · The top of the scale on paper ($0)

*Nov 17, 2026. Stored readings only, no AI calls, $0. Why: the founder (#491) said "the max should be around 9.5 and not capped at 9". Script: `extraction-test/top_of_scale.py`. Results: `extraction-test/results/top-of-scale/report.txt` and `table.json`. v16 as approved (#484) is unchanged. Every option below is a what-if knob that is off by default.*

## In plain words

**Changing the curve alone gets no outfit to 9.5.** None of A, B or C does it, on real photos or made-up ones. The curve isn't the main thing holding the top. The stacking rule is ([SCO-2]): 9.5 needs **four lifts in one look with nothing off**, and nothing reaches that.
- None of the 676 stored scorings (gold, his checks, his rated photos, the creators' stills) gets there.
- None of **53,568 made-up outfits** built from strong pieces gets there either: tucked tees, bombers, cardigans, wide trousers, loafers, every combination.
- The most any of them collects is three. Some lifts exclude each other (one look top to toe vs one smart piece; the silhouette lift only fires alone), and the quarter-point ones (a color picked up) don't count toward stacking.
- So under v16 as approved, the highest score anything can show is 9.0.

**What holds his own 9s down.** He rated 16 photos 9 or more on his consistent key. v16 gives them 7.97 on average and shows none at 9.
- 6 of the 16 are held at 8 by "one lift".
- 6 more land at 8–8.5: the curve compresses them, or the two-lift ceiling holds them.
- 1 is held by a fit fault.
- 3 have little raw to start with, the suit (his 9.5) among them.

The raw score does pick out his strong outfits: photos at raw 9 or more average 8.4–8.5 with him. The curve and the stacking rule then pull them down to 8–8.5.

**What each option does:**
- **A (raise the raw cap to 10.6):** moves nothing. Every number is identical to v16. The only outfits with raw above 9.5 (17 scorings) are "a great shape and nothing else" outfits, and the one-lift ceiling holds them at 8.0.
- **B (a knee: slope 0.7 up to raw 8.5, then 1.45, so raw 9.5 shows 9.5):**
  - Costs nothing on any bar. Steadiness stays 218/223, held-out agreement stays 82.0%, and r rises from 0.631 to 0.640.
  - A real photo now shows 9: ig-034, a burgundy tee, cream barrel trousers and black loafers, which he rated 9.
  - But 9.5 still can't happen, because of the four-lift rule.
- **C (top slope 0.85):** steadiness holds, but more of the scale bunches at 8–8.5. Gold's 8–8.5 band goes from 34.5% to 39.0%, and the gold band gap widens from 19.5 to 24.0.
- **C' (top slope 1.0):** steadiness fails (217), and agreement with him drops (81.2%, key 79.9%). The pink graphic tee he gave a 5 rises to 7.5.
- **D (three lifts in one look with nothing off may reach 9.5), with the curve unchanged:** moves nothing. The curve still stops at 8.75.
- **B + D, recommended:**
  - Real photos score exactly as under B: every bar the same, steadiness 218/223, held out 82.0% (r 0.640) and 81.2% on his key (r 0.632).
  - 9.5 becomes reachable: 2,734 of the 53,568 made-up strong outfits (5.1%) show 9.5. Example: a white tee tucked under a burgundy bomber, wide charcoal trousers and white leather sneakers (a short layer, one accent, one smart piece, wide legs).
  - No stored photo shows 9.5 yet. None of them carries three full lifts in one look with nothing off and a raw score high enough.
- **Stronger versions, which move real photos to 9.5, cost steadiness:**
  - A steeper knee (slope 1.6) puts ig-034 at 9.5. But its second reading stays 8.5, a one-point wobble, so steadiness drops to 217 and fails the bar.
  - Raising every ceiling half a step for clean outfits (E) ranks his photos better (r 0.67, the closest any version has come to the 0.69 bar), but steadiness is 216. It fails.
  - Dropping the ceilings for clean outfits entirely (the bound) puts 12 photos at 9.5. Two are his own checks: a plain black tee, black wide jeans and white leather sneakers. One is a photo he gave 7. Steadiness falls to 214. Not this.

**Recommendation: B + D.** It is the only option that makes 9.5 possible at all and costs nothing on any bar.
- **The trade-off:** the top of the scale opens to 9.5, but real outfits will reach it rarely. Only an outfit with three real lifts in one look, nothing off, and a high raw score gets there.
- Today's stored photos top out at 9.0: one gold photo, ig-034, which he rated 9.
- If he wants his 9s to actually show 9–9.5 more often, the lever is the lifts and the stacking rule, not the curve:
  - E raises every ceiling half a step for clean outfits. It ranks him best, but costs 2 photos of steadiness.
  - Making "a great shape alone" count for more than one lift would also help.
- Both of those are rule changes for him to decide, not part of this pick.

**To switch it on:** set `curve_knee=(8.5, 1.45)` and `stack_clean={"3c": 9.5, "4c": 9.5}` in `TUNE["v16"]`, or score with `tune=V16_TOP_WHATIF["BD"]`. `raw_cap` stays 9.5. The rubric's [SCO-2] and [SCO-10] would need the matching words, and that is his call. Nothing is switched on.

## The table

Steadiness is gold photos within half a point across their two readings (223). Held out is the average over 8 fresh splits (seeds 1–8): the taste sizes are refit on half A for each version, exactly as `taste_rules.py` does, and tested on half B. Band gaps are the worst band's distance from its target share: gold is the first reading on a cool day (B5), and his checks use his profile and their own occasion. "Real 9+" counts gold (first reading, its own leg look), his checks, his rated photos read Nov 16, and the creators' stills.

| Version | Knobs | B6 own leg look (bar 218) | B6 none / U+L+leg | Held out, raw | Held out, key | Gap gold / checks (9–9.5 share on gold) | Real 9+ (at 9.5) | Made-up at 9.5 (of 53,568) | Named that change |
|---|---|---|---|---|---|---|---|---|---|
| **v16 as approved** | | **218** | 215 / 217 | 82.0%, r 0.631 | 81.1%, r 0.620 | 19.5 / 18.4 (0%) | 0 | 0 (9.0: 1,776) | |
| A: raw cap 10.6 | `raw_cap=10.6` | 218 | 215 / 217 | 82.0%, 0.631 | 81.1%, 0.620 | 19.5 / 18.4 (0%) | 0 | 0 | none |
| B: knee 8.5, slope 1.45 | `curve_knee=(8.5, 1.45)` | 218 | 215 / 216 | 82.0%, 0.640 | 81.2%, 0.632 | 19.1 / 18.4 (0.4%) | 1 (0) | 0 (9.0: 6,790) | cardigan 8→8.5; boxy tee 8.5→9 |
| B': knee 8.0, slope 1.2 | `curve_knee=(8.0, 1.2)` | 217 FAIL | 214 / 216 | 82.8%, 0.660 | 82.0%, 0.652 | 19.5 / 18.4 (0.9%) | 3 (0) | 0 | hoodie + overshirt 8→8.5; cardigan 8.5; boxy tee 9 |
| C: top slope 0.85 | `curve=(1.1, 0.85, 7.0)` | 218 | 214 / 216 | 82.0%, 0.633 | 81.2%, 0.629 | **24.0** / 16.8 (0.4%) | 1 (0) | 0 | hoodie + overshirt 8.5; cardigan 8.5 |
| C': top slope 1.0 | `curve=(1.1, 1.0, 7.0)` | 217 FAIL | 214 / 212 | 81.2%, 0.622 | 79.9%, 0.611 | **30.7** / 20.5 (1.3%) | 4 (0) | 0 | hoodie + overshirt 8.5; cardigan 8.5; pink tee 7→7.5 (his 5); boxy tee 9 |
| D: clean three lifts may reach 9.5 | `stack_clean={"3c": 9.5, "4c": 9.5}` | 218 | 215 / 217 | 82.0%, 0.631 | 81.1%, 0.620 | 19.5 / 18.4 (0%) | 0 | 0 | none |
| **B + D (recommended)** | both of the above | **218** | 215 / 215 | **82.0%, 0.640** | **81.2%, 0.632** | 19.1 / 18.4 (0.4%) | 1 (0) | **2,734** (9.0: 4,056) | cardigan 8→8.5; boxy tee 8.5→9 |
| Steeper knee + D | `curve_knee=(8.5, 1.6)` + D | 217 FAIL | 214 / 213 | 82.3%, 0.647 | 81.6%, 0.642 | 19.1 / 18.4 (0.4%) | 1 (**1**: ig-034, 9.5 / 8.5 across readings) | 2,850 | as B + D |
| B + T: clean in one look, two lifts 9.0, three 9.5 | `stack_clean={"2c": 9.0, "3c": 9.5, "4c": 9.5}` | 217 FAIL | 214 / 211 | 82.2%, 0.641 | 81.4%, 0.633 | 17.3 / 18.4 (2.2%) | 5 (0) | 2,734 | as B |
| B + E: clean, every ceiling half a step up | `V16_TOP_WHATIF["BE"]` | 216 FAIL | 213 / 213 | 81.7%, **0.672** | 80.9%, **0.666** | 17.3 / 18.4 (2.2%) | 5 (0) | 2,734 | as B |
| B + no ceiling when clean (a bound) | `stack_clean` all 9.5 | 214 FAIL | 211 / 207 | 81.7%, 0.673 | 80.8%, 0.669 | 15.0 / 18.4 (4.5%) | 18 (12) | 2,833 | as B |

Other knee and clean-step mixes are in `report.txt` (a knee at 9.0 with slope 2.0 plus D, B' + E, B + E2). None of them beats B + D at 218.

**Bars that don't move:** B2 6/6, B3 17/18 and B4 (every row but H7, a tip by his call) are the same under every version. The 8+ share by dressiness on gold is unchanged under B and B + D (casual 42%, in-between 24%, dressy 35%); the one 9 is a dressy photo (ig-034, loafers). With C' it climbs (casual 50%, dressy 54%).

**Band shares, recommended against approved:**

| | 3–4.5 | 5–5.5 | 6–6.5 | 7–7.5 | 8–8.5 | 9–9.5 |
|---|---|---|---|---|---|---|
| Target | 5% | 15% | 30% | 30% | 15% | 5% |
| Gold, v16 | 0.4 | 7.2 | 16.1 | 41.7 | 34.5 | 0 |
| Gold, B + D | 0.4 | 7.2 | 16.1 | 41.7 | 34.1 | 0.4 |
| His checks, v16 | 0 | 8.1 | 17.7 | 48.4 | 25.8 | 0 |
| His checks, B + D | 0 | 8.1 | 17.7 | 48.4 | 25.8 | 0 |

**The 15 named outfits** (v16 → B + D; the other 13 don't move):
- Gold: green cardigan over a white tee, relaxed black trousers, white sneakers (he rated 8): **8 → 8.5**.
- Made up: boxy white tee tucked into wide charcoal trousers, burgundy cardigan, black loafers: **8.5 → 9**.

**Which real photos reach 9 under B + D:**
- **ig-034** (he rated 9): burgundy tee, cream barrel trousers, black loafers. It shows 9.0 on its first reading and 8.5 on its second, which is steady.
- **ig-105** (he rated 8.5): blue hoodie, wide black trousers, dress shoes. It shows 9.0 when read with its second looks on his rated set.

No photo shows 9.5.

## The L7b reason line (text only)

The line now agrees with the piece: "the trousers **dress up** the casual pieces" for a bottom (all bottoms are named in the plural: trousers, chinos, jeans), and "the blazer **dresses up** the casual pieces" for anything else. On gold and his checks, 35 lines now read "the trousers dress up". The other 38 stay "dresses up" (dress shirt 31, blazer 5, overcoat 2).

**No number moved, checked three ways:**
- Every v1, v8, v14, v15 and v16 result was dumped before and after the change, on both gold readings, with and without the leg look, the warm day, his checks, the creators' stills and his rated photos. The dumps are identical (v1–v15 in full text, v16 by every number).
- `v16_paper.py` rewrites `results/v16/` byte for byte unchanged.
- `hoodie_layer_paper.py` and `graded_look_check.py` pass. `rules_conformance.py` is 500/501 before and after this change: the one miss is a doc check (rule IDs added with the applied v16 rubric diff that have no conformance case yet: LFT-1–3, 5–7, SCO-8–10, STY-13, TST-0). It predates this work.

## What changed in the code

- `extraction-test/rubrics/parts_proto.py`:
  - three knobs in `_OFF16`: `raw_cap=9.5`, `curve_knee=None`, `stack_clean=None`. These are the defaults, so v1–v15 and v16 score exactly as before.
  - `V16_TOP_WHATIF`, the what-if tunes: A, B, C, C1, BD, BE.
  - the L7b verb.
- `extraction-test/top_of_scale.py`: this study. It reproduces the approved v16 numbers exactly before measuring anything else: 218/215/217, 82.0%/0.631, 81.1%/0.620.

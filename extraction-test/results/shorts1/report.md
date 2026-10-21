# Shorts length and socks reading test (shorts1)

*Oct 17, 2026. Claude. Script `extraction-test/shorts_read.py`; labels `shorts1_labels.csv`; raw `results/shorts1/raw.json`. 24 gold-set photos with shorts (public screenshots, profile unknown); no gym-shorts truth beyond one photo.*

**Spend:** 51.9 cents of the 75-cent cap (arm B: 72 calls, 44.1 cents, arm C: 72 calls, 7.7 cents).

## Arm C (the narrow look)

| Question | Steady on 3 runs | Same exact answer on 3 | Right (grouping) | Right (exact) | Can't see | Passes |
|---|---|---|---|---|---|---|
| Length: above the knee vs at or below | 22/24 (92%) | 23/24 (96%) | 68/69 (99%) | 47/69 (68%) | 3/72 (4%) | yes |
| Socks: crew or tall vs low or none | 23/24 (96%) | 24/24 (100%) | 66/69 (96%) | 66/69 (96%) | 3/72 (4%) | yes |

Per photo (label → runs):

- ig-005: length at_knee → below_knee / below_knee / below_knee; socks crew → crew / crew / crew
- ig-020: length at_knee → below_knee / below_knee / below_knee; socks crew → crew / crew / crew
- ig-021: length at_knee → above_knee / at_knee / at_knee; socks crew → crew / crew / crew
- ig-022: length above_knee → above_knee / above_knee / above_knee; socks crew → crew / crew / crew
- ig-023: length at_knee → below_knee / below_knee / below_knee; socks crew → crew / crew / crew
- ig-030: length at_knee → below_knee / below_knee / below_knee; socks crew → crew / crew / crew
- ig-053: length below_knee → below_knee / below_knee / below_knee; socks crew → crew / crew / crew
- ig-055: length below_knee → below_knee / below_knee / below_knee; socks crew → crew / crew / crew
- ig-063: length below_knee → below_knee / below_knee / below_knee; socks crew → crew / crew / crew
- ig-065: length below_knee → below_knee / below_knee / below_knee; socks not_visible → not_visible / not_visible / not_visible
- ig-066: length below_knee → below_knee / below_knee / below_knee; socks not_visible → crew / crew / crew
- ig-068: length below_knee → below_knee / below_knee / below_knee; socks crew → crew / crew / crew
- ig-101: length at_knee → below_knee / below_knee / below_knee; socks crew → crew / crew / crew
- ig-122: length above_knee → above_knee / above_knee / above_knee; socks crew → crew / crew / crew
- pin-021: length at_knee → below_knee / below_knee / below_knee; socks low → low / low / low
- pin-022: length above_knee → above_knee / above_knee / above_knee; socks not_visible → not_visible / not_visible / not_visible
- pin-023: length above_knee → above_knee / above_knee / above_knee; socks not_visible → not_visible / not_visible / not_visible
- pin-024: length above_knee → above_knee / above_knee / above_knee; socks crew → crew / crew / crew
- pin-034: length at_knee → at_knee / at_knee / at_knee; socks crew → crew / crew / crew
- pin-035: length above_knee → above_knee / above_knee / above_knee; socks crew → crew / crew / crew
- pin-038: length at_knee → below_knee / below_knee / below_knee; socks crew → crew / crew / crew
- pin-045: length above_knee → above_knee / above_knee / above_knee; socks not_visible → not_visible / not_visible / not_visible
- pin-058: length above_knee → cant_see / cant_see / cant_see; socks unsure → cant_see / cant_see / cant_see
- rd-005: length above_knee → above_knee / above_knee / above_knee; socks crew → crew / crew / crew

## Arm B (the scoring read with the new values)

| Question | Steady on 3 runs | Same exact answer on 3 | Right (grouping) | Right (exact) | Can't see | Passes |
|---|---|---|---|---|---|---|
| Length: above the knee vs at or below | 18/24 (75%) | 16/24 (67%) | 65/70 (93%) | 53/70 (76%) | 2/72 (3%) | no (steady) |
| Socks: crew or tall vs low or none | 21/24 (88%) | 23/24 (96%) | 62/66 (94%) | 62/66 (94%) | 6/72 (8%) | no (steady) |

Per photo (label → runs):

- ig-005: length at_knee → below_knee / below_knee / below_knee; socks crew → crew / crew / crew
- ig-020: length at_knee → not_shorts / at_knee / at_knee; socks crew → crew / crew / crew
- ig-021: length at_knee → at_knee / above_knee / above_knee; socks crew → crew / crew / crew
- ig-022: length above_knee → at_knee / above_knee / above_knee; socks crew → crew / crew / crew
- ig-023: length at_knee → above_knee / at_knee / at_knee; socks crew → crew / crew / crew
- ig-030: length at_knee → at_knee / at_knee / at_knee; socks crew → crew / crew / crew
- ig-053: length below_knee → below_knee / below_knee / at_knee; socks crew → crew / crew / crew
- ig-055: length below_knee → at_knee / at_knee / at_knee; socks crew → crew / crew / crew
- ig-063: length below_knee → below_knee / below_knee / below_knee; socks crew → crew / crew / crew
- ig-065: length below_knee → below_knee / below_knee / below_knee; socks not_visible → not_visible / not_visible / not_visible
- ig-066: length below_knee → below_knee / below_knee / below_knee; socks not_visible → crew / crew / crew
- ig-068: length below_knee → below_knee / below_knee / below_knee; socks crew → crew / crew / crew
- ig-101: length at_knee → at_knee / at_knee / at_knee; socks crew → low / crew / crew
- ig-122: length above_knee → above_knee / above_knee / above_knee; socks crew → crew / crew / crew
- pin-021: length at_knee → at_knee / below_knee / below_knee; socks low → no_shoes_read / no_shoes_read / no_shoes_read
- pin-022: length above_knee → above_knee / above_knee / above_knee; socks not_visible → not_visible / not_visible / not_visible
- pin-023: length above_knee → at_knee / above_knee / above_knee; socks not_visible → not_visible / not_visible / not_visible
- pin-024: length above_knee → above_knee / above_knee / not_shorts; socks crew → crew / crew / crew
- pin-034: length at_knee → at_knee / at_knee / at_knee; socks crew → crew / crew / crew
- pin-035: length above_knee → above_knee / above_knee / above_knee; socks crew → crew / crew / crew
- pin-038: length at_knee → below_knee / below_knee / below_knee; socks crew → crew / crew / crew
- pin-045: length above_knee → above_knee / above_knee / above_knee; socks not_visible → not_visible / not_visible / not_visible
- pin-058: length above_knee → above_knee / above_knee / above_knee; socks unsure → no_shoes_read / no_shoes_read / no_shoes_read
- rd-005: length above_knee → above_knee / above_knee / above_knee; socks crew → crew / crew / crew

## Harmless? Arm B against gold1's own runs (arm A, Oct 12), runs 0 and 1

- Score within 0.5 between runs: A 22/22 (100%) · B 21/22 (95%) → FAIL
- Old fields the same between runs (top, bottom, shoes, jacket × 8 fields): A 93.8% · B 91.6% → FAIL (bar: no more than 2 points lower)
- Run-0 scores that differ between A and B: 4 (ig-030 6.5 → 7.0; pin-021 6.5 → 7.0; pin-035 7.0 → 6.5; pin-038 5.0 → 7.0)


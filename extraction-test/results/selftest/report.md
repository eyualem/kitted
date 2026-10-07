# Extraction test report

- Photos scored: **4** (photos with fewer than 3 scored runs are left out), runs: **20**, failed runs: **0**
- **Score consistency:** 3/4 photos had every run within ±0.5 of the median = **75%** (pass bar 90%) → **FAIL**
- **Fix detection:** 2/2 = **100%** (pass bar 80%) → **PASS**
- Tokens used: 0 in / 0 out (multiply by your model's list price to get the test cost; divide by runs for cost per check)

## Propped camera vs mirror

| Method | Consistent photos | Share |
|---|---|---|
| mirror | 1/2 | 50% |
| propped | 2/2 | 100% |

## Per photo

| Outfit | Stage | Method | File | Runs | Scores | Median | Consistent | Partial runs |
|---|---|---|---|---|---|---|---|---|
| demo1 | after | mirror | after_mirror.jpg | 5 | [5.0, 5.5, 5.5, 5.5, 4.5] | 5.5 | False | 0 |
| demo1 | after | propped | after_propped.jpg | 5 | [5.5, 5.5, 5.5, 5.5, 5.5] | 5.5 | True | 0 |
| demo1 | before | mirror | before_mirror.jpg | 5 | [5.0, 4.5, 4.5, 4.5, 5.0] | 4.5 | True | 0 |
| demo1 | before | propped | before_propped.jpg | 5 | [4.5, 4.5, 4.5, 4.5, 4.5] | 4.5 | True | 0 |

## Fix detection

| Outfit | Method | Fix | Detected | Score change (median after − before) |
|---|---|---|---|---|
| demo1 | propped | cuffed | True | 1.0 |
| demo1 | mirror | cuffed | True | 1.0 |

## Field agreement (share of runs agreeing; lower = less reliable)

| Field | Average agreement |
|---|---|
| bottom.hem | 75% |
| top.subcategory | 100% |
| top.color_family | 100% |
| top.pattern | 100% |
| top.logo | 100% |
| top.volume | 100% |
| top.leg_shape | 100% |
| top.hem | 100% |
| top.tucked | 100% |
| top.condition | 100% |
| top.certainty | 100% |
| bottom.subcategory | 100% |
| bottom.color_family | 100% |
| bottom.pattern | 100% |
| bottom.logo | 100% |
| bottom.volume | 100% |
| bottom.leg_shape | 100% |
| bottom.tucked | 100% |
| bottom.condition | 100% |
| bottom.certainty | 100% |
| footwear.subcategory | 100% |
| footwear.color_family | 100% |
| footwear.pattern | 100% |
| footwear.logo | 100% |
| footwear.volume | 100% |
| footwear.leg_shape | 100% |
| footwear.hem | 100% |
| footwear.tucked | 100% |
| footwear.condition | 100% |
| footwear.certainty | 100% |

Fields below ~80% agreement should be **advice only** (no score impact) in v1.
# Extraction test report

- Photos scored: **12** (photos with fewer than 3 scored runs are left out), runs: **36**, failed runs: **0**
- **Score consistency:** 11/12 photos had every run within ±0.5 of the median = **92%** (pass bar 90%) → **PASS**
- **Fix detection:** 0/0 = **0%** (pass bar 80%) → **NO DATA**
- Tokens used: 64,944 in / 70,931 out (multiply by your model's list price to get the test cost; divide by runs for cost per check)

## Propped camera vs mirror

| Method | Consistent photos | Share |
|---|---|---|
| mirror | 10/11 | 91% |
| studio | 1/1 | 100% |

## Per photo

| Outfit | Stage | Method | File | Runs | Scores | Median | Consistent | Partial runs |
|---|---|---|---|---|---|---|---|---|
| m01 | before | mirror | before_mirror.jpg | 3 | [7.5, 8.5, 8.5] | 8.5 | False | 0 |
| m02 | before | mirror | before_mirror.jpg | 3 | [8.5, 8.5, 8.5] | 8.5 | True | 0 |
| m03 | before | mirror | before_mirror.jpg | 3 | [9.0, 9.0, 9.0] | 9.0 | True | 0 |
| m04 | before | mirror | before_mirror.jpg | 3 | [8.0, 8.0, 8.0] | 8.0 | True | 3 |
| m05 | before | studio | before_studio.jpg | 3 | [8.5, 8.0, 8.5] | 8.5 | True | 0 |
| m06 | before | mirror | before_mirror.jpg | 3 | [9.0, 9.0, 9.0] | 9.0 | True | 3 |
| m07 | before | mirror | before_mirror.jpg | 3 | [8.0, 8.0, 8.0] | 8.0 | True | 0 |
| m08 | before | mirror | before_mirror.jpg | 3 | [9.0, 9.0, 9.0] | 9.0 | True | 0 |
| m09 | before | mirror | before_mirror.jpg | 3 | [8.0, 8.5, 8.5] | 8.5 | True | 3 |
| m10 | before | mirror | before_mirror.jpg | 3 | [9.0, 8.5, 8.5] | 8.5 | True | 3 |
| m11 | before | mirror | before_mirror.jpg | 3 | [8.0, 8.0, 8.0] | 8.0 | True | 0 |
| m12 | before | mirror | before_mirror.jpg | 3 | [7.0, 7.0, 7.0] | 7.0 | True | 0 |

## Fix detection

| Outfit | Method | Fix | Detected | Score change (median after − before) |
|---|---|---|---|---|

## Field agreement (share of runs agreeing; lower = less reliable)

| Field | Average agreement |
|---|---|
| bottom.leg_shape | 89% |
| outerwear.subcategory | 89% |
| bottom.volume | 92% |
| footwear.subcategory | 92% |
| top.volume | 94% |
| bottom.subcategory | 94% |
| bottom.hem | 94% |
| outerwear.tucked | 94% |
| footwear.color_family | 96% |
| footwear.logo | 96% |
| footwear.volume | 96% |
| top.color_family | 97% |
| top.pattern | 97% |
| bottom.color_family | 97% |
| bottom.condition | 97% |
| top.subcategory | 100% |
| top.logo | 100% |
| top.leg_shape | 100% |
| top.hem | 100% |
| top.tucked | 100% |
| top.condition | 100% |
| bottom.pattern | 100% |
| bottom.logo | 100% |
| bottom.tucked | 100% |
| footwear.pattern | 100% |
| footwear.leg_shape | 100% |
| footwear.hem | 100% |
| footwear.tucked | 100% |
| footwear.condition | 100% |
| outerwear.color_family | 100% |
| outerwear.pattern | 100% |
| outerwear.logo | 100% |
| outerwear.volume | 100% |
| outerwear.leg_shape | 100% |
| outerwear.hem | 100% |
| outerwear.condition | 100% |

Fields below ~80% agreement should be **advice only** (no score impact) in v1.
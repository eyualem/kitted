# Extraction test report

- Photos scored: **8** (photos with fewer than 3 scored runs are left out), runs: **24**, failed runs: **0**
- **Score consistency:** 6/8 photos had every run within ±0.5 of the median = **75%** (pass bar 90%) → **FAIL**
- **Fix detection:** 0/0 = **0%** (pass bar 80%) → **NO DATA**
- Tokens used: 44,514 in / 18,466 out (multiply by your model's list price to get the test cost; divide by runs for cost per check)
- Seconds per call (includes retries): median **6.85**, slowest 13.8

## Propped camera vs mirror

| Method | Consistent photos | Share |
|---|---|---|
| mirror | 4/5 | 80% |
| phone | 1/1 | 100% |
| street | 1/1 | 100% |
| studio | 0/1 | 0% |

## Per photo

| Outfit | Stage | Method | File | Runs | Scores | Median | Consistent | Partial runs |
|---|---|---|---|---|---|---|---|---|
| m01 | before | mirror | before_mirror.jpg | 3 | [7.0, 7.0, 7.0] | 7.0 | True | 0 |
| m06 | before | mirror | before_mirror.jpg | 3 | [7.5, 7.5, 7.5] | 7.5 | True | 3 |
| m08 | before | mirror | before_mirror.jpg | 3 | [9.0, 9.0, 7.5] | 9.0 | False | 0 |
| m10 | before | mirror | before_mirror.jpg | 3 | [9.0, 8.5, 8.0] | 8.5 | True | 3 |
| s02 | before | studio | before_studio.jpg | 3 | [6.0, 5.5, 4.5] | 5.5 | False | 0 |
| s09 | before | street | before_street.jpg | 3 | [7.5, 7.0, 6.5] | 7.0 | True | 0 |
| s17 | before | phone | before_phone.jpg | 3 | [7.0, 7.0, 7.0] | 7.0 | True | 0 |
| s24 | before | mirror | before_mirror.jpg | 3 | [6.5, 6.5, 6.5] | 6.5 | True | 3 |

## Fix detection

| Outfit | Method | Fix | Detected | Score change (median after − before) |
|---|---|---|---|---|

## Field agreement (share of runs agreeing; lower = less reliable)

| Field | Average agreement |
|---|---|
| footwear.pattern | 87% |
| bottom.pattern | 88% |
| bottom.leg_shape | 88% |
| outerwear.color_family | 92% |
| outerwear.pattern | 92% |
| outerwear.volume | 92% |
| outerwear.condition | 92% |
| footwear.logo | 93% |
| footwear.condition | 93% |
| top.subcategory | 96% |
| top.color_family | 96% |
| top.pattern | 96% |
| top.volume | 96% |
| bottom.subcategory | 96% |
| bottom.color_family | 96% |
| bottom.volume | 96% |
| bottom.condition | 96% |
| top.logo | 100% |
| top.leg_shape | 100% |
| top.hem | 100% |
| top.tucked | 100% |
| top.condition | 100% |
| bottom.logo | 100% |
| bottom.hem | 100% |
| bottom.tucked | 100% |
| footwear.subcategory | 100% |
| footwear.color_family | 100% |
| footwear.volume | 100% |
| footwear.leg_shape | 100% |
| footwear.hem | 100% |
| footwear.tucked | 100% |
| outerwear.subcategory | 100% |
| outerwear.logo | 100% |
| outerwear.leg_shape | 100% |
| outerwear.hem | 100% |
| outerwear.tucked | 100% |

Fields below ~80% agreement should be **advice only** (no score impact) in v1.
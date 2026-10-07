# Extraction test report

- Photos scored: **8** (photos with fewer than 3 scored runs are left out), runs: **24**, failed runs: **0**
- **Score consistency:** 7/8 photos had every run within ±0.5 of the median = **88%** (pass bar 90%) → **FAIL**
- **Fix detection:** 0/0 = **0%** (pass bar 80%) → **NO DATA**
- Tokens used: 44,514 in / 18,818 out (multiply by your model's list price to get the test cost; divide by runs for cost per check)
- Seconds per call (includes retries): median **7.35**, slowest 9.9

## Propped camera vs mirror

| Method | Consistent photos | Share |
|---|---|---|
| mirror | 5/5 | 100% |
| phone | 1/1 | 100% |
| street | 1/1 | 100% |
| studio | 0/1 | 0% |

## Per photo

| Outfit | Stage | Method | File | Runs | Scores | Median | Consistent | Partial runs |
|---|---|---|---|---|---|---|---|---|
| m01 | before | mirror | before_mirror.jpg | 3 | [7.0, 7.0, 7.0] | 7.0 | True | 0 |
| m06 | before | mirror | before_mirror.jpg | 3 | [7.5, 7.5, 7.5] | 7.5 | True | 3 |
| m08 | before | mirror | before_mirror.jpg | 3 | [8.5, 8.5, 9.0] | 8.5 | True | 0 |
| m10 | before | mirror | before_mirror.jpg | 3 | [8.0, 8.0, 8.5] | 8.0 | True | 3 |
| s02 | before | studio | before_studio.jpg | 3 | [5.5, 4.5, 5.5] | 5.5 | False | 0 |
| s09 | before | street | before_street.jpg | 3 | [7.5, 7.5, 7.0] | 7.5 | True | 0 |
| s17 | before | phone | before_phone.jpg | 3 | [7.0, 7.0, 7.0] | 7.0 | True | 0 |
| s24 | before | mirror | before_mirror.jpg | 3 | [6.5, 6.5, 6.5] | 6.5 | True | 3 |

## Fix detection

| Outfit | Method | Fix | Detected | Score change (median after − before) |
|---|---|---|---|---|

## Field agreement (share of runs agreeing; lower = less reliable)

| Field | Average agreement |
|---|---|
| outerwear.subcategory | 83% |
| outerwear.pattern | 83% |
| bottom.leg_shape | 88% |
| top.volume | 92% |
| bottom.pattern | 92% |
| outerwear.volume | 92% |
| outerwear.condition | 92% |
| footwear.subcategory | 93% |
| footwear.pattern | 93% |
| footwear.logo | 93% |
| top.color_family | 96% |
| top.pattern | 96% |
| bottom.hem | 96% |
| top.subcategory | 100% |
| top.logo | 100% |
| top.leg_shape | 100% |
| top.hem | 100% |
| top.tucked | 100% |
| top.condition | 100% |
| bottom.subcategory | 100% |
| bottom.color_family | 100% |
| bottom.logo | 100% |
| bottom.volume | 100% |
| bottom.tucked | 100% |
| bottom.condition | 100% |
| footwear.color_family | 100% |
| footwear.volume | 100% |
| footwear.leg_shape | 100% |
| footwear.hem | 100% |
| footwear.tucked | 100% |
| footwear.condition | 100% |
| outerwear.color_family | 100% |
| outerwear.logo | 100% |
| outerwear.leg_shape | 100% |
| outerwear.hem | 100% |
| outerwear.tucked | 100% |

Fields below ~80% agreement should be **advice only** (no score impact) in v1.
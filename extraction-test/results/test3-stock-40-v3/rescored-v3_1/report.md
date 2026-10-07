# Extraction test report

- Photos scored: **39** (photos with fewer than 3 scored runs are left out), runs: **120**, failed runs: **0**
- **Score consistency:** 38/39 photos had every run within ±0.5 of the median = **97%** (pass bar 90%) → **PASS**
- **Fix detection:** 4/6 = **67%** (pass bar 80%) → **FAIL**
- Tokens used: 223,380 in / 230,679 out (multiply by your model's list price to get the test cost; divide by runs for cost per check)
- Seconds per call (includes retries): median **15.95**, slowest 48.1

## Propped camera vs mirror

| Method | Consistent photos | Share |
|---|---|---|
| mirror | 6/6 | 100% |
| phone | 6/6 | 100% |
| street | 13/14 | 93% |
| studio | 13/13 | 100% |

## Per photo

| Outfit | Stage | Method | File | Runs | Scores | Median | Consistent | Partial runs |
|---|---|---|---|---|---|---|---|---|
| p01 | after | studio | after_studio.jpg | 3 | [8.0, 8.0, 8.0] | 8.0 | True | 3 |
| p01 | before | studio | before_studio.jpg | 3 | [8.0, 8.0, 8.0] | 8.0 | True | 3 |
| p02 | after | studio | after_studio.jpg | 3 | [5.5, 5.5, 5.5] | 5.5 | True | 0 |
| p02 | before | studio | before_studio.jpg | 3 | [6.0, 6.0, 6.0] | 6.0 | True | 0 |
| p03 | after | street | after_street.jpg | 3 | [8.0, 8.5, 8.5] | 8.5 | True | 0 |
| p03 | before | street | before_street.jpg | 3 | [7.5, 7.0, 7.5] | 7.5 | True | 0 |
| p04 | after | street | after_street.jpg | 3 | [7.5, 7.5, 7.0] | 7.5 | True | 3 |
| p04 | before | street | before_street.jpg | 3 | [7.5, 7.5, 7.5] | 7.5 | True | 3 |
| p05 | after | street | after_street.jpg | 3 | [8.0, 8.0, 8.0] | 8.0 | True | 0 |
| p05 | before | street | before_street.jpg | 3 | [7.5, 7.5, 7.5] | 7.5 | True | 3 |
| p06 | after | studio | after_studio.jpg | 3 | [8.5, 8.5, 8.0] | 8.5 | True | 3 |
| p06 | before | studio | before_studio.jpg | 3 | [8.5, 8.5, 8.5] | 8.5 | True | 3 |
| s01 | before | studio | before_studio.jpg | 3 | [8.5, 8.0, 8.0] | 8.0 | True | 0 |
| s02 | before | studio | before_studio.jpg | 3 | [6.0, 6.5, 6.5] | 6.5 | True | 0 |
| s03 | before | studio | before_studio.jpg | 3 | [8.0, 8.0, 7.5] | 8.0 | True | 0 |
| s04 | before | studio | before_studio.jpg | 3 | [6.5, 6.5, 6.5] | 6.5 | True | 0 |
| s05 | before | studio | before_studio.jpg | 3 | [8.0, 7.5, 7.5] | 7.5 | True | 0 |
| s06 | before | studio | before_studio.jpg | 3 | [7.0, 7.0, 7.0] | 7.0 | True | 0 |
| s07 | before | studio | before_studio.jpg | 3 | [8.5, 8.5, 8.5] | 8.5 | True | 0 |
| s08 | before | studio | before_studio.jpg | 3 | [8.5, 8.5] | None | None | 0 |
| s09 | before | street | before_street.jpg | 3 | [7.5, 7.5, 6.5] | 7.5 | False | 0 |
| s10 | before | street | before_street.jpg | 3 | [8.0, 8.0, 8.0] | 8.0 | True | 0 |
| s11 | before | street | before_street.jpg | 3 | [7.5, 7.5, 7.5] | 7.5 | True | 0 |
| s12 | before | street | before_street.jpg | 3 | [7.0, 7.0, 7.0] | 7.0 | True | 0 |
| s13 | before | street | before_street.jpg | 3 | [8.0, 8.0, 7.5] | 8.0 | True | 0 |
| s14 | before | street | before_street.jpg | 3 | [8.5, 8.5, 8.5] | 8.5 | True | 0 |
| s15 | before | street | before_street.jpg | 3 | [8.5, 8.5, 9.0] | 8.5 | True | 0 |
| s16 | before | street | before_street.jpg | 3 | [8.5, 8.5, 8.5] | 8.5 | True | 0 |
| s17 | before | phone | before_phone.jpg | 3 | [7.0, 7.0, 6.5] | 7.0 | True | 0 |
| s18 | before | phone | before_phone.jpg | 3 | [8.0, 8.0, 8.0] | 8.0 | True | 0 |
| s19 | before | phone | before_phone.jpg | 3 | [7.5, 7.5, 7.5] | 7.5 | True | 3 |
| s20 | before | phone | before_phone.jpg | 3 | [7.0, 6.5, 7.0] | 7.0 | True | 0 |
| s21 | before | phone | before_phone.jpg | 3 | [7.0, 7.0, 7.0] | 7.0 | True | 0 |
| s22 | before | phone | before_phone.jpg | 3 | [7.5, 7.5, 8.0] | 7.5 | True | 3 |
| s23 | before | mirror | before_mirror.jpg | 3 | [7.5, 7.5, 7.5] | 7.5 | True | 3 |
| s24 | before | mirror | before_mirror.jpg | 3 | [6.5, 6.5, 6.5] | 6.5 | True | 3 |
| s25 | before | mirror | before_mirror.jpg | 3 | [7.5, 7.5, 7.5] | 7.5 | True | 0 |
| s26 | before | mirror | before_mirror.jpg | 3 | [7.5, 7.5, 7.5] | 7.5 | True | 3 |
| s27 | before | mirror | before_mirror.jpg | 3 | [7.0, 7.0, 7.0] | 7.0 | True | 3 |
| s28 | before | mirror | before_mirror.jpg | 3 | [7.0, 7.0, 7.0] | 7.0 | True | 3 |

## Fix detection

| Outfit | Method | Fix | Detected | Score change (median after − before) |
|---|---|---|---|---|
| p01 | studio | added_layer | False | 0.0 |
| p02 | studio | swapped_shoes | True | -0.5 |
| p03 | street | added_layer | True | 1.0 |
| p04 | street | swapped_top | True | 0.0 |
| p05 | street | swapped_bottom | True | 0.5 |
| p06 | studio | rolled_sleeves | False | 0.0 |

## Field agreement (share of runs agreeing; lower = less reliable)

| Field | Average agreement |
|---|---|
| bottom.hem | 90% |
| top.volume | 94% |
| outerwear.volume | 95% |
| footwear.pattern | 95% |
| footwear.volume | 95% |
| bottom.volume | 95% |
| bottom.leg_shape | 95% |
| footwear.subcategory | 96% |
| top.pattern | 96% |
| outerwear.subcategory | 96% |
| outerwear.color_family | 96% |
| outerwear.tucked | 96% |
| top.color_family | 97% |
| footwear.logo | 97% |
| footwear.condition | 97% |
| top.subcategory | 98% |
| top.tucked | 98% |
| bottom.color_family | 98% |
| footwear.color_family | 99% |
| bottom.subcategory | 99% |
| bottom.pattern | 99% |
| bottom.condition | 99% |
| top.logo | 100% |
| top.leg_shape | 100% |
| top.hem | 100% |
| top.condition | 100% |
| bottom.logo | 100% |
| bottom.tucked | 100% |
| outerwear.pattern | 100% |
| outerwear.logo | 100% |
| outerwear.leg_shape | 100% |
| outerwear.hem | 100% |
| outerwear.condition | 100% |
| footwear.leg_shape | 100% |
| footwear.hem | 100% |
| footwear.tucked | 100% |

Fields below ~80% agreement should be **advice only** (no score impact) in v1.
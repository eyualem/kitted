# Extraction test report

- Photos scored: **39** (photos with fewer than 3 scored runs are left out), runs: **200**, failed runs: **0**
- **Score consistency:** 37/39 photos had every run within ±0.5 of the median = **95%** (pass bar 90%) → **PASS**
- **Fix detection:** 4/6 = **67%** (pass bar 80%) → **FAIL**
- Tokens used: 363,500 in / 420,210 out (multiply by your model's list price to get the test cost; divide by runs for cost per check)

## Propped camera vs mirror

| Method | Consistent photos | Share |
|---|---|---|
| mirror | 6/6 | 100% |
| phone | 6/6 | 100% |
| street | 13/14 | 93% |
| studio | 12/13 | 92% |

## Per photo

| Outfit | Stage | Method | File | Runs | Scores | Median | Consistent | Partial runs |
|---|---|---|---|---|---|---|---|---|
| p01 | after | studio | after_studio.jpg | 5 | [8.5, 8.5, 8.5, 8.5, 8.0] | 8.5 | True | 5 |
| p01 | before | studio | before_studio.jpg | 5 | [8.5, 8.5, 8.5, 8.5, 8.5] | 8.5 | True | 5 |
| p02 | after | studio | after_studio.jpg | 5 | [8.5, 8.5, 8.0, 8.0, 8.0] | 8.0 | True | 0 |
| p02 | before | studio | before_studio.jpg | 5 | [8.5, 8.0, 8.5, 8.0, 8.0] | 8.0 | True | 0 |
| p03 | after | street | after_street.jpg | 5 | [8.5, 8.5, 8.5, 8.5, 8.5] | 8.5 | True | 0 |
| p03 | before | street | before_street.jpg | 5 | [8.5, 7.5, 8.0, 8.5, 8.0] | 8.0 | True | 0 |
| p04 | after | street | after_street.jpg | 5 | [8.0, 8.0, 8.0, 7.5, 8.0] | 8.0 | True | 5 |
| p04 | before | street | before_street.jpg | 5 | [7.5, 8.0, 8.0, 8.0, 8.0] | 8.0 | True | 5 |
| p05 | after | street | after_street.jpg | 5 | [8.5, 8.5, 8.5, 8.5, 8.5] | 8.5 | True | 0 |
| p05 | before | street | before_street.jpg | 5 | [8.5, 8.0, 9.0, 8.5, 8.5] | 8.5 | True | 5 |
| p06 | after | studio | after_studio.jpg | 5 | [9.0, 9.0, 9.0, 9.0, 9.0] | 9.0 | True | 5 |
| p06 | before | studio | before_studio.jpg | 5 | [9.0, 9.0, 9.0, 9.0, 9.0] | 9.0 | True | 5 |
| s01 | before | studio | before_studio.jpg | 5 | [9.0, 9.0, 9.0, 9.0, 9.0] | 9.0 | True | 0 |
| s02 | before | studio | before_studio.jpg | 5 | [7.5, 8.5, 8.0, 8.0, 7.5] | 8.0 | True | 0 |
| s03 | before | studio | before_studio.jpg | 5 | [8.5, 8.5, 8.5, 8.5, 8.5] | 8.5 | True | 0 |
| s04 | before | studio | before_studio.jpg | 5 | [8.5, 7.5, 8.5, 8.5, 7.5] | 8.5 | False | 0 |
| s05 | before | studio | before_studio.jpg | 5 | [8.5, 8.5, 8.5, 8.5, 8.5] | 8.5 | True | 0 |
| s06 | before | studio | before_studio.jpg | 5 | [8.0, 8.0, 8.0, 8.0, 8.0] | 8.0 | True | 0 |
| s07 | before | studio | before_studio.jpg | 5 | [8.5, 8.5, 8.5, 8.5, 8.5] | 8.5 | True | 0 |
| s08 | before | studio | before_studio.jpg | 5 | [] | None | None | 0 |
| s09 | before | street | before_street.jpg | 5 | [7.5, 7.0, 7.0, 7.0, 7.5] | 7.0 | True | 0 |
| s10 | before | street | before_street.jpg | 5 | [8.5, 8.5, 8.5, 8.5, 8.5] | 8.5 | True | 0 |
| s11 | before | street | before_street.jpg | 5 | [8.5, 8.0, 8.5, 8.5, 8.0] | 8.5 | True | 0 |
| s12 | before | street | before_street.jpg | 5 | [8.5, 9.0, 9.0, 9.0, 9.0] | 9.0 | True | 0 |
| s13 | before | street | before_street.jpg | 5 | [9.0, 9.0, 9.0, 9.0, 7.5] | 9.0 | False | 0 |
| s14 | before | street | before_street.jpg | 5 | [9.0, 9.0, 9.0, 9.0, 9.0] | 9.0 | True | 0 |
| s15 | before | street | before_street.jpg | 5 | [9.0, 9.0, 9.0, 9.0, 8.5] | 9.0 | True | 0 |
| s16 | before | street | before_street.jpg | 5 | [9.0, 9.0, 9.0, 9.0, 9.0] | 9.0 | True | 0 |
| s17 | before | phone | before_phone.jpg | 5 | [7.5, 7.5, 7.5, 7.0, 7.5] | 7.5 | True | 0 |
| s18 | before | phone | before_phone.jpg | 5 | [8.0, 8.0, 8.0, 8.0, 8.0] | 8.0 | True | 0 |
| s19 | before | phone | before_phone.jpg | 5 | [8.5, 8.5, 8.5, 8.5, 8.5] | 8.5 | True | 5 |
| s20 | before | phone | before_phone.jpg | 5 | [7.5, 8.0, 8.0, 7.5, 8.0] | 8.0 | True | 0 |
| s21 | before | phone | before_phone.jpg | 5 | [9.0, 9.0, 9.0, 9.0, 9.0] | 9.0 | True | 0 |
| s22 | before | phone | before_phone.jpg | 5 | [8.0, 8.0, 8.0, 8.5, 8.5] | 8.0 | True | 5 |
| s23 | before | mirror | before_mirror.jpg | 5 | [9.0, 9.0, 9.0, 9.0, 9.0] | 9.0 | True | 5 |
| s24 | before | mirror | before_mirror.jpg | 5 | [9.0, 9.0, 9.0, 9.0, 9.0] | 9.0 | True | 5 |
| s25 | before | mirror | before_mirror.jpg | 5 | [8.5, 8.5, 8.5, 8.5, 8.5] | 8.5 | True | 0 |
| s26 | before | mirror | before_mirror.jpg | 5 | [8.0, 8.0, 8.0, 8.0, 8.0] | 8.0 | True | 5 |
| s27 | before | mirror | before_mirror.jpg | 5 | [9.0, 9.0, 9.0, 9.0, 9.0] | 9.0 | True | 5 |
| s28 | before | mirror | before_mirror.jpg | 5 | [9.0, 9.0, 9.0, 9.0, 9.0] | 9.0 | True | 5 |

## Fix detection

| Outfit | Method | Fix | Detected | Score change (median after − before) |
|---|---|---|---|---|
| p01 | studio | added_layer | False | 0.0 |
| p02 | studio | swapped_shoes | True | 0.0 |
| p03 | street | added_layer | False | 0.5 |
| p04 | street | swapped_top | True | 0.0 |
| p05 | street | swapped_bottom | True | 0.0 |
| p06 | studio | rolled_sleeves | True | 0.0 |

## Field agreement (share of runs agreeing; lower = less reliable)

| Field | Average agreement |
|---|---|
| bottom.hem | 90% |
| top.volume | 92% |
| footwear.volume | 92% |
| outerwear.volume | 94% |
| outerwear.tucked | 94% |
| bottom.leg_shape | 95% |
| footwear.condition | 95% |
| top.pattern | 96% |
| top.tucked | 96% |
| footwear.color_family | 96% |
| outerwear.color_family | 97% |
| footwear.logo | 97% |
| bottom.volume | 97% |
| bottom.color_family | 98% |
| footwear.subcategory | 98% |
| footwear.pattern | 98% |
| top.subcategory | 98% |
| top.logo | 98% |
| outerwear.subcategory | 98% |
| bottom.subcategory | 98% |
| bottom.condition | 98% |
| top.color_family | 99% |
| bottom.pattern | 100% |
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
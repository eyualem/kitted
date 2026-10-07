# Extraction test report

- Photos scored: **40** (photos with fewer than 3 scored runs are left out), runs: **120**, failed runs: **0**
- **Score consistency:** 38/40 photos had every run within ±0.5 of the median = **95%** (pass bar 90%) → **PASS**
- **Fix detection:** 4/6 = **67%** (pass bar 80%) → **FAIL**
- Tokens used: 222,180 in / 30,208 out (multiply by your model's list price to get the test cost; divide by runs for cost per check)
- Seconds per call (API only): median **4.13**, p90 **8.16**, p95 10.42, slowest 25.13; under 5 s: 74%, under 8 s: 90%
- Seconds per call including retry waits: median 4.1, slowest 25.7
- Visible answer tokens: median 259.0, p90 333; thinking tokens median 0.0

## Propped camera vs mirror

| Method | Consistent photos | Share |
|---|---|---|
| mirror | 5/6 | 83% |
| phone | 5/6 | 83% |
| street | 14/14 | 100% |
| studio | 14/14 | 100% |

## Per photo

| Outfit | Stage | Method | File | Runs | Scores | Median | Consistent | Partial runs |
|---|---|---|---|---|---|---|---|---|
| p01 | after | studio | after_studio.jpg | 3 | [7.5, 7.5, 8.0] | 7.5 | True | 3 |
| p01 | before | studio | before_studio.jpg | 3 | [7.5, 7.5, 7.5] | 7.5 | True | 3 |
| p02 | after | studio | after_studio.jpg | 3 | [5.5, 5.5, 5.5] | 5.5 | True | 0 |
| p02 | before | studio | before_studio.jpg | 3 | [5.5, 5.0, 6.0] | 5.5 | True | 0 |
| p03 | after | street | after_street.jpg | 3 | [8.5, 8.5, 8.5] | 8.5 | True | 0 |
| p03 | before | street | before_street.jpg | 3 | [8.5, 8.5, 8.0] | 8.5 | True | 0 |
| p04 | after | street | after_street.jpg | 3 | [7.5, 7.5, 7.5] | 7.5 | True | 3 |
| p04 | before | street | before_street.jpg | 3 | [7.0, 7.5, 7.5] | 7.5 | True | 3 |
| p05 | after | street | after_street.jpg | 3 | [8.0, 8.0, 8.0] | 8.0 | True | 0 |
| p05 | before | street | before_street.jpg | 3 | [7.0, 7.5, 7.0] | 7.0 | True | 3 |
| p06 | after | studio | after_studio.jpg | 3 | [7.5, 8.0, 7.5] | 7.5 | True | 3 |
| p06 | before | studio | before_studio.jpg | 3 | [8.0, 8.0, 8.0] | 8.0 | True | 3 |
| s01 | before | studio | before_studio.jpg | 3 | [9.0, 9.0, 8.5] | 9.0 | True | 0 |
| s02 | before | studio | before_studio.jpg | 3 | [5.0, 5.5, 5.0] | 5.0 | True | 0 |
| s03 | before | studio | before_studio.jpg | 3 | [8.0, 8.0, 8.0] | 8.0 | True | 0 |
| s04 | before | studio | before_studio.jpg | 3 | [6.0, 7.0, 6.5] | 6.5 | True | 0 |
| s05 | before | studio | before_studio.jpg | 3 | [7.5, 7.0, 7.5] | 7.5 | True | 0 |
| s06 | before | studio | before_studio.jpg | 3 | [5.5, 6.0, 5.5] | 5.5 | True | 0 |
| s07 | before | studio | before_studio.jpg | 3 | [8.0, 8.0, 8.0] | 8.0 | True | 0 |
| s08 | before | studio | before_studio.jpg | 3 | [8.5, 8.5, 8.5] | 8.5 | True | 0 |
| s09 | before | street | before_street.jpg | 3 | [7.5, 7.5, 8.0] | 7.5 | True | 0 |
| s10 | before | street | before_street.jpg | 3 | [8.0, 8.0, 8.0] | 8.0 | True | 0 |
| s11 | before | street | before_street.jpg | 3 | [7.5, 7.0, 7.5] | 7.5 | True | 0 |
| s12 | before | street | before_street.jpg | 3 | [7.0, 7.0, 7.0] | 7.0 | True | 0 |
| s13 | before | street | before_street.jpg | 3 | [7.5, 7.5, 7.5] | 7.5 | True | 3 |
| s14 | before | street | before_street.jpg | 3 | [7.5, 7.5, 7.5] | 7.5 | True | 0 |
| s15 | before | street | before_street.jpg | 3 | [9.0, 9.0, 9.0] | 9.0 | True | 0 |
| s16 | before | street | before_street.jpg | 3 | [8.5, 8.5, 8.5] | 8.5 | True | 0 |
| s17 | before | phone | before_phone.jpg | 3 | [7.5, 6.5, 6.5] | 6.5 | False | 0 |
| s18 | before | phone | before_phone.jpg | 3 | [7.5, 7.5, 7.5] | 7.5 | True | 0 |
| s19 | before | phone | before_phone.jpg | 3 | [6.5, 6.5, 6.5] | 6.5 | True | 3 |
| s20 | before | phone | before_phone.jpg | 3 | [7.0, 7.0, 7.0] | 7.0 | True | 2 |
| s21 | before | phone | before_phone.jpg | 3 | [7.0, 7.0, 6.5] | 7.0 | True | 0 |
| s22 | before | phone | before_phone.jpg | 3 | [7.5, 7.5, 7.5] | 7.5 | True | 3 |
| s23 | before | mirror | before_mirror.jpg | 3 | [7.5, 7.0, 7.0] | 7.0 | True | 3 |
| s24 | before | mirror | before_mirror.jpg | 3 | [6.5, 6.0, 6.5] | 6.5 | True | 3 |
| s25 | before | mirror | before_mirror.jpg | 3 | [7.5, 7.5, 6.5] | 7.5 | False | 0 |
| s26 | before | mirror | before_mirror.jpg | 3 | [7.0, 6.5, 7.0] | 7.0 | True | 3 |
| s27 | before | mirror | before_mirror.jpg | 3 | [7.0, 7.0, 7.0] | 7.0 | True | 3 |
| s28 | before | mirror | before_mirror.jpg | 3 | [7.0, 7.0, 7.0] | 7.0 | True | 3 |

## Fix detection

| Outfit | Method | Fix | Detected | Score change (median after − before) |
|---|---|---|---|---|
| p01 | studio | added_layer | False | 0.0 |
| p02 | studio | swapped_shoes | True | 0.0 |
| p03 | street | added_layer | True | 0.0 |
| p04 | street | swapped_top | True | 0.0 |
| p05 | street | swapped_bottom | True | 1.0 |
| p06 | studio | rolled_sleeves | False | -0.5 |

## Field agreement (share of runs agreeing; lower = less reliable)

| Field | Average agreement |
|---|---|
| footwear.certainty | 88% |
| footwear.subcategory | 91% |
| top.sleeve_end | 92% |
| bottom.hem | 93% |
| outerwear.color_family | 95% |
| bottom.color_family | 95% |
| bottom.condition | 95% |
| bottom.certainty | 95% |
| top.condition | 95% |
| bottom.leg_shape | 96% |
| top.length | 96% |
| top.certainty | 96% |
| outerwear.subcategory | 96% |
| outerwear.sleeve_end | 96% |
| outerwear.condition | 96% |
| outerwear.certainty | 96% |
| top.volume | 97% |
| top.logo | 97% |
| footwear.color_family | 97% |
| footwear.condition | 97% |
| bottom.subcategory | 98% |
| bottom.distressed_by_design | 98% |
| top.color_family | 98% |
| outerwear.pattern | 98% |
| outerwear.pattern_scale | 98% |
| outerwear.strain | 98% |
| top.saturation | 99% |
| top.pattern | 99% |
| top.tucked | 99% |
| bottom.pattern | 99% |
| top.subcategory | 100% |
| top.pattern_scale | 100% |
| top.leg_shape | 100% |
| top.hem | 100% |
| top.strain | 100% |
| top.distressed_by_design | 100% |
| top.shows_below_outer | 100% |
| bottom.saturation | 100% |
| bottom.pattern_scale | 100% |
| bottom.logo | 100% |
| bottom.volume | 100% |
| bottom.tucked | 100% |
| bottom.length | 100% |
| bottom.sleeve_end | 100% |
| bottom.strain | 100% |
| bottom.shows_below_outer | 100% |
| outerwear.saturation | 100% |
| outerwear.logo | 100% |
| outerwear.volume | 100% |
| outerwear.leg_shape | 100% |
| outerwear.hem | 100% |
| outerwear.tucked | 100% |
| outerwear.length | 100% |
| outerwear.distressed_by_design | 100% |
| outerwear.shows_below_outer | 100% |
| footwear.saturation | 100% |
| footwear.pattern | 100% |
| footwear.pattern_scale | 100% |
| footwear.logo | 100% |
| footwear.volume | 100% |
| footwear.leg_shape | 100% |
| footwear.hem | 100% |
| footwear.tucked | 100% |
| footwear.length | 100% |
| footwear.sleeve_end | 100% |
| footwear.strain | 100% |
| footwear.distressed_by_design | 100% |
| footwear.shows_below_outer | 100% |

Fields below ~80% agreement should be **advice only** (no score impact) in v1.
# Extraction test report

- Photos scored: **12** (photos with fewer than 3 scored runs are left out), runs: **36**, failed runs: **0**
- **Score consistency:** 11/12 photos had every run within ±0.5 of the median = **92%** (pass bar 90%) → **PASS**
- **Fix detection:** 0/0 = **0%** (pass bar 80%) → **NO DATA**
- Tokens used: 75,924 in / 27,661 out (multiply by your model's list price to get the test cost; divide by runs for cost per check)
- Seconds per call (API only): median **5.82**, p90 **7.51**, p95 8.15, slowest 12.31; under 5 s: 25%, under 8 s: 94%
- Seconds per call including retry waits: median 5.8, slowest 12.3
- Visible answer tokens: median 815.0, p90 993; thinking tokens median 0.0

## Propped camera vs mirror

| Method | Consistent photos | Share |
|---|---|---|
| mirror | 10/11 | 91% |
| studio | 1/1 | 100% |

## Per photo

| Outfit | Stage | Method | File | Runs | Scores | Median | Consistent | Partial runs |
|---|---|---|---|---|---|---|---|---|
| m01 | before | mirror | before_mirror.jpg | 3 | [7.0, 7.5, 7.5] | 7.5 | True | 0 |
| m02 | before | mirror | before_mirror.jpg | 3 | [8.5, 8.5, 8.5] | 8.5 | True | 0 |
| m03 | before | mirror | before_mirror.jpg | 3 | [7.5, 7.5, 6.5] | 7.5 | False | 0 |
| m04 | before | mirror | before_mirror.jpg | 3 | [6.5, 7.0, 6.5] | 6.5 | True | 3 |
| m05 | before | studio | before_studio.jpg | 3 | [7.5, 7.5, 7.5] | 7.5 | True | 0 |
| m06 | before | mirror | before_mirror.jpg | 3 | [7.0, 7.5, 7.0] | 7.0 | True | 3 |
| m07 | before | mirror | before_mirror.jpg | 3 | [8.0, 8.0, 8.0] | 8.0 | True | 0 |
| m08 | before | mirror | before_mirror.jpg | 3 | [8.0, 8.0, 8.0] | 8.0 | True | 0 |
| m09 | before | mirror | before_mirror.jpg | 3 | [7.0, 7.0, 7.0] | 7.0 | True | 3 |
| m10 | before | mirror | before_mirror.jpg | 3 | [8.0, 8.0, 8.0] | 8.0 | True | 3 |
| m11 | before | mirror | before_mirror.jpg | 3 | [8.0, 8.0, 8.0] | 8.0 | True | 0 |
| m12 | before | mirror | before_mirror.jpg | 3 | [8.0, 7.5, 7.5] | 7.5 | True | 0 |

## Fix detection

| Outfit | Method | Fix | Detected | Score change (median after − before) |
|---|---|---|---|---|

## Field agreement (share of runs agreeing; lower = less reliable)

| Field | Average agreement |
|---|---|
| outerwear.length | 83% |
| bottom.hem | 86% |
| outerwear.saturation | 89% |
| outerwear.pattern | 89% |
| outerwear.pattern_scale | 89% |
| bottom.volume | 92% |
| bottom.leg_shape | 92% |
| footwear.volume | 92% |
| top.volume | 94% |
| bottom.subcategory | 94% |
| outerwear.subcategory | 94% |
| outerwear.color_family | 94% |
| outerwear.volume | 94% |
| outerwear.sleeve_end | 94% |
| footwear.subcategory | 96% |
| footwear.saturation | 96% |
| footwear.pattern | 96% |
| footwear.certainty | 96% |
| top.saturation | 97% |
| top.sleeve_end | 97% |
| bottom.color_family | 97% |
| bottom.saturation | 97% |
| bottom.condition | 97% |
| bottom.certainty | 97% |
| top.subcategory | 100% |
| top.color_family | 100% |
| top.pattern | 100% |
| top.pattern_scale | 100% |
| top.logo | 100% |
| top.leg_shape | 100% |
| top.hem | 100% |
| top.tucked | 100% |
| top.length | 100% |
| top.strain | 100% |
| top.condition | 100% |
| top.distressed_by_design | 100% |
| top.shows_below_outer | 100% |
| top.certainty | 100% |
| bottom.pattern | 100% |
| bottom.pattern_scale | 100% |
| bottom.logo | 100% |
| bottom.tucked | 100% |
| bottom.length | 100% |
| bottom.sleeve_end | 100% |
| bottom.strain | 100% |
| bottom.distressed_by_design | 100% |
| bottom.shows_below_outer | 100% |
| footwear.color_family | 100% |
| footwear.pattern_scale | 100% |
| footwear.logo | 100% |
| footwear.leg_shape | 100% |
| footwear.hem | 100% |
| footwear.tucked | 100% |
| footwear.length | 100% |
| footwear.sleeve_end | 100% |
| footwear.strain | 100% |
| footwear.condition | 100% |
| footwear.distressed_by_design | 100% |
| footwear.shows_below_outer | 100% |
| outerwear.logo | 100% |
| outerwear.leg_shape | 100% |
| outerwear.hem | 100% |
| outerwear.tucked | 100% |
| outerwear.strain | 100% |
| outerwear.condition | 100% |
| outerwear.distressed_by_design | 100% |
| outerwear.shows_below_outer | 100% |
| outerwear.certainty | 100% |

Fields below ~80% agreement should be **advice only** (no score impact) in v1.
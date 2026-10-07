# Extraction test report

- Photos scored: **12** (photos with fewer than 3 scored runs are left out), runs: **36**, failed runs: **0**
- **Score consistency:** 12/12 photos had every run within ±0.5 of the median = **100%** (pass bar 90%) → **PASS**
- **Fix detection:** 0/0 = **0%** (pass bar 80%) → **NO DATA**
- Tokens used: 66,528 in / 25,618 out (multiply by your model's list price to get the test cost; divide by runs for cost per check)
- Seconds per call (API only): median **6.625**, p90 **8.37**, p95 11.29, slowest 17.14; under 5 s: 25%, under 8 s: 86%
- Seconds per call including retry waits: median 6.6, slowest 17.1
- Visible answer tokens: median 765.0, p90 934; thinking tokens median 0.0

## Propped camera vs mirror

| Method | Consistent photos | Share |
|---|---|---|
| mirror | 11/11 | 100% |
| studio | 1/1 | 100% |

## Per photo

| Outfit | Stage | Method | File | Runs | Scores | Median | Consistent | Partial runs |
|---|---|---|---|---|---|---|---|---|
| m01 | before | mirror | before_mirror.jpg | 3 | [7.0, 7.0, 7.0] | 7.0 | True | 0 |
| m02 | before | mirror | before_mirror.jpg | 3 | [8.5, 8.5, 8.5] | 8.5 | True | 0 |
| m03 | before | mirror | before_mirror.jpg | 3 | [8.0, 8.0, 8.5] | 8.0 | True | 0 |
| m04 | before | mirror | before_mirror.jpg | 3 | [6.5, 6.5, 6.5] | 6.5 | True | 3 |
| m05 | before | studio | before_studio.jpg | 3 | [8.0, 8.0, 8.0] | 8.0 | True | 0 |
| m06 | before | mirror | before_mirror.jpg | 3 | [7.5, 7.5, 7.5] | 7.5 | True | 3 |
| m07 | before | mirror | before_mirror.jpg | 3 | [9.0, 8.5, 8.5] | 8.5 | True | 0 |
| m08 | before | mirror | before_mirror.jpg | 3 | [8.0, 8.5, 8.0] | 8.0 | True | 0 |
| m09 | before | mirror | before_mirror.jpg | 3 | [8.0, 7.5, 7.0] | 7.5 | True | 3 |
| m10 | before | mirror | before_mirror.jpg | 3 | [8.5, 8.0, 8.0] | 8.0 | True | 3 |
| m11 | before | mirror | before_mirror.jpg | 3 | [8.0, 8.0, 8.0] | 8.0 | True | 0 |
| m12 | before | mirror | before_mirror.jpg | 3 | [8.0, 8.5, 8.5] | 8.5 | True | 0 |

## Fix detection

| Outfit | Method | Fix | Detected | Score change (median after − before) |
|---|---|---|---|---|

## Field agreement (share of runs agreeing; lower = less reliable)

| Field | Average agreement |
|---|---|
| bottom.volume | 83% |
| bottom.leg_shape | 83% |
| footwear.subcategory | 83% |
| footwear.certainty | 88% |
| outerwear.pattern | 89% |
| outerwear.pattern_scale | 89% |
| outerwear.volume | 89% |
| outerwear.length | 89% |
| outerwear.condition | 89% |
| top.volume | 92% |
| bottom.hem | 92% |
| bottom.condition | 92% |
| top.sleeve_end | 94% |
| bottom.subcategory | 94% |
| bottom.saturation | 94% |
| outerwear.subcategory | 94% |
| outerwear.color_family | 94% |
| outerwear.sleeve_end | 94% |
| outerwear.certainty | 94% |
| footwear.color_family | 96% |
| footwear.saturation | 96% |
| footwear.pattern | 96% |
| footwear.logo | 96% |
| footwear.volume | 96% |
| top.color_family | 97% |
| top.pattern | 97% |
| top.pattern_scale | 97% |
| bottom.strain | 97% |
| bottom.distressed_by_design | 97% |
| bottom.certainty | 97% |
| top.subcategory | 100% |
| top.saturation | 100% |
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
| bottom.color_family | 100% |
| bottom.pattern | 100% |
| bottom.pattern_scale | 100% |
| bottom.logo | 100% |
| bottom.tucked | 100% |
| bottom.length | 100% |
| bottom.sleeve_end | 100% |
| bottom.shows_below_outer | 100% |
| footwear.pattern_scale | 100% |
| footwear.leg_shape | 100% |
| footwear.hem | 100% |
| footwear.tucked | 100% |
| footwear.length | 100% |
| footwear.sleeve_end | 100% |
| footwear.strain | 100% |
| footwear.condition | 100% |
| footwear.distressed_by_design | 100% |
| footwear.shows_below_outer | 100% |
| outerwear.saturation | 100% |
| outerwear.logo | 100% |
| outerwear.leg_shape | 100% |
| outerwear.hem | 100% |
| outerwear.tucked | 100% |
| outerwear.strain | 100% |
| outerwear.distressed_by_design | 100% |
| outerwear.shows_below_outer | 100% |

Fields below ~80% agreement should be **advice only** (no score impact) in v1.
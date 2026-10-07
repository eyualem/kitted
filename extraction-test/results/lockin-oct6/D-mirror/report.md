# Extraction test report

- Photos scored: **12** (photos with fewer than 3 scored runs are left out), runs: **36**, failed runs: **0**
- **Score consistency:** 12/12 photos had every run within ±0.5 of the median = **100%** (pass bar 90%) → **PASS**
- **Fix detection:** 0/0 = **0%** (pass bar 80%) → **NO DATA**
- Tokens used: 66,168 in / 7,367 out (multiply by your model's list price to get the test cost; divide by runs for cost per check)
- Seconds per call (API only): median **3.625**, p90 **4.83**, p95 5.9, slowest 10.33; under 5 s: 92%, under 8 s: 97%
- Seconds per call including retry waits: median 3.6500000000000004, slowest 10.3
- Visible answer tokens: median 170.0, p90 319; thinking tokens median 0.0

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
| m03 | before | mirror | before_mirror.jpg | 3 | [8.0, 8.0, 8.0] | 8.0 | True | 0 |
| m04 | before | mirror | before_mirror.jpg | 3 | [7.0, 6.5, 6.5] | 6.5 | True | 3 |
| m05 | before | studio | before_studio.jpg | 3 | [8.5, 8.0, 8.0] | 8.0 | True | 0 |
| m06 | before | mirror | before_mirror.jpg | 3 | [7.0, 7.5, 7.0] | 7.0 | True | 3 |
| m07 | before | mirror | before_mirror.jpg | 3 | [8.0, 8.0, 8.0] | 8.0 | True | 0 |
| m08 | before | mirror | before_mirror.jpg | 3 | [8.0, 7.5, 8.0] | 8.0 | True | 0 |
| m09 | before | mirror | before_mirror.jpg | 3 | [7.5, 7.5, 7.5] | 7.5 | True | 3 |
| m10 | before | mirror | before_mirror.jpg | 3 | [8.0, 8.0, 8.0] | 8.0 | True | 3 |
| m11 | before | mirror | before_mirror.jpg | 3 | [8.0, 8.0, 8.0] | 8.0 | True | 0 |
| m12 | before | mirror | before_mirror.jpg | 3 | [8.0, 8.0, 8.0] | 8.0 | True | 0 |

## Fix detection

| Outfit | Method | Fix | Detected | Score change (median after − before) |
|---|---|---|---|---|

## Field agreement (share of runs agreeing; lower = less reliable)

| Field | Average agreement |
|---|---|
| bottom.leg_shape | 89% |
| outerwear.certainty | 89% |
| footwear.subcategory | 92% |
| top.color_family | 94% |
| top.volume | 94% |
| bottom.color_family | 94% |
| bottom.condition | 94% |
| bottom.distressed_by_design | 94% |
| outerwear.subcategory | 94% |
| outerwear.color_family | 94% |
| outerwear.pattern | 94% |
| outerwear.pattern_scale | 94% |
| outerwear.condition | 94% |
| outerwear.distressed_by_design | 94% |
| footwear.condition | 96% |
| footwear.certainty | 96% |
| top.subcategory | 97% |
| top.saturation | 97% |
| top.length | 97% |
| top.sleeve_end | 97% |
| top.certainty | 97% |
| bottom.subcategory | 97% |
| bottom.hem | 97% |
| bottom.certainty | 97% |
| top.pattern | 100% |
| top.pattern_scale | 100% |
| top.logo | 100% |
| top.leg_shape | 100% |
| top.hem | 100% |
| top.tucked | 100% |
| top.strain | 100% |
| top.condition | 100% |
| top.distressed_by_design | 100% |
| top.shows_below_outer | 100% |
| bottom.saturation | 100% |
| bottom.pattern | 100% |
| bottom.pattern_scale | 100% |
| bottom.logo | 100% |
| bottom.volume | 100% |
| bottom.tucked | 100% |
| bottom.length | 100% |
| bottom.sleeve_end | 100% |
| bottom.strain | 100% |
| bottom.shows_below_outer | 100% |
| footwear.color_family | 100% |
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
| outerwear.saturation | 100% |
| outerwear.logo | 100% |
| outerwear.volume | 100% |
| outerwear.leg_shape | 100% |
| outerwear.hem | 100% |
| outerwear.tucked | 100% |
| outerwear.length | 100% |
| outerwear.sleeve_end | 100% |
| outerwear.strain | 100% |
| outerwear.shows_below_outer | 100% |

Fields below ~80% agreement should be **advice only** (no score impact) in v1.
# Extraction test report

- Photos scored: **4** (photos with fewer than 3 scored runs are left out), runs: **12**, failed runs: **0**
- **Score consistency:** 4/4 photos had every run within ±0.5 of the median = **100%** (pass bar 90%) → **PASS**
- **Fix detection:** 0/0 = **0%** (pass bar 80%) → **NO DATA**
- Tokens used: 29,391 in / 11,589 out (multiply by your model's list price to get the test cost; divide by runs for cost per check)
- Seconds per call (API only): median **15.1**, p90 **20.33**, p95 23.89, slowest 23.89; under 5 s: 0%, under 8 s: 0%
- Seconds per call including retry waits: median 15.1, slowest 23.9
- Visible answer tokens: median 844.0, p90 1341; thinking tokens median 0.0

## Propped camera vs mirror

| Method | Consistent photos | Share |
|---|---|---|
| mirror | 4/4 | 100% |

## Per photo

| Outfit | Stage | Method | File | Runs | Scores | Median | Consistent | Partial runs |
|---|---|---|---|---|---|---|---|---|
| ph1 | before | mirror | before_mirror.jpg | 3 | [4.5, 4.5, 4.5] | 4.5 | True | 0 |
| ph2 | before | mirror | before_mirror.jpg | 3 | [7.5, 7.5, 8.0] | 7.5 | True | 3 |
| ph3 | before | mirror | before_mirror.jpg | 3 | [8.5, 8.5, 8.0] | 8.5 | True | 0 |
| ph4 | before | mirror | before_mirror.jpg | 3 | [8.5, 8.5, 8.0] | 8.5 | True | 3 |

## Fix detection

| Outfit | Method | Fix | Detected | Score change (median after − before) |
|---|---|---|---|---|

## Field agreement (share of runs agreeing; lower = less reliable)

| Field | Average agreement |
|---|---|
| top.certainty | 83% |
| footwear.certainty | 83% |
| outerwear.subcategory | 83% |
| outerwear.length | 83% |
| top.length | 92% |
| top.strain | 92% |
| top.condition | 92% |
| bottom.subcategory | 92% |
| bottom.hem | 92% |
| bottom.strain | 92% |
| bottom.distressed_by_design | 92% |
| bottom.certainty | 92% |
| top.subcategory | 100% |
| top.color_family | 100% |
| top.saturation | 100% |
| top.pattern | 100% |
| top.pattern_scale | 100% |
| top.logo | 100% |
| top.volume | 100% |
| top.leg_shape | 100% |
| top.hem | 100% |
| top.tucked | 100% |
| top.sleeve_end | 100% |
| top.distressed_by_design | 100% |
| top.shows_below_outer | 100% |
| bottom.color_family | 100% |
| bottom.saturation | 100% |
| bottom.pattern | 100% |
| bottom.pattern_scale | 100% |
| bottom.logo | 100% |
| bottom.volume | 100% |
| bottom.leg_shape | 100% |
| bottom.tucked | 100% |
| bottom.length | 100% |
| bottom.sleeve_end | 100% |
| bottom.condition | 100% |
| bottom.shows_below_outer | 100% |
| footwear.subcategory | 100% |
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
| footwear.condition | 100% |
| footwear.distressed_by_design | 100% |
| footwear.shows_below_outer | 100% |
| outerwear.color_family | 100% |
| outerwear.saturation | 100% |
| outerwear.pattern | 100% |
| outerwear.pattern_scale | 100% |
| outerwear.logo | 100% |
| outerwear.volume | 100% |
| outerwear.leg_shape | 100% |
| outerwear.hem | 100% |
| outerwear.tucked | 100% |
| outerwear.sleeve_end | 100% |
| outerwear.strain | 100% |
| outerwear.condition | 100% |
| outerwear.distressed_by_design | 100% |
| outerwear.shows_below_outer | 100% |
| outerwear.certainty | 100% |

Fields below ~80% agreement should be **advice only** (no score impact) in v1.
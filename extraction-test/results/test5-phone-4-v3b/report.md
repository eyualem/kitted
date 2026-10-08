# Extraction test report

- Photos scored: **4** (photos with fewer than 3 scored runs are left out), runs: **12**, failed runs: **0**
- **Score consistency:** 3/4 photos had every run within ±0.5 of the median = **75%** (pass bar 90%) → **FAIL**
- **Fix detection:** 0/0 = **0%** (pass bar 80%) → **NO DATA**
- Tokens used: 22,299 in / 8,326 out (multiply by your model's list price to get the test cost; divide by runs for cost per check)
- Seconds per call (API only): median **5.09**, p90 **6.88**, p95 7.49, slowest 7.49; under 5 s: 50%, under 8 s: 100%
- Seconds per call including retry waits: median 5.1, slowest 7.5
- Visible answer tokens: median 594.5, p90 942; thinking tokens median 0.0

## Propped camera vs mirror

| Method | Consistent photos | Share |
|---|---|---|
| mirror | 3/4 | 75% |

## Per photo

| Outfit | Stage | Method | File | Runs | Scores | Median | Consistent | Partial runs |
|---|---|---|---|---|---|---|---|---|
| ph1 | before | mirror | before_mirror.jpg | 3 | [4.5, 4.5, 4.5] | 4.5 | True | 0 |
| ph2 | before | mirror | before_mirror.jpg | 3 | [8.0, 8.0, 7.5] | 8.0 | True | 3 |
| ph3 | before | mirror | before_mirror.jpg | 3 | [8.5, 8.0, 8.5] | 8.5 | True | 0 |
| ph4 | before | mirror | before_mirror.jpg | 3 | [8.5, 8.5, 7.5] | 8.5 | False | 3 |

## Fix detection

| Outfit | Method | Fix | Detected | Score change (median after − before) |
|---|---|---|---|---|

## Field agreement (share of runs agreeing; lower = less reliable)

| Field | Average agreement |
|---|---|
| outerwear.subcategory | 67% |
| outerwear.length | 67% |
| top.volume | 83% |
| outerwear.condition | 83% |
| outerwear.certainty | 83% |
| top.color_family | 83% |
| top.length | 92% |
| top.sleeve_end | 92% |
| top.strain | 92% |
| top.condition | 92% |
| bottom.subcategory | 92% |
| bottom.color_family | 92% |
| bottom.saturation | 92% |
| bottom.volume | 92% |
| bottom.leg_shape | 92% |
| bottom.hem | 92% |
| bottom.distressed_by_design | 92% |
| top.subcategory | 100% |
| top.saturation | 100% |
| top.pattern | 100% |
| top.pattern_scale | 100% |
| top.logo | 100% |
| top.leg_shape | 100% |
| top.hem | 100% |
| top.tucked | 100% |
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
| bottom.condition | 100% |
| bottom.shows_below_outer | 100% |
| bottom.certainty | 100% |
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
| footwear.certainty | 100% |
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
| outerwear.distressed_by_design | 100% |
| outerwear.shows_below_outer | 100% |

Fields below ~80% agreement should be **advice only** (no score impact) in v1.
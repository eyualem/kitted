# Extraction test report

- Photos scored: **1** (photos with fewer than 3 scored runs are left out), runs: **3**, failed runs: **0**
- **Score consistency:** 1/1 photos had every run within ±0.5 of the median = **100%** (pass bar 90%) → **PASS**
- **Fix detection:** 0/0 = **0%** (pass bar 80%) → **NO DATA**
- Tokens used: 5,493 in / 6,072 out (multiply by your model's list price to get the test cost; divide by runs for cost per check)
- Seconds per call (includes retries): median **15.8**, slowest 15.8

## Propped camera vs mirror

| Method | Consistent photos | Share |
|---|---|---|
| mirror | 1/1 | 100% |

## Per photo

| Outfit | Stage | Method | File | Runs | Scores | Median | Consistent | Partial runs |
|---|---|---|---|---|---|---|---|---|
| m12 | before | mirror | before_mirror.jpg | 3 | [8.5, 9.0, 9.0] | 9.0 | True | 0 |

## Fix detection

| Outfit | Method | Fix | Detected | Score change (median after − before) |
|---|---|---|---|---|

## Field agreement (share of runs agreeing; lower = less reliable)

| Field | Average agreement |
|---|---|
| top.color_family | 67% |
| bottom.volume | 67% |
| bottom.condition | 67% |
| top.subcategory | 100% |
| top.pattern | 100% |
| top.logo | 100% |
| top.volume | 100% |
| top.leg_shape | 100% |
| top.hem | 100% |
| top.tucked | 100% |
| top.condition | 100% |
| bottom.subcategory | 100% |
| bottom.color_family | 100% |
| bottom.pattern | 100% |
| bottom.logo | 100% |
| bottom.leg_shape | 100% |
| bottom.hem | 100% |
| bottom.tucked | 100% |
| footwear.subcategory | 100% |
| footwear.color_family | 100% |
| footwear.pattern | 100% |
| footwear.logo | 100% |
| footwear.volume | 100% |
| footwear.leg_shape | 100% |
| footwear.hem | 100% |
| footwear.tucked | 100% |
| footwear.condition | 100% |
| outerwear.subcategory | 100% |
| outerwear.color_family | 100% |
| outerwear.pattern | 100% |
| outerwear.logo | 100% |
| outerwear.volume | 100% |
| outerwear.leg_shape | 100% |
| outerwear.hem | 100% |
| outerwear.tucked | 100% |
| outerwear.condition | 100% |

Fields below ~80% agreement should be **advice only** (no score impact) in v1.
# Arm comparison

| Arm | Consistent | API median | API p90 | ≤5 s | Answer tokens (median / p90) | Thinking | Cost now / 2027 | Failures | Fixes noticed |
|---|---|---|---|---|---|---|---|---|---|
| A | 50/51 (98%) | 15.48 s | 19.82 s | 0% | 761 / 934 | 1228 | 0.86¢ / 1.73¢ | 0/156 | 4/6 |
| B | 52/52 (100%) | 6.57 s | 8.7 s | 12% | 764 / 934 | 0 | 0.42¢ / 0.83¢ | 0/156 | 5/6 |
| C | 48/52 (92%) | 3.935 s | 7.3 s | 78% | 254 / 332 | 0 | 0.23¢ / 0.46¢ | 0/156 | 4/6 |
| D | 48/52 (92%) | 3.89 s | 7.28 s | 78% | 258 / 330 | 0 | 0.23¢ / 0.46¢ | 0/156 | 4/6 |

## Against the control (A)

| Arm | Photos | Mean score change | Moved ≥ 1.0 | Moved ≥ 0.5 | Readings agree |
|---|---|---|---|---|---|
| B | 51 | -0.09 | 4% | 22% | 95.3% |
| C | 51 | -0.22 | 14% | 53% | 90.4% |
| D | 51 | -0.27 | 14% | 51% | 91.0% |
| C vs D (A/A noise) | 52 | +0.06 | 0% | 23% | 97.1% |

## Lock-in verdict for C

| Rule | Result |
|---|---|
| L1 consistency ≥ 90%, ≤ 2 more inconsistent than control | **FAIL** |
| L2 mean drift within ±0.25 | PASS |
| L2 moved ≥ 1.0 on ≤ 10% and ≤ A/A + 5 points | **FAIL** |
| L3 readings agree ≥ 90% | PASS |
| L3 no key field < 80% beyond noise | **FAIL** |
| L4 fixes ≥ control − 1 | PASS |
| L5 API median ≤ 5.0 s | PASS |
| L5 API p90 ≤ 8.0 s | PASS |
| L5 answer tokens p90 ≤ 500 | PASS |
| L6 failures ≤ 1% | PASS |

- Photos moved ≥ 1.0 vs. control: [('p03', 'before', 1.0), ('p06', 'after', -1.0), ('s01', 'before', 1.0), ('s02', 'before', -1.5), ('s06', 'before', -1.5), ('s14', 'before', -1.0), ('s19', 'before', -1.0)]
- Inconsistent photos (C): ['m08', 'm09', 's17', 's25']; control: ['m10']
- Key fields under 80% agreement: [('bottom.condition', 0.7307692307692307), ('bottom.leg_shape', 0.7692307692307693), ('outerwear.condition', 0.75), ('outerwear.saturation', 0.75), ('outerwear.subcategory', 0.7916666666666666), ('top.length', 0.7959183673469388), ('top.saturation', 0.7551020408163265)] (also under 80% in the A/A repeat: none)

## Field agreement vs. control, lowest first

| Field | B | C | D | A/A |
|---|---|---|---|---|
| bottom.condition | 92% | 73% | 75% | 94% |
| outerwear.condition | 92% | 75% | 75% | 92% |
| outerwear.saturation | 88% | 75% | 75% | 100% |
| top.saturation | 98% | 76% | 76% | 100% |
| bottom.leg_shape | 83% | 77% | 83% | 94% |
| top.volume | 92% | 84% | 78% | 94% |
| outerwear.subcategory | 92% | 79% | 79% | 100% |
| top.length | 92% | 80% | 82% | 94% |
| bottom.hem | 87% | 83% | 85% | 92% |
| top.pattern_scale | 94% | 84% | 84% | 100% |
| outerwear.color_family | 84% | 92% | 92% | 96% |
| top.sleeve_end | 90% | 90% | 88% | 98% |
| footwear.subcategory | 91% | 88% | 94% | 94% |
| bottom.color_family | 96% | 90% | 94% | 92% |
| footwear.condition | 94% | 91% | 94% | 97% |
| footwear.color_family | 97% | 94% | 91% | 97% |
| outerwear.pattern_scale | 92% | 96% | 92% | 96% |
| outerwear.sleeve_end | 92% | 92% | 92% | 100% |
| outerwear.pattern | 92% | 92% | 92% | 92% |
| top.condition | 100% | 94% | 92% | 98% |
| bottom.subcategory | 96% | 92% | 92% | 96% |
| top.logo | 98% | 94% | 98% | 96% |
| top.tucked | 100% | 96% | 96% | 100% |
| top.pattern | 98% | 96% | 96% | 100% |
| top.color_family | 98% | 96% | 96% | 100% |
| outerwear.present | 100% | 96% | 96% | 100% |
| bottom.pattern | 98% | 96% | 98% | 96% |
| top.subcategory | 98% | 100% | 98% | 98% |
| scene.framing | 98% | 98% | 100% | 98% |
| scene.shoes_visible | 100% | 98% | 100% | 98% |
| footwear.present | 100% | 98% | 100% | 98% |
| top.present | 100% | 98% | 98% | 100% |
| outerwear.logo | 100% | 100% | 100% | 100% |
| bottom.present | 100% | 100% | 100% | 100% |

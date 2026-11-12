# T93 · Testing contract (strict)

Written by the session; tests written and locked by the test writer. **Locked once the Lock line is filled.** After that only the test writer changes this file or the tests, only to add or strengthen, with the reason in TASK.md → Disputes.

**Lock:** `<commit SHA>` · <date> · tests: `<path>`, `<path>`

All values below are from `extraction-test/slides_shape_paper.py` version V6 (= v16), engine run with the stated test profile (no styles given, boldness `a_little`, no second look) unless a case says otherwise. Readings: reuse `slides_shape_paper.py`'s OUTFITS readings (built from `rules_conformance.py`'s helpers `top/outer/bottom/shoe/Rd/mod` and its `SLIDES`, `CHUNKY`, `WJEANS`, `DJEANS`, `TEE`, `TROUSERS`). New Python cases go in `rules_conformance.py` (so they also reach `rulesConformance.test.ts` through `rules_conformance.json`); switch tests in a new `app/packages/kitted-core/test/slidesOnceSwitch.test.ts`.

## Criteria
- **SHO-14** · slides out of the house are charged once: a shape credit the clothes earn on their own still counts, and Shoes gets +1.0 back when one fires · how: conformance (Python + core) · test: `rules_conformance.py` › `SHO-14-street` · expect: oversized graphic tee (roominess 4) + wide jeans + slides, Everyday → overall **7.5**; Proportions 8.0 with `PR4_street_shape` +1.0; Shoes **6.0** with `SK1_slides_out` −2.5, `SK1s_slides_soft` +0.5, `SK1c_slides_shape` +1.0 · must not: 6.5 (v15) · red: fails on v15 (6.5, no PR4)
- **SHO-14** · the cargos case: an oversized tee no longer reads "roomier than its look" because of slides · test: `SHO-14-cargos` · expect: oversized tee + wide cargos + slides, Everyday → **7.0**, Proportions 7.0, `PB1_roomier_than_look` not fired, Shoes 5.0 · must not: 5.5 · red: v15 gives 5.5 with PB1 −1.5
- **SHO-14** · sneakers still win · test: `SHO-14-sneakers-win` · expect: the same tee + wide jeans with chunky sneakers → **8.0**, `SK1c_slides_shape` not fired · must not: anything but 8.0 · red: exists (guards the change)
- **SHO-14** · the drag still costs · test: `SHO-14-drag` · expect: the street outfit with jeans hem `pooling` → **7.0**, Shoes 5.5 with `SK1b_hem_drags` −0.5 · must not: 7.5
- **SHO-14** · going out · test: `SHO-14-going-out` · expect: the street outfit at Going out → **7.0** · must not: above 7.5
- **SHO-14 / OCC-3** · interview holds · test: `SHO-14-interview` · expect: the street outfit at Interview → **4.0** · must not: above 4.0
- **SHO-14** · no shape, no change · test: `SHO-14-no-shape` · expect: plain white tee + dark straight jeans + slides → **6.5**, `SK1c_slides_shape` not fired; plain tee + relaxed shorts + slides → **6.5**, `PS1_shorts_shape` not fired ([PRO-15] still needs real shoes)
- **SHO-14 / LNG** · loungewear keeps its hold · test: `SHO-14-lounge` · expect: grey hoodie + grey relaxed sweatpants + slides at Class → **6.5**, no `SK1c_slides_shape`
- **SHO-14** · never under tailoring · test: `SHO-14-blazer` · expect: navy blazer over a white tee + trousers + slides → **6.5**, Shoes **3.0**, no `SK1c_slides_shape`
- **SHO-14 / WRK-3** · clothes that read workwear, prep or smart casual are left alone · test: the existing `WRK-3-veto` and its siblings keep their exact v15 results (no edit to them)
- **PRO-17** · a hoodie over a tee with slides now earns the layer · test: flip `PRO-17-slides` · expect: zip hoodie over a tee + dark jeans + slides → **7.5**, `PR2h_hoodie_layer` +1.5 fired, Proportions 8.5, Shoes 6.0 with `SK1c_slides_shape` · must not: 7.0 · red: fails on v15. Plus `PRO-17-slides-wide`: hoodie (roominess 4) over a white tee + wide jeans + slides → **7.5** (v15: 7.0 via `PR2b_short_layer_read`)
- **STR-5** · the shape line says the truth · test: `STR-5-slides-line` · expect: in `SHO-14-street`, the `PR4_street_shape` reason line is exactly `a boxy top over wide legs: the shape carries it, even in slides`; in `SHO-14-sneakers-win` it is exactly `a boxy top over wide legs, finished by street sneakers: the streetwear shape` · must not: "street sneakers" with slides
- **Nothing else moves** · how: conformance · test: every existing case except `PRO-17-slides` keeps its exact expectation (the suite runs green with no edits to them) · and in the paper script, C1 "without slides" stays 0
- **The switch** · how: unit (core) · test: `slidesOnceSwitch.test.ts` › `SLIDES_ONCE_V16 off rolls back to v15` · expect: with `setSlidesOnceV16(false)` the street outfit scores **6.5** and the engine label is v15's; on, **7.5** and `parts-proto-16`; with `setHoodieLayerV15(false)` v14's label wins; `SLIDES_ONCE_V16` is `true` in the shipped code · red: the export doesn't exist
- **Parity** · how: parity · test: `parts.parity.test.ts` (regenerated cases, plus at least the 11 SHO-14/PRO-17 readings above added to the parity set) · expect: Python v16 and core give identical overall, raw score, part scores and reason checks/points · must not: any mismatch
- **F2.1** · same reading, same score · how: unit (core) · test: `slidesOnceSwitch.test.ts` › `F2.1 · scoring a slides reading twice gives the same result and leaves the reading untouched` · expect: deep-equal results; the reading deep-equals a copy taken before (the slides path removes the shoe on a copy, never the original)

## Not testable yet
- **The friend's photo** · why: not in `inputs/` yet · would verify it: the founder saves it with his profile; replay through `extraction-test/rescore.py` (expected about 7.5)
- **The gold set and his saved checks under v16** · not a unit test; verified by re-running `slides_shape_paper.py` (the reviewer checks its output matches `results/slides-shape/report.txt`'s V6 column)

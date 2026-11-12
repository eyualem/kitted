# T93 · Slides are charged once, on Shoes (parts v16)

**Size:** strict · **From:** `plan.md` → T93 · **Spec:** `specs.md` (F2.1; scoring rules in `rubric/v5-styles.md`) · **Lane:** Fit check and scoring · **Decisions:** DECISIONS-LOG #450 (the paper test), #452 (the founder's yes and the words)

## What changes
- **Goal:** a clean streetwear fit with slides stops losing points in five places. Slides cost once, on Shoes; the clothes are judged as if the shoes were out of the photo. An oversized graphic tee + wide jeans + slides goes 6.5 → 7.5 (chunky sneakers stay 8.0).
- **How (already written, off by default):** the three what-if knobs in `extraction-test/rubrics/parts_proto.py` (`sk1_once`, `sk1_shape_soft`, `sk1_shape_ok`), the function `_slides_once`, and the paper test `extraction-test/slides_shape_paper.py` (version "V6" = the three knobs on). v16 = `TUNE["v15"]` + `sk1_once=True, sk1_shape_soft=1.0, sk1_shape_ok=True`, and it becomes the default engine. `sk1_shape_more` stays off (V6 doesn't use it).
- **Template to follow:** the v15 port, commit `2e4bbeb9` (one switch, a rollback block in parts.json, parity and conformance regenerated, the rules doc). Do the same for v16.
- **Files:**
  - `extraction-test/rubrics/parts_proto.py`: `TUNE["v16"]`, `VERSIONS["v16"] = "parts-proto-16 (Nov 11, 2026)"`, every `engine="v15"` default → `"v16"`, the knobs off in v1–v15. The streetwear shape's reason line when the shoes are slides (or set aside by `_slides_once`): `a boxy top over wide legs: the shape carries it, even in slides` (with sneakers it keeps today's line). `SK1c_slides_shape` keeps its line `the outfit has a deliberate shape, so the slides read as a choice`. Turn the "what-if (off)" comments into v16 comments.
  - `extraction-test/rules_conformance.py`: the new cases from TESTING.md; `PRO-17-slides` flips to the new expectation.
  - `handoff/fixtures/make_parts_json.py` (+ `parts.json`, `make_parts_parity.py`, `parts_parity.json`, `make_parts_fixes.py`, `parts_fixes.json`, `rules_conformance.json`): regenerated for v16; a `rollback15` block (engine v15, label, version 1.14.0, v15's tune). parts data version 1.15.0.
  - `app/packages/kitted-core/src/parts.ts`: the TS twin of `_slides_once` and the three knobs, the new reason line, the switch `SLIDES_ONCE_V16 = true` (false → v15's numbers; with `HOODIE_LAYER_V15` or `CASUAL_FITS_V14` false the older rollback wins), `setSlidesOnceV16` for tests, exported from `index.ts`. `partsData.ts` regenerated. `app/src/features/fitcheck/scoring.ts`: the comment that lists the switches.
  - `rubric/v5-styles.md`: new **[SHO-14]** (slides charged once; the +1.0 back on Shoes; when it never applies), and edits to [STR-5] (slides can finish the shape), [PRO-17] (slides no longer block it), [SHO-2]/[SHO-13] (point to SHO-14), the case and rule counts.
- **Done means:** every criterion in TESTING.md passes; `npm run check` green; `slides_shape_paper.py` still prints "V6: ALL CHECKS PASS" (run with `KITTED_DATA=/Users/eyu/Desktop/files/Kitted`) and its "today" column, now v16 by default, reads as V6 did.
- **Must not break:** every conformance case without slides in view keeps its exact result; the parity tests stay 100%; same reading, same score (F2.1); `scoreParts` never mutates the reading; stored checks keep their scores (no migration).

## Built
- **Changed:**
- **Tests added:**
- **Screenshots:** none needed (no layout change; the new words show only in "How I scored" / the Why sheet). One Simulator shot of a slides check's Why sheet if a demo screen shows one.
- **Not done or not checked:**

## Disputes

## Review

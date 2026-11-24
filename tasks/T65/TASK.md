# T65 · The score's two picks and the plain rule names, in core

**Size:** strict · **From:** `plan.md` → T65 · **Spec:** `specs/explain-rating.md` (approved by the founder 2026-11-10) · **Lane:** Fit check and scoring (core only)

## What changes
- **Goal:** `@kitted/core` can say, from a scoring result alone, which one or two rules made the score (never the model's choice), and has a plain name for every rule the engine can charge or credit. Nothing shows yet: T58 (the chat explanation) and T66 (the quieter card) read these.
- **Files (all new, core only):**
  - `app/packages/kitted-core/src/ruleNames.ts`: `RULE_NAMES` (one entry per rule id the engine can emit, in tie-break order, each `{ plain, known? }`), `ruleName(id)`, `RULE_IDS`.
  - `app/packages/kitted-core/src/picks.ts`: `pickExplanation(result)` and `pickRecheckExplanation(before, after)`.
  - `app/packages/kitted-core/src/index.ts` (shared): two export lines, staged with `git add -p`.
  - `app/packages/kitted-core/test/picks.test.ts`, `ruleNames.test.ts` (the test writer's).
  - `tasks/T65/names.md`: the founder's review table (rule id · plain name · one line of Kit using it). Words users read (Y24).
- **No change to** `parts.ts`, `partsData.ts`, the Python engine or any fixture. Parity stays 100%.
- **Done means:** ER1.1 (the picks name only rules that fired, at most two, the biggest cost and biggest credit or the other cases) · ER1.5 (a re-check leads with the rule the fix cleared or earned) · ER1.6 (every engine rule has a plain name, a test fails on an unnamed one, no score moves).
- **Must not break:** every score and every parity case; the core's existing exports.

## Decisions this task makes (the spec leaves them open; all logged in DECISIONS-LOG)
1. **Input** is a `PartsScored` (the live engine, v16; a check scored by v15 or earlier has no `v16` block and is read with its part weights). Older rubric-v4 results are out of scope: T58 uses the code-written fallback for them.
2. **Points are score points on the shown scale.** A charge or credit in the engine's own units is multiplied by the curve's slope at the result's raw score (`v16.raw`; 1.1 under 7, 0.7 over, from `PARTS_DATA.tune.curve`), so a charge, a ceiling and a lift compare in the same unit the founder sees. For a non-v16 result the multiplier is the part's `weightsUsed`.
3. **What counts as a cost:**
   - a negative part reason not in `v16.owned` (a dealbreaker owns it), at the faults' rule: the worst part's charges at `v16_alpha` (0.5), every other part's at `v16_beta` (0.25), both times the slope;
   - the condition deduction (`v16.condDeduction`; non-v16: `condition.deduction`), id `condition`;
   - the occasion: its deduction, plus the hold when the occasion's ceiling is what held the score (`v16.heldBy === "occasion"`: `curved − final`); id `occasion`, `occasion_loungewear` when the first occasion line starts "loungewear", `occasion_hold` when the occasion has a ceiling that held the score and it is not loungewear;
   - a dealbreaker cap that held the score (`v16.heldBy` equals its id: `curved − final`; for "two sinking faults" / "two holding faults" the whole drop goes to the first sink / hold cap in `v16.caps`); a cap that did not bind costs nothing;
   - the warm-day heavy layer (`v16.heavyLayer`), id `heavy_layer`;
   - a negative taste rule (`v16.taste`).
   A part that is not in the photo has no reasons, so it never counts (F2.6). A ceiling that is not a rule (the stacking ceiling, "a fit or shape fault") is never a pick.
4. **What counts as a credit:** a lift (`v16.lifts`, size × slope, id the lift's own `L1`…), a positive taste rule, and a positive part reason that is not a lift and not `CC2s_shape_softens` (points × the part's `weightsUsed` × slope: the engine's "minor" credits).
5. **Biggest means the most points; a tie goes to the rule that comes first in `RULE_NAMES`** (the table is ordered as `rubric/v5-styles.md` orders its sections: Proportions, Fit, Color, Shoes, Style, then Condition, Occasion, lifts, dealbreakers, taste). A difference under 1e-9 is a tie.
6. **The cases** (`ExplainPicks.case`): first check: `cost_and_credit` (picks `[cost, credit]`), `cost_only` (`[cost]`), `credits_only` (the two biggest credits, or one if only one), `none` (`[]`, "no rule fired at all"). Re-check: `cleared` (the rule the fix cleared, `[cleared, biggest cost still left]` or just the cleared one), `earned` (no cost was cleared but a credit was earned: `[earned, biggest cost still left]`), `cost_now` (the score did not rise: `[biggest cost now]`); when a re-check has nothing to lead with it falls back to the first-check cases on the new result.
7. **Names:** each id has a plain name (lowercase, usable mid-sentence, no digits, no word about a face, body, weight, height, skin or hair, no all-caps, unique across the table) and, for a few, a known name ("the rule of thirds"). The table covers: every check id the parts engine can put on a reason or tip (about 74 reasons, 10 tips), the 10 lifts, 16 caps, 4 taste rules, `condition`, the three occasion ids and `heavy_layer`.

## Built
- **`ruleNames.ts`:** `RULE_NAMES` with 131 entries in tie-break order (Proportions, Fit, Color, Shoes, Style, condition, occasion, lifts, dealbreakers, taste, heavy layer), `RULE_IDS`, and `ruleName(id)` (throws on an unknown id). Beyond the Decisions' list it also names every check id in `parts.ts` that never fires in a fixture (CC5_denim_near_match, FF5_too_big, H4_standout_piece, CP1_standout_color, SW3_dainty_wide), the three condition-tip ids, all 18 caps the engine can emit, and 7 taste ids (T_shorts, T_color and T_shorts_above added). Known names only on PR1_waist_break (the rule of thirds), CP3_tonal_range (a monochrome look) and CP6_light_mid_dark (value contrast).
- **`picks.ts`:** `pickExplanation` and `pickRecheckExplanation`, read from the result alone. Costs and credits are worked out in score points as Decisions 2 to 5 say; the biggest wins, a tie (under 1e-9) goes to the rule first in `RULE_IDS`. A re-check calls a rule cleared only on a full clear (a cost before, none after) and earned only when the credit is new in after; the score not rising gives `cost_now`. A rule with no name is never picked (the coverage test is what catches a new one). Not handled, as the test writer noted: a v15 occasion hold, caps and the earned bonus.
- **`tasks/T65/names.md`:** the founder's review table, 131 rows, grouped by section (Y24).
- **Files:** `app/packages/kitted-core/src/picks.ts`, `src/ruleNames.ts`, `tasks/T65/names.md`, this file. `src/index.ts` already carried the export lines from the earlier commit; no other file touched, no score moves.
- **Checks:** the two locked files: 43 passed (38 + 5). `npx tsc --noEmit -p .` in the core package: clean. Parity suites `parts.parity`, `rubric.parity`, `partsFixes.parity`, `rulesConformance`: 648 passed. `npm run check` in `app/` is left to the session (not run here).
- **Demo screens:** none; nothing shows yet (T58 and T66 read these).
- **Not done:** the founder's OK on the names (Y24); the v15 gaps above.

## Disputes
_(none yet)_

## Review
Written by the reviewer.

### Round 1 (reviewer, strict)

**Criteria**
- ER1.1 (at most two picks, only rules that fired, biggest cost and credit, the other cases): done. The locked ER1.1 tests pass (27); picks come only from `costsOf` / `creditsOf`, which read fired reasons, lifts, caps that bound, taste, condition, occasion and the heavy layer; tips, parts not in the photo and non-rule ceilings are never read.
- ER1.5 (a re-check leads with what the fix cleared or earned): done. 11 locked tests pass; the cleared, earned and cost_now branches read as the Decisions say.
- ER1.6 (every engine rule has a plain name, no score moves): done. 5 locked tests pass (coverage over the parity and conformance fixtures, name rules, unique names). No change to `parts.ts`, `partsData.ts`, any fixture or `extraction-test/` (`git diff fe7d1b8d..HEAD --name-only` lists only core `index.ts`, `picks.ts`, `ruleNames.ts`, the two test files, `plan.md`, and `tasks/T65/`).

**Checks**
- Test lock: `git diff 3d38df1a..HEAD -- app/packages/kitted-core/test` is empty; TESTING.md's only change since is the Lock line itself. Disputes: none.
- `npx vitest run test/picks.test.ts test/ruleNames.test.ts` in the core package: `Test Files 2 passed (2), Tests 43 passed (43)`.
- `npm run check` not re-run (the build session ran it; this task is core-only and touches no screen). Parity suites were run by the builder (648 passed); no scoring file changed.
- `tasks/T65/names.md`: 131 rows, the same 131 ids as `RULE_NAMES` (none missing, none extra, no duplicates), plain names match the code table. Example lines are sensible; the only digits are one score (`6.5` on `heavy_layer`). No face, body, weight, height, skin or hair words, no emoji.

**Planted bugs (3, each reverted; `git status` clean afterwards)**
1. Re-check "did not rise" test `<=` changed to `<` in `pickRecheckExplanation`: 3 ER1.5 tests failed. Caught.
2. Heavy layer cost dropped from `costsOf`: 2 failed (ER1.1 PUFFER, ER1.5 puffer removed). Caught.
3. "Two sinking faults" fallback to the first sink cap removed: 1 failed (ER1.1 two sinking faults). Caught.
No test-defect found.

**Defects:** none open (code: none, test: none).

**Worth a later look (never blocks)**
- Founder's OK on the names (Y24) is still open; a few example lines in `names.md` sketch a tip or "possible" id (`C_unsure_*`, `SX1_tip`), which picks never name, so those rows only matter for T58's wording.
- A rule with no name is silently skipped by `biggest()` in `picks.ts` rather than failing; the ER1.6 coverage test is the only guard, so a new engine rule must get an entry the same day.
- v15 results: occasion hold, caps and the earned bonus are not read (the builder and test writer both noted it); T58 should treat a v15 check's picks as partial.
- Held amounts use `res.rawScore` (rounded to 3 places), so cap and hold points carry about 1e-3 of rounding; harmless for ordering.

**Verdict: ready.**

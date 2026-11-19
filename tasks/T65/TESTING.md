# T65 · Testing contract (strict)

Written by the session; tests written and locked by the test writer. The task's logic criteria go here, never words, labels or layout. **Locked once the Lock line is filled.** After that only the test writer changes this file or the tests, only to add or strengthen, with the reason in TASK.md → Disputes.

**Lock:** _(not locked yet)_

**Where:** core, Vitest: `app/packages/kitted-core/test/picks.test.ts` and `ruleNames.test.ts`; run from `app/packages/kitted-core` with `npx vitest run test/picks.test.ts test/ruleNames.test.ts` (this worktree's `app/node_modules` is a symlink to the main checkout's; core tests import `../src/index`). Stubs (throwing `new Error('T65: not built')`) go in `src/picks.ts` and `src/ruleNames.ts`, exported from `src/index.ts`.

**Inputs:** real engine results: `createParts(PARTS_DATA).scoreParts(reading, opts)` on the made-up readings in `app/src/__tests__/fixtures/t69-readings.json` (`T69.readings.PLAIN/BOXY/TOP9/BRIGHTS/SKINNY/TANK/PUFFER/SHORTS/LONG`, helpers in `test/t69.ts`) and `test/data` / `handoff/fixtures` readings, never a hand-built result except where a case below needs a state the engine can't be made to produce (say which). Expected values are written in the tests as literals worked out from `TASK.md` → Decisions (show the arithmetic in a comment: charge × factor × slope). Never edit a fixture.

**Interfaces (the test writer stubs these; the implementer fills them):**
```ts
export interface RuleName { plain: string; known?: string }
export const RULE_NAMES: Readonly<Record<string, RuleName>>;   // insertion order = tie-break order
export const RULE_IDS: readonly string[];                       // Object.keys(RULE_NAMES)
export function ruleName(id: string): RuleName;                 // throws on an unknown id
export type PickKind = "check" | "lift" | "cap" | "taste" | "condition" | "occasion" | "layer";
export type PickRole = "cost" | "credit" | "cleared" | "earned";
export interface RulePick { id: string; kind: PickKind; role: PickRole; points: number; plain: string; known: string | null; line: string }
export type PickCase = "cost_and_credit" | "cost_only" | "credits_only" | "none" | "cleared" | "earned" | "cost_now";
export interface ExplainPicks { case: PickCase; picks: RulePick[] }
export function pickExplanation(result: PartsScored): ExplainPicks;
export function pickRecheckExplanation(before: PartsScored, after: PartsScored): ExplainPicks;
```
`points` is positive for every pick (a cost's size or a credit's size, in score points on the shown scale). `line` is the engine's own line for the rule (a part reason's `line`, a lift's/cap's/taste's `line`, the condition's `display`, the occasion's `status`, the heavy layer's line).

## Criteria
- **ER1.1** · Kit's explanation talks about at most two rules, and every rule it names fired in `@kitted/core`'s result: the biggest cost and the biggest credit by score points, or the other cases · how: unit on `pickExplanation` over real engine results · test: `picks.test.ts` › `ER1.1 · …` · expect:
  - at most 2 picks, every pick's id is one the result fired (a part reason, tip excluded, a lift, a cap that bound, a taste rule, the condition, the occasion, the heavy layer), never a tip, never a part that is not in the photo;
  - a result with a cost and a credit → `cost_and_credit`, `[cost, credit]`, with the cost being the largest by points (one case where a charge in the worst part beats a larger raw charge in another part because of alpha/beta, one where a binding dealbreaker cap beats a part charge, one where the occasion hold wins);
  - a cost and no credit → `cost_only`; no cost, two or more credits → `credits_only` with the two largest, in order; no cost, one credit → `credits_only` with one; nothing fired (clean basics) → `none`, `picks: []`;
  - a charge a dealbreaker owns (in `v16.owned`) is never the cost; a cap that did not bind is never the cost; a ceiling that is not a rule (the stack, "a fit or shape fault") is never a pick;
  - a tie in points goes to the id that comes first in `RULE_IDS`; the same result gives the same picks every time (call twice, `toEqual`);
  - a non-v16 result (v15 engine: `createParts(partsDataFor(true, true, false))`) is read with `weightsUsed` and gives picks that fired in it;
  - must not: a pick of a part reason whose points are 0 or of the wrong sign, a pick naming a piece that is not in the photo, three picks, a pick's `points` ≤ 0.
  - red: all 27 `ER1.1` tests in `picks.test.ts` fail against the stub: 23 on `T65: not built` (pickExplanation throws), 4 tie tests (BOXY, wedding_formal, date, the hand-built nudge) on `expected -1 to be greater than or equal to 0` (RULE_IDS is empty). Engine preconditions in each test (overall, heldBy, owned, caps) pass today, so a red is never a setup fault. Checked green and biting with a throwaway reference built from the Decisions (not kept): 38/38 pass; planted bugs each fail the suite: flat 0.25 instead of alpha/beta (13 fail), an owned charge counted (2), no RULE_IDS tie-break (3), no slope (29), condition not scaled (1), minor credits not weighted (17), tips counted as reasons (12), a stack ceiling named as a cost (3), v15 ignoring weightsUsed (2).
- **ER1.5** · On a re-check, the explanation leads with the rule the fix cleared or earned · how: unit on `pickRecheckExplanation`, before/after both real engine results (the fix applied to the reading by editing the one field, e.g. tucked `"na"`/`"no"` → `"tucked"`, a hem, a color; use the same reading before and after) · test: `picks.test.ts` › `ER1.5 · …` · expect:
  - a fix that clears the biggest cost → `cleared`, `picks[0]` is that rule with `role: "cleared"` and `points` the drop in that rule's cost, `picks[1]` (when present) is the biggest cost left in `after`, role `cost`;
  - a fix that earns a credit and clears nothing → `earned`, `picks[0]` the credit with role `earned`;
  - when more than one rule changed, the biggest cleared one leads (and a tie goes to `RULE_IDS` order);
  - the score did not rise (same overall, or lower) → `cost_now`, `picks` is `[biggest cost in after]` (role `cost`), never a cleared rule; if `after` has no cost it falls back to the first-check cases on `after`;
  - the rule named first is always one `before` or `after` really fired;
  - must not: a cleared rule that still costs the same in `after`; the rule the fix cleared listed again as the "cost still left"; more than two picks.
  - red: all 11 `ER1.5` tests fail against the stub: 10 on `T65: not built`, the tie one (date, dress shoes) on `SD2_too_casual is in RULE_IDS: expected -1 >= 0`. Engine preconditions (before/after overall, heldBy) pass today. With the throwaway reference: all pass; planted bugs fail: earned/cleared order swapped (5), the "score did not rise" rule weakened (3), re-check earned branch removed (1).
- **ER1.6** · Every engine rule has a plain name in `@kitted/core`; no score changes · how: unit on `RULE_NAMES`/`ruleName` plus a coverage run through the real engine; parity suites run unchanged · test: `ruleNames.test.ts` › `ER1.6 · …` · expect:
  - **coverage (the test that fails on an unnamed rule):** run the engine (v16 and v15) over every reading in `parts_parity.json` and `rubric_parity.json` and every case in `rules_conformance.json`, across occasions (`everyday, work, date, interview, gym, home, going_out, wedding_formal`) and both seasons, and collect every check id on a part reason or tip, every condition tip check, every v16 lift id, cap id and taste id, and whether the condition, the occasion (and which of the three occasion ids) and the heavy layer fired: every one has an entry in `RULE_NAMES` (`ruleName(id)` does not throw). Also every lift id in `PARTS_DATA.v16.liftNames` and every id in `PARTS_DATA.v16.lifts` values has an entry;
  - `RULE_IDS` has at least 74 entries; `ruleName("PR1_waist_break")` is `{ plain: "the waist break", known: "the rule of thirds" }`; `ruleName("not_a_rule")` throws;
  - each plain name: non-empty, trimmed, lowercase first letter, at most 5 words, no digits, not all-caps, no emoji, and none of face, body, weight, height, skin, hair (whole words, any case), nor "unlimited" or "AI stylist"; every `known` name passes the same; **plain names are unique** across the table;
  - **no score moves:** `partsData.ts`, `parts.ts` and the Python engine are not touched (the existing `parts.parity`, `rubric.parity`, `partsFixes.parity` and `rulesConformance` suites pass unchanged, run at the end, not rewritten here);
  - must not: an unnamed id passing; a name with a digit (the only number Kit may say is the score, ER1.2).
  - red: all 5 `ER1.6` tests fail against the stub: coverage names 122 unnamed ids (first `CC1_busy`, `CC1_too_many_accents`, `CC2_bright_clash` ...; the engine fires about 123 ids: reasons, tips, condition tips, 10 lifts, caps, 5 taste ids, the heavy layer, the condition and the 3 occasion ids); RULE_IDS is 0 entries (needs 74); `ruleName("PR1_waist_break")` throws `T65: not built`; the word-rule and unique-name tests fail on the empty table (guarded by the 74-entry check so an empty table cannot pass). The checker itself was run against a throwaway table: it flags a name over 5 words (68 of them).

## Test writer's notes (how the Decisions were read where they are silent)
- **Hand-built states (3, all marked in the tests):** a tie 3.5e-10 apart and a clear gap on one lift of a real BOXY result; a 0-point reason added to a real PLAIN result. The engine cannot make either.
- **Held amounts (a cap, the occasion's hold):** `curved - ceiling`, where `v16.curved` is rounded to 3 places in the result, so those four points are checked to 2 decimals (`toBeCloseTo(x, 2)`); every other number to 9.
- **"Cleared" means the rule no longer costs in `after`** (cost in before, none in after). A rule whose cost only shrank (a slope change when the raw crosses 7, or alpha/beta moving to another worst part) is not asserted either way: TASK.md does not say. Full clears only are tested. A rule whose cost rose (PN1_narrow_leg in the date case) is tested as the cost left, never as cleared.
- **"The score did not rise" is `after.overall <= before.overall`** (the shown, half-rounded score, as TESTING.md says "same overall"): the long-top-fixed case (7 and 7) is cost_now, falls back to the first-check picks on after, and does not report the clear.
- **v15:** points = reason points x `weightsUsed[part]`, every positive reason is a credit (the v15 engine has no lifts). Tested on SKINNY, BRIGHTS and PLAIN only, where nothing else (condition, occasion) is in play; the v15 occasion hold, caps and the earned bonus are not asserted.
- **Cap and occasion ids as the engine emits them:** a cap is its own id (`S4`, `H1`), two sinking or holding faults go to the first sink or hold cap in `v16.caps`; the occasion is `occasion_loungewear` when the first occasion line starts "loungewear" (held or not), else `occasion_hold` when the occasion held the score, else `occasion`.
- **Taste ids the engine can emit (7):** `T_leg`, `T_long_top`, `T_shorts_wide`, `T_hem`, `T_shorts_above` fire in the fixtures; `T_shorts` and `T_color` are in the engine but fire in no fixture, so the coverage test cannot demand them (TASK.md says 4 taste rules; there are at least 5).
- **Fixture readings by id** (parts_parity.json): r04edfbd0f6d6, r1ac34d249d60, r60be9a1897ad, r10903dd3a948, r63e7e608ce90, rdb4aa46f2fd4, r911e85cc2c02, with the options recorded in each test. Made-up readings (T69) and rules_conformance cases for the rest.

## Not testable yet
- **Y24 (the founder OKs the names)** · why: words users read · would verify it: `tasks/T65/names.md` reviewed by the founder; T58 does not ship before.
- **The names reading like a friend** · why: taste · would verify it: the same review table.

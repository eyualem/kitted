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
  - red: _(each test's red line)_
- **ER1.5** · On a re-check, the explanation leads with the rule the fix cleared or earned · how: unit on `pickRecheckExplanation`, before/after both real engine results (the fix applied to the reading by editing the one field, e.g. tucked `"na"`/`"no"` → `"tucked"`, a hem, a color; use the same reading before and after) · test: `picks.test.ts` › `ER1.5 · …` · expect:
  - a fix that clears the biggest cost → `cleared`, `picks[0]` is that rule with `role: "cleared"` and `points` the drop in that rule's cost, `picks[1]` (when present) is the biggest cost left in `after`, role `cost`;
  - a fix that earns a credit and clears nothing → `earned`, `picks[0]` the credit with role `earned`;
  - when more than one rule changed, the biggest cleared one leads (and a tie goes to `RULE_IDS` order);
  - the score did not rise (same overall, or lower) → `cost_now`, `picks` is `[biggest cost in after]` (role `cost`), never a cleared rule; if `after` has no cost it falls back to the first-check cases on `after`;
  - the rule named first is always one `before` or `after` really fired;
  - must not: a cleared rule that still costs the same in `after`; the rule the fix cleared listed again as the "cost still left"; more than two picks.
  - red: _(each test's red line)_
- **ER1.6** · Every engine rule has a plain name in `@kitted/core`; no score changes · how: unit on `RULE_NAMES`/`ruleName` plus a coverage run through the real engine; parity suites run unchanged · test: `ruleNames.test.ts` › `ER1.6 · …` · expect:
  - **coverage (the test that fails on an unnamed rule):** run the engine (v16 and v15) over every reading in `parts_parity.json` and `rubric_parity.json` and every case in `rules_conformance.json`, across occasions (`everyday, work, date, interview, gym, home, going_out, wedding_formal`) and both seasons, and collect every check id on a part reason or tip, every condition tip check, every v16 lift id, cap id and taste id, and whether the condition, the occasion (and which of the three occasion ids) and the heavy layer fired: every one has an entry in `RULE_NAMES` (`ruleName(id)` does not throw). Also every lift id in `PARTS_DATA.v16.liftNames` and every id in `PARTS_DATA.v16.lifts` values has an entry;
  - `RULE_IDS` has at least 74 entries; `ruleName("PR1_waist_break")` is `{ plain: "the waist break", known: "the rule of thirds" }`; `ruleName("not_a_rule")` throws;
  - each plain name: non-empty, trimmed, lowercase first letter, at most 5 words, no digits, not all-caps, no emoji, and none of face, body, weight, height, skin, hair (whole words, any case), nor "unlimited" or "AI stylist"; every `known` name passes the same; **plain names are unique** across the table;
  - **no score moves:** `partsData.ts`, `parts.ts` and the Python engine are not touched (the existing `parts.parity`, `rubric.parity`, `partsFixes.parity` and `rulesConformance` suites pass unchanged, run at the end, not rewritten here);
  - must not: an unnamed id passing; a name with a digit (the only number Kit may say is the score, ER1.2).
  - red: _(each test's red line)_

## Not testable yet
- **Y24 (the founder OKs the names)** · why: words users read · would verify it: `tasks/T65/names.md` reviewed by the founder; T58 does not ship before.
- **The names reading like a friend** · why: taste · would verify it: the same review table.

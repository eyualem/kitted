# <ID> · Report

## Summary for the founder
<3–5 plain lines: what he'll see in the app, what's real and what's mocked, what wasn't checked, the verdict. No spec IDs.>

## Built (implementer)
- **Changed:** <what, in plain words>
- **Files:** `<path>`, …
- **Deviations from IMPLEMENTATION.md:** <file or step, why> (or "none")
- **Not done:** <…> (or "nothing")
- **See it:** demo screen <n> (<state>)

## Disputes
- <test name> · why it looks wrong · what it should say · settled by: <test-writer / the founder> · outcome

## Verification (verifier)
**Lock:** `git diff <lock>..HEAD` on tests and TESTING.md: <empty | the logged fixes> · banned shortcuts: <none found | list> · files outside the list: <none | list>
**Suites:** `npm run check` <green/red> · server <green/red/not touched> · parity <green/red/not touched>

### Criteria
- **F<n.n>** · <pass | fail | not verified> · proof: <test name went red then green / deliberate bug "<bug>" caught by <test> / screenshot `<path>`> · <for not verified: why, and what would verify it>

### Break it on purpose
- <the deliberate bug> → caught by `<test>` | **not caught** (weak test: sent to the test writer)

### Screens
- <state> · demo <n> · light / dark / largest text · <matches the inventory | defects: missing / extra / wrong words>

### Tried to break it
- <what was tried> → <what happened> · <covered by a test | proposed test>

### Implementer's claims
- <claim> → <confirmed | not true: why>

**Verdict:** <ready | not ready: what's left> · rounds: <n of 3>

## Design review (critic)
Only for a task with an approved `DESIGN.md`. Written after the critic's own screenshots, before it reads the sections above.
- **Round <n>** · <matches | doesn't match>
- <state> · design `design/<NN>-light.png` ↔ built `review/<NN>-<state>-light.png` · light / dark / largest text · <matches | blockers>
- **Blockers:** <kind code or design> · <where> · <what, measured> · <rule> · <fix>
- **Polish:** <…>
- **Suggestions for the founder:** <…>

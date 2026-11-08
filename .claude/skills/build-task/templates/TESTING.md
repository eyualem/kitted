# <ID> · Testing contract

Written by the planner; tests written and locked by the test writer. **Locked once the lock line below is filled.** After that only a test-writer agent changes this file or the tests, only to add or strengthen, with the reason in REPORT.md. Results never go here; they go in REPORT.md.

**Lock:** `<commit SHA>` · <date> · tests: `<path>`, `<path>`

## Criteria
One line per criterion on the task's `plan.md` line. Every test name starts with its criterion ID.
- **F<n.n>** · <the criterion, as the spec says it> · how: <unit | component | server emulator | parity | Simulator state | manual | launch bar> · test: `<file>` › `F<n.n> · <test name>` · expect: <exact value; copy word for word from the spec> · must not: <the case that must fail or be refused> · edges: <from the spec's failure table> · red: <the failure line when first run, or "exists: bites via <deliberate bug>">

## UI inventory
Every visible element, per state. Anything on screen that isn't here is a defect; anything here that isn't on screen is a defect.
### <State> · demo screen <n> · light, dark, largest text
- <element kind> · "<exact words>" · VoiceOver: "<label>" · testID `<id>`

## Not testable yet
Never dropped, never counted as pass.
- **F<n.n>** · why: <reason> · would verify it: <a to-do for the founder (Yn), a tool, a later task>

# <ID> · <task in plain words>

**From:** `plan.md` → <ID> · **Spec:** `specs/<feature>.md` (or `specs.md` → F<n>) · **Lane:** <lane>

## Goal
<One sentence: what he can do or see after this that he couldn't before.>

## Files
Only these. Anything else is a deviation the implementer writes in REPORT.md.
- `<path>`: <what changes>
- `<shared file>` (shared): <what changes>

## Interfaces
What the tests call. The test writer reads only this section.
- `<function or component>(<args>): <returns>`: <what it does, in one line>
- testIDs: `<id>` (<what it marks>)
- Demo screens: `<n>` <state> (new or existing)

## Data
<New or changed stored fields, their default, and the migration if any. "None" if none.>

## Steps
1. <step>
2. <step>

## Must not break
- <existing behaviour or test that stays as it is>

## Open questions
- <question> · <who decides: the founder (taste, words, money) or a logged default (technical)> · <default meanwhile>

# <ID> · Design: <what it is, in plain words>

<!-- The coordinator adds this line only after the founder's yes in chat: -->
**Approved by the founder:** <date> in chat

**From:** `plan.md` → <ID> · **Spec:** `specs/<feature>.md` (or `specs.md` → F<n>) → <criterion IDs> · **Frames:** `tasks/<ID>/design.html` (open with `preview_start` name `mockups`, then `http://127.0.0.1:8095/tasks/<ID>/design.html`) · **PNGs:** `tasks/<ID>/design/`

Approved, this file is the contract: the planner copies the UI inventory from it word for word, and the critic holds the build to it. It changes only with the founder's yes.

## What he sees
<One or two plain sentences.>

## Where it lives
<The screen and the card or sheet it sits in; how he gets there; how he leaves (Back, X, swipe down); what's around it.>

## States
In the order he meets them.

### <State> · when: <what triggers it> · phone <n> · `design/<NN>-light.png`, `design/<NN>-dark.png`
Top to bottom, in VoiceOver's reading order:
- <element> · `<component>` · "<exact words>" (source: spec / `en.ts` `<key>` / **NEW**) · type `<role>`, color `<token>`, spacing <pt> · VoiceOver: "<label>"[, hint "<hint>"] · tap: <what happens>
- **Motion and haptics:** <none | what, and with Reduce Motion>
- **Dark:** <anything beyond the token swap>
- **Largest text:** <how it reflows; phone <n> if drawn>

## Words
Every string he reads in this task.
- "<words>" · <spec quote / `en.ts` key / **NEW**: the founder's call; approving the design approves it>

## New parts
Components or tokens that don't exist yet, each with why the existing one doesn't do. "None" if none.

## Checked by the designer
- **HIG:** <the pages that apply, and the result>
- **§C14:** <each line: pass / not applicable / why>
- **Design system:** <only 03 tokens and components, or the new parts above>
- **Hard lines:** <no face or body, no emoji, copper only for score movement>

## Open questions for the founder
- <question> · recommended: <pick, and why> · other: <option>

## Out of scope
- <what this design deliberately doesn't cover, and which task does>

## Design check (critic)
Written by the critic, round by round.
- **Round <n>** · <matches | doesn't match> · blockers: <list or none> · polish: <list> · suggestions for the founder: <list>

## Changes
- **Round <n>** · from <critic / the founder: "his words"> · <what changed>

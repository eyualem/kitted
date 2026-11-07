# Spec templates

Two shapes: a **master spec** for a new project, and a **feature spec** for one feature on an existing project. Drop any section that doesn't apply, rather than filling it with "N/A". If the project already has a spec format (in its `CLAUDE.md` or existing specs), follow that instead and use these sections only as a checklist of what to cover.

Keep status, progress and dates of work out of a spec. A spec says what the thing *is*; where the build stands belongs in the plan.

Conventions used in both:

- Feature IDs `F1`, `F2`; acceptance criteria `F1.1`, `F1.2`. IDs are never renumbered or reused once written, so plans and tests can point at them.
- Mark anything the user did not confirm with **(assumed)**.
- Use the user's own names for things.

---

## Master spec (`SPEC.md`)

```markdown
# <Project name>

<One sentence: what it is and who it's for.>

## Goal
<Two or three sentences: the problem, for whom, and what changes for them.>

## First version
**Done when:** <one sentence a person could check>.
**Must do well:** <the one thing that makes or breaks it>.

## Users
- **Who:** <the user, concretely>
- **Not for:** <who this explicitly isn't for>

## Non-goals
Not in the first version, on purpose:
- <non-goal>
- <non-goal>

## Core flows
### <Flow name, e.g. "First check">
1. <step>
2. <step>
- **Way back:** <what cancelling or going back does>

## Features
### F1. <Feature name>
<What it does, in two or three sentences.>

**Acceptance criteria**
- F1.1 <testable statement, e.g. "Saving a link that is already saved shows 'Already saved' and keeps one copy">
- F1.2 <...>

## Data
| Thing | Fields that matter | Lives where | Related to | Kept how long |
|---|---|---|---|---|
| <User> | <...> | <device / server> | <...> | <...> |

## Failure and edge cases
| Situation | What happens | What the user sees |
|---|---|---|
| No network | <...> | "<exact words>" |
| Empty state | <...> | "<exact words>" |

**Never:** <the things that must not happen even when everything breaks>

## Interfaces
<Screens, commands or endpoints, one line each, with the main action of each. Link mockups.>

## Constraints
- **Stack:** <...>
- **Hosting:** <...>
- **Budget:** <...>
- **Existing code or rules it must fit:** <...>

## Quality
- **Speed:** <a number, e.g. "the list shows in under 1 s with 1,000 items">
- **Security and privacy:** <who sees what, what leaves the device>
- **Accessibility:** <...>

## Testing
<How each feature is checked: which criteria are automatic tests, which need a person, and on what real data.>

## Build structure
<Only if several sessions build in parallel: the independent parts, the shared pieces and their single owner, the order.>

## Assumptions
- <assumption> (why it's a reasonable default)

## Open questions
- <question> (who decides, and what it blocks)

## Later
- <idea parked for after the first version>
```

---

## Feature spec (`specs/<feature-name>.md`)

```markdown
# <Feature name>

<One sentence: what the user can do after this that they couldn't before.>

**Part of:** <link to the master spec, if there is one>

## Why
<The problem, in the user's words.>

## Scope
- **In:** <...>
- **Out (non-goals):** <...>

## What the user sees
<The flow, step by step, starting from where the user is now. Note each screen or state.>

### States
| State | When | What's shown (exact words) |
|---|---|---|
| Empty | <...> | "<...>" |
| Loading | <...> | "<...>" |
| Error | <...> | "<...>" |
| Done | <...> | "<...>" |

## Rules
<The logic, as plain statements: limits, ordering, what counts as a duplicate.>

## Data
<What is new or changed in stored data, and how it relates to what exists.>

## Acceptance criteria
- F1.1 <testable statement>
- F1.2 <...>

## Touches
<Existing files, screens or modules this changes, and anything it must not break.>

## Assumptions
## Open questions
## Later
```

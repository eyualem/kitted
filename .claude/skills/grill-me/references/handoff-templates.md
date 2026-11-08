# Handoff templates

Use these only after the spec is saved and the user asks for them. If the project already has a plan file or a `CLAUDE.md`, add to those in their existing style instead of creating new ones.

---

## PLAN.md

A plan turns the spec into tasks small enough that each one ends in something checkable. Good tasks:

- **Take under a session to build,** roughly. A task that needs "and then" in its title is usually two.
- **End in a done-check** that points at spec criteria (`F1.1`), so "done" isn't an opinion.
- **Name the files they touch,** so parallel tasks can be checked for collisions before they start.
- **Keep their ID forever.** New work gets a new ID; never renumber or reuse, because commits, notes and other tasks point at these.

Order: shared foundations first (data types, the API shape, design tokens), each with one owner; then the independent features that can run side by side; then the tasks that join them up; then a final check against every acceptance criterion.

```markdown
# Plan: <Project or feature name>

Built from: <link to the spec>

## Where things stand
<One or two lines: what is done, what is next.>

## Tasks

| ID | Task | Depends on | Done when | Files | Parallel group |
|---|---|---|---|---|---|
| T1 | <Define the data types> | - | <F1.1 and F2.1 types compile; tests in place> | <src/types.ts> | A |
| T2 | <Build the list screen> | T1 | <F1.1, F1.2 pass> | <src/screens/List.tsx> | B |
| T3 | <Build the save action> | T1 | <F2.1 passes> | <src/save.ts> | B |
| T4 | <Wire save into the list> | T2, T3 | <F1.3 passes on a phone> | <src/screens/List.tsx> | C |
| T5 | <Check every acceptance criterion> | T4 | <each F-criterion marked pass, with how it was checked> | - | D |

Tasks in the same parallel group can run at the same time; they touch different files.

## Decisions made while building
<Short, dated, with the reason. Anything that would change the spec goes back to the user first.>

## Open
<Questions that block a task, and who answers them.>
```

---

## CLAUDE.md

A short file every new session reads first. It holds lasting rules, not status. Keep it under a page: everything here costs context in every session.

```markdown
# <Project name>

<One sentence: what it is.>

## Documents
- `SPEC.md`: what we're building. Change only with the owner's yes.
- `specs/`: one file per feature.
- `PLAN.md`: the tasks and where things stand. Update after each finished task.

## How to work
1. Start by reading `PLAN.md`, then the spec for the task.
2. Write the checks from the acceptance criteria before the code.
3. If the spec seems wrong or doesn't cover something, ask; don't redesign quietly.
4. After each task: run the checks, commit, update `PLAN.md`.

## Commands
- Install: `<...>`
- Run: `<...>`
- Test: `<...>`

## Layout
- `<folder>/`: <what lives there>

## Rules
- <The project's hard lines, e.g. privacy rules, things never to do.>
- Ask before adding a dependency or spending money.
```

---

## Starting a fresh build session

Tell the user the files carry the memory, so a new session needs only:

```
Read @CLAUDE.md, @SPEC.md and @PLAN.md, then start task T1.
```

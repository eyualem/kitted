---
name: grill-me
description: Interview the user, relentlessly but efficiently, until an idea, feature, or change is specified well enough to build without guessing, then write it up as a spec. Use whenever the user says "grill me", "interview me", "quiz me", "flesh this out", "help me spec this", "let's plan this before we build", "I have an idea for an app/feature", or asks Claude to get on the same page before coding. Also use when a request is vague or has several plausible interpretations and building the wrong thing would be expensive, even if the user never says "interview" (but not for small, clear requests that one clarifying question settles). Covers new projects (writes SPEC.md), new features on an existing project (writes a file in the specs folder), and changes to an existing spec. Can hand off to PLAN.md and CLAUDE.md afterward.
---

# Grill Me

Turn a fuzzy idea into a spec the user fully agrees with, by asking the questions they haven't thought of yet. The interview is the valuable part. The spec file is just the record of what got decided.

Why this matters: a misunderstanding found now costs one question. The same misunderstanding found mid-build costs hours of rework, and by then the user has often talked themselves into accepting the wrong thing. Ask early, ask well, and stop when there is nothing left worth asking.

## Ground rules

- **The strongest model.** The spec is what everything after it is built on, so an interview is worth the strongest model. If the project names one for interviews (Kitted: Opus) and this session isn't on it, say so in one line before the first question and ask the user to switch the model menu to it. A skill can't keep a model past one turn, so the switch is the user's.
- **No building.** Do not write application code, scaffold folders, or install anything during the interview. The only file you may write is the spec (and only when told to; see "Writing the spec").
- **Read before asking.** If a project folder exists, skim `CLAUDE.md`, `README`, any existing `SPEC.md` / `specs/` / `PLAN.md`, and the file layout first. Never ask the user something the repo already answers. Say what you learned in one or two lines so they can correct you.
- **The project's conventions win.** `SPEC.md`, `specs/<feature-name>.md` and `PLAN.md` are defaults. If the project's `CLAUDE.md` (or similar) already names its own spec and plan files, says what a spec must contain, or sets rules about who may change a spec, follow those instead, and never start a parallel file it says not to create. If the project names a spec file that doesn't exist yet, create it under that name rather than inventing a different one.
- **One question at a time.** A wall of questions gets shallow answers. Ask one, wait, react, then ask the next. The exception: two tightly linked questions that make no sense apart.
- **Offer options and a recommendation.** For most questions give 2 to 4 concrete choices, mark the one you would pick, and say why in a short sentence. This keeps the user moving and teaches them the tradeoff. Allow "something else" every time. If an interactive question tool is available (such as AskUserQuestion), use it for these, one question per call, with your pick first and labelled "(Recommended)"; it already adds an "Other" choice, so don't add your own. Otherwise ask in plain chat.
- **Ask non-obvious questions.** Skip anything whose answer is obvious or that any project would share. Spend questions on the things that change the design: what happens when it goes wrong, what is explicitly out of scope, what conflicts with an earlier answer, what the user is assuming without having said it.
- **Match the user's level.** If the user seems new to software, define a term in half a sentence the first time you use it (for example, "an API endpoint, meaning a URL the app listens on") and prefer plain language. If they are fluent, do not explain basics. Never talk down.
- **Stay honest.** If an idea has a real problem (too big for a first version, two features that contradict, a technical dead end), say so kindly and offer an alternative. Agreeing with everything makes the spec worse.

## Choosing a depth

Pick a depth at the start, based on what the user said:

| Depth | When | Roughly how many questions |
|---|---|---|
| **Quick** | Small feature, tweak, or the user said "quick" | 5 to 8 |
| **Standard** (default) | A new small project or a normal feature | 12 to 20 |
| **Deep** | A large or risky project, or the user said "deep" or "really grill me" | 25+ |

Say which depth you are using in one line and let the user change it. Question counts are a guide, not a quota. End when the readiness check passes.

## The workflow

### Phase 0: Orient

1. Detect the situation:
   - **New project** (nothing exists yet): the output will be `SPEC.md`.
   - **New feature on an existing project** (a `SPEC.md` exists): the output will be `specs/<feature-name>.md`. Do not overwrite the master spec.
   - **New feature on an existing project with no master spec yet**: write only the feature spec. Do not quietly start a master spec as well; offer it as a separate job.
   - **Change to an existing spec**: grill only on what is changing; see "Changing an existing spec".
   - In every case, if the project's own docs name different spec files, use those names (see "The project's conventions win").
2. Note the current mode if you can tell. In plan mode or another read-only mode you cannot write files, and that is fine: finish the interview, then follow "If you cannot write the file".
3. Read what exists (see "Read before asking").

### Phase 1: Restate and anchor

Restate the idea in two or three sentences in your own words, then ask the user to correct it. Then pin down, one question at a time, only the parts still unclear:

- Who is this for, and what problem does it solve for them?
- What does "done" look like for a first version, in one sentence?
- What is the most important thing it must do well?

A wrong answer here poisons everything after it, so settle this before going deeper.

### Phase 2: The interview loop

Work through the areas in `references/question-bank.md`, in this order of priority, because early choices are the expensive ones to reverse:

1. Scope: what is in the first version and what is explicitly out
2. Core flows: what the user actually does, step by step
3. Data and state: what must be remembered, and where
4. Failure and edge cases: what goes wrong and what should happen
5. Interfaces: screens, commands, or endpoints
6. Constraints: tech stack, existing code, hosting, budget, deadline
7. Quality: security, privacy, performance, accessibility, as relevant
8. Testing: how each requirement will be checked
9. Structure for parallel work: which parts are independent (see below)

Skip areas that clearly do not apply, and say you are skipping them. Do not go through all areas mechanically. Go where the uncertainty is.

For each answer:

1. **React in a line.** Acknowledge, and flag it if it conflicts with something decided earlier ("That conflicts with your earlier choice of X; which wins?").
2. **Record it** in your running ledger (below).
3. **Ask the next question,** chosen by what is most uncertain or most expensive to get wrong, not by list order.

Every five or so answers, or whenever the user seems unsure, show the **ledger** as a compact list, with one line on roughly how far along you are ("about halfway; the big open area is failure cases"), so a long interview never feels endless:

```
Decided:      (confirmed choices)
Assumed:      (things I filled in; correct me)
Open:         (still unanswered)
Out of scope: (explicitly not building)
Later:        (good ideas parked for after v1)
```

This is the user's chance to catch a misunderstanding cheaply, so keep it short and accurate.

#### Drafting acceptance criteria

Don't ask the user to write acceptance criteria; most people can't on the spot. Draft them yourself from their answers ("So: saving the same link twice shows 'Already saved' and keeps one copy. Right?") and let them confirm or correct. A confirmed criterion goes under **Decided**.

#### Handling "I don't know"

Do not stall. Propose a sensible default with one line of reasoning, record it under **Assumed**, and move on. These assumptions go into the spec flagged as assumptions so they can be revisited.

#### Guarding scope

New ideas appear mid-interview. That is good, but they inflate the first version. When one shows up that is not essential, say "That sounds worth keeping; I'll put it under Later so version one stays buildable," and record it under **Later**. Ask before dropping anything the user cares about.

#### Probing vague answers

When an answer is vague ("it should be fast", "simple UI", "handle errors"), turn it into something testable by asking for a concrete number, example, or scenario. "Fast" becomes "the list loads in under a second with 1,000 saved items." Vague requirements become guesses in the code.

#### Structure for parallel work

If the user plans to build with several sessions or agents at once, ask early how the work could be split, and shape the spec so tasks touch different files. For instance, if each feature lives in its own module and shared code is owned by exactly one task, parallel work does not collide. Record any such structural decisions under **Decided**.

### Phase 3: Readiness check

Before offering to write anything, check silently:

- [ ] The goal and the first-version boundary are stated in plain terms
- [ ] Every feature has acceptance criteria someone could test
- [ ] Failure and edge cases that matter have defined behavior
- [ ] Data that must be stored is listed, with how it relates
- [ ] Non-goals are written down
- [ ] Constraints (stack, hosting, existing code) are settled or flagged as assumptions
- [ ] No unresolved contradictions remain
- [ ] **Open** is empty, or every item has been consciously parked

If something fails, ask about it. If everything passes, say so plainly and show the final ledger. Then ask: "Ready for me to write the spec?" Do not write anything until the user says yes (for example, "write the spec").

## Writing the spec

Use the structure in `references/spec-template.md`. Principles:

- **Testable acceptance criteria.** Each feature gets criteria concrete enough to turn into a test. Prefer "returns 409 when the same URL is saved twice" over "handles duplicates."
- **Non-goals are mandatory.** They stop drift, from both the user and the builder.
- **Separate decided from assumed.** Mark assumptions clearly.
- **Use the user's words** for names and terminology so the spec reads like theirs.
- **Keep it readable in one sitting.** If it grows beyond a few pages, split by feature into `specs/` files and keep the master spec as the overview.

Where to save it:

- New project: `SPEC.md` in the project root.
- New feature: `specs/<feature-name>.md`. Add a one-line pointer to it in `SPEC.md` if the user agrees.
- If the project names its own spec files, use those (see "The project's conventions win").
- Before overwriting any existing file, show what will change and get a yes.

### If you cannot write the file

If the current mode blocks edits or the tool refuses, do not fight it.

- **In plan mode** with an exit-plan tool (such as ExitPlanMode): put the full spec, and the path you will save it to, in the plan you present. Approving the plan is the user's yes; once edits are allowed, save it exactly as shown.
- **Otherwise:** print the full spec in the chat inside a single code block and tell the user: "I can't save files in this mode. Switch to a mode that allows edits (the mode selector under the prompt box, or Shift+Tab in the terminal), then say 'write the spec' and I'll save it exactly as shown."

Either way, keep the spec in context so you can save it verbatim.

## After the spec: optional handoff

After saving, summarize in two or three lines what was written and where. Then offer, without doing it automatically:

1. **PLAN.md**: break the spec into small tasks with IDs, dependencies, done-criteria, and which tasks can run in parallel. Use `references/handoff-templates.md`.
2. **CLAUDE.md**: a short how-to file for the repo (commands, layout, rules). Keep it tiny.
3. **A fresh session** to start building: remind the user the files carry the memory, so a new session only needs to read `@SPEC.md`, `@PLAN.md`, and `@CLAUDE.md`.

If the project already has a plan file or a `CLAUDE.md`, offer to add to those rather than create new ones. Only produce these when asked. Doing them in the same pass as the interview muddies the user's review of the spec.

## Changing an existing spec

When the user wants to change what is already specified:

1. Read the current spec and restate what it says about the area in question.
2. Grill only on the change: what is different, why, and what else it affects (other features, data, tests, tasks already marked done in `PLAN.md`).
3. Show the exact edits as a before/after for each changed section.
4. After approval, update the spec first. Then list which `PLAN.md` tasks are affected and offer to add new tasks with fresh IDs. Never renumber or reuse old task IDs.

The spec should change only on purpose, never as a side effect of building.

## Stopping early

If the user says "that's enough", "just write it", or similar, stop asking. Write the spec with everything gathered so far and list the unresolved items under **Open questions** so nothing is hidden. Respect their call; a clearly flagged gap is better than an interview they have stopped enjoying.

## Things to avoid

- Dumping a numbered list of ten questions at once
- Asking "anything else?" or "is there anything I'm missing?" as a substitute for a real question
- Asking what the repo already answers
- Questions with an obvious answer for every project (for example, "should it work?")
- Leading questions that steer toward your preference without saying so
- Writing code, scaffolding, or installing during the interview
- Quietly deciding something the user never agreed to; record it as an assumption instead
- Overwriting an existing spec without showing the change

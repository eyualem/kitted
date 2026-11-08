# How Kitted gets built

The whole process on one page, for the founder and for Claude. It explains and points; the exact rules live in the files it links, and **where this page and those files disagree, those files win** (then fix this page).

---

## The path, start to finish

```
  An idea
     │
     ▼
  specs.md ............ what the whole app is (written once, in an interview; your yes)
     │
     ▼
  plan.md ............. the work as tasks, grouped in lanes by the files they touch
     │
     ▼  for each lane, once
  specs/<feature>.md .. the exact behaviour and words for that part of the app
     │                  (an interview with you, ~20–30 min; carries your approval line)
     ▼  for each task in the lane
  /build-task T11
     ├─ 0. spec gate ..... is the lane's spec there and approved? if not, offers the interview
     ├─ 1. planner ....... tasks/T11/IMPLEMENTATION.md + TESTING.md (the contract)
     ├─ 2. test writer ... writes every test first, proves each fails, locks them
     ├─ 3. implementer ... writes code until the locked tests pass
     ├─ 4. verifier ...... checks the lock, plants bugs, checks every screen, tries to break it
     └─ loop ............. failures go back to 3 (code) or 2 (weak test), at most 3 rounds
     │
     ▼
  A pull request + a plain report ──► you merge ──► the task is [x] in plan.md
```

## The documents

- **`CLAUDE.md`**: The rules every session follows. *Changed by: a lasting rule from you, or a trap every session hits.*
- **`specs.md`**: What the launch app is. *Changed by: only with your yes in chat.*
- **`specs/<feature>.md`**: One part of the app in exact detail. *Changed by: written in an interview; only with your yes.*
- **`plan.md`**: Where things stand, the tasks, your to-dos. *Changed by: every session, only its own lines.*
- **`tasks/<ID>/`**: One task's plan, testing contract and report. *Changed by: `/build-task` while it runs; kept as the record.*
- **`handoff/DECISIONS-LOG.md`**: Every decision, with the reason. *Changed by: appended, never edited.*
- **`handoff/15-build-notes.md`**: How to run things, and traps already hit. *Changed by: when a trap costs real time.*
- **`WORKFLOW.md`**: This page. *Changed by: when the process changes.*

## What you do, and what runs by itself

**You:**
- Answer the interviews: the whole app once, then each feature once.
- Decide taste, words users read, money and installs (the only things a run stops to ask).
- Merge pull requests.
- Do the to-dos only you can do (photos, accounts, phone tests), listed in `plan.md`.

**Runs by itself** once you type `/build-task T11` in a session: the plan, the tests, the code, the checks, the fix loop, the report and the pull request.

**Starting things:**
- A task: open a new session and type `/build-task T11`. If its feature has no spec yet, it walks you into the interview first.
- An interview on its own: `/grill-me` and say which feature.
- Two tasks at once: two sessions, one task each (each gets its own copy of the code). Not tried yet; one at a time is the safe setting.

## How the tests stay honest

The rule: **never make a test easier so a task can pass.** Each of these makes cheating fail loudly:

1. **Separate minds.** The test writer never sees how the code will be written; the verifier never shares the implementer's reasoning.
2. **Tests first, then locked.** They're committed before any code; the verifier proves they didn't change afterwards.
3. **Red for the right reason.** Each new test fails first because the feature is missing, not because of a typo.
4. **Planted bugs.** The verifier breaks the code on purpose, once per requirement; a bug no test catches means the tests are too weak.
5. **Automatic locks.** A hook stops the implementer from editing tests or flows; a guard test fails the build on skipped or focused tests.
6. **No pass without proof.** Each requirement ends as pass (with proof), fail, or "not verified" with what would verify it. Never quietly dropped.

## When a run stops

- **A question only you can answer** (words, taste, money, an install): it asks, then carries on.
- **Its feature isn't defined yet:** it offers the interview.
- **Three rounds and still failing:** the task shows `stuck: <why>` in `plan.md`, and the report says what's left. Nothing gets loosened to get out.

## Reading plan.md

- `[ ]` to do · `[~] session name` someone's on it (or a pull request is open) · `[x] date, PR` merged · `[!] Y3` waiting on you (your to-do Y3).
- During `/build-task` a task shows its stage: `· plan`, `· tests`, `· build`, `· verify`, `· PR #n`, `· stuck`.
- A task line reads: **ID** · what it does · *what it waits on · which spec checks it must pass · which files it touches*.

## Where the exact rules live

- The coordinator: `.claude/skills/build-task/SKILL.md`
- The four agents: `.claude/agents/task-planner.md`, `test-writer.md`, `implementer.md`, `verifier.md`
- The templates: `.claude/skills/build-task/templates/`
- The test lock: `.claude/hooks/protect-tests.sh`; the guard test: `app/src/__tests__/testGuards.test.ts`
- The interviews: `.claude/skills/grill-me/SKILL.md`
- Tap-through tests: `app/e2e/flows/` (Maestro), each opening a demo screen through `app/e2e/common/open-demo.yaml`

## Words worth knowing

- **Spec:** the description of what "right" looks like, written before code. In interviews: "requirements".
- **Test oracle:** whatever tells a test the right answer. Here, the spec. Without one, a test can only check that the code does *something*.
- **Test-driven development (TDD):** write the test, watch it fail (red), write the code until it passes (green).
- **Mutation testing:** break the code on purpose to check the tests notice. It answers "are my tests any good?", which coverage numbers can't.
- **Pull request (PR):** a proposed change, reviewed before it joins the main code.
- **Worktree:** a separate copy of the code for one session, so parallel work doesn't collide.
- **Lane:** a group of tasks that share files; one session per lane at a time.
- **Subagent:** a helper Claude starts with a fresh mind and a narrow job; it works on its own and hands back a result, so it can't hold a conversation with you.

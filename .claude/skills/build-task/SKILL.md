---
name: build-task
description: Build one code task from plan.md end to end - plan, tests first, build, independent verify, with a fix loop - using four separate agents so no one checks their own work. Use when the founder says "/build-task T11", "build T11", "do the next task" or similar for a code task. Not for spec-writing tasks (those are /grill-me interviews).
argument-hint: <task ID, e.g. T11>
---

# Build a task

You are the coordinator. You don't write the plan, the tests or the code yourself: four agents do, each starting with a fresh mind. Your job is to run them in order, move each defect to the right agent, keep `plan.md` current, and hand the founder one honest report.

**Task:** $ARGUMENTS (if empty, ask which task; suggest the first unblocked code task in `plan.md` → "Next up").

**Why four agents:** the test writer never sees how the code will be written, so it can't shape tests to fit it; the implementer gets the tests as a fixed contract; the verifier comes in cold and tries to break things. Never do two of these jobs in one mind, and never do one of them yourself.

## 0. Preflight (stop and tell the founder if any fails)
- The task is on its own line in `plan.md`, and it's a **code** task. A "Write the … spec with you" task is an interview: say "That one's a spec interview: run /grill-me for it" and stop.
- Every task on its "after" list is `[x]`. Every `[!] Yn` it waits on is done.
- Its spec is precise enough: an approved `specs/<feature>.md` for its lane, or criteria in `specs.md` that already state exact behaviour and the exact words the user reads. If words the user will read aren't in any spec, stop: words are the founder's call.
- Another session hasn't claimed it (`[~]`). The tree is clean.
- Memory: `top -l 1 | grep PhysMem`; never start while another heavy job runs (CLAUDE.md rule 8).
- Work on a branch `claude/<id>-<short-name>` from main. Claim the line: `[~] <ID> · plan`, commit, push.

## 1. Plan
Run the **task-planner** agent (`subagent_type: "task-planner"`) with: the task ID, its `plan.md` line, the lane, the spec file. Wait for it.
- Open questions **for the founder** (taste, words, money, installs): ask them now, in one AskUserQuestion with your recommendation first. Write the answers into IMPLEMENTATION.md and log them in DECISIONS-LOG. Don't continue until answered.
- **Technical** open questions: accept the planner's default, note it for the log.
- Check yourself that every criterion ID on the plan line appears in TESTING.md. If one is missing, send it back.
- Commit `<ID>: plan`.

## 2. Tests
Plan line → `[~] <ID> · tests`. Run the **test-writer** agent with the task ID. Wait. Confirm the Lock line in TESTING.md has a SHA and every criterion has a red line (or a recorded bite). If any criterion came back "couldn't test properly", it goes in TESTING.md → Not testable yet with what would verify it; don't let it vanish.

## 3. Build
Plan line → `· build`. Run the **implementer** agent with the task ID (and, on later rounds, the code defects). Wait.
- A **dispute** in REPORT.md: run the test-writer with the dispute to judge it against the spec. A question the spec doesn't settle goes to the founder. Then run the implementer again.

## 4. Verify
Plan line → `· verify`. Run the **verifier** agent with the task ID. Wait.

## 5. Loop (at most 3 rounds of build and verify)
On "not ready", sort each defect:
- **code** → implementer, with the defects listed.
- **test** (a deliberate bug went uncaught, a criterion is missing a test) → test-writer, to add or strengthen only; it re-locks.
Then verify again. After round 3, stop: report what's still failing and why, and leave the line `[~] <ID> · stuck: <one line>`. Never relax a test, the inventory or a criterion to get out of the loop.

## 6. Finish
- Fill REPORT.md → Summary for the founder (plain words, what he'll see, what's real and what's mocked, what wasn't checked). Commit.
- Push. Open the PR (title `<ID>: <plain task>`; body = the summary, the verdict, the not-verified list, screenshots). Don't merge: that's the founder's yes.
- `plan.md`: the line → `[~] <ID> · PR #<n>`; one session-log line (keep 15); any new founder to-do (a "not verified" that needs him) as a Y item. DECISIONS-LOG entry for anything decided (renumber on merge if it clashes).
- Tell the founder, in plain words with screenshots: what he'll see, the verdict, what's not verified and what would check it, anything that needs him. Teach one thing worth knowing from the run. End with the 1–3 to-dos that unblock the most.

## Rules for you
- Run agents one at a time and wait for each; they share this worktree and branch. Never `isolation: worktree`.
- Pass agents file paths and IDs, not your opinions of the work.
- Don't edit app code, tests, TESTING.md or the verdict yourself. If an agent's output is broken, run it again with what was wrong.
- Spending money (a live AI test), installing anything, a new package: ask the founder first.

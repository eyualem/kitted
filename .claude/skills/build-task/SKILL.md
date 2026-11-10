---
name: build-task
description: Build one code task from plan.md end to end - design (for screens), plan, tests first, build, independent verify and design review, with a fix loop - using separate agents so no one checks their own work. Use when the founder says "/build-task T11", "build T11", "do the next task" or similar for a code task. Not for spec-writing tasks (those are /grill-me interviews).
argument-hint: <task ID, e.g. T11>
---

# Build a task

You are the coordinator. You don't write the design, the plan, the tests or the code yourself: separate agents do, each starting with a fresh mind. Your job is to run them in order, move each defect to the right agent, keep `plan.md` current, and hand the founder one honest report.

**Task:** $ARGUMENTS (if empty, ask which task; suggest the first unblocked code task in `plan.md` → "Next up").

**Why separate agents:** the test writer never sees how the code will be written, so it can't shape tests to fit it; the implementer gets the tests as a fixed contract; the verifier comes in cold and tries to break things. For a screen, the designer draws it before code and the critic, who drew and built nothing, judges both the drawing and the build. Never do two of these jobs in one mind, and never do one of them yourself.

## 0. Preflight (stop and tell the founder if any fails)
- The task is on its own line in `plan.md`, and it's a **code** task. If it's a "Write the … spec with you" task, it's the interview itself: go to **The spec gate** below and start it.
- **The spec gate.** Run it before anything else is planned or tested:
  - The task's spec is the one its lane names (`Spec:` under the lane's heading in `plan.md`), unless the task's line says `spec: specs.md` (its criteria are already exact there).
  - It passes only if that file exists, its first lines carry `**Approved by the founder:** <date>`, and every criterion ID in the task's "checks" appears in it (or in `specs.md`). `specs.md` itself counts as approved (the founder approved it in chat on Nov 7, DECISIONS-LOG #388).
  - If it fails, **don't plan, don't guess.** Tell the founder in plain words, e.g. "T11 can't start yet: the free-and-Pro part of the app isn't defined. Defining it is a back-and-forth with you, about 20–30 minutes (task T10)." Then ask in one AskUserQuestion: **Start the interview now (Recommended)** · Later.
  - **Now:** run the `grill-me` skill in this session for that feature (the founder answers here; a subagent can't hold a conversation). Tell it: the file to write (the lane's `Spec:` path), the criteria it must cover (every "checks" ID of every task in the lane), and that Kitted's rules apply (CLAUDE.md: specs before code, his yes before it's final). When he says yes, add `**Approved by the founder:** <today> in chat` under the title, mark the interview task `[~] <ID> · PR`, commit, open the PR and ask him to merge it. Once it's merged, come back to step 0 for the original task, from an updated main.
  - **Later:** mark nothing, change nothing, and say which interview is waiting.
- Every task on its "after" list is `[x]`. Every `[!] Yn` it waits on is done.
- Words the user will read that aren't in the spec are the founder's call: they come up as the planner's open questions, never as guesses.
- Another session hasn't claimed it (`[~]`). The tree is clean.
- Memory: `top -l 1 | grep PhysMem`; never start while another heavy job runs (CLAUDE.md rule 8).
- Work on a branch `claude/<id>-<short-name>` from main. Claim the line: `[~] <ID> · plan` (or `· design`, see D), commit, push.

## D. Design (only for a task that changes what he sees)
**When:** the task adds or changes anything on screen (a state, a card, a sheet, a row, words in a new place) **and** has no `tasks/<ID>/IMPLEMENTATION.md` yet. A task planned before this stage existed carries on without it, and a task that changes nothing on screen (server, scoring, tests only) skips it. If `tasks/<ID>/DESIGN.md` already carries the founder's approval line for every state the task shows, go to step 1; if it covers only some (its "Out of scope" says which), run D for the rest: new states take the next phone numbers so the approved PNGs keep theirs, and his yes rewrites the approval line's scope.
1. Plan line → `[~] <ID> · design`. Run the **ui-designer** agent (`subagent_type: "ui-designer"`) with the task ID, its `plan.md` line, the lane and the spec file. Wait.
2. Run the **ui-critic** agent with the task ID and mode `design`. Blockers go back to the designer with the critic's findings; then the critic again. At most 2 rounds; a blocker still open after that goes to the founder with the rest.
3. Show the founder. Open the frames (`preview_start` name `mockups`, then `http://127.0.0.1:8095/tasks/<ID>/design.html`) and send the PNGs. In plain words: what he'll see in each state, the NEW words, the open questions with your pick, and the critic's suggestions (optional). Ask in one AskUserQuestion: **Looks right (Recommended)** · Change something. His yes approves the NEW words too.
4. Changes: run the designer again with his words quoted (and the critic again if more than words changed), then show him again. After 3 rounds of changes, stop drawing and talk it through with him.
5. His yes: add `**Approved by the founder:** <today> in chat` under DESIGN.md's title, log the NEW words and any decision in DECISIONS-LOG, commit `<ID>: design`.
- If the design shows the spec is wrong or silent on **behaviour** (not looks), that's a spec change: ask him per CLAUDE.md before going on.

## 1. Plan
Run the **task-planner** agent (`subagent_type: "task-planner"`) with: the task ID, its `plan.md` line, the lane, the spec file, and `tasks/<ID>/DESIGN.md` if step D ran. Wait for it.
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

## 4b. Design review (only with an approved DESIGN.md)
After the verifier, unless it found the suites red or the lock broken (screenshots of a broken build waste a run): run the **ui-critic** agent with the task ID and mode `build`. Wait.
- Blockers labelled **code** join the verifier's code defects.
- Blockers labelled **design** (the approved design itself breaks a rule, or can't be built natively) go to the founder: keep the design (the implementer finds a way) or change it. A change runs the designer, then his yes, then the test writer updates the inventory's tests to the new approved words, recorded in REPORT.md → Disputes. That's the one case where a locked test's expected words may change, and only with his yes. A design change here counts as one of the 3 rounds.
- Polish goes to the implementer with the code defects if any are going anyway; it never holds the task. Suggestions go in the founder's summary.

## 5. Loop (at most 3 rounds of build and verify)
On "not ready" (or the critic's "doesn't match"), sort each defect:
- **code** → implementer, with the defects listed.
- **test** (a deliberate bug went uncaught, a criterion is missing a test) → test-writer, to add or strengthen only; it re-locks.
Then verify again (and run 4b again). After round 3, stop: report what's still failing and why, and leave the line `[~] <ID> · stuck: <one line>`. Never relax a test, the inventory, the approved design or a criterion to get out of the loop. The loop ends when the verifier says ready and, for a designed task, the critic says matches.

## 6. Finish
- Fill REPORT.md → Summary for the founder (plain words, what he'll see, what's real and what's mocked, what wasn't checked). Commit.
- Push. Open the PR (title `<ID>: <plain task>`; body = the summary, the verdict, the not-verified list, screenshots; for a designed task, each design frame next to the built screenshot, and the critic's suggestions). Don't merge: that's the founder's yes.
- `plan.md`: the line → `[~] <ID> · PR #<n>`; one session-log line (keep 15); any new founder to-do (a "not verified" that needs him) as a Y item. DECISIONS-LOG entry for anything decided (renumber on merge if it clashes).
- Tell the founder, in plain words with screenshots: what he'll see, the verdict, what's not verified and what would check it, anything that needs him. Teach one thing worth knowing from the run. End with the 1–3 to-dos that unblock the most.

## Rules for you
- Run agents one at a time and wait for each; they share this worktree and branch. Never `isolation: worktree`.
- An agent type is loaded when the session starts. If one isn't found (`ui-designer`, `ui-critic` in a session older than their files), run `general-purpose` with "Your instructions are `.claude/agents/<name>.md`; read it first and follow it exactly", plus the same task ID and paths.
- Pass agents file paths and IDs, not your opinions of the work. The critic never gets the designer's or the implementer's reasoning, only the files.
- Don't edit app code, tests, TESTING.md or the verdict yourself. If an agent's output is broken, run it again with what was wrong.
- Spending money (a live AI test), installing anything, a new package: ask the founder first.

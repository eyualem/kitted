---
name: build-task
description: Build one code task from plan.md, sized to its risk - tiny (the session alone), normal (the session builds, one quick reviewer), strict (tests first by a separate test writer, an implementer, a reviewer with planted bugs) - plus a short design pass for a brand-new screen. Use when the founder says "/build-task T11", "build T11", "do the next task" or similar for a code task. Not for spec-writing tasks (those are /grill-me interviews).
argument-hint: <task ID, e.g. T11, or several tiny ones, e.g. T61 T63>
---

# Build a task

You are the session that builds it. Checking costs time and the usage limit, so it goes where a mistake hurts a person (a wrong score, a photo leaving the phone, a 17-year-old let in), not where it only looks rough. A beta can absorb rough; TestFlight feedback catches it. The founder (Nov 10): careful, not bank-careful; a tiny task takes 10–20 minutes.

**Task:** $ARGUMENTS (if empty, ask which task; suggest the first unblocked code task in `plan.md` → "Next up"). Several tiny tasks in one lane can go together in one branch and one PR.

## 0. Preflight (stop and tell the founder if any fails)
- The task is on its own line in `plan.md`, and it's a **code** task. If it's a "Write the … spec with you" task, that's the interview: go to **The spec gate** and start it.
- **The spec gate:**
  - The task's spec is the one its lane names (`Spec:` under the lane's heading in `plan.md`), unless the task's line says `spec: specs.md`.
  - It passes if that file exists, carries `**Approved by the founder:** <date>`, and every criterion ID in the task's "checks" appears in it (or in `specs.md`). `specs.md` itself counts as approved (DECISIONS-LOG #388).
  - A **tiny** task passes the gate light: what it changes must match an approved spec. It needs no criterion IDs.
  - If it fails, don't guess. Say so in plain words ("T11 can't start yet: the free-and-Pro part of the app isn't defined; that's a 20–30 minute back-and-forth with you"), then ask in one AskUserQuestion: **Start the interview now (Recommended)** · Later. Now: run `grill-me` here for that feature (the file to write, the criteria to cover, his yes before it's final); on his yes add `**Approved by the founder:** <today> in chat` under the title, commit, open the PR, ask him to merge, then come back to step 0. Later: change nothing.
- Every task on its "after" list is `[x]`; every `[!] Yn` it waits on is done. Nobody else has claimed it (`[~]`). The tree is clean.
- Memory: `top -l 1 | grep PhysMem`; never start next to another heavy job (CLAUDE.md rule 8).
- Branch `claude/<id>-<short-name>` from main. Claim the line `[~] <ID> · build`, commit, push.

## 1. Pick the size
Say it to the founder in one plain line before any work ("Tiny: I'll fix it, test it and screenshot it myself"). His word wins. Put it on the plan line: `[~] <ID> · <size> · build`.

| | Tiny | Normal | Strict |
|---|---|---|---|
| **What** | Words, a row, a removal, a config value, a bug fix in 1–2 files | A change to an existing screen or feature with real logic; several files; the daily limits; the server | Anything touching scoring (`@kitted/core`, the Python engine), privacy (what leaves the phone, face blur, consent, wipes) or the age gate |
| **Who** | You alone | You build; one `reviewer` | `test-writer`, `implementer`, `reviewer` |
| **Target** | 10–20 min · 30–60 calls | 20–40 min · 80–150 calls | 45–75 min · 250–400 calls |
| **Record** | The PR description | `tasks/<ID>/TASK.md` | `TASK.md` + `TESTING.md` |
| **Fix rounds** | — | 1 | 2 |

- **Strict is decided by what the code touches, not by size.** A one-line change to face blur is strict.
- **Move up** when a task outgrows its size (more files than it said, a strict area turns up, or it's well past its call budget): one line to the founder, then carry on at the new size. Never move down to get out of a check.
- A **brand-new screen** (or a new flow of screens) adds step D to a normal or strict task. A change to a screen he already has is never drawn: he sees the screenshots in the PR (the founder, Nov 10).
- Words the user reads that aren't in the spec are his call, at every size: ask in one AskUserQuestion with your pick first.

## Tiny
1. Make the change. A bug fix gets one test that reproduces the bug: run it before the fix and see it fail.
2. Fast checks: `npx tsc --noEmit` in `app/` and `npx jest --findRelatedTests <changed files>`. The server tests (`npm --prefix tests run emulate` in `firebase/`) if you touched `firebase/`.
3. If something visible changed: one or two Simulator screenshots of it, light (see **Screenshots**).
4. Write the PR, and run `npm run check` in `app/` once while you do (in the background). Red means fix it before the PR opens.

## Normal
1. Write `tasks/<ID>/TASK.md` from the template: half a page, what changes, the files, the spec checks as "done means".
2. Build it. Tests for the logic you change (a rule, a state change, a limit, a server route), each named with its criterion ID. No tests for words, labels or layout, and no new Maestro flows.
3. `npm run check` in `app/`; the server tests if `firebase/` changed.
4. Screenshots of each changed screen, light and dark (the largest text too if the change is mostly text). Put the paths in TASK.md → Built, and commit (`<ID>: build`).
5. Plan line → `· review`. Run the **reviewer** (`subagent_type: "reviewer"`) with the task ID and mode `normal`. Pass paths, not your opinion of the work.
6. **One fix round** on "not ready": fix, re-run the checks it touches, and run the reviewer once more. Anything still open after that goes to the founder in the PR summary; it doesn't hold the task.

## Strict
1. Write `tasks/<ID>/TASK.md` and `tasks/<ID>/TESTING.md` from the templates. TESTING.md lists the task's logic criteria (never words, labels or layout), each with the exact expected value from the spec and the case that must be refused.
2. Plan line → `· tests`. Run the **test-writer** with the task ID. It writes those tests, shows each one failing for the right reason, and locks them. Confirm the Lock line has a SHA.
3. Run the **implementer** with the task ID. It builds until the locked tests and `npm run check` pass, and it can't edit the tests (the `protect-tests.sh` hook). A **dispute** (a test that looks wrong) goes back to the test-writer to judge against the spec; a question the spec doesn't settle goes to the founder.
4. Take the screenshots as in Normal, then plan line → `· review` and run the **reviewer** with the task ID and mode `strict`.
5. **At most 2 fix rounds.** Sort each defect: **code** → the implementer; **test** (a planted bug went uncaught) → the test-writer, to add or strengthen only. Then the reviewer again. After round 2: `[~] <ID> · stuck: <one line>` and the report says what's left. Never relax a test or a criterion to get out.

## D. A brand-new screen
Before step 1 of Normal or Strict:
1. Plan line → `· design`. Run the **ui-designer** with the task ID, its `plan.md` line and the spec file.
2. Show the founder: `preview_start` name `mockups`, then `http://127.0.0.1:8095/tasks/<ID>/design.html`, and send the PNGs. In plain words: what he'll see in each state, the NEW words, the open questions with your pick. One AskUserQuestion: **Looks right (Recommended)** · Change something.
3. Changes: run the designer again with his words quoted, then show him again. After 2 rounds, talk it through instead of drawing.
4. His yes: `**Approved by the founder:** <today> in chat` under DESIGN.md's title, the NEW words in DECISIONS-LOG, commit `<ID>: design`.
- If the drawing shows the spec is wrong or silent on **behaviour**, that's a spec change: ask him per CLAUDE.md.

## Screenshots
Metro running (`preview_start` name `kitted-web`), the main Simulator `111D0A09-C2CA-4F72-BF3C-44019A05C89D` (at most two booted, never `EF7ADF2A`). `xcrun simctl launch <udid> com.trykitted.kitted -demoScreen <n> -theme light -demoLatency 0`, then `xcrun simctl io <udid> screenshot tasks/<ID>/shots/<NN>-<state>-light.png` (tiny: `shots/<ID>/`, committed, and linked from the PR body). Largest text: `xcrun simctl ui <udid> content_size accessibility-extra-extra-extra-large`, and back to `large` after. Add a demo screen if the state has none. Shut down any Simulator you booted.

## Finish (every size)
- Push. Open the PR, titled `<ID>: <plain task>`. The body says what he'll see, what's real and what's mocked, what wasn't checked, the review's verdict (normal and strict), and the screenshots (for a designed task, each frame next to its built screen). Don't merge: that's his yes.
- `plan.md`: the line → `[~] <ID> · PR #<n>`; one session-log line (keep 15); a Y item for anything only he can check. A DECISIONS-LOG entry only if something was decided (renumber at merge if it clashes).
- Tell him in plain words with a screenshot: what he'll see, what's not checked, anything that needs him. Teach one thing worth knowing from the run.
- Note the task's rough agent calls and minutes in the PR body (`get_usage` before and after gives the 5-hour %), so the sizes can be tuned.

## Before a TestFlight build
The core flows run once on the build's code: `maestro --device <udid> test app/e2e/flows/` with Metro running (setup, a fit check, Kit, Closet, You). This is where regressions are caught, not on every task.

## Rules
- Run agents one at a time and wait for each; they share this worktree and branch. Never `isolation: worktree`.
- An agent type loads when the session starts. If the **implementer** isn't found, stop and ask the founder to restart the session: a stand-in would run without the test lock. For another agent that isn't found, run `general-purpose` with "Your instructions are `.claude/agents/<name>.md`; read it first and follow it exactly", plus the same task ID and paths.
- In a strict task, don't edit the tests, TESTING.md or the reviewer's verdict yourself.
- Spending money (a live AI test), installing anything, a new package: ask the founder first.
- A task already underway from the old workflow carries on at its size where it stands: tests already locked stay and must pass, no new UI tests get written, and the check still to come is its size's review. Its old IMPLEMENTATION.md and REPORT.md stay as its record; new notes go in its PR.

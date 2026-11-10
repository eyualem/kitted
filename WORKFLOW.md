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
     ├─ D. design ........ only if the task changes a screen:
     │     ├─ designer ... each state drawn as phone frames + tasks/T11/DESIGN.md
     │     ├─ critic ..... checks the frames against Apple's rules, §C14 and the design system
     │     └─ you ........ look at the frames: yes, or what to change
     ├─ 1. planner ....... tasks/T11/IMPLEMENTATION.md + TESTING.md (the contract; a design's
     │                     states and words become the UI inventory, word for word)
     ├─ 2. test writer ... writes every test first, proves each fails, locks them
     ├─ 3. implementer ... writes code until the locked tests pass, to the design's layout
     ├─ 4. verifier ...... checks the lock, plants bugs, checks every screen, tries to break it
     ├─ 4b. critic ....... (designed tasks) Simulator screenshots vs the approved frames
     └─ loop ............. failures go back to 3 (code) or 2 (weak test), at most 3 rounds
     │
     ▼
  A pull request + a plain report ──► you merge ──► the task is [x] in plan.md
```

**Changing the whole look** (shape, type, color, density) is a different job from designing one feature, so it has its own stage, run once before any screen is redrawn:

```
  /redesign <ID>
     ├─ your brief ......... what feels wrong, apps you like, what must stay (your words)
     ├─ art director ....... 2–3 directions, each drawn on the same three screens
     │                       (Stylist home, the result card, Closet) next to today's, with
     │                       its corner sizes, type and color rules written as numbers
     ├─ critic ............. checks each board follows its own rules, Apple's and the hard lines
     ├─ you ................ pick one (or mix): Claude recommends, you decide
     ├─ art director ....... turns the pick into a change list: every token and component
     ├─ critic ............. checks the list is complete and true to your pick
     └─ you ................ yes on the list ──► a Redesign lane of tasks in plan.md
     │
     ▼
  the lane's first task changes the tokens and 03; then each screen through /build-task
```

## The documents

- **`CLAUDE.md`**: The rules every session follows. *Changed by: a lasting rule from you, or a trap every session hits.*
- **`specs.md`**: What the launch app is. *Changed by: only with your yes in chat.*
- **`specs/<feature>.md`**: One part of the app in exact detail. *Changed by: written in an interview; only with your yes.*
- **`plan.md`**: Where things stand, the tasks, your to-dos. *Changed by: every session, only its own lines.*
- **`tasks/<ID>/`**: One task's plan, testing contract and report, plus, for a task that changes a screen, its design (`DESIGN.md`, `design.html` and the frames in `design/`). *Changed by: `/build-task` while it runs; the design only with your yes; kept as the record.*
- **`handoff/DECISIONS-LOG.md`**: Every decision, with the reason. *Changed by: appended, never edited.*
- **`handoff/15-build-notes.md`**: How to run things, and traps already hit. *Changed by: when a trap costs real time.*
- **`WORKFLOW.md`**: This page. *Changed by: when the process changes.*

## What you do, and what runs by itself

**You:**
- Answer the interviews: the whole app once, then each feature once.
- Decide taste, words users read, money and installs (the only things a run stops to ask).
- Look at a screen's frames before it's built, and say yes or what to change (5–10 min a screen).
- Merge pull requests.
- Do the to-dos only you can do (photos, accounts, phone tests), listed in `plan.md`.

**Runs by itself** once you type `/build-task T11` in a session: the design (it stops once for your look), the plan, the tests, the code, the checks, the fix loop, the report and the pull request.

**Starting things:**
- A task: open a new session and type `/build-task T11`. If its feature has no spec yet, it walks you into the interview first.
- An interview on its own: `/grill-me` and say which feature.
- A new look for the whole app: `/redesign <ID>` with the redesign's task line in `plan.md`. It asks for your brief first.
- Two tasks at once: two sessions, one task each (each gets its own copy of the code). Not tried yet; one at a time is the safe setting.

## How the tests stay honest

The rule: **never make a test easier so a task can pass.** Each of these makes cheating fail loudly:

1. **Separate minds.** The test writer never sees how the code will be written; the verifier never shares the implementer's reasoning.
2. **Tests first, then locked.** They're committed before any code; the verifier proves they didn't change afterwards.
3. **Red for the right reason.** Each new test fails first because the feature is missing, not because of a typo.
4. **Planted bugs.** The verifier breaks the code on purpose, once per requirement; a bug no test catches means the tests are too weak.
5. **Automatic locks.** A hook stops the implementer from editing tests or flows; a guard test fails the build on skipped or focused tests.
6. **No pass without proof.** Each requirement ends as pass (with proof), fail, or "not verified" with what would verify it. Never quietly dropped.

## How the screens stay right

Tests prove a screen *works*; they can't tell you it looks off. So a task that changes a screen gets two more minds:

1. **A designer before any code.** It turns the spec into every state (normal, empty, loading, error, offline, the refused case) as phone frames in the mockup's own style, with the exact words, VoiceOver labels, dark mode and the largest text size. You approve the look while a change still costs one sentence.
2. **A critic who drew nothing and built nothing.** It checks the frames against Apple's rules, §C14 and the design system before you see them. After the build it screenshots every state on the Simulator and compares each with your approved frame.
3. **The critic only blocks on rules.** A difference from your approved design, Apple's rules or §C14 blocks the task. Its own taste goes to you as optional suggestions, so the loop can't run forever on opinion.
4. **A written rubric, so "looks off" becomes something to fix.** The critic scores every screen on ten lines (hierarchy, shape consistency, density, alignment, type, color restraint, Apple's rules, accessibility, states and words, and "does this feel like a serious stylist"), counting what can be counted (corner sizes, circles, type sizes, accent uses). Each finding has a severity from 1 (cosmetic) to 4 (unusable), Nielsen's scale.
5. **The critic looks before it reads.** It writes its first impressions of the frames before it reads the designer's notes, and never gets the designer's reasoning, so it judges what's on the screen, not what was meant.
6. **The cost:** about 30–45 minutes more per screen task, plus your 5–10 minutes. A task that changes no screen skips all of it.

## When a run stops

- **A question only you can answer** (words, taste, money, an install): it asks, then carries on.
- **A design is ready for your look:** it shows you the frames and waits for your yes.
- **Redesign directions are ready:** it shows you the boards with its recommendation and waits for your pick.
- **Its feature isn't defined yet:** it offers the interview.
- **Three rounds and still failing:** the task shows `stuck: <why>` in `plan.md`, and the report says what's left. Nothing gets loosened to get out.

## Reading plan.md

- `[ ]` to do · `[~] session name` someone's on it (or a pull request is open) · `[x] date, PR` merged · `[!] Y3` waiting on you (your to-do Y3).
- During `/build-task` a task shows its stage: `· design`, `· plan`, `· tests`, `· build`, `· verify`, `· PR #n`, `· stuck`.
- A task line reads: **ID** · what it does · *what it waits on · which spec checks it must pass · which files it touches*.

## Where the exact rules live

- The coordinator: `.claude/skills/build-task/SKILL.md`
- The agents: `.claude/agents/task-planner.md`, `test-writer.md`, `implementer.md`, `verifier.md`
- The design stage: `.claude/agents/ui-designer.md` and `ui-critic.md` (the rubric and severity levels are in the critic's file); the frames start from `tools/mockshots/design-shell.sh` and are shot with `design-shot.sh`
- The whole-app redesign: `.claude/skills/redesign/SKILL.md` (the coordinator), `.claude/agents/art-director.md`, the rules a direction is built and judged by in `.claude/skills/redesign/references/visual-tone.md`, the research behind them in `.claude/skills/redesign/references/design-research.md`
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
- **Design hand-off:** the drawn, approved screen a builder works from, so nobody guesses at layout. In interviews: "the design is the spec for how it looks."
- **Design tokens:** the named values a design is built from (a corner radius, a color, a type size), kept in one file (`tokens.ts`) so changing one number restyles every screen that uses it. A redesign is mostly a token change.
- **Art direction:** deciding the look of the whole product before drawing its screens, so every designer draws in one style. In interviews: "we set the visual direction first, then the design system, then screens."
- **Independent review:** a check by someone who didn't make the thing. Authors miss their own mistakes because they see what they meant, not what's there. It's why code review, QA and design critique are separate jobs.
- **Subagent:** a helper Claude starts with a fresh mind and a narrow job; it works on its own and hands back a result, so it can't hold a conversation with you.

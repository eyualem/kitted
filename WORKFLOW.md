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
     ├─ 1. size .......... tiny, normal or strict, said in one line (your word wins)
     ├─ D. design ........ only for a brand-new screen: key states drawn, you look, yes
     │
     ├─ tiny ............. the session fixes it, a test for any bug, fast checks, a screenshot
     ├─ normal ........... the session builds + tests the logic; one reviewer reads it; 1 fix round
     └─ strict ........... test writer (tests first, locked) → implementer → reviewer who
                           plants up to 3 bugs; 2 fix rounds
     │
     ▼
  A pull request with screenshots ──► you merge ──► the task is [x] in plan.md
     │
     ▼  before each TestFlight build
  the core tap-through flows run once (setup, a fit check, Kit, Closet, You)
```

## The three sizes

Checking goes where a mistake hurts a person, not where it only looks rough. A beta can absorb rough; your friends' TestFlight feedback catches it.

| | Tiny | Normal | Strict |
|---|---|---|---|
| **For** | Words, a row, a removal, a small fix (1–2 files) | A change to a screen or feature with real logic; the daily limits; the server | Scoring, privacy (what leaves the phone, face blur, consent, wipes), the age gate |
| **Who** | The session alone | The session builds; one reviewer | Test writer, implementer, reviewer |
| **Tests** | One that reproduces any bug | The logic it changes | Written first by a separate mind, locked |
| **Target** | 10–20 min, about 2–4% of a 5-hour window | 20–40 min, about 5–10% | 45–75 min, about 15–25% |

- **Strict depends on what the code touches, not on size.** A one-line change to face blur is strict.
- **A task that outgrows its size moves up** (one line to you). It never moves down to skip a check.
- **Words, labels and layout get screenshots, not tests.** You see them in the pull request.
- **A brand-new screen adds the design step** (about 20–30 min plus your 5–10 min look).
- The targets are estimates (Nov 10, from the workflow report). Each pull request notes its rough time, so they can be tuned.

## The documents

- **`CLAUDE.md`**: The rules every session follows. *Changed by: a lasting rule from you, or a trap every session hits.*
- **`specs.md`**: What the launch app is. *Changed by: only with your yes in chat.*
- **`specs/<feature>.md`**: One part of the app in exact detail. *Changed by: written in an interview; only with your yes.*
- **`plan.md`**: Where things stand, the tasks, your to-dos. *Changed by: every session, only its own lines.*
- **`tasks/<ID>/`**: A normal or strict task's TASK.md (plan, what was built, the review), a strict task's testing contract, and a new screen's design (`DESIGN.md`, `design.html` and the frames in `design/`). A tiny task has none: its pull request is the record. *Changed by: `/build-task` while it runs; the design only with your yes; kept as the record.*
- **`handoff/DECISIONS-LOG.md`**: Every decision, with the reason. *Changed by: appended, never edited.*
- **`handoff/15-build-notes.md`**: How to run things, and traps already hit. *Changed by: when a trap costs real time.*
- **`WORKFLOW.md`**: This page. *Changed by: when the process changes.*

## What you do, and what runs by itself

**You:**
- Answer the interviews: the whole app once, then each feature once.
- Decide taste, words users read, money and installs (the only things a run stops to ask).
- Look at a brand-new screen's frames before it's built, and say yes or what to change (5–10 min a screen).
- Look at the screenshots in each pull request.
- Merge pull requests.
- Do the to-dos only you can do (photos, accounts, phone tests), listed in `plan.md`.

**Runs by itself** once you type `/build-task T11` in a session: the size, the design for a new screen (it stops once for your look), the code, the tests, the review, the fix round and the pull request. Several tiny tasks can go together: `/build-task T61 T63`.

**Starting things:**
- A task: open a new session and type `/build-task T11`. If its feature has no spec yet, it walks you into the interview first.
- An interview on its own: `/grill-me` and say which feature.
- Two tasks at once: two sessions, one task each (each gets its own copy of the code). Not tried yet; one at a time is the safe setting.

## How the tests stay honest

The rule: **never make a test easier so a task can pass.** How much proof a task needs depends on its size:

1. **A bug gets a test that reproduces it,** shown failing before the fix, at every size.
2. **A separate reviewer** (normal and strict) reads the change against the spec and looks at the screenshots. Authors miss their own mistakes because they see what they meant.
3. **Strict tests come first and are locked:** written by a test writer who never sees the code, committed before it exists, and a hook stops the implementer from editing them.
4. **Planted bugs, strict only:** the reviewer breaks the strict code on purpose (up to 3 times); a bug no test catches means the tests are too weak.
5. **A guard test** fails the build on skipped or focused tests.
6. **No pass without proof.** Anything unchecked is said plainly in the pull request, with what would check it.

## How the screens stay right

- **A brand-new screen is drawn first:** the key states (normal, plus empty or error when they look different), light only, with the new words marked for your yes. The designer checks its own frames against the hard list (44 pt hit areas, contrast, no face or body, no emoji, a way out). You approve the look while a change costs a sentence.
- **A change to a screen you already have isn't drawn.** It's built, and you see the real screenshots, light and dark, in the pull request.
- **The reviewer compares the built screens** with the screenshots (and the frames, for a new screen): something missing, extra, cut off or in the wrong words gets fixed. Spacing differences don't block.
- **TestFlight is the last check** for small rough edges.

## When a run stops

- **A question only you can answer** (words, taste, money, an install): it asks, then carries on.
- **A design is ready for your look:** it shows you the frames and waits for your yes.
- **Its feature isn't defined yet:** it offers the interview.
- **Still failing after its fix rounds** (1 for normal, 2 for strict): a normal task goes to you with what's left in the pull request; a strict one shows `stuck: <why>` in `plan.md`. Nothing gets loosened to get out.

## Reading plan.md

- `[ ]` to do · `[~] session name` someone's on it (or a pull request is open) · `[x] date, PR` merged · `[!] Y3` waiting on you (your to-do Y3).
- During `/build-task` a task shows its size and stage: `· tiny · build`, `· normal · review`, `· strict · tests`, `· design`, `· PR #n`, `· stuck`.
- A task line reads: **ID** · what it does · *what it waits on · which spec checks it must pass · which files it touches*.

## Where the exact rules live

- The skill: `.claude/skills/build-task/SKILL.md`
- The agents: `.claude/agents/reviewer.md` (normal and strict), `test-writer.md` and `implementer.md` (strict)
- The design step: `.claude/agents/ui-designer.md`; the frames start from `tools/mockshots/design-shell.sh` and are shot with `design-shot.sh`
- A new look for the whole app is a one-off stage, run only when you type `/redesign` (parked until after the beta, #420): `.claude/skills/redesign/SKILL.md`. It adds nothing to `/build-task`.
- The templates: `.claude/skills/build-task/templates/`
- The test lock: `.claude/hooks/protect-tests.sh`; the guard test: `app/src/__tests__/testGuards.test.ts`
- The interviews: `.claude/skills/grill-me/SKILL.md`
- Tap-through tests: `app/e2e/flows/` (Maestro), each opening a demo screen through `app/e2e/common/open-demo.yaml`

## Words worth knowing

- **Spec:** the description of what "right" looks like, written before code. In interviews: "requirements".
- **Test oracle:** whatever tells a test the right answer. Here, the spec. Without one, a test can only check that the code does *something*.
- **Test-driven development (TDD):** write the test, watch it fail (red), write the code until it passes (green).
- **Risk-based testing:** spending test effort in proportion to how bad a failure would be. Here: tiny, normal, strict.
- **Mutation testing:** break the code on purpose to check the tests notice. It answers "are my tests any good?", which coverage numbers can't.
- **Pull request (PR):** a proposed change, reviewed before it joins the main code.
- **Worktree:** a separate copy of the code for one session, so parallel work doesn't collide.
- **Lane:** a group of tasks that share files; one session per lane at a time.
- **Design hand-off:** the drawn, approved screen a builder works from, so nobody guesses at layout. In interviews: "the design is the spec for how it looks."
- **Independent review:** a check by someone who didn't make the thing. Authors miss their own mistakes because they see what they meant, not what's there. It's why code review, QA and design critique are separate jobs.
- **Subagent:** a helper Claude starts with a fresh mind and a narrow job; it works on its own and hands back a result, so it can't hold a conversation with you.

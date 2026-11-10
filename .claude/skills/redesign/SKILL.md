---
name: redesign
description: Run a whole-app visual redesign (shape, type, color, density) before any screen is redrawn - an art director draws 2-3 direction boards on the same three screens, an interaction designer argues against clutter, an independent critic scores them and rules on the debate, the founder picks one, then the pick becomes a token-and-component change list and a lane of build tasks. Use when the founder says "/redesign", "redesign the app", "new look", "make it look more professional/serious", or wants to change the design system itself. Not for one feature's screens (that's /build-task's design stage).
argument-hint: <task ID of the redesign line in plan.md>
---

# Redesign the look

You are the coordinator. You don't draw directions, judge them or write the change list yourself: the **art-director**, the **interaction-designer** and the **ui-critic** do, each with a fresh mind, and they argue in writing. Your job is to get the founder's brief, run them in order, show him the boards honestly with your recommendation, record his pick, and hand him one plain report.

**Task:** $ARGUMENTS (if empty, ask; the redesign needs its own line in `plan.md`, e.g. "Pick the app's new look with you").

**Why a stage of its own:** `/build-task`'s design stage draws one feature inside today's design system. A redesign changes the system itself, so it has to be decided once, on a few representative screens, before any feature is redrawn; otherwise every screen drifts its own way (`.claude/skills/redesign/references/design-research.md` §1). The three screens are the ones he sees most and that carry the brand: **Stylist home** (demo 12), **the result card** (demo 7) and **Closet** (demo 15).

## 0. Preflight (stop and tell the founder if any fails)
- The task has its line in `plan.md`, nobody has claimed it, and the tree is clean. Branch `claude/<id>-redesign` from main. Claim it: `[~] <ID> · directions`, commit, push.
- **The founder's brief, in his words** (quoted from chat, or from the session that sent you): what feels wrong, the words he or testers used, apps or brands he likes, anything he wants kept or ruled out. If it's missing a part, ask in one AskUserQuestion with a recommended answer first. Don't fill it in yourself.
- Memory: `top -l 1 | grep PhysMem`; never alongside another heavy job (CLAUDE.md rule 8). This stage boots no Simulator.

## 1. Directions
Run the **art-director** agent (`subagent_type: "art-director"`) with the task ID, mode `directions`, the brief (quoted) and the candidate directions if there are any. Wait.
- **Candidates:** if the founder (or the session that sent you) already named the directions to draw, pass them as written; the art director draws those and fills their gaps, and doesn't swap one out. The first run's are in `references/first-directions.md`: **B Tailored leads** (the founder, Nov 9: "making the cards boxier is probably a good idea"), and A Refined soft and C Editorial are drawn as contrast. It also holds the content every board uses (the result card's one number, one fix, "Explain rating", no share) and is the worked example of a candidate becoming numbers.
- **Content the founder decided** (e.g. what the result card shows) is passed with the candidates and used on every board; today's phones stay as today.
- Anyone's recommendation (yours, the parent session's) goes to the founder in step 3, never to the art director or the critic.

## 2. The debate
The same three-sided debate as `/build-task` step D, written in DIRECTION.md → Debate, one agent at a time. Each agent sees the boards and the others' written points, never their return messages or reasoning:
- **The interaction designer argues against clutter:** run **interaction-designer** with the task ID and mode `direction` (and the candidates file, for the founder's Content). It counts what's on each screen of each board against today's, says what each element is for, flags empty space with no job, and writes numbered points (I1…).
- **The art director answers:** run the art-director again to answer the debate. Each point is **accepted** (the boards change) or **kept**, with a checkable reason in one line.
- **The critic scores and rules:** run the **ui-critic** with the task ID, mode `direction` and the brief. It scores each board on its rubric, checks each board follows its own rules, and rules on every open point: **settled** by a rule it cites, or **founder's call**.
- Blockers go back to the art director with the critic's findings, then the critic again. At most 2 rounds for the whole loop; anything still open goes to the founder with the rest.

## 3. Show the founder
- Open the frames (`preview_start` name `mockups`, then `http://127.0.0.1:8095/tasks/<ID>/design.html`) and send the PNGs: today's three screens next to each direction's three, the lead first. Check that every photo drew before he sees them: a blank where a photo belongs reads to him as a design choice.
- For each direction, in plain words: what he'll see, what it fixes in his brief (with the counts from DIRECTION.md → Today, e.g. "circles on the result card: 7 → 1"), what it gives up, what it costs to build, and its founder's calls (a font to buy, dropping the copper rule, anything from 03 §1's "keep all five").
- **One short list of his calls:** the debate's open points, the open questions, and each direction's founder's calls, each with your recommended answer and one line on why.
- **Your recommendation,** ranked, with the reasons (user psychology, the competition, chance of success, build cost) and the evidence's strength from `.claude/skills/redesign/references/design-research.md`. Say plainly where it's taste and not evidence. The critic's suggestions go with it, marked optional.
- Teach one thing worth knowing (e.g. what a design token is, or why Apple's tab bar stays a capsule).
- Ask in one AskUserQuestion: each direction (your pick first, marked Recommended) · Mix or change something.
- **Mix or change:** run the art director again with his words quoted, the critic again if more than words changed, and show him again. After 3 rounds, stop drawing and talk it through with him.
- **His pick:** add `**Approved by the founder:** <today> in chat · direction <name>` under DIRECTION.md's title, log it in DECISIONS-LOG (the pick, his words, what was ruled out and why), commit `<ID>: direction`. Plan line → `[~] <ID> · changes`.

## 4. The change list
Run the **art-director** with the task ID, mode `changes`, and his pick in his words. Wait. Then the **ui-critic** with mode `changes` (at most 2 rounds). The interaction designer isn't needed here: the list changes looks, not what's on screen.

## 5. The founder's yes on the change list
- In plain words: which tokens change (the radius and type tables), which components change and which stay, which 03 sections get rewritten, what stays native, the proposed tasks in order, and the open questions with your pick.
- Ask in one AskUserQuestion: **Looks right (Recommended)** · Change something.
- His yes: add the approval line under CHANGES.md's title, add the **Redesign** lane to `plan.md` with the proposed task lines (its intro names `Direction: tasks/<ID>/DIRECTION.md` and `Changes: tasks/<ID>/CHANGES.md`), log it, commit `<ID>: change list`.
- Words he reads, money (a font license), installs (a font file, a package): each is his call, asked here, never assumed.

## 6. Finish
- Push. Open the PR (title `<ID>: the new look, picked`; the body: the brief, each direction's PNGs next to today's, his pick and his words, the change list's summary, the critic's suggestions). Don't merge: that's his yes.
- `plan.md`: the line → `[~] <ID> · PR #<n>`; one session-log line (keep 15); any to-do only he can do (a font purchase, a phone look at the new tokens) as a Y item.
- Tell him in plain words with the PNGs, and end with the 1–3 to-dos that unblock the most.

## After the pick: how the rest of the app follows
- **The first task in the Redesign lane changes the tokens** (`tokens.ts`, `typography.ts`) and rewrites 03 to the approved direction, through `/build-task` like any code task. Its tests check the token values in CHANGES.md.
- **Until that task is merged,** only tasks in the Redesign lane draw in the new direction; every other task keeps today's system, so two looks never mix in one build.
- **After it's merged,** 03 and the tokens are the new direction, and every `/build-task` design stage follows them. Screens are redrawn lane by lane through `/build-task`, each with its own designer, critic and his look at the frames.

## Rules for you
- Run agents one at a time and wait for each; they share this worktree. Never `isolation: worktree`.
- An agent type is loaded when the session starts. If `art-director`, `interaction-designer` or `ui-critic` isn't found, run `general-purpose` with "Your instructions are `.claude/agents/<name>.md`; read it first and follow it exactly", plus the same task ID, mode and brief.
- Pass agents file paths, IDs and his quoted words, never your opinion of the work. The critic never gets the art director's reasoning.
- Don't edit `specs.md`, `specs/`, 03, the mockups, tokens or app code in this stage. The change list is a plan; the lane's tasks change the files.
- Spending money, installing anything (fonts included), a new package: ask the founder first.

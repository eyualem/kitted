# T74 · The piece questions, one card at a time

**Size:** normal (started under the old workflow; its locked tests stay and must pass) · **From:** `plan.md` → T74 · **Spec:** `specs/closet-beta.md` → CB2 · **Lane:** Closet

The full plan, the locked testing contract, the approved design and the build notes are this task's old-workflow record: `IMPLEMENTATION.md`, `TESTING.md` (lock `dd92b898`, first `53331efd`), `DESIGN.md` (approved by the founder 2026-11-10; frames in `design/`), `REPORT.md` (Built, and the settled dispute).

## What changes
- **Goal:** Closet's To confirm card shows one question at a time ("1 of 5"), smaller; an answer moves to the next, Skip or a sideways swipe moves on without answering, Undo brings a card back.
- **Files:** `app/src/features/closet/toConfirm.ts` (the deck rules, no 3-at-a-time cap) · `app/src/features/closet/ConfirmDeck.tsx` (new: the deck, swipe, motion, focus) · `app/src/features/closet/DuplicateQuestion.tsx`, `FitQuestion.tsx` (an optional `deck` prop; without it, as today) · `app/src/app/(tabs)/closet/index.tsx` · `app/src/i18n/en.ts` (shared): `{n} of {total}`, `Question {n} of {total}.` · `app/src/design-system/components/KButton.tsx` (shared): `TextLink`'s `trailingIcon` · `app/src/demo/scenarios.ts`, `prepareDemoScreen.ts`: demo screens 262–264.
- **Done means:**
  - CB2.1 4 open questions and a fit question show one card, `1 of 5`.
  - CB2.2 An answer saves through the closet service, toasts with Undo, and the next card shows with the count down by one.
  - CB2.3 Undo brings that question back as the card on screen, with its old count.
  - CB2.4 A swipe or Skip shows the next card and saves nothing, wrapping at both ends; no Skip on a deck of one "Is this your …?" question.
  - CB2.5 The fit card's Skip hides it until a newer photo disagrees; a tap opens its sheet.
  - CB2.6 The last answer removes the card and the pieces move up.
  - CB2.7 Pictures at most 120 pt tall; one card shorter than today's.
  - CB2.8 VoiceOver hears `Question 2 of 5.` first; answers and Skip are buttons ≥ 44 × 44; no answer needs a swipe.
  - CB2.9 Reduce Motion: no sliding.
  - CB2.10 A question answered on the score card leaves the deck and the count updates.
- **Must not break:** the score card's question and the Added sheet (no deck, today's pictures); the Outfits fit card; every other `TextLink`; T73's Closet without Outfits; answers only through `fitCheck.answerDuplicate` / `unanswerDuplicate`.

## Built
- **Changed:** see `REPORT.md` → Built (the implementer's account).
- **Tests added:** `app/src/__tests__/closetDeck.test.tsx` (47, locked), `closetBatch287.test.ts` C2 rewritten for CB2.1 · `npm run check` (Nov 10, after main merged in, `--no-watchman --maxWorkers=2`): tsc green; lint 0 errors, 6 warnings, all in test files that came from main (`cardThresholdCard.test.tsx` 5, `tryOn.test.ts` 1); core 853/853; app `Test Suites: 3 skipped, 129 passed · Tests: 4 skipped, 1799 passed, 1803 total`.
- **Screenshots** (iPhone 17e, this branch's Metro on 8082; the 17 Pro was another session's): `tasks/T74/shots/01-one-question-light.png`, `01-one-question-dark.png` (264: 1 of 1, no Skip) · `02-fit-only-light.png`, `02-fit-only-dark.png` (263: the fit card alone, 1 of 1 with Skip; retaken in the fix round, the first pair was shot before 263's story was fixed) · `03-first-of-five-light.png`, `03-first-of-five-dark.png` (262: 1 of 5, Skip on the answers' row) · `04-third-of-five-light.png` (262 after two Skips: 3 of 5) · `05-third-answer-light.png` (262 card 4: "It's my khaki chinos", Skip on its own row) · `06-fit-card-last-light.png` (262: 5 of 5, the fit card) · `07-after-answer-light.png` (262 after "Yes, same one": 1 of 4 and "Saved as your khaki chinos." with Undo) · `08-largest-text-top-light.png`, `09-largest-text-answers-light.png` (262 at the largest text size) · `10-after-last-answer-light.png` (264 after "No, a new one": the card gone, the pieces moved up, "Kept as a new piece." with Undo; added in the fix round).
- **Fixed while taking screenshots (demo data only):** screens 262 and 263 showed no card on the Simulator: their stories' questions came from real checks whose matches depend on the photo's sampled colors, which differ on a device (the implementer's probe ran without sampling). 263 now uses screen 194's sightings (proven on the device); 262 uses screen 264's chinos check, three questions copied from it onto his other bottoms (a new demo-only step `askCopies`, as the locked C2 test builds its five; the last copy has a runner-up), then 194's sightings for the fit card. Only `app/src/demo/prepareDemoScreen.ts` changed; no app code. The copies reuse the chinos photo, so two cards ask about the navy chinos.
- **The locked flow `T74-confirm-one-card.yaml`** (iPhone 17e, Metro 8082): red as written, at three steps whose tool can't do what the step needs; the app does each by hand. Run from scratch copies with only the failing block removed (not committed), every other step is green: CB2.1, CB2.2, CB2.4 (up to the wrap), CB2.5 (the fit card's Skip and its sheet), 263 and 264 (one question, no Skip, a swipe does nothing, the answer takes the card away), 64 steps in the last run.
  - CB2.3 `tapOn: "Undo"`: Maestro's instant tap closes the toast without firing Undo (CLAUDE.md: a toast's Undo needs `duration: 0.15`). By hand with a 0.15 s press: card 1's Undo and card 2's (after a Skip) each come back word for word (`2 of 5`, the navy chinos); the closet service's log shows the `unanswer`.
  - CB2.4's last swipe (LEFT on the fit card, 5 of 5): Maestro's swipe from the short card's center scrolled Closet instead. A horizontal swipe by hand across the card wraps to `1 of 5`.
  - CB2.10 (screen 70): the score card folds to its rating (#341, October), so "Yes, same one" isn't on screen until he opens the card. By hand: opened, answered "Yes, same one", Closet then shows no question.
  - These are test defects (the flow was written without a device run). No test-writer runs at normal size, so they're left for the founder's call in the PR, not edited here.
- **Not done or not checked:** the swipe with a real finger, the haptic, what VoiceOver says and where its focus lands, and Reduce Motion's cross-fade (unit-tested; need his phone or a screen recording); a 375-pt phone; focus after the last answer on a one-grid closet (no section title to land on; `ClosetTile` takes no ref). One mid-slide frame (Skip from 1 to 2) caught the outgoing card already reading "2 of 5" and the incoming card without its pictures; it settled correctly a moment later.

## Disputes
- `closetDeck.test.tsx` › `CB2.2 · No, a new one and the runner-up chip` · expected `1 of 3` where the spec gives `1 of 4` · settled by: the test writer (the implementer was right; fixed, strengthened, re-locked at `dd92b898`) · outcome: see `REPORT.md` → Disputes

## Review
### Round 1 (reviewer, normal mode)
Read: plan line, CB2, What changes, the diff against T73's branch (app code, the locked deck test's header, demo files, no `.only`/`.skip` in `closetDeck.test.tsx`), every screenshot and the design frames; Built last. Did not re-run the Simulator, the flows or `npm run check`.

**Criteria**
- CB2.1 done (shot 03: one card, `1 of 5`; `toConfirm(open, fit)` has no cap, the screen builds it from every open question plus the fit one).
- CB2.2 done (shot 07: `1 of 4` and "Saved as your khaki chinos." with Undo; the answer still goes through `answerWithUndo`).
- CB2.3 can't tell from here: the unit tests and the by-hand run in REPORT cover it, the toast's Undo was never tapped by the flow. A 0.15 s press on the Simulator would show it.
- CB2.4 done in code (`stepDeck` wraps both ways, a lone question has no Skip and the swipe springs back; shots 01 show no Skip). The last-card swipe wrap was checked by hand only.
- CB2.5 done for the fit card at 5 of 5 (shot 06, Skip on its own row, `FIT_SKIP_KEY`). A lone fit card (`1 of 1` with Skip) is **not shown**, see defect 1.
- CB2.6 done in code (deck empties, `onEmptied`); the pieces moving up is not in a shot.
- CB2.7 done: pictures 96 x 110, the card is clearly shorter than today's (about 110 against 172 for the pictures).
- CB2.8 can't tell: labels, `Question {n} of {total}.` first, the hidden tag line, the "Skip" action and 44 pt boxes are in the code and unit-tested; what VoiceOver says needs his phone.
- CB2.9 can't tell: cross-fade is unit-tested, not seen; needs Reduce Motion on a device.
- CB2.10 done in code (`reconcileDeck` drops the key; the count follows); screen 70 was checked by hand.

**Hard lines:** nothing rates a face, body or skin; nothing new leaves the phone; no emoji, ranks or streaks; the only new words are the two spec'd ones (`{n} of {total}`, `Question {n} of {total}.`). Spec edits (Skip placement, wrapping swipe) carry the founder's yes in the log.

**Defects**
1. **Screenshots 02 are the wrong state** (`tasks/T74/shots/02-fit-only-light.png`, `02-fit-only-dark.png`). TASK.md says they show the fit card alone, `1 of 1` with Skip (screen 263). Both show Closet with no To confirm card at all (taken 8:55, before the demo fix the Built note describes). The lone fit card is a spec'd layout (CB2 item 5: "a lone fit card keeps it") and has no picture. Who: **code** (the builder retakes both from 263 and fixes the Built line).
2. **The locked flow `app/e2e/flows/T74-confirm-one-card.yaml` is red as committed** at three steps (CB2.3 Undo tap, CB2.4's last swipe, CB2.10 on screen 70), by the builder's own account. These are **test** defects (the flow was written without a device run). Normal mode has no test-writer; the builder left it for the founder's call in the PR. Not a risk to the app, but a red flow in the repo should be fixed or have those steps marked, or the next session will read it as a regression.

Neither defect shows a bug in the app. I saw no code bug: the Undo-back, answered-elsewhere, last-answer and wrap paths in `toConfirm.ts` and `ConfirmDeck.tsx` read correctly.

**Later look (never blocks)**
- Largest text (shots 08, 09): the card is taller than the screen and Skip's chevron is as large as the words; nothing is cut off, but a person scrolls inside the card's area. Fine for a beta; look again with real use.
- Mid-slide frame (Skip 1 to 2) showed the outgoing card already reading `2 of 5` and the incoming one without pictures for a moment (REPORT). Watch it on a phone.
- After the last answer on a one-grid closet, VoiceOver focus has nowhere to land (`ClosetTile` takes no ref).
- Demo 262's questions are copies on the same chinos photo, so two cards ask about the navy chinos: fine for a demo, not evidence of the matcher.
- `closetDeck.test.tsx` is 1,395 lines; the C2 rewrite in `closetBatch287.test.ts` keeps the same five-question set-up and is stronger, not weaker.

**Verdict: not ready** (two open defects: reshoot 02, and the red flow, which needs the founder's call). Nothing else blocks.

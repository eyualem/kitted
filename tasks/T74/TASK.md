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
- **Screenshots** (iPhone 17e, this branch's Metro on 8082; the 17 Pro was another session's): `tasks/T74/shots/01-one-question-light.png`, `01-one-question-dark.png` (264: 1 of 1, no Skip) · `02-fit-only-light.png`, `02-fit-only-dark.png` (263: the fit card alone, 1 of 1 with Skip) · `03-first-of-five-light.png`, `03-first-of-five-dark.png` (262: 1 of 5, Skip on the answers' row) · `04-third-of-five-light.png` (262 after two Skips: 3 of 5) · `05-third-answer-light.png` (262 card 4: "It's my khaki chinos", Skip on its own row) · `06-fit-card-last-light.png` (262: 5 of 5, the fit card) · `07-after-answer-light.png` (262 after "Yes, same one": 1 of 4 and "Saved as your khaki chinos." with Undo) · `08-largest-text-top-light.png`, `09-largest-text-answers-light.png` (262 at the largest text size).
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
Written by the reviewer.

# T113 · The style game in setup

**Spec:** `specs/style-game.md` (built on the founder's Nov 18 instruction, #489) · **Plan:** `IMPLEMENTATION.md` · **Contract:** `TESTING.md` (locked at `f5e230e8`) · **Branch:** `claude/t113-style-game`

## Built
What he sees: after Welcome, Looks is now the game. "Me or not me?" deals the 8 looks one card at a time, in a new order each game, with no look-alikes side by side. He answers with the Me / Not me buttons or by swiping past 90 pt. A tap shows the look's other outfit, and the second dot lights. Card 1 leans once after 1.4 s (not under Reduce Motion), and 8 dots show where he is. With 2 or more Me's comes "Now put them in order": this-or-thats between his Me's on their second drawings, placed by binary insertion. Then "Here's your style" shows up to 3 numbered rows. He can drag a row by its handle, remove one with × (toast "Removed {name}" with Undo, 5 s), add one from the "Add a look" sheet (on a full list it takes #3's place with "{name} in, {old} out" and Undo), tell me in his words (80 characters max), play again, or Continue to About you. Not me to all 8 shows "Nothing clicked yet". Back undoes exactly one step; on card 1 it goes to Welcome. Back from Welcome and Get started again resumes the same game. A relaunch mid-game deals a new game; a relaunch on the results reopens them from a local draft. Continue saves his looks in order, his words and his Not me's (`looks.notMe`, synced, kept after setup, wiped by Delete all my data). Nothing is sent. His picks still never move a score.

Files:
- New: `app/src/features/onboarding/styleGame.ts` (pure rules; the mockup's deal ported exactly), `styleGameSession.ts` (the game in memory, Back's history, the draft, Continue, the demo seam), `StyleGameScreen.tsx`, `GameCard.tsx`, `GameRanking.tsx`, `GameResults.tsx`, `AddLookSheet.tsx`, `app/src/app/onboarding/add-look.tsx`.
- Changed: `app/onboarding/looks.tsx` (routes the game), `app/onboarding/_layout.tsx` (`looks` with `gestureEnabled: false`; `add-look` as a form sheet, detents `[0.75, 1]`, `[1]` at accessibility sizes), `LookTile.tsx` (an optional `testID`), `basics.ts` (`NOT_ME_KEY`, `GAME_DRAFT_KEY`), `aboutStep.ts` (`finishSetup` deletes the draft and ends the game), `sync/schema.ts` (`looks.notMe` synced, `onboarding.styleGame` local), `i18n/en.ts` (one T113 block, every string marked `draft, founder to confirm (specs/style-game.md)`), `demo/scenarios.ts` and `demo/prepareDemoScreen.ts` (screen 2 becomes "Style game · card 1" on seed 42, screens 300–313 are new, and every demo screen starts with no game in memory).

Demo screens (UI inventory): 2, 300 card 3, 301 the other outfit, 302 swiped past the line, 303 put them in order, 304 three looks, 305 one look, 306 removed with Undo, 307 in and out with Undo, 308 typing his words, 309 words saved, 310 Nothing clicked yet, 311 Nothing clicked with his words, 312 Add a look, 313 every look removed.

## Deviations
- **`PickLooksScreen.tsx` is not deleted.** No route uses it any more. The T39 tests that still mount it can't be retargeted from here (see "Not done"), and deleting it now would break those tests' imports. It carries a header note: delete it together with those retargets.
- **Here's your style rides the keyboard with Keyboard events (root `paddingBottom`), not `KeyboardAvoidingView`.** The dock is still not absolutely positioned. With a `KeyboardAvoidingView` root, the one-row drag test's layout pass reached the KAV's `onLayout`, which needs a real event (`event.persist`). Padding from the keyboard's height does the same job and needs no layout pass.
- **The card's and the rows' touch handling are small controller classes** (`CardMotion` in GameCard, `RowDrag` in GameResults), made once per card or list. The React Compiler lint rejects `ref.current` inside a `useMemo`'d PanResponder. The dock's Me / Not me reach the card as a numbered `ask` prop instead of an imperative ref. Behaviour is as the plan says.
- **The interface's `GameCard` props differ** (`ask`, `width`, `onLit`, `focusOnMount`; no `ref`). Only the screen uses them.
- `notMesToSave(notMes, picks)` was added next to `notMeToSave(game, picks)`. Continue reads the Not me's from the results, so a draft reopened after a relaunch (which has no answers in memory) still saves them (SG8.1's test).

## Defaults used (for the coordinator to log as #492)
The planner's technical defaults 1–14 as written, plus:
- A draft write that fails is ignored. The game stays in memory, and a close before the next change deals a new game.
- On a full list, `addToResults` with a look already on the list returns `null` (nothing changes, no toast).
- In the ranking a tap rings the pick (2.5 pt ink) and fades the other to 0.35 over the pause. Stacked at accessibility sizes.
- VoiceOver focus moves to the new card 100 ms after an answer, and to the next row (or Add a look) 300 ms after a removal. Focus is **not** moved to `rank-title` or `results-title` on entering those stages (not built; small).
- Founder questions F1–F6: the coordinator's drafts, in `en.ts`.

## Tests
- T113, all locked: **79 / 79 pass** (`T113-styleGame` 26, `T113-styleGameSession` 23, `T113-styleGameScreens` 30). `T39-setupScreens.test.tsx` passes in full, its locked F1.1 test included. The tests TESTING.md expected to stay red until T94 are green: T94's app commit is in this branch.
- Retired: none by me. The two OS3.3 tests, and OS3.1, OS3.2, OS4.5, `T39-offerCard` OS5.7 and `looksOwnWords`, still mount the old grid and still pass against it. See "Not done".

## Not done (needs the coordinator: the test lock refuses these edits from the implementer)
The protect-tests hook blocks every edit under `app/src/__tests__/` and `app/e2e/`. The retargets that IMPLEMENTATION.md and TESTING.md give to the implementer therefore couldn't be made:
1. `scenarios.test.ts`: the before-onboarding list must become `[1, 2, 3, 4, 130…137, 300…313]`. **Red now** (1 test).
2. `toast.test.ts` › U3: its EXPECTED table needs three entries, all 5 s (`false`), per default 11: `'features/onboarding/GameResults.tsx · game.results.removed'`, `'features/onboarding/AddLookSheet.tsx · game.results.swapped'`, and the demo seam `'features/onboarding/styleGameSession.ts · last.text'`. **Red now** (1 test). This retarget was missing from TESTING.md's list.
3. `T39-setupScreens.test.tsx`: OS3.1, OS3.2 and OS4.5 should mount `StyleGameScreen` (OS3.1: `game-title` = `Me or not me?`), and the two OS3.3 tests should be retired (superseded by SG1–SG7; the spec's "Changes to other specs"). `T39-offerCard.test.tsx` › `walkToCard` should play the game. `looksOwnWords.test.tsx` should move to `results-words-link` and `results-words-input`. Then delete `PickLooksScreen.tsx`.
4. Flows: `T39-setup-later.yaml`, `T39-setup-not-now.yaml` and `T39-under-18.yaml` should use `runFlow: ../common/play-style-game.yaml`, and `T39-screens.yaml`'s screen 2 block should assert `Me or not me\?`. As they stand they tap a tile that no longer exists, so they would fail on the phone.

## Not seen on iOS
Nothing has run on the Simulator: no Metro on 8082, no Maestro flows (`T113-style-game.yaml`, `T39-setup-fresh.yaml`), no screenshots (light, dark, AX5) and no VoiceOver pass. The lean, the swipe and drag feel, the haptics, the form sheet's detents, the keyboard padding on results, and the held toast on demo screens 306/307 are untested on a device. This is the verifier's step, then the founder's phone to-do (TESTING.md → Not testable yet).

## Disputes
None about the tests' content. The blocked retargets above are a process conflict (the plan gives them to the implementer; the hook refuses them), not a disagreement with any test.

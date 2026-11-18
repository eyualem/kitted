# T113 · The style game in setup

**Spec:** `specs/style-game.md` (built on the founder's Nov 18 instruction, #489) · **Plan:** `IMPLEMENTATION.md` · **Contract:** `TESTING.md` (locked at `f5e230e8`) · **Branch:** `claude/t113-style-game`

## Built
What he sees: after Welcome, Looks is now the game. "Me or not me?" deals the 8 looks one card at a time, in a new order each game, with no look-alikes side by side. He answers with the Me / Not me buttons or by swiping past 90 pt. A tap shows the look's other outfit, and the second dot lights. Card 1 leans once after 1.4 s (not under Reduce Motion), and 8 dots show where he is. With 2 or more Me's comes "Now put them in order": this-or-thats between his Me's on their second drawings, placed by binary insertion. Then "Here's your style" shows up to 3 numbered rows. He can drag a row by its handle, remove one with × (toast "Removed {name}" with Undo, 5 s), add one from the "Add a look" sheet (on a full list it takes #3's place with "{name} in, {old} out" and Undo), tell me in his words (80 characters max), play again, or Continue to About you. Not me to all 8 shows "Nothing clicked yet". Back undoes exactly one step; on card 1 it goes to Welcome. Back from Welcome and Get started again resumes the same game. A relaunch mid-game deals a new game; a relaunch on the results reopens them from a local draft. Continue saves his looks in order, his words and his Not me's (`looks.notMe`, synced, kept after setup, wiped by Delete all my data). Nothing is sent. His picks still never move a score.

Files:
- New: `app/src/features/onboarding/styleGame.ts` (pure rules; the mockup's deal ported exactly), `styleGameSession.ts` (the game in memory, Back's history, the draft, Continue, the demo seam), `StyleGameScreen.tsx`, `GameCard.tsx`, `GameRanking.tsx`, `GameResults.tsx`, `AddLookSheet.tsx`, `app/src/app/onboarding/add-look.tsx`.
- Deleted: `features/onboarding/PickLooksScreen.tsx` (the grid; nothing else used only it: `togglePick` and `LookTile` stay for You, and the `onb.looks.*` words stay, as planned).
- Changed: `app/onboarding/looks.tsx` (routes the game), `app/onboarding/_layout.tsx` (`looks` with `gestureEnabled: false`; `add-look` as a form sheet, detents `[0.75, 1]`, `[1]` at accessibility sizes), `LookTile.tsx` (an optional `testID`), `basics.ts` (`NOT_ME_KEY`, `GAME_DRAFT_KEY`), `aboutStep.ts` (`finishSetup` deletes the draft and ends the game), `sync/schema.ts` (`looks.notMe` synced, `onboarding.styleGame` local), `i18n/en.ts` (one T113 block, every string marked `draft, founder to confirm (specs/style-game.md)`), `demo/scenarios.ts` and `demo/prepareDemoScreen.ts` (screen 2 becomes "Style game · card 1" on seed 42, screens 300–313 are new, and every demo screen starts with no game in memory).

Demo screens (UI inventory): 2, 300 card 3, 301 the other outfit, 302 swiped past the line, 303 put them in order, 304 three looks, 305 one look, 306 removed with Undo, 307 in and out with Undo, 308 typing his words, 309 words saved, 310 Nothing clicked yet, 311 Nothing clicked with his words, 312 Add a look, 313 every look removed.

## Deviations
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
- Retargets: the test writer retargeted the old setup tests to the game and re-locked (`8b0cbd52`, Lock line `02071c80`): T39-setupScreens (OS3.1, OS3.2, OS4.5; OS3.3 retired), T39-offerCard OS5.7, looksOwnWords, scenarios, toast U3 and the four T39 flows. After the grid's deletion: tsc clean, eslint clean on the changed folders, and 14 affected files (T113 ×3, T39-*, looksOwnWords, scenarios, toast, syncSchema, privacyWipe, onboardingLooks) **172 / 172 pass** with two workers. A first run with default workers had 2 failures in T39-offerCard and T39-styleProfile (messages not captured); both files pass alone and in the rerun, so most likely timing under load, not verified.

## Not seen on iOS
Nothing has run on the Simulator: no Metro on 8082, no Maestro flows (`T113-style-game.yaml`, `T39-setup-fresh.yaml`), no screenshots (light, dark, AX5) and no VoiceOver pass. The lean, the swipe and drag feel, the haptics, the form sheet's detents, the keyboard padding on results, and the held toast on demo screens 306/307 are untested on a device. This is the verifier's step, then the founder's phone to-do (TESTING.md → Not testable yet).

## Disputes
None. (The retargets the plan gave the implementer were refused by the test lock; the test writer made them in `8b0cbd52`.)
- **Re-lock (test writer, Nov 18):** the retargets the test lock refused the implementer were made by the test writer and locked at `8b0cbd52`: T39 OS3.1, OS3.2, OS4.5, OS5.7, looksOwnWords, scenarios, toast U3 and the four flows retargeted, and the two OS3.3 tests retired (TESTING.md → The tests that change). `PickLooksScreen.tsx` was then deleted by the implementer. The flows have not been run on the Simulator.

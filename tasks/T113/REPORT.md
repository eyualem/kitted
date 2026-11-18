# T113 report

## Verification, round 1: **not ready**
*Written by the verifier (its report, recorded here by the coordinator because the subagent hook refused the verifier's own write). Screenshots: commit `4e8e2175`, `tasks/T113/shots/` (48 files).*

The game works on iOS, and every flow T113 touches passes. Not ready because 2 planted bugs went uncaught (test), 5 code defects (one fails SG9.1, one breaks FS1's wording, three are double-tap or Back races), and the default-worker jest run times out (test).

### How iOS was seen
The installed app is a Release build with an embedded bundle, so Metro never reaches it (a first try with Metro on 8083 showed the old grid and wasn't counted). `NODE_ENV=production npx expo export:embed`, then `hermesc`; the result swapped into a **copy** of `Kitted.app`, `codesign --sign -`, installed (bundle sha1 `d1ced48b…` matched the export; `@kitted/core` pointed at this worktree's core). Afterwards the original was reinstalled (sha1 `9f99e012…`, as before), the text size reset to `large`, and the Simulator shut down. Old flows that failed were rerun on a baseline bundle built the same way from `3a804abe` (pre-T113, with T94's app commit).

### Lock and hygiene
- Lock holds: `git diff 8b0cbd52..HEAD` over tests, e2e and testing is empty; TESTING.md differs only in its Lock line (`02071c80`, recorded in TASK.md → Disputes). `git diff f5e230e8..HEAD` over the first-lock files is empty.
- No `.only`, `.skip`, `xit`, `todo`, snapshots, test checks or fixture edits. Every changed file is in IMPLEMENTATION.md → Files or TASK.md → Deviations.

### Suites
- Typecheck and lint: app and core typecheck clean; `expo lint` 0 errors.
- Core vitest: 27 failed of 912. 19 are T94's `tailored.test.ts` (inherited); 8 timed out at 5000 ms in `cardPick`, `ledger`, `parts.parity`, `rubric.parity` and `tap` while another session's Python job ran, and pass with `--no-file-parallelism` (5 files, 42 tests). T113 changes no core file.
- App jest (`--no-watchman -w 2`): 5 failed, 2090 passed, 4 skipped. The 5 are exactly the inherited T94 tests (`T94-tailored` TL2.2, `goingFor` TL4.3 and "never changes the score", `cardContent` "Reads as", `styleKeys`). T113's files pass 79/79.
- Firebase emulator tests: not run; `firebase/` unchanged.
- **The flake is CPU load, not a race:** with default workers, 13 failed; the 8 extra are all "Exceeded timeout of 5000 ms" plus one knock-on (SY1.5), in `T39-offerCard` OS5.7, `T39-setupScreens` F1.1, `T39-styleProfile` ×3 and `youSettingsHome` ×3 (the last two untouched by T113). No assertion failed; alone they take 1.1–2.3 s (F1.1's walk 2268 ms).

### Flows on iOS (T113 bundle)
- **Pass:** T113-style-game (also alone), T39-setup-fresh (F1.1, 17 taps), T39-setup-later, T39-setup-not-now, T39-under-18, T73 ×2, core-kit, smoke. SY1 (T34) failed in the batch, passed alone and on the baseline: a batch-run flake.
- **Fail the same way on the baseline (inherited):** T39-screens (screen 282, "Turn on fit checks"; its T113 screen-2 block passed), T38 ("Why 7.5?" under the dock), core-fit-check and T14 ("Fit check … Score"), T55 (`idea-checked`), T74 ("Question 1 of 5"). T94-tailored-tile fails at "Styles": its demo screen 293 isn't on this branch (expected).
- No old flow broke because of T113.

### Planted bugs
44 planted: 40 caught, 2 not caught (test defects T1, T2), 2 equivalent mutants not counted (a `dragTarget` tie change; drag-by-top on equal-height rows). Each reverted with `git checkout`; tree clean after.

### Defects
**Code (implementer):**
- **C1** · `GameCard.tsx`: the two outfit dots are drawn under the drawing; FS1 says "at the top of the card" (`shots/300-card3-light.png`).
- **C2** · `GameResults.tsx`: the labels of `results-add`, the words link, Done, Edit and Play again aren't capped at `CONTROL_TEXT_MAX_SCALE`; at AX5 they grow past Continue's capped label. SG9 says button labels stop at 2× (`shots/308-typing-words-ax5.png`, `shots/310-nothing-clicked-ax5.png`). **Fails SG9.1.**
- **C3** · `GameCard.tsx` `leave()` and the Back handler: Back within the 240 ms exit drops the in-flight answer and undoes the previous card's (probe: Me on card 3, Back 50 ms later → answers go from [Workwear, Classic prep] to [Workwear]). Proposed test: that sequence leaves [Workwear, Classic prep] on card 3, or Back is ignored while a card is leaving.
- **C4** · `GameResults.tsx` `onContinue`: the `busy` guard is React state read from the closure; two presses in one frame push `/onboarding/basics` twice (a Maestro double tap didn't trigger it). Proposed test: two presses in one `act` → one push; fix with a ref.
- **C5** · `AddLookSheet.tsx` `pick` has no guard: two tiles pressed before the first `addToResults` resolves add both and call `router.back()` twice, which would also pop Here's your style. Proposed test: two presses in one `act` → one add and one back.

**Test (test writer):**
- **T1** · `T113-styleGameScreens` › "SG1.3 · card 1 leans once after 1.4 s": `LEAN_AFTER_MS` 1400 → 1500 wasn't caught; needs a check that the lean has started by about 1450 ms.
- **T2** · `T113-styleGameSession` › "SG8.1 · a bad draft starts a new game": dropping the `v !== 1` check in `parseDraft` wasn't caught; add `{"v":2,"picks":["streetwear"],"mes":["streetwear"],"notMes":[]}` → a new game.
- **T3** · default-worker jest: the retargeted game walks (OS5.7, F1.1) plus T39-styleProfile and youSettingsHome time out at 5 s under load; give them explicit timeouts or cap jest's workers in `npm run check`.

**Later, not blocking:** the toast covers most of Continue for 5 s (the app's toast placement); the ranking pair sits high, not "mid-screen" (taste); focus isn't moved to `rank-title` / `results-title` (not built, per TASK.md); Streetwear's black crewneck is faint on the dark card (T94's redraw); on demo screen 304 a live × showed no toast twice, but with the real clock on a fresh install it showed `Removed Tailored` with Undo (a demo-clock artefact).

### Per criterion
| ID | Result | Proof |
|---|---|---|
| SG1.1 | pass | golden and 2,000/80,000-deal tests; look-alike and title plants caught; T39-setup-fresh shows "Me or not me?" and "Step 2 of 3"; `2-card1-*` |
| SG1.2 | pass | SWIPE_LINE, double-tap, tick and spring plants caught; a real 150 pt swipe answered, a 50 pt drag sprang back on iOS |
| SG1.3 | pass (T1 on timing) | Reduce-Motion and dots plants caught; `2-lean-frames-4fps-light.png` shows right, then left, once |
| SG2.1 | pass | flip and first-outfit plants caught; `303-ranking-*` |
| SG2.2 | pass | win-swap plant caught |
| SG3.1 | pass | number, Undo-token, toast-undo and dragTarget plants caught; a real handle drag on iOS; Undo on 306 and the real-clock toast |
| SG3.2 | pass | not-me, push-before-save and words plants caught; `310-*` off, `304-*` on |
| SG4.1 | pass | choices and close plants caught; `312-add-look-*` |
| SG5.1 | pass | maxLength and trim plants caught; `308-*`, `309-*` |
| SG6.1 | pass | head and copy plants caught; flow screen 310 |
| SG7.1 | pass (C1) | peek-reset, TAP_SLOP and a11y-action plants caught; `301-*` |
| SG7.2 | pass | swap plant caught; `307-*` |
| SG7.3 | pass | copy plant caught; `304-*`, `305-*`, `313-*` |
| SG7.4 | pass (C3 is an edge beyond it) | Back-pops-two, resume and gesture plants caught; flow screen 300 |
| SG8.1 | pass | draft and sync plants caught; the flow's relaunch blocks pass on iOS |
| SG9.1 | **fail** | C2 at AX5; the accessibility tree's labels are right (card "Outfit 1 of 8, view 1 of 2. …", rows "1 of 3, Streetwear. …", stamps and dots hidden; Me on top at AX5) |
| F1.1 | pass | the 17-tap flow passes on iOS; camera and extra-tap plants caught |

### Not verified, and what would verify it
- VoiceOver rotor actions, spoken order and announcements: the Accessibility Inspector, or the founder with VoiceOver on.
- Reduce Motion on a device: the Simulator with Reduce Motion on, or his phone.
- Haptics and how a real finger's swipe, tap and drag feel: a founder to-do, "play the style game on your phone: swipe, tap for the other outfit, drag a row" (10 min, P1).
- A different deal after a relaunch on a device, and Delete all my data on a device (both proven in the session tests).
- The software keyboard on results (the Simulator used a hardware keyboard).
- Whether the game finds real people's style: plan.md Y30.

## Disputes
- **Re-lock after verify round 1 (test writer, Nov 18): `50a0f687`.** Test defects T1 and T2 are strengthened (each now bites the planted bug: `LEAN_AFTER_MS` 1500, and the dropped `v !== 1` check). T3 adds explicit 20 s timeouts on the long game walks; `T39-styleProfile` and `youSettingsHome` are listed in TESTING.md as an inherited flake, untouched. New tests for C1–C5 are red on `c18febfe` for the right reason. C3 takes "Back undoes the in-flight answer, and only it" (SG7: Back undoes exactly one answer), not "Back is ignored while leaving". C1 is checked as placement (dots before the drawing, or pinned to the card's top); its look stays screenshot-only. Details: TESTING.md → Verify round 1.

## Verification, round 2: **ready**
*The verifier's report, recorded by the coordinator (the subagent hook blocks the verifier's write). Screenshots: commit `bddd7ddc` (7 retaken, 3 new).*
- **Fixes since round 1:** the test writer re-locked at `50a0f687` (T1, T2 strengthened; T3 timeouts on the long walks only; new tests for C1–C5; `t39ScreenMocks` passes `maxFontSizeMultiplier` through, a test-support change). The implementer's `d62bd29c` fixed C1–C5 (deviations: `holdAnswer` exported from the session; a local `CappedLink` instead of `TextLink`, which has no cap).
- **Lock holds:** `git diff 50a0f687..HEAD` over tests, e2e and testing support is empty; TESTING.md differs only in its Lock line (`b7b64a14`).
- **Suites:** `tsc` clean; `expo lint` 0 errors. Jest `-w 2`: 5 failed (exactly the inherited T94 tests), 2095 passed, 4 skipped; T113's files 84/84. Default workers: same 5, no timeouts (with 2 GB free, so it doesn't prove T3 under heavy load). Core and firebase unchanged.
- **Planted bugs: 9 of 9 caught:** `LEAN_AFTER_MS` 1500 (SG1.3); `parseDraft` without `v !== 1` (SG8.1); dots back under the drawing (SG7.1); `CappedLink` and Add a look's label uncapped (SG9.1, ×2); `back()` ignoring the in-flight answer and `cancelExit` not clearing the timer (SG7.4, ×2); no ref guard on Continue (SG3.2); no guard on the sheet's pick (SG4.1).
- **On iOS** (Release-bundle swap of `d62bd29c`, sha1 `fa502ac1…`, containing `holdAnswer`; the original `9f99e012…` restored, text size reset, Simulator shut down): C1, the dots sit at the top of the card in light and dark (`300-card3-*`, `301-other-outfit-*`); C2, at AX5 the text buttons render at Continue's capped size (`308-typing-words-ax5`, `310-nothing-clicked-ax5`, `304-results-three-ax5`); C3, a real Back about 200 ms after Me brings the flying card back and stays on card 3 (`300-back-during-exit-frames-20fps-light`); C4, a real double tap on Continue opens About you once (`304-double-continue-then-back-light`); C5, a double tap on a sheet tile adds Streetwear once (`312-sheet-double-tap-r2-light`). Flows: `T113-style-game` pass, `T39-setup-fresh` (17 taps) pass.
- **Per criterion:** SG9.1 now passes on its capped labels; SG7.1's dots pass; SG7.4 (C3), SG3.2 (C4), SG4.1 (C5) pass; every other criterion as in round 1 (pass).
- **Remaining defects:** none, code or test. **Worth a look:** after Back cancels an exit the card springs slightly past centre, so a faint Not me stamp shows for a few frames; plus round 1's carry-overs (the toast over Continue, the ranking pair sits high, focus not moved to the stage titles, the black crewneck faint on the dark card).
- **Found on the Simulator:** at round 2's boot, another session's install sat there (`com.trykitted.kitted-1795012960648.app`, no `main.jsbundle`); the verifier restored the Nov 11 original it holds.
- **Not verified:** VoiceOver end to end on a device, Reduce Motion on a device, haptics and a real finger's feel, a new deal after a relaunch and Delete all my data on a device (proven in the session tests), the software keyboard on results, and whether the game finds real people's style (Y30).

## Summary for the founder
Setup's style step is now the game you picked. After Welcome he sees "Me or not me?": 8 drawn outfits, one at a time, tap or swipe, with a tap on the card for that look's other outfit. Then a few this-or-thats put his Me's in order, then "Here's your style", where he can drag, remove, add, type his own words or play again. A fresh install reaches the camera in 17 taps with 3 Me's. Real: all of it runs on the iPhone app on the Simulator, with 84 tests of its own and two verify rounds; his Not me's are saved but not used yet. Mocked: nothing; the drawings are the app's own. Not checked: VoiceOver and haptics on a real phone, the software keyboard, and real people (your test with friends). The words are drafts for you.
- **Re-lock (test writer, Nov 18): `0624257e`.** The founder changed the ranking line (#493). SG2.1's render test was retargeted to `Tap the one that's more you.`, still checked exactly on the ranking stage. It passes on the build and fails with the old line restored.
- **Re-lock (test writer, Nov 18): `d9a22920`.** The founder's change after a real tester (#494). The words are retargeted to Is this your style? / Yes / No everywhere, tests and flows, none loosened. SG1.4 (the teaching overlay, kv `onboarding.swipeTaught`, local) and SG7.5 (the fast-No check) have new tests, 14 red on `486b188a`. **For the founder:** SG1.4's tap makes a fresh install 18 taps to the camera, against F1.1's 17. `F1.1 · setup with 3 Me's…` keeps its bound and will be red once the overlay exists. Also, "never again" for the lean is read as once per install (TESTING.md).

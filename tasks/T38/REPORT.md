# T38 · Report

## Summary for the founder
<filled in at the end>

## Built (implementer)
*Transcribed by the coordinator from the implementer's report: the harness refused the implementer's own write to this file.*
- **Changed:** Welcome no longer shows anyone's photo. Closet's drawing code draws the bundled s14 outfit on the background: a charcoal denim jacket, white sweater, grey drawstring trousers and grey chunky sneakers.
  - **The swap:** from 0.6 s the sneakers cross-fade to the white low-profile sneakers the top fix names. The card counts 7.5 → 8.0 in tenths. At 1.5 s "Put together" fades to "Sharp", and "Full check" fades to "Swap the chunky sneakers for low-profile sneakers". It holds still from 2 s.
  - With Reduce Motion or an accessibility text size, the after state shows from the first frame.
  - Every number and word comes from the engine. The status bar follows the theme.
  - Welcome is one scroll view that fits every phone and scrolls rather than overlaps. At accessibility sizes the drawing is centred at 0.69, with the full-width card under it.
  - The Example check shows the same drawing, in its before state, in a bubble like the photo bubble, with the new intro and caption. The card, the math and the dock work as before.
- **Files:** `app/src/features/onboarding/{outfitDrawing.ts,welcomeExample.ts,exampleCheck.ts,useWelcomeSwap.ts,DrawnOutfit.tsx,WelcomeScreen.tsx,ExampleCheckScreen.tsx}`, `app/src/i18n/en.ts` (`onb.welcome.cardA11y`, `onb.example.a11yOutfit`, `onb.example.intro` override, `onb.example.note`).
- **Deviations from IMPLEMENTATION.md:**
  1. `KCard`, `KText` and `Numeral` take no `testID`, and they're in the design system, outside the lane. So the testIDs sit on wrapper Views. `example-card` is a View that carries the card's one VoiceOver label; the inner `KCard` gets no label.
  2. `WELCOME_READING` lives in `exampleCheck.ts` and is re-exported from `welcomeExample.ts`. This breaks the import cycle IMPLEMENTATION.md step 2 warns about.
  3. `welcomeExample()` also returns null when the fix changes no drawn piece, or more than one, since there's then no single piece to swap. The bundled reading can't hit this; it falls under technical default 10's null case.
  4. During the 200 ms text cross-fade, the detail line's box grows from the before height to the after height, which is measured by an invisible copy (`welcome-card-measure`).
  5. The drawing is painted top, bottoms, shoes, then the jacket over them, which is StandingOutfit's order.
- **Not done:** nothing in the plan. Not seen on a Simulator or the web preview (memory); the Maestro flow has not been run.
- **See it:**
  - Demo 1: Welcome, which plays the swap. Add `-demoRevealSlow 10` to hold the before state for about 6 s.
  - Demo 130: Welcome with sign-in.
  - Demo 131: the Example check from Welcome.
  - Demo 213: the Example check as a sheet.
  - Largest text: `xcrun simctl ui <udid> content_size accessibility-extra-extra-extra-large`.
- **The implementer's check run (Nov 9):**
  - The T38 tests pass, 45 of 45, plus uiFixBatch, onboardingAccount and stepFourBatch.
  - Core typecheck, lint, core tests (853) and the full app Jest (1693 passed, 4 skipped) all passed.
  - `tsc --noEmit` failed on the locked tests (dispute 1).

- **Round 2 (transcribed from the implementer, `cb0b3b35`):**
  - **What changed:** turning Reduce Motion on mid-swap and off again now holds 8.0 "Sharp" with the white sneakers. It no longer jumps back to "7.6" and plays the rest.
  - **The cause:** the hook showed the after frame while motion was off, but its stored frame still held the old mid-swap frame. When motion came back on, it returned that stored frame and restarted the loop.
  - **The fix:** while motion is off, the hook moves its stored frame to the after frame during render. When motion returns, the effect asks for no more frames.
  - **Files:** `useWelcomeSwap.ts` only. No new deviations.
  - **Checks:** 46 of 46 T38 tests pass. `npm run check` passes up to Jest, and Jest's watchman failed. `npx jest --no-watchman` gives 127 suites passed, 1694 passed, 4 skipped.

## Disputes
- **Dispute 1** · `drawnWelcome.test.ts` lines 397, 398 and 421, and `t38ScreenMocks.tsx` lines 279, 280, 305 and 312.
  - **Why it looked wrong:** the tests used Node's `global`, which isn't typed under the app's `"types": ["jest"]`, so `tsc --noEmit` (and `npm run check`) failed with TS2304. Jest passed because Babel doesn't type-check.
  - **What it should say:** `globalThis`, which is the same object at runtime.
  - **Settled by:** the test writer.
  - **Outcome:** changed to `globalThis` with no expectation changed (`bae9e735`), and re-locked (`1141df58`; Lock line `bae9e735`). The test writer's session hit its usage limit after committing, so its written ruling isn't here; the commits are the record.
  - **Test writer's ruling (added in round 2):** agreed. It was a type error in the test code, not a question about the spec. Checks run:
    - `tsc --noEmit` exit 0 on a temporary config that extends the app's tsconfig and covers the T38 test files and everything they import;
    - all 45 T38 tests passing against `a70ff40c`;
    - the fetch guard still biting (a `fetch` on open fails OS2.2).
- **Test change, round 2 (the verifier's M9)** · `app/src/testing/t38ScreenMocks.tsx`, `app/src/__tests__/drawnWelcomeScreens.test.tsx`.
  - **Why:** the mocked `requestAnimationFrame` kept firing while `AppState` was `background`, so `OS1.3 · it doesn't replay from the background…` never tested a paused clock. A hook whose clock counts frames (`frames++ * 16`) passed it, although on iOS it would come back mid-swap.
  - **Change (strengthening only, nothing loosened):**
    - The mocked frames now hold while `setAppState('background')` is in force and resume on `active`, as on iOS. The fake clock keeps going.
    - The background test also checks that the screen doesn't change while away.
  - **Proof:** with M9 applied to `useWelcomeSwap.ts`, the background test fails (expected "8.0", received "7.5" after coming back). Reverted, it passes against `a70ff40c`.
  - **Also added:** `OS1.3 · Reduce Motion turned on mid-play and off again holds the after state (no second play)`. It covers the verifier's own edge, and its basis is TESTING.md OS1.3's must-not "a second play without a new mount (… a re-render)".
    - **It is red against `a70ff40c`:** right after Reduce Motion is turned off again, the card shows "7.6" instead of "8.0" and then plays the rest.
    - **Cause:** `useWelcomeSwap` returns its stale `frame` state once `mode` is `play` again.
    - **This is a code fix for the implementer, not a test fix.**
  - **Checks:** `tsc --noEmit` exit 0 on the T38 test files; the no-example and other-reading suites pass; ESLint is clean.
  - **Lock:** `225a8a12`.

## Verification (verifier)
**Lock:** `git diff bae9e735..HEAD` on the six test files, `app/e2e/` and TESTING.md is just the lock line (`1141df58`, the test writer's re-lock). From the first lock, `git diff 3c08174e..HEAD` on the tests is only `global` → `globalThis` (7 lines, no expectation changed; `bae9e735`, the test writer, Dispute 1). The build commit `a70ff40c` touches only app files · banned shortcuts: none found (no `.only`/`.skip`/`xit`/`it.todo`, no snapshots, no fixture edits, no `NODE_ENV`/`JEST_WORKER`/`process.env` checks, no expected values typed into app code; every number and word on the card comes from `exampleCheck()` / `applyPartsFix` / `overallFor`) · files outside the list: none (the 8 changed app files are all in IMPLEMENTATION.md → Files; `plan.md` and `tasks/T38/REPORT.md` are the coordinator's).
**Suites:** `npm run check` (Nov 10): `tsc --noEmit` green (Dispute 1 is fixed), core typecheck green, `expo lint` 0 errors and 1 warning (unused `ClosetItem` in `tryOn.test.ts`, not T38), core vitest `Test Files 30 passed (30) · Tests 853 passed (853)`. Then Jest died with "unable to talk to your watchman", so it was re-run as `npx jest --no-watchman`: `Test Suites: 3 skipped, 127 passed, 127 of 130 total · Tests: 4 skipped, 1693 passed, 1697 total` (the 3 skipped are the `*.manual.test.ts` suites). The T38 suites (45 tests), uiFixBatch, onboardingAccount and stepFourBatch all pass · server: not touched · parity: not touched (`@kitted/core` unchanged; core's parity tests pass inside the 853).
**Flows (Maestro):** **not run**, neither `T38-drawn-welcome.yaml` nor the earlier flows. The main Simulator `111D0A09…` was in use by another session the whole time: it was running `T14-beta-limits.yaml` through Maestro and relaunching Kitted, with Metro on 8081 served from another worktree (`you-and-first-run-c080d4`). A flow run against that Metro would test that worktree's code, not T38's. Free memory was 90–700 MB, well under the ~2 GB a second Simulator needs.

### Criteria
- **OS1.1** · **pass** (tests) / not verified (on a device) · proof: the 6 tests were red at `3c08174e` (TESTING.md → red) and are green now. Deliberate bug "the Example check looks up `demoPhoto('s14')`" was caught by `OS1.1 · the Example check renders the drawn bubble and no photo…` (and 2 more). "The last garment of a slot wins" was caught by `OS1.1 · a garment outside the four slots is left out…`. Code read: `demoPhoto`, `PhotoBubble`, `NeckDownPhoto`, `expo-image` and the gradient are gone from both screens. · Not verified on a device: what would verify it is screenshots of demos 1, 131 and 213 on the Simulator.
- **OS1.2** · **pass** · proof: 8 tests red then green. Deliberate bug "the after word uses the before score's word" was caught by `OS1.2 · before, after, both words and the fix are the engine's`, `…7.5 Put together → 8.0 Sharp…` and `OS1.2 · the card shows whatever welcomeExample says` (11 in all). "The after shoes drawn from the before reading" was caught by `OS1.2 · the drawing is drawn from the scored reading, before and after` and `OS1.2 · the drawing swaps the piece this reading's fix changes…`.
- **OS1.3** · **not ready (test)** / not verified (on a device) · proof: 10 tests red then green. The deliberate bugs "AX size not treated as still", "count step 500/(tenths+1)", "doneAt 2100" and "Reduce Motion mid-play doesn't stop the swap" were each caught (see below). **One was not caught:** the swap's clock counting frames instead of wall time (bug M9 below) passes all 99 tests. · Not verified on a device: the motion itself, tabular figures (does "Put together" stay still during the count?) and the real Reduce Motion setting. What would verify it: a Simulator screen recording of demo 1 at `-demoRevealSlow 4`, then again with Settings → Accessibility → Motion → Reduce Motion on.
- **OS1.4** · **pass** (words, VoiceOver props, layout rule) / **not verified** (screens) · proof: 7 tests red then green. The deliberate bugs "`One fix:` → `The fix:`", "the drawing not hidden from VoiceOver", "GAP 24 → 25", "`numberOfLines={2}` on the fix line" and "the title loses its header role" were each caught. · Not verified: light, dark, xxxLarge and AX5 with nothing clipped against `design/01–03, 08, 09, 13`; what VoiceOver actually speaks; the T38 flow. What would verify it: the main Simulator once it's free and this worktree's Metro is running (demos 1 and 130 at the default size, xxxLarge and AX5, light and dark), plus the Accessibility Inspector.
- **OS2.1** · **pass** (tests) / **not verified** (screens, flow) · proof: 9 tests red then green. The deliberate bugs "`A drawn example` → `A drawing example`", "LAYER_DROP 0.15 → 0.25", "Hide the math doesn't close", "the bubble's role is `imagebutton`" and "the AX caption stays in the frame" were each caught. · Not verified: demos 131 and 213 against `design/04–07, 10`, and the flow. What would verify it is the same as OS1.4. **Risk to check on the device:** the result card is one grouped VoiceOver element (`example-card`, `accessible`, as `KCard` was before T38), so on iOS the "Why 7.5?" link inside it may not be reachable by VoiceOver or by Maestro's `tapOn: "Why 7\.5\?"`. If the flow can't find it, the cause is this grouping (it predates T38; the inventory lists the link as its own button).
- **OS2.2** · **pass** · proof: the 5 tests passed before the build and were proved to bite (TESTING.md). Here, the deliberate bugs "the Example check writes `example.seen`", "Welcome writes `welcome.seen` on mount" and "the sheet's `Check my own fit` writes `onboarding.step`" were each caught.

### Break it on purpose
Each bug was run against the 4 T38 suites plus uiFixBatch, onboardingAccount and stepFourBatch (99 tests), then reverted with `git checkout`. The tree was clean after each.
- M1 the Example check calls `demoPhoto("s14")` → caught by `OS1.1 · the Example check renders the drawn bubble and no photo…`, `OS2.1 · the Example check's bubble and card are the scored reading's`, `OS2.1 · with no example…`
- M2 `drawnPieces` lets the last garment of a slot win → caught by `OS1.1 · a garment outside the four slots is left out, and the first garment of a slot wins`
- M3 `after.word = scoreWordLabel(score)` (the before word) → caught by 11 tests, including `OS1.2 · before, after, both words and the fix are the engine's`
- M4 Welcome's after piece drawn from `reading` instead of `afterReading` → caught by `OS1.2 · the drawing is drawn from the scored reading, before and after`, `OS1.2 · the drawing swaps the piece…`
- M5 `welcomeMotion` ignores `accessibilitySize` → caught by `OS1.3 · Reduce Motion and accessibility sizes are still`, `OS1.3 · an accessibility text size shows the after state…`, `OS1.4 · nothing in the card is cut…`
- M6 the count step `500 / (tenths + 1)` (7.6 at 983 ms) → caught by `OS1.3 · the timeline, frame by frame` only (the render test samples every 50 ms and still sees every tenth)
- M7 `doneAt` 2000 → 2100 → caught by `OS1.3 · the timeline…`, `OS1.3 · a wider gap…`, `OS1.3 · the demo slow factor stretches it`
- M8 the hook keeps returning the stale frame when Reduce Motion turns on mid-play → caught by `OS1.3 · Reduce Motion turned on mid-play jumps to the after state`
- **M9 the swap's clock counts frames (`frames++ * 16`) instead of `performance.now() − startedAt`** → **not caught** (99 of 99 pass). On iOS, `requestAnimationFrame` stops while the app is in the background, so this build would come back from the background mid-swap (about 7.6, the shoes half faded) and play the rest. That breaks TESTING.md OS1.3: "background at t 1000 and active at t 5000 → the after state", and the hook's "elapsed only grows". The mock in `t38ScreenMocks.tsx` (line 290) keeps firing frames every 16 ms whatever `setAppState` says, so `OS1.3 · it doesn't replay from the background…` never exercises a paused clock. **Test defect, for the test writer:** make the mocked `requestAnimationFrame` hold its callbacks while `AppState` is `background` and release them on `active`, as iOS does. The test then fails for M9 and passes for the real hook.
- M10 `onb.welcome.cardA11y` "One fix:" → "The fix:" → caught by `OS1.4 · Welcome's words are unchanged`, `OS1.4 · the card's VoiceOver line`, `OS1.4 · VoiceOver: …the same label in every frame`, `OS1.2 · the card shows whatever…`
- M11 the drawing loses `accessibilityElementsHidden` / `no-hide-descendants` → caught by `OS1.4 · VoiceOver: the drawing is hidden…`
- M12 the layout gap 24 → 25 → caught by `OS1.4 · the layout fits every phone`
- M13 `numberOfLines={2}` on the fix line → caught by `OS1.4 · nothing in the card is cut to a line count`
- M14 the headline loses `accessibilityRole="header"` → caught by `OS1.4 · Welcome shows its headline, body and buttons…`
- M15 the caption "A drawn example" → "A drawing example" → caught by 4 tests, including `OS2.1 · the new intro, caption and bubble words`
- M16 the bubble layer's drop 0.15 → 0.25 → caught by `OS2.1 · the bubble tile's layout`
- M17 "Why 7.5?" always opens (Hide the math can't close) → caught by `OS2.1 · Why 7.5? opens the math in place and Hide the math closes it`
- M18 the bubble's role `imagebutton` → caught by `OS2.1 · the Example check shows the drawn bubble…`, `OS2.1 · at accessibility sizes…`
- M19 the AX caption stays in the frame → caught by `OS2.1 · at accessibility sizes the bubble's caption moves under it`
- M20 the Example check writes kv `example.seen` → caught by the 3 Example check OS2.2 tests
- M21 Welcome writes kv `welcome.seen` on mount → caught by `OS2.2 · Welcome itself sends and saves nothing until Get started` (and 2 more)
- M22 the sheet's `Check my own fit` writes `onboarding.step` → caught by `OS2.2 · opening it as a sheet…` and stepFourBatch G23.1

### Screens
**None checked**, so every state is not verified: Welcome before, mid-swap, after and with sign-in (demos 1 and 130); Welcome at xxxLarge and AX5; the Example check from Welcome, scrolled, with the math open, as a sheet and at AX5 (demos 131 and 213); light and dark for all of them.
- Why: the main Simulator was busy with another session's Maestro run for the whole verification, and its Metro (8081) serves another worktree's code. Free memory stayed at 90–700 MB, so no second Simulator (~2 GB) and no second Metro (CLAUDE.md rules 8–9, the coordinator's constraint).
- What would verify it: when `111D0A09…` is free, start this worktree's Metro (`preview_start kitted-web`, after the other session's Metro on 8081 is stopped by that session). Then run `xcrun simctl launch … -demoScreen 1|130|131|213 -theme light|dark -demoLatency 0` (and `-demoRevealSlow 10` for phones 1–2) at the default size, xxxLarge and AX5, and compare against `tasks/T38/design/01–10, 13`. No screenshots were taken.

### Tried to break it
- Offline → covered: every render test runs with `fetch` rejecting, and the screens render and work.
- Background mid-swap → the real hook uses `performance.now()` from mount, so it lands on the after state. The test doesn't prove that (M9 above) · proposed test: pause the mocked frames in the background (above).
- Reduce Motion on mid-play, then off again → code read: `halted` stays true, so it holds the after state and never replays (the "on" half is covered by `OS1.3 · Reduce Motion turned on mid-play…`) · proposed test: turn it off again at t 1500 and expect the after state, `getTimerCount()` 0.
- Double tap on `Get started` → there is no tap guard (`KButton` has none, and `start` pushes `/onboarding/looks` on every tap). This is unchanged from before T38 and not T38's criterion, but a fast double tap may push Looks twice · proposed test (Setup lane): two `press` calls on `Get started` → `router.push` called once. Not verified on a device.
- "Delete all my data" / reinstall → nothing to remember: mounting Welcome writes nothing (OS2.2 tests, and M21 caught), so a fresh Welcome plays again. Covered by `OS1.3 · …replays only on a new mount`.
- The clock past 4 am → not applicable (neither screen reads the day).
- Engine null / no fix → covered by `drawnWelcomeNoExample.test.tsx` and `OS1.2 · no fix … → no example`.
- The spec has no failure-table rows for OS1–OS2.

### Implementer's claims
- No photo on Welcome; the s14 outfit drawn by Closet's code → confirmed in code and tests (not seen on screen).
- The swap timeline (0.6 s, the count in tenths, 1.5 s cross-fade, still from 2 s) → confirmed by `welcomeSwapFrame` and its tests (not seen on screen).
- Reduce Motion / AX size → after state from the first frame → confirmed (tests; M5 and M8 caught).
- Every number and word comes from the engine → confirmed (`OS1.2 · the card shows whatever welcomeExample says` with s05; M3 caught).
- The status bar follows the theme → confirmed in code (`setStatusBarStyle` gone; test green). Not seen on screen.
- One scroll view that fits every phone; AX: centred at 0.69, full-width card under it → confirmed against `welcomeLayout`'s unit tests; not seen on screen.
- The Example check shows the drawing in its before state, with the new intro and caption → confirmed (tests).
- Deviations 1–5 → confirmed in code; all stay in the lane. Deviation 3 (null when the fix changes no drawn piece, or more than one) is stricter than IMPLEMENTATION.md, and harmless for s14.
- "The T38 tests pass, 45 of 45; full Jest 1693 passed, 4 skipped; core 853" → confirmed by my run (`--no-watchman`).
- "`tsc --noEmit` failed on the locked tests" → that was before Dispute 1. It passes now.
- "Not seen on a Simulator; the flow not run" → still true after verification (see Flows and Screens).

**Verdict:** **not ready** · rounds: 1 of 3
- **test** (for the test writer): M9 isn't caught. The mocked `requestAnimationFrame` in `app/src/testing/t38ScreenMocks.tsx` keeps running while `AppState` is `background`, so `OS1.3 · it doesn't replay from the background, and replays only on a new mount` passes for a clock that would resume mid-swap on iOS. Fix: hold frames while backgrounded; the test must fail for the M9 build and pass for today's hook.
- **code:** none found.
- Not verified (no fault of the build): every screen state, the T38 flow and the earlier flows, the motion on a device, VoiceOver itself. All need the main Simulator free, with this worktree's Metro. Also check on the device whether "Why 7.5?" inside the grouped `example-card` can be reached by VoiceOver and by Maestro's `tapOn`.

## Design review (critic)

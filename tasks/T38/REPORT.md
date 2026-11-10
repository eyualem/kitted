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

## Disputes
- **Dispute 1** · `drawnWelcome.test.ts` lines 397, 398 and 421, and `t38ScreenMocks.tsx` lines 279, 280, 305 and 312.
  - **Why it looked wrong:** the tests used Node's `global`, which isn't typed under the app's `"types": ["jest"]`, so `tsc --noEmit` (and `npm run check`) failed with TS2304. Jest passed because Babel doesn't type-check.
  - **What it should say:** `globalThis`, which is the same object at runtime.
  - **Settled by:** the test writer.
  - **Outcome:** changed to `globalThis` with no expectation changed (`bae9e735`), and re-locked (`1141df58`; Lock line `bae9e735`). The test writer's session hit its usage limit after committing, so its written ruling isn't here; the commits are the record.

## Verification (verifier)

## Design review (critic)

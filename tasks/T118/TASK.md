# T118 · The app tour

**Size:** normal, drawn first · **From:** `plan.md` → T118 · **Spec:** `specs/app-tour.md` (approved Nov 19) · **Lane:** Onboarding (borrows Closet's `(tabs)/closet/index.tsx`, `(tabs)/lookbook/index.tsx`; `closet/arrivals.ts` is not touched, see Built)

## What changes
- **Goal:** right after About you, he is walked through the real Closet and Lookbook tabs, each filling with an animated example, then returned to Stylist, where Kit's hello and offer play only then.
- **Files:**
  - New, `features/onboarding/`: `appTour.ts` (the `appTour.state` kv, the stop in memory, settle at launch) · `exampleLooks.ts` (3 looks, scored by the scoring code; the example closet) · `TourCard.tsx` · `TourHost.tsx` (card, tab moves, dimmed bar) · `ExampleCloset.tsx` · `ExampleLookbook.tsx`
  - Edited: `aboutStep.ts` (finishSetup starts the tour) · `app/_layout.tsx` (TourHost) · `app/index.tsx` (setup's end lands on Closet) · `(tabs)/_layout.tsx` (items disabled, tour isn't "opening Closet", settle at launch) · `(tabs)/closet/_layout.tsx` (inert `+`) · `(tabs)/closet/index.tsx` and `(tabs)/lookbook/index.tsx` (the examples in place) · `features/stylist/StylistScreen.tsx` (no "seen until" while the tour is up) · `sync/schema.ts` (the key is this phone's) · `i18n/en.ts` · `demo/` (screens 430, 431) · e2e flows
- **Done means:** AT1–AT6 and F1.1 as the spec says; SY2.12 unchanged otherwise.
- **Must not break:** Kit's hello, typing dots and offer card (words, timing, haptic); Restore and under-18 never show the tour; a real first check still gets the slide, the badge and `From your first check`.

## Built
- **Changed:** see Review notes below; the plan is the spec's.
- **Tests added:** `src/__tests__/T118-appTour.test.ts` (18): AT2.2, AT1.1, AT3.1, AT3.4, AT4.1–AT4.4, AT6.1, AT6.2. Tap-through: `app/e2e/flows/T39-setup-fresh.yaml` now 20 taps (AT6.3); `T39-setup-later` and `T39-setup-not-now` skip the tour through `common/skip-tour.yaml`.
- **Screenshots:** `tasks/T118/shots/` (demo screens 430 Closet stop, 431 Lookbook stop)
- **Not done or not checked:** see the PR.

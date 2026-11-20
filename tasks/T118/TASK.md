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
- **Changed:** right after About you, the real Closet tab shows 10 example pieces (Jackets and layers, Tops, Bottoms, Shoes) dropping in, tagged `Example`, with the tour card `1 of 2`; `Next` shows 3 example looks in Lookbook (Welcome's outfit on top) with `2 of 2`; `Done` or `Skip` goes to Stylist, where Kit's dots, hello and offer play only then. The tab bar is dimmed and untouchable and Closet's `+` is blocked during it. State: kv `appTour.state` (pending → done), this phone only. The two new example looks are bundled readings `p01b` and `s05`, scored by the scoring code at run time. The tour doesn't count as opening Closet (the tab bar reports no tab to Closet's arrivals; `arrivals.ts` untouched). A relaunch with the tour still pending ends it and the hello still plays. Decisions: DECISIONS-LOG #522.
- **Tests added:** `src/__tests__/T118-appTour.test.ts` (21): AT1.1, AT2.2, AT3.1, AT3.4, AT4.1–AT4.4, AT6.1 (Skip on stop 1, Done on stop 2, and a real later visit still counts; the first one fails on the old behaviour), AT6.2. Two existing tests got a Reanimated stub (`closetNoOutfits`, `youSettingsHome`: Closet's screen now reaches the examples). Tap-through: `app/e2e/flows/T39-setup-fresh.yaml` is now 20 taps and passed on the Simulator (AT6.3); `T39-setup-later` and `T39-setup-not-now` skip the tour through `common/skip-tour.yaml`, and all three dismiss the dev build's developer-menu intro through `common/dismiss-dev-menu.yaml`.
- **Screenshots:** `tasks/T118/shots/`: 01 Closet stop, 02 Lookbook stop (light), 03 Closet stop and 04 Lookbook stop (dark), 05 Closet stop at the largest text, 06/07 Stylist right after Skip. Demo screens 430 and 431. The grey gear is the development build's own button.
- **Fix round (after the review):** (1) Stylist now waits for the launch settle before it reads "seen until" (one shared promise: `settleTourOnce`). (2) A render of Closet after Skip on stop 1 no longer counts as opening it (`tourTab.ts`). (3) AT6.1 and AT4.2 tests tightened, `ExampleCloset` no longer counts during render. (4) The VoiceOver note on the veil corrected.
- **Not done or not checked:** the tab bar is not hidden from VoiceOver (a native bar; its items are disabled and veiled); VoiceOver itself not run. AT4.2 (close mid-tour, reopen) is tested in code, not on the Simulator. Lookbook stop at the largest text and dark at the largest text not shot. The plain fade between tabs under Reduce Motion is the tab bar's own default (no custom fade built). `T39-setup-later` and `T39-setup-not-now` fail earlier in the shared `play-style-game` helper (before the tour) and weren't fixed here. Dark-mode contrast not measured.

## Review

### Round 1 (normal mode; read the diff, the tests, the e2e flows and the shots; nothing re-run)
**Criteria**
- AT1.1 done (shot 01: Example tag, sections, card words match). AT1.2 done by code (card is outside the animation; drops ~70 ms apart); not timed.
- AT2.1 done (shot 02). AT2.2 done (test compares each look with `evaluateCheck` on its reading).
- AT3.1 done for the normal path (e2e: dots and hello only after Done). AT3.2 done for the normal path (markSeen skipped, `/` redirects to Closet, e2e asserts no Kit line during the tour).
- AT3.3 can't tell: items are `disabled` and a veil sits over the bar, but no test or flow taps them. What would tell: tap each tab, Closet's `+` and a row during the tour on the Simulator.
- AT3.4 done (examples are drawn, test checks the store is empty).
- AT4.1 done. AT4.3 done. AT4.4 done (finishSetup only; Restore goes through completeOnboarding; under-18 rejects).
- AT4.2 not done as far as I can see (defect 1).
- AT5.1 can't tell / likely not met for the tab bar (defect 2); the card and example labels are in the code and match the spec.
- AT5.2 done by code (`reduceMotion` drops `entering`); the tab fade is not in the diff (tabs use navigate with the default transition). Not verified.
- AT5.3 partly: stop 1 largest text, light, shows the buttons whole and the words scrolling inside the card. Stop 2 at largest text and dark largest are not shown. Dark stops 1 fine.
- AT6.1 not done for Skip from stop 1 (defect 3). AT6.2 done (no network code in the tour; the test is thin but the code has none).
- AT6.3 done (e2e: 20 taps, passed on the Simulator per the disclosure). F1.1 done. SY2.12 words, timing, haptic untouched.
- Hard lines: no face, body or skin content; nothing leaves the phone; no emoji; words match the spec. The tour's copy and `Example` tag are the spec's.

**Defects**
1. code (likely; not run) · AT4.2, `features/onboarding/appTour.ts` `settleTourAtLaunch` called from `app/(tabs)/_layout.tsx` (useEffect) vs `features/stylist/StylistScreen.tsx` ~line 87. On a relaunch after the app closed mid-tour, StylistScreen reads `stylist.seenUntil` once on mount, while `settleTourAtLaunch` makes five awaited calls before it writes the corrected value. The screen's read very probably lands first, so it sees the old value (or none, which means "launch time", newer than the hello): the hello and offer then show as old rows, with no dots and no soft tap. Fix: settle the tour before Stylist reads (for example in the gate or `app/index.tsx` before redirecting to `/stylist`, or have the screen await the settle).
2. code (likely; VoiceOver not run, disclosed) · AT5.1, `TourHost.tsx` veil. `accessibilityElementsHidden` is on an empty sibling View; it hides nothing about the native tab bar, which the comment itself says draws above the screens. `disabled` items are usually still focusable by VoiceOver. Either hide the bar from VoiceOver another way or mark the criterion not verified.
3. code (small; likely) · AT6.1, `app/(tabs)/_layout.tsx`: `useClosetArrivals(tour ? undefined : tab)`. `Skip` on stop 1 ends the tour while the segments still say `closet` for a render, so `openCloset` runs (writes `closet.lastOpened = now`), and leaving to Stylist writes it again. `closet.firstVisit` stays as it was, and the badge still works, but the spec says lastOpened is unchanged. Fix: keep ignoring the tab until the route has left Closet (for example hold `tour` true until the tab is no longer the tour's).
4. test · AT6.1 test (`T118-appTour.test.ts`, last-but-one describe) hard-codes `tab: undefined` through the tour; it would still pass if `_layout.tsx` passed the real tab, and it never covers Skip from stop 1 (defect 3). AT4.2 test checks only the value `settleTourAtLaunch` writes, not that Stylist reads it (defect 1), so it would pass with the race. Neither the StylistScreen markSeen skip nor the `/` redirect has a unit test (e2e covers the happy path only).

**Small things (never block)**
- Shot 01: the Closet `+` sits half under the settings gear; if that is the same without the tour, ignore it.
- TASK.md → Built says "see Review notes below" and "see the PR"; fill them in.
- The two flows `T39-setup-later` and `T39-setup-not-now` fail earlier in the shared helper (disclosed); they can't show that Skip works until fixed. Skip from stop 1 is therefore not exercised by any run.
- Dark-mode contrast and the largest-text Lookbook stop are not checked.
- `ExampleCloset` increments `n` during render; harmless, but fragile.

**Verdict: not ready** (defects 1 to 3 code, defect 4 is a weak test; the builder fixes the code and tightens the tests).

### Round 2 (normal mode; the fix commit 203dcdff only; read the diff and the tests, nothing re-run, `npm run check` per the session)
- **Defect 1 (AT4.2, Stylist reads before the settle) fixed.** `settleTourOnce` caches one promise per launch; `StylistScreen` reads `stylist.seenUntil` only after `settleTourOnce(store).then(...)`, and it is the only reader of that key (grep). So whichever of the tab bar and Stylist mounts first, Stylist reads the corrected mark. The write on losing focus waits for `seenUntil !== undefined`, so it can't overwrite before the settle. A failed settle falls to the existing error branch (everything seen), same as a failed read.
- **Defect 2 (VoiceOver on the native bar):** accepted as not verified, now stated in TASK.md and in the `TourHost.tsx` comment (the misleading `accessibilityElementsHidden` is gone).
- **Defect 3 (AT6.1, Skip on stop 1) fixed.** Traced `useTourBlindTab`: during the tour `held` follows the stop's tab and the hook returns undefined; Skip on stop 1 leaves `held = closet`, the render after it still reports undefined, the move to Stylist clears `held` and reports `stylist`; Done on stop 2 behaves the same with `lookbook`; a later real visit to Closet (`held` null) reports `closet` and counts. The layout calls `useClosetArrivals(useTourBlindTab(tab, tour))`, the same composition the tests use.
- **Defect 4 (tests) fixed.** The AT6.1 tests now go through `useTourBlindTab` with the real tab, cover Skip on stop 1, Done on stop 2 and a later real visit (which proves the guard doesn't outlive the tour); the Skip test would fail on the old `tour ? undefined : tab` (the builder's mutation did fail it). The AT4.2 test checks the shared promise and the corrected mark after it. `resetTour()` clears the cached promise, so tests stay independent.
- **Small items:** `ExampleCloset` no longer counts during render; the stale "see Review notes" lines were left as they were.

**Defects open: none. Verdict: ready.**

Small things for later, never blocking:
- No test renders `StylistScreen` to prove it awaits the settle; the guarantee rests on the code (one reader, one `.then` chain) and the shared-promise test.
- The AT6.1 tests copy the layout's one-line wiring instead of rendering the layout; a future edit of `_layout.tsx` could drift from them.
- Still not verified: VoiceOver on the tab bar, AT3.3 by tapping the veiled tabs, Lookbook at the largest text, dark-mode contrast.

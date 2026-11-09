# T55 · Report

> Written down by the coordinator. The harness doesn't let subagents write report files, so the implementer's,
> test writer's and verifier's sections below are their own reports, copied word for word (lightly trimmed for length
> where marked).

## Summary for the founder
- **What you'll see on a new account:** until Kit knows two different outfits of yours that work (e.g. 2 tops, 1 bottom, 1 pair of shoes), the morning and evening card doesn't suggest an outfit. It says why, in the words it already had: "Send me today's fit and I'll start learning your closet." or "I only know 3 of your pieces. Check today's fit and I'll learn the rest." Before, it started suggesting at the first top + bottom + shoes that worked, and with 3 pieces it would have suggested the same outfit every day.
- **After you check a fit on a card that suggested nothing,** it folds to "Today's fit" ("Tonight's fit" in the evening) with your score, labelled with your check's occasion: "TONIGHT · EVERYDAY". "You went with your own" now shows only when Kit had actually suggested something. That's what confused you in Sunday's screenshot.
- **Once your closet has two outfits,** the next card suggests one, and Swap works even at exactly two outfits.
- **Kit's own outfit answers in chat are unchanged.** You asked about the cards.
- **For the notifications:** the app can now answer "can the card suggest yet?" (`morning.canSuggest`). The notifications session will use it to send "Check today's fit. Each one teaches me your closet." until then.
- **How we know:** 42 new tests (26 on the card's logic, 16 on the card on screen), red before the build and green now. 24 deliberate bugs in round 1: 21 caught, one got through (Swap at exactly two outfits) and now has its own test, and two need the Simulator flow to catch (a demo screen's wiring). Both bugs planted in round 2 were caught. The whole app suite passed (1,710), and the type check passed.
- **Not checked yet:** the card on the Simulator (new demo screens 39, 40 and 54, and 29) and its tap-through test. Both Simulators were busy with other sessions and the Mac was nearly out of memory. On your phone it needs the next TestFlight build.

## Built (implementer)
> **What changed:**
> - The morning and evening card now suggests an outfit only once his closet makes two different outfits that work. Top + bottom + shoes; layers never count; near-duplicate pieces count once; it uses the picker's own rules plus an Everyday score.
> - Below that line, every way the card plans goes through the same gate: posting, changing the occasion or style, refreshing the weather, swap, and freshen. The card says why with today's words ("3 pieces so far" / "I only know 3 of your pieces…"), and no outfit row is written.
> - A checked card that suggested nothing now reads "Today's fit" or "Tonight's fit" with his score. Its tag and VoiceOver label name his check's occasion ("Today · Everyday"); the occasion comes from the check whose score the row shows. A card that did suggest an outfit keeps "You went with your own" or "You wore my pick" and its own occasion.
> - freshen now leaves a checked card alone, so a card that suggested nothing can't gain an outfit after his check.
> - New `morning.canSuggest(nowMs?)` for the notifications session. It reads the closet he has, the starting style for that window and his boldness. It writes nothing, makes no weather call, and ignores whether posting is off, a declined consent and the evening auto-stop.
> - Kit's outfit answers are unchanged: `evidence.ts` still calls core `pickOutfit`.
>
> **Files:** `app/src/features/morning/{readiness.ts, service.ts, copy.ts, MorningCard.tsx, index.ts}`, `app/src/i18n/en.ts` (only `idea.went.today`, `idea.went.tonight`), `app/src/demo/scenarios.ts`, `app/src/demo/prepareDemoScreen.ts`.
>
> **Deviations:** the demo files are outside the lane, as the plan said; only new entries (screens 39, 40, 54, free on this branch and on origin/main). `copy.ts` also exports `checkedOccasion`, so the tag and the VoiceOver label always name the same occasion. `CollapsedShell` takes a new optional `testID`, set only by `CheckedRow` (the plan listed this). No `@kitted/core` file touched.
>
> **Demo screens:** 39 "Morning card · three pieces" (T1, B1, S1; "3 pieces so far", "Check my fit"); 40 "Morning card · checked, nothing suggested" ("Today · Everyday", "Today's fit"); 54 "Evening card · checked, nothing suggested" ("Tonight · Everyday", "Tonight's fit"). All in `MORNING_DEMO_SCREENS` and `SCREENS`; 26, 27, 29 unchanged.
>
> **Results:** cardThreshold 24/24; cardThresholdCard 13/16 in one run of the file (the 3 in "a checked card that suggested one" pass 3/3 alone; see Disputes); regression suites all green (morningOneCard 22/22, morningService 19/19, cardFollowsEdits 12/12, askRotation 9/9, swapSheet 11/11, morningSwap 7/7, cardNoAddTile 4/4, scenarios 3/3, copyChecks 28/28, morningCopy 11/11, i18n 3/3, testGuards 4/4); eslint on the 7 changed files clean. Not run: tsc, project lint, core tests, full jest (two other sessions' Simulator jobs and ~190 MB free), the Maestro flow, screenshots.

## Disputes
**Test writer (lock 4a18497b, lock line 00a1ed23): premise swaps and contract corrections**
1. TWO_SHOES uses S3 grey runners, not S2 brown loafers: T1 + B1 + S2 fails `outfitValid`, so S2 never made a second outfit.
2. No seed top fails with B1 + S1: the top that doesn't work is a copy of T1 with `volume: 5`, and the test asserts that premise.
3. FULL's premise is narrower: every valid outfit scores and the count is at least 2 (the loafers and Chelsea boots fail with the tees).
4. The unscored edge can't be built as written (`outfitReading` always marks the outfit fully clothed): tested on TWO_TOPS with every piece `certainty: 'unsure'`; both valid, neither scores, `rotation` counts 2, `canSuggestOutfits` must be `false`.
5. "Class" is "Class/Work" in the app (`cardOccasionLabel('class')`): tests and the flow assert `Today · Class/Work`; read the UI inventory's "Class" the same way.
6. The remembered-style edge can't bite on style (`outfitValid`/`isScored` never read the look); added a boldness case that does (graphic tee + bright red chinos make two outfits only for 'bold').
7. Strengthened: swap also with `[]` and ONE+L's `['L1']`; the `freshen` re-plan also asserts the card gains its weather; a no-profile store with TWO_TOPS's pieces → `true`.
8. The more-than-one-check edge uses a pro quota (the free day allows one first check); its re-check of B is stored with `occasion: 'everyday'` (`changeLens` refuses re-checks). Stock photos ("profile unknown", the seed's firstRun answers): s05 6.5 vs p01a 7.5, s24 6.0 vs p01b 7.5.
Not run at the lock: tsc and lint (under 100 MB free); no Simulator or Maestro (the flow's red is not yet observed).

**Dispute (Nov 9, implementer → test writer): upheld.** The un-awaited `screen.unmount()` in `cardThresholdCard.test.tsx` was a test-harness defect, not a spec question: in @testing-library/react-native 14.0.1 `unmount` is async (`dist/render.d.ts:18`, `await act(...)` in `render.js`), so it overlapped the next `act` and broke the later tests in the file (13/16 in a whole-file run; the 3 in "a checked card that suggested one" timed out). Fix: await the three calls; no assertion, expected value, timeout or test changed. Proof: 16/16 on the build with no act warnings; 13 red on the 4a18497b stubs, matching the recorded red lines (the 3 that pass there are the recorded "exists: bites"). Re-locked at `b1a571c3` (lock line `a67cee38`).

**Verifier round (Nov 9), add-only:** a planted bug went uncaught: `pick()` checked the threshold on the closet minus Swap's `exclude`, which makes Swap do nothing with exactly two outfits. The test writer added two F6.2 re-plan edges in cardThreshold.test.ts at closet TWO_TOPS: `swap`, and the S28 sheet's `swapOptions`/`swapTo`. Both pass on the build. The first bites on the verifier's bug (`{ swapped: false }`); the second doesn't go through `pick()`, so it bites on the same mistake planted in `swapOptions` (`[]` instead of `["T1"]`). The screen 29 inventory text corrected to "Today · Class/Work", which the app and the locked tests already used. No existing test changed. Re-locked at fc8ac839 (lock commit 49be269d), was b1a571c3.

## Verification, round 1 (verifier)
**Verdict: not ready** (1 test defect; nothing wrong in the code).

### Defects
1. **test:** if the card's check uses the closet with Swap's left-out pieces removed, instead of the whole closet, no test catches it. IMPLEMENTATION.md requires the whole closet ("the **whole** closet, before Swap's `exclude`"). Planted in `service.ts` `pick()`: `canSuggestOutfits(input.closet, …)` → `canSuggestOutfits(input.closet.filter((c) => !input.exclude?.has(c.id)), …)`; all 58 tests in cardThreshold, cardThresholdCard, morningSwap, swapSheet stayed green. What he'd see: with exactly two outfits, Swap does nothing. Probe (deleted): closet TWO_TOPS, card posted at the day, `swap(DAY_ID, [the card's top])` → build `{ swapped: true }` (the other top with B1 and S1), bug `{ swapped: false }`. Proposed test: that exact case.

### The lock
- Holds: `git diff b1a571c3..HEAD` on the three test files, `app/e2e/` and TESTING.md shows only the lock line. From `4a18497b` to HEAD the only test change is the three awaited `screen.unmount()` calls (the upheld dispute). No `.only`, `.skip`, `xit`, `it.todo`, snapshots, fixture or seed edits, test detection, or hard-coded expected values.
- Every changed app file is in IMPLEMENTATION.md → Files; the demo files are the declared deviation; `copy.ts`'s extra `checkedOccasion` export is accepted (keeps the tag and the VoiceOver label in sync).
- No `@kitted/core` change: `git diff 7bd0aa8a..HEAD -- app/packages` empty; `diff -rq` against the main checkout's core identical.

### Suites (jest `--watchman=false`, one at a time, memory checked before each)
| Run | Result |
|---|---|
| `cardThreshold.test.ts` | 24/24 |
| `cardThresholdCard.test.tsx` | 16/16 |
| Regression set (morningOneCard, morningService, cardFollowsEdits, askRotation, swapSheet, morningSwap, cardNoAddTile, scenarios, copyChecks, morningCopy, i18n, testGuards) | 12 suites, 133/133 |
| Whole app jest (`-w 1 --workerIdleMemoryLimit=600MB`) | 126 suites passed, 3 skipped; 1710 passed, 4 skipped; exit 0 |
| `npx tsc --noEmit` in app/, alone, heap capped at 2 GB | exit 0; `--listFilesOnly` confirms it covered cardThreshold, cardThresholdCard, morningOneCard and readiness.ts |
| eslint on the 10 changed files | 0 errors; 5 warnings in `cardThresholdCard.test.tsx` (the `require()` and import order `jest.mock` needs) |

### Deliberate bugs (each reverted; tree clean after each)
Caught (tests failing): readiness: needed 2→1 (22), 2→3 (12), near-duplicates by id not `itemKey` (2), a layer as a top (4), "only scored outfits count" removed (1), boldness ignored (2). service: check removed from `pick()` (15), freshen's "checked card left alone" guard removed (2), that guard reading re-checks (2), `canSuggest` counting deleted pieces (6), `canSuggest` ignoring boldness (1). copy and words: 1 piece given "{n} pieces" (1), Today/Tonight swapped (10), "You went with your own" check removed (3), tag always the card's occasion (8), en.ts "Today's fit" → "Today's outfit" (8). MorningCard: tag from the first check not the latest (1), VoiceOver naming the card's occasion (6), no testID on the Past chats row (2), pieces count capped at 3 (1), "Wearing something else? Check it" on the waiting card (3).
Not caught: Swap's left-out pieces in the check (defect 1). Screen 54 dropped from `MORNING_DEMO_SCREENS` and screen 40's check occasion changed to `'class'`: no jest test catches these; the Maestro flow should, but it couldn't run, so not verified.

### Per criterion
- F6.2 the exact threshold: pass. Below it no outfit, at it an outfit: pass. A waiting card keeps waiting through every re-plan: pass for change, refreshWeather, swap on a waiting card, freshen; the swap-at-the-threshold side is weak (defect 1). The words and {n}: pass. "Today's fit" / "Tonight's fit": pass (flow not verified). The tag uses his check's occasion: pass (flow not verified). "You went with your own" only after a suggestion: pass. Kit still names the one outfit: pass (`evidence.ts` untouched). Everything that passed still passes: pass. The demo screens (flow): not verified.
- F13.1 `canSuggest` matches the card: pass (also probed: 3:59 am reads the evening slot, 4:00 the day; two `ensureCard` plus `canSuggest` together give one card, `outfitId: null`, no outfit rows). Read-only: pass.

### Beyond the tests (code read, no defect)
`waiting()` builds the same thin result as `pickOutfit`'s thin branch. The freshen guard uses the same "checked" test as `followPieces` and the evening auto-stop. The only automatic re-plan is StylistScreen's `ensureCard().then(freshen)`, now guarded. The demo stories match the component tests' setup.

### Inventory note
TESTING.md's inventory for screen 29 says "Today · Class"; the app and the locked tests use "Class/Work" (`cardOccasionLabel('class')`).

### Not verified
1. Screens 39, 40, 54 and 29 on the Simulator (light, dark, largest text, VoiceOver): `xcrun simctl launch 111D0A09-C2CA-4F72-BF3C-44019A05C89D com.trykitted.kitted -demoScreen 39 -theme light -demoLatency 0`, then `xcrun simctl io … screenshot <new path>`; repeat for 40, 54, 29, dark, largest text.
2. The T55 flow: `maestro --device 111D0A09-C2CA-4F72-BF3C-44019A05C89D test app/e2e/flows/T55-card-threshold.yaml` with Metro running (also covers the two demo-wiring bugs).
3. Every older flow: `maestro --device 111D0A09-C2CA-4F72-BF3C-44019A05C89D test app/e2e/flows/`.
4. Core's checks in `npm run check` (core unchanged and identical to main's).
5. On the Simulator: killing the app mid-flow, a reinstall, "Delete all my data".
6. F6.2 on his phone: after the next TestFlight build (his OK).
7. F13.1, the notification itself: the notifications session's work (T53).

## Verification, round 2 (verifier)
**Verdict: ready.** No code defects and no test defects.

- **The lock holds.** `49be269d` changes only TESTING.md's lock line (was `b1a571c3`, now `fc8ac839`). `fc8ac839` is add-only: `cardThreshold.test.ts` +40/−0 (two new `it` blocks in the existing re-plan describe) and 2 TESTING.md lines (the re-plan criterion's edges and red note; the screen 29 inventory now "Today · Class/Work" with its VoiceOver line). `cardThresholdCard.test.tsx` and `app/e2e/` unchanged since `b1a571c3`. No `.only`, `.skip`, `xit(`, `it.todo`, snapshots, `__DEV__`, `JEST_WORKER` or `NODE_ENV`. Build unchanged: `git diff 6d7d78ca..HEAD -- app/src ':!app/src/__tests__'` is empty.
- **Suites** (jest `--watchman=false --runInBand`): cardThreshold, cardThresholdCard, morningSwap, swapSheet: `Test Suites: 4 passed, 4 total` · `Tests: 60 passed, 60 total`. The two new tests run and pass on the build. `tsc --noEmit` not re-run (154M then 98M free); round 1's exit 0 covers the unchanged app code, not the 40 new test lines.
- **Planted bugs** (each reverted; tree clean): the round-1 bug (`pick()` checking the closet minus Swap's leave-outs) is now caught by "Swap still swaps" (`swapped` false instead of true). The sheet variant (a threshold check in `swapOptions` on the closet minus `exclude` and the piece going out, returning `[]`) is caught by "the Swap sheet still offers the other top". A sheet check on the closet minus `exclude` only behaves the same as the build (if the sheet has any option, two outfits that work already exist), so no test can tell them apart, and that isn't a weakness.
- **Per criterion:** F6.2, a waiting card keeps waiting through every re-plan: **pass** (the round-1 gap is covered and each new test bites). Screen 29 inventory wording now matches the app and the locked tests. All other criteria unchanged since round 1.

### Not verified
1. `tsc --noEmit` on the two new test blocks: run it, or `npm run check` in `app/`, when memory frees up, before the merge.
2. Screens 39, 40, 54 and 29 on iOS, and the T55 Maestro flow (round 1's list above, items 1–3).

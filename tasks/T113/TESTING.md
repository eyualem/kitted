# T113 · Testing contract

Written by the planner. T113 is a **normal** task: the implementer writes these tests with the code, and one reviewer checks them against this file. A test is never weakened to pass; if one here looks wrong, the implementer writes it as a dispute in TASK.md and the coordinator settles it. Results go in TASK.md, never here.

**Lock:** locked at `f5e230e8` (`T113: tests (red)`), 2026-11-18, on the coordinator's instruction (the test writer wrote them before the code). Files: `app/src/__tests__/T113-styleGame.test.ts`, `app/src/__tests__/T113-styleGameSession.test.ts`, `app/src/__tests__/T113-styleGameScreens.test.tsx`, `app/src/__tests__/T39-setupScreens.test.tsx` (its F1.1 test only), `app/src/testing/styleGameTestKit.ts`, `app/e2e/flows/T113-style-game.yaml`, `app/e2e/common/play-style-game.yaml`, `app/e2e/flows/T39-setup-fresh.yaml`. The implementer doesn't change them; a test that looks wrong is a dispute in TASK.md. The stubs in that commit (`styleGame.ts`, `styleGameSession.ts`, `StyleGameScreen.tsx`, `AddLookSheet.tsx`) are the implementer's to replace. The other T39 retargets under "The tests that change" are still the implementer's. **Re-locked** at `8b0cbd52` (`T113: retarget the old setup tests to the style game`), 2026-11-18, after the build: the coordinator sent the retargets the hook kept from the implementer back to the test writer ("The tests that change" says which were retargeted, which retired, and why). Locked since then as well: `app/src/__tests__/T39-setupScreens.test.tsx` (whole file), `app/src/__tests__/T39-offerCard.test.tsx`, `app/src/__tests__/looksOwnWords.test.tsx`, `app/src/__tests__/scenarios.test.ts`, `app/src/__tests__/toast.test.ts`, `app/e2e/flows/T39-setup-later.yaml`, `app/e2e/flows/T39-setup-not-now.yaml`, `app/e2e/flows/T39-under-18.yaml`, `app/e2e/flows/T39-screens.yaml`. **Re-locked** at `50a0f687` (`T113: verify round 1 tests (T1-T3, C1-C5)`), 2026-11-18, after verify round 1 (REPORT.md): tests added and strengthened only ("Verify round 1" below). Also locked since then: `app/src/testing/t39ScreenMocks.tsx`'s KButton/TextLink pass-through of `maxFontSizeMultiplier`. **Re-locked** at `0624257e`, 2026-11-18: SG2.1's `rank-line` check now expects the founder's new line `Tap the one that's more you.` (#502, commit `953adf18`), still exact and on the ranking stage; it fails if the old `You said Me to {n}.` words come back. **Re-locked** at `d9a22920`, 2026-11-18, for the founder's Nov 18 change (#503; "Nov 18 round" below): the words retargeted, SG1.4 and SG7.5 added, the kit (`styleGameTestKit.ts`: `taught`, `dismissTeach`, `TEACH`, `TAUGHT_KEY`) and the T39 mock's button icon included. **Re-locked** at `ae83ebfa`, 2026-11-18, for the founder's ruling (#504, commit `45f49303`): F1.1 is 18 taps with the lesson's tap. `F1.1 · setup with 3 Me's is at most 16 taps to Stylist, the lesson's tap included` now requires the lesson on a fresh install and at most 16 presses before Check my fit (exactly 16 on seed 42, so one more fails); `T39-setup-fresh.yaml`'s header words only. **Re-locked** at `478d2207`, 2026-11-18, after verify round 3 (REPORT.md): tests added and strengthened only ("Verify round 3" below): T4 (SG1.4's swipe on the lesson itself), T5 (SG7.5's 1.5 s line), T6 (a No cancelled by Back as it leaves) and C7 (Back on card 1 before any answer). **Re-locked** at `238f6103`, 2026-11-18, after verify round 4 (REPORT.md): one test added ("Verify round 4" below), T7 (a No on card 1 cancelled by Back as it leaves, then three fast No's: no check). **Changed after the lock by T114** (`3d344f5b`, 2026-11-18, the founder's name nudge, #506; `tasks/T114/TASK.md`): the About you steps of `T113-styleGameScreens` F1.1, `T39-setupScreens`, `T39-styleProfile`'s placeholder and the T39 flows (`T39-setup-fresh`, `-later`, `-not-now`, `-under-18`, `-screens`) type a name or use the new Skip, because Continue now waits for a name; F1.1's bound (16 presses, 18 taps) is unchanged and nothing was loosened. **On the merge with main** (Nov 18): the style game's demo screens moved from 300–313 to 320–333 (main's rescoring screens took 300–310), so `scenarios.test.ts`'s before-onboarding list and `T113-style-game.yaml`'s `SCREEN` numbers moved with them; the log entries #489–#497 became #500–#506 (and #491 is main's #495).

**Criteria covered:** the spec's acceptance criteria, all of them (the plan line names no "checks:"; IMPLEMENTATION.md → T2): **SG1.1, SG1.2, SG1.3, SG2.1, SG2.2, SG3.1, SG3.2, SG4.1, SG5.1, SG6.1, SG7.1, SG7.2, SG7.3, SG7.4, SG8.1, SG9.1, F1.1** (17). All 17 are below. Plus the T39 criteria whose tests T113 retargets (OS3.1, OS3.2, OS5.7, F1.1's no-camera half), which must still pass.

## Shared set-up
- **Files:** `app/src/__tests__/T113-styleGame.test.ts` (pure: `styleGame.ts`), `T113-styleGameSession.test.ts` (`styleGameSession.ts` on `createMemoryStore()`), `T113-styleGameScreens.test.tsx` (render, with the T39 mocks `@/testing/t39ScreenMocks` imported first, plus `@/testing/styleGameTestKit`). Flows: `app/e2e/flows/T113-style-game.yaml`, `app/e2e/common/play-style-game.yaml`, and the updated `T39-setup-fresh.yaml` (F1.1). Every test name starts with its criterion ID.
- **Seeds are fixed in every test.** Session tests pass `random` (a `seededRandom(7)` or a list of values) to `startOrResumeStyleGame` and `playAgain`; render tests seed through `seedStyleGameForDemo` or a mocked `Math.random`. `endStyleGame()` in `beforeEach`.
- **The profile** (CLAUDE.md rule 6): no photo is used; the players are stated likings in the test (for example "prefers Streetwear > Vintage sport > Outdoor > Workwear"), never a made-up person's age or body.
- **Gestures:** the card's and the row handle's PanResponder handlers are driven with touch histories as `closetDeck.test.tsx` does (`onStartShouldSetResponder`, `onResponderGrant`, `onResponderMove`, `onResponderRelease`, pageX/Y, timestamps). Pure gesture rules are tested directly.
- **Nothing sent:** `global.fetch` is a `jest.fn` that fails the test when called, and the T39 recording transport is never called (as T39).
- **Running them in this worktree (test writer, Nov 18):** `app/node_modules` is a real folder of symlinks, one per entry of the main checkout's `app/node_modules` (`ln -s /Users/eyu/Desktop/files/Kitted/app/node_modules/<entry>`), except `@kitted`, a real folder holding `core -> ../../packages/kitted-core` (this worktree's core); `app/packages/kitted-core/node_modules` links to the main one's. None of it is committed (`.git/info/exclude`). Jest with its own cache: `npx jest --no-watchman --cacheDirectory <scratchpad>/jestcache src/__tests__/T113-`.
- **Test kit:** `app/src/testing/styleGameTestKit.ts` (test only): `setUpGame` puts a game in memory through the session's own calls (a fixed seed, answers, this-or-thats, results changes) before the screen mounts; `playStyleGame({ me })` plays the mounted screen through its buttons and counts the presses; `seedRandom(n)` is a `random` that makes `newSeed` give exactly n.
- **Red until T94** (they need Tailored in `STYLES` and its drawings in `LOOKS`; red for the right reason until T94's app commit lands): `T113-styleGame.test.ts` › `SG1.1 · GAME_LOOKS is the 8 looks of STYLES, in LOOKS' order (needs T94)`; `T113-styleGameScreens.test.tsx` › `SG4.1 · the sheet lists the looks he doesn't have; a tap adds it last and closes`, `SG4.1 · the sheet's Close adds nothing`, `SG7.2 · Add a look on a full list shows {name} in, {old} out with Undo`, `SG9.1 · at accessibility sizes Me and Not me stack, Me on top`, `F1.1 · setup with 3 Me's is at most 16 taps to Stylist, the lesson's tap included`; `T39-setupScreens.test.tsx` › `F1.1 · nothing opens the camera before Check my fit`; and every flow that plays past card 4 on the phone. Checked on a scratch build without Tailored: exactly these failed.
- **Checked against a scratch build:** before locking, every test here passed against a rough scratch build of the interfaces (never committed) with Tailored and the copy patched in temporarily, so a failure after the build is about the build, not the test's mechanics.
- **Flows:** Metro from this worktree on 8082; `maestro --device 111D0A09-C2CA-4F72-BF3C-44019A05C89D test -e PORT=8082 app/e2e/flows/<file>`. Maestro taps by testID (`tapOn: { id: "game-me" }`); the deal is random on a fresh install, so the fresh-install flows never depend on which look is on a card.

## Criteria

- **SG1.1** · A fresh install shows `Me or not me?` after Welcome, with 8 cards in a fresh order; over 2,000 seeded deals every look is first 12.5% ± 1.5%, and no deal puts look-alikes side by side (first and last count).
  - how: unit + component + flow
  - test: `T113-styleGame.test.ts` › `SG1.1 · the deal is the mockup's, exactly (golden seeds)`; `SG1.1 · over seeds 1–2000 every look is first 12.5% ± 1.5%`; `SG1.1 · over 80,000 seeds every look is at every position 12.5% ± 0.5`; `SG1.1 · no deal puts look-alikes side by side, last and first included`; `SG1.1 · each deal is the 8 looks once`; `T113-styleGameSession.test.ts` › `SG1.1 · a new game gets a new seed`; `T113-styleGameScreens.test.tsx` › `SG1.1 · Get started opens Me or not me? on card 1 of 8`; flow `T39-setup-fresh.yaml`
  - expect:
    - `dealFor(1)` = `{ order: ['tailored','vintage_sport','classic_prep','outdoor','smart_casual','workwear','minimalist','streetwear'], flip: 0 }`; `dealFor(42)` = `{ order: ['workwear','classic_prep','streetwear','minimalist','tailored','outdoor','vintage_sport','smart_casual'], flip: 1 }`.
    - Seeds 1–2000: each of the 8 looks is `order[0]` in 11.0%–14.0% of deals (the exact port gives 11.50–13.35).
    - Seeds 1–80,000: every look at every one of the 8 positions in 12.0%–13.0% (#486; the port gives 12.34–12.80).
    - Seeds 1–2000: for every deal and every i in 0–7, `areAlike(order[i], order[(i + 1) % 8])` is false; each order is a permutation of `GAME_LOOKS`; `GAME_LOOKS` has 8 keys, equal as a set to `STYLES` and in `LOOKS`' order.
    - `newSeed(() => 0)` = 1; `newSeed(() => 0.999999999)` ≤ 0x7FFFFFFF; two `startOrResumeStyleGame` calls with an empty session, an empty kv and different `random`s give different seeds.
    - Render: after Welcome's `Get started` → `router.push('/onboarding/looks')`; `StyleGameScreen` shows `game-title` `Me or not me?` (header), `game-line` `One outfit at a time. Would you wear something like this?`, the card's label starting `Outfit 1 of 8, view 1 of 2. `, 8 progress dots.
    - Flow: after `Get started`, `Me or not me\?` is visible; `Step 2 of 3`.
  - must not: a look twice or missing in a deal; Classic prep beside Tailored, Minimal beside Smart casual, Workwear beside Outdoor, Streetwear beside Vintage sport, or Smart casual beside Classic prep anywhere, including last-to-first; the same order every game (seeds 1–2000 give more than 1,000 different orders, and none of them is `GAME_LOOKS` as is, which has Smart casual beside Classic prep).
  - edges: the generator never loops forever (every seed 1–80,000 returns); `expo lint` passes on the session and screen files (the React Compiler rule that keeps `Math.random` out of render).
  - red: 8 tests (pure 6, session 1, render 1) + flows. All fail on "T113: not built" (the stubs), except `each deal is the 8 looks once` (Expected 8, Received 0: the stub's CARD_COUNT), `no deal puts look-alikes side by side` (LOOK_ALIKES `[]` ≠ the 5 pairs) and `GAME_LOOKS is the 8 looks of STYLES, in LOOKS' order (needs T94)` (length 0 ≠ 8). Against the scratch port of the mockup (not committed) the goldens, 11.50–13.35% and 12.34–12.80% reproduced; the T94 test stays red until T94 (STYLES lacks `tailored`: Received 7 looks). Flows `T39-setup-fresh.yaml` and `T113-style-game.yaml` not run (memory, no Simulator booted); red by construction: `Me or not me?`, `game-card`, `game-notme`, `rank-pick-left` exist nowhere in `app/src` yet.

- **SG1.2** · Me and Not me answer by tap and by swipe past the line; Back undoes the last card and keeps the order.
  - how: unit + component
  - test: `T113-styleGame.test.ts` › `SG1.2 · answerCard records the current look, in order`; `SG1.2 · the release rule: 6 pt tap, 90 pt swipe, spring between`; `SG1.2 · swipe feedback: stamps and the lit button`; `T113-styleGameSession.test.ts` › `SG1.2 · Back undoes one card and keeps the deal`; `T113-styleGameScreens.test.tsx` › `SG1.2 · Me and Not me buttons answer the card`; `SG1.2 · a swipe past 90 pt answers, a shorter one springs back`; `SG1.2 · a double tap answers one card`
  - expect:
    - `answerCard(newGame(42), true)` → answers `[{ look: 'workwear', me: true }]`; then `false` → `[…, { look: 'classic_prep', me: false }]`; after 8 answers `currentCard` = null and a 9th `answerCard` returns the game unchanged.
    - `cardRelease(0, 0)` = `peek`; `(5, 3)` = `peek` (hypot 5.8); `(5, 4)` = `spring` (hypot 6.4); `(90, 0)` = `spring`; `(91, 0)` = `me`; `(-91, 0)` = `notMe`; `(40, 0)` = `spring`.
    - `swipeFeedback(45)` = `{ me: 0.5, notMe: 0, lit: null }`; `(120)` = `{ me: 1, notMe: 0, lit: 'me' }`; `(-100)` = `{ me: 0, notMe: 1, lit: 'notMe' }`.
    - Render, seed 42: tap `game-me` → the session's answers `[workwear Me]`, the card label now `Outfit 2 of 8, …` with Classic prep's description; tap `game-notme` → `[…, classic_prep Not me]`; `Haptics.impactAsync('light')` once per answer.
    - A drag on `game-card` to dx 120 then release → one Me answer; dx −120 → one Not me; dx 60 → no answer and the card's translateX back to 0; `Haptics.selectionAsync` once when dx passes 90 outward (and again if it comes back inside and passes it again).
    - Two presses of `game-me` within 100 ms (fake timers) → exactly 1 answer.
    - Session: answer 3 cards, `back()` → `'undone'`, answers length 2, the same seed and `dealFor(seed).order`, `currentCard` = order[2].
  - must not: a swipe under 90 pt answering; a press under 6 pt answering (it peeks, SG7.1); a second answer from a double tap; Back changing the seed or the order.
  - edges: a swipe that starts vertical (10 pt up first) gives the touch to the scroll view and answers nothing (`cardYields(0, 10)` true, `cardYields(12, 0)` false).
  - red: 8 tests (pure 4, session 1, render 3). All fail on "T113: not built" (the stubs), except `the release rule` (TAP_SLOP/SWIPE_LINE 0 ≠ [6, 90]). Bite: with the scratch build's leaving guard removed, `a double tap answers one card` failed (2 answers). The double tap presses twice with no timer between: in the test renderer a native-driver animation ends on the next frame, so "within 100 ms" can only be held as "before the first card has left".

- **SG1.3** · The first card leans once (not under Reduce Motion); the dots show progress.
  - how: unit + component + manual (Simulator)
  - test: `T113-styleGame.test.ts` › `SG1.3 · the lean rule`; `T113-styleGameScreens.test.tsx` › `SG1.3 · card 1 leans once after 1.4 s, never under Reduce Motion`; `SG1.3 · the dots follow the answers`
  - expect:
    - `shouldLean(0, false, false)` true; `(0, true, false)` false; `(0, false, true)` false; `(1, false, false)` false.
    - Render (fake timers, `Animated.timing` spied): no lean animation before 1400 ms; at 1400 ms one lean sequence starts; after it, none more (also after Back to card 1 in the same game); with `a11y.reduceMotion` true, none at any time; touching the card before 1400 ms cancels it; after `playAgain`, card 1 leans again (a new game).
    - Dots: on card 3 (2 answered) `game-progress-dot-0` and `-1` are `ink` and 6 wide, `-2` is 22 wide `ink`, `-3`…`-7` `faint`; `game-progress` is hidden from VoiceOver.
    - Manual: screen 2 on the Simulator, the card leans right then left once (recorded with `xcrun simctl io … recordVideo` or two screenshots ~1.6 s apart), and not with Reduce Motion on.
  - must not: a lean on card 2+, a second lean in the same game, a lean under Reduce Motion.
  - red: 3 tests (pure 1, render 2). All fail on "T113: not built" (the stubs). The lean is read as an Animated.timing/spring whose toValue is 5–60 pt (right first, then left; an exit flies ≥ 200, a spring back is 0). Manual (Simulator video or two screenshots) not done: the verifier's.

- **SG2.1** · With 2+ Me's the ranking shows two Me's on second drawings; with a seeded game, the sides start random and alternate; with 1 Me it's skipped; with 0, SG6.
  - how: unit + component
  - test: `T113-styleGame.test.ts` › `SG2.1 · the stage after card 8 by the number of Me's`; `SG2.1 · the first side is random across seeds and the sides alternate`; `T113-styleGameScreens.test.tsx` › `SG2.1 · Now put them in order shows two Me's on their second outfits`
  - expect:
    - After 8 answers: 0 Me → `stageOf` `results`, `rankStep` `{ done: true, top: [] }`; 1 Me (Minimal) → `results`, top `['minimalist']`, no round; 2+ → `ranking`.
    - Seed 42, Me to Workwear, Streetwear, Outdoor, Vintage sport: the first pair is `['workwear', 'streetwear']` (flip 1: the newcomer Streetwear on the right).
    - Seeds 1–2000, the same four Me's, decided by the order Streetwear > Vintage sport > Outdoor > Workwear: the newcomer is on the left in round 0 in 47%–53% of games (the port gives 51.6%); within every game the newcomer's side alternates round to round (L, R, L… or R, L, R…), with no two rounds in a row on the same side.
    - Render (screen 303's set-up): `rank-title` `Now put them in order` (header); `rank-line` `Tap the one that's more you.` (the founder, Nov 18, #502: no "You said Me to {n}."); `rank-pick-left` and `rank-pick-right` labels are `t('game.desc.workwear.1')` and `t('game.desc.streetwear.1')`; each draws `LOOKS[look].outfits[1]` (the `Outfit` mock receives the second outfit); a tap → `Haptics.impactAsync('light')`, then after 260 ms the next pair.
  - must not: a ranking step with 0 or 1 Me; a pair with a Not me look; a pair on first drawings; the newcomer always on the same side.
  - edges: Reduce Motion: the wait is 120 ms; a second tap during the wait is ignored (one round recorded).
  - red: 4 tests (pure 2, render 2). All fail on "T113: not built" (the stubs). Bite: the scratch ranker with the flip ignored (`i % 2`) failed both pure tests.

- **SG2.2** · Binary insertion places each Me with at most 2 taps after the first; a player who prefers Streetwear > Vintage sport > Outdoor > Workwear and says Me to those four ends with Streetwear, Vintage sport, Outdoor.
  - how: unit
  - test: `T113-styleGame.test.ts` › `SG2.2 · the streetwear player gets Streetwear, Vintage sport, Outdoor on every deal`; `SG2.2 · at most 2 taps per Me after the first`; `SG2.2 · a consistent player always gets his true top 3`
  - expect:
    - Seeds 1–2000, Me to exactly those four, every pair decided by that order: `top` = `['streetwear', 'vintage_sport', 'outdoor']` on all 2000, in at most 5 rounds.
    - For k Me's (k = 1…8; seeds 1–2000, any consistent order), rounds ≤ max(0, 2k − 3): 0, 1, 3, 5, 7, 9, 11, 13 (the first Me free, the second 1 tap, each later one at most 2). Me to all 8 never needs more than 13; 3 Me's never more than 3.
    - For every one of the 336 ordered top 3s (8 × 7 × 6) as a player's true order (the other 5 looks after them in `GAME_LOOKS` order), with Me to his first 3, 4, 5 and 6 looks (seeds 1–100 each): `top` = his first 3, in order.
    - `pickRound` with a look not in the current pair throws; after `done`, `pickRound` throws.
  - must not: a list longer than 3; a Not me look in the top; a result that depends on card order for a consistent player.
  - red: 4 tests (pure). All fail on "T113: not built" (the stubs). Green on the scratch port (2000 deals, k = 1…8 × 2000 × 2 players, 134,400 top-3 games in about 1.2 s).

- **SG3.1** · Drag reorders and the numbers follow; × removes with Undo for 5 s; Back restores each change.
  - how: unit + session + component + manual (a real drag on the Simulator)
  - test: `T113-styleGame.test.ts` › `SG3.1 · moveLook, removeLook`; `SG3.1 · dragTarget: past a row's middle takes its place`; `T113-styleGameSession.test.ts` › `SG3.1 · Back undoes each results change, then the last this-or-that`; `SG3.1 · the toast's Undo undoes only its own change`; `T113-styleGameScreens.test.tsx` › `SG3.1 · dragging a row's handle reorders and the numbers follow`; `SG3.1 · × removes and shows Removed {name} with Undo`
  - expect:
    - `moveLook(['a','b','c'], 0, 2)` = `['b','c','a']`; `(…, 2, 0)` = `['c','a','b']`; out of range → unchanged copy. `removeLook(['a','b','c'], 1)` = `{ picks: ['a','c'], removed: 'b' }`.
    - `dragTarget(0, 140, [40, 110, 180])` = 1 (past row 1's middle at 110, not row 2's); `(0, 190, …)` = 2; `(2, 100, …)` = 1; `(2, 30, …)` = 0; `(1, 110, …)` = 1.
    - Render (screen 304: Streetwear, Vintage sport, Outdoor): drag `results-row-0-handle` down past row 1's middle and release → rows read Vintage sport, Streetwear, Outdoor; `results-row-0-number` `1`, `-1-number` `2`; `Haptics.selectionAsync` once on passing row 1, `Haptics.impactAsync('light')` on the drop; a drag that ends before a row's middle → order unchanged.
    - × on row 1 (Vintage sport) → rows Streetwear, Outdoor; `showToast` called with `Removed Vintage sport` and an undo; running the undo → Streetwear, Vintage sport, Outdoor again. The toast's window is 5000 ms (`TOAST_MS`; 10 s with VoiceOver, the app's rule).
    - Session: from results [S, V, O], move 0→2, then remove 0, then `back()` → after the move again ([V, O, S]); `back()` → [S, V, O]; `back()` → the ranking with its last round undone (stage `ranking`, the draft deleted).
    - `undoChange(token)` after a later change → `false`, nothing changes.
  - must not: Back skipping a change or undoing two; a row number out of step with the order; an Undo that restores a stale list over a newer change.
  - edges: a drag on a 1-row list moves nothing; the ScrollView doesn't scroll while a row is held (`scrollEnabled` false during the drag).
  - red: 7 tests (pure 2, session 2, render 3). All fail on "T113: not built" (the stubs), except `moveLook, removeLook` (MAX_LOOKS 0 ≠ 3). The drag lays rows out through onLayout on `results-row-<i>` (100 pt rows every 110 pt) and drags the handle 150 pt (past row 1's middle for any row pitch 75–150 pt). Manual (a real drag on the Simulator) not done: the verifier's.

- **SG3.2** · Continue is off with no looks and no words, on with either; it saves looks in order, words and Not me's, and goes to About you.
  - how: unit + session + component
  - test: `T113-styleGame.test.ts` › `SG3.2 · canContinue`; `SG3.2 · notMeToSave`; `T113-styleGameSession.test.ts` › `SG3.2 · Continue writes looks, words, Not me's and the step`; `SG3.2 · Continue with nothing writes nothing`; `T113-styleGameScreens.test.tsx` › `SG3.2 · Continue goes to About you`; `SG3.2 · a failed save leaves him on results with Continue working`
  - expect:
    - `canContinue([], '')` false; `([], '   ')` false; `(['minimalist'], '')` true; `([], 'all black')` true.
    - Seed 42, Me to Workwear, Streetwear, Outdoor, Vintage sport, ranked to [Streetwear, Vintage sport, Outdoor], words `'  skater   but clean '` saved: Continue writes kv `onboarding.looks` = `["streetwear","vintage_sport","outdoor"]`, `onboarding.otherStyle` = `skater but clean`, `looks.notMe` = `["minimalist","smart_casual","classic_prep","tailored"]` (GAME_LOOKS order), `onboarding.step` = `basics`; the screen calls `router.push('/onboarding/basics')`.
    - `notMeToSave`: Not me to Outdoor, then Outdoor added from the sheet → Outdoor isn't in `looks.notMe`.
    - With no words, `onboarding.otherStyle` is deleted (not `""`).
    - Render: `results-continue`'s button disabled at screen 313 (no looks, no words) and 310; enabled at 304, 305, 311.
    - Then `finishSetup` (About you 22–25): `profile.styles` = `picksToStyles(['streetwear','vintage_sport','outdoor'])` = `[['streetwear',0.5],['vintage_sport',0.25],['outdoor',0.25]]`; `onboarding.styleGame` deleted; `looks.notMe` and `onboarding.otherStyle` still there; `getStyleGame()` null.
    - A `setKv` that rejects on the first Continue: no `router.push`, the button enabled again, a second tap succeeds.
  - must not: Continue on with nothing; a push before the writes finish; Not me's that include a look on his list; anything sent (`fetch` and the transport untouched).
  - red: 8 tests (pure 2, session 4, render 2). All fail on "T113: not built" (the stubs). On a scratch build without the aboutStep change, `Continue writes looks, words, Not me's and the step` failed on its own assertion (kv `onboarding.styleGame` still held the draft after finishSetup).

- **SG4.1** · Add a look lists only looks he doesn't have; a tap adds it last (or takes #3's place on a full list, SG7.2) and closes the sheet.
  - how: unit + component
  - test: `T113-styleGame.test.ts` › `SG4.1 · addLook and lookChoices`; `T113-styleGameScreens.test.tsx` › `SG4.1 · the sheet lists the looks he doesn't have; a tap adds it last and closes`
  - expect:
    - `lookChoices(['minimalist','workwear'])` = the other 6 in `GAME_LOOKS` order (`streetwear, smart_casual, classic_prep, tailored, outdoor, vintage_sport`); `lookChoices([])` = all 8.
    - `addLook(['minimalist'], 'workwear')` = `{ picks: ['minimalist','workwear'], replaced: null }`; `addLook(['minimalist'], 'minimalist')` = unchanged, `replaced: null`.
    - Render (screen 312): `addlook-tile-*` exist exactly for the 6; none for `minimalist` or `workwear`; each tile's label `{name}: {line}` (today's tile); tap `addlook-tile-outdoor` → results [Minimal, Workwear, Outdoor], `router.back()` once, `Haptics.selectionAsync` once, no toast.
    - The sheet's title `Add a look`; its X label `Close` closes it with nothing added.
    - `results-add` is present on screens 304 (3 looks), 305, 310, 313.
  - must not: a tile for a look already on his list; a 4th row; the sheet staying open after a pick.
  - red: 3 tests (pure 1, render 2). All fail on "T113: not built" (the stubs). Both render tests stay red until T94 (the sheet lists Tailored, whose drawings T94 adds to LOOKS).

- **SG5.1** · His words save and turn Continue on; 80 characters max.
  - how: session + component
  - test: `T113-styleGameSession.test.ts` › `SG5.1 · Done saves trimmed words; blank deletes them`; `T113-styleGameScreens.test.tsx` › `SG5.1 · the words link opens the field; typing turns Continue on`; `SG5.1 · the field keeps its focus and survives a blur` (moved from `looksOwnWords.test.tsx`)
  - expect:
    - Screen 313 (no looks): Continue disabled; tap `results-words-link` → `results-words-input` (placeholder `Like skater, or all black`, `maxLength` 80), focused after 50 ms (the `TextInput` mock's `focus` called); type `a` → Continue enabled before Done.
    - Done → `results-words-saved` `In your words: "a"` and `results-words-edit` `Edit`; kv `onboarding.otherStyle` = `a`. Edit reopens the field with `a`.
    - Session: `setWords('x'.repeat(200))`, `saveWords` → kv holds 80 characters; `setWords('   ')`, `saveWords` → kv deleted and the link shows again.
    - A blur right after the field opens doesn't close it.
  - must not: Continue staying off while he types; more than 80 characters saved; a blank string saved.
  - edges: words stay through Play again (SG3's "his words stay") and through a relaunch (they're in kv).
  - red: 5 tests (session 3, render 2). All fail on "T113: not built" (the stubs).

- **SG6.1** · Not me to all 8 shows Nothing clicked yet with Continue off.
  - how: session + component + flow
  - test: `T113-styleGameSession.test.ts` › `SG6.1 · Not me to all 8 goes straight to results with nothing`; `T113-styleGameScreens.test.tsx` › `SG6.1 · Nothing clicked yet`; flow `T113-style-game.yaml` (screen 310)
  - expect:
    - 8 × `answer(false)` → stage `results`, no ranking round, picks `[]`, `resultsHead` `none`.
    - Render (310): `results-title` `Nothing clicked yet`; `results-line` `Add a look you like, play again, or tell me in your words.`; then in order `results-add` `Add a look`, `results-words-link` `Not quite you? Tell me in your words`, `results-continue` (disabled), `results-play-again` `Play again`; no `results-row-*`.
    - With words saved from before (311): Continue enabled.
    - Adding a look from there → `results-title` `Here's your style`, line the one-look line.
  - must not: a ranking step; Continue enabled with no look and no words.
  - red: 2 tests (session 1, render 1) + flow (screen 310). All fail on "T113: not built" (the stubs). Flow not run (as SG1.1).

- **SG7.1** · Tap card 1 once: it shows that look's second drawing and the second dot is lit; answering counts for that look, and card 2 opens on its first drawing; a swipe past 90 pt answers and never switches the drawing.
  - how: session + component + flow
  - test: `T113-styleGameSession.test.ts` › `SG7.1 · the other outfit is not an answer`; `T113-styleGameScreens.test.tsx` › `SG7.1 · a tap shows the other outfit and lights the second dot`; `SG7.1 · a swipe answers without switching`; `SG7.1 · VoiceOver's Another outfit action`; flow `T113-style-game.yaml`
  - expect:
    - Seed 42, a press-and-release on `game-card` with no movement → the `Outfit` mock gets `LOOKS.workwear.outfits[1]`; `game-card-dot-1` lit (`ink`), `-0` not; label `Outfit 1 of 8, view 2 of 2. {t('game.desc.workwear.1')}`; answers still `[]`; `announceForAccessibility` called with that label.
    - Then `game-me` → answers `[workwear Me]` (the look, whichever outfit); card 2 (Classic prep) draws `outfits[0]`, dot 0 lit.
    - A second tap toggles back to the first outfit.
    - `back()` right after a peek (no answer yet on card 1) → `'exit'` (the peek isn't undone, and nothing else is).
    - A drag to dx 120 from the first outfit → one Me answer, the `Outfit` mock never received `outfits[1]` for that card.
    - `onAccessibilityAction({ nativeEvent: { actionName: 'anotherOutfit' } })` → the second outfit, as a tap does; `accessibilityActions` includes `{ name: 'anotherOutfit', label: 'Another outfit' }`.
    - Flow (screen 2): `tapOn: { id: game-card }` → `assertVisible: "Outfit 1 of 8, view 2 of 2\\. .*"`; `tapOn: { id: game-me }` → `assertVisible: "Outfit 2 of 8, view 1 of 2\\. .*"`.
    - `game-peek-hint` reads `Not sure? Tap it for another outfit.` under `game-hint` `Swipe right for Me, left for Not me.`.
  - must not: a peek recorded as an answer; a peek pushed on Back's history; the next card starting on its second outfit; a swipe toggling the outfit.
  - red: 4 tests (session 1, render 3) + flow (screen 2). All fail on "T113: not built" (the stubs). Flow not run (as SG1.1).

- **SG7.2** · With Outdoor, Vintage sport, Workwear, adding Streetwear gives Outdoor, Vintage sport, Streetwear and `Streetwear in, Workwear out · Undo`; Undo restores the three; the sheet never lists a look already on the list.
  - how: unit + session + component
  - test: `T113-styleGame.test.ts` › `SG7.2 · addLook on a full list takes #3's place`; `T113-styleGameSession.test.ts` › `SG7.2 · the swap and its Undo`; `T113-styleGameScreens.test.tsx` › `SG7.2 · Add a look on a full list shows {name} in, {old} out with Undo`
  - expect:
    - `addLook(['outdoor','vintage_sport','workwear'], 'streetwear')` = `{ picks: ['outdoor','vintage_sport','streetwear'], replaced: 'workwear' }`; `addLook(['outdoor','vintage_sport','workwear'], 'outdoor')` = unchanged, `replaced: null`.
    - Render (results Outdoor, Vintage sport, Workwear; the sheet): tiles for the 5 others only; tap `addlook-tile-streetwear` → rows Outdoor, Vintage sport, Streetwear; `showToast('Streetwear in, Workwear out', undo)`; the toast host draws `Undo` (`common.undo`); running the undo → Outdoor, Vintage sport, Workwear.
    - `Back` after the swap (instead of Undo) → the same three restored.
  - must not: a 4th row; the old #1 or #2 replaced; a sheet tile for Outdoor, Vintage sport or Workwear.
  - red: 3 tests (pure 1, session 1, render 1). All fail on "T113: not built" (the stubs). The render test stays red until T94 (the sheet lists Tailored). It renders the app's ToastHost to see `Undo`.

- **SG7.3** · With 2+ looks the results line reads as FS3; with 1 look, the one-look line.
  - how: unit + component
  - test: `T113-styleGame.test.ts` › `SG7.3 · resultsHead`; `T113-styleGameScreens.test.tsx` › `SG7.3 · the results line by the number of looks`
  - expect:
    - `resultsHead(['a','b'], ['a','b'])` `top`; `(['a'], ['a'])` `one`; `([], ['a'])` `empty`; `([], [])` `none`; `(['a'], [])` `one` (added from Nothing clicked).
    - Render: 304 → `results-title` `Here's your style`, `results-line` `Your top looks, in order. Not quite right? Drag, remove or add one.`; 305 → `Your top look. Not quite right? Add one, or play again.`; after × on 305's only row → the F3 line (`Add a look, or tell me in your words.` until the founder picks); removing one of 304's three → still the FS3 line (2 left).
  - must not: the FS3 line on one look (it mentions Drag); "Nothing clicked yet" on a list he emptied himself (technical default 3).
  - red: 2 tests (pure 1, render 1). All fail on "T113: not built" (the stubs).

- **SG7.4** · Answer 3 cards, Back: card 3 shows again with 2 answers kept; Back on card 1, then forward, resumes the same deal and answers.
  - how: session + component + flow
  - test: `T113-styleGameSession.test.ts` › `SG7.4 · Back undoes exactly one answer`; `SG7.4 · leaving to Welcome and coming back resumes the same game`; `T113-styleGameScreens.test.tsx` › `SG7.4 · Back on card 1 goes to Welcome`; flow `T113-style-game.yaml`
  - expect:
    - Seed 42, answer Me, Not me, Me (Workwear, Classic prep, Streetwear) → on card 4; `back()` → card 3 (Streetwear) shows, answers `[workwear Me, classic_prep Not me]`; `back()` again → card 2.
    - In ranking with 2 rounds made, `back()` → 1 round; with 0 rounds, `back()` → card 8 again (7 answers).
    - On card 1 with 0 answers, `back()` → `'exit'`; the screen calls `router.back()` (or `router.replace('/onboarding/welcome')` when it can't go back); `getStyleGame()` is unchanged (same seed). Unmount, mount `StyleGameScreen` again → the same card 1 of the same deal.
    - Answer 3, unmount the screen and mount it again (the screen recreated, as after a pop and push) → card 4 of the same deal, 3 answers kept.
    - The Looks route is registered with `gestureEnabled: false` (`app/onboarding/_layout.tsx`), so an edge swipe can't leave mid-game (technical default 6).
    - Back after `playAgain` on its card 1 → `'exit'` (Play again cleared history; technical default 2).
    - Flow (screen 300): `tapOn: { id: game-me }` → "Outfit 4 of 8…"; `tapOn: "Back"` → "Outfit 3 of 8, view 1 of 2\\. .*".
  - must not: Back undoing two answers; Back on card 1 undoing anything or reshuffling; a return from Welcome dealing a new game.
  - red: 4 tests (session 3, render 1) + flow (screen 300). All fail on "T113: not built" (the stubs). `the Looks route is registered with the edge swipe off` (session file) failed on its own assertion against today's `_layout.tsx` (no `looks` screen registered: Received undefined). Flow not run (as SG1.1).

- **SG8.1** · Closing mid-game reopens at card 1 with a new deal; closing on results reopens them as left; Delete all my data wipes `looks.notMe`.
  - how: session (memory store; "closing" = `endStyleGame()` with the store kept, as a relaunch empties memory) + flow
  - test: `T113-styleGameSession.test.ts` › `SG8.1 · a close mid-game deals a new game at card 1`; `SG8.1 · a close on results reopens them as left`; `SG8.1 · a close in the ranking deals a new game`; `SG8.1 · Delete all my data wipes looks.notMe and the draft`; `SG8.1 · a bad draft starts a new game`; flow `T113-style-game.yaml` (relaunch block)
  - expect:
    - Answer 3 cards (seed from `random` A), `endStyleGame()`, `startOrResumeStyleGame(store, random B)` → stage `cards`, 0 answers, a different seed; kv `onboarding.styleGame` absent.
    - Results [Streetwear, Vintage sport, Outdoor], move 0→1, words `all black` saved, `endStyleGame()`, start again → stage `results`, picks [Vintage sport, Streetwear, Outdoor], words `all black`, `canUndo` false; `back()` → `'exit'`.
    - A draft of `not json`, `{"v":2}` or `{"v":1,"picks":["capes"]}` → a new game, no throw.
    - Continue, then `deleteAllData` (privacy/wipe.ts with the test's deps) → kv `looks.notMe`, `onboarding.styleGame`, `onboarding.otherStyle` all null.
    - `finishSetup` keeps `looks.notMe` (SG8: "kept with his style profile").
    - `kvPolicy('looks.notMe')` is a synced policy (not `'local'`, not null); `kvPolicy('onboarding.styleGame')` = `'local'`; `syncSchema.test.ts` passes (every `setKv` classified).
    - The device part (a real kill and relaunch): "Not testable yet".
  - must not: a mid-game close resuming the old cards (SG8 says a new deal); results lost on a close; `looks.notMe` surviving a wipe.
  - edges: a close on About you → Back → results from the draft (IMPLEMENTATION → Must not break).
  - red: 6 tests (session) + flow (relaunch block). All fail on "T113: not built" (the stubs). `looks.notMe syncs like his looks…` failed on its own assertion against today's schema (kvPolicy null). Exists, bites: `Delete all my data wipes looks.notMe and the draft` failed with `await d.store.wipe()` commented out of privacy/wipe.ts (looks.notMe still held), reverted. The relaunch block runs on a fresh install with no demo arguments (stopApp, launchApp); not run (as SG1.1). The device kill mid-game stays in "Not testable yet" until that flow has run.

- **SG9.1** · VoiceOver labels and actions as SG9; light, dark and the largest text show nothing clipped (Simulator screenshots); Reduce Motion fades.
  - how: component + unit + screenshots + manual (VoiceOver on the Simulator or the Accessibility Inspector)
  - test: `T113-styleGameScreens.test.tsx` › `SG9.1 · the card reads Outfit n of 8 with Me and Not me as its buttons`; `SG9.1 · results rows read n of total, name, line with Move up, Move down and Remove`; `SG9.1 · moves and removals are announced`; `SG9.1 · at accessibility sizes Me and Not me stack, Me on top`; `T113-styleGame.test.ts` › `SG9.1 · Reduce Motion fades the card`
  - expect:
    - The card: one accessible element, label `Outfit 3 of 8, view 1 of 2. {desc}` on screen 300 (founder question F2); the drawing, dots and stamps are hidden from VoiceOver; `game-me` and `game-notme` are buttons named `Me` and `Not me`.
    - Every `game.desc.<look>.<0|1>` exists, is not empty, has no emoji, and isn't all caps (16 keys); `game.desc.streetwear.0` = `Grey hoodie, washed wide jeans, chunky white sneakers`.
    - Results row 0 on 304: label `1 of 3, Streetwear. Hoodies, graphic tees, baggy jeans or cargos, big sneakers`; actions `moveDown` (`Move down`) and `remove` (`Remove`), no `moveUp`; row 1 has all three; row 2 has `moveUp` and `remove`. `moveDown` on row 0 → [Vintage sport, Streetwear, Outdoor] and `announceForAccessibility` with the F4 move line; `remove` → as ×.
    - Ranking cards are buttons labelled with their second outfit's description.
    - At `isAccessibilitySize` true: `game-me` renders before `game-notme` in the tree and in one column; both `KButton` labels use `CONTROL_TEXT_MAX_SCALE`; results rows put name and line under the drawing; the sheet's tiles are one column.
    - `cardExit(true)` = `{ kind: 'fade', ms: 150 }`; `cardExit(false)` = `{ kind: 'fly', ms: 240 }`; render with Reduce Motion: the answered card animates opacity only (no `translateX` animation started).
    - Screenshots (manual, the verifier): every demo screen in the UI inventory in light and dark at the default size, and 2, 300, 303, 304, 310, 312 at AX5 (`accessibility-extra-extra-extra-large`), in `tasks/T113/shots/<n>-<state>-<light|dark|ax5>.png`; the reviewer checks by eye that no text is cut off and no button runs off screen.
  - must not: an unlabeled button or drawing; the stamps read aloud; a drag-only way to reorder (VoiceOver must have Move up / Move down).
  - red: 7 tests (pure 2, render 5). All fail on "T113: not built" (the stubs). `at accessibility sizes Me and Not me stack, Me on top` stays red until T94 (its sheet part lists Tailored). Not tested in render: "both KButton labels use CONTROL_TEXT_MAX_SCALE" (the T39 KButton mock drops it; the real KButton applies it, so it holds for any KButton: check by eye in the AX5 shots). Screenshots and VoiceOver on the Simulator: the verifier's.

- **F1.1** (new) · A fresh install reaches the camera in 18 taps or fewer with 3 Me's, the lesson's tap included (a Maestro flow). 17 until Nov 18 (#504): card 1's lesson (SG1.4) keeps its own tap; it shows on the first game only.
  - how: flow + component
  - test: flow `T39-setup-fresh.yaml` (rewritten); `T39-setupScreens.test.tsx` › `F1.1 · nothing opens the camera before Check my fit` (retargeted); `T113-styleGameScreens.test.tsx` › `F1.1 · setup with 3 Me's is at most 16 taps to Stylist, the lesson's tap included`
  - expect:
    - Flow, from `launchApp: { clearState: true, clearKeychain: true, permissions: { camera: allow } }` and the dev launcher's server tap (`http://.*:${PORT || '8081'}`, not counted): 1 `Get started`; 2 the lesson (`Swipe right if it's your style, left if it's not.` visible, tapped, gone); 3–5 `game-me` three times; 6–10 `game-notme` five times; then `repeat: { times: 3, while: { visible: { id: rank-pick-left } } }` tapping `rank-pick-left` (taps 11–13 at most); `assertVisible: "Here's your style"`; 14 `Continue`; 15 `22–25`; 16 `Continue`; 17 the card's `Check my fit`; 18 `Agree`; `Take photo` visible. Every assertion of today's flow that still applies stays (no Kit bubble, no `Before your first fit check` before Check my fit, no `Continue free`, no checks-a-day line, `Step 2 of 3` on the game, `Step 3 of 3` on About you, the camera not open after a 3 s wait in Stylist).
    - Render: on a fresh install the game opens with the lesson showing (`teachShown()` = `true`, so its tap is in the count); the walk Welcome → the lesson's tap → game (3 Me's, 5 Not me's, ranking by the left card) → Continue → About you 22–25 → Continue counts at most 16 presses (F1.1's 18 less Check my fit and Agree, as the old 15 came from 17). Seed 42 deals 3 this-or-thats, so the walk is exactly 16 there: one tap more anywhere fails it; `router.push` calls are exactly `['/onboarding/looks', '/onboarding/basics']`, `router.replace` `['/']`; nothing matching `camera|paywall|sign-in|consent`.
  - must not: more than 3 ranking taps for 3 Me's; a 17th tap before Check my fit in render (a 19th to the camera); a sign-in, paywall or agreement screen before Check my fit; the camera opening on its own.
  - red: 2 tests (render 1; T39-setupScreens.test.tsx's retargeted `F1.1 · nothing opens the camera before Check my fit`) + flow `T39-setup-fresh.yaml` (rewritten to the 17 taps, every assertion that still applies kept). Both fail on "T113: not built" (the stubs) and stay red until T94 (the walk draws card 5 of seed 42, Tailored). Flow not run (as SG1.1).
  - red (Nov 18, #504 retarget): the render test is red on today's build (`45f49303`) at `expect(teachShown()).toBe(true)` (received `false`: no lesson on card 1 yet), and stays red until SG1.4 is built. The bound bites: with that line set aside, today's walk is 15 presses; one simulated lesson tap makes 16 (passes), one more makes 17 (fails, "Expected: <= 16, Received: 17"); reverted. The flow already walked the 18 (lesson at tap 2); only its header words changed. Flow not run (the Simulator wasn't needed for a words-only change; the verifier runs it).

## The tests that change
Made by the test writer after the build (Nov 18): the protect-tests hook blocks the implementer from `app/src/__tests__/` and `app/e2e/`, so the coordinator sent them back here. Each was retargeted to the spec's new behaviour, with every check that still applies kept and none loosened. Each then passed against the build (`d2b0e13e` + these edits) and failed against the old grid (`StyleGameScreen` pointed at `PickLooksScreen`) or a planted bug, reverted.
- **`T39-setupScreens.test.tsx`**, retargeted:
  - OS3.1 mounts `StyleGameScreen` on card 1 (`game-title` = `Me or not me?` in place of `What's your style?`) and, new, on Here's your style. Both stages are checked for no bubble and no Kit words, in the same 4 looks × 2 account states.
  - OS3.2 plays the game (seed 42, Me on card 1) and checks, as before, `onboarding.step` = `basics` and the push to `/onboarding/basics`. It also checks that the push comes only after Continue, and that `onboarding.looks` = `["workwear"]`.
  - OS4.5 checks for no "18" on card 1, the this-or-that and Here's your style (it used to check the grid).
  - F1.1 was already retargeted in the lock.
  - Against the grid: OS3.1 failed (no `game-title`), OS3.2 failed (no `game-me`), OS4.5 failed (no `rank-title`). Planted bug: "18 and up" in `game.order.line` failed OS4.5 at `looks ranking`.
  - **Retired:** `OS3.3 · the title and the line` and `OS3.3 · the tiles, Something else? and Continue behave as before`. They tested the tile grid, which the spec replaces ("Changes to other specs": OS3's Looks bullet gives way to the game). What they guarded is now SG1.1 (the title as a header), SG3.2 and SG6.1 (Continue off with no look and no words, no way past Looks without one) and SG5.1 (his own words). A comment in the file says so.
- **`T39-offerCard.test.tsx`** › OS5.7: `walkToCard` plays the game (seed 42, Me on card 1, 8 presses) and Continues. It now also checks `onboarding.looks` = `["workwear"]`; every "nothing sent" assertion stays. Against the grid: failed (no `game-me`).
- **`looksOwnWords.test.tsx`**: its three lessons (a blur doesn't close the field; the field is focused once open, and not by autoFocus; his words are trimmed, shown and saved with Continue) run on Here's your style (`Not quite you? Tell me in your words` → `results-words-input`). The words now show once saved (`In your words: "old money"`, SG5), not while typing. Against the grid: all 3 failed (no words link).
- **`scenarios.test.ts`**: the before-onboarding list gains 300–313. Against the old `scenarios.ts` (at `934af708`): failed.
- **`toast.test.ts`** › U3 (missing from this list before): the EXPECTED table gains the game's three Undo toasts, all 5 s (`false`, technical default 11): `features/onboarding/GameResults.tsx · game.results.removed`, `features/onboarding/AddLookSheet.tsx · game.results.swapped` and `features/onboarding/styleGameSession.ts · last.text` (demo screens 306/307). Planted bug: the removal toast given `{ ms: TOAST_MS_REMOVAL }` failed it (`…removed: true`).
- `syncSchema.test.ts`, `privacyWipe.test.ts`, `onboardingLooks.test.ts`, `T39-noLeak.test.ts`: unchanged, and they pass.
- **Flows:**
  - `T39-setup-later.yaml`, `T39-setup-not-now.yaml` and `T39-under-18.yaml` wait for `Me or not me\?` and then `runFlow: ../common/play-style-game.yaml` (Me on card 1, Not me on the rest, Continue: 10 taps). This replaces the tile and `Continue · 1 of 3`.
  - Their server tap is now `${PORT || '8081'}`.
  - `T39-screens.yaml`'s screen 2 block asserts `Me or not me\?`, the line and `Outfit 1 of 8, view 1 of 2\. .*`, and that `What's your style\?` is gone.
  - **Not run:** T94's verifier holds the Simulator. They are the verifier's to run with `-e PORT=8082`.
- `play-style-game.yaml` (env `ME`, default 1): `ME` × `game-me`, `Not me` while `game-notme` is visible, the ranking's left card while visible (at most 3), `Here's your style` visible, `Continue`.
- No test mounts `PickLooksScreen` any more. Deleting it is the implementer's (TASK.md → Deviations).

## Nov 18 round: Yes / No, card 1 teaches the swipe, the fast-No check (#503; spec `486b188a`)
The founder's test with a real person: a tester thought swiping meant "next outfit". I retargeted every check of the old words, none loosened, and wrote new tests for SG1.4 and SG7.5. On today's build (`486b188a`): 14 red for the right reason (listed below), the rest green; `syncSchema` and `T39-styleProfile` still pass.
- **Words (SG1.1, SG1.2, SG9.1).** The title is `Is this your style?`, the line `One outfit at a time.`, the hint `Swipe right for Yes, left for No.`. The buttons read `No` (left, ✕ icon: `close` or `xmark`) and `Yes` (right, ✓ icon: `check` or `checkmark`), each label exactly those words. The stamps read `Yes` and `No`. At AX sizes Yes is on top. The testIDs `game-me` and `game-notme` are kept. The T39 mock's KButton now draws its `icon` as `mock-button-icon` with `name`, so the icon can be checked.
  - Retargeted: `SG1.1 · Get started opens Is this your style? on card 1 of 8` (also: a fresh install shows the overlay). Red: title received "Me or not me?".
  - Retargeted: `SG1.2 · Yes and No buttons answer the card`. Red: label "Me", no icon.
  - Retargeted: `SG7.1 · a tap shows the other outfit…`. Red: hint received the old line.
  - Retargeted: `SG9.1 · the card reads Outfit n of 8 with Yes and No as its buttons`. Red: stamp received "Me".
  - Renamed: `SG9.1 · at accessibility sizes Yes and No stack, Yes on top`. Its checks are by testID and already hold.
  - Retargeted in `T39-setupScreens`: OS3.1 (`Is this your style?`, plus card 1 with its overlay checked for no bubble) and OS4.5 (no "18" on card 1 with its overlay). Both red: no overlay.
  - Flows: `T113-style-game.yaml`, `T39-screens.yaml`, `T39-setup-fresh.yaml`, `T39-setup-later.yaml`, `T39-setup-not-now.yaml`, `T39-under-18.yaml` and `common/play-style-game.yaml` now use the new words, and assert that "Me or not me?" and "Not me" are gone where they used to appear. Not run: the Simulator was not free. They are red by construction: the new words aren't in the app.
- **SG1.4 (new): card 1 teaches the swipe.**
  - *The flag:* the swipe is taught once kv `onboarding.swipeTaught` holds any value. Dismissing the overlay writes it; it is kept on this phone (`kvPolicy` = `'local'`). `setUpGame` sets it unless `taught: false` (a fresh install).
  - *The tap:* `dismissTeach()` presses the overlay's words. If the words carry no press of their own, it does a press and release with no movement on the card. It must be one tap.
  - `SG1.4 · on a fresh install card 1 shows the overlay; Yes, No and a swipe do nothing until a tap dismisses it`. Expected:
    - `Swipe right if it's your style, left if it's not.` shows exactly once.
    - Yes and No are disabled (dimmed); presses and ±120 pt swipes add no answer and no haptic. A swipe counts as ignored if the overlay covers the card and takes the touch first.
    - One tap removes the overlay, writes the flag, isn't a peek (`workwear.0` still drawn), and Yes then works.
    - Red: the overlay isn't found.
  - `SG1.4 · the overlay shows on the first game only: not after Play again or a relaunch`. Red: no overlay on the fresh install.
  - The lean, retargeted: `SG1.3 · card 1 leans once, after its overlay is tapped away, never under Reduce Motion`.
    - No lean while the overlay shows (5 s).
    - The lean starts within 1.45 s of the tap (keeps T1), right then left, once.
    - No second lean after Back, after Play again or after a relaunch: the spec's "never again" read as once per install, since the lean follows the overlay.
    - None under Reduce Motion.
    - Red: no overlay.
    - Dropped from the old test: "touching the card before 1.4 s cancels it" and "after Play again, card 1 leans again". The spec no longer has the 1.4 s beat, and now says "never again". **Reading to confirm with the founder:** "never again" taken as per install, not per game.
- **SG7.5 (new): FS4, the fast-No check.**
  - *The clock:* "less than 1.5 s after its card appeared" is read on the screen's clock (`Date.now`, which jest's fake timers move). The T39 mocks fix `sessionClock`, so a check timed on it would never see a slow answer here.
  - `SG7.5 · three fast No's show the check before card 4; Keep going goes on to card 4`. After three No's, about 0.6 s each: `Just checking: left means it's not your style.` with buttons `Start over` and `Keep going`, and the 3 No's kept. Keep going shows card 4 (Minimal) with the 3 No's. Red: the check isn't found.
  - `SG7.5 · Start over goes back to card 1 of the same deal, and the check never shows twice`. Start over leaves seed 42, no answers, card 1 (Workwear) and no overlay. Three fast No's again bring no check, and card 4 shows. Red: no check.
  - `SG7.5 · no check when one No took 2 s, when Back came between, or with a Yes`. A control first: three fast No's do show it. Then no check in three cases, each ending on card 4: one No about 2.6 s after its card; No, No, Back, No, No; and Yes, No, No. Red: the control.
- **The walks:** `playStyleGame` taps the overlay away first and counts that tap. Retargeted: `T39-offerCard` OS5.7 and `T39-setupScreens` OS3.2 expect 9 presses for `me: 1` (the tap, then 8 cards). Red today: 8.
- **Settled Nov 18 (#504, `45f49303`): F1.1 is 18.** The founder kept the lesson's own tap, so the render bound is now 16 and the flow's 18 stands (the F1.1 row above). The note below is the conflict as it stood.
- **Conflict for the founder: SG1.4 against F1.1.** F1.1 says a fresh install reaches the camera in 17 taps or fewer with 3 Yes's: Get started, 8 cards, up to 3 this-or-thats, Continue, an age, Continue, Check my fit, Agree. SG1.4's tap makes it 18 at most, and 18 exactly on seed 42.
  - The bound is not loosened. `T113-styleGameScreens` › `F1.1 · setup with 3 Me's is at most 15 taps to Stylist` still requires 15 or fewer presses before Check my fit, with the overlay's tap counted. It passes today (no overlay yet) and will be red, 16 presses, once SG1.4 is built, until the founder rules.
  - `T39-setup-fresh.yaml` now walks 18 taps and says so in its header.
  - Options for him: F1.1 becomes 18; or the overlay goes with the first answer rather than its own tap. The second would need SG1.4 to change: today it says "while it shows, Yes and No are dimmed".

## Verify round 1: tests added and strengthened (test writer, Nov 18)
Add or strengthen only: no test was loosened or removed. Each change was proven red on today's build (`c18febfe`) for the right reason, or, where the build already behaves, shown to bite on the planted bug the verifier found uncaught (reverted each time).
- **T1 · SG1.3** › `card 1 leans once after 1.4 s, never under Reduce Motion`: the lean must have started by 1450 ms (one positive lean move after `advance(1390)` then `advance(60)`). Bite: `LEAN_AFTER_MS` 1400 → 1500 fails it ("expected ≥ 1, received 0" at 1450 ms).
- **T2 · SG8.1** › `a bad draft starts a new game`: the draft list gains `{"v":2,"picks":["streetwear"],"mes":["streetwear"],"notMes":[]}`. Bite: dropping `v.v !== 1` from the draft check fails it.
- **T3 · timeouts:** explicit 20 s timeouts on the long walks: `T39-offerCard` OS5.7; `T39-setupScreens` F1.1, OS3.2 and OS4.5; `T113-styleGameScreens` SG1.3 (the lean), SG3.2 (Continue goes to About you), SG4.1 (the sheet lists…), SG7.2, SG7.4 (Back on card 1), SG9.1 (at accessibility sizes) and F1.1. Each walk is well under 1 s alone. The 5 s default was only exceeded under the full suite's parallel load, with no assertion failing, so the limit is about the machine, not the behaviour; each timeout carries a comment saying so. **Inherited flake, not T113's:** `T39-styleProfile.test.tsx` (3 tests) and `youSettingsHome` (3) also time out at 5 s under default workers, without T113. They were not touched.
- **New, for the code defects** (each red on today's build):
  - **C3 · SG7.4** › `Back while an answered card is leaving undoes that answer, and only it`. On card 3: Me, then Back with no timer between (inside the 240 ms exit on the phone), and again 50 ms after the tap. Expected: answers `[workwear Me, classic_prep Not me]` on card 3 (Streetwear), no `router.back`, no replace. *Why this outcome, not "Back is ignored while leaving":* SG7 says Back "undoes exactly one answer (a card or a this-or-that)", and SG1 says "Back undoes the last card". Once Me is given (haptic, stamp, the card leaving), it is the last answer, so Back undoes it, and nothing before it. Only Me / Not me taps are ignored while a card leaves (the plan's interface), and a silently dropped Back would be the stray-Back slip SG7 guards against. Red today: answers `[workwear Me]` (the in-flight answer dropped and card 2's undone).
  - **C4 · SG3.2** › `two Continue presses at once go to About you once`: both presses in one `act` → `router.push` exactly `['/onboarding/basics']`, and the looks saved. Red today: two pushes.
  - **C5 · SG4.1** › `two tiles pressed at once add one look and close once`: Outdoor then Streetwear in one `act` on screen 312 → picks `[minimalist, workwear, outdoor]` and one back. Red today: both added (Streetwear took #3's place).
  - **C2 · SG9.1** › `the results' text buttons stop growing at 2×`: at AX size, the label Text of `results-add`, the words link, Done, Edit and Play again carries `maxFontSizeMultiplier` = `CONTROL_TEXT_MAX_SCALE` (2). The T39 mock's KButton / TextLink now passes `maxFontSizeMultiplier` to its label, as the real controls draw it, so a fix through TextLink or through the screen's own text both show. Red today: `results-add`'s label has none.
  - **C1 · SG7.1** › `the two outfit dots sit at the top of the card`: within `game-card`, `game-card-dot-0` comes before the drawing in the tree, or its container is pinned to the card's top (`position: 'absolute'`, `top` set, no `bottom`). This checks placement, not looks: how far from the top and how big stay screenshot-only. Red today: the dots come after the drawing and aren't pinned.

## Verify round 3: tests added and strengthened (test writer, Nov 18)
I only added or strengthened tests: none was loosened or removed. Each change is red on today's build (`e22020de`, app code `b3ba32a1`) for the right reason, or bites a planted bug (reverted each time). All runs used Jest `--runInBand`.
- **T4 · SG1.4** › `on a fresh install card 1 shows the overlay; Yes, No and a swipe do nothing until a tap dismisses it`. **Strengthened.**
  - *The gap:* the old swipes ran only when the lesson didn't cover the card. It does (pinned), so no swipe was ever tried, and the "still shown" checks never saw one.
  - *The change:* the test now swipes the lesson itself, +120 pt then −120 pt across its words, released inside it. After each swipe it checks the words still show exactly once and kv `onboarding.swipeTaught` is still `null`. The other checks are kept.
  - *The finger:* a new helper, `swipeFrom`, routes the touch the way React Native's responder system does. Capture runs root first and bubble deepest first. On a move, a node above may take the touch. Touch events bubble along the path. Each event's `currentTarget` measures as a box, so a Pressable measures its press rect as on the phone.
  - *Red:* `expect(screen.getAllByText(TEACH)).toHaveLength(1)` after the first swipe. The swipe dismissed the lesson (C6).
  - *A correct lesson can pass it:* a scratch fix that dismisses only on a release under 6 pt (and still on a press with no coordinates) passes SG1.4 (both tests), SG1.3 and F1.1. Reverted.
  - *Note for the implementer:* `dismissTeach` presses the words with RNTL's `fireEvent.press`, which passes no event. The fix must still dismiss on a press with no event or no coordinates.
- **T5 · SG7.5** › `the 1.5 s line: a No at 1.45 s counts as fast, at 1.55 s it doesn't`. **New.**
  - On card 1 (lesson taught, so the card appears when the screen mounts): a No at 1450 ms, then two fast No's, shows the check. A No at 1550 ms, then two fast, gives no check and card 4 (Minimal).
  - On card 3, up at least 1550 ms (timed from the end of the settle, when the card is certainly up): no check, card 4.
  - The behaviour exists, so it is green. Bites: `FAST_ANSWER_MS` 1500 → 1600 fails it at the 1.55 s case (the check shows); 1500 → 1400 fails it at the 1.45 s case (no check).
- **T6 · SG7.5** › `No, No, a No cancelled by Back as its card leaves, then No: no check`. **New.**
  - No, No, then No on card 3 and Back 50 ms later. The answers are the 2 No's, card 3 shows, no check. Then No: 3 No's, no check, card 4.
  - Green on the build. Bite: removing `back()`'s `if (state && state.stage === 'cards') fastCheckSpent = true;` fails it at the last `checkShown()` (the check shows).
- **C7 · SG7.5** › `Back on card 1 before any answer, then back in: three fast No's still show the check`. **New.**
  - Back on card 1 with no answers: `router.back` once, the game is `{ seed: 42, answers: [], rounds: [] }`. Remount: card 1 (Workwear). Two fast No's: no check. The third: the check, once, with the 3 No's.
  - *Reading:* FS4 says "with no Back in between", which rules out only a Back between his first three answers. A Back before any answer isn't between them. I agree with the verifier.
  - *Red:* `expect(screen.getAllByText(CHECK)).toHaveLength(1)` (C7: `back()` spends the check on any Back during the cards).
- **Left for the founder, not written:** on a fresh install, is the lesson's time part of card 1's 1.5 s?
  - The spec says "after its card appeared". The build counts from when the card can be answered, after the lesson.
  - The spec doesn't settle it, so no test pins it.

## Verify round 4: one test added (test writer, Nov 18)
I only added a test: none was loosened or removed. All runs used Jest `--runInBand`, on `eb064f23`.
- **T7 · SG7.5** › `a No on card 1 cancelled by Back as it leaves, then three fast No's: no check`. **New.**
  - *Set-up:* a fresh game, seed 42, lesson taught.
  - *Step 1:* No on card 1, then Back 50 ms later, before the card has gone. Expected: no answers, still card 1 (Workwear), no `router.back`, no `router.replace`.
  - *Step 2:* three fast No's. Expected: answers are the 3 No's, no check, card 4 (Minimal).
  - *Reading:* the No he took back is an answer, so the Back after it comes between his answers (as in T6 and "No, No, Back, No, No").
  - *Green on the build* (the behaviour exists).
  - *Bite:* dropping `inFlight ||` from `back()`'s FS4 condition fails it at the last `checkShown()` (the check shows). Reverted.
- Whole file: 44/44 pass on the build.
- **Log #505** (the check times card 1 from the lesson's tap) settles the question left open in round 3. No test for it was asked for, so none was written.

## Edges (from the spec and the setup's failure cases)
- **Offline:** the game needs no network; the render tests run with `fetch` failing on any call.
- **A failure mid-way:** a kv write that fails on Continue (SG3.2) or on Done (`saveWords` rejects: the field stays open with his text, Continue still on from memory).
- **A close or crash:** mid-game, in the ranking, on results, on About you (SG8.1).
- **A wipe:** SG8.1. **A reinstall:** a fresh install starts at Welcome, then a new game (flow `clearState`).
- **The 4 am day change:** not involved (the game keeps no dates).
- **Slips the flow test measured (#490):** a double tap (SG1.2), a stray short swipe (SG1.2), a stray Back (SG7.4), Continue right away (results are already a valid list).

## UI inventory
Every state, its words, VoiceOver and testID, and the demo screen. Each screen is screenshotted in light and dark; the starred ones also at AX5. Words marked F<n> are the founder's open questions (IMPLEMENTATION.md).

| State · demo | Element | Words | VoiceOver | testID |
|---|---|---|---|---|
| Card 1 · **2*** | progress bar | — | `Step 2 of 3` | `onb-progress` |
| | Back | — | `Back` | (IconButton) |
| | title | `Me or not me?` | header | `game-title` |
| | line | `One outfit at a time. Would you wear something like this?` | read | `game-line` |
| | card | the first outfit, two dots | `Outfit 1 of 8, view 1 of 2. {desc}` (F2); action `Another outfit` | `game-card`, `game-card-dot-0`, `-1` |
| | stamps (hidden at rest) | `Me` (left, filled), `Not me` (right, outlined) | hidden | `game-stamp-me`, `game-stamp-notme` |
| | 8 dots | — | hidden | `game-progress`, `game-progress-dot-0…7` |
| | hint | `Swipe right for Me, left for Not me.` / `Not sure? Tap it for another outfit.` | read | `game-hint`, `game-peek-hint` |
| | buttons | `Not me` (secondary), `Me` (primary); AX: Me on top | `Not me`, `Me` | `game-notme`, `game-me` |
| Card 3 · **300*** | as 2, dots 0–1 filled, 2 the pill | as 2 | `Outfit 3 of 8, view 1 of 2. …` | as 2 |
| Other outfit · **301** | card on outfit 2, dot 1 lit | — | `Outfit 3 of 8, view 2 of 2. …` | `game-card-dot-1` |
| Swiped past the line · **302** | card held at +120 pt, `Me` stamp shown, `Me` button lit | — | — | `game-stamp-me` |
| Ranking · **303*** | title / line | `Now put them in order` / `Tap the one that's more you.` (#502) | header / read | `rank-title`, `rank-line` |
| | two cards, second outfits | — | buttons, each its description | `rank-pick-left`, `rank-pick-right` |
| Results, three · **304*** | title / line | `Here's your style` / `Your top looks, in order. Not quite right? Drag, remove or add one.` | header / read | `results-title`, `results-line` |
| | rows (drawing with `1` `2` `3`, name, line, ×, handle) | e.g. `Streetwear` / `Hoodies, graphic tees, baggy jeans or cargos, big sneakers` | `1 of 3, Streetwear. …`; actions `Move up`, `Move down`, `Remove` | `results-row-<i>`, `-number`, `-remove`, `-handle` |
| | add row | `Add a look` | button | `results-add` |
| | words link | `Not quite you? Tell me in your words` | button | `results-words-link` |
| | Continue / Play again | `Continue` / `Play again` | buttons | `results-continue`, `results-play-again` |
| Results, one · **305** | line | `Your top look. Not quite right? Add one, or play again.` | read | `results-line` |
| Removed · **306** | toast | `Removed Vintage sport` · `Undo` | announced (the toast's own) | (toast host) |
| In and out · **307** | toast | `Streetwear in, Workwear out` · `Undo` | announced | (toast host) |
| Typing · **308** | field, Done | placeholder `Like skater, or all black`; `Done` | `Your style in your words` (F5); `Done` | `results-words-input`, `results-words-done` |
| Words saved · **309** | saved line, Edit | `In your words: "all black"` (F6) · `Edit` | read; button | `results-words-saved`, `results-words-edit` |
| Nothing clicked · **310*** | title / line | `Nothing clicked yet` / `Add a look you like, play again, or tell me in your words.` | header / read | `results-title`, `results-line` |
| | Continue off | `Continue` | button, dimmed | `results-continue` |
| Nothing clicked, words · **311** | Continue on | as 310 | | |
| Add a look · **312*** | sheet title, X | `Add a look`; X | header; `Close` | (SheetScaffold) |
| | tiles (two outfits, name, line) | today's tiles | `{name}: {line}` | `addlook-tile-<look>` |
| Every look removed · **313** | title / line | `Here's your style` / F3 (`Add a look, or tell me in your words.`) | | |

Loading: the screen draws nothing until the session is ready (well under a frame on the memory store; no spinner). Error: a failed save (SG3.2) shows no new words, the button simply works again. Offline: identical to online.

## Not testable yet
Never dropped, never counted as done.
- **A real finger's swipe, tap-versus-swipe feel and the row drag on a phone** (SG1.2, SG3.1, SG7.1). The tests drive the handlers; the Simulator's `swipe` is a straight scripted line, and #487 found the browser couldn't deliver a drag. · **Would verify it:** the verifier on the Simulator (a `swipe` on `game-card`, a `left_click_drag`-style touch path on a handle with the iOS Simulator tool's `touch_path`), then a founder to-do: "play the style game on your phone: swipe a few cards, tap one to see the other outfit, drag a row" (10 min, P1, unblocks the founder's sign-off of the spec).
- **Haptics** (SG9): the calls are tested; whether they feel right needs a phone. · **Would verify it:** the same founder to-do.
- **VoiceOver end to end** (SG9.1): labels and actions are tested in render; the spoken order and the custom actions' rotor on a device aren't. · **Would verify it:** the Accessibility Inspector on the Simulator by the verifier, or the founder with VoiceOver on (part of the same to-do).
- **SG8.1's close on the device:** the session tests prove the logic; a real kill-and-relaunch in the middle of a game on the dev build is a manual step (Maestro's `launchApp: stopApp` would re-run the demo arguments). · **Would verify it:** the verifier on the Simulator: play to card 4, `xcrun simctl terminate`, relaunch without `-demoScreen`, expect card 1 with a different first card in most tries (a new deal can repeat the order by chance, 1 in a few hundred).
- **Whether the game finds his style for real people** (#490's numbers are a simulation of made-up people). · **Would verify it:** plan.md Y30, the founder's test with friends.
- **Anything T94 hasn't pushed yet:** every render test needs Tailored's drawings in `LOOKS`. Until the rebase onto T94's app commit, only the pure and session tests can run. · **Would verify it:** the rebase (IMPLEMENTATION.md → Picking up T94).

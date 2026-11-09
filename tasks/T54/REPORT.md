# T54 · Report

> Written down by the coordinator. The harness doesn't let subagents write report files, so the implementer's and
> the verifier's sections below are their own reports, copied word for word.

## Summary for the founder
- **What you'll see:** on any evening the Stylist thread gets one evening card (and on any day one day card), however often you open Stylist, switch back to it, or bring the app back to the front while the weather loads. Before, a second open in those few seconds (live weather can take up to 7 s) posted a second copy of the same card. That's the double card you saw on Nov 7.
- The card looks and reads exactly as before. Your Nov 7 duplicate stays in Past chats; this stops new ones.
- **How we know:** 20 new tests on the app's data layer. 13 failed on the old code, the same way your phone did (two calls → two cards), and all 20 pass now. Then 20 deliberate bugs were planted in the fix, one at a time, and every one was caught.
- **Real or mocked:** the weather in the tests is a stand-in that answers when the test says, so the "while the weather loads" window can be held open on purpose. Your phone's data couldn't be read: a TestFlight build is distribution-signed, and iOS doesn't let the Mac copy its data.
- **Not checked yet:** on your phone (needs the next TestFlight build, then 3 evenings of switching tabs while the card loads); the two tap-through tests (Maestro) and the card screens on the Simulator on this branch's code (another session's Metro held the Simulator, and the Mac was out of memory for a second one).

## Built (implementer)
> **What changed, in plain words.** The morning service now posts at most one morning or evening card per day and window, however many times Stylist asks for it at once.
> - While one ask is planning the card for a window (waiting on the weather, up to 7 s on live weather), any other ask for that window waits for it and posts nothing.
> - The waiting ask finishes only after the first has stored its card, so Stylist's chained `freshen()` sees the card.
> - An ask for a different window doesn't wait (a day card in flight at 4:59 pm, the evening card at 5:00 pm).
> - If the first ask fails, the window is released and the next ask can post.
> - After the weather arrives, the service looks again for the card's stored row; if another instance over the same store wrote it meanwhile, this ask writes nothing (no message, no outfit, no row).
> - If the card's chat message exists without its row (the app was killed between the two writes), the next ask adopts that message instead of posting a second card: a new outfit, the message's `outfitId` patched, and the row written with `messageId` = that message.
> - Every gate keeps its order and still applies: posting disabled, he declined fit checks, the 3-evening stop.
> - The card's look, words and buttons don't change.
>
> **Files.** `app/src/features/morning/service.ts`:
> - `ensureCard` now holds a per-id lock: a `Map<ideaId, Promise>` inside `createMorningService`. It is looked at and set with no `await` in between, and cleared in a `finally` only if it still holds that call's promise.
> - The old body moved into a new inner `postCard`. It adds the second look for the row after the forecast, and the adopt-the-posted-message branch ahead of `adoptLegacy`.
>
> **Deviations.** None. One reading of the plan: following step 3b, the adopted message gets a fresh outfit row (`saveOutfit` with no existing id). So the half-written first attempt's outfit row is left unreferenced (source `idea`, not saved, shown nowhere).
>
> **Demo screens.** None new; there is no UI change. The card shows, unchanged, on screens 12, 25–29, 31, 32, 259 (day card) and 30 (evening card).
>
> **Results.** `morningOneCard.test.ts` 20/20; the five regression suites 58/58; full app jest 1668 passed, 4 skipped; core 853/853; tsc and lint clean (0 errors). `npm run check` exits 1 at its jest step because watchman isn't running, so that step was re-run with `--watchman=false`.
>
> **Not done.** F6 on his phone: it needs a new TestFlight build (an EAS build, which needs the founder's OK), then his 3-evening check, as TESTING.md's "Not testable yet" says. His Nov 7 duplicate stays in Past chats, per the plan's default.

## Disputes
None.

**Add-only re-lock (Nov 9, test writer):** added the F6 (with F6.2) line "a fresh setup late in the evening, then the first fit check" from the founder's phone. TestFlight 0.1.0 (1), Sun Nov 8: setup done about 11:51 pm, first check (Everyday, 7.0) at 11:52 pm, and two identical evening cards appeared above his photo. Two tests: the main one and the "location never asked" edge. Red on service.ts at fc05ac89 (two cards), green on the fix in dcc1e669. Re-locked at faba63e8 (was fc05ac89), lock line in c277c823. No existing test changed.

## Verification (verifier)
**Lock:** `git diff fc05ac89..HEAD -- app/src/__tests__/morningOneCard.test.ts app/e2e/ tasks/T54/TESTING.md`
- The test file and `app/e2e/` are unchanged.
- TESTING.md changed only in `358a370a` ("T54: lock tests"), which fills in the lock line and nothing else. The lock holds.

**Banned shortcuts:** none found.
- No `.only`, `.skip`, `xit`, `it.todo`, snapshot, edited fixture, test detection or hard-coded expected value.
- The only skipped suites are the three existing `*.manual.test.ts`.

**Files outside the list:** `plan.md` only: the coordinator's stage marks on the task's own line, in `a873c394` and `acb42901`. The only app code changed is `app/src/features/morning/service.ts`.

**Suites** (each step run alone, memory checked first; jest ran with `--watchman=false` because watchman isn't running):
- `tsc --noEmit`: exit 0.
- Core typecheck: clean.
- `expo lint`: 0 errors, 1 warning (an unused import in `tryOn.test.ts`, not this task's).
- Core tests: `Test Files 30 passed (30)`, `Tests 853 passed (853)`.
- Full app jest: `Test Suites: 3 skipped, 124 passed, 124 of 127 total`, `Tests: 4 skipped, 1668 passed, 1672 total`.
- The task's test file plus the 5 regression suites: `Tests: 78 passed, 78 total` (20 new plus the 58 that passed before).
- Red at the lock (new tests against the old `service.ts`): `Tests: 13 failed, 7 passed, 20 total`. The 7 that pass are exactly the ones TESTING.md marks "exists".
- Server and parity tests: not run, because `firebase/` and `@kitted/core` didn't change.
- Maestro flows: not run (see Not verified).

### Criteria
- **Two calls at once in the evening** (and the 3-call edge): pass. Red at the lock, green now; caught B1 and B18.
- **Two calls at once by day:** pass. Red then green; caught B1, B18, B20.
- **A call while the weather loads** (and the live 7 s timeout edge): pass. Red then green; caught B1, B16, B18.
- **The waiting call resolves after the card is stored:** pass. Red then green; caught B4.
- **A day call in flight doesn't stop the evening card** (and the 4 am edge): pass. An "exists" test; caught B2, B8, B15.
- **A failed call lets the next one post** (and the offline edge): pass. Red then green; caught B3, B5, B17.
- **A card message without its row is adopted** (and the reinstall edge): pass. Red at the lock (2 cards); caught B3, B7, B13, B14, B19.
- **A call that finds the card made meanwhile writes nothing:** pass. Red then green; caught B6, B12.
- **One evening card from 5 pm to 3:59 am:** pass. An "exists" test; caught B8, B15.
- **Location denied, location never asked, an empty closet** (a, b, c): pass. All red then green; caught B1, B18.
- **Gated off** (a, b, c): pass. "Exists" tests; caught B9, B10, B11 in turn.
- **Everything that passed still passes:** pass. The 5 suites are unchanged since the lock and green, and the full suite is green.
- **F6 on his phone:** not verified. Needs the next TestFlight build plus the founder's 3-evening check.

### Break it on purpose
Each bug was applied alone, the task's tests run, then reverted with `git checkout`; the tree was clean afterwards.
- B1: the in-flight check removed. Caught by 10 tests.
- B2: one global lock instead of one per idea id. Caught by both different-window tests.
- B3: the lock never released. Caught by the failed-call and adoption tests.
- B4: the waiting call doesn't wait. Caught by "resolves after stored".
- B5: the waiting call rethrows the first call's error. Caught by the failed-call test.
- B6: the second look removed. Caught by "finds the card made meanwhile".
- B7: adoption removed. Caught by the adoption test.
- B8: `ROLLOVER_HOUR = 0`. Caught by the 5 pm–3:59 am test and the 4 am edge.
- B9: the `enabled()` check removed. Caught by gated (a).
- B10: the consent gate removed. Caught by gated (b).
- B11: `EVENING_IGNORE_LIMIT = 4`. Caught by gated (c).
- B12: the second look moved after the outfit save. Caught by "finds the card made meanwhile" (new outfits 2).
- B13: the adopted message's outfit not patched. Caught by the adoption test.
- B14: adoption returns null. Caught by the adoption test.
- B15: `EVENING_FROM_HOUR = 18`. Caught by the different-window and 5 pm–3:59 am tests.
- B16: the live timeout changed from 7 s to 8 s. Caught by the live edge test.
- B17: a rejected forecast propagates. Caught by the offline edge test.
- B18: the waiting call returns the id. Caught by 13 tests.
- B19: adoption writes the row with a new message id. Caught by the adoption test.
- B20: Monday's day card defaults to Everyday. Caught by the by-day test.

No deliberate bug went uncaught.

### Screens
Evening card (demo 30) and day card (demos 12, 25), each in light, dark and largest text: **not verified**.
- The Simulator's dev build loads from Metro on 8081, which belongs to another session's worktree (`you-and-first-run-c080d4`), so screenshots would show that branch's code.
- Memory was too tight for a second Metro.
- No UI file changed.

### Tried to break it
These ran as throwaway probe tests, deleted afterwards.
- **A hung first call** (`weather.permission()` never resolves), then a second call in the same window: the second call never settles, and no card appears that window until a relaunch.
  - This is new with this fix: before it, the second call would have gone ahead.
  - The forecast has its own 7 s timeout; `permission()` has none. Unlikely, but possible.
  - Proposed test (it needs a planner decision first, a timeout around the whole post): a hung first call still lets a later call post within the weather budget.
- **Two service instances over one store, with their weather landing in the same tick:** both return the id, and there are **2 cards**.
  - Not a defect here: the app has one instance (`features/morning/index.ts`, shared by Stylist and the demo stories), and the criterion covers only a second instance landing after the first finished.
  - But the Interfaces line "One per id, ever" holds only within one instance.
  - Proposed test: only if a second instance ever appears.
- **Stylist's real chain run twice at once**, the card planned offline, the weather back for `freshen`: `[["2026-11-07|evening",true],[null,true]]`, 1 card, the row gains its weather, and the message and row agree on the outfit. Proposed test: this exact chain.
- **Killed between the two writes, then two calls at once on relaunch:** `[id, null]`, 1 card, 1 new outfit. The sequential version is covered; the concurrent one is a proposed test. The killed call's first outfit row is left unreferenced (harmless).
- **4 am, a relaunch, location denied or never asked, an empty closet, offline, a reinstall:** all covered by the tests.
- **"Delete all my data" mid-plan:** not tried. The in-flight card would still be written into the wiped store, as before this task. Proposed test: a wipe during an in-flight `ensureCard` leaves no card.

### Implementer's claims
From `dcc1e669`'s message (the Built section above was copied in afterwards from the implementer's report):
- A per-id in-flight lock: confirmed.
- A waiting call resolves null: confirmed.
- The lock is released on failure: confirmed.
- A second look after the weather: confirmed (it runs before the pick and the outfit save).
- Adopting an orphaned card message: confirmed.
- Every gate kept, in order: confirmed by reading the diff and by B9–B11.

### Defects
None.

### Not verified
- F6 on his phone.
- The two Maestro flows on this branch.
- Demo screens 30, 12 and 25 in light, dark and largest text.

**Verdict:** ready on code and tests; run the Simulator flows and screens before merge. Rounds: 1 of 3.

## Verification, round 2 (verifier)
**Verdict: ready.** No code or test defects. Rounds: 2 of 3.

**Lock:** `git diff faba63e8..HEAD` touches only TESTING.md's Lock line (`c277c823`). `faba63e8` is add-only (+81/−1 in the test file, the one removed line being the widened import; one new TESTING.md line). App code unchanged since `dcc1e669`. No `.only`, `.skip`, `xit`, `it.todo`, snapshots, fixture edits or test detection.

**Suites** (memory checked first; jest with `--watchman=false`):
- `morningOneCard.test.ts` on HEAD: `Tests: 22 passed, 22 total`.
- Red on the old code (`service.ts` at `fc05ac89`, `-t "fresh setup"`): `Tests: 2 failed, 20 skipped`; both received `["2026-11-08|evening", "2026-11-08|evening"]`. Restored; tree clean.
- The task file plus the five regression suites, `--runInBand`: `Test Suites: 6 passed, 6 total`, `Tests: 80 passed, 80 total`.
- Lint on the test file: exit 0.
- **Not run:** full app jest and `tsc --noEmit` (102–286 MB free at every check). The new test file hasn't been type-checked.

### Criterion: F6 (with F6.2), a fresh setup at 11:51 pm, two calls at once, then the first check
**Pass**, the main test and its "location never asked" edge: red on `fc05ac89`, green on HEAD; every assertion of the line is in the test.

| Bug | What it changes | Caught by |
|---|---|---|
| B1 | The waiting call returns the id instead of `null` | both tests |
| B2 | `posting.set(id, post)` removed (no in-flight lock) | both tests |
| B3 | Forecast asked unless `'denied'` (so also when `'unknown'`) | the edge test only, as intended |
| B4 | Row `messageId` set to a fresh id instead of the card's | both tests |
| B5 | Card `createdAt` = `nowMs + 120_001` (after the check) | both tests |
| B6 | `checkInSlot` day comparison swapped (`!==`) | both tests |
| B7 | Both "row already stored" looks removed | both tests |
| B8 | Evening `defaultOccasion` returns `'everyday'` | both tests |
| B9 | Empty-closet `saveOutfit` returns an id instead of `null` | both tests |

### Everything that already passed still passes
**Pass.** The 5 suites are unchanged since `fc05ac89`, 58/58; all 20 earlier tests in the file pass on unchanged app code.

### Not verified (and what would verify it)
- `tsc --noEmit` and the full app jest on HEAD: `npm run check` in `app/` once memory frees up, before merge.
- F6 on his phone: the next TestFlight build (an EAS build, the founder's OK), then the 3-evening check, now including one fresh setup after 5 pm followed by a fit check (one evening card above the photo).
- The two Maestro flows and demo screens 30, 12 and 25 in light, dark and largest text: a free Simulator.
- Open from round 1, unchanged: a hung `weather.permission()` would block that window's later calls until a relaunch (the coordinator found it can't hang today: #405).

# T73 · Report

## Summary for the founder
<filled after verification>

## Built (implementer)
- **Changed:** For the beta, Outfits, Next best buy and Goes with sit behind `OUTFITS_BUILT = false`. Closet opens on his pieces, head to toe, with no Pieces | Outfits control; a saved `closet.segment` is ignored and never written. A piece's page has no Outfits row and no Goes with (no outfit lists are built). Kit's buy card keeps its tag, name and price but drops "+N outfits with what you own", on screen and for VoiceOver; Kit's ranking and the stored gain are unchanged. Adding a basic from Starter essentials says "Added {item}." with Undo. The Next best buy route sends him to Closet. The piece page's note has the new words. Demo screens 182, 183, 184, 193 and 202 turn the switch on; every other screen turns it off.
- **Files:** `app/src/config/features.ts`, `app/src/features/closet/outfitsSwitch.ts` (new), `app/src/features/closet/outfits.ts`, `app/src/app/(tabs)/closet/index.tsx`, `app/src/features/closet/PiecePage.tsx`, `app/src/features/closet/NextBuySheet.tsx`, `app/src/features/ask/cards.ts`, `app/src/features/ask/AskCardView.tsx`, `app/src/features/finish/starterActions.ts`, `app/src/i18n/en.ts`, `app/src/demo/scenarios.ts`, `app/src/demo/prepareDemoScreen.ts`, `app/src/demo/applyDemoScreen.ts`
- **Deviations from IMPLEMENTATION.md:** `starterActions.ts` (Paywall lane) and the three demo files edited with the coordinator's OK (IMPLEMENTATION.md → Answers; DECISIONS-LOG #406). One helper the plan didn't name: `cards.ts` exports `buySpoken(card, on)`; `cardSpoken`'s buy case returns `buySpoken(card, outfitsOn())` (same output), and `BuyCard`'s VoiceOver label uses the same `on` as its visible line, so the React Compiler can't keep a label from before the switch flipped.
- **Not done:** the two Maestro flows (`T73-closet-no-outfits.yaml`, `T73-outfits-on.yaml`) and the 182/183/184/193/202 screenshot comparison with main were not run (the Mac had ~150 MB free and the iPhone 17e's launcher held a dead saved Metro address). Locked unit tests and `npm run check` (1,662 passed, 4 skipped; one existing lint warning in `tryOn.test.ts`) pass. Copied from the implementer's hand-back by the coordinator (the harness refused the implementer's write).
- **See it:** demo 260 (Closet with Outfits remembered, opening on the pieces) · 261 (B1's page, no Outfits row or Goes with, the new note) · 171 (the buy card with no gain line) · 161 (Starter's "Added {item}." toast) · 182, 183, 184, 193, 202 (switch on) · 25 and 13 (the morning card and Kit's idea, unchanged)

## Disputes
- **Round 2 (test writer, Nov 9): two test defects from the verifier, fixed by adding and strengthening only; re-locked at `eaf3301c` (first lock `6511c1f7`).**
  - `T73-closet-no-outfits.yaml`, screen 261: the second stop scrolled to `.*Your photos.*`, which never shows for B1 (no photos in the demo closet; 184 is the same). That made the flow impossible to pass on correct code. It now stops at "No photos of it yet. Wear it in a fit check and they'll show here." and then "Remove from Closet", with the same five must-nots at each (one more stop than before, nothing removed). TESTING.md's 261 inventory line now says what B1's page shows. The whole flow is green on the built code (iPhone 17e, Metro 8082).
  - F3 (Closet writing `closet.segment` while off) wasn't caught. Added `CB1.1 · the Closet screen, switch off: the pieces head to toe, no switcher, and closet.segment never written`. It renders the real `ClosetScreen` on the full closet with `closet.segment` saved as `outfits`, using a memory store behind `@/data/db` and stand-ins for the tiles, questions, Outfits view and the design system. It expects the four headers `Jackets and layers, 3 pieces` / `Tops, 6 pieces` / `Bottoms, 3 pieces` / `Shoes, 4 pieces`, 16 tiles, no `Pieces` / `Outfits` / radiogroup / Outfits view, no `setKv` or `deleteKv` of `SEGMENT_KEY`, and the saved value still `outfits`. It bites via F3 as a loader write, as an effect write and as an effect delete, and via F1 (switcher always drawn); each was reverted. Its twin, `CB1.5 · switch on: the Closet screen has the switcher and opens on the remembered Outfits`, proves the stand-ins can show the switcher. It bites via Closet ignoring the switch. The item left TESTING.md → Not testable yet.

## Verification (verifier)
**Lock:** `git diff 6511c1f7..HEAD` on `closetNoOutfits.test.tsx`, `pieceEdit.test.ts`, `oneCount.test.ts`, `askC7.test.ts`, `app/e2e/` and TESTING.md: only the lock line in TESTING.md (commit `11dd20d1`, "T73: lock tests"). The test writer's edits to the three existing tests (before the lock) follow the spec and weaken nothing: each old assertion now runs with the switch on, and its switch-off twin is in `closetNoOutfits.test.tsx`. · banned shortcuts: none found (no `.only`, `.skip`, `xit`, `it.todo`, snapshots, edited fixtures, under-test checks or hard-coded expected values in app code) · files outside the list: none. `buySpoken` in `cards.ts` is an extra export, logged in Deviations. Nothing changed under `features/morning/`, `features/stylist/`, `outfitActions.ts`, `OutfitsView.tsx`, `nextBuyData.ts`, `gains.ts`, `evidence.ts`, `prompt.ts`, `_layout.tsx`, `sheets/next-buy.tsx`, `@kitted/core` or the Python engine.
**Suites:** `npm run check` (run with `-- --maxWorkers=2` because memory was low): tsc green; core typecheck green; lint 0 errors, 1 warning that was already there (`tryOn.test.ts`, unused `ClosetItem`). The core vitest run failed 2 of 853 on timeouts (`parts.parity.test.ts` "matches every v15 case exactly" at 5536 ms and `tap.test.ts` "every asking parity reading × occasion" at 5950 ms, against a 5000 ms limit; 94 MB of memory free). Run again on their own, both files pass (21/21, 4.1 s). T73 doesn't touch core. Because the chain stopped there, app jest ran separately: `npx jest --no-watchman --maxWorkers=2` (watchman: "unable to talk to your watchman"), with `Test Suites: 3 skipped, 124 passed, 124 of 127 total · Tests: 4 skipped, 1662 passed, 1666 total` (the skipped ones are the `*.manual.test.ts` files). · server: not touched · parity: not touched (core run green when the two timeouts are re-run on their own).
**Flows** (iPhone 17e `499B2157…`, Metro on 8082 from this worktree, `-e PORT=8082`): `smoke.yaml` **green**. `T73-outfits-on.yaml` **green**. `T73-closet-no-outfits.yaml` **red** on the built code: it fails at its 261 step `Scrolling DOWN until ".*Your photos.*" is visible... FAILED`. B1 (khaki chinos, added from Starter essentials) has no photos in the demo closet, so its page shows "No photos of it yet. Wear it in a fit check and they'll show here." and never "Your photos". This happens on screen 184 with the switch on too, so T73 didn't cause it: the step can't pass on correct code (**test** defect, below). Every step before it passed. The steps after it (171, 25, 13) ran from a copy of the locked file with only the "Your photos" block removed, and all passed. `T14-beta-limits.yaml` is red on the 17e at `Assert that "Plan & usage, Kitted beta" is visible... FAILED` (twice). On this phone the dev build's floating "Tools" button (around 349,80 pt) sits over You's Settings gear (bounds [336,55][368,83]), so `tapOn: "Settings"` opens the dev menu instead (screenshot seen). T73 changes no You or Settings file, so this is the flow's environment on the 17e, not a T73 defect. It needs a run on the 17 Pro (busy with another session).

### Criteria
- **CB1.1** · pass · proof: the locked unit tests went red (stubs threw `T73: not built`) and are now green. Deliberate bugs M1, M2 and M3 were caught by `closetNoOutfits.test.tsx`, and F1 by the flow (260 section: `"Pieces" is not visible... FAILED`). The 260 section of the flow is green on the built code. Screenshots: `shots/T73-260-light.png`, `T73-260-dark.png`, `T73-260-ax.png`. Must-not "nothing writes `closet.segment` while off": verified on the diff only. `pick` is the sole writer and is reachable only as the `Segmented`'s `onChange`, which isn't rendered while `view.switcher` is false. Deliberate bug F3 (a write on load while off) is **not caught** by any test; TESTING.md "Not testable yet" predicted this (proposed test below).
- **CB1.2** · pass on behaviour; the locked flow is red because of a test defect · proof: unit bugs M4–M8 were all caught by `closetNoOutfits.test.tsx`. Flow bug F2 (the piece page ignores the switch) was caught by the flow at `"Outfits, .*" is not visible... FAILED`. The flow's 260 and 171 sections are green, and its 261 section is green up to the broken "Your photos" step. The Starter toast was checked on screen 161 in light, dark and the largest text: "Added Black tee." with Undo and its ring, with `.*\+\d+ fits?.*` not visible. That screen's tee would likely add 0 outfits even with the switch on, so the switch-off "+N" case is proven by the unit test (gain > 1), not by this screen. Next best buy's link while off (`openLink kitted://sheets/next-buy` from Stylist, screen 12, and from Closet, 260) lands on Closet's pieces with no "Next best buy" or "What it unlocks" (`shots/T73-nextbuy-link-off.png`). Screenshots: `T73-261-light/dark/ax.png`, `T73-261-note-ax.png`, `T73-261-bottom-ax.png`, `T73-171-light/dark/ax.png`, `T73-161-toast-light/dark/ax.png`.
- **CB1.3** · pass · proof: `CB1.3 · the piece page's note` and `pieceEdit.test.ts` X14 went red and are now green. Bug M9 (one word changed) was caught by both. The flow step `"Got one wrong\? Change it here\. The drawing follows\. Your scores stay the same\." is visible` is green on 261. At the largest text size the note wraps and nothing is cut off (`T73-261-note-ax.png`).
- **CB1.4** · pass · proof: the existing tests listed are green and unedited. Bug M12 (Undo leaves the card "wearing") was caught by `morningService.test.ts` › `wear this logs the day; undo puts it back`. The flow's 25 steps (Swap one → "Swap one piece", "Tap the piece to change."; Wear this → "Logged for today." with Undo; Undo → Wear this again) and 13 steps (Kit's idea Wear this → "Logged for today." with Undo) are green from the copy of the locked file. The diff changes nothing under morning/, stylist/ or `outfitActions.ts`.
- **CB1.5** · pass · proof: `closetNoOutfits.test.tsx` CB1.5 tests went red and are now green. Bugs M10, M11 and M13 were caught. `T73-outfits-on.yaml` is green (182: Pieces/Outfits, count line, "Next best buy: Brown work boots. +18 outfits with what you own. $50–70", Try next, the sheet's "What it unlocks"; 183: No outfits yet; 184: the Outfits row and Goes with). Screenshots on the branch: `T73-182/183/184/193/202-light.png` (182 and 202 show the switch, count line, Next best buy, chips and Try next; 202 shows the fit card; 184 shows the new note). The pixel comparison with `main` is **not verified**: a second Metro from main wasn't affordable (memory). Instead, the diff was read: with the switch on, `closetView` returns `openingSegment` unchanged, `pieceOutfits` returns the old `outfitsWith`/`goesWith` numbers, the piece page builds `buildOutfits` with the same arguments, and `OutfitsView`, `nextBuyData` and `gains` are untouched. Would verify it: the same five screens shot on main and on this branch on one Simulator.

### Break it on purpose
- M1 `closetView` off follows a remembered `outfits` → caught by `CB1.1 · switch off: no switcher, pieces, whatever is remembered`
- M2 `prepareOutfitsDemo` never turns the switch off → caught by `CB1.1 · leaving a switch-on demo screen turns it off`
- M3 `OUTFITS_BUILT = true` → caught by `CB1.1 · the beta build has the switch off` (and 5 more)
- M4 `buyGainLine` ignores `on` → caught by `CB1.2 · Kit's buy card has no outfits line…` and CB1.5's buy-line test
- M5 Starter toast ignores the switch → caught by `CB1.2 · Starter essentials says "Added {item}."…`
- M6 `NextBuySheet` drops the redirect → caught by `CB1.2 · Next best buy's sheet sends him to Closet while off`
- M7 `pieceOutfits` off still returns outfits → caught by `CB1.2 · a piece page builds no Outfits row or Goes with while off`
- M8 `BuyCard` draws the line with `on` forced true → caught by `CB1.2 · Kit's buy card…` (render) and CB1.5
- M9 note "follows" → "changes" → caught by `CB1.3 · the piece page's note` and `pieceEdit.test.ts` X14
- M10 screen 182 loses `outfits: true` → caught by `CB1.5 · the demo screens that show Outfits, and only those`
- M11 `closetView` on always returns pieces → caught by `CB1.5 · switch on: today's opening rule`
- M12 morning Undo doesn't put the card back to `idea` → caught by `morningService.test.ts` › `wear this logs the day; undo puts it back`
- M13 buy gain off by one (`n: gain + 1`) → caught by CB1.5's buy-line test and `askC7.test.ts` P1
- F1 Closet always renders the `Segmented` (`{true ? (`) → caught by the flow's 260 section (`"Pieces" is not visible... FAILED`)
- F2 the piece page builds outfits and calls `pieceOutfits(true, …)` → caught by the flow's 261 section (`"Outfits, .*" is not visible... FAILED`)
- F3 Closet writes `closet.segment` = `pieces` on load while off → **not caught** (expected in TESTING.md; weak spot sent to the test writer)
- Each was reverted with `git checkout -- <file>`, and the tree was clean after each (only the uncommitted `app/metro.config.js`).

### Screens
- Closet, switch off, Outfits remembered · demo 260 · light / dark / largest text · matches the inventory: the "Closet" title (header), section headers "Jackets and layers, 3 pieces" / "Tops, 6 pieces" / "Bottoms, 3 pieces" / "Shoes, 4 pieces" (VoiceOver), tiles in 3 columns (2 at the largest size), "Add an item" present. No radiogroup, no Pieces/Outfits, nothing from Outfits. There are no scans waiting and no To confirm on this closet, so neither shows. The dev build's floating Tools button covers the + (dev build only; it isn't in a release).
- A piece's page, switch off · demo 261 · light / dark / largest text · matches: hero, name, "Bottom", What it is (Kind/Color/Leg), the new note, Worn "6 times", Last worn "October 22", Added "From Starter essentials", then "No photos of it yet…", "Same as another piece…", "Remove from Closet". No Outfits row and no Goes with. The inventory's "Your photos with its count, the photo grid" doesn't apply to B1, which has no photos ("as today": 184 shows the same).
- Kit's buy card, switch off · demo 171 · light / dark / largest text · matches: "Next buy" / "$50–70" / "Brown work boots"; VoiceOver "Next buy. Brown work boots. $50–70." (flow); no gain line.
- Starter essentials toast, switch off · demo 161 after adding Black tee · light / dark / largest text · matches: "Added Black tee." with the ring and "Undo".
- Outfits on · demos 182, 183, 184, 193, 202 · light · today's screens as far as the diff and the flow show. Not pixel-compared with main (above).
- Morning card and Kit's idea · demos 12, 13 (and 25 in the flow) · light · unchanged.

### Tried to break it
- Next best buy's link with the switch off, from Stylist and from Closet → lands on Closet's pieces, with no sheet · proposed test: a flow step `openLink: kitted://sheets/next-buy` from screen 12, expecting `Tops, \d+ pieces` visible and `.*What it unlocks.*` not visible.
- A switch-on screen followed by a switch-off one → each launch starts a new process (`demoOn` is module state, false at start), and `prepareOutfitsDemo` resets it on every demo screen · covered by `CB1.1 · leaving a switch-on demo screen turns it off`.
- Wipe/reinstall (no `closet.segment`) and a junk value → pieces · covered by `closetView(false, n, null | 'junk')`.
- Offline, the 4 am day change → T73's code fetches nothing and reads no date · nothing to test.
- Largest text on 260, 261, 171 and 161 → headers, note and toast wrap; nothing is cut off.
- Double taps / killing mid-flow → T73 adds no write path (only the existing Starter add, which has Undo) · not separately tried.

### Implementer's claims
- "a saved `closet.segment` is ignored and never written" → confirmed on the diff; no test proves "never written" (F3).
- "no outfit lists are built" on the piece page while off → confirmed (`around = []` when off; `buildOutfits` is skipped).
- Buy card on screen and for VoiceOver; ranking and stored gain unchanged → confirmed (unit tests, flow 171).
- "Added {item}." with Undo → confirmed (unit, screen 161).
- Next best buy redirects → confirmed (unit, and `openLink` on the Simulator).
- Demo screens 182/183/184/193/202 on, every other screen off → confirmed (unit, flows).
- Deviations: `starterActions.ts` and the demo files with the coordinator's OK (DECISIONS-LOG #406 exists); `buySpoken` → confirmed.
- `npm run check` "1,662 passed, 4 skipped; one existing lint warning" → confirmed for app jest and lint. On this run core had 2 timeouts under memory pressure, which pass when run on their own.
- "flows and screenshot comparison not run" → true at hand-back; this verification ran the flows (above).

### Defects
- **test** · `app/e2e/flows/T73-closet-no-outfits.yaml`, the 261 section's second scroll: `scrollUntilVisible: ".*Your photos.*"` can't pass, because B1 has no photos in the demo's full closet (the page shows "No photos of it yet. Wear it in a fit check and they'll show here."). Fix: scroll to `Remove from Closet` (or `.*No photos of it yet.*`) instead, and keep the five must-nots after it. TESTING.md's 261 inventory line "Your photos with its count, the photo grid" should say "as today (B1 has none: 'No photos of it yet…')".
- **test** (weak; already named in TESTING.md "Not testable yet") · F3: nothing catches Closet writing `closet.segment` while off. Proposed test: render `ClosetScreen` under jest with `@/design-system`, `useLive` (returning a full-closet `data`, `remembered: 'outfits'`), `@/data/db` (`store.setKv: jest.fn()`) and the router mocked, as `closetNoOutfits.test.tsx` already does for the card and the sheet. Expect no `setKv` call with `SEGMENT_KEY`, no element labelled `Pieces`/`Outfits`, and a header `Tops, 6 pieces`.
- No **code** defects found.

### Not verified
- Pixel comparison of 182/183/184/193/202 with main · needs a second Metro from main on the same Simulator (memory) · the diff review says the switch-on paths are unchanged.
- `T14-beta-limits.yaml` on this branch · on the 17e the dev Tools button covers You's Settings gear · would verify it: a run on the iPhone 17 Pro when it's free (T73 touches no file that flow covers).
- CB1.2 Kit's own words · the founder decided "leave Kit alone" (DECISIONS-LOG #406): not a defect.
- CB1.1–CB1.3 on his phone · the next TestFlight build on his iPhone (founder to-do, P2, 2 minutes).

**Verdict (round 1):** not ready: one locked flow (`T73-closet-no-outfits.yaml`) is red on correct code, and deliberate bug F3 isn't caught. Both are **test** defects for the test writer; there are no code defects. · rounds: 1 of 3

## Verification, round 2 (verifier)
**Lock:** new lock `eaf3301c` (lock line in `62cd67ca`; reason in Disputes). `git diff eaf3301c..HEAD` on the tests, `app/e2e/` and TESTING.md shows only the lock line (plus REPORT.md). The round-2 test changes (`00f78339..eaf3301c`) touch only `closetNoOutfits.test.tsx`, `T73-closet-no-outfits.yaml` and TESTING.md, and they only add or strengthen:
- The 261 flow now stops at "No photos of it yet…", then at "Remove from Closet", with the five must-nots at each stop. Nothing was removed.
- There is a new `ClosetScreen` render test (switch off: four headers, 16 tiles, no switcher or Outfits view, no `setKv`/`deleteKv` of `SEGMENT_KEY`, the saved value still `outfits`) and a switch-on twin.

No app code changed since round 1. Banned shortcuts: none found. Files outside the list: none.
**Suites:** the check chain (tsc, core typecheck, lint, core vitest, then app jest with `--no-watchman --maxWorkers=2`) is green:
- lint: 0 errors, 1 warning that was already there (`tryOn.test.ts`)
- core: Test Files 30 passed (30); the round-1 timeouts didn't recur
- app jest: Test Suites 3 skipped, 124 passed, 124 of 127 total; Tests 4 skipped, 1664 passed, 1668 total
- `closetNoOutfits.test.tsx`: 16/16
- server and parity: not touched
**Which Metro served the app:** after boot the 17e was sent to this worktree's Metro with `openLink kitted://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8082`, and 8082's log showed `iOS Bundled … (2477 modules)`. Every flow launch was served by 8082: `T73-closet-no-outfits.yaml` made 7 launches and 8082 logged 7 bundles; `T73-outfits-on.yaml` made 3 and 8082 logged 3; the F1 run made 1 and 8082 logged 1. Round 1 also ran on 8082's bundle:
- open-demo tapped the `:8082` server on the first launch.
- The round-1 8082 log shows `iOS Bundled` lines, including the 1-module rebuilds for each planted bug.
- Bugs F1 and F2, which exist only in this worktree's files, turned the flow red there.
- Screens 260 and 261 and the new note words exist only on this branch.

So no round-1 Simulator result came from 8081.
**Flows** (iPhone 17e, Metro 8082):
- `T73-closet-no-outfits.yaml` **green** (exit 0): screens 260, 261 (both new stops: "No photos of it yet…" and "Remove from Closet", must-nots green at each), 171, 25 three times, and 13.
- `T73-outfits-on.yaml` **green** (exit 0).
- Round 1 already had `smoke.yaml` green. `T14-beta-limits.yaml` still needs the 17 Pro (see round 1); it wasn't re-run, since no app code changed.

### Criteria
- **CB1.1** · pass · proof: everything from round 1, plus the new `the Closet screen, switch off…` test. It catches F3 as a write in the loader and as a `deleteKv` in an effect (confirmed to fail on `writes()`: "Expected −1 / Received +5", not on a missing import). It also catches F1. The locked flow's 260 section caught F1 on the Simulator (`"Pieces" is not visible... FAILED`). The must-not "nothing writes `closet.segment` while off" is now proven by a test, not only by reading the diff.
- **CB1.2** · pass · proof: everything from round 1, plus the locked flow green end to end on the built code (261's new stops included).
- **CB1.3** · pass · as round 1, and the flow's 261 note step is green in the full run.
- **CB1.4** · pass · as round 1, and the locked flow's 25 and 13 sections are now green in the locked file itself (not a copy).
- **CB1.5** · pass · as round 1, plus the switch-on `ClosetScreen` render twin. `T73-outfits-on.yaml` is green. The pixel comparison with main is still **not verified** (round 1's reason and what would verify it).

### Break it on purpose
- F3, a loader write `if (!on) void store.setKv(SEGMENT_KEY, 'pieces')` → caught by `CB1.1 · the Closet screen, switch off: … closet.segment never written`
- F3b, an effect `deleteKv(SEGMENT_KEY)` while off → caught by the same test (it fails at `writes()`)
- F1, the switcher always drawn (`{true ? (`) → caught by the same unit test and by the locked flow's 260 section on the Simulator
- Each was reverted with `git checkout -- <file>`; the tree was clean after (only the uncommitted `app/metro.config.js`)
- M1–M13 and F2 from round 1 test app code that hasn't changed, against tests that only grew, so they weren't re-planted

### Screens
- Unchanged from round 1 (no app code changed). The paths are in the round-1 section.

### Defects
- None. Both round-1 test defects are fixed: the 261 flow passes on correct code, and F3 is caught.

### Not verified
- Pixel comparison of 182/183/184/193/202 with main · needs a second Metro from main on one Simulator; the diff review shows the switch-on paths are unchanged.
- `T14-beta-limits.yaml` on this branch · needs the iPhone 17 Pro (on the 17e the dev build's Tools button covers You's Settings gear); T73 touches nothing that flow covers.
- CB1.2 Kit's own words · the founder's call ("leave Kit alone", DECISIONS-LOG #406), not a defect.
- CB1.1–CB1.3 on his phone · the next TestFlight build on his iPhone (founder to-do, P2, 2 minutes).

**Verdict:** ready · nothing fails, every deliberate bug is caught, the lock holds, and each "not verified" item names what would verify it. · rounds: 2 of 3

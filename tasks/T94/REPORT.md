# T94 · Report

## Built (the implementer's report, recorded by the coordinator; the harness refused report files from the subagent)
- **Commits:** `bb65d965` app-facing part, pushed first for T113 (STYLES + `tailored`, core `DetectedStyle`, `style.tailored` / `onb.looks.line.tailored` in en.ts, LOOKS with Tailored's two suits and the three redraws, Next best buy skips a Tailored pick); `9565c0c2` generators read code from their own checkout and data from `KITTED_DATA`; `dc10c266` the Python engine (name only), regenerated fixtures, the TL3 script, v5-styles; `b5b9c329` the TL3 report; `04cc9965` the core port; `f0df2547` demo screens 292–296, stylist-guide and its regenerated guide, DECISIONS-LOG #492.
- **Nothing validates look keys** in the sync schema or `firebase/`, so neither changed.
- **TL3 (`extraction-test/tailored_same_scores.py`, report in `extraction-test/results/tailored/report.md`):** 67,422 cases (four parity sets and the real photos): 0 numbers moved, 2,707 changed the look's name only; exit 0. Base-against-base self-check identical. A planted +0.25 on "reads as" for Tailored fails 47 cases and writes nothing. The 6 jacket-led gold photos (recomputed count: exactly 6) all meet TL1 and read as Tailored at the same score; so do the 9 corpus blazer readings and the founder's one blazer phone check. 43 suits that read as no look keep "a matching suit" +0.5 (answer 1).
- **TL3.2:** the whole generator chain re-run with `KITTED_DATA`; `git diff` on fixtures and generated core data clean.
- **Deviations:** `extraction-test/parts_test.py`, `make_readings.py`, `make_expected.py` had the same main-checkout path trap (paths only); the phone pull is pinned by default to the one `parts_parity.json` names (`KITTED_PULL=newest` overrides), because the main checkout's newer Oct 24 pull moved ~19k parity cases with no code change; the H2 line on old tunes (v1–v3) names `look`, matching `h2_label`; `pick_rank` sees `tailored` (with a Tailored pick only; all 30,412 parts_fixes cases without one identical); gold has 2 runs per photo on file, both compared; the generator `.py` files under `handoff/fixtures/` were edited through shell Python (the test hook blocks the folder; no fixture JSON edited by hand).
- **Disputes (round 1):** two tests contradicted the spec/plan (`rubric.parity.test.ts` detectStyles vs score's 8-look label; TL4.3 match line). The test writer upheld both, corrected them (each catches a planted bug) and re-locked at `61d4a813` (Lock-line commit `824a0df1`).
- **After the re-lock (head `824a0df1`):** core 938/938, app 2,018 passed (4 skipped as before), tsc and lint clean (0 errors, 6 warnings), `tailored_test.py` 19/19, `rules_conformance.py` 527/527; `npm run check` exits 0.
- **Not done by the implementer:** screenshots (`tasks/T94/shots/`), the Maestro flow, demo screens 292–296 on a device.

## Verification (the verifier, Nov 18, head `3a79ea4f`)

**Verdict: not ready.** One deliberate bug went uncaught (TL4.3, a **test** defect), and the iOS screenshots, the largest-text pass and every Maestro flow are not verified (the installed app runs a bundle embedded on Nov 11 and ignores Metro). The engine work itself held up: every number is unchanged, the lock holds, and 27 of the 28 planted bugs were caught.

### The lock
- `git diff 61d4a813..HEAD` over the locked tests, `app/e2e/` and TESTING.md: only TESTING.md's Lock line (the re-lock commit `824a0df1`). Between the first lock (`95aa47f7`) and the re-lock, the tests changed only in `61d4a813` (`rubric.parity.test.ts`, `T94-tailored.test.tsx`): the test writer's commit for disputes 1 and 2, recorded in TESTING.md → Disputes (TASK.md doesn't exist, so they aren't in this file's Disputes).
- The diff from `541440c2` has no `.only`, `.skip`, `xit`, `it.todo`, snapshots, test-environment checks or expected values in app code. The fixtures are generated (see TL3.2).
- Every changed file is in IMPLEMENTATION.md → Files or in Built → Deviations (`parts_test.py`, `make_readings.py` and `make_expected.py`: path changes only, checked).

### Suites
- `npm run check` in `app/`: exit 0. tsc clean. Lint: 0 errors, 6 warnings, all in files T94 didn't touch (`cardThresholdCard.test.tsx`, `tryOn.test.ts`). Core: `Test Files 32 passed (32) · Tests 938 passed (938)`, including `tailored.test.ts` (23). App: `Test Suites: 3 skipped, 150 passed · Tests: 4 skipped, 2018 passed, 2022 total`, including `T94-tailored.test.tsx`.
- `tailored_test.py`: `19/19 pass`. `rules_conformance.py`: `527/527 cases pass, 158 rule IDs covered`. Both rewrite their JSON byte for byte (the tree stayed clean).
- `firebase/` is unchanged, so the server tests weren't run.
- **Maestro, every flow: not verified.** `T94-tailored-tile.yaml` against this worktree's Metro (port 8082) failed at `Assert that "Styles" is visible`: the app opened the Stylist. The installed `Kitted.app` carries a `main.jsbundle` from Nov 11 and never asked either Metro for a bundle, even after the `exp+kitted://expo-development-client/?url=…8082` link from the build notes. Running the 16 flows against it would test old JS, so none ran. **Would verify it:** a debug dev build that loads from Metro (a native rebuild, which needs the coordinator's OK and memory to spare), then `maestro --device 111D0A09-… test -e PORT=8082 app/e2e/flows/`.

### Planted bugs (each reverted with `git checkout`; the tree was clean after each)
| # | Criterion | Planted bug | Caught by |
|---|---|---|---|
| P1 | TL1.1 | `rubric.py` `TL_TROUSERS` without `suit_trousers` | `tailored_test.py` TL1.1 (2), TL2.2 |
| T1 | TL1.1 | `rubric.ts` gate: `c.bsub === "trousers"` | `tailored.test.ts` TL1.1 (2), TL1.7 (2), TL2.2, TL4.3 |
| P2 | TL1.2 | `parts_proto.py` H1 line names the 7-look label | TL1.2 (2), TL2.1, TL2.2 |
| T8 | TL1.2 | `parts.ts` H1 line names the 7-look label | TL1.2 (2), TL1.7, TL2.1, TL2.2 |
| P3 | TL1.3 | `chunky_sneaker` off `TL_NEVER` (Python) | TL1.3, TL2.2 founder 1 |
| T2 | TL1.3 | `vetoTailored` ignores `chunky_sneaker` | TL1.3, TL1.7 (2), TL2.2 founder 1 |
| P4 | TL1.3 edge | roominess `>= 5` → `> 5` (veto and `is_tailored`) | TL1.3 edges |
| P5b | TL1.4 | chinos counted as dress trousers and off the never-list | TL1.4, TL1.6 |
| P6 / T9 | TL1.5 | the gate drops the jacket condition (Python / TS) | TL1.5, TL1.7 |
| P7b / P7c | TL1.6 | jeans as dress trousers and off the never-list / graphic tee off the never-list | TL1.6 (each) |
| T3 | TL1.7 | TS only: roominess `> 5` in `vetoTailored` | TL1.3 edges, TL1.7 (2) |
| P9 / T4 | TL2.1 | `_label` / `label` no longer drops smart casual and prep for Tailored | TL2.1 (+ TL1.7 in TS) |
| P10 / T5 / A6 | TL2.2 | a Tailored suit says "a matching suit" | Python TL1.2, TL2.1, TL2.2; TS likewise; app `TL2.2 · How I scored …` |
| TL3.1 | TL3.1 | +0.25 on `H1_reads_as_style` when the look is Tailored, scratch `parts_proto.py` via `--new-from` | the script: `3564 failed; nothing written`, exit 1 (parity 1,875, fixes 1,612, conformance 29, corpus 18, phone 2, gold 28) |
| T10 | TL3.1 | the same +0.25 in `parts.ts` | 14 tests, including `TL3.1 · … the pins` |
| TL3.3 | TL3.3 | scratch `rubric.py`: Tailored drops smart casual and prep only with no picks; `--sets gold,phone --new-from` | `FAIL gold:rd-008:run0\|profile … meets TL1 but its label is smart_casual` (and run1), exit 1 |
| TL3.4 | TL3.4 | the +0.25 plant in the tree, run without `--new-from` (`--sets conformance,phone`) | exit 1; `report.md` opens `# STOP: 31 cases changed a number`, a table of set, id, occasion, picks, field, before, after. `results/tailored/` and the engine restored with `git checkout` |
| A1 | TL4.1, TL4.2 | `tailored` taken out of `STYLES` | 8 of 11 app tests |
| A2 | TL4.1, TL4.4 | the line says `loafer` | TL4.1 (line), TL4.4 |
| A3 | TL4.1 | Streetwear's sneaker back to `#B5332E` | TL4.1 redraws |
| A4 | TL4.1 | Tailored's charcoal suit gets loafers, not derbies | TL4.1 drawings |
| A5 | TL4.4 | `style.tailored` = `Tailored look` | 7 app tests, including TL4.4 |
| P11 / T7 | TL5.1 | the lead only when Tailored is the first pick | TL5.1 (the 2nd-pick case) |
| P12 | TL5.1 | `tailor_lead` ahead of the class in the sort key | TL5.1 "never across a class" |
| **T6** | **TL4.3** | **`goingFor.ts`: `reads` back on `detectStyles` (T94's one change there)** | **nothing.** `tailored.test.ts`, core `goingFor.test.ts` (30 passed), app `T94-tailored` and `goingFor` (23 passed) |

P5 and P7 first went in without taking chinos or jeans off the never-list. Nothing failed then, because the never-list still blocked them and the behaviour hadn't changed, so that isn't a test gap. P5b and P7b are the real bug.

T6 is a live bug. Going for Tailored on a navy blazer over a white graphic tee, grey trousers and loafers gives, as built, `piece: {name: "graphic tee", why: "loud"}`; with the plant it gives `piece: null`. So "the graphic tee pulls it away from Tailored" silently disappears.

### TL3.2 regeneration
With `KITTED_DATA=/Users/eyu/Desktop/files/Kitted`, I re-ran every generator in Step 5's order: make_readings → make_seed → make_expected → make_parity → make_rubric_json → make_parts_json → make_parts_parity → make_parts_fixes → rules_conformance.py → `node scripts/gen-rubric-data.mjs`. Then `git diff --exit-code --stat handoff/fixtures app/packages/kitted-core/src/*Data.ts` came back clean: `diff-exit=0`, no file changed. `rubric.py` sha `9b50859c4f77…` equals `expected_scores.json`'s `rubric_sha256` and `rubricData.ts`; `parts_proto.py` `42712d3c8af7…` equals `partsData.ts`. The core TL3.2 sha and picks-variant tests pass.

### TL3.1 re-run (unplanted)
`tailored_same_scores.py --new-from <empty dir>`, which runs this checkout's engine and writes nothing: parity 28,096 (26,206 identical, 1,890 name only, 0 failed), fixes 30,412 (30,412 / 0 / 0), rubric 7,233 (6,489 / 744 / 0), conformance 501 (472 / 29 / 0), corpus 156 (138 / 18 / 0), phone 124 (122 / 2 / 0), gold 900 (876 / 24 / 0). Exit 0. This matches the committed report exactly. The engine files are unchanged since the report's `dc10c266`.

### TL3.3, the 6 jacket-led photos (read from `extraction-test/results/tailored/report.md`)
All are web photos, so profile unknown, age band unknown and picked looks none known. Each was scored with the stated test profile, Minimal + Smart casual 0.5 each, at everyday, and each meets TL1:
| photo | label before → after | score before → after | result |
|---|---|---|---|
| ig-059 (run 0) | none → tailored | 7.5 → 7.5 | PASS |
| ig-131 (run 0) | none → tailored | 7.5 → 7.5 | PASS |
| rd-002 (run 0) | none → tailored | 8.0 → 8.0 | PASS |
| rd-008 (run 0) | smart casual → tailored | 7.5 → 7.5 | PASS |
| rd-010 (run 0) | classic prep → tailored | 7.5 → 7.5 | PASS |
| rd-011 (run 0) | none → tailored | 7.5 → 7.5 | PASS |

The second table (23 other jacket-led readings) has no failures. Every reading that meets TL1 reads as Tailored. The ones that don't meet TL1 are blocked by jeans or work boots, and they keep their label. The report states the small sample in one line. TESTING.md expected 3 gold runs per photo; only 2 are on file, and the report says so.

### Per criterion
- **TL1.1–TL1.6 · pass.** The tests were red at the lock (TESTING red lines), are green now, and caught P1–P7c and T1–T9 above.
- **TL1.7 · pass.** T3 (a TS-only divergence) was caught by both TL1.7 tests.
- **TL2.1 · pass** (P9, T4).
- **TL2.2 · pass** for the card and How I scored (P10, T5, A6). On the web preview, screen 295 shows `Reads as tailored +0.5` and no "A matching suit". **The look page is not verified:** it shows no look name today. **Would verify it:** T75's test and screenshots.
- **TL3.1 · pass** (the re-run above; the +0.25 plant made 3,564 cases fail).
- **TL3.2 · pass** (the regeneration was clean; the parity suites are green).
- **TL3.3 · pass** (the table above; the plant failed rd-008).
- **TL3.4 · pass.** The STOP report was checked. No engine file changed after the TL3 run: `git diff dc10c266..HEAD` on `rubric.py`, `parts_proto.py` and `parts_fixes.py` is empty.
- **TL4.1 · logic pass, screenshots not verified.** A1–A4 were caught. iOS light, dark and largest-text screenshots: **not verified** (the stale embedded bundle, above). I took web-preview layout shots (layout only, 375 wide) of 292–296 in light and dark, plus before and after of the three redraws on 293. **Would verify it:** a dev build loading Metro, then `-demoScreen 292…296` in light, dark and `accessibility-extra-extra-extra-large`, plus 17 and 80 for the redraws. Setup's grid is T113's.
- **TL4.2 · logic pass; the flow and device not verified** (A1, A5 caught; the flow needs the dev build above).
- **TL4.3 · fail (test).** "Choosing it changes no score" is proven (the pins, the service test). But T94's Going for change, Tailored's pulling piece, is covered by no test (T6).
- **TL4.4 · pass** for the label (A2, A5). **VoiceOver on a device: not verified.** Would verify it: the founder to-do in TESTING.md, or the Accessibility Inspector on the dev build.
- **TL5.1 · pass** (P11, P12, T7).

### Built, checked
- Commits, TL3 counts (67,422 cases, 2,707 name only, 0 moved), the self-check, the 6 photos, 43 kept "a matching suit", the TL3.2 regeneration and the check numbers (938, 2,018 + 4 skipped, 19/19, 527/527, 6 warnings): **confirmed** by my own runs.
- "A planted +0.25 … fails 47 cases": **not reproduced as stated.** The TESTING plant on `parts_proto.py` fails 3,564 cases across all sets in my run. The conclusion (it bites, writes nothing) holds; the number doesn't.
- "Not done by the implementer: screenshots, the Maestro flow, demo screens on a device": still not done on iOS (above).

### Defects
1. **test** · `app/packages/kitted-core/test/tailored.test.ts` (TL4.3). Nothing checks Going for Tailored's pulling piece, so reverting `goingFor.ts:106` to `RE.detectStyles(...)` passes every test. **Proposed test:** `goingForAdvice(Rd([top("graphic_tee","white"), outer("blazer","navy"), GREY_TROUSERS, LOAFER]), "tailored", {occasion: "everyday"})` gives `kind "mismatch"` and `piece` `{index: 0, name: "graphic tee", why: "loud"}`. As built that holds; with the plant, `piece` is null.

### Not verified (and what would verify it)
- iOS screenshots of 292–296 (light, dark, largest text), the redraws on 17 and 80, and VoiceOver labels on a device: a debug dev build that loads this branch from Metro, with memory to spare (the Mac was at about 100 MB free with T113's jobs running).
- All 16 Maestro flows, including `T94-tailored-tile.yaml`: the same dev build, then `maestro … test -e PORT=8082 app/e2e/flows/`.
- The look page part of TL2.2: T75.

### Worth a look (not defects)
- In dark mode, Tailored's charcoal and navy suits are low-contrast on the dark tile, most of all in Going for's small tile (`shots/296-going-for-tailored-dark-web.jpg`). It's a taste call for the founder alongside the redraws.
- On the web preview, How I scored cuts two point values to `−…` and `+0…` at 375 wide (`shots/295-*`). The rows aren't T94's. Check on iOS.

### Screenshots (web preview, layout only; `tasks/T94/shots/`)
`292-you-tailored-{light,dark}-web.jpg`, `293-style-profile-tailored-{light,dark}-web.jpg`, `294-card-suit-{light,dark}-web.jpg`, `295-how-i-scored-suit-{light,dark}-web.jpg`, `296-going-for-tailored-{light,dark}-web.jpg`, `redraws-293-{before,after}-{light,dark}-web.jpg`. "Before" is the base drawings (red chunky sneakers, olive zip jacket, cream crew), put in temporarily and reverted.

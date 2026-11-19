# T94 · Testing contract (strict)

The session wrote this file; the test writer writes and locks the tests. The task's logic criteria go here, never words, labels or layout: those are screenshots, kept in the UI inventory below. **Locked once the Lock line is filled.** After that only the test writer changes this file or the tests, only to add or strengthen, with the reason in TASK.md → Disputes.

**Lock:** `51ac0d39` (`51ac0d39abe90054ad9dbb02ea29ad52d5136354`) · 2026-11-18 (re-locked after the merge with T69, Disputes 4 below; before: `7fff88a0` after Disputes 3, `61d4a813` after disputes 1 and 2, first lock `95aa47f7`) · tests: `extraction-test/tailored_test.py`, `handoff/fixtures/tailored_base_v15.json` (the v15 pins), `handoff/fixtures/tailored_main_v16.json` (the v16 pins, Disputes 4), T69's `app/packages/kitted-core/test/v15Unchanged.test.ts` (T69-G2, Disputes 4), `extraction-test/rules_conformance.py` (TLR cases and updated cases), `app/packages/kitted-core/test/tailored.test.ts`, `app/packages/kitted-core/test/rulesConformance.test.ts` (the `fix_order` mirror), `app/src/__tests__/T94-tailored.test.tsx`, `app/e2e/flows/T94-tailored-tile.yaml`, `app/src/__tests__/{styleKeys,onboardingLooks,lookPacks,cardContent,goingFor}.test.ts`, `app/packages/kitted-core/test/rubric.parity.test.ts` (dispute 1); stubs in `app/packages/kitted-core/src/rubric.ts` and `index.ts`

**Spec:** `specs/tailored.md`, the version on main (approved 2026-11-13). If the coordinator moves T94 onto the Nov 17 version (IMPLEMENTATION.md → founder 4), TL3's lines are rewritten against the rescoring engine before the lock.

**Plan-line IDs, each below:** TL1.1, TL1.2, TL1.3, TL1.4, TL1.5, TL1.6, TL1.7, TL2.1, TL2.2, TL3.1, TL3.2, TL3.3, TL3.4, TL4.1, TL4.2, TL4.3, TL4.4, TL5.1 (18).

## How these tests run
- **Python** (`/usr/bin/python3`, from `extraction-test/`; no network, $0): `tailored_test.py` prints `PASS`/`FAIL <ID> · <name>` and exits 1 on any failure. `rules_conformance.py` as today.
- **Core:** `npm test --workspace @kitted/core` (inside `npm run check`).
- **App:** `jest` (inside `npm run check`).
- **Flow:** `maestro --device 111D0A09-C2CA-4F72-BF3C-44019A05C89D test app/e2e/flows/T94-tailored-tile.yaml`, with Metro running.
- **TL3:** `KITTED_DATA=/Users/eyu/Desktop/files/Kitted /usr/bin/python3 extraction-test/tailored_same_scores.py`. It is heavy: check `top -l 1 | grep PhysMem` first and run nothing else heavy alongside. Not part of `npm run check`.
- **Readings** are made-up garments built with `rules_conformance.py`'s helpers (`top`, `outer`, `bottom`, `shoe`, `Rd`), with no person in them (rule 7: no age, no picks unless a line says so; boldness "a little"; occasion everyday unless stated). The TS test builds the same readings: the test writer copies them into the TS file or loads them from a small JSON fixture that the Python test writes.
- **Test names** start with the criterion ID, e.g. `TL1.2 · navy blazer, white dress shirt, grey trousers, brown loafers reads as Tailored`.

## The base outfits (named once, used below)
- **SUIT:** white dress shirt (tucked full), charcoal `suit_jacket`, charcoal `suit_trousers` (straight, no break), black `derby`.
- **BLZ:** white `dress_shirt` (tucked full), navy `blazer`, grey `trousers` (straight, slight break), brown `loafer`.
- **BLZ+x:** BLZ with its shoes swapped for x.
- **PREP:** navy `blazer` over a white `oxford_shirt`, khaki `chinos` (straight), brown `loafer`.
- **KNIT:** grey `sweater`, grey `trousers` (straight), brown `loafer` (no jacket).
- **DJ:** navy `blazer` over a white `tee`, `jeans` in `denim_dark` (straight), brown `loafer`.

## Criteria

**TL1. What counts**

- **TL1.1** · A charcoal suit jacket with matching suit trousers and black derbies reads as Tailored.
  - **How:** unit, Python and TS.
  - **Test:** `tailored_test.py` and `tailored.test.ts` › `TL1.1 · a charcoal suit with black derbies reads as Tailored`.
  - **Expect:** on SUIT:
    - `detect_looks(scored, {})["detected"]` contains `"tailored"` and the label is `"tailored"`;
    - `score_parts(SUIT)["style_label"] == "tailored"`;
    - `"tailored" in score_parts(SUIT)["detected_styles"]`;
    - `is_tailored(scored) is True`.
  - **Must not:**
    - `detect_styles` (the scoring detector) contains `"tailored"`: it stays the 7 looks;
    - SUIT's `overall`, every part score, and Style's reasons (checks and points) differ from the base engine. They are pinned to the values engine v15 gives at the base commit: the test writer records them at lock.
  - **Edges:**
    - SUIT with no shoes in view (`shoes_visible: false`) still reads as Tailored (jacket and trousers make two slots, 4 points);
    - SUIT with `framing: "upper_only"` doesn't (no trousers in view).

- **TL1.2** · A navy blazer over a white dress shirt with grey trousers and brown loafers reads as Tailored.
  - **How:** unit, Python and TS.
  - **Test:** `TL1.2 · navy blazer, white dress shirt, grey trousers, brown loafers reads as Tailored`.
  - **Expect:**
    - BLZ's `style_label == "tailored"`;
    - `detected_styles` contains `"tailored"` and still contains `"smart_casual"` and `"classic_prep"` (the 7 looks' membership is unchanged);
    - Style's reasons contain `H1_reads_as_style` +0.5 with the line `reads as tailored`.
  - **Must not:**
    - a smart casual or prep line remains (`reads as smart casual`, `reads as classic prep`);
    - any number differs from base v15 (pinned at lock).
  - **Edge:** a `suit_jacket` with plain `trousers` (no suit trousers: the engine re-files it as a blazer) reads as Tailored too.

- **TL1.3** · The TL1.2 outfit with white leather sneakers reads as Tailored; with chunky sneakers, running sneakers, slides or work boots it doesn't.
  - **How:** unit, Python and TS.
  - **Test:** `TL1.3 · white leather sneakers keep it Tailored; chunky, running, slides, work boots don't`.
  - **Expect:**
    - BLZ+`white_leather_sneaker` and BLZ+`low_profile_sneaker` read as `tailored`;
    - for each of `chunky_sneaker`, `performance_runner`, `slides_sandals` and `work_boot`, `"tailored" not in detected_styles` and `style_label != "tailored"`; the label is whatever base v15 gave (pinned).
  - **Must not:** `basketball_sneaker` reads as Tailored (also on TL1's never-list).
  - **Edges:**
    - BLZ+`canvas_sneaker` and BLZ+`retro_runner` still read as Tailored: neither is on the never-list, they score 0 and aren't against (technical default 2). The test asserts this so a change is deliberate;
    - BLZ with any garment at `volume: 5` doesn't read as Tailored.

- **TL1.4** · A navy blazer with khaki chinos and loafers reads as classic prep, not Tailored, as today.
  - **How:** unit, Python and TS.
  - **Test:** `TL1.4 · blazer with khaki chinos and loafers stays classic prep`.
  - **Expect:** PREP's `style_label == "classic_prep"` and `"tailored" not in detected_styles`.
  - **Must not:** Tailored appears with any picks, including `[["tailored", 1.0]]`.

- **TL1.5** · A sweater with dress trousers and loafers (no jacket) doesn't read as Tailored; it reads as it does today.
  - **How:** unit, Python and TS.
  - **Test:** `TL1.5 · a sweater with dress trousers and loafers isn't Tailored`.
  - **Expect:** KNIT's `detected_styles` and `style_label` equal base v15's (pinned: `minimalist` with no picks, as [SCO-4] says), with no `"tailored"`.
  - **Must not:** KNIT with an `overcoat` reads as Tailored (an overcoat isn't a tailored jacket).

- **TL1.6** · A blazer with dark jeans doesn't read as Tailored.
  - **How:** unit, Python and TS.
  - **Test:** `TL1.6 · a blazer with dark jeans isn't Tailored`.
  - **Expect:** DJ has no `"tailored"` in `detected_styles`; the label is base v15's (pinned).
  - **Must not:** Tailored with `chinos`, `cargos`, `sweatpants`, `joggers`, `shorts` or `athletic_shorts` in place of the jeans, or with a `hoodie`, `sweatshirt`, `graphic_tee`, `tank_top`, `jersey` or `fleece` under the blazer of BLZ.

- **TL1.7** · Each case above is a test in the Python engine and the same test in `@kitted/core`.
  - **How:** both files hold TL1.1–TL1.6 with the same readings and expectations.
  - **Test:**
    - `tailored.test.ts` › `TL1.7 · every TL1 reading gives the same looks in TS as in Python`: for each TL1 reading, TS `detectLooks` and `scoreParts(...).detectedStyles` / `styleLabel` equal Python's (from the fixture JSON the Python test writes);
    - `TL1.7 · isTailored agrees with the framework on every parity reading`: on every reading in `parts_parity.json` and `rubric_parity.json`, `isTailored(scoredGarments(r))` equals `detectLooks(...).detected.includes("tailored")`.
  - **Expect:** all equal.
  - **Must not:** a TL1 case exists in one language only (the test lists the case names and compares the two lists).

**TL2. The name**

- **TL2.1** · Where an outfit fits Tailored and smart casual or prep, the card names Tailored, whatever his picks.
  - **How:** unit, Python and TS.
  - **Test:** `TL2.1 · Tailored wins over smart casual and prep whatever the picks`.
  - **Expect:**
    - BLZ's `style_label == "tailored"` under each of these picks: `[]`, `[["smart_casual", 1]]`, `[["classic_prep", 1]]`, `[["classic_prep", 0.5], ["smart_casual", 0.5]]`, `[["tailored", 1]]`;
    - the same for a navy blazer over a pink `oxford_shirt` with grey trousers and loafers (it carries a prep marker today).
  - **Must not:**
    - a tie Tailored doesn't own is decided by Tailored: an `unstructured_blazer` over a white `tee` with black `trousers` (straight) and black `loafer`, which reads as minimal and Tailored, must read `minimalist` with picks `[["minimalist", 1]]` and `tailored` with no picks (the fixed order). The test asserts both detected first, so the case is real;
    - any number differs between any two of these picks lists (picks never move a number).

- **TL2.2** · No card, How I scored sheet or look page says "a matching suit" any more; each says Tailored.
  - **How:** unit (engine) plus a component test of the sheet's rows.
  - **Tests:**
    - `tailored_test.py` and `tailored.test.ts` › `TL2.2 · a suit that reads as Tailored never says "a matching suit"`;
    - `T94-tailored.test.tsx` › `TL2.2 · How I scored on the suit shows "Reads as tailored"`.
  - **Expect:**
    - on SUIT and on the demo reading `s09` (navy suit, dress shirt, dress shoes), Style's `H1_reads_as_style` reason is `+0.5` with line `reads as tailored`;
    - `whyParts(scoreParts(s09))` gives a Style row `Reads as tailored` at `+0.5` and no "Reads as" row after the parts (the engine line already says it);
    - across every case in the regenerated `parts_parity.json` whose `style_label` is `tailored`, no reason or tip line contains `matching suit`.
  - **Must not:** any card that reads as Tailored shows `a matching suit`.
  - **Edge (founder 1, default):** a suit that isn't Tailored (SUIT with `chunky_sneaker`, or a `graphic_tee` under it) keeps `+0.5` with the line `a matching suit` and `style_label` null. The test pins this default and says so in its name; if the founder picks the other option, the test writer changes this one line before the lock.

**TL3. Same scores**

- **TL3.1** · On every Python parity case and every saved real photo, every part, score and fix equals today's; only the look's name differs. Run at $0 (stored readings, no AI call).
  - **How:** the script `extraction-test/tailored_same_scores.py` (behaviour, run by the implementer and re-run by the verifier), plus `make_parts_parity.py`'s own assertion.
  - **Expect:**
    - `results/tailored/summary.json` has `failed: 0` for each set (parity, fixes, rubric, conformance, corpus, phone, gold), and `identical + name_only == cases`;
    - the report lists the name-only changes by old → new label;
    - the script exits 0;
    - run base against base, every case is `identical` (the self-check; the report says it ran).
  - **Must not:**
    - any part score, display, reason check or points, tip, overall, raw or unrounded value, bonus, penalty, condition, occasion, floor, or any fix (id, to, gain, raw gain, tag, order), Smaller step or Next level id differs;
    - `detected_styles` changes other than gaining `"tailored"`;
    - `style_label` changes to anything other than `"tailored"`.
  - **Proving it bites:** the test writer plants a +0.25 on `H1_reads_as_style` when the look is Tailored in a scratch copy of `parts_proto.py`, passed to the script as `--new-from <dir>`. The script must fail and name the changed cases. A run with `--new-from` writes nothing to `results/tailored/`.
  - **Edges:**
    - the gold set's 3 runs per photo, each compared;
    - the phone pulls deduped by image hash (the newest pull wins);
    - readings Python can't score (stored errors) must raise the same error in both engines.

- **TL3.2** · `@kitted/core` matches the Python engine on all parity cases, regenerated from the engine (never hand-edited).
  - **How:** parity tests (`parts.parity.test.ts`, `partsFixes.parity.test.ts`, `rubric.parity.test.ts`, `rulesConformance.test.ts`, `demo-story.test.ts`), plus a regeneration check by the verifier.
  - **Expect:**
    - all parity suites green;
    - every fixture's `*_sha256` field equals the sha256 of this branch's `rubric.py` / `parts_proto.py` / `parts_fixes.py`;
    - re-running the generators in IMPLEMENTATION.md Step 5's order with `KITTED_DATA` set leaves `git diff --exit-code handoff/fixtures app/packages/kitted-core/src/*Data.ts` clean;
    - the fixtures include the new picks variant `tailored`, and `partsFixes` cases with a Tailored pick (`make_parts_fixes.py` iterates `STYLE_NAMES`).
  - **Must not:**
    - a fixture or generated `*Data.ts` edited by hand;
    - a fixture generated from the main checkout's engine (the generator path trap: the sha check catches it).
  - **Red:** before the port, `parts.parity.test.ts` fails on the regenerated fixtures (`detected_styles` with `"tailored"`).

- **TL3.3** · The 6 saved jacket-led photos are listed with each person's age band and picked looks, and what each now reads as. A photo that meets TL1 and doesn't read as Tailored is a failure.
  - **How:** the TL3 script's report (behaviour, generated), plus a manual read by the verifier.
  - **Expect:** `report.md` has a table "The 6 jacket-led photos": the gold photos where `PR3_tailored_line` fires on run 0 under engine v13 (#266). Each row gives:
    - the photo's file;
    - "profile unknown (web photo)", age band "unknown", picked looks "none known", "scored with the stated test profile: Minimal + Smart casual, 0.5 each, everyday" (CLAUDE.md rule 7);
    - TL1 met yes/no (and the blocking piece if no);
    - the label before → after;
    - the score before → after;
    - PASS/FAIL.

    If the recomputed count isn't 6, the table says the real count and lists them all. A second table lists every other saved jacket-led reading (corpus, phone pulls with the founder's profile: born 2004, 22–25, picks streetwear, minimal, workwear) in the same columns.
  - **Must not:**
    - a row that meets TL1 reads as anything but `tailored` (the script exits 1);
    - a row is labelled `tailored` without meeting TL1;
    - the report shows a photo or a face (file names only).
  - **Not covered:** the sample is small. The report says so in one line ("6 photos, a small sample; the founder chose the saved 6 only").

- **TL3.4** · If any score would change, the build stops before merging and the founder sees the cases.
  - **How:** the script's exit code plus the process; checked by the verifier.
  - **Expect:**
    - the script exits 1 and `report.md` opens with "STOP: n cases changed a number", listing each case (set, id, occasion, picks, the field, before, after);
    - the implementer's report to the coordinator quotes that list;
    - nothing changes the engine to make the list go away.
  - **Must not:**
    - a commit after a failing run that edits `parts_proto.py`, `rubric.py` or a tune knob to make the script pass, without a new founder yes in DECISIONS-LOG;
    - a fixture is regenerated from a failing state.

**TL4. Where he sees it**

- **TL4.1** · Setup's style screen shows 8 look tiles with Tailored after Classic prep, its name and line word for word and the two drawings in TL4; screenshots in light and dark and at the largest text size, nothing clipped.
  - **Note (the coordinator, Nov 18, before the lock):** TL4.1's "Setup's style screen shows 8 look tiles" is covered for the setup screen by T113's game cards; T94 checks LOOKS and Style profile. T113 replaces setup's tile grid with the style game and deletes `PickLooksScreen.tsx` (demo screen 2 becomes the game), so no T94 test renders the setup grid or opens screen 2. Same criterion, pointed at where the tile lives after T113.
  - **How:** unit (`LOOKS`, which the game, You and Style profile draw from), component test (Style profile), flow and screenshots.
  - **Tests:** `T94-tailored.test.tsx`:
    - `TL4.1 · LOOKS has 8 looks, Tailored right after Classic prep, its name and line word for word`;
    - `TL4.1 · Tailored's two drawings are the suits TL4 describes`;
    - `TL4.1 · founder 3: the three redraws (Outdoor's slate-blue shell and heather zip pullover, Streetwear's black chunky sneakers)`;
    - `TL4.1 · Style profile shows 8 look tiles, Tailored 5th, with its two drawings`;
    - flow `T94-tailored-tile.yaml` (Style profile, screen 293).
  - **Expect:**
    - `LOOKS` order: streetwear, minimalist, smart_casual, classic_prep, tailored, workwear, outdoor, vintage_sport (names Streetwear, Minimal, Smart casual, Classic prep, Tailored, Workwear, Outdoor, Vintage sport);
    - Tailored's name is `Tailored` (`style.tailored`, `styleLabel`) and its line `Suits, blazers, dress trousers, loafers` (`onb.looks.line.tailored`);
    - `LOOKS` entry `tailored`, outfit 1: `top.type === 'blazer'`, `bottom.type === 'trousers'`, `top.color === bottom.color` (charcoal: a grey, highest channel 0x30–0x60), `shoe.type === 'derby'` with a near-black color (every channel ≤ 0x40);
    - outfit 2: blazer and trousers the same navy color (blue leads by ≥ 20, dark), `shoe.type === 'sneaker'`, white (every channel ≥ 0xE8), not chunky;
    - each piece renders an `<svg` in light and dark;
    - `STYLES` has 8 keys and `LOOKS` covers exactly `STYLES`;
    - Style profile renders 8 tiles (`style-art-<look>`) in `LOOKS` order, Tailored 5th, a button named `Tailored` with its 6 drawn pieces (2 outfits × 3);
    - founder 3's redraws as IMPLEMENTATION.md → Interfaces gives them (Streetwear outfit 2's shoe `#26272B`, sole and laces `#F2F1EC`, still chunky; Outdoor outfit 1's top `#3D5A73`, a full-zip jacket; Outdoor outfit 2's top a `quarter_zip`, `#D8D2C2`, heather, `ribHem: false`).
  - **Must not:**
    - a 9th look;
    - a duplicate Tailored;
    - Tailored before Classic prep;
    - a drawing with a person (the flats have none: the test checks every piece's `kind` is top, bottom or shoe).
  - **Screenshots** (`tasks/T94/shots/`): Style profile (screen 293) and You (292), in light, dark and the largest text (`accessibility-extra-extra-extra-large`). The reviewer checks for clipping by eye. Setup's own screen is T113's.
  - **Red:** `STYLES` has 7 keys (`Expected length: 8, Received length: 7`); `LOOKS` has no Tailored; the redraws fail on Streetwear's shoe `#B5332E` ≠ `#26272B`; Style profile draws 7 tiles (no `style-art-tailored`). Proven passable: with a scratch app-side build (STYLES, the two copy keys, the LOOKS entry and redraws; reverted, never committed) all four pass.

- **TL4.2** · Picking Tailored saves `tailored` in his order; You's Your style and Style profile show it with its drawings.
  - **How:** unit and component tests (Style profile and You; setup's grid is T113's).
  - **Tests:** `T94-tailored.test.tsx`:
    - `TL4.2 · tapping Tailored saves "tailored" in tap order`;
    - `TL4.2 · the keys: tailored is a look key; the old keys map as before`;
    - `TL4.2 · You's Your style and Style profile show Tailored with its drawings, in his order`;
    - `TL4.2 · a stored list with an unknown key shows the rest (no crash)`.
  - **Expect:**
    - `togglePick` over Classic prep, Tailored, Minimal gives `["classic_prep","tailored","minimalist"]`; on Style profile, tapping Classic prep, Tailored, Minimal then Done saves `styles` = `[["classic_prep",0.5],["tailored",0.25],["minimalist",0.25]]`; after the second tap the tile reads `Tailored, pick 2`, selected, badge `2`;
    - with profile styles `[["tailored",0.5],["classic_prep",0.25],["minimalist",0.25]]`, You renders `style-art-tailored` first in Your style (6 drawn pieces, hidden from VoiceOver; the card reads `Your style: Tailored, first pick; Classic prep; Minimal. Regular fit. Edit.`), and Style profile renders Tailored's tile with badge `1` (VoiceOver `Tailored, pick 1`);
    - `picksToStyles(['tailored'])` is `[['tailored', 1]]`.
  - **Must not:**
    - a 4th tap (with Tailored among 3) adds anything: `togglePick` returns `full` with the picks unchanged, and on Style profile the 4th look stays unselected with Tailored still pick 2;
    - `normStyleKey('tailored')` is null;
    - a stored list with an unknown key crashes You (the unknown key is dropped).
  - **Edges:**
    - a wipe or reinstall: picks live in kv and the profile as today (nothing new to clear);
    - old keys (`preppy`, `old_money`, `gorpcore`) still map as before.
  - **Red:** Style profile has no `Tailored` button; `normStyleKey('tailored')` is null; You draws `style-art-classic_prep`, `style-art-minimalist` only (Tailored dropped); the unknown-key case draws nothing. Passable: all four pass on the scratch app-side build above.

- **TL4.3** · Going for offers Tailored, and choosing it changes no score.
  - **How:** unit (core) and service test (app).
  - **Tests:**
    - `tailored.test.ts` › `TL4.3 · Going for Tailored: a match on a suit, a mismatch on a blazer with chinos, no score moves`;
    - `T94-tailored.test.tsx` › `TL4.3 · Tailored is offered in Going for and choosing it keeps the score`.
  - **Expect:**
    - `goingForAdvice(BLZ, "tailored").kind === "match"` with `readsAs === "tailored"`;
    - `goingForAdvice(PREP, "tailored").kind === "mismatch"`;
    - `lookTiles(['tailored','classic_prep','minimalist']).tiles` starts with `'tailored'`;
    - `lookTiles([]).more` contains `'tailored'`;
    - after a check is scored and Going for is set to Tailored (the same path as demo 74), the stored row's `score` and every part equal the row before.
  - **Must not:**
    - the score, a part, or a fix's `to` changes when the Going for look changes to or from Tailored;
    - Going for is asked at gym or home (as today: `asksLook('gym') === false`).
  - **Edge:** offline, Going for runs on the phone, so the same result with no network (the service test runs with no server).

- **TL4.4** · VoiceOver reads the tile as in TL4.
  - **How:** component test (Style profile's tile, and the look tile's words from setup's template), plus a manual VoiceOver pass (below).
  - **Test:** `T94-tailored.test.tsx` › `TL4.4 · the Tailored tile's VoiceOver label`.
  - **Expect:**
    - the look tile's words (`onb.looks.tileA11y`) for Tailored are exactly `Tailored: Suits, blazers, dress trousers, loafers`, and picked first `Tailored, pick 1: Suits, blazers, dress trousers, loafers`;
    - on Style profile the unpicked tile has `accessibilityRole` `button`, `accessibilityLabel` `Tailored`, not selected; once tapped, `Tailored, pick 1`, `accessibilityState.selected === true`;
    - its drawings are hidden from VoiceOver (`accessibilityElementsHidden`): one hidden view holding the 6 drawn pieces.
  - **Must not:** the label is missing the line, or reads a key (`onb.looks.line.tailored`, `style.tailored`).
  - **Red:** `Expected: "Tailored: Suits, blazers, dress trousers, loafers"`, `Received: "Any style: {line}"` (no `style.tailored`, no line key). Passable on the scratch app-side build.

**TL5. Fixes**

- **TL5.1** · On a jacket-led outfit with sleeves over the hands, the sleeve fix moves up when Tailored is his first pick, and the score is identical with and without the pick.
  - **How:** unit, Python (`parts_fixes`) and TS (`suggestPartsFixes`).
  - **Test:** `TL5.1 · the sleeve fix leads with Tailored first; the score is the same`.
  - **Reading** (found on the base engine Nov 18): white `dress_shirt` tucked full, navy `blazer` with `sleeve_end: "covers_hand"`, grey `trousers` (straight, no break), red `canvas_sneaker`, at everyday. With no picks the fixes are `shoes_loafers` (to 7.5) then `fit_better` (to 7.0). The test asserts this precondition, so the case is real.
  - **Expect:**
    - with picks `[["tailored", 1]]`, `fit_better` comes before `shoes_loafers`;
    - every fix's `to`, `gain` and `rawGain`, `baseOverall`, and every part of `scoreParts`, are identical to the no-picks run;
    - the same with Tailored as 2nd pick behind a look the fixed outfits don't read as (`[["streetwear", 0.5], ["tailored", 0.5]]`).
  - **Must not:**
    - with picks `[["smart_casual", 1]]` the order changes from the no-picks order (no lead without Tailored);
    - a tailoring fix jumps a cheaper class (a free fix stays ahead of an `own` one: BLZ with `sleeve_end: "covers_hand"` and a wrinkled shirt keeps `steam` before `fit_better` with a Tailored pick);
    - the lead applies on an outfit with no tailored jacket (a knit with `sleeve_end: "covers_hand"`, trousers and loafers: the same order with and without the pick).

## Red lines (at the lock, Nov 18)
The test writer's record: each test's first failing line on this branch before any T94 code (stubs only: core `detectLooks` and `isTailored` throw `T94: not built`), or how a guard test that can't go red was made to bite. "Passable" means a scratch build made by the test writer (a copy of the engine in the scratchpad with `detect_looks`, `is_tailored`, the four line edits and the fix lead per Interfaces; a temporary app-side patch of `STYLES`, the two copy keys and `LOOKS`; never committed) passes the test, so the contract can be met.

**The pins.** `handoff/fixtures/tailored_base_v15.json` is engine v15's output for every reading below (69), written by `tailored_test.py --pin` on this branch's engine before any T94 change (`--pin` refuses on an engine that knows Tailored). It holds, per reading, every number (overall, raw, average, bonus, problems, floor, condition, occasion, and each part's score, display, reasons as check and points, tips as check), the 7-look `detected_styles` and `style_label`, and the fixes (id, to, gain, raw gain; order). The TS file reads the same pins and passes `TL3.1` today, which proves its readings equal Python's.

**Python, `extraction-test/tailored_test.py`** (19 tests; base: 2 pass, 17 fail; the scratch build: 17 pass, the 2 regeneration tests fail as they should until the fixtures are regenerated):
- TL1.1 (2): `AttributeError: module 'rubric' has no attribute 'detect_looks'`.
- TL1.2 (2): `AssertionError: smart_casual` (the label); the edge: `('smart_casual', ['classic_prep', 'smart_casual'])`.
- TL1.3 (2): `('white_leather_sneaker', 'smart_casual', …)`; edges: `('canvas_sneaker', 'smart_casual')`.
- TL1.4, TL2.1 (tie), TL1.5, TL1.6, TL1.7, TL2.2 founder 1: `AttributeError: … 'detect_looks'` / `'is_tailored'`.
- TL2.1 (wins): `('blz@none', 'smart_casual')`. TL2.2 (suit): `('suit', None)`. TL2.2 (parity): `parts_parity.json has no Tailored case`.
- TL3.2 (picks variant): `no parts_parity case has a Tailored pick`.
- TL5.1 (lead): `['shoes_loafers', 'fit_better']`.
- TL5.1 (no lead without Tailored, a class, a jacket) — exists (passes on base): **bites** via a scratch build whose lead skips the tailored-jacket condition: `('tailored', ['fit_better', 'shoes_loafers'])` on the overcoat case.
- TL3.1 (the pins) — exists: **bites** via the TESTING plant (+0.25 on `H1_reads_as_style` when the look is Tailored, in the scratch `parts_proto.py`): fails naming 36 readings (`suit: a number moved`, `blz: a number moved`, …).

**Conformance, `extraction-test/rules_conformance.py`** (26 new `TLR-*` cases; 29 cases that meet TL1 now expect `label: "tailored"` and `reads as tailored`; a new `fix_order` assertion, mirrored in `rulesConformance.test.ts`; a check that every case reading as Tailored says so). Base: 483/527 pass, the rest fail on `label smart_casual != tailored`, `H1_reads_as_style line ['a matching suit'] lacks 'reads as tailored'`, `fixes ['shoes_loafers', 'fit_better'] != ['fit_better', 'shoes_loafers']`, and `the doc and the cases disagree: … cases for rules not in the doc ['TLR-1', …, 'TLR-6']`. Scratch build (with `[TLR-1]`–`[TLR-6]` in a scratch copy of the doc): 527/527. The TS twin stays green (502) until the JSON is regenerated.

**Core, `app/packages/kitted-core/test/tailored.test.ts`** (23 tests; base: 19 fail, 4 pass):
- TL1.1–TL1.6, TL1.7 (parity readings), TL2.1 (tie), TL2.2 (suit, founder 1): `Error: T94: not built` (the stubs) or the label assertions (`[ 'canvas_sneaker', 'smart_casual' ]`, `[ 'suit', null, … ]`).
- TL1.7 (TS = Python): `T94: not built (handoff/fixtures/tailored.json is written by extraction-test/tailored_test.py once every Python test passes)`.
- TL2.2 (parity): `expected 0 to be greater than 0`. TL3.2 (picks variant): `expected false to be true`.
- TL4.3: `TypeError: Cannot read properties of undefined (reading 'role')` from `goingForAdvice` (the rubric's `STYLES` has no `tailored` role: Interfaces' `RubricHelpers.role("tailored", …)`, the missing behaviour itself).
- TL5.1 (lead): `expected [ 'shoes_loafers', 'fit_better' ] to deeply equal [ 'fit_better', 'shoes_loafers' ]`.
- Exists (pass on base): TL1.7 (the readings are Python's pinned readings), TL3.2 (each fixture's sha256 equals this branch's `rubric.py`, `parts_proto.py`, `parts_fixes.py`: bites whenever an engine file changes without regenerating), TL5.1 (no lead …) and TL3.1 (the pins), which bite as their Python twins do (same assertions on the same pins).

**App, `app/src/__tests__/T94-tailored.test.tsx`** (11 tests; base: 11 fail): TL4.1, TL4.2, TL4.4 as written under each criterion; TL4.3: `lookTiles([]).more` lacks `"tailored"`; TL2.2: `Expected: "tailored"`, `Received: null` (s09's label). On the scratch app-side build 9 pass; TL4.3 and TL2.2 need the core port (they fail there on `readsAs` / the label, as they should).

**Existing tests updated** (each red by design, name, count or key list only): `styleKeys` (8 names; `STYLES` vs `lookOrder`: red, `lookOrder` missing and `'Tailored'` missing), `onboardingLooks` (title only: still passes), `lookPacks` (`PACKED` = the looks with a pack, `NEVER` partial, and `TL4 · a Tailored pick alone keeps today's 12 …`: red `Expected value: "tailored"` in `STYLES`; **bites** with Tailored in `STYLES` and no filter in `starterList`: `TypeError … reading 'ids'`), `cardContent` (s09 reads as `tailored`: red `null`), app `goingFor` (More gains `tailored`: red). No core test needed a change: `coldCard`, `allowedColors`, `v4` assert no label on a tailored outfit, and `demo-story` follows `expected_scores.json` (regenerated by the implementer). Of the app tests that pass `STYLES` as picks, only `cardContent` asserts a `readsAs` on a jacket-led reading (s09; the scratch engine changes no other demo reading's label).

**Not proven red here (behaviour, script or process):**
- TL3.1's script, TL3.3 and TL3.4 are `tailored_same_scores.py`'s job (the implementer writes it). The plant TESTING asks for (`--new-from` with +0.25 on `H1_reads_as_style`) can only run once the script exists: **the verifier runs it** (or the test writer on a call-back). The same plant already bites `tailored_test.py`'s pins (above).
- TL3.2's regeneration check (`git diff --exit-code` after re-running the generators) is the verifier's.
- The flow: not run (screens 292 and 293 don't exist yet, and the Mac is short on memory); it is red by construction until they do.

## Existing tests to update (the test writer, in the lock; each with its reason in TASK.md → Disputes)
These turn red by design: a name, a count or a type. Change only the expected look name, count or key list, never a number.
- `app/src/__tests__/styleKeys.test.ts`: the 7 names become 8 (`…, 'Classic prep', 'Tailored', 'Vintage sport', 'Outdoor'`), and `STYLES` is compared with `RUBRIC_DATA.styles.lookOrder`.
- `app/src/__tests__/onboardingLooks.test.ts`: the title says 7 (the body already follows `STYLES`). No test of the setup grid counts 7 tiles (`T39-setupScreens`, `looksOwnWords` don't), so none needed a change.
- `app/src/__tests__/lookPacks.test.ts`: the `NEVER` record is typed `Record<StyleKey, …>`. The loops over `STYLES` index `PACKS[look]`: iterate the looks that have a pack, and add `TL4 · a Tailored pick alone keeps today's 12` (founder 2 default).
- `extraction-test/rules_conformance.py`:
  - every case whose outfit meets TL1 expects `label: "tailored"` and `reads as tailored` where it said `a matching suit`, `reads as smart casual` or `reads as classic prep`: at least `SHO-7-suit`, `STY-2-suit`, `SMC-2-suit`, the khaki suit case (≈ line 736) and the tee-under-a-suit cases (≈ lines 926, 1180, 1223);
  - new `TLR-1`…`TLR-6` cases, one or more each (the conformance file's rule: every `[ID]` in `v5-styles.md` has a case).
- Core tests with blazers or suits whose expected label may change: `coldCard.test.ts`, `allowedColors.test.ts`, `v4.test.ts`, `demo-story.test.ts` (via `expected_scores.json`: `s09` is a suit).
- App tests that pass `STYLES` as his picks: their profile now includes Tailored (`cardContent`, `fitCheckService`, `whichOne`, `partsService`, `twoShot`, `fitCheckRobustness`, `fitCheckLiveFlow`, `oneAtATime`, `secondLook`, `samePhotoNewCheck`, `samePhotoRecheck`, `goingFor`, `closetService`, `tap`, `stepFourBatch`, `whyRows`, `copyChecks`). Only a `readsAs` on a jacket-led reading can change.
- Anything else the implementer finds red is a dispute, never an edit.

## UI inventory
No state here is new; Tailored joins states that exist. Loading, error and offline are unchanged: scoring and Going for run on the phone, and the setup grid has no loading state. Each state needs light, dark and the largest text. The words are the spec's (TL4) or existing templates filled with the look's name.

| State · demo screen | Element | Exact words | VoiceOver | testID |
|---|---|---|---|---|
| Setup's style screen · **2** | T113's style game replaces the grid; its cards cover setup (the coordinator, Nov 18) | | | |
| You, Tailored picked · **292** | Your style tiles, Tailored first with both drawings | `Your style`, `Tailored` | `Tailored, first pick` | `style-art-tailored` |
| Style profile, Tailored picked · **293** | Styles grid (8 tiles, Tailored 5th) with badge `1` | `Styles`, `Tailored` | `Tailored, pick 1` | `style-art-tailored` |
| Score card, a suit · **294** | the card as today; Going for advice when asked | `Reads as tailored.` (Going for advice) | as today | none |
| How I scored, the suit · **295** | Style group row | `Reads as tailored` `+0.5` (never `A matching suit`) | as today | none |
| Going for, Tailored offered · **296** | first tile `Tailored` (his first pick); More lists the rest | `What are you going for?`; note `Your first pick from setup.` | tile: `Tailored. Suits, blazers, dress trousers, loafers`; on arrival: `While I read it: what are you going for? Tailored is picked, …` (the existing source phrase) | none |

- **The three redraws** (Outdoor's slate-blue shell, Outdoor's heather zip pullover, Streetwear's black chunky sneakers) show on screen 2, on 17 (when picked) and on 80: screenshot them light and dark for the founder's OK (founder 3).
- **Flow** `T94-tailored-tile.yaml` (pointed at Style profile, not setup's screen 2, which T113 replaces):
  1. open screen 293 (Style profile, Tailored picked first);
  2. `scrollUntilVisible` `Tailored, pick 1`; assert `Classic prep, pick 2` and `Minimal, pick 3`;
  3. tap it: assert `Tailored` (unpicked) and `Classic prep, pick 1`;
  4. tap it again: assert `Tailored, pick 3`;
  5. open screen 292 (You) and wait for `Your style: Tailored, first pick; Classic prep; Minimal.…`.

  **Red:** screens 292 and 293 don't exist yet (the demo opens no Style profile with Tailored). Not run at the lock (see "Red lines" below).

## Not testable yet
Never dropped, never counted as done.
- **TL4.4 on a device:** the label is tested, but VoiceOver's spoken order on a phone isn't. **Would verify it:** a founder to-do, "with VoiceOver on, swipe to the Tailored tile in Style profile (and in T113's game)" (5 min), added to plan.md (P2), or the Simulator's Accessibility Inspector by the verifier.
- **TL4.1 "nothing clipped" at the largest text:** a screenshot judged by eye; no automatic check. **Would verify it:** the reviewer's look at the AX5 shots; on his phone, part of the same to-do.
- **The look page part of TL2.2:** the Lookbook look page shows no look name or How I scored today; T75 adds How I scored there through the same `whyParts`. **Would verify it:** T75's screenshots and its test of `whyParts` on a suit.
- **The style game part of TL4** ("Tailored is one of its looks, with the same two drawings"): the game isn't in the app yet (T113). T94 only puts Tailored in `LOOKS`, which the game will read. **Would verify it:** T113's tests.
- **TL3.3's small sample:** 6 web photos with no known profile, by the founder's choice. A real Tailored wearer's photos (his own or friends', with profiles) would check it properly. **Would verify it:** a later founder to-do, if he wants one.

## Disputes (the test writer's rulings; TASK.md doesn't exist yet, so they're recorded here)
1. **Nov 18 · `rubric.parity.test.ts` › "detectStyles on a reading = … score() reports" (the implementer). Upheld.** The test contradicted IMPLEMENTATION.md → Interfaces: `detect_styles` / `detectStyles` stays the 7 scoring looks, while `score()`'s `detected_styles` / `style_label` carry `detect_looks`. Corrected, not weakened: it now checks `detectLooks(reading, picks)` equals `score()`'s looks and label, **and** that `detectStyles` is exactly `score()`'s looks without Tailored (never containing it) with the same label whenever Tailored isn't detected. The first 600 cases hold 114 Tailored ones. Bites: with the top-level `detectStyles` returning the 8 looks, it fails (`expected [ 'tailored', 'classic_prep', …(1) ] to deeply equal [ 'classic_prep', 'smart_casual' ]`). The file joins the Lock line.
2. **Nov 18 · `T94-tailored.test.tsx` › TL4.3, the advice line (the implementer). Upheld.** The test expected `Reads as tailored.` on a match; the app's match line is `It reads that way too.` for every look (`gf.adv.match`, `goingFor.test.ts`), and the spec says Going for works as today (TL4: "it changes advice, never the score (as today)"). `Reads as tailored.` is the mismatch line. Corrected and strengthened: the match expects `It reads that way too.` (kind match, no move) before and after going back to Tailored; after changing to Classic prep the advice is a mismatch going `classic_prep` whose lead is `Reads as tailored.`. The assertions after it now run and pass on the build (11/11). Bites: with the mismatch line naming the look he's going for instead of the one it reads as, TL4.3 fails.
3. **Nov 18 · verification round 1, a gap in TL4.3 (the verifier). Added.** Nothing checked which piece Going for names when he's going for Tailored: reverting `goingFor.ts`'s `reads` from `detectLooks` to `detectStyles` left every test green. Against the spec (TL4: Tailored is one of the looks he can say he's going for, and it changes the advice as for any look) and Interfaces (`pullingPiece`'s `reads` uses `detectLooks`), the verifier's case holds. New tests:
   - core `tailored.test.ts` › `TL4.3 · Going for Tailored names the piece that keeps it from Tailored: a graphic tee under a blazer is the loud one`: a white graphic tee under a navy blazer, grey trousers, brown loafers (made up, no person) going for Tailored is a mismatch reading as `classic_prep`, piece `{ index: 0, name: "graphic tee", plural: false, why: "loud" }`, move `top_plain_tee` "Swap the graphic tee for a plain tee"; the same outfit with a plain tee is a match; no number moves with a Tailored pick;
   - app `T94-tailored.test.tsx` › `TL4.3 · a graphic tee under a blazer, going for Tailored: the card names the tee and the swap, the score stays`: through `evaluateCheck`, the stored advice names the tee, and `adviceText` reads `Reads as classic prep.` / `For a tailored look, the graphic tee pulls the other way.` / `Swap the graphic tee for a plain tee` · `Toward tailored`; score, raw score and parts equal no Going for.
   Both red with the revert planted (`expected null to deeply equal { Object (index, name, ...) }`), green once restored (`git checkout`). Core: 24/24 with `goingFor.test.ts` 31/31 together; app: 12/12.
4. **Nov 18 · the merge with main (T69, engine v16 by default; the coordinator).** 26 tests red, none edited by the implementer. Rulings, against `specs/tailored.md` (TL3 name only; since v16 the taste rules follow the graded look) and T69's TESTING.md:
   - **T69's locked tests (changed here, recorded for T69):**
     - `v15Unchanged.test.ts` › `T69-G2 · the v15 cases are the same as before T69`. Its intent is "v15 never moves". T94 renames looks in v15 outputs and adds v15 cases, so T69's whole-case hashes (H15*, kept in the file for the record) can't hold. Replaced by two hashes per fixture, computed from git history with the test's own code:
       - NAMES15p/f/c: the pre-T69 cases (T94's additions left out: the Tailored picks variant and the TLR cases), with look names masked, "tailored" dropped from the look lists and the label left out, hash to a2480b09's under the same mask (12,021 / 30,412 / 501). So no number, check, tip or other word of v15 moved through T69 and T94 together.
       - H94p/f/c: every v15 case, exactly, hashes to T94's fixtures before T69 merged (27f02eed; 12,549 / 31,183 / 527). So merging T69 changed nothing of v15, names included.
       - Both bite: one v15 overall moved by 0.5 changes them.
     - `rulesConformance.test.ts` › `T69-G4 · the doc and the cases agree`: T69's 501 v15 cases plus T94's 26 TLR cases, each counted (501 + 26 = 527).
     - T69's `TST-0-suit` (the implementer's added `label: "tailored"`): **confirmed**, since TL1.1's suit reads as Tailored. Strengthened as `MEETS_TL1` is, with `detected_has` tailored and H1 `reads as tailored` at +0.5 (true on v16: 7.0, `reads as tailored`).
   - **T94's tests on the default engine:**
     - Core `tailored.test.ts` now pins v15 with `setRescoreV16(false)`, as T69 did for tests about v15 rules. T94's contract is v15's numbers (the Python twins run v15), and TL1.7's TS-equals-Python needs the same engine.
     - The TS `fixOrder` in `rulesConformance.test.ts` now runs on the case's own engine, as `fixNextLevel` does; Python's `fix_order` too.
     - Strengthened so name-only holds on v16 as well. New pins `handoff/fixtures/tailored_main_v16.json` (`tailored_test.py --pin-v16` on main's engine at da9b7253: T69 merged, T94 not) and new tests in Python and TS:
       - `TL3.1 · on v16 too, every reading keeps every number T69's v16 gave before Tailored (main, da9b7253)`: every number, the v16 block without its lines, the fixes and their order;
       - `TL2.1 · on v16 the names are v15's: the same looks, label and reads-as line on every reading`.
     - Both pass on the merge. Both bite: a +0.25 on H1 for Tailored on v16 only fails them while the v15 tests stay green.
     - TL5.1's lead stays a v15 test: on v16 that reading's fixes don't include the sleeve fix (the pinned v16 order is the same with or without a Tailored pick).
   - **App `T94-tailored.test.tsx` TL2.2, "no Reads as row after the parts": not changed, not settled by the specs.** The test still fails on v16: T69's v16 Why rows add `readsAs` whenever the card reads as a look, so How I scored names Tailored twice. On the other side:
     - T69's IMPLEMENTATION (Why) says `readsAs (±0, as today)` and that `readsAs` "follow[s] today's rules". Today's rule shows it only when the Style part doesn't already say "reads as".
     - But T69's code comment and its locked `T69-whyRows.test.ts` (`readsAs missing` with readsAs passed) expect it always.
     - `specs/tailored.md` TL2.2 only asks that it say Tailored, never "a matching suit".
     - The founder or the coordinator decides; the test stays as it is.

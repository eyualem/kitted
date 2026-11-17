# T103 · Testing contract (strict)

Written by the session; tests written and locked by the test writer. The task's logic criteria go here, never words, labels or layout. **Locked once the Lock line is filled.** After that only the test writer changes this file or the tests, only to add or strengthen, with the reason in TASK.md → Disputes.

**Lock:** `9d0cf0040d6b0711e7d9fa55632893ab08140853` · 2026-11-17 · tests: `app/packages/kitted-core/test/allowedColors.test.ts`

**Plan line IDs:** KC3.3. One ID; this file covers it with the cases below (KC3.3 · a to p, q, r and s1 to s7) and five guards that the plan line states in words ("no score moves, parity stays 100%": T103-G1 to G5).

**Words:** this task shows no word to a user and no screen. Every "Expect" below is a list of color families (the engine's own keys), a number or a state. Nothing to approve for the founder.

## Fixtures (the test writer builds these as plain objects)
Every garment below also carries `pattern: "solid"` unless a case says otherwise.
- `tee(c)` = `{ category: "top", subcategory: "tee", color_family: c, volume: 3 }`
- `graphicTee` = `{ category: "top", subcategory: "graphic_tee", pattern: "graphic", pattern_scale: "large", logo: "none", volume: 3 }` (the case sets its color)
- `oxford(c)` = `{ category: "top", subcategory: "oxford_shirt", color_family: c, volume: 3 }`
- `jeans(c)` / `chinos(c)` / `trousers(c)` = `{ category: "bottom", subcategory: "jeans" | "chinos" | "trousers", color_family: c, leg_shape: "straight", volume: 3 }`
- `sneakers(c)` = `{ category: "footwear", subcategory: "white_leather_sneaker", color_family: c }`; `loafers(c)` = same with `"loafer"`; `boots(c)` = same with `"work_boot"`
- `bomber(c)` / `blazer(c)` / `denimJacket(c)` = `{ category: "outerwear", subcategory: "bomber" | "blazer" | "denim_jacket", color_family: c, volume: 3 }`
- `belt` = `{ category: "accessory", subcategory: "belt" }`; `watch(c)` = `{ category: "accessory", subcategory: "watch", color_family: c }`

Lists (palette order; this is `COLOR_CHOICES`):
- **ALL24** = white, off_white_cream, light_grey, grey, charcoal, black, navy, light_blue, blue, denim_light, denim_mid, denim_dark, olive, green, sage, khaki_beige, tan_camel, brown, burgundy, red, orange, yellow, pink, purple
- **BRIGHT5** = red, orange, yellow, pink, purple
- **N19** = ALL24 without BRIGHT5 (white … burgundy, 19 colors)

The expected lists below were computed from the live engine (parts data 1.8.0, v15 switches on) and checked against `rubric/v5-styles.md` ([COL-2], [COL-10], [COL-12], [SHO-10], the near-match rule). If a rules update changes one on purpose, the same PR updates it here.

## Criteria

### KC3.3 · The code judges the colors: the list
- **KC3.3** · "before Kit answers a color question, the code works out which of the 25 colors are allowed. These are the colors the scoring rules would not mark down in that outfit." This task builds the list (the model's picking, the sentence gate and the dropped card are T105's) · how: unit (core, vitest) with the real engine, and with a stand-in engine for the forwarding and failure cases · test: `app/packages/kitted-core/test/allowedColors.test.ts` › `KC3.3 · <case>` for each case a to p, q, r and s1 to s7 below · expect: each case's exact list · must not: a color the engine marks down appears in the list; a color it doesn't mark down is missing; the list is empty because another piece carries the fault; `multicolor` appears; the list is out of palette order or holds a duplicate · red: every one of the 35 tests fails with `Error: T103: not built` (the stub `allowedColors.ts` throws, `COLOR_CHOICES` is `[]`; `index.ts` already carries the export line, so there is no import failure). Beyond "not built", the test writer proved each test bites with a temporary reference implementation (never committed) and these deliberate bugs, one at a time, each caught by the tests named: Color part only (bug 1) c, d, i, j, m, o, s1, G4; zero baseline (2) j, k, q, r, s1, s2, s3, G2, G4; no tolerance (3) s3; the piece's old color or saturation kept (4) m, s5; occasion and boldness dropped (5) i, s4; multicolor included (6) 28 tests; reversed order (7) 25 tests; input mutated (8) G2, G4; engine error returns ALL24 (9) s6; positives counted (10) s1, r and others; candidate first (12) s1, s2, s3, s5, s6, s7. Bug 11 (a hard-coded color set) is caught by r. The same reference passes all 35, so every expected list above is the engine's own

#### The real engine (`allowedColors({ others, piece, ... })`, default engine)
Each case: `others` and `piece` as given; no `occasion`/`boldness` unless stated. The piece's own `color_family` is left out.

- **a · nothing in the outfit can mark a tee down.** `piece` tee · others `jeans("denim_dark")`, `sneakers("white")` → **ALL24**. Must not: any color missing.
- **b · light on light.** `piece` tee · others `chinos("khaki_beige")`, `boots("brown")` → **ALL24 without off_white_cream and khaki_beige** (22 colors; **white stays**, the rule's own exception: a crisp white top over khaki). Rule: [COL-12]. Must not: white excluded; off_white_cream or khaki_beige listed.
- **c · a second bright piece.** `piece` jeans · others `tee("red")`, `sneakers("white")` → **N19**. Red is out too (not a fight, but the Style part's "too many statements" takes 0.5 off): this is the case that proves every part is counted, not only Color. Must not: red, orange, yellow, pink or purple listed; blue or green excluded (they aren't bright).
- **d · a loud shoe.** `piece` `sneakers` · others `tee("red")`, `jeans("black")` → **N19**. Rule: [SHO-10] (a loud shoe with a loud piece). Must not: any BRIGHT5 listed. Color's own part says nothing here, so a Color-only check would list them.
- **e · shoes beside a quiet top.** `piece` `sneakers` · others `tee("olive")`, `jeans("black")` → **ALL24**.
- **f · near-match jacket and trousers.** `piece` `trousers` · others `blazer("navy")`, `oxford("white")`, `loafers("brown")` → **ALL24 without charcoal and black** (22). **navy stays** (the same dark, not "almost matching"). Must not: charcoal or black listed; navy excluded.
- **g · double denim, both ways.** (1) `piece` tee · others `jeans("denim_mid")` → **ALL24 without denim_mid**. (2) `piece` jeans · others `denimJacket("denim_mid")`, `tee("white")`, `sneakers("white")` → **ALL24 without denim_mid**. Rule: [COL-10]. Must not: denim_light or denim_dark excluded (different washes are free).
- **h · the piece's own print counts.** `piece` `graphicTee` · others `jeans("denim_dark")`, `sneakers("white")` → **N19**. The same outfit with a plain tee is case a (ALL24). Rule: [COL-8] (a big loud print on a bright piece). Must not: the print ignored (ALL24).
- **i · boldness is passed on.** `piece` tee · others `chinos("orange")`, `sneakers("white")`. Default (a_little) → **N19** (orange is out: orange chinos and an orange tee are two statements). With `boldness: "bold"` → **N19 plus orange** (20 colors, orange last): red, yellow, pink and purple stay out. Must not: both calls return the same list.
- **j · a pile-on: the others already clash.** `piece` bomber · others `tee("red")`, `chinos("yellow")`, `sneakers("white")` → **white, off_white_cream, light_grey, grey, charcoal, black, navy, light_blue, denim_light, denim_mid, denim_dark, olive, sage, khaki_beige, tan_camel, brown, burgundy** (17). Out: blue and green (each would be a third accent), plus BRIGHT5. Burgundy and sage stay (a muted accent counts half). Must not: an empty list (red and yellow already fight on their own); blue or green listed.
- **k · a fault that isn't the piece's.** `piece` oxford · others `blazer("navy")`, `trousers("black")`, `loafers("black")` → **ALL24**. The outfit is marked down (navy jacket over black trousers) whatever the shirt is; no shirt color is blamed. Must not: `[]`.
- **l · the others' saturation is kept.** `piece` jeans, sneakers white. (1) others `tee("red", saturation "muted")` → **ALL24** (a muted red isn't a bright piece). (2) others `tee("blue", saturation "bright")` → **N19** (blue and green stay allowed: the same bright family, and green isn't bright). Must not: (1) returns N19.
- **m · the piece's own color and saturation are ignored.** Case c with `piece` = `jeans` carrying `color_family: "red"` and `saturation: "bright"` → **N19**, exactly the same list as case c with neither field. Case b with the piece carrying `color_family: "khaki_beige"` → the same 22 as case b. Must not: a different list because of the old color.
- **n · no outfit around the piece.** `others: []`, `piece` tee → **ALL24**. Must not: `[]` or a throw.
- **o · accessories.** (1) `piece` `belt` · others `tee("white")`, `jeans("denim_dark")`, `sneakers("white")` → **ALL24** (accessories never affect a score). (2) `piece` jeans · others `tee("red")`, `sneakers("white")`, `watch("yellow")` → **N19**, the same as case c (the yellow watch changes nothing). Must not: (2) differs from case c.
- **p · a piece the rules don't rate.** `piece` `{ category: "traditional", subcategory: "other" }` · others `tee("white")`, `jeans("denim_dark")`, `sneakers("white")` → **ALL24**. (Pinned so the behaviour is deliberate; D6 in IMPLEMENTATION.md. Honouring "not rated" is the caller's.)

#### Properties over many outfits (real engine)
- **q · shape of every answer.** For every call in cases a to p and in case r: the result is a subset of `COLOR_CHOICES`, in `COLOR_CHOICES` order, with no duplicates, never contains `multicolor`, and is never empty. `COLOR_CHOICES` itself has exactly 24 entries, starts with white and ends with purple, and equals the keys of the app's palette (`FAMILY_HEX`) without `multicolor`. Must not: 25 entries; any other order.
- **r · agreement with the engine, in both directions.** For the 108 asks made from the seed closet (`seedCloset()` in `test/helpers.ts`: its first 4 tops × first 3 bottoms × first 3 shoes, and for each outfit the three questions "which top / bottom / shoes colors"): the test computes its own answer with the public `scoreParts` (cost = minus the sum of the negative reason points over all parts; allowed = within 1e-9 of the lowest cost over the 24 colors) and expects `allowedColors` to return exactly that. Must not: any ask where an allowed color costs more than the best, or a color costing the best is missing. (This ties the function to the engine's own numbers, so a rules update can't leave it behind.)

#### Stand-in engine (a `PartsEngine` the test supplies: `{ data, scoreParts }`; it returns `{ overall: 7, parts: { color: { reasons: [...] }, shoes: { reasons: [...] }, ... } }` and finds the candidate as the **last** garment of `reading.garments`)
- **s1 · it follows the engine, not a copy of the rules.** The stand-in marks navy with one reason of −1 in `color`, black with −0.5 in `shoes`, red with −2 in `cohesion`, and gives every other color nothing (brown gets one reason of **+0.5**). Expect: ALL24 without navy, black and red; brown is listed. Must not: a rule of the function's own listing or dropping a color the stand-in didn't mark; a positive reason counting against brown, or making the best cost negative.
- **s2 · the best color sets the line.** The stand-in marks every color −1 except olive (−0.5) and sage (−0.5). Expect: **olive, sage** (in that palette order). Must not: `[]` (a zero baseline); the −1 colors listed.
- **s3 · tolerance.** The stand-in gives navy two reasons of −0.1 and −0.2 (sum 0.30000000000000004), gives black one reason of −0.3, and every other color −1. Expect: **black, navy** (palette order; black comes before navy in `COLOR_CHOICES`, the test writer corrected this line from "navy, black" before the lock). Must not: only one of them.
- **s4 · options reach the engine.** Called with `occasion: "interview"` and `boldness: "bold"`, every `scoreParts` call receives `{ occasion: "interview", boldness: "bold" }` (and nothing else in the options); called with neither, `{ occasion: "everyday", boldness: "a_little" }`. Must not: a call with `styles` or `secondLook` set.
- **s5 · what is sent for scoring.** Over one call the stand-in sees exactly 24 `scoreParts` calls, their last garment's `color_family` values are exactly `COLOR_CHOICES` in order (no `multicolor`), no last garment carries a `saturation`, every call's earlier garments are the `others` in the given order with their own fields (saturation kept), and the reading is full body and fully clothed (`scene.framing === "full_body"`, `scene.clothed === "fully"`). Must not: a call for `multicolor`; the piece's old `color_family` or `saturation` reaching the engine.
- **s6 · failure fails closed.** The stand-in throws for navy only → `allowedColors` returns **`[]`** and does not throw. It throws for every color → `[]`. Must not: a thrown error; ALL24; a list that skips the throwing color.
- **s7 · unscored is not a deduction.** The stand-in returns `{ overall: null, parts: {} }` for every color → **ALL24**. Returns `overall: null` for red only and −1 reasons for every other color → **red** alone (it cost 0, the best). Must not: red excluded for being unscored.

## Guards ("no score moves, parity stays 100%": the plan line's own words)
- **T103-G1 · the existing suite is the proof.** `npx vitest run` in `app/packages/kitted-core` passes with no test or fixture changed: `parts.parity`, `rubric.parity`, `partsFixes.parity`, `rulesConformance`, `swapOptions` and the rest. how: the existing parity tests · expect: all green, the same count as on `main` plus the new file's · must not: a fixture, a rule number, `rubricData.ts`, `partsData.ts` or `partsFixesData.ts` edited; a parity test skipped or loosened · red: exists (not authored here: the existing suite). Run on the stub: 853 existing tests pass, 30 of 31 files green, the one red file is the new one. Its bite is the parity fixtures themselves; the test writer did not plant a bug in the scoring files (this task's brief forbids editing them), so the bite is not re-proved here.
- **T103-G2 · calling it moves no score.** For three readings from `handoff/fixtures/readings` (the test writer picks three with different outfits; `loadReading` in `test/helpers.ts`): `scoreParts(reading)` before and after a call to `allowedColors` on that outfit's garments are deep-equal (every field of the result). Also run once with `setCasualFitsV14(false)` then restored: still equal. how: unit · test: `KC3.3 · T103-G2 · scoring is unchanged by a call` · must not: any difference; a switch left changed after the test (the test restores `setCasualFitsV14(true)` in a `finally`).
- **T103-G3 · the engine's data is untouched.** A `structuredClone` of `RUBRIC_DATA` and `PARTS_DATA` taken before a batch of calls (cases a to p) deep-equals the data after. how: unit · test: `KC3.3 · T103-G3 · engine data is not written` · must not: any difference.
- **T103-G4 · inputs are never mutated.** Cases b, c, j and l run on recursively frozen `others` and `piece` objects (`Object.freeze` at every level): no throw, same results as the unfrozen run, and the objects deep-equal their originals afterwards. how: unit · test: `KC3.3 · T103-G4 · inputs are not mutated` · must not: a thrown "read only" error; a changed field.
- **T103-G5 · the diff stays in its lane.** The reviewer runs `git diff main...HEAD --stat` and expects exactly: the new `allowedColors.ts`, the new `allowedColors.test.ts`, one added line in `index.ts`, and this task's folder. how: manual check by the reviewer (not a source-text test of the code) · must not: any other file of core, any fixture, anything in `extraction-test/`, `app/src/` or `firebase/`.

*Note on the guards' red lines: G2, G3 and G4 are red with "not built". G2 and G4 were also bitten by planted bug 8 (a write to an input). G3's bite (a write to `RUBRIC_DATA` or `PARTS_DATA`) was not planted: not verified beyond "not built".*

## Planted bugs the tests must catch (the reviewer plants these one at a time)
1. Count only the Color part's reasons → cases c, d (Style and Shoes reasons missed), s1 fail.
2. Zero baseline (allowed only when the cost is exactly 0) → cases j, k, s2 fail.
3. Compare costs without the tolerance → s3 fails.
4. Keep the piece's old color or saturation → case m, s5 fail.
5. Ignore `boldness` or `occasion` → case i, s4 fail.
6. Include `multicolor`, or drop a color from `COLOR_CHOICES` → q, s5 fail.
7. Return in a different order, or with a duplicate → q, s2, s3 fail.
8. Mutate an input garment or the engine's data → G3, G4 fail.
9. Rethrow, or return ALL24, when the engine throws → s6 fail.
10. Treat a positive reason as a deduction, or let it lower the best cost → s1 fails.
11. Special-case a color list inside the file (a hard-coded "brights" set) → r fails on the seed-closet asks (and the reviewer reads the file for any color name or check ID).
12. Put the candidate first in the reading → s5 fails.

## Edges (from the spec's failure table, as they touch a pure function)
- **The model proposes a color outside the allowed list** → the sentence and the card are dropped: that is T105's gate and T110's run. Here: the list the gate will read is exact (cases a to p, r, s1 to s7).
- **Fewer than 2 colors survive → no colors card** → T105 counts the list; this function never trims or pads it (s2 returns 2 colors, s7 returns 1: both come back as they are).
- **His closet is empty / no outfit** → case n (ALL24, no error) and case p.
- **A failure mid-way** (the engine throws) → s6.
- **Offline** → nothing to test: the function does no network or storage call (core is pure by design; the other core tests already run with no network).
- **The 4 am day change** → not applicable: the function reads no clock.
- **A wipe or reinstall** → not applicable: it stores nothing.

## UI inventory
None. No screen, label, VoiceOver text or testID: this task adds a function. Light, dark and largest-text checks belong to T104's colors card and swatch row (KC3.1, KC3.2, KC3.4).

## Not testable yet
Never dropped, never counted as done.
- **KC3.3 (the model picks only from the list; a sentence naming a color outside it is dropped; a card color outside it drops the card; fewer than 2 survivors means no colors card)** · why: the model, the sentence gate and the cards are not built (T102, T105) · would verify it: T105's gate tests (the gate against this function's real output) and T110's recorded set, where the pass mark is "colors only from the allowed list 100%" (KC11.2).
- **That an allowed color really earns no color deduction when he photographs the outfit** · why: the list is judged on the closet's synthetic full-body reading, not on a vision reading of a real photo, and readings of the same photo vary · would verify it: a small set of real photo readings with a piece swapped to a listed and an unlisted color; the T110 paid run or the founder's phone replay (Y33) can carry it.
- **That the lists feel right to the founder** (for example, no second red piece next to a red top) · why: it's the rules' verdict, not a taste check · would verify it: the T110 report shows the list beside each color answer; the founder reads it.
- **Performance on a phone** · why: measured about 1.5 ms per call on the Mac (prototype), not on a device, and the tests set no timing bound (a timing test would flake) · would verify it: Kit's answer time in the T110 phone replay (Y33).

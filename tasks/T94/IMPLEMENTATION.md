# T94 · Tailored, the 8th look: implementation plan

**Size:** strict (scoring) · **From:** `plan.md` → T94 · **Spec:** `specs/tailored.md` (approved 2026-11-13, the version on main; see Open questions → founder 1) → TL1.1–TL1.7, TL2.1–TL2.2, TL3.1–TL3.4, TL4.1–TL4.4, TL5.1 · **Lane:** Fit check and scoring · **Decisions:** #460, #482–#488 (the style game; #486 holds the three mockup redraws) · **Branch:** `claude/t94-tailored-8a3084`, worktree `style-game-design-562af7`

## Goal
A guy who dresses sharp on purpose finds Tailored as an 8th look in setup, You, Style profile and Going for. A suit, or a blazer with dress trousers, reads as Tailored on his card and in How I scored ("a matching suit" goes). **Every part, score and fix stays exactly what engine v15 gives today**: Tailored is a name, never an input to a number.

## The one design rule that keeps TL3 safe
Two detectors, one framework:
- **Scoring detection** (unchanged, 7 looks): `rubric.detect_styles` / core `detectStyles`. Every number reads only this: bands, H1/H2 credits and their conditions, the look's own shoe, SX1, PB1, goes-together, the v4.1 rubric, the fix gates (`reads_as_in`).
- **Look detection** (new, 8 looks): `rubric.detect_looks` / core `detectLooks`. The same recognizer plus Tailored, with Tailored's look-alike rule and the 8-look fixed order. It feeds only names: `detected_styles` / `style_label` in every output, the look name inside reason lines, Going for, and the fix order for a Tailored pick (TL5).

Since Tailored is never added to the scoring list, no band, credit or charge can see it. The TL3 script proves it on every case.

## Files
In the plan line's lane:
- `extraction-test/rubric.py`: Tailored's tables, role, veto and gate; `LOOK_ORDER`; `detect_looks`; `score()` outputs the look detection.
- `extraction-test/rubrics/parts_proto.py`: look fields on the outfit dict; look names in lines; outputs.
- `extraction-test/tailored_same_scores.py` (new): the $0 before/after proof (TL3).
- `extraction-test/results/tailored/` (new): its report (`report.md`, `summary.json`). Note: `extraction-test/results` is also named by the Launch lane; nothing else there is touched.
- `app/packages/kitted-core/src/`: `types.ts`, `rubric.ts`, `parts.ts`, `partsFixes.ts`, `goingFor.ts`, `index.ts`; generated `rubricData.ts`, `partsData.ts`, `partsFixesData.ts` (by `scripts/gen-rubric-data.mjs`, never by hand).
- `app/src/features/onboarding/looks.ts`: the Tailored entry and the three redraws.
- `app/src/i18n/en.ts` (shared): two keys.
- `app/src/data/types.ts` (shared): `STYLES`.

Named by the spec but outside the plan line's files (open question technical 13 asks the coordinator to allow them):
- **Scoring fixtures:** `handoff/fixtures/parts_fixes.py` (the fix order, TL5), `make_rubric_json.py` (new sets, `lookOrder`), `kitted_logic.py` and `make_parts_parity.py` (the path trap below; one more picks variant), and the regenerated `rubric.json`, `parts.json`, `fixes.json` (unchanged unless the catalog changes: it doesn't), `rubric_parity.json`, `parts_parity.json`, `parts_fixes.json`, `expected_scores.json`, `rules_conformance.json`.
- **Rulebook and Kit:** `rubric/v5-styles.md` (the Tailored section, the name lines, the rule count) and `rubric/stylist-guide.md` (Kit's Tailored entry). The guide forces a regenerated `app/src/features/ask/guide.generated.ts` (`node scripts/gen-guide.mjs`; Kit's lane; `askC2.test.ts` fails otherwise).
- **Compile-only:** `app/src/features/finish/packs.ts` (Free and Pro lane). `PACKS` is `Record<StyleKey, LookPack>`, so a new key doesn't compile without it (founder 2).
- **Demo screens for screenshots:** `app/src/demo/scenarios.ts` and `app/src/demo/prepareDemoScreen.ts`, adding screens 292–296 only.
- **Flow:** `app/e2e/flows/T94-tailored-tile.yaml` (new; the test writer writes it).

**Not touched:**
- `PickLooksScreen.tsx`, `LookTile.tsx`, the style game's screens (T113);
- `features/you/*` and `(tabs)/you/*`: they render `LOOKS`, so Tailored appears with no change;
- `GoingFor.tsx` and `fitcheck/goingFor.ts`: they read `LOOKS` and `styleLabel`;
- `features/morning/*` (its look menu reads `STYLES`);
- `firebase/`: nothing there checks look keys;
- `src/sync/schema.ts`: it names kv keys only, never look values;
- `handoff/02-screens.md`: the copy goes in `en.ts` (technical 8).

## Interfaces (the test writer reads only this section)

### Python, `extraction-test/rubric.py`
```python
TL_JACKET = {"suit_jacket", "blazer", "sport_coat", "unstructured_blazer"}        # = TAILORED_OUTER
TL_TROUSERS = {"suit_trousers", "trousers"}
TL_NEVER = {"jeans", "chinos", "cargos", "sweatpants", "joggers", "shorts", "athletic_shorts", "track_pants",
            "chunky_sneaker", "performance_runner", "basketball_sneaker", "slides_sandals", "work_boot", "hoodie",
            "sweatshirt", "graphic_tee", "tank_top", "jersey", "fleece"}          # identical to T69's TL_NEVER
TL_SIGNATURE_UP = TL_JACKET
TL_HOME_UP = {"dress_shirt", "oxford_shirt", "sweater", "knit_polo", "tee", "overcoat"}
TL_SIGNATURE_SHOES = {"loafer", "derby", "dress_shoe", "chelsea_boot"}
TL_HOME_SHOES = {"white_leather_sneaker", "low_profile_sneaker"}

STYLE_ORDER = [...]          # UNCHANGED: the 7 scoring looks, same order
LOOK_ORDER = ["vintage_sport", "outdoor", "workwear", "streetwear", "tailored", "classic_prep", "minimalist", "smart_casual"]
STYLE_NAMES["tailored"] = "tailored"                     # lower case like the others ("reads as tailored")
STYLES["tailored"] = (_role_tailored, _veto_tailored, _gate_tailored, None)

def is_tailored(garments) -> bool
    """TL1 on scored garments (no unsure pieces, no accessories): a TL_JACKET among the top/outerwear pieces, the
    bottom in TL_TROUSERS, no piece in TL_NEVER, no main piece at volume 5. Equals _evaluate("tailored", Outfit(gs))."""

def detect_looks(garments, picks=None) -> {"detected": [looks in LOOK_ORDER], "label": look or None}
    """The 7 as detect_styles evaluates them, plus Tailored. Label: if Tailored is detected, smart_casual and
    classic_prep drop out first (TL2, before picks); then today's pairwise rules; then his picks among what's left;
    then LOOK_ORDER. Picks never change "detected"."""

detect_styles(garments, picks=None)      # UNCHANGED signature and result (7 looks, today's label)
score(...)["detected_styles"], ["style_label"]   # now detect_looks(...)'s; every number from detect_styles as today
```
- **Role** (`_role_tailored(g, c) -> (pos, neg)`): top or outerwear piece in `TL_SIGNATURE_UP` 2, in `TL_HOME_UP` 1; bottom in `TL_TROUSERS` 2; shoes in `TL_SIGNATURE_SHOES` 2, in `TL_HOME_SHOES` 1; everything else 0. No −1 pieces: TL1's "never" pieces are a veto.
- **Veto:** any `TL_NEVER` piece; any main piece at volume 5.
- **Gate:** the extra condition, a `TL_JACKET` piece among tops and outerwear and the bottom in `TL_TROUSERS`.
- **TL1 equivalence:** with a jacket (2) and dress trousers (2) in view, TL1's points rule always passes (anchor, 2 slots, total ≥ 3). So `is_tailored` and the framework always agree. A test can check this on every reading.

### Python, `extraction-test/rubrics/parts_proto.py`
- The outfit dict `o` gains:
  - `looks` = `detect_looks(gs, styles)["detected"]`;
  - `look` = its label;
  - `look_nopick` = `detect_looks(gs, {})["label"]`;
  - `looks_noshoe` = `detect_looks(non-footwear gs, styles)["detected"]`.

  `det`, `label`, `label_nopick` and `det_noshoe` are unchanged and remain the only inputs to points.
- `_shown(style, looks) -> str`: `"tailored"` when `style in ("smart_casual", "classic_prep")` and `"tailored" in looks`; else `style`.
- **Lines** (text only; every condition and amount unchanged):

  | Check | Today | After |
  |---|---|---|
  | `H1_reads_as_style` | `reads as {label}`, or `a matching suit` | `reads as {NAMES[o["look"]]}` whenever `o["look"]`. `a matching suit` stays only when the outfit is a suit and reads as no look (founder 1). |
  | `H2_clear_top_to_toe` | `clearly {h2_label} top to toe` | `clearly {NAMES[o["look_nopick"]]} top to toe` |
  | `SC_chosen_for_look` (one look without shoes) | `a {x} shoe for a {x} outfit` | `x = _shown(det_noshoe[0], looks_noshoe)` |
  | `PB1_roomier_than_look` | `roomier than a {label} outfit` | `roomier than a {NAMES[o["look"]]} outfit` (when `o["label"]` is set, as today) |
- **Output:** `detected_styles = o["looks"]`, `style_label = o["look"]`. No other output key changes.
- **Version:** `version` and `engine` stay as they are (technical 7).

### Python, `handoff/fixtures/parts_fixes.py` (the fix order, TL5)
```python
TAILORING_CHECKS = ("FF1_sleeves_tailored", "FF1_sleeves_long", "FF1_cuffs_ribbed", "FF7_pooling",
                    "FF7b_full_break_narrow", "H3_another_world", "GT1_graphic_under_tailoring", "SX1_another_look")
def _tailoring_fix(base, res, w) -> bool
    """The working outfit w has a TL_JACKET piece (top or outerwear), and the fixed card `res` no longer carries a
    TAILORING_CHECKS check that `base` carried (as a reason on any part). FF7_pooling and FF7b_full_break_narrow count
    only when w's bottom is trousers or suit_trousers."""
```
- Each candidate gets `tailor_lead`: 0 when `"tailored"` is among his picks (any position, weight > 0) and `_tailoring_fix` holds; else 1.
- **Sort key:** `(rank, tailor_lead, -gain, pick_rank, -raw_gain, effort, shift, order)`. With no Tailored pick every `tailor_lead` is 1, so the order is exactly today's.
- `tailor_lead` is dropped from the output like `pick_rank`, so the output shape is unchanged.
- The Smaller step and Next level are unchanged. No new Next level line: the spec allows no new words.

### TypeScript, `@kitted/core`
```ts
// types.ts
export type DetectedStyle =
  | "vintage_sport" | "outdoor" | "workwear" | "streetwear" | "tailored" | "classic_prep" | "minimalist" | "smart_casual";
// RubricData.styles gains: lookOrder: DetectedStyle[]   (order stays the 7 scoring looks; names gains "tailored")

// rubric.ts
export interface RubricEngine {
  detectStyles(garments: readonly Garment[], picks?: Styles | null): DetectedStyles;  // unchanged: 7 looks
  detectLooks(garments: readonly Garment[], picks?: Styles | null): DetectedStyles;   // new: 8 looks, TL2's label
  isTailored(garments: readonly Garment[]): boolean;                                  // new: TL1
  // …the rest unchanged
}
export function detectLooks(reading: Reading, picks?: Styles | null): DetectedStyles;  // like the top-level detectStyles
// RubricHelpers.role("tailored", g, c) works (STYLES record gains tailored's role/veto/gate)
// RubricResult.detectedStyles / styleLabel: the look detection (numbers unchanged)

// parts.ts: PartsResult.detectedStyles / styleLabel are the look detection; the lines follow the table above.
// partsFixes.ts: suggestPartsFixes(reading, opts) unchanged signature; Tailored among opts.styles turns on the lead key.
// goingFor.ts: goingForAdvice(reading, "tailored", opts) works. pullingPiece's `reads` uses detectLooks (for the
// 7 old looks the membership is identical, so their advice doesn't change).
```
- `index.ts` exports `detectLooks` and `isTailored`.
- `PARTS_DATA` and `RUBRIC_DATA` are regenerated. `RUBRIC_DATA.styles.lookOrder` equals Python's `LOOK_ORDER`. `RUBRIC_DATA.styles.sets` gains `TL_JACKET`, `TL_TROUSERS`, `TL_NEVER`, `TL_HOME_UP`, `TL_SIGNATURE_SHOES` and `TL_HOME_SHOES` (via `DETECTION_SETS` in `make_rubric_json.py`).

### App
- `app/src/data/types.ts`:
  ```ts
  STYLES = ['streetwear', 'smart_casual', 'minimalist', 'workwear', 'classic_prep', 'tailored', 'vintage_sport', 'outdoor']
  ```
  `normStyleKey('tailored') === 'tailored'`. Old aliases are unchanged.
- `app/src/i18n/en.ts`:
  - `'style.tailored': 'Tailored'`
  - `'onb.looks.line.tailored': 'Suits, blazers, dress trousers, loafers'`

  These are the spec's words, exactly.
- `app/src/features/onboarding/looks.ts`, `LOOKS` order: streetwear, minimalist, smart_casual, classic_prep, **tailored**, workwear, outdoor, vintage_sport. Tailored's entry is copied exactly from `tasks/style-quiz/src/drawings.ts`:
  ```ts
  { style: 'tailored', outfits: [
    [top('blazer', '#3A3D44', { fit: 'regular' }), bottom('trousers', '#3A3D44', { fit: 'straight', hem: 'no_break' }), shoe('derby', '#1C1B1D')],
    [top('blazer', '#1F2A44', { fit: 'regular' }), bottom('trousers', '#1F2A44', { fit: 'straight', hem: 'slight_break' }), shoe('sneaker', '#F6F5F1', { sole: WHITE_SOLE })],
  ] }
  ```
  The two outfits are a charcoal suit (jacket and trousers the same colour) with black derbies, and a navy suit with white leather sneakers.
- **The redraws** (#486; a visual change the PR flags for the founder):
  - Streetwear outfit 2's shoe: `color '#26272B', sole '#F2F1EC', laceColor '#F2F1EC'` (still chunky);
  - Outdoor outfit 1's top: `color '#3D5A73'` (a slate-blue shell; still `jacket`, fullZip);
  - Outdoor outfit 2's top: `type 'quarter_zip'`, `details: { ribHem: false }` (keeps `#D8D2C2` and the heather pattern).
- **Reused labels and testIDs** (nothing new on a component):
  - setup tile VoiceOver `onb.looks.tileA11y` → `Tailored: Suits, blazers, dress trousers, loafers`; picked: `Tailored, pick {n}: Suits, blazers, dress trousers, loafers`;
  - You and Style profile drawing: testID `style-art-tailored`;
  - You's VoiceOver: `Tailored, first pick` when it's the first of several;
  - Style profile tile: `Tailored` / `Tailored, pick {n}`;
  - Going for tile: `Tailored. Suits, blazers, dress trousers, loafers`;
  - Going for advice: `Reads as tailored.`;
  - How I scored row: `Reads as tailored` (the engine line, capitalized by `partsRows.cap`).
- `app/src/features/finish/packs.ts`: `PACKS: Readonly<Partial<Record<StyleKey, LookPack>>>`, and `starterList` uses only the picks that have a pack: `picksOf(styles).filter((k) => PACKS[k])`. So a Tailored pick alone gives today's 12, and Tailored with others gives the others' blend (founder 2).

### Demo screens (new, for screenshots; numbers checked free on Nov 18: the highest is 291)
| n | name | what |
|---|---|---|
| 292 | You · Tailored picked | `/you`, scenario `full`, `looks: [['tailored', 0.5], ['classic_prep', 0.25], ['minimalist', 0.25]]` |
| 293 | Style profile · Tailored picked | `/you/profile` under `/you`, the same looks |
| 294 | Score card · a suit reads as Tailored | `/stylist`, `firstRun`, a check of `s09` (the navy suit) at everyday |
| 295 | Why this score · the suit | `/sheets/why/<s09 check id>` under `/stylist`, like screen 8 |
| 296 | Going for · Tailored offered | `/stylist`, 71's wait state with `GF_LOOKS` = tailored, classic_prep, minimalist, the photo `s09` |

Screen 2 (Pick looks), 17 (You) and 80 (Style profile) show the new tile with no change.

### Scripts
- `extraction-test/tailored_same_scores.py [--base <git ref>] [--sets parity,fixes,rubric,conformance,corpus,phone,gold]`. The default base is `541440c2` (this branch before any engine change). It writes `extraction-test/results/tailored/report.md` and `summary.json` and exits 1 on any failure. Details are under Step 4.
- Python tests (the test writer's): `/usr/bin/python3 extraction-test/tailored_test.py` and `/usr/bin/python3 extraction-test/rules_conformance.py`.

## Steps
0. **Before anything heavy:**
   - Check memory with `top -l 1 | grep PhysMem`. It was 80 MB free on Nov 18. Run the fixture regeneration and the TL3 script alone.
   - `export KITTED_DATA=/Users/eyu/Desktop/files/Kitted`: the git-ignored data (phone pulls, `results/gold1/raw.json`, `inputs/*/fixes.csv`) lives only in the main checkout.
1. **The generator path trap (fix first).** `kitted_logic.py` hard-codes `KEMPT = "/Users/eyu/Desktop/files/Kitted"` for both code and data. From a worktree, `make_parity.py` and `make_rubric_json.py` would import **main's** `rubric.py` and silently produce today's fixtures. Fix it:
   - In `kitted_logic.py`, import code from its own checkout (`os.path.join(os.path.dirname(__file__), "../..")`). Read data from `KITTED_DATA`, defaulting to the old path.
   - `make_parity.py` hashes the code file it imported.
   - In `make_parts_parity.py` and `make_parts_fixes.py`, read `screenshots/phone/…` from `KITTED_DATA`.
   - **Check before going on:** running each generator unchanged on this branch must reproduce today's committed fixtures byte for byte. If one doesn't, stop and report; never commit a drifted fixture.
2. **The TL3 script, run base against base:** zero differences. That proves the comparer before it's trusted.
3. **The Python engine:** `rubric.py`, then `parts_proto.py`, then `parts_fixes.py` (Interfaces above).
   - In `make_rubric_json.py`, add the sets to `DETECTION_SETS` and `"lookOrder": r.LOOK_ORDER`.
   - In `make_parts_parity.py`, add `PICKS_VARIANTS["tailored"] = [["tailored", 1.0], ["smart_casual", 0.5]]`. Its own "picks never move a number" assertion then covers a Tailored pick too.
   - The test writer's `tailored_test.py` and the updated `rules_conformance.py` must pass.
4. **TL3 proof** (`tailored_same_scores.py`, base against this branch; heavy, alone):
   - **The sets compared:**
     - (a) the parity sets: the base commit's `parts_parity.json`, `parts_fixes.json`, `rubric_parity.json` and `rules_conformance.json` (`git show <base>:…`; their `expected` is the base engine's exact output) against the same cases re-run on this branch's engine. Cases are matched by their config (src, reading id, occasion, styles, boldness, second look, tune, closet, warm, first check), with pools resolved.
     - (b) the saved real photos, run on both engines: the base engine is `git show <base>:` of `rubric.py`, `rubrics/parts_proto.py` and `handoff/fixtures/parts_fixes.py` into a temp dir, run in its own subprocess so module names never collide. The photos are the corpus (`results/parts1/corpus.json`, 78), every phone pull's scored checks (deduped by image hash; the loader in `hoodie_layer_paper.py`), and every gold run (`results/gold1/raw.json`).
     - Each real photo is scored at its own occasion (gold: everyday) with no picks and with its profile's picks, with fixes.
   - **Identical, exactly:** every part's score, display, NA reason, reasons' checks and points, tips' checks and would-cost; overall, raw, average, unrounded values, earned bonus, piled penalty, condition, occasion, floored, care or strain, lowest, second look; every fix's id, class, to, gain, raw gain, item, tag and edits; the Smaller step; the Next level id; the none line.
   - **Allowed to differ, name only:**
     - `detected_styles` may gain `"tailored"` (in `LOOK_ORDER` position) and nothing else;
     - `style_label` may become `"tailored"` (only when `"tailored"` is detected);
     - a line or copy may differ only by a look name once both are normalized (any of the 8 names → `<look>`; `a matching suit` → `reads as <look>`).
   - **Fails:**
     - anything else differs;
     - a reading meets `is_tailored` but its label isn't `tailored` (TL3.3);
     - the label is `tailored` on a reading that doesn't meet `is_tailored`.
   - **The report** (`results/tailored/report.md`) gives:
     - counts by set: cases, identical, name-only and failed, with every failure listed in full;
     - the name changes, by old → new label, with 3 examples each;
     - the count of suits that read as no look and so keep "a matching suit" (founder 1);
     - **the 6 photos** (TL3.3): the gold photos where `PR3_tailored_line` fires on run 0 under engine v13, where #266's count came from. List the real count and the photos if it isn't 6. For each, give: the file; profile unknown (web photo, rule 7), age band unknown, picked looks none known, scored with the stated test profile Minimal + Smart casual 0.5 each at everyday; TL1 met (and if not, the piece that blocks it); the base label → the new label; the base score → the new score; PASS or FAIL.
     - **Every other saved jacket-led reading** in the same columns: 9 in the corpus, all meeting TL1 by a quick count on Nov 18; the phone pulls with the founder's profile (born 2004, 22–25; picks streetwear, minimal, workwear; the constant `FOUNDER` in `hoodie_layer_paper.py`).
   - **If any number would change, stop** (TL3.4). Commit nothing that tunes it away; report the cases to the coordinator for the founder.
5. **Regenerate the fixtures**, in this order, with `KITTED_DATA` set, from this worktree's `handoff/fixtures`:
   ```
   make_readings.py → make_seed.py → make_expected.py → make_parity.py → make_rubric_json.py
     → make_parts_json.py → make_parts_parity.py → make_parts_fixes.py → (extraction-test) rules_conformance.py
     → (app/packages/kitted-core) node scripts/gen-rubric-data.mjs
   ```
   Never edit a fixture or a generated `*Data.ts`.
6. **Port to `@kitted/core`:** `types.ts`, `rubric.ts` (STYLES record, `detectLooks`, `isTailored`, `lookOrder`), `parts.ts` (the 4 lines, outputs), `partsFixes.ts` (`tailorLead` in `Cand` and `keyOf`), `goingFor.ts` (`reads` via `detectLooks`), `index.ts`. These must pass: `npm test --workspace @kitted/core` (parity, fixes parity, rules conformance, the test writer's `tailored.test.ts`) and `npm run typecheck --workspace @kitted/core`.
7. **The app:** `STYLES`, the `en.ts` keys, `looks.ts` (Tailored and the redraws), `finish/packs.ts`, and demo screens 292–296.
8. **The docs:**
   - **`rubric/v5-styles.md`:**
     - Rename "The seven styles" to "The eight looks". Its intro gives the 8-look fixed order and "plus any extra condition listed" (as today).
     - [STY-1] becomes "(one of the eight below; a matching suit reads as Tailored)".
     - [SMC-2] becomes "a matching suit (it reads as Tailored)".
     - [SHO-7]: the suit's shoes keep their credit; the words name Tailored.
     - A new **Tailored** section, after Classic prep:
       - **[TLR-1]** signature and home pieces;
       - **[TLR-2]** the extra condition (a tailored jacket and dress trousers; a matching suit always meets it);
       - **[TLR-3]** never Tailored with…;
       - **[TLR-4]** the name: Tailored wins over smart casual and classic prep before his picks; the fixed order;
       - **[TLR-5]** a name only: no credit or charge of its own; the outfit keeps what it earned as a suit, smart casual or prep, and an outfit that read as no look gets nothing new;
       - **[TLR-6]** with Tailored among his picks, a fix that clears a tailoring fault leads within its kind of fix.
     - Update the rule count line and the header's count to the real numbers after the test writer's cases.
   - **`rubric/stylist-guide.md` §12:** add one "Tailored" bullet after Classic prep, gathered from §2 (the shoulders, a slightly relaxed jacket, a tailor is cheap), §3 (one clean break) and §10 (don't overdress for an errand). Add no new rules. Then run `node scripts/gen-guide.mjs` in `app/`.
9. **Run** `npm run check` in `app/` (alone).
10. **Screenshots** (light, dark and the largest text) of screens 2 (scrolled to Tailored), 292, 293, 294, 295 and 296, saved as `tasks/T94/shots/<NN>-<state>-<light|dark|ax5>.png`. Then run the flow.
11. Add a DECISIONS-LOG entry: the two detectors, the TL5 key, the generator path fix, and the defaults below.

## Data changes
- No migration. Picks stay ordered keys. Nobody has `tailored` yet. `normStyleKey` already accepts any key in `STYLES`.
- A saved check keeps its stored `details.readsAs` until it's re-scored. A re-scored suit check then says Tailored with the same score (spec Data).
- An older build reading a synced `tailored` pick drops it (`normStyleKey` returns null). Sign-in isn't shipped, so this can't happen yet.

## What must not break
- Every number: TL3's script, the four parity suites, and `make_parts_parity.py`'s own "picks never move a number" assertion.
- The 7 old looks' detection, label and Going for advice, unchanged on every case where Tailored isn't detected.
- The fix order for every pick list without Tailored (identical keys).
- Setup's first three tiles and the 7-tap flows (`T39-setup-fresh.yaml` taps Streetwear, still first). The 4th-tap shake. "Something else?" last.
- `CORE_IDS` and today's 12 basics for no picks.
- `askC2.test.ts` (the guide matches the generated file).

## Open questions
**Answered (Nov 18, by the parent session, which answers for the founder overnight; logged as #491):**
- **4 → A.** Build name-only on today's main engine, with one shared is-Tailored check using T69's exact never-list. Main's approved TL3 is name-only; the founder's Nov 17 "Yes, edit the spec" (#480, unmerged `claude/rules-by-style-1f91b5`) puts Tailored in the scoring through T69's look-by-look columns, which aren't on main, so on today's engine name-only is what both decisions produce. Whichever of T94 and T68/T69 merges second rebases onto the single check, regenerates fixtures from the Python engine and reruns the TL3 script. The PR says: "Tailored enters the scoring when T69's columns merge (#480); until then, name only."
- **1 → recommended.** A matching suit that isn't Tailored keeps its +0.5 and the words "a matching suit".
- **2 → recommended.** Next best buy skips a Tailored pick for now; the PR lists it as a known gap (the starter catalog has no blazer, trousers or derbies).
- **3 → recommended.** Apply the three redraws; the PR flags them with before/after tiles.
- **Technical defaults 1–15 below: accepted**, including the files outside the plan line (13).

**For the founder** (through the coordinator)
1. **A matching suit that isn't Tailored.** This is a suit worn with chunky, running or basketball sneakers, slides or work boots, a hoodie, sweatshirt, graphic tee, tank, jersey or fleece under it, or anything at roominess 5. Today How I scored says "A matching suit +0.5". TL1 says it isn't Tailored, and TL2.2 says no card says "a matching suit" any more: the spec doesn't cover this case.
   - *Recommended:* keep the same +0.5 and the existing words "a matching suit" for these few outfits only (the card names no look, so "Reads as tailored" would contradict it). The TL3 report gives how many saved photos this is (likely 0).
   - *Other:* "Reads as tailored" there too.
2. **Next best buy for a Tailored pick.** The starter list has no blazer, dress trousers or derbies, and new rows mean new names and prices (his call).
   - *Recommended:* for now a Tailored pick is skipped by the starter list (alone, he gets today's 12; with other picks, theirs); a Tailored list is a later task with his OK on the rows.
   - *Other:* a list from today's rows (oxford, loafers, overcoat, crewneck, white sneakers, belt); it can't include a jacket or trousers.
3. **The setup tiles' three redraws** from the style game's fairness work (Outdoor's slate-blue shell, Outdoor's heather zip pullover, Streetwear's black chunky sneakers). *Recommended:* apply them, so setup, You and the game draw the same outfits; his OK on the PR screenshots.
4. **The spec has two versions (coordinator first).**
   - **On main** (this plan): TL3 "every score stays the same".
   - **On the unmerged T68/T69 branches** (`claude/rules-by-style-1f91b5`, `claude/t69-v16-port`, commit `fe47e3f5`, his "Yes, edit the spec" on Nov 17): TL3 becomes "Tailored in the scoring", with TL3.1 against the rescoring engine and a new TL3.5. T69 (strict, building) already adds `is_tailored`, `graded_looks` and `TL_NEVER` to `parts_proto.py` and ports them.
   - *Recommended:* build T94 name-only on today's v15 as scoped. Use T69's exact never-list so the two recognizers agree. Keep T94's engine change small: a new `detect_looks` and four line edits. Whichever of T94 and T69 merges second rebases onto one shared `rubric.is_tailored`, regenerates the fixtures and re-runs the TL3 script against the engine then on main.
   - *Other:* wait for T69 to merge and plan T94 against the changed spec.

**Technical defaults** (the coordinator logs them)
1. Two detectors: scoring keeps 7 looks; names, Going for and the TL5 order read 8. The outputs `detected_styles` / `style_label` (parts and the v4.1 rubric) carry the 8-look result.
2. TL1's never-list is T69's `TL_NEVER` exactly ("running sneakers" = `performance_runner`; `trail_shoe` isn't on it, and the live reading can't produce it).
3. Home pieces: "knit" = `sweater`; "plain tee" = `tee` (the subcategory, never the flip-prone pattern); "plain low leather sneakers" = `white_leather_sneaker`, `low_profile_sneaker`. They can't change detection: the jacket always fills the upper slot, and the gate needs dress trousers.
4. Ties: Tailored drops smart casual and prep first, then today's pairwise rules, then picks, then the 8-look order. So Tailored and minimal (an unstructured blazer) go to his picks, then Tailored.
5. Look names in lines: H1 and PB1 name the card's look; H2 the pick-free look; the look's-own-shoe line Tailored where it stands for smart casual or prep.
6. TL5's "lead" is a sort key after the class (free, closet, own, tailor stays) and before the gain, for Tailored anywhere among his picks. A "tailoring fix" is one that clears a sleeve, hem-under-trousers, jacket-with-jeans or graphic-tee-under-tailoring check on an outfit with a tailored jacket.
7. No version bump (`parts` 1.14.0, `engine` v15, rubric 4.1.0): the numbers are the same, so a stored check's version still promises the same score. It also keeps the merge with T69 smaller.
8. The two copy keys go in `en.ts` (the plan line's file, as `starter.item.13`–`38` did), not the deck.
9. `STYLES` and `LOOKS` place Tailored after Classic prep.
10. The generators read code from their own checkout and data from `KITTED_DATA`. `make_parts_parity.py` gains a Tailored picks variant.
11. Demo screens 292–296.
12. "6 of 74 saved real photos" in the spec is #266's "6 of 200 scored gold photos (v13, run 0)"; the script recomputes the list. A factual slip in the spec's Why, not a change.
13. Files outside the plan line (listed under Files) are needed for the spec's own Touches. The coordinator confirms.
14. The rule IDs are `[TLR-1]`–`[TLR-6]`.
15. The demo, docs and flow screens follow `tasks/T94/TESTING.md`.

## Risks in the lane
- **T69 collision (the biggest).** T69 rewrites `parts_proto.py` (+735 lines), `parts.ts`, `v5-styles.md` and every parity fixture. A text merge of the 22 MB fixtures is impossible: regenerate them after the merge, never resolve them by hand.
- **The generator path trap.** Without Step 1 the fixtures silently come from main's engine, and parity would pass on the wrong code.
- **Memory.** The fixture regeneration and the TL3 script each load 10–22 MB JSON files and score tens of thousands of cases. Run them one at a time, alone, and process one fixture file at a time.
- **Other lanes' files:**
  - `guide.generated.ts` (Kit lane, T101–T110 active): regenerate after any merge.
  - `finish/packs.ts` (Free and Pro): a 2-line change.
  - `demo/scenarios.ts` and `prepareDemoScreen.ts` (many tasks): stage only our hunks.
- **Existing tests that name a look for a suit or a blazer with trousers will turn red by design.** The test writer pre-updates them (TESTING.md lists the candidates); any the implementer finds later is a dispute, never an edit.
- **T113 replaces setup's Looks step with the game.** Its flows and tests will supersede `T94-tailored-tile.yaml`. The mockup's `drawings.ts` appends its own Tailored and redraws; once `looks.ts` has them it double-applies them (harmless; T111/T113 should drop them).

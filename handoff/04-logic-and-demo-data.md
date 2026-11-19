# 04 · Logic and demo data

*Written Oct 6, 2026 for the Claude instance that builds the Kitted demo. You have no memory of this project, so this file is explicit. Every path is absolute.*

This file covers everything the demo computes, and the data it starts with:
- the rubric spec and its **verified TypeScript port, `@kitted/core`** (§4, §4.0)
- the fix engine (§5)
- the anchored re-check (§6)
- "Not quite right?" corrections (§7)
- partial checks, occasions and "same photo, same score" (§8)
- Rotation (§9)
- the seed data (§10)
- the mock `ReadingSource` (§11)

**The one rule:** `/Users/eyu/Desktop/files/Kitted/extraction-test/rubric.py` (rubric v3.1) is the source of truth for scores. The TypeScript package `@kitted/core` (`/Users/eyu/Desktop/files/Kitted/handoff/ts/kitted-core/`, §4.0) already reproduces every case in `fixtures/rubric_parity.json` exactly (§4.9). **Don't re-port the rubric; import the package.** If you change the package and TypeScript and Python disagree, TypeScript is wrong. Don't edit `rubric.py` or the fixtures to make a test pass. Report the mismatch to the founder.

**Verified on Oct 6: 5,694/5,694 parity cases match** (bit for bit, including the 27 `fp_boundary` cases), plus 181/181 demo score cases, 23/23 mockup checks, 14/14 fix cases, 4/4 re-checks, 1/1 correction, 2/2 partial checks and 26/26 Rotation checks. Command (no npm install needed):
```
cd /Users/eyu/Desktop/files/Kitted/handoff/ts/kitted-core
node /opt/homebrew/lib/node_modules/eas-cli/node_modules/typescript/bin/tsc -p tsconfig.build.json --outDir /tmp/kcbuild
node scripts/verify.mjs /tmp/kcbuild        # prints the counts, ends with ALL CHECKS PASSED
```

---

## 0. Files in `/Users/eyu/Desktop/files/Kitted/handoff/fixtures/`

| File | What it is | Used by |
|---|---|---|
| `readings/<id>.json` (12) | One vision reading per demo photo, in the exact `schema.json` shape (`scene` + `garments`) | `MockReadingSource` → the app's bundled demo readings |
| `readings/variants/*.json` (8) | Corrections, what-ifs, snaps, and the real p01 readings | Tests |
| `readings/INDEX.json` | Sidecar: provenance (real run id or hand-authored), the photo's SHA-256, license, latency, mockup use | `MockReadingSource`, tests |
| `expected_scores.json` | rubric.py output for every demo reading × 9 occasions (181 cases), plus the fix, re-check, correction and partial-check expectations | `test/demo-story.test.ts`, `test/fixes.test.ts`, `test/recheck.test.ts` |
| `rubric_parity.json` (6.1 MB) | 1,898 readings × 3 configs = **5,694 cases** with rubric.py's exact output | `test/rubric.parity.test.ts` |
| `rubric.json` | Every rubric table and number as data, plus the draft fix catalog | Compiled into `@kitted/core` as `src/rubricData.ts` (`npm run gen:rubric`) |
| `fixes.json` | The fix catalog (also embedded in `rubric.json → fixes`) | `suggestFixes()` (`src/fixes.ts`) |
| `seed.json` | Demo seed: 2 scenarios (`firstRun`, `full`) reproducing the mockups | `SeedLoader` |
| `rotation_expected.json` | What the Rotation algorithm in §9 gives on the seed closet | `test/rotation.test.ts` |
| `kitted_logic.py` | **Python reference** for the fix engine, re-check merger, snaps, corrections and Rotation | Ported in `@kitted/core`; read it when this spec is ambiguous |
| `parts.json` | The parts engine's tables and numbers (weights, reward and fault sizes, caps, ceilings, the bonus, the TUNE block), version `1.0.0`, separate from `rubric.json` | Compiled into `@kitted/core` as `src/partsData.ts` (same `npm run gen:rubric`) |
| `parts_parity.json` (8.8 MB) | `parts_proto.py` (v3, plus v1/v2/what-if tune variants) over every `rubric_parity.json` case, the saved corpus, the newest phone pull, batch 1 / zoom1 runs (with the second look) and parts edge cases: **10,934 cases** | `test/parts.parity.test.ts` |
| `make_readings.py`, `make_seed.py`, `make_expected.py`, `make_parity.py`, `make_rubric_json.py` | The generators | Re-run after any rubric change |
| `make_parts_json.py`, `make_parts_parity.py` | The parts engine's generators (data, parity) | Re-run after any `parts_proto.py` change, and after `make_parity.py` (the parts parity reuses its readings by id) |

**Regenerate everything.** Run these in this order, using `/usr/bin/python3` (the python.org Python on this Mac lacks HTTPS certificates; that doesn't matter here, but stay consistent). They need no network, no API key and no packages:
```
cd /Users/eyu/Desktop/files/Kitted/handoff/fixtures
/usr/bin/python3 make_readings.py && /usr/bin/python3 make_seed.py && /usr/bin/python3 make_expected.py \
  && /usr/bin/python3 make_parity.py && /usr/bin/python3 make_rubric_json.py
```
**The parts engine** (`extraction-test/rubrics/parts_proto.py`, v3; not wired into the app yet), after the above:
```
cd /Users/eyu/Desktop/files/Kitted/handoff/fixtures
/usr/bin/python3 make_parts_json.py && /usr/bin/python3 make_parts_parity.py
cd /Users/eyu/Desktop/files/Kitted/app/packages/kitted-core && node scripts/gen-rubric-data.mjs   # rubricData.ts + partsData.ts
```
`make_parts_parity.py` asserts that every part check, tip, NA reason, ceiling and early return fires at least once. Where `parts_proto.py` raises (6 fuzz readings: a garment with no subcategory reaching a reason line), the case stores the error and the TypeScript must throw the same.

Each script asserts the mockup numbers it depends on and fails loudly if something drifts. `kitted_logic.py` wraps `rubric.round` to capture the unrounded doubles. It never changes `rubric.py`.

---

## 1. What is real in the demo

| Step | Demo | Real later |
|---|---|---|
| Vision reading | **Mocked:** `MockReadingSource` returns `readings/<id>.json` | Gemini 3.8 Flash, thinking off, v3 format (`app-build-spec.md` D9) |
| Score | **Real:** `score()` from `@kitted/core` (port of rubric.py) | Same, plus the Cloudflare Worker re-scores with the same package |
| Fixes and predicted gains | **Real:** `suggestFixes()` re-scores modified readings | Same |
| Re-check merge, corrections, snaps, Rotation | **Real** | Same |
| Explanation text | **Template** sentences (§5.6) | Streamed by a text model, then checked by `NumberCheck` |
| Closet, Lookbook, You history | **Seed** (`seed.json`) | Built up by use |
| Rotation 37, "+3 this week", "+9 fits" | **Seed display values** (§9.4) | Computed |

---

## 2. The reading format (the rubric's input)

The locked format is **v3**: `/Users/eyu/Desktop/files/Kitted/extraction-test/schema.json` + `prompt.txt` (`app-build-spec.md` D9, ruling 2). `app-build-spec.md`'s "v4 / V4Adapter / `scene.feet` / `bottom.hem`" wording is superseded. Build on v3.

```jsonc
{
  "scene": { "framing": "full_body|three_quarter|upper_only", "shoes_visible": true, "people_count": 1,
             "mirror_selfie": false, "lighting": "good|dim|harsh", "clothed": "fully|partial" },
  "garments": [ {
    "category": "top|outerwear|bottom|footwear|accessory|traditional",
    "subcategory": "tee|…|other",             // 59 values in schema.json
    "color_family": "white|…|multicolor",      // 25 values
    "pattern": "solid|stripes|checks_plaid|graphic|camo|floral|other",
    "logo": "none|small|large", "volume": 3,   // 1 fitted … 5 very oversized (Int)
    "leg_shape": "na|skinny|slim|straight|relaxed|wide|flare_bootcut|barrel",
    "hem": "na|pooling|full_break|slight_break|no_break|cuffed|cropped",
    "tucked": "na|none|half|full", "condition": "clean|wrinkled|stained|pilled_or_worn",
    "certainty": "clear|likely|unsure", "length": "na|cropped|at_belt|mid_fly|below_crotch",
    "pattern_scale": "na|small|medium|large", "saturation": "na|muted|bright",
    "sleeve_end": "na|above_wrist|at_wrist|covers_hand", "strain": "none|some|clear",
    "distressed_by_design": false, "shows_below_outer": false } ],
  "held_items": [ /* DEMO EXTENSION, see below */ ]
}
```

**Reading model rules (these matter for parity; `@kitted/core/src/types.ts` already follows them):**
1. **Keep every string field as a raw string, never a closed union you validate against.** The parity set deliberately has unknown values (`"kimono_wrap"`, `"teal"`), missing keys and `volume: null`. The rubric treats an unknown subcategory as formality 2, and an unknown color as a non-neutral accent. A strict validator (e.g. a zod enum) would reject or drop them. `types.ts` uses `Loose<T> = T | (string & {})`: autocomplete for known values, any string accepted.
2. **Every field is optional and nullable** (`field?: T | null`). Some old readings lack `length`, `saturation` and similar fields. The rubric's `.get()` defaults differ per rule (§4.7, pitfall P5). A missing key and JSON `null` both mean Python `None`, except `scene.shoes_visible`: missing = visible, `null` = hidden.
3. **Keep the garment array order.** The rubric uses the *first* top, first bottom and first footwear (`tops[0]`, `next(...)`).
4. `scene.shoes_visible` **defaults to `true` when missing** (`scene.get("shoes_visible", True)`). A missing `scene` becomes `{}`, so `clothed` is missing, which means "not fully clothed" and gives no score.
5. Ignore unknown top-level keys (v4-converted readings in the parity set also carry `faded`, `issues`, `tag_or_sticker`, `collar_collapsed`, `scene.feet`).

**`held_items` (demo extension):** the p01b photo shows the overshirt held in the hand, not worn. v3 has no "worn" field. So the hand-authored reading puts the overshirt in a top-level `held_items` array, using the same garment shape. rubric.py reads only `scene` and `garments`, so it ignores `held_items` and the score is unaffected. The UI uses it for the "Overshirt · in hand" tag and the "Beige overshirt · in hand" pill on the "Why" sheet, the fix engine uses it for "Wear the overshirt, open" (an `adjust` fix), and the closet adds it. Propose `worn: false` for schema v4.x. The real model doesn't output this today (§3.2).

---

## 3. The demo readings

### 3.1 The 12 photos

The photos are in `/Users/eyu/Desktop/files/Kitted/mockups/img/<id>.jpg`. They are resized copies of the free-license stock in `/Users/eyu/Desktop/files/Kitted/inputs/fitcheck-photos/` (Unsplash/Pexels licenses are in `metadata.csv` and repeated in `INDEX.json`). **Real** readings come from the locked configuration (`extraction-test/results/lockin-oct6/B-stock`: gemini-3.8-flash, thinking off, v3, 1024 px). Each uses the modal run of 3:
1. the most common score under the run's own config (everyday, minimalist 0.5 / smart casual 0.5)
2. then the run whose fields agree most with the other runs
3. then the lowest run index

Scores below use the **demo profile** (styles `[["smart_casual",0.5],["workwear",0.5]]`, boldness `a_little`).

| id | Provenance | Mockup use | Occasion → score (raw) | Rules fired / credits |
|---|---|---|---|---|
| `p01b` | **hand-authored** | Screens 5–9: camera, reading, result, Why, Not quite right? | Date → **8.0** (8.0) "Sharp" | none / K2, K4 |
| `p01a` | **hand-authored** | Screens 10, 16, 18, 20: re-check, Lookbook, paywall, share | Date → **9.0** (8.75) "Dialed in" | none / K1, K2, K4 |
| `s15` | real, B-stock run 2 | Screen 1: welcome hero card | Everyday → **8.5** (8.3) "Sharp", full | P1_leg_vs_style / K1, K2, K3 |
| `s24` | real, B-stock run 0 (3/3 runs = 6.5) | Screens 11, 16: partial check | Everyday → **6.5** (6.4) "Getting there", partial: shoes | O4_loungewear_out / none |
| `s12` | real, B-stock run 2 | Screen 19: the held photo on the limit card | Everyday → 7.0 (7.0) | none / none |
| `s25` | real, B-stock run 0 | Screen 5: the mockup's library thumbnail (the app uses an icon there, `02` D5; s25 is just one of the "Sample photos") | Everyday → 7.5 (7.275) | P1_top_volume / K2 |
| `s05` | real, run 0 | Screen 2: look tile (minimalist) | Everyday → 7.5 | P1_leg / K3 |
| `s22` | real, run 1 | Screens 2–3: look tile, **selected** (smart_casual) | Everyday → 7.5, partial | F7, P1 ×2 / K2, K3 |
| `s14` | real, run 0 | Screen 2: look tile (gorpcore) | Everyday → 8.0 | P1_top_volume / K1, K2 |
| `s10` | real, run 0 | Screens 2–3: look tile, **selected** (workwear) | Everyday → 7.5 | F4b, P1 ×2 / K1, K2 |
| `s13` | real, run 0 | Screen 2: look tile (streetwear) | Everyday → 8.0 | none / K2, K4 |
| `s09` | real, run 1 | Screen 2: look tile (old_money) | Everyday → 6.5 | F10, P1 ×2, O1_too_formal / K1, K2, K4 |

The style tag on each look tile is hand-assigned. Only s22 = smart casual and s10 = workwear are implied by the mockup's "Smart casual with some workwear."

**Variants** (`readings/variants/`):

| id | What it is | Score |
|---|---|---|
| `p01b_chinos_slim` | The "Not quite right?" correction (chinos straight → slim) | Date 8.0 (raw 7.775), "Score stays 8.0" |
| `s24_jeans` | Bottom swapped for his closet's Dark jeans (denim_dark, slim) | 7.0 (6.775) |
| `s24_jeans_generic`, `s24_chino_shorts_generic` | The fix engine's generic edits (`subcategory = jeans` / `shorts`) | 7.0 (7.0) |
| `s24_closet_shoes` | Pick from Closet: White sneakers added, `shoes_visible = true` | 7.0 (6.9). O4 still fires; K2 is now earned |
| `s24_shoe_snap_runners` | A shoe snap that read grey retro runners | 6.5 (6.4) |
| `p01b_real`, `p01a_real` | The **real** model readings of p01 | see §3.2 |

### 3.2 Known extraction issue: p01 (document it; don't "fix" it in the demo)

The real model reading of `p01/before_studio.jpg` (3/3 runs) **counts the overshirt in his hand as a worn outer layer** and marks the shoes as not visible (`shoes_visible: false`). It also reads the chinos as slim and the tee as volume 2. With the demo profile at Date:
- real before = 8.0 (raw 7.979): K1 is earned for a layer he isn't wearing, and the credits are scaled because the shoes are "hidden".
- real after = **7.5** (raw 7.404): the overshirt and chinos are read as "wrinkled", so F7_care fires.

So the real readings tell the story backwards (8.0 → 7.5). The mockup story (8.0 → 9.0) uses the **intended** hand-authored readings. Even with anchoring (§6), merging the real after-reading onto the intended before-reading gives **8.5**, because the overshirt is new to the outfit and comes in "wrinkled" (`expected_scores.json → rechecks[1]`). Takeaways for the real app:
- the prompt needs a held-vs-worn rule (or `worn: false` in v4.x)
- the gold set needs a "held item" photo
- fix detection on this pair isn't solved by anchoring alone

---

## 4. Rubric spec (rubric v3.1) and the TypeScript port

### 4.0 `@kitted/core`: the package to import (built and verified Oct 6)
The rubric, fix engine, re-check, corrections, partial checks, Rotation and score words are already ported to TypeScript in `/Users/eyu/Desktop/files/Kitted/handoff/ts/kitted-core/` (name `@kitted/core`, ESM, strict TS, **no runtime dependencies, no I/O**). The **Expo app imports it**, and later the **Cloudflare Worker proxy imports the same package** to re-score readings server-side, so the phone and the server can never disagree. Copy the folder into the app repo (e.g. `packages/kitted-core/`, as a workspace package) and import from `@kitted/core`; `package.json` points `main`/`exports` at `src/index.ts`, so Metro, Vitest and Wrangler (esbuild) compile it directly.

| File | Port of |
|---|---|
| `src/types.ts` | `Reading`, `Garment`, `Scene`, schema.json enums as string unions (exact spellings), `RubricResult`, `ClosetItem`, `RubricData` |
| `src/rubric.ts` | `rubric.py` (`score`, `formality`, `blended_band`, `is_bright`, `FAMILY`), built by `createRubric(data)`; `defaultRubric` uses the bundled data |
| `src/rubricData.ts` | `fixtures/rubric.json` as a TS const (generated by `scripts/gen-rubric-data.mjs`; don't hand-edit) |
| `src/parts.ts` | `parts_proto.py` v3 (`score_parts`, `combine`, `earned_bonus`, `card_row`), built by `createParts(data, rubric)`; `scoreParts(reading, {occasion, styles, boldness, secondLook})` uses the bundled data. Reuses v4.1's helpers through `RubricEngine.helpers`. Not wired into the app yet |
| `src/partsData.ts` | `fixtures/parts.json` as a TS const (generated by the same script; don't hand-edit) |
| `src/fixes.ts` | `suggest_fixes`, `apply_fix`, `fix_targets` (§5) |
| `src/recheck.ts` | `recheck_merge` (§6) |
| `src/corrections.ts` | `apply_correction`, `correction_line` (§7) |
| `src/partial.ts` | `partial_label`, `merge_shoe_snap`, `merge_bottom_snap`, `pick_shoes_from_closet` (§8.1) |
| `src/rotation.ts` | `rotation`, `outfit_valid`, `outfit_reading`, `item_key` (§9) |
| `src/scoreWords.ts` | `score_word` (≤5.5 Needs a fix · 6–6.5 Getting there · 7–7.5 Put together · 8–8.5 Sharp · 9–9.5 Dialed in) |
| `src/names.ts`, `src/util.ts` | `SUB_NAME`/`name`, `G`, `idx`; Python-exact helpers (`roundHalf`, `nearest`, `pyRound`, truthiness, deep clone) |

```ts
import { score, suggestFixes, recheckMerge, fixTargets, scoreWord } from "@kitted/core";
const r = score(reading, { occasion: "date", styles: [["smart_casual", 0.5], ["workwear", 0.5]], boldness: "a_little" });
if (r.overall !== null) console.log(r.overall, scoreWord(r.overall), r.rulesFired, r.rawUnrounded);
```
Results are camelCase (`rulesFired`, `rawUnrounded`, `creditUnrounded`, `notRated`, …); readings keep schema.json's snake_case. `score()` never mutates its input (rubric.py does; the port scores a deep copy). For a remote `rubric.json`, call `createRubric(json)` (it throws unless `engine == 3`) and pass that engine as the last argument of `suggestFixes`, `recheckMerge`, `rotation`, etc.

**Run the tests** (in the app, after the workspace `npm install` of `05` §4.2, which installs the package's own dev dependencies: vitest, @types/node, TypeScript): `npm test --workspace @kitted/core` (= `vitest run`) runs `test/rubric.parity.test.ts`, `test/demo-story.test.ts`, `test/fixes.test.ts`, `test/recheck.test.ts` and `test/rotation.test.ts`. They read the fixtures from `handoff/fixtures/` without copying them: `test/helpers.ts` (and `scripts/verify.mjs`) look in `../../fixtures` from the package root (this handoff layout) and `../../../handoff/fixtures` (the app layout, `app/packages/kitted-core/`). Both layouts were checked on Oct 6. **Delete `test/vitest-shim.d.ts` once vitest and @types/node are installed**: it's a temporary type stub that let `tsc --noEmit` check the tests before any install. `npm run typecheck` = `tsc --noEmit` (strict, `noUncheckedIndexedAccess`) over `src/` and `test/`; it passes today. `npm run verify` is the dependency-free gate from the top of this file.

**What was verified on Oct 6** (Node 20.20, TypeScript 6.0.2, no packages installed): `scripts/verify.mjs` on the compiled `src/`: 5,694/5,694 parity cases exact (overall, reason, partial, rules_fired, raw_score, raw_unrounded bit-equal, subscores, occasion_adj, credits, credit_points, credit_unrounded, mistake_points, mistakes_unrounded, advice, not_rated; key sets equal; no input mutated), 181/181 demo cases (incl. score word and partial label), 23/23 mockup checks, 14/14 fix cases, 4/4 re-checks, 1/1 correction, 2/2 partials, 26/26 Rotation checks. `pyRound` (Python's `round(x, n)`) also matched Python on 90,000 random values. The five test files passed under a minimal describe/it/expect stand-in, not under real Vitest (not installed here). Not run on Hermes yet: run the parity test once inside the app (a dev-only screen; Jest runs on Node, not Hermes) before beta.

The rest of §4 is the language-neutral spec the package implements. `rubric.ts` follows `rubric.py` line by line, in this order. **Order matters** in three places:
- floating-point sums
- the order of `rules_fired`, `credits` and `advice`
- `fire()` skipping amounts ≤ 0

The numbers live in `rubric.json` (`fixtures/rubric.json`, compiled into `src/rubricData.ts`); the logic lives in code (`src/rubric.ts`).

### 4.1 Signature and output
```ts
function score(r: Reading, opts?: { occasion?: string /* "everyday" */; styles?: [string, number][] /* [] */; boldness?: string /* "a_little" */ }): RubricResult
type RubricResult = UnscoredResult | ScoredResult            // narrow on `overall === null`
interface UnscoredResult { overall: null; reason: "not_fully_clothed" | "nothing_readable"; partial: boolean; rulesFired: [] }
interface ScoredResult {
  overall: number              // display score = round_half(raw)
  partial: boolean
  rulesFired: RuleId[]         // in firing order; each id at most once (P1 has two ids: top and leg)
  rawUnrounded: number         // UNROUNDED raw (fixture: raw_unrounded)
  rawScore: number             // Python round(raw, 3) (fixture: raw_score), display only
  subscores: { fit: number; color: number; proportion: number }  // each round_half(sub)
  occasionAdj: number          // = -occAdj (Python gives -0.0 when zero; -0 === 0 in JS)
  credits: CreditId[]          // earned credit ids in CREDITS order
  creditUnrounded: number      // fixture: credit_unrounded; creditPoints = Python round(credit, 2)
  mistakesUnrounded: number    // fixture: mistakes_unrounded; mistakePoints = Python round(mistakes, 2)
  advice: string[]             // exact strings, in order
  notRated: NotRated[]         // "shoes", "bottom half", "traditional garment (not rated)"
}
```
Early returns:
- `{overall: nil, reason: "not_fully_clothed", partial: false, rules_fired: []}` when `scene.clothed != "fully"`
- `{overall: nil, reason: "nothing_readable", partial: true, rules_fired: []}` when no garments are left after filtering

**`styles` is an ordered list of pairs**, never a plain object or `Record`. Python iterates the dict in insertion order, and the float sums depend on that order. In `rubric_parity.json` styles are `[[name, weight], …]`. The demo profile's order is smart_casual, then workwear (the order he tapped them).

### 4.2 Constants and tables (verbatim from rubric.py; also in `rubric.json → tables`)

**FORMALITY** (missing or unknown subcategory → **2**):

| Value | Subcategories |
|---|---|
| 1 | tank_top, jersey, sweatpants, athletic_shorts, joggers, slides_sandals |
| 2 | graphic_tee, tee, hoodie, sweatshirt, cargos, shorts, jeans, canvas_sneaker, basketball_sneaker, chunky_sneaker, performance_runner, retro_runner, flannel_shirt, puffer, rain_jacket, shell_jacket, fleece, rugby_shirt, denim_jacket, bomber, work_boot |
| 2.5 | low_profile_sneaker, leather_jacket, camp_collar_shirt, drawstring_trousers |
| 3 | polo, oxford_shirt, overshirt, sweater, cardigan, quarter_zip, chinos, chore_coat, field_jacket, white_leather_sneaker, suede_chukka |
| 3.5 | knit_polo, loafer, chelsea_boot, unstructured_blazer |
| 4 | dress_shirt, trousers, blazer, sport_coat, overcoat, derby |
| 5 | suit_jacket, suit_trousers, dress_shoe |

**`formality(g)`:** `FORMALITY[sub] ?? 2`. Special case: if `sub == "jeans"`, `color_family == "denim_dark"` and `distressed_by_design` is not true, the value is **2.5**. "Not true" means missing, false or null; Python tests `not g.get(...)`.

**Sets:**
- `TAILORED_OUTER` = {blazer, suit_jacket, sport_coat, unstructured_blazer}
- `SEPARATE_JACKETS` = {blazer, sport_coat, unstructured_blazer}
- `DARK_SUITING` = {charcoal, navy, black}
- `DRESSY_OCCASIONS` = {work, interview, interview_corporate, interview_tech, event, wedding_formal, wedding_casual}
- `LOUNGE_BOTTOMS` = {athletic_shorts, sweatpants}
- `LOUNGE_OK` = {gym, home}
- `KNIT_TOPS` = {sweater, cardigan, quarter_zip}

**OCCASION_TARGET (lo, hi).** An unknown key falls back to **(2, 3)**:

| Occasions | Target |
|---|---|
| everyday, class | (2, 3) |
| work_casual, date, going_out | (2.5, 3.5) |
| work, interview_tech, wedding_casual | (3, 4) |
| interview, event | (3.5, 4.5) |
| interview_corporate, wedding_formal | (4, 5) |
| gym | (1, 2) |
| home | (1, 2.5) |

**Style bands.** `LEG_ORDER = ["skinny","slim","straight","relaxed","wide"]` (indices 0–4). `LEG_ALIAS = {flare_bootcut: straight, barrel: wide}`.

| Style | Volume (lo, hi) | Leg (lo, hi) |
|---|---|---|
| smart_casual | (2, 3) | slim, relaxed |
| minimalist | (2, 4) | straight, relaxed |
| old_money | (2, 3) | straight, relaxed |
| workwear | (3, 4) | straight, relaxed |
| vintage_sport | (3, 4) | straight, relaxed |
| streetwear | (3, 5) | straight, wide |
| preppy | (2, 3) | slim, straight |
| gorpcore | (3, 4) | straight, wide |
| **DEFAULT_BAND** (no known style) | (2, 3.5) | slim, relaxed |

**Colors:**
- `NEUTRALS` = {white, off_white_cream, light_grey, grey, charcoal, black, navy, khaki_beige, tan_camel, brown, denim_light, denim_mid, denim_dark, light_blue, olive}
- `MUTED` = {burgundy, sage}
- `ALWAYS_BRIGHT` = {red, orange, yellow, pink, purple}
- `HUE_DEPENDS` = {green, blue}
- `FAMILY` = {off_white_cream→white, light_grey→grey, charcoal→grey, denim_light/mid/dark→denim, tan_camel→tan, khaki_beige→tan, sage→green, olive→green, burgundy→red, light_blue→blue_light}

For any color not in FAMILY, `fam(c) = c`. **Not neutral and not muted = a full accent** (1.0), even if it isn't bright. Plain `blue` or `green` (not bright) is still a full accent, and `red` with saturation muted is still a full accent: only burgundy and sage count half.

**Scoring numbers:**
- `BASELINE` = 7.0
- `CREDITS` (ordered): K1_layered 0.75 (needs nothing) · K2_elevated_piece 0.5 · K3_point_of_interest 0.5 · K4_shoes_complement 0.5 (needs "shoes")
- `CREDIT_MAX` = 2.25
- Sub-score weights: fit 0.40, color 0.30, proportion 0.30
- Multipliers: mistakes 2.0, occasion 1.2
- Clamps: sub-scores [1, 10], raw [3, 10]
- Boldness allowance: subtle 1, a_little 1.5, bold 2.5, any other value 1.5, plus 1 if street ≥ 0.5

### 4.3 Helpers (exact)
```
round_half(x) = floor(x * 2 + 0.5) / 2          // never Math.round() / toFixed() / Intl.NumberFormat
nearest(x)    = floor(x + 0.5)                  // Python's round() is banker's rounding; this isn't
is_bright(g):  c = g.color_family
               if c in ALWAYS_BRIGHT: return g.saturation != "muted"
               if c in HUE_DEPENDS:  return g.saturation == "bright"
               return false
blended_band(styles):                          // styles = ordered pairs
   known = [(s,w) for (s,w) in styles if s in STYLE_BANDS and w > 0]   // keep order
   if known empty: return DEFAULT_BAND as ((2,3.5),(index(slim)=1, index(relaxed)=3))
   tot = 0 + w1 + w2 + …                                                 // left-to-right
   vlo = (0 + band(s1).vlo*w1 + band(s2).vlo*w2 + …) / tot               // same for vhi
   llo = (0 + idx(band(s1).leg0)*w1 + …) / tot                           // same for lhi
```

### 4.4 The pipeline (port in this exact order)
```
score(ext, occasion, styles, boldness):
  scene = ext.scene ?? {}
  if scene.clothed != "fully": return early(not_fully_clothed, partial=false)
  garments = [g in ext.garments where g.certainty != "unsure" and g.category != "accessory"]
  notRated = []
  if !(scene.shoes_visible ?? true): drop footwear; notRated += "shoes"
  if scene.framing == "upper_only": drop bottom + footwear; notRated += "bottom half"
  if any g.category == "traditional": notRated += "traditional garment (not rated)"
  drop traditional
  if garments empty: return early(nothing_readable, partial=true)
  for g: if g.leg_shape in LEG_ALIAS: g.leg_shape_raw = g.leg_shape; g.leg_shape = LEG_ALIAS[...]   // Python MUTATES the input; the port scores a deep copy

  pen = {fit:0, color:0, proportion:0}; occAdj = 0; fired = []; advice = []
  fire(rule, sub, amount): if amount <= 0 return          // ← an amount of 0 fires NOTHING and isn't listed
                           if sub == occasion: occAdj += amount else pen[sub] += amount; fired.append(rule)
  totW = (sum of all style weights, INCLUDING unknown style names) or 1
  w(s) = (weight of s in styles, 0 if absent) / totW       // unknown names dilute the known weights
  street, gorp, vintage, workwear = w(streetwear), w(gorpcore), w(vintage_sport), w(workwear)
  tops = [category == top]; top = tops.first
  bottom = first bottom; shoes = first footwear; outer = all outerwear (in order)
  (vlo,vhi),(llo,lhi) = blended_band(styles)

  ── FIT ──
  F4_pooling:  if bottom.hem == pooling:
                  if street >= 0.5: fire(F4, fit, bottom.leg_shape in (relaxed, wide) ? 0.0 : 0.5)
                  else fire(F4, fit, 1.0)
  F4b:         if bottom.hem == full_break and leg in (skinny, slim) and bottom.certainty == clear: fire(F4b_full_break_narrow_leg, fit, 0.25)
  care = 0; for g in garments (in order):
      if g.distressed_by_design (truthy): continue
      wrinkled: +0.5 · stained AND certainty == clear: +1.5 ·
      pilled_or_worn: +(g.category == footwear and street+workwear+vintage >= 0.5 ? 0.25 : 0.5)
  if care != 0: fire(F7_care, fit, min(care, 2.0))
  F6:  if top and top.tucked in (nil, "none", "na") and top.length == below_crotch and (top.volume or 3) < 4 and street < 0.5: fire(F6_top_too_long, fit, 1.0)
  F8:  if top and (top.volume or 0) >= 4 and street < 0.5 and (top.sleeve_end == covers_hand or top.length == below_crotch): fire(F8_too_big, fit, 0.75)
  F9:  for g in tops + outer (tops first, then outer, in order):
          if g.sleeve_end == covers_hand:
             fire(F9_sleeves_cover_hands, fit, (g.sub in (hoodie, sweatshirt) and street >= 0.5) ? 0.25 : 0.5); break
  F10: if any garment.strain == clear: fire(F10_visible_strain, fit, 0.75)

  ── TUCK ──
  T1:  if top.sub == dress_shirt and top.tucked in ("none", nil)          // NOTE: "na" does NOT count here
         and (any outer.sub in TAILORED_OUTER or bottom.sub in (trousers, suit_trousers) or occasion in DRESSY_OCCASIONS):
         fire(T1_dress_shirt_untucked, occasion, 0.5)

  ── PROPORTION ──
  P1 top:  if top and top.volume (non-nil, non-zero): steps = max(0, vlo - vol, vol - vhi); fire(P1_top_volume_vs_style, proportion, 0.75 * steps)
  P1 leg:  if bottom.leg_shape in LEG_ORDER: li = index; steps = max(0, llo - li, li - lhi); fire(P1_leg_vs_style, proportion, 0.75 * steps)
  P2:  if top and bottom and (top.volume or 0) >= 4 and bottom.leg == skinny: fire(P2_big_top_skinny_leg, proportion, 0.5)
  P3:  if top and bottom and (top.volume or 0) >= 4 and bottom.leg == wide and street + gorp < 0.5: fire(P3_everything_oversized, proportion, 0.5)
  L1:  if top.shows_below_outer (truthy) and any outer.sub in TAILORED_OUTER: fire(L1_shirt_hangs_below_blazer, fit, 0.75)
  S1:  if shoes and bottom and shoes.sub in (chunky_sneaker, performance_runner) and bottom.leg in (skinny, slim): fire(S1_bulky_shoe_narrow_leg, proportion, 0.75)
  tip: if top and outer empty and top.tucked in ("none", nil) and top.length == mid_fly and bottom:
         advice += "tip: a front tuck or a cropped layer can lengthen your legs (rule of thirds)"

  ── COLOR ──
  colored = [g where g.color_family non-nil and != multicolor]
  accents = {}; for g in colored: c = color; if c in NEUTRALS continue; f = fam(c); accents[f] = max(accents[f] ?? 0, c in MUTED ? 0.5 : 1.0)
  nAccents = sum(accents.values); families = set(fam(c) for colored)
  if nAccents >= 3: fire(C1a_too_many_accent_colors, color, 1.5)
  else if families.count >= 5 and nAccents >= 2: fire(C1b_too_many_colors, color, 0.5)
  main = [g in colored where category in (top, bottom, outerwear)]
  brightFams = set(fam(color) for g in main if is_bright(g))
  shoeBright = (shoes and is_bright(shoes) and fam(shoes.color) not in brightFams) ? 0.5 : 0
  if brightFams.count + shoeBright >= 2: fire(C3_bright_clash, color, (boldness == bold or street >= 0.5) ? 0.5 : 1.0)
  pats = [g where pattern not in (nil, "solid")]; nonGraphic = [pats where pattern != graphic]
  seen = count by (pattern, pattern_scale) over nonGraphic         // insertion-ordered map
  if any entry with n >= 2 and scale not in (nil, "na"): fire(C4a_same_pattern_same_scale, color, 1.0)
  else if any entry with n >= 2: fire(C4a_same_pattern_type, color, 0.5)
  if pats.count >= 3 and street < 0.5: fire(C4b_three_plus_patterns, color, 1.0)
  focal = 0; for g in main: if is_bright(g) focal += 1 else if color in MUTED focal += 0.5
                            if pattern not in (nil, solid) and (scale == large or pattern in (graphic, camo, floral)): focal += 1
  allowance = {subtle:1, a_little:1.5, bold:2.5}[boldness] ?? 1.5, plus 1 if street >= 0.5
  if focal > allowance: fire(B1_too_many_focal_points, color, min(1.0, 0.5 * ceil(focal - allowance)))
  if families.count == 1: advice += "tip: tonal outfit, vary texture or shade so it doesn't look flat"
  jacket = first outer with sub in SEPARATE_JACKETS
  if jacket and bottom and bottom.sub in (trousers, chinos) and jacket.color in DARK_SUITING and bottom.color in DARK_SUITING and jacket.color != bottom.color:
      fire(C5_near_match_jacket_trousers, color, 0.85)
      advice += "tip: pair a dark blazer with clearly different trousers (grey, tan, olive) or the matching suit trousers"

  ── OCCASION ──
  core = [formality(g) for g where category in (top, bottom, footwear, outerwear)]
  if core non-empty:
      f = sum(core) / count; (lo,hi) = OCCASION_TARGET[occasion] ?? (2,3)
      if f < lo - 0.5: fire(O1_too_casual, occasion, min(2.5, 1.25 * nearest(lo - f)))
      else if f > hi + 1.5: fire(O1_too_formal, occasion, 0.5)
  if bottom.sub in LOUNGE_BOTTOMS and occasion not in LOUNGE_OK and street + vintage < 0.5: fire(O4_loungewear_out, occasion, 0.5)
  if shoes:
      others = [formality(g) for g where category in (top, bottom, outerwear)]
      if others non-empty and max(others) - formality(shoes) >= 3 and shoes.sub != white_leather_sneaker: fire(S2_shoes_too_casual_for_outfit, occasion, 1.5)
  bigLogo = [g where logo == large]
  if bigLogo non-empty and street + vintage < 0.3:
      if occasion hasPrefix "work" or "interview" and any bigLogo.certainty == clear: fire(O3_large_logo, occasion, 1.1)
      else advice += "tip: big logos read casual; a plain or small-logo piece looks more put together"
  if occasion in DRESSY_OCCASIONS and shoes.sub in (loafer, derby, dress_shoe, chelsea_boot):
      advice += "tip: match your belt to your shoes (same color family; black only with black)"
  if fired empty and focal == 0 and boldness != subtle: advice += "next level: add one point of interest (a knit, a sneaker, a beanie)"

  ── CREDITS ──
  hidden = ("shoes" in notRated or "bottom half" in notRated) ? {"shoes"} : {}
  earned = ordered map
  K1: if outer non-empty or top.sub in KNIT_TOPS: earned[K1] = 0.75
  K2: if any formality(g) >= 3 for g in core categories: earned[K2] = 0.5
  interest = Σ over main: (is_bright ? 1 : color in MUTED ? 0.5 : 0)  +  Σ over main: (pattern not in (nil, solid, graphic, other) ? 1 : 0)
  K3: if 1 <= interest <= allowance: earned[K3] = 0.5
  K4: if shoes and bottom: others = formality of (top, bottom, outerwear) garments
         if formality(shoes) >= 2.5 and others non-empty and abs(formality(shoes) - sum(others)/count(others)) <= 0.75: earned[K4] = 0.5
  visibleMax = Σ points of CREDITS whose needs don't intersect hidden      // 2.25, or 1.75 when shoes hidden
  credit = (Σ earned values) * (1 + CREDIT_MAX / visibleMax) / 2           // evaluate as ((sum * (1 + C/v)) / 2)

  ── ARITHMETIC ──
  sub[k] = max(1.0, min(10.0, 10.0 - pen[k]))   for k in fit, color, proportion
  base = 0.40*sub.fit + 0.30*sub.color + 0.30*sub.proportion      // ((a + b) + c), left to right
  mistakes = 2.0 * (10.0 - base) + 1.2 * occAdj
  raw = max(3.0, min(10.0, BASELINE + credit - mistakes))        // ((7.0 + credit) - mistakes)
  overall = round_half(raw); subscores = round_half(sub[k]); partial = notRated non-empty
```

### 4.5 Arithmetic order and rounding (bit-for-bit)
- JS `number` is IEEE-754 binary64, the same as Python's `float`, so plain arithmetic matches. Never use a decimal library or integer tricks.
- **Same operation order as Python.** `pen[sub] += amount` happens in firing order. Sums go left to right starting from 0. Credit scaling is `(sum * (1 + 2.25 / visibleMax)) / 2`, not `sum * ((1 + …)/2)`. Raw is `(7.0 + credit) - mistakes`.
- **Display = `round_half(raw)` on the unrounded raw.** Never round raw first.
- `rubric_parity.json` marks **27 cases** as `fp_boundary`, where raw × 2 + 0.5 lands within 1e-9 of a whole number without hitting it:
  - **24 "above"** (e.g. raw 7.250000000000002 → 7.5)
  - **3 "below"** (e.g. 6.749999999999999 → 6.5 where the ledger reads 6.75)

  If your op order differs by one ulp, these flip. Debug them first.
- A raw value of exactly .25 or .75 rounds **up** (385 cases sit exactly on a boundary).
- Python's `round(x, 3)` and `round(x, 2)` (`raw_score`, `credit_points`, `mistake_points`) are only for humans. Store and compare the **unrounded** values, which are in the fixtures as `raw_unrounded`, `credit_unrounded` and `mistakes_unrounded`. (`pyRound()` in `util.ts` reproduces Python's `round()` exactly, half-to-even on the exact binary value, so the rounded fields match too. `toFixed()` does not: it rounds exact ties away from zero.)

### 4.6 Worked examples
**p01b @ Date** (demo profile; band volume 2.5–3.5, leg index 1.5–3):
- No rule fires. The tee (volume 3) and straight leg (index 2) are inside the band.
- Core formality: tee 2, chinos 3, white leather sneakers 3 → mean 2.67, inside Date's 2.5–3.5.
- K2 (chinos ≥ 3) = +0.5.
- K4: shoes 3 ≥ 2.5, and |3 − mean(2, 3)| = 0.5 ≤ 0.75, so +0.5.
- K1 = 0 (no outer; the overshirt is only in `held_items`). K3 = 0 (all neutrals).
- Nothing hidden: visibleMax 2.25, so the factor is 1. Credit = 1.0, mistakes = 0, raw = **8.0**.
- Advice: `next level: …` (nothing fired, focal 0).

This matches the mockup's "Why 8.0" receipt: 7.0 + 0.5 + 0.5, +0 for layered (in hand), +0 for point of interest, ±0 for Date.

**p01a @ Date:** K1 is earned (overshirt worn, formality 3, so K4's mean is (2+3+3)/3 = 2.67, |3 − 2.67| ≤ 0.75). Credit = 1.75, raw **8.75**, display round_half(8.75) = floor(18) / 2 = **9.0**.

**s24 @ Everyday** (partial; shoes hidden):
- O4 fires: athletic_shorts outside gym/home, occAdj 0.5, so mistakes = 1.2 × 0.5 = 0.6.
- No credits. The factor would be (1 + 2.25/1.75)/2 = 1.142857, but the earned sum is 0.
- raw **6.4** → 6.5 "Getting there".
- At **Gym** or **Home**, O4 doesn't fire: 7.0.

**p01b_chinos_slim @ Date:** slim = index 1, 0.5 step below llo 1.5, so P1_leg = 0.375 proportion. Sub proportion = 9.625, base = 9.8875, mistakes = 2 × 0.1125 = 0.225, raw **7.775** → 8.0, so "Score stays 8.0". *(The brief for this file guessed "raw 7.85". That would need weights 2/3 smart casual + 1/3 workwear. With the equal weights `app-build-spec.md` §2.1 specifies, rubric.py gives 7.775. The display is 8.0 either way.)*

### 4.7 Pitfalls that will trip the port
- **P1 Enum spellings are exact snake_case strings:** `white_leather_sneaker`, `slides_sandals`, `off_white_cream`, `tan_camel`, `khaki_beige`, `pilled_or_worn`, `below_crotch`, `checks_plaid`, `flare_bootcut`. Rule ids are case-sensitive and two share a prefix: `C4a_same_pattern_same_scale` vs `C4a_same_pattern_type`, and `P1_top_volume_vs_style` vs `P1_leg_vs_style`. `O1_too_casual` and `O1_too_formal` are both "O1".
- **P2 Alias normalization:** `flare_bootcut → straight` and `barrel → wide` happen after filtering and before every rule, so S1, P2, P3 and F4b see the alias. Python mutates the caller's dict; always score a copy. `make_*.py` deep-copies.
- **P3 Filters before rules:** `unsure` garments and accessories are removed first. Then footwear goes if shoes are hidden, bottom and footwear go if `upper_only`, and traditional garments go. A hidden-shoes reading with a footwear entry must not score the shoes.
- **P4 `fire()` with amount 0 does nothing.** Example: streetwear with relaxed pooling pants. The rule isn't listed, so it isn't shown on the "Why" sheet.
- **P5 Defaults differ per rule:**
  - F6 uses `volume or 3`; F8, P2 and P3 use `volume or 0`.
  - P1 top skips when volume is nil **or 0**.
  - F6 treats `tucked` nil/"none"/"na" as untucked; T1 and the rule-of-thirds tip treat only nil/"none" as untucked.
  - A missing `pattern` counts as solid. A missing `color_family` is excluded from colors.
- **P6 Unknown values:** an unknown subcategory has formality 2. An unknown color is a full accent and its own family. `multicolor` is excluded from colors entirely (not an accent, not a family). And because `main` is built from `colored`, a multicolor or colorless garment adds **nothing** to C3, B1 focal points or K3, even when it's patterned or bright.
- **P7 Style weights:** `totW` includes unknown style names, which dilutes `street`, `gorp` and the rest, but `blended_band` ignores unknown names and zero weights. Weights needn't sum to 1. Don't normalize.
- **P8 C3 and shoes:** bright shoes add only 0.5, so one bright main piece plus bright shoes (1.5) never fires C3. Two bright main pieces are required.
- **P9 F9 fires once** (`break`) for the first covering sleeve, checking tops before outerwear.
- **P10 Order of `credits` and `rules_fired`** must match exactly. Credits always come out as K1, K2, K3, K4 (a subset).
- **P11 Best possible raw is 9.25**, which displays **9.5** (round_half rounds .25 up). A 10 is unreachable in v3.1 (open founder decision, `rubric/v3.md`).
- **P12 Partial scaling multiplies the earned sum**, so a hidden-shoes outfit with K1 + K2 gets 1.25 × 1.142857 = 1.4286, more than the 1.25 face value. The "Why" sheet must show that boost (§5.7).
- **P13 `occasion_adj` is `-occAdj`**, and Python emits `-0.0` when it's zero. Compare with `==`, which treats them as equal.
- **P14 JavaScript traps** (all handled in `@kitted/core`; keep them handled if you edit it):
  - Look up tables with `Map`/`Set` or `hasOwnProperty`, never `obj[key]`: a reading with `subcategory: "constructor"` would hit `Object.prototype`.
  - Python truthiness isn't JS truthiness: `[]` and `{}` are falsy in Python (`util.truthy()`).
  - Missing key vs `null`: both are `None` for `.get()`, but `scene.get("shoes_visible", True)` gives `True` only when the key is **missing**; `null` means hidden.
  - Python `str(True)` is `"True"` (used in re-check notes).
  - Hermes (React Native) has no `structuredClone`, so the package uses its own JSON deep clone.
  - **Regenerate fixtures only with `/usr/bin/python3` (3.9.6).** Python 3.12+ changed `sum()` of floats to compensated summation, which can move the style-band sums by an ulp and flip `fp_boundary` cases.

### 4.8 rubric.json
`fixtures/rubric.json` holds `version: "3.1.0"`, `engine: 3`, `config` (minAge 18, freeChecksPerDay 1, freeRechecksPerCheck 1, freeQuestionsPerDay 5, proChecksPerDay 10, proQuestionsPerDay 50, rollover 04:00), `scoring`, every table above (sets as sorted arrays, CREDITS as an ordered array), every rule's amounts (`rules`), the advice strings and the fix catalog. The rule amounts are transcribed from rubric.py's code; the parity test is what proves them. Bundle it, and load the remote copy only when `engine == 3` (`app-build-spec.md` §2.2).

### 4.9 The parity test (the most important test in the app)
Implemented in `test/rubric.parity.test.ts` (Vitest) and `scripts/verify.mjs` (plain Node). Both load `rubric_parity.json`. It holds `readings` (id → reading), `cases` and `counts`. For each case, run `score(readings[c.reading], occasion: c.occasion, styles: c.styles (ordered pairs), boldness: c.boldness)` and require:
- **Exact:**
  - `overall` (both nil, or equal)
  - `reason`, `partial`
  - `rules_fired` and `credits`, in order
  - `subscores` (fit/color/proportion)
  - `occasion_adj`
  - `advice`, in order and string-equal
  - `not_rated`, in order
- **Unrounded doubles:** `raw_unrounded`, `credit_unrounded` and `mistakes_unrounded` should be bit-equal. Accept within 1e-9 only while debugging, then tighten.
- **Rounded fields:** `raw_score`, `credit_points` and `mistake_points` within 0.0005 / 0.005 / 0.005. (The TS port matches them exactly too.)

What's in it:
- **923 unique real readings** (from 1,819 saved Gemini runs across every test in `extraction-test/results/`, including v4-converted readings with extra keys)
- **75 demo and edge readings** (one or more per rule, branch and early return)
- **900 fuzz readings** (seed 20261006, including missing keys and unknown values)
- **5,694 cases** in total

Every rule and credit fires at least 6 times (see `coverage`). Print the first failing case's `provenance` entry. `make_expected.py`'s `expected_scores.json` is a second, smaller gate for the 20 demo readings.

---

## 5. Fix engine (`suggestFixes()` in `src/fixes.ts`)

Reference: `kitted_logic.suggest_fixes()`, ported exactly. Note one quirk kept on purpose: when picking one option per target, Python compares the new option's *unrounded* raw gain with the current best's raw gain *rounded to 6 places*. The catalog is `fixes.json`, also in `rubric.json → fixes`.

### 5.1 Principle
The AI never picks fixes. Code picks them from the rules that fired. Each fix's **predicted score is the rubric's own number**: apply the fix's edit to a **copy** of the reading, re-score, and show "→ 9.0". Never hand-write a gain.

### 5.2 Catalog shape and edit ops
`targets[ruleOrCreditId] = [option…]`, cheapest tier first. Each option has `tier`, `copy` (`{name}` = plain garment name, `{item}` = closet item name, `{target}` = band target), an optional `detail`, `edits[]`, an optional `closet_requires` and an optional `when`.

| Op | Effect on the reading copy |
|---|---|
| `set {slot, fields}` | Update the first garment of the category `slot` (top / bottom / footwear / outerwear) |
| `set_where {where, fields}` | Update every garment matching `where` (e.g. every `condition: wrinkled` → `clean`) |
| `alternatives {slot, each[]}` | Try each field set on the slot. The prediction is the **minimum** (never over-promise). O4 uses jeans or shorts |
| `set_band {slot, field}` | Move volume / leg into his style band: clamp to `[ceil(lo), floor(hi)]`, or `nearest(midpoint)` if that range is empty |
| `swap_closet {slot, match}` | Replace the slot with each matching ClosetItem's garment (keeping the photo's hem/tucked/length/sleeve). Keep the best. Names the item |
| `add_closet {slot}` | Append each closet layer. Keep the best |
| `add_held {category}` | Move the first `held_items` entry of that category into `garments` |
| `add {garment}` | Append a generic garment |
| `neutralize_culprit` | For each non-neutral or patterned main garment, try it as a neutral solid (top white, outer navy, bottom navy, shoes white). Keep the best |
| `upgrade_culprit` | The least formal core piece → its slot's step-up (top oxford, bottom chinos, shoes white leather sneakers, or loafers when the occasion's lo ≥ 3.5); `from_closet` uses closet items one step dressier |
| `remove_most_formal_outer` | Remove the dressiest outer layer |

### 5.3 Tiers
| Tier | Effort | Free? | Tag on the card |
|---|---|---|---|
| `adjust` | 1 | yes | "Free · {detail}" (e.g. "Free · it's already in your hand") |
| `swapFromCloset` | 2 | yes | "Free · from your closet". **Only offered when a matching ClosetItem exists** |
| `changeInto` | 2 | yes | "Free if you own one" (ruling 20) |
| `tailor` | 3 | no | "Tailor · ~$15" |
| `buy` | 4 | no | "Buy" |

### 5.4 Selection (exact)
1. `base = score(reading)`. If `overall == nil`, there are no fixes.
2. **Targets** = `rules_fired`, deduplicated and in order. **Only when nothing fired**, the targets are the missing credits K1, K2 and K4:
   - K4 is skipped when the shoes are hidden
   - **all credit targets are skipped at Gym or Home**
   - K3 is never a fix: it's the "Next level" tip
3. For each target, evaluate each allowed option. Keep options whose **display gain** (new overall − base overall) is ≥ 0.5. Keep **one option per target**: the best `raw_gain / effort`, with ties going to the lower tier.
4. **First check ever** (onboarding): only the `adjust` tier. If that yields nothing, allow one `changeInto` ("free if you own one"), so a fix exists whenever one can (rulings 20 and 10).
5. Rank by `raw_gain / effort` (descending), then effort, then target order. Take up to **3**. At most **1 buy**, and only if no free fix reaches 7.0. If no free fix made the cut but one exists, swap it in.
6. Card order: free fixes first, then by gain.
7. `next_level`: each rubric advice line starting with `next level:` is mapped through `fixes.json → next_level`. Its copy is "One standout color, like a rust tee. No score change today." It shows **no score**. The other `tip:` advice lines go on the "Why" sheet (`fixes.json → tips`).
8. No fixes: "This is dialed in. Nothing to fix." plus the next-level tip.

### 5.5 Expected demo cards (`expected_scores.json → fixes`)
| Case | Card |
|---|---|
| p01b @ Date, first run (empty closet) | **Wear the overshirt, open** · Free · it's already in your hand · → 9.0. Next level: "One standout color, like a rust tee. No score change today." |
| p01b @ Date, full closet | Same: the adjust tier beats "Add your Navy overshirt" |
| s24 @ Everyday, full closet | **Swap to jeans or chino shorts** · Free · from your closet · → 7.0 |
| s24 @ Gym | No fixes ("dialed in") |
| s15 @ Everyday | "Swap to your Khaki chinos" → 9.0, or with an empty closet "Swap to relaxed-leg pants" · Free if you own one → 9.0 |

The rest are in the file (s12, s25, s05, s09, s10, s13, s14, s22).

### 5.6 Copy templates
Each option's `copy` and `detail` is the fix line (`fixes.json`). For the template explanation (the demo has no explain call), use the seed's story lines exactly where the mockup shows them:
- p01b verdict: "Clean base. The overshirt in your hand finishes it."
- Re-check summary: "Layered and clean. **Dialed in.** Nothing else changed."
- s24 summary: "Gym shorts read as loungewear outside the gym. Headed there? Change the occasion. Your score may change once I see your shoes."

The general template is `"{word}." + top fix sentence + (partial ? " Your score may change once I see your shoes." : "")`. The full copy deck is in `02-screens.md`.

### 5.7 "Why {score}?" ledger
Rows, in order:
1. "Everyone starts at 7.0"
2. One row per CREDITS entry, in order: earned rows show "+{face points}" with their evidence garment ("Elevated piece · tan chinos"); unearned rows show "+0" with a reason ("Layered · the overshirt is in your hand, not on", "Point of interest · all neutrals today")
3. On a partial check, one row "Partial check: credits scaled up" with `+(credit − Σ face)`, to 2 decimals
4. One row per fired rule, with impact = amount × (fit 0.8 · color 0.6 · proportion 0.6 · occasion 1.2), shown to 1 decimal. If clamping made the impacts disagree with `mistakes`, add one "Adjusted" row so the rows add up
5. An occasion row ("Date · dressed right for it ±0") when no occasion rule fired
6. The total: the display score, plus "No mistakes found" when `rules_fired` is empty

The engine must also return **evidence indices**, so rows and fixes can name the garment:
- K1: the first outer, else the knit top
- K2: the first core garment with formality ≥ 3
- K3: the first main garment that contributes
- K4: the shoes
- each rule: its culprit garment

Add these as extra fields. They must not change any parity field.

---

## 6. Anchored re-check (`recheckMerge()` in `src/recheck.ts`)

Reference: `kitted_logic.recheck_merge()` and `fix_targets()` (`fixTargets()` in `src/fixes.ts`, returns a sorted array).

1. **Re-check** (free, once per check). It's open for 30 minutes, or until 4 am after the first-ever check (ruling 22). It reads the new photo once (in the demo, by photo id: p01a), then merges it onto the **first** reading. It never scores the new reading alone.
2. **Targets** = the fields that the card's fixes touch: `"outerwear"` (a whole slot, from add/remove-layer fixes), `"bottom.hem"`, `"top.tucked"`, `"*.sleeve_end"`, …
3. Per category (top, outerwear, bottom, footwear; accessories and traditional pieces are kept from the first reading):
   - **Whole-slot target:** take the new slot (an added or removed layer, swapped shoes), unless the slot is hidden in the new photo.
   - **Same garment** (same subcategory and `FAMILY(color)`): keep the **first** reading's values. Only *state* fields can change: `hem, tucked, length, sleeve_end, condition, strain, shows_below_outer`.
     - A target state field takes the new value.
     - A non-target state change counts **only if the new reading says `certainty: clear` and the change fires a rule that wasn't firing**. That's a "new problem," and the card names it ("New: your shirt came untucked").
     - Identity fields (subcategory, color, pattern, volume, leg, logo, saturation) never change between two photos minutes apart, so noise like "slim" vs "straight" is ignored.
   - **Different type or color family:** it's a swap. Take the new garment and note it.
   - **Missing from the new reading:** keep the first (the model missed it, or it's hidden).
   - **Extra garment in the new reading:** add it only if `certainty: clear`.
   - If the first check was partial and the new photo shows shoes, take them (`shoes_visible = true`).
4. Re-score the merged reading. The score can't drop from noise, only from a clearly read new problem.
5. Card: "8.0 → 9.0", pill "+1.0" (display delta), done-fix row "+0.75" (raw gain), "Nothing else changed." when the notes are only the target change.

**"Didn't catch the change? Tell me":** if the merged score didn't move (the model missed the change), the link applies the fix's own edit to the first reading (`apply_fix`, Reading source `userConfirmed`) and re-scores. p01b → 9.0. Log it as a Correction.

Expected (`expected_scores.json → rechecks`):

| Case | Result |
|---|---|
| p01b → p01a (intended) | **9.0**, raw 8.75, notes `["changed: outerwear"]` |
| p01b → p01a_real | 8.5 (the real overshirt reads "wrinkled") |
| p01b → p01b (change missed) | 8.0 |
| "Tell me" | 9.0 |

---

## 7. "Not quite right?" corrections

1. Chips: Wrong item · **Wrong color or fit** · Fix doesn't apply · Score feels off.
2. Wrong item / color / fit: pick a garment row, then a field, then a value.
   - Row labels: volume → Fitted / Slim / Regular / Relaxed / Oversized
   - Leg chips: Slim / Straight / Relaxed (Skinny and Wide under "More")
   - The mockup subtitles "Regular fit", "How do they really fit?" and "Low profile" are display strings
3. Create a **new** Reading (`source: corrected`) with that one field changed. The original is never edited. Re-score instantly, with no API call. Preview line in the sheet (`02` D9, copy keys `nqr.scoreStays` / `nqr.scoreMoves`): `"Score stays {x}"` if the overall is unchanged, else `"Score {from} → {to}"` with the new number in copper. The demo case is p01b chinos straight → slim: **"Score stays 8.0"** (raw 7.775) plus the pill "Closet updated".
4. **Follow the stored link, never re-match** (Oct 8, DECISIONS-LOG #91; the old family re-match could recolor the wrong piece). Every garment of a check has a sighting (`closet_observations`) linked to the item it went to (`fit_checks.details.closetSummary.links`). The correction updates that sighting's garment and `user_confirmed`, then:
   - **still fits the linked item** (the identity engine finds no veto against its other sightings), or the item has **only this one sighting** → patch the item's garment field and append it to `confirmedFields` (a confirmed type or color renames an auto-named piece: "Black sweatpants" → "Black jeans");
   - **no longer fits an item seen 2+ times** → the sighting moves: through the engine to another piece he owns, or a new one; the old item loses a wear and keeps its look;
   - **Wrong item → remove** → the sighting is undone (its piece too, if that was its only sighting) and later garments' links move up one.
   - Checks from before V6 (no links) may only change one of their own pieces. From then on, closet anchoring overrides future readings of that item with the confirmed values (`app-build-spec.md` §2.5). The one quick tap's answer (not a Skip) is stored the same way, on the sighting (`user_confirmed.subcategory`).
5. Save a `Correction` (kind, field, old, new, scoreBefore, scoreAfter). In the demo it isn't sent anywhere.
6. Fix doesn't apply → hide that fix and show the next candidate. Score feels off → stepper "What would you give it?", then "Thanks."

---

## 8. Partial checks, occasions, same photo same score

### 8.1 Partial checks
| `not_rated` | Label |
|---|---|
| `["shoes"]` | "Partial check: shoes not included" |
| contains `"bottom half"` | "Partial check: top only" |
| contains `"traditional garment (not rated)"` | "Your {name} isn't rated. I score everything else." |

What isn't in the photo never costs points (credits scale halfway, §4.4).

The card is the standard card plus one row (ruling 21): **Finish the check**, "Same shoes as {weekday}?", a closet shoe tile, the camera (snap), and Skip. Re-check stays the primary button when a free fix exists.
- **Pick from Closet** (`pick_shoes_from_closet`): drop any footwear, append the item's garment, set `shoes_visible = true`, and leave `bottom.hem` as read. It's usually `na` (unknown), so hem rules skip. The label becomes "Full check (shoes from your closet)". s24 + White sneakers = **7.0** (raw 6.9; K2 is now earned, O4 still fires).
- **Shoe snap** (`merge_shoe_snap`): replace the footwear slot with the snap's footwear, take `bottom.hem` from the snap if it read one, set `shoes_visible = true`. The label becomes `checkmark.circle.fill` + "Full check" (the ✓ in this file always means that SF Symbol, never a text character: no emoji or dingbats in the UI). In the demo, the snap returns `variants/s24_shoe_snap_runners` (grey runners): 6.5.
- **Bottom-half snap** (`merge_bottom_snap`): replace bottom and footwear, set framing to `full_body`.
- A snap never uses a free check or the re-check. When it moves the score, the number cross-fades (for example 8.0 → 7.5) and the label becomes the check symbol + "Full check".

### 8.2 Occasion
The reading never depends on the occasion. Changing the chip re-scores in code, instantly and for free. The mockup's chips map to keys like this:

| Chip | Key |
|---|---|
| Everyday | `everyday` |
| Class/Work | `class`. (`seed.json` also carries `keyIfBusinessCasual: "work"` for a future `UserProfile.dressCode`; v1 has no dress-code control in `02`, so `dressCode` stays nil and the chip always maps to `class`.) |
| Date | `date` |
| Interview | `interview` |
| Event | `event` |
| Gym | `gym` |
| Home | `home` |

The other rubric keys (`work`, `work_casual`, `going_out`, `interview_corporate`, `interview_tech`, `wedding_formal`, `wedding_casual`) have **no chip in v1** (`02` shows exactly 7 chips, and no "More…"). Keep them in the engine and the tests; `expected_scores.json` also covers `work` and `work_casual`. Default: Everyday ("Everyday is picked unless you tap"), else the last used occasion. `02` D6 uses the same mapping.

Occasion drives:
- O1 (too casual / too formal against OCCASION_TARGET)
- T1 (dressy occasions)
- O3 (work* / interview*)
- O4 (not Gym/Home)
- the belt tip (dressy occasions)
- the "next level" visibility
- the fix engine skipping credit fixes at Gym/Home

`expected_scores.json` has every demo reading at all 9 chip keys (e.g. p01b: Everyday 8.0, Date 8.0, Interview 6.5).

### 8.3 Same photo, same score
- Key = **SHA-256 of the original image bytes**. The value is the saved Reading. The score is always recomputed from reading + occasion + profile + rubric, which is deterministic.
- A cache hit makes no API call, uses no free check and shows no staged loading (at most a 0.3 s "Same photo, same reading").
- No perceptual hashing, or before/after pairs would collide.
- In the demo, `INDEX.json → photo_sha256` is the hash of each `mockups/img/<id>.jpg`. **Ship the JPEGs byte-for-byte** as plain bundled assets and hash the bundled file's bytes, not a decoded/re-encoded image; don't run them through any image optimizer, which changes the bytes. Check the hashes once at startup in dev. The SHA path is the second way in. The first is the photo id (§11).

---

## 9. Rotation

Reference: `kitted_logic.rotation()`. Expected values: `rotation_expected.json`.

### 9.1 Algorithm (`app-build-spec.md` §4.7 / `demo-app-spec.md` §6, made exact)
```
rotation(closet, styles, boldness):
  for t in tops, b in bottoms, s in shoes, l in [none] + layers:
     items = [t, b, s] (+ l)
     valid if ALL hold:
       1. formality gap: max(formality) − min(formality) over items ≤ 1.0
       2. no style clash: top volume and bottom leg each < 1 full step outside his blended band (half steps are fine)
       3. none of the "hard" rubric rules fire when the items are scored as a synthetic full-body reading
          (occasion everyday, his styles and boldness; bottoms hem slight_break, tops untucked at_belt):
          C1a, C1b, C3, C4a_same_pattern_same_scale, C4b, B1, P2, P3, S1, S2, O4
     count DISTINCT keys: (slot, subcategory, FAMILY(color), pattern) per item, so near-duplicates
     (two white tees, or slim vs straight dark jeans) count once
  no score threshold, no season filter; not-photographed items count; it only drops when items are deleted
"+N fits" for an item = rotation(closet ∪ {item}) − rotation(closet)
```

### 9.2 Worked example on the seed closet (16 items)
The formalities:
- **Tops:** White tee 2, Grey tee 2, Navy crewneck 3, Light-blue oxford 3, Black tee 2, Black sweatshirt 2
- **Bottoms:** Khaki chinos 3, Navy chinos 3, Dark jeans 2.5
- **Shoes:** White sneakers 3, Brown loafers 3.5, Grey runners 2, Black Chelsea boots 3.5
- **Layers:** Navy overshirt 3, Olive overshirt 3, Denim jacket 2

The counts:
- Core outfits: 6 × 3 × 4 = **72**. 24 fail the formality gap (any 2.0 tee or sweatshirt with 3.5 loafers or Chelsea boots), leaving **48**.
- With the optional layer: 72 × 4 = 288. 108 fail the formality gap (24 core + 84 layered), leaving **180**.
- No hard color or proportion rule fires (the closet is mostly neutral), and no style clash.
- Per item ("+N fits it adds", with layers): tees 24, crewneck and oxford 42, each bottom 60, white sneakers and runners 72, loafers and Chelsea boots 18, each overshirt 48, denim jacket 36.
- Grey quarter-zip: +42 (with layers) / +12 (core only).
- Dark straight jeans: **+0**. They dedupe with his slim dark jeans, which is intended: "near-identical items count once".

### 9.3 Things to watch
- The dedupe key is (slot, subcategory, FAMILY(color), pattern). It isn't spelled out in the older specs, so pin it in a unit test.
- The interview idea layers an oxford under a crewneck. Rotation counts one top per outfit; outfit ideas may stack two tops.

### 9.4 37 can't be reproduced, so treat it as seed data
Searched closets and rule variants for this mockup closet (Tops 6, Bottoms 3, Shoes 4, Layers 3, with the named items): the specified rule gives 180 (with layers) or 48 (core only). No variant gives exactly 37 together with "+9 for a grey quarter-zip" and "+3 this week".

**In the demo, the Closet header, the "+3 this week" pill and the next-best-buy "+9 fits" read from `seed.json → scenarios.full.closetStats` / `nextBestBuy[0].displayFits`.** Exact rules, so the numbers never contradict each other on screen:
- **Header** = `rotationDisplayed` (37) + (computed rotation now − computed rotation at seed load). Adding or deleting an item moves it by the computed delta.
- **"+N fits" toasts, the S24 item card and the C3 delete message** use computed deltas (§9.1).
- **C2's Fits card ("14 of your 37 fits use it") is hidden** while the seeded display value is in use, because a computed per-item count (up to 72) can't sit next to a displayed total of 37. In `firstRun` (no override) it shows computed numbers.
- C6's footer shows the same header number.
Remove the override (and these special cases) once the founder settles the counting rule below.

Flag for the founder: **with layers multiplying, a 16-item closet gives about 180 fits, and one layer item shows "+48 fits"**. The founder should pick between:
- core-only counting (48 here, closer to the mockup's 37), or
- "a layer counts only if it changes formality or color story" (`brainstorm/02` §4.1)

Default until then: implement §9.1 exactly, and show the seed's display numbers in the demo.

---

## 10. Seed data (`seed.json`)

Generated by `make_seed.py` (don't hand-edit; change the script and re-run, since it asserts the mockup numbers). Top level:
```jsonc
{ "schemaVersion": 1, "rubricVersion": "3.1.0",
  "scoreWords": [...],          // ≤5.5 Needs a fix · 6–6.5 Getting there · 7–7.5 Put together · 8–8.5 Sharp · 9–9.5 Dialed in (ruling 24)
  "occasionChips": [...],       // §8.2
  "onboardingLooks": [ {photoID, style} ×6 ],   // s05 minimalist, s22 smart_casual, s14 gorpcore, s10 workwear, s13 streetwear, s09 old_money
  "welcomeExample": { photoID: "s15", occasion: "everyday", score: 8.5, word: "Sharp", label: "Full check" },   // scored with no styles
  "photos": [ {id, file, sha256, readingID, license, sourceURL, photographer, usedFor, latencySeconds} ×12 ],
  "scenarios": { "firstRun": {...}, "full": {...} } }
```
Map `-seed full|empty` (`05-build-plan.md`) like this: **`full` → `scenarios.full`**, and **`empty` → `scenarios.firstRun`**, which is empty data plus the scripted first check.

### 10.1 `firstRun` (Flows 1–2 and the paywall, screens 1–11 and 18)
- `now` = Thu **2026-10-22 07:38 −04:00**, America/New_York. Everything is empty, `profile: null`.
- `onboardingAnswers`: looks s22 + s10 → styles `[["smart_casual",0.5],["workwear",0.5]]`, "Smart casual with some workwear. Good mix."; 5′10″ (178 cm), Average, Regular, birth year **2005**.
  - The stepper **starts blank** (ruling 28). 2005 is what he picks.
  - Bubble: "5′10″ · Average · Regular · 2005".
- `story` (the scripted demo):
  1. **First check:** p01b at Date, so 8.0 "Sharp", plus the fix and next-level tip from §5.5. The closet row reads "**Added 4 to Closet**": tee, chinos, sneakers and the **held** overshirt. Held items are auto-added like worn ones, with Undo. "What I read" pills: White tee · Tan chinos · straight · White leather sneakers · Beige overshirt · in hand.
  2. **Correction** (optional): chinos → slim, "Score stays 8.0", "Closet updated".
  3. **Re-check** with p01a: 9.0, +1.0, done fix +0.75.
  4. **Paywall:** "Today: 8.0 → 9.0 · One free fix. Nothing new to buy."
  5. **After the story:** 4 closet items, Lookbook 1 this week · 1 total, Starter pre-filled s01, s06, s07, s09.

### 10.2 `full` (Flows 3–5, screens 12–17, 19, 20; `now` = Thu 2026-10-22 **12:20** −04:00)
Use `now=2026-10-22T12:20:00` (deep link) / `-demoNow 2026-10-22T12:20:00` (launch argument), or nothing: in demo builds the `Clock` starts at the loaded scenario's `now` (`05` §5.2 demo arguments).

**Profile:**
- 5′10″, average, regular fit, styles smart casual + workwear (as ordered pairs), birth year 2005
- boldness nil (scored as `a_little`; the fact is a guess)
- budget $30–60, idea time 08:00, free plan
- Summary line "5′10″ · Average · Regular fit"

**Facts (9, "All 9"):** the first four are drawn in the mockup.

| # | Fact | Source | Date |
|---|---|---|---|
| 1 | Likes straight-leg pants | From a fit check | Oct 12 |
| 2 | Spends $30–60 an item | You told me | Oct 14 |
| 3 | Career fair on Oct 29 | You told me | Oct 20 |
| 4 | Boldness: a little | My guess · not asked yet | |
| 5 | Has class most weekdays | | Sep 24 |
| 6 | Owns a denim jacket (no photo yet) | | Oct 9 |
| 7 | Wears white sneakers most days | | Oct 12 |
| 8 | Doesn't tuck his tees | | Oct 13 |
| 9 | Mostly neutral colors | guess | Oct 7 |

**Closet (16: Tops 6 · Bottoms 3 · Shoes 4 · Layers 3).** Each item has `garment`, a full v3 garment, so it can be dropped into a reading.

| id | Name | v3 garment | Hex | Notes |
|---|---|---|---|---|
| T1 | White tee | tee/white | #F2F0EA | starter s01, from first check Sep 24 |
| T2 | Grey tee | tee/grey | #9CA0A6 | |
| T3 | Navy crewneck | sweater/navy | #2B3550 | s04 |
| T4 | Light-blue oxford | oxford_shirt/light_blue | #AFC6DE | s03 |
| T5 | Black tee | tee/black | #1E2026 | |
| T6 | Black sweatshirt | sweatshirt/black | #22252B | from the s24 check Oct 20 |
| B1 | Khaki chinos | chinos/khaki_beige, straight | #C9B48A | s06, `confirmedFields: [leg_shape]` |
| B2 | Navy chinos | chinos/navy, slim | #2A3046 | |
| B3 | Dark jeans | jeans/denim_dark, slim | #26324F | slim, so they don't fill s05 "dark straight jeans" |
| S1 | White sneakers | white_leather_sneaker/white | #F2F1EC | s09 |
| S2 | Brown loafers | loafer/brown | #5A3522 | s10 |
| S3 | Grey runners | retro_runner/grey | #9AA0A8 | |
| S4 | Black Chelsea boots | chelsea_boot/black | #1F1B18 | |
| L1 | Navy overshirt | overshirt/navy | #273250 | s07 |
| L2 | Olive overshirt | overshirt/olive | #5B6440 | added Oct 21 via "I bought something" |
| L3 | Denim jacket | denim_jacket/denim_mid | #5D7393 | **not photographed** (solid tile, `No photo yet` since Nov 19), s08 |

`closetGridOrder` starts with the mockup's six: Olive overshirt, White tee, Navy crewneck, Dark jeans, White sneakers, Denim jacket.

**Closet stats:**
- `closetStats`: rotationDisplayed **37**, rotationWeekDeltaDisplayed **3**, starter **8 of 12**
- `starter12`: rubric/v3.md's list with `ownedItemID`; missing are s02 polo, s05 dark straight jeans, s11 quarter-zip and s12 belt
- `nextBestBuy[0]`: **Grey quarter-zip, displayFits 9, "$40–70", "Plain, no big logo. Layers over every tee you own."**, followed by 4 more mocked archetypes (`displayFits: null`, which means use the computed value)

**Fit checks:**

| id | When | Photo | Score | Notes |
|---|---|---|---|---|
| FC0 | Sep 24 | deleted | 8.0 | first check |
| FC1 | Oct 12 | deleted | 9.0 | Class. Leg corrected slim → straight (8.5 → 9.0), the source of fact 1 |
| FC2 | Tue Oct 20 08:10 | s24 | 6.5 | Everyday, partial, snap skipped. Added T6; gym shorts undone |
| FC3 | Thu Oct 22 07:42 | p01b | 8.0 | Date. Matched T1/B1/S1; the held overshirt was undone |
| FC3R | 07:50 | p01a | 9.0 | re-check, `parentID` FC3 |

Each embeds its reading, score, rules, credits and fixes.

**Lookbook:**
- `wearLog`: 19 days. Sep 24, 25, 28, 30; Oct 1, 2, 5, 6, 7, 9, 12, 13, 14, 15, 16, 19, 20, 21, 22. Check days have a fit check; the others have a "Wear this" outfit generated from the closet as it was that day.
- `lookbookHeader`: **4 this week · 19 total**. The week runs Sunday–Saturday, Oct 18–24.
- `calendar`: October 2026, Oct 1 = Thursday, today = 22, logged dots on 1, 2, 5, 6, 7, 9, 12, 13, 14, 15, 16, 19, 20, 21, 22, week 18–24 highlighted, days > 22 dimmed.
- `lookbookRows`: "Date · 8.0 → 9.0 / Thu, Oct 22 · Full check · 1 fix" (p01a) and "Everyday · 6.5 [Partial] / Tue, Oct 20 · Shoes not included" (s24).

**Outfits:**
- `O_MORNING` (class): Navy overshirt, Grey tee, Khaki chinos, White sneakers. Lock-screen text "Today: navy overshirt, grey tee, khaki chinos, white sneakers."
- `O_INTERVIEW`: "Sharp, not stiff". "Light-blue oxford under a navy crewneck, navy chinos, brown loafers. Match a brown belt to the shoes." Predicted 8.5 at Interview.

**`chatThread`:** the Oct 20 s24 card, then today: 07:42 the p01b check, the card, "Overshirt on? Send it. I'll only re-read the layer.", the re-check, then 08:00 "Thursday 8:00 am" with "Morning. An easy one for class today:" and the idea card, then 08:04 "What should I wear?" → "Where to?" → "Interview" → "Career fair on the 29th, right? …" with the idea card, then two questions at 12:05 and 12:09.

**`usageToday`:** checks 1/1 (re-check used), questions **2/5**, so the limit card says "Questions still work tonight: **3** left".

**`heldPhotoScript`** (screen 19): s12 at 21:12. The limit card copy, plus "Save for tomorrow", which creates a FitCheck with status **`held`** (ruling 27). It's never auto-sent; one tap after 4 am scores it (7.0).

**`lockScreen`:** the 3 notification texts. The trial one goes only to trial users; it's shown in the mockup for review.

**`shareCard`:** p01a, Date, 9.0 "Dialed in", "8.0 → 9.0 after 1 fix", "scored by KITTED".

### 10.3 Screen → scenario map (for `-demoScreen <n>`)
| Screens | Scenario and state |
|---|---|
| 1 Welcome, 2–4 onboarding | `firstRun`, before onboarding (welcome card = `welcomeExample`) |
| 5 Camera, 6 Reading | `firstRun` after consent; SimulatedCamera shows p01b, the library thumb s25; reading stages per §11 |
| 7 Result, 8 Why, 9 Not quite right?, 10 Re-check | `firstRun` story steps 1–3 |
| 11 Partial | `full`, FC2 card (or run s24 live at Everyday) |
| 12 Stylist home, 13 Outfit idea | `full` thread, clock 08:01 / 08:05, scrolled to the 08:00 / 08:04 messages. Add `-freeChecksUsed 0` for screen 12 so the subtitle reads "1 free check today" as drawn (§12 #2) |
| 14 Lock screen | `full.lockScreen` |
| 15 Closet, 16 Lookbook, 17 You | `full` at 12:20 |
| 18 Paywall | `firstRun.story.paywall` |
| 19 Limit | `full`, clock 21:12, checks used = 1, then the s12 capture |
| 20 Share | `full.shareCard` |

---

## 11. `MockReadingSource` (the demo vision step)

```ts
interface ReadingSource { read(image: PreparedImage, kind: ReadKind): AsyncIterable<ReadingEvent> }
type ReadingEvent =
  | { type: "stage"; stage: string } | { type: "slotFound"; label: string /* "White tee" */ } | { type: "reading"; reading: Reading }
  | { type: "meta"; latency: number } | { type: "failed"; code: string; counted: boolean };
```

**Lookup:**
1. By **demo photo id**. The sample-photo strip passes the id, and the reading is `DemoReadings/<id>.json`.
2. Else by **SHA-256** of the image bytes against `INDEX.json → photos[].photo_sha256`.
3. No match → don't invent a score. Show "This demo only knows its sample photos" (`05-build-plan.md`).
4. Shoe snaps return `variants/s24_shoe_snap_runners.json`. A re-check of p01b returns p01a.

**Timing:** use the real numbers. The locked config measured an API median of **6.51 s** (stock) and 6.63 s (mirror), p90 8.75 s, min 4.0 s, max 13.1 s; each photo's own latency is `INDEX.json → latency_s`, e.g. p01b 6.54 s. `-demoLatency <s>` sets the total `T` (default 6.6; `real` = the photo's own latency; `0` = instant, for UI tests and screenshots). Events, as fractions of `T`:

| t | Event |
|---|---|
| 0 | shutter haptic, photo bubble, skeleton card, occasion chips (Everyday preselected) |
| 0.03 T (≤ 0.15 s) | `.stage("photoOK")` (on the phone). Not a StageList row (the 4 rows in `02` D6 start at "Finding your pieces") |
| 0.03–0.10 T | `.stage("sending")`. The bubble caption already reads `lock` + "Only this is sent" (ruling 13); no row |
| 0.40 T | `slotFound` top ("White tee"), "Finding your pieces · 1 of 4" |
| 0.52 T | outer, or a held item ("Overshirt · in hand") |
| 0.64 T | bottom ("Tan chinos") |
| 0.78 T | shoes ("White leather sneakers"), or "Shoes…" dims to "Shoes not in photo" for a partial reading |
| 0.85 T | "Checking fit" |
| 0.92 T | "Colors & proportion" |
| T | `.reading`, then the card renders. "Writing your fixes": the template text appears immediately; if you animate a fake stream, keep it ≤ 1.2 s |

Ruling 19 timeouts:
- **9 s**: "Taking longer than usual" (test with `-demoLatency 12`)
- **14 s**: abort with `failed(code: "timeout", counted: false)` → "Try again. This one doesn't count." (test with `-demoLatency 20`)

Debug toggles: unreadable (no score, not counted), not fully clothed (a reading with `clothed: partial`, nothing saved), offline.

**Other AI calls in the demo** (no text model, no item reader):
- **Explanation:** template sentences (§5.6). No streaming needed.
- **Questions (S25):** a mock `AnswerSource` returns the seeded answers for the seeded questions (`full.chatThread` M15–M18) and `ask.demoOnly` ("This demo can't answer new questions yet. The real app will.") for anything else. Each still counts toward the 5 a day.
- **Item photos (S24, C4):** no bundled item readings, so a photo ends in `item.demoOnly`; Describe it (C4d) is code only and works.
- **Unknown photo** (bytes match no bundled reading): `demo.unknownPhoto`. Never invent a score.

**Tag text:** the color label plus the plain garment name:
- Colors: white → White, tan_camel → Tan, khaki_beige → Beige (but khaki_beige chinos → "Khaki chinos"), grey → Grey, navy → Navy, denim_dark → Dark
- Garments: white_leather_sneaker → "leather sneakers" (the full row reads "White leather sneakers")
- Held items get " · in hand"

---

## 12. Mockup inconsistencies, and what this data does about them

| # | What the mockups show | Decision |
|---|---|---|
| 1 | The date check says "Added 4 to Closet", but the Closet tab has no room for the beige overshirt or tan chinos (Layers 3 and Bottoms 3 are taken by named items) | Two scenarios: `firstRun` reproduces "Added 4" on an empty closet. In `full`, the same check matched T1/B1/S1, and the held overshirt was undone |
| 2 | Screen 12 says "1 free check today" at 8:01 on Oct 22, but the date check at 7:42 the same day used it | `full` shows "Check used today" (computed). To capture screen 12 exactly, use `-freeChecksUsed 0` |
| 3 | The partial card asks "Same shoes as **Sunday**?", but Sunday Oct 18 isn't a logged day (no weekend is) | The copy is computed from the last logged day with shoes: "Same shoes as **Monday**?" (Oct 19). `fitChecks[FC2].finishRow`. `02` D11 and `03` FinishCheckRow use the `{weekday}` template |
| 4 | The Lookbook "19 total" vs 15 dots in October | 4 September days (24, 25, 28, 30) |
| 5 | Rotation 37, "+3 this week", "+9 fits" | Not reproducible by the specified rule (§9.4). Seed display values |
| 6 | The lock screen's "2 quick fixes inside" vs s24's single fix | The notification copy is a template example. Generate "{n} quick fix(es) inside" |
| 7 | `app-build-spec.md` says "Starter 5 of 12" and "41 total" | The mockup wins: 8 of 12 and 19 total |
| 8 | The brief's guess of "raw 7.85" for the slim correction | rubric.py gives **7.775** with equal weights; that's the value in `expected_scores.json → corrections` and the only one to test against. Display 8.0 either way |
| 9 | The mockup's own clock: the bubbles read 7:42 (check), 7:50 (re-check), 8:00 (idea stamp), 9:12 pm (limit); the status bar reads 9:41 | Message times come from `seed.json` (they match the bubbles). The status bar is overridden to 9:41 for screenshots (`05` §5); it's system UI and isn't compared |

---

## 13. Test checklist for `@kitted/core` and the app

Done in `@kitted/core` and verified Oct 6 with `scripts/verify.mjs` (re-run them with `npx vitest run` after installing vitest):
- [x] `test/rubric.parity.test.ts`: all 5,694 cases in `rubric_parity.json` (§4.9), the 27 `fp_boundary` cases, no input mutation, rounding (round_half(8.75) = 9.0, (7.775) = 8.0, (9.25) = 9.5, (6.749999999999999) = 6.5, nearest(0.5) = 1, Python `round()` ties).
- [x] `test/demo-story.test.ts`: all 181 cases in `expected_scores.json → cases` (with score word and partial label), the 23 `mockup_checks`, the `corrections` and `partials` arrays, and the firstRun story end to end (8.0 → fix → "Score stays 8.0" → re-check 9.0).
- [x] `test/fixes.test.ts`: `expected_scores.json → fixes` (copy, tag, `to`, order, next_level), `fixTargets`, "Tell me". These are the reference behavior from `kitted_logic.py`; if you change a selection rule on purpose, regenerate them and say so.
- [x] `test/recheck.test.ts`: the `rechecks` array.
- [x] `test/rotation.test.ts`: `rotation_expected.json` (180 / 48 / 114 before this week / per-item / next-buy / first 10 combos).

Still to write in the app:
- [ ] `SeedLoader` tests: the counts in §10 (16 items, 6/3/4/3, 8 of 12, 4 + 19, 9 facts, questions left 3).
- [ ] Run the parity test once on Hermes (a dev-only screen in the app; Jest and Vitest both run on Node/V8, not Hermes).
- [ ] "Why" ledger evidence indices (§5.7) are not in the package yet; add them as extra fields without changing any parity field.

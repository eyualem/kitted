# T69 · The rescoring in the app (parts engine v16)

**Size:** strict (scoring) · **From:** `plan.md` → T69 (lane "Fit check and scoring") · **Spec:** `rubric/v5-styles.md` with the T68 diff applied (title line: "parts engine v16: approved Nov 17, DECISIONS-LOG #484"); checks from `specs.md`: **F2.1** and the launch bar **"The score is fair"** (line 19) · **Source of truth for every number:** `extraction-test/rubrics/parts_proto.py`, `engine="v16"` (CLAUDE.md: the Python engine wins on scoring) · **After:** T68 (PR #124; this branch is stacked on it) · **The founder's calls:** #484 ("Yes, approve": the round-7 engine, B6 counted with each reading's own leg look); #490 ("Yes, build v16", Y47: port exactly, no outline or coat rules; B6 stays T68's count, 218/223; PR #140's stricter count with looks U and L, 217, is information only).

This file is the plan the test writer and the implementer work from (it stands in for TASK.md → What changes; TASK.md still gets Built, Disputes and Review). The test writer reads **Interfaces** and `TESTING.md` only, so Interfaces is complete on its own.

## Goal
New fit checks score with v16 exactly as the Python engine does: no 5.0 floor, 3.0 to 9.5 (9.0 is the highest a real reading reaches, see Q-F1), lifts that stack, dealbreaker caps, his taste rules by the outfit's own look, the season, the curve, and the new leg-width second look on checks in pants. Old checks keep their v15 scores. The card's word covers 3 to 4.5, and Why's rows add up to the v16 score.

## Before anything: what the spec, the engine and the hand-over disagree on
Each one is an open question below (who decides, and the default this plan builds to).
1. **9.5 can't be reached.** The curve maps a raw score of 9.5 (the clamp) to 8.75, which rounds to 9.0. The spec's "four lifts in one look reach 9.5" ([SCO-2]) and the stacking ceiling of 9.5 never bind. T68's results show 0.0% in 9–9.5 on every set. → Q-F1.
2. **[SCO-7]'s example is stale.** "Skinny jeans under a fitted tee (Proportions −2.0) go 7.0 → 6.0": v16 gives **5.5** (the fault drop of 1.0, plus [TST-sk]'s −0.5 for skinny legs, then the curve: raw 5.575, curved 5.433). The engine wins; the doc line needs his yes to change. → Q-F2.
3. **`specs/tailored.md` says Tailored changes no score** ("No score changes: only the name the card shows"), but v16's taste rules key on Tailored by TL1. #484 (later, his own yes) approves "Tailored recognized"; `specs.md` names no looks. Built as v16 does. → Q-F3.
4. **`core/weather.ts` says weather never changes a score (#59).** #464 and [SCO-9] change that: the season counts. The comment gets updated; no behaviour of weather.ts changes.
5. **F2.1 with a season.** #464: "the card's 'Scored for a warm day' line and the F2.1 wording wait for his yes". This plan keeps F2.1 literal: the same photo sent again reuses the first check's season with its reading and second look, so it gets the same score. → Q-F4.
6. **The rulebook's spec line lacks the literal `**Approved by the founder:** <date>` marker** that `/build-task`'s gate looks for. The founder's yes is recorded (#484, verbatim) and the title says "approved Nov 17", and both plan-line checks live in `specs.md` (approved, #388). Planned on that basis; the coordinator may want the marker added under the title (no wording change).

## Files
In the lane (`app/packages/kitted-core`, `extraction-test/`, `app/src/features/{fitcheck,camera}`) or named on the plan line (`app/assets/gemini/`, `handoff/fixtures/`, `features/why/`, `en.ts`, `handoff/02-screens.md` §5):
- `extraction-test/rubrics/parts_proto.py`: **output-only** additions on the v16 path (no number moves): `_v16_result` gains `average_unrounded` (the unrounded raw, after the 3–9.5 clamp, before the curve) and `raw_unrounded` (the unrounded final, before the half-rounding); the `v16` dict gains `raw_unclamped` (round 3: the raw before the clamp) and `cond_deduction` (round 3: the Condition deduction actually taken, after S9's ownership). `VERSIONS["v16"]` relabelled `"parts-proto-16 (Nov 17, 2026)"` (drops "on paper"). Python's own default engine stays `"v15"` (every Python caller, the 501 conformance cases and the paper scripts, stays as it is). Nothing in v1–v15 changes.
- `extraction-test/rules_conformance.py`: per-case `engine` (default `"v15"`), `season`, `graded_look`; v16 cases for every new rule ID (below); a v16 band table for 3–4.5.
- `handoff/fixtures/parts_fixes.py`: `suggest_parts_fixes(..., engine="v15", season=None)`; `_score` passes engine and season through and, for v16, takes `raw_unrounded` from the result (not `P.combine`, which is v15's).
- `handoff/fixtures/make_parts_json.py`: `VERSION = "2.0.0"`, `ENGINE = "v16"`, a `rollback15` block (engine v15, its label, version `"1.14.0"`, `TUNE["v15"]`), and the v16 tables (below).
- `handoff/fixtures/make_parts_parity.py`: the pull pinned to the one the current fixture records (`screenshots/phone/20261017-212744/SQLite/kitted.db`, its `pull` key) so the v15 cases regenerate from the same inputs; v16 cases tagged `"tune": "v16"` (and `"v16_whatif*"`) with `season` and `graded_look` fields; `average_unrounded` / `raw_unrounded` from the result's own keys for v16.
- `handoff/fixtures/make_parts_fixes.py`: v16 cases (cool and warm) added after the v15 ones.
- `handoff/fixtures/make_parts_steadiness.py` (new) → `handoff/fixtures/parts_steadiness.json` (new): the B6 set (see Data).
- `handoff/fixtures/parts.json`, `parts_parity.json`, `parts_fixes.json`, `rules_conformance.json`, `parts_steadiness.json`: regenerated by the scripts only.
- `app/packages/kitted-core/src/parts.ts`: the v16 port, the switch, the engine router. `partsData.ts`: regenerated by `scripts/gen-rubric-data.mjs`. `partsFixes.ts`, `partsTap.ts`, `partsCheck.ts`, `index.ts` (shared: export lines only, `git add -p`). `weather.ts`: the #59 comment only.
- `app/assets/gemini/prompt-look-w.json`, `schema-look-w.json` (new), synced from `extraction-test/prompt_look_w.txt` and `schema_look_w.json`.
- `app/src/features/fitcheck/scoring.ts`, `service.ts`, `secondLook.ts`.
- `app/src/features/why/partsRows.ts`, `PartsBreakdown.tsx`.
- `app/src/i18n/en.ts` (the new Why row keys), `handoff/02-screens.md` §5.4 (the 3–4.5 word's key), then `app/src/i18n/en.generated.ts` via `node app/scripts/gen-en.mjs`.

**Outside the lane, needed (the coordinator OKs or reassigns; each is a small, named change):**
- `app/src/services/readingSource/secondLook.ts`, `live.ts`, `mock.ts`, `types.ts`: the third arm (W). The second look's calls live here.
- `app/src/data/types.ts` (shared): `LookAnswerW`, `StoredSecondLook.w`, `LookArm` gains `'W'`, `StoredParts.v16`.
- `app/src/design-system/tokens.ts`, `score.ts` (shared): the 3–4.5 band. `components/Ledger.tsx` (shared): an optional `testID` prop on `LedgerRow` (for the UI inventory; no visual change).
- `app/src/demo/scenarios.ts`, `applyDemoScreen.ts` (shared): demo screens 300–309.
- Not touched: `firebase/` (the server's `look` route already takes any one-image look request; `CALLS_PER_CHECK = 10` covers read ×2, U, L, W, closet ×2), `features/stylist/cards/` (the card's `score >= 9` lines still hold), `core/scoreWords.ts` (the v4.1 port, parity-bound to `kitted_logic.score_word`; the app's words come from `design-system/score.ts`).

## Interfaces
What the tests call. Everything core is exported from `@kitted/core` (`app/packages/kitted-core/src/index.ts`; core tests import `../src/index`).

### Core: options and results (`parts.ts`)
```ts
/** v16's temperature band: "warm", or cool (mild and cold; the default) as null/undefined. */
export type Season = "warm" | null;

export interface PartsOptions {
  occasion?: string;
  styles?: Styles | null;          // his picks: the "Reads as" label only, never a number (unchanged)
  boldness?: string;
  secondLook?: SecondLookInput | null;
  /** v16 only (ignored by v1–v15, as parts_proto's `season if t["v16"] else None`). */
  season?: Season;
  /** v16 only: the look(s) the taste rules follow. Absent/null/empty = the outfit's own pick-free looks plus "tailored"
   *  by TL1 (parts_proto.graded_looks). The app never passes it in T69 (a later "pick your look" step will). */
  gradedLook?: string | readonly string[] | null;
}

/** The second look as the engine reads it (parts_proto._second_look plus v16's raw keys). */
export interface SecondLookInput {
  peek?: unknown; rests_on_shoe?: unknown;
  under_present?: unknown; under_shows?: unknown;   // look U
  covers_shoe?: unknown; pant_end?: unknown;        // look L
  knee?: unknown; opening?: unknown;                // look W (new): "clings"|"skims"|"hangs_away"|"not_visible", "narrower"|"about_the_same"|"wider"|"not_visible"
  shorts_end?: unknown; long_top?: unknown;         // read by v16 if present; nothing in the app sends them yet
  [extra: string]: unknown;
}

/** parts_proto's result["v16"], camelCased (the parity test maps each key back). Present only when engine is v16. */
export interface PartsV16 {
  season: "warm" | "cool";
  lifts: { id: string; size: number; line: string; layer: boolean }[];   // after the taste rules and the one-lift halving
  liftSum: number;          // round 3
  minor: number;            // round 3: small credits at their part's weight
  faultDrop: number;        // round 3: worst part's charges × alpha + the rest × beta
  heavyLayer: [number, string] | null;   // warm day only
  caps: { cap: number; id: string; kind: "sink" | "hold" | "clash"; line: string }[];
  stackCeiling: number;     // 7.5 / 8 / 8.5 / 9 / 9.5
  oneLook: boolean;
  heldBy: string | null;    // which ceiling bound: a cap id ("S1", "H10", …), "<n> lift(s)[ in one look]",
                            // "a fit or shape fault: lifts can't cover it", "occasion", "two sinking faults: a redo",
                            // "two holding faults"; null when none bound
  raw: number;              // round 3, after the 3.0–9.5 clamp, before the curve
  rawUnclamped: number;     // NEW (output-only, Python too): round 3, before the clamp
  condDeduction: number;    // NEW (output-only, Python too): round 3, the Condition deduction actually taken
  curved: number;           // round 3, after the curve and its 3.0–9.5 clamp, before the ceilings
  owned: string[];          // part checks a cap (or the waivers, or V16_UNSTEADY) stood for
  ceiling: number;          // the lowest ceiling
  depends: [string, number, number] | null;   // the "depends" row: [id, base, k]
  unread: Record<string, string>;             // V16_UNREAD
  taste: { points: number; id: string; line: string }[];   // after a dealbreaker drops the charges
  gradedLook: string[];     // sorted
}

export interface PartsScored {
  // …every v15 field, unchanged in meaning for v1–v15. For v16 (as Python's _v16_result): earnedBonus 0,
  // piledPenalty 0, floored false, average = v16.raw, averageUnrounded = the unrounded raw, rawScore = round(final, 3),
  // rawUnrounded = the unrounded final, lowest = the v16 lowest line ("nothing off" when a part has no reasons).
  v16?: PartsV16;
}
```

### Core: data, the switch and the router (`parts.ts`, `partsData.ts`, `partsCheck.ts`)
```ts
export interface PartsTune { /* …v1–v15 keys… */
  v16: boolean; v16_color: boolean; sty3_off: boolean; v16_alpha: number; v16_beta: number;
  curve: [number, number, number]; v16_knit: number; v16_h9_cap: boolean; v16_h7_cap: number;
  taste: V16Taste | null;
}
/** TUNE["v16"]["taste"]: every key parts_proto reads, including the what-if knobs that are off by default. */
export interface V16Taste {
  leg_look_mode?: "tiebreak" | "replace" | "off"; leg_look_global?: boolean;
  steady_map?: Record<string, string>; other_shoe_real?: boolean; lift_off?: string[]; h7_tip?: boolean;
  long_top?: number; long_top_read?: "reading" | "ruler"; shorts?: number; one_lift?: number; one_lift_mode?: "first";
  stack_prehalf?: boolean; relaxed_factor?: number; leg_slim?: number; leg_skinny?: number; leg_wide?: number;
  color?: number; sandals_warm?: boolean; runners_casual?: boolean; sil?: number; sil_mode?: "alone" | "single" | "top_up" | "shape";
  sil_line?: number; sil_tonal?: number; hem_plus?: number; shorts_wide?: number; shorts_above?: number;
  accent_by_look?: boolean; accent_agree?: boolean; pn1_look?: boolean;
}
export interface PartsData { /* …as today… */
  /** The tables v16 reads (make_parts_json.py writes them all): */
  v16?: {
    lifts: Record<string, [string, number | null, boolean]>;   // V16_LIFTS
    liftNames: Record<string, string>;                          // V16_LIFT_NAMES
    owns: Record<string, string[]>;                             // V16_OWNS (S2 = S1's; S5/S7/H6/H5 = ["X_<id>"])
    unsteady: string[];                                         // V16_UNSTEADY
    unread: Record<string, string>;                             // V16_UNREAD
    tasteByLook: Record<string, Record<string, number | "2nd">>;// TASTE_BY_LOOK
    l5ByLook: Record<string, number>;                           // L5_BY_LOOK
    tlJacket: string[]; tlNever: string[]; proPieces: string[]; // TL_JACKET, TL_NEVER, PRO_PIECES
    sets: Record<"OPEN_LAYERS" | "LIGHT_SHIRTS" | "UNDER_TEES" | "KNIT_LAYERS" | "HEAVY_LAYERS" | "SUMMER_TOPS" | "SUMMER_BOTTOMS", string[]>;
    smart: number;                                              // SMART = 4.0
  };
  /** v16: what the third switch rolls back to: v15's engine, label, version and tune. */
  rollback15?: { engine: string; label: string; version: string; tune: PartsTune };
}

/** THE SWITCH for the rescoring (parts v16, #484). true (shipped): new checks score with v16. false: every default path
 *  (the card, its fixes, the one quick tap, Going for, the chat's outfit judge, allowedColors) goes back to v15. */
export const RESCORE_V16: boolean;            // = true
/** Tests only. */
export function setRescoreV16(on: boolean): void;
/** The bundled data as the switches want it: v16 (all on), v15 (v16 off), v14 (v15 off), v13 (v14 off). */
export function partsDataFor(v14: boolean, v15?: boolean, v16?: boolean): PartsData;
/** The engine a stored parts check is scored with (#209: editing a check never moves it to another engine; [SCO-9]:
 *  a stored score never changes): `parts-2.0.0` → v16; any other "parts-…" → v15 (as partsDataFor(true, true, false));
 *  with RESCORE_V16 off, everything → the switch's engine. */
export function partsEngineFor(rubricVersion: string): PartsEngine;
export function scoreParts(reading: Reading, opts?: PartsOptions): PartsResult;   // follows the switches (unchanged)
export function createParts(data: PartsData, rubric?: RubricEngine): PartsEngine; // unchanged signature

// partsCheck.ts
export const PARTS_RUBRIC_VERSION: string;    // "parts-2.0.0" with RESCORE_V16 on, "parts-1.14.0" off
```
Data version: `PARTS_DATA.version === "2.0.0"`, `engine === "v16"`, `label === "parts-proto-16 (Nov 17, 2026)"`, `rollback15.version === "1.14.0"`.

### Core: the paths that must score like the card
```ts
// partsFixes.ts: the fix engine scores every candidate with the card's season (and engine, through `engines.parts`).
export interface PartsFixOptions { /* …as today… */ season?: Season; gradedLook?: string | readonly string[] | null;
  /** unchanged meaning: no layer and no boots fix. The app passes warm === (season === "warm"). */ warm?: boolean; }
export function suggestPartsFixes(reading: Reading, opts?: PartsFixOptions, engines?: PartsFixEngines): PartsFixSuggestions;

// partsTap.ts: an optional engine as the last argument (default: the switch's).
export const partsOverall: (reading: Reading, opts?: PartsOptions, engine?: PartsEngine) => number | null;
export function askQuestionParts(reading: Reading, opts?: PartsOptions, engine?: PartsEngine): TapQuestion | null;
export function askWithClosetParts(reading: Reading, opts?: PartsOptions, known?: readonly KnownPiece[], engine?: PartsEngine): TapQuestion | null;

// partsCheck.ts
export function partsRecheckOutcome(first: Reading, fixes: readonly Fix[], merged: Reading, opts?: PartsOptions,
  mergedOpts?: PartsOptions, closet?: readonly ClosetItem[], engine?: PartsEngine): RecheckOutcome | null;
```

### App: the leg-width look W (`services/readingSource/secondLook.ts`, `types.ts`, `live.ts`, `mock.ts`; `data/types.ts`)
```ts
// data/types.ts
export interface LookAnswerW { knee: 'clings' | 'skims' | 'hangs_away' | 'not_visible'; opening: 'narrower' | 'about_the_same' | 'wider' | 'not_visible' }
export type LookArm = 'U' | 'L' | 'W';
export interface StoredSecondLook { version: string; u: LookAnswerU | null; l: LookAnswerL | null;
  /** The leg-width look (#482–484). Absent on checks from before it; null when it ran late, failed or wasn't asked. */
  w?: LookAnswerW | null;
  copied?: { from: string; why: 'samePhoto' | 'firstCheck'; arms: LookArm[] } }

// services/readingSource/secondLook.ts
export const LOOK_W_PANTS: ReadonlySet<string>;   // jeans, trousers, chinos, cargos, suit_trousers, drawstring_trousers, joggers, sweatpants, track_pants (leg_look.py PANTS)
export function buildLookRequest(arm: LookArm, jpegBase64: string): object;   // W: prompt-look-w.json's prompt, schema-look-w.json, temperature 0, thinkingBudget 0, the prompt then the one image
export function validateLook(arm: 'W', x: unknown): LookAnswerW | null;     // every required field present and in its enum, trimmed to the schema
export function lookImages(zoom: readonly string[] | undefined): Record<LookArm, string> | null;   // W = L's image (the lower close-up, or the one body close-up)
export interface LookGemini { arm(arm: 'W', jpegBase64: string, signal?: AbortSignal, tag?: CheckTag): Promise<LookResult<LookAnswerW>>; /* + U, L as today */ }

// services/readingSource/types.ts
export interface ReadingSource { /* …as today… */
  /** The leg-width look, started by the service once the reading's bottom is known to be pants (LOOK_W_PANTS).
   *  null when it can't run (a demo photo, no close-ups, no transport). Never rejects. */
  legLook?(image: PreparedImage, kind: ReadKind, opts?: ReadOpts): Promise<LookResult<LookAnswerW>> | null;
}

// features/fitcheck/secondLook.ts
export function settleSecondLook(call: SecondLookCall, graceMs: number, scheduler: Scheduler,
  w?: Promise<LookResult<LookAnswerW>> | null): Promise<SettledLook>;   // W gets the same grace from the reading's arrival; late/failed → w: null, listed in late/failed
export function lookInput(sl: StoredSecondLook | null | undefined): SecondLookInput | null;   // adds knee + opening when sl.w is set
export function hasLook(sl): boolean;                       // true when any of u, l, w is set
export function anchorRecheckLook(own, parent, parentId);   // W follows U/L's rule: used only if the first check had it
export function copiedLook(from); export function ownLookOf(from);   // carry W like U/L
export function settledLine(s: SettledLook): string;        // adds "W" to "scored with …" and "leg wide|straight|slim|unknown"
```
When W starts (service): at the first `slotFound` event for `bottom` whose `garment.subcategory` is in `LOOK_W_PANTS`, else at the `reading` event if its bottom is; never for shorts, skirts, no bottom, a re-check whose first check had no W, a demo photo, or without consent (same gate as U/L). Image: `lookImages(zoom).W`. Tag: the check's own id. One attempt, no retry, `LOOK_TIMEOUT_MS`. Cost line: `lookCents` (about 0.21¢).

### App: scoring and the season (`features/fitcheck/scoring.ts`, `service.ts`)
```ts
export interface EvaluateInput { /* …as today… */
  /** A warm day. v16: also the season the score uses ("warm" when true, cool otherwise). */
  warm?: boolean;
  /** The row's rubricVersion: the parts engine (partsEngineFor) the score, fixes and tap use. Default: PARTS_RUBRIC_VERSION. */
  partsVersion?: string;
}
export function scoreOptions(input: Pick<EvaluateInput, 'occasion' | 'styles' | 'boldness' | 'secondLook' | 'warm'>): CheckScoreOptions;  // season: 'warm' when warm, else omitted
export function overallFor(reading: Reading, opts: ScoreOptions, engine?: ScoringEngine, partsVersion?: string): number | null;
export function evaluateCheck(input: EvaluateInput): Evaluation;   // row.rubricVersion = the version it scored with; details.parts.v16 set on v16
export function storedParts(res: PartsScored, fx: PartsFixSuggestions): StoredParts;   // copies res.v16
export function loungeHolds(res: PartsScored): boolean;   // v16: v16.heldBy === 'occasion' && occasion.status starts with 'loungewear'

// service.ts
export function lensInput(occasion: OccasionKey, style: StyleKey | null, p: Profile, look?: StoredSecondLook | null, warm?: boolean);
```
- **The season of a check** (`seasonOf(row)` inside the service): `row.details.warm` once set (it is set at the check's first score and never recomputed); before that, `warmFor(row)` as today (the card's weather for that slot: feels-like low ≥ 65°F, `weatherNeeds().layer === 'none'`; with no weather, the month: May–September). Every later score of the row (an answer, a correction, the occasion, Going for, the quick tap's two scores, its re-check's outcome) uses it. A new check of a photo already scored copies the earlier check's `details.warm` with its reading and second look.
- **graded look:** nothing in the app passes `gradedLook`. Neither `goingFor` nor the profile's picks ever reach it.

### App: words and bands (`design-system/tokens.ts`, `score.ts`)
```ts
export type ScoreWord = 'Redo' /* placeholder key for the 3–4.5 word, see Q-W1 */ | 'Needs a fix' | 'Getting there' | 'Put together' | 'Sharp' | 'Dialed in';
export const scoreBands: readonly { min: number; word: ScoreWord; label: string }[];
// [{ min: -Infinity, '3–4.5' }, { min: 5.0, 'Needs a fix', '5–5.5' }, { min: 6.0, 'Getting there', '6–6.5' },
//  { min: 7.0, 'Put together', '7–7.5' }, { min: 8.0, 'Sharp', '8–8.5' }, { min: 9.0, 'Dialed in', '9–9.5' }]
export const scoreMax = 9.5;                       // unchanged
export function scoreWord(x: number): ScoreWord;   // from the score rounded to the half, as today
export function scoreBandIndex(x: number): number; // 0…5 now
export function scoreWordLabel(x: number): string; // t('score.word.redo') for 3–4.5
```
Copy key: `score.word.redo` (the word itself is Q-W1; until he picks, the deck carries `TBD (Q-W1)` and the build doesn't ship).

### App: Why (`features/why/partsRows.ts`)
```ts
export interface PartsInput { /* …as today… */ v16?: PartsV16 }
export function whyParts(res: PartsInput, opts: { occasion: OccasionKey; readsAs: StyleKey | null; gainPart: PartName | null }): WhyParts;
export interface WhyParts { strip; groups; average: number; after: WhyRow[]; total: number; stripLabel: string;
  /** v16: the first row of the after-list ("starts at 7.0"); absent on v15 (the Average row stays). */ start?: WhyRow }
```
On a v16 result, `after` holds, in this order, with these keys (a row appears only when its amount isn't 0, except `condition`, `readsAs` and `rounding`, which follow today's rules):
`lift-<i>` (one per `v16.lifts`, amount = size) · `minor` (+minor) · `faults` (−faultDrop) · `condition` (−condDeduction; the clean row at ±0 as today) · `occasion` (−occasion.deduction) · `heavy` (−heavyLayer[0], warm days) · `taste-<i>` (one per `v16.taste`, amount = points) · `clampTop` (raw − rawUnclamped when rawUnclamped > 9.5: **the 9.5 row**) · `clampBottom` (raw − rawUnclamped when rawUnclamped < 3.0) · `curve` (curved − raw) · `ceiling` (final − curved, whenever heldBy isn't null; rule by what bound: a cap id → **the dealbreaker row**, item = that cap's line; a stack ceiling; the fit-is-the-floor ceiling; two sinks; two holds; `"occasion"` → the occasion's label with `occasion.status` as the item. The `occasion` row above carries only the pre-curve deduction) · `readsAs` (±0, as today) · `rounding` (overall − the sum so far). Never a `floor`, `bonus`, `piled` or `average` row on v16. `start` = 7.0. A v15 stored check (no `v16`) gets exactly today's rows.

`PartsBreakdown.tsx`: on v16 the first row is `start` (value "7.0") in place of "Average of the parts"; each `LedgerRow` gets `testID={`why-row-${key}`}` (`why-row-start` for the start row).

### Demo screens (new; layout only, made-up readings, scored live by the engine)
| n | Name | Shows |
|---|---|---|
| 300 | Result · 3.5 | the result card for a made-up reading v16 scores 3.5 (two sinks and faults, e.g. a stained oversized hoodie over skinny jeans with three brights; the implementer confirms the number with the engine and writes the reading in the scenario) |
| 301 | Result · 5.5 | a grey hoodie over black skinny jeans, white leather sneakers (DB-S1: 5.5) |
| 302 | Result · 7.0 | a plain white tee, dark straight jeans, white leather sneakers (7.0) |
| 303 | Result · 8.5 | a boxy white tee tucked into charcoal wide trousers, black loafers (8.5) |
| 304 | Result · 9.0 (the top) | a boxy black tee tucked into charcoal wide trousers, a burgundy cardigan, black loafers (9.0; raw clamped at 9.5, so its Why shows the 9.5 row) |
| 305–309 | Why · each of the above | the Why sheet over 300–304, scrolled to the after-rows |
| 310 | Why · an old v15 check | a check stored before T69 (`rubricVersion "parts-1.14.0"`, scored by the v15 engine, floored at Everyday, so it has the floor row): today's rows, unchanged. The seed's checks are all v4.1 (`"4.0.0"`), so no existing screen shows a stored v15 check |
The coordinator asked for 9.5; it can't be reached (Q-F1), so 304 shows the real top.

## Steps
0. **Baselines first, before any change** (the test writer and the implementer both rely on them): record the sha256 of the expanded v15 slice of `parts_parity.json` (every case without `tune`, pool references resolved, in order), of `parts_fixes.json`'s cases and of `rules_conformance.json`'s cases, all at commit `a2480b09`; record `PARTS_DATA.tune` at that commit as `rollback15`'s expected tune. Check `top -l 1 | grep PhysMem` before each Python run; never next to `npm run check`.
1. **Python, output-only:** the four new result keys and the relabel (Files). Re-run `v16_paper.py` (KITTED_DATA set; $0) and confirm every number in `results/v16/report.txt` is unchanged except the label; `graded_look_check.py` passes; `steadiness.py` gives 215 / 218 / 217.
2. **`make_parts_json.py`** → `parts.json` (2.0.0, v16, rollback15, the v16 tables) → `node app/packages/kitted-core/scripts/gen-rubric-data.mjs` → `partsData.ts`.
3. **The port in `parts.ts`:** `_OFF16` defaults in every older tune (the TS reads them); `TUNE.v16` with `taste`; `is_tailored`, `graded_looks`, `_look_val`, `_v16_lifts`, `_v16_caps`, `_v16_depends`, `_v16_curve`, `_v16_taste` (the leg-look tie-break and replace modes, leg_look_global, the PN1 overrule, SIL in all four modes, the waivers, the one-lift rule, the taste items), `v16_finish`, `_v16_result`; the v16 hooks inside v15 code (CC2's nuance, COL-12 and TK1 on warm days, STY-3 off, STY-9 on warm days); in `scoreParts`: `season` and `gradedLook`, and the steady-class rewrite right after `_refile(_normalize(...))` (never on a bottom when a tailored jacket is in view). Same operation order as Python wherever a float is summed (the existing parity rules at the top of `parts.ts`). Then `RESCORE_V16`, `setRescoreV16`, `partsDataFor`'s third argument, `partsEngineFor`, `PARTS_RUBRIC_VERSION`.
4. **Fixtures, in this order, from the Python engine only** (never edited by hand): `make_parts_parity.py` → `parts_parity.json` (v16 configs: the corpus, the pinned pull and the edge cases at cool and warm; `graded_look` for each of the 9 looks and one mix (`["streetwear", "tailored"]`) on the edge cases; second looks with `knee`/`opening` (every one of the 4 × 4 answers, and none) on edge readings in jeans, trousers, wide/straight/relaxed/slim/skinny and on shorts; the steady-class swaps (an oxford, a Chelsea boot, an "other" shoe, an oxford under a blazer, chinos with a blazer); the 15 named outfits of `v16_paper.NAMED` at cool and warm with their own profile, occasion and second look as `run_named` scores them; `v16_whatif` tunes with the off-by-default knobs on (leg_look_mode "replace" and "off", leg_look_global, accent_by_look, accent_agree, pn1_look, sil_mode "single", "top_up" and "shape", long_top_read "ruler", shorts 0.5, color 0.5, h7_tip false, v16_h9_cap true); and the generator asserts picks never move a v16 number) → `make_parts_fixes.py` → `parts_fixes.json` (v16 cases cool and warm) → `rules_conformance.py` → `rules_conformance.json` (v16 cases, below) → `make_parts_steadiness.py` → `parts_steadiness.json`.
5. **Core: fixes, tap, re-check** take the engine and season (Interfaces). Run the core tests (`npm test --workspace @kitted/core` from `app/`).
6. **The leg-width look in the app** (Interfaces, "When W starts"), the assets and their sync test.
7. **Season and engine routing** in `scoring.ts` / `service.ts` (Interfaces). `details.warm` written once at the first score.
8. **Why rows** (`partsRows.ts`, `PartsBreakdown.tsx`), **the 3–4.5 band** (`tokens.ts`, `score.ts`, the deck key, `gen-en.mjs`), the new `pwhy.*` keys in `en.ts` (words per Q-W2, placeholders `TBD` until he picks).
9. **Demo screens 300–309.**
10. `npm run check` in `app/` on its own (memory first). Existing tests that assert a v15 number on a default scoring path will go red when the switch flips: each goes to the test writer as a dispute (spec-driven: pin it to v15 with `setRescoreV16(false)` when it tests something other than the score, or move it to the v16 number from the engine when it tests the score), recorded in TASK.md → Disputes. The implementer never edits a test.
11. Screenshots (the verifier): 300–309 light and dark, and 304 and 309 at the largest text size.

### Rules conformance: the v16 cases to add (each case's expected values come from running the engine, then checked against the doc line; where they disagree, the case asserts the engine and names the open question)
- New IDs the doc check requires (`\*\*\[([A-Z]{3}-\d+)\]`): SCO-8, SCO-9, SCO-10, LFT-1, LFT-2, LFT-3, LFT-5, LFT-6, LFT-7, STY-13, TST-0.
- Rewritten for v16 (a v16 case beside the kept v15 ones): SCO-1 (plain basics 7.0), SCO-2 (stacking: the boxy tee example 8.5; a fit fault holds 7.5), SCO-3 (no floor: a sub-5 outfit at Everyday isn't lifted; nothing under 3.0), SCO-4 (picks move nothing, with v16 taste on), SCO-7 (the loud print 6.0; the skinny example as the engine gives it, 5.5, Q-F2), STY-3 (a blazer with light wide jeans: no H3 charge), STY-9 (a tank alone: charged cool, not warm), COL-2 (two brights beside a neutral: a tip, not a charge), COL-12 (light on light: not charged warm).
- The sub-IDs the regex doesn't see, as cases all the same (named in the case's `rule` with the doc's spelling): every DB row in `v16_paper.SINKS_HOLDS` at its cap, `SPARED` not capped, `DEPENDS` between 5.5 and 7.0 with the weak one below the strong one; LFT-4s, LFT-S, SL-1; TST-a, TST-c, TST-e, TST-j, TST-sk, TST-SIL, TST-leg, TST-st, TST-sd, TST-rn, TST-mix; and `graded_look_check.py`'s cases (TL1.1–TL1.6, graded_look moves the taste rules, picks never move a score, same photo + same look = same score).

## Data
- **`parts_steadiness.json`** (new): `{ about, parts_version, parts_proto_sha256, profile: [["minimalist", 0.5], ["smart_casual", 0.5]], occasion: "everyday", boldness: "a_little", season: null, photos: [{ id, readings: [r0, r1], leg: [w0 | null, w1 | null], ul: [ul0 | null, ul1 | null] }], python: { steady_leg: 218, steady_none: 215, steady_all: 217, total: 223, scores_leg: { [id]: [s0, s1] } } }` for every gold photo with two stored readings that both score (223). From `KITTED_DATA`'s `extraction-test/results/gold1/raw.json` (untracked in the main checkout), `results/leg-look1/raw.json` and `results/gold-looks1/raw.json`, run for run (reading i with its own looks, as `steadiness.py`). Readings are garment descriptions only (no photo, no judge text, no ratings). **Risky:** this commits the gold set's readings for the first time; see Q-T5.
- **The check row:** `details.warm` (existing field) becomes the season record; `details.secondLook.w`; `details.parts.v16`; `rubricVersion` `parts-2.0.0` on new checks. No migration: rows without them read as today (v15, cool, no W).

## Must not break
- v15 numbers, exactly: every untagged case in `parts_parity.json`, every v15 case in `parts_fixes.json`, the 501 v15 conformance cases, and, with `setRescoreV16(false)`, every default path. Old stored checks keep their scores and, when edited, their engine (`partsEngineFor`).
- "The AI sees, the code judges": W only describes the pants; the engine reads it; no AI call is added to the score path beyond W. W never sends anything but the face-hidden lower close-up L already sends, never without consent, never for a demo photo, and never holds up or fails a check.
- His picks, Going for, his name, age band, height, build and fit never reach a number (the existing UN1 test, `aboutYouCard.test.ts`, stays green).
- The one quick tap's two scores equal what the card then shows; "Not quite right?"'s preview equals the saved number (#276); a re-check's two numbers are scored alike.
- Why's rows add up on v15 checks exactly as today.
- No new npm package, no live AI call, no spend.

## The founder's answers (Nov 17, in chat)
- **Q-W1:** the 3–4.5 word is **"Start fresh"** (`score.word.redo` = "Start fresh").
- **Q-W2 and Q-W3:** "Yes, use them": the Why labels as recommended below, and the L7b verb fixed ("the trousers dress up…"), text only.
- **Q-F1: 9.0 stays the top for now.** First he asked for "the max should be around 9.5 and not capped at 9"; the $0 paper study (`tasks/T69/top-of-scale.md`) found the curve alone gets no outfit to 9.5 (the stacking rule holds the top) and only a stacking change (B+D) opens it, rarely. His answer: "if we can only get fits to 9.5 artificially, then lets stay at 9. we will update that in the future". So v16 ports exactly as approved; screen 304 shows 9.0. The study's knobs (`raw_cap`, `curve_knee`, `stack_clean`, in `_OFF16`, off) are what-if knobs like the others: ported and proven by parity per Q-T7, never on by default.
- **Q-F2 and Q-F3:** "Yes, fix both": done by the coordinator ([SCO-7]'s example now 5.5; `specs/tailored.md` notes the taste rules follow the graded look).
- **Q-F4, Q-F5, Q-W4:** the defaults stand (the same photo keeps its first season; no card line; part groups kept), each a reading of the spec as written, not a change.

## Open questions
**For the founder (taste, words, money):**
- **Q-F1 · The top of the scale.** The approved curve makes 9.0 the highest score a real check can get; 9.5 needs a raw above the clamp, which the clamp forbids. *Recommended:* ship v16 exactly as approved (9.0 is the top for now; "Dialed in" still shows at 9.0), and decide in a later engine round whether the curve's top should reach 9.5. Changing it now would move every high score and redo T68's steadiness count.
- **Q-F2 · [SCO-7]'s example.** The rulebook says the skinny-jeans example lands at 6.0; v16 gives 5.5 (his [TST-sk] skinny charge stacks on it). *Recommended:* change the doc's example to 5.5 (the engine is what you approved); nothing in the code changes.
- **Q-F3 · Tailored and scores.** `specs/tailored.md` says Tailored changes no score; v16 (your #484 yes) uses it for the taste rules. *Recommended:* add one line to `specs/tailored.md` that since v16 the taste rules follow the graded look, Tailored included.
- **Q-F4 · F2.1 and the season.** The same photo sent on a warm day and again on a cool day: *recommended* the same score (it keeps the first check's season, so F2.1 holds as written); the other choice is a new score for the new day, which breaks F2.1's "same photo, same score".
- **Q-F5 · "Scored for a warm day" on the card** (#464 left it for your yes). *Recommended:* not in T69 (the Why sheet's heavy-layer row already says it when it costs); a one-line card note later if testers ask why a score differs in summer.
- **Q-W1 · The 3–4.5 word.** Next to the number, like "Needs a fix". Options: **"Start fresh"** (recommended: says redo without an insult), "Rebuild it", "Not working yet". No all-caps, no emoji.
- **Q-W2 · Why's new row labels** (recommendations in quotes; `{…}` filled by code):
  - the start row: "Every fit starts at" · 7.0
  - a lift: the engine's own line, capitalized (e.g. "A tucked or short top over a full leg gives it a waist")
  - small credits: "Small credits in the parts"
  - faults: "What's off" · item "the worst part counts most"
  - the heavy layer, a taste rule: the engine's line, capitalized; a taste row's item "for {look}" (e.g. "Wide legs · for streetwear")
  - the 9.5 row: "Top of the scale: 9.5" · the bottom clamp: "Bottom of the scale: 3.0"
  - the curve: "Kitted's scale" · item "steps above 7 count less"
  - the dealbreaker row: "Dealbreaker" · item = the cap's line (e.g. "three bright colors at once: keep one, make the rest neutral")
  - the stack ceiling: "The most {n} lifts reach" (item "{ceiling}") · the fit floor: "A fit or shape fault: lifts can't cover it" · two sinks: "Two dealbreakers: a redo" · two holds: "Two holding faults"
- **Q-W3 · The engine's new lines are words he'll read in Why** (approved with the engine, but never read as copy). One reads wrong: "the trousers dresses up the casual pieces: one smart piece, done right" (L7b, plural subject). *Recommended:* fix the verb in `parts_proto.py` before the fixtures are made (text only, no number moves), and skim the rest in the Why screenshots.
- **Q-W4 · Part groups in v16's Why.** The parts still show "7 + its reasons", but the score is now 7 + lifts − faults, not their average, so a lift can show twice (in its part, then as a lift row at its stacked size). *Recommended:* keep the groups as they are for the beta and judge from the screenshots.

**Technical defaults (the coordinator logs them; no founder call needed):**
- **Q-T1 · Old checks keep v15** on every edit, re-check and tap (`partsEngineFor`), following #209 and [SCO-9]. The earlier parts updates (v14, v15) instead re-scored an edited old check with the new engine; v16 moves scores too much for that.
- **Q-T2 · Python stays v15 by default;** fixtures keep v15 untagged and v16 tagged `"tune": "v16"`. This keeps v15 byte-identical without touching 28,096 case records.
- **Q-T3 · Output-only Python keys** (`average_unrounded`, `raw_unrounded`, `v16.raw_unclamped`, `v16.cond_deduction`) and the relabel. Needed for exact parity and for Why to add up; no number moves (step 1 proves it).
- **Q-T4 · W starts once the bottom is known to be pants** (the stream's bottom slot, else the reading), with the same 1.5 s grace from the reading. No spend on checks without pants, as approved ("+0.21¢ on checks in pants"). Cost of the choice: W can be late more often than U/L (they start with the read); a late W scores without it, which makes the app's steadiness a little lower than T68's 218. Starting W with the read on every check would spend about 0.21¢ on non-pants checks too (a money call; not chosen).
- **Q-T5 · The B6 fixture commits 446 gold readings** (garment JSON only). `results/gold1/raw.json` is untracked, not ignored, in the main checkout, and the leg and U/L looks for the same photos are already tracked. If the coordinator says no, the B6 test can't run in CI and drops to a Mac-only script (the test would then be "not verified" in CI).
- **Q-T6 · The pull is pinned** in `make_parts_parity.py` to the one the current fixture names, so "v15 byte-identical" compares the same inputs (the newest pull is now 20261024-153001).
- **Q-T7 · Every v16 what-if branch is ported and proven** (the precedent for every earlier engine), not only the shipped knobs.
- **Q-T8 · `core/scoreWords.ts` stays the v4.1 port** (its Python twin feeds `expected_scores.json`); the app's word table is `design-system`'s.
- **Q-T9 · Season everywhere else is cool** (the morning card's ideas, the chat's outfit judge, `allowedColors`, the closet's outfits): they score with no weather today; T64 rebuilds the card's picks.
- **Q-T10 · The 3–4.5 redo card** (the swaps that clear every dealbreaker, #464) isn't T69: F2.8 changes through the specs when he picks the word.

## Risky in this lane
- **Existing tests go red when the switch flips.** Many app tests assert numbers from the default scoring path (demo readings, seed, the Example check, Going for, the one quick tap). Each needs a ruled dispute, so budget the test writer's time; the hook keeps the implementer out of them.
- **Parity size and run time:** `parts_parity.json` is 22 MB with 28,096 cases; the v16 configs add a few thousand. The parity test stops at 20 mismatches; keep it that way.
- **Memory:** the Mac had 160 MB free during planning. The Python fixture runs and `npm run check` must not overlap each other or a Simulator.
- **Worktree core:** `app/node_modules` here is a folder of symlinks with `@kitted/core` → this worktree's core; never commit either. Typecheck HEAD alone with `npx tsc --noEmit -p app/packages/kitted-core` (build notes #127, #358).
- **DECISIONS-LOG numbering:** #490 on this branch is already marked "renumber at merge".

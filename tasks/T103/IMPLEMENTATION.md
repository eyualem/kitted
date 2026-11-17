# T103 · The colors the scoring rules allow

**From:** `plan.md` → T103 (Kit's stylist chat lane, borrowing core from the Fit check and scoring lane) · **Spec:** `specs/kit-stylist-chat.md` → KC3.3 (approved by the founder 2026-11-17), with KC3 and KC11.2 as context · **Size:** strict (it reads `@kitted/core`'s scoring) · **After:** T100 (done, PR #130).

`specs.md` and the spec don't disagree on anything this task touches. `specs.md` has no color list of its own. The spec says "25 named colors" (KC2.2, KC3.3); see Open questions → D2 for the one place this plan lists 24.

## Goal
One new pure function in `@kitted/core`: given an outfit's other pieces and the piece being asked about, it returns which of the app's color families the scoring rules would not mark down on that piece. Nothing in the app calls it yet: T105 hands the list to Kit as evidence and gates the model's answer against it. No score moves; the parity tests stay 100%.

## How it decides (the one idea; read before the steps)
The rules live in the engine, in `parts.ts` (the live scorer, `defaultParts`, which follows the CASUAL_FITS_V14 and HOODIE_LAYER_V15 switches). The new file **does not copy any rule**. It asks the engine, once per color:

1. Put the piece in each of the 24 colors (below), build the outfit the way `outfitReading` already does for `swapOptions` and `outfitValid` (a full-body, fully clothed reading), and call `scoreParts`.
2. A color's **cost** is the sum of the points the engine took off, over every reason with negative `points` in every part of the result (Proportions, Fit, Color, Shoes, Style). Counting every part, not only Color, is what catches a second bright piece (Style: "too many statements") and a loud shoe (Shoes), not just "two bright colors fighting".
3. The **best cost** is the lowest cost over the 24 colors. A color is **allowed** when its cost is within 1e-9 of the best cost.

Why "best" and not "zero": if the other pieces already carry a fault (a navy blazer over black trousers is marked down no matter what top goes with it), no color is to blame for it. The list then holds the colors that add nothing to what is already there, so the list is never empty because of someone else's fault. When the others carry no fault, the best cost is 0 and "allowed" means "no deduction at all".

The cost is a float sum; two colors that cost 0.1 + 0.2 and 0.3 are equal (the 1e-9 tolerance).

## Files
Only these. Anything else is a deviation the implementer writes in TASK.md.
- `app/packages/kitted-core/src/allowedColors.ts` (new): the function, its input type and the palette constant.
- `app/packages/kitted-core/test/allowedColors.test.ts` (new, written and locked by the test writer from TESTING.md).
- `app/packages/kitted-core/src/index.ts` (shared with every core task; edit it as one added line, with `git add -p`): `export { allowedColors, COLOR_CHOICES, type AllowedColorsInput, type AllowedColorsEngines } from "./allowedColors";`

Not touched (the reviewer checks the diff): every other file in `src/`, `rubricData.ts`, `partsData.ts`, `partsFixesData.ts`, `handoff/fixtures/`, `extraction-test/`, anything under `app/src/` (T101 works in `features/closet/`, T102 in `features/ask/`). No new package.

Lane check: the plan line lists "core (a new file and its tests)". The one export line in `index.ts` is the only way the app can import the function; it is inside core. Nothing else is outside the lane.

## Interfaces
What the tests call. The test writer reads only this section and TESTING.md.

All in `app/packages/kitted-core/src/allowedColors.ts`, exported from `@kitted/core`'s `index.ts` (tests import from `../src/index`, like the other core tests).

```ts
import type { Boldness, ColorFamily, Garment, Loose } from "./types";
import type { PartsEngine } from "./parts";

/** The 24 families a color can be proposed in: the app's palette order (the key order of FAMILY_HEX in closetColor.ts) without "multicolor". */
export const COLOR_CHOICES: readonly ColorFamily[];
// = white, off_white_cream, light_grey, grey, charcoal, black, navy, light_blue, blue, denim_light, denim_mid, denim_dark,
//   olive, green, sage, khaki_beige, tan_camel, brown, burgundy, red, orange, yellow, pink, purple

export interface AllowedColorsInput {
  /** The outfit's other pieces, as garments (a closet piece's `garment`, a check reading's garments, a drawn piece described as a garment). May be empty. */
  others: readonly Garment[];
  /** The piece being asked about: `category` and `subcategory` say what it is; `pattern`, `pattern_scale`, `logo`, `volume`, `leg_shape` and the rest are used as given.
   *  Its `color_family` and `saturation` are ignored (they describe the old color). */
  piece: Garment;
  /** Default "everyday". Passed to the engine as is. */
  occasion?: string;
  /** Default "a_little". Passed to the engine as is (a bold man's list differs: see TESTING). */
  boldness?: Loose<Boldness>;
}

export interface AllowedColorsEngines {
  /** Default `defaultParts` (so the list follows the app's scoring switches). Tests pass a stand-in. */
  parts?: PartsEngine;
}

/** The families the scoring rules would not mark down on `piece` in this outfit, in COLOR_CHOICES order, no duplicates. Never throws. */
export function allowedColors(input: AllowedColorsInput, engines?: AllowedColorsEngines): ColorFamily[];
```

Behaviour, exactly:
1. **Candidates.** For each `c` in `COLOR_CHOICES`: a copy of `piece` with `color_family: c` and no `saturation` (a color is judged as the app names it, so blue and green are never "bright" here; every other field kept). Inputs are never mutated (the tests freeze them).
2. **The outfit.** `outfitReading` (from `rotation.ts`) of `[...others, candidate]`, the candidate **last**, each wrapped as `{ id: String(i), name: "", slot: String(garment.category ?? ""), garment }` (`outfitReading` reads only `garment`). Others keep every field they carry, saturation included.
3. **Scoring.** `(engines?.parts ?? defaultParts).scoreParts(reading, { occasion, boldness })`: exactly those two options, no `styles`, no `secondLook`. One call per candidate, 24 in all, and none for "multicolor".
4. **Cost.** If `result.overall === null` the cost is 0. Otherwise it is `-(sum of reason.points)` over every reason with `points < 0` in every entry of `result.parts` (an entry may be missing). The function reads nothing else from the result: only `overall`, `parts[k]` and `parts[k].reasons[i].points`. A stand-in engine in a test supplies exactly those.
5. **Allowed** = the candidates whose cost is `<= bestCost + 1e-9`, where `bestCost` is the minimum cost. Returned in `COLOR_CHOICES` order. At least one color is always returned (the best one), unless step 6 applies.
6. **Failure.** If `scoreParts` throws for any candidate, return `[]` (fail closed: no colors card, the words still answer). Never rethrow.
7. A piece the rules don't score (an accessory such as a belt, a "traditional" piece) is left out by the engine, so every candidate costs the same and the result is all 24 colors. Accessories among `others` change nothing. No special-case code for either. See D6.
8. No outfit around the piece (`others` empty): the engine has fewer than two pieces to judge, nothing is marked down, the result is all 24. No special-case code.

Speed: one call is 24 `scoreParts` runs; measured on a prototype at about 1.5 ms per call. No caching needed.

## Steps
1. Create `allowedColors.ts` per the Interfaces. Import `FAMILY_HEX` from `./closetColor` to build `COLOR_CHOICES` (`Object.keys(FAMILY_HEX).filter(f => f !== "multicolor")`), so the palette has one source. Import `defaultParts` and `outfitReading`; add no rule tables, no color lists of "neutrals" or "brights", no check IDs. If you find yourself writing `"red"` or `"CC2_..."`, stop: the engine decides.
2. Add the one export line to `index.ts`.
3. Run the locked tests: `npx vitest run test/allowedColors.test.ts` from `app/packages/kitted-core` (see How to run). Then the whole core suite (parity included).
4. `npm run check` in `app/` on its own.

## How to run (a trap in this worktree)
The worktree has no `node_modules`. If you borrow the main checkout's by symlink, the app's jest resolves `@kitted/core` to the **main checkout's** core, not this worktree's (CLAUDE.md, coding traps). The core tests are safe: they import `../src/index` by relative path, so run them from `app/packages/kitted-core` with `npx vitest run`. Do not judge this task by an app jest test.

## Data changes
None. No stored field, no fixture, no rule number, no copy, no server.

## Must not break
- **Same photo, same score.** No file of the engine, its data or the fixtures changes; `parts.parity`, `rubric.parity`, `partsFixes.parity` and the rest of the core suite pass exactly as before (100%).
- Calling the function leaves the engine untouched: no shared state is written (not `defaultParts`, not `RUBRIC_DATA`, not `PARTS_DATA`), and a score computed after a call equals the score computed before it.
- `index.ts` keeps every export it has.

## Open questions

### For the founder
None. The function shows no word to a user. The words Kit says about colors (the header `Goes with olive`, color names) are T104 and T105's, and the color names are the app's existing `FAMILY_WORD`.

### Technical defaults (the coordinator logs these)
- **D1 · What "marked down" means.** Any deduction in any part, however small, that the best color doesn't also take. A color that costs 0.5 (the second statement piece) is out. Alternative: only Color's own faults, or only deductions of 1 or more. Why this default: KC3.3 says "would not mark down", and the point of the list is that the gate can be absolute.
- **D2 · 24 colors, not 25.** The 25th family, `multicolor`, is the reading's label for a print with several colors, not a color one buys or draws as one swatch (its swatch is a grey placeholder). It is never in the list and never sent to the engine. If the founder wants it, remove one filter in `COLOR_CHOICES`. This is a literal difference from the spec's "25"; the coordinator should tell the founder in one line.
- **D3 · Judged against the best color, not against zero.** See How it decides. A fault the other pieces carry is nobody's to fix, so the list is never empty because of it. Cost: when the others already carry a fault, a color that piles on the same flat charge (a fourth accent on three) is still listed. T105 can show the model the outfit's own fault as a line if it matters.
- **D4 · The piece's own color and saturation are dropped, the others' kept.** The candidate's saturation isn't known for a hypothetical piece; the others' is what the photo or closet read.
- **D5 · `occasion` and `boldness` are inputs** (defaults everyday and a_little). Today's check passes its own occasion; the chat passes `everyday`. `styles` is not an input: his picks never change a number.
- **D6 · Accessories and "traditional" pieces get all 24.** The engine leaves them out (KC9.2 says accessories never affect a score), so the honest answer to "which colors would the rules mark down" is none. The spec's hard line (traditional clothing is "not rated") is the caller's to honour: T105 must not ask for a color list for a piece it won't comment on.
- **D7 · Failure returns `[]`,** never an error and never "all colors".
- **D8 · No kind filter.** The list is what the rules allow, not what a person would wear: a tee can be listed in `denim_dark`. Picking a sensible color from the list is the model's job and the card's check (T105).

## Risks in this lane
- **Most lists are long** (19 to 24 of 24 in the tests; the shortest in the prototype was 17). The rules allow far more than a stylist would say. KC3.3's "fewer than 2 survive" will almost never fire; the list is a ceiling for the gate, not advice. T105's prompt must still ask for a good pick.
- **The list moves when the rules move.** That is the point (no second copy). A parts or switch change that alters a deduction changes some lists; the tests that pin exact lists are then updated in the same PR as the rule change.
- **A reason that costs points for a non-color cause can differ between colors only through the engine's own color-dependent logic** (style detection by palette, for one). Those are counted on purpose: they are the rules marking that color down.
- **`index.ts` is shared.** One added line, staged with `git add -p`; other sessions in the lane (T101, T102) don't touch core.

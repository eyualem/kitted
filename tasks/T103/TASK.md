# T103 · Task record

## Built
`allowedColors` in `app/packages/kitted-core/src/allowedColors.ts`, with `COLOR_CHOICES` (the 24 palette families, `multicolor` left out, taken from `FAMILY_HEX`'s keys). For each color it puts the piece in that color (old color and saturation dropped), builds the outfit with `outfitReading` (candidate last), asks the live engine (`defaultParts.scoreParts`, only `occasion` and `boldness` as options) and adds up every negative reason point over every part. The allowed colors are those within 1e-9 of the cheapest. An unscored result costs 0. If the engine throws, it returns `[]`. No rule, color list or check ID is copied; inputs are never mutated.

The export line in `index.ts` was already there from the test-writing step.

## Files
- `app/packages/kitted-core/src/allowedColors.ts` (the stub filled in)

## Deviations
None.

## Results
- `npx vitest run test/allowedColors.test.ts`: 35 of 35 pass.
- Whole core suite (parity included): 31 files, 888 tests pass (853 existing + 35 new).
- `npm run check` in `app/`: passes (tsc, core typecheck, lint, core tests, app jest 1968 passed, 4 skipped).
- Not verified: speed on a phone; real-photo readings (see TESTING.md, Not testable yet).

## Disputes
None.

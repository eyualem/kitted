# why-button (tiny)

The founder, Nov 18 (voice): the Why rating should be "a button alongside whatever other button is right next to it." He picked **option A** of `design.html` (same row).

## What was built
- **First-check card** (`FitCheckCard.tsx`): one row, `Re-check after fixing` (the one primary) and `Why 7.0?` (secondary) share the width. With no Re-check (no fix, 9+, window closed) `Why` is the lone full-width secondary. The old separate full-width Why row under the doubt line is gone.
- **Re-check card** (`RecheckCard.tsx`): `Why 8.0?` and `Not quite right?` are two secondary buttons side by side (they were text links). `Didn't catch the change? Tell me` stays a quiet link under them. Past chats' Why is a full-width secondary button (was a link).
- Both rows `flexWrap`: when larger text won't fit two buttons, each takes its own line.
- **While the Share icon shows (until T67 cuts share cards)** on a 7.0+ first check, the icon takes 44 pt of the row, so Re-check and Why can't sit side by side (found on the Simulator): Re-check keeps the row with the icon and Why drops to its own full-width line below, as before. The side-by-side row shows on checks under 7.0 and on every check once T67 lands.
- No new words; `specs/explain-rating.md` items 6 (result card) and 3 (re-check card) say "beside Re-check" / "a secondary button"; log #513.

## Deviation from the drawn option A (founder OK'd, Nov 18: "Yes, drop it")
The mockup showed an info icon on Why. At 393 pt the card's inner width is 329 pt; Re-check (about 204 pt with its icon) plus an icon-bearing Why (about 118 pt) is 330 pt, one point too wide, so the row wrapped back into two stacked buttons. Why has no icon now (about 96 pt): the row is about 308 pt and fits at 393 pt. On a 375 pt phone (311 pt inside) it is tight and falls back to stacked, which is still fine.

## Checks
- `stepFourBatch` G15.1 (a source test of the re-check card's buttons) rewritten to the new layout; related suites (`chatUi`, `stepFourBatch`, `T35-hello`, `T39-offerCard`, `fitLine`) pass.
- Screenshots: `shots/` (web preview, 393 pt, light and dark: first-check and re-check cards). The web preview does not draw icons and uses a wider fallback font than iOS; iOS is the truth.
- iOS Simulator (iPhone 17 Pro, Metro from this branch), `shots/ios/`:
  - `row-light.png`, `row-dark.png`: Re-check after fixing and Why in one row (5.5 and 3.5 checks).
  - `row-largest-text-light.png`: accessibility-extra-extra-extra-large, the row wraps to one button per line.
  - `row-375pt-light.png`: iPhone SE (375 pt, a temporary Simulator, deleted after): the two don't fit, so they stack (as predicted); fine.
  - `lone-why-light.png`, `lone-why-dark.png`: a 9.0 check with no fix: Why alone, full width (under the Share icon, which shows on this build).
  - `recheck-light.png`, `recheck-dark.png`: Why and Not quite right? side by side, under Share the before and after.
- Not verified: Past chats' Why (no demo screen has a past re-check card; it is a one-line full-width button on the same code path), VoiceOver, largest text in dark, the 375 pt row in dark.

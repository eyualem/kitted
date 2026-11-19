# why-button (tiny)

The founder, Nov 18 (voice): the Why rating should be "a button alongside whatever other button is right next to it." He picked **option A** of `design.html` (same row).

## What was built
- **First-check card** (`FitCheckCard.tsx`): one row, `Re-check after fixing` (the one primary) and `Why 7.0?` (secondary) share the width. With no Re-check (no fix, 9+, window closed) `Why` is the lone full-width secondary. The old separate full-width Why row under the doubt line is gone.
- **Re-check card** (`RecheckCard.tsx`): `Why 8.0?` and `Not quite right?` are two secondary buttons side by side (they were text links). `Didn't catch the change? Tell me` stays a quiet link under them. Past chats' Why is a full-width secondary button (was a link).
- Both rows `flexWrap`: when larger text won't fit two buttons, each takes its own line.
- No new words; `specs/explain-rating.md` items 6 (result card) and 3 (re-check card) say "beside Re-check" / "a secondary button"; log #508.

## Deviation from the drawn option A
The mockup showed an info icon on Why. At 393 pt the card's inner width is 329 pt; Re-check (about 204 pt with its icon) plus an icon-bearing Why (about 118 pt) is 330 pt, one point too wide, so the row wrapped back into two stacked buttons. Why has no icon now (about 96 pt): the row is about 308 pt and fits at 393 pt. On a 375 pt phone (311 pt inside) it is tight and falls back to stacked, which is still fine.

## Checks
- `stepFourBatch` G15.1 (a source test of the re-check card's buttons) rewritten to the new layout; related suites (`chatUi`, `stepFourBatch`, `T35-hello`, `T39-offerCard`, `fitLine`) pass.
- Screenshots: `shots/` (web preview, 393 pt, light and dark: first-check and re-check cards). The web preview does not draw icons and uses a wider fallback font than iOS; iOS is the truth.
- Not verified: the iOS Simulator (the main one was in use by T104's Metro), largest text size, VoiceOver.

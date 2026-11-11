# T44 · Your style: squared tiles with setup's drawings

**Size:** normal. **Spec:** `specs/setup-and-you.md` SY1 (item 1, "looks in pick order") is unchanged; the founder's words from his Nov 11 phone pass win (DECISIONS-LOG #441). Asking him before touching the spec's text.

## The ask
1. The look buttons are too round; make them a rounded rectangle, not a pill.
2. Show the onboarding look drawings next to the looks he picked on You, in his order.

## What was built
- `app/src/features/you/StyleTile.tsx` (new, replaces `NumberedPill.tsx`): setup's two drawn outfits (`Outfit` from `LookTile`, reused), the look's name and a numbered disc, three tiles across (one per row at the accessibility sizes), corner `radius.look + 1` (14 pt, continuous) = setup's tile corner.
- You → Your style card: the tiles only show; the whole card is still one button with the same VoiceOver sentence.
- You → Style profile: each look is a tile button; picked = setup's ink ring and its number; a 4th pick shakes (a dim with Reduce Motion) and buzzes, as before. Budget's chips stay capsules.
- Tests: `youSettingsHome.test.tsx` (T44 block: pick order and drawings on the card, the corner equals setup's, picked/unpicked tile state, the accessibility-size row), SY1.6 and YT4 follow the renamed component.

## Proof
- Simulator screenshots (iPhone 17 Pro, light and dark, 1 and 3 looks) in `shots/`: `you-{light,dark}-{1look,3looks}.png`, `profile-{light,dark}-{1look,3looks}.png`. The gear and "Tools" label are Expo's dev menu button, not the app.
- Not verified: the accessibility-size row on the Simulator (a test checks its layout only), VoiceOver by ear, the shake and Reduce Motion (the code copies setup's tile; no test plays it).

## Review (a separate reviewer)
No serious bugs. Fixed from its notes: editor tiles stretch to their row (a two-line name no longer leaves neighbours shorter), `StyleTile` is memoized (the Style profile screen now draws about 60 small SVGs, and one slow T39 test sat 0.8 s from its 5 s limit when four suites ran together), the 44 pt test renamed to what it checks, a row-layout test, the `window` shadow and a comment. Left: a 5 s timeout bump on a locked test is the founder's call; the tile is about 140 pt tall on You, well over 44 pt.

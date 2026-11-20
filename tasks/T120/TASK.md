# T120: graphic pieces beyond the tee

**Size:** normal. **Spec:** the closet drawings (DECISIONS-LOG #141) and the founder's chat request, Nov 20: "Let's account for not only graphic tees, but graphic jeans, graphic sweatpants, graphic hoodies, and so on." No new screen; the piece page gains one row with existing words. The report `reports/2026-11-20-graphic-pieces.md` maps every place "graphic" is handled and holds the strict and paid proposals (scoring S1, privacy S2, vision prompt), none built here.

## What changes
- `closet/flats.ts`: `BottomFlat.print` and a thigh print mark (jeans, sweatpants, shorts, cargos; below the pocket on cargos); a placketed or zipped top (polo, shirt, jackets, cardigan, quarter-zip, zip hoodie) draws its mark low on the right side instead of over the buttons or zip. Tees, tanks, sweatshirts and pullover hoodies are drawn exactly as before.
- `closet/artSpec.ts`: bottoms read `print` from `pattern == graphic`.
- `closet/pieceEdit.ts`: a bottom gets a Pattern row with two options (Plain, Graphic print).
- `rubric/stylist-guide.md` section 0 (and the generated `ask/guide.generated.ts`): a graphic on any piece is a statement piece; the score charges a regular-cut graphic hoodie only as a statement.

## Done means
- A graphic piece of any top kind or any bottom is drawn with the mark and VoiceOver says "graphic"; a plain one has neither.
- The mark stays on the leg for every leg shape, light and dark.
- `flatsBaseline.json` unchanged; the 174 existing drawings byte-identical.
- Bottoms show Kind, Color, Leg (not shorts), Pattern.
- No scoring, privacy or prompt file touched.

## Built
- Tests: `app/src/__tests__/T120-graphicPieces.test.ts` (18). Five expectations in `pieceEdit.test.ts` updated for the new bottoms row.
- Before/after (rendered from the real `renderFlat` output in headless Chrome, not the Simulator: the Mac had under 550 MB free): `tasks/T120/shots/graphic-before-after-light.png`, `-dark.png`.

## Review
(the reviewer's verdict goes here)

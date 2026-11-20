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
### Round 1

Ran only `T120-graphicPieces`, `pieceEdit` and `drawnPieces`: 3 suites, 85 tests, all pass. Read the commit as `3e86091c..HEAD` (local `main` is behind origin, so `git diff main` also shows the oversized-tee sleeve hunk from PR #161; that is not T120's).

Criteria (plan line and TASK "Done means"):
- Graphic top of any kind and any bottom drawn with the mark, VoiceOver says "graphic"; plain has neither: done (tests plus both screenshots).
- The mark stays on the leg for every leg shape, light and dark: done in the screenshots (jeans, wide jeans, sweatpants, shorts, cargos; below the cargo pocket). The test only checks 0 < x and x+w < 100, so it would pass a mark off the leg; the geometry (`w = min(24, 2*legHalf - 6)`, centred on the leg) is right by reading.
- `flatsBaseline.json` unchanged, 174 drawings byte-identical: done (file not in the commit; `drawnPieces` green).
- Bottoms show Kind, Color, Leg (not shorts), Pattern: done.
- No scoring, privacy or prompt file touched: done. The commit touches nothing under `app/packages`, `app/modules`, `app/assets` or `extraction-test`.

Report map spot-checks, all true to the code: SX1 (`parts.ts` 1342-1350: kind in `sx_street_tops` or roominess 4+, so a regular-cut graphic hoodie is not charged; Python 1298/1313 match); CL1 (`parts.ts` 1140: top or outerwear only, `LOUD_LOGO_TOPS` = graphic_tee, tee); STY-6 (`UPPER_OR_BOTTOM` includes bottoms, graphic counts 1); MIN-3 (`rubric.py` 432 `_veto_min`, any piece in `c.main`); the face-print rule is geometric (`KittedPrep.swift` `printZone` 1341-1372: torso band shoulders to hip +15%, no garment test). The guide bullet's "counts a graphic on any piece as one statement" is true (tops, layers, bottoms).

Defects (open, none touches a score or a photo):
1. **code** `flats.ts` line 540: the side print mark is a fixed `printMark(cx - 42, ..., 26, 22)`, but a slim top's body edge is `cx - 37` (regular `cx - 41`). On a slim polo, shirt, cardigan or jacket the mark's left 5 units hang outside the body into empty space (regular: 1 unit; relaxed and oversized fit inside). I confirmed `x=58` for slim, regular and relaxed polos and oxfords. No test covers a top's mark against the body, and the screenshots only show regular fit. Fix: place it from `hw` (for example `cx - hw + 4`) and add a slim case to the test.
2. **code** (small, cosmetic) `flats.ts` 540 on a denim jacket: the mark (x 58-84) sits across the pleat seam at `cx - 21`, and the other seam at `cx - (hw - 9)`; visible in the screenshots as the mark straddling a seam line. Falls out of the same fix if the mark is placed between the seams or the seams are drawn before and under it.

Small things, never blocking:
- The guide bullet says the score "charges a regular-cut graphic hoodie nothing extra". Close but not exact: CL1 still charges a bright graphic top at a medium or large print (-1.5), and MIN-3 stops a minimal read. SX1 is the only charge it skips. Kit gives it as advice and not a number, so no harm; "nothing extra for the clash" would be exact. The words are in Kit's guide, so the founder's call.
- `T120-graphicPieces.test.ts` "mark stays on the leg" would pass a mark anywhere with 0 < x and x+w < 100; a check against the leg's own edges would pin it.
- Screenshots are headless Chrome, not the iOS Simulator (stated honestly in the report); the phone check is still open.
- The five edited `pieceEdit.test.ts` expectations are all about the new Pattern row on bottoms (the row lists for B3, jeans and shorts, athletic shorts, and the label list); nothing weakened, no `.skip` or `.only`.

**Verdict: not ready** (defect 1, a code fix; one fix round). Everything else is done.


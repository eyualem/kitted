# T101 report

**Verdict: READY** (round 3 of 3; no code defects in any round).

## Summary for the founder
Kit can now draw four things the app never could: a watch, a belt, a cap and a beanie, in light and dark, in any of the 25 colors. A watch can also be gold, silver or black metal (a bracelet when you only say "a gold watch"), with an analog or a digital face ("a gold digital watch"). A piece Kit invents ("you'd need a navy overshirt") now draws from just a kind, a color and a name, with no closet row behind it, and a closet row built from it draws the identical picture. Nothing on screen changes yet: the dashed "You'd need" tiles come in T104 and the Add-from-chat flow in T106. A reading's hat, cap, watch or belt that used to draw as a tee now draws as itself.

Real: the drawings (code, no images), the drawn-piece shape, `PieceArt` taking either. Not real yet: no screen shows them, so this was proved with tests and contact-sheet screenshots, not on a phone.

## Built
- `closet/flats.ts`: `AccessoryFlat` (watch, belt, cap, beanie), `METAL_HEX`, `WATCH_METALS`; existing drawings unchanged (174 byte-identical).
- `closet/artSpec.ts`: `'accessory'` shape; `DrawnPieceSpec`, `DRAWN_KINDS`, `pieceSlotOf`, `drawnItem`, `pieceArtSpec`.
- `closet/GarmentArt.tsx`: `PieceArt` takes a closet row or a drawn piece (+ optional slot); an undrawable piece is an empty box.
- One type-only edit to `closetBatch287.test.ts` (recorded in TASK.md).

## Verification
- Lock: holds. Tests were strengthened twice (additions only) after the verifier planted bugs the tests missed; each is in TASK.md → Disputes.
- `npm run check` in `app/`: green (tsc, lint 0 errors, core 853, jest 2006 passed, 3 suites skipped as before).
- Tests: 38 in two new files (`drawnPieces.test.ts`, `drawnPieceArt.test.tsx`).
- Mutations (about 45 planted over three rounds): every behavioural one is caught. Uncaught and judged cosmetic (covered by the contact sheet): belt buckle position, belt hole count, digital colon dot position, cap brim halo, beanie cuff fill.

| Criterion | Result |
|---|---|
| KC9.1 four accessories drawn in code, light and dark, any color | pass (tests + contact sheets); iOS not verified |
| KC9.2 watch metal as a detail, no new family, no score effect | pass |
| KC9.3 a chat-added watch draws the same in Closet | pass in tests; real Closet screen waits for T106 |
| KC2.2 (the drawing) a piece he doesn't own draws in a palette color | pass; the dashed tile, `You'd need` and the tag are T104 |

Screenshots (`tasks/T101/shots/`): `05-verify-accessories-61-120-light.jpg`, `06-verify-accessories-61-120-dark.jpg` (all four, 61 pt tile and 120 pt card, many colors and metals), `04-watches-sizes-61-88-120-light.jpg`, `03-accessories-dark.jpg`.

## Not verified, and what would verify it
- react-native-svg on iOS, card size, largest text size: T104's demo screens on the Simulator. The Browser pane draws SVG more permissively than iOS.
- The Closet tile after an Add from chat: T106.
- Maestro flows: not run (no Simulator, memory); the next `/test-build`. Low risk: all 174 existing drawings are byte-identical.
- Whether a 61 pt watch reads clearly to a person: the founder's eye on the contact sheets. The belt is drawn as a coiled loop with a buckle and at 61 pt reads a little like a ring.

## Notes for later tasks
- KC9.2's wording says black is "not a color family", but black is one. The tests encode the meaning (the metal black never changes the family black). The criterion wording needs the founder's yes to fix.
- T104/T105: a drawn piece whose kind can't be drawn gets the same-slot stand-in only if the caller passes `slotHint`; with no hint it draws an empty box.
- T106: write a chat-added accessory's closet row from the fields `drawnItem` returns, with `slot: 'accessory'`; Closet has no accessory section yet (a new `Accessories` section is the founder's word to approve).

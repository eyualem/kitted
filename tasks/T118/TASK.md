# T118: "What is it, then?" (Not the same asks which piece it is)

**Size:** normal · **Spec:** `specs/closet-beta.md` CB4 (approved Nov 19) · **Design:** `tasks/T118/DESIGN.md` (frames in `tasks/not-same-picker/`)

## What changes
- `No, a new one` is `Not the same` on the score card, in Closet's To confirm deck and in the Added sheet's question (the generated deck row `item.dup.no` changed in `handoff/02-screens.md`).
- `Not the same` (and the Added sheet's `Not the same` link on a matched piece) opens one sheet, `NotSameSheet`, at the large detent: the photographed piece, his same-slot pieces (runner-up first, then newest), `It's a new piece` last.
- A tap on a piece selects it and shows the two pictures with `Yes, same one`; nothing saves until then (`answerDuplicate(…, 'same', { targetId })`).
- `It's a new piece` goes to `What kind of piece is it?`: the read kind first, up to 3 more of the slot, `Something else` (the slot's full list, the one `What it is → Kind` uses). A kind saves the piece as new with the kind confirmed (`answerDuplicate(…, 'new', { kind })`). No other piece in the slot: the sheet opens on the kinds with `Nothing else like it in your closet yet.` and no Back.
- Added sheet, a matched piece: a pick moves the photo (`pickAnother`), a new piece splits it (`splitPhoto`) and confirms the kind (`editPiece`); both toast with Undo.
- Cards say `Saved as your {item}.` (a picked piece) or `Saved as its own piece: {item}.` (a new piece with a kind); answers saved before this still say `Kept as a new piece.`. `Change` is today's.

## Files
- New: `features/closet/{NotSameSheet.tsx,notSame.ts}`, `app/sheets/not-same/[checkId]/[obsId].tsx`, tests `__tests__/notSame.test.ts` and a CB4 block in `closetService.test.ts`.
- Changed: `closet/service.ts` (answer with a picked target or a confirmed kind, and their revert), `fitcheck/service.ts`, `data/types.ts` (`ClosetAsk.pickedId/kind/kindUndo`), `DuplicateQuestion.tsx`, `answerToast.ts`, `EditSheet.tsx` (exports `Choice`), `FitCheckCard.tsx`, `AddedSheet.tsx`, `(tabs)/closet/index.tsx`, `_layout.tsx`, `SheetScaffold.tsx` (Back, scroll to top), `en.ts`, `handoff/02-screens.md` + `en.generated.ts`, `demo/{scenarios,prepareDemoScreen}.ts` (screens 420–423), `e2e/flows/T74-confirm-one-card.yaml`.
- Not touched: `ClosetTile`, `ask/*`, `closet/chatAdd.ts`.

## Notes for the control session
- The kind table (`KIND_SHORTLIST` in `closet/notSame.ts`) is T106's table plus Shirt for tops; T106's `ask/addCard.ts` still holds its own copy. When both are on main, `addCard.ts` should import this one, and the sheet's title should take T106's `ask.card.addKind` (same words; `notSame.kindTitle` stands in until then).

## Done means
CB4.1–CB4.17 (see the spec). Logic is covered by `notSame.test.ts` (CB4.2, 4.3, 4.6, 4.8, 4.14, the lines) and `closetService.test.ts` (CB4.5, 4.7, 4.10, 4.16, 4.17); the deck test covers CB4.1. Words, layout and VoiceOver are checked by screenshots / not verified (see Built).

## Built
_(filled in at the end)_

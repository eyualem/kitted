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
- The kind table (`KIND_SHORTLIST` in `closet/notSame.ts`) is T106's table plus Shirt for tops; T106's `ask/addCard.ts` (merged) still holds its own copy (`KINDS_BY_SLOT`), left alone: it has its own tests and lane. It should import this one later. The sheet's kind title already uses T106's `ask.card.addKind`.

## Done means
CB4.1–CB4.17 (see the spec). Logic is covered by `notSame.test.ts` (CB4.2, 4.3, 4.6, 4.8, 4.14, the lines) and `closetService.test.ts` (CB4.5, 4.7, 4.10, 4.16, 4.17); the deck test covers CB4.1. Words, layout and VoiceOver are checked by screenshots / not verified (see Built).

## Built
Everything in "What changes" above, on the iOS Simulator (iPhone 17e, a Metro on port 8082 from this worktree), screens 420–424 (`demo/scenarios.ts`).

Screenshots in `tasks/T118/shots/`:
- Light: `01-sheet-list`, `02-picked`, `03-kinds`, `04-all-kinds`, `05-card-after-kind` ("Saved as its own piece: tan trousers." · Change), `06-card-change` (`Not the same` marked), `07-empty` (straight to kinds, no Back), `11-matched-sheet`, `12-matched-after-pick` (the photo moved to the grey tee), `13-matched-after-new-piece` (the sneakers split off as a new piece).
- Dark: `08-sheet-list`, `09-empty`. Largest text: `10-sheet-list-largest-light`.

Tests: `notSame.test.ts` (pieces, order, exclusions, empty case, kinds, lines), the CB4 block in `closetService.test.ts` (pick, kind, Change, Undo with the never-ask-again mark restored, score unchanged), `closetDeck.test.tsx` (chip opens the sheet), `toast.test.ts` (the two new Undo toasts are 8 s). One full `npm run check` at the end.

Review fix round (one): the reviewer found that Undo of a new piece with a kind left the two pieces marked "never ask again" (`kindUndo` was captured after that mark was added). Fixed in `revertAnswer`, with a `distinctFrom` assertion in the test. Also from the review: the sheet catches a thrown write (clears the selection) and stays busy after a successful write so it never flashes Gone as it closes.

Not verified: VoiceOver (labels and hints are set, never run with VoiceOver on); the toast's Undo on the matched path on the Simulator (it reuses `restorePhoto`, which has its own tests); dark shots of the picked state, the full kind list and the card; the Maestro edit in `e2e/flows/T74-confirm-one-card.yaml` (written, not run); a phone.

## Review

### Round 1 (normal)

Reviewed: the diff against origin/main, the CB4 spec, the six shots I read (01, 02, 03, 05, 06, 09 dark; 10 largest). I did not re-run `npm run check`. I ran one related test (a temporary copy of `closetService.test.ts` with one extra assertion, deleted after; the tree is clean). Note: TASK.md -> Built is still the placeholder, so this round did not have the builder's own claims to compare with.

Criteria:
- CB4.1 chip reads `Not the same` and opens the sheet: done (deck test, `item.dup.no`, shot 06; no live string left except comments).
- CB4.2 large detent, title/line/photographed piece/tiles/new-piece row last, never refused or pending: done (`notSame.test.ts`, shot 01).
- CB4.3 order runner-up then newest: done (test).
- CB4.4 tap selects, nothing saved, second tap clears: done by shot 02 and code (`setSelectedId`); no component test.
- CB4.5 `Yes, same one` on a pick folds like Yes, `Saved as your {item}.`, Change undoes: done (service test, shot after pick is only in the demo screens; line logic tested).
- CB4.6 kinds step with read kind first, Back clears selection: done (test, shot 03).
- CB4.7 kind saves as new with kind confirmed, line `Saved as its own piece: tan trousers.`: done (test, shot 05). See defect 1 for its Undo.
- CB4.8 no other piece: opens on kinds, `Nothing else like it...`, no Back: done (test, shot 07/09).
- CB4.9 closing saves nothing: done by construction (nothing writes before a pick); not exercised.
- CB4.10 score unchanged: done (asserted in both service tests).
- CB4.11 Added sheet matched piece (pick moves the photo; new piece splits and confirms kind; Undo/Change restore): not verified. Code path reads right (`pickAnother`, `splitPhoto` + `editPiece`, Undo = `restorePhoto`), but there is no test and no screenshot. Would verify: demo run of the Added sheet on a matched piece, both paths, then Undo.
- CB4.12 VoiceOver: not verified (labels and hints are set; the tile `Selected` hint is wired). Targets and largest text: done by shot 10 (title wraps, nothing clipped, large detent).
- CB4.13 light and dark screenshots of each state: partly. Light 01-07, dark only list (08) and empty (09); no dark shot of the picked state, the all-kinds list, or the card lines. Words are all in `en.ts`; none all-caps, no emoji.
- CB4.14 `Something else` = the slot's full list: done (test); shot 04 exists, not read.
- CB4.15 other kinds stop taking taps until the write lands or fails: done in code (`busy`, `pointerEvents`, dimmed); failure path covered only when the service returns null. A thrown write leaves `kind` selected (see small things). No test.
- CB4.16 `Change` shows the question with `Not the same` marked, changes nothing: done (shot 06; a pick marks it too).
- CB4.17 new piece is a solid tile named by the kind, first in its section: done at row level (test: `isPhotographed`, name has the kind). Closet screen order not seen.

Defects:
1. **code** `app/src/features/closet/service.ts` (`applyAnswer`, the `kindUndo` capture, about line 826, and its restore in `revertAnswer`, about line 719). `kindUndo.profile` is read from `fresh`, fetched after the line that adds `distinctFrom: [candidate]` to the flagged piece. On Undo or Change, `revertAnswer` first removes that distinctFrom, then the `kindUndo` patch writes the profile back with it. Reproduced: after `answerDuplicate(..., 'new', { kind: 'trousers' })` then `unanswerDuplicate`, `profileOfItem(item).distinctFrom` is `['B1']` (expected `[]`). Effect: the question is open again, but the pair stays marked "never ask again", and the candidate side was cleaned, so the two rows disagree. The existing CB4.7 test checks subcategory, confirmedFields and name but not the profile, so it passes. Fix: capture `kindUndo` from the flagged piece as it was before the distinctFrom patch (or restore only the kind's own fields: garment, confirmedFields, starterId, and the profile without touching distinctFrom). The builder fixes the code; add a `distinctFrom` assertion to that test.
2. **code** TASK.md -> Built was not filled in, and the three paths the builder already named (Added sheet matched piece, VoiceOver, the edited Maestro flow) have no proof. Not a code defect, but CB4.11 and CB4.12 cannot be called done until one of them is run.

Small things worth a later look (not blocking):
- `NotSameSheet.run`: `job().then(...)` has no catch, so a thrown write is an unhandled rejection and leaves the chosen kind selected (CB4.15 says nothing selected). Add a `.catch` that clears selection.
- The deck path skips the haptic and the `willAnswer` guard on `Not the same`; the sheet answers later and gives no haptic. Probably fine, worth a look on the phone.
- After `Yes, same one` the sheet's live data briefly can resolve to null (the flagged copy is soft-deleted), which would flash `GoneSheet` as it closes. Not seen in a shot.
- No component test for the sheet; CB4.4, 4.9, 4.15 rest on reading the code. The Maestro tap `Chinos` (the kind tile) depends on the tile's accessibility label; not run.
- `KIND_SHORTLIST` duplicates T106's table (the builder's own note).

**Verdict: not ready.** One code defect (1), plus CB4.11/CB4.12 unproven. Once defect 1 is fixed and the Added sheet matched path is shown once on the Simulator (pick, new piece, Undo), this is ready.

### Round 2 (normal)

Reviewed: the diff `585d7d29..HEAD` (service.ts, NotSameSheet.tsx, closetService.test.ts, the demo screen 424), shots 11, 12 and 13, and the Built section. I did not run tests (the session's `npm run check` is the record); I read the assertion and the code path it exercises.

- Defect 1 (Undo of a new piece with a kind left the pair marked never-ask-again): fixed. `revertAnswer` now restores `kindUndo.profile` with the candidate filtered out of `distinctFrom`, so the flagged piece and the candidate both end clean. The CB4.7 test now asserts `distinctFrom` is empty on both rows, which fails against the old code (the old `kindUndo.profile` carried `['B1']`). The `kindUndo.profile === null` case restores null, which carries no mark: fine.
- Defect 2 (Built empty, CB4.11 unproven): Built is filled in. CB4.11 is shown on the Simulator for the two answers: shot 11 (the sheet over the white tee with the Tops tiles), shot 12 (the photo moved to the grey tee, the white tee gone from the matched list), shot 13 (the sneakers split off as "White leather sneakers", a new piece with its own Undo, kind confirmed). Undo of the matched path is still not shown on the Simulator, and Built says so; its logic reuses `restorePhoto`. I accept that as honest and non-blocking.
- Small fix: `NotSameSheet.run` catches a thrown write (clears the selection, un-busies) and stays busy after success. Matches CB4.15 and avoids the Gone flash.
- Built's claims match the diff and the shots. Its "Not verified" list is honest (VoiceOver, matched-path Undo toast, dark shots of the picked/kind/card states, the Maestro edit, a phone). Two things it does not list, both minor: there is still no component test for the sheet (CB4.4, 4.9 and 4.15 rest on reading the code), and the shots are on an iPhone 17e rather than the main iPhone 17 Pro (layout only).

**Verdict: ready.** No open defect. Later look (never blocks): demo story 424 sits between 422 and 423 in `prepareDemoScreen.ts` (tidy the order); run the matched-path Undo and VoiceOver on the phone.

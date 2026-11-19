# Proposal: "What is it, then?" (the Not the same sheet)

**Status: a proposal, not approved.** It adds to `specs/closet-beta.md` (new section CB4) and changes two words there. `specs/closet-beta.md` itself is untouched until the founder says yes in chat. Frames: `design.html` (light and dark), screenshots in `shots/`.

**The goal, restated by the founder (Nov 19, relayed by the control session):** "When we think it's a piece that already exists inside the closet, instead of duplicating it, we ask the user there and then which piece in particular it is." So the question is asked in place, the moment he taps `Not the same` on the card, not later as a chore in Closet; and picking one of his own pieces is the first, easiest path, with `It's a new piece` second.

**Where it came from:** the founder, Nov 19 (voice): when he taps "not the same piece" on the card, "a whole pop-up type of thing: 'What is it, then? If it's a new one, just for confirmation, is it a shirt, or this, or that?' … if it's tops, just give the user options to add it there instead of duplicating it inside the closet."

## What he sees today (read from the code and specs)
| Where | Words | What a tap does today |
|---|---|---|
| The score card in chat (`FitCheckCard`) | `Is this your grey quarter-zip?` · `Yes, same one` · `No, a new one` · `It's my {runner-up}` | `No, a new one` keeps the photo's piece as its own piece (`Kept as a new piece.` · `Change`). Nothing asks what it is, so a wrong read stays wrong and a copy of a piece he owns stays a copy. |
| Closet tab, To confirm deck (`ConfirmDeck`, CB2) | the same question and chips, plus `Skip ›` | the same |
| Added sheet, a new piece with a question (`AddedSheet`) | the same question inline | the same |
| Added sheet, `Already in your closet` (`MatchedRow`) | a link: `Not the same` (also a VoiceOver action) | the matched sighting becomes its own piece and the two are never matched again (`splitItem`) |
| Piece page (separate, untouched) | `Not this piece`, `It's another piece…`, `Same as another piece…` | already has a picker of his same-slot pieces (`MergeSheet`, "Same as which piece?") |

So the literal words `Not the same` exist only on the Added sheet. On the card the chip is `No, a new one`.

## Proposed behavior (CB4)
**Entry, asked in place.** Nothing waits for Closet: the sheet is the question. The chip `No, a new one` becomes `Not the same` on the card, in the deck, and in the Added sheet's inline question. The Added sheet's `Not the same` link already says it. All of them open one sheet (the app's formSheet, detents 0.6 and 1, grabber, X). `Yes, same one` and `It's my {runner-up}` do not change. Closing the sheet (X or swipe down) saves nothing; the question stays open exactly as it is today (it stays on the card and in Closet's To confirm), so nothing is lost, but the point is that he answers it here.

**The sheet, "What is it, then?" (frames 2, 3).** It opens at once, over the card, at the large detent (he can drag it down to medium). From the top: the title and the line `Pick the one it is, or add it as new.`; the photographed piece for reference (its crop from this photo, `This photo`, and the name the app read); his other pieces of the same slot as drawn tiles, titled with the Closet's own section name (`Tops`, `Bottoms`, `Shoes`, `Jackets and layers`); and under the tiles the second path, the row `It's a new piece`. On a normal closet (up to about six pieces in the slot) everything is in view; on a longer one the tiles scroll and the row follows the last tile.
- **Which pieces:** his live, owned pieces in the same slot, the way "Same as which piece?" lists them (`mergeCandidates`), minus the piece he just said no to and the photographed piece itself, minus any still waiting on an answer. Closest first (the runner-up if there is one), then newest first. No limit; the sheet scrolls.
- **Picking a piece (frame 3).** A tap selects the tile (a ring and a check) and the sheet scrolls to the top, where the reference row has turned into the comparison. It shows the question's own two pictures, `This photo` and `In your closet`, under `Is this your navy sweater?` with `Yes, same one`. Tapping another tile switches; tapping the selected tile clears it. Nothing is saved until `Yes, same one`. Then the sheet closes and the card reads `Saved as your navy sweater.` · `Change`. The photo's piece folds into the picked one exactly as `Yes, same one` does today (sighting moves, worn count and photos join, the two are never asked about again).
- **A new piece (frame 4).** `It's a new piece` opens the next step in the same sheet (one level, a Back button, never a second sheet): the title `What kind of piece is it?` (the words and the 2–4 options pattern of Kit's add card, KC4.7), the reference row, and 2 to 4 drawn kinds in this piece's own color: the kind the app read first, then up to three nearest kinds of the same slot (for a top: Sweater, Tee, Shirt, Hoodie). One tap on a kind saves the piece as new with that kind confirmed (its name and drawing follow, as with `What it is → Kind` on the piece page), closes the sheet, and the card reads `Saved as its own piece: grey sweater.` · `Change`.
- **Nothing else like it (frame 7).** If there is no other piece in that slot to pick, the sheet opens straight on the kind step, with the line `Nothing else like it in your closet yet.` and no Back.

**Other entries (frame 8).** In the Added sheet, `Not the same` on a piece the app matched opens the same sheet for that sighting (the matched piece is the one left out). Picking a piece moves that sighting there; a new piece splits it off as today, with the kind confirmed. In the deck, finishing the sheet moves to the next question; closing it does not.

**What does not change:** the score (the closet never moves it); `Yes, same one`; `It's my {runner-up}`; `Skip ›`; the piece page's own three corrections and its picker; what is sent to the server (nothing: all on the phone); the 18+ and privacy rules; no new package.

## The words (new words are for the founder's OK)
| Words | Where | Status |
|---|---|---|
| `What is it, then?` | sheet title | **new**, his own words |
| `Pick the one it is, or add it as new.` | sheet line | **new** |
| `It's a new piece` | the second path, under the tiles | **new** |
| `Nothing else like it in your closet yet.` | the empty case's line | **new** |
| `Not the same` | the chip, replacing `No, a new one` | **changed** (the Added sheet already uses it) |
| `What kind of piece is it?` | the kind step | T106's words (`ask.card.addKind`), reused |
| `Is this your {item}?` / `Are these your {item}?`, `This photo`, `In your closet`, `Yes, same one` | the picked piece's confirmation | existing, reused |
| `Saved as your {item}.` · `Change` | after picking | existing |
| `Saved as its own piece: {item}.` · `Change` | after a new piece | existing (`closet.piece.splitOff`), now also used on the card |
| `Tops`, `Bottoms`, `Shoes`, `Jackets and layers` | the grid's title | existing |
| `Kept as a new piece.` | answers already given before this change | existing, kept so old answers still read |
| `Something else` | the kind step's last row; opens the slot's full list of kinds (same title, Back returns to the 4) | **new** |
| VoiceOver: `Back`; a tile's hint `Picks it`; `Selected` | | **new**, small |

No emoji, no all-caps, no exclamation marks.

## The new-piece path, step by step (page 2 of `design.html`)
Frames: `design.html?page=2` (add `&theme=dark`), strips in `shots/new-piece-path-light.png` and `new-piece-path-dark.png`.
1. **The card** with `Not the same`; nothing saved.
2. **The sheet**, his tops first; he taps `It's a new piece` under them.
3. **`What kind of piece is it?`** with the 4 nearest kinds (the read kind first) and, as the last row, **`Something else`**. I added this because 4 kinds will sometimes miss.
4. **`Something else`** opens the slot's full list in the same sheet (same title, Back returns to the 4), drawn in the piece's color, 3 across. It should be the list `What it is → Kind` already uses on the piece page, so there is one list per slot, not three. If the founder prefers, the alternative is to skip this and rely on changing the kind later on the piece page; I recommend the row, because it keeps him from leaving the sheet to fix a wrong kind.
5. **A kind tapped.** The tapped kind is selected and the rest dim and stop taking taps (the double-tap guard). The write is local, so the saving state is a blink and the sheet closes when it lands. If the write fails the sheet stays open with the selection cleared (no new words drawn; a failure line, if wanted, reuses the app's existing could-not-save wording).
6. **Back on the card:** `Saved as its own piece: grey sweater.` · `Change`.
7. **`Change`** works as it does today: the question comes back with his earlier answer marked (`Not the same` selected). Nothing is undone yet. Tapping `Not the same` again reopens the sheet, and the earlier answer is replaced only when he picks something new there (a piece, or another kind). `Yes, same one` and `It's my {item}` answer at once, replacing it.
8. **In Closet** the piece is a **solid** tile (not the dashed "no photo" one), because it came from his photo (`isPhotographed`); dashed stays for pieces he only described in chat. It is named `Grey sweater` (the confirmed kind), leads its section (newest first), and has no `New` mark (that is only for his first Closet visit).

New pass/fail checks:
- **NS14** The kind step's last row is `Something else`; it opens the slot's full list of kinds, the same list the piece page's `What it is → Kind` offers for that slot, with Back to the 4.
- **NS15** After a kind is tapped, the other kinds stop taking taps until the write lands or fails; a failed write leaves the sheet open with nothing selected and nothing saved.
- **NS16** `Change` on the new-piece line shows the question with `Not the same` marked and changes nothing; the earlier save is replaced only by a new choice.
- **NS17** The new piece appears in Closet as a solid (photographed) tile, named with the confirmed kind, first in its section.

## States
Opening (the same slot's pieces load from the phone, so none) · pick list · a piece selected with its comparison · kind step · empty (straight to the kind step) · saving (the tap is guarded against a double tap; the sheet closes on the write) · closed without choosing · the piece or check was removed meanwhile (the existing `Gone` sheet). Largest text: the grid is 2 across, the kind options 1 across, the comparison pictures stack, and the sheet opens at large only.

## Pass/fail checks
- **NS1** On the card, in the deck and in the Added sheet's question, the chip reads `Not the same` (never `No, a new one`), and it opens the sheet. `Yes, same one` and `It's my {item}` still answer at once.
- **NS2** The sheet opens at the large detent the moment `Not the same` is tapped, with no step in between. It shows the title, the line, the photographed piece with its name, then only pieces of the photographed piece's slot, then the `It's a new piece` row last. It never lists the piece he just refused, the photographed piece, or a piece still waiting on an answer.
- **NS3** Order of the tiles: the runner-up first (when there is one), then newest first. Picking a piece is the first thing on the sheet; `It's a new piece` is never above the tiles.
- **NS4** A tap on a tile saves nothing; it selects it and shows `Is this your {item}?` with both pictures and `Yes, same one`. A second tap on the same tile clears it; a tap on another switches.
- **NS5** `Yes, same one` on the selection folds the photo's piece into the picked piece exactly as `Yes, same one` on a question does (same rows, same worn count, never asked again), closes the sheet, and the card reads `Saved as your {item}.` with `Change`; `Change` undoes it as today.
- **NS6** `It's a new piece` shows `What kind of piece is it?` with 2 to 4 kinds, all of the photographed piece's slot, the app's read kind first, each drawn in the piece's color. Back returns to the list with the selection cleared.
- **NS7** A tap on a kind saves the piece as new with that kind confirmed (name and drawing follow), closes the sheet, and the card reads `Saved as its own piece: {item}.` with `Change`.
- **NS8** With no other piece in the slot, the sheet opens on the kind step, shows `Nothing else like it in your closet yet.`, and has no Back.
- **NS9** Closing the sheet without choosing saves nothing and the question is still open.
- **NS10** The score on the card, and every later score, is the same before and after (a test, like the existing closet-never-changes-the-score tests).
- **NS11** The Added sheet's `Not the same` on a matched piece opens the same sheet; picking a piece moves that sighting there; a new piece splits it off with the kind confirmed; `Undo` and `Change` put the rows back as they were.
- **NS12** VoiceOver: the sheet reads its title and line, then the photographed piece, then `It's a new piece` as a button, then each tile as its name and `Picks it`; a selected tile says `Selected`. Every target is at least 44 pt. At the largest text size nothing is cut off and the sheet opens at large.
- **NS13** Light and dark screenshots of each state in `tasks/<ID>/` (as frames 1 to 7); a copy check that every new word above is in `en.ts` and nothing is all-caps or has an emoji.

## The overlap with T106 (the add card, building now)
T106 adds `What kind of piece is it?` and `What color is it?` as tap questions in chat (KC4.7; on its branch `ask.card.addKind`, `ask.card.addColor`, and a per-slot table of 2 to 4 kinds in `ask/addCard.ts`: top Tee, Sweater, Hoodie, Overshirt; shoes sneaker, work boot, loafer; bottom jeans, chinos, trousers; outer bomber, denim jacket, field jacket). This sheet's kind step must use the same words and the same table, so one list serves both. Two small differences: here the app's read kind goes first (T106 has no read), and `Shirt` should join the top list (the founder's own example was "is it a shirt"), which T106 should take too. This sheet never asks a color: the photo already gave it. So build this **after T106 merges** and move the kind table into a shared file both import.

## Size and files (recommendation: normal)
It writes closet rows through the closet service, but only by re-using answers that exist (`same`, `runnerUp`, `new`) with a picked target and a confirmed kind. No scoring, privacy or age-gate logic is touched, so it does not need the strict path. One reviewer, tests for the logic, light, dark and largest-text screenshots.
- New: `app/src/app/sheets/not-same/[checkId]/[obsId].tsx` (route) and `features/closet/NotSameSheet.tsx`; the pure rules (`notSameContent`: the pieces, their order, the kind list) in `features/closet/notSame.ts`.
- Changed: `app/src/app/_layout.tsx` (one `sheet([0.6, 1])` entry, opening at the large detent); `features/closet/DuplicateQuestion.tsx` and `ConfirmDeck.tsx` (the chip opens the sheet); `features/stylist/cards/FitCheckCard.tsx` (the chip and its VoiceOver action); `features/added/AddedSheet.tsx` (both entries); `features/closet/service.ts` and `features/fitcheck/service.ts` (answer `pick` with a target id and `new` with a kind; today the target is only the ask's candidate or runner-up); `features/closet/answerToast.ts`; `i18n/en.ts` (+ the generated copy); the shared kind table from T106; `demo/scenarios.ts` (a demo screen per state); tests in `__tests__/closetService.test.ts` and a new `notSame.test.ts`.
- Shared files to coordinate: `en.ts` and the closet service (T106 and the Closet lane touch them).

## Open taste questions, each with my recommendation
1. **Rename the chip `No, a new one` to `Not the same`?** Yes. The sheet can end in "it's another piece of mine", so "No, a new one" would be wrong half the time, and the Added sheet already says `Not the same`.
2. **Confirm a picked piece (two taps) or save on the first tap?** Confirm. A wrong merge moves wears and photos, and the comparison next to his photo is the safeguard; the question he just answered already works this way.
3. **`It's a new piece` above or below the tiles?** Settled by the founder: his pieces first, `It's a new piece` second, under them. Cost to watch: on a closet with more than about six pieces in the slot, the row is below the fold; I recommend leaving it there (the sheet opens at large, and the row follows the last tile) rather than adding a pinned bar.
4. **Keep the `It's my {runner-up}` chip on the card?** Keep (one tap beats a sheet), and show that piece first in the grid. It is the same answer as picking that tile.
5. **No `Something else` kind in the kind step?** None. Four kinds cover almost everything, and any piece's kind can be changed later on its page (`What it is`), as in T106.
6. **After a new piece, say `Saved as its own piece: grey sweater.` instead of `Kept as a new piece.`?** Yes, it shows the kind he chose and is a line the app already has.

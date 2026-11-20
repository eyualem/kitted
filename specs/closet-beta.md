# Closet for the beta

**Approved by the founder:** 2026-11-08

After this, the Closet tab is his pieces and nothing half-finished: no Outfits, and the "Is this your …?" questions take one small card at a time instead of a stack that fills the screen.

**Part of:** `specs.md` → F7 (Closet). From the founder's first use of beta build 1 (Nov 8).

## Why
- **Outfits feels unfinished** and would take long to make good. Showing it in the beta teaches testers that part of the app is weak. It goes away for now, with its code kept so it can come back whole.
- **The To confirm card is too big.** One question is a card taller than the screen's top half (the photo and the closet drawing are each ~170 pt tall), and up to 3 stack. Being on top is fine; the size is the problem. One question at a time, smaller, and answering moves to the next.

## Scope
- **In:** Closet's Pieces | Outfits switch and everything that shows outfit lists or outfit counts (CB1); Closet's To confirm card (CB2).
- **Out (non-goals):** the "Added to your closet" sheet after a check and the question on the score card (they keep today's look); when the app asks at all (the matcher in `@kitted/core`, see Later); the morning card, Swap and Kit's outfit ideas (they never used the Outfits code and don't change); Lookbook's Saved outfits; deleting the Outfits code; any new package.

## CB1. Closet without Outfits
One switch hides everything below together. Off in every build; demo screens that show Outfits turn it on, so the hidden code stays checkable.

**What he no longer sees**
1. Closet's `Pieces | Outfits` switch. Closet opens straight on his pieces: the scans-waiting row, To confirm, then the head-to-toe sections, as Pieces does today. A remembered "Outfits" choice from before is ignored.
2. Everything in Outfits: the count line, the occasion chips, `Try next`, `Your go-tos`, the outfit cards with `Wear this` and `Check it`, `No outfits yet` and its checklist, and the fit question's copy that sat on Outfits.
3. `Next best buy` (its row and its sheet).
4. On a piece's page: the `Outfits · {n} outfits` row and `Goes with` with its outfit cards.
5. On Kit's buy card in chat: the `+{n} outfits with what you own` line. The card keeps its name, price and reason. Kit may still rank what to buy by how much it adds; that's private evidence, not a number on screen.
6. Adding a basic in Starter essentials: the toast says `Added {item}.` (today's words for a basic that adds no outfit) instead of `+{n} fits`.

**Words that change**
- Piece page, the note under `What it is`: `Got one wrong? Change it here. The drawing follows. Your scores stay the same.` (was "…The drawing and your outfits follow. …").

**Untouched:** the morning card (`Wear this`, Swap, Change), Kit's outfit ideas in chat, Starter essentials (still reached from the empty Closet and Your first 3 moves), the piece page's other rows, Lookbook.

## CB2. To confirm, one card at a time
The card stays where it is, on top of Closet under the scans-waiting row. It holds one question at a time.

**The deck:** every open "Is this your …?" question, newest first (as today), then the one "How do your … fit?" question if there is one (§18's rules for which piece). The count is all of them.

**Layout, top to bottom (one card)**
1. Tag line: `To confirm` on the left, `{n} of {total}` on the right (for example `2 of 5`). With one question in the deck: `1 of 1`.
2. The question (`Are these your khaki chinos?`) and its one-line reason, as today; `Your score stays the same either way.` on his first few questions, as today.
3. The two pictures side by side, `This photo` and `In your closet`, about 110 pt tall (today ~170). At the largest text sizes they stack, as today.
4. The answers: `Yes, same one` · `Not the same` · `It's my {item}` when there's a runner-up. *(`No, a new one` became `Not the same`, and `Not the same` opens CB4's sheet; changed with the founder's yes, Nov 19.)*
5. `Skip ›`, trailing, at the end of the answers' row; on its own row under them only when it can't fit (a third answer, large text). Not shown when the deck is a single "Is this your …?" question (it would do nothing); a lone fit card keeps it. *(Changed with the founder's yes, Nov 10.)*

A fit question card keeps its own look (the drawing, `How do your mid-wash jeans fit?`, what was seen) at the same size as today, with the same tag line and `Skip ›`.

**Folded (changed with the founder's yes, Nov 10:** *"I feel like these confirm piece-type texts should be expandable instead of the way they are right now."* **Relayed by the Apple Connect session, which set the details below.)**
- **Folded by default:** one row: the first waiting question's piece (its closet drawing, left out at the largest text sizes), `To confirm` with the number still waiting on the right (for example `4`), that question in bold (`Are these your khaki chinos?`), and a chevron. A tap opens the card in place, at the current question. *(The picture and question added with the founder's yes, Nov 10: "it's easy to miss … add a little picture … of the first one that's getting confirmed"; he picked "Picture + question".)*
- **Open:** the card as above; its tag line row gets the chevron, turned, and a tap on that row folds it again.
- **Memory:** folded or open stays as he left it. A new question arriving changes only the count; it never opens the card by itself.
- **Empty:** with nothing left, the row goes away, as the card does.
- **VoiceOver:** the row is a button with its state: "To confirm, 4 pieces. Are these your khaki chinos?", collapsed; open, "To confirm, 4 pieces", expanded. Reduce Motion: no animation.
- No new words on screen; the VoiceOver label is new.

**Moving through it**
- **Answering** saves the answer (as today, through the closet service), gives a light haptic, and the next card slides in from the trailing side. The toast says the answer with Undo, as today (`Saved as your khaki chinos.` / after CB4's new-piece path `Saved as its own piece: grey sweater.`; answers given before CB4 still read `Kept as a new piece.`).
- **Undo** puts the question back in the deck in its place and shows that card.
- **Swiping sideways** moves to the next or previous card without answering, wrapping at both ends like Skip. It never answers. With a single card it springs back.
- **`Skip ›`** moves to the next card without answering. After the last card it wraps to the first. Skipped questions stay open and come back next time Closet opens. On the fit card, Skip keeps today's meaning (§18): that card leaves the deck until a newer photo disagrees again.
- **Tapping the fit card** opens its Leg or Fit sheet, as today; a pick settles it and it leaves the deck.
- **The last answer:** the card goes away (no "All set" screen). The toast with Undo still shows; Undo brings the card back.
- **A question answered elsewhere** (on the score card or in the Added sheet) leaves the deck; the count and `n of total` update. If it was the card on screen, the next one shows.

**Accessibility**
- VoiceOver reads the card as `Question {n} of {total}.` then the question, the reason, and the pictures' description (today's label). The answers and `Skip` are buttons; swiping is never needed. When the card changes, VoiceOver moves to the new question.
- Reduce Motion: cards cross-fade instead of sliding.
- Every answer and Skip is at least 44×44 pt. Largest text sizes: pictures stack, nothing cut off.

**New words**
- `{n} of {total}` (tag line, right).
- VoiceOver: `Question {n} of {total}.`

## CB4. "What is it, then?": asking which piece it is, right there
**Approved by the founder:** 2026-11-19 (frames: `tasks/not-same-picker/design.html`, pages 1 and 2, light and dark; shots in `tasks/not-same-picker/shots/`; his words, Nov 19: "When we think it's a piece that already exists inside the closet, instead of duplicating it, we ask the user there and then which piece in particular it is.")

**Part of:** `specs.md` → F7 (Closet). Changes CB2's second answer and adds one sheet. The score, the matcher and the server are untouched.

**Entry.** The chip `No, a new one` becomes `Not the same` on the score card (`FitCheckCard`), in the To confirm deck (CB2) and in the Added sheet's inline question. The Added sheet's `Not the same` link on a matched piece (`MatchedRow`) already says it. All of them open one sheet: the app's formSheet, detents 0.6 and 1, opening at the large one, grabber and X. `Yes, same one` and `It's my {runner-up}` do not change and answer at once. Closing the sheet (X or swipe down) saves nothing; the question stays open as it is today.

**The sheet.** From the top: the title `What is it, then?` and the line `Pick the one it is, or add it as new.`; the photographed piece for reference (its crop from this photo, `This photo`, and the name the app read); his other pieces of the same slot as drawn tiles under the Closet's own section name (`Tops`, `Bottoms`, `Shoes`, `Jackets and layers`); then, last, the row `It's a new piece`. His pieces always come first.
- **Which pieces:** his live, owned pieces in the same slot, the way "Same as which piece?" lists them (`mergeCandidates`), minus the piece he just said no to, the photographed piece, and any still waiting on an answer. The runner-up first when there is one, then newest first. No limit; the sheet scrolls and the row follows the last tile.
- **Picking a piece.** A tap selects the tile (ring and check) and the sheet scrolls to the top, where the reference row has become the comparison: the question's own two pictures, `This photo` and `In your closet`, under `Is this your {item}?` with `Yes, same one`. Another tile switches; the selected tile clears it. Nothing is saved until `Yes, same one`. Then the sheet closes and the card reads `Saved as your {item}.` with `Change`. The photo's piece folds into the picked one exactly as `Yes, same one` does (sighting moves, worn count and photos join, the two are never asked about again).
- **A new piece.** `It's a new piece` opens the next step in the same sheet (a Back button; never a second sheet): the title `What kind of piece is it?` (the words and the 2 to 4 options of Kit's add card, KC4.7; one shared kind list), the reference row, and 2 to 4 kinds of the photographed piece's slot drawn in its own color: the kind the app read first, then the nearest kinds (for a top: Sweater, Tee, Shirt, Hoodie), and last the row `Something else`, which opens the slot's full list of kinds in the same sheet (same title, Back returns to the 4), the same list `What it is → Kind` offers on the piece page. One tap on a kind saves the piece as new with that kind confirmed (its name and drawing follow), closes the sheet, and the card reads `Saved as its own piece: grey sweater.` with `Change`. After a tap the other kinds stop taking taps until the write lands or fails; a failed write leaves the sheet open, nothing selected, nothing saved.
- **Nothing else like it.** With no other piece in the slot to pick, the sheet opens straight on the kind step with the line `Nothing else like it in your closet yet.` and no Back.
- **Change.** `Change` on the card's answer brings the question back with his earlier answer marked (`Not the same` selected) and changes nothing yet; tapping `Not the same` reopens the sheet, and the earlier save is replaced only by a new choice there. `Yes, same one` and `It's my {item}` answer at once, replacing it.
- **Other entries.** In the Added sheet, `Not the same` on a matched piece opens the same sheet for that sighting, the matched piece left out; picking a piece moves that sighting there; a new piece splits it off (`splitItem`) with the kind confirmed. In the deck, finishing the sheet moves on to the next question; closing it does not.
- **In Closet** the new piece is a solid tile (it came from his photo), named with the confirmed kind (`Grey sweater`), first in its section, with no `New` mark.
- **States:** pick list · a piece selected · kind step · the full list · empty (straight to kinds) · saving · closed without choosing · the piece or check removed meanwhile (the existing `Gone` sheet). Largest text: the grid 2 across, the kinds 1 across, the comparison pictures stack, the sheet opens at large only.

**New words** (all approved Nov 19): `What is it, then?` · `Pick the one it is, or add it as new.` · `It's a new piece` · `Nothing else like it in your closet yet.` · `Not the same` (replaces `No, a new one`) · `Something else`. Reused: `What kind of piece is it?` (T106's `ask.card.addKind`), `Is this your {item}?`, `This photo`, `In your closet`, `Yes, same one`, `Saved as your {item}.`, `Saved as its own piece: {item}.`, `Change`, the section names, `Kept as a new piece.` (old answers only). VoiceOver: `Back`; a tile's hint `Picks it`; `Selected`. No emoji, no all-caps.

## Data
Nothing new is stored. Answers go through the closet service exactly as today (`fitCheck.answerDuplicate` / `unanswerDuplicate`); the fit card's Skip uses today's key. CB4 answers `same` with a picked target and `new` with a confirmed kind through the same service (`patchCheckKeepCloset`); nothing leaves the phone. Which card is showing is screen state only. The old `closet.segment` value stays in storage, unread while the switch is off.

## Acceptance criteria
**Closet without Outfits (T73)**
- CB1.1 With the switch off, Closet with 3+ possible outfits shows no `Pieces` or `Outfits` label and opens on the pieces, even when `closet.segment` is saved as `outfits`.
- CB1.2 No screen reachable with the switch off shows `Next best buy`, `Goes with`, a piece's `Outfits` row, `Try next`, `Your go-tos`, `No outfits yet`, `outfits with what you own`, or a `+{n} fits` toast.
- CB1.3 The piece page note reads `Got one wrong? Change it here. The drawing follows. Your scores stay the same.`
- CB1.4 The morning card's `Wear this` still logs the outfit with Undo; Swap still swaps; Kit's outfit idea `Wear this` still works (existing tests stay green).
- CB1.5 With the switch on (a demo screen), Outfits, Next best buy and Goes with show exactly as before.

**One card at a time (T74)**
- CB2.1 With 4 open questions and a fit question, To confirm shows exactly one card, with `1 of 5`.
- CB2.2 `Yes, same one` saves through the closet service, the toast says `Saved as your {item}.` with Undo, and the card shows `1 of 4` with the next question.
- CB2.3 Undo after an answer brings that question back as the card on screen, with the count it had.
- CB2.4 A sideways swipe and `Skip ›` each show the next card and save nothing; on the last card they show the first (a swipe back on the first shows the last). With a single "Is this your …?" question there is no Skip.
- CB2.5 On the fit card, Skip hides it until a newer photo disagrees (as §18); tapping it opens its sheet.
- CB2.6 Answering the last question removes the card; the pieces grid moves up.
- CB2.7 Each picture is at most 120 pt tall at the default text size; one card is shorter than today's.
- CB2.8 VoiceOver hears `Question 2 of 5.` first; every answer and Skip is a button of at least 44×44 pt; no answer needs a swipe.
- CB2.9 With Reduce Motion on, changing cards uses no sliding.
- CB2.10 A question answered on the score card leaves the deck and the count updates.
- CB2.11 With questions open and nothing saved, To confirm is one folded row with the count waiting; a tap opens the card at the current question and the choice is kept; a new question while folded changes only the count. *(Nov 10, with the folded card.)*

**"What is it, then?" (T118)**
- CB4.1 On the card, in the deck and in the Added sheet's question, the chip reads `Not the same` (never `No, a new one`) and opens the sheet. `Yes, same one` and `It's my {item}` still answer at once.
- CB4.2 The sheet opens at the large detent with no step in between. It shows the title, the line, the photographed piece with its name, then only pieces of that piece's slot, then the `It's a new piece` row last. It never lists the piece he refused, the photographed piece, or a piece still waiting on an answer.
- CB4.3 Tile order: the runner-up first (when there is one), then newest first; `It's a new piece` is never above the tiles.
- CB4.4 A tap on a tile saves nothing; it selects it and shows `Is this your {item}?` with both pictures and `Yes, same one`. A second tap on it clears; a tap on another switches.
- CB4.5 `Yes, same one` on the selection folds the photo's piece into the picked piece exactly as `Yes, same one` on a question does (same rows, same worn count, never asked again), closes the sheet, and the card reads `Saved as your {item}.` with `Change`; `Change` undoes it as today.
- CB4.6 `It's a new piece` shows `What kind of piece is it?` with 2 to 4 kinds of the photographed piece's slot, the read kind first, each in the piece's color, then `Something else`. Back returns to the list with the selection cleared.
- CB4.7 A tap on a kind saves the piece as new with that kind confirmed (name and drawing follow), closes the sheet, and the card reads `Saved as its own piece: {item}.` with `Change`.
- CB4.8 With no other piece in the slot, the sheet opens on the kind step, shows `Nothing else like it in your closet yet.`, and has no Back.
- CB4.9 Closing the sheet without choosing saves nothing and the question is still open.
- CB4.10 The score on the card, and every later score, is the same before and after.
- CB4.11 The Added sheet's `Not the same` on a matched piece opens the same sheet; picking a piece moves that sighting there; a new piece splits it off with the kind confirmed; `Undo` and `Change` put the rows back as they were.
- CB4.12 VoiceOver reads the title and line, then the photographed piece, then `It's a new piece` as a button, then each tile as its name and `Picks it`; a selected tile says `Selected`. Every target is at least 44 pt; at the largest text nothing is cut off and the sheet opens at large.
- CB4.13 Light and dark screenshots of each state; every new word is in `en.ts`; nothing is all-caps or has an emoji.
- CB4.14 `Something else` opens the slot's full list of kinds, the same list the piece page's `What it is → Kind` offers for that slot, with Back to the 4.
- CB4.15 After a kind is tapped the other kinds stop taking taps until the write lands or fails; a failed write leaves the sheet open with nothing selected and nothing saved.
- CB4.16 `Change` on the new-piece line shows the question with `Not the same` marked and changes nothing; the earlier save is replaced only by a new choice.
- CB4.17 The new piece appears in Closet as a solid tile, named with the confirmed kind, first in its section.

## Touches
- T73: `app/src/app/(tabs)/closet/index.tsx`, `features/closet/` (PiecePage), `features/ask/` (the buy card's line), `config/features.ts` (the switch, shared), `i18n/en.ts` (one line, shared), demo screens for Outfits.
- T74: `app/src/app/(tabs)/closet/index.tsx`, `features/closet/` (DuplicateQuestion, FitQuestion, toConfirm and a new deck), `i18n/en.ts` (two strings, shared), a demo screen with 5 questions.
- T118 (CB4): `app/src/app/sheets/not-same/[checkId]/[obsId].tsx`, `app/src/app/_layout.tsx`, `features/closet/{NotSameSheet,notSame,DuplicateQuestion,ConfirmDeck,service}`, `features/fitcheck/service.ts`, `features/stylist/cards/FitCheckCard.tsx`, `features/added/AddedSheet.tsx`, `features/closet/answerToast.ts`, `i18n/en.ts` (shared), `demo/scenarios.ts`.
- Both edit Closet's screen, so T73 goes first and T74 builds on it.

## Assumptions
- The fit question joins the deck as its last card and counts in `n of total`.
- The card goes away after the last answer, without an "All set" screen.
- Kit keeps outfit gains as private evidence for ranking a buy; only the visible number goes.

## Later
- **Fewer questions about look-alikes.** The founder was asked about two pieces of the same kind and color that weren't the same one. The matcher asks for any non-negative score below 4 (and down to −4 for half-seen pieces). Check his phone's data, then decide in the scoring engine's lane, Python first (`@kitted/core` `closetIdentity.ts` `decide`).
- **Outfits back,** once it's good enough to show: the switch turns it all on again.
- The same one-card deck in the Added sheet, if testers find it crowded too.

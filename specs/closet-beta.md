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
4. The answers, as today: `Yes, same one` · `No, a new one` · `It's my {item}` when there's a runner-up.
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
- **Answering** saves the answer (as today, through the closet service), gives a light haptic, and the next card slides in from the trailing side. The toast says the answer with Undo, as today (`Saved as your khaki chinos.` / `Kept as a new piece.`).
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

## Data
Nothing new is stored. Answers go through the closet service exactly as today (`fitCheck.answerDuplicate` / `unanswerDuplicate`); the fit card's Skip uses today's key. Which card is showing is screen state only. The old `closet.segment` value stays in storage, unread while the switch is off.

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

## Touches
- T73: `app/src/app/(tabs)/closet/index.tsx`, `features/closet/` (PiecePage), `features/ask/` (the buy card's line), `config/features.ts` (the switch, shared), `i18n/en.ts` (one line, shared), demo screens for Outfits.
- T74: `app/src/app/(tabs)/closet/index.tsx`, `features/closet/` (DuplicateQuestion, FitQuestion, toConfirm and a new deck), `i18n/en.ts` (two strings, shared), a demo screen with 5 questions.
- Both edit Closet's screen, so T73 goes first and T74 builds on it.

## Assumptions
- The fit question joins the deck as its last card and counts in `n of total`.
- The card goes away after the last answer, without an "All set" screen.
- Kit keeps outfit gains as private evidence for ranking a buy; only the visible number goes.

## Later
- **Fewer questions about look-alikes.** The founder was asked about two pieces of the same kind and color that weren't the same one. The matcher asks for any non-negative score below 4 (and down to −4 for half-seen pieces). Check his phone's data, then decide in the scoring engine's lane, Python first (`@kitted/core` `closetIdentity.ts` `decide`).
- **Outfits back,** once it's good enough to show: the switch turns it all on again.
- The same one-card deck in the Added sheet, if testers find it crowded too.

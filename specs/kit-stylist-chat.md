# Kit, the stylist in the chat

After this, Kit answers like a stylist who knows him: one short line of words, then a picture of the answer. His own pieces come first. Pieces he'd need are drawn and marked. Colors are shown on the piece itself. When he says he owns something, Kit offers to add it. When he corrects Kit, the closet piece changes and the misread never comes back. Kit knows the app's own screens, and it remembers him from one day to the next.

**Part of:** `specs.md` F5 (Kit), F6 (the morning card, for dislikes only), F4 (fixing a misread). Works with `handoff/07-stylist-chat.md` (the engine, the context pack, the card path), `specs/explain-rating.md` (the Why button hands off to Kit; ER3 re-score), `specs/closet-beta.md` (Outfits and outfit counts off in the beta), `rubric/stylist-guide.md` (what Kit knows, its voice). Mockup: `mockups/kit-stylist-chat.html` (dark and light).

## Why
On Nov 12 the founder's friend used the beta for one evening: three fit checks, then 20 questions (`inputs/2026-11-12-thursday-chat/review.md`, git-ignored). The founder paused the friends' beta on Nov 16 to fix what went wrong, worst first:
1. Kit said "I can't add an unphotographed piece to your closet" while it quietly added the piece. The piece then showed up in every outfit card.
2. Kit ignored his corrections. "My boots are black" left the closet piece "dark brown work boots". "The olive tee is a sweater" stayed "olive tee".
3. The drawing contradicted the name: "Black work boots" was drawn brown in every card.
4. Kit didn't answer the question asked. "An alternative to the tan bomber" got a shirt, then a sweater, when he wanted a jacket. The same 3–4 owned pieces kept coming back.
5. Kit contradicted its own cards and didn't know the app. It showed a "Next buy: Olive overshirt" card, then said the buy list had no overshirt, then sent him to a "buy-next section" that doesn't exist. Next buy has no home in the beta, because Closet's Outfits view is switched off.
6. Color advice and pieces he didn't own were words only, with nothing drawn. Each answer ran 55–70 words.

The founder wants the chat to feel like a real stylist with the full picture of who he is and what he owns. The research (`reports/2026-11-16-chat-visuals-research.md`) ranks the same patterns: short words, then one picture of the answer, owned and not-owned pieces marked apart, a confirm card with Undo, 2–3 follow-up taps, and named colors from a fixed palette.

## Scope
- **In:** how an answer is shaped (KC1); outfit cards with his pieces first, pieces he'd need, examples and options (KC2); colors drawn on the piece (KC3); the add card (KC4); corrections and dislikes (KC5); Kit knowing the app and its own cards, and the drawn buy card as Next buy's beta home (KC6); memory across days (KC7); shops (KC8); watch, belt, cap and beanie drawings (KC9); what counts as a question, and the beta limit of 30 (KC10); the test that proves it (KC11).
- **For the beta:** all of it, memory included, before friends test again (the founder, Nov 17).
- **Out (non-goals):**
  - Brand names, shop names, links to products or stores, affiliate links, a "Find one" search button.
  - Prices of specific products. A buy card's price range is the Starter catalog's, as today.
  - Drawings for rings, bracelets, chains, bags, sunglasses (words only).
  - Try-on, or any picture of him or of a person.
  - Any color tied to his skin, face, hair or eyes.
  - Any change to a score. Kit still never gives or changes a score; only a fit check or the existing Re-score does.
  - Photos in the chat beyond today's behavior (a photo is still a fit check).
  - Closet's Outfits view and outfit counts: they stay off in the beta (`specs/closet-beta.md`).

## What he sees

### The shape of an answer
1. **One bold line** that is the move ("Swap the olive sweater for your cream striped button-up."), then at most one short line of why, in grey.
2. **One card under it** that is the answer as a picture: an outfit, options, colors, an add card, a changed piece, or a buy card. At most one card per answer.
3. **2–3 follow-up taps** under the latest answer only ("Make it dressier", "Show me jackets"). A tap sends it as his message.

### An outfit card (KC2)
- His own pieces sit on solid tiles with their closet names, as today.
- A piece he doesn't own is drawn in the color Kit means on a **dashed tile**, with `You'd need` under its name. The card's tag reads `From your closet + 1` (or `+ 2`).
- When his closet can't make the outfit (more than 2 pieces he'd need, or none of his own), the whole card is drawn and titled `Example`. No tile says `Yours` or `You'd need`, and Kit's words call it an example.
- Watch, belt, cap and beanie can sit at the end of an outfit, drawn like any piece.
- **Tapping a `You'd need` tile** opens a small menu: `I have one` (adds it to Closet as drawn, with Undo) and `Next buy` (opens the Next buy sheet for that kind of piece, when the catalog has one).

### An options card (KC2)
When he asks for choices ("alternatives to the tan bomber", "what jacket should I get?"), one card shows 2 or 3 pieces side by side, all of the same kind he asked about. His own matching pieces come first and say `Yours`; the rest are drawn with `You'd need`.

### A colors card (KC3)
- **About a piece** ("what color should the collared shirt be?"): that piece drawn once per color, 2 or 3 of them, each named under it (`Off-white`, `Light blue`). Header: `Colors for the collared shirt`.
- **In general** ("what goes with olive?"): a row of 3–5 round swatches, each with its name under it. Header: `Goes with olive`.
- Every color is one of the app's 25 named colors.

### The add card (KC4)
- He mentions a piece he owns that isn't in his closet ("I have a nice one with light brown stripes, kind of off-white"). Under Kit's answer: the piece drawn with its name (`Cream striped button-up`), `Want me to add this to your closet?`, then `Add` and `No thanks`.
- **Add:** the card becomes `Added to Closet · Undo`. Tapping the drawn piece opens its Closet page, where he can change the name, color or kind.
- **No thanks:** the card becomes `Not added`, and Kit never offers that piece again unless he asks.
- **He asks outright** ("can you add that to my closet?"): it's added at once and shown as `Added to Closet · Undo`, and Kit's words say it's added.
- **Already in his closet** (same kind, same color family): no card. Kit just uses that piece by name.

### A correction (KC5)
- He says "my boots are black" or "the olive tee is a sweater". The piece changes at once. Under Kit's answer: the piece redrawn with its new name (`Black work boots`), `Changed · Undo`.
- If that piece was in a scored check, a `Re-score` tap is offered (`specs/explain-rating.md` ER3.1).
- If it's unclear which piece he means, a tap card shows the candidates drawn (`Which boots?`). Nothing changes until he taps one.
- He says he doesn't like one of his pieces ("I don't really like that jacket"). It's saved as `You'd rather not wear your tan bomber` with `Saved to what I know · Undo`, and Kit and the morning card stop suggesting it.

### The buy card (KC6)
`Next buy` and the price range on its tag line, the piece drawn in its color, its name, and one line of why. Tapping it opens the Next buy sheet (which already exists). In the beta this card is Next buy's only home. Asked where Next buy is, Kit says to ask it ("Ask me what to buy next, and I'll show it here.").

### Shops (KC8)
Asked where to buy, Kit says so plainly and gives what to look for, with the piece drawn: "I don't point to shops, but here's what to look for: a cotton or canvas overshirt, straight hem, room for a sweater under it."

## KC1. The shape of an answer
- KC1.1 With a card, Kit's words are at most 40 words: a first line of at most 15 words, then at most one more sentence. With no card, at most 60 words. An over-long answer is cut at a sentence end, keeping the first line.
- KC1.2 An answer carries at most one card.
- KC1.3 Follow-up taps: 0 to 3 under the latest Kit answer only. Each is at most 30 characters, in sentence case, with no emoji, about clothes, and not a repeat of what he just asked. They are proposed by the model and checked by code, which drops any that fail. They go away when he sends his next message, and never show under a limit line, a decline, the support card or an error.
- KC1.4 Kit never says it can't do something the app just did or can do (add a piece, change a piece, show an outfit), and never says it did something the code didn't do. Checked on the test set (KC11).
- KC1.5 Every card a Kit answer shows is rebuilt in Past chats from what was stored. A drawn piece always redraws; one of his pieces removed since shows `No longer in your closet`. Past chats' buttons (Add, No thanks, Undo) are read-only and show the outcome (`Added`, `Not added`).

## KC2. Outfits, options and examples
- KC2.1 **His pieces first:** when his closet has a piece of the kind the outfit needs (not deleted, not one he'd rather not wear), the card uses his piece, not a drawn one.
- KC2.2 A piece he doesn't own is drawn in one of the 25 named colors on a dashed tile with `You'd need`. The tag reads `From your closet + n`. A drawn piece never says `Yours`.
- KC2.3 With more than 2 pieces he'd need, or none of his own, the card is an `Example`: every piece drawn, no `Yours` or `You'd need`, never `From your closet`. Example pieces come from his picked looks first (`LOOKS`), then the Starter catalog **(assumed)**.
- KC2.4 An options card holds 2 or 3 choices, all from the slot he asked about (a jacket question gets outerwear only). It never includes the piece he asked to replace, and his own pieces that fit come first with `Yours`.
- KC2.5 **The question asked:** "an alternative to X" shows choices from X's slot, none of them X. "A jacket, not a sweater" shows jacket kinds only. On the test set, 100% of these answers pass.
- KC2.6 The same outfit (the same set of pieces) isn't shown twice in one chat day unless he asks for it again (the rotation from `handoff/07` §22 also applies to cards).
- KC2.7 **The drawing matches the name:** every piece in a card is drawn in the color family its name says ("Black work boots" draws black). A closet piece whose name's color word and color family disagree is a bug, caught by a test over the closet code.
- KC2.8 A piece he'd rather not wear (KC5.7) never appears in Kit's outfit, options or example cards, or in the morning card, while that fact exists. It stays in Closet and scores normally in a fit check.
- KC2.9 An outfit card holds 3–5 clothing tiles plus up to 2 accessories (KC9), accessories last **(assumed)**.
- KC2.10 A `You'd need` tile's `I have one` adds the piece exactly as KC4.3 does. `Next buy` opens the Next buy sheet when the piece's kind has a Starter entry; otherwise the menu shows only `I have one`.

## KC3. Colors
- KC3.1 A color question about a piece gets a colors card: that piece drawn once per color, 2 or 3 colors, each named under it with the app's display name.
- KC3.2 A general color question gets a row of 3–5 named round swatches.
- KC3.3 **The code judges the colors:** before Kit answers a color question, the code works out which of the 25 colors are allowed. These are the colors the scoring rules would not mark down in that outfit (the outfit in the chat, or today's check). The model may pick only from that list. A sentence naming a color outside the list (other than his own pieces' colors) is dropped by the sentence gate, and a card color outside it drops the card. If fewer than 2 colors survive, the answer has no colors card.
- KC3.4 Every swatch and colored piece shows its color's name in text (color is never the only carrier), and reads clearly in light and dark.
- KC3.5 No color advice mentions his skin, face, hair, eyes or "your coloring". "What colors suit my skin?" gets `I rate outfits, never people.` and then colors that go with his own pieces.

## KC4. The add card
- KC4.1 When he mentions owning a piece ("I have…", "I own…", "I got…", "I bought…"), the code reads its kind and color from his words. If his closet already has a piece of the same kind and color family, there's no card, and Kit uses that piece by its closet name.
- KC4.2 Otherwise the add card shows: the piece drawn, its name, `Want me to add this to your closet?`, `Add`, `No thanks`. Nothing is written to Closet before `Add`.
- KC4.3 `Add` writes one closet piece through the closet service (`source: 'chat'`, not photographed, dashed tile, `From chat`). The card becomes `Added to Closet · Undo`, and Undo removes the piece. Tapping the drawn piece opens its Closet page.
- KC4.4 `No thanks` writes no piece. The card reads `Not added`, and that kind-and-color is never offered again unless he asks to add it.
- KC4.5 **He asks to add it** ("add it", "can you add that to my closet"): the code adds it before Kit answers, Kit's words say it's added, and the answer shows `Added to Closet · Undo` with the drawing.
- KC4.6 For a mention, Kit's words say nothing about adding (the card does the asking). They never say "I can't add" and never say "added" unless the code added it.
- KC4.7 If the code can't tell what kind of piece he means, there's no add card. Kit asks what kind it is, as a tap question with 2–4 kinds when it can narrow them down.
- KC4.8 The same piece is offered at most once a chat day.
- KC4.9 `Add`, `No thanks`, `Undo` and `I have one` never use a question.

## KC5. Corrections and dislikes
- KC5.1 "My X is Y", "my X are Y", "that's a Y", "it has stripes": the code changes that closet piece's color family, kind or pattern, rewrites its name to match ("Dark brown work boots" becomes "Black work boots"), and redraws it. The answer shows the piece redrawn with `Changed · Undo`, and Undo restores every field.
- KC5.2 After a correction, no answer that day or later names that piece by its old color or kind. The context pack carries only the new values, and the gate rewrites a mention of one of his pieces with a wrong color word to its closet name.
- KC5.3 **Which piece:** the one of that kind Kit named most recently in today's chat. If there's none, or two fit equally, a tap card shows the candidates drawn, and nothing changes until he taps one.
- KC5.4 If the corrected piece was in a scored check today, the answer offers `Re-score` for that check (`specs/explain-rating.md` ER3.1). The correction itself never changes a score.
- KC5.5 **Free:** a message in which the code changed one of his pieces doesn't use a question, on the phone or on the server, even if it also asks something. A message that changes nothing counts as usual.
- KC5.6 A correction to a piece in today's check updates the closet piece only. The check's reading changes only through Re-score (F4.1).
- KC5.7 **Dislikes:** "I don't like my X" or "I don't really like that jacket" saves a `piece_dislike` fact (`You'd rather not wear your tan bomber`) with `Saved to what I know · Undo`. KC2.8 then applies until he deletes the fact in What Kit knows. A dislike message counts as a question.

## KC6. Kit knows the app and its own cards
- KC6.1 Kit's rules carry a short **app map** built by code from the app's feature switches: the four tabs and what each holds, where Next buy is (in the beta, Kit's buy card in the chat), and what a fit check, re-check, Explain rating, Lookbook, Past chats and What Kit knows are. A screen that's switched off is never in the map.
- KC6.2 Asked where something is or how the app works, Kit names only places in the map. On a set of 15 app questions in the test set, 15 of 15 pass: no invented screen, section or button.
- KC6.3 Kit sees the cards it showed today (type and contents: the pieces, the buy, the colors) and never contradicts them. After a Next buy card for an olive overshirt, it never says the buy list has no overshirt. Checked on the test set.
- KC6.4 The buy card draws the piece in its color, with its name, the Starter price range and one reason line, and a tap opens the Next buy sheet. In the beta it shows no outfit count (`specs/closet-beta.md`).
- KC6.5 The guide's facts are right: the test set includes basic clothing facts Kit got wrong or could ("a knit is not woven"), and the guide is fixed where it was wrong.

## KC7. Memory across days
- KC7.1 New fact kinds, each saved with `Saved to what I know · Undo` and listed in What Kit knows with its date, deletable: `piece_dislike` (KC5.7) and `shopping_for` (what he's looking to buy, with his budget if he said one: "A jacket to replace the tan bomber, around $115"). `occasions_coming` already exists. A `shopping_for` fact stays until he deletes it **(assumed)**.
- KC7.2 Each question carries a **7-day recap** built by code on the phone from Past chats. Per day, it lists the outfits, options and buy cards Kit showed (piece names only) and his taps (Wear this, Add, No thanks, I have one, Re-score). It never includes his words or Kit's words, and is at most 25 lines.
- KC7.3 Deleting a day's chat takes it out of the recap; Delete all my data takes all of it.
- KC7.4 Kit uses what it knows without announcing it (guide §0). On the test set, a day-2 "what jacket should I get?" after a day-1 `shopping_for` fact gets jackets within that budget, none of them the disliked piece.
- KC7.5 What's sent stays clothes and choices: no photo, no name, no birth year, no location (`handoff/07` §3.2, which this changes only to allow the recap).

## KC8. Shops
- KC8.1 Kit never names a brand, a shop, a link, or a specific product's price. A sentence that does is dropped by the gate.
- KC8.2 Asked where to buy, Kit follows the guide's line: "I don't point to shops, but here's what to look for:" then one or two specifics (fabric, cut, length). The answer carries a drawn piece (a buy or options card) when one fits.

## KC9. Accessory drawings
- KC9.1 A watch, a belt, a cap and a beanie are drawn in code like the other pieces (never AI images), in light and dark, in any palette color, at closet-tile and card sizes.
- KC9.2 A watch can show a metal tone (gold, silver or black) as a drawing detail, not a new color family. Accessories still never affect a score (the rubric already leaves them out).
- KC9.3 A piece he adds from chat ("I have a gold digital watch") draws with these drawings in Closet too.

## KC10. What counts, and the beta limit
- KC10.1 The beta gives 30 questions a day, on the phone and on the server. Launch stays 3 free and 30 Pro (`specs.md`).
- KC10.2 **Counted:** a typed or dictated question, and a follow-up tap.
- KC10.3 **Not counted:** a message that changed a piece (KC5.5); Add, No thanks, Undo, I have one; Kit's own tap questions (as today); Explain rating; declines; errors.
- KC10.4 The server lets at most 10 uncounted corrections a day per device, then counts them **(assumed: keeps the free path from being a way around the limit)**.

## KC11. The test that proves it
- KC11.1 A test set of about 40 questions on a test closet built from Thursday's (tan bomber, olive sweater, dark jeans, black work boots, cream striped button-up). It covers Thursday's 20 questions and at least 2 per criterion group above. Profile: unknown (Thursday's tester gave none), run with one stated test profile (CLAUDE.md rule 6).
- KC11.2 Pass marks are written down before any answer is read: KC1.1 lengths 100%; KC1.4 no "I can't" or false "added" 100%; KC2.5 the question asked 100%; KC3.3 colors only from the allowed list 100%; KC6.2 app places 15 of 15; KC6.3 no contradiction 100%; KC8.1 no brand 100%; nothing about his body 100%.
- KC11.3 One paid run through the real model, up to 10¢ (the founder's OK, Nov 17), quoted in cents before it runs. Then the founder (or a friend) repeats Thursday's evening on a build and says whether it feels like a stylist.

## Data
- **Cards (the chat message's `askCard`, stored once):**
  - `outfit` gains `needs` (drawn pieces: kind, color family, name) and `example: true|false`;
  - new `options` (2–3 entries, each one of his piece ids or a drawn piece);
  - new `colors` (a piece kind and 2–3 color families, or 3–5 families as swatches);
  - new `add` (the drawn piece, the outcome `asked | added | declined`, and the new piece id once added);
  - new `changed` (the piece id and its fields before and after, for Undo);
  - `buy` stays and is drawn;
  - follow-up taps are stored on the message.
- **Facts:** `piece_dislike` (a piece id), `shopping_for` (words, an optional budget). Same table, same tombstones.
- **Declined adds:** a list of kind-and-color-family keys kept on the phone (not a fact about him; no Undo needed).
- **Closet:** pieces from chat as today (`source: 'chat'`). Corrections and adds go through the closet service.
- **The recap:** built for each question from `chat_messages` and never stored.
- **Server usage:** a correction logged as uncounted (KC10.4); the beta limit raised to 30.

## Failure and edge cases
| Situation | What happens |
|---|---|
| The model names a piece id that doesn't exist, or an outfit that fails `outfitValid` | The card is dropped and the words stay (today's rule) |
| The model proposes a color outside the allowed list | That sentence is dropped. The card is dropped if it holds that color |
| Fewer than 2 options pass the slot rule | No options card; the words still answer |
| Offline when he taps Add, No thanks or Undo | It works: the closet is on the phone |
| He corrects a piece that's in no check | The piece changes; no Re-score offered |
| He mentions two pieces in one message | One add card, for the first new piece **(assumed)**. Kit can offer the second in its next answer |
| His closet is empty | Example cards only; the add card is how his closet starts |
| A drawn piece's kind can't be drawn | The tile shows the closest kind of the same slot with the right color **(assumed)** |

**Never:** a drawn piece labelled as his; a card saying `From your closet` when none of it is his; a closet piece added or changed without a visible line and Undo; Kit's words denying what the code did; a color tied to his skin or face; a brand or shop; a score in Kit's words other than a check's own.

## Touches
- `app/src/features/ask/`: the closing block's new card types, their checks (`cards.ts`, `closing.ts`), the router's mention/ask/correction/dislike kinds (`router.ts`), the add and correction actions (`memory.ts`, split into a chat-piece writer), the color evidence and app map (`evidence.ts`, `context.ts`, `prompt.ts`), the recap (`context.ts`), the gate's color, brand and piece-name rules (`gate.ts`), the length cut, the follow-ups.
- `app/src/features/ask/AskCardView.tsx`, `stylist/cards/OutfitTiles.tsx` and new card views: dashed `You'd need` tiles, the Example title, options, colors, add, changed, the drawn buy card, the follow-up row. Light, dark and the largest text size.
- `app/src/features/closet/{flats,artSpec,GarmentArt}.ts(x)`: a drawn piece without a closet row, and the four accessory drawings (Closet lane).
- The closet service: add a chat piece, correct a piece, with Undo (Closet lane).
- `@kitted/core`: a new function giving the colors the scoring rules allow for one slot in an outfit. It reads the rules and changes no score; parity stays 100% (Fit check and scoring lane, strict).
- `app/src/features/morning/`: leaves disliked pieces out before picking (Kit lane).
- `app/src/features/you/`: What Kit knows shows the two new fact kinds (Setup and You lane).
- `app/src/services/quota.ts` and `firebase/`: the beta limit of 30, and uncounted corrections up to 10 a day.
- `rubric/stylist-guide.md` and `guide.generated.ts`: the shop line, the short-answer rule, the knit/woven fix, "the card does the asking".
- `app/src/i18n/en.ts`: the card words.
- **Must not break:** same photo, same score; Explain rating (ER1); the support card and declines; "the code knows, the AI talks" (every number and every card from code); Past chats reading old messages that have the old card shapes.

## Changes to other documents (made with this spec's approval)
- `specs/explain-rating.md` → Assumptions: "Saying a misread to Kit counts as a question" is replaced by KC5.5 (a correction that changes a piece is free).
- `specs/free-and-pro.md` FP7: the beta's 20 questions become 30.
- `handoff/07-stylist-chat.md` §3.2: "Past chats before today" never sent, except the 7-day recap (KC7.2). §2.2's brand line stays.
- `specs.md` → the data table's "Questions to Kit" row gains "and a 7-day recap of Kit's own suggestions, as piece names".

## Assumptions
- Example pieces come from his picked looks first, then the Starter catalog (KC2.3).
- An outfit card holds up to 2 accessories, last (KC2.9).
- More than 2 pieces he'd need turns the card into an Example (KC2.3).
- A `shopping_for` fact stays until he deletes it (KC7.1).
- At most 10 uncounted corrections a day on the server (KC10.4).
- One add card per answer when he mentions two new pieces.
- The code checks colors against the scoring rules, and Kit picks only from the allowed list (KC3.3). Settled by Claude: it's the "code judges" rule applied to color.
- The app map is built from the feature switches (KC6.1). Settled by Claude.
- Cost: the recap, the app map and the color evidence add about 400–700 tokens to each question, roughly 0.04–0.05¢ a question on today's model. 30 questions a tester a day is at most about 1.5¢, under the server's daily spend cap.

## Copy (drafts; words users read, the founder OKs them with the spec)
`From your closet + 1` · `Example` · `You'd need` · `Yours` · `I have one` · `Next buy` · `Colors for the {piece}` · `Goes with {color}` · `Want me to add this to your closet?` · `Add` · `No thanks` · `Added to Closet · Undo` · `Not added` · `Changed · Undo` · `Which {pieces}?` · `You'd rather not wear your {piece}` · `Re-score` · Kit's shop line: "I don't point to shops, but here's what to look for:" · Kit on Next buy: "Ask me what to buy next, and I'll show it here."

## Later
- Brand names from a list the founder approves, grouped by price, and a `Find one` web-search button (the founder chose "keep refusing" for now, Nov 17).
- Affiliate links (needs an affiliate account, a disclosure line and App Review care).
- Drawings for rings, bracelets, chains, bags, sunglasses.
- Two cards in one answer (an outfit and a separate colors card), if one card with choices feels too tight.
- Next buy back in Closet when Outfits returns after the beta.
- The whole outfit redrawn once per color.

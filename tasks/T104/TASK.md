# T104 · Kit's card views

**Size:** normal · **From:** `plan.md` → T104 · **Spec:** `specs/kit-stylist-chat.md` (approved Nov 17), drawn in `mockups/kit-stylist-chat.html` · **Lane:** Kit's stylist chat

## What changes
- **Goal:** the card shapes T102 stores are drawn under Kit's answer: an outfit with dashed "You'd need" tiles (or a whole drawn Example), options, colors (pieces or named swatches), the add card's three states, Changed · Undo, the drawn buy card that opens Next buy, and 2–3 follow-up taps under the latest answer. Every card is only as wide as its tiles.
- **Files:**
  - `ask/AskCardView.tsx`: routes every card type; the outfit card's tag line, needs and Example
  - `stylist/cards/OutfitTiles.tsx`: fixed-size tiles (76 pt, scaled with text), drawn tiles with `You'd need` / `Yours`, wrapping, a width that fits the tiles
  - new `ask/KitCardViews.tsx`: options, colors, add, changed, the drawn buy card, the follow-up row
  - new `ask/needMenu.ts` (+ `.web.ts`): the `I have one` / `Next buy` menu (iOS action sheet)
  - new `ask/cardActions.ts`: the seam T106/T107 fill (Add, No thanks, Undo, I have one)
  - `ask/cards.ts`: `cardSpoken` for the new shapes (VoiceOver), the tag-line and menu helpers
  - `closet/NextBuySheet.tsx` (borrowed from the Closet lane): opened with one Starter piece from Kit's card
  - `stylist/MessageView.tsx`, `stylist/StylistScreen.tsx`: the follow-up row under the latest answer
  - `i18n/en.ts`: the card words (the spec's copy list)
  - `demo/scenarios.ts`, `demo/prepareDemoScreen.ts`: demo screens 400–418
- **Done means:**
  - KC1.6 · tiles one fixed size; a card is as wide as its content (2 colors narrow, 6 pieces wrap); default and largest text
  - KC2.2 · a drawn piece he'd need: dashed tile, its color, `You'd need`; tag `From your closet + n`; never `Yours`
  - KC2.3 · Example: every piece drawn, titled `Example`, no `Yours` / `You'd need` / `From your closet`
  - KC2.10 (the tile) · tapping a `You'd need` tile opens `I have one` / `Next buy`; `Next buy` only when the kind has a Starter entry
  - KC3.1 · colors about a piece: the piece drawn once per color, each named
  - KC3.2 · colors in general: 3–5 named round swatches
  - KC3.4 · every swatch and colored piece carries its color name in text; reads in light and dark
  - KC4.2 (the card) · piece drawn, name, `Want me to add this to your closet?`, `Add`, `No thanks`; then `Added to Closet · Undo` / `Not added`
  - KC6.4 · buy card: drawn piece, name, Starter price range, one reason line; a tap opens Next buy; no outfit count in the beta
- **Must not break:** old stored outfit cards (no `needs`) draw as before; Past chats are read-only and show outcomes; the morning card's compact tiles; "bracelet" never reaches a user.

## Calls settled while the founder is away (listed for him in the PR)
- **Words from the mockup, not the spec's copy list:** the options card's tag `Options`; the outfit tag's left side is the occasion (`Dinner`), and an Example's right side is the occasion. The mockup's `Instead of your tan bomber` needs data T102 doesn't store, so it's left out.
- **Already decided by the founder in T102 (#493), followed here:** Past chats' add card says `Added` / `Not added`, and one never answered shows the piece alone with no buttons; an undone change reads `Changed back`; drawn pieces use the closet's own noun (so the colors header reads `Colors for the oxford`, not the mockup's "collared shirt").
- **The menu is the iOS action sheet** (with Cancel), not the mockup's popover: a popover anchored to a tile needs a new package. Same two choices, same words.
- **The Next buy sheet is off in the beta** (it sends him to Closet). Opened from Kit's card, it now shows that one piece: drawn, its name, its price range and Got it, with no outfit counts. Settled by Claude; logged.
- **Add, No thanks, Undo and I have one** draw here; what they do is T106 (adds) and T107 (corrections). Until T106, `I have one` stays out of the menu (an outfit card from the model can reach a tester), and the add and changed cards can't appear outside demo screens (only code builds them).

## The card's entrance (approved)
- **The founder approved it on Nov 18** (proposal 1 of `reports/2026-11-18-chat-feel-research.md`, PR #150; relayed by the control session). About 120 ms after the answer's words finish, the card fades in while rising 12 pt over 280 ms, then the follow-up taps fade in 50 ms apart; Reduce Motion: fades only; once per new answer, never in Past chats or on scroll-back. It lands as its own commit for a clean history (log #496).

## Built
- **Changed:** the outfit card draws his pieces then the drawn ones (dashed with `You'd need`, or plain in an Example titled `Example` with `Check my fit`); the tag reads `<occasion> · From your closet + n`. New views for options, colors (pieces or swatches), the add card (asking, added with Undo and a tap to open the piece, not added; Past chats read-only), Changed · Undo / Changed back, and the drawn buy card (tap → the Next buy sheet on that piece). A `You'd need` tile opens the action sheet when it has a row. The follow-up taps sit under the latest answer only and send as his message. Tiles are 76 pt (up to 1.5x with text); every card hugs its content. `cardSpoken` gives every new card a VoiceOver line made of its own words. Demo screens 400–412.
- **Tests added:** `app/src/__tests__/T104-cardViews.test.tsx` (25: KC1.6, KC2.2, KC2.3, KC2.10, KC3.1, KC3.2, KC3.4, KC4.2, KC6.4, the VoiceOver lines, "bracelet"). `closetNoOutfits.test.tsx`'s mocks gained the tiles module's new exports, the drawing and `useLocalSearchParams` (no assertion changed).
- **Screenshots (iOS Simulator, iPhone 17 Pro, this branch's code):** `tasks/T104/shots/`, 12 states in light and dark, 7 at the largest text size (`-light-xxxl`): `01-outfit-you-would-need` (demo 400, with the follow-up taps), `02-outfit-six-pieces` (401, wraps to a second row), `03-example` (402), `04-options` (403), `05-colors` (404: two colors narrow, five swatches in one row), `06-add-asking` (405), `07-add-added` (406), `08-add-not-added` (407), `09-changed` (408), `10-buy-card` (409), `11-past-chats` (410, read-only), `12-next-buy-sheet` (411). The card's entrance: `13-entrance-light.mp4` (3 s) and `13-entrance-strip-light.jpg` (15 frames a second).
- **Fixed from the shots:** at the largest text, swatch names, tile names and the buy card's name broke mid-word: tiles now grow to 2x (two to a row), swatches become a list, the buy card stacks; five swatches now fit one row at default size.
- **Not done or not checked:** the "You'd need" action sheet itself wasn't opened on the Simulator (the menu's rows are tested; the sheet is the stock iOS one); the follow-up taps' own fade isn't in the recording (the recorded demo answer has no taps; its timing is tested); Add, No thanks, Undo and I have one do nothing until T106/T107 (by design). Demo screens are layout only (cards stored directly, not built from the model).

## Review
### Round 1 (code and spec read; no screenshots yet)
Ran `npx jest src/__tests__/T104-cardViews.test.tsx`: 25 passed. `npm run check`, Simulator, Metro not run (low memory).
- KC1.6 tiles one fixed size, card hugs content: done in code (tileSize, tilesWidth, HUG); looks right at default/largest text: can't tell yet (needs shots).
- KC2.2 dashed tile, color, `You'd need`, tag `From your closet + n`, never `Yours`: done.
- KC2.3 Example drawn plain, titled `Example`, no `Yours`/`You'd need`/`From your closet`: done.
- KC2.10 tile menu, `Next buy` only with a Starter entry; `I have one` held back by ADD_READY=false (T106): done. The iOS action sheet itself: can't tell yet.
- KC3.1 / KC3.2 / KC3.4 colors, names in text: done in code; light/dark legibility of swatches: can't tell yet.
- KC4.2 add card three states, Past chats read-only (#493): done.
- KC6.4 buy card drawn, name, price range, reason, tap opens Next buy on that piece, no outfit count: done.
- Must not break: morning compact tiles kept (OutfitTiles compact path); old needs-less cards draw as before; "bracelet" test passes; no emoji/rank/streak, nothing new leaves the phone.
- Words: new strings match the spec list; `Options` and the tag orders are from the mockup and logged as #495.
Defects: none open.
Small things for later (never blocking):
- OutfitTiles.tsx: the `needs` prop was dropped from `OutfitTiles`; only MorningCard uses it, so fine, but check no other lane's branch passes it.
- NextBuySheet StarterPiece shows no reason line (the card has one); fine for the beta.
- needMenu.web.ts picks the first row on tap (preview only).
- Can't tell yet, needs the iOS shots: clipped swatch names/tile names at the largest text, dashed tile contrast in dark mode, the add card at accessibility size.
Verdict: **Ready** (code and spec checks); the visual checks wait for the shots on the second pass.

### Round 2 (shots read; diff 5fb20d0b..HEAD read; no tests run, as asked)
- KC1.6 default and largest text: done. Tiles are one size, two to a row at the largest size, names no longer break mid-word (shots 01, 06 xxxl; dark 01 shows four tiles in one row, `You'd need` under the dashed tile).
- Dark-mode legibility: done. Dashed tile border and the copper `You'd need` read in dark (01-dark); the five swatches and their names are legible with a visible ring (05-dark).
- Add card at accessibility size: done (06-add-asking-light-xxxl): stacked art, name, question, Add and No thanks all whole.
- Entrance (#496): once per new answer: done (`cards` set filled only from the live row, `cardEnters` false once drawn; tests cover re-render, next answer, rows that moved in whole). Never in Past chats: done (`attachmentEnters` false when read-only; PastChats passes no `enter`). Reduce Motion fades only: done (200 ms FadeIn, no translate). Tests can fail: yes, they assert exact delays, rise, durations and the Past-chats source.
- Defects: none blocking.
- Small things for later (never blocking):
  - Enter.tsx / StylistScreen.tsx:121: `arrivals.drawn` runs in an effect and doesn't re-render, so the next render of the row flips `Enter` from an Animated.View to a bare fragment, which remounts the card (and the taps). If any re-render lands inside the first ~400-500 ms, the animation can be cut short and the card redraws once. Fix idea: keep the wrapper stable (always Animated.View, `entering` only when `on`), or latch `on` in a ref. Can't tell on the Simulator without a re-render during the beat; worth one look on a real answer.
  - The entrance itself is only seen in the strip 13-entrance-strip-light.jpg; I did not review the .mp4.
  - `Swatches` at default size uses fixed 60 pt cells; fine for five, check if a sixth is ever allowed.
Verdict: **Ready**.

### The fix round (by the building session, after round 2)
- **Fixed:** the reviewer's remount note. `Enter` is now always the same `Animated.View`, its entrance fixed at first mount (`useState`), so a re-render after the row is drawn never swaps the wrapper or remounts the card. New test in `T104-cardEntrance.test.ts`; it fails on the old wrapper (checked) and passes now.
- **Also:** `T35-hello` and `T39-offerCard` render the chat row, which now reaches Reanimated through the wrapper: both got a pass-through mock of `Enter` (like the cards they already mock). No assertion changed.
- Swatches: a colors card holds 3–5 (`buildCard`), so a sixth can't occur.

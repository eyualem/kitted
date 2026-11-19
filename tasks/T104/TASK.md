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
- **Past chats' add card:** `Added` / `Not added` (the spec's KC1.5 words). An add card never answered reads `Not added`.
- **The menu is the iOS action sheet** (with Cancel), not the mockup's popover: a popover anchored to a tile needs a new package. Same two choices, same words.
- **The Next buy sheet is off in the beta** (it sends him to Closet). Opened from Kit's card, it now shows that one piece: drawn, its name, its price range and Got it, with no outfit counts. Settled by Claude; logged.
- **Add, No thanks, Undo and I have one** draw here; what they do is T106 (adds) and T107 (corrections). Until T106, `I have one` stays out of the menu (an outfit card from the model can reach a tester), and the add and changed cards can't appear outside demo screens (only code builds them).

## Built
- **Changed:**
- **Tests added:**
- **Screenshots:**
- **Not done or not checked:**

## Review
Written by the reviewer.

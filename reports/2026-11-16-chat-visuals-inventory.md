# Chat visuals inventory: what Kit's answers can already draw

Read-only look at the code (Nov 16), feeding the spec interview for "Kit shows, not just tells". Nothing was changed or run. Paths are under `app/src/`.

**The short version.** Almost everything Kit needs to draw already exists, and it needs only a part name and a color, not a closet row. Three things are missing: a way to draw a piece he doesn't own inside a chat answer, color swatches as their own card, and the "Add / No thanks" card. Today, "I have a white tee" is saved silently by the model; there's no question first.

## Reusable today

All drawings are made by code (SVG), never AI images and never his photo.

| Visual | What it draws | Data it needs | Where it shows today |
| --- | --- | --- | --- |
| `GarmentArt` / `PieceArt` (`features/closet/GarmentArt.tsx`) | One piece, in its own color, any size | `{garment, hex}` (`artSpec` + `renderFlat` in `closet/artSpec.ts`, `closet/flats.ts`). `art` and `name` optional | Closet tiles, morning card, chat outfit card |
| `ClosetTile` | A piece on a tile; dashed and faded if never photographed | A closet row | Closet grid, rows |
| `StandingOutfit` (`closet/StandingOutfit.tsx`) | A whole outfit on one 3:4 tile, a layer at the side, a "would buy" piece ghosted | Closet rows by slot | Outfits view in Closet |
| `DrawnOutfit` / `DrawnOutfitBubble` (`onboarding/DrawnOutfit.tsx`, `outfitDrawing.ts`) | A whole outfit from a reading, no closet involved | `drawnPieces(reading)`: part names + `FAMILY_HEX` color | Welcome and the Example check |
| `Outfit` (`onboarding/LookTile.tsx`) | Top + bottoms + shoes standing, tiny | Three `FlatSpec`s (type + color) | Setup's look tiles, You's `StyleTile`, "Going for" inset |
| `LOOKS` (`onboarding/looks.ts`) | 7 looks x 2 hand-picked outfits (colors included) | Bundled | Look tiles |
| `OutfitTiles` (`stylist/cards/OutfitTiles.tsx`) | A grid of piece tiles with names, plus dashed "You'd need" tiles (a plus and a label, no drawing) | Closet rows, optional `needs` strings | Chat outfit card, `OutfitIdeaCard` |
| `OutfitCard` in `ask/AskCardView.tsx` | `OutfitTiles` + Wear this + Check it | An `outfit` card: closet item ids + occasion | Chat |
| `BuyCard` (same file) | Text only: tag, name, budget, "+N outfits" | A Starter id | Chat |
| `AskQuestion` (same file) | A question with chips (tap = your reply) | question + 2 to 4 options | Chat |
| `AnswerBody` `Chip` (`ask/AnswerBody.tsx`) | A **10 pt round color dot** + piece name inline in the answer, opens the piece | Closet piece hex | Every answer that names a piece |
| `Swatch` (`closet/EditSheet.tsx`) | A 34 pt color circle with a label | hex + label | Closet's Color picker |
| `FAMILY_HEX` / `displayHex` (`packages/kitted-core/src/closetColor.ts`) | The app's one hex for each of 25 color families | A family name | Everything above |
| `GarmentIcon`, `AddedRow` (`design-system/components`) | Older flat icons | type + hex | Fit check "Added to Closet" row |
| `FitCheckCard`, `ReadingCard`, `RecheckCard`, `GoingFor` (`stylist/cards/`) | Score, fixes, reading steps, look tiles | A fit check | Fit-check flow only. Not reusable for advice. |
| `SupportCard`, `correct` / `link` / `check` cards | Buttons and a link row | ids | Chat |

## Missing

- A generic piece in a chat card. `outfit` cards take closet ids only, and `outfitNow` drops anything not in the closet.
- Color swatches as a card. Only the 10 pt dot exists, and only for owned pieces.
- A "buy" card that draws the piece (it's text only).
- The "Want me to add this?" Add / No thanks card.
- Any layout mixing an outfit and swatches.

## 2. Can a piece be drawn without being in his closet? Yes.

`artSpec` and `PieceArt` read only `garment.category`, `garment.subcategory` and `hex` (the rest has defaults). Three precedents already draw without a closet row:
- Welcome and the Example check, via `drawnPieces(reading)`, which uses `art: null`.
- The look tiles, which build `FlatSpec`s by hand.
- The Starter catalog (`finish/starter.ts`): `CATALOG` / `catalogRow(id)`, each row's `pick.garment` (a ready-made garment, e.g. "White tee") plus `displayHex(color)`.

Two helpers already turn words into a garment: `garmentOf("white tee")` in `ask/memory.ts` (about 40 piece words, reads the color) and `G(category, sub, color)` in core `names.ts`. A "drawn example outfit" is code that picks 3 or 4 `{garment, hex}` and passes them to `PieceArt` or `DrawnOutfit`. Catch: `PieceArt` is typed to want a `ClosetItemRow`-like shape, so a small wrapper or a looser type is needed.

## 3. The one-card rule

- Prompt: `CLOSING_FORMAT` in `ask/prompt.ts` says "card (at most one, or null)".
- Shape: the model's block has a single `card`. `gemini.ts` and `providers.ts` pass `done.card` through. `pipeline.ts` (about line 299) calls `prep.card(done.card, gate)`. `cards.ts` `buildCard` checks it and returns one `AskCard`.
- Storage and drawing: one `askCard` on the message payload. `storedCard()` reads it back, `AskAttachment` / `CardBody` draw it.
- Rules for outfits: 3 to 5 closet pieces, and `outfitValid` must pass. Otherwise the card is dropped and the text stays.

To show an outfit and swatches in one answer: (1) allow `card` to be a list or add one new composite type, e.g. `outfit` carrying optional `colors`; (2) change `buildCard`, `storedCard`, `cardSpoken` and `cardControls` to match; (3) store it under the same `askCard` key so Past chats keep working. The composite type is the smaller change. It also keeps the "code builds the card, never the model's text" safety rule.

## 4. "I have a white tee" and "add my white tee to my closet"

- **"I have a white tee"**: `router.ts` matches `i (…|own|have|got|bought) ` and gives kind `remember`, so no evidence is attached. The model may then put `{"key":"owns_unphotographed","value":"white tee"}` in its closing block. This is up to the model: the prompt only lists the key, with no example.
- **If it does:** `applyRemember` in `ask/memory.ts` does the work. `garmentOf` turns the words into a garment and `applyRemember` writes a closet row (`source: 'chat'`, `isPhotographed: false`, a dashed tile). It also saves a fact ("You own a white tee (no photo yet)") and shows "Saved to what I know · Undo" (`SavedLine`; `undoRemember` deletes the piece).
- **"Add my white tee to my closet"**: matches no route (the buy rule needs the exact words "add to my closet"), so it is kind `general` and again depends on the model.
- **So the path exists, but** it saves with no question, only when the model chooses to, and the model sees no "added" signal. Nothing shows Add / No thanks.
- **Describe-a-piece in Closet:** not built. `closet/addActions.ts` lists only Take photo and Choose photos. Its comment says "Describe it joins when it's built", and `handoff/09-ui-review.md` §26 notes that `sheets/describe.tsx` doesn't exist.
- **Other no-photo creators:** `markedPiece` in `finish/starter.ts` (the Starter "I own this" picks, `source: 'added'`) and `pickStarter` in `finish/starterActions.ts`.

The function that would create the piece from an Add tap: `applyRemember`'s closet-row block (reuse or split out as `addChatPiece`), with `garmentOf` for the words. An Add / No thanks card would be a new `AskCard` type (e.g. `{type: 'add', text}`) that code builds from the question. Add runs the same write, and No thanks does nothing. Reusing `undoRemember` gives Undo for free.

## 5. Where a visual beats text

| Question | Best visual | Fit |
| --- | --- | --- |
| "What should I wear to X?" | A whole outfit | `OutfitCard` works when the closet can make one. When it can't, Kit says "closet can't make a full outfit yet" (`evidence.ts`, `whatToWear`): **missing** a drawn example from `LOOKS` or Starter picks. |
| "What goes with my X?" | The piece + 2 or 3 partners | Fits (`goesWith` evidence plus `outfit` card). If the partner isn't owned: drawn example needed. |
| "What color goes with X / does this color work?" | 3 to 5 swatches with names | **Missing.** Use `FAMILY_HEX` plus the core color-neighbor data (`colorNeighbors`, `closetColor.ts`) and the guide's color rules. |
| "How do I style this up?" | Before and after: the piece in a casual outfit and a dressier one | **Missing.** Two `Outfit`-style drawings; `DrawnOutfit` can already swap one piece. |
| "What should I buy next?" | The piece drawn, in its outfit with "+N outfits" | `BuyCard` is text only. Draw `pick.garment` with `PieceArt` (easy), and show it in a `StandingOutfit` ghosted (exists). |
| "Is this too casual or dressy?" | A small drawn outfit next to the verdict | Partly: outfit card; no drawn comparison. |
| "I own X" | The piece drawn + Add / No thanks | **Missing** card; drawing exists (`PieceArt`, dashed `ClosetTile`). |

## Questions the interview should settle

- Add card: shown whenever he says he owns a piece, or only when it isn't already in his closet (a "same as your…?" check is needed)?
- A drawn example outfit: always labelled as an example, never "yours"? (Welcome already says "Example".)
- Color advice: from the guide's color rules, or from `colorNeighbors`? Only the second is a code-checked fact, which matches "the code judges, the AI explains".

**Learning note.** The card path is "never trust the input": the model only proposes a card, and code (`buildCard`) checks it against his real data before anything is drawn. It's the same idea as validating a form on the server, and it comes up in interviews.

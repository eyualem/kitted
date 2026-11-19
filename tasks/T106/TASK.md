# T106 · The add card's logic

**Size:** normal · **From:** `plan.md` → T106 · **Spec:** `specs/kit-stylist-chat.md` (approved Nov 17) · **Lane:** Kit's stylist chat

## What changes
- **Goal:** the Nov 19 bug: Kit said "I can't add pieces from chat" while the code silently added the piece. Now the model never writes a closet piece; the code reads his words, shows the add card, and adds only on his Add or his "add it".
- **Files:**
  - `ask/router.ts`: `readAdd` (mention vs "add it"), `Route.add`; an "add it" is never read as a buy question
  - `ask/memory.ts`: the model's `owns_unphotographed` remember is dropped (no silent closet write); `pieceWordsOf` / `colorOf` read a kind and the color right before it
  - new `ask/addCard.ts`: `planAdd` (KC4.1–KC4.8, KC4.7's tap questions, the explicit add before Kit answers, rollback)
  - `ask/prepare.ts`, `ask/pipeline.ts`: the plan's card and evidence line, `didAdd` for the gate, the piece taken back when the answer fails, the tap answer finishing an add
  - `ask/cardActions.ts`: Add, No thanks, Undo, I have one (KC4.3, KC4.4, KC2.10); `ADD_READY = true`
  - new `closet/chatAdd.ts` (borrowed from the Closet lane): the one place a chat piece is written and removed
  - `ask/prompt.ts` (version 7): `owns_unphotographed` out of the remember keys, a rule that the app adds pieces
  - `i18n/en.ts`: 2 words, the tap questions `What kind of piece is it?` and `What color is it?`
- **Done means:** KC4.1–KC4.9 and KC2.10 in `__tests__/T106-addCard.test.ts`; his exact Nov 19 message replayed.
- **Must not break:** Kit's gate (T105, T117), the closet's chat-piece rules (a color he says is the piece's color for good; the fit check's "Same as your …?"), Past chats' read-only add card.

## Calls settled (listed in the PR)
- **A color is never guessed.** "Add it" with a kind but no color (his Nov 19 message) asks `What color is it?` as a tap card (Black, White, Grey, Navy, Not sure). The Nov 12 bug (a piece drawn the wrong color) is the reason; a plain mention with no color shows no card at all.
- **The piece's name is made by code** from its color and kind (`Grey tee`), as KC4.2's card shows it. A brand he typed ("Uniqlo") never reaches a name; "oversized" is not kept (the closet names fit separately).
- **Undo on an added card returns the card to asking** (Add and No thanks again), not to "Not added".
- **The add happens in `prepare`, before Kit's words**, so the gate lets "added" through (`didAdd`). If the answer then fails or is refused, the piece is taken back, so Retry adds it once.
- **An accessory** (watch, cap) gets no add card yet: Closet has no Accessories section (Y38).
- **Dashed tiles in Closet** are unchanged. See the PR for the finding.

## Built
(filled at the end)

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
- **The founder approved the two new words** (`What kind of piece is it?`, `What color is it?`) on Nov 19 in chat ("Yes, all four", relayed by the control session).
- **Control review fixes (Nov 19):** a fit word he says stays in the name (`Grey oversized tee`, so it draws oversized); the gate drops "I can't add that", "I won't be able to add it", "Done, it's in your closet" when nothing was added; a failed `prepare` takes an explicit add back.
- **A color is never guessed.** "Add it" with a kind but no color (his Nov 19 message) asks `What color is it?` as a tap card (Black, White, Grey, Navy, Not sure). The Nov 12 bug (a piece drawn the wrong color) is the reason; a plain mention with no color shows no card at all.
- **The piece's name is made by code** from its color and kind (`Grey tee`), as KC4.2's card shows it. A brand he typed ("Uniqlo") never reaches a name; "oversized" is not kept (the closet names fit separately).
- **Undo on an added card returns the card to asking** (Add and No thanks again), not to "Not added".
- **The add happens in `prepare`, before Kit's words**, so the gate lets "added" through (`didAdd`). If the answer then fails or is refused, the piece is taken back, so Retry adds it once.
- **An accessory** (watch, cap) gets no add card yet: Closet has no Accessories section (Y38).
- **Dashed tiles in Closet** are unchanged. See the PR for the finding.

## Built
- `__tests__/T106-addCard.test.ts`: 27 tests, KC4.1–KC4.9 and KC2.10, including his exact Nov 19 message through the real pipeline (prepare, gate, card). Updated stale tests: `askC4` (pieces now come from `addChatPiece`; the model's `owns_unphotographed` is dropped), `T104-cardViews` (`ADD_READY` true), `kitWordsPrompt` (version 7), `toast.test` (I have one's Undo is a 5 s add-undo).
- iOS Simulator, light (demo screens 405, `-demoLatency 0`, real store): `shots/01-add-asking-light.png`, tap Add → `shots/02-add-added-light.png`, Closet afterward shows the piece → `shots/03-closet-after-add-light.png`, No thanks → `shots/04-add-not-added-light.png`.
- **Not verified in the Simulator:** a live model answer (no paid run, T110 does that), the colour tap question and the explicit "add it" card on screen (covered by the pipeline tests only), Undo and I have one on a device, dark mode and largest text (no colors or layout changed).
- Closet's dashed tile: unchanged, finding in the PR.

## Review

### Round 1 · normal · **not ready** (2 code defects)

Read: plan line, spec KC4.1–KC4.9 and KC2.10, TASK.md What changes, the `app/src` diff, the 4 screenshots, then Built. Did not re-run the Simulator or `npm run check`.

**Criteria**
- KC4.1 (same kind and color: no card, closet name used): done (`ownedSame`, evidence line; tested).
- KC4.2 (mention shows the card, nothing written): done; screenshot 01 shows the card, test checks the closet is unchanged.
- KC4.3 (Add writes one chat piece, Undo removes it): done for a single tap on a single card. Not done across cards (defect 1).
- KC4.4 (No thanks writes nothing, never offered again): done (declined outcome; "add it" still adds).
- KC4.5 (add it before Kit answers, card shows Added · Undo): done, including rollback if the answer fails or is refused.
- KC4.6 (Kit never says "I can't add", never claims "added" unless code did): done as far as T105's gate goes. The gate's `DENY` and `CLAIM_ADD` regexes are narrow (see small things). The model can no longer write a piece: `owns_unphotographed` is dropped in `parseRemember`, and the only writers are `planAdd` (explicit ask), `cardActions.add` and `cardActions.haveOne`.
- KC4.7 (kind unclear: tap question, no card): partly. The kind question shows, but a tap on a kind with no color in his words dead-ends (defect 2).
- KC4.8 (once per chat day): done for the same day; see defect 1 for the next day.
- KC4.9 (no question used): done (local writes only; test checks the quota).
- KC2.10 (I have one adds as Add does): done, with the Undo toast. No guard against a double tap (small things).
- Nov 19 message replayed: done. The denial is dropped, nothing is saved from the model's block, the color is asked, and the tap adds one "Grey tee" without using a question.

**Defects**
1. **code** · `app/src/features/ask/cardActions.ts`, `add` (about lines 45-52): it never checks whether the closet already has that kind and color, so an older "asked" card can add a second copy. Two ways to get there. (a) He says "I have a white tee" (card stays on Add), then "add it": `planAdd` adds the piece and shows a new Added card, but the first card still reads Add. Tapping it writes a duplicate. The test `"add it" right after a mention` never taps the old card. (b) Day 1 card left unanswered, day 2 "I have a white tee": `seen` only blocks declined cards or the same day, so a second card shows, and Add on both writes two. Fix: in `add`, look up `ownedSame` first and, if a piece exists, link the card to it as Added instead of writing; or when "add it" adds a piece, update the matching "asked" card. A test should tap the old card after "add it".
2. **code** · `app/src/features/ask/addCard.ts`, tap branch of `planAdd` (about lines 92-99): after the kind question, a tap such as "Hoodie" with no color in his original words gives `color = null`, so it returns `NO_PLAN` and the add silently ends. Kit just answers a message that reads "Hoodie". It should go on to the `What color is it?` tap question. The test named "the tap and a color finish it" never taps the kind. Add a test: `add it`, tap a kind, expect the color question, tap a color, expect one piece.

**Small things worth a later look (never block)**
- `cardActions.add` and `haveOne` are read-then-write, so two quick concurrent taps could both pass the `outcome === 'asked'` check. Fine if the button disables on press; unchecked here.
- If `prepare` throws after an explicit add was written (for example in `buildEvidence`), `prep` stays `NO_PREP`, so no rollback runs. The piece stays with an error row and no Undo. A retry then says "already has" and shows no card. Rare, and he did ask for it.
- `DENY` misses forms like "I can't add that" (no closet/piece word) and "I won't be able to add it"; `CLAIM_ADD` misses "Done, it's in your closet" and "Saved it". The evidence lines and prompt rule cover the usual case. A live check in T110 would tell.
- "add it" with no kind picks the latest asked or declined card of the day, however many messages ago. That is his explicit word, but it can surprise.
- Screenshot 01 is a seeded demo card, so it shows the card drawing and not the code path. The color and kind tap questions have no screenshot (the TASK.md already says so).
- `askC4` and `kitWordsPrompt` test updates look like honest follow-ups to the intended change (a dropped key, the prompt version), not weakened tests. No `.only` or `.skip` seen.

**Hard lines:** nothing rates a face, body or skin; nothing new leaves the phone; no emoji, ranks or streaks; the new words are the two tap questions only (`What kind of piece is it?`, `What color is it?`), which match the TASK.md and look right for the spec's tap-question rule, but they are words users read, so the founder should OK them.

### Review round 2 · normal · **ready**

Read: the fix commit's `app/src` diff only (`addCard.ts`, `cardActions.ts`, the test file). Ran `npx jest src/__tests__/T106-addCard`: 30 passed. Did not run the whole suite or the Simulator.

**Round 1 defects**
1. Duplicate add from an older card: **fixed.** `planAdd` now marks every earlier `asked` card for the same kind and color as `added` (with the new `itemId`) when "add it" writes the piece, and `cardActions.add` looks up `ownedSame` first and links the card to that piece instead of writing. The day-2 case (two unanswered cards, Add on both) also ends with one piece, because the second Add links. Tests: an old card after "add it" returns false and the closet keeps one piece; Add on a card for an owned piece links to it and writes nothing.
2. Kind tap dead end: **fixed.** A kind tap with no color in his words now goes on to `What color is it?`; a color tap then adds one piece; "Not sure" to the kind question, or to the color question, returns no add. The new test walks add it, Tee, the color question, Navy, one "Navy tee". Checked the branches: a kind with a color already in his words still adds straight away, and the guard `pending.kind !== null` only applies on the color step.

**No new defects.** Small things from the fixes (never block):
- If the answer then fails and `rollback` removes the piece, the older cards that were patched to `added` keep their `Added · Undo` state for a piece that is gone. Rare (needs an older asked card plus a failed answer); Undo on it just returns it to Add. A later fix could restore those cards in `rollback`.
- Two cards now can share one `itemId`: Undo on one removes the piece and the other still reads Added until its Undo is tapped (harmless, `removeChatPiece` no-ops on a deleted row). A card linked to a photographed or non-chat piece shows Undo that cannot remove it (guarded, the card just returns to Add).
- The earlier round-1 small things still stand (double-tap guard, `DENY` and `CLAIM_ADD` regexes, the colour and kind tap questions have no screenshot, the two new tap questions need the founder's OK as words).

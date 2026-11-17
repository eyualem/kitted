# T102 · Testing contract

Written by the planner from `specs/kit-stylist-chat.md` (approved 2026-11-17). Size: normal, so the implementer writes these tests with the code and one separate reviewer reads them. Words, labels and layout are not tested here (T104 shows them in screenshots).

**Lock:** locked at `eaa78fa04138e3e1afd0c3e89441f285d4d950f6` on 2026-11-17 · tests: `app/src/__tests__/kitCards.test.ts`, `app/src/__tests__/kitCardsStored.test.ts`, `app/src/__tests__/kitFollowUps.test.ts`

**Criteria covered: 10.** Plan-line IDs: KC1.2, KC1.3, KC1.5, KC2.1, KC2.2, KC2.3, KC2.4, KC2.5, KC2.6, KC2.9. Each appears below.

## How the tests are built
- Jest on the memory store, no network, no Simulator (`createMemoryStore`, `manualClock`, `counterIds`, as `askC3`, `askC4` and `askPipeline` do). The model is a scripted source yielding `delta` and `done` events.
- The closet is built in the test with a small row helper: name, slot, garment (`G(category, subcategory, color)`). Combos used for "valid outfit" are confirmed with `outfitValid` first (the `askC3` quartet Olive overshirt + White tee + Dark jeans + White sneakers is known good). A test never depends on a combo it hasn't checked.
- Test names start with the ID: `KC2.1 · <name>`.
- Existing ask tests must still pass unchanged: `askC3`, `askC4`, `askC7`, `askRotation`, `askPipeline`, `askProviders`, `askVoice`, `stepFourBatch`, `closetNoOutfits`, `oneCount`, `serverProxy`.

## Criteria

### KC1.2 · An answer carries at most one card
- **Expect:** a model block whose `card` is an array of two valid cards (an outfit and a colors card) gives no card: `buildCard` is `null`, and through `createAsk` the stored answer row has the text and no `askCard` key. A block with one valid card gives exactly one `askCard`, an object (never an array). `storedCard([card, card])` is `null`. When code built a card (`correctCard` for "that score is wrong"), the stored `askCard.type` is `'correct'` even if the model also proposed an outfit.
- **Must not:** two cards on one row; an array stored under `askCard`; the answer text lost because its card was dropped; a model block of type `add` or `changed` producing a card (`buildCard` is `null` for both: only code builds those).
- **Edges:** model names a piece id that doesn't exist, or an outfit that fails `outfitValid`: card dropped, words stay (stored row has the text, no card). A card type the app doesn't know (`{type:'poster'}`): `null`.
- **How:** unit (`buildCard`) and pipeline (`createAsk` with a scripted source). Test: `kitCards.test.ts` › `KC1.2 · …`.

### KC1.3 · Follow-up taps: 0 to 3, under the latest answer only, checked by code
- **Expect:** from a block with `"followUps":["Make it dressier","Show me jackets","What color shirt?","Add a watch"]`, the stored answer row has `payload.followUps` equal to the first three, in order. Each of these is dropped: `"Make it Dressier"` and `"Show Me Jackets"` (not sentence case), `"MAKE IT WARMER"` (all capitals), `"Make it dressier 🔥"` (emoji), `"What should I wear to class tomorrow and next week?"` (over 30 characters), `"Try Nike"` (brand), a tap equal to his question (`question: "Show me jackets"` drops `"Show me jackets"`, and also `"show me jackets!"`), a duplicate of an earlier tap in the list. `"What should I buy first?"`, `"I'd go darker"` and `"Which is most versatile?"` are kept. `followUps` that isn't an array, or is `null`: `[]` and no key on the row. Exactly 30 characters passes, 31 fails.
- `latestFollowUps(thread)`: for a thread of [his question, answer A with taps], returns A's taps; once his next message is in the thread, `null`; for a thread with two answers, only the later answer's taps and never the earlier's; a limit line, a decline (`askRefused`), the support card and a fail line after his question give `null`; a refused model answer (`done.refused`) is stored with no `followUps` even when the block had them; a tap question card (`type: 'ask'`) has none.
- A follow-up tap is sent as his message through `ask(text)`: it is counted (`consumeQuestion` called once, his bubble gets `counts: true`), exactly as a typed question.
- **Must not:** more than 3 on a row; taps shown under an older answer, a decline, the limit line, the support card or an error; a tap that repeats his question; a follow-up tap treated as a free tap answer (`tap: true`).
- **Edges:** reopening the app: a new `createAsk` and a re-read of the same store still gives the same taps (they are on the message). Offline or a failure mid-way: the failed answer row has no `followUps`.
- **How:** unit (`checkFollowUps`, `latestFollowUps`) and pipeline. Test: `kitFollowUps.test.ts` › `KC1.3 · …`. The parse is tested in `parseClosing` too: a block with only `followUps` parses, `{"other":1}` is still `null`.

### KC1.5 · Every card is rebuilt in Past chats from what was stored
- **Expect:** for each shape, `storedCard(JSON.parse(JSON.stringify(card)))` returns an equal card: old outfit (`itemIds`, `occasion` only), outfit with `needs` and `example: false`, an example (`itemIds: []`, `example: true`), options (his id entries and drawn entries), colors about a piece, colors in general, add in each of `asked`, `added` (with `itemId`) and `declined`, changed (with and without `undone`), buy with and without `why`, check, ask, link (piece and check), correct. Old shapes written before this task read back exactly as they were. Malformed gives `null`: `needs` not an array, a `needs` entry missing `color`, a color family not in the app's 25, options with an entry that is neither `itemId` nor `piece`, an add card with an outcome other than the three, a colors card with `families` empty, an unknown type, a string, `null`.
- Drawn pieces always redraw: `outfitNow(card, closet)` returns `needs` unchanged even when none of his pieces exist; `optionsNow` returns each drawn entry as `{ piece }`. One of his pieces removed since: `outfitNow` gives `gone: true` and the remaining `items`; `optionsNow` gives `{ gone: true }` for the removed entry only; for an add card with a removed `itemId` and a changed card with a removed `itemId`, `linkedPiece(itemId, closet)` is `null`.
- Read-only: `cardControls(card, { readOnly: true, ... })` has `add`, `noThanks`, `undo`, `wear`, `checkIt`, `needMenu` all `false` for every shape, and `outcome` still returns `'added'` or `'declined'` (and `'asked'`) for an add card. Today's chat (`readOnly: false`): `add` and `noThanks` true only for `asked`; `undo` true for `added` and for `changed` without `undone`, false after `undone`; `needMenu` true for an outfit or options card holding a drawn piece, false for an example.
- **Must not:** an old card failing to read; a malformed stored card throwing (it returns `null`); a button flag true in Past chats; a drawn piece lost because his closet changed.
- **Edges:** a piece merged into another since (`mergedInto` set) counts as gone, as today; wipe and reinstall: `storedCard` on an empty or foreign payload is `null`.
- **How:** unit. Test: `kitCardsStored.test.ts` › `KC1.5 · …`. The visible words (`No longer in your closet`, `Added`, `Not added`) are T104's, see Not testable yet.

### KC2.1 · His pieces first
- **Expect:** closet with Dark jeans (denim_dark): an outfit proposing `pieces: [tee, sneakers]` and `needs: [{kind:'jeans', color:'dark denim'}]` gives `itemIds` containing his jeans id and `needs` without jeans. A need of the same kind in a different color family (his jeans are denim_dark, the need is black jeans) stays a drawn piece (default; the founder may flip it, see IMPLEMENTATION open question 5). A need whose slot is already held by one of his pieces in the card (his jeans in `pieces` and a drawn chinos need) gives `null`. A piece of his in `avoid` is never used: an outfit naming it gives `null`, and an options card drops it. A deleted piece's handle is unknown: `null`.
- **Must not:** a drawn piece in a card when a usable piece of his has the same kind and color family; a deleted piece, a piece awaiting an answer ("same as your...?"), or an avoided piece used.
- **How:** unit. Test: `kitCards.test.ts` › `KC2.1 · …`.

### KC2.2 · A piece he doesn't own is drawn data in one of the 25 colors, never labelled his
- **Expect:** in a built outfit, a piece he doesn't own is in `needs` as `{ kind, color, name }`, never in `itemIds`; `color` is a key of `FAMILY_HEX` and never `multicolor`; `name` is made by code: `cardPiece('collared shirt', 'off white')` is `{ kind: 'oxford_shirt', color: 'off_white_cream', name: 'Off-white collared shirt' }` and `cardPiece('work_boot', 'black').name` is `'Black work boots'`. A model entry that carries its own `name` ("Black boots") with color `brown` is built as `'Brown work boots'`: the model's name is ignored. For every drawable kind and each of the 24 usable families, `cardPiece(kind, family).name` starts with that family's display name (or the closet's word for a denim family on jeans), so the name's color and the drawn color are one value. `needs.length` is the `n` of `From your closet + n` (1 for one drawn piece, 2 for two).
- **Must not:** a drawn piece id in `itemIds`; a color outside the 25 or `multicolor`; a name whose color word differs from `color` (the Thursday bug); `cardPiece` accepting a kind the app can't draw (`null`); a card with `n = 0` and `example: false` marked as needing something.
- **Edges:** an unknown kind word ("harrington"): `null`, card dropped. "harrington jacket": `kind: 'field_jacket'`, name `Navy jacket` with color navy (closest kind of the same slot). Every non-accessory key in `KIND_SLOT` draws: `artSpec` returns a spec for it.
- **How:** unit. Test: `kitCards.test.ts` › `KC2.2 · …`. The drawing is T101's and the tile and its `You'd need` words are T104's; see Not testable yet.

### KC2.3 · Example when his closet can't make it
- **Expect:** an outfit proposal with none of his pieces (or an empty closet) gives `{ type: 'outfit', itemIds: [], example: true, needs: [3 or more pieces] }` and the card key is the same for the same pieces. An outfit with exactly 2 drawn clothing pieces and 3 of his stays `example: false`. An outfit with 3 drawn clothing pieces and 1 of his is an example, and his piece is not in it. 3 of his pieces and 2 accessories (watch, belt) is not an example (accessories don't count toward the 2). `exampleOutfit([['streetwear', 1]], new Set())` returns the first `LOOKS` streetwear outfit as pieces with kinds `['hoodie', 'jeans', 'low_profile_sneaker']` and colors `nearestFamily` of its hexes; with that outfit's key in `shown`, the second streetwear outfit; with both shown and no other picked look, `null` (no card). With several picked looks the first pick's outfit comes first. With no picks (`styles` empty) it returns the first Starter-list row for top, bottom and shoes with their `pick.garment` subcategory and color family. Every piece of every example is a valid `cardPiece`.
- **Must not:** an example that holds any of his piece ids; an example marked `example: false`; `example: true` on a card that has a piece of his; a repeat of an example already shown today (KC2.6) when a fresh one exists.
- **Edges:** his closet is empty: examples only. No picked looks (Something else, or skipped): the Starter fallback. The example chooser avoids kinds in `avoid`.
- **How:** unit. Test: `kitCards.test.ts` › `KC2.3 · …`. That the title says `Example` and no tile says `Yours` or `You'd need` is T104's.

### KC2.4 · An options card: 2 or 3, one slot, never the replaced piece, his first
- **Expect:** closet with a tan bomber (outer) and a denim jacket (outer). `{type:'options', replaces: bomber, pieces: [denimJacket], needs: [{kind:'chore jacket', color:'charcoal'}, {kind:'puffer', color:'black'}]}` gives `slot: 'outer'` and three `options`: `{ itemId: denimJacket }` first, then the two drawn pieces in the model's order. A fourth entry is cut (3 kept, his first). Dropped from the list: the replaced bomber, a drawn bomber in the bomber's own color, a drawn piece that duplicates one of his kept pieces (same kind and color), a sweater (top) and a drawn `sweater` need. One entry left, or none: `null`. If the model says `slot: 'top'` but `replaces` is an outer piece, the slot is `'outer'`.
- **Must not:** fewer than 2 or more than 3 entries; any entry in another slot; the replaced piece, or a drawn copy of it; one of his pieces after a drawn one; a piece in `avoid`; `Yours` and drawn mixed without his first.
- **Edges:** fewer than 2 pass: no card, the words still answer (pipeline: row has text, no `askCard`).
- **How:** unit and one pipeline case. Test: `kitCards.test.ts` › `KC2.4 · …`.

### KC2.5 · The question asked
- **Expect:** a table of at least 8 asks, each built through `buildCard`: alternative to the tan bomber (outer), to the olive sweater (top), to the dark jeans (bottom), to the black work boots (shoes); "a jacket, not a sweater" (`slot: 'outer'`, no `replaces`) with a sweater and a shirt in the model's list; the same with a mixed list of four slots; a replaced piece listed again by the model; a drawn piece that is the replaced piece. For every row that yields a card: all entries are in the asked slot (his pieces by closet slot, drawn by `slotOfKind`), and none is the replaced piece. 100% of the table passes.
- **Must not:** a card with a shirt or sweater for a jacket question; any entry that is the piece he asked to replace.
- **How:** unit. Test: `kitCards.test.ts` › `KC2.5 · …`. The 100% on the real model's answers is KC11 (T110), see Not testable yet.

### KC2.6 · The same outfit isn't shown twice in one chat day
- **Expect:** `cardKey` of an outfit is the same for the same set of pieces in any order (his ids and drawn `kind|color` together) and different when one piece differs. `shownKeysToday(chat, today, zone)` holds the keys of stored outfit cards on rows dated today and none from yesterday; a row at 03:59 belongs to the earlier day and one at 04:00 to the new day (core `dayKey`). `buildCard` of an outfit whose key is in `shownToday` is `null`; the same outfit on the next day, or with a different piece, builds. Through `createPrepare` on a memory store: the first question's outfit builds and is stored; asking for the same outfit again gives no card; the question "show me that outfit again" (`askedAgain` true) builds it. Options, colors and buy cards are not blocked by the key.
- **Must not:** a repeat card on the same day unless he asked again; a card blocked by another day's row; a difference in order counting as a different outfit.
- **Edges:** the 4 am day change as above; a card that was dropped earlier (no stored row) doesn't block.
- **How:** unit and `prepare` level. Test: `kitCards.test.ts` › `KC2.6 · …`.

### KC2.9 · 3 to 5 clothing tiles plus up to 2 accessories, accessories last
- **Expect:** 4 clothing pieces and 2 accessories (a watch and a belt, in the model's order watch first) build, with `itemIds` plus clothing `needs`, then `needs` ending with the accessories. An accessory the model lists before the clothing still comes last. Two clothing pieces: `null`. Six clothing pieces: `null`. Three accessories: `null`. Two of the same accessory kind (two watches): `null`. No shoes (his or drawn), no top or no bottom: `null`. 5 clothing and 2 accessories: builds (7 tiles). 3 clothing, no accessories: builds (the old 3 to 5 rule stays).
- **Must not:** an accessory counted as one of the 3 to 5 clothing pieces; more than 2 accessories; an accessory before clothing in `needs`; an accessory in `itemIds`.
- **How:** unit. Test: `kitCards.test.ts` › `KC2.9 · …`.

## Plain checks not tied to one criterion (same files)
- `parseClosing` still returns `null` for `{"other":1}` and for malformed JSON; a block with `followUps` and nothing else parses.
- A `done` event from `gemini.ts` and `providers.ts` carries `followUps` only when the block had it (existing `toMatchObject` assertions stay true).
- `PROMPT_VERSION` is 5 or more (existing `askVoice` assertion stays).
- The colors card and `allowedColors`: with a hand-made allowed set, a card holding a color outside it is `null`; his own piece's color and `goesWith` are exempt; fewer than the minimum families is `null`. (KC3 belongs to T104 and T105; this only proves the card's side of KC3.3 so they can rely on it.)

## UI inventory
T102 shows no new screen state and creates no demo screen. Nothing it adds is read by a user (the closing format is for the model). The cards are drawn by T104, whose inventory owns: every element, its words, VoiceOver label and testID, demo screens, light, dark and the largest text size, for the states below. T102 hands over the data for each:

| State (T104 draws) | Data from T102 |
|---|---|
| Outfit with `You'd need` tiles, tag `From your closet + n` | `needs`, `needs.length`, `cardControls.needMenu`, `nextBuyFor(piece, styles)` |
| Example | `example: true`, `itemIds: []`, `needs`, `cardControls.wear` false |
| Options | `options`, `slot`, `optionsNow(...)` |
| Colors (a piece, general) | `colors` card, `colorPieces`, `colorName` |
| Add card: asked, added, declined | `outcome`, `cardControls.add / noThanks / undo / outcome` |
| Changed | `before`, `after`, `undone`, `cardControls.undo` |
| Buy, drawn | `buyPiece(card)`, `why` |
| Follow-up row | `latestFollowUps(thread)` |
| Past chats (all read-only) | `cardControls` with `readOnly: true`, `outfitNow`, `optionsNow`, `linkedPiece` |

`cardSpoken` returns `null` for the new shapes until T104 writes their VoiceOver lines. No screenshot is owed by this task.

## Not testable yet
Never dropped, never counted as done.
- **KC2.2 (the drawing and the tile)** · why: the drawing is T101's (`PieceArt` for a piece with no closet row) and the dashed tile and `You'd need` words are T104's · would verify it: T101's and T104's tests and screenshots (light, dark, largest text).
- **KC2.3 (the title)** · why: `Example` as a title with no `Yours` or `You'd need` is a view · would verify it: T104's screenshots.
- **KC2.5 (on the model's real answers, 100%)** · why: it measures what the model chooses, not what the code allows · would verify it: T110, the recorded test set, then the one paid run (up to 10 cents, the founder's OK Nov 17).
- **KC1.5 (the words)** · why: `No longer in your closet` exists today, but `Added` and `Not added` in Past chats are T104's words (the founder confirms them, IMPLEMENTATION open question 4) · would verify it: T104's Past-chats screenshots.
- **KC1.3 (taps are about clothes, and show only under the newest answer on screen)** · why: "about clothes" has no mechanical check (IMPLEMENTATION technical default 2), and the visible row is T104's · would verify it: T110's test set (a person reads the follow-ups), and T104's screenshot of the row.
- **KC2.1 (the disliked pieces)** · why: the `avoid` set is filled by the dislike fact (T106 to T108); here it is tested with a hand-made set · would verify it: the tests T106 to T108 add, and KC11.
- **The model writes the new block shapes correctly** · why: needs the real model · would verify it: T110's paid run, which logs how many blocks failed to build a card.
- **Everything on the founder's phone** (how the cards feel, Thursday replayed) · why: needs his phone and T104 to T109 · would verify it: Y33, the replay after T110.


## Founder answers that change examples above (Nov 17)
Drawn piece names use the closet's own noun for the kind (not "collared shirt" or "chore jacket"): wherever an example here says "collared shirt" or "chore jacket", the test uses the closet's noun for `oxford_shirt` / `chore_coat` (see IMPLEMENTATION.md, Open questions, answer 2). Color names are the spec's words. A piece he owns in another color is not substituted (kind and color family must both match).


## Test record (test writer, Nov 17, before any code)
Files: `app/src/__tests__/kitCards.test.ts` (KC1.2, KC2.1 to KC2.6, KC2.9 and the card side of the plain checks), `app/src/__tests__/kitCardsStored.test.ts` (KC1.5), `app/src/__tests__/kitFollowUps.test.ts` (KC1.3 and the closing block, gemini.ts and providers.ts). Shared helpers (not tests): `app/src/testing/kitCardsHelpers.ts`. Stubs, each throwing `T102: not built`, are in `cards.ts` (`slotOfKind`, `colorName`, `kindNoun`, `cardPiece`, `cardKey`, `shownKeysToday`, `askedAgain`, `exampleOutfit`, `optionsNow`, `buyPiece`, `colorPieces`, `nextBuyFor`, `checkFollowUps`, an empty `KIND_SLOT`, and the types `PieceSlot` and `CardPiece`) and `pipeline.ts` (`latestFollowUps`). The widened `AskCard` union, `CardInput`'s new fields and `outfitNow`'s new result fields are the implementer's: the tests read them through local casts so they type-check today. `prompt.ts`, `closing.ts`, `source.ts`, `gemini.ts`, `providers.ts` and `prepare.ts` are untouched.

Run on a clean checkout: 225 tests in the three files, 187 red, 38 exist-and-bite; the 15 existing ask suites (361 tests) still pass.

| Criterion | Tests | red: how it fails today | exists: bites via |
|---|---|---|---|
| KC1.2 | 9 | the array case and the stored card shape fail on an assertion (a card has no `needs` or `example`; the colors block builds no card); `PROMPT_VERSION` is 4 and the closing format lacks `followUps`, options and colors | 3 exist: add and changed from the model (planted `case 'add'` and `case 'changed'` in `buildCard` → red), an unknown type (planted pass-through of any typed block → red), a code-built card winning (planted `buildCard(...) ?? correct` in `prepare.ts` → red) |
| KC1.3 | 48 | 47 fail: `checkFollowUps` and `latestFollowUps` throw `not built`; the stored row has no `followUps`; `parseClosing` of a `followUps`-only block is null; the `done` events of Gemini, OpenAI and Anthropic carry no `followUps` | 1 exists: `{"other":1}` and malformed JSON stay `null` (guards the parser change) |
| KC1.5 | 95 | the new shapes (options, colors, add, changed) read back `null`; `outfitNow` has no `needs` or `example`; `optionsNow` and the new button flags are missing | 34 exist: old and unchanged shapes round trip, malformed shapes are `null`, a merged piece is gone, `linkedPiece` of a removed piece, a gone outfit has no Wear this. Planted bugs: storedCard accepting any options, add, colors or changed → 11 red; any non-empty object → 3 red; stripping `needs` and dropping `check` → 14 red; `outfitNow` using `!isDeleted` → merged test red; `linkedPiece` returning a removed piece → red; `wear` ignoring `gone` → red |
| KC2.1 | 7 | the outfit keeps his old behaviour (no `needs`, no substitution, `avoid` ignored) and `nextBuyFor` throws | none |
| KC2.2 | 17 | `cardPiece`, `colorName`, `kindNoun`, `slotOfKind`, `colorPieces`, `buyPiece` throw; a drawn need today makes no card; the colors and buy-with-why cases fail on an assertion | none |
| KC2.3 | 11 | an outfit with `pieces: []` builds no card today; `exampleOutfit` throws | none |
| KC2.4 | 9 | an options block builds no card today | none (the "one entry left" test opens with a positive control, so it is red) |
| KC2.5 | 10 (the table of 9 asks, each as its own test, and one 100% test) | no card today | none |
| KC2.6 | 8 | `cardKey`, `shownKeysToday`, `askedAgain` throw; the stored card has no `needs`, so the prepare-level test fails first | none |
| KC2.9 | 11 | `needs` is never written; an outfit with 3 accessories or 6 clothing pieces builds today | none |

### Choices the spec text left open (the test writer's reading; change only with the founder's yes or a dispute)
- **Example fallback.** `IMPLEMENTATION.md` says picks come first, then the Starter list; the KC2.3 line above says "with both shown and no other picked look, `null`". The founder's spec (KC2.3: "his picked looks first, then the Starter catalog") settles it: the test expects the Starter outfit (`starterList(styles)`, first row with a pick for top, bottom, shoes) next, and `null` only when that one is shown too.
- **`exampleOutfit`'s `avoid`** is read as a set of kind keys (`'hoodie'`), as "the example chooser avoids kinds in `avoid`" says. In `buildCard` the same input holds closet ids.
- **Names.** Color word from the spec's table, noun from the closet (`garmentName`), denim families on jeans from `colorWord` ("Dark jeans"). The test checks `startsWith(color word)` and `endsWith(noun)` for every kind by family, and exact names for the spec's examples ("Off-white oxford", "Black work boots", "Navy jacket" for a harrington). A khaki family reads "Beige chinos" here (the spec's word), not the closet's "Khaki".
- **"off white".** Core's `parseShade('off white')` gives `white`, not `off_white_cream` (`'off-white'` and `'cream'` do). The contract above says `cardPiece('collared shirt', 'off white')` is `off_white_cream`, so `cardPiece` must handle it itself (or T103 must fix the parse); the colors-card tests use unambiguous words.
- **Not tested, and why:** the 80% word-overlap rule of `checkFollowUps` (the overlap measure is not defined: over the smaller set, the larger, or Jaccard); a verdict clash giving no taps (needs a rules verdict the harness does not set up); `cardSpoken` for the new shapes (T104 writes them, a locked test would break it); `evidence.ts` reading an example's empty `itemIds` (T105's file, harmless by `outfitKey([]) === null`).

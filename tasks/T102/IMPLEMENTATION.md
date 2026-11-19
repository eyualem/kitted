# T102 · The card shapes and their checks

**Size:** normal · **From:** `plan.md` → T102 · **Spec:** `specs/kit-stylist-chat.md` (approved 2026-11-17), drawn in `mockups/kit-stylist-chat.html` · **Lane:** Kit's stylist chat (`app/src/features/ask/`)

Planned only from reading. Nothing was run (the Mac is short on memory). Paths below are under `app/src/features/ask/` unless they start with `app/` or `tasks/`.

## Goal
Kit's answer can carry the new card shapes (outfit with pieces he'd need and examples, options, colors, add, changed, the drawn buy card) as exported types, built and checked by code, stored on the message once, read back in Past chats; with 0 to 3 follow-up taps stored on the message. No drawing and no words on screen change here: T104 draws, T105 writes Kit's words, T106/T107 write the add and changed cards.

## Files
In the lane:
- `cards.ts`: the types, `buildCard` for the new model-proposed shapes, `storedCard`, `outfitNow`, new resolvers, `cardControls`, `cardSpoken`, the follow-up checker, the repeat key, the example chooser.
- `closing.ts`: the block gains `followUps`.
- `pipeline.ts`: stores `followUps` on the answer row; `latestFollowUps(thread)`; `AskPayload.followUps`.
- `prompt.ts`: `CLOSING_FORMAT` (the new card lines and `followUps`) and `PROMPT_VERSION` 4 to 5. Nothing else in the file (T105 owns the rest).

Outside the lane, small and named, because the follow-ups and the repeat check can't work without them. Asked for as lane extensions (see Open questions, technical):
- `source.ts`: the `done` event type gains `followUps?: unknown`.
- `gemini.ts` (1 yield) and `providers.ts` (2 yields): pass `followUps` through, only when the block has it (a conditional spread, so existing `done` assertions stay true).
- `prepare.ts`: the `card:` callback passes `shownToday` into `buildCard` (3 lines). T105 also edits `prepare.ts`, so the two sessions must take turns on it or merge by hand.

Not touched: `AskCardView.tsx`, `OutfitTiles.tsx`, `en.ts`, `demo/` (T104); `closet/{flats,artSpec}.ts`, `GarmentArt.tsx` (T101); `app/packages/kitted-core` (T103); `gate.ts`, `evidence.ts`, `context.ts`, `router.ts`, `memory.ts` (T105 to T107).

## Interfaces
Everything a test calls. All exported from `cards.ts` unless said.

### Pieces drawn without a closet row
```ts
export type PieceSlot = 'top' | 'bottom' | 'shoes' | 'outer' | 'accessory';
export const ACCESSORY_KINDS = ['watch', 'belt', 'cap', 'beanie'] as const;
/** The only shape a drawn piece has (T101 draws it, T104 shows it). */
export interface CardPiece {
  kind: string;   // a garment subcategory the closet draws ('work_boot', 'overshirt', 'jeans', 'bomber') or an accessory kind
  color: string;  // one of the app's color family keys (FAMILY_HEX), never 'multicolor' or 'unknown'
  name: string;   // made by code from color and kind, never taken from the model: "Black work boots"
}
export function slotOfKind(kind: string): PieceSlot | null;                 // null = not a kind the app draws
export function colorName(family: string): string | null;                    // the display name, "Off-white"; null for 'multicolor' and unknown
export function kindNoun(kind: string): string;                              // "collared shirt", "work boots" (lowercase)
export function cardPiece(kind: unknown, color: unknown): CardPiece | null;  // from the model's words or from keys
export const KIND_SLOT: Readonly<Record<string, PieceSlot>>;                 // every drawable kind and its slot
```
- `cardPiece("collared shirt", "off white")` gives `{ kind: 'oxford_shirt', color: 'off_white_cream', name: 'Off-white collared shirt' }`. `cardPiece('work_boot', 'black')` gives `name: 'Black work boots'`. Accepts a kind key or words (try `KIND_SLOT`, then the four accessory words, then `garmentOf` from `memory.ts`) and a family key or words (`parseShade(...).family` from core). Anything it can't resolve is `null`. Name = `colorName(color)` + ` ` + `kindNoun(kind)`, first letter capital; for a denim family on jeans use the closet's own word from `colorWord` (`labels.ts`: "Dark jeans").
- `KIND_SLOT` keys are the subcategories in `closet/artSpec.ts`'s `TOP`, `BOTTOM` and `SHOE` tables (the implementer copies them, not imports: T101 edits that file), plus the four accessories as `accessory`. A test proves every non-accessory key draws (`artSpec(...)` returns a spec of the right shape).
- `colorName` table (a default the founder confirms, see Open questions): white White, off_white_cream Off-white, light_grey Light grey, grey Grey, charcoal Charcoal, black Black, navy Navy, light_blue Light blue, blue Blue, denim_light Light denim, denim_mid Mid denim, denim_dark Dark denim, olive Olive, green Green, sage Sage, khaki_beige Beige, tan_camel Tan, brown Brown, burgundy Burgundy, red Red, orange Orange, yellow Yellow, pink Pink, purple Purple. One map, so one edit changes a word everywhere.
- The mockup's "Navy harrington" has no kind in the app. A word with no match (`garmentOf` finds nothing) makes the card drop; "harrington jacket" matches `jacket` and draws a `field_jacket` named "Navy jacket" (the spec's closest-kind rule, marked assumed).

### The card union
```ts
export interface PieceFields { name: string; slot: ClosetSlot; garment: Garment; hex: string; confirmedFields: string[] }
export type OptionEntry = { itemId: string } | { piece: CardPiece };

export type AskCard =
  /** `itemIds` is his pieces (old cards have only this). `needs` are pieces he'd need, drawn; accessories are always in `needs`.
   *  `example: true`: every piece is in `needs`, `itemIds` is []. Old stored outfits have neither field. */
  | { type: 'outfit'; itemIds: string[]; occasion: OccasionKey; needs?: CardPiece[]; example?: boolean }
  | { type: 'options'; slot: PieceSlot; options: OptionEntry[] }                  // 2 or 3, his own first
  | { type: 'colors'; about: 'piece'; kind: string; itemId?: string; families: string[] }   // 2 or 3 families
  | { type: 'colors'; about: 'general'; goesWith: string; families: string[] }              // 3 to 5 families
  | { type: 'add'; piece: CardPiece; outcome: 'asked' | 'added' | 'declined'; itemId: string | null }
  | { type: 'changed'; itemId: string; before: PieceFields; after: PieceFields; undone?: true }
  | { type: 'buy'; starterId: string; gain: number | null; why?: string }          // `why` is new and optional
  | /* check, ask, link, correct: unchanged */;
```
`add` and `changed` are built by code (T106, T107) and never from the model's block: `buildCard` returns `null` for those types. New outfit cards always write `needs` (maybe `[]`) and `example` (true or false).

### What the model's block may hold (the input to `buildCard`)
```
outfit : {"type":"outfit","pieces":["P7","P2","P9"],"needs":[{"kind":"collared shirt","color":"off white"}],"occasion":"date"}
options: {"type":"options","replaces":"P3","pieces":["P4"],"needs":[{"kind":"denim jacket","color":"light blue"}]}
         or {"type":"options","slot":"outer","pieces":[...],"needs":[...]} when no piece is being replaced
colors : {"type":"colors","piece":"P5","colors":["off white","light blue"]}     (about his piece)
         {"type":"colors","piece":"collared shirt","colors":[...]}              (about a kind)
         {"type":"colors","goesWith":"olive","colors":["off white","tan","brown"]}  (in general)
buy    : {"type":"buy","kind":"loafers","shade":"dark brown","why":"Does the bomber's job without its shape."}
follow-ups (a key of the block, not of the card): "followUps":["Make it dressier","Show me jackets"]
```
`closing.ts`: `ClosingBlock` gains `followUps: unknown` (the raw value, `null` when absent); `parseClosing` still returns `null` for `{"other":1}`; `EMPTY_BLOCK.followUps` is `null`.

### The builder
```ts
export interface CardInput {            // existing fields stay
  /** Outfit keys already shown today (`cardKey`). Absent = no repeat check. */
  shownToday?: ReadonlySet<string>;
  /** Closet ids he'd rather not wear: never in a card. Wired later (T106 to T108); absent = none. */
  avoid?: ReadonlySet<string>;
  /** T103's allowed color families for this answer. Absent or null = no color check. */
  allowedColors?: ReadonlySet<string> | null;
}
export function buildCard(raw: unknown, input: CardInput): AskCard | null;     // sync, as today
```
Rules `buildCard` enforces (each one is a test):
- **One card.** `raw` an array, or `{type}` not one of outfit, check, ask, buy, link, options, colors: `null`. (KC1.2)
- **Outfit.** Resolve `pieces` as today (his usable, not deleted, not awaiting an answer, not in `avoid`, no duplicates). Resolve each `needs` entry with `cardPiece`; one that doesn't resolve makes the card `null`. Then:
  1. *His pieces first (KC2.1).* A need whose kind and color family match a piece of his that is usable and not already in the card is replaced by that piece. A need whose slot (top, bottom, shoes, outer) is already held by one of his pieces in the card makes the card `null`. Accessories: up to 2, distinct kinds.
  2. *Counts (KC2.9).* Clothing pieces (his plus drawn, not accessories) 3 to 5, accessories 0 to 2, and a top, a bottom and shoes all present (his or drawn). Anything else: `null`.
  3. *Valid.* `outfitValid` over his pieces plus a `G(category, kind, color)` garment for each drawn clothing piece (accessories left out; the rubric ignores them); false: `null`.
  4. *Example (KC2.3).* If he owns none of the clothing in the card, or more than 2 clothing pieces are drawn: the card becomes `{ type: 'outfit', itemIds: [], needs: exampleOutfit(...), example: true, occasion }`. If `exampleOutfit` has nothing fresh: `null`.
  5. Otherwise `{ type: 'outfit', itemIds: [his, in the model's order], needs: [drawn clothing, then accessories], example: false, occasion }`. The tag's `n` is `needs.length`.
  6. *Repeat (KC2.6).* A non-example whose `cardKey` is in `shownToday`: `null`.
- **Options (KC2.4, KC2.5).** The slot is the slot of `replaces`' piece (code wins over the model's `slot`), else the model's `slot`. Keep only his pieces in that slot (not `replaces`, not in `avoid`) and drawn pieces whose `slotOfKind` equals it and that are not the same kind and color as the replaced piece or as one of his pieces already kept. Sort his pieces first, then drawn, keeping the model's order inside each group. Fewer than 2 left: `null`. More than 3: keep the first 3. His own pieces are not added by code, only ordered.
- **Colors (KC3.1, KC3.2).** Each entry resolves to a distinct family (a key or words, never `multicolor`). About a piece: 2 or 3 families, `kind` from his piece's subcategory (and `itemId`) or from the kind words; general: `goesWith` resolves to a family, 3 to 5 families. If `allowedColors` is given, every family in the card must be in it, else `null` (the colors of his own piece, `goesWith`, are exempt). Fewer than the minimum: `null`.
- **Buy.** As today, plus `why`: a string of at most 90 characters that passes `checkSentence` with the card's gate; otherwise the card keeps and `why` is left out.
- A drawn piece is built only by `cardPiece`, so a name and its drawing can't disagree (KC2.7's data side).

### Other exports
```ts
export function cardKey(card: AskCard): string | null;
//  outfit: his ids and drawn "kind|color" pieces, sorted, joined with '+', clothing and accessories together; every other type: null
export function shownKeysToday(chat: readonly ChatMessage[], today: string, zone: ZoneOffset): Set<string>;
//  the keys of the stylist rows' stored outfit cards whose day (core dayKey, 4 am rollover) is `today`
export const askedAgain: (question: string) => boolean;   // /\b(again|same (one|outfit)|repeat)\b/i
export function exampleOutfit(styles: Styles | null, shown: ReadonlySet<string>, avoid?: ReadonlySet<string>): CardPiece[] | null;
//  deterministic; T105's evidence calls this same function so Kit's words and the card show the same pieces

export function outfitNow(card, closet): { items: ClosetItemRow[]; needs: CardPiece[]; example: boolean; gone: boolean };  // adds needs, example
export function optionsNow(card, closet): { entries: ({ item: ClosetItemRow } | { piece: CardPiece } | { gone: true })[]; };
export function buyPiece(card: Extract<AskCard, { type: 'buy' }>): CardPiece | null;    // the Starter pick, drawn
export function colorPieces(card: Extract<AskCard, { type: 'colors' }>): CardPiece[];   // about 'piece': one per family, name = colorName
export function nextBuyFor(piece: CardPiece, styles: Styles | null): string | null;     // a Starter id whose pick has this slot and kind, else null
export function checkFollowUps(raw: unknown, o: { question: string; gate: GateContext }): string[];
export function storedCard(v: unknown): AskCard | null;   // reads old and new shapes, null for anything malformed
export function cardControls(card, o): { wear; checkIt; correct; answers; /* new: */ needMenu: boolean; add: boolean; noThanks: boolean; undo: boolean; outcome: 'asked' | 'added' | 'declined' | null };
```
- `exampleOutfit`: first his picked looks in order (the style keys in `styles`), for each look its two `LOOKS` outfits in order; each flat becomes a `CardPiece` (flat type to kind: tee tee, polo polo, tank tank_top, crew sweatshirt, quarter_zip, cardigan, hoodie, shirt oxford_shirt, overshirt, denim_jacket, bomber, jacket field_jacket, puffer, blazer, coat overcoat, jeans, chinos, trousers, cargos, joggers, shorts, sneaker low_profile_sneaker, runner retro_runner, work_boot, chukka suede_chukka, chelsea chelsea_boot, loafer, derby, slides slides_sandals; color is `nearestFamily(hex)` from core). Take the first outfit whose `cardKey` is not in `shown` and that has no kind in `avoid`'s kinds. No picks, or none fresh: the first Starter list row (`starterList(styles)`) with a pick for top, bottom and shoes, as `pick.garment` (subcategory, `color_family`). Nothing fresh: `null`.
- `cardKey` and `outfitNow` keep working on old cards (no `needs`, no `example`).
- `cardControls` rules: outfit `wear` and `checkIt` as today (not read-only, not gone), except an example has `wear: false` and keeps `checkIt`; `needMenu` is true for outfit and options cards with a drawn piece, not read-only, not an example; `add` and `noThanks` true only for an `add` card with `outcome: 'asked'` and not read-only; `undo` true for `add` with `'added'` and for `changed` without `undone`, not read-only; `outcome` is the add card's outcome (read-only cards show it), `null` for every other type. In Past chats every button flag is false.
- `cardSpoken`: unchanged for old shapes; `null` for every new shape and for an outfit with `needs` or `example` (T104 writes those VoiceOver lines; a null is safe, and the old line would say "from your closet" about a card that isn't).
- `checkFollowUps(raw, ...)`: returns at most 3 strings, in order, each trimmed and passing all of: a string, 1 to 30 characters, first letter uppercase and no other word starting uppercase except `I`, `I'd`, `I'll`, `I'm`; no word of 2 or more letters in all capitals; `checkSentence(text, gate)` is `null` (emoji, brand, body, score and the rest); not a repeat of his question (same words after lowercasing and stripping punctuation, or the two word sets overlap 80% or more); no duplicate. Not an array, or `null`: `[]`. There is no clothes-word list (see Open questions).

### The pipeline
```ts
// AskPayload (pipeline.ts) gains:
followUps?: string[];   // on an answer row, 1 to 3
export function latestFollowUps(thread: readonly ChatMessage[]): { messageId: string; taps: string[] } | null;
```
- After a normal answer (not refused, not a verdict clash, not failed): `followUps = checkFollowUps(done.followUps, { question: question.text, gate })`; written only when non-empty, and not when the card is a tap question (`type: 'ask'`).
- `latestFollowUps`: look at the messages after the last user message; take the last stylist row there with `payload.answerTo` and a non-empty `followUps` that has no `askRefused`; else `null`. So a new question hides them, and a limit line, a decline, the support card and a fail line (none has `answerTo` plus `followUps`) never show any.
- A follow-up tap goes through the normal `ask(text)`, so it is counted like a typed question (KC10.2). Do not mark it `tap`.
- The model's card stays one key, `askCard`; a code-built card (correct, later add and changed) wins over the model's, as `correctCard` does today.

## Steps
1. `cards.ts`: types and `KIND_SLOT`, `colorName`, `kindNoun`, `cardPiece`; then `storedCard` and `outfitNow`, `optionsNow`, `buyPiece`, `colorPieces`, `nextBuyFor`; then `buildCard` outfit, options, colors, buy; then `cardKey`, `shownKeysToday`, `askedAgain`, `exampleOutfit`; then `cardControls`, `cardSpoken`; then `checkFollowUps`.
2. `closing.ts`: `followUps` through `parseClosing` and `EMPTY_BLOCK`.
3. `source.ts`, `gemini.ts`, `providers.ts`: the pass-through. `prepare.ts`: `shownToday` (`askedAgain(question) ? new Set() : shownKeysToday(snap.chat, today, snap.zone)`).
4. `pipeline.ts`: payload, storing, `latestFollowUps`.
5. `prompt.ts`: `CLOSING_FORMAT` lines for the new card shapes and `followUps` (with the shapes above as examples; say plainly that the app, not the model, writes add and changed cards, and that the model names a drawn piece by kind and color words), `PROMPT_VERSION = 5`.
6. Tests (new files, see TESTING.md); re-run the existing ask tests.
7. Typecheck once the Mac has memory: `AskCardView.tsx`'s `CardBody` switch must still compile with the wider union (it has no return type, so it should; if it doesn't, add the one line `default: return null` there and tell the coordinator, because the file is T104's).

## Data changes
- `chat_messages.payload.askCard` gains the shapes above; `payload.followUps` is new. No store, schema or sync change: payload is open JSON.
- Nothing is written to the closet, facts or kv by this task.

## Must not break
- Old stored cards (`outfit` with only `itemIds` and `occasion`, `buy` without `why`, `check`, `ask`, `link`, `correct`) read back and draw as before. `evidence.ts` `kitCards` reads `itemIds` of every stored outfit, so an example (`itemIds: []`) must not break it.
- `askC3`, `askC4`, `askC7`, `askRotation`, `askPipeline`, `askProviders`, `askVoice`, `stepFourBatch`, `closetNoOutfits`, `oneCount`, `serverProxy` pass unchanged (the `done` events keep their shape when there are no follow-ups).
- The model never writes a card's words or numbers: names, counts and the `+n` come from code. Old rules stay: unknown handle, deleted piece, `outfitValid` false, or a buy of a piece he owns drops the card and keeps the words.
- The "Check it" and "Wear this" behavior of old outfit cards.

## Open questions

### For the founder (words users read, taste): ANSWERED Nov 17, in chat (the coordinator asked; each took the recommendation)
1. **Color names: the spec's words win** (Off-white, Light blue, Dark denim; extended as in the `colorName` table above).
2. **Names of drawn pieces: the app's own kind names win**, not the mockup's. A drawn piece reads the way the same kind reads in the closet (use the closet's noun for the kind, `closet/kinds.ts` / `fitcheck/labels.ts`; "oxford", "chore coat"), so every "collared shirt" and "chore jacket" example in this file and in TESTING.md means "the closet's noun for `oxford_shirt` / `chore_coat`". A kind the app lacks (a harrington) reads "Navy jacket".
3. **After Undo:** an add card goes back to asking (Add, No thanks), no new words; a changed card reads `Changed back`.
4. **Past chats:** an add card he never answered shows the drawn piece and its name, no buttons; outcome words `Added` and `Not added`.
5. **A piece he owns in another color: draw the piece Kit named** (`You'd need`); his piece comes first only when kind and color family both match.

### Technical defaults (the coordinator logs)
1. **Lane extension:** `source.ts`, `gemini.ts`, `providers.ts` (follow-ups pass-through) and `prepare.ts` (`shownToday`). No other task on this wave touches them; `prepare.ts` is shared with T105.
2. **"Follow-ups are about clothes" (KC1.3) is not checked by a word list.** The spec's own example "Which is most versatile?" has no clothes word, so a list would drop it. Held by: never under a refusal, the gate's rules, and the prompt. The test covers the rules that can be checked.
3. **"Unless he asks again" (KC2.6)** is `askedAgain`: again, same one or outfit, repeat. A repeat that isn't asked for drops the card; the words stay.
4. **Accessories** are always drawn pieces (the closet has no accessory slot); they count in the card's `+ n` but not toward the "more than 2 pieces he'd need" Example rule, which counts clothing only.
5. **A need that doesn't resolve** (no kind, no color, `multicolor`) drops the whole card; the words stay.
6. **Options:** code orders his pieces first but never adds one the model didn't name.
7. **Card order of accessories:** last, in the model's order.
8. **`avoid` and `allowedColors`** are optional inputs; T103's list is wired by T105, the disliked pieces by T106 to T108. Until then they are absent and checks that need them are tested with hand-made sets.
9. **`buy.why`** is optional, at most 90 characters, gate-checked; if it fails the card stays without it.
10. **`PROMPT_VERSION` 4 to 5.** T105 also bumps it: whoever merges second sets 6.
11. **No follow-ups under a tap question** (`ask` card), to avoid two rows of taps.
12. **VoiceOver for the new shapes** is `null` until T104.
13. **A watch's metal tone** (the mockup draws a silver watch) is not on `CardPiece`; the spec's shape is kind, color, name. T101 picks the default metal.

## Risky in this lane
- **Example pieces vs Kit's words.** The card's example comes from `exampleOutfit`; if T105's evidence doesn't call the same function, Kit's words will describe other pieces than the card draws (the Thursday kind of contradiction).
- **New cards have no view until T104.** The closing format starts asking for them in this task; the stored card then draws nothing in the current `AskCardView`. Don't put a build with T102 but without T104 in front of a tester.
- **`outfitValid` on synthetic garments** (`G(...)`: volume 3, straight leg) may reject or accept differently than for a real photo-read piece. The tests pin the known-good combos; watch it in the T110 run.
- **`prepare.ts` and `prompt.ts` are touched by two sessions** (T102 and T105).
- **`parseShade` coverage** ("off white", "light blue", "dark denim") must be checked against the real function before the table is trusted; a miss silently drops a card.
- **`evidence.ts` `kitCards`** reads every stored outfit's `itemIds`; an example is an empty list. It should be harmless (`outfitKey` of `[]` is `null`) but T105 owns that file.

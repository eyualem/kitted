# T105 · Kit's words

**Size:** normal · **From:** `plan.md` → T105 · **Spec:** `specs/kit-stylist-chat.md` (approved 2026-11-17) · **Lane:** Kit's stylist chat (`app/src/features/ask/`) + `rubric/stylist-guide.md`

Planned from reading only; nothing was run. Paths are under `app/src/features/ask/` unless they start with `app/`, `rubric/` or `tasks/`. `specs.md` and the spec don't disagree on anything this task touches.

## Goal
Kit's words obey the spec's rules because the code enforces them, not only the prompt: the app map is built from the live switches, Kit sees the cards it showed today, an answer is cut at a sentence end (40 words with a drawn card, 60 without), the allowed colors from T103 are Kit's evidence and the gate's list, the gate drops brands, shops, links, product prices, forbidden color talk and "can't do what the app does" lines, and rewrites a wrong color on one of his pieces to the closet name; the guide gets the shop line, the short-answer rule and the knit/woven fix. No screen, no new copy (`en.ts` untouched).

## Files
In the lane (the plan line):
- `prompt.ts`: `PROMPT_VERSION` 5 → 6; `ANSWER_RULES` rewritten (below); the app map (`AppSwitches`, `appMapLines`, `appMap`, `NO_SWITCHES`, `SHOP_LINE`); `systemPrompt(kind, switches)`; `EXAMPLES` trimmed so each obeys the cut.
- `context.ts`: `buildStylistContext` takes an optional third argument and prints today's cards block.
- `evidence.ts`: the color list as evidence (`colorEvidence`, `allowedForCard`, `isColorQuestion`, `mentionsColoring`), `shownCardLines`.
- `gate.ts`: the cut (`cutAnswer`, `wordCount`, `DRAWN_CARD_TYPES`), the new rules and `GateContext` fields, `colorsNamed`, `pricesIn`, `rewritePieceNames`.
- `rubric/stylist-guide.md` and `guide.generated.ts` (regenerated: `node scripts/gen-guide.mjs` in `app/`; never hand-edit it; `askC2.test.ts` fails when they differ).

Outside the plan line's file list, small and named (flag them to the coordinator; T102 and T117 are merged, T106 to T108 come after, so nothing else edits them now):
- `prepare.ts`: passes the new gate fields, today's cards, the live switches, and `allowedColors` into `buildCard`. **Keep T102's `shownToday` repeat check in the `card:` callback exactly as it is.**
- `pipeline.ts`: 4 lines. After `card` is known, `const shown = cutAnswer(answer, !!card && DRAWN_CARD_TYPES.has(card.type))`; use `shown` in `live.finish`, the stored row and `spoken`. Nothing else, and none of T117's body rules (`BODY_RULES`, the emptied-reply refusal) moves. The cut must run after the card because the card arrives only in the closing block, after the words have streamed.

Not touched: `guards.ts`, `cards.ts`, `router.ts`, `memory.ts`, `stylist/arrival.ts`, `StylistScreen.tsx`, `onboarding/firstCheckOffer.ts`, `finish/session.ts`, `en.ts`, `@kitted/core` (T103's `allowedColors` and `COLOR_CHOICES` are imported as they are).

## Interfaces
Everything a test calls. All new parameters are optional, so every existing caller and test stays valid.

### `prompt.ts`
```ts
export const PROMPT_VERSION = 6;
export const SHOP_LINE = "I don't point to shops, but here's what to look for:";       // KC8.2, word for word
export const NEXT_BUY_LINE = "Ask me what to buy next, and I'll show it here.";       // the spec's copy line

/** Which switchable parts of the app are live. */
export interface AppSwitches { outfits: boolean; share: boolean; paywall: boolean; accounts: boolean; notifications: boolean }
export const NO_SWITCHES: AppSwitches;                       // all false (the beta, and the default for tests)
export interface AppMapLine { id: string; text: string }
export function appMapLines(sw: AppSwitches): AppMapLine[];  // in order; ids below
export function appMap(sw: AppSwitches): string;             // one line per entry, "- " + text, no heading, no fence
export function systemPrompt(kind?: AskKind, switches?: AppSwitches): string;  // default NO_SWITCHES; the map sits after CLOSING_FORMAT in <appmap>…</appmap>
```
Map line ids. Always: `tabs` (the four tabs by name, from `t('tab.stylist')`, `t('tab.closet')`, `t('tab.lookbook')`, `t('tab.you')`, and what each holds), `fitCheck` (send a photo in Stylist), `recheck`, `explainRating` (the Why button on a result), `lookbook`, `pastChats` (the Past chats screen in Stylist), `whatKitKnows` (You), `nextBuy`. Only with the switch on: `outfits` (`outfits`: Closet's Outfits view and Next best buy), `share` (`share`), `plan` (`paywall`: Free and Pro), `account` (`accounts`: sign in and backup), `notifications` (`notifications`: You → Settings). Rules for writing them:
- Take every place name and where it lives from the code (`app/(tabs)/_layout.tsx`, the tab screens, `t('tab.*')`, `history.title`, the You rows, `sheets/`), never from memory. If a place isn't on a real screen, it isn't in the map.
- `nextBuy` with `outfits` off says Next buy has no screen of its own: Kit's buy card in the chat is its only home, and Kit's line is `NEXT_BUY_LINE`. With `outfits` on it says the Outfits view in Closet holds Next best buy, and the buy card here opens the same Next buy sheet. With `outfits` off the map never contains "Outfits", "Next best buy" or "Goes with".
- The map is rules text for the model, not copy users read.

`ANSWER_RULES` (rules text; rewrite these lines, keep the rest):
1. Shape: with a drawn card (outfit, options, colors, buy), the move in a first sentence of 15 words or fewer, then at most one short sentence of why, 40 words in all; with no card, 60 words at most. Replaces "two or three sentences in all. 70 words at most." The card shows and asks: never list pieces the card shows, never ask "want me to add it" (the card asks).
2. App: for where something is or how the app works, use only `<appmap>`; if it isn't there, say you don't know of it in the app; never invent a screen, section or button, and never send him to one the map doesn't list.
3. Cards: `<pack>` lists the cards you showed him today; never contradict them (a Next buy card for an olive overshirt means the buy list has it).
4. Shops: asked where to buy, say `SHOP_LINE`, then one or two specifics (fabric, cut, length), and a buy or options card for the piece when one fits. Never a brand, a shop, a link or the price of a product.
5. Colors: when `<evidence>` lists allowed colors, name only those plus the colors of his own pieces. Never tie a color to his skin, face, hair or eyes; if he asks what suits them, say "I rate outfits, never people." then name colors that go with his own pieces.
6. Never say you can't add a piece, change a piece or show an outfit; the app does those. Never say you added or changed anything: the app tells him in a card when it did.

`EXAMPLES`: each `a` must satisfy `cutAnswer(a, drawnCard)` unchanged. Known problem: the second example (the 6.5 and the slides) is three sentences with a link card (not a drawn card, so 60 words applies and it passes); the first and the buy example are two sentences and pass. Check all ten; shorten any that fail, keeping the voice.

### `context.ts`
```ts
export function buildStylistContext(s: StylistSnapshot, question: string, extra?: { shownCards?: readonly string[] }): StylistContext;
```
When `extra.shownCards` is non-empty it prints, after "Today's chat so far" and before `His question:`: the heading `Cards you showed him today (he can still see them; never contradict them or say they're missing):` then each string as given. Empty or absent: nothing, no heading. Handles, `meta` and every other line are unchanged.

### `evidence.ts`
```ts
/** Lines for the cards Kit showed today (chat rows by role 'stylist', dayKey(createdAt) === today with the 4 am rollover, oldest first, newest 8), each at most 200 chars via oneLine. A row whose askCard doesn't parse (storedCard null) is skipped. */
export function shownCardLines(s: StylistSnapshot): string[];
```
Line formats (a test pins them; names are his pieces' current closet names, drawn pieces' `name`; a removed piece is left out; `check`, `ask`, `link`, `correct` give no line):
- outfit: `- Outfit for everyday: Tan bomber, Olive sweater, Dark jeans; he'd need: Black work boots` (occasion = `lower(occasionLabel(card.occasion))`; the `; he'd need: …` part only when `needs` is not empty)
- example outfit (`example: true`): `- Example outfit for everyday (none of it his): Navy overshirt, Grey joggers, …`
- options: `- Options for outerwear: Tan bomber (his), Light blue denim jacket (he'd need)` (slot words: top "tops", bottom "bottoms", shoes "shoes", outer "outerwear", accessory "accessories")
- colors about a piece: `- Colors for the collared shirt: Off-white, Light blue` (`kindNoun(card.kind)`, `colorName` of each)
- colors in general: `- Colors that go with olive: Off-white, Tan, Brown`
- buy: `- Next buy: olive overshirt` (`catalogRow(starterId)`, `pick?.name ?? name`, first letter lowercased; an unknown id is skipped)
- add: `- Add card: Cream striped button-up (asked)`; outcomes read `asked`, `added to his closet`, `he said no thanks`
- changed: `- Changed piece: Black work boots (was Dark brown work boots)`; `undone` reads `(change undone)` instead

```ts
export interface ColorEvidence {
  text: string;                          // the <evidence> lines ('' never: null is returned instead)
  allowed: ReadonlySet<string> | null;   // families; null = no list (not a color question)
  own: ReadonlySet<string>;              // families of his owned pieces plus colors named in his question
}
export const isColorQuestion: (question: string) => boolean;   // table below
export const mentionsColoring: (question: string) => boolean;  // skin, hair, eyes, complexion, undertone in a color question
export function colorEvidence(question: string, route: Route, s: StylistSnapshot, ctx: Pick<StylistContext, 'handles'>, deps?: Pick<EvidenceDeps, 'allowedColors'>): ColorEvidence | null;
export function allowedForCard(raw: unknown, s: StylistSnapshot, ctx: Pick<StylistContext, 'handles'>, deps?: Pick<EvidenceDeps, 'allowedColors'>): ReadonlySet<string> | null;
// EvidenceDeps gains: allowedColors?: (input: AllowedColorsInput) => ColorFamily[]   (default: core's allowedColors, so tests can pass a stand-in)
```
`isColorQuestion` is true for: a message with "color", "colour" or "shade"; or "go/goes/pair/pairs/work/works/match/matches with" followed by a color word and then no garment noun ("what goes with olive?", not "what goes with my olive sweater?"). It is false for "What goes with my olive overshirt?", "Is this outfit good?", "what should I buy next". `mentionsColoring` is true for "What colors suit my skin?", "what colors go with my skin tone and hair", "does navy match my eyes", false for "What color should the collared shirt be?".

What `colorEvidence` does (null unless `isColorQuestion`):
1. **The target.** (a) A piece of his the route names (`route.pieces[0]`): its `garment`, its id. (b) Else a kind of piece in the words (`garmentOf` from `memory.ts`, as the card builder does for "collared shirt"): a garment of that kind's category and subcategory. (c) Else a color word in the question ("what goes with olive?"): the general case. (d) Else null.
2. **The outfit around it, in order:** the newest outfit card shown today that holds that piece (its pieces) or, for a kind, that has a piece of the same slot; else today's newest scored check's pieces; else none. `others` = those pieces as garments (his: `garment`; drawn: `G(category, kind, color)` by the kind's slot) without the target's own slot, plus any other pieces the route names. An accessory target gets no list (T103 D6: the engine would say all 24; return null).
3. **The list.** Call `allowedColors({ others, piece })` once (the occasion is `everyday`; today's check's occasion when its pieces were used). The general case asks twice, with the named color as a `tee` in `others` and the candidate a bottom, then the named color as `jeans` and the candidate a top, and takes the union. `[]` from the engine (it threw) gives `allowed = new Set()` (see the gate rule below).
4. **The text**, exactly: `Allowed colors for <target words> (the rules would not mark these down in this outfit; name only these and the colors of his own pieces): <display names, comma separated, palette order>`. When the list holds all 24: `Allowed colors for <target words>: any of the 24 colors (nothing in the outfit limits it)`. `<target words>` is the piece's closet name, the kind noun, or `what goes with <color name>`. When `mentionsColoring`, add a second line: `He asked about colors for his looks. Start with "I rate outfits, never people." then name only colors that go with his own pieces: <display names of his owned pieces' families, each once, in palette order>` using `t('ask.refuseFace')`, not a retyped string.
5. `own` = the `color_family` of every owned, non-deleted piece, plus any family named in the question (`colorsNamed`).

`allowedForCard(raw)`: when `raw` is a model `colors` block, builds the same target from its `piece` (a handle or words) or `goesWith` and returns the list as a Set; any other raw returns null. `prepare.ts` uses it for the card when the question wasn't detected as a color question, so KC3.3's card rule never depends on the question's wording.

### `gate.ts`
```ts
export type GateRule = /* existing */ | 'price' | 'color' | 'deny' | 'claim' | 'place';
export interface GateContext {
  /* existing fields */
  allowedPrices?: ReadonlySet<string>;           // dollar amounts in the pack and evidence ("115", "30", "60"); absent = none
  allowedColors?: ReadonlySet<string> | null;    // families; null, absent or EMPTY = the sentence rule is off (an empty set still drops every colors card in buildCard)
  ownColors?: ReadonlySet<string>;               // families his sentences may name besides the list
  outfitsOn?: boolean;                           // absent = false
  didAdd?: boolean;                              // the code added a piece before this answer (T106 sets it); absent = false
  didChange?: boolean;                           // the code changed a piece before this answer (T107 sets it); absent = false
}
export const DRAWN_CARD_TYPES: ReadonlySet<string>;   // outfit, options, colors, add, changed, buy
export const wordCount: (s: string) => number;        // whitespace-separated tokens that hold a letter or digit; "button-up" and "7.5" are one
export function cutAnswer(text: string, withCard: boolean): string;
export function pricesIn(text: string): Set<string>;          // "$115" → "115"; "$30–60" → "30","60"; "90 dollars", "90 bucks" → "90"
export function colorsNamed(sentence: string): string[];      // color families named, palette order, no duplicates
export function rewritePieceNames(sentence: string, pieces: readonly GatePiece[]): string;
```
**`cutAnswer`** returns the longest prefix of `text.trim()` made of whole sentences (the existing `sentences` splitting: `.`, `!`, `?` and line breaks; "7.5" and "e.g." never split) that fits, and always keeps the first sentence whole, even over the limit (the first line is kept; the 15-word first line is asked of the model, never enforced by cutting mid-sentence). With `withCard`: at most 2 sentences and 40 words in all. Without: 60 words, any number of sentences. Text already inside the limit comes back unchanged (trimmed). Never splits inside a sentence; the result is always a prefix of the input.

**New rules**, in `checkSentence`, after `brand`, before `build` (so the order of every existing rule is unchanged), each Hermes-safe (no lookbehind, no `matchAll`):
- `brand` (extended, KC8.1): the existing list gains shops and common product brands (etsy, ebay, depop, grailed, poshmark, thredup, mercari, urban outfitters, costco, kohl's, jcpenney, dsw, foot locker, ssense, farfetch, mr porter, todd snyder, buck mason, bonobos, suitsupply, casio, g-shock, seiko, timex, ray-ban, oakley, burberry, dior, rolex, and similar); a link (`https?://`, `www.`, or a name ending `.com`, `.net`, `.org`, `.co`, `.shop`, `.store`); and the ambiguous words (Target, Gap, Express, Guess, Champion, Boss) only capitalised in mid-sentence after "at", "from", "try", "on", "shop at", "check", "head to" (so "I guess it works" and "mind the gap above the shoe" stay). The sentence `SHOP_LINE` + a specific must pass: "shops" alone is never a rule.
- `price`: a dollar amount (`pricesIn`) not in `ctx.allowedPrices` in a sentence that also names a kind of piece (a garment word: jeans, chinos, trousers, pants, tee, shirt, sweater, hoodie, jacket, coat, overshirt, sneakers, boots, loafers, shoes, belt, watch, cap, beanie, or "pair"/"piece"). A service price ("hemming costs about $15 at a tailor") passes by design. His budget and the Starter ranges are in the pack and evidence, so they are allowed.
- `color` (KC3.3): when `ctx.allowedColors` has entries, a sentence whose `colorsNamed` holds a family in neither `allowedColors` nor `ownColors`. `colorsNamed` reads only these words (a small table in `gate.ts`, multi-word first): white; off-white, off white, cream; light grey/gray; grey/gray; charcoal; black; navy, navy blue, dark blue; light blue; blue; olive; green; sage; khaki, beige; tan, camel; brown; burgundy; red; orange; yellow; pink; purple; dark grey/gray → charcoal. "denim", "gold" and "silver" never count (a fabric and metals, KC9.2); the denim washes are named only as "light denim", "mid denim", "dark denim".
- `deny` (KC1.4): "can't / cannot / unable to / not able to" before add, save or put with closet, wardrobe, piece or item in the same sentence; before change, update, fix, rename, correct or edit with closet, piece, color or name; before show with outfit or example. Always on.
- `claim` (KC1.4): "I (have/'ve) (just) added … closet/wardrobe", "it's (now) added … closet", or "I (have/'ve) (just) changed / updated / renamed / corrected / fixed / redrew (your|the|that|it)". Dropped unless `didAdd` (the first form) or `didChange` (the second).
- `place` (KC6.2): next buy or buy next or best buy followed by section, tab, screen, page, list, view or menu; and, only when `outfitsOn` is not true, "outfit(s) tab/view/section/screen/page". A net under the prompt's rule; the sentence is dropped.
- `body` (KC3.5; additions only, nothing loosened): `YOUR_BODY` gains `eyes?` and `eye colou?r`; a new standalone pattern for `skin tone(s)`, `undertone(s)`, `complexion`, `eye colou?r`, `hair colou?r`, and `(brown|blue|green|hazel|grey|gray) eyes`. "eye-catching" and "keep your eyes on the shoes" are not in it (the second is a known miss only if "your eyes" is used; accept it).

**`rewritePieceNames`** (KC5.2, in `createSentenceStream.pass` after `lowerNames` and before `checkSentence`): for each match of the existing `PIECE_NOUN` mention ("your/the/those/these/that" + describing words + a kind noun): when the kind matches exactly one of his owned pieces, the describing words clash with it only by color (the legs agree), and no describing word is something other than a leg word, a color word, a filler word or a word of that piece's own name, replace the describing words and noun with that piece's closet name, first letter lowercased, keeping the original determiner and its capital ("Wear your dark brown work boots" becomes "Wear your black work boots" when his piece is "Black work boots"). The describing-words test must be widened to allow words that appear in the name of one of his pieces of that kind ("work", "chelsea"), since the current rule skips "dark brown work boots" altogether. Anything else (two pieces of the kind, a leg clash, a color that fits one of them) goes the old way: the `fact` rule drops it. Rewrite happens before the check, so a rewritten sentence passes.

### `prepare.ts`
- `const shown = shownCardLines(snap)`; `buildStylistContext(snap, question, { shownCards: shown })`.
- `systemPrompt(route.kind, liveSwitches())` and, in `lookup`, `systemPrompt(r.kind, liveSwitches())`. `liveSwitches()` (in `prepare.ts`, so `prompt.ts` stays pure) reads `outfitsOn()` (`closet/outfitsSwitch`), `SHARE_CARD_BUILT` (`config/features`), `paywallOn()` and `notificationsOn()` (`paywall/switch`), `settingsAccountOn() || accountsOn()` (`account/account`), never a copy of a constant, so a demo screen's switch shows in the map.
- After `ev` is built (and after the `correct` line), `const col = colorEvidence(question, route, snap, ctx, evDeps)`; when not null, append `col.text` to `ev.text` (before `allowedScores` reads it) and put `allowedColors: col.allowed`, `ownColors: col.own` into the gate. The same for the lookup's gate (reuse the same `col`).
- Gate gains `allowedPrices: new Set([...pricesIn(ctx.text), ...pricesIn(ev.text)])`, `outfitsOn: outfitsOn()`. `didAdd` and `didChange` are not set here (T106, T107).
- `card:` callback: keep `correct ?? buildCard(raw, {...})` and `shownToday` as they are; add `allowedColors: gate.allowedColors ?? allowedForCard(raw, snap, ctx, evDeps)`.

### The guide (`rubric/stylist-guide.md`, then regenerate)
All in §0 (always sent, every kind) unless noted:
1. "How you talk" bullet: replace "Two or three sentences, no lists, no headings." with the short-answer rule: with a card a first line of at most 15 words and at most one more short sentence (40 words in all); with no card 60 words at most; no lists, no headings.
2. New bullet **The card does the showing and the asking.** Don't list what the card shows; when he says he owns something, say nothing about adding it (the card asks); never say you can't add, change or show; never say you did.
3. New bullet **Where to buy.** The exact line `SHOP_LINE`, then one or two specifics (fabric, cut, length), and a buy or options card for it when one fits; never a brand, shop, link or price of a product. Also one bullet with the same in §13.
4. New bullet **Words that mean something** (the knit/woven fix): a knit (sweater, cardigan, knit polo, tee, hoodie, sweatshirt) is made of looped yarn and stretches; a woven (oxford and other button-ups, overshirt, chinos, jeans, trousers) is made of crossing threads and holds a shape. Never call a knit woven or a woven a knit; a tee and a sweater are different pieces. §7's "a smooth layer over a knit" becomes "a woven layer (an overshirt or a jacket) over a knit".
5. §0 "Never rate…" bullet gains: and never tie a color to them ("what suits your skin") — say the fixed line, then colors that go with his own pieces.
`stripMarks` and the `(scored…)` marks are untouched; no `(scored…)` mark is added. Regenerate with `node scripts/gen-guide.mjs`.

## Steps
1. Gate first (it is the most tested): `cutAnswer`, `pricesIn`, `colorsNamed`, the new rules and `GateContext` fields, `rewritePieceNames`, the body additions. Run `bodyDecline`, `bodyGate`, `bodyTaps`, `askC4`, `askGuards` after: every existing test passes untouched.
2. `prompt.ts`: map, rules, version, examples. 3. The guide and its regeneration. 4. `context.ts` and `evidence.ts`. 5. `prepare.ts` and the 4-line `pipeline.ts` edit. 6. One full `npm run check` in `app/` at the end, on its own.

## Data changes
None stored. No new `en.ts` key. `PROMPT_VERSION` 6 (a new cache prefix; nothing reads it elsewhere). The pack gains today's cards (piece names and card kinds from today's chat, which the pack already carries as text): still clothes and choices, no new kind of data leaves the phone.

## Must not break
- **Every T117 body rule:** `bodyDecline`, `bodyGate`, `bodyTaps` pass unchanged; the emptied-reply refusal still shows `I rate outfits, never people.`, uncounted, with no Retry. No existing regex is loosened; `YOUR_BODY` only grows.
- T102's card checks and repeat key (`shownToday`) in the `card:` callback; the buy card's gain stays Kit's private evidence.
- "The AI sees, the code judges, the AI explains": every number, list and card still comes from code; the cut and the gate only remove words.
- The score rule: the scores a sentence may say are still only those in the pack and evidence.
- Same photo, same score: no scoring file is touched.

## Open questions
### For the founder
None. No user-visible word is new: Kit's lines used are the spec's (`I rate outfits, never people.`, the shop line, the Next buy line). The map and the rules are text for the model.

### Technical defaults (the coordinator logs these)
- **D1 · "With a card" = a drawn card** (outfit, options, colors, add, changed, buy). A tap question, a check start, a link and the Not quite right? card keep the no-card limit of 60. Why: the spec's shape rule is about the picture; a one-line tap question needs no cut.
- **D2 · The 15-word first line is asked, not enforced.** Cutting inside a sentence would break "cut at a sentence end". The first sentence is always kept whole. Measured on the model's real answers in T110 (KC11.2).
- **D3 · The cut runs after the stream, so the live row can show more than 40 words for a moment and shortens at the end.** The card is only known at the closing block. If the founder dislikes the flash it is a later change (stop streaming at 60 words).
- **D4 · Two edits outside the plan line's file list:** `prepare.ts` and `pipeline.ts` (above).
- **D5 · `ownColors` includes the colors in his own question** ("what goes with olive?" lets Kit say "olive"). Spec: "other than his own pieces' colors".
- **D6 · The price rule needs a piece word in the sentence** and lets any amount in the pack or evidence through (his budget, Starter ranges). A bare "$15 hem" passes.
- **D7 · The sentence rule is off for an empty list.** T103 returns `[]` when the engine throws (fail closed): that drops every colors card (existing `buildCard` behavior) but cannot also silence every sentence with a color word.
- **D8 · A general color list ("what goes with olive?") is the union of the two pairings** described under `colorEvidence`; T103's function needs a slot, and the spec doesn't say which.
- **D9 · The knit/woven fix is written from the principle, not from Thursday's line.** The review (`inputs/2026-11-12-thursday-chat/review.md`) is git-ignored and not in this worktree or the main checkout, so the exact wrong sentence isn't known. If the coordinator has it, add it to the test as a case; the guide bullet stays.
- **D10 · The gate rewrites a wrong color, not an old kind.** "The olive tee is a sweater" leaves no tee in his closet, so "your olive tee" has nothing to rewrite to; the pack carries only the new values (tested). A `renamed` list from today's `changed` cards is the later fix (T107 can add it: `GateContext.renamed`).
- **D11 · The context outfit for a color list** is, in order, the newest shown card with that piece or slot, then today's newest scored check, then none (all 24 allowed). Decided here because the spec says "the outfit in the chat, or today's check".
- **D12 · "Fewer than 2 colors survive" drops the whole card** (T102's `buildCard` already does), matching the failure table's "the card is dropped if it holds that color".
- **D13 · `claim` and `deny` are always on, with `didAdd`/`didChange` false until T106/T107 set them.** Until then Kit cannot claim an add or a change; after, the flags let it say so.
- **D14 · `buyNext` evidence still holds "+N outfits"** while the Outfits view is off (`specs/closet-beta.md`). Left alone (outside the checks); the model can still say "adds 6 outfits" in the beta. Worth a later look.

## Risks in this lane
- **A false positive empties an answer.** An answer whose sentences all drop shows the Retry line (or, for body rules, the refusal). The new rules are narrow on purpose and each has a "must pass" case in TESTING.md; widen nothing without one.
- **`guide.generated.ts` drift:** edit the guide, then regenerate; `askC2` fails otherwise.
- **The pack grows** by at most 8 lines plus the color list; the map and the new rules add about 300 to 450 tokens to the (cached) system part. Within the spec's 400 to 700 token estimate.
- **Regexes run on Hermes:** no lookbehind, no `matchAll`, as the file's own comments say.
- **Today's chat lines still hold Kit's own old words** ("your dark brown work boots") after a correction; the gate's rewrite is what stops them being echoed.
- **A check's stored summary and parts lines** can name the photo's color for a piece he later corrected (KC5.6: the check changes only through Re-score). The gate rewrite covers Kit's mention; the pack is left as the check wrote it.

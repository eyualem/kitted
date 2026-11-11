# T73 · Closet without Outfits

**From:** `plan.md` → T73 · **Spec:** `specs/closet-beta.md` → CB1 (approved by the founder 2026-11-08); `specs.md` → F7 ("Outfits and Next best buy are off for the beta") · **Lane:** Closet

## Goal
On his phone, Closet opens straight on his pieces with no `Pieces | Outfits` switch, and nothing anywhere (piece page, Kit's buy card, Starter essentials' toast) shows an outfit list, an outfit count or `Next best buy`; the Outfits code stays, behind one switch that demo screens turn on.

## Files
Only these. Anything else is a deviation the implementer writes in REPORT.md.
- `app/src/config/features.ts` (shared): add `OUTFITS_BUILT = false`, with a comment in the file's style (off for the beta, `specs/closet-beta.md` CB1; demo screens turn it on).
- `app/src/features/closet/outfitsSwitch.ts` (new): the switch at run time (`outfitsOn`, `useOutfitsOn`, `setDemoOutfits`, `prepareOutfitsDemo`), modelled on `features/account/account.ts` + `features/account/demo.ts`.
- `app/src/features/closet/outfits.ts`: add the pure `closetView` and `pieceOutfits`. `openingSegment`, `outfitCount`, `outfitGain`, `goesWith`, `buildOutfits` stay exactly as they are.
- `app/src/app/(tabs)/closet/index.tsx`: the switch decides whether the `Segmented` control and the Outfits branch exist.
- `app/src/features/closet/PiecePage.tsx`: no `Outfits` row and no `Goes with` while off; the outfit lists aren't built while off.
- `app/src/features/closet/NextBuySheet.tsx`: while off, the route sends him to Closet instead of drawing the sheet.
- `app/src/features/ask/cards.ts`: add `buyGainLine`; `cardSpoken`'s buy line uses it.
- `app/src/features/ask/AskCardView.tsx`: `BuyCard` uses `buyGainLine` (the visible line).
- `app/src/i18n/en.ts` (shared): one line, `closet.edit.foot` (CB1.3's words).
- Demo screens (the spec's Touches: "demo screens for Outfits"; outside the plan line's list, see Open questions):
  - `app/src/demo/scenarios.ts`: a new optional field `outfits?: true` on `ScreenScenario`; set on 182, 183, 184, 193, 202; two new screens, 260 and 261.
  - `app/src/demo/prepareDemoScreen.ts`: screen 260's story (one kv step).
  - `app/src/demo/applyDemoScreen.ts`: one call, `prepareOutfitsDemo(scenario)`, beside `prepareAccountDemo`.
- `app/src/features/finish/starterActions.ts` (Paywall lane; no session holds it; **needs the coordinator's OK**, see Open questions): the toast's one condition.

Not touched (and the verifier checks the diff for it): `features/morning/**`, `features/stylist/**`, `features/closet/outfitActions.ts`, `features/closet/OutfitsView.tsx`, `features/closet/nextBuyData.ts`, `features/finish/gains.ts`, `features/ask/evidence.ts`, `features/ask/prompt.ts`, `app/src/app/_layout.tsx`, `app/src/app/sheets/next-buy.tsx`, `@kitted/core`, the Python engine.

## Interfaces
What the tests call. The test writer reads only this section.

**The switch** (`config/features.ts`, `features/closet/outfitsSwitch.ts`)
- `OUTFITS_BUILT: boolean` = `false` (exported from `@/config/features`).
- `outfitsOn(): boolean`: `OUTFITS_BUILT || <demo on>`. False on a fresh start.
- `setDemoOutfits(on: boolean): void`: turns the demo override on or off and notifies subscribers. Tests call `setDemoOutfits(false)` in `afterEach`.
- `useOutfitsOn(): boolean`: the same value as a hook (`useSyncExternalStore`), re-rendering on `setDemoOutfits`.
- `prepareOutfitsDemo(sc: Pick<ScreenScenario, 'outfits'>): void`: `setDemoOutfits(sc.outfits === true)`. Every demo screen calls it, so leaving 182 for 15 turns it off again.

**Closet's opening view** (`features/closet/outfits.ts`, pure)
- `closetView(on: boolean, count: number, remembered: string | null): { switcher: boolean; segment: 'pieces' | 'outfits' }`
  - `on === false` → `{ switcher: false, segment: 'pieces' }` whatever `count` and `remembered` are (`'outfits'`, `'pieces'`, junk, `null`).
  - `on === true` → `{ switcher: true, segment: openingSegment(count, remembered) }` (today's rule: his last tap, else Outfits at 3+).
  - Never reads or writes storage.

**A piece's outfit rows** (`features/closet/outfits.ts`, pure)
- `pieceOutfits(on: boolean, around: readonly Outfit[], itemId: string): { outfitsWith: number; goes: { role: GoesWithRole; outfit: Outfit }[] }`
  - `on === false` → `{ outfitsWith: 0, goes: [] }` (even when `around` holds outfits with the piece).
  - `on === true` → `{ outfitsWith: around.filter((o) => o.itemIds.includes(itemId)).length, goes: goesWith(itemId, around) }` (exactly today's numbers).

**Kit's buy card line** (`features/ask/cards.ts`)
- `buyGainLine(gain: number | null, on: boolean): string | null`
  - `on === false` → `null` for every gain.
  - `on === true` → `null` when `gain` is `null` or `<= 0`; `'+1 outfit with what you own'` for 1; `'+{n} outfits with what you own'` otherwise (today's `ask.card.buy.gainOne` / `ask.card.buy.gain`).
- `cardSpoken(card, words)` (signature unchanged): for `type: 'buy'` it joins `[t('ask.card.buy.tag'), name, buyGainLine(card.gain, outfitsOn()), budget]`, so with the switch off: `cardSpoken({ type: 'buy', starterId: 's02', gain: 12 }, w)` → `'Next buy. Navy polo. $30–40.'`; with it on → `'Next buy. Navy polo. +12 outfits with what you own. $30–40.'` (today's).
- `buildCard({ type: 'buy', … }, input)` is unchanged: it still returns `{ type: 'buy', starterId, gain }` with the Closet's count (private evidence, stored on the message). `buildEvidence` for `buyNext` is unchanged (its `· +N outfits` lines and its ranking stay).
- `BuyCard` (in `AskCardView.tsx`) draws `buyGainLine(card.gain, useOutfitsOn())` under the name, or nothing. Its `KCard` label is `cardSpoken(...)`.

**Starter essentials' toast** (`features/finish/starterActions.ts`)
- `pickStarter(store, e, opt, ids, nowMs): Promise<StarterToast | null>` (signature unchanged). Adding a new basic: `text` is `t('toast.fits', { n: gain })` only when `outfitsOn()` and `gain > 0`; otherwise `t('starter.addedToast', { item: piece.name })` = `Added {item}.`. The piece is saved and `undo` deletes it, as today, either way.

**The piece page's note** (`i18n/en.ts`)
- `t('closet.edit.foot')` = `Got one wrong? Change it here. The drawing follows. Your scores stay the same.` (one string, whatever the switch; see Open questions).

**Next best buy's sheet** (`features/closet/NextBuySheet.tsx`)
- `NextBuySheet()`: hooks run in the same order as today; when `useOutfitsOn()` is false it renders `<Redirect href="/closet" />` (expo-router) and nothing of the sheet (no `Next best buy`, no `What it unlocks`). When on: exactly today's sheet.

**Closet screen** (`app/(tabs)/closet/index.tsx`)
- Reads `const on = useOutfitsOn()`; the loader depends on `on` and computes `outfitCount` only when `on` (else `count: 0`); `const view = closetView(on, count, remembered ?? null)`.
- `view.switcher === false`: no `Segmented` (VoiceOver radiogroup `Closet` with radios `Pieces` and `Outfits`), no fit card above Outfits, no `OutfitsView`. The pieces branch renders exactly as today: scans-waiting row, To confirm (unchanged here; T74 changes it), the head-to-toe sections.
- The `onAnswer` line stays character for character: `onAnswer={(a) => void answerWithUndo(answerDeps, checkId, ask, a, candidate, runnerUp)}` (releaseSafety R10 reads it).
- `pick` (the only writer of `closet.segment`) is reachable only through the `Segmented`, so with the switch off nothing writes or deletes `closet.segment`.

**Piece page** (`features/closet/PiecePage.tsx`)
- Reads `const on = useOutfitsOn()`; the loader's deps become `[id, on]`; it calls `buildOutfits` only when `on` (else `around = []`), then `const { outfitsWith, goes } = pieceOutfits(on, around, item.id)`. The `Outfits` `ValueRow` and the `Goes with` section keep today's conditions (`outfitsWith > 0`, `goes.length > 0`), so with the switch off neither draws.

**testIDs:** none new (the flows match the existing words and VoiceOver labels below).

**Demo screens**
- `ScreenScenario.outfits?: true`: "Outfits on for this screen (`specs/closet-beta.md` CB1): the Pieces | Outfits switch, Next best buy and Goes with, as before the beta."
- On (`outfits: true`): **182** `Closet · Outfits`, **183** `Closet · No outfits yet`, **184** `Closet · a piece and what goes with it`, **193** `Closet · Outfits · streetwear pick`, **202** `Closet · Outfits with the fit card`. Their stories don't change.
- New **260** `Closet · beta, Outfits remembered` · id `C1` · scenario `full` · onboarded · now `FULL_NOW` · href `/closet` · story: `{ at: '2026-10-22T07:31:00', do: 'kv', key: 'closet.segment', value: 'outfits' }` · no `outfits` flag (off). The full closet makes 3+ outfits, so today this screen would open on Outfits.
- New **261** `Closet · a piece, beta` · id `C2` · scenario `full` · onboarded · now `FULL_NOW` · href `/closet/item/B1` · under `/closet` · no story · off. Screen 184's piece and data with the switch off.
- Every other screen is off, including 15 (Closet), 96/112/114/195/197 (piece pages), 161/180 (What you already own), 171 (`What should I buy next?`), 12 (morning card), 13 (outfit idea).
- If 260 or 261 is taken on main when this merges, take the next free numbers and say so in REPORT.md (T74 takes the numbers after T73's).

## Data
None new. `closet.segment` stays in storage untouched (read, never written, while the switch is off). The buy card's stored `gain` keeps being written (private evidence; nothing reads it for the screen while off).

## Steps
1. `config/features.ts`: `OUTFITS_BUILT = false` with its comment.
2. `features/closet/outfitsSwitch.ts`: `outfitsOn`, `setDemoOutfits`, `useOutfitsOn`, `prepareOutfitsDemo` (listeners as in `account.ts`).
3. `outfits.ts`: `closetView`, `pieceOutfits` (pure, beside `openingSegment` / `goesWith`).
4. Closet screen: `useOutfitsOn`, `closetView`; render the `Segmented` and the Outfits branch only when `view.switcher`; skip `outfitCount` when off. Update the header comment (Pieces | Outfits is behind `OUTFITS_BUILT`).
5. Piece page: `useOutfitsOn`, `buildOutfits` only when on, `pieceOutfits`.
6. `NextBuySheet`: the redirect when off.
7. `cards.ts`: `buyGainLine`; `cardSpoken` uses it with `outfitsOn()`. `AskCardView.tsx` `BuyCard` uses it with `useOutfitsOn()`.
8. `starterActions.ts`: the toast's condition (`outfitsOn() && gain > 0`). Only after the coordinator's OK.
9. `en.ts`: `closet.edit.foot` to the new words.
10. Demo: the `outfits` field, the five flags, screens 260 and 261 (+ 260's story), `prepareOutfitsDemo(scenario)` in `applyDemoScreenNow` next to `prepareAccountDemo`.
11. `npm run check` in `app/`.

## Must not break
- `openingSegment`, `outfitCount`, `outfitGain`, `buildOutfits`, `goesWith`, `outfitLists`, `slotChecklist` and their tests (`closetOutfits.test.ts`, `outfitSpeed.test.ts`, `nextBuy.test.ts`).
- Kit's ranking: `buildEvidence`'s `buyNext` lines (`· +N outfits`, best first) and `buildCard`'s `gain` (`oneCount.test.ts` G1, G2, G8; `lookPacks.test.ts`; `askC4.test.ts`).
- The morning card (`Wear this` with Undo, Swap, Change), Kit's outfit idea card (`Wear this`), Lookbook's Saved outfits: no file of theirs changes (`morningService.test.ts`, `morningSwap.test.ts`, `swapSheet.test.ts`, `chatUi.test.ts`, `toast.test.ts` U3, `cardFollowsEdits.test.ts`, `woreOwn.test.ts`, `askRotation.test.ts`).
- Closet's Pieces grid and To confirm as today (`closetSections.test.ts`, `closetBatch287.test.ts` C2 "at most 3", `fitDoubt.test.ts` BG2, `releaseSafety.test.ts` R10 regex on `index.tsx`).
- Starter essentials still opens from the empty Closet (screen 214) and still adds, changes and removes pieces with Undo.
- `syncSchema.test.ts` (`SEGMENT_KEY` stays exported and synced).
- `scenarios.test.ts` (screens sorted and unique; 260 and 261 go at the end).
- Existing tests that change with the spec (the test writer edits them, with the reason in REPORT.md; never to weaken them):
  - `pieceEdit.test.ts` line ~550: `closet.edit.foot`'s old words → CB1.3's.
  - `oneCount.test.ts` G1 "the What you already own toast says the same +N": runs with `setDemoOutfits(true)` (the Outfits build), and a switch-off twin is added under CB1.2.
  - `askC7.test.ts` line ~27 (`cardSpoken` buy with `+12 outfits…`): runs with the switch on; the switch-off twin is added under CB1.2.

## Open questions
- **Kit saying the number in words.** `prompt.ts` tells Kit a number may come from evidence ("+6 outfits"), and the `buyNext` evidence lists `· +18 outfits`, so the real model can still write "it adds 18 outfits with what you own" in its answer, on screen. The spec's line is "private evidence, not a number on screen", but its list (item 5) names only the card's line, and the plan line gives T73 only the buy card line in `ask/`. · **who:** the founder (what Kit says; and checking a prompt change needs a paid AI run) · **default meanwhile:** T73 doesn't touch the prompt or the evidence; CB1.2 is checked on the card and the demo's canned answer; a real-model answer is "not verified". Recommended: one line in the evidence header ("rank by +N; never say the number") as a small Kit-lane task with one cheap AI check.
- **`features/finish/starterActions.ts` is outside the Closet lane** (Paywall lane: `features/finish`), and the spec's Touches doesn't list it, but CB1 item 6 and CB1.2 (`+{n} fits` toast) can't be met without it. No session holds that lane now. · **who:** the coordinator (technical) · **default:** a one-condition edit there, logged as a deviation in REPORT.md and in DECISIONS-LOG.
- **Demo files outside the plan line's list** (`demo/scenarios.ts`, `demo/prepareDemoScreen.ts`, `demo/applyDemoScreen.ts`): the spec's Touches names "demo screens for Outfits", and CB1.5 needs them. · **who:** the coordinator (technical) · **default:** edit them as above; screens 260 and 261 are new.
- **The piece-page note with Outfits on.** CB1.3's words drop "and your outfits"; on a switch-on demo screen (184) the note then says less than the page shows. · **who:** a technical default (logged) · **default:** one string for both (the spec's Touches says one line in `en.ts`); when Outfits comes back, its own spec can bring the old words back.
- **Next best buy's route.** Nothing links to `/sheets/next-buy` while off, but the route stays registered (`app/_layout.tsx` is out of lane) and the app has a URL scheme (`kitted://`). · **who:** a technical default (logged) · **default:** `NextBuySheet` redirects to `/closet` while off.
- **The buy card's "reason".** The spec says the card "keeps its name, price and reason"; today's card has a tag (`Next buy`), the price and the name, and Kit's reason is the chat line above it. · **who:** a technical default · **default:** nothing else on the card changes; only the gain line goes.

### Answers (coordinator, 2026-11-09)
- **Kit saying the number in words:** the founder in chat: "Yes, leave Kit alone". Kit may mention outfit counts in its own words as a reason; T73 doesn't touch the prompt or the evidence. Not a defect, and no AI run.
- **`starterActions.ts` and the demo files:** OK'd by the coordinator (no session holds the Paywall lane; the spec covers both). Edit as planned; REPORT.md names the deviation.
- **The other three defaults** (one note string, the redirect, the card's reason): accepted.

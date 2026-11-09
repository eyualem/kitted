# T55 · The card waits until Kit knows two outfits; a checked card that suggested nothing reads "Today's fit"

**From:** `plan.md` → T55 · **Spec:** `specs.md` → F6.2 (rewritten Nov 9) and F13.1 (new; this task builds only its read side), both with the founder's yes in chat (DECISIONS-LOG #408). The plan line says `spec: specs.md`; `specs.md` counts as approved (#388, as for T54). The lane's own spec `specs/kit-and-morning.md` isn't written yet (T50) and this task doesn't need it · **Lane:** Kit and the morning card · **Built on:** T54's branch (PR #75, not merged)

## Goal
A new user's morning or evening card stops suggesting the same single outfit every day: it suggests one only once Kit knows two different outfits of his that work, says why until then, and once he checks a fit it reads "Today's fit" / "Tonight's fit" with his score instead of "You went with your own"; the notifications session gets a read-only `morning.canSuggest()`.

## What is there today (verified Nov 9)
- `closetState` (`app/packages/kitted-core/src/ideas.ts:143`) returns `'enough'` at the first top × bottom × shoes that passes `outfitValid`; `pickOutfit` (`:151`) returns `outfit: null` unless `'enough'`. So 3 pieces that make one outfit already get that outfit on the card, every day.
- The service's `pick()` (`app/src/features/morning/service.ts:182`) is the only way the card picks: `ensureCard` → `postCard`, `change`, `swap`, `refreshWeather`, `freshenWeather`, `followPieces`, `gainWeather` all go through it. `swapOptions`/`swapTo` use core `swapOptions`, only for a card that already has an outfit.
- `MorningCard.tsx:141–146` shows `idea.title.empty` / `idea.title.thin1` / `idea.title.thin` and `idea.empty` / `idea.thin1` / `idea.thinN` whenever the card has no outfit (`enough = m.items.length > 0`), with `piecesKnown` = every non-deleted closet piece. That copy is already F6.2's word for word.
- `CheckedRow` (`MorningCard.tsx:328–353`) titles the collapsed card `idea.went.pick` ("You wore my pick") after Wear this and a matching check, else `idea.went.own` ("You went with your own"), whether or not the card suggested anything.
- `freshen` (`service.ts:432`) skips a card only when `stayingIn` or `first.fitCheckId` (never set by a check: "checked" is derived). So a checked card with no outfit can still gain one through `gainWeather`/`freshenWeather`, which would flip its collapsed title to "You went with your own" for a suggestion he never saw.
- Kit's outfit answers (`app/src/features/ask/evidence.ts:159`) call core `pickOutfit` directly. They don't go through the service, so they keep today's rule (the founder asked about the cards only, #408).
- No Python counterpart: `handoff/fixtures/kitted_logic.py` has `rotation` (ported with parity) but no picker or `closetState`. The new check uses only parity-ported pieces (`outfitValid`, `itemKey`) and the rubric's score, so no Python change and no parity test is involved.

## Where the new check lives (technical default, logged by the coordinator)
In the app, `app/src/features/morning/readiness.ts`, **not** in core. The plan line allows either ("morning/, core `ideas.ts` (a new function only)"). Reasons: core belongs to the Fit check lane and T64 will rework `ideas.ts`, so a new export there (and in core `index.ts`, which the line doesn't list) would collide; and this worktree's `node_modules` symlink tests the main checkout's core, so a core change would need the #358 rework of `node_modules` on a Mac short of memory. The function uses only core's public, parity-ported exports (`outfitValid`, `outfitReading`, `itemKey`, `isScored`, `defaultRubric`), so it follows any change T64 makes to them. **No `@kitted/core` file changes in this task.** If the coordinator prefers core, the same function moves to `ideas.ts` unchanged and the #358 note applies.

## Files
Only these. Anything else is a deviation the implementer writes in REPORT.md.
- `app/src/features/morning/readiness.ts` (new): `canSuggestOutfits`.
- `app/src/features/morning/service.ts`: `pick()` gates on `canSuggestOutfits`; `freshen` leaves a checked card alone; new read-only `canSuggest`. T54's `ensureCard`/`postCard` lock and look-again stay exactly as they are.
- `app/src/features/morning/copy.ts`: two pure functions, `cardWaitLines` and `checkedTitle`.
- `app/src/features/morning/MorningCard.tsx`: uses them (no change to layout or to any other words); `testID="idea-checked"` on the checked row.
- `app/src/features/morning/index.ts`: the new demo screens join `MORNING_DEMO_SCREENS`. (`morning` itself needs no change: `canSuggest` comes with the service.)
- `app/src/i18n/en.ts` (shared, one session at a time; stage only these hunks): two new keys.
- **Outside the lane (deviation the coordinator approves or not):** `app/src/demo/scenarios.ts` and `app/src/demo/prepareDemoScreen.ts`, for three new demo screens (39, 40, 54). The build rules need a demo screen for each new UI state and no lane owns the demo files; only new entries are added, no existing screen changes.

Not touched: `@kitted/core` (all of it), `app/src/features/ask/*` (Kit), `StylistScreen.tsx`, `woreOwn.ts`, `SwapSheet.tsx`, `HeroStrip.tsx`, any notification code.

## Interfaces
What the tests call. The test writer reads only this section.

### `app/src/features/morning/readiness.ts`
```ts
import type { Boldness, ClosetItem, Loose, Styles } from '@kitted/core';
export function canSuggestOutfits(closet: readonly ClosetItem[], styles?: Styles | null, boldness?: Loose<Boldness>): boolean;
```
True when the closet makes **at least two different outfits that work**; false otherwise (an empty closet included). Exactly:
- **An outfit** is one top, one bottom and one pair of shoes from `closet` (by `slot`: `'top'`, `'bottom'`, `'shoes'`). Layers (`slot: 'outer'`) are never part of the count: a jacket over the one outfit doesn't make a second.
- **Works** = the picker's own rules: `outfitValid([top, bottom, shoes], styles, boldness)` is true (as `closetState` checks) **and** `isScored(defaultRubric.score(outfitReading([top, bottom, shoes]), { occasion: 'everyday', styles, boldness }))` (the picker drops an unscored outfit, `ideas.ts:226`). `styles` defaults to `null`, `boldness` to `'a_little'`, as in `closetState`.
- **Different** = the two outfits' keys differ, where an outfit's key is the `itemKey` (core, `rotation.ts:58`: slot, subcategory, color family, pattern) of its top, bottom and shoes. Two outfits are the same when all three keys match; one differing piece (another top, or other bottoms, or other shoes) makes them different. So near-duplicate pieces count once, as in core `rotation()`'s count of distinct outfits: two white tees with the same chinos and sneakers are one outfit. Equivalently, for closets whose valid outfits all score: `canSuggestOutfits(c, s, b) === (rotation(c, s, { boldness: b, layers: false }).count >= 2)`.
- Pure, synchronous, no store, no clock; it may stop at the second distinct outfit. The caller passes only pieces he has (non-deleted).

### `app/src/features/morning/service.ts`
- `createMorningService(deps: MorningDeps): MorningService`, `MorningDeps` unchanged (`{ store, clock, weather, ids, enabled? }`).
- **`canSuggest(nowMs?: number): Promise<boolean>`** (new, on the returned service, so `morning.canSuggest()` from `@/features/morning`). `nowMs` defaults to `clock.nowMs()`. Returns `canSuggestOutfits(closet, styleInput(style), boldness)` where `closet` = `store.closet.all()` minus `isDeleted`, `style` = the style a card posted at `nowMs` would start with (`startingStyle(slotAt(nowMs, zone).slot)`: the slot's remembered `idea.style.<slot>` kv, else the profile's first look), `boldness` = `profile.boldness ?? 'a_little'`. So it gives the same answer `ensureCard(nowMs)` would act on. Read-only: no store write (chat, dailyIdeas, outfits, kv untouched), no weather call (`permission`, `forecast` never called), ignores `enabled()`, consent and the evening auto-stop (those are about posting, not the closet). No profile (a wipe or reinstall) → false for an empty closet. Works offline.
- **`pick()`** (internal; every card plan goes through it): builds the pick input as today, then, if `!canSuggestOutfits(input.closet, input.styles, input.boldness)` (the **whole** closet, before Swap's `exclude`), returns `{ state: input.closet.length === 0 ? 'empty' : 'thin', outfit: null, known, missingSlots }` (known/missingSlots as `pickOutfit`'s thin branch builds them) instead of calling `pickOutfit`. Effects the tests see:
  - `ensureCard()` with a closet below the threshold posts the card as today with `dailyIdeas` row `outfitId: null`, chat message `outfitId: null`, and **no** new `outfits` row; above it, as today.
  - `change(id, { occasion | style })`, `refreshWeather(id)` and `freshen()` (its `gainWeather`/`freshenWeather` re-plans) on a card below the threshold keep `outfitId: null`. `change` on a card whose closet has since dropped below the threshold sets `outfitId: null` (it already does when the picker finds nothing).
  - `swap(id, …)` below the threshold → `{ swapped: false }`, nothing written. `swapOptions` unchanged (a card with no outfit → `[]`).
- **`freshen(nowMs?)`**: also returns `false` and changes nothing when a scored first check (`status: 'scored'`, no `parentId`) is in the card's window (`checkInSlot`), the same test `followPieces` uses. Its doc comment already says a checked card is left alone; the code now does it.
- Unchanged: `ensureCard`'s signature and T54's guarantees (one card per idea id, the waiting call, look again, adopt), `slotAt`, `ideaId`, `checkInSlot`, `historyFor`, `defaultOccasion`, `EVENING_FROM_HOUR` (17), the 4 am rollover, `wear`, `swapOptions`, `swapTo`.

### `app/src/features/morning/copy.ts` (pure)
- `cardWaitLines(piecesKnown: number): { title: string; why: string }`, the card's words when it suggests no outfit, `piecesKnown` = his non-deleted pieces (layers included):
  - `0` → `{ title: 'Your first fit check', why: "Send me today's fit and I'll start learning your closet." }`
  - `1` → `{ title: '1 piece so far', why: "I only know 1 of your pieces. Check today's fit and I'll learn the rest." }`
  - `n ≥ 2` → `{ title: '{n} pieces so far', why: "I only know {n} of your pieces. Check today's fit and I'll learn the rest." }` (e.g. `3` → `'3 pieces so far'`, `"I only know 3 of your pieces. Check today's fit and I'll learn the rest."`). These are today's keys `idea.title.empty/thin1/thin` and `idea.empty/thin1/thinN`; no copy changes.
- `checkedTag(row: Pick<DailyIdeaRow, 'slot' | 'outfitId' | 'occasion'>, check: Pick<FitCheckRow, 'occasion'>): string`, the collapsed card's tag (the founder, Nov 9): `` `${when} · ${occasion}` `` with `when` = `'Today'` (`idea.today`) for `'day'`, `'Tonight'` (`idea.tonight`) for `'evening'`, and:
  - `row.outfitId !== null` (the card suggested an outfit) → the card's own occasion, `cardOccasionLabel(row.occasion)`, as today (e.g. `'Today · Class'`)
  - `row.outfitId === null` → **the check's** occasion, `occasionLabel(check.occasion)` (`@/features/stylist/thread`), e.g. `{ slot: 'evening', outfitId: null, occasion: 'going_out' }` with a check for `'everyday'` → `'Tonight · Everyday'`; `{ slot: 'day', outfitId: null, occasion: 'class' }` with `'everyday'` → `'Today · Everyday'`
  - `check` is the check whose score the row shows: `m.check.latest` (the window's most recent first check, or its latest re-check; see the technical default under Open questions)
- `checkedTitle(row: Pick<DailyIdeaRow, 'slot' | 'outfitId'>, worePick: boolean): string`, the collapsed card's title:
  - `worePick` → `'You wore my pick'` (`idea.went.pick`)
  - else `row.outfitId !== null` (the card suggested an outfit) → `'You went with your own'` (`idea.went.own`)
  - else `row.slot === 'day'` → `"Today's fit"` (`idea.went.today`, new)
  - else (`'evening'`) → `"Tonight's fit"` (`idea.went.tonight`, new)

### `app/src/i18n/en.ts` (new keys, nothing else)
- `'idea.went.today': "Today's fit"`
- `'idea.went.tonight': "Tonight's fit"`

### `MorningCard.tsx`
- `FullCard`: `title`/`why` for a card with no outfit come from `cardWaitLines(m.piecesKnown)` (same words as today).
- `CheckedRow`: `what = checkedTitle(m.row, m.worePick)`; `tag = checkedTag(m.row, m.check.latest)`; the a11y label stays `idea.a11y.collapsed` with that `what` and the same occasion as the tag: `'{when}, {occasion}: {what}, {score}, {word}. Shows the result.'`, e.g. `"Today, Everyday: Today's fit, 7.0, Put together. Shows the result."` for a card that suggested nothing, `"Today, Class: You went with your own, 7.0, Put together. Shows the result."` for one that suggested an outfit. Photo, score numeral, score word and chevron unchanged.
- testIDs: `idea-checked` (new): the checked row's root (`CollapsedShell`'s `Pressable`, or its `View` in Past chats), passed as a new optional `testID` prop on `CollapsedShell`, set only by `CheckedRow`. Existing: `hero-strip`. Everything else is found by its words.
- Component-test seam (no code change needed): `MorningCard` reads `store` from `@/data/db`, `quota.snapshot()` from `@/features/fitcheck/session`, `weatherSource` from `@/services/weather`, `sessionClock` from `@/state/session`, and imports `expo-router` and `../../../modules/kitted-location`; a test can `jest.mock` each (as `lookPage.test.ts` and `limitCard.test.ts` mock `@/data/db` and `expo-router`) and point `@/data/db`'s `store` at a memory store filled by the real services.

### Demo screens (new; existing ones unchanged)
- **39** · "Morning card · three pieces" · `S1d`, scenario `firstRun`, onboarded, `now: '2026-10-22T07:40:00'`, `href: '/stylist'`, `weather: 'mild'`, `weatherAllowed: true`; story `[CLOSET_3, { at: '2026-10-22T07:40:00', do: 'morning' }]` (T1 white tee, B1 khaki chinos, S1 white sneakers: one outfit). Shows the full card with no outfit: "3 pieces so far" / "I only know 3 of your pieces. Check today's fit and I'll learn the rest." / "Check my fit". (Before this task this closet got an outfit.)
- **40** · "Morning card · checked, nothing suggested" · `S1d`, `firstRun`, onboarded, `now: '2026-10-22T07:43:00'`, `href: '/stylist'`, `weather: 'mild'`, `weatherAllowed: true`; story `[{ at: '2026-10-22T07:40:00', do: 'morning' }, { at: '2026-10-22T07:42:00', do: 'check', photoId: 'p01b', occasion: 'everyday' }]`. The card (empty closet at 7:40, its own occasion Class) collapsed: tag `Today · Everyday` (his check's occasion), title "Today's fit", his score.
- **54** · "Evening card · checked, nothing suggested" · `S1d`, `firstRun`, onboarded, `now: '2026-10-22T18:33:00'`, `href: '/stylist'`, `weather: 'mild'`, `weatherAllowed: true`; story `[{ at: '2026-10-22T18:30:00', do: 'morning' }, { at: '2026-10-22T18:32:00', do: 'check', photoId: 'p01b', occasion: 'everyday' }]`. Collapsed: tag `Tonight · Everyday` (his check's occasion; the card's own is Going out), title "Tonight's fit", his score.
- All three added to `MORNING_DEMO_SCREENS` (`index.ts`), and to `SCREENS` in numeric order (`scenarios.test.ts` wants it sorted and unique; 39 sits after 38, 54 after 53). If another branch has taken 39, 40 or 54 by merge time, take the next free numbers and say so in REPORT.md.
- Existing card screens, checked for their story: **26** (firstRun, T2 + B1: 2 pieces, no shoes) still "2 pieces so far" / "I only know 2 of your pieces…": reads right. **27** (new user, empty) still "Your first fit check" / "Send me today's fit…": reads right. **12, 25, 28, 29, 30, 31, 32, 259** use the full seed closet (6 tops, 3 bottoms, 4 shoes), far above the threshold: outfits as today; **29** (card suggested, then his own check) still "You went with your own": right, since that card suggested one. No existing screen showed a 3-piece card or a checked card without a suggestion, hence 39, 40 and 54.

### Flow (Maestro)
- `app/e2e/flows/T55-card-threshold.yaml` (written by the test writer): opens 39, 40 and 54 through `../common/open-demo.yaml` and asserts their words. Runs with Metro on the Simulator; replayed on every later task.

## Data
None. No stored field, kv key or migration. "The card suggested an outfit" is read from the existing `DailyIdeaRow.outfitId` (non-null), so cards already stored keep their meaning: an old thin card (null) collapses to "Today's fit"/"Tonight's fit", an old suggesting card to "You went with your own".

## Steps
1. `readiness.ts`: loop tops × bottoms × shoes; skip a combo whose `itemKey` triple was already counted; count it when `outfitValid` and the everyday score `isScored`; return true at the second.
2. `service.ts`: in `pick()`, gate on `canSuggestOutfits` over the whole closet with the input's `styles` and `boldness`; build the thin result. Add `canSuggest(nowMs)` reading closet, `startingStyle(slot)` and profile, writing nothing; return it from the service. In `freshen`, after the stayingIn/fitCheckId test, return false when a scored first check is in the card's window.
3. `copy.ts`: `cardWaitLines`, `checkedTag`, `checkedTitle`. `en.ts`: the two keys.
4. `MorningCard.tsx`: use all three (the tag and the a11y label's occasion from `checkedTag`'s rule); `testID` prop on `CollapsedShell`, `idea-checked` from `CheckedRow`.
5. Demo: screens 39, 40, 54 in `scenarios.ts`, their stories in `prepareDemoScreen.ts`, the numbers in `MORNING_DEMO_SCREENS`.
6. Run the new tests and the suites under Must not break with `npx jest --watchman=false <files>` (the worktree's symlinked `node_modules` is fine: no core change). `npm run check` only when the Mac's memory allows (CLAUDE.md rule 8); the Simulator, the flow and the screenshots only when one is free.

## Must not break
- T54, locked: `app/src/__tests__/morningOneCard.test.ts`, all green and unedited (its fresh-setup line posts an empty-closet card, `outfitId: null`, and the check counts for it; unchanged).
- `morningService.test.ts` (the full seed closet and the two-week rotation on 5 tops, 3 bottoms, 3 shoes: still 14 day cards and 3 evening cards, each with an outfit; "an empty closet still posts the card (no outfit)"; the freshen tests, none of which has a check), `cardFollowsEdits.test.ts` (R6: a checked card never changes, now also through freshen's weather), `askRotation.test.ts`, `swapSheet.test.ts`, `morningSwap.test.ts` (M2: the gate reads the whole closet, so swapping every shoe away still ends in `swapped: false` with the outfit kept), `cardNoAddTile.test.tsx`, `scenarios.test.ts`, `copyChecks.test.ts`.
- **Kit's outfit answers don't change:** `evidence.ts` keeps calling core `pickOutfit`; with one working outfit Kit still names it.
- `closetState`, `pickOutfit`, `swapOptions` and everything else in core: untouched.
- The card's layout, every other word, its buttons and VoiceOver labels.

## Handoff to the notifications session (the coordinator copies this into `side-session-notes/…/morning-card-weather.md`)
- **Name:** `morning.canSuggest(nowMs?: number): Promise<boolean>`, from `import { morning } from '@/features/morning'` (the service instance; the same method is on any `createMorningService(...)`).
- **Means:** "would the card suggest an outfit if it were posted at `nowMs`": true once Kit knows two different outfits of his that work (top + bottom + shoes; layers don't count; near-duplicate pieces count once), for the style that window's card would start with and his boldness. False on an empty or wiped closet.
- **Read-only:** no writes, no weather, no network; ignores consent, the evening auto-stop and the demo gate. Cheap enough to call when scheduling.
- **Not included:** remembering the last answer. F13.1's "the first one after it can suggest" needs the notifications side to keep its own last value (its own kv) and compare. No notification code or copy is in T55.
- **Watch for:** a card is locked for its window. If the closet crosses the threshold mid-window (a clothes scan, not a check), `canSuggest()` turns true while that window's card, already posted, still says "I only know {n}…" until the next window. A notification scheduled for the next morning is fine; one fired the same window could disagree.

## Open questions
- **Answered (the founder, Nov 9, in chat), the collapsed tag:** when a card that suggested no outfit collapses after a check, its tag shows **the check's** occasion, e.g. "TONIGHT · EVERYDAY" above "Tonight's fit · 7.0". A card that suggested an outfit keeps its own occasion, as today. Built as `checkedTag` (Interfaces).
- **Answered (settled by the coordinator as the planner's defaults, Nov 9):** near-duplicates count once (two white tees + the same chinos and sneakers = one outfit), as the closet's own outfit count does; and the waiting card's strip stays as it is (screen 39 shows the 3 known pieces, no Wear this or Swap; #380).
- **Which check's occasion, when he made more than one in the window.** · technical default (the coordinator logs it): the check whose score the row shows, `m.check.latest`: the window's most recent first check (no `parentId`), or that check's latest re-check. So the tag's occasion, the score and the photo always come from the same check, and a re-score to another occasion moves the tag with the score. (The earliest check, the one that first collapsed the card, would leave the tag naming one check's occasion over another's score.)
- **Readiness ignores occasion and weather** (like `closetState`): two outfits that work by the everyday rules count, even if tonight's Going out or a rainy day leaves only one. · technical default (the coordinator logs it): occasion- and weather-free, so the card and the notification agree all day.
- **A thin card doesn't re-plan when the closet crosses the threshold mid-window** (see Watch for). · technical default: no new re-plan trigger in T55; the next window's card suggests.
- **The new check is in the app, not core** (above). · technical default; the coordinator logs it.
- **Demo files are outside the lane.** · technical default: add screens 39, 40, 54 there (new entries only); the coordinator approves the deviation.

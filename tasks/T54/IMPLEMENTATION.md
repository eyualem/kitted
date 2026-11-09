# T54 · One card per day and window, even when Stylist asks twice while the weather loads

**From:** `plan.md` → T54 · **Spec:** `specs.md` → F6 (the plan line says `spec: specs.md`; `specs.md` counts as approved, DECISIONS-LOG #388; the lane's own spec `specs/kit-and-morning.md` isn't written yet and this task doesn't need it) · **Lane:** Kit and the morning card

## Goal
On any evening he sees exactly one evening card (and on any day exactly one day card), however many times Stylist is opened, refocused or brought back to the front while the live weather (NWS, up to 7 s on the TestFlight build) loads.

## The cause (reproduced by the planner, Nov 8)
`StylistScreen.tsx:224-235` calls `morning.ensureCard().then(() => morning.freshen())` on every focus of the Stylist tab and on every AppState `active` while it's focused. `ensureCard` (`app/src/features/morning/service.ts:234`) checks `store.dailyIdeas.get(id)` once, at the start, then awaits the profile, the weather permission, the forecast (up to 7 s live), the chat, the pick and the outfit save, and only then writes the chat card and the `dailyIdeas` row. A second call that starts in that gap passes the same check and posts a second card.

A throwaway Jest file (deleted after the run) against the memory store and seed `full`, at 2026-11-07 18:30 US Eastern, weather resolving after 50 ms:
- `Promise.all([ensureCard(), ensureCard()])` → both returned `'2026-11-07|evening'`; **2** chat messages with `cardType: 'morning'`, both `payload: { ideaId: '2026-11-07|evening' }`; 1 `dailyIdeas` row (the second put overwrote the first, so its `messageId` is the second message). Both messages render `<MorningCard ideaId=…>` (`MessageView.tsx:41`), so he sees the same card twice.
- The second call started 10 ms after the first (focus, then AppState `active`): the same, 2 cards.
- Card posted, then a new service instance over the same store at 21:00 (a cold launch): `null`, 1 card. Not a cause.
- 18:30 → 23:59 → 00:30 → 03:59 → 04:00 sequentially: `'2026-11-07|evening'`, null, null, null, `'2026-11-08|day'`. The 4 am day key holds. Not a cause.
- Chat message written, `dailyIdeas` row missing (the app killed between the two writes): the next call posted a **second** card. A second, narrower way to get the same duplicate; fixed here too.

The race needs no slow weather: every `await` between the check and the writes is a gap, so two calls in the same tick race even with location off.

**Likely trigger on his phone (not proven: the TestFlight build is distribution-signed, so `tools/phone/pull.sh` can't read its data):** opening Stylist after 5 pm, then within the 7 s weather wait either switching tabs and back (focus fires again), leaving the app and coming back (AppState `active`), or iOS reporting `active` just after a cold launch. Each is a second `ensureCard` while the first waits.

### Other causes, each ruled out
- **Cold launch vs resume:** the dedupe is the stored `dailyIdeas` row, which survives a relaunch; reproduced above (relaunch → `null`, 1 card). The new in-memory lock starts empty each launch, and the stored row still covers it.
- **Two launch paths both posting:** only two callers exist (`grep ensureCard`): `StylistScreen.tsx:227` and `demo/prepareDemoScreen.ts:336`. The demo one runs only through `/demo/screen/<n>`, which `_layout.tsx:91` and `+native-intent.tsx:9` gate on `DEMO_ENABLED`; that is false in a Release build unless `KITTED_DEMO=1` (`demo/config.ts`, #323), and no `eas.json` profile sets it (log #404's build notes). So on TestFlight the only caller is Stylist's, with its two triggers. Stylist is mounted once (`app/(tabs)/stylist/index.tsx`), and `morning` is one module-level instance (`features/morning/index.ts`).
- **The day key across 4 am, or a time zone:** `slotAt` uses core `dayKey`, which rolls over at `04:00` (`DEFAULT_ROLLOVER`), so 5 pm–3:59 am is one evening key; the existing `windows` test and the reproduction above confirm it. The Release clock is `systemClock` with the device's own offset per instant; one zone gives one key all evening. (A time-zone change mid-evening, i.e. travel, isn't covered here; not his case unless he travelled on Nov 7.)
- **The TestFlight install reusing the dev build's data:** same bundle id, so iOS may keep `kitted.db` across the install. The only writer of a `cardType: 'morning'` message is `ensureCard` (`grep`), so old data can't by itself make two messages for one idea id; dev-build data would have had the row already, which makes `ensureCard` post nothing. Sync could otherwise copy rows in, but `createSyncEngine` has no caller outside its tests, so nothing is pulled.
- **The `MORNING_DEMO_SCREENS` / `enabled()` gate:** in Release `getDemoArgs().demoScreen` and `getDemoState().screen` are null, so `enabled()` is true. The gate can only stop a post, never cause a second one.
- **The day card reading as an evening card after 5 pm:** `cardGreeting(row.slot, …)` (`copy.ts`) takes the card's own slot, so a day card keeps "Morning." / "Afternoon.". Not a cause.

## Files
Only these. Anything else is a deviation the implementer writes in REPORT.md.
- `app/src/features/morning/service.ts`: `ensureCard` posts at most one card per idea id: one call at a time per id inside the service, a second look just before writing, and adopting a card message already posted for this id. Nothing else in the file changes.

Not touched: `app/src/features/stylist/StylistScreen.tsx` (its two triggers stay; the service makes them safe, and covers any later caller), `features/morning/index.ts`, `MorningCard.tsx`, `copy.ts`, `en.ts`, `stylist/thread.ts`, the demo files, `@kitted/core`.

## Interfaces
What the tests call. The test writer reads only this section.
- `createMorningService(deps: MorningDeps): MorningService` (unchanged). `MorningDeps = { store: KittedStore; clock: Clock; weather: WeatherSource; ids: (prefix: string) => string; enabled?: () => boolean }`.
- `ensureCard(nowMs?: number): Promise<string | null>` (signature unchanged; `nowMs` defaults to `clock.nowMs()`). Returns the idea id (`` `${dayKey}|${slot}` ``, from `ideaId(day, slot)`) when this call posted, or adopted, the card for its window; `null` when it posted nothing. New guarantees:
  - **One per id, ever.** For one idea id the store ends with exactly one chat message `{ role: 'stylist', kind: 'card', cardType: 'morning', payload.ideaId === id }`, exactly one `dailyIdeas` row whose `messageId` is that message's id, and exactly one new `outfits` row (`source: 'idea'`) for the card (none for an empty closet), whatever number of `ensureCard` calls run, concurrently or not.
  - **Concurrent calls on one service instance:** while a call for id X is in flight, any other call whose moment maps to X waits for it and resolves `null`, only after the first has settled (so once it resolves, `store.dailyIdeas.get(X)` is non-null if the first posted). It resolves `null` even if the first call rejected; it never rejects because of the first. Of N concurrent calls, exactly one resolves to X (or none, if the card is gated off: consent declined, evening auto-stop, `enabled()` false).
  - **Calls for different ids don't wait for each other:** a day-card call in flight (16:59:58) and an evening call (17:00:03) each post their own card.
  - **A failed call releases its id:** if a call rejects (e.g. `weather.permission()` or a store write throws), the next call for that id runs normally and can post.
  - **Look again before writing:** after the weather and the pick, if a `dailyIdeas` row for the id now exists (posted by another service instance over the same store), the call writes nothing (no chat message, no outfit row, no idea row) and resolves `null`.
  - **Adopt a card already posted:** if no `dailyIdeas` row exists for the id but a morning-card message with `payload.ideaId === id` does (the app was killed between the two writes), the call writes no new message: it patches that message's `outfitId` to the new outfit, writes the row with `messageId` = that message's id, and resolves the id.
- Unchanged: `slotAt`, `ideaId`, `checkInSlot`, `historyFor`, `defaultOccasion`, `EVENING_FROM_HOUR` (17), the 4 am rollover, `freshen`, `change`, `swap`, `swapOptions`, `swapTo`, `wear`, `refreshWeather`.
- Test doubles that already exist: `createMemoryStore()` (`@/data/memoryStore`), `loadScenario(store, seed, { scenario: 'full', zone: US_EASTERN, asOfMs })` (`@/data/seedLoader`), `manualClock(ms)` (`@/services/clock`, `.set(ms)`), `counterIds()` (`@/services/ids`). A weather double is a plain `WeatherSource` object: `{ kind: 'sample' | 'live', permission: async () => 'granted' | 'denied' | 'unknown', requestPermission, forecast: (window) => Promise<DayWeather | null> }`; for the races, `forecast` returns a deferred promise the test resolves (or rejects) by hand once both calls are in flight. `kind: 'live'` makes the service's own timeout 7 s (`'sample'`: 2 s) and the forecast's rejection reads as no weather.
- testIDs: none added (no UI change).
- Demo screens: none new. Existing ones that show the card, unchanged: 12, 25–29, 31, 32, 259 (day card), 30 (evening card).

## Data
None. No stored field, kv key or migration. The lock is in memory only (a `Map<ideaId, Promise>` inside `createMorningService`), empty on every launch.

## Steps
1. In `createMorningService`, keep a `Map<string, Promise<string | null>>` of in-flight posts by idea id.
2. `ensureCard(nowMs)`: the `enabled()` gate, then `slotAt` → `id`, then **synchronously** (no `await` before this point) look in the map: if `id` is there, `await` it with errors swallowed and return `null`. Otherwise put the new post's promise in the map and remove it in a `finally` (only if the map still holds that same promise).
3. Move today's body into that post, then:
   a. after the forecast, re-read `store.dailyIdeas.get(id)`; if it exists, return `null` before `pick`/`saveOutfit` (so no orphan outfit row);
   b. from the fresh `store.chat.all()`, find a morning-card message with `payload.ideaId === id`; if there is one, adopt it: `pick`, `saveOutfit`, `store.chat.patch(existing.id, { outfitId })`, then the row with `messageId: existing.id`. Only when there's none, fall back to `adoptLegacy` (day slot) and then to posting a new message, exactly as today.
4. Keep every existing gate and its order: consent declined → `null`; the evening ignore count is still written to kv and the 3-evening auto-stop still returns `null`.
5. Run the new tests and `morningService.test.ts`, `cardFollowsEdits.test.ts`, `askRotation.test.ts`, `swapSheet.test.ts`, `morningSwap.test.ts` with `npx jest --watchman=false <files>` (the worktree's `node_modules` is the main checkout's; fine, no core change). `npm run check` only when the Mac's memory allows (CLAUDE.md rule 8).

## Must not break
- A call after the card exists returns `null` and posts nothing (`morningService.test.ts` › "posts the card alone, once per slot").
- The evening card after a day card the same day; weekends default to Everyday; no weather permission → no weather and the pick still works (the season path); an empty closet still posts the card with `outfitId: null`; evening cards stop after 3 untouched evenings and come back (`morningService.test.ts`).
- The two-week rotation: 14 day cards and 3 evening cards (`morningService.test.ts` › "rotation over two weeks").
- A seeded legacy "outfitIdea" card is still adopted as the day card, and its greeting line marked (`adoptLegacy`).
- `StylistScreen`'s `ensureCard().then(() => morning.freshen())` chain: `freshen` runs after the card is stored, for the waiting call too.
- The demo stories (`prepareDemoScreen.ts` awaits `ensureCard` per step) still post one card on each card screen.
- The card's look, words and buttons: no change.

## Open questions
- **Did the two cards show the same outfit, and roughly what time was it?** · the founder (only he saw it) · non-blocking: proceed. **Answered Nov 8 (founder, in chat): he doesn't remember.** So the reproduced race stays the cause; the fix (one card per day and window, whatever the trigger) also stops a second copy from any other path. The race above shows the same outfit twice (both messages read the one row). Two different outfits would point to two different idea ids, which this plan doesn't explain, and would need another look.
- **His Nov 7 duplicate stays in Past chats.** · technical default: leave it. A read-side hide (one morning card per idea id in `stylist/thread.ts`) would also hide future duplicates from any cause and so mask a bug; it's outside the plan line's files. The coordinator logs it.
- **Scope of "F6".** · technical default: this task's F6 is the lead sentence's "once a day … from 5 pm an evening card", i.e. one card per day and window. F6.1–F6.3 and the greeting by name belong to other tasks or are already built (the greeting by name is T51, F6.3's picker is T64); here they're regression only (Must not break). The coordinator logs it.
- **`freshen` can run twice at once** (both chained calls, when the first card was planned without weather) and fetch the weather twice. It patches the one card and never posts, so it can't show a second card. · technical default: out of scope.

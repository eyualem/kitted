# T14 · Testing contract

Written by the planner; tests written and locked by the test writer. **Locked once the lock line below is filled.** After that only a test-writer agent changes this file or the tests, only to add or strengthen, with the reason in REPORT.md. Results never go here; they go in REPORT.md.

**Lock:** `8f78ba055006334bfb3566ae1865baefa5056edf` · 2026-11-08 · tests: `app/src/__tests__/betaLimits.test.ts`, `firebase/tests/api.test.ts` (describe `FP7 the beta`, and L7's changed default test), `app/e2e/flows/T14-beta-limits.yaml` (with `app/e2e/common/beta-nothing-to-buy.yaml`, `beta-sample-photo.yaml`)

Plan-line criteria: FP7.1, FP7.2, FP7.3, FP7.4, FP7.5, FP7.6, FP7.7 (7). All seven are below.

Banned on the beta (FP7 "Never during the beta"), used by FP7.5 and every screen check: the regexes `/\bpro\b/i`, `/free checks?/i`, `/trial/i`, and a Kitted price `/\$\s?\d/` or `/\/(yr|mo)\b/`. (Clothing budgets such as `Under $30` are not Kitted prices and aren't reachable from the beta states below; the screen checks still flag any `$` for a look.)

Shared set-up for the app tests: a memory store, a manual clock in America/New_York, the mock reading source with latency 0, and `createQuota({ store, clock, isPro: () => false, serverTier: async () => 'beta' })` ("on beta"); `resetTierForTests()` before each test. "Reads" means calls to the reading source; "sent" means a read or an ask call.

## Criteria
- **FP7.1** · On the beta rules, a 4th photo in one 4 am–4 am day shows the beta limit card and sends nothing; the server also refuses a 4th check.
  · how: unit (fit-check service + `limitCardContent`) and server emulator, plus the flow
  · test: `betaLimits.test.ts` › `FP7.1 · a 4th photo (camera or library) is held with the beta card; nothing read, nothing counted`; `FP7.1 · the beta card's words and its one button`; `FP7.1 · at 4 am the next photo scores and the held one is offered`; `FP7.1 · the server says the day's checks are used before the phone does: the next photo is held without a call` (added by the test writer: the edge); `api.test.ts` › `FP7.1 · beta: 3 checks pass, the 4th new check id is refused`
  · expect: after 3 scored checks on beta, `start({ mode: 'check' })` → `outcome: 'held'`; reads unchanged; today's `UsageDay` `checks: 3` (not 4); the thread gets `[user photo, stylist card 'held']`; `limitCardContent` → tag `Daily limit`, right `Resets at 4 am`, title `That's today's 3 fit checks.`, body `I'll save this photo and score it after 4 am.`, save `Save for tomorrow`, `tryPro: null`, a11y `Daily limit. That's today's 3 fit checks. I'll save this photo and score it after 4 am.`; `canStartCheck()` false. Server with `server/config { tier: 'beta' }`: reads on `B1`, `B2`, `B3` → 200 each with header `x-kitted-tier: beta`; `B4` → `429 { error: 'limit', which: 'checks' }`; the day doc `checks: 3`. The same check id may still call again (a hedge on `B3` → 200).
  · must not: the 4th photo is never read or sent (also from the library, `photoUri`); the count never reaches 4; the card never has `Score it now with Pro` or Try Pro, also with `paywallBuilt: true` and with the demo store script on; no paywall route is pushed; the 3rd photo is never held.
  · edges: at 3:59 am (still the old day) a photo after 3 checks is held; at 4:00 am a new photo scores (day 2's first) and the held one gets `Ready to score last night's photo?` once (nothing read before the tap; `Score it` scores it on day 2's count). A library photo behaves like a camera photo. Server and phone disagree (phone 2 used, server 3): the server's 429 posts `That's today's fit checks. Your photo is saved here. Try again after 4 am. This one doesn't count.` and the phone's count becomes 3, so the next photo is held without a call.
  · red: 4 app tests (one added) + 1 server test (+ the flow; and the changed L7 server test, see REPORT.md). As committed, every `betaLimits.test.ts` test stops at `T14: not built` (the `resetTierForTests` stub, run before each test); with the tier stubs made no-ops (not committed) each fails on its own line, given here. App: the three card tests fail at the 2nd of the day's 3 photos, `Expected "scored", Received "held"` (free's 1 a day; `threeChecks`, L138); the server-disagrees test the same at its 2nd photo (L247). Server (emulator): `expected [ 200, 'pro' ] to deeply equal [ 200, 'beta' ]` on B1 (the unknown tier falls back to Pro's); L7 the same on B0.

- **FP7.2** · Each of the 3 checks keeps its re-check, and a re-check doesn't use one of the 3.
  · how: unit (service) and server emulator
  · test: `betaLimits.test.ts` › `FP7.2 · check, re-check ×3: all scored; checks 3, re-checks 3; the 4th photo is held`; `FP7.2 · three checks first, then the 3rd's re-check still scores`; `FP7.2 · a re-check whose window crosses 4 am still scores and uses none of the new day's 3` (added: the edge); `api.test.ts` › `FP7.2 · beta: a re-check per counted check, never a 4th`
  · expect: on beta, check 1 → re-check → check 2 → re-check → check 3 → re-check: six `outcome: 'scored'`; `UsageDay` `{ checks: 3, rechecks: 3 }`; then a photo → `held`. Three checks in a row, then the 3rd check's re-check (inside its 30 min) → `scored`, `checks` stays 3. Server, beta: R0 re-check before any check → 200 (a re-check across 4 am); three checks and three re-checks → 200 each; a 4th re-check → `429 which: 'rechecks'`; the day doc `{ checks: 3, rechecks: 3 }`.
  · must not: a re-check never raises `checks`; a re-check never makes `canStartCheck()` false on its own; a re-check after its window (30 min; the first-ever check: until 4 am) is refused as today; a second re-check of the same check is refused.
  · edges: a re-check whose window crosses 4 am (the first-ever check) still works after 4 am and doesn't use one of the new day's 3. Offline re-check: not counted (as FP7.4).
  · red: 3 app tests (one added: the 4 am crossing) + 1 server test. App: check + re-check ×3 → `canStartCheck` `Expected true, Received false` after the 1st check and its re-check (L279); three checks first → outcomes `[scored, held, held]` (L294); the 4 am crossing → `Expected "scored", Received "held"` at the 3:45 am check (L319). Server: `expected [ 200, 'pro' ] to deeply equal [ 200, 'beta' ]` on R0.

- **FP7.3** · The 21st question shows FP7's line and isn't counted.
  · how: unit (ask pipeline) and server emulator
  · test: `betaLimits.test.ts` › `FP7.3 · the 21st question gets the beta line, no Try Pro, not counted`; `FP7.3 · the 20th question is still answered`; `FP7.3 · the subtitle on beta: no check line; questions left once 3 or fewer`; `FP7.3 · a failed or offline question never counts; at 4 am the count resets` (added: the edges); `api.test.ts` › `FP7.3 · beta: 22 questions pass on the server (20 + 2), the 23rd is refused`
  · expect: on beta with `questions: 19`, a question is answered and `questions` becomes 20; then a question → outcome `limit`; the thread gets his bubble and a stylist line of `cardType: 'limit'` with text exactly `That's 20 questions today. More at 4 am.` and `payload.tryPro: false` (also with the `tryPro` dep returning true); `UsageDay.questions` stays 20; the answer source is not called. `questionLimitText({ tier: 'beta' })` returns the same words. Stylist subtitle at 20 used: `0 questions left today`. Server, beta: 22 asks → 200; the 23rd → `429 which: 'questions'`; taps (`x-kitted-free: tap`) still pass up to 10.
  · must not: the line never says `Pro`, `go Pro` or `up to`; no Try Pro row; the 21st question is never sent and never counted; a question whose answer failed never counts (as today).
  · edges: offline question: `You're offline, so I couldn't answer that. It doesn't count.`, not counted; at 4 am the count resets and a question is answered. Off-topic decline: not counted (as today).
  · red: 4 app tests (two added: the subtitle, and failed/offline/4 am) + 1 server test. App: the 20th → `canAskQuestion` `Expected true, Received false` (L368); the 21st → the line is free's `That's today's 5 questions. More at 4 am, or go Pro for up to 50 a day.` (L389); the subtitle → `Received {"key": "stylist.quota.free"}` (L403); failed/offline → refused as `limit` before sending (L414). Server: `expected [ 200, 'pro' ] to deeply equal [ 200, 'beta' ]` on the first answered ask.

- **FP7.4** · Failed, offline, "not rated" and same-photo checks never lower the count.
  · how: unit (service, on beta)
  · test: `betaLimits.test.ts` › `FP7.4 · failed, offline, not rated and same-photo checks leave 3 checks`; `api.test.ts` › `FP7.4 · beta: a failed, timed-out or unfinished read gives the check back`
  · expect: on beta, one each of: the reading fails (`fault: 'ai'`), offline (`fault: 'offline'`), nothing ratable ("not rated"), the same photo as an earlier scored check → none consumes: `UsageDay.checks` unchanged and `canStartCheck()` still true; then 3 different scored photos all score, and only the next is held. Server, beta: a 500 read, a `MAX_TOKENS` read and a `SAFETY` read give the check back (day `checks` 0), then 3 good reads pass and the 4th is refused.
  · must not: none of those four ever raises the count or causes a later photo to be held early; none posts the limit card.
  · edges: a failure mid-way (the reading starts, then the network drops) → failed, not counted. Known gap, not this task's: the server counts a finished read even when the phone decides "not rated" (T21 owns the server's "What counts"); the phone's count stays right.
  · red: 1 app test + 1 server test. App: after one scored photo, the same photo again leaves `canStartCheck` `Expected true, Received false` (free's limit, L465). Server: `expected [ 200, 'pro' ] to deeply equal [ 200, 'beta' ]` on the MAX_TOKENS read.

- **FP7.5** · On the beta rules, no paywall or soft page opens from any moment in "The paywall opens only", and no visible string contains a price, "Pro", "free check" or "trial" (a copy test plus a flow through 4 photos and 21 questions).
  · how: unit (gates and a copy sweep) + flow (Maestro) + Simulator screens (UI inventory below)
  · test: `betaLimits.test.ts` › `FP7.5 · paywallOn is false on beta, even with the demo store on; true on free with it on`; `FP7.5 · the soft page is skipped on beta and the notification ask follows`; `FP7.5 · no upgrade button anywhere on beta (limit card, question line, You's Today card)`; `FP7.5 · copy sweep: every string a beta state shows is free of banned words`; `FP7.5 · the beta saved card's body, word for word`; `FP7.5 · the morning card's checks-used line on beta, word for word`; `FP7.5 · the tier before and after the server's answers; a purchase wins` (added: the edges); `T14-beta-limits.yaml` › `FP7.5 · four photos and 21 questions on beta`
  · expect: with `setDemoPaywall('ok')` and `setDemoTier('beta')`: `paywallOn()` false; with `setDemoTier('free')`: true (the control: the tier, not the build, closes it). The finish service on beta after the moves card: `paywallDue` → `skip`, `openPaywall` never called, the notification ask is posted. The copy sweep collects, on beta, every string from: `stylistSubtitle`/`quotaLine` (0–3 checks used, re-check open, held photo, 0–20 questions used), `limitCardContent` (limit and saved), `heldReadyContent`, `questionLimitText`, `planStatus`/`planShortName`/`usageLines` for `{ kind: 'beta' }`, the Today card's words, `own.limit.beta`, `fail.limit` → none matches a banned regex. Exact words (the founder, Nov 8): on beta, `limitCardContent` for a saved held check → `body` exactly `Saved. I'll score it when you open Kitted after 4 am.` and `a11y` exactly `Waiting to score. After 4 am. Saved. I'll score it when you open Kitted after 4 am.`; on free the saved body stays exactly `Saved. I'll score it when you open Kitted after 4 am. It uses tomorrow's free check.` (unchanged). `t('own.limit.beta')` exactly `Your fit checks reset at 4 am.`, and the morning card on beta with 3 checks used shows that line, never `Your free check resets tomorrow` (on free with its check used the old line stays). Flow: open demo 252 (beta, 0 used, latency 0); take 4 different sample photos through the camera's "Choose from your photos" sheet: photos 1–3 each show a score card, photo 4 shows `That's today's 3 fit checks.` and `Save for tomorrow`, and no `Score it now with Pro`; type 21 questions: the 21st gets `That's 20 questions today. More at 4 am.`; open You → Settings → Plan & usage: `Kitted beta`. After every step: `assertNotVisible` each banned regex, and no paywall (`Continue free`, `KITTED PRO`, `Restore` absent).
  · must not: a paywall, the soft page, `See Pro`, `Try Pro`, `Score it now with Pro`, `Score it with Pro`, `Manage subscription`, `It uses tomorrow's free check.`, `Your free check resets tomorrow`, `Restore purchases`, a price, the word "Pro", "free check(s)" or "trial" on any beta screen; `router.push('/paywall…')` is never called on beta.
  · edges: before the server's first answer (fresh install, `serverTier` null): `appTier` is `beta` while `PAYWALL_BUILT` is off, so the very first screens already follow beta (no `1 free check today`). A stored `'pro'` from the old server default turns into `beta` on the next answer. A purchased Pro on a beta server (demo `pro=1`) is Pro (the purchase wins).
  · red: 7 app tests (one added: the tier before/after the server's answers and a purchase) + the flow. App: paywallOn → `T14: not built` (`tierNow`, L523); the soft page → cards `[null, 'plan']` and the paywall opened (L545); no upgrade button → held at the 2nd photo (L138); the copy sweep → `snapshot.tier` `Expected "beta", Received undefined` (L581); the saved body → held at the 2nd photo (L138); the morning line → `Received "<missing own.limit.beta>"` (L658); the tier edges → `T14: not built` (`fallbackTier`, L666). Flow `T14-beta-limits.yaml`: not run (the Mac's memory: ~200 MB free, 7 GB compressed; no Simulator or Metro booted for it). Red by construction: `screenScenario(252)` and `(259)` don't exist (`scenarios.ts` ends at 251), so `applyDemoScreen` returns null and the beta screen never loads. The verifier runs it after the build. **Changed after the build (2026-11-08, the implementer's dispute, upheld; REPORT.md → Disputes):** after the 20 questions the flow no longer waits for `0 questions left today` (false while the saved 4th photo waits: FP7 and the interface keep `1 photo waiting to score` first); it asserts the title's label `Stylist, 1 photo waiting to score` and that no `Stylist, … question(s) left today` shows (bites a build that drops the waiting photo's priority); the count of 20 stays proven by You's Today card (`… 0 of 20 questions left`), Plan & usage (`Questions, 20 of 20 used`) and no early refusal. In the same change, every step on a grouped VoiceOver element now matches its whole label, because Maestro 2.12.1 full-matches the text or label (`Regex.matches`, read from its jar) and the views inside a grouped element aren't in the hierarchy: the Stylist title, the limit and saved cards (word for word), Kit's line (`Kit: …`), the Today card, Settings' row (`Plan & usage, Kitted beta`), the plan card and its rows (`Fit checks, 3 of 3 used`); each must-not became `.*words.*` (as exact text they passed whatever the screen showed); `Save for tomorrow` is tapped at the bottom of the card (`point: 50%,80%` on the card's label; it is a VoiceOver action, not its own element), and the saved card proves the tap saved; 252 also asserts nothing at all under the title (`Stylist, .*` absent). Bite: every pattern full-matched against the labels the components build, and the old and wrong-build labels against the new patterns (scratch check, 46 patterns); the flow itself not run again (the Mac had 90 MB free, 6 GB compressed).

- **FP7.6** · Checks made on the beta rules don't change the 7 free checks: switching the server to free afterwards shows `7 of 7 free checks left`.
  · how: server emulator + unit for the precondition; the visible `7 of 7` is not testable yet (below)
  · test: `api.test.ts` › `FP7.6 · beta checks write no lifetime count; after switching to free, the next day's free check passes`; `betaLimits.test.ts` › `FP7.6 · on beta the phone keeps day counts only; switching the tier to free gives free's rules`
  · expect: server, beta: 3 checks → `usage/{uid}` holds only `tz` and `tzChangedAt` (no other field), and only `usage/{uid}/usageDays/<day>` holds counts; set `server/config { tier: 'free' }`, move the clock past the next 4 am → a free check → 200 with `x-kitted-tier: free`. Phone: after 3 beta checks, the snapshot has no lifetime field (its keys are exactly the `QuotaSnapshot` keys listed in IMPLEMENTATION.md) and the store holds no kv key other than `server.tier` written by the tier; switching the recorded tier to `free` → `tier: 'free'`, `checkLimit: 1`, `questionLimit: 5` (today's free rules, until T11).
  · must not: a beta check never writes a lifetime or "free checks used" count, on the server or the phone.
  · edges: the switch day: a tester with 3 beta checks today is under free's daily limit until 4 am (technical default T-8). Wipe or reinstall: the phone's day counts go; the server keeps the day under the same account.
  · red: 1 app test + 1 server test. App: held at the 2nd photo (L138): the stored tier `beta` isn't read yet (`serverTier` → null → free). Server: `expected [ 200, 'pro' ] to deeply equal [ 200, 'beta' ]` on B1.

- **FP7.7** · You → Plan shows the FP7 row.
  · how: unit (`plan.ts`) + Simulator screens (demos 256, 258) + the flow's last step
  · test: `betaLimits.test.ts` › `FP7.7 · the beta plan: Kitted beta, its line, no button`; `FP7.7 · Settings' Plan & usage row reads Kitted beta`
  · expect: `currentPlan(false, now, null, 'beta')` → `{ kind: 'beta' }`; `planStatus(…)` → `{ title: 'Kitted beta', detail: '3 fit checks and 20 questions a day · resets at 4 am' }`; `planShortName(…)` → `Kitted beta`; `hasPro(…)` false. Demo 256 shows the card with exactly those two lines, the Today section, and no button.
  · must not: no `See Pro`, `Manage`, `Manage subscription`, `Restore purchases` or `Try Pro` on the Plan & usage screen or in Settings on beta; the server's tier alone never makes the title `Kitted Pro`; a purchase on a beta server shows the Pro card (the purchase wins).
  · edges: before the first server answer the row already reads `Kitted beta` (fallback). Largest text: the detail line wraps, nothing clipped.
  · red: 2 app tests (+ the flow's last steps). App: `currentPlan(false, now, null, 'beta')` → `{ kind: 'free' }` (L742); the Settings row → `T14: not built` (`tierNow`, L770).

## UI inventory
Every visible element, per state. Anything on screen that isn't here is a defect; anything here that isn't on screen is a defect. Each state: light, dark and the largest text size. Elements marked "existing" keep their current look; "testID: none" means it has none today and is found by its words.

### Beta · Stylist home · demo screen 252
- Nav title · `Stylist` · VoiceOver: "Stylist" · testID: none (existing)
- Nav subtitle · none (no check line on beta; nothing under the title while more than 3 questions are left) · · 
- Banned: `1 free check today`, `Check used today`, `Re-check included`, `Free checks used`.

### Beta · Limit card · demo screen 253
- His photo bubble · (his photo) · VoiceOver: as built (`a11y.photo`, unchanged) · testID: none (existing)
- Card · (the whole card is one element) · VoiceOver: "Daily limit. That's today's 3 fit checks. I'll save this photo and score it after 4 am." · testID `limit-card`
- Tag, left · `Daily limit` · (inside the card's label) · 
- Tag, right · `Resets at 4 am` · (not read; as built) · 
- Title · `That's today's 3 fit checks.` · (inside the card's label) · 
- Body · `I'll save this photo and score it after 4 am.` · (inside the card's label) · 
- Button · `Save for tomorrow` · VoiceOver: card action "Save for tomorrow" · testID `limit-card-save`
- Nav subtitle · `1 photo waiting to score` · VoiceOver: part of the title · testID: none (existing)
- Absent: `Score it now with Pro`, `Try Pro`, any second button (`limit-card-pro` not rendered).

### Beta · Limit card, saved for tomorrow · demo screen 254
- Card · VoiceOver: "Waiting to score. After 4 am. Saved. I'll score it when you open Kitted after 4 am." · testID `held-card`
- Tag, left · `Waiting to score` · 
- Tag, right · `After 4 am` · 
- Body · `Saved. I'll score it when you open Kitted after 4 am.` (the founder, Nov 8; FP3's last sentence dropped on the beta) · (inside the card's label) · 
- Link · `Don't score it` · VoiceOver: card action "Don't score it" · testID `held-card-dont-score`

### Beta · Questions used up · demo screen 255
- His bubble · `What shoes go with my khaki chinos?` · VoiceOver: the text · testID: none (existing)
- Kit's line · `That's 20 questions today. More at 4 am.` · VoiceOver: as built (`a11y.stylistSays` with this text) · testID: none (existing StylistMessage)
- Nav subtitle · `0 questions left today` · testID: none (existing)
- Absent: a Try Pro row under the line.

### Beta · Plan & usage · demo screen 256
- Status card · title `Kitted beta`, line `3 fit checks and 20 questions a day · resets at 4 am` · VoiceOver: "Kitted beta. 3 fit checks and 20 questions a day · resets at 4 am" · testID `plan-status`
- Section label · `Today` · testID: none (existing)
- Row · `Fit checks` · `1 of 3` · VoiceOver: "Fit checks, 1 of 3 used" · testID: none (existing)
- Row · `Re-check` · `1 left` (or `Used` / `Closed`) · VoiceOver: "Re-check, 1 left" · testID: none (existing)
- Row · `Questions` · `0 of 20` · VoiceOver: "Questions, 0 of 20 used" · testID: none (existing)
- Section footer · `Resets at 4 am.` · testID: none (existing)
- Absent: `Manage subscription`, `Restore purchases`, `See Pro`, `Try Pro`.

### Beta · You · demo screen 257
- Today card · title `Today`, right `resets at 4 am`, line `3 of 3 fit checks left · 20 of 20 questions left` · VoiceOver: "Today. resets at 4 am. 3 of 3 fit checks left · 20 of 20 questions left" · testID `you-today`
- Button · `Check my fit` · VoiceOver: "Check my fit" · testID: none (existing)
- Absent: `1 free check today`, `Today's check: done`, `Try Pro`, the `KITTED PRO` row.

### Beta · Settings · demo screen 258
- Row · `Plan & usage` · value `Kitted beta` · VoiceOver: "Plan & usage, Kitted beta" · testID: none (existing LinkRow)
- Absent: the Subscription section (`Manage subscription`, `Restore purchases`).

### Beta · Morning card, checks used · demo screen 259
- Line under the card's buttons · `Your fit checks reset at 4 am.` (the founder, Nov 8) · VoiceOver: "Your fit checks reset at 4 am." · testID: none (existing)
- Absent: `Your free check resets tomorrow`.

## Not testable yet
Never dropped, never counted as pass.
- **FP7.6** (the visible part) · why: `7 of 7 free checks left` and the 7-check count don't exist until T11 (phone) and T21 (server) · would verify it: T11's and T21's tests, which must include "after beta checks, switching to free shows `7 of 7 free checks left`" (technical default T-4 says how).
- **FP7.1** (on the real server) · why: the emulator proves the code; the live server answers `beta` only after the functions are deployed and `server/config.tier` is `beta` or missing · would verify it: a deploy (ask the founder first), then one beta tester's 4th photo on the TestFlight build (T85).
- **FP7.5** (on a TestFlight build) · why: the beta build itself (`PAYWALL_BUILT` off, the live server) isn't built yet · would verify it: T85, a friend's phone tapping through 4 photos and 21 questions.

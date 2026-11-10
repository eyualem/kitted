# T53 · Testing contract

Written by the planner; tests written and locked by the test writer. **Locked once the lock line below is filled.** After that only a test-writer agent changes this file or the tests, only to add or strengthen, with the reason in REPORT.md. Results never go here; they go in REPORT.md.

**Lock:** `<commit SHA>` · <date> · tests: `app/src/__tests__/T53-notifyAsk.test.ts`, `app/src/__tests__/T53-nudges.test.ts`, `app/src/__tests__/T53-ready.test.ts`, `app/src/__tests__/T53-notifyTap.test.ts`, `app/src/__tests__/T53-notifyCards.test.tsx`, `app/src/__tests__/T53-notificationsPage.test.tsx`, `app/src/__tests__/T53-notifyCopy.test.ts`, `app/e2e/flows/T53-notify-ask.yaml`, `app/e2e/flows/T53-notifications-page.yaml`, `app/e2e/flows/T53-comeback.yaml`

Plan-line criteria: NT1.1–NT1.7 (NT1.8–NT1.10 are T57), NT2.1–NT2.7, NT3.1–NT3.4, NT4.1–NT4.3, NT5.1–NT5.5 (26), plus NT6.1–NT6.6 (6), from the coordinator's brief and the approved design (the plan line still needs NT6 added: IMPLEMENTATION → Open questions, technical 14). **32 criteria, all below.**

**Shared set-up.** Memory store (`createMemoryStore`), `manualClock(T0)` (US Eastern), `counterIds()`. `T0 = 2026-10-22T11:42:00Z` (Thursday 7:42 am EDT). Profile as `onboardingFinish.test.ts`'s `freshStore()` (`ideaTime: '08:00'`). Permission: `scriptedNotifications(answer, start)` (its `requests` counts Apple's prompt). Scheduler: `recordingScheduler()` (its `calls` is every call, in order). Background: a fake `BackgroundWork` recording `begin`/`end`. `canSuggest`: the real `createMorningService(...).canSuggest` over the same store where a criterion is about the closet, else a stub. No test imports `@/services/notificationsNative` or `expo-notifications`. **The doubles the tests judge by are the test writer's own** (`app/src/testing/notifyDoubles.ts`: `iosDouble` with `requests` = every request() and `prompts` = Apple's prompt shown, `schedulerDouble`, `backgroundDouble`), so the oracle isn't code under test; the app's `scriptedNotifications` and `recordingScheduler` (used by demo screens) are checked on their own in NT1.3 and NT2.5. Old tests the spec changed (IMPLEMENTATION → Files): `onboardingFinish.test.ts` E5, P3/P7 and N1–N3, `settingsPrefs.test.ts` (the time list, the switches); `betaLimits.test.ts` FP7.5 still holds as written (the beta's ask follows the closet card) and is unchanged. Component tests mock `@/design-system` as `cardNoAddTile.test.tsx` does, with `MorphPicker` rendering its pill (labelled with its `accessibilityLabel`) and one button per option. Flows open demo screens through `app/e2e/common/open-demo.yaml`.

## Criteria

**The ask (NT1)**

- **NT1.1** · After the first scored fit in a beta setup, Kit's ask posts once, after the closet card, unless it was already posted at Later.
  · how: unit (finish service) and flow (demo 158)
  · test: `T53-notifyAsk.test.ts` › `NT1.1 · beta: the ask posts once, right under the closet card`; `NT1.1 · an ask already posted (notify.asked) means no second one`; `NT1.1 · not built, or the native module missing: no ask, no throw`; `NT1.1 · never before the first check is scored, or while it is reading or asking`; `NT1.1 · the setup ask no longer needs iOS to be undetermined (after a wipe iOS keeps its answer)`; `onboardingFinish.test.ts` › `E5: notifications off, or already asked → no ask, the sequence ends` (changed: "already asked" is now `notify.asked`); `T53-notify-ask.yaml` step "NT1.1 158"
  · expect: deps `paywallOn: () => false` (the beta, FP7), one scored first check (`fixes: []`), `ensure()`: chat in order = `plan.intro` text ("Want outfit ideas from your own clothes? This part is optional."), the `plan` card, then exactly one message with `payload.question === 'notify'`, `state 'open'`, `time '08:00'`, `createdAt` greater than the plan card's; `notify.asked` = that message's id; `onboard.finish` step `done` with `notifyMsgId` = the same id. A second `ensure()` and a new service instance over the same store: still exactly one ask. Demo 158 shows the closet card and, under it, "What time do you usually get dressed to head out? I'll send you an outfit idea 15 minutes before."
  · must not: with `notify.asked` already set (as T57's Later route writes it), the first scored fit posts no ask and the step still ends `done`; with `notificationsOn: () => false` no ask and no `request()`; no ask before the first check is scored, or while it's reading or asking.
  · edges: a restart between the closet card and the ask (a new service instance) posts it once; after "Delete all my data" the sequence and the ask come again (NT5.1).
  · red: posts once: `notify.asked` Expected "M-3", Received null · already posted: `T53: not built` (askPosted) · not built: `T53: not built` (askPosted) · never before (its control): `notify.asked` Expected "M-3", Received null · no longer needs undetermined: asks Expected length 1, Received 0 (the old code skips a granted phone) · E5 (changed): the old code ignores `notify.asked` and posts the ask (cards diff) · flow: Flows not run red now (the coordinator: no Metro or Simulator while memory is tight); they are red by construction: the demo screen and its words don't exist yet.

- **NT1.2** · The card shows the time menu up front (5:00 am–1:00 pm in half hours, 8:00 am selected) with `Send me ideas` and `No thanks`, in NT1's exact words.
  · how: unit (prefs), component (`NotifyAskCard`) and flow (demo 158, tap the time)
  · test: `T53-notifyAsk.test.ts` › `NT1.2 · 17 times, 5:00 am to 1:00 pm; an off-list stored time is kept`; `NT1.2 · picking a time changes the card only: nothing saved, scheduled or asked`; `NT1.2 · the ask is the one-step question`; `T53-notifyCards.test.tsx` › `NT1.2 · one step: question, time row, two buttons`; `NT1.2 · his own time on the pill; picking one changes the pill and saves nothing`; `NT1.2 · a stored picking card from an older build renders as the open card`; `settingsPrefs.test.ts` › `reads times as 12-hour text without Intl` (changed: the list ends at 13:00, 17 times); `onboardingFinish.test.ts` › `N1 (NT1.2–NT1.3)` (rewritten); `T53-notify-ask.yaml` step "NT1.2 menu"
  · expect: `IDEA_TIMES` = `['05:00','05:30','06:00','06:30','07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00']`; their labels `5:00 am`, `5:30 am`, `6:00 am`, `6:30 am`, `7:00 am`, `7:30 am`, `8:00 am`, `8:30 am`, `9:00 am`, `9:30 am`, `10:00 am`, `10:30 am`, `11:00 am`, `11:30 am`, `12:00 pm`, `12:30 pm`, `1:00 pm`; `ideaTimeOptions('14:00')` = the 17 plus `'14:00'` last (18), labelled `2:00 pm`. The open card renders, in order: the bubble "What time do you usually get dressed to head out? I'll send you an outfit idea 15 minutes before.", the row (`notify-ask-time-row`) with "I get dressed at" and the pill labelled "I get dressed at, 8:00 am" (or "I get dressed at, 7:30 am" when the profile has `07:30`), then "Send me ideas" (primary) and "No thanks" (secondary). Picking `7:30 am` (`notifyPickTime`) changes the pill to "I get dressed at, 7:30 am" and saves nothing (`profile.ideaTime` still `08:00`, no scheduler call, `requests` 0). Flow: tap the pill on 158 → `5:00 am` and (after scrolling) `1:00 pm` visible; tap `7:30 am` → "I get dressed at, 7:30 am".
  · must not: no "Yes, pick a time", no "Set 8:00 am", no "Daily idea at", no second step; no time before 5:00 am or after 1:00 pm in a fresh list.
  · edges: a stored `picking` card from an older build renders as this open card.
  · red: 17 times: IDEA_TIMES toEqual diff (13 times, ends 11:00) · picking: exists: bites via `notifyPickTime` also calling `saveIdeaTime` (Expected "08:00", Received "07:30") · one-step question: Expected the new question, Received "Want a daily outfit idea at a time you choose?" · cards: `Unable to find an element with testID: notify-ask` / `…accessibility label: I get dressed at, 7:30 am` · settingsPrefs: Expected "13:00", Received "11:00" · N1: notifyYes Expected "allowed", Received undefined · flow: Flows not run red now (the coordinator: no Metro or Simulator while memory is tight); they are red by construction: the demo screen and its words don't exist yet.

- **NT1.3** · Apple's prompt is requested only from `Send me ideas` (and NT3's switch); `No thanks` never requests it.
  · how: unit (finish service, nudge service over a whole run)
  · test: `T53-notifyAsk.test.ts` › `NT1.3 · only Send me ideas asks iOS`; `NT1.3 · iOS already answered (after a wipe): Send me ideas reads it with no new prompt`; `T53-nudges.test.ts` › `NT1.3 · opening, returning, leaving and posting never ask iOS`; `NT1.3 · the demo permission counts requests and pending never answers`; the double-tap case: `T53-notifyCards.test.tsx` › `NT5.4 · while Apple's prompt is up: spinner, No thanks disabled`
  · expect: `requests` is 0 after `ensure()` (the ask posted), after `notifyPickTime`, and after `notifyNo`; exactly 1 after `notifyYes`; 1 after `nudges.setIdea(true)` with permission `undetermined`; 0 after any number of `reschedule('open' | 'foreground' | 'background' | 'change')`, the catch-up and the comeback posting.
  · must not: `request()` called at launch, on a reschedule, by `notifyNo`, by `comebackNo`, or a second time on a double tap while the first is pending (the card disables both buttons: NT5.4's component test).
  · edges: permission already `granted` or `denied` (after a wipe): `notifyYes` reads iOS's answer without a new prompt (scripted `request()` returns the current state).
  · red: only Send me ideas: Expected "allowed", Received undefined (the old two-step card) · already answered: replaceNudges lists Expected length 1, Received 0 · nudges (both): `T53: not built`

- **NT1.4** · Allow saves the time and the switch, schedules 7 nudges, and shows the done line with the nudge time (8:00 → `7:45 am`), `today` or `tomorrow` correctly.
  · how: unit (finish service with the nudge service's reschedule) and flow (demo 160, 280)
  · test: `T53-notifyAsk.test.ts` › `NT1.4 · Allow at 7:42 with 8:00: saved, 7 scheduled, "today at 7:45 am"`; `NT1.4 · after the nudge time: "tomorrow"`; `NT1.4 · the 4 am day change: 3:30 with 5:00 lands today`; `T53-notifyCards.test.tsx` › `NT1.4 · Send me ideas → Allow: the done line, no buttons; the stored "today" stays`; `NT1.4 · tomorrow, and a stored allowed card with no \`when\` reads tomorrow`; `onboardingFinish.test.ts` › `N2 (NT1.4–NT1.5)` (rewritten); `T53-notify-ask.yaml` steps "NT1.4 160" and "NT1.4 280"
  · expect: at T0 (7:42), 08:00, allow: `notifyYes` → `'allowed'`; `profile.ideaTime === '08:00'`; `notify.idea === '1'`; the last scheduler call is `replaceNudges` with 7 entries; the card is `state 'allowed'`, `when 'today'`, line "Done. Your first idea lands today at 7:45 am.". At 7:50 (`T0 + 8 min`): "Done. Your first idea lands tomorrow at 7:45 am.". At 7:42 with the card's time picked to `07:30`: `profile.ideaTime === '07:30'`, line "Done. Your first idea lands tomorrow at 7:15 am." (7:15 has passed). Time `05:00` at 7:42: "Done. Your first idea lands tomorrow at 4:45 am.". Demo 160: "Done. Your first idea lands today at 7:45 am."; demo 280: "Done. Your first idea lands tomorrow at 7:45 am."; neither shows "Send me ideas" or "No thanks".
  · must not: the line never shows the get-dressed time itself ("8:00 am") as the landing time; the line doesn't change from "today" to "tomorrow" when the clock passes 7:45 (stored `when`).
  · edges: the 4 am day change: at 03:30 local with time 05:00 the nudge (4:45 the same calendar morning) reads "today" (IMPLEMENTATION technical 5).
  · red: Allow / tomorrow: Expected "allowed", Received undefined · 4 am: `T53: not built` (landsToday) · cards: `Unable to find an element with role: button, name: Send me ideas` / `…label: Kit: Done. Your first idea lands tomorrow at 7:45 am.` · N2: Expected "allowed", Received undefined · flows: Flows not run red now (the coordinator: no Metro or Simulator while memory is tight); they are red by construction: the demo screen and its words don't exist yet.

- **NT1.5** · Don't Allow and `No thanks` each show the later line and schedule nothing.
  · how: unit and flow (demos 281, 282; tap No thanks on 158)
  · test: `T53-notifyAsk.test.ts` › `NT1.5 · Don't Allow: the later line, nothing scheduled`; `NT1.5 · No thanks: the later line, switch off, iOS never asked`; `T53-notifyCards.test.tsx` › `NT1.5 · Don't Allow and No thanks: the later line, no buttons`; `T53-notify-ask.yaml` steps "NT1.5 281", "NT1.5 282", "NT1.5 tap No thanks"
  · expect: deny: `notifyYes` → `'denied'`, line "No problem. You can turn it on later in You → Notifications.", no `replaceNudges` call with any entry, `notify.idea === '1'` (written before asking, DESIGN), `nudges.reschedule('open')` afterwards → `{ kind: 'cancelled', why: 'permission' }`. No thanks: `'declined'`, the same line, `notify.idea === '0'`, `requests` 0, no `replaceNudges`. Demos 281 and 282 show the line and neither button.
  · must not: the old words "You → Settings → Notifications"; any nudge scheduled after either answer.
  · edges: a reinstall/restart keeps the answered line (stored state).
  · red: Don't Allow: Expected "denied", Received undefined · No thanks: `T53: not built` (nudges.reschedule) · cards: `Unable to find an element with role: button, name: Send me ideas` · flows: Flows not run red now (the coordinator: no Metro or Simulator while memory is tight); they are red by construction: the demo screen and its words don't exist yet.

- **NT1.6** · A user whose setup finished with no ask posted, and whose permission was never asked, gets the ask once on the next Stylist open; never a second time.
  · how: unit (finish service) and flow (demo 283)
  · test: `T53-notifyAsk.test.ts` › `NT1.6 · a first-build tester (step done, no ask) gets the ask once`; `NT1.6 · skipped (several fits) counts as finished`; `NT1.6 · never when asked, set, waiting, iOS answered, or age-blocked` (starts with the yes control); `onboardingFinish.test.ts` › `E5: the ask follows the paywall closing…` (catchUpDue's table); `T53-notify-ask.yaml` step "NT1.6 283"
  · expect: store with `onboard.finish = { step: 'done', notifyMsgId: null, … }`, permission `undetermined`, `notify.idea` unset: `ensure()` posts one ask (`state 'open'`, `time` = his `ideaTime` or `08:00`) as the last message of today's thread, after `afterTodaysCard()` resolved (a test dep records the order); `notify.asked` set; `ensure()` again and a new service instance: still one. Same with `step: 'skipped'`. Demo 283: the question is the last Kit line in the thread, with "Send me ideas" and "No thanks".
  · must not: no catch-up when `step` is `waiting`, `moves` or `paywall`; when `notify.asked` or `notifyMsgId` is set; when `notify.idea` is `'1'` or `'0'`; when the permission is `granted` or `denied`; when age-blocked; when not built.
  · edges: a tester who answered the catch-up on one launch sees no new ask on the next (restart).
  · red: all three: asks Expected length 1, Received 0 (no catch-up yet) · E5 pure: `T53: not built` (askDue) · flow: Flows not run red now (the coordinator: no Metro or Simulator while memory is tight); they are red by construction: the demo screen and its words don't exist yet.

- **NT1.7** · After `No thanks`, Kit never posts the ask again (including after more checks and restarts).
  · how: unit
  · test: `T53-notifyAsk.test.ts` › `NT1.7 · No thanks is final: more checks, restarts, the catch-up`; `onboardingFinish.test.ts` › `N3 (NT1.7)` (rewritten)
  · expect: ask → `notifyNo`; then add two more scored checks, `ensure()` on three new service instances (restarts), with the catch-up conditions otherwise true: exactly one `question: 'notify'` message, still `declined`; `notifyYes` on it returns `'declined'` and `requests` stays 0. The same holds after Don't Allow.
  · must not: a second ask message; the answered card changing state.
  · edges: only "Delete all my data" resets it (NT5.1).
  · red: Expected "declined", Received undefined (notifyYes on an answered card) · N3: the same

**The nudge (NT2)**

- **NT2.1** · Each open (and each return to the foreground) leaves exactly 7 nudges scheduled, one per day, each at the get-dressed time minus 15 minutes, with the default sound and no title.
  · how: unit (nudge service, pure helpers) and a Simulator state check (after the native rebuild)
  · test: `T53-nudges.test.ts` › `NT2.1 · open at 7:42 with 8:00: 7 nudges, Oct 22–28 at 7:45`; `NT2.1 · after the nudge time, the first is tomorrow`; `NT2.1 · across the DST change the wall time stays 7:45`; `NT2.1 · the 4 am day change: a 5:00 time opened at 3:30 gets that morning's 4:45`; `NT2.1 · every open and return replaces, never adds`; `NT2.1 · default sound, no title`; `NT2.1 · not built (no native module): nothing scheduled, no call, no throw`
  · expect: granted, `notify.idea '1'`, 08:00, `reschedule('open')` at T0 → `scheduled`, `atMs` = `2026-10-22T11:45Z`, `10-23T11:45Z`, `10-24T11:45Z`, `10-25T11:45Z`, `10-26T11:45Z`, `10-27T11:45Z`, `10-28T11:45Z`; ids `nudge|2026-10-22` … `nudge|2026-10-28`; `notify.through` = the last. At 7:50: `10-23` … `10-29`. Opened `2026-10-29T11:50Z` (7:50 EDT): `10-30T11:45Z`, `10-31T11:45Z`, `11-01T12:45Z`, `11-02T12:45Z`, `11-03T12:45Z`, `11-04T12:45Z`, `11-05T12:45Z` (7:45 local each day). After `open`, `foreground`, `foreground`, `background`: `pending()` has exactly 7, one per local date. `notificationContent(n)` = `{ body, sound: 'default', data }` with no `title` key; `notificationTrigger(n)` = `{ type: 'date', date: n.atMs }`. Simulator: after the native rebuild and a yes, `Notifications.getAllScheduledNotificationsAsync()` (logged from a dev build, or read with the debugger) lists 7 with no title.
  · must not: 8 or more pending; two on one date; a nudge at the get-dressed time itself; a nudge in the past.
  · edges: the 4 am day change (time 05:00 → 4:45 nudges; opened at 03:30 the first is that morning's 4:45); travel: the zone is the phone's, so the next open re-anchors to local wall time (assumed in the spec).
  · red: all: `T53: not built` (nudge helpers and service) · Simulator state check: not run (needs the native rebuild)

- **NT2.2** · Once it can suggest, every day's nudge is `Today's outfit idea is ready.` (after the one-time "big enough" day); no nudge ever lists pieces or shows a score.
  · how: unit
  · test: `T53-nudges.test.ts` › `NT2.2 · can suggest, big-enough done: every day "Today's outfit idea is ready."`
  · expect: `canSuggest` true for all 7, `notify.bigEnoughDone '1'`: all 7 bodies are exactly "Today's outfit idea is ready.".
  · must not: no body contains a closet item's name (from the store's closet), a score pattern (`/\d+\.\d/`), or "Today:"; `push.idea` doesn't exist in `en`.
  · edges: none beyond NT2.6.
  · red: `T53: not built`

- **NT2.3** · While the morning service says it can't suggest (empty closet, or one outfit that works), every day gets `Check today's fit. Each one teaches me your closet.`
  · how: unit with the real `morning.canSuggest`
  · test: `T53-nudges.test.ts` › `NT2.3 · empty closet: 7 × "Check today's fit."`; `NT2.3 · one outfit (T1, B1, S1): 7 × "Check today's fit."`
  · expect: the real morning service's `canSuggest` over the store; empty closet → all 7 bodies "Check today's fit. Each one teaches me your closet."; three pieces making one outfit (a tee, chinos, sneakers, as demo 39) → the same 7.
  · must not: "Today's outfit idea is ready." or the big-enough line on any of those days; `bigEnoughAt` set.
  · edges: offline or no weather: lines don't depend on the weather (`canSuggest` reads no weather).
  · red: both: `T53: not built`

- **NT2.4** · Tapping a nudge opens Stylist at today's card.
  · how: unit (`openFromNotification`) and a Simulator state check
  · test: `T53-notifyTap.test.ts` › `NT2.4 · a nudge tap opens Stylist and scrolls to today's card, posting it if needed`; `NT2.4 · an older day's nudge opens today's card`; `NT2.4 · no card (fit checks declined): Stylist, no scroll`
  · expect: `openFromNotification({ kind: 'nudge' }, deps)` → `navigate` called once, then `ensureTodaysCard` awaited, then `setAction({ kind: 'scrollTo', messageId })` with the message id of the `dailyIdeas` row for the current window (posted by the stub during `ensureTodaysCard` when absent). Simulator: with a nudge scheduled a minute ahead (or delivered with `xcrun simctl push`), tapping it opens Stylist scrolled to today's card.
  · must not: `setAction({ kind: 'checkMyFit' })` or any camera route; scrolling to yesterday's card.
  · edges: a cold start from the tap (`lastTap()` on the first mount); a tap after 5 pm opens the evening card (technical 6).
  · red: all three: `T53: not built` (openFromNotification) · Simulator: not run

- **NT2.5** · Nothing else is ever scheduled or sent: only the daily nudges and NT6's line; never `Trial ending`, never two nudges on one day (a test over every schedule call).
  · how: unit over a scripted run
  · test: `T53-nudges.test.ts` › `NT2.5 · every scheduler call over a scripted fortnight`; `NT2.5 · the demo scheduler records every call; pending is the last list`
  · expect: one recording scheduler shared by the nudge service and the ready watch, through: open, foreground ×3, background ×2, `setTime('07:00')`, `setIdea(false)`, `setIdea(true)`, a closet change, a lapse + comeback + `comebackOn`, a check scored in the background, over 14 simulated days. For every `replaceNudges` list and every `presentNow`: `data.kind` ∈ {`nudge`, `ready`}; every body is one of "Check today's fit. Each one teaches me your closet.", "Your closet's big enough now: here's today's idea.", "Today's outfit idea is ready.", "Your fit check is ready. {n} quick fixes inside." (n ≥ 2), "Your fit check is ready. 1 quick fix inside.", "Your fit check is ready."; each list has ≤ 7 entries with distinct local dates; `nudge` entries only in `replaceNudges`, `ready` only in `presentNow`.
  · must not: a body matching `/trial/i`; `en` has no keys `push.trial`, `notifs.trial`, `push.idea`; any `presentNow` of a nudge; two nudges for one local date at any point.
  · edges: the DST week (Oct 29–Nov 5) inside the fortnight.
  · red: both: `T53: not built`

- **NT2.6** · The first scheduled day on which it can suggest gets `Your closet's big enough now: here's today's idea.`; later days get `Today's outfit idea is ready.`; the "big enough" line is never scheduled again once it has been delivered, including after reinstalling nudges or changing the time.
  · how: unit
  · test: `T53-nudges.test.ts` › `NT2.6 · first day it can suggest: big enough, then the idea line`; `NT2.6 · not delivered yet: a reschedule keeps it on the first day`; `NT2.6 · once delivered, never again (time change, off and on)`; `NT2.6 · able to suggest when he said yes: never the big-enough line`; `NT2.6 · a check nudge scheduled but not yet delivered does not count`
  · expect: (the test writer, Nov 10: the founder's change to NT2.6 that day, "after at least one `Check today's fit` nudge has been delivered … someone who could already suggest when he said yes never gets it", came after this contract was planned; the spec wins, so the expectations follow it. The planner's older example, big enough on Oct 22 when it can suggest at T0, contradicts it and is not tested.) Pure: `nudgeLines([false,false,false,true,true,true,true], false)` = `['check','check','check','bigEnough','idea','idea','idea']`; with `bigEnoughDone` true → `['check','check','check','idea','idea','idea','idea']`; all false → 7 × `check` (a list of all `true` isn't asked of the pure helper: whether a check nudge was delivered before is the service's to know). Service: empty at T0 → 7 check; the Oct 22 7:45 check nudge delivered; at 7:50 it can suggest → `atMs` Oct 23–29, lines `['bigEnough', 'idea' × 6]`, `notify.bigEnoughAt` = Oct 23 11:45Z. Reopen Oct 23 7:44 → still Oct 23 big enough (once in the list); `setTime('09:00')` before it fires → still on the first day (Oct 23 12:45Z); `setIdea(false)` clears `bigEnoughAt`; `setIdea(true)` → big enough on the first day again. Reopen Oct 23 7:50 → `notify.bigEnoughDone '1'`, 7 × idea; then `setTime('07:00')`, `setIdea(false)`, `setIdea(true)`, a day on, a restart: every list 7 × "Today's outfit idea is ready.". Able to suggest at T0 (when he said yes) → 7 × idea, `bigEnoughAt` unset, and never big enough after reopen, time change, off/on, two days on. Check nudges scheduled at 7:42 but none delivered, able to suggest at 7:44 → 7 × idea.
  · must not: the big-enough line on two days in one list; after delivery, ever again.
  · edges: switching off before it fires clears `bigEnoughAt` (not delivered), so it comes on the next first day (technical 4). After "Delete all my data" it can come again (the wipe clears the kv).
  · red: all five: `T53: not built`

- **NT2.7** · Leaving the app (background) reschedules, so a check or a new piece made today is reflected in tomorrow's line.
  · how: unit
  · test: `T53-nudges.test.ts` › `NT2.7 · a closet that grows today changes tomorrow's line on leaving`; `NT2.7 · a background reschedule during a lapse schedules nothing and posts nothing`
  · expect: empty closet, open at T0 → 7 × check line. Add pieces making two outfits (2 tops, 1 bottom, 1 pair of shoes, F6.2's example) and `reschedule('background')` at 7:50 → a new `replaceNudges` call whose first entry (Oct 23) is "Your closet's big enough now: here's today's idea." and the rest "Today's outfit idea is ready.".
  · must not: the background reschedule posting a comeback card or asking iOS.
  · edges: a background reschedule during a lapse schedules nothing and posts nothing (it waits for the next open).
  · red: both: `T53: not built`

**You → Notifications (NT3)**

- **NT3.1** · The page shows NT3's header and its three rows; no `Trial ending` row.
  · how: component and flow (demo 284, 86)
  · test: `T53-notificationsPage.test.tsx` › `NT3.1 · header and the three rows in order, no Trial ending (even on a trial plan)`; `NT3.1 · before onboarding's profile exists, the time row reads 8:00 am`; `T53-notifications-page.yaml` steps "NT3.1 284", "NT3.1 86"
  · expect: granted, `notify.idea '1'`, 08:00: the header text "An outfit idea once a day, and a heads-up when a fit check finishes after you leave. That's all I send."; then `notifs-idea` (switch labelled "Daily outfit idea", on), `notifs-time` (title "I get dressed at", value labelled "I get dressed at, 8:00 am"), `notifs-ready` (switch labelled "Fit check ready", on), in that order.
  · must not: "Trial ending" anywhere (also with `demoPlan=trial`, demo 86); "That's all I send. No reminders to open the app."; "Time" as a row title; "Daily outfit idea time, 8:00 am".
  · edges: before onboarding's profile exists, the time row reads 8:00 am.
  · red: both: `Unable to find an element with testID: notifs-idea` (the page draws the old rows and "Trial ending") · flows: Flows not run red now (the coordinator: no Metro or Simulator while memory is tight); they are red by construction: the demo screen and its words don't exist yet.

- **NT3.2** · Changing the time reschedules all 7 at the new time; switch off leaves nothing scheduled.
  · how: component (page → service) and unit
  · test: `T53-notificationsPage.test.tsx` › `NT3.2 · a new time reschedules all 7 at once`; `NT3.2 · switch off: nothing scheduled, the time row hides`; `T53-nudges.test.ts` › `NT3.2 · setTime and setIdea(false)`
  · expect: pick `7:00 am` on `notifs-time` → `profile.ideaTime === '07:00'`, the last call `replaceNudges` with 7 entries at 6:45 local; 6:45 has passed at 7:42, so they are `2026-10-23T10:45Z` … `2026-10-29T10:45Z`; the pill reads "I get dressed at, 7:00 am". Turn `notifs-idea` off → `notify.idea '0'`, last call `cancelAll`, `pending()` = [], `notify.through` unset, `notifs-time` gone, `notifs-ready` still there and on.
  · must not: a schedule left after switch off; the old time's nudges left after a time change.
  · edges: his time is kept while the switch is off (turning on again shows 7:00 am).
  · red: page (both): `Unable to find an element with testID: notifs-idea` · nudges: `T53: not built`

- **NT3.3** · Switch on with the permission never asked requests Apple's prompt; Don't Allow leaves the switch off.
  · how: component and flow (demo 285)
  · test: `T53-notificationsPage.test.tsx` › `NT3.3 · never asked: switching on shows Apple's prompt; Allow → on, 7 scheduled`; `NT3.3 · while the prompt is up the switch shows on and disabled`; `NT3.3 · Don't Allow: nothing scheduled, the off card, the switch can't be on`; `NT3.3 · Fit check ready on, never asked: the prompt too`; `NT3.3 · paused: the daily switch shows off, Fit check ready on; on resumes`; `T53-nudges.test.ts` › `NT3.3 · the daily switch from never asked: one prompt; Don't Allow keeps his yes and schedules nothing`; `NT3.3 · Fit check ready on from never asked: the prompt too; the daily switch unchanged`; `T53-notifications-page.yaml` step "NT3.3 285" (and 286)
  · expect: undetermined, `notify.idea` unset: `notifs-idea` shows off and `notifs-time` is absent; `notifs-ready` off. Turn `notifs-idea` on → it shows on and disabled at once, `requests` 1; allow → on, `notifs-time` appears, 7 scheduled. Deny → `notifs-off-card` with "Notifications are off for Kitted." and "Open Settings"; both switches disabled; nothing scheduled; `notify.idea === '1'` (phone 10, Open questions, founder 1). `notifs-ready` on from undetermined → `requests` 1; allow → on, `notify.ready '1'`, the daily switch unchanged.
  · must not: a schedule after Don't Allow; a second prompt; the daily switch shown on and enabled after Don't Allow.
  · edges: the paused state (demo 286): the daily switch shows off, `notifs-ready` on; switching it on resumes (NT4.2).
  · red: page (all five): `Unable to find an element with testID: notifs-idea` · nudges (both): `T53: not built` · flow: Flows not run red now (the coordinator: no Metro or Simulator while memory is tight); they are red by construction: the demo screen and its words don't exist yet.

- **NT3.4** · With iOS notifications off for Kitted, the off card and `Open Settings` show, the controls are greyed out, and nothing is scheduled.
  · how: component, unit and flow (demo 287)
  · test: `T53-notificationsPage.test.tsx` › `NT3.4 · denied: off card, Open Settings, greyed rows with saved values`; `NT3.4 · back from iOS Settings with them on: the card goes and 7 are scheduled`; `T53-nudges.test.ts` › `NT3.4 · denied: cancel, nothing scheduled`; `T53-notifications-page.yaml` step "NT3.4 287"
  · expect: denied, `notify.idea '1'`, `notify.ready` unset: `notifs-off-card` first ("Notifications are off for Kitted.", then "Open Settings"; pressing it calls `Linking.openSettings` once); then the header; `notifs-idea` on + disabled, `notifs-time` shown + `accessibilityState.disabled`, `notifs-ready` on + disabled. `switchesShown({ ideaKv: '1', readyKv: null, permission: 'denied', paused: false })` = `{ idea: true, timeRow: true, ready: true, offCard: true, greyed: true }`. `reschedule('open')` → `{ kind: 'cancelled', why: 'permission' }` and `cancelAll`. Then permission becomes granted and the app returns to the front (`AppState` `active`): the card is gone, rows enabled, 7 scheduled.
  · must not: any nudge pending while denied; the time menu opening on tap while greyed; Fit check ready sent while denied (NT6.3).
  · edges: notifications turned off in iOS after scheduling: the next open cancels.
  · red: page (both): `Unable to find an element with testID: notifs-idea` · nudges: `T53: not built` (switchesShown) · flow: Flows not run red now (the coordinator: no Metro or Simulator while memory is tight); they are red by construction: the demo screen and its words don't exist yet.

**The comeback (NT4)**

- **NT4.1** · Opening the app after the last scheduled nudge has passed, with the switch on, posts the comeback question once and schedules nothing.
  · how: unit and flow (demo 288)
  · test: `T53-nudges.test.ts` › `NT4.1 · a week away: one comeback question, nothing scheduled`; `NT4.1 · not while iOS has them off or the switch is off`; `NT4.1 · a later lapse after a normal stretch asks again`; `T53-comeback.yaml` step "NT4.1 288"
  · expect: schedule at T0 (`through` = Oct 28 11:45Z), then `reschedule('open')` at `2026-10-29T13:00Z` (9:00 am) → `{ kind: 'comeback' }`; one chat message `{ question: 'comeback', state: 'open' }` at the end of today's thread, after `afterTodaysCard()`; `notify.paused '1'`; `notify.comebackFor` = Oct 28 11:45Z; no `replaceNudges` after it. A second `open` and a `foreground` the same day and the next day → `paused`, still one comeback message, nothing scheduled. Demo 288: "I paused your daily ideas after a week without a visit. Want them back?" with "Turn them back on", "Change the time", "No thanks".
  · must not: a comeback when permission is `denied` (DESIGN Q3) or `notify.idea` is `'0'` or unset, or under the age lock; a second comeback for the same lapse; a comeback from a `background` trigger; any nudge scheduled while paused.
  · edges: Past chats on a later day shows only its question (read-only, DESIGN Q6); a lapse that follows a later normal stretch posts again (a new `through`).
  · red: all three: `T53: not built` · flow: Flows not run red now (the coordinator: no Metro or Simulator while memory is tight); they are red by construction: the demo screen and its words don't exist yet.

- **NT4.2** · Each of its three answers does what NT4 says, with its exact line.
  · how: unit, component and flow (demos 289–291; taps on 288)
  · test: `T53-nudges.test.ts` › `NT4.2 · Turn them back on`; `NT4.2 · Change the time, then a pick`; `NT4.2 · No thanks`; `NT4.2 · ignored, then the switch in You → Notifications resumes`; `T53-notifyCards.test.tsx` › `NT4.2 · the comeback card read-only (Past chats): the question only` (and the comeback parts of the NT5.4 tests); `T53-comeback.yaml` steps "NT4.2 back on", "NT4.2 change the time", "NT4.2 no thanks", 289, 290, 291
  · expect: at 9:00 (7:45 passed): `comebackOn` → 7 scheduled from Oct 30 7:45, `paused` cleared, card `on`, line "Back on. Next one lands tomorrow at 7:45 am."; at 7:00 the same day → "Back on. Next one lands today at 7:45 am.". `comebackShowTime` → card `picking`: the time row ("I get dressed at", pill "I get dressed at, 8:00 am") with "Turn them back on" and "No thanks" (no "Change the time"); `comebackPickTime(id, '07:00')` at 9:00 → `profile.ideaTime '07:00'`, 7 at 6:45, line "Back on. Next one lands tomorrow at 6:45 am.". `comebackNo` → `notify.idea '0'`, `cancelAll`, `paused` cleared, line "Done. You can turn them on in You → Notifications.". Ignored: still `open`, nothing scheduled; `setIdea(true)` → 7 scheduled and the card becomes "Back on. Next one lands tomorrow at 7:45 am.". Demo 289 shows the picking card, 290 the back-on line, 291 the done line.
  · must not: Apple's prompt from any comeback answer; a schedule after No thanks; the card changing again after an answer.
  · edges: picking the time already shown closes the menu with no change (DESIGN phone 12); a restart between Change the time and the pick keeps the picking card.
  · red: nudges (all four) and the card: `T53: not built` · flows: Flows not run red now (the coordinator: no Metro or Simulator while memory is tight); they are red by construction: the demo screen and its words don't exist yet.

- **NT4.3** · A normal open (within the week) reschedules without any question.
  · how: unit
  · test: `T53-nudges.test.ts` › `NT4.3 · an open on day 3 moves the week on, no question`; `NT4.3 · 7:44 on day 7 is a normal open; 7:46 is a lapse`
  · expect: schedule at T0; `reschedule('open')` at `2026-10-24T13:00Z` → `scheduled` from Oct 25 7:45 to Oct 31 7:45; `notify.through` = Oct 31 11:45Z; no `comeback` message.
  · must not: a comeback card; `paused` set.
  · edges: an open at 7:44 on day 7 (before the last nudge) is a normal open; at 7:46 it's a lapse.
  · red: both: `T53: not built`

**Safety (NT5)**

- **NT5.1** · "Delete all my data" cancels every scheduled nudge and clears the time, the switch and the asked flags.
  · how: unit (`deleteAllData` with the nudge service's cancel)
  · test: `T53-nudges.test.ts` › `NT5.1 · the wipe cancels everything and clears every notification key`; `T53-notifyAsk.test.ts` › `NT5.1 · after a wipe the ask comes again like a new user`
  · expect: scheduled + asked + paused state; `deleteAllData({ store, files, clearDeviceId, cancelNotifications: nudges.cancelAll })` → `cancelAll` called before the store is wiped; afterwards `notify.idea`, `notify.ready`, `notify.asked`, `notify.through`, `notify.paused`, `notify.comebackFor`, `notify.bigEnoughAt`, `notify.bigEnoughDone`, `firstCheckOffer.laterAt`, `onboard.finish` are all unset and the profile (with `ideaTime`) is gone. A new profile + first scored fit → the ask posts again (with iOS still `granted`, `notifyYes` → `allowed` without a new prompt).
  · must not: a nudge pending after the wipe; the age block cleared.
  · edges: Fit check ready after a wipe stays as iOS left it (DESIGN; technical default, no test of a change).
  · red: nudges: `T53: not built` · notifyAsk: Expected "allowed", Received undefined

- **NT5.2** · Under the under-18 lock, no ask posts and nothing is scheduled.
  · how: unit
  · test: `T53-notifyAsk.test.ts` › `NT5.2 · age-blocked: no ask, no catch-up`; `T53-nudges.test.ts` › `NT5.2 · age-blocked: cancel, nothing scheduled, no comeback`; `T53-ready.test.ts` › `NT5.2 · age-blocked: no Fit check ready`
  · expect: `ageBlocked: async () => true`: `ensure()` after a first scored fit posts no `notify` message; catch-up conditions true → none; `reschedule('open')` → `{ kind: 'cancelled', why: 'age' }` with `cancelAll`; a lapse → no comeback; a check scored in the background → no `presentNow`.
  · must not: `request()` called; any `replaceNudges` with entries.
  · edges: none.
  · red: notifyAsk: the old code posts the ask under the age lock (asks toEqual [] diff) · nudges and ready: `T53: not built`

- **NT5.3** · Every new string is in the copy deck, has no emoji, and matches this spec word for word (copy test).
  · how: unit
  · test: `T53-notifyCopy.test.ts` › `NT5.3 · every notification string, word for word, from the deck`; `NT5.3 · the removed strings are gone`
  · expect: each key in IMPLEMENTATION → Copy keys has exactly that text through `t()` (with `{time}` = `7:45 am`, `{n}` = 2/1), and every one except `push.ready`'s `one` form is a key of `enGenerated` (so it came from the deck); no emoji (the `i18n.test.ts` emoji rule), never "AI stylist" or "unlimited", no streak or day count, no unfilled `{…}` after filling.
  · must not: keys `notif.ask.set`, `notifs.trial`, `push.trial`, `push.idea`, `unopened.q`, `unopened.keep`, `unopened.time`, `unopened.stop`, `notifs.a11y.time` present in `en`; any of "Yes, pick a time", "Daily idea at", "Keep them coming", "Stop for now", "I've sent 3 ideas" in `en`.
  · edges: none.
  · red: word for word: `notif.ask` Expected the new text, Received "Want a daily outfit idea at a time you choose?" · removed: `notif.ask.set` present: true

- **NT5.4** · Kit's ask, You → Notifications and the comeback card work at the largest text size and with VoiceOver (the time menu reads `I get dressed at, 8:00 am`).
  · how: component (labels, roles, states, focus, full-width at AX) and Simulator state check (AX5 screenshots of demos 158, 287, 288; VoiceOver order with Accessibility Inspector)
  · test: `T53-notifyCards.test.tsx` › `NT5.4 · VoiceOver labels on the ask and the comeback`; `NT5.4 · while Apple's prompt is up: spinner, No thanks disabled`; `NT5.4 · focus moves to the answered line`; `NT5.4 · at accessibility sizes the buttons stack full width`; `T53-notificationsPage.test.tsx` › `NT5.4 · the page's labels and dimmed states`
  · expect: the bubble's label "Kit: What time do you usually get dressed to head out? I'll send you an outfit idea 15 minutes before."; the label text "I get dressed at" hidden from VoiceOver; the pill "I get dressed at, 8:00 am"; buttons `accessibilityRole` button labelled "Send me ideas", "No thanks", "Turn them back on", "Change the time". Pending `request()`: "Send me ideas" `busy` (loading) and "No thanks" `disabled`; a second press calls nothing. After each answer `AccessibilityInfo.setAccessibilityFocus` is called for the line ("Kit: Done. Your first idea lands today at 7:45 am.", "Kit: No problem. You can turn it on later in You → Notifications.", "Kit: Back on. …", "Kit: Done. You can turn them on in You → Notifications."); Change the time focuses the time. With the theme's `isAccessibilitySize` true every KButton in both cards gets `fullWidth`. Page: switches labelled "Daily outfit idea" and "Fit check ready"; the time "I get dressed at, 8:00 am"; greyed: each `disabled`. Simulator at AX5: 158, 287 and 288 match phones 15 and 16 (nothing cut, buttons stacked, the time row stacking on the page).
  · must not: any text truncated at AX5; the "Stylist" header or "Ask Kit…" bar uncapped (they stay at 2x); a control without a label.
  · edges: dark and light both (screenshots in both).
  · red: cards: `Unable to find an element with accessibility label: Kit: What time do you usually get dressed…` / `…role: button, name: Send me ideas`; the AX test `T53: not built` (comeback) · page: `Unable to find an element with testID: notifs-idea` · the focus assertion checks that `AccessibilityInfo.setAccessibilityFocus` is called after an answer (and not for an answered card that mounts), not which element gets it: the Simulator's VoiceOver check covers the target · AX5 screenshots: not run

- **NT5.5** · On a real iPhone (the founder's phone or a TestFlight build): the prompt appears after `Send me ideas`, and a nudge set a few minutes ahead arrives with its line and opens today's card.
  · how: manual on the founder's phone (Not testable yet), with a Simulator rehearsal after the native rebuild
  · test: none automated; REPORT.md records the Simulator rehearsal (prompt after Send me ideas on a fresh install, the 7 pending requests, a delivered nudge tapped)
  · expect: Apple's prompt ("“Kitted” Would Like to Send You Notifications") only after tapping "Send me ideas"; a nudge arrives on the lock screen as "Kitted" with one of the three lines and no title; tapping it opens Stylist at today's card.
  · must not: a prompt at launch or before the tap; a title; a badge.
  · edges: a Focus mode or Scheduled Summary is iOS's (not tested).
  · red: n/a (manual).

**Fit check ready (NT6)**

- **NT6.1** · A check that scores after the app went to the background (within iOS's extra time) shows NT6's line with the right fix count, once.
  · how: unit (ready watch)
  · test: `T53-ready.test.ts` › `NT6.1 · scored in the background: one notification, 2 / 1 / 0 fixes`; `NT6.1 · a check that was not scoring when he left sends nothing; a re-check is its own`; `NT6.1 · background time begins on leaving and ends when done`
  · expect: a check `scoring`, `appState('background')` → `begin` called once; patch the row to `scored` with 2 distinct fixes (a third duplicate copy doesn't count), `checksChanged()` → one `presentNow` `{ id: 'ready|<id>', atMs: null, data: { kind: 'ready', checkId } }`, body "Your fit check is ready. 2 quick fixes inside."; `end` called; a second `checksChanged()` → no second. With 1 fix: "Your fit check is ready. 1 quick fix inside."; with 0: "Your fit check is ready.".
  · must not: two notifications for one check; a notification for a check that was not scoring when he left.
  · edges: a re-check is a new check id (one each); iOS's extra time running out first: nothing sent, the score is in the chat on return (as today; manual, NT6.6).
  · red: all three: `T53: not built` (createReadyWatch)

- **NT6.2** · A check that scores while he's in the app sends nothing; a failed, "not rated" or offline check sends nothing.
  · how: unit
  · test: `T53-ready.test.ts` › `NT6.2 · in the app: nothing`; `NT6.2 · failed, offline, unreadable, not clothed, held, asking, or no score: nothing`
  · expect: scored while `active` (never backgrounded, or back to `active` before the score) → no `presentNow`. In the background: `failed` (`failCode` `ai`, `timeout`, `offline`), `unreadable`, `notClothed`, `held`, `asking`, and `scored` with `score: null` → no `presentNow`, the watch ends.
  · must not: any `presentNow` in those cases.
  · edges: a check partly "not rated" with a score sends (technical 7).
  · red: both: `T53: not built`

- **NT6.3** · With the `Fit check ready` switch off, or notifications not allowed, nothing is sent.
  · how: unit
  · test: `T53-ready.test.ts` › `NT6.3 · switch off, denied, undetermined, or not built: nothing`; `settingsPrefs.test.ts` › `NT6.3 · the daily idea is off until his yes; Fit check ready is on until turned off; no trial switch` (changed from "are on until turned off")
  · expect: `notify.ready '0'` → none; permission `denied` → none; `undetermined` → none; `built()` false → none; `notify.ready` unset with `granted` → sent (the default on).
  · must not: `request()` called by the ready watch.
  · edges: after "Delete all my data" with iOS still granted, it's on (DESIGN, technical default).
  · red: ready: `T53: not built` · settingsPrefs: loadNotificationPrefs toEqual diff (idea true, trial present)

- **NT6.4** · Tapping it opens Stylist at that check's card.
  · how: unit and a Simulator state check
  · test: `T53-notifyTap.test.ts` › `NT6.4 · a ready tap scrolls to that check's card`
  · expect: `openFromNotification({ kind: 'ready', checkId: 'c1' }, deps)` → `navigate` once and `setAction({ kind: 'scrollTo', messageId: <the fitCheck card message for c1> })`.
  · must not: `checkMyFit`; scrolling to another check's card; `ensureTodaysCard` deciding the target.
  · edges: a check from an earlier day: StylistScreen's existing `scrollTo` opens that day's chat (as built).
  · red: `T53: not built` · Simulator: not run

- **NT6.5** · The line never contains the score.
  · how: unit
  · test: `T53-ready.test.ts` › `NT6.5 · the body never carries the score`
  · expect: a check scored 7.5 (and one scored 10) in the background: the body matches none of `7.5`, `10`, `/\d+\.\d/`, "/10".
  · must not: the score or a word from the card's headline in the body.
  · edges: none.
  · red: `T53: not built`

- **NT6.6** · On a real iPhone: start a check, go to the home screen at once, and the notification arrives with the score in the chat.
  · how: manual on the founder's phone (Not testable yet), with a Simulator rehearsal (demo latency off, a live or mock reading with a few seconds' latency, Home pressed at once)
  · test: none automated
  · expect: within about 8–30 s, "Your fit check is ready. {n} quick fix(es) inside." on the lock screen or as a banner; opening Kitted shows the score card.
  · must not: a notification when the app stays open; the score on the lock screen.
  · edges: iOS's extra time running out (no notification, score in the chat on return).
  · red: n/a (manual).

## UI inventory
Every visible element, per state, exactly as `tasks/T53/DESIGN.md` (approved Nov 9) says, in its order. Light, dark and the largest text size for each. Shared parts (DESIGN): **Kit's name** · "Kit" (`common.who`) · hidden from VoiceOver · shown on the first Kit line after a card, stamp or his message. **Kit's bubble** · VoiceOver "Kit: {the line}". **The time row** · label "I get dressed at" (hidden from VoiceOver) + time capsule "8:00 am" (his stored time or 8:00 am) · VoiceOver "I get dressed at, 8:00 am", button, collapsed/expanded · tap opens the menu. **Buttons** · `KButton` regular, primary / secondary, a wrapping row, 8 pt gaps; full width and stacked at accessibility sizes.

### Kit's ask · phone 1 · demo 158 (and 283's card) · light, dark, largest text (phone 15)
(above it, as built: his fit check's card, "Want outfit ideas from your own clothes? This part is optional." and the closet card: "Optional", "About 30 seconds", "Tap the clothes you already own", "I'll build outfit ideas from them. Skip it and I'll still learn your closet from your fit checks.", "Show me the list", "Skip")
- Kit's name · "Kit" · VoiceOver: hidden · testID none (inside `notify-ask`)
- Kit's bubble · "What time do you usually get dressed to head out? I'll send you an outfit idea 15 minutes before." · VoiceOver: "Kit: What time do you usually get dressed to head out? I'll send you an outfit idea 15 minutes before." · testID `notify-ask` (the card's wrapper)
- Time row label · "I get dressed at" · VoiceOver: hidden · testID `notify-ask-time-row` (the row)
- Time capsule · "8:00 am" · VoiceOver: "I get dressed at, 8:00 am", button · testID `notify-ask-time-row` (the row)
- Primary button · "Send me ideas" · VoiceOver: "Send me ideas", button · found by its words
- Secondary button · "No thanks" · VoiceOver: "No thanks", button · found by its words

### Kit's ask · picking a time · phone 2 · demo 158 + a tap on the time · light, dark, largest text
- Menu top row · "8:00 am" with a chevron up · VoiceOver: the time, button
- Rule · 1 pt line · VoiceOver: none
- Menu rows · "5:00 am", "5:30 am", "6:00 am", "6:30 am", "7:00 am", "7:30 am", "8:00 am" (current: semibold, ink, check), "8:30 am", "9:00 am", "9:30 am", "10:00 am", "10:30 am", "11:00 am", "11:30 am", "12:00 pm", "12:30 pm", "1:00 pm" (scrolls into view), plus his stored time if off the list · VoiceOver: the time, button, "selected" on the current one; the panel is modal
- Scrim · rgba(18,22,40,0.06) light, rgba(0,0,0,0.25) dark · VoiceOver: none
- (the pill under the panel is hidden while it's open)

### Kit's ask · Apple's prompt · phone 3 · demo 159 (the card; the alert itself is iOS's, seen only on a real run) · light, dark, largest text
- Apple's alert (iOS) · "“Kitted” Would Like to Send You Notifications", "Notifications may include alerts, sounds, and icon badges. These can be configured in Settings.", "Don’t Allow", "Allow" · VoiceOver: iOS's own · not on the demo screen
- Primary button, waiting · a spinner in place of "Send me ideas", same width · VoiceOver: busy · found by role in tests; Maestro: "Send me ideas" text not visible
- Secondary button, dimmed · "No thanks" at 0.4, disabled · VoiceOver: "No thanks", button, dimmed · found by its words (`enabled: false`)
- Kit's name, bubble, time row: as phone 1

### Kit's ask · allowed · phone 4 · demos 160 ("today") and 280 ("tomorrow") · light, dark, largest text
- Kit's name · "Kit"
- Kit's bubble · "Done. Your first idea lands tomorrow at 7:45 am." (280) / "Done. Your first idea lands today at 7:45 am." (160) · VoiceOver: "Kit: Done. Your first idea lands tomorrow at 7:45 am." (or today); focus moves here after the answer · testID `notify-ask-line`
- (no time row, no buttons)

### Kit's ask · No thanks, or Don't Allow · phone 5 · demos 281 (No thanks) and 282 (Don't Allow) · light, dark, largest text
- Kit's name · "Kit"
- Kit's bubble · "No problem. You can turn it on later in You → Notifications." · VoiceOver: "Kit: No problem. You can turn it on later in You → Notifications."; focus moves here · testID `notify-ask-line`
- (Past chats, an earlier day's unanswered card: only the question bubble, no footer; not drawn)

### Kit's ask · the catch-up for earlier testers · phone 6 · demo 283 · light, dark, largest text
- Day stamp · the thread's own stamp (`stampText`; the frame's "Tuesday 8:12 am"), when the thread shows one above it · VoiceOver: header
- Then phone 1's card exactly (name, bubble, time row, both buttons), the last thing in today's thread · testIDs as phone 1

### The daily nudge · phone 7 · no demo screen (iOS draws it; content checked by NT2.1–NT2.3, NT2.6 and on the Simulator/phone) · always dark
- Header · "Kitted" and the time (iOS's) · no title
- Body · one of "Today's outfit idea is ready." / "Check today's fit. Each one teaches me your closet." / "Your closet's big enough now: here's today's idea." · VoiceOver: "Kitted, {body}"
- Default sound; no badge, image, actions or Time Sensitive

### Fit check ready · phone 17 · no demo screen (iOS draws it; NT6.1, NT6.5, NT6.6) · always dark
- Header · "Kitted" and the time · no title
- Body · "Your fit check is ready. 2 quick fixes inside." / "Your fit check is ready. 1 quick fix inside." / "Your fit check is ready." · VoiceOver: "Kitted, {body}"
- Default sound; no badge, image or actions; never the score

### You → Notifications · on · phone 8 · demo 284 · light, dark, largest text
- Back · chevron (iOS 26 glass) · VoiceOver: "You", back button
- Title · "Notifications" · VoiceOver: header
- Header · "An outfit idea once a day, and a heads-up when a fit check finishes after you leave. That's all I send." · VoiceOver: read as text · found by its words
- Daily outfit idea · "Daily outfit idea" + switch (on, `good` track) · VoiceOver: "Daily outfit idea", switch button, on · testID `notifs-idea`
- I get dressed at · title "I get dressed at" (hidden from VoiceOver) + value "8:00 am" with a chevron down · VoiceOver: "I get dressed at, 8:00 am", button · testID `notifs-time`
- Fit check ready · "Fit check ready" + switch (on) · VoiceOver: "Fit check ready", switch button, on · testID `notifs-ready`
- (no "Trial ending" row; the tab bar stays, You selected)

### You → Notifications · never asked, or off · phone 9 · demos 285 (never asked) and 286 (paused) · light, dark, largest text
- Back, title, header: as phone 8
- Daily outfit idea · switch off · VoiceOver: "Daily outfit idea", switch button, off · testID `notifs-idea` (while Apple's prompt is up: on and disabled)
- (no time row)
- Fit check ready · switch off on 285 (iOS hasn't allowed); on on 286 (paused) · VoiceOver: "Fit check ready", switch button, off / on · testID `notifs-ready`

### You → Notifications · off in iOS · phone 10 · demo 287 · light, dark, largest text (phone 16)
- Back, title: as phone 8
- Off card · "Notifications are off for Kitted." · VoiceOver: read as text · testID `notifs-off-card`
- Open Settings · secondary button · "Open Settings" · VoiceOver: "Open Settings", button · found by its words; opens Kitted's page in iOS Settings
- Header: as phone 8
- Daily outfit idea · switch on, greyed (row contents at 0.4) · VoiceOver: "Daily outfit idea", switch button, on, dimmed · testID `notifs-idea`
- I get dressed at · "8:00 am", greyed, not tappable · VoiceOver: "I get dressed at, 8:00 am", button, dimmed · testID `notifs-time`
- Fit check ready · switch on, greyed · VoiceOver: "Fit check ready", switch button, on, dimmed · testID `notifs-ready`
- (the card, its border and the divider stay at full opacity)

### The comeback question · phone 11 · demo 288 · light, dark, largest text
- Day stamp · the thread's stamp (frame "Tuesday 8:12 am") · VoiceOver: header
- Kit's name · "Kit"
- Kit's bubble · "I paused your daily ideas after a week without a visit. Want them back?" · VoiceOver: "Kit: I paused your daily ideas after a week without a visit. Want them back?" · testID `comeback`
- Primary button · "Turn them back on" · VoiceOver: "Turn them back on", button
- Secondary button · "Change the time" · VoiceOver: "Change the time", button
- Secondary button · "No thanks" · VoiceOver: "No thanks", button

### The comeback · Change the time · phone 12 · demo 289 · light, dark, largest text
- Day stamp, Kit's name, Kit's bubble: as phone 11 · testID `comeback`
- Time row · "I get dressed at" + "8:00 am" · VoiceOver: "I get dressed at, 8:00 am"; focus moves here · testID `comeback-time-row`
- Primary button · "Turn them back on"
- Secondary button · "No thanks"

### The comeback · back on · phone 13 · demo 290 · light, dark, largest text
- Kit's name + Kit's bubble · "Back on. Next one lands tomorrow at 7:45 am." ("today" when the time hasn't passed) · VoiceOver: "Kit: Back on. Next one lands tomorrow at 7:45 am." · testID `comeback-line`

### The comeback · No thanks · phone 14 · demo 291 · light, dark, largest text
- Kit's name + Kit's bubble · "Done. You can turn them on in You → Notifications." · VoiceOver: "Kit: Done. You can turn them on in You → Notifications." · testID `comeback-line`

### Largest text · phone 15 (demo 158 at AX5) and phone 16 (demo 287 at AX5) · light, dark
- Phone 15: the bubble at body AX5, the label on its own line with the capsule under it, the two buttons stacked full width (text capped at 2x), "Stylist" header and "Ask Kit…" bar capped at 2x; nothing cut.
- Phone 16: the off card's line wrapping, Open Settings full width, the header wrapping (~8 lines), each switch title wrapping beside its switch, the time row stacking (title, then time); nothing truncated.
- Demo 288 at AX5: the three comeback buttons stacked full width in their order.

## Not testable yet
Never dropped, never counted as pass.
- **NT5.5** · why: needs a real iPhone with the native rebuild (the founder's phone via `tools/phone/install.sh` after `expo run:ios --device`, or a TestFlight build, which waits for his separate OK, Y22). · would verify it: a founder to-do: fresh install → first fit → `Send me ideas` → Allow → set the time so a nudge lands within the half hour, lock the phone, tap the nudge (about 30 min). The Simulator rehearsal after the native rebuild is recorded in REPORT.md but doesn't count as pass.
- **NT6.6** · why: iOS's background time and a real reading need a real iPhone. · would verify it: the same session: start a check, press Home at once, wait for "Your fit check is ready…", open Kitted (about 5 min).
- **NT2.1 (the delivered content), NT2.4 and NT6.4 (a real tap)** · why: the unit tests prove what is scheduled and what a tap does, but not iOS's own delivery and tap routing; they need the native rebuild on the Simulator (no EAS) and then the phone. · would verify it: the Simulator rehearsal (pending list, a delivered nudge tapped, a cold start from a tap), then the founder's phone session above.

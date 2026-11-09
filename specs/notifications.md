# Notifications

After this, a tester who says yes gets one notification a day, 15 minutes before the time he usually gets dressed to head out: today's outfit idea from his closet, or, when there isn't one, a nudge to send today's fit. It's scheduled on his phone, it stops by itself if he stops coming, and nothing else is ever sent.

**Part of:** `specs.md` → F13 (Notifications) and "First run" step 8.

## Why
The beta needs testers to come back and check fits; without a nudge most drift after day one. A nudge that lands while he's choosing what to wear is useful on its own (an outfit idea, or "send me the fit"), so it never has to be a "we miss you". The ask card, the Settings page and the saved time were built in October and switched off, waiting for the notification package; this spec changes them to ask the time he gets dressed and turns them on.

## Scope
- **In:** Kit's ask in the chat (and the same ask once for testers who finished setup before notifications existed); Apple's permission prompt; the daily nudge and its two lines; scheduling 7 days ahead on the phone; the comeback question after a week with no visit; You → Notifications; what tapping a nudge opens; "Delete all my data" and the under-18 lock.
- **Out (non-goals):** push from a server (no push key, no device tokens, no server code); a second notification kind in the beta (`Fit check ready` comes with launch, `specs.md` F13; `Trial ending` is gone for good); a separate weekend time; streaks, counts of days, or "we miss you" in any form; asking again after `No thanks`; Apple's provisional (quiet) notifications; the weather in the notification text.

## The rules
- **One a day, every day,** at his nudge time = the time he usually gets dressed minus 15 minutes. Default sound. Nothing else is ever sent, at any hour.
- **His get-dressed time:** half-hour steps from 5:00 am to 1:00 pm (17 choices), default 8:00 am. A time he set before that's off the list is kept (as built). The time follows the phone's clock, so it stays 8:00 local when he travels **(assumed)**.
- **Local only:** the phone schedules every nudge itself. Each time the app opens (or comes back to the foreground), it replaces whatever was scheduled with the next 7 days. Nothing is sent to or kept on a server.
- **What each day's nudge says:** the outfit that day's morning card shows, so the two always agree **(assumed)**. If his closet can't make an outfit for that day, the "Heading out?" line.
- **A week with no visit:** the 7 scheduled days run out and nothing more is scheduled. On his next open, Kit asks the comeback question once (NT4). Until he answers it (or turns the switch back on in Settings), nothing is scheduled.
- **Apple's prompt** shows only after he taps `Send me ideas` on Kit's card, or turns on `Daily outfit idea` in You → Notifications when it was never asked. Never at launch, never on its own.
- **`No thanks` is final:** Kit never asks again; You → Notifications is the only way back.
- **Nothing scheduled** while the switch is off, while iOS has notifications off for Kitted, under the under-18 lock, or after "Delete all my data" (which cancels everything already scheduled).

## NT1. Kit's ask (in the chat)
**When:** after his first scored fit, at the end of the setup sequence (in the beta, right after the optional "tap the clothes you own" card; at launch, after the paywall closes, as built). Once ever.

**Testers who finished setup before notifications existed** (the first TestFlight build): the same card, once, the next time Stylist opens, if Apple's prompt was never shown.

**The card, one step:**
1. Kit: `What time do you usually get dressed to head out? I'll send you an outfit idea 15 minutes before.`
2. Label `I get dressed at` with the time menu (default 8:00 am, or the time he already set).
3. Buttons: `Send me ideas` (primary) · `No thanks` (secondary).

**Answers:**
- `Send me ideas` → Apple's prompt.
  - Allow → the time and the switch are saved, the next 7 days are scheduled, and the card becomes Kit: `Done. Your first idea lands tomorrow at 7:45 am.` (`today` instead of `tomorrow` when today's nudge time hasn't passed yet; the time shown is the nudge time).
  - Don't Allow → the card becomes Kit: `No problem. You can turn it on later in You → Notifications.`
- `No thanks` → Apple's prompt is never shown; the switch is saved off; Kit: `No problem. You can turn it on later in You → Notifications.`
- Answered, the card stays as its one line for good. An earlier day's unanswered card shows only the question (as built).

## NT2. The daily nudge
Shown under the app name "Kitted", with no title, one line:
- **With an outfit:** `Today: {item1}, {item2}, {item3}, {item4}.` Lowercase piece names, as many as the outfit has. Example: `Today: navy overshirt, grey tee, khaki chinos, white sneakers.`
- **No outfit to suggest** (empty closet, or nothing that makes an outfit): `Heading out? Send me today's fit.`
- **Tap** → the Stylist tab, scrolled to today's card (posted then if it isn't yet). A tap on an older day's nudge opens today's card.

## NT3. You → Notifications
The `Notifications` row on You (its first row group, `specs/setup-and-you.md`) shows once notifications are built and opens this page.
- Header: `One outfit idea a day, 15 minutes before you get dressed. That's all I send.`
- Rows: `Daily outfit idea` (switch) · `I get dressed at` (the time menu; hidden while the switch is off, as built).
- Changing the time reschedules at once. Switch off cancels everything scheduled.
- Switch on when Apple's prompt was never shown → Apple's prompt; Don't Allow leaves the switch off.
- **iOS has notifications off for Kitted:** a card on top, `Notifications are off for Kitted.` + `Open Settings` (opens Kitted's page in iOS Settings); the switch and time are greyed out. Coming back with them on clears the card and schedules.
- `Fit check ready` and `Trial ending` rows are gone in the beta.

## NT4. The comeback question
**When:** he opens the app after the scheduled nudges ran out (a week with no visit) while the switch is on. Once per lapse.

**The card:**
1. Kit: `I paused your daily ideas after a week without a visit. Want them back?`
2. Buttons: `Turn them back on` · `Change the time` · `No thanks`.

**Answers:**
- `Turn them back on` → the next 7 days are scheduled; Kit: `Back on. Next one lands tomorrow at 7:45 am.` (`today` when today's time hasn't passed).
- `Change the time` → the time menu opens in the card; picking a time saves it, schedules, and shows the same `Back on.` line with the new time.
- `No thanks` → the switch is saved off; Kit: `Done. You can turn them on in You → Notifications.`
- Ignored → nothing is scheduled; the card stays answerable; turning the switch on in You → Notifications also resumes (and the card becomes its `Back on.` line).

## Data (all on the phone)
- **Get-dressed time:** `profile.ideaTime` (as built, "HH:MM"). The nudge time is derived, never stored.
- **Daily outfit idea switch:** KV `notify.idea` (as built). `notify.ready` and `notify.trial` are no longer read in the beta.
- **Scheduled through:** the date of the last scheduled nudge, to tell a lapse (NT4) from a normal open.
- **Asked:** whether Kit's ask was posted (the setup sequence's `notifyMsgId`, as built) and whether the comeback question was posted for the current lapse.
- **Each day's outfit:** the morning card's locked idea for that day (as built), now also chosen ahead for scheduled days.
- Nothing leaves the phone. "Delete all my data" clears all of the above and cancels every scheduled nudge.

## Failure and edge cases
| Situation | What happens |
|---|---|
| Don't Allow at Apple's prompt | Kit's later line; nothing scheduled; You → Notifications shows the off card. |
| He turns notifications off in iOS Settings later | Nothing new scheduled; You → Notifications shows the off card. |
| He picks a time, but today's nudge time has passed | The first nudge is tomorrow; the line says `tomorrow`. |
| The closet changes after scheduling | The next open reschedules with the new outfits. A day's planned outfit that's no longer possible is re-picked by the card; the nudge already shown may have named the old one **(assumed, rare)**. |
| No weather (location declined or offline) | The outfit is picked by season, as the card does. |
| The under-18 lock | No ask, nothing scheduled. |
| "Delete all my data" | Every scheduled nudge cancelled; the ask can come again after setup like a new user. |
| A Focus mode or Scheduled Summary | iOS handles it; we don't ask for Time Sensitive. |

**Never:** a notification at a time he didn't choose; more than one a day; "we miss you", a streak, a day count or guilt; Apple's prompt before his yes on Kit's card; anything about his face or body.

## Acceptance criteria
**The ask (NT1)**
- NT1.1 After the first scored fit in a beta setup, Kit's ask posts once, after the closet card; it never posts before a scored fit.
- NT1.2 The card shows the time menu up front (5:00 am–1:00 pm in half hours, 8:00 am selected) with `Send me ideas` and `No thanks`, in NT1's exact words.
- NT1.3 Apple's prompt is requested only from `Send me ideas` (and NT3's switch); `No thanks` never requests it.
- NT1.4 Allow saves the time and the switch, schedules 7 nudges, and shows the done line with the nudge time (8:00 → `7:45 am`), `today` or `tomorrow` correctly.
- NT1.5 Don't Allow and `No thanks` each show the later line and schedule nothing.
- NT1.6 A user whose setup finished with no ask posted, and whose permission was never asked, gets the ask once on the next Stylist open; never a second time.
- NT1.7 After `No thanks`, Kit never posts the ask again (including after more checks and restarts).

**The nudge (NT2)**
- NT2.1 Each open (and each return to the foreground) leaves exactly 7 nudges scheduled, one per day, each at the get-dressed time minus 15 minutes, with the default sound and no title.
- NT2.2 A day with an outfit gets `Today: …` naming that day's outfit, the same pieces as that day's morning card.
- NT2.3 A day with no outfit (empty closet) gets `Heading out? Send me today's fit.`
- NT2.4 Tapping a nudge opens Stylist at today's card.
- NT2.5 No other notification is ever scheduled: no `Fit check ready`, no `Trial ending`, nothing at another time (a test over every schedule call).

**You → Notifications (NT3)**
- NT3.1 The page shows NT3's header and rows; no `Fit check ready` or `Trial ending` row.
- NT3.2 Changing the time reschedules all 7 at the new time; switch off leaves nothing scheduled.
- NT3.3 Switch on with the permission never asked requests Apple's prompt; Don't Allow leaves the switch off.
- NT3.4 With iOS notifications off for Kitted, the off card and `Open Settings` show, the controls are greyed out, and nothing is scheduled.

**The comeback (NT4)**
- NT4.1 Opening the app after the last scheduled nudge has passed, with the switch on, posts the comeback question once and schedules nothing.
- NT4.2 Each of its three answers does what NT4 says, with its exact line.
- NT4.3 A normal open (within the week) reschedules without any question.

**Safety**
- NT5.1 "Delete all my data" cancels every scheduled nudge and clears the time, the switch and the asked flags.
- NT5.2 Under the under-18 lock, no ask posts and nothing is scheduled.
- NT5.3 Every new string is in the copy deck, has no emoji, and matches this spec word for word (copy test).
- NT5.4 Kit's ask, You → Notifications and the comeback card work at the largest text size and with VoiceOver (the time menu reads `I get dressed at, 8:00 am`).
- NT5.5 On a real iPhone (the founder's phone or a TestFlight build): the prompt appears after `Send me ideas`, and a nudge set a few minutes ahead arrives with its line and opens today's card.

## Checked against Apple's guidelines
Asked in context after he's seen what the app does, with Kit's card explaining why before Apple's prompt; never at launch; a refusal is respected and the way back is in Settings (Human Interface Guidelines → Notifications and → Privacy, "requesting permission"). No marketing, no notifications he didn't ask for (App Review Guideline 4.5.4).

## Touches
- `app/src/services/notifications.ts` (the real permission and scheduling behind the existing interface), `app/src/config/features.ts` (`NOTIFICATIONS_BUILT`).
- `app/src/features/finish/` (the ask card, the one-time catch-up), `features/settings/prefs.ts` (the time list), `app/src/app/(tabs)/you/notifications.tsx` (the row on You belongs to T34), `features/morning/` (each day's outfit ahead of time), `features/privacy/wipe.ts` (cancel on delete).
- The copy deck `handoff/02-screens.md` §5 (which generates `en.ts`): the strings above; the old `notif.ask*`, `notifs.header`, `unopened.*` and `push.trial` strings replaced or removed.
- New package `expo-notifications` (the founder's OK, Nov 9), `app/package.json` and `app/app.config.ts` (after PR #71 is merged): a native rebuild and a new TestFlight build.
- Must not break: the setup sequence's order and its Back/X; the morning card's locked idea and rotation; nothing sent off the phone.

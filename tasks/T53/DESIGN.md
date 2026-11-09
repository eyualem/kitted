# T53 · Design: notifications in the beta (Kit's ask, the daily nudge, You → Notifications, the comeback)

<!-- Leave this comment. Only the coordinator replaces it with the approval line, after the founder's yes in chat. -->

**From:** `plan.md` → T53 · **Spec:** `specs/notifications.md` → NT1 (except NT1.8–NT1.10, T57), NT2, NT3, NT4, NT5 · **Frames:** `tasks/T53/design.html` (open with `preview_start` name `mockups`, then `http://127.0.0.1:8095/tasks/T53/design.html`) · **PNGs:** `tasks/T53/design/`

Approved, this file is the contract: the planner copies the UI inventory from it word for word, and the critic holds the build to it. It changes only with the founder's yes.

## What he sees
After his first scored fit, Kit asks in the chat what time he usually gets dressed, with the time already filled in and two buttons. If he says yes and allows it in Apple's prompt, he gets one notification a day, 15 minutes before that time, and You → Notifications is where he changes the time or turns it off. If he doesn't open the app for a week, the nudges stop, and the next time he opens it Kit asks once whether he wants them back.

## Where it lives
- **Kit's ask and the comeback question** are Kit's lines in the Stylist thread (`StylistMessage` with a `footer`, as the ask card is built today in `features/finish/NotifyAskCard.tsx`). Around them: the Stylist header ("Stylist", no subtitle in the beta: `quotaLine` returns null for the beta tier), the "Ask Kit…" bar (`StylistBar`, the tab-bar accessory) and the tab bar. There's no Back or X: they're cards in the thread, answered in place. Once answered, each card stays as its one line for good.
- **Apple's prompt** is iOS's own alert over whatever screen asked for it (Stylist, or You → Notifications).
- **The nudge** is drawn by iOS (lock screen, Notification Center, banner). A tap opens the Stylist tab at today's card. That card is built by the morning lane (T55) and isn't redrawn here.
- **You → Notifications** is a page pushed from the `Notifications` row on You (`app/(tabs)/you/notifications.tsx`; the row itself belongs to T34, `specs/setup-and-you.md` SY1). It has the native header "Notifications" and the system Back button (VoiceOver "You"). The tab bar stays, with You selected. He leaves with Back or a swipe from the left edge.

## States
In the order he meets them. The must-not cases, where he sees nothing: **under the under-18 lock** no ask posts, no comeback posts, and nothing is scheduled (NT5.2); **after `No thanks`** Kit never posts the ask again (NT1.7); **after "Delete all my data"** everything scheduled is cancelled and the ask can come again after setup, like a new user (NT5.1). None of these has a frame. The data deletion screens aren't changed by this task.

Shared parts, used in several states (each state below names them):
- **Kit's name** · `StylistMessage` header · "Kit" (`en.ts` `common.who`) · type `footnote` 600, color `ink3`, 16 pt in from the bubble's edge, 4 pt above the bubble · hidden from VoiceOver (the bubble says "Kit: …") · shown on the first Kit line after a card, a stamp or his message (`thread.ts` `showWho`, as built).
- **Kit's bubble** · `StylistMessage` · type `body` (role `chatText`), color `ink` on `surface`, 1 pt `line` border, radius 24 with the bottom-left tail 6, padding 10 / 16, up to 86% wide (94% at accessibility sizes) · VoiceOver: "Kit: {the line}" (`en.ts` `a11y.stylistSays`) · tap: nothing.
- **The footer** · `StylistMessage` `footer` · 6 pt above it, 8 pt between its rows (`space.s`).
- **The time row** · a `View` row, wraps (`flexWrap`), 8 pt gap:
  - Label · `KText` `subheadline`, color `ink2` · "I get dressed at" (source: spec NT1 step 2) · **hidden from VoiceOver**, because the time says it.
  - Time · `MorphPicker` (capsule, today's default look) · "8:00 am" (his stored `profile.ideaTime`, or 8:00 am; the label comes from `ideaTimeLabel`) · capsule 32 tall, 12 pt side padding, radius 16, fill `surface2`, `subheadline` 600 `ink`, a `chevronDown` 11 in `ink2`, 5 pt gap; hit area 44 (6 pt `hitSlop` above and below) · VoiceOver: "I get dressed at, 8:00 am" (spec NT5.4; built as `settings.a11y.value` with label "I get dressed at"), button, collapsed / expanded · tap: opens the menu (phone 2).
- **The time menu** · the `MorphPicker` panel · 17 options, "5:00 am", "5:30 am" … "12:30 pm", "1:00 pm" (spec: half hours, 5:00 am to 1:00 pm; `IDEA_TIMES`), plus his stored time if it's off the list (`ideaTimeOptions`, as built) · each row 44 tall, `body`, `ink2`; the current one `body` 600 `ink` with a `check` · VoiceOver per row: the time, button, selected for the current one; the panel is modal (`accessibilityViewIsModal`).
- **Buttons** · `KButton` size `regular` (36 visual, 44 hit, 16 pt side padding, `subheadline` 600), in a row that wraps, 8 pt gap. Primary: `primary` fill, `onPrimary` text. Secondary: `surface2` fill, `ink` text. At most one primary per card.

### Kit's ask · when: once ever, right after his first scored fit, at the end of the setup sequence (in the beta right after the optional closet card) · phone 1 · `design/01-light.png`, `design/01-dark.png`
Top to bottom, in VoiceOver's reading order (the thread above is as built: his fit check's card, Kit's "Want outfit ideas from your own clothes? This part is optional." (`plan.intro`) and the closet card (`InviteCard`: "Optional", "About 30 seconds", "Tap the clothes you already own", "I'll build outfit ideas from them. Skip it and I'll still learn your closet from your fit checks.", "Show me the list", "Skip"), all unchanged):
- Kit's name · "Kit" (as above). 12 pt under the closet card (`RHYTHM.stylistCards`).
- Kit's bubble · "What time do you usually get dressed to head out? I'll send you an outfit idea 15 minutes before." (source: spec NT1 step 1) · VoiceOver: "Kit: What time do you usually get dressed to head out? I'll send you an outfit idea 15 minutes before."
- The time row · label "I get dressed at" + the time "8:00 am" (as above).
- Send me ideas · `KButton` primary regular · "Send me ideas" (source: spec NT1 step 3) · VoiceOver: "Send me ideas", button · tap: shows Apple's prompt (phone 3). This and You → Notifications' switch are the only two places it's asked.
- No thanks · `KButton` secondary regular · "No thanks" (source: spec; `en.ts` `notif.ask.no` already says it) · VoiceOver: "No thanks", button · tap: saves the switch off, never asks iOS, and the card becomes its later line (phone 5).
- **Motion and haptics:** none new. The card posts the way every Kit line posts.
- **Dark:** token swap only. The primary button turns light with near-black text (`primary` / `onPrimary` dark).
- **Largest text:** phone 15.
- **Change from today:** the question, the label and the button words change; the time row moves up front and the old two-step card (`Yes, pick a time`, then `Set {time}`, `NotifyCardState` `picking`) goes. The label changes from "Daily idea at" and the menu's VoiceOver from "Daily outfit idea time, {time}".

### Kit's ask · picking a time · when: he taps the time · phone 2 · `design/02-light.png`, `design/02-dark.png`
- The time menu (as above) grows out of the pill in place. There's no room under the pill at the end of the thread, so it grows upward to the top of the safe area plus 16 pt and is as tall as the screen allows (to 16 pt above the home-indicator area). It's 220 wide (`MIN_W`), starting at the pill's left edge. Its top row is the pill again ("8:00 am" with a `chevron.up`), then a 1 pt `line` rule, then the times. 16 rows show; "1:00 pm" scrolls into view.
- A scrim covers the rest: `rgba(18,22,40,0.06)` in light, `rgba(0,0,0,0.25)` in dark (as built). The pill under the panel is hidden while it's open.
- tap a time: the menu shrinks back into the pill, which shows the new time. Nothing is saved or scheduled yet: the card keeps the pick (`payload.time`, as built) until Send me ideas. Tap outside, or the top row: it closes with no change.
- **Motion and haptics:** the existing morph, 260 ms open (ease out) and 190 ms close (ease in); with Reduce Motion it opens and closes at once. No haptic.
- **Dark:** panel `surface2` with a heavier shadow `0 12 32 rgba(0,0,0,0.45)` (as built).
- **Largest text:** rows grow to two lines' height and the panel scrolls (as built).

### Kit's ask · Apple's prompt · when: he taps Send me ideas · phone 3 · `design/03-light.png`, `design/03-dark.png`
- Apple's alert · iOS system UI, drawn approximately in the frame · "“Kitted” Would Like to Send You Notifications", "Notifications may include alerts, sounds, and icon badges. These can be configured in Settings.", "Don’t Allow", "Allow" (Apple's own words; Kitted can't change them) · VoiceOver: iOS's own.
- Behind it: Send me ideas shows a spinner in place of its words, at the same width (`loading`, `accessibilityState.busy`, as built), and No thanks is dimmed and disabled (`opacity.disabled` 0.4) until the answer comes back, so a second tap can't race the prompt. *Change from today:* No thanks isn't disabled today.
- Allow → phone 4. Don't Allow → phone 5.
- **Motion and haptics:** iOS's own.
- **Dark:** iOS draws its dark alert.
- **Largest text:** iOS reflows its alert.

### Kit's ask · allowed · when: he taps Allow · phone 4 · `design/04-light.png`, `design/04-dark.png`
- Kit's name + Kit's bubble · "Done. Your first idea lands tomorrow at 7:45 am." (source: spec NT1 "Answers") · the time is the nudge time (his time minus 15 minutes, `ideaTimeLabel` format); "today" instead of "tomorrow" when today's nudge time hasn't passed yet ("Done. Your first idea lands today at 7:45 am.") · VoiceOver: "Kit: Done. Your first idea lands tomorrow at 7:45 am."
- The time row and both buttons are gone for good. The time and the switch are saved, and the next 7 days are scheduled.
- **VoiceOver focus** moves to this line once it shows, so he hears the result (the button he tapped no longer exists). *Change from today:* focus isn't moved.
- **Motion and haptics:** none. **Dark:** token swap. **Largest text:** the line wraps, as every Kit line does.

### Kit's ask · No thanks, or Don't Allow · when: he taps No thanks, or Don't Allow in Apple's prompt · phone 5 · `design/05-light.png`, `design/05-dark.png`
- Kit's name + Kit's bubble · "No problem. You can turn it on later in You → Notifications." (source: spec NT1 "Answers") · VoiceOver: "Kit: No problem. You can turn it on later in You → Notifications." · VoiceOver focus moves to it, as on phone 4.
- Nothing is scheduled. No thanks saves the switch off; Don't Allow leaves iOS's answer as no, so You → Notifications shows phone 10.
- **Change from today:** "You → Settings → Notifications" becomes "You → Notifications" (Settings is now part of You).
- **An earlier day's unanswered card** (in Past chats) shows only its question, Kit's bubble from phone 1 with no footer (as built, `readOnly`). Not drawn.

### Kit's ask · the catch-up for earlier testers · when: a tester who finished setup on the first TestFlight build (no ask was ever posted, and Apple's prompt was never shown) opens Stylist · phone 6 · `design/06-light.png`, `design/06-dark.png`
- Day stamp · `DayStamp` · "Tuesday 8:12 am" (the thread's own stamp, `stampText`, as built) · `footnote` 500 `ink3`, centered · VoiceOver: header.
- Then exactly phone 1's card (Kit's name, bubble, time row, both buttons), posted once at the end of today's thread, with the same answers as phones 2–5. Anything else from today (today's card, his messages) sits above it.
- **Motion, Dark, Largest text:** as phone 1.

### The daily nudge · when: every day at his nudge time · phone 7 · `design/07-light.png`, `design/07-dark.png` (the same picture: always dark)
iOS draws this; Kitted writes only the body line. The frame shows all four lines together for review. He gets one a day.
- Header: the app name "Kitted" and the time (iOS's). **No title** (spec NT2).
- Body, one of:
  - "Today: navy overshirt, grey tee, khaki chinos, white sneakers." (spec NT2 `Today: {item1}, {item2}, {item3}, {item4}.`, lowercase piece names, as many as the outfit has; here the spec's example) · the next nudge, once Kit can suggest outfits. It names the pieces on that day's morning card.
  - "Today's outfit idea is ready." (spec) · the later queued days, once Kit can suggest.
  - "Your closet's big enough now: here's today's idea." (spec) · the first scheduled day on which Kit can suggest, once ever.
  - "Check today's fit. Each one teaches me your closet." (spec) · every day while Kit can't suggest yet (empty closet, or fewer than two outfits that work).
- Default sound. No badge, no image, no actions, no Time Sensitive.
- VoiceOver: iOS's own ("Kitted, {body}").
- tap: opens Kitted at the Stylist tab, scrolled to today's card (posted then if it isn't yet). A tap on an older day's nudge opens today's card too.
- **Change from today:** the lock-screen mockup (`kitted-mockups.html` screen 14) shows three kinds; the beta sends only this one (spec NT2.5).

### You → Notifications · on · when: he opens Notifications from You, with the switch on and iOS allowing · phone 8 · `design/08-light.png`, `design/08-dark.png`
Top to bottom, in VoiceOver's reading order:
- Back · the native stack's back button (iOS 26 glass, chevron only) · VoiceOver: "You", back button (the previous title) · tap: back to You.
- Title · native header title · "Notifications" (`en.ts` `notifs.title`) · `headline`, system · VoiceOver: header.
- Header · `Section` `header` · "One outfit idea a day, 15 minutes before you get dressed. That's all I send." (source: spec NT3) · `subheadline` `ink2`, 4 pt side inset, 4 pt under it · VoiceOver: read as text.
- Rows · `Section` card (`KCard` radius 20 (`radius.cardSmall`), `surface`, 1 pt `line`, the card shadow in light), 1 pt `RowDivider` inset 16 between rows. Page side gutter 16, 12 pt top padding (`SettingsScroll`).
  - Daily outfit idea · `ToggleRow` · "Daily outfit idea" (source: spec; `en.ts` `notifs.idea`) · title `callout` 600 `ink`, row min 44, padding 12 / 16 · the system `Switch`, track `good` when on · VoiceOver: "Daily outfit idea", switch button, on · tap: off → phone 9 (cancels everything scheduled).
  - I get dressed at · `PickerRow` · "I get dressed at" (source: spec NT3) · title `callout` 600 `ink` (hidden from VoiceOver), value `MorphPicker` inline: "8:00 am" in `subheadline` 500 `ink2` with a `chevronDown` 10 `ink2` · VoiceOver: "I get dressed at, 8:00 am", button · tap: opens phone 2's menu (the inline panel, `surface`); a pick saves the time and reschedules all 7 at once.
- No `Fit check ready` row, no `Trial ending` row.
- **Motion and haptics:** the switch's own. The time row appears and hides with no animation (as built).
- **Dark:** token swap; the card loses its shadow and keeps its border.
- **Largest text:** phone 16.
- **Change from today:** the header ("That's all I send. No reminders to open the app."), the time row's title ("Time") and its VoiceOver ("Daily outfit idea time, {time}") change; the `Fit check ready` and `Trial ending` rows go.

### You → Notifications · off · when: after No thanks, or he switched it off · phone 9 · `design/09-light.png`, `design/09-dark.png`
- Back, title, header: as phone 8.
- Daily outfit idea · `ToggleRow`, off · VoiceOver: "Daily outfit idea", switch button, off · tap: on. If Apple's prompt was never shown, it shows now (phone 3's alert over this page): Allow → switch on, the time row shows, all 7 scheduled; Don't Allow → the switch goes back off and the page becomes phone 10. If iOS already allows: on, and all 7 are scheduled.
- The time row is hidden while the switch is off (as built). His time is kept.

### You → Notifications · off in iOS · when: iOS has notifications off for Kitted (he tapped Don't Allow, or turned them off in iOS Settings) · phone 10 · `design/10-light.png`, `design/10-dark.png`
Top to bottom, in VoiceOver's reading order:
- Back, title: as phone 8.
- Off card · `KCard` radius 20, padding 16, 12 pt gap, the first thing on the page, 24 pt above the section:
  - "Notifications are off for Kitted." (source: spec NT3; `en.ts` `notifs.off`) · `callout` `ink` · VoiceOver: read as text.
  - Open Settings · `KButton` secondary regular, left-aligned · "Open Settings" (`en.ts` `common.openSettings`) · VoiceOver: "Open Settings", button · tap: Kitted's page in iOS Settings (`Linking.openSettings()`).
- Header: as phone 8.
- Rows · the same card, **greyed out**: the whole card at `opacity.disabled` (0.4); the switch is disabled and shows its saved value, the time row (shown if the switch is saved on) can't be tapped · VoiceOver: "Daily outfit idea", switch button, on, dimmed; "I get dressed at, 8:00 am", button, dimmed.
- Nothing is scheduled. Coming back to the app with iOS allowing clears the card, un-greys the rows and schedules (the page re-reads the permission when the app returns to the foreground).
- **Dark:** token swap.
- **Largest text:** phone 16.
- **Change from today:** the card and the greyed rows are new to this page (the copy deck had them; the page never showed them).

### The comeback question · when: he opens the app after the 7 scheduled nudges ran out (a week with no visit), with the switch on · phone 11 · `design/11-light.png`, `design/11-dark.png`
- Day stamp · "Tuesday 8:12 am" (as phone 6).
- Kit's name + Kit's bubble · "I paused your daily ideas after a week without a visit. Want them back?" (source: spec NT4) · VoiceOver: "Kit: I paused your daily ideas after a week without a visit. Want them back?"
- Buttons (the footer's row, wraps to two lines at the default size):
  - Turn them back on · `KButton` primary regular · "Turn them back on" (spec) · VoiceOver: "Turn them back on", button · tap: schedules the next 7 days → phone 13.
  - Change the time · `KButton` secondary regular · "Change the time" (spec) · VoiceOver: "Change the time", button · tap: → phone 12.
  - No thanks · `KButton` secondary regular · "No thanks" (spec) · VoiceOver: "No thanks", button · tap: saves the switch off → phone 14.
- Posted once per lapse, at the end of today's thread. Until he answers (or switches it on in You → Notifications), nothing is scheduled. Ignored, it stays answerable.
- **Motion and haptics:** none. **Dark:** token swap.
- **Largest text:** as phone 15: the bubble wraps and the three buttons stack full width, in this order.
- **Change from today:** it replaces the unbuilt "I've sent 3 ideas you didn't open…" card (`unopened.*`).

### The comeback · Change the time · when: he taps Change the time · phone 12 · `design/12-light.png`, `design/12-dark.png`
- Day stamp, Kit's name, Kit's bubble: as phone 11.
- The time row · label "I get dressed at" + the time "8:00 am" (the shared parts above) takes Change the time's place, above the two buttons left.
- Turn them back on · primary · tap: schedules at the time shown → phone 13.
- No thanks · secondary · tap: → phone 14.
- tap the time: phone 2's menu. Picking a time other than the one shown saves it, schedules all 7 and shows phone 13 with the new nudge time.
- **VoiceOver focus** moves to the time ("I get dressed at, 8:00 am") when the row appears.
- **Motion and haptics:** none (the menu's own morph).

### The comeback · back on · when: Turn them back on, a new time, or the switch turned on in You → Notifications while the card is open · phone 13 · `design/13-light.png`, `design/13-dark.png`
- Kit's name + Kit's bubble · "Back on. Next one lands tomorrow at 7:45 am." (source: spec NT4) · "today" when today's nudge time hasn't passed ("Back on. Next one lands today at 7:45 am.") · VoiceOver: "Kit: Back on. Next one lands tomorrow at 7:45 am." · focus moves to it (when answered in the card).

### The comeback · No thanks · when: he taps No thanks on the comeback · phone 14 · `design/14-light.png`, `design/14-dark.png`
- Kit's name + Kit's bubble · "Done. You can turn them on in You → Notifications." (source: spec NT4) · VoiceOver: "Kit: Done. You can turn them on in You → Notifications." · focus moves to it.
- The switch is saved off; You → Notifications then shows phone 9.

### Largest text · Kit's ask (phone 1 at AX5) · phone 15 · `design/15-light.png`, `design/15-dark.png`
- Kit's bubble at `body` AX5 (53 / 64), up to 94% wide; the thread is at its end, so the start of the question (and "Kit") has scrolled up under the header. Nothing is cut or shortened.
- The label at `subheadline` AX5 (49 / 59) on its own line; the time capsule under it (the row wraps), 49 pt, padding 6 / 12.
- Buttons stack full width (03 §5 KButton: side-by-side buttons stack at AX sizes), text capped at 2x (30 pt, `CONTROL_TEXT_MAX_SCALE`), up to two lines and then shrinking to fit (as built).
- The header ("Stylist") and the "Ask Kit…" bar are capped at 2x, as today.

### Largest text · You → Notifications (phone 10 at AX5) · phone 16 · `design/16-light.png`, `design/16-dark.png`
- Scrolled to the end. The off card's line wraps at `callout` AX5 (51 / 61) and Open Settings stretches full width (scrolled off above in the frame).
- The header wraps at 49 / 59.
- Daily outfit idea: its title wraps beside the switch (`ToggleRow` keeps the row). I get dressed at: the row stacks, title then the time under it (`PickerRow` at AX sizes, as built).
- The header title is capped at 2x. Nothing truncates.

## Words
Every string he reads in this task. No NEW strings: every word is the spec's, an existing `en.ts` string, or Apple's.
- "What time do you usually get dressed to head out? I'll send you an outfit idea 15 minutes before." · spec NT1 (replaces `notif.ask`)
- "I get dressed at" · spec NT1, NT3 (replaces `notif.ask.label` "Daily idea at" and `notifs.time` "Time")
- "I get dressed at, {time}" (VoiceOver) · spec NT5.4 (replaces `notifs.a11y.time`; can be `settings.a11y.value` with the label)
- "Send me ideas" · spec NT1 (replaces `notif.ask.yes` "Yes, pick a time"; `notif.ask.set` "Set {time}" goes)
- "No thanks" · spec; `en.ts` `notif.ask.no`
- "Done. Your first idea lands {tomorrow|today} at {time}." · spec NT1 (`notif.ask.done` gains the today form)
- "No problem. You can turn it on later in You → Notifications." · spec NT1 (replaces `notif.ask.later`)
- "Today: {item1}, {item2}, {item3}, {item4}." · spec NT2; `en.ts` `push.idea` (as many pieces as the outfit has)
- "Today's outfit idea is ready." · spec NT2
- "Your closet's big enough now: here's today's idea." · spec NT2
- "Check today's fit. Each one teaches me your closet." · spec NT2
- "Notifications" · `en.ts` `notifs.title`
- "One outfit idea a day, 15 minutes before you get dressed. That's all I send." · spec NT3 (replaces `notifs.header`)
- "Daily outfit idea" · spec; `en.ts` `notifs.idea`
- "Notifications are off for Kitted." · spec; `en.ts` `notifs.off`
- "Open Settings" · spec; `en.ts` `common.openSettings`
- "I paused your daily ideas after a week without a visit. Want them back?" · spec NT4 (replaces `unopened.q`)
- "Turn them back on" · spec NT4 (replaces `unopened.keep`)
- "Change the time" · spec NT4; `en.ts` `unopened.time`
- "No thanks" (comeback) · spec NT4 (replaces `unopened.stop` "Stop for now")
- "Back on. Next one lands {tomorrow|today} at {time}." · spec NT4
- "Done. You can turn them on in You → Notifications." · spec NT4
- Unchanged chrome in the frames: "Kit" (`common.who`), "Stylist" (`stylist.title`), "Ask Kit…" (`composer.placeholder`), the tab names (`tab.*`), the day stamp (`fmt.stampRecent`), the closet card (`plan.*`), the times (`ideaTimeLabel`, `fmt.am` / `fmt.pm`).
- Apple's alert: Apple's words, not ours.
- Removed with no replacement: `notifs.ready` "Fit check ready", `notifs.trial` "Trial ending", `push.trial`, `push.ready` (not sent in the beta; spec "Touches").

## New parts
- **`PickerRow` `disabled`** (`features/settings/SettingsList.tsx`): the time row greyed out on phone 10 (opacity 0.4, not tappable, VoiceOver "dimmed"). `ToggleRow` already has `disabled`; `PickerRow` doesn't.
- **The off card** on phone 10 is a plain `KCard` + `KText` + `KButton`, all existing; no new component.
Nothing else: the ask and the comeback are `StylistMessage` with a footer, the time is `MorphPicker`, the page is `SettingsScroll` / `Section` / `ToggleRow` / `PickerRow`.

## Checked by the designer
- **HIG:** *Notifications* and *Privacy → Requesting permission*: Kit's card says what he gets and when before Apple's prompt, the prompt shows only on his tap, never at launch, and a refusal is respected with the way back in You → Notifications (pass). *Toggles*: a switch for on/off, its row title says what it controls (pass). *Pop-up buttons / menus*: one choice from 17 options in a menu with the current one checked (pass). *Disabled controls* are dimmed and say so to VoiceOver (pass). One notification a day, no marketing (App Review 4.5.4, pass).
- **§C14:** tab bar unchanged, no tab used as an action (pass) · "settings behind a gear": not applicable, `specs/setup-and-you.md` moved Settings into You (founder) · 44 pt targets: buttons 36 visual / 44 hit, the time capsule 32 / 44 with its hitSlop, rows 44+ (pass) · contrast 4.5:1: the label `ink2` on `bg` 5.87 / 8.00, the time `ink` on `surface2` 15.43 / 13.20, the stamp `ink3` on `bg` 4.91 / 6.51, the row value `ink2` on `surface` 6.46 / 7.21 (pass; the dimmed rows on phone 10 are disabled controls, which WCAG exempts) · Dynamic Type to AX5 (phones 15–16, pass) · feedback within 0.1 s: the spinner on Send me ideas (pass) · Back on the pushed page (pass) · notifications utility-only, never "we miss you", asked in context (pass).
- **Design system:** only 03 / `tokens.ts` tokens and existing components, plus `PickerRow` `disabled` above. Copper appears only on the active tab (03 §1.1: it marks nothing here).
- **Hard lines:** no face, body or photo in any frame (no photos at all); no emoji, ranks, streaks, day counts or guilt in any word; Kit is named as Kit; nothing leaves the phone.

## Open questions for the founder
1. **During a lapse, what does the switch in You → Notifications show?** The spec says turning it "back on" there resumes, but the switch is still saved on, so it would already look on. · recommended: **it shows off while paused** (until he answers the comeback), so the page tells the truth and switching it on resumes (and turns the comeback card into its `Back on.` line). · other: it shows on, and simply opening the page while it's on resumes.
2. **The words say "You → Notifications" but today's build has it under You → Settings → Notifications** until T34 (You becomes the settings home) merges. · recommended: **T53 merges after T34**, so the words are true on the testers' phones. · other: ship T53 first and accept a wrong path for one build.
3. **The comeback question when iOS has notifications off.** The spec asks it whenever the switch is on, but Turn them back on can't schedule anything then. · recommended: **don't post the comeback while iOS has them off**; phone 10's card is the way back. · other: post it, and Turn them back on opens phone 10.
4. **Where the comeback and the catch-up sit on the day's thread.** · recommended: **at the end of today's thread, under today's card**, so the outfit comes first and the question second. · other: above today's card.
5. **The ask posts at the same moment as the optional closet card in the beta** (two cards, each with a primary button, one under the other: phone 1). · recommended: **keep it as the spec says** ("right after"). Holding the ask until he answers the closet card could mean it never comes if he ignores that card. · other: post the ask only after the closet card is answered or skipped.
6. **An ignored comeback card on a later day.** The thread starts fresh each day, so an unanswered card moves to Past chats, where cards are read-only. · recommended: **it isn't posted again (once per lapse); Past chats shows only its question, like the ask**; You → Notifications resumes. · other: post it again on each open until he answers.
7. **If scheduling fails on the phone** (rare), the spec has no state. · recommended: **no message**; the next open, foreground or background tries again, since every one of those replaces the schedule. · other: a toast.

## Out of scope
- The Later version of the ask (its words, `Send me nudges`, under onboarding's `No rush.` line) and the first-check reminder: T57 (NT1.8–NT1.10).
- Today's card that a nudge opens: the morning lane (T55), unchanged here.
- The `Notifications` row on You and where it sits: T34 (`specs/setup-and-you.md` SY1).
- "Delete all my data" and the under-18 lock screens: unchanged; this task only cancels and clears behind them (NT5.1, NT5.2).
- `Fit check ready` and any server push: launch (`specs.md` F13).

## Design check (critic)
Written by the critic, round by round.

### Round 1 (Nov 9) · verdict: doesn't match (1 blocker)
Read: CLAUDE.md, `specs/notifications.md`, `specs.md` F13 and first-run step 9, this file, all 32 PNGs, `design.html`, 03 §5, `tokens.ts`, §C14, `pro-rules.md`, and the code it sits in (`NotifyAskCard.tsx`, `Chat.tsx` `StylistMessage`, `MorphPicker.tsx`, `KButton.tsx`, `SettingsList.tsx`, `prefs.ts`, `you/notifications.tsx`, `en.generated.ts`). The frames are 2x (804 px = 402 pt), and the measurements below are in pt.

**Checked and passing.** Every string matches the spec word for word or an existing `en.generated.ts` key (`notif.ask.no`, `notifs.title`, `notifs.idea`, `notifs.off`, `common.openSettings`, `unopened.time`, `push.idea`, `common.who`, `stylist.title`, `composer.placeholder`, `plan.intro`), and nothing contradicts the spec. Contrast, computed from `tokens.ts` (light / dark): `ink2` on `bg` 5.87 / 8.00, `ink3` on `bg` 4.91 / 6.51, `ink` on `surface2` 15.43 / 13.20, `ink2` on `surface` 6.46 / 7.21, `ink2` on `surface2` (menu rows) 5.56 / 6.36, `onPrimary` on `primary` 15.11 / 16.62, and the switch track `good` on `surface` 5.51 / 7.78 (3:1 is needed for a shape). The time menu is 219 pt wide in the frame (`MIN_W` 220), with 44 pt rows and 16 rows visible, and it sits between safe-area top + 16 and the home area − 16 (as built, `MorphPicker.tsx:80–83`). The hit areas are KButton regular at 44 tall, the capsule at 32 + 6/6 `hitSlop`, and the inline picker at 24 + 10/10. All four regular-size layouts fit a 375 pt phone. The hard lines hold: no face, body or photo, no emoji, streak or day count, and copper only on the active tab. Reduce Motion, focus moves and the Back label are all specified.

**Blockers**
1. **You → Notifications before he has ever been asked has no state, and today's default would show it as on.** Kind: blocker (States). Where: phones 8–10, the `Daily outfit idea` switch. What's wrong: `prefs.ts` reads an unset `notify.idea` as on (`parseSwitch`, "Unset means on", lines 88 and 95). A tester who opens You → Notifications before Kit's ask, or after "Delete all my data" (which clears the switch), would see phone 8: the switch on and "I get dressed at 8:00 am" showing, while iOS permission is still undetermined and nothing is scheduled. None of the frames covers that permission state: phone 8 needs "iOS allowing" and phone 10 "off in iOS". The rule it breaks: spec NT3, "Switch on when Apple's prompt was never shown → Apple's prompt", and NT3.3. Both are impossible if the switch already reads on. It also breaks the spec's "Never: a notification at a time he didn't choose" in spirit, because the page would claim a schedule he never set up. Fix: add the state (no new frame needed: it looks like phone 9). While Apple's prompt has never been shown, the switch shows off and the time row is hidden, whatever the stored value. Switching it on shows phone 3's alert over the page: Allow → phone 8, Don't Allow → phone 10. Write in "Where it lives" or phone 9 that the switch shows on only when it is saved on and iOS allows (phone 10's greyed saved value is the one exception). This is the same rule open question 1 recommends for a lapse, so settle both with one line.

**Polish**
1. **The frames draw button rows 8 pt apart, but the build will put them 12–16 pt apart.** Where: phones 1, 3, 6, 11 and 12. The frames' `.btn` is a 36 pt box with nothing around it, so the time row to the buttons measures 8.5 pt (phone 1: capsule bottom 672.5 pt, button top 681 pt). Between the comeback's two button rows it's also 8.5 pt (phone 11: 672.5 → 681). `KButton` regular pads its `Pressable` 4 pt above and below (`KButton.tsx` `paddingVertical: (44 − 36) / 2`), so with `gap: space.s` the build shows **12 pt** and **16 pt**. In build mode that's more than 2 pt off the design, which would count as a false blocker. Fix before approval: either redraw the rows with 44 pt boxes, or write in "Buttons" that the visual gaps are 12 pt (row to buttons) and 16 pt (wrapped rows).
2. **The footer's spacing is described as "6 pt above it",** but `StylistMessage` adds its own `gap: 4` to `NotifyAskCard`'s `paddingTop: 6`. The bubble-to-time-row distance is 10 pt built and about 11 pt in the frame (phone 1: bubble bottom 630.5, row top 641.5). Fix the text to 10 pt.
3. **Kit's name is described as "12 pt under the closet card",** but `StylistMessage` adds `marginTop: 4` when `showHeader`, so it's 16 pt built and about 17 pt in the frame. Fix the text.
4. **Phone 3's spinner button is drawn 4.5 pt narrower** than Send me ideas on phone 1: it's hard-coded at `width:131px` against the real 135.5 pt (phone 1: x 16–151.5). The build locks the real width, as `KButton` `lockedWidth` does and DESIGN says, so the fix is in the frame only.
5. **Phone 10 could end up dimmed twice.** DESIGN dims "the whole card at `opacity.disabled` (0.4)", `ToggleRow` `disabled` already sets 0.4 on its row (`SettingsList.tsx` ToggleRow), and the new `PickerRow` `disabled` is also 0.4. If all three apply, the text sits at 0.16. The frame shows a single 0.4 on the whole card. Pick one and write it down. Recommended: the rows dim themselves (ToggleRow as built, plus the new PickerRow `disabled`) and the card stays at full opacity, so its border still shows in dark. Then match the frame to that.
6. **The opened menu cuts through the "Stylist" title on phone 2.** Its top edge (78 pt, safe area + 16) leaves about 1–3 pt of the title's glyph tops showing above it (frame y ≈ 76–79 pt). This is the as-built geometry, so it's acceptable, but it reads as a rendering slip. It's fine to leave if the founder doesn't mind.
7. **Phone 15 needs a "Change from today" line.** Today `NotifyAskCard`'s button row is `flexDirection: 'row', flexWrap: 'wrap'` and KButton regular is `alignSelf: 'flex-start'`, so at AX sizes the buttons wrap at their own width instead of stacking full width, as phone 15 and 03 §5 require. Add `fullWidth={isAccessibilitySize}` (the pattern in `MorningCard.tsx:217`, `OutfitIdeaCard.tsx:72`) as a named change, for the ask and for the comeback.
8. **The menu on You → Notifications isn't drawn.** It's `PickerRow`'s inline `MorphPicker` (`surface`, grows down from the value), and phone 2 shows only the chat capsule variant. It's an as-built part, so the risk is low. One line in phone 8 saying it is "as in Settings → Appearance" is enough.
9. **Phone 9 doesn't say what the switch shows while Apple's prompt is up.** Recommended: it flips on at once (feedback within 0.1 s), can't be tapped until the answer comes back (as No thanks on phone 3), and goes back off on Don't Allow.

**Suggestions** (optional, for the founder)
1. Phone 12: tapping Change the time could open the menu at once, which saves a tap and is closer to the spec's "the time menu opens in the card". Note too that here a pick commits immediately, while on phone 1 it waits for the button. That's the spec's rule, but the two rows look the same.
2. An unanswered ask card plus the switch turned on in You → Notifications first: the spec only covers this for the comeback card. Recommended: the ask card turns into its done line too. Otherwise a later tap on No thanks would turn off what he just turned on. Worth adding as open question 8.
3. `PickerRow`: only the value "8:00 am ⌄" is tappable, not the whole row. This is as built (Appearance works the same way). Making the whole row the target would match iOS Settings rows.

## Changes

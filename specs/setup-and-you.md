# Setup and You

**Approved by the founder:** 2026-11-09 (SY2.1, SY4–SY6 changed with his yes the same day, to match `specs/onboarding-screens.md`)

After this, a new user learns each feature the moment he reaches it, finds every setting on You without digging, and setup asks his name (optional), checks his age the Apple way and asks for the privacy agreement when he first opens the camera.

**Part of:** `specs.md` → F1 (Onboarding), F9 (You), "First run".

## Why
The founder's first TestFlight use (Nov 8): "The You tab is empty and pointless": for a new user it's a style card, an empty "What Kit knows" and a Privacy row, while the gear opens a whole Settings page for four rows (Plan & usage, Privacy & data again, Appearance, Acknowledgements). He wants You to be the settings home, keeping the name "You" ("Settings" reads as tacky). And "Kitted's users aren't experienced": new users need a guide through the features, not just the first-run setup. Apple's guidelines (HIG → Onboarding) prefer short tips at the moment over a long tour, optional and easy to find again in a settings area; they don't say where an iPhone app's settings must live (HIG → Settings).

## Scope
- **In:** You as the settings home (SY1); the tips (SY2); "Show me around" (SY3); the name field (SY4); the agreement on the first camera open (SY5); Apple's age check (SY6).
- **Out (non-goals):** a swipe tour or any screens before the first check; a guided first check; a "go through setup again" button (to see setup as a new user, delete Kitted and reinstall it from TestFlight); renaming You; a gear or a separate Settings page anywhere; TipKit or any new package for the tips; the notification settings themselves (`specs/notifications.md`); sign-in's rows (`specs/sign-in-and-backup.md`); naming PostHog in the agreement (T33 with T90).
- **For the beta:** SY1–SY3. **Before launch:** SY4–SY6 (SY6 needs the paid Apple team, T80).

## SY1. You is the settings home
One page under the tab name **You**, large title, no button in its header (the gear goes). The separate Settings page goes.

**Top to bottom**
1. The You tip (SY2), on his first visits.
2. **Your style** card, as today: looks in pick order and the basics line; the whole card opens Style profile.
3. **What Kit knows**, as today: up to 4 facts and `See all {n}`; empty: `I'll add what I learn here.`
4. **Today** card, as today (checks and questions left, Check my fit or Re-check). On Pro, the Pro row above it, as today.
5. Rows (grouped list, the Settings page's own rows and behavior):
   - Sign-in's rows first, once sign-in exists (`ACCOUNTS_BUILT`; hidden until then, as today).
   - `Notifications` › (only once notifications are built) · `Appearance` (`System` / `Light` / `Dark`) · `Plan & usage` › with its value (`Kitted beta`, `Free plan`, `Kitted Pro`).
   - `Privacy & data` ›.
   - `Subscription`: `Manage subscription` · `Restore purchases`, only while the paywall is on, as today.
   - `Help & about`: `Show me around` (SY3) · `Report a wrong score` · `Contact support` · `Privacy policy` · `Terms of use` (each of those four only once its address is set, as today) · `Acknowledgements` ›.
6. The version line, as today: `Kitted {version} ({build}) · Scoring v{n}`.

The pages these rows open (Plan & usage, Notifications, Privacy & data, Acknowledgements) don't change; their Back reads `You`. The old Privacy & data card on You goes: Privacy & data shows once, in the rows.

## SY2. Tips at the moment
Short tips in Kit's voice, each shown where it applies, each with a `Got it` button. A tip shows on every visit until he taps `Got it`, then never again (unless "Show me around", SY3). Nothing shows before his first check, and no tip ever covers a score, a fix or a button.

| Tip | Where and when | Words (approved Nov 8) |
|---|---|---|
| Kit's hello | Kit's first chat message at the end of setup, in place of today's AI note (it keeps the note word for word). Once per setup. | `I'm Kit, your stylist. Here's how this works:` / `· Send me a photo of your fit. I'll score it out of 10 and give you the fix that raises it.` / `· Ask me anything about clothes, like what to wear to a career fair.` / `· Every fit check adds your pieces to Closet, so my ideas get better.` / `Quick note: I'm an AI. I read clothes, never faces, and I can get things wrong. Tell me when I do.` |
| First score | Under the score card of his first scored check, in the chat. Also goes once he re-checks that fit. | `Do one of the fixes, then tap Re-check and I'll score it again.` |
| Closet | At the top of Closet, on visits once it has at least one piece (the empty Closet already explains itself). | `Every fit check adds its pieces here. Tap a piece to fix its name or color.` |
| Lookbook | At the top of Lookbook, on visits once it has at least one look (the empty Lookbook already explains itself). | `Every fit you check lands here with its score and fixes. Tap one to see it again.` |
| You | At the top of You. | `Your style and what I've learned about you, plus your settings. Change your looks any time.` |

The button on each card tip: `Got it`.

## SY3. Show me around
The `Show me around` row in You → Help & about:
1. Every tip comes back (as if never dismissed).
2. The app switches to Stylist and Kit's hello (SY2, the same words) posts as the newest message in today's chat, unless it already is the newest message.
3. From there the tips show as he reaches each place; the first-score tip shows under his **next** scored check, not an old one.

## SY4. The name (before launch)
- On setup's About you step (`specs/onboarding-screens.md` OS4), above `How old are you?`: the label `What should Kit call you?` and a text field with the placeholder `First name (optional)`. No Skip button: a blank field is skipping, and `Continue` waits only on the age pick.
- Trimmed; up to 30 characters **(assumed)**; blank means no name.
- Style profile → Basics gets a `Name` row to change or clear it (the same placeholder).
- Used only in code-written lines (F1.5); never sent to Google, OpenAI or PostHog; Kit's AI answers never say it. Signing in with Apple fills an empty one with Apple's first name (F1.4, built with sign-in).

## SY5. The agreement on the first camera open (before launch)
- Setup has no agreement step: Welcome → Looks → About you → Stylist (`specs/onboarding-screens.md` OS5): Kit's hello, then Kit's offer card. The camera never opens on its own; the agreement shows on top of the camera the first time he opens it (Check my fit, or the chat's camera button). Same words and buttons as today's agreement step (`Agree & check my fit`, `Not now`, `See an example first`).
- `Agree & check my fit` → the camera, live. `Not now` → Stylist with the "Turn on fit checks" card, as today.
- Nothing is sent anywhere before he agrees (F1.3).

## SY6. Apple's age check (before launch)
- When he taps `Continue` on About you with an age band of 18 or older, Apple's age-range sheet asks to share his age range (never his birthday).
- Apple says 18+ → setup goes on. Apple says under 18 → the age stop, as today (no camera, kept through a reinstall).
- He declines, his iPhone can't answer, or it fails → the age band he picked decides; setup goes on.
- `Under 18` → the confirm and stop (`specs/onboarding-screens.md` OS4), with no Apple sheet.

## Rules
- A tip's "done" mark is kept on this iPhone only; it isn't backed up. "Delete all my data" clears them, so every tip shows again.
- An install that finished setup before this update still sees the tips it hasn't dismissed; Kit's hello isn't posted for it (it belongs to setup's end; "Show me around" posts it on request).
- A link anywhere in the app that opened the Settings page now opens You.

## Data
- New: one "done" mark per tip (Closet, Lookbook, You, first score) in the phone's key-value store; nothing new on the server.
- New (SY4): `name` on his profile, optional text; never in any request to the server.
- Kit's hello is an ordinary Kit chat message.

## Acceptance criteria
**SY1. You is the settings home**
- SY1.1 You's header has no gear or other button; the Settings page no longer exists, and every place that linked to it opens You.
- SY1.2 You shows, in order: style card, What Kit knows, Today, the rows of SY1 step 5 (each shown only under its stated condition), then the version line.
- SY1.3 Each row does exactly what the Settings page's row did: same page, same value, same Appearance choice saved; Back from each page reads `You`.
- SY1.4 `Privacy & data` appears exactly once on You.
- SY1.5 The ScrollView is You's first view, so the iOS tab bar shrinks on scroll.
- SY1.6 Light, dark and the largest text size: nothing clipped, no word broken mid-word; VoiceOver reads each row as a button with its value.

**SY2. Tips**
- SY2.1 A new setup's end (About you's Continue) posts Kit's hello with exactly the approved words, once, above Kit's offer card, and no separate AI note.
- SY2.2 The first-score tip shows under the first scored check's card only; `Got it` removes it for good (it stays gone after closing and reopening the app); re-checking that fit also removes it.
- SY2.3 The Closet tip shows at the top of Closet while it has at least one piece and the tip isn't done; never on the empty Closet. `Got it` removes it for good.
- SY2.4 The Lookbook tip: the same, with at least one look.
- SY2.5 The You tip shows at the top of You until `Got it`, then never again.
- SY2.6 An install that finished setup before this update shows the tips (not yet done) and no Kit's hello.
- SY2.7 "Delete all my data" clears every tip's done mark.
- SY2.8 Every tip's words are exactly the approved ones; `Got it` is at least 44 × 44 pt; VoiceOver reads the tip's words, then `Got it` as a button.
- SY2.9 No tip shows on the camera, during a check being read, or on top of a score card.

**SY3. Show me around**
- SY3.1 Tapping it clears every tip's done mark, switches to Stylist and posts Kit's hello as the newest message in today's chat.
- SY3.2 Tapping it again while Kit's hello is still the newest message posts no second copy.
- SY3.3 Afterwards the first-score tip shows under the next scored check and under no older one; the Closet, Lookbook and You tips show on their next visit.

**SY4. The name**
- SY4.1 The About you step shows `What should Kit call you?` with `First name (optional)` above `How old are you?`; `Continue` is enabled with an age picked and a blank name.
- SY4.2 A name is saved trimmed, at most 30 characters; spaces only means no name.
- SY4.3 Style profile → Basics changes or clears the name; clearing it changes the greetings back (F1.4).
- SY4.4 No request to the server (fit check, question, any other) carries the name (a test over every request builder).

**SY5. The agreement**
- SY5.1 Setup has no agreement screen; the camera never opens on its own; the first time he opens it, the agreement is on top.
- SY5.2 `Agree & check my fit` starts the camera; `Not now` lands in Stylist with the "Turn on fit checks" card; before Agree, nothing is sent (F1.3).

**SY6. Apple's age check**
- SY6.1 An age band of 18+ and Apple says 18+ → setup goes on; Apple says under 18 → the age stop, no camera.
- SY6.2 Declined, unavailable or failed → the picked age band decides and setup goes on.
- SY6.3 `Under 18` → the confirm and stop, with no Apple sheet.

## Touches
- SY1: `app/src/app/(tabs)/you/{_layout,index,settings}.tsx`, `app/src/features/{you,settings}`. Must keep Notifications (the beta-notifications session's screen, `you/notifications.tsx`), Plan & usage, Privacy & data and Acknowledgements working, and the beta's Plan row (FP7).
- SY2–SY3: `app/src/features/onboarding/complete.ts` (Kit's hello), the chat's score card, Closet's and Lookbook's tab screens, a small tips module, `en.ts`.
- SY4: onboarding's About you step, Style profile, `data/types.ts`, the request builders' tests.
- SY5: onboarding's agreement step and the camera's first open.
- SY6: onboarding's About you step and a native module (Declared Age Range; T80's paid team).

## Assumptions
- A name holds at most 30 characters (long enough for any first name; keeps greetings on one line).
- A tip stays on every visit until `Got it`; it never times out on its own.
- Tips aren't backed up with sign-in: a new phone shows them again.

## Later
- A help page listing every feature with "Show me" (the other "Show me around" option).
- More tips as features land (the morning card, asking Kit by voice).

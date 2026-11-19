# Setup and You

**Approved by the founder:** 2026-11-09 (SY2.1, SY4–SY6 changed with his yes the same day, to match `specs/onboarding-screens.md`). SY2–SY3 rewritten 2026-11-10 with his yes (direction A, `tasks/T36/`); SY2's badge color and the slide's start changed the same day with his yes (#439)

After this, a new user learns Stylist and Closet by doing his first fit check and seeing his pieces land in Closet, finds every setting on You without digging, and setup asks his name (optional), checks his age the Apple way and asks for the privacy agreement when he first opens the camera.

**Part of:** `specs.md` → F1 (Onboarding), F9 (You), "First run".

## Why
The founder's first TestFlight use (Nov 8): "The You tab is empty and pointless": for a new user it's a style card, an empty "What Kit knows" and a Privacy row, while the gear opens a whole Settings page for four rows (Plan & usage, Privacy & data again, Appearance, Acknowledgements). He wants You to be the settings home, keeping the name "You" ("Settings" reads as tacky). And "Kitted's users aren't experienced": new users need a guide through the features, not just the first-run setup. Apple's guidelines (HIG → Onboarding) prefer short tips at the moment over a long tour, optional and easy to find again in a settings area; they don't say where an iPhone app's settings must live (HIG → Settings).

**Nov 10:** the first build of the guide (#95, closed unmerged) had Kit's hello as a "Here's how this works:" list and a `Got it` card on top of Closet, Lookbook and You. The founder: "The way the chat is giving the user bullet points, if it were me, I'd think it was low quality as hell." The research (`tasks/T36/research.md`): Apple says people should understand an app "simply by experiencing it" and to prefer "animation or graphics to educate instead of a lengthy description" (HIG → Onboarding, Offering help); NN/g finds tutorials "are quickly forgotten" and overlays dismissed unread; a tip with nothing to do isn't a tip (TipKit, WWDC23). He picked direction A of three drawn (`tasks/T36/design/`): the pieces slide into Closet, with no words to read.

## Scope
- **In:** You as the settings home (SY1); Kit's hello and the slide into Closet (SY2); the name field (SY4); the agreement on the first camera open (SY5); Apple's age check (SY6).
- **Out (non-goals):** a swipe tour or any screens before the first check; a guided first check; tips or `Got it` cards anywhere; any Kit line that explains a feature, and any list in a Kit message; suggestion chips outside the opened composer; a Lookbook badge; "Show me around" (SY3, removed); a "go through setup again" button (to see setup as a new user, delete Kitted and reinstall it from TestFlight); renaming You; a gear or a separate Settings page anywhere; TipKit or any new package; the notification settings themselves (`specs/notifications.md`); sign-in's rows (`specs/sign-in-and-backup.md`); naming PostHog in the agreement (T33 with T90).
- **For the beta:** SY1–SY2. **Before launch:** SY4–SY6 (SY6 needs the paid Apple team, T80).

## SY1. You is the settings home
One page under the tab name **You**, large title, no button in its header (the gear goes). The separate Settings page goes.

**Top to bottom**
1. **Your style** card, as today: looks in pick order and the basics line; the whole card opens Style profile.
2. **Today** card, as today (checks and questions left, Check my fit or Re-check). On Pro, the Pro row above it, as today.
3. Rows (grouped list, the Settings page's own rows and behavior):
   - Sign-in's rows first, once sign-in exists (`ACCOUNTS_BUILT`; hidden until then, as today).
   - `Notifications` › (only once notifications are built) · `Appearance` (`System` / `Light` / `Dark`) · `Plan & usage` › with its value (`Kitted beta`, `Free plan`, `Kitted Pro`).
   - `Privacy & data` › (it holds `What Kit knows`: a row opening the list of saved facts, each with its source and removable, as the list was before).
   - `Subscription`: `Manage subscription` · `Restore purchases`, only while the paywall is on, as today.
   - `Help & about`: `Report a wrong score` · `Contact support` · `Privacy policy` · `Terms of use` (each of those four only once its address is set, as today) · `Acknowledgements` ›.
4. The version line, as today: `Kitted {version} ({build}) · Scoring v{n}`.

The pages these rows open (Plan & usage, Notifications, Privacy & data, Acknowledgements) don't change; their Back reads `You`. The old Privacy & data card on You goes: Privacy & data shows once, in the rows.

## SY2. Learning by doing: Kit's hello, and where the pieces go
No tour, no tips, no `Got it` cards. He learns Stylist by doing his first check, and Closet by seeing his pieces land there.

**Kit's hello.** At setup's end (About you's `Continue`), Kit's first message is `I'm Kit, your stylist.`, above Kit's offer card (`specs/onboarding-screens.md` OS5). Today's AI note goes: the agreement says `Kit, your stylist, is an AI.` and shows before his first check or question, and Kit says so plainly when asked (F5.1).

**The slide into Closet.** When a scored check or re-check adds pieces to Closet:
1. As the card lands, small pictures of the pieces lift off and slide into the Closet tab: from the `Added {n} to Closet` row when it shows, otherwise from the card's bottom edge (a folded card, a re-check card). They go a few hundredths of a second apart, shrinking and fading as they reach it, in about 0.6 s, with a light haptic. Nothing is drawn: no line, no trail.
2. Then the Closet tab shows a badge: how many pieces checks have added since he last opened Closet.
3. Opening Closet clears the badge.
- Only Closet gets a badge, never Lookbook.
- The badge is navy: the `primary` token in light and the `me` token in dark (his chat bubbles' navy), with iOS's white number; never Apple's red.
- Nothing slides and the badge doesn't change when a check adds no new piece (all of them already in Closet), fails, is refused or isn't scored.
- The slide plays only while the card is on screen as it lands; otherwise the badge alone. With Reduce Motion on: the badge alone.
- Pieces he adds himself (the starter list, Closet's +, a scan) don't slide and aren't counted.

**His first visit to Closet after his first check** (once):
- The pieces that check added come first, under the section label `From your first check`, each with a small `New` mark. The rest of Closet is as it is.
- Once he leaves Closet (another tab, or the app closes), the label and the marks are gone for good. Later checks get the slide and the badge, never the label or the marks.

Words approved Nov 10: `I'm Kit, your stylist.` · `From your first check` · `New`. VoiceOver hears the row's own `Added {n} to Closet` and the tab's badge as Apple reads it; each new piece reads `New, {piece name}`.

## SY3. Show me around (removed Nov 10)
Removed with the tips: there's nothing left to replay. Help & about has no `Show me around` row.

## SY4. The name (before launch)
- On setup's About you step (`specs/onboarding-screens.md` OS4), above `How old are you?`: the label `What should Kit call you?` and a text field with the placeholder `First name`, focused with the keyboard up. `Continue` waits for a name and an age; a small `Skip` under it goes on without a name (the founder, Nov 18, #506, replacing "No Skip button": the name stays optional, as Apple 5.1.1(x) requires, but skipping it takes a deliberate tap).
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
- The badge count, the time Closet was last opened and the first-visit mark are kept on this iPhone only; they aren't backed up. "Delete all my data" clears all three, so his next first check gets the label and marks again.
- An install that finished setup before this update never sees the label or the marks (its first check is behind it); the slide and the badge work for it. Its old AI-note message shows Kit's new hello words.
- A link anywhere in the app that opened the Settings page now opens You.

## Data
- New, on the phone only (the key-value store; nothing new on the server): when Closet was last opened; the first-visit mark (waiting from setup's end, then the first adding check's id, then done).
- New (SY4): `name` on his profile, optional text; never in any request to the server.
- Kit's hello is an ordinary Kit chat message.

## Acceptance criteria
**SY1. You is the settings home**
- SY1.1 You's header has no gear or other button; the Settings page no longer exists, and every place that linked to it opens You.
- SY1.2 You shows, in order: style card, Today, the rows of SY1 step 3 (each shown only under its stated condition), then the version line. What Kit knows is not on You: it is a row in Privacy & data's first section, next to `See what I send`, opening the same list (Back reads `Privacy & data`).
- SY1.3 Each row does exactly what the Settings page's row did: same page, same value, same Appearance choice saved; Back from each page reads `You`.
- SY1.4 `Privacy & data` appears exactly once on You.
- SY1.5 The ScrollView is You's first view (the large title collapses with it). The tab bar never shrinks on scroll, here or on any tab (founder, Nov 12).
- SY1.6 Light, dark and the largest text size: nothing clipped, no word broken mid-word; VoiceOver reads each row as a button with its value.

**SY2. Kit's hello, and where the pieces go**
- SY2.1 A new setup's end (About you's `Continue`) posts Kit's hello as exactly `I'm Kit, your stylist.`, once, above Kit's offer card, with no AI note; no Kit message anywhere lists features or uses bullets.
- SY2.2 A scored check or re-check that adds n new pieces, with its card on screen as it lands: the pictures slide from the card's `Added {n} to Closet` row when it shows, otherwise from the card's bottom edge (a folded card, a re-check card), into the Closet tab in about 0.6 s with a light haptic and nothing drawn, then Closet shows the badge.
- SY2.3 The badge is the number of pieces checks added since Closet was last opened (checks adding 4, then 2 → 6); opening Closet clears it; it's the same after closing and reopening the app.
- SY2.4 No slide and no badge change for a check that adds no new piece, a failed, refused or unscored check, or pieces he added himself.
- SY2.5 Reduce Motion on, or the card off screen as it lands: no slide; the badge still shows.
- SY2.6 Lookbook never shows a badge.
- SY2.7 The badge uses `primary` in light and `me` in dark, with white digits at least 4.5:1 in both, never the system red.
- SY2.8 His first visit to Closet after his first adding check: those pieces first, under `From your first check`, each marked `New`; after he leaves Closet and comes back, neither shows again; a later check's pieces never get them.
- SY2.9 An install that finished setup before this update: no label or marks ever; the slide and the badge work; the old AI-note message reads `I'm Kit, your stylist.`
- SY2.10 "Delete all my data" clears the badge, the last-opened time and the first-visit mark.
- SY2.11 VoiceOver: the row reads `Added {n} to Closet`; each new piece reads `New, {piece name}`; the label reads as a heading.

**SY4. The name**
- SY4.1 The About you step shows `What should Kit call you?` with `First name` above `How old are you?`; with an age picked and a blank name, `Continue` is off and `Skip` goes on without a name.
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
- SY2, Stylist: `onboarding/complete.ts` and `en.ts` (Kit's hello), the card's closet row (`design-system/components/CardParts.tsx`), the slide (a small overlay over the tabs), the tab badge (`app/(tabs)/_layout.tsx`).
- SY2, Closet: `app/(tabs)/closet/index.tsx` and `features/closet` (the label, the `New` marks, clearing the badge), `privacy/wipe.ts`'s list of phone-only marks, `sync/schema.ts` (phone-only).
- SY4: onboarding's About you step, Style profile, `data/types.ts`, the request builders' tests.
- SY5: onboarding's agreement step and the camera's first open.
- SY6: onboarding's About you step and a native module (Declared Age Range; T80's paid team).

## Assumptions
- A name holds at most 30 characters (long enough for any first name; keeps greetings on one line).
- The badge counts pieces since Closet was last opened, not since the last check.
- "Leaves Closet" means another tab or the app closing; a sheet opened from Closet (a piece's page) is still Closet.
- The slide's landing point is worked out from the tab bar's width (4 equal tabs), since the app can't ask iOS where the Closet tab is; a miss of a few points is hidden by the fade.

## Later
- The same slide for other things that land somewhere (a look saved to Lookbook), if Closet's earns it.
- Measure the second check within 7 days (with PostHog, T91), not "finished the intro".

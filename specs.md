# Kitted: the launch blueprint

A chat-first stylist iOS app for guys 18–30: send an outfit photo, get a fit score out of 10 with a word and the fix that raises it, and the app learns your closet as you go.

*This is what the App Store launch is. It changes only for a big change, and only after the founder says yes in chat. Status lives in `plan.md`, never here. Feature detail lives in `specs/<feature>.md`; until those exist, in the `handoff/` docs, and where they disagree with this file, this file wins. Marked **(assumed)**: filled in from the docs, not confirmed in the interview.*

## Goal
Guys who aren't into fashion don't know if an outfit works or what one change would fix it, and ChatGPT gives a different answer every time. Kitted gives a steady score from fixed rules, the one fix that raises it, and outfit ideas from the clothes he already owns.

**Positioning line:** "Look put together. Without trying too hard."

## The launch
**Done when:** the app is live on the US App Store, 18+, with every feature below passing its criteria, and both launch bars met.

**Must do well:** a score he trusts and a fix that works. When there's a trade-off, this wins.

**Launch bars:**
- **The fix works:** on at least 20 real before/after pairs (real people, a fix the card suggested, then a new photo), the re-check raises the score on 18 or more.
- **The score is fair:** on at least 40 real photos of real people (CLAUDE.md rule 6), the founder and one friend aged 18–22 rate each outfit blind. Kitted lands within 1 point of their average on 8 in 10, and no outfit both rate 7.5+ scores under 6.5. Reported per age band and per picked look.

**Working at 60 days** (keep going): subscribers' revenue after Apple's cut covers the whole AI bill, and at least 4 in 10 new users get a re-check that goes up during their free checks.

## Users
- **Who:** guys 18–30, beginners at style: college, first job, dates.
- **Anyone may use it.** Marketing speaks to adults only, never high school.
- **Not for:** under-18s (blocked), users outside the US (not listed), anyone wanting their face, body or looks rated.

## Non-goals (not at launch, on purpose)
- Android, iPad layouts, a web app, any store outside the US.
- Scoring womenswear (dresses, skirts, heels): "not rated yet".
- Faces, bodies, weight, skin, haircuts, grooming, fitness or dating advice.
- Email sign-in (Apple and Google only).
- A free trial of Pro, a lifetime plan, a weekly plan, Family Sharing, a founding offer **(assumed)**.
- The two-shot check, the drawn figure, "Should I buy this?", fitting-room mode, accessories in the score (all under Later).
- RPG ranks, XP, anime theme, emoji, daily streaks, "unlimited", "AI stylist".

## How a fit check works
**"The AI sees, the code judges, the AI explains."**
1. **On the phone:** fix orientation, strip location data, check quality. His photo is saved as he took it. A copy with every face blurred is made for sending; if the head can't be found, nothing is sent.
2. **The vision model** (Gemini, behind `ReadingSource`) only describes the clothes. It never gives a number.
3. **The code** (`@kitted/core`, matching the Python engine in `extraction-test/` exactly) computes every score and number. Same photo, same score. The rules in plain words: `rubric/v5-styles.md`.
4. **The text model** puts the result into words. Every number it says is checked against the computed one.

**Score words**, always with the number, never color alone: 5.5 and under Needs a fix · 6–6.5 Getting there · 7–7.5 Put together · 8–8.5 Sharp · 9+ Dialed in.

## Core flows

### First run
1. Welcome ("See an example check" shows a real scored card, nothing sent).
2. Tap up to 3 looks he'd wear, in order.
3. Name and birth year: "What should Kit call you?" (first name, optional, Skip; draft copy) above the birth year (the wheel starts blank). Under 18: a polite stop. Plus Apple's Declared Age Range.
4. Consent, shown when he first opens the camera: names Google (photos), OpenAI (questions) and PostHog (usage counts), says what's sent and kept, and says Kit is an AI.
5. First fit check → result, with Re-check or Later.
6. The optional closet step ("Tap the clothes you already own").
7. The soft upgrade page (skippable from the first frame).
8. The notification ask, only after "Yes, pick a time".
- **Way back:** onboarding has Back; every camera, sheet and paywall has a visible X or Done from the first frame. Closing mid-setup reopens on the step he reached.

### A fit check
Stylist → camera (propped with 3-2-1 auto-capture, mirror, or a library photo) → the reading card → the score card (score, word, fixes with what they raise, "Why 7.5?", "Not quite right?") → the pieces land in Closet (Undo).

### Free checks running out
Check 1 → the soft page ("6 free checks left") → any day, a second check → the limit card with "Save for tomorrow" and an upgrade button → check 8 → the full paywall, the photo saved and scored at once if he subscribes.

### Sign-in (optional)
Offered on Welcome ("I already have an account"), in one chat card after he's seen his first fit, once more after 3 more checks, and in You **(assumed: as built)**. Never before the first score, never a pop-up.

## Features

### F1. Onboarding
The first run above, 6 taps to the first check. Goal, boldness and fit are asked later by Kit, when they change an answer. New users learn each feature from a short tip the first time they reach it, never a tour before the first check (`specs/setup-and-you.md`).
- F1.1 A fresh install reaches the camera in 6 taps or fewer, with no account and no paywall on the way.
- F1.2 The birth-year wheel starts blank; a year making him under 18 shows the stop screen and no camera; Declared Age Range under 18 does the same.
- F1.3 Nothing is sent anywhere before consent is agreed; a photo taken before consent is kept and scored after Agree.
- F1.4 The name is optional: skipping it changes nothing but the greetings ("Morning." instead of "Morning, Alex."). If he signs in with Apple and gave no name, Apple's first name fills it.
- F1.5 His name is used only in code-written lines (the morning and evening greeting, a few card lines). It is never sent to Google, OpenAI or PostHog, and Kit's AI answers never say it. He can change or clear it in You → Style profile.

### F2. The fit check
Photo → reading → code score → words, as above.
- F2.1 The same photo sent twice gets the same score, and the second doesn't use a check.
- F2.2 Only the face-blurred copy leaves the phone; with no head found, nothing is sent and the card says why.
- F2.3 "Taking longer…" at 9 s; give up at 14 s with a retry; a failed check never uses a check.
- F2.4 Nothing is saved to Closet or Lookbook until the reading says he's clothed.
- F2.5 Traditional clothing and womenswear pieces are "not rated"; a check where nothing can be rated doesn't count. Line: "I'm built for menswear for now, so I can't score this fairly." (draft)
- F2.6 A partial photo (no shoes) never loses points for what's missing, says so in words, and offers one way to finish (a shoe snap or a pick from Closet). Skip means he's never asked again for that check.
- F2.7 Every card has at least one free fix whenever any fix exists.

### F3. Re-check
One re-check per check, open 30 minutes (his first-ever check: until the 4 am reset).
- F3.1 Meets the "fix works" launch bar.
- F3.2 Pieces he didn't change keep their first reading.
- F3.3 When the photo can't show the fix, "I did make the change" scores from what he says, and the card says so ("Scored from what you told me.").

### F4. "Not quite right?"
He corrects a piece the app read wrong; it re-scores at once.
- F4.1 A correction changes only that check (and that piece in Closet), and the card shows the new number before Save.

### F5. Kit (questions)
Kit answers about clothes, shoes, accessories, fit, care and shopping, using his looks, his fit if given, what he told Kit and his closet as words, never a photo.
- F5.1 The first chat message says Kit is an AI; asked, Kit says so plainly.
- F5.2 Off-topic questions (haircuts, grooming, fitness, dating) get a short friendly decline, and don't count: "I stick to clothes. Ask me what to wear to it." (draft)
- F5.3 Kit never comments on his face, body, weight or skin.
- F5.4 Offline: "You're offline, so I couldn't answer that. It doesn't count."

### F6. Morning and evening card
Once a day Kit posts an outfit from his closet with the weather, greeting him by name if he gave one ("Morning, Alex."); from 5 pm an evening card ("Evening, Alex. Heading out?"). Wear this · Swap one · "Wearing something else? Check it".
- F6.1 Location is approximate, asked inside the card, never stored; declined, the card uses the season.
- F6.2 Until Kit knows two different outfits of his that work (e.g. 2 tops, 1 bottom, 1 pair of shoes), the card suggests no outfit and says why: "Send me today's fit and I'll start learning your closet." with no pieces, "I only know {n} of your pieces. Check today's fit and I'll learn the rest." with some. Once he checks a fit in that window, the card reads "Today's fit" ("Tonight's fit" in the evening) with his score; "You went with your own" is only for a card that suggested an outfit. (Founder, Nov 9.)
- F6.3 Under 50°F the outfit includes a warm layer, or says nothing warmer is in his closet.

### F7. Closet
Pieces (head-to-toe sections), Outfits, Starter essentials, Next best buy, the piece page, and **scan clothes** (Closet + → photograph clothes laid flat; they become pieces).
- F7.1 Every piece from a fit check lands in Closet, with Undo.
- F7.2 A scan reads each piece into Closet; a scan with no clothes, a person, or too dark says so and saves nothing.
- F7.3 Scans never use a fit check or a question; up to 30 scan photos a day, free and Pro alike **(assumed)**.
- F7.4 Changing what a piece is never changes a past score.
- F7.5 Tiles are code-drawn pictures; his photos appear only as evidence, never above the neck.

### F8. Lookbook
Every past check with its photo, score and fixes; a look's page; "Show in chat".
- F8.1 Past scores stay visible forever, free, never blurred.

### F9. You
The settings home, named You, with no gear and no separate Settings page (`specs/setup-and-you.md`): Style profile (name, looks 1·2·3, fit), What Kit knows (each fact with its source, removable), today's checks, then the settings rows: Notifications, Appearance, Plan & usage, Privacy & data ("See what I send" shows the real blurred copy; "Delete all my data"), and Help & about with "Show me around".
- F9.1 "Delete all my data" (and "Delete account and all data" when signed in) removes everything on the phone and on our server, with no way back.
- F9.2 Picked looks change the order of fixes and advice, never a score.

### F10. Free checks, Pro and the paywall
- **Free:** 7 free fit checks (each with its re-check), at most 1 a day, used whenever he likes. Then new checks need Pro. 3 questions a day, forever. Everything that runs on code (scores, fixes, Closet, Lookbook, outfit ideas, share cards) stays free forever.
- **Pro:** $9.99 a month or $39.99 a year. **No free trial.** "Up to 5 fit checks and 30 questions a day."
- **When he sees it:** the soft page after his first result; the upgrade button on the limit card when he tries a second check in a day; the full paywall when he tries an 8th check.
- F10.1 Free checks are counted on our server against the phone's Keychain ID and his account; deleting and reinstalling doesn't reset them.
- F10.2 The paywall's X and "Continue free" show from the first frame; Restore Purchases is on it.
- F10.3 A photo taken past the limit is kept ("Save for tomorrow" or held), never sent until he taps.
- F10.4 Never "unlimited"; never charge to see a score; never blur a result.
- F10.5 A failed purchase: "That didn't go through. Nothing was charged."
- F10.6 A lapsed Pro user is back on free rules with all his data.

### F11. Sign-in and backup
Optional. Continue with Apple or Google. Signed in, his scores, closet, style profile and what Kit knows sync through Firebase. **Photo backup** is a separate switch, off by default: "Your photos are stored as you took them. Only you can see them." (draft)
- F11.1 The app works fully without an account.
- F11.2 On a new phone, signing in brings back his checks, scores, closet and profile; photos too if backup was on.
- F11.3 An account with existing fits on a phone with its own fits asks: Keep both / Use the account's **(assumed: as built)**.
- F11.4 Backed-up photos are readable only by his account (security rules tested).
- F11.5 Sign out keeps his fits on the phone **(assumed)**.

### F12. Share cards
Neck-down by default ("Neck down | Full photo"), never gated, a small "scored by Kitted" mark. Save to Photos needs the add-only photo permission.
- F12.1 The default share image shows nothing above the neck.

### F13. Notifications
Two kinds, both local: the daily outfit idea at the time he picks, and "fit check ready". Asked only after "Yes, pick a time". Never "we miss you", never streak guilt. ("Trial ending" is gone with the trial.)
- F13.1 Until the card can suggest outfits (F6.2), the daily notification asks for a fit check instead: "Check today's fit. Each one teaches me your closet." The first one after it can suggest says so: "Your closet's big enough now: here's today's idea." (Founder, Nov 9.)

### F14. Voice input
The mic in the ask bar; speech turns into text on the phone; audio never leaves it.
- F14.1 The words show while he talks, stop after a short pause, and wait in the box for him to send.

### F15. The spend cap and the abuse guard
- F15.1 A daily AI spend cap in server config (start $25), changeable in under a minute without a release.
- F15.2 When it's hit, new free checks pause until 4 am with an honest card and the photo saved; Pro keeps working; the founder gets an alert.
- F15.3 The server answers only the real app (App Check / App Attest).

### F16. Analytics
About 15 named events to PostHog (e.g. first check, re-check went up, free checks used up, paywall seen, subscribed, shared) with a random ID.
- F16.1 No event carries a photo, a question's words, his name, his birth year or his location.
- F16.2 The 60-day success numbers can be read from it.

## Data
| Thing | What matters | Lives where | Kept how long |
|---|---|---|---|
| His photos | as taken, location stripped | the phone + its iCloud backup; our Storage only if photo backup is on | until he deletes them |
| Face-blurred copy | the only image sent | Google (Gemini) | up to 55 days (Google's abuse checks; no training) |
| Fit checks | reading, score, fixes, occasion, look | the phone; Firestore if signed in | until deleted |
| Closet pieces | kind, color, fit, cut-out, wears | the phone; Firestore if signed in | until deleted |
| Style profile, what Kit knows | name (optional), looks, fit, facts with sources; the name is never sent to the AI | the phone; Firestore if signed in | until deleted |
| Questions to Kit | text + closet as words | OpenAI | up to 30 days (abuse checks; no training); never by us |
| Usage counts | free checks used, today's checks and questions, Pro status | our server, by device ID (+ account) | while the app is used |
| Spend | today's AI spend | our server | rolling |
| Events | named events, random ID | PostHog | PostHog's retention |
| Location | approximate, for weather | sent to the weather service only | never stored |

## Failure and edge cases
| Situation | What happens | What he sees |
|---|---|---|
| No network | nothing sent, nothing counted | an offline line; the photo kept |
| Head not found | nothing sent | "I couldn't find your face to blur it, so I didn't send it. Get your head in the shot and try again." |
| AI slow / down | 9 s note, 14 s give up | "Taking longer…", then retry; not counted |
| Not clothed | nothing saved | a plain retake card |
| Nothing ratable | not counted | "not rated" line (F2.5) |
| Second check in a day | photo kept | limit card + "Save for tomorrow" + upgrade |
| Free checks used up | photo kept | the full paywall |
| Server says used, phone disagrees | not counted | "That's today's fit checks. Your photo is saved here…" |
| Spend cap hit (free) | photo kept, scored after 4 am on tap | an honest pause card (copy: open) |
| Off-topic question | not counted | the decline (F5.2) |
| Location denied | season instead of weather | "Turn on local weather" |
| Purchase fails | nothing charged | F10.5 |
| A screen crashes | data safe | "Something went wrong." … "Your fits and closet are safe on this phone." |

**Never:** a face sent unblurred; his name sent to an AI; a score from the AI; a number in Kit's words that the code didn't compute; a result blurred or charged for; a photo on our server without the backup switch on; anything said about his body.

## Interfaces
Tabs (iOS 26 glass tab bar, always labeled): **Stylist** (the chat, home) · **Closet** · **Lookbook** · **You**. Do things in Stylist; look at things in the other tabs. Screens and copy: `handoff/02-screens.md` and `mockups/kitted-mockups.html` (the mockups win on layout and copy unless a spec says why).

## Constraints
- **Stack:** React Native + Expo (TypeScript), iOS 26+, iPhone only. Scoring in `@kitted/core`.
- **Server:** Firebase (Cloud Functions as the AI proxy, Firestore, Storage, Auth: anonymous + Apple + Google).
- **AI:** Gemini (reading photos), OpenAI (Kit's answers), both behind swappable interfaces.
- **Weather:** Apple WeatherKit, with the US National Weather Service as the fallback.
- **New packages at launch (founder OK'd):** RevenueCat, expo-apple-authentication, Google Sign-In, @react-native-firebase/app-check, expo-notifications, PostHog. Each installed only when its step is built.
- **Budget:** the $25/day AI cap; Google billing alerts.
- **Rules it must fit:** CLAUDE.md hard lines; the Python engine is the scoring truth.

## Quality
- **Speed:** score on screen in a median under 8 s on a real phone on LTE **(assumed)**; the 9 s / 14 s timers above.
- **Privacy:** as in Data; consent names every third party; the App Store privacy label matches the Data table.
- **Accessibility:** every screen works at the largest text size and with VoiceOver; score words always with the number; checked against Apple's HIG and `research-context.md` §C14.

## Testing
- **Automatic:** `npm run check` in `app/` (types, lint, core parity with the Python engine, app tests, copy checks).
- **Launch bars:** the fix pairs and the blind rating set, on real people's photos with profiles (CLAUDE.md rule 6).
- **On the Simulator:** each feature's demo screens, light and dark, largest text.
- **On the founder's phone:** camera, mic, purchases (sandbox), sign-in, notifications.

## Build structure
Each feature gets `specs/<feature>.md` before more code. Shared code has one owner at a time: `@kitted/core` (scoring), the server, the i18n copy file. Sessions touching the same files go one after another.

## Assumptions
- Sign-in placements, sync conflict handling and sign-out behaviour as built.
- Scans: their own cap of 30 a day for everyone.
- Free users get 3 questions a day from the start.
- No founding offer at launch.
- Speed target: median under 8 s on LTE.

## Open questions (the founder decides; none blocks writing feature specs)
- Copy for: the name field ("What should Kit call you?"), the soft upgrade page, the limit card's upgrade button, the spend-cap pause card, the "not rated yet" line, Kit's decline, the photo-backup switch.
- The App Store name and subtitle (default: "Kitted: Outfit Rater for Men" / "Score your fit. Get the fix.").
- The support email, privacy policy and terms links (block submission).

## Later
- v1.1: "Should I buy this?", fitting-room mode, email sign-in, the two-shot check, the drawn figure, accessories in the score, a founding offer.
- v1.2: "Should I buy this?" from a shop's page (Share Extension).
- 2027: 16+, on a provider that allows minors.

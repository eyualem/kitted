# Kitted: the plan

Where the build stands and what's next. What the app *is* lives in `specs.md`; how to edit this file is in CLAUDE.md → "How to work".

---

## Where things stand
- **On your phone today:** fit checks with scores, fixes and re-checks; Closet, Lookbook and You; Kit answering for real; the morning and evening card with real weather; share cards (cut until after launch, T67 switches them off); voice input (not yet confirmed on your phone).
- **Built but switched off:** the paywall and purchases (a pretend store), sign-in and backup (waiting in open pull requests), notifications.
- **The beta comes first:** friends test for free with no paywall. The app and the live server both hold testers to 3 fit checks and 20 questions a day (T14, deployed and checked live Nov 8). The paywall and real purchases wait for launch.
- **Still on the old rules:** the 1-week trial, Pro at 10 checks and 50 questions, free at 1 check a day forever with 5 questions.
- **Not built yet:** the 7 free checks, greeting you by name, the spend cap working the spec's way, the app-only server lock (App Check), PostHog, reading scanned clothes, "not rated" for womenswear, Apple's age check.
- **3 pull requests are waiting,** each with work before it can merge: sign-in and backup (T41) and the card's outfit picks (T64). The other 7 were merged or closed in T1.

---

## Next up
1. Apple's weather (T80) waits until after the beta (you, Nov 9): the beta keeps the US weather service, which needs no Apple step.
2. Put the beta on TestFlight and invite your friends (T85).
3. Start your two launch photo sets now; they take the longest (Y5, Y6).
4. Read scanned clothes into Closet; your clothes photos are in (T70).

Before launch, after the beta: the new free limits, the three upgrade moments and real purchases (T11, T12, T13).

After launch: share cards come back only if they're rebuilt to be worth sharing (#432).

---

## Your to-do list
P1 this week · P2 before the beta · P3 before launch. Each says how long it takes and what it unblocks.

- [ ] **Y1** · **P1** · Register trykitted.com and claim @kitted.app / @trykitted (10 min) → the support email, the waitlist, videos
- [ ] **Y2** · **P1** · *(privacy page live Nov 11: kitted-a5b45.web.app/privacy, `legal/`)* Set up a support email, a privacy policy page and terms; Apple's standard terms are fine (15 min after Y1) → submitting the app, "Report a wrong score", TestFlight invites to friends (Apple asks for a privacy link)
- [x] **Y3** · **P1** · Say yes or change Claude's verdicts on the waiting pull requests in `tasks/T1/REPORT.md`: fix 4, close 5, and one line of card copy (10 min) → the camera and scan fixes merged, sign-in and backup (T41), the card's outfit picks (T64) · yes, Nov 7
- [ ] **Y4** · **P1** · Rotate the Gemini dev key: in Google AI Studio delete it, make a new one, paste it into `app/.env.development.local` (2 min) → safety
- [ ] **Y5** · **P1** · Shoot 20 before/after fix photos with friends, each doing a fix the card suggested; note each person's profile (~1 h) → the "fix works" launch test (T81)
- [ ] **Y6** · **P1** · Collect 40+ real photos of real people (with their OK and profile), rated blind by you and one friend aged 18–22 (1–2 h) → the "fair score" launch test (T82)
- [ ] **Y7** · **P3** · Make a RevenueCat account, and the monthly ($9.99) and yearly ($39.99) products in App Store Connect, no free trial, billing grace period on (20 min) → real purchases (T13)
- [ ] **Y8** · **P2** · Make a PostHog account, US cloud (10 min) → analytics (T91)
- [ ] **Y9** · **P2** · OK about $1 of Gemini for the scan-reading test (1 min) → scanned clothes (T70)
- [ ] **Y10** · **P2** · App Store text: name, subtitle, description, privacy label, 18+ rating; drafts in `market/app-store-connect.md` (10 min) → submitting (T84)
- [ ] **Y11** · **P2** · Phone pass: ask 3 questions by mic, then one check, re-check and new check (10 min) → voice input confirmed (F14.1), the final check (T83)
- [ ] **Y12** · **P2** · Talk to 10 guys 18–30; script in `market/market-research.md` §8 (15 min each) → launch videos, App Store words
- [ ] **Y13** · **P3** · Try Looksee, DRPD, GRWM, Dressly and ChatGPT with the same photo (45 min) → the "same photo, same score" video
- [ ] **Y14** · **P3** · Raise the Google billing alert to match the $25-a-day cap (5 min) → the spend cap (T22)
- [x] **Y15** · **P2** · OK installing Maestro, a free tool that replays tap-through tests on the Simulator (1 min) → old flows re-checked automatically on every task · installed Nov 7
- [ ] **Y16** · **P3** · Seven small camera and card calls from your Oct 24 walk, each with a default, in `handoff/09-ui-review.md` §29 (lands with the dark-tip fix): your photos from the chat's camera button without opening the camera; Propped stays quiet until it sees you; the Mirror tip's words; after a re-check, opening the first check opens its fixes in one tap; "1 more question in Closet"; a described piece keeps its color; a fix row shows only the outfit's number (3 min) → those small fixes
- [x] **Y17** · **P2** · *(7 testers added Nov 11)* Pick your first beta testers (friends, 18 or older) and get, with each one's OK, the email his Apple ID uses; TestFlight sends the invite there (10 min) → the beta (T85)
- [x] **Y18** · **P2** · OK deploying the server's beta limits to Firebase and setting its live config to `beta` (1 min; Claude runs it) → testers held to 3 checks and 20 questions a day on the real server (T14) · yes, Nov 8
- [ ] **Y19** · **P3** · Sign the Paid Apps Agreement in App Store Connect → Business: tax form (W-9) and bank account; it can take a day to clear (15 min) → real purchases (T13)
- [x] **Y20** · **P1** · Say yes (or change) the new location words iOS shows with Apple's weather on, quoted in T80's report (1 min) → Apple's weather in the app (T80) · yes, Nov 8
- [ ] **Y21** · **P2** · Turn on WeatherKit for the app on Apple's site: developer.apple.com → Certificates, Identifiers & Profiles → Identifiers → com.trykitted.kitted → App Services tab: tick WeatherKit; Capabilities tab: tick WeatherKit, App Attest, Sign in with Apple, Declared Age Range → Save → Confirm (10 min, then up to 30 min for Apple) → Apple's weather (T80), and Sign in with Apple for the second beta build (T41)
- [ ] **Y22** · **P2** · OK a second TestFlight build with notifications in it, once they're built and checked (1 min; Claude runs it) → notifications on testers' phones (T53) · spec approved Nov 9
- [ ] **Y23** · **P3** · VoiceOver pass on You: turn on VoiceOver (Settings → Accessibility), open You and swipe through every row; each should read its name and value as a button (5 min) → You's accessibility confirmed (T34)
- [ ] **Y24** · **P2** · OK the plain names Kit says for the style rules ("the waist break, the rule of thirds"), about 74 short names drafted in T65 (10 min) → Explain rating (T58)
- [ ] **Y25** · **P2** · OK deploying the server change that doesn't count Explain rating as a question (1 min; Claude runs it) → Explain rating on testers' phones (T26, T58)
- [ ] **Y26** · **P2** · Merge the new setup (#90, then #93), then go through it fresh on your phone (delete Kitted, reinstall): Welcome's drawing, About you, Kit's offer, Later, then Check my fit and the agreement once (10 min) → setup confirmed on a real iPhone, VoiceOver aside
- [x] **Y27** · covered by Y29
- [x] **Y28** · covered by Y29
- [ ] **Y29** · **P2** · Phone pass on TestFlight build 0.1.0 (3) (delete Kitted, reinstall it from TestFlight, about 15 min) → the beta build checked by hand before friends get it: (1) setup from fresh: the K on navy at launch, What's your style? (tiles, Tell me in your words rides the keyboard, no Not sure), 7 taps to the camera; (2) one fit check: the result card has one Why 7.5? button, no all-caps labels; the pieces slide into Closet with a light buzz, Closet's navy number, `From your first check` with `New`; (3) one question to Kit; the morning card shows only after that first check; (4) Closet: swipe a one-card question sideways, answer one (buzz), Undo; (5) You: Your style as squared tiles; (6) once in dark mode, once with VoiceOver on the new setup screen and Closet's cards. Covers Y27 and Y28
- [ ] **Y30** · **P1** · Rate 60 more gold-set photos blind, the same way as your 20 (score each 1–10 in half steps before seeing the app's; Claude prepares the sheet) (30 min) → the human answer key the rescoring is tuned to (T68); the score stops feeling squeezed

---

## Tasks
> **Reading a task line:** **ID** · what it does · *what it waits on · which spec checks it must pass · which files it touches*. The whole process is in `WORKFLOW.md`.

> **Marks:** `[ ]` to do · `[~] session name` someone's on it, or its pull request is open · `[x] date, PR` merged to main · `[!] Yn` waiting on you. Each lane names its spec; a task marked `spec: specs.md` needs no interview. `/build-task` won't start a task until its spec carries the founder's approval line, and offers to start the interview. A code task in `/build-task` shows its size and stage: `[~] T11 · tiny · build`, `· normal · review`, `· strict · tests`, `· design`, `· PR #n`, or `· stuck: why`.

> **For sessions:** IDs never change; each lane counts in its own tens and new work takes the next free number. "checks" names the spec criteria that must pass. A session works only in its lane's files. These shared files take one session at a time: `app/src/i18n/en.ts`, `app/app.config.ts`, `app/package.json`, `app/src/config/features.ts`, `app/src/data/types.ts`, `handoff/DECISIONS-LOG.md`, `plan.md`.

> **Already meets the spec** (checked Nov 7; re-checked in T83): F2.1, F2.4, F2.6, F3.2, F4.1, F5.1, F5.3, F5.4, F6.1, F6.2, F6.3, F7.1, F7.4, F7.5, F8.1, F9.2, F10.2, F10.3, F10.4, F10.5, F11.1, F11.5, F12.1.

### Waiting pull requests
*Ten pieces of finished work were never merged. Reviewing them first means nobody rebuilds them, and nothing that breaks the spec slips in.*
- [x] 2026-11-07, #68 · **T1** · Review the 10 waiting pull requests against the spec: merge, close or fix, with a reason each; renumber their clashing log entries · `tasks/T1/REPORT.md`: #36 and #50 merged; #59, #49, #44, #39, #41 closed (branches kept); #58 and #57 go on in T41, #48 in T64 · *files: other branches only*

### Free and Pro
*How Kitted makes money: 7 free checks, then Pro at $9.99 a month or $39.99 a year, with no trial. The beta comes first, free with no paywall (T14); T11–T13 are for launch. Done means a new user sees the soft page after his first result, an upgrade button when he hits the daily limit, the paywall at his 8th check, and real purchases.*

Spec: `specs/free-and-pro.md` (interview: T10)  
Lane files: `app/src/features/{paywall,held,finish}`, `app/src/services/{quota,purchases,entitlements}.ts`, `app/src/features/settings/plan.ts`

- [x] 2026-11-07, #69 · **T10** · Write the free-and-Pro spec with you: the soft page, the limit card's button, the paywall without a trial, and their words · *done: your yes (Nov 7) · files: `specs/free-and-pro.md`*
- [x] 2026-11-08, #72 · **T14** · The beta's limits: a `beta` tier on the server (3 fit checks and 20 questions a day, no lifetime count), the beta limit card, the questions line and You → Plan's row; no paywall, price or "Pro" anywhere · *after FP7 (your yes, Nov 8) · checks: FP7.1–FP7.7 · files: quota.ts, server/tier.ts, held/, settings/plan.ts, en.ts, `firebase/functions/src/api/{limits,store}.ts`*
- [ ] **T11** · *(launch)* The new limits in the app: 7 free checks (max 1 a day), 3 questions a day, Pro 5 + 30, no trial anywhere · *after T10 · checks: F10 Free and Pro, F10.4 · files: quota.ts, paywall/, settings/plan.ts, en.ts*
- [ ] **T12** · *(launch)* The three upgrade moments: the soft page after his first result, the limit card's button, the full paywall at check 8 · *after T10, T11 · checks: F10 "When he sees it", F10.2, F10.3 · files: finish/, paywall/, held/*
- [!] **Y7** · **T13** · *(launch)* Real purchases with RevenueCat, monthly and yearly, and Restore, replacing the pretend store · *after T10 · checks: F10.5, F10.6 on a test account · files: purchases.ts, entitlements.ts, package.json, app.config.ts*

### Server
*The server is what actually counts checks and money, so the limits can't be dodged by reinstalling. Done means the 7 free checks hold for life, Pro is per person, the AI bill stops at $25 a day without stopping Pro, and only the real app gets answers.*

Spec: `specs/limits-and-spend.md` (interview: T20)  
Lane files: `firebase/`

- [ ] **T20** · Write the limits-and-spend spec with you: how free checks are counted so a wipe can't reset them, and the pause card's words · *done: your yes · files: `specs/limits-and-spend.md`*
- [ ] **T21** · Server limits: 7 free checks per phone and account for life, 3 questions, Pro 5 + 30 per person (not one switch for everyone), declined questions not counted · *after T20 · checks: F10.1, F10.6, F5.2 · files: `firebase/functions/src/api/{limits,store,handler}.ts`*
- [ ] **T22** · The spend cap: $25 to start, pauses free checks only, resets at 4 am, keeps the photo, alerts you · *after T21 · checks: F15.1, F15.2 · files: `firebase/functions/src/api/`*
- [ ] **T23** · The server lock (App Check): the app sends proof it's the real app, and the server refuses anything else · *after T80 · checks: F15.3 · files: `firebase/`, `app/src/services/server/`, package.json*
- [x] 2026-11-08, deployed · **T25** · Deploy the beta's limits to the live server, then check live that it really answers `beta`: one real question from a fresh guest account (about 0.01¢) reads the tier the server sends back. If it says `pro`, the live `server/config` was set by hand, and it's changed to `beta` only with your OK · *after T14 · checks: FP7.1 on the live server · files: none (deploy only)*
- [ ] **T24** · A cap of 30 scanned photos a day, free and Pro alike · *after T20 · checks: F7.3 · files: `firebase/functions/src/api/limits.ts`*
- [ ] **T26** · normal · *(beta)* Explain rating isn't a question: the ask route takes an explain call without counting it, at most 2 per fit check counted that day; deployed with your OK · *after Y25 for the deploy · spec: `specs/explain-rating.md` · checks: ER1.3 (server side), ER1.8 · files: `firebase/functions/src/api/{limits,store,handler}.ts`*

### Setup and You
*The first minute in the app and the You tab. Done means setup reaches the first check in 6 taps, asks his name (optional) and checks his age the Apple way.*

Spec: `specs/setup-and-you.md` (interview: T30); for T37–T39, `specs/onboarding-screens.md` (interview: T37)  
Lane files: `app/src/features/{onboarding,you,aboutYou,settings,privacy}` (not `privacy/wipe.ts`)

- [x] 2026-11-09, #78 · **T30** · Write the setup-and-You spec with you: the name field, where consent shows, Apple's age check; You as the settings home, the feature guide (your beta feedback, Nov 8) · *done: approved Nov 9 · files: `specs/setup-and-you.md`*
- [x] 2026-11-10, #85 · **T34** · *(beta)* You becomes the settings home: Settings' rows move into You, the gear and the separate Settings page go; Notifications keeps working there · *after T30 · checks: SY1 · files: you/, `app/(tabs)/you/`, settings/, en.ts*
- [x] 2026-11-11, #100 · **T35** · *(beta)* The first-run intro, rebuilt: Kit's hello is `I'm Kit, your stylist.`; each check's pieces slide into the Closet tab and a navy badge counts them; the first visit marks them `New` under `From your first check` · *after T36 · checks: SY2.1–SY2.11 · files: Stylist part: onboarding/complete.ts, en.ts, CardParts.tsx, (tabs)/_layout.tsx, a slide overlay; Closet part: (tabs)/closet/index.tsx, features/closet, privacy/wipe.ts, sync/schema.ts*
- [x] 2026-11-10, #98 · **T36** · Settle the intro's direction with you from 2–3 drawn options, then rewrite SY2–SY3 in `specs/setup-and-you.md` · *done: your yes (Nov 10, direction A: the pieces slide into Closet) · files: `specs/setup-and-you.md`, `tasks/T36/`* · on branch `claude/kitted-first-run-intro-7d220e`
- [x] 2026-11-09, #79 · **T37** · Write the setup-screens spec with you, from your Nov 9 walk through the TestFlight build: a Welcome picture of our own (today's is a stranger's Unsplash photo), setup as plain screens instead of a pretend chat (the birth-year step first), and setup ending in Stylist with Kit offering a fit check instead of opening the camera on its own; built with T30's name field and agreement · *done: your yes (Nov 9) · files: `specs/onboarding-screens.md`*
- [x] 2026-11-10, #90 · **T38** · *(beta)* Welcome and the Example check drawn in code: no photo, an outfit drawn like Closet's pieces with its score card playing one fix · *after T37 · checks: OS1, OS2 · files: onboarding/{WelcomeScreen,welcomeExample,ExampleCheckScreen,exampleCheck}, a drawn-outfit view, a bundled reading, en.ts*
- [x] 2026-11-10, #93 · **T39** · *(beta)* Setup as plain screens (Welcome → Looks → About you → Stylist, no agreement step), About you with the name field and age bands, Style profile's Age and Name rows, and Kit's "Want to check a fit now?" card in Stylist (the camera opens only on a tap) · *after T37 · checks: OS3, OS4, OS5, F1.1–F1.3, SY4.1–SY4.2, SY4.4 · files: onboarding/, `app/onboarding/`, you/ (Style profile), data/types.ts, data/tables.ts, en.ts, e2e flows*
- [x] **T44** · merged (#105) · normal · *(beta, your Nov 11 phone pass)* You's Your style: the look buttons squared off (setup's tile corner) and each picked look shows its setup drawing, in his order; Style profile's look buttons match. Screenshots in `tasks/T44/shots/` · *after T39 · checks: SY1 (spec text unchanged; ask the founder before rewording) · files: you/{StyleTile,NumberedPill}, `(tabs)/you/{index,profile}.tsx`, the tests that name them, DECISIONS-LOG #443*
- [~] **T45** · tabbar-you · tiny · PR #116 · the full tab bar on every tab; What Kit knows moves into Privacy & data (your yes in chat, Nov 12); shots in `tasks/tabbar-you/shots/` · *spec text changes with that yes: `specs/setup-and-you.md` SY1, `specs.md` · files: `(tabs)/_layout.tsx`, `(tabs)/you/{index,privacy}.tsx`, demo/scenarios.ts, the tests that name them*
- [ ] **T31** · The name field on the birth-year step; change or clear it in Style profile; your Apple first name fills an empty one · *after T30 · checks: SY4, F1.4, F1.5 · files: onboarding/, you/, data/types.ts, en.ts* · *the setup field and the Style profile row move into T39 (your call, Nov 9); left here: Apple's first name (with T41)*
- [ ] **T32** · Apple's age check (Declared Age Range) when he taps Looks right; declined or unavailable, the birth year decides · *after T30, T80 · checks: SY6, F1.2 · files: onboarding/, a native module*
- [ ] **T33** · The setup path matches the spec: 6 taps, consent names PostHog · *after T30, T90 · checks: SY5, F1.1, F1.3 · files: onboarding/, en.ts*

### Sign-in and backup
*So his fits survive a new phone. Done means optional Apple or Google sign-in, his scores and closet restored on a new phone, photos backed up only if he turns it on, and "Delete account" wiping our server too.*

Spec: `specs/sign-in-and-backup.md` (interview: T40)  
Lane files: `app/src/features/account`, `app/src/sync`, `app/src/features/privacy/wipe.ts`

- [x] 2026-11-12, #114 · **T40** · Write the sign-in-and-backup spec with you: Apple and Google only, the photo-backup switch and its words · *done: approved Nov 12 · files: `specs/sign-in-and-backup.md`*
- [ ] **T41** · Finish the sign-in (#58) then backup (#57) pull requests to `specs/sign-in-and-backup.md`: the four places only (SB1); ask Apple for his first name (SB10); remove email sign-in, which is on main; chat messages stay on the phone (`sync/schema.ts` backs them up today, against the no-questions-kept rule; SB5); photo backup off by default, offered once on the sheet's last step (SB4); delete in one order (revoke, server once, phone; SB9); turn on only the Sign in with Apple entitlement, split out of T80's paid-team switch (`APPLE` in app.config.ts) so sign-in ships before Apple's weather; then merge, then a second TestFlight build so your testers try it (your call, Nov 12) · *after T40, Y21 · checks: SB1–SB10 · files: account/, sync/, app.config.ts, `firebase/functions`*
- [ ] **T42** · "Delete account and all data" also wipes our server · *after T41 · checks: F9.1 · files: account/, privacy/wipe.ts*
- [ ] **T43** · Restoring on a new phone tested end to end; photos upload only with backup on, and only he can see them · *after T41 · checks: F11.2, F11.4 · files: sync/, `firebase/tests`*

### Kit and the morning card
*How the app talks to him every day. Done means the morning card says "Morning, Alex.", Kit politely declines anything that isn't about clothes, and the daily idea and "fit check ready" arrive as notifications.*

Spec: `specs/kit-and-morning.md` (interview: T50); notifications: `specs/notifications.md` (interview: T56, approved Nov 9); for T58–T59, `specs/explain-rating.md` (approved Nov 10)  
Lane files: `app/src/features/{stylist,ask,morning}`

- [ ] **T50** · Write the Kit-and-morning spec with you: the decline line, greeting by name (notifications moved to T54) · *done: your yes · files: `specs/kit-and-morning.md`*
- [ ] **T51** · The morning and evening card greets him by name · *after T31, T50 · checks: F6 greeting, F1.5 · files: morning/copy.ts, en.ts*
- [ ] **T52** · Kit declines off-topic questions (haircuts, grooming, fitness, dating) with the spec's line, caught on the phone, never counted · *after T50 · checks: F5.2 · files: ask/*
- [~] **T56** · PR #80 · *(beta)* Write the notifications spec with you: the daily nudge 15 minutes before he usually gets dressed, the ask (also at Later on the first-check card), the words, local only · *done: approved Nov 9 · files: `specs/notifications.md`*
- [~] beta-notifications · **T53** · *(beta)* Notifications in the beta: install expo-notifications (OK'd Nov 9), the ask for his get-dressed time after his first fit, the daily nudge scheduled on the phone, You → Settings → Notifications; testers who finished setup before it get the ask once; remove "trial ending" · *after T56 · checks: specs/notifications.md NT1–NT5 except NT1.8–NT1.10 (T57) · files: services/notifications.ts, finish/, settings/prefs.ts, you/notifications.tsx, morning/, en.ts, package.json, app.config.ts, config/features.ts*
- [ ] **T57** · *(beta)* Kit's ask at Later on the first-check card (the first-check reminder) · *after T53, T39 (kv `firstCheckOffer.laterAt`, card `firstCheckOffer`, `specs/onboarding-screens.md` OS5) · checks: NT1.8–NT1.10 · files: finish/, en.ts*
- [x] 2026-11-09, #75 · **T54** · Bug from the beta (Nov 8): two evening cards on one evening. One card per day and window, even when Stylist asks twice while the weather loads · *spec: specs.md · checks: F6 · files: morning/service.ts*
- [x] 2026-11-09, #82 · **T55** · The card waits for enough closet: it suggests outfits only once Kit knows two that work (else it says why); checked before then it reads "Today's fit" / "Tonight's fit" with the score, not "You went with your own"; a read-only "can the card suggest yet?" for the notifications (F13.1) · *after T54 · spec: specs.md · checks: F6.2, F13.1 (its read side) · files: morning/, core `ideas.ts` (a new function only), en.ts*
- [x] **stylist-first-card** · merged (#103) · tiny · *(beta, bug from the phone, Nov 11)* Right after setup the Stylist tab showed two cards at once (the morning card's "Your first fit check" under Kit's "Want to check a fit now?"). Until his first scored check, only Kit's first-check card shows; the morning and evening card waits for it · *his rule, in chat Nov 11 · files: morning/service.ts (one gate in postCard), onboarding/firstCheckOffer.ts, one test*
- [~] kit-arrives · normal · Kit's messages fade and rise in *(beta, from the phone, founder in chat Nov 12: "just like any other chat interface... not over the top, but some movement so the eye gets directed there"; he picked fade and rise)* Kit's new messages in Stylist fade in while rising about 8 pt (about 250 ms, 100 ms apart when several land), a plain fade with Reduce Motion; only messages he hasn't seen move, so reopening shows old ones still; his own messages and past chats never animate · *files: stylist/StylistScreen.tsx (the row wrapper), a new stylist/arrival.ts and test; not design-system/components/Chat.tsx or (tabs)/_layout.tsx* · PR #118 · log #458
- [x] **result-card-actions** · merged (#108) · tiny · *(beta, from the phone, Nov 11)* The result card's bottom row: one "Why 7.5?" secondary button instead of the two text links; "Not quite right?" off the card (his yes, Nov 11); the re-check card and Share stay until T66/T67 · *his words in chat Nov 11; spec: `specs/explain-rating.md` ER2.3 · files: stylist/cards/FitCheckCard.tsx*
- [x] hoodie-layer-credit · **looks-own-words** · tiny · *(beta, a tester, Nov 11)* Setup's style screen: the title is "What's your style?" (your pick, B) and the line "Pick up to 3 looks you like. Today's outfit comes next."; "Something else? Tell me in your words": the keyboard no longer covers the field and Continue, and the field stays open until Done; "Not sure" is gone, so setup is 7 taps to the camera (your yes) · merged (#109) · *log #447, #448, #449 · files: `onboarding/PickLooksScreen.tsx`, `__tests__/looksOwnWords.test.tsx`*
- [~] chat-photo · PR #117 · tiny · his photo in the chat, bigger with no frame: about 60% of the screen wide, no navy frame, rounded corners, occasion and time in small grey text under it (he picked "Bigger, no frame", in chat Nov 12) · *built, checked on the Simulator (light, dark, largest text); log #457; the Example check's drawn bubble keeps the old frame (its tests), your call · files: design-system/components/{Chat.tsx,chatLayout.ts}, tokens.ts*
- [ ] **T58** · normal · *(beta)* Explain rating: the button on the result and re-check cards, Kit's explanation in the chat from T65's two picks in the friend voice, the three checks on his answer (names the rule, no number but the score, nothing about his body), the code-written fallback (offline, error, 6 s), once per check and never a question · *after T65, T66, T26, Y24 · checks: ER1.1–ER1.5, ER1.7, ER2.4 · files: ask/, stylist/cards/{FitCheckCard,RecheckCard}.tsx (the button only), en.ts*
- [ ] **T59** · normal · *(beta)* Fixing a misread by telling Kit: "those jeans are straight" gets a "Re-score with straight jeans" tap card (Kit's existing tap card) that opens the correction with his answer filled in · *after T58 · checks: ER3.1, F4.1 · files: ask/ (router, cards), correct/, en.ts*

### Fit check and scoring
*The core promise: a score he trusts. Done means a dress or skirt is marked "not rated" instead of scored wrong, the card's words match the spec, and every card with a fix offers a free one.*

Spec: `specs/not-rated.md` (interview: T60); for T65–T66, `specs/explain-rating.md` (approved Nov 10)  
Lane files: `app/packages/kitted-core`, `extraction-test/`, `app/src/features/{fitcheck,camera}`

- [ ] **T60** · Write the "not rated" spec with you: womenswear and the card's words · *done: your yes · files: `specs/not-rated.md`*
- [ ] **T61** · Dresses, skirts and heels read as "not rated", in the Python engine first, then the app's scoring (parity tests green) · *after T60 · checks: F2.5 · files: `extraction-test/`, core*
- [ ] **T62** · The card's words to the spec: the head-not-found line, "Taking longer…", "I did make the change" · *spec: specs.md · checks: F2.2, F2.3, F3.3 · files: camera/, fitcheck/, en.ts* · **F2.2's design approved Nov 9** (`tasks/T62/DESIGN.md`, the design-stage dry run); F2.3 and F3.3 still get designed when it runs
- [ ] **T63** · A test proving every card with a fix has a free fix · *spec: specs.md · checks: F2.7 · files: core tests*
- [ ] **T65** · strict · *(beta)* The score's two picks in core: the biggest cost and the biggest credit (or the other cases in the spec; on a re-check, the rule the fix cleared), read from the scoring result; a plain name for every engine rule plus a known name for a few, drafted for your OK (Y24); a test fails on an unnamed rule; no score moves (parity 100%) · *checks: ER1.1, ER1.5, ER1.6 (the picks and names) · files: core (a new picks file and names table), core tests*
- [ ] **T66** · normal · *(beta)* The quieter card: one number (a re-check shows was → now, no pill), the summary lines without numbers, one fix (a free one when there is one) with "2 more fixes" and the tips behind it; "Why 7.5?", "Not quite right?", the unsure-piece line and Share off both cards; the Example check the same once T38 is in. Light and dark screenshots in the PR · *checks: ER2.1–ER2.3, F2.7, F2.8, F3.4 · files: fitcheck/explain.ts, stylist/cards/{FitCheckCard,RecheckCard}.tsx (borrowed from the Kit lane; not while T58 runs), onboarding example card, en.ts*
- [ ] **T67** · tiny · Switch share cards off for the beta and launch (`SHARE_CARD_BUILT = false`): no share route and no share button anywhere (the explain-rating spec's card task, T66, also drops Share from the card); tests that expect them updated to the cut · *spec: specs.md F12 (cut, #432) · files: `config/features.ts` (shared), fitcheck/, lookbook/, share/ tests*
- [ ] **T68** · Rescoring v16 on paper ($0, stored readings): rules that see more (Fit and Color sit at 7 on most outfits), one real fault caps the score, a fixed curve from the raw number to the shown score fitted to target word shares (20 / 30 / 30 / 15 / 5%), a ceiling above 8.0; before/after against your blind ratings and the panel · *after Y30 · spec: the rubric (`rubric/v5-styles.md`), changed only with your yes · files: `extraction-test/`, `rubric/`*
- [ ] **T69** · strict · The rescoring in core: port T68's v16 to `@kitted/core` with parity tests and a test that fails if any word's share drifts more than 5 points from its target · *after T68 and your yes · checks: F2.1, the "fair score" bar · files: `app/packages/kitted-core`, `extraction-test/`*
- [ ] **T64** · The morning card, Kit's ideas and Swap pick outfits with the fit check's scoring, not the old rubric: rebuild #48 on today's main, keeping the warm-layer and Swap-rotation changes · *after Y3 · spec: specs.md · checks: F6, F6.3 · files: core `ideas.ts`, core tests*

### Closet
*So the closet fills from day one. Done means photos of clothes laid on a bed become Closet pieces, which makes the morning outfit idea work for a new user.*

Spec: `specs/scan-reading.md` (interview: T70); `specs/closet-beta.md` for T72–T74  
Lane files: `app/src/features/{closet,scan,lookbook}`, `app/src/services/closetSource`

- [ ] **T70** · Write the scan-reading spec with you, then test reading on your clothes photos · *after Y9 · done: your yes and the test's result · files: `specs/scan-reading.md`, `extraction-test/`*
- [ ] **T71** · Scanned photos become Closet pieces ("Waiting to be read" empties) · *after T70, T24 · checks: F7.2, F7.3 · files: scan/, closetSource/*
- [ ] **T75** · tiny · *(beta)* Lookbook's look page: "How I scored" (today's math sheet) and "Fix what I read" (the correction) · *after T66 · spec: `specs/explain-rating.md` · checks: ER3.2 · files: lookbook/LookPageScreen.tsx, en.ts* · *(first numbered T74, which T72–T74 had already claimed; renumbered at their merge, Nov 10)*
- [x] 2026-11-10, #74 · **T72** · Your Nov 8 beta notes on Closet: write `specs/closet-beta.md` with you (Outfits off for now; the piece questions one card at a time), and `specs.md` F7 if you say yes · *done: your yes · files: `specs/closet-beta.md`, `specs.md` F7* · **approved Nov 8**, F7 changed
- [x] 2026-11-10, #84 · **T73** · Closet without Outfits: no Pieces | Outfits switch, nothing elsewhere leads to it · *after T72 · checks: CB1.1–CB1.5 · files: closet/, `(tabs)/closet/index.tsx`, ask/ (buy card line), features.ts, en.ts*
- [~] closet-beta-fixes · PR #94 · **T74** · The piece questions one card at a time: swipe or answer to move on, "2 of 5", Undo, Skip · *after T73 · checks: CB2.1–CB2.10 · files: closet/, `(tabs)/closet/index.tsx`, en.ts*

### Launch
*Getting into the App Store. Done means Apple's weather and app lock are on, both launch tests pass (the fix works, the score is fair), every requirement is checked, and the app is submitted.*

Spec: `specs.md` (no interview: the launch bars and constraints are exact there)  
Lane files: `app/app.config.ts`, `extraction-test/results`, `market/`

- [ ] **T80** · *(after the beta)* Apple's weather, to Apple's rules: switch on the paid team (`APPLE` in app.config.ts), keep Apple's forecast in memory only (the card saves it today; Apple allows only brief caching), Apple's mark and "Data sources" link wherever its weather shows (the fit-check weather tip too), Kit not sent Apple's numbers unless Apple's terms allow it, the "at your own risk" line in the terms if Apple's real-time-guidance rule applies; the beta stays on the US weather service (founder, Nov 9) · *after Y21 · checks: specs.md weather line, F6.1, 09 §27 S1–S3, W1–W5 · plan to re-do: `tasks/T80/` (parked) · files: app.config.ts, morning/, services/weather/, fitcheck tip, ask/*
- [~] apple-connect-beta-setup · PR #71 · **Y17** · **T85** · The beta on TestFlight: the app's App Store Connect record, a build (asks you before an EAS build), your friends invited · *after T14, T80 · done: a friend installs it from the invite · files: app.config.ts* · **console set up Nov 8:** the app record (Apple ID 6830467413), internal group "Kitted team" with you in it, the EAS project `@matemind/kitted` with the Firebase key, uploads aimed at the app (`eas.json`). **First build Nov 8:** 0.1.0 (1) built on EAS and uploaded to TestFlight for Kitted team and installed on your iPhone (before T80: NWS weather, no sign-in, no notifications). **Nov 11:** Test Information filled (description, feedback email, privacy link, review contact and notes); external group "Friends beta" with 7 testers (emails in App Store Connect only); build 0.1.0 (3) submitted to Beta App Review, waiting. Left: Apple's approval (invites then go out on their own), a friend installs it
- [x] **T92** · merged (#104) · The launch screen: a cold start (app swiped away or killed) shows the Kitted K big enough to notice, then fades into the first screen; coming back from the background skips it (iOS does that itself) · PR open · *tiny · files: `app.config.ts` splash plugin, `assets/images/splash-k.png`, `src/app/_layout.tsx`*
- [x] **no-all-caps** · merged (#106) · tiny · *(beta, your Nov 11 message)* No all-caps anywhere: every card label ("Fit check · Full", "While I read it", "Your style") in sentence case; the setup-screens test's time limit raised so it stops timing out under load · *log #444 · files: `design-system/typography.ts`, `__tests__/T39-setupScreens.test.tsx`, CLAUDE.md*
- [!] **Y5** · **T81** · Run the "fix works" test on the fix photos · *after T62 · checks: F3.1 (18 of 20 go up) · files: `extraction-test/results`*
- [!] **Y6** · **T82** · Run the "fair score" test on the rating set, by age band and look · *checks: the bar in `specs.md` → "The launch" · files: `extraction-test/results`*
- [ ] **T83** · Check every criterion F1.1–F16.2, saying how; the privacy label matches the spec's Data table · *after everything above*
- [!] **Y2** · **T84** · Build and submit to the App Store · *after T83, Y10*

### Analytics (last, since it touches every lane's files)
*How we'll know if it's working: counting what users do (never photos, words or personal details). Done means we can see whether free checks turn into subscribers.*

Spec: `specs/analytics.md` (interview: T90)

- [ ] **T90** · Write the analytics spec with you: the ~15 events and what each one carries · *done: your yes · files: `specs/analytics.md`*
- [!] **Y8** · **T91** · PostHog installed and sending; a test proves no photo, words, name, birth year or location in any event · *after T90 · checks: F16.1, F16.2 · files: many (shared)*

---

## Open decisions
Claude builds with the default until you decide.
- **The result card after the rescoring (research Nov 13, `reports/2026-11-13-scoring-research.md`):** show what the fix is worth ("Swap to white sneakers: 7.5", computed by the code), a short tag per piece (what works, the biggest point-loser) and "your best this month" after 5 checks. This reverses part of F2.8 and T66. Default: the card stays as specced until you decide; Claude recommends showing the fix's score.
- **Free checks after "Delete all my data":** today that wipe also clears the phone's ID, which would give 7 new free checks. Default: count them with Apple's DeviceCheck, which survives a wipe and a reinstall (T20).
- **Scans:** their own cap of 30 a day for everyone (assumed in the spec).
- **Sign-in in the beta build:** settled Nov 12 (your call): the first beta build ships without sign-in; a second TestFlight build before launch brings Apple and Google sign-in with backup (T41), so your testers try it on real phones first.
- **Height (founder, Nov 9: "if we're genuinely going to integrate it, that would be pretty dope"):** not asked in setup. Default: later, Kit asks once only when it would change advice (jacket length, trouser break), uses it quietly to choose fixes, never says it back and never lets it change a score. Needs its own spec; it sits next to the never-about-his-body line (#432).
- **The redesign stage (eyualem/kitted#83):** parked until after the beta (you, Nov 10); unmerged and unchanged.
- **"Get your head in the shot" (the head-not-found line, spec F2.2):** the designer and critic found it misses the usual causes (turned away, far, dim); "Face the camera…" would fit more. Default: the spec's words until you say otherwise (#434).

---

## Session log
The last 15 sessions, newest first.
- 2026-11-13 · radar-scoring-research: why the score feels off, researched (report `reports/2026-11-13-scoring-research.md`, cloud copy linked there): scores aren't too high on average but squeezed around 7 (60% land 7–7.5, a third exactly 7.0, nothing above 8.0; you rate 25% at 5.5 or lower, the app 5%); what Lighthouse, Vivino, Yuka, chess, credit and Oura do; your 30-min rating set (Y30) unblocks the fix; log #459
- 2026-11-12 · chat-photo: his photo in the chat is bigger with no frame (60% of the screen, grey occasion and time under it; your "Bigger, no frame"); checked on the Simulator in light, dark and the largest text, tap still opens the viewer; PR #117 open, awaiting your yes to merge; the Example check's drawn bubble still has the old frame; log #457
- 2026-11-12 · auth-onboarding-placement: the sign-in-and-backup spec written with you and approved (`specs/sign-in-and-backup.md`): no sign-in in setup, a "Keep your fits" card on his next visit after the first score, one last card 3 checks later, rows on You, photo backup offered once after sign-in, first in a second beta build; found chats would back up today against the rules (fixed in T41); merged (#114, your "Yes, merge it"); log #456
- 2026-11-11 · rating-evaluation-taste: the beta's privacy page live (kitted-a5b45.web.app/privacy, your OK, `legal/`); TestFlight Test Information filled; "Friends beta" with your 7 testers; build 0.1.0 (3) waiting for Apple's beta review, invites go out on approval; the app's own privacy link (`links.ts`) still empty; log #454
- 2026-11-11 · rating-evaluation-taste: TestFlight build 0.1.0 (3) from main `50c219f9` (EAS `d3572a42`, auto-submit scheduled; your "I want the build started now"), tagged `testflight/0.1.0-3`; started before the checks at your ask: then typecheck, lint, 853 core and 1,944 app tests passed, guard:release passed; the 5 tap-through flows not run (the Mac's memory); the slides fix (T93) not in it; your phone pass is Y29
- 2026-11-11 · hoodie-layer-credit: setup's style screen merged (#109, your "Merge it"): "What's your style?", the own-words box rides the keyboard and gets the cursor, no Not sure (7 taps to the camera); log #447–#449; needs a new TestFlight build to reach phones
- 2026-11-11 · hoodie-layer-credit: the style screen's new wording (you picked B from the mockup, `tasks/looks-wording/design.html`) added to PR #109 with the spec line, test and flows; log #449
- 2026-11-11 · hoodie-layer-credit: tested setup's style screen on the Simulator: the keyboard covered the "Tell me in your words" field and Continue; fixed (PR #109, log #448); a first-tap miss seen on the Simulator only, not proven an app bug
- 2026-11-11 · `/test-build` (you): one script checks the whole app before each TestFlight build (every check, the 5 core flows, one summary), then your OK, the build, one phone checklist, and `/test-build feedback` to sort testers' words; build 2 tagged `testflight/0.1.0-2`; the new flows not yet run on the Simulator
- 2026-11-11 · hoodie-layer-credit: the result card's one "Why 7.5?" button checked on a Release Simulator build (light and dark, the button opens the Why sheet), then merged (#108, your "Check, then merge")
- 2026-11-11 · result-card-actions: the result card's bottom row is one "Why 7.5?" button (you picked it from three), "Not quite right?" off the card as the explain-rating spec already says; checked on the web preview in light and dark, not yet on the Simulator; PR open
- 2026-11-11 · hoodie-layer-credit: the launch screen's K made a bit smaller, 120 to 96 pt (your ask); seen on a Release Simulator build; merged (#107); on your phone after the next TestFlight build
- 2026-11-11 · hoodie-layer-credit: main tested with all three merged (types, lint, 853 scoring and 1,941 app tests pass; a Release Simulator build shows the K launch screen, only Kit's offer before the first check, the You tiles); no-all-caps merged (#106, log #444)
- 2026-11-11 · hoodie-layer-credit: your Nov 11 phone pass split into four sessions; merged #103 (morning card waits for the first check), #104 (launch screen K on navy) and #105 (Your style tiles), log entries renumbered 441–443; the Closet's sections already show from 4 pieces, no change; none tried on your phone yet (the launch screen needs a new TestFlight build)
- 2026-11-11 · your-style-tiles: T44 built (squared look tiles with setup's drawings on You's Your style and Style profile; light and dark screenshots, 1 and 3 looks; reviewer's notes fixed); PR open, awaiting your yes to merge; log #443

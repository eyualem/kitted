# Kitted: the plan

Where the build stands and what's next. What the app *is* lives in `specs.md`; how to edit this file is in CLAUDE.md → "How to work".

---

## Where things stand
- **On your phone today:** fit checks with scores, fixes and re-checks; Closet, Lookbook and You; Kit answering for real; the morning and evening card with real weather; share cards; voice input (not yet confirmed on your phone).
- **Built but switched off:** the paywall and purchases (a pretend store), sign-in and backup (waiting in open pull requests), notifications.
- **The beta comes first:** friends test for free with no paywall. The app and the live server both hold testers to 3 fit checks and 20 questions a day (T14, deployed and checked live Nov 8). The paywall and real purchases wait for launch.
- **Still on the old rules:** the 1-week trial, Pro at 10 checks and 50 questions, free at 1 check a day forever with 5 questions.
- **Not built yet:** the 7 free checks, greeting you by name, the spend cap working the spec's way, the app-only server lock (App Check), PostHog, reading scanned clothes, "not rated" for womenswear, Apple's age check.
- **3 pull requests are waiting,** each with work before it can merge: sign-in and backup (T41) and the card's outfit picks (T64). The other 7 were merged or closed in T1.

---

## Next up
1. Switch on the paid Apple team in the app: Apple's weather and the server lock (T80). TestFlight needs it.
2. Put the beta on TestFlight and invite your friends (T85).
3. Start your two launch photo sets now; they take the longest (Y5, Y6).
4. Read scanned clothes into Closet; your clothes photos are in (T70).

Before launch, after the beta: the new free limits, the three upgrade moments and real purchases (T11, T12, T13).

---

## Your to-do list
P1 this week · P2 before the beta · P3 before launch. Each says how long it takes and what it unblocks.

- [ ] **Y1** · **P1** · Register trykitted.com and claim @kitted.app / @trykitted (10 min) → the support email, the waitlist, videos
- [ ] **Y2** · **P1** · Set up a support email, a privacy policy page and terms; Apple's standard terms are fine (15 min after Y1) → submitting the app, "Report a wrong score", TestFlight invites to friends (Apple asks for a privacy link)
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
- [ ] **Y17** · **P2** · Pick your first beta testers (friends, 18 or older) and get, with each one's OK, the email his Apple ID uses; TestFlight sends the invite there (10 min) → the beta (T85)
- [x] **Y18** · **P2** · OK deploying the server's beta limits to Firebase and setting its live config to `beta` (1 min; Claude runs it) → testers held to 3 checks and 20 questions a day on the real server (T14) · yes, Nov 8
- [ ] **Y19** · **P3** · Sign the Paid Apps Agreement in App Store Connect → Business: tax form (W-9) and bank account; it can take a day to clear (15 min) → real purchases (T13)

---

## Tasks
> **Reading a task line:** **ID** · what it does · *what it waits on · which spec checks it must pass · which files it touches*. The whole process is in `WORKFLOW.md`.

> **Marks:** `[ ]` to do · `[~] session name` someone's on it, or its pull request is open · `[x] date, PR` merged to main · `[!] Yn` waiting on you. Each lane names its spec; a task marked `spec: specs.md` needs no interview. `/build-task` won't start a task until its spec carries the founder's approval line, and offers to start the interview. A code task in `/build-task` shows its stage: `[~] T11 · plan`, `· tests`, `· build`, `· verify`, `· PR #n`, or `· stuck: why`.

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

### Setup and You
*The first minute in the app and the You tab. Done means setup reaches the first check in 6 taps, asks his name (optional) and checks his age the Apple way.*

Spec: `specs/setup-and-you.md` (interview: T30)  
Lane files: `app/src/features/{onboarding,you,aboutYou,settings,privacy}` (not `privacy/wipe.ts`)

- [ ] **T30** · Write the setup-and-You spec with you: the name field, where consent shows, Apple's age check · *done: your yes · files: `specs/setup-and-you.md`*
- [ ] **T31** · The name field on the birth-year step; change or clear it in Style profile; your Apple first name fills an empty one · *after T30 · checks: F1.4, F1.5 · files: onboarding/, you/, data/types.ts, en.ts*
- [ ] **T32** · Apple's age check (Declared Age Range) at first launch · *after T30, T80 · checks: F1.2 · files: onboarding/, a native module*
- [ ] **T33** · The setup path matches the spec: 6 taps, consent names PostHog · *after T30, T90 · checks: F1.1, F1.3 · files: onboarding/, en.ts*

### Sign-in and backup
*So his fits survive a new phone. Done means optional Apple or Google sign-in, his scores and closet restored on a new phone, photos backed up only if he turns it on, and "Delete account" wiping our server too.*

Spec: `specs/sign-in-and-backup.md` (interview: T40)  
Lane files: `app/src/features/account`, `app/src/sync`, `app/src/features/privacy/wipe.ts`

- [ ] **T40** · Write the sign-in-and-backup spec with you: Apple and Google only, the photo-backup switch and its words · *done: your yes · files: `specs/sign-in-and-backup.md`*
- [!] **Y3** · **T41** · Finish the sign-in (#58) then backup (#57) pull requests to the spec: ask Apple for his first name (F1.4); take out #58's paid-team switch (that's T80); remove email sign-in, which is on main; build the photo-backup switch, off by default (today there is none and photos always upload); delete in one order (revoke, server once, phone); then merge · *after T1, T40 · checks: F11 Apple + Google, F11.3, F1.4 · files: account/, sync/, `firebase/functions`*
- [ ] **T42** · "Delete account and all data" also wipes our server · *after T41 · checks: F9.1 · files: account/, privacy/wipe.ts*
- [ ] **T43** · Restoring on a new phone tested end to end; photos upload only with backup on, and only he can see them · *after T41 · checks: F11.2, F11.4 · files: sync/, `firebase/tests`*

### Kit and the morning card
*How the app talks to him every day. Done means the morning card says "Morning, Alex.", Kit politely declines anything that isn't about clothes, and the daily idea and "fit check ready" arrive as notifications.*

Spec: `specs/kit-and-morning.md` (interview: T50)  
Lane files: `app/src/features/{stylist,ask,morning}`

- [ ] **T50** · Write the Kit-and-morning spec with you: the decline line, greeting by name, the two notifications · *done: your yes · files: `specs/kit-and-morning.md`*
- [ ] **T51** · The morning and evening card greets him by name · *after T31, T50 · checks: F6 greeting, F1.5 · files: morning/copy.ts, en.ts*
- [ ] **T52** · Kit declines off-topic questions (haircuts, grooming, fitness, dating) with the spec's line, caught on the phone, never counted · *after T50 · checks: F5.2 · files: ask/*
- [ ] **T53** · Notifications: install expo-notifications, send the daily idea and "fit check ready", remove "trial ending" · *after T50 · checks: F13 · files: finish/service.ts, settings/prefs.ts, you/notifications.tsx, package.json*

### Fit check and scoring
*The core promise: a score he trusts. Done means a dress or skirt is marked "not rated" instead of scored wrong, the card's words match the spec, and every card with a fix offers a free one.*

Spec: `specs/not-rated.md` (interview: T60)  
Lane files: `app/packages/kitted-core`, `extraction-test/`, `app/src/features/{fitcheck,camera}`

- [ ] **T60** · Write the "not rated" spec with you: womenswear and the card's words · *done: your yes · files: `specs/not-rated.md`*
- [ ] **T61** · Dresses, skirts and heels read as "not rated", in the Python engine first, then the app's scoring (parity tests green) · *after T60 · checks: F2.5 · files: `extraction-test/`, core*
- [ ] **T62** · The card's words to the spec: the head-not-found line, "Taking longer…", "I did make the change" · *spec: specs.md · checks: F2.2, F2.3, F3.3 · files: camera/, fitcheck/, en.ts*
- [ ] **T63** · A test proving every card with a fix has a free fix · *spec: specs.md · checks: F2.7 · files: core tests*
- [ ] **T64** · The morning card, Kit's ideas and Swap pick outfits with the fit check's scoring, not the old rubric: rebuild #48 on today's main, keeping the warm-layer and Swap-rotation changes · *after Y3 · spec: specs.md · checks: F6, F6.3 · files: core `ideas.ts`, core tests*

### Closet
*So the closet fills from day one. Done means photos of clothes laid on a bed become Closet pieces, which makes the morning outfit idea work for a new user.*

Spec: `specs/scan-reading.md` (interview: T70); `specs/closet-beta.md` for T72–T74  
Lane files: `app/src/features/{closet,scan,lookbook}`, `app/src/services/closetSource`

- [ ] **T70** · Write the scan-reading spec with you, then test reading on your clothes photos · *after Y9 · done: your yes and the test's result · files: `specs/scan-reading.md`, `extraction-test/`*
- [ ] **T71** · Scanned photos become Closet pieces ("Waiting to be read" empties) · *after T70, T24 · checks: F7.2, F7.3 · files: scan/, closetSource/*
- [~] closet-beta-fixes · PR #74 · **T72** · Your Nov 8 beta notes on Closet: write `specs/closet-beta.md` with you (Outfits off for now; the piece questions one card at a time), and `specs.md` F7 if you say yes · *done: your yes · files: `specs/closet-beta.md`, `specs.md` F7* · **approved Nov 8**, F7 changed
- [~] closet-beta-fixes · verify · **T73** · Closet without Outfits: no Pieces | Outfits switch, nothing elsewhere leads to it · *after T72 · checks: CB1.1–CB1.5 · files: closet/, `(tabs)/closet/index.tsx`, ask/ (buy card line), features.ts, en.ts*
- [~] closet-beta-fixes · **T74** · The piece questions one card at a time: swipe or answer to move on, "2 of 5", Undo, Skip · *after T73 · checks: CB2.1–CB2.10 · files: closet/, `(tabs)/closet/index.tsx`, en.ts*

### Launch
*Getting into the App Store. Done means Apple's weather and app lock are on, both launch tests pass (the fix works, the score is fair), every requirement is checked, and the app is submitted.*

Spec: `specs.md` (no interview: the launch bars and constraints are exact there)  
Lane files: `app/app.config.ts`, `extraction-test/results`, `market/`

- [ ] **T80** · Switch on the paid Apple team: Apple's weather first, the server lock's entitlement; rebuild the app · *done: Apple's weather on the Simulator · files: app.config.ts*
- [~] apple-connect-beta-setup · PR #71 · **Y17** · **T85** · The beta on TestFlight: the app's App Store Connect record, a build (asks you before an EAS build), your friends invited · *after T14, T80 · done: a friend installs it from the invite · files: app.config.ts* · **console set up Nov 8:** the app record (Apple ID 6830467413), internal group "Kitted team" with you in it, the EAS project `@matemind/kitted` with the Firebase key, uploads aimed at the app (`eas.json`). **First build Nov 8:** 0.1.0 (1) built on EAS and uploaded to TestFlight for Kitted team and installed on your iPhone (before T80: NWS weather, no sign-in, no notifications). Left: Test Information and outside testers by email (needs Y2's privacy link and Y17's emails; Apple reviews the first external build)
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
- **Free checks after "Delete all my data":** today that wipe also clears the phone's ID, which would give 7 new free checks. Default: count them with Apple's DeviceCheck, which survives a wipe and a reinstall (T20).
- **Scans:** their own cap of 30 a day for everyone (assumed in the spec).
- **Sign-in in the beta build:** today Continue with Google works only on dev builds, and it backs nothing up yet (sync is T41). Default: the beta ships without sign-in; the server counts each phone's guest account. Sign-in and backup come with T40/T41, alongside Apple's, which App Review asks for next to Google's (guideline 4.8).
- **Where consent shows:** the spec says the first time he opens the camera; the app has it as setup step 4. Default: the spec; settled in T30.

---

## Session log
The last 15 sessions, newest first.
- 2026-11-08 · T72: `specs/closet-beta.md` approved (Outfits off for the beta; To confirm one card at a time, swipe or Skip moves on, buttons answer); `specs.md` F7 updated · #405
- 2026-11-08 · T85: console set up (Kitted team, EAS project, upload target), main merged in, then the first build 0.1.0 (1) built, uploaded to TestFlight and installed on your iPhone; check 1,648 tests and guard:release passed · #403–404, PR #71
- 2026-11-08 · T25: the beta's limits deployed (`api`, `purgeUsage`); a live question from a fresh guest got `x-kitted-tier: beta`, so the live config isn't set to Pro by hand · #402
- 2026-11-08 · T14 merged (#72): the beta's 3 checks and 20 questions a day, its limit card, Plan row and morning line, no paywall; verified ready in round 2; server not deployed · #400–401
- 2026-11-08 · The beta first (founder): free for friends, 3 fit checks and 20 questions a day, no paywall (FP7, approved Nov 8; T14 builds it); the paywall and RevenueCat moved to launch; T85 and Y17 added · #399
- 2026-11-07 · T10: `specs/free-and-pro.md` approved: one paywall page, $39.99/yr ("Best value") and $9.99/mo with no offers, the soft page, the limit card's "Score it now with Pro", check 8, Pro ended · #398
- 2026-11-07 · T1: the 10 waiting pull requests reviewed against the spec (fix 4, close 5, one line for the founder); the scan triangle and the camera's dark tip merged; T41 corrected, T64 and Y16 added · #395–397
- 2026-11-07 · `WORKFLOW.md`: the whole process on one page; plan.md lanes get a plain intro · #394
- 2026-11-07 · the spec gate: each lane names its spec, specs carry the founder's approval line, `/build-task` starts the interview when one is missing · #393
- 2026-11-07 · Maestro installed; flows in `app/e2e/`, replayed by the verifier on every task, locked like tests · #392
- 2026-11-07 · `/build-task`: one command runs planner, test writer, implementer and verifier as separate agents with a fix loop; test lock hook and guard test · #391
- 2026-11-07 · plan.md formatting; the old status file deleted, its run notes and lessons kept in `handoff/15-build-notes.md` · #390
- 2026-11-07 · plan.md: one line per task, no tables · #389
- 2026-11-07 · plan.md written from the spec and a code check; old status file archived · #389
- 2026-11-07 · the spec interview: `specs.md` written · #388

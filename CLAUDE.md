# Kitted: a men's pocket-stylist iOS app

**This file is the one place for current status and instructions.** Read it first in every new chat, then open only the reference docs the task needs (the "Docs map" below). **Last updated: Oct 14, 2026 (the re-check camera says the whole fit is read again, #253–254; the consent loop fixed, #252; scoring v11, the second look in the app, the hem and creator-outfit tests, #236–239; scoring v10 from the creators' rules and the stylist guide for the chat, #235; how the founder's taste sources judge outfits, from 32 YouTube transcripts, #234; before that: scoring v8 adopted and ported, #228; Archivo and the theme batch, #230–231; the app review fixes, #233).**

## How we keep context (rules for every chat)

1. **This file holds the live state:** where things stand, what's next, what's waiting on the founder, and how to run things. Keep it true.
   - Update it whenever a decision is made or a step is finished.
   - Always update it at the end of a session. Don't wait to be asked.
   - Don't start new status, handoff or plan files. Put that content here instead.
2. **Reference docs** (specs, research) hold detail too big for this file. When a decision changes one of them, edit that doc in the same session. If a doc goes stale, fix it or move it to `handoff/archive/` and remove it from the map.
3. **`handoff/DECISIONS-LOG.md`** is the append-only record of decisions and technical lessons, with the reasons. Add a numbered entry whenever you settle a contradiction or change a decision.
4. **Commit and push to GitHub** (`eyualem/kitted`, private) after every finished step.
5. Work only in this folder. Codex and Gemini research outputs go in `inputs/`.
7. **Test with a real person's profile, never a made-up one** (founder, Oct 9; DECISIONS-LOG #172). Every scoring, reading or measuring test records, for each photo, who is in it and their profile as the app would hold it: **age** (from their own birth year, as an age band: 18–21, 22–25, 26–30, 31+), **the looks they picked** (up to 3, in order, the onboarding list), and height, build and fit if they gave them, plus the occasion. Score with that profile (as the app would) and report results split by age band and by picked look.
   - Age comes only from the person. Never estimate it from a photo (faces are hidden anyway, and guessing age from a body is rating the body).
   - Stock and web photos have no profile: mark them "profile unknown", run them with one stated test profile, and say so in the report. Until Oct 9 every test used an invented "Minimal + Smart casual" profile; treat older results that way.
   - Age and picked looks never change a score today (v4: picks only change "Reads as", tips, the morning card). Age moves points only if the gold set shows raters really judge by age, and then it's my call.
   - Profiles stay in `inputs/` (git-ignored): first names or codes, birth year, no faces or contact details, and only with the person's OK.
8. **Keep "My to-do list" (below) current, and remind me** (founder, Oct 8). Whenever something needs me (a test on my phone, photos to shoot, an account, a decision), add it there in plain words with a priority (P1 this week / P2 before the beta / P3 before launch): what to do, how long, and what it unblocks. Check it off or remove it when it's done. When you report a result, now and then (not every message) end with one line like "Still on your list: the phone test and the clothes photos", picking the 1–3 items that unblock the most.
9. **Watch the Mac's memory; never push it hard** (founder, Oct 11, after an overload paused a session). Several agents at once are fine, but check memory pressure (`top -l 1 | grep PhysMem`) before heavy work, and don't stack heavy jobs (an iOS build, the Simulator, `npm run check`, big Python runs) at the same time. Shut the Simulator down when done. Taking longer is fine.

## My to-do list (founder; every chat keeps this current, rule 8)
**Priority:** **P1** = this week; it blocks a test, the beta, or other chats' work. **P2** = before the beta (Nov 3). **P3** = before launch, or when I have time. (These are my priorities, not the build phases P0–P8.) Within each group, the most urgent is first. Details for each are in "Waiting on the founder" further down.

**Do (things only I can do):**
- [ ] **P1** · **Try a fit check, then the card's re-check with a new photo, then a brand-new check (5 min, #245).** The agreement loop is fixed too (#252): the agreement now shows once, when you first open the camera, and never again; check that with Metro running. Fully close Kitted first (swipe it away) so an already-stuck check is dropped. If anything fails, tell Claude the exact words on screen, or plug in the phone so Claude can pull the log (`tools/phone/pull.sh`). *Unblocks: confirming the lock-up fix on the live path.*
- [ ] **P2** · **Reinstall Kitted by Oct 21** (reinstalled Oct 14 with real weather, the closet long-press, the lock-up fix; the free 7-day signing permit runs out a week later; ask Claude, ~1 min with the phone unlocked). Joining the $99 program ends the weekly reinstall.
- [ ] **P1** · **Tell Claude your own profile, 1 min:** your birth year, the 3 looks you'd pick in onboarding in order (Streetwear, Minimal, Smart casual, Classic prep, Workwear, Outdoor, Vintage sport), and height, build and fit if you want. *Unblocks: re-scoring your saved checks the way the app will see you (rule 7); today they use a made-up profile.*
- [ ] **P1** · **Phone test, about 10 min left** (reinstalled again Oct 9 and connected to the dev server; close-ups and measuring confirmed Oct 8 on 2 checks in the black hoodie, #109). Plug in and unlock the phone, then run `tools/phone/install.sh`. If Kitted can't find the dev server, enter the Mac's address by hand (it changes with the Wi-Fi: `10.0.0.33:8081` on Oct 8, `10.110.115.70:8081` on Oct 9). Tell Claude when you start. Also type one question in Stylist (does the text box ride the keyboard?) and scroll the chat (does the tab bar shrink with "Ask…" beside it?). Then do 4–5 fit checks in the green work boots (mirror and propped; one in a dim room, one against a window), try the mic once, and scan 2–3 clothes on the bed. *Unblocks: the shoe questions and close-ups on real photos, tuning the camera tips, voice input.*
- [ ] **P1** · **Fill 3 links before App Review (#250), 5 min once they exist:** a support email, a privacy policy URL and a terms URL, in `app/src/config/links.ts`. Until then those rows are hidden in Settings. *Unblocks: submission (App Review 5.1.1(i), 3.1.2) and "Report a wrong score".* The policy page can live on trykitted.com once you register it.
- [ ] **P2** · **"How bold" in your style profile (#250):** today your boldness setting quietly changes scores (how much bright color an outfit gets away with). Default: keep it out of the editor and make it advice-only (never moves a score), like your picked looks. *Unblocks: the Style profile's last section.*
- [ ] **P2** · **The figure for advice (#247): OK the build-step words** "Slim · Average · Athletic · Broad · Bigger · Rather not say" (`mockups/figure-avatar.html`). Default: as written; test them on the 5 guys with the style step.
- [ ] **P1** · **Join the Apple Developer Program ($99/yr) and sign the Paid Apps Agreement.** Enrollment can take a few days. *Unblocks: TestFlight (beta Nov 3), purchases, real weather, the age check.*
- [ ] **P3** · Optional, 5 min: ask Gemini to log the second Brandon Balfour video (`Y71miKP8yJE`) with the R3b honesty rules. Online research is otherwise done (#166); the gold set is what sets the scores.
- [ ] **P1** · **Export the old Gemini creator-research Google Sheet as `.xlsx`** into `inputs/rubric-research/` (2 min). *Unblocks: the same v5 rules ledger.*
- [ ] **P2** · **Run R5 in Codex: Instagram + Pinterest fits by style** (prompt in the Oct 9 chat and `rubric/research/v5-brief.md` → R5; about 5 min to start; let it use your logged-in browser if it asks). *Unblocks: checking that known-good fits score 8+ per style, and how often good fits really use a layer.*
- [ ] **P1** · **Set up a Cloudflare account** for the server. *Unblocks: scoring in release builds, so outside testers can use it.*
- [ ] **P1** · **Face-hiding gap (#224): start the fix task** (the chip "Hide partial faces cut off at the photo's top edge"). A mirror selfie with the head cut off at the top is sent with the mouth and chin showing. Needs a reinstall afterwards.
- [ ] **P3** · **Skim the re-check camera line (#254), 1 min:** "Re-check" / "I'll read your whole fit again and score what you changed. Everything else keeps its first reading." (was "Only your pants are read again", which named just the first fix's piece). Built with these words.
- [ ] **P3** · **Skim the v11 line (#239), 1 min:** "the skinny joggers read dated; a relaxed leg balances the outfit" (`rubric/research/parts/v11.md`). Built with these words.
- [ ] **P3** · **Skim the v10 lines (#235), 2 min** (`app/src/i18n/en.ts` and `rubric/research/parts/v10.md`): "the slim jeans would balance better with a straight leg", "the orange sweater is the one accent, toned down by the dark pieces around it", "Two knits together blur: try a smooth layer over the knit, like an overshirt or a jacket.", "Have the jeans hemmed to just touch your shoes (about $15 at a tailor), or cuff them once: a cleaner finish." Built with these words.
- [ ] **P1** · **The gold set, the rest (#191). Now the most important item (#229): the gold set can't judge the top end without your controlled variants.** Done Oct 12: 226 screenshots (Instagram, Pinterest, Reddit), read and judged (#224). Still to do: (2) **~15 photos of you, about 30 min**, changing one outfit on purpose: the same jeans worn normally, cuffed, rolled and hitched; tee tucked and untucked; jacket on and off; boots vs sneakers; slim vs straight jeans with the same top; one dark outfit with and without one bright accent (#234). Each as a mirror selfie and a propped shot, into `inputs/gold-set/me/`. (3) Optional, 15 min: ~15 slim + ~15 straight shop product photos where the brand names the fit (Levi's 511 / 501), into `inputs/gold-set/shop/`. Optional later: a friend rates 20 of the screenshots (10 min). Screenshots stay on the Mac, internal only. *Unblocks: the scoring points, the slim-vs-straight and hem tests, the focused AI look ($1–2), every v5 rule.*
- [ ] **P1** · **Talk to 10 guys 18–30 who aren't into fashion, 15 min each (#225).** Script in `market/market-research.md` §8 task 1: ask what they did the last time they worried about an outfit (ChatGPT? a friend?), then show Kitted and watch. Notes, in their exact words, go in `inputs/market/interviews/`. Tell Claude at 5. *Unblocks: which pain the videos and App Store page lead with, and whether "same photo, same score" matters to them.*
- [ ] **P1** · **Try the 4 closest competitors, 45 min (#225):** Looksee, DRPD, GRWM and Dressly (free downloads, no trials), plus free ChatGPT and Gemini. Send the same photo of you (face covered) twice to each and screenshot every screen into `inputs/market/teardown/`. *Unblocks: the "same photo, same score" video, and paywall ideas.*
- [ ] **P1** · **Claim @kitted.app / @trykitted and register trykitted.com** (was P2; beta is in 3 weeks and no video can point anywhere yet). About 10 minutes, and the names could be taken any time. *Unblocks: the waitlist page and the TikTok account.*
- [ ] **P2** · **TikTok scan by hand, 20 min, plus the Codex Reddit prompt, 5 min** (both in `market/market-research.md` §8 tasks 4–5). *Unblocks: this month's video hooks.*
- [ ] **P2** · **Size-ladder shoot (#164), about 45 min with a friend:** the same tee, hoodie and jeans in 2–3 sizes each (trade clothes), plus one piece that's oversized on purpose; mirror and propped, ~30 photos into `inputs/size-ladder/` (name each file with the piece and size, e.g. `tee-grey-M.jpg`). *Unblocks: judging fit (fitted vs oversized vs too big) and storing each piece's fit in the closet.* Optional: run R3c (YouTube fit guides) in Gemini, prompt in `rubric/research/v5-brief.md`.
- [ ] **P2** · **Shoot ~20 photos of my clothes** into `inputs/item-photos/` (shot list in "Waiting on the founder"). *Unblocks: scanning clothes into the closet.*
- [ ] **P3** · Later, before launch: replace the Gemini key.

**Decide (quick taste calls; Claude has a default for each):**
- [ ] **P1** · **OK the copy fixes from the app review (#233), 5 min.** Claude's defaults, all outward-facing: (1) the "How I score" sheet still explains the old scoring: rewrite it for the five parts; (2) reason lines say "legs" where they mean pants ("a roomy top over skinny legs"): say "pants" everywhere, so it never sounds like it rates bodies; (3) consent says "face cropped out or blurred": faces are blurred, never cropped: say "face blurred" everywhere; (4) the paywall's "Check every fit. Ask anything." reads as unlimited: "Up to 10 checks a day. Ask as you go."; (5) the welcome's "the two or three moves that raise it" → "the fix that raises it"; (6) "Proportions" → "Shape"; (7) "Couldn't frame this one." → "I couldn't find your face to blur it, so I didn't send it. Get your head in the shot and try again."; (8) a second photo while one is reading: "Still reading your last photo. Send this one when it's done." The full list of 40 is in DECISIONS-LOG #233's review notes. Default: yes to all 8. *Unblocks: the copy pass.*
- [ ] **P3** · **Skim the new advice lines (#232), 3 min** (`app/src/i18n/en.ts` → `pfix.tip_*`, `pfix.copy.tipLabel`, `sum.ownMove`): "Finishing touch: Have the jeans hemmed to just touch your shoes (about $15 at a tailor), or cuff them once: a cleaner finish." (reworded in v10), "Have the trousers hemmed to just touch your shoes (about $15 at a tailor)", "Tuck in the layer underneath, or wear one that ends with the sweater", "Good base. Swapping one piece gets you to 7.5.", and the interview line "an interview wants a collared shirt, a knit or a jacket". Built with these words.
- [ ] **P1** · **Pick the K icon (#262), 1 min:** open `mockups/icon-concepts/k/sheet.png`: **k4** the K with one clean cut (Claude's and the designer's pick), **k1** the pure K, **k3** the two-tone navy you liked from c2, k2 copper joint, k5 tapered. *Unblocks: the real iOS 26 icon (light, dark, tinted) in the beta build.*
- [ ] **P3** · **Skim the new scoring lines (v8, #228), 3 min** (`app/src/i18n/en.ts` → `pfix.*`, `pwhy.piled`; card reasons in `extraction-test/rubrics/parts_proto.py`): "the skinny jeans read dated; a straight leg balances the outfit" (slim says "would balance better with a straight leg" since v10), "the big, loud check on the sweater takes over the outfit", "a tank top on its own reads gym or undershirt", "Swap the tank top for a tee", "One quiet color, like a rust or olive knit, lifts Color", "Problems in more than one part" (a Why row). Built with these words; "dated" is the bluntest, "a straight leg would balance it" is the softer option.
- [ ] **P2** · **The App Store name and subtitle (#225, outward-facing).** Default: `Kitted: Outfit Rater for Men` (people search "outfit rater"; the "rate my outfit" results are weak apps) with the subtitle `Score your fit. Get the fix.` Alternatives in `market/market-research.md` §7. Also: keep the $5.99 monthly at launch (default) or make it $7.99 so the yearly plan looks like a bigger saving?
- [ ] **P2** · **Pause the proportion scripts until the gold set? (#222–223)** Even perfect measuring would change 4 of 79 scores under today's rules, and the best candidate (slim vs straight legs) failed on 90 public labelled pants. Default: pause; the gold set then decides which shape rules earn or cost points.
- [ ] **P2** · **"Going for" (built Oct 11, #218; demo screens 71–78):** it changes the advice, never the score. Should it ever lower the score when the outfit clearly misses that look? Default: advice only. Also skim its words (`app/src/i18n/en.ts`, keys `gf.*`), 5 min.
- [ ] **P2** · **Should your picked style ever move points?** (#211) Today it only orders the fixes and the "Next level" line. Default: no, until the gold set shows raters judge that way.
- [ ] **P2** · **Look at the new card and sheet** on the Simulator or your phone (5 min): `screenshots/parts-app/`. Is the chevron after "/10" a clear enough cue? Default: keep it.
- [ ] **P3** · **Skim the closet question wording** (built Oct 8 with the recommended words, #117): "Is this your grey Nike hoodie?" / "Are these your khaki chinos?", the reason lines ("I could only see part of it under your overshirt."), "Your score stays the same either way.", "To confirm". Change any word you don't like (`app/src/i18n/en.ts`, keys `closet.q.*`). See it on the Simulator: demo screens 70 (score card) and 38 (Closet).
- [ ] **P3** · **Skim the parts engine's fix lines (#208):** `app/src/i18n/en.ts`, keys `pfix.*` ("Tuck in your {name}", "Swap the {name} for navy chinos", "Add a short jacket: a bomber or a denim jacket", the "Smaller step" line, "Raises Proportions and Style"). 5 min; change any word in both `fixes.json` → `parts` and `en.ts` (a test keeps them equal). *Unblocks: the parts card's fix rows.*
- [ ] **P3** · **Skim the new fix lines (#162):** "Add a jacket over it: denim, bomber or chore coat", "Swap the {shoes} for chunky sneakers / boots / low-profile sneakers / white leather sneakers / loafers" (in `handoff/fixtures/fixes.json`). Built with these words; change any you don't like.
- [ ] **P2** · **Test the style step with 5 guys aged 18–30** (10 min, before onboarding ships; built Oct 9, #174, demo screen 2): which would they wear, and what would they call each tile? Note any outfit that looks wrong for its style. *Unblocks: locking the 7 styles and their pictures.*
- [ ] **P1** · **Who's in which photo (rule 7), 1 min:** your two friends (the chore coat + white tee person, the navy blazer person) and the person in today's 4:07 pm check (black quilted jacket, black jeans, white sneakers): their birth year and 3 picked looks, or "unknown".
- [ ] **P2** · **OK the mic permission text** (in "Waiting on the founder"; it ships with the TestFlight build).
- [ ] **P2** · **The rubric's open questions** (`rubric/v3.md`, and #57's proposed changes).
- [ ] **P3** · **"Reads as" when two looks fit** (#86). Default: my first pick breaks the tie.
- [ ] **P3** · **"Roomier than the look" (#217):** an oversized tee over straight jeans with white sneakers (no look calls for the room) now scores 6.5, the same tee over wide jeans 7.0. Keep it, or charge only over slim legs? Default: keep until the gold set.
- [ ] **P3** · **Style-crossing faults (#214), 3 quick calls:** a graphic or oversized top with trousers and loafers lands at 6.5 (make it 6.0?); a graphic tee with chinos and white sneakers is a tip, no points (make it a fault?). Defaults: as built, until the gold set.

**Skim when I have 10 minutes:**
- [ ] **P3** · The copy Claude wrote (`app/src/i18n/en.ts` → `addedInBuild`), and the 3 "already built; just confirm" items in "Waiting on the founder".

## Who I am and how I like to work
- **Who I am:**
  - A college student building a consumer iOS app for income, alone.
  - **$0 marketing budget**; I post short-form video daily.
  - I'm into style, anime and good movies. My fashion taste comes from YouTube creators: Tim Dessaint, Wanhee Kim, Jaye Alexander, Frugal Aesthetic.
  - I often talk by voice dictation, so read for intent.
- **Research tools:**
  - I use **Codex** (it has Chrome and can reach Reddit and TikTok) and **Gemini** (YouTube transcripts) for browsing research.
  - Claude writes the prompts for them and verifies what comes back.
  - Codex can also do machine setup (it installed Xcode 26.6 and the Simulator).
- **The feedback I want:**
  - **Honest, critical feedback backed by research, with sources, in plain language.**
  - Concrete recommended decisions, not open questions. Rank options when it helps (user psychology, competition, chance of success, monetization).
- **Status updates:**
  - Say what I'll *see* in the app, not spec IDs.
  - Include screenshots.
  - Say what's real and what's mocked.
  - Never pretend something works.
- **Ask me only about:** taste, money, installs and downloads, new dependencies, and anything outward-facing. Settle everything else yourself and log it.
- **Navigation:** keep the app's setup and navigation flawless. Check plans against Apple's HIG and the UX checklist in `research-context.md` §C14.

## The product (locked)
- **What it is:** a chat-first personal stylist for guys, built for beginners.
  - You send an outfit photo and get a **fit score out of 10**, with a word ("Sharp") and 2–3 specific fixes (at least one free).
  - The app **learns your closet as you go**.
- **Positioning line:** "Look put together. Without trying too hard."
- **Audience:**
  - Guys **18–30**: college students and young professionals.
  - **The app is 18+, US App Store only.** Gemini's terms require it, and it avoids Texas's parental-consent law.
  - Under 18 is blocked by a birth-year gate that starts blank, plus Apple's Declared Age Range check.
  - **Marketing targets adults only** (college, first job, interviews, dates; never prom or high school).
  - Revisit 16+ in 2027; that needs a teen-friendly AI provider (Qwen on Groq, or Anthropic).
- **Tabs:** Stylist (chat) · Closet · Lookbook · You. **Do things in Stylist; look at things in the other tabs.**
- **Scoring:** "**The AI sees, the code judges, the AI explains.**"
  - The vision model only describes garments.
  - Code (`@kitted/core`, the TypeScript port of `extraction-test/rubric.py` **v4.0**, live Oct 8; plain words `rubric/v4.md`) computes **score = 7.0 + credits − mistakes**, rounded to the nearest half.
  - The best possible score is **9.5** for now.
  - Same photo → same score. Re-checks reuse the first reading.
  - **"Not quite right?"** lets him correct a detail.
  - Score words: ≤5.5 Needs a fix · 6–6.5 Getting there · 7–7.5 Put together · 8–8.5 Sharp · 9–9.5 Dialed in. Always shown with the number.
- **Never rate faces, bodies, weight or skin.** Traditional clothing is "not rated."
- **Wording:**
  - Always "your stylist," never "AI stylist." The consent screen and the first chat message still say plainly that it's an AI.
  - No emoji, no RPG ranks or anime theme, no daily streak chain.
  - Never say "unlimited". Pro says "Up to 10 fit checks and 50 questions a day".
- **Partial checks:**
  - Full-body photos are preferred, never required. What isn't in the photo never costs points.
  - The card says so in words ("Partial check: shoes not included") and offers a shoe snap or a pick from Closet.
- **Camera:**
  - The phone propped up, with a body-outline framing guide, a 3-2-1 auto-capture and a staged loading card.
  - Mirror selfies and library photos are backups.
  - No live face blur in the camera; faces are blurred only in the copy sent for scoring (#54–55).
- **Free and Pro:**
  - **Free tier:** 1 fit check a day (with one re-check) and 5 questions a day. Everything that runs on code is free; never charge to see a score.
  - **Pro:** $29.99/yr with a 14-day trial, or $5.99/mo, plus a $19.99 founding offer for the waitlist. No lifetime plan, weekly plan or Family Sharing.
- **Onboarding** (6 taps to the first check):
  1. Welcome
  2. Looks you like (max 3)
  3. Basics (height, build, fit, birth year)
  4. Consent (Apple 5.1.2(i): names Google, says what's sent and kept)
  5. First fit check
  6. Result, then "your first 3 moves"
  7. A skippable paywall
  8. The notification ask
- **Notifications:** only 3 kinds, all local: the daily outfit idea, "fit check ready," and "trial ending."
- **Privacy:**
  - Photos keep the whole outfit (no crop). His photo is saved on his phone as he took it (no blur, location data stripped) and shown that way in the app. The copy sent for scoring has every face blurred and pixelated on the phone first; if the app can't find his head, nothing is sent. (Decided Oct 7; DECISIONS-LOG #54–55.)
  - To score a fit, the face-hidden copy goes to Google's Gemini API, which doesn't train on it and keeps it up to 55 days for abuse checks. Our server stores no photos.
  - Sending faces unblurred: recommended against for now (biometric-law and App Review risk, no accuracy gain); revisit with a lawyer before launch if wanted.
  - Consent copy: `inputs/app-store-and-age-rules.md` §3.
  - **Location (for the morning card's weather only, Oct 7, #58):** approximate (city level), asked inside the card, never in onboarding. It goes to Apple WeatherKit and is never stored by us or sent to Google. If declined, the card uses the season.
- **Look:**
  - Clean and premium, per the mockups: chalk/night backgrounds, indigo ink, a copper accent, Archivo numerals, iOS 26 Liquid Glass tab bar.
  - Mockups: `mockups/kitted-mockups.html` (20 screens). Inside each phone 1 CSS px = 1 pt.
- **A drawn figure for advice (founder, Oct 14, #247):** a faceless, code-drawn figure in his build (Slim · Average · Athletic · Broad · Bigger, or "Rather not say") wears his own pieces in Closet → Outfits, outfit ideas and the You card. Never on a score card or next to a score; build never changes a score; never AI, never his photo.
- **Name: KITTED.** Handles @kitted.app and @trykitted are free on TikTok/IG; trykitted.com and trykitted.app are free. Never use "getkitted" (an Australian shop).

## Overnight, Oct 11: what changed while you slept (read this first)
- **The app now scores with the parts engine** (#209). New fit checks get the parts score and parts fixes. Your old checks keep their old scores. One switch rolls back (`app/src/features/fitcheck/scoring.ts`, `DEFAULT_SCORING_ENGINE`).
- **What you'll see:**
  - The card looks almost the same, with a small chevron after "/10". Tap the score (or "Why 8.0?") for the sheet: the five-part strip (Proportions · Fit · Color · Shoes · Style), each part with its share and the reasons that moved it, then condition, occasion, "Reads as" and rows that add up to the score.
  - Fix rows say which parts they raise. A move that lifts a part but not the score shows as a "Smaller step" with no number.
  - Screenshots: `screenshots/parts-app/` (s7, s8 light/dark, s10, s11, s35).
- **Your friends' fits under it:** blazer 8.5 → 7.0 ("Swap the jeans for navy chinos → 8.0"), chore coat 8.5 → 7.0, your tee + wide jeans 7.0, your gingham shirt 6.5. About 6% of fits reach 8, and only deliberate ones.
- **Every style now has a path to 8 except outdoor** (#210–211): workwear (a chore coat with jeans and boots), streetwear (a boxy top over wide jeans with street sneakers), vintage sport, minimal, prep, smart casual. None of your saved photos happens to use those shapes, so no real score moved.
- **Styles now have rules against crossing them** (#214, parts v5, live). A graphic tee, or any oversized top, worn with two dressy pieces (trousers or chinos plus loafers, derbies or dress shoes) in an outfit that otherwise reads minimal, smart casual or prep loses 3 points on Style: your three examples go 7.0 → 6.5 "Getting there", and the card offers "Swap the graphic tee for a plain tee", "Swap the hoodie for a regular fit" or "Swap the loafers for white leather sneakers". Still fine: a tee or hoodie under a blazer or topcoat, an oversized top over straight or wide trousers (city boy), a grey sweatshirt with chinos and loafers, any streetwear outfit. No saved photo or council outfit moved. **Your calls:** 6.5 or 6.0 for these (6.0 needs a second charge on Proportions, with thin evidence); an oversized graphic tee under a blazer (no fault today); a graphic tee with chinos and white sneakers (a tip today, no points). Report: `rubric/research/parts/style-clash.md`.
- **The style rules are written down and tested** (#216). `rubric/v5-styles.md` lists, in plain words, every rule the app applies today, per style (streetwear, workwear, vintage sport, outdoor, minimal, classic prep, smart casual, no clear style) and for everyone: 121 rules, each checked by made-up test outfits (256), so a broken rule fails a test named after it. No rule was broken. It also lists 16 places where the engine differs from the research; the two worth a decision later: adding a cardigan or colored oxford (a prep marker) can cost Style a point, and the Event occasion is still judged like an interview.
- **Parts engine v6, three fixes from the written rules (#217, live; report `rubric/research/parts/v6.md`):**
  - **A prep marker no longer costs points:** a cardigan over an oxford with chinos and loafers scored 7.0 while the same outfit without it scored 7.5; both are 7.5 now. "Top to toe" counts on every look the outfit reads as, whatever the card names it.
  - **Event is softer than an interview** (your #197 OK): it expects 3–4, like a casual wedding. A hoodie, dark jeans and white sneakers at an event goes from 6.0 to 7.0; slides or sweats at an event are still held to 4.0.
  - **"Roomier than the look" is back** (the style council's bands, −1.5 on Proportions): a roomy top worn on its own over slim legs, or with no look that calls for the room, loses half a point (an oversized tee over slim jeans 7.0 → 6.5). Streetwear over wide jeans, city boy over trousers, a tucked or cropped boxy top and anything under a jacket are untouched; it never adds to the style-crossing fault. "Too wide" legs are only a tip (that reading isn't steady).
  - **None of your saved photos moved,** nor any keep-target (blazer 7.0, chore coat 7.0, gingham, tee + wide jeans 7.0; steadiness 49/49; 8+ 6%). Your call (on the list): is 6.5 right for an oversized tee over straight jeans with white sneakers?
- **Your picked styles shape the fixes, never the score** (#211). When two fixes are equally good, the one toward your look goes first. With nothing to fix, the "Next level" line names your look's way to 8. A test proves a pick can't change a score. It also closed one small leak where a pick could add 0.5. **Your call:** should a picked style ever move points? Claude's default: no, until the gold set shows raters judge that way.
- **Known gaps:**
  - Demo screen 10's re-check story broke (with the overshirt on, a long layer hides the tuck, so it drops 8.0 → 7.5). It needs a new before/after demo pair.
  - ~~The quick tap still picks its question with the old engine.~~ Fixed (#212): parts checks ask by the parts score's swing, with v4's bars. On your 11 Oct 8 checks it asks on 5 instead of 7 (the boots question drops where boots wouldn't change the score); v4 checks keep v4's questions.
  - Fit can't go above 7 until the AI can read the shoulder seam.
  - The hem stack and jacket length still can't be read.
- **Not on your phone yet:** the JS reaches it through the dev server (if Metro is running), but the face-hiding fix needs `tools/phone/install.sh`.

- **Proportions barely moves on real photos (checked Oct 11, #220, `rubric/research/parts/agreement-test.md`):** it sits at 7.0 on 78% of saved fits. Letting two readers (the main reading, a second look, the phone's ruler) vote didn't help: when they fire they're right, but they miss too often and inconsistently, so scores got less steady. Even with perfect facts the current proportion rules move only 3 scores; the real gap on your photos is bunched hems on wide jeans (your call above). Next: a tight hem-and-shoe close-up test with one yes/no question (about $0.30), and the gold set.

## Where things stand (Oct 8, 2026)

### The app build (React Native + Expo SDK 57, TypeScript; iOS first)
- **P0, the skeleton: done.**
  - Expo app in `app/`, expo-router, NativeTabs (the real iOS 26 glass tab bar).
  - Every screen has a route.
  - Demo links: `/demo/screen/<n>` on web; `-demoScreen <n>` as an iOS launch argument.
  - SQLite with migrations (V5). The web preview uses an in-memory store with the same interface.
- **The scoring engine** (`app/packages/kitted-core`, pure TypeScript):
  - Rubric v4.0 (engine 4, Oct 8, DECISIONS-LOG #81): matches `rubric.py` bit for bit on all **7,146** parity cases, and the one-quick-tap `askQuestion` on all of them. It also exposes `detectStyles` (the "Reads as …" label). Under v4 a picked style never changes a score.
  - It also has the day key (4 am rollover), the "Why" ledger, closet matching, re-check outcomes, corrections and partial-check merges.
- **P2, Stylist chat and the fit check: done (Oct 7).** It works on the iPhone Simulator and matches mockup screens 6–12 closely:
  - **Screen 6:** the reading card.
  - **Screen 7:** the 8.0 "Sharp" card, with the fix → 9.0 and "Added 4 to Closet".
  - **Screen 8:** "Why 8.0" (the rows add up).
  - **Screen 9:** "Not quite right?".
  - **Screen 10:** the re-check, 8.0 → 9.0, +1.0.
  - **Screen 11:** the partial check, 6.5, "Same shoes as Monday?".
  - **Screen 12:** Stylist home, with the morning outfit idea.
  - Also real: occasion changes re-score instantly; the same photo gets the same score; the daily limit; failures never use a check; the 9 s "Taking longer" and 14 s give-up timers.
  - **Added Oct 7:** the "Added to your closet" sheet (Undo / Add back), "Which shoes?" (pick a pair for a partial check), "What changed?" (confirm a fix the re-check missed), the photo viewer, toasts ("Logged for today." with Undo, "Saved to your tan chinos."), and an extra-large-text pass.
  - Undrawn sheets have demo screens: **21** Added to your closet · **22** Which shoes? · **23** What changed? · **24** Photo viewer.
  - P2 report with screenshots: `screenshots/p2-report/index.html` (git-ignored).
- **The morning/evening card + "Scored for": built Oct 8** (05 §MC; DECISIONS-LOG #58–62 "The morning card", #65–67). On the Simulator:
  - **Once a day,** the stylist greets him with the weather ("Morning. 46° now, 63° by afternoon. Rain likely after 5 pm.") and an outfit card: weather strip, 4 tiles, a why line, Wear this / Swap one, and "Going with your own? Check it before you leave", which opens the camera with the card's occasion and style.
  - **From 5 pm,** an evening card plans tonight ("Heading out?", Going out). After 3 ignored evenings it stops posting.
  - **Occasion and style:** tapping a pill makes it grow into its own menu (#69, `MorphPicker`; not the system menu) and re-picks the outfit.
  - **Small closet:** the card shows what it knows plus dashed tiles. A new user gets "Send me today's fit".
  - **After any check that day,** the card shrinks to one line with the score. Tapping it scrolls to the result.
  - **Results:**
    - a "Weather" tip (never points);
    - the header shows the occasion and style it was scored for; the style is fixed after the photo (#68), and the occasion opens the tray and asks "Re-score for X? It would be 7.0 instead of 8.0" before updating the same card;
    - (the "Scored for" line was replaced Oct 8 by "Reads as …", below.)
  - **Composer:** the suggestion-chip row is gone.
  - **Demo screens:** 25 morning · 26 thin closet · 27 new user · 28 wearing it · 29 after his own check · 30 evening · 31 weather ask · 32 hot day · 33 "Reads as smart casual". Screen 12 now shows the new card.
  - **Weather (Oct 14, #240):** real, from the US National Weather Service with approximate location (our own `kitted-location` module, CoreLocation reduced accuracy); asked inside the card; the coordinate is rounded and never stored. Demo screens keep sample weather. Apple WeatherKit later (plan §4b).
  - **#66 resolved by #68:** he picks the style before the photo; it can't be changed after. When the style-council rulebook is ported, "Scored for" gives way to "Reads as …".
- **The one quick tap, "Reads as …", and the new style names: built Oct 8** (DECISIONS-LOG #85–86; 02 "S5q", "S6s"). On the Simulator:
  - **When the photo leaves a look-alike in doubt** (my Oct 7 black jeans read as sweatpants), the card asks "Jeans or sweatpants?" before the score, with two buttons and Skip, which keeps what was read ("I'll score it as sweatpants."; since #125, was the generous answer). Jeans → 6.5, Sweatpants → 5.0. Nothing counts until I answer. After a Skip the card says "Scored as sweatpants. Not right? Tap." A re-check can't undo the answer.
  - **Every result names its look:** "Reads as streetwear" under the summary (never points). The "Scored for" line is gone; the Why sheet has a ±0 "Reads as" row.
  - **Style names:** Classic prep (was Preppy / Old money), Outdoor (was gorpcore), Vintage sport (was Sporty), in the morning card's menu too. Migration V5 renames stored keys.
  - **Demo screens:** 34 the question · 35 answered Jeans · 36 skipped (my Oct 7 reading on a stock photo). Screenshots: `screenshots/tap/` (git-ignored).
  - **Real:** it runs on real readings on my phone too (the question appears whenever the AI is unsure of one of the 9 look-alike pairs).
- **Card redesign + one-capsule composer + voice: built Oct 8** (DECISIONS-LOG #70):
  - **The morning card is a "hero strip":** the outfit edge to edge on top, a headline ("Layer for the cold start") with `☂ 46°→63°`, one line `Class ⌄ · Smart casual ⌄`, the reason, Wear this + Swap, and a one-line "Wearing something else? Check it ›".
  - **The composer is one Liquid Glass capsule:** a camera icon, the field, and a mic that turns into send while there's text.
  - **The mic** listens on the phone (Apple SpeechAnalyzer; audio never leaves). It needs `tools/phone/install.sh` on my iPhone; it's hidden on the Simulator.
  - **Sending a question** now shows my bubble and "Questions are coming soon…". Real answers are not built.
  - **Tab bar:** it shrinks on scroll on every tab (since Oct 9, #180).
- **Camera guidance: built Oct 8** (DECISIONS-LOG #100–103; 02 D5, S3, C4 update blocks). What you'll see:
  - **Fit-check camera:** the pill says what to fix, most urgent first: "Too dark. Face a window or turn on a light." with a **Turn on flash** button · "Step into the frame" · "Bright light behind you. Turn to face it." · too close · "Come a little closer" · move left/right · "Hold still" (Mirror only) · good. In Propped the problem tips are spoken. The 3-2-1 waits while it's too dark.
  - **After every shot or library pick,** a quick check (about 0.1–0.3 s on a phone) opens a panel over the frozen photo when it's too dark (**Retake with flash**), too blurry or backlit (**Use anyway** allowed), or can't be sent (no person, or a face we can't hide: no Use anyway).
  - **Mirror** no longer promises the volume button (not built); it says "Phone at chest height, aimed at the mirror."
  - **Scan clothes (new):** Closet **+** → Take photo / Choose photos. Rear camera, a 3:4 preview that is exactly the photo, corner brackets on each piece (copper when cut off), "3 pieces in view", the standing hint "Lay pieces flat, front side up, not overlapping.", the same live tips and after-shot panel (a person, no clothes, cut off, glare, dark, blurry). Choosing several photos lists the ones that need a look. A saved scan says "Saved for your closet. Reading clothes from photos is coming soon." Scans wait on the phone (faces hidden in the send copy) in the scan inbox for the style-council session's item reading.
  - **Real on the Simulator:** the after-shot check (the bundled photo reads fine; library photos of flowers → "I can't find clothes", a man in a tee → "I see a person") and scan saving. **Scripted:** the live camera states, and a drawn flat lay stands in for clothes on a bed. **Only on my iPhone:** live brightness, motion, piece boxes, the torch.
  - **Thresholds** were set on the Mac (no false alarms on the 52 real photos; ~90% of blurred copies caught). Real flat-lay photos haven't been tested yet: the `inputs/item-photos/` shoot will tune the scan side. Every tip and check is logged with its raw numbers (Metro, and `Documents/logs/guide.log`, which `tools/phone/pull.sh` prints).
  - **Demo screens:** 41 too dark · 42 backlit · 43 come closer · 44 after the shot: too dark · 45 can't find you · 46 scan, 3 pieces · 47 scan dark · 48 a person · 49 cut off · 50 glare · 51 no clothes · 52 scan after the shot · 53 saved. Screenshots: `screenshots/guidance/` (git-ignored).
- **Reading accuracy, "the AI names and points, the phone measures": built Oct 8** (DECISIONS-LOG #104–107; its own session). What changes:
  - **Close-ups in the scoring call:** photo prep cuts two face-hidden close-ups (upper body, lower body to the feet) and sends them with the photo in the same call. On my real photos my boots stopped reading as slides (9 of 21 → 0), tops went from 80% to 100% right, and scores got steadier (64/66 vs 60/66 photos). Cost: 0.39 → 0.57¢ per check, +0.5 s. Test: `extraction-test/results/zoom1*`.
  - **Measured on the phone after the closet call:** each piece's own pixels (person outline ∩ its box, faces and hands removed, the shirt over it subtracted) give its real color and lightness, a cut-out picture (`Documents/closet/`) and an image fingerprint. My grey hoodie measured the same lightness in 3 different photos while the AI's color words changed. It feeds the closet's matching only; it never changes a score. The closet session decides how tiles use the cut-outs.
  - **Tried and not used:** a boot definition line in the prompt (no help), leg shape from the body outline (too rough on 50 stock photos), fingerprints as a strong signal (weak for layered tops).
  - **Cost approved (founder, Oct 8, #108):** close-ups stay on for good.
  - **Real vs not yet:** all of it runs on the Mac with the app's own Swift code and builds for the Simulator. It reaches my phone after the next reinstall (`tools/phone/install.sh`). Demo photos are unchanged.
- **Stylist by day + the ask bar in the tab bar: built Oct 9** (DECISIONS-LOG #180–181). What you'll see:
  - **Stylist shows today's chat only** (4 am rollover). A clock button (top left) and an "Earlier chats ›" pill at the top open **Past chats**: one row per day ("Yesterday", "Tuesday", "Sep 24") with that day's best look and "Fit check · 6.5 Getting there"; a day opens as its own page.
  - **"Ask your stylist…" lives in the tab bar's glass** (iOS 26 accessory). Scroll down and the tab bar shrinks to a circle with "📷 Ask…" beside it; scroll up and it grows back. Tapping it opens the real text box over it, which rides the keyboard and goes away when it's empty.
  - **Scrolling** goes to the real bottom now (plain list; one day is short).
  - **Real on the Simulator** (screenshots `screenshots/stylist-oct9/`, git-ignored). Not yet seen with a real on-screen keyboard (the Simulator uses the Mac's keyboard): check typing on the phone.
- **"Going for" is built (Oct 11, DECISIONS-LOG #218; demo screens 71–78, screenshots `screenshots/going-for-app/`).** What you'll see:
  - **While it reads:** a light panel slides up inside the reading card, "While I read it · What are you going for?", with your 3 looks as small drawings plus Not sure, More (the other looks, Something else), and "Headed: Everyday ⌄". One look is already picked, with a line saying why ("Your first pick from setup."). A tap adds a check and nothing moves; the score never waits for you.
  - **On the result:** one line at the top, "Going for minimal · Everyday · Change". The card says "It reads that way too." or "Reads as smart casual. For a minimal look, the overshirt pulls the other way." with one move toward the look (no number). Change reopens the panel: a new look rewrites the tips only; a new occasion asks "Re-score for interview? …" as before.
  - **Real:** all of it runs on real readings; it never changes the score (a test checks every demo photo × every look). Mocked: nothing new. Not on your phone until Metro serves it (no reinstall needed).
- **Your Oct 11 re-check fixed (DECISIONS-LOG #219).** Your green zip hoodie over the striped oxford scored 6.5, then 7.0 on the identical photo. Now:
  - **Re-checking the same photo doesn't ask the AI again.** It keeps the same score, doesn't use up your re-check, and the card says "That's the same photo as before, so nothing changed. Make the fix, then take a new photo." with a Take a new photo button.
  - **Wrinkles, wear and stains only count when the AI is clear about that piece.** On a piece it's only "likely" about, they show in the Why sheet's Condition row as a note with no points.
  - **"Your White tee?" can't be asked about a striped or collared shirt** (a different pattern or collar means a different piece).
  - **A hoodie worn as the jacket counts as streetwear,** so your fit reads as streetwear and scores **7.5** on every reading of that photo.
  - Your friends' fits, plain fits, steadiness and the 8+ share are all unchanged. One stock photo moved (7.0 → 7.5).
  - On your phone through Metro now; no reinstall needed for this.
- **Scoring by parts is live in the app (Oct 11, DECISIONS-LOG #209).** What you'll see:
  - **New fit checks score with the parts engine** (Proportions, Fit, Color, Shoes, Style averaged, then condition and occasion). Fix rows say what they raise ("Raises Shoes and Style · free if you own one"), and a "Smaller step" tip appears when a move lifts a part but not the score. Old checks keep their old scores.
  - **Tap the score** (a small › after "/10") or "Why 8.0?": the Why sheet shows the five parts in a strip (the one with the most to gain in copper), then each part with its reasons, then Average of the parts, the bonus, Condition, Occasion, Reads as and the score. The "Reads as" line left the card.
  - **Demo stories that changed:** screen 7 is still 8.0 but has no fix now; **screen 10's re-check story broke** (wearing the overshirt reads 7.5, so it shows 8.0 → 7.5); screen 11 is 7.0. Still on the old rules: which quick-tap question gets asked, and the re-check's "new problem" test. One switch in `scoring.ts` rolls everything back. Screenshots: `screenshots/parts-app/` (git-ignored).
- **The You tab is built (Oct 14, DECISIONS-LOG #250; demo screens 17, 80–82, 84–89).** What you'll see: a gear to Settings; your style card (looks numbered 1·2·3, basics in one line, tap to edit); what your stylist knows, each fact with where it came from, a guess asked as a question; today's check. Settings: notifications (saved, sent from P6), plan & usage, appearance, units, manage/restore, acknowledgements. Privacy & data: the honest promise, "See what I send" (the real blurred copy), the "Score my fits" switch, and red delete actions that really wipe. Mocked: purchases (mock store), no trial state; hidden until you fill them: support email, privacy policy, terms.
- **Consent asked once, in the camera (Oct 14, #252).** The first camera tap shows the agreement in the camera's place; Agree opens the camera right there and is kept for good (an install with no profile used to save nothing and loop after every photo). A photo held back for consent is scored after Agree, never thrown away.
- **The score reveal is built (Oct 14, #251).** A new check's score arrives on a sliding tape that locks with one firm buzz, then the word rises in; a re-check win shrinks the old score, slides the arrow, rises to the new score with the app's only "success" buzz and springs the +1.0. Once per check, tap to skip, quiet below 6.0, a short version after your first 5. **To record it:** `-demoScreen 12 -theme dark -demoReveal 1` (the win) or `-demoScreen 7` (a first check).
- **Mocked in the demo:**
  - The AI reading: saved readings replayed with the real timing.
  - The camera: a sample-photo sheet stands in until P3.
  - Purchases: the paywall runs on a mock store (P6).
- **Tests:** `npm run check` in `app/` runs the typecheck, lint, the core tests and 345 app tests (incl. automated copy checks). All green (Oct 11).

### Other workstreams
- **Extraction test PASSED (Oct 6).** Log: `extraction-test/results/INDEX.md`.
  - **Locked config:** gemini-3.8-flash, thinking off, v3 answer format (re-confirmed Oct 8: v5 and v5s both failed), rubric v4.0.
  - **Speed and cost:** 6.6 s median, 0.42¢ per check (0.83¢ from Jan 2027), 100% consistent.
  - **Fix detection is unproven** (67–83%); real staged fix photos are needed.
  - Speed plan: `speed-and-detail-plan.md`.
  - **How to run it:**
    - Use `/usr/bin/python3`.
    - Set the key with `read -s GEMINI_API_KEY && export GEMINI_API_KEY`.
    - Turn billing on (the free tier allows 20 calls a day).
- **Rubric v4 open items from the Oct 8 phone checks (#150):** the front-tuck tip fires on hoodies (a bug, tip only); slides never become the fix (taste call, recommended a no-points next-level line); "Add a layer" repeats. Coordinate with session A, which is editing `rubric.py`.
- **Layer bias, audited Oct 9 (#160); the code-only fix is built (#162; on my phone through Metro now):** a clean outfit gets "Add a layer" or nothing (45/45 each way on 90 saved clean outfits; all 4 of my no-jacket phone checks). Cause: only the layer credit has a generic fix (shoes and "elevated piece" can only suggest closet items), it's the biggest credit, and rounding shows it as +1.0. The line is always "an overshirt or a knit", even over a hoodie and in summer. Recommended code-only fix (no score change): generic shoe and top swaps, a swap beats adding a piece on a tie, a layer line that fits what's underneath, and no layer tip on warm days. The score side (a knit worn alone counts as "Layered"; 0.75) waits for the gold set.
- **Rubric v5, "every point earned" (founder, Oct 9, #161; brief + prompts `rubric/research/v5-brief.md`):** credits earned on quality, not presence (a layer that just sits there earns little), a "finished" credit from big visible accessories (chain, belt, scarf, neck bandana, cap) inside the cap, 9+ needs a standout piece. Steps: #160 fix-engine fix → research (Codex Reddit + TikTok, Gemini YouTube, Claude editorial) → verify → rules ledger + council → paper calibration on the rated fits → new readings one at a time (flip test, ~$2) → gold set with "layered but not an 8" and accessory pairs → calibrate, lock, port. Glasses, sunglasses and anything on the head are never scored (the upload hides the whole head; glasses are mostly prescription). If the gold set slips, new rules ship as tips only.
- **Silhouette and proportion as part of v5 (founder, Oct 9, #184):** today credits are earned for having a layer or matching shoes whatever the shape, so a fit with off proportions can reach 8.5 (his friend's chore coat + fitted jeans). Plan, one step at a time: (1) **done Oct 9 (#185):** research on casual silhouette (`rubric/research/notes/v5-silhouette.md`) and tailoring (`notes/v5-tailoring.md`), 6 sources spot-checked; best rules: a waist-break reward, a long loose layer over loose pants earns no layer credit, wide legs under a close top stop costing points, a clean hem under a blazer; (2) test whether the AI can read the details each rule needs (top length, leg shape, shoulder seam, hem; ~$2); unreadable ones become tips; (3) paper test on the saved fits (the friend's fit must drop toward 7, agreed-good fits stay 8+); (4) the gold set sets the points. How styles mix comes after step 1.
- **Scoring by parts (founder, Oct 10, #195), the plan for v5:** the score becomes a weighted average of part scores (fit, proportions/silhouette, color, shoes, cohesion, condition, plus occasion), each part computed by code from AI facts or phone measurements (color most likely by script), and the card shows the parts. Gemini still only describes. **Spec approved Oct 10 (#196–197, `rubric/research/parts/SPEC.md`); reading batch 1 failed (#198: six new fields made scores less steady; only lightness and pose pass), so the missing details moved to a separate narrow second look (#199): it reliably sees a shirt peeking below a layer and pants resting on the shoe, but still not where a jacket ends, the hem stack, or the shoulder seam:** Proportions 30, Fit 25, Color 15, Shoes 15, Cohesion 15; Condition subtracts faults afterwards; Occasion only caps. It needs ~$4 of reading tests first (where tops and jackets end, a tee peeking below, the shoulder seam, lightness, hems, shoe shape).
- **Parts-engine prototype, paper-tested Oct 10 (#200, `rubric/research/parts/prototype-results.md`):** steadier than v4.1 (100% vs 96% of photos within 0.5 on repeat runs) and close to the judge panel (−0.03 vs +0.54). Your friends' blazer and chore coat go 8.5 → 7.0, your tee + wide jeans 7.0, your gingham shirt 6.5. **Tuned Oct 10 (v2, #202):** 6% of fits now reach 8 (deliberate ones only), plain fits stay 7, steadiness unchanged, fixes lift scores (tuck +0.5, slides→sneakers +0.5 to +1.0). But the 8s went mostly to tailoring: streetwear has almost no reward the readings can see. **Streetwear pass done (v3, #203):** a deliberate streetwear shape (boxy top over wide jeans with street sneakers) can now reach 8, but none of the saved photos reads that way yet, so no real score moved. Workwear and outdoor still lack a path to 8. **Card decided Oct 11 (#205):** the card stays simple; tapping the score (with a visible tap cue) opens a sheet with the five parts, the reasons, condition, occasion and "Reads as". **Oct 11: ported to core with parity (not wired into the app yet; #206):** 10,934 cases match Python exactly, nothing you'll see changes. **Its fix engine is built too (Oct 11, #208, `rubric/research/parts/fixes-results.md`; not on screen yet):** a fix shows only when the rounded score rises and names the parts it raises; a lift that doesn't move the score becomes one "Smaller step" line with no number (your friend's blazer: "Swap the jeans for navy chinos → 8.0", with the dark straight jeans as the Smaller step); free moves first, then your closet, then "free if you own one". New copy to skim: `app/src/i18n/en.ts` `pfix.*`. Next: the sheet.
- **The judges are 5 Claude subagents (#192):** streetwear, tailoring, minimal, workwear/vintage, and a 22-year-old peer. Blind, faces hidden. **They score six parts, each with written anchors (#193): fit, proportions/silhouette, color, shoes, cohesion, condition.** Claude computes each judge's score from the parts (weights 25/25/15/15/15/5 to start), and the target is the middle of the five. Trusted only after it passes the checks (same photo twice, prefers the better variant, your friends' fits near 7, scores that spread). **Pilot done Oct 10 (#194, `rubric/research/notes/judge-pilot.md`):** the app runs ~0.45 too generous (0.8 on my and my friends' photos; friend's blazer: panel 5.5 vs app 8.5). But the 5 judges are one model five times (never >0.5 apart) and compressed (83% between 6 and 7.5). Next: different models per judge, ranking + A-vs-B pairs, anchor photos, a repeat run.
- **Measure instead of guess (founder, Oct 9, #187; plan `rubric/research/v5-brief.md` → "Measure instead of guess"):** for each detail the AI keeps getting wrong, a phone-side measurement that takes over only where it beats the AI on labeled truth (clearly better, ≤30% "unsure", repeatable, works on mirror and propped shots). Garment-against-garment only, never against the body. In order, one agent each: **M1 leg shape** (tested Oct 9, #189: doesn't beat the AI, 54% vs 64%; slim vs straight looks promising but needs the gold set and size ladder), **M2 hem stack** (tested Oct 10, #190: doesn't beat the AI, 65% vs 75%; paused M3–M6 until the gold set; proposed a focused second AI look at the lower close-up instead, waiting on my OK) (unblocks the blazer-hem rule), **M3 shoe type and chunky/sleek**, **M4 tee below the jacket**, **M5 how boxy a top is**, **M6 measured colour into scoring**. Truth is the bottleneck: the gold set and the size-ladder shoot are what let these pass.
- **Fit, piece by piece (#164), planned Oct 9:** the AI names each piece's cut (fitted/regular/relaxed/oversized) and whether it's his size (too tight/right/too big) with one visible garment cue; the code judges size faults for every style and oversized-on-purpose only by proportion; the closet stores each piece's fit. Needs the size-ladder shoot. Plan in `rubric/research/v5-brief.md`. (The phone measuring sleeve, top and hem positions was tested and isn't used for now, next bullet.)
- **The fit ruler (#170), tested Oct 9 on the Mac, not in the app:** the phone finds his joints and measures where the sleeve, the top and the pants end, with no AI. **Result: it doesn't beat the AI, so nothing changes in the app and you won't see anything new.** Sleeve end: right 79% when it answers vs. the AI's 93%. Pant hem: 52% vs. 81%. Top length: a tie overall (63% vs. 64%), better only on your photos (71% vs. 43%: the AI calls your at-the-belt hoodies "mid fly"), and swapping it in changed none of your 37 saved scores. It says "unsure" on 30–54% of photos (the bar was 20%), mostly because your hanging hand is in a pocket or the outfit is dark on dark. It's perfectly repeatable (same photo, same answer). Report: `rubric/research/notes/fit-ruler.md`; rerun on the gold set with `extraction-test/fit_ruler.py`. The old leg-width probe is now out of the app's code.
- **Weights audit, Oct 9 (#183):** my black oversized tee + black wide jeans + white sneakers scored 6.5 because white leather sneakers weren't a streetwear shoe, so the outfit read as no style and lost ~1.0 for "too baggy" three ways. Fixed: it now reads as streetwear and scores **7.5 Put together** (fix: add a layer → 8.5); no test-case score moved. Also fixed on my phone (through Metro): the closet question's "In your closet" photo showing only the floor between two shoes, and "No quick fixes for this one." printed twice. Open: the wide-leg default and a blazer-over-loose-jeans rule (my to-do list).
- **Rubric v4.1, live Oct 9 (#186):** wide jeans and cargos no longer lose points, nor wide legs under a fitted, short or tucked top; sneakers under a blazer at an Interview cost 1.2. Your tan overshirt + wide jeans check goes 7.0 → 7.5. Your friends' 8.5s don't move yet: that needs better readings (the hem stack, slim vs straight).
- **Rubric v4:** `rubric/v4.md` (v3 superseded; v4.1 section at the top). Open for the gold set: the 7.0 starting point vs 6.75, whether 9+ needs a standout piece (RULEBOOK Part 10).
- **Rubric research: proportions, color, style types (done Oct 7).** Report: `rubric/research/proportions-color-style.md` (notes in `rubric/research/notes/`). Verdict: v3.1 already covers most well-supported rules, so no rewrite.
  - **Real gaps** (each needs one new coarse reading from the model): baggy jeans stacked on purpose are read as "pooling"; a thin shoe under a wide leg; top and bottom in different colors at the same middle lightness ("muddy").
  - **Bug (confirmed in code):** style exemptions need a weight ≥0.5, and onboarding gives only the 1st pick 0.5. So Streetwear picked 3rd unlocks nothing (his baggy jeans lose 0.8). Fix proposed: any picked style unlocks it when the garment is one of that style's pieces.
  - **Don't build:** color-wheel harmony, golden ratio, warm/cool, letting the model judge style or harmony (no research support; it breaks same photo → same score).
  - Proposed changes are waiting for my OK (DECISIONS-LOG #57). Nothing in the code has changed.
- **Style council: done (Oct 7).** Rulebook: `rubric/research/style-council/RULEBOOK.md` (Part 1 is the one-page summary); prototype `rubric_v4_proto.py` (matches v3.1 exactly with every switch off; Claude re-checked 2,340/2,340) and 111 test cases (all pass). DECISIONS-LOG #59–61.
  - **What it changes:**
    - Styles are detected from the clothes, and my picks never change a score.
    - Sweatpants cost one penalty, not four.
    - One garment can cost at most −1.0 for fit and proportion, and a clean outfit can't drop below 5.0 at Everyday.
    - One garment earns one credit.
    - The "Jeans or sweatpants?" tap asks on about 4% of checks.
  - **My Oct 7 outfit:** 3.5 → 6.5 read as jeans (5.0 plus the tap if misread). Saved checks at 8+: 53% → 44%. The remaining over-scoring is the 7.0 starting point, which the friend panel decides.
  - **Code-only rulings ported Oct 8 (#81):** live in `rubric.py` v4.0 and the app. Port check `check_port.py`: 100% vs the prototype. 80 of 181 demo cases changed; the p01b 8.0 → 9.0 story didn't. Differs from mockup: welcome s15 8.5 → 8.0; screen 7's next-level line (p01b reads as minimal). Next, in order:
    1. Done Oct 8: the "Jeans or sweatpants?" tap, the "Reads as …" label, and the names Classic prep and Outdoor (#85).
    2. Done Oct 8 (#91–93): the closet. A separate closet call runs after the card shows (shade, details, logo text, boxes); the matcher keeps two grey hoodies apart and asks "Same as your khaki chinos?" when unsure; corrections follow the stored link; tiles show detailed graphics. What you'll see: names like "Medium grey Nike hoodie", "Added 3 to Closet · 1 question", S11's question with both tiles and "Already in your closet". Real on your phone in the dev build (the closet call uses the dev key); demo photos replay real closet1 answers. Demo screens 37–38. Next: crops from your photo (phase 3) after the reinstall.
    3. Done Oct 8: full-resolution capture (12 MP 4:3, #83); on my phone after a reinstall.
  - **New scoring readings wait for the gold set.** v5 and the slim v5s both failed the consistency bar (#63–64), so the app stays on the locked v3 format.
  - **Also found Oct 7:**
    - The camera captured video-size frames (`sessionPreset = .high`); fixed Oct 8 (#83).
    - Closet matching merged light grey, grey and charcoal into one color; fixed Oct 8 (#91).
    - Raw closet crops aren't clean enough yet; they need full-res capture plus a cut-out.
- **Market research and positioning: done Oct 12 (#225, `market/market-research.md`).**
  - **No leader in the niche.** The biggest pure outfit rater (GRWM) has 1,866 US ratings; 64 of 107 rater apps launched in 2026, mostly with 0 ratings.
  - **The real rival is free ChatGPT**, which added try-on on Oct 1, 2026.
  - **The guys pay today for looksmax apps** that rate faces (~157K ratings).
  - **Competitors' bad reviews are mostly about paywalls and billing** (Claude's review pull).
  - **Two features are no longer unique:** "score + fix + re-check" (DRPD, Looksee) and the closet from photos (Fitted; Whering announced it).
  - **So:** lead with "send a fit pic, get a score and the one fix", then "same photo, same score", "it rates the outfit, never you", and "your daily check is free". The closet is why people stay, not the headline.
  - **Don't claim "accurate"** until the gold set backs it (r 0.33, #224), and don't use "pocket stylist" in public copy (a rival's subtitle).
  - **Expect** about 2% of downloads to pay and about 25% of yearly subscribers to renew.
  - **Niche, problem statement and differentiation are written down** (§5.1–5.3, #226).
    - **The one line:** "the only fit check that learns your closet while it rates your fits."
    - **What's unique:** the loop, not "no uploading" (Fitted already does that).
- **Research:**
  - Gemini creator research: I still need to export the Google Sheet as `.xlsx` into `inputs/`. Only rules backed by 2024+ videos count.
  - Codex sneaker deep-dive (sneakers with jeans/chinos, 2025+): results pending.
- **Timeline:** beta Nov 3, submit about Nov 14, launch about Nov 17–20.

## Next steps, in order

### Theme fix batch (#230; the review is in DECISIONS-LOG #230)
**Done Oct 12:** Archivo is in the app (score numerals, wordmark; `app/assets/fonts/`, screenshots `screenshots/archivo/`). On the founder's phone after the next `tools/phone/install.sh`.
**Built Oct 12 (#231):** the whole no-taste list plus your defaults (copper only when the score moves, spaced capitals, bluer indigo). Screenshots `screenshots/theme-batch/`. On your phone through Metro; no reinstall needed for these.
**Next:** the icon (your pick), then the share card right after onboarding (#231), then a score reveal (count-up + haptic).


### Waistline and proportions from the body (new chat, founder, Oct 14): START HERE
**Why:** the founder's idea: "we have the person's figure, so we can approximate where the waist is and use that as the reference instead of relying on the AI." Proportions are the biggest part of the score (30%), and the readings it needs are the ones the AI gets wrong: where a top ends (the AI's top-length read is 74% steady; on his photos it called at-the-belt hoodies "mid fly"), whether a top is tucked or short, the leg shape (fitted jeans read "straight"), the hem. On his Oct 14 checks the waistline credit fired on untucked tops and a hoodie, and fitted jeans got no charge (`screenshots/phone/20261014-180424/review.md`).
**His key insight:** the *anatomical* waist and the *visual* waistline are different things. The outfit moves the visual waistline (a high rise, a tuck, a cropped top, a belt, a long tee lowers it), and that visual split is what proportion advice is about (the creators' "rule of thirds", "tight waist, wide leg", "separation where the top meets the pants"; `rubric/research/creators/creators-rules.md` A3–A5, B7). So: estimate the anatomical waist from the body as a **ruler**, find the **visual waistline** the clothes create, and measure the ratio.
**Hard rules:** the body estimate is only a ruler for the clothes. It's never shown, never scored, never stored, and the same method applies to everyone (never rate bodies, CLAUDE.md "The product"). Garment-against-garment or garment-against-skeleton only. Faces stay hidden. Rule 7 (profiles) and rule 9 (memory).
**Read first (what was tried, and why it lost):** `rubric/research/notes/fit-ruler.md` (#170: joints → where top, sleeve and hem end; top length 71% vs the AI's 43% on his photos, but 30–54% "unsure": a hand in a pocket hides the hip, dark on dark); `notes/leg-probe.md` (#189), `notes/fp-leg-test.md` (#223: slim vs straight from the outline failed on 90 labelled pants); `notes/hem-probe.md` (#190); `notes/hem3.md` (#237: an ankles-down crop reads "touches the shoe" and "ankle shows" near-perfectly, but not the stack); `rubric/research/parts/agreement-test.md` (#220); `parts/proportion-headroom.md` (#222: under today's rules perfect facts move few scores, so new rules come with the measurement). Harness: `extraction-test/vision/` (`kmeasure` modes ruler, legs, hems, locate, zoom, people; the person instance mask from #247). Labels: `extraction-test/*_labels.csv`, `hem3_labels.csv`, `inputs/phone-oct8/truth.csv`; the gold set (`extraction-test/results/gold1/`).
**Do, in order:**
1. **Research (with sources):** published anthropometric proportions that place the natural waist and the hip relative to joints a phone can find (Apple Vision's body pose: shoulders, hips, knees, ankles, neck; e.g. segment-length tables such as Drillis & Contini 1966, ANSUR II), how stable they are across people, and how stylists define the visual waistline and the upper-to-lower split (rule of thirds, 1:2 / 2:1). Also how a mirror selfie's arm and phone change what's visible.
2. **Prototype on the Mac harness, no app change:** (a) the anatomical waist line from pose joints plus the ratios; (b) the visual waistline from the clothes inside the person mask: the top's hem, a waistband or belt, a tuck, found by color and edge changes along the torso axis, using the hips as a sanity window; (c) the outputs the rules need: where the top ends relative to the waist (above, at the belt, mid-fly, past the hip), tucked or not, the visual upper-to-lower split, and leg width relative to hip width (garment against garment) for slim vs straight vs wide.
3. **Test against truth** with the bar from #187: clearly better than the AI, ≤ 30% unsure, repeatable, works on mirror and propped shots. Report per output, split by mirror/propped and dark-on-dark.
4. **Only then** propose rule changes (e.g. the waist-break credit from the measured split instead of the AI's top length) for the founder's OK; a script that passes can also act as a veto on an AI read.
**Truth is the bottleneck:** his one-outfit variants (tucked/untucked, cropped, jacket on/off, cuffed/rolled) are the best truth; until they exist, label blind on saved photos as earlier tests did.

### YouTube transcripts from the founder's taste sources: done Oct 13 (#234)
**Result: `rubric/research/creators/creators-rules.md`** (per-creator notes with quotes and timestamps in `rubric/research/creators/notes/`; cleaned transcripts and the video→channel manifest in `inputs/youtube/clean/`, git-ignored; cleaner `tools/youtube/clean_vtt.py`). 32 of 45 videos read in full: Tim 5, Wanhee 7, Jaye 13, and Frugal Aesthetic 7 (**the founder's fourth taste source**, confirmed Oct 13). 13 dropped (bodies, attractiveness, confidence, skin, hair, a trailer, a promo).
**What it says:** their "okay" is the app's 7 (clean basics, nothing chosen). Their "great" = a deliberate silhouette (the app's shape credits) **plus one focal point on a quiet base**, which the app stopped rewarding in v8. All four agree on: fit and proportion first; nothing tight; no big top over narrow pants; where the pants meet the shoe makes or breaks it; a too-long top is a fault; one point, not several; loud logos are try-hard; a neutral base; deliberate smart/casual mixing is good. **None of the three calls slim jeans "dated"** (skinny, yes). Jaye alone wants accessories near-required.
**Built on it, Oct 13 (#235):** scoring **v10, "the creators' rules"**, live in Python and the app (parity exact; report `rubric/research/parts/v10.md`): slim legs cost 0.5 (was 1.0) and are no longer called "dated" (skinny stays −2.0, "dated"); one bright piece toned down by dark pieces earns +0.5 Color ([COL-11]); a knit-over-knit tip; the hem tip leads with hemming. Gold set test r 0.54 → 0.53 (the panel still doesn't reward the accent); none of the founder's or friends' saved scores moved. **And `rubric/stylist-guide.md`:** everything the four creators teach, in the stylist's voice, as the context the Stylist chat loads when real answers are built (plus the card's future tips). **Frames:** 26 outfits from their videos in `inputs/youtube/shots/`, face-hidden; `extraction-test/creator_read.py` scores them (needs the key, on the founder's list).
**The second look ships (#236):** a top showing below a jacket costs 0.5, and loose jeans dragging on slides follow "pants rest on the shoe" (+0.24¢ a check, JS only). **The hem test is ready (#237):** `extraction-test/hem_test.py`, 78 labeled photos, three runs, ~$0.28; stub report `rubric/research/notes/hem3.md`.
**Both ran Oct 13 (#238, with the app's dev key, the founder's OK):** the hem crop reads "touches the shoe" and "ankle shows" near-perfectly but **not the stack** (69%), so no hem rule moves a score and the app doesn't get a third call (`rubric/research/notes/hem3.md`). On the creators' own outfits the app agrees on 5 of 6 before/afters (a first printout said 3 of 6; corrected, #239). The script `tools/run_key_tests.sh` now reads the dev key from `app/.env.development.local`.
**v11 built Oct 13 (#239, default in Python and the app, parity exact; `rubric/research/parts/v11.md`):** a tank or tee under another top layer is judged by the layer over it in [STY-4] (Tim's tank + open flannel + pleated trousers + loafers stops losing 1.5); skinny joggers or sweats out of the gym and home pay the skinny charge (−2.0; only 3 of 73 jogger readings are skinny). Gold set and every saved check unchanged; creator pairs 5 of 6 with none against.
**Next:** his hem variants (cuffed/rolled/hitched) are the next truth for the stack; the chat, when built, loads `rubric/stylist-guide.md` as its context.

### Scoring critique, Oct 12 (#229): start here for the next scoring work
**Step 1 done Oct 12 (#232, parts v9, live in the app):** the card's advice (Finishing touch tips for hems, cuffs and a layer hanging below; dark straight jeans instead of navy chinos; the short jacket only for streetwear, workwear and vintage sport, never with sweats or slides; plainer wording) and four consensus fixes (an interview needs a collar, a knit or a jacket; same light/mid-wash double denim −1.0; an oversized graphic tee under a blazer −1.5; a loud look's own loud piece isn't "loud"). Gold set unchanged (test r 0.54); the stylist's 90 outfits 79 → 81 within 0.5; none of the founder's or friends' scores moved. Cost: more "No quick fixes" cards (the hem tip needs a better hem reading). **Next: the founder's one-outfit photos, then the hem close-up reading test.**
**Read `rubric/research/parts/v8-critique.md`.** v8 stays, but: within one source v8 is no better than v7 on held-out photos (r 0.37 vs 0.38), so stop tuning against this gold set; it can't separate 8 from 7 (Instagram 8s beat 7s 50–60%). Order: (1) card advice fixes and four consensus rule fixes (on the founder's to-do list), (2) the founder's one-outfit variants plus a second human rater, (3) the hem and length close-up reading test, then (4) the additive-scorecard redesign, judged by within-source r and "does an 8 beat a 7".

### Retune the scoring rules against the gold-set panel: done Oct 12 (#227), adopted and ported to the app the same day (#228)
**Result (report `rubric/research/parts/gold-retune.md`):** parts engine v8 candidate (`parts_proto.py`, `engine="v8"`; v7 stays the default and the app is unchanged). Held-out test photos r 0.32 → 0.54, the founder's 20 −0.09 → 0.41, steadiness unchanged within 0.5, friends' fits still 7.0, one founder check 6.5 → 7.0. Rules: narrow legs cost, loud prints cost, a tank top alone costs; a short or tucked top over wide legs earns more, over straight legs less; boxy long sleeves and stacked baggy jeans no longer cost (closes KD-2, #221); no credit for one bright piece or one standout pattern; weights 30/15/20/15/20; "problems add up". Not built: size faults, the near-suit, a shirt too long (the reading can't see them). **Ported Oct 12 (#228):** v8 is the default in Python and `@kitted/core` (parts data 1.5.0, fix catalog 1.3.0), 16,231 scoring and every fix-engine parity case exact; the Why sheet has a "Problems in more than one part" row; a new fix "Swap the tank top for a tee"; the colour Next level line now says "One quiet color, like a rust or olive knit"; the "one standout piece, like a plaid overshirt" line is retired (v8 doesn't reward it). New checks score with v8; a check stored earlier keeps its score until it's edited (correction, occasion, re-check), then it re-scores on v8, as with every earlier parts update. **What you'll see:** the demo hero (screen 7) is 7.5 "Put together" with the colour tip (was 8.0 "Sharp"); your Oct 11 green-hoodie check reads 8.0 on a new check (was 7.5); ph8 (slides) leads with "Cuff your jeans once → 7.0".

**The original brief, kept for reference.** **Why:** on 224 public photos the app's score barely follows a 5-judge panel (r 0.33; #224), and the founder's blind ratings agree with the panel (r 0.69) but not with the app (r −0.09; #225). So the panel is the target. Fit, Color and Cohesion don't track it at all (r 0.04, −0.18, 0.21); Shoes does (0.61).
**Read first:**
- `rubric/research/notes/gold-set-1.md`
- `extraction-test/results/gold1/` (`compare.txt`, `compare.json` = panel, app and per-judge scores; `scores.json` = the app's parts per run; `raw.json` = the readings, git-ignored)
- the judges' part scores and reasons: `inputs/gold-judge/judge-*-b*.csv` (map G### to the photo with `inputs/gold-judge/manifest.json`)
- the founder's ratings and notes: `inputs/gold-judge/founder/ratings.csv`
- the live rules: `rubric/v5-styles.md`, engine `extraction-test/rubrics/parts_proto.py` (v7)
**Do, on paper first (no app change until the founder sees the before/after):**
- **Hold out a test set.** Split the photos into a part to tune on and a part to test on, and never tune on the test part.
- **Find the missing rules** from the biggest disagreements and the judges' reasons:
  - size faults (a jacket or shirt a size big or small);
  - loud or busy patterns that swamp the outfit;
  - pieces from different worlds, and a mismatched near-suit;
  - a shirt too long untucked;
  - skinny or too-fitted pants (the founder docks them hard);
  - softer slides and sweats penalties under a deliberate outfit.
- **Only build a rule the reading can see.** Check the existing reading fields first. A new reading field needs the founder's OK and a steadiness test.
- **Set the 7.0 starting point** and the part weights against the panel.
- **Report:** correlation with the panel and with the founder's 20; steadiness (same photo, same score); the friends' and the founder's saved checks; the 8+ share; and a split by source.
**Rules:** rule 7 (all gold photos are profile unknown, one stated test profile); rule 9 (memory); never rate bodies; Python and `@kitted/core` stay in parity when ported.

### Proportion scripts (new chat, founder, Oct 12): start here
**Goal:** phone-side scripts (Apple Vision on the face-hidden photo and close-ups) that measure proportion directly, so Proportions stops sitting at 7.0 on most fits (#220): where the top ends, where the outer layer ends, whether the shirt underneath shows below it, where sleeves and cuffs end, how the pant hem meets the shoe (clean / break / stack), and the shoe's bulk against the leg. They take over only where they beat the AI on labeled truth (the bar from #187: clearly better, ≤30% unsure, repeatable, works on mirror and propped shots, garment against garment, never against the body).

**Read first. These were tried and lost, and the new chat should beat them, not repeat them:**
- the fit ruler: `rubric/research/notes/fit-ruler.md` (#170). Top length tied the AI overall and was better on his photos (71% vs 43%); sleeves and hems lost; 30–54% unsure (hands in pockets, dark on dark).
- the leg probe: `notes/leg-probe.md` (#189). Slim vs straight looked promising but there was too little truth.
- the hem probe: `notes/hem-probe.md` (#190). Fold counting fails on black jeans; where the pant color ends along the shin was 20/22 but too often unsure.
- the agreement test: `rubric/research/parts/agreement-test.md` (#220). The readers rarely raise false alarms but miss a lot.
- the harness: `extraction-test/vision/` (`kmeasure` modes: ruler, legs, hems, locate, zoom), run with `fit_ruler.py`, `leg_probe.py`, `hem_probe.py`.
- labels: `extraction-test/*_labels.csv` and `inputs/phone-oct8/truth.csv`.

**Ideas worth trying:**
- edges and color changes inside the person outline, along the limb axes, instead of outline width
- the 2048 px face-hidden close-ups (`Caches/detail`)
- per-garment boxes from the closet call
- the shoe's top edge as a reference for the hem
- combining a script with the AI's field as a veto (a script that can only stop a fault, never create one)

**Public labeled photos to try first (founder asked, Oct 12; Claude listed these from memory, so verify each license before downloading, and ask the founder before any download):**
- **Fashionpedia** (~48k photos): garment outlines plus attributes for length, silhouette (slim/straight/wide leg) and waistline. Annotations are CC BY 4.0, so commercial use is OK with credit; the photos keep their Flickr licenses. Best first choice.
- **DeepFashion / DeepFashion2:** landmark points for sleeve ends, hems, collar and waistline. Research use only, so internal experiments at most.
- **ModaNet:** outlines on street photos; check the license.
- **Fashion144k:** outfit votes (popularity, not quality).
All of them skew female and studio/street, not mirror selfies, so confirm on his own photos.

**Truth is the blocker:** the gold set (`inputs/gold-set/me/`, your one-outfit variants: cuffed vs not, tucked vs not, jacket on and off) and the size-ladder shoot. Until they exist, label blind on the saved photos as before.

**Rules:** CLAUDE.md rule 7 (profiles) and rule 9 (memory). No app change until a script passes and the founder sees the before/after.

**Step 1 done Oct 12 (#222, `rubric/research/parts/proportion-headroom.md`):** under today's rules even perfect proportion facts move only 4 of 79 shown scores; Proportions sits at 7.0 because of the rules, not the readings. Worth a script, in order: slim vs straight legs, a boxy-short-top measure (length + roominess), veto guards for "pooling" and "sleeves cover the hands". Only Fashionpedia's labels are commercial-safe; SAM 2.1 Tiny (Apache 2.0) is the one usable segmenter, deferred. Fashionpedia val downloaded (your OK, Oct 12).

**Retune, Oct 12 (#227–228):** parts v8 follows the panel about twice as well on held-out photos (r 0.54); the founder adopted it and it's live in the app (Python and `@kitted/core` in exact parity).

**Gold set, first run, Oct 12 (#224, `rubric/research/notes/gold-set-1.md`): the app barely tells good fits from bad.** On 225 public photos rated by a 5-judge panel (3 models, repeatable, full scale), the app's score follows the panel only weakly (r 0.33): the panel's worst fits get 6.65 from the app, its best 7.23. Only Shoes tracks the panel (r 0.61); Fit, Color and Cohesion don't (0.04, −0.18, 0.21). Your blind check of 20 agreed with the panel (r 0.69) and not the app (r −0.09; #225), so the panel is the target. Next: retune the rules against it (a new chat; brief in "Next steps"), starting with (size faults, loud patterns, pieces from different worlds, softer slides/sweats under a deliberate outfit).

**Step 2 done Oct 12 (#223, `rubric/research/notes/fp-leg-test.md`): the leg script fails on public truth.** On 90 labelled pants it tells slim from straight 56% of the time (the AI: 75%), so the old 92% was luck; leg shape stays the AI's reading. **Proportion scripts are paused until the gold set exists** (your call on the list). The lever for Proportions sitting at 7.0 is the rules, set by the gold set, not better measuring.


### Next: two workstreams from the founder's Oct 8 phone test (start each in its own chat)
- **A. Reading accuracy and uncertainty: shoe question built Oct 8 (#120–124).** What I measured on my 11 labeled Oct 8 checks (`inputs/phone-oct8/truth.csv`): **my boots were the only misread that moved my score** (fixing them alone: +0.5 to +1.0 on 6 of 11). My jeans *were* read as wide (6/8); "Swap to relaxed-leg pants" is the rule docking wide legs when the outfit doesn't read as streetwear/workwear. "Cream vs tan" was two different shirts, both read right. Hoodie/sweatshirt and the colour flips cost 0.
  - **What you'll see (on the Simulator, demo screens 60–62; on my phone whenever the shoe type is lost):** before the score, `Boots, sneakers or slides?` with three buttons and Skip (`I'll score them as slides.`). Boots on my Oct 8 slides-misread photo: 7.5 → 8.5 and the "Swap the slides" fix goes away. Skip keeps what the photo showed (no free points). Never at Gym/Home. When two questions qualify, the one that could raise the score wins (no more wasted "Jeans or sweatpants?" on jeans read right).
  - **Real:** it runs on real readings on my phone (served live by Metro). Ask rate on the saved stock photos is unchanged at Everyday (3.8%); with close-ups on, it fired on 2 of 30 of my reads.
  - **Decided not to build:** a required shoe photo or side photo (thin evidence; a side view doesn't show a boot under wide jeans either), fit questions ("slim, straight or baggy?": people answer fuzzy questions in their own favour), asking on "likely" shoe reads (it mostly asked at weddings, "were your sneakers boots?" for +1).
  - **Built Oct 8 (#126): "Your grey work boots?"** Once I've confirmed a piece (answered a question about it, or it's been seen twice), an unsure read of it asks Yes / No with its closet drawing, instead of guessing. This covers the work boot / chukka / derby split that close-ups still leave. When my closet agrees with the read, nothing is asked. Demo screens 63–64. The closet side of Yes/No (linking the sighting) is B's. Research reports: `inputs/reading-accuracy/`.
  - **Next, only if needed:** an "I wasn't sure about your shoes" line on the card, if questions prove too rare.
- **B. Closet identity and pictures: proposal ready, waiting on my look (Oct 8; DECISIONS-LOG #110–112).** Proposal page with my photos, the crop test and mockups: `screenshots/closet-identity/index.html` (git-ignored). Diagnosis: my 4 checks saved 9 pieces for my 5 real ones. All 4 duplicates came from hard "definitely different" rules on readings that are shaky when a piece is half hidden or small. A replay of my checks with the proposed rules gives 5 pieces, 4 questions and 0 wrong merges. Ranked plan:
  1. half-seen pieces ask instead of duplicating;
  2. my photo on the tile, using the best photo of each piece (fabric-filled drawing when there's none);
  3. the card's closet row shows my pieces, with ≤1 question inline;
  4. a Closet "To confirm" card, and every tile opens a piece page;
  5. names that tell pieces apart.
  The question limits are settled in #111. The parallel measure session owns crops, measured color and similarity prints (#112).
  **Steps 1 and 2 built Oct 8 (#115):** half-seen pieces ask instead of splitting (my 4 checks replay to 5 pieces, 0 wrong merges, questions 0/2/1/1), a Yes teaches the piece so the same flip doesn't ask again, and names carry a brand seen once plus strong patterns ("Grey Nike hoodie", "Tan plaid overshirt"). **And #116:** a question I haven't answered is never asked twice (later photos join it, one Yes settles all of them), and a piece waiting on my answer shows only in its question card, not as an extra tile. Real on my phone through Metro now. My old duplicates (jeans 2, Grey tee, Grey sweatshirt, Grey slides) keep the jeans asking until I answer, or merge them on the piece page (step 4). **Built Oct 8 (#117): the question card,** asked on the score card right after the rating and in Closet's "To confirm" card: my photo cropped to the piece (outlined, nothing above it, so no face), the piece in my closet, one plain reason, Yes / No; light and dark checked (demo screens 70, 38, 37). **Built Oct 9 (#118): long-press to remove** a piece in Closet ("Remove from Closet") or a look in Lookbook ("Remove from Lookbook", or "Remove look and its new pieces" for a try-on), each with Undo; the chat card stays. Next: tapping a tile opens the piece's page (merge, rename), so I can clean up my old duplicates. **Built Oct 8 (#143): code-drawn tiles everywhere** (founder: "if this is free, this is awesome"). Every closet tile, the morning card, outfit tiles, "Which shoes?", the remembered-shoes tile and "Not quite right?" now draw each piece as a shaded flat (hood, drawstrings, pouch, collars, pockets, denim stitching and wash, the leg shape and break, stripes and gingham, the brand as a plain word), for 15 top, 6 bottom and 8 shoe types, in light and dark. Real on the Simulator and my phone through Metro; screenshots `screenshots/drawn-tiles/`. Still to do: draw in the color measured from my photos (today: the shade's color). Not done yet: storing the half-seen flag (needed by step 5), and the question cap (lands with step 3).
  **Already landed (#113):** the shoe part of step 1. Boots read as "other" and then "slides" now ask instead of splitting, and workstream A's "Boots, sneakers or slides?" answer confirms the kind (boots), not a guessed subtype. **Also built (#114):** `knownPieces` plus core `knownMatches`, so A's "Your green work boots?" question can only offer pieces I confirmed or that were seen in 2+ earlier checks.

- **C. Close-ups + phone measuring (its own chat): built Oct 8 (#104–107); confirmed on my phone Oct 8 (#109).** Two real checks: close-ups cut in about 0.1 s, scoring 6.6 s (one 11.3 s while Gemini was flaky), measuring 1.0–1.5 s after the card, and a clean hoodie cut-out from the propped shot. Mirror-selfie cut-outs are now flipped back so logos read right. Still to see on the phone: the green work boots with close-ups. Later: before/after photo comparison for fix detection (needs real fix photos), and flat-lay cut-outs for scans (needs `inputs/item-photos/`).

### 0. The plan to beta (Oct 7 review, DECISIONS-LOG #56)
**Features before polish.** The Stylist tab is about 80% of the mockup's polish; the gap is scope. Closet, Lookbook, You, onboarding and the paywall are still placeholders that show spec IDs ("C1 · Closet"). There's also no server, so a release build can't score real photos (the key only loads in dev builds). Order:
1. **Quick-fix batch: done Oct 7** (DECISIONS-LOG #63; on the Simulator; the camera text reaches my phone after the next `tools/phone/install.sh`). It was:
   - Correct the camera permission text. It still says "face is cropped out"; that's wrong since #54.
   - Store kept-photo paths relative to the app folder. They're absolute today, and iOS changes that folder on reinstall, which would blank old photos.
   - Fix the dead "Later" link.
   - Stop toasts covering buttons.
   - Make all four tab icons outlines.
   - Remove the hairline under the Stylist header.
   - Fix the navy/black garment icons, which are near-invisible in dark mode.
   - Fix the sheet heights: "Not quite right?" opens too tall, "Which shoes?" too short.
   - Give the empty tabs real empty states.
2. **The morning and evening cards + "Scored for": built Oct 8** except MC9 (real weather, after enrollment) and the notification tie-in (P6). (Founder, Oct 7; DECISIONS-LOG #58–62 "The morning card", #65–67; spec in `handoff/02-screens.md` "S1d" and "S6s".) The dropdowns are now in-card trays and the style is fixed after the photo (#68). This replaces the suggestion buttons above the text box.
   - **What it is:** once a day the stylist greets him with the weather and a card holding an outfit from his closet. Code picks the outfit; templates write the words.
   - **Sources:** weather from Apple WeatherKit; location asked inside the card, approximate only.
   - **Steps:**
     - **(a) Core:** `ideas.ts` and `weather.ts`, with tests.
     - **(b) Data:** one locked idea per day, and a `WeatherSource` with demo weather.
     - **(c) The card and its states,** with the suggestion row removed and demo screens 25–28.
     - **(d) Native location + WeatherKit.** It works only after the $99 enrollment, so demo weather until then.
   - **"Going with your own?" row** (founder, Oct 7, #59): a row at the bottom of the card opens the camera with today's occasion set. After "Wear this" it becomes "Dressed? Check it on". After any check that day the card shrinks to one line with the score.
   - Weather never changes the score, only adds a tip. No predicted score on the idea.
   - **Two cards a day** (#60): a day card from 4 am, and an evening card from 5 pm that plans tonight ("Heading out?", default Going out). Evening cards stop auto-posting after 3 skipped nights.
   - **A style pull-down on the card** (#61): Streetwear, Smart casual, Minimal, Workwear, Old money, Sporty, Outdoorsy; his onboarding styles listed first.
   - **"Scored for" on every result** (#61): the card shows the occasion + style it was scored for. A plain-words line and a Why section appear only when the style actually changed the score. One style per check, never a blend.
   - **Changing the style or occasion after a score asks first** (#62): "Re-score for smart casual? It would be 7.0 instead of 8.0." Keep or Re-score. It updates the same card, never a new one.
   - Step-by-step plan: `handoff/05-build-plan.md` §MC (MC1–MC11), about 5.5 days.
3. **Closet tab: owned by the style-council session** (founder, Oct 8). **Shape approved Oct 8 (#84, `mockups/closet-concepts.html`):** Pieces | Outfits in Closet, a standing outfit (no avatar), "Goes with" on each piece, the count = combos rated Put together+ (layers don't multiply), and no scores on unworn outfits. Refined by #87 (opens on Outfits at 3+; Goes with roles; reason lines; next-buy preview; neutral wear counts). It covers the closet call, shade matching, photo crops and the tab itself, with migration V6 (V5 is the style rename, #85). The UI session doesn't plan it. It keeps the outfit picker's inputs (ClosetItemRow slot, garment, hex) and the Closet ScrollView first, so the tab bar can shrink. Also #88: a clear "No outfits yet" checklist (which of top/bottoms/shoes is missing, and the ways to add), and scanning clothes in (C4 Take photo / Choose photos, several pieces per photo) back in v1 if I OK it, after the server and P4. "Should I buy this?" is still v1.1. 02 D15 has the update block.
4. **The server** (Cloudflare Worker + D1): the scoring route, daily limits, a $3/day spending kill-switch, a new key. It gates the beta. Needs my Cloudflare account.
5. **P4 onboarding**, by about Oct 24: the age gate and consent are the App Review gate for outside testers. **Walkable since Oct 9 (#173–174, #182):** Welcome → the style step (7 drawn tiles, up to 3, "Something else?") → Basics (height optional, build, fit, birth year from a list) → Consent → Stylist with the camera open. Under 18 by birth year stops at "Kitted is for ages 18 and up." "Not now" on consent lands in Stylist, and the camera then shows the consent sheet instead; no photo is sent without consent (fixed: the scoring call didn't check before). Not built yet (hidden, not dead ends): the example check, the privacy-policy link, pick-by-name, the "Turn on fit checks" card, and after the first check the first-3-moves card, paywall and notification ask (P6). Before outside testers: the You → Privacy switch that the consent footer promises (P5).
6. **Lookbook**, then **You** (incl. "Delete all my data"; reuses P4's pieces).
7. **P6:** paywall and limit card, the 3 local notifications, the share card (defaults to the face-hidden photo, #55).
8. **Age check, App Attest (log-only), policy pages, store screenshots.**
9. **P7 polish and accessibility across every screen**, then TestFlight about Oct 31.

Deferred to v1.1:
- the volume-button shutter
- "Is this you?"
- Lookbook filters and its Saved tab
- "I bought something"
- multi-select add

P5's real size is about 6.5 days, not 05's 2.

### 1. My feedback from Oct 7: done
1. **Done: the composer no longer disappears when you tap the text box.** It rides just above the keyboard; the thread moves up with it (DECISIONS-LOG #29). Verified on the Simulator.
2. **Done: composer buttons.** The photo-library circle is gone; the camera button hides while the field is focused or has text, so the field gets the full width (#28, a logged difference from the mockup).
3. **Done: spacing pass, kept** (founder: "looks good", Oct 7). Card padding 16/20, row gap 12, fix rows 12, gap between messages 16 (#30).
- Note: the floating gear with "Tools" at the top right is the Expo development build's own menu, not app code. It isn't in release builds. In demo runs the first tap after launch sometimes only dismisses its label.

### 2. P2 leftovers (small)
1. **Rubric questions for me:** (a) correcting a detail can make the only fix vanish (DECISIONS-LOG #37). Recommended: fall back to the layering/elevate fixes; show "No quick fixes" once. (b) Two rules can pick the same fix; the card shows it once, but the engine should offer the next distinct fix (#46).
2. Done Oct 8: the "Same as your …?" duplicate question in the closet sheet (#91).
3. Thread list height drops 116 pt after a sheet closes (#34). It looks right, but understand it before P5.

### 2b. Camera guidance: built Oct 8 (its own session; #100–103)
- **Done:** live tips + the after-shot check in the fit camera, library photos and the new scan camera (`/scan`, Closet "+"); see "Where things stand".
- **Next (needs my iPhone):** reinstall (`tools/phone/install.sh`), then 5 minutes: Propped in a dim room (does "Too dark" + Turn on flash appear?), in front of a window (backlit?), walking around in Mirror (Hold still?), then scan a few pieces on the bed and one with me in it. Claude reads the `[guide]` lines (Metro or `pull.sh`) and tunes the ISO, motion and piece thresholds in `guidance.ts` (no rebuild).
- **Then:** the `inputs/item-photos/` shoot tunes the scan thresholds on real flat lays.
- **For the style-council session:** scans wait in the key-value list `scan.inbox` (`features/scan/inbox.ts`: kept/thumb/send paths under `Documents/scans`); the item reading takes them from there and adds the review sheet. The Closet "+" is an interim action sheet; `Describe it` joins when C4d is built.
- **Not built:** lens-smudge detection (can't be told from blur), front side vs. back and overlap (tips only).

### 3. P3: built; next is testing on my iPhone (full plan: `handoff/05-build-plan.md` §P3)
- **Done Oct 7:** real scoring (photo → faces blurred on the phone → Gemini → real card) and the camera (live preview, body tracking drives the guide, no live blur, 3-2-1 auto-capture with a spoken count, Propped/Mirror, flash, flip, camera-off card). Photos keep the whole outfit; my own copy stays unblurred on the phone, only the upload is blurred (#54–55). On the Simulator a sample photo stands in for the camera.
- **Phone, Oct 8:** a clean slate (app data wiped, #94), the real clock on the phone (the chat used to sort out of order), full-res capture confirmed (3024×4032, 0.6 s). Re-trusting the developer was needed after the uninstall.
- **Installed on my iPhone (Oct 7).** Setup is done (Apple ID in Xcode, Developer Mode on, developer trusted). To reinstall (every 7 days, or after native changes): plug in, unlock, run `tools/phone/install.sh`. The Metro dev server must be running (`kitted-web`) and the phone on the same Wi-Fi.
- **What Claude sees during my test:** the `[camera]`, `[prep]`, `[gemini]` and `[check]` lines in the Metro log, live; afterwards `tools/phone/pull.sh` copies the app's data and kept photos off the phone (`screenshots/phone/`, git-ignored).
- **Each test session:** unlock the phone and open Kitted (it reconnects to this Mac's dev server), then tell Claude so it can watch the log.
- Test plan: 10 propped shots (phone against something, 2–3 m away) + 10 mirror shots in my room; note any guide misfires.
- **Done Oct 8 (#83), needs a reinstall:** 12 MP 4:3 photos (the whole outfit, not the 16:9 preview crop); front photos saved true-view; Mirror opens on the rear camera; the guide's left/right judged on screen; prep at 2048 plus a face-hidden 2048 detail copy kept a week (`Caches/detail`, copied by `pull.sh`). Log lines to watch: `[camera] ready · … photo 4032×3024 …`, `[camera] captured … 3024×4032 · … MB · … ms`, `[prep] ok · source … → upload …×1024 · kept … · vision … ms · total … ms`.
- Not built yet: the Mirror volume-button shutter, the screenshot "Is this you?" question (#50).
- Then **P4 (onboarding)**: 05 §P4.

### 4. Non-build steps (mine)
1. **Replace the Gemini key before production** (decided Oct 7: keep using the Oct 6 key for development; it has a small balance).
2. Review `rubric/v3.md` and decide its 2 open questions. Also OK or veto the rubric research changes (#57): the style-exemption fix, muted accents from `saturation`, merging Preppy + Old money (name: "Classic prep"?), and the 3 new readings (`stacked` hem, `shoe_profile`, `lightness`).
   - Run the 5 Gemini/Codex prompts at the end of the rubric research report; answers go in `inputs/rubric-research/`.
3. Shoot the gold set: about 80 photos, with 3+ friends (plan in `speed-and-detail-plan.md`).
4. Claim @kitted.app / @trykitted and register trykitted.com. Then the waitlist page and the TikTok account.
5. Join the Apple Developer Program ($99/yr) and sign the Paid Apps Agreement. They block TestFlight, purchases and the age check, not the demo.

### 4c. Closet ideas from the founder (Oct 14)
- **Long-press a piece → its photo:** the native iOS long-press preview (via `@expo/ui`, already installed) shows his own photo of that piece, cropped to it with nothing above (no face), with actions under it: **Rename** and **Remove from Closet** (today's long-press action moves in). Waiting on his go.
- **Rename** closet pieces (was planned for the piece page; brought forward into the same menu).
- **Later (v1.1, with "Should I buy this?"):** a lookup of where a piece is from and whether it's worth the price. Caveats: exact product ID from one photo is unreliable (brand only when a logo shows, which the closet call already reads); "worth it" needs a priced web search, which costs per lookup.

### 4b. Weather: move to Apple WeatherKit (founder, Oct 14)
- **Now (built Oct 14, #240; on his phone after a reinstall):** real weather from the US National Weather Service (free, no key, US-only) with approximate location from our own native module; the location goes only to the weather service and is never stored.
- **Later, after the $99 Apple program:** switch the card to Apple WeatherKit (the `WeatherSource` interface stays, so it's a swap), keep the weather service as the fallback if WeatherKit fails, and update the privacy line and the location permission text back to Apple.

### 5. After launch: v1.1 (December)
- **"Should I buy this?"** In Stylist, he snaps an item in the store and gets what it goes with in his closet, "+N fits", a duplicate warning, then Buy it / Skip it. No barcodes or prices; Google Lens owns those. With a thin closet the card says what it's based on. Before building: a Codex check of Reddit and TikTok on demand. Details: DECISIONS-LOG #40.
- **"Should I buy this?" online (v1.2, #88):** while browsing a shop app or site, share the product page or a screenshot to Kitted (iOS share sheet) and get the same answer: what it goes with, "+N outfits", duplicates, Buy it / Skip it. Needs a Share Extension.
- **Fitting-room mode (v1.1, with "Should I buy this?", #88):** trying something on in a store gives a verdict: fit, "goes with 6 things you own · +9 outfits", then Buy it / Skip it, all from code. A plain mirror fit check in a fitting room already works today.
- **For launch videos now:** fitting-room fit checks already work (mirror selfie), with no new build.
- **Accessories in the rubric** (founder, Oct 8: scarves, necklaces and chains, bracelets, bandanas). Today the model reads only belt, hat, bag and watch, and the score ignores all accessories. A +0.5 belt/watch credit was dropped Oct 6 because the watch was seen in some runs and not others.
  - **Plan:** add accessory types (scarf, chain/necklace, bracelet, bandana, beanie/cap, sunglasses, rings).
  - **Scoring:** only large, easy-to-see pieces (scarf, headwear, bandana, chunky chain) can earn the existing point-of-interest credit (K3, inside the cap, so no net inflation). Small pieces stay closet and tips only. Having no accessories never costs points, and accessories count toward "too many focal points".
  - **Read them in the separate closet call** (#63), not the scoring call. Gate on a run-to-run flip test first.

## Waiting on the founder (Claude builds the default meanwhile)
- **Closet identity, 3 taste calls (#111; page `screenshots/closet-identity/index.html`):**
  1. ~~My photo on the tile?~~ **Decided Oct 8 (#141): no.** Code-drawn tiles everywhere pieces are shown (Closet, outfits, morning card); my photos only as evidence (the "Same as your …?" question and the piece page's "Seen in").
  2. ~~Fabric-filled or plain drawing?~~ **Decided (#141): the plain new drawing** in my measured color (fabric patches looked worse on prints).
  3. The question copy ("Is this your grey Nike hoodie?" · "I could only see the hood under your shirt." · "Your score stays the same either way." · "Seen once" · "To confirm"). Recommended as written.
  On a go, Claude builds #1 and #5 first (no taste involved), then #3 and #4, then #2. To let Claude screenshot my real closet: tap "Let Claude use it" on the "Kitted Closet B" Simulator (it holds a copy of my phone data).
- **"Reads as" when two looks fit (#86):** screen 7 reads "smart casual" because my first pick breaks the tie, while its next-level tip is the minimal one. Default: keep the tie-break. The other choice: always the first detected look.
- **Shoot ~20 photos of your own clothes for the scanning test (#88; approved: $1 test, free up to 30/day).** Put them in `inputs/item-photos/`. They also tune the scan camera's tips (#101): you can take them with the new Closet **+** → Take photo after the reinstall, or with the phone's camera. Phone camera, normal room light:
  - 6 single pieces flat on your bed (a tee, a hoodie, jeans, chinos, a jacket, a patterned or logo piece)
  - 3 on a hanger against a door or wall
  - 2 pairs of shoes on the floor
  - 4 group shots with 3–4 pieces laid flat, not overlapping
  - 2 dark pieces in dim light (the hard case)
  - 2 messy ones (a piece on a chair, a piece half folded)
  - 1 of you holding a shirt up in a mirror (checks the face-blur rule)
  The style-council session writes the item prompt and test and runs it.
- **Closet details I settled from Codex's Reddit research (#87; veto if you disagree):** Closet opens on Outfits once he can make 3+; "Goes with" labels Best match / Dressier / More relaxed; a plain reason on every outfit; next best buy named by kind (no brands, no shop links) and shows what it unlocks; neutral wear counts, no "not worn lately" nudges.
- **Mic permission text** (outward-facing; in `app/app.config.ts`): "Kitted uses the microphone so you can ask your stylist out loud. Your voice is turned into text on your phone."
- **Reinstall on my phone** (`tools/phone/install.sh`) to get the mic and the new permission texts, then try voice input. It can't be tested on the Simulator. The same reinstall brings the 12 MP camera (#83) and camera guidance (#101): take a few Propped and Mirror shots (one in a dim room, one against a window) and scan a few clothes while Claude watches the log.
- **Morning-card copy to skim** (`app/src/i18n/en.ts` → `addedInBuild`, under "Morning/evening card" and "Re-score"): greetings, weather lines, why lines, the "Wearing something else?" link, the re-score alert. The style names are settled (Classic prep, Outdoor, Vintage sport; #82, #85).
- **Weather band numbers** (core `weather.ts`, for the rubric review): 80 / 65 / 50 / 35 °F feels-like, rain 50%+, a 15° swing. Hot days also favor tees and lighter shoes.
- **Archivo fonts:** 3 files of about 185 KB each, OFL license, from `github.com/Omnibus-Type/Archivo` (`fonts/ttf/`). Default: the system font. When approved:
  - fill the map in `app/src/design-system/fontFiles.ts`
  - uncomment the expo-font plugin in `app/app.config.ts`
  - rebuild
- **Copy I wrote that isn't in the copy deck:** `app/src/i18n/en.ts` → `addedInBuild` holds the card summaries, the 27 rule names, the VoiceOver lines, and (new Oct 7) the closet-sheet rows ("Top · Regular fit"), the viewer caption ("Date · October 22") and "Pick shoes from your closet". New Oct 8: "One quick tap" (the hint, Skip lines, "Not scored. You sent a newer photo, so nothing was counted.", VoiceOver), "Reads as", and the closet's lines (#92: "Checking the details…", "1 question", "Already in your closet", "Not the same", "It's my …", "Saved as your …", "Kept as a new piece."). Also new Oct 8: the camera guidance lines (`cam.tip.*`, `cam.retake.*`, `scan.*`: the tips, the after-shot titles, "Saved for your closet" and "Reading clothes from photos is coming soon."). Skim it.
- **Already built; just confirm:**
  - The "Why" sheet's "Rounded to the nearest half · +0.25" line.
  - "Dialed in. Nothing to fix." only at 9+.
  - A correction before a re-check gives the honest 8.5, not 9.0.
- **Later decisions:**
  - RevenueCat vs. expo-iap for purchases (recommended: RevenueCat with our own paywall).
  - Install Maestro (UI tests) before P7.
  - A 16+ app in 2027.

## How to run things
- **Node and Xcode:** Node 22.23; Xcode 26.6 at `/Applications/Xcode-26.6.app`, selected with `xcode-select`. Leave Xcode 26.3 alone.
- **Simulator:** iPhone 17 Pro, iOS 26.5, UDID `111D0A09-C2CA-4F72-BF3C-44019A05C89D`, bundle id `com.trykitted.kitted`.
- **Metro and the web preview:** run by the `kitted-web` launch config (`.claude/launch.json`). Start it with the Browser pane's `preview_start` tool, `name: "kitted-web"`. The dev build hot-reloads from it.
- **"The app won't open on my phone" (Oct 9):** the phone's dev build loads everything from Metro, so check two things first: is `kitted-web` running (it stops when the app closes it), and has the Mac's address changed (new Wi-Fi; `ipconfig getifaddr en0`)? Start Metro, then rerun `tools/phone/install.sh`; it opens the app at the current address. The phone must be on the same Wi-Fi as the Mac. If it ends with "The application failed to launch" (CoreDeviceError 10002), the app is installed but the phone was locked: unlock it and run the launch line again (Oct 10). If instead it says "invalid code signature … not been explicitly trusted by the user" (Oct 13), the build is fine but the phone dropped its trust: Settings → General → VPN & Device Management → Apple Development: eyuhaile5@gmail.com → Trust, then launch again. The free signing permit lasts 7 days from when Xcode makes it (`embedded.mobileprovision` ExpirationDate; the current one ends Oct 14, 22:22 UTC); after that, rerun `install.sh`.
- **Rebuild native** only after a native package or `app.config.ts` change. After an `app.config.ts` change, run prebuild first: `run:ios` doesn't regenerate `ios/Kitted/Info.plist`, so the old strings ship.
  ```bash
  cd app && LANG=en_US.UTF-8 npx expo prebuild --platform ios --no-install
  ```
  ```bash
  cd app && LANG=en_US.UTF-8 npx expo run:ios --device 111D0A09-C2CA-4F72-BF3C-44019A05C89D --no-bundler
  ```
  Use the UDID, not the name: "iPhone 17 Pro" also matches a broken duplicate Simulator (EF7ADF2A, runtime missing; Oct 14).
- **Open a demo screen on the Simulator, then take a screenshot:**
  ```bash
  xcrun simctl launch 111D0A09-C2CA-4F72-BF3C-44019A05C89D com.trykitted.kitted -demoScreen 7 -theme light -demoLatency 0
  ```
  ```bash
  xcrun simctl io 111D0A09-C2CA-4F72-BF3C-44019A05C89D screenshot shot.png
  ```
  Don't use `simctl openurl`: iOS shows an "Open in Kitted?" prompt that can't be dismissed by script.
- **Web preview:** `http://localhost:8081/demo/screen/<n>?theme=dark&frame=1`. Use it for layout only; iOS is the truth.
- **Screenshots vs. the mockup:**
  - `tools/mockshots/preview.sh <n> light|dark` renders a mockup screen.
  - `tools/mockshots/webshot.sh <n> light|dark` renders the web preview.
  - `tools/mockshots/compare.html` puts them side by side.
  - Output goes to `screenshots/` (git-ignored).
- **Ask before:** installing anything, any download, any new npm package outside `handoff/05-build-plan.md` §1.1, any EAS build, or making the repo public.

## Which document wins when they disagree
Highest first:
1. What I say in chat.
2. **This file.**
3. `brainstorm/13_setup-decisions.md` (the referee's rulings).
4. `handoff/` (01–06, fixtures). Each doc owns its area:
   - **02:** screens and copy
   - **03:** the design system
   - **04:** logic and data. A generated fixture beats its prose.
   - **05:** process and environment
5. `app-build-spec.md`.
6. `demo-app-spec.md` and older brainstorm files.

Exceptions:
- **The mockups win on layout and copy,** except where `02` says "differs from mockup because…".
- **`rubric.py` wins on scoring.** The TypeScript must match it; never edit the fixtures to make tests pass.

## Docs map
| File | What it's for | State |
|---|---|---|
| `handoff/DECISIONS-LOG.md` | Every decision and lesson since the build started (#1–40) | **Live**; append to it |
| `handoff/01-product-brief.md` | Product, locked rules, voice | Reference |
| `handoff/02-screens.md` | Every screen: layout, copy deck §5, states, VoiceOver | Reference (copy is generated into `app/src/i18n/`) |
| `handoff/03-design-system.md` | Tokens, type, components, SF Symbols | Reference |
| `handoff/04-logic-and-demo-data.md` + `handoff/fixtures/` | Rubric port, fixes, re-check, seed data, expected scores | Reference |
| `handoff/05-build-plan.md` | Stack (§1.1), phases P0–P8 with acceptance checks, traps (§7) | Reference; its Oct 6 environment notes are outdated (see "How to run things") |
| `handoff/06-react-native-mapping.md` | How the SwiftUI terms in 02/03 map to React Native | Reference |
| `handoff/p2-design-spec.md` | Measured spec for the chat and cards (screens 6–12) | Reference |
| `mockups/kitted-mockups.html` | The visual source of truth | Reference |
| `app-build-spec.md` | Engineering spec: pipeline, proxy (Cloudflare Worker + D1), milestones M0–M4. Its SwiftUI parts are replaced by 05/06 | Reference, partly stale |
| `rubric/v5-styles.md` | **The current plain-words rules of the parts engine** (v5), per style and shared, each rule with an ID and test outfits (`extraction-test/rules_conformance.py`, `rulesConformance.test.ts`); "Known differences" from the research at the end | **Live**; edit with every rule change |
| `rubric/v4.md` (v3.md superseded), `extraction-test/` | The old v4 rules in plain words (v4.1 still scores old checks); the vision test tools and results | Reference |
| `research-context.md`, `brainstorm/`, `inputs/*.md` | Research, competitors, legal, UX checklist §C14 | Reference |
| `market/market-research.md` (+ 4 detail files in `market/`) | Market research and positioning (Oct 12, #225): competitors, market size, free substitutes, pricing benchmarks, App Store search, the founder's research tasks | **Live**; update when positioning or pricing changes |
| `rubric/stylist-guide.md` | What the stylist knows, from the four creators, in its own voice: the chat's context and the card's tips (Oct 13, #235) | **Live**; the chat loads it |
| `rubric/research/parts/v10.md` | Scoring v10, the creators' rules: what changed and the before/after (Oct 13, #235) | Reference |
| `rubric/research/creators/creators-rules.md` (+ `notes/`) | How Tim Dessaint, Wanhee Kim, Jaye Alexander (and Frugal Aesthetic) judge outfits, from 32 transcripts (Oct 13, #234): shared rules, contradictions, each mapped to `v5-styles.md`, ranked engine proposals, the outfits to screenshot | **Live** until the proposals are decided |
| `rubric/research/parts/v8-critique.md` | Four critics on v8 (Oct 12, #229): can't tell 8 from 7, the source confound, missing readings, wrong rules, the card's advice, the model design; recommended order | **Live** |
| `rubric/research/parts/gold-retune.md` | The v8 retune against the gold-set panel (Oct 12, #227): what changes on the card, before/after numbers, what's still wrong; scripts `extraction-test/gold_tune.py`, `gold_features.py` | **Live** until v8 is ported or dropped |
| `rubric/research/v5-brief.md` | Rubric v5 plan (Oct 9): what "meticulous" means, the 8 steps, research questions, the Codex/Gemini prompts | **Live** until v5 locks |
| `rubric/research/parts/proportion-headroom.md`, `rubric/research/notes/fp-leg-test.md` | Proportion scripts (Oct 12, #222–223): which facts can move a score; the leg probe on Fashionpedia (fails) | Reference |
| `rubric/research/notes/fit-ruler.md` | The fit ruler test (Oct 9, #170): phone-measured sleeve, top and hem vs. the AI; not adopted; how to re-test | Reference |
| `rubric/research/proportions-color-style.md` | Rubric research (Oct 7): proportions, color, style types; ranked changes; Gemini/Codex prompts | Reference |
| `mockups/closet-concepts.html` | Closet tab research (Oct 8): where combinations live, avatar verdict, wireframes, sources | Approved (#84); the UI brief for the Closet tab |
| `speed-and-detail-plan.md`, `testing-plan.md` | Vision speed plan; the 5 validation tests | Reference |
| `demo-app-spec.md` | Older product spec | Stale; overridden by everything above |
| `handoff/archive/` | Superseded docs (the original handoff brief, review notes, the P2 plan, the SwiftUI starter) | History only; don't follow |

## Lessons from the build (details in DECISIONS-LOG)
- **Hermes on iOS lacks `Intl.PluralRules` and parts of `Intl` time zones.** No `Intl` in app code without checking it on iOS. Use `app/src/i18n/format.ts` and core `time.ts`.
- **A scrolling iOS sheet must have its ScrollView as the root.** Use `SheetScaffold`. A sticky header's row layout must sit one View deeper.
- **No `inverted` FlatList on iOS 26** (the edge fade washes it out). `scrollToEnd` ignores padding, so use a footer spacer.
- **Web preview limits:**
  - No `ui-monospace` in Chrome; web uses CSS font stacks.
  - Some `AccessibilityInfo` calls are missing on web.
  - SVG can't take iOS accessibility props; wrap it in a View.
  - Headless Chrome can't go narrower than about 500 px; `frame=1` boxes the app at 402 × 874.
- **Run `npm run check`, then commit, as separate steps.** Chaining them once committed a type error.
- **Large text:** at AX sizes rows stack (`isAccessibilitySize`), and control labels cap at 2× (`CONTROL_TEXT_MAX_SCALE`); wrapping 3-line button labels got clipped on iOS.
- **A card that changes behind a sheet** needs a scroll-to-end after the sheet closes (Stylist does it on focus, 400 ms).
- **`simctl io … screenshot` can fail silently** when the target file exists and is protected; write to a new path.
- **Apple Vision on the Simulator** needs the CPU forced (`setComputeDevice`), or every request fails with "Could not create inference context".
- **Never send a photo when his head/face can't be found** (`couldNotFrame`, ruling 10); a photo whose body runs off the top edge has no face to hide and is sent.
- **react-native-svg keeps a dash pattern after `strokeDasharray` is removed;** key the shape by state to redraw it.
- **A new Swift file in a local module needs `pod install`** before Xcode sees it ("cannot find … in scope").
- **Don't trust FlatList `scrollToEnd` while rows grow;** it uses cached row heights. Scroll to the height from `onContentSizeChange` (StylistScreen `toEnd`).
- **An alert raised from a SwiftUI `Menu` item is dropped while the menu closes;** wait about 450 ms (`confirmLens`; the menus are gone since #68, but the wait stays harmless).
- **Menus that open from a control float in a Modal at its measured spot** (`MorphPicker`), so the thread never moves or clips them.
- **Demo gating:** read `getDemoArgs().demoScreen`, not the demo state, in code that runs while a demo screen loads.
- **The closet is the closet service's** (`features/closet/service.ts`, #91): fit-check writes go through `patchCheckKeepCloset`, which keeps `closetSummary` and `itemIds`; never write those from the fit-check service. In tests, share one id factory between services (two counters both made `R-1`).
- **expo-sqlite `INSERT OR REPLACE` moves a patched row to the end of `all()`;** sort lists explicitly.
- **Demo screen numbers may skip** (parallel sessions number from their own block); `-demoScreen` is capped at the highest `n`, not the count (#103).
- **Simulator Vision:** `VNClassifyImageRequest` on the CPU gives meaningless labels (the same for different photos); person, face and piece checks work. Judge the clothes label on the Mac harness or the phone (#103).
- **The dev build's floating "Tools" button covers the top-right header button** and takes its taps; drag it away when testing.
- **Parallel sessions share files: stage only your own hunks** (`git add -p`) of shared files like core `index.ts`, and check HEAD alone with `npx tsc --noEmit -p app/packages/kitted-core` in a clean worktree. A worktree whose `node_modules` is symlinked to this folder typechecks this folder's core, not HEAD's (#127).
- **iOS 26 tab-bar shrink on scroll needs the screen's first view to be a ScrollView** (not a FlatList, not wrapped in a View; a sibling after it is fine). The Simulator tool's instant taps miss glass header buttons; tap with `duration: 0.15` (#181).
- **No `KeyboardAvoidingView` around absolutely positioned docks.** Its padding stacks on the fixed `bottom`. Drive the dock from `useAnimatedKeyboard` (see `StylistScreen.tsx`).

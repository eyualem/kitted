# Kitted: a men's pocket-stylist iOS app

**This file is the one place for current status and instructions.** Read it first in every new chat, then open only the reference docs the task needs (the "Docs map" below). **Last updated: Oct 8, 2026.**

## How we keep context (rules for every chat)

1. **This file holds the live state:** where things stand, what's next, what's waiting on the founder, and how to run things. Keep it true.
   - Update it whenever a decision is made or a step is finished.
   - Always update it at the end of a session. Don't wait to be asked.
   - Don't start new status, handoff or plan files. Put that content here instead.
2. **Reference docs** (specs, research) hold detail too big for this file. When a decision changes one of them, edit that doc in the same session. If a doc goes stale, fix it or move it to `handoff/archive/` and remove it from the map.
3. **`handoff/DECISIONS-LOG.md`** is the append-only record of decisions and technical lessons, with the reasons. Add a numbered entry whenever you settle a contradiction or change a decision.
4. **Commit and push to GitHub** (`eyualem/kitted`, private) after every finished step.
5. Work only in this folder. Codex and Gemini research outputs go in `inputs/`.

## Who I am and how I like to work
- **Who I am:**
  - A college student building a consumer iOS app for income, alone.
  - **$0 marketing budget**; I post short-form video daily.
  - I'm into style, anime and good movies.
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
- **Name: KITTED.** Handles @kitted.app and @trykitted are free on TikTok/IG; trykitted.com and trykitted.app are free. Never use "getkitted" (an Australian shop).

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
  - **Mocked:** all weather is **sample weather**, labelled on the card. Real WeatherKit + location (MC9) waits on the $99 program.
  - **#66 resolved by #68:** he picks the style before the photo; it can't be changed after. When the style-council rulebook is ported, "Scored for" gives way to "Reads as …".
- **The one quick tap, "Reads as …", and the new style names: built Oct 8** (DECISIONS-LOG #85–86; 02 "S5q", "S6s"). On the Simulator:
  - **When the photo leaves a look-alike in doubt** (my Oct 7 black jeans read as sweatpants), the card asks "Jeans or sweatpants?" before the score, with two buttons and Skip ("I'll score it as jeans."). Jeans → 6.5, Sweatpants → 5.0. Nothing counts until I answer. After a Skip the card says "Scored as jeans. Not right? Tap." A re-check can't undo the answer.
  - **Every result names its look:** "Reads as streetwear" under the summary (never points). The "Scored for" line is gone; the Why sheet has a ±0 "Reads as" row.
  - **Style names:** Classic prep (was Preppy / Old money), Outdoor (was gorpcore), Vintage sport (was Sporty), in the morning card's menu too. Migration V5 renames stored keys.
  - **Demo screens:** 34 the question · 35 answered Jeans · 36 skipped (my Oct 7 reading on a stock photo). Screenshots: `screenshots/tap/` (git-ignored).
  - **Real:** it runs on real readings on my phone too (the question appears whenever the AI is unsure of one of the 9 look-alike pairs).
- **Card redesign + one-capsule composer + voice: built Oct 8** (DECISIONS-LOG #70):
  - **The morning card is a "hero strip":** the outfit edge to edge on top, a headline ("Layer for the cold start") with `☂ 46°→63°`, one line `Class ⌄ · Smart casual ⌄`, the reason, Wear this + Swap, and a one-line "Wearing something else? Check it ›".
  - **The composer is one Liquid Glass capsule:** a camera icon, the field, and a mic that turns into send while there's text.
  - **The mic** listens on the phone (Apple SpeechAnalyzer; audio never leaves). It needs `tools/phone/install.sh` on my iPhone; it's hidden on the Simulator.
  - **Sending a question** now shows my bubble and "Questions are coming soon…". Real answers are not built.
  - **Tab bar:** it shrinks on scroll in Closet and Lookbook.
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
  - **Real vs not yet:** all of it runs on the Mac with the app's own Swift code and builds for the Simulator. It reaches my phone after the next reinstall (`tools/phone/install.sh`). Demo photos are unchanged.
- **Mocked in the demo:**
  - The AI reading: saved readings replayed with the real timing.
  - The camera: a sample-photo sheet stands in until P3.
  - Purchases: the paywall runs on a mock store (P6).
- **Tests:** `npm run check` in `app/` runs the typecheck, lint, 151 core tests and 266 app tests (incl. automated copy checks). All green (Oct 8).

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
- **Rubric v4:** `rubric/v4.md` (v3 superseded). Open for the gold set: the 7.0 starting point vs 6.75, whether 9+ needs a standout piece (RULEBOOK Part 10).
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
- **Research:**
  - Gemini creator research: I still need to export the Google Sheet as `.xlsx` into `inputs/`. Only rules backed by 2024+ videos count.
  - Codex sneaker deep-dive (sneakers with jeans/chinos, 2025+): results pending.
- **Timeline:** beta Nov 3, submit about Nov 14, launch about Nov 17–20.

## Next steps, in order

### Next: two workstreams from the founder's Oct 8 phone test (start each in its own chat)
- **A. Reading accuracy and uncertainty.** Five real checks (Metro log): his boots were read as "other" ×4 and once as "slides" (that read gave the fix "Swap the slides for chunky sneakers → 8.5"); his very baggy black jeans were read as jeans, but never as wide ("Swap to relaxed-leg pants"); the same overshirt read cream vs tan; and the hoodie read as hoodie vs sweatshirt. Ideas to brainstorm: a side photo, asking whenever a score-moving reading is uncertain (not only the 9 tap pairs), explaining the uncertainty on the card, and measuring accuracy on his labeled photos.
- **B. Closet identity and pictures: proposal ready, waiting on my look (Oct 8; DECISIONS-LOG #110–112).** Proposal page with my photos, the crop test and mockups: `screenshots/closet-identity/index.html` (git-ignored). Diagnosis: my 4 checks saved 9 pieces for my 5 real ones. All 4 duplicates came from hard "definitely different" rules on readings that are shaky when a piece is half hidden or small. A replay of my checks with the proposed rules gives 5 pieces, 4 questions and 0 wrong merges. Ranked plan:
  1. half-seen pieces ask instead of duplicating;
  2. my photo on the tile, using the best photo of each piece (fabric-filled drawing when there's none);
  3. the card's closet row shows my pieces, with ≤1 question inline;
  4. a Closet "To confirm" card, and every tile opens a piece page;
  5. names that tell pieces apart.
  The question limits are settled in #111. The parallel measure session owns crops, measured color and similarity prints (#112).
  **Already landed (#113):** the shoe part of step 1. Boots read as "other" and then "slides" now ask instead of splitting, and workstream A's "Boots, sneakers or slides?" answer confirms the kind (boots), not a guessed subtype. B also owes A a `knownPieces(closet)` list for a later "Your green work boots?" question: pieces he confirmed or that were seen 2+ times, with slot, color family, type and shoe kind (v3 fields only). Build it when A pings.

- **C. Close-ups + phone measuring (its own chat): built Oct 8 (#104–107).** Next: after the reinstall, 3–4 real checks while Claude reads the `[prep] … close-ups …` and `[measure] …` lines (prep time, close-up sizes, measured colors). Later: before/after photo comparison for fix detection (needs real fix photos), and flat-lay cut-outs for scans (needs `inputs/item-photos/`).

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
5. **P4 onboarding**, by about Oct 24: the age gate and consent are the App Review gate for outside testers.
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
- **Close-ups cost +47% per scoring call (#105): 0.39 → 0.57¢ now, about 0.8 → 1.1¢ from Jan 2027.** Default: on (`SEND_CLOSE_UPS` in `app/src/services/readingSource/gemini.ts`; `false` reverts to the Oct 6 lock). Recommended: keep it. It removed the wrong "slides" fixes and made scores steadier.
- **Closet identity, 3 taste calls (#111; page `screenshots/closet-identity/index.html`):**
  1. Is my photo on the tile good enough, with the hand and phone showing on mirror-selfie tops? Recommended: yes.
  2. For pieces without a clean photo, a drawing filled with my fabric, or the plain drawing? Recommended: my fabric.
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
- **Rebuild native** only after a native package or `app.config.ts` change. After an `app.config.ts` change, run prebuild first: `run:ios` doesn't regenerate `ios/Kitted/Info.plist`, so the old strings ship.
  ```bash
  cd app && LANG=en_US.UTF-8 npx expo prebuild --platform ios --no-install
  ```
  ```bash
  cd app && LANG=en_US.UTF-8 npx expo run:ios --device "iPhone 17 Pro" --no-bundler
  ```
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
| `rubric/v4.md` (v3.md superseded), `extraction-test/` | Style rules in plain words; the vision test tools and results | Reference |
| `research-context.md`, `brainstorm/`, `inputs/*.md` | Research, competitors, legal, UX checklist §C14 | Reference |
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
- **No `KeyboardAvoidingView` around absolutely positioned docks.** Its padding stacks on the fixed `bottom`. Drive the dock from `useAnimatedKeyboard` (see `StylistScreen.tsx`).

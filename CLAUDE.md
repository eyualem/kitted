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
  - SQLite with migrations (V3). The web preview uses an in-memory store with the same interface.
- **The scoring engine** (`app/packages/kitted-core`, pure TypeScript):
  - Rubric v4.0 (engine 4, Oct 8, DECISIONS-LOG #81): matches `rubric.py` bit for bit on all **7,146** parity cases, and the one-quick-tap `askQuestion` on all of them. It also exposes `detectStyles` (the "Reads as …" label); the tap UI and the label UI aren't built yet. Under v4 a picked style never changes a score, so "Scored for" never shows.
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
    - a "Scored for streetwear: …" line and a Why-sheet section appear only when the style changed the score.
  - **Composer:** the suggestion-chip row is gone.
  - **Demo screens:** 25 morning · 26 thin closet · 27 new user · 28 wearing it · 29 after his own check · 30 evening · 31 weather ask · 32 hot day · 33 "Scored for streetwear". Screen 12 now shows the new card.
  - **Mocked:** all weather is **sample weather**, labelled on the card. Real WeatherKit + location (MC9) waits on the $99 program.
  - **#66 resolved by #68:** he picks the style before the photo; it can't be changed after. When the style-council rulebook is ported, "Scored for" gives way to "Reads as …".
- **Mocked in the demo:**
  - The AI reading: saved readings replayed with the real timing.
  - The camera: a sample-photo sheet stands in until P3.
  - Purchases: the paywall runs on a mock store (P6).
- **Tests:** `npm run check` in `app/` runs the typecheck, lint, 102 core tests and 156 app tests (incl. automated copy checks). All green (Oct 8).

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
    1. The "Jeans or sweatpants?" tap and the "Reads as …" label on the card (wording approved), and the onboarding names Classic prep and Outdoor.
    2. The closet: a separate closet call after the card shows (approved #63: shade, details, logo text, boxes for crops), and matching by exact shade so two grey hoodies don't merge.
    3. Full-resolution capture in the camera (needs a reinstall).
  - **New scoring readings wait for the gold set.** v5 and the slim v5s both failed the consistency bar (#63–64), so the app stays on the locked v3 format.
  - **Also found Oct 7:**
    - The camera captures video-size frames (`sessionPreset = .high`), not full-resolution photos.
    - Closet matching merges light grey, grey and charcoal into one color.
    - Raw closet crops aren't clean enough yet; they need full-res capture plus a cut-out.
- **Research:**
  - Gemini creator research: I still need to export the Google Sheet as `.xlsx` into `inputs/`. Only rules backed by 2024+ videos count.
  - Codex sneaker deep-dive (sneakers with jeans/chinos, 2025+): results pending.
- **Timeline:** beta Nov 3, submit about Nov 14, launch about Nov 17–20.

## Next steps, in order

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
3. **Closet tab** (on demo data, while I phone-test); it reuses the outfit picker from step 2. Tiles use the garment icons in the item's color, not photo cut-outs. Photo-adding items and "Should I buy this?" go to v1.1.
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
2. The "Same as your white tee?" duplicate question in the closet sheet waits for real closet matching (P3+, #31).
3. Thread list height drops 116 pt after a sheet closes (#34). It looks right, but understand it before P5.

### 3. P3: built; next is testing on my iPhone (full plan: `handoff/05-build-plan.md` §P3)
- **Done Oct 7:** real scoring (photo → faces blurred on the phone → Gemini → real card) and the camera (live preview, body tracking drives the guide, no live blur, 3-2-1 auto-capture with a spoken count, Propped/Mirror, flash, flip, camera-off card). Photos keep the whole outfit; my own copy stays unblurred on the phone, only the upload is blurred (#54–55). On the Simulator a sample photo stands in for the camera.
- **Installed on my iPhone (Oct 7).** Setup is done (Apple ID in Xcode, Developer Mode on, developer trusted). To reinstall (every 7 days, or after native changes): plug in, unlock, run `tools/phone/install.sh`. The Metro dev server must be running (`kitted-web`) and the phone on the same Wi-Fi.
- **What Claude sees during my test:** the `[camera]`, `[prep]`, `[gemini]` and `[check]` lines in the Metro log, live; afterwards `tools/phone/pull.sh` copies the app's data and kept photos off the phone (`screenshots/phone/`, git-ignored).
- **Each test session:** unlock the phone and open Kitted (it reconnects to this Mac's dev server), then tell Claude so it can watch the log.
- Test plan: 10 propped shots (phone against something, 2–3 m away) + 10 mirror shots in my room; note any guide misfires.
- Not built yet: the Mirror volume-button shutter, the dark/blurry retake panel, the screenshot "Is this you?" question (#50).
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
- **For launch videos now:** fitting-room fit checks already work (mirror selfie), with no new build.
- **Accessories in the rubric** (founder, Oct 8: scarves, necklaces and chains, bracelets, bandanas). Today the model reads only belt, hat, bag and watch, and the score ignores all accessories. A +0.5 belt/watch credit was dropped Oct 6 because the watch was seen in some runs and not others.
  - **Plan:** add accessory types (scarf, chain/necklace, bracelet, bandana, beanie/cap, sunglasses, rings).
  - **Scoring:** only large, easy-to-see pieces (scarf, headwear, bandana, chunky chain) can earn the existing point-of-interest credit (K3, inside the cap, so no net inflation). Small pieces stay closet and tips only. Having no accessories never costs points, and accessories count toward "too many focal points".
  - **Read them in the separate closet call** (#63), not the scoring call. Gate on a run-to-run flip test first.

## Waiting on the founder (Claude builds the default meanwhile)
- **Morning-card copy to skim** (`app/src/i18n/en.ts` → `addedInBuild`, under "Morning/evening card" and "Scored for"): greetings, weather lines, why lines, the "Going with your own?" row, the re-score alert, and the style names (Minimal, Sporty, Outdoorsy; the council approved "Outdoor" and "Classic prep" for onboarding, so pick one set).
- **Weather band numbers** (core `weather.ts`, for the rubric review): 80 / 65 / 50 / 35 °F feels-like, rain 50%+, a 15° swing. Hot days also favor tees and lighter shoes.
- **Archivo fonts:** 3 files of about 185 KB each, OFL license, from `github.com/Omnibus-Type/Archivo` (`fonts/ttf/`). Default: the system font. When approved:
  - fill the map in `app/src/design-system/fontFiles.ts`
  - uncomment the expo-font plugin in `app/app.config.ts`
  - rebuild
- **Copy I wrote that isn't in the copy deck:** `app/src/i18n/en.ts` → `addedInBuild` holds the card summaries, the 27 rule names, the VoiceOver lines, and (new Oct 7) the closet-sheet rows ("Top · Regular fit"), the viewer caption ("Date · October 22") and "Pick shoes from your closet". Skim it.
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
- **No `KeyboardAvoidingView` around absolutely positioned docks.** Its padding stacks on the fixed `bottom`. Drive the dock from `useAnimatedKeyboard` (see `StylistScreen.tsx`).

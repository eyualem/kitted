# Project: Kitted, a men's pocket-stylist iOS app

This file is the handoff for any new chat. Read it first, then the documents it points to. **Last updated: Oct 6, 2026.**

## Who I am and how I like to work
- A college student building a consumer iOS app for income. **$0 marketing budget**; I post short-form video daily. I'm into style, anime and good movies.
- I use **Codex** (it has Chrome and can reach Reddit and TikTok) and **Gemini** (YouTube transcripts) for browsing research. Claude writes the prompts for them and verifies what comes back.
- I want **honest, critical feedback backed by research, with sources, in plain language.** Give me concrete recommended decisions, not open questions. Rank options from several angles (user psychology, competition, chance of success, monetization).
- Keep the app's setup and navigation flawless: check every plan against Apple's HIG and the UX checklist in `research-context.md` §C14.

## The product (locked)
- **What it is:** a chat-first personal stylist for guys, built for beginners. **Core audience (decided Oct 6): guys 18–30** (college students and young professionals). We design, write and market for them first because they can pay, they're on TikTok/Reels/Shorts, they have the strongest triggers (first job, interviews, dates, "dress my age"), and I'm their peer. **The app is 18+ only (decided Oct 6).** Gemini's API terms require it, and 18+ also avoids Texas's parental-consent law and teen privacy rules. Older guys still get advice that adapts to their age. **Marketing targets adults only** (college, first job, interviews, dates; never prom or high school), because Google bans apps "likely to be accessed by" under-18s. Revisit 16+ in 2027; that would need an AI provider that allows teens. You send an outfit photo, get a **fit score out of 10** with 2–3 specific fixes (at least one free), and the app **learns your closet as you go**.
- **Positioning line:** "Look put together. Without trying too hard."
- **Tabs:** Stylist (chat with 4 buttons + cards) · Closet · Lookbook · You. **Rule: do things in Stylist; look at things in the other tabs.**
- **Progress:** Rotation (outfits your closet can make, "+N fits"), Starter 12 essentials, Lookbook history and calendar, "days dressed with intent: this week + total" (no daily streak chain). Style DNA and the monthly Lookbook recap come in v1.1.
- **Scoring:** "**The AI sees, the code judges, the AI explains.**"
  - The vision model only describes garments in fixed categories.
  - Code rules (a remote `rubric.json` in the app; `extraction-test/rubric.py` for now) compute the score.
  - A text model writes the explanation.
  - Same photo → same score.
  - Re-checks reuse the first reading.
  - A **"Not quite right?"** button lets the user correct the app.
- **Never rate faces, bodies, weight or skin.** Traditional and cultural clothing is "not rated."
- **Camera:** the phone propped up, with a live body-outline framing guide, a 3-2-1 auto-capture, and a staged loading screen. Mirror selfies and library photos are backups.
- **Partial checks (decided Oct 6):** full-body photos are preferred, never required.
  - What isn't in the photo never costs points.
  - The card always says so ("Partial check: shoes not included").
  - It offers one optional **shoe snap** ("point your phone at your feet") or a pick from Closet.
  - Details: `demo-app-spec.md` §5.6.
- **Clean, premium look.** **No RPG classes, E→S ranks or anime theme** (I find them cringe and past their prime). Call it "your stylist," never "AI stylist." (The consent screen still says plainly that your stylist is an AI: Apple 5.1.2(i) and the provider terms expect it.)
- **Free tier:** 1 fit check a day (with one included re-check) plus 5 questions a day. Everything that runs on code is free: outfit ideas, closet, history.
- **Pro:** $29.99/yr with a 14-day trial; $5.99/mo; $19.99 founding offer for the waitlist. No lifetime plan, weekly plan or Family Sharing at launch.
- **Onboarding** (6 taps to the first check): welcome → tap looks you like (max 3 styles) → basics (height, build, fit preference, birth year; **under 18 is blocked**, plus Apple's Declared Age Range check, which Texas law requires) → consent (Apple guideline 5.1.2(i)) → first fit check → result plus "your first 3 moves" → skippable paywall → notification ask. Goal, boldness and budget are asked later, when they matter.
- **Notifications:** only 3 kinds (daily outfit idea at the time I pick, fit check ready, trial ending).
- **Privacy:** photos are saved only on the phone. To score a fit, a face-cropped copy goes to Google's Gemini API, which doesn't train on it and keeps it up to 55 days for abuse checks. Our server stores no photos. The consent screen says exactly this (`app-build-spec.md` §4.1 O4).

## Where things stand (Oct 6, 2026)
1. **Extraction test PASSED (Oct 6)** on Gemini 3.8 Flash (2.5 Flash is retired for new accounts). Log: `extraction-test/results/INDEX.md`.
   - **Stock photos (40):** consistency 95–97%. Fix detection is **unproven**: it was 67–83% across runs and depends on 2 ambiguous pairs (p01, p06). Real staged fixes are needed.
   - **12 real mirror selfies (3 runs):** consistency 92–100%, even on 168×300 px images. Cut-off shoes, socks and bare feet were flagged as "not rated" every time.
   - **Cost:** about 0.9¢ per check now and about 1.9¢ from Jan 1, 2027, when Google doubles the price. About 85% of it is hidden "thinking."
   - **LOCKED (Oct 6 lock-in test):** gemini-3.8-flash, **thinking off**, the original v3 answer format, rubric v3.1. That's 6.6 s median, 8.7 s p90, 0.42¢ per check (0.83¢ from Jan 2027), 100% consistent. The short v4.1 format (3.9 s, 0.23¢) waits for the gold set. Plan: `speed-and-detail-plan.md`; result: `extraction-test/results/lockin-oct6/RESULT.md`.
   - **Age decision (Oct 6): launch 18+ on Gemini.**
     - Gemini and Vertex terms require 18+ users. A 14+ app would also need Texas parental consent and teen privacy compliance (2–4 extra weeks and ongoing legal work), and Apple has no 14+ rating anyway.
     - **18+ checklist:** the App Store 18+ rating, the in-app birth-year gate, Apple's Declared Age Range check, 18+ in the Terms/Privacy policy, and adult-only marketing.
     - **Teen-friendly backups** if we ever go 16+: Qwen on Groq or Anthropic. Test them then (~$3).
     - **Before launch:** form an LLC, and get one lawyer review (the questions are in §8 of `inputs/app-store-and-age-rules.md`).
     - Research: `inputs/ai-provider-research.md`, `inputs/app-store-and-age-rules.md`.
   - **How to run:** use `/usr/bin/python3` (python.org Python lacks HTTPS certificates), set the key with `read -s GEMINI_API_KEY && export GEMINI_API_KEY`, and **turn billing on** (the free tier allows 20 calls per model per day).
   - **The API key was pasted in chat on Oct 6, so delete it in AI Studio after testing.**
2. **Rubric v3 is DONE** (Oct 6), in `extraction-test/rubric.py`; doc: `rubric/v3.md`. Test 1 showed v2 was too generous: "no mistakes" = 9.0, all scores 7.0–9.0, and gym shorts at home scored 9.0. v3:
   - **Score = 7.0 + credits − mistakes** (credits: layered, elevated piece, point of interest, shoes that complement). The best possible score is 9.5 for now.
   - A loungewear rule (gym shorts and sweats outside Gym/Home).
   - Half-step style penalties cost half.
   - Big logos are a tip except at work and interviews.
   - New `drawstring_trousers` type, plus Gym and Home occasions.

   Result: scores spread 5.5–9.0, consistency 95–100%, and the gap to Claude's blind estimates fell from 1.12 to 0.75. **Waiting for my review of `rubric/v3.md`**, including its 2 open decisions (should 10 be reachable; human calibration).
3. **Gemini creator research:** the data is in a Google Sheet I still need to export as `.xlsx` and share. The earlier runs used 2015–2017 videos, so only rules backed by 2024+ video links count.
4. **Codex sneaker deep-dive prompt** was given to me (Reddit, TikTok and creators on sneakers with jeans/chinos, 2025+). Results pending.
5. **Name: KITTED (decided Oct 6).** Codex check (Oct 6): **no standalone KITTED trademark** at the USPTO; **@kitted.app and @trykitted are free** on TikTok and IG; **trykitted.com, trykitted.app, kittedstyle.app, kittedfit.app are free**; kitted.app is taken; getkitted (handles + domain) is taken. "Get Kitted" is a small Australian menswear shop: never use "getkitted", and check IP Australia before launching there. Next: claim @kitted.app and register trykitted.com.
6. **Timeline** (if the test passes): beta Nov 3, submit about Nov 14, launch about Nov 17–20.

## Name shortlist (re-checked Oct 6; **Kempt dropped**: already taken by the user's check)
Checked on the App Store + Google Play (fashion apps using the name) and via registry lookups (domains):
- **Kitted (recommended):** from "kitted out" = fully dressed / ready. **0 apps** on either store. kitted.com/.app are taken, but **trykitted.com, trykitted.app, heykitted.app, wearkitted.app are available**.
- **Sartor (backup, premium):** from "sartorial." No fashion apps on either store. **trysartor.com / trysartor.app / getsartor.app are available.**
- **Tuck (backup, playful):** no fashion apps, but almost every domain is taken (only weartuck.app is free) and it's a generic word.
- **Others free in fashion but weaker:** Spruce (conflicts with "The Spruce" lifestyle brand), Sorted, Squared, Tailr, Dapr.
- **Avoid** (used by fashion apps): Crisp (**"Crisp: AI Outfit Score" on Google Play, a competitor to note**), Pleat, Suited, WearWell, Polished, Garmnt, Dialed, fitd, Fitz, Dressr, plus Clad, Lapel, Crease, Seam, Vesti, Kit, Rotation, Drape, Fitted, FitCheck, CleanFit, Steez, Cuff, Kempt.
- **Competitors spotted while checking names** (add to research): "Crisp: AI Outfit Score" (Google Play) and **"fitd. – rate your outfits"** (App Store + Google Play).
- **Does Kitted work for young users?** It's neutral, not slang. That's fine: young users' apps aren't slang (Spotify, Discord, Liftoff, Cal AI), the youthful feel comes from voice, content and me, and slang names date fast.
- **Before committing:** a 1-day story poll or ask 10 guys aged 18–25, "Which would you download: Kitted, Sartor or Tuck?" Also check TikTok/IG handles (@kitted, @trykitted, @kitted.app) and tmsearch.uspto.gov, then register trykitted.com.

## How we keep context
- Work only in this folder. Start new sessions with "Read CLAUDE.md and pick up where we left off."
- End each session with "Update CLAUDE.md with what we decided today."
- Detail lives in docs: research → `research-context.md`; app plan → `demo-app-spec.md`; style rules → `rubric/v3.md`.
- Put Codex/Gemini outputs in `inputs/` (not Downloads).
- Set up git when app code starts.

## Key files (in this folder)
- `research-context.md` / `.pdf`: **everything** researched: idea history, competitors, psychology, reviews, marketing, style research, UX standards, legal.
- `demo-app-spec.md` / `.pdf`: **the v1 app spec**: navigation, onboarding, chat, scoring, closet, pricing, build plan, validation tests, decisions.
- `brainstorm/01–05_*.md`: full reports from the product, stylist-brain, UX, business and red-team agents.
- `extraction-test/`: `run_test.py` (calls the API), `rescore.py` (re-judges saved answers for free), `rubric.py` (v3), `rubrics/rubric_v2.py` (frozen), `schema.json`, `prompt.txt`, `README.md`, and `results/` (one folder per test plus `INDEX.md`).
- `inputs/`: photo sets (`fitcheck-photos/` = 40 stock photos, `mirror-fit-check-1/` = 12 mirror selfies, private testing only). Index: `inputs/README.md`.
- `speed-and-detail-plan.md`: **the plan to get a check from 16 s to about 4–5 s and catch more detail** (thinking off, schema v4 with an issues list, person crop, gold set of about 80 photos, experiments X1–X14). Built from `brainstorm/06–08`.
- `app-build-spec.md`: **the v1 iOS build spec** (stack, architecture, API proxy, every screen, data model, design system, milestones M0–M4 to the Nov 3 beta). §0 lists where it overrides older docs.
- `testing-plan.md`: the full, standalone process for all 5 tests (extraction test with the Codex photo prompt, name poll, ChatGPT comparison, concierge, waitlist).
- `rubric/`: `v3.md` = the current style rules in plain language; `v2.md` / `.pdf` = the previous version; `v2-evidence/` = the research reports behind the rules.
- `niche-research-kit.xlsx`: an early research kit (landlords and other niches; dropped).

## Next steps, in order
1. **Delete the API key** pasted in chat, and create a new one.
2. I review `rubric/v3.md` and decide its 2 open decisions.
3. **Follow `speed-and-detail-plan.md`:** Claude builds the test tools + schema v4 and runs X1–X5; I shoot the gold set (about 80 photos: 16 singles, 16 fix pairs + 4 no-change pairs, dim mirror shots, shoe snaps) with 3+ friends, and get 5+ friends to rate.
4. Pick the name → check trademark, handles and domain → waitlist page and TikTok account.
5. Write the v1 build spec (screens, data model, scoring pipeline, cost model) and start the SwiftUI project, with this file kept up to date.

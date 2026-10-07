# Research Context: From Idea Search to a Men's Style App

*Complete record of the research and decisions made Oct 3–5, 2026. It's written so a new session, a teammate or an AI agent can pick up exactly where we left off.*

**How to read this:** Part A is the current product and every locked decision. Part B is the history of every idea we evaluated and why it was dropped. Part C is the research library: all the findings, numbers and sources. Part D lists the research prompts we used. Part E lists open questions and next steps.

**Evidence labels:**
- **[Verified]** means we pulled it ourselves from a primary source (Apple App Store API, the actual web page, or a paper).
- **[Estimate]** means it comes from a third-party model (AppGoblin, screensdesign, Sensor Tower summaries).
- **[Self-reported]** means a founder or creator claimed it.
- **[AI-collected]** means Codex or Gemini gathered it and we spot-checked only part of it.

---

# PART A: THE CURRENT PRODUCT (as of Oct 5, 2026)

## A1. One-sentence definition
> **A personal stylist in your pocket. You chat with it and send outfit photos. It tells you if your fit works and exactly how to fix it, learns your closet as you talk, and slowly teaches you to dress well. Your progress shows up in your closet stats and monthly lookbook.**

Working positioning line: **"Look put together. Without trying too hard."** It speaks to the #1 motivation (confidence) and the #3 blocker (fear of trying too hard).

Working name: **TBD.** The old placeholder "Hunter Mode" no longer fits, because the RPG and anime theme was dropped.

## A2. Target user
- **Primary: style beginners.** Guys who want to dress better but don't know where to start.
- **Age:** the app should work for **anyone 14 and up**, including someone who is 50. Marketing starts with the young TikTok audience (about 16–28). (Decided Oct 5: chat makes the app age-agnostic.)
- **Men-focused.** Research shows closet and outfit apps skew heavily female, and men explicitly ask for one built for them.

## A3. Locked decisions
| Area | Decision |
|---|---|
| Category | **Style-first.** Fitness and discipline dropped from v1 (maybe optional add-ons much later). |
| Day-1 core | **"Check my fit"**: photo, then a score and 2–3 specific fixes |
| Interface | **Chat-first**, as a chat with quick-start buttons and rich cards, not a blank chatbot. Plus browsing tabs. |
| Tabs (proposed) | **Stylist** (chat, home) · **Closet** · **Lookbook** · **You** |
| Game layer | **Light and fashion-native.** No RPG classes, E→S ranks, XP or anime: the user finds these cringe and "past their prime." |
| Per-outfit score | **Fit score out of 10**, rounded to .5, explained, with sub-scores (fit, color, proportion) plus fixes. Occasion-aware. |
| Progress features | **Rotation** (how many outfits your closet makes, e.g. "Your rotation: 37 fits"; plus "+12 fits" for the next item). **Starter essentials** checklist (e.g. 8 of 12). **Style DNA** (style mix %). **Lookbook** (monthly recap card). A quiet "days dressed with intent" streak. Proposed additions: wardrobe **gaps**, **cost per wear**. |
| Closet input | **Both paths.** Quick start is the default: the closet builds itself from fit-check photos and chat answers. Full closet is optional (photograph everything). **Add clothes any time.** Items mentioned but not photographed are marked "not photographed yet." |
| Avatar | **3-question faceless silhouette** (height, build, fit preference). No body scan and no 3D try-on, for privacy, safety with minors, body image, and because try-on is very hard to build. |
| Styles | **Don't confine users.** They pick multiple styles up to a maximum (3 proposed). Beginners pick by tapping **outfit photos** rather than style names. Every generated outfit gets a **short summary** of what the fit is. |
| Taste rubric | Built from the **consensus of respected men's style creators**: principles only, no copying, no names, no implied endorsement. User's favorite creators: **Tim Dessaint, Frugal Aesthetic.** |
| Buying advice | Recommend **item types** with fit tips and a price range (e.g. "white oxford shirt, $25–40, shoulder seam at shoulder"). No store-inventory access is needed. Affiliate links (Amazon Associates, LTK/ShopStyle, Rakuten) are optional later. |
| Vibe | **Clean and premium**: lots of space, sharp type, minimal color, follows the phone's light/dark setting (proposed). |
| AI framing | Call it **"your stylist,"** not "AI stylist." Research says people want AI that's "less in your face." |
| Chat rules | Quick-start buttons (Check my fit / What should I wear? / I bought something / Ask a question). **At most one follow-up question per reply**, with tap answers (Yes / No / Not sure). **Never re-ask.** **Style topics only.** Scores come from a **fixed scoring pipeline**, never free-form chat. |
| Differentiation vs. free ChatGPT/Gemini | **Memory** (closet, body, styles, history), **consistent and explained scoring**, **visible progress**, built for men. |
| Transparency | A **"What your stylist knows"** page in You, where the user can see, edit and delete what the app has learned. |
| Monetization (proposed) | Real free tier: **1 fit check a day plus a few questions a day**, streak, closet. **Pro about $29.99/year** plus a monthly option, and test a lifetime price. Show the price early, keep the paywall skippable, make cancellation easy. |
| Marketing | **The user acts as a style creator** (lessons, fit-check reveals, before→after), with the app appearing *inside* content. App-demo videos flop. |
| UX standards | Every screen and plan is checked against Apple's HIG and the UX checklist (section C14). |

## A4. Proposed onboarding (a guided chat with tap answers)
1. **Welcome:** "Look put together. Without trying too hard." → Get started (no account)
2. **Your goal:** confidence / dating / work / college / everyday (multi-select)
3. **Tap the looks you like** (outfit photos), or pick style names (max 3)
4. **Your basics:** height, build, fit preference → silhouette appears
5. **How bold?** Subtle / A little / Bold
6. **Usual budget per item:** under $30 / $30–60 / $60+
7. **Closet path:** Quick start (default) or Full closet
8. **First fit check:** score, fixes, items added to the closet (the "aha" moment)
9. **"Your first 3 moves":** a personal starting plan (fixes the #1 blocker, "where do I start?")
10. **Pro offer:** clear price and trial, plus a visible "Continue free"
11. **Notification permission asked in context** ("Daily outfit idea at 8 am?") and **Save progress** (Sign in with Apple)

Occasion (class, date, interview…) is chosen **per fit check**, not in onboarding.

## A5. Open questions (as of Oct 5)
- Confirm tab names (Stylist / Closet / Lookbook / You) and the chat-style onboarding
- Max number of styles (3 proposed)
- Pricing (about $29.99/yr plus monthly, with a lifetime test)
- App name
- Re-run the Gemini creator research with a **date window** (see C11)

---

# PART B: IDEA HISTORY (what we evaluated and why it died)

## B1. AI job-search strategist for early-career tech applicants (killed)
**The pitch:** rank jobs by fit for each candidate (internal job search plus a browser extension), tailor resumes truthfully, track applications, and learn from each user's outcomes ("stop applying blindly").

**Why it died:**
- **Jobright.ai already does most of it.** It has match-% scoring with a breakdown, a Chrome extension (100K+ users), the Orion AI coach, Insider Connections (alumni/referral finder), resume tailoring, a tracker, alerts and an auto-apply agent. It targets new-grad tech and charges **$39.99/mo** (Turbo; $17.99/wk; $89.99/quarter). [Third-party reviews]
- **Simplify Copilot** has 1M+ installs, a 4.9 rating, autofill on 100+ ATS platforms and keyword-gap matching. It also runs the SimplifyJobs New-Grad-Positions GitHub repo. **LinkedIn Job Match** is free for everyone; Premium adds "Top Applicant," which uses applicant-pool data.
- **The personal learning loop is statistically noise.** Example: full-stack 5/28 (95% CI about 8–36%) vs backend 3/31 (about 3–25%) vs ML 0/19 (0–17%). The intervals overlap, and multiple comparisons create fake "insights." Data arrives after the user has found a job and churned. Self-selection biases resume A/B comparisons. Ghosting creates ambiguous labels.
- **Its outcome tracking needed the Gmail integration** that had been deprioritized for privacy friction.
- **"Know where you have a shot" promises odds, but skills-match only measures fit.**
- **Market context:** entry-level tech hiring down sharply (one source: about 65% drop at big tech since 2019). Cold-application response is often cited as under 2%.
- **Weak business model:** LTV about $45 (3 months × $15), so customer acquisition must cost under $15.
- **Salvage ideas offered:** crowdsourced company response-rate data; co-op/internship programs (Northeastern, Waterloo, Drexel); referral-first strategy; a concierge test.

## B2. Purchase-protection app (dropped earlier by the user)
Monitoring purchases, returns and warranties. Dropped because there's not enough recurring value (about 7–8 returns a year) and Gmail access creates privacy friction.

## B3. Advice on finding pain points
- **Desk research is built to kill ideas.** Expensive problems live where time is expensive: at work, not in a student's life.
- **B2C vs B2B monthly churn:** B2C about 7.6–9.4% vs B2B about 3.2–4.1% (Recurly/ProfitWell). Consumers are more price-sensitive.
- **Methods:** watch people at work; read 1–3★ G2/Capterra reviews; Upwork/Fiverr repeat gigs; trade subreddits; a friction log; *The Mom Test* (Rob Fitzpatrick).

## B4. Small landlords (researched, then scratched)
- **BiggerPockets research (about 590 thread titles, about 20 threads read):** the forums are full of founders doing "research, no pitch." Pains ranked: bookkeeping/tax (most common, but solved free by Stessa, Baselane and others); **move-in/out evidence plus deposit deadlines** (CA 21-day, FL 30-day certified mail forfeits the claim); **local compliance** (rent caps, registries, NY LeadSafe); vendor coordination ("habits problem"); a communication audit trail.
- **Competitors:** TurboTenant, Avail, RentRedi, Baselane, Stessa, Innago, Landlord Studio, Hemlane, Buildium ($62+/mo), DoorLoop ($69–99), Zillow Rental Manager, REI Hub. Most are free and paid for by tenant fees and banking.
- **Massachusetts angle:** a separate escrow account, receipts, a statement of condition within 10 days, annual interest (bank rate or 5%, whichever is less), and **treble damages** for violations (Mass.gov). Boston's September 1 turnover wave.
- **A 4-niche research kit** (`niche-research-kit.xlsx`): landlords, trades/home services, online resellers, independent tutors. Codex logged 75 rows. **Verified owner rows:** landlords 9 (about 11 after we re-checked BiggerPockets), trades 13, resellers 15, tutors 16.
  - **Key result:** Massachusetts compliance had **zero owner-voiced rows** (only tenants).
  - Reseller inventory rows were all from 2020–22.
  - Tutors had clean data but the pain was about platforms.
- **Provisional scores tied at 3.45**, meaning forum research had hit its limit. Competitors found: Flipwise, My Reseller Genie, and landlord deposit apps (Landlord Deposit, a Deposit Letter PDF Generator).
- **Note:** I believe the 2025 tax law moved the 1099-K threshold back to $20K/200 transactions (to verify).
- **Codex's verification had errors too.** It marked real BiggerPockets threads INVALID. Lesson: two AI passes disagree, so spot-check by hand.

## B5. Allergy meal planner for parents (a Codex idea, killed)
- **Checked out:** CDC 5.3% of children (NCHS Data Brief 546, Jan 2026). FARE's "1 in 13" is older. AAFA's $24.8B figure is from a 2013 study.
- **The claimed "gap" doesn't exist:**
  - **Allergy-Safe Meal Planner** (8 profiles, Safe/Caution/Conflict, $5.99/mo or $39.99/yr, launched Aug 28, 12 ratings)
  - **NumYum**
  - **Fig Recipes** (household profiles plus product suggestions; Fig has 1M+ members)
  - Spokin, Nori, useLadle, Mealime, Eat This Much, and ChatGPT as a free substitute
- **Other problems:** churn (parents settle on safe meals; kids outgrow allergies), the app can't remove label-checking, liability and trust.
- **Lesson:** search the App Store for your one-line pitch first. If 3+ apps match, you need an unfair advantage.

## B6. Consumer App Store gap research (3 tracks, Oct 4)
**Method:** Apple iTunes Search API and review RSS (182 keywords, 45 apps' reviews). Lifetime ratings are inflated to 4.5–4.9 by rating prompts, so we used the **average of the last ~100 written reviews** instead.

**Gap candidates found:**

| Niche | Signal |
|---|---|
| Car maintenance + fuel log | CARFAX 128K ratings, recent reviews 3.2★. **Fuelly abandoned 853 days.** Vehicle Maintenance Tracker wiped user data. |
| Pool chemistry | Clorox Pool 1.48★ recent. ClearPool 2.91★, stale. TFP Pool Math is free, though. |
| Hours / time-card tracker | 222K ratings across the niche. Hours Tracker 762 days stale. |
| Blood pressure log | 123K. BP Tracker 1.70★ recent. Paywall and ad complaints. |
| Others | Cocktail, aquarium, garden, bill reminder, prayer journal, wardrobe, coin, scorekeeper |

**Orphaned users:**
- AcuRite NOW at **1.13★** (1,028 ratings); weather station apps
- Google Maps Timeline replacements (Arc Timeline)
- **Bose SoundTouch** cloud shut down May 6, 2026 (official app 120K ratings)
- **Belkin Wemo** shut down Jan 31, 2026 (117K)
- Snapchat Memories paywall; Simply Plural shut down (crowded); Strava paywalls
- **Traps:** TV Time (shut down Jul 15, 2026; owner said "not enough demand for a paid app"), Pocket/Omnivore, Mint, MyFitnessPal, Goodreads, Yummly, Trakt and others are already full of replacements.

**"Is there an app" signals:**
- CPAP data viewer: myAir 109K ratings. In its last 500 reviews, 299 are ≤2★, about 50 ask for Apple Health, and 28 object to a Sept 2026 HIPAA consent. OSCAR is desktop-only.
- **Alarmed replacement** (12.8K ratings, last updated 2015, crashes; iOS 26 AlarmKit makes a replacement possible)
- Political spam filter (Apple now native), elder phone management (blocked by iOS), hearing-loss gaps, subscription-free utilities

## B7. Car maintenance + fuel log (dropped: money ceiling too low)
- **Fuelly:** about **1.9M iOS installs [Estimate]**, ~366K monthly active users, **~6K new installs a month even while abandoned**, under $10K/mo revenue. Fuelly.com shows **711,236 users / 1.1M vehicles / 62.8M fill-ups**. Pulled from Google Play in April 2025; forum calls it a "ghost site." A CSV export exists.
- **CARFAX Car Care:** about 6.4M installs, ~49K/mo, ad-funded. **My Car:** 330K, under $10K/mo. **Drivvo:** 5M+ Android, free.
- Others: Car Cave, Fuel Monitor Pro, Fuel Tracker, CarScope, Fuelio.
- **Verdict:** demand is real, but the money is modest (a few hundred to about $2K/mo after a year). The user wanted faster, bigger income.

## B8. The Starter Story / Chris Raroque / Edmund Yong playbook
**Edmund Yong** (165K YouTube subscribers):
- **Easy Folders** (ChatGPT folders extension): over $100K lifetime and sold for "five figures." **Built before he had an audience.** OpenAI's Projects feature hurt it.
- Since then: Transcribr (about £1K total, not MRR), Whop apps ($391 "MRR"), Fluently (about $100 MRR), Startup Club (sells to his audience).
- **His philosophy:** "stop trying to be original," copy validated niches, scratch your own itch.

**Chris Raroque** (about 101K YouTube; CEO of the Aloa agency; apps published under AloaLabs):
- **Ellie** planner (a cheaper Sunsama clone): about $1.4K/mo after about 2 years, with 90%+ of signups from App Store search.
- **Amy** AI calorie tracker (Nov 2025): **$400 MRR in week 1** thanks to his audience and a 1,600–2,000-person waitlist. About $3.4–3.5K MRR from 336 payers by Sept 2026. Churn is "brutal."
- Mogul and Luna: modest. Stack: SwiftUI, Supabase, Claude Code.

**Starter Story** (24 consumer app case studies, all founder screenshots):
- **Where ideas came from:** 11/24 copied or localized proven apps (Cal AI→Israel = CalBuddy, Umax→women = Glam Up, Quittr→sugar = STOPPR). 11/24 were the founder's own problem.
- **18/24 used short-form video.** 12 reached $10K/mo within about 4 months; 8 of those used creators/UGC. Organic, ASO-only apps took 6–24 months.
- **Categories:** health/fitness/body 12; about 13 had AI at the core. Onboarding quiz → personalized result → paywall; weekly plus annual subscriptions.
- **Survivorship bias:** half had failed apps before (one founder had built 45 apps). Only 3 had an audience first. Hits fade (GlowUp: $800K in year 1 → $15K/mo).
- **Examples:** GoTall $100K/mo, Erly $50K, Stella $300K+ (2.8M TikTok followers), AbMaxx $55–60K, Gravl $440K/mo, Prayer Lock about $21K/mo, Pushscroll $30K (organic), ToneAdapt $25K, HabitKit $15K (slow ASO).
- **The playbook:** proven demand plus a narrower remix; explainable in 3 seconds on video; build in 1–2 weeks; post 3–10 videos/day for about 4 weeks; then pay creators; a 6–8 week deadline per app.

## B9. User profile inputs (Oct 4)
Willing to post daily, **not willing to spend money**, speaks Amharic, loves anime and good movies, and has a strong personal interest in style.

## B10. Movie recommendation app (parked)
- IMDb 548K ratings, Letterboxd 88K, Likewise 47K, Queue 12.5K, MyAnimeList 24K: all free.
- TV Time (26M installs) shut down saying there was "not enough demand for a paid app."
- Taste-identity virality is real, but monetization is weak. Good as a side project only.

## B11. Amharic / Ethiopian ideas (dropped)
- **Christian "read before you scroll" lock apps:** **53 found, 51 launched 2025–26 (37 in 2026)**. Only 7 have over 1K ratings; 37 have under 100.
  - Leaders: Bible Mode (about 727K installs), Pray Screen Time (557K), BibleScroll (264K, Feb 2026, +87K/mo), Bible Widgets (116K ratings), FivePrayer (Muslim; 14.6K ratings in about 8 months).
  - **No Amharic app.** Holy Bible in Amharic has 8.5K ratings.
- **Audience:** Protestants are about 18.6% of Ethiopia (2007 census; now estimated 22–23%, roughly 25–30M people). Total Amharic speakers about 60M. US Ethiopian ancestry 372,804 (2023 ACS); Canada 40,275.
  - **Ethiopia: 97.5% Android. No Ethiopian App Store storefront and no in-app purchases** (Apple dev forum, Jul 2026).
  - Estimated paid market: about **$1.5K–25K/yr**. YouVersion has 4 Amharic versions plus plans, free.
- **Licensing:** no Amharic Bible text is free for commercial apps.
  - 1962 text: the Bible Society of Ethiopia's written permission is needed.
  - NASV is Biblica's: no commercial use via API.Bible.
  - YouVersion Platform and Bible Brain don't grant commercial rights.
  - The safe path: track chapters only and deep-link to YouVersion, or ask BSE (admin@biblesociety-ethiopia.org).
- **English Bible-lock model:** Prayer Lock claimed $21K/mo (12 TikTok accounts, about 40 posts/day, Spark Ads). Pray Screen $112K ARR. The top complaint is **"paying to pray."**
- **iOS:** the FamilyControls entitlement takes 1 day to weeks to approve. Shields can't open the app. About 100–150 hours for an MVP.
- The user is Protestant, not Orthodox. They dropped it because Ethiopians are less likely to pay.

## B12. "Read to unlock" (user idea, killed)
- **About 25 clones in 2025–26** (Read to Unlock, ReadToUnlock with quizzes, PageWard with cover proof, Bookplate, ReadLock ×3, Pagelock, chapter lock…). **Almost all have 0–25 ratings.**
- **The exception: SlowRead** (622 ratings in about 3 months), which sells "a bookshelf you'll be proud to show off" (identity, not punishment).
- **Problems:** punishment leads to deletion, quizzes feel like homework, and AI can't know what's on page 41.
- **Lesson:** in 2026, obvious remixes get cloned within months. Your edge must be community, language or genuine taste.

## B13. "Solo Leveling" self-improvement → fitness + fashion + discipline (evolved into the current app)
**Data that pointed here:**
- **Arise:** 2.2M installs since Apr 2025 [Estimate]
- **Life Reset:** 1.1M
- **DAWG:** 6.6K ratings
- **The looksmax category:**
  - **Umax:** 51.6K ratings, founder claims about $500K/mo
  - **PSL:** 1.2M installs in under a year
  - **UCHAD:** 1M installs
  - **LooksMax AI:** 42.7K ratings
  - **LooxUP:** 36.9K ratings
- **The combination is open:** no app combined an anime "System" look, fitness and men's style. The closest was DAWG.

**The intermediate concept, "Hunter System":**
- **Daily quests** across Strength, Style and Discipline
- **Ranks and XP** from E to S
- **An AI fit check**
- **A penalty zone**

**What we did:**
- **Mockups:** v1 used the blue System look; v2 switched to near-black with crimson and gold.
- **Research:** four parallel tracks plus Codex. The findings are in Part C.
- **What the user decided:**
  - Pivoted to style-first.
  - Dropped the RPG theme as cringe.
  - Asked for a chat-first design.

---

# PART C: RESEARCH LIBRARY

## C1. Trend health: Solo Leveling and the "System" aesthetic (Oct 5)
**Verdicts:**
- **Solo Leveling itself:** flat and slowly fading. The franchise is quiet until 2027–28: the movie *Beyond the System* has no date, Season 3 is projected for 2027–28, Netflix's live-action targets late 2027/2028, and the *Karma* game's global launch is in 2027.
- **Anime-branded "level up" apps:** fading. They peaked Jan–Jul 2026 and dropped sharply in Aug–Sep.
- **The underlying mechanics (ranks, streaks):** steady, but only in theme-neutral apps.

**Evidence:**

| Signal | Numbers |
|---|---|
| Wikipedia "Solo_Leveling" monthly views | Peaks of 1.0M (Jan 2024) and 917K (Mar 2025); now 75K, −39% YoY (peers −28%) |
| Google Trends US | "solo leveling" peaked at 78 (Mar 2025), now 10–16. "daily quest" peaked at 82 (Apr 2026), now 21–23. "level up app" peaked at 43 (Jun 2026), now 12. "lock in" 92→58. "aura" 91→62. "fit check" 25→7. "mogging" rising (4–7). |
| Solo Leveling: Arise (game) revenue | $139M in its first 6 months of 2024 → about $38M in all of 2025 |
| Arise app weekly installs [Estimate] | **About 107K/week (Jul 13) → about 400/week (Sep)**. LEVELING: Fitness 8.4K/week → 567/week. |
| Theme-neutral apps | **Liftoff – Ranked Gym about 7M installs, +54K/week, steady.** **Lock In about 2M installs** (OVR rating system), +29K/mo. |
| Looksmaxxing | TikTok searches went from 300K/day (Feb 2026) to 1.9M/day (Mar). TikTok blocked "bone smashing" Apr 3, 2026. Clavicular charged Sep 8, 2026. About 84% negative sentiment (less rigorous source). |

**Caveat:** some youth-slang terms in Google Trends show possible school-calendar seasonality.

## C2. Psychology evidence and design rules
Evidence labels: Strong = peer-reviewed RCT or meta-analysis; Industry = company data; Weak = secondhand.

**Gamification:**
- Physical activity effect g=0.42, falling to g=0.15 at follow-up (Mazeas 2022, JMIR, 16 RCTs).
- Gamified vs. non-gamified apps: only +489 steps/day (eClinicalMedicine 2024).
- In adolescents: SMD 0.15.
- STEP UP trial (JAMA IM 2019): competition worked best (+920 steps).
- The novelty effect dips at about week 4.
- Expected tangible rewards undermine intrinsic motivation (Deci 1999).

**Streaks:**
- Duolingo: letting any single lesson count toward the streak raised D14 retention +3.3%. The Weekend Amulet raised returns +4%. The Streak Wager raised D7 +14%. Users with 7+ day streaks grew from about 20% to 50%+ of daily actives.
- Broken streaks reduce engagement; letting users repair them helps (Silverman & Barasch, JCR 2023).
- **Milkman megastudy (Nature 2021, n=61,293): the best intervention was a bonus for returning after a missed workout (+27%).**
- Habit formation takes a median of 66 days; missing one day doesn't matter (Lally/UCL).
- Habitica: punishments perceived as unfair reduce motivation.

**Choice and progress:**
- Choice raises intrinsic motivation; 2–4 options work best (Patall 2008 meta, 41 studies).
- Endowed progress: car-wash cards with 2 of 10 stamps pre-filled were completed 34% vs 19% (Nunes & Drèze).
- Goal gradient (Kivetz 2006). Fresh-start effect (Dai, Milkman & Riis 2014).

**Identity:**
- Exercise identity correlates with activity at r=0.44 (Rhodes 2016).
- The noun-vs-verb "be a voter" effect failed replication.
- People share to self-enhance (Berger 2014).
- Spotify Wrapped reached about 200M users in about 62 hours.

**Social:**
- Duolingo leagues: +17% learning time.
- Friend Streak users are 22% more likely to finish the daily lesson.
- Muscularity content is linked to muscle dysmorphia in boys (Body Image 2025).

**Benchmarks:**
- Health & Fitness retention: D1/D7/D30 about 27/13/8% [Weak].
- **RevenueCat 2026:**
  - H&F trial-to-paid: 37.7% median
  - Download-to-paid by D35: 2.9%
  - Hard paywall conversion: 10.7% vs freemium 2.1%, with similar 1-year retention
  - Trials of 17–32 days convert at 42.5%, vs 25.5% for trials under 4 days
- **Adapty:**
  - H&F trial-to-paid: 42.2%
  - Annual plans: 61% of revenue
- **1-year retention by plan:** weekly 3%, monthly 11%, annual 28%.
- **Gen Z:** only 37% kept all their subscriptions.
- **Superwall:** multi-page onboarding paywalls 12.4% vs single-page 9.1%.

**Notifications:**
- Tailored pushes: +3.9% engagement (Bidargaddi 2018).
- HeartSteps: effect decays over 6 weeks.
- Duolingo's rotating templates: +0.5% DAU.
- Frequent non-personalized pushes increase uninstalls.

**Ethics and Apple:**
- Social comparison is linked to body dissatisfaction.
- Apple's guidelines:
  - **1.2:** bans "hot-or-not" objectification
  - **1.4.1:** no health claims that can't be validated
  - **5.1.3:** no using HealthKit data for ads
  - **3.1.2(c):** state clearly what the subscription gives
  - **4.5.4:** the app must work without push; marketing pushes need opt-in
- New age-rating questionnaires (13+/16+/18+).
- The UK Children's Code covers all users under 18.

**Rules carried into the current design:**
- Streak forgiveness (any one action counts, plus a weekly shield)
- Comeback over punishment
- Choice
- Fresh starts (Monday, monthly)
- Effort- and identity-based share cards
- One well-timed push a day
- Annual plan as the default, with a long trial
- **Rate outfits, never people**

## C3. What users want: app review mining (3,575 reviews, Oct 5)
**Apps covered:** Arise, Life Reset, DAWG, Reload, EVOLVE, Habitica, PSL, UCHAD, Umax, LooksMax AI, Dressly.

**Feature requests:**

| Request | Reviews |
|---|---|
| Deeper RPG layer | 49 |
| Custom quests / editable plans | 45 |
| Schedule fit | 32 (about 65 total) |
| Social features | 31 |
| Outfit filters (budget, brand, palette) | 25 |
| Free tier / honest pricing | 19 |
| Cardio / workout variety | 17 |
| Health/Watch sync | 15 |
| Widgets | 12 |
| Calendar / history | 12 |

**What users love:**
- Motivation and accountability: 137
- Streaks: 122
- XP and ranks: 107
- Fun: 93
- Solo Leveling / System feel: 73
- Real results: 44

**Complaints (quest apps):**
- Paywalls: **69% of 1–2★ reviews**
- Bugs and login loops: 137
- "Glorified checklist": 54
- Rigid: 46
- Lost progress: 36
- Ads don't match the app: 32
- Notification spam: 27
- AI-written text or art: 10

**Complaints (looks apps):**
- 560 about pay-per-scan and weekly billing
- 229 about bugs
- 70 about "invite 3 friends" walls
- 33 say scores are random
- 31 say the advice is generic

**Dressly:** reviewers are almost all women, many older. **Men's outfit checking is open.**

**Calendar verdict:** about 2% of reviews mention it. Build scheduling flexibility, rest tokens and a month grid of completed days — **not a full planner.** (For the style app: an outfit-history calendar in Lookbook.)

**Demographics:**
- Many reviewers are 12–15: "I'm 14 I can't pay."
- Slang (bro, fr, lowkey, lock in, mog) is common.
- "Cringe" is rarely mentioned.
- People hate fake depth and AI-generated art.

**Surveys:**
- Gallup 2025: 25% of US men aged 15–34 lonely a lot of yesterday.
- Movember 2024: 61% of UK young men watch self-improvement influencers.
- IFS/YouGov 2025: 85% of young US men say manhood means strength and responsibility.
- **Mintel: 68% of Gen Z men used facial skincare in 2024 (up from 42% in 2022).**
- BCG: 41% of Gen Z and Gen Alpha use AI weekly for fashion shopping. YouGov: only 6% would use AI to discover clothes.

## C4. Competitor screenshot teardown (84 screenshots, 12 apps)
**Apps covered:** Arise, Life Reset, DAWG, Reload, EVOLVE, PSL, UCHAD, Umax, Dressly, plus LEVELING: Fitness (793 ratings), SelfQuest (488) and Dual (138).

**Selling concepts:**
- Turn your life into a game: 10 of 12
- Rank ladder: 10 of 12
- A fixed-length "arc" (30/60/66/90 days)
- Quest card with a timer
- Community and stat profile
- A "potential" reveal

**Visual style:**
- Every men's app is dark-only.
- Blue and purple glows dominate.
- Captions are heavy condensed caps.

**Money:**
- Hard paywalls after 37–55-screen quizzes.
- Timer discounts and exit offers.
- Life Reset is estimated at about **$250K/mo**; Arise about $75K/mo [screensdesign estimates].

**Gaps nobody shows:**
- **men's outfit checking**
- a **full month calendar**
- widgets or Live Activities
- proof of completion
- a "Wrapped" card
- privacy or teen-safety messaging

## C5. Codex competitor sheet (system-rpg-looksmax-style-competitor-research.xlsx)
**Coverage:** 34 competitors in three groups: real-life RPG, looksmax, and AI outfit/style.

**A major competitor our earlier research missed: Lock In – Reset Your Life** (Omega Labs)
- 27,322 ratings, about 2M installs, +29K/mo
- OVR (overall rating) system, habits, XP, an AI coach
- No anime, no style features
- Age rating 4+

**Closet and outfit apps:**
- Alta Daily: 15.7K ratings
- Whering: 11.8K
- Fits: 5.5K
- Acloset: 5.3K
- Style DNA: 7.5K
- Stylebook: 8.8K
- Cladwell: 1K
- DLOOK: 1.2K
- Combyne: 87.6K
- Finch (self-care pet): 760K

**Reddit findings:**
- r/sololeveling posts got **+150 (IRLQuest)** and **+91 (LEVELITE)**, but these are founder launch posts, so expect launch fatigue in that subreddit.
- Men say wardrobe apps are "focused towards women" (r/malefashionadvice, Aug 2026).
- Men want an AI stylist that uses **size and budget**.
- On looksmax apps: "couldn't even open it without paying," doubts about how scores are calculated (+130), and willingness to pay for **specific routines**.

**Reliability:**
- The anime/fitness/style/discipline yes-or-no columns are unreliable (keyword matching).
- TikTok fields were all UNVERIFIED.

## C6. Short-form marketing research (shortform-organic-marketing-research.xlsx)
| Account | Followers | Best videos |
|---|---|---|
| Liftoff | 39.3K | 14.3M (paid partnership, "crazy humble," 7s), 11.2M, 9.7M, 7.1M, 5.9M |
| Lock In | **1,582** | **3.3M** ("Just have a higher overall," 6s), 1.8M |
| UCHAD | 13.7K | 14.6M ("Get your ratings," screen recording), 7.3M |
| Umax | — | 1.2M (2024) |
| Arise (anime System edits) | — | 199K at best |
| Dressly (a style app) | 182K | visible top videos only about 25K |
| DAWG (TikTok) | — | tiny (third parties say its Instagram does better) |

**Takeaways:**
- The winning format is a short (5–8s), funny **reveal** of a rating or rank.
- Small accounts can go viral.
- Anime edits underperform.
- App accounts posting generic style tips underperform.

Comments were hidden.

## C7. Men's style motivations, blockers and app opinions (men-style-app-research.xlsx)
**Motivations (about 50 posts):**
1. **Confidence and self-respect** (#1)
2. **Dating**
3. **Work, college, first impressions**
4. **Looking grown-up** ("dress more my age," +80)

Others: glow-up, breakup reset, promotion.

**Blockers (about 50 posts):**
1. **"Don't know where to start" / overwhelm** (about 15)
2. **Fit, sizing, body type** (about 11): "looked like a child borrowing Dad's clothes"
3. **Fear of trying too hard / inauthenticity** (about 9): "I feel like I'm performing," "too much too fast"
4. **Putting outfits together / visualizing**
5. **Budget**: "what's worth spending money on?"
6. Style identity, shoes, buying online

**Beginner questions** (future lessons):
- How should clothes fit? (+192)
- The Basic Bastard wardrobe (+7,498) and whether it still works in 2025 (+278)
- First shoes
- Shoes and belts
- The full-length mirror check (+303)
- Outfits vs. just clothes
- Building from scratch, chinos, color
- Work without overdoing it
- Dress for the occasion (+560)
- Finding your style
- Not trying too hard
- Body type, sizing, tailoring
- Beyond basics, brands, sizing online
- What to replace first, timeless looks, budget

**App opinions:**
- **Quit risk #1:** "hours it's taken to digitize my closet" (+963)
- **Want:** "take the pics of what I have… tell me how to mix/match" (+32), and outfits from owned clothes
- **Men left out:** "only one for men," "good features for men"
- **Like:** rediscovering forgotten items, gaps, cost per wear
- **Pricing:** expect a free version; "only pay the $29 a year"; Stylebook praised for "no subscription"; a one-time $5 mentioned
- **AI:** "less in your face" (+13)
- **Other quit risks:** data loss, bugs, account lockouts, ads

**TikTok and YouTube Shorts:**
- Men's outfit-of-the-day montages: 647K
- Fit checks: 240–260K
- **Outfit app demos: 3–5K** (Essembl, GRWM). Alta's female-targeted demo: 272K.
- **Shorts:** "Stop Dressing Like A Boy" 3.9M, "How To Dress For Your Height" 865K, "How To Dress Better In School" 380K, tall/short/big-guy videos 150–334K

**Caveats:**
- About a fifth of motivation posts are from 2019–20.
- Many quotes have low upvotes.
- Codex reported limited Chrome control.

## C8. Market pattern lessons (cumulative)
- In 2026, **a category that's both empty and proven to make money basically doesn't exist.** Winners enter proven, crowded categories and win on marketing plus one sharp angle.
- **Trend apps die with the trend** (Arise). Protect yourself with **real usefulness**.
- **Free substitutes kill weak paid apps:** LinkedIn, YouVersion, ChatGPT.
- **Proximity and community** (an unfair advantage) matter more than features.

## C9. Product insights from chat-first (Oct 5)
- **Precedent:** a creator's chat/photo calorie tracker stood out in a saturated category. (That's the user's recollection; Chris Raroque's Amy is an AI calorie tracker.)
- **Benefits:**
  - **Progressive profiling:** the closet and profile build from tiny exchanges.
  - **One input** for everything.
  - **Beginners' questions get answered** in the moment.
  - **Investment effect:** the more he tells it, the more personal it gets.
  - **Ages 14+ are all covered**, since chat works for anyone.
- **Risks and mitigations:**

  | Risk | Mitigation |
  |---|---|
  | The blank box | Buttons and cards |
  | ChatGPT does fit checks for free | Memory, consistent scores, progress |
  | Cost per message | Free-tier limits |
  | Off-topic or safety issues | Style topics only, with a moderation layer |
  | Users misremembering what they own | Mark items "not photographed yet" |

## C10. Gemini creator rubric research (Men's Style App Rubric – Google Gemini.pdf)
**Creators listed** (subscriber counts as stated):

| Creator | Subscribers | Focus |
|---|---|---|
| Alex Costa | 4.16M | — |
| Teaching Men's Fashion (Jose) | 7.4M | — |
| Alpha M (Aaron Marino) | 6.9M | — |
| Real Men Real Style (Antonio) | 3.7M | — |
| Frugal Aesthetic (Christian) | 1.6M | — |
| Tim Dessaint | 1.58M | — |
| Daniel Simmons | 803K | — |
| He Spoke Style | 601K | — |
| The Style O.G. | 646K | — |
| Gallucks | 156K | — |
| Gentleman's Gazette | 1.5M (unverified) | — |
| Parker York Smith | 1.2M (unverified) | — |
| One Dapper Street | 1.1M (unverified) | — |
| DevanOnDeck | — | — |
| Drew Joiner | — | gorpcore/Americana |
| The Modest Man | — | proportions for short men |
| Harry Has | — | Scandinavian |
| Jairus Alexander | — | sneakers |
| Fly with Johnny Thai | — | budget/teens |
| Ben Arthur | — | — |

"Jay Alexander" resolved to Miss J (a runway coach), so the closest matches are Jairus Alexander or DevanOnDeck.

**Principles:**
- **Shoulders:** the seam sits where your arm meets your shoulder.
- **Pants:** slight or no break.
- **Color:** no more than 3 colors per outfit. A capsule palette (white, navy, light blue, black, olive, grey) comes before bright colors.
- **Proportion:** wide-leg and straight cuts are replacing skinny. Match top and bottom volume. The "Rule of Thirds" (tuck in, or crop the jacket).
- **Occasion:** overdress slightly rather than underdress.

**Consensus:**

| Principle | Agreement | Notes |
|---|---|---|
| Neutrals first | 10/10 | — |
| Fit is king | 10/10 | — |
| Avoid large logos | 9/10 | — |
| Match leathers | 8/10 | — |
| Slim-fit pants essential | 4/10 | **DISAGREEMENT:** classic creators favor slim-straight; trend-forward creators push relaxed/straight for 2026 |
| Sneakers with a suit | 5/10 | — |

**Essentials:**

| Item | Typical price |
|---|---|
| Heavyweight white tee | $15–45 |
| Light-blue OCBD | $30–85 |
| Navy chinos (straight to relaxed) | $40–90 |
| White leather sneaker | $60–150 |
| Penny loafers | $100–250 |
| Denim/chambray overshirt or chore coat | $50–120 |
| Grey wool flannel trousers | $75–150 |

**Mistakes:**
- Wrinkled or stained clothes
- Trendy items before basics
- Suit fit
- Athletic running shoes with casual outfits
- Only wearing black

**Trends vs. timeless:**

| | 2025–26 trend | Timeless |
|---|---|---|
| Silhouette | Relaxed | Tailored |
| Colors | Earthy browns, sage, off-white, plum | Navy, grey, white |
| Footwear | Loafers, Roper boots | White sneakers |
| Outerwear | Wide-lapel overcoats | — |

**Style map:**
- **Minimalist:** heavyweight tee, wool trousers, white sneakers, knit polo, overcoat
- **Smart casual:** navy blazer, OCBD, chinos, Chelsea boots
- **Streetwear:** oversized graphics, cargos, chunky sneakers
- **Workwear/Americana:** chore coat, selvedge, flannel, Red Wing boots
- **Old money / quiet luxury:** cashmere, linen, pleated trousers, suede loafers
- **Vintage sportswear:** varsity, rugby, retro runners

**"15 golden rules" summary:**
- Fit first
- Relaxed-straight is the 2026 beginner default
- At most 3 colors, with a neutral base
- Rule of Thirds
- White sneaker plus loafer
- Match leathers
- Impeccable care
- Slight overdress
- No big logos
- Basics before statement pieces

**Our review of this research (important):**
- The PDF is a screenshot of a chat. **Tables are cut off** (columns truncated, "…" rows omitted), so it's not complete data.
- **Only 3 video links are verified.** Most are UNVERIFIED, and **video dates and years are missing or truncated.**
- **No date window was set** (the user's point). The verified videos may be several years old (e.g. a teen style-tips video), so slim-fit-era advice could leak in. Trends must come from **2024–2026 sources only**. Timeless rules need at least one recent confirmation.
- The "[cite: 3.4.2]" markers are Gemini's internal search references, not checkable links. **The 10/10 consensus counts lack per-video evidence**, so treat them as hypotheses.
- **Be careful with skin-tone claims** ("black can wash out certain skin tones"): keep scoring inclusive and don't judge skin.
- Some trend claims ("mycelium leather bombers") are low-confidence.
- **Useful structure:** principles, consensus/disagreement, essentials with prices, mistakes, **trends vs. timeless**, style map. That's exactly the rubric architecture we need. **Key design insight:** score timeless rules as the base, and judge trend/silhouette rules relative to the user's chosen styles (resolving the slim vs. relaxed disagreement).

## C11. Gemini follow-up needed (date window)
Re-run with:
- Videos **published Jan 1, 2024 or later** (trends from 2025–2026 only)
- Real YouTube links with **dates and timestamps**
- **Untruncated tables** (export to Google Sheets)
- Any principle supported only by pre-2024 sources flagged
- A per-creator evidence count for each consensus row

## C12. UX standards material provided by the user (verified Oct 5)
**All links are real:** Apple HIG, Material 3, NN/g's 10 heuristics, Jakob's Law, progressive disclosure, WCAG 2.1 contrast, Hooked (Nir Eyal), the IKEA effect (HBS; the site blocks bots but the page exists), Reforge time-to-value, NN/g response-time limits.

**Corrections:**
- "Clarity, Deference, Depth" dates from iOS 7. Apple's 2025 **Liquid Glass** redesign is current.
- HIG is guidance, not strictly enforced in App Review. App Review enforces the App Store Review Guidelines.
- Material Design isn't relevant for an iOS-only app.
- Jakob's Law says "most" of their time, not 99%.
- The 0.1s rule comes from NN/g's response-time limits (0.1s / 1s / 10s).
- Dynamic Type accessibility sizes go well past 200%, so test at the largest.
- The "get them out of the app" principle applies to the daily check-in only.
- Time-to-value vs. long onboarding conflict is resolved by: a short quiz → a real result → the paywall.

## C13. Contrast checks on our earlier dark mockups (WCAG AA 4.5:1)
- **Failed:**
  - Button text on #E24B4A: 3.70
  - Crimson text: 3.56
  - Gray #888780: 3.88
- **Fixes:**
  - White on #A32D2D: 7.07
  - #F09595: 6.29
  - #B4B2A9: 6.58

(The design direction has since moved to clean and premium, but the rule stands.)

## C14. UX checklist for every screen and plan
**Navigation:**
- Tab bar for top-level navigation only: always visible, 3–5 labeled tabs.
- **Never use a tab as an action.** For example, the Fit check tab opens a page with a scan button.
- Settings live behind a gear icon in the top right.

**Touch and readability:**
- Touch targets at least 44×44 pt.
- Text contrast at least 4.5:1.
- Dynamic Type at the largest sizes.

**Feedback and escape:**
- Feedback within ~0.1s (haptics, skeletons, a progress state during the AI scan).
- A clear X or Back on every modal, camera and paywall.

**Familiarity and disclosure:**
- Jakob's Law: use familiar patterns.
- Progressive disclosure: features unlock with use.

**Notifications:**
- Utility-only. "2 quests left, 3h until reset" style is fine.
- **Never "we miss you."**
- Ask permission in context.

**Accounts and trust:**
- Sign in with Apple later, not first.
- Privacy explained in plain words ("Photos are only used to rate your fit. Delete anytime.").
- Healthy hooks: insights as rewards, and the IKEA effect (the user builds his closet).

## C15. Legal and IP notes
- **Solo Leveling IP** ("Arise," "Shadow Monarch," the art) belongs to D&C Media/Kakao. Never use it.
- **Creator content:** study it for principles (facts and ideas aren't owned). Don't copy their words, videos or images, don't use names or faces, and don't imply endorsement. Partnerships are possible later (commission on referred subscriptions).
- **Outfit images** for onboarding must be our own, licensed, or AI-generated. No creator or brand screenshots.
- **Minors: superseded Oct 6. The app is 18+ only.** Gemini/Vertex terms require 18+ users, Texas SB 2420 (in force since June 2026) requires parental consent for under-18s, and Apple has no 14+ rating. Keep photos private, give data-deletion controls, follow Apple's privacy labels, and never rate faces or bodies (Apple 1.2). Full analysis: `inputs/app-store-and-age-rules.md`.
- **Bible texts:** see B11 (relevant only to the dropped idea).

---

# PART D: RESEARCH PROMPTS WE USED (summaries)
1. **Landlord pain-point research:** a 4-niche research kit with search plans and evidence log.
2. **Codex verification prompt:** an exact quote under 15 words, the real date and upvotes, poster-is-owner yes/no, INVALID if unsupported, no notes.
3. **Codex competitor prompt:** 20+ competitors across real-life RPG, looksmax and AI style: pricing, onboarding, TikTok, reviews, Reddit requests, gaps.
4. **Codex TikTok/short-form prompt:** competitor accounts, top 5 videos, viral formats from small accounts, comments.
5. **Codex men's-style prompt:** motivations, blockers, beginner questions, app opinions from a man's point of view, TikTok.
6. **Gemini creator rubric prompt:** creators, transcripts, principles, consensus, essentials, mistakes, trends, style map. **Needs a 2024+ date window** (C11).

**Files produced so far:**
- `niche-research-kit.xlsx`
- Codex's filled and verified kits
- `system-rpg-looksmax-style-competitor-research.xlsx`
- `shortform-organic-marketing-research.xlsx`
- `men-style-app-research.xlsx`
- The Gemini rubric PDF
- Raw App Store review dumps and screenshot teardowns in the session scratchpad

---

# PART E: NEXT STEPS
1. The user confirms the open questions (A5).
2. Re-run the Gemini research with a 2024+ date window (C11).
3. **Brainstorm the full app structure (the "demo app" spec)** with multiple agents: diverge, critique, converge.
4. Choose a name (original, checked against the App Store).
5. Write the v1 build spec: screens, chat flows, scoring pipeline, data model, AI cost model.
6. Set up a real project folder for the code, with a CLAUDE.md of app decisions, plus an `ios-app-ux-standards` skill.

## Key sources (selected)
- Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/
- App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- NN/g 10 heuristics: https://www.nngroup.com/articles/ten-usability-heuristics/ · Response times: https://www.nngroup.com/articles/response-times-3-important-limits/ · Progressive disclosure: https://www.nngroup.com/articles/progressive-disclosure/
- Jakob's Law: https://lawsofux.com/jakobs-law/ · WCAG contrast: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
- Duolingo streaks: https://blog.duolingo.com/improving-the-streak · Milkman megastudy: https://www.scimex.org/newsfeed/which-programs-give-gym-goers-the-biggest-boost
- RevenueCat State of Subscription Apps: https://www.revenuecat.com/state-of-subscription-apps · Retention by plan: https://www.revenuecat.com/blog/growth/one-year-retention-rates-insights/
- Adapty Health & Fitness benchmarks: https://adapty.io/blog/health-fitness-app-subscription-benchmarks/
- CDC Data Brief 546: https://www.cdc.gov/nchs/products/databriefs/db546.htm
- AppGoblin (install estimates): https://appgoblin.info/apps/6743036247 (Arise) · /6746586837 (Lock In) · /295905460 (Fuelly) · /552472249 (CARFAX)
- Starter Story Prayer Lock: https://www.starterstory.com/businesses/prayer-lock/revenue
- Solo Leveling: Arise revenue: https://www.pocketgamer.biz/solo-leveling-arise-hits-50m-players-and-139m-revenue-in-first-six-months/ · https://www.cbr.com/solo-leveling-arise-game-download-ranking/
- TIME on looksmaxxing: https://time.com/article/2026/05/02/face-value-why-looksmaxxing-is-more-than-hope-and-mirrors/
- Mintel Gen Z men's skincare: https://personalcaremagazine.com/story/45535/us-men-skin-care-usage-soars-68-in-two-years-mintel
- Movember/AOL: https://www.aol.com/more-third-young-men-watch-230227879.html · Gallup loneliness: https://news.gallup.com/poll/690788/younger-men-among-loneliest-west.aspx
- Jobright review: https://resumehog.com/blog/posts/jobright-ai-review-2026-features-pricing-and-best-tips.html · LinkedIn Job Match: https://www.socialmediatoday.com/news/linkedin-ai-tools-job-seekers-recruiters-smbs/737481/
- Mass.gov security deposits: https://mass.gov/info-details/massachusetts-law-about-tenants-security-deposits
- Fuelly forum: https://www.fuelly.com/forums/f2/is-fuelly-no-longer-being-updated-23193.html
- StatCounter Ethiopia: https://gs.statcounter.com/os-market-share/mobile/ethiopia · Apple forum (no IAP in Ethiopia): https://developer.apple.com/forums/thread/837607
- Allergy-Safe Meal Planner: https://apps.apple.com/ng/app/allergy-safe-meal-planner/id6792343392 · NumYum: https://www.numyum.ai/blog/ai-meal-planner-allergies-picky-eaters-multiple-diets
- App Store data: Apple's public iTunes Search API and customer-review RSS, pulled Oct 4–5, 2026

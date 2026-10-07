# 04 — Business, Retention & Growth Strategy

*Strategist: Business/Retention/Growth. Date: Oct 5, 2026. Builds on research-context.md (Parts A, B8, C1–C7). Locked decisions respected: style-first, chat-first, "Check my fit" day-1 core, fit score /10 from a fixed pipeline, no RPG, "your stylist" framing, real free tier, ~$29.99/yr Pro, founder-as-creator marketing, rate outfits never people.*

**Labels:** [Brief] = from research-context.md. [Web] = looked up Oct 5, 2026 (sources at end). [Estimate] = my model; treat the numbers as hypotheses to check against real data.

---

## 0. The one-paragraph strategy

Grow organically: the founder posts daily short-form "fit fix" reveals with the app's score card built into each video. Keep a free tier generous enough that minors and skeptics can use it and share from it every day. Charge for **quantity and depth** (unlimited checks, closet-based outfit planning, unlimited chat, the full Lookbook archive). Never charge for **seeing your score**. Retention comes from things ChatGPT can't do: a closet that grows by itself, a Rotation number that goes up, and a monthly Lookbook. Run AI on a budget model, because at $29.99/yr the AI bill decides whether the app is a business.

---

## 1. Monetization design

### 1.1 Free vs Pro boundary

The rule: **free users get the full quality of every core answer, just fewer of them.** Pro unlocks volume, planning and history. Everything that produces a share card stays free, because share cards are the growth engine.

| Feature | Free | Pro |
|---|---|---|
| Fit check (score, sub-scores, 2–3 fixes, occasion-aware) | **1/day, full detail, never blurred** | Unlimited (fair use: 15/day) |
| "Re-check after fix" (the 6.5 → 8.5 moment) | 1 re-check on that day's fit | Unlimited |
| Stylist chat questions | 5/day | Unlimited (fair use) |
| "What should I wear?" (outfit built from *your* closet) | 1/week (taste of it) | Daily, plus a Monday "week of fits" plan |
| Closet auto-build, Rotation count, starter essentials checklist | Yes | Yes |
| "+N fits" ranking of the next best item to buy | Top 1 item | Full ranked list with price ranges and fit tips |
| Style DNA | Yes (it's a share card) | Yes, plus monthly change over time |
| Monthly Lookbook card | **Yes, the current month** (share card) | Full archive, outfit-history calendar, "first fit vs now" comparison |
| Occasion prep ("interview Thursday") | Generic checklist | Personalized from closet plus a reminder |
| Days dressed with intent streak and shields | Yes | Yes, plus 1 extra shield/week |
| Gaps and cost per wear | — | Yes |

**Earned bonus checks (free tier):** a free user earns +1 fit check by photographing 3 closet items, or by being the referrer or referee of a friend who completes his first check (see §4). This rewards the actions that drive retention, because a richer closet means more Rotation and better suggestions (the IKEA effect in C14). It also means the user hitting his limit always has a free option besides paying.

**Out-of-checks screen copy:** "You've used today's check. Next one at midnight. Want to save this photo and check it then? Or go Pro for unlimited." Three equal choices, with **Save for tomorrow** as the default. No countdown timers or exit-intent discounts, since C4 shows competitors use those and users read them as manipulative.

### 1.2 Prices to test

| Plan | Launch price | Test | Notes |
|---|---|---|---|
| **Annual (default, preselected)** | $29.99 with a 14-day trial | vs $39.99 | Matches what men in C7 said they'd pay ("only pay the $29 a year"). The margin is thin (see §2), so test $39.99 once traffic allows. |
| Monthly | $5.99, no trial | vs $4.99 | Its main job is to make the annual plan look like a deal (58% off). |
| Lifetime | $59.99 | vs $79.99 | Fits the "no subscription" sentiment (Stylebook praise, C7). A lifetime user costs about $0.50/mo on the budget model (§2), so the price needs fair-use caps. |
| Weekly | **Never** | — | 560 looks-app complaints were about pay-per-scan and weekly billing (C3), and weekly plans keep only 3% of users after a year (C2). |
| Founding member (waitlist only) | $19.99 for the first year | — | Delivered through Apple offer codes or an introductory offer. It rewards the waitlist and creates launch-week urgency without fake timers. |

**Testing reality check:** at roughly 100–300 trial starts a month, a price A/B test won't reach statistical significance for months. Run price tests **sequentially** (2–3 weeks per price), test only large differences ($29.99 vs $39.99), and read the results directionally. Don't run more than one paywall test at a time.

### 1.3 Trial length

- RevenueCat 2026: trials of 17–32 days convert at **42.5%**, vs 25.5% for trials under 4 days. H&F median trial-to-paid is 37.7% (Adapty: 42.2%) [Brief C2]. Part of that gap is selection bias (apps that offer long trials differ in other ways), but the direction holds.
- A trial user costs AI money. At budget-model prices, a 14-day trial costs about $0.25–0.80 per user (§2), which is affordable.
- **Recommendation:** a **14-day trial on annual** at launch. In month 3, test a 30-day "first month free" trial, which lines up with the first Lookbook landing on day 30, right at the novelty dip. No trial on monthly.
- Send a reminder 2 days before the trial ends ("Your trial ends Friday. Here's what you used: 9 checks, Rotation 23 → 41"). This cuts refund anger, fits the brief's "easy cancellation" promise, and turns the reminder into a progress summary.

### 1.4 Paywall placements

| # | Placement | Type | Trigger |
|---|---|---|---|
| 1 | Onboarding step 10, after the first fit check and "Your first 3 moves" | Soft, full screen, **"Continue free" clearly visible** (not a faint X) | First value moment |
| 2 | Daily limit reached (2nd fit check or 6th question) | Soft sheet, with "Save for tomorrow" as the default | Natural demand peak |
| 3 | Tapping a Pro feature (full "+N fits" list, Lookbook archive, daily outfit plan) | Soft sheet showing a preview of the actual result | Contextual |
| 4 | Day 7 and day 30 progress moments ("Your Rotation grew +18") | An inline card in chat, not a modal | Goal-gradient moment (C2) |

**Hard vs soft:** RevenueCat says hard paywalls convert at 10.7% vs freemium 2.1%, with similar 1-year retention [Brief C2]. That's a real argument, but three things outweigh it here:
1. 69% of 1–2★ reviews in quest apps are about paywalls, and many reviewers are 12–15 ("I'm 14 I can't pay") [C3].
2. The growth engine needs free users producing share cards every day.
3. The app's positioning against ChatGPT depends on people trying it with no friction.

**Decision: soft paywall plus a strong trial offer at the value moment.** Revisit only if trial→paid is healthy but trial starts stay under 5% by mid-January (§6). Then test a "soft-hard" variant: the paywall shows once at onboarding and "Continue free" moves to a secondary button. It stays visible; never hide it.

### 1.5 Never "pay to see your score"

- The score, sub-scores and fixes are **always fully visible** on free checks. Never blur or tease anything.
- Never gate a share card.
- Never charge per scan.
- The paywall copy sells *more* and *planning*, never *unlocking the result*.
- Put "Your score is always free" on the paywall itself. It's a differentiator worth stating.

### 1.6 Under-18 / parent purchase

- Turn on **Family Sharing** for the subscription products. One parent subscription covers the family, so a father and son can both use it (the app is for ages 14–50+).
- **Ask to Buy:** if a teen is in a Family Sharing group with Ask to Buy on, tapping Subscribe sends the request to the parent automatically. The app needs no extra code for this. Make the paywall copy friendly to it: "Under 18? Tapping Subscribe can send a request to your parent."
- **"Ask a parent" card:** a shareable iMessage card written for parents: "Helps him dress for interviews, school and first impressions. Rates outfits, never bodies or faces. Photos stay private." It points to the App Store page. Parents are buying a confidence and life-skills tool, not a looks app.
- **App Store gift cards** are an easy holiday purchase. Run a December push ("gift for your little brother").
- Don't show discount pressure or urgency to users who self-identify as under 18 (UK Children's Code, which discourages nudges).

### 1.7 Affiliate revenue (later, v1.2+)

Recommending item *types* with price ranges is already locked (A3). After roughly 5K MAU, add optional "Shop this type" links (Amazon Associates, LTK/ShopStyle, Rakuten), clearly labeled "affiliate." [Estimate] With 3% of MAU clicking through monthly, a $40 average basket, ~4% commission and ~30% purchase rate, 5K MAU produces about $7/mo. That's negligible early. **Affiliate revenue is a v2 lever; subscriptions are the business.** Never let affiliate links influence the score.

---

## 2. Unit economics [Estimate]

### 2.1 AI cost assumptions

- **Fit check:** about 7,000 input tokens (cached rubric system prompt ~3K, user memory/closet ~1.5K, one downscaled image ~1–1.5K, occasion/context) plus ~1,000 output tokens (structured JSON: scores, fixes, detected items), plus 20% overhead for retries, moderation and item extraction.
- **Chat message:** about 4,000 input plus 350 output.
- **Prices [Web, Sept–Oct 2026]:** Gemini 2.5 Flash $0.30/$2.50 per 1M tokens; GPT-5 mini $0.25/$2.00; GPT-5.4 mini $0.75/$4.50; Gemini 3.6 Flash $1.50/$7.50.
- **Usage profiles:**
  - Light free MAU: 4 checks and 6 messages a month
  - Heavy free: 30 checks and 90 messages
  - Typical Pro: 40 checks and 150 messages
  - Heavy Pro: 150 checks and 400 messages

| Model tier | Per fit check | Per message | Light free MAU/mo | Heavy free/mo | Typical Pro/mo | Heavy Pro/mo |
|---|---|---|---|---|---|---|
| Budget (Gemini 2.5 Flash-class) | $0.0055 | $0.0021 | **$0.04** | $0.35 | **$0.53** | $1.66 |
| Mid (GPT-5.4 mini-class) | $0.012 | $0.0046 | $0.07 | $0.76 | $1.15 | $3.58 |
| Premium (Gemini 3.6 Flash-class) | $0.022 | $0.0086 | $0.14 | $1.42 | $2.16 | $6.69 |

Prompt caching of the fixed rubric can cut input cost a lot (cached input is ~10% of the base price on Gemini 2.5 Flash [Web]), so treat these as upper-middle estimates.

**Other costs:**
- Apple Developer Program: $99/yr
- RevenueCat: free until $2.5K monthly tracked revenue, then 1% [Web]
- Supabase/storage: free tier at first, then ~$25/mo
- Image moderation: use a free or cheap moderation endpoint

### 2.2 Revenue per payer

- Apple Small Business Program commission is **15%**.
- Annual $29.99 → **$2.12/mo net**. Monthly $5.99 → **$5.09/mo net**.
- With a 70/30 annual/monthly mix (annual is 61% of H&F revenue per Adapty, C2), blended net is about **$3.01/payer/mo**.

### 2.3 Break-even conversion (paying share of MAU)

Formula: c × (revenue − Pro cost) = (1 − c) × free cost.

| Routing | Free MAU cost | Pro cost | Break-even paying % of MAU |
|---|---|---|---|
| Budget everywhere | $0.04 | $0.55 | **1.6%** |
| Hybrid (premium model for scoring only) | $0.08 | $0.90 | **3.7%** |
| Premium everywhere | $0.15 | $1.90 | **11.9%**, which doesn't work |

**Implications:**
1. **The budget model is mandatory.** Use a stronger model only to evaluate quality offline, or as a fallback when confidence is low.
2. **A heavy Pro user on annual ($2.12/mo net) on the mid tier ($3.58) loses money.** So fair-use caps are essential, plus image downscaling to ~768px, a cached rubric, a server-side per-user daily quota, a global daily spend kill-switch, and cost alerts.
3. **This is a strong reason to test $39.99/yr.**

---

## 3. 6-month revenue scenarios [Estimate]

**Assumptions:**
- Months count from public launch (target early Nov 2026).
- Downloads come from organic short-form only.
- Trial conversion lands within the same month (14-day trial).
- 70% of payers choose annual (cash collected upfront) and 30% monthly.
- Monthly subscribers churn at the stated rate. No annual renewals fall inside 6 months.
- A small share of downloads buy lifetime directly ($59.99).
- All revenue is net of Apple's 15%.
- MRR treats annual plans as 1/12 per month.

| Assumption | Pessimistic | Base | Optimistic |
|---|---|---|---|
| Downloads/mo (M1→M6) | 300→800 (no hits) | 800→5,500 (a few 100K+ videos) | 2K→18K (1–2 multi-million videos) |
| Trial start (of downloads) | 6% | 10% | 13% |
| Trial→paid | 25% | 35% | 42% |
| Monthly-plan churn | 20%/mo | 15%/mo | 12%/mo |
| Direct lifetime purchases | 0.3% | 0.5% | 0.7% |

| Month | Pess. downloads | Pess. net cash | Base downloads | Base new payers | **Base net cash** | Base MRR-equiv. | Opt. downloads | Opt. net cash |
|---|---|---|---|---|---|---|---|---|
| 1 | 300 | $133 | 800 | 28 | $746 | $84 | 2,000 | $2,829 |
| 2 | 400 | $183 | 1,500 | 52 | $1,436 | $236 | 5,000 | $7,220 |
| 3 | 500 | $234 | 2,500 | 88 | $2,431 | $483 | 9,000 | $13,228 |
| 4 | 600 | $285 | 3,500 | 122 | $3,463 | $817 | 12,000 | $18,073 |
| 5 | 700 | $336 | 4,500 | 158 | $4,526 | $1,234 | 15,000 | $23,066 |
| 6 | 800 | $388 | 5,500 | 192 | **$5,614** | **$1,729** | 18,000 | $28,189 |
| **6-mo total** | 3,300 | **~$1.6K** | 18,300 | ~640 | **~$18K** | — | 61,000 | **~$93K** (M6 MRR-equiv. ~$9.2K) |

**AI cost against base (hybrid routing):**
- Month 6: about 3,700 free MAU × $0.08 plus ~600 payers × $0.90 ≈ **$400–850/mo**, or 15–25% of that month's cash.
- On budget routing it's about $150–350/mo.

**Reading:** the base case is "meaningful student income" by month 3–4 (about $2–3.5K/mo in cash). The cash figure is front-loaded by annual plans, so watch MRR-equivalent, which reaches only about $1.7K by month 6. For context, Chris Raroque's Amy reached about $3.4K MRR in ~10 months with an audience [B8]. The base case is plausible only if the content engine works. The pessimistic case is what happens if no video breaks out, which is why the content checkpoints in §6 come *before* the product checkpoints.

---

## 4. Retention system

### 4.1 Loops

| Cadence | Loop | Mechanic | Evidence |
|---|---|---|---|
| Daily | Morning outfit idea from his own closet (opt-in push at a time he picks), fit check before leaving | Utility, not novelty | C14 utility-only pushes |
| Daily | Any single action counts toward "days dressed with intent": a check, tapping "Wore it," adding an item, or asking a question | Low bar | Duolingo "any lesson counts" +3.3% D14 (C2) |
| Weekly (Mon) | **"Your week in fits"**: 3–5 outfits planned from the closet (Pro), or 1 suggestion (free) | Fresh start | Dai/Milkman fresh-start effect (C2) |
| Weekly (Sun) | Mini recap in chat: days with intent, best score, Rotation change ("+6 fits this week") | Progress as reward | Goal gradient (C2) |
| Per item | "+12 fits" shown when an item is added, and Rotation climbing | IKEA effect, visible progress | C14, A3 |
| Ongoing | **Starter essentials, pre-filled** from items detected in the first fit check (e.g. "3 of 12" on day 1) | Endowed progress, 34% vs 19% completion | Nunes & Drèze (C2) |
| Monthly | **Lookbook**: days dressed with intent, top 3 fits, Rotation growth, Style DNA change. Shareable. | Wrapped-style self-enhancement | Berger 2014, Spotify Wrapped (C2) |
| Seasonal | "Fall/Winter/Spring closet refresh": which items rotate in, what gap to fill | Fresh start | C2 |
| Event | Occasion prep: "Interview Thursday? Want a check Wednesday night?" (user-set) | High-stakes utility | C7 "dress for the occasion" +560 |

### 4.2 Streak rules (forgiving by design)

- **Lead with a lifetime counter that never decreases:** "41 days dressed with intent." The daily chain is secondary.
- **Make the weekly goal the main target:** "4 of 7 days this week." The user picks 3, 4 or 5 days, which respects choice (Patall, C2).
- **Shields:** 1 per week auto-applies (2 for Pro), like Duolingo's Weekend Amulet (+4% returns).
- **Repair:** a missed day can be repaired within 48h by doing one check. Streak repair helps, per Silverman & Barasch (C2).
- **No negative UI:** no red "streak lost" and no penalties (Habitica: unfair punishment demotivates, C2). If a streak breaks, the copy is simply "New streak starts today."

### 4.3 Comeback flows

The Milkman megastudy found that a bonus for returning after a miss was the top intervention, at +27% (C2).

- **After 3+ days away**, open with: "Welcome back. Your first check today counts double toward this week." Then give one quick-start button: "Check today's fit."
- **After 14+ days away:** a "fresh start" reset. Offer to re-do the 3 basics if anything changed, and show "Since you've been gone: your closet still makes 37 fits."
- **No guilt pushes.** At most one re-engagement push, tied to a real event (Monday plan, Lookbook ready, a season change). Never "we miss you."

### 4.4 Notifications (utility only, at most 1/day)

| Notification | Default | Frequency |
|---|---|---|
| Morning outfit idea (user's chosen time) | Asked in context at onboarding | Daily |
| Occasion reminder | Only when the user sets one | Per event |
| Monday week plan | Opt-in | Weekly |
| Lookbook ready | On if pushes are allowed | Monthly |
| Trial ending, with usage summary | Always (transactional) | Once |

**Auto back-off:** after 3 ignored pushes in a row, drop to weekly and tell the user in-app. The app works fully without push (guideline 4.5.4). Rotate templates (Duolingo +0.5% DAU) and personalize with closet items (+3.9%, Bidargaddi).

### 4.5 Surviving the week 3–5 novelty dip

C2 says gamification effects decay (g=0.42 → 0.15) and novelty dips around week 4. Plan for it.

1. **Utility that doesn't depend on novelty.** By week 3 the closet has 15–30 items, so "What should I wear?" gets *better* over time while ChatGPT doesn't improve. Say so in-app: "Your stylist now knows 24 of your items."
2. **Schedule reveals by progressive disclosure:**
   - Week 2: Style DNA reveal (after 8 checks)
   - Week 3: first gap analysis ("Your one missing piece: a navy overshirt, +14 fits")
   - Day 21–28: **"First fit vs now"** comparison card
   - **Day 30: the first Lookbook**, timed to the user's own 30-day anniversary rather than the calendar month, so it lands in the dip
3. **A light "Starter month" lesson track** delivered in chat (not RPG quests): week 1 fit, week 2 color, week 3 shoes, week 4 proportion. Each week ends with a checklist.
4. **Seasonal and holiday occasions** in the launch window: Thanksgiving, holiday parties, New Year's, then a fresh start on January 1 (the biggest fresh-start date of the year).

---

## 5. Built-in virality

### 5.1 Share cards (all free, 9:16, one tap to TikTok/IG/iMessage)

| Card | Content | Why it spreads |
|---|---|---|
| **Score reveal** | Outfit photo (neck-down crop toggle, **on by default for under-18**), animated score, a one-line verdict ("Clean. Fix: cuff the jeans once.") | Matches the 5–8s reveal format that won on TikTok (C6) |
| **Before → after** | "6.5 → 8.5 after 1 fix," split screen | Shows effort and progress, the strongest proof the app works |
| **Lookbook** | Monthly: days with intent, top fits, Rotation +N, Style DNA | Wrapped-style identity sharing (C2) |
| **Style DNA** | "60% minimalist · 30% smart casual · 10% workwear" | Identity, and people screenshot it |
| **Rotation** | "4 items → 11 outfits" | Educational, and invites "how?" comments |

**Watermark:** a small, clean wordmark plus "scored by [App]" in the corner on every card, for free and Pro users alike. Don't sell watermark removal, because the watermark is the distribution.

**Safety and Apple 1.2:** cards always rate the *outfit*. No face scores, no body terms, no leaderboards ranking people.

### 5.2 "Second opinion" link (lightweight social loop)

The user shares a card link. Friends open a web page (no install needed) and tap one of three preset reactions: Wear it / Change one thing / Different fit. There is **no free-text field**, so there's no bullying channel and no UGC moderation burden. The page footer says "Check your own fit free →." This uses social input (Duolingo-style social features lift engagement, C2) without building a feed.

### 5.3 Referral, never a wall

- Users hate "invite 3 friends" walls (70 complaints, C3). So the referral is **optional, give-and-get, and never blocks anything**.
- **Mechanic:** "Give a week, get a week." His personal link gives a friend 7 days of Pro once the friend completes a first fit check, and he gets 7 days too (stackable to 8 weeks). Grant it as a server-side promotional entitlement (RevenueCat supports this), with no App Store purchase needed. Free users can choose +3 bonus checks instead.
- **Placement:** only after a high-score moment or a Lookbook share. Never at onboarding, never on a limit screen.

---

## 6. Organic content plan (the founder as style creator)

### 6.1 Three pillars

1. **Fit Fix reveals (≈50% of posts).** Score → one fix → re-score. Subjects are the founder, friends, and adult strangers who consent. Proven format: short, funny reveals (Lock In got 3.3M views with 1.6K followers; UCHAD 14.6M, C6).
2. **Beginner lessons with identity tension (≈35%).** Height and build, "stop dressing like a boy," occasions, budget. Proven: "Stop Dressing Like A Boy" 3.9M; "How To Dress For Your Height" 865K (C7).
3. **Building it in public (≈15%).** "College student building a pocket stylist, day N," including his own glow-up. Builds the waitlist and trust, following Raroque's waitlist lesson (B8).

**Rules:**
- No app-demo videos. They get 3–5K views (C7).
- The app appears as **the scoring card overlay for 1–2 seconds** in the reveal. The founder is the personality, and the card makes the score feel objective.
- Soft CTA on about 1 in 3 videos only: "The stylist I built gave this a 6.5. It's in my bio."
- Never feature minors' faces. Stranger content needs on-camera verbal consent plus a quick signed release (a free form).

### 6.2 Fifteen video ideas

| # | Pillar | Hook (first 1.5s) | Format |
|---|---|---|---|
| 1 | Reveal | "My roommate thinks this is a 9." | Score reveal (6.0), one fix, re-score 8.0. 7s. |
| 2 | Lesson | "Stop dressing like a boy. 3 swaps." | Graphic tee → heavyweight plain tee, etc. |
| 3 | Lesson | "Short guys: this is making you look shorter." | Pant break plus monochrome demo (5'7" lesson) |
| 4 | Lesson | "Tall and skinny? Your shirts are lying to you." | Shoulder seam and layering |
| 5 | Lesson | "Bigger guys, nobody tells you this fit rule." | Structure, darker tops, no clingy fabric |
| 6 | Reveal | "Rating fits on campus. The last one is a 9.5." | Street fit checks, adults, with consent |
| 7 | Reveal | "Guess the score before I reveal it." | 3s fit, pause, reveal. Drives comments. |
| 8 | Reveal | "Rating my dad's going-out fit." | Wholesome, reaches older viewers and parents (and the parent purchase) |
| 9 | Lesson | "You don't need more clothes. You need these 5." | Starter essentials with price ranges |
| 10 | Lesson | "4 items. 11 outfits." | Rotation concept, quick cuts |
| 11 | Lesson | "Date in 2 hours? Don't wear the blazer." | Trying too hard vs. put together (blocker #3) |
| 12 | Lesson | "Your shirt is wrong and it's not the color." | Fit-is-king demo |
| 13 | Build | "I'm 20 and building an app that rates your fit. Day 1." | Build in public, waitlist CTA |
| 14 | Build | "Me in high school thinking I dressed well." | Founder's before → after, scored |
| 15 | Reveal | "Interview fit: underdressed, right, overdressed." | 3 looks, 3 scores, "slightly overdress" rule |

Recurring series names help repeat viewers: "One Fix" (6.5 → 8.5) and "Fit Court" (viewers submit, adults only or neck-down).

### 6.3 Cadence and measurement

- **Cadence:**
  - 2 posts/day for 4 weeks pre-launch, then 2–3/day.
  - Same video cross-posted to TikTok, Reels and Shorts.
  - Batch-film twice a week (Sun/Wed, ~2h for 8–10 clips).
  - Starter Story apps posted 3–10/day [B8], but 2–3 is sustainable for a student.
- **Measure per video:**
  - 3-second hold rate (target ≥ 60%)
  - Completion % (≥ 40% for videos under 10s)
  - Shares and saves per 1K views
  - Follows per 1K views
  - Profile visits → link clicks → waitlist signups (later installs) per 1K views
- **Attribution:**
  - App Store Connect campaign links (`ct=` tokens) per platform
  - One onboarding tap: "Where did you find us?"
- **Weekly review:** double down on the top 20% of formats and drop formats that sit under 1K views after 5 tries.

### 6.4 Four-week pre-launch plan (Oct 6 – Nov 2, 2026; build in parallel)

| Week | Content | Audience/waitlist | Product |
|---|---|---|---|
| 1 (Oct 6–12) | 14 posts across all 3 pillars to find the winning format. Day-1 build-in-public video. | Free waitlist page (simple static page plus free form). Instagram bio link works immediately; on TikTok, use a pinned comment until a bio link is available. | Scoring pipeline prototype. Internal test: the same outfit re-scored 10× should vary by ≤ ±0.5. |
| 2 (Oct 13–19) | Double down on the top 2 formats. Start the "One Fix" series. | "Send me your fit, I'll score it on video" (adults, consent) feeds content and the waitlist. | Onboarding plus fit check working end to end |
| 3 (Oct 20–26) | Waitlist-only perks video ("first 500 get $19.99/yr"). | Target **300+ signups**. Invite the first 50 to TestFlight. | Closet auto-build, Rotation, essentials, share card, paywall (RevenueCat) |
| 4 (Oct 27–Nov 2) | Countdown, plus the founder's own 30-day before → after | Target **500+ signups**. Collect TestFlight feedback. | Submit to App Review around Oct 30. Launch the week of Nov 3, with Thanksgiving and holiday content right behind it. |

---

## 7. Launch and validation plan

### 7.1 v1 scope (tests the riskiest assumptions)

The riskiest assumptions, in order:
- (a) Men come back to check fits repeatedly.
- (b) The score feels consistent and trustworthy (33 "scores are random" complaints, C3).
- (c) Content drives installs.
- (d) Users pay with a generous free tier.
- (e) AI cost stays under $0.10 per MAU.

**Ship in v1:**
- Chat onboarding (A4)
- Fit check plus re-check
- Chat with limits
- Closet auto-build
- Rotation and essentials
- Days-with-intent counter with shields
- Score and before → after share cards
- Paywall, trial and Family Sharing
- "What your stylist knows" page
- Moderation
- Cost guardrails

**Ship by day 30 (v1.1):** Lookbook (the first one is due then anyway), Style DNA, referral, second-opinion link.

**Defer:** gaps and cost per wear, affiliate, widgets.

### 7.2 Metrics and thresholds

| Metric | Target ("working") | Warning |
|---|---|---|
| D1 / D7 / D30 retention | **≥ 35% / 18% / 9%** (H&F benchmark 27/13/8, C2) | D7 < 10% |
| Fit checks per weekly active user per week | **≥ 3** | < 1.5 |
| Share rate (users who share ≥ 1 card in week 1) | **≥ 15%** | < 5% |
| Trial start (of installs) | **≥ 8%** | < 4% |
| Trial → paid | **≥ 30%** (median 37.7%) | < 20% |
| Download → paid by D35 | ≥ 2.5% (H&F median 2.9%) | < 1% |
| AI cost per MAU | ≤ $0.10 | > $0.20 |
| Score consistency (internal re-score test) | ≥ 90% within ±0.5 | < 80% blocks launch |

### 7.3 Kill and pivot criteria with dates

| Date | Gate | If it fails |
|---|---|---|
| **Nov 2, 2026** (pre-launch, ~50 posts) | ≥ 1 video over 50K views and ≥ 300 waitlist signups | **Content pivot, not product:** new hooks, more reveals, a second account. Launch anyway; don't wait on content. |
| **Dec 7, 2026** (~4 weeks post-launch) | D7 ≥ 12% and ≥ 2 checks per WAU per week | **Product pivot:** the core loop moves from scoring to "What should I wear from my closet" plus occasion prep |
| **Jan 15, 2027** (after the New Year fresh-start push) | Trial→paid ≥ 20% and download→paid ≥ 1.5% | **Pricing/paywall pivot:** try the soft-hard paywall, a 30-day trial, $39.99, and tighter free limits (e.g. 4 checks/week) |
| **Mar 31, 2027** (~5 months) | MRR-equivalent ≥ $1,000 | Under $500 after 3 content and 2 pricing experiments: **kill or keep as a side project.** $500–2K: keep going and add commission-based creator partnerships. Over $2K: double down with more accounts and paid creators/UGC (B8: 8 of 12 fast winners used creators). |

---

## 8. Risks and mitigations

| Risk | Likelihood / impact | Mitigation |
|---|---|---|
| **Free ChatGPT/Gemini substitution** | High / High | Compete on what a blank chatbot can't do: memory of the closet and body, a **consistent explained score** from a fixed pipeline, Rotation and Lookbook progress, one-tap camera-to-verdict in about 5s, and share cards. Market the *outputs* (cards, before → after), not "AI." Show "Your stylist knows 24 of your items" to make the switching cost visible. |
| **Trend fading** ("fit check" Google Trends fell 25 → 7, C1; looksmax backlash; Arise installs dropped from 107K/week to 400/week) | Med / High | Position on evergreen "dress better / look put together," not the "fit check" meme or looksmax. Use occasion and season hooks every month. Retention comes from utility (closet, planning), not novelty. Stay clear of looksmax imagery and language (84% negative sentiment, criminal charges in the space). |
| **AI cost blowups** (heavy users, abuse, price changes) | Med / High | Budget-model routing, cached rubric, image downscaling, a per-user daily server quota, Pro fair use (15 checks/day), a global spend kill-switch with an alert at 150% of forecast, a provider-agnostic abstraction so the model can be swapped within a day, and the $39.99 price test. |
| **App Review 1.2 (objectification)** | Med / High | Rate **outfits, never people**. No face, attractiveness or body scores. No leaderboards of people. Review notes should explain the outfit-only rubric. Neck-down crop option. |
| **App Review 5.1.2(i)** (since Nov 2025, apps must disclose and get explicit opt-in before sending personal data to third-party AI) [Web] | High if ignored | A consent screen before the first photo upload: "Your photo is sent to our AI provider to score your outfit. Not used for ads. Delete anytime." Match the privacy labels. Account deletion in-app (5.1.1(v)). |
| **Minors** (14+, nudity/CSAM risk from photos, UK Children's Code, COPPA) | Med / Severe | Age gate (no under-13). Run image moderation **before** scoring and reject underwear or shirtless photos ("We only check outfits"). Private by default; no public profiles or feeds. Neck-down crop on by default under 18. No discount pressure for under-18. Data deletion. Never feature minors in marketing. |
| **3.1.2 subscription clarity / paywall anger** | Med / Med | State plainly what Pro includes, show the price and trial terms, keep "Continue free" visible, send the trial-end reminder, and offer easy cancel instructions. |
| **Fast cloners** (B12: obvious remixes get cloned within months) | High / Med | The edge is the founder's content, taste rubric and accumulated user closet data. Ship weekly, and grow the audience faster than the feature list. |
| **Founder bandwidth** (school plus daily content plus building) | High / Med | Batch filming twice a week. A v1 scope cut to the essentials. A 6–8 week decision rhythm per gate (B8). |
| **Body image harm** (muscularity content linked to dysmorphia, C2) | Low-Med / High | Fixes are about clothes, fit and proportion only. Never "lose weight" or "build muscle." No physique comparisons. |

---

### Sources (web, Oct 5, 2026)
- Gemini API pricing: [morphllm.com/gemini-api-pricing](https://www.morphllm.com/gemini-api-pricing), [pricepertoken.com Gemini 2.5 Flash](https://pricepertoken.com/pricing-page/model/google-gemini-2.5-flash-image), [dev.to Gemini 3.6 Flash pricing](https://dev.to/hassann/gemini-36-flash-pricing-what-it-actually-costs-in-2026-59he)
- OpenAI mini pricing: [anotherwrapper GPT-5 mini](https://anotherwrapper.com/llm-pricing/gpt-5-mini-2025-08-07), [anotherwrapper GPT-5.4 mini](https://anotherwrapper.com/llm-pricing/gpt-5.4-mini)
- RevenueCat pricing: [revenuecat.com/why-revenuecat](https://www.revenuecat.com/why-revenuecat), [costbench RevenueCat free plan](https://www.costbench.com/software/subscription-billing/revenuecat/free-plan/)
- Apple 5.1.2(i) third-party AI consent: [TechCrunch, Nov 13 2025](https://techcrunch.com/2025/11/13/apples-new-app-review-guidelines-clamp-down-on-apps-sharing-personal-data-with-third-party-ai), [qawerk guide](https://qawerk.com/blog/apple-app-store-ai-data-sharing-guidelines/)
- All other benchmarks: research-context.md (C1–C7, B8). The affiliate commission rate, token counts and usage profiles are my estimates.

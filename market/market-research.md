# Kitted: market research and positioning

*Oct 12, 2026. Written for the founder, who is new to marketing. Start here; the four files beside it hold the detail and every source.*

| File | What's in it |
|---|---|
| `competitors-direct.md` | ~45 "rate my outfit" / fit-check apps, men's style apps and looksmax apps: ratings, prices, what they do, reviews |
| `competitors-adjacent.md` | Closet, AI stylist and AI shopping apps (Alta, Whering, Fitted, Stitch Fix…): ratings, prices, funding |
| `market-size-trends-substitutes.md` | How many guys, how much they spend, 2025–26 trends, what ChatGPT / Google / Instagram now do |
| `benchmarks-aso-launch.md` | Subscription numbers (conversion, renewals, prices), App Store search, how $0-budget apps launched |

**How sure we are.** App Store numbers were pulled from Apple's own pages and public API today. Every other number has a source and date in the detail files. "(estimate)" means it's our model, not a fact. "(judgement)" means it's Claude's opinion. Anything only seen in a search snippet is marked unverified there. Claude spot-checked the biggest claims itself (Alta, Whering, Fits, Acloset, Fitted and Twelve70 rating counts; ChatGPT's try-on launch; Whering's funding and its planned photo scanner; Fitted's photo-to-closet feature).

---

## 0. The short version

1. **There's no leader in your exact niche.** The biggest app that only rates outfits (GRWM) has 1,866 US ratings after two years. 107 apps have "rate my outfit"-type names; 64 launched in 2026, and most have zero ratings. Building a rater is easy. Getting people to find it and come back is the hard part, and nobody has done it yet.
2. **Your real competitor is "just ask ChatGPT".** It's free, about 900M people use it weekly, and since Oct 1, 2026 it has virtual try-on. What it can't promise is the same score for the same photo, a closet it remembers, and advice written for a beginner who doesn't know what to ask.
3. **Guys 18–30 who want to look better already pay, but for apps that rate their face.** Looksmax apps (Umax, LooksMax AI, LooxUP, UCHAD, PSL) have about 157K US ratings combined. No men's outfit app has more than a handful. "We rate your outfit, never you" puts you right beside that demand, without the toxicity.
4. **Almost every competitor charges before you see anything.** In the latest reviews Claude pulled, 42% of Dressly's, 58% of Umax's and 67% of GRWM's mention charges, paywalls or cancelling. A free daily score with a free fix is your clearest difference.
5. **Two of your features are no longer unique.** "Score + one fix + re-check" is already sold by DRPD ($29.99/yr) and Looksee ($39.99/yr, 18+, clothes only, the closest pitch to yours). Fitted already pulls clothes out of outfit photos into a closet, and Whering (10M users, $7M raised Jul 2026) has announced the same. **Lead with the score and the fix; the closet is why people stay, not the headline.**
6. **Expect freemium numbers, not hit-app numbers.** With a real free tier, about 2% of downloads pay (RevenueCat 2026 median 2.1%). About 1 in 4 yearly subscribers in Lifestyle renews. Most new Lifestyle apps make under $1K in year one; the top 10% take 97.9% of the money. Downloads are the bottleneck, not the number of guys.
7. **The biggest gaps aren't research, they're setup.** Beta is in 3 weeks. Handles, domain and a waitlist or pre-order page don't exist yet, and you haven't talked to customers in a structured way. Section 8 lists exactly what to do.

**Recommended positioning (details in §5):**
> *For guys who want to look put together but don't know where to start, Kitted is the fit check in your pocket: send a photo, get an honest score out of 10 and the one change that makes it better. Unlike ChatGPT, the same photo always gets the same score, and it remembers your clothes. Unlike other outfit apps, your daily check and its fix are free, and it never rates your face or body.*

Keep the tagline **"Look put together. Without trying too hard."** It matches what young people say they want almost word for word (YPulse, Sep 2025: look good "without trying too hard", comfort first).

---

## 1. What market research is, and how a solo founder does it

Market research answers six questions. You already have partial answers to all of them; this file tightens each one.

| Question | Plain version | Where the answer comes from |
|---|---|---|
| **Who** is the customer? | Which guys, in which moment of life | Talking to them (§8 task 1), your TikTok comments |
| **What problem**, how painful? | "I don't know if this looks okay" / "I don't know where to start" | Interviews, reviews of other apps, Reddit |
| **What do they do today** instead? | Ask a friend, ask ChatGPT, copy TikTok, give up | Interviews ("show me the last time…") |
| **Who else** is solving it? | Competitors and free substitutes | §3–4 here (done) |
| **How big**, and will they **pay**? | Number of guys × share who care × share who pay | §2 and §6 here (done), then real numbers after launch |
| **How do we reach** them? | Channels, words, App Store search | §7 here, then your videos' numbers |

**The methods, ranked by how much each hour teaches you:**
1. **Talk to 10 real target guys** (not to pitch, to learn). This is the one thing nobody can do for you, and the one most founders skip. Rules from *The Mom Test* (Rob Fitzpatrick): ask about what they *did* last time, not what they *would* do; don't describe your idea until the end; compliments are worthless, commitments (signing up, paying, giving their email) are real.
2. **Use the competitors yourself.** Install the top 4, run the same photo through each twice, and screenshot every screen from onboarding to paywall. You'll learn more in 45 minutes than from any report.
3. **Read where customers already talk.** App Store reviews (Claude did this, §4), Reddit, TikTok comments on fit-check videos.
4. **Desk research.** Market size, trends, benchmarks (Claude did this, §2 and §6).
5. **Live tests.** Each video is an experiment. A waitlist or App Store pre-order measures real interest. The paywall measures willingness to pay. After launch, this is the only research that counts.

**What to skip:** surveys of your friends (they'll be nice), asking "would you use an app that…?" (everyone says yes), long market-size slides, paid reports. You aren't raising money, so TAM numbers only matter to tell you the market isn't the limit.

---

## 2. The market: how many guys, how much money

**People (facts, sources in `market-size-trends-substitutes.md`):**
- **28.1M US men aged 18–29** (Census Bureau, July 2025: 16.3M aged 18–24, 11.8M aged 25–29).
- **97%** of US adults 18–29 have a smartphone (Pew 2025). 87% of US *teens* have an iPhone (Piper Sandler, fall 2025). There's no reliable public figure for adults 18–29; the "68%" you'll see online has no source.
- **66%** of US adults 18–29 have used an AI chatbot, and 61% have used ChatGPT (Pew, Feb 2026). Your audience already trusts AI with questions.

**Money (facts):**
- Americans spent **$153.1B on men's and boys' clothing in 2025** (BEA).
- Households headed by someone under 25 spent about **$575 on men's clothing in 2024** (BLS; it swings a lot year to year).
- Gen Z and Gen Alpha will make up about 40% of fashion spending by 2035, and **41% of Gen Z use AI weekly when shopping for fashion** (BCG, Oct 2025).

**The weak spot:** no good survey measures how many young men *want to dress better*. Your waitlist, your video comments and your interviews are the cheapest way to measure it.

**Market size, built bottom-up (estimates):**

| Layer | Who | Mid estimate | Range |
|---|---|---|---|
| TAM | US men 18–29 with an iPhone | 19.7M | 16.9–22.5M |
| SAM | …who care about style and already use AI chatbots | 4.6M | 2.8–6.7M |
| SOM, year 1 | paying Pro subscribers | ~2,250 (~$67K gross) | ~420 ($13K) to ~11,000 ($337K) |

The SOM assumes 20K / 75K / 250K downloads in year one with $0 marketing (judgement) × 2.1–4.5% paying (RevenueCat 2026). **What it says:** even the optimistic case reaches a tiny slice of the guys who exist. Year-one results depend on how many people find the app and how many of them pay, not on market size.

---

## 3. Trends that matter (2025–26)

- **Men are moving from logo streetwear to "dressing for success":** quarter-zips (+31% demand in Q4 2025, Lyst), loafers, boots, workwear, interview and first-job outfits. Your smart casual and workwear paths to 8 fit this. Video hooks: "Interview outfit: 6.5 → 8.0 with one swap."
- **Fit checks are a normal content format.** Men's outfit montages and fit checks pull hundreds of thousands of views. App-demo videos pull a few thousand (Oct 5 research, `research-context.md` C7).
- **Looksmaxxing is huge among young men, with a growing backlash** (medical warnings in 2026; Gen Z anger at AI up to 31%, Gallup, Apr 2026). That's a reason to say loudly that you rate clothes, never faces or bodies.
- **Honesty is the hook:** 46% of people think an AI would give more honest outfit advice than a friend (Bloomreach survey; vendor-funded, so treat it as a direction, not a fact).
- **Big tech is moving into try-on and shopping, not daily feedback:** ChatGPT try-on (Oct 1, 2026), Google try-on in Search (Google closed its Doppl app on Apr 30, 2026), Meta's outfit ideas coming to Instagram, TikTok's shopping assistant (Oct 2026). None of them scores what you're already wearing or remembers your closet. **Don't compete on try-on.**

---

## 4. Competitors

### 4.1 The map

| Group | Examples | Biggest | Threat | Why |
|---|---|---|---|---|
| **Free substitutes** | ChatGPT, Gemini, a friend, r/malefashionadvice, TikTok | ChatGPT ~900M weekly users | **High** | Free and already on his phone. Weak spots: no fixed score, no memory of his clothes by default, and he has to know what to ask |
| **Outfit raters** | GRWM, DRPD, Looksee, FitMax, Fit Score!, ~100 clones | GRWM 1,866 ratings | Medium | Same job as Kitted, but most paywall the result, none is for men, none promises consistency |
| **Style apps that score as a side feature** | Dressly (31,865), Pureple (6,118), Fits (5,596, a "Rate outfit" card in chat) | Dressly ~$75K/mo (ScreensDesign estimate, no source) | Medium | Bigger, but aimed at women (Dressly's reviewers talk about gold jewelry and capsule wardrobes) and behind weekly plans ($7.99–11.99/wk) |
| **Closet apps** | Alta (16,188, $11M raised), Whering (11,882, $7M), Fitted (pulls clothes from outfit photos), Acloset, Indyx, Stylebook | Combyne 87,677 | Low–medium | Women-first, no scores. Fitted and (soon) Whering build the closet from photos too |
| **Men-only style apps** | Styled ($79.99/yr, 7 am outfit), Grayne ($5.99/mo), Twelve70 ("Men's Pocket Stylist"), Suited, Alice | 32 ratings | Low today | Tiny, none gives a score. Styled is almost your morning card. **Avoid "pocket stylist" in public copy: Twelve70 uses it** |
| **Looksmax apps** | Umax (51,620), LooksMax AI (42,720), LooxUP, UCHAD, PSL | ~157K ratings combined | Indirect | Same guys, same "rate me" urge, but they rate faces. 81% of Umax's latest 250 reviews are 1–2★ |

### 4.2 The six to know by name

1. **ChatGPT.** Free, huge, now with try-on and shopping. One "rate my fit" feature with memory would hurt. *Your answer:* the same photo gets the same score, a closet that fills itself, a beginner flow (photo in, verdict and one fix out, no prompt writing), and a daily habit.
2. **Looksee – Outfit Check** (10 ratings, Jan 2026). The closest pitch to yours: a verdict plus a score, clothes only, 18+. But the "First Fix" is paid ($4.99/wk or $39.99/yr) and there's no closet. *Your answer:* the fix is free.
3. **DRPD – Rate My Outfit AI** (Mar 2026). "Honest Score & Specific Fixes", rescan to compare, $29.99/yr: your loop at your price. *Your answer:* consistency, a closet, made for guys, a free daily check.
4. **GRWM – AI Stylist** (1,866 ratings). The largest pure rater, but you pay before you see tips; 69% of its latest 63 reviews are 1–2★, mostly about the paywall. *Lesson:* a hard paywall gets downloads and then gets hated.
5. **Dressly** (31,865 ratings). Proof that a style app with a score can make money (estimated, unverified), with women and with weekly plans. Its latest reviews are full of surprise charges and cancelling trouble. *Lesson:* plain trial terms are a selling point.
6. **Fitted – AI Closet** (1,157 ratings, 4.5★, Feb 2025). The closest *grown* app to Kitted's closet side.
   - **What it does:** "Fit Pic Magic" cuts each piece out of a photo of you in an outfit and puts it in your closet. It also has a chat stylist by weather and occasion, an outfit shuffler, a trip packer and a "digital twin" try-on. **It never scores your outfit or tells you what to fix.**
   - **Growth:** 600K+ downloads and 500M views, almost all from TikTok. Creators were paid about $20 a video to test ideas, and a fashion creator became co-founder (founder's own numbers, Superwall blog, Nov 2025).
   - **Reviews:** 30% of its latest 180 are 1–2★: billing, bugs, sign-in failures, and pieces cut out wrong. The audience reads young and mixed-gender.
   - **Lessons:**
     - ratings undercount downloads by roughly 500× (one data point)
     - the cheap-creator TikTok model works in this exact space
     - cut-outs that fail are visible and annoying, which is why Kitted asks "Is this your grey hoodie?" and draws tiles in code
   - **Threat: medium.** If it added a fit score, it would be your nearest rival.

### 4.3 What the reviews say (Claude pulled them today)

Claude downloaded the most recent public US reviews (Apple's review feed) for Dressly (250, Jun–Oct 2026), Umax (250, Apr 2025–Sep 2026), Pureple (250, 2021–2026) and GRWM (63, all of them). It counted themes by keyword, then read a sample of the low-star reviews to check the counts.

| App | 1–2★ share | Mentions charges / paywall / cancelling | Main complaint, read by hand |
|---|---|---|---|
| Dressly | 48% | 106 of 250 | Tricked into add-ons, charged after cancelling, generic advice |
| Umax | 81% | 145 of 250 | Pay to see results, scans stuck loading |
| GRWM | 69% | 42 of 63 | Can't get past the paywall, "said it was free" |
| Pureple | 49% | 50 of 250 | Bugs (98 mentions), then price |

**What it means:** in this category, the paywall and billing *are* the bad reviews. Kitted's free daily score, a skippable paywall and an honest trial reminder aren't just ethics; they're how you get good ratings, and ratings help you rank in App Store search. *Caveats:* the feed shows only recent reviews, keyword counts are rough, and unhappy people review more.

### 4.4 Where nobody is (your openings)

- **A free, consistent score with a free fix, for guys.** Every big rater paywalls the result; none promises consistency; none is built for men.
- **"Clothes, never you."** A safe way to look better for guys burned out on looksmaxxing.
- **Beginner language.** Competitors talk "drip" and "aesthetic" or women's capsule wardrobes. Nobody talks to the guy who just wants to not look off at his first job.
- **Your closet, used for advice.** Pulling clothes out of photos is now common, but no app uses that closet to score your outfit or tell you what to wear tomorrow.

**Your moat is not the features.** 64 raters launched this year; anyone can copy a feature in a weekend. What's hard to copy is your daily content, your taste, the gold-set-tuned rules, and each user's closet built up over weeks.

---

## 5. Niche, problem and positioning

### 5.1 The niche
**A fit check for guys who want to dress better but don't know where to start.** That's narrower than "men's fashion app" or "AI stylist", which are crowded with shopping apps and women's closet apps.
- **Who:** guys 18–30, style beginners, US. Start with 18–25 at a "new chapter" moment: college, a first internship or job, interviews, dates, a fresh start after a breakup.
- **What they want:** to look put together and grown up, without trying too hard.
- **What they fear:** looking off, or looking like they tried too hard.

### 5.2 The problem statement
**Short:** *Guys can't tell whether their outfit works or what to change, and there's no quick, honest, judgment-free way to find out.*

**Full:** *Young guys want to look put together for class, a first job or a date, but most don't know where to start. Standing in front of the mirror, they can't tell if an outfit works or what to change. Friends are polite or not around. ChatGPT gives a different answer every time and only helps if you know what to ask. Most outfit apps charge before showing anything, and the popular "rate me" apps judge their face instead of their clothes. So they either wear the same safe outfit every day or overthink it and feel like they're trying too hard.*

**Where it comes from:**
- Oct 5 research (`research-context.md` C7):
  - the #1 blocker is not knowing where to start; then fit, the fear of trying too hard, and putting outfits together
  - the top motivations are confidence, dating, and work and first impressions
- §3–4 here: how today's alternatives fall short.

**The weak spot to test in the interviews:** how *often* guys feel this. Every morning supports a daily habit and a subscription. Only before an interview or a date means a few uses a year and few payers. Interview question 1 is there for this.

### 5.3 What makes Kitted different
Kitted's core, in the founder's words (Oct 12): **the fit check, plus a closet you never have to upload. It picks up your clothes as you rate fits, then uses them for suggestions later.**

Both halves exist somewhere else. **What no one else offers is the two joined into one loop:**

> **Send a fit pic → get a score and the one fix → your clothes are saved without extra work → tomorrow's outfit idea comes from the clothes you actually own → check that fit too.**

| | Scores your fit + tells you the fix | Closet without uploading everything | Suggestions from your own clothes | Same photo, same score | Free daily result | Made for guys |
|---|---|---|---|---|---|---|
| **Kitted** | Yes, at least one fix free | Yes, from your fit checks | Yes, the morning card | Yes, by design | Yes | Yes |
| ChatGPT | Kind of; you have to ask | No | Only if you describe your clothes | No | Yes (limited) | No |
| Looksee, DRPD, GRWM (raters) | Yes, but the fix or tips are paid | No closet | No | Not promised | No | No |
| Fitted | No score | Yes, Fit Pic Magic (you upload fit pics to fill it) | Yes, outfit generator and chat | n/a | Paid tiers | No (mixed) |
| Alta, Whering (closets) | No | No, upload item by item (Whering has announced a photo scanner) | Yes | n/a | Yes (free) | No (women-first) |
| Umax and other looksmax apps | Rate your face, not clothes | No | No | Users say no | No | Yes |

**The honest version:**
- **"No uploading" alone isn't unique.** Fitted already does it, and Whering has announced it. Kitted's difference is that you never set out to build a closet: it fills up as a side effect of checking your fits, then gets used for advice.
- **The closet is the reason to stay, not the hook.** Lead with the fit check. Say "it learns your clothes" second.
- **Every feature can be copied.** The moat is the loop working well, your daily videos, and each user's closet growing over weeks (which makes switching costly).

**One sentence of differentiation:**
> *Kitted is the only fit check that learns your closet while it rates your fits, so its fixes and outfit ideas use clothes you already own whenever it can.*

### 5.4 Positioning: how Kitted should present itself

Positioning means choosing which alternative you're compared with, what only you do, and for whom. This follows April Dunford's method (*Obviously Awesome*).

**1. What he'd do without Kitted:** ask a friend or a girlfriend, ask ChatGPT, copy a TikTok fit, post to Reddit, or wear the same thing and hope.

**2. What only Kitted does (true today):**
- The same photo always gets the same score, by design (the code judges, the AI only describes).
- Specific fixes, at least one free, in plain words.
- A free daily check you can see before paying.
- Faces are hidden before the photo is sent; it never rates face, body or weight.
- It learns your clothes from your fit photos and suggests tomorrow's outfit from them.
- Made for guys.

**3. What that's worth to him:** know you look put together before you walk out, know the one change that makes it better, and learn without being judged.

**4. Who it fits best (the beachhead):** guys 18–25 at a "new chapter" moment, such as starting college, a first internship or job, an interview, a first date or a breakup reset. Already takes mirror selfies, doesn't know where to start, afraid of trying too hard. Start with college guys and new grads: you can reach them in person, and research says these are the top motivations (confidence, dating, work and first impressions).

**5. The category to name:** say **"fit check"** in videos and talk. That's how guys already say it, and it isn't tied to the clone-filled "AI outfit rater" label. In the App Store, use the search words (§7).

**What to say, in order:**
1. **"Send a fit pic. Get a score and the one fix."** (the hook)
2. **"Same photo, same score."** (why to trust it over ChatGPT; show it on video)
3. **"It rates the outfit, never you."** (safety and respect)
4. **"Your daily check is free."** (versus every competitor)
5. **"It learns your closet."** (why to stay; mention it later, don't lead with it)

**What not to say:**
- "AI stylist" in the visible copy (your own rule, and the label is crowded with women's closet apps).
- "Pocket stylist" (Twelve70's subtitle).
- "Unlimited" (your rule).
- **"Accurate," "expert-level" or "what stylists would say."** The gold set showed the app only weakly follows a judge panel (r 0.33, #224). "Same photo, same score" is true today; "the right score" isn't proven yet. Overclaiming invites the "scores are random" reviews that hit looksmax apps. Revisit after the gold-set tuning.

---

## 6. Pricing, checked against the market

| | Kitted | Market |
|---|---|---|
| Yearly | $29.99 (14-day trial) | North America median **$39.99** (RevenueCat 2026); raters mostly $29.99–39.99; closet apps $27.99–89.99 |
| Monthly | $5.99 | Social & Lifestyle median **$9.99** |
| Weekly | none | 47% of Social & Lifestyle plans are weekly, but weekly keeps ~1% of subscribers after a year |
| Free | 1 check + 5 questions a day, score always visible | Most raters show nothing free |

**Claude's view:**
- **Update Oct 15 (#285): the founder's direction is $9.99 a month with a 1-week trial** (the Social & Lifestyle median monthly price). The yearly plan, the caps and the founding offer are open (CLAUDE.md to-do, P2). The two lines below are the earlier plan.
- **$29.99/yr is right for launch:** cheap for a student, equal to DRPD, below Looksee.
- **Test $39.99 after about 1,000 people have seen the paywall,** not before.
- **The monthly price is mostly there to make the yearly plan look good;** $7.99 would make the yearly saving look bigger. Keep $5.99 at launch (your call; it's on your list).
- **Plan on about 2% of downloads paying and about 25% of yearly subscribers renewing** (Social & Lifestyle median). AI apps churn about 30% faster than others. The closet, the morning card and "how you're doing" have to earn the renewal.

---

## 7. How people will find Kitted

**App Store search (from Apple's own autocomplete today):**
- People search **"outfit rater"** (Apple's first suggestion after typing "outfit r"), "rate my outfit", "fit check", "outfit rating", "ai stylist", "what to wear", "wardrobe" and "closet".
- Nobody searches "drip check", "men outfit" or "how to dress" (no suggestions).
- **Easy to rank for:** "rate my outfit", "outfit rating" and "fit check" are led by apps with 0–150 ratings.
- **Hard:** "outfit", "ai stylist" and "closet" belong to apps with 5K–88K ratings.
- **"Kitted" is free on the US store.**

**Suggested App Store text (an outward-facing call, so it's on your Decide list):**
- **Name (30 max):** `Kitted: Outfit Rater for Men` (28). The alternative, `Kitted: Fit Check for Guys`, matches the brand voice, but its results are crowded with "FitCheck" names.
- **Subtitle (30 max):** `Score your fit. Get the fix.` (28) or `Fit check, style tips & closet` (30, more keywords).
- **Keywords (hidden, 100):** `rate,rating,score,ai,stylist,wardrobe,ootd,drip,fashion,mens,guys,what,wear,ideas,advice,look,dress` (99).
- **Screenshots 1–2** must show the difference: a score card with its free fix, and "same photo, same score".
- Free Apple tools most rivals ignore:
  - **pre-order** (up to 180 days ahead; downloads itself on launch day)
  - **custom product pages** with their own keywords ("interview outfit", "date outfit"), one per video theme
  - **in-app events** (a "Holiday party fit check" in December)

**Video (your main channel):**
- **What's proven:** short score reveals ("guess the score", "6.5 → 8.0 with one swap"), lessons with a hook ("Stop dressing like a boy" 3.9M), and building in public.
- **What flops:** app demos.
- **Rules:** on TikTok, any post with a link, code or call to action needs **"Disclose commercial content → Your brand"**. Friends who post about it must say they know you (FTC rule since Oct 2024; fines around $52K per violation).
- **The famous app wins weren't free.** Cal AI paid about 250 creators; Umax and Rizz paid creators early. The cheapest next step, if you ever spend money, is pay-per-view creators (about $0.50–3 per 1,000 views, paid only on results), or campus ambassadors paid per real sign-up (Saturn's model). Both cost money, so both are your call.
- **Timing:** launch on Nov 17–20 is just before Thanksgiving, holiday parties and New Year resolutions. Line up hooks for each: Friendsgiving fit, office party fit, New Year closet reset.

---

## 8. Your research tasks (what only you can do), ranked

Each task saves its output in `inputs/market/` (git-ignored; keep names to first names or codes).

### P1 · This week

**Task 1. Talk to 10 guys, about 2.5 hours total (15 min each).**
- **Who:** 18–30, not into fashion, not close friends if possible (classmates, roommates' friends, people from the gym). At least 3 with a job or internship.
- **Unblocks:** which pain to lead with, the exact words for videos and the App Store, and whether "same score" matters to them.

Script (don't mention Kitted until question 9):
1. "When did you last think about what you were wearing before going somewhere? What was it for?"
2. "What did you do? Ask anyone, look anything up?" (Listen for ChatGPT, a friend, TikTok.)
3. "Have you ever asked ChatGPT or someone online about an outfit? Can you show me?" (Ask to see the chat.)
4. "What's the hardest part about dressing well for you?"
5. "Where do you get style ideas? Any creators?"
6. "What did you spend on clothes in the last 3 months, roughly? Where?"
7. "Do you pay for any app subscriptions? Which, and how much?"
8. "Have you tried any app for clothes or looks? (Umax, Dressly, any rater.) What happened?"
9. Now show Kitted on your phone, with your own fit photo. **Don't explain; watch.** "What do you think it does? What would you do next?"
10. "If this were in the App Store tomorrow, what would make you not download it?"
11. Ask for something real: "Want me to add you to the beta?" (Note who says yes and gives a number or email; that's the signal.)

Save notes in `inputs/market/interviews/` (one file each: first name or code, age band, school or job, their own words). Write down **exact phrases**; they become your hooks. Tell Claude when you have 5, and it will pull out the patterns.

**Task 2. Use the competitors, 45 min.**
- **Do:** install **Looksee, DRPD, GRWM and Dressly** (free downloads; start no trials). Use the same photo of yourself (face covered) in each **twice**, and also twice in free **ChatGPT** and **Gemini**. Screenshot every screen: onboarding, paywall, result. Note the two scores each time.
- **Save:** `inputs/market/teardown/<app>/`.
- **Unblocks:** proof for "same photo, same score" (if ChatGPT gives two different scores, that's your best launch video), and paywall ideas.

**Task 3. Claim the handles and domain** (already on your list): @kitted.app / @trykitted and trykitted.com. Without them, no video can point anywhere.

### P2 · Before the beta (Nov 3)

**Task 4. TikTok scan by hand, 20 min.**
- **Why by hand:** Codex couldn't open TikTok last time (#166).
- **Do:** search `rate my outfit`, `fit check men`, `outfit rater app`, `how to dress better men`, `interview outfit men`, `ai rates my outfit`. For the top 10 videos of each from the last 90 days, note: account, followers, views, whether it's an app account or a creator, the first-second hook, and the length.
- **Save:** `inputs/market/tiktok-scan.csv`.
- **Unblocks:** which hooks to copy this month.

**Task 5. Codex: Reddit, about 5 min to start.** Paste this:

> Research task for my app (a fit-check app for guys 18–30). Use Reddit only, posts and comments from Jan 2025 to today. Subreddits: r/malefashionadvice, r/mensfashion, r/streetwear, r/OUTFITS, r/findfashion, r/college, r/ChatGPT. Find what men say about (1) using ChatGPT or other AI to rate or improve their outfits, (2) outfit-rating or "rate my fit" apps, (3) apps like Umax/looksmax that rate looks, (4) what stops them dressing better. For each finding record: subreddit, post title, URL, date, upvotes, a quote under 25 words, and the theme. Honesty rules: only include posts you actually opened; never make up a URL, date, quote or count; if Reddit blocks you, stop and say how many you really got. Save as CSV to Kitted/inputs/market/reddit-ai-outfit.csv. Aim for 60+ rows.

**Task 6. Apple Ads keyword popularity, 10 min, once Kitted is in App Store Connect.** Open a free Apple Ads account. Apple shows a popularity score for each search term when you add keywords to a campaign; you don't have to spend anything. Claude isn't sure it works before the app is live or on pre-order, so check. Check the terms in §7.

### P3 · Optional

**Task 7. Gemini: YouTube, 5 min to start.**

> Find YouTube videos from 2025–2026 where men's style creators or tech reviewers test or review AI outfit-rating apps or use ChatGPT to rate outfits. For each: title, channel, URL, date, views, which app, what they liked and disliked (timestamps). Only include videos you actually opened; never make up a field. Save as a table I can download.

---

## 9. Risks, honestly

| Risk | How likely / how bad | What to do |
|---|---|---|
| ChatGPT or Instagram ships "rate my fit" with memory | Medium / high | Move fast on content and the closet habit; that's why the closet matters for retention |
| The score looks random to users (it only weakly follows the judges today, r 0.33) | Medium / high | Don't claim "accurate"; finish the gold-set tuning before launch videos lean on scores |
| Nobody finds the app (the base rate for new Lifestyle apps) | High / high | Daily videos from now on, pre-order, App Store text aimed at the easy terms |
| A copycat with a paid creator push | High / medium | Your content and taste are the moat; ship weekly |
| Billing anger | Low for you / high in the category | Keep the skippable paywall and the trial-ending reminder |
| 18+ cuts out the teen iPhone users who download this kind of app most | Certain / medium | Accepted for legal reasons; aim marketing at college and first jobs |

---

## 10. What changed from the Oct 5 research

- **Many more direct raters exist than we thought** (107 by name; 64 launched in 2026). The opening is still there, because none has users.
- **"The closet learns itself from photos" isn't unique anymore** (Fitted; Whering plans it). It moves from the headline to the reason to stay.
- **ChatGPT added try-on and shopping** (Oct 1, 2026). The free substitute is stronger, and it's moving toward shopping, not daily feedback.
- **Price check:** $29.99/yr is below the market median and the same as DRPD's yearly price.
- **New rule for copy:** don't use "pocket stylist" (Twelve70), and don't claim accuracy until the gold set backs it.

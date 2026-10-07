# 01 · Product & User Journeys

*Role: product and user-journey designer. Scope: content and function, not visual design. Every locked decision in Part A holds: style-first, chat-first with buttons and cards, fit score /10, Rotation, Lookbook, Style DNA, essentials, quick-start closet, silhouette avatar, no RPG/anime/ranks, clean and premium, 14+, men-focused, "your stylist."*

**Design thesis in one line:** v1 does **one thing brilliantly** (check my fit, then fix it), and everything else is a **by-product of doing that thing**: the closet, Rotation, essentials, Lookbook and Style DNA all fill themselves from fit checks and short chat answers. The user never has to "set up" anything.

---

## 1. Jobs-to-be-done

| # | Job ("When I…, help me…, so I…") | Trigger moment | Research basis | Feature that does the job |
|---|---|---|---|---|
| J1 | **Reassure me before I walk out.** "Does this work?" | At the mirror, 5 minutes before class, work, or dinner | Confidence is motivation #1; mirror check +303 (C7) | Fit check: score, 2–3 fixes, free re-check |
| J2 | **Tell me what to wear from what I own.** | Morning, closet open, nothing feels right. Or the night before something | "Tell me how to mix/match" +32; outfits from owned clothes (C7) | "What should I wear?" with outfits built from the Closet; daily fit idea |
| J3 | **Tell me where to start.** | After a bad photo, a breakup, a new job, a comment from a friend or his kids | Blocker #1, "don't know where to start" (C7) | "Your first 3 moves," Starter essentials checklist |
| J4 | **Tell me if this purchase is worth it.** | In a store, in a cart, or just after buying | Budget: "what's worth spending on?" (C7); men want size- and budget-aware advice (C5) | "I bought something": "+12 fits," Next best buy with a price range and fit tips |
| J5 | **Answer my "dumb" question privately.** | Watching a style video, or in a fitting room | How should clothes fit? (+192); fit and sizing blocker #2 (C7) | Ask a question: short answers, saved to memory |
| J6 | **Dress for the occasion without overdoing it.** | A date, interview, wedding, first day, or Friday at the office | Dress for the occasion (+560); fear of trying too hard, blocker #3 | Occasion chosen per fit check, scored against the occasion |
| J7 | **Show me I'm getting better.** | Sunday night, the 1st of the month, after a compliment | Identity (r=0.44), Wrapped, self-enhancement sharing (C2) | Rotation growth, Lookbook recap, Style DNA, quiet streak |

J1 is the job the app is downloaded for. J2 is the job that makes it a daily habit. J7 is the reason he stays for months.

---

## 2. Personas

| | **Jayden, 16** (beginner student) | **Marcus, 26** (new office job) | **Greg, 50** (dad updating his look) |
|---|---|---|---|
| Situation | Sophomore. About 15 items: hoodies, graphic tees, 2 joggers, 1 pair of jeans, running shoes, slides | Starts a business-casual analyst job in 2 weeks. College closet plus one wedding suit | Married with two teens. Cargo shorts, boxy polos, pleated khakis, worn running shoes |
| Budget | $0–30 per item, from birthday or job money | $30–60 per item, about $300 to spend up front | $60+ per item. Will pay for quality but hates waste |
| Goals | Look good at school, not get clowned, homecoming, a crush | Look competent on day 1, build a work rotation, first impressions | "Look sharp, not old." Weekend and dinner outfits his wife likes |
| Fears | Friends asking "why are you dressed up?"; wasting his little money; being told his clothes are bad | Overdressing ("intern in a suit"), sizing errors, getting Friday wrong | Looking like he's trying to be young; trends; tech that feels like it's for kids |
| How he talks | Short, slangy, sends photos fast | Precise questions, wants the rule behind the answer | Full sentences, taps buttons, sometimes types to it like an email |
| Success in 30 days | **3 go-to outfits** he's proud of, mostly from clothes he already owns. One smart $20 buy. A friend says "fit's hard." Rotation goes from 6 to 20+. Essentials 3/12 → 5/12 | **A 5-day work rotation** with no repeats that look like repeats. Knows how his pants should fit. 3 purchases, each with a known "+fits." 15+ days in the Lookbook | **2 outfits he's comfortable in** for weekends and dinners. Leather sneakers replace the running shoes. One pair of trousers hemmed. His family notices without teasing |

---

## 3. Progressive unlocks (shared by all personas)

Nothing is locked behind payment or time for its own sake. Each feature appears **the moment there is enough data for it to be useful**, so every unlock reads as "your stylist learned enough to do this now." That is honest, and it avoids empty screens (progressive disclosure, C14).

| Unlocks | Trigger | Why it motivates | Evidence |
|---|---|---|---|
| Silhouette | Onboarding step 4 (3 taps) | He sees himself represented instantly, no body scan | IKEA effect (C14) |
| First fit check + **free re-check** | Onboarding step 8 | Score goes up after a fix he made himself: competence in 60 seconds | Time-to-value (C12) |
| Closet with first items | Same fit check (items detected) | He built a closet without trying | Quit risk #1 is digitizing the closet (+963) |
| **Rotation** | First top + bottom + shoes (usually fit check #1) | A number that grows, and "+N fits" shows the next step | Goal gradient (Kivetz) |
| **Starter essentials (pre-filled)** | After fit check #1 | Starts at 3/12, not 0/12 | Endowed progress, 34% vs 19% (Nunes & Drèze) |
| Daily fit idea (push + Today card) | Rotation ≥ 3 and notifications allowed | Morning decision made for him, from his own clothes | One tailored push (+3.9%); generic pushes drive uninstalls |
| "What should I wear?" from Closet | Rotation ≥ 3 (before that, the stylist uses item types plus one closet question) | Rediscovering forgotten items | "Like: rediscovering forgotten items" (C7) |
| Weekly shield | First 7 days | A missed day doesn't break anything | Weekend Amulet +4%; forgiveness (C2) |
| First week card | Day 7, in chat | First proof: "You dressed with intent 5 of 7 days" | Fresh start (Monday) |
| **Style DNA reveal** | 5 fit checks or saved looks | Identity mirror ("62% Minimal, 38% Smart casual"), shareable. Timed for week 2–3 to get ahead of the week-4 novelty dip | Identity r=0.44; novelty dip about week 4 |
| **Lookbook monthly recap** | 1st of the month, if 5+ days logged (otherwise rolls to the next month) | A "Wrapped" for his style: best fit, rotation growth, most-worn item | Wrapped; Berger self-enhancement; fresh start |
| New "3 moves" | Monthly, with the recap | The plan refreshes, so there's always a next step | Fresh start (Dai, Milkman & Riis) |

**Streak rule:** "Days dressed with intent" counts **any one action**: a fit check, a "Wore it" tap on the daily idea, or logging an outfit. One shield is earned each week. After a gap, the message is **"Welcome back, fresh week,"** never a loss screen (Milkman comeback +27%; Habitica unfair-penalty finding). The streak stays small and quiet: in the Stylist header and on the You tab, never as a full-screen celebration.

---

## 4. Journeys

Notation: [chat] chat exchange · [card] card · [tab] tab visit · [push] notification · [unlock] unlock

### 4a. Jayden, 16

| Stage | Touchpoints |
|---|---|
| **First 5 min** | [chat] Welcome, then "Get started" (no account) → taps goals *College/school, Confidence, Dating* → taps 4 of 9 outfit photos (lands on Streetwear + Minimal) → height 5'9", slim build, likes relaxed fit → [unlock] silhouette → boldness *A little* → budget *Under $30* → Quick start → [card] **Fit check**: hoodie, skinny jeans, running shoes, occasion *School* → **6.0** (Fit 5.5 · Color 7 · Proportion 5.5). Fixes: "Jeans pool at the ankle: cuff once." "Running shoes read gym: wear your cleanest pair, or your Vans if you have them." → cuffs, **re-check 6.5** → [unlock] Closet: 3 items, plus "Vans: not photographed yet" (he tapped Yes) → [unlock] Rotation: 2 fits, "+3 fits with a plain tee" → [card] **First 3 moves**: (1) cuff or hem the jeans (free), (2) heavyweight white or grey tee, $10–20, (3) keep shoes clean, $0 → [card] Pro offer, taps *Continue free* → [push] permission: "Daily outfit idea at 7:15 am?" Yes |
| **Day 1** | [tab] Closet: essentials 2/12 → [chat] "Ask a question": "are skinny jeans bad now?" → short answer tuned to his styles, no shaming → stylist asks one question: "Got any other pants?" *Yes* → he adds joggers by photo → Rotation 4 |
| **Week 1** | [push] Day 2, 7:15: "Today: grey hoodie + black joggers + Vans. 2 min, done." → taps *Wore it* (streak 2) → Day 3, he hits the free fit-check limit, sees "Re-checks of the same fit are always free" → Day 4, [chat] "I have $20, what do I buy" → [card] Next best buy: plain heavyweight tee, $12–20, "+6 fits" → Day 6 [chat] "I bought something" → photo → **Rotation 4 → 10** [card] → Day 7 [card] First week card: 5/7 days, best fit 7.5, [unlock] weekly shield |
| **Month 1** | Day 11, [unlock] **Style DNA**: 60% Streetwear · 40% Minimal → shares it to his story → Day 18, homecoming: [chat] occasion *Dance*, plans an outfit with one $25 thrift buy → Day 24, misses 2 days, shield covers one, then "Welcome back, fresh week" → Day 31, [card] **Lookbook recap**: 19 days, best fit 8.0, rotation 6 → 22, most worn: the grey tee → [unlock] new 3 moves (first chinos, $25–35) |

### 4b. Marcus, 26

| Stage | Touchpoints |
|---|---|
| **First 5 min** | [chat] Goals *Work, Confidence* → taps smart-casual and minimal looks → 6'0", athletic build, regular fit → boldness *Subtle* → budget *$30–60* → **Full closet** offered, he chooses Quick start (the default) → [card] Fit check: wedding-suit trousers + polo, occasion *Office* → **6.5** (Fit 6 · Color 8 · Proportion 6). Fixes: "Trousers break twice: hem to a slight break (about $15 at a tailor)." "The polo collar is collapsing: an OCBD reads more office." → no quick fix possible today, so the stylist saves the fixes to his plan → [card] First 3 moves: (1) light-blue OCBD $30–60, shoulder seam at the shoulder, (2) navy chinos, straight, $40–60, (3) hem the suit trousers → [unlock] essentials 3/12 → Pro offer: he starts the trial (he wants unlimited checks during his first week) → Sign in with Apple |
| **Day 1** | [chat] "How should dress pants fit?" → answer card with the rule (seat, thigh, break) → saved → [tab] Closet: adds his suit jacket, 2 dress shirts, loafers by photo → Rotation 9 → [card] "Next best buy: navy chinos +8 fits" |
| **Week 1** | Day 2, [chat] "I bought something": OCBD + chinos → Rotation 9 → 21 → Day 3, first day at work: fit check, occasion *Office, first day* → 8.0, one fix ("tuck fully, belt to match the loafers") → [push] Days 4–7, 7:00 work idea from his closet; he taps *Wore it* or swaps once ("Swap the shoes") → Day 5, [chat] "What do people wear on casual Friday?" → stylist suggests an option and asks one question: "Do you own dark jeans?" *Yes, not photographed* → item added as "not photographed yet" → Day 7, [card] First week card |
| **Month 1** | Day 9, [tab] Lookbook calendar: sees 5 work outfits with no visible repeats → Day 12, [unlock] Style DNA: 70% Smart casual · 30% Minimal → Day 15, date: [chat] "dinner date Saturday" (script 2) → Day 22, [card] gap card: "Your shoes cover office only: a white leather sneaker adds +11 weekend fits ($60–100)" → Day 31, [card] Lookbook recap: 24 days, average fit up from 6.5 to 7.8 |

### 4c. Greg, 50

| Stage | Touchpoints |
|---|---|
| **First 5 min** | [chat] Goals *Confidence, Everyday* → in the photo picker, taps clean "smart casual" and "old money" looks; skips the streetwear photos → 5'10", larger build, regular fit → boldness *Subtle* → budget *$60+* → Quick start → [card] Fit check (his daughter takes the photo): boxy polo, pleated khakis, running shoes, occasion *Weekend* → **5.5** (Fit 5 · Color 7 · Proportion 5). Fixes: "The polo is a size big at the shoulders: the seam should sit at your shoulder." "Pleated khakis are fine, but these are wide and long: a flat-front or single-pleat, straight-leg trouser looks current without looking young." "Swap running shoes for leather sneakers or suede loafers." → no fix possible today, but his score is **explained, not judged** → [card] First 3 moves: (1) one knit polo in his true size, (2) straight-leg chinos with the hem fixed, (3) leather sneakers, $80–150 → Pro offer: *Continue free* → push permission asked: "Weekly idea on Saturday mornings?" He picks *Weekends only* |
| **Day 1** | [chat] "How do I stop dressing old without dressing young?" (script 5) → saved to his plan. [tab] Closet: the stylist asks one question: "Do you have a blazer or sport coat?" *Yes* → he photographs it |
| **Week 1** | Day 3, [chat] "I bought something": suede loafers → **Rotation 3 → 8** → [card] "Match leathers: brown belt with these" → Day 6 (Saturday), [push] "Saturday idea: navy knit polo + stone chinos + loafers" → fit check **7.5**, his wife comments → Day 7, [card] first week card (3 of 7 days, framed as "3 days dressed with intent," never "you missed 4") |
| **Month 1** | Day 14, [chat] asks about tailoring → gets a tailor checklist card → Day 17, [unlock] Style DNA: 65% Smart casual · 35% Old money ("Classic, relaxed") → Day 25, anniversary dinner: fit check, occasion *Dinner* → 8.0 → Day 31, [card] Lookbook recap: best fit 8.0, rotation 3 → 14, "Most worn: suede loafers" |

**What the journeys show:** the **same five building blocks** (fit check, ask, I bought something, daily idea, recap) serve all three ages. Age changes **the content** (occasion, budget, tone, examples), not the app.

---

## 5. Feature inventory by tab

Priority: **v1** = launch (3–4 weeks, one student dev, SwiftUI + AI tools) · **v1.1** = fast follow within 4 weeks of launch · **v2** · **Later** · **Never**

### Stylist (home)
| Feature | Priority | Notes |
|---|---|---|
| Chat thread with 4 quick-start buttons (Check my fit / What should I wear? / I bought something / Ask a question) | v1 | Never a blank box |
| Onboarding as guided chat (A4, 11 steps) | v1 | Tap answers only |
| Fit-check card: score /10 (.5 steps), Fit / Color / Proportion, 2–3 fixes, occasion chip | v1 | Fixed scoring pipeline, never free-form chat |
| Free re-check of the same outfit within 15 min | v1 | Protects the aha moment from the free limit |
| Item detection: fit-check photo creates closet items (user confirms with one tap) | v1 | The quick-start closet engine |
| Outfit card (built from closet items) with a one-line summary, Save, Swap one piece, Wore it | v1 | "Swap" is the only edit |
| "I bought something" → item added + "+N fits" card | v1 | |
| Next best buy card (item type, price range, fit tip) | v1 | No links in v1 |
| One follow-up question per reply, with tap answers; never re-ask | v1 | Answers go to memory |
| Today card at the top (daily idea or this week's move) | v1 | |
| Share fit-check result card (outfit, score, fixes; photo optional, face crop off by default) | v1 | Feeds the creator-led marketing (C6) |
| Style-only guardrail + moderation (no faces, bodies, or off-topic) | v1 | Required for 14+ |
| Weekly "move" (one micro-lesson, e.g., "try a full tuck") | v1.1 | |
| Event planner ("Saturday wedding, plan it") | v2 | Pro candidate |
| Weather-aware ideas (WeatherKit) | v2 | v1 asks "Cold out?" as a tap instead |
| Voice input | Later | |

### Closet
| Feature | Priority | Notes |
|---|---|---|
| Item grid by category (Tops, Bottoms, Shoes, Outerwear, Extras) | v1 | |
| Add item: one photo, auto-tagged category and color, user confirms | v1 | |
| "Not photographed yet" items (from chat) | v1 | Prompt to photograph them later, gently |
| **Rotation** count at the top, with "+N" for the next item | v1 | Rule-based compatibility, cheap |
| **Starter essentials** checklist (12 items, pre-filled) | v1 | |
| Item detail: worn count, outfits it's in, edit, delete | v1 | |
| Background removal on item photos (Vision subject lifting) | v1 if time | Makes the closet look premium |
| Wardrobe gaps beyond the single Next best buy | v1.1 | |
| Full closet batch import (photograph 20 items in one go) | v2 | |
| **Cost per wear** (needs price entry) | v2 | Liked in research, but asks for data entry |
| Affiliate links | Later | |
| Filters (palette, brand) | Later | |

### Lookbook
| Feature | Priority | Notes |
|---|---|---|
| Month calendar grid of days dressed with intent (thumbnails) | v1 | Matches the "month grid, not a planner" verdict (C3) |
| Fit-check history list (photo, score, occasion) | v1 | |
| Saved outfits | v1 | |
| **Monthly recap card** (shareable) | **v1.1** | Nobody reaches the 1st of the month in launch week, so it ships just after launch |
| First week card (in chat) | v1 | Cheap, gives early proof |
| Before → after comparisons | v2 | Strong for marketing |
| Year recap | Later | |

### You
| Feature | Priority | Notes |
|---|---|---|
| Silhouette + basics (height, build, fit preference), editable | v1 | |
| Styles (max 3), goals, boldness, budget | v1 | |
| Quiet streak + shields | v1 | |
| **Style DNA** (simple % from style tags on fit checks and saves) | v1 | Cheap once the pipeline tags styles; revealed after 5 checks |
| **What your stylist knows** (view, edit, delete each fact) | v1 | Trust; Children's Code |
| Pro / subscription status, restore, easy cancel | v1 | |
| Notifications (time, weekdays only / weekends only / off) | v1 | |
| Sign in with Apple + cloud backup | v1 | Lost progress is a top quit reason (C3) |
| Delete all photos / delete account | v1 | |
| Widgets (today's fit) | v2 | Gap no competitor fills (C4) |
| Friends / sharing circles | Later | Social comparison risk for teens |

### Cut from v1, and why
| Cut | Why |
|---|---|
| Full closet import | Digitizing the closet is quit risk #1. Quick start makes it unnecessary at launch |
| Cost per wear | Needs price entry and wear history. The value shows up only after months |
| Event planner, weather | The chat plus an occasion chip covers 80% of this. Each adds an integration |
| Lessons library | Chat answers questions when he has them. A library is a second app to maintain |
| AI-generated outfit images and try-on | Expensive, unreliable, and users hate AI art (C3). Outfits are shown as photo collages of his own items |
| Social, friends, leaderboards | Body-image and comparison risk for minors. Not needed for the core loop |
| Widgets, Live Activities, Watch | Polish, not value. Widgets come first in v2 |
| Affiliate/shopping links | Trust first. "Item type + price range" already answers the buying job |
| Monthly recap at launch | Moved to v1.1; it can't trigger in week 1 anyway |
| Any XP, levels, badges, ranks | Locked out. Rotation and the score are the progress |

**Simplicity test for v1:** every screen does one job, and every number on screen (score, Rotation, essentials x/12, streak) answers "am I getting better?"

---

## 6. Aha moment and habit loops

### The aha moment
> **He fixes one thing the stylist told him, re-checks, and sees his score go up, within 3 minutes of opening the app.**

Example: 6.0 → 6.5 after cuffing his jeans. This combines competence ("I can do this"), the IKEA effect (he made the improvement), and explained, consistent scoring (the answer to "scores are random," 33 reviews in C3). It's why the re-check must be free and why at least one of the fixes must be **doable right now, for $0** (cuff, tuck, swap shoes, take off a layer). The pipeline should always try to include one zero-cost fix. If no fix is possible today (Marcus, Greg), the backup aha is **"I know exactly what to fix,"** delivered through the 3 moves plan.

**Metric:** % of installs who complete a re-check, or save the 3 moves, in session 1. Target 40%+.

### Daily loop (Hooked model)
| Step | Design |
|---|---|
| Trigger | External: one tailored push at his chosen time ("Today: navy overshirt + grey tee + white sneakers"). Internal: the mirror moment, and uncertainty |
| Action | One tap: **Wore it**, **Swap**, or **Check my fit** |
| Variable reward | A new combo from clothes he already owns, a score, a fix he hadn't considered |
| Investment | Every action adds data: worn counts, new items, style tags, so tomorrow's idea is better |

Evidence: one tailored push beats frequent generic ones (Bidargaddi +3.9%; generic pushes raise uninstalls). Any-action streaks (Duolingo D14 +3.3%). Pushes are utility only, never "we miss you."

### Weekly loop
Monday fresh-start card: last week in one line plus **this week's move** (one small skill). Shield refills. Sunday is quiet. Evidence: fresh start (Dai 2014), Weekend Amulet +4%.

### Monthly loop
Lookbook recap on the 1st: best fit, rotation growth, most-worn item, Style DNA shift → share → new 3 moves. Evidence: Wrapped (200M users in 62h), Berger self-enhancement, fresh start. Style DNA arrives in week 2–3 and the first recap at week 4, so there is something new **right when the novelty dip hits** (C2).

### Event loop (the money loop)
Shopping or an upcoming occasion → "I bought something" / plan a date or interview → "+N fits" or an occasion-tuned score. These are the moments he'll pay for unlimited checks.

**Habit horizon:** habits take a median of 66 days, and one missed day doesn't matter (Lally). So the app optimizes for **returning**, not for perfection: forgiveness, comeback copy, and no punishment.

---

## 7. Sample conversations

*Format: **U** = user, **S** = stylist. [Card] and (buttons) are UI elements. Scores always come from the pipeline card, never from chat text.*

### 1. First fit check (onboarding)
> **U:** *(photo)* School
> **S:** [Fit card: **6.0/10** · Fit 5.5 · Color 7 · Proportion 5.5 · Occasion: School]
> Good base: the colors work together. Two fixes:
> 1. Your jeans bunch at the ankle. Cuff them once, about an inch.
> 2. The hoodie is longer than your hips, which shortens your legs. Push the sleeves up, or wear a tee under it on its own.
> Want to try the cuff and re-check? It's free.
> (Re-check) (Later)
> **U:** *(photo)*
> **S:** [Fit card: **6.5/10** ↑0.5] That's it. Cleaner line already. I've added the hoodie, jeans and shoes to your closet.

### 2. Date outfit
> **U:** dinner date saturday, nothing fancy
> **S:** From your closet: [Outfit card: navy OCBD (sleeves rolled) + dark jeans + white leather sneakers. *"Relaxed smart casual: effort shows, but quietly."*]
> One question: indoors, or a rooftop spot that might get cold?
> (Indoors) (Might be cold) (Not sure)
> **U:** Might be cold
> **S:** Add the grey overshirt open on top. Rotation tip: that overshirt is in 9 of your fits. Good buy. (Save to Lookbook) (Swap a piece)

### 3. "I bought a jacket"
> **U:** I bought something *(photo of an olive chore coat)*
> **S:** Nice pick. Olive works with almost everything you own. [Card: **Rotation 21 → 33 fits (+12)**] I tagged it as outerwear, olive, workwear. Quick fit check: does the shoulder seam sit where your arm starts?
> (Yes) (It hangs past) (Not sure)
> **U:** Not sure
> **S:** Send a front photo with your arms relaxed and I'll tell you. If it hangs more than an inch past, exchange it for one size down.

### 4. "What should I wear today?"
> **U:** What should I wear?
> **S:** What's today?
> (Class) (Work) (Going out) (Just chilling)
> **U:** Class
> **S:** [Outfit card: cream heavyweight tee + black straight jeans + Vans. *"Minimal, easy, looks intentional."*] You haven't worn the cream tee in 12 days. (Wore it) (Swap a piece) (Check my fit)

### 5. A 50-year-old: "How do I stop dressing old?"
> **U:** My kids say I dress like an old man. How do I update without looking like I'm trying to be 25?
> **S:** You're right to avoid trends. What makes clothes look dated is usually **fit and shoes**, not age. Three moves that look current at any age:
> 1. **Fit at the shoulders.** Your polo should end where your shoulder ends. Most men your age wear one size too big.
> 2. **Straight-leg trousers, hemmed to a slight break.** Not skinny and not baggy. Hemming costs about $15.
> 3. **Retire the running shoes off the treadmill.** Leather sneakers or suede loafers do most of the work.
> [Card: Your plan, saved] Do you have a blazer or sport coat at home?
> (Yes) (No)

### 6. Teen with a $20 budget
> **U:** i got $20 what do i get
> **S:** $20 goes furthest on basics. Best move for your closet: [Next best buy card: **Heavyweight plain tee, grey or white · $12–20 · +6 fits**. Fit tip: the hem should land mid-zipper, sleeves at mid-bicep.] Thrift stores and basics brands both work. Thickness matters more than the brand. Want the 2-for-$20 option instead?
> (Yes) (No, just one good one)

### 7. A bad fit check, handled kindly
> **U:** *(photo: oversized graphic tee, cargo shorts, black dress socks, running shoes)* rate it honestly
> **S:** [Fit card: **4.5/10** · Fit 5 · Color 4 · Proportion 4.5 · Occasion: Everyday]
> Honest and fixable. The pieces are fighting each other, not you.
> 1. Dress socks with running shoes is the biggest pull. Switch to no-show or white athletic socks. **Free fix.**
> 2. Big tee plus big shorts hides your shape. Keep the tee, swap to jeans or chinos if you have them.
> 3. Three loud elements (graphic, cargo pockets, chunky shoes). Keep one, make the rest plain.
> Swap the socks and re-check? I'd expect at least a 5.5.
> (Re-check) (Show me an outfit instead)

### 8. Off-topic, politely declined
> **U:** can you write my history essay
> **S:** That's outside what I do. I'm your stylist, so I stick to clothes, fit and outfits. But if you've got a presentation coming up, I can tell you what to wear for it.
> (Plan a presentation outfit) (Check my fit)
>
> *Variant:* **U:** rate my face → **S:** I rate outfits, never people. Send a fit and I'll help you look sharp in it.

### 9. How should pants fit?
> **U:** how should pants fit
> **S:** Four checks in the mirror:
> 1. **Waist:** stays up without a belt, with one finger of room.
> 2. **Seat:** no sagging, and no pulling lines across the back.
> 3. **Leg:** straight or relaxed-straight is the safest choice right now. You should be able to pinch about an inch at the thigh.
> 4. **Length:** a slight break or no break. Fabric just touches the top of your shoe.
> [Card saved to "What your stylist knows": *Prefers relaxed fit*] Want me to check a pair? Send a side photo standing straight.
> (Check a pair) (Got it)

### 10. A follow-up question that grows the closet
> **U:** What should I wear? Going out
> **S:** [Outfit card: black tee + dark jeans + white sneakers.] This works. It'll look sharper with one layer. Do you own a jacket that isn't a hoodie, like denim, bomber or overshirt?
> (Yes) (No) (Not sure)
> **U:** Yes, a denim jacket
> **S:** Added: **Denim jacket · not photographed yet.** [Outfit card updated: + denim jacket. *"Classic double-denim done right: different washes."*] [Card: **Rotation 14 → 19 (+5)**] Snap it next time you wear it so I can check the wash.

---

## 8. Open product questions for the converge round
1. Should the free daily fit check reset at a fixed hour (e.g., 4 am local) or roll 24 hours from the last use?
2. Should the daily push default to weekdays for students and workers, and weekends for others? (Greg's journey suggests making it a choice.)
3. Should the 12 essentials be adjusted by style (streetwear vs. smart casual), or kept universal for v1? (Proposal: universal for v1, labeled "Starter essentials.")
4. Is face crop-out on shared fit cards on by default for all users, or only under 18? (Proposal: on by default for everyone.)

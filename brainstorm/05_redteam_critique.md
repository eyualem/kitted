# 05 · Red-Team Critique

*Role: red-team critic. Inputs: research-context.md (Parts A and C) and proposals 01–04. Goal: find the conflicts, cut scope until a solo student can build it, and name the risks that could kill the app. Recommendations are mine. Where I override a "proposed" item from A3/A4, I say so.*

**Headline:** the four docs together describe a **v2 app, not a v1**. Counting every screen, card, engine and mechanic marked "v1" in at least one doc gives roughly **45 features and about 60 build-days**. The founder has about 4 weeks of part-time build time (classes, plus 2+ TikToks a day), which is realistically **15–20 focused days** even with AI coding tools. And the thing everything else depends on, **reliable attribute extraction from mirror selfies**, hasn't been tested once. Test it first, then cut hard.

---

## 1. Contradictions between the docs

| # | Topic | The conflict | My resolution | Reason |
|---|---|---|---|---|
| 1 | **Re-check rule** | 01: free re-check within 15 min, and "re-checks of the same fit are always free" (no limit). 04: free gets 1 re-check per day. 02: only identical image bytes are cached, so a re-check is a new paid extraction. | **Every check includes 1 re-check, within 30 min, for free and Pro alike.** The re-check counts as part of the original check, not a new one. | It protects the aha moment and caps cost. "Always free" invites abuse. |
| 2 | **What's free** | 04 limits "What should I wear?" to 1/week on free and puts the calendar and archive behind Pro. 01 makes the daily idea the free habit loop. 02 says outfit generation is deterministic and costs $0. | **Gate only what costs money:** fit checks (1/day) and chat (5/day). Outfit ideas, the daily idea push, closet, Rotation, history and the calendar are **free forever**. | Gating a $0 feature makes the habit loop weaker and earns nothing. Gating his own history feels like it's being held hostage, and lost progress is a top quit reason (C3). |
| 3 | **Quota reset** | 03: "Next free fit check in 6 h" (rolling). 04: "Next one at midnight." 01 leaves it open. | **Fixed reset at 4 am local.** The copy says "Your next free check is ready tomorrow morning." | One rule that needs no countdown math. 4 am means a late-night check still counts for "today." |
| 4 | **Fair-use cap** | 02: about 10 checks/day. 04: 15/day. | **10/day** for Pro and trial users. | At $2.12/mo net, 15/day can lose money (04 §2.3). |
| 5 | **Trial and plans** | 04: 14-day trial on annual, monthly $5.99, **lifetime $59.99 at launch**, founder price $19.99. A3: lifetime is a "test." 03 defers. | **At launch: annual $29.99 with a 14-day trial, plus monthly $5.99 with no trial. No lifetime yet.** The founder price ships as an introductory offer. | A lifetime plan is an open-ended AI-cost liability, and 02's main model price is promotional only until Dec 31, 2026. Fewer plans also means a simpler paywall. |
| 6 | **Family Sharing** | 04 turns it on in v1. Nobody else mentions it. | **Off at launch.** Decide on purpose later. | Apple doesn't let you turn Family Sharing off for a subscription once it's on. One subscription can cover 6 people, which multiplies AI cost. Ask to Buy works for teens without it. |
| 7 | **Occasion** | 02: a modifier (0 to −2.5) plus an under/over chip. A3: "occasion-aware" with 3 sub-scores. Occasion lists also differ: 02 has 7, 03 has 6, and 01 uses ad-hoc ones (School, Dance, Office, Dinner, Weekend). | **Modifier plus chip (02).** One fixed list of **5: Everyday · Class/Work · Date/Going out · Interview · Event.** | It keeps the locked trio of sub-scores, and 2–5 choices is the evidence-based range (Patall). |
| 8 | **When occasion is asked** | 02: occasion chips, then the camera. 03: after the shutter, while uploading. | **After the shutter (03), defaulting to the last occasion used.** | Scoring runs after extraction, so the answer can arrive late, and the wait feels shorter. |
| 9 | **Adding items to the closet** | 01: the user confirms each item with a tap. 02: an "Add 3 items?" chip. 03: items are added automatically, with Review/Undo. | **Add automatically with Undo (03).** When an item looks like one he already has, ask "Same as your black jeans?" (Yes/No) as that turn's one question. | Fewer decisions. The one question goes where duplicates would otherwise corrupt Rotation. |
| 10 | **Full-closet timing** | 01: batch import is v2. 03: capture mode (C7) plus a Live Activity in v1, and a closet-path choice at onboarding step T6. A3 locks "both paths." | **Keep both paths, but the Full path in v1 is just "Add items" with multi-select from the photo library**, queued one by one. **Remove the T6 choice from onboarding.** | It honors A3 at about 10% of the cost. A beginner can't make a meaningful choice at step 6. |
| 11 | **Rotation definition vs. the journeys** | 02 counts an outfit only if its **predicted score is ≥ 7.0**. But in 01, Jayden's first outfit scores 6.0 and his Rotation is still "2 fits," and Greg's 5.5 outfit gives "Rotation 3." Under 02's rule, both beginners would see **0 fits**. | **Count combinations that pass the hard rules** (formality gap ≤ 1, ≤ 4 color families, no style clash), with **no score threshold and no season filter**. The headline number only drops when he deletes an item. | Beginners have to start above zero (endowed progress). If Rotation falls when winter arrives, it reads as a loss. |
| 12 | **Lookbook scope** | 01: calendar and history in v1, monthly recap in v1.1. 03: recap in v1. 04: the whole Lookbook in v1.1, recap on the user's 30-day anniversary, archive behind Pro. Thresholds differ too (5 days vs. 3 looks). | **v1: the Lookbook tab is fit-check history plus a month calendar, free.** **v1.1: a calendar-month recap**, shown only if he logged ≥ 5 days, otherwise it rolls to next month. | The tab needs something real at launch. "October lookbook" is easier to understand and share than an anniversary date. |
| 13 | **Style DNA unlock** | 01: after 5 checks, v1. 03: after 3 checks. 04: after 8 checks, v1.1. | **v1.1, after 5 logged outfits.** | It isn't needed for the core loop, and 5 is the middle value. |
| 14 | **Starter essentials** | 01: one universal list of 12. 02: generated per style, a weighted merge plus trend slots. 03: tap the ones you own. 04: pre-filled from the first fit check. | **v1: one universal, hand-written list of 12.** Pre-filled from detected items **and** tap-to-own (03 and 04 together). Per-style lists in v1.1. | The greedy generator plus a merge is a week of work. The universal list is a day and still gives endowed progress. |
| 15 | **Streak** | 01: any action counts, plus a weekly shield. 04 adds a lifetime counter, a 3/4/5-day weekly goal, shields (an extra one for Pro), repair within 48 h, and "counts double" after a return. 03: an optional streak push. | **Override: no daily chain at all.** Show "Days dressed with intent: **4 this week · 41 total**" as a lifetime counter plus this week's dots. With no chain there's nothing to shield, repair or lose. | It's forgiving by design and costs a day instead of a week. It's also the "quiet" streak A3 asked for. Charging for streak protection (the extra Pro shield) sells anxiety. |
| 16 | **Push rules** | 03: at most 1 a day, quiet hours 9 pm–8 am, back off after 5 unopened. 04: back off after **3**, plus a Monday plan push, Sunday recap, occasion reminders and a comeback push. **01 sends Jayden's push at 7:15 am, inside 03's quiet hours.** | **v1 sends only 3 kinds:** the daily idea (opt-in, his chosen time, so no quiet hours are needed), "fit check ready," and "trial ending." Back off after 3 unopened. | Fewer kinds means fewer bugs and no spam (27 notification-spam complaints, C3). |
| 17 | **Age gate** | 02's age bands start at "13–15." 03 and the brief say 14+, with 13 and under blocked. | **14+. "13 or under" leads to a stop screen.** Use Declared Age Range where available. | It matches the brief and keeps a margin above COPPA. |
| 18 | **Bad photo** | 03 offers "Use anyway." 02 says to never guess when the outfit is unreadable. | "Use anyway" returns a **Partial check** if enough is readable; otherwise **no score, and it doesn't count.** | Consistency matters more than giving him an answer. |
| 19 | **Where photos live** | 02: originals stay on the device, the server keeps only a hash. 03: the anonymous account has "server backup so a crash doesn't lose data," plus several photo-retention settings. | **v1: photos live on the device only.** The server stores extraction JSON, scores and facts. Settings has one control: "Delete all photos." Tell users that photos don't move between phones. | It's simpler, it's the most private option, and three retention modes only make sense if a server copy exists. |
| 20 | **Cost model vs. architecture** | 04's per-check cost assumes the LLM **outputs scores and fixes** (about 1,000 output tokens). That breaks A3's locked "fixed scoring pipeline." 02 and 04 also price different model families (02: "3.8 Flash" at a promotional price; 04: 2.5 Flash, priced from third-party aggregator sites). | **Use 02's architecture** (the LLM extracts, code scores). **Redo the cost model at list price, not the promotional one**, using the provider's own pricing page. | Margins and consistency both depend on it. |
| 21 | **"Today card" vs. no dashboard** | 01 pins a Today card at the top of the chat. 03 rejects a second "home." | The daily idea arrives as an **ordinary chat message.** Nothing is pinned. | One home. |
| 22 | **Before/after** | 04: a before/after share card in v1. 03: the compare screen in v1.1. 01: v2. | **v1: the re-check card shows "6.0 → 6.5" inline, and the share card includes that line.** The full split-screen composer comes in v1.1. | You get the marketing value without building a new screen. |

---

## 2. Complexity audit

### 2.1 What's overbuilt (cut or simplify)

| Item (doc) | Problem | Action |
|---|---|---|
| Value-of-information question formula (02 §1.4) | Simulating answers to rank questions is research-grade work | **A hand-ordered list of slots.** Ask only when the slot is unknown and the current flow needs it |
| On-device Foundation Models router (02) | Only runs on Apple Intelligence devices, so it means two code paths | **Buttons set the intent; free text goes in one server call** |
| Crop embeddings + pHash dedupe (02) | Infrastructure for a problem a Yes/No question solves | Match on category + color family, then **"Same as your…?"** |
| A Swift copy of the server scorer (02 §3.1 #7) | **Two implementations drift apart**, a classic source of bugs | **One Swift scorer on the device.** Rule weights and thresholds come from a **remote JSON file** (versioned), so the rubric can change without an app update. The server only proxies the LLM calls and enforces quotas |
| About 32 rubric rules plus about 80 subcategories (02 §5) | Many depend on attributes nobody has shown can be read from selfies (§4) | **v1: about 12 rules on reliable attributes.** Everything else is advice-only until the spike validates it |
| A catalog of about 150 archetypes (02 §4.2) | Mostly writing work | **40 archetypes** in v1 |
| Live Activity, bottom-accessory pill, minimize-on-scroll (03) | Only works on iOS 26, and it's polish | Cut. A plain "Scoring…" card is enough |
| Offline photo queue (03) | Sync edge cases | "You're offline. Try again when connected." |
| Three photo-retention modes, export (03) | Only matter if photos are stored on a server | One control: "Delete all photos" |
| Inspiration mode (02) | IP risk from celebrity and creator images, plus a new flow | v2 |
| Lesson cards and the "Starter month" track (02, 04) | A second product to maintain | v1.1 at the earliest |
| Earned bonus checks, referral, "second opinion" web page (04) | Turns checks into a currency. The web page puts photos on public links (a minors risk) and needs a web app | Referral v1.1. The web page is v2, and **never for under-18s** |
| App Attest + DeviceCheck quotas (02) | Real work for a threat that doesn't exist at small scale | v1: a quota per anonymous user plus a global daily spending kill-switch. App Attest in v1.1 |
| 11–15 onboarding turns (A4 + 03 + 04's "where did you find us" + the 5.1.2(i) consent) | **This is the "feels complicated" problem** | See §2.3 |

### 2.2 Minimum-lovable v1: 12 features

| # | Feature | Scope | Est. days |
|---|---|---|---|
| 0 | **Extraction spike** (before any UI) | A script: 40 selfies × 5 runs, schema, agreement report | 2 |
| 1 | Backend skeleton | Supabase anonymous auth, an edge-function LLM proxy, quotas, a kill-switch, the remote rubric JSON | 2 |
| 2 | Stylist chat shell | Thread, 4 quick-start buttons, card renderer (Fit, Outfit, Item, Plan, Question) | 3 |
| 3 | Short onboarding | 6 turns (see §2.3), consent, age gate, a 3-image silhouette | 2 |
| 4 | **Fit check** | Camera/PHPicker, a body-pose quality gate, face blur, extraction, a Swift scorer with about 12 rules, fixes (at least one free), a streamed explanation | 5 |
| 5 | Re-check + **"Not quite right?"** | One included re-check, and a correction sheet that re-scores instantly | 1.5 |
| 6 | Closet | Auto-add with Undo, add by photo (multi-select), "not photographed yet" from chat, grid, item detail | 3 |
| 7 | Rotation + "+N fits" + Next best buy | Hard-rule counter, change in count per item, one top archetype | 2 |
| 8 | Starter essentials | Universal list of 12, pre-filled, tap to mark owned | 1 |
| 9 | Ask + What should I wear? + daily idea push | Style-only guardrail, `remember()` facts, a deterministic outfit picker, a local notification | 3 |
| 10 | Lookbook + You | History grid, month calendar, the "days with intent" counter, "What your stylist knows," settings, delete account, Sign in with Apple linking | 3 |
| 11 | Paywall + share card | RevenueCat, limit cards, a score share card (face hidden) | 2 |
| 12 | Content + shipping | Rubric copy, 40 archetypes, 6 style photos, App Store listing, privacy policy | 3 |
| | **Total** | | **≈ 32 days** |

**That's still too much for 4 weeks.** Read the 32 days as 5–6 calendar weeks at a student's pace. My recommendation: **TestFlight on Nov 3, submit around Nov 14, launch around Nov 17–20**, ahead of Thanksgiving. The Oct 30 submission in 04 isn't realistic. **If he's behind, cut in this order:** daily push (9) → multi-select add (6) → share card (marketing can screen-record instead) → Next best buy (7).

**v1.1 (weeks 2–6 after launch):** monthly recap, Style DNA, per-style essentials, before/after composer, gaps list, weekly move, referral, App Attest, the Check-my-fit Control, background removal on item photos.
**v2:** full-closet capture mode, widgets, weather, inspiration mode, lessons, cost per wear, affiliate links, lifetime plan, Family Sharing, the second-opinion page, event planner.

### 2.3 Onboarding cut (override of A4)

**Welcome → tap looks you like (max 3) → basics (height, build, fit, age range) → one consent tap ("Agree & check my fit") → first fit check + occasion → result + re-check → "Your first 3 moves" → paywall (Continue free) → notifications ask.**

Goal, boldness, budget and closet path move out of onboarding. The stylist asks for them **the first time they change an answer**: budget at the first buy suggestion, boldness when a fix could go bold. Sign in with Apple is offered after the 2nd fit check. That's **6 taps to the camera instead of 10.**

---

## 3. Research violations

| Violation (doc) | Evidence it breaks | Fix |
|---|---|---|
| "Counts double," an extra Pro shield, earned bonus checks, a stackable referral currency (04) | A3: light game layer. C2: expected tangible rewards undermine intrinsic motivation (Deci). The founder finds game mechanics cringe | Drop them all. The progress is Rotation and the score |
| A 4-part streak system (04) | A3: "quiet" streak | A counter, no chain (§1 #15) |
| Calendar/archive behind Pro, outfit ideas 1/week (04) | 69% of 1–2★ reviews are about paywalls (C3). Lost progress is a quit reason | History and ideas stay free |
| Day-7 and day-30 "progress moment" upsell cards inside chat (04) | Turns the reward moment into a sales pitch (C14: insights as rewards) | Put the trial-end summary in the trial reminder only |
| Videos like "Rating fits on campus," "Fit Court: viewers submit" (04) | Rating strangers drifts toward rating *people*. Submitted photos can come from minors (C15). Looksmax associations (84% negative sentiment) | Only the founder, consenting adult friends, and **neck-down** clips. No open submissions |
| A second-opinion web page with friends' reactions (04) | C2: social comparison is linked to body dissatisfaction. C15: keep minors' photos private | v2 at the earliest, adults only |
| 03's consent copy "sent to our AI provider" vs. A3's "less in your face" | Both are real constraints | Disclose once, plainly, on the consent step (required by 5.1.2(i)). Never use "AI" in UI labels or marketing |
| A 7.0 Rotation threshold makes beginners start at 0 (02) | Endowed progress, 34% vs 19% (C2) | Hard-rule counting |
| A 300-photo golden set built from "own or licensed" photos (02) | Fine in principle, but nobody owns the job, and AI-generated outfit photos clash with C3 ("users hate AI art") | 60 consented adult photos for v1 (§5) |
| Rotation filtered by season (02) | A number that drops in a new season reads as a loss (C2 comeback over punishment) | Count all seasons |

---

## 4. Technical, cost, App Review and privacy risks

| Risk | Severity | Why | Mitigation |
|---|---|---|---|
| **Mirror-selfie extraction can't read fit details** (shoulder seam, sleeve end, pant break, tuck, condition) | **High** | The raised arm distorts the shoulder and sleeve, the phone covers the chest, ankles get cropped, lighting is poor, and 1024 px is low resolution. The Fit sub-score carries 45% of the weight and depends on exactly these fields | The day-1 spike (§6 #1). Score the Fit sub-score only on coarse fields (leg shape, overall volume, gross break). Mark fine rules "advice only" until they're validated. The camera shows a framing guide and offers a timer with the phone propped up |
| **The re-check delta goes the wrong way** | **High** | Temperature 0 isn't deterministic, and one flipped enum can move the score ±0.5–1.0. He cuffs his jeans and the score goes *down*, which breaks the aha moment and the "consistent" promise | **Anchor the re-check:** reuse the previous extraction and ask only about the attribute the fix targets ("Is the hem now cuffed?"). Recompute from that. The score drops only if a new issue is detected, and the card names it |
| Consistency across photos of the same outfit | Med | Different angles produce different extractions | 02's closet anchoring (confirmed item attributes override the photo), plus the "Not quite right?" correction |
| **Closet duplicates inflate Rotation** | **High** | The same jeans get tagged once as navy and once as black, so the closet fills up and "Rotation 4 → 10" is fake | Match on category + color family, then ask the Yes/No question. A merge action in the Closet. Count Rotation by equivalence class. Unit-test the counter |
| Chat-mentioned items have no attributes | Med | "Denim jacket" has no color or fit, so Rotation counts are guesses | They count with neutral defaults, the badge says "not photographed yet," and they're excluded from the "+N" claims |
| **Promotional pricing ends Dec 31, 2026** | **High** | 02's model price is promotional. List price could raise costs 2× about 6 weeks after launch. 04's prices come from aggregator sites | Model costs at list price, and keep that margin. Provider-agnostic proxy. Downscale images. A daily spending kill-switch. No lifetime plan |
| Model deprecation | Med | Pinned versions get retired, which changes scores silently | Run the golden set before every model swap. Stamp the version on each check |
| **5.1.2(i) consent for third-party AI** | **High** | Rejection if consent isn't explicit before the first upload | A real opt-in tap before the first photo is sent. Name the provider in the privacy policy. Make the privacy labels match |
| **1.2 "hot or not"** | Med | A numeric score on a photo of a person | Faces blurred before upload. Every sub-score is about garments. Review notes plus a demo outfit ("Show me an example") so the reviewer doesn't have to take a selfie |
| Age rating and minors | Med | Apple's new questionnaire asks about unrestricted AI chat and user-generated content. A 16+ rating would block 14–15-year-olds under Screen Time | Topic-restricted chat with moderation. Answer the questions honestly and aim for 13+. No public UGC |
| **Minors' underwear or shirtless photos reaching a third-party AI** | **High** | Children's privacy, possible CSAM exposure, provider abuse logs. Apple's SensitiveContentAnalysis framework only works if the user has turned on Sensitive Content Warnings, so it can't be relied on | An **on-device** clothed/NSFW check before upload (an open-source Core ML model plus a body-pose heuristic). Reject on the device. Never store. Document an incident process |
| Provider data retention | Med | Paid Gemini tiers still keep abuse logs. Zero retention needs approval | Read the terms, apply for zero retention, and don't claim "not collected" on the privacy label unless it's verified. **Declaring Photos as collected is the safer choice** |
| Sign in with Apple linking an anonymous account | Med | A bad merge loses the closet (quit risk) | Use Supabase's built-in identity linking. Test reinstall, sign-out and second-device cases |
| Latency (p50 4.5 s) | Low | "Thinking" tokens and cold starts | Low thinking budget, a skeleton card, honest staged status |
| Cultural and religious clothing (habesha kemis, kurta, thobe, hijab) | Med | The rubric could penalize clothes it doesn't recognize | Category "traditional/cultural" → that item isn't rated and the score is Partial. Never call it a mistake |

---

## 5. Missing pieces nobody covered

| Gap | What's needed | Owner / when |
|---|---|---|
| **A "disagree" path** | A "Not quite right?" button on every fit card → chips: *Wrong item* · *Wrong color/fit* · *Fix doesn't apply* · *Score feels off*. Fixing an attribute **re-scores instantly at no cost** (the scorer is deterministic). Every correction is logged by rule ID. **Being correctable is a moat ChatGPT doesn't have**, and it's how "scores are random" (33 reviews) turns into trust | v1 |
| Calibration and golden set | 60 photos (10 outfits × 6 shots: front, mirror, poor light, and a fixed version), only consenting adult founders and friends. The founder labels them using a one-page scoring guide. It grows toward 300 after launch from opt-in corrections | Week 1 |
| Updating the rubric | Remote `rubric.json` (weights, penalties, thresholds, copy, `review_by` dates) plus semver, a changelog in the repo, and a script that runs the golden set and diffs the score distribution before publishing | Week 2 |
| Analytics | TelemetryDeck or PostHog free tier, no personal data. About 15 events: `onboarding_step`, `consent_given`, `fitcheck_started/scored/partial/failed`, `recheck_done`, `score_delta`, `disagree_tapped{reason}`, `item_added{source}`, `dupe_prompt{answer}`, `outfit_idea_wore`, `push_opened`, `limit_hit`, `paywall_shown/trial_started/converted`, `share_card_exported` | v1 |
| Legal | Privacy policy (names the AI provider, retention, rights for minors), Terms (Apple's standard EULA is fine), a one-page minors' data-protection impact assessment (UK Children's Code), video-subject releases (04 has these), the provider's data processing terms | Week 3 |
| Support | A support URL and email (required), an FAQ: "Why did my score change?", "How Rotation is counted", "Delete my data", "Cancel" | Week 3 |
| **App name** | It blocks the TikTok handle, the waitlist page, the listing and the watermark. Check the App Store, the USPTO trademark database, the TikTok/IG handle and the .com domain. **Decide this week** | Now |
| App Store listing | 6.9" screenshots built around the fit card and "+N fits." Subtitle and keywords (*outfit checker, men's style, what to wear, fit check*). Age-rating answers, review notes plus demo mode, privacy labels | Week 4 |
| Onboarding style photos | 6–9 photos the founder shoots himself or licenses (e.g., Unsplash). Not AI-generated | Week 2 |
| Content writing | About 12 rules × fix templates, 40 archetypes, 12 essentials, refusal and distress copy, an off-topic and jailbreak test set of about 50 prompts | Spread over weeks 1–3 |
| Crash and monitoring | Xcode Organizer plus a free tier of Sentry. A daily cost dashboard | v1 |
| Teen share of the audience | No doc models what % of TikTok-driven installs are 14–17. **Teens can't pay** ("I'm 14 I can't pay," C3), so 04's revenue scenarios silently assume adults | Measure on the waitlist (§6 #5) |

---

## 6. The 5 riskiest assumptions and the cheapest tests

| # | Assumption | Cheapest test | Pass bar | When |
|---|---|---|---|---|
| 1 | **A budget vision model can reliably read fit attributes from mirror selfies, and a re-check after a fix moves the score the right way** | A Python script, no app: 10 outfits × (before + fixed) × mirror/propped shots, each run 5× through the extraction schema. Measure attribute agreement, score spread, and how often the fix is detected | ≥ 90% of rounded scores within ±0.5. Fix detected ≥ 80%. **If it fails, drop the fine-fit rules before building any UI** | Oct 6–8 |
| 2 | **Users trust this score more than a free ChatGPT answer** | Blind comparison with 8–10 target users (dorm, friends, a 40+ relative): same photo, the app's card printed out vs. a ChatGPT reply. "Which would you use tomorrow? Which feels fair?" | ≥ 7/10 pick the card, and they name *consistency or specificity* as the reason | Week 2 (mocked card) |
| 3 | **"Fit fix" reveals from this founder drive signups** | Already planned in 04: 14 posts in week 1, with link clicks and waitlist signups tracked per 1K views | ≥ 1 video over 50K views and ≥ 300 signups by Nov 2 | Oct 6 – Nov 2 |
| 4 | **The closet actually builds itself, and men come back for daily ideas** | Concierge test: 10 friends text him a fit photo; he scores it with the spike script and sends one outfit idea a day by iMessage for 7 days. Then TestFlight with 30 users | Concierge: ≥ 5/10 still replying on day 7. TestFlight: median ≥ 8 items by D7, D7 ≥ 25% | Weeks 2–4 |
| 5 | **Enough of the audience is adult and willing to pay $29.99/yr while a generous free tier exists** | The waitlist form asks for an age range and offers two honest buttons: "Join free" vs. "Lock the $19.99 founding price" (no charge; "we'll email you at launch") | ≥ 50% of signups are 18+, and ≥ 15% tap the founding price | Weeks 1–4 |

**Bottom line:** run test #1 before writing any SwiftUI. If extraction holds up, the 12-feature v1 above is a lovable, defensible app. If it doesn't, the product shifts toward "what should I wear from my closet" plus correctable scoring of coarse attributes. That's 04's own pivot, just found 2 months earlier and for free.

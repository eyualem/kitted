# Demo App Spec: Your Pocket Stylist (v1)

*How this was made: four specialist agents each designed the full app (product and journeys, stylist brain, navigation and UX, business and growth). A critic agent then attacked the combined design and found 22 contradictions, a scope that was about 3× too big, and the untested assumption everything depends on. This document is the merged result. Every decision traces back to the research in `research-context.md`. Oct 5, 2026.*

**Status:** a draft for your review. Section 17 lists what you need to decide. The full agent reports are in the `brainstorm/` folder.

**Name:** still TBD. "[App]" below stands in for it.

---

## 1. The app on one page

**What it is:** a personal stylist in your pocket. You chat with it and send outfit photos. It tells you if your fit works and exactly how to fix it, learns your closet as you talk, and shows your progress.

**Positioning line:** "Look put together. Without trying too hard."

**Who it's for:** style beginners, **ages 18+ only** (decided Oct 6, because of Gemini's API terms and the US age laws): a 19-year-old student, a 26-year-old starting an office job, a 50-year-old dad. Men-focused.

**The one rule that keeps it simple:** **you *do* things in the Stylist tab, and you *look at* things in the other three tabs.** The chat exists in exactly one place.

**The core loop:**
1. Get dressed and snap a photo.
2. Get a **score out of 10** and 2–3 fixes, at least one of them free (tuck, cuff, swap shoes).
3. Make the fix and **re-check**. The score goes up.
4. The items in the photo **land in your closet automatically**.
5. Your **Rotation** (how many outfits your closet makes) grows.
6. Each morning you can get an outfit idea built from your own clothes.

**The "aha" moment:** within about 3 minutes of opening the app, he makes a fix the stylist suggested, re-checks, and sees his score go up (e.g. 6.0 → 6.5 after cuffing his jeans). **Target:** 40%+ of new users re-check or save their plan in their first session.

**Why it beats free ChatGPT** (which can already rate an outfit photo):

| ChatGPT | [App] |
|---|---|
| Judges from scratch every time, so scores drift | **Same photo, same score.** Scores come from fixed rules in code, and every score is explained |
| Doesn't know your clothes | **Remembers your closet, sizes, styles and past outfits** |
| Can't be corrected | **"Not quite right?"** Fix a detail the app got wrong and the score updates instantly |
| No progress | **Rotation, starter essentials, Lookbook history** |
| General chatbot | Built for men's style only, with a stylist's voice |

---

## 2. Navigation and structure

**Four tabs** (Apple's standard floating tab bar, always visible, labeled):

| Tab | Purpose | What's inside (v1) |
|---|---|---|
| **Stylist** (home) | Talk and do | The chat thread · 4 quick-start buttons · camera and photo buttons · cards |
| **Closet** | What I own | Rotation count · starter essentials (x/12) · item grid by category · item detail · add items |
| **Lookbook** | What I've worn and how I'm improving | Every fit check, recorded automatically · month calendar · "Days dressed with intent: 4 this week · 41 total" |
| **You** | Me and my settings | Silhouette and basics · styles · **What your stylist knows** · Pro status · settings (gear icon, top right) |

**Presentation rules:**

| Type | Used for | How you leave |
|---|---|---|
| **Push** | Opening an item, a look, a setting | Back arrow or edge swipe |
| **Sheet** | Short tasks: "Why this score," edit an item, "Not quite right?" | Swipe down or Done |
| **Full screen** | Camera, paywall, onboarding | Always a visible **X**, from the first frame |
| **Undo toast** | Reversible actions (an auto-added item, a deleted fact) | Disappears after 5 seconds |
| **Confirmation dialog** | Only for irreversible actions (delete account, delete all photos) | Cancel is the default |

**Cross-tab rule:** buttons like "Style this item" (Closet) or "Re-check" (Lookbook) **switch you to Stylist** with that item or look attached to the message.

**v1 screen list (about 25 screens):**
- **Onboarding:** welcome, onboarding chat, restore account
- **Stylist:** chat, camera, photo review, photo picker, photo viewer, "Why this score," "Not quite right?," share card, limit card
- **Closet:** home, item detail, edit item, add-item menu, essentials checklist, "How Rotation is counted"
- **Lookbook:** home (Looks / Calendar), look detail
- **You:** home, style profile, What your stylist knows, settings, privacy, delete account, subscription, notifications
- **Paywall**

**Cut from v1:** Live Activities, minimizing the tab bar on scroll, the offline photo queue, search.

---

## 3. Onboarding (shortened after the critique, **needs your approval**)

The critic found the onboarding we agreed on had grown to 11–15 steps. That's exactly the "feels complicated" problem. The merged version is **6 taps to the camera**:

| # | Turn (inside the chat, tap answers only) | Why |
|---|---|---|
| 1 | **Welcome:** "Look put together. Without trying too hard." → Get started (no account) | Fast start |
| 2 | **Tap up to 3 looks you'd wear** (6–9 real outfit photos, your own or licensed, never AI-generated). "Pick by name instead" link. "Not sure" → balanced default | Style without needing style vocabulary |
| 3 | **Basics:** height, build (slim / average / broad), fit preference (fitted / regular / relaxed), **birth year** (under 18 → polite stop screen; plus Apple's Declared Age Range check) → the silhouette appears | Fit advice + age gate |
| 4 | **Consent:** "Your photo is sent securely to score your outfit. Faces are blurred. Not used for ads. Delete anytime." → **Agree & check my fit** | Required by Apple guideline 5.1.2(i) |
| 5 | **First fit check:** take a photo (camera permission is asked only now) or choose from library (no permission needed) or "Show me an example" → occasion chips appear while it uploads | The aha moment |
| 6 | **Result + re-check** → **"Your first 3 moves"** (a personal starting plan) | Fixes the #1 blocker: "where do I start?" |
| 7 | **Pro offer:** clear price and trial, **X and "Continue free" visible immediately**, no timers or exit offers | Value first |
| 8 | **Notifications:** "Want a daily outfit idea at a time you choose?" (Apple's permission prompt only appears if he says yes) | Asked in context |

**Moved out of onboarding:** goal, boldness and budget. Each is asked **the first time it changes an answer**: budget at the first buy suggestion, boldness when a fix could go bold, goal when it matters for an occasion. The closet-path choice is gone too: quick start is automatic, and "photograph my whole closet" is a button in Closet. **Sign in with Apple** is offered after the 2nd fit check. Until then he has an anonymous account, so nothing is lost.

**Resume:** progress saves after every tap. Back undoes the last answer, and tapping any earlier answer bubble edits it. If he closes the app on the paywall, it counts as shown and is never repeated.

---

## 4. The Stylist chat

**Four quick-start buttons** (always above the keyboard when idle):

| Button | What happens |
|---|---|
| **Check my fit** | Opens the camera immediately |
| **What should I wear?** | One tap question (occasion) → an **Outfit card** built from his closet |
| **I bought something** | Photo or describe it → an **Item card** with "+N fits" |
| **Ask a question** | Opens the keyboard with starter questions ("How should jeans fit?", "First shoes to buy?") |

**Card types (v1):**

| Card | Contents | Actions |
|---|---|---|
| Fit check | Score /10, Fit · Color · Proportion, occasion chip, one-line summary, 2–3 fixes with predicted gain ("6.5 → 7.5 if you tuck"), "Added 3 items · Review" | Why this score · **Not quite right?** · Re-check · Share |
| Outfit | 2–4 item photos, a one-line summary ("Relaxed workwear: earthy layers, straight pants") | Wear this · Swap one · Save |
| Item | Photo, category, color, fit, "+12 fits" | Added · Undo · Edit |
| Buy suggestion | Item *type*, price range for his budget, what to look for ("shoulder seam at your shoulder") | Got it · Remind me |
| Plan | "Your first 3 moves" checklist | Tap a move to start it |
| Question | One question with tap answers (Yes / No / Not sure) | Chips |

**Conversation rules:**
- **At most one follow-up question per reply**, always answerable with a tap.
- **Never ask the same thing twice.** Answers are saved as facts. Skipped questions are marked "declined."
- **Which question to ask:** from a hand-ordered priority list (occasion → fit preference → height → budget → sizes → shoes owned → dress code), and only if that fact is unknown *and* the current answer depends on it. Otherwise assume a default and say so ("assuming straight-leg").
- **Style topics only.** Off-topic requests get one friendly line and a redirect. "Rate my face" → "I rate outfits, never people. Send a fit and I'll help you look sharp in it."
- **Distress signals** (self-harm, eating-disorder language): stop styling, show support resources (988 in the US). No score.
- **Daily idea:** arrives as a normal chat message ("Today: navy overshirt, grey tee, white sneakers"), not a pinned dashboard.
- **Items mentioned but not photographed** ("I have a denim jacket") are added as **"not photographed yet."** They're excluded from "+N" claims until photographed.

---

## 5. How the fit check works

### 5.1 The principle: "the AI sees, the code judges, the AI explains"
1. **On the phone (free, instant, private):**
   - fix orientation and strip location data
   - **quality check** (are shoulders, hips and shoes in frame? is it bright enough?)
   - **blur faces** and other people
   - **block photos that aren't fully clothed**, on the device, before anything is uploaded
2. **AI vision model (server):** describes the garments in fixed categories only (type, color family, pattern, logo size, leg shape, volume, condition, how sure it is). **It never outputs a score.**
3. **Rules in code (on the phone):** calculate Fit / Color / Proportion, adjust for the occasion, and pick the fixes. The rules live in a **remote file** (`rubric.json`), so they can be updated without an app update.
4. **Small text AI:** writes 2–4 friendly sentences explaining the result. It **never sees the photo and never sets a number.** Every number in its text is checked against the computed values.

### 5.2 Scoring
- **Sub-scores:**
  - **Fit:** coarse fit, volume vs. his style band, gross pant pooling, condition
  - **Color:** number of colors, neutral base, pattern clashes, leather match
  - **Proportion:** top/bottom balance, layering
- **Weights:** start at Fit 0.40 / Color 0.30 / Proportion 0.30. These get re-calibrated after the extraction test (§14).
- **Occasion is a modifier, not a fourth score.** If the outfit is too casual or too formal, the overall score drops by 0 to −2.5 and the card shows "a bit casual for an interview." Five occasions: **Everyday · Class/Work · Date/Going out · Interview · Event.**
- **Rounded to .5.** Calibrated so a clean basics outfit scores about 7, strong is about 8.5, and 10 is rare.
  - **Fixed in rubric v3 (Oct 6):** v2 only subtracted for mistakes, so any outfit with no detected mistake scored 9.0 (gym shorts at home included), and scores ran only 7.0–9.0. v3 is **7.0 + credits − mistakes**, and scores now spread 5.5–9.0 with consistency still 95–100%. See `rubric/v3.md`.
- **Score out of what's visible.** Anything not in the photo (shoes, bottom half) **never costs points**, and it also comes off the maximum. A top-and-pants check can still reach 10. See §5.6.
- **Style-aware:** timeless rules apply to everyone. Silhouette rules depend on his chosen styles. This resolves the slim vs. relaxed disagreement among creators: streetwear expects relaxed-to-wide, smart casual expects slim-to-straight.

### 5.3 Consistency (the promise)
- **The same photo always gets the same score.** Results are cached by image fingerprint.
- **Closet anchoring:** once he confirms "these are my navy chinos," those details override what any future photo suggests.
- **Re-check anchoring** (from the critique): a re-check **reuses the first reading** and only re-examines what the fix changed. If he cuffs his jeans, the score can't randomly go down. It only drops if a *new* problem appears, and the card names it.
- **Partial checks:** if shoes or the bottom half are out of frame, those rules are skipped, nothing is penalized, and the card says so clearly (full flow in §5.6). If the photo is unreadable: no score, it doesn't count toward his free check, and he's asked for a retake. **Never guess.**
- **Not quite right?** opens chips: *Wrong item* · *Wrong color/fit* · *Fix doesn't apply* · *Score feels off*. Correcting a detail **re-scores instantly for free**, and every correction is logged so the rules get better.
- **Before launch:** an automated test re-runs a set of labeled photos 5× each. 90%+ of scores must land within ±0.5.

### 5.4 Fixes
- **2–3 fixes**, ranked by "smallest change, biggest gain." **At least one is free** (tuck, cuff, roll sleeves, swap socks or shoes he owns). At most one is "buy," and only if the outfit can't reach 7 otherwise.
- **Respect his boldness setting** (default "a little" until asked) **and budget.** Items he owns are preferred.
- If nothing gains at least 0.5: "This is dialed in. Nothing to fix," plus a "next level" idea.

### 5.5 Inclusivity and safety (enforced in code)
- **No rule ever reads the face, body shape, weight or skin tone.** Color rules compare garments to garments only.
- Height and build are used only to **rank advice**, never to lower a score.
- **Traditional and cultural garments** (habesha kemis, kurta, thobe…) are marked "not rated" rather than "wrong."
- **Text inside a photo can't change a score**, because the vision step outputs categories only.

### 5.6 Partial checks and the shoe snap (decided Oct 6)
**Why:** many users only have a bathroom mirror or a selfie camera. Getting shoes in frame means stepping back about 6 ft, which small rooms don't allow. People also check fits while just trying things on. So a full-body photo is **preferred, never required.**

**Rules:**
1. **Never penalize what isn't in the photo.** Missing shoes or a missing bottom half costs 0 points, and those rules' credits come off the maximum too (§5.2). Cut-off shoes are **not** a reason to retake the photo.
2. **Always say what was checked.** The score shows right away with a text label, never color alone (HIG):
   > **8.0 · Partial check: shoes not included**
   > *Your score may change once we see your shoes.*
   - If the bottom half is cut off: "Partial check: top only."
3. **Offer one way to finish, once per check, with no nagging.** The card has one primary action plus an alternative:
   - **📷 Snap your shoes:** "Point your phone at your feet." It also captures the hem, where the pants meet the shoes.
   - **Pick from Closet:** one tap if those shoes are saved. Later checks ask "Same shoes as Tuesday?"
   - If only the top was in frame, the button becomes **"Snap your bottom half"** (point down from standing to get the legs and shoes).
   - **Skip** keeps the partial label. He's never asked again for that check.
4. **The score updates in place:** *"8.0 → 7.5 · Full check ✓"*, with the reason ("running shoes with chinos").
5. **It's the same fit check.** The extra snap never uses up a free check or a re-check.
6. **Lookbook keeps partial and full checks apart.** History and "+N fits" label partial results, and a partial 8.0 is never compared with a full 8.0. Partial checks still count toward "days dressed with intent."

**How it works:**
- The shoe snap is a **second, smaller vision call**. It reads only footwear and the pants hem.
- Its reading replaces the first photo's footwear and hem fields, and then the code re-scores. Same rules, same rounding.
- Each snapped pair of shoes is added to the Closet, so regular users rarely need the second snap.
- Analytics: `fitcheck_partial` (with what was missing), `shoe_snap_done`, `shoe_snap_skipped`, `shoes_picked_from_closet`.

**To test before building (in the next real-photo test):**
- **Angle:** a photo looking straight down squashes the pants visually and may make a clean hem look like pooling. For 3–4 outfits, take a straight-down snap **and** a knee-height snap, and compare them with the full-body reading.
- **Real rooms:** how often do shoes get cut off in a real room, with a propped phone and with a mirror?

---

## 6. Closet and Rotation

**How the closet fills (both paths):**
- **Quick start (automatic):** items in each fit-check photo are **added automatically** with a 5-second **Undo**. If an item looks like one he already has ("Same as your black jeans?" Yes/No), that becomes the turn's one question. This prevents duplicates that would inflate Rotation.
- **Chat:** "I have a denim jacket" → added as "not photographed yet."
- **Add anytime:** the Closet "+" button: take a photo, choose photos (multi-select), or describe it.
- **"Photograph my whole closet"** (the full path) is just multi-select add in v1. A dedicated capture mode comes in v2.

**Rotation** ("Your rotation: 37 fits"):
- **Counts outfit combinations** (top + bottom + shoes, plus optional layers) that **pass the hard rules:** formality gap ≤ 1, at most 4 color families, no style clash.
- **No score threshold and no season filter**, so beginners start above zero and the number never drops when seasons change. It only goes down if he deletes items.
- Near-identical items count once (two white tees = one).
- A "How is this counted?" sheet explains it in plain words.

**"+N fits" and the next best buy:**
- Uses **40 item archetypes** (e.g. "light-blue oxford shirt," "olive relaxed chinos," "brown suede loafers"). For each, the app calculates how many new outfits it would add with what he owns, filtered by budget.
- Shown as: **"White leather sneakers → +12 fits · $60–100 · look for a slim sole and minimal branding."** Also a "best value per dollar" line.
- No store links in v1. Optional affiliate links come much later.

**Starter essentials (12, one universal list for v1).** A draft to verify with the dated Gemini re-run:

| # | Item | # | Item |
|---|---|---|---|
| 1 | Plain white heavyweight tee | 7 | Overshirt or chore coat (denim/olive) |
| 2 | Plain neutral tee (grey, navy or black) | 8 | Casual jacket (denim, bomber or field jacket) |
| 3 | Light-blue or white oxford shirt | 9 | White leather sneakers |
| 4 | Crewneck sweater or knit (grey/navy) | 10 | A second shoe: suede loafers or Chelsea/work boots |
| 5 | Dark straight-leg jeans | 11 | A plain hoodie or quarter-zip (no big logo) |
| 6 | Chinos, straight or relaxed (navy or khaki) | 12 | A belt that matches his main shoes |

It starts **pre-filled** from items detected in his first fit check, plus "tap the ones you already own." That way he begins at something like 3/12, not 0/12. Per-style lists come in v1.1.

---

## 7. Lookbook (v1)

- **Every fit check is recorded automatically.** "Save" just marks a favorite, so there's no decision to remember.
- **Month calendar** of days with an outfit logged (from a fit check or "Wear this").
- **"Days dressed with intent: 4 this week · 41 total."** There's **no daily chain**, so there's nothing to break, shield or repair (the critic's override, consistent with "quiet" and "forgiving"). After time away, the message is "Welcome back," never a loss.
- The **monthly Lookbook recap** (the shareable "Wrapped") comes in **v1.1**, on the 1st of the month for anyone with 5+ logged days. Nobody reaches the 1st of the month in launch week anyway.

---

## 8. You (v1)

- **Silhouette and basics** (editable), **styles** (max 3), boldness and budget (once known)
- **What your stylist knows:** every fact with its source and date ("You told me · Oct 5," "From a fit check," "My guess"). Each can be **edited or deleted**, and deleted facts are never used again. Plus a "Things I'm assuming" section.
- **Privacy:** **photos are saved only on your phone.** A face-cropped copy goes to Google's Gemini API to be read; Google keeps it up to 55 days for abuse checks and doesn't train on it. *(The v1 build has no server-side profile at all: see `app-build-spec.md` D2.)* "Delete all photos." **Delete account** in the app (Apple requirement).
- **Pro:** plan, renewal, today's free usage, Manage (Apple's built-in cancel sheet), Restore.
- **Notifications** settings and **Appearance** (follows the phone's light/dark setting by default).

---

## 9. Free vs. Pro

**Rule:** charge only for what costs money (AI calls). **Never charge to see your score.** History and outfit ideas are free forever.

| | Free | Pro |
|---|---|---|
| Fit checks | **1 per day** (resets 4 am local), full detail, never blurred | Unlimited (fair use 10/day) |
| Re-check | **1 included with every check** (within 30 min) | Same |
| Stylist questions | 5 per day | Unlimited (fair use) |
| "What should I wear?" + daily idea | Free (runs on code, costs nothing) | Plus alternates and a weekly plan (v1.1) |
| Closet, Rotation, essentials, Lookbook history, calendar | Free | Free |
| Next best buy | Top item | Full ranked list |
| Share cards | Free, always | Free |

**Pricing at launch:**

| Plan | Price | Notes |
|---|---|---|
| **Annual** (pre-selected) | **$29.99/yr with a 14-day trial** | Test $39.99 later |
| Monthly | $5.99, no trial | Mostly makes annual look like a deal |
| Founding member (waitlist only) | **$19.99** for the first year | Via an introductory offer or offer codes |
| **Not at launch** | Lifetime, weekly, Family Sharing | Lifetime is an open-ended AI cost; weekly plans keep only ~3% after a year; Family Sharing can't be turned off once on and covers 6 people |

**Paywall placements:**
1. After the first fit check and "3 moves" in onboarding
2. When a free limit is hit, with "Save for tomorrow" as the default choice
3. When tapping a Pro feature

**No sales pitches inside progress moments.**

**A trial reminder** goes out 2 days before the trial ends and doubles as a progress summary ("9 checks, Rotation 23 → 41").

**Under-18s:** Apple's Ask to Buy works without extra code.

---

## 10. Notifications (v1: only 3 kinds)

| Notification | Example | Rules |
|---|---|---|
| Daily outfit idea | "Today: navy overshirt, grey tee, white sneakers." | Opt-in, at **his chosen time**, from his own closet. Stops automatically after 3 unopened, then asks once in chat |
| Fit check ready | "Your fit check is ready. 2 quick fixes inside." | Only if he left the app while scoring |
| Trial ending | "Your trial ends Friday. Cancel before then and you won't be charged." | Always (trust) |

**Never** "we miss you," streak guilt, or marketing pushes.

---

## 11. Rubric v1 (about 12 rules on reliable details)

The critic's warning: an AI may **not** reliably read fine details (exact shoulder seam, sleeve length, pant break) from mirror selfies. So v1 scores only **coarse, readable** details. Fine-fit rules give **advice only** (no score impact) until the extraction test proves they work.

| ID | Rule | Sub-score | Type |
|---|---|---|---|
| C1 | 4 color families → small penalty; 5+ → bigger (denim and white count once) | Color | Timeless |
| C2 | Lots of loud color when boldness = subtle | Color | Timeless |
| C3 | Two strong colors clashing with no neutral between | Color | Timeless |
| C4 | Two bold patterns, or two patterns of the same scale | Color | Timeless |
| C5 | Belt and shoes both visible, in different leathers (dressier outfits only) | Color | Timeless |
| P1 | Top volume and leg shape vs. **his style band** (e.g. huge top + skinny jeans outside streetwear) | Proportion | Style-specific |
| P3 | Inner layer hanging longer than the outer layer (except streetwear layering) | Proportion | Timeless |
| F4 | Pants pooling heavily at the ankle (unless relaxed/wide in a streetwear profile) | Fit | Timeless |
| F7 | Visibly wrinkled or stained clothes | Fit | Timeless |
| F8 | Clearly oversized when that's not his style (looks borrowed, not chosen) | Fit | Style-specific |
| O1 | Too casual or too formal for the occasion (slight overdress is fine) | Occasion modifier | Timeless |
| O2 | Running/gym shoes with a non-athletic outfit (retro sneakers OK) | Occasion modifier | Timeless |
| O3 | Large logos when he isn't into streetwear | Occasion modifier | Style-specific |
| — | Advice only until verified: shoulder seam, sleeve length, pant break detail, shirt length, tuck | — | — |

Every rule has fix templates in tiers: **adjust** (free) → **swap from closet** → **tailor** ($15–30) → **buy.**

---

## 12. Technology

| Piece | Choice |
|---|---|
| App | **SwiftUI**, iOS 18+ (iOS 26 design where available) |
| Backend | **Supabase:** anonymous accounts (later linked to Sign in with Apple), a server proxy for AI calls (API keys never ship in the app), **per-user quotas**, a **daily spending kill-switch** |
| Vision AI | A budget "Flash"-class vision model, called through the proxy so the provider can be swapped in a day. **Budget at list price, not promotional prices** (one model's discount ends Dec 31, 2026) |
| Text AI | A small, cheap model for explanations and chat, with prompt caching |
| On-device | Apple Vision (quality check, people count, body pose, face blur) + an on-device clothed/NSFW check before any upload |
| Scoring | **One Swift scorer on the phone** + the remote `rubric.json` (versioned, with a changelog) |
| Payments | RevenueCat (free until $2.5K/mo revenue) |
| Analytics | TelemetryDeck or PostHog free tier, no personal data |
| Crashes | Xcode Organizer + Sentry free tier |

**Measured in Test 1 (Oct 6), Gemini 3.8 Flash:** about **0.9 cents per fit check** at the introductory price, rising to about **1.9 cents from Jan 1, 2027**, when Google doubles the price (third-party price listings; confirm on AI Studio). About 85% of the cost is output, mostly the model's hidden thinking, so the next test tries thinking turned off. A shoe snap adds less than one full check. The estimates below predate the test.

**Cost estimates** (to recheck at list prices): a fit check costs roughly **0.5–1 cent**, and a chat message about 0.1–0.2 cents. The average free user costs **a few cents a month.** A heavy Pro user costs about $1–1.50/month against about $2.12/month net from $29.99/yr, which is why fair-use caps matter and why $39.99 is worth testing.

**Analytics events (about 15):**
- onboarding_step, consent_given
- fitcheck_started/scored/partial/failed, recheck_done, score_delta
- shoe_snap_done/skipped, shoes_picked_from_closet
- disagree_tapped, item_added, dupe_prompt
- outfit_idea_wore, push_opened, limit_hit
- paywall_shown, trial_started, converted
- share_card_exported

---

## 13. Share cards and marketing

**v1 share card:**
- Outfit photo (**neck-down / face hidden by default for everyone**)
- Score, the one-line verdict, and the re-check line ("6.0 → 6.5 after 1 fix")
- A small watermark: "scored by [App]"
- Never gated

**Content plan (you as a style creator):**
- **Fit-fix reveals (~50%):** score → one fix → re-score, 5–8 seconds.
- **Lessons with identity tension (~35%):** "Stop dressing like a boy," "Short guys: this makes you look shorter," "4 items, 11 outfits."
- **Build in public (~15%):** "I'm building an app that rates your fit. Day 1."

**Content rules:**
- **No app-demo videos** (they get 3–5K views).
- The app's card appears for 1–2 seconds inside the video.
- **Only you and consenting adult friends, neck-down.** No strangers on campus, no open viewer submissions, never minors.

**Cadence:** 2–3 posts a day, cross-posted to TikTok, Reels and Shorts. Batch-film twice a week. Track 3-second hold, completion, shares, and link clicks → waitlist.

**Waitlist page (week 1):** asks for age range, with two honest buttons: "Join free" and "Lock the $19.99 founding price" (no charge). This tells us early whether enough of the audience is adult and willing to pay.

---

## 14. Build plan and timeline

### Step 0: the extraction test (Oct 6–8, **before any app code**)
A small script, no app:
- **10 outfits**, photographed **before and after a fix**, as mirror selfies and propped-up shots
- each run **5 times** through the AI description step

**Pass bars:**
- **90%+ of scores land within ±0.5**
- **the fix is detected 80%+ of the time**

If it fails: the fine-fit rules stay advice-only, and the product leans harder on "what should I wear from my closet" plus correctable coarse scoring. That's found 2 months earlier, for free.

### v1 build (about 32 focused days; roughly 5–6 weeks at a student's pace)

| # | Feature | Days |
|---|---|---|
| 1 | Backend skeleton (anonymous accounts, AI proxy, quotas, kill-switch, remote rubric) | 2 |
| 2 | Stylist chat shell (thread, 4 buttons, card renderer) | 3 |
| 3 | Onboarding (6 taps, consent, age gate, silhouette) | 2 |
| 4 | **Fit check** (camera/picker, quality check, face blur, AI description, scorer with about 12 rules, fixes, explanation) | 5 |
| 5 | Re-check + "Not quite right?" | 1.5 |
| 6 | Closet (auto-add + Undo, duplicate prompt, add by photo, "not photographed yet," grid, detail) | 3 |
| 7 | Rotation + "+N fits" + next best buy | 2 |
| 8 | Starter essentials | 1 |
| 9 | Ask + "What should I wear?" + daily idea push | 3 |
| 10 | Lookbook + You (history, calendar, days counter, What your stylist knows, settings, delete account, Sign in with Apple) | 3 |
| 11 | Paywall (RevenueCat) + share card | 2 |
| 12 | Content and shipping (rule copy, 40 archetypes, onboarding photos, listing, privacy policy) | 3 |
| | **Total** | **≈ 32** |

**Suggested dates:**
- TestFlight beta **Nov 3**
- Submit to Apple about **Nov 14**
- Launch about **Nov 17–20**, before Thanksgiving

**If behind, cut in this order:** daily push → multi-select add → share card (screen-record instead) → next best buy.

**v1.1 (2–6 weeks after launch):**
- monthly Lookbook recap, Style DNA (after 5 logged outfits), per-style essentials
- before/after comparison screen, wardrobe gaps, weekly "move"
- referral ("give a week, get a week"), Control Center "Check my fit" button
- background removal on closet photos, App Attest

**v2:**
- full-closet capture mode, widgets, weather-aware ideas, inspiration mode (recreate a look)
- lessons library, cost per wear, affiliate links
- lifetime plan, Family Sharing (a deliberate decision), event planner

---

## 15. Validation: the 5 riskiest assumptions

| # | Assumption | Cheapest test | Pass bar | When |
|---|---|---|---|---|
| 1 | The AI can read outfits from mirror selfies, and re-checks move the right way | The extraction test (§14) | ±0.5 for 90%+; fix detected 80%+ | Oct 6–8 |
| 2 | People trust this score more than free ChatGPT | Show 8–10 target users the app's card vs. a ChatGPT answer for the same photo | 7/10 prefer the card and name consistency or specificity | Week 2 |
| 3 | Your videos drive signups | Post 14 videos in week 1; track signups | 1 video over 50K views and 300+ signups by Nov 2 | Oct 6 – Nov 2 |
| 4 | The closet builds itself and guys come back for daily ideas | **Concierge test:** 10 friends text you fit photos; you score them with the script and text one outfit idea a day for 7 days. Then TestFlight with 30 users | 5/10 still replying on day 7; TestFlight median 8+ items by day 7, D7 retention 25%+ | Weeks 2–4 |
| 5 | Enough of the audience is adult and will pay | The waitlist age question + founding-price button | 50%+ are 18+, 15%+ tap the founding price | Weeks 1–4 |

**Post-launch gates:**

| Date | Bar | If missed |
|---|---|---|
| Dec 7 | D7 retention ≥12% and ≥2 checks per weekly user | Shift the core toward "what should I wear" |
| Jan 15 | Trial→paid ≥20% | Pricing and paywall changes |
| Mar 31, 2027 | ≥$1,000/month | **Keep, scale, or keep as a side project:** under $500 after experiments means keep it as a side project; $500–2K means keep going; over $2K means double down |

---

## 16. Pieces nobody had covered (now on the checklist)
- [ ] **App name.** Blocks the TikTok handle, waitlist page, listing and watermark. Check App Store, trademarks (USPTO), handles and .com. **Decide this week.**
- [ ] **Labeled test photos:** 60 at first (10 outfits × 6 shots, consenting adults only), growing to 300 after launch
- [ ] **Rubric update process:** remote file, version numbers, a test run before every change
- [ ] **Legal:** privacy policy (names the AI provider, retention, minors' rights), Apple's standard terms, a one-page minors' data assessment, video releases
- [ ] **Support:** support email/URL and an FAQ ("Why did my score change?", "How is Rotation counted?", "Delete my data," "Cancel")
- [ ] **App Store listing:** screenshots built around the fit card and "+N fits," subtitle and keywords (outfit checker, men's style, what to wear), age-rating answers (aim 13+), review notes plus the "Show me an example" demo mode
- [ ] **6–9 onboarding outfit photos** (your own or licensed; not AI)
- [ ] **Writing:** fix templates for each rule, 40 archetypes, 12 essentials, refusal and distress copy, a test set of about 50 tricky prompts
- [ ] **Re-run the Gemini research** with the 2024+ date window

---

## 17. Decisions needed from you

| # | Decision | Recommendation |
|---|---|---|
| 1 | Accept the **shorter onboarding** (goal, boldness and budget asked later, when they matter)? | Yes |
| 2 | Accept **"days dressed with intent: this week + total" with no daily chain**? | Yes |
| 3 | Accept **no lifetime plan and no Family Sharing at launch**? | Yes |
| 4 | Tab names: **Stylist / Closet / Lookbook / You** (or "Looks")? | Keep; test with 5 beginners |
| 5 | Max styles = **3**? | Yes |
| 6 | Run the **extraction test first** (Oct 6–8) before building? | Yes, it's the most important step |
| 7 | **Timeline:** TestFlight Nov 3, launch around Nov 17–20? | Yes, if you can give it about 5–6 weeks |
| 8 | **The name** | Let's brainstorm a shortlist next |

---

## Appendix A: Sample conversations (merged rules applied)

**First fit check (onboarding)**
> **You:** *(photo)* → occasion: Class
> **Stylist:** [Fit card **6.0/10** · Fit 5.5 · Color 7 · Proportion 5.5 · Class] Good base: the colors work. Two fixes:
> 1. Your jeans bunch at the ankle. Cuff them once. **Free fix.**
> 2. The hoodie runs past your hips. Try just the tee.
> Try the cuff and re-check? It's included.
> **You:** *(photo)*
> **Stylist:** [**6.5/10** ↑0.5] Cleaner line already. Added your hoodie, jeans and shoes to your closet · Undo

**"I bought something"**
> **You:** *(photo of an olive chore coat)*
> **Stylist:** Nice pick. Olive works with most of what you own. [**Rotation 21 → 33 (+12)**] Does the shoulder seam sit where your arm starts? (Yes) (It hangs past) (Not sure)

**A 50-year-old dad**
> **You:** My kids say I dress like an old man. How do I update without looking like I'm trying to be 25?
> **Stylist:** What makes clothes look dated is usually fit and shoes, not age. Three moves:
> 1. Polos that end at your shoulder.
> 2. Straight-leg trousers hemmed to a slight break (about $15).
> 3. Leather sneakers or suede loafers instead of running shoes.
> [Plan saved] Do you have a blazer at home? (Yes) (No)

**Off-topic / not allowed**
> **You:** rate my face
> **Stylist:** I rate outfits, never people. Send a fit and I'll help you look sharp in it. (Check my fit)

**Correcting the stylist**
> **You:** *(taps "Not quite right?" → Wrong color/fit → "these are straight-leg, not skinny")*
> **Stylist:** Got it, straight-leg. [Updated **7.0/10** ↑0.5] Saved to your navy jeans, so I'll remember.

## Appendix B: Source documents
- `research-context.md` / `.pdf`: the full research record
- `brainstorm/01_product_journeys.md`: personas, journeys, unlocks, 10 sample conversations
- `brainstorm/02_stylist_intelligence.md`: data model, scoring pipeline, full 32-rule draft rubric, AI cost model, safety
- `brainstorm/03_ia_ux.md`: about 40-screen inventory, chat details, onboarding turns, accessibility, flow diagrams
- `brainstorm/04_business_growth.md`: monetization, revenue scenarios, retention, virality, 15 video ideas, launch gates
- `brainstorm/05_redteam_critique.md`: 22 contradictions with resolutions, complexity audit, risks, missing pieces

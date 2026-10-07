# 13. Setup decisions: the referee's rulings

*Oct 6, 2026. Reconciles `CLAUDE.md`, `app-build-spec.md` (canonical), `demo-app-spec.md`, brainstorm 09 to 12, the two `inputs/` reports and `mockups/kitted-mockups.html`. App-build-spec wins unless a report gives a concrete, sourced reason it's wrong (marked **OVERTURN**). Taste and risk calls are **FOUNDER DECIDES**, with a default.*

---

## 1. Conflict table

| # | Topic | Positions | Ruling | Why |
|---|---|---|---|---|
| 1 | **Age floor** | CLAUDE.md, demo-app-spec: 14+. Build spec D1, 09, 11, age-rules report: 18+. | **FOUNDER DECIDES. Default: 18+, US only.** Revisit 16+ in 2027. | Gemini bars apps "likely to be accessed by" under-18s. Apple has no 14+ tier. 14+ costs 2 to 4 weeks, and teens don't pay. |
| 2 | **Provider** | Build spec D9, 11: Gemini. Provider report: test Luna / Haiku / Qwen for teens. | **Gemini 3.8 Flash, paid tier, v3 format, thinking off, behind `ReadingSource`.** 3-way test only if 16+ is chosen. | The only model that passed our tests. |
| 3 | **Declared Age Range** | Build spec R4: v1.1. Age-rules, 11: launch. | **OVERTURN: at launch**, behind `#available`. Min iOS stays 26.0. | Texas SB 2420 is enforceable since June 4, 2026; Apple's Q&A says 18+ apps must check. |
| 4 | **Backend** | Build spec D3: Worker + D1. 11, demo-app-spec: Supabase. | **Worker + D1.** | $0, no cold starts, no 7-day pause. A D1 `UPDATE … WHERE checks < lim RETURNING` is just as atomic. Supabase's wins need accounts. |
| 5 | **Abuse** | Build spec: App Attest, blocking by Nov 14. 11: IP rate limits, Attest in v1.1. | **Build spec.** | Device attestation beats IP limits. The $3/day kill-switch caps both. |
| 6 | **Payments** | Build spec D4: StoreKit 2. 11, demo-app-spec: RevenueCat. | **StoreKit 2 + `SubscriptionStoreView`.** Time-box server JWS checks to 1 day; if it slips, **RevenueCat as verifier only** (webhook → `pro_until`). | 11 is right that JWS checks are the hardest server code. That needs a fallback, not a second paywall. |
| 7 | **Analytics** | Build spec D5: `/v1/events` to D1. 11: PostHog. | **Build spec** + 3 saved SQL queries (funnel, D1/D7, paywall → trial). | 30 testers don't need an SDK or another third party on the label. Revisit before the Dec 7 gate. |
| 8 | **Accounts** | demo-app-spec, 10 (O6, S16, Y8, Y9), mockups: SIWA after check 2. Build spec D2, 11: none. | **None in v1. Cut O6, S16, Y8, Y9, "I've used Kitted before."** | All data is on the phone, so signing in restores nothing. |
| 9 | **Server data** | 09: hash + JSON + score. 10: readings, scores, facts. Build spec: counters only. | **Build spec.** | Nothing personal to store or delete. |
| 10 | **Upload** | Build spec D6: neck-down, blur backup. 09: pixelate leftover faces. Age-rules §3: refuse if both fail. | **Neck-down crop, pixelate any face left, refuse if pose and face detection both fail.** Gate on X8/X9. | Light blur is reversible (09); refusing keeps the consent promise true. |
| 11 | **Full-face original** | 09: keep it for chat and Lookbook detail. Build spec, 11: never stored. | **FOUNDER DECIDES. Default: never store the face.** Keep a 2048 px neck-down copy + 400 px thumb. | "Your face is never kept or sent" is one easy promise. 09's objection is taste. |
| 12 | **Closet tiles** | 09: Gemini `box_2d` + person mask. Build spec: pose regions. | **Pose regions + person mask; `box_2d` with v4.1.** | The locked v3 `schema.json` has no boxes. |
| 13 | **Reading screen** | Mockup, 10 (S5): own screen. Build spec §4.4: skeleton card in chat. | **Build spec;** the photo bubble shows the uploaded crop, "Only this is sent." | Fewer screens; keeps the mockup's best idea. |
| 14 | **Auto-capture** | Build spec §4.3: "Good" needs ankles. 10, mockup: shoulders + hips. | **OVERTURN: shoulders + hips steady 0.5 s fires 3-2-1.** Ankles add a tip. Volume-button shutter in Mirror. | Requiring ankles breaks the locked "full body preferred, never required." |
| 15 | **Nudity** | demo-app-spec: blocked on phone. 09: Core ML model. Build spec, 11: Sensitive Content Analysis + model backstop. | **Build spec, plus nothing is saved until the reading says clothed.** No "blocked on your phone" copy. Classifier in v1.1. | Sensitive Content Analysis is off for most users (Apple docs). |
| 16 | **Consent** | Build spec O4, mockup: "we never store it." Age-rules §3: Google named, 3 data types, 55 days, AI line. 10: provider from config. | **Age-rules §3 text;** provider name from `config`, tied to `consentVersion`. | Google keeps paid-tier data 55 days, so "never stored" is false. |
| 17 | **AI disclosure** | CLAUDE.md: never "AI stylist." Age-rules: one disclosure line. | **Both:** the name stays "your stylist"; one line in consent and the first chat message says it's an AI. | EU AI Act Art. 50, Utah law. |
| 18 | **Backup wording** | CLAUDE.md: "stay on the device." 09: `.complete` protection. Build spec: device backup, sync v1.1. | **Build spec, keeping `completeUntilFirstUserAuthentication`.** Wording in §3. | A check finishing after the phone locks can't write a `.complete` file. |
| 19 | **Timeouts** | Build spec: hedge 5 s (no first token), abort 8 s. 11: hedge 9 s, abort 14 s, app 16 s. | **OVERTURN in part: hedge 5 s, "Taking longer" at 9 s, abort 14 s, app 16 s.** Move the hedge to 7 s if M2 shows first-token p90 over 4 s. | Locked v3 p90 is 8.7 s, so an 8 s abort fails 10%+ of checks. The hedge watches first token, not completion. |
| 20 | **First-check fixes** | Mockup partial card: one closet fix, no free fix. 10: adjust tier only. | **Build spec §2.3: ≥1 free fix whenever any fix exists; closet swaps need a matching item.** "Change into" fixes say "Free if you own one." | The mockup breaks the locked free-fix rule. |
| 21 | **Partial card** | Build spec: Snap your shoes primary. 10, mockup: standard card + "Finish the check" row. | **Standard card + one row: Snap your shoes · Same shoes as Tuesday? / Pick from Closet · Skip.** Re-check stays primary if a free fix exists. | A partial check is the same check. |
| 22 | **Re-check window** | Build spec: 30 min. 10: first check until 4 am. | **OVERTURN: first-ever check until 4 am.** | Fixes often mean changing clothes; the 40% aha target rides on it; costs about 0.4¢. |
| 23 | **Onboarding paywall** | Build spec: result + moves → paywall. 10: after re-check or "Later"; 2 pages. | **Result → Re-check or Later → 3 moves → 2-page paywall** (his result + Pro, then `SubscriptionStoreView`). X and Continue free on both. | Superwall data (12.4% vs 9.1%); protects the aha. |
| 24 | **Score words** | Build spec: Sharp 9+ · Solid 7.5–8.5 · Close 6–7. Mockup: Needs a fix ≤5.5 · Getting there · Put together 7–7.5 · Sharp 8–8.5 · Dialed in 9–9.5. | **OVERTURN: mockup words.** | Rubric v3 puts a clean basic outfit at 7.0; "Close" calls it a miss. "Put together" is the positioning line. |
| 25 | **Pro copy** | Build spec, mockup: "Unlimited fit checks." Server: 10/day. | **"Up to 10 fit checks and 50 questions a day."** | A hidden cap behind "unlimited" is a 2.3.1 accuracy risk. |
| 26 | **Photos add key** | Build spec §1.1: none. 09, 10: add-only. | **OVERTURN: add `NSPhotoLibraryAddUsageDescription`.** | Share-sheet "Save Image" crashes without it (Apple docs). |
| 27 | **Held photos** | Build spec D8: no queue. 10: one PendingCheck. | **A `held` FitCheck status, never auto-sent; one tap scores it.** | "Save for tomorrow" needs it anyway. |
| 28 | **Birth year** | Mockup: 2005 prefilled. Build spec: blank. | **Blank.** | FTC COPPA FAQ: neutral age screen. |
| 29 | **Design system** | Build spec §6: warm paper `#FAFAF7`, loden green, New York score. Mockups: chalk `#F3F4F6`, indigo `#121628`, copper `#9C5326`, Archivo narrow, DM Mono. | **FOUNDER DECIDES. Default: mockup palette; Archivo only for score and wordmark** (bundled, OFL, `@ScaledMetric`); SF Pro for text; **SF Mono instead of DM Mono**, sentence case, ≥ 12 pt. | Denim-and-rivet is more ownable. Copper on white is about 5.7:1. Small uppercase mono fights Dynamic Type. Rescale mockups first (12: controls 1.3 to 1.45× too big). |
| 30 | **Debug key** | Build spec: direct Gemini in Debug. 11: proxy only. | **Build spec**, with a restricted dev key and a $10 budget. | Guards exist; saves proxy work before M2. |

---

## 2. The agreed setup in one page

- **App:** iOS 26.0+, Swift 6, SwiftUI + SwiftData, Xcode 26.3, no third-party packages. US App Store only, rating 18+.
- **Tabs:** Stylist · Closet · Lookbook · You. 10's map minus the 4 account items, Reading inline: **32 screens and sheets + 10 inline cards and states.**
- **Photos in the UI:** the neck-down copy in the chat bubble, card, Lookbook, share card and paywall (thumbs in grids). Closet: cut-out → plain crop → color icon. You: silhouette only.
- **What leaves the phone:** to Google via the proxy: the 1024 px neck-down, face-pixelated JPEG without metadata, snaps, closet item photos, questions + a closet summary, the result summary. To our proxy only: device ID, App Attest, corrections, events, StoreKit JWS. Never: face, birth year, name, location.
- **Storage:** SwiftData + `Application Support/Photos`, in device backup, saved only after a "clothed" reading. D1 holds usage, spend, `pro_until`, corrections, events. No images, readings or scores.
- **Accounts:** none. Keychain device ID + age flag. "Delete all my data." SIWA and iCloud sync in v1.1.
- **Backend:** Worker + D1, 4 am quotas, `checkToken`, $3/day kill-switch, App Attest log-only → blocking by Nov 14, 5/9/14 s timings.
- **Payments:** StoreKit 2; $29.99/yr (14-day trial), $5.99/mo, founding offer code.
- **Analytics:** about 15 events to `/v1/events`; crashes from Organizer.
- **Notifications:** 3, all local, asked only after "Yes, pick a time."
- **Age and provider:** blank birth-year gate (18+) + Declared Age Range; Gemini 3.8 Flash paid.
- **Design:** FOUNDER DECIDES (default above).

---

## 3. Doc fixes needed (not applied)

**CLAUDE.md**
- L12 "The app stays **open to 14+ and older users**: teens are free users who share;" → "The app is **18+ at launch, US only** (Gemini terms). Revisit 16+ in 2027 on a provider that allows minors."
- L33 "age; under 14 is blocked" → "birth year (blank); under 18 is blocked, plus Declared Age Range". "result plus "your first 3 moves" → skippable paywall" → "result → re-check or Later → "your first 3 moves" → skippable 2-page paywall".
- L35 "**Privacy:** photos stay on the device." → "**Privacy:** photos are saved on his iPhone and its own backup; Kitted's servers never keep them. A neck-down, face-hidden copy goes to Google, which keeps it up to 55 days for abuse checks and doesn't train on it."
- L41 "about 0.9¢ per check now and about 1.9¢" → "Superseded by the lock-in line below."
- L43 "⚠️ Gemini API terms … conflicts with "open to 14+"" → "Resolved Oct 6: 18+ at launch (`brainstorm/13`)."
- L73 "app plan → `demo-app-spec.md`" → "app plan → `app-build-spec.md` + `brainstorm/13` (they override `demo-app-spec.md`)". L80 "`brainstorm/01–05_*.md`" → "`01–13`".
- L94 "Write the v1 build spec … and start the SwiftUI project" → "Start M0 of `app-build-spec.md` (Developer Program + Paid Apps Agreement today)."

**app-build-spec.md**
- Header "(v4 answer format, rubric v3.1)", §2.1 "V4 decode → V4Adapter", §3.1 "`--format v4`", §3.2 "`<prompt_v4.txt>`" / "`<schema_v4.json>`" → v3 (`prompt.txt`, `schema.json`) per D9.
- §1.1 "No photo-library key" → "`NSPhotoLibraryAddUsageDescription` = "Save your Kitted card to Photos.""
- §3.3 "t = 8 s | Abort everything" → "t = 14 s"; "timeout of 10 s" → "16 s". §4.4 "Over 8 s" → "Over 9 s".
- §4.1 O4 consent → age-rules §3 text; O6/O7 → ruling 23.
- §4.3 "**Good** (shoulders, hips, knees and ankles all at confidence > 0.3)" → "**Good** = shoulders and hips steady". "Step back until your shoes are in" → "Step back a little. Shoes in frame if you can."
- §4.5 score words → ruling 24; "**Snap your shoes** (primary) · Pick from Closet · Skip" → ruling 21.
- §2.5 "within 30 min" → "within 30 min (first-ever check: until 4 am)".
- §4.8 "Your photos stay on this phone," and §4.9 "Unlimited fit checks and questions," → the CLAUDE.md L35 wording and ruling 25.
- §8 R4 "Optionally add Apple's Declared Age Range API in v1.1." → "Required at launch (Texas SB 2420)."

**demo-app-spec.md**
- §1 "ages 14+ (a 16-year-old student," → "ages 18+ (a 19-year-old student,".
- §2 "restore account" and "delete account" → remove.
- §3 "**age range** (13 or under → polite stop screen)" → "**birth year** (under 18 → stop screen)"; "Sign in with Apple is offered after the 2nd fit check." → "No account in v1."
- §5.1 "**block photos that aren't fully clothed**, on the device, before anything is uploaded" → "screen with Sensitive Content Analysis when on; the model is the backstop; nothing is saved until it passes".
- §5.2 "A top-and-pants check can still reach 10." → "… can reach the same maximum as a full check (9.5 today)."
- §8 "The server keeps only garment descriptions, scores and facts." → "The server keeps no photos, readings or scores." "**Delete account**" → "**Delete all my data**".
- §9 "Under-18s: Apple's Ask to Buy works without extra code." → delete.
- §12 "iOS 18+", "Supabase", "RevenueCat", "TelemetryDeck or PostHog", "Sentry free tier" → "See `app-build-spec.md` §1."

**Mockups:** drop "I've used Kitted before" and the SIWA caption; blank 2005; new consent lines; ruling 25 copy; rescale per brainstorm 12.

---

## 4. Top 5 open risks (ranked)

1. **The neck-down crop is untested.** It may lose collars, hats and layer edges, and failed mirror poses now mean "don't send." Gate: X8/X9 on the gold set by Oct 24, fallback = full frame with the face pixelated plus new consent text.
2. **Gemini's "likely to be accessed" clause** may not be satisfied by a gate if TikTok reach skews young. Keep hooks adult, book the 1-hour lawyer consult (age-rules §8), keep `ReadingSource` swappable.
3. **Fix detection is unproven (67 to 83%).** A flat re-check kills the aha that paywall timing now depends on. Use `RecheckMerger` + "I did cuff them"; measure on the 16 fix pairs.
4. **Scope vs. calendar.** About 32 days of work in 28, and Declared Age Range, JWS checks, the 2-page paywall and new consent add about 3 to 4 days. Apply the cut list on Oct 21.
5. **Real-phone latency and cost.** 6.6 s median came from the test script, not a phone on LTE; hedges add calls; price doubles Jan 1, 2027 (0.42 → 0.83¢). Measure 30 LTE checks in M2 and log the hedge rate; move to v4.1 once the gold set passes.

# 11. App setup: how the Kitted iOS project is built

*Oct 6, 2026. Senior iOS engineer view for a solo first-time App Store developer. Goal: TestFlight beta Nov 3, submit about Nov 14. Built on `CLAUDE.md`, `demo-app-spec.md`, `speed-and-detail-plan.md`, `extraction-test/` and `inputs/app-store-and-age-rules.md`.*

## 0. Read first: conflicts with `app-build-spec.md`

`app-build-spec.md` (also Oct 6) made different backend choices. You need **one** plan. My call on each conflict:

| Topic | app-build-spec.md | This doc (recommended) | Why |
|---|---|---|---|
| Backend | Cloudflare Worker + D1 | **Supabase** (Auth + Postgres + Edge Functions) | Anonymous auth gives every user a signed ID, so no homemade device IDs or HMAC tokens. Quotas are one atomic SQL function. Sign in with Apple later is one call. |
| Payments | StoreKit 2 direct | **RevenueCat** | The server must know who is Pro. Verifying Apple's signed transactions yourself is the hardest backend code in the project; RevenueCat does it free under $2.5K/month, with Paywalls and Experiments included. |
| Analytics | Homemade `/v1/events` | **PostHog** (1M events/month free) | Funnels and D7 retention for the Dec 7 gate. TelemetryDeck's 100K/month runs out at about 100 daily users. |
| Accounts | None | **Anonymous Supabase user; Sign in with Apple in v1.1** | Everything lives on the phone in v1, so Apple sign-in would restore nothing. Changes CLAUDE.md's "after the 2nd check." |
| Age | 18+ | **18+, US only** | Gemini's terms forbid under-18 apps (`inputs/app-store-and-age-rules.md`). **CLAUDE.md still says "open to 14+"; fix it.** |

Everything else in `app-build-spec.md` (screens, states, design system, re-check merger, fixes) still holds.

## 1. Project structure

**Minimum iOS: 26.0.** On June 7, 2026, 79% of all iPhones (86% of those from the last four years) ran iOS 26. You get Liquid Glass, `DetectLensSmudgeRequest` and the newest SwiftData fixes with zero `#available` branches while learning; iOS 18 would cost about a day of branching and a second OS to test. One exception: `requiredRegulatoryFeatures` (Declared Age Range) needs 26.4, so wrap that call in `#available`. Stay on Xcode 26.3 until launch.

**Targets:** `Kitted`, `KittedTests` (snapshots + app logic), `KittedUITests`. No extensions in v1.

**Packages:** local **`KittedCore`** (pure Swift: reading types, rubric engine, fixes, re-check merger, Rotation, outfit ideas, number check; `swift test` in about 2 s). Third-party: `supabase-swift`, `purchases-ios` (with RevenueCatUI), `posthog-ios`, and `swift-snapshot-testing` in tests only. No Sentry; Xcode Organizer is enough.

**Layout** (git root = the `Kempt/` folder):
```
app/Kitted/
  App/          KittedApp, RootTabView, AppRouter, DeepLink, AppServices (dependency container)
  Features/     Stylist/ (chat, composer, cards)  FitCheck/ (controller, camera, image prep, score card)
                Closet/  Lookbook/  You/  Onboarding/  Paywall/
  Core/         Data/ (@Models, SchemaV1, migration plan, PhotoStore)
                Services/ (KittedAPI + SSE client, Auth, Entitlements, Analytics, Notifications, RubricStore)
                DesignSystem/ (tokens, KCard, ScoreBlock, FixRow, ChipFlow, UndoToast)
  Resources/    rubric.json (bundled fallback), Localizable.xcstrings, PrivacyInfo.xcprivacy, Kitted.storekit
app/KittedCore/ Sources/  Tests/Fixtures/rubric_parity.json
supabase/       config.toml  migrations/*.sql  functions/{fitcheck,snap,explain,chat,item,rc-webhook,delete-account,_shared}
```
**Two Supabase projects** (free plan allows two): `kitted-dev` for Debug, `kitted-prod` for TestFlight and the App Store, picked by xcconfig. The Gemini key lives **only** as a Supabase secret, never in the app, even in Debug (this replaces `app-build-spec.md`'s direct-to-Gemini prototype). Swift 6 with Xcode 26 defaults (MainActor by default).

## 2. Navigation

One `@Observable AppRouter` owns tab, paths, sheet and cover. Views never present things themselves; they ask the router.

```swift
enum AppTab: Hashable { case stylist, closet, lookbook, you }
enum Route: Hashable { case item(UUID), look(UUID), knows, settings, privacy, subscription }
enum SheetRoute: Identifiable { case why(UUID), notQuiteRight(UUID), editItem(UUID), rotationHelp, share(UUID) }
enum CoverRoute: Identifiable { case camera(CameraIntent), paywall(Placement), onboarding }

@Observable final class AppRouter {
  var tab: AppTab = .stylist
  var stylistPath: [Route] = [], closetPath: [Route] = [], lookbookPath: [Route] = [], youPath: [Route] = []
  var sheet: SheetRoute?; var cover: CoverRoute?
  var pendingAttachment: Attachment?            // read once by the Stylist composer
  func styleThis(_ id: UUID) { sheet = nil; stylistPath = []; pendingAttachment = .item(id); tab = .stylist }
  func recheck(_ look: UUID) { sheet = nil; stylistPath = []; tab = .stylist; cover = .camera(.recheck(look)) }
}
```
```swift
TabView(selection: $router.tab) {
  Tab("Stylist", systemImage: "bubble.left.and.bubble.right", value: .stylist) {
    NavigationStack(path: $router.stylistPath) { StylistView().navigationDestination(for: Route.self, destination: RouteView.init) }
  }
  // Closet (hanger), Lookbook (book.closed), You (person.crop.circle): same pattern
}
.sheet(item: $router.sheet, content: SheetView.init)
.fullScreenCover(item: $router.cover, content: CoverView.init)
.onOpenURL(perform: router.open)
```
**Presentation rules:**
- Push for items, looks, settings. Sheets for short tasks (`.presentationDetents([.medium, .large])`). Full-screen covers only for camera, paywall, onboarding, each with an X from the first frame.
- **One modal at a time.** A sheet never opens a sheet. Sheet → paywall: the router clears `sheet`, then sets `cover`.
- No tab-bar minimize or bottom accessory in v1. Glass is automatic on the tab bar; use `.glassEffect()` / `.buttonStyle(.glass)` only on camera controls, never behind text on a photo.

**Deep links:** scheme `kitted://` (`stylist/checkfit`, `look/<id>`, `idea/<outfitID>`, `paywall`). Each notification carries its URL in `userInfo["link"]`; the notification delegate calls `router.open(url)`. The same URLs later serve the Control Center button.

## 3. Data model

**Rule: the phone is the source of truth for everything personal. The server only knows an anonymous user ID, counts, money and corrections.**

Make the models **CloudKit-ready now** so iCloud sync in v1.1 is a switch, not a migration: defaults on every property, optional relationships, no `@Attribute(.unique)`. Use `VersionedSchema` V1 + a migration plan from day 1.

| @Model | Key fields | Relationships |
|---|---|---|
| UserProfile (one) | birthYear, heightCm?, build, fitPreference, styles `[String: Double]`, boldness, budget?, dressCode?, lastOccasion, timeZoneID, consentVersion, consentAt?, onboardingStep, paywallShownAt?, ideaTime?, ideasUnopened | |
| Fact | key, value, source (told/fitCheck/guess), createdAt, deletedAt? (tombstone, never re-learned) | |
| ClosetItem | id, slot, type, color, pattern, leg?, fit?, attributes (Codable garment), confirmedFields `[String]`, photoFile?, thumbFile?, isPhotographed, source, starterID?, wornCount, lastWornAt?, deletedAt? | looks [FitCheck]? |
| FitCheck (a Look) | id, createdAt, dayKey, photoFile, thumbFile, imageHash (`#Index`), occasion, status, **result: ScoreResult?**, explanation?, rubricVersion, isPartial, snapState, recheckUsed, serverCheckID?, isFavorite | readings [Reading]?, parent FitCheck?, items [ClosetItem]?, corrections [Correction]? |
| Reading | id, imageHash, kind (full/lower/recheckMerged/corrected), json `Data`, model, promptVersion, schemaVersion, latencyMs | fitCheck? **Never edited**; changes create a new Reading |
| Correction | kind, slot, field, oldValue, newValue, userScore?, scoreBefore, scoreAfter, sentAt? | fitCheck? |
| Plan / Move | Plan: createdAt, source (onboarding/weekly). Move: title, kind, done, link (a `kitted://` URL) | plan → moves |
| Outfit, WearLog | Outfit: occasion, summary, source, isSaved. WearLog: dayKey | items, fitCheck?, outfit? |
| ChatMessage | createdAt, role, kind (text/photo/card), text?, cardType, chips | fitCheck?, outfit?, item? |
| UsageCounter | dayKey, checks, questions, items, serverRemaining | Local mirror for the UI only. The server decides. |

`ScoreResult` is a **Codable struct, not a model** (overall, raw, sub-scores, occasionAdj, rulesFired, credits, notRated, fixes, advice), always recomputable from Reading + occasion + profile + rubric.

**Images:** `Application Support/Photos/<uuid>.jpg` holds the *prepared* copy (face cropped or blurred, 1024 px, JPEG 0.8, about 150 KB) plus a 400 px thumbnail. SwiftData stores filenames only, so "Delete all photos" is a folder delete. The original full-face image is never written to disk. Files stay in device backups.

## 4. The fit-check pipeline

```
capture → prep (on phone) → cache? → upload → stream reading → score (Swift) → card → explain (stream) → save
```
1. **Prep (about 150 ms):** fix orientation, strip metadata, SHA-256 of the original bytes. Vision: `DetectHumanBodyPoseRequest` (framing, crop, neck line), `DetectHumanRectanglesRequest` (people count), `DetectFaceRectanglesRequest` (blur faces the crop missed, and bystanders), brightness via `CIAreaAverage`, `DetectLensSmudgeRequest`. Crop to the person, cut at the neck, resize to 1024.
2. **Nudity: an honest gap.** `SCSensitivityAnalyzer` only runs if the user turned on Sensitive Content Warnings or Communication Safety, so for most users it's off. v1 uses it when available and otherwise relies on the model's `scene.clothed == "partial"` (no score, nothing saved anywhere). **The spec's "blocked on the device before upload" can't be promised; soften the consent and privacy wording.** A custom Core ML classifier is a v1.1 option.
3. **Cache:** a `Reading(kind: .full)` with this hash skips the network: same photo, same score, no quota.
4. **Upload:** `POST /functions/v1/fitcheck` with the Supabase JWT and `{image, kind, tz}`. The reply is Server-Sent Events, read with `URLSession.bytes(for:)`:
```swift
enum FitCheckEvent { case stage(String), reading(Data), meta(checkID: String, remaining: Quota), failed(code: String, counted: Bool) }
enum FitCheckState { case idle, preparing, uploading, reading(stage: String), scored(ScoreResult), explaining, done,
                     unreadable, notClothed, limitReached, offline, failed(String) }
```
The function emits `stage` the first time each garment category appears in Gemini's streamed JSON, which drives "Reading your top… your shoes…".
5. **Score on the phone:** `RubricEngine.score(reading, occasion, styles, boldness, rubric)` (under 10 ms); `FixEngine` predicts each fix's gain by re-scoring a copy of the reading with the fix applied. The card shows at once.
6. **Explain:** `POST /explain` with the result summary only (no photo), streamed; `NumberCheck` rejects any number not in the result and keeps the template sentence.
7. **Re-check:** the server's `checks` row allows 1 within 30 min. `RecheckMerger` keeps the first reading for every field the fixes didn't touch (`app-build-spec.md` §2.5), so noise can't lower the score.
8. **Partial + shoe snap:** partial = `shoes_visible == false` or `framing == "upper_only"`. `POST /snap` (needs the checkID, once per check, never counted) reads shoes + hem only; merge and re-score in place.

**Timeouts: one number must change.** The speed plan's 8 s deadline assumed schema v4. The **locked** setup (v3, thinking off) measured **6.6 s median, 8.7 s p90**, so 8 s would kill over 10% of checks. Use a hedge (one identical backup request) at **9 s** without a first token, abort at **14 s**, app timeout 16 s; one jittered retry on 429/5xx. Failures return `counted: false`. Tighten to 5 s / 8 s if v4.1 passes the gold set.

**Keeping Swift and Python identical:**
- Move every number and table from `rubric.py` into `rubric.json`, read by both.
- `extraction-test/export_fixtures.py` runs the roughly 1,000 saved v3 readings in `results/*/raw_results.json` through `rubric.py` for 9 occasions × 4 style profiles and writes input → `{overall, raw_score, subscores, rules_fired, credits, not_rated}` to `rubric_parity.json`. Deep-copy inputs first: `rubric.py` edits garments in place for leg aliases.
- A parameterized Swift Testing test matches `overall` and `rules_fired` exactly, `raw_score` within 0.001. Port the rounding as `floor(x*2+0.5)/2` and `floor(x+0.5)`, never `.rounded()`.
- A remote `rubric.json` is used only if its `engine` number matches the app's. Each FitCheck stores its `rubricVersion`; old checks are never silently re-scored.

## 5. Backend (Supabase)

**Tables** (row-level security on all; the app reads only its own `usage_daily` and `entitlements`; Edge Functions write everything):

| Table | Columns |
|---|---|
| profiles | user_id, tz, tz_changed_at, consent_version, created_at |
| usage_daily | user_id, day_key, checks, questions, items |
| checks | id, user_id, created_at, recheck_left, snap_left, expires_at |
| entitlements | user_id, pro_until, product, updated_at (written by `rc-webhook`) |
| call_log | user_id, route, ms, tokens_in, tokens_out, tokens_thought, model_version, error, created_at (**no images, no text**) |
| spend_daily | day (UTC), cents |
| corrections | field, old_value, new_value, slot JSON, rubric_version (no image, no user text) |
| app_config | daily_cap_cents (300), kill (bool), prices per million tokens, min_app_build, rubric JSON |

**Edge Functions:** `fitcheck`, `snap`, `explain`, `chat`, `item`, `rc-webhook`, `delete-account`, sharing `_shared/` (user from JWT, kill switch, reserve/refund, Gemini call with deadline and hedge, cost log). Limits fit: 2 s CPU (waiting on Google doesn't count), 150 s wall clock, 500K calls/month free.

**Quotas, counted only on success:**
```sql
create function reserve(kind text, tz text) returns int language plpgsql security definer as $$
declare d date := ((now() at time zone tz) - interval '4 hours')::date; lim int; used int;
begin
  lim := case when exists(select 1 from entitlements where user_id = auth.uid() and pro_until > now())
              then (case kind when 'check' then 10 else 50 end) else (case kind when 'check' then 1 else 5 end) end;
  insert into usage_daily(user_id, day_key) values (auth.uid(), d) on conflict do nothing;
  update usage_daily set checks = checks + (kind='check')::int, questions = questions + (kind='question')::int
   where user_id = auth.uid() and day_key = d
     and (case kind when 'check' then checks else questions end) < lim
  returning case kind when 'check' then checks else questions end into used;
  if used is null then raise exception 'limit'; end if;
  return lim - used;
end $$;
```
`refund()` undoes it if Gemini fails. **4 am reset** = the `- interval '4 hours'` on local time. `tz` lives on `profiles` and may change once per 24 h, so time-zone hopping can't mint checks.

**Kill switch:** each call first reads `app_config.kill` and today's `spend_daily`. Above $3/day, `fitcheck` and `chat` return `busy, counted:false` (closet, history and ideas still work; they're local). After each call, add `usageMetadata` tokens × the `app_config` price. **Update that price on Jan 1, 2027**, when Google doubles it. A $10 Google Cloud budget alert is the second fence.

**Abuse:** anonymous sign-ins default to 30/hour per IP; Supabase suggests CAPTCHA, which is awkward natively. Lower it to 10/hour and let the kill switch be the ceiling. `supabase-swift` keeps the session in the Keychain, which survives reinstalls, so reinstalling doesn't reset free checks. App Attest comes in v1.1.

**Gotcha:** free projects pause after 7 inactive days. Beta use keeps prod awake.

## 6. Payments, analytics, notifications

**RevenueCat:**
- One entitlement, `pro`. Offering `default`: `kitted_pro_annual` ($29.99, 14-day free trial introductory offer, preselected) and `kitted_pro_monthly` ($5.99). Founding $19.99 = an App Store **offer code** on the annual plan, redeemed with `.offerCodeRedemption(isPresented:)`.
- `Purchases.configure(withAPIKey:appUserID:)` with the **Supabase user ID**, so the webhook maps straight to `entitlements`.
- `PaywallView()` in the paywall cover, built in RevenueCat's editor with Close and "Continue free" visible at once, price, trial length, renewal terms, Terms, Privacy and Restore (3.1.2).
- The UI reads `customerInfo.entitlements["pro"]?.isActive`; the server trusts only the webhook. Use a local `Kitted.storekit` file until App Store Connect products exist.

**Notifications: all 3 are local**, so no APNs or Push capability.
- Daily idea: on each open, schedule the next 3 days from the closet. Stop after 3 unopened.
- Fit check ready: fired when a check finishes in the background (`beginBackgroundTask` keeps the stream alive).
- Trial ending: if `periodType == .trial`, schedule at `expirationDate − 2 days`, refreshed on each open.

**PostHog:** autocapture, replay and person profiles off; a random per-install ID (not the Supabase ID), so the privacy label says "not linked." Never photos, chat text or exact ages. Events (spec §12): `onboarding_step{step}`, `consent_given`, `fitcheck_started{source}`, `fitcheck_scored{score, partial, ms, cached}`, `fitcheck_partial{missing}`, `fitcheck_failed{code}`, `recheck_done`, `score_delta{delta}`, `shoe_snap_done`, `shoe_snap_skipped`, `shoes_picked_from_closet`, `disagree_tapped{kind}`, `item_added{source}`, `dupe_prompt{answer}`, `outfit_idea_wore`, `push_opened{kind}`, `limit_hit{kind}`, `paywall_shown{placement}`, `trial_started`, `converted`, `share_card_exported`. Take trial and conversion truth from RevenueCat's dashboard; the client events are for funnels.

## 7. Testing and release

**Unit tests (KittedCore, Swift Testing):** rubric parity (the most important test), FixEngine (a free fix whenever any fix exists), RecheckMerger (a "no change" pair keeps its score; a cuff pair goes up), Rotation, the 4 am day key (including the Nov 1 DST change), NumberCheck, the SSE parser on recorded streams.

**Snapshot tests:** the fit-check card in every state × light/dark/AX5, plus onboarding. Check the paywall by hand.

**UI tests** (launch args `-mockAPI -resetData`): onboarding reaches the first check in 6 taps via "Show me an example"; "Style this item" lands in Stylist with the attachment; "Delete all my data" empties the app.

**By hand:** 30 LTE checks from your phone (target median ≤ 7 s shutter to score), a VoiceOver pass, the kill switch at a $0.01 cap.

**TestFlight:** internal testers need no review; external testers need Beta App Review, so upload by **Oct 31**. Start the $99 Developer Program and the Paid Apps Agreement (bank, tax) now; both take days.

**App Review risks:**

| Guideline | Risk | Handling |
|---|---|---|
| 5.1.2(i) | Photos sent to a third-party AI without explicit permission | Consent names Google Gemini, lists what's sent (outfit and closet photos, questions), mentions Google's 55-day abuse log, has "Not now," stores `consentVersion` |
| 5.1.1(v) | Account deletion | No user-created account in v1, but "Delete all my data" also calls `delete-account` (removes the anonymous user and rows). With Sign in with Apple, also revoke the Apple token |
| 3.1.2 | Unclear subscription terms | Paywall contents above; no timers |
| 1.2 | "Hot-or-not" rating of people | No user-to-user content; faces cropped; clothes-only; say so in review notes |
| 2.1 | Reviewer can't test | "Show me an example" needs no camera or quota |
| Age | Gemini 18+ terms | Birth-year gate + Declared Age Range, rating overridden to 18+, US only |

## 8. Build order (solo, about 3–4 focused hours a day)

| Week | Build | Done when |
|---|---|---|
| **1 · Oct 6–12** | Developer account + Paid Apps Agreement; git; Xcode project, KittedCore, rubric port + parity tests (Claude writes `export_fixtures.py`); Supabase dev project, anonymous sign-in, `fitcheck` (non-streaming first); tab shell + router + design tokens; SwiftData V1 | A library photo returns a real score on your phone; parity tests green |
| **2 · Oct 13–19** | Camera + framing guide + 3-2-1; image prep (crop, neck cut, blur, quality); SSE streaming + staged loading; fit-check card with all states; hash cache; partial label | 10 propped + 10 mirror checks in your room |
| **3 · Oct 20–26** | Re-check merger, shoe snap, Not quite right?, explain; quotas + 4 am reset + kill switch + `call_log`; Closet auto-add + Undo + grid + detail; "What should I wear?" (code only) | Free limit enforced by the server; a cuff pair goes up |
| **4 · Oct 27–Nov 2** | Onboarding (age gate, consent, 6 taps); Lookbook + You + delete data; RevenueCat paywall + Limit card; local notifications; PostHog; prod project; **upload Oct 31** | External TestFlight approved |
| **5 · Nov 3–9** | Beta. `chat` (Ask a question); Declared Age Range; fix top beta bugs; LTE timing | 30 testers in, no crash in Organizer |
| **6 · Nov 10–14** | Accessibility pass, privacy label + `PrivacyInfo.xcprivacy`, screenshots, review notes, **submit Nov 14** | Submitted |

**If behind, cut in this order:** (1) daily idea notification, (2) multi-select add, (3) share card (screen-record instead), (4) next best buy / "+N fits" for items he doesn't own, (5) Ask a question becomes canned starter answers, (6) snapshot tests, (7) remote rubric fetch (ship rubric changes in app updates). **If week 2 slips past Oct 21, cut 1–3 at once.**

**Never cut:** consent, the age gate, partial labels, Not quite right?, Delete all my data, the server proxy with quotas and kill switch, and the parity tests.

## Sources
- Apple, App Store usage (iOS 26 at 79% / 86%, June 7, 2026): https://developer.apple.com/support/app-store/
- Apple, App Review Guidelines (5.1.1(v), 5.1.2(i), 1.2, 3.1.2): https://developer.apple.com/app-store/review/guidelines/
- Apple, SwiftData + CloudKit schema limits: https://developer.apple.com/documentation/swiftdata/syncing-model-data-across-a-persons-devices
- Apple, TabView and `Tab`: https://developer.apple.com/documentation/swiftui/tabview
- Apple, `glassEffect(_:in:)` (iOS 26): https://developer.apple.com/documentation/swiftui/view/glasseffect(_:in:)
- Apple, `DetectLensSmudgeRequest` (iOS 26, A14+): https://developer.apple.com/documentation/vision/detectlenssmudgerequest
- Apple, `SCSensitivityAnalyzer.analysisPolicy`: https://developer.apple.com/documentation/sensitivecontentanalysis/scsensitivityanalyzer/analysispolicy
- Apple HIG, Tab bars and Sheets: https://developer.apple.com/design/human-interface-guidelines/tab-bars · https://developer.apple.com/design/human-interface-guidelines/sheets
- Supabase, Anonymous sign-ins (rate limit, CAPTCHA, linking): https://supabase.com/docs/guides/auth/auth-anonymous
- Supabase, Identity linking with ID tokens: https://supabase.com/docs/guides/auth/auth-identity-linking
- Supabase, Edge Function limits: https://supabase.com/docs/guides/functions/limits
- Supabase, Free project pausing: https://supabase.com/docs/guides/platform/free-project-pausing
- Google, Gemini structured output (streamed JSON chunks): https://ai.google.dev/gemini-api/docs/structured-output
- Google, Gemini thinking (`thinking_level`; keep the exact request `run_test.py` sends): https://ai.google.dev/gemini-api/docs/thinking
- RevenueCat, Displaying paywalls: https://www.revenuecat.com/docs/tools/paywalls/displaying-paywalls
- RevenueCat, Pricing (free to $2.5K/month, all features): https://www.revenuecat.com/pricing/
- PostHog free tier (1M events/month): https://schematichq.com/blog/posthog-pricing
- TelemetryDeck free tier (100K signals): https://telemetrydeck.com/blog/pricing-update-2026/
- Project files: `extraction-test/results/lockin-oct6/RESULT.md` (6.6 s / 8.7 s), `inputs/app-store-and-age-rules.md` (Gemini 18+ terms, Texas, consent text), `app-build-spec.md`

# Kitted: v1 build spec (iOS)

*Oct 6, 2026. The engineering plan for the TestFlight beta on **Tue Nov 3**. Product decisions come from `CLAUDE.md` and `demo-app-spec.md`, and this doc doesn't reopen them. Where this doc and those two disagree, §0 says so and gives the decision. Scoring follows `speed-and-detail-plan.md` and `extraction-test/` (v4 answer format, rubric v3.1).*

**How to read this:** §1–3 are the plumbing, §4 lists every screen, §5–6 are the data and the look, §7 is the calendar, and §8 covers the ways this can get rejected or go wrong.

---

## 0. Decisions that change or sharpen the existing docs (read first)

| # | Decision | Why |
|---|---|---|
| D1 | **The app is 18+ at launch. The onboarding age gate blocks anyone under 18, not under 14.** | Google's Gemini API terms (updated Apr 28, 2026) say: "You must be 18 years of age or older to use the APIs" and the API may not be used in an app "directed towards or … likely to be accessed by individuals under the age of 18." That conflicts with CLAUDE.md's "open to 14+". The core audience (18–30) is unaffected. The age limit lives in `rubric.json → config.minAge`, so it can be lowered later if the provider changes. Search results suggest Vertex AI has a similar clause, so check before assuming it's a way around this. |
| D2 | **No accounts, no server database of users, no Sign in with Apple in v1.** Everything lives on the phone (SwiftData). The server is a stateless proxy plus per-device counters. | "Photos stay on the device" becomes true in the simplest way. Without accounts, Guideline 5.1.1(v) (in-app account deletion) doesn't apply, so a "Delete all my data" button is enough. Sign in with Apple and iCloud sync move to v1.1. *(Replaces spec §3's "SIWA after the 2nd check" and §12's Supabase backend.)* |
| D3 | **Proxy = a Cloudflare Worker (free plan) + D1 (its free SQLite database).** Not Supabase. | It costs $0, has no cold starts on the hot path, streams responses, and comes down to about 300 lines of TypeScript. |
| D4 | **Payments = StoreKit 2 directly, using Apple's `SubscriptionStoreView`. No RevenueCat.** | That's zero dependencies, and Apple's view already includes the price, trial, terms and restore text that Guideline 3.1.2 requires. *(Replaces spec §12.)* |
| D5 | **No analytics or crash SDKs.** The proxy counts check, latency and failure events by itself. The app sends a small batch of the ~15 client events (onboarding_step, paywall_shown…) to `/v1/events`. Crashes come from Xcode Organizer and TestFlight. | Keeps the Swift Package count at 0 and keeps the privacy label short. |
| D6 | **The face is cropped out (from the neck down) before upload, with a blur as backup.** | Cutting the face off using body-pose joints is more reliable than detecting the face and blurring it. It also gives the clothes more pixels. **This has to be tested** (§8 R5), because every test so far used uncropped photos. |
| D7 | **All 3 notifications are local** (`UNUserNotificationCenter`). No push server and no APNs. | The daily idea is computed from the closet on the phone. "Fit check ready" fires when the check finishes while the app is in the background. The trial reminder is scheduled from the StoreKit transaction. |
| D9 | **Lock-in result (Oct 6): ship thinking off with the original v3 answer format for now. The short v4.1 format is the expected successor, pending the gold set.** Keep the reading format and the AI provider behind one `ReadingSource` interface that outputs the v3-shaped extraction the rubric reads. A format or provider switch is then a config change, and the app's own storage can still use the v4 slot types. The AI provider itself is under review because of Gemini's 18+ terms (`inputs/ai-provider-research.md`). | v3 + thinking off passed every quality rule at 6.6 s median / 0.42¢. v4.1 is 3.9 s / 0.23¢ and stable, but reads 5 details differently from today's setup, and only truth labels can say which is right (`extraction-test/results/lockin-oct6/RESULT.md`). |
| D8 | **The offline photo queue stays cut** (spec §2). Offline means "Fit checks need a connection" plus Retry. | It keeps the beta smaller. *(brainstorm/03 §2.6 had a queue; the spec cut it.)* |

---

## 1. Stack and project setup

### 1.1 Platform choices
| Item | Decision | Why |
|---|---|---|
| Minimum iOS | **iOS 26.0** | One code path, with no `if #available` branches while you're learning. It gives you the Liquid Glass tab bar and controls for free, the newest SwiftUI and SwiftData APIs, and Vision's iOS 26 additions (e.g. `DetectLensSmudgeRequest`). iOS 26 runs on iPhone 11 / SE 2 and newer (2019+). Guys 18–30 update quickly, and by beta day iOS 26 will have been out for over a year. Check Apple's App Store adoption page before submitting; if iOS 26+ is somehow under ~80%, drop to iOS 18 (that costs about 1 day of `#available` work). |
| Xcode | **26.3 (installed). Don't upgrade Xcode before launch.** | It builds with the iOS 26 SDK, which App Store Connect accepts. An upgrade mid-sprint can cost a day. |
| Language | Swift 6, keeping the Xcode 26 template defaults ("Approachable Concurrency", default actor isolation = MainActor) | The UI code is MainActor by default, which is easy. The pure scoring code is `nonisolated` and `Sendable`. |
| UI | **SwiftUI + Observation** (`@Observable` classes, `@State`, `@Environment`) | No view models for simple screens. One `@Observable` controller per complex flow (camera, fit check, onboarding). |
| Storage | **SwiftData** for all records. **Photos as JPEG files** in `Application Support/Photos/`, with only the filename in SwiftData. | It keeps the database small and fast. Files get `FileProtectionType.completeUntilFirstUserAuthentication` and are included in device backups (so a new phone keeps them). |
| Settings and flags | `@AppStorage` for small preferences. **Keychain** for the device ID, the App Attest key ID and the "age-blocked" flag (it survives a reinstall). | |
| Swift packages | **None from third parties.** One *local* package, `KittedCore` (your own code). | `KittedCore` has no UIKit/SwiftUI, so its tests run in about 2 s with `swift test`. |
| Bundle ID | `com.trykitted.kitted` (matches the domain you're registering) | |
| Capabilities | App Attest, In-App Purchase. **Not** Push, Background Modes or iCloud. | Fewer capabilities, fewer review questions. |
| Info.plist | `NSCameraUsageDescription` = "Kitted uses your camera to photograph your outfit." No photo-library key (`PhotosPicker` doesn't need one). | |
| Privacy manifest | `PrivacyInfo.xcprivacy`: UserDefaults reason `CA92.1`, plus the collected data types from §8 R2. | Required for App Store uploads. |

### 1.2 Folder layout
The git repo root is the whole `Kempt/` folder (docs + test scripts + app + proxy).
```
Kempt/
  CLAUDE.md, *.md docs, extraction-test/, rubric/ …   (as today)
  app/
    Kitted.xcodeproj
    Config/            Base.xcconfig (tracked) · Secrets.xcconfig (UNTRACKED) · Secrets.example.xcconfig (tracked)
    Kitted/
      App/             KittedApp.swift, RootView (tab bar), AppEnvironment (services)
      DesignSystem/    Tokens (color, type, spacing), components (§6)
      Features/
        Onboarding/  Stylist/  Camera/  FitCheck/  Closet/  Lookbook/  You/  Paywall/
      Services/        PhotoStore, ImagePrep (Vision), StylistAPI (direct | proxy), Cache,
                       Entitlements (StoreKit), Notifications, Quota, Events
      Data/            SwiftData @Model types (§5), ModelContainer setup, sample data for previews
      Resources/       Assets.xcassets, rubric.json, onboarding look photos, demo photo + reading,
                       Localizable.xcstrings, PrivacyInfo.xcprivacy, Kitted.storekit
    KittedCore/        local Swift package
      Sources/KittedCore/  V4 (Codable types + adapter), Rubric (engine + RubricConfig),
                           Fixes, Recheck (anchor merge), Rotation, OutfitIdeas, NumberCheck
      Tests/KittedCoreTests/  RubricParityTests (+ Fixtures/rubric_parity.json), AdapterTests, …
    KittedTests/  KittedUITests/
  proxy/               Cloudflare Worker (TypeScript): src/index.ts, schema/, wrangler.toml, migrations/
```

### 1.3 Git and secrets
- Run `git init` at `Kempt/`. Push to a **private** GitHub repo. Commit the current docs and test scripts first.
- **`.gitignore`** (the rules that matter):
```
# secrets: never committed
app/Config/Secrets.xcconfig
proxy/.dev.vars
.env
*.p8
*.p12
*.cer
*.mobileprovision
# Xcode / Swift
xcuserdata/
*.xcuserstate
DerivedData/
build/
.build/
.swiftpm/
*.xcarchive
*.ipa
*.dSYM.zip
# Worker
proxy/node_modules/
proxy/.wrangler/
# private photos (people's images never go to GitHub)
inputs/
extraction-test/results/**/*.jpg
# misc
.DS_Store
__pycache__/
*.pyc
```
- **A pre-commit hook** (`.git/hooks/pre-commit`, 3 lines) refuses any commit whose staged diff contains `AIza`, the prefix every Google API key starts with.
- **A Release build-phase guard:** a "Run Script" phase fails the build if the built Info.plist contains `AIza`. That way, a TestFlight build can never carry the key.
- **The key itself:** the speed plan already says to delete the old key and create a new one. Restrict the new key to the Generative Language API, keep billing on (§8 R1), and set a Cloud Billing budget alert at $10.

---

## 2. Architecture

### 2.1 The fit-check pipeline (in the app)
```
Camera / mirror / library photo
  │ 1. ImagePrep (on the phone, ~150 ms): fix orientation → strip metadata → SHA-256 of the ORIGINAL bytes
  │ 2. Cache lookup by hash ──hit──► reuse the Reading (no API call, instant)
  │ 3. Quality + privacy (Vision): person count, body pose, brightness, blur, lens smudge,
  │    nudity check where available → crop to the person, face cut off → 1024 px long edge, JPEG q0.8
  │ 4. StylistAPI.read(kind: .full) → stream; stages fire as "top", "outer", "bottom", "shoes" keys arrive
  │ 5. V4 decode → V4Adapter.toExtraction()  (Swift port of v4.py `to_extraction`)
  │ 6. RubricEngine.score(extraction, occasion, styles, boldness, config: rubric.json)   (< 10 ms)
  │ 7. FixEngine: picks 2–3 fixes and predicts each gain by RE-SCORING the reading with that fix applied
  │ 8. Show the card: score + label + fixes appear at once (template sentence from the fired rules)
  │ 9. StylistAPI.explain(result summary, no photo) → stream 2–4 sentences → NumberCheck → replace the template
  └ 10. Save: FitCheck + Reading + auto-added ClosetItems (Undo toast); log events
```
- **One controller, `FitCheckController` (`@Observable`), with explicit states:** `idle → preparing → uploading → reading(stage) → scored → explaining → done`, plus the branches `unreadable`, `notFullyClothed`, `failed(reason)`, `limitReached` and `offline`. Each view switches on this state, so no screen can be "in between."
- **Occasion:** the chips appear the moment the photo is taken, with the last used occasion preselected (default Everyday). The vision call doesn't depend on the occasion, so it never waits for the tap. Changing the chip afterwards re-scores in code, instantly and for free.
- **Occasion chips → rubric keys:** Everyday→`everyday` · Class→`class` · Work→`work_casual` (or `work` if You → Dress code = business casual) · Date / night out→`date` · Interview→`interview` · Event→`event` · **More…** → Gym, Home, Wedding (formal/casual), Interview (corporate/tech).
- **Styles:** each onboarding look photo is tagged with one of the 8 rubric style keys. Up to 3 taps become equal weights (e.g. `{minimalist: 0.5, streetwear: 0.5}`). "Not sure" = no styles, which falls back to `DEFAULT_BAND`.

### 2.2 Rubric engine in Swift (a port of `rubric.py` v3.1)
- **The rule logic is Swift code. Every number, list and table is data in `rubric.json`.** That covers FORMALITY, OCCASION_TARGET, STYLE_BANDS, DEFAULT_BAND, NEUTRALS, MUTED, ALWAYS_BRIGHT, HUE_DEPENDS, FAMILY, BASELINE, CREDITS, the sub-score weights (0.40/0.30/0.30), the 2.0 and 1.2 multipliers, every rule's penalty amount, the clamps (3–10), the `enabled` flag per rule, and the fix templates.
- Shape: `{ "version": "3.1.0", "engine": 3, "minAppBuild": 1, "config": {minAge, freeChecks, …}, "tables": {…}, "rules": {"F4_pooling": {"enabled": true, "amount": 1.0, "streetAmount": 0.5, …}}, "fixes": {…} }`.
- **Port it exactly, including the quirks.** Round with `floor(x*2 + 0.5) / 2` and use `floor(x + 0.5)` for `nearest`, never Swift's default rounding helpers. Keep `max(1, min(10, …))` and the halfway credit scaling (R4).
- **The parity test is the most important test in the app.** A small Python script (`extraction-test/export_fixtures.py`, to be written) runs every saved reading in `results/*/raw_results.json` through `rubric.py` and writes `{reading, occasion, styles, boldness} → {overall, raw_score, rules_fired, credits}` to `KittedCore/Tests/Fixtures/rubric_parity.json`. `RubricParityTests` must match **every** case: `overall` exactly, `raw_score` within 0.001, and the same `rules_fired`. Re-run it after every rubric change.
- **One numbers file for Python and Swift:** next, `rubric.py` should load the same `rubric.json` instead of its constants, so the numbers never fork. *(Claude can do this refactor; it isn't done yet.)*
- **Remote updates:** the app bundles `rubric.json`. At launch it calls `GET /v1/rubric` (with an ETag) and uses the remote copy only if `engine` equals the app's engine number and `minAppBuild` ≤ its build. Each FitCheck stores the `rubricVersion` it was scored with. **Old checks are never silently re-scored**, so history stays stable. Before publishing a new rubric: run `rescore.py` + the Swift parity test with the new file.

### 2.3 Fixes (code-picked)
- Each rule in `rubric.json → fixes` has 1–4 templates in tiers: `adjust` (free) → `swapFromCloset` → `tailor` → `buy`. Each template lists the reading fields it changes (e.g. cuff → `bottom.hem = cuffed`).
- **The predicted gain is real:** the app applies that field change to a copy of the reading and re-scores it. "6.5 → 7.5 if you cuff" is the engine's own number.
- Selection: rank by gain ÷ effort tier, keep fixes with gain ≥ 0.5, take at most 3, include **≥1 free** fix, include **≤1 buy** fix and only if the score can't reach 7 otherwise. `swapFromCloset` is offered only when a matching ClosetItem exists ("Swap to your white sneakers").
- If nothing gains ≥ 0.5: "This is dialed in. Nothing to fix" plus the rubric's `next level` advice.

### 2.4 Same photo → same score
- **Key = SHA-256 of the original image bytes.** For a library photo, `PhotosPicker` → `loadTransferable(type: Data.self)` gives the same bytes every time. Camera shots are unique, so they never collide.
- **Value = the saved `Reading`** (the raw v4 JSON plus the model, prompt and schema versions). The score is always recomputed from reading + occasion + profile + rubric, which is deterministic.
- **No "looks similar" matching** (perceptual hashes). A before/after cuff pair would look "similar" and wrongly reuse the old reading.
- A cache hit costs no free check and makes no network call.

### 2.5 The anchored re-check
- The **Re-check** action on a card (free, once, within 30 min) opens the camera with the same framing and occasion.
- **Beta behavior (no new experiment needed):** one normal v4 reading of the new photo, then `RecheckMerger` in KittedCore:
  1. **Target fields** = every field touched by the fixes the card suggested (cuff → `bottom.hem`; tuck → `top.hem`; roll sleeves → `top.sleeve` / `outer[].sleeve`; swap shoes → the `shoes` slot; remove/add layer → `outer`; swap top/bottom → that slot).
  2. For each slot: if the garment `type` and `color` match the first reading, **keep the first reading's values for every non-target field**, and take the new values only for target fields. If the type or color changed, it's a swap, so take the whole new slot.
  3. A **new problem** outside the target fields counts only if the new reading marks it `sure: clear`. The card then names it ("New: your shirt came untucked"). Otherwise the old value stays.
  4. Re-score → show "6.0 → 6.5 ↑0.5 after 1 fix." The score can't drop because of noise.
- **Later (only if experiment X11 passes):** replace step 1's reading with the two-image "what changed?" call. The merger code stays the same.
- **Closet anchoring** uses the same idea. When a slot matches a *confirmed* ClosetItem (same slot, type and color family), the item's confirmed fields (e.g. `leg = straight`) override the reading.

### 2.6 Partial checks and the shoe snap
- **Partial** = `scene.feet == cut_off` or `framing == upper_only` (the rubric's `not_rated`). The card shows the text label "Partial check: shoes not included" or "Partial check: top only."
- **Snap your shoes / Snap your bottom half:** a second, smaller call with `schema_lower.json` = `{feet, bottom (the full v4 bottom slot, nullable), shoes}`. One schema covers both cases:
  - **shoe snap:** merge only `shoes` + `bottom.hem` into the first reading
  - **bottom-half snap:** merge the whole `bottom` + `shoes`
- Re-score in place: "8.0 → 7.5 · Full check ✓" with the reason. The snap never uses a free check or the re-check.
- **Pick from Closet:** the stored shoe attributes are used without an API call. The hem stays unknown, so hem rules are skipped and the label reads "Full check (shoes from your closet)."
- **Camera instruction until X12 settles the angle:** "Hold your phone at knee height, pointed at your feet." Knee height avoids the straight-down angle that can make a clean hem look like pooling.

---

## 3. The API key problem

### 3.1 Two transports behind one interface
`StylistAPI` is a protocol with `read(image, kind)`, `explain(summary)`, `ask(messages)`, `readItem(image)` and `fetchRubric()`. It has two implementations:

| | `DirectGeminiAPI` (prototype, M1–M3) | `ProxyAPI` (beta and later, M4 on) |
|---|---|---|
| Where it runs | Debug builds on **your own phone/simulator only** | Every TestFlight and App Store build |
| Key | `GEMINI_DEV_KEY` in the untracked `Secrets.xcconfig` → Info.plist → read only inside `#if DEBUG` | Stored only in the Worker as a secret (`wrangler secret put GEMINI_KEY`) |
| Limits | None (it's you) | Per-device daily limits + a global spending kill-switch |
| Removed when | The Release configuration doesn't include Secrets.xcconfig at all. The build guard (§1.3) is the backstop. | — |

The Gemini request is **byte-for-byte what `run_test.py --format v4 --thinking off` sends**, so the app gets the tested behavior. If either side changes, change both.

### 3.2 The Gemini request (sent by the proxy, or directly in the prototype)
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:streamGenerateContent?alt=sse
{ "contents": [{ "parts": [ {"text": <prompt_v4.txt>},
                            {"inline_data": {"mime_type": "image/jpeg", "data": <base64 1024px JPEG>}} ] }],
  "generationConfig": { "temperature": 0, "responseMimeType": "application/json",
                        "responseSchema": <schema_v4.json>, "thinkingConfig": {"thinkingBudget": 0},
                        "maxOutputTokens": 1500 } }
```
- `maxOutputTokens` only guards against a runaway answer. If `finishReason == MAX_TOKENS`, treat the call as failed.
- Log `thoughtsTokenCount`, and alert if it's above 0 on more than 5% of calls (S1).
- Pin the model name. Log the model version that comes back on every call (Google can change the model under you).

### 3.3 The proxy (Cloudflare Worker + D1)
**App → proxy request shape:**
```
POST https://api.trykitted.com/v1/check          (workers.dev URL until the domain exists)
Headers: X-Device: <keychain UUID>  X-Attest-Key: <App Attest key id>  X-Assertion: <base64>
         X-App-Build: 12  X-TZ: America/New_York
Body:    { "kind": "full" | "recheck" | "lower", "image": "<base64 jpeg>",
           "checkToken": "<from the first check; required for recheck/lower>", "ts": 1791300000 }
Reply:   text/event-stream
         event: stage    data: {"slot":"top"}            (as each v4 key arrives)
         event: reading  data: {<v4 JSON>}
         event: meta     data: {"checkToken":"…","remaining":{"checks":0,"questions":5},"model":"…","ms":4210}
         event: error    data: {"code":"timeout|busy|limit|unreadable","counted":false}
```
**Other routes:**
- `POST /v1/explain` (SSE text, not counted)
- `POST /v1/ask` (SSE text, counts 1 question)
- `POST /v1/item` (one-garment reading for closet adds)
- `GET /v1/rubric`
- `GET /v1/health` (warms up the connection)
- `POST /v1/attest` (one-time App Attest registration)
- `POST /v1/events`
- `POST /v1/feedback` (corrections: field names and values only, never photos)

**Deadline and retry (S6), for every vision call:**
| Time | Action |
|---|---|
| t = 0 | Attempt 1 starts. |
| On 408, 429 or 5xx | If ≥ 3 s remain: **one retry of the same model**, after 300–1000 ms of random jitter. |
| t = 5 s with no first JSON token | Send one identical backup request (a hedge) and use whichever finishes first. This counts as "the one retry," so there are never more than 2 calls. |
| t = 8 s | Abort everything → `error timeout, counted:false`. The app shows "Taking longer than usual. Try again. This one doesn't count." |
| App side | A `URLSession` timeout of 10 s (8 s + network slack). `GET /v1/health` is called when the camera opens, to warm up the connection (S4). |

**Limits (counted only when a reading is actually returned):**
| | Free | Pro (fair use) |
|---|---|---|
| Fit checks | 1/day | 10/day |
| Re-check | 1 per check, within 30 min (via `checkToken`) | same |
| Shoe / bottom-half snap | 1 per check (via `checkToken`) | same |
| Questions (`/ask`) | 5/day | 50/day |
| Closet item reads (`/item`) | 20/day | 50/day |
| Same-photo cache hits | never reach the server | — |

- **The day resets at 4 am in the device's time zone** (`X-TZ`). D1 table: `usage(device, day, checks, questions, items)`.
- **`checkToken`:** an HMAC-signed `{checkId, device, expires: +30 min, recheckLeft: 1, snapLeft: 1}`. It's stateless, so no table is needed.
- **Pro status:** the app sends the StoreKit transaction's signed JWS once a day to `/v1/attest`. The proxy verifies Apple's signature chain and stores `pro_until` on the device row. **Beta:** sandbox purchases are free, so the proxy accepts the Pro claim unverified and logs it. Verification is required before the Nov 14 submission.
- **Kill-switch:** the proxy adds up the estimated cost from `usageMetadata` in a `spend(day, cents)` row. Above **$3/day**, `/check` and `/ask` return `busy` (counted:false) until midnight UTC. The Google budget alert is the second line of defense.
- **App Attest (`DCAppAttestService`):**
  - The app generates a key on first launch and calls `/v1/attest` once.
  - Every request then carries an assertion over `SHA256(path + SHA256(body) + ts)`.
  - The server checks the signature, a counter that must keep increasing, and that `ts` is within 5 min.
  - **Beta = log-only** (record failures, don't block). Switch to blocking before submission.
  - App Attest isn't supported in the Simulator, so Debug simulator builds send `X-Attest: simulator`, which the proxy accepts only on its dev route.
  - The entitlement's environment is `production` for TestFlight.
- **Worker free plan limits:** 100,000 requests/day and 10 ms of CPU per request. Waiting on Google doesn't count as CPU time, and signature checks use the built-in WebCrypto. If CPU limits ever bite, Workers Paid is $5/month.
- **The proxy never stores images or readings.** It forwards and forgets. It logs only the device ID, route, ms, tokens, model and error code.

---

## 4. Screens and their states

**These apply to every screen, so they aren't repeated below:**
- **Touch targets** ≥ 44×44 pt.
- **Text contrast** ≥ 4.5:1 (UI glyphs ≥ 3:1).
- **Dynamic Type** works up to AX5 and is tested at the largest size. Rows stack vertically when `dynamicTypeSize.isAccessibilitySize`.
- **Labels:** every icon-only button has a VoiceOver label.
- **Meaning is never carried by color alone.** Scores always show a number and a word, and states always have an icon plus text.
- **Reduce Motion** turns animations into cross-fades (no count-ups or shimmer).
- **Reduce Transparency and Increase Contrast** replace glass with solid surfaces.
- **Haptics** follow the brainstorm/03 §5 map.
- **Escape:** every full-screen view shows an **X** from the first frame.
- **Strings** live in `Localizable.xcstrings`, with plurals ("1 fit / 37 fits").

### 4.1 Onboarding (full screen, tab bar hidden; chat-styled bubbles; tap answers only)
**Tap count to the first check = 6:** Get started (1) → tap a look (2) → Continue (3) → birth year (4) → Continue (5) → Agree & check my fit (6) → the camera auto-captures.

| Step | Contents | States | Checks |
|---|---|---|---|
| O1 Welcome | "Look put together. Without trying too hard." · **Get started** · "No account needed" | — | Large title in New York (the serif). The button stays at the bottom at AX sizes. |
| O2 Looks | 6–9 of your own outfit photos in a 3-column grid; tap up to 3 (a check badge + label like "Smart casual" on tap); "Pick by name instead"; "Not sure" | Images loading → placeholders. A 4th tap shakes gently, with the text "Up to 3." | Each photo is labeled by style ("Outfit: relaxed workwear"), never by the person in it. At AX sizes the grid becomes 2 columns, then 1. |
| O3 Basics | **Birth year** (neutral wheel, nothing preselected, required) · Build (Slim/**Average**/Broad, preselected) · Fit preference (Fitted/**Regular**/Relaxed, preselected) · "Add height" (optional; the stylist asks later if skipped) · the silhouette draws in | **Under 18** → a stop screen: "Kitted is for ages 18 and up." This sets the Keychain flag, there's no "try again" hint, and Back doesn't reopen the question. | The neutral wheel avoids hinting at the right answer. Silhouette label: "Silhouette: average build, regular fit." |
| O4 Consent | **"Before your first fit check"**
**What gets sent** to Google's Gemini API, an AI service:
• your outfit photo, **with your face cropped out or blurred first** (if we can't remove it, we don't send it)
• photos of clothes you add to your closet
• questions you type to your stylist, plus your closet items (not photos)
**What doesn't:** your face, birth year, name, contacts or location.
**What happens to it:** we don't keep your photos on our servers; they stay on your phone. Google uses them only to answer, **doesn't train its AI on them**, and keeps them **up to 55 days** only to check for misuse.
**Your stylist is an AI.** It can make mistakes, so use "Not quite right?" to fix it. You can turn this off anytime in You → Privacy.
· **Agree & check my fit** · **Not now** (same width, not greyed) · Privacy policy link. *Exact text: `inputs/app-store-and-age-rules.md` §3* | Not now → the app works for Closet/Lookbook and "describe it"; Stylist shows a "Turn on fit checks" card. | Guideline **5.1.2(i)**: names the third party and asks before sending. Nothing is pre-checked. Saves `consentVersion` and the date; a new version asks again. **Code gate:** `StylistAPI` refuses `/check`, `/item`, `/ask` and `/explain` without current consent, and **refuses to upload if both the face crop and the blur fail** ("Couldn't frame this one. Try again."). A toggle in You → Privacy withdraws consent. |
| O5 First check | Camera (§4.3). "Choose from library" and **"Show me an example"** (a bundled demo photo + saved reading, no API) are visible. | Camera denied → a card with Choose photo + Open Settings. | The camera permission is asked only here. The demo mode lets App Review try the app without taking a selfie. |
| O6 Result + 3 moves | Fit-check card (§4.5), then a Plan card, "Your first 3 moves," built in code from the fixes + Starter 12 gaps | Unreadable → retake; it doesn't count. | |
| O7 Paywall | §4.9 | — | Skippable; shown once. Quitting the app here counts as shown. |
| O8 Notifications | "Want a daily outfit idea at a time you choose?" **Yes, pick a time** · No thanks | Only "Yes" shows Apple's system prompt. | HIG: ask in context, never on first launch. |

**Resume:** each step is saved immediately. A relaunch continues where he left off. Back undoes the last answer, and Back is disabled after the first check is scored.

### 4.2 Stylist (tab 1: the chat)
| Part | Spec |
|---|---|
| Layout | Inline title "Stylist," and a `…` menu (Find a past fit check → Lookbook). The thread is a `ScrollView` + `LazyVStack` of `ChatMessage`s, loading the 50 most recent first, with day separators. The composer sits in `.safeAreaInset(edge: .bottom)` above the tab bar: **[camera] [photos] [Ask your stylist…] [send]**. The camera is the most prominent control. |
| 4 buttons (chips above the composer when idle) | **Check my fit** → camera immediately · **What should I wear?** → occasion chips → Outfit card from the closet (code only, free) · **I bought something** → menu: Take photo / Choose photo / Describe it → Item card with "+N fits" · **Ask a question** → keyboard + 3 starter questions. After a reply, the chips change to ≤ 3 next steps. |
| Cards | Fit check (§4.5) · Outfit (2–4 item photos, one-line summary; Wear this / Swap one / Save) · Item (photo, type, color, "+12 fits"; Added · Undo / Edit) · Buy suggestion · Plan · Question (Yes / No / Not sure) · Limit ("Next free check in 6 h"; **Save for tomorrow** (the default) / See Pro). |
| Rules in code | At most one follow-up question per reply. A fact that's been asked is saved, so it's never asked again. A word list on the phone catches distress language **before** sending → a support card (988 in the US, no styling). "Rate my face" and similar → "I rate outfits, never people." |
| Quota line | Free tier only, shown only when relevant: "1 free fit check today" / "Next free check in 6 h." |
| Empty | It can't be empty, since onboarding starts the thread. If the thread was wiped: a greeting + the 4 chips. |
| Loading | A typing indicator for questions. Answers stream in, with VoiceOver announcing them once complete. |
| Errors | Offline: a banner "Offline. Your closet and lookbook still work." Send is disabled, and the draft is kept. Server error: "I couldn't answer that. It doesn't count." + Retry. |
| A11y | Each card is **one VoiceOver element** with custom actions (Why this score, Not quite right?, Re-check, Share). When scrolled up: a "↓ Latest" pill (44 pt). |
| HIG / §C14 | No tab acts as a button; the camera is a control in the composer. Cross-tab buttons ("Style this item", "Re-check" in Lookbook) switch to Stylist with the item attached. |

### 4.3 Camera (full screen, `AVCaptureSession`)
| Part | Spec |
|---|---|
| Modes | **Propped (default)**, using the front camera so he can see the guide · **Mirror** (manual shutter, a lighter guide) · a **Library** button. A flip button switches to the rear camera (better quality), with spoken cues so he doesn't need to see the screen. |
| Live framing guide | A body-outline overlay. `DetectHumanBodyPoseRequest` runs on video frames, limited to about 10 per second. The guide reports one state at a time, as words + an icon + an outline color: **No one in frame** → "Step into the frame" · **Too close** (no ankles or no head) → "Step back until your shoes are in" · **Off-center** → "Move a little left" · **Good** (shoulders, hips, knees and ankles all at confidence > 0.3) → the outline turns solid. |
| 3-2-1 auto-capture | The pose stays "good" for 0.5 s → a 3-2-1 countdown with haptic ticks + optional voice (`AVSpeechSynthesizer`). The countdown is also announced to VoiceOver. Moving out of frame cancels it. Then a full-resolution capture. A manual shutter is always available. A **Timer off** toggle is shown in Mirror mode. |
| During the countdown | Warm up the connection (`/v1/health`). The latest pose result is reused for the crop. |
| After capture | Quality check (in under 150 ms): too dark (average brightness below a threshold) → "Too dark: face a window or turn on a light" · blurry (blur measure) · lens smudge (`DetectLensSmudgeRequest`) → "Wipe your lens" · 2+ people → crop to the largest centered person · no person → "I can't find you in this photo." Each offers **Retake** · **Use anyway** (except "no person" and nudity). **Shoes cut off is not a retake reason**, so the check goes ahead as a partial check. |
| Nudity check | `SensitiveContentAnalysis` when the user's policy allows it (it's only active when Sensitive Content Warnings or Communication Safety is on). Otherwise the model's `scene.clothed == partial` → no score, and the proxy keeps nothing. |
| Mirror and library photos | The same still-image checks. Pose is advisory only and never blocks. |
| States | Permission not decided → Apple's prompt (the first time only). **Denied** → a card: "Camera is off for Kitted. You can still choose a photo." + Open Settings. No camera (Simulator) → library only. |
| A11y | Guide states are spoken (throttled to one per change). The shutter is labeled "Take photo." **X** is at top-left, and shutter, flip and library are glass buttons over a solid backing. |

### 4.4 Staged loading (the skeleton card inside the chat, not a separate screen)
- **0–0.1 s:** shutter haptic, the photo bubble, and a **skeleton fit-check card in the final card's exact shape**. Occasion chips appear underneath.
- **Real stages only (no fake progress bar):** "Photo looks good ✓" (on the phone) → "Sending…" → "Reading your top… outer layer… pants… shoes…" (as each slot streams in) → the score.
- **Over 8 s:** "Taking longer than usual." Then timeout → the failed state ("Try again. This one doesn't count.").
- **Leaving the app mid-check:** `beginBackgroundTask` keeps the stream going. When it finishes in the background, a local "Your fit check is ready" notification fires (if allowed).
- **A11y:** each stage is announced once. Reduce Motion: no shimmer.

### 4.5 Fit-check card (the core UI)
| Area | Content |
|---|---|
| Header | Photo thumbnail (neck-down) · occasion chip (tap to change; re-scores instantly) |
| Score | **"7.5 / 10"** large, in New York with tabular digits, plus a word: 9+ "Sharp" · 7.5–8.5 "Solid" · 6–7 "Close" · < 6 "Needs a fix." Then Fit · Color · Proportion as **text rows** ("Fit 8 of 10"), never bars alone. |
| Partial label | "**8.0 · Partial check: shoes not included.** Your score may change once we see your shoes." (or "top only"), with the `shoe.2` icon. **Snap your shoes** (primary) · Pick from Closet · Skip (offered once per check). |
| Fixes | 2–3 numbered rows: what to do + "Free" / "From your closet" / "Tailor ~$15" / "Buy" tag + "6.5 → 7.5." The free one comes first. |
| Explanation | The template sentence first, replaced by the streamed 2–4 sentences. `NumberCheck` checks that every number in the text appears in the computed values; if one doesn't, the template stays. |
| Footer | "Added 3 items to your closet · Review" (Undo toast for 5 s) · **Why this score** (sheet: the rules that fired, in plain words) · **Not quite right?** · **Re-check** · Share (neck-down card, `ImageRenderer` + `ShareLink`) · bookmark |
| States | Scoring (skeleton) · Full · Partial · **Unreadable** ("I can't read this one. Try a brighter spot." No score, not counted) · **Not fully clothed** (neutral copy, no score, nothing saved) · **Traditional garment** ("Your kurta isn't rated. I score everything else.") · **Failed / timeout** (not counted; Try again) · **Limit reached** (Limit card) · **Rules updated** (a small note on old checks: "Scored with rules v3.1") |
| VoiceOver | "Fit check, Class. Score 7.5 out of 10, solid. Partial check: shoes not included. Top fix: cuff your jeans once, free." The photo label is "Your outfit photo, October 6." **It never describes the body.** |
| AX sizes | The photo goes full width, the score and word stack, the fixes go full width, and the actions become stacked full-width buttons. |

### 4.6 "Not quite right?" (sheet)
- Chips: **Wrong item** · **Wrong color/fit** · **Fix doesn't apply** · **Score feels off**.
- **Wrong item / Wrong color/fit:**
  - pick the garment, then the field (type / color / leg / hem / sleeve / tucked)
  - the same value lists as v4, shown as chips with plain names ("Straight", "Slim")
  - creates a corrected `Reading`, so the original is never changed
  - re-scores instantly with no API call ("Updated 7.0 ↑0.5")
  - offers "Save to your navy jeans?" to anchor that closet item
- **Fix doesn't apply** → hide that fix and pick the next one ("I can't tuck this"). **Score feels off** → optional "What would you give it?" (a stepper) → thanks. **Every correction** saves a `Correction` and goes to `/v1/feedback` (field names and values only).
- Checks: a sheet with a grabber + Done. Each chip ≥ 44 pt.

### 4.7 Closet (tab 2: look, don't do)
| Part | Spec |
|---|---|
| Header | "Your rotation: **37 fits**" (tap → "How is this counted?" sheet) · Starter 12: "**5 of 12**" (tap → checklist; tap items you already own) |
| Grid | Sections: Tops, Layers, Bottoms, Shoes, Extras. Thumbnails are cut from the fit-check photo using body-pose regions (shoulders→hips for the top, hips→ankles for the bottom, the ankle box for shoes). "Not photographed yet" items show a `tshirt` outline + label. 3 columns → 2 → 1 (AX). |
| Item detail (push) | Photo, type, color, fit, worn count, "+N fits it adds," **Style this item** (→ Stylist), Edit (sheet), Delete (Undo toast) |
| Add (+) | Take photo / Choose photos / Describe it (type + color chips, no AI). A photo uses `/v1/item`. The duplicate check runs here too: "Same as your black jeans?" |
| Rotation | Code in KittedCore: top × bottom × shoes (× an optional layer), counting combinations that pass the hard rules (formality gap ≤ 1, ≤ 4 *accent* color families per rubric v3 neutrals, no style clash). Near-duplicates (same type + color) count once. It never drops unless he deletes items. |
| Empty | `ContentUnavailableView`: "Your closet builds itself. Every fit check adds what you're wearing." + **Check my fit** (switches to Stylist) + Add an item |
| Loading / error | Local, so nothing loads. A failed item read → the item is kept as "describe it" with the photo attached. |

### 4.8 Lookbook (tab 3) and You (tab 4)
**Lookbook:** a Looks / Calendar segmented control.
- **Looks** is a grid, newest first, with filters (occasion · saved · partial vs. full). Partial checks are always labeled.
- **Calendar** is a custom month grid. A day with a log shows a dot + an accessible label ("Oct 6, 1 outfit logged"). Tapping a day lists that day's looks.
- **Header:** "Days dressed with intent: **4** this week · **41** total" (distinct days with a fit check or "Wear this"). There's no chain. After time away: "Welcome back."
- **Look detail (push):** the card again, plus **Re-check** / **Show in chat** (switches to Stylist).
- **Empty:** "Your looks land here automatically." + Check my fit.

**You:**
- Silhouette and basics (edit), styles (max 3), boldness and budget once known.
- **What your stylist knows:** facts with their source and date, editable and deletable. Deleted facts are never used again.
- Pro status and **today's usage** ("Fit checks 0 of 1 · Questions 3 of 5").
- **Gear icon (top right) → Settings:**
  - Notifications: one toggle per type + the idea time
  - Appearance: System / Light / Dark
  - Units
  - **Privacy:** "Your photos stay on this phone," "Delete all photos," and **"Delete all my data"** (a confirmation dialog with Cancel as the default; it wipes SwiftData, photos and the Keychain device ID except the age flag)
  - Manage subscription (`manageSubscriptionsSheet`), Restore purchases, Redeem code (`offerCodeRedemption`)
  - Privacy policy, Terms, Support email

### 4.9 Paywall (full screen, StoreKit 2)
- **`SubscriptionStoreView(groupID:)`** with a custom marketing header: "Unlimited fit checks and questions," "Full next-best-buy list," "Cancel anytime in Settings."
- **Annual is preselected:** "$29.99/year after a 14-day free trial." Monthly is $5.99.
- **X** (top-left) and **Continue free** (a full-width secondary button) are visible from the first frame. No timers, no exit offers.
- **Products:** `kitted.pro.annual` (14-day free-trial introductory offer), `kitted.pro.monthly`. **Founding $19.99 first year** = a subscription **offer code** (pay up front, 1 year) given to the waitlist.
- **Entitlement:** `Transaction.currentEntitlements` at launch + `Transaction.updates` listener. Pro status is cached for offline use. Under-18s don't apply (18+).
- **States:** products loading → `SubscriptionStoreView`'s own placeholder · purchase pending (Ask to Buy) → "Waiting for approval" · failed → Apple's alert · already Pro → "You're Pro" + Manage.
- **Placements:** onboarding O7, the Limit card, and tapping a Pro-only feature. Never inside a progress moment.
- **Prototype stub:** a `Kitted.storekit` configuration file, so purchases work locally with no App Store Connect setup.

### 4.10 Notification permission and the 3 types
| Type | When it's scheduled | Rules |
|---|---|---|
| Daily outfit idea | At the time he picks. On each app open, the next 3 days are scheduled with ideas computed from the closet. | Opt-in. After 3 delivered but unopened, it stops scheduling and asks once in chat. |
| Fit check ready | Only when a check finishes while the app is in the background | Only if already allowed. Never asks for permission on its own. |
| Trial ending | Trial start + 12 days (2 days before the end), rescheduled on app open with the latest summary ("9 checks, rotation 23 → 41") | It's for trust, so it's scheduled even if the idea toggle is off (as long as permission was granted). |

- **When we ask:** only at O8, after "Yes, pick a time." If he said no, the only way back in is You → Notifications, which shows a link to Settings when needed.
- **Never** send "we miss you."

---

## 5. Data model (SwiftData)

| Entity | Key fields | Notes |
|---|---|---|
| **UserProfile** (one) | `birthYear`, `heightCm?`, `build`, `fitPreference`, `styles: [String: Double]`, `boldness?` (default a_little), `budget?`, `dressCode?`, `lastOccasion`, `consentVersion`, `consentAt?`, `onboardingStep`, `paywallShownAt?`, `ideaTime?`, `ideasUnopened`, `units` | Ages are computed, never shown to the model. |
| **Fact** | `key`, `value`, `source` (told / fitCheck / guess), `createdAt`, `isDeleted` | Powers "What your stylist knows." Deleted facts are kept as tombstones so they're never re-learned. |
| **FitCheck** | `id`, `createdAt`, `photoFile`, `thumbFile`, `imageHash`, `occasion`, `status` (scoring / scored / unreadable / notClothed / failed), `isPartial`, `notRated: [String]`, `score?`, `rawScore?`, `subscores`, `occasionAdj`, `rulesFired`, `credits`, `advice`, `fixes: [FixSuggestion]` (Codable), `explanation?`, `rubricVersion`, `isFavorite`, `snapState` (none / offered / done / skipped / closet), `recheckUsed` | → `reading` (Reading), → `parent?` (the check it re-checks), → `items` [ClosetItem] |
| **Reading** | `id`, `imageHash` (indexed), `source` (full / lower / recheckMerged / corrected), `v4JSON: Data`, `model`, `promptVersion`, `schemaVersion`, `latencyMs`, `createdAt` | **Never edited.** Corrections and merges create new Readings. Cache lookup: `imageHash == h && source == .full`. |
| **ClosetItem** | `id`, `slot` (top / outer / bottom / shoes / extra), `type`, `color`, `pattern`, `leg?`, `fit?`, `attributes: Data` (the v4 slot), `confirmedFields: [String]`, `photoFile?`, `isPhotographed`, `source` (fitCheck / added / chat), `starterID?`, `wornCount`, `lastWornAt?`, `createdAt` | Confirmed fields anchor future readings (§2.5). |
| **Outfit** | `id`, `items` [ClosetItem], `occasion`, `summary`, `source` (idea / fitCheck), `isSaved`, `createdAt` | Built by OutfitIdeas in code. |
| **WearLog** | `day` (local date), → `fitCheck?`, → `outfit?` | Feeds the calendar and "days dressed with intent." |
| **Correction** | `id`, → `fitCheck`, `kind` (wrongItem / wrongDetail / fixDoesntApply / scoreOff), `field?`, `oldValue?`, `newValue?`, `userScore?`, `scoreBefore`, `scoreAfter`, `sentAt?` | Synced to `/v1/feedback` without the photo. |
| **ChatMessage** | `id`, `createdAt`, `role` (user / stylist), `kind` (text / photo / card), `text?`, `cardType?`, → `fitCheck?` / `outfit?` / `item?`, `chips: [String]` | The thread. |
| **UsageDay** | `dayKey` ("2026-10-06", rolling over at 4 am), `checks`, `questions`, `items`, `serverRemaining` (from the last `meta`) | A local mirror for the UI. **The server is the source of truth.** |
| **EventQueue** | `name`, `props: Data`, `at` | Sent in batches to `/v1/events`, then deleted. |

- **Schema versioning:** use `VersionedSchema` + `SchemaMigrationPlan` from day 1 (V1). Beta testers' data must survive updates.
- **Photos:** `PhotoStore` writes `<uuid>.jpg` (the cropped and blurred upload copy, which is also what's shown) plus a 400 px thumbnail. **The original full-face photo is not kept after preparation.** "Delete all photos" removes the files and keeps the scores.

---

## 6. Design system: clean premium

**Colors** (Asset Catalog colors with light/dark variants; text contrast checked against the background):
| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | #FAFAF7 (warm paper) | #0E0E0F | Screen background |
| `surface` | #FFFFFF | #1A1A1C | Cards, sheets |
| `surface2` | #F1F0EC | #242427 | Chips, inputs |
| `ink` | #111111 | #F2F2F0 | Primary text |
| `ink2` | #5C5C5A (≈6.4:1 on bg) | #A3A3A0 (≈7.6:1) | Secondary text |
| `line` | #E4E3DE | #2E2E31 | Hairlines |
| `accent` | #1F3D2B (deep loden green; white text ≈11.9:1) | #8FBF9F (black text ≈9:1) | Primary buttons, selected chips, the solid "good" framing outline |
| `positive` / `caution` | system green / system orange | same | **Always with an icon and text**, never alone |
- There's one accent and no gradients. **The score is ink-colored, not red or green.** Photos supply the color.

**Type:**
- SF Pro via Dynamic Type text styles everywhere.
- **New York** (`.fontDesign(.serif)`) only for large titles, the welcome line and the score number (with `.monospacedDigit()`).
- The score is about 56 pt, scaling with `@ScaledMetric(relativeTo: .largeTitle)`.
- Don't use font weights below `.regular`.

**Spacing:** a 4-pt grid (4 · 8 · 12 · 16 · 24 · 32 · 48). Screen margins come from the system (16 pt on phones). Card padding is 16 and card spacing 12. Corner radii: cards 20, buttons 14, chips capsule; use continuous corners.

**Components (in DesignSystem/):**
| Component | Notes |
|---|---|
| `KCard` | surface + a 1 pt `line` border in light mode, no shadow. In dark mode, the surface contrast is the border. |
| `ScoreBlock` | number + "/10" + word + partial label |
| `FixRow` | number, text, effort tag, gain |
| `ChipFlow` | a wrapping chip `Layout` (horizontal → wrap → vertical at AX sizes) |
| `PrimaryButton` / `SecondaryButton` | full width, 50 pt tall. On iOS 26, `.buttonStyle(.glassProminent)` only over the camera; elsewhere a solid accent. |
| `UndoToast` | 5 s, VoiceOver-announced, with an Undo action |
| `SkeletonCard`, `StageList` | the loading states (§4.4) |
| `Silhouette` | a neutral figure drawn from the build and fit chips, no face |
| `ClosetTile` | the closet grid tile |
| `EmptyState` | wraps `ContentUnavailableView` |
| `FramingOverlay` | the camera's body-outline guide |

- **Glass rule:** Liquid Glass only on the tab bar (automatic) and floating camera controls. Never put glass behind text on top of a photo; put a solid backing there.

**SF Symbols** (check each name in Apple's SF Symbols app before use):
| Use | Symbol |
|---|---|
| Tabs: Stylist · Closet · Lookbook · You | `bubble.left.and.bubble.right` · `hanger` · `book.closed` · `person.crop.circle` |
| Camera · Library · Send · Flip | `camera` · `photo.on.rectangle` · `arrow.up.circle.fill` · `camera.rotate` |
| Re-check · Not quite right? · Why this score | `arrow.triangle.2.circlepath.camera` · `questionmark.bubble` · `info.circle` |
| Shoes / partial · Share · Bookmark | `shoe.2` · `square.and.arrow.up` · `bookmark` / `bookmark.fill` |
| Add · Undo · Close · Settings | `plus` · `arrow.uturn.backward` · `xmark` · `gearshape` |
| Item placeholder · Calendar · Timer | `tshirt` · `calendar` · `timer` |
| Good · Warning · Privacy · Notifications | `checkmark.circle.fill` · `exclamationmark.triangle` · `hand.raised` · `bell` |

**Copy rules:**
- Always "your stylist," never "AI."
- The stylist's voice lives in the model prompts and rule copy, not in UI labels.
- No emoji in the UI.
- No RPG or anime words: no ranks, no XP, no "quests."

---

## 7. Real vs. mocked, and the milestones

### 7.1 What's real when
| Piece | Prototype (M0–M3) | Beta (Nov 3) |
|---|---|---|
| Vision reading | **Real**, Gemini direct (dev key, Debug only) | **Real**, via the proxy |
| Rubric, fixes, re-check merge, rotation, outfit ideas | **Real** (KittedCore) | Real; `rubric.json` can be fetched remotely |
| Explanation and Ask | Template sentences until M2's end, then real (direct) | Real via the proxy |
| Free limits | Local counters only | Server-enforced + local mirror |
| Paywall | `Kitted.storekit` local config | Real App Store Connect products (sandbox in TestFlight) |
| App Attest | Off | Sent and checked **log-only**; blocking before Nov 14 |
| Pro verification on the server | — | Trusted and logged; verified before Nov 14 |
| Onboarding look photos | Gray placeholders with style labels | **Your own 6–9 photos** (needed by Oct 29) |
| Starter 12, fix copy | Draft text from the rubric docs | Reviewed copy |
| "+N fits" for the 40 archetypes and the next best buy | **Mocked** (a hard-coded list of 5) | Cut-list item 4 (§7.3) |
| Share card | Cut-list item 3 | Real if time allows |
| Daily idea notification | — | Real (local) unless cut |
| Demo "Show me an example" | Real (bundled reading) | Real |

### 7.2 Milestones (about 3–4 focused hours a day; dates are targets)
**M0 · Oct 6–9 · Skeleton, tabs, design system**
- [ ] `git init` at `Kempt/`, `.gitignore` + pre-commit hook in place, a first commit pushed to a private repo
- [ ] Xcode project (iOS 26, bundle ID, Swift 6 defaults) + the local `KittedCore` package; `swift test` runs
- [ ] `TabView` with the 4 labeled tabs and their SF Symbols; each tab has its empty state
- [ ] Color/type/spacing tokens + KCard, PrimaryButton, ChipFlow, UndoToast, with `#Preview` in light, dark and AX5
- [ ] SwiftData `VersionedSchema` V1 with all §5 models; preview sample data
- [ ] Apple Developer Program enrolled (§8 R7): it takes 1–2 days to activate, so **start this today**

**M1 · Oct 10–16 · Camera + framing guide**
- [ ] Live preview (front by default, flip to rear), Propped and Mirror modes, Library button
- [ ] Body pose at ~10 per second drives the 4 guide states in words + outline; spoken cues optional
- [ ] Hold-good 0.5 s → 3-2-1 with haptics and VoiceOver → capture; manual shutter works
- [ ] ImagePrep: orientation, metadata stripped, SHA-256, brightness/blur/smudge checks, person crop, **face cut off at the neck** (blur as backup), 1024 px JPEG
- [ ] The camera-denied card and the Simulator fallback work
- [ ] Tested on **your** phone: 10 propped + 10 mirror shots in your real room. Write down the guide misfires (input for X8/X9).

**M2 · Oct 17–24 · Fit check end to end with the real API**
- [ ] `DirectGeminiAPI` streaming v4 with the exact §3.2 request; the stage events show
- [ ] V4 Codable types + the adapter port; adapter tests copied from v4.py behavior
- [ ] `RubricEngine` port + `rubric.json`; **`RubricParityTests` pass on every exported fixture**
- [ ] FixEngine with re-scored gains; at least one free fix is always present when any fix exists
- [ ] Fit-check card with every §4.5 state, including partial + the shoe snap (`schema_lower.json`) + Pick from Closet
- [ ] Hash cache: the same library photo twice → identical card, with no network call (check with Airplane Mode)
- [ ] Anchored re-check: a cuff pair goes up, and a "no change" retake stays the same
- [ ] "Not quite right?" correction re-scores offline; the explanation streams and NumberCheck falls back to the template
- [ ] **30 real checks from your phone on LTE:** record shutter-to-score times (target median ≤ 7 s, p90 ≤ 10 s)

**M3 · Oct 25–29 · Closet + Lookbook + You**
- [ ] Auto-add from fit checks with Undo + the duplicate question; item thumbnails cut using pose regions
- [ ] Closet grid, item detail, edit, add (photo / multi-select / describe), Starter 12 checklist
- [ ] Rotation count in KittedCore with unit tests (a known closet → a known count)
- [ ] "What should I wear?" → Outfit card from the closet (code only)
- [ ] Lookbook grid + calendar + days counter; the partial/full labels are correct
- [ ] You: basics, styles, What your stylist knows, settings, Delete all photos / all data

**M4 · Oct 30–Nov 3 · Onboarding + paywall + proxy + polish + TestFlight**
- [ ] Onboarding O1–O8 with resume; the age gate blocks under 18; **6 taps** to the first check (counted by hand)
- [ ] Worker deployed: `/check`, `/explain`, `/ask`, `/item`, `/rubric`, `/health`, `/attest`, `/events`, `/feedback`; D1 usage + spend tables; the 8 s deadline + retry/hedge; the kill-switch tested by setting the cap to $0.01
- [ ] The Release build uses `ProxyAPI` only; the build guard passes; `strings` on the .ipa finds no `AIza`
- [ ] StoreKit products in App Store Connect; `SubscriptionStoreView` paywall; Limit card; trial reminder scheduled
- [ ] Local notifications: the idea (if not cut), fit check ready, trial ending
- [ ] Accessibility pass: VoiceOver walk-through of the onboarding → check → closet flow; AX5 screenshots of every screen; Reduce Motion / Reduce Transparency / Increase Contrast checked
- [ ] Privacy policy URL live; Privacy Nutrition Label filled in; consent copy final
- [ ] **Nov 1:** upload the build and submit for TestFlight external Beta App Review (allow ~1 day). **Nov 3:** invite the testers.

### 7.3 If you fall behind, cut in this order
1. Daily idea notification
2. Multi-select add
3. Share card (screen-record instead)
4. Next best buy / "+N fits" for items he doesn't own
5. Ask a question (keep the 4th button, answering with canned starter answers)

**Never cut:** consent, age gate, partial labels, Not quite right?, Delete all data, the proxy.

---

## 8. Risks and how the build handles them

| # | Risk | How the build handles it |
|---|---|---|
| R1 | **The Gemini terms bar under-18 apps, and the free tier trains on your data** | 18+ gate (D1). **Billing on (the Paid tier) for every environment**: Google's terms say paid-tier prompts and images aren't used to improve its products and are logged only for abuse checks. The free tier says the opposite ("Do not submit … personal information"). State this in the privacy policy. |
| R2 | **Guideline 5.1.2(i) (sharing with a third-party AI) + privacy labels** | The consent step names Google Gemini, explains the face crop and no storage, and is shown before the first upload, with "Not now." The consent version is stored, so if the text changes, the app asks again. **Privacy label:** *Photos* (App Functionality, not linked to you, not tracking); *Other User Content* (questions; App Functionality); *Device ID* (the anonymous ID used for free limits; App Functionality); *Usage Data* (the event batch; Analytics, not linked). No tracking, so no ATT prompt. The same list goes in `PrivacyInfo.xcprivacy`. |
| R3 | **Guideline 1.2 "hot or not" / rating people** | Faces are cut off before upload. The prompt describes clothes only. Rules never read body, face or skin. Card copy and VoiceOver never mention the body. Review notes explain "scores clothes, never people" and point to the **Show me an example** demo. |
| R4 | **Age gate quality** | A neutral birth-year wheel with nothing preselected. The block is stored in the Keychain, so it survives a reinstall. No retry hint. App Store age rating: answer the questionnaire honestly (no user-to-user content, no mature content). The in-app gate does the 18+ blocking, and marketing targets 18+ only. **Apple's Declared Age Range API is required at launch** (Texas SB 2420 has been in force since June 2026, and Apple's age-assurance Q&A says even 18+ apps must check where the law requires it). It needs iOS 26.4+, so set the minimum to 26.4 or wrap it in `#available`. Set the App Store rating to **18+** (override). |
| R5 | **Vision accuracy in mirrors and small rooms** | Pose is advice, never a blocker. Mirror mode is manual. Cut-off shoes give a partial check, never a retake. The model's `framing` and `feet` decide the partial label, not the on-phone pose. **The neck-down crop and person crop haven't been tested:** add them to X8/X9 on the gold set. If they lower accuracy (collars, hats), fall back to sending the full frame with only the face blurred, and change the consent text to match. |
| R6 | **Latency on real phones (LTE)** | Thinking off + v4 + a warm connection + the deadline/hedge. The score shows before the explanation. Measured in M2 (30 checks). If the median is over 7 s, try the priority tier (+80% cost) in beta. |
| R7 | **$0 budget vs. required costs** | **Apple Developer Program: $99/year is required for TestFlight.** There's no individual fee waiver, so budget for it now. Gemini: about $17 of experiments + about 0.3–0.6¢ per check (the price doubles Jan 1, 2027). Domain: about $10–12/year. Cloudflare: $0. The kill-switch caps a bad day at $3. |
| R8 | **App Attest gaps** (no Simulator support, attest failures on some devices) | Log-only in beta. A dev-only bypass for the Simulator. When blocking is on, a failed attestation falls back to tight per-IP limits instead of locking the user out. |
| R9 | **Paid Apps Agreement** | In-app purchase products need the Paid Applications Agreement + bank and tax forms in App Store Connect. **Submit them in M0**, because processing can take days. |
| R10 | **Data loss** (no account; deleting the app removes the closet) | Files and SwiftData are in the device backup, so iCloud Backup and phone migration keep them. Settings says it plainly: "Your closet lives on this phone." iCloud sync (SwiftData + CloudKit, the user's own iCloud) is a v1.1 decision. |
| R11 | **Rubric drift between Python and Swift** | One `rubric.json` and the parity test (§2.2). Never change numbers in only one place. |
| R12 | **Google changes the model or rejects `thinkingBudget: 0`** | The model name is pinned and its version logged. A 10-photo drift check runs each session (from the speed plan). If thinkingBudget is rejected, send `thinkingLevel: "low"`, which measured the same (0 thinking tokens) on 3.8. |
| R13 | **Liquid Glass contrast over photos** | Glass only on camera controls and the tab bar. Solid backings behind any text on top of a photo. Check with Increase Contrast and Reduce Transparency on. |
| R14 | **Timeline (about 32 focused days of scope in 28 calendar days, alongside classes and the gold-set shoot)** | The cut list (§7.3) is decided in advance. M2 is the riskiest milestone, so if M2 isn't done by Oct 24, cut-list items 1–3 go right away. |

# Review notes: final consistency pass (Oct 6, 2026)

A reviewer read the whole package as the new chat would (README order), checked it against `CLAUDE.md`, `brainstorm/13_setup-decisions.md`, `app-build-spec.md`, the mockup HTML and `extraction-test/rubric.py`, ran every script and type-check, and fixed what didn't agree. Conflicts were settled with README's precedence order (rulings > handoff > build spec), and inside the handoff by file ownership (02 screens and copy, 03 tokens, type and icons, 04 logic and data, with fixtures over prose, 05 environment and process). Only files inside `handoff/` were edited. The fixtures were regenerated to check them and came out byte-identical, so they are unchanged.

## Checks run

| Check | Result |
|---|---|
| `make_readings.py`, `make_seed.py`, `make_expected.py`, `make_parity.py`, `make_rubric_json.py` (`/usr/bin/python3`) | All pass their own asserts in under 1 s each. Re-generated outputs are **byte-identical** to the shipped fixtures (`diff -rq` clean). |
| `swiftc -typecheck` of `swift/DesignSystem.swift` (iOS 26.0 simulator target, 26.2 SDK) | Exit 0 in the default mode, `-swift-version 6 -default-isolation MainActor`, and `-swift-version 5`, before and after the edits below. |
| SF Symbol names used in 02/03 | All present in this Mac's `name_availability.plist` (including `bubble.left`, `square.grid.2x2`, `face.dashed`, `square.dashed`, `square.and.arrow.down`, `hand.raised`, `checklist`). |
| Demo photos `mockups/img/*.jpg` | All 12 present (p01a, p01b, s05, s09, s10, s12, s13, s14, s15, s22, s24, s25). `PH` crop table at line 1341 of the mockup, as documented. |
| Mockup screen order | 20 `figure.shot` elements, in the order of the `05` §2 / `02` §1.6 tables. |
| Paths in the docs | Every absolute path exists except the `app/…` files the new chat is meant to create. Fixture filenames named in the docs all exist. |
| Simulator runtime | Still none. **New finding:** `xcodebuild` refuses even `generic/platform=iOS Simulator` ("iOS 26.2 is not installed"), so the old line "`xcodebuild build` for the simulator SDK works" was wrong. `swift test` on a tools-6.2 package and `swiftc -typecheck` / compile against the simulator SDK do work. |

## Changes, file by file

### README.md
1. File table now lists every file that exists, including `REVIEW-NOTES.md` and a `fixtures/` sub-table (it was missing `rubric.json`, `fixes.json`, `rotation_expected.json`, `kitted_logic.py`, `INDEX.json`, `readings/variants/`). `DECISIONS-LOG.md` is marked "doesn't exist yet; you create it". *Why:* the table didn't match the folder.
2. Precedence item 4 now says which handoff file owns what, and that generated fixtures beat prose. *Why:* the old order couldn't settle 02-vs-03 or 04-prose-vs-fixture conflicts.
3. "Your first steps" rewritten: the runtime blocker, ask before installing (runtime, XcodeGen, font), and what to do while waiting (P0 setup + P1). *Why:* the old step 2 implied the build could proceed.
4. New section **"Known open decisions for the founder"** (10 rows, each with the default to build meanwhile): age/provider 18+, design system, never store the face, Declared Age Range vs Xcode 26.3, Rotation counting with layers, installing the runtime, mono label case, Archivo for stat numerals, 10 reachable / calibration, Developer Program + key deletion.

### 01-product-brief.md
1. Pro copy: "Up to 10 fit checks a day" → **"Up to 10 fit checks and 50 questions a day"** (ruling 25 wording used everywhere else).
2. Free-tier re-check: "valid until the 4 am reset" → **30 minutes, or until 4 am after the first-ever check** (ruling 22; 02 D7 and 05 T9 already said this).
3. AI disclosure example: the mockup's old footer ("It reads clothes, never faces") → points to the ruling-16/17 copy (consent row 4 + the new `stylist.aiNote`).
4. §6 points to README's full open-decisions list.

### 02-screens.md
1. **ink-3 values** #656B7B / #8A90A0 → **#646A7A / #9096A5** (03's values, already in the Swift file), with the right contrast ranges. *Why:* 03 owns tokens; the Swift code already used 03's.
2. `ink3Glyph` (not a token anywhere in code) replaced: meaningful glyphs (chevrons, pencil, lock, empty-state icons) → `ink3`; decoration (seams, ghost/missing-piece dashes) → `inkFaint` (= `Color.kInkFaint`). Token-name convention stated.
3. `accentSoft` 11% → **9% light** / 15% dark (03's contrast fix).
4. Spacing note: 03 snaps odd CSS values to a 4-pt grid; allowed by 05's 4 pt tolerance; use the `KSpace`/`KRadius` constants.
5. Archivo: plan prices and the height stepper (and the birth-year value) → **SF Pro** (03 §3.3 / ruling 29); stat numerals stay Archivo pending the founder.
6. Icon table aligned to **03 §7** (the canonical, verified table): Stylist `bubble.left`, You `person`, library `photo`, re-check `arrow.clockwise`, consent row 1 `face.dashed`, partial `square.dashed`, share Save `square.and.arrow.down`; every use in the body updated.
7. **Occasion key:** Class/Work `work_casual` → **`class`** (matches `seed.json → occasionChips`, `expected_scores.json` and 04; `class` is a real `rubric.py` key).
8. **Onboarding style tags:** s05 `vintage_sport` → `minimalist`, s14 `minimalist` → `gorpcore` (matches `seed.json → onboardingLooks` and 04 §3.1).
9. D11 partial entry condition used the v4 field `scene.feet == cut_off` → `not_rated` contains "shoes" / "bottom half" (`scene.shoes_visible == false` / `scene.framing == "upper_only"`). *Why:* v3 has no `scene.feet` (trap T5).
10. **"Same shoes as Sunday?"** → the `{weekday}` template; the demo seed renders **"Monday"** (Sunday Oct 18 isn't a logged day; 04 §12 #3, `seed.json` FC2). VoiceOver line updated.
11. Shoe-snap example "6.5 → 6.0" replaced with the real demo results: runners snap stays 6.5 (raw 6.4), Pick from Closet gives 7.0.
12. Bubble VoiceOver "Only this crop is sent" → **"Only this is sent"** (ruling 13).
13. Fix-row subtitles `ink3` → **`ink2`** (03 §3.2 change), in D7, S14 and the component table.
14. Calendar day cells 34 → **44 pt** (hit minimum; 03).
15. Small woven label 8.5 → **11 pt** (03 and the Swift code).
16. Send button: stated as `primary` (ink), not copper (03 changed to match).
17. Y1 Pro line "Up to 10 checks and 50 questions a day" → **"Up to 10 fit checks and 50 questions a day"** (text + copy key `you.plan.proLine`).
18. Root view order: the age-block check now comes **before** the onboarding check (the age flag survives "Delete all my data").
19. VoiceOver numbers note: labels go through `KScore.spoken` ("8", not "8.0").
20. PH crop table goes into `Resources/DemoPhotos/demo-photos.json` (05 §4.5), not into the generated `seed.json`.
21. Camera demo note now matches 05 P3's "Sample photos" strip.
22. **AI disclosure in the first chat message** (ruling 17) was specified nowhere: added `stylist.aiNote` and where it's posted (D12).
23. Demo behavior for features with no mock data: S25 questions (seeded answers + `ask.demoOnly`), S24/C4 item photos (`item.demoOnly`; Describe it works), unknown photos (`demo.unknownPhoto`). Copy keys added.
24. C2 fits card hidden while the seed's display Rotation (37) is in use (see 04 §9.4).
25. §6 "differs from mockup" list extended (items 20–22).

### 03-design-system.md and swift/DesignSystem.swift
1. **Mono labels:** default changed from "uppercase at normal sizes" to **sentence case everywhere** (ruling 29 outranks the handoff; 02 and 05 already said sentence case). `KMonoLabel.uppercaseAtNormalSizes` (a `static let`, default `false`) brings the mockup's uppercase back if the founder wants it.
2. `KScore.roundedToHalf` used `.rounded(.toNearestOrAwayFromZero)`, which 05 and 04 forbid and which can differ from Python on the fp-boundary cases → now `floor(x*2 + 0.5) / 2`, exactly `rubric.py`'s `round_half`.
3. "Go unlimited · 14 days free" → **"Try Pro · 14 days free"** in the Limit card spec and in the Swift preview (ruling 25).
4. "Only this crop is sent" → **"Only this is sent"** everywhere (ruling 13), including the Swift comment.
5. StageList rows now match 02 D6 (Finding your pieces → Checking fit → Colors & proportion → Writing your fixes); "Photo looks good"/"Sending…" are internal events.
6. Photo bubble: found pieces are pills in the skeleton card (02 D6); `DetectionTag` marked "not used in v1".
7. Camera library button: icon, not a thumbnail (02 D5). Camera and composer VoiceOver labels aligned to 02 ("Choose a photo", "Close camera", "Ask your stylist").
8. Composer send button: copper → `kPrimary` (principle 1).
9. Empty states (Closet, Lookbook) now use 02's copy and buttons.
10. FinishCheckRow uses the `{weekday}` template; "Not quite right?" preview uses 02's "Score 8.0 → 8.5"; "How I score ›" pushes the `why.how.*` page with the ScoreWordScale under it.
11. Perks: the three perks from 02 D18. NotificationPreview: skip in the demo (S15 draws none). "O8" references removed.
12. Icon table: consent rows updated to the ruling-16 rows (`face.dashed`, `hand.raised`, `iphone`, `info.circle`).
13. §11 summary: dark ink-3 contrast range corrected (3.28–4.13 → 5.18–6.51, matching §2.1 and a recomputation).

### 04-logic-and-demo-data.md
1. Occasion mapping: Class/Work → `class` always; `keyIfBusinessCasual: "work"` is for a future `dressCode` with no v1 UI; the old "More…" chip doesn't exist in 02, so the other keys are engine/test-only.
2. Correction preview copy "Updated {x} ↑{d}" → 02's "Score {from} → {to}".
3. "Full check ✓": ✓ means `checkmark.circle.fill`, never a text glyph; snap example reworded.
4. §11 timeline: "Photo looks good"/"Sending…" are `.stage` events, not StageList rows; the bubble says "Only this is sent".
5. §11: new "Other AI calls in the demo" (template explanation, mock `AnswerSource`, item photos, unknown photo).
6. §9.4: concrete Rotation display rules (header = 37 + computed delta; computed "+N fits"; C2 fits card hidden while the override is active).
7. §10.2/§10.3: clock defaults per scenario; screen 12 needs `-freeChecksUsed 0`; screen 19 sets the clock to 21:12. s25 "library thumbnail" annotated.
8. §12: #3 points to the 02/03 template; #8 states **7.775** is the only value to test; new #9 on the mockup's clock times (7:42 / 7:50 / 8:00 / 9:12 pm, status bar 9:41).

### 05-build-plan.md
1. §0 read order and precedence replaced with a pointer to README. *Why:* 05 had its own order (brainstorm/13 > app-build-spec > CLAUDE.md), which contradicted README (CLAUDE.md above the rulings, handoff above the build spec). Removed "Another agent is writing these now."
2. §1.1 rewritten with what was verified: no iOS build or test of any kind without the runtime; what works (KittedCore `swift test`, `swiftc -typecheck` against the simulator SDK, git, `project.yml`, mockup renders); an exact ask-first message for the 8–10 GB download; P0's launch checks wait for the runtime.
3. §3.4: "Only this is sent"; mono labels and Archivo scope aligned with 03.
4. §4.2/§4.3/§4.5: font file `Archivo.ttf` → **`Archivo-Variable.ttf`** (03 §3.4); camera usage string → 02's copy-deck string; Assets.xcassets holds only the icon + AccentColor (colors are in code, per 03).
5. §4.4: use the shipped `fixtures/rubric.json` (it exists) with its real `config` key names (`freeChecksPerDay`, …); no new exporter.
6. §4.5 seed: the scenario `now` values (07:38 / 12:20), not "08:00".
7. §5: **launch-argument defaults** (what loads with no arguments, `-seed` mapping, the Debug clock and `-demoNow real`, what `-demoScreen` sets up per screen, deep links Debug-only); status bar 9:41 note.
8. New table mapping **every undrawn screen in 02 to a phase** (P0–P6).
9. P0: tab icons from 03 §7 (`book.closed` → `square.grid.2x2` etc.); router = 02 §1.4 + brainstorm/11 §2; **data-model adjustments** to app-build-spec §5 (v3 `readingJSON`, ordered `[StylePick]` styles, `held` status, `isFirstCheck`, v3 garment in `ClosetItem`, `userConfirmed` source, `fixConfirmed` correction, String raw enums, KittedCore value types vs app `@Model`s).
10. P2 correction copy; P3 "Only this is sent" + `demo.unknownPhoto`; **P4 rewritten with 02's screen IDs** (05 had app-build-spec's O4 = consent … O8, which clash with 02's O4 = age stop, O5 = consent).
11. P5: "5 of 12" → **8 of 12**, "41 total" → **19 total** (seed and mockup).
12. P8: `ReadingEvent` gains `.slotFound` (as in 04 §11).
13. §9: the founder list points to README's consolidated decisions.

### Files not changed
`fixtures/*` (regenerated and identical), everything outside `handoff/`.

## Not resolved here (needs the founder or real work)

1. **All 10 "Known open decisions"** in README. The defaults are set; none blocks the demo.
2. **Rotation 37 can't be reproduced** by the specified rule (180 with layers, 48 core-only). The demo shows seed display values under the rules in 04 §9.4. That's a stopgap until the founder picks a counting rule.
3. **`CLAUDE.md` is stale** on age ("open to 14+", "under 14 is blocked"), privacy wording and pricing of Gemini. brainstorm/13 §3 lists the fixes; the founder's file wasn't edited (outside `handoff/`, and his to approve). The handoff's precedence puts CLAUDE.md above the rulings, so the new chat must read those lines through ruling 1's FOUNDER DECIDES default (18+). README's open-decision #1 says so.
4. **`app-build-spec.md` still says v4, `scene.feet`, "Unlimited", 8 s abort, and has a data model with `v4JSON` and `[String: Double]` styles.** The handoff overrides each point (05 trap T5, P0 data-model notes), but the spec itself wasn't edited.
5. **xcodebuild with an `.xcodeproj` and no runtime** was not tested directly (only a Swift-package scheme was). 05 tells the new chat to try it once.
6. **Archivo's variable-axis code** type-checks but has never run (no runtime). 03 §3.4 has the runtime test and a static-font fallback.
7. **New copy** written in this pass (`stylist.aiNote`, `ask.demoOnly`, `item.demoOnly`, `demo.unknownPhoto`) is marked N in the copy deck; the founder may want to reword the AI note.

## Stack change: React Native (Expo) instead of SwiftUI

The lead sent this mid-review: the founder will build with React Native (Expo). After that message this pass made only stack-agnostic fixes. **Swift-specific edits made before the message** (the RN pass can drop or convert them): `swift/DesignSystem.swift` (the `KMonoLabel.uppercaseAtNormalSizes` flag, `roundedToHalf` now using floor, the preview copy); 05 §1.1's xcodebuild/runtime findings; 05 P0's SwiftData model adjustments; 05 §4.2/§4.5 `UIAppFonts` / `Archivo-Variable.ttf` and the plist string; 05 §5 launch arguments as `UserDefaults` keys. The *content* of several of these doesn't depend on the stack and should carry over: v3 reading JSON, styles as an ordered list, the `held` status, `isFirstCheck`, sentence-case labels, floor-based half rounding, scenario/clock defaults, the `-demoScreen` → scenario map. The Swift type-check results above were recorded before the message; no more were run.

**Sections that are Swift-specific and need converting:**
- **README:** the mission ("SwiftUI", "Swift port", "`KittedCore` package", "local StoreKit config"), the `swift/DesignSystem.swift` row, first steps 2–3 (XcodeGen, `swiftc -typecheck`), open decisions #4 (Declared Age Range vs Xcode 26.3: under Expo this becomes "native module or skip") and #7/#8 (they name `KMonoLabel` / `KFont` constants). #6 (Simulator runtime) **still applies**: Expo's iOS Simulator needs the same runtime.
- **01:** §3 "KittedCore, a Swift port", §5 "iOS 26 floating Liquid Glass tab bar".
- **02:** §0.2 (mockup px → SwiftUI Dynamic Type styles), §0.5 SF Symbols (Expo needs `expo-symbols` or an icon set), §1.1–1.4 (`TabView`, `NavigationStack`, `.sheet`/`.fullScreenCover`, `@Observable AppRouter` → Expo Router / React Navigation), §4 component table (SwiftUI modifiers), D5 `AVSpeechSynthesizer`, D7/D12 `.navigationSubtitle`, D18/P1b `SubscriptionStoreView`, `manageSubscriptionsSheet`, `offerCodeRedemption`, C1e/L1e `ContentUnavailableView`, D20 `ImageRenderer` / `ShareLink`, S4 `PhotosPicker`, `SFSafariViewController`, `Localizable.xcstrings`.
- **03:** almost all of it as code: §2 tokens via `UIColor` trait providers (the hex values and contrast numbers carry over as-is), §3 Dynamic Type / `@ScaledMetric` / Core Text variable-axis Archivo, §4.5 Liquid Glass / `.glassEffect`, §5 the `[Swift]` components, §7 SF Symbols, §8 the Vision / Core Image crop and face-pixelation pipeline (needs a native module or an ML Kit-style library under Expo), §9 dark mode via `preferredColorScheme`.
- **swift/DesignSystem.swift:** the whole file.
- **04:** §4.1 and §11 Swift signatures (`struct RubricResult`, `protocol ReadingSource`, `AsyncThrowingStream`), §2 "decode as `String?`", §4.7 P14 "Double only" (JS `number` is the same IEEE-754 binary64, so the parity fixtures still hold; use `Math.floor(x*2+0.5)/2` and arrays for ordered data), §8.3 the asset-catalog re-encoding note (Metro/Expo assets need the same "bundle the bytes untouched" check for the SHA path).
- **05:** §1 environment table (Xcode, Swift, XcodeGen; add Node/Expo CLI), §1.2 Declared Age Range SDK finding, §3.2 code rules (Swift 6, SwiftData, KittedCore, protocols), §4.2–§4.5 (XcodeGen `project.yml`, `Package.swift`, `UIAppFonts`, `Kitted.storekit`, `PrivacyInfo.xcprivacy`), §5 shared commands (`xcodebuild`, `swift test`; the `simctl` lines mostly still work) and every phase's Swift wording (P0 SwiftData schema, P1 Swift Testing, P6 StoreKit 2 / `Transaction.updates` / `SKTestSession` → a purchases library such as `react-native-iap` or `expo-in-app-purchases`, P7 `performAccessibilityAudit()` / XCUITest, P8 `#if DEBUG` `DirectGeminiReadingSource` + `nm` symbol check), §7 traps T5/T12/T14/T15/T17/T18, §8 "no third-party packages" (an Expo app needs some; the founder should approve the list).

## React Native pass (final review, Oct 6, 2026)

A last reviewer read the package as the new chat would (README order) after the switch to React Native + Expo SDK 57, and fixed what would have made it stuck or build the wrong thing. The sections above are the SwiftUI-era pass; where they mention `swift/DesignSystem.swift`, `swiftc`, `Archivo-Variable.ttf`, `UIAppFonts`, SwiftData or `KMonoLabel`, they are history, superseded by this section and by `05`/`06`. Only files inside `handoff/` were edited; `fixtures/*`, the fixture scripts and `rubric.py` are untouched.

### Checks run (Node 20.20.0, TypeScript 6.0.2 from the global eas-cli, no packages installed)

| Check | Result |
|---|---|
| `ts/kitted-core`: `tsc -p tsconfig.build.json --outDir …/scratchpad/final-kc && node scripts/verify.mjs …/final-kc` | **ALL CHECKS PASSED**: parity 5,694/5,694 (fp_boundary 27/27, 0 inputs mutated), demo cases 181/181, mockup checks 23/23, fixes 14/14, re-checks 4/4, corrections 1/1, partials 2/2, Rotation 26/26 (180 with layers, 48 core only), rounding 14/14. Run before and after the edits below. |
| `ts/kitted-core`: `tsc -p tsconfig.json --noEmit` (src + tests, with the vitest shim) | Exit 0. |
| **App layout** (new): the package copied to a scratch `app/packages/kitted-core/` with `handoff/` beside `app/` | `verify.mjs` passes (ALL CHECKS PASSED); `gen-rubric-data.mjs` regenerates a byte-identical `src/rubricData.ts`; the five test files, compiled and run under a minimal describe/it/expect stand-in, **39 passed, 0 failed**. Still never run under real Vitest. |
| `ts/design-system`: `tsc -p tsconfig.json --noEmit` (against `_stubs/`) | Exit 0. |
| Paths in the docs | Every absolute path exists except the `app/…` and `.gitignore` files the new chat creates. Every `ts/…`, `fixtures/…`, `archive/…` path exists. 12 demo photos present. |

### Changes, file by file

**02-screens.md**
1. Header: "You build the SwiftUI demo" → React Native (Expo) demo, plus a **stack note** pointing to `06` for every SwiftUI/iOS API name. *Why:* the task's rule (02 keeps SwiftUI terms; 06 maps them).
2. §0.1 `KSpace`/`KRadius` from `swift/DesignSystem.swift` → `space`/`radius` in `ts/design-system/tokens.ts`. *Why:* the Swift file is archived.
3. §0.2 title and score numerals: variable Archivo (width ~70 / weight ~640) via `@ScaledMetric` → the static **Archivo Condensed SemiBold** cut through `<Numeral>`, largeTitle ramp, capped at 1.6× (03 §3.3). *Why:* RN on SDK 57 can't set variable axes.
4. §0.3 `Color.kInkFaint`/`Color.kInk3`, "swift/DesignSystem.swift already uses them" → `colors.inkFaint`/`colors.ink3` in `tokens.ts`.
5. §0.3 fixed-dark screens: `.preferredColorScheme(.dark)` → `<FixedDark>` + explicit dark native props. *Why:* 06 maps `.preferredColorScheme` to `Appearance.setColorScheme`, which would have flipped the **whole app** to dark on the camera.
6. §0.4 PH table destination `Resources/DemoPhotos/demo-photos.json` (05 §4.5) → `app/assets/demo-photos/demo-photos.json` (05 §4.7).
7. §1.5 strings `Localizable.xcstrings` → `src/i18n/en.ts` + `Intl.PluralRules`; `KScore.spoken` → `spokenScore()` (`score.ts`; `KScore` doesn't exist in TS).
8. O3 "Looks right": Declared Age Range "behind `#available`" + Keychain → `AgeAssurance` (stub; `expo-age-range` at M4) + `expo-secure-store`.
9. P1 "differs" note, §6 item 2: page 2 "built on `SubscriptionStoreView`" → our own plans page.
10. **P1b rewritten:** the `SubscriptionStoreView(groupID:)` + `.storeButton` + `Kitted.storekit` build instructions → our own page (PlanCards as a radio group, our purchase button, Restore, Terms/Privacy) fed by `Entitlements`; `DemoStore` products `kitted.pro.annual`/`kitted.pro.monthly`; the full Guideline 3.1.2 checklist; the plan picker is now "build exactly" instead of "configure the .storekit file". P1s "Products loading = SubscriptionStoreView's placeholder" → skeleton cards + a load-failed state. Paywall Restore `AppStore.sync()` → `Entitlements.restore()`.
11. Copy deck §5.11: `pay.cta.trial` note fixed ("Apple's view supplies its own" was false now); new keys `pay.cta.monthly`, `pay.loadFailed`, `pay.retry`, `pay.demoNote` (marked N). Restore toasts reuse the existing `toast.restored` / `toast.nothingRestore`.
12. Y7 "wipe SwiftData … Keychain device ID" → SQLite + secure-store.
13. §4 components: `ScoreBlock` (`@ScaledMetric`, 75.5) → `<Numeral>` 76 capped 1.6×; `ShareCardView` `ImageRenderer` → `react-native-view-shot`; `EmptyState` "wraps `ContentUnavailableView`" → our own component (06 §3).

**03-design-system.md**
1. §3.4 "ask the founder (README 'Your first steps')" → `05` §4.7/§9 item 4 (README no longer says it). Same pointer fixed in `ts/design-system/fonts.ts`'s comment.
2. §3.4 plugin snippet labeled `app.json → expo` → `app.config.ts → plugins` (05 §4.8 uses `app.config.ts`).
3. §4.4 and §5 Basics: `@react-native-segmented-control/segmented-control` → `@expo/ui` `Picker` (segmented) + `.web.tsx` fallback. *Why:* 05 S6 / 06 §3 chose `@expo/ui`; the other package isn't on the dependency list.
4. ScoreBlock "capped at 124" → **1.6× (about 122)**, matching `typography.ts → numeralMaxScale` and §3.3.
5. §8 `expo-image` "if the founder adds it" → already in the SDK 57 template; `contentPosition` noted as the crop alternative.
6. §9 `userInterfaceStyle` in `app.json` → `app.config.ts`; "Debug-only Design system screen" → the `src/app/demo/gallery.tsx` route (05 §4.3), also in §12.
7. §12 packages: `expo-blur` flagged as the one module the template lacks (now on 05 S15); the "options" list replaced with what 05 actually approves; `// app/_layout.tsx` → `// src/app/_layout.tsx`.

**05-build-plan.md**
1. S15: **`expo-blur` added** to the dependency list. *Why:* `ts/design-system/components/IconButton.tsx` imports it, while 05 didn't list it and 06 said "not in the approved list": the design system wouldn't have type-checked in the app.
2. §1.3: **honest Node 20 split.** Before: "on Node 20 only reading, planning, git and the mockup renders are safe." Now: what runs today with no approval (the core gate via eas-cli's TypeScript + `verify.mjs`, the core and design-system typechecks, git, mockup renders) and what needs Node 22 (create-expo-app, `npm install`, the **web preview**, lint, Jest, prebuild, Vitest).
3. §4.2: **exact ordered steps 1–7** (check Node → `create-expo-app … --template default@sdk-57 --no-install` → edit `package.json` incl. workspaces and `@kitted/core` **before** the first install → copy core + delete the vitest shim → `npm install` + core tests → copy design system + delete `_stubs/` and its tsconfig + `npx expo install expo-blur` → typecheck). New bullet: app `tsconfig.json` `exclude: ["node_modules","packages"]` and Jest `testPathIgnorePatterns` for `packages/`. *Why:* without them `npx jest` picks up the core's Vitest files and `npx tsc` sees the shim next to real vitest types.
4. §4.4 rewritten for the **real package**: "another agent is writing it; if it has no package.json…", "copy rubric.json into src/" and "point the tests at the handoff path or copy the fixtures" → what ships (`package.json` fields, the four scripts, `src/rubricData.ts` already generated) and that fixtures are found in place from both layouts.
5. §4.5: "another agent is writing it; follow its README" (no README exists) → copy, delete `_stubs/` + `tsconfig.json`, install `expo-blur`, import as `@/design-system`.
6. §4.6: note for the interactive `create-expo-module` prompts (hand-written stub fallback).
7. §4.8: the `expo-font` plugin line is commented out until the fonts are approved and downloaded (a missing file fails prebuild, which P0's done-criteria run); typography falls back meanwhile.
8. §5.1 check command now includes `npm run typecheck --workspace @kitted/core`.
9. §1.5 / §9: README open decision #4 already says `expo-age-range`; removed "README should be updated".
10. §3.2 + §1.3 + T21 + P0: SF Symbols on web/Android are **blank boxes** with today's `Icon` (symbols.ts has SF names only); add Material `md` names for the 4 tabs in P0 and per key if web needs icons. *Why:* 05/06 claimed symbols.ts had Material names; it doesn't.
11. T35: "score 124 pt max" → `<Numeral>` 1.6× ≈ 122.
12. P1 rewritten: "Another agent is converting 04…" → already ported and verified; listed what exists (`score(reading, { occasion, styles, boldness })`, not the old 5-argument signature) and what's **still to add** (outfit ideas, number check, `dayKey` with a `Clock`); done-criteria now say real Vitest (the Oct 6 runs never used it).
13. §3.2 / P0: value types `FixSuggestion` (doesn't exist) → `Fix`, `FixSuggestions`, `ClosetItem`; P0 notes that **`seed.json` stores fixes in snake_case** (`to_raw`, `item_id`) while the core's `Fix` is camelCase, so `seedLoader.ts` must map them.
14. §9 item 4: the font ask now names the three files, size and source.

**06-react-native-mapping.md**
1. Tabs `md` note and SF Symbols row: symbols.ts has no Material names yet; `Icon` shows a blank box on web/Android; how to add them. Suggested tab names `chat_bubble`, `checkroom`, `grid_view`, `person` (check against the Material list).
2. Dynamic Type / `@ScaledMetric` rows: 124 pt cap → `numeralMaxScale` 1.6 via `<Numeral>`.
3. `.ultraThinMaterial` row: "expo-blur isn't in the approved list" → it is (S15); v1 face blur = `BlurView` over the rects from `kitted-vision` (03 §8) or native.
4. `KScore.spoken` → `spokenScore()`; `KSpace`/`KRadius` → `space`/`radius`; "03 §5's `[Swift]` sketches" → the `[RN]` components; `FixSuggestion` → `Fix`/`FixSuggestions`/`ClosetItem`.

**04-logic-and-demo-data.md**
1. §4.0 test instructions: `npm i -D vitest …` + "keep the layout or change FIXTURES" → the workspace install of 05 §4.2 + `npm test --workspace @kitted/core`; fixtures resolve from both layouts.
2. §10.2 "in Debug the Clock…" → "in demo builds" with the deep-link and launch-argument forms (05 §5.2).
3. §4.0/§13 Hermes: "a Jest run on Hermes" → a dev-only screen (Jest and Vitest run on Node).

**01-product-brief.md**: `ReadingSource` "protocol" → "interface".

**README.md**
1. "Your first steps" 3–5 split into **today on Node 20** (core gate, typechecks, git, mockup renders, the asks) vs **after Node 22** (project creation in 05 §4.2's order, web preview). *Why:* the old step 3 listed project creation and the web preview as things to do "while you wait", but both need Node 22.
2. File table: `ts/kitted-core/` and `ts/design-system/` rows describe what's actually there (scripts, `_stubs/` to delete).

**ts/kitted-core/** (code, not fixtures)
1. `test/helpers.ts`, `scripts/verify.mjs`, `scripts/gen-rubric-data.mjs`: fixtures are found at `../../fixtures` (handoff layout) **or** `../../../handoff/fixtures` (`app/packages/kitted-core/`); `verify.mjs` also honours `KITTED_FIXTURES`. *Why:* the old fixed `../../../fixtures` pointed at the non-existent `Kempt/fixtures` once 05 §4.4 copied the package into the app, so every core test would have failed on the first `npm test`.
2. `package.json` dev dependencies: `typescript ^5.8` → `~6.0.3` (the app's version, so the workspace holds one TypeScript; everything was verified on 6.0.2), `@types/node ^20` → `^22` (Node 22 is required).

**ts/design-system/fonts.ts**: download-approval pointer comment only (no code change).

### Consistency confirmed (no change needed)
Expo SDK 57 / RN 0.86.3 / expo-router 57.0.25 (05 S1, 06 header, 03 §3.4, fonts.ts); Node 22.13+ and Xcode 26.4+ (README, 05); three static Archivo files via the expo-font plugin (03 §3.4, 05 §3.4/§4.7, fonts.ts); routes in `src/app/`; package `@kitted/core`; `MONO_UPPERCASE_AT_NORMAL_SIZES = false` and `ARCHIVO_FOR_STAT_NUMERALS = true` in `typography.ts` (README #7/#8, 03 §3.3); ink-3 `#646A7A` / `#9096A5` (02, 03, tokens.ts); "Up to 10 fit checks and 50 questions a day" (01, 02, 03, 05); occasion key `class` (02, 04, seed.json); RevenueCat for v1 with a mock store in the demo (README #12, 05 S8, 06 §7); 18+ default with `config.minAge` 18 (rubric.json); `expo-age-range` (S17) and `@expo/app-integrity` (S18).

### Still unresolved
1. **Nothing has run on Node 22, Expo, Metro, Hermes or a simulator.** The create-expo-app flags, the template contents (05 §4.2), `Settings.get` for launch arguments, `ui-monospace` = SF Mono, the Archivo PostScript names and the real expo-* types against `ts/design-system` are all documented but unverified; 05 §10 "Not verified" and 03 §12 list them.
2. **The core tests have never run under real Vitest** (only `verify.mjs` and a stand-in runner, both green in both layouts).
3. **Material Symbol names** for web/Android aren't in `symbols.ts`; the four tab names suggested in 06 are unchecked.
4. **New copy** added in this pass (`pay.cta.monthly`, `pay.loadFailed`, `pay.retry`, `pay.demoNote`) is marked N; the founder may reword it.
5. Minor: 03 says NativeTabs' `unstable-native-tabs` import applies on SDK 54–57, 05 says 55–57. Both agree for SDK 57, so it doesn't affect the build.
6. Everything in the earlier "Not resolved here" list that isn't Swift-specific still stands (the README open decisions, Rotation 37, stale `CLAUDE.md` lines, `app-build-spec.md` v4 wording).

# 05 · Build plan, environment setup and verification playbook (React Native + Expo)

*Rewritten Oct 6, 2026 for the Claude instance that will build the Kitted demo. The founder switched the stack from SwiftUI to **React Native with Expo (TypeScript)**, iOS first with the iOS 26 look, Android later. You have no memory of this project, so this file tells you what to build, in what order, how to check it, and what to tell the founder. Paths are absolute. The project root is `/Users/eyu/Desktop/files/Kitted` (the folder was renamed from "Kempt" on Oct 6; the app is called **Kitted**). Every version number below was checked on Oct 6, 2026 against the npm registry or the linked docs (§10 lists the sources); re-check them before you run the setup.*

---

## 0. Read this first

**Your job:** build a runnable Expo **demo** of Kitted, a men's pocket-stylist iPhone app. Every screen from the mockups should be in it. It uses the **real scoring code** (`@kitted/core`, the TypeScript port of the Python rubric, delivered in `handoff/ts/kitted-core/`) and **bundled readings**, so it needs no API key and no network. Build it so it grows into the real v1 (TestFlight beta Nov 3) without a rewrite. The demo is roughly milestones M0 to M3 of `app-build-spec.md`, with the AI call swapped for saved readings.

**Read order and precedence:** follow `/CLAUDE.md` → "Which document wins" (founder in chat > `CLAUDE.md` > `brainstorm/13` rulings > this handoff folder > `app-build-spec.md` > older docs; the mockups win on layout, sizes and copy except where `02-screens.md` says "differs from mockup because…"). Then:
- **`06-react-native-mapping.md`**: every SwiftUI/iOS term used in `02` and `03` and what to use in Expo. `02` and `03` were written in SwiftUI terms; read them through that table.
- `/Users/eyu/Desktop/files/Kitted/extraction-test/rubric.py` (the source of truth for scores), `schema.json` and `prompt.txt` (the locked v3 reading format), `rubric/v3.md` (the rules in plain words).
- `app-build-spec.md` §1–§3, §5, §7–§8: still right on the pipeline, the proxy (Cloudflare Worker + D1, TypeScript), the data model's content, milestones and risks. Wherever it says SwiftUI, SwiftData, StoreKit 2 views, XcodeGen, `KittedCore` or `#if DEBUG`, use this file and `06` instead.
- `brainstorm/11_app-setup-engineering.md` §2 (router idea) and §7 (test list) are still useful. Its Supabase and PostHog choices stay overruled (rulings 4, 7). Its RevenueCat choice is **back on the table** because of the stack change (§1.4, decision S8).

---

## 1. Stack decision and this Mac's environment

### 1.1 Stack decisions (recommended; the founder approves the list in the P0 report)

| # | Area | Choice | Why | Source |
|---|---|---|---|---|
| S1 | **Expo SDK** | **SDK 57** (`expo` 57.0.27, React Native **0.86.3**, React 19.2.3, TypeScript ~6.0.3, expo-router 57.0.25). Not SDK 58: it's `next` on npm (58.0.6, React Native 0.88.0-rc.3), i.e. still beta. | Latest stable. 57 is the "no breaking changes" release on RN 0.86. Plan the move to SDK 58 + Xcode 27 **after** the beta (Apple requires the iOS 27 SDK for uploads from April 2027). | npm `expo` dist-tags (latest 57.0.27, next 58.0.6); expo.dev/changelog/sdk-57; docs.expo.dev/versions/v57.0.0 |
| S2 | **Node** | **Node 22 LTS** (≥ 22.13). This Mac has 20.20.0, which is **below SDK 57's minimum**. | Expo's table lists "Minimum Node.js version 22.13.x" for SDK 57. EAS's SDK 57 build image uses Node 22.23.1. RN 0.87+ refuses Node 20 outright (`engines: ^22.13.0 \|\| ^24.3.0 \|\| >= 26`). | docs.expo.dev/versions/v57.0.0; docs.expo.dev/build-reference/infrastructure; npm `react-native@0.87.1` engines |
| S3 | **Xcode** | **Xcode 26.6** (17F113), side by side with 26.3, plus its iOS platform/Simulator runtime. SDK 57 needs **Xcode ≥ 26.4**; this Mac has 26.3. | 26.6 is exactly what EAS uses for SDK 57 builds, so local and cloud builds match. It also brings the iOS 26.4+ SDK, which Declared Age Range's regulatory API needs (§1.5). Xcode 27 would also work but needs the opt-in scene life cycle (`ios.enableSceneSupport`, expo ≥ 57.0.23), which is one more variable before the beta. | docs.expo.dev/versions/v57.0.0 ("Xcode 26.4+"); docs.expo.dev/build-reference/infrastructure ("macos-tahoe-26.5-xcode-26.6 (latest, sdk-57)"); expo.dev/changelog/sdk-57 ("Building with Xcode 27") |
| S4 | **Navigation** | **expo-router** (file routes in `src/app/`). Tabs = **`NativeTabs`** from `expo-router/unstable-native-tabs` (the system `UITabBarController`, so the **iOS 26 Liquid Glass tab bar comes for free**). A native `Stack` inside each tab. Sheets = `presentation: 'formSheet'` + `sheetAllowedDetents`. Full-screen = `presentation: 'fullScreenModal'`. | NativeTabs is what the SDK 57 default template ships. The import path is `unstable-native-tabs` on SDK 55–57 and becomes `expo-router/native-tabs` (stable) in SDK 58. On iOS 26+ background props have no effect: the system draws the glass. | docs.expo.dev/router/advanced/native-tabs; docs.expo.dev/router/advanced/modals; `expo-template-default@57.0.29` `src/components/app-tabs.tsx` |
| S5 | **Glass you add yourself** | **expo-glass-effect** (`GlassView`, `GlassContainer`, `isLiquidGlassAvailable()`), only on the camera controls (03 §4.5). | iOS 26+ only; falls back to a plain `View` elsewhere, so give every glass control a solid fallback style. Never animate `opacity` to 0 on it or a parent (known issue: the glass stops rendering). | docs.expo.dev/versions/latest/sdk/glass-effect |
| S6 | **Native iOS controls** | **@expo/ui** (`@expo/ui/swift-ui`, in the SDK 57 template, stable since SDK 56): segmented `Picker`, `DatePicker`, `Menu`/`ContextMenu`, `ConfirmationDialog`, wrapped in `<Host>`. RN's own `Switch` for toggles. | Real SwiftUI controls, so they get the iOS 26 look. iOS only: each one needs a `.web.tsx` fallback for the web preview. | docs.expo.dev/versions/latest/sdk/ui/swift-ui; expo.dev/changelog/sdk-56 |
| S7 | **Camera (v1, M1)** | **The demo needs no camera library** (the Simulator has no camera; P3 uses a simulated camera). For v1, **own the camera in the local `kitted-vision` module** (Swift: `AVCaptureSession` preview as an Expo native view + Apple Vision body pose and face rectangles at ~10 fps, events to JS). **Fallback** if that takes more than 1.5 days: **react-native-vision-camera v5** (5.2.3, Nitro-based, frame-processor plugins). **Not expo-camera** for the live guide. | expo-camera has preview + `takePictureAsync` but no per-frame access, so it can't drive the live framing guide or the 3-2-1 auto-capture (ruling 14). The Swift Vision code is needed either way; owning the session avoids 3–4 extra packages (nitro-modules, nitro-image, worklets). | docs.expo.dev/versions/latest/sdk/camera; margelo.com/blog/whats-new-in-visioncamera-v5; npm `react-native-vision-camera` 5.2.3 |
| S8 | **In-app purchases** | **Demo: a mock store, no package.** **v1: RevenueCat** (`react-native-purchases` 10.11.0) with **our own paywall UI** (the 2-page design in `02`), RevenueCat's webhook → the Worker sets `pro_until`. Alternative: `expo-iap` 5.8.2 (OpenIAP, free, no third party) if the founder refuses a third party; then the Worker must verify StoreKit JWS itself. | RevenueCat was rejected (ruling 6) **only** because SwiftUI had `SubscriptionStoreView`, and ruling 6 already named "RevenueCat as verifier" as the fallback for the hardest server code (JWS checks). In RN there's no Apple paywall view, so we build the paywall anyway and RevenueCat removes the server verification work. Free up to $2,500 monthly tracked revenue, then 1%. It has a mock "Preview API mode" in Expo Go and a hosted Test Store. **FOUNDER DECIDES** (adds a processor to the privacy label). | revenuecat.com/docs/getting-started/installation/expo; revenuecat.com/pricing; revenuecat.com/blog/company/revenuecat-test-store; npm `expo-iap`, `react-native-iap` 16.7.2 |
| S9 | **Local database** | **expo-sqlite** (57.0.4) with hand-written SQL and `PRAGMA user_version` migrations (the pattern in the expo-sqlite docs), typed row mappers in `src/data/`. **No Drizzle for now.** On web, a `.web.ts` in-memory repository with the same interface. | ~10 tables (app-build-spec §5) don't need an ORM. Drizzle's stable line is 0.45.3 while its docs install the 1.0 `rc`, and it adds a Babel plugin and a Metro `sql` extension. expo-sqlite's web support is alpha and needs WASM + COOP/COEP headers, which would break the web preview loop. | docs.expo.dev/versions/latest/sdk/sqlite; orm.drizzle.team/docs/connect-expo-sqlite; npm `drizzle-orm` dist-tags |
| S10 | **Photos on disk** | **expo-file-system** (new `File`/`Directory`/`Paths` API) under `Paths.document/photos/`. Hashing with **expo-crypto** (`digest(SHA256, bytes)`). | Documents is in the device backup, which ruling 18 wants (Caches isn't). iOS's default file protection is already "complete until first user authentication", the class ruling 18 picks. | docs.expo.dev/versions/latest/sdk/filesystem; developer.apple.com "Optimizing your app's data for iCloud backup" |
| S11 | **Keychain** | **expo-secure-store** for the device ID and the age-blocked flag. | On iOS its data **survives uninstall/reinstall** with the same bundle ID (what the age flag needs); on Android it doesn't. No web support → `.web.ts` stub. | docs.expo.dev/versions/latest/sdk/securestore |
| S12 | **Notifications** | **expo-notifications**, local only (`scheduleNotificationAsync` with `DAILY` / `DATE` / `TIME_INTERVAL` triggers). | Exactly the 3 local kinds; no APNs (app-build-spec D7). | docs.expo.dev/versions/latest/sdk/notifications |
| S13 | **Share card** | **react-native-view-shot** (`captureRef`, the SDK 57 pin is **5.1.0**, not npm's 6.1.0) → **expo-sharing** (`shareAsync`). Saving straight to Photos: **expo-media-library** with `requestPermissionsAsync({ writeOnly: true })` (add-only). | `NSPhotoLibraryAddUsageDescription` is set by the media-library plugin's `savePhotosPermission` (ruling 26: the share sheet's "Save Image" crashes without it). | docs.expo.dev/versions/latest/sdk/media-library; `expo/bundledNativeModules.json` |
| S14 | **Photo picker** | **expo-image-picker** `launchImageLibraryAsync` (PHPicker: **no library permission needed** on iOS 14+), plugin `photosPermission: false`, `preferredAssetRepresentationMode: 'current'`. | Keeps "never ask for library access" (02 D5). `'current'` avoids transcoding, which matters for the SHA path. | docs.expo.dev/versions/latest/sdk/imagepicker |
| S15 | **Small native pieces** | expo-haptics, expo-image, expo-symbols (SF Symbols on iOS; Material Symbols on Android and web only if you pass a Material name, see T21), **expo-blur** (the design system's `IconButton` fallback and the camera countdown backing, 03 §4.5), expo-speech (the spoken 3-2-1), expo-web-browser (`SFSafariViewController`), expo-font (Archivo, embedded at build time), expo-dev-client, expo-build-properties (iOS deployment target 26.0). | All first-party Expo modules pinned by SDK 57. `ts/design-system/components/IconButton.tsx` imports `expo-blur`, so it must be installed before the design system type-checks in the app. | docs.expo.dev/versions/latest/sdk/symbols; `expo/bundledNativeModules.json` |
| S16 | **On-device vision** | **A local Expo module `modules/kitted-vision` in Swift** (Expo Modules API) wrapping Apple Vision: body pose → neck-down crop, face rectangles → pixelation, person count, ImageIO re-encode (metadata stripped), SHA-256 of the original bytes. Android later: the same JS interface on ML Kit in Kotlin. | No third-party SDK on iOS, nothing downloaded, and it is exactly the pipeline in 03 §8. **Demo: a stub** (the demo crops with the mockup's PH table). | docs.expo.dev/modules/get-started |
| S17 | **Declared Age Range** | **expo-age-range** (first-party, 57.0.5): `requestAgeRangeAsync({ threshold1: 18 })`, `isEligibleForAgeFeaturesAsync()` (iOS 26.2+), `getRequiredRegulatoryFeaturesAsync()` (iOS 26.4+). Entitlement `com.apple.developer.declared-age-range`. **No custom native module needed.** Demo: stub behind `AgeAssurance`. | Replaces the original handoff's open decision #4's "small native module". The 26.4 call compiles once Xcode is ≥ 26.4, which S3 requires anyway. | docs.expo.dev/versions/latest/sdk/age-range |
| S18 | **App Attest (M4)** | **@expo/app-integrity** (first-party, 57.0.2): `generateKeyAsync`, `attestKeyAsync`, `generateAssertionAsync`, `isSupported`. Not in the Simulator. | No custom module needed. | docs.expo.dev/versions/latest/sdk/app-integrity |
| S19 | **Tests** | `@kitted/core`: the runner its own `package.json` ships with (pure TS, runs in Node, no simulator). App: **Jest** with `jest-expo` (57.0.5) + `@testing-library/react-native` + `expo-router/testing-library`. **E2E and screenshots: Maestro** CLI (2.11.0, Sep 29 2026; needs Java 17+, **iOS Simulator only, no physical iPhones**). | Maestro replaces XCUITest. `launchApp.arguments` arrive in iOS `UserDefaults`, which matches our demo arguments (§5.2). | docs.maestro.dev (quickstart + "ask" answers); GitHub `mobile-dev-inc/maestro` release cli-2.11.0 |
| S20 | **Builds and OTA** | Local builds with `npx expo run:ios` (Continuous Native Generation: `ios/` and `android/` are generated and **not committed**). EAS Build optional (free plan: 15 iOS builds/month, low-priority queue). **No EAS Update for the beta.** | Avoids App Review questions about downloaded code (§7, T31). The rubric's remote `rubric.json` is data, not code, so it stays fine. | expo.dev/pricing; developer.apple.com/app-store/review/guidelines (2.5.2); docs.expo.dev/faq |

**Third-party (non-Expo) packages in this plan:** `react-native-view-shot` (pinned by Expo), `react-native-svg` (garment icons; pinned by Expo at 15.15.4), `@testing-library/react-native` (dev only), and later `react-native-purchases` (S8) and maybe `react-native-vision-camera` (S7 fallback). Everything else is `expo-*`, `@expo/*`, React Native itself, or our own code. **Ask the founder to approve this list in the P0 report** (the old "no third-party packages" rule was a SwiftUI rule; CLAUDE.md says "Expo SDK modules first, then what 05 names; ask before adding anything else").

### 1.2 This Mac (re-checked by running the commands on Oct 6, 2026)

| Item | Command | Result | OK? |
|---|---|---|---|
| macOS | `sw_vers` | 26.7 (25G229), Apple Silicon | Yes |
| Node | `node -v` | **v20.20.0** (Homebrew `node@20`, linked at `/opt/homebrew/bin/node`) | **No: SDK 57 needs ≥ 22.13** |
| npm / npx | `npm -v` | 11.6.0 | Yes |
| watchman | `watchman --version` | 2026.04.27.00 | Yes |
| CocoaPods | `pod --version` | 1.16.2 (Homebrew). Prints a warning that the terminal isn't UTF-8 (trap T27) | Yes, with `LANG` set |
| eas-cli | `eas --version` | 18.4.0 (24.11.0 is out; it says "Proceeding with outdated version") | Fine. Upgrade only with the founder's OK |
| Expo account | `eas whoami` | **An Expo account is already logged in on this Mac.** | Don't use it for builds without asking (§1.4) |
| Xcode | `xcodebuild -version` | **26.3** (17C529), iOS 26.2 SDK | **No: SDK 57 needs ≥ 26.4** |
| iOS platform / Simulator runtime | `xcrun simctl list runtimes`; `xcrun simctl runtime list` | **None.** 0 disk images. The 11 device entries (iPhone 17 Pro `EF7ADF2A-…`, etc.) are "unavailable, runtime profile not found" | **BLOCKER** |
| iOS builds of any kind | a tiny Swift package, `xcodebuild -destination 'generic/platform=iOS' build` | **Refused:** "iOS 26.2 is not installed. Please download and install the platform from Xcode > Settings > Components." (Simulator destinations fail the same way, per the earlier review.) | **BLOCKER: no local iOS build, not even for a real iPhone** |
| Android SDK | `ls ~/Library/Android/sdk` | Present: platforms android-36 / 36.1, build-tools 35–36.1, platform-tools (adb 1.0.41), emulator 36.4, and a **system image already downloaded**: `system-images/android-36.1/google_apis_playstore/arm64-v8a` (2.3 GB). No `cmdline-tools` (so no `avdmanager`). `ANDROID_HOME` is **not set**. | Partly |
| Android emulators | `emulator -list-avds`; `ls ~/.android/avd` | **No AVD** (empty list; the folder doesn't exist) | Not needed for the demo |
| Android Studio | `/Applications` | Installed | Yes |
| Java | `java -version`; `/usr/libexec/java_home -V` | Default **25.0.2** (Temurin). Also **17.0.18** (Homebrew `openjdk@17`) and 1.8 | Use 17 for Android builds (T28); 25 is fine for Maestro |
| Maestro | `which maestro` | Not installed | Install with the founder's OK (P7) |
| Google Chrome | `/Applications/Google Chrome.app` | Installed. Headless screenshots of the mockup tested and working (§6) | Yes |
| Python | `/usr/bin/python3` | 3.9.6. No Pillow, no ImageMagick | Use Chrome for image comparison (§6) |
| git / Homebrew | | 2.53.0 / 7.0.4. The repo is **not** a git repo yet | To do (§4.1) |
| Disk | `df -h /` | 61 GB free of 228 GB | Enough for Xcode 26.6 + an iOS runtime (§1.4) |

### 1.3 What you can do before any simulator exists

**Today, on Node 20.20, with no approval needed (verified Oct 6):**
- **The `@kitted/core` gate** (no npm install; uses the TypeScript 6.0.2 that ships inside the global eas-cli):
  ```sh
  cd /Users/eyu/Desktop/files/Kitted/handoff/ts/kitted-core
  TSC=/opt/homebrew/lib/node_modules/eas-cli/node_modules/typescript/bin/tsc
  node $TSC -p tsconfig.json --noEmit                                   # strict typecheck of src/ + test/
  node $TSC -p tsconfig.build.json --outDir "$TMPDIR/kcbuild" && node scripts/verify.mjs "$TMPDIR/kcbuild"   # ends "ALL CHECKS PASSED", 5,694/5,694
  ```
- **The design-system typecheck** against its stubs: `cd ../design-system && node $TSC -p tsconfig.json --noEmit`.
- git (§4.1), the pre-commit hook and the first commit; rendering the mockups to PNG with headless Chrome (§6); reading the docs and writing the P0 plan.

**Not on Node 20:** `create-expo-app` for SDK 57, `npm install` in the app, `npx expo start --web` (the web preview runs the SDK 57 CLI and Metro, so it needs Node 22 too), `npx expo lint`, Jest, `npx expo prebuild`, and Vitest for the core (Vitest 3 itself runs on Node 20, but installing it is part of the app's `npm install`). Don't try to "make it work" on Node 20 with `--force` or engine overrides: ask for the Node 22 switch first (§1.4 step 1).

With **Node 22 installed** (a 2-minute Homebrew change, §1.4 step 1), almost all of P0–P2 and P4–P5 can be built and checked **without any simulator**:

1. **`@kitted/core` and its parity tests** run in Node on the Mac. That's all of P1, the most important phase.
2. **The web preview:** `npx expo start --web` renders the app with React Native Web in Chrome. You build screens there and check them with **headless-Chrome screenshots at 402 × 874 @3x** (§6) or with the in-app browser pane (`preview_start` with a `.claude/launch.json` entry that runs `npx expo start --web --port 8081`). On this Mac Chrome's system font **is SF Pro**, so text metrics come close to iOS. It is **not iOS** (trap T21): no Liquid Glass, no native tabs, no formSheet, no Dynamic Type ramps, no SF Symbols (blank icon boxes unless you add Material names), no SQLite (in-memory repository instead). Treat web as the layout, copy and logic loop, and the Simulator as the truth.
3. **Typecheck, lint and Jest** for the app (`npx tsc --noEmit`, `npx expo lint`, `npx jest`).
4. **`npx expo prebuild --platform ios --no-install`** generates `ios/` so you can read the generated `Info.plist` and entitlements (permission strings, URL scheme, fonts, no `aps-environment`) before anything builds (T29, T30).
5. git, the hook, the first commit; rendering the mockups to PNG (§6).

**What waits for an iOS runtime (or a real iPhone, see below):** `npx expo run:ios`, NativeTabs and the glass tab bar, formSheets, the real fonts and Dynamic Type, SQLite, notifications, Maestro flows, simulator screenshots and the accessibility pass.

### 1.4 How to unblock (ask first; wait for a clear yes on each; never handle his credentials)

Ranked by what it unlocks per minute of his time:

1. **Node 22 (needed for everything; about 2 minutes, roughly 30 MB).** Ask: "Expo SDK 57 needs Node 22. OK to run `brew install node@22`, then `brew unlink node@20 && brew link --overwrite --force node@22`?" Then check `node -v` (22.x), `npm -v`, and that `eas --version` still works (global packages live in `/opt/homebrew/lib/node_modules`).
2. **Xcode 26.6 + the iOS 26 platform (needed for every iOS build; the biggest download).** SDK 57 requires Xcode ≥ 26.4, and no iOS build works without the platform component.
   - Xcode 26.6 comes from https://developer.apple.com/download/all/ (he signs in with his own Apple ID; you never type it). Check the size on that page and tell him before he starts. The Mac App Store would give Xcode 27 instead (S3; workable with `ios.enableSceneSupport`, but not the recommendation).
   - Install it as `/Applications/Xcode-26.6.app` next to 26.3. He runs `sudo xcode-select -s /Applications/Xcode-26.6.app/Contents/Developer` himself (it needs his password), then `xcodebuild -runFirstLaunch`.
   - Then the platform + Simulator runtime: `xcodebuild -downloadPlatform iOS` (about 8–10 GB from Apple, 20–40 min; or Xcode → Settings → Components). 61 GB is free; two Xcodes plus a runtime fit, and 26.3 can be deleted later (his call).
   - Then check: `xcodebuild -version` (26.6), `xcrun simctl list runtimes` lists iOS 26.x, `xcrun simctl list devices available` shows an iPhone 17 Pro. If not: `xcrun simctl create "Kitted 17 Pro" "iPhone 17 Pro" <runtime id from the list>`.
   - Suggested message: "Expo's current SDK needs Xcode 26.4 or newer, and this Mac has 26.3 with no iOS platform installed, so nothing iOS can build yet. Can you download Xcode 26.6 from developer.apple.com/download/all (signed in as you), then approve `xcodebuild -downloadPlatform iOS` (about 8–10 GB)? Meanwhile I'll build the scoring engine and the screens in the web preview."
3. **Run on his iPhone with a development build.** Needs step 2 too (the device build fails without the iOS platform, verified above). Then he signs in to Xcode with his Apple ID (Settings → Accounts; a free "Personal Team" works for 7-day dev builds, but not for In-App Purchase, App Attest or the Declared Age Range entitlement), turns on Developer Mode on the phone, plugs it in, and you run `npx expo run:ios --device`. Useful for the real camera in M1; not needed for the demo.
4. **EAS cloud builds** skip local Xcode, but only help partway: a Simulator build (`ios.simulator: true` profile) still needs a local runtime to run it, and a build for his iPhone needs the **paid** Apple Developer Program ("This method requires a paid Apple Developer account"). An Expo account is already logged in on this Mac; still **ask before starting any EAS build** (it uses his free-plan quota of 15 iOS builds a month). If he ever needs to log in again, he types `eas login` himself.
5. **Android AVD (later; no download needed).** The Android 36.1 Google Play arm64 image is already on disk. He can create the AVD in Android Studio → Device Manager → Create Virtual Device → Pixel → pick the "API 36.1 Google Play" image. Set `ANDROID_HOME=$HOME/Library/Android/sdk` and `JAVA_HOME=$(/usr/libexec/java_home -v 17)`. Not part of the iOS demo.

**Deployment target:** iOS **26.0** (ruling 3, app-build-spec §1.1), set through `expo-build-properties` (`ios.deploymentTarget: "26.0"`). SDK 57's own floor is iOS 16.4; keeping 26.0 means one look (Liquid Glass) and no iOS 18 branches.

### 1.5 Declared Age Range is no longer a Swift problem
The SwiftUI-era finding (the 26.4 regulatory API isn't in Xcode 26.3's SDK) is now moot: Xcode ≥ 26.4 is required for SDK 57 anyway, and `expo-age-range` wraps both the 26.0 and 26.4 calls (S17). For the demo, keep it behind an `AgeAssurance` interface with a stub. Real calls go in at M4 and need the entitlement (paid Developer Program) and a real device ("simulator behavior may be unreliable"). README open decision #4 already says this.

---

## 2. Goal and definition of done

The demo is **done** when all of the following are true. Check each one and report it (§9).

1. **All 20 mockup screens can be reached in the iOS Simulator** (iPhone 17 Pro, 402 × 874 pt). They match the mockup's layout, spacing and copy in **light and dark mode**, apart from the deliberate deviations in §3.4. You can reach each one through the real flow **and** through a demo deep link (`kitted://demo/screen/<n>`, §5.2). The 20 screens:

   | # | Screen | Phase | # | Screen | Phase |
   |---|---|---|---|---|---|
   | 1 | Welcome | P4 | 11 | Partial check + shoe snap | P2 |
   | 2 | Pick looks | P4 | 12 | Stylist home | P2 |
   | 3 | Basics | P4 | 13 | Outfit idea | P5 |
   | 4 | Consent | P4 | 14 | Notifications (lock screen) | P6 |
   | 5 | Camera | P3 | 15 | Closet | P5 |
   | 6 | Reading (inline card in the chat, ruling 13) | P3 | 16 | Lookbook | P5 |
   | 7 | Result | P2 | 17 | You | P5 |
   | 8 | Why this score (sheet) | P2 | 18 | Paywall | P6 |
   | 9 | Not quite right? (sheet) | P2 | 19 | Limit reached | P6 |
   | 10 | Re-check, the "aha" | P2 | 20 | Share card | P6 |

   Until the runtime exists, the same 20 must be reachable in the **web preview** at `http://localhost:8081/demo/screen/<n>`, with the iOS-only differences in T21 noted.
2. **The fit check works end to end on bundled photos.** You pick a demo photo, see the staged reading, get a scored card, change the occasion and get an instant re-score. Scoring is **real `@kitted/core` code**: every case in `handoff/fixtures/rubric_parity.json` matches `rubric.py`, and every demo photo's score matches `expected_scores.json`.
3. **Not quite right?** corrects a field and re-scores with no network. **Re-check** on the p01 before/after pair shows the "after" score and the delta. **Partial check** on a shoes-cut-off photo shows "Partial check: shoes not included" and the snap / pick-from-closet / skip row, and finishing it re-scores in place.
4. **Closet, Lookbook and You are filled from `seed.json`**, and new fit checks add to them (auto-added closet items with Undo, the look in Lookbook, the day in the calendar).
5. **The paywall works with the demo store** (`DemoStore` behind the `Entitlements` interface: fake products, "Demo: no real purchase", flips a local Pro flag). The Limit card shows after the free check is used. Real purchases come at M4 (S8).
6. **No network is needed.** No `fetch` outside the Debug-only `DirectGeminiReadingSource`, fonts are embedded, and the demo build works with the Mac's Wi-Fi off (a Release-configuration demo build embeds its JS bundle, §5.1).
7. **Tests are green:** `@kitted/core` tests (100% of parity cases), app Jest tests, typecheck and lint, and **3 Maestro flows** on the Simulator. The accessibility pass (P7) is done with Xcode's Accessibility Inspector audit on the main screens, with exceptions written down.

---

## 3. Ground rules

### 3.1 Product rules (locked; never break these)
- **Never rate faces, bodies, weight, skin, height or attractiveness.** Scores are about clothes only. Card text and VoiceOver labels never describe the body. Traditional and cultural garments are "not rated" ("Your kurta isn't rated. I score everything else.").
- **"Your stylist," never "AI stylist"** in UI labels. The one exception is the AI disclosure line (ruling 17): one line in consent and in the first chat message says the stylist is an AI.
- **No RPG classes, E→S ranks, XP, quests, streak chains or anime theme.** No emoji in the UI. The look is clean and premium.
- **Photos stay on the phone.** The demo never uploads anything. Photos in the UI are **neck-down crops** (ruling 10 and the "photos in the UI" line in brainstorm/13 §2). The full-face original is never stored (ruling 11 default).
- **18+ by default** (ruling 1: FOUNDER DECIDES, default 18+, US only). The birth-year wheel starts **blank**. Under 18 → a stop screen ("Kitted is for ages 18 and up."). Read the minimum age from `rubric.json → config.minAge` (18), not a hard-coded number.
- **What isn't in the photo never costs points.** A partial card always says so. Today's maximum score is **9.5** (rubric v3), for partial and full checks alike.
- **Free tier:** 1 fit check a day (with one re-check included) and 5 questions a day. Everything that runs on code is free. **Pro copy is "Up to 10 fit checks and 50 questions a day,"** never "unlimited" (ruling 25).
- **At least one free fix** whenever any fix exists (ruling 20). Closet-swap fixes appear only when a matching closet item exists.
- **Score words** (ruling 24): ≤ 5.5 "Needs a fix" · 6–6.5 "Getting there" · 7–7.5 "Put together" · 8–8.5 "Sharp" · 9–9.5 "Dialed in". Always show the number **and** the word.
- **Tabs:** Stylist · Closet · Lookbook · You. **Do things in Stylist; look at things in the other tabs.** No tab acts as a button.
- **Notifications:** exactly 3 kinds, all local. Never "we miss you."
- **Navigation must hold up against Apple's HIG and the UX checklist in `research-context.md` §C14.** Every full-screen view has an X from the first frame. One modal at a time.

### 3.2 Code rules
- **TypeScript strict** everywhere (`"strict": true`, the template's default), plus `noUncheckedIndexedAccess` in `@kitted/core`. No `any` in core; `unknown` + parsing at the edges (reading JSON, seed, deep-link params).
- **React function components + hooks.** Simple screens read from the data layer directly. **Each complex flow (FitCheck, Camera, Onboarding) is one reducer with an explicit state union** (`{ kind: 'idle' } | { kind: 'reading', stage } | …`, app-build-spec §2.1), in `src/features/<flow>/machine.ts`, unit-tested without React. No global state library: a ~30-line store on `useSyncExternalStore` covers the router's cross-tab action (§5, P0). The template has the React Compiler on; keep it.
- **`@kitted/core` is pure TypeScript:** no React, no React Native, no Expo imports, no `Date.now()` (time comes in through a `Clock` argument), no randomness. It runs the same in Node, Jest, the web preview and Hermes. Ordered data is arrays, never object-key order where order matters (T17). Rounding is `Math.floor(x*2 + 0.5)/2` and `Math.floor(x + 0.5)`; JS `number` is the same IEEE-754 binary64 as Python's float, so the parity fixtures hold.
- **Storage:** expo-sqlite with `PRAGMA user_version` migrations from day 1 (V1). Every column has a default, enums are stored as their string values, JSON blobs (readings, fixes, styles) as TEXT, no UNIQUE constraints beyond primary keys (keeps a later iCloud/CloudKit or server sync possible). `@kitted/core` owns the value types (`Reading`, `Garment`, `RubricResult`, `Fix`, `FixSuggestions`, `ClosetItem`); `src/data/` maps rows to and from them.
- **Everything that talks to the outside world sits behind an interface** with a demo implementation: `ReadingSource`, `CameraSource`, `Entitlements`, `QuotaService`, `Clock`, `AgeAssurance`, `NotificationScheduler`, `ImagePrep`. Live implementations are added in P8 or later.
- **Platform files:** anything iOS-only gets a `.web.tsx`/`.web.ts` sibling for the preview (`@expo/ui` controls, SQLite repository, secure store, glass, haptics no-ops). Never put `Platform.OS === 'web'` checks inside product logic.
- **Dependencies:** install native packages only with `npx expo install <pkg>` so you get the SDK 57 pins. Only the list in §1.1; ask before anything else.
- **No API keys in the repo, ever.** `EXPO_PUBLIC_*` variables are **inlined into the JS bundle** and readable by anyone, so a real Gemini key never goes in one for a shipped build. The Debug-only dev key (P8) lives in the untracked `app/.env.development.local`, and the release guard (P8) greps the exported bundle. The demo needs no key.
- **Private photos are never committed.** Ignore all of `inputs/` (`fitcheck-photos/`, `mirror-fit-check-1/`, `mirror-fit-check-1-m12-only/`, `speed-probe-8/`; the mirror sets are other people's photos from the web) and any image under `extraction-test/results/`. The 12 images in `mockups/img/` are free-license stock (Pexels/Unsplash) and may be committed and bundled **for the demo only**. Swap them for the founder's own photos before the App Store (app-build-spec §7.1).
- **All UI strings in `src/i18n/en.ts`**, keyed by the copy-deck keys in `02` §5, with plurals through `Intl.PluralRules` ("1 fit" / "37 fits"). No string literals in components.
- **Icons:** SF Symbol names from `03` §7 through expo-symbols (`ts/design-system/symbols.ts`, SF names only today; add a web/Android Material name per key when you need icons on web, `06` §4). Custom drawing (react-native-svg) only where the mockup has something SF Symbols lacks (garment tiles, silhouette, seams).

### 3.3 Working rules
- **Small commits**, one per finished piece, with clear messages. End each commit message with the attribution line from your environment's instructions, if there is one.
- **Run the checks before moving on:** `npm run check` (typecheck + lint + core tests + Jest, §5.1) after every change; `npx expo run:ios` after any native change (new package, config plugin, `app.config.ts`, the native module). Never leave a phase red.
- **Compare against the mockup after each screen** (§6), in light and dark mode: on web first, on the Simulator once it exists. Fix differences over 4 pt before moving on.
- **Ask the founder only for real taste or risk decisions** (the FOUNDER DECIDES items, anything that costs money, downloads or installs, a new dependency, pushing to GitHub, any EAS build). Settle everything else yourself using the docs, and write down what you decided in `handoff/DECISIONS-LOG.md`.
- **Keep docs in sync.** If you change a decision, say so in your phase report. Don't edit `CLAUDE.md` unless the founder asks ("Update CLAUDE.md with what we decided today").
- The founder likes **plain language, honest critique and concrete recommendations**, not open questions.

### 3.4 Where the demo deliberately differs from the mockup
These come from rulings and beat the mockup:
- **Photos:** neck-down crops in chat bubbles, cards, Lookbook and the share card. The mockup shows full frames with a blurred head. Screen 6's upload notice stays, worded "Only this is sent" (ruling 13).
- **Screen 6 Reading:** an inline skeleton card in the chat with the mockup's content (piece tags, steps, occasion chips), not its own screen (ruling 13).
- **Mono labels:** the iOS system monospaced font (SF Mono), sentence case, ≥ 12 pt instead of uppercase DM Mono (ruling 29; `03` §3.3 and `ts/design-system/typography.ts` agree, with an uppercase switch if the founder wants the mockup look). Archivo for the score numbers, the stat numerals (open founder decision, default yes) and the wordmark. SF Pro everywhere else, including prices and the height stepper.
- **Archivo is static cuts, not the variable font** (React Native on SDK 57 can't set variable axes; `ts/design-system/fonts.ts` explains it): Condensed SemiBold (width 75) for scores, so numerals are a little wider than the mockup's width 70 unless you cut an exact instance with fontTools (03 §3.4).
- **Basics:** the birth year is blank, not "2005" (ruling 28).
- **Paywall and Limit copy:** "Up to 10 fit checks and 50 questions a day" replaces "Unlimited questions" (screen 18) and "Go unlimited" (screen 19) (ruling 25). The paywall has 2 pages: his result + Pro, then the plans page (ruling 23). **There is no `SubscriptionStoreView` in React Native**, so page 2 is our own layout and must carry everything Apple's view used to (P6, Guideline 3.1.2). The billed price ($29.99/year) is the most prominent price.
- **Consent:** use the exact text in `inputs/app-store-and-age-rules.md` §3 (ruling 16). Name the provider from config. Don't use "we never store it."
- **No account anywhere.** No Sign in with Apple, and no "I've used Kitted before" (ruling 8).
- **Sheets** are the system iOS 26 sheet (react-native-screens `formSheet` uses `UISheetPresentationController`, which iOS 26 draws inset and floating at partial detents), even if the mockup draws them full width.
- **The navigation bar subtitle** (Stylist's "Re-check included") is a custom `headerTitle` (title + subtitle) because the stable native stack has no subtitle option on SDK 57 (T25).

The mockup is already drawn in **true points**: `.screen` is 402 × 874 CSS px inside a `zoom:.735` phone, buttons are 36/50, the tab bar is 62, the nav bar is 44. **1 CSS px = 1 pt = 1 React Native layout unit.** Measure spacing straight from the CSS.

---

## 4. Environment and project setup, step by step

Do §4.1 now. §4.2 onward needs Node 22 (§1.4 step 1).

### 4.1 Git
CLAUDE.md says to set up git when app code starts. That's now.
```sh
cd /Users/eyu/Desktop/files/Kitted
git init -b main
```
Write `/Users/eyu/Desktop/files/Kitted/.gitignore`:
```
# secrets: never committed
.env
.env.*
!.env.example
app/.env*
!app/.env.example
proxy/.dev.vars
*.p8
*.p12
*.cer
*.key
*.pem
*.jks
*.keystore
*.mobileprovision
# Expo / React Native (Continuous Native Generation: ios/ and android/ are generated)
node_modules/
app/ios/
app/android/
app/.expo/
app/dist/
app/web-build/
app/expo-env.d.ts
*.tsbuildinfo
.metro-health-check*
npm-debug.*
app/modules/*/build/
app/packages/*/dist/
# build output and screenshots
app/build/
app/screenshots/
*.ipa
*.apk
*.aab
*.xcarchive
*.dSYM.zip
DerivedData/
# Worker (later)
proxy/node_modules/
proxy/.wrangler/
# private photos (people's images never go to GitHub)
inputs/
extraction-test/results/**/*.jpg
extraction-test/results/**/*.jpeg
extraction-test/results/**/*.png
extraction-test/results/**/*.heic
# misc
.DS_Store
__pycache__/
*.pyc
```
`create-expo-app` also writes its own `app/.gitignore`; keep it (it ignores `/ios` and `/android` too). Don't ignore `mockups/img/` (stock) or `handoff/fixtures/` (JSON, no photos). Before the first commit, run `git status --ignored` and `git add -n .`. Make sure nothing from `inputs/` is listed, and run `find . -name '*.jpg' -not -path './inputs/*' -not -path '*/node_modules/*'`, which today finds only the 12 `mockups/img` files (plus their copies in `app/assets/demo-photos/` once you make them).

**Pre-commit hook** (`.git/hooks/pre-commit`, then `chmod +x`). **Trap T13:** app-build-spec says to block the literal 4-letter key prefix, but that prefix appears in `app-build-spec.md` itself, so match the full key shape:
```sh
#!/bin/sh
if git diff --cached -U0 | grep -E '^\+' | grep -qE 'AIza[0-9A-Za-z_-]{35}'; then
  echo "Blocked: staged change contains something shaped like a Google API key."; exit 1; fi
if git diff --cached --name-only | grep -qE '^inputs/|(^|/)\.env($|\.)|^app/(ios|android)/'; then
  echo "Blocked: private photos, an env file or generated native folders are staged."; exit 1; fi
```
(`.env.example` files are allowed: change the second pattern if you add one.) Then make the first commit of the existing docs and scripts ("Docs, research and extraction test before app code"). **Don't create a GitHub remote or push** until the founder says so (private repo).

### 4.2 Create the Expo project (needs Node 22)
**Do it in this order** (each step assumes the one before it):
1. `node -v` prints v22.13 or later (§1.4 step 1). If not, stop and ask.
2. Create the project without installing:
   ```sh
   cd /Users/eyu/Desktop/files/Kitted
   npx create-expo-app@latest app --template default@sdk-57 --no-install   # create-expo-app 5.0.0; template expo-template-default@57.0.29
   ```
3. Edit `app/package.json` **before the first install**: `"name": "kitted"`, `"private": true`, `"workspaces": ["packages/*"]`, and add `"@kitted/core": "*"` to `dependencies`.
4. Copy the core in (§4.4): `mkdir -p app/packages && rsync -a --exclude node_modules --exclude .verify-build handoff/ts/kitted-core/ app/packages/kitted-core/`, then **delete `app/packages/kitted-core/test/vitest-shim.d.ts`** (the real vitest and @types/node arrive with the install).
5. `cd app && npm install` (installs the template, the workspace and the core's dev tools: vitest, @types/node, TypeScript ~6.0.3). Then `npm ls react-native` shows one copy, and `npm test --workspace @kitted/core` passes **5,694 of 5,694** before you write any app code.
6. Copy the design system in (§4.5): `rsync -a ../handoff/ts/design-system/ src/design-system/`, then **delete `src/design-system/_stubs/` and `src/design-system/tsconfig.json`**, and run `npx expo install expo-blur` (the only module it needs that the template lacks).
7. Delete the template's example screens (next bullet), install the P0 packages (below), then `npx tsc --noEmit` and fix whatever the real types flag in `src/design-system/` (the stubs were written from the docs).
- The SDK 57 default template already has: `expo-router` with routes in **`src/app/`**, `NativeTabs` (`src/components/app-tabs.tsx`) with a web fallback (`app-tabs.web.tsx` on `expo-router/ui` headless tabs), TypeScript ~6.0.3 with the `@/*` → `src/*` path alias, typed routes and the React Compiler on, `expo-glass-effect`, `expo-symbols`, `expo-image`, `@expo/ui`, `expo-font`, `expo-web-browser`, react-native-web.
- Delete the template's example screens and components (`src/app/index.tsx`, `explore.tsx`, `src/components/*`, `src/constants/theme.ts`, `src/hooks/*`, `scripts/reset-project.js`). Don't run `reset-project`; it moves files into `app-example/`.
- Install what P0 needs (all via `npx expo install`, so versions follow SDK 57):
```sh
npx expo install expo-dev-client expo-build-properties expo-sqlite expo-secure-store expo-file-system \
  expo-crypto expo-haptics expo-constants expo-linking react-native-svg
npx expo install jest-expo jest @types/jest @testing-library/react-native -- --save-dev
```
  Later phases add: P2 `expo-image-picker` (keep its `cameraPermission` equal to the camera string, DECISIONS-LOG #53); P3 `expo-speech`; P6 `expo-notifications react-native-view-shot expo-sharing expo-media-library`; P8 `expo-age-range` (stub only in the demo). M1+: the camera choice (S7); M4: `@expo/app-integrity`, `react-native-purchases` (S8, founder approval).
- `npx expo lint` once to set up ESLint with `eslint-config-expo` (it installs it; that's part of this setup).
- **npm workspaces** (step 3): `app/` is both the Expo project and the workspace root. Expo's Metro config handles workspaces by itself since SDK 52; no `metro.config.js` changes needed. Check `npm why react-native` shows one copy (duplicate React Native or React in one app is unsupported).
- **Keep the core's tests out of the app's tools:** in `app/tsconfig.json` add `"exclude": ["node_modules", "packages"]` (app files that import `@kitted/core` still type-check its `src/`; the core's own `npm run typecheck --workspace @kitted/core` covers its tests), and in `jest.config.js` use `preset: 'jest-expo'` with `testPathIgnorePatterns: ['/node_modules/', '<rootDir>/packages/']` so Jest doesn't pick up the Vitest files in `packages/kitted-core/test/`.

### 4.3 Folder layout
```
/Users/eyu/Desktop/files/Kitted/app/
  package.json (workspaces)  app.config.ts  eas.json (later)  tsconfig.json  jest.config.js
  src/
    app/                      ← expo-router routes (file = screen)
      _layout.tsx             root Stack: providers, the gate (Stack.Protected: age stop → onboarding → tabs), every modal/sheet route
      +native-intent.tsx      rewrites incoming kitted:// links (demo links, notification taps)
      (tabs)/_layout.tsx      NativeTabs: stylist · closet · lookbook · you
      (tabs)/_layout.web.tsx  web-preview tab bar (expo-router/ui headless tabs; preview only)
      (tabs)/stylist/_layout.tsx  + index.tsx                     Stack, inline title (S1)
      (tabs)/closet/_layout.tsx   + index.tsx, item/[id].tsx, starter.tsx            (C1, C2, C5)
      (tabs)/lookbook/_layout.tsx + index.tsx, look/[id].tsx, moves.tsx              (L1, L2, L3)
      (tabs)/you/_layout.tsx      + index.tsx, profile.tsx, knows.tsx, settings.tsx, plan.tsx,
                                    notifications.tsx, privacy.tsx                     (Y1–Y7)
      onboarding/_layout.tsx  + welcome.tsx, example.tsx, looks.tsx, basics.tsx, consent.tsx   (O1–O5, fullScreenModal)
      age-stop.tsx            (O4)
      camera.tsx  shoe-snap.tsx  photo/[checkId].tsx  share/[checkId].tsx            (fullScreenModal)
      paywall/_layout.tsx     + index.tsx (P1), plans.tsx (P1b)                       (fullScreenModal with its own Stack)
      sheets/                 why/[checkId].tsx, correct/[checkId].tsx, added/[checkId].tsx, pick-shoes/[checkId].tsx,
                              edit-item/[id].tsx, rotation.tsx, next-buy.tsx, describe.tsx, fact/[id].tsx,
                              looks-by-name.tsx, birth-year.tsx, swap/[ideaId].tsx, tell-me/[checkId].tsx   (formSheet)
      demo/screen/[n].tsx     demo-only: sets up the scenario for screen n, then router.replace()s to it
      demo/gallery.tsx        demo-only: every design-system component in light/dark/AX sizes (the #Preview replacement)
    features/                 onboarding/ stylist/ camera/ fitcheck/ closet/ lookbook/ you/ paywall/ share/ notifications/
                              (screens' bodies, reducers/state machines, feature hooks)
    design-system/            copied from handoff/ts/design-system (tokens, typography, theme, symbols, fonts, components)
    services/                 readingSource/ (mock, directGemini [dev only], proxy [stub]), cameraSource/ (simulated, native later),
                              imagePrep/ (demo PH crop, native later), entitlements/ (demoStore, revenueCat later), quota.ts,
                              notifications.ts, clock.ts, ageAssurance.ts, photoStore.ts, haptics.ts
    data/                     db.ts (+ db.web.ts in-memory), migrations.ts, repositories (checks, readings, closet, looks,
                              chat, profile, facts, usage), seedLoader.ts, secure.ts (+ secure.web.ts)
    demo/                     demoArgs.ts (one parser for deep link / launch args / build extra), scenarios.ts, demoPhotos.ts
    i18n/                     en.ts (copy deck keys from 02 §5), plural.ts
    router/                   stylistAction store, routes.ts (typed helpers for cross-tab jumps)
  packages/
    kitted-core/              copied from handoff/ts/kitted-core: package.json ("name": "@kitted/core"), src/, test/, scripts/
  modules/
    kitted-vision/            local Expo module (Swift), §4.6
  assets/
    fonts/                    the static Archivo cuts + OFL.txt (ts/design-system/fonts.ts)
    demo-photos/              the 12 jpg + demo-photos.json (PH crop table)
    demo-readings/            from handoff/fixtures/readings (+ INDEX.json)
    seed.json  rubric.json    from handoff/fixtures
    images/                   app icon, splash
  e2e/                        Maestro flows (*.yaml)
  tools/mockshots/            preview.sh, compare.sh, isolate.js, compare.html, webshot.sh   (§6)
  screenshots/                (gitignored) mock/ web/ sim/ cmp/
```
The founder's note said "`app/` (routes per tab)": with SDK 57's template the routes folder is **`src/app/`**. Keep it there; don't also create a root `app/app/` folder (two route roots confuse Expo Router).

**Naming:** the readings are in the **v3 format** (`scene` + `garments[]`, see `extraction-test/schema.json`), so the types are `Reading`/`Garment`, not `V4…` (trap T5).

### 4.4 `@kitted/core`
- **It's finished and verified** (04 §4.0): copy `handoff/ts/kitted-core/` to `app/packages/kitted-core/` (§4.2 step 4) and use what it ships. Its `package.json`: `"name": "@kitted/core"`, `"private": true`, `"type": "module"`, `main`/`types`/`exports` → `./src/index.ts`, `"sideEffects": false`, no runtime dependencies, dev dependencies `vitest ^3.2`, `typescript ~6.0.3`, `@types/node ^22`. Scripts: `test` (`vitest run`, the 5 files in `test/`), `typecheck` (`tsc --noEmit`, strict + `noUncheckedIndexedAccess`, src and tests), `verify` (compile to `.verify-build/` + `scripts/verify.mjs`, no test runner needed), `gen:rubric` (regenerates `src/rubricData.ts` from `handoff/fixtures/rubric.json`).
- **The rubric data is already compiled in** as `src/rubricData.ts` (generated from `fixtures/rubric.json`; don't hand-edit it and don't copy `rubric.json` into `src/`). It has `"version": "3.1.0"`, `"engine": 3`, the tables, the rule amounts, the fix catalog and `config` = `{minAge: 18, freeChecksPerDay: 1, freeRechecksPerCheck: 1, freeQuestionsPerDay: 5, proChecksPerDay: 10, proQuestionsPerDay: 50, dayRollsOverAt: "04:00"}`. Read limits and the age floor from `RUBRIC_DATA.config` (or the bundled `assets/rubric.json`, §4.7). **Don't modify `rubric.py`**, and don't write another exporter.
- **The fixtures stay in `handoff/fixtures/`**, never copied into the app (`rubric_parity.json` is 6.1 MB). `test/helpers.ts`, `scripts/verify.mjs` and `scripts/gen-rubric-data.mjs` find them from either location: `../../fixtures` (inside `handoff/ts/`) or `../../../handoff/fixtures` (from `app/packages/kitted-core/`). `verify.mjs` also takes `KITTED_FIXTURES=<dir>`.
- Run (from `app/`): `npm test --workspace @kitted/core` (Vitest), `npm run typecheck --workspace @kitted/core`, `npm run verify --workspace @kitted/core`. All run in Node; no simulator.

### 4.5 Design system
Copy `handoff/ts/design-system/` → `app/src/design-system/` (§4.2 step 6; `fonts.ts` assumes this location and fonts in `app/assets/fonts/`). Then delete its `_stubs/` folder and its `tsconfig.json` (they exist only so it type-checks before the app exists), `npx expo install expo-blur`, and import it as `@/design-system` (the template's `@/*` → `src/*` alias). The header comment of `index.ts` and 03 §12 say the same. It holds the color tokens (light, dark, and Increase Contrast variants), the role map in `typography.ts` (each SF style passes the matching iOS `dynamicTypeRamp`), `fonts.ts` (the static Archivo cuts and their names), `symbols.ts` (SF Symbol → Material name for web/Android), `theme.tsx` (system appearance + the You › Appearance override + forced-dark subtrees) and the components (`KText`, `KCard`, `Icon`, `Seam`, …). Don't re-derive tokens from the mockup CSS; `03` and that folder own them.

### 4.6 `kitted-vision` local module (Swift stub in the demo)
```sh
cd /Users/eyu/Desktop/files/Kitted/app
npx create-expo-module@latest --local      # name it kitted-vision; it creates modules/kitted-vision/{ios,android,src,index.ts,expo-module.config.json}
# It asks questions interactively. If your shell can't answer prompts, write the stub by hand instead:
# expo-module.config.json ({"platforms":["apple"],"apple":{"modules":["KittedVisionModule"]}}), ios/KittedVisionModule.swift,
# ios/KittedVision.podspec (copy the shape from the Expo local-modules docs), and index.ts (requireNativeModule('KittedVision')).
```
Keep only iOS for now (`"platforms": ["apple"]` in `expo-module.config.json`; Android later). The demo stub exposes the final interface so the app code never changes:
```ts
// modules/kitted-vision/index.ts (shape; the Swift side returns "notImplemented" in the demo)
export type PrepareResult =
  | { status: 'ok'; uploadUri: string; neckDownUri: string; thumbUri: string; sha256: string;
      people: number; faceBoxes: number; pose: 'full' | 'upper' | 'none' }
  | { status: 'noPerson' | 'multiplePeople' | 'couldNotFrame' | 'notImplemented' };
export function prepare(originalUri: string): Promise<PrepareResult>;
```
```swift
// modules/kitted-vision/ios/KittedVisionModule.swift (stub)
import ExpoModulesCore
public class KittedVisionModule: Module {
  public func definition() -> ModuleDefinition {
    Name("KittedVision")
    AsyncFunction("prepare") { (uri: String) -> [String: Any] in ["status": "notImplemented"] }
  }
}
```
It's autolinked from `modules/`; it compiles at `npx expo run:ios`. The demo's `ImagePrep` uses the PH-table crops and never calls it; P8 fills it in (03 §8). Custom native code means **a development build, not Expo Go** (T23).

### 4.7 Bundled resources
- **Demo photos:** copy the 12 files from `/Users/eyu/Desktop/files/Kitted/mockups/img/` (p01a, p01b, s05, s09, s10, s12, s13, s14, s15, s22, s24, s25; 461–656 × 820 px) to `app/assets/demo-photos/`. **Precompute the neck-down crops from the mockup's own crop table:** `const PH={…}` near line 1341 of `kitted-mockups.html` gives each photo's `neck`, `foot` and `cx` as fractions of the image. Write them into `demo-photos.json` (`{id, neck, foot, cx, faceX, faceY, faceR}`) and crop at render time (an `expo-image` inside a clipping view with `contentPosition`/offsets), so the demo needs no Vision call. Add a `README` there: "Free-license stock for the demo only. Replace with the founder's own photos before App Store."
- **The SHA path (04 §8.3):** Metro serves `require('…jpg')` assets byte for byte (no re-encode, unlike an Xcode asset catalog), but **check it once**: hash the bundled file with expo-crypto at runtime and compare with `INDEX.json → photo_sha256`. If it differs, the photo-id path still works; log it.
- **Readings:** copy `handoff/fixtures/readings/*.json` (+ `INDEX.json`, `variants/`) to `assets/demo-readings/`; import them as JSON modules. `MockReadingSource` looks up a reading by demo photo id first, and by SHA-256 of the bytes second.
- **Seed:** copy `handoff/fixtures/seed.json` to `assets/seed.json`. `seedLoader.ts` fills SQLite on first launch or with `resetData`. Each scenario pins a "today" in America/New_York (the mockup's calendar is drawn for **Thu Oct 22, 2026**): `firstRun.now` = 07:38, `full.now` = 12:20. Drive it through the `Clock` interface (§5.2), never `new Date()` in features.
- **Fonts:** the static Archivo files listed in `ts/design-system/fonts.ts` (SIL OFL; the source URLs are in that file). **Tell the founder the file names, source and sizes before downloading.** Embed them with the `expo-font` config plugin, and refer to each by the exact name `fonts.ts` gives (T22). Ship `OFL.txt` (You › Settings › About › Acknowledgements). On web, the same files load at runtime through `useFonts` (the plugin only embeds them in native builds).

### 4.8 `app.config.ts`
Replace the template's `app.json` with a typed `app.config.ts` (it can read env vars at build time):
```ts
import type { ExpoConfig } from 'expo/config';
const demo = process.env.KITTED_DEMO !== '0';          // demo tools on unless KITTED_DEMO=0 (App Store builds)
const config: ExpoConfig = {
  name: 'Kitted', slug: 'kitted', scheme: 'kitted', version: '0.1.0',
  orientation: 'portrait', userInterfaceStyle: 'automatic',
  icon: './assets/images/icon.png',
  ios: {
    bundleIdentifier: 'com.trykitted.kitted',          // placeholder until the App ID exists; keep it only here
    buildNumber: '1', supportsTablet: false,
    infoPlist: {
      NSCameraUsageDescription: 'Kitted uses the camera to check your outfit. Your face is cropped out before anything is sent.',
      ITSAppUsesNonExemptEncryption: false,
    },
    // M4: entitlements: { 'com.apple.developer.declared-age-range': true, 'com.apple.developer.devicecheck.appattest-environment': 'production' }
  },
  web: { output: 'single', bundler: 'metro' },          // 'single' (SPA) for the preview; see T26
  plugins: [
    'expo-router',
    ['expo-build-properties', { ios: { deploymentTarget: '26.0' } }],
    // ['expo-font', { fonts: ['./assets/fonts/ArchivoCondensed-SemiBold.ttf', './assets/fonts/ArchivoCondensed-Medium.ttf', './assets/fonts/ArchivoExpanded-Bold.ttf'] }],
    //   ↑ uncomment once the founder OKs the download and the files exist (a missing file fails prebuild); until then
    //     typography falls back to SF Pro condensed / bold (03 §3.4 "Fallback").
    'expo-sqlite', 'expo-secure-store',
    // P2: ['expo-image-picker', { photosPermission: false, cameraPermission: false, microphonePermission: false }],
    // P6: ['expo-media-library', { photosPermission: false, savePhotosPermission: 'Save your Kitted card to Photos.', isAccessMediaLocationEnabled: false }],
    // P6: 'expo-notifications',
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
  extra: { demo },
};
export default config;
```
After any change here: `npx expo prebuild --platform ios --clean --no-install` and read `ios/Kitted/Info.plist` and `ios/Kitted/Kitted.entitlements` (permission strings, `CFBundleURLSchemes` = kitted, fonts, **no** `NSPhotoLibraryUsageDescription`, **no** `aps-environment`). The iOS privacy manifest (UserDefaults reason `CA92.1`, later the data types from app-build-spec §8 R2) goes in `ios.privacyManifests` here, not in a hand-edited file (the `ios/` folder is regenerated).

---

## 5. Phased plan

### 5.1 Shared commands (set these once and reuse them)
```sh
APP=/Users/eyu/Desktop/files/Kitted/app
BID=com.trykitted.kitted
SIM="iPhone 17 Pro"
cd $APP
# the one check to run after every change (put it in package.json "scripts.check")
npx tsc --noEmit && npm run typecheck --workspace @kitted/core && npx expo lint && npm test --workspace @kitted/core && npx jest
# web preview (no simulator needed). Run in the background, or via preview_start with .claude/launch.json
npx expo start --web --port 8081
# iOS (needs Xcode >= 26.4 + an iOS runtime)
npx expo run:ios --device "$SIM"                                  # dev build + Metro (fast refresh)
KITTED_DEMO=1 npx expo run:ios --device "$SIM" --configuration Release --no-bundler   # demo build, JS embedded, works offline
npx expo prebuild --platform ios --clean --no-install             # regenerate ios/ to inspect Info.plist / entitlements
# simulator control (simctl can't tap; use Maestro or the iOS Simulator tool for taps)
UDID=$(xcrun simctl list devices available | grep "$SIM (" | head -1 | grep -oE '[0-9A-F-]{36}')
xcrun simctl boot $UDID 2>/dev/null; xcrun simctl bootstatus $UDID -b; open -a Simulator --args -CurrentDeviceUDID $UDID
xcrun simctl status_bar $UDID override --time 9:41 --dataNetwork wifi --wifiBars 3 \
  --cellularMode active --cellularBars 4 --batteryState charged --batteryLevel 100
xcrun simctl terminate $UDID $BID 2>/dev/null
xcrun simctl launch $UDID $BID -resetData 1 -demoScreen 7 -demoLatency 0       # launch args → iOS UserDefaults (§5.2)
xcrun simctl openurl $UDID "kitted://demo/screen/9?latency=0"
xcrun simctl io $UDID screenshot --type=png $APP/screenshots/sim/07-light.png
xcrun simctl ui $UDID appearance dark                                          # or light
xcrun simctl ui $UDID content_size accessibility-extra-extra-extra-large       # AX5; "large" resets
xcrun simctl ui $UDID increase_contrast enabled
xcrun simctl addmedia $UDID $APP/assets/demo-photos/*.jpg
# Maestro (after the founder OKs installing it: brew tap mobile-dev-inc/tap && brew install mobile-dev-inc/tap/maestro)
maestro test e2e/onboarding.yaml          # screenshots land in the flow's artifacts; check `maestro test --help` for the output-dir flag
```
- iPhone 17 Pro screenshots are **1206 × 2622 px** (402 × 874 pt @3x), the same size as the mockup captures (§6). The status bar is overridden to 9:41 whatever the demo clock says.
- A **dev build** launched with `simctl launch` opens the dev-client launcher, not your screen; for screenshot runs and Maestro, use the **Release demo build** (embedded bundle). Use the dev build for day-to-day work with fast refresh.
- If an iOS Simulator tool is available in your session (for example `mcp__Claude_Code_iOS_Simulator__control`), call its **attach** action early so the founder can watch, and use it for taps and swipes.

### 5.2 Demo arguments (the SwiftUI launch-argument equivalents)
One parser, `src/demo/demoArgs.ts`, reads the same keys from three places. Precedence: **deep link > launch argument > build default**.
1. **Deep link query** (works everywhere: Simulator `xcrun simctl openurl`, Maestro `openLink`, the web URL): `kitted://demo/screen/19?now=2026-10-22T21:12:00&freeChecksUsed=1&latency=0`, web `http://localhost:8081/demo/screen/19?…`. `src/app/+native-intent.tsx` passes `kitted://demo/...` through to `/demo/...`.
2. **iOS launch arguments** (`xcrun simctl launch … -demoScreen 7 -demoLatency 0`, or Maestro `launchApp: { arguments: { demoScreen: 7 } }`): iOS puts `-key value` pairs into `UserDefaults`; read them with React Native's iOS-only `Settings.get('demoScreen')` (values arrive as strings). Verify this once in P0 and write the result in the P0 report.
3. **Build defaults:** `KITTED_DEMO` (env at build time → `app.config.ts extra.demo` → `Constants.expoConfig.extra.demo` via expo-constants) turns the demo tools on or off. Optional `EXPO_PUBLIC_DEMO_LATENCY` for local dev only.

| Key (deep-link name / launch-arg name) | Meaning |
|---|---|
| `resetData=1` / `-resetData 1` | Wipe SQLite, photos and the Keychain device ID (keeps the age flag unless `clearAge=1`), then reseed |
| `seed=full\|empty` / `-seed` | Scenario; `full` implies `skipOnboarding` |
| `skipOnboarding=1` / `-skipOnboarding` | Mark onboarding done |
| `/demo/screen/<n>` / `-demoScreen <n>` | Set up screen n's scenario, clock and state (04 §10.3), then route there |
| `latency=<s>\|real` / `-demoLatency` | Mock reading time; default 6.6, `0` for screenshots and Maestro, `real` = the photo's own latency |
| `now=<ISO>\|real` / `-demoNow` | Demo clock start, read in America/New_York when no offset |
| `freeChecksUsed=<n>` / `-freeChecksUsed` | Pre-use the free check |
| `pro=1` / `-pro` | Start as Pro |
| `theme=light\|dark` / `-theme` | Force the appearance (needed on web, where headless Chrome reports light) |
| `uiTesting=1` / `-uiTesting` | No animations, no haptics, no speech |
| `frame=1` (web only) | Fake iPhone 17 Pro safe areas (62 top / 34 bottom) through `SafeAreaProvider initialMetrics`, so web screenshots line up with the mockup |

**Defaults, so nothing is a guess:**
- **No arguments (fresh install, or after `resetData`):** the `firstRun` scenario = empty data, onboarding from O1, the scripted p01b story available (`04` §10.1). An App Store build (`KITTED_DEMO=0`) does the same, minus the story and every `demo/*` route.
- **`seed=empty`** = `firstRun`. **`seed=full`** = `scenarios.full`. A seed loads only when the store is empty or with `resetData`.
- **Clock (demo builds):** starts at the loaded scenario's `now` (07:38 or 12:20 on Thu Oct 22, 2026, America/New_York) and then ticks forward normally. `now=real` uses the system clock. App Store builds always use the system clock.
- **`/demo/screen/<n>`** picks the scenario, clock and state from `04` §10.3 by itself (5–10 → `firstRun` with onboarding marked done, playing the scripted p01b story up to that step with zero latency; 12 → `full`, clock 08:01, free check unused; 19 → `full`, clock 21:12, check used; 18 → `firstRun` after the re-check, paywall presented) and then navigates with the same router calls the real UI uses. Other keys given with it win.
- **`demo/*` routes exist only when `extra.demo` is true.** In an App Store build the `demo` routes redirect to `/` and `+native-intent` drops `kitted://demo/...`.

### 5.3 Every screen in `02-screens.md`, by phase
The 20 drawn screens are in the §2 table. The undrawn ones (`02` §3 and §4) go here, so nothing is left without a home:

| Phase | Undrawn screens and states (`02` IDs) |
|---|---|
| P0 | Router, tabs, placeholders for every ID below; G2 toast and G3 "Latest" pill as components |
| P2 | S6p partial + S10 Pick shoes; S7 "How I score" page; S11 Added items; S13 Photo viewer; S19a–f failure cards; S21 change not seen + "Tell me"; S22 dialed in; S23 not rated / unreadable / not clothed / "Which one is you?"; S25 Ask a question (mock answers, `04` §11); S26 Turn on fit checks; S27 support and refusals; G1 offline banner |
| P3 | S3 retake panel; S4 photo picker; S9 shoe snap camera (simulated); S18 camera off |
| P4 | O1e example check; O2n pick by name; O3w year wheel; O4 age stop; S14 first 3 moves; S15 notification ask |
| P5 | S20 outfit flow + S28 Swap one + S30 buy suggestion; S24 I bought something (Describe it real, photo path shows `item.demoOnly`); C1e, C2 item detail, C3 edit, C4 add, C4d describe, C5 Starter essentials, C6 Rotation explainer, C7 next best buy; L1a Looks, L1b Saved, L1e empty / Welcome back, L2 look detail, L3 Your moves; Y2 style profile, Y3 what your stylist knows, Y4 settings, Y5 plan & usage, Y6 notifications, Y7 privacy & data |
| P6 | P1b plans page + P1s states; S17h held check; N1–N3 payloads + S29 unopened-ideas question; S12 share card |

### P0 · Skeleton, tabs, design system, data (about 1.5 days)
**Build:** git + hook + first commit (§4.1). The project, workspaces, `@kitted/core` copied in with its tests passing, the design system copied in, the `kitted-vision` stub, `app.config.ts` (§4.2–4.8). **Root layout** = a `Stack` with `Stack.Protected` guards in this order (02 §1.1): age-blocked (secure-store flag) → `age-stop`; onboarding not done → `onboarding/*`; otherwise `(tabs)`. **Tabs** = `NativeTabs` with 4 triggers, always labeled: Stylist `bubble.left`, Closet `hanger`, Lookbook `square.grid.2x2`, You `person` (03 §7; `NativeTabs.Trigger.Icon sf=… md=…`; `symbols.ts` has no Material names yet, so add the 4 `md` names, `06` §2), `tintColor` = the accent token. Each tab has its own `Stack`; Closet, Lookbook and You use `headerLargeTitleEnabled: true` (the older `headerLargeTitle` is deprecated in expo-router 57's types), Stylist an inline title. **Router helpers** per `02` §1.4: `goToStylist(action)` sets the `pendingStylistAction` store and calls `router.navigate('/stylist')`; the Stylist screen consumes and clears it in an effect. Modals and sheets are routes in the root Stack (one at a time). The demo deep links and launch arguments (§5.2) open every one of the 20 screens, showing placeholders until they're built. **Data:** `migrations.ts` V1 with every table from app-build-spec §5 plus these **demo adjustments** (app-build-spec §5 predates the v3 lock and some rulings):
- `readings.reading_json` (TEXT) holds the **v3** reading (`scene` + `garments` + the demo-only `held_items`). `readings.source`: `full / lower / recheckMerged / corrected / userConfirmed` (the last is "Tell me", `04` §6). Readings are never updated in place.
- `profile.styles` is an ordered JSON array of `{name, weight}`, **never an object keyed by style** (the score depends on order, `04` §4.1). `dress_code` stays null in v1.
- `fit_checks.status` adds `held` (ruling 27). `fit_checks.is_first_check` drives the first-check rules. `fixes` = JSON of the core's camelCase `Fix[]` (as `suggestFixes()` returns them). **`seed.json` stores fixes in rubric.py's snake_case** (`to_raw`, `raw_gain`, `item_id`), so `seedLoader.ts` maps them (the field map is `fixToPy` in `packages/kitted-core/test/helpers.ts`, read backwards).
- `closet_items.garment_json` = the item's **v3 garment** (`seed.json → closet[].garment`), plus `hex` (tile color) and `starter_id`.
- `corrections.kind` adds `fixConfirmed` (`02` S21).
- `kv` table (or `expo-sqlite/kv-store`) for small preferences (appearance, last occasion, idea time).
- The web build uses `db.web.ts`: the same repository interface, in memory, seeded from `seed.json`.
**Done when:** `npm run check` is green with the core's parity count stated; the web preview shows 4 labeled tabs in light and dark (`theme=` param) and every `/demo/screen/<n>` opens its placeholder; `npx expo prebuild --platform ios --no-install` produces an `Info.plist` with the camera string, the `kitted` scheme and no library-read key. **Once the runtime exists:** `npx expo run:ios` launches to the 4 tabs with the **system iOS 26 glass tab bar** (not a custom one), `xcrun simctl openurl … kitted://demo/screen/9` works, `Settings.get` reads a launch argument, and the first two commits exist. Say plainly in the P0 report which of these were checked on web only.

### P1 · `@kitted/core`: the rubric port and parity tests (about 1 day, no simulator needed)
`handoff/ts/kitted-core/` is **already ported and verified** (5,694/5,694 parity on Oct 6, 04 §4.0). Your job is to **wire it in, run it under Vitest, add the missing pieces and own it**, not to rewrite it.
**Already in the package:** the v3 `Reading` types from `extraction-test/schema.json`; `RubricData`/`createRubric` (from `rubric.json`); `score(reading, { occasion, styles, boldness })` returning `rubric.py`'s keys in camelCase (`overall`, `rawScore`, `subscores`, `occasionAdj`, `credits`, `creditPoints`, `mistakePoints`, `rulesFired`, `advice`, `partial`, `notRated`, `reason`; the Python names are in `04` §4.1); `scoreWord`; the fix engine (`suggestFixes`: re-score a copy with the fix applied, ≥ 1 free fix, ≤ 3 fixes, gains ≥ 0.5); `recheckMerge` (match garments by category + type + color family); the partial merges (`mergeShoeSnap`, `mergeBottomSnap`, `pickShoesFromCloset`); corrections; Rotation. **Still to add in P1** (with tests, same no-I/O rules): outfit ideas (on top of `rotation`/`outfitValid`), the number check for explanation text, and `dayKey` (4 am rollover, including the Nov 1 DST change, with time passed in through a `Clock`).
**Port it exactly, including the quirks:** `round_half(x) = Math.floor(x*2 + 0.5)/2`, `nearest(x) = Math.floor(x + 0.5)` (never `Math.round` or `toFixed`); clamps `Math.max(1, Math.min(10, 10 − penalty))` and raw `Math.max(3, Math.min(10, 7.0 + credits − mistakes))`; **order matters** (keep Python's insertion order with arrays; don't rely on object key order for anything that is summed or listed, since integer-like keys reorder in JS); drop `certainty == "unsure"` garments and accessories, filter footwear when `shoes_visible` is false and bottoms+footwear when `framing == "upper_only"`, and **copy garments before the leg aliases** (`flare_bootcut → straight`, `barrel → wide`; Python mutates in place); empty `styles` → `DEFAULT_BAND`; default boldness `a_little`.
**Tests:** every case in `rubric_parity.json` (`overall` exactly equal, `rawScore` within 0.001, identical `rulesFired` order, `credits`, `partial`, `notRated`); every demo photo's default-occasion score equals `expected_scores.json`; fix engine (a free fix exists whenever any fix does); re-check (a "no change" retake keeps its score; the p01 pair goes up); Rotation (`rotation_expected.json`); dayKey. If a parity case fails, **fix the TypeScript, never the fixture.** If you think Python is wrong, tell the founder and leave both unchanged.
**Done when:** `npm test --workspace @kitted/core` passes 100% of the parity cases under real Vitest and you can state the count ("5,694 of 5,694"; the Oct 6 run used `verify.mjs` and a stand-in runner, never real Vitest), the new pieces have tests, and the package has no imports from `react`, `react-native` or `expo*` (`grep -rE "from '(react|expo)" packages/kitted-core/src` is empty).

### P2 · Stylist chat and the fit-check card (about 2 days; web first)
**Build:** the Stylist thread (a `FlatList` of messages, day separators, a composer pinned above the keyboard and the tab bar: camera · photos · "Ask your stylist…" · send) and the 4 starter chips (Check my fit · What should I wear? · I bought something · Ask a question). The `fitCheck` reducer with states `idle → preparing → reading(stage) → scored → explaining → done` plus `unreadable`, `notClothed`, `failed`, `limitReached`, `held`. The card (screen 7): photo, occasion chip (an `@expo/ui` `Menu` of the 7 occasions → instant re-score), `ScoreBlock`, `FixRow`s with an effort tag + "6.5 → 7.5", "Next level," "Added 4 to Closet · Review" with an `UndoToast`, Re-check · Share · Why · Not quite right?. The **template explanation** from the rules that fired (no explain call in the demo). **Why this score** (screen 8): a `formSheet` route, `sheetAllowedDetents: [0.78, 1]`, `sheetGrabberVisible: true`, an X in the title row; the rules in plain words from `rubric/v3.md`. **Not quite right?** (screen 9): `formSheet`, `sheetAllowedDetents: [1]`; chips → garment → field → value; it creates a new reading (`source: corrected`), never edits the original, re-scores (preview "Score stays 8.0" or "Score 8.0 → 8.5", `02` D9) and saves a correction. **Re-check** (screen 10): pick the "after" photo (p01a after p01b), run the merger, show "8.0 → 9.0 after 1 fix." **Partial** (screen 11): the standard card plus one row: Snap your shoes · Pick from Closet · Skip (ruling 21). All the other card states (app-build-spec §4.5). The photo library button opens `expo-image-picker` (no permission; `photosPermission: false`). VoiceOver: each card is one element (`accessible`) with `accessibilityActions` for Re-check, Share, Why, Not quite right?. **Stylist home** (screen 12) with the seed thread.
**Done when:** screens 7–12 match the mockup in both themes on web (and on the Simulator once it exists, including the real sheet detents), changing the occasion re-scores in under 100 ms, the same photo twice gives the same card (cache hit), a correction re-scores offline, and the partial label and its icon show.

### P3 · Camera, photo prep and the real reading (about 4 days; replanned Oct 7, DECISIONS-LOG #40)
The founder tests on his own iPhone with a development build (free Apple ID "Personal Team", 7-day installs), so P3 pulls the real camera (old M1) and the real Gemini reading (old M2) forward. The Simulator keeps the simulated camera and the mock reading, so the demo screens never need the network.

**A. Camera screen, Simulator-safe (≈1 day).** `CameraSource` interface; `SimulatedCameraSource` plays p01b as the "live" frame and steps the guide states (No one in frame → "Step back a little. Shoes in frame if you can." → Good, ruling 14). Screen 5 layout: fullScreenModal, dark tokens, X top-left, flash, Propped/Mirror switch, tip pill, body-outline `FramingOverlay` (dashed → solid on Good), shutter, flip, library button. Hold Good 0.5 s → 3-2-1 with haptics (`expo-haptics`), spoken count (`expo-speech`, optional, off by default) and VoiceOver announcements → capture. Manual shutter always works. On the Simulator a "Sample photos" strip stands in for the library. Camera-denied card (S18). Shoe snap (S9) and top-only partial reuse the screen with their tips and guides. **Done when:** screen 5 matches, and camera → reading → card runs on the Simulator with no network.

**B. Real camera in `kitted-vision` (≈1.5 days; on his iPhone).** Swift: `AVCaptureSession` preview as an Expo native view (front by default, flip to rear), Apple Vision body pose + face rectangles at ~10 fps → events to JS that drive the same guide states, capture to a file. Fallback if this passes 1.5 days: `react-native-vision-camera` v5 (S7). **Done when:** on his phone, propped 2–3 m away, the guide reaches Good and auto-captures; 10 propped + 10 mirror shots logged with any guide misfires.

**C. Photo prep (≈0.5 day, Swift in `kitted-vision`).** Fix orientation → SHA-256 of the original bytes → person count → crop to the person with the face cut off at the neck (pixelate any face box left as backup) → 1024 px long edge JPEG q0.8, metadata stripped. Saves the neck-down copy (2048 px) + a 400 px thumb on the phone; the full-face original is deleted. Library picks (`expo-image-picker`, no Photos permission) go through the same prep. Results: ok / noPerson / multiplePeople / couldNotFrame. **Done when:** a library photo of him comes back neck-down with no face, and the same photo twice gives the same hash.

**D. Real reading, dev builds only (≈1 day).** `DirectGeminiSource` implements `ReadingSource` with the locked config: gemini-3.8-flash, thinking off (`thinkingBudget: 0`), temperature 0, the v3 prompt + schema from `extraction-test/` (`prompt.txt`, `schema.json`, copied byte-for-byte; a test fails if they drift), streamed (`streamGenerateContent?alt=sse`) so pills appear as garments arrive. Key: `EXPO_PUBLIC_GEMINI_DEV_KEY` in `app/.env.local` (git-ignored), read only when `__DEV__`; a Release build with the key present fails the build. Same hash → cached reading (no call). Timers: hedge at 5 s, "Taking longer" at 9 s, give up at 14 s, failures never use a check. Real photos the bundle doesn't know now go to Gemini (instead of "This demo only knows its sample photos"); with no key they still say that. Ask/explain calls stay templates until later. **Done when:** 30 real checks from his phone with shutter-to-score times (target median ≤ 7 s, p90 ≤ 10 s), cost logged per check.

**Tests:** request builder and response parser (fixtures from `extraction-test/results`), prompt/schema drift, the crop math, the Release-key guard; Simulator screenshots for A; an on-phone checklist for B–D.

### MC · The morning and evening cards + "Scored for" (about 5.5 days + 0.5 after Apple enrollment; added Oct 7, DECISIONS-LOG #58–62; spec 02 "S1d", "S6s")
Built after the quick-fix batch and before Closet (it creates the outfit picker Closet reuses). Runs on demo weather until the paid developer program is active.

**Status (Oct 8):**
- **Done:** MC1–MC8, MC10, MC11. Demo screens 25–33; notes in DECISIONS-LOG #67.
- **Waiting:** MC9 (WeatherKit + location; needs the paid team) and the N1 tie-in (P6).
- **Open:** the founder's call on #66.

1. **MC1 · Core `weather.ts`** (0.25 d)
   - **Types:** `DayWeather` (now/high/low/morning feels-like °F, rain chance and the first rainy hour, condition) and `WeatherNeeds` (layer none/suggested/required/outer, rainSafe, removable).
   - **Functions:** `weatherNeeds(w)`; `weatherTip(reading, w)` (advice only); the template keys for the greeting and the why line; the season fallback by month.
   - *Check:* tests on every band edge (79/80, 64/65, 49/50, 34/35, rain 49/50%, swing 14/15); `scoreReading` gives an identical result with and without weather.
2. **MC2 · Core `ideas.ts`** (0.75 d)
   - **`closetState(closet, occasion)`** returns enough / thin / empty.
   - **`pickOutfit({ closet, occasion, styles, boldness, weather?, recentWear, dayKey, pin?, exclude? })`** returns item ids, the missing slot, why keys and an internal predicted score (never shown).
   - **How it picks:**
     - Enumerate the valid combos (`outfitValid`) and score each with the rubric for the occasion.
     - Filter by `weatherNeeds`.
     - Push down items worn in the last 2 days.
     - Break ties deterministically by a hash of dayKey + combo.
     - Prune to the top 4 per slot before combining, so it stays under 50 ms on Hermes.
     > **Update Oct 14 (rotation; founder: no same outfit or same top again and again):** `recentWear` became `history` (`pickHistory`: every earlier card shown, day and evening, plus Wear this and fit checks, each with days ago; the service looks back 14 days and never counts the card's own outfit, so a re-pick sees the same history). Among outfits that pass the weather, occasion and layer filters the order is: no wrong-weather piece (a warm piece on a no-layer day, boots or long sleeves on a hot day, fair-weather shoes on a wet day) → not the exact same top + bottom + shoes within 7 days → the top he has gone longest without (shown or worn; 7+ days counts as fresh) → predicted score → hash. Bottoms, shoes and layers keep the mild −0.75 for 2 days. The evening card counts that day's card, so it never repeats its top while another works. Pin and exclude still win. Tests: `ideas.test.ts` and `morningService.test.ts` "rotation" (14-day runs).
   - *Check:* on the seed closet, cold + rain gives a layer + boots, never suede; hot gives no layer; a closet with no shoes gives missing = shoes; the same input gives the same output; a 40-item closet runs in under 50 ms in Jest.
3. **MC3 · Data** (0.25 d)
   - **Migration V4:** a `daily_ideas` table with these columns:
     - dayKey (primary key), occasion, outfitId, weather JSON, isLive, messageId
     - state: idea / wearing / checked / skipped
     - fitCheckId, createdAt
   - **`services/weather`:** a `WeatherSource` interface with a `DemoWeather` source (fixtures `coldRain`, `hot`, `mild`, `none`; launch argument `-demoWeather`) and a `NoWeather` source (season only). The forecast is cached in kv for 1 h.
   - *Check:* migration tests, store tests.
4. **MC4 · `features/morning/service.ts`** (0.5 d)
   - **`ensureMorningCard(now)`** runs on Stylist focus.
   - **Which day it plans:**
     - From 4 am to 3:59 pm, it plans today.
     - From 4 pm on, it plans tomorrow's day key.
   - **If no row exists for that day:**
     - Fetch the weather, with a 2 s timeout and a season fallback.
     - Pick the outfit.
     - Insert the greeting text plus a `morning` card message.
     - Store the row; it's locked for that day.
   - **If a check already exists today,** insert the card already collapsed.
   - **Linking checks:** `fitCheckService.complete` sets the row to checked with that `fitCheckId` for any check that day (the card, the composer or a re-check). "Wear this" sets wearing and writes `wear_log`, as today.
   - *Check:* service tests for both sides of 4 am and 4 pm, one card per day key, and a check from the composer collapsing the card.
5. **MC5 · `MorningCard.tsx`** (1 d)
   - **States:** enough / thin / empty / wearing / checked (collapsed) / past day (collapsed) / evening / quota used, plus the location-ask row and the attribution footer (live weather only).
   - **Shared pieces:** extract `OutfitTiles` from `OutfitIdeaCard` and add `WeatherStrip`. The "your own fit" row is `CardActionRow`, a reusable row with 44 pt+ and VoiceOver as one button.
   - **Swap one** opens the existing S28 route (a minimal version that re-runs `pickOutfit` with the slot excluded, if S28 isn't built yet).
   - **Occasion tap** reuses `occasionPicker`.
   - *Check:* every state matches the S1d spec at default size and AX5, in light and dark.
6. **MC6 · Composer** (0.1 d)
   - Remove the quick-start row.
   - Re-measure the idle reserve in `stylist/layout.ts` (`THREAD_PAD.idle` 184 → about 146).
   - Retire the `quick.*` strings and update `copyChecks` if it asserts them.
   - *Check:* the dock shows only Check my fit + Ask…; the last card clears the dock.
7. **MC7 · The camera from the card** (0.25 d)
   - `camera.tsx` reads `occasion` and `from` params; the service takes `req.occasion`.
   - The result card shows the `weatherTip` line under the fixes when there's live weather or the season.
   - *Check:* the occasion is preset; the score is unchanged by weather (test).
8. **MC8 · Demo screens and verification** (0.25 d)
   - **Screens** (30 is the evening card):
     - **25:** enough, cold + rain (morning).
     - **26:** thin closet.
     - **27:** new user, empty.
     - **28:** after Wear this.
     - **29:** collapsed after his own check (8.0 Sharp).
     - **31:** location ask.
   - **Copy:** new strings go in `en.ts` → `addedInBuild` for the founder to skim.
   - **Final pass:** `npm run check`, then Simulator screenshots in light and dark plus AX5, then the CLAUDE.md status.
9. **MC9 · Native weather** (0.5 d, **after the founder's Apple Developer Program enrollment**; the free Personal Team can't enable the WeatherKit capability)
   - **In `kitted-vision`** (no new npm package):
     - CoreLocation When In Use with `NSLocationDefaultAccuracyReduced` = true; a one-shot `requestLocation`.
     - WeatherKit `WeatherService.shared.weather(for:including: .current, .hourly, .daily)`, mapped to `DayWeather` for today + 3 days.
     - `attribution` gives the mark URLs and `legalPageURL`.
   - **`app.config.ts` additions:**
     - `NSLocationWhenInUseUsageDescription` ("Kitted uses your rough location to pick clothes for today's weather. It isn't stored.")
     - the reduced-accuracy key
     - the WeatherKit entitlement
   - **Privacy label:** add Coarse Location (App Functionality, not linked, no tracking).
   - *Check on his phone:* the strip matches the Weather app within 2°.
   > **Update Oct 14 (founder: make the weather real now): MC9 is split. NWS now, WeatherKit later.** Built:
   > - **Location:** its own local module `modules/kitted-location` (not `kitted-vision`; no npm package): CoreLocation When In Use, `kCLLocationAccuracyReduced`, one `requestLocation` per fetch (a fix under 15 min old is reused), no background, no monitoring. Methods `permission()`, `requestPermission()` (the real iOS prompt, from the card's `Allow` only), `currentLocation(timeoutMs)`. `app.config.ts`: `NSLocationWhenInUseUsageDescription` = "Kitted uses your approximate location to get today's weather for your outfit idea. It goes only to the US National Weather Service and is never stored." and `NSLocationDefaultAccuracyReduced` = true.
   > - **Weather:** `src/services/weather/nws.ts`, a live `WeatherSource` on the US National Weather Service (api.weather.gov: free, no key, public domain, US only). The coordinate is rounded to 2 decimals → `GET /points/{lat},{lon}` → `properties.forecastHourly` (cached per rounded coordinate, memory only) → the hourly forecast (cached 1 hour) → `DayWeather` for the day (current hour + 8 am–8 pm) or evening (6 pm–midnight; now = 8 pm, `lateF` = midnight). Feels-like uses NWS's own wind-chill and heat-index formulas on the hourly temperature, wind and humidity (the hourly forecast has no apparent temperature); the condition comes from `shortForecast` words (rain/snow only at a 50%+ chance). Header `User-Agent: Kitted iOS app`. 6 s budget with one retry on a 5xx; offline, outside the US (404) or any error → `null` → the season.
   > - **Which source:** live in dev and release builds; demo screens and `-demoWeather` keep sample weather (screenshots unchanged); a build without the location module (web, or a phone not yet reinstalled) has no weather and never asks. The card's label reads `Weather: National Weather Service` on live weather, `Sample weather` on sample weather.
   > - **The card's 2 s wait:** `features/morning/index.ts` lets the live source fetch first (its 6 s budget), then the service finds it cached.
   > - **Privacy:** the rounded, approximate coordinate goes only to api.weather.gov, never to Google, and is never stored by us (memory only, this session). Still true for the label: Coarse Location, App Functionality, not linked, no tracking (to confirm when the privacy label is filled in).
   > - **Still MC9 after enrollment:** WeatherKit behind the same `WeatherSource` (kind `live`), its entitlement, and Apple's mark + `Data sources` footer, replacing the NWS label. Tests: `src/__tests__/nwsWeather.test.ts` (fixtures in `src/__tests__/fixtures/nws/`).
10. **MC10 · Evening slot + style pill** (1 d, #60–61)
    - **Data:** `daily_ideas` keyed (dayKey, slot day|evening), plus kv for the evening-ignore count and the last style per slot.
    - **Occasions:** add the `going_out` and `staying_in` occasions to the app's list. `going_out` already exists in the rubric; `staying_in` is card-only and never scored.
    - **Weather and pills:** an evening weather window (8 pm and midnight); the `StylePill` and `OccasionPill` pull-downs (`@expo/ui` menu; check its iOS 26 rendering first).
    - *Check:* service tests for 4:59/5:00 pm and the 3-ignore stop; demo screens 30 (evening) and 32 (style menu open).
11. **MC11 · "Scored for" + confirm before re-score** (1 d, #61–62)
    - **Core:**
      - `styleEffects(reading, opts)`: score with the style and without, then diff the rule amounts.
      - A single-style input for checks, `[[style, 1]]`.
      - Parity: `rubric.py` already accepts any styles dict, so no fixture changes.
    - **App:**
      - `fit_checks.style` (migration) and the style passed from the camera params.
      - The card's style pill and the "Scored for" inset.
      - The Why sheet section.
      - The native confirm alert with the preview score for occasion and style changes after scoring.
      - The `Re-scored · was …` footnote.
    - *Check:*
      - Tests: the line shows only when the effects are non-empty; the Why rows still sum; Keep leaves the row untouched; Re-score updates the card, Why and Lookbook in place with no new message.
      - Demo screens 33 ("Scored for" line) and 34 (re-score alert).
12. **Later (P6):** N1 notifications for the next 3 days are planned from the daily forecast and read the locked idea, so the card and the notification always agree.

### P4 · Onboarding (about 1.5 days)
**Build** (screen IDs from `02` §1.6; app-build-spec's O4–O8 numbering is different, so ignore it): the `onboarding/` Stack presented as a `fullScreenModal` with Back, no X: O1 Welcome (screen 1) → O2 Pick looks (screen 2, max 3, a 4th tap shakes with "Up to 3.", "Not sure", O2n sheet) → O3 Basics (screen 3: **blank** birth-year wheel O3w as a `formSheet` with a wheel picker, Build/Fit preselected segmented controls, optional height stepper, the silhouette) → under 18 → **O4 age stop** + the secure-store flag → **O5 Consent** (screen 4, age-rules §3 text, "Agree & check my fit" / "Not now" at the same width) → first check: S2 camera → S5 reading → **S6 result** (O1e "See an example" uses s15; the scripted first check uses p01b) → S6r re-check or "Later" → **S14** "Your first 3 moves" → **P1 → P1b** 2-page paywall → **S15** notification ask ("Yes, pick a time" is the only path to the system prompt). The `stylist.aiNote` message is posted when onboarding ends (`02` D12). Save each step right away and resume on relaunch. Back is disabled after the first check is scored (`gestureEnabled: false`, no back button). Pick-look photos come from the bundled stock, each labeled by style and never by the person.
**Done when:** screens 1–4 match. Counting by hand, **6 taps** take you from Get started to the camera. A 2010 birth year blocks, the block survives a relaunch (and on the Simulator, a reinstall), and the stop screen gives no retry hint. "Not now" on consent leaves Closet/Lookbook usable and shows a "Turn on fit checks" card in Stylist.

### P5 · Closet, Lookbook, You and Outfit idea (about 2 days)
**Build:** Closet (screen 15): "Your rotation: **N fits**", Starter 12 "8 of 12" (seed), sections Tops/Layers/Bottoms/Shoes/Extras, tiles cut from the neck-down photos (or `GarmentIcon` in the item's color), item detail, Edit (sheet), Delete with Undo, "Style this item" → `goToStylist({ kind: 'styleItem', id })`. The "+" button is a native header menu (Take photo · Choose photos · Describe it). Lookbook (screen 16): Looks / Calendar / Saved segmented control, the month grid with logged-day dots and accessible labels, "Days dressed with intent: 4 this week · 19 total" (seed; no chain), look detail with Re-check / Show in chat. You (screen 17): silhouette, basics, styles, "What your stylist knows," today's usage, and Settings (Notifications, Appearance, Privacy with "Delete all photos" and "Delete all my data" (a destructive confirmation; Cancel is the default), Manage subscription, Restore, links via `expo-web-browser`). Outfit idea (screen 13): "What should I wear?" → occasion chips → Outfit card from `@kitted/core` (code only). Empty states (C1e, L1e) are our `EmptyState` component (check with `seed=empty`).
**Done when:** screens 13, 15, 16 and 17 match with seed data, a new fit check shows up in all three tabs, "Delete all my data" empties the app (keeping the age flag), and the empty states are correct.

### P6 · Paywall, Limit card, notifications and Share (about 1.5 days)
**Build:** the paywall (screen 18) as a `fullScreenModal` with its own Stack: page 1 = his result + what Pro gives ("Up to 10 fit checks and 50 questions a day"), primary "See plans"; page 2 (P1b) = **our own plans page** fed by the `Entitlements` interface: annual preselected, "$29.99/year after a 14-day free trial" as the most prominent price, monthly $5.99, the trial terms and auto-renew line, Restore, Terms of Use and Privacy links, and **X and "Continue free" visible from the first frame** on both pages. In the demo, `DemoStore` returns those two products, shows "Demo: no real purchase" and flips a local Pro flag; Restore answers "Nothing to restore." Limit card (screen 19): "Next free check in 6 h," **Save for tomorrow** (the default; it creates a `held` check, ruling 27) / See Pro. Notifications (screen 14): `NotificationScheduler` on `expo-notifications` for the 3 local types (permission asked only after "Yes, pick a time"), plus a demo-only "Send demo notifications" in You → Settings that fires all three 5 s apart. Lock the Simulator (Device → Lock, ⌘L) to see them on the lock screen. Share card (screen 20): 9:16, neck-down, before → after, "scored by KITTED," rendered off-screen at 1080 × 1920 with `react-native-view-shot` `captureRef`, shared with `expo-sharing`; "Save" uses `expo-media-library` with `writeOnly: true`. Always-dark tokens on the camera, lock-screen preview and share screens.
**Done when:** screens 14, 18, 19 and 20 match. The demo purchase unlocks Pro and survives a relaunch; `freeChecksUsed=1` shows the Limit card on the next check; "Save Image" from the share sheet and the Save button both work without a crash (the plist has `NSPhotoLibraryAddUsageDescription` and **not** the read key). The paywall checklist for Guideline 3.1.2 (P6 page 2 list above) is ticked item by item in the report.

### P7 · Polish and accessibility (about 1.5 days; Simulator required)
**Check every screen in:** light, dark, **AX5** (`content_size accessibility-extra-extra-extra-large`), Increase Contrast, Reduce Transparency, Reduce Motion and Bold Text (Simulator Settings → Accessibility), and VoiceOver (Xcode → Open Developer Tool → Accessibility Inspector, pointed at the Simulator; run its **Audit** on each main screen). Rules: touch targets ≥ 44 pt (`hitSlop` or `minWidth/minHeight: 44`), text contrast ≥ 4.5:1, meaning never carried by color alone, rows stack at accessibility sizes (switch on `useWindowDimensions().fontScale`; the threshold lives in the design system), Reduce Motion → cross-fades (no count-up, no shimmer; `AccessibilityInfo.isReduceMotionEnabled` / Reanimated's `useReducedMotion`), Reduce Transparency → solid surfaces instead of glass (`AccessibilityInfo.isReduceTransparencyEnabled`), glass never behind text on a photo, an `accessibilityLabel` on every icon-only button, card VoiceOver text never mentions the body.
**E2E:** install Maestro (ask first; it needs Java 17+, which this Mac has). 3 flows in `e2e/` against the Release demo build with `launchApp: { clearState: true, clearKeychain: true, arguments: { uiTesting: 1, demoLatency: 0 } }`: (1) onboarding reaches a scored card in 6 taps via "See an example check"; (2) "Style this item" lands in Stylist with the attachment; (3) "Delete all my data" empties the app. Add `takeScreenshot` steps on the main screens. Then one **screenshot flow** that opens all 20 `kitted://demo/screen/<n>` links in light and dark (`openLink`) and saves each.
**Done when:** AX5 screenshots exist for all 20 screens with no clipped or overlapping text, the Accessibility Inspector audits pass (or each exception is written down with a reason), and the 3 Maestro flows are green.

### P8 · Hooks for the real version (about 1 day; don't run against the API without the founder)
**Build:** the `ReadingSource` interface (`read(image, kind): AsyncIterable<ReadingEvent>` with `stage`, `slotFound`, `reading`, `meta`, `failed { code, counted }`, exactly as `04` §11, in TypeScript) and these implementations:
- `MockReadingSource`: the demo one.
- **`DirectGeminiReadingSource` (dev builds only):** it sends the **same body `run_test.py` sends**: `prompt.txt` + the 1024 px JPEG, `temperature: 0`, `responseMimeType: application/json`, `responseSchema: schema.json`, `thinkingConfig: {thinkingBudget: 0}`, model `gemini-3.8-flash`, streamed. The key comes from `EXPO_PUBLIC_GEMINI_DEV_KEY` in the untracked `app/.env.development.local` (Expo loads `.env.development*` only in development mode), and the module is `require`d only inside `if (__DEV__)`. Timing: hedge 5 s, "taking longer" 9 s, abort 14 s, request timeout 16 s (ruling 19).
- `ProxyReadingSource`: a stub that throws "not yet" (the Worker comes in M4).
Also: `kitted-vision` filled in per 03 §8 (Vision body pose → neck-down crop, face rectangles → pixelate, refuse if both fail, ImageIO re-encode without metadata, SHA-256 of the original bytes), run on the bundled photos and compared with the PH-table crops; the consent gate in front of every non-mock source; `AgeAssurance` wired to `expo-age-range` (still stubbed in the Simulator); `Entitlements` interface ready for RevenueCat (not installed until the founder approves S8); and a **release guard** `npm run guard:release`: `KITTED_DEMO=0 npx expo export --platform ios --output-dir build/export && ! grep -rqE 'AIza[0-9A-Za-z_-]{35}|DirectGemini' build/export`.
**Done when:** the guard passes on a production export (no key shape, no `DirectGemini` string), the dev build compiles with an empty key and shows "No dev key set" if you select it, `kitted-vision.prepare` returns a crop for all 12 demo photos in the Simulator, and the founder knows the real call is ready to try once he creates a **new restricted key with billing on** (the Oct 6 key was pasted in chat and must be deleted first).

---

## 6. Visual verification loop

The goal is to put an app screenshot and the matching mockup screen next to each other at the **same pixel size** (1206 × 2622) and look at the difference. Do it on **web** from P0 (layout, copy, spacing) and again on the **Simulator** once it exists (the truth for system UI, fonts and Dynamic Type). The mockup commands below were tested on this Mac on Oct 6.

**1. Make a preview wrapper for the mockup** (the mockup file starts at `<title>` with no doctype, and its photos load from `img/` next to it). Put these in `app/tools/mockshots/`:

`isolate.js` (appended to the page; reads `#n=<1..20>&theme=light|dark`):
```html
<script>
(function(){
  var q=new URLSearchParams(location.hash.slice(1));
  var n=parseInt(q.get('n')||'0',10), theme=q.get('theme')||'light';
  var board=document.getElementById('board'); if(board) board.dataset.app=theme;
  if(!n) return;
  var shot=document.querySelectorAll('figure.shot')[n-1]; if(!shot) return;
  shot.setAttribute('data-iso','1');
  var css=document.createElement('style');
  css.textContent='html,body{margin:0!important;padding:0!important;overflow:hidden!important}'+
   'body *{visibility:hidden!important}'+
   'figure[data-iso] .phone, figure[data-iso] .phone *{visibility:visible!important}'+
   'figure[data-iso] .phone{position:fixed!important;left:0;top:0;zoom:1!important;width:402px!important;'+
   'height:874px!important;padding:0!important;border-radius:0!important;box-shadow:none!important;z-index:99999}'+
   'figure[data-iso] .screen{border-radius:0!important}';
  document.head.appendChild(css);
})();
</script>
```
`preview.sh`:
```sh
#!/bin/sh
# usage: preview.sh <screen 1-20> <light|dark>
OUT=/Users/eyu/Desktop/files/Kitted/app/screenshots/mock; mkdir -p $OUT
W=/Users/eyu/Desktop/files/Kitted/app/build/mockpreview; mkdir -p $W
ln -sfn /Users/eyu/Desktop/files/Kitted/mockups/img $W/img
{ echo '<!doctype html><meta charset="utf-8">'; cat /Users/eyu/Desktop/files/Kitted/mockups/kitted-mockups.html;
  cat /Users/eyu/Desktop/files/Kitted/app/tools/mockshots/isolate.js; } > $W/preview.html
N=$(printf %02d $1)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars \
  --allow-file-access-from-files --force-device-scale-factor=3 --window-size=402,874 \
  --virtual-time-budget=20000 --screenshot=$OUT/$N-$2.png "file://$W/preview.html#n=$1&theme=$2" >/dev/null 2>&1
echo $OUT/$N-$2.png
```
- Screens are numbered 1–20 in page order (the `figure.shot` order matches the table in §2). Chrome prints harmless `ERROR:` lines; ignore them.
- The theme switch works by setting `#board[data-app]`. Screens drawn as `.phone.fixed` (5 Camera, 14 Lock screen, 20 Share) are always dark, by design.
- The page loads Archivo and DM Mono from Google Fonts. If the Mac is offline, the fonts fall back and the mockup looks slightly different, so recheck with the network on before you blame the app.
- For an overview of the whole board, drop the hash and use `--window-size=1440,1000` without the scale factor.

**2a. Take the matching web screenshot** (`webshot.sh`; the web preview must be running on port 8081; warm it first with `curl -s http://localhost:8081 >/dev/null`, because Metro's first bundle can take a minute):
```sh
#!/bin/sh
# usage: webshot.sh <screen 1-20> <light|dark>
OUT=/Users/eyu/Desktop/files/Kitted/app/screenshots/web; mkdir -p $OUT; N=$(printf %02d $1)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars \
  --force-device-scale-factor=3 --window-size=402,874 --virtual-time-budget=30000 \
  --screenshot=$OUT/$N-$2.png "http://localhost:8081/demo/screen/$1?theme=$2&latency=0&frame=1&uiTesting=1" >/dev/null 2>&1
echo $OUT/$N-$2.png
```
You can also look at the page live in the in-app browser pane (`preview_start` with a launch config for `npx expo start --web --port 8081`, then `resize_window` to 402 × 874).

**2b. Take the matching Simulator screenshot** with the same theme, `latency=0` and the status bar override (§5.1), into `app/screenshots/sim/NN-theme.png`.

**3. Compare side by side.** There's no Pillow or ImageMagick on this Mac, so let Chrome do it. `compare.html` (tested):
```html
<!doctype html><meta charset="utf-8">
<style>
 html,body{margin:0;background:#777;font:14px -apple-system,sans-serif;color:#fff}
 .row{display:flex;gap:12px;padding:12px} figure{margin:0;position:relative;width:402px}
 figcaption{height:20px} img{width:402px;height:874px;display:block}
 .grid{display:none;position:absolute;left:0;top:20px;width:402px;height:874px;pointer-events:none;
   background-image:linear-gradient(rgba(255,0,0,.25) 1px,transparent 1px),linear-gradient(90deg,rgba(255,0,0,.25) 1px,transparent 1px);background-size:8px 8px}
 body.g .grid{display:block}
 .diff img+img{position:absolute;left:0;top:20px;mix-blend-mode:difference}
</style>
<div class="row">
 <figure><figcaption>Mockup</figcaption><img id="a"><div class="grid"></div></figure>
 <figure><figcaption>App</figcaption><img id="b"><div class="grid"></div></figure>
 <figure class="diff"><figcaption>Difference (black = identical)</figcaption><img id="a2"><img id="b2"></figure>
</div>
<script>var q=new URLSearchParams(location.hash.slice(1));a.src=a2.src=q.get('a');b.src=b2.src=q.get('b');
if(q.get('grid'))document.body.className='g';</script>
```
```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars \
  --allow-file-access-from-files --window-size=1254,920 --virtual-time-budget=5000 \
  --screenshot=$APP/screenshots/cmp/07-light-sim.png \
  "file://$APP/tools/mockshots/compare.html#a=file://$APP/screenshots/mock/07-light.png&b=file://$APP/screenshots/sim/07-light.png&grid=1"
```
(Use `b=…/screenshots/web/07-light.png` and a `-web` suffix for the web comparison.) Then open the PNG with your Read tool and look at it. The grid is 8 pt, so each square = 8 pt.

**4. What to check, in this order:**
1. **Copy:** every word matches (apart from the §3.4 deviations). No "AI stylist," no "unlimited," no emoji.
2. **Structure:** the same elements, in the same order, in the same places (nav title + subtitle, bubble, card sections, composer, tab bar).
3. **Spacing in pt:** margins 16–21, card padding about 16–20, card radius about 26–28, the 44 nav bar, the 62 tab bar at 21 from the sides and bottom. Differences over 4 pt get fixed. Real iOS controls (tab bar, nav bar, sheets, pickers, the status bar) win over the mockup's drawing of them, so note those differences instead of faking the system UI. **On web, ignore the tab bar, nav bar and sheet chrome entirely** (T21); judge content only.
4. **Type:** sizes map to the iOS text styles (03 §3.2 / `typography.ts`), the score is in Archivo with tabular digits, and nothing is under 11 pt. Judge type size and weight on the Simulator, not on web.
5. **States:** each screen's main state, plus at least one other state (empty, partial, error) where it has one.
6. **Both themes,** then AX5 on the Simulator (AX5 isn't compared with the mockup; it's checked for clipping and stacking only).

Keep a running table in your phase report: screen · web light/dark ✓/✗ · Simulator light/dark ✓/✗ · differences left · why.

---

## 7. Known issues and traps

| # | Trap | What to do |
|---|---|---|
| T1 | **Gemini's API terms: users must be 18+**, and the API may not be used in apps "likely to be accessed by" under-18s (app-build-spec D1, ruling 1, `inputs/app-store-and-age-rules.md`). | 18+ gate by default; `minAge` from config; keep `ReadingSource` swappable (`inputs/ai-provider-research.md`). |
| T2 | **The vision model reads garments held in the hand as worn** and can mark visible shoes as hidden (photo p01, the mockup's Result/Re-check pair). | Don't hand-edit the reading. Use `expected_scores.json` as the truth, show what the reading says, and tell the founder. "Not quite right?" is the honest fix path. |
| T3 | **Fix detection is unproven: 67–83%** across runs, hinging on 2 ambiguous pairs (p01, p06). | The demo's re-check is staged with known readings. Don't present it as proof that re-checks work. The merger keeps noise from lowering scores. |
| T4 | **Latency:** locked v3 + thinking off = **6.6 s median / 8.7 s p90** API time (test script, not a phone on LTE). | Default `latency` 6.6 s; copy says "About 7 seconds." |
| T5 | **app-build-spec contradicts itself on v3 vs v4** (header, §2.1, §3.1, §3.2 say v4; D9 and ruling 2 lock **v3**). Its v4 names (`scene.feet == cut_off`, `bottom.hem`) don't exist in v3 (`scene.shoes_visible`, `scene.framing == "upper_only"`, `garments[].category`). | Build on v3. Keep the format behind `ReadingSource` so v4.1 can come later as an adapter. |
| T6 | **The neck-down crop is untested** (ruling 10, risk #1 in brainstorm/13): it may lose collars, hats and layer edges. | The demo uses the PH-table crops. The real `kitted-vision` crop must be checked on the gold set (X8/X9) before it ships. |
| T7 | **demo-app-spec's "a partial check can still reach 10" is stale.** The max is 9.5. | Never claim 10 (open founder decision in `rubric/v3.md`). |
| T8 | **Timeouts** (ruling 19): hedge 5 s without a first token, "Taking longer than usual" at **9 s**, abort **14 s**, request timeout **16 s**. | Use these in `MockReadingSource` and `DirectGemini`. |
| T9 | **Re-check window:** 30 min, but the **first-ever check runs until 4 am** (ruling 22). | In `QuotaService`, using `dayKey`. |
| T10 | **Score words and "unlimited"** in the build spec and mockup are overruled (rulings 24, 25). | Use §3.1. |
| T11 | **Consent copy:** "we never store it" is false (Google keeps paid-tier data up to 55 days). | Use the age-rules §3 text (ruling 16). |
| T12 | **Share-sheet "Save Image" crashes without `NSPhotoLibraryAddUsageDescription`** (ruling 26). | Set it via the media-library plugin's `savePhotosPermission`; set its `photosPermission: false` so no read key appears; check the generated plist. |
| T13 | **Pre-commit hook vs. docs:** blocking the bare key prefix blocks `app-build-spec.md`. | Full-shape regex (§4.1). |
| T14 | **No real purchases in the demo.** Sandbox purchases need the paid Developer Program, the Paid Apps Agreement, App Store Connect products and (with S8) a RevenueCat project. | `DemoStore` everywhere in the demo. Product IDs for later: `kitted.pro.annual` ($29.99, 1 year, 2-week free trial), `kitted.pro.monthly` ($5.99) (app-build-spec §4.9). |
| T15 | **No Simulator camera,** and App Attest, Declared Age Range and lens-smudge detection don't work (reliably) in the Simulator. | `SimulatedCameraSource`; keep those calls behind interfaces with simulator stubs. |
| T16 | **Photos library re-encoding:** `simctl addmedia` + the picker may not return the original bytes, so a SHA-256 lookup can miss. | The demo photo strip passes the bundled id directly; `preferredAssetRepresentationMode: 'current'`. A miss shows the honest `demo.unknownPhoto`. |
| T17 | **Object key order ≠ Python dict order** (JS puts integer-like keys first; rules_fired order and float sums depend on order). | Arrays and ordered key lists (P1). |
| T18 | **Declared Age Range** needs Xcode ≥ 26.4 for the 26.4 calls, the entitlement (paid program) and a real device. | `expo-age-range` behind `AgeAssurance`, stubbed in the demo (§1.5). |
| T19 | **The mockup sizes:** brainstorm/12 says controls are 1.3–1.45× too big, but the mockup has since been re-authored in true points. | Trust the current CSS numbers 1:1 and Apple's real controls first. |
| T20 | **The mockup's photos are stock, and `inputs/mirror-fit-check-1*` are other people's web photos.** | Never bundle anything from `inputs/`. Swap the stock before the App Store. |
| T21 | **The web preview isn't iOS.** NativeTabs falls back to a basic web tab bar, `formSheet` becomes a plain route, `GlassView` is a plain `View`, `@expo/ui` controls don't render (iOS only), `dynamicTypeRamp` does nothing, expo-symbols can't draw SF Symbols (our `Icon` shows an **empty box** until you add Material names, `06` §4), SQLite and secure-store aren't available, haptics and notifications are no-ops. | Web is for layout, copy, logic and quick screenshots. Give every iOS-only piece a `.web.tsx` stand-in. Judge system UI, type and accessibility only on the Simulator. |
| T22 | **Font names.** On iOS, `fontFamily` must match the font's registered name (usually the PostScript/full name), not the file name; Android uses the file name. A wrong name fails silently to the system font. | Use the names in `ts/design-system/fonts.ts`; after the first iOS build, render the score next to SF Pro and confirm the condensed shape. If in doubt, read the names with `fc-scan`-style tools or a debug log. |
| T23 | **Native code needs a development build, not Expo Go.** `kitted-vision`, config plugins and any non-Expo-Go package only work in `npx expo run:ios` builds. Expo Go for SDK 57 isn't even on the App Store (only via `eas go` or the CLI on simulators). | Use `expo-dev-client` builds from P0. Rebuild after adding a native package or changing `app.config.ts`. |
| T24 | **Liquid Glass only on iOS 26+ and only when built with the iOS 26 SDK.** The tab bar's glass, `GlassView` and the inset sheets are system features. | iOS 26.0 deployment target; never fake glass with blur views; check Reduce Transparency fallbacks. |
| T25 | **No stable nav-bar subtitle** on SDK 57's native stack (react-native-screens 4.26 has subtitles only in its experimental stack). | Stylist's "Re-check included" goes in a custom `headerTitle` (two lines, centered, the title `.headline`, the subtitle `.caption` ink3). |
| T26 | **The template's `web.output: "static"`** renders routes in Node during development, which breaks on code that touches native-only modules or `window`. | Use `web.output: "single"` for the preview (§4.8). |
| T27 | **CocoaPods warns the terminal isn't UTF-8** (seen on this Mac); `pod install` can fail on that. | Run iOS builds with `LANG=en_US.UTF-8` (`export LANG=en_US.UTF-8` in the shell that runs `npx expo run:ios`). |
| T28 | **Java 25 is the default JDK;** React Native's docs recommend JDK 17 and warn that higher versions may break Gradle. | For Android builds only: `export JAVA_HOME=$(/usr/libexec/java_home -v 17)`. Maestro is fine on 25. |
| T29 | **Config plugins add Info.plist keys and entitlements you didn't ask for** (for example a photo-library read key from a plugin default, or an `aps-environment` push entitlement). | After every plugin change, prebuild and read `Info.plist` and the `.entitlements` file (§4.8). Local notifications need no push entitlement. |
| T30 | **`ios/` is generated.** Hand edits in `ios/` are wiped by `npx expo prebuild --clean` (SDK 57's prebuild clears native folders by default). | All native config through `app.config.ts`, config plugins and `modules/kitted-vision`. Never commit `ios/`. |
| T31 | **OTA updates and App Review.** Guideline 2.5.2 bars downloading code that "introduces or changes features or functionality"; the Developer Program License Agreement §3.3.1(B) allows interpreted code only if it doesn't change the app's primary purpose, create a storefront, or bypass OS security. | No EAS Update in the beta. If added later, ship only bug fixes and copy through it, never new features. `rubric.json` from the server is data and is fine. |
| T32 | **`EXPO_PUBLIC_*` values are inlined into the bundle.** `.env.local` is loaded in every mode. | Dev key only in `.env.development.local`; the release guard (P8) greps the production export. |
| T33 | **NativeTabs limits:** no custom tab bar, tabs defined statically, tab-bar height can't be measured, limited `FlatList` support for scroll-to-top and minimize-on-scroll, default and selected icons must share a rendering mode. | Don't hide or add tabs at runtime (onboarding is a root modal, not a tab state). Pad the chat list's bottom by the safe area + 62 + 21, not a measured height. |
| T34 | **formSheet details:** `fitToContents` can't use `flex: 1`; on iOS `flex: 1` works with numeric detents (SDK 55+); Android allows at most 3 detents and no nested navigators in sheets. | Use numeric detents (`[0.78, 1]`, `[1]`, `[0.5, 1]`); keep sheet content single-level. |
| T35 | **Dynamic Type in React Native** scales by the system multiplier per `dynamicTypeRamp`; non-text sizes (icons, the 76 pt score, row heights) don't scale by themselves, and a few huge sizes need a cap. | `KText` passes the ramp; scale numerals through `<Numeral>` (largeTitle ramp, `maxFontSizeMultiplier` 1.6 = about 122 pt for the score, 03 §3.3); never `allowFontScaling={false}` on reading text. Check AX5 on the Simulator. |
| T36 | **The system monospaced font by name** isn't guaranteed: `fontFamily: 'ui-monospace'` is the usual way to get SF Mono on iOS but wasn't verified on SDK 57. | Use the name in `ts/design-system/typography.ts`; confirm on the first Simulator run, fallback `Menlo`. |
| T37 | **Maestro can't drive a physical iPhone** (Simulator only) and needs Java 17+. | E2E and screenshot flows run on the Simulator; device testing is by hand. |
| T38 | **Expo SDK 58 lands soon** (beta now; React Native 0.88, scene life cycle by default, `expo-router/native-tabs` without `unstable-`). | Don't upgrade mid-sprint. After the beta: `npx expo install expo@^58 --fix`, rename the native-tabs import, move to Xcode 27 (needed for uploads from April 2027). |

**App Review risks the demo must already respect** (they become real at M4):
- **5.1.1:** collection, consent and deletion → "Delete all my data," no account.
- **5.1.2(i):** sharing with a third-party AI → the consent step names the provider, lists what's sent, has "Not now," stores `consentVersion`.
- **3.1.2:** subscriptions → our own paywall must show the billed amount ($29.99/year) as the most prominent price, the trial length and post-trial price, auto-renewal, Restore, Terms and Privacy links; no timers or exit offers.
- **1.2:** "hot or not" → clothes only, faces cut off, never the body; review notes point to "See an example check."
- **2.1:** a reviewer must be able to test → the example works with no camera, no quota and no network.
- **2.5.2:** no downloaded code that changes features (T31).
- **Age:** 18+ gate, App Store rating overridden to 18+, US only.

---

## 8. What NOT to do

- **No accounts** of any kind, no Sign in with Apple, no "restore account," no iCloud sync (all v1.1, ruling 8).
- **No SDKs beyond §1.1's list:** no PostHog, TelemetryDeck, Sentry, Firebase, Supabase, analytics or crash SDKs, no Redux/MobX/Zustand, no UI kits (NativeBase, Tamagui, Paper), no Storybook, no snapshot-testing packages. RevenueCat only after the founder approves S8, and not in the demo.
- **No backend in the demo.** The Cloudflare Worker + D1 proxy is M4, and `ProxyReadingSource` stays a stub.
- **No real API calls** unless the founder explicitly gives you a **new** restricted key with billing on. Never use the key pasted in chat on Oct 6, and never put a key in a tracked file, a commit, a log, a `EXPO_PUBLIC_*` variable of a shipped build, or your reply.
- **Cut from v1, don't build:** the offline photo queue (D8; `held` is a status, not a queue), Live Activities, widgets, Control Center buttons, push notifications/APNs, background tasks, Style DNA, the monthly Lookbook recap, daily streak chains, a lifetime/weekly plan or Family Sharing, a "we miss you" notification, an on-device nudity classifier, Gemini `box_2d` closet cut-outs (ruling 12), multi-language support, EAS Update.
- **Don't build a custom tab bar** or fake system UI (status bar, nav bar, sheets, pickers) to match the mockup pixel for pixel on iOS. Use NativeTabs, the native stack, formSheet and `@expo/ui`. The web stand-ins are preview-only.
- **Don't commit** `ios/`, `android/`, `node_modules/`, anything from `inputs/`, any `.env*`, build output or screenshots. **Don't push** or create a remote without the founder's OK.
- **Don't modify** `rubric.py`, the fixtures, `CLAUDE.md` or the research docs to make tests pass. Report the mismatch.
- **Don't install or download anything** (Node 22, Xcode 26.6, the iOS platform, Maestro, fonts, new npm packages outside §1.1, an eas-cli upgrade) without asking first, and **don't run EAS builds** without asking. Never type or store the founder's Apple ID, Expo or App Store Connect credentials; he logs in himself.
- **Don't upgrade to Expo SDK 58 or Xcode 27** before the beta (T38).
- **Don't add features** the mockups and specs don't show. If you're tempted, put it in "Ideas for later" in your report.

---

## 9. Reporting back to the founder

At the end of **each phase**, send a short report in plain language. He is a college student, not a mobile engineer, and he wants honest, critical feedback with concrete recommendations. Template:

```
P<n> done: <one sentence on what now works>.

What you can try: <exact steps, e.g. "run `npx expo start --web`, open localhost:8081, tap Check my fit, pick photo 3"
  or "open the Simulator, tap Kitted, …">.
Screenshots: <paths in app/screenshots/cmp/ for the screens built this phase, light + dark; say web or Simulator>.

Real vs. mocked:
- Real: <e.g. scoring (N of N parity cases match rubric.py), fixes, re-score on occasion change>
- Mocked: <e.g. readings are saved answers from the Oct 6 tests; camera is simulated; purchases are a demo store>
- Checked on web only (not yet on iOS): <list, until the Simulator exists>

Matches the mockup: <screens ✓>. Still different: <screen: difference, and why (ruling X / iOS control / web preview limit)>.
Tests: core <n/n parity>, jest <n passed>, typecheck/lint clean, Maestro <n flows> (or "waiting for the Simulator").
Problems I found: <bugs, doc contradictions, rubric surprises: be blunt>.
I need from you: <only real decisions or approvals, each with my recommended default>.
Next: P<n+1>, about <time>.
```

**Things to tell him early (in the P0 report), because they need his action or decision:**
1. **Node 22 is required** by Expo SDK 57 (this Mac has 20.20). Approve `brew install node@22` + relink (2 minutes).
2. **Xcode 26.6 + the iOS platform** are required for any iOS build, Simulator or iPhone (SDK 57 needs Xcode ≥ 26.4; the Mac has 26.3 with no iOS platform). He downloads Xcode 26.6 signed in as himself, runs the `xcode-select` command, and approves `xcodebuild -downloadPlatform iOS` (about 8–10 GB). Until then, everything is checked in the web preview.
3. Approve the **dependency list** in §1.1 (first-party Expo modules + react-native-svg, react-native-view-shot, Testing Library), and later **S8: RevenueCat vs. expo-iap** (recommendation: RevenueCat, custom paywall, webhook to the Worker; it reverses ruling 6 only because `SubscriptionStoreView` doesn't exist in React Native).
4. Approve downloading the **Archivo** static fonts: `ArchivoCondensed-SemiBold.ttf`, `ArchivoCondensed-Medium.ttf`, `ArchivoExpanded-Bold.ttf` (about 185 KB each) + `OFL.txt`, from GitHub `Omnibus-Type/Archivo` (`fonts/ttf/`; exact URLs in `ts/design-system/fonts.ts` and 03 §3.4).
5. Approve installing **Maestro** before P7 (Homebrew tap, needs Java 17+, already present).
6. Keep the **Developer Program ($99/year) and the Paid Apps Agreement** moving (app-build-spec R7, R9). They block real purchases, App Attest, Declared Age Range and TestFlight, not the demo.
7. The open **FOUNDER DECIDES** items with their defaults, consolidated in `/CLAUDE.md` → "Waiting on the founder" (age 18+, never store the face, the mockup design system, mono label case, Archivo for stat numerals, Rotation counting with layers, should 10 be reachable, human calibration). the original handoff's item #4 (Declared Age Range) is handled by `expo-age-range` once Xcode ≥ 26.4 is in (§1.5); only the stub ships in the demo.
8. **Delete the Gemini API key pasted in chat on Oct 6** (CLAUDE.md next step 1), if he hasn't already.

**At the very end of the demo,** add a one-page summary: what's real and what's mocked (this is the beta's to-do list, mapped to app-build-spec M1–M4), the matching table for all 20 screens, the timing of a demo check, every place the code had to differ from the docs and why, and the top 3 risks for the beta, in order. Then suggest he says "Update CLAUDE.md with what we decided today," so the next session starts from the right place.

---

## 10. Sources (checked Oct 6, 2026)

- npm registry, `npm view <pkg> version` / `dist-tags` for every version above (expo 57.0.27 latest / 58.0.6 next; react-native 0.86.3 pinned by expo 57; create-expo-app 5.0.0; expo-template-default 57.0.29; react-native-vision-camera 5.2.3; react-native-purchases 10.11.0; expo-iap 5.8.2; react-native-iap 16.7.2; drizzle-orm 0.45.3 latest / 1.0.0-rc.4; jest-expo 57.0.5) and `expo@57.0.27/bundledNativeModules.json` for the SDK pins.
- Expo SDK 57 changelog: https://expo.dev/changelog/sdk-57 · SDK 56 changelog: https://expo.dev/changelog/sdk-56
- SDK version table (Node and Xcode minimums): https://docs.expo.dev/versions/v57.0.0/
- EAS build images: https://docs.expo.dev/build-reference/infrastructure/ · Internal distribution (paid account): https://docs.expo.dev/build/internal-distribution/ · Pricing: https://expo.dev/pricing
- create-expo-app: https://docs.expo.dev/more/create-expo/ · Monorepos: https://docs.expo.dev/guides/monorepos/ · Local modules: https://docs.expo.dev/modules/get-started/
- Native tabs: https://docs.expo.dev/router/advanced/native-tabs/ · Modals and formSheet: https://docs.expo.dev/router/advanced/modals/
- expo-glass-effect: https://docs.expo.dev/versions/latest/sdk/glass-effect/ · Expo UI (SwiftUI): https://docs.expo.dev/versions/latest/sdk/ui/swift-ui/ · expo-symbols: https://docs.expo.dev/versions/latest/sdk/symbols/
- expo-camera: https://docs.expo.dev/versions/latest/sdk/camera/ · VisionCamera v5: https://margelo.com/blog/whats-new-in-visioncamera-v5
- expo-sqlite: https://docs.expo.dev/versions/latest/sdk/sqlite/ · Drizzle + Expo: https://orm.drizzle.team/docs/connect-expo-sqlite
- expo-file-system: https://docs.expo.dev/versions/latest/sdk/filesystem/ · Apple, iCloud backup: https://developer.apple.com/documentation/foundation/optimizing-your-app-s-data-for-icloud-backup
- expo-secure-store: https://docs.expo.dev/versions/latest/sdk/securestore/ · expo-notifications: https://docs.expo.dev/versions/latest/sdk/notifications/
- expo-media-library: https://docs.expo.dev/versions/latest/sdk/media-library/ · expo-image-picker: https://docs.expo.dev/versions/latest/sdk/imagepicker/
- expo-age-range: https://docs.expo.dev/versions/latest/sdk/age-range/ · @expo/app-integrity: https://docs.expo.dev/versions/latest/sdk/app-integrity/
- RevenueCat Expo: https://www.revenuecat.com/docs/getting-started/installation/expo · Pricing: https://www.revenuecat.com/pricing/ · Test Store: https://www.revenuecat.com/blog/company/revenuecat-test-store · expo-iap: https://www.npmjs.com/package/expo-iap
- Maestro: https://docs.maestro.dev/get-started/quickstart.md and the docs "ask" endpoint (install commands, Java 17+, iOS 26 simulators supported, no physical iOS devices, `launchApp.arguments` → `UserDefaults`) · release cli-2.11.0: https://github.com/mobile-dev-inc/maestro/releases
- React Native environment (JDK 17): https://reactnative.dev/docs/set-up-your-environment · Text (`dynamicTypeRamp`, `maxFontSizeMultiplier`): https://reactnative.dev/docs/text
- App Review Guidelines (2.5.2, 3.1.2): https://developer.apple.com/app-store/review/guidelines/ · Expo FAQ citing the License Agreement §3.3.1(B): https://docs.expo.dev/faq/
- Xcode 27 (Sep 14, 2026; macOS 26.6+): https://blakecrosley.com/blog/xcode-27-release · iOS 27 SDK required from April 2027: https://www.mactech.com/2026/09/10/app-store-submissions-now-open-for-the-latest-os-releases/

**Not verified (check on first use):** RN `Settings.get` reading `simctl` launch arguments (§5.2); `fontFamily: 'ui-monospace'` = SF Mono (T36); that Metro serves the demo JPEGs byte-identical (§4.7); the exact Maestro output-dir flag; Xcode 26.6's download size; whether the iOS 26 floating inset sheet appears for react-native-screens `formSheet` at partial detents exactly as in SwiftUI (§3.4); that `expo-image-manipulator`-style re-encodes drop EXIF (the plan does it in Swift instead).

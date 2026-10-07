# 06 · SwiftUI → React Native (Expo) mapping

*Oct 6, 2026. `02-screens.md` and `03-design-system.md` were written for SwiftUI. The founder then switched the stack to React Native with Expo SDK 57 (TypeScript), iOS first with the iOS 26 look. Their content (layout, sizes, copy, states, navigation rules, tokens, VoiceOver text) is still the spec; only the API names change. This file tells you, for every SwiftUI/iOS term those files use, what to write instead. The stack choices and versions behind it are in `05-build-plan.md` §1.1 (S1–S20); names were checked against the SDK 57 packages (`expo-router` 57.0.25, `react-native-screens` 4.26, `@expo/ui` 57.0.22, `react-native-purchases` 10.11.0) on Oct 6.*

---

## 1. How to read `02` and `03` with this table

1. **Keep every number, word and rule.** Points in `02` are React Native layout units (1 CSS px in the mockup = 1 pt = 1 RN unit). Copy keys, VoiceOver labels, states, entry/exit rules and the "differs from mockup because…" notes all stand.
2. **Translate only the API name** with the tables below. When `02` says "`.sheet`, detents `[.fraction(0.78), .large]`", you write a `formSheet` route with `sheetAllowedDetents: [0.78, 1]`. When it says `.headline`, you use the `headline` role from `src/design-system/typography.ts` through `<KText>`.
3. **"System" in `02` still means system.** Where `02` says "use the system X, don't draw it" (tab bar, nav bar, sheets, pickers, share sheet, permission alerts), use the native component listed here, never a hand-drawn copy. The one place you do draw a stand-in is the **web preview** (`.web.tsx` files), and those are never shipped to iOS.
4. **Where there's no React Native equivalent** (§9), the table says what to build instead. Don't search for a package first; ask before adding any dependency not in `05` §1.1.
5. **`swift/DesignSystem.swift` is archived** (`handoff/archive/swift/`). Its React Native replacement is `handoff/ts/design-system/`, copied to `app/src/design-system/` (`05` §4.5). `03` §5's components marked `[RN]` are already built in `ts/design-system/components/`; build the unmarked ones from their spec there.

**Worked examples:**
- **D8 Why this score:** `02` says "sheet over S1, detents `[.fraction(0.78), .large]`, grabber visible, an X in the title row." → a route `src/app/sheets/why/[checkId].tsx`, declared in the root Stack with `{ presentation: 'formSheet', sheetAllowedDetents: [0.78, 1], sheetGrabberVisible: true, headerShown: false }`; the X is a 36 pt circle button with a 44 pt hit area calling `router.back()`, `accessibilityLabel="Close"`.
- **D3 Basics:** "`Build`: segmented control" → `@expo/ui` `Picker` with the `segmented` style inside `<Host>` (web: a `.web.tsx` row of pressables). "Birth year wheel O3w (sheet)" → a `formSheet` route holding a `wheel`-style `Picker` with no preselected value. "Height stepper is an adjustable element" → a custom − / + control with `accessibilityRole="adjustable"`, `accessibilityValue={{ text: '5 feet 10 inches' }}` and `increment`/`decrement` actions.
- **D7 card VoiceOver:** "the card is one element with custom actions" → the card's outer `View` gets `accessible`, an `accessibilityLabel` built from the copy keys (never the body), and `accessibilityActions={[{ name: 'recheck', label: 'Re-check' }, …]}` with `onAccessibilityAction`.

---

## 2. App structure and navigation

| SwiftUI / iOS (as used in 02/03) | React Native / Expo | Notes |
|---|---|---|
| `KittedApp` + `RootView` | `src/app/_layout.tsx` (expo-router root layout) with providers (theme, database, i18n, demo args) and a root `Stack` | One root `Stack` holds the tabs and every modal and sheet route, so only one modal shows at a time. |
| `if ageBlocked → AgeStopView` / `if !onboardingDone → OnboardingFlow` / else `TabView` | `Stack.Protected guard={…}` groups in the root `Stack`, in this order: age-blocked → `age-stop`; not onboarded → `onboarding`; else `(tabs)` | `Stack.Protected` is in expo-router 57. Keep the splash up (`expo-splash-screen`) until the gate has read SQLite and secure-store. |
| `TabView` (iOS 26 `Tab` API, floating Liquid Glass bar) | `NativeTabs` from `expo-router/unstable-native-tabs` in `src/app/(tabs)/_layout.tsx` | The real `UITabBarController`: iOS 26 draws the 62 pt glass capsule itself; background props are ignored on iOS 26. SDK 58 renames the import to `expo-router/native-tabs`. Web: `(tabs)/_layout.web.tsx` with `expo-router/ui` headless tabs. |
| `Tab("Stylist", systemImage: "bubble.left")` | `<NativeTabs.Trigger name="stylist"><NativeTabs.Trigger.Label>Stylist</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf="bubble.left" md="chat_bubble" /></NativeTabs.Trigger>` | `md` = the Material Symbols name for Android (the tab bar on web is the separate `_layout.web.tsx`). `ts/design-system/symbols.ts` has **only the SF names today**: add the 4 tab `md` names in P0 (`chat_bubble`, `checkroom`, `grid_view`, `person`; check them against the Material Symbols list). Labels always on. |
| `.tint(accent)` on the tab bar | `tintColor={tokens.accent}` on `NativeTabs` | Use a dynamic color so light/dark both work. |
| Stylist selected at launch | Make `stylist` the first trigger | Tabs are static; don't add or remove them at runtime. |
| Re-tapping the selected tab pops to root | Default `NativeTabs` behavior | `disablePopToTop` / `disableScrollToTop` exist; leave them off. |
| `NavigationStack(path: $router.stylistPath)` per tab | A native `Stack` in each tab folder: `src/app/(tabs)/stylist/_layout.tsx` etc. | The "typed path enum" becomes the typed routes (`experiments.typedRoutes`). |
| `NavigationLink(value:)` / `path.append(route)` | `<Link href="/closet/item/abc" />` or `router.push('/closet/item/abc')` | Back button and edge swipe come from the native stack. |
| Large titles (`.navigationTitle` + `.large`) | `options={{ title, headerLargeTitleEnabled: true }}` | `headerLargeTitle` is the deprecated name in 57's types. |
| Inline title (Stylist) | `options={{ title }}` (default inline) | |
| `.navigationSubtitle("Re-check included")` | A custom `headerTitle: () => <TitleWithSubtitle …/>` | No stable subtitle option on SDK 57's native stack (`05` T25). |
| `.toolbar { ToolbarItem(…) }` (one trailing button per tab) | `headerRight: () => <HeaderButton …/>`; for a native menu on the button, `unstable_headerRightItems` (react-native-screens bar-button items with menu actions) or an `@expo/ui` `Menu` | iOS 26 gives bar buttons their glass platter automatically. Don't draw `kSurface2` circles in the nav bar. |
| `.sheet` + `.presentationDetents([.medium, .large])` / `[.fraction(0.78), .large]` | A route declared with `presentation: 'formSheet'`, `sheetAllowedDetents: [0.5, 1]` / `[0.78, 1]` | `.medium` = 0.5, `.large` = 1, `.fraction(x)` = x. Use numeric detents (`fitToContents` can't use `flex: 1`). The iOS 26 inset floating sheet is drawn by `UISheetPresentationController`; confirm on the Simulator. |
| `.presentationDragIndicator(.visible)` | `sheetGrabberVisible: true` | iOS only. |
| Sheet corner radius | `sheetCornerRadius` | Leave unset on iOS 26 (system value). |
| `.presentationBackgroundInteraction` / undimmed detents | `sheetLargestUndimmedDetentIndex` | Not used in v1. |
| `.interactiveDismissDisabled()` | `gestureEnabled: false` on that screen | E.g. onboarding Back disabled after the first scored check. |
| `.fullScreenCover` | `presentation: 'fullScreenModal'` | Camera, shoe snap, photo viewer, share card, paywall (with its own nested `Stack` for page 2). X visible from the first frame, top-left, 44 pt. |
| Onboarding `fullScreenCover`, no tab bar, Back | A root `Stack` screen `onboarding` (its own `Stack` inside) behind the onboarding guard | The tabs aren't mounted yet, so there's no tab bar to hide. |
| Dismiss (`dismiss()` from `@Environment`) | `router.back()` (one level) or `router.dismiss()` / `router.dismissAll()` | On web, check `router.canGoBack()` first. |
| `.confirmationDialog` (destructive actions, "+" and "I bought something" menus) | `@expo/ui` `ConfirmationDialog` or React Native's `ActionSheetIOS.showActionSheetWithOptions` (`destructiveButtonIndex`, `cancelButtonIndex`) | Cancel is the default. Web: `Alert`/a `.web.tsx` list. |
| `Menu` (occasion chip, Closet "+") | `@expo/ui` `Menu` / `ContextMenu` inside `<Host>` | Native iOS menu. Web stand-in in `.web.tsx`. |
| `.contextMenu` on a card | `@expo/ui` `ContextMenu` | Every context-menu action also exists as a visible button (02 rules). |
| Toast overlay above the tab bar (G2) | An absolutely positioned view in the root layout, bottom offset = safe area + 62 + 21 + 8 | Tab-bar height can't be measured with NativeTabs (`05` T33); use the constants. Announce with `AccessibilityInfo.announceForAccessibility`. |
| `@Observable AppRouter` (`selectedTab`, paths, `pendingStylistAction`) | expo-router's own state for tabs and paths + a tiny `pendingStylistAction` store (§8) | No global state library. |
| `.onChange(of: router.pendingStylistAction)` in `StylistView` | `useEffect` on `usePendingStylistAction()` in the Stylist screen, then `clearStylistAction()` | §8. |
| `.onOpenURL` / `kitted://` scheme | `scheme: 'kitted'` in `app.config.ts`; links map to routes automatically; `src/app/+native-intent.tsx` (`redirectSystemPath`) rewrites `kitted://demo/...` and notification links | Demo routes exist only when `extra.demo` is true (`05` §5.2). |
| Launch arguments (`-demoScreen 7` → `UserDefaults`) | Deep-link query params, iOS `Settings.get('demoScreen')` (React Native's `Settings` reads `UserDefaults`), Maestro `launchApp.arguments`, build-time `extra` via expo-constants | One parser: `src/demo/demoArgs.ts` (`05` §5.2). |
| `ScrollViewReader.scrollTo(id)` + pulse ("Show in chat") | `FlatList` ref → `scrollToIndex({ index, viewPosition: 0.5 })` (provide `getItemLayout` or handle `onScrollToIndexFailed`) + a Reanimated opacity pulse (cross-fade with Reduce Motion) | |

---

## 3. Layout and views

| SwiftUI | React Native | Notes |
|---|---|---|
| `VStack` / `HStack` / `ZStack` | `<View>` with `flexDirection: 'column'` (default) / `'row'` / absolute children | `spacing:` → `gap`. |
| `.padding(16)` / `.frame(width:height:)` / `.frame(maxWidth: .infinity)` | `padding: 16` / `width`, `height` / `alignSelf: 'stretch'` or `flex: 1` | Use the `space` / `radius` constants from `src/design-system/tokens.ts`. |
| `RoundedRectangle(cornerRadius:, style: .continuous)` | `borderRadius` + `borderCurve: 'continuous'` | `borderCurve` is iOS-only and matches SwiftUI's continuous corners. |
| `.shadow(…)` (light mode only) | `boxShadow` style (New Architecture) | Drop it in dark mode, per 03 §4.4. |
| `.overlay` / `.background` | Absolutely positioned child / a wrapping `View` with `backgroundColor` | |
| `ScrollView` + `LazyVStack` (chat thread) | `FlatList` (messages, day separators as items) | `ScrollView` for short pages (settings, sheets). NativeTabs' minimize-on-scroll and scroll-to-top don't support `FlatList` fully (`05` T33). |
| `LazyVGrid` (Closet tiles, Lookbook grid, calendar) | `FlatList` with `numColumns` (re-key it when columns change), or a wrapping `View` (`flexWrap: 'wrap'`) for short grids like the 7-column calendar | Columns drop 3 → 2 → 1 at accessibility sizes (02 §1.5): drive `numColumns` from `fontScale`. |
| `.safeAreaInset(edge: .bottom) { Composer }` | Composer as the last child of a `KeyboardAvoidingView` (`behavior="padding"`), bottom padding from `useSafeAreaInsets()` + the tab bar constants | `react-native-keyboard-controller` (pinned by SDK 57) is smoother but is a third-party package: ask first. |
| `GeometryReader` | `onLayout`, `useWindowDimensions()` | |
| `ViewThatFits` / stacking at accessibility sizes | `const { fontScale } = useWindowDimensions(); const stacked = fontScale >= AX_THRESHOLD` | The threshold lives in the design system. |
| `ContentUnavailableView` (C1e, L1e) | Our `EmptyState` component (icon + title + text + button), from the TS design system | `@expo/ui` also has `ContentUnavailableView`, but it needs `<Host>` and has no web; use ours so web matches. |
| `ProgressView()` | `ActivityIndicator` (or `@expo/ui` `ProgressView`) | Static with Reduce Motion where 02 says so. |
| `Toggle` | React Native `Switch` (`trackColor`/`thumbColor` left default on iOS) | Native `UISwitch`, works on web. |
| `Picker(.segmented)` (Build, Fit, Lookbook Looks/Calendar/Saved, camera Propped/Mirror) | `@expo/ui` `Picker` with the `segmented` style inside `<Host>` | Camera Propped/Mirror is a glass capsule switch (`GlassView`), not the system segmented control (03 §5 `ModeSwitch`). Web: `.web.tsx` row of pressables. |
| Wheel picker (birth year O3w) | `@expo/ui` `Picker` with the `wheel` style | Starts with no value (ruling 28). |
| `DatePicker(.hourAndMinute)`, compact | `@expo/ui` `DatePicker` (time only) | Web: `<input type="time">` stand-in. |
| `Stepper` (height) | `@expo/ui` `Stepper`, or a custom − / + with `accessibilityRole="adjustable"` | The value is SF Pro, `title3` semibold, tabular (03 §3.2). |
| `TextField` (composer, Describe it) | `TextInput` (`multiline` for the composer, `returnKeyType`, `enablesReturnKeyAutomatically`) | Placeholder color `ink3`. |
| `Button` / `.buttonStyle(…)` | `Pressable` inside our `PrimaryButton` / `SecondaryButton` | `hitSlop` or `minHeight: 44`. |
| `.contentShape(Rectangle())` + `.frame(minWidth: 44, minHeight: 44)` | `hitSlop={…}` or `minWidth: 44, minHeight: 44` on the `Pressable` | |
| `Image(uiImage:)` / photo crops (`.scaledToFill()`, top-aligned) | `expo-image` `<Image contentFit="cover" contentPosition="top" />` inside a clipping `View` | Demo crops use the PH table (`05` §4.7). Thumbnails in lists, never full images. |
| `.redacted` / shimmer skeleton | A Reanimated opacity loop on `surface2` blocks | Static with Reduce Motion. |
| Count-up and cross-fade animations | `react-native-reanimated` (pinned by SDK 57, already in the template) | Cross-fade only with Reduce Motion (`useReducedMotion()`). |
| `withAnimation`, `.transition` | Reanimated `withTiming` / layout animations (`entering`, `exiting`) | |

---

## 4. Design tokens, type and appearance

| SwiftUI / iOS | React Native | Notes |
|---|---|---|
| `Color.kInk` etc. via `UIColor` trait providers | `tokens.ts` light/dark/Increase-Contrast sets + `useTokens()` from `theme.tsx` | Names drop the `k` prefix (02 §0.3). For native props that take one color (`tintColor`), `DynamicColorIOS({ light, dark, highContrastLight, highContrastDark })`. |
| Increase Contrast token switch | `DynamicColorIOS` `highContrastLight`/`highContrastDark`, or the theme reading the system setting | 03 §2.1 lists the values. |
| `.preferredColorScheme(nil / .light / .dark)` (You › Appearance) | `Appearance.setColorScheme('light' \| 'dark' \| null)` plus the theme provider's override, stored in the `kv` table | `null` follows the system. |
| `.environment(\.colorScheme, .dark)` on fixed-dark screens (camera, lock-screen previews, share card) | `<ThemeProvider forced="dark">` around those routes; native props (`StatusBar style="light"`, `GlassView colorScheme="dark"`) set explicitly | |
| `Font.body`, `.headline`, `.footnote.weight(.semibold)` … | `<KText role="body">`, `role="headline"`, `role="footnoteSemibold"` … from `typography.ts` | Each role sets size, weight and the matching iOS `dynamicTypeRamp`, so it scales on Apple's curve. Never hard-code `fontSize` for reading text. |
| Dynamic Type (to AX5) | `allowFontScaling` stays true (default) + `dynamicTypeRamp` per role; layout switches on `useTheme().isAccessibilitySize` (`fontScale >= 1.75`) | Policy: reading text always scales; logos (wordmark) are fixed; the score scales but caps at 1.6× (76 → about 122 pt; `typography.ts → numeralMaxScale`, applied by `<Numeral>` as `maxFontSizeMultiplier`). |
| `@ScaledMetric(relativeTo: .largeTitle) var size = 76` | Text: `<Numeral size={76}>` (ramp + 1.6× cap). Non-text sizes: `Math.round(76 * Math.min(fontScale, numeralMaxScale))` | Use for non-text sizes too (icon boxes, the score block). |
| `.monospacedDigit()` | `fontVariant: ['tabular-nums']` | |
| `Font.system(.caption, design: .monospaced)` (mono labels) | The `mono` roles in `typography.ts` (system monospaced font, 12 pt minimum) | Exact family name to confirm on device (`05` T36). |
| `.textCase(.uppercase)` + tracking (the optional mockup look) | `textTransform: 'uppercase'`, `letterSpacing: 1` | VoiceOver still gets the sentence-case `accessibilityLabel`. Default stays sentence case (ruling 29). |
| `Font(CTFont)` with variable `wdth`/`wght` axes (Archivo) | **Static Archivo cuts** embedded with the `expo-font` plugin, referenced by the names in `fonts.ts` | RN on SDK 57 can't set variable axes. `03` §3.4's static fallback is now the main path. |
| `UIAppFonts` in Info.plist | `['expo-font', { fonts: [...] }]` in `app.config.ts`; web loads the same files with `useFonts` | |
| `.glassEffect(.regular.tint(...).interactive(), in: Circle())` | `<GlassView glassEffectStyle="regular" tintColor="rgba(0,0,0,0.3)" isInteractive style={{ borderRadius: 22 }} />` from `expo-glass-effect` | iOS 26+ only; falls back to a plain `View`, so give it the solid Reduce-Transparency style as its base. Never set `opacity: 0` on it or a parent. |
| `GlassEffectContainer` | `GlassContainer` | |
| `.ultraThinMaterial` (live face blur ellipse in the camera) | v1: an elliptical, clipped `BlurView` (expo-blur) over each face rect that `kitted-vision` sends to JS (03 §8), or drawn natively inside the module's camera view; in the demo, a solid ellipse | `expo-blur` is in the dependency list (`05` S15); `IconButton` also uses it as the non-glass fallback. |
| Composer fade `LinearGradient` | `expo-linear-gradient` (first-party) or a few stacked translucent views | Ask before adding `expo-linear-gradient` if it's not already present. |
| SF Symbols (`Image(systemName:)`) | `expo-symbols` `SymbolView` through our `<Icon name="…">` component (`ts/design-system/components/Icon.tsx`) | Today `Icon` passes the SF name only, so **web and Android show an empty box of the same size** (`fallback`). If web screenshots need icons, add a Material name per `symbols.ts` key and pass `name={{ ios, android, web }}` (check the real `SymbolViewProps['name']` type after install). The 03 §7 names stay canonical for iOS. |
| `.symbolEffect` / `.contentTransition(.symbolEffect)` | `SymbolView animationSpec` (iOS) | Off with Reduce Motion. |
| `.symbolRenderingMode(.hierarchical)` | `SymbolView type="hierarchical"` | iOS only. |

---

## 5. Accessibility (VoiceOver and settings)

| SwiftUI | React Native | Notes |
|---|---|---|
| `.accessibilityLabel("…")` | `accessibilityLabel="…"` | Labels from the copy deck; scores via `spokenScore()` from `score.ts` ("8", not "8.0"). Never mention the body. |
| `.accessibilityHint` | `accessibilityHint` | |
| `.accessibilityValue` | `accessibilityValue={{ text }}` or `{ min, max, now }` | |
| `.accessibilityElement(children: .combine)` (card = one element) | `accessible={true}` on the container (children become one element) + an explicit `accessibilityLabel` | |
| `.accessibilityElement(children: .contain)` | Leave `accessible` off; children stay separate | |
| `.accessibilityAddTraits(.isHeader)` | `accessibilityRole="header"` | |
| `.isButton` / `.isLink` / `.isSelected` | `accessibilityRole="button"` / `"link"`, `accessibilityState={{ selected: true }}` | Chips and look tiles use `selected`. |
| Adjustable (height stepper, segmented values) | `accessibilityRole="adjustable"` + `accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}` + `onAccessibilityAction` | |
| `.accessibilityAction(named: "Re-check") { … }` | `accessibilityActions={[{ name: 'recheck', label: 'Re-check' }]}` + `onAccessibilityAction={(e) => …}` | The custom actions rotor on iOS. |
| `.accessibilityHidden(true)` (decoration, seams) | `accessibilityElementsHidden` + `importantForAccessibility="no-hide-descendants"` | |
| `AccessibilityNotification.Announcement("…").post()` | `AccessibilityInfo.announceForAccessibility('…')` | Toasts, the 3-2-1 count, "Score 8.0 → 8.5". |
| `@Environment(\.accessibilityReduceMotion)` | `AccessibilityInfo.isReduceMotionEnabled()` + `addEventListener('reduceMotionChanged', …)`, or Reanimated `useReducedMotion()` | |
| `\.accessibilityReduceTransparency` | `AccessibilityInfo.isReduceTransparencyEnabled()` + `'reduceTransparencyChanged'` | Glass → solid `surface` (or black 60% on the camera). |
| Increase Contrast | `DynamicColorIOS` high-contrast keys (§4) | |
| Bold Text | `AccessibilityInfo.isBoldTextEnabled()` | System font handles it; check Archivo text still reads. |
| `\.dynamicTypeSize` / `.dynamicTypeSize(.accessibility5)` in previews | `useWindowDimensions().fontScale`; to test, `xcrun simctl ui <udid> content_size accessibility-extra-extra-extra-large` | No preview trait; use the Simulator and the `demo/gallery` route. |
| `AVSpeechSynthesizer` (optional spoken 3-2-1) | `expo-speech` `Speech.speak('3')` | Off with `uiTesting`. |
| `performAccessibilityAudit()` in XCUITest | Xcode Accessibility Inspector → Audit, run on the Simulator for each main screen; Maestro flows assert key labels (`assertVisible: { text: … }`) | No automated audit API in React Native; write down exceptions (`05` P7). |
| Large content viewer (tab bar) | Comes with `NativeTabs` (system tab bar) | |

---

## 6. Data, storage and services

| SwiftUI / iOS | React Native / Expo | Notes |
|---|---|---|
| SwiftData `@Model` classes (UserProfile, Fact, FitCheck, Reading, ClosetItem, Outfit, WearLog, Correction, ChatMessage, UsageDay, EventQueue) | expo-sqlite tables, one per model, plus TypeScript row types and mappers in `src/data/`; the value types (`Reading`, `Garment`, `RubricResult`, `Fix`, `FixSuggestions`, `ClosetItem`) live in `@kitted/core` | Column rules: defaults everywhere, enums as strings, JSON as TEXT, no extra UNIQUE (`05` §3.2, P0 adjustments). |
| `VersionedSchema` + `SchemaMigrationPlan` | `PRAGMA user_version` migrations in `migrations.ts`, run before the first render (`SQLiteProvider onInit` or our own gate) | Never edit an old migration; add a new step. |
| `@Query` (live lists) | Repository functions + a hook that re-reads on `addDatabaseChangeListener` (open the DB with `enableChangeListener: true`) | Keep queries in `src/data/`, not in components. |
| `ModelContainer` for previews / sample data | `db.web.ts` in-memory repository seeded from `seed.json`, and `seedLoader.ts` on device | |
| `@AppStorage` / `UserDefaults` (small prefs) | A `kv` table, or `expo-sqlite/kv-store` (AsyncStorage-compatible) | Appearance, last occasion, idea time, onboarding step. |
| Keychain (device ID, age-blocked flag) | `expo-secure-store` (`setItemAsync`, `getItemAsync`, `keychainAccessible: AFTER_FIRST_UNLOCK`) | Survives reinstall on iOS, not on Android. Web: `secure.web.ts` stub. "Delete all my data" removes the device ID and keeps the age flag. |
| `FileManager` → `Application Support/Photos/`, `FileProtectionType.completeUntilFirstUserAuthentication` | `expo-file-system` `new Directory(Paths.document, 'photos')`, `new File(dir, `${id}.jpg`)` | Documents is in the device backup (ruling 18). iOS's default protection class already is "until first user authentication". |
| `Bundle.main` / `Bundle.module` resources | `require('…/assets/…')` for images; `import x from '…/seed.json'` for JSON | Metro serves image bytes as-is; verify the SHA once (`05` §4.7). |
| `Codable` | Plain JSON + a parse/validate function per type (no `any`) | Keep the reading's v3 shape exactly. |
| `CryptoKit.SHA256` | `expo-crypto` `digest(CryptoDigestAlgorithm.SHA256, bytes)` (or done in Swift inside `kitted-vision.prepare` in v1) | Hash the **original** bytes. |
| `Localizable.xcstrings` + `String(localized:)` with plurals | `src/i18n/en.ts` keyed by the 02 §5 copy keys + `Intl.PluralRules('en')` | One language in v1. |
| `Date`, `Calendar` in America/New_York, 4 am rollover | `Clock` interface + `Intl.DateTimeFormat(…, { timeZone })`; `dayKey` in `@kitted/core` | Never `new Date()` inside features (demo clock, `05` §5.2). |
| `URLSession` (streaming) | `fetch` (Expo installs `expo/fetch` as the global `fetch` since SDK 56, which supports streaming bodies) | Only in `DirectGeminiReadingSource` (dev) and the proxy client (M4). |
| `AsyncThrowingStream<ReadingEvent, Error>` | `AsyncIterable<ReadingEvent>` (an `async function*`), errors as a `failed` event or a thrown error | The event names stay as in 04 §11. |
| `@Observable` flow controller with a state enum | A reducer (`machine.ts`) with a discriminated-union state + a hook (`useFitCheck`) | Unit-test the reducer in Jest without React. |
| `#if DEBUG` | `__DEV__` for dev-only code; `Constants.expoConfig.extra.demo` for demo tools that must also exist in the Release demo build | App Store builds set `KITTED_DEMO=0`. |
| `Secrets.xcconfig` → Info.plist key | `app/.env.development.local` → `EXPO_PUBLIC_GEMINI_DEV_KEY` (dev builds only) | `EXPO_PUBLIC_*` is inlined in the bundle; the release guard greps the export (`05` P8). |
| Info.plist keys | `app.config.ts` → `ios.infoPlist` and config plugin options | Read the generated plist after `npx expo prebuild` (`05` T29). |
| Entitlements (App Attest, Declared Age Range) | `app.config.ts` → `ios.entitlements` | Needs the paid Developer Program to sign. |
| `PrivacyInfo.xcprivacy` | `app.config.ts` → `ios.privacyManifests` | UserDefaults reason `CA92.1` now; data types at M4. |
| Swift Testing (`swift test`) for KittedCore | The `@kitted/core` package's own test script (`npm test --workspace @kitted/core`) | Runs in Node. |
| XCTest unit tests for the app | Jest with `jest-expo` + `@testing-library/react-native`; routing tests with `expo-router/testing-library` (`renderRouter`) | |
| XCUITest | Maestro flows in `app/e2e/` (Simulator only) | |
| `#Preview` (light, dark, AX5) | The demo-only `src/app/demo/gallery.tsx` route, viewed on web and the Simulator | |

---

## 7. Platform features

| SwiftUI / iOS | React Native / Expo | Notes |
|---|---|---|
| StoreKit 2 `Product.products(for:)`, `purchase()`, `Transaction.updates` | **Demo:** `DemoStore` behind `Entitlements`. **v1 (S8, founder approves):** `react-native-purchases`: `Purchases.getOfferings()`, `Purchases.purchasePackage(pkg)`, `Purchases.getCustomerInfo()`, `Purchases.addCustomerInfoUpdateListener(…)` | The `Entitlements` interface hides which one is in use. Alternative: `expo-iap`. |
| `SubscriptionStoreView(groupID:)` (P1b) | **Our own plans page** (02 D18/P1b layout) fed by `Entitlements.products()` | Must show everything Apple's view showed: plan name and length, price per period, the billed amount most prominent ($29.99/year), trial length and post-trial price, auto-renewal, Restore, Terms and Privacy links, X and Continue free from the first frame (Guideline 3.1.2). |
| `.subscriptionStoreControlStyle(.picker)`, `.storeButton(.visible, for: .restorePurchases / .policies)` | Plan cards as a radio group (`accessibilityRole="radio"`, `accessibilityState.checked`), a Restore button, Terms/Privacy links | |
| `AppStore.sync()` (Restore) | `Purchases.restorePurchases()` | Toast `Purchases restored.` / `Nothing to restore.` |
| `.manageSubscriptionsSheet` | `Purchases.showManageSubscriptions()` (or `Linking.openURL('https://apps.apple.com/account/subscriptions')` without RevenueCat) | |
| `.offerCodeRedemption` (the $19.99 founding offer) | `Purchases.presentCodeRedemptionSheet()` | iOS only. |
| `Kitted.storekit` / `SKTestSession` | `DemoStore` in the demo; RevenueCat Test Store or App Store sandbox later | No local StoreKit file in the RN plan. |
| `UNUserNotificationCenter` (3 local kinds) | `expo-notifications`: `requestPermissionsAsync()`, `scheduleNotificationAsync({ content, trigger: { type: SchedulableTriggerInputTypes.DAILY, hour, minute } })`, `DATE`, `TIME_INTERVAL`, `cancelScheduledNotificationAsync(id)`, `setNotificationHandler`, `addNotificationResponseReceivedListener` / `useLastNotificationResponse` | Ask only after "Yes, pick a time". No push entitlement. |
| `PhotosPicker` (`.images`, single; `maxSelectionCount: 20` for Closet "+") | `expo-image-picker` `launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection, selectionLimit, exif: false, preferredAssetRepresentationMode: 'current' })` | PHPicker: no permission, no plist string (`photosPermission: false` in the plugin). |
| Re-encode through ImageIO (strip EXIF/GPS) | `kitted-vision.prepare()` in Swift (v1) | The demo uploads nothing. |
| `AVCaptureSession` camera (front default, flip, torch/screen flash) | **Demo:** `SimulatedCameraSource`. **v1:** a native camera view in `kitted-vision` (Swift, AVFoundation); fallback `react-native-vision-camera` v5 | expo-camera has no per-frame access, so it can't drive the live guide (`05` S7). |
| Vision `VNDetectHumanBodyPoseRequest` / `DetectHumanBodyPoseRequest`, `VNDetectFaceRectanglesRequest`, `VNDetectHumanRectanglesRequest`, `VNGeneratePersonInstanceMaskRequest` | `modules/kitted-vision` (Swift, Expo Modules API: `Name`, `AsyncFunction`, `Events`, `View`) | Android later: ML Kit in the same module's Kotlin side, same JS interface. |
| Core Image pixelate + composite (`CIFilter.pixellate()`) | Inside `kitted-vision` (Swift) | Never a light blur on anything that leaves the phone. |
| `DetectLensSmudgeRequest`, Sensitive Content Analysis | Inside `kitted-vision`, behind flags; not in the demo | Simulator support is unreliable (`05` T15). |
| `UIImpactFeedbackGenerator` / `.sensoryFeedback` | `expo-haptics`: `selectionAsync()` (chip/tile), `impactAsync(ImpactFeedbackStyle.Medium)` (capture), `impactAsync(Light)` (each 3-2-1 tick), `notificationAsync(NotificationFeedbackType.Success)` (score rise, purchase) | None on errors (02 §4). No-op on web. |
| `ImageRenderer` (share card 1080 × 1920 / 1080 × 1350) | `react-native-view-shot` `captureRef(ref, { format: 'png', width: 1080, height: 1920, result: 'tmpfile' })` on an off-screen `ShareCardView` | The same component renders the preview and the image. |
| `ShareLink` | `expo-sharing` `shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png' })` | The system share sheet (Instagram, TikTok, Messages). |
| Save to Photos | `expo-media-library`: `requestPermissionsAsync({ writeOnly: true })`, then save the asset | Add-only key via the plugin's `savePhotosPermission`; `photosPermission: false`. |
| `SFSafariViewController` (Terms, Privacy, links) | `expo-web-browser` `openBrowserAsync(url)` | |
| `UIApplication.openSettingsURLString` (camera off, notifications off) | `Linking.openSettings()` | |
| `AgeRangeService.requestAgeRange(ageGates:)` / 26.4 regulatory API | `expo-age-range`: `requestAgeRangeAsync({ threshold1: 18 })`, `isEligibleForAgeFeaturesAsync()`, `getRequiredRegulatoryFeaturesAsync()` | Behind `AgeAssurance`; stub in the demo; entitlement + real device for M4. |
| `DCAppAttestService` (App Attest) | `@expo/app-integrity`: `generateKeyAsync()`, `attestKeyAsync(keyId, challenge)`, `generateAssertionAsync(keyId, challenge)`, `isSupported` | M4; not in the Simulator. |
| App icon, `AccentColor` in `Assets.xcassets` | `app.config.ts` `icon` (and `ios.icon`); the accent is a token, not an asset | |
| Status bar style on dark screens | `expo-status-bar` `<StatusBar style="light" />` on those routes | |

---

## 8. The cross-tab jump pattern in expo-router

`02` §1.4 wants buttons in Closet, Lookbook and You to switch to Stylist and hand it an action. Do it with a tiny store plus a normal navigation call. Don't put the action in route params: params stick to the screen and fire again on re-render or back navigation.

```ts
// src/router/stylistAction.ts
import { useSyncExternalStore } from 'react';
import { router } from 'expo-router';

export type StylistAction =
  | { kind: 'checkMyFit' }
  | { kind: 'styleItem'; itemId: string }
  | { kind: 'wearAgain'; lookId: string }
  | { kind: 'recheck'; lookId: string }
  | { kind: 'scrollTo'; messageId: string }
  | { kind: 'startMove'; moveId: string }
  | { kind: 'openCard'; messageId: string };

let pending: StylistAction | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function goToStylist(action: StylistAction) {
  pending = action;
  emit();
  router.navigate('/stylist');            // switches tabs; the other tabs' stacks stay as they were
}
export function clearStylistAction() { pending = null; emit(); }
export function usePendingStylistAction() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    () => pending,
  );
}
```
```tsx
// in src/app/(tabs)/stylist/index.tsx
const action = usePendingStylistAction();
useEffect(() => {
  if (!action) return;
  clearStylistAction();
  switch (action.kind) {
    case 'checkMyFit': return consentGiven ? router.push('/camera') : router.push('/onboarding/consent');
    case 'styleItem':  return postStyleItem(action.itemId);       // his bubble + an Outfit card (code only)
    case 'scrollTo':   return scrollToMessage(action.messageId);  // FlatList.scrollToIndex + one pulse
    // …the rest per 02 §1.4
  }
}, [action]);
```
- **The exception in 02 §1.4** (L3/Y1 "Start" on move 1 pushes C5 in the Closet tab): `router.navigate('/closet/starter')`. Any route inside another tab's folder switches to that tab and pushes there.
- **Notification taps:** in the root layout, `Notifications.addNotificationResponseReceivedListener` (and `useLastNotificationResponse` for a cold start) maps the payload to `goToStylist({ kind: 'openCard', messageId })`, or to `router.navigate('/you/plan')` for "trial ending".
- **Deep links** (`kitted://…`) are routes already; `+native-intent.tsx` only rewrites the ones that need it (demo links, old notification links).
- **Modals from a tab** (camera, sheets) are root-Stack routes: `router.push('/camera')` from anywhere presents over the tab bar, and `router.back()` returns to the same tab and scroll position.

Route skeletons (fill in from `05` §4.3):
```tsx
// src/app/_layout.tsx (shape)
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Protected guard={ageBlocked}>
    <Stack.Screen name="age-stop" options={{ gestureEnabled: false }} />
  </Stack.Protected>
  <Stack.Protected guard={!ageBlocked && !onboarded}>
    <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
  </Stack.Protected>
  <Stack.Protected guard={!ageBlocked && onboarded}>
    <Stack.Screen name="(tabs)" />
  </Stack.Protected>
  <Stack.Protected guard={!ageBlocked}>
    <Stack.Screen name="camera"  options={{ presentation: 'fullScreenModal' }} />
    <Stack.Screen name="paywall" options={{ presentation: 'fullScreenModal' }} />
    <Stack.Screen name="share/[checkId]" options={{ presentation: 'fullScreenModal' }} />
    <Stack.Screen name="sheets/why/[checkId]"
      options={{ presentation: 'formSheet', sheetAllowedDetents: [0.78, 1], sheetGrabberVisible: true }} />
    <Stack.Screen name="sheets/correct/[checkId]"
      options={{ presentation: 'formSheet', sheetAllowedDetents: [1], sheetGrabberVisible: true }} />
    {/* …every other sheet with its 02 detents (.medium → 0.5, .large → 1) */}
  </Stack.Protected>
</Stack>

// src/app/(tabs)/_layout.tsx
import { NativeTabs } from 'expo-router/unstable-native-tabs';
<NativeTabs tintColor={accent}>
  <NativeTabs.Trigger name="stylist">
    <NativeTabs.Trigger.Label>Stylist</NativeTabs.Trigger.Label>
    <NativeTabs.Trigger.Icon sf="bubble.left" md="chat_bubble" />
  </NativeTabs.Trigger>
  {/* closet: hanger · lookbook: square.grid.2x2 · you: person (03 §7) */}
</NativeTabs>
```
Check the onboarding first check (O5 → S2 camera → S5 → S6): the camera is a root modal, so it opens over the onboarding stack too. The guard switch from onboarding to `(tabs)` happens when onboarding finishes, not before.

---

## 9. Things with no direct equivalent, and what to do

| SwiftUI thing | What to do in React Native |
|---|---|
| `SubscriptionStoreView`'s built-in legal text and states (P1s "Products loading" = its own placeholder) | Build the states yourself: loading skeleton, products failed (Retry), purchase pending, purchase failed, restored. Copy from 02 §5.11. |
| `.navigationSubtitle` | Custom `headerTitle` (`05` T25). |
| Variable-font axes on Archivo | Static cuts (`fonts.ts`); SDK 58's React Native may add `fontVariationSettings` (test before switching). |
| `performAccessibilityAudit()` | Accessibility Inspector audits by hand + Maestro label checks. |
| `#Preview` traits | `demo/gallery` route + Simulator settings. |
| `xcodebuild test` with a StoreKit config | Not applicable; `DemoStore` + unit tests on the `Entitlements` interface. |
| SwiftUI's automatic Dynamic Type for non-text sizes | Scale by `fontScale` yourself where 02/03 say a size scales. |
| `Localizable.xcstrings` tooling | A typed `en.ts`; a test that every key used in code exists. |
| Live face blur in the camera preview | Native, inside `kitted-vision`'s camera view (v1). The demo's simulated preview draws a solid ellipse. |
| A "SwiftUI preview" of the iOS 26 glass and sheets on web | None: web shows stand-ins. Judge those on the Simulator only (`05` T21). |

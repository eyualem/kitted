# 03 · Kitted design system, ready for React Native (Expo)

*Written Oct 6, 2026 for the Claude instance that builds the app. You have no memory of this project, so this file tells you everything you need about how Kitted looks. Read it once before you write any view code, and keep it open while you build.*

**Files you need:**
- **Visual source of truth:** `/Users/eyu/Desktop/files/Kitted/mockups/kitted-mockups.html`. Open it in a browser. Inside each `.phone`, **1 CSS px = 1 iOS point**: the screen is a true 402 × 874 pt iPhone 17, shrunk on the page with CSS `zoom: .735`. The page also has an "App appearance" switch (Match page / Light / Dark).
- **Starter code (React Native, TypeScript):** `/Users/eyu/Desktop/files/Kitted/handoff/ts/design-system/`. Stack: Expo + expo-router, TypeScript, iOS first, iOS 26 look. It holds:
  - `tokens.ts` (colors light/dark with the contrast fixes, Increase Contrast overrides, the fixed-dark palette, spacing, radii, sizes, shadows, score-word bands)
  - `typography.ts` (iOS text styles, the §3.2 role map, Archivo/mono faces, the two FOUNDER DECIDES flags)
  - `fonts.ts` (Archivo files, URLs, license, `expo-font` loading)
  - `score.ts` (half-step rounding, display, speech, score word)
  - `symbols.ts` (the §7 SF Symbol table)
  - `theme.tsx` (`ThemeProvider`, `useTheme()`, `<FixedDark>`, `setAppAppearance()`)
  - `components/`: `KText`, `Icon`, `KCard` + `KCardSection`, `Seam` + `RowDivider`, `WovenLabel`, `Numeral`, `ScoreBlock` + `PartialLabel`, `Chip` + `ChipFlow` + `Pill`, `KButton` + `TextLink`, `IconButton`, `FixRow` + `TipLine`, `MonoLabel` + `TagLine`, `LedgerRow` + `LedgerTotal`, `StageList`, `DetectionTag`, `StylistMessage` / `UserBubble` / `PhotoBubble` / `NeckDownPhoto` / `DayStamp`.
  - It uses only `react-native` and four Expo modules: `expo-font`, `expo-symbols`, `expo-glass-effect`, `expo-blur`.
  - **What was checked (Oct 6):** a strict `tsc` (TypeScript 6.0.2, `strict` + `noUncheckedIndexedAccess`) passes against **hand-written type stubs** in `ts/design-system/_stubs/` (react, react-native, the four Expo modules), because no packages were installed. A negative test confirmed the stubs reject bad props. `score.ts` was compiled and run in Node: it matches all 181 score words in `fixtures/expected_scores.json`. **Nothing was rendered**: no simulator, no Expo app. **Delete `_stubs/` and the folder's `tsconfig.json`** once the folder is inside the Expo app with real packages, then fix whatever the real types flag.
- **Superseded:** `/Users/eyu/Desktop/files/Kitted/handoff/archive/swift/DesignSystem.swift`, the old SwiftUI starter. **Reference only**; don't build from it. §12 maps its SwiftUI APIs to the React Native ones.
- **Rulings that shaped this file:** `/Users/eyu/Desktop/files/Kitted/brainstorm/13_setup-decisions.md`, row 29. The default is the mockup look (chalk, indigo, copper). Archivo is used only for score numerals and the wordmark, SF Pro for all reading text, and SF Mono replaces the mockup's DM Mono. Rows 21 and 24 also apply.
- **Older competing system:** `/Users/eyu/Desktop/files/Kitted/app-build-spec.md` §6 (warm paper, loden green, New York). **Its palette and fonts are superseded.** Its rules are kept and folded in below.
- **Real iOS 26 sizes:** `/Users/eyu/Desktop/files/Kitted/brainstorm/12_ios26-metrics.md`. **Photo rules:** `/Users/eyu/Desktop/files/Kitted/brainstorm/09_photos-in-the-ui.md`.

**Mockup scale note:** `brainstorm/12` found an older mockup where every control was 1.3–1.45× too big. The current mockup has been redrawn in true points: `.btn` 36, `.btn.lg` 50, `.chip` 34, `.nav` 44, `.tabbar` 62 with 21 pt insets, grabber 36 × 5, body 17. So **you can read sizes straight from the CSS.** Where the CSS has odd values like 10.5, 13, 15.5 or 23.5, they're leftovers from the old ×1.3 drawing. Snap them to the spacing scale in §4.

---

## 1. Principles

1. **Ink on chalk, with one copper rivet.** The look is raw denim and its copper rivet. Everything is indigo ink on cool chalk (light) or night (dark), and **copper is the only accent**. **Copper marks score movement only** (founder, Oct 12, DECISIONS-LOG #231): fix gains ("→ 9.0", "+0.75"), the "+1.0" pill, the new score in a re-check, "+N fits", the part with the most to gain, the active tab. **Text links and native header buttons are ink, semibold**, and point losses ("−0.5") are ink2 with their sign. If something else wants color, it doesn't get any. Photos supply the color.
2. **The score is a number and a word, in ink.** It is never red or green, and never color alone. Every score shows "8.0", "/10" and a word ("Sharp").
3. **SF Pro for anything you read, with Dynamic Type everywhere.** Archivo only appears on score numerals and the wordmark. Every text style scales up to AX5, and layouts reflow (rows stack) at accessibility sizes.
4. **The system does the chrome.** Use the native iOS pieces that Expo exposes: expo-router **NativeTabs** (the real Liquid Glass tab bar on iOS 26), the native stack's titles (large titles via `headerLargeTitleEnabled`), its header buttons, and native form sheets with detents (§4.5, §12). iOS-only views that React Native can't host (`ContentUnavailableView`, `SubscriptionStoreView`) are rebuilt as plain components that follow the same layout (EmptyState, PlanCard). Custom drawing is only for the content that makes Kitted Kitted: cards, scores, fixes, the closet and the camera overlay.
5. **Glass is for floating controls, never behind reading text.** You get it for free on the tab bar, toolbar items and sheets. You add it yourself only to camera controls. Text on a photo always gets a near-solid backing.
6. **44 pt hit areas, 4.5:1 text contrast,** even when the visible shape is smaller (34 pt chips, 36 pt buttons, 40 pt composer circles).
7. **Never rate or show the face or body.** Photos shown in the app are cropped neck-down (§8). The silhouette has no face. VoiceOver labels describe clothes, never the person.
8. **Quiet progress that only goes up.** Rotation, essentials and "days dressed with intent" count up. There are no streak chains, no ranks, no RPG or anime styling, and no emoji in the UI.

### What makes this look specific (keep all five)
- **The woven-label wordmark.** "KITTED" is set like a woven neck label: Archivo Expanded Bold, tracked wide, white on indigo `#1B2340`, a 2 pt corner radius, and a dashed vertical "stitch" 7 pt in from each end (`.woven`). A copper version reads "KITTED PRO" on the paywall. **The app icon** (founder, Oct 14, DECISIONS-LOG #263) is a single white K, drawn on the wordmark's Archivo Expanded Bold K, on a navy gradient; no stitch, no label. Source `mockups/icon-concepts/k/k1.svg`; the app ships it as the Icon Composer bundle `app/assets/expo.icon` (one K layer over an automatic navy gradient; iOS derives dark, tinted and clear).
- **Dashed "seam" dividers.** Sections inside a card are split by a 1 pt dashed line (5 on, 4 off) in faint ink at 45% opacity, inset 18 pt (`.seam`). Plain hairlines (`kLine`) separate rows *within* a section. Seams separate *sections*. The share card's band has a copper dashed top edge.
- **The tape-measure silhouette.** Height shows on a tailor's tape: a faceless figure filled with copper-soft, next to a copper tape with ticks and a dashed line from the head to the tape, labeled "5′10″" in mono copper (`sil()` in the mockup script).
- **Score words.** Every score has a word on a fixed five-band scale (§6). The words come from the positioning line ("Put together").
- **Copper as the only accent.** See principle 1. Green (`kGood`) is semantic, not an accent: it shows only on "+" ledger rows, "Closet updated", and the camera's "in frame" check, always beside a sign or icon.

---

## 2. Color tokens

All tokens are in `ts/design-system/tokens.ts` as plain color strings (hex, or `rgba()` for the translucent ones). `ThemeProvider` picks the light or dark set from `useColorScheme()` and swaps in the Increase Contrast overrides, and components read them with `useTheme().colors`. There's no asset catalog. **Names:** this file uses the Swift-era `kX` names; in code, drop the `k` and lowercase the first letter (`kInk3` → `colors.ink3`, `kFixedPhotoTag` → `fixed.photoTag`). Contrast is the WCAG 2.x ratio I computed for each light and dark pair (script: relative luminance, sRGB). For translucent tokens I composited first, then measured. **The mockup values that failed are marked FIXED, and `tokens.ts` already uses the fixed values.**

### 2.1 App tokens (follow the system appearance)

| Token | Light | Dark | Use | Contrast (light / dark) |
|---|---|---|---|---|
| `kBg` | `#F3F4F6` chalk | `#0C0E14` night | Screen background | — |
| `kSurface` | `#FFFFFF` | `#171A23` | Cards, sheets, chips, composer field, plan rows | vs bg 1.10 / 1.11 (the border does the separating) |
| `kSurface2` | `#ECEEF1` | `#21252F` | Secondary buttons, tiles, nav circles, stepper, bar tracks, empty slots | — |
| `kInk` | `#121628` | `#ECEEF3` | Primary text, score numeral, selected chip fill, filled fix badge | 16.29 bg · 17.93 surface · 15.43 surface2 / 16.62 · 14.97 · 13.20 |
| `kInk2` | `#585E70` | `#A1A7B5` | Secondary text, verdict line, ledger labels | 5.87 · 6.46 · 5.56 / 8.00 · 7.21 · 6.36 |
| `kInk3` **FIXED** | `#646A7A` (was `#848A99`) | `#9096A5` (was `#6E7484`) | Tertiary text: mono taglines, "Your stylist", stamps, meta lines, placeholders, chevrons | **Was** 3.14 · 3.46 · 2.97 / 4.13 · 3.72 · 3.28 → **now** 4.91 · 5.41 · 4.65 / 6.51 · 5.87 · 5.18 |
| `kInkFaint` | `#848A99` | `#6E7484` | The mockup's old ink-3, kept **for decoration only**: seams, ghost-tile dashes, disabled glyphs. Never text. | (decorative, exempt) |
| `kLine` | `#E0E3E8` | `#2A2F3B` | Hairlines, card and chip borders | 1.29 / 1.30 vs surface: decorative. Increase Contrast swaps to `#B9BEC8` / `#474D5C` |
| `kAccent` | `#9C5326` copper rivet | `#DE9762` | The one accent (principle 1) | 5.19 bg · 5.71 surface · 4.91 surface2 / 8.00 · 7.21 · 6.36 |
| `kAccentSoft` **FIXED** | `#9C5326` @ **9%** (was 11%) | `#DE9762` @ 15% | Tint behind accent text: `.chip.ac`, `.pill.ac`, open read-row, silhouette fill | Copper text on it: **was** 4.46 over bg → **now** 4.61 over bg, 5.05 over surface / 6.36 · 5.57 |
| `kPrimary` | `#121628` | `#ECEEF3` | Primary button fill, the composer camera circle, "Check my fit" | — |
| `kOnPrimary` | `#FFFFFF` | `#0C0E14` | Text and icons on `kPrimary` **and on `kAccent`** (badge, copper woven label) | 17.93 on primary · 5.71 on accent / 16.62 · 8.00 |
| `kMe` | `#1B2340` | `#2A3150` | His chat bubble | — |
| `kOnMe` | `#F2F3F7` | `#EEF0F6` | Text in his bubble | 13.91 / 11.15 |
| `kGood` | `#2B7651` "credit" | `#5DC08F` | Ledger "+", "Closet updated", camera OK check. **Always with "+" or an icon.** | 5.00 · 5.51 · 4.74 / 8.64 · 7.78 · 6.86 |
| `kCaution` (new) | `#8A5A00` | `#E2B356` | Warnings only ("Too dark", "Offline"), **always with `exclamationmark.triangle`** | 5.39 · 5.93 · 5.10 / 8.95 · 9.94 · 7.89 |
| `kDim` | `#0A0C14` @ 42% | `#000000` @ 55% | Scrim behind custom overlays (system sheets bring their own) | — |

**Rules:**
- **Mistakes in the ledger use copper with a "−" sign,** as in the mockup. Don't use red. Kitted has no red anywhere.
- **Selected states must not rely on color alone.** A selected chip changes fill (ink) *and* VoiceOver gets `accessibilityState={{ selected: true }}`. The selected plan in the paywall changes its border to ink, so **add a `checkmark.circle.fill` to the selected plan** (the mockup shows only the border).
- **Hierarchy note:** the fixed light `kInk3` (`#646A7A`) sits close to `kInk2` (`#585E70`). That's the price of passing 4.5:1 on `kSurface2`. Keep the hierarchy with size and weight (mono caps, footnote) rather than lightness.
- **Increase Contrast:** `kInk3` becomes `kInk2`, and `kLine` darkens. Already wired: `tokens.ts → highContrastOverrides`, switched by `AccessibilityInfo.isDarkerSystemColorsEnabled()` and the `darkerSystemColorsChanged` event (React Native's name for iOS Increase Contrast).

### 2.2 Non-text checks (UI ≥ 3:1 where the shape carries meaning)

| Item | Ratio | Verdict |
|---|---|---|
| Seam (`kInkFaint` @ 45% on surface) | 1.64 / 1.74 | Decorative; hidden from VoiceOver (`accessibilityElementsHidden`). OK. |
| Chip and card borders (`kLine`) | 1.29 / 1.30 | Decorative; the label identifies the chip, and selection uses an ink fill (17.9:1). OK. |
| Essentials slots: empty (`kSurface2`) vs card | 1.16 / 1.13 | The text "8 of 12" carries the meaning and is the VoiceOver value. Acceptable. Optional upgrade: a 1 pt `kLine` stroke on empty slots. |
| Onboarding progress: off segments (`kLine`) | 1.17 | Same: give it `accessibilityValue={{ text: 'Step 3 of 6' }}`. Acceptable. |
| Calendar log dot (copper on the week band) | 4.91 / 6.36 | OK, and the day label also says "1 outfit logged". |
| Fixed `kInk3` chevrons and pencil glyphs | 4.65+ | OK. |

### 2.3 Always-dark fixed palette (camera, lock-screen previews, share card)

These surfaces are dark in both appearances (`.phone.fixed` in the mockup). Wrap those view trees in `<FixedDark>` (from `theme.tsx`; it forces the dark token set for everything inside) and use these fixed colors (`tokens.ts → fixed`). **Worst case = text over a white area of the photo**, since you can't control what the photo shows. I tested each over white, black, 50% grey and light grey photo pixels and report the minimum.

| Token / element | Value | Use | Worst-case contrast |
|---|---|---|---|
| `kFixedNight` | `#08090D` | Share screen background | white 19.90 |
| `kFixedIndigo` | `#121628` | Share-card band; ink on white camera pills | white 17.93 · copper `#DE9762` 7.44 · watermark white @ 60% 7.03 |
| `kFixedLabel` | `#1B2340` | Woven label, stylist avatar "K", app icon base | `#EEF0F5` text 13.53 |
| `kFixedOnDark` | `#EEF0F5` | Woven-label text | — |
| `kFixedCopper` | `#DE9762` | Copper on dark: share-band delta, stitches, camera scan line | 7.44 on indigo |
| `kFixedLightPill` | white @ 92% | Camera tip pill ("Shoulders and hips in frame"), "Only this is sent" | indigo text 15.04 · green check `#2B7651` 4.62 |
| `kFixedPhotoTag` **FIXED** | `#0E111C` @ **80%** (mockup `rgba(14,17,28,.78)`) | Detection tags on photos, the occasion pill on the share card | white 9.54 |
| Detection tag, pending ("Shoes…") **FIXED** | text `#C3C7D2` on `kFixedPhotoTag` | Was white @ 75% on `rgba(14,17,28,.45)` = **2.38** | **6.04** |
| Share-card occasion pill **FIXED** | white on `#121628` @ **80%** (was 55%) | "Date" on the photo | **was 3.99 → 9.54** |
| Countdown circle **FIXED** | white numeral on `#0A0C14` @ **60%** + blur (was 35%) | The "2" during 3-2-1 | **was 2.32 → 5.16** (large text needs 3) |
| "Hold still" under the countdown **FIXED** | put it on a `kFixedPhotoTag` capsule | Was white with only a text shadow: **1.0 over white** | 9.54 |
| Camera mode switch (Propped / Mirror) **FIXED** | backing black @ **60%** (was 40%), label white @ 90% (was 75%), plus the bottom scrim | Was **3.81** | **7.94** with scrim · 5.04 without |
| Camera glass circles (X, flash, flip) **FIXED** | `GlassView` (expo-glass-effect) with `glassEffectStyle="regular"`, `tintColor="rgba(0,0,0,0.3)"` + the top scrim (black 45% → 0 over the top 22%) | Was white @ 16% glass: **2.68** for the white glyph | **6.10** |
| Lock-screen notification preview | white on white @ 20% over the indigo wallpaper | Mockup only; real notifications are drawn by iOS | 5.48–8.46 |

**Camera scrims (keep them):** a top gradient from black @ 45% to clear over the top 22%, and a bottom gradient from clear at 70% to black @ 70% at the bottom (copied from screen 5). Every contrast number above assumes they're there.

**Tab bar:** don't redraw the mockup's custom `accent-soft` capsule. My measurement of that drawing over dark content in light mode is only 3.02. Use expo-router's **NativeTabs** (the native iOS 26 tab bar) with `tintColor={colors.accent}` and `NativeTabs.Trigger.Icon sf={{ default: 'bubble.left', selected: 'bubble.left.fill' }}`. Import path: `expo-router/unstable-native-tabs` on SDK 54–57, `expo-router/native-tabs` on SDK 58+ (Expo docs, https://docs.expo.dev/router/advanced/native-tabs/). The system glass adapts its tint to what's underneath, which a hand-drawn version can't do.

---

## 3. Typography

### 3.1 Rules
- **SF Pro through the iOS text styles for all reading text.** Render every SF string with `<KText>` (`components/KText.tsx`): `<KText variant="body">`, `<KText variant="subheadline" weight="600">`, or a named role from §3.2 (`<KText role="fixTitle">`). `KText` sets the style's size and leading (`typography.ts → textStyles`: largeTitle 34/41, title1 28/34, title2 22/28, title3 20/25, headline 17/22 semibold, body 17/22, callout 16/21, subheadline 15/20, footnote 13/18, caption 12/16, caption2 11/13) **and** the matching `dynamicTypeRamp`, so each style scales on Apple's own Dynamic Type curve. Don't put raw `<Text style={{ fontSize }}>` on screen. SF Pro is the default system font on iOS, so leave `fontFamily` unset and never set `letterSpacing` on SF text (the system font applies its own tracking).
- **No weight below 400.** The mockup's in-between weights round: 550 → `'500'`, 600–650 → `'600'`, 700+ → `'700'`. (This file's `.medium` / `.semibold` / `.bold` notation = `'500'` / `'600'` / `'700'`.)
- **Tabular figures** everywhere numbers line up (scores, gains, ledger, prices): `fontVariant: ['tabular-nums']` (`<KText tabular>`).
- **Minimum size 12 pt** for mono labels (ruling 29) and **11 pt** for anything else.
- **Default leading** comes from the text styles. Don't override line height except on the score numeral.

### 3.2 Role map (mockup CSS → iOS text style)

**How to read the third column:** it uses Apple's text-style names. `.footnote.weight(.semibold)` means `<KText variant="footnote" weight="600">`; `.headline` means `variant="headline"`. Every row is also in `typography.ts → roles` (e.g. `role="fixDetail"`), with its color.

| Mockup role (class) | Mockup pt / weight | iOS text style | Color |
|---|---|---|---|
| Chat text (`.say`), his bubble (`.me`), composer field | 17 / 400 | `.body` | ink / onMe / ink3 placeholder |
| "Your stylist" header (`.say .who`) | 13.5 / 600 | `.footnote.weight(.semibold)` | ink3 |
| Day stamp (`.stamp`) | 13 / 500 | `.footnote.weight(.medium)` | ink3 |
| Photo-bubble caption (`.me.photo .cap`) | 13.5 | `.footnote` | onMe @ 90% |
| Nav title (`.nav .t`) / subtitle (`small`) | 17 / 600 · 12 / 500 | Native stack header title; for the subtitle use a two-line `headerTitle` (`headline` + `caption` ink2), since React Navigation has no subtitle option (verify on iOS 26) | system |
| Tab-page title (`.bigtitle`) | 34 / 700 | Native stack large title (`headerLargeTitleEnabled: true`) | system |
| Welcome hero line | 35 / 700 | `.largeTitle.weight(.bold)` | ink |
| Paywall headline | 31 / 700 | `.largeTitle.weight(.bold)` | ink |
| Sheet title (`.sheet h4`) | 22 / 700 | `.title2.weight(.bold)` | ink |
| Sheet subtitle (`.sub-t`) | 15 | `.subheadline` | ink2 |
| Limit-card headline | 19.5 / 650 | `.title3.weight(.semibold)` | ink |
| Score word (`.verdict b`) | 18 / 650 | `.headline` | ink |
| Verdict line (`.verdict span`) | 14.5 | `.subheadline` | ink2 |
| Card summary (`.summary`) | 16 | `.callout` | ink (or ink2 on partial/limit) |
| Fix title (`.fix .what b`) | 16 / 600 | `.callout.weight(.semibold)` | ink |
| Fix detail (`.fix .what span`) | 13.5 | `.footnote` | **ink2** (was ink3) |
| Fix badge number (`.fix .n`) | 13 / 700 | `.footnote.weight(.bold)` | ink |
| Gain (`.gain`) | mono 14.5 / 500 | mono value (SF Mono `.subheadline` medium: `<KText mono="value">`) | accent |
| Tip line (`.tipline`) | 13, lead-in 600 | `.footnote`; lead-in `.footnote.weight(.semibold)` | ink2; lead-in accent |
| Buttons (`.btn`) / large (`.btn.lg`) | 15 / 600 · 17 / 600 | `.subheadline.weight(.semibold)` · `.headline` | per style |
| Text links (`.links a`) | 15.5 / 600 | `.subheadline.weight(.semibold)` | accent |
| Chips (`.chip`) | 15 / 550 | `.subheadline.weight(.medium)` | ink |
| Quick-start chips (`.qc`), "Check my fit" (`.fitbtn`) | 14 / 600 · 15 / 650 | `.subheadline.weight(.semibold)` | ink · onPrimary |
| Pills (`.pill`) | 13 / 600 | `.footnote.weight(.semibold)` | ink2 / accent / good |
| Badge "Best value" (`.badge`) | 11.5 / 700 | `.caption.weight(.bold)` | onPrimary |
| "Added 4 to Closet" (`.added`) | 15 | `.subheadline` | ink2 |
| Ledger rows (`.ledger .l`) / values | 15.5 · mono 15 | `.subheadline` · mono value | ink2 + ink bold item · good / accent / ink |
| Ledger total label (`.tot`) | 17 / 650 | `.headline` | ink |
| Stage rows (`.st`) / counts (`.st span`) | 16 / 500 (now 650) · mono 13 | `.callout` (now: `.semibold`) · SF Mono `.footnote` | ink3 → ink when done/now |
| Detection tags (`.det`) | 13 / 600 | `.footnote.weight(.semibold)` | white |
| Camera tip (`.camtip`), mode switch (`.camseg`) | 14.5 / 650 | `.subheadline.weight(.semibold)` | indigo / white |
| Read rows, facts, look rows (titles) | 15.5–16 / 600 | `.callout.weight(.semibold)` | ink |
| Read rows, facts, look rows (subtitles) | 13–13.5 | `.footnote` | ink2 (facts: ink3) |
| Consent title / body (`.consent`) | 15.5 / 620 · 14 | `.callout.weight(.semibold)` · `.subheadline` | ink · ink2 |
| Field labels (`.field-row > span`) | 13.5 / 600 | `.footnote.weight(.semibold)` | ink2 |
| Mini labels under tiles (`.minilabel`) | 13 | `.footnote` | ink2 |
| Calendar weekday / day (`.cal`) | 11.5 / 600 · 13.5 | `.caption.weight(.semibold)` · `.footnote` | ink3 · ink2 (logged: ink semibold) |
| Paywall perks (`.perks`) | 16 / 550 | `.callout.weight(.medium)` | ink |
| Plan name / subline (`.plan`) | 17 / 650 · 13.5 | `.headline` · `.footnote` | ink · ink2 |
| Plan price (`.plan .pr b`) | Archivo 80% 24.5 | **SF Pro** `.title2.weight(.bold)`, tabular (ruling 29: no Archivo on prices) | ink |
| Height stepper value (`.stepper strong`) | Archivo 80% 21 | **SF Pro** `.title3.weight(.semibold)`, tabular | ink |
| Fine print (legal, AI line) | 12.5–13 | `.footnote` | ink3 |
| Share-row labels (`.shr`) | 13.5 / 600 | `.footnote.weight(.semibold)` | white |

### 3.3 The three special faces

**Score numeral (`.score`).** The mockup draws Archivo at width axis **70**, weight axis **640**. React Native can't set variable axes on the current stable line (§3.4), so the app uses the closest **static cut: Archivo Condensed SemiBold** (width 75, weight 600; PostScript name `ArchivoCondensed-SemiBold`). Base **76 pt** (mockup 75.5), tracking **−2.5%** of the size, tabular digits, color `kInk` (white on the share card). Build it with `<Numeral size={…}>` (`components/Numeral.tsx`).
- Size: the base size scales on the `largeTitle` Dynamic Type ramp, **capped at 1.6×** (`maxFontSizeMultiplier={1.6}`, so 76 → about 122 pt), so "9.5" never clips at AX5 on a 402 pt phone.
- The "/10" after it is mono value text in `kInk3`, aligned on the numeral's baseline (`alignItems: 'baseline'`). React Native has no "last text baseline" alignment for the numeral + word row, so `Numeral` reads the line's descender from `onTextLayout` and pulls its box down by that amount; the row then aligns with `flex-end`, like the CSS `.score-row`. That replaces the CSS `line-height: .82` trick. **Verify visually on device** against the mockup.
- **Other sizes** use the same face and the same capped scaling (`typography.ts → numeralSizes`):
  - welcome mini card: 52
  - "Why 8.0" ledger total: 52
  - re-check "was" score: 44, **Archivo Condensed Medium** (weight 500), `kInk3`, struck through
  - Closet rotation "37": 68
  - Lookbook "4 / 19": 44
  - share card: 73, fixed, because the card is an image
  - "Not quite right?" preview: 31
  - camera countdown: 76, width 75, weight 600 (Archivo Condensed SemiBold exactly), fixed
- **Where Archivo is allowed:** scores and these stat numerals, plus the wordmark. Ruling 29 says "Archivo only for score and wordmark." I read the rotation count, the day counts and the countdown as "score-class numerals," because the mockup draws them with the same `.score` class. **Not allowed:** prices, the stepper, body text, buttons. If the founder reads the ruling strictly, set `ARCHIVO_FOR_STAT_NUMERALS = false` in `typography.ts` and draw those stat numerals in SF Pro condensed semibold (`fontFamily: 'SystemCondensed'`, `fontWeight: '600'`, React Native's condensed system font on the New Architecture).

**Wordmark (`.woven`).** Archivo, width **125**, weight **700** = the static cut **Archivo Expanded Bold** (`ArchivoExpanded-Bold`), uppercase, tracking **0.34 em** (4.1 pt at 12 pt). Regular size is 12 pt. The small version was **8.5 pt in the mockup; raise it to 11 pt** (the HIG minimum; `<WovenLabel size="small">` already does). It's a logo, so it keeps a fixed size (`allowFontScaling={false}`) and doesn't follow Dynamic Type. VoiceOver reads "Kitted" via `accessibilityLabel`, not "K-I-T-T-E-D". The 18 pt stylist avatar "K" in chat and the app icon "K" are drawn at width 125, weight 760 in the mockup; the app uses Archivo Expanded Bold for the avatar (ExtraBold, weight 800, is the closer cut if the founder wants it heavier; it's one more ~190 KB file). The app icon is a PNG, so draw it from the variable font at exactly 125 / 760.

**Mono labels (`.tagline`, `.intent-l`, `.sub .k`).** **SF Mono via React Native's `fontFamily: 'ui-monospace'`**, weight `'500'`: 12 pt at the default size on the `caption1` ramp, so it scales. **Sentence case** ("Fit check · Full"), no tracking, color `kInk3`. Use `<MonoLabel>` / `<KText role="monoLabel">`:
- **Why `ui-monospace` (decided):** SF Mono can't be named in `fontFamily` (it's not a public font name), but React Native's iOS font code maps the CSS-style generic `ui-monospace` to `UIFontDescriptorSystemDesignMonospaced`, i.e. SF Mono, the same font SwiftUI's `.monospaced` design gives. Verified in the React Native source (`RCTFontUtils.mm`, New Architecture text layout) at tags v0.86.3 and v0.87.1 and on `main`; not yet seen on a device. It needs no bundled file, follows ruling 29 (SF Mono instead of DM Mono), and also works on the web preview (browsers know `ui-monospace`). **Rejected:** bundling DM Mono (OFL, matches the mockup, but ruling 29 drops it and it's another file to license and ship) and `Menlo` (built in, but older and wider than SF Mono). **Fallback:** if `ui-monospace` renders as SF Pro on some version, switch `typography.ts → monoFamily` to `'Menlo'`.
- **Default = sentence case everywhere** (ruling 29: "small uppercase mono fights Dynamic Type"). This beats the mockup's CSS uppercase, because the rulings outrank the handoff and the mockup (CLAUDE.md precedence). `02-screens.md` §0.2 and `05-build-plan.md` §3.4 say the same.
- **Decided Oct 12 (#231): on.** `MONO_UPPERCASE_AT_NORMAL_SIZES = true` in `typography.ts` brings back the mockup's spaced capitals ("FIT CHECK · FULL") at normal sizes. `KText` then applies `textTransform: 'uppercase'` + 1 pt `letterSpacing`, display-only (it passes the sentence-case string as `accessibilityLabel`, so VoiceOver doesn't spell capitals), and still drops to sentence case at accessibility sizes.
- **Nothing in mono is below 12 pt.** The mockup's 11.5 pt "Days dressed with intent" becomes 12.

### 3.4 Bundling Archivo (static files, expo-font)

**Why static files, not the variable font (checked Oct 6, 2026):**
- React Native 0.87's Text style props have no `fontVariationSettings` (https://reactnative.dev/docs/text-style-props lists none; the page shows version 0.87).
- iOS support for variable-font axes landed in React Native `main` on Aug 10, 2026 ("Add variable font settings support", PR #57815, commit `8415753e21`). It is **in v0.88.0-rc.0 to rc.3** and **not in v0.87.1** (GitHub compare). Expo **SDK 58 beta** (RN 0.88 RC, Sep 15 2026) announces "`fontVariationSettings` on `Text`: an object syntax for setting variable font axes" and variable-font support in `expo-font` (https://expo.dev/changelog/sdk-58-beta). Today's stable **SDK 57 runs RN 0.86** (https://expo.dev/changelog/sdk-57).
- Earlier attempts (PR #36371, #44685) were closed unmerged.
- **Decision:** ship three **static** cuts. They work on SDK 57 and 58 alike. Once the app is on SDK 58+, you *may* try the variable file with `fontVariationSettings: { wdth: 70, wght: 640 }` for the mockup's exact look; test it on device before switching. Static stays the default.

**The files** (upstream repo `Omnibus-Type/Archivo`, folder `fonts/ttf/`; each about 185 KB; checked with HEAD requests on Oct 6, not downloaded):

| Use | File | Axis values | PostScript name (`fontFamily`) | Download |
|---|---|---|---|---|
| Score + stat numerals, camera countdown | `ArchivoCondensed-SemiBold.ttf` | wdth 75, wght 600 | `ArchivoCondensed-SemiBold` | https://raw.githubusercontent.com/Omnibus-Type/Archivo/master/fonts/ttf/ArchivoCondensed-SemiBold.ttf |
| Re-check "was" numeral | `ArchivoCondensed-Medium.ttf` | wdth 75, wght 500 | `ArchivoCondensed-Medium` | https://raw.githubusercontent.com/Omnibus-Type/Archivo/master/fonts/ttf/ArchivoCondensed-Medium.ttf |
| Wordmark, avatar "K" | `ArchivoExpanded-Bold.ttf` | wdth 125, wght 700 | `ArchivoExpanded-Bold` | https://raw.githubusercontent.com/Omnibus-Type/Archivo/master/fonts/ttf/ArchivoExpanded-Bold.ttf |
| License (ship it) | `OFL.txt` | — | — | https://raw.githubusercontent.com/Omnibus-Type/Archivo/master/OFL.txt |

- **Why width 75 for the score:** the source's axis mapping puts the named widths at ExtraCondensed 62, Condensed 75, SemiCondensed 87.5, SemiExpanded 112.5 and Expanded 125 (`sources/Archivo.glyphs`, "Axis Mappings"). 75 is the nearest named cut to the mockup's 70 (62 is further away) and makes digits about 7% wider than the mockup. Weight 600 is the nearest named weight to 640.
- **PostScript names are expected, not confirmed.** On iOS, "the font family name is always taken directly from the font file and may not be the same as the file name" (Expo font docs, https://docs.expo.dev/versions/latest/sdk/font/). Confirm once in a dev build with `console.log(getLoadedFonts())` and fix `typography.ts → archivo` if they differ.
- **The google/fonts repo has no static files** for Archivo: `ofl/archivo/` holds only `Archivo[wdth,wght].ttf` and `Archivo-Italic[wdth,wght].ttf`. (The Google Fonts specimen download may include a `static/` folder with differently named files; not checked. Use the upstream files above.)
- **Exact instances (optional, for the precise 70 / 640 look):** cut them from the variable file with fontTools: `fonttools varLib.instancer "Archivo[wdth,wght].ttf" wdth=70 wght=640 -o Archivo-Score.ttf` (and `wght=500` for the "was" face, `wdth=125 wght=700` for the wordmark). Then set the new PostScript names in `typography.ts → archivo`. Optionally subset (`pyftsubset … --text="0123456789./+−→KITEDPRO "`) to a few KB each.
- **Ask the founder before downloading** (`05` §4.7 and §9 item 4: tell him the 3 file names, the source and about 185 KB each). Put the files in `<app>/assets/fonts/`.

**License (verified Oct 6, 2026):** Archivo is by Omnibus-Type and licensed under the **SIL Open Font License, Version 1.1**. `OFL.txt` reads "Copyright 2020 The Archivo Project Authors (https://github.com/Omnibus-Type/Archivo)" and has no Reserved Font Name. The OFL allows the font to be bundled, embedded and redistributed with any software; it forbids selling the font by itself. Static cuts from the upstream repo are the authors' own files; instances you cut yourself are Modified Versions, also allowed, and need no rename (no Reserved Font Name).
- Sources: https://github.com/Omnibus-Type/Archivo/blob/master/OFL.txt · https://github.com/google/fonts/blob/main/ofl/archivo/METADATA.pb (OFL, axes `wdth` 62–125, `wght` 100–900) · https://openfontlicense.org
- **Obligation:** ship `OFL.txt` (or its text) with the app. An "Acknowledgements" row in You › Settings › About is the normal way.

**Loading with expo-font (recommended: the config plugin, which embeds the fonts at build time):**

```jsonc
// app.config.ts → plugins (05 §4.8; same shape in app.json → expo)
"plugins": [
  ["expo-font", {
    "fonts": [
      "./assets/fonts/ArchivoCondensed-SemiBold.ttf",
      "./assets/fonts/ArchivoCondensed-Medium.ttf",
      "./assets/fonts/ArchivoExpanded-Bold.ttf"
    ]
  }]
]
```

Embedded fonts are registered at launch with no hook, after a new dev build (`npx expo prebuild` / `npx expo run:ios` / EAS). For Expo Go, or if you skip the plugin, `fonts.ts` has the runtime path:

```ts
import { useFonts } from 'expo-font';
// Keys = the fontFamily names. They match the embedded PostScript names, so both paths agree.
export function useKittedFonts() {
  return useFonts({
    'ArchivoCondensed-SemiBold': require('../../assets/fonts/ArchivoCondensed-SemiBold.ttf'),
    'ArchivoCondensed-Medium': require('../../assets/fonts/ArchivoCondensed-Medium.ttf'),
    'ArchivoExpanded-Bold': require('../../assets/fonts/ArchivoExpanded-Bold.ttf'),
  });
}
// Root layout: const [loaded] = useKittedFonts(); keep the splash screen up until `loaded`.
```

**Use:** `fontFamily: 'ArchivoCondensed-SemiBold'` with **no `fontWeight`** (the weight is in the file). `Numeral` and `WovenLabel` do this for you.

**Dynamic Type:** Archivo numerals scale on the `largeTitle` ramp, capped at 1.6× (§3.3). The wordmark never scales.

**Fallback:** `fonts.ts → isArchivoLoaded()` checks `getLoadedFonts()` for the three names. While they're missing, numerals render in `SystemCondensed` (SF Pro condensed) at weight 600/500, and the wordmark in SF Pro Bold with the same tracking. So the app looks close and never breaks before the fonts are added.


---

## 4. Spacing, radii, borders, shadows, materials

### 4.1 Spacing (`space` in `tokens.ts`, a 4-pt grid)
`xxs 2 · xs 4 · s 8 · m 12 · l 16 · xl 20 · xxl 24 · xxxl 32`.

| Named | Value | From the mockup |
|---|---|---|
| `gutter` | 16 | Thread padding 16. The 18 used on tab pages snaps to 16, to match iOS 26 grouped lists (brainstorm 12). |
| `heroGutter` | 24 | Welcome 28.5 / paywall 23.5 → 24 |
| `cardPadH` × `cardPadV` | 20 × 16 | `.card-pad 14px 16px`, opened up (founder, Oct 7; DECISIONS-LOG #30) |
| `cardGap` | 12 | Gap between a card section's rows (mockup 10) |
| `fixRowV` | 12 | A fix row's vertical padding (mockup 10.5) |
| `stack` | 16 | Gap between thread items and between cards (mockup 12–13) |
| `rowGap` | 8 | Chips, buttons, quick-starts |
| Inside a fix list | 4 vertical section padding + `fixRowV` per row | `.fixes padding-block:4px`, `.fix padding:10.5px 0` |
| Under the thread | 83 + 8 pt for the tab bar + composer height | `brainstorm/12` §3.7. With NativeTabs, iOS adds the tab bar to the screen's bottom safe area; pin the composer to the bottom with `useSafeAreaInsets().bottom` (react-native-safe-area-context) and give the thread list a matching `contentInset`/bottom padding. Verify on device, with the keyboard up too. |

### 4.2 Radii (`radius` in `tokens.ts`; always add `borderCurve: 'continuous'`)

| Shape | Radius | Mockup |
|---|---|---|
| Card | 26 | `.card` |
| Small card, plan row, "today" row, read-row list frame | 20 | 19.5–21 |
| Tile (closet, outfit), share card, quick card | 18 | `.tile`, `.sharecard` |
| Onboarding look photo | 13 | `.look` |
| Thumbnails 44–62 pt | 12 | `.rt` 11.5, `.lr-ph` 11.5, `.pk` 13 |
| Next-buy tile 60 pt | 16 | 15.5 |
| Calendar day / week band | 10 | 10.5 |
| His bubble | 24, tail corner (bottom-trailing) 6 | `.me 23.5 … 6.5` → per-corner `borderTopLeftRadius` / `borderBottomRightRadius` … |
| Photo bubble | 21 outer, 17 inner photo (concentric: 21 − 4 padding) | `.me.photo` |
| Woven label | 2 | `.woven` |
| Buttons, chips, pills, composer, fields, segmented | Capsule | `height / 2` |
| Sheets | System (iOS 26 inset floating sheet, concentric with the display) | `.sheet 38` + 8 inset is the mockup's drawing of it |
| Notification preview | 26 | `.notif` |

### 4.3 Borders and hairlines
- **Card:** 1 pt `kLine` border (`borderWidth: 1`; React Native draws borders inside the box, like SwiftUI's `strokeBorder`), in both modes.
- **Rows inside a section:** 1 pt `kLine` top border between rows (`.fix + .fix`, `.fact + .fact`, `.read-row + .read-row`, `.consent + .consent`). Use `<RowDivider />` or `borderTopWidth: 1`. **Use 1 pt, not `StyleSheet.hairlineWidth`:** the mockup draws 1 px = 1 pt, and a hairline is 1/3 pt on a 3× screen. Keep `hairlineWidth` for anything that should look like a native iOS list separator (none in v1).
- **Between sections of a card:** a `<Seam />` (dashed), never a hairline.
- **Chips:** 1 pt `kLine`. Selected = ink fill + ink border. Accent = copper border on `kAccentSoft`.
- **Plan row:** 1.5 pt `kLine`; selected = 1.5 pt `kInk` + checkmark.
- **Ghost tile** (an item he mentioned but hasn't photographed): 1.5 pt dashed `kInkFaint`, no fill, glyph at 50%, plus the text "· no photo".
- **Look selected (onboarding):** a 2.5 pt `kBg` gap, then a 2.5 pt `kInk` ring, plus a 24 pt ink check badge.

### 4.4 Shadows (light mode only)
- **Card:** two layers, matching the CSS `0 1px 2px rgba(18,22,40,.05), 0 6px 18px rgba(18,22,40,.06)`. React Native's `boxShadow` style takes that CSS string as-is, multiple shadows included (New Architecture only; https://reactnative.dev/docs/view-style-props), so use it verbatim (`tokens.ts → shadow.card`) instead of the old `shadowColor/shadowOffset/shadowRadius` props, which take one shadow only. `KCard` turns it off in dark mode, where the 1 pt border and the surface step do the work. It draws the shadow on an outer view and clips content in an inner one, because clipping (`overflow: 'hidden'`) and shadows on the same view don't mix reliably.
- **Share card preview:** `0 20 40 −12 black @ 60%` on the dark share screen. Only the on-screen preview gets it; the exported image doesn't.
- **Selected segmented item:** let the native segmented control draw it: `@expo/ui` `Picker` with the segmented style inside `<Host>` (`05` S6, `06` §3; already in the SDK 57 template), with a `.web.tsx` row of pressables for the web preview. Don't add `@react-native-segmented-control/segmented-control`.
- Nothing else gets a shadow. The build spec's "no shadow in KCard" is overruled by the mockup default, but keep the shadow this faint.

### 4.5 Materials and Liquid Glass

| Where | Material | Notes |
|---|---|---|
| Tab bar | System Liquid Glass (expo-router **NativeTabs**) | `tintColor={colors.accent}`. Don't hand-draw it (no JS tab bar). |
| Toolbar items, nav bar | System (native stack header) | Header buttons are native bar items, which get iOS 26's glass platter; React Navigation 7 also has `unstable_headerRightItems` / `unstable_headerLeftItems` for native items with shared glass backgrounds on iOS 26 (https://reactnavigation.org/docs/native-stack-navigator/). Use those instead of drawing the mockup's `kSurface2` circles in nav bars. Use `<IconButton variant="solid">` only for in-content circles (e.g. the sheet's X when you build a custom header). |
| Sheets | System (native form sheet) | expo-router / native stack screen options `presentation: 'formSheet'`, `sheetAllowedDetents: [0.5, 1]` (or `'fitToContents'`), `sheetGrabberVisible: true`, an X button in the header. Verify the detents on iOS 26. |
| Camera X, flash, flip, mode switch | `GlassView` from **expo-glass-effect** (`glassEffectStyle="regular"`, `tintColor="rgba(0,0,0,0.3)"`, `isInteractive`), circle or capsule via `borderRadius` | The only glass you add yourself. iOS 26+ only: `isLiquidGlassAvailable()` is false before that, and `IconButton` then falls back to an expo-blur `BlurView` (`tint="dark"`) under the same 30% tint. **Never animate the glass (or a parent) to `opacity: 0`**: Expo documents that the glass then stops rendering (https://docs.expo.dev/versions/latest/sdk/glass-effect/). Keep the scrims (§2.3). |
| Text on photos (detection tags, occasion pill, "Hold still", camera tip) | **Solid backing**, never glass or blur | `fixed.photoTag` or `fixed.lightPill`. |
| Countdown circle | `fixed.countdownBacking` (black 60%) + a `BlurView` behind it | The contrast number (5.16) assumes the 60% backing; the blur is optional polish. |
| Composer fade | A gradient from clear → `kBg` at 22% behind the composer (`experimental_backgroundImage: 'linear-gradient(…)'`, or `expo-linear-gradient`) | `.cfix`. Not glass. |

- **Reduce Transparency** (`AccessibilityInfo.isReduceTransparencyEnabled()` / `reduceTransparencyChanged`, tracked by `ThemeProvider` as `a11y.reduceTransparency`): swap every glass control for `black @ 60%` (camera) or `kSurface` (elsewhere). `IconButton` already does this.
- **Increase Contrast:** tokens switch automatically (§2.1).
- **Reduce Motion** (`AccessibilityInfo.isReduceMotionEnabled()` / `reduceMotionChanged`, `a11y.reduceMotion`): no scan sweep, spinner or count-up. Use cross-fades. `StageList` already stops its spinner.

---

## 5. Component catalog

For every component: what it's made of, its sizes, the tokens it uses, its states, its accessibility, and its mockup class. **Shared accessibility rules** (not repeated per row):
- Every icon-only control has an `accessibilityLabel`.
- Every tappable thing has at least a 44 × 44 hit area: pad the layout (chips, regular buttons) or set `hitSlop` (icon circles), as the components do.
- At accessibility text sizes (`useTheme().isAccessibilitySize`, i.e. font scale ≥ 1.75 = AX1 and up), horizontal rows become vertical stacks.
- Text never truncates to a single line at AX sizes. Allow wrapping, except chip labels, which stay one line and let `ChipFlow` wrap the chips.
- A whole card is one VoiceOver element with custom actions: `accessible` + `accessibilityLabel` + `accessibilityActions={[{ name: 'why', label: 'Why this score' }, …]}` + `onAccessibilityAction` (`KCard` takes all three).
- Every control sets `accessibilityRole` (`button`, `link`, `header`, `image`, `progressbar`) and, where it applies, `accessibilityState` (`selected`, `disabled`, `busy`).

Components marked **[RN]** are already built in `ts/design-system/components/` (file name in brackets where it differs).

### Cards and score

**KCard [RN]** (`.card`, `.card-pad`)
- **Anatomy:** a `kSurface` rounded rectangle (26) with a 1 pt `kLine` border, the light shadow, content clipped to the shape, and sections (`KCardSection`, padding 16 × 14) split by `Seam()`.
- **States:** default. The small variant (radius 20) is for the welcome mini card.
- **A11y:** for the fit-check card: one element (`accessible` + a composed `accessibilityLabel`) plus custom actions "Why this score", "Not quite right?", "Re-check", "Share". Sample label from `app-build-spec` §4.5, with the new words: "Fit check, Date. Score 8 out of 10, Sharp. Top fix: wear the overshirt, open, free."

**TagLine (card header) [RN, `MonoLabel.tsx`]** (`.tagline`)
- **Anatomy:** a mono label on the left ("Fit check · Full") and a mono value on the right in ink2 ("Date"). The right side can be a menu ("Everyday ▾" opens the occasion picker).
- **A11y:** read as one string: "Fit check, full. Occasion: Date. Double-tap to change."

**ScoreBlock [RN]** (`.score-row`, `.score`, `.verdict`)
- **Anatomy:** the numeral (76 pt Archivo, §3.3) + "/10" mono ink3 | a 16 pt gap | a stack of the score word (`.headline`) and either the verdict line (`.subheadline` ink2) or a PartialLabel.
- **Sizes:** the numeral is capped at 1.6× (about 122 pt; `numeralMaxScale`). The row aligns on the last text baseline.
- **States:** full, partial, re-check (see Delta below), and a preview variant without "/10".
- **AX sizes:** the numeral and word stack vertically.
- **A11y:** "Score 8 out of 10, Sharp. Clean base…" (`spokenScore()` in `score.ts` avoids "eight point zero").

**Delta (re-check)** (`.delta`)
- **Anatomy:** the "was" numeral (44, weight 500, ink3, 1.5 pt strikethrough) → a copper `chevron.right` (28) → the new ScoreBlock numeral → an accent pill "+1.0" pushed to the trailing edge.
- **A11y:** "Re-check. Was 8, now 9 out of 10, Dialed in. Up 1 point."

**SubScore: removed. Don't build it.** The CSS still has `.subs` / `.sub` / `.bar` (Fit · Color · Proportion bars), and the system strip shows "FIT 8.0 · COLOR 8.5 · PROPORTION 8.0", but **no screen uses them**. Rubric v3 computes one score (7.0 + credits − mistakes), so there are no sub-scores to show. This supersedes `app-build-spec.md` §4.5's "Fit · Color · Proportion as text rows." The breakdown lives in the Ledger instead.

**FixRow [RN]** (`.fix`)
- **Anatomy:** a 26 pt circle badge (1.3 pt ink ring, the number in `.footnote.weight(.bold)`) | a stack of the title (`.callout.weight(.semibold)`) and the detail (`.footnote` ink2: "Free · it's already in your hand") | the gain (mono, accent: "→ 9.0").
- **Sizes:** 10 pt vertical padding, a 12 pt gap, a 1 pt `kLine` between rows.
- **Done state:** the badge fills with ink and shows a `checkmark` in surface color. The title turns ink2 with an ink3 strikethrough. The detail is hidden. The gain shows the raw delta ("+0.75").
- **AX sizes:** the gain moves under the text, and the badge aligns to the top.
- **A11y:** "Fix 1: Wear the overshirt, open. Free, it's already in your hand. Score goes to 9.0." Done: "Done: Wear the overshirt, open. Gained plus 0.75."
- **Rule (ruling 20):** at least one free fix whenever any fix exists, and the free one comes first.

**TipLine [RN, `FixRow.tsx`]** (`.tipline`)
- **Anatomy:** a 1 pt `kLine` top border, then `.footnote` ink2 text with a copper semibold lead-in ("Next level"). Padding 8 / 6.
- **Use:** the "no score change today" advice under the fixes.

**PartialLabel [RN, `ScoreBlock.tsx`]** (`.partial-l`)
- **Anatomy:** the `square.dashed` symbol (`Icon`, small, scales with text) + "Partial check: shoes not included" in `.subheadline.weight(.semibold)` ink. It replaces the verdict line in the ScoreBlock.
- **Variants:** "top only", "shoes not included". The summary adds "Your score may change once I see your shoes."
- **A11y:** it's part of the ScoreBlock label. It always uses words, never just the icon.

**FinishCheckRow** (`.pick`)
- **Anatomy:** a two-line text block ("**Finish the check**" in ink semibold / "Same shoes as {weekday}?" in ink2 `.subheadline`) | a 44 pt thumbnail of the saved pair (radius 12, `kSurface2`, 1 pt `kLine`) | a 44 pt camera snap button (surface, `camera`) | a "Skip" text button (ink2 semibold).
- **Ruling 21 wording:** "Snap your shoes · Same shoes as {weekday}? / Pick from Closet · Skip" (the ruling's "Tuesday" and the mockup's "Sunday" are examples; the demo seed computes "Monday", `04` §12 #3). It's shown once per check. Re-check stays the primary button when a free fix exists.
- **A11y:** three separate buttons: "Use your white leather sneakers", "Snap your shoes", "Skip".

**AddedRow** (`.added`)
- **Anatomy:** a stack of up to 4 overlapping 28 pt thumbs (radius 8, a 1.5 pt `kSurface` ring, −8 overlap), then "Added 4 to Closet" (`.subheadline` ink2), then a trailing "Review" text link that opens a sheet.
- **A11y:** "Added 4 items to Closet: white tee, tan chinos, white sneakers, beige overshirt. Review."

**Ledger ("Why this score") [RN: `LedgerRow`, `LedgerTotal`]** (`.ledger`, sheet 8)
- **Anatomy:**
  - Rows: label (`.subheadline` ink2, with the rule name in ink semibold: "**Elevated piece** · tan chinos") | value (mono, trailing).
  - Padding 9, with a 1 pt `kLine` bottom border.
  - The first row is "Everyone starts at 7.0".
  - Values: "+0.5" in `kGood`, "−0.5" in `kAccent`, "+0" / "±0" in ink.
  - Total row: "Your score" (`.headline`) with a small `.footnote` ink3 line ("No mistakes found") | a 52 pt Archivo numeral + "/10".
  - Below it: a mono "What I read" label and gray `Pill`s of the garments read, the copper link "How I score ›" (pushes the How I score page: the `why.how.*` text from `02` §5.5, then the ScoreWordScale), and the `.footnote` ink3 line "I score the clothes only. Never your face, body or skin."
- **A11y:** each row reads "Elevated piece, tan chinos, plus 0.5." The sign is spoken, so color isn't needed.

**ReadRow ("Not quite right?")** (`.read-row`, sheet 9)
- **Anatomy:** a 44 pt garment thumb (radius 12, `kSurface2`) | title (`.callout.weight(.semibold)` ink) + current value (`.footnote` ink2) | a `pencil` glyph in ink3.
- **Sizes:** padding 10 / 16, inside a 20-radius frame with a 1 pt `kLine` border and `kLine` dividers.
- **Open state:** `kAccentSoft` background, the subline becomes the question ("How do they really fit?") in copper semibold, and a chip row (`Chip` options) slides open underneath on the same tint.
- **Above the list:** the reason chips (Wrong item / Wrong color or fit / Fix doesn't apply / Score feels off).
- **Below the list:** a preview line ("Score stays **8.0**" or "Score 8.0 → 8.5" with the new number in copper, per `02` D9 and copy keys `nqr.scoreStays` / `nqr.scoreMoves`, plus a "Closet updated" ok-pill) and a primary "Save correction" button.
- **A11y:** "White tee, regular fit. Edit." When open: "Tan chinos, straight leg. Expanded. Choose a fit."

### Chips, pills and buttons

**KChip [RN: `Chip`] / ChipFlow [RN]** (in `Chip.tsx`) (`.chip`, `.chips`)
- **Anatomy:** a 34 pt capsule, 14 pt side padding, `.subheadline.weight(.medium)`, an optional leading symbol, a 6 pt gap.
- **States:**
  - normal: surface fill, `kLine` border, ink text
  - **selected** (`.on`): ink fill and border, surface text, `accessibilityState={{ selected: true }}`
  - **accent** (`.ac`): copper border, copper text on `kAccentSoft`. Used for the stylist's suggestion, e.g. "Interview" when a career fair is in his facts.
  - disabled: 40% opacity
- **Small variant** (`.chip.sm`): 32 pt, 10 pt padding, `.subheadline`. Use it only in sheets.
- **Hit area:** 5 pt invisible padding above and below gives 44. So `ChipFlow` (a `flexWrap` row, `columnGap` 8) uses 0 row gap, and the visual gap between rows is 10 (the mockup's is 8). At AX sizes it becomes a vertical stack.
- **Horizontal scroll rows** (the Closet filter, the quick-start row): use `<ScrollView horizontal showsHorizontalScrollIndicator={false}>` instead of `ChipFlow`.

**Pill [RN, `Chip.tsx`]** (`.pill`)
- **Anatomy:** a 26 pt capsule, 10 pt side padding, `.footnote.weight(.semibold)`. Pills are labels, not buttons.
- **Variants:**
  - gray: `kSurface2` / ink2 (garments read, styles)
  - accent: `kAccentSoft` / copper ("+1.0", "+3 this week")
  - ok: clear fill, 1 pt `kLine` border, `kGood` text **plus a leading `checkmark`** ("Closet updated")
  - inline: 22 pt, `.caption` ("Partial" in a LookRow)

**PrimaryButton / SecondaryButton [RN: `KButton`]** (`.btn.p`, `.btn`, `.btn.lg`, `.btn.out`, `.btn.ghost`)
- **Anatomy:** a capsule with a centered label, plus an optional leading symbol (`.footnote` size) with a 6 pt gap.
- **Sizes:** large 50 pt, full width, `.headline`. Regular 36 pt visual (44 hit), 16 pt side padding, `.subheadline.weight(.semibold)`.
- **Kinds:** primary (`kPrimary` / `kOnPrimary`), secondary (`kSurface2` / ink), outline (clear with a 1 pt `kLine` border: the You tab's "Try Pro"), ghost (clear, ink2: "See an example first"; the paywall's "Continue free" is ghost with ink text at 17 pt).
- **States:** pressed = 82% opacity. Disabled = 40%. Loading = an `ActivityIndicator` replaces the label, and the width stays fixed (`accessibilityState.busy`).
- **AX sizes:** the height grows (`minHeight`) and the label wraps. Side-by-side buttons stack full width.
- **Rule:** at most one primary button per card. Glass buttons (`GlassView`) **only over the camera.**
- **Use `<KButton kind="primary" | "secondary" | "outline" | "ghost" size="large" | "regular">`** (`inkLabel` for the paywall's "Continue free").

**TextLink [RN]** (`.links a`)
- `.subheadline.weight(.semibold)` copper, 44 pt hit height, 24 pt between links. Examples: "Why 8.0?", "Not quite right?", "Didn't catch the change? Tell me".

**IconButton [RN]** (`.circ`, `.btn.icon`, `.circ.glass`)
- **Solid:** a 44 circle on `kSurface2` with an ink glyph at 42% of the diameter. The 36 pt in-card version (Share, Save) keeps a 44 hit area.
- **Glass:** camera only (§4.5). Sizes are 44 (X, flash) and 52 (flip). `<IconButton variant="glass">`.
- **A11y:** the `label` prop is required ("Share", "Close", "Switch camera", "Flash off"). Circles under 44 pt get `hitSlop` up to 44.

**QuickStartChip** (`.qc`, `.quickrow`)
- **Anatomy:** a 34 pt capsule, surface fill, 1 pt `kLine` border, a 13 pt side padding, a 19 pt symbol in ink2, an 8 pt gap, the label in `.subheadline.weight(.semibold)` ink. They sit in a horizontal scroll row that bleeds off the trailing edge (`margin-right: −15.5px`).
- **The three:** "What should I wear?" (`tshirt`), "I bought something" (`bag`), "Ask a question" (`questionmark.circle`). The fourth button, Check my fit, lives in the composer (below).
- **After a reply:** up to 3 next-step chips replace them.
- **A11y:** buttons, 44 hit areas.
- The CSS `.quick` / `.q` 2-column grid of 57 pt cards **isn't used on any screen. Skip it.**

**Composer** (`.dock`, `.composer`, `.fitbtn`, `.cfix`)
- **Idle (Stylist home, screen 12):**
  - **"Check my fit" pill:** 40 pt, `kPrimary`, a 26 pt `camera` glyph + the label in `.subheadline.weight(.semibold)` onPrimary, padding 13 leading / 16 trailing. It's the strongest control on screen.
  - **Library circle:** 40 pt, surface fill, 1 pt `kLine` border, `photo` glyph in ink2.
  - **Field:** a 40 pt capsule, surface fill, 1 pt `kLine` border, 16 pt padding, "Ask…" in ink3 `.body`.
  - The quick-start row sits above, with a 10 pt gap.
- **Active (after any message: screens 7, 10, 11, 13):** the pill collapses to a **40 pt camera circle** (`kPrimary`), and the placeholder becomes "Ask your stylist…". There's still one camera, never two.
- **Typing:** a 32 pt `arrow.up.circle.fill` send button in `kPrimary` (ink, not copper: principle 1 keeps copper for gains, links and "+N fits"; `02` D12 agrees) appears at the trailing end of the field. The field grows to 5 lines, then scrolls.
- **Placement:** pinned to the bottom of the Stylist screen, above the native tab bar (bottom safe-area inset, §4.1), over a `kBg` gradient fade (`.cfix`: clear → `kBg` by 22%). Lift it with the keyboard (`KeyboardAvoidingView behavior="padding"`, or `react-native-keyboard-controller` if that's janky; verify).
- **A11y:** "Check my fit. Opens the camera.", "Choose a photo", "Ask your stylist" (a text field), "Send" (`02` D12 labels). The circles' hit areas are padded to 44.
- **AX sizes:** the field moves onto its own row under the buttons.

### Chat

**StylistMessage [RN, `Chat.tsx`]** (`.say`, `.who`)
- **Anatomy:** no bubble. Plain `.body` ink text up to 92% wide. On the first message of a run, a header: an 18 pt avatar square (radius 5, `kFixedLabel`, a "K" in Archivo 125 / 760 at 10.5 pt, `kFixedOnDark`) + "Your stylist" in `.footnote.weight(.semibold)` ink3, then a 4 pt gap.
- **Copy rule:** always "your stylist," never "AI stylist." The one AI-disclosure line lives in the agreement (ruling 17; the first message's copy left it Nov 10, specs.md F5.1).
- **A11y:** "Your stylist: …"

**UserBubble [RN, `Chat.tsx`]** (`.me`)
- **Anatomy:** `kMe` fill, `.body` `kOnMe` text, padding 10 / 16, corners 24 except bottom-trailing 6 (per-corner radius props, `borderCurve: 'continuous'`), trailing-aligned, max 78% wide.
- **Onboarding answers** ("5′10″ · Average · Regular") are user bubbles too. They're tappable to change the answer: add a button trait and the hint "Double-tap to change."

**PhotoBubble [RN, `Chat.tsx`]** (`.me.photo`)
- **Anatomy:** a 135 pt wide `kMe` frame with 4 pt padding and outer radius 21 (tail 6). Inside: the photo, 172 pt tall, radius 17 (tail 4), cropped neck-down. Under it, a caption row in `.footnote` onMe @ 90%: occasion on the left, time on the right ("Date · 7:42").
- **Onboarding variant:** the 2 selected look thumbnails side by side (50 × 65 each).
- **While reading (ruling 13, `02` D6):** the caption row reads `lock` + "Only this is sent" on the left and the time on the right. The found pieces show as **pills in the skeleton card** (`Pill`, gray; pending in ink3 with "…"), not as tags on the 135 pt photo.
- **A11y:** "Your outfit photo, 7:42, Date." Never describe the body.

**Day stamp [RN: `DayStamp`]** (`.stamp`): centered `.footnote.weight(.medium)` ink3, e.g. "Thursday 8:00 am".

**StageList (loading) [RN]** (`.steps`, `.st`)
- **Where (ruling 13):** inside the skeleton fit-check card in the chat, not on its own screen.
- **Anatomy:** rows with a 24 pt circle (1.5 pt `kLine` ring), a 13 pt gap, the label in `.callout` ink3, and an optional trailing count in mono `.footnote` ink3 ("3 of 4"). 12 pt between rows.
- **States:**
  - pending: ring, ink3
  - **now:** a copper ring with the top segment clear, spinning once a second, label `.semibold` ink
  - **done:** filled ink circle with a surface `checkmark`, ink label
- **The four rows** (exact copy in `02` D6): Finding your pieces (with "3 of 4") → Checking fit → Colors & proportion → Writing your fixes. At 9 s the card's tagline changes to "Taking longer than usual." "Photo looks good" and "Sending…" are internal events (`04` §11), not rows.
- **Reduce Motion:** no spin. The ring is fully copper.
- **A11y:** announce each stage once (`AccessibilityInfo.announceForAccessibility`). The list is one element (`accessibilityRole="progressbar"`) with `accessibilityValue={{ text: 'Checking fit, step 2 of 4' }}`.
- **Below it:** the "Where are you headed?" occasion chips (`ChipFlow`), with the `.footnote` ink3 line "Everyday is picked unless you tap."

**DetectionTag [RN]** (`.det`): **not used in v1.** The mockup draws these on screen 6's big photo, which ruling 13 removed; `02` D6 shows the pieces as pills in the skeleton card instead. Kept here in case the founder brings the big photo back.
- **Anatomy:** a 28 pt capsule, 12 pt side padding, `.footnote.weight(.semibold)` white on `kFixedPhotoTag`, with a 1 pt white @ 18% border. It's placed near the garment, using the pose region or `box_2d`.
- **States:** found ("White tee"). Pending ("Shoes…", `kFixedPhotoTagDimText` text, plus an ellipsis, so it's not color-only). Upload notice (white @ 92% fill, indigo text, a leading `lock` glyph: "Only this is sent").
- **No glass.** Solid backing (§2.3).
- **Reduce Motion:** the tags appear without sliding in.
- **A11y:** the tags are summarized in the stage list's value ("Found white tee, overshirt, tan chinos"). The tags themselves are hidden from VoiceOver (`accessibilityElementsHidden`).

### Closet, Lookbook, You

**TapeMeasureSilhouette** (`sil()`, `[data-sil]`)
- **Anatomy (viewBox 92 × 132):**
  - Figure: head circle (r 8.5) + a body path. Fill `kAccentSoft`, stroke ink2 at 1.2.
  - Tape: a 12-wide, 126-tall rect at x 69, radius 1.5, fill `kAccentSoft`, stroke copper at 0.8.
  - 21 ticks every 6 units; every 4th tick is long (6 vs 3) and 1.0 wide (the others 0.7).
  - A copper dashed line (2 on, 2 off) from the top of the head across to the tape.
  - The height label under it: mono `.caption` copper ("5′10″").
- **Build it with `react-native-svg`** (the mockup's `sil()` is already SVG paths in a 92 × 132 viewBox, so it ports almost line for line; `react-native-svg` is in Expo's package list, `npx expo install react-native-svg`, but it's a package the founder approves, `05` §8). It responds to the basics: Slim / Average / Broad scales shoulder and hip width by about 0.9 / 1.0 / 1.12. Fitted / Regular / Relaxed widens the leg paths. Height moves the head line along the tape. Animate the changes with a short ease (`Animated` or Reanimated; cross-fade under Reduce Motion). The same applies to `GarmentIcon` (`02` §0.5).
- **Sizes:** 76 wide in the Basics card, 57 × 80 in the You card.
- **A11y:** "Silhouette: average build, regular fit, 5 feet 10." It has no face, ever.

**StatTile (Rotation)** (`.rotation`, Closet card)
- **Anatomy:** a KCard with the mono label "Your rotation", then the Archivo numeral (68 pt, `<Numeral size={68}>`) + "fits your / closet makes" (`.callout` ink2, 2 lines, bottom-aligned), a trailing accent pill "+3 this week", then the EssentialsBar.
- **The number never drops** except when he deletes items. Tapping it opens "How is this counted?"
- **A11y:** "Your rotation: 37 outfits your closet makes, 3 more this week."

**EssentialsBar** (`.ess`, `.slots`)
- **Anatomy:** a header row ("Starter essentials" in `.subheadline.weight(.semibold)` | "8 of 12" in ink2), then a 12-column grid with a 4 pt gap of 8 pt-tall capsules: filled = ink, empty = `kSurface2` (optionally with a 1 pt `kLine` stroke).
- **A11y:** one element: "Starter essentials, 8 of 12. Opens checklist." Use the app's plural strings (the string table in `05`).

**Next-best-buy row** (`.nextbuy`)
- **Anatomy:** a 60 pt tile (radius 16) | the mono label "Next best buy" + the title (`.callout.weight(.semibold)`) with an inline mono copper gain ("+9 fits") + the `.footnote` ink2 detail ("$40–70 · Plain, no big logo…").

**ClosetTile** (`.grid3 .tile`, `.minilabel`)
- **Anatomy:** a `kSurface2` tile (radius 18, aspect 1 : 0.92), with the garment cut-out at 62% (or a plain crop, or the item's category symbol in its color), and a `.footnote` ink2 label under it.
- **Layout:** 3 columns, 8 pt gap, 10 pt row gap → 2 columns → 1 column at AX sizes.
- **Ghost state:** an item he mentioned but hasn't photographed (dashed, §4.3).
- **Outfit cards:** 4 tiles in a row (`.outfit4`, aspect 1), or the hero strip (`.outfit-hero`: square-ish tiles with 1 pt `kLine` gaps and no radius, flush to the card top).

**CalendarMonth** (`.cal`)
- **Anatomy:** a KCard with the month title (`.headline`) + chevron buttons, then a 7-column grid with a weekday row (`.caption.weight(.semibold)` ink3).
- **Days:** `.footnote` ink2, cells **44 pt tall** (the mockup's 34 is below the hit minimum).
- **States:**
  - logged: ink semibold + a 5 pt copper dot at the bottom
  - today: a 28 pt ink circle with surface text
  - this week: a `kSurface2` band, rounded 10 at its ends
  - future: ink3 at 60%, disabled
- **A11y:** each day is a button: "October 22, today, 1 outfit logged." Future days are not focusable.
- **Above it:** the "intent" header: two Archivo 44 pt numerals ("4 this week" | "19 total") split by a 1 × 34 `kLine` rule, with the trailing mono label "Days dressed with intent." Spoken: "Days dressed with intent: 4 this week, 19 total."

**LookRow** (`.look-row`)
- **Anatomy:** a 50 × 62 neck-down thumb (radius 12) | title (`.callout.weight(.semibold)`: "Date · 8.0 → 9.0", with an optional inline "Partial" pill) + subline (`.footnote` ink2: "Thu, Oct 22 · Full check · 1 fix") | a `chevron.right` in ink3.
- **Rule:** partial checks are always labeled and never compared with full ones.

**FactRow ("What your stylist knows")** (`.fact`)
- **Anatomy:** title (`.callout.weight(.semibold)` ink) + source and date (`.footnote` ink3: "You told me · Oct 14") | chevron. Padding 10 / 16, with `kLine` dividers inside a KCard.
- **Guess state:** title in italic `.medium` ink2, and the subline says "My guess · not asked yet". The italic is backed by words.
- **Swipe actions:** Edit, Delete. Delete shows an UndoToast.

### Onboarding, paywall, notifications, sharing

**Look tile (onboarding)** (`.look`)
- **Anatomy:** a 3 : 4 photo, radius 13, in a 3-column grid with an 8 pt gap. Selected: the ring + check badge (§4.3).
- **A11y:** "Outfit: relaxed workwear. Selected." Label the style, never the person.
- A 4th tap gives a gentle shake + "Up to 3."

**Onboarding progress** (`.progress`): 6 capsule segments, 4 pt tall, 5 pt gap. Done = ink, to do = `kLine`. `accessibilityValue("Step 3 of 6")`.

**Basics card fields** (`.field-row`, `.segs`, `.stepper`)
- Label: `.footnote.weight(.semibold)` ink2.
- **Build and Fit:** a native segmented control (`@expo/ui` `Picker`, segmented style, §4.4), with a `.web.tsx` capsule row for the web preview.
- **Height:** a 36 pt custom capsule with 30 pt +/− circles (44 hit; there's no native stepper in React Native). The value is SF Pro semibold, tabular. Give it `accessibilityRole="adjustable"` with increment/decrement actions.
- **Birth year:** **blank** (ruling 28). It opens a wheel and nothing is preselected.

**Consent row** (`.consent`)
- **Anatomy:** a 20 pt copper symbol | title (`.callout.weight(.semibold)`) + body (`.subheadline` ink2). Padding 13 / 16, with `kLine` dividers inside a KCard.
- **The text comes from ruling 16** (age-rules §3), not the mockup.

**TodayRow (paywall)** (`.today`)
- **Anatomy:** a surface row (radius 20, 1 pt `kLine`) with a 50 × 62 neck-down thumb | "Today: 8.0 → 9.0" (`.callout.weight(.semibold)`) + "One free fix. Nothing new to buy." (`.footnote` ink2).

**Perks list** (`.perks`)
- Copper `checkmark` (15 pt) + `.callout.weight(.medium)` ink, with 9 pt between items.
- Copy per ruling 25 and `02` D18: three perks, `Up to 10 fit checks a day` · `Up to 50 questions a day` · `Your full next-buy list, ranked`. Never "Unlimited."

**PlanCard (paywall)** (`.plan`, `.badge`)
- **Anatomy:** a surface row (radius 20, 1.5 pt `kLine`, padding 13 / 16) with the name (`.headline`) + subline (`.footnote` ink2: "14 days free · $2.50 a month") | the price (SF Pro `.title2.weight(.bold)` + "/yr" in `.footnote`).
- **Selected:** ink border + `checkmark.circle.fill`.
- **Badge:** "Best value", a 21 pt copper capsule, `.caption.weight(.bold)` onPrimary, overlapping the top edge by 10.
- **Where it goes:** ruling 23 wanted page 2 of the paywall to be Apple's `SubscriptionStoreView`. React Native can't host that SwiftUI view without a native module, so **page 2 is built from PlanCards** (TodayRow + Perks header, the plan cards, the purchase button, restore, terms), with prices and purchases from the IAP library chosen in `05`. Keep Apple's rules: the billed price is the biggest, X and "Continue free" visible from the first frame.
- **Rules:** the billed price ($29.99) is the biggest price on screen. The X button and "Continue free" are visible from the first frame.

**NotificationPreview** (`.notif`, lock screen)
- **What it is:** real notifications are drawn by iOS, so this component exists only to *show* what he'll get. `02` S15 (the "Want a daily outfit idea?" card) doesn't draw a preview, so **skip this component in the demo**; keep the spec in case the founder wants one.
- **Anatomy:** always dark. A 26-radius row: white @ 20% over a `kFixedLabel` backing, a 39 pt app-icon tile (radius 10, the dashed copper stitch, a "K"), "Kitted" (`.subheadline.weight(.semibold)` white) + time (white @ 70%), and the body (`.subheadline` white).
- **Copy:** the 3 types, exactly as in the mockup. Never "we miss you."

**ShareCard** (`.sharecard`, `.share-band`, `.share-mark`)
- **Anatomy:** always dark, 9 : 16. Drawn as a 360 × 640 pt view inside `<FixedDark>` and captured to an image at 1080 × 1920 (`react-native-view-shot`'s `captureRef` with `width`/`height`, a package for the founder's list, `05` §8; verify output size); a feed variant at 1080 × 1350.
  - The neck-down photo fills the top 76%.
  - The occasion pill sits top-left (16 inset, `kFixedIndigo` @ 80%).
  - The bottom band is 24% tall, `kFixedIndigo`, with a **copper dashed top border** (a seam). It holds the Archivo 73 numeral in white + the word (17 pt bold white) + the mono delta in copper ("8.0 → 9.0 after 1 fix").
  - The watermark sits top-right of the band: mono 11 white @ 60%, "scored by" + the KITTED wordmark at 10.5.
- **Fixed sizes:** no Dynamic Type, because it's an image.
- **Share screen:** a glass X; actions under the card are 57 pt circles (white @ 12%) with labels: Story (`photo`), Save (`square.and.arrow.down`), More (`square.and.arrow.up`). Save needs `NSPhotoLibraryAddUsageDescription` (ruling 26).
- **A11y:** the preview image is labeled "Share card: Date, 9 out of 10, Dialed in, up from 8 after 1 fix."
- **Never gated.** If pose detection fails, use a collage of his garment cut-outs.

**ScoreWordScale** (`.scale`, `.bands`)
- **Anatomy:** 5 equal bands with 1 pt `kLine` dividers inside a 10-radius frame. Each band has a mono range ("8–8.5") and the word (`.headline`).
- **His band:** `kAccentSoft` fill, copper range text, **plus a "You're here" mono caption**, so it's not color-only.
- **Footer:** "A clean basic outfit lands near 7. The best possible score is 9.5 for now."
- **Where:** on the How I score page, pushed from "How I score ›" in the Ledger sheet, under the `why.how.*` text.
- **AX sizes:** a vertical list.

**EmptyState**
- A plain component that copies `ContentUnavailableView`'s layout (React Native can't host it): centered icon (`Icon`, 44 pt, ink3), title (`.title3.weight(.semibold)`), description (`.subheadline` ink2), then the primary button.
- **Closet (C1e):** `hanger`, "Your closet builds itself.", "Do a fit check and I'll add what you're wearing.", buttons **Check my fit** + **Tap the basics you own**. `02` §3.4 owns the copy.
- **Lookbook (L1e):** a ghost look card with "Your first look lands here, with its score." + **Check my fit** (`02` §3.5).
- **Rule:** an empty state is never a dead end. There's always one action.

**UndoToast**
- **Anatomy:** a floating capsule, 16 pt from the sides, sitting just above the tab bar. `kSurface` fill, 1 pt `kLine` border, and the card shadow, in both modes. Inside: the message (`.subheadline` ink, e.g. "Added 4 to Closet") + a copper "Undo" (`.subheadline.weight(.semibold)`, 44 hit).
- **Timing:** it stays 5 s, and the timer pauses while VoiceOver focus is on it. It's announced on appear. It slides up (a fade under Reduce Motion).
- **States:** single action (add or delete) and batch ("Deleted 3 items").

**Other tiles and rows from the mockup:**
- **Privacy row** (`.privacy-row`): `lock` in ink3 + `.callout.weight(.medium)` + chevron. Copy per CLAUDE.md L35 / ruling 18.
- **Limit card:** TagLine "Daily limit · Resets 4 am", a `.title3` headline, the summary, primary "Save for tomorrow" (the free path is the default), and secondary "Try Pro · 14 days free" (ruling 25; `02` D19).
- **Camera** (screen 5):
  - Shutter: 88 outer ring (4.5 white), 70 white disc.
  - Library button: a 52 glass circle with the `photo` glyph, **not** a thumbnail of his latest photo (a thumbnail would need Photos read access; `02` D5).
  - Flip: 52 glass. X and flash: 44 glass.
  - Mode switch: a glass capsule with "Propped / Mirror".
  - Tip pill: `kFixedLightPill`, 36 tall, with a green check.
  - Countdown: a 120 circle, 3 pt white ring, the Archivo numeral.
  - Framing guide: white 2 pt; head ellipse + a dashed body outline that turns solid when "good"; a 3 pt black @ 35% drop shadow.
  - The scan line is copper (`kFixedCopper`) and is off under Reduce Motion.
  - VoiceOver labels (`02` D5): "Take photo", "Choose a photo", "Switch camera", "Close camera". Guide states are spoken, throttled.

---

## 6. Score words and thresholds

Built as `scoreWord()` in `ts/design-system/score.ts`, with the bands in `tokens.ts → scoreBands` (ruling 24 overturned the build spec's Sharp / Solid / Close words). Checked in Node against the 181 score words in `fixtures/expected_scores.json`: 0 mismatches. Scores are shown rounded to the nearest 0.5, and the word comes from the rounded value.

| Rounded score | Word | Mockup band |
|---|---|---|
| 5.5 and under | **Needs a fix** | "5.5 and under" |
| 6.0–6.5 | **Getting there** | "6–6.5" |
| 7.0–7.5 | **Put together** | "7–7.5" |
| 8.0–8.5 | **Sharp** | "8–8.5" |
| 9.0–9.5 (and 10 if it ever becomes reachable) | **Dialed in** | "9–9.5" |

**Rules:**
- **Never color-only.** The numeral is always ink, and the word is always shown next to it, in the VoiceOver label too.
- **Context lines:** "A clean basic outfit lands near 7. The best possible score is 9.5 for now." 10 isn't reachable under rubric v3. That's an open decision in `rubric/v3.md`.
- **Display:** always one decimal ("8.0", `displayScore()`). **Speech:** "8" / "8.5" (`spokenScore()`). Both round with `Math.floor(x * 2 + 0.5) / 2`, exactly `rubric.py`'s `round_half` (never `Math.round` or `toFixed` on the raw value).
- **Re-check gains:** shown raw in the done fix row ("+0.75"). The score itself shows rounded ("8.0 → 9.0").
- **Partial checks** use the same words, plus the PartialLabel.

---

## 7. Iconography (SF Symbols)

The mockup draws custom SVG symbols (`<symbol id="i-…">`). Use SF Symbols instead, through **expo-symbols** (`import { SymbolView } from 'expo-symbols'`, https://docs.expo.dev/versions/latest/sdk/symbols/). **The names are the same strings as below**; `ts/design-system/symbols.ts` has them as `sym.*`, and `<Icon name="…">` (`components/Icon.tsx`) wraps `SymbolView`. Sizes match the CSS: `.ic` 26 pt → `size="large"` (26), `.ic.s` 19.5 → `"regular"` (20), `.ic.xs` 15.5 → `"small"` (16). `SymbolView` takes a fixed point size, so icons in text rows pass `scalesWithText` (they grow with the font scale, capped at 2×). Use `weight="medium"` to match the mockup's 1.7 stroke. Use `.fill` variants only for selected tabs (NativeTabs: `sf={{ default: 'person', selected: 'person.fill' }}`) and the send button. SF Symbols exist only on Apple platforms: on the web preview `Icon` renders an empty box of the same size (`fallback`), so layouts hold but icons are blank there. In TypeScript, `SymbolView`'s `name` is the `SFSymbol` string union from `sf-symbols-typescript`, so a misspelled name fails the type-check once the real package is installed.

**Every name below was verified** against this Mac's system symbol table (`/System/Library/CoreServices/CoreGlyphs.bundle/Contents/Resources/name_availability.plist`, macOS 26). The year is the SF Symbols release; all of them are available on iOS 26. You should still look each one over visually in the SF Symbols app.

| Mockup id | Used for | SF Symbol | Since |
|---|---|---|---|
| `i-chat` | Stylist tab | `bubble.left` (tab shows `.fill` when selected) | 2019 |
| `i-hanger` | Closet tab, closet empty state | `hanger` | 2023 |
| `i-book` (2 × 2 squares) | Lookbook tab | `square.grid.2x2` | 2019 |
| `i-person` | You tab | `person` | 2019 |
| `i-camera` | Check my fit, composer camera, shoe snap, lock-screen camera | `camera` | 2019 |
| `i-photo` | Library button, share "Story" | `photo` | 2019 |
| `i-x` | Close (camera, paywall, sheets, share) | `xmark` | 2019 |
| `i-back` / `i-next` | Back, month nav / row chevrons, re-check arrow | `chevron.left` / `chevron.right` | 2019 |
| `i-gear` | Settings | `gearshape` | 2020 |
| `i-check` | Done stage, camera tip, perks, fix done | `checkmark` | 2019 |
| `i-tee` | "What should I wear?", item placeholder | `tshirt` | 2021 |
| `i-bag` | "I bought something" | `bag` | 2019 |
| `i-q` | "Ask a question" | `questionmark.circle` | 2019 |
| `i-share` | Share, share "More" | `square.and.arrow.up` | 2019 |
| `i-redo` | Re-check after fixing | `arrow.clockwise` (the build spec's `arrow.triangle.2.circlepath.camera` also exists, 2020, but is busier) | 2019 |
| `i-info` | Info | `info.circle` | 2019 |
| `i-pencil` | Edit a reading | `pencil` | 2019 |
| `i-shoe` | Shoes, shoe snap | `shoe` (`shoe.2` for "your shoes", 2023) | 2023 |
| `i-lock` | "Only this is sent", privacy row | `lock` | 2019 |
| `i-bookmark` | Save an outfit | `bookmark` / `bookmark.fill` | 2019 |
| `i-plus` | Add item | `plus` | 2019 |
| `i-sun` | (unused on screens; reserve for "too dark" tips) | `sun.max` | 2019 |
| `i-shield` | (the mockup's old consent row; unused after ruling 16) | `checkmark.shield` | 2019 |
| `i-blur` (dashed head) | Consent row 1, "What gets sent" | `face.dashed` | 2020 |
| — | Consent row 2, "What doesn't" | `hand.raised` | 2019 |
| `i-phone` | Consent row 3, "What happens to it" | `iphone` | 2020 |
| `i-info` | Consent row 4, "Your stylist is an AI." | `info.circle` | 2019 |
| `i-trash` | Delete | `trash` | 2019 |
| `i-partial` (dashed square) | Partial check label | `square.dashed` | 2020 |
| `i-flash` | Camera flash | `bolt` / `bolt.slash` | 2019 |
| `i-flip` | Switch camera | `camera.rotate` | 2019 |
| `i-bell` | Notifications | `bell` | 2019 |
| `i-cal` | Calendar | `calendar` | 2019 |
| `i-up` | Share-screen "Save" | **`square.and.arrow.down`** (better than the mockup's up arrow for saving) | 2019 |
| — | Send in the composer | `arrow.up.circle.fill` | 2019 |
| — | Undo | `arrow.uturn.backward` | 2020 |
| — | Warning (with `kCaution`) | `exclamationmark.triangle` | 2019 |
| — | Selected plan / OK state | `checkmark.circle.fill` | 2019 |
| — | More menu in Stylist | `ellipsis` | 2019 |
| — | Self-timer toggle (Mirror) | `timer` | 2019 |

The build spec's tab icons (`bubble.left.and.bubble.right`, `book.closed`, `person.crop.circle`) all exist too. The table above follows the mockup's drawings instead.

---

## 8. Photos: crop modes and how to build them

Kitted's promise is "your face is never kept or sent" (ruling 11, default). That decides which crop shows where.

**Stack note:** React Native has no Vision or Core Image. The pose crop, face pixelation, person masking and metadata stripping below run in **native Swift inside a small local Expo module** (original handoff decision 11; `05` owns the module plan). The Apple API names below stay correct *inside that module*. React Native only displays the results: `NeckDownPhoto` (`components/Chat.tsx`) shows a stored neck-down image, or crops a bundled demo photo with the mockup's `PH` fractions.

| Mode | What it is | Where it's used |
|---|---|---|
| **Neck-down** (default) | Cropped from just above the collar to the feet; centered on the body | **Everywhere a stored photo appears:** chat photo bubble, fit-check card, Lookbook rows and calendar, look detail, paywall TodayRow, share card. Also the upload copy (1024 px, plus face pixelation as a backstop). Stored copies: 2048 px neck-down HEIC + 400 px thumbnail. |
| **Face-blurred** | Full frame from just above the face, with the face hidden | **Only if the founder overrides ruling 11** and keeps full originals. Then the chat bubble uses it (the mockup's `data-crop="blur"` on screens 7, 8, 10 and 19 draws this). Otherwise don't build it. |
| **Full** | The whole frame | **Only the live camera preview**, with the face hidden in real time (`data-crop="full" data-blurface="1"`, screen 5), so the framing guide has the whole body to fit. Never stored. |
| Garment cut-out | A per-garment crop with the background removed | Closet tiles, the "Not quite right?" thumbs, AddedRow thumbs. Fallback order: cut-out → plain crop → category symbol in the item's color. |
| Silhouette | No photo | The You tab. |

**Neck-down with Vision body pose (brief):**
1. Run `DetectHumanBodyPoseRequest` (Swift Vision API, iOS 18+) or `VNDetectHumanBodyPoseRequest` on the captured image.
2. Take the **neck** joint, or the midpoint of the shoulders if neck confidence is under 0.3, plus the nose and ears.
3. The crop top = neck y − 4% of the image height, **but never above the lowest face point** (the nose/ear/chin estimate). The bottom = the lowest ankle + 3% (or the image bottom). The horizontal center = the mean of shoulder and hip x, and the width fits the 3 : 4 or 9 : 16 target.
4. Vision returns normalized coordinates with a lower-left origin, so flip y before cropping a `CGImage`.
5. Use the pose from the last good preview frame during the 3-2-1, so the crop is instant.
6. **If pose fails:** fall back to `VNDetectHumanRectanglesRequest` (upper-body box), and cut 22% off its top.
7. **If both pose and face detection fail, don't upload** (ruling 10): "Couldn't frame this one. Try again."

**Face hiding with Vision + Core Image (brief):**
1. `VNDetectFaceRectanglesRequest` on the neck-down crop. That's the backstop for a tilted head or a mirror selfie.
2. Grow each box 30%, then pixelate it heavily: `CIFilter.pixellate()` with `scale = max(box.width, box.height) / 6`, then composite over the original with `CIFilter.sourceOverCompositing()` using a rect mask from `CIImage(color:).cropped(to:)`. Or fill the box solid. **Don't use a light Gaussian blur on anything that leaves the phone**, because it's partly reversible (brainstorm 09 §5).
3. For the **live preview**, run face rectangles on the video frames at about 10 fps (in the native camera module) and send the rects to JS; draw an elliptical, clipped `BlurView` (expo-blur, `tint="systemUltraThinMaterial"`, high intensity) over each face. It's display-only, so a blur is fine here.
4. **Other people in frame:** if `VNDetectHumanRectanglesRequest` counts 2 or more people, ask "Which one is you?" (a tap, never face matching). Then mask everyone else with `VNGeneratePersonInstanceMaskRequest` before upload and before any share card.
5. **Strip metadata** by re-encoding through ImageIO (no EXIF or GPS) before upload.

**Display rules:**
- Fill a fixed frame (`resizeMode="cover"`), aligned to the top of the neck-down crop (`NeckDownPhoto`; React Native's `Image` has no object-position, so it offsets the image inside a clipped view; `expo-image`'s `contentPosition` is the alternative, `05` §4.7).
- Clip with the component's continuous radius.
- Load thumbnails, never full images, in lists: the native module writes the 400 px thumb at save time; lists render that file (with `expo-image`, which the SDK 57 template already includes, for caching and downsampling).
- The VoiceOver label for any photo is "Your outfit photo, <date>". Never describe the body.

---

## 9. Dark mode

- **The app follows the system appearance.** `ThemeProvider` (at the root layout) reads `useColorScheme()` and re-renders with the other token set when it changes; every component reads colors from `useTheme().colors`, never from a hard-coded hex. Set `userInterfaceStyle: 'automatic'` in `app.config.ts` (`05` §4.8 already does) so iOS reports both appearances.
- You › Settings › Appearance (System / Light / Dark) calls `setAppAppearance('system' | 'light' | 'dark')` from `theme.tsx`, which calls `Appearance.setColorScheme(…)` so the **native** chrome (tab bar, headers, sheets, glass, alerts) switches too, and `useColorScheme()` then reports the override. Persist the choice yourself (a small key-value store) and re-apply it at launch. Verify the "follow system" value on your RN version (`'unspecified'` on recent versions; older ones took `null`).
- **Always dark, in both appearances:**
  - the **camera**
  - the **lock-screen and notification previews** (mockup screen 14 only; the demo doesn't draw them)
  - the **share card** and the share screen
  
  Wrap those view trees in `<FixedDark>` and use the `fixed` palette (§2.3), so a light-mode user still gets the dark camera. Native pieces inside them (a `GlassView`, a header) take `colorScheme="dark"` or the screen option that forces dark, since `<FixedDark>` only changes our tokens. In the mockup these are the `.phone.fixed` screens.
- **Dark-mode differences you'll see:**
  - Cards lose their shadow and keep the 1 pt border.
  - Copper brightens to `#DE9762` and `kOnPrimary` turns near-black, so a primary button is a light pill with dark text.
  - Accent-soft is 15% instead of 9%.
  - `kGood` becomes `#5DC08F`.
- **Test matrix per screen:** light, dark, light + Increase Contrast, dark + Reduce Transparency, AX5 text size, and Bold Text. In the Simulator: Features › Toggle Appearance, and Settings › Accessibility (or Xcode's Environment Overrides panel) for text size, Increase Contrast, Reduce Transparency and Bold Text. The demo-only `src/app/demo/gallery.tsx` route (`05` §4.3) renders every component (the old Swift `#Preview`s) and is the cheapest way to check them all at once.

---

## 10. Copy rules (kept from `app-build-spec.md` §6)

- "Your stylist," never "AI stylist." One AI-disclosure line, in the agreement (ruling 17; out of the first message Nov 10, specs.md F5.1).
- The stylist's voice lives in model prompts and rule copy, not in UI labels. Buttons are plain verbs: "Check my fit", "Wear this", "Save correction".
- No emoji in the UI. No RPG or anime words: no ranks, XP, quests or levels.
- Never "we miss you," never streak guilt. After time away: "Welcome back."
- Pro copy: "Up to 10 fit checks and 50 questions a day" (ruling 25).
- Plurals and all strings go in the app's string table (`05` decides the library) ("1 fit / 37 fits").

---

## 11. What I changed from the mockup, in one list

1. `kInk3` light `#848A99` → **`#646A7A`** (it was 2.97–3.46:1, now 4.65–5.41). Dark `#6E7484` → **`#9096A5`** (3.28–4.13 → 5.18–6.51, matching §2.1). The old values survive as the decoration-only `kInkFaint`.
2. `kAccentSoft` light alpha 11% → **9%** (copper text on it over chalk: 4.46 → 4.61).
3. Pending detection tag: backing 45% → 80%, text white @ 75% → `#C3C7D2` (2.38 → 6.04).
4. Share-card occasion pill backing 55% → 80% (3.99 → 9.54).
5. Countdown circle backing 35% → 60% (2.32 → 5.16). "Hold still" moves onto a backed capsule (it was 1.0 over white).
6. Camera mode switch: backing 40% → 60%, label 75% → 90% (3.81 → 7.94).
7. Camera glass circles get a black 30% glass tint (2.68 → 6.10).
8. The small woven label goes from 8.5 → 11 pt. Mono labels go up to at least 12 pt and are sentence case (ruling 29).
9. Calendar day cells grow from 34 → 44 pt tall (hit area).
10. Fix-row detail text moves from ink3 to ink2.
11. The selected plan gets a checkmark, not just a border.
12. The custom tab-bar capsule is replaced by the native tab bar (expo-router NativeTabs). The mockup's nav circles are replaced by native header buttons.
13. Prices and the height stepper use SF Pro instead of Archivo (ruling 29). The share screen's Save uses `square.and.arrow.down`.
14. Sub-score bars (`.subs`) and the `.q` quick grid are dropped as unused.
15. Stack change (Oct 6): React Native + Expo. The faces are static Archivo cuts (Condensed SemiBold for the score, width 75 instead of the mockup's 70; Expanded Bold for the wordmark), and mono labels are SF Mono through `ui-monospace` (§3.3, §3.4).

---

## 12. React Native implementation notes

The tokens, sizes and rules above don't change with the stack. This section says how each SwiftUI-era mechanism is done in React Native (Expo, TypeScript, expo-router, New Architecture). "Verify" marks things read in docs or source but never run here.

**Packages.** The design system needs only `react-native` and four Expo modules: `expo-font`, `expo-symbols`, `expo-glass-effect` (all three in the SDK 57 template) and `expo-blur` (add it with `npx expo install expo-blur`; it's on `05` S15's list). Install with `npx expo install …` so versions match the SDK. Used elsewhere in the app, all on `05` §1.1's list: `react-native-svg` (silhouette, garment icons), `react-native-view-shot` (share card), `expo-image` (template), `@expo/ui` (segmented, wheel, menus; template). `expo-linear-gradient` is optional (ask first; `experimental_backgroundImage` works without it).

**Where to start.** Copy `ts/design-system/` to `<app>/src/design-system/`. Delete its `_stubs/` folder and `tsconfig.json` once real packages are installed, run `npx tsc --noEmit`, and fix whatever the real types flag. The stubs were written from the docs, so expect small differences. Then wrap the root layout:

```tsx
// src/app/_layout.tsx
import { ThemeProvider, useKittedFonts } from '@/design-system';
export default function RootLayout() {
  const [fontsLoaded] = useKittedFonts(); // not needed if the expo-font config plugin embeds the fonts
  if (!fontsLoaded) return null;          // or keep the splash screen up
  return <ThemeProvider>{/* <Stack /> or <NativeTabs /> */}</ThemeProvider>;
}
```

| SwiftUI-era mechanism (old `archive/swift/DesignSystem.swift`) | React Native |
|---|---|
| `UIColor { traits in … }` dynamic tokens, `Color.kX` | Plain strings in `tokens.ts`; `ThemeProvider` picks the set from `useColorScheme()`; components read `useTheme().colors`. (`DynamicColorIOS({ light, dark, highContrastLight, highContrastDark })` also exists and resolves natively without a re-render; we don't use it, because `expo-glass-effect`'s `tintColor` and some style math need plain strings.) |
| `accessibilityContrast == .high` | `AccessibilityInfo.isDarkerSystemColorsEnabled()` + `'darkerSystemColorsChanged'` → `a11y.highContrast` → `highContrastOverrides` |
| `.environment(\.colorScheme, .dark)` | `<FixedDark>` around the camera, share and lock-screen trees |
| `.preferredColorScheme(...)` + `@AppStorage` | `setAppAppearance()` → `Appearance.setColorScheme()`, plus your own persisted setting |
| Dynamic Type text styles (`.font(.body)`) | `<KText variant="body">`: size + leading from `textStyles` and `dynamicTypeRamp="body"` (an iOS-only `Text` prop: https://reactnative.dev/docs/text), so each style scales on Apple's curve. `allowFontScaling` stays on (the default) |
| `@ScaledMetric(relativeTo: .largeTitle)` (numerals) | `Numeral`: `dynamicTypeRamp="largeTitle"` + `maxFontSizeMultiplier={1.6}` |
| `dynamicTypeSize.isAccessibilitySize` | `useTheme().isAccessibilitySize` = `useWindowDimensions().fontScale >= 1.75` (React Native's iOS multiplier is 1.0 at the default size and about 1.79 at AX1). `PixelRatio.getFontScale()` returns the same number but doesn't re-render on change, so use the hook |
| `.fontWeight` / `.bold` / Bold Text | `fontWeight: '500' \| '600' \| '700'`; `KText` bumps one step when `AccessibilityInfo.isBoldTextEnabled()` (verify on device that SF Pro doesn't then look double-bold) |
| `.monospacedDigit()` | `fontVariant: ['tabular-nums']` |
| `Font.system(design: .monospaced)` (SF Mono) | `fontFamily: 'ui-monospace'` |
| `.width(.condensed)` system fallback | `fontFamily: 'SystemCondensed'` (supported on the New Architecture since RN PR #52259) |
| Core Text variable axes on Archivo | Static cuts (§3.4). `fontVariationSettings` arrives with RN 0.88 / Expo SDK 58 |
| `.textCase(.uppercase)` | `textTransform: 'uppercase'`, with the sentence-case string as `accessibilityLabel` |
| `RoundedRectangle(cornerRadius:, style: .continuous)` | `borderRadius` + `borderCurve: 'continuous'` (iOS; https://reactnative.dev/docs/view-style-props) |
| `UnevenRoundedRectangle` | Per-corner `borderTopLeftRadius` … `borderBottomRightRadius` |
| `Capsule()` | `borderRadius: height / 2` |
| `strokeBorder` | `borderWidth` (drawn inside the box) |
| Hairline `Divider()` | `<RowDivider />` (1 pt, per the mockup); `StyleSheet.hairlineWidth` only for native-style separators |
| Dashed `StrokeStyle(dash: [5, 4])` | `<Seam />` draws 5 pt segments with 4 pt gaps (RN's `borderStyle: 'dashed'` can't set the dash length) |
| `.shadow(...)` ×2 | `boxShadow` with the CSS string (multiple shadows, New Architecture) on an outer, unclipped view |
| `.contentShape` / padded frames for 44 pt | Layout padding (chips, regular buttons) or `hitSlop` (icon circles) |
| `.accessibilityElement(children: .combine)` + `accessibilityAction(named:)` | `accessible` + `accessibilityLabel` + `accessibilityActions` + `onAccessibilityAction` |
| `.accessibilityAddTraits(.isSelected)` | `accessibilityState={{ selected: true }}` |
| `.accessibilityHidden(true)` | `accessibilityElementsHidden` + `importantForAccessibility="no-hide-descendants"` |
| `AccessibilityNotification.Announcement` | `AccessibilityInfo.announceForAccessibility(text)` |
| `accessibilityReduceMotion` | `AccessibilityInfo.isReduceMotionEnabled()` / `'reduceMotionChanged'` → `a11y.reduceMotion` |
| `accessibilityReduceTransparency` | `AccessibilityInfo.isReduceTransparencyEnabled()` / `'reduceTransparencyChanged'` → `a11y.reduceTransparency` |
| `.glassEffect(.regular.tint(...).interactive())` | `GlassView` (expo-glass-effect): `glassEffectStyle="regular"`, `tintColor`, `isInteractive`; iOS 26+ only (`isLiquidGlassAvailable()`), else `BlurView` |
| `.ultraThinMaterial` / blur | `BlurView` (expo-blur), `tint="systemUltraThinMaterial"` etc.; give it `overflow: 'hidden'` for rounded corners (Expo docs) |
| `TabView` (Liquid Glass) + `.tint` | expo-router `NativeTabs` + `tintColor`; icons `NativeTabs.Trigger.Icon sf={{ default, selected }}` |
| `NavigationStack` titles, `.large` | expo-router `Stack` (native stack): `headerLargeTitleEnabled: true` (React Navigation 7 name) |
| `.sheet` + `.presentationDetents` + drag indicator | `presentation: 'formSheet'`, `sheetAllowedDetents: [0.5, 1]` or `'fitToContents'`, `sheetGrabberVisible: true` |
| `Image(systemName:)` | `<Icon name="…">` → `SymbolView` (expo-symbols), same names |
| `ProgressView` | `ActivityIndicator` |
| `ContentUnavailableView`, `SubscriptionStoreView` | Plain components (EmptyState; PlanCard page 2) |
| `ImageRenderer` (share card) | A fixed-size view captured with `react-native-view-shot` (verify) |
| `#Preview` | The demo-only `src/app/demo/gallery.tsx` route listing every component in each state |

**Things to verify on device in P0** (none of this was run here):
1. `getLoadedFonts()` lists `ArchivoCondensed-SemiBold`, `ArchivoCondensed-Medium`, `ArchivoExpanded-Bold`.
2. `ui-monospace` renders SF Mono: "iiii" and "MMMM" in a mono label must be exactly the same width (in SF Pro they aren't).
3. Numeral baseline: the score's bottom lines up with the word block's bottom like the mockup (the `onTextLayout` descender trim).
4. `dynamicTypeRamp` + `lineHeight` together at AX5: lines don't overlap (RN scales `lineHeight` with the font; verify).
5. `GlassView` takes its circle/capsule shape from `borderRadius`.
6. NativeTabs safe area: the composer sits right above the tab bar, also with the keyboard up.
7. Bold Text bump doesn't double-bold.

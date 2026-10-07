# Decisions log

Contradictions settled and decisions changed during the build. Newest last.

## Oct 6, 2026 · Phase 0 setup

1. **Project folder renamed Kempt → Kitted.** The handoff was written when the folder was `/Users/eyu/Desktop/files/Kempt`; it is now `/Users/eyu/Desktop/files/Kitted`. I replaced the old absolute path in every handoff `.md`, `.py`, `.ts` and `.swift` file. I then re-ran all five fixture generators (`04` §0): the regenerated JSON is byte-identical to the originals except for the path strings in the `provenance` fields of `expected_scores.json` and `readings/INDEX.json`. So `rubric.py` and the fixtures still agree.
2. **Mockup render tooling lives at the repo root** (`tools/mockshots/`, output in `screenshots/mock/`, scratch in `build/`), not under `app/tools/` as `05` §6 says. Reason: `create-expo-app` needs `app/` to be empty or missing, and the Expo project can't be created yet (Node 22 isn't approved). `screenshots/` and `build/` are git-ignored. Web and Simulator shots will go in `screenshots/web/`, `screenshots/sim/` and `screenshots/cmp/` the same way.

## Oct 6, 2026 · P0 build

3. **Archivo `require()`s moved out of `design-system/fonts.ts`** into `design-system/fontFiles.ts`, which is an empty map until the fonts are downloaded. Metro fails the whole bundle on a `require()` of a missing file, and the download still needs the founder's OK. Typography falls back to SF Pro meanwhile (03 §3.4).
4. **`StageList`'s spinner now uses Reanimated** instead of RN `Animated` + `useRef(...).current`. The React Compiler lint rule (`react-hooks/refs`) rejects reading a ref during render, and 06 §3 names Reanimated for animations anyway.
5. **`theme.tsx` guards `AccessibilityInfo`.** react-native-web lacks `isReduceTransparencyEnabled` and friends, so the unguarded calls crashed the web preview at launch. Missing calls now read as "off" (iOS is unaffected).
6. **Web `frame=1` renders the app inside a fixed 402 × 874 box.** Headless Chrome can't make a window narrower than about 500 px, so web screenshots came out wider than the phone and clipped.
7. **`expo-secure-store` plugin set to `faceIDPermission: false`.** By default it adds `NSFaceIDUsageDescription`; Kitted never uses Face ID (05 T29).
8. **`tsconfig.json` → `"types": ["jest"]`.** TypeScript 6 no longer loads every `@types` package by default, so the Jest globals were missing.
9. **The first-run story's check IDs are `story-first` and `story-recheck`** (seed.json's `story` has none; the `full` scenario keeps `FC0`–`FC3R`).
10. **`en.ts` is generated from the copy deck** (`app/scripts/gen-en.mjs` reads 02 §5 → `src/i18n/en.generated.ts`, 682 strings), so the strings stay verbatim. Plural `one` forms and demo-only strings live in `src/i18n/en.ts`. Re-run the script after editing 02 §5.
11. **Onboarding-done lives in the `kv` table** (`onboarding.done`) for the gate; `profile.onboarding_done` exists too and P4 keeps both in step. Reason: there's no profile row until onboarding writes one.
12. **Birth-year sheet detent = 0.37** (02 O3w asks for 320 pt; numeric fractions only, 05 T34; 320/874 on iPhone 17 Pro).
13. **The template's `app/.claude/settings.json`** (turns on Expo's official Claude plugin for sessions opened in `app/`) is kept; it changes nothing for sessions opened at the project root.
14. **OPEN for P2: a `ScrollView` inside an iOS `formSheet` drew nothing** (react-native-screens 4.26, SDK 57; its frames and content size were correct when logged). The P0 placeholders use a plain `View` in sheets. P2's Why/Not quite right? sheets scroll, so P2 must solve it first (try the ScrollView as the screen's first child, react-native-screens' formSheet guidance, or `sheetExpandsWhenScrolledToEdge`).
15. **Hermes on iOS lacks `Intl.PluralRules`** (the first iOS launch crashed on it; the web preview and Jest have it), so `t()` uses English's one/other rule directly (`n === 1`, CLDR's en rule; same results). The demo clock's America/New_York offset is pure arithmetic from the US DST rule for the same reason (Hermes has gaps in `Intl` time zones), and a Jest test cross-checks it against `Intl` hour by hour across both 2026 changes. Rule for later phases: **no `Intl` in app code without checking it on iOS first**; `dayKey` in `@kitted/core` must be pure anyway.
16. **Demo sheets and covers present over Stylist** (`under` in `src/demo/scenarios.ts`): a sheet route replaced into an empty stack has nothing to present over, so it filled the screen.
17. **`xcrun simctl openurl kitted://…` shows iOS's "Open in Kitted?" prompt**, which injected taps couldn't dismiss. Screenshot runs use launch arguments (`simctl launch … -demoScreen <n> -theme dark`), which work. Deep links still route correctly once confirmed by hand (Maestro's `openLink` handles the prompt in P7).

# Next chat: pick up Phase 2 (written Oct 7, 2026, end of the first build session)

> **Founder:** open a new chat in `/Users/eyu/Desktop/files/Kitted` and paste:
>
> `Read /Users/eyu/Desktop/files/Kitted/handoff/NEXT-CHAT.md and follow it. Start with "Fix first".`

---

## To the new chat

You're continuing a build mid-phase. Read these, in order, then start:

1. `/Users/eyu/Desktop/files/Kitted/CLAUDE.md`: the founder's file. Some lines are stale; see "CLAUDE.md is out of date" below.
2. `handoff/README.md`: the mission, the precedence rules, how the founder likes to work. Skim it; you already know the mission from this file.
3. **This file.**
4. `handoff/p2-plan/PLAN.md`: the Phase 2 plan.
5. `handoff/p2-plan/design-spec.md`: every measurement for the chat and cards.
6. `handoff/DECISIONS-LOG.md`: items 1–27 are everything decided or learned so far. **Read it: it saves you from re-hitting the same iOS bugs.**
7. Then read the code in `app/src/` as you need it.

**The founder:**
- He's a college student building this alone, and he often talks by voice dictation, so read for intent.
- He wants plain-language updates: what he'll *see* in the app, not spec IDs.
- He wants honest feedback with a concrete recommendation, and screenshots.
- Ask him only about taste, money and installs.

---

## Where things stand

### Done and pushed
GitHub repo `eyualem/kitted` (**private**), branch `main`. Commit and push after every finished step.

- **P0: the app skeleton.**
  - Expo SDK 57 app in `app/`: expo-router with NativeTabs (the real iOS 26 glass tab bar), demo links and launch arguments.
  - SQLite with migrations V1–V3. The web preview uses an in-memory store with the same interface.
- **The scoring engine** (`app/packages/kitted-core`), pure TypeScript.
  - Matches `rubric.py` on all 5,694 parity cases.
  - Added this session:
    - `time.ts`: day keys, the 4 am rollover, US Eastern time.
    - `ledger.ts`: `explainScore`, the "Why" rows that add up.
    - `closetMatch.ts`.
    - `recheckOutcome`, `removeGarment`, `excludeTargets`.
- **P2, mostly done.** All of these run on the Simulator and match the mockups closely:
  - **Screen 6:** the reading card.
  - **Screen 7:** the 8.0 card.
  - **Screen 8:** "Why 8.0".
  - **Screen 9:** "Not quite right?".
  - **Screen 10:** the re-check, 8.0 → 9.0.
  - **Screen 11:** the partial check.
  - **Screen 12:** Stylist home.
  - The code behind these screens:
    - Data layer: `app/src/data/`. Table specs generate both the SQLite and the memory store; also `seedLoader` and `useLive`.
    - Mock reading source with the real timing: `app/src/services/readingSource/mock.ts`.
    - Fit-check reducer and service: `app/src/features/fitcheck/machine.ts`, `service.ts`. Covers corrections, re-check, Tell me, partial pick/snap/skip, cache, the daily limit, and the 9 s / 14 s timers.
    - Stylist screen, cards and composer: `app/src/features/stylist/`.
    - Sheets: `app/src/features/why/`, `app/src/features/correct/`, `app/src/features/sheet/SheetScaffold.tsx`.
    - Demo sample-photo sheet: `app/src/features/samplePhotos/`. It stands in for the camera until P3.
    - Demo screens: `app/src/demo/prepareDemoScreen.ts`. These run the REAL service at latency 0.
- **Tests:** `npm run check` (in `app/`) runs the typecheck, lint, 64 core tests and 100 app tests. All green.

### Environment (works)
- **Node and Xcode:** Node 22.23.3; Xcode 26.6 at `/Applications/Xcode-26.6.app`, selected with `xcode-select`. Xcode 26.3 is still at `/Applications/Xcode.app`; leave it alone.
- **Simulator:** iOS 26.5 runtime on an iPhone 17 Pro, UDID `111D0A09-C2CA-4F72-BF3C-44019A05C89D`, bundle id `com.trykitted.kitted`.
- **Dev build:** already installed. JS changes hot-reload from Metro on port 8081, run by the `kitted-web` launch config in `.claude/launch.json`. Start it with the Browser pane's `preview_start` tool, `name: "kitted-web"`.
- **Rebuild native** only after a native package or `app.config.ts` change:
  ```bash
  cd app && LANG=en_US.UTF-8 npx expo run:ios --device "iPhone 17 Pro" --no-bundler
  ```
  Metro must be running.
- **Open a demo screen on the Simulator:**
  ```bash
  xcrun simctl launch 111D0A09-C2CA-4F72-BF3C-44019A05C89D com.trykitted.kitted -demoScreen 7 -theme light -demoLatency 0
  ```
  Then take a screenshot with `xcrun simctl io <udid> screenshot <file>`.
  - Don't use `simctl openurl` for this: iOS shows an "Open in Kitted?" prompt that injected taps can't dismiss.
- **Web preview:** `http://localhost:8081/demo/screen/<n>?theme=dark&frame=1`. Use it for quick layout checks only; iOS is the truth.
- **Screenshot tools:**
  - `tools/mockshots/preview.sh <n> light|dark`: renders a mockup screen to `screenshots/mock/`.
  - `tools/mockshots/webshot.sh <n> light|dark`: renders the web preview to `screenshots/web/`.
  - `tools/mockshots/compare.html`: side-by-side comparison.

---

## Fix first: the founder's feedback from Oct 7 (do these before anything else)

### 1. Tapping the text box makes the composer disappear (bug)
- **Likely cause:** in `app/src/features/stylist/StylistScreen.tsx`, the composer dock is absolutely positioned at `bottom: COMPOSER_BOTTOM` (92) inside a `KeyboardAvoidingView behavior="padding"`. When the keyboard opens, the 92 pt offset and the keyboard padding stack up. That pushes the composer off-screen, or under the header or keyboard.
- **Fix:**
  - Drop the KeyboardAvoidingView for the dock.
  - Drive the dock's bottom from the keyboard with `useAnimatedKeyboard()` or `useReanimatedKeyboardAnimation` from react-native-reanimated (already installed): `bottom = keyboardHeight > 0 ? keyboardHeight + 8 : 92`.
  - Lift the thread's footer spacer the same way, so the last message stays above the composer.
- **Verify on the Simulator:** tap the field and type (hardware keyboard off: `⌘⇧K` in the Simulator). Then take a screenshot.

### 2. Camera and photo buttons crowd the text field
- **The founder asked:** why both?
- **Honest answer:** I built both because the mockup draws both. There was no deeper reason.
- **Recommendation: remove the photo-library circle from the composer.**
  - The camera screen (mockup 5) already has a library thumbnail in its bottom-left corner. That's the iOS pattern (Instagram and Snapchat do the same), and spec `02` S4 opens the picker from the camera.
  - In the idle state, the "Check my fit" pill already says what the button does.
  - Also collapse the camera button while he's typing, so the field gets the full width (the Messages / WhatsApp pattern).
  - The demo's sample-photo sheet stays reachable from the camera button.
- Log it in `DECISIONS-LOG.md` as a deliberate difference from the mockup, and tell the founder in one line.

### 3. "Cards feel cramped"
- **Check first** whether it's the Simulator or the design:
  - The Simulator is the true 402 pt width, the same as the mockup, so the mockup is just as dense.
  - The dev-client "Tools" gear button adds clutter. It's dev-only and isn't in Release builds.
  - The comparison screenshots were scaled down.
- **Then run a short design pass with a designer subagent.** Compare against Apple's HIG and the chat apps he uses (iMessage and ChatGPT spacing). Start with:
  - card padding 14/16 → 16/20
  - card section gap 10 → 12–14
  - fix-row padding 10 → 12
  - thread gap between messages 12 → 16
  - verdict line height
- **Show him before/after screenshots** of screens 7 and 12 on the Simulator and let him pick. It's a taste call.
- **Keep the change in the tokens.** Edit `app/src/design-system/tokens.ts` → `space`, plus the `KCardSection` defaults, not scattered numbers.

---

## Then finish P2 (the rest of what was promised)

1. **"Added to your closet" review sheet** (S11, `app/src/app/sheets/added/[checkId].tsx`): the items this check added, with Undo / Add back (`fitCheck.setItemUndone`).
2. **"Which shoes?" sheet** (S10, `sheets/pick-shoes/[checkId]`): the shoe grid with "Last worn {weekday}", which calls `fitCheck.pickShoes`. Add a "Not here? Snap them" option that opens the sample-photo sheet in shoe-snap mode.
3. **"Didn't catch the change? Tell me" sheet** (S21, `sheets/tell-me/[checkId]`): a Done chip per fix, a preview, then "Update score", which calls `fitCheck.confirmFixes`.
4. **Photo viewer** (S13, `photo/[checkId]`): a black full-screen cover with the neck-down photo, an X and an "Occasion · date" caption.
5. **Toasts:** "Saved to your tan chinos.", Undo for auto-added items, and "Logged for today.". Overlay above the tab bar; VoiceOver announces them.
6. **Automated copy checks:** no "AI stylist", no "unlimited", no emoji or dingbats (✓ ▾ ↑), no unfilled `{`, never a score above 9.5. Run them over the strings **and** card view-model output.
7. **An extra-large text check on the Simulator** (`xcrun simctl ui <udid> content_size accessibility-extra-extra-extra-large`) on screens 7–12. Look for clipping and stacking.
8. **A P2 report to the founder:** screenshots, what's real vs. mocked, and decisions.

Then **P3** (camera, simulated in the demo) and **P4** (onboarding), per `handoff/05-build-plan.md`.

---

## Waiting on the founder (raise in the next report, with the default you're using)

- **Archivo fonts:** 3 files of about 185 KB each, OFL license, from `github.com/Omnibus-Type/Archivo` (`fonts/ttf/`). The default is the system font until he says yes. The empty map is in `app/src/design-system/fontFiles.ts`; uncomment the expo-font plugin in `app/app.config.ts`.
- **"Why" rounding line** ("Rounded to the nearest half · +0.25"): built, so he only needs to confirm.
- **"Dialed in. Nothing to fix." only at 9+;** below that, "No quick fixes for this one.". Built.
- **Correcting before a re-check gives the honest 8.5, not 9.0.** The demo story skips the correction.
- **New copy to skim:** `app/src/i18n/en.ts` → `addedInBuild` holds the summaries, the 27 rule names and the VoiceOver lines.
- **Later:** RevenueCat vs. expo-iap (RevenueCat recommended); installing Maestro before P7; the $99 Apple Developer Program; **deleting the Gemini API key** pasted in chat on Oct 6.

## CLAUDE.md is out of date (offer to update; it's his file, so ask first)
- It still lists SwiftUI next steps. The stack is now React Native + Expo.
- It doesn't mention the GitHub repo, the Node 22 / Xcode 26.6 setup, or that P0 and most of P2 are built.
- Suggest he says "Update CLAUDE.md with what we decided today."

---

## Lessons from this session (so you don't repeat them)
Details are in `DECISIONS-LOG.md`.

- **Hermes on iOS lacks `Intl.PluralRules` and parts of `Intl` time zones.** Never use `Intl` in app code without checking on iOS. There are helpers in `app/src/i18n/format.ts` and core `time.ts`.
- **A ScrollView inside an iOS `formSheet` must be the sheet's root element.** Always use `SheetScaffold`. A sticky header's own style is moved to React Native's wrapper, so its row layout must live one View deeper.
- **No `inverted` FlatList on iOS 26:** the scroll-edge fade washes it out. `scrollToEnd` ignores content padding, so use a footer spacer instead.
- **The web preview is only for layout:**
  - Chrome has no `ui-monospace`, so `typography.ts` uses CSS stacks on web.
  - react-native-web lacks some `AccessibilityInfo` calls (guarded in `theme.tsx`).
  - SVG can't take iOS accessibility props, so wrap it in a View.
  - Headless Chrome won't go narrower than about 500 px, so `frame=1` boxes the app at 402 × 874.
- **Typed routes:** a new route needs its file to exist before `router.push` type-checks.
- **Run `npm run check` and commit as separate steps.** A chained command once committed a type error.

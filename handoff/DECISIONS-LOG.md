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
14. **RESOLVED Oct 7 (was: a `ScrollView` inside an iOS `formSheet` drew nothing)** (react-native-screens 4.26, SDK 57; its frames and content size were correct when logged). The P0 placeholders use a plain `View` in sheets. P2's Why/Not quite right? sheets scroll, so P2 must solve it first (try the ScrollView as the screen's first child, react-native-screens' formSheet guidance, or `sheetExpandsWhenScrolledToEdge`).
15. **Hermes on iOS lacks `Intl.PluralRules`** (the first iOS launch crashed on it; the web preview and Jest have it), so `t()` uses English's one/other rule directly (`n === 1`, CLDR's en rule; same results). The demo clock's America/New_York offset is pure arithmetic from the US DST rule for the same reason (Hermes has gaps in `Intl` time zones), and a Jest test cross-checks it against `Intl` hour by hour across both 2026 changes. Rule for later phases: **no `Intl` in app code without checking it on iOS first**; `dayKey` in `@kitted/core` must be pure anyway.
16. **Demo sheets and covers present over Stylist** (`under` in `src/demo/scenarios.ts`): a sheet route replaced into an empty stack has nothing to present over, so it filled the screen.
17. **`xcrun simctl openurl kitted://…` shows iOS's "Open in Kitted?" prompt**, which injected taps couldn't dismiss. Screenshot runs use launch arguments (`simctl launch … -demoScreen <n> -theme dark`), which work. Deep links still route correctly once confirmed by hand (Maestro's `openLink` handles the prompt in P7).
18. **Every scrolling sheet uses `src/features/sheet/SheetScaffold.tsx`**: the `ScrollView` is the route's root with the title row + X as its sticky first child. Cause of #14 (found in react-native-screens 4.26 source, `RNSScreen.mm` / `RNSScreenContentWrapper.mm`): on every layout it resizes the first ScrollView it finds in a sheet; if that ScrollView isn't a direct child of the screen's content wrapper, it falls back to `setFrame:self.frame`, which moves it out of view while `onLayout` still reports React's frame. Upstream issues #2992 and #4769 (open on our exact versions); 4.28 doesn't fix it. Rules: no wrapper View around a sheet's ScrollView, no native header in sheets, no `KeyboardAvoidingView` (use `automaticallyAdjustKeyboardInsets`), bottom-pinned buttons via `unstable_sheetFooter` rather than a third sibling. Checked on the Simulator: content draws, scroll-to-expand from 0.78 to full works, the header stays pinned. Also: a sticky header's own style is moved to RN's wrapper, so the header row lives one View deeper.

## Oct 7, 2026 · P2 prep (designer's findings)

19. **Design-system fixes from the P2 designer review** (`handoff/p2-design-spec.md` §0): no hard-coded English left in components (all from `@/i18n/en`); `Pill` no longer appends "…" (the `read.pending` key has it); `PartialLabel`/`ScoreBlock` take the full label (`partial.label.*`); `scoreWordLabel()` gives the deck's word; `StageList` announces each stage once when it finishes; `LedgerRow` reads "+0" for an unearned credit and "±0" (`zero="plusMinus"`) for occasion/partial rows; `TagLine` gets the occasion `chevron.down`, an accent right side and a 44 pt hit area; `ChipFlow` gets `rowGap`; `NeckDownPhoto` uses expo-image with the mockup's exact crop math (+1.2% foot pad, both offsets clamped; unit-tested on p01b and s24).
20. **Copy-deck wildcard rows split** (`value.topFit.*`, `value.hem.*`, `value.sleeve.*`, `value.tuck.*` → one key per value, e.g. `value.tuck.halfTuck`), done in `scripts/gen-en.mjs`.
21. **New strings not in the copy deck** (all VoiceOver or tiny labels), in `src/i18n/en.ts → addedInBuild`, for the founder to review: `a11y.stylistSays`, `a11y.photo`, `a11y.photoOccasion`, `a11y.photoHint`, `a11y.changeAnswer`, `a11y.changeOccasionHint`, `a11y.fix`, `a11y.fixGain`, `a11y.fixDone`, `a11y.score`, `a11y.ledgerRow`, `a11y.ledgerTotal`, `a11y.plus`, `a11y.minus`, `a11y.noChange`, `a11y.notRated`, `read.a11y.progress`, `read.a11y.stageDone`, `stylist.menu.a11y`, `composer.a11y.field`, `cam.shoe.bubbleCap` ("Shoe snap"), `card.a11y.changeOccasion`, `card.a11y.review`, `card.a11y.recheck`, `why.a11y.pill`.

## Oct 7, 2026 · P2 build

22. **Color and garment words are data**, like the rubric's fix copy: `src/features/fitcheck/labels.ts` (colors, "khaki_beige chinos → Khaki chinos") and core's `SUB_NAME`. Only the joiners ("{name} · in hand") are copy keys.
23. **New copy for the founder to review** (`src/i18n/en.ts → addedInBuild`): card summary templates (`sum.*`: "Good base. One easy change gets you to {to}.", "Clean and finished. Nothing to fix." at 9+, "No quick fixes for this one." below 9), the "Why" rule names for all 27 rules (`why.rule.*`), unearned-credit reasons (`why.reason.*`) and the rounding row ("Rounded to the nearest half"). The mockup's three sentences (8.0 verdict, partial summary, re-check summary) come out word for word (tested).
24. **The shoe snap's own reading** is built from `variants/s24_shoe_snap_runners.json`'s runners in a feet-only scene, which equals `expected_scores.json → partials[1].snap_reading`; the variant file itself is the full outfit with the runners.
25. **The Stylist thread is a normal FlatList pinned to the bottom, not `inverted`.** On iOS 26 the system's scroll-edge fade under the nav and tab bars is applied to the flipped list and washed out the whole thread (verified on the Simulator by toggling `inverted`). The list follows new messages unless he has scrolled up (`onScrollEndDrag`/`onMomentumScrollEnd`), and the space for the composer is a footer, because `scrollToEnd` ignores content padding.
26. **"Why this score" and "Not quite right?" are built** (P2). The ledger rows come from `explainScore` and add up; "Not quite right?" edits fit (tops) and leg shape (bottoms) in "Wrong color or fit", the type or "Not in the photo" in "Wrong item", hides a fix in "Fix doesn't apply", and stores "Score feels off" feedback. Color, hem, sleeve and tuck editors are left for later (P5/P7); the deck has their words.
27. **The row title in "Not quite right?" shows what I read** ("Tan chinos · straight leg") while the selected chip shows his correction (mockup 9).

## Oct 7, 2026 · Founder feedback fixes

28. **The Stylist composer has no photo-library circle, and its camera button hides while typing** (founder, Oct 7: the three buttons crowded the field). The camera screen's library button (S2, mockup 5) covers picking a photo, which is the iOS norm. Focusing the field also switches the idle composer to compact (no quick-start chips, `Ask your stylist…`), as 02 S1 already said for "keyboard up". A deliberate difference from mockups 7–13 (02 S1 and its list, item 21).
29. **The composer rides the keyboard with Reanimated's `useAnimatedKeyboard`, not a `KeyboardAvoidingView`.** Cause of the "composer disappears" bug: the dock is absolute at `bottom: 92` inside a `KeyboardAvoidingView`, so the keyboard padding and the 92 pt stacked and pushed it off-screen. Now `bottom = max(92, keyboard + 8)`; the thread's footer spacer grows by the same lift and the scroll offset follows it on the UI thread (`scrollTo`), so the newest message stays just above the composer. `useAnimatedKeyboard` is marked deprecated in Reanimated 4 in favor of `react-native-keyboard-controller`; switching would be a new native dependency (founder's call), and the hook works on iOS 26.5. Revisit if a Reanimated update drops it.
30. **Card spacing opened up** (founder, Oct 7: "cards feel cramped"; the Simulator is true size and the mockup is as dense). Tokens: card padding 14/16 → 16/20 (`cardPadV`/`cardPadH`), section row gap 10 → 12 (`cardGap`), fix-row padding 10 → 12 (`fixRowV`), gap between thread items 12 → 16 (`stack`), seam inset 18 → 22 (padding + 2, as in the mockup). Cost: about 8 pt less text width, so some labels wrap ("Khaki chinos" on the outfit card). **Kept** (founder, Oct 7: "looks good").
31. **S11 "Added to your closet" is built without the duplicate question** ("Same as your white tee?"). Asking it needs a "maybe the same item" signal from closet matching; `matchClosetItem` only says match or no match, and a match is merged without being added, so nothing would trigger it. It comes with the real reading pipeline (P3+), when matching gets a confidence. The rows read "Top · Regular fit", "Bottom · Straight leg", "Shoes", "Layer · Regular fit" (new strings in `addedInBuild`: `added.slot.*`, `added.detail`, `added.topFit`, `added.legFit`, and the VoiceOver lines). The sheet's header uses `Done` (02 S11), so `SheetScaffold` gained a `doneLabel` option. Row tap opens C3 Edit item, which is still a P5 placeholder.
32. **`setItemUndone` is queued.** Two quick taps in S11 (Undo one item, then another) both read the same check row, and the second write dropped the first: the card showed the wrong "Added N" count. Seen on the Simulator; a service test now fires the calls concurrently.
33. **S10 "Which shoes?" built.** Two differences from 02 S10: "Last worn {weekday}" is an accent caption under the name, not a pill (a pill can't wrap, and in a 3-column grid it cut "Monday" to "Mo…"); and the sheet has a large detent besides medium, since two rows of shoes don't fit in half the screen. The partial card's finish row now shows a shoes tile that opens S10 when there's no remembered pair (02 D11 `partial.finish.snapOrPick`), and `partial.finish.snapOnly` when his closet has no shoes. "Not here? Snap them" replaces the sheet with the shoe snap. Demo screens 21–24 open the undrawn sheets (S11, S10, S21, S13); screen 11's partial check now has the fixed id `story-partial`.
34. **S21 "What changed?" built; the thread now follows a card that changes from a sheet.** The sheet lists the first check's fixes with a `Done` chip each and a live "Score 8.0 → 9.0" line (`fitCheck.previewConfirm`); `confirmFixes(recheckId, targets)` applies the ticked fixes plus any the re-check already saw, always to the FIRST reading (a re-check re-reads only the changed layer, so a held overshirt isn't in its reading; applying to it gave 8.0, caught by the service test). The "Score … → …" line is now one shared component (`features/sheet/ScoreMoveLine.tsx`) used by S8 and S21. **Thread bug (pre-existing, confirmed on the old code too):** a card that grows while a sheet closes ended up half hidden behind the composer, because the sheet's dismissal swallowed the list's scroll-to-end. Fix: when Stylist regains focus, scroll to the end again after 400 ms if he was at the bottom. Open question: after a sheet the list's measured height drops from 874 to 758 (the header's 116 pt); the thread still looks right, but it's worth understanding before P5.
35. **S13 photo viewer built on iOS ScrollView zoom and bounce, not gesture-handler.** Pinch zoom (up to 4×), double-tap zoom (2.5×, via `scrollResponderZoomTo`), pull down past 90 pt to close (only when not zoomed), X top-left (glass), caption `{Occasion} · {date}` ("Date · October 22", new `fmt.monthsLong`/`fmt.longDate`, `longDate()` in `i18n/format.ts`), light status bar while it's up, and paging with dots when the check has a shoe snap. Reason: `GestureDetector` needs a `GestureHandlerRootView` at the app root, which the app doesn't have yet; the native scroll view gives the iOS Photos feel for free. Pinch and pull-to-close are verified on the Simulator; double-tap isn't (the Simulator tool can't tap twice within 280 ms). `neckDownAspect()` is now exported from `Chat.tsx` so the viewer sizes the photo with the same crop math.
36. **G2 toasts built** (`features/toast/`): one at a time, a newer one replaces the old, 5 s (10 s with VoiceOver on; RN can't pause on VoiceOver focus as 03 asks), announced, slides up (fades under Reduce Motion), surface (surface2 dark) + 1 pt line + card shadow. **Position differs from 02 G2's "bottom 100":** on Stylist it sits 8 pt above the composer (the screen reports its dock height via `setToastFloor`), because at 100 it covered the composer. Wired: S8 Save → `Saved to your tan chinos.` / `Correction saved.`; Wear this → `Logged for today.` + Undo, which restores the day's previous wear-log entry (the full scenario already logs check FC3 that day). "Wearing this today" now has its check mark (02 S1) and is derived from the wear log, not local state, so Undo flips it back.
37. **FLAGGED for the founder (rubric, not a port bug): a correction can make the only fix disappear.** p01b at Date with the chinos corrected to slim: raw 7.775 (8.0), `P1_leg_vs_style` fires, and the fix engine then only looks for fixes to mistakes; there's none for leg shape, so it offers nothing, though wearing the overshirt would still give 8.5. `kitted_logic.suggest_fixes` does exactly this (checked in Python: `fixes: []`, "This is dialed in. Nothing to fix." at 8.0), so the TypeScript is faithful. The card then reads "No quick fixes for this one." in the summary and again in the fix row. Recommendation: when a mistake has no fix, fall back to the credit fixes (K1–K4); and drop the duplicate line. Both need the founder's rubric review.
38. **Automated copy checks** (`src/__tests__/copyChecks.test.ts`): every string in `en` (no "AI stylist", "unlimited", emoji, or ✓ ✔ ▾ ▼ ↑, which SF Symbols draw instead; every `{placeholder}` a plain name) and every line a card produces for all 12 demo readings + 8 variants × 7 occasions × empty/full closet × first check or not (summary, partial label, fixes and tags, "→ 9.0", next-level tips, "Why" rows, "What I read"), with no unfilled `{…}` and no score or fix above 9.5. All pass. `addedDetail` moved to `features/added/addedDetail.ts` so tests can import it without Reanimated.
39. **Extra-large text pass (AX5, the largest size) on screens 7–12.** Found and fixed: the "Added 4 to Closet" row broke mid-word ("Add / ed / Clo / set") → stacks at AX sizes; the finish row ("Same shoes as Mond / ay?") → text on its own line, controls under it (as p2-design-spec 11 §5 said); Wear this / Swap one → stacked, full width; the composer squeezed the field to "A" → buttons on one row, the field full width under them (design-spec A7); a multi-line button label was clipped ("Share the before and af") → at AX sizes buttons stack the icon above the label, and **button labels, chips, the "Check my fit" pill and the composer field stop growing at 2× (`CONTROL_TEXT_MAX_SCALE`)**, while body text, scores, fixes and links keep scaling. That cap is a deliberate trade-off (Apple's own controls cap similarly); without it, three buttons filled the screen. The thread's bottom space now follows the dock's measured height, so at AX sizes the newest card's links aren't stuck under the composer. Normal-size screens are unchanged (checked screen 7).


## Oct 7, 2026 · Shopping idea

40. **"Should I buy this?" is planned for v1.1 (December), not v1** (founder, Oct 7: since his closet is already in the app, advice on whether a new item fits it is a good idea). It goes in Stylist, not a new tab or a "scanner" mode. He snaps an item in the store (on the hanger, or tried on in the fitting-room mirror). The reading names the garment, and code gives the verdict: what it goes with in his closet, "+N fits", a duplicate warning ("You already have 2 white tees"), then Buy it / Skip it. It reuses closet matching and the Next best buy fit counts, so the same photo gets the same verdict. **Out of scope:** barcode or tag scanning, prices, "find it cheaper" (Google Lens does these for free with ~20B searches a month). **Why not v1:** beta is Nov 3; the item verdict needs new rules (the rubric scores outfits, and a hanger shows no fit); and a week-1 closet holds only a few items. So when the closet is thin, the card must say what it's based on ("Based on the 4 items in your closet") instead of faking confidence. **Now, with no build:** the fit check already takes fitting-room mirror selfies, so "fitting room check" is a content format for launch videos. Competitors already sell this as a "shopping verdict" (Klozu, Jun 2026; Clovio, Jul 2026; StyleCloset), so our edge is the closet he's already built, not the feature itself. Open before building: a Codex check of Reddit and TikTok for how often guys ask "should I buy this?" and what they want from the answer. Pro or free is the founder's call (recommended: free shows the verdict, Pro adds the "+N fits" detail, matching the Next best buy split).

## Oct 7, 2026 · P3 planning

40. **P3 replanned: real camera and real reading now, on the founder's iPhone** (he'll test with a development build on his own phone). The plan in 05 §P3 now has four parts: A the camera screen with the simulated camera (Simulator), B the real camera in `kitted-vision` (AVCaptureSession + Apple Vision), C on-phone photo prep (neck-down crop, face removed), D a dev-only `DirectGeminiSource` with the locked v3 request. The Simulator and the demo screens keep the mock reading, so they never touch the network. Installs approved by the founder: `expo-speech`, `expo-image-picker` (both in 05 §1.1's later-phase list).
41. **The Oct 6 Gemini key stays in use until production** (founder, Oct 7: small balance, he'll remove it before launch). It lives only in the git-ignored `app/.env.local`, is read only in `__DEV__` builds, and a Release build with it present fails. The beta (M4) moves to the Cloudflare Worker proxy with a fresh key.

## Oct 7, 2026 · P3: real readings first (camera later)

42. **Order changed (founder): test real scoring before building the camera.** Done first: P3 C (photo prep) and D (Gemini). Real photos come in through "Choose from your photos" in the sample-photo sheet (system picker, no Photos permission). The camera (A, B) is next.
43. **Photo prep is native Swift in `kitted-vision`** (Apple Vision person, body-pose and face detectors → cut at the neck, pixelate any face box left in the crop, 1024 px upload / 2048 px kept / 400 px thumb, re-encoded with no metadata, SHA-256 of the original, the temporary original deleted). **If no neck, face or shoulders are found, nothing is sent** (`couldNotFrame`, ruling 10). On the Simulator, Vision fails with "Could not create inference context" unless forced onto the CPU; that's done for Simulator builds only.
44. **`DirectGeminiSource`** (`services/readingSource/gemini.ts`) sends the Oct 6 request byte-for-byte (a test compares it to `extraction-test/prompt.txt` and `schema.json`; `scripts/sync-gemini.mjs` re-copies them), streamed so pills appear as garments arrive, with one hedge after 5 s (first answer wins). `live.ts` routes: bundled demo photos → saved readings (demo screens stay offline and free); real photos → Gemini only when `__DEV__` and the key exists. Readings now store the real model and latency. **In DEV builds with the key, the daily check limit is off** so the founder can test freely.
45. **First real results (Simulator, stock photos):** black tee + gym shorts → 5.5 "Needs a fix" in 6.6 s; vest + flared trousers → 7.5 "Put together" in 10.7 s (the hedge fired). About 1,830 tokens in / 760–935 out per check.
46. **Identical fix lines are shown once.** Two rule targets (F8 top too big, P1 top vs style) both picked "Swap to your Navy crewneck"; `kitted_logic.suggest_fixes` does the same (checked in Python), so the TypeScript stays faithful and the card dedupes by copy. Rubric review item: dedupe in the engine and offer the next distinct fix instead.
47. **The thread follows new content unless his finger scrolled up.** Our own animated `scrollToEnd` ended with a momentum event while content was still growing and was read as "scrolled up", so the next card stayed under the composer. Momentum ends now only count after a real drag.
48. **Flagged:** (a) several bundled sample photos show faces in their neck-down tiles (s15 stairs, s12/s13 mirror shots…): the mockup's crop table is off for them; demo data, not the real pipeline. (b) The locked v3 format has no "held, not worn" field, so the "it's in your hand" fix exists only in demo data (04 §3.2). (c) One real call took 10.7 s; the 14 s give-up leaves little margin on slow networks.
49. **The camera (P3 A + B) is built.** `KittedCameraView` (Swift, in `kitted-vision`): AVCaptureSession preview, portrait buffers mirrored like the preview, Apple Vision body pose + faces about 10×/s → `onGuide` events (state, body box, face boxes in view points), `takePhoto` to a temporary JPEG that photo prep deletes. `CameraScreen.tsx`: mockup 5 layout (scrims, tip pill, outline dashed → solid, live face blur, countdown with "Hold still", Propped/Mirror, library, shutter, flip), auto 3-2-1 after 0.5 s steady (`autoCapture.ts`, tested), haptic ticks + a spoken count (he's 2–3 m away and can't feel a tick, so the count is spoken; the spec's "optional" switch can come later), Mirror's 3 s timer, front "flash" = a white screen, torch on the rear camera, the S18 camera-off card. On the Simulator (no camera) the bundled p01b plays the preview with a scripted guide and its face blurred; the library button opens the sample sheet. Every entry (Check my fit, Re-check, Try another photo, the shoe snap, "Not here? Snap them") now opens the camera; demo screen 5 opens it frozen at "3".
50. **Not built yet in the camera:** the volume-button shutter in Mirror mode (needs a native volume listener), the S3 retake panel for dark/blurry/smudged photos (needs image-quality checks; photo-prep failures show a toast for now), and the S4 screenshot "Is this you?" question. Flash icon: `bolt.slash` when off (the iOS norm), where the mockup draws `bolt`.
51. **Watching his phone tests from the Mac:** a DEV build prints `[camera]`, `[prep]`, `[gemini]` and `[check]` lines (score, what was read, fixes, model, seconds) to the Metro log; `tools/phone/pull.sh` copies the app's database and kept neck-down photos off the phone (dev builds only; untested until a phone is connected).
52. **First install on the founder's iPhone (Oct 7).** `expo run:ios --device` can't create the first provisioning profile (it doesn't pass `-allowProvisioningUpdates`), and the xcodebuild output had most prebuilt frameworks unsigned (hermesvm, React, ExpoModulesCore…), which the phone rejects ("No code signature found"). `tools/phone/install.sh` builds with `-allowProvisioningUpdates`, signs the frameworks and the app with the Apple Development identity (keeping the app's entitlements), installs with `devicectl`, and opens it on this Mac's Metro with `-skipOnboarding true`. Free Personal Team installs expire after 7 days: rerun the script.
53. **Crash on the phone when the camera opened: fixed.** The expo-image-picker plugin's `cameraPermission: false` (copied from 05's P2 line) DELETES `NSCameraUsageDescription`, and iOS kills an app that asks for the camera without it (`__TCC_CRASHING_DUE_TO_PRIVACY_VIOLATION__`, from the phone's crash log). The plugin now gets the same string as the plist (`CAMERA_USAGE` in `app.config.ts`). The Simulator never asks for the camera, so only the phone showed it. 05's `cameraPermission: false` note is wrong for Kitted, which uses the camera.
54. **Photos: full frame with faces hidden, not the neck-down crop; no live blur in the camera** (founder, Oct 7: the crop "loses the silhouette"; the live blur was unwanted). Photo prep now keeps the whole image and hides every face (his and anyone else's): the face box grown to the whole head (1.6 × 1.9), heavy Gaussian blur then coarse pixels (a light blur can be undone). His head comes from the face detector, else the pose's head joints (nose, eyes, ears), else the area above his shoulders; if none is found and his body's top is inside the frame, nothing is sent (`couldNotFrame`, ruling 10). If his body runs off the top edge with no face or head found (a chest-down mirror shot), there's no face to hide and the photo is sent. Checked on the Mac with the same Swift code: 5 stock + 11 mirror selfies, all faces hidden (phone over the face, face cut by the frame edge), the chest-down shot sent with nothing blurred, metadata gone. This is the fallback ruling 13 §R5 and the build spec already named ("full frame with the face pixelated"); the neck-down crop was never validated (13 risk #1), while the Oct 6 accuracy test used full frames. The consent copy ("face cropped out or blurred first") stays true. Unblurred faces: the founder asked; recommended against for now (BIPA/CUBI rely on face data staying on the phone, App Review's "hot-or-not" line, Google keeps uploads 55 days; no accuracy gain). Reversible later with new consent copy and a lawyer's OK.
55. **Ruling 11 decided by the founder: his photo is kept unblurred on the phone; only the upload is face-blurred** (Oct 7: seeing his own face blurred is off-putting). Photo prep writes the kept copy (2048 px) and thumb from the oriented original, re-encoded so EXIF/GPS/camera data are gone, and the upload (1024 px) from the face-hidden image. The consent copy stays true ("We don't keep your photos on our servers. They stay on your phone."; "What doesn't [get sent]: your face"). Risk check: a photo stored only on his own device isn't a biometric identifier (BIPA excludes photographs, and nothing face-derived is created or sent); the app sandbox is included in his own iCloud/device backup like any app's photos. Still to do: the share card (P6) should default to the face-hidden image or let him choose, and deleting a check must delete its files.


## Oct 7, 2026 · Next-steps review (3 parallel reviews: UI audit, P5 plan, roadmap)

56. **Order to beta: features before polish; P5 split around P4.**
    - **Why features first:** the Stylist tab matches mockups 6–12 closely (about 80% of the premium feel). What's left there is an hour of polish per item. Meanwhile 3 of 4 tabs, onboarding and the paywall show dev placeholders, and no server exists.
    - **The order:**
      1. A quick-fix batch.
      2. Closet + outfit idea, on seed data. This runs in parallel with the founder's phone test.
      3. The Worker proxy (it gates real scoring in release builds).
      4. P4.
      5. Lookbook, then You. You reuses P4's Silhouette and segmented control.
      6. P6.
      7. The age check, App Attest log-only, and store items.
      8. P7 across every screen.
    - **Closet tiles** use `GarmentIcon` in the item's color. There's no garment segmentation, and #54 dropped the neck-down crop that 05 assumed. Photo-adding items (no item-reading prompt exists) moves to v1.1, with #40.
    - **Lookbook check days** come from `fit_checks.dayKey`, never from `wear_log` alone. Its day key lets a later "Wear this" overwrite the check.
    - **Bug found:** kept photo and thumb URIs are stored as absolute `file://…/Documents/…` paths (`KittedVisionModule.swift` → `service.ts:329`). The container path changes on reinstall, so store paths relative to Documents.
    - **Stale copy found:** `CAMERA_USAGE` in `app.config.ts` and the review notes (age-rules §4.3) still say the face is cropped out.
    - **P5 estimate:** about 6.5 days, not 2.


## Oct 7, 2026 · Rubric research: proportions, color, style types

57. **Rubric research done; no rubric changes made yet** (founder, Oct 7: the rubric doesn't really cover proportions, color theory or style types). There were four research tracks plus a report: `rubric/research/proportions-color-style.md`. **Findings:**
    - v3.1 already scores most well-supported rules: pooling (F4), tops past the crotch (F6), big top over skinny pants (P2), all-oversized (P3), chunky shoe with narrow pants (S1), "neutral base plus one accent" (C1), the bright clash, pattern rules, and the near-match blazer (C5).
    - Three real gaps, each needing one new coarse reading: a `stacked` hem value (intended stacking on baggy jeans ≠ pooling), `shoe_profile` (a thin shoe under a wide leg; 3 sources agree, 0 disagree), and per-garment `lightness` light/mid/dark (a "muddy middle": lightness contrast is the strongest color signal in O'Donovan 2011 and in Ou & Luo).
    - **Rejected, with reasons:**
      - Color-wheel harmony schemes: Schloss & Palmer 2011 found "virtually no evidence"; O'Donovan found the templates don't predict ratings.
      - The golden ratio: McManus's review.
      - Warm/cool rules: only one source.
      - Measured pixel color: lighting shifts it 4–10 ΔE.
      - Letting the model judge style or harmony: GPT-4o flipped 57–74% of verdicts when image order was swapped (ZOZO 2024).
      - Skin-tone analysis: product rule.
    - **Style types:** keep the general standard with his styles as modifiers, never penalize mixing, and merge Preppy and Old money. Workwear has the strongest 2025–26 trend signal.
    - **Confirmed bug:** style exemptions use `street >= 0.5`, etc. (`rubric.py`), and onboarding weights the 1st pick 0.5 and splits the rest (02 O2). So whether an exemption applies depends on the order he tapped his styles.
    - **Second bug:** only burgundy and sage count as muted, though the model returns `saturation`.
    - **Proposed:** fix both bugs; switch on new points one at a time, only after the gold set has truth labels and pairwise human rankings. All point values are unsourced guesses.
    - **Waiting on the founder:** these are scoring changes, and `rubric.py` plus the parity fixtures must move together.

## Oct 7, 2026 · The morning card

58. **A daily morning card replaces the quick-start chips** (founder, Oct 7: the chip row above the text box looks cramped; he wants the stylist to greet him each morning with the weather and an outfit). Spec: 02 "S1d".
    - **Founder's choices:**
      - Build it right after the quick-fix batch, before the Closet tab.
      - Weather from Apple WeatherKit: free for 500k calls/month with the $99 program, no key in the app, Apple's attribution required. Open-Meteo would be $29/month for commercial use.
      - Location asked inside the card: When In Use, reduced accuracy, never in onboarding.
      - Weather shown as a strip inside the card.
    - **Settled by Claude:**
      - **Code picks the outfit and templates write the words; no AI call.** This keeps it free, instant, offline-capable and deterministic. "The code judges."
      - **One idea is locked per day key,** so the card and the N1 notification agree. N1 plans 3 days ahead from the daily forecast.
      - **From 4 pm the card plans tomorrow.**
      - **Closet states:**
        - Enough: a valid top + bottom + shoes.
        - Thin: dashed tiles plus "Check my fit".
        - Empty: "Send me today's fit…".
      - **Weather bands are first numbers for the founder's rubric review:** 80/65/50/35 °F feels-like, rain 50%+, a swing of 15°+.
    - **Why it's worth it:**
      - It gives a reason to open on the 6 days a week a free user has no fit check left.
      - Acloset already does weather-based daily outfits, so this is table stakes; our edge is the closet built from fit checks.
      - It's good video content.
    - **Until enrollment:** WeatherKit needs the paid program, so it's built behind `WeatherSource` with demo weather.
    - **Privacy:** location goes only to Apple for weather and is never stored or sent to Google. Privacy label: Coarse Location, App Functionality, not linked to identity.


## Oct 7, 2026 · Why the hoodie + wide jeans check scored 3.5

59. **The founder's 3.5 (grey Nike hoodie, black wide jeans, slides) was mostly a misread, not the rules.** From `tools/phone/pull.sh`, check FC-e226a94d:
    - **What was read:** Gemini read the jeans as **black wide sweatpants, pooling**. That fired loungewear (O4) and too casual (O1) on top of pooling (F4) and leg vs. style (P1): 3.5. With the jeans read correctly it's 6.0. Resting on the shoe instead of pooling: 6.5. With Streetwear picked: 7.0. His phone profile has no styles (the install skips onboarding).
    - **Not a one-off:** 9 more reads of the same photo (temperature 0, the prompt with belt-loop/denim hints, and "bigger" uploads) all said sweatpants. The hem flipped between pooling and full_break, a 0.8 swing.
    - **Free-text probe:** asked only about the pants, it said "sweatpants 92" once and "jeans 80–85" twice. The evidence in the photo is genuinely ambiguous: the hoodie covers the waistband, and the pants are black.
    - **The photo was small:** 429 × 860 px. The phone runs the old body-crop build, and the camera uses `sessionPreset = .high` (video-size frames, about 1080 px wide), not full-resolution photo capture. Upscaling proved nothing (same 1,848 input tokens).
    - **Also found:** closet matching treats light grey, grey and charcoal as one color (`closetMatch.ts` uses `fam()`), so two different grey hoodies merge into one item. And this check saved "Black sweatpants" to his closet.
    - **Lessons:**
      1. One misread garment cost 2.5 points, because two rules punished the same sweatpants.
      2. The model can be confidently wrong ("clear") when the deciding detail is hidden.
      3. Rules can't fix a wrong reading; the reading needs evidence fields and a way to ask him.

60. **Founder decisions on style detection, unsure items, closet tiles and the style council (Oct 7).**
    1. **Judge the fit by what it's going for.** When an outfit clearly reads as a style, it gets that style's allowances even if he didn't pick that style. His picks break ties and steer suggestions. Detection is computed in code from the garment fields, never from an AI style label (labels flip between runs).
    2. **Unsure items get one quick tap.** When the model can't tell two types apart and the answer changes the score (jeans vs. sweatpants), the card asks before showing the score, at most once per check. The answer is saved with the closet item.
    3. **Closet tiles show real crops from his photo if they look clean and clear; otherwise a detailed graphic.** This revises #56's icon-only tiles, pending a crop-quality test.
    4. **The style council runs now, at design time.** There are 7 style advocates, a calibration member, a common-ground member and a mediator. Output: `rubric/research/style-council/RULEBOOK.md`, a prototype detector and test cases. At runtime there is still one vision call plus deterministic code. Claude pushed back on per-photo agent debates (slow, about 8× the cost, not repeatable), and the founder agreed.
59. **The morning card gets a "Going with your own?" path** (founder, Oct 7: let him dress himself and get rated from the card; he agreed to the design below).
    - **Design:** it's a full-width row at the bottom of the card, not a third button (3-across looked cramped). It opens the same camera with the card's occasion preset.
    - **After "Wear this":** the row becomes "Dressed? Check it on". Both paths lead to the fit check, the core of the app, and use the same daily free check. When the check is used, the row says "Your free check resets tomorrow".
    - **After any check that day:** the card collapses to one line (photo, "You went with your own", score). Past days' cards render collapsed.
    - **Weather never changes the score:** same photo, same score on any day. It adds one advice line on the result.
    - **No predicted score on the idea:** a closet-based number can differ from the photo's score and would undermine trust.
    - **Evening cards** (planning tomorrow) have no camera row.
    - Build plan: 05 §MC.
60. **Evening card instead of "plan tomorrow" after 4 pm** (founder, Oct 7: people plan for the night).
    - **Two slots per day:** day (4 am–4:59 pm) and evening (5 pm–3:59 am). Each is posted once on the first open in its window.
    - **The evening card plans tonight:** default occasion Going out, tonight's weather, and the camera row ("Check it before you head out").
    - **Not nagging:** "Staying in" collapses it, and 3 skipped evenings in a row stop the auto-post.
    - **Tomorrow** is covered by the morning notification.
    - **New occasions:** `going_out` (already a rubric occasion) and the card-only `staying_in` join the app's occasion list.
61. **Style pull-down on the card, and "Scored for" on results** (founder, Oct 7: show the style a fit was judged by and why).
    - **Styles:** Streetwear, Smart casual, Minimal, Workwear, Old money (preppy merged, #57), Sporty, Outdoorsy. These are the rubric's existing style bands.
    - **One style per check, `[[style, 1]]`, never a blend.** Why: a blend can't be explained in one line, and it has #57's tap-order bug. The source is the card's style; otherwise his first onboarding style; with none, the general standard.
    - **When the line shows:** `styleEffects()` scores with and without the style. The "Scored for" line and the Why section show only when the rule amounts differ, so the app never claims the style mattered when it didn't.
    - **The Why rows still add up.** Switched-off rules show as "not counted" with the general-standard amount.
    - **Never:** "wrong style", a mixing penalty, or the AI judging style.
    - **The pull-down** uses `@expo/ui`, already installed, so no new package.
62. **Re-scoring after a change asks first, and updates the same card** (founder, Oct 7: a 7.5 labelled streetwear must never sit under a different style label).
    - **When:** after a score has landed, changing the occasion or the style opens a native alert with the preview: "Re-score for smart casual? Same photo. It would be 7.0 instead of 8.0." Buttons: "Keep streetwear" / "Re-score".
    - **Keep changes nothing.** The label and the score always match.
    - **Re-score updates the card in place** with a "Re-scored · was 8.0 for streetwear" footnote. Why, Lookbook and Share follow.
    - **Same card, not a new one** (founder left it to Claude). It's the same photo and the same reading, with no AI call and no check used. A second card would look like a second check, double the Lookbook entry and clutter the thread. The footnote keeps the history honest.
    - **This changes D7:** the occasion chip used to re-score instantly after the score. Before the score lands (the S5 chips) changes stay instant. On the morning/evening card (a suggestion, not a score) changes re-pick instantly.

## Oct 7, 2026 · Quick-fix batch (from the #56 review)

63. **The 9 quick fixes, as built:**
    1. **Camera prompt** now reads "Faces are blurred before anything is sent." The review notes (age-rules §4.3) describe the full-frame face blur. It's an Info.plist change, so it needs a native rebuild and a phone reinstall.
    2. **Kept photos are stored relative to Documents** (`services/photoFiles.ts`: `toStoredPath` at capture in `imagePrep/real.ts`, `resolveStoredPath` in `shownPhoto`). Rows saved earlier as absolute `file://…/Documents/…` URLs are re-rooted on today's container, so his existing test photos come back after a reinstall too.
    3. **The first check's `Later` link is hidden until P4** builds the "first 3 moves" card it leads to. A link that does nothing is worse than none.
    4. **Toasts no longer cover the newest card.** While a toast shows, the thread's footer grows by 56 pt and, if he's at the bottom, the thread scrolls up with it (as with the keyboard).
    5. **All four tab icons are outlines in both states.** `hanger` has no fill variant, so the filled selected icons made Closet the odd one out. The mockup draws outlines.
    6. **No hairline under the Stylist header** (`headerShadowVisible: false`).
    7. **Garment icons get a contrast-aware edge** (`garmentEdge`): dark fills (luminance < 0.06) get a lightened rim on dark tiles; near-white fills (> 0.8) a deeper edge on light tiles; everything else keeps the mockup's 30% darker stroke.
    8. **Sheet heights:** "Not quite right?" opens at 0.83, the mockup's height (its top at y = 150), not full height. "Which shoes?" opens at 0.62 (0.5 cut the second row).
    9. **Interim tab screens with real data and no spec IDs:**
       - **Closet:** C1e when empty, else a 3-column grid of his pieces.
       - **Lookbook:** L1e (ghost look + Check my fit) when empty, else a list of scored checks, with re-checks folded in as "8.0 → 9.0". A row opens the photo.
       - **You:** "What your stylist knows" (4 newest facts), the plan card with today's usage, and the privacy line. No chevrons, since nothing pushes yet.
       - The new `EmptyState` component (03) is shared. P5 replaces these screens.
64. **The reading bubble's caption changes from "Only this is sent" to "Face hidden when sent".** Found while verifying #63: since #55 the bubble shows his unblurred kept photo, so "Only this is sent" next to it was no longer true for real photos with a face in them. The new line stays true for both (demo neck-down crops, real full-frame photos). Copy deck 02 §5 updated (`read.bubble.onlySent`) and regenerated.

61. **Style council finished: the rulebook is written, not yet built** (`rubric/research/style-council/RULEBOOK.md`, `rubric_v4_proto.py`, `cases.json`). There were 7 style advocates, a calibration member, a common-ground member (32 numbered conflicts) and a mediator over three rounds. Every ruling, its reason and its dissents are in RULEBOOK Part 2.
    - **Main rulings:**
      - Styles are detected in code from garment slots, anchors and vetoes; a detected style only widens what's allowed. His picks only choose the label on a tie (0 score changes across 2,400 test scorings).
      - Loungewear is one charge sized by signs of intent (−1.2 / −0.6 / −0.3, 0 with a sport hero piece); the matched sweatsuit is not intent.
      - One garment's fit and proportion problems cost at most −1.0. Clean outfits have a 5.0 floor at Everyday, Class, Home and Gym.
      - One garment earns one credit, shoes don't earn "Elevated piece", and fine patterns aren't a point of interest.
      - No style excuses care or fit faults (the one exception: worn work boots at half price).
      - Rejected: up-scaling credits on partial checks, a standalone slides penalty, prep's halved clash, the matched-set intent path, and "one focal point per garment". Deferred to the gold set: the shared wide-trouser waiver, minimal's clean-palette credit, and the 7.0 baseline (at 6.75, 8+ falls to 28% but 9+ disappears).
    - **Verified independently by Claude:** with every switch off the prototype equals v3.1 (2,340/2,340 scorings). Founder's outfit: misread 3.5 → 5.0 with the "Jeans or sweatpants?" tap; read as jeans 6.0 → 6.5 (detected streetwear; the hem drags over slides, −0.4). Saved readings at 8+: 53% → 44%; minimum 5.5 → 6.0. The rulebook reports error vs. calibration's estimates of 0.52 → 0.35, and 52/52 photos stable within 0.5.
    - **Caveat:** the advocates' anchors shaped the rules, so their near-zero error isn't independent evidence. Only the friend panel validates the scores.

62. **Founder calls on the rulebook (Oct 8).**
    - **Hems follow the sources:** a hem that drags on the floor costs −0.4 (3 sources agree, 0 disagree). Wearing slides with socks costs nothing (Highsnobiety: a 2025 go-to).
    - **His Oct 7 jeans were actually cuffed,** a second misread on that photo (all 10 reads said pooling or full break). Read correctly (jeans, cuffed, slides, grey hoodie), it scores 7.0 under the rulebook (6.5 under v3.1). The photo is now a truth-labeled case in `inputs/phone-oct7/truth.csv` (git-ignored, like all photos).
    - **Approved:**
      - the onboarding names "Classic prep" (Preppy + Old money) and "Outdoor" (was Gorpcore)
      - the card wording "Reads as streetwear" (worth 0 points) and the one-tap "Jeans or sweatpants?" with Skip
      - the extraction re-run for the new readings (about $1.35)
    - **The v5 answer format** (`prompt_v5.txt`, `schema_v5.json`) is v3 plus RULEBOOK Part 6: a `stacked` hem; `denim_wear`; `waistband`; `trail_shoe` and `vest`; the closet-only `shade`, `details`, `logo_text`, `sleeve_length`, `lightness` and `shoe_profile`; plus the council's prompt lines. The app keeps the locked v3 format until v5 passes. `compare_v5.py` checks it against the lock-in runs.
    - **First v5 read of his photo:** the hoodie came back as "medium grey", "Nike swoosh", with a hood, drawstring and front pouch. The jeans were still "sweatpants", with a claimed drawstring waist (likely the hoodie's drawstrings). So the waistband field won't save this photo; the tap does, because the certainty was "likely".

## Oct 8, 2026 · Morning card built (05 §MC1–MC8, MC10–MC11)

65. **Numbering collision: two sessions both used #59–62 on Oct 7–8.**
    - **This session's morning-card entries** are the #59–62 under "## Oct 7, 2026 · The morning card": #59 "Going with your own?", #60 evening card, #61 style pull-down + "Scored for", #62 confirm before re-score. Code comments, 02 "S1d"/"S6s" and 05 §MC cite these as "#59–62".
    - **The style-council session's** #59–62 sit under their own headings: the 3.5 hoodie check, founder style decisions, the rulebook, and the Oct 8 calls.
    - Numbers continue from #65, and every new entry gets its heading's context.
66. **Open conflict for the founder: does the style he picks change the score?**
    - **Morning-card #61–62 (this chat, Oct 7):** each check is scored for one picked style. The result card has a style pull-down, and a change asks "Re-score for X?" first.
    - **Style council #60.1, #61, #62 (other chat, Oct 7–8):** styles are detected from the clothes. His picks only break ties and never change a score; the approved card line is "Reads as streetwear" (0 points).
    - **What's built:** the app still runs rubric v3.1, where a style input does change P1/F4/F6/F8, so the morning-card behavior is what ships today.
    - **When the rulebook is ported:** `styleEffects()` will find no differences, so the "Scored for" line disappears by itself. The result card's style pull-down would then always say "The score stays". It should become the detected "Reads as …" label.
    - **The morning card's style pill is fine under both:** the rulebook keeps picks for "steering suggestions".
    - **Waiting on the founder.** Claude recommends the rulebook's way for the result card (detected, 0 points), keeping the style pill on the morning card.
67. **Build notes:**
    - **Scroll to the end:** FlatList's `scrollToEnd` uses cached row heights. A card that grows in stages (data, then tiles, then native pills) ended ~20 pt short, under the dock. The thread now scrolls to the measured content height (`onContentSizeChange`), not `scrollToEnd`.
    - **Native pull-downs:** `@expo/ui` SwiftUI `Menu` inside a `Host` (already installed; no new package). An alert presented while the menu is still closing is dropped by iOS, so `confirmLens` waits 450 ms.
    - **Demo screens and the card:** `morning.enabled()` reads `getDemoArgs().demoScreen`, because Stylist is mounted while a screen's data loads and the demo state was set too late. Card screens: 12, 25–32; screen 33 is "Scored for".
    - **Single-style scoring changed one test:** the demo story's slim-chinos correction scores raw 8.0 for smart casual instead of 7.775 under the old 50/50 blend with workwear. The shown 8.0 and "Score stays 8.0" are unchanged.
    - **Picker tuning after the first screenshots:**
      - hot days rule out sweaters and hoodies, push boots down (−0.75) and favor short-sleeve tops (+0.5);
      - a mild day penalizes any warm piece (−0.75), not only jackets.
    - **Card copy:**
      - occasions read naturally ("for a date", "a night out");
      - weather tips say "Rain today" once the hour has passed;
      - the weather-ask "Allow" is a copper text link (a secondary button vanished on the strip).
    - **Card behavior:**
      - an empty closet shows no "0 pieces so far";
      - "Add basics" is hidden until Starter essentials (C5) exists.
    - **Real vs. sample:** all weather is sample, and the card says "Sample weather". WeatherKit and location (MC9) wait on the paid developer program; the N1 notification tie-in waits on P6.
68. **Founder, Oct 8: the dropdown should look like part of the card; the style is picked before the photo, not after. This resolves #66.**
    - **No system menus.** The `@expo/ui` SwiftUI pull-downs looked like "a default Apple dropdown". They're replaced by `InlinePicker`: a pill (ink outline and an up chevron while open) that opens a tray of chips right under it, inside the card ("Your styles" / "More styles" labels, the current choice filled). Picking a chip closes the tray. One tray is open at a time.
      - **Where:** the morning/evening card (occasion and style pills), the staying-in row, and the result card's occasion.
      - **Removed:** `PullDownPill` and the style action sheet. `@expo/ui` is no longer used by app code; it stays installed.
    - **The thread stays still while a tray opens:** `holdThreadScroll()` pauses "stick to the bottom" for 700 ms, so the pill he tapped doesn't scroll away under the header.
    - **The style can't be changed after the check:** the result card shows `Everyday ⌄ · Streetwear` with the style as plain text, not a control. He picks the look on the morning/evening card before the photo; a check from "Check my fit" uses his first onboarding style.
      - **What can still change after the check:** only the occasion, through the tray, asking first (#62).
    - **"Scored for" stays as built** (today's v3.1 rules apply the picked style). It falls away by itself when the style-council rulebook is ported (`styleEffects()` finds no difference); the "Reads as …" label (council #62) replaces it then. The service keeps `previewLens`/`changeLens` for styles (tested) but no UI calls them.

63. **The v5 answer format failed; the scoring call stays lean** (Oct 8, `compare_v5.py`, results in `extraction-test/results/test5-*`).
    - **Consistency:** stock photos 32/39 (82%, bar 90%; locked v3 37/40), mirror 12/12, phone 4/4.
    - **Speed:** about 3 s slower than v3 measured in the same hour (15.1 vs 12.0 s; output 765 → 1,090 tokens). Tonight's API was slow overall: v3 ran 12 s vs 6.6 s on Oct 6.
    - **Cause:** the longer answer made the core readings flip between runs (s01 dress shoe/loafer, s05 canvas/low-profile, s26 pooling/stacked, s15 hem and leg).
    - **The closet fields read well but don't belong in the scoring call:** shade, details and logo text (the founder's hoodie: "medium grey", "Nike swoosh", hood, drawstring, front pouch).
    - **His ph1:** sweatpants on all 6 v5 runs, never cuffed; the tap fired on all 6.
    - **Decision (Claude):** the code-only rulings don't need new fields, so they ship on the locked v3 format now. New fields go in only after they pass a re-run.
    - **Proposed to the founder (money):** a lean v5s scoring format (v3 + `stacked` + `denim_wear` + the council's prompt lines), and a separate closet call after the card shows (shade, details, logo text, boxes for crops), off the score's critical path.
69. **The pill grows into the menu** (founder, Oct 8: the #68 tray looked awkward; he meant the pill itself should morph into the menu, as an extension of it).
    - **`MorphPicker`** replaces `InlinePicker`. Tapping the pill measures it and opens a transparent Modal. A panel starts exactly at the pill's rectangle (same fill, same label) and animates over 260 ms (ease-out) to a menu at least 220 pt wide. Its top row is still the pill ("Smart casual ⌃"), with a hairline under it, then the choices as 44 pt rows with a check on the current one and the "Your styles" / "More styles" labels.
    - **Closing:** picking a choice, tapping outside (faint scrim) or tapping the top row shrinks it back into the pill (190 ms), then the change applies.
    - **Placement:** it floats over the card, so nothing in the thread moves (the #68 `holdThreadScroll` is gone). It's kept on screen and grows upward when there isn't room below. Reduce Motion: no morph.
    - **Fill:** the pill's own `surface2`. The result card's plain mono "Everyday ⌄" grows a 36 pt row around the text, on a `surface` panel.
    - **Removed:** `InlinePicker` and `scrollHold`.

64. **The slim v5s format also failed; the app stays on the locked v3 format** (Oct 8).
    - **Consistency:** 45/52 photos under the rulebook vs 47/52 for v3 (bar 90%, set beforehand). The gap is 2 photos, within run-to-run noise, but the bar was set in advance and it fails. Only one new wobble comes from the new values (s26 pooling/stacked).
    - **Speed:** fine (6.1 s median vs 6.5 s).
    - **Consequence:**
      - The stacked-hem and raw-denim fixes wait for the gold set. With truth labels it can judge accuracy, not just consistency, and the bar can be re-set with a known noise floor (re-run v3 itself the same day).
      - Meanwhile the rulebook's pooled-loose-jeans −0.4 and the "Jeans or sweatpants?" tap cover the founder's case. His ph1 read "sweatpants, clear" on all 3 v5s runs, and the waistband prompt line didn't fix it.

## Oct 8, 2026 · Style-council session (numbered from #80 to avoid collisions)

80. **Founder, Oct 8: a style picked before the photo never changes the score; the clothes decide.** This resolves #66 for good. It confirms #60.1 and the rulebook ("picks never change the score").
    - The result card shows the detected "Reads as …" label (0 points).
    - The morning card's style pill stays. It steers outfit ideas and breaks label ties.
    - Under v4, `styleEffects()` finds no differences, so the "Scored for" line hides itself.
    - Same photo, same score, whatever he picked.

## Oct 8, 2026 · Rubric v4.0 goes live (style council, code-only rulings)

81. **Rubric v4.0 is live in `rubric.py` and in the app's `@kitted/core` (engine 4); founder approved Oct 8.** Scope: the switches tagged B ("before beta") in `rubric/research/style-council/rubric_v4_proto.py`, i.e. only rulings that read today's v3 reading format. Plain words: `rubric/v4.md`; reasons: `RULEBOOK.md`. v3.1 frozen at `extraction-test/rubrics/rubric_v3_1.py`.
    - **Port proven:** `rubric/research/style-council/check_port.py` compares the live `rubric.py` with `rubric_v4_proto.score(F=BEFORE_BETA)` and `ask_question` on 2,247 unique readings (every saved run, demo readings + variants, `cases.json`, the phone checks, the parity edge/fuzz set) × 15 occasion keys × 8 style mixes (none, new keys, old keys) × 3 boldness levels: **808,920 / 808,920 scorings and 269,640 / 269,640 taps identical** (overall, raw to 1e-9, every output key, detected styles, label). Phase-2 markers (`schema: "v4"`) are dropped first: v4.0 ignores the planned new fields.
    - **TypeScript:** `npm run verify` bit-exact on all 7,146 parity cases, and `askQuestion` matches on all 7,146 (708 ask); 181/181 demo cases, 24/24 mockup checks, fixes, re-checks, corrections, partials, rotation all pass. `npm run check`: typecheck, lint, 102 core tests, 156 app tests green. The parity set now reads only git-tracked result files (a run still writing can't make it unreproducible) plus the council's cases.
    - **New rule ID:** `F4_hem_drags_over_slides` (−0.4). Fixes: "Cuff them once" (Free) or "Swap the slides for chunky sneakers". The loungewear ladder keeps `O4_loungewear_out`; new fix options "Swap the {running shoes/slides} for low-profile sneakers" (a real shoe is a sign of intent). New next-level line for outfits that read minimal: "Mix textures or shades, like a knit or suede. No score change today." New Why strings (in `addedInBuild`): the new rule, and two reasons a credit wasn't earned ("that piece already counts once", "not while it's stained or worn").
    - **Decided in the port (Claude):**
      - The fix engine and Rotation use the bands the score uses (default + the outfit's detected styles), never his picks; a fix target is the nearest whole step inside any accepted band.
      - `ask_question` takes an optional boldness (default "a little", as in the prototype) so the tap's two scores match the card.
      - The Why ledger keeps adding up: the per-garment cap and the 5.0 floor go into the existing "Score limits" row; the ledger also reports them separately (`capReturned`, `floorLift`) for a later row.
      - Stored `rubricVersion` on checks is now 4.0.0.
    - **Demo numbers:** 80 of 181 demo cases change score. The main story is unchanged: p01b 8.0 Sharp → fix → 9.0 at Date, "Score stays 8.0" on the correction, re-check +1.0, s24 partial 6.5 → 7.0.
    - **Differs from mockup because rubric v4:**
      - Screen 1 (welcome hero, s15): **8.5 → 8.0** (still "Sharp"). Wide trousers sit outside the general band; picks no longer widen it.
      - Screen 7 (p01b result): the next-level line **"One standout color, like a rust tee." → "Mix textures or shades, like a knit or suede."** p01b reads as minimal (ruling 37). The score and the fix are unchanged.
      - Not drawn in the mockups but visible in the demo: s24 with white sneakers picked from Closet 7.0 → 6.5 (demo screen 22); demo screen 33 "Scored for streetwear" now shows no line (picks never change a score); the seeded Oct 12 correction (FC1) is 9.0 before and after (was 8.5 → 9.0); onboarding photos s14 8.0 → 8.5, s10 7.5 → 8.0, s09 6.5 → 7.0, s22 7.5 → 7.0, s25 7.5 → 7.0 (scores not drawn on those tiles).
    - **Not in this step:** the new reading fields and values (N, G, X switches), the tap UI, the "Reads as …" label on the card, onboarding renames (Classic prep, Outdoor).

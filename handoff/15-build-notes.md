# 15 · Build notes: running things and lessons from the build

*Reference, not status. Moved from the old status file on Nov 7 (#390). CLAUDE.md holds the short list; this is the full one. Add a lesson here when a trap costs a session real time, with its log number.*

## How to run things
- **Node and Xcode:** Node 22.23; Xcode 26.6 at `/Applications/Xcode-26.6.app`, selected with `xcode-select`. Leave Xcode 26.3 alone.
- **Apple team (Nov 3, 2026):** the paid Apple Developer Program, enrolled as Individual, Team ID `6652QVRQAL` (developer.apple.com → Account → Membership details). It's the same ID the free Personal Team had: an individual's team keeps its ID when it joins the program. This is the ID for `APPLE.teamId` in `app/app.config.ts`. If Xcode still signs as a Personal Team, refresh the account in Xcode → Settings → Accounts.
- **Simulator:** iPhone 17 Pro, iOS 26.5, UDID `111D0A09-C2CA-4F72-BF3C-44019A05C89D`, bundle id `com.trykitted.kitted`.
- **Metro and the web preview:** run by the `kitted-web` launch config (`.claude/launch.json`). Start it with the Browser pane's `preview_start` tool, `name: "kitted-web"`. The dev build hot-reloads from it.
- **"The app won't open on my phone" (Oct 9):** the phone's dev build loads everything from Metro, so check two things first: is `kitted-web` running (it stops when the app closes it), and has the Mac's address changed (new Wi-Fi; `ipconfig getifaddr en0`)? Start Metro, then rerun `tools/phone/install.sh`; it opens the app at the current address. The phone must be on the same Wi-Fi as the Mac, or plugged in: since Nov 20 the script opens Metro over the USB cable when there is one (the Mac's 169.254.x.x address on the cable's network), because school Wi-Fi (10.110.x.x) blocks the phone from reaching the Mac and shows a connection error. Unplugged, the app loses Metro; plug in and reopen Kitted. If it ends with "The application failed to launch" (CoreDeviceError 10002), the app is installed but the phone was locked: unlock it and run the launch line again (Oct 10). If instead it says "invalid code signature … not been explicitly trusted by the user" (Oct 13), the build is fine but the phone dropped its trust: Settings → General → VPN & Device Management → Apple Development: eyuhaile5@gmail.com → Trust, then launch again. The free signing permit lasts 7 days from when Xcode makes it (`embedded.mobileprovision` ExpirationDate; the current one ends 2026-10-31T19:15:01Z UTC); after that, rerun `install.sh`. Xcode reuses a cached permit until it expires, so a reinstall the day before doesn't renew it: to get a fresh 7 days early, move the old file out of `~/Library/Developer/Xcode/UserData/Provisioning Profiles/` (keep a copy) and rerun `install.sh` (Oct 24). If the build fails with "No Accounts" / "No profiles for 'com.trykitted.kitted'" (Oct 17), Xcode signed out of the founder's Apple ID: he signs in again in Xcode → Settings → Accounts (eyuhaile5@gmail.com, Personal Team), then rerun `install.sh`. After an uninstall (Oct 18), the fresh app also asks to find devices on the local network: tap Allow (or Settings → Privacy & Security → Local Network → Kitted), or it can't reach Metro. **Locked out by the under-18 gate (Oct 18):** the lock lives in the Keychain on purpose (05 S11), so deleting the app doesn't clear it. With Metro running, relaunch the dev build with the reset (note the `--`, or devicectl eats the app's options): `xcrun devicectl device process launch --device <id> --terminate-existing --payload-url "exp+kitted://expo-development-client/?url=http%3A%2F%2F<mac-ip>%3A8081" -- com.trykitted.kitted -resetData true -clearAge true` (wipes the app's data too; demo builds only, never Release).
- **Rebuild native** only after a native package or `app.config.ts` change. After an `app.config.ts` change, run prebuild first: `run:ios` doesn't regenerate `ios/Kitted/Info.plist`, so the old strings ship.
  ```bash
  cd app && LANG=en_US.UTF-8 npx expo prebuild --platform ios --no-install
  ```
  Prebuild may clear and recreate the whole `ios/` folder (Oct 22), Pods and the phone build cache with it: then run `cd app/ios && LANG=en_US.UTF-8 pod install`, and the next `tools/phone/install.sh` is a full build (~10–15 min).
  ```bash
  cd app && LANG=en_US.UTF-8 npx expo run:ios --device 111D0A09-C2CA-4F72-BF3C-44019A05C89D --no-bundler
  ```
  Use the UDID, not the name: "iPhone 17 Pro" also matches a broken duplicate Simulator (EF7ADF2A, runtime missing; Oct 14).
- **The server's tests (#326):** from `firebase/`, `npm --prefix tests run emulate` (rules, jobs and the AI proxy on the emulators, ~1 min with start-up; needs Java) and `npm --prefix tests run smoke` (the real `api` function under the Functions emulator with a fake Gemini; it writes and removes the emulator-only key files). One at a time, and not while the Simulator is busy (rule 9).
- **The app against the real function, locally (#327):** from `firebase/`, `npm --prefix tests run appserve` (emulators with the `api` function and a fake Gemini on :9877; `curl 127.0.0.1:9877/report` shows the calls and the server's counts, `curl 127.0.0.1:9877/stop` ends it). Then run a Metro with `EXPO_PUBLIC_KITTED_SERVER=127.0.0.1` in its environment and pick a photo with "Choose from your photos" (the stand-in camera's sample is never sent). Not with the Simulator busy elsewhere (rule 9).
- **A Release build (#323):** run `npm run guard:release` in `app/` first (a production export scanned for secrets, ~2 min). Then `cd app && LANG=en_US.UTF-8 npx expo run:ios --configuration Release --device 111D0A09-C2CA-4F72-BF3C-44019A05C89D --no-bundler` (no Metro; the demo tools are off unless `KITTED_DEMO=1`). It replaces the Debug app on the Simulator, so first copy the installed one out (`xcrun simctl get_app_container 111D0A09-C2CA-4F72-BF3C-44019A05C89D com.trykitted.kitted app` gives its path; DerivedData's Debug copy may be gone, #366) and put it back afterwards with `xcrun simctl install 111D0A09-C2CA-4F72-BF3C-44019A05C89D <the copy>`. To score a real photo there: `xcrun simctl addmedia` it, then `xcrun simctl openurl … "kitted://sheets/sample-photos?mode=check&from=camera"` → Choose from your photos (the stand-in camera's countdown beats a tap on its library button). Then `npm run check:app -- <the built app>`.
- **Check a built app (#366):** `npm run check:app -- <path to Kitted.app>` in `app/` (add `--paid` once the switch is on); for an EAS `.ipa`, unzip it and pass `Payload/Kitted.app`. EAS builds (after the program and the CLI OK): `eas build --platform ios --profile preview|production` from `app/`.
- **Open a demo screen on the Simulator, then take a screenshot:**
  ```bash
  xcrun simctl launch 111D0A09-C2CA-4F72-BF3C-44019A05C89D com.trykitted.kitted -demoScreen 7 -theme light -demoLatency 0
  ```
  ```bash
  xcrun simctl io 111D0A09-C2CA-4F72-BF3C-44019A05C89D screenshot shot.png
  ```
  Don't use `simctl openurl`: iOS shows an "Open in Kitted?" prompt that can't be dismissed by script.
- **Web preview:** `http://localhost:8081/demo/screen/<n>?theme=dark&frame=1`. Use it for layout only; iOS is the truth.
- **Screenshots vs. the mockup:**
  - `tools/mockshots/preview.sh <n> light|dark` renders a mockup screen.
  - `tools/mockshots/webshot.sh <n> light|dark` renders the web preview.
  - `tools/mockshots/compare.html` puts them side by side.
  - Output goes to `screenshots/` (git-ignored).
- **UI review checklist (#363):** the project skill `ui-ux-pro-max` (Claude loads it for UI work; from the repo root, `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --stack react-native`). It checks; the design system decides.

## Lessons from the build (details in DECISIONS-LOG)
- **Run the Python engine's tests and generators with `/usr/bin/python3` (3.9), never plain `python3` (3.14 on this Mac).** Python 3.12+ adds floats more exactly in `sum()`, so a raw score on a half-thousandth rounds the other way (7.3625 → 7.362, not 7.363) and pinned fixtures look "moved" though no engine changed (#499).
- **Hermes on iOS lacks `Intl.PluralRules` and parts of `Intl` time zones.** No `Intl` in app code without checking it on iOS. Use `app/src/i18n/format.ts` and core `time.ts`.
- **A scrolling iOS sheet must have its ScrollView as the root.** Use `SheetScaffold`. A sticky header's row layout must sit one View deeper.
- **No `inverted` FlatList on iOS 26** (the edge fade washes it out). `scrollToEnd` ignores padding, so use a footer spacer.
- **Web preview limits:**
  - No `ui-monospace` in Chrome; web uses CSS font stacks.
  - Some `AccessibilityInfo` calls are missing on web.
  - SVG can't take iOS accessibility props; wrap it in a View.
  - Headless Chrome can't go narrower than about 500 px; `frame=1` boxes the app at 402 × 874.
- **Run `npm run check`, then commit, as separate steps.** Chaining them once committed a type error.
- **Large text:** at AX sizes rows stack (`isAccessibilitySize`), and control labels cap at 2× (`CONTROL_TEXT_MAX_SCALE`); wrapping 3-line button labels got clipped on iOS.
- **A card that changes behind a sheet** needs a scroll-to-end after the sheet closes (Stylist does it on focus, 400 ms).
- **`simctl io … screenshot` can fail silently** when the target file exists and is protected; write to a new path.
- **Apple Vision on the Simulator** needs the CPU forced (`setComputeDevice`), or every request fails with "Could not create inference context".
- **Never send a photo when his head/face can't be found** (`couldNotFrame`, ruling 10); a photo whose body runs off the top edge has no face to hide and is sent.
- **react-native-svg keeps a dash pattern after `strokeDasharray` is removed;** key the shape by state to redraw it.
- **A new Swift file in a local module needs `pod install`** before Xcode sees it ("cannot find … in scope").
- **Don't trust FlatList `scrollToEnd` while rows grow;** it uses cached row heights. Scroll to the height from `onContentSizeChange` (StylistScreen `toEnd`).
- **An alert raised from a SwiftUI `Menu` item is dropped while the menu closes;** wait about 450 ms (`confirmLens`; the menus are gone since #68, but the wait stays harmless).
- **Menus that open from a control float in a Modal at its measured spot** (`MorphPicker`), so the thread never moves or clips them.
- **Demo gating:** read `getDemoArgs().demoScreen`, not the demo state, in code that runs while a demo screen loads.
- **The closet is the closet service's** (`features/closet/service.ts`, #91): fit-check writes go through `patchCheckKeepCloset`, which keeps `closetSummary` and `itemIds`; never write those from the fit-check service. In tests, share one id factory between services (two counters both made `R-1`).
- **expo-sqlite `INSERT OR REPLACE` moves a patched row to the end of `all()`;** sort lists explicitly.
- **Demo screen numbers may skip** (parallel sessions number from their own block); `-demoScreen` is capped at the highest `n`, not the count (#103).
- **Simulator Vision:** `VNClassifyImageRequest` on the CPU gives meaningless labels (the same for different photos); person, face and piece checks work. Judge the clothes label on the Mac harness or the phone (#103).
- **The dev build's floating "Tools" button covers the top-right header button** and takes its taps; drag it away when testing. It also sits over the open composer's send at rest (#319).
- **The tab bar and its bottom accessory draw above a tab's screen** (iOS 26 NativeTabs): nothing in the screen can cover them, and their Liquid Glass lenses whatever sits under them. Take the accessory out (`NativeTabs.BottomAccessory` unrendered) rather than fading its contents (#319).
- **Parallel sessions share files: stage only your own hunks** (`git add -p`) of shared files like core `index.ts`, and check HEAD alone with `npx tsc --noEmit -p app/packages/kitted-core` in a clean worktree. A worktree whose `node_modules` is symlinked to this folder typechecks this folder's core, not HEAD's (#127).
- **iOS 26 tab-bar shrink on scroll needs the screen's first view to be a ScrollView** (not a FlatList, not wrapped in a View; a sibling after it is fine). Once shrunk, the bar does not grow back when he scrolls back partway (iOS 26.5, `onScrollDown` and `onScrollUp` alike); only a tap brings it back, so the Stylist thread uses `never` (#378). The Simulator tool's instant taps miss glass header buttons; tap with `duration: 0.15` (#181).
- **On the Simulator, press the toast's Undo with `duration: 0.15`** (an instant tap doesn't register), and tap it within a couple of seconds: each screenshot takes ~4 s and the removal toast lasts 8 s. To test a worktree's code, run a second Metro from the worktree on port 8082 and point the dev build at it with `simctl openurl <udid> "exp+kitted://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8082"` after a `simctl launch … -demoScreen <n>` (the launch args stay); a worktree without node_modules can borrow the main checkout's (symlink plus a temporary `metro.config.js` adding it to `watchFolders`; don't commit either) (#296).
- **No `numberOfLines` on a multiline `TextInput` that should grow:** on iOS (new architecture) it becomes the paragraph's line cap in the field's measurement, so the field stays that many lines tall and cuts the rest off. Bound it with a `maxHeight` scaled by `fontScale` instead (#321).
- **The React Compiler lint (`expo lint`) rejects** `sharedValue.value = …` inside callbacks (use `.set()`), `Date.now()` in render (take it in a lazy `useState`), and a `useCallback` that reschedules itself; keep such a timer inside one effect and reach it from handlers through a ref (#324).
- **React retries a render that throws, once,** so a test trigger that throws once recovers unseen; and the React Compiler keeps a render-time read of a module value (`getDemoArgs()`) from the first render: read it in a child that mounts after it's set (#353).
- **The Mac's disk ignores case:** `latestPill.ts` next to `LatestPill.tsx` makes tsc refuse the import; give them different names (#353).
- **A worktree that borrows `node_modules` by one symlink tests against the main checkout's `@kitted/core`.** For a core change, make `node_modules` a folder of symlinks to the main one's entries, with `@kitted/core` pointing at the worktree's `packages/kitted-core` (#358).
- **Keep a reanimated style inside the component that's drawn,** and check a toast after changing a screen's animated styles: Stylist's always-on pill style (reading the toast's room) left every toast's entering animation stuck invisible (#357, like #118).
- **A worktree Metro that borrows the main checkout's `node_modules` shares Metro's cache with other worktrees** and can bundle another branch's files. Give it its own cache: a temporary, uncommitted `metro.config.js` with `config.cacheStores = [new FileStore({ root: '<scratchpad>/metro-cache' })]` (`metro-cache`) and the main `node_modules` in `watchFolders` (#377).
- **A sheet's detents follow its options when the screen is registered;** at the accessibility sizes pick them from `useTheme()` in `RootStack` (Swap one opens full height there, #377).
- **No `KeyboardAvoidingView` around absolutely positioned docks.** Its padding stacks on the fixed `bottom`. Drive the dock from `useAnimatedKeyboard` (see `StylistScreen.tsx`).
- **Jest crashes when Watchman isn't running** ("unable to talk to your watchman … Connection refused", Nov 7, #391): `npm run check`'s last step dies before running a test. Run that step as `npx jest --no-watchman` in `app/` (the same tests), and say so in the report.
- **Maestro and the development build** (Nov 7, #392): launched by Maestro, the dev build stops on its own launcher ("Development servers") instead of the app. `app/e2e/common/open-demo.yaml` taps the running Metro server; every flow opens through it. Metro must be running (`preview_start` `kitted-web`).

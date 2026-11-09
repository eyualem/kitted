# T80 · Switch on the paid Apple team: Apple's weather first, the server lock's entitlement; rebuild the app

> **Parked, Nov 9 (the founder, in chat: use the US weather service for now; Apple's weather is a task for later,
> "probably migrating sometime soon").** Never built. This plan switches WeatherKit on as built, and that would break
> Apple's terms (DECISIONS-LOG #406): the card stores its forecast for good, Apple's mark shows only on the card, and Kit
> sends the numbers to OpenAI. When T80 restarts, re-plan from here with #406's rules. The per-build table, the portal
> steps (F-1) and the traps (Metro's `applePaid`, `check:app` on Debug) still hold. TESTING.md was never locked.


**From:** `plan.md` → T80 (Launch lane) · **Spec:** `specs.md` → Constraints "Weather: Apple WeatherKit, with the US National Weather Service as the fallback"; F6.1; Data table → Location; failure table → "Location denied". The switch itself was designed, built and tested off in `handoff/09-ui-review.md` §27 (S1–S3, W1–W5) and DECISIONS-LOG #366; the team ID is settled by #404. **Lane:** Launch (`app/app.config.ts`, `extraction-test/results`, `market/`).

`specs.md` has no `**Approved by the founder:**` line of its own, but it is the founder's blueprint (CLAUDE.md: "Written once with the founder"), and the lane names it as its spec with "no interview". The location words are the founder's (Y20, yes Nov 8). No conflict found between `specs.md` and §27.

The plan line lists no `checks:`; its done line is "Apple's weather on the Simulator". The criteria in TESTING.md are that done line (T80.D) plus the spec lines and §27 checks this task turns on: S1, S2, S3, W2, W3, W4, W5, F6.1, and N.

## Goal
On a Simulator build, the morning/evening card's weather comes from Apple Weather, with Apple's " Weather" mark and a "Data sources" link under it. If Apple's service doesn't answer, the National Weather Service answers. The iOS location prompt names Apple Weather. The built app carries the paid team's four entitlements.

## What "on" changes, by kind of build
This answers the coordinator's question. Nothing in the app's code calls App Attest, Declared Age Range or Sign in with Apple yet: those are T23, T32 and T41. Turning the switch on adds only their entitlements. WeatherKit is the only one whose behaviour changes now.

| Entitlement | Local Simulator build (`expo run:ios`, Debug) | Device dev build (`tools/phone/install.sh`, `xcodebuild -allowProvisioningUpdates`) | EAS build (development / preview / production) | Needs the App ID's capability in the portal? |
|---|---|---|---|---|
| `com.apple.developer.weatherkit` | Signed for the Simulator with team `6652QVRQAL`; no provisioning profile is needed. WeatherKit answers only if the App ID has WeatherKit under **Capabilities** *and* **App Services**. Otherwise the call fails and NWS answers (W3). | Needs a development profile for the App ID with WeatherKit. Xcode makes one only if the founder's Apple account is signed in to Xcode. | EAS syncs capabilities from the entitlements, using the founder's Apple login. **The App Services tick is never synced: it's manual.** | **Yes, both tabs.** The App Services tick can take up to about 30 minutes to start answering (market/app-store-connect.md §8 step 2). |
| `com.apple.developer.devicecheck.appattest-environment` (`production`; `development` for the EAS `development` profile) | Harmless. App Attest isn't supported on the Simulator, and nothing calls it yet (T23). | Must be in the profile, or install fails. | Synced by EAS. | Yes (App Attest). Xcode and EAS can add it. |
| `com.apple.developer.declared-age-range` | Harmless; no code uses it yet (T32). | Must be in the profile. | EAS syncs it if it knows this capability. **Unconfirmed for a capability this new**, so tick it by hand. | Yes (Declared Age Range). |
| `com.apple.developer.applesignin` (`Default`) | Harmless; there's no button yet (needs `expo-apple-authentication`, T41). | Must be in the profile. | Synced by EAS. | Yes (Sign in with Apple, as a primary App ID). |

What follows from the table:
- **A local Simulator build should sign as it does today.** DEVELOPMENT_TEAM is already `6652QVRQAL` in the main checkout's project.
- **`tools/phone/install.sh` will stop working** once the switch is on, until the founder signs in to Xcode with the paid account and a development profile with the four capabilities exists. No profiles are on this Mac. The founder's phone runs the TestFlight build now, so this blocks nothing in T80. It is a risk to log.
- **The next TestFlight build (T85) is an EAS build.** It needs the founder's OK, and his Apple login so EAS can sync the capabilities and regenerate the distribution profile. Enabling capabilities invalidates the stored profile. That build is a founder question, not a step here.
- **The founder's portal step** (to-do F-1 below) is the only thing between this task and the done line. Without it the Simulator can still prove:
  - the entitlements in the built app;
  - the new location words in the iOS prompt;
  - that the switch reaches the JS;
  - the NWS fallback (WeatherKit is refused, so NWS weather shows and there's no mark);
  - that no coordinate is stored.

## Files
Only these. Anything else is a deviation the implementer writes in REPORT.md.

**In the lane:**
- `app/app.config.ts` (shared: one session at a time; the beta-notifications session will add the `expo-notifications` plugin in the same file). Change **only** these, and stage only these hunks (`git add -p`):
  - the `APPLE` block: `paid: true`, `teamId: '6652QVRQAL'`;
  - the doc comment above `APPLE`: say it's on since T80, keeping the rest;
  - the `LOCATION_USAGE_PAID` comment: replace "Not yet OK'd by the founder." with "OK'd by the founder Nov 8 (Y20)."

  The string itself is unchanged, word for word. Do not touch `FREE_TEAM_ID`, `appleSettings`, `LOCATION_USAGE`, the plugins or anything else.
- `market/app-store-connect.md` §8: tick step 3 ("Flip the switch") and note T80. No other edits.

**Tests (written by the test writer, not the implementer):**
- `app/src/__tests__/approvalDay.test.ts`: S1 must change. It asserts that the committed config is *off* (team, `entitlements: {}`, the NWS string, `applePaid: false`, and the source-text regex `paid: false`). That stops being true by design. The off path stays tested through the pure `appleSettings({ paid: false, … })`, and the source-text regex goes. This is the criterion changing, not a test being weakened. Write it in REPORT.md.
- New: `app/src/__tests__/t80AppleWeather.test.tsx` (the behaviour tests in TESTING.md).
- New: `app/e2e/flows/T80-sample-weather-no-mark.yaml` (the flow in TESTING.md).

**Outside the lane (the coordinator must OK; see Open questions T-2):**
- `app/src/features/morning/MorningCard.tsx`: `export` the existing `WeatherLine`, so a component test can render it. Add three testIDs (`wx-line`, `wx-apple-mark`, `wx-data-sources`). No visible change, no copy change. This lane (Kit and the morning card) is held by the same session (T54, which touches only `morning/service.ts`).

**Not touched (already built and tested off in #366):**
- `src/config/apple.ts`
- `src/services/weather/{index,weatherkit,nws}.ts`
- `modules/kitted-location/` (Swift and JS)
- `scripts/check-release-app.js`
- `en.ts`
- the privacy manifest
- `eas.json` (its `appleTeamId` is already `6652QVRQAL`)

`app/ios/` is generated by prebuild and git-ignored; never commit it.

## Interfaces
What the tests call. The test writer reads only this section.

**The config (`app/app.config.ts`), evaluated with `jest.isolateModules` as in `approvalDay.test.ts` → `loadConfig()`:**
- `default.ios.appleTeamId`: `'6652QVRQAL'`.
- `default.ios.entitlements`: exactly these four keys:

  ```
  { 'com.apple.developer.declared-age-range': true,
    'com.apple.developer.devicecheck.appattest-environment': 'production' | 'development',
    'com.apple.developer.weatherkit': true,
    'com.apple.developer.applesignin': ['Default'] }
  ```

  The App Attest value is `'development'` only when `EAS_BUILD_PROFILE=development`. It is `'production'` for `preview`, `production` and unset (local runs).
- `default.ios.infoPlist.NSLocationWhenInUseUsageDescription`: exactly `Kitted uses your approximate location to get today's weather for your outfit idea. It goes only to Apple Weather (or the US National Weather Service if that's down) and is never stored.`
- `default.ios.infoPlist.NSLocationDefaultAccuracyReduced`: `true` (unchanged).
- `default.extra.applePaid`: `true`.
- `appleSettings(apple: { paid: boolean; teamId: string }, easProfile: string | undefined): { teamId; entitlements; locationUsage; applePaid }` (exists, unchanged):
  - `paid: false` → `{ teamId: '6652QVRQAL', entitlements: {}, locationUsage: <the NWS string>, applePaid: false }`;
  - `paid: true` with a teamId that isn't 10 capital letters or digits → throws `/teamId/`.
- `requireFirebaseKey(profile, key)` (exists, unchanged).

**The app's JS:**
- `applePaidFrom(extra: unknown): boolean` and `APPLE_PAID: boolean`, from `@/config/apple` (exist). `APPLE_PAID` reads `Constants.expoConfig?.extra?.applePaid`.
- `weatherKitFirst({ applePaid, weatherKitAvailable }): boolean`, from `@/services/weather` (exists).
- `weatherSource: WeatherSource`, from `@/services/weather` (exists). Its live source is chosen once, at module load: `APPLE_PAID && location.weatherKitAvailable` → `createWeatherKitSource({ location, weatherKit: { hourly: location.weatherKitHourly }, fallback: nwsSource })`, else NWS. To test it with the switch on, load it under `jest.isolateModules` with these mocks:
  - `expo-constants`: `{ expoConfig: { extra: { applePaid: true } } }`;
  - `../../modules/kitted-location` (path from `src/__tests__`): `isAvailable: true`, `weatherKitAvailable: true`, `permission`, `requestPermission`, `currentLocation`, `weatherKitHourly`, `weatherKitLegalUrl`;
  - `@/demo/config`: `DEMO_ENABLED: false`;
  - `@/state/session`: `getDemoArgs()` returns `{ demoScreen: null, weather: null }`;
  - `@/data/db`: a memory store;
  - global `fetch`, for NWS.

  `weatherSource.kind` is `'live'`. `weatherSource.forecast('day' | 'evening'): Promise<DayWeather & { source?: 'nws' | 'weatherkit' } | null>`.
- `createWeatherKitSource(o: { location; weatherKit: { hourly(lat, lon) }; fallback: NwsSource; now?; timeoutMs?; cacheMs?; log? }): NwsSource`, from `@/services/weather/weatherkit` (exists). Its timeout defaults to `NWS_TIMEOUT_MS` = 6 000 ms, its cache to `NWS_CACHE_MS` = 1 h. It rounds the coordinate with `round2` (2 decimals). On any failure it returns `fallback.forecast(window)`.
- `toPeriods`, `conditionWords` (weatherkit.ts); `mapHourly`, `isLiveWeather`, `isNwsWeather`, `isWeatherKitWeather`, `round2`, `NWS_TIMEOUT_MS`, `NWS_CACHE_MS` (nws.ts). All exist.
- `createMorningService({ store, clock, weather, ids })` (exists; set up as in `morningService.test.ts`). `ensureCard` stores the forecast on the daily idea row's `weather`, keeping its `source` and adding `fetchedAt`. The card times its weather out after `LIVE_WEATHER_TIMEOUT_MS` = 7 000 ms when `weather.kind === 'live'`.
- `weatherKitLegalUrl(): Promise<string | null>` (kitted-location `index.ts`, exists): the native attribution's `legalPageURL` when it starts `https://`, else `null`.

**The card's weather line (needs T-2's OK):**
- `export function WeatherLine({ w }: { w: CardWeather }): JSX.Element`, from `@/features/morning/MorningCard`. `CardWeather` is from `@/features/morning/copy`. It reads the hour from `sessionClock` (`@/state/session`); mock it or set it.
  - **Any weather:** a `View` with testID `wx-line`, `accessible`, whose `accessibilityLabel` is `` `${weatherLine(w, hour)}. ${X}` ``. X is:
    - `Sample weather` when `!isLiveWeather(w)`;
    - `Weather: Apple Weather` when `w.source === 'weatherkit'`;
    - `Weather: National Weather Service` when `w.source === 'nws'`.
  - **Sample weather only:** the visible text ends with `  Sample` (two spaces, then `Sample`).
  - **WeatherKit weather only:**
    - a `View` with testID `wx-apple-mark`, `accessible`, `accessibilityLabel` `Weather: Apple Weather`. It holds `Icon name="apple.logo"` and the text `Weather`.
    - a wrapper `View` with testID `wx-data-sources` around a `TextLink` with title `Data sources`, `accessibilityRole="button"` and `accessibilityLabel` `Data sources`.
  - A press on `Data sources` calls `Linking.openURL(url)` once. `url` is `await weatherKitLegalUrl()` when that isn't null, else `https://weatherkit.apple.com/legal-attribution.html`.
  - With `source: 'nws'` or no source, neither `wx-apple-mark` nor `wx-data-sources` exists, and no text `Data sources` is rendered.
- Mocks as in `cardNoAddTile.test.tsx`:
  - `@/design-system`: `KText` as `Text`; `Icon` rendering `icon:<name>`; `useTheme` giving `{ fontScale: 1, colors: {…} }`; `TextLink` as a `Pressable` with `accessibilityRole="button"`, `accessibilityLabel={title}` and a child `Text` with `{title}`;
  - `../../../modules/kitted-location` (from MorningCard's folder; from `src/__tests__` it's `../../modules/kitted-location`): `weatherKitLegalUrl`;
  - `react-native`'s `Linking.openURL`.

**testIDs:** `wx-line` (the weather line), `wx-apple-mark` (Apple's mark), `wx-data-sources` (the wrapper around the "Data sources" link). The existing `TextLink` takes no `testID`, hence the wrapper.

**Demo screens:**
- No new screen. By design every demo screen shows sample weather (`chooseWeatherKind`), never Apple's mark.
- Existing **demo screen 12** (Stylist home, `coldRain`, allowed) shows the card with sample weather. It is the must-not screen: no mark, no `Data sources`, `Sample` shown.
- Apple's mark shows only in the live app, launched with no demo screen: `-seed full`, Debug, with a Metro whose config has the switch on.

**Built-app evidence (shell):**
- `app/ios/Kitted/Kitted.entitlements` after prebuild;
- `codesign -d --entitlements - --xml <Kitted.app>` on the built Simulator app;
- `npm run check:app -- <Kitted.app> --paid`, valid only on a **Release** build. A Debug build fails its dev-launcher checks by design; for Debug read the entitlements with `codesign` directly.

## Data
- No stored field changes.
- The built app's Info.plist gets the new `NSLocationWhenInUseUsageDescription`, and its signature gets the four entitlements.
- Nothing about where the coordinate goes changes:
  - it is rounded to 2 decimals;
  - it is held in memory only;
  - it goes to Apple Weather, or to NWS when Apple's service fails.

  The daily idea row stores the forecast (temperatures, chances, condition, `source`, `fetchedAt`), never a coordinate. No migration.

## Steps
1. **Before starting:** `top -l 1 | grep PhysMem`. The Mac is very low on memory. Run no heavy job (an iOS build, a Simulator boot, `npm run check`, a second Metro) while another one runs.
2. **Edit `app/app.config.ts`:** only the `APPLE` block and the two comments named under Files. `git diff app/app.config.ts` must show nothing else.
3. **Run the tests:** the test writer's `t80AppleWeather.test.tsx` and the changed `approvalDay.test.ts` (`npx jest --watchman=false <files>`). Then `npm run check -- --no-watchman` in `app/`, alone. Commit.
4. **Prebuild in the worktree:**
   - `cd app && LANG=en_US.UTF-8 npx expo prebuild --platform ios --no-install`.
   - Confirm `ios/Kitted/Kitted.entitlements` lists the four keys, and that `ios/Kitted.xcodeproj/project.pbxproj` has `DEVELOPMENT_TEAM = 6652QVRQAL` and `CODE_SIGN_ENTITLEMENTS = Kitted/Kitted.entitlements`.
   - Confirm `ios/Kitted/Info.plist` has the new location string.
5. **Pods without a download (as #366/§27 A5 did):**
   - Clone the main checkout's Pods by APFS copy: `cp -Rc /Users/eyu/Desktop/files/Kitted/app/ios/Pods app/ios/Pods`, and the same for `Podfile.lock`. `app/node_modules` is a symlink to the main checkout's, so the paths match.
   - If the build says the sandbox is out of sync and `pod install` would fetch anything, **stop and ask the coordinator**. That is a download.
6. **Build, alone:** `LANG=en_US.UTF-8 npx expo run:ios --device <simulator UDID> --no-bundler`. Always the UDID.
   - **Which Simulator:** the main `111D0A09-C2CA-4F72-BF3C-44019A05C89D` is in another session's use. Default: if `xcrun simctl list devices booted` shows only one booted, boot one second iPhone (any but `EF7ADF2A`) after the build is done, install there, and shut it down at the end. If two are already booted, wait.
   - **If signing fails** (for example "requires a provisioning profile" for the Simulator), stop and report the exact error. Don't change signing settings.
7. **Read the entitlements:** `codesign -d --entitlements - --xml` on the built app (`app/ios/build/…/Debug-iphonesimulator/Kitted.app`). They must list the four keys. If the signature is empty (Xcode can embed Simulator entitlements in the binary's `__entitlements` section instead), read that section and say which one you read.
8. **A Metro on this worktree** (port 8082, its own cache, the main checkout's `node_modules` in `watchFolders`, a temporary uncommitted `metro.config.js`; 15-build-notes, #296 and #377).
   - Why: in Debug, `extra.applePaid` comes from the Metro that serves the bundle. The other session's Metro on 8081 serves the main checkout's config, where the switch is off, so the app would use NWS.
   - Point the dev launcher at `http://localhost:8082` with "Enter URL manually", or with the Simulator tool's `open_url` and a tap on its prompt. Not `simctl openurl` from a script (CLAUDE.md).
9. **The Simulator check** (TESTING.md → T80.D and the UI inventory):
   - set the location (`xcrun simctl location <udid> set 42.3398,-71.0892`);
   - launch `-seed full -theme light`;
   - Stylist → the card → Allow → the iOS prompt (screenshot) → Allow While Using App;
   - the weather line with the mark and `Data sources`; tap `Data sources`;
   - dark, then the largest text size (`xcrun simctl ui <udid> content_size accessibility-extra-extra-extra-large`, and back after);
   - `maestro --device <udid> hierarchy` for the VoiceOver labels;
   - the Metro log;
   - the app's data searched for the coordinate.
10. **If the founder's portal step isn't done yet:** do step 9 anyway. It then proves the fallback: NWS weather, no mark, and the log line `[weather] weatherkit failed; NWS instead` or `weatherkit gave nothing`. Leave T80.D "not verified", with to-do F-1.
11. **Clean up:**
    - shut down any Simulator you booted;
    - stop the 8082 Metro and delete the temporary `metro.config.js`;
    - put the content size back;
    - leave the main Simulator's app as it was. Don't install on it unless the coordinator says so.
12. **Write REPORT.md.** Update `plan.md` (T80's line only, plus the founder's to-dos below) and add a DECISIONS-LOG entry (the team ID, the switch on, the lane deviation, the lessons).

## Must not break
- **The off path stays exactly as before.** `appleSettings({ paid: false })` gives the free team, no entitlements, the NWS string and `applePaid: false`. With `applePaid` false the native WeatherKit call is never made (S3).
- **NWS keeps working as is:** `nwsWeather.test.ts` and `approvalDay.test.ts` W1–W4 stay green and unchanged.
- **Demo screens keep sample weather,** labelled `Sample`, with no Apple mark. The screenshots don't change.
- **The privacy manifest is unchanged:** CoarseLocation, not linked, app functionality (P1, P2).
- `requireFirebaseKey` (A2) and `check:app` (A3) stay as they are.
- **No score, outfit pick or copy changes.** The only visible changes are the location prompt's words (the founder's, Y20) and, with WeatherKit's data, the mark already built (W5).
- **The notifications plugin can merge.** `expo-notifications` adds `aps-environment` through its own mod, which merges with `ios.entitlements`. Leave no conflict marker or reordering in `app.config.ts` that blocks the other session's hunk.
- `npm run check` stays green. `npm run guard:release` passes (run it with the main checkout's `app/.env*` linked in for the run, then removed, as in #404).

## Open questions
**For the founder:**
- **F-1 · The portal step (to-do; P1; about 10 minutes plus a wait of up to 30 minutes; unblocks T80.D, and T85's next build).** developer.apple.com → Account → Certificates, Identifiers & Profiles → Identifiers → `com.trykitted.kitted` →
  - **Capabilities** tab: tick **WeatherKit**, **App Attest**, **Sign in with Apple** (Enable as a primary App ID) and **Declared Age Range**;
  - **App Services** tab: tick **WeatherKit**;
  - **Save**, then **Confirm** when it warns that profiles become invalid.

  #403 says the App ID was made by Xcode ("Xcode-managed"). If the portal won't let him edit it, the fallback is EAS's capability sync on the next EAS build, plus the App Services tick by hand. Claude can't sign in there. Default meanwhile: T80 ships, with T80.D "not verified" and the fallback proven.
- **F-2 · Apple's attribution beyond the card.** Apple's rule (developer.apple.com/weatherkit/get-started, "Attribution requirements"): an app that displays any of Apple's weather data must show the Apple Weather mark ( Weather) and the legal link to other data sources. Derived data ("value-added") must be attributed to " Weather" with a notice that the data was modified. Today the mark shows only on the card. It doesn't show on:
  - (a) the fit-check card's `Weather` tip line (for example "Rain after 6 pm: suede and rain don't mix."), which is derived from the card's stored weather;
  - (b) Kit's answers. `ask/context.ts` sends "Weather today: 52° now · 63° high …" to the AI, and Kit can repeat the numbers.

  Both are outside this lane and need words. Also open: whether Apple's WeatherKit terms allow passing WeatherKit's numbers to OpenAI at all. Claude can read the Developer Program License Agreement's WeatherKit section and report. Recommended:
  - a follow-up task in the morning, fit-check and stylist lanes that adds " Weather" (and Apple's "modified" notice, worded with the founder) to the tip line and under any Kit answer that quotes the weather;
  - the DPLA read before the build that goes to outside testers or App Review.

  Default meanwhile: the card's mark only, logged as a known gap. The internal TestFlight build isn't reviewed.
- **F-3 · A TestFlight build with T80 (T85).** That's an EAS build (the founder's OK and his Apple login). Ask after T80 merges; don't build in this task.
- **F-4 · The phone's dev install** (`tools/phone/install.sh`) breaks once the switch is on, until Xcode has his paid account (Xcode → Settings → Accounts) and makes a development profile with the four capabilities. Recommended: accept it, and use TestFlight builds on his phone. Default: accept; log it.

**Technical defaults (the coordinator logs them):**
- **T-1 · The team ID is `6652QVRQAL`.** The evidence: the Mac's "Apple Development" certificate (OU=6652QVRQAL), and the App Store upload in #404 with `appleTeamId: 6652QVRQAL`, which only a paid team can make. `FREE_TEAM_ID` has the same value. Its name is now misleading, but it sits outside the `APPLE` block; rename it in a later pass, not here.
- **T-2 · The lane deviation.** Export `WeatherLine` and add three testIDs in `MorningCard.tsx` (morning lane, same session), so the mark has a behaviour test rather than only the existing source-text W5 test. Default: allowed, with no visible change. If refused, W5 is checked by the Simulator screenshots and the hierarchy only, and stays "not verified" as a behaviour test.
- **T-3 · The S1 test change** in `approvalDay.test.ts`: it asserted the off state as the committed default. See Files. Logged as a criterion change, not a weakening.
- **T-4 · Which Simulator:** a second one, booted after the build, shut down after (step 6). Never two heavy jobs at once.
- **T-5 · WeatherKit's time limit versus the card's.**
  - WeatherKit's own limit is 6 s (location fix included). NWS then gets what's left of the card's 7 s.
  - If WeatherKit fails slowly (more than about 1 s after the fix), NWS may not answer in time. The card then shows the season line, not NWS weather.
  - Default: keep the limits. Measure on the Simulator how fast the refused call fails (step 10) and record it. Only if it's slow, propose a shorter WeatherKit limit as a follow-up (`services/weather` isn't in this lane).
- **T-6 · VoiceOver hears "Weather: Apple Weather" twice:** the line's label ends with it, and the mark's label is the same. That's §27 W5 as specced. Kept, noted.
- **T-7 · "The server lock's entitlement" on the plan line** means only App Attest's entitlement. App Check itself (the package, the server's `enforceAppCheck`) is T23.

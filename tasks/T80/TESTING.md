# T80 · Testing contract

> **Parked, Nov 9 (the founder, in chat: use the US weather service for now; Apple's weather is a task for later,
> "probably migrating sometime soon").** Never built. This plan switches WeatherKit on as built, and that would break
> Apple's terms (DECISIONS-LOG #414): the card stores its forecast for good, Apple's mark shows only on the card, and Kit
> sends the numbers to OpenAI. When T80 restarts, re-plan from here with #414's rules. The per-build table, the portal
> steps (F-1) and the traps (Metro's `applePaid`, `check:app` on Debug) still hold. TESTING.md was never locked.


Written by the planner; tests written and locked by the test writer. **Locked once the lock line below is filled.** After that only a test-writer agent changes this file or the tests, only to add or strengthen, with the reason in REPORT.md. Results never go here; they go in REPORT.md.

**Lock:** `<commit SHA>` · <date> · tests: `app/src/__tests__/t80AppleWeather.test.tsx`, `app/src/__tests__/approvalDay.test.ts` (S1 changed: see S1), `app/e2e/flows/T80-sample-weather-no-mark.yaml`

**Plan-line criteria:** the T80 line has no `checks:`. Its done line is "Apple's weather on the Simulator", here **T80.D**. The other criteria are the spec lines and the §27 checks this task switches on:

| ID | Where it comes from |
|---|---|
| S1, S2, S3 | `handoff/09-ui-review.md` §27, the switch |
| W2 + F6.1 | `specs.md` F6.1 and the Data table → Location |
| W3 | `specs.md` Constraints → Weather, NWS as the fallback |
| W4 | §27 |
| W5 | §27, Apple's attribution |
| N | §27, nothing else moves |

That makes 9 IDs: T80.D, S1, S2, S3, W2+F6.1, W3, W4, W5, N. Every one is below.

**Shared set-up for the app tests:**
- the coordinate is `{ latitude: 42.3398, longitude: -71.0892 }`, which `round2` makes `42.34, -71.09`;
- the WeatherKit hours are `asWeatherKit(P(coldRain))`, as in `approvalDay.test.ts`, from `fixtures/nws/hourly-cold-rain.json`;
- the clock is a manual clock in America/New_York at `2026-11-09T08:00` (a day card), unless said otherwise;
- "the switch on" means the config evaluated as committed. Since T80, `APPLE.paid` is `true` in the file.

## Criteria

- **S1** · Off (the switch's other side), unchanged: the free path's team, no entitlements, the NWS location string, `applePaid` false, and no WeatherKit call.
  - **how:** unit (pure function). This replaces the old S1, which asserted that the *committed* config was off (see REPORT.md: the criterion changed, not a weakening).
  - **test:** `approvalDay.test.ts` › `S1 off: appleSettings({ paid: false }) gives the free team, no entitlements, the NWS string, applePaid false`.
  - **expect:** `appleSettings({ paid: false, teamId: '' }, undefined)` deep-equals:

    ```
    { teamId: '6652QVRQAL', entitlements: {},
      locationUsage: "Kitted uses your approximate location to get today's weather for your outfit idea. It goes only to the US National Weather Service and is never stored.",
      applePaid: false }
    ```

    The same for `'production'` and `'development'`. `weatherKitFirst({ applePaid: false, weatherKitAvailable: true })` is `false`.
  - **must not:** any entitlement key with `paid: false`. The old source-text regex (`paid: false` in the file) must be gone: no test reads `app.config.ts` as text for S1.
  - **edges:** none.
  - **red:** exists. It bites via a deliberate bug: return the paid entitlements when `paid` is false → `Expected {}`.

- **S2** · On: the team is `6652QVRQAL`, the four entitlements (App Attest by build profile), the location string naming Apple Weather, `extra.applePaid` true. The built app carries them.
  - **how:** unit (the config evaluated with `loadConfig`), plus a Simulator state check of the built app.
  - **test:** `t80AppleWeather.test.tsx` ›
    - `S2 · the committed config is on: team 6652QVRQAL, the four entitlements, Apple Weather's words, applePaid true`;
    - `S2 · App Attest's environment follows the EAS profile`;
    - `S2 · a paid switch with a bad team ID is refused`.
  - **expect:**
    - `loadConfig({ EAS_BUILD_PROFILE: undefined }).default`:
      - `ios.appleTeamId` is `'6652QVRQAL'`;
      - `ios.entitlements` deep-equals the block below;
      - `ios.infoPlist.NSLocationWhenInUseUsageDescription` is exactly `Kitted uses your approximate location to get today's weather for your outfit idea. It goes only to Apple Weather (or the US National Weather Service if that's down) and is never stored.`;
      - `ios.infoPlist.NSLocationDefaultAccuracyReduced` is `true`;
      - `extra.applePaid` is `true`.

      ```
      { 'com.apple.developer.declared-age-range': true,
        'com.apple.developer.devicecheck.appattest-environment': 'production',
        'com.apple.developer.weatherkit': true,
        'com.apple.developer.applesignin': ['Default'] }
      ```

    - With `EAS_BUILD_PROFILE: 'development'`, the App Attest value is `'development'`. With `'preview'` and `'production'` (and a Firebase key set, so A2 lets it load), it is `'production'`.
    - `appleSettings({ paid: true, teamId: '' })` and `({ paid: true, teamId: '6652qvrqal' })` throw `/teamId/`.
    - **Simulator state:** after prebuild, `app/ios/Kitted/Kitted.entitlements` has exactly those four keys. `codesign -d --entitlements - --xml` on the built Simulator `Kitted.app` lists them (or its `__entitlements` section does; REPORT.md says which). The built `Info.plist` has the string above.
  - **must not:**
    - no fifth key from this config (another plugin's `aps-environment` added in a later build is allowed only through that plugin's mod, not `ios.entitlements`);
    - no `'development'` App Attest value on `preview` or `production`;
    - no team other than `6652QVRQAL`;
    - the location string never says "precise", never names Google or OpenAI, and never drops "is never stored".
  - **edges:** a store build without the Firebase key is still refused (A2, unchanged).
  - **red:** before the flip, `Expected "6652QVRQAL"` passes but `ios.entitlements` gives `Expected {…four keys} Received {}`, and `extra.applePaid` gives `Expected true Received false`.

- **S3** · The app's JS turns Apple Weather on only from `extra.applePaid`. With it true and the native call present, the live weather asks WeatherKit first; with it false, WeatherKit is never asked.
  - **how:** unit (`@/services/weather` loaded under `jest.isolateModules` with the mocks in IMPLEMENTATION.md → Interfaces).
  - **test:** `t80AppleWeather.test.tsx` ›
    - `S3 · applePaid true: the live forecast comes from WeatherKit, tagged weatherkit`;
    - `S3 · applePaid false (or missing, or "true" as a string): WeatherKit is never called, NWS answers`;
    - `S3 · no WeatherKit call in this build (weatherKitAvailable false): NWS answers`.
  - **expect:**
    - `expo-constants` `extra.applePaid: true`, `weatherKitAvailable: true`, permission `'granted'`:
      - `weatherSource.kind` is `'live'`;
      - `await weatherSource.forecast('day')` has `source: 'weatherkit'`;
      - `weatherKitHourly` is called once, with `(42.34, -71.09)`;
      - `fetch` is not called.
    - With `applePaid` `false`, `undefined` or `'true'`: `weatherKitHourly` is called 0 times, `fetch` is called against `api.weather.gov`, and the result has `source: 'nws'`.
    - With `weatherKitAvailable: false`: the same as off.
  - **must not:** WeatherKit called while the switch is off; a demo screen (`DEMO_ENABLED` true and `demoScreen: 25`) getting live weather. On a demo screen, `kind` is `'sample'` and neither `weatherKitHourly` nor `fetch` is called.
  - **edges:** none beyond W3.
  - **red:** exists (#366 wired it). It bites via a deliberate bug: `weatherKitFirst` returning `o.applePaid` alone → the `weatherKitAvailable: false` test calls `weatherKitHourly`; or returning `false` → `Expected "weatherkit" Received "nws"`.

- **W2 + F6.1** · Location is approximate, asked inside the card, and never stored. It goes only to Apple Weather (or NWS when Apple's fails). Declined, the card uses the season.
  - **how:** unit (the morning service with a memory store and the real `createWeatherKitSource` over fakes), plus the Simulator state check (the prompt, and the app's data searched).
  - **test:** `t80AppleWeather.test.tsx` ›
    - `F6.1 · with Apple Weather the card's stored rows hold no coordinate`;
    - `F6.1 · declined: no WeatherKit call, no NWS call, the card shows the season`;
    - `F6.1 · not asked yet: the card asks inside itself; nothing is fetched before Allow`.
  - **expect:**
    - **Granted:** `createMorningService({ store, clock, weather: <a WeatherKit source over the fakes, fallback a spy NWS> })`, then `ensureCard()`:
      - the day row's `weather` has `source: 'weatherkit'` and a number `fetchedAt`;
      - `JSON.stringify` of every table in the memory store and every KV value contains none of `42.3398`, `42.34`, `-71.0892`, `-71.09`, `latitude` or `longitude`;
      - `weatherKitHourly` got `(42.34, -71.09)`, never the unrounded values.
    - **Denied:** `weatherKitHourly` 0 calls, NWS `forecast` 0 calls, the row's `weather` is `null`, and `seasonLine(11)` is `November: bring a layer.`
    - **Not asked** (`permission` `'unknown'`): no fetch of any kind before `requestPermission`. `locationRow({ permission: 'unknown', hasWeather: false, sourceKind: 'live' })` is `'ask'`, and after `'denied'` it's `'settings'`.
    - **Simulator state:**
      - tapping `Allow` on `Use your local weather?` shows the iOS prompt with exactly S2's string and the approximate-location map ("Precise: Off");
      - after Allow While Using App and the card's weather, the app's data container (its SQLite files and `Library/Preferences`) searched with `grep -r` has no `42.33`, `42.34`, `-71.08` or `-71.09`.
  - **must not:**
    - a coordinate in any stored row, KV or log line (the `[weather]` log lines name no numbers);
    - a forecast fetched before he taps Allow;
    - the prompt shown anywhere but from the card (not at launch, not in setup).
  - **edges:**
    - **Wipe or reinstall:** there's nothing of the location to wipe. After `xcrun simctl privacy <udid> reset location com.trykitted.kitted` and a relaunch, the card shows `Use your local weather?` again (Simulator state).
    - **Offline:** no weather, the season line, nothing stored.
  - **red:** the stored-rows test exists in substance (#58, #366). It bites via a deliberate bug: add `lat: c.latitude` to the forecast in `weatherkit.ts` → the `42.34` search fails. The denied and not-asked tests: exists, bites via the morning service fetching without permission.

- **W3** · Any WeatherKit failure falls back to NWS, whose answer is used as is: no entitlement or App Service (the real case until F-1), an error, an empty forecast, no answer in time, and no module.
  - **how:** unit (existing, plus a new test for the time limit against the card's 7 s), plus a Simulator state check while the portal step is still undone.
  - **test:** `approvalDay.test.ts` › `W3 every failure falls back to NWS, whose answer is used as is` (existing, unchanged); `t80AppleWeather.test.tsx` › `W3 · WeatherKit hangs: NWS answering in 500 ms still reaches the card inside its 7 s` (fake timers through `createMorningService`).
  - **expect:**
    - Each failure gives `source: 'nws'`, deep-equal to NWS's own answer for the same window.
    - **Hang:** `weatherKitHourly` never resolves and NWS resolves 500 ms after it's asked. Then `ensureCard()` stores `weather.source === 'nws'`, with the WeatherKit limit at 6 000 ms and the card's at 7 000 ms.
    - **Simulator state, before F-1:** the card shows the NWS line with no ` Weather` and no `Data sources`. The 8082 Metro log has `[weather] weatherkit failed; NWS instead` or `[weather] weatherkit gave nothing; NWS instead`. REPORT.md records how many ms the refused call took (T-5).
  - **must not:**
    - a WeatherKit failure that leaves no weather when NWS answered within the card's limit;
    - a failure shown to him as an error;
    - the mark shown on NWS data.
  - **edges:**
    - **A failure mid-way:** WeatherKit answers after its 6 s limit → ignored; NWS is used, and the late answer isn't cached as the day's.
    - **Offline:** both fail → `null`, the season line.
  - **red:** the existing W3 passes (exists). It bites via a deliberate bug: `forecast` returning `null` instead of `o.fallback.forecast(window)`. The hang test should pass as built (6.5 s < 7 s). It bites via the same bug, or a WeatherKit limit set to 7 000.

- **W4** · Cached an hour, one request at a time; permission and the prompt go through the same location module.
  - **how:** unit (existing).
  - **test:** `approvalDay.test.ts` › `W4 cached an hour, one request at a time; no permission → NWS (which says no weather), WeatherKit never asked` (unchanged).
  - **expect:** as committed: 2 concurrent forecasts → 1 WeatherKit call; another at +59 min → still 1; at +61 min → 2.
  - **must not:** a second request while one is in flight; WeatherKit asked without permission.
  - **edges:**
    - **The 4 am day change:** a WeatherKit answer cached at 3:30 am serves the 4 am day card, re-windowed by `mapHourly` with the new `now` (covered by W1's same-forecast-both-ways test).
    - Apple's free allowance is 500,000 calls a month per membership. With the hour's cache that's far off; noted, not tested.
  - **red:** exists. It bites via a deliberate bug: `cacheMs: 0`.

- **W5** · The card treats both sources as live weather (no "Sample"). With WeatherKit's data it shows Apple's mark (the Apple logo + `Weather`) and a `Data sources` link to Apple's legal page, and VoiceOver says `Weather: Apple Weather`. With NWS's or sample data, no mark.
  - **how:** component (`WeatherLine`, exported from `MorningCard.tsx` per T-2), plus a flow for the sample screens, plus a Simulator state check for the live card. If T-2 is refused, the component part is "not verified" (see Not testable yet).
  - **test:** `t80AppleWeather.test.tsx` ›
    - `W5 · WeatherKit's weather shows Apple's mark and Data sources`;
    - `W5 · Data sources opens WeatherKit's legal page, else Apple's own`;
    - `W5 · NWS weather: no mark, VoiceOver names the National Weather Service`;
    - `W5 · sample weather: "Sample", no mark`;
    - `W5 · the mark follows the stored weather's source, not the switch`.

    Flow: `T80-sample-weather-no-mark.yaml`.
  - **expect:**
    - **`source: 'weatherkit'`:**
      - `wx-line` has `accessibilityLabel` `` `${weatherLine(w, hour)}. Weather: Apple Weather` ``;
      - `wx-apple-mark` exists, with `accessibilityLabel` `Weather: Apple Weather`, `icon:apple.logo` and the text `Weather` inside it;
      - `wx-data-sources` holds a button labelled `Data sources`;
      - no text `Sample`.
    - **Press `Data sources`:**
      - with `weatherKitLegalUrl` resolving `https://weatherkit.apple.com/legal-attribution.html?x=1` → `Linking.openURL` is called once with that URL;
      - resolving `null` → once with `https://weatherkit.apple.com/legal-attribution.html`.
    - **`source: 'nws'`:** the label ends `. Weather: National Weather Service`; no `wx-apple-mark`, no `wx-data-sources`, no `Data sources`, no `Sample`.
    - **No source (sample):** the label ends `. Sample weather`; the visible text includes `Sample`; no mark.
    - **A stored NWS card** (made before T80) renders without the mark even with the switch on. Only `w.source` decides.
    - **The flow** (8081 or 8082 Metro, either switch state):
      - demo screen 25, light → `Stylist` visible, then `.*Sample.*` visible, `Data sources` not visible, `.*Apple Weather.*` not visible;
      - demo screen 30 (the evening card) → the same.
    - **Simulator state** (live, after F-1):
      - under the weather line: the Apple logo, `Weather` and `Data sources`;
      - tapping `Data sources` opens Safari on Apple's legal attribution page;
      - `maestro hierarchy` shows the two labels above;
      - light, dark and the largest text size: the row wraps, with nothing cut off or overlapping.
  - **must not:**
    - the mark on NWS or sample data;
    - `Sample` on live data;
    - a `Data sources` link that opens anything but an `https://` Apple page (a non-https native URL falls back to the constant).
  - **edges:**
    - **Offline after a WeatherKit card:** the stored line and mark stay; tapping `Data sources` offline opens Safari's own offline page (no app error).
    - **The 4 am change:** the new day's card carries whatever source answered then.
  - **red:** `WeatherLine` isn't exported today → `TypeError: … is not a function` (or `undefined` component) on every W5 component test. After the export, without the testIDs → `Unable to find an element with testID: wx-apple-mark`. The flow should pass as built. It bites via a deliberate bug: render `<AppleWeatherMark />` for any live weather and open demo 25 with `-demoWeather` cleared. If the flow can't be made to bite against sample screens, REPORT.md says so.

- **T80.D** · Apple's weather on the Simulator: the card's weather comes from WeatherKit, in a build with the switch on.
  - **how:** Simulator state (manual, the steps in IMPLEMENTATION.md → Steps 4–11).
  - **test:** none automated. Apple's live service on every later task would make a flaky flow, so the done line is a recorded Simulator check. Screenshots go in `screenshots/t80/` (git-ignored); REPORT.md quotes what's on screen.
  - **expect:**
    - Debug build from this worktree, Metro on 8082 (switch on), Simulator location `42.3398,-71.0892`, launched `-seed full -theme light`, F-1 done 30+ minutes earlier.
    - Stylist shows the day card (or the evening card after 5 pm). Its first lines are `Morning.` (or `Afternoon.` / `Evening. Heading out?`), then the weather line (`{t}° now` …), then the Apple logo, `Weather`, `Data sources`.
    - The 8082 Metro log has no `[weather] weatherkit failed` and no `weatherkit gave nothing` for that fetch.
    - The line's temperature is within a few degrees of Apple's Weather app for the same place and hour (a sanity check, not a gate).
    - Dark and the largest text size: the same elements, all readable.
  - **must not:**
    - the mark on a card whose weather came from NWS (if the log shows the fallback, T80.D isn't met: record W3's pass instead);
    - the run on the main Simulator without the coordinator's say-so;
    - a commit of `app/ios/` or the temporary `metro.config.js`.
  - **edges:**
    - **The portal step not done:** T80.D is "not verified" and W3's Simulator half passes instead.
    - **Offline Simulator:** the season line.
    - **After `privacy reset location`:** the ask row returns.
  - **red:** not applicable (manual). Before the flip, the same steps give the NWS line with no mark, which is the before picture for REPORT.md.

- **N** · Nothing else moves: no score, outfit pick, copy or Debug behaviour change beyond the location prompt's words. Checks are green.
  - **how:** unit (the whole suite), launch-bar style command checks, and the flow above.
  - **test:** `npm run check -- --no-watchman` in `app/` (core + app); `npm run guard:release` (with the main checkout's `app/.env*` linked in for the run and removed, #404); `maestro --device <udid> test app/e2e/flows/` (smoke, T14's flow and T80's).
  - **expect:**
    - all green;
    - `git diff main -- app/app.config.ts` shows only the `APPLE` block and the two comments;
    - `en.ts`, `@kitted/core`, `extraction-test/` and the parity fixtures are untouched;
    - `approvalDay.test.ts` P1, P2, A1–A3, W1–W4 and K1–K2 are unchanged.
  - **must not:**
    - any edit to a fixture or parity file;
    - any change to `LOCATION_USAGE_PAID`'s words;
    - a new package;
    - an EAS build;
    - a change to the `plugins` array (the other session's hunk).
  - **edges:** none.
  - **red:** not applicable (a guard).

## UI inventory
Every visible element, per state. Anything on screen that isn't here is a defect; anything here that isn't on screen is a defect. The card's other parts (the occasion and style menus, the strip, Wear this, Swap one, "Wearing something else? Check it") are unchanged by T80 and aren't listed. Light, dark and the largest text size for each state.

### Card · Apple Weather · live only (no demo screen: demo screens always use sample weather) · light, dark, largest text
- Headline · `Morning.` (before noon) / `Afternoon.` / `Evening. Heading out?` · VoiceOver: the same · testID none (unchanged).
- Weather symbol (SF Symbol for the condition, 14 pt, scales with text) + footnote line, for example `46° now · 63° by 3 pm · rain after 5 pm` (`wx.card.*`; built by `weatherLine`) · VoiceOver (one element): `<the line>. Weather: Apple Weather` · testID `wx-line`.
- Apple logo (SF Symbol `apple.logo`, 12 pt, ink3) + caption `Weather` · VoiceOver (one element): `Weather: Apple Weather` · testID `wx-apple-mark`.
- Text link · `Data sources` · VoiceOver: `Data sources`, button · testID `wx-data-sources` (wrapper) · opens WeatherKit's legal attribution page in Safari.
- Not present: `Sample`, `Use your local weather?`, `Turn on local weather`.

### Card · National Weather Service (the fallback) · live only · light, dark, largest text
- Headline as above.
- Weather symbol + the line · VoiceOver: `<the line>. Weather: National Weather Service` · testID `wx-line`.
- Not present: the Apple logo, `Weather` caption, `Data sources`, `Sample`.

### Card · sample weather · demo screens 25 (morning), 30 (evening), 32 (hot) · light, dark, largest text (unchanged)
- Headline · `Morning.` / `Evening. Heading out?`.
- Weather symbol + the line + `  Sample` (ink3) · VoiceOver: `<the line>. Sample weather` · testID `wx-line`.
- Not present: the Apple logo, `Data sources`.

### Card · location not asked yet · live (and demo screen 31 with sample weather) · light, dark, largest text (unchanged)
- Headline; the season line instead of weather, for example `November: bring a layer.` (none in a mild month).
- Row: location icon; subheadline `Use your local weather?`; footnote `Your rough location only. It isn't stored.`; link `Allow` · VoiceOver: each as written; `Allow`, button · testID none (unchanged).

### iOS location prompt · live only (system alert, after `Allow`) · light, dark, largest text
- The system's title and buttons (Apple's words, not ours): the "Allow … to use your location?" title, the map with `Precise: Off`, `Allow Once`, `Allow While Using App`, `Don't Allow`.
- Our body text, exactly: `Kitted uses your approximate location to get today's weather for your outfit idea. It goes only to Apple Weather (or the US National Weather Service if that's down) and is never stored.`

### Card · location declined · live · light, dark, largest text (unchanged)
- Headline; the season line (for example `November: bring a layer.`).
- Link · `Turn on local weather` · VoiceOver: `Turn on local weather`, hint `Opens Settings, where you can let Kitted use your approximate location.` · testID none (unchanged).

## Not testable yet
Never dropped, never counted as pass.
- **T80.D** (and W5's live half: the mark on a real WeatherKit answer, the legal page opening):
  - why: WeatherKit answers only once the App ID has WeatherKit under Capabilities and App Services, and only the founder can sign in to the developer portal;
  - would verify it: the founder's to-do F-1 (IMPLEMENTATION.md → Open questions; about 10 minutes plus up to 30 minutes' wait), then IMPLEMENTATION.md Steps 6–11.
- **W5's component half, if T-2 is refused:**
  - why: `WeatherLine` is private to `MorningCard.tsx` (outside this lane);
  - would verify it: the coordinator's OK for the export and testIDs; meanwhile the existing source-text W5 test and the Simulator screenshots.
- **The four entitlements on a device and in an EAS build** (S2 beyond the Simulator):
  - why: a device build needs a development profile with the four capabilities (the founder's Apple account in Xcode), and an EAS build needs the founder's OK;
  - would verify it: F-3 (the next TestFlight build, then `npm run check:app -- Payload/Kitted.app --paid` on the unzipped `.ipa`) and F-4.
- **Apple's attribution on the fit-check card's weather tip and in Kit's answers:**
  - why: not built, outside this lane, and it needs the founder's words (F-2);
  - would verify it: a follow-up task after F-2's answer.

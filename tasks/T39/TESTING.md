# T39 · Testing contract

Written by the planner; tests written and locked by the test writer. **Locked once the lock line below is filled.** After that only a test-writer agent changes this file or the tests, only to add or strengthen, with the reason in REPORT.md. Results never go here; they go in REPORT.md.

**Lock:** `<commit SHA>` · <date> · tests: `<path>`, `<path>`

Plan-line criteria: OS3, OS4, OS5, F1.1–F1.3, SY4.1–SY4.2, SY4.4 → **OS3.1, OS3.2, OS3.3, OS4.1, OS4.2, OS4.3, OS4.4, OS4.5, OS4.6, OS4.7, OS5.1, OS5.2, OS5.3, OS5.4, OS5.5, OS5.6, OS5.7, F1.1, F1.2, F1.3, SY4.1, SY4.2, SY4.4** (23). All 23 are below.

**Shared set-up**
- Suggested files: `app/src/__tests__/T39-aboutStep.test.ts` (pure and store-level), `T39-setupScreens.test.tsx` (Looks, About you, Restore, Welcome and the Example check for OS4.5, OnboardingNav), `T39-offerCard.test.tsx` (the card, the thread row, the camera's agreement), `T39-styleProfile.test.tsx`, `T39-noLeak.test.ts` (every request builder and sync); shared render mocks in `app/src/testing/t39ScreenMocks.tsx` (may import T38's `t38ScreenMocks.tsx`); flows `app/e2e/flows/T39-setup-fresh.yaml`, `T39-setup-not-now.yaml`, `T39-setup-later.yaml`, `T39-under-18.yaml`, `T39-screens.yaml`. Every test name starts with its criterion ID.
- *Render tests:* `@testing-library/react-native`, as T38's set-up: the design system mocked to plain `Text`/`View`/`Pressable` passing props through (`KButton` → a `Pressable` with its `title` as text and its `accessibilityLabel`, `accessibilityHint` and `disabled` passed through; `StylistMessage` and `UserBubble` → **counted markers**; `KText` → `Text` passing `accessibilityRole`, `testID`, `weight`, `variant`); `expo-router` (`router.push`/`replace`/`back`/`canGoBack` as `jest.fn`, `useLocalSearchParams` from the test, `useFocusEffect` runs its callback, `Redirect` renders a marker with its `href`, `useNavigation` gives a `beforeRemove` listener the test can fire); `expo-haptics` (`jest.fn`s); `react-native`'s `Alert.alert` spied; `@/data/db` → a fresh `createMemoryStore()` per test; `@/data/secure` → an in-memory Keychain (`setAgeBlocked`, `getAgeBlocked`); `react-native-safe-area-context` (top 62, bottom 34); `useTheme` from the test (`scheme`, `isAccessibilitySize`). `global.fetch` is a `jest.fn` that fails the test when called. `sessionClock` fixed at T0 = 2026-10-22 07:41 New York (`now().getFullYear()` = 2026). `newId` gives `M-1`, `M-2`, ….
- *"Nothing sent"* means: `global.fetch` never called, and a recording `AiTransport` installed in place of the app's live one (`@/services/server`'s transport factory mocked) never called.
- Queries include VoiceOver-hidden elements (`defaultIncludeHiddenElements: true`); hiding is checked with `isHiddenFromAccessibility`.
- *Flows* (Maestro, `maestro --device <udid> test app/e2e/flows/T39-*.yaml`, Metro running). The fresh-install flows start with `launchApp: { clearState: true, clearKeychain: true, permissions: { camera: allow } }` and **no demo arguments** (a demo screen opens the camera without the agreement), then tap the running server in the development launcher as `open-demo.yaml` does. `T39-under-18.yaml` ends with another `clearState` + `clearKeychain` launch, so the Simulator is never left on the stop screen. Maestro matches an element's whole text or label; a Kit line is one element "Kit: <text>", so it is matched as `.*<text>`.

## Criteria

- **OS3.1** · No setup screen shows a user bubble or a Kit bubble (Welcome, Looks, About you, Restore).
  · how: component + flow
  · test: `T39-setupScreens.test.tsx` › `OS3.1 · Looks, About you (on open and ready), Restore and Welcome render no bubble`; `OS3.1 · the agreement's intro is plain text (camera and sheet)`; flow `T39-setup-fresh.yaml`
  · expect: rendering `PickLooksScreen`, `BasicsScreen` (no params; with the draft `{ age: '22-25', name: 'Alex' }` and looks `['streetwear']`), `BasicsScreen` with `restore=214,38,61`, and `WelcomeScreen` (accounts off and on): the `StylistMessage` and `UserBubble` markers are rendered **0 times** on each; no element's text is "Kit", `t('onb.looks.prompt')` ("Which of these would you actually wear? Tap up to 3."), "Streetwear", "Not sure yet", "Born in …", any `looksReply` line, or `t('acct.restore.basics')`. `ConsentScreen mode="camera"` and `mode="sheet"`: 0 `StylistMessage`; `consent-intro` reads exactly "Before I score a photo, here's what happens to it." Flow: on Looks and About you, `assertNotVisible: "Kit: .*"` and `assertNotVisible: ".*Good pick.*"`.
  · must not: a bubble or the "Kit" mark on any setup screen, including one rendered at opacity 0; the old combined Looks prompt anywhere.
  · edges: dark and accessibility sizes (the same assertions with `scheme: 'dark'` and `isAccessibilitySize: true`); Restore with accounts on.
  · red: 2 tests, both red. `Looks, About you … render no bubble`: Looks draws Kit's bubble (`[light, looks, [1,0,1,0]]` ≠ `[0,0,0,0]`); `the agreement's intro is plain text`: camera mode draws a `StylistMessage` (`[1,0,1,0]`). Flow `T39-setup-fresh.yaml`: flow not yet run (no Simulator this session; red expected: the screens and words it asserts do not exist yet).

- **OS3.2** · Setup is Welcome → Looks → About you → Stylist, with no agreement screen; the progress bar has 3 segments.
  · how: component + unit + flow
  · test: `T39-setupScreens.test.tsx` › `OS3.2 · each step goes to the next and About you ends in Stylist`; `OS3.2 · the bar has 3 segments`; `T39-aboutStep.test.ts` › `OS3.2 · an old agreement step and an old link reopen on About you`; flow `T39-setup-fresh.yaml`
  · expect:
    - Looks `Continue · 1 of 3` (one tile tapped) and `Not sure`: kv `onboarding.step` = `basics`, `router.push('/onboarding/basics')`.
    - About you, `22–25` tapped, Continue: kv `onboarding.done` = `'1'`, `router.replace('/')` once; `router.push` is **never** called with `/onboarding/consent` or any path starting `/camera`, also after advancing fake timers 5000 ms.
    - `ONBOARDING_STEPS` = 3. `OnboardingNav step={2}`: `onb-progress-seg-0`, `-1` filled `ink`, `-2` `line`, no `-3`; `onb-progress` label "Step 2 of 3". `step={3}`: all three `ink`, label "Step 3 of 3". `step={undefined}`: no `onb-progress`.
    - `parseStep('consent')` → `'basics'`; `parseStep('basics')` → `'basics'`; `parseStep('1')` → `'looks'`; `parseStep('nonsense')` → null; `resumeHref(parseStep('consent'))` → `'/onboarding/basics'`. The `/onboarding/consent` route renders a `Redirect` to `/onboarding/basics`.
    - Flow: Welcome → `Get started` → "Which of these would you actually wear?" → `Not sure` → "About you" → `22–25` → `Continue` → "Want to check a fit now?"; `assertNotVisible: "Before your first fit check"` on every step before Stylist.
  · must not: an agreement screen between About you and Stylist; a fourth segment; "Step 4 of 4" or "of 4"; the camera opened by setup.
  · edges: closed mid-setup on the old agreement step (above); closed on About you (OS4.1's edge).
  · red: 4 tests, all red. `each step goes to the next …`: Looks part passes today, About you fails (no `age-22-25`); `the bar has 3 segments`: `ONBOARDING_STEPS` 4 ≠ 3; `T39-aboutStep` › `an old agreement step …`: `parseStep('consent')` → `'consent'` ≠ `'basics'`; added `T39-setupScreens` › `OS3.2 · the old agreement link opens About you` (the route's `Redirect`, moved here from the aboutStep file because it renders): no `redirect` element (the route still renders the old agreement). Flow `T39-setup-fresh.yaml`: flow not yet run (no Simulator this session; red expected: the screens and words it asserts do not exist yet).

- **OS3.3** · Looks shows the new title and line word for word; its tiles and buttons behave as before.
  · how: component + the existing tests
  · test: `T39-setupScreens.test.tsx` › `OS3.3 · the title and the line`; `OS3.3 · the tiles, Something else?, Not sure and Continue behave as before`; `onboardingLooks.test.ts` (unchanged, must pass)
  · expect: `looks-title` text "Which of these would you actually wear?" with `accessibilityRole` `header`; `looks-line` text "Tap up to 3.", directly after it. Tapping two tiles: `Haptics.selectionAsync` twice, Continue reads "Continue · 2 of 3"; a 4th tile after three: `Haptics.notificationAsync(Warning)` once, "Up to 3." shown, picks unchanged; `Not sure` saves `onboarding.looks` = `[]` and pushes `/onboarding/basics`; Continue is disabled with no pick and no words; "Something else?" opens the field (placeholder "Like skater, or all black").
  · must not: the old combined prompt; a Kit bubble; "Pick by name instead" shown (founder question 4, default: not shown).
  · edges: accessibility sizes (one column, as today).
  · red: 2 tests, both red. `the title and the line`: no `looks-title`; `the tiles … behave as before`: red only on Kit's bubble (`[1,0,1,0]`); its tile, haptic, Up to 3., Not sure, Something else? and Continue assertions were run against today's screen with the bubble line removed and pass (probe, not committed), so they guard "as before". `onboardingLooks.test.ts` unchanged: 4 passed.

- **OS4.1** · The step shows the title, the name field and the five age choices in the stated order and words, none picked; Continue is off with the hint until one is picked.
  · how: component + flow
  · test: `T39-setupScreens.test.tsx` › `OS4.1 · on open: the words in order, nothing picked, Continue off with the hint`; `OS4.1 · one tap picks, another moves the pick`; `OS4.1 · the rows are equal until one is picked`; `OS4.1 · his name and pick come back after a close`; flow `T39-screens.yaml` (demo screen 3)
  · expect:
    - In tree order: `about-title` "About you" (header), `about-name-label` "What should Kit call you?" (hidden from VoiceOver), `about-name-input` (placeholder "First name (optional)", label "What should Kit call you?", value ""), `about-age-label` "How old are you?" (header, not hidden), `about-age-list` (`radiogroup`, label "How old are you?") with rows `age-under18` "Under 18", `age-18-21` "18–21", `age-22-25` "22–25", `age-26-30` "26–30", `age-31plus` "31 or older" (en dashes, U+2013), then `about-footnote` "Stays on your phone. It never changes your score.", `about-hint` "Pick your age to go on." (hidden from VoiceOver), then Continue.
    - Every row: role `radio`, `selected` false, no `…-check`, label weight `400`, the same style object; Continue `disabled`, `accessibilityHint` "Pick your age to go on.".
    - Tap `age-22-25`: only it is `selected`, `age-22-25-check` present, weight `600`; `Haptics.selectionAsync` once; `about-hint` gone; Continue enabled with no hint; kv `onboarding.about` = `{"age":"22-25","name":""}`. Then tap `age-26-30`: it alone is selected; `age-22-25-check` gone.
    - Remount with kv `onboarding.about` = `{"age":"22-25","name":"Alex"}`: the field shows "Alex", `22–25` selected, Continue enabled.
    - With an older draft `onboarding.basics` = `{"birthYear":2004}` and no `onboarding.about`: nothing selected.
    - Flow (screen 3): every word above visible; "Continue" visible and `enabled: false`.
  · must not: a choice selected on open (also with an old birth year in the draft); two selected; Continue enabled with no pick; the hint read by VoiceOver as its own stop.
  · edges: dark, accessibility sizes (same assertions; plus the UI inventory's screenshots); a bad `onboarding.about` JSON → empty draft.
  · red: 4 tests, all red: `on open …`: the About you testIDs are not in the tree (`[look, false, false]`); `one tap picks …`, `the rows are equal …`: no `age-22-25` / `age-under18`; `his name and pick come back …`: no `about-name-input`. Flow `T39-screens.yaml` (screen 3): flow not yet run (no Simulator this session; red expected: the screens and words it asserts do not exist yet).

- **OS4.2** · A blank name with an age picked is enough to go on; a name is saved trimmed, at most 30 characters (SY4.2).
  · how: unit + component
  · test: `T39-aboutStep.test.ts` › `OS4.2 · cleanName`; `T39-setupScreens.test.tsx` › `OS4.2 · a blank name goes on; a name is saved trimmed and cut`
  · expect:
    - `cleanName('')` → null; `cleanName('   ')` → null; `cleanName(null)` and `cleanName(undefined)` → null; `cleanName('  Alex  ')` → `'Alex'`; `cleanName('Mary Ann')` → `'Mary Ann'`; `cleanName('A'.repeat(40))` → `'A'.repeat(30)`; `cleanName('B'.repeat(29) + ' C')` → `'B'.repeat(29)` (cut to 30, then trimmed). `NAME_MAX` = 30.
    - Render: the field's `maxLength` is 30. With `22–25` picked and the field empty, Continue is enabled and saves the profile with `name: null`; typed "  Alex " → `name: 'Alex'`; typed "   " → `name: null`.
  · must not: `''` or spaces saved as a name; leading or trailing spaces kept; more than 30 characters saved; Continue waiting on the name.
  · edges: the name typed, the app closed, reopened (OS4.1's remount) and Continue → still saved trimmed.
  · red: 2 tests, both red: `T39-aboutStep` › `cleanName`: "T39: not built"; `T39-setupScreens` › `a blank name goes on …`: no `about-name-input`. The reopen edge is in `OS4.1 · his name and pick come back after a close` (typed "  Alex ", remount, Continue → `'Alex'`).

- **OS4.3** · An 18+ band saves `ageBand` and `ageBandAt` and lands in Stylist; no birth year is saved.
  · how: unit (store) + component
  · test: `T39-aboutStep.test.ts` › `OS4.3 · each 18+ band is saved with the time, no birth year, no consent`; `OS4.3 · finishSetup refuses no pick and Under 18`; `T39-setupScreens.test.tsx` › `OS4.3 · Continue lands in Stylist`
  · expect:
    - For each of `18-21`, `22-25`, `26-30`, `31+` (looks draft `['smart_casual','workwear']`, `onboarding.otherStyle` "all black", older basics draft `{"fit":"relaxed","birthYear":2004}`), `finishSetup(store, T0, ids)` → profile `ageBand` = the band, `ageBandAt` = T0, `birthYear` null, `consentVersion` null, `consentAt` null, `onboardingDone` true, `fitPreference` `'relaxed'`, `styles` = `picksToStyles(['smart_casual','workwear'])`, `name` per OS4.2; kv `onboarding.looks`, `onboarding.basics`, `onboarding.about`, `onboarding.step` gone; `onboarding.otherStyle` kept.
    - `finishSetup` with `onboarding.about` age null or `'under18'` rejects and the store is unchanged (no profile, no chat, kv as before).
    - Render: Continue → `finishSetup` done, then kv `onboarding.done` `'1'`, then `router.replace('/')`.
  · must not: a birth year saved by a new setup; consent saved; the profile saved before Continue.
  · edges: a failed write (the store's `profile.put` rejects): Continue leaves him on About you with Continue working again, nothing navigated.
  · red: 4 tests, all red: `T39-aboutStep` › `each 18+ band is saved …` and `finishSetup refuses no pick and Under 18` (it first proves a 22–25 draft goes through, so a throwing stub can't pass it): "T39: not built"; `T39-setupScreens` › `Continue lands in Stylist`: no `about-name-input`; added `OS4.3 · a failed write leaves him on About you with Continue working again` (the edge): no `age-22-25`.

- **OS4.4** · `Under 18` asks once; `Change` changes nothing; `That's right` shows the stop screen with no camera, and it stays after a relaunch and a reinstall (as today).
  · how: component + flow + manual (reinstall)
  · test: `T39-setupScreens.test.tsx` › `OS4.4 · Under 18 asks once with the new title`; `OS4.4 · Change changes nothing`; `OS4.4 · That's right locks the app`; flow `T39-under-18.yaml`; manual reinstall (UI inventory → age stop)
  · expect:
    - `age-under18` picked, Continue: `Alert.alert` called once with title "Under 18?", message "Kitted is for ages 18 and up.", buttons `[{ text: 'Change', style: 'cancel' }, { text: "That's right", style: 'destructive', onPress }]`. A second Continue → a second alert (one per tap), never two for one tap.
    - `Change` (its handler, if any, run): `setAgeBlocked` not called; no profile; no `router` call; `age-under18` still selected; kv `onboarding.about` age still `under18`.
    - `That's right`: the Keychain flag set (`getAgeBlocked()` → true), `getGate().ageBlocked` true, `router.replace('/')`; no profile, no chat, no `/camera`.
    - Flow: fresh install → `Get started` → `Not sure` → `Under 18` → `Continue` → "Under 18?" and "Kitted is for ages 18 and up." → `Change` → "About you" still shown → `Continue` → `That's right` → "Kitted is for ages 18 and up." and "Thanks for checking it out. You can delete the app from your Home Screen." → `stopApp`, `launchApp` (no clearing) → the stop screen again, no "Back", no "Take photo" → final `clearState` + `clearKeychain` launch.
  · must not: Under 18 blocked with no confirm; `Change` setting the flag; any way from the stop screen to the camera; "Born in …?" as the title.
  · edges: relaunch (flow); reinstall (manual, Not testable yet below); "Delete all my data" keeps the flag (`privacyWipe.test.ts`, unchanged).
  · red: 3 tests, all red: `Under 18 asks once …`, `Change changes nothing`, `That's right locks the app`: no `age-under18` row. Flow `T39-under-18.yaml`: flow not yet run (no Simulator this session; red expected: the screens and words it asserts do not exist yet). Reinstall: Not testable yet (below).

- **OS4.5** · No screen before an age is picked says "18" except the `Under 18` and `18–21` choices.
  · how: component
  · test: `T39-setupScreens.test.tsx` › `OS4.5 · the only 18s before the pick are two choices`
  · expect: collect every string in the rendered tree (text children, `accessibilityLabel`, `accessibilityHint`, `placeholder`) of `WelcomeScreen` (accounts off and on), `ExampleCheckScreen` (`screen` and `sheet`), `PickLooksScreen`, and `BasicsScreen` on open and with "Alex" typed and nothing picked. The strings containing "18" are exactly: on About you, "Under 18" and "18–21" (each as text and as its row's label); on every other screen, none.
  · must not: "Kitted is for 18 and up", "18 and up", "18+" or "ages 18" anywhere before a pick (the old footnote `onb.basics.never` is not rendered).
  · edges: accessibility sizes (same strings).
  · red: 1 test, red: Welcome (accounts off/on), the Example check (screen/sheet) and Looks pass today (no "18"); About you on open gives `["Kitted is for 18 and up. It never changes your score."]` ≠ `["18–21","18–21","Under 18","Under 18"]`.

- **OS4.6** · Style profile shows `Age` with the band (a band from the birth year for an older profile) and the new footnote.
  · how: unit + component + flow
  · test: `T39-aboutStep.test.ts` › `OS4.6 · bandFromBirthYear and profileAgeBand`; `T39-styleProfile.test.tsx` › `OS4.6 · Name, Fit you like, Age, and the footnote`; `OS4.6 · an older profile shows the band from its birth year`; `OS4.6 · the Name row changes and clears the name; nothing else moves`; flow `T39-screens.yaml` (screens 284, 80)
  · expect:
    - `bandFromBirthYear(y, 2026)`: 2009 → `under18`; 2008 → `18-21`; 2005 → `18-21`; 2004 → `22-25`; 2001 → `22-25`; 2000 → `26-30`; 1996 → `26-30`; 1995 → `31+`; 1950 → `31+`.
    - `profileAgeBand`: `{ ageBand: '22-25', birthYear: null }` → `22-25`; `{ ageBand: '31+', birthYear: 2005 }` → `31+` (the band wins); `{ birthYear: 2005 }` (no band) → `18-21`; `{ birthYear: 2009 }` → null; `{ ageBand: null, birthYear: null }` → null; `{ ageBand: 'nonsense' }` → null.
    - Render with profile `{ name: 'Alex', ageBand: '22-25' }`: the Basics card in order `profile-name-row`, Fit you like, `profile-age-row`; `profile-name-input` value "Alex", placeholder "First name (optional)", label "Name", `maxLength` 30; `profile-age-value` "22–25"; `profile-age-row` one element labelled "Age, 22–25"; `profile-basics-note` "Age can't be changed here."; no text "Birth year" and none "Birth year can't be changed here.".
    - Older profile `{ birthYear: 2005, ageBand: undefined }` → "18–21", label "Age, 18–21". No profile → "Not set", label "Age, Not set".
    - Name edits: typed "  Sam " then Done → `name: 'Sam'`; cleared then `beforeRemove` fired → `name: null`; in both, `ageBand`, `ageBandAt`, `birthYear`, consent fields unchanged. The Age row has no `onPress` and no role `button`.
  · must not: the age editable here; a save changing `ageBand`/`ageBandAt`/`birthYear`; the old "Birth year" row or footnote.
  · edges: dark, accessibility sizes (rows stack; nothing truncated: UI inventory).
  · red: 4 tests, all red: `T39-aboutStep` › `bandFromBirthYear and profileAgeBand`: "T39: not built"; `T39-styleProfile` › `Name, Fit you like, Age, and the footnote`: no `profile-name-row` / `profile-age-row` (`[false, false, …]`); `an older profile …`: no `profile-age-value`; `the Name row changes …`: no `profile-name-input`. Flow `T39-screens.yaml` (284, 80): flow not yet run (no Simulator this session; red expected: the screens and words it asserts do not exist yet).

- **OS4.7** · No request to the server carries the age band or the name (a test over every request builder).
  · how: unit, over every caller of `AiTransport.send` and over sync
  · test: `T39-noLeak.test.ts` › `OS4.7 · a fit check, its looks and closet call, a question and a tap answer carry no age band and no name`; `OS4.7 · sync never sends them`; `OS4.7 · the new kv keys are local`
  · expect: a store whose profile is `{ name: 'Zebulon', ageBand: '22-25', ageBandAt: 1761133260000, birthYear: null, consentVersion: '2', … }`, kv `onboarding.about` = `{"age":"22-25","name":"Zebulon"}`, and a fact and closet rows from the `full` seed. Through `serverTransport` with a recording `AiFetch` (as `serverProxy.test.ts` A2 builds them), run: one full fit check (read with close-ups, both look arms, the closet call), one question (the stylist context from `loadStylistSnapshot` → `buildAskRequest`, and the OpenAI provider), one tap answer. The recorded calls cover all four routes `read`, `look`, `closet`, `ask` (the test fails if any route has no call). For every recorded URL, header value and body: none contains "Zebulon", "22-25", "22–25", "ageBand", "ageBandAt" or "1761133260000". The same with `directTransport`. Sync: `rowToData('profile', profile)` has no `ageBand`, `ageBandAt` or `name` key; `dataToRow('profile', thatData, localProfile)` keeps the local three values; for every key in `KV_SYNCED`, its outgoing value for a stored value containing the name and band contains neither; `kvPolicy('onboarding.about')` and `kvPolicy('firstCheckOffer.laterAt')` → `'local'`.
  · must not: a route not exercised; the name or band in any header, URL or body; either new key classified as synced or unclassified (the existing "every kv key the app writes is classified" test must pass).
  · edges: a profile from before V9 (fields absent) → the same requests work.
  · red: 3 tests. `a fit check, its looks and closet call, a question and a tap answer …`: **exists: bites via** `features/ask/snapshot.ts` adding `profile.name` to `otherStyle` (fails with "Zebulon in https://srv.test/api/v1/ask?model=gpt-5.6-luna" ×2 and the Gemini ask; reverted); it covers all four routes on the server transport (2 look arms, 3 ask calls) and the direct path (Gemini + OpenAI's dev-key fetch), and a pre-V9 profile sends the same routes. `sync never sends them`: red, `dataToRow` drops the local `ageBand`/`ageBandAt`/`name` (undefined ≠ the phone's values). `the new kv keys are local`: red, `kvPolicy('onboarding.about')` → null ≠ `'local'`. Interpretation (see the return note): "every key in `KV_SYNCED`" is checked on the values the app actually holds mid-setup and after `finishSetup`, through each key's `outgoing`, since a synced key with no `outgoing` sends whatever is stored.

- **OS5.1** · After About you, Stylist shows Kit's hello, then the offer card word for word, and the camera does not open.
  · how: unit (store) + component + flow
  · test: `T39-aboutStep.test.ts` › `OS5.1 · setup's end posts Kit's first message, then the offer`; `T39-offerCard.test.tsx` › `OS5.1 · the card's words, buttons and VoiceOver`; `OS5.1 · the thread renders the card through the card switch`; flow `T39-setup-fresh.yaml`
  · expect:
    - After `finishSetup(store, T0, ids)`, the chat sorted by `createdAt` is exactly: first, the message(s) `completeOnboarding` posts for `consent: 'later'` (compared with a second store where only `completeOnboarding` ran with the same answers: same roles, kinds, texts, payloads; today that is one stylist text with `payload.aiNote` true; SY2's hello later replaces it), then one message `{ role: 'stylist', kind: 'card', cardType: 'firstCheckOffer', text: null }` with `createdAt` greater than every message before it. No `turnOnChecks` message.
    - Render `FirstCheckOfferCard`: `offer-title` "Want to check a fit now?"; `offer-body` "Stand back so your shoes are in the shot. Not dressed for it? Later works."; `offer-text` is one accessible element labelled "Want to check a fit now? Stand back so your shoes are in the shot. Not dressed for it? Later works." with no `header` role; buttons "Check my fit" (label "Check my fit. Opens the camera.") and "Later", each its own element, in that order.
    - `ThreadRow` with the card message renders `FirstCheckOfferCard`.
    - The About you render: after Continue and 5000 ms of fake timers, no `router.push` to a path starting `/camera`.
    - Flow: after `Continue`, ".*Quick note: I'm an AI.*" (in today's AI note and in SY2's hello) above "Want to check a fit now?", "Stand back so your shoes are in the shot. Not dressed for it? Later works.", "Check my fit", "Later"; `assertNotVisible: "Take photo"` after a 3 s wait.
  · must not: the camera opening on its own; the card above Kit's first message; a header trait on the joined text; T39 posting anything above Kit's first message or editing its words.
  · edges: offline (setup's end sends nothing, OS5.7); dark and AX (UI inventory).
  · red: 3 tests, all red: `T39-aboutStep` › `setup's end posts Kit's first message, then the offer`: "T39: not built"; `T39-offerCard` › `the card's words, buttons and VoiceOver`: no `offer-card` (the stub renders nothing); `the thread renders the card through the card switch`: no `offer-card` from `ThreadRow`. The no-camera-after-Continue part is in `OS3.2 · each step …` and `F1.1`. Flow `T39-setup-fresh.yaml`: flow not yet run (no Simulator this session; red expected: the screens and words it asserts do not exist yet).

- **OS5.2** · `Check my fit` opens the camera, with the agreement on top when he hasn't agreed; `Agree` makes it live; `Not now` returns to Stylist with "Turn on fit checks" posted once and the offer's buttons gone.
  · how: component + unit + flow
  · test: `T39-offerCard.test.tsx` › `OS5.2 · Check my fit opens the camera`; `OS5.2 · the camera shows the agreement first, and Agree makes it live`; `OS5.2 · Not now and the X post Turn on fit checks once and the buttons go`; `T39-aboutStep.test.ts` › `OS5.2 · declineAgreement posts once, only after an offer`; flows `T39-setup-not-now.yaml`, `T39-setup-fresh.yaml`
  · expect:
    - Press "Check my fit" → `router.push('/camera')` once.
    - The camera route (`app/camera.tsx`, not a demo screen, no consent): `ConsentScreen` camera mode: `consent-intro` "Before I score a photo, here's what happens to it.", "Before your first fit check", "Agree", "Not now", "Close"; `CameraScreen` not rendered. "Agree" → profile `consentVersion` `'2'` with `consentAt` set; `CameraScreen` rendered in place.
    - "Not now": exactly one `turnOnChecks` message `{ role 'stylist', kind 'card', cardType 'turnOnChecks', text "Send me a fit. I'll score it and start your closet." }`, created after the offer card; `router.back()`; no consent; the card's `offer-buttons` gone. "Close" does the same. A second "Not now" (camera opened again) → still one `turnOnChecks`.
    - `declineAgreement` with no offer card → nothing posted; with a `turnOnChecks` already there → nothing posted.
    - Flow (not now): … `Check my fit` → `Not now` → "Turn on fit checks" and "Review and turn on" visible, "Later" not visible; the accessory's "Check my fit. Opens the camera." → `Not now` → `assertNotVisible: { text: "Turn on fit checks", index: 1 }`.
  · must not: the live camera before Agree; `Not now` saving consent; a second "Turn on fit checks"; the offer's buttons after `Not now`.
  · edges: he agrees, then closes the camera without a photo → the offer's buttons stay, and `Check my fit` opens the live camera with no agreement.
  · red: 5 tests, all red: `Check my fit opens the camera`: no button labelled "Check my fit. Opens the camera."; `the camera shows the agreement first, and Agree makes it live`: no `consent-intro` (with that line removed, the rest, Agree → consent '2' at T0 and the camera in place, passes today: probe, not committed); `Not now and the X post Turn on fit checks once …`: `offer-buttons` absent before Not now (`["Not now", false]`); added `agreed, then closed without a photo …` (the edge): no `offer-buttons`; `T39-aboutStep` › `declineAgreement posts once, only after an offer`: "T39: not built". Flows `T39-setup-not-now.yaml`, `T39-setup-fresh.yaml`: flow not yet run (no Simulator this session; red expected: the screens and words it asserts do not exist yet).

- **OS5.3** · `Later` removes the buttons, posts Kit's line word for word and saves `firstCheckOffer.laterAt`.
  · how: unit + component + flow
  · test: `T39-aboutStep.test.ts` › `OS5.3 · tapLater once`; `T39-offerCard.test.tsx` › `OS5.3 · Later: the buttons go and Kit's line follows`; flow `T39-setup-later.yaml`
  · expect: `tapLater(store, T1, ids)` → kv `firstCheckOffer.laterAt` = `String(T1)`; one new message `{ role 'stylist', kind 'text', text "No rush. Tap the camera button whenever you're ready." }` created after the card. A second `tapLater(store, T2, ids)` → kv still `String(T1)`, still one line. Render: press "Later" → `offer-buttons` gone; `offer-title` and `offer-body` still there; no `router` call. The thread shows the line with the "Kit" mark (its row's `showWho` true). Flow: `Later` → ".*No rush\. Tap the camera button whenever you're ready\." visible, "Later" and the card's "Check my fit" gone; `stopApp` + `launchApp` (no clearing) → still gone.
  · must not: a second line; `laterAt` overwritten; the camera opened; the buttons back after a relaunch.
  · edges: "Delete all my data" (`deleteAllData`) → kv `firstCheckOffer.laterAt` null.
  · red: 3 tests, all red: `T39-aboutStep` › `tapLater once` and added `"Delete all my data" clears firstCheckOffer.laterAt` (the edge): "T39: not built"; `T39-offerCard` › `Later: the buttons go and Kit's line follows` (also remounts: still no buttons): no "Later". Flow `T39-setup-later.yaml`: flow not yet run (no Simulator this session; red expected: the screens and words it asserts do not exist yet).

- **OS5.4** · After any scored check, the offer card shows no buttons, also after a relaunch.
  · how: unit + component
  · test: `T39-aboutStep.test.ts` › `OS5.4 · offerButtonsShow and loadOfferState`; `T39-offerCard.test.tsx` › `OS5.4 · a scored check removes the buttons for good`; flow `T39-screens.yaml` (screen 283)
  · expect: `offerButtonsShow({ laterAt: null, hasScoredCheck: false, declined: false })` → true; each of the three set alone → false. `loadOfferState`: a fit check with status `scored` (first check or re-check) → `hasScoredCheck` true; only `failed`, `held`, `unreadable`, `notClothed`, `scoring` or `asking` checks → false. Render: buttons shown; a `scored` check written → buttons gone without a remount; unmount and remount → still gone; only a `failed` and a `held` check → buttons still shown; `readOnly` → no buttons. Flow (283): "Want to check a fit now?" visible, "Later" not visible.
  · must not: a failed or held check removing the buttons; the buttons back after a remount.
  · edges: the check on an earlier day (Past chats): the card there is read-only, no buttons.
  · red: 2 tests, both red: `T39-aboutStep` › `offerButtonsShow and loadOfferState`: "T39: not built"; `T39-offerCard` › `a scored check removes the buttons for good` (failed + held keep them, scored removes them live and after a remount, `readOnly` none): no `offer-buttons`. Flow `T39-screens.yaml` (283): flow not yet run (no Simulator this session; red expected: the screens and words it asserts do not exist yet).

- **OS5.5** · A fresh install reaches a live camera in 6 taps by the path above (F1.1), checked by a tap-through flow.
  · how: flow
  · test: `T39-setup-fresh.yaml`
  · expect: from Welcome ("Get started" visible), exactly six `tapOn` commands: "Get started", "Not sure", "22–25", "Continue", "Check my fit" (the card's, matched inside "Want to check a fit now?"'s card or by its position below it), "Agree"; then "Take photo" (the shutter) visible within 10 s. Before the sixth tap "Take photo" is not visible. No sign-in sheet and no paywall on the way (`assertNotVisible` "Continue free" and "Up to .* checks a day\.[\s\S]*" after each tap).
  · must not: a seventh tap needed; the camera before the fifth tap; the agreement before the fifth.
  · edges: the dev launcher's server tap isn't counted (it isn't in the app).
  · red: flow only, `T39-setup-fresh.yaml` (exactly six `tapOn`s in the app, "Take photo" checked absent after taps 1–5 and visible after the 6th, no "Continue free" / limit line after each tap): flow not yet run (no Simulator this session; red expected: the screens and words it asserts do not exist yet).

- **OS5.6** · An install that finished setup before this change shows no offer card.
  · how: unit + flow
  · test: `T39-aboutStep.test.ts` › `OS5.6 · V9 adds the columns and posts nothing`; `OS5.6 · an older setup has no offer`; flow `T39-screens.yaml` (screens 12, 212)
  · expect: an SQLite database migrated to V8 with an onboarded profile (`birth_year` 2004) and three chat rows, then V9: the chat rows are identical (count and content), `birth_year` 2004 kept, `age_band`, `age_band_at`, `name` NULL. A memory store loaded with the `full` seed: no `firstCheckOffer` message, and `loadOfferState` runs without error. Flow: screens 12 and 212 → "Want to check a fit now?" not visible.
  · must not: an update posting the card; an older profile's birth year cleared.
  · edges: an install closed mid-setup on the old agreement step is not "finished": it reopens on About you and gets the card (OS3.2).
  · red: 2 tests, both red: `V9 adds the columns and posts nothing`: no migration 9 (`undefined`); `an older setup has no offer`: the full seed has no `firstCheckOffer` message today, then `loadOfferState` "T39: not built". Flow `T39-screens.yaml` (12, 212): flow not yet run (no Simulator this session; red expected: the screens and words it asserts do not exist yet).

- **OS5.7** · Before `Agree`, nothing is sent (F1.3).
  · how: component (integration over the setup screens)
  · test: `T39-offerCard.test.tsx` › `OS5.7 · setup, the offer, Later, Check my fit and Not now send nothing`
  · expect: with the recording transport and a failing `global.fetch`, walk: Looks (a tile, Continue), About you (a name, `22–25`, Continue → `finishSetup`), the card rendered, "Later" (in one run) or "Check my fit" → the camera route's agreement → "Not now" (in another): `fetch` 0 calls, transport 0 calls, `mayUpload(store)` false.
  · must not: any call before Agree, including the guest sign-in, the server's tier check or analytics.
  · edges: offline (the same walk works with the connectivity service reporting offline). The connectivity probe (Apple's captive-portal page, no data of his) is today's behaviour, faked in this test and not counted.
  · red: 1 test, red: the walk stops at About you (no `about-name-input`). The afterEach of every render test file also asserts fetch 0 and transport 0. No connectivity service is imported by these screens; fetch rejecting (offline) is the offline case.

- **F1.1** · A fresh install reaches the camera in 6 taps or fewer, with no account and no paywall on the way, and the camera never opens until he taps Check my fit.
  · how: flow + component
  · test: `T39-setup-fresh.yaml` (OS5.5); `T39-setupScreens.test.tsx` › `F1.1 · nothing opens the camera before Check my fit`
  · expect: OS5.5's six taps; Welcome, Looks and About you render no `router.push('/camera…')` on any tap or after 5000 ms of timers; About you's Continue replaces to `/`, never to a paywall or sign-in path.
  · must not: a camera, account or paywall step in setup.
  · edges: accounts on (Welcome shows "I already have an account", which isn't tapped; the count is the same).
  · red: 1 test, red: `nothing opens the camera before Check my fit` (accounts off and on): Welcome and Looks pass today, About you fails (no `age-22-25`). Flow `T39-setup-fresh.yaml`: flow not yet run (no Simulator this session; red expected: the screens and words it asserts do not exist yet).

- **F1.2** · The age question starts with nothing picked; "Under 18" shows the stop screen and no camera; Declared Age Range under 18 does the same.
  · how: component + flow (the first two parts); the third is Not testable yet (T32)
  · test: `OS4.1 · on open: … nothing picked …`; `OS4.4 · That's right locks the app`; `T39-under-18.yaml`; `T39-setupScreens.test.tsx` › `F1.2 · nothing picked, then the stop`
  · expect: as OS4.1 (no row selected on open) and OS4.4 (`That's right` → the flag, `/` → the stop screen, no camera).
  · must not: a preselected band; a camera after Under 18.
  · edges: Declared Age Range (Not testable yet).
  · red: 1 test, red: `nothing picked, then the stop`: no `age-under18`; plus OS4.1 and OS4.4 above. Flow `T39-under-18.yaml`: flow not yet run (no Simulator this session; red expected: the screens and words it asserts do not exist yet). Declared Age Range: Not testable yet.

- **F1.3** · Nothing is sent anywhere before consent is agreed; a photo taken before consent is kept and scored after Agree.
  · how: component (OS5.7) + unit (the held photo)
  · test: `OS5.7 · …`; `T39-offerCard.test.tsx` › `F1.3 · a photo held for the agreement is scored after Agree, dropped after Not now`
  · expect: OS5.7. With the fit-check service mocked to answer `noConsent` for a picked photo: `startCheck` pushes `/sheets/consent?resume=1`; `resumeAfterConsent()` → true and the same photo is started again exactly once; `dropAfterConsent()` instead → the photo's drop runs once and a later `resumeAfterConsent()` → false.
  · must not: a send before Agree; the photo lost after Agree; the photo kept after Not now.
  · edges: a second held photo replaces (and drops) the first.
  · red: `T39-offerCard` › `a photo held for the agreement is scored after Agree, dropped after Not now` (also the second held photo replacing the first): **exists: bites via** `dropAfterConsent` not calling the held photo's drop ("Expected number of calls: 1, Received: 0"; reverted). The nothing-sent half is OS5.7 (red).

- **SY4.1** · The About you step shows `What should Kit call you?` with `First name (optional)` above `How old are you?`; `Continue` is enabled with an age picked and a blank name.
  · how: component + flow
  · test: `T39-setupScreens.test.tsx` › `SY4.1 · the name comes first and is optional`; flow `T39-setup-fresh.yaml` (the name is never typed)
  · expect: `about-name-label` and `about-name-input` come before `about-age-label` in tree order; with the field empty and `18–21` picked, Continue is enabled; no "Skip" anywhere on the screen.
  · must not: a Skip button; Continue waiting on the name; the name field on Restore (`about-name-input` absent there).
  · edges: AutoFill props (`textContentType` `givenName`, `autoComplete` `given-name`) present.
  · red: 1 test, red: `the name comes first and is optional` (AutoFill props, no Skip, no field on Restore): no `about-name-label` (index -1). Flow `T39-setup-fresh.yaml` (the name is never typed): flow not yet run (no Simulator this session; red expected: the screens and words it asserts do not exist yet).

- **SY4.2** · A name is saved trimmed, at most 30 characters; spaces only means no name.
  · how: unit + component
  · test: `OS4.2 · cleanName`; `OS4.2 · a blank name goes on …`; `T39-styleProfile.test.tsx` › `SY4.2 · Style profile saves the name by the same rule`
  · expect: OS4.2's cases, and the same through Style profile: "   " → `name: null`; "  Sam " → `'Sam'`; 40 characters → the first 30.
  · must not: as OS4.2.
  · edges: none beyond OS4.2.
  · red: 1 test, red: `T39-styleProfile` › `Style profile saves the name by the same rule`: no `profile-name-input`; plus OS4.2's tests.

- **SY4.4** · No request to the server (fit check, question, any other) carries the name (a test over every request builder).
  · how: unit
  · test: `T39-noLeak.test.ts` (OS4.7's tests cover the name: "Zebulon" in the profile and the draft)
  · expect: as OS4.7, for "Zebulon".
  · must not: as OS4.7.
  · edges: PostHog isn't built (T91 holds its own test); nothing to send to it yet.
  · red: as OS4.7 ("Zebulon" in the profile and the About you draft): exists, bites via the same `snapshot.ts` name leak.

**Superseded tests** (replaced, not weakened; each named in REPORT.md with the T39 test that replaces it): `birthYearStep.test.ts` BY1, BY2, BY3 (they read `BasicsScreen.tsx`'s source for the birth-year card); `onboardingAccount.test.ts` › "the bar has a segment per step and fills on Consent (step 4)" (→ `OS3.2 · the bar has 3 segments`); `youTonight.test.ts` › YT6 "the birth-year row reads …" (→ `OS4.6 · Name, Fit you like, Age, and the footnote`); `heightBuildRemoved.test.ts` HB3's last line only (`profile.tsx` matching `onb.basics.birthYear`). `scenarios.test.ts` keeps passing unchanged (screen 4 stays before onboarding; 280–284 are after).

## UI inventory
Every visible element, per state. Anything on screen that isn't here is a defect; anything here that isn't on screen is a defect. Words in quotes are exact. Each state is checked in light and dark; the largest text size where marked. Screenshots: `xcrun simctl launch <udid> com.trykitted.kitted -demoScreen <n> -theme <light|dark> -demoLatency 0`; content size via `xcrun simctl ui <udid> content_size accessibility-extra-extra-extra-large`.

### Looks · on open · demo screen 2 · light, dark, largest text · DESIGN.md phone 1
- Back · circle button · VoiceOver "Back", button · tap: Welcome.
- Progress bar · 3 segments, 2 filled · VoiceOver "Step 2 of 3" · testID `onb-progress`.
- Title · "Which of these would you actually wear?" · VoiceOver: the same, heading · testID `looks-title` · wraps, never truncated (about 5 lines at AX5).
- Line · "Tap up to 3." · VoiceOver: the same · testID `looks-line`.
- Seven look tiles, `Something else?` ("Something else?", "Tell me in your words"; VoiceOver "Something else. Describe your style in your own words."), `Not sure`, and the dock's `Continue` / "Continue · {n} of 3" and the 4th-tap note "Up to 3.": **unchanged** from today (labels `onb.looks.tileA11y`); one column at AX sizes.
- Not present: a Kit bubble, the "Kit" mark, "Pick by name instead".

### About you · on open · demo screen 3 · light, dark, largest text (AX5: DESIGN.md phone 16) · DESIGN.md phone 2
- Back · VoiceOver "Back", button · tap: Looks (picks kept).
- Progress bar · 3 of 3 filled · VoiceOver "Step 3 of 3" · testID `onb-progress`.
- Title · "About you" · VoiceOver: heading · testID `about-title`.
- Question 1 · "What should Kit call you?" · hidden from VoiceOver (it is the field's label) · testID `about-name-label`.
- Name field · empty, placeholder "First name (optional)" · VoiceOver: text field "What should Kit call you?" (the build checks iOS also reads the placeholder; Not testable yet below) · testID `about-name-input` · tap: keyboard.
- Question 2 · "How old are you?" · VoiceOver: heading, read just before "Under 18" · testID `about-age-label`.
- Age list · five equal rows, nothing checked: "Under 18" · "18–21" · "22–25" · "26–30" · "31 or older" · VoiceOver: each a radio button with its words, not selected; the list a radio group "How old are you?" · testIDs `about-age-list`, `age-under18`, `age-18-21`, `age-22-25`, `age-26-30`, `age-31plus` · pressed: the row fills `surface2`.
- Footnote · "Stays on your phone. It never changes your score." · VoiceOver: the same · testID `about-footnote`.
- Hint (dock) · "Pick your age to go on." · hidden from VoiceOver · testID `about-hint`.
- Continue · "Continue", dimmed · VoiceOver "Continue, dimmed", hint "Pick your age to go on." · testID `about-continue` (wrapper).
- VoiceOver order: Back, progress, "About you", the field, "How old are you?", the five rows, the footnote, Continue.
- AX5: the title, questions and rows wrap; "31 or older" may wrap to 2 lines; the hint wraps over the dimmed Continue; the page scrolls under the dock; nothing truncated, nothing overlapping.
- Not present: any bubble, "Birth year", "Choose", "Kitted is for 18 and up. It never changes your score.", "Pick your birth year to go on.".

### About you · typing his name · demo screen 3, tap the field · light, dark · DESIGN.md phone 3
- As on open, with the keyboard up (letters, return key "done"), the field showing his text and the clear button, and the dock (hint and dimmed Continue) riding above the keyboard, both visible. `done`, a tap on a row, or a drag closes the keyboard.

### About you · ready · demo screen 4 · light, dark, largest text (DESIGN.md phone 14) · DESIGN.md phone 4
- As on open, with the field "Alex" and "22–25" checked (checkmark at the trailing edge, words semibold; VoiceOver: "22–25, radio button, selected"); no hint; Continue full strength, VoiceOver "Continue", button, no hint.

### About you · Under 18 · demo screen 3, tap "Under 18", then Continue · light, dark · DESIGN.md phone 5
- System alert · title "Under 18?" · message "Kitted is for ages 18 and up." · buttons "Change" (left, cancel) and "That's right" (right, destructive) · VoiceOver: the system's order.

### The age stop · after "That's right" (`T39-under-18.yaml`) · light, dark · DESIGN.md phone 6
- Unchanged: the small woven label, "Kitted is for ages 18 and up." (heading), "Thanks for checking it out. You can delete the app from your Home Screen."; no Back, no camera, no tab bar. Kept after a relaunch (flow) and a reinstall (manual).

### Restore · Welcome back · demo screen 136 · light, dark · DESIGN.md phone 7
- Back · VoiceOver "Back" · tap: Welcome. No progress bar.
- Title · "Welcome back" · heading · testID `about-title`.
- Line · "Your age first, then I'll bring back your fits." · testID `restore-line`.
- "How old are you?" (heading), the same five rows, footnote, hint and Continue as About you on open. No name field.
- Not present: a Kit bubble, "Welcome back. Your birth year first, then I'll bring back your fits.".

### Stylist · Kit's offer · demo screen 280 · light, dark, largest text (DESIGN.md phone 15) · DESIGN.md phone 8
- Header, day stamp, the tab bar and the accessory (camera "Check my fit. Opens the camera.", "Ask Kit…", mic): today's, unchanged (the quota line is today's rule, not this task's).
- "Kit" mark and Kit's first message · today's AI note: "I'm Kit, your stylist. Quick note: I'm an AI. I read clothes, never faces, and I can get things wrong. Tap "Not quite right?" when I do." (replaced word for word by SY2's hello when that lands; not this task's words).
- Offer card · testID `offer-card`, 12 below the message:
  - Title · "Want to check a fit now?" · testID `offer-title`.
  - Body · "Stand back so your shoes are in the shot. Not dressed for it? Later works." · testID `offer-body`.
  - Title and body are one VoiceOver element: "Want to check a fit now? Stand back so your shoes are in the shot. Not dressed for it? Later works." (not a heading) · testID `offer-text`.
  - Primary button with the camera icon · "Check my fit" · VoiceOver "Check my fit. Opens the camera.", button · tap: the camera (the agreement first before he agrees; demo screens skip it).
  - Secondary button · "Later" · VoiceOver "Later", button · tap: phone 10's state.
  - Buttons wrapper · testID `offer-buttons`.
- VoiceOver order: header, stamp, Kit's message, the card's text, Check my fit, Later, the accessory, the tabs.
- AX5: the title and body wrap; the buttons grow (icon above the words); nothing truncated.

### The agreement on the camera · fresh install only (`T39-setup-fresh.yaml`, `T39-setup-not-now.yaml`; demo screens open the camera directly) · light, dark · DESIGN.md phone 9, with today's camera words (#412)
- Close · X, top right · VoiceOver "Close", button · tap: as Not now.
- Intro · plain text, no "Kit" mark · "Before I score a photo, here's what happens to it." · testID `consent-intro`.
- Today's card and footer, unchanged: "Before your first fit check", its four rows (`onb.consent.*` as today), "You can turn this off anytime in You → Settings → Privacy & data."; the privacy-policy link only when its address is set (as today). No "See an example first".
- Dock: "Agree" (primary) and "Not now" (secondary), as today's camera mode.

### Stylist · after Later · demo screen 281 · light, dark · DESIGN.md phone 10
- The offer card with its title and body only (`offer-buttons` absent); the same VoiceOver text.
- "Kit" mark and Kit's line · "No rush. Tap the camera button whenever you're ready." · VoiceOver "Kit: No rush. Tap the camera button whenever you're ready.".

### Stylist · after Not now · demo screen 282 · light, dark · DESIGN.md phone 11
- The offer card, no buttons.
- Today's "Turn on fit checks" message, once, unchanged: "Kit" mark, "Send me a fit. I'll score it and start your closet.", the card "Turn on fit checks", "To score a photo, I need your OK to send a face-free copy to Google's Gemini API.", "Review and turn on", "See an example".

### Stylist · after a scored check · demo screen 283 · light, dark · DESIGN.md phone 12
- The offer card, no buttons, for good; his photo and its result card below, unchanged (not this task's).

### Stylist · set up before this change · demo screens 12 and 212 · light
- Today's Stylist, unchanged; no "Want to check a fit now?" anywhere.

### Style profile · Name and Age · demo screen 284 · light, dark, largest text (DESIGN.md phone 17) · DESIGN.md phone 13
- Header (today's): Back, "Style profile", "Done".
- Section label · "Basics".
- Name row · label "Name" · an inline field showing "Alex" (ink), placeholder "First name (optional)" when empty · VoiceOver: text field "Name", value "Alex" · testIDs `profile-name-row`, `profile-name-input` · tap anywhere on the row: focuses the field.
- Fit you like · unchanged.
- Age row · label "Age" · value "22–25" (ink2) · VoiceOver "Age, 22–25" · testIDs `profile-age-row`, `profile-age-value` · tap: nothing.
- Footnote · "Age can't be changed here." · testID `profile-basics-note`.
- Styles and Budget sections · unchanged.
- AX5: each row stacks its label over its value; the name field goes full width, left-aligned; nothing truncated.
- Not present: "Birth year", "Birth year can't be changed here.".

### Style profile · an older profile · demo screen 80 · light
- As above with an empty Name field (placeholder "First name (optional)") and Age "18–21" (from birth year 2005 on the demo's 2026 clock), VoiceOver "Age, 18–21".

## Not testable yet
Never dropped, never counted as pass.
- **F1.2** (Declared Age Range under 18) · why: Apple's age-range check isn't built (T32), and needs the paid Apple team (T80) · would verify it: T32's tests and a phone test once T80 is done.
- **OS4.4** (kept through a reinstall) · why: needs the app deleted and installed again on the Simulator or the phone; this session has no Simulator (low memory) · would verify it: on the Simulator, `xcrun simctl uninstall <udid> com.trykitted.kitted`, reinstall the built app, launch → the stop screen (the Keychain flag survives); or the founder's phone.
- **OS4.1 / SY4.1** (what VoiceOver actually says: "How old are you?" heard before "Under 18"; the empty field's placeholder "First name (optional)" read aloud) · why: the tree order is tested, but the speech needs VoiceOver running · would verify it: `maestro hierarchy` on the Simulator for the order, and a VoiceOver pass on the founder's phone (a P2 to-do, about 5 minutes) for the speech; if iOS doesn't read the placeholder, that's a founder question (no new words without his yes).
- **OS5.5 / F1.1** (a live camera, not the Simulator's bundled photo) · why: the Simulator has no camera · would verify it: the same six taps on the founder's phone after a fresh install from TestFlight.
- **All flows and the UI inventory's screenshots** · why: this session has no Simulator (low memory) · would verify it: the verifier runs `T39-*.yaml` and takes the screenshots once one Simulator can be booted. Until then each of these criteria is "not verified" for its flow part.

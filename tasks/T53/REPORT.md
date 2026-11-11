# T53 · Report: notifications in the beta

Size: strict (it touches "Delete all my data" and the age lock). Tests locked at `eb2a35e2`. The build commit is `a95bd6e4`. This record was written by the coordinator from the implementer's hand-back, because the harness refused the subagent's write.

## Built (the implementer)

**Tests:**
- All 139 tests on the Lock line pass: the 7 T53 files, plus the changed `onboardingFinish.test.ts` and `settingsPrefs.test.ts`.
- The whole suite (`npx jest --no-watchman -w 2`): 1827 passed, 3 failed, 4 skipped. The 3 failures are in T34's `youSettingsHome.test.tsx`; see Disputes.
- `tsc` passes, and so does the core typecheck.
- `expo lint`: 0 errors and 15 warnings, none in T53 files.
- Core: 853 tests pass.

**What changed:**
- **Kit's ask** is one step, after the first scored fit (in the beta, under the closet card).
  - The time comes first ("I get dressed at", 8:00 am by default), then `Send me ideas` / `No thanks`.
  - `Send me ideas` saves the switch on, then shows Apple's prompt if iOS has never asked.
  - Allow schedules 7 nudges and shows the done line. The "today" or "tomorrow" in it is fixed at the moment he answers.
  - Don't Allow and `No thanks` both show the later line.
  - The ask is posted once ever, by any route (`notify.asked`). Never under the age lock, and never on a build without the native module.
- **The catch-up (NT1.6):** a tester whose setup finished with no ask, Apple's prompt never shown and the switch never set gets the same card once, after today's card.
- **The daily nudge:**
  - Every open, return or leave replaces the next 7 days: one a day at his time minus 15 minutes, wall-clock time kept across daylight saving, default sound, no title.
  - Before Kit can suggest: "Check today's fit. Each one teaches me your closet."
  - Once it can: "Today's outfit idea is ready."
  - "Your closet's big enough now: here's today's idea." goes out once ever, only after a "Check today's fit" nudge was delivered.
  - A tap opens Stylist at today's card.
- **The comeback:** after the 7 scheduled days run out, the next open posts the question once per lapse. Nothing is scheduled until he answers. Its three answers end in their exact lines. It isn't posted while iOS has notifications off, the switch is off, or the age lock is on.
- **You → Notifications:**
  - The rows: the new header, `Daily outfit idea`, `I get dressed at` and `Fit check ready`.
  - **The switches' rules:**
    - The daily switch shows on only when it's saved on, iOS allows, and the nudges aren't paused.
    - Turning a switch on when iOS has never asked shows Apple's prompt.
    - With iOS off, the off card sits on top and both switches and the time row are greyed at their saved values.
  - **Freshness:** the page re-reads iOS's setting when the app comes back to the front.
- **Fit check ready (NT6):**
  - When he leaves with a check still scoring, the app asks iOS for extra time through a new native function.
  - If the check scores while the app is still in the background, it sends one line, once (2, 1 or no fixes). Never the score.
  - Nothing is sent for a failed, "not rated", offline, held or asking check.
- **Safety:** "Delete all my data" cancels every scheduled notification before the wipe, and the wipe clears every notify key. No push token, and no server code.
- **The switch:** `NOTIFICATIONS_BUILT = true`. Without the native module, `nativeAvailable` is false: no ask, nothing scheduled, no crash.

**Deviations from the plan:**
1. **`app/plugins/withoutPushEntitlement.js`** (new, listed in `app.config.ts`): prebuild applies expo-notifications' own plugin automatically, and that plugin writes `aps-environment`. This plugin removes it again. After prebuild, `Kitted.entitlements` is an empty dict, with no `UIBackgroundModes`.
2. **`MorphPicker.tsx`** gains an optional `disabled` prop, so VoiceOver reads "dimmed" on the pill.
3. **`demo/applyDemoScreen.ts`** calls `prepareNudgeDemo`, after `prepareFinishDemo`.
4. **NT2.6's extra state** is two kv keys, `notify.checkAt` and `notify.checkDone` (`CHECK_NUDGE_KV` in `nudges.ts`). `nudgeLines` gains an optional `checkBefore` argument, true by default.
5. **Notify keys** are written through `setNotifyKv`, which accepts only `notify.` keys.
6. **Demo screens:** a demo screen turns the ask and the nudges on only with its own script. Demo screens never schedule anything real.
7. **The catch-up after a skip** comes one run later, so `onboardingFinish` E3 still holds.
8. **Loading the package:** `notificationsNative.ts` loads `expo-notifications` only once its native modules exist.

**The package:** `expo-notifications ~57.0.25` (commit e47e639a). `npx expo install` also patch-bumped expo-constants (57.0.21 → 57.0.23) and three of its dependencies, and added `badgin` and `expo-application` as expo-notifications' own dependencies.

**Demo screens:**
- **Kit's ask:**
  - 158: the ask
  - 159: waiting on Apple's prompt
  - 160: allowed, today
  - 280: allowed, tomorrow
  - 281: No thanks
  - 282: Don't Allow
  - 283: the catch-up
- **You → Notifications:**
  - 284: on
  - 285: never asked
  - 286: paused
  - 287: off in iOS
  - 86: a trial plan with no Trial ending row
- **The comeback:**
  - 288: the question
  - 289: Change the time
  - 290: back on
  - 291: No thanks

## Disputes
1. **`youSettingsHome.test.tsx` (T34), 3 tests.** These tests expect no `you-row-notifications` with `SettingsRows`' default, which reads `NOTIFICATIONS_BUILT`. That held only while the flag was false. The spec (NT3: the row "shows once notifications are built") and the locked `onboardingFinish` P3/P7 both need the flag true. T34 merged after T53's lock. Sent to the test-writer to judge.

## Not verified yet
- **The native Swift** (`beginBackgroundWork` / `endBackgroundWork`): not compiled yet. No Simulator build ran; two Simulators were booted by other sessions and memory was about 125 MB free.
- **Needs the Simulator build:**
  - NT2.1's pending list
  - NT2.4 and NT6.4, the real taps
  - NT5.4, AX5 and VoiceOver
  - the three T53 flows
- **Needs a real iPhone:** NT5.5 and NT6.6.
- **VoiceOver focus after an answer:** it uses `setAccessibilityFocus(findNodeHandle(view))`. Whether it lands under the new architecture is unchecked.
- **The You row without the native module:** T34's `SettingsRows.tsx` shows it on `NOTIFICATIONS_BUILT` alone. On a build without the native module the row shows, but its page can't ask. Nothing breaks.

# T53 · Notifications in the beta

**Size:** strict (it touches "Delete all my data" and the age lock) · **From:** `plan.md` → T53 · **Spec:** `specs/notifications.md` · **Lane:** Kit and the morning card

This task started under the old workflow. Its full plan is `IMPLEMENTATION.md`, its locked contract is `TESTING.md` (Lock `eb2a35e2`), its approved frames are `DESIGN.md` with `design/`, and its build record is `REPORT.md`. This page is the short version the reviewer reads.

## What changes
- **Goal:** a tester who says yes gets one notification a day, 15 minutes before he usually gets dressed. Before Kit can suggest outfits it asks him to check today's fit; once it can, it says today's idea is ready. He also gets "Fit check ready" if he left the app while a check was still being scored. You → Notifications controls both.
- **Files:**
  - `features/morning/` (nudges, nudge service, ready watch, tap routing, comeback card)
  - `features/finish/` (the one-step ask, the catch-up)
  - `services/notifications.ts`, `services/notificationsNative.ts`
  - `modules/kitted-vision` (background time in Swift)
  - `you/notifications.tsx`, `settings/SettingsList.tsx`, `settings/prefs.ts`
  - `privacy/wipe.ts`, `privacy/actions.ts`
  - `config/features.ts` (`NOTIFICATIONS_BUILT = true`)
  - `app.config.ts` and `plugins/withoutPushEntitlement.js`
  - `package.json` (expo-notifications)
  - the copy deck and `en.generated.ts`
- **Done means:** NT1.1–NT1.7, NT2.1–NT2.7, NT3.1–NT3.4, NT4.1–NT4.3, NT5.1–NT5.5 and NT6.1–NT6.6, as written in `specs/notifications.md`. NT1.8–NT1.10 are T57.
- **Must not break:**
  - the setup sequence's order;
  - the morning card's locked idea;
  - nothing new leaves the phone: no push token, no server code;
  - no `aps-environment` entitlement;
  - demo screens never schedule real notifications;
  - a build without the native module shows no ask and doesn't crash.

## Built
- **Changed:** see `REPORT.md` → Built (build commit `a95bd6e4`).
- **Tests:** the 7 T53 files plus the changed `onboardingFinish` and `settingsPrefs` tests, locked at `eb2a35e2`.
- **`npm run check`** (run step by step, because Watchman hangs on this Mac; Jest ran with `--no-watchman`):
  - `tsc`: passes.
  - core typecheck: passes.
  - `expo lint`: 0 errors, 15 warnings.
  - core: 851 of 853 pass in the full run; the 2 that failed timed out at 5 s under memory pressure, and both pass on their own (21 of 21).
  - app Jest: "Tests: 4 skipped, 1830 passed, 1834 total".
- **Screenshots:** not yet. Both Simulators are held by other sessions; they come after the native rebuild.
- **Not done or not checked:**
  - the native Swift isn't compiled yet;
  - real delivery and taps (NT2.1, NT2.4, NT6.4);
  - AX5 and VoiceOver (NT5.4);
  - the real-iPhone checks (NT5.5, NT6.6);
  - the three T53 Maestro flows.

## Disputes
- `youSettingsHome.test.tsx` (T34), 3 tests · they expected no Notifications row while `NOTIFICATIONS_BUILT` was false, but T53 turns it on · settled by: the test writer, against SY1 step 5 and NT3 · the tests were wrong; fixed in `69f41d36` (only those three, still exact, with a bite check).

## Review
Written by the reviewer.

### Round 1 (2026-11-10, strict; diff `origin/main...HEAD`; no screenshots yet)
**Criteria**
- NT1.1 done (`onboardingFinish` E5, `T53-notifyAsk`; posted once, after the closet card, skipped when `notify.asked` is set).
- NT1.2 done in code and copy (17 times, 8:00 default, the exact words); on screen: can't tell, no screenshots yet.
- NT1.3 done (only `notifyYes` and the two switches call `request()`; open, return, leave and posting never do).
- NT1.4 done (`when` fixed at the answer; 8:00 → 7:45 am).
- NT1.5 done.
- NT1.6 done (catch-up for `done`/`skipped`, permission undetermined, switch unset, once; serialized by `ensure()`).
- NT1.7 done (`patchNotify` never changes an answered card; `asked` blocks any second post).
- NT2.1 done in unit tests (7, one per local date, 15 min early, DST kept, no title, default sound); the real pending list: can't tell until the Simulator build.
- NT2.2, NT2.3, NT2.5, NT2.6, NT2.7 done (unit tests over every schedule call).
- NT2.4 done in unit tests (`nudgeTap.ts`); the real tap: can't tell until the Simulator build.
- NT3.1 done in code; on screen: can't tell, no screenshots yet.
- NT3.2, NT3.3, NT3.4 done in component tests; on screen: can't tell, no screenshots yet.
- NT4.1, NT4.2, NT4.3 done (unit and component tests).
- NT5.1 done (the wipe cancels first, then clears every `notify.` key; planted bug caught).
- NT5.2 done (no ask, no catch-up, nothing scheduled, no Fit check ready; two planted bugs caught).
- NT5.3 done (`T53-notifyCopy`; no emoji in the new strings).
- NT5.4 can't tell: needs AX5 and VoiceOver on the Simulator.
- NT5.5 can't tell: needs a real iPhone.
- NT6.1, NT6.2, NT6.3, NT6.5 done (the fix count dedupes by copy, as the card does; never the score).
- NT6.4 done in unit tests; the real tap: can't tell until the Simulator build.
- NT6.6 can't tell: needs a real iPhone, and the Swift isn't compiled yet.
- Screens (Kit's ask, the comeback, You → Notifications, against the frames): can't tell, no screenshots yet.

**Hard lines:** nothing about faces or bodies; no push token call anywhere, no server code, `expo-notifications` is imported only in `notificationsNative.ts`; the checked-in `ios/` entitlements are an empty dict (no `aps-environment`); no emoji, streaks or day counts; every new string matches the spec word for word.

**Strict checks**
- Test lock: `git diff eb2a35e2..HEAD` over every locked file and `TESTING.md` is empty. The one other test change, `youSettingsHome.test.tsx` in `69f41d36`, is the recorded dispute and is sound (the row now follows the build's switch, still exact).
- No `.only` or `.skip` in the T53 tests.
- `tsc` passes. Core typecheck passes. `expo lint`: "15 problems (0 errors, 15 warnings)", none in T53's app code. Core: "Tests 2 failed | 851 passed (853)", both in `parts.parity.test.ts`, timed out under memory pressure; alone, "Tests 8 passed (8)". The branch doesn't touch core, `firebase/` or `extraction-test/`. App Jest: "Tests: 4 skipped, 1830 passed, 1834 total".
- Planted bugs (each reverted, tree clean):
  1. `privacy/wipe.ts`: the wipe no longer cancels scheduled notifications → 2 locked tests fail.
  2. `morning/nudgeService.ts`: the age-lock check removed from `reschedule` → `NT5.2 · age-blocked: cancel, nothing scheduled, no comeback` and an NT4.1 test fail.
  3. `finish/sequence.ts`: `askDue` ignores the age lock → `NT5.2 · age-blocked: no ask, no catch-up`, an NT1.6 test and `onboardingFinish` E5 fail.

**Defects:** none open.

**Worth a later look (non-blocking)**
- `morning/nudgeService.ts` `resume()`: if iOS notifications were turned off after the comeback card posted, "Turn them back on" still shows "Back on. Next one lands…" though nothing is scheduled. Rare; the off card in You → Notifications tells the truth.
- `settings/SettingsRows.tsx` shows the Notifications row on `NOTIFICATIONS_BUILT` alone, so a build without the native module shows a page whose switch can't ask. Worse, flipping it there saves `notify.idea = '1'`, which later blocks Kit's ask and the catch-up after the rebuild. This only affects the founder's phone before its rebuild.
- `setReady` shows Apple's prompt from the Fit check ready switch. The plan and the locked tests chose this, but the spec's rule names only Send me ideas and the Daily outfit idea switch. Worth one line of the founder's OK, or a spec note.
- On a cold start from a tap, `lastTap()` and the response listener may both deliver the same tap. That means two navigations to the same card, which is harmless.
- `NotifyAskCard`: `finish.notifyYes(...).finally(...)` has no `catch`, so a native error becomes an unhandled rejection. The spinner still clears.
- T34's flow `T34-you-settings-home.yaml` line 112 (`assertNotVisible: "Notifications"`) needs a Simulator run now that the row shows (already in REPORT.md).

**Ready** on everything reviewable from here. The screen checks wait for the screenshots, and NT5.4, NT5.5, NT6.6 and the real taps wait for the Simulator build and a real iPhone.

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

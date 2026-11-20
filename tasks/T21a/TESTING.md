# T21a · Testing contract (strict)

Written by the session; tests written and locked by the test writer. The task's logic criteria go here, never words, labels or layout. **Locked once the Lock line is filled.** After that only the test writer changes this file or the tests, only to add or strengthen, with the reason in TASK.md → Disputes.

**Lock:** `<commit SHA>` · <date> · tests: `<path>`, `<path>`

## How the server is tested
`firebase/tests/api.test.ts` on the emulator (a real in-process handler, Firestore emulator, fake Gemini). Add `devices` to the collections cleared in `beforeEach`. A new request header `X-Kitted-Device: <id>` (16–64 characters: letters, digits, dashes). "Signs out" = a second `signUp()` (a new guest uid) sending the same device ID. Beta/free numbers are the ones already in `limits.ts`. The device document id is `sha256(deviceId)` as lowercase hex; its day lives at `devices/{hash}/usageDays/{day}`.

## Criteria
- **F10.1·a (the gap)** · a guest uses its day's checks on phone D; a new guest uid on D is refused the next new check with `429 {error:'limit', which:'checks'}` · how: server emulator · expect: refused with the same body as an account over its limit · must not: the new uid starting from zero · test: `api.test.ts` › `F10.1 · a new guest on the same phone is still refused (checks)`
- **F10.1·b** · the same for questions: after the day's questions on D, a new guest's next question is `429 limit` with `which:'questions'` · test: › `F10.1 · ... (questions)`
- **F10.1·c (a phone is the unit, not the world)** · a new guest on a different phone D2 is untouched and passes · must not: refusing D2 · test: › `F10.1 · another phone is untouched`
- **F10.1·d (retry on a counted check)** · on the same phone, a new uid calling again on a check id the phone already counted today is not a new check: it passes while the phone's day has no room for new ones, and counts no extra check · test: › `F10.1 · the same check id on the same phone isn't counted twice`
- **F10.1·e (no half-write)** · when the phone's day refuses, the new account's own day is not changed (nothing counted); when the account's day refuses, the phone's day is not changed · how: read the two day docs after the refusal · test: › `F10.1 · a refusal on either side counts nothing on the other`
- **F10.1·f (give back on both)** · a failed, timed-out or unfinished read gives the check back on the account's day and on the phone's day (a retry then passes) · test: › `F10.1 · a failed read gives the check back on both days`
- **F10.1·g (the day cannot be moved)** · a new guest on the same phone that asks for a different time zone (`X-Kitted-Tz`) inside 20 h is still on the phone's own day, so the refusal stands; the phone's tz change is taken only after 20 h (same rule as L8) · test: › `F10.1 · a new guest cannot move the phone's day with a time zone`
- **F10.1·h (the header)** · a malformed device ID (too short, bad characters, over 64) → `400 {error:'badRequest', reason:'device'}` before anything is counted; no header → behaves as today (account only); with `server/config.requireDevice: true`, no header → `400 badRequest reason 'device'`; `requireDevice` missing or non-boolean means false · test: › `F10.1 · the device header`
- **F10.1·i (privacy: what is stored)** · the phone's document id is the sha256 hex of the ID, never the ID itself; no document under `devices/` and no log line (`log` entries) contains the raw ID; the only fields on the phone's documents are the day's counts, `ids`, `at` and the tz fields (`tz`, `tzChangedAt`): no uid, no text, no photo field · how: read every doc under `devices` with the Admin SDK and scan the log array · must not: the raw ID, the uid, any other field · test: › `F10.1 · the phone's record holds only a hash and counts`
- **F10.1·j (the purge)** · the existing daily sweep of `usageDays` older than `USAGE_DAYS` also removes `devices/*/usageDays` days · how: `functions.test.ts` (existing sweep harness) · test: `functions.test.ts` › `F10.1 · the sweep also clears the phone's old days`
- **F10.1·k (the same rules otherwise)** · L10: two accounts with no device header or different phones stay apart; the founder tier and `GET /v1/tier` answer as before (the tier route never counts) · test: existing L10 and tier tests keep passing (exists: bites via a deliberate bug)
- **F10.1·l (app)** · the app sends `X-Kitted-Device` on photo and ask calls: the same ID on every call; one is made and saved to the Keychain only when none exists; the ID is the same after a simulated sign-out (a new guest token, same Keychain) · how: jest (`--maxWorkers=2`) on `serverTransport` with a fake `fetch` and a fake Keychain · must not: a new ID per call or per guest · test: `app/src/__tests__/serverDevice.test.ts` › `F10.1 · the device ID is sent and stable across a sign-out`

## Not testable yet
Never dropped, never counted as done.
- **F10.1 against a script that rotates the device ID** · why: without App Check anyone can send a fresh ID (they can also make fresh guests with Firebase's public key) · would verify it: T23 (App Check) with `enforceAppCheck` on and `requireDevice` on
- **F10.1 after "Delete all my data"** · why: the wipe clears the Keychain ID, so the phone looks new (the open decision in plan.md: DeviceCheck, T20) · would verify it: T20/T21 with Apple's DeviceCheck
- **The 7 free checks for life** · why: not in this slice · would verify it: T21
- **Real iOS Keychain across a real sign-out** · why: the Keychain is faked in jest · would verify it: the founder's phone test with T41's sign-out (a Y item)

# T21a · Count each day per phone, not only per account

**Size:** strict (a device ID leaves the phone: privacy, the founder, Nov 19) · **From:** `plan.md` → T21 (first slice, built ahead of T20) · **Spec:** `specs.md` → F10.1, and the Data table row "Usage counts … by device ID (+ account)" · **Lane:** Server
**Plan:** the session notes folder, `T21a-per-phone-counts-plan.md` (the reasoning, what it does not fix).

## What changes
- **Goal:** a guest who uses the day's limit, signs out and gets a new guest ID on the same phone is still refused. Today the new ID starts from zero.
- **Files:** `app/src/services/server/transport.ts` (sends `X-Kitted-Device`; a `device` option), `app/src/services/server/index.ts` (wires it) and a small `deviceId()` in `app/src/services/server/` that reads the Keychain ID through `data/secure.ts` and makes and saves a random one if none · `firebase/functions/src/api/handler.ts` (shared; small change: read the header, validate, pass to the store, `requireDevice`) · `firebase/functions/src/api/store.ts` (also reads and writes `devices/{sha256(id)}/usageDays/{day}`; `Config.requireDevice`) · `firebase/tests/api.test.ts` (clear `devices` between tests).
- **Not touched:** `app/src/features/account`, `app/src/sync`, `privacy/wipe.ts`, storage rules (T41/T41b); `limits.ts`'s rules.
- **Done means:** a guest who used its limit, signed out and got a new guest ID on the same phone is still refused; the server stores only a hash and counts; no new words or cards.
- **Must not break:** accounts apart on different phones (L10); the founder tier and the tier route; a call with no device header (old builds) behaves as today; a refused call counts nothing; failed reads give the check back.
- **Decided (the founder, Nov 19, "Count stays"):** "Delete account and all data" leaves the phone's hashed count. T42 must not delete `devices/*`. Needs one privacy line, drafted in the PR and shipped only on his yes. The App Store privacy label will need "Device ID, app functionality" (his, in App Store Connect).

## Built
(filled in after the build)

## Disputes

## Review

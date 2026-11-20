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
- **Server:** a call may carry `X-Kitted-Device` (16-64 letters, digits, dashes); a bad one is `400 badRequest / device`, a missing one is allowed unless `server/config.requireDevice` is true (default false, only a real `true` counts). The handler hashes it (sha256) and the store counts the day on the account and on `devices/{hash}/usageDays/{day}`: the phone has its own time-zone record (`devices/{hash}`: `tz`, `tzChangedAt`, L8's 20 h rule), both days must say yes and only then both are written, and `finish` gives the check back on both (the Ticket carries `{hash, day}`). The raw ID is never stored or logged. The sweep already covers `devices/*/usageDays` (collection group), so `index.ts` is unchanged.
- **Extra fix in `store.ts` (not in the tests' list):** the config cache treated a clock that went backwards as fresh (`now() - at < ttl` is true when negative), so a stale config could be served; it now needs age >= 0. The emulator run exposed it (one test moves the clock forward, the next test's clock starts earlier).
- **App:** `deviceId.ts` reads the Keychain ID (`getDeviceId`), makes a random UUID with expo-crypto and saves it (`setDeviceId`) if none; calls that start together share one lookup. `serverTransport` takes a `device` option and sends `X-Kitted-Device` on photo and ask calls (not the tier GET); if the Keychain can't be read the call goes without it. Wired in `services/server/index.ts`. Where expo-crypto's native module is missing (jest, web preview) it falls back to a Math.random ID.
- **Files:** `firebase/functions/src/api/handler.ts`, `firebase/functions/src/api/store.ts`, `app/src/services/server/deviceId.ts`, `transport.ts`, `index.ts`.
- **Results:** emulator run: 95 of 95 pass. App jest: 180 suites, 2903 passed (the 3 device tests included). `npm run check`: tsc, lint and the full jest pass, but its `@kitted/core` vitest step fails on one timeout (the parts parity test, 5.4 s against the 5 s limit; a core file this task does not touch, on a loaded Mac), so `check` as a whole did not finish green.
- **Demo screens:** none (no user-visible change). Not done: the privacy line and App Store label (the founder's); the T23/T20 gaps listed in the testing contract.

## Disputes

## Review

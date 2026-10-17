# 13 · The server: the AI proxy on Firebase

*Oct 17, 2026. DECISIONS-LOG #326 (replaces #268's "the Cloudflare Worker stays the AI proxy" and app-build-spec §3.3's Worker + D1). Owns: the server that stands between the app and Google's Gemini: its routes, who may call it, the daily limits, the spending stop, what it keeps and logs, and the pass/fail checks. Code: `firebase/functions/src/api/`. Tests: `firebase/tests/api.test.ts`.*

## 0. The short version

- **Why it exists:** a Release build has no Gemini key (it's dev-only), so outside testers can't score a photo or ask a question. The server holds the key and makes those calls for the app.
- **Where:** one Cloud Function (2nd gen) named `api` in the Firebase project `kitted-a5b45`, region us-central1, next to the database and sign-in that already exist. Founder's call, Oct 17 ("Go with Firebase Cloud Functions").
- **What it does on every call:** checks who's asking (a Firebase sign-in token, a silent guest account is enough), checks today's limit, checks the day's spend, passes the request to Gemini with its own key, relays the answer back as it arrives (streamed), then counts it.
- **What it keeps:** per account per day, the counts and the check ids that used them; per day, the estimated spend. Never a photo, a reading, a question or an answer. Logs hold the account id, route, model, milliseconds, tokens, cents and the outcome, never content.
- **Live since Oct 17 (#327):** `https://us-central1-kitted-a5b45.cloudfunctions.net/api`, with its own Gemini key in Secret Manager, Anonymous sign-in on, no warm instance. The app side is merged (#328, §8, §10): every Release build sends its AI calls here with a silent guest sign-in, and so does the founder's dev build since Oct 17 (`EXPO_PUBLIC_KITTED_SERVER=live`). A custom domain (`api.<the founder's domain>`) can point at it later without changing the server.

## 1. Why the request is passed through (not built on the server)

The app already builds byte-exact Gemini requests (the Oct 6 lock, the close-ups, the closet stub list, the stylist's pack). Moving the prompts to the server would mean two copies to keep in step. So the app sends the same request body it sends Gemini today, and the server **checks its shape strictly** before forwarding:

- the model must be on the route's list;
- only `contents` and `generationConfig` at the top level (plus `systemInstruction` on `/v1/ask`); no tools, cached content, safety settings or file links;
- parts are text or `inline_data` JPEG only, with a cap on images per route;
- the body has a size cap per route;
- `maxOutputTokens` is set to the route's cap if missing or higher.

**The trade-off, stated:** someone who pulls a sign-in token out of the app could send their own prompt through a route, within that route's shape and the daily limits. The limits, the per-day call budget and the spending stop cap what that can cost. App Check (after the $99 program) makes it much harder. Building the prompts on the server stays possible later without changing the app's screens.

## 2. Routes

Base URL (once live): `https://us-central1-kitted-a5b45.cloudfunctions.net/api`. The model is a query parameter (`?model=`), defaulting to the route's first model.

| Route | What it is | Models | Gemini call | Images | Body cap | Output cap | Counts as |
|---|---|---|---|---|---|---|---|
| `GET /v1/health` | warms the instance (the camera calls it) | — | none | — | — | — | nothing; no sign-in needed |
| `POST /v1/read` | the scoring read (photo + close-ups) | gemini-3.8-flash | streamed | ≤ 3 | 8 MB | 8,192 | a check, re-check or snap (see §3), once per check id |
| `POST /v1/look` | the second look (one arm) | gemini-3.8-flash | one reply | 1 | 4 MB | 2,048 | a call on that check id |
| `POST /v1/closet` | the closet call | gemini-3.8-flash | one reply | 1 | 4 MB | 8,192 | a call on that check id |
| `POST /v1/ask` | a stylist question | gemini-3.5-flash-lite, gemini-3.8-flash | streamed | 0 | 64 KB | 1,024 | a question, when the answer finishes |

**Headers the app sends:**
- `Authorization: Bearer <Firebase ID token>` (every route but health);
- `X-Firebase-AppCheck: <token>` (once App Check is on);
- photo routes: `X-Kitted-Check: <check id>` (the app's own id for the check, 1–64 of `A–Z a–z 0–9 _ -`) and `X-Kitted-Kind: full | recheck | snap`;
- `/v1/ask` from a tap answer: `X-Kitted-Free: tap`;
- `X-Kitted-Tz: <minutes east of UTC>` (−720 … 840), for the 4 am day.

**Answers:** Gemini's own body and status on success (SSE for the streamed routes, JSON for the others), so the app's parsers stay as they are. Refusals are JSON `{ "error": code }`:

| HTTP | `error` | When | The app shows |
|---|---|---|---|
| 401 | `signIn` | no, bad or expired sign-in token | retry after refreshing the token, then the failure line |
| 401 | `appCheck` | App Check required and missing or bad | the failure line |
| 400 | `badRequest` (+ `reason`) | the shape check failed | the failure line |
| 413 | `tooBig` | over the route's body cap | the failure line |
| 429 | `limit` (+ `which`: `checks`, `rechecks`, `snaps`, `questions`, `calls`) | today's allowance is used | the limit card / line |
| 503 | `paused` | the day's spend reached the cap | "Questions are paused for a bit. Nothing was counted." / the check failure line |
| 502 | `upstream` (+ `status`) | Gemini refused or failed | the failure line, nothing counted |
| 504 | `timeout` | Gemini took longer than 30 s | the failure line, nothing counted |

## 3. Limits

**Tiers** (same numbers as the app's `LIMITS`, `app/src/services/quota.ts`): free = 1 check, 1 re-check and 5 questions a day; Pro = 10 checks, 10 re-checks and 50 questions. **During the beta every account gets Pro's limits** (the founder's open P1 call, built with Claude's default), set in the config document (§5) so it changes without a deploy. Purchases aren't verified yet, so the server never trusts the app's Pro claim.

**The day** rolls over at 4 am in the account's time zone (core's `dayKey`), from `X-Kitted-Tz`. A change of time zone is accepted once every 20 hours, so switching zones can't open a new day on demand.

**Checks, re-checks and snaps** (photo routes):
- The first call that names a new check id reserves it for its kind: `full` against checks, `recheck` against re-checks (never more re-checks than checks counted that day, but always at least one, for a re-check that crosses 4 am), `snap` (the shoe snap, the pants-and-shoes finish) against snaps (at most 2 per check or re-check counted that day).
- Every later call with the same check id (a hedge, the two second-look arms, the closet call and its retry) is free, up to **10 calls per check id**.
- **Failures never use a check:** only a `/v1/read` that finishes with `STOP` marks the check as used. When every call on a check id has ended and none was a finished read, the reservation is let go.
- **A daily call budget** backs this up, because released reservations would otherwise allow endless failed calls: photo calls ≤ 10 × (the check limit + the re-check limit), ask calls ≤ 3 × (the question limit + 12).

**Questions:** one is counted when its answer finishes with `STOP`. The server allows **2 more than the visible limit**, because the app doesn't count an answer its sentence gate empties ("It doesn't count."), which the server can't see. A tap answer (`X-Kitted-Free: tap`) is free up to 10 a day, then counts like a question.

## 4. The spending stop

- Each Gemini call's cost is estimated from its `usageMetadata` (prompt, cached, output and thinking tokens) and the price table in `market/ai-costs.md` §1 (3.8 Flash doubles on Jan 1, 2027; the table carries both). An unknown model is priced as the most expensive one.
- The estimate is added to `spend/{UTC date}`. At or above the cap (**$3.00 a day** by default), every AI route answers `503 paused` before calling Gemini, until midnight UTC. Health still answers.
- The Google Cloud budget alert ($10 a month) is the second line.

## 5. What it stores (Firestore, Admin SDK only; clients can't read or write any of it)

| Path | Holds | Removed |
|---|---|---|
| `usage/{uid}` | the account's time zone offset and when it last changed | with the account |
| `usage/{uid}/usageDays/{day}` | counts (checks, re-checks, snaps, questions, free taps, photo calls, ask calls) and, per check id: its kind, calls, calls in flight, whether a read finished | after 7 days (`purgeUsage`, daily), and with the account (`deleteEverything`) |
| `spend/{UTC date}` | cents, calls | after 90 days (`purgeUsage`) |
| `server/config` | `tier` (`free` / `pro`), `spendCapCents`, `enforceAppCheck`, `timeoutMs` | edited by hand in the console; defaults in code when missing |

**This changes 11 §0's "never on our servers: usage counts"** for the server's own copy: the counts the limits need, keyed by account, kept 7 days, never synced or shown. The phone's own usage table still never syncs.

## 6. Going live (done Oct 17, #327)

1. ✔ A **new Gemini API key** made only for the server (made by the founder in AI Studio under kitted-a5b45; version 1 stored Oct 17; checked with Google without printing it) (the dev key stays in dev builds and is replaced before launch anyway), stored with `firebase functions:secrets:set GEMINI_KEY`.
2. ✔ **Anonymous sign-in** turned on (Oct 17, by the Identity Toolkit admin API on the founder's login: the console's own switch).
3. ✔ `firebase deploy --only functions:api,functions:purgeUsage,firestore:indexes --project kitted-a5b45` (the index makes the daily purge work), then one real check and one question through it.
4. **Keep one instance warm or not: no for the beta** (founder, Oct 17). At 1 vCPU + 0.5 GB idle, one always-on copy is ≈ $9.70 a month, ≈ $8.40 after Cloud Run's free allowance; without it the server sleeps and costs ≈ $0 at beta size. Setting: (`API_MIN_INSTANCES` in `firebase/functions/src/index.ts`, 0 today): removes the 1–2 s wake-up on the first call; costs money every month (price checked before asking).
5. After the $99 program: App Check (a native package, the founder's OK) and `enforceAppCheck: true`.

The app side (Release builds call the server; dev builds keep the direct key) is built: §8, §10. After the deploy, a dev build can try the live function with `EXPO_PUBLIC_KITTED_SERVER=live` in `app/.env.development.local`.

## 7. The pass/fail checks (set before building)

Run with `npm --prefix tests run emulate` from `firebase/` (Firestore and Auth emulators; a fake Gemini on a local port; the handler runs in the test process with its real Firestore and Auth code).

### P · Plumbing and safety
- **P1 Health:** `GET /v1/health` answers 200 with no sign-in and calls nothing.
- **P2 Sign-in:** no token, a malformed token or a token from another project → 401 `signIn`; Gemini is never called. A guest (anonymous) account's token works.
- **P3 App Check:** with `enforceAppCheck` on, a missing or bad App Check token → 401 `appCheck`; with it off, a request without one passes, but a present bad one is still refused.
- **P4 The key:** Gemini receives the server's key in `x-goog-api-key`; no header the app sends reaches Gemini; no answer or error the app gets contains the key.
- **P5 Shape:** each refused before calling Gemini: an unknown route (404), a wrong method (405), bad JSON, a model not on the route's list, `tools` or `cachedContent`, a `file_data` part, a PNG, too many images, images on `/v1/ask`, `systemInstruction` outside `/v1/ask`, a body over the cap (413), a missing or malformed check id or kind on a photo route. `maxOutputTokens` reaches Gemini clamped to the route's cap, or added when missing; everything else reaches Gemini unchanged.
- **P6 Relay:** a streamed route's first chunk reaches the app before Gemini has finished; the bytes the app gets equal the bytes Gemini sent; a one-reply route returns Gemini's JSON unchanged.
- **P7 Hang-up:** when the app disconnects mid-stream, the Gemini call is aborted.
- **P8 Timeout:** Gemini slower than the timeout → 504 `timeout`, nothing counted.
- **P9 Gemini fails:** a 500 or 429 from Gemini → 502 `upstream` with its status, nothing counted.

### L · Limits
- **L1 One check:** on the free tier, the first full check passes; a second new check the same day → 429 `limit` `checks`.
- **L2 Same check, more calls:** a hedge, two look arms and two closet calls on the same check id pass and count nothing more; the 11th call on one check id → 429 `calls`.
- **L3 Failures are free:** a read that fails (Gemini 500, a timeout, or a finish that isn't `STOP`) leaves the check unused: a new check passes afterwards. A look that fails while its read succeeds still counts the check once.
- **L4 Re-checks:** one re-check after a counted check passes; a second → 429 `rechecks`. With no check counted today, one re-check still passes (a re-check that crosses 4 am), a second doesn't.
- **L5 Snaps:** two snaps per counted check pass; a third → 429 `snaps`.
- **L6 Questions:** 5 + 2 finished answers pass on free; the next → 429 `questions`; a failed answer isn't counted; tap answers are free up to 10, then count.
- **L7 Pro:** with `tier: pro` in the config, the 10th check passes and the 11th is refused; questions stop at 52.
- **L8 The day:** at 3:59 am local the old day's counts apply; at 4:00 am a new allowance starts; a time zone change inside 20 h is ignored.
- **L9 Call budget:** failed reads on fresh check ids stop at the daily photo-call budget (429 `calls`), even though none of them used a check.
- **L10 Accounts apart:** one account's usage never limits another's.

### M · Money
- **M1 Cost:** a call's cents follow its `usageMetadata` and the price table (3.8 Flash's price doubles from Jan 1, 2027; thinking and output tokens at the output price, cached tokens at the cache price).
- **M2 The stop:** with the day's spend at the cap, every AI route answers 503 `paused` without calling Gemini and counts nothing; health still answers; the next UTC day it works again.

### D · Data
- **D1 Nothing kept:** after a run with a photo and a question, no Firestore document holds base64 image data, the question's words or the answer's words; the log lines hold neither.
- **D2 Rules:** a signed-in client can't read or write `usage/…`, `spend/…`, `server/…` (its own uid included).
- **D3 Deletion:** `deleteEverything(uid)` removes `usage/{uid}` and its days; `purgeUsage` removes usage days older than 7 days and spend days older than 90.

## 8. The app side (#328; checks set before building, results in §10)

**What it is:** the app's four Gemini callers (the scoring read, the second look's two arms, the closet call, the stylist's answer) send the same request bodies to the server's routes instead of to Google, with a guest sign-in. Code: `app/src/services/server/`.

- **Which way a call goes:** a Release build always uses the server (it has no key). A dev build uses the dev key straight to Gemini, as today, so the founder's phone works without the server, unless `EXPO_PUBLIC_KITTED_SERVER` is set in `app/.env.development.local`: `live` = the deployed function, a host like `127.0.0.1` = the local Functions emulator (project `demo-kitted`, its Auth emulator on :9099). A dev build with neither key nor setting keeps the demo-only reading, as today.
- **The guest account:** an anonymous Firebase sign-in, made the first time a call needs it (after consent, since nothing is sent before it), never at launch: a launch-time sign-in would reach Google before he agreed to anything (the same reason the offline check doesn't probe Google, #325). The SDK keeps it in the Keychain and refreshes its token. Continue with Google while a guest links Google to the same account (same uid, same day's counts).
- **Headers:** `Authorization: Bearer <ID token>`, `X-Kitted-Tz` (minutes east of UTC, from the app's own clock), and on photo routes `X-Kitted-Check` + `X-Kitted-Kind`: a check's read, its hedge, both look arms and its closet call carry the check's own id; a re-check its own id with `recheck`; a snap (shoe snap, pants-and-shoes finish) `<first check id>-snap` with `snap`, on its read and its closet call. A tap answer adds `X-Kitted-Free: tap`. The model rides as `?model=`.
- **The server's answers:** 401 `signIn` → a fresh token (forced refresh) and one retry, then the failure line; 429 `limit` → a check's card says it's today's limit (and the phone's count is set to used, so the next photo is held for tomorrow), a question gets the limit line; 503 `paused` → the check's paused card, the questions' paused line with no Retry; 502/504 → the existing failure lines; nothing counted on any of them. The second look and the closet call fail quietly, as they do today.
- **The tier:** every answer carries `x-kitted-tier`; the phone keeps it, and when it's `pro` (every account during the beta) the phone's own limits are Pro's (10 checks, 50 questions), without calling him Pro anywhere.

### The pass/fail checks (A, app side)
Jest unless noted (`app/src/__tests__/serverProxy.test.ts`).
- **A1 Which way:** dev + key + no setting → Gemini's URL with the key in `x-goog-api-key`, the server never called; Release (no key) → the server only, never Google's URL, no key header; dev + `EXPO_PUBLIC_KITTED_SERVER` → the server even with the key; dev without key or setting → no live source.
- **A2 Same bodies:** for read (with close-ups), each look arm, the closet call and an answer, the body the server receives is byte-equal to the one the direct path sends Gemini; the URL is `<base>/v1/<route>?model=<model>`.
- **A3 Headers:** the bearer token on every call; the read, its hedge, both look arms and the closet call of one check carry that check's id and `full`; a re-check its own id and `recheck`; `X-Kitted-Tz` is the clock's offset in minutes east; `X-Kitted-Free: tap` only on a tap answer; never `x-goog-api-key` to the server.
- **A4 Snaps:** a snap's read and its closet call carry `<first check id>-snap` and `snap`; every id sent matches the server's pattern (1–64 of `A–Z a–z 0–9 _ -`).
- **A5 Guest sign-in:** no account → exactly one anonymous sign-in even when the read and both arms start together, then its token; an existing account (guest or Google) → none; the saved sign-in is awaited first (no new guest per launch); a failed sign-in → the check fails "couldn't score" (offline when it's the network), nothing counted.
- **A6 401:** one forced refresh and one retry; a second 401 → the failure line, nothing counted, no third call.
- **A7 Limit:** 429 `limit` on a check → the card's limit line (`fail.limit`), nothing counted, and the phone's count says used (the next photo is held); on a question → the limit line, the question not counted; on a tap answer → the same line.
- **A8 Paused:** 503 on a check → `fail.paused`; on a question → `ask.paused`, no Retry, not counted; on a look arm or the closet call → a quiet failure (no retry for the closet call).
- **A9 Other failures:** 502 and 504 → `fail.ai` / `fail.ask` with Try again / Retry, nothing counted; a network error → the offline path.
- **A10 Tier:** an answer with `x-kitted-tier: pro` → the phone's limits become 10 checks and 50 questions, kept across launches; the You tab's plan row still doesn't say Pro; the direct path never sets it.
- **A11 Google keeps the uid:** Continue with Google while a guest links the credential (same uid); if that Google account already has a Firebase account, it signs in to it instead.
- **A12 Release bundle:** `npm run guard:release` passes; the production bundle holds the server URL and no Gemini key.
- **A13 End to end (Simulator):** a dev build pointed at the Functions emulator (fake Gemini replaying a recorded reading) scores a real, non-demo photo: the card shows a score; the emulator saw the read, the look arms and the closet call on one check id; the server counted one check.

## 9. Results (Oct 17)

**All checks pass: 43 server checks (P1–P9, L1–L10, M1–M2, D1, D3) plus D2 in the rules file, 60 of 60 with the earlier R and F checks** (`npm --prefix tests run emulate` from `firebase/`, ~7 s on the emulators).

| Check | Result | Note |
|---|---|---|
| P1 | Pass | 200, no Gemini call |
| P2 | Pass | no token, `not-a-token` and a token for another project → 401; a guest token from the Auth emulator works |
| P3 | Pass | fake verifier (App Check has no emulator) |
| P4 | Pass | Gemini sees only our key; the app's Authorization, App Check and check headers never reach it; the key is in no answer, error or log line |
| P5 | Pass | 17 refusals, none reaching Gemini; the cap clamped (99,999 → 1,024) or added (8,192), the rest byte-equal after re-serializing |
| P6 | Pass | the first chunk reached the test while the fake held the rest; bytes equal |
| P7 | Pass | the fake saw its connection closed early; the check was given back |
| P8–P9 | Pass | 504 after 300 ms (the test's timeout); 502 with 500 and 429 |
| L1–L10 | Pass | as written; L2 needed the read first (a look alone is given back by design, L3) |
| M1–M2 | Pass | 4,000 in / 800 out on 3.8 Flash = 0.60¢ |
| D1 | Pass | no image data, question, prompt or answer in Firestore or the log lines |
| D2 | Pass | `usage`, `spend`, `server/config` refused to a signed-in client, own uid included |
| D3 | Pass | `deleteEverything` removes `usage/{uid}`; `purgeUsageBefore` keeps the 2-day-old usage day and the 29-day-old spend day |

**The deployed shape, smoke-run** (`npm --prefix tests run smoke`: the real `api` function under the Functions emulator, the key from `functions/.secret.local`, a fake Gemini): health 200; a read without a check id 400; a 600 KB photo streamed back with the first chunk at **50 ms** while the fake took 300 ms to finish; a second free check 429 `checks`; a question 200. The function's own log lines carry the uid, route, model, ms, tokens and cents only.

**Found on the way:**
- **Params with defaults still prompt** ("Enter an integer value for API_MIN_INSTANCES") on every emulator run, and would on deploy; the warm-instance count and the Gemini URL are plain values instead.
- **The ledger settles before the answer ends:** an app retrying right after a failure would otherwise race the give-back and be refused.
- **Released reservations needed a call budget:** without it, failed reads on fresh check ids were free forever (L9).
- **An answer cut short is still billed** by what was seen of it; the spend counts it.

**Not tested here (needs the live project):** real Gemini through the server, App Check with a real token, the 1–2 s wake-up of a cold instance, and the purge's collection-group index on real Firestore.

**Live, Oct 17 (#327):** deployed `api` and `purgeUsage` (us-central1, Node 22, 2nd gen) and the indexes; old server images are deleted after 1 day (Artifact Registry cleanup policy). Google sized `api` at 1 vCPU, 512 MiB, 80 at once, no minimum instances.
- **Health:** 200 in 0.14–0.21 s; a request with no sign-in → 401 `signIn`.
- **One real fit check** (a guest account; `ig-001`, a public screenshot, face-hidden, the app's exact request with the two close-ups, profile unknown: a plumbing test, not a scoring one): 200, `STOP`, 4 pieces read, first bytes at 4.0 s, done in 8.0 s (7.75 s on the server's clock), 4,142 tokens in / 759 out, 0.595¢.
- **One question** (Flash-Lite): 200, first words 0.85 s, done 1.1 s, 0.008¢. "White leather low-top sneakers keep the look clean and casual…"
- **The server's records:** `spend/2026-10-17` 0.60¢ over 2 calls; the guest's day shows 1 check (its check id) and 1 question; the log lines carry ids, model, ms, tokens and cents only.
- **Left behind:** the test guest accounts in Firebase Auth (harmless; deletable in the console).

## 10. Results, the app side (Oct 17, #328)

**All checks pass: A1–A12 in Jest (28 tests, `app/src/__tests__/serverProxy.test.ts`), `npm run check` green in `app/` (1,283 tests), `npm run guard:release` passes, and A13 on the Simulator.**

| Check | Result | Note |
|---|---|---|
| A1 | Pass | `aiPathFor`: Release → the server whatever the env; dev + key → Gemini; `live` / a host → the server; neither → none (the demo-only reading, as before) |
| A2 | Pass | read with 2 close-ups, look U and L, the closet call and an answer: the five bodies the server gets equal the direct ones byte for byte; URLs `<base>/v1/<route>?model=` |
| A3 | Pass | through the real fit-check and closet services against a fake server: read, both arms and the closet call carry the check's id + `full`, `Bearer`, `X-Kitted-Tz: -240`; a hedged read keeps the id; a re-check its own id + `recheck`; `X-Kitted-Free: tap` only on a tap |
| A4 | Pass | a shoe snap's read and closet call: `<id>-snap` + `snap`; long and odd ids cleaned to the server's pattern |
| A5 | Pass | three calls at once → one anonymous sign-in; a saved account → none (its load awaited); network failure → offline, sign-in off → "couldn't score", the server never called |
| A6 | Pass | 401 → forced refresh, one retry; two 401s → `ai`, 2 calls |
| A7 | Pass | a check: `failCode: limit` (`fail.limit`), nothing counted, the phone's count goes to used and the next photo is held without a call; a question and a tap answer: the limit line, not counted |
| A8 | Pass | `fail.paused`; `ask.paused` with no Retry; a look arm fails `ai`; the closet call isn't retried |
| A9 | Pass | 502/504 → `fail.ai` / `fail.ask` with Retry, nothing counted; a network error → offline |
| A10 | Pass | `x-kitted-tier: pro` → 10 checks / 50 questions on the phone, a second check that day scores instead of being held; `purchased` stays false, the plan row reads it |
| A11 | Pass | `keepGuest`: a guest links; "credential already in use" → sign in to that account; non-guests sign in |
| A12 | Pass | the dev key is read once, in `services/server/config.ts`, under `__DEV__`; the production bundle holds the server URL and no key (guard, 3 secret values and every key shape checked) |
| A13 | Pass | Simulator, dev build with `EXPO_PUBLIC_KITTED_SERVER=127.0.0.1`, the real `api` under the Functions emulator (`npm --prefix tests run appserve`), fake Gemini replaying s15's recorded reading. Two real library photos (stock, profile unknown, not demo photos): prep blurred the face on the phone, the app signed in as a guest on the Auth emulator, and the card scored 7.0 "Put together". The function's ledger for that guest: `checks: 1`, `photoCalls: 5` (read, its hedge, both look arms, the closet call), the app's check id with `kind: full, ok: true`; the fake saw only the server's key. Screenshot `screenshots/server-app/` (git-ignored) |

**Found on the way:**
- **The look arms can reach the server before the read**, and an arm that finishes first gives the check back (by design, L3); the read then reserves it again. Counted once either way (A13's ledger shows the second reservation's 4 calls under 5 photo calls).
- **The Functions emulator's first call of a run takes 4–5 s**, so the app hedged its read; both reads carried the same id and rode free. A cold deployed instance should be faster, but the warm-instance question (§6.4) is the same one.
- **No sign-in at launch:** a launch-time guest sign-in would reach Google before consent, so it happens on the first call that needs a token (after consent). The first check of a fresh install waits one sign-in round trip.
- **The phone's limits now follow the server's tier**; without it a beta tester's Release build would hold his second photo of the day (the phone's free tier) while the server allows 10.
- The Simulator's stand-in camera always sends the bundled sample (scored on the phone, never sent); a real photo needs "Choose from your photos".

**Not tested here:** the deployed function (needs the founder's go), App Check, Apple sign-in (waits for the $99 program), Continue with Google linking against real Firebase (A11 is the pure rule; the link call itself needs a real Google sign-in on the phone).


# 13 · The server: the AI proxy on Firebase

*Oct 17, 2026. DECISIONS-LOG #326 (replaces #268's "the Cloudflare Worker stays the AI proxy" and app-build-spec §3.3's Worker + D1). Owns: the server that stands between the app and Google's Gemini: its routes, who may call it, the daily limits, the spending stop, what it keeps and logs, and the pass/fail checks. Code: `firebase/functions/src/api/`. Tests: `firebase/tests/api.test.ts`.*

## 0. The short version

- **Why it exists:** a Release build has no Gemini key (it's dev-only), so outside testers can't score a photo or ask a question. The server holds the key and makes those calls for the app.
- **Where:** one Cloud Function (2nd gen) named `api` in the Firebase project `kitted-a5b45`, region us-central1, next to the database and sign-in that already exist. Founder's call, Oct 17 ("Go with Firebase Cloud Functions").
- **What it does on every call:** checks who's asking (a Firebase sign-in token, a silent guest account is enough), checks today's limit, checks the day's spend, passes the request to Gemini with its own key, relays the answer back as it arrives (streamed), then counts it.
- **What it keeps:** per account per day, the counts and the check ids that used them; per day, the estimated spend. Never a photo, a reading, a question or an answer. Logs hold the account id, route, model, milliseconds, tokens, cents and the outcome, never content.
- **Not live yet.** Built and tested on the Firebase emulators with a fake Gemini. Going live needs the founder's OK (a new Gemini key in Secret Manager, a deploy, and whether to keep one instance warm).

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

## 6. Going live (founder's OK, step by step)

1. A **new Gemini API key** made only for the server (the dev key stays in dev builds and is replaced before launch anyway), stored with `firebase functions:secrets:set GEMINI_KEY`.
2. **Anonymous sign-in** turned on in the console (the silent guest account).
3. `firebase deploy --only functions:api,functions:purgeUsage,firestore:indexes --project kitted-a5b45` (the index makes the daily purge work), then one real check and one question through it.
4. **Keep one instance warm or not** (`API_MIN_INSTANCES` in `firebase/functions/src/index.ts`, 0 today): removes the 1–2 s wake-up on the first call; costs money every month (price checked before asking).
5. After the $99 program: App Check (a native package, the founder's OK) and `enforceAppCheck: true`.

The app side (Release builds call the server; dev builds keep the direct key) is its own step: §8.

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

## 8. The app side (next step, not built)

- A `ProxyFetch` for the four callers: same request bodies, the server URL, the sign-in token, the check id and kind, the time zone. Dev builds keep the direct key (so the founder's phone works without the server); Release builds use only the server.
- A silent guest sign-in on first launch (the JS SDK's anonymous auth, already installed).
- Reading 429 `limit` and 503 `paused` into the limit card and the paused line.
- `npm run guard:release` keeps refusing any key in the bundle.

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

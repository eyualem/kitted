# AI fail-safes

**Approved by the founder:** 2026-11-20

After this, when Google can't read photos or OpenAI can't answer, the founder gets an email and a text within minutes that says why and what fixes it. The user sees an honest card: scoring is down on Kitted's side, his photo is saved on his phone, and it scores itself once it's back without using a check before then. Brief blips are retried quietly on the server. The live server's Gemini credit has its own wallet with auto-reload, so a test run can never drain it again.

**Part of:** `specs.md` → Privacy, Build structure ("Budget"), F2 (fit check failure states) and F13 (notifications). Works with `handoff/13-server.md` (the server), `specs/notifications.md` (the daily nudge, NT2) and `specs/free-and-pro.md` ("What counts").

## Why
From 10:33 a.m. Eastern on Nov 19, 2026, every photo reading failed. Gemini answered `402 Payment Required` ("prepayment credits are depleted"). The server passed it on as `502 upstream`, and the app showed `I couldn't score this one. It didn't use your check.` The logs show 11 failed calls in 17 hours, all the founder's. Nobody was alerted. He found out by trying a check.

**The cause:** the Firebase project `kitted-a5b45` holds no Gemini key. The live server's key, the dev key and the test key all sit on the "Default Gemini Project" (`gen-lang-client-0733691833`), whose billing is Google's Prepay. When a Prepay balance reaches zero, every key on that billing account stops at once ([Gemini API billing](https://ai.google.dev/gemini-api/docs/billing)). Scoring test runs and the live app drew on one balance.

**What it showed:**
- Nothing watched the server.
- Nothing told apart "billing ran out" from "Google is down".
- The user's line was true (nothing was counted) but gave no sense of what would happen next.

This is a launch blocker: the founder said Nov 20 that the app needs real fail-safes. The app now goes straight to the App Store, with no beta (the founder, Nov 20).

## Scope
- **In:**
  - Sorting each provider failure by cause.
  - One server retry for brief failures.
  - A "down" switch that answers at once and counts nothing.
  - A test call every 15 minutes.
  - A check of the server's health address every 5 minutes.
  - Email and text alerts (down, back up, the spending stop tripped).
  - The down card and the waiting photo that scores itself.
  - Kit's chat line when answers are down.
  - The daily nudge's line when a photo is waiting.
  - The live server's own Gemini wallet: the founder's steps for auto-reload and a budget.
- **Out (non-goals):**
  - A second model or company that reads photos when Gemini can't (the founder, Nov 20: "an honest pause").
  - Chat questions falling back to Google (the consent names OpenAI for questions, `handoff/13` §11).
  - A push sent from the server.
  - A warning before he takes the photo.
  - Any change to limits or prices (T20, `specs/limits-and-spend.md`).
  - The spending stop's own card and amount (T20, T22).
  - Retries in the app for a one-off failure (the existing `Try again` stays).
- **Later:**
  - A spare Gemini key on a second billing account, if a billing outage ever happens again.
  - A server push when scoring is back.
  - An alert when the test call itself stops running (a metric-absence alert, about 35¢ a month).
  - A status line before the camera opens.

## The rules
- **The AI only describes; the code judges.** No fallback model ever scores, so "same photo, same score" holds through an outage.
- **Nothing counts that didn't finish.** A down answer, a failed call, a retry or a probe never counts against the day's checks, the 7 free checks, the per-phone count, the questions or the call budget.
- **Nothing new about users is stored.** The waiting photo stays only on his phone, as every photo does today. The server keeps one status record per provider (below), with no user data. Logs gain a cause and Google's or OpenAI's error code, never a body, a photo, a question or an answer.
- **The founder hears within minutes:**
  - about 1 minute after a real user's call fails for billing or a key;
  - at most about 16 minutes when nobody is using the app (the test call);
  - about 10 minutes when the server itself is unreachable (the health check).

## AF1. Sorting failures, and one retry (server)
Every failed call to Gemini or OpenAI gets a **cause**, logged on its line as `cause` with the provider's error code, if any (Google's `error.status` and `details[].reason`, OpenAI's `error.code`). The message text is never logged.

| Cause | Seen as | Trips the down switch | Server retry |
|---|---|---|---|
| `billing` | Gemini 402; 403 with reason `BILLING_DISABLED`; OpenAI 429 with code `insufficient_quota` | at once | no |
| `key` | 401; 403 with reason `API_KEY_INVALID`, `PERMISSION_DENIED` or `SERVICE_DISABLED` (OpenAI 401, 403) | at once | no |
| `quota` | any other 429 (rate or a provider-side spend cap) | 3 in 5 minutes | once |
| `outage` | 500, 502, 503, 504; a network error | 3 in 5 minutes | once |
| `slow` | our own timeout (`timeoutMs`, 30 s) | 3 in 5 minutes | no |
| `request` | 400, 404, 413 from the provider (a request we built wrong) | 3 in 5 minutes | no |

**The retry:**
- At most one per request, after 1 second plus a random 0–1 second (Retry-After is used instead when the provider sends one of 3 seconds or less).
- Only when no byte has reached the app yet, and at least 10 seconds remain before the timeout.
- A retry is the same call for limits and spend (only billed tokens add to spend).
- The app's own disconnect or our timeout is never retried.

## AF2. The down switch (server)
One switch per provider: `gemini` (photo reading, and any question on a Gemini model) and `openai` (Kit's answers).
- **It trips** on one `billing` or `key` failure, or on 3 failures of any other cause within 5 minutes (across all users), counted after the retry. The cause recorded is the latest failure's.
- **While it's down,** every AI route on that provider answers `503 { "error": "down" }` straight away. That happens after sign-in and the shape check, but **before** the spending stop and today's allowance, so nothing is counted and no provider call is made.
- **The probe:** once every 60 seconds, the first request on a down provider goes through to the provider instead. If it succeeds, the switch closes and that user gets a normal answer. If it fails, the switch stays down and that user gets `503 down`.
- **It closes** on a successful probe or a passing test call (AF3), never on a timer.
- **The record:**
  - It lives in Firestore at `server/status` (Admin SDK only; clients can't read it), with `{ gemini, openai }`, each holding `state` (`up` / `down`), `cause`, `since`, `lastOkAt`, `lastProbeAt` and the times of recent failures.
  - Each server instance keeps its copy for at most 10 seconds.
  - Every change of state writes one log line, `{ event: "status", provider, state, cause, since }`, which the alerts read.
- **Health:** `GET /v1/health` (public, no sign-in) answers `{ ok: true, reading: "up" | "down", ask: "up" | "down" }`. `reading` is Gemini's state; `ask` is OpenAI's. It never says the cause and makes no provider call.

## AF3. The test call (server)
A scheduled job `canary`, every 15 minutes:
- **Gemini:** `gemini-3.8-flash` gets the text `Reply with OK.`, with an output cap of 8 tokens and the least thinking the model allows.
- **OpenAI:** `gpt-5.6-luna` gets the same text, with `max_output_tokens` 16, reasoning effort `none` and `store: false`.
- It uses the server's own keys, never a photo and never user data.
- **Pass:** HTTP 200 with any text. **Fail:** anything else. On a fail it tries once more after 60 seconds, and only two fails in a row trip the switch, with AF1's cause.
- A pass closes a down switch.
- Each run logs `{ event: "canary", provider, ok, cause, ms }` and adds its cents to the day's spend (`spend/{UTC date}`). It runs even while the spending stop is on (under 0.01¢ a run).
- **Cost:**
  - The test calls: about 2,900 a month per provider, about 11¢ a month in total today and about 15¢ after Gemini's price doubles on Jan 1, 2027.
  - The job's schedule: $0.10 a month (the account's 3 free Cloud Scheduler jobs are already the three purges).

## AF4. Alerts (Google Cloud Monitoring, set up by a script in the repo)
**Where they go:** two notification channels on `kitted-a5b45`: the founder's email and a text to his phone. He adds the phone number himself in the console (Google texts a code). Claude never types it.

**The alerts, each a log-based alert policy:**

| Alert | Fires on | Most often |
|---|---|---|
| **Scoring down** / **Kit's answers down** | a `status` line with `state: down` (provider gemini / openai) | every 5 minutes while new lines arrive |
| **Back up** | a `status` line with `state: up` | every 5 minutes |
| **Spending stop on** | the first `outcome: paused` line of a day | once a day |
| **Server unreachable** | the health check below fails 2 times in a row | every 30 minutes |

**The health check:** a Cloud Monitoring uptime check on `https://us-central1-kitted-a5b45.cloudfunctions.net/api/v1/health`, every 5 minutes, from 3 regions.

**What each alert says** (in the policy's documentation, so the text and the email carry it):
- Its first line: `Kitted: scoring is down (billing).` or `(key)`, `(quota)`, `(outage)`, `(slow)`, `(request)`; `Kitted: Kit's answers are down (…)`; `Kitted: scoring is back.`; `Kitted: the spending stop is on today.`; `Kitted: the server isn't answering.`
- Then the fix for that cause:
  - `billing`: AI Studio → Billing → add credit, or raise the auto-reload limit.
  - `key`: AI Studio → API keys; make a new one, then `firebase functions:secrets:set GEMINI_KEY`.
  - `quota`: AI Studio → the project's rate limits and spend cap.
  - `outage`: the Google AI or OpenAI status page; nothing to do but wait.
  - `slow`: the same as outage.
  - `request`: a code bug; the last deploy is the first suspect.
  - The spending stop: Firestore `server/config` → `spendCapCents`.
  - The server: the Firebase console → Functions → api logs.
- Then one plain line: `Users see the down card. Nothing is counted.`

**The script:** `tools/alerts/setup.sh` (gcloud only, no installs) creates or updates the email channel, the uptime check and the policies from JSON files in `tools/alerts/`. Running it twice changes nothing. It's run once with the founder's OK, because it changes the project's configuration.

**Cost:** log-based alerts and the uptime check fit Google's free allowances. If Google's 2026 alerting prices apply to the uptime alert, that's about 35¢ a month (checked before the script runs). With AF3, under 60¢ a month in total.

## AF5. What the user sees
**The fit check, when the server answers `down`** (or the app's own call can't finish because the provider is down):
- The photo row becomes **waiting**, kept only on his phone, like the 4 am held photo.
- His occasion and "Going for" answer stay with it.
- The card, under his photo, with the tag `Waiting to score`:
  - `Scoring is down on my end. Your photo is saved, and I'll score it once I'm back. It won't use a check until then.`
  - One button: `Don't score it`. It does what the held photo's `Don't score it` does today: the photo stays in the chat, not scored, and is never sent.
- **Scoring itself later:**
  - While any photo waits, the app asks `GET /v1/health` when it opens, when it comes back to the foreground, and every 60 seconds while it's open.
  - When `reading` is `up`, it scores waiting photos one at a time, oldest first, through the normal fit check. The card turns into the score in place.
  - A check counts on the day it scores (the existing `chargeDay` rule).
  - A waiting re-check scores as the re-check of its first check, whatever the time.
  - If that day's limit or the free checks are used up, the card shows the existing limit or free-checks card for that photo. No paywall opens on its own.
- **A one-off failure** (not down) keeps today's card, `I couldn't score this one. It didn't use your check.` with `Try again`. Timeouts and offline keep theirs. The spending stop keeps `fail.paused` until T20 and T22 decide its card. The new card is written so T22 can reuse it.

**Kit's answers, when the server answers `down` for a question:** Kit's line is `Something's off on my end. That didn't count against your questions. Try me again soon.` A one-off failed question keeps `I couldn't answer that. It doesn't count.`

**Nothing else changes:**
- Kit can still answer questions while scoring is down, and vice versa.
- The Closet call that follows a scored check keeps today's quiet behavior.
- No banner, no badge, no count.

## AF6. The daily nudge when a photo is waiting
When the phone schedules its nudges (`specs/notifications.md`, NT2) and a photo is waiting:
- The next scheduled nudge says `Your saved fit is still waiting. Open Kitted and I'll score it.` instead of that day's line. Later days keep their own lines.
- It's still one a day, scheduled on the phone, only for a user who turned nudges on.
- Once nothing waits, the next reschedule drops it.
- Tapping it opens Stylist at the waiting card, and the app's health check scores it if scoring is back.

## AF7. The live server's own Gemini wallet (the founder's steps; detail in `plan.md`)
- The live server's `GEMINI_KEY` becomes a key on `kitted-a5b45`, made only for the server and restricted to the Generative Language API.
- Its billing is the Firebase billing account: postpaid (a monthly bill to the card) if AI Studio offers it, otherwise Prepay with **auto-reload: add $25 when the balance falls under $10, at most $250 a month** (about 10,000 checks at 2.4¢; the founder, Nov 20).
- **A Cloud Billing budget** on that account, scoped to `kitted-a5b45` and the Generative Language API: $250 a month, emails at $100, $200 and $250. It's a warning, not a stop, and lags by hours. The server's spending stop is the hard daily limit.
- The dev key and the test key stay on the Default Gemini Project. That credit now pays only for tests and the dev build, and running dry stops only them.
- After the new key is stored, the `api` and `canary` functions are deployed with the founder's OK, then one real check (about 1.2¢) and one question (about 0.07¢) prove it.

## Numbers (measured Nov 20 from the server's logs, last 30 days, 158 Gemini and 27 OpenAI calls)
| | Today | From Jan 1, 2027 |
|---|---|---|
| One fit check (read 0.54¢ + two looks 0.41¢ + closet 0.25¢) | 1.20¢ | 2.4¢ |
| One question (GPT-5.6 Luna) | 0.067¢ | 0.067¢ |
| The test calls, both providers | ≈ 11¢ a month | ≈ 15¢ a month |
| The live server's AI spend, last 30 days | ≈ 55¢ | |

## Data
- `server/status` (new, Admin SDK only): per provider, the state, the cause, when it went down, the last success, the last probe and recent failure times. No user data. Kept as one document, overwritten.
- `spend/{UTC date}`: also holds the test calls' cents (as today, deleted after 90 days).
- On the phone: the waiting photo row (the existing fit-check row with a waiting status), as private as every other row; deleted by "Delete all my data" like the rest.
- Logs: `cause`, the provider's error code, `event: status` and `event: canary` lines. No bodies.

## Failure and edge cases
- **Billing runs out mid-stream:** the stream is cut, nothing counts (today's rule), the cause is logged, and the switch trips if it was billing or key.
- **Firestore can't be read for the status:** the server treats the provider as up and calls it. A failed status write never blocks an answer.
- **Both providers down:** both alerts fire. Scoring waits, and questions show Kit's down line.
- **He sends more photos while down:** each one waits, and they score oldest first.
- **He deletes the app while a photo waits:** the photo goes with the app. Nothing is on the server.
- **The under-18 lock or "Delete all my data" while a photo waits:** the waiting photo goes with everything else, and no nudge mentions it.
- **A probe and a test call at the same moment:** either success closes the switch, and a second close writes nothing.
- **An alert storm:** every alert is rate-limited (the table above), and down and up lines are written only on a change of state.

## Acceptance criteria
**Sorting and retry (AF1), on the emulators with a fake provider**
- AF1.1 Each row of AF1's table: the fake's status (and reason or code) is logged with the right `cause`, and no log line holds a response body or message.
- AF1.2 A 503 then a 200: one retry, the user gets the answer, it counts once, and the log shows the retry.
- AF1.3 A 402, 401 or 403: no retry (the fake sees exactly one call).
- AF1.4 A 503 after the first byte of a stream reached the app: no retry.
- AF1.5 Two 503s: the user gets `502 upstream`, and nothing is counted.

**The down switch (AF2)**
- AF2.1 One 402 → `server/status.gemini.state = down`, cause `billing`, one `status` log line; the next photo request gets `503 down` with no call to the fake and nothing counted (the usage doc is unchanged).
- AF2.2 Two outage failures don't trip it; the third within 5 minutes does; three spread over more than 5 minutes don't.
- AF2.3 While down: the first request after 60 seconds reaches the fake; a 200 closes the switch and that user is answered and counted once.
- AF2.4 Gemini down doesn't stop an OpenAI question, and OpenAI down doesn't stop a photo.
- AF2.5 `GET /v1/health` reports `reading` and `ask` correctly in each state and never includes a cause.
- AF2.6 A down answer comes before the spending stop: with the stop on and the provider down, the answer is `503 down`.

**The test call (AF3)**
- AF3.1 A pass logs `ok: true` and adds its cents to the day's spend; its body holds only the fixed text, never a photo.
- AF3.2 One fail, then a pass 60 seconds later: no trip. Two fails: the switch trips with the right cause.
- AF3.3 A pass while down closes the switch and writes one `state: up` line.

**Alerts (AF4)**
- AF4.1 The script runs twice with no change on the second run (`gcloud` lists the same channels, policies and uptime check).
- AF4.2 A fire drill: `gcloud logging write` of a fake `status` line marked `drill: true` reaches the founder's email and phone within 5 minutes, with the cause's first line and fix (he confirms it arrived).
- AF4.3 The uptime check is green on the live server.

**The app (AF5, AF6), in Jest and on the Simulator**
- AF5.1 A `503 down` on a fit check turns the row to waiting, shows the card in its exact words with `Waiting to score` and `Don't score it`, and counts nothing on the phone.
- AF5.2 With a photo waiting and health saying `up`, the app scores it on open, on return to the foreground and on the 60-second check, oldest first, one at a time; it counts on the day it scores.
- AF5.3 With health saying `down`, nothing is sent.
- AF5.4 `Don't score it` leaves it unscored and never sent.
- AF5.5 A waiting photo that scores with the day's checks used up shows the existing limit card, and no paywall opens.
- AF5.6 A `503 down` on a question shows Kit's down line in its exact words and counts nothing; a one-off failure keeps `I couldn't answer that. It doesn't count.`
- AF5.7 A one-off `502 upstream` on a fit check keeps today's failure card with `Try again`.
- AF5.8 Screenshots, light and dark at the largest text size: the waiting card, the card after it scores itself, and Kit's down line. VoiceOver reads the card's text and `Don't score it`.
- AF6.1 With a photo waiting, the next scheduled nudge has the waiting line and later days keep theirs; with none waiting, no nudge has it; it's never more than one a day (the test over every schedule call).
- AF5.9 Every new string is in the copy deck, has no emoji and matches this spec word for word (copy test).

**Live (AF7), with the founder's OK**
- AF7.1 `gcloud services api-keys list --project kitted-a5b45` shows a key restricted to the Generative Language API, and the founder confirms it's the one stored as `GEMINI_KEY`. No key is ever printed.
- AF7.2 After the deploy: one real fit check is scored through the live server and the test call logs `ok: true` for both providers.
- AF7.3 The budget exists with its three thresholds (the founder's screenshot, or `gcloud billing budgets list`).

## Checked against Apple's guidelines
The failure is said plainly, in the place he's looking, with what happens next, and no work is lost: Human Interface Guidelines → Feedback ("communicate status… in a way that doesn't interrupt") and Alerts (no blocking alert for a problem he can't fix). No notification he didn't ask for (App Review Guideline 4.5.4): the waiting line rides on the daily nudge he turned on.

## Touches
- Server (Server lane): `firebase/functions/src/api/handler.ts`, a new `firebase/functions/src/api/status.ts` (causes, the switch, the retry), `store.ts` (the status record), `firebase/functions/src/index.ts` (the `canary` job), `firebase/tests/`, `handoff/13-server.md` (§4–5: the status record, the alerts).
- Alerts: a new `tools/alerts/` (`setup.sh` and the JSON policies).
- The app: `app/src/services/server/transport.ts` (`down`), `app/src/services/readingSource/gemini.ts`, `app/src/features/fitcheck/service.ts` (the waiting row and scoring it later), `app/src/features/stylist/cards/FitCheckCard.tsx`, `app/src/features/ask/` (Kit's down line), `app/src/services/notifications.ts` (the waiting nudge), the copy deck `handoff/02-screens.md` §5 → `en.ts`.
- No new npm package. No native rebuild.

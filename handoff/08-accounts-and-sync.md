# 08 · Accounts and sync: his data on every device, iPhone and Android

*Oct 15, 2026. DECISIONS-LOG #268. Owns: where his data lives off the phone, accounts and sign-in, the sync engine, deletion, the privacy changes, the provider choice, costs and the build order. Replaces the iCloud plan in `07-stylist-chat.md` §10b (#267), because Android is planned if the app does well (founder, Oct 15). Prices were read from the providers' pages on Oct 15, 2026; re-check them before signing up.*

---

## 0. The short version

- **Recommended:** **Firebase** (Google) for accounts, the synced database and photos. The **Cloudflare Worker** stays the AI proxy (no cold starts, so scoring stays fast) and checks Firebase's sign-in token.
- **Why Firebase:**
  - Google is already the company named in consent for scoring, so the privacy story stays at one AI-and-data company plus Cloudflare in transit.
  - It has the most ready-made pieces for a solo builder: Apple and Google sign-in, guest accounts that upgrade without losing data, and resumable photo uploads.
  - App Check proves requests come from the real app on iPhone and Android. That replaces the App Attest work we'd otherwise write ourselves.
  - Android is Google's own platform.
- **Cost:** about $0 a month at 1,000 monthly users, ~$8 at 10,000, ~$45 at 50,000 (§4). **Storage is never the money problem; the AI calls are** (§4.3).
- **Work:** about 10–12 days of building (§6). That's more than the 3–4 days for iCloud, but iCloud can't reach Android, so the work would only be postponed.
- **When:** settle the design now and do the cheap preparation before the beta (about 1 day, §7). Build accounts and sync after the App Store submission, as v1.1 (December), before Android.
- **Sign-in is optional:** the app works signed out exactly as today (data on the phone, plus iCloud Backup on iPhone). Signing in ("Back up and use on other devices") is never required and never comes before the first score; it's offered on Welcome ("I already have an account"), once after the first fit ("Keep your fits"), and in You → Settings (revised Oct 15, `10-onboarding.md`, #289). The taps to the first check stay.

---

## 1. What changes when we run our own database (whichever provider)

| Area | Today | With accounts |
|---|---|---|
| Where his data is | Only on his phone | On his phone **and** on our servers, tied to his account |
| Photos | Never on our servers ("Our server stores no photos") | His kept photos (a 1600 px copy), cut-outs and scans stored in a private folder per account. The face-blurred copy still goes to Gemini only for scoring. Faces are never scanned on our servers. |
| Chats | On the phone; the AI proxy keeps no text | Synced to his account. Our **logs** still keep no chat text. |
| Sign-in | None | Optional: Sign in with Apple (iPhone), Google (Android), and Apple on Android too |
| Delete | "Delete all my data" wipes the phone | Must also delete the account and every server copy. Google Play also requires a **web page** where he can ask for deletion without the app. |
| App Store privacy label | Mostly "not collected" (Google's 55-day abuse log aside) | "Data linked to you": Photos, Other user content (chats, closet), User ID, all for App Functionality, none for tracking |
| Google Play | n/a | The Data safety form, the deletion questions, the web deletion link |
| Consent and privacy policy | "Our server stores no photos" | Rewritten: what's backed up, where (Google Cloud, US), how long, how to delete, and that sign-in is optional |
| Security | Nothing to breach on our side | Per-account access rules, App Check, encrypted at rest (provider default), a breach plan (every US state has a breach-notice law), secrets kept out of the app |
| Free limits | Per device | Per account once signed in (two devices no longer give two free checks a day) |
| Pro | Apple only | RevenueCat (already recommended) ties Pro to the account, so Pro bought on iPhone works on Android |

**Legal checks, researched (not legal advice; a one-time lawyer review is recommended before launch):**
- **Faces (Illinois BIPA, the strictest biometric law):** BIPA's definition excludes photographs. Lawsuits turn on scans of face geometry and who holds them. In the Seventh Circuit's 2025 Samsung Gallery case, the court found for Samsung because the face data stayed on the user's device and Samsung never possessed it. Our face finding and blurring stay on the phone and no face data is ever stored, so storing his photos isn't storing biometrics. Rule: **never run face detection or recognition on our servers.**
- **Health data (Washington MHMDA):** a build word and a height aren't health status. Weight would likely count, so it's still never collected (#267).
- **CCPA:** doesn't apply below its thresholds (about $26.6M in revenue or 100,000 consumers' data a year). Build "download my data" anyway when it's cheap.

---

## 2. How sync works (same design on any provider)

- **The phone stays the source of truth.** Every screen keeps reading SQLite, so it works offline exactly as today. Sync runs in the background.
- **Outbox up, changes down:**
  - Every row changed on the phone is marked dirty and pushed in batches.
  - Changes from his other devices arrive through a listener (Firebase) or a "changes since" call (the others) and are written into SQLite.
  - Each row carries `updated_at` and a soft delete (`is_deleted`).
- **Conflicts:**
  - The newest edit wins, per row.
  - Chat messages only ever add, so they never conflict.
  - The usage counters come from the server.
  - Two devices answering the same closet question both count, and the later answer wins.
- **Photos:** uploaded after the row, Wi-Fi first, resumable, retried. The full 12 MP photo stays on the phone that took it; other devices get the 1600 px copy (about 0.3–0.5 MB). Caches (upload copies, close-ups) never sync. Thumbnails and drawn tiles are rebuilt on each device.
- **A new device:**
  - He signs in and sees a progress line ("Bringing back 214 fits…").
  - The rows arrive in seconds; photos follow in the background.
  - If the phone already has guest data and the account has data too, he chooses: "Keep both" (merge) or "Use the account's".
- **Old app versions:** each row stores the schema version that wrote it. An older app ignores fields it doesn't know and never deletes them. SQLite migrations and the server schema change together.
- **What syncs:**
  - all 14 tables (profile, facts, closet items and observations, fit checks, readings, corrections, chat, outfits, wear log, daily ideas, usage, Lookbook flags);
  - a few kv keys (picked looks, appearance, units, the Going-for memory).
- **What doesn't sync:** notification settings, the camera mode, demo state, the age block (it's per device, in the Keychain), logs.

---

## 3. The three providers, compared

| | **Firebase** (recommended) | **Supabase** | **Cloudflare only** (Workers + D1 + R2) |
|---|---|---|---|
| Accounts | Built in: Apple, Google, guest → upgrade keeps data. Free to 50,000 monthly users. | Built in: Apple, Google, guest. 50,000 free, 100,000 in Pro. | We write it: check Apple and Google sign-in tokens in the Worker, sessions, linking. |
| The database | Firestore, documents per row (`users/{uid}/fitChecks/{id}`). Live listeners make the "changes down" half nearly free to build. | Postgres, which matches our SQLite tables closely. Security by row rules. No offline sync: write our own, or PowerSync ($49/mo Pro; free tier sleeps after a week idle). | D1 (SQLite, like ours). 10 GB per database and single-threaded, so it needs splitting by user past ~10,000 users. All sync code is ours. |
| Photos | Cloud Storage: resumable uploads in the SDK, per-user rules | Storage, 100 GB in Pro, per-user rules | R2, no download fees. Signed upload links are ours to build. |
| Proves it's our app | App Check: Apple App Attest + Android Play Integrity, free | Not built in (our own App Attest / Play Integrity checks) | Not built in (our own, already on the plan for iPhone) |
| Android | First-class (Google's own) | Good | Good (it's just HTTP) |
| Company named in privacy | Google (already named) | + Supabase (on AWS) | Cloudflare (already in the plan as the proxy) |
| Fixed cost | $0 (pay as you go, with a budget alert) | $25/mo from day one (the free tier pauses after a week idle, so it can't run a live app) | $5/mo (Workers Paid, already planned) |
| Getting out later | Hardest (Firestore is Google-only) | Easiest (open source, plain Postgres) | Medium |
| Our code to write | Least | Middle | Most, and the most security code written by us |
| Build time (§6) | ~10–12 days | ~12–14 days (~10–11 with PowerSync) | ~15–18 days |

**Ranking for Kitted** (solo builder, $0 marketing, iPhone first, Android next, Google already the AI processor):
1. **Firebase**: the least code, no new company in the privacy story, Android-native, and App Check for free. The risk is lock-in: we'd be tied to Firestore. That's acceptable because the phone's SQLite stays the real copy, so leaving means rewriting the sync layer, not the app.
2. **Supabase**: the best if we ever want plain SQL or to self-host. It costs $25/mo before the first user and adds a company.
3. **Cloudflare only**: the cheapest at 50,000+ users, but the most hand-written security code. The wrong trade for one person.
4. **iCloud** (#267): ruled out by Android.

---

## 4. Costs

### 4.1 Assumptions (per monthly user, after a year of use)
- About 10 fit checks a month, 0.5 MB of synced photos per check (the 1600 px copy plus cut-outs).
- 60% of monthly users sign in; the rest stay local and cost nothing.
- Each signed-in user holds about 40 MB of photos and 0.7 MB of rows after a year.
- About 300 row writes, 1,000 row reads and 300 server calls a month; photo downloads only on a new device.
- Synced data of an account unused for 18 months is deleted after a warning in the app.

### 4.2 Monthly backend cost
| Monthly users | Photos stored | Firebase | Supabase | Cloudflare only |
|---|---|---|---|---|
| 1,000 | ~23 GB | **~$0** | $25 | ~$5 |
| 10,000 | ~234 GB | **~$8** | ~$28 (+$49 with PowerSync) | ~$8 |
| 50,000 | ~1.2 TB | **~$42** | ~$50 (+$49–79 with PowerSync) | ~$37 |

Firebase prices used: Firestore in us-central1 $0.03 per 100,000 reads and $0.09 per 100,000 writes, about $0.15/GB-month stored, with a free 50,000 reads and 20,000 writes a day; Cloud Storage about $0.020/GB-month and $0.12/GB downloaded beyond 100 GB a month free; Auth free to 50,000 monthly users. Supabase: Pro $25 with 8 GB of database, 100 GB of files and 250 GB of downloads, then $0.125/GB of database and $0.0213/GB of files. Cloudflare: Workers Paid $5; D1 5 GB included then $0.75/GB-month; R2 $0.015/GB-month with no download fees.

### 4.3 The cost that matters isn't storage
**Corrected Oct 15 (#270; full list `market/ai-costs.md`).** A full fit check is three calls (the scoring read, the second look, the closet call): **1.08¢ now and 2.16¢ from Jan 1, 2027**, not the 0.83¢ used here first. At 5 checks per monthly user that's about $108, $1,080 and $5,400 a month at 1k, 10k and 50k users, against about $60, $600 and $3,000 of revenue, before any chat. Storage stays under 2% of revenue at every scale. **The AI calls are the money problem, with or without accounts.** The levers are in `market/ai-costs.md` §5.

### 4.4 One-time and yearly
- **Apple Developer Program:** $99/yr (needed anyway).
- **Google Play developer account:** $25 once, when Android starts.
- **Domain** (trykitted.com, for the policy and the deletion page): about $10–15/yr.
- **Lawyer review** of the privacy policy and consent: get 2–3 flat-fee quotes (often a few hundred dollars for a policy review).
- **RevenueCat** (cross-platform Pro): free up to a monthly revenue threshold, then a small share. Check its current terms when P6 starts.

---

## 5. What he'll see

- **Signed out (the default):** the app works the same as today. In You → Privacy: "On this iPhone only. Back up and use on other devices ›".
- **The offer** (revised by #289, `10-onboarding.md` §3): an inline "Keep your fits" card after he's seen his first fit, a second and last one after 3 more checks if he said Not now, and in You → Settings. Was: after his 3rd fit check (once), and in You → Settings: "Keep your closet and fits safe. Sign in to back up and use Kitted on other phones." Buttons: Sign in with Apple · Not now. On Android: Google, and Apple too.
- **Signed in:** You → Privacy shows "Backed up · just now", a "Back up photos" switch (on by default, outward-facing), "Download my data" and "Delete account and all data".
- **A new phone:** Welcome → "I've used Kitted before" → sign in → his closet, Lookbook, chats and facts come back. Onboarding is skipped. If this phone's birth year was never entered, the age gate still runs.
- **Deleting:** "Delete account and all data" removes the server copy, the photos and the account, then wipes the phone. A web page (trykitted.com/delete) does the same after he signs in there, as Google Play requires.

---

## 6. The work (Firebase; Claude builds, the founder sets up accounts)

| Step | What | Days |
|---|---|---|
| **A0 · Setup (founder, ~30 min)** | A Firebase project on the pay-as-you-go plan with a $10 budget alert; Sign in with Apple turned on (needs the $99 program); App Check with App Attest; later, Google sign-in and Play Integrity for Android. | — |
| **A1 · Accounts** | A guest account created silently on first launch (the Worker keys limits on it), upgrade with Apple or Google keeping the same ID, sign out, switch, the "Keep both / Use the account's" merge, the 3rd-check offer, the new-phone path on Welcome. | 2 |
| **A2 · Sync engine** | The outbox, the per-table mapping (14 tables + kv keys), listeners into SQLite, newest-wins, soft deletes, the schema version per row, the first restore with progress, the photo upload queue (Wi-Fi first, resumable), the sync status line. | 4–5 |
| **A3 · Security** | Rules: only `request.auth.uid` reads or writes `users/{uid}/**` and its photo folder; App Check enforced; tests on the Firebase emulator. | 1 |
| **A4 · The Worker** | Verifies the Firebase sign-in token and the App Check token on `/check` and `/ask`; limits per account. This replaces our own App Attest work. | 0.5 |
| **A5 · Deletion and data rights** | In-app delete account (server, photos, account, phone), the web deletion page, the 18-month purge job, "Download my data" (a zip of JSON plus photos). | 1.5 |
| **A6 · Privacy and store forms** | The consent and policy rewrite, the App Store privacy label, the Play Data safety form, the breach plan. Then the lawyer review. | 1 |
| **A7 · Ops** | Budget alerts, a weekly database export, the error log. | 0.5 |
| **Total** | | **~10–12 days** |

**New dependencies (need your OK):** the React Native Firebase packages (app, auth, firestore, storage, app-check) with their Expo config plugins. They're native, so it's one reinstall on the phone.

**Android itself is the bigger job, and this doesn't change it** (rough guess, 3–5 weeks). The phone-side native modules are Apple-only today: face finding and blurring, body tracking for the camera guide, on-device dictation, location, the camera guidance. They'd be rebuilt on Android's equivalents (ML Kit, Android's on-device speech, Fused Location). Add the tab bar and glass look, Play Billing through RevenueCat, and Play signing and review. The scoring engine (`@kitted/core`), the chat and this sync layer are shared as they are.

---

## 7. Settle now, before the beta (about 1 day, no new dependencies)

Cheap now, expensive after people have data:
1. **Migration V7:** `updated_at` on every table (only `closet_items` has it), and soft deletes everywhere rows are hard-deleted today (except "Delete all my data", which stays a real wipe). Every write sets `updated_at`. **Revised Oct 15 (#288):** done differently: V7 adds one shadow table (`sync_rows`) that records each row's last change and deletes, so the domain tables and what a delete means to the screens stay as they are. The full schema is `11-firestore-schema.md`.
2. **IDs are already safe across devices:** they're UUIDs (`services/ids.ts`). Keep it that way; no counters outside tests.
3. **The Worker's limits are keyed on an account ID from the start** (today's design keys on the device), so guest → signed-in needs no server change.
4. **The privacy policy and consent are written with optional backup in mind.** The beta's version says "on your phone only" and gains the backup section when A6 ships. No re-consent is needed for people who never sign in; signing in shows what's backed up at that moment.
5. **Photo paths stay relative** (already true, #63), so a restored or synced row finds its photo.

---

## 8. Decisions

**Settled by Claude:**
- The phone's SQLite stays the real copy, with background sync.
- Sign-in is optional and never before the first score (where it's offered: `10-onboarding.md`, #289).
- Faces are never processed on our servers.
- The full photo stays on the phone that took it; other devices get a 1600 px copy.
- The settle-now items in §7.

**Decided by the founder, Oct 15 ("All right", #270): E1–E3 as recommended.** E4 stays on his to-do list.

**Were (each with a default):**
- **E1 · Provider (money, new dependency):** Firebase for accounts, data and photos, and the Worker stays the AI proxy. Default: yes.
- **E2 · When:** the §7 prep before the beta, the build as v1.1 (December). Default: yes. The other choice, squeezing it in before the Nov 14 submission, puts the beta at risk.
- **E3 · "Back up photos" on by default once he signs in (outward-facing).** Default: on, with the switch in Privacy. Off by default saves storage but means a new phone gets his closet and scores without the pictures.
- **E4 · Firebase setup (your to-do, ~30 min, a card on file with a $10 budget alert),** after the $99 program.

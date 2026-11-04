# 11 · The Firestore schema: what goes in the database, where photos live, and the tests it must pass

*Oct 15, 2026. DECISIONS-LOG #288. Owns: the exact shape of every document and file Kitted keeps on Firebase (Firestore + Cloud Storage), the security rules, the indexes, the server jobs (account deletion, purges), the App Store duties that follow from storing data, and the acceptance checks, written before the code. Builds on `08-accounts-and-sync.md` (the why, the provider, the costs, the build steps A0–A7); where the two disagree, this file wins on the schema and 08 on everything else. Prices and Apple rules were checked as of Oct 2026; re-check before launch.*

---

## 0. The short version

- **The phone stays the real copy.** Every screen keeps reading SQLite. Firestore is a mirror per account that lets a second phone (or a reinstall) get everything back. Nothing changes for someone who never signs in.
- **One folder per person:** everything he owns lives under `users/{uid}/…` in Firestore and `users/{uid}/files/…` in Storage. The rules let only that signed-in person read or write it. No document is shared between people, so there's nothing to leak sideways.
- **One document per row.** Each SQLite row becomes one Firestore document in a collection named after its table (`fitChecks`, `closetItems`, `chatMessages`, …). Each preference becomes one document in `prefs`.
- **Every document has the same envelope:** `id`, `v` (schema version), `updatedAt` (when he changed it, on his phone), `serverAt` (when the server got it), `deleted`, `by` (which device), and `data` (the row). The newest `updatedAt` wins.
- **Photos:** his kept fit-check photos go up as a 1600 px copy (about 0.3–0.5 MB), plus thumbs, closet cut-outs and clothes scans, each at the same relative path it has on the phone (`photos/<sha>-photo.jpg`). Face-blurred send copies, close-ups and caches **never** go up.
- **What never leaves the phone:** his birth year, the usage counters (the server keeps its own), the analytics queue, per-device settings (notifications, camera mode, weather permission), demo data, and every face-hidden upload copy.
- **Built now (Oct 15), no Firebase key or package needed:** the rules, indexes and server jobs as files in `firebase/`; on the phone side the schema map, the row ↔ document codec, the change tracker, the sync engine and an in-memory stand-in for Firestore that enforces the same rules, all with tests (§9). **Not built until you OK the packages and set up the project:** the real Firestore/Auth/Storage adapters, sign-in, the screens.

---

> **Amended Oct 17 (#326):** the AI proxy keeps its own per-account daily counts (`usage/{uid}/usageDays`, 7 days) and the day's spend (`spend/{date}`); server-only, never synced or readable by the app. The phone's usage table still never syncs. See `13-server.md` §5.

## 1. Where things live

| What | Where | Size per user (1 year) | Synced? |
|---|---|---|---|
| Rows (checks, closet, chats, ideas, facts…) | Firestore `users/{uid}/{collection}/{id}` | ~0.7 MB, ~3,000 docs | Yes, when signed in |
| Preferences (picked looks, appearance, Going-for…) | Firestore `users/{uid}/prefs/{key}` | ~10 docs | Yes |
| Account info | Firestore `users/{uid}` | 1 doc | Yes |
| His devices | Firestore `users/{uid}/devices/{deviceId}` | 1–3 docs | Yes (for "signed in on 2 phones" and cleanup) |
| Kept photos (1600 px), thumbs | Storage `users/{uid}/files/photos/<sha>-photo.jpg`, `-thumb.jpg` | ~40 MB | Yes, if "Back up photos" is on (default on, E3) |
| Closet cut-outs + fingerprints | Storage `users/{uid}/files/closet/<sha>-<key>.png`, `.print` | ~3 MB | Yes |
| Clothes scans (kept, thumb) | Storage `users/{uid}/files/scans/<sha>-photo.jpg`, `-thumb.jpg` | small | Yes |
| The full 12 MP photo | Only the phone that took it | — | Never |
| Face-blurred send copies, close-ups (`Caches/upload`, `Caches/detail`, `scans/*-send.jpg`) | Only the phone | — | Never |
| Usage counters (checks and questions today) | The Worker (Cloudflare D1), keyed on the account ID | — | No; the phone keeps a mirror from the server's replies |
| Pro | RevenueCat, keyed on the account ID | — | No (RevenueCat restores it) |

**The real project (Oct 15, #293–294):** `kitted-a5b45`; Storage bucket `kitted-a5b45.firebasestorage.app`; both sets of rules live.

**Region:** Firestore `us-central1` (regional, the cheaper price in 08 §4) and the Storage bucket in `us-central1` (Cloud Storage's no-cost tier applies only in us-central1, us-east1 and us-west1). The location can never be changed after the database is created, so this is decided now.

---

## 2. Firestore layout

```
users/{uid}                              the account (§2.3)
  ├─ profile/me                          ProfileRow, without birthYear
  ├─ prefs/{kvKey}                       one synced kv key each ("onboarding.looks", "appearance", …)
  ├─ fitChecks/{id}                      FitCheckRow
  ├─ readings/{id}                       ReadingRow (never changed after it's written)
  ├─ closetItems/{id}                    ClosetItemRow
  ├─ closetObservations/{id}             ClosetObservationRow (each sighting of a piece)
  ├─ outfits/{id}                        OutfitRow
  ├─ wearLog/{day}                       WearLogRow ("2026-10-15")
  ├─ corrections/{id}                    CorrectionRow
  ├─ chatMessages/{id}                   ChatMessage (the Stylist thread)
  ├─ dailyIdeas/{id}                     DailyIdeaRow (the morning and evening cards)
  ├─ facts/{id}                          FactRow ("what your stylist knows", tombstones kept)
  └─ devices/{deviceId}                  { platform, appVersion, createdAt, lastSyncAt }
```

**Why subcollections per table (not one big doc, not one collection with a `type` field):**
- A document can hold at most 1 MiB; a year of checks can't fit in one.
- Each table pulls its own changes with one simple query (`serverAt > cursor`), and the rules can treat readings (never edited) differently from chats (edited).
- Deleting an account is one recursive delete of `users/{uid}`.

**Why chat messages are one document each, not one document per day:** messages are edited (cards change state, "ready" placeholders are replaced), and per-message docs keep every edit to a single small write. A year of chat is ~2,000 docs: a full restore reads them for about $0.0006.

**Document IDs** are the row keys, which are already UUIDs (`services/ids.ts`, e.g. `FC-3f2a…`), so two phones never collide. `wearLog` uses the day key and `profile` the fixed `me`, which is right: one per day, one per person. kv keys are valid IDs (dots are allowed; no key contains `/`).

### 2.1 The envelope (every synced document)

| Field | Type | Rule | Why |
|---|---|---|---|
| `id` | string | equals the document ID | catches a write to the wrong path |
| `v` | int ≥ 1 | the sync schema version that wrote it (today `1`) | an older app can tell a newer doc |
| `updatedAt` | int (ms) | when the row last changed **on the phone**; not more than a day ahead of the server clock; never older than the stored one | newest wins, per row |
| `serverAt` | timestamp | must equal `request.time` | the pull cursor ("everything since"), immune to wrong phone clocks |
| `deleted` | bool | a deleted doc carries no `data` | a deletion reaches his other phones; the content leaves the server at once |
| `by` | string ≤ 64 | the device ID that wrote it | breaks ties, skips echoes |
| `data` | map ≤ 48 keys | the row (§2.2); absent when `deleted` | |

No other top-level field is allowed.

### 2.2 How a row becomes `data`

- **Field names are the TypeScript row's names** (camelCase, as in `tables.ts`), not the SQLite column names.
- **Values:**
  - text → string;
  - int / real → number;
  - bool → boolean (not 0/1);
  - null → null.
  - **JSON columns stay JSON text** (a string), exactly as SQLite stores them (`fixes`, `details`, `reading`, `garment`, `payload`, `styles`…).
- **Why JSON stays text:**
  - Firestore can't store an array directly inside an array, and our data has them (`styles` is `[["minimal",0.5],…]`, boxes are `[x,y,w,h]` inside lists).
  - The server never needs to look inside them (no server query reads a reading).
  - The phone is the only thing that interprets them, with the same code that reads SQLite today.
  - It keeps one encoding for both stores, so they can't drift.
- **Fields never sent** (the codec drops them; a test fails if they appear):
  - `profile.birthYear`: the age gate runs per device (the Keychain block plus Apple's Declared Age Range). His age isn't needed to back up a closet, and leaving it out keeps "age" off the privacy label. A new phone asks "Born in …?" once.
  - `demoPhotoId` (demo rows): sync never runs in a demo build.
- **Fields from a newer app** an older app doesn't know: kept on the server. Every push merges into `data` (it never replaces the map), so an old phone writing a row back can't erase a field it doesn't know.

### 2.3 The account document `users/{uid}`

| Field | Who writes it | What |
|---|---|---|
| `createdAt` | the phone, once (= `request.time`) | when he first signed in |
| `lastActiveAt` | the phone (= `request.time`, at most once a day) | drives the 18-month purge |
| `v` | the phone | the newest sync schema version he's used |
| `appVersion` | the phone | for support |
| `deleteRequestedAt` | the server only | set by `deleteAccount` while it runs |

No name, no email, no age, no location. His sign-in email (Apple, Google or the email code; `10-onboarding.md`) lives only in Firebase Auth, never in a Firestore document, and never reaches the stylist or a scoring call.

### 2.4 Tables and kv keys: synced or not

Every table and every kv key is classified in `app/src/sync/schema.ts`. A test fails if one is added without a decision (S6).

| Table | Collection | Notes |
|---|---|---|
| `profile` | `profile` | without `birthYear`, `heightCm` or `build` (no longer kept, #375) |
| `fit_checks` | `fitChecks` | file paths are relative (`photos/<sha>-photo.jpg`) |
| `readings` | `readings` | immutable after create (rules R7); a tombstone is allowed |
| `closet_items` | `closetItems` | |
| `closet_observations` | `closetObservations` | |
| `outfits` | `outfits` | |
| `wear_log` | `wearLog` | |
| `corrections` | `corrections` | |
| `chat_messages` | `chatMessages` | edited and deleted locally, so not append-only |
| `daily_ideas` | `dailyIdeas` | |
| `facts` | `facts` | his own tombstones (`isDeleted`) sync too, so a forgotten fact stays forgotten on every phone |
| `usage_days` | — | **local**: the server's counters win |
| `event_queue` | — | **local** (analytics queue) |
| `sync_rows`, `sync_files` | — | **local**: the sync engine's own bookkeeping (V7) |

| kv key | Synced? | Why |
|---|---|---|
| `onboarding.looks`, `onboarding.otherStyle` | yes | his picked looks |
| `onboarding.basics` | yes, **without `birthYear`** | fit (an older draft's height and build are ignored, #375) |
| `onboarding.done` | no (#386) | per phone: A4 sets it after the birth year, so a restore closed mid-way can't skip the question |
| `appearance` | yes | (08 §2) |
| `occasion.last`, `goingFor.last` | yes | the card's memory |
| `idea.style.day`, `idea.style.evening` | yes | the morning card's style |
| `scan.inbox` | yes | the waiting clothes scans (whole list, newest wins; it's a holding area until the item reading ships) |
| `starter.marked` | yes | Starter essentials he marked that have no closet piece (the belt; #291) |
| `onboarding.step`, `onboard.finish`, `notify.*`, `camera.mode`, `weather.permission`, `reveal.fullShown`, `idea.evening.ignored`, `closet.pendingDeletes` | no | per device (`onboard.finish`: this phone's first-fit sequence, #291) |
| `account.user`, `account.offer` (`10-onboarding.md`) | no | who is signed in on this phone (with the email) and the save offer: per device |
| `demo.scenario`, `seed.loaded`, `sync.*` | no | demo and sync bookkeeping |

---

## 3. Photos and files in Cloud Storage

```
users/{uid}/files/photos/<sha>-photo.jpg     kept fit-check photo as kept on the phone (2048 px, no metadata; #386)
users/{uid}/files/photos/<sha>-thumb.jpg     its thumb (small; uploaded so the other phone needn't rebuild it)
users/{uid}/files/closet/<sha>-<key>.png     closet cut-outs
users/{uid}/files/closet/<sha>-<key>.print   their fingerprints (≤ 64 KB)
users/{uid}/files/scans/<sha>-photo.jpg      clothes scans (kept, thumb)
```

- **The remote path is the phone's relative path,** so a row synced to another phone points at the right file with no rewriting. The engine finds file paths by walking each row for strings shaped like `photos/…`, `closet/…` or `scans/…` (old rows with absolute `file://…/Documents/…` URLs are read by their Documents part, as `resolveStoredPath` does today).
- **Never uploaded:** anything with `-send` in its name (the face-hidden scan copy), anything in `Caches/` (`upload`, `detail`, `ImagePicker`), `tmp/`, logs. The kept photo is his photo as he took it, unblurred and with location stripped. It goes up only to his own private folder, never to Gemini (Gemini only ever gets the blurred copy, as today).
- **Faces are never processed on our servers** (08 §1, BIPA): no Cloud Function opens a photo. Upload and download are plain file copies.
- **Upload order:** after the row, Wi-Fi first, resumable, retried with backoff. A photo removed on the phone (a check deleted, "Remove photo") deletes the remote file in the same sync.
- **Rules:** owner only; exactly one folder level (`{kind}/{name}`); kind is `photos`, `closet` or `scans`; JPEG or PNG under 3 MB, or a `.print` file under 64 KB; nothing else.

---

## 4. Sync, in one page (the engine in `app/src/sync/engine.ts`)

- **Tracking:** a thin wrapper around the store records every `put`, `patch` and `delete` on a synced table (and every `setKv` on a synced key) in `sync_rows`: table, key, `localAt` (when it changed). The domain tables don't change at all. **This replaces 08 §7.1** ("`updated_at` on every table, soft deletes everywhere"): the shadow table gives the same newest-wins information without touching 14 tables or changing what a delete means to the screens. Hard deletes stay hard on the phone; the shadow row remembers it was deleted, and that becomes a tombstone on the server.
- **Push:** rows whose `localAt` is newer than their last push are read from the store and written in batches of ≤ 400 (Firestore allows 500 per batch). A missing row is sent as a tombstone. If the server refuses a batch because one doc is stale (a newer edit from his other phone, rule R5), the engine retries that batch one doc at a time and pulls the refused docs instead.
- **Pull:** per collection, "everything with `serverAt` after my cursor" (a live listener while the app is open, a query on launch). A remote doc is applied if its `updatedAt` is newer than the phone's (`localAt`), ties broken by the device ID. Applying goes around the tracker, so a pulled change is never pushed back (no ping-pong).
- **First sign-in:** every synced row and key is marked changed and pushed once. If the account already has data (his old phone), the phone pulls first; rows with the same ID resolve by newest wins and different rows simply add up (the "Keep both" merge in 08 §2 is the default; "Use the account's" wipes the phone first, then restores).
- **Restore on a new phone:** rows first (seconds), photos after in the background, "Bringing back 214 fits…".
- **Delete all my data / delete account:** see §5.
- **Sync never runs** in a demo build, on the web preview, or when signed out.

---

## 5. Server jobs (Cloud Functions, 2nd gen, us-central1; `firebase/functions/`)

| Job | When | What it does |
|---|---|---|
| `deleteAccount` (callable; needs sign-in and App Check) | He taps "Delete account and all data" | Sets `deleteRequestedAt`, deletes everything under `users/{uid}` (recursive), every file under `users/{uid}/`, then the Auth user. Safe to run twice. The phone first revokes his Sign in with Apple token (Apple requires it, §6), then calls this, then wipes itself. |
| `cleanUpDeletedUser` (Auth trigger) | An Auth user is deleted any other way (the console) | Same cleanup, so no orphaned data. |
| `purgeTombstones` (daily) | Tombstones older than 180 days | Deletes the envelope. A phone offline longer than that does a full re-pull instead of a delta. |
| `purgeInactive` (daily) | Accounts with no `lastActiveAt` in 18 months | Deletes the account like `deleteAccount`. Stated in the privacy policy. |

- **Backups:** the weekly export (08 A7) keeps 5 weeks, so a deleted account is gone from backups within 35 days. The privacy policy says so. Point-in-time recovery stays off (it would keep deleted data 7 days longer and costs extra).
- **"Download my data"** is built on the phone, not the server: the phone already has everything (SQLite + photos), so it zips JSON plus photos and opens the share sheet. No server cost.
- **The Android web deletion page** (Google Play) calls the same `deleteAccount` after sign-in on trykitted.com/delete. Not needed for the iPhone launch.

---

## 6. Apple duties that come with storing his data

Kitted is an App Store product first. Each line is a check in §9 (group A).

1. **Account deletion in the app (Guideline 5.1.1(v)).** Any app that lets you create an account must let you delete it from inside the app, fully, not just deactivate it. You → Privacy → "Delete account and all data", at most 3 taps from the You tab, with one confirmation. Deletion finishes in the app (not "email us").
2. **Revoke Sign in with Apple on deletion.** Apple requires apps using Sign in with Apple to revoke the user's tokens when the account is deleted (the REST revoke endpoint). The phone asks Apple for a fresh authorization code at "Delete account", calls Firebase Auth's `revokeToken`, then `deleteAccount`.
3. **Login services (4.8).** The sign-in sheet (`10-onboarding.md` §4) offers Apple first, then Google, then email, all the same size, so Apple's sits next to Google's as 4.8 requires.
4. **Ask for as little as possible.** Sign in with Apple asks for the email only (Settings shows it, "Hidden email" for a relay address), never the name. The email stays in Firebase Auth; no Firestore document holds it.
5. **Sign-in stays optional (5.1.1).** Every feature that doesn't need an account works signed out: checks, closet, chat, Lookbook. Only "Back up and use on other devices" needs it. App Review needs no demo account; the review notes say sign-in is optional and how to reach it.
6. **The privacy label (App Store Connect) changes when sync ships,** even though sign-in is optional, because the app *can* collect it:
   - **Photos or Videos:** linked to the user, for App Functionality;
   - **Other User Content** (chats, closet, scores): linked, App Functionality;
   - **User ID:** linked, App Functionality;
   - **Email Address** (Contact Info): linked, App Functionality, because of Google and email sign-in;
   - none used for tracking.
   No ATT prompt (no tracking, no ad SDK). Today's label, before sync ships, stays as 08 §1 describes.
7. **No analytics or crash SDK from Firebase** (no Google Analytics, no Crashlytics): only `app`, `auth`, `firestore`, `storage`, `app-check`, `functions`. Each extra SDK would add a label line and a privacy-manifest entry.
8. **Privacy manifests.** The Firebase iOS SDKs ship their own `PrivacyInfo.xcprivacy` and signatures (they're on Apple's list of commonly used SDKs). The app's own manifest adds the collected data types above. Check the built `.ipa` contains all of them.
9. **Encryption export:** HTTPS only, so `ITSAppUsesNonExemptEncryption = NO` (set in `app.config.ts` when the SDKs land).
10. **No new background modes.** Sync runs while the app is open and on launch. No background fetch (it draws review questions and isn't needed).
11. **The privacy policy (5.1.1(i)) and consent** gain the backup section (08 §7.4): what's backed up, where (Google Cloud, US), that it's optional, how long (until he deletes; 18 months idle; backups 35 days), and how to delete.
12. **18+ stays as it is:** no age is stored on our servers.

---

## 7. Indexes

- Every pull is `where serverAt > cursor orderBy serverAt` on one subcollection, which Firestore's automatic single-field index covers.
- The purge jobs need collection-group indexes on `(deleted, serverAt)` for each synced collection, and `users.lastActiveAt` (automatic).
- **Index exemptions:** `data` is excluded from indexing on every synced collection. It's never queried, and indexing JSON text would cost storage and write time for nothing.
- All of it is in `firebase/firestore.indexes.json`.

---

## 8. Costs this schema implies (checks against 08 §4)

| Action | Firestore writes | Reads |
|---|---|---|
| A fit check (check, reading, closet reading, ~4 sightings, ~2 closet items, 2–3 chat messages, wear log) | ≤ 14 | 0 (the phone already has it) |
| A question in Stylist (his message + the answer) | 2 | 0 |
| A day's morning card (idea, outfit, message) | 3 | 0 |
| Another phone listening | 0 | 1 per changed doc |
| A full restore after a year | 0 | ~3,000 (~$0.001) |

About 300 writes a month per active signed-in user, as 08 assumed. Within Firestore's free daily quota (20,000 writes, 50,000 reads) up to roughly 1,500 active signed-in users a day.

---

## 9. The acceptance checks (set before building)

Each check has an ID; the test or step that proves it is named. **Status Oct 15 (#290):** S and E pass in Jest on the in-memory stand-in for Firestore (31 tests). R and F pass on the Firebase emulator (16 tests; `npm --prefix firebase/tests run emulate`). Each group fails when its code is broken on purpose. D and A need the real project and the phone.

### S · Schema and codec (Jest, `syncSchema.test.ts`)
- **S1** Every synced table round-trips: row → doc → row is equal (minus the fields never sent), for a real row of each table from the seed fixtures.
- **S2** Every doc has exactly the envelope keys; `data` has ≤ 48 keys; no `undefined`; no array directly inside an array anywhere in a doc.
- **S3** The largest real row (a reading with the closet call) encodes under 200 KB (Firestore's limit is 1 MiB: a 5× margin).
- **S4** Never sent: no doc contains `birthYear` (profile, or inside `onboarding.basics`); no doc contains an absolute `file://` path; demo rows are never pushed.
- **S5** Local-only tables (`usage_days`, `event_queue`, `sync_*`) and kv keys are never pushed.
- **S6** Every table in `SPECS` and every `KV` key is classified as synced or local; adding one without a decision fails.
- **S7** Collection names are valid Firestore IDs and unique; every synced kv key is a valid document ID.

### E · The sync engine (Jest, `syncEngine.test.ts`, two simulated phones and one server)
- **E1** A local change is pushed once, with `updatedAt` = the change time; a second push sends nothing (no repeated writes: cost).
- **E2** A local delete becomes a tombstone with no `data`; the other phone deletes the row.
- **E3** Pull applies a remote doc only if it's newer; a tie goes to the higher device ID, the same on both phones.
- **E4** A pulled change isn't pushed back (zero writes after a pull).
- **E5** Two phones offline: edits to the same row end with the newer edit on both; edits to different rows both survive.
- **E6** A stale write the server refuses doesn't block the rest of the batch; the newer server copy is pulled instead.
- **E7** 1,000 changed rows go up in ≤ 3 batches of ≤ 400.
- **E8** First sign-in pushes every synced row and key exactly once; a fresh phone that pulls ends with the same synced tables and keys, row for row.
- **E9** A doc with a field from a newer app applies cleanly, and when this (older) phone writes the row back, the server keeps that field.
- **E10** The network failing mid-push loses nothing: nothing is marked pushed, and the next push sends it all.
- **E11** Kv: synced keys go up as `prefs` docs (with `birthYear` removed from `onboarding.basics`), local ones never.
- **E12** Files: a row's photo paths are queued for upload once; `-send` copies and cache paths never; a pulled row whose file is missing on this phone queues a download; a deleted row queues the remote file's deletion.
- **E13** The engine refuses to run in a demo build or when signed out.
- **E14** "Delete all my data" while signed in clears the sync bookkeeping too, so nothing is pushed afterwards.

### R · Security rules (Firebase emulator, `firebase/tests/rules.test.ts`)
- **R1** Signed out: no read or write anywhere, Firestore or Storage.
- **R2** Person A can't read, write or list person B's docs or files.
- **R3** Bad envelope refused: a missing or extra top-level key, `id` ≠ doc ID, `serverAt` ≠ server time, `updatedAt` more than a day ahead, `data` over 48 keys, a tombstone carrying `data`, `v` not an int.
- **R4** A collection not in the list is refused.
- **R5** An update with an older `updatedAt` than the stored one is refused; equal or newer is allowed.
- **R6** No client can hard-delete a doc or the account doc (only the server jobs can).
- **R7** A reading's `data` can't change after it's written; turning it into a tombstone is allowed.
- **R8** The phone can't set `deleteRequestedAt` or any field outside its list on the account doc.
- **R9** Storage: owner only; wrong folder, a nested path, a file over 3 MB, a non-image type, or a `.print` over 64 KB is refused; the owner can delete his own files.
- **R10** `devices` docs: own only, listed fields only, `lastSyncAt` = server time.

### F · Server jobs (Firebase emulator, `firebase/tests/functions.test.ts`)
- **F1** `deleteAccount` removes every doc under `users/{uid}` (every collection), every file under `users/{uid}/`, and the Auth user; running it twice succeeds; another person's data is untouched.
- **F2** `purgeTombstones` deletes only tombstones older than 180 days.
- **F3** `purgeInactive` deletes only accounts idle over 18 months.

### D · On the phone (after the packages and the project; you and Claude, ~20 min)
- **D1** Sign in with Apple works, asks for the email but no name, and the account doc has no personal fields (no email, name or age).
- **D2** Two phones (or the phone + Simulator): a fit check on one shows on the other within 5 s while both are open.
- **D3** Airplane mode: a check and a closet edit made offline sync after reconnecting, with nothing lost or doubled.
- **D4** A fresh install, signed in: closet, Lookbook, chats and facts come back; photos follow; onboarding is skipped; the birth year is asked.
- **D5** Delete account: the Apple token is revoked (the app disappears from Settings → Apple ID → Sign in with Apple), the Firestore and Storage folders are empty in the console, and the phone is wiped.
- **D6** Cost: one fit check writes ≤ 14 docs (Firestore usage tab).

### A · App Store (before submitting the version with sync)
- **A1** "Delete account and all data" is reachable in ≤ 3 taps from You and needs one confirmation.
- **A2** Sign in with Apple requests the email scope only (no name), and its button sits first, the same size as Google's.
- **A3** The privacy label lists exactly §6.6, no more.
- **A4** The `.ipa` contains the Firebase privacy manifests and ours lists the collected types.
- **A5** No analytics, crash or ad SDK is linked (check the Podfile.lock).
- **A6** `ITSAppUsesNonExemptEncryption` is `NO`; no new background modes.
- **A7** The privacy policy and consent describe backup, retention (18 months idle, 35 days of backups) and deletion.

---

## 10. Files

| File | What |
|---|---|
| `app/src/sync/schema.ts` | Which tables and keys sync, collection names, fields never sent, the file-path finder |
| `app/src/sync/codec.ts` | Row ↔ document |
| `app/src/sync/tracker.ts` | The store wrapper that records changes in `sync_rows` |
| `app/src/sync/engine.ts` | Push, pull, newest wins, tombstones, the file queue |
| `app/src/sync/remote.ts` | The interface the adapters implement |
| `app/src/sync/firestoreRemote.ts`, `storageTransport.ts`, `deviceFiles.ts` | The real adapters (#386, §11) |
| `app/src/sync/backup.ts`, `tracking.ts`, `appBackup.ts`, `appTracking.ts` | When sync runs, joining, restore, status, delete (§11) |
| `app/src/sync/memoryRemote.ts` | The in-memory server for tests, with the same checks as the rules |
| `app/src/data/migrations.ts` V7 | `sync_rows` and `sync_files` |
| `firebase/firebase.json` | The emulator and deploy config |
| `firebase/firestore.rules`, `firebase/storage.rules` | The security rules |
| `firebase/firestore.indexes.json` | The indexes and exemptions |
| `firebase/functions/src/index.ts` | `deleteAccount`, `cleanUpDeletedUser`, `purgeTombstones`, `purgeInactive` |
| `firebase/tests/` | The R and F checks on the emulator (`npm --prefix firebase/tests run emulate`) |

**Next, in order (each needs you first):**
1. ~~OK `firebase-tools` + Java so R and F can run on the emulator.~~ Done Oct 15 (#290): 16 of 16 pass.
2. The $99 program, then the Firebase project (E4, ~30 min; region `us-central1`).
3. ~~OK the React Native Firebase packages~~ not needed: the JS SDK already in the app does it (#386, §11).

The adapters, the wiring, restore and the Privacy line are built (§11).

---

## 11. Making backup real: the adapters, the wiring, restore and the failure cases (Nov 4, #386)

*Written before the code (AU1 in `10-onboarding.md` §10.6). The checks in §11.4 are the bar; their results go in §11.6.*

### 11.1 What he'll see
- **Never signed in, or a guest** (the server's silent account, `13-server.md` §8): nothing. Nothing is recorded, nothing leaves the phone.
- **Signed in (Google today, Apple with AU2):** his fits, closet, Lookbook, chats, facts and photos back up while the app is open. Nothing to tap.
- **You → Privacy & data, signed in:** one line under the photos row: `Backup` · `Up to date` / `Backing up…` / `Waiting to back up` / `Waiting for a connection` / `Not backed up yet`.
- **A new phone (or a reinstall):** Welcome → I already have an account → sign in → his birth year → `Bringing back your fits…` with the real counts as rows arrive (`214 fits · 38 pieces · 61 chats`) → `Your fits are back.` → Stylist. Photos fill in behind, newest screens first as they land.
- **An account with fits, on a phone with fits:** `This account already has fits`: Keep both merges; Use the account's (after the second yes) deletes this phone's own rows and their photos, then brings the account's back.
- **Delete account and all data:** the server copy (every document, every photo, the account) is deleted first; only if that worked is the phone wiped. A failure deletes nothing and says so.

### 11.2 Decisions (defaults; each is logged in #386)
1. **The Firebase JS SDK already in the app (`firebase` 12.19), no new package.** Firestore through `firebase/firestore` (memory cache: SQLite is the real copy), the server job through `firebase/functions`, files through Cloud Storage's REST API with expo-file-system's native upload and download (the JS Storage SDK needs Blobs, which React Native builds poorly from files; the native task streams the file from disk). Loaded lazily, so tests and the web preview never touch them.
2. **The adapters take their SDK as an argument** (`createFirestoreRemote({ fs, db, uid })`, `createStorageTransport({ http, … })`), so the same files run in Jest, on the phone, and against the emulators from `firebase/tests` (which has its own copy of the SDK).
3. **Photos go up as kept (2048 px, metadata already stripped), not re-encoded at 1600 px** (§3 said 1600): a re-encode needs native code and a reinstall for ~0.4 MB saved per photo. A file over the rules' 3 MB is skipped and logged; its row still syncs.
4. **The server cursor is in microseconds** (Firestore's own precision), so a batch of 400 docs with one `serverAt` is never re-read forever; the engine only orders by it.
5. **Offline:** the Firestore SDK holds a write while offline instead of failing, so every adapter call has a 20 s limit and reads go `FromServer`; a timeout counts as offline (nothing is marked sent, the next push sends it again; a held write that lands later is the same write, or refused as stale).
6. **When the phone records changes:** from the first sign-in on this phone (kv `sync.uid`), and still after a sign-out (on the phone only), so edits made while signed out go up at the next sign-in to the same account. Signing in to a different account clears the bookkeeping first. A guest is never recorded.
7. **When anything leaves the phone (all of these):** the app's account (`account.user`) is the Firebase user, who isn't anonymous; not a demo build; iOS; online; no fit check running (`fitCheck.busy()`, #371). Pushes go 5 s after the last change, at launch and on return to the foreground; pulls at launch and on return, then a live listener per collection while the app is open (D2: a check on one phone shows on the other in seconds). Nothing runs in the background.
8. **Cellular and battery:** rows always go (a few KB). Photos move only in the foreground, one at a time, never during a check. Telling Wi-Fi from cellular and Low Power Mode needs `expo-network` and `expo-battery` (Expo's own, a reinstall): the founder's OK (to-do, P2); until then photos also go on cellular (~0.7 MB a check).
9. **A photo another phone hasn't uploaded yet** (its row arrived first) is retried with a backoff up to 6 h for 4 days before it's dropped; a photo already gone from the server when deleting counts as deleted.
10. **Holdings (A4's counts, A5's question):** read from the server right after sign-in: the fits are counted exactly (his scored checks, not re-checks) by reading the fit-check documents once; pieces and chats by Firestore's count query. Then the restore shows the counts as rows land on this phone.
11. **Restore order:** rows first; then the birth year Basics asked and the fit go onto the restored profile (a profile written first would be newer and overwrite his synced one); photos after, in the background.
12. **Keep both** = pull, then push only this phone's rows the account doesn't have. **Use the account's** = delete this phone's synced rows (not the profile: it holds his birth year, which never syncs) and their photo files, the synced kv keys (not the Basics draft), then pull.
16. **Two per-phone facts stop syncing:** the agreement (`consentVersion`, `consentAt`: consent is per phone, #252) and `onboarding.done` (a restored phone closed before the birth year would otherwise skip it at the next launch).
13. **The account doc** (`users/{uid}`: `createdAt`, `lastActiveAt`) and this phone's `devices/{id}` are written at most once a day, so `purgeInactive` can find idle accounts.
14. **Delete account:** the `deleteAccount` job first (it deletes the documents, the files and the Auth user), then the sign-in's own `deleteAccount` (which revokes Google's or Apple's grant; the Auth user already being gone still counts as done), then the phone is wiped. **AU4 decided: the job stops requiring App Check** until AU3 ships: it needs a signed-in caller and deletes only that caller's own data, so App Check adds no protection to it. This is a server change: it ships only with the founder's OK to deploy.
15. **"Delete all photos" while signed in** also deletes them from the backup (the queue removes every backed-up file), since he'd expect them gone; rows keep their scores.

### 11.3 Files
| File | What |
|---|---|
| `app/src/sync/firestoreRemote.ts` | `RemoteStore` on Firestore: batches with `serverAt = serverTimestamp()`, tombstones drop `data`, merge writes, microsecond cursors, `FromServer` reads, timeouts, error mapping; holdings; the account and device docs; live listeners |
| `app/src/sync/storageTransport.ts` | `FileTransport` on Storage's REST API, given an http port (expo-file-system on the phone, `fetch` + `fs` in the emulator tests) |
| `app/src/sync/backup.ts` | The controller: who may sync, when (debounce, launch, foreground, listener), the fit-check pause, join (merge / replace), restore, status, delete |
| `app/src/sync/firebaseBackup.ts` | Builds the real adapters from the app's Firebase app (lazy) |
| `app/src/data/db.ts` | Exports the tracked store (and the raw one for the engine) |
| `firebase/tests/sync.test.ts` | X1–X8 on the emulators |

### 11.4 The checks (written first)
**B · The app (Jest, `backup.test.ts`, memoryRemote and two phones)**
- **B1** Never signed in, or a guest: a change records no sync row and makes no remote call.
- **B2** Signed in: a change reaches the server once, 5 s after the last change; `birthYear` and local-only keys never do.
- **B3** Offline (a timeout too): nothing is marked sent; when the connection returns, it all goes, once.
- **B4** While a fit check runs nothing is pushed and no photo moves; it goes when the check is done.
- **B5** A half-done upload (the app closes mid-photo): the photo stays queued and goes next launch; its row is already up.
- **B6** A reinstall: a fresh phone signed in to the account gets every row back and its photos; the profile keeps the birth year Basics asked; onboarding isn't marked done by the account (A4 does it after the birth year).
- **B7** Two phones editing the same row: the newer edit ends up on both; edits to different rows both survive.
- **B8** Keep both adds this phone's rows to the account; Use the account's leaves only the account's rows (and the profile's birth year), deletes this phone's own photos, and pushes nothing of the old ones.
- **B9** Sign out: nothing is pushed while signed out; edits made then go up at the next sign-in to the same account; a different account starts from a cleared bookkeeping.
- **B10** Delete account: the server job is called before anything local; a failure deletes nothing and keeps him signed in; success signs out and wipes (even if the provider's own delete then fails).
- **B11** Demo builds and the web preview never sync.
- **B12** The status line: up to date, waiting (n), backing up, offline, not yet.
- **B13** A photo over 3 MB is skipped and logged; its row syncs.
- **B14** A photo not uploaded yet on the other phone is retried, not dropped, for 4 days; a 404 on delete is done.
- **B15** "Delete all photos" while signed in queues every backed-up photo's removal.

**X · On the Firebase emulators (`firebase/tests/sync.test.ts`, the real rules, the real adapters)**
- **X1** Phone A (signed in) pushes rows of every kind; phone B (a fresh store, same account) pulls them and ends equal, row for row.
- **X2** A tombstone has no `data` on the server; B deletes the row.
- **X3** A stale write is refused by the rules and the engine pulls the newer copy instead (E6 for real).
- **X4** A pull over a batch with one `serverAt` and more docs than a page never stalls or skips.
- **X5** A photo goes up to `users/{uid}/files/photos/…` and comes down on B byte for byte; a delete removes it; another person can't read it.
- **X6** A newer app's extra field survives an older phone's write (merge).
- **X7** Holdings count scored fits (not re-checks), pieces and chats.
- **X8** The account doc and the device doc pass the rules once a day.

**Still on the phone (D1–D6 above)**, after the merge and the deploy.

### 11.5 What stays off, and what needs the founder
- **Deploy (his OK):** `deleteAccount` without App Check, plus `cleanUpDeletedUser`, `purgeTombstones`, `purgeInactive`. Until then "Delete account and all data" can't finish for a signed-in account (it says so and deletes nothing).
- **Packages (his OK, P2):** `expo-network` and `expo-battery` for Wi-Fi-only photos and Low Power Mode.
- **Accounts stay behind `ACCOUNTS_BUILT`** (off in Release): on his phone only the dev Google sign-in reaches this.

### 11.6 Results (Nov 4)
- **B1–B15 pass** in Jest (`app/src/__tests__/backup.test.ts`, 23 tests), and E1–E14 and S1–S7 still pass (E8 now expects the agreement to stay on its phone). Each check was run against the built code; B13–B14 also drive the real `storageTransport.ts` with a fake http.
- **X1–X8 pass on the emulators** with the real rules (`firebase/tests/sync.test.ts`; 82 of 82 with R, F and the server's checks, `npm --prefix firebase/tests run emulate`). Found on the way: Storage refuses a plain upload (the rules can't see its type), so uploads use the SDK's resumable protocol (a small start request with the type, then the bytes, which the phone sends natively); the rules still judge the finished file (a text file is refused).
- **`npm run check` green.**
- **Not yet:** the phone or the Simulator (D1–D6), so the Firestore SDK's connection on React Native, expo-file-system's native upload to Storage, and the restore screen on a device are untested; the deploy; Apple's revoke order (AU2).

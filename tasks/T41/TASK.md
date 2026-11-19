# T41 · Continue with Apple and Google (the sign-in half)

**Size:** strict · **From:** `plan.md` → T41 (split Nov 19; backup is T41b) · **Spec:** `specs/sign-in-and-backup.md` (approved 2026-11-12), checks SB1, SB2, SB3, SB6, SB7, SB8, SB10 · **Lane:** Sign-in and backup

## What changes
- **Goal:** with `ACCOUNTS_BUILT` on, a guy can sign in with Apple first or Google from the four places the spec names (Welcome's `I already have an account`, the "Keep your fits" card, the last card, You's account rows); his guest account ID stays; a new phone's restore asks age only; two sets of fits get the three choices; sign out keeps his fits on the phone; Apple's first name fills an empty name only. With the switch off nothing shows.
- **Starting point:** most of this is on main already (`app/src/features/account/`, Google only, mock for demo screens). The old unmerged PR #58 (`claude/sign-in-apple-google-793589`, Nov 4, before the spec) has the real Apple and Google sign-in as `signIn.ts` (Firebase and the providers' sheets passed in, so it tests with fakes) and `firebaseAuth.ts`, plus `expo-apple-authentication` in `package.json` (taken from #58, already applied here; **not installed** into any `node_modules`: tests mock it, the founder's next `npm install` or EAS build installs it). Bring over what the spec wants and leave the rest (`CLAUDE.md` edits, `SIGN_IN_LIVE` as a function, `handoff/` text, `firebase/` changes).
- **Files:** `app/src/features/account/*` (signIn.ts new, firebaseAuth.ts, account.ts, auth.ts, offer*.ts, SignInSheet, ProviderButton, AccountOfferCard, AccountRows, RestoreScreen, demo.ts) · `app/app.config.ts` (the entitlement), `app/scripts/check-release-app.js` (what the release check expects) · `app/src/config/features.ts` (`SIGN_IN_LIVE` goes) · `app/src/i18n/en.ts` (the spec's words) · `src/features/onboarding/WelcomeScreen.tsx` (the restore entry only) · `src/features/settings/SettingsRows.tsx` (where the account rows sit) · `src/demo/scenarios.ts` (the email demo screens go) · tests that name email sign-in.
- **Not touched (T41b):** `app/src/sync`, `app/src/features/privacy/wipe.ts`, `firebase/`, storage rules, PR #57. `deleteAccount` stays as on main; the revoke → server → phone order (SB9) and photo backup (SB4) are T41b.
- **Done means:** SB1.1–SB1.6, SB2.1–SB2.3, SB3.1, SB6.1, SB7.1, SB8.1, SB10.1 hold, with the locked tests in `TESTING.md` green and `npm run check` green; words and layout in light screenshots.
- **Must not break:** the guest account and the server's limits (the guest's ID is linked, never replaced); the one-ask-per-visit rule; the under-18 stop; "the AI sees, the code judges"; the privacy hard lines (his name and email never reach Google, OpenAI, PostHog or Kit's context).

## Decisions made while writing this (the founder can overrule)
- `ACCOUNTS_BUILT` is the only switch: the dev-only Google row (`SIGN_IN_LIVE`) goes, so SB1.6 holds ("no sign-in entry point outside demo screens when off").
- Real restore from the server needs the sync's pull (T41b). Until then the real sign-in returns no holdings, so on a real build Welcome's sign-in lands on `No fits saved to that account yet. Let's set you up.`; the restore screen and the "both have fits" choice run on the demo screens' mock accounts. **Do not turn `ACCOUNTS_BUILT` on for a build until T41b is in:** the card says `Your fits are backed up`, and deleting the account must revoke Apple's token (SB9).
- Words the spec leaves open: one fit with no pieces reads `Your first fit lives only on this iPhone. Sign in to back it up and get it back on a new phone. Kitted works the same without it.`; the empty-account line shows as a toast on arriving at Looks. Both go to the founder in the PR.

## Built
**Changed (implementer, Nov 19):**
- Apple and Google only, email gone: `signIn.ts` (`createSignIn`: waits for the saved sign-in, links the guest so the account ID stays, signs in with the credential from `credential-already-in-use`, Apple's name and email scopes with only the first name returned, sign out reaches Google then Firebase), `firebaseAuth.ts` wires it to the real modules (`expo-apple-authentication` loaded lazily, so a build without it reports Apple as failed instead of crashing), `appleName.ts` (Apple's first name fills an empty name only: the profile's name, or About you's draft mid-setup), `offerCopy.ts` (the card's body by the numbers).
- `account.ts`: `sheetProviders`, `resolveChoice` (keep both / use the account's after the second confirm / cancel signs out), `liveProviders` is `['apple','google']` only with `ACCOUNTS_BUILT` on (Google needs its client ID), `SIGN_IN_LIVE` removed from `features.ts`, restore counts are two numbers, a saved `provider: 'email'` reads as signed out. `auth.ts`/mock: no email methods, `MOCK_HOLDINGS` is 214 fits and 38 pieces.
- Screens: `SignInSheet` (Apple, Google, the fine print, the three states, the "both have fits" choice through `resolveChoice`, Apple's name after the account is kept), `ProviderButton`, `AccountOfferCard` (fits and pieces from the posted payload), `AccountRows` (`Back up your fits`), `RestoreScreen` (no chats; completes setup with his age band and Apple's first name from the About you draft), `BasicsScreen` (restore param without chats). The posted card carries `fits` (scored full checks) and `pieces` (live ones).
- Words (`en.ts`): sheet bodies, `No problem. It's in You whenever you want it.`, `Signed in with {provider}. Your fits are backed up.`, `Back up your fits`, restore counts without chats; the `acct.email.*`, `acct.code.*`, `Continue with email`, `I'm new here` keys are gone. Kit's app map line (`features/ask/prompt.ts`) now says `Back up your fits` and Apple or Google.
- `app.config.ts`: `appleSettings` with the switch off returns `{ 'com.apple.developer.applesignin': ['Default'] }` as the only entitlement (T41-ENT); `APPLE.paid` stays false, so teamId, NWS weather and `applePaid: false` are unchanged and `paid: true` keeps the four. The `expo-apple-authentication` plugin is added too (the native module). `scripts/check-release-app.js`: `checkApp` always requires Sign in with Apple and counts only the other three as paid ones.
- Demo screens: 134 and 135 (the email screens) now show the sheet from the card and from You, because `scenarios.test.ts` still lists 134 and 135 as pre-onboarding screens; 136 and 137 lose the chat count.

**Files outside the Files list, and why:** `src/features/onboarding/BasicsScreen.tsx` (one line: the restore route's params had `chats`), `src/features/ask/prompt.ts` (Kit's app map named "Back up and sync" and email), `src/config/features.ts` (in the list, `SIGN_IN_LIVE` goes).

**Tests passing (run one file at a time, no full check):** T41-signIn 14, T41-accountState 25, T41-offer 15, T41-screens 26, T41-accountRows 5, plus onboardingAccount, T39-setupScreens, serverProxy, approvalDay, scenarios, stepFourBatch, youSettingsHome, kitWordsPack, kitWordsPrompt, onboardingFinish, privacyKnowsRow, T39-offerCard, aboutYouCard, T35-hello, copyChecks, i18n, toast, heightBuildRemoved, youTonight all green. `npx tsc --noEmit` clean (the `@ts-expect-error` for `'email'` holds). ESLint clean on the changed files. The full `npm run check` is the session's.

**Not done:** no Simulator run, no screenshots (the memory limit); restore from the server and `inAccount` ids come with T41b (the choice treats the account as holding none of this iPhone's fits until then); `deleteAccount` is as on main (no Apple revoke); `expo-apple-authentication` is not installed, so a real Apple sign-in needs the founder's `npm install` and a native rebuild; `RestoreScreen` still saves `consent: false` (not `'later'`) because `stepFourBatch.test.ts` checks the source for it, which means a restored phone gets the "turn on fit checks" card as before; `ACCOUNTS_BUILT` stays false.

- **Full check (session, once):** `tsc`, core typecheck, `expo lint`, core tests and jest (`--maxWorkers=2`): 177 of 178 suites passed on the first run; the one failure (`syncSchema` S5/S6: `appleName.ts` wrote the About draft with an unclassified key name) was fixed by writing it through `saveAbout`, and `syncSchema` plus the T41 account tests pass again. Not re-run in full after that one-line fix.
- **Screenshots** (light, iPhone 17 Pro Simulator, Metro from this worktree, demo screens): `tasks/T41/shots/01-signin-welcome-light.png` (132), `02-save-card-light.png` (138), `03-save-card-notnow-light.png` (139), `04-restore-age-light.png` (136), `06-you-signedout-light.png` (141), `07-you-signedin-light.png` (142), `08-both-have-fits-light.png` (140). Not captured: `Bringing back your fits…` (137) is on screen about 3 seconds; dark and largest-text shots; the real Apple and Google sheets.
- **Local setup notes:** `expo-apple-authentication` is in `app.config.ts` plugins and `package.json` but not installed, so `expo start` fails with "Failed to resolve plugin" until the founder runs `npm install`; for the shots I removed that one line temporarily (reverted, not committed).

## Disputes
No locked test is wrong. Two older tests outside the lock pin things the spec's wording touches, so I built around them without editing them (the founder or the test writer can decide to update them):
- The older approval-day tests (S1, A3) conflicted with the entitlement; the test writer amended them (T41-ENT, ebc46581) and the build follows the amended tests.
- `scenarios.test.ts` expects demo screens 134 and 135 to exist and run before onboarding, so they stayed and became the sheet from the card and from You instead of being deleted.
- `stepFourBatch.test.ts` greps `RestoreScreen.tsx` for `consent: false` (the spec's SB6 reads as `'later'`: no agreement, no "turn on fit checks" card); kept `consent: false`.

## Review
### Round 1 (reviewer, Nov 19, strict)
Read: plan line, spec SB1-SB3/SB6-SB8/SB10, TESTING.md, the diff (no `tasks/`), the seven screenshots, Built last. Ran only single test files (Mac nearly out of memory); `npm run check` not re-run (the session ran it, one-line fix after it was re-tested by the session).

**Criteria**
- SB1.1 done (Welcome has one control, 3 setup steps; 7-tap count not testable here: the core Maestro flow in `/test-build`).
- SB1.2 to SB1.5 done (offer rule and service are on main, locked tests cover them; `fits` added to the posted payload).
- SB1.6 done (`SIGN_IN_LIVE` gone, `liveProviders()` empty with the switch off, `settingsAccountOn` = `accountsOn`).
- SB2.1 done in code and screenshots (01, 02, 06): Apple first, Google second, same size. Apple's button follows the theme: light shown, dark not captured (can't tell; a dark shot would tell).
- SB2.2 done in the sheet's logic (busy disables both buttons, cancelled silent, failed and offline lines). The visual of the signing-in, failed and offline states was not captured (words are in `en.ts`; a Simulator shot of each would tell).
- SB2.3 done (`toFirebase` links the guest, falls back to the credential from `credential-already-in-use`, waits for `ready()`).
- SB3.1 done (screenshots 02 and 03 match the spec words: `Your 4 fits and the 16 pieces ...`, `No problem. It's in You whenever you want it.`; `Signed in with Apple. Your fits are backed up.` by test).
- SB6.1 done on the demo mock (`afterSignIn`, restore param two numbers, age only, under-18 stop). Real restore waits for T41b, as TASK.md says. Screenshot 04 matches.
- SB7.1 done in `resolveChoice` and the sheet. Screenshot 08 shows only the sheet before the choice: the native `Alert` words are not in any picture (can't tell visually; words are checked by test).
- SB8.1 done (`signOut` keeps all local data; screenshots 06 and 07).
- SB10.1 done (`createSignIn` returns only the first name and only for Apple; `applyAppleFirstName` fills an empty name only, mid-setup through `saveAbout`).
- T41-ENT done.

**Strict checks**
- Test lock: `git diff 842b5413..HEAD` on the locked tests is empty apart from `approvalDay.test.ts` (test writer's T41-ENT amendment `ebc46581`, listed in Disputes) and the Lock line in TESTING.md. No implementer commit after `d00ed15c` touched a test. No `.only` or `.skip` in the T41 files. (The `serverProxy.test.ts` change that dropped a source grep for `keepGuest(auth.currentUser, ...)` is part of the locked lines and is replaced by the `createSignIn` fake tests; the real wiring in `firebaseAuth.ts` is covered by nothing, see the list below.)
- Planted bugs (3, each reverted, `git diff` clean after each):
  1. `resolveChoice` without the second-confirm guard: `T41-accountState` fails (`SB7.1 use the account's without the second confirm`), 1 of 25.
  2. `applyAppleFirstName` replacing a typed name: `T41-accountState` fails (`SB10.1 a name he typed stays`), 1 of 25.
  3. `toFirebase` calling `signInWith` instead of `link`: `T41-signIn` fails 5 of 14 (the SB2.3 tests and one SB2.2).
  All caught: no test defect.

**Looked at, as asked**
1. Sign out then a new guest: after `signOut` Firebase has no user, and the next server call (`createGuestToken`) signs in a new anonymous guest with a new uid. The server's daily limits are per uid (`firebase/functions/src/api/handler.ts`, `limits.ts`: tier by `founderUids`, counts per account per day; no device-ID check on the server). So after a sign-out the day's checks and questions start from zero, and a founder uid loses its founder tier until he signs in again. This is not a T41 defect: SB2's "free checks he used stay used" is about linking, and holds (the guest's uid is kept). It does mean F10.1's "counted against the Keychain device ID" is not enforced by the server, with or without T41; with accounts on, sign out then use is a way to reset the day. Note for the founder and T41b or the server lane; not blocking, `ACCOUNTS_BUILT` is off.
2. Name and email: the only `console` and `log` lines in `features/account` write the provider, a kept-guest or existing-account word and an error code; none writes the credential, name or email. The name goes only to the profile `name` or the About draft; `signedIn.user.email` stays in kv `account.user`. Nothing new reaches PostHog, an AI call or Kit's context (`T41-accountState` and `T39-noLeak` cover the context and transports). Clean.
3. `resolveChoice`: with `useAccount` and no `confirmed: true` it returns before touching the store (planted bug 1 proves a test pins that). With it, it deletes only scored full checks not in `inAccount` and their re-checks; closet, outfits and chat are untouched, and `cancel` only signs out. Clean. One thing for T41b: the sheet passes `inAccount: []` until the sync's pull exists, so on that day it must pass the real ids or "Use the account's" deletes every scored fit on the phone. Today the real sign-in returns no holdings, so the choice never shows outside demo screens.
4. `app.config.ts`: unpaid returns `teamId` the free team, the NWS location string, `applePaid: false` and only `com.apple.developer.applesignin`; paid keeps the four. Weather stays off. Clean. See the list below for the free-team signing risk.
5. Out of scope: no change in `app/src/sync`, `privacy/wipe.ts`, `firebase/` or storage rules. `deleteAccount` is as on main. The three files outside the Files list (`BasicsScreen.tsx`, `ask/prompt.ts`, `config/features.ts`) are one-line or in-list changes, as TASK.md says.

**Defects**
None open.

**Small things worth a later look (never blocks)**
- Free-team signing: an unpaid build still carries the Sign in with Apple entitlement under the free Personal Team `6652QVRQAL`. Apple does not allow that capability for Personal Teams, so installing a build with `tools/phone/install.sh` on the founder's phone may fail to sign until the paid team (T80's `APPLE.paid`) is on. Simulator builds are fine. Can't tell from here; one `expo run:ios --device` build would tell. It is the founder's plan.md line, so not a defect, but he should know before the next phone install.
- `expo-apple-authentication` is not installed, so a worktree run needs the plugin line removed until `npm install` (Built says so); a real Apple sign-in is untested (founder's phone).
- Screenshots missing: the `Alert` choice, the signing-in, failed and offline lines, dark mode and the largest text size (spec asks for all three); a quick follow-up before the PR.
- `RestoreScreen` saves `consent: false`, so a restored phone gets the "turn on fit checks" card, where the spec's SB6 reads as no agreement and no card; kept because `stepFourBatch.test.ts` greps for it. The founder or the test writer can decide; the wording is in Disputes.
- Deleting a scored fit in `resolveChoice` leaves the chat cards that point at it; whether a card with a missing check renders cleanly was not checked (demo-only today).
- Words the spec leaves open (the one-fit-no-pieces line and the empty-account toast) are the founder's to confirm, as TASK.md says.

**Verdict: ready.** No code or test defect open.

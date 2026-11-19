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
Filled in by the implementer and the session.

## Disputes
None yet.

## Review
Written by the reviewer.

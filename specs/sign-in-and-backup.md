# Sign-in and backup

**Approved by the founder:** 2026-11-12

After this, a guy can sign in with Apple or Google, never before his first score and never through a pop-up, and a new phone brings back his fits, scores, closet, style profile and what Kit knows (his photos too, if he turned photo backup on). "Delete account and all data" also wipes our server.

**Part of:** `specs.md` → "Sign-in (optional)", F11, F9.1, F1.4. Works with `specs/onboarding-screens.md` (owns Welcome's layout, OS1, and the Restore step's look, OS3) and `specs/setup-and-you.md` (owns You's row order, SY1, and the name's rules, SY4). Where they meet, the line is named below.

## Why
Today every fit lives only on his phone: a lost or replaced phone loses them all (iCloud Backup aside). The design dates from Oct 15 (`handoff/10-onboarding.md` §3–§4, #289), with the founder's Oct 16 pick of a chat card over a pop-up (#300) and Apple and Google only (Nov 3). The founder confirmed where and when in the Nov 12 interview. The reasoning: the score comes first, because nothing before it should cost a tap. An account is worth asking for only once there's something to lose. Apple's guidelines say not to require sign-in for features that don't need an account (5.1.1(v)), and to make one request at a time.

## Scope
- **In:** where sign-in is offered (SB1), the sign-in sheet (SB2), the "Keep your fits" card (SB3), photo backup (SB4), what's backed up (SB5), a new phone (SB6), an account and a phone that both have fits (SB7), sign out (SB8), deleting the account (SB9), Apple's first name (SB10).
- **Out (non-goals):** email sign-in (v1.1); a sign-in step anywhere in setup; Apple or Google buttons on Welcome itself; a pop-up or sheet that opens on its own; offers after buying Pro or in Privacy & data; a third card; backing up chats (his questions and Kit's answers); backing up his name or age band; Android; the web deletion page and "Download my data" (later).
- **When:** first ships in a TestFlight build before launch (founder, Nov 12). The first beta build has none (`ACCOUNTS_BUILT` off). Needs Sign in with Apple turned on for the app (Y21) and its entitlement on in the build.

## SB1. Where sign-in is offered
Four places, and no others:
1. **Welcome:** `I already have an account`, as today's layout (OS1) → the sheet (`from=welcome`) → SB6.
2. **The first card** in the Stylist chat (SB3). It posts once, when all of these hold:
   - he isn't signed in;
   - a fit check is scored;
   - nothing is reading, and nothing is waiting for his tap;
   - his first re-check is scored, **or** this is a later visit than the one that scored his first fit. A visit starts at launch, or when he comes back after 30 minutes or more away.
   It waits its turn under the one-ask-per-visit rule: the setup sequence (the closet card, the upgrade page, the notification ask) goes first. If anything else asked this visit, the card waits for the next.
3. **The last card:** only after `Not now` on the first, and only after 3 more scored fit checks (re-checks don't count). Never a third card.
4. **You:** the account rows, first in You's rows (SY1). Signed out: `Back up your fits` with the detail `Off · on this iPhone only` → the sheet (`from=you`). Signed in: `Signed in with Apple` (or Google) with his email (`Hidden email` for an Apple relay address), then `Sign out`.

Never: before his first score, as a pop-up, while the paywall or the camera is up, while signed in.

## SB2. The sign-in sheet
- Title: Welcome `Welcome back` · the card `Keep your fits` · You `Back up your fits`.
- Body: Welcome `Sign in to bring back your fits and closet.` · the others `Back up your fits and closet, and get them back on a new phone.`
- `Continue with Apple` first (Apple's own button: black in light, white in dark), then `Continue with Google` at the same size, with Google's G.
- Fine print: `Optional. Kitted works the same without an account.` Once the terms and privacy links exist: `By continuing, you agree to the Terms and Privacy Policy.`, both as links.
- States:
  - **Signing in:** only the tapped button shows a spinner and says `Signing in…`. Both buttons are off; X cancels.
  - **Cancelled** at Apple's or Google's sheet: nothing is shown; the sheet stays as it was.
  - **Failed:** one line above the buttons: `Couldn't sign in with Apple. Try again, or use another way.` (Google the same.)
  - **Offline:** `Signing in needs a connection. Your fits are safe on this iPhone.` The buttons stay on, to retry.
  - **Account and phone both have fits:** SB7.
  - **Done:** SB4's step, then the sheet closes with the toast `Signed in with Apple.`
- Signing in links his guest account to Apple or Google under the same account ID. Free checks he used stay used (F10.1).

## SB3. The "Keep your fits" card
An inline Kit card in the Stylist thread, never a modal.
- Tagline `Your account` · `Optional`. Title `Keep your fits`.
- Body: `Your {n} fits and the {m} pieces in your closet live only on this iPhone. Sign in to back them up and get them back on a new phone. Kitted works the same without it.`
  - With one fit: `Your first fit`.
  - With no pieces in Closet, the closet part is left out: `Your {n} fits live only on this iPhone. …`
- Buttons: `Save my fits` (opens the sheet) · `Not now`, the same size.
- After `Not now`, the card shrinks to one line: `No problem. It's in You whenever you want it.`
- After signing in: `Signed in with Apple. Your fits are backed up.`

## SB4. Photo backup
- Off by default. It's offered once, right after a sign-in succeeds, as the sheet's last step, so it works the same from the card, You and Welcome (Claude's call):
  - `Signed in with Apple. Your fits are backed up.`
  - `Your photos stay on this iPhone.`
  - Buttons: `Back up photos too` · `Done`.
  - On a restore to an account whose photo backup is already on, the step is skipped.
- The switch, in You → Privacy & data, signed in only: `Back up photos`, with the footnote `Your photos are stored as you took them. Only you can see them.`
- Turning it off: `Turn off photo backup? Your backed-up photos are deleted from our server. They stay on this iPhone.` · `Turn off` · `Cancel` (Claude's call, assumed).
- The setting belongs to his account, so a new phone follows it.
- Uploads go after the row, Wi-Fi first, resumable. Only the photos he kept, never the face-blurred copy or caches. Readable only by his account (F11.4).

## SB5. What's backed up
- **Backed up:** fit checks (reading, score, fixes, occasion, look), closet pieces (as the privacy table in `specs.md` says), outfits, the wear log, Lookbook flags, the style profile (looks and fit only), what Kit knows (facts with their sources). Photos only with SB4 on.
- **Never backed up:**
  - chat messages: his questions and Kit's answers, per the hard line "the server keeps no questions or answers";
  - his name and age band (SY4);
  - the under-18 lock;
  - notification settings, demo state, logs.
  Usage counts are the server's own.
- The phone stays the real copy and works offline as today. Backup runs in the background.

## SB6. A new phone (from Welcome)
- Sheet → an account with fits → the Restore step, age only (OS3: `Welcome back` · `Your age first, then I'll bring back your fits.`).
  - Under 18 → the age stop, as always.
  - 18 or over → a full screen with no Back: `Bringing back your fits…`, the counts as they arrive (`214 fits · 38 pieces`), then `Your fits are back.` → Stylist, with the rest of setup skipped.
- An empty account → `No fits saved to that account yet. Let's set you up.` → Looks, signed in.
- The privacy agreement still shows on the first camera open on this phone (SY5).
- His name isn't restored: Apple's first name fills it (SB10), or he sets it in Style profile.

## SB7. An account and a phone that both have fits
- Title `This account already has fits`.
- Body `Your Apple account has 214 fits saved. This iPhone has 3 that aren't in it.`
- Buttons:
  - `Keep both` (the default; merges);
  - `Use the account's` (a second confirm, then this iPhone's 3 are deleted);
  - `Cancel` (stays signed out).
- Nothing is deleted without the second confirm.

## SB8. Sign out
- Confirm: `Sign out? Your fits stay on this iPhone, but stop backing up.` · `Sign out` · `Cancel`.
- Everything stays on the phone, and the backup stops.

## SB9. Delete account and all data
- Signed in, Privacy & data shows `Delete account and all data` (red) in place of `Delete all my data`.
- Confirm: `Delete your account? This deletes your account and every fit, photo and closet piece in it, on this iPhone and in your backup. It can't be undone.`
- The order:
  1. revoke Apple's sign-in token;
  2. delete the server's copy once (database, photos, the account);
  3. wipe the phone as "Delete all my data" does.
  The under-18 lock stays.
- Offline: `Deleting your account needs a connection. Nothing was deleted.`
- If the server's delete fails: nothing on the phone is deleted, and the same line offers `Try again`.

## SB10. Apple's first name
- Sign in with Apple asks for name and email. Apple gives the name only on his first-ever Apple sign-in to Kitted.
- Apple's first name fills an empty name and never replaces one he typed (F1.4).
- The name and email never reach Google, OpenAI or PostHog, or Kit's context (F1.5).

## Checks
- SB1.1 A fresh install reaches the camera in 7 taps with no sign-in step (F1.1 unchanged).
- SB1.2 No card before a scored fit. None while reading or waiting for a tap, while signed in, or while the paywall or camera is up. Never as a modal.
- SB1.3 The first card posts on the first re-check scored or on a later visit (30+ minutes away), never in the visit that scored his first fit.
- SB1.4 In a visit where the setup sequence or another ask posted, the card waits for the next visit.
- SB1.5 The last card needs `Not now` plus 3 more scored full checks (re-checks don't count). There's never a third.
- SB1.6 With `ACCOUNTS_BUILT` off, no sign-in entry point renders outside demo screens.
- SB2.1 Apple first, Google second, same size; Apple's button follows the theme.
- SB2.2 Signing in, cancelled, failed and offline each look as written. Nothing can be tapped twice.
- SB2.3 After sign-in, the account ID is the guest's (a used free check stays used).
- SB3.1 The card's words match SB3 for 1 fit, many fits, and no closet pieces; `Not now` and signed in show their one line.
- SB4.1 Photo backup is off after sign-in until he taps `Back up photos too` or turns the switch on. With it off, no photo reaches Storage (emulator test).
- SB4.2 Another account can't read his photos (security rules test).
- SB4.3 Turning it off deletes his backed-up photos from Storage after the confirm.
- SB5.1 Chat messages, name, age band and the under-18 lock are never written to the server (sync schema test).
- SB6.1 From Welcome, an account with fits asks age only, then restores and skips setup. Under 18 stops. An empty account continues setup signed in.
- SB7.1 Keep both merges. `Use the account's` deletes only after the second confirm. Cancel stays signed out.
- SB8.1 Sign out keeps every fit on the phone and stops backup.
- SB9.1 Delete runs revoke → server → phone. Offline or a server failure deletes nothing. The under-18 lock stays.
- SB10.1 Apple's first name fills an empty name only, and never reaches an AI call or Kit's context.
- Words and layout: screenshots in light, dark and the largest text size. Real Apple and Google sign-ins are tested on the founder's phone (his passwords; Claude never types them).

## Lane files
`app/src/features/account/`, `app/src/sync/` (chat → local in `schema.ts`), `app/src/features/privacy/wipe.ts`, `app/src/config/features.ts`, `app.config.ts` (the Sign in with Apple entitlement, split from T80's switch), `firebase/functions` (deleteAccount, Storage rules), `en.ts`.

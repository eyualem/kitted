# 10 · Onboarding and accounts: the flow from first launch to the first fit, and where sign-in fits

*Oct 15, 2026 (DECISIONS-LOG #289). Owns: the onboarding flow end to end, the example check (O1e), the account screens (A1–A5: Continue with Apple, Google, email), where and when sign-in is offered, and the pass/fail checks this flow is tested against. `02-screens.md` D1–D4 still owns each existing screen's layout and copy; this file owns the flow and the new screens. `08-accounts-and-sync.md` owns the backend (Firebase), sync and deletion on the server.*

*The founder asked (Oct 15): "design an onboarding flow … flawless … use the best practices … plan for account setups: continue with Google, continue with Apple ID, and continue with email. We're going to set up Firebase later." That revises ruling 8 ("no accounts in v1") and 08 §8's "sign-in never in onboarding" (see §2).*

---

## 0. The short version

- **The path to the first score stays short and account-free:** Welcome → Looks → Basics → Consent → camera. Three questions, one agreement, then the photo. No sign-up wall (it would break Apple 5.1.1(v), and every extra step before the first score loses people).
- **Sign-in is offered at three moments, never required:**
  1. **Welcome → "I already have an account"** for someone on a new phone (it skips setup once his data is back).
  2. **After his first fit has been scored and he's come back to it** (the next visit, or his first re-check): an inline "Keep your fits" card in the chat. Not a pop-up. At most twice, ever.
  3. **You → Settings → Account**, any time.
- **One sign-in sheet does all three:** `Continue with Apple` (first, the HIG's black/white button), `Continue with Google`, `Continue with email` (a code by email, no password; §4.3), and a line that says it's optional.
- **Firebase isn't set up yet,** so sign-in runs on a stand-in (`MockAuth`) behind the same interface Firebase will fill (`features/account/auth.ts`). The account screens are switched off in real builds (`ACCOUNTS_BUILT = false`) and shown on demo screens 130–143, so nothing on his phone pretends to sign in.
- **The example check (O1e) is built:** "See an example check" on Welcome and "See an example first" on Consent open a real card scored by the engine (the same 7.5 as Welcome's mini card), with Why. No photo is sent, nothing is saved.

---

## 1. Best practices this follows (sources in DECISIONS-LOG #289)

| Practice | What it means here |
|---|---|
| **Value before the ask** | The score is the "aha". Nothing that isn't needed for it comes before it: no account, no paywall, no notification prompt. |
| **Ask for an account when there's something to lose** | The save offer appears after his first scored fit, worded around what he'd keep ("your fit and the 4 pieces in your closet"). |
| **Sign-in is optional (Apple 5.1.1(v))** | Every sign-in place has a same-size way out, and the whole app works signed out. |
| **Offer Apple when you offer Google (Apple 4.8)** | Apple first, Google second, email third, all the same size. |
| **Account deletion in the app (5.1.1(v))** | Once accounts exist: Privacy → "Delete account and all data". |
| **Few questions, each one used** | Looks (changes the advice), basics (fit advice), birth year (the 18+ gate). Height, build and fit stay optional. |
| **Progress you can see** | A bar on every question step that fills on the last one; Back on every step keeps the answers. |
| **Resume where he left off** | Closing the app mid-setup reopens on the step he reached, with his answers. |
| **Permission priming** | The camera prompt comes right after "Agree & check my fit", when it's obviously needed. The notification ask waits until after the first check (S15, P6). |
| **No dead ends** | A link whose page doesn't exist yet (privacy policy, terms) is hidden, not broken. |

---

## 2. The flow

```
O1 Welcome ──Get started──▶ O2 Looks ──▶ O3 Basics ──▶ O5 Consent ──Agree──▶ S2 Camera ──▶ first score
   │                                        │               │
   ├─See an example check──▶ O1e ──Get started──▶ O2        ├─Not now──▶ Stylist (S26 "Turn on fit checks")
   │                                        │               └─See an example first──▶ O1e ──Check my own fit──▶ back to O5
   └─I already have an account──▶ A1 sign-in
          ├─ account with his data ──▶ A4 "Bringing back your fits" ──▶ Stylist (setup skipped; age gate kept)
          └─ new or empty account ──▶ "No fits saved to that account yet. Let's set you up." ──▶ O2 (signed in)
                                            └─ under 18 (O3) ──▶ O4 Age stop (terminal)

After the first score (once he's seen it, §3):
   S6 card ─▶ [next visit, or his first re-check scored] ─▶ A3 "Keep your fits" card ─▶ A1 ─▶ signed in
   Later (when built): ruling 23's 3 moves (S14) ─▶ paywall (P1) ─▶ notification ask (S15)
```

**Why this order (revises ruling 8 and 08 §8):** ruling 8 cut accounts because nothing synced. Firebase changes that (#268), and the founder now wants sign-in designed in. 08 said "never in onboarding"; the compromise keeps the first score account-free (the thing 08 protected) and puts the first offer right after it, when there's something to lose. 08's "after his 3rd check" becomes the *second* offer.

**The tap count to the camera** (shortest path, no optional answers): Get started · one look · Continue · Birth year · a year · Done · Looks right · Agree = **8 taps, 4 screens**. The account adds none.

---

## 3. The save offer (A3), exactly when

It's an inline stylist card in the thread (`cardType: 'account'`), posted once when **all** of these hold:
- accounts are on (`ACCOUNTS_BUILT`, or a demo screen) and he isn't signed in;
- he has a scored fit check (not a failed, held or unreadable one);
- **either** his first re-check has been scored, **or** this is a later visit than the one that scored his first check (a new launch, or back to the app after 30+ minutes);
- nothing is reading or waiting for a tap right now (never inside a progress moment);
- it's been offered fewer than 2 times; the second offer needs 3 more scored checks after the first "Not now".

**The card:** tagline `Your account` / `Optional`; title `Keep your fits`; body `Sign in to back up your closet, Lookbook and chats, and get them back on a new phone. Kitted works the same without it.`; PrimaryButton `Save my fits` (opens A1) · SecondaryButton `Not now`. With pieces in Closet the body leads with them: `Your first fit and the 4 pieces in your closet live only on this iPhone. Sign in to back them up …`. After "Not now" the card shrinks to one line: `No problem. It's in You → Settings whenever you want it.` After signing in: `Signed in with Apple. Your fits are backed up.` (mock: `Signed in with Apple.`, see §5).

---

## 4. The account screens

### 4.1 A1 · Sign-in sheet (`/sheets/sign-in?from=welcome|offer|settings`)
Medium-to-large sheet, grabber, X. Content, top to bottom:
- Title (`.title2.bold()`): welcome `Welcome back` · offer `Keep your fits` · settings `Back up your fits`.
- Body (`.body`, `ink2`): welcome `Sign in to bring back your closet, Lookbook and chats.` · offer/settings `Back up your closet, Lookbook and chats, and get them back on a new phone.`
- Three buttons, 50 pt, capsule, full width, gap 10, **in this order**:
  1. **`Continue with Apple`**: Apple logo (SF Symbol `apple.logo`) + label, black fill / white text in light mode, white fill / black text in dark (HIG).
  2. **`Continue with Google`**: the standard four-color "G" (drawn exactly, never recolored) + label, white fill with a 1 pt `#747775` border in light, `#131314` fill with `#8E918F` border in dark (Google's branding guidelines).
  3. **`Continue with email`**: `envelope` + label, the app's secondary button (`surface2` fill, `ink` text).
- Fine print (`.footnote`, `ink3`): `Optional. Kitted works the same without an account.` When `TERMS_URL` and `PRIVACY_URL` exist: `By continuing, you agree to the Terms and Privacy Policy.` with both as links; hidden until then.
- **From Welcome only**, under the buttons: TextLink `I'm new here` (closes the sheet).

**States:**
| State | What shows |
|---|---|
| Signing in | The tapped button shows a spinner in place of its icon and says `Signing in…`; all three are disabled; X still closes (it cancels). |
| He cancels the Apple or Google sheet | Nothing: back to the three buttons. |
| Failed | One line above the buttons: `Couldn't sign in with Apple. Try again, or use another way.` (Google / email the same). |
| Offline | `Signing in needs a connection. Your fits are safe on this iPhone.` The buttons stay enabled to retry. |
| Account already holds fits and this phone does too | A5 (below). |
| Done | The sheet closes; toast `Signed in with Apple.` (provider name); the A3 card updates in place. |

### 4.2 A2 · Email (`/sheets/sign-in/email`, a push inside the sheet)
- **Step 1, the address:** title `Continue with email`; field `Email` (keyboard `email-address`, `textContentType="emailAddress"`, `autoComplete="email"`, no autocorrect or capitals, return key `Continue`); PrimaryButton `Send code`, disabled until the address looks right (trimmed; `x@y.z`); under the field, `I'll email you a 6-digit code. No password.`
- **Step 2, the code:** title `Check your email`; body `I sent a 6-digit code to {email}.`; one code field (`textContentType="oneTimeCode"` so iOS offers the code from Mail, `number-pad`, 6 digits, auto-submits on the 6th); `Resend code` (disabled with a countdown `Resend in 0:30` for 30 s); TextLink `Use a different email`; wrong code: `That code didn't match. Check the newest email, or resend.` (the field clears for the next try); expired: `That code expired. I sent a new one.` after a resend.
- `Other ways to sign in` (under the button) returns to the three buttons; `Use a different email` returns to step 1 keeping the address.

### 4.3 Why a code by email, not a password or a magic link (founder's call later; this is the default)
- **No password:** this audience reuses passwords and forgets them; a code means no reset flow and nothing to leak.
- **A code over a magic link:** a link opens wherever he reads mail (often a laptop), and on iOS needs a universal link on a domain we don't have yet. A code typed on the phone always works, and iOS fills it from Mail with one tap.
- **The cost:** Firebase Auth has no built-in email code. The Worker sends the code (Resend or Cloudflare Email, a few cents per thousand) and, once checked, mints a Firebase custom token (`signInWithCustomToken`). About 0.5 day more than Firebase's email link (A1 in 08 §6). If that's not worth it, the same screen works with Firebase's email link instead (step 2 becomes `Check your email. Tap the link on this iPhone.` with `Open Mail`).

### 4.4 A4 · Bringing back your fits (from Welcome, an account with data)
**Birth year first, on every new phone.** The birth year never syncs (data minimization, `11-firestore-schema.md`, #288), so after signing in from Welcome to an account with fits, Basics opens with only the birth year (`Welcome back. Your birth year first, then I'll bring back your fits.`, no progress bar; height, build and fit come back with the synced profile). Under 18 there → the age stop as usual. Then A4: full screen, no Back, the wordmark, `Bringing back your fits…`, the counts as they arrive (`214 fits · 38 pieces · 61 chats`), `Your fits are back.`, then Stylist. The camera still asks for the agreement once on this phone (consent is per phone, #252). On the stand-in the counts come from the mock account and no rows arrive.

### 4.5 A5 · Which fits to keep (an account with fits, on a phone that has fits too)
Alert-style sheet: title `This account already has fits`; body `Your Apple account has 214 fits saved. This iPhone has 3 that aren't in it.`; buttons `Keep both` (default, merges) · `Use the account's` (this iPhone's 3 are deleted after a second confirm) · `Cancel` (stays signed out). Nothing is deleted without the second confirm.

### 4.6 In You
- **Settings → Account** (a new first section). Signed out: row `Back up and sync` with detail `Off · on this iPhone only` → A1. Signed in: row `Signed in with Apple` with the email (`Hidden email` for an Apple relay address), row `Sign out`.
- **Sign out:** confirm `Sign out? Your fits stay on this iPhone, but stop backing up.` · `Sign out` · `Cancel`.
- **Privacy & data**, signed in: `Delete account and all data` (red) replaces `Delete all my data`, with confirm `Delete your account? This deletes your account and every fit, photo and chat in it, on this iPhone and in your backup. It can't be undone.` After it: the account is gone (Apple: the token is revoked, 08 A5), the phone is wiped like today, and the age block stays.

---

## 5. What's real and what's mocked (until Firebase)

- **Real now:** the flow, every screen and state, the trigger rules, the draft and resume logic, the example check, the copy, the tests.
- **Mocked:** the sign-in itself (`MockAuth`: instant success with a made-up user, or a scripted cancel / failure / offline / existing-account result on demo screens), the restore (A4 counts are fixed), the email code (the mock accepts `123456`), and "backed up" (nothing leaves the phone).
- **Off in real builds:** `ACCOUNTS_BUILT = false` in `config/features.ts` hides "I already have an account", the A3 card and the Account section, so his phone never shows a sign-in that does nothing. Demo screens turn it on.
- **To make it real (08 §6, A0–A1):** the founder's Firebase project (Sign in with Apple needs the $99 program), then `@react-native-firebase/app` + `auth`, `expo-apple-authentication`, `@react-native-google-signin/google-signin` (new dependencies, his OK), a `FirebaseAuth` that implements the same `AuthService`, and the Worker's email-code route. The screens don't change.

---

## 6. The pass/fail checks (written before building, Oct 15)

Each is tested by a unit test (`onboardingAccount.test.ts`, `onboardingFlow.test.ts`) or by looking at the screen (web preview and Simulator, light and dark, largest text). Results are in §8.

**Flow**
- **F1** · The shortest path from Welcome to the camera is ≤ 4 screens and ≤ 8 taps, and has no account step.
- **F2** · The whole flow completes signed out; every sign-in place has a same-size way out (5.1.1(v)).
- **F3** · Every step after Welcome has Back; Back keeps the looks, the words and the basics.
- **F4** · Closing the app mid-setup reopens on the step he reached, with his answers.
- **F5** · The progress bar has a segment per step (Welcome, Looks, Basics, Consent), fills on Consent, and VoiceOver reads `Step n of N`.
- **F6** · Under 18: one confirm, then the age stop, terminal (no Back, no sign-in, no example). A returning account is asked its birth year on this phone too, so the same gate applies.
- **F7** · The example check works with no consent and no network, shows the engine's score for the photo (equal to Welcome's mini card), opens Why, and adds nothing to Closet, Lookbook, the thread or the daily count.
- **F8** · No dead controls: every visible button or link does something; links to pages that don't exist are hidden.
- **F9** · Consent's own fixes from the UI review: the camera and sheet versions don't say "Last thing before your first check"; the footer names the real place (You → Settings → Privacy & data).

**Accounts**
- **A1** · The sign-in sheet shows Apple, Google, email in that order, all the same size; Apple's button is black in light mode and white in dark with the Apple logo; Google's has the four-color G.
- **A2** · While signing in, only the tapped button shows progress, nothing can be tapped twice, and a cancel is silent; a failure and offline each show one plain line and allow a retry.
- **A3** · Email: `Send code` is off until the address is valid (spaces trimmed, case kept for display, compared lower-case); the code step names the address, auto-submits at 6 digits, has a 30 s resend countdown and a way back; a wrong code says so and clears the field for the next try.
- **A4** · From Welcome: an account with data asks only the birth year (the age gate), then restores and skips the rest of setup; an empty account continues setup signed in.
- **A5** · An account with fits on a phone with fits asks Keep both / Use the account's / Cancel, and nothing is deleted without a second confirm.
- **A6** · The save offer follows §3 exactly: never before a scored fit, never while reading or asking, never when signed in, at most twice, the second only after 3 more scored checks; it's inline, not a pop-up.
- **A7** · Signed in, Settings shows the provider and the email (`Hidden email` for an Apple relay address) and Sign out (data stays); Privacy offers `Delete account and all data`, which signs out, wipes the phone and keeps the age block.
- **A8** · The account's email and name never reach the stylist's context pack or a scoring call (the privacy test covers it).
- **A9** · With `ACCOUNTS_BUILT` off, no account entry point renders outside demo screens.

**Quality**
- **Q1** · `npm run check` is green: typecheck, lint, core and app tests.
- **Q2** · Every new screen fits at 402 pt wide in light and dark, and at the largest accessibility text size nothing is clipped (buttons may wrap).
- **Q3** · Every new control has a VoiceOver label; titles are headers.
- **Q4** · Copy rules: no "AI stylist", no "unlimited", no emoji, sentence case; new outward copy is listed for the founder's skim.

---

## 7. Decisions

**Settled by Claude (logged #289):** the flow in §2; the offer's timing and cap (§3); Apple → Google → email order; one sign-in sheet for every entry point; accounts hidden in real builds until Firebase; the example check's photo (s14, the Welcome photo) and that it reuses the engine.

**For the founder (to-do list, P2), each with a default:**
- **AC1 · Email by code or by link** (§4.3). Default: a 6-digit code (needs the Worker to send mail, ~0.5 day more).
- **AC2 · The first save offer after the first fit** (revises 08's "after the 3rd check"). Default: yes, with the 3rd check as the second and last offer.
- **AC3 · The new copy** in §3–§4 (outward-facing). Default: as written.
- **AC4 · Sign out keeps his fits on the phone.** Default: yes (the other choice wipes the phone, safer on a shared phone but surprising).

---

## 8. Results (Oct 15, tested against §6)

Unit tests: `app/src/__tests__/onboardingAccount.test.ts` (25 tests) plus the updated `onboardingFlow` and `scenarios` tests; the whole app suite passes (763 tests). Screens: the web preview (light and dark) for every demo screen 130–143, and the iOS Simulator for the sign-in sheet and A5 (the Simulator was then taken by another session). Screenshots: `screenshots/onboarding-oct15/` (git-ignored).

| Check | Result | How |
|---|---|---|
| F1 · ≤ 4 screens, ≤ 8 taps, no account step | Pass | Flow unchanged before the camera; nothing added before the first score |
| F2 · works signed out, a way out everywhere | Pass | X and `I'm new here` on A1; `Not now` on A3; accounts off by default |
| F3 · Back keeps answers | Pass | Existing drafts; restore mode's Back goes to Welcome |
| F4 · resume on the step reached | Pass (logic) | Test; not yet tried by closing the app on a phone |
| F5 · progress bar | Pass | Test (4 of 4 on Consent) |
| F6 · under 18 | Pass (unchanged) | The returning path goes through the same Basics gate |
| F7 · example check | Pass | Test: same 7.5 as Welcome, touches no store; preview: card, fix, inline math |
| F8 · no dead controls | Pass | Policy/terms links hidden until the URLs exist; the signed-in row is a value row, not a button |
| F9 · consent outside onboarding | Pass | `Before I score a photo…` / `Agree`; footer names You → Settings → Privacy & data |
| A1 · button order and look | Pass | Simulator: black Apple button with the logo, four-color G, all 50 pt |
| A2 · states | Pass | Preview: spinner on the tapped button only, others off; failure line; offline and cancel by test |
| A3 · email | Pass | Preview: Send code off until valid; code auto-submits; wrong code clears; 30 s countdown |
| A4 · Welcome → restore / set up | Pass | Preview end to end (both paths); tests |
| A5 · fits on both sides | Pass | Simulator: the question; test: nothing saved or deleted before a choice |
| A6 · offer timing | Pass | Tests for every rule; preview: inline card → Apple → "Signed in with Apple." |
| A7 · Settings and delete | Pass (screens) | Preview: Account section, Hidden email, Delete account row; the confirm alerts are native (not seen on web) |
| A8 · nothing reaches the stylist | Pass | Test on the real context pack |
| A9 · off in real builds | Pass | Test; `ACCOUNTS_BUILT = false` |
| Q1 · checks green | Pass | `npm run check`: typecheck, lint, core and app tests (763) all green |
| Q2 · fits at 402 pt, light and dark | Pass | Preview and Simulator. **Not checked at the largest text size** |
| Q3 · VoiceOver labels | Pass (by code) | Labels, hints, headers and an alert role on the error line; not walked with VoiceOver |
| Q4 · copy rules | Pass | Test |

**Found and fixed while testing:** the example card's math clipped its amounts inside the card (moved under it); its photo caption truncated; a wrong email code had to be deleted digit by digit (now clears); "Back" above the email field read oddly (now `Other ways to sign in` under the button); restore re-asked height, build and fit (now only the birth year); the Google logo warned on web (wrapped, per the SVG lesson); the restore screen's wordmark sat left.

**Not done here (needs the founder or later work):** real Firebase sign-in (the founder's Firebase project and the $99 program, then new packages); the system Apple button (`expo-apple-authentication`); the email-code route on the Worker; the paywall (P6) and the notification ask (S15) that ruling 23 puts after the first check; trying all of it on his phone.

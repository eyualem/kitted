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
   S6 card ─▶ [Later, re-check scored, nothing to re-check, or a later visit] ─▶ S14 "Your first 3 moves" ─▶ P1/P1b paywall ─▶ S15 ask (§9, #291)
   (the save offer waits for that sequence: §9.1)
```

**Why this order (revises ruling 8 and 08 §8):** ruling 8 cut accounts because nothing synced. Firebase changes that (#268), and the founder now wants sign-in designed in. 08 said "never in onboarding"; the compromise keeps the first score account-free (the thing 08 protected) and puts the first offer right after it, when there's something to lose. 08's "after his 3rd check" becomes the *second* offer.

**The tap count to the camera** (shortest path, no optional answers): Get started · one look · Continue · Birth year · a year · Done · Looks right · Agree = **8 taps, 4 screens**. The account adds none.

---

## 3. The save offer (A3), exactly when

It's an inline stylist card in the thread (`cardType: 'account'`), never a modal or sheet (founder, Oct 16, #300), posted once when **all** of these hold:
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

**Not done here (needs the founder or later work):** real Firebase sign-in (the founder's Firebase project and the $99 program, then new packages); the system Apple button (`expo-apple-authentication`); the email-code route on the Worker; trying all of it on his phone. (The paywall and the notification ask that ruling 23 puts after the first check were built next, §9.)

---

## 9. The end of onboarding: Later, the first 3 moves, the paywall, the notification ask (Oct 15, #291)

*Ruling 23: **Result → Re-check or Later → "Your first 3 moves" → the 2-page paywall → the notification ask.** §2 listed it as "Later"; this section builds it. 02 S14, D18, P1b, P1s and S15 own each screen's layout; this section owns the order, the triggers, what's real, and the checks (written before the code, like §6).*

### 9.1 The sequence, exactly when

One sequence per phone, for his **first** fit only, stored in kv `onboard.finish`. Each step happens once; quitting mid-step counts as done (ruling 23: "quitting here counts as shown").

1. **The first 3 moves card (S14)** posts when **all** hold:
   - his first full check is scored (not failed, held, unreadable or partial-and-waiting), and it's still his **only** scored full check (someone who already has several fits, like the founder's phone, never gets the onboarding sequence: it's marked skipped);
   - **one** of: he tapped `Later` on it · its re-check was scored · it has no fix to re-check (dialed in or "No quick fixes") · its re-check window closed, or this is a later visit than the one that scored it;
   - nothing is reading or waiting for the one quick tap, and the card's score reveal has had time to finish (the same 4 s settle as the save offer).
   The stylist line `Here's where to start. Three moves, in order.` and the card post together.
2. **The paywall (P1)** is presented once, over Stylist, **2.5 s after the moves card lands** (so the card is seen first), only if: the paywall is on (`PAYWALL_BUILT`, or a demo screen), he isn't Pro, Stylist is the screen in front (no sheet, camera or other tab), and nothing is reading, asking or revealing. If any of these is false at that moment, it waits for the next time Stylist comes to the front, the same visit or a later one. Off or Pro: the step is skipped. Marked shown **before** it opens.
3. **The notification ask (S15)** posts right after the paywall closes (bought or not), or right after the moves card when the paywall step was skipped. Only if notifications are on (`NOTIFICATIONS_BUILT`, or a demo screen) and the system permission was never asked; otherwise skipped. Then the sequence is done.

**The save offer ("Keep your fits", §3) and this sequence never meet in one moment.** The sequence goes first: while it's due or under way, and for the rest of the visit in which it posted anything, the offer waits; it can come on his next visit. The paywall never opens while the sign-in sheet is up (Stylist isn't in front), and the offer card never posts while the paywall is up (same rule). *Why this order:* the moves and the paywall are ruling 23's onboarding and convert best right after the first score (RevenueCat: most trials start on install day, #289); the account offer is about not losing fits, which only matters from the next visit; two asks in one moment read as pressure (HIG: one request at a time).

### 9.2 Later and the moves card

- **`Later`** (TextLink, in the card's link row after `Not quite right?`) shows only on his first-ever full check, while the sequence hasn't started, before he re-checks it, not read-only. Tap: the sequence starts (the moves card follows at once, no settle wait). The Re-check button stays while its window is open; Later doesn't close it.
- **The card (S14):** tagline `Your plan` / `3 moves`; title `Your first 3 moves`; three numbered rows (FixRow shape, no gain on the right; a done row: the filled circle and grey title, no strikethrough, as on the card since #246 (14)):
  1. `Tap the basics you own` / `30 seconds · in Closet`. Done once he's marked one piece in Starter essentials.
  2. His first check's top fix, word for word, with its tag (`Tuck in your tee` / `Free`). Done if his re-check made it (the re-check's done fixes). No fix: the card's next-level line with `Free · next time you get dressed`. Neither: `Check tomorrow's fit` / `Free · 1 a day`.
  3. The Starter essential he's missing that adds the most outfits to his closet: `Add a grey quarter-zip` / `$40–50 · +3 fits` (budget price; no `+N` when it adds none). Done when Closet gets one.
  - **One button, for the first move not done:** `Start move 1` → the Closet tab, then Starter essentials. `Start move 2` → the camera (a check like any other). `Start move 3` → Starter essentials (C7, the next-buy sheet, isn't built; that's where he marks it once he has it). All done: no button, and the card's title reads `All 3 done. Nice work.`
- **Where it lives:** in today's chat, and read-only in Past chats. L3 (`Your moves`) and the pinned `Your moves · 1 of 3` rows in Lookbook and You keep the moves in view after that day: §9.9 (#292).

### 9.3 C5 · Starter essentials (move 1's destination, 02 C5)

Built to 02 C5 because move 1 has nowhere else to go: the header (`You probably own a few already. Tap the ones you have.` + `n of 12` + the 12-slot bar), the 12 rows with `Budget {a} · Mid {b}`, a toggle circle per row, `In your closet` (detected from his checks) or `Marked as owned`, the `Next step` footer card (`Unstructured navy blazer`). Tap to own: a not-photographed closet piece (source `added`, the row's `starterId`), toast `+{n} fits` (or `Marked as owned.` when it adds none); untap one he marked: removed, with Undo. A detected piece can't be untapped here (its own page removes it). The belt has no closet slot yet, so marking it is kept in kv only. The closet's `Starter essentials` row (C1) isn't added here.

### 9.4 The paywall (P1, P1b, P1s) on the mock store, monthly only

- **The store** is an interface (`services/store.ts`: products, purchase, restore, the trial eligibility), filled by a mock store until RevenueCat. One product, `kitted.pro.monthly`: **$9.99 a month with a 1-week free trial** (#285). The yearly plan, the cap and the founding offer are open, so nothing else is offered.
- **P1 (page 1):** X and `Restore` in the nav; `KITTED PRO`; headline `Up to {checks} checks a day.` / `Ask as you go.` (#233 item 4's default, never "unlimited"); the Today card (his first check: `Today: 6.5` / `Two free fixes to 8.0.`, after a re-check `Today: 6.5 → 7.5` / `One free fix. Nothing new to buy.`, dialed in `Dialed in on your first check.`; elsewhere his latest check, or no card); perks `Up to {checks} fit checks a day` · `Up to {questions} questions a day` (from the quota's real limits) and **no** "full next-buy list" perk (C7 isn't built, so it would promise a feature that doesn't exist); `See plans`; `Continue free`; `Terms` · `Privacy` when their URLs exist.
- **P1b (page 2):** Back and X; `KITTED PRO`; `Pick your plan`; `Up to {checks} fit checks and {questions} questions a day.`; one plan card, selected: `Monthly` / `1 week free` / **`$9.99`** `/mo` (the billed price is the biggest number, 3.1.2); fine print `Free for 1 week, then $9.99 a month. Renews every month until you cancel. Cancel anytime in Settings › Apple ID › Subscriptions, at least 24 hours before it renews.`; the button `Start 1-week free trial` (no trial left: `Subscribe for $9.99/month`, and the fine print starts `$9.99 a month.`); `Restore purchases`; `Continue free`; `Terms` · `Privacy`; on the mock store, `Demo: no real purchase`.
- **States (P1s):** loading (the plan card's skeleton, the button off), failed to load (`Plans didn't load.` + `Try again`), pending (`Waiting for approval.`), a cancel (nothing), a failure (one line: `That didn't go through. Nothing was charged.`), success (the paywall closes, toast `Pro is on.`, and a photo held under the Limit card is scored), already Pro (`You're Pro.` + the limits line + `Manage subscription`), offline (`Plans need a connection.` + `Continue free`).
- **Every entry point** (the onboarding step, the Limit card's `Try Pro · 1 week free`, the question limit's `Try Pro`, You's `Try Pro`) opens the same two pages. **`PAYWALL_BUILT` stays `false`**: until the Terms and Privacy URLs exist (App Review 3.1.2) and the real store is in, his phone shows no paywall and no `Try Pro`; demo screens turn it on.

### 9.5 The notification ask (S15)

- Stylist `Want a daily outfit idea at a time you choose?` + `Yes, pick a time` · `No thanks`.
- **Yes:** the card grows in place: `Daily idea at` + a time menu (the Settings list, 5:00–11:00 am in half hours, default 8:00 am or the time he already set) + `Set 8:00 am`. Set → the permission call (the system prompt, the only place it's asked). Allowed: the time and the daily-idea switch are saved, `Done. Your first idea lands tomorrow at 8:00 am.` Denied: `No problem. You can turn it on later in You → Settings → Notifications.`
- **No thanks:** the same line; the system prompt is never shown, and the daily-idea switch is saved off.
- **No new package yet:** the permission call sits behind an interface (`services/notifications.ts`: `permission()`, `request()`). `expo-notifications` is a new dependency, so it waits for the founder's OK; until then `NOTIFICATIONS_BUILT = false` and his phone gets no ask (an ask that can't ask would lie), and nothing is scheduled. Demo screens run a scripted permission (allow or deny). The time menu reuses Settings' own list, so **no date-time picker package** is needed.

### 9.6 The pass/fail checks (written before building, Oct 15)

Tested by unit tests (`onboardingFinish.test.ts`) or by looking (web preview, light and dark; the Simulator if memory allows, rule 9). Results in §9.8.

**Sequence**
- **E1** · The moves card never posts before his first full check is scored, never while reading or asking, and never twice.
- **E2** · It posts after each trigger: Later (at once), the first re-check scored, no fix to re-check, the re-check window closed or a later visit; it waits the settle time after a scored check (the reveal), but not after Later.
- **E3** · A phone with 2+ scored full checks and no sequence yet is marked skipped: no Later, no moves card, no onboarding paywall, no ask.
- **E4** · The paywall step opens only with the paywall on, not Pro, Stylist in front and nothing reading or revealing, ≥ 2.5 s after the moves card; it's marked shown before it opens, opens at most once, and is skipped when off or Pro.
- **E5** · The notification ask posts once, after the paywall closes, or after the moves card when the paywall step was skipped; skipped when notifications are off or the permission was already asked.
- **E6** · Quitting at any step resumes at the next one (the paywall counts as shown).
- **E7** · The save offer waits while the sequence is due or under way, and for the rest of the visit it posted in; on the next visit it can post. The paywall never opens with a sheet up, and the offer never posts while the paywall is up.

**Later and the moves card**
- **L1** · `Later` shows only on the first-ever full check, scored, not read-only, before the sequence starts; tapping it posts the moves card and leaves the Re-check button as it was.
- **M1** · The card has 3 numbered moves in this order: the basics, the first check's top fix (word for word, with its tag), the missing Starter piece that adds the most outfits (with its budget price and `+N fits` when N > 0).
- **M2** · Fallbacks: no fix → the next-level line; neither → `Check tomorrow's fit`; a piece that adds no outfits → no `+N`; a full Starter list → the Next step (the navy blazer).
- **M3** · Done states: move 1 after a Starter piece is marked, move 2 when the re-check made that fix, move 3 when Closet gets that piece; only the first not-done move has a Start button; all done → `All 3 done. Nice work.` and no button.
- **M4** · Start move 1 opens Closet then Starter essentials; move 2 the camera; move 3 Starter essentials. No Start points at a placeholder.

**Starter essentials (C5)**
- **B1** · 12 rows in 02's order with `Budget {a} · Mid {b}`; pieces already in his closet show as owned with `In your closet`, and the count and bar match.
- **B2** · Tapping a row he doesn't own adds a not-photographed piece and toasts `+{n} fits` (or `Marked as owned.`); untapping a marked one removes it with Undo; a detected one can't be untapped here.

**Paywall**
- **P1** · X and `Continue free` are on screen from the first frame of both pages and close the paywall; Back returns to page 1.
- **P2** · No "unlimited" anywhere; the limits in the copy are the quota's real limits.
- **P3** · Page 2 carries Apple 3.1.2's list: the plan's name and length, the price per period as the biggest price, the trial length and the price after it, that it renews automatically and how to cancel, Restore, and Terms and Privacy (hidden only while their URLs are null, and `PAYWALL_BUILT` can't be on while they're null).
- **P4** · Only the monthly plan at $9.99 with a 1-week trial is offered; no trial left → `Subscribe for $9.99/month`.
- **P5** · States: loading, failed to load with Try again, pending, a silent cancel, a failure line, offline, already Pro; success closes, toasts `Pro is on.`, makes him Pro, and scores a held photo.
- **P6** · Restore: Pro → `Pro is on.`-style restored toast and close; nothing to restore → the existing `nothing to restore` toast.
- **P7** · With `PAYWALL_BUILT` off, no paywall entry point renders outside demo screens (the sequence's step too).
- **P8** · The Today card follows D18's variants (re-check, fixes to a target, dialed in, none).

**Notification ask**
- **N1** · `Yes, pick a time` grows the card in place with the time menu (default 8:00 am, or his saved time) and `Set {time}`; the permission is asked only on Set.
- **N2** · Allowed → the time and the daily-idea switch saved, `Done. Your first idea lands tomorrow at {time}.`; denied → the Settings line; `No thanks` → the same line, the switch off, the permission never asked.
- **N3** · Answered, the card stays answered after a relaunch and in Past chats (read-only), and the ask never posts again.

**Quality** (as §6)
- **Q5** · `npm run check` green. **Q6** · Every new screen and card fits at 402 pt in light and dark. **Q7** · VoiceOver labels on every new control; titles are headers. **Q8** · Copy rules: no "AI stylist", no "unlimited", no emoji; the new outward copy listed for the founder (§9.7).

### 9.7 For the founder (to-do list)
- **PW1 · The paywall's words and the monthly-only plan** (outward-facing): the headline `Up to 10 checks a day. / Ask as you go.`, the perks, `1 week free`, the fine print, `Start 1-week free trial`. Default: as written.
- **PW2 · The "full next-buy list" perk is left out** until C7 exists. Default: yes.
- **PW3 · The Terms link:** Apple's standard EULA (apple.com/legal/internet-services/itunes/dev/stdeula) is enough for 3.1.2 if we don't write our own. Default: your own page on trykitted.com, with Apple's EULA as the fallback.
- **NT1 · OK `expo-notifications`** (Expo's own package; a reinstall on the phone) to make the ask real and send the daily idea. Default: yes, with the TestFlight build.

### 9.8 Results (Oct 15, tested against §9.6)

Unit tests: `app/src/__tests__/onboardingFinish.test.ts` (32 tests, every check below that logic can prove) plus the updated `limitCard` (1 week) and `syncSchema` (the two new kv keys classified) tests; `npm run check` is green (app and core typecheck, lint, core 755 tests, app 809). Screens: the web preview, demo screens **150–162**, light and dark; screenshots `screenshots/finish-oct15/` (git-ignored). **Not on the Simulator that day:** the Mac had under 300 MB free the whole session (rule 9). The iOS pass was done Oct 16 (§9.10): every screen in both themes and at the largest text size. SF Symbols (the X, the check marks) don't draw on web; they do on iOS.

| Check | Result | How |
|---|---|---|
| E1 · never early, never while busy, never twice | Pass | Tests (incl. two runs at once) |
| E2 · each trigger; the settle after a score, none after Later | Pass | Tests; preview: Later → the card at once (150) |
| E3 · 2+ fits: skipped, no Later | Pass | Tests (the founder's phone case) |
| E4 · paywall: on, not Pro, Stylist in front, idle, 2.5 s, once | Pass | Tests (a sheet up, a check reading, then it opens) |
| E5 · the ask after the paywall closes, or after the card | Pass | Tests; preview 158 |
| E6 · quitting resumes at the next step | Pass | Tests (quit on the paywall → the ask; quit after the card → the paywall) |
| E7 · the save offer and the sequence never meet | Pass | Test with both services (moves first, offer the next visit); demo 138's offer unchanged |
| L1 · Later only on the first check, before a re-check | Pass | Tests; preview 150 (shown), 10 (not shown) |
| M1 · the 3 moves in order | Pass | Tests; preview 151: tap the basics · the card's fix word for word · "Add a white heavyweight tee · $15–20 · +1 fit" |
| M2 · fallbacks | Pass | Tests (next-level line, Check tomorrow's fit, no "+0", the blazer) |
| M3 · done states, one Start | Pass | Tests; preview 162: move 1 done, "Start move 2" |
| M4 · Start goes somewhere real | Pass | Preview: Start move 1 → Closet → Starter essentials, Back to Closet |
| B1 · 12 rows, prices, detected pieces | Pass | Tests; preview 161: "2 of 12", the knit and the jacket "In your closet" |
| B2 · tap to own, +N, Undo | Pass | Tests; preview: tap → "3 of 12", "Marked as owned", toast "+1 fit" |
| P1 · X and Continue free from the first frame | Pass | Preview 152–157; X from page 2 closes the whole cover |
| P2 · never "unlimited", the quota's limits | Pass | Tests; copy check |
| P3 · Apple 3.1.2's list on page 2 | Pass | Preview 153; Terms and Privacy hidden while their URLs are null, and a test keeps `PAYWALL_BUILT` off until they exist |
| P4 · monthly $9.99, 1 week | Pass | Tests; preview 153, 154 (trial used: "Subscribe for $9.99/month") |
| P5 · states | Pass | Tests (mock store); preview 155 (didn't load), 156 (offline), 157 (already Pro), 153 → buy → "Pro is on." and the header's line follows (fixed: it didn't re-read the plan) |
| P6 · Restore | Pass | Tests (restored / nothing to restore) |
| P7 · off on his phone | Pass | `PAYWALL_BUILT = false`; every "Try Pro" reads the same switch |
| P8 · the Today card | Pass | Tests; preview 152: "Today: 7.5 · One free fix to 8.0." |
| N1 · Yes grows the card, asks only on Set | Pass | Tests; preview 159 |
| N2 · allowed / denied / No thanks | Pass | Tests; preview 160 "Done. Your first idea lands tomorrow at 8:00 am." |
| N3 · answered stays answered, never again | Pass | Tests |
| Q5 · `npm run check` | Pass | Green |
| Q6 · 402 pt, light and dark | Pass | Preview; **iOS and the largest text size Oct 16 (§9.10): 3 fixes** |
| Q7 · VoiceOver | Pass (by code) | Labels, headers, a checkbox role per Starter row, a radio role on the plan, `Later` as a card action; not walked with VoiceOver |
| Q8 · copy rules | Pass | Tests; the new words are listed in §9.7 and DECISIONS-LOG #291 |

**Found and fixed while testing:** demo set-ups could run twice at once and wipe each other's later steps (now one at a time); move 1 stayed undone when the piece he marked was also seen in his photo; `ensure()` returned before a run in flight finished (a tap right after could miss the card); the plans page set state inside an effect (lint); `Later` showed on demo screens without the sequence and after a re-check; Stylist's header didn't follow a purchase.

**Not done (needs the founder or later work):** `expo-notifications` (his OK) to make the ask real and send the daily idea; the real store (RevenueCat) and the Terms and Privacy pages before `PAYWALL_BUILT` can go on; ~~L3 `Your moves` and the pinned rows~~ (built, §9.9); C7 (the next-buy sheet) for move 3; ~~the iOS Simulator pass and the largest text size~~ (done Oct 16, §9.10).

### 9.9 L3 `Your moves` and the pinned rows (Oct 15, #292)

*02 S14 "Persistence": the moves live in L3 and are pinned atop Lookbook and You as `Your moves · 1 of 3`. Until now the card lived only in that day's chat, so the moves dropped out of sight the next morning. This section closes that gap; 02 L3, D16 and D17 own the layout.*

- **When the rows exist:** only once the sequence has posted its moves card: `onboard.finish` at step `moves`, `paywall` or `done`, with its `checkId` and `movesMsgId`, and that first check still stored. Never at `waiting` or `skipped` (the founder's phone, which already had many fits), never with no state.
- **The same 3 moves as the card:** L3 and the rows read the card's own plan (`buildMoves`, with the `buyId` kept in the card's chat payload), so move 3 never changes under him and a move turns done in every place at once.
- **The pinned row** (`KCard`, 52 pt): `checklist` + `Your moves` + trailing `{n} of 3` (n = moves done) + chevron → L3. **The first row** of Lookbook (above the looks) and of You (above the style card): S14 says "pinned atop"; D17's older list put it under the plan card, which the #246 You layout no longer has. From You it pushes L3 inside the You tab (its own route), so Back returns to You.
- **L3:** inline title `Your moves`; header `{n} of 3 done` (`.headline`) + a 3-slot bar; the 3 moves in the FixRow shape inside one card. **Each move not done has its own trailing `Start`** (secondary, regular): L3 is the list he comes back to, not the chat card, so he can take them in any order (the card keeps its one button for the first move not done). Start goes where the card's does: moves 1 and 3 → the Closet tab, then Starter essentials; move 2 → the camera. A done move shows the card's filled check badge and grey title, with no button (the badge is the Done check; a second check on the right would repeat it).
- **All 3 done:** L3's header reads `All 3 done. Nice work.` with the bar full and no buttons, and the pinned rows disappear from Lookbook and You. It's read live: if a move turns undone again (he removes the Starter piece he marked), the row comes back, because the row only ever says what's true.
- **Copy:** only existing deck keys (`lookbook.moves`, `lookbook.movesCount`, `moves.title`, `moves.done`, `moves.allDone`, `plan.start`, `plan.startN`), plus VoiceOver lines (`moves.a11y.*`, `addedInBuild`).

**The pass/fail checks (written before building, Oct 15)**
- **Y1** · No rows and an empty L3 unless the sequence's step is `moves`, `paywall` or `done` with its moves card and first check; none at `waiting`, `skipped` or with no state.
- **Y2** · L3 and the rows show the card's own 3 moves (the same titles, details and done states, the same `buyId`), and follow a change at once (a Starter piece marked turns move 1 done everywhere).
- **Y3** · L3's header is `{n} of 3 done` with n of 3 slots filled; the pinned row's trailing text is `{n} of 3` with the same n.
- **Y4** · Every move not done has a trailing `Start`; a done one has none. Start: moves 1 and 3 → Closet then Starter essentials; move 2 → the camera. No Start points at a placeholder.
- **Y5** · All done: `All 3 done. Nice work.`, the bar full, no Start, and no pinned row in Lookbook or You.
- **Y6** · The row is the first thing in Lookbook and in You; it opens L3; from You, Back returns to You.
- **Y7** · VoiceOver: the row is one button ("Your moves, 1 of 3 done"); L3's header is a header; each move reads "Move 2: Tuck in your tee. Free." or "Move 1, done: Tap the basics you own."; Start reads "Start move 2".
- **Y8** · The chat card is unchanged (one Start, for the first move not done; read-only in Past chats), and §9.6's checks still pass.
- **Q5–Q8** as §9.6: `npm run check` green; 402 pt in light and dark; VoiceOver labels on every new control; no new outward copy.

**Results (Oct 15, tested against the checks above).** Unit tests: `app/src/__tests__/yourMoves.test.ts` (6 tests). Screens: the web preview, demo screens **163** (Lookbook row), **164** (L3 from Lookbook), **165** (You row, move 1 done), **166** (L3 from You), light and dark; screenshots `screenshots/moves-oct15/` (git-ignored). Not on the Simulator (the Mac had under 250 MB free, rule 9). SF Symbols (the checklist, the chevron, the done check) don't draw on web.

| Check | Result | How |
|---|---|---|
| Y1 · rows only once the card is posted | Pass | Tests (waiting, skipped, no state, a first check that's gone, after Later) |
| Y2 · the card's own 3 moves, live | Pass | Tests (equal to the card's plan, the card's `buyId` wins, a Starter mark turns move 1 done); preview 151 and 164 show the same three lines |
| Y3 · `{n} of 3 done`, the bar, `{n} of 3` | Pass | Tests; preview 163 "0 of 3", 165/166 "1 of 3" with one slot filled |
| Y4 · a Start on every move left, where the card's goes | Pass | Tests; preview: L3 Start on move 1 → Closet → Starter essentials |
| Y5 · all done: the line, no Start, no row | Pass | Tests; **seen on iOS Oct 16**: demo 180 (L3, light and dark) and 181 (no row in Lookbook) |
| Y6 · first row in Lookbook and You; Back returns | Pass | Preview: Lookbook → L3 (`/lookbook/moves`), You → L3 (`/you/moves`) → Back to You |
| Y7 · VoiceOver | Pass (by code) | Labels tested; not walked with VoiceOver |
| Y8 · the chat card unchanged | Pass | §9.6's tests pass; preview 151 unchanged |
| Q5–Q8 | Pass | `npm run check` green; 402 pt light and dark; no new outward copy |

### 9.10 The iOS Simulator pass (Oct 16, #299)

*The pass #291 and #292 skipped for lack of memory (the Mac had ~5 GB reclaimable this time, `memory_pressure` 36% free; one thing at a time: Simulator first, `npm run check` after it was shut down). iPhone 17 Pro, iOS 26.5, the dev build through Metro, `-demoScreen <n>` in light and dark; screenshots `screenshots/sim-oct15c/` (git-ignored: `s<n>-<theme>.png`, `-ax` = the largest text size, Accessibility XXXL).*

| What | Result |
|---|---|
| Demo screens 150–166, light and dark (34 frames) | **Pass.** The SF Symbols all draw: the X, back chevron, perk checks and the checklist glyph on Your moves, the Starter toggle checks, the done badges, the row chevron. Layouts match §9.1–9.5 and §9.9. |
| M4 / Y4 · Start goes somewhere real | **Pass.** Start 1 (from L3 in Lookbook and in You) → the Closet tab, Starter essentials; Start 2 → the camera (the Simulator's stand-in photo); Start 3 → Starter essentials. |
| Y6 · Back | **Pass.** Starter essentials → Back → Closet; L3 → Back → Lookbook (from Lookbook) or You (from You); the row opens `/lookbook/moves` or `/you/moves`. |
| Y2 · live | **Pass.** The camera's 3-2-1 took a photo on its own: Lookbook gained a second look, and L3's move 3 turned done and "1 of 3" updated with no reload. Marking the white tee in Starter showed "Marked as owned" and the "+1 fit" toast, and the count went 3 → 4 of 12. |
| Y5 · All 3 done | **Pass.** New demo screens **180** (L3: "All 3 done. Nice work.", the bar full, 3 filled badges, no Start) and **181** (Lookbook with no Your moves row, the look "7.5 → 8.0 Sharp"). Story: the first check (s14, top fix "Swap the chunky sneakers for white leather sneakers"), a re-check photo `s14b` that wears them, the belt marked, the white tee marked. |
| Q6/Q7 · the largest text size (151, 153, 161, 163, 164, 165, then 152/153/161/163 again after the fixes) | **3 problems, fixed:** (1) the paywall's plan page: the pinned buttons filled the screen and covered the plan card, and the card squeezed "Monthly" to "Mo/nthl/y" → at AX sizes the buttons scroll with the page and the plan card stacks (page 1 too); (2) Starter essentials: titles broke mid-word ("heavyweigh/t tee") and the toggle was squeezed out → at AX sizes the picture and the toggle share a top line and the words get the full width; (3) the pinned row broke "Your moves" to "move/s" → at AX sizes the count goes under the title. Also at normal size: "Marked as owned" and "In your closet" now sit on their own line instead of wrapping an orphan word. 164 (L3) and 151 (the card) read well at AX with no change. |
| Seen, not fixed (not part of this build) | You's style chips: the numbered badge is clipped at AX sizes (`app/(tabs)/you/index.tsx`); the toast "+1 fit" sits over the row text (as every toast); "Done. Your first idea lands tomorrow at 8:00 / am." wraps "am." alone (the line is in `en.generated.ts`; a non-breaking space would fix it). |
| Not checked | VoiceOver on a device; the paywall at the largest size in dark; the notification ask at AX sizes (158–160 not re-shot at AX). |

Screens 180–181 use only existing copy. Sequence step 'later' after a scored re-check is harmless: the card posts either way.

### 9.11 One optional step instead of "Your first 3 moves" (Oct 18, #343)

*The founder, Oct 18: make it explicit that it's optional; move 2 ("your first check's top fix") made no sense to him; move 3 ("Add a white heavyweight tee") assumed what he doesn't own before the app had learned anything; "frustrating a user is not something we should do." This replaces §9.2's card, §9.3's shopping frame and §9.9's pinned rows. The sequence's order and triggers (§9.1) stay: the card posts when the moves card did, then the paywall and the notification ask as before.*

**What he'll see.**
- **In the chat after his first fit (same moment as before):** Kit says `Want outfit ideas from your own clothes? This part is optional.` and one card: tag `Optional` / `About 30 seconds`; title `Tap the clothes you already own`; body `I'll build outfit ideas from them. Skip it and I'll still learn your closet from your fit checks.`; a `Show me the list` button and a `Skip` link. Skip: the card keeps its title and says `Skipped. It's in Closet whenever you want it.`, no buttons. Once he has added one: `Added {n} to your closet.` with an `Add more` link. Past chats: read-only (no button, no link).
- **The list (was Starter essentials, now "What you already own"):** `Optional. Tap what you have and pick the color. Skip anything you're not sure about: your fit checks fill in the rest.` 12 plain rows (`Plain tee`, `Polo`, `Oxford shirt`, `Crewneck sweater`, `Jeans`, `Chinos`, `Overshirt`, `Casual jacket`, `Leather sneakers`, `Loafers or boots`, `Quarter-zip or hoodie`, `Belt`). No prices, no `n of 12` bar, no "Next step" buy card. A tap opens `Which one is yours?` with the realistic versions (`Black tee`, `White tee`, `Grey tee`…; `Dark jeans`, `Black jeans`…; `Brown loafers`, `Black boots`…) and Cancel; the pick becomes a closet piece in that color and kind, with a toast and Undo. Tapping one he added opens the same choices plus `Remove from closet`. A piece his fit checks found stays `In your closet` and can't be changed here (its own page can).
- **Gone:** move 2, move 3, the `Your moves · n of 3` rows atop Lookbook and You, the Your moves page. Buying ideas stay where the closet can back them: Closet → Outfits → Next best buy.

**Pass/fail checks (written before the code).**
- O1 The card names itself optional twice (tag and Kit's line) and has exactly one button and one Skip.
- O2 Skip changes the card to the skipped line, survives a reload, and posts nothing else; the sequence still goes on to the paywall step as before.
- O3 Show me the list opens Closet, then the list; Back lands on Closet.
- O4 No row shows a price or a count bar; no "Next step" card; no pinned moves row in Lookbook or You; `/you/moves` and `/lookbook/moves` don't exist.
- O5 Picking `Black tee` adds a not-photographed top piece with subcategory `tee`, color `black`, named `Black tee`; its drawing is black.
- O6 Every option's piece keeps its row marked (its `starterId`), whatever the color; a later color edit on the piece page never un-marks it (only a change of kind out of the row does). The rows' `fills` (what a photographed piece must be to count, which Next best buy relies on) don't change.
- O7 Picking again on an added row changes that piece (same id, new kind/color), never adds a second one; Remove deletes it with Undo.
- O8 A piece found by fit checks still locks its row (`In your closet`, disabled), as today.
- O9 The belt still marks in kv only (no closet slot), with Undo on remove.
- O10 Next best buy and the chat's buy cards are unchanged in behavior.
- O11 VoiceOver: the card reads as one element with its title, body and actions; each row is a button that says its state.
- O12 Light, dark and the largest text size on the Simulator: nothing clipped, no word broken mid-word.

**Results (Oct 18).** `npm run check` green (1,298 app tests; the old M1–M4 and `yourMoves.test.ts` replaced by O1–O9 in `onboardingFinish.test.ts`; `pieceEdit.test.ts` now checks that a leg or color fix keeps a list piece marked and a kind change unmarks it). On the iOS Simulator (dev build through a worktree Metro): demo 151 (the card, light), 164 (skipped, dark), 161/180 (the list, light; 180 dark at the largest text size), 151 at the largest size.
- O1, O2, O4 **pass** (seen and tested). O3 **pass**: Show me the list → Closet → the list, Back says Closet. O5–O9 **pass** in tests; on screen, 180 shows `Plain tee · Added: Black tee` with a black drawing and the row checked.
- The `Which one is yours?` menu opens with the row's choices (seen: `Olive / Navy / Tan / Black / Grey overshirt`, `Dark / Black / Mid-wash / Light jeans`). The Simulator tool's injected taps on the menu's buttons landed on the rows behind it, so a pick from the menu itself wasn't seen on screen; the pick is the tested `pickStarter`, and demo 180 shows its result. **Check on the phone:** pick a color from the menu once.
- O12: no clipping or mid-word breaks at the largest size; the card's tag line stacks. Seen, not changed: a black piece's drawing on the dark tile is low-contrast (the closet's drawings, as everywhere).
- O11 not checked with VoiceOver on a device.

---

## 10. Basics down to the birth year; height, build and fit asked after the first score (Oct 21, #371)

*The founder, Oct 21, after the onboarding review: "that sounds good. plan out the things that have to be done and also tests. leave placeholders for auth for now." Then: "build the birth-year onboarding plan (§10) with the draft words, tests first." **Built Oct 21; results in §10.7.** The review's point: height, build and fit are optional, but they put a screen of questions before he's seen any value, and "Build" (Slim · Average · Broad) is the one question about his body, asked before the app has earned it, in an app whose line is "it rates the outfit, never you." This section is the plan and the checks, written before any code. §10.6 holds the account work as placeholders.*

### 10.1 What he'll see

**O3 becomes the birth-year step.**
- His looks echo bubble and Kit's reply stay. Kit's reply ends differently: `{style1}. Good pick. One more thing: your birth year.` (one style; the two-style and "Not sure" lines change the same way, §10.5).
- One card with one row, `Birth year` / `Choose`, which opens the same year list (O3w). No height stepper, no Build, no Fit, no silhouette with the tape (it only showed his height).
- Under the card: `Kitted is for 18 and up. It never changes your score.`
- The button `Continue` (was `Looks right`), off until a year is picked; the hint `Pick your birth year to go on.` stays.
- Under 18: the same "Born in {year}?" confirm, then the age stop, as today.
- **The tap count stays 8** (the optional fields never counted). What changes is how it feels: one thing to answer, and nothing about his body before the score.
- **The restore path** (signed in from Welcome, §4.4) already shows only the birth year; it keeps its own line `Welcome back. Your birth year first, then I'll bring back your fits.` Both paths now share one layout.

**O5 Consent:** his echo bubble reads `Born in 2004` (was `5′ 10″ · Average · Regular · 2004`). Nothing else on Consent changes; the consent text already says height and build go with questions "if you gave them", which stays true. `CONSENT_VERSION` doesn't change.

**After the first score, Kit asks once, when it helps (the "About you" card).**
- An inline Kit card in the thread (`cardType: 'aboutYou'`), never a pop-up: tag `Optional` / `10 seconds`; title `Fit advice that fits you`; body `Tell me your height and how you like clothes to fit, and I'll size my suggestions to you. None of it changes a score.`; PrimaryButton `Add them` · TextLink `Not now`.
- `Add them` opens a sheet, `About you` (`/sheets/about-you`): `Height` (the stepper, blank until the first tap), `Build`, `Fit you like` (the same controls as You → Style profile, all blank), `Save` (off until one is set) and the X. Save writes the profile; the card reads `Saved. Change them any time in You.` with no buttons.
- `Not now`: the card reads `No problem. They're in You → Style profile whenever you want.`
- Past chats: read-only (no buttons).
- **You → Style profile** still edits all three, as today.

### 10.2 When the card posts (the triggers)

Posted only when **all** of these hold:
- none of height, build or fit is set (any one set, from the sheet or You, means never again);
- he has at least one scored full check;
- nothing is reading or waiting for the one quick tap, and no score reveal is playing (the 4 s settle, §9.1);
- it has posted fewer than 2 times; a second post needs 7 days since the first `Not now`;
- the one-ask-per-visit rule (below) allows it.

**And one of:**
- **T1, when it helps (first choice):** Kit has just answered a question whose answer uses them (the router's `fitHowTo`, `shape` or `buyNext` kinds). The card posts right under that answer, with the body `That answer would fit you better with your height and how you like clothes to fit. None of it changes a score.`
- **T2, the fallback:** a later visit than the one that scored his first check, once the end-of-onboarding sequence (§9.1) is `done` or `skipped`.

**One ask per visit (extends §9.1's rule).** In one visit, at most one of the end-of-onboarding sequence, the save offer (§3) or this card posts. Order when more than one is due: the sequence, then the save offer (once accounts are on, §10.6), then this card. T1 counts as the visit's ask; T2 never posts in a visit where something else already did.

**Phones with data from before this change:** anyone with any of the three already set never sees it. A profile with all three blank (setup skipped them) can get it by T1 or T2 like a new install. The founder's phone is `skipped` in §9.1, so T2 applies to it if his basics are blank.

### 10.3 What doesn't change
- **Scores.** Height, build and fit never move a score; today nothing checks it, so UN1 adds the test.
- **Kit's context.** Height and build are still sent with questions when given, never said back (07 §4); fit preference as today. The privacy test (birth year, name, location, photo paths never in the pack) stays.
- **Kit's memory** still never saves height or body words (`ask/memory.ts` NEVER list); the sheet and You are the only ways to set them.
- **The birth year** still never syncs and is never sent.
- **The build words.** The sheet uses today's `Slim · Average · Broad`. The figure's longer list (#247, `Slim · Average · Athletic · Broad · Bigger · Rather not say`) is still the founder's open P2 call; if he OKs it, the sheet and You change together.

### 10.4 Build steps
1. **The birth-year step.** `BasicsScreen.tsx`: one layout for both paths (today's restore layout), the new reply and footnote lines, `Continue`. `basics.ts`: `basicsEcho` → `Born in {year}`. A draft saved by an older build that holds height, build or fit (someone mid-setup when the update lands) is still saved by Consent, never dropped.
2. **One shared fields component.** `BasicsFields` (height, build, fit) out of `BasicsScreen` and `you/profile.tsx`, used by You → Style profile and the new sheet, so the two can't drift.
3. **The sheet.** `/sheets/about-you`: the fields, Save, X; writes `profile.heightCm`, `build`, `fitPreference` through the same code as You (`features/you/profile.ts`).
4. **The card and its rules.** `features/aboutYou/`: a pure `aboutYouDue()` (state in kv `aboutYou.offer`: posts, last Not now, msg ids) like `finish/sequence.ts` and `account/offer.ts`; the `aboutYou` card type and its view; the one-ask-per-visit check shared with §9.1 and §3 (one helper, used by all three).
5. **T1 in the ask flow.** After an answer of kind `fitHowTo`, `shape` or `buyNext` finishes and passes the gate, the ask session calls `aboutYouDue({trigger: 'answer'})`; the card is never a counted question and never posts after a failed, limited or offline answer.
6. **Copy, demo screens, docs.** The new lines in `app/src/i18n/en.ts` (and 02 §5 copy deck, D3's update block); demo screens from the next free number (240 onward): O3 birth-year step, Consent with the new echo, the card (T1 and T2), the sheet, the saved and Not-now states.
7. **Checks on the iOS Simulator** (one at a time, rule 9): light, dark, the largest text size; VoiceOver labels by reading the tree.

About 1.5 days. JS only: it reaches his phone through Metro, no reinstall.

### 10.5 The pass/fail checks (written before building, Oct 21)

**The birth-year step (BY)** — tests in `onboardingFlow.test.ts` (updated), on screen on the Simulator:
- **BY1** O3 shows exactly one field, Birth year; no height, build, fit or silhouette, in both the new-setup and the restore path.
- **BY2** `Continue` is off until a year is picked, then goes to Consent; the hint shows only while no year is picked.
- **BY3** Under 18: the confirm, then the age stop; the Keychain lock is set exactly as today (`setAgeBlocked`).
- **BY4** Consent's echo bubble reads `Born in {year}`; Consent's text and `CONSENT_VERSION` are unchanged.
- **BY5** A setup finished on the new step saves `heightCm: null`, `build: ''`, `fitPreference: ''`.
- **BY6** A draft from an older build with height, build or fit set is saved with those values when he agrees (no answer he gave is dropped).
- **BY7** Resume (F4): closing the app on O3 reopens on O3 with the year kept.
- **BY8** Kit's three reply lines end with the birth-year line; none says "frame" or "basics".
- **BY9** The tap count to the camera on the shortest path is 8 (a test walks it).

**The card and its sheet (AY)** — tests in a new `aboutYouCard.test.ts`, the pure rules as unit tests:
- **AY1** Never before his first scored full check; never while a check is reading, asking or revealing.
- **AY2** T1: after a `fitHowTo`, `shape` or `buyNext` answer with all three blank, the card posts once, right after that answer, with T1's body.
- **AY3** T1 never fires after another kind (`whatToWear`, `explain`, `general`…), or after a failed, limited, offline or gate-emptied answer, and never counts as a question.
- **AY4** T2: on a later visit than the one that scored his first check, with the §9.1 sequence `done` or `skipped`, the card posts once with the default body; never while the sequence is `waiting`, `moves` or `paywall`.
- **AY5** One ask per visit: in a visit where the sequence or the save offer posted, T2 doesn't post; when the card posted, the save offer waits for the next visit (tested with accounts on, as on demo screens).
- **AY6** Any of the three set (from the sheet or You) → never posts again; an already-posted card still reads as it did.
- **AY7** At most 2 posts ever; the second needs 7 days since the first Not now.
- **AY8** `Add them` opens the sheet; Save is off until one value is set; Save writes the profile through `features/you/profile.ts`, and the card changes to the saved line; X saves nothing.
- **AY9** Not now changes the card to its line, survives a reload, and posts nothing else.
- **AY10** Past chats show the card read-only (no buttons, no links).
- **AY11** The sheet and You → Style profile show the same controls from the same component (one import), and an edit in one shows in the other.

**What must not move (UN):**
- **UN1 (new test)** Every demo photo scores the same with height, build and fit blank and with each value set.
- **UN2** Kit's pack: height and build appear only when set; the privacy test (no birth year, name, location or photo path) passes.
- **UN3** `npm run check` green (typecheck, lint, core and app tests, copy checks).

**On screen (SC)** — iOS Simulator:
- **SC1** O3, Consent, the card (T1 and T2) and the sheet in light and dark: nothing clipped.
- **SC2** The largest text size: the year row, the card's buttons and the sheet's segmented controls wrap or stack, no word broken mid-word.
- **SC3** VoiceOver: O3's year row reads `Birth year, not chosen` / `Birth year, 2004`; the card reads as one element with its actions; the sheet's fields read their values.

### 10.7 Results (Oct 21, tested against §10.5)

**Code:** `features/onboarding/BasicsScreen.tsx` (one layout, the year only; `Silhouette.tsx` deleted), `basics.ts` (`basicsEcho` → `Born in {year}`, `answersFromDraft`), `features/you/BasicsFields.tsx` (height, build, fit for You → Style profile and the sheet), `features/aboutYou/` (`rules.ts` pure, `service.ts`, `session.ts`, `AboutYouCard.tsx`, `AboutYouSheet.tsx`, `demo.ts`), `app/sheets/about-you.tsx`, the `afterAnswer` hook in `ask/pipeline.ts`, `scoringProfile` in `fitcheck/service.ts`, kv `aboutYou.offer` (this phone only, `sync/schema.ts`). Copy in `i18n/en.ts` (`onb.basics.*`, `about.*`). Demo screens 240–244 (under an answer, a later visit, the sheet, Not now, saved); 3, 4 and 136 show the step.

**Tests:** `birthYearStep.test.ts` (BY1–BY8), `aboutYouCard.test.ts` (AY1–AY11, UN1), both written first and failing before the code; `onboardingFlow.test.ts` updated for the new lines; `npm run check` green (1,534 app tests; the one lint warning is the existing one in `tryOn.test.ts`).

| Check | Result | How |
|---|---|---|
| BY1–BY8 | Pass | Tests; BY1, BY2, BY4 also seen on screen |
| BY9 · 8 taps to the camera | Pass | Walked on the web preview (year picked → Continue → Consent `Born in 2004`); the count is unchanged, the optional fields never counted |
| AY1–AY11 | Pass | Tests |
| AY8 on screen | Pass | iOS Simulator, demo 242: Relaxed → Save → the sheet closes and the card reads `Saved. Change them any time in You.` |
| UN1 | Pass | New test: every demo photo scores the same with height, build and fit blank or set; the fit check reads the profile only through `scoringProfile` |
| UN2 | Pass | The existing `stylistContext.test.ts` (height and build only when set; the privacy test) |
| UN3 | Pass | `npm run check` |
| SC1 · light and dark | Pass | Simulator: demo 3, 241, 242, 243; screenshots `screenshots/about-you/` (git-ignored) |
| SC2 · largest text size | Pass after 2 fixes | (1) the sheet's long subtitle sat in its sticky header and hid the fields: the sheet now has a title only and a short note under the fields, `For sizing and fit advice. None of it changes a score.`; (2) the height stepper's − and + outgrew their 30 pt circles (the same code You → Style profile had): the glyphs are capped at 1.3×. The card wraps with no word broken; O3's year row scrolls into view under Kit's line |
| SC3 · VoiceOver | Not checked on a device | Labels are in the code (`Birth year, not chosen` / `Birth year, 2004`; the card is one element with its title and body; the stepper is one adjustable element) |

**Found on the way:** the Simulator tool's taps often miss the first time after a launch (the dev menu's label takes them); the year pick was confirmed on the web preview, where clicks are exact, and the old layout behaves the same. A worktree Metro sharing the main checkout's `node_modules` picked up another worktree's transform cache (it bundled `hci-slides-review`'s routes): start it with `--clear`.

**Not done:** VoiceOver by ear; the T1 card under a live answer on the phone (the demo posts it under a seeded one); his phone through Metro.

### 10.6 Accounts: placeholders (not planned yet)

*The founder, Oct 21: "leave placeholders for auth for now." Today: the silent guest account is live (the server's limits follow it); Continue with Google is real on dev builds only and backs nothing up; the full sign-in design (§3–§5) is built on the stand-in and off (`ACCOUNTS_BUILT = false`). Each item below gets its own plan and checks when it's picked up.*

- **AU1 · Backup and sync for real.** The Firestore and Storage adapters for the built sync engine (`app/src/sync/`, `11-firestore-schema.md`), then the tracker wired into the store. *The real blocker: sign-in protects nothing until this exists.* Not planned yet.
- **AU2 · Sign in with Apple.** `expo-apple-authentication` (a new package, his OK) after the $99 program; Apple 4.8 requires it before Google can ship in Release. Not planned yet.
- **AU3 · App Check.** In the app (`@react-native-firebase/app-check`, his OK) and switched on in the server's config (`enforceAppCheck`). Closes the open door below. Not planned yet.
- **AU4 · Account deletion vs App Check.** The `deleteAccount` function requires App Check (`firebase/functions/src/index.ts:53`) and the app doesn't send it, so "Delete account and all data" would fail once accounts are on. Ship AU3 with accounts, or let the function accept a signed-in call without App Check until then. Not planned yet.
- **AU5 · Guest accounts and the shared spending stop.** Guests are free to create with the app's public key, each gets Pro's limits during the beta, and the $3 daily stop is shared, so a script could pause checks for everyone. Low risk at TestFlight size; before the public launch: AU3, plus guests on the free tier once purchases exist. Not planned yet.
- **AU6 · The save offer in the one-ask-per-visit order.** §10.2 already orders it (sequence → save offer → About you); confirm when `ACCOUNTS_BUILT` goes on.
- **AU7 · Email sign-in by code.** Needs a server route that sends mail (AC1). After launch. Not planned yet.
- **AU8 · The beta note.** Until AU1, a tester who deletes the app loses his fits; the TestFlight "What to test" text should say so.

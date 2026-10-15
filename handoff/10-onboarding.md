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

---

## 9. The end of onboarding: Later, the first 3 moves, the paywall, the notification ask (Oct 15, #290)

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

- **`Later`** (TextLink, in the card's link row after `Not quite right?`) shows only on his first-ever full check, while the sequence hasn't started and the check is still the newest card, not read-only. Tap: the sequence starts (the moves card follows at once, no settle wait). The Re-check button stays while its window is open; Later doesn't close it.
- **The card (S14):** tagline `Your plan` / `3 moves`; title `Your first 3 moves`; three numbered rows (FixRow shape, no gain on the right; a done row: filled circle and strikethrough):
  1. `Tap the basics you own` / `30 seconds · in Closet`. Done once he's marked one piece in Starter essentials.
  2. His first check's top fix, word for word, with its tag (`Tuck in your tee` / `Free`). Done if his re-check made it (the re-check's done fixes). No fix: the card's next-level line with `Free · next time you get dressed`. Neither: `Check tomorrow's fit` / `Free · 1 a day`.
  3. The Starter essential he's missing that adds the most outfits to his closet: `Add a grey quarter-zip` / `$40–50 · +3 fits` (budget price; no `+N` when it adds none). Done when Closet gets one.
  - **One button, for the first move not done:** `Start move 1` → the Closet tab, then Starter essentials. `Start move 2` → the camera (a check like any other). `Start move 3` → Starter essentials (C7, the next-buy sheet, isn't built; that's where he marks it once he has it). All done: no button, and the card's title reads `All 3 done. Nice work.`
- **Where it lives:** in today's chat, and read-only in Past chats. L3 (`Your moves`) and the pinned `Your moves · 1 of 3` rows in Lookbook and You are **not built** here (a follow-up).

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

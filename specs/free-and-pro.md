# Free and Pro

**Approved by the founder:** 2026-11-07 (FP7, the beta: 2026-11-08; 30 questions: 2026-11-17)

After this, a new user knows from his first result how many free checks he has, is offered Pro at three honest moments with one price, and can always close the page and keep using everything that runs on code.

**Part of:** `specs.md` → F10 (Free checks, Pro and the paywall), "Free checks running out".

## Why
The paywall and limit card were built for the old rules: a 1-week trial, Pro at 10 checks and 50 questions, free at 1 check a day forever. Launch is 7 free checks (at most 1 a day), 3 questions a day, and Pro at $9.99 a month or $39.99 a year with no trial. In this category the paywall is where the 1-star reviews come from (`market/market-research.md`: GRWM 69% 1–2★, mostly paywall), so every moment here has to be honest, closable and never a surprise.

## Scope
- **In:** the limits as the app shows and enforces them on the phone; one paywall page used at every moment; the soft page after his first result; the limit card's upgrade button and "Save for tomorrow"; the paywall at check 8 and what happens to that photo; Restore, failed, pending, offline and loading states; what a lapsed Pro user sees; the running count in the Stylist subtitle and You → Plan; removing the trial everywhere.
- **Out (non-goals):** a free trial; any discount, intro offer, "one-time offer", win-back offer or founding offer; timers or exit offers; a lifetime, weekly or family plan; "unlimited" anywhere; a paywall over a chat question; the server's counting (T20/T21 build the rule stated here); the spend-cap pause card (T20); analytics events (T90).
- **The beta** has its own rules (FP7): no paywall, no prices and no purchases until launch.

## The rules
- **Free:** 7 free fit checks for life, at most 1 a day (days roll over at 4 am). Each check includes its re-check. 3 questions a day. Everything that runs on code stays free forever: scores, fixes, Closet, Lookbook, outfit ideas (share cards are cut until after launch, #423).
- **Pro:** up to 5 fit checks (each with its re-check) and 30 questions a day.
- **Prices:** Yearly $39.99 and Monthly $9.99, the same at every moment, every time. Yearly is selected when the page opens. The price strings come from the store, never hard-coded.
- **What counts:** a scored check counts. A failed, offline, "not rated" or same-photo check never counts (`specs.md` F2). A check made while he's Pro never counts against his 7 free checks.
- **Which moment he gets**, when he takes a photo on the free plan:
  1. Free checks left = 0 → the paywall, check-8 version (FP4). The photo is saved, not sent.
  2. Else, today's free check already used → the limit card (FP3). The photo is saved, not sent.
  3. Else → the check runs.
- **Pro at his daily cap (5):** the limit card's Pro version (FP3), no upgrade button.
- **Pro ends** (cancelled, refunded, or Apple's billing grace period over): free rules at once, with every fit, score, closet piece and saved photo kept. Free checks he never used are still his. During Apple's billing grace period he stays Pro.
- **The paywall opens only** at: the soft page (once, after his first scored result), the limit card's "Score it now with Pro", a photo taken with no free checks left, the saved photo's "Score it with Pro", and You → Plan's "See Pro". Nowhere else, and never inside a score or a re-check moment.

## FP1. The paywall page
One page (a full-screen cover), the same layout at every moment. Only the top two lines and the photo card change.

**Layout, top to bottom**
1. Nav: **X** (leading, "Close" for VoiceOver) · **Restore** (trailing). Both visible and tappable from the first frame.
2. Woven label `KITTED PRO`.
3. Headline and the line under it (see the table below).
4. The photo card: his photo (neck crop) with two lines (see below). Hidden if there's no photo to show.
5. Perks, each with a checkmark: `Up to 5 fit checks a day` · `Up to 30 questions a day`.
6. The free line: `Scores, fixes, Closet and Lookbook stay free.`
7. Two plan cards, a radio group, Yearly selected:
   - `Yearly` · `$39.99` `/yr` (the biggest price on the page) · `$3.33 a month` (smaller) · badge `Best value`.
   - `Monthly` · `$9.99` `/mo`.
   - The per-month figure is the store's yearly price ÷ 12, rounded down to the cent, in the store's currency.
8. Buy button: `Subscribe for $39.99/year` (Monthly selected: `Subscribe for $9.99/month`).
9. Ghost button: `Continue free`.
10. Fine print: Yearly `$39.99 a year. It renews every year until you cancel. Cancel at least 24 hours before it renews (Settings › your Apple ID › Subscriptions).` · Monthly `$9.99 a month. It renews every month until you cancel. Cancel at least 24 hours before it renews (Settings › your Apple ID › Subscriptions).`
11. Links: `Terms` · `Privacy`.

At the largest text size the page scrolls. X and Restore stay pinned in the nav.

**Top lines by moment**

| Moment | Headline | Line under | Photo card |
|---|---|---|---|
| Soft page (FP2), or You → Plan with free checks left | `{n} free checks left.` (`1 free check left.` at one) | `Pro is here when you want more.` | His latest scored check, the Today card (FP2) |
| From the limit card's `Score it now with Pro` | `Score this one now.` | `Pro gives you up to 5 fit checks a day.` | The saved photo · `Saved. Not scored yet.` |
| Check 8: a photo taken with no free checks left, or the saved photo's `Score it with Pro` | `That's your 7 free checks.` | `Go Pro and I'll score this one now.` | The saved photo · `Saved. Not scored yet.` |
| You → Plan with no free checks left | `That's your 7 free checks.` | `Go Pro to keep checking your fits.` | His latest scored check, or hidden |
| Pro ended, at any moment where he has no free checks left (wins over the two rows above) | `Your Pro ended.` | `Go Pro again and I'll score this one now.` (no saved photo: `Go Pro again to keep checking your fits.`) | The saved photo, or hidden |

### States
| State | When | What's shown (exact words) |
|---|---|---|
| Loading | plans not back from the store yet | Plan cards as still placeholders; the buy button disabled. X, Restore and `Continue free` work |
| Load failed | the store returned an error | `Plans didn't load.` + `Try again` in place of the plan cards; `Continue free` |
| Offline | no connection | `Plans need a connection.` in place of the plan cards; `Continue free` |
| Buying | after the buy tap, until the store answers | The buy button shows a spinner and is disabled; X still works |
| Pending | Ask to Buy or a held payment | `Waiting for approval.` under the buy button; he stays on free rules until it clears |
| Failed | the store says the purchase failed | `That didn't go through. Nothing was charged.` under the buy button; stays on the page; Apple's own alert if it shows one |
| Cancelled | he cancels Apple's purchase sheet | Nothing; back to the page as it was |
| Success | purchase or restore makes him Pro | The page closes; toast `Pro is on.`; a saved photo (newest first) is scored now with Pro's checks |
| Restore, nothing found | Restore finds no subscription | Toast `Nothing to restore.`; stays on the page |
| Restore, found | Restore brings back Pro | Toast `Purchases restored.`, then as Success |
| Already Pro | opened while Pro (from You → Plan) | `You're Pro.` · `Up to 5 fit checks and 30 questions a day.` · `Manage subscription` (opens Apple's subscriptions page) · X |

## FP2. The soft page (after his first result)
- Opens once in his life: after his first **scored** check's result has been on screen (the existing onboarding sequence placement, after the moves card). A first check that failed or was "not rated" doesn't trigger it. Closing the app while it's open counts as shown.
- Not shown if he's already Pro.
- Top lines: `{n} free checks left.` / `Pro is here when you want more.` (n is his real count, 6 on a normal first run).
- The Today card shows his first check, with the existing variants: `Today: {before} → {after}` / `One free fix. Nothing new to buy.` (`{n} free fixes. Nothing new to buy.`) after a re-check; `Today: {score}` / `{n} free fixes to {target}.` (`One free fix to {target}.`) without one; `Today: {score}` / `Dialed in on your first check.` at 9+ with no fixes.
- X or `Continue free` → back to the chat, then the notification ask follows as today.

## FP3. The limit card (a second photo the same day)
An inline card in the chat, under his photo. The photo is saved on the phone, never sent until he taps.

**Free, with free checks left after today's**
- Tag `Daily limit` · `Resets at 4 am`.
- Title `That's today's free check.`
- Body `I'll save this photo and score it after 4 am. That uses one of your {n} free checks left.` (n = free checks left now). With exactly one left: `I'll save this photo and score it after 4 am. That's your last free check.` If today's re-check is still open, add ` Today's re-check still works.`
- Buttons: `Save for tomorrow` (main) · `Score it now with Pro` (opens FP1, "from the limit card" lines).
- `Save for tomorrow` → the card becomes the saved card: tag `Waiting to score` · `After 4 am`; `Saved. I'll score it when you open Kitted after 4 am. It uses tomorrow's free check.`; `Don't score it`. After 4 am: `Ready to score last night's photo?` · `Score it` · `Not this one` (as built).
- Ignoring the card = saved anyway (labeled `Waiting to score`).

**Pro at his daily cap**
- Tag `Daily limit` · `Resets at 4 am`. Title `That's today's 5 fit checks.` Body `I'll save this photo and score it after 4 am.` One button: `Save for tomorrow`. No upgrade button, no paywall.

**Never:** a blurred score, "upgrade to see", a timer, or the photo sent before he taps.

## FP4. Check 8: free checks used up
- A photo taken with no free checks left opens FP1 with the check-8 lines, showing that photo as `Saved. Not scored yet.` Nothing is sent.
- Buys → FP1 Success: the photo is scored at once.
- X or `Continue free` → back to the chat, where his photo has a card: `Saved. Not scored yet.` · `Score it with Pro` (opens FP1, check-8 lines) · `Don't score it` (removes the card and the saved photo from Kitted). In Lookbook it shows as `Not scored`.
- Each new photo he takes while out of free checks does the same (the paywall again, since he started it). Several saved photos can wait; buying Pro scores the newest at once, and the rest show `Score it` on their card, using Pro's daily checks.
- Re-checks of checks already scored still work (they're included).

## FP5. When Pro ends
- No message, notification or card when it ends ("we miss you" is never said, `specs.md` F13).
- Free rules from that moment: 3 questions a day, and his unused free checks (7 minus the free ones he used before Pro) at most 1 a day.
- You → Plan: `Free plan` · `Pro ended {date}` (date as `Mar 3`) · `See Pro`.
- When he next has no free checks left, the paywall shows the "Pro ended" lines (FP1 table).
- Everything he made while Pro stays: fits, scores, Closet, Lookbook, saved photos.

## FP6. Counts he can see
**Stylist subtitle** (free plan only; a waiting photo and `{n} questions left today` keep their priority as built):
- free checks left > 1 and today's not used: `{n} free checks left`
- free checks left = 1 and today's not used: `Last free check`
- today's used, more left: `Check used today` (or `Re-check included` while its re-check is open)
- none left: `Free checks used`
- Pro: no check line.

**You → Plan**
- Free: `Free plan` · `{n} of 7 free checks left · {q} of 3 questions today · resets at 4 am` · `See Pro`.
- Pro: `Kitted Pro` · `Up to 5 fit checks and 30 questions a day` · `Manage`.
- Pro ended: as FP5.

**Questions**
- Free, 4th question: `That's today's 3 questions. More at 4 am, or go Pro for up to 30 a day.` No button; not counted.
- Pro, 31st question: `That's 30 questions today. More at 4 am.`

## FP7. The beta (TestFlight, until launch)
Friends testing the app never pay and never see a price. The server says which rules a phone is on; during the beta it answers `beta` for everyone, and at launch it switches to free.

- **Limits:** 3 fit checks a day, each with its re-check, and 30 questions a day (20 until Nov 17; `specs/kit-stylist-chat.md` KC10). Days roll over at 4 am. No lifetime count.
- **What counts:** as in "What counts": failed, offline, "not rated" and same-photo checks never count.
- **At launch:** checks made in the beta never count toward the 7 free checks, so every tester starts launch with 7.
- **Never during the beta:** the paywall, the soft page, `See Pro`, a price, the word "Pro", "free checks" or "trial" anywhere he can see.

**The limit card (a 4th photo the same day)**
- Tag `Daily limit` · `Resets at 4 am`. Title `That's today's 3 fit checks.` Body `I'll save this photo and score it after 4 am.` One button: `Save for tomorrow`. The saved card works as in FP3.

**Questions**
- 31st question: `That's 30 questions today. More at 4 am.` No button; not counted.

**Counts he can see**
- Stylist subtitle: no check line (a waiting photo and `{n} questions left today` keep their priority as built).
- You → Plan: `Kitted beta` · `3 fit checks and 30 questions a day · resets at 4 am`. No button.

## Data
- **Free checks used** (lifetime, free checks only) and **today's checks and questions**: the phone's mirror of the server's counts (the server is the truth from T21). A check carries whether it was made as Pro, so it never counts toward the 7.
- **When Pro ended**: the date, for You → Plan and the "Pro ended" lines. Comes from the store's entitlement.
- **Saved photos**: a check row with status `held` (as built), now also used at check 8. Never uploaded while held.
- **The soft page shown**: once ever (as built in the onboarding sequence).
- Removed: trial state, trial dates, "trial used".

## Acceptance criteria
**Limits (T11)**
- FP0.1 On the free plan, the 8th scored check is never run: with 7 free checks used, a photo opens the check-8 paywall and nothing is sent.
- FP0.2 On the free plan, a second photo in one 4 am–4 am day shows the limit card and sends nothing, while free checks remain.
- FP0.3 A check made while Pro doesn't change his free checks left: buying Pro after check 1, making 3 checks, then Pro ending leaves 6 free checks.
- FP0.4 Failed, offline, "not rated" and same-photo checks never lower the count.
- FP0.5 Free questions stop at 3 a day with FP6's line, not counted; Pro's at 30.
- FP0.6 Pro's 6th photo in a day shows the Pro limit card, with no upgrade button.
- FP0.7 No string the user can see contains "trial", "free for", "unlimited", "1 week" or "14 days" (a copy test over the copy deck and `en.ts`).

**The paywall (T12)**
- FP1.1 X, Restore and `Continue free` are on screen and work from the first frame, in every state, including loading, offline and failed.
- FP1.2 Yearly is selected when the page opens; the buy button reads `Subscribe for {yearly price}/year`, and switches to `Subscribe for {monthly price}/month` when Monthly is tapped.
- FP1.3 The billed price (`$39.99`, `$9.99`) is the largest price on the page; `$3.33 a month` is smaller.
- FP1.4 The prices on the cards, button and fine print come from the store's products; changing the mock store's price changes every one.
- FP1.5 The top lines match the FP1 table for each moment (one test per row).
- FP1.6 A failed purchase shows `That didn't go through. Nothing was charged.`, stays on the page, and he stays on free rules; a cancelled purchase shows nothing.
- FP1.7 Restore with nothing to restore shows `Nothing to restore.`; with a subscription, `Purchases restored.` and he's Pro.
- FP1.8 After a purchase or restore with a saved photo, the newest saved photo is scored without another tap, and `Pro is on.` shows.
- FP1.9 Offline: `Plans need a connection.`, no buy button, `Continue free` works.
- FP1.10 At the largest text size and with VoiceOver, every element is reachable and labeled; X reads "Close".

**The soft page (T12)**
- FP2.1 It opens once, after the first scored result, never before a score and never a second time (also not after quitting while it was open).
- FP2.2 Its headline uses the real count (`6 free checks left.` on a normal first run).
- FP2.3 A first check that failed or was "not rated" doesn't trigger it; the next scored one does.
- FP2.4 Not shown to a user who is already Pro.

**The limit card (T12)**
- FP3.1 Its body names the real count; with one left it reads `That's your last free check.`
- FP3.2 `Save for tomorrow` turns it into the saved card, and the photo is scored after 4 am only on his tap.
- FP3.3 `Score it now with Pro` opens the paywall with `Score this one now.`; buying scores that photo at once.

**Check 8 (T12)**
- FP4.1 `Continue free` leaves the photo in the chat as `Saved. Not scored yet.` with `Score it with Pro` and `Don't score it`, and in Lookbook as `Not scored`; it's never uploaded.
- FP4.2 `Don't score it` removes the card and the saved photo.
- FP4.3 Scores, fixes, Closet, Lookbook and outfit ideas keep working with no free checks left (never blurred, never charged).

**Pro ended (T11 + T12)**
- FP5.1 With the entitlement expired, the app is on free rules at the next launch or foreground, and no message is posted.
- FP5.2 You → Plan shows `Pro ended {date}`; the paywall with no free checks left shows `Your Pro ended.`
- FP5.3 Every fit, score, closet piece and saved photo from his Pro time is still there.

**Counts (T11)**
- FP6.1 The Stylist subtitle follows FP6 for each case (one test per line).
- FP6.2 You → Plan follows FP6 for free, Pro and Pro ended.

**The beta (T14)**
- FP7.1 On the beta rules, a 4th photo in one 4 am–4 am day shows the beta limit card and sends nothing; the server also refuses a 4th check.
- FP7.2 Each of the 3 checks keeps its re-check, and a re-check doesn't use one of the 3.
- FP7.3 The 31st question shows FP7's line and isn't counted.
- FP7.4 Failed, offline, "not rated" and same-photo checks never lower the count.
- FP7.5 On the beta rules, no paywall or soft page opens from any moment in "The paywall opens only", and no visible string contains a price, "Pro", "free check" or "trial" (a copy test plus a flow through 4 photos and 31 questions).
- FP7.6 Checks made on the beta rules don't change the 7 free checks: switching the server to free afterwards shows `7 of 7 free checks left`.
- FP7.7 You → Plan shows the FP7 row.

## Touches
- `app/src/services/quota.ts` (limits, counts, which moment), `entitlements.ts`, `purchases.ts` (the mock store gets yearly and monthly, no trial).
- `app/src/features/paywall/` (one page; `PlansScreen` goes away), `held/` (limit card, the check-8 saved card), `finish/` (the soft page placement), `settings/plan.ts` and You → Plan.
- The copy deck `handoff/02-screens.md` §5 (which generates `en.ts`): every string above, the trial strings removed.
- Must not break: same photo, same score; a held photo never sent before a tap; past scores visible and never blurred (`specs.md` F8.1, F10.4).
- Server (T20/T21) builds the counting rule in "What counts", including "checks made while Pro don't count".
- The beta (T14): the server's tiers in `firebase/functions/src/api/limits.ts` and `store.ts` (a `beta` tier, the server's config set to it), the phone's `services/server/tier.ts` and `quota.ts`.

## Assumptions
- Apple's billing grace period is turned on in App Store Connect, so a failed renewal keeps Pro for its length (Y7).
- The per-month line rounds down (`$3.33`), so it never overstates the saving.

## Later
- A price test after about 1,000 people have seen the paywall (`market/market-research.md`).
- Apple's win-back offer for people whose Pro ended (v1.1).
- The waitlist founding offer (`specs.md` Later, v1.1).

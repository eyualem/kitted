# 10: How Kitted is set up, end to end (v1)

*Oct 6, 2026. Built from `CLAUDE.md`, `demo-app-spec.md`, `research-context.md` §C14, `rubric/v3.md` and the 20 mockups. CLAUDE.md wins any conflict, then this doc.*

**House rules used throughout:** do things in Stylist, look at things in the other tabs. Push = Back/edge swipe. Sheet = swipe down or Done. Full screen = visible X from frame one. Nothing that fails ever uses up a free check.

---

## 1. App map (41 screens and states)

### Onboarding (full-screen cover, no tab bar)
| ID | Screen | Purpose | Enter | Leave | Primary |
|---|---|---|---|---|---|
| O1 | Welcome | The promise plus a real result | Cold launch | Push to O2 | Get started |
| O2 | Pick looks | Up to 3 styles from photos | O1 | Push; Back | Continue |
| O3 | Basics | Height, build, fit, birth year | O2 | Push; Back | Looks right |
| O4 | Age stop | Under 14 blocked | O3 | None (terminal) | None |
| O5 | Consent | Apple 5.1.2(i) yes | O3 | Cover closes into Stylist, camera opens | Agree & check my fit |
| O6 | Restore | Bring back a linked account | O1 "I've used Kitted before" | System Sign in with Apple sheet | Continue with Apple |

### Stylist (tab 1, home)
| ID | Screen | Purpose | Enter | Leave | Primary |
|---|---|---|---|---|---|
| S1 | Chat | The thread, 4 quick-starts, cards | Tab | n/a | Check my fit |
| S2 | Camera | Propped or mirror capture, 3-2-1 | Check my fit, Re-check | Full screen, X | Shutter / auto |
| S3 | Retake prompt | On-device quality fail | S2 | Inline in S2 | Retake |
| S4 | Photo picker | Library backup (PHPicker, no permission) | Composer photo icon | System sheet | Choose |
| S5 | Reading | Staged progress + occasion chips | S2/S4 | X = keep going in background | Tap occasion |
| S6 | Fit check card | Score, label, fixes | S5 | Inline | Re-check after fixing |
| S7 | Why this score | The receipt | Card | Sheet | Done |
| S8 | Not quite right? | Correct a reading | Card, or tap a "What I read" pill in S7 | Sheet | Update score |
| S9 | Shoe snap camera | Feet and hem only | Partial card | Full screen, X | Shutter |
| S10 | Pick shoes from Closet | One-tap finish | Partial card | Sheet | Tap a pair |
| S11 | Added items review | Undo/edit auto-added pieces | "Added 3 · Review" | Sheet | Done |
| S12 | Share card | 9:16 neck-down before/after | Card Share | Full screen, X | Share to Story |
| S13 | Photo viewer | Zoom any photo | Tap photo | Full screen, X / swipe | n/a |
| S14 | Your first 3 moves | Starting plan | After first re-check or "Later" | Inline Plan card | Start move 1 |
| S15 | Notification ask | Daily idea time | After paywall | Inline Question card | Yes, at 8:00 |
| S16 | Save your progress | Sign in with Apple | After 2nd check | Inline card, system sheet | Continue with Apple |
| S17 | Limit card | Free check used | Shutter after limit | Inline | Save for tomorrow |
| S18 | Camera off | Permission denied | Check my fit | Inline card | Choose a photo |
| S19 | Failure card | AI/offline/kill-switch | Any AI call | Inline | Try again |

### Closet (tab 2)
| ID | Screen | Purpose | Enter | Leave | Primary |
|---|---|---|---|---|---|
| C1 | Closet home | Rotation, essentials, next buy, grid | Tab | n/a | Tap an item |
| C2 | Item detail | Photo, facts, "+N fits", worn in looks | Grid | Push | Style this |
| C3 | Edit item | Category, color, fit, delete | C2 Edit, S11 | Sheet | Save |
| C4 | Add item | Take photo / Choose photos / Describe it | "+" top right | Menu, then S2/S4/sheet | Save |
| C5 | Starter essentials | 12 checklist, tap what you own | Essentials card | Push | Mark owned |
| C6 | How Rotation is counted | Plain explainer | Tap the number | Sheet | Done |
| C7 | Next best buy | Archetype, price, what to look for | Card | Sheet | Got it |

### Lookbook (tab 3)
| ID | Screen | Purpose | Enter | Leave | Primary |
|---|---|---|---|---|---|
| L1 | Lookbook home | Looks / Calendar / Saved, days counter, Your moves row | Tab | n/a | Tap a look |
| L2 | Look detail | Photo, score history, fixes, items | L1 | Push | Wear this again |
| L3 | Your moves | The 3 moves, done/not done | L1 row | Push | Start |

### You (tab 4)
| ID | Screen | Purpose | Enter | Leave | Primary |
|---|---|---|---|---|---|
| Y1 | You home | Silhouette, styles, facts preview, plan row | Tab | n/a | Edit |
| Y2 | Style profile | Basics, styles, boldness, budget | Y1 Edit | Push, row sheets | Save |
| Y3 | What your stylist knows | Every fact, source, date | Y1 | Push | Edit/delete fact |
| Y4 | Settings | List | Gear top right | Push | n/a |
| Y5 | Plan & usage | Pro status, today's counts, Manage, Restore, Redeem | Y1 plan row, Y4 | Push, system manage sheet | Manage |
| Y6 | Notifications | 3 toggles, idea time | Y4 | Push | Toggle |
| Y7 | Privacy & data | Retention, delete photos, forget facts | Y4 | Push | Delete all photos |
| Y8 | Delete account | What goes, subscription warning | Y7 | Push, destructive dialog | Delete account |
| Y9 | Account | Apple link status, sign out | Y4 | Push | Link Apple |

### Global
- **P1 Paywall:** from onboarding, the limit card, a Pro feature or Y5. Full screen with X and Continue free.
- **G1 Offline banner:** under the nav bar on any tab, says what still works, auto-hides.

**Cross-tab rule:** every "doing" button outside Stylist (Style this, Wear this again, Start a move) switches to Stylist with the item attached. The one exception is Closet "+" (C4): plain data entry, where Jakob's Law expects it.

---

## 2. State matrix

| State | Stylist | Closet | Lookbook | You |
|---|---|---|---|---|
| **(a) First launch / empty** (after "Not now" on consent) | "Send me a fit. I'll score it and start your closet." Check my fit + See an example | "Your closet builds itself. Do a fit check and I'll add what you're wearing." Check my fit · Tap the basics you own | Ghost look card: "Your first look lands here, with its score." Check my fit | Basics + styles from onboarding. Facts: "I'll add what I learn here." |
| **(b) After first check** | Card + re-check, then 3 moves card | 3 items, "Rotation unlocks with top + bottom + shoes" (or "1 fit"). Essentials 3/12 pre-filled | 1 look, calendar dot today, "1 this week · 1 total" | 4 to 6 facts, each "From a fit check · Oct 6" |
| **(c) Day 7 returning** | Today's idea at top, "1 free check today" in nav | Rotation 20 to 40, next best buy, filters at 12+ items | 4 to 6 looks, Saved, moves 2/3 | Plan row with today's usage |
| **(d) Free limit reached** | Nav: "Next free check 4 am". Shutter still works and holds the photo (S17). Questions: "3 left" | Unchanged (free) | Unchanged; held photo shows as "Waiting to score" | Plan row: "Checks 1 of 1 · Questions 2 of 5 · resets 4 am" |
| **(e) Offline** | G1 banner. Photo stays in thread as "Not sent · Retry". Ideas from cache still work | Fully readable and editable; syncs later | Fully readable | Readable. Delete account disabled: "Connect to delete your account" |
| **(f) AI call failed** | S19: "I couldn't score this one. That's on me. It didn't use your check." Try again | Nothing auto-added | No look created | No change |

---

## 3. Key flows

**First run (6 taps).** Get started (1) → tap a look (2) → Continue (3) → Basics with a blank birth-year wheel, Looks right (4) → Agree & check my fit (5) → **camera permission** (6) → propped auto-capture → Reading (Everyday preselected) → card. "Not now" on consent lands in Stylist state (a); the camera button re-shows O5. "See an example" scores a licensed photo (also the App Review demo) and offers "Remind me tonight", which asks **notifications** in context.

**After the first check.** Re-check or "Later" → first 3 moves (move 1 is always "Tap the basics you own, 30 seconds") → **P1** → **notification ask** (system prompt only on Yes). **Sign in with Apple** after check 2 (S16), once, then only in Y9.

**Daily check + partial + shoe snap.** Check my fit → camera in last-used mode → 3-2-1 → on-device quality check (unreadable = Retake, not counted) → Reading (last occasion preselected) → card. No shoes: "8.0 · Partial check: shoes not included", fixes as usual, then a row "Finish the check: Snap your shoes · Same as Tuesday's · Skip". Snap hint: "Phone at knee height, point at your feet." Score updates in place, "8.0 → 7.5 · Full check ✓", never uses a check.

**Re-check.** Button names the top fix ("Cuffed them? Re-check") → camera, same mode and occasion → re-read of only the fixed attributes plus a new-problem scan → "6.5 → 7.5 ↑1.0" with Share the before and after. Fix not seen: "I still see pooling" · I did cuff them (a logged correction) · Try another photo. Window: 30 min; **first-ever check: until 4 am.**

**Not quite right?** Chips: Wrong item (type picker) · Wrong color or fit (attribute chips) · Fix doesn't apply (shows next fix) · Score feels off (Higher/Lower, logged, no re-score). Live preview "6.5 → 7.5" → Update score → "Saved to your khaki chinos." Changing a card's occasion chip re-scores the same way, free.

**What should I wear?** Occasion chips (5) → Outfit card from Closet, missing pieces labeled "you'd need" → Wear this (logs the day) · Swap one · Save. No top + bottom + shoes yet: "I need your shoes to build outfits" with Snap them · Tap the basics you own. No AI.

**I bought something.** Photo or description → item reading (not a check or question; fair use 20/day) → Item card "Rotation 21 → 33 (+12)", Added · Undo · Edit, at most one fit question. Budget is asked here first.

**Add items in Closet.** "+" → Take photo / Choose photos (up to 20) / Describe it (chips, no AI, "not photographed yet") → review → Save → "+N fits" toast, with the duplicate question when needed.

**Paywall paths.** Onboarding, limit card, a Pro feature (full next-buy list, 6th question), Y5. After purchase: "Pro is on" toast, back where he was. The trial-ending push opens Y5, not P1.

**Deleting data.** One photo: L2 (score kept). All photos: Y7, dialog with Cancel default. Facts: Y3 swipe + Undo. Account: Y8 lists what goes, warns "Apple bills your subscription. Cancel it first" with a Manage link, then a destructive dialog, server delete, back to O1.

**Permissions.** Camera: first shutter after consent. Photos: none to pick (PHPicker); **add-only** on the share card's Save. Notifications: S15 or "Remind me tonight". Sign in with Apple: S16, O6, Y9.

---

## 4. Data each screen reads and writes

| Entity | Key fields | Written by | Read by |
|---|---|---|---|
| **Profile** | birthYear, heightCm, build, fitPref, styles[≤3], boldness?, budget?, units, ageBand (derived) | O2, O3, Y2, chat answers | Rubric, S6, Y1 |
| **Fact** | key, value, source (told / fit check / guess), date, messageId, status (active / deleted / declined) | Chat, corrections, Y3 | Question picker, Y3, ideas |
| **Consent** | version, providerName, acceptedAt | O5 | S2 gate, Y7 |
| **ClosetItem** | id, type, colorFamily, pattern, fit/legShape, dressiness, photoLocalId?, photographed (bool), source, confirmedFields[], archived | Auto-add, C4, S11, S8, C5 | C1, C2, Rotation, ideas, S10 |
| **Look** (one fit check) | id, date, occasion, photoLocalId, coverage (full / no shoes / top only), itemIds[], isSaved, recheckOfLookId?, recheckExpiresAt | S5, S9, L2 | S6, L1, L2, calendar, days counter |
| **Reading** | lookId, schemaVersion, model, garments[] with enums + confidence, imageHash | Vision call, shoe snap (replaces footwear/hem) | Scorer, S7 |
| **Score** | lookId, rubricVersion, total, rawTotal, credits[], mistakes[], fixes[] (tier, predictedGain), explanationText | Scorer (on device), text model | S6, S7, P1, S12 |
| **Correction** | lookId, itemId, field, from, to, reason, at | S8, re-check "I did" | Scorer, server log |
| **Move** | id, title, kind, status, doneAt | S14, chat | L3, Y1 |
| **OutfitIdea** | itemIds[], occasion, wornAt?, saved | Ideas engine, Wear this | S1, L1 Saved, calendar |
| **PendingCheck** | photoLocalId, reason (offline / limit / failed / paused), createdAt | S17, S19, G1 | S1 on next foreground |
| **Usage** | day (4 am local), checksUsed, questionsUsed, itemReads, recheckUsed per look | Server quota | Nav subtitle, S17, Y5 |
| **Entitlement** | plan, trialEndsAt, source (RevenueCat) | P1, Y5 | All gates |
| **NotifPrefs** | ideaTime, toggles[3], unopenedIdeaCount | S15, Y6 | Push scheduler |

Photos live only on the phone. The server holds Reading, Score, Fact, Correction and Usage, so a restore brings looks back with "Photo on your old phone" placeholders.

---

## 5. Critique of the current mockups (structure only)

1. **Camera contradicts partial checks.** "Head to shoes in frame", and 3-2-1 fires only once shoes are in the outline, so a small-bathroom mirror user never gets auto-capture. Fire on shoulders + hips steady for 1 s; tip "Shoes in frame if you can"; volume-button shutter in Mirror.
2. **Partial card drops fixes, Why, Not quite right?, Re-check and Share.** Use the standard card with "Finish the check" as a secondary row. With a free fix, Re-check stays primary.
3. **Reading screen.** X is undefined (make it "keep going in background"). 7 occasion chips here vs 5 on ideas, none preselected, so an untapped chip blocks the score. Preselect Everyday.
4. **Basics pre-fills birth year 2005.** A passing default makes the age gate non-neutral (FTC COPPA guidance). Start blank. O4 isn't drawn.
5. **Consent "Not now" goes nowhere**, and it names "Google Gemini" while the provider is open (Gemini requires 18+, `speed-and-detail-plan.md`). Load the provider name from remote config with the consent version.
6. **First result fix "Swap to your white sneakers · From your closet"** is impossible on check one. First-check fixes: adjust tier only, doable in 60 s.
7. **"Added 3 to Closet · Review"** must open a sheet (S11), never switch tabs mid-result.
8. **Limit card promises scoring "as soon as your check resets at 4 am."** v1 has no background job: "when you open Kitted after 4 am." Also say today's re-check still works.
9. **Outfit "Save" has no home** in Lookbook. Add a Saved segment.
10. **"Your first 3 moves" vanishes** once chat scrolls. Pin "Your moves 1 of 3" atop Lookbook and You.
11. **"I've used Kitted before"** is a 12 px ghost button, likely under 44 pt.
12. **Stylist home stacks chips + composer + tab bar**, about a third of the screen at the largest Dynamic Type. One scrolling chip row, hidden while typing.
13. **Paywall "Today: 6.5 → 8.0"** assumes a re-check. Variant: "Today: 6.5, two free fixes to 8.0."
14. **Not drawn yet:** O4, O6, S3, S9 to S11, S14 to S16, S18, S19, C2 to C7, L2, L3, Y2 to Y9, Item card, dialed-in and "not rated" cards.

---

## 6. Top 7 recommendations (ranked)

1. **Nothing between the first result and the re-check.** Paywall, moves and the notification ask wait for a re-check or "Later". The first re-check lasts until 4 am (about 0.4¢), since fixes often mean changing clothes. A dialed-in outfit gets a "next level" move, so every first check has something to re-check. *Activation: the 40% target is the aha (spec §1).*
2. **Make the re-check survive weak fix detection** (67 to 83%, unproven, `INDEX.md`). A flat re-check kills the aha; a targeted re-read plus "I did cuff them" keeps it honest and moving. *Activation and trust: 33 reviews call looks-app scores random (C3).*
3. **Lower the camera bar.** No shoe requirement, mirror shutter, library one tap away, "Not dressed right now? See an example · Remind me tonight". TikTok installs often happen in bed. *Activation.*
4. **Move 1 = "Tap the basics you own."** Pre-filled progress lifts completion 34% vs 19% (C2), and it gives the day-2 idea real material; a 3-item closet repeats the same outfit. Digitizing is the #1 quit risk (+963, C7). *Retention.*
5. **2-page onboarding paywall:** his result and what Pro adds, then price and trial. Multi-page converts 12.4% vs 9.1% (Superwall, C2). X and Continue free on both. *Conversion.*
6. **One PendingCheck object** for offline, limit holds, failures and the kill-switch: nothing counts until scored, one tap resolves it. Bugs and lost progress are top complaints (137 and 36, C3). *Trust, less code.*
7. **Sign in with Apple after check 2, stating the stake:** "Keep your closet and scores if you change phones." Be honest that photos stay on this phone. *Retention.*

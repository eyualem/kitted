# T36 · Design: how he learns Stylist and Closet, three directions

<!-- Leave this comment. Only the session replaces it with the approval line, after the founder's yes in chat. -->

**From:** `plan.md` → T36 · **Replaces:** `specs/setup-and-you.md` → SY2–SY3 (the Got-it tips and Kit's bullet-list hello) · **Research:** `tasks/T36/research.md` · **Frames:** `tasks/T36/design.html` (`preview_start` name `mockups`, then `http://127.0.0.1:8095/tasks/T36/design.html`) · **PNGs:** `tasks/T36/design/01-light.png` … `07-light.png`

This is a direction exploration, not a build design: the founder picks one, then SY2–SY3 get rewritten to match it. Light only.

**Stays in every direction (main today):** setup ends in Stylist with Kit's AI note (`stylist.aiNote`) and the offer card (`offer.*`); the score card with its score, word, fix, `Re-check after fixing` and `Added {n} to Closet`; the optional "Tap the clothes you already own" card after the first check; the empty Closet's `Your closet builds itself.`; Apple's iOS 26 tab bar. No list in chat, no Got-it card, no emoji in any of them.

## A. Show where it went (motion and marks) · the founder's pick (Nov 10)

### A0 · Stylist, setup's end · phone 7 · `design/07-light.png`
- Today's end of setup without any chips. Kit's first bubble says only **NEW** `I'm Kit, your stylist.` (no AI note in this message), then Kit's offer card unchanged: `Want to check a fit now?` / `Stand back so your shoes are in the shot. Not dressed for it? Later works.` / `Check my fit` / `Later`.
- It's drawn last in the file (phone 7) so phones 1–6 keep their numbers; the page shows it right under A.

### A1 · Stylist, the first score card lands · phone 1 · `design/01-light.png`
- His first check (the demo story's 7.5 smart-casual Date check: white tee, tan chinos, white sneakers, beige overshirt), on the quieter card from `specs/explain-rating.md` → "The result card (a first check)": the Going-for line, `7.5 Put together` with the summary `Good base. One easy change sharpens it.`, one fix numbered 1 with no gain (`Wear the overshirt, open` / `Free · it's already in your hand`), `Added 4 to Closet` with `Review`, `Re-check after fixing` (full width), then `Explain rating` (a secondary button under it). Off the card: `Why 7.5?`, `Not quite right?`, the share button and the gain. `2 more fixes` isn't shown (this check has one).
- As the score settles, small copies of the 4 drawings in `Added 4 to Closet` lift off the row and arc into the Closet tab: ~0.6 s, ease-in-out, 40 ms apart, shrinking as they go. One light haptic as they land. The row keeps its own drawings.
- The Closet tab shows a badge `4`, drawn navy (the app's ink) rather than Apple's red. Closet only; Lookbook gets no badge.
- Reduce Motion: no flight, the badge just appears. VoiceOver hears today's `Added to your closet.` (`toast.addedCloset`); iOS reads the badge itself.

### A2 · Closet, his first visit after that check · phone 2 · `design/02-light.png`
- Opening Closet clears its badge. No tab has a badge after that.
- The 4 pieces sit first under the section label **NEW** `From your first check` (today's section label style, with its count `4`), each tile with a small **NEW** `New` mark (ink on white, not copper).
- The marks and the label go after this visit. Everything else is today's Closet: Pieces / Outfits, the add button, a tap opens the piece.

**Words:**
- `I'm Kit, your stylist.` · **NEW** (the founder's, Nov 10: "'I'm Kit. I'm your stylist' is enough"; drawn as one sentence, the way today's note starts).
- `From your first check` · **NEW** · `New` · **NEW**.
- `Good base. One easy change sharpens it.` and `Explain rating` · words from `specs/explain-rating.md` (approved Nov 10), not in en.ts yet.
- Everything else exists in en.ts.

**For him:** he came for his score. Elements added: 1 motion and 1 badge on Stylist, 1 label and 4 marks on Closet. Each one answers "where did my clothes go?" exactly when it happens, with no reading. Nothing extra to tap: the badge goes away when he opens the tab.

**Risks:**
- **Placing the flight on the native tab bar.** The iOS 26 tab bar is drawn by UIKit above the screen (build notes trap), so a view inside the Stylist screen can't draw over it. The flight needs an overlay at the root, above the tabs. React Native can't ask the native bar where its Closet item is, so the landing point is worked out from the bar's width (4 equal items in a floating capsule). That's likely within a few points on every iPhone in portrait, and the fade at the end plus the native badge hide a small miss. It needs a phone check before anyone commits to it. Fallback if it can't be placed well: the badge alone (still clear, just less of a moment).
- The motion has to feel quick, not cute: it has to finish within 0.6 s and must never delay the score or block a tap.
- **The AI note leaves the first message.** `handoff/03-design-system.md` §10 (from `app-build-spec.md`, ruling 17) asks for one AI-disclosure line "in consent and the first message". With A0, the only line left is the agreement's `Kit, your stylist, is an AI.` on the first camera open. The founder's word in chat wins over 03, but this is a written rule he is changing. Log it in DECISIONS-LOG and fix 03 §10 when SY2 is rewritten. If App Review asks, the agreement still says it before any AI call.
- A navy badge is less standard than Apple's red: it reads as calmer and more on-brand, but it's easier to miss. Native tabs may only allow the system color, or a tint for the whole badge. Check what expo-router's native tabs accept before promising navy.

## B. Kit says it once (one Kit line per moment)

### B1 · Stylist, under the first score card · phone 3 · `design/03-light.png`
- A second after the card lands, one Kit bubble under it: **NEW** `Make the fix, then tap Re-check. I'll score it again.`
- Only under his first scored check that has a fix. If he taps Re-check before it posts, it doesn't post.

### B2 · Stylist, where his clothes went · phone 4 · `design/04-light.png`
- The next Kit bubble, grouped with B1 (no second "Kit" label): **NEW** `Your tee, chinos, sneakers and overshirt are in Closet now.`, the 4 piece drawings inside the bubble, and a secondary button **NEW** `See Closet ›` that opens Closet.
- Written by code from his pieces, not by the AI. Closet itself is unchanged.

**Words:**
- B1 · yours: `Do the fix and tap Re-check. I'll score it again.` · mine (drawn): `Make the fix, then tap Re-check. I'll score it again.` Same voice as today's VoiceOver line `Make the fix, then take a new photo.`
- B2 · yours: `Your tee, chinos and sneakers are in Closet now.` · mine (drawn): `Your tee, chinos, sneakers and overshirt are in Closet now.` It names every piece added, since the bubble draws all 4. With 5 or more: `Your {a}, {b} and {n} more are in Closet now.` (**NEW**, mine).
- `See Closet` · **NEW** (yours, kept).

**For him:** he came for his score. Elements added: 2 bubbles, 4 drawings, 1 button. B2 earns its place: it's the only place the Closet link exists. B1 mostly repeats the `Re-check after fixing` button right above it. I'd cut it, or keep it only when the fix is free.

**Risks:**
- **The chat gets long right after the result.** Two bubbles push the score card up and half out of view at the exact moment he wants to look at it (phone 4: the "Going for" row and the top of the card are already gone). One fix: post B2 only once he scrolls or leaves the card, or after his re-check.
- It's still reading. It's the closest of the three to the rejected attempt. It's not a list, but it's two messages explaining the app.
- Both lines stay in the chat history for good (Past chats), so they read oddly a week later.

## C. Tap to try (chips instead of explanation)

### C1 · Stylist, setup's end · phone 5 · `design/05-light.png`
- Today's end of setup: Kit's AI note, then the offer card with `Check my fit` and `Later`.
- Above the closed composer, today's three starter chips, stacked on the right like replies he could send: `How should chinos fit?` · `What should I buy first?` · `Should I tuck in my tee?` (`ask.chip.*`). One tap sends that question to Kit.

### C2 · Stylist, after the first score card · phone 6 · `design/06-light.png`
- His first card just landed. The chips are now about it: `Why a 7.5?` · `What goes with my tan chinos?` (`ask.chip.why`, `ask.chip.goesWith`).
- They hide once he types or sends anything, and come back with the next score.

**Words:** none new.

**For him:** at setup's end he came to check a fit, and C1 adds 3 more things to tap next to the one thing setup asks him to do. After the score (C2), 2 chips, and each one answers a question he's likely to have right then. C2 earns its place; C1 competes with the offer.

**Risks:**
- **Chips crowd the offer card:** not physically (there's room, phone 5), but as a choice. Three questions next to `Check my fit` give him an easy way to skip the first check, which is the step that predicts whether he stays (research: activation). They also spend his daily questions (`{n} questions left today`) before he has checked a fit.
- `Why a 7.5?` (the chip, asks Kit) sits right under the card's `Why 7.5?` (the link, opens the explanation). Two ways to ask the same thing that give different answers. Drop the chip, or make it open the same sheet.
- Today's code makes 3 chips after a check (why, goes-with, one beginner question). The frame shows 2, as asked, so the build would cap it at 2 after a score. Its beginner questions also rotate by day, so the order on phone 5 is one possible day.
- C doesn't teach Closet at all: nothing shows where his pieces went.

## Ranking (a 20-year-old, first time in the app, not into fashion apps)
1. **A, Show where it went.** He reads nothing and still gets it: his clothes visibly go into Closet, and a red badge is something he has seen on every iPhone app. It feels like a polished product, not a tutorial, and the Closet visit pays it off at once. The risk is technical (placing the flight), not a matter of taste, and the fallback (the badge alone) still works.
2. **C, Tap to try.** Chips are familiar from ChatGPT, and `What goes with my tan chinos?` right after his score is exactly the next thing he'd want. But it teaches Stylist's questions, not Closet. And at setup's end it pulls him away from his first check.
3. **B, Kit says it once.** The clearest words of the three, but it's still the app explaining itself in the chat, two bubbles deep, at the moment he wants his score. It's the closest to what the founder rejected.

**Recommended:** A, plus C2's after-score chips (not C1). The first fit check stays the only thing to do at setup's end. The flight shows where his clothes went. The chips give him an easy second move. It adds two words in all (`From your first check`, `New`).

## New parts
- The flight overlay (A1): a root-level animated layer above the native tab bar. Nothing like it exists yet.
- The `New` mark on a closet tile (A2): a small label on `ClosetTile`.
- A Kit bubble with drawings and a button inside (B2): today's bubbles are text only.
- Chips shown with the composer closed (C): today they show only inside the opened composer.

## Hard list (the designer's check)
- **44 pt:** tab items 54 pt; `Check my fit` / `Later` / `Re-check after fixing` are today's. The chips (34 pt) and `See Closet` (36 pt) need a hit area grown to 44 pt in the build. `New` marks and badges aren't tappable.
- **Contrast:** ink and ink-2 on surface and bg, from the tokens. `New` is ink on white. The badge is Apple's own (white on system red, 12 pt semibold, not ours to change).
- **No face or body:** the one photo is today's demo photo with the face blurred; everything else is piece drawings.
- **No emoji, ranks or streaks:** none. `New` marks a piece, not him.
- **Copper:** only the card's `→ 8.0` and today's card links. Nothing new is copper; the badge is system red.
- **A way out:** the tab bar is on every phone; `See Closet` and every chip are optional.
- **Every state:** open questions below (no-fix check, Later, a failed check, Show me around).

## Open questions for the founder
- **Which direction?** Recommended: A with C2's chips. Other: A alone, or C alone.
- **A · Badge color?** Navy (the app's ink) is drawn, the coordinator's default. Other: Apple's standard red.
- **A · Every check, or only the first?** Recommended: the flight and badge on every check that adds pieces (it's just feedback); the `From your first check` label and `New` marks only once. Other: all of it only once.
- **B · B1 at all?** Recommended: cut B1, keep B2. Other: both, as drawn.
- **SY3 "Show me around":** with no tips left to bring back, recommended: remove the row (each direction teaches by doing, again on every check). Other: keep it, replaying direction A's flight on the next check.
- **Not drawn (need a call before the spec):** a first check with no fix (the demo's real 7.5 has none: no Re-check, so B1 never shows); after `Later` (C: the chips stay; A/B: nothing until a check); a failed or refused check (nothing flies, no lines).

## Drawn differently from today, on purpose or by limit
- The demo's real 7.5 card says `No quick fixes for this one.` with no Re-check button. To show a fix, as asked, the frames use the copy deck's example fix (`Wear the overshirt, open` / `Free · it's already in your hand`, `card.example.*`) and, on phones 3–6 only, an illustrative `→ 8.0` (not computed by core). Phone 1 has no gain, per explain-rating.
- The card's `Next level` line is left out to save room; it's unchanged.
- The native tab bar is the mockup's glass capsule, and the badge is an approximation of Apple's.
- Closet's native large-title header is approximated. A "To confirm" card that can appear after a check is not drawn.
- The web preview didn't hold a Closet with pieces (it went back to Welcome), so Closet is drawn from `app/(tabs)/closet/index.tsx` and the mockup.

## Changes
- **Round 2 (Nov 10)** · the founder picked A. His notes: "Are you using old screenshots? It's not supposed to say 'Why 7.5' but instead 'explain score'." And Kit's first message after setup: "'I'm Kit. I'm your stylist' is enough."
  - Phone 1 (A1): the card follows `specs/explain-rating.md` (one number; summary `Good base. One easy change sharpens it.`; the fix has no gain; `Explain rating` under a full-width Re-check; no `Why 7.5?`, `Not quite right?`, share or `→ 8.0`). The flight was moved to start from the summary row's new position. Badge on Closet only, navy.
  - Phone 2 (A2): the Lookbook badge is gone.
  - Phone 7 (A0, new): setup's end with `I'm Kit, your stylist.` and the offer card unchanged, no chips.
  - Phones 3–6 (B, C) unchanged; the ranking stands. B and C still show the old card, from before explain-rating.

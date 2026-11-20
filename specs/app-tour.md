# The app tour

**Approved by the founder:** 2026-11-19 in chat

After this, a new user sees what Closet and Lookbook do before Kit says a word: right after setup the app walks him through the real Closet and Lookbook tabs, filling each with an animated example, then takes him back to Stylist, where Kit says hello and offers the first fit check.

**Part of:** `specs.md` → "First run", F1 (Onboarding). Works with `specs/onboarding-screens.md` (OS5: where setup ends) and `specs/setup-and-you.md` (SY2: Kit's hello, the typing dots, the slide into Closet). This spec owns the tour itself and the moment between About you and Kit's hello; those specs keep everything else.

## Why
The founder (Nov 19): new users won't realize that each rated outfit's pieces get saved into Closet, or that Lookbook keeps every look. "We show them around the app, like we show them around the closet … and then we return them back to the stylist tab. Then Kit gives its first message … but before then, it doesn't."

What was already there (Nov 10, direction A, `tasks/T36/`): the pieces slide into Closet after a check, a navy badge, `From your first check` on the first visit, and the empty states (`Your closet builds itself.`, `Your first look lands here, with its score.`). All of that teaches only after he checks a fit. Someone who taps `Later` (downloaded it outside, not dressed) lands in a chat and never learns that the app remembers his clothes, which is the main reason to come back.

Research (Nov 19, with `tasks/T36/research.md`):
- NN/g tested 70 people on 4 mobile apps with swipe-through tutorials. Those who read them did no better than those who skipped, and rated the tasks harder; the same held for coach marks. https://www.nngroup.com/articles/mobile-tutorials/
- Tours that start on their own are finished far less than short or self-started ones: 1–2 steps 73%, 3–5 steps 38%, auto-started 23% (464 web products, vendor data). https://produktly.com/research/saas-onboarding-benchmarks-2026 · average 33.5%: https://www.chameleon.io/benchmark-report-24
- Apple: onboarding should be "fast, fun, and optional"; prefer "animation or graphics to educate instead of a lengthy description". https://developer.apple.com/design/human-interface-guidelines/onboarding · https://developer.apple.com/design/human-interface-guidelines/offering-help

So the tour doesn't try to teach *how*; it shows *what he gets*, in two short stops on the real tabs, with motion instead of paragraphs, and Skip from the first frame. Options weighed: 3 swipe screens with screenshots (the format NN/g found doesn't help, and screenshots go stale), tips on first open only (mostly built, but misses the `Later` user), coach marks over empty tabs (nothing to see). The founder picked the walk through the real tabs.

## Scope
- **In:** the two tour stops (AT1, AT2); Skip and the end of the tour (AT3); when it shows (AT4); accessibility (AT5); two more drawn example outfits for Lookbook.
- **Out (non-goals):**
  - a Stylist stop or a You stop;
  - any tip, `Got it` card or coach mark outside the tour; any Kit line that explains a feature (SY2 stands);
  - a replay row (`Show me around`) anywhere (Later);
  - a person's photo or a screenshot of the app in the tour;
  - saving, counting or sending anything during the tour;
  - changing Kit's hello, the typing dots, the offer card or their words;
  - TipKit or any new package.
- **For the beta:** all of it.

## AT1. Stop 1: Closet
1. About you's `Continue` (after Apple's age sheet once SY6 is built) saves setup as today, then the app moves to the **Closet** tab. Stylist stays empty behind it: no hello yet.
2. In place of Closet's empty state, the **example closet**: every piece of the three example looks shown on stop 2 (Welcome's outfit and the two others, about 9 pieces), drawn as Closet's tiles in its head-to-toe sections (Tops, Bottoms, Shoes), under a small `Example` tag. They drop into their tiles in quick waves, a few hundredths of a second apart, in about a second in all, with the same feel as the slide into Closet after a real check. (The founder, Nov 19, after the demo: the closet should look full, matching Lookbook's three looks.)
3. The **tour card**, just above the tab bar:
   - `1 of 2`
   - title `Your closet builds itself.`
   - line `Every fit you check adds its pieces here, so Kit can plan outfits from what you own.`
   - buttons `Next` (primary) and `Skip` (a small text button beside it)
4. The card and its buttons work from the first frame; nobody waits on the animation.
5. `Next` → stop 2.

## AT2. Stop 2: Lookbook
1. The app moves to the **Lookbook** tab.
2. In place of Lookbook's empty state, the **example lookbook**: three drawn example looks slide in one after another, newest on top, each as a Lookbook row with its drawing, its score and its word. Welcome's outfit lands last, on top. Under a second in all, under the same `Example` tag.
3. Every score and word comes from the scoring code run on that outfit's bundled reading (as Welcome's card does, OS1). Nothing typed in by hand.
4. The tour card:
   - `2 of 2`
   - title `Every look, saved.`
   - line `Each fit you check lands here with its score and its fix.`
   - buttons `Done` (primary) and `Skip`
5. `Done` → the end (AT3).

## AT3. Skip, and the end of the tour
- `Skip` (either stop) and `Done` do the same thing: the tour closes and the app moves to **Stylist**.
- Then, and only then, SY2's start plays as it does today: Kit's typing dots (about 0.9 s), `I'm Kit, your stylist.`, and a beat later Kit's offer card `Want to check a fit now?` (`Check my fit` / `Later`) with one soft haptic. No word, timing or button of these changes.
- During the tour the tab bar shows but is dimmed and can't be tapped; Closet's `+`, its rows, and Lookbook's rows can't be tapped either. The tour card is the only thing that responds.
- The examples are gone once the tour ends. His real Closet and Lookbook show their own empty states, as today.

## AT4. When it shows
- Once, at the end of a new setup (About you's `Continue` with an 18+ band).
- "Delete all my data" sends him back through setup, so he sees it again then.
- Never on Restore ("I already have an account"): he's used Kitted before.
- Never on a phone that finished setup before this update.
- Never for the under-18 stop.
- Closing the app during the tour counts as seen: he reopens in Stylist, where Kit's hello and offer play as in AT3.
- No replay anywhere.

## AT5. Accessibility
- **VoiceOver:** on each stop, focus moves to the tour card, which reads `Tour, 1 of 2. Your closet builds itself. Every fit you check adds its pieces here, so Kit can plan outfits from what you own.`, then `Next` and `Skip` as buttons (stop 2 the same, with its own words and `Done`). The examples read as one element: `Example closet, {n} pieces` and `Example lookbook, 3 looks`. The dimmed tab bar is hidden from VoiceOver during the tour.
- **Reduce Motion:** no drops, no slides; the examples are already in place, and the tabs change with a plain fade.
- **Largest text:** the card grows and scrolls inside itself if it must; `Next`/`Done` and `Skip` stay on screen, never clipped, no word broken mid-word; the examples sit behind the card.
- Buttons at least 44×44 pt; text at least 4.5:1 in light and dark; the dimmed tab bar doesn't need to pass contrast (it's inactive).

## Rules
- The tour saves nothing: no piece, no look, no fact, no event. It sends nothing anywhere.
- Visiting Closet in the tour is not "opening Closet": it doesn't set `closet.lastOpened`, doesn't clear the badge and doesn't use up `closet.firstVisit`. His first real check still gets the slide, the badge, `From your first check` and the `New` marks (SY2).
- The tour's state is kept on this phone only and cleared by "Delete all my data".

## Data
- **New kv (phone only, not backed up):** `appTour.state`: `pending` (set at setup's end) → `done` (Skip, Done, or the app closing during it). Missing on a phone that finished setup before this update, which means done. Cleared by "Delete all my data".
- **New bundled data:** two more example outfit readings for Lookbook, next to Welcome's (`welcomeExample`). Their drawings and scores come from code, like Welcome's.
- Nothing new on the server.

## Taps to the camera (F1.1)
Get started · the card-1 lesson · 8 cards · up to 3 this-or-thats · Continue · an age · Continue · **Next · Done** · Check my fit · Agree = **20 or fewer** with 3 Me's (19 with Skip).

## Acceptance criteria
**AT1–AT2. The stops**
- AT1.1 A new setup's `Continue` (18+) lands on the Closet tab with the example closet (every piece of the 3 example looks, in Closet's sections, tagged `Example`) and the tour card word for word; Stylist has no Kit message yet.
- AT1.2 The pieces drop in waves, about a second in all; `Next` and `Skip` respond before the animation ends.
- AT2.1 `Next` moves to Lookbook with 3 example looks, newest on top, Welcome's outfit on top, and the tour card word for word.
- AT2.2 Each example look's score and word equal the scoring code's output for its bundled reading, checked by a test (not typed in).

**AT3. Skip and the end**
- AT3.1 `Done` and `Skip` (from either stop) close the tour and land on Stylist; then Kit's typing dots, `I'm Kit, your stylist.` and the offer card play as SY2.12 says, once.
- AT3.2 No Kit message, dot or haptic before the tour ends.
- AT3.3 During the tour, tapping the tab bar, Closet's `+` or any example does nothing.
- AT3.4 After the tour, Closet and Lookbook show his real (empty) tabs; no example piece or look is in the store.

**AT4. When it shows**
- AT4.1 It plays once per new setup; relaunching after it never shows it again.
- AT4.2 Closing the app mid-tour reopens on Stylist with the hello and offer (once), and no tour.
- AT4.3 After "Delete all my data" and setup again, it plays again.
- AT4.4 Restore, the under-18 stop and a phone that finished setup before this update never show it.

**AT5. Accessibility**
- AT5.1 VoiceOver lands on the card and reads it as in AT5; the examples read as one element each; the tab bar isn't reachable.
- AT5.2 Reduce Motion: no drop or slide; the examples show in place; the tabs fade.
- AT5.3 Light, dark and the largest text size: nothing clipped on either stop; the buttons stay on screen.

**Rules**
- AT6.1 After the tour, `closet.lastOpened` and `closet.firstVisit` are as they were before it; his first real check still gets `From your first check` and the `New` marks.
- AT6.2 No request leaves the phone during the tour.
- AT6.3 A fresh install reaches a live camera in 20 taps or fewer with 3 Me's (F1.1), checked by a tap-through flow.

## Touches
- The tour: a new overlay over the tabs, `app/src/app/(tabs)/_layout.tsx` (moving between tabs, dimming the bar), `app/src/features/onboarding/` (`complete.ts` sets `appTour.state`; a new tour module and card; the example readings beside `welcomeExample.ts`), `app/src/features/stylist` (the hello waits for the tour; one condition), `privacy/wipe.ts` (the kv key), `en.ts`, an e2e flow.
- Borrowed: `app/src/app/(tabs)/closet/index.tsx` and `lookbook/index.tsx` (showing the example in place of the empty state), `features/closet/arrivals.ts` (the tour doesn't count as opening Closet).

## Assumptions
- The card shows `1 of 2` / `2 of 2`.
- Closing the app mid-tour counts as seen.
- The two new example outfits are neutral everyday outfits, picked in the design frames the founder approves.

## Later
- A `Show me around` row in You → Help & about that replays the two stops.
- Two analytics events once PostHog is built (tour finished; tour skipped at stop n), and compare first-check and second-check rates.
